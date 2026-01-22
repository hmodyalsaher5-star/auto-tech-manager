import { useState, useEffect } from 'react'
import { carDatabase } from './data/data'
import Header from './components/Header'
import Footer from './components/Footer'
import ProductCard from './components/ProductCard'
import AddProductForm from './components/AddProductForm'

function App() {
  const [allProducts, setAllProducts] = useState([]); 
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  // نظام الصلاحيات
  const [userRole, setUserRole] = useState('guest'); 
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ✅ الإصلاح هنا: التأكد من أن دالة التحديث داخل useEffect فقط
  // تعديل useEffect ليكون آمناً جداً
  useEffect(() => {
    console.log("Loading data...");
    
    // نستخدم setTimeout لنؤخر العملية قليلاً (أجزاء من الثانية)
    // هذا يكسر "الحلقة" ويسمح للموقع بالعمل
    const timer = setTimeout(() => {
      setAllProducts(carDatabase);
    }, 100);

    // تنظيف المؤقت (إجراء روتيني)
    return () => clearTimeout(timer);
  }, []);

  // دوال الصلاحيات
  const loginAsAdmin = () => { setUserRole('admin'); setShowAdminPanel(true); };
  const loginAsSupervisor = () => { setUserRole('supervisor'); setShowAdminPanel(true); };
  const logout = () => { setUserRole('guest'); setShowAdminPanel(false); };

  // منطق الفلترة
  const uniqueBrands = [...new Set(allProducts.map(item => item.brand))];
  const availableModels = [...new Set(allProducts.filter(item => item.brand === selectedBrand).map(item => item.model))];
  const availableYears = [...new Set(allProducts.filter(item => item.brand === selectedBrand && item.model === selectedModel).map(item => item.year))];
  const displayedProducts = allProducts.filter(item => item.brand === selectedBrand && item.model === selectedModel && item.year === selectedYear);

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col dir-rtl">
      <Header />

      {/* شريط الأدوار */}
      <div className="bg-yellow-600 p-2 text-center text-black font-bold">
        🛠️ وضع المطور:
        <div className="mt-2 flex justify-center gap-4">
            <button onClick={loginAsAdmin} className={`px-3 py-1 rounded border-2 border-black ${userRole === 'admin' ? 'bg-white' : 'bg-yellow-400'}`}>👨‍✈️ مدير</button>
            <button onClick={loginAsSupervisor} className={`px-3 py-1 rounded border-2 border-black ${userRole === 'supervisor' ? 'bg-white' : 'bg-yellow-400'}`}>👷 مشرف</button>
            <button onClick={logout} className={`px-3 py-1 rounded border-2 border-black ${userRole === 'guest' ? 'bg-white' : 'bg-yellow-400'}`}>👤 زائر</button>
        </div>
      </div>

      {/* شريط التحكم العلوي */}
      {userRole !== 'guest' && (
        <div className="container mx-auto p-4 bg-gray-800 flex justify-between items-center mb-4">
            <span>أهلاً {userRole}</span>
            <button 
                // هنا نستخدم المتغير showAdminPanel لنحل مشكلة التنبيه
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="bg-blue-600 px-4 py-2 rounded text-sm"
            >
                {showAdminPanel ? "إخفاء اللوحة" : "إظهار اللوحة"}
            </button>
        </div>
      )}

      {/* لوحة الإضافة: هنا الاستخدام الفعلي للمتغير */}
      {showAdminPanel && userRole !== 'guest' && (
          <div className="container mx-auto px-8 mb-8 border-b border-gray-700 pb-8">
             <AddProductForm />
          </div>
      )}

      <main className="p-8 flex-grow container mx-auto">
        {/* البحث */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-400">🔍 بحث</h2>
          <div className="space-y-4">
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
              value={selectedBrand} onChange={(e) => { setSelectedBrand(e.target.value); setSelectedModel(""); setSelectedYear(""); }}>
              <option value="">-- اختر الشركة --</option>
              {uniqueBrands.map((b, i) => <option key={i} value={b}>{b}</option>)}
            </select>
            
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50"
              value={selectedModel} onChange={(e) => { setSelectedModel(e.target.value); setSelectedYear(""); }} disabled={!selectedBrand}>
              <option value="">-- اختر الموديل --</option>
              {availableModels.map((m, i) => <option key={i} value={m}>{m}</option>)}
            </select>

            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50"
              value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!selectedModel}>
              <option value="">-- اختر السنة --</option>
              {availableYears.map((y, i) => <option key={i} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* النتائج */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              userRole={userRole} 
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App