export default function LogsTable({ logs }) {
  const reasonLabels = {
    'supplier': '🏭 شراء من مورد', 'showroom_return': '↩️ مرتجع معرض', 'wholesale_return': '↩️ مرتجع جملة', 'manual_adjustment': '🔧 تسوية جردية',
    'showroom': '🏢 للمعرض', 'wholesale': '📦 للجملة', 'damage': '🗑️ إتلاف',
    'damage_reported': '🛠️ عطل/صيانة', 'repaired_return': '✅ تم الإصلاح', 'final_scrap': '❌ إتلاف نهائي'
  };

  if (logs.length === 0) return <p className="text-center text-gray-500 py-10">لا توجد سجلات</p>;

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-700 animate-fadeIn">
      <table className="w-full text-right bg-gray-800 min-w-[700px]"> {/* min-w لتوسيع الجدول */}
        <thead className="bg-gray-900 text-gray-300 text-xs md:text-sm">
          <tr>
            <th className="p-3 whitespace-nowrap">الوقت</th>
            <th className="p-3 whitespace-nowrap">الموظف</th>
            <th className="p-3 whitespace-nowrap">المنتج</th>
            <th className="p-3 text-center whitespace-nowrap">الحركة</th>
            <th className="p-3 text-center whitespace-nowrap">العدد</th>
            <th className="p-3 whitespace-nowrap">السبب</th>
            <th className="p-3 min-w-[150px]">ملاحظات</th> {/* min-w للملاحظات لتظهر بشكل جيد */}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 text-sm">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-750 transition">
              <td className="p-3 text-xs text-gray-400 whitespace-nowrap" dir="ltr">
                {new Date(log.created_at).toLocaleDateString('en-GB')} <br/>
                {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </td>
              <td className="p-3 text-blue-300 font-bold whitespace-nowrap">{log.employee_name || 'Admin'}</td>
              <td className="p-3 font-bold text-white whitespace-nowrap">{log.product_name}</td>
              <td className="p-3 text-center whitespace-nowrap">
                <span className={`px-2 py-1 rounded text-xs font-bold ${log.movement_type === 'IN' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {log.movement_type === 'IN' ? '📥 وارد' : '📤 صادر'}
                </span>
              </td>
              <td className="p-3 text-center font-mono font-bold text-white text-lg">{Math.abs(log.quantity_change)}</td>
              <td className="p-3 whitespace-nowrap text-xs">{reasonLabels[log.reason] || log.reason}</td>
              <td className="p-3 text-xs text-gray-400">
                {log.reference_number && <span className="block text-yellow-500 mb-1">#{log.reference_number}</span>}
                {log.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}