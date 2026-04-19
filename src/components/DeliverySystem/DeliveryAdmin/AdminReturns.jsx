import { useEffect, useState } from 'react';
import { supabase } from '../../../supabase';

function AdminReturns() {
  const [returnedOrders, setReturnedOrders] = useState([]);

  // جلب الطلبات المرتجعة فقط
const fetchReturnedOrders = async () => {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('status', 'Returned_To_Inventory'); // 👈 التعديل هنا فقط
    
    if (!error) setReturnedOrders(data);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchReturnedOrders();
    };
    loadData();
  }, []);

  // إغلاق الطلب المرتجع نهائياً (أرشفة)
  const closeReturnedOrder = async (orderId) => {
    const confirmAction = window.confirm("هل أنت متأكد من إغلاق هذا المرتجع؟ (سيتم حفظه في الأرشيف)");
    
    if (confirmAction) {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ status: 'Archived_Returned' }) // حالة جديدة تعني أن المدير راجع المشكلة وأغلقها
        .eq('id', orderId);

      if (error) {
        alert("حدث خطأ: " + error.message);
      } else {
        alert("تم إغلاق الطلب المرتجع وأرشفته. 📁");
        fetchReturnedOrders(); // تحديث القائمة
      }
    }
  };

  return (
    <div className="p-8 bg-red-50 min-h-screen text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-red-800 mb-8 border-r-4 border-red-600 pr-4">لوحة المرتجعات والتحقيق</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-red-500">
        <h2 className="text-xl font-bold text-gray-700 mb-6 flex justify-between items-center">
          <span>❌ طلبات تم إرجاعها (بانتظار المراجعة)</span>
          <span className="bg-red-100 text-red-600 px-4 py-1 rounded-full text-lg">{returnedOrders.length}</span>
        </h2>

        <div className="space-y-4">
          {returnedOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-10 font-medium">لا توجد مرتجعات حالياً. أداء ممتاز! 🎉</p>
          ) : (
            returnedOrders.map(order => (
              <div key={order.id} className="p-5 bg-red-50 border border-red-200 rounded-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-red-700">{order.customer_name}</h3>
                  <p className="text-gray-700 mt-1">📞 هاتف: {order.customer_phone}</p>
                  <p className="text-gray-500 text-sm mt-1">المنتج: {order.car_details}</p>
                </div>
                
                <button 
                  onClick={() => closeReturnedOrder(order.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition shadow"
                >
                  تأكيد المرتجع وإغلاق الملف 📁
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminReturns;