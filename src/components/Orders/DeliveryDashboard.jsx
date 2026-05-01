import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Truck, MapPin, Phone, User, Send, Banknote, FileText } from 'lucide-react'; // 🆕 استدعينا أيقونة FileText لرقم الوصل

export default function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. جلب الطلبات الجاهزة للتسليم لشركة الشحن
  const fetchDeliveries = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'ready_for_delivery') 
      .order('created_at', { ascending: true }); 

    if (error) {
      console.error('خطأ في جلب الطلبات:', error.message);
    } else {
      setDeliveries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. دالة تسليم الطلب لشركة التوصيل
  const handleHandoverToCompany = async (orderId, customerName) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من تسليم طلب (${customerName}) إلى مندوب شركة التوصيل؟`);
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'shipped' }) 
      .eq('id', orderId);

    if (error) {
      alert("حدث خطأ أثناء التحديث: " + error.message);
    } else {
      alert("تم تسليم الطلب لشركة التوصيل بنجاح! الطلب الآن في عهدة قسم الحسابات 📊");
      fetchDeliveries(); // تحديث الشاشة لإخفاء الطلب المنجز
    }
  };

  if (loading) return <div className="text-sky-400 text-center p-10 font-bold text-xl animate-pulse">جاري تحميل الطلبات... 🚚</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-sky-400 mb-8 flex items-center gap-3 border-b border-sky-500/20 pb-4">
        <Truck className="w-8 h-8" />
        قسم التوزيع (تسليم الطلبات لشركة التوصيل)
      </h2>

      {deliveries.length === 0 ? (
        <div className="bg-white/5 p-10 rounded-3xl border border-dashed border-white/20 text-center text-sky-200/50 font-bold text-lg">
          لا توجد طلبات بانتظار التسليم لشركة التوصيل حالياً 📦
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliveries.map((order) => (
            <div key={order.id} className="bg-gradient-to-b from-slate-800 to-black/60 backdrop-blur-xl border border-sky-500/30 p-6 rounded-[2rem] shadow-2xl hover:border-sky-400 transition-all relative overflow-hidden flex flex-col justify-between">
              
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>

              <div>
                  <div className="mb-4">
                     <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                         <User className="w-5 h-5 text-sky-400" /> {order.customer_name}
                     </h3>
                     <p className="text-sm text-gray-300 flex items-center gap-2 mb-2 bg-white/5 p-2 rounded-lg">
                         <MapPin className="w-4 h-4 text-rose-400" /> 
                         <span>{order.governorate} - {order.region} <br/> <span className="text-xs text-gray-400">{order.landmark && `(${order.landmark})`}</span></span>
                     </p>
                     <p className="text-sm text-sky-300 font-mono flex items-center gap-2 bg-sky-900/20 p-2 rounded-lg border border-sky-500/10" dir="ltr">
                        <Phone className="w-4 h-4" /> {order.phone1} {order.phone2 && `| ${order.phone2}`}
                     </p>
                  </div>
                  
                  {/* 🆕 رقم الوصل: مصمم بشكل بارز ومتقطع ليشبه الملصق/الباركود */}
                  <div className="bg-black/50 p-4 rounded-2xl border-2 border-dashed border-sky-400/50 mb-4 flex flex-col items-center justify-center gap-1 shadow-inner">
                      <span className="text-sky-400 text-xs font-bold flex items-center gap-1">
                          <FileText className="w-4 h-4" /> رقم وصل شركة التوصيل:
                      </span>
                      <strong className="text-white font-black text-2xl tracking-widest drop-shadow-md" dir="ltr">
                          {order.tracking_number || 'بدون رقم'}
                      </strong>
                  </div>

                  {/* السعر */}
                  <div className="bg-emerald-900/30 p-4 rounded-2xl border border-emerald-500/30 mb-6 flex justify-between items-center">
                     <span className="text-emerald-400 font-bold text-sm flex items-center gap-1"><Banknote className="w-4 h-4" /> مبلغ الوصل:</span>
                     <strong className="text-emerald-400 font-black text-2xl" dir="ltr">
                        {order.total_price} <span className="text-sm">{order.currency === 'USD' ? '$' : 'د.ع'}</span>
                     </strong>
                  </div>
              </div>
              
              <button 
                onClick={() => handleHandoverToCompany(order.id, order.customer_name)}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white py-3.5 rounded-xl font-extrabold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
              >
                <Send className="w-5 h-5" />
                تأكيد التسليم لشركة التوصيل
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}