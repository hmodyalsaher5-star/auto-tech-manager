import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { 
  ClipboardList, PackageCheck, User, MapPin, 
  MonitorPlay, Maximize, Frame, Wrench, X, Banknote, FileText, PenTool 
} from 'lucide-react'; // 🆕 أضفنا PenTool للأيقونة

export default function OrderPreparation() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [trackingNumber, setTrackingNumber] = useState('');

  const [sizesDict, setSizesDict] = useState([]);
  const [screensDict, setScreensDict] = useState([]);
  const [framesDict, setFramesDict] = useState([]);

  const fetchOrdersAndDetails = async () => {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('خطأ في جلب الطلبات:', error.message);
    } else {
      setOrders(ordersData || []);
    }

    const { data: sizes } = await supabase.from('standard_sizes').select('id, size_name');
    const { data: screens } = await supabase.from('screens').select('id, name');
    const { data: frames } = await supabase.from('frames').select('id, name');

    setSizesDict(sizes || []);
    setScreensDict(screens || []);
    setFramesDict(frames || []);

    setLoading(false);
  };

  const handleConfirmPreparation = async (orderId) => {
    if (!trackingNumber.trim()) {
      alert("⚠️ يرجى إدخال رقم الوصل الخاص بشركة التوصيل أولاً.");
      return;
    }

    const isConfirmed = window.confirm(`هل أنت متأكد من تسليم الطلب برقم الوصل: ${trackingNumber}؟`);
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'ready_for_delivery',
        tracking_number: trackingNumber 
      })
      .eq('id', orderId);

    if (error) {
      alert("حدث خطأ أثناء التحديث: " + error.message);
    } else {
      alert("تم تحويل الطلب إلى قسم التوصيل بنجاح! 🚚");
      setTrackingNumber(''); 
      fetchOrdersAndDetails();
      setSelectedOrder(null);
    }
  };

  useEffect(() => {
    fetchOrdersAndDetails();
  }, []);

  const getSizeName = (id) => sizesDict.find(s => String(s.id) === String(id))?.size_name || 'غير محدد';
  const getScreenName = (id) => screensDict.find(s => String(s.id) === String(id))?.name || 'بدون شاشة';
  const getFrameName = (id) => framesDict.find(s => String(s.id) === String(id))?.name || 'بدون فريم';

  if (loading) return <div className="text-teal-400 text-center p-10 font-bold text-xl animate-pulse">جاري جلب تفاصيل المخزن... 🚚</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-teal-400 mb-8 flex items-center gap-3 border-b border-teal-500/20 pb-4">
        <ClipboardList className="w-8 h-8" />
        قسم التجهيز (طلبات بانتظار التغليف)
      </h2>

      {orders.length === 0 ? (
        <div className="bg-white/5 p-10 rounded-3xl border border-dashed border-white/20 text-center text-gray-400 font-bold text-lg">
          عمل رائع! المخزن فارغ حالياً ☕
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="cursor-pointer bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-xl border border-teal-500/30 p-6 rounded-[2rem] shadow-2xl hover:border-teal-400 transition-all flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-amber-500 group-hover:h-2 transition-all"></div>

              <div>
                  <div className="mb-5 border-b border-white/10 pb-4">
                     <h3 className="text-xl font-bold text-orange-50 mb-2 flex items-center gap-2">
                         <User className="w-5 h-5 text-amber-400" /> {order.customer_name}
                     </h3>
                     <p className="text-sm text-gray-300 flex items-center gap-2 mb-1">
                         <MapPin className="w-4 h-4 text-rose-400" /> {order.governorate} - {order.region}
                     </p>
                  </div>
                  
                  <div className="space-y-3 mb-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                      <h4 className="text-teal-300 font-bold text-sm mb-3 flex items-center gap-2">
                          <PackageCheck className="w-4 h-4" /> ملخص سريع:
                      </h4>
                      
                      {/* 🆕 تنبيه وجود طلب يدوي في البطاقة المصغرة */}
                      {order.manual_details && (
                          <div className="mb-3 bg-amber-500/20 text-amber-300 p-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-amber-500/30">
                              <PenTool className="w-4 h-4" />
                              يوجد طلب يدوي مخصص! (افتح للتفاصيل)
                          </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-orange-50">
                          <Maximize className="w-4 h-4 text-gray-400" /> 
                          <span className="text-gray-400 text-xs">القياس:</span> 
                          <strong className="text-amber-400">{getSizeName(order.screen_size_id)}</strong>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                         <span className="text-gray-400 text-xs flex items-center gap-1"><Banknote className="w-4 h-4 text-emerald-500" /> السعر:</span>
                         <strong className="text-emerald-400 font-black text-lg" dir="ltr">
                            {order.total_price} <span className="text-sm font-normal">{order.currency === 'USD' ? '$' : 'د.ع'}</span>
                         </strong>
                      </div>
                  </div>
              </div>
              
              <div className="w-full mt-2 bg-white/5 text-gray-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 border border-white/10">
                اضغط هنا لفتح الطلب وإدخال رقم الوصل
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-br from-[#1a0f07] to-black border-2 border-teal-500/50 p-8 rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_0_50px_rgba(20,184,166,0.2)]">
            
            <button 
              onClick={() => {
                setSelectedOrder(null);
                setTrackingNumber(''); 
              }} 
              className="absolute top-6 left-6 text-gray-400 hover:text-rose-400 hover:rotate-90 transition-all bg-white/5 p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-black text-teal-400 mb-8 border-b border-teal-500/20 pb-4 flex items-center gap-3">
              <ClipboardList className="w-8 h-8" /> تفاصيل طلب التجهيز
            </h2>

            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
              <h3 className="text-xl font-bold text-amber-400 mb-4 border-b border-white/10 pb-2 font-black italic underline decoration-amber-500/50 underline-offset-8">بيانات العميل</h3>
              <p className="text-lg text-white mb-2 font-bold">{selectedOrder.customer_name}</p>
              <p className="text-gray-300 mb-2">العنوان: {selectedOrder.governorate} - {selectedOrder.region} {selectedOrder.landmark && `(${selectedOrder.landmark})`}</p>
              <p className="text-teal-300 font-mono text-lg" dir="ltr">{selectedOrder.phone1} {selectedOrder.phone2 && `| ${selectedOrder.phone2}`}</p>
            </div>

            <div className="bg-gradient-to-l from-emerald-900/40 to-black/60 p-6 rounded-2xl border border-emerald-500/30 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
               <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                 <Banknote className="w-6 h-6" /> السعر المطلوب تحصيله:
               </h3>
               <div className="text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" dir="ltr">
                  {selectedOrder.total_price} <span className="text-emerald-400 text-2xl ml-1 font-bold">{selectedOrder.currency === 'USD' ? '$' : 'د.ع'}</span>
               </div>
            </div>

            {/* 🆕 قسم خاص لعرض النص اليدوي إن وجد */}
            {selectedOrder.manual_details && (
              <div className="bg-amber-900/20 p-6 rounded-2xl border border-amber-500/50 mb-6 shadow-inner">
                <h3 className="text-xl font-bold text-amber-400 mb-4 border-b border-amber-500/30 pb-2 flex items-center gap-2">
                  <PenTool className="w-6 h-6" /> تفاصيل الطلب اليدوي (مهم جداً):
                </h3>
                <p className="text-white text-lg whitespace-pre-wrap leading-relaxed">
                  {selectedOrder.manual_details}
                </p>
              </div>
            )}

            <div className="bg-teal-500/10 p-6 rounded-2xl border border-teal-500/30 mb-6">
              <h3 className="text-xl font-bold text-teal-300 mb-4 border-b border-teal-500/20 pb-2 flex items-center gap-2">
                <PackageCheck className="w-6 h-6" /> القطع المراد سحبها من المخزن (حسب القوائم)
              </h3>
              
              <ul className="space-y-4 text-lg">
                {selectedOrder.screen_size_id && (
                    <li className="flex items-center gap-3">
                      <Maximize className="w-6 h-6 text-amber-500" />
                      <span className="text-gray-300 w-24 text-sm">القياس:</span>
                      <strong className="text-white bg-amber-500/20 px-3 py-1 rounded-lg border border-amber-500/30">{getSizeName(selectedOrder.screen_size_id)}</strong>
                    </li>
                )}
                {selectedOrder.screen_id && (
                  <li className="flex items-center gap-3">
                    <MonitorPlay className="w-6 h-6 text-blue-400" />
                    <span className="text-gray-300 w-24 text-sm">الشاشة:</span>
                    <strong className="text-white bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/30">{getScreenName(selectedOrder.screen_id)}</strong>
                  </li>
                )}
                {selectedOrder.frame_id && (
                  <li className="flex items-center gap-3">
                    <Frame className="w-6 h-6 text-purple-400" />
                    <span className="text-gray-300 w-24 text-sm">الفريم:</span>
                    <strong className="text-white bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-500/30">{getFrameName(selectedOrder.frame_id)}</strong>
                  </li>
                )}
                {(!selectedOrder.screen_size_id && !selectedOrder.screen_id && !selectedOrder.frame_id) && (
                  <li className="text-gray-500 text-sm italic">لا توجد قطع محددة من القوائم الجاهزة.</li>
                )}
              </ul>
            </div>

            {selectedOrder.other_products && selectedOrder.other_products.length > 0 && (
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5 mb-6">
                <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5" /> إكسسوارات إضافية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedOrder.other_products.map((item, idx) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-xl border border-emerald-500/20 text-orange-50 font-medium flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-amber-900/30 p-6 rounded-2xl border border-amber-500/50 mb-6">
                <label className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> رقم وصل التوصيل (إجباري)
                </label>
                <input 
                    type="text" 
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="اكتب رقم الوصل الموجود على الكرتون..."
                    className="w-full p-4 rounded-xl bg-black/60 border border-amber-500/50 text-white font-bold outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                />
            </div>

            <button 
              onClick={() => handleConfirmPreparation(selectedOrder.id)}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-black py-4 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <PackageCheck className="w-7 h-7" /> تأكيد التغليف والتحويل للتوصيل
            </button>
          </div>
        </div>
      )}
    </div>
  );
}