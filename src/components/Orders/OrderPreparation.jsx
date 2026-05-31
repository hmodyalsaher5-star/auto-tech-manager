import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
// تم دمج جميع الأيقونات المطلوبة لقسم التجهيز والرواجع
import { 
  ClipboardList, PackageCheck, User, MapPin, X, Banknote, FileText, 
  Trash2, CarFront, ListTree, UserCheck, XCircle, Archive, RefreshCw 
} from 'lucide-react';

export default function OrderPreparation() {
  // 🆕 حالة التبويبة النشطة
  const [activeTab, setActiveTab] = useState('preparation'); // 'preparation' | 'returns'

  // حالات قسم التجهيز
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');

  // 🆕 حالات قسم الرواجع
  const [returnedOrders, setReturnedOrders] = useState([]);
  const [returnSearchTerm, setReturnSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);

  // جلب البيانات للقسمين معاً لتشغيل العدادات
  const fetchAllData = async () => {
    setLoading(true);
    
    const [pendingRes, returnedRes] = await Promise.all([
      supabase.from('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').in('status', ['returned', 'replaced']).order('created_at', { ascending: false })
    ]);

    if (!pendingRes.error) setOrders(pendingRes.data || []);
    if (!returnedRes.error) setReturnedOrders(returnedRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ==========================================
  // دوال قسم التجهيز
  // ==========================================
  const handleConfirmPreparation = async (orderId) => {
    if (!trackingNumber.trim()) return alert("⚠️ يرجى إدخال رقم الوصل الخاص بشركة التوصيل أولاً.");
    if (!window.confirm(`تأكيد تسليم الطلب برقم الوصل: ${trackingNumber}؟`)) return;

    const { error } = await supabase.from('orders').update({ status: 'ready_for_delivery', tracking_number: trackingNumber }).eq('id', orderId);
    if (!error) {
      alert("تم تحويل الطلب إلى قسم المندوب بنجاح! 🚚");
      setTrackingNumber(''); setSelectedOrder(null); fetchAllData();
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
        fetchAllData(); 
    }
  };

  // ==========================================
  // 🆕 دالة قسم الرواجع
  // ==========================================
  const handleConfirmStockReturn = async (orderId, customerName) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من استلام بضاعة (${customerName}) وإعادتها للمخزن؟`);
    if (!isConfirmed) return;

    const { error } = await supabase.from('orders').update({ status: 'returned_to_stock' }).eq('id', orderId);

    if (error) {
      alert("حدث خطأ أثناء التأكيد: " + error.message);
    } else {
      alert("تم تأكيد استلام البضاعة، وتم إرجاعها لرفوف المخزن بنجاح! 📦✅");
      fetchAllData(); 
    }
  };

  // 🆕 الفلترة الفورية للرواجع
  const filteredReturns = returnedOrders.filter(order => {
    const customerNameLower = (order.customer_name || '').toLowerCase();
    const trackingNumberLower = (order.tracking_number || '').toLowerCase();
    const searchLower = returnSearchTerm.toLowerCase().trim();
    return customerNameLower.includes(searchLower) || trackingNumberLower.includes(searchLower);
  });

  if (loading) return <div className="text-teal-400 text-center p-10 font-bold text-xl animate-pulse">جاري جلب البيانات... ⏳</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-teal-400 mb-6 flex items-center gap-3 border-b border-teal-500/20 pb-4">
        <ClipboardList className="w-8 h-8" /> 
        إدارة التجهيز والمخزن
      </h2>

      {/* 🆕 شريط التبويبات (Tabs) */}
      <div className="flex flex-wrap gap-4 mb-8 bg-black/40 p-2 rounded-2xl w-fit border border-white/5 shadow-lg">
        <button 
          onClick={() => setActiveTab('preparation')} 
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'preparation' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <PackageCheck className="w-4 h-4" /> بانتظار التغليف ({orders.length})
        </button>
        <button 
          onClick={() => setActiveTab('returns')} 
          className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'returns' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'}`}
        >
          <XCircle className="w-4 h-4" /> سجل الرواجع والاستبدال ({returnedOrders.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* 📦 تبويبة التجهيز والتغليف */}
      {/* ======================================================== */}
      {activeTab === 'preparation' && (
        <div className="animate-fadeIn">
          {orders.length === 0 ? (
            <div className="bg-white/5 p-10 rounded-3xl border border-dashed text-center text-gray-400 font-bold text-lg">لا توجد طلبات بانتظار التغليف حالياً ☕</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.map((order) => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer bg-black/40 border border-teal-500/30 p-6 rounded-[2rem] hover:border-teal-400 transition-all flex flex-col justify-between relative overflow-hidden shadow-xl">
                  {order.order_type === 'replacement' && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl z-10">
                          🔄 طلب استبدال
                      </div>
                  )}

                  <div>
                      <div className="mb-4 border-b border-white/10 pb-4 mt-2">
                         <h3 className="text-xl font-bold text-orange-50 mb-2"><User className="w-5 h-5 inline text-amber-400" /> {order.customer_name}</h3>
                         <p className="text-sm text-gray-300 mb-2"><MapPin className="w-4 h-4 inline text-rose-400" /> {order.governorate} - {order.region}</p>
                         
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

          {/* نافذة تفاصيل التجهيز */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="bg-black border-2 border-teal-500/50 p-6 rounded-[2rem] max-w-xl w-full max-h-[90vh] overflow-y-auto relative custom-scrollbar shadow-2xl">
                <button onClick={() => { setSelectedOrder(null); setTrackingNumber(''); }} className="absolute top-4 left-4 text-gray-400 hover:text-rose-400"><X className="w-6 h-6" /></button>
                <h2 className="text-2xl font-black text-teal-400 mb-6 border-b border-teal-500/20 pb-4">تفاصيل التجهيز الكاملة</h2>

                <div className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/5">
                  <p className="text-lg text-white font-bold mb-1">{selectedOrder.customer_name}</p>
                  <p className="text-gray-300 text-sm mb-1">{selectedOrder.governorate} - {selectedOrder.region} {selectedOrder.landmark}</p>
                  <p className="text-teal-300 text-sm mb-3" dir="ltr">{selectedOrder.phone1} {selectedOrder.phone2 && `| ${selectedOrder.phone2}`}</p>
                  
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
      )}

      {/* ======================================================== */}
      {/* 🔄 تبويبة الرواجع للمخزن */}
      {/* ======================================================== */}
      {activeTab === 'returns' && (
        <div className="animate-fadeIn">
          {returnedOrders.length === 0 ? (
            <div className="bg-black/40 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl p-10 text-center text-rose-200/50 font-bold text-lg border-dashed">
              لا توجد طلبات بانتظار الاستلام حالياً. المخزن نظيف! ✨
            </div>
          ) : (
            <>
              {/* صندوق بحث الرواجع */}
              <div className="mb-6 max-w-md">
                <div className="relative">
                  <input 
                    type="text" 
                    value={returnSearchTerm}
                    onChange={(e) => setReturnSearchTerm(e.target.value)}
                    placeholder="🔍 ابحث برقم الوصل أو اسم الزبون المرتجع..." 
                    className="w-full p-3.5 rounded-2xl bg-black/40 border border-rose-500/30 text-white placeholder-rose-200/40 focus:border-rose-400 outline-none transition-all shadow-inner text-sm font-bold"
                  />
                  {returnSearchTerm && (
                    <button 
                      onClick={() => setReturnSearchTerm('')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-400 text-xs font-bold transition-colors bg-white/5 px-2 py-1 rounded-lg border border-white/10"
                    >
                      مسح
                    </button>
                  )}
                </div>
                <p className="text-xs text-rose-300/60 mt-2 mr-1 font-bold">
                  {returnSearchTerm ? `نتائج البحث: تم العثور على ${filteredReturns.length} طرد مرتجع` : `إجمالي الطرود بانتظار الجرد: ${returnedOrders.length}`}
                </p>
              </div>

              <div className="bg-black/40 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  {filteredReturns.length === 0 ? (
                    <div className="p-12 text-center text-amber-400/60 font-bold text-lg animate-fadeIn bg-rose-900/5">
                      ⚠️ لا توجد طرود مرتجعة تطابق معايير البحث المكتوبة.
                    </div>
                  ) : (
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
                        {filteredReturns.map((order) => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-rose-900/10 transition-colors">
                            
                            <td className="px-4 py-5 font-mono text-rose-300 font-bold text-lg tracking-widest" dir="ltr">
                              {order.tracking_number || '---'}
                            </td>
                            
                            <td className="px-4 py-5 text-white font-bold text-base">
                               {order.customer_name}
                               
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

                            <td className="px-4 py-5 text-center font-bold text-lg text-gray-400 line-through decoration-rose-500" dir="ltr">
                              {order.total_price} <span className="text-sm font-normal">{order.currency === 'USD' ? '$' : 'د.ع'}</span>
                            </td>

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
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl text-amber-300 text-sm flex items-center gap-2">
                 <span className="text-xl">⚠️</span> 
                 ملاحظة للمخزن: تأكد من فحص البضاعة ومطابقتها مع رقم الوصل قبل الضغط على زر التأكيد.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}