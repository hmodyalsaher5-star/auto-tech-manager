import { useEffect, useState } from 'react';
import { supabase } from '../../../supabase';

function CourierDashboard() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    // نجلب الطلبات الجاهزة للتسليم، والطلبات الراجعة التي ننتظر استلامها
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .in('status', ['Ready_For_Courier', 'Waiting_For_Return']);
    
    if (!error) setOrders(data);
  };

  useEffect(() => {
    const loadData = async () => { await fetchOrders(); };
    loadData();
  }, []);

  const updateStatus = async (orderId, newStatus, message) => {
    const { error } = await supabase
      .from('delivery_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      alert(message);
      fetchOrders();
    }
  };

  const readyOrders = orders.filter(o => o.status === 'Ready_For_Courier');
  const returnOrders = orders.filter(o => o.status === 'Waiting_For_Return');

  return (
    <div className="p-6 bg-blue-50 min-h-screen text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-blue-800 mb-8 border-b-2 border-blue-200 pb-4">لوحة قسم التوصيل</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم 1: تسليم شحنات جديدة */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-blue-500">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-between">
            <span>📦 بانتظار التسليم لشركة الشحن</span>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">{readyOrders.length}</span>
          </h2>
          <div className="space-y-4">
            {readyOrders.map(order => (
              <div key={order.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-bold">{order.customer_name}</h3>
                <button onClick={() => updateStatus(order.id, 'Handed_To_Courier', 'تم التسليم لشركة الشحن! 🚚')} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold">تسليم لشركة الشحن 🚚</button>
              </div>
            ))}
          </div>
        </div>

        {/* قسم 2: استلام المرتجعات */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-between">
            <span>↩️ مرتجعات بانتظار سحبها من الشحن</span>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">{returnOrders.length}</span>
          </h2>
          <div className="space-y-4">
            {returnOrders.map(order => (
              <div key={order.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-bold">{order.customer_name}</h3>
                <button onClick={() => updateStatus(order.id, 'Returned_With_Courier', 'الراجع الآن بعهدتك! قم بتسليمه لقسم التجهيز.')} className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold">استلمت الراجع من الشركة 📦</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourierDashboard;