import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

export default function CashierConfirmation() {
  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(false);

  // جلب المبيعات المعلقة
  const fetchPendingSales = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_operations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) console.error('Error:', error);
      else setPendingSales(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingSales();
  }, [fetchPendingSales]);

  // تأكيد العملية
  const handleConfirm = async (saleId, amount) => {
    if (!window.confirm(`هل تؤكد استلام مبلغ ${Number(amount).toLocaleString()} دينار؟`)) return;

    const { error } = await supabase
      .from('sales_operations')
      .update({ status: 'confirmed' })
      .eq('id', saleId);

    if (error) {
      alert("❌ خطأ: " + error.message);
    } else {
      alert("✅ تم تأكيد الدفع");
      fetchPendingSales();
    }
  };

  // 💡 حساب إجمالي المبالغ المعلقة (اقتراح جديد لمساعدة المحاسب)
  const totalPendingAmount = pendingSales.reduce((sum, sale) => sum + Number(sale.amount_total), 0);

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4 md:p-6 animate-fadeIn dir-rtl text-right">
      
      {/* 🎨 الهيدر الزجاجي */}
      <div className="relative bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 blur-[60px] pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-teal-400 drop-shadow-md flex items-center gap-3">
                    💵 لوحة المحاسب (تأكيد الدفع)
                </h2>
                <p className="text-teal-100/60 text-sm mt-2 font-bold">الطلبات التي تنتظر الدفع من قبل العملاء</p>
            </div>
            <button 
                onClick={fetchPendingSales} 
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-teal-50 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg flex items-center gap-2"
            >
                🔄 تحديث القائمة
            </button>
        </div>

        {/* 💡 شريط إجمالي المبالغ */}
        {!loading && pendingSales.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                <span className="text-teal-200/80 font-bold text-lg">إجمالي المبالغ المعلقة:</span>
                <span className="text-3xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                    {totalPendingAmount.toLocaleString()} <span className="text-lg text-amber-500/70">د.ع</span>
                </span>
            </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
        </div>
      ) : pendingSales.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[2rem] text-center border border-white/10 border-dashed shadow-inner">
            <div className="text-6xl mb-4 opacity-50">🎉</div>
            <p className="text-teal-100/60 text-xl font-bold">لا توجد فواتير معلقة، الصندوق مكتمل حالياً!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingSales.map((sale) => (
            <div 
                key={sale.id} 
                className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-teal-500/30 transition-all duration-300 flex flex-col md:flex-row justify-between items-center gap-6 group relative overflow-hidden"
            >
                {/* تأثير ضوئي خفيف عند تمرير الماوس */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/0 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                {/* تفاصيل الطلب */}
                <div className="flex-grow w-full relative z-10">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                        <div>
                            <h3 className="text-xl font-black text-orange-50 drop-shadow-sm">{sale.car_type}</h3>
                            <p className="text-orange-200/60 text-sm mt-1 font-bold">{sale.details}</p>
                        </div>
                        
                        {/* 💡 عرض المبلغ بشكل ضخم وأخضر للمحاسب */}
                        <div className="bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 rounded-2xl text-center shadow-inner">
                            <span className="block text-emerald-400 font-black text-2xl drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] dir-ltr">
                                {Number(sale.amount_total).toLocaleString()}
                            </span>
                            <span className="block text-emerald-500/70 text-xs font-bold mt-1">دينار عراقي</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-2 pt-4 border-t border-white/5 text-xs font-bold text-teal-100/40">
                        <span className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                            👤 المبيعات: <span className="text-teal-300">{sale.salesperson_name}</span>
                        </span>
                        <span className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                            ⏰ الوقت: <span dir="ltr" className="text-teal-300">{new Date(sale.created_at).toLocaleTimeString('ar-EG')}</span>
                        </span>
                    </div>
                </div>

                {/* 💡 زر التأكيد (أصبح زجاجياً باللون الأخضر المريح) */}
                <div className="w-full md:w-auto min-w-[180px] relative z-10">
                    <button 
                        onClick={() => handleConfirm(sale.id, sale.amount_total)} 
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-black py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all active:scale-95 flex justify-center items-center gap-3"
                    >
                        <span>تأكيد الاستلام</span>
                        <span className="text-xl">💰</span>
                    </button>
                </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}