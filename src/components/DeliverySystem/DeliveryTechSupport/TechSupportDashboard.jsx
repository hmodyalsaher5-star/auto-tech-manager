import { useEffect, useState } from 'react'
import { supabase } from '../../../supabase' // المسار الذي اتفقنا عليه

function TechSupportDashboard() {
  const [problemOrders, setProblemOrders] = useState([])

  // 1. جلب الطلبات التي بها مشاكل فقط
  async function fetchProblemOrders() {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*')
      .eq('status', 'Issue_Reported')
    
    if (!error) setProblemOrders(data)
  }

  // 2. حل المشكلة وإعادة الطلب للتوصيل
  const resolveIssue = async (orderId) => {
    const { error } = await supabase
      .from('delivery_orders')
      .update({ status: 'Ready_For_Courier' }) // نعيده ليظهر لقسم التوصيل مرة أخرى
      .eq('id', orderId)

    if (error) {
      alert("حدث خطأ في التحديث")
    } else {
      setProblemOrders(problemOrders.filter(order => order.id !== orderId))
      alert("تم حل المشكلة وإعادة الطلب لمسار التوصيل! ✅")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchProblemOrders();
    };
    loadData();
  }, [])

  return (
    <div className="p-6 bg-red-50 min-h-screen text-right" dir="rtl">
      <h1 className="text-2xl font-bold text-red-700 mb-6">قسم الدعم الفني - إدارة المشاكل والشكاوى</h1>
      
      <div className="grid gap-4">
        {problemOrders.length === 0 ? (
          <p className="text-gray-500 italic font-medium text-center bg-white p-10 rounded-lg shadow-inner">
            لا توجد مشاكل معلقة حالياً. عمل ممتاز! ✨
          </p>
        ) : (
          problemOrders.map(order => (
            <div key={order.id} className="p-5 bg-white border-r-8 border-red-500 shadow-md rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-lg text-red-600">{order.customer_name}</h3>
                <p className="text-gray-700">📞 هاتف الزبون: {order.customer_phone}</p>
                <p className="text-sm bg-gray-100 p-2 mt-2 rounded">
                   السيارة والمنتج: {order.car_details} - {order.product_info}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => resolveIssue(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-all"
                >
                  تم حل المشكلة ✅
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TechSupportDashboard