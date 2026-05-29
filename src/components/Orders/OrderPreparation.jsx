import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
// 🆕 أضفنا أيقونة UserCheck لتمييز موظف المبيعات
import { ClipboardList, PackageCheck, User, MapPin, X, Banknote, FileText, Trash2, CarFront, ListTree, UserCheck } from 'lucide-react';

export default function OrderPreparation() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (!error) setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const refreshOrders = async () => {
      const { data } = await supabase.from('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      setOrders(data || []);
  };

  const handleConfirmPreparation = async (orderId) => {
    if (!trackingNumber.trim()) return alert("⚠️ يرجى إدخال رقم الوصل الخاص بشركة التوصيل أولاً.");
    if (!window.confirm(`تأكيد تسليم الطلب برقم الوصل: ${trackingNumber}؟`)) return;

    const { error } = await supabase.from('orders').update({ status: 'ready_for_delivery', tracking_number: trackingNumber }).eq('id', orderId);
    if (!error) {
      alert("تم تحويل الطلب إلى قسم المندوب بنجاح! 🚚");
      setTrackingNumber(''); setSelectedOrder(null); refreshOrders();
    } else {
      alert("خطأ: " + error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في إلغاء هذا الطلب نهائياً؟")) return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (!error) { 
        alert("تم الإلغاء ❌"); 
        setSelectedOrder(null); 
        refreshOrders(); 
    }
  };

  if (loading) return <div className="text-teal-400 text-center p-10 font-bold text-xl">جاري جلب الطلبات...</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-teal-400 mb-8 flex items-center gap-3 border-b border-teal-500/20 pb-4">
        <ClipboardList className="w-8 h-8" /> قسم التجهيز (طلبات بانتظار التغليف)
      </h2>

      {orders.length === 0 ? (
        <div className="bg-white/5 p-10 rounded-3xl border border-dashed text-center text-gray-400 font-bold">المخزن فارغ حالياً ☕</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer bg-black/40 border border-teal-500/30 p-6 rounded-[2rem] hover:border-teal-400 transition-all flex flex-col justify-between relative overflow-hidden">
              
              {/* 🆕 شريط علوي صغير يوضح نوع الطلب إذا كان استبدال */}
              {order.order_type === 'replacement' && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl z-10">
                      🔄 طلب استبدال
                  </div>
              )}

              <div>
                  <div className="mb-4 border-b border-white/10 pb-4 mt-2">
                     <h3 className="text-xl font-bold text-orange-50 mb-2"><User className="w-5 h-5 inline text-amber-400" /> {order.customer_name}</h3>
                     <p className="text-sm text-gray-300 mb-2"><MapPin className="w-4 h-4 inline text-rose-400" /> {order.governorate} - {order.region}</p>
                     
                     {/* 🆕 إضافة اسم موظف المبيعات في البطاقة الخارجية */}
                     {order.sales_employee && (
                         <div className="inline-block bg-sky-900/40 border border-sky-500/30 text-sky-300 text-xs px-2.5 py-1 rounded-lg font-bold">
                             <UserCheck className="w-3.5 h-3.5 inline ml-1" />
                             المبيعات: {order.sales_employee}
                         </div>
                     )}
                  </div>
                  <div className="space-y-3 mb-4 text-sm text-orange-50">
                      <div className="text-teal-300 font-bold"><PackageCheck className="w-4 h-4 inline" /> السلة المختصرة:</div>
                      
                      <p className="whitespace-pre-wrap leading-relaxed text-gray-300 bg-white/5 p-3 rounded-xl border border-white/10">
                          {order.product_type}
                      </p>
                      
                      <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                          <span className="text-gray-400"><Banknote className="w-4 h-4 inline text-emerald-500" /> السعر المطلوب:</span>
                          <strong className="text-emerald-400 text-lg" dir="ltr">{order.total_price} {order.currency === 'USD' ? '$' : 'د.ع'}</strong>
                      </div>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-black border-2 border-teal-500/50 p-6 rounded-[2rem] max-w-xl w-full max-h-[90vh] overflow-y-auto relative custom-scrollbar">
            <button onClick={() => { setSelectedOrder(null); setTrackingNumber(''); }} className="absolute top-4 left-4 text-gray-400 hover:text-rose-400"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-black text-teal-400 mb-6 border-b border-teal-500/20 pb-4">تفاصيل التجهيز الكاملة</h2>

            <div className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/5">
              <p className="text-lg text-white font-bold mb-1">{selectedOrder.customer_name}</p>
              <p className="text-gray-300 text-sm mb-1">{selectedOrder.governorate} - {selectedOrder.region} {selectedOrder.landmark}</p>
              <p className="text-teal-300 text-sm mb-3" dir="ltr">{selectedOrder.phone1} {selectedOrder.phone2 && `| ${selectedOrder.phone2}`}</p>
              
              {/* 🆕 إضافة اسم موظف المبيعات ورقم الوصل الأصلي في التفاصيل الداخلية */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                  {selectedOrder.sales_employee && (
                      <p className="text-sky-300 text-sm font-bold flex items-center gap-2">
                          <UserCheck className="w-4 h-4" /> 
                          بواسطة المبيعات: {selectedOrder.sales_employee}
                      </p>
                  )}
                  {selectedOrder.order_type === 'replacement' && selectedOrder.original_tracking_number && (
                      <p className="text-amber-400 text-sm font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> 
                          وصل الاستبدال الأصلي: <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded">{selectedOrder.original_tracking_number}</span>
                      </p>
                  )}
              </div>
            </div>

            {selectedOrder.car_brand && (
                <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 mb-4 text-sm">
                    <h3 className="font-bold text-amber-300 mb-2"><CarFront className="w-4 h-4 inline" /> معلومات سيارة الزبون</h3>
                    <p className="text-white">السيارة: <strong>{selectedOrder.car_brand} - {selectedOrder.car_model} ({selectedOrder.car_year})</strong></p>
                </div>
            )}

            <div className="bg-teal-500/10 p-4 rounded-2xl border border-teal-500/30 mb-4 text-sm">
              <h3 className="font-bold text-teal-300 mb-3"><ListTree className="w-4 h-4 inline" /> المنتجات المطلوب تجهيزها:</h3>
              <p className="whitespace-pre-wrap leading-relaxed text-white font-medium text-base">
                  {selectedOrder.product_type}
              </p>
            </div>

            <div className="bg-amber-900/30 p-4 rounded-2xl border border-amber-500/50 mb-4">
                <label className="text-amber-400 font-bold mb-2 flex items-center gap-2 text-sm"><FileText className="w-4 h-4" /> رقم وصل التوصيل الجديد (إجباري)</label>
                <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="اكتب رقم الوصل هنا..." className="w-full p-3 rounded-xl bg-black/60 border border-amber-500/50 text-white font-bold outline-none focus:border-amber-400" />
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => handleConfirmPreparation(selectedOrder.id)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-black py-3 rounded-2xl font-black text-lg shadow-lg transition-transform active:scale-95">تأكيد التغليف والتحويل للمندوب</button>
              <button onClick={() => handleCancelOrder(selectedOrder.id)} className="w-full bg-rose-900/40 hover:bg-rose-600 text-rose-300 py-3 rounded-2xl font-bold border border-rose-500/30 transition-colors">إلغاء الطلب نهائياً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}