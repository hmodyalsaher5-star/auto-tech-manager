import React, { useState } from 'react'; // 🆕 استدعينا useState
import { FileText, User, Banknote, Archive, RefreshCw, PackageCheck } from 'lucide-react';

export default function ReturnedOrdersTab({ returnedOrders, handleConfirmStockReturn }) {
  // 🆕 متغير حالة لصندوق البحث
  const [searchTerm, setSearchTerm] = useState('');

  if (returnedOrders.length === 0) {
    return (
      <div className="bg-black/40 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl p-10 text-center text-rose-200/50 font-bold text-lg border-dashed">
        لا توجد طلبات بانتظار الاستلام حالياً. المخزن نظيف! ✨
      </div>
    );
  }

  // 🆕 منطق الفلترة الفورية بناءً على اسم الزبون أو رقم الوصل
  const filteredOrders = returnedOrders.filter(order => {
    const customerNameLower = (order.customer_name || '').toLowerCase();
    const trackingNumberLower = (order.tracking_number || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase().trim();

    return customerNameLower.includes(searchLower) || trackingNumberLower.includes(searchLower);
  });

  return (
    <div className="bg-black/40 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
      
      {/* 🆕 صندوق البحث المخصص لسجل الرواجع */}
      <div className="p-6 border-b border-rose-500/20 bg-rose-900/10">
        <div className="max-w-md">
          <div className="relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 ابحث برقم الوصل أو اسم الزبون..." 
              className="w-full p-3.5 rounded-2xl bg-black/60 border border-rose-500/30 text-white placeholder-rose-200/40 focus:border-rose-400 outline-none transition-all shadow-inner text-sm font-bold"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-400 text-xs font-bold transition-colors bg-white/5 px-2 py-1 rounded-lg border border-white/10"
              >
                مسح
              </button>
            )}
          </div>
          <p className="text-xs text-rose-300/60 mt-2 mr-1 font-bold">
            {searchTerm ? `نتائج البحث: تم العثور على ${filteredOrders.length} طلب` : `إجمالي الطلبات الراجعة: ${returnedOrders.length}`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* 🆕 رسالة تنبيه في حال عدم وجود نتائج للبحث */}
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-amber-400/60 font-bold text-lg animate-fadeIn border-t border-rose-500/10">
            ⚠️ لا توجد طلبات تطابق اسم الزبون أو رقم الوصل المكتوب.
          </div>
        ) : (
          <table className="w-full text-sm text-right text-gray-300">
            <thead className="text-xs text-rose-300 uppercase bg-rose-900/30 border-b border-rose-500/30">
              <tr>
                <th className="px-4 py-5 font-bold"><FileText className="w-4 h-4 inline mr-1"/> رقم الوصل</th>
                <th className="px-4 py-5 font-bold"><User className="w-4 h-4 inline mr-1"/> اسم العميل والتفاصيل</th>
                <th className="px-4 py-5 font-bold text-center"><Banknote className="w-4 h-4 inline mr-1"/> المبالغ والمستحقات</th>
                <th className="px-4 py-5 font-bold text-center"><Archive className="w-4 h-4 inline mr-1"/> الإجراء المخزني</th>
              </tr>
            </thead>
            <tbody>
              {/* 🆕 تم تغيير المصفوفة لتقرأ من filteredOrders بدلاً من returnedOrders */}
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-rose-900/10 transition-colors">
                  <td className="px-4 py-5 font-mono text-rose-300 font-bold text-lg tracking-widest" dir="ltr">
                    {order.tracking_number || '---'}
                  </td>
                  <td className="px-4 py-5 text-white font-bold text-base">
                     <div className="flex flex-col gap-1">
                         <span>{order.customer_name}</span>
                         {order.status === 'replaced' && (
                            <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-1 rounded-md border border-amber-500/30 w-fit">
                                🔄 بانتظار استلام القطعة التالفة القديمة
                            </span>
                         )}
                         {order.order_type === 'replacement' && (
                            <span className="bg-sky-500/20 text-sky-300 text-xs px-2 py-1 rounded-md border border-sky-500/30 w-fit">
                                يطابق وصل أصلي: <span dir="ltr" className="font-mono">{order.original_tracking_number}</span>
                            </span>
                         )}
                     </div>
                     <div className="text-xs text-gray-500 mt-1 font-normal">المحافظة: {order.governorate}</div>
                  </td>
                  
                  <td className="px-4 py-5 text-center font-bold text-lg" dir="ltr">
                    {order.status === 'returned' ? (
                      <span className="text-gray-400 line-through decoration-rose-500">{order.total_price}</span>
                    ) : (
                      <div className="flex flex-col items-center">
                         <span className="text-emerald-400">{order.total_price}</span>
                         <span className="text-[10px] text-emerald-300">مُحصل (مُقيد بحسابات الواصل)</span>
                      </div>
                    )}
                     <span className="text-sm font-normal text-gray-400 ml-1">{order.currency === 'USD' ? '$' : 'د.ع'}</span>
                  </td>
                  
                  <td className="px-4 py-5 text-center">
                    <button 
                      onClick={() => handleConfirmStockReturn(order.id, order.customer_name, order.status)}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto shadow-[0_0_15px_rgba(225,29,72,0.3)]"
                    >
                      <PackageCheck className="w-5 h-5" /> 
                      {order.status === 'replaced' ? 'تأكيد استلام القطعة التالفة للمخزن' : 'تأكيد استلام القطع للمخزن'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="m-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl text-amber-300 text-sm flex items-center gap-2">
         <span className="text-xl">⚠️</span> 
         ملاحظة: عند استلام القطع الراجعة أو المستبدلة من المندوب والضغط على التأكيد، سيختفي الطلب من هذا السجل نهائياً وتعود بضاعته لرفوف المخزن.
      </div>
    </div>
  );
}