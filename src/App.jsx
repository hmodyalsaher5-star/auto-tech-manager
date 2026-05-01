import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Header from './components/Header'
import Footer from './components/Footer'
import Login from './components/Login';

// الأيقونات (تمت إضافة أيقونات التوصيل والتجهيز)
import { 
  Home, Wallet, Users, PackagePlus, Factory, 
  Car, PenTool, Library, Banknote, LogOut, ArrowRight,
  Truck, ClipboardCheck, MapPin 
} from 'lucide-react';

// المكونات الأساسية
import AddProductForm from './components/AddProductForm'
import UserManagement from './components/UserManagement'; 
import MasterDataManagement from './components/MasterDataManagement'; 
import WarehouseManagement from './components/Warehouse/WarehouseManagement';
import ProductCatalog from './components/ProductCatalog';
import ProductSearch from './components/ProductSearch'; 

// المكونات المالية والمبيعات
import AccountsDashboard from './components/Sales/AccountsDashboard'; 
import TechnicianPayout from './components/Sales/TechnicianPayout';
import DailyReport from './components/Sales/DailyReport';
import CashierConfirmation from './components/Sales/CashierConfirmation'; 
import SalesEntry from './components/Sales/SalesEntry';
import AdminReview from './components/Sales/AdminReview';

