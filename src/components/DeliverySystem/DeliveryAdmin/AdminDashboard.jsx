import { useEffect, useState } from 'react';
import { supabase } from '../../../supabase'; // تأكد من مسار قاعدة البيانات

function AdminDashboard() {
  const [stats, setStats] = useState({
    deliveredCount: 0,
    incentivePerOrder: 5000, 
    pettyCashPercent: 20,    
  });

  const [employeesCount, setEmployeesCount] = useState(1);

  const fetchAdminData = async () => {
    // 1. جلب عدد الطلبات الناجحة
    const { count: deliveredCount } = await supabase
      .from('delivery_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Delivered');

    // 2. جلب الإعدادات (الحافز والنسبة)
    const { data: settings } = await supabase
      .from('delivery_settings')
      .select('*')
      .single();

    // 3. جلب عدد الموظفين النشطين
    const { count: userCount } = await supabase
      .from('delivery_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (settings) {
      setStats({
        deliveredCount: deliveredCount || 0,
        incentivePerOrder: settings.incentive_per_order,
        pettyCashPercent: settings.petty_cash_percentage
      });
    }
    if (userCount) setEmployeesCount(userCount);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAdminData();
    };
    
    loadData();
  }, []);
  // --- المعادلات الحسابية للمال ---
  const totalIncentivePool = stats.deliveredCount * stats.incentivePerOrder;
  const pettyCashAmount = (totalIncentivePool * stats.pettyCashPercent) / 100;
  const netToDistribute = totalIncentivePool - pettyCashAmount;
  const sharePerPerson = employeesCount > 0 ? netToDistribute / employeesCount : 0;

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 border-r-4 border-blue-600 pr-4">لوحة الإدارة المالية للقسم</h1>

      {/* كروت الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-green-500">
          <p className="text-gray-500 text-sm font-bold">الطلبات المُسلمة بنجاح</p>
          <p className="text-3xl font-black text-green-600">{stats.deliveredCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-blue-500">
          <p className="text-gray-500 text-sm font-bold">إجمالي صندوق الحوافز</p>
          <p className="text-3xl font-black text-blue-600">{totalIncentivePool.toLocaleString()} د.ع</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-orange-500">
          <p className="text-gray-500 text-sm font-bold">مقتطعات النثرية للخزانة ({stats.pettyCashPercent}%)</p>
          <p className="text-3xl font-black text-orange-600">{pettyCashAmount.toLocaleString()} د.ع</p>
        </div>
      </div>

      {/* لوحة توزيع الأرباح */}
      <div className="bg-blue-900 text-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4 opacity-80">صافي الأرباح للتوزيع الشهري:</h2>
        <p className="text-5xl font-black mb-6 text-green-400">{netToDistribute.toLocaleString()} د.ع</p>
        
        <div className="flex items-center gap-4 bg-blue-800 p-4 rounded-lg">
          <div className="flex-1">
            <p className="text-sm opacity-70">عدد الموظفين المستحقين:</p>
            <p className="text-xl font-bold">{employeesCount} موظفاً</p>
          </div>
          <div className="text-left flex-1 border-r border-blue-600 pr-4">
            <p className="text-sm opacity-70">حصة الموظف الواحد:</p>
            <p className="text-2xl font-black text-yellow-400">{sharePerPerson.toLocaleString()} د.ع</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;