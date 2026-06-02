import React, { useState } from 'react'; // 🆕 استدعينا useState
import { FileText, User, Calculator, Save, ChevronDown, ChevronUp, CarFront, Package, CheckSquare, UserCheck } from 'lucide-react';

export default function DeliveredOrdersTab({ 
  deliveredOrders, financialInputs, handleInputChange, saveFinancials, 
  expandedRows, toggleRow, 
  selectedForSettlement, handleToggleSelectOrder, handleSelectAll, handleCreateSettlement 
}) {
  // 🆕 متغير حالة لصندوق البحث
  const [searchTerm, setSearchTerm] = useState('');

  if (deliveredOrders.length === 0) {
    return <div className="bg-black/40 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl p-10 text-center text-gray-400 font-bold">السجل المالي فارغ.</div>;
  }

  const isAllSelected = deliveredOrders.length > 0 && selectedForSettlement.length === deliveredOrders.length;

  // 🆕 منطق الفلترة الفورية بناءً على اسم الزبون أو رقم الوصل
  const filteredOrders = deliveredOrders.filter(order => {
    const customerNameLower = (order.customer_name || '').toLowerCase();
    const trackingNumberLower = (order.tracking_number || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase().trim();

    return customerNameLower.includes(searchLower) || trackingNumberLower.includes(searchLower);
  });

  return (
    <div className="bg-black/40 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn relative pb-20">
      
      {/* 🆕 صندوق البحث المخصص لصفحة الحسابات */}
      <div className="p-6 border-b border-emerald-500/20 bg-emerald-900/10">
        <div className="max-w-md">
          <div className="relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 ابحث برقم الوصل أو اسم الزبون..." 
              className="w-full p-3.5 rounded-2xl bg-black/60 border border-emerald-500/30 text-white placeholder-emerald-200/40 focus:border-emerald-400 outline-none transition-all shadow-inner text-sm font-bold"
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
          <p className="text-xs text-emerald-300/60 mt-2 mr-1 font-bold">
            {searchTerm ? `نتائج البحث: تم العثور على ${filteredOrders.length} طلب` : `إجمالي الطلبات الواصلة للتحاسب: ${deliveredOrders.length}`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        {/* 🆕 رسالة تنبيه في حال عدم وجود نتائج للبحث */}
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-amber-400/60 font-bold text-lg animate-fadeIn border-t border-emerald-500/10">
            ⚠️ لا توجد طلبات تطابق اسم الزبون أو رقم الوصل المكتوب.
          </div>
        ) : (
          <table className="w-full text-sm text-right text-gray-300">
            <thead className="text-xs text-emerald-300 uppercase bg-emerald-900/30 border-b border-emerald-500/30">
              <tr>
                <th className="px-4 py-5 text-center w-12">
                   <input 
                     type="checkbox" 
                     checked={isAllSelected}
                     onChange={() => handleSelectAll(isAllSelected)}
                     className="w-5 h-5 accent-emerald-500 cursor-pointer"
                   />
                </th>
                <th className="px-4 py-5 font-bold"><FileText className="w-4 h-4 inline mr-1"/> رقم الوصل</th>
                <th className="px-4 py-5 font-bold min-w-[200px]"><User className="w-4 h-4 inline mr-1"/> العميل / المبيعات</th>
                <th className="px-4 py-5 font-bold bg-rose-900/10 text-rose-300 text-center">التكلفة (تعديل)</th>
                <th className="px-4 py-5 font-bold bg-blue-950/40 text-blue-300 text-center">مبلغ الحافز</th>
                <th className="px-4 py-5 font-bold bg-purple-950/40 text-purple-300 text-center">المطلوب للمحل</th>
                
                {/* 🆕 حقل سعر البيع (سابقاً كان مجرد نص يعرض السعر، الآن أصبح حقل إدخال) */}
                <th className="px-4 py-5 font-bold text-center">سعر البيع (تعديل)</th>
                
                <th className="px-4 py-5 font-bold bg-orange-900/10 text-orange-300 text-center">سعر التوصيل</th>
                <th className="px-4 py-5 font-bold bg-emerald-900/20 text-emerald-300 text-center"><Calculator className="w-4 h-4 inline mr-1"/> صافي الربح</th>
                <th className="px-4 py-5 font-bold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {/* 🆕 تم تغيير المصفوفة هنا لتقرأ من filteredOrders بدلاً من deliveredOrders */}
              {filteredOrders.map((order) => {
                const inputs = financialInputs[order.id] || {};
                
                // 🆕 جلب وتعديل سعر البيع
                const displaySellingPrice = (inputs.totalPrice !== undefined && inputs.totalPrice !== "") 
                  ? inputs.totalPrice 
                  : (order.total_price || 0);
                const sellingPrice = parseFloat(displaySellingPrice) || 0;
                
                // معالجة وجلب التكلفة الافتراضية
                const displayOriginalPrice = (inputs.originalPrice !== undefined && inputs.originalPrice !== "" && inputs.originalPrice !== 0 && inputs.originalPrice !== "0") 
                  ? inputs.originalPrice 
                  : (order.cost_price || 0);
                const originalPrice = parseFloat(displayOriginalPrice) || 0;
                
                // معالجة وجلب الحافز الافتراضي
                const displayIncentive = (inputs.incentive !== undefined && inputs.incentive !== "") 
                  ? inputs.incentive 
                  : (order.incentive || 0);
                const incentiveAmount = parseFloat(displayIncentive) || 0;

                const shopRequired = originalPrice - incentiveAmount;

                const deliveryCost = parseFloat(inputs.deliveryCost !== undefined ? inputs.deliveryCost : 0) || 0;
                
                // 🆕 حساب صافي الربح بناءً على سعر البيع الجديد
                const netProfit = sellingPrice - (originalPrice + deliveryCost);
                
                const isExpanded = expandedRows.includes(order.id);
                const isSelected = selectedForSettlement.includes(order.id);

                return (
                  <React.Fragment key={order.id}>
                    <tr className={`border-b border-white/5 hover:bg-white/5 transition-all ${isSelected ? 'bg-emerald-900/20' : ''}`}>
                      <td className="px-4 py-4 text-center">
                         <input 
                           type="checkbox" 
                           checked={isSelected}
                           onChange={() => handleToggleSelectOrder(order.id)}
                           className="w-5 h-5 accent-emerald-500 cursor-pointer"
                         />
                      </td>
                      <td className="px-4 py-4 font-mono text-white font-bold" dir="ltr">{order.tracking_number || '---'}</td>
                      
                      <td className="px-4 py-4 cursor-pointer group" onClick={() => toggleRow(order.id)}>
                         <div className="flex items-center gap-2 text-emerald-400 font-bold group-hover:text-emerald-300">
                            {order.customer_name} {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                         </div>
                         
                         {order.sales_employee && (
                             <div className="text-sky-300 text-[11px] mt-1.5 flex items-center gap-1 bg-sky-900/30 px-2 py-0.5 rounded border border-sky-500/30 w-fit font-bold">
                                 <UserCheck className="w-3.5 h-3.5" /> المبيعات: {order.sales_employee}
                             </div>
                         )}

                         {order.order_type === 'replacement' && <span className="text-amber-400 text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1 inline-block">استبدال</span>}
                      </td>

                      <td className="px-4 py-4 bg-rose-900/10 text-center">
                          <input 
                            type="number" 
                            value={displayOriginalPrice} 
                            onChange={(e) => handleInputChange(order.id, 'originalPrice', e.target.value)} 
                            className="w-24 p-2 rounded-lg bg-black/60 border border-rose-500/30 text-white font-bold outline-none focus:border-rose-400 text-center text-xs" 
                          />
                      </td>

                      <td className="px-4 py-4 bg-blue-950/20 text-center">
                          <input 
                            type="number" 
                            value={displayIncentive} 
                            onChange={(e) => handleInputChange(order.id, 'incentive', e.target.value)} 
                            placeholder="0"
                            className="w-20 p-2 rounded-lg bg-black/60 border border-blue-500/30 text-blue-300 font-bold outline-none focus:border-blue-400 text-center text-xs" 
                          />
                      </td>

                      <td className="px-4 py-4 bg-purple-950/20 text-center text-purple-300 font-black text-base" dir="ltr">
                          {shopRequired.toLocaleString()}
                      </td>
                      
                      {/* 🆕 حقل سعر البيع المحدث ليكون قابلاً للتعديل */}
                      <td className="px-4 py-4 text-center">
                          <input 
                            type="number" 
                            value={displaySellingPrice} 
                            onChange={(e) => handleInputChange(order.id, 'totalPrice', e.target.value)} 
                            className="w-24 p-2 rounded-lg bg-black/60 border border-emerald-500/30 text-white font-bold outline-none focus:border-emerald-400 text-center text-sm" 
                          />
                      </td>
                      
                      <td className="px-4 py-4 bg-orange-900/10 text-center">
                          <input 
                            type="number" 
                            value={inputs.deliveryCost !== undefined ? inputs.deliveryCost : 0} 
                            onChange={(e) => handleInputChange(order.id, 'deliveryCost', e.target.value)} 
                            className="w-20 p-2 rounded-lg bg-black/60 border border-orange-500/30 text-white outline-none focus:border-orange-400 text-center text-xs" 
                          />
                      </td>
                      
                      <td className="px-4 py-4 bg-emerald-900/10 text-center">
                          <span className={`font-black text-xl flex justify-center ${netProfit > 0 ? 'text-emerald-400' : netProfit < 0 ? 'text-rose-500' : 'text-gray-400'}`} dir="ltr">
                              {netProfit > 0 ? '+' : ''}{netProfit}
                          </span>
                      </td>
                      
                      <td className="px-4 py-4 text-center">
                          <button onClick={() => saveFinancials(order.id)} className="bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/50 p-2 rounded-lg shadow-md transition-all active:scale-95" title="حفظ البيانات المالية للملف"><Save className="w-5 h-5" /></button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-black/60 border-b border-emerald-500/20 shadow-inner">
                        <td colSpan="10" className="px-6 py-5">
                           <div className="flex flex-col gap-3 text-right">
                              {order.car_brand && (<div className="text-amber-300 font-bold flex items-center gap-2"><CarFront className="w-5 h-5" /> السيارة: {order.car_brand} - {order.car_model} ({order.car_year})</div>)}
                              <div className="bg-white/5 p-4 rounded-xl border border-white/10"><h4 className="text-emerald-300 font-bold mb-2 flex items-center gap-2"><Package className="w-4 h-4"/> المنتجات:</h4><p className="text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">{order.product_type}</p></div>
                           </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedForSettlement.length > 0 && (
        <div className="absolute bottom-0 left-0 w-full bg-emerald-900/90 backdrop-blur-md p-4 border-t border-emerald-500/50 flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.5)] animate-slideUp">
           <span className="text-white font-bold text-lg">
             تم تحديد <span className="bg-white text-emerald-900 px-3 py-1 rounded-lg mx-1">{selectedForSettlement.length}</span> طلبات للتحاسب
           </span>
           <button 
             onClick={handleCreateSettlement}
             className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-extrabold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
           >
             <CheckSquare className="w-5 h-5" /> إنشاء فاتورة تحاسب وإغلاق
           </button>
        </div>
      )}
    </div>
  );
}