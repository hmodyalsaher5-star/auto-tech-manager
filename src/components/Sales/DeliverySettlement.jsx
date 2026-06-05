import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Truck, MapPin, BookOpen, XCircle, Library, UserCheck } from 'lucide-react';
import ShippedOrdersTab from '../Orders/ShippedOrdersTab';
import DeliveredOrdersTab from '../Orders/DeliveredOrdersTab';
import ReturnedOrdersTab from '../Orders/ReturnedOrdersTab';
import AccountingArchiveTab from '../Orders/AccountingArchiveTab';
import SalesBalancesTab from '../Orders/SalesBalancesTab'; // 🆕 استيراد صفحة الأرصدة المستقلة الجديدة

export default function DeliverySettlement() {
  const [activeTab, setActiveTab] = useState('shipped'); 
  
  const [shippedOrders, setShippedOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [returnedOrders, setReturnedOrders] = useState([]); 
  const [archivedOrders, setArchivedOrders] = useState([]); 
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [financialInputs, setFinancialInputs] = useState({});
  const [expandedRows, setExpandedRows] = useState([]);
  
  const [selectedForSettlement, setSelectedForSettlement] = useState([]);

  const fetchAllData = async () => {
    setLoading(true);
    
    // 1. قيد الشحن
    const { data: shipped } = await supabase.from('orders').select('*').eq('status', 'shipped').order('created_at', { ascending: true });
    setShippedOrders(shipped || []);

    // 2. الواصل (الذي لم يُتحاسب عليه بعد)
    const { data: delivered } = await supabase.from('orders').select('*').in('status', ['delivered', 'replaced', 'replaced_completed']).order('created_at', { ascending: false });
    if (delivered) {
      setDeliveredOrders(delivered);
      const initialInputs = {};
      delivered.forEach(order => {
        initialInputs[order.id] = { 
          originalPrice: order.original_price || '', 
          deliveryCost: order.delivery_cost || '',
          incentive: order.incentive || '',
          totalPrice: order.total_price || '',
          employeeCommission: order.employee_commission || '' 
        };
      });
      setFinancialInputs(initialInputs);
    }

    // 3. ⁠الرواجع
    const { data: returned } = await supabase.from('orders').select('*').in('status', ['returned', 'replaced']).order('created_at', { ascending: false });
    setReturnedOrders(returned || []);

    // 4. الأرشيف
    const { data: archived } = await supabase.from('orders').select('*').eq('status', 'settled_archived').order('created_at', { ascending: false });
    setArchivedOrders(archived || []);

    // 5. جلب بيانات أرصدة الموظفين الحالية من السيرفر
    const { data: emps } = await supabase.from('employees').select('*').order('name', { ascending: true });
    setEmployees(emps || []);

    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  const handlePaymentReceived = async (orderId, customerName, amount, currency) => {
    if (!window.confirm(`هل تؤكد استلام مبلغ (${amount} ${currency}) من العميل ${customerName}؟`)) return;
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
    if (!error) { alert("تم الاستلام بنجاح!"); fetchAllData(); } else alert("خطأ: " + error.message);
  };

  const handleReplacedOrder = async (orderId, customerName) => {
    if (!window.confirm(`هل تم تسليم القطعة الجديدة واستلام القديمة من (${customerName})؟`)) return;
    const { error } = await supabase.from('orders').update({ status: 'replaced' }).eq('id', orderId);
    if (!error) { alert("تم الاستبدال بنجاح!"); fetchAllData(); } else alert("خطأ: " + error.message);
  };

  const handleReturnedOrder = async (orderId, customerName) => {
    if (!window.confirm(`هل أنت متأكد أن طلب العميل (${customerName}) راجع؟`)) return;
    const { error } = await supabase.from('orders').update({ status: 'returned' }).eq('id', orderId);
    if (!error) { alert("تم تسجيل الطلب كمرتجع!"); fetchAllData(); } else alert("خطأ: " + error.message);
  };

  const handleConfirmStockReturn = async (orderId, customerName, currentStatus) => {
    if (!window.confirm(`هل أنت متأكد من استلام البضاعة وإعادتها للمخزن؟`)) return;
    const newStatus = currentStatus === 'replaced' ? 'replaced_completed' : 'returned_to_stock';
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) { alert("تم تأكيد الاستلام للمخزن بنجاح!"); fetchAllData(); } else alert("خطأ: " + error.message);
  };

  const handleInputChange = (orderId, field, value) => { 
    setFinancialInputs(prev => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } })); 
  };

  const saveFinancials = async (orderId) => {
    const inputs = financialInputs[orderId] || {};
    const order = deliveredOrders.find(o => o.id === orderId);

    const finalOriginalPrice = inputs.originalPrice !== undefined && inputs.originalPrice !== "" ? inputs.originalPrice : (order.original_price || order.cost_price || 0);
    const finalDeliveryCost = inputs.deliveryCost !== undefined && inputs.deliveryCost !== "" ? inputs.deliveryCost : (order.delivery_cost || 0);
    const finalIncentive = inputs.incentive !== undefined && inputs.incentive !== "" ? inputs.incentive : (order.incentive || 0);
    const finalTotalPrice = inputs.totalPrice !== undefined && inputs.totalPrice !== "" ? inputs.totalPrice : (order.total_price || 0);
    const finalEmpCommission = inputs.employeeCommission !== undefined && inputs.employeeCommission !== "" ? inputs.employeeCommission : (order.employee_commission || 0);

    const { error } = await supabase.from('orders')
      .update({ 
        original_price: finalOriginalPrice, 
        delivery_cost: finalDeliveryCost,
        incentive: finalIncentive,
        total_price: finalTotalPrice,
        employee_commission: finalEmpCommission 
      }).eq('id', orderId);

    if (!error) alert("تم حفظ الحسابات بنجاح!"); 
    else alert("خطأ: " + error.message);
  };

  const toggleRow = (orderId) => { setExpandedRows(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]); };

  const handleCreateSettlement = async () => {
    if (selectedForSettlement.length === 0) return alert("يرجى تحديد طلب واحد على الأقل للتحاسب!");
    if (!window.confirm(`هل أنت متأكد من إنشاء فاتورة تحاسب لعدد (${selectedForSettlement.length}) طلبات ونقلها للأرشيف؟`)) return;

    const invoiceRef = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const employeeCommissionsToUpdate = {};

    const promises = selectedForSettlement.map(orderId => {
      const inputs = financialInputs[orderId] || {};
      const order = deliveredOrders.find(o => o.id === orderId);

      const finalOriginal = inputs.originalPrice !== undefined && inputs.originalPrice !== "" ? inputs.originalPrice : (order.original_price || order.cost_price || 0);
      const finalDelivery = inputs.deliveryCost !== undefined && inputs.deliveryCost !== "" ? inputs.deliveryCost : (order.delivery_cost || 0);
      const finalIncentive = inputs.incentive !== undefined && inputs.incentive !== "" ? inputs.incentive : (order.incentive || 0);
      const finalTotalPrice = inputs.totalPrice !== undefined && inputs.totalPrice !== "" ? inputs.totalPrice : (order.total_price || 0);
      const finalEmpCommission = inputs.employeeCommission !== undefined && inputs.employeeCommission !== "" ? inputs.employeeCommission : (order.employee_commission || 0);

      if (order.sales_employee_id && parseFloat(finalEmpCommission) > 0) {
        employeeCommissionsToUpdate[order.sales_employee_id] = 
          (employeeCommissionsToUpdate[order.sales_employee_id] || 0) + parseFloat(finalEmpCommission);
      }

      return supabase.from('orders').update({
        status: 'settled_archived',
        settlement_ref: invoiceRef,
        original_price: finalOriginal,
        delivery_cost: finalDelivery,
        incentive: finalIncentive,
        total_price: finalTotalPrice,
        employee_commission: finalEmpCommission
      }).eq('id', orderId);
    });

    try {
      const results = await Promise.all(promises);
      const hasError = results.some(res => res.error);
      
      if (!hasError) {
        const empUpdatePromises = Object.entries(employeeCommissionsToUpdate).map(async ([empId, commissionSum]) => {
          const { data: empData } = await supabase.from('employees').select('total_balance').eq('id', empId).single();
          const currentBalance = empData ? parseFloat(empData.total_balance) || 0 : 0;
          
          return supabase.from('employees')
            .update({ total_balance: currentBalance + commissionSum })
            .eq('id', empId);
        });

        await Promise.all(empUpdatePromises);

        alert(`تم التحاسب بنجاح! رقم الفاتورة: ${invoiceRef} 🧾 وتحديث أرصدة الموظفين التراكمية!`);
        setSelectedForSettlement([]);
        fetchAllData(); 
      } else {
        alert("حدث خطأ في تحديث بعض الطلبات، يرجى المراجعة.");
      }
    } catch (err) {
      alert("حدث خطأ غير متوقع: " + err.message);
    }
  };

  const handleClearEmployeeBalance = async (empId, empName, currentBalance) => {
    if (currentBalance <= 0) return alert(`رصيد الموظف (${empName}) هو صفر بالفعل!`);
    
    const isConfirmed = window.confirm(`⚠️ كشف تسليم مالي ⚠️\nهل تؤكد أنك قمت بتسليم الموظف (${empName}) كامل مستحقاته البالغة (${currentBalance.toLocaleString()} د.ع) نقداً وتريد تصفير رصيده الآن؟`);
    if (!isConfirmed) return;

    const { error } = await supabase
      .from('employees')
      .update({ total_balance: 0 })
      .eq('id', empId);

    if (!error) {
      alert(`تم تصفير حساب الموظف (${empName}) وتسجيل عملية الدفع بنجاح! 💸`);
      fetchAllData();
    } else {
      alert("خطأ أثناء تصفير الحساب: " + error.message);
    }
  };

  const handleToggleSelectOrder = (orderId) => {
    setSelectedForSettlement(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const handleSelectAll = (isAllSelected) => {
    if (isAllSelected) setSelectedForSettlement([]);
    else setSelectedForSettlement(deliveredOrders.map(o => o.id));
  };

  if (loading) return <div className="text-emerald-400 text-center p-10 font-bold text-xl animate-pulse">جاري التحميل...</div>;

  return (
    <div className="p-4 md:p-8 animate-fadeIn text-right" dir="rtl">
      <h2 className="text-2xl font-bold text-emerald-400 mb-6 flex items-center gap-3 border-b border-emerald-500/20 pb-4">
        <Truck className="w-8 h-8" /> إدارة المندوبين وحسابات التوصيل
      </h2>

      <div className="flex flex-wrap gap-4 mb-8 bg-black/40 p-2 rounded-2xl w-fit border border-white/5 shadow-lg">
        <button onClick={() => setActiveTab('shipped')} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'shipped' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <MapPin className="w-4 h-4" /> مع المندوبين ({shippedOrders.length})
        </button>
        <button onClick={() => setActiveTab('delivered')} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'delivered' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <BookOpen className="w-4 h-4" /> سجل الواصل والمحاسبة ({deliveredOrders.length})
        </button>
        <button onClick={() => setActiveTab('returned')} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'returned' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <XCircle className="w-4 h-4" /> سجل الرواجع ({returnedOrders.length})
        </button>
        <button onClick={() => setActiveTab('archive')} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <Library className="w-4 h-4" /> أرشيف الحسابات ({archivedOrders.length})
        </button>
        <button onClick={() => setActiveTab('balances')} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'balances' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-amber-400'}`}>
          <UserCheck className="w-4 h-4" /> أرشيف الأرصدة ({employees.length})
        </button>
      </div>

      {activeTab === 'shipped' && <ShippedOrdersTab shippedOrders={shippedOrders} handlePaymentReceived={handlePaymentReceived} handleReplacedOrder={handleReplacedOrder} handleReturnedOrder={handleReturnedOrder} />}
      {activeTab === 'returned' && <ReturnedOrdersTab returnedOrders={returnedOrders} handleConfirmStockReturn={handleConfirmStockReturn} />}
      
      {activeTab === 'delivered' && (
        <DeliveredOrdersTab 
          deliveredOrders={deliveredOrders} financialInputs={financialInputs} 
          handleInputChange={handleInputChange} saveFinancials={saveFinancials} 
          expandedRows={expandedRows} toggleRow={toggleRow}
          selectedForSettlement={selectedForSettlement}
          handleToggleSelectOrder={handleToggleSelectOrder}
          handleSelectAll={handleSelectAll}
          handleCreateSettlement={handleCreateSettlement}
        />
      )}

      {activeTab === 'archive' && <AccountingArchiveTab archivedOrders={archivedOrders} refreshData={fetchAllData} />}

      {/* 🆕 استدعاء الملف المنفصل وتمرير البيانات بمزاج وعزل تام */}
    {/* في ملف DeliverySettlement.jsx */}
{activeTab === 'balances' && (
  <SalesBalancesTab 
    employees={employees} 
    handleClearEmployeeBalance={handleClearEmployeeBalance} 
    refreshData={fetchAllData}
    archivedOrders={archivedOrders} // 🆕 تمرير بيانات الأرشيف
  />
)}
    </div>
  );
}