export default function AccountsDashboard({ onNavigate, onBack }) {
  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white dir-rtl" dir="rtl">
      
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <div>
            <h1 className="text-2xl font-bold text-yellow-400">🔐 الإدارة المالية</h1>
            <p className="text-gray-400 text-sm">لوحة تحكم المدير العام</p>
        </div>
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition">🏠 الرئيسية</button>
      </div>

      {/* تم تعديل الشبكة لتكون عمودين (md:grid-cols-2) لتناسب 4 أزرار بشكل أجمل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        
        {/* 1. زر المراجعة */}
        <div 
            onClick={() => onNavigate('review')} 
            className="bg-gradient-to-br from-purple-900 to-purple-800 p-6 rounded-xl shadow-lg border border-purple-600 cursor-pointer hover:scale-105 transition transform relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 bg-white/10 w-20 h-20 rounded-full -mr-10 -mt-10 blur-xl group-hover:bg-white/20 transition"></div>
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-xl font-bold">مراجعة وتعيين الفنيين</h2>
            <p className="text-sm text-gray-300 mt-2">مراجعة المبيعات وتوزيعها على الفنيين.</p>
        </div>

        {/* 2. زر الكاشير (جديد ✅) */}
        <div 
            onClick={() => onNavigate('cashier')}
            className="bg-gradient-to-br from-teal-900 to-teal-800 p-6 rounded-xl shadow-lg border border-teal-600 cursor-pointer hover:scale-105 transition transform"
        >
            <div className="text-4xl mb-3">💵</div>
            <h2 className="text-xl font-bold">الكاشير / استلام</h2>
            <p className="text-sm text-gray-300 mt-2">استلام المبالغ من المبيعات وتأكيد الدفع.</p>
        </div>

        {/* 3. زر محاسبة الفنيين */}
        <div 
            onClick={() => onNavigate('payout')}
            className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-xl shadow-lg border border-blue-600 cursor-pointer hover:scale-105 transition transform"
        >
            <div className="text-4xl mb-3">💰</div>
            <h2 className="text-xl font-bold">محاسبة الفنيين</h2>
            <p className="text-sm text-gray-300 mt-2">حساب الرواتب اليومية وإغلاق الصندوق.</p>
        </div>

        {/* 4. زر التقارير */}
        <div 
            onClick={() => onNavigate('dailyReport')}
            className="bg-gradient-to-br from-green-900 to-green-800 p-6 rounded-xl shadow-lg border border-green-600 cursor-pointer hover:scale-105 transition transform"
        >
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-xl font-bold">التقارير والأرشيف</h2>
            <p className="text-sm text-gray-300 mt-2">طباعة الكشوفات ومراجعة الأيام السابقة.</p>
        </div>

      </div>
    </div>
  );
}