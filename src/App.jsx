import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { carDatabase } from './data'
import Header from './components/Header'
import Footer from './components/Footer'
import ProductCard from './components/ProductCard'
import AddProductForm from './components/AddProductForm'
import Login from './components/Login' // استيراد صفحة الدخول

function App() {
  const [allProducts, setAllProducts] = useState([]); 
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  // نظام المستخدم (جديد)
  const [session, setSession] = useState(null); // هل هناك مستخدم مسجل؟
  const [showLogin, setShowLogin] = useState(false); // هل نعرض نافذة الدخول؟
  const [showAdminPanel, setShowAdminPanel] = useState(false); // هل نعرض لوحة الإضافة؟

  useEffect(() => {
    // 1. جلب المنتجات
   // 1. جلب المنتجات
    const fetchProducts = async () => {
      // 🛑 أوقفنا الاتصال بـ supabase مؤقتاً
      // const { data } = await supabase.from('products').select('*');
      
      // ✅ سنستخدم البيانات المحلية حالياً
      setAllProducts(carDatabase); 
    };
    fetchProducts();

    // 2. التحقق: هل المستخدم مسجل دخول مسبقاً؟
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 3. مراقبة حالة الدخول (إذا سجل دخول أو خروج تتحدث الصفحة فوراً)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // دوال تسجيل الخروج
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowAdminPanel(false); // إغلاق اللوحة عند الخروج
  };

  // منطق الفلترة (كما هو)
  const uniqueBrands = [...new Set(allProducts.map(item => item.brand))];
  const availableModels = [...new Set(allProducts.filter(item => item.brand === selectedBrand).map(item => item.model))];
  const availableYears = [...new Set(allProducts.filter(item => item.brand === selectedBrand && item.model === selectedModel).map(item => item.year))];
  const displayedProducts = allProducts.filter(item => item.brand === selectedBrand && item.model === selectedModel && item.year === selectedYear);

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col">
      <Header />

      {/* شريط التحكم العلوي */}
      <div className="container mx-auto p-4 flex justify-between items-center bg-gray-800 rounded-b-lg mb-6">
        <span className="text-sm text-gray-400">
          {session ? `مرحباً، المدير (${session.user.email}) 👨‍✈️` : "مرحباً أيها الزائر 👋"}
        </span>

        <div>
          {session ? (
            // إذا كان مسجلاً للدخول: زر الخروج + زر اللوحة
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="bg-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                {showAdminPanel ? "إخفاء اللوحة" : "إضافة منتج جديد ➕"}
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                خروج 🚪
              </button>
            </div>
          ) : (
            // إذا كان زائراً: زر الدخول فقط
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-600 border border-gray-600"
            >
              تسجيل دخول المدير 🔐
            </button>
          )}
        </div>
      </div>

      {/* نافذة الدخول (تظهر فقط عند الضغط) */}
      {showLogin && !session && <Login />}

      {/* لوحة الإضافة (تظهر للمدير فقط) */}
      {session && showAdminPanel && (
        <div className="container mx-auto px-8">
          <AddProductForm />
        </div>
      )}

      <main className="p-8 flex-grow container mx-auto">
        {/* ... (نفس كود البحث والقوائم القديم تماماً - لم يتغير) ... */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🔍 نظام البحث عن المنتجات</h2>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">الشركة المصنعة</label>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(""); setSelectedYear(""); }}>
              <option value="">-- اختر الشركة --</option>
              {uniqueBrands.map((brand, index) => <option key={index} value={brand}>{brand}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">نوع السيارة (الموديل)</label>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              value={selectedModel} onChange={(e) => { setSelectedModel(e.target.value); setSelectedYear(""); }} disabled={!selectedBrand}>
              <option value="">-- اختر الموديل --</option>
              {availableModels.map((model, index) => <option key={index} value={model}>{model}</option>)}
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">سنة الصنع (الجيل)</label>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!selectedModel}>
              <option value="">-- اختر السنة --</option>
              {availableYears.map((year, index) => <option key={index} value={year}>{year}</option>)}
            </select>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={!selectedYear}>
            {displayedProducts.length > 0 ? `وجدنا ${displayedProducts.length} منتجات` : "الرجاء اختيار المواصفات"}
          </button>
        </div>

        {/* عرض النتائج */}
        {displayedProducts.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-2">نتائج البحث ({displayedProducts.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isAdmin={session} // 👈 نمرر معلومة "هل هو مدير" للكرت
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App