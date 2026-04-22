import React from 'react';

export default function AccountsDashboard({ onNavigate, onBack }) {
  return (
    <div className="relative min-h-screen p-4 md:p-8 text-right dir-rtl animate-fadeIn" dir="rtl">
      
      {/* 🎨 الهيدر الزجاجي */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-white/10 pb-6 gap-4 relative z-10">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow-md flex items-center gap-3">
              🔐 الإدارة المالية
            </h1>
            <p className="text-orange-200/60 text-sm mt-2 font-bold">لوحة تحكم المدير العام</p>
        </div>
        <button 
          onClick={onBack} 
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg flex items-center gap-2"
        >
          🏠 الرئيسية
        </button>
      </div>

      {/* 🎨 شبكة الأزرار (عمودين) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto relative z-10">
        
        {/* 1. زر المراجعة */}
        <div 
            onClick={() => onNavigate('review')} 
            className="group relative bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-white/10 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none"></div>
            <div className="text-5xl mb-5 drop-shadow-lg">🔍</div>
            <h2 className="text-xl md:text-2xl font-black text-orange-50 mb-2 group-hover:text-amber-300 transition-colors">مراجعة وتعيين الفنيين</h2>
            <p className="text-sm text-orange-200/60 leading-relaxed font-bold">مراجعة المبيعات وتوزيعها على الفنيين.</p>
        </div>

        {/* 2. زر الكاشير */}
        <div 
            onClick={() => onNavigate('cashier')}
            className="group relative bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-white/10 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none"></div>
            <div className="text-5xl mb-5 drop-shadow-lg">💵</div>
            <h2 className="text-xl md:text-2xl font-black text-orange-50 mb-2 group-hover:text-amber-300 transition-colors">الكاشير / استلام</h2>
            <p className="text-sm text-orange-200/60 leading-relaxed font-bold">استلام المبالغ من المبيعات وتأكيد الدفع.</p>
        </div>

        {/* 3. زر محاسبة الفنيين */}
        <div 
            onClick={() => onNavigate('payout')}
            className="group relative bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-white/10 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none"></div>
            <div className="text-5xl mb-5 drop-shadow-lg">💰</div>
            <h2 className="text-xl md:text-2xl font-black text-orange-50 mb-2 group-hover:text-amber-300 transition-colors">محاسبة الفنيين</h2>
            <p className="text-sm text-orange-200/60 leading-relaxed font-bold">حساب الرواتب اليومية وإغلاق الصندوق.</p>
        </div>

        {/* 4. زر التقارير */}
        <div 
            onClick={() => onNavigate('dailyReport')}
            className="group relative bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.4)] border border-white/10 cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-all duration-500 pointer-events-none"></div>
            <div className="text-5xl mb-5 drop-shadow-lg">📄</div>
            <h2 className="text-xl md:text-2xl font-black text-orange-50 mb-2 group-hover:text-amber-300 transition-colors">التقارير والأرشيف</h2>
            <p className="text-sm text-orange-200/60 leading-relaxed font-bold">طباعة الكشوفات ومراجعة الأيام السابقة.</p>
        </div>

      </div>
    </div>
  );
}