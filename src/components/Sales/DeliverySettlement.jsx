import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Truck, MapPin, BookOpen, XCircle, Library } from 'lucide-react';
import ShippedOrdersTab from '../Orders/ShippedOrdersTab';
import DeliveredOrdersTab from '../Orders/DeliveredOrdersTab';
import ReturnedOrdersTab from '../Orders/ReturnedOrdersTab';
import AccountingArchiveTab from '../Orders/AccountingArchiveTab'; // 🆕 ملف الأرشيف الجديد

export default function DeliverySettlement() {
  const [activeTab, setActiveTab] = useState('shipped'); 
  
  const [shippedOrders, setShippedOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [returnedOrders, setReturnedOrders] = useState([]); 
  const [archivedOrders, setArchivedOrders] = useState([]); // 🆕 طلبات الأرشيف
  const [loading, setLoading] = useState(true);

  const [financialInputs, setFinancialInputs] = useState({});
  const [expandedRows, setExpandedRows] = useState([]);
  
  // 🆕 تحديد الطلبات المراد التحاسب عليها
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
        initialInputs[order.id] = { originalPrice: order.original_price || '', deliveryCost: order.delivery_cost || '' };
      });
      setFinancialInputs(initialInputs);
    }

    // 3. الرواجع
    const { data: returned } = await supabase.from('orders').select('*').in('status', ['returned', 'replaced']).order('created_at', { ascending: false });
    setReturnedOrders(returned || []);

    // 🆕 4. الأرشيف (الطلبات التي تم التحاسب عليها وإغلاقها)
    const { data: archived } = await supabase.from('orders').select('*').eq('status', 'settled_archived').order('created_at', { ascending: false });
    setArchivedOrders(archived || []);

    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  // الدوال السابقة...
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

  const handleInputChange = (orderId, field, value) => { setFinancialInputs(prev => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } })); };
  const saveFinancials = async (orderId) => {
    const { originalPrice, deliveryCost } = financialInputs[orderId];
    const { error } = await supabase.from('orders').update({ original_price: originalPrice || 0, delivery_cost: deliveryCost || 0 }).eq('id', orderId);
    if (!error) alert("تم حفظ الحسابات بنجاح!"); else alert("خطأ: " + error.message);
  };
  const toggleRow = (orderId) => { setExpandedRows(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]); };

  // ==========================================
  // 🆕 دالة إنشاء فاتورة التحاسب
  // ==========================================
  const handleCreateSettlement = async () => {
    if (selectedForSettlement.length === 0) return alert("يرجى تحديد طلب واحد على الأقل للتحاسب!");
    
    if (!window.confirm(`هل أنت متأكد من إنشاء فاتورة تحاسب لعدد (${selectedForSettlement.length}) طلبات ونقلها للأرشيف؟`)) return;

    // توليد رقم فاتورة فريد (مثال: INV-12345678)
    const invoiceRef = `INV-${Math.floor(100000 + Math.random() * 900000)}`;

    const { error } = await supabase.from('orders')
      .update({ 
        status: 'settled_archived', 
        settlement_ref: invoiceRef 
      })
      .in('id', selectedForSettlement);

    if (!error) {
      alert(`تم التحاسب بنجاح! رقم الفاتورة: ${invoiceRef} 🧾`);
      setSelectedForSettlement([]); // تفريغ التحديد
      fetchAllData(); // تحديث الشاشة
    } else {
      alert("حدث خطأ أثناء التحاسب: " + error.message);
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
        {/* 🆕 تبويبة الأرشيف */}
        <button onClick={() => setActiveTab('archive')} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <Library className="w-4 h-4" /> أرشيف الحسابات أرشيف الحسابات
        </button>
      </div>

      {activeTab === 'shipped' && <ShippedOrdersTab shippedOrders={shippedOrders} handlePaymentReceived={handlePaymentReceived} handleReplacedOrder={handleReplacedOrder} handleReturnedOrder={handleReturnedOrder} />}
      {activeTab === 'returned' && <ReturnedOrdersTab returnedOrders={returnedOrders} handleConfirmStockReturn={handleConfirmStockReturn} />}
      
      {/* 🆕 تم تمرير دوال التحديد إلى سجل الواصل */}
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

      {/* 🆕 عرض تبويبة الأرشيف */}
      {activeTab === 'archive' && <AccountingArchiveTab archivedOrders={archivedOrders} refreshData={fetchAllData} />}
    </div>
  );
}