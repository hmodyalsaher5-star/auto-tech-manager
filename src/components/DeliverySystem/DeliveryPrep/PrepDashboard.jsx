import { useEffect, useState } from 'react';
import { supabase } from '../../../supabase';

function PrepDashboard() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    // نجلب الطلبات الجديدة للتجهيز، والطلبات المرتجعة التي بعهدة التوصيل
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .in('status', ['Created', 'Returned_With_Courier']);
    if (!error) setOrders(data);
  };

  useEffect(() => {
    const loadData = async () => { await fetchOrders(); };
    loadData();
  }, []);

  const updateStatus = async (orderId, newStatus, message) => {
    const { error } = await supabase.from('delivery_orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) { alert(message); fetchOrders(); }
  };

  const newOrders = orders.filter(o => o.status === 'Created');
  const returnOrders = orders.filter(o => o.status === 'Returned_With_Courier');

  return (
    <div className="p-6 bg-yellow-50 min-h-screen text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-yellow-800 mb-8 border-b-2 border-yellow-200 pb-4">لوحة قسم التجهيز والمخزن</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* تجهيز جديد */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-yellow-500">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-between">
            <span>🛠️ طلبات بانتظار التجهيز</span>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">{newOrders.length}</span>
          </h2>
          <div className="space-y-4">
            {newOrders.map(order => (
              <div key={order.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-bold">{order.customer_name}</h3>
                <p className="text-sm">المنتج: {order.car_details}</p>
                <button onClick={() => updateStatus(order.id, 'Ready_For_Courier', 'تم التجهيز! 📦')} className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded font-bold">تم التجهيز والتغليف ✅</button>
              </div>
            ))}
          </div>
        </div>

        {/* استلام مرتجع للمخزن */}
        <div className="bg-white p-5 rounded-xl shadow-md border-t-4 border-red-500">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-between">
            <span>📥 استرداد المرتجعات للمخزن</span>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full">{returnOrders.length}</span>
          </h2>
          <div className="space-y-4">
            {returnOrders.map(order => (
              <div key={order.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-bold">{order.customer_name}</h3>
                <p className="text-sm text-red-600 font-bold mb-2">الراجع بعهدة التوصيل حالياً</p>
                <button onClick={() => updateStatus(order.id, 'Returned_To_Inventory', 'تم إرجاع المادة للمخزن بنجاح!')} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-bold">استلمت المادة وتم إعادتها للمخزن 🔄</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrepDashboard;