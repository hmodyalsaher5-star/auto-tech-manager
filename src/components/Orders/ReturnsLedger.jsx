import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  XCircle, FileText, User, Banknote, PackageCheck, Archive, RefreshCw 
} from 'lucide-react'; // 🆕 أضفنا أيقونة RefreshCw للاستبدال

export default function ReturnsLedger() {
  const [returnedOrders, setReturnedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الطلبات الراجعة + طلبات الاستبدال التي لم تُستلم في المخزن بعد
  const fetchReturnedOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      // 💡 التعديل هنا: نجلب الطلبات التي حالتها (راجع) أو (استبدال)
      .in('status', ['returned', 'replaced']) 
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReturnedOrders(data);
    } else {
      console.error('خطأ في جلب الرواجع:', error?.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReturnedOrders();
  }, []);

  // 2. دالة تأكيد استلام البضاعة وإرجاعها لرفوف المخزن
  const handleConfirmStockReturn = async (orderId, customerName) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من استلام بضاعة (${customerName}) من شركة التوصيل وإعادتها للمخزن؟`);
    if (!isConfirmed) return;

    // نقوم بتغيير الحالة إلى 'returned_to_stock' لكي تختفي من هذه الشاشة
    const { error } = await supabase
      .from('orders')
      .update({ status: 'returned_to_stock' }) 
      .eq('id', orderId);

    if (error) {
      alert("حدث خطأ أثناء التأكيد: " + error.message);
    } else {
      alert("تم تأكيد استلام البضاعة، وتم إرجاعها لرفوف المخزن بنجاح! 📦✅");
      fetchReturnedOrders(); // تحديث الجدول لإخفاء الطلب
    }
  };

  if (loading) return <div className="text-rose-400 text-center p-10 font-bold text-xl animate-pulse">جاري جلب سجل الرواجع... 🔄</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      
      <h2 className="text-2xl font-bold text-rose-400 mb-8 flex items-center gap-3 border-b border-rose-500/20 pb-4">
        <XCircle className="w-8 h-8" />
        سجل الرواجع والاستبدال (استلام البضاعة للمخزن)
      </h2>

      <div className="bg-black/40 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-gray-300">
            <thead className="text-xs text-rose-300 uppercase bg-rose-900/30 border-b border-rose-500/30">
              <tr>
                <th scope="col" className="px-4 py-5 font-bold"><FileText className="w-4 h-4 inline mr-1"/> رقم الوصل</th>
                <th scope="col" className="px-4 py-5 font-bold"><User className="w-4 h-4 inline mr-1"/> اسم العميل والتفاصيل</th>
                <th scope="col" className="px-4 py-5 font-bold text-center"><Banknote className="w-4 h-4 inline mr-1"/> مبلغ الطلب</th>
                <th scope="col" className="px-4 py-5 font-bold text-center"><Archive className="w-4 h-4 inline mr-1"/> الإجراء المخزني</th>
              </tr>
            </thead>
            <tbody>
              {returnedOrders.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-rose-200/50 font-bold text-lg border-dashed border-rose-500/20">
                    لا توجد طلبات راجعة بانتظار الاستلام حالياً. المخزن نظيف! ✨
                  </td>
                </tr>
              ) : (
                returnedOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-rose-900/10 transition-colors">
                    
                    {/* 1. رقم الوصل */}
                    <td className="px-4 py-5 font-mono text-rose-300 font-bold text-lg tracking-widest" dir="ltr">
                      {order.tracking_number || '---'}
                    </td>
                    
                    {/* 2. اسم العميل والعلامات */}
                    <td className="px-4 py-5 text-white font-bold text-base">
                       {order.customer_name}
                       
                       {/* 🆕 علامات ذكية تظهر إذا كان الطلب له علاقة بالاستبدال */}
                       <div className="flex flex-col gap-1 mt-2">
                           {order.status === 'replaced' && (
                              <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-md border border-amber-500/30 flex items-center gap-1 w-fit">
                                  <RefreshCw className="w-3 h-3"/> استرجاع قطعة (بسبب الاستبدال)
                              </span>
                           )}
                           {order.order_type === 'replacement' && (
                              <span className="bg-sky-500/20 text-sky-300 text-xs px-2 py-1 rounded-md border border-sky-500/30 flex items-center gap-1 w-fit">
                                  <RefreshCw className="w-3 h-3"/> راجع من طلب بديل (يطابق وصل أصلي: <span dir="ltr" className="font-mono">{order.original_tracking_number}</span>)
                              </span>
                           )}
                       </div>

                       <div className="text-xs text-gray-500 mt-2 font-normal">
                          المحافظة: {order.governorate}
                       </div>
                    </td>

                    {/* 3. مبلغ الطلب */}
                    <td className="px-4 py-5 text-center font-bold text-lg text-gray-400 line-through decoration-rose-500" dir="ltr">
                      {order.total_price} <span className="text-sm font-normal">{order.currency === 'USD' ? '$' : 'د.ع'}</span>
                    </td>

                    {/* 4. زر التأكيد */}
                    <td className="px-4 py-5 text-center">
                      <button 
                        onClick={() => handleConfirmStockReturn(order.id, order.customer_name)}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                      >
                        <PackageCheck className="w-5 h-5" />
                        تأكيد استلام القطع للمخزن
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl text-amber-300 text-sm flex items-center gap-2">
         <span className="text-xl">⚠️</span> 
         ملاحظة للمخزن: تأكد من فحص البضاعة ومطابقتها مع رقم الوصل قبل الضغط على زر التأكيد، لأن الطلب سيختفي من هذا السجل فوراً ولن يعود ظاهراً.
      </div>
    </div>
  );
}