import { useState } from 'react';

// استيراد جميع الصفحات التي قمنا ببرمجتها
// (تأكد أن مسارات المجلدات صحيحة حسب ترتيبك)
import AddOrder from './DeliverySales/AddOrder';
import PrepDashboard from './DeliveryPrep/PrepDashboard';
import CourierDashboard from './DeliveryCourier/CourierDashboard';
import TechSupportDashboard from './DeliveryTechSupport/TechSupportDashboard';
import AdminDashboard from './DeliveryAdmin/AdminDashboard';
import AdminReturns from './DeliveryAdmin/AdminReturns';

function DeliveryMain() {
  // هذا المخزن يحدد "ما هي الصفحة المفتوحة حالياً؟"
  // جعلنا صفحة المدير هي الافتراضية عند فتح النظام
  const [activeTab, setActiveTab] = useState('admin');

  // هذه الدالة تقرر ماذا تعرض بناءً على الزر المضغوط
 const renderContent = () => {
    switch (activeTab) {
      case 'sales': return <AddOrder />;
      case 'prep': return <PrepDashboard />;
      case 'courier': return <CourierDashboard />;
      case 'support': return <TechSupportDashboard />;
      case 'admin': return <AdminDashboard />;
      case 'returns': return <AdminReturns />; // 👈 أضفنا هذا السطر
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden" dir="rtl">
      
      {/* 1. القائمة الجانبية (Sidebar) */}
      <div className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 text-center border-b border-gray-700">
          <h2 className="text-2xl font-black text-blue-400">نظام التوصيل 📦</h2>
          <p className="text-xs text-gray-400 mt-2">إدارة متكاملة</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('admin')}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'admin' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            📊 لوحة المدير المالي
          </button>
          <button 
                        onClick={() => setActiveTab('returns')}
                        className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'returns' ? 'bg-red-600 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'}`}
                    >
                        ❌ المرتجعات والتحقيق
         </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'sales' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            ➕ إضافة طلب (مبيعات)
          </button>

          <button 
            onClick={() => setActiveTab('prep')}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'prep' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            📦 قسم التجهيز والتغليف
          </button>

          <button 
            onClick={() => setActiveTab('courier')}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'courier' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            🚚 تسليم المناديب
          </button>

          <button 
            onClick={() => setActiveTab('support')}
            className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'support' ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            🚩 الدعم الفني والمشاكل
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700 text-center text-xs text-gray-500">
          تمت البرمجة باحترافية ✨
        </div>
      </div>

      {/* 2. منطقة العرض المتغيرة (Main Content) */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

    </div>
  );
}

export default DeliveryMain;