// المكونات الجديدة (التوصيل والتجهيز)
import OrderRegistration from './components/Orders/OrderRegistration'; 
import OrderPreparation from './components/Orders/OrderPreparation';
import DeliveryDashboard from './components/Orders/DeliveryDashboard';
import DeliverySettlement from './components/Sales/DeliverySettlement';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [authLoading, setAuthLoading] = useState(true);
  const [sizes, setSizes] = useState([]); 

  // حالات التحكم بالعرض
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showMasterDataPanel, setShowMasterDataPanel] = useState(false); 
  const [showWarehousePanel, setShowWarehousePanel] = useState(false); 
  const [showCatalogPanel, setShowCatalogPanel] = useState(false);
  const [showAccountsDashboard, setShowAccountsDashboard] = useState(false);
  const [showTechnicianPayout, setShowTechnicianPayout] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showAdminReview, setShowAdminReview] = useState(false);
  const [showDeliverySettlement, setShowDeliverySettlement] = useState(false);
  const [showCashierPanel, setShowCashierPanel] = useState(false);
  const [showSalesEntry, setShowSalesEntry] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showOrderRegistration, setShowOrderRegistration] = useState(false);
  const [showOrderPreparation, setShowOrderPreparation] = useState(false); 
  const [showDeliveryDashboard, setShowDeliveryDashboard] = useState(false);

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

  const closeAllPanels = () => {
      setShowAdminPanel(false); setShowUserPanel(false); setShowMasterDataPanel(false);
      setShowWarehousePanel(false); setShowCatalogPanel(false);
      setShowAccountsDashboard(false); setShowTechnicianPayout(false); setShowDailyReport(false);
      setShowCashierPanel(false); setShowSalesEntry(false);
      setShowAdminReview(false); setShowSearchPanel(false);
      setShowOrderRegistration(false); setShowOrderPreparation(false);  
      setShowDeliveryDashboard(false); setShowDeliverySettlement(false);
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
      if (panelName === 'search') setShowSearchPanel(true); 
      if (panelName === 'orderRegistration') setShowOrderRegistration(true); 
      if (panelName === 'orderPreparation') setShowOrderPreparation(true);   
      if (panelName === 'delivery') setShowDeliveryDashboard(true); 
  };

  const handleAccountNavigation = (target) => {
      setShowAccountsDashboard(false);
      if (target === 'payout') setShowTechnicianPayout(true);
      if (target === 'dailyReport') setShowDailyReport(true);
      if (target === 'review') setShowAdminReview(true);
      if (target === 'cashier') setShowCashierPanel(true); 
      if (target === 'deliverySettlement') setShowDeliverySettlement(true);
  };

  const handleBackToAccounts = () => {
      setShowTechnicianPayout(false); setShowDailyReport(false); setShowAdminReview(false);
      setShowAccountsDashboard(true); setShowDeliverySettlement(false);
  };

  const handleBackToHome = () => { closeAllPanels(); };

  const isHomeActive = showSearchPanel || (!showCatalogPanel && !showWarehousePanel && !showMasterDataPanel && !showAdminPanel && !showUserPanel && !showAccountsDashboard && !showCashierPanel && !showSalesEntry && !showOrderRegistration && !showOrderPreparation && !showDeliveryDashboard);

  if (authLoading) return <div className="min-h-screen bg-[#1a0f07] flex justify-center items-center text-amber-500 font-bold text-xl">جاري التحقق من الهوية... ⏳</div>;
  if (!session) return (<div className="bg-gradient-to-br from-[#2d1b11] via-[#1a0f07] to-black min-h-screen flex flex-col justify-center items-center p-4"><h1 className="text-4xl font-extrabold text-amber-500/90 mb-6 drop-shadow-lg">نظام إدارة المخزون</h1><div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-2 rounded-3xl shadow-2xl border border-white/10"><Login onClose={() => {}} /></div></div>);

  return (
    <div className="bg-gradient-to-br from-[#3b2314] via-[#1a0f07] to-black min-h-screen text-orange-50 font-sans flex flex-col dir-rtl selection:bg-teal-500/30">
      
      {/* عرض الأقسام المنفردة بكامل الشاشة (نفس ستايلك القديم) */}
      {showSalesEntry ? (<div className="p-6 animate-fadeIn"><button onClick={handleBackToHome} className="mb-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-orange-100 px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition shadow-lg"><ArrowRight className="w-5 h-5"/> رجوع للرئيسية</button><SalesEntry session={session} /></div>) 
      : showTechnicianPayout ? (<div className="p-6 animate-fadeIn"><button onClick={handleBackToAccounts} className="mb-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-orange-100 px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition shadow-lg"><ArrowRight className="w-5 h-5"/> رجوع للحسابات</button><TechnicianPayout /></div>) 
      : showDailyReport ? (<div className="p-6 animate-fadeIn"><button onClick={userRole === 'admin' ? handleBackToAccounts : handleBackToHome} className="mb-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-orange-100 px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition shadow-lg"><ArrowRight className="w-5 h-5"/> رجوع</button><DailyReport /></div>)
      : showAdminReview ? (<div className="p-6 animate-fadeIn"><button onClick={handleBackToAccounts} className="mb-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-orange-100 px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition shadow-lg"><ArrowRight className="w-5 h-5"/> رجوع للحسابات</button><AdminReview /></div>) 
      : showDeliverySettlement ? (<div className="p-6 animate-fadeIn"><button onClick={handleBackToAccounts} className="mb-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-orange-100 px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition shadow-lg"><ArrowRight className="w-5 h-5"/> رجوع للحسابات</button><DeliverySettlement /></div>)
      : showAccountsDashboard ? (<AccountsDashboard onNavigate={handleAccountNavigation} onBack={handleBackToHome} />) 
      : showCashierPanel ? (<div className="p-6 animate-fadeIn"><button onClick={handleBackToHome} className="mb-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-orange-100 px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 transition shadow-lg"><ArrowRight className="w-5 h-5"/> رجوع للرئيسية</button><CashierConfirmation /></div>) : (
          
          <>
              <Header />
              {/* شريط المستخدم الزجاجي */}
              <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/10 p-3 flex justify-between items-center px-6 shadow-2xl">
                 <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] ${userRole === 'admin' ? 'bg-rose-400 text-rose-400' : userRole === 'viewer' ? 'bg-teal-400 text-teal-400' : userRole.includes('warehouse') ? 'bg-amber-400 text-amber-400' : 'bg-sky-400 text-sky-400'}`}></div>
                    <div>
                        <p className="text-sm font-bold text-orange-50 drop-shadow-md">{session.user.email}</p>
                        <p className="text-xs text-orange-200/70 mt-0.5">الدور: <span className="uppercase font-bold text-amber-400">{userRole === 'viewer' ? 'زائر' : userRole}</span></p>
                    </div>
                 </div>
                 <button onClick={handleLogout} className="flex items-center gap-2 text-rose-400/80 text-sm hover:text-rose-400 font-bold transition-colors group">
                    <span>تسجيل خروج</span>
                    <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                 </button>
              </div>

              {/* 🕹️ شبكة الأزرار (Glassmorphism + Najdi Accents) */}
              <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                
                {/* الزر الثابت للجميع: بحث */}
                <button onClick={() => togglePanel('search')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${isHomeActive ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                    <Home className="w-7 h-7" /><span>الرئيسية / بحث</span>
                </button>

                {/* صلاحيات المدير فقط */}
                {userRole === 'admin' && (
                    <>
                        <button onClick={() => togglePanel('accounts')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showAccountsDashboard ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                            <Wallet className="w-7 h-7" /><span>الحسابات</span>
                        </button>
                        <button onClick={() => togglePanel('users')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showUserPanel ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                            <Users className="w-7 h-7" /><span>الموظفين</span>
                        </button>
                        <button onClick={() => togglePanel('admin')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showAdminPanel ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                            <PackagePlus className="w-7 h-7" /><span>إضافة منتج</span>
                        </button>
                        <button onClick={() => togglePanel('master')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showMasterDataPanel ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                            <Car className="w-7 h-7" /><span>السيارات</span>
                        </button>
                    </>
                )}

                {/* صلاحيات المخزن والتجهيز */}
                {(userRole === 'admin' || userRole.includes('warehouse') || userRole === 'preparer') && (
                    <>
                        <button onClick={() => togglePanel('warehouse')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showWarehousePanel ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                            <Factory className="w-7 h-7" /><span>إدارة المخزن</span>
                        </button>
                        <button onClick={() => togglePanel('orderPreparation')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showOrderPreparation ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'bg-white/5 border-white/10 hover:border-teal-400'}`}>
                            <ClipboardCheck className="w-7 h-7" /><span>قسم التجهيز</span>
                        </button>
                    </>
                )}

                {/* صلاحيات المبيعات والتوصيل */}
                {(userRole === 'admin' || userRole === 'supervisor' || userRole === 'sales' || userRole === 'delivery' || userRole === 'viewer') && (
                    <>
                        {(userRole === 'admin' || userRole === 'sales' || userRole === 'supervisor') && (
                          <>
                            <button onClick={() => togglePanel('salesEntry')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showSalesEntry ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                                <PenTool className="w-7 h-7" /><span>تسجيل بيع</span>
                            </button>
                            <button onClick={() => togglePanel('orderRegistration')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showOrderRegistration ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 hover:border-teal-400'}`}>
                                <Truck className="w-7 h-7" /><span>طلب توصيل</span>
                            </button>
                          </>
                        )}
                        
                        {(userRole === 'admin' || userRole === 'delivery') && (
                          <button onClick={() => togglePanel('delivery')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showDeliveryDashboard ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-white/5 border-white/10 hover:border-sky-400'}`}>
                              <MapPin className="w-7 h-7" /><span>لوحة المندوب</span>
                          </button>
                        )}

                        <button onClick={() => togglePanel('catalog')} className={`p-4 rounded-[2rem] text-center text-sm font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-md shadow-xl hover:-translate-y-1 active:scale-95 ${showCatalogPanel ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30' : 'bg-white/5 border-white/10 text-orange-100/80 hover:bg-white/10 hover:border-teal-400/50 hover:text-teal-300'}`}>
                            <Library className="w-7 h-7" /><span>الكتالوج</span>
                        </button>
                    </>
                )}

                {/* صلاحية المحاسب الصرف */}
                {userRole === 'accountant' && (
                    <button onClick={() => togglePanel('accounts')} className={`col-span-2 p-4 rounded-[2rem] text-center text-lg font-bold border transition-all duration-300 flex flex-col items-center justify-center gap-3 backdrop-blur-lg shadow-[0_0_20px_rgba(20,184,166,0.2)] hover:-translate-y-1 active:scale-95 bg-teal-500/20 border-teal-500/50 text-teal-300`}>
                        <Banknote className="w-8 h-8" /><span>الإدارة المالية</span>
                    </button>
                )}
              </div>

              {/* 🖼️ العرض (Panels) */}
              <div className="container mx-auto px-4 md:px-8 mb-12">
                  {showAdminPanel && <div className="animate-fadeIn"><AddProductForm /></div>}
                  {showCatalogPanel && <div className="animate-fadeIn"><ProductCatalog userRole={userRole} sizes={sizes} /></div>}
                  {showWarehousePanel && <div className="animate-fadeIn"><WarehouseManagement userRole={userRole} /></div>}
                  {showMasterDataPanel && <div className="animate-fadeIn"><MasterDataManagement /></div>}
                  {showUserPanel && <div className="animate-fadeIn"><UserManagement /></div>}
                  {showOrderRegistration && <div className="animate-fadeIn"><OrderRegistration sizes={sizes} /></div>}
                  {showOrderPreparation && <div className="animate-fadeIn"><OrderPreparation /></div>}
                  {showDeliveryDashboard && <div className="animate-fadeIn"><DeliveryDashboard /></div>}
                  
                  { isHomeActive && (
                      <div className="animate-fadeIn"><ProductSearch userRole={userRole} sizes={sizes} /></div>
                  )}
              </div>

              <Footer />
          </>
      )}
    </div>
  )
}

export default App;