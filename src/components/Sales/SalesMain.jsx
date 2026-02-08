import React, { useState } from 'react';
import SalesEntry from './SalesEntry';
import CashierConfirmation from './CashierConfirmation';
import AdminReview from './AdminReview'; 
import TechnicianManager from './TechnicianManager'; // 🆕 إدارة الفنيين
import TechnicianPayout from './TechnicianPayout'; // 🆕 دفع الرواتب
import DailyClosing from './DailyClosing'; // 🆕 الأرشيف والإغلاق
import DailyReport from './DailyReport';

export default function SalesMain() {
  // حالة للتحكم في الصفحة المعروضة
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans dir-rtl text-right">
      
      {/* 🟢 الهيدر والتبويبات */}
      <header className="bg-gray-800 border-b border-gray-700 p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-yellow-400 mb-2 md:mb-0">🚗 نظام المبيعات والحوافز</h1>
                <span className="text-xs text-gray-500 border border-gray-600 px-2 py-1 rounded">Beta v1.0</span>
            </div>
            
            {/* شريط الأزرار (قابل للتمرير أفقياً في الموبايل) */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                
                {/* 1. المبيعات */}
                <button 
                    onClick={() => setActiveTab('sales')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold transition duration-200 whitespace-nowrap ${
                        activeTab === 'sales' ? 'bg-purple-600 text-white ring-2 ring-purple-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                >
                    📝 المبيعات
                </button>

                {/* 2. المحاسب */}
                <button 
                    onClick={() => setActiveTab('cashier')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold transition duration-200 whitespace-nowrap ${
                        activeTab === 'cashier' ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                >
                    💵 المحاسب
                </button>

                {/* 3. المدير (التصفية) */}
                <button 
                    onClick={() => setActiveTab('admin')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold transition duration-200 whitespace-nowrap ${
                        activeTab === 'admin' ? 'bg-yellow-600 text-white ring-2 ring-yellow-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                >
                    👮 المدير
                </button>

                {/* 4. التسوية (الدفع) */}
                <button 
                    onClick={() => setActiveTab('payout')}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold transition duration-200 whitespace-nowrap ${
                        activeTab === 'payout' ? 'bg-green-600 text-white ring-2 ring-green-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                >
                   
                
                    ⚙️ الفنيين
                </button>
                
                    {/* 🆕 زر التقرير اليومي (بديل التسوية والأرشيف) */}
                        <button 
                            onClick={() => setActiveTab('report')}
                            className={`flex-1 py-3 px-4 rounded-lg font-bold transition duration-200 whitespace-nowrap ${
                                activeTab === 'report' ? 'bg-green-600 text-white ring-2 ring-green-400' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                        >
                            🖨️ التقرير اليومي
                        </button>



             

            </div>
        </div>
      </header>

      {/* 🟡 عرض المحتوى بناءً على التبويب المختار */}
      <main className="container mx-auto p-4 pb-20">
        {activeTab === 'sales' && <SalesEntry />}
        {activeTab === 'cashier' && <CashierConfirmation />}
        {activeTab === 'admin' && <AdminReview />}
        {activeTab === 'payout' && <TechnicianPayout />}
        {activeTab === 'techs' && <TechnicianManager />}
        {activeTab === 'report' && <DailyReport />}
        {activeTab === 'archive' && <DailyClosing />}
      </main>

    </div>
  );
}