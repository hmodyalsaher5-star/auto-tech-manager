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

  // تأكيد العملية (بدون رقم وصل)
  const handleConfirm = async (saleId, amount) => {
    // رسالة تأكيد بسيطة للمحاسب
    if (!window.confirm(`هل تؤكد استلام مبلغ ${Number(amount).toLocaleString()} دينار؟`)) return;

    const { error } = await supabase
      .from('sales_operations')
      .update({ status: 'confirmed' }) // تحويل الحالة فقط
      .eq('id', saleId);

    if (error) {
      alert("❌ خطأ: " + error.message);
    } else {
      alert("✅ تم تأكيد الدفع");
      fetchPendingSales(); // تحديث القائمة
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4 animate-fadeIn dir-rtl text-right">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-400">💵 لوحة المحاسب (تأكيد الدفع)</h2>
        <button onClick={fetchPendingSales} className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition">🔄 تحديث القائمة</button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 animate-pulse">جاري جلب البيانات...</p>
      ) : pendingSales.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700 border-dashed">
            <p className="text-gray-500 text-xl">🎉 لا توجد طلبات معلقة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingSales.map((sale) => (
            <div key={sale.id} className="bg-gray-800 p-4 rounded-lg border-r-4 border-yellow-500 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* تفاصيل الطلب */}
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-white">{sale.car_type}</h3>
                        {/* 🆕 عرض المبلغ بشكل واضح للمحاسب */}
                        <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full font-bold border border-green-700">
                          {Number(sale.amount_total).toLocaleString()} د.ع
                        </span>
                    </div>
                    <p className="text-gray-300 mt-1">{sale.details}</p>
                    <div className="flex justify-between mt-3 text-xs text-gray-400">
                       <span>👤 المبيعات: {sale.salesperson_name}</span>
                       <span dir="ltr">{new Date(sale.created_at).toLocaleTimeString('ar-EG')}</span>
                    </div>
                </div>

                {/* زر التأكيد فقط */}
                <div className="w-full md:w-auto min-w-[150px]">
                    <button 
                        onClick={() => handleConfirm(sale.id, sale.amount_total)} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded shadow transition transform active:scale-95 whitespace-nowrap flex justify-center items-center gap-2"
                    >
                        <span>تأكيد الاستلام</span>
                        <span>💰</span>
                    </button>
                </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}