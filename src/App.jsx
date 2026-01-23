import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import ProductCard from './components/ProductCard'
import AddProductForm from './components/AddProductForm'
import EditProductModal from './components/EditProductModal';
import Login from './components/Login'; // 🆕 استيراد صفحة الدخول

function App() {
  
  // --- البيانات ---
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  
  // --- التحكم والتعديل ---
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 🆕 نظام الدخول الحقيقي (Auth) ---
  const [session, setSession] = useState(null); // هل المستخدم مسجل دخول؟
  const [showLoginModal, setShowLoginModal] = useState(false); // هل نافذة الدخول مفتوحة؟
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // 1️⃣ مراقبة حالة الدخول (The Session Monitor)
  useEffect(() => {
    // التحقق عند فتح الموقع
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // الاستماع للتغييرات (دخول/خروج)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowLoginModal(false); // إغلاق نافذة الدخول تلقائياً عند النجاح
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // جلب البيانات الأولية
  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase.from('brands').select('*');
      if (!error) setBrands(data);
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrandId) return;
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', selectedBrandId);
      setModels(data || []);
    };
    fetchModels();
  }, [selectedBrandId]);

  useEffect(() => {
    if (!selectedModelId) return;
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
  }, [selectedModelId]);

  useEffect(() => {
    if (!selectedYear || !selectedModelId) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data: genData } = await supabase
          .from('car_generations')
          .select('id')
          .eq('car_model_id', selectedModelId)
          .lte('start_year', selectedYear)
          .gte('end_year', selectedYear)
          .single();

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
  }, [selectedYear, selectedModelId]);

  // --- دوال التحكم ---
  const handleDeleteProduct = async (productId, tableName) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا المنتج نهائياً من قاعدة البيانات؟")) return;

    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', productId);

    if (error) {
        alert("حدث خطأ أثناء الحذف: " + error.message);
    } else {
        setDisplayedProducts(prev => prev.filter(item => item.id !== productId || item.table !== tableName));
        alert("تم الحذف بنجاح 🗑️");
    }
  };

  const handleProductUpdate = (updatedProduct) => {
    setDisplayedProducts(prevProducts => 
        prevProducts.map(p => 
            (p.id === updatedProduct.id && p.table === updatedProduct.table) 
            ? updatedProduct 
            : p
        )
    );
  };

  const handleBrandChange = (e) => {
    const newBrandId = e.target.value;
    setSelectedBrandId(newBrandId);
    setModels([]); 
    setSelectedModelId("");
    setAvailableYears([]);
    setSelectedYear("");
    setDisplayedProducts([]);
  };

  const handleModelChange = (e) => {
    const newModelId = e.target.value;
    setSelectedModelId(newModelId);
    setAvailableYears([]);
    setSelectedYear("");
    setDisplayedProducts([]);
  };

  // 🆕 دالة تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowAdminPanel(false);
  };

  // تحديد هل المستخدم الحالي "أدمن"
  const isAdmin = session !== null; 

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col dir-rtl">
      <Header />
      
      {/* 🆕 شريط حالة المستخدم (بديل الأزرار الصفراء) */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex justify-between items-center px-4 shadow-md">
         <span className="text-gray-400 text-sm">
            {session ? `👤 مسجل دخول: ${session.user.email}` : '👤 وضع الزائر'}
         </span>
         
         <div>
             {session ? (
                 <button onClick={handleLogout} className="text-red-400 text-sm hover:text-red-300 font-bold underline transition">
                     تسجيل خروج ⬅️
                 </button>
             ) : (
                 <button onClick={() => setShowLoginModal(true)} className="text-blue-400 text-sm hover:text-blue-300 font-bold underline transition">
                     دخول الإدارة 🔐
                 </button>
             )}
         </div>
      </div>

      {/* زر لوحة التحكم (يظهر فقط للمدير) */}
      {isAdmin && (
        <div className="container mx-auto p-4 bg-gray-800 flex justify-between items-center mb-4 mt-4 rounded border border-blue-900 shadow-sm">
            <span className="text-blue-300 font-bold">🛠️ لوحة التحكم</span>
            <button onClick={() => setShowAdminPanel(!showAdminPanel)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm transition">
                {showAdminPanel ? "إخفاء اللوحة" : "إضافة منتج جديد ➕"}
            </button>
        </div>
      )}

      {showAdminPanel && isAdmin && (
          <div className="container mx-auto px-8 mb-8 border-b border-gray-700 pb-8">
             <AddProductForm />
          </div>
      )}

      <main className="p-8 flex-grow container mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🔍 بحث عن سيارتك</h2>
          <div className="space-y-4">
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" value={selectedBrandId} onChange={handleBrandChange}>
              <option value="">-- اختر الشركة --</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50" value={selectedModelId} onChange={handleModelChange} disabled={!selectedBrandId}>
              <option value="">-- اختر الموديل --</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!selectedModelId}>
              <option value="">-- اختر السنة --</option>
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <p className="text-center text-white col-span-3">جاري البحث... ⏳</p>
          ) : displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <ProductCard 
                key={`${product.table}-${product.id}`}
                product={product} 
                // نمرر الدور بناء على الجلسة الحقيقية
                userRole={isAdmin ? 'admin' : 'guest'} 
                onDelete={handleDeleteProduct}
                onEdit={setEditingProduct} 
              />
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500 mt-10">
              {selectedYear ? "لا توجد منتجات مطابقة لهذا الموديل حالياً" : "الرجاء اختيار سيارة لعرض المنتجات"}
            </div>
          )}
        </div>
      </main>

      {/* 🆕 نافذة تسجيل الدخول */}
      {showLoginModal && (
          <>
            {/* خلفية تغلق النافذة عند الضغط عليها */}
            <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setShowLoginModal(false)}></div>
            <div className="z-50 relative pointer-events-auto">
                 {/* نمرر دالة الإغلاق لزر الإلغاء */}
                 <Login onClose={() => setShowLoginModal(false)} />
            </div>
          </>
      )}

      {/* نافذة التعديل المنبثقة */}
      {editingProduct && (
        <EditProductModal 
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onUpdate={handleProductUpdate}
        />
      )}

      <Footer />
    </div>
  )
}

export default App