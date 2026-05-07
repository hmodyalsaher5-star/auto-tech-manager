import React from 'react';
import { FileText, User, Banknote, Archive, RefreshCw, PackageCheck } from 'lucide-react';

export default function ReturnedOrdersTab({ returnedOrders, handleConfirmStockReturn }) {
  if (returnedOrders.length === 0) {
    return (
      <div className="bg-black/40 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl p-10 text-center text-rose-200/50 font-bold text-lg border-dashed">
        لا توجد طلبات بانتظار الاستلام حالياً. المخزن نظيف! ✨
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
      <div className="overflow-x-auto">
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
            {returnedOrders.map((order) => (
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
      </div>
      <div className="m-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-2xl text-amber-300 text-sm flex items-center gap-2">
         <span className="text-xl">⚠️</span> 
         ملاحظة: عند استلام القطع الراجعة أو المستبدلة من المندوب والضغط على التأكيد، سيختفي الطلب من هذا السجل نهائياً وتعود بضاعته لرفوف المخزن.
      </div>
    </div>
  );
}