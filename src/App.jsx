import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import ProductCard from './components/ProductCard'
import AddProductForm from './components/AddProductForm'

function App() {
  // --- مخازن البيانات ---
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);

  // --- خيارات المستخدم ---
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);

  // --- الصلاحيات ---
  const [userRole, setUserRole] = useState('guest'); 
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // 1️⃣ جلب الشركات (مرة واحدة عند التحميل)
  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase.from('brands').select('*');
      if (!error) setBrands(data);
    };
    fetchBrands();
  }, []);

  // 2️⃣ جلب الموديلات (فقط عندما تتغير الشركة المختارة)
  useEffect(() => {
    if (!selectedBrandId) return; // لا تفعل شيئاً إذا لم يتم اختيار شركة

    const fetchModels = async () => {
      const { data } = await supabase
        .from('car_models')
        .select('*')
        .eq('brand_id', selectedBrandId);
      setModels(data || []);
    };
    fetchModels();
  }, [selectedBrandId]);

  // 3️⃣ جلب السنوات (فقط عندما يتغير الموديل المختار)
  useEffect(() => {
    if (!selectedModelId) return;

    const fetchYears = async () => {
      const { data } = await supabase
        .from('car_generations')
        .select('start_year, end_year')
        .eq('car_model_id', selectedModelId);

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

  // 4️⃣ جلب المنتجات (عند اكتمال الاختيارات)
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

          // جلب الإطارات
          const { data: frames } = await supabase
            .from('frames')
            .select('*')
            .eq('generation_id', generationId);

          const supportedSizeIds = frames ? frames.map(f => f.size_id) : [];

          // جلب الشاشات
          let screensQuery = supabase.from('screens').select('*');
          
          if (supportedSizeIds.length > 0) {
            screensQuery = screensQuery.or(`size_id.in.(${supportedSizeIds}),generation_id.eq.${generationId}`);
          } else {
             screensQuery = screensQuery.eq('generation_id', generationId);
          }

          const { data: screens } = await screensQuery;

          const allItems = [
            ...(frames || []).map(f => ({ ...f, type: 'إطار/ديكور 🖼️' })),
            ...(screens || []).map(s => ({ ...s, type: 'شاشة إلكترونية 📺' }))
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


  // --- دوال التحكم في الأحداث (هنا الحل الصحيح لتجنب الأخطاء) ---
  
  // عند تغيير الشركة: نصفر الموديلات والسنوات والمنتجات
  const handleBrandChange = (e) => {
    const newBrandId = e.target.value;
    setSelectedBrandId(newBrandId);
    
    // تصفير البيانات اللاحقة يدوياً هنا بدلاً من useEffect
    setModels([]); 
    setSelectedModelId("");
    setAvailableYears([]);
    setSelectedYear("");
    setDisplayedProducts([]);
  };

  // عند تغيير الموديل: نصفر السنوات والمنتجات
  const handleModelChange = (e) => {
    const newModelId = e.target.value;
    setSelectedModelId(newModelId);

    // تصفير البيانات اللاحقة
    setAvailableYears([]);
    setSelectedYear("");
    setDisplayedProducts([]);
  };

  const loginAsAdmin = () => { setUserRole('admin'); setShowAdminPanel(true); };
  const loginAsSupervisor = () => { setUserRole('supervisor'); setShowAdminPanel(true); };
  const logout = () => { setUserRole('guest'); setShowAdminPanel(false); };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col dir-rtl">
      <Header />

      <div className="bg-yellow-600 p-2 text-center text-black font-bold">
        🛠️ متصل بقاعدة البيانات الحقيقية:
        <div className="mt-2 flex justify-center gap-4">
            <button onClick={loginAsAdmin} className={`px-3 py-1 rounded border-2 border-black ${userRole === 'admin' ? 'bg-white' : 'bg-yellow-400'}`}>👨‍✈️ مدير</button>
            <button onClick={loginAsSupervisor} className={`px-3 py-1 rounded border-2 border-black ${userRole === 'supervisor' ? 'bg-white' : 'bg-yellow-400'}`}>👷 مشرف</button>
            <button onClick={logout} className={`px-3 py-1 rounded border-2 border-black ${userRole === 'guest' ? 'bg-white' : 'bg-yellow-400'}`}>👤 زائر</button>
        </div>
      </div>

      {userRole !== 'guest' && (
        <div className="container mx-auto p-4 bg-gray-800 flex justify-between items-center mb-4">
            <span>أهلاً {userRole}</span>
            <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="bg-blue-600 px-4 py-2 rounded text-sm"
            >
                {showAdminPanel ? "إخفاء اللوحة" : "إضافة منتج جديد ➕"}
            </button>
        </div>
      )}

      {showAdminPanel && userRole !== 'guest' && (
          <div className="container mx-auto px-8 mb-8 border-b border-gray-700 pb-8">
             <AddProductForm />
          </div>
      )}

      <main className="p-8 flex-grow container mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🔍 بحث عن سيارتك</h2>
          <div className="space-y-4">
            
            {/* 1. الشركة */}
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              value={selectedBrandId} 
              onChange={handleBrandChange} // ✅ استخدمنا الدالة الجديدة
            >
              <option value="">-- اختر الشركة --</option>
              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
            
            {/* 2. الموديل */}
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50"
              value={selectedModelId} 
              onChange={handleModelChange} // ✅ استخدمنا الدالة الجديدة
              disabled={!selectedBrandId}
            >
              <option value="">-- اختر الموديل --</option>
              {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
            </select>

            {/* 3. السنة */}
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50"
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)} 
              disabled={!selectedModelId}
            >
              <option value="">-- اختر السنة --</option>
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             <p className="text-center text-white col-span-3">جاري البحث في المستودع... ⏳</p>
          ) : displayedProducts.length > 0 ? (
            displayedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                userRole={userRole} 
              />
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-500 mt-10">
              {selectedYear ? "لا توجد منتجات مطابقة لهذا الموديل حالياً" : "الرجاء اختيار سيارة لعرض المنتجات"}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App