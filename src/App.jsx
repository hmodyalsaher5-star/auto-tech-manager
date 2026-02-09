import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import Login from './components/Login';

// استيراد المكونات
import AddProductForm from './components/AddProductForm'
import UserManagement from './components/UserManagement'; 
import MasterDataManagement from './components/MasterDataManagement'; 
import WarehouseManagement from './components/Warehouse/WarehouseManagement';
import ProductCatalog from './components/ProductCatalog';
import ProductSearch from './components/ProductSearch'; // مكون البحث

// ملفات المبيعات والحسابات
import AccountsDashboard from './components/Sales/AccountsDashboard'; 
import TechnicianPayout from './components/Sales/TechnicianPayout';
import DailyReport from './components/Sales/DailyReport';
import CashierConfirmation from './components/Sales/CashierConfirmation'; 
import SalesEntry from './components/Sales/SalesEntry';
import AdminReview from './components/Sales/AdminReview';

function App() {
  
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  
  const [sizes, setSizes] = useState([]); 

  // لوحات التحكم
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showMasterDataPanel, setShowMasterDataPanel] = useState(false); 
  const [showWarehousePanel, setShowWarehousePanel] = useState(false); 
  const [showCatalogPanel, setShowCatalogPanel] = useState(false);
  
  const [showAccountsDashboard, setShowAccountsDashboard] = useState(false);
  const [showTechnicianPayout, setShowTechnicianPayout] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showAdminReview, setShowAdminReview] = useState(false);
  const [showCashierPanel, setShowCashierPanel] = useState(false);
  const [showSalesEntry, setShowSalesEntry] = useState(false);
  
  // ✅ حالة جديدة: زر البحث الصريح (للمخزن وغيرهم)
  const [showSearchPanel, setShowSearchPanel] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('email', session.user.email).single();
        setUserRole(roleData ? roleData.role : 'viewer');
      }
      setAuthLoading(false);
    };
    
    const fetchSizes = async () => {
        const { data } = await supabase.from('standard_sizes').select('*');
        if (data) setSizes(data);
    };

    checkUser();
    fetchSizes();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setUserRole(null); else checkUser();
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // دالة إغلاق كل اللوحات
  const closeAllPanels = () => {
      setShowAdminPanel(false); setShowUserPanel(false); setShowMasterDataPanel(false);
      setShowWarehousePanel(false); setShowCatalogPanel(false);
      setShowAccountsDashboard(false); setShowTechnicianPayout(false); setShowDailyReport(false);
      setShowCashierPanel(false); setShowSalesEntry(false);
      setShowAdminReview(false); setShowSearchPanel(false); // ✅
  };

  const togglePanel = (panelName) => {
      closeAllPanels();
      if (panelName === 'admin') setShowAdminPanel(true);
      if (panelName === 'users') setShowUserPanel(true);
      if (panelName === 'master') setShowMasterDataPanel(true);
      if (panelName === 'warehouse') setShowWarehousePanel(true);
      if (panelName === 'catalog') setShowCatalogPanel(true);
      if (panelName === 'accounts') setShowAccountsDashboard(true);
      if (panelName === 'cashier') setShowCashierPanel(true); 
      if (panelName === 'salesEntry') setShowSalesEntry(true);
      if (panelName === 'search') setShowSearchPanel(true); // ✅ تفعيل البحث
  };

  // دوال التنقل
