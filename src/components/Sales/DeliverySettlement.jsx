import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
// 🆕 أضفنا أيقونة FileText لرقم الوصل
import { Truck, MapPin, Phone, User, CheckCircle, XCircle, Banknote, FileText } from 'lucide-react';

export default function DeliverySettlement() {
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الطلبات التي قيد الشحن فقط
  const fetchShippedOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'shipped') 
      .order('created_at', { ascending: true });

    if (error) {
      console.error('خطأ في جلب الطلبات:', error.message);
    } else {
      setShippedOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchShippedOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. دالة: استلام المبلغ بنجاح
  const handlePaymentReceived = async (orderId, customerName, amount, currency) => {
    const isConfirmed = window.confirm(`هل تؤكد استلام مبلغ (${amount} ${currency}) من طلب العميل ${customerName}؟`);
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' }) 
      .eq('id', orderId);

    if (error) {
      alert("حدث خطأ أثناء التحديث: " + error.message);
    } else {
      alert("تم إغلاق الفاتورة بنجاح ودخول المبلغ للصندوق! 💰");
      fetchShippedOrders(); // تحديث الشاشة
    }
  };

  // 3. دالة: البضاعة راجعة (لم تُستلم)
  const handleReturnedOrder = async (orderId, customerName) => {
    const isConfirmed = window.confirm(`هل أنت متأكد أن طلب العميل (${customerName}) راجع ولم يتم استلامه؟`);
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'returned' }) 
      .eq('id', orderId);

    if (error) {
      alert("حدث خطأ أثناء التحديث: " + error.message);
    } else {
      alert("تم تسجيل الطلب كمرتجع. يجب إعادة البضاعة للمخزن! 🔄");
      fetchShippedOrders(); // تحديث الشاشة
    }
  };

  if (loading) return <div className="text-emerald-400 text-center p-10 font-bold text-xl animate-pulse">جاري جلب كشوفات التوصيل... 🧾</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-emerald-400 mb-8 flex items-center gap-3 border-b border-emerald-500/20 pb-4">
        <Truck className="w-8 h-8" />
        تسوية حسابات شركات التوصيل
      </h2>

      {shippedOrders.length === 0 ? (
        <div className="bg-white/5 p-10 rounded-3xl border border-dashed border-white/20 text-center text-emerald-200/50 font-bold text-lg">
          لا توجد طلبات قيد الشحن حالياً، الكشوفات فارغة! ☕
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shippedOrders.map((order) => (
            <div key={order.id} className="bg-gradient-to-b from-slate-800 to-black/60 backdrop-blur-xl border border-emerald-500/30 p-6 rounded-[2rem] shadow-2xl hover:border-emerald-400 transition-all relative overflow-hidden flex flex-col justify-between">
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

              <div>
                  <div className="mb-4">
                     <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                         <User className="w-5 h-5 text-emerald-400" /> {order.customer_name}
                     </h3>
                     <p className="text-sm text-gray-300 flex items-center gap-2 mb-2 bg-white/5 p-2 rounded-lg">
                         <MapPin className="w-4 h-4 text-rose-400" /> 
                         <span>{order.governorate} - {order.region}</span>
                     </p>
                     <p className="text-sm text-emerald-300 font-mono flex items-center gap-2 bg-emerald-900/20 p-2 rounded-lg border border-emerald-500/10" dir="ltr">
                        <Phone className="w-4 h-4" /> {order.phone1} {order.phone2 && `| ${order.phone2}`}
                     </p>
                  </div>
                  
                  {/* 🆕 عرض رقم الوصل بشكل بارز للمحاسب */}
                  <div className="bg-black/50 p-3 rounded-xl border border-dashed border-emerald-500/50 mb-4 flex flex-col items-center justify-center gap-1">
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <FileText className="w-4 h-4" /> رقم وصل التوصيل للمطابقة:
                      </span>
                      <strong className="text-white font-black text-xl tracking-widest" dir="ltr">
                          {order.tracking_number || 'لم يُسجل'}
                      </strong>
                  </div>

                  <div className="bg-amber-900/20 p-4 rounded-2xl border border-amber-500/30 mb-6 flex justify-between items-center">
                     <span className="text-amber-400 font-bold text-sm flex items-center gap-1"><Banknote className="w-4 h-4" /> المبلغ المطلوب:</span>
                     <strong className="text-amber-400 font-black text-2xl" dir="ltr">
                        {order.total_price} <span className="text-sm">{order.currency === 'USD' ? '$' : 'د.ع'}</span>
                     </strong>
                  </div>
              </div>
              
              {/* أزرار المحاسب */}
              <div className="flex flex-col gap-3 mt-2">
                  <button 
                    onClick={() => handlePaymentReceived(order.id, order.customer_name, order.total_price, order.currency)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-extrabold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    تم التحصيل (استلام المبلغ)
                  </button>
                  
                  <button 
                    onClick={() => handleReturnedOrder(order.id, order.customer_name)}
                    className="w-full bg-rose-900/40 border border-rose-500/50 hover:bg-rose-600/60 hover:border-rose-400 text-rose-200 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    الطلب راجع (إلغاء وإرجاع)
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}