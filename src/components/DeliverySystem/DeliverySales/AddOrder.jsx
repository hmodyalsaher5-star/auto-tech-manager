import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase'; 

function AddOrder() {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    car_details: '',
    product_info: ''
  });

  const [myOrders, setMyOrders] = useState([]);

  // جلب الطلبات الخاصة بالمبيعات (الحديثة والتي في الطريق)
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10); // عرض آخر 10 طلبات للمتابعة
    
    if (!error) setMyOrders(data);
  };

 // ✅ ضع هذا مكانه:
  useEffect(() => {
    const loadData = async () => {
      await fetchOrders();
    };
    
    loadData();
  }, []);

  // إضافة طلب جديد
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('delivery_orders')
      .insert([
        { 
          customer_name: formData.customer_name,
          customer_phone: formData.customer_phone,
          car_details: formData.car_details,
          product_info: formData.product_info,
          status: 'Created' 
        }
      ]);

    if (error) {
      alert("عذراً، حدث خطأ: " + error.message);
    } else {
      alert("تم تسجيل الطلب بنجاح! 🎉");
      setFormData({ customer_name: '', customer_phone: '', car_details: '', product_info: '' });
      fetchOrders();
    }
  };

  // تبليغ عن مشكلة
  const reportIssue = async (orderId) => {
    const confirmIssue = window.confirm("هل أنت متأكد من وجود مشكلة؟ سيتم تحويله للدعم الفني.");
    if (confirmIssue) {
      await updateOrderStatus(orderId, 'Issue_Reported', "تم إبلاغ الدعم الفني! 🚩");
    }
  };

  // دالة موحدة لتحديث الحالة (تسليم أو استرجاع)
  const updateOrderStatus = async (orderId, newStatus, successMessage) => {
    if (newStatus === 'Returned') {
      const confirmReturn = window.confirm("هل أنت متأكد أن الزبون رفض الطلب؟ سيتم تحويله للإدارة للتحقيق في الغرامة.");
      if (!confirmReturn) return; 
    }

    const { error } = await supabase
      .from('delivery_orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert("فشل التحديث: " + error.message);
    } else {
      alert(successMessage);
      fetchOrders(); 
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 text-right" dir="rtl">
      
      {/* 1. نموذج إضافة الطلب */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 text-blue-600 border-b pb-2">إضافة طلب توصيل جديد</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="اسم الزبون" className="w-full border border-gray-300 rounded-md p-2" value={formData.customer_name} onChange={(e) => setFormData({...formData, customer_name: e.target.value})} required />
            <input type="text" placeholder="رقم الهاتف" className="w-full border border-gray-300 rounded-md p-2 text-left" value={formData.customer_phone} onChange={(e) => setFormData({...formData, customer_phone: e.target.value})} required />
          </div>
          <input type="text" placeholder="تفاصيل السيارة والمنتج" className="w-full border border-gray-300 rounded-md p-2" value={formData.car_details} onChange={(e) => setFormData({...formData, car_details: e.target.value})} />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-md hover:bg-blue-700 transition duration-200 shadow-lg">تأكيد وإرسال الطلب</button>
        </form>
      </div>

      {/* 2. لوحة متابعة الطلبات للمبيعات */}
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-300 shadow-inner">
        <h3 className="text-lg font-bold mb-4 text-gray-800">متابعة طلباتي وإغلاقها:</h3>
        <div className="space-y-3">
          {myOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-4">لا توجد طلبات لعرضها حالياً.</p>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-center border-r-4 border-blue-500 gap-4">
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{order.customer_name} <span className="text-sm font-normal text-gray-500">({order.customer_phone})</span></p>
                  
                  {/* عرض الحالة بشكل ملون */}
                  <p className={`text-xs font-bold mt-1 inline-block px-2 py-1 rounded ${
                    order.status === 'Handed_To_Courier' ? 'bg-orange-100 text-orange-700' :
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'Returned' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    حالة الطلب: {order.status}
                  </p>
                </div>

                {/* الأزرار الديناميكية بناءً على حالة الطلب */}
                <div className="flex gap-2 w-full md:w-auto">
                  {/* إذا كان الطلب مع المندوب، تظهر أزرار الإغلاق */}
                  {order.status === 'Handed_To_Courier' ? (
                    <>
                      <button onClick={() => updateOrderStatus(order.id, 'Delivered', 'عاش! تمت إضافة الحافز للقسم ✅')} className="flex-1 bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition shadow">
                        تم التسليم ✅
                      </button>
                     <button 
                      onClick={() => updateOrderStatus(order.id, 'Waiting_For_Return', 'تم إشعار قسم التوصيل لاستلام الراجع ❌')} 
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded font-bold hover:bg-red-600 transition shadow"
                    >
                      مرتجع ❌
                    </button>
                                      </>
                  ) : order.status !== 'Delivered' && order.status !== 'Returned' ? (
                    /* إذا كان الطلب في التجهيز أو جديد، يظهر زر التبليغ فقط */
                    <button onClick={() => reportIssue(order.id)} className="bg-gray-100 text-red-600 border border-red-200 px-4 py-2 rounded font-bold hover:bg-red-50 transition">
                      تبليغ عن مشكلة 🚩
                    </button>
                  ) : null /* إذا كان مُسلم أو مرتجع لا نظهر أي زر (انتهت دورة حياته) */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AddOrder;