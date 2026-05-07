import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  Truck, MapPin, Phone, User, CheckCircle, XCircle, 
  RefreshCw, FileText, Banknote, MessageCircle 
} from 'lucide-react';

export default function DeliveryTracking() {
  const [shippedOrders, setShippedOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // للنافذة المنبثقة (لكتابة سبب الراجع أو الاستبدال)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionType, setActionType] = useState(''); 
  const [deliveryNote, setDeliveryNote] = useState('');

  // 1. جلب الطلبات التي قيد الشحن (مع المندوب)
  const fetchShippedOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'shipped') 
      .order('created_at', { ascending: true });

    if (!error) setShippedOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchShippedOrders();
  }, []);

  // 2. تأكيد الوصول بنجاح (يحولها لسجل المحاسب)
  const handleDelivered = async (orderId, customerName) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من تسليم طلب (${customerName}) واستلام المبلغ؟`);
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' }) 
      .eq('id', orderId);

    if (error) {
      alert("خطأ: " + error.message);
    } else {
      alert("تم تأكيد التسليم! الطلب الآن في سجل الحسابات. ✅");
      fetchShippedOrders();
    }
  };

  // 3. فتح نافذة الراجع أو الاستبدال
  const openActionModal = (order, type) => {
    setSelectedOrder(order);
    setActionType(type);
    setDeliveryNote('');
    setModalOpen(true);
  };

  // 4. تنفيذ الراجع أو الاستبدال مع الملاحظة
  const submitAction = async () => {
    if (!deliveryNote.trim()) return alert("⚠️ يرجى كتابة سبب الإرجاع أو الاستبدال.");

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: actionType, 
        delivery_notes: deliveryNote 
      })
      .eq('id', selectedOrder.id);

    if (error) {
      alert("خطأ: " + error.message);
    } else {
      alert("تم تسجيل الحالة بنجاح وسيتم تحويلها للسجل المخصص! 🔄");
      setModalOpen(false);
      fetchShippedOrders();
    }
  };

  if (loading) return <div className="text-sky-400 text-center p-10 font-bold text-xl animate-pulse">جاري متابعة المندوبين... 🚚</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-sky-400 mb-8 flex items-center gap-3 border-b border-sky-500/20 pb-4">
        <Truck className="w-8 h-8" />
        متابعة المندوبين (تأكيد الوصول أو الراجع)
      </h2>

      {shippedOrders.length === 0 ? (
        <div className="bg-white/5 p-10 rounded-3xl border border-dashed border-white/20 text-center text-sky-200/50 font-bold text-lg">
          لا توجد طلبات مع المندوبين حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shippedOrders.map((order) => (
            <div key={order.id} className="bg-gradient-to-b from-slate-800 to-black/60 backdrop-blur-xl border border-sky-500/30 p-6 rounded-[2rem] shadow-2xl flex flex-col justify-between">
              
              <div>
                  <div className="mb-4">
                     <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                         <User className="w-5 h-5 text-sky-400" /> {order.customer_name}
                     </h3>
                     <p className="text-sm text-gray-300 flex items-center gap-2 mb-2 bg-white/5 p-2 rounded-lg">
                         <MapPin className="w-4 h-4 text-rose-400" /> {order.governorate} - {order.region}
                     </p>
                     <p className="text-sm text-sky-300 font-mono flex items-center gap-2 bg-sky-900/20 p-2 rounded-lg border border-sky-500/10" dir="ltr">
                        <Phone className="w-4 h-4" /> {order.phone1} {order.phone2 && `| ${order.phone2}`}
                     </p>
                  </div>
                  
                  <div className="bg-black/50 p-3 rounded-xl border border-dashed border-sky-500/50 mb-4 flex flex-col items-center justify-center gap-1">
                      <span className="text-sky-400 text-xs font-bold flex items-center gap-1">
                          <FileText className="w-4 h-4" /> رقم وصل التوصيل للمتابعة:
                      </span>
                      <strong className="text-white font-black text-xl tracking-widest" dir="ltr">
                          {order.tracking_number || '---'}
                      </strong>
                  </div>

                  <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-500/30 mb-6 flex justify-between items-center">
                     <span className="text-emerald-400 font-bold text-sm flex items-center gap-1"><Banknote className="w-4 h-4" /> السعر المطلوب:</span>
                     <strong className="text-emerald-400 font-black text-2xl" dir="ltr">
                        {order.total_price} <span className="text-sm">{order.currency === 'USD' ? '$' : 'د.ع'}</span>
                     </strong>
                  </div>
              </div>
              
              {/* 🆕 أزرار تأكيد الحالات */}
              <div className="flex flex-col gap-2 mt-2">
                  <button 
                    onClick={() => handleDelivered(order.id, order.customer_name)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-extrabold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" /> تم استلام الطلب بنجاح
                  </button>
                  
                  <div className="flex gap-2">
                      <button 
                        onClick={() => openActionModal(order, 'returned')}
                        className="flex-1 bg-rose-900/40 border border-rose-500/50 hover:bg-rose-600/60 hover:border-rose-400 text-rose-200 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> راجع
                      </button>
                      
                      <button 
                        onClick={() => openActionModal(order, 'replaced')}
                        className="flex-1 bg-amber-900/40 border border-amber-500/50 hover:bg-amber-600/60 hover:border-amber-400 text-amber-200 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" /> استبدال
                      </button>
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🆕 النافذة المنبثقة لكتابة سبب الراجع أو الاستبدال */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border-2 border-sky-500/50 p-6 rounded-[2rem] max-w-md w-full shadow-2xl">
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${actionType === 'returned' ? 'text-rose-400' : 'text-amber-400'}`}>
              {actionType === 'returned' ? <><XCircle className="w-6 h-6"/> تسجيل كطلب راجع</> : <><RefreshCw className="w-6 h-6"/> تسجيل كطلب استبدال</>}
            </h3>
            
            <p className="text-gray-300 mb-4 text-sm bg-white/5 p-3 rounded-xl border border-white/10">
                العميل: <strong className="text-white">{selectedOrder?.customer_name}</strong>
                <br/>رقم الوصل: <span dir="ltr" className="text-sky-400 font-mono">{selectedOrder?.tracking_number}</span>
            </p>
            
            <label className="block text-sky-300 mb-2 font-bold text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> سبب الحالة والملاحظات (إجباري):
            </label>
            <textarea 
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder={actionType === 'returned' ? "مثال: العميل لم يرد على المندوب..." : "مثال: استبدال بسبب كسر بالشاشة..."}
              className="w-full p-4 rounded-xl bg-black/60 border border-sky-500/30 text-white outline-none focus:border-sky-500 min-h-[120px] mb-6 transition-all"
            />
            
            <div className="flex gap-3">
              <button onClick={submitAction} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-3 rounded-xl font-bold transition-all">تأكيد وتحويل</button>
              <button onClick={() => setModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-all">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}