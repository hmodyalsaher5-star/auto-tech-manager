import React from 'react';
// 🆕 1. قمنا بإضافة أيقونة UserCheck إلى قائمة الاستيراد
import { MapPin, Phone, User, CheckCircle, XCircle, Banknote, FileText, RefreshCw, UserCheck } from 'lucide-react';

export default function ShippedOrdersTab({ shippedOrders, handlePaymentReceived, handleReplacedOrder, handleReturnedOrder }) {
  if (shippedOrders.length === 0) {
    return (
      <div className="bg-white/5 p-10 rounded-3xl border border-dashed border-white/20 text-center text-sky-200/50 font-bold text-lg">
        لا توجد طلبات قيد الشحن حالياً مع المندوبين! ☕
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shippedOrders.map((order) => (
        <div key={order.id} className="bg-gradient-to-b from-slate-800 to-black/60 backdrop-blur-xl border border-sky-500/30 p-6 rounded-[2rem] shadow-2xl hover:border-sky-400 transition-all flex flex-col justify-between">
          <div>
              <div className="mb-4">
                 <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                     <User className="w-5 h-5 text-sky-400" /> {order.customer_name}
                 </h3>
                 {order.order_type === 'replacement' && (
                    <span className="inline-block bg-amber-500/20 text-amber-300 px-2 py-1 rounded-md text-xs font-bold mb-2 border border-amber-500/30">
                      🔄 طلب استبدال (يوجد استلام قطعة قديمة ومبلغ)
                    </span>
                 )}
                 <p className="text-sm text-gray-300 flex items-center gap-2 mb-2 bg-white/5 p-2 rounded-lg">
                     <MapPin className="w-4 h-4 text-rose-400" /> {order.governorate} - {order.region}
                 </p>
                 <p className="text-sm text-sky-300 font-mono flex items-center gap-2 bg-sky-900/20 p-2 rounded-lg border border-sky-500/10 mb-3" dir="ltr">
                    <Phone className="w-4 h-4" /> {order.phone1} {order.phone2 && `| ${order.phone2}`}
                 </p>

                 {/* 🆕 2. إضافة شارة موظف المبيعات بنفس التصميم الموحد */}
                 {order.sales_employee && (
                     <div className="inline-block bg-sky-900/40 border border-sky-500/30 text-sky-300 text-xs px-2.5 py-1.5 rounded-lg font-bold">
                         <UserCheck className="w-3.5 h-3.5 inline ml-1" />
                         المبيعات: {order.sales_employee}
                     </div>
                 )}
              </div>
              
              <div className="bg-black/50 p-3 rounded-xl border border-dashed border-sky-500/50 mb-4 flex flex-col items-center justify-center gap-1">
                  <span className="text-sky-400 text-xs font-bold flex items-center gap-1"><FileText className="w-4 h-4" /> رقم الوصل:</span>
                  <strong className="text-white font-black text-xl tracking-widest" dir="ltr">{order.tracking_number || 'لم يُسجل'}</strong>
              </div>

              <div className="bg-amber-900/20 p-4 rounded-2xl border border-amber-500/30 mb-6 flex justify-between items-center">
                 <span className="text-amber-400 font-bold text-sm flex items-center gap-1"><Banknote className="w-4 h-4" /> المبلغ المطلوب:</span>
                 <strong className="text-amber-400 font-black text-2xl" dir="ltr">{order.total_price} <span className="text-sm">{order.currency === 'USD' ? '$' : 'د.ع'}</span></strong>
              </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
              <button onClick={() => handlePaymentReceived(order.id, order.customer_name, order.total_price, order.currency)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-extrabold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg">
                <CheckCircle className="w-5 h-5" /> تم التسليم بنجاح
              </button>
              <button onClick={() => handleReplacedOrder(order.id, order.customer_name)} className="w-full bg-amber-600/40 border border-amber-500/50 hover:bg-amber-600/60 hover:text-white text-amber-200 py-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> تم الاستبدال (استلام القطعة القديمة والمبلغ)
              </button>
              <button onClick={() => handleReturnedOrder(order.id, order.customer_name)} className="w-full bg-rose-900/40 border border-rose-500/50 hover:bg-rose-600/60 hover:text-white text-rose-200 py-2.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> الطلب راجع (إلغاء وإرجاع)
              </button>
          </div>
        </div>
      ))}
    </div>
  );
}