import React, { useState } from 'react'; 
import { FileText, User, Calculator, Save, ChevronDown, ChevronUp, CarFront, Package, CheckSquare, UserCheck } from 'lucide-react';

export default function DeliveredOrdersTab({ 
  deliveredOrders = [], 
  financialInputs = {}, 
  handleInputChange, 
  saveFinancials, 
  expandedRows = [], 
  toggleRow, 
  selectedForSettlement = [], 
  handleToggleSelectOrder, 
  handleSelectAll, 
  handleCreateSettlement 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // 🛡️ حماية ضد المصفوفات الفارغة أو غير المعرفة
  if (!deliveredOrders || !Array.isArray(deliveredOrders) || deliveredOrders.length === 0) {
    return <div className="bg-black/40 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl p-10 text-center text-gray-400 font-bold">السجل المالي فارغ.</div>;
  }

  const isAllSelected = deliveredOrders.length > 0 && selectedForSettlement && selectedForSettlement.length === deliveredOrders.length;

  const filteredOrders = deliveredOrders.filter(order => {
    const customerNameLower = (order.customer_name || '').toLowerCase();
    const trackingNumberLower = (order.tracking_number || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase().trim();

    return customerNameLower.includes(searchLower) || trackingNumberLower.includes(searchLower);
  });

  return (
    <div className="bg-black/40 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn relative pb-20">
      
      {/* صندوق البحث */}
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

      <div className="overflow-x-auto custom-scrollbar">
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center text-amber-400/60 font-bold text-lg animate-fadeIn border-t border-emerald-500/10">
            ⚠️ لا توجد طلبات تطابق اسم الزبون أو رقم الوصل المكتوب.
          </div>
        ) : (
          <table className="w-full text-sm text-right text-gray-300 table-fixed md:table-auto">
            <thead className="text-xs text-emerald-300 uppercase bg-emerald-900/30 border-b border-emerald-500/30">
              <tr>
                <th className="px-2 py-5 text-center w-12">
                   <input 
                     type="checkbox" 
                     checked={isAllSelected}
                     onChange={() => handleSelectAll && handleSelectAll(isAllSelected)}
                     className="w-5 h-5 accent-emerald-500 cursor-pointer"
                   />
                </th>
                {/* 🔄 صغرنا حقل رقم الوصل */}
                <th className="px-2 py-5 font-bold w-24 text-center"><FileText className="w-4 h-4 inline mr-1"/> الوصل</th>
                {/* 🔄 صغرنا حقل العميل والمبيعات */}
                <th className="px-2 py-5 font-bold min-w-[120px] text-right"><User className="w-4 h-4 inline mr-1"/> العميل</th>
                <th className="px-2 py-5 font-bold bg-rose-900/10 text-rose-300 text-center w-28">التكلفة</th>
                <th className="px-2 py-5 font-bold bg-blue-950/40 text-blue-300 text-center w-28">حافز المحل</th>
                <th className="px-2 py-5 font-bold bg-purple-950/40 text-purple-300 text-center w-28">للمحل</th>
                <th className="px-2 py-5 font-bold text-center w-28">سعر البيet</th>
                <th className="px-2 py-5 font-bold bg-orange-900/10 text-orange-300 text-center w-24">التوصيل</th>
                <th className="px-2 py-5 font-bold bg-sky-900/20 text-sky-300 text-center w-28">عمولة الموظف</th>
                <th className="px-2 py-5 font-bold bg-emerald-900/20 text-emerald-300 text-center w-28"><Calculator className="w-4 h-4 inline mr-1"/> صافي الربح</th>
                <th className="px-2 py-5 font-bold text-center w-16">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                if (!order) return null;

                const inputs = (financialInputs && financialInputs[order.id]) ? financialInputs[order.id] : {};
                
                const displaySellingPrice = inputs.totalPrice !== undefined ? inputs.totalPrice : (order.total_price || 0);
                const sellingPrice = parseFloat(displaySellingPrice) || 0;
                
                const displayOriginalPrice = inputs.originalPrice !== undefined ? inputs.originalPrice : (order.cost_price || order.original_price || 0);
                const originalPrice = parseFloat(displayOriginalPrice) || 0;
                
                const displayIncentive = inputs.incentive !== undefined ? inputs.incentive : (order.incentive || 0);
                const incentiveAmount = parseFloat(displayIncentive) || 0;

                const shopRequired = originalPrice - incentiveAmount;

                const displayDeliveryCost = inputs.deliveryCost !== undefined ? inputs.deliveryCost : (order.delivery_cost || 0);
                const deliveryCost = parseFloat(displayDeliveryCost) || 0;
                
                const displayEmpCommission = inputs.employeeCommission !== undefined ? inputs.employeeCommission : (order.employee_commission || 0);
                const employeeCommissionAmount = parseFloat(displayEmpCommission) || 0;
                
                const netProfit = sellingPrice - shopRequired - deliveryCost - employeeCommissionAmount;
                
                const isExpanded = expandedRows && Array.isArray(expandedRows) ? expandedRows.includes(order.id) : false;
                const isSelected = selectedForSettlement && Array.isArray(selectedForSettlement) ? selectedForSettlement.includes(order.id) : false;

                return (
                  <React.Fragment key={order.id}>
                    <tr className={`border-b border-white/5 hover:bg-white/5 transition-all ${isSelected ? 'bg-emerald-900/20' : ''}`}>
                      <td className="px-2 py-4 text-center">
                         <input 
                           type="checkbox" 
                           checked={isSelected}
                           onChange={() => handleToggleSelectOrder && handleToggleSelectOrder(order.id)}
                           className="w-5 h-5 accent-emerald-500 cursor-pointer"
                         />
                      </td>
                      {/* 🔄 عرض مبسط ومصغر لرقم الوصل */}
                      <td className="px-2 py-4 font-mono text-white font-bold text-xs text-center truncate" dir="ltr" title={order.tracking_number}>{order.tracking_number || '---'}</td>
                      
                      {/* 🔄 العميل بمساحة متناسقة تمنع تمدد الصف */}
                      <td className="px-2 py-4 cursor-pointer group max-w-[150px]" onClick={() => toggleRow && toggleRow(order.id)}>
                         <div className="flex items-center gap-1 text-emerald-400 font-bold group-hover:text-emerald-300 text-xs truncate" title={order.customer_name}>
                            {order.customer_name} {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                         </div>
                         {order.sales_employee && (
                             <div className="text-sky-300 text-[9px] mt-1 flex items-center gap-1 bg-sky-900/30 px-1.5 py-0.5 rounded border border-sky-500/30 w-fit font-bold truncate max-w-full">
                                 <UserCheck className="w-2.5 h-2.5" /> {order.sales_employee}
                             </div>
                         )}
                         {order.order_type === 'replacement' && <span className="text-amber-400 text-[9px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1 inline-block">استبدال</span>}
                      </td>

                      {/* 🆕 تم تكبير حقل إدخال التكلفة إلى w-24 لراحة العين */}
                      <td className="px-2 py-4 bg-rose-900/10 text-center">
                          <input 
                            type="number" 
                            value={displayOriginalPrice} 
                            onChange={(e) => handleInputChange && handleInputChange(order.id, 'originalPrice', e.target.value)} 
                            className="w-24 p-1.5 rounded-lg bg-black/60 border border-rose-500/30 text-white font-bold outline-none focus:border-rose-400 text-center text-xs" 
                          />
                      </td>

                      {/* 🆕 تم تكبير حقل إدخال حافز المحل إلى w-24 */}
                      <td className="px-2 py-4 bg-blue-950/20 text-center">
                          <input 
                            type="number" 
                            value={displayIncentive} 
                            onChange={(e) => handleInputChange && handleInputChange(order.id, 'incentive', e.target.value)} 
                            placeholder="0"
                            className="w-24 p-1.5 rounded-lg bg-black/60 border border-blue-500/30 text-blue-300 font-bold outline-none focus:border-blue-400 text-center text-xs" 
                          />
                      </td>

                      <td className="px-2 py-4 bg-purple-950/20 text-center text-purple-300 font-black text-sm" dir="ltr">
                          {shopRequired.toLocaleString()}
                      </td>
                      
                      {/* 🆕 تم تكبير حقل إدخال سعر البيع إلى w-24 */}
                      <td className="px-2 py-4 text-center">
                          <input 
                            type="number" 
                            value={displaySellingPrice} 
                            onChange={(e) => handleInputChange && handleInputChange(order.id, 'totalPrice', e.target.value)} 
                            className="w-24 p-1.5 rounded-lg bg-black/60 border border-emerald-500/30 text-white font-bold outline-none focus:border-emerald-400 text-center text-xs" 
                          />
                      </td>
                      
                      {/* 🆕 تم تكبير حقل إدخال التوصيل إلى w-20 */}
                      <td className="px-2 py-4 bg-orange-900/10 text-center">
                          <input 
                            type="number" 
                            value={displayDeliveryCost} 
                            onChange={(e) => handleInputChange && handleInputChange(order.id, 'deliveryCost', e.target.value)} 
                            className="w-20 p-1.5 rounded-lg bg-black/60 border border-orange-500/30 text-white outline-none focus:border-orange-400 text-center text-xs" 
                          />
                      </td>

                      {/* 🆕 تم تكبير حقل إدخال عمولة الموظف إلى w-24 */}
                      <td className="px-2 py-4 bg-sky-900/10 text-center">
                          <input 
                            type="number" 
                            value={displayEmpCommission} 
                            onChange={(e) => handleInputChange && handleInputChange(order.id, 'employeeCommission', e.target.value)} 
                            className="w-24 p-1.5 rounded-lg bg-black/60 border border-sky-500/30 text-sky-300 font-bold outline-none focus:border-sky-400 text-center text-xs" 
                          />
                      </td>
                      
                      <td className="px-2 py-4 bg-emerald-900/10 text-center">
                          <span className={`font-black text-base flex justify-center ${netProfit > 0 ? 'text-emerald-400' : netProfit < 0 ? 'text-rose-500' : 'text-gray-400'}`} dir="ltr">
                              {netProfit > 0 ? '+' : ''}{netProfit}
                          </span>
                      </td>
                      
                      <td className="px-2 py-4 text-center">
                          <button onClick={() => saveFinancials && saveFinancials(order.id)} className="bg-emerald-600/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/50 p-1.5 rounded-lg shadow-md transition-all active:scale-95" title="حفظ البيانات المالية للملف"><Save className="w-4 " /></button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-black/60 border-b border-emerald-500/20 shadow-inner">
                        <td colSpan="11" className="px-6 py-5">
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

      {selectedForSettlement && selectedForSettlement.length > 0 && (
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