// ✅ التنقل داخل الحسابات
  const handleAccountNavigation = (target) => {
      setShowAccountsDashboard(false);
      
      if (target === 'payout') setShowTechnicianPayout(true);
      if (target === 'dailyReport') setShowDailyReport(true);
      if (target === 'review') setShowAdminReview(true);
      
      // 👇 هذا السطر ضروري جداً لكي يعمل زر الكاشير الجديد 👇
      if (target === 'cashier') setShowCashierPanel(true); 
  };

  const handleBackToAccounts = () => {
      setShowTechnicianPayout(false); setShowDailyReport(false); setShowAdminReview(false);
      setShowAccountsDashboard(true);
  };

  const handleBackToHome = () => { closeAllPanels(); };

  if (authLoading) return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">جاري التحقق... 🔐</div>;
  if (!session) return (<div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center p-4"><h1 className="text-4xl font-bold text-yellow-500 mb-2">نظام إدارة المخزون 🚗</h1><div className="w-full max-w-md bg-gray-800 p-1 rounded-lg shadow-2xl"><Login onClose={() => {}} /></div></div>);

  // ❌ تم إزالة "if return" الخاص بالمخزن ليدخلوا ضمن الهيكل العام

  // --- الواجهة الرئيسية ---
  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col dir-rtl">
      
      {/* 🛑 عرض الصفحات الخاصة (Full Screen Overlays) */}
      {showSalesEntry ? (<div className="p-4 animate-fadeIn"><button onClick={handleBackToHome} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2">⬅️ رجوع للرئيسية</button><SalesEntry session={session} /></div>) 
      : showTechnicianPayout ? (<div className="p-4 animate-fadeIn"><button onClick={handleBackToAccounts} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2">⬅️ رجوع للحسابات</button><TechnicianPayout /></div>) 
      : showDailyReport ? (<div className="p-4 animate-fadeIn"><button onClick={userRole === 'admin' ? handleBackToAccounts : handleBackToHome} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2">⬅️ رجوع</button><DailyReport /></div>)
      : showAdminReview ? (<div className="p-4 animate-fadeIn"><button onClick={handleBackToAccounts} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2">⬅️ رجوع للحسابات</button><AdminReview /></div>) 
      : showAccountsDashboard ? (<AccountsDashboard onNavigate={handleAccountNavigation} onBack={handleBackToHome} />) 
      : showCashierPanel ? (<div className="p-4 animate-fadeIn"><button onClick={handleBackToHome} className="mb-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center gap-2">⬅️ رجوع للرئيسية</button><CashierConfirmation /></div>) : (
          
          /* 🏠 العرض الافتراضي (الداشبورد) */
          <>
              <Header />
              <div className="bg-gray-800 border-b border-gray-700 p-3 flex justify-between items-center px-6 shadow-md">
                 <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${userRole === 'admin' ? 'bg-red-500' : userRole.includes('warehouse') ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                    <div><p className="text-sm font-bold text-white">{session.user.email}</p><p className="text-xs text-gray-400">الدور: <span className="uppercase font-bold text-yellow-400">{userRole}</span></p></div>
                 </div>
                 <button onClick={handleLogout} className="text-red-400 text-sm hover:text-red-300 font-bold underline transition">تسجيل خروج ⬅️</button>
              </div>

              {/* 🕹️ شريط الأزرار */}
              <div className="container mx-auto p-4 mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                
            {/* 👑 أزرار المدير */}
                {userRole === 'admin' && (
                    <>
                        <button onClick={() => togglePanel('accounts')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showAccountsDashboard ? 'bg-yellow-700 border-yellow-500 ring-2 ring-yellow-400' : 'bg-yellow-800 border-yellow-700 hover:bg-yellow-700'}`}>
                            <span className="text-2xl">💰</span><span>الحسابات</span>
                        </button>
                        
                        <button onClick={() => togglePanel('users')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showUserPanel ? 'bg-indigo-800 border-indigo-500 ring-2 ring-indigo-400' : 'bg-indigo-900 border-indigo-800 hover:bg-indigo-800'}`}>
                            <span className="text-2xl">👥</span><span>الموظفين</span>
                        </button>

                        <button onClick={() => togglePanel('admin')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showAdminPanel ? 'bg-blue-800 border-blue-500 ring-2 ring-blue-400' : 'bg-blue-900 border-blue-800 hover:bg-blue-800'}`}>
                            <span className="text-2xl">📦</span><span>إضافة منتج</span>
                        </button>

                        <button onClick={() => togglePanel('warehouse')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showWarehousePanel ? 'bg-orange-800 border-orange-500 ring-2 ring-orange-400' : 'bg-orange-900 border-orange-800 hover:bg-orange-800'}`}>
                            <span className="text-2xl">🏭</span><span>المخزن</span>
                        </button>

                        <button onClick={() => togglePanel('master')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showMasterDataPanel ? 'bg-emerald-800 border-emerald-500 ring-2 ring-emerald-400' : 'bg-emerald-900 border-emerald-800 hover:bg-emerald-800'}`}>
                            <span className="text-2xl">🚗</span><span>السيارات</span>
                        </button>
                    </>
                )}

                {/* 🏭 أزرار المخزن (للمدير وعمال المخزن والمشرفين) */}
                {(userRole === 'admin' || userRole.includes('warehouse')) && (
                    <>
                        <button onClick={() => togglePanel('warehouse')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showWarehousePanel ? 'bg-orange-800 border-orange-500 ring-2 ring-orange-400' : 'bg-orange-900 border-orange-800 hover:bg-orange-800'}`}>
                            <span className="text-2xl">🏭</span><span>إدارة المخزن</span>
                        </button>
                        {/* ✅ زر البحث المخصص للمخزن */}
                        <button onClick={() => togglePanel('search')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showSearchPanel ? 'bg-teal-700 border-teal-500 ring-2 ring-teal-400' : 'bg-teal-800 border-teal-600 hover:bg-teal-700'}`}>
                            <span className="text-2xl">🔍</span><span>بحث عن المنتجات</span>
                        </button>
                    </>
                )}

                {/* 🛒 المبيعات والكتالوج (للمشرف والمبيعات) */}
                {(userRole === 'admin' || userRole === 'supervisor' || userRole === 'sales') && (
                    <>
                        <button onClick={() => togglePanel('salesEntry')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showSalesEntry ? 'bg-purple-700 border-purple-500 ring-2 ring-purple-400' : 'bg-purple-800 border-purple-600 hover:bg-purple-700'}`}><span className="text-2xl">📝</span><span>تسجيل بيع</span></button>
                        <button onClick={() => togglePanel('catalog')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showCatalogPanel ? 'bg-cyan-800 border-cyan-500 ring-2 ring-cyan-400' : 'bg-cyan-900 border-cyan-800 hover:bg-cyan-800'}`}><span className="text-2xl">📋</span><span>الكتالوج</span></button>
                        {/* زر إضافة منتج للمشرف فقط (لأن المدير لديه زر خاص فوق) */}
                        {userRole === 'supervisor' && <button onClick={() => togglePanel('admin')} className={`p-3 rounded-lg text-center text-sm font-bold border transition flex flex-col items-center justify-center gap-1 shadow-md active:scale-95 ${showAdminPanel ? 'bg-blue-800 border-blue-500 ring-2 ring-blue-400' : 'bg-blue-900 border-blue-800 hover:bg-blue-800'}`}><span className="text-2xl">📦</span><span>إضافة منتج</span></button>}
                    </>
                )}

                {/* 💵 الكاشير */}
                {userRole === 'accountant' && (
                    <button onClick={() => togglePanel('cashier')} className={`col-span-2 p-4 rounded-lg text-center text-lg font-bold border transition flex flex-col items-center justify-center gap-2 shadow-md active:scale-95 bg-green-700 border-green-500 ring-2 ring-green-400`}><span className="text-3xl">💵</span><span>الكاشير / استلام</span></button>
                )}
              </div>

              {/* العرض (Panels) */}
              {showAdminPanel && <div className="container mx-auto px-4 md:px-8 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><AddProductForm /></div>}
              {showCatalogPanel && <div className="container mx-auto px-4 md:px-8 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><ProductCatalog userRole={userRole} sizes={sizes} /></div>}
              {/* ✅ عرض المخزن للمدير ولموظفي المخزن */}
              {showWarehousePanel && (userRole === 'admin' || userRole.includes('warehouse')) && <div className="container mx-auto px-2 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><WarehouseManagement userRole={userRole} /></div>}
              {showMasterDataPanel && <div className="container mx-auto px-4 md:px-8 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><MasterDataManagement /></div>}
              {showUserPanel && <div className="container mx-auto px-4 md:px-8 mb-8 border-b border-gray-700 pb-8 animate-fadeIn"><UserManagement /></div>}

              {/* ✅✅ مكون البحث عن المنتجات (يظهر في حالتين) ✅✅ */}
              {/* 1. يظهر بشكل افتراضي إذا لم يتم فتح أي لوحة (للمدير والمبيعات) */}
              {/* 2. يظهر إذا تم الضغط على زر "بحث" (للمخزن) */}
              {
                (showSearchPanel || (!showCatalogPanel && !showWarehousePanel && !showMasterDataPanel && !showAdminPanel && !showUserPanel && !showAccountsDashboard && !showCashierPanel && !showSalesEntry && !showTechnicianPayout && !showDailyReport && !showAdminReview && !userRole.includes('warehouse'))) && (
                  <ProductSearch userRole={userRole} sizes={sizes} />
              )}

              <Footer />
          </>
      )}
    </div>
  )
}

export default App;