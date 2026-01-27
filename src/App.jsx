import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import ProductCard from './components/ProductCard'
import AddProductForm from './components/AddProductForm'
import EditProductModal from './components/EditProductModal';
import Login from './components/Login';
import UserManagement from './components/UserManagement'; 
import MasterDataManagement from './components/MasterDataManagement'; 
// استيراد مكون المخزن
import WarehouseManagement from './components/Warehouse/WarehouseManagement';

function App() {
  
  // --- 🔐 نظام الحماية والأدوار ---
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);

  // --- لوحات التحكم (للمدير) ---
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showMasterDataPanel, setShowMasterDataPanel] = useState(false); 
  const [showWarehousePanel, setShowWarehousePanel] = useState(false); 

  // --- البيانات ---
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);

  // 1️⃣ التحقق من المستخدم وتحديد الصلاحية
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('email', session.user.email)
          .single();

        if (roleData) {
          setUserRole(roleData.role);
        } else {
          setUserRole('viewer');
        }
      }
      setAuthLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
          setUserRole(null);
      } else {
          checkUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- جلب البيانات (للمدير والزوار فقط) ---
  useEffect(() => {
    // نمنع جلب بيانات السيارات لموظفي المخزن لتخفيف الحمل
    if (session && userRole !== 'warehouse_worker' && userRole !== 'warehouse_supervisor') {
        const fetchBrands = async () => {
        const { data, error } = await supabase.from('brands').select('*');
        if (!error) setBrands(data);
        };
        fetchBrands();
    }
  }, [session, userRole, showMasterDataPanel]);

  // ... (بقية دوال جلب الموديلات والسنوات والمنتجات تبقى كما هي، لكن لن تعمل لموظف المخزن لأنه لن يختار شركة) ...
  // سأختصر الكود هنا، انسخ دوال useEffect و handlers من الكود السابق وضعها هنا (handleBrandChange, etc.)
  // ...
  // ... لتوفير المساحة، افترض أن دوال fetchModels, fetchYears, fetchProducts, delete, update موجودة هنا كما في السابق تماماً
  
  useEffect(() => {
    if (!selectedBrandId || !session) return;
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', selectedBrandId);
      setModels(data || []);
    };
    fetchModels();
  }, [selectedBrandId, session, showMasterDataPanel]);

  useEffect(() => {
    if (!selectedModelId || !session) return;
    const fetchYears = async () => {
      const { data } = await supabase.from('car_generations').select('start_year, end_year').eq('car_model_id', selectedModelId);
      if (data) {
        let yearsSet = new Set();
        data.forEach(gen => {
          for (let y = gen.start_year; y <= gen.end_year; y++) yearsSet.add(y);
        });
        setAvailableYears([...yearsSet].sort((a, b) => b - a));
      }
    };
    fetchYears();
  }, [selectedModelId, session, showMasterDataPanel]);

  useEffect(() => {
    if (!selectedYear || !selectedModelId || !session) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data: genData } = await supabase.from('car_generations').select('id').eq('car_model_id', selectedModelId).lte('start_year', selectedYear).gte('end_year', selectedYear).single();
        if (genData) {
          const generationId = genData.id;
          const { data: frames } = await supabase.from('frames').select('*').eq('generation_id', generationId);
          const supportedSizeIds = frames ? frames.map(f => f.size_id) : [];
          let screensQuery = supabase.from('screens').select('*');
          if (supportedSizeIds.length > 0) {
            screensQuery = screensQuery.or(`size_id.in.(${supportedSizeIds}),generation_id.eq.${generationId}`);
          } else {
             screensQuery = screensQuery.eq('generation_id', generationId);
          }
          const { data: screens } = await screensQuery;
          const allItems = [
            ...(frames || []).map(f => ({ ...f, type: 'إطار/ديكور 🖼️', table: 'frames' })),
            ...(screens || []).map(s => ({ ...s, type: 'شاشة إلكترونية 📺', table: 'screens' }))
          ];
          setDisplayedProducts(allItems);
        } else {
          setDisplayedProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [selectedYear, selectedModelId, session]);

  const handleDeleteProduct = async (productId, tableName) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا المنتج نهائياً؟")) return;
    const { error } = await supabase.from(tableName).delete().eq('id', productId);
    if (error) { alert("حدث خطأ أثناء الحذف: " + error.message); } else {
        setDisplayedProducts(prev => prev.filter(item => item.id !== productId || item.table !== tableName));
        alert("تم الحذف بنجاح 🗑️");
    }
  };

  const handleProductUpdate = (updatedProduct) => {
    setDisplayedProducts(prevProducts => prevProducts.map(p => (p.id === updatedProduct.id && p.table === updatedProduct.table) ? updatedProduct : p));
  };

  const handleBrandChange = (e) => { setSelectedBrandId(e.target.value); setModels([]); setSelectedModelId(""); setAvailableYears([]); setSelectedYear(""); setDisplayedProducts([]); };
  const handleModelChange = (e) => { setSelectedModelId(e.target.value); setAvailableYears([]); setSelectedYear(""); setDisplayedProducts([]); };
  const handleLogout = async () => { await supabase.auth.signOut(); };


  // 🔒🔒🔒 منطقة الحماية والتحميل 🔒🔒🔒

  if (authLoading) {
    return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">جاري التحقق من الصلاحيات... 🔐</div>;
  }

  if (!session) {
      return (
          <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center p-4">
               <h1 className="text-4xl font-bold text-yellow-500 mb-2">نظام إدارة المخزون 🚗</h1>
               <div className="w-full max-w-md bg-gray-800 p-1 rounded-lg shadow-2xl">
                   <Login onClose={() => {}} /> 
               </div>
          </div>
      );
  }

  // 🚀🚀🚀 توجيه الموظفين (Special Views) 🚀🚀🚀

  // 1. عرض خاص لموظف المخزن ومشرف المخزن (يعزلهم عن باقي الموقع)
  if (userRole === 'warehouse_worker' || userRole === 'warehouse_supervisor') {
      return (
          <div className="min-h-screen bg-gray-900 dir-rtl text-right">
              {/* هيدر بسيط خاص بالمخزن فقط */}
              <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center shadow-lg">
                  <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${userRole === 'warehouse_supervisor' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                      <div>
                          <h1 className="text-xl font-bold text-white">🏭 بوابة المخزون</h1>
                          <span className="text-xs text-gray-400 block">{session.user.email} ({userRole === 'warehouse_supervisor' ? 'مشرف' : 'موظف'})</span>
                      </div>
                  </div>
                  <button onClick={handleLogout} className="bg-red-900/50 hover:bg-red-900 text-red-200 px-4 py-2 rounded border border-red-800 text-sm font-bold transition">
                      تسجيل خروج ⬅️
                  </button>
              </div>

              {/* تحميل نظام المخزن مباشرة */}
              <div className="p-4">
                  {/* نمرر الصلاحية للمكون ليقرر ماذا يعرض */}
                  <WarehouseManagement userRole={userRole} />
              </div>
          </div>
      );
  }

  // 🔓🔓🔓 التطبيق الرئيسي (للمدير والزوار) 🔓🔓🔓

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col dir-rtl">
      <Header />
      
      {/* شريط معلومات الموظف */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center px-6 shadow-md">
         <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${userRole === 'admin' ? 'bg-red-500' : userRole === 'supervisor' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <div>
                 <p className="text-sm font-bold text-white">{session.user.email}</p>
                 <p className="text-xs text-gray-400">الصلاحية: <span className="uppercase font-bold text-blue-300">{userRole}</span></p>
            </div>
         </div>
         <button onClick={handleLogout} className="text-red-400 text-sm hover:text-red-300 font-bold underline transition">
             تسجيل خروج ⬅️
         </button>
      </div>

      {/* منطقة أزرار التحكم للمدير */}
      {(userRole === 'admin' || userRole === 'supervisor') && (
        <div className="container mx-auto p-4 mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onClick={() => { setShowAdminPanel(!showAdminPanel); setShowUserPanel(false); setShowMasterDataPanel(false); setShowWarehousePanel(false); }} className={`p-3 rounded text-center font-bold border transition ${showAdminPanel ? 'bg-blue-800 border-blue-500' : 'bg-blue-900 border-blue-800 hover:bg-blue-800'}`}>{showAdminPanel ? "إخفاء المنتجات ⬆️" : "إضافة منتجات 📦"}</button>
            <button onClick={() => { setShowWarehousePanel(!showWarehousePanel); setShowAdminPanel(false); setShowUserPanel(false); setShowMasterDataPanel(false); }} className={`p-3 rounded text-center font-bold border transition ${showWarehousePanel ? 'bg-orange-800 border-orange-500' : 'bg-orange-900 border-orange-800 hover:bg-orange-800'}`}>{showWarehousePanel ? "إخفاء المخزن ⬆️" : "إدارة المخزون 🏭"}</button>
            {userRole === 'admin' && (<button onClick={() => { setShowMasterDataPanel(!showMasterDataPanel); setShowAdminPanel(false); setShowUserPanel(false); setShowWarehousePanel(false); }} className={`p-3 rounded text-center font-bold border transition ${showMasterDataPanel ? 'bg-green-800 border-green-500' : 'bg-green-900 border-green-800 hover:bg-green-800'}`}>{showMasterDataPanel ? "إخفاء السيارات ⬆️" : "تعريف السيارات 🚗"}</button>)}
            {userRole === 'admin' && (<button onClick={() => { setShowUserPanel(!showUserPanel); setShowAdminPanel(false); setShowMasterDataPanel(false); setShowWarehousePanel(false); }} className={`p-3 rounded text-center font-bold border transition ${showUserPanel ? 'bg-purple-800 border-purple-500' : 'bg-purple-900 border-purple-800 hover:bg-purple-800'}`}>{showUserPanel ? "إخفاء الموظفين ⬆️" : "الموظفين 👥"}</button>)}
        </div>
      )}

      {/* عرض اللوحات المختلفة */}
      {showAdminPanel && (userRole === 'admin' || userRole === 'supervisor') && (<div className="container mx-auto px-8 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><AddProductForm /></div>)}
      {/* تمرير userRole للمخزن ليتمتع المدير بكامل الصلاحيات */}
      {showWarehousePanel && (userRole === 'admin' || userRole === 'supervisor') && (<div className="container mx-auto px-2 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><WarehouseManagement userRole={userRole} /></div>)}
      {showMasterDataPanel && userRole === 'admin' && (<div className="container mx-auto px-8 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><MasterDataManagement /></div>)}
      {showUserPanel && userRole === 'admin' && (<div className="container mx-auto px-8 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><UserManagement /></div>)}

      <main className="p-8 flex-grow container mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🔍 بحث في المستودع</h2>
          <div className="space-y-4">
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" value={selectedBrandId} onChange={handleBrandChange}><option value="">-- اختر الشركة --</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50" value={selectedModelId} onChange={handleModelChange} disabled={!selectedBrandId}><option value="">-- اختر الموديل --</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!selectedModelId}><option value="">-- اختر السنة --</option>{availableYears.map((y) => <option key={y} value={y}>{y}</option>)}</select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (<p className="text-center text-white col-span-3">جاري البحث... ⏳</p>) : displayedProducts.length > 0 ? (displayedProducts.map((product) => (<ProductCard key={`${product.table}-${product.id}`} product={product} userRole={userRole} onDelete={handleDeleteProduct} onEdit={setEditingProduct} />))) : (<div className="col-span-3 text-center text-gray-500 mt-10">{selectedYear ? "لا توجد منتجات مطابقة لهذا الموديل حالياً" : "الرجاء اختيار سيارة لعرض المنتجات"}</div>)}
        </div>
      </main>

      {editingProduct && (<EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={handleProductUpdate}/>)}

      <Footer />
    </div>
  )
}

export default App