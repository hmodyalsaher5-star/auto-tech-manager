export default function LogsTable({ logs }) {
  const reasonLabels = {
    'supplier': '🏭 شراء من مورد', 'showroom_return': '↩️ مرتجع من المعرض', 'wholesale_return': '↩️ مرتجع من الجملة', 'manual_adjustment': '🔧 تسوية جردية',
    'showroom': '🏢 تحويل للمعرض', 'wholesale': '📦 تحويل للجملة', 'damage': '🗑️ إتلاف مباشر',
    'damage_reported': '🛠️ تحويل للصيانة/تالف', 'repaired_return': '✅ تم الإصلاح', 'final_scrap': '❌ إتلاف نهائي'
  };

  if (logs.length === 0) {
    return <p className="text-center text-gray-500 py-10">لا توجد سجلات للعرض</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-700 animate-fadeIn">
      <table className="w-full text-right bg-gray-800">
        <thead className="bg-gray-900 text-gray-300 text-sm">
          <tr>
            <th className="p-4">الوقت</th>
            <th className="p-4">الموظف</th>
            <th className="p-4">المنتج</th>
            <th className="p-4 text-center">الحركة</th>
            <th className="p-4 text-center">الكمية</th>
            <th className="p-4">السبب</th>
            <th className="p-4">ملاحظات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-750 transition">
              <td className="p-3 text-sm text-gray-400" dir="ltr">
                {new Date(log.created_at).toLocaleString('en-GB')}
              </td>
              <td className="p-3 text-sm font-bold text-blue-200">
                {log.employee_name || 'Admin'}
              </td>
              <td className="p-3 font-bold text-white">
                {log.product_name}
              </td>
              <td className="p-3 text-center">
                <span className={`px-2 py-1 rounded text-xs font-bold ${log.movement_type === 'IN' ? 'bg-green-900 text-green-300 border border-green-800' : 'bg-red-900 text-red-300 border border-red-800'}`}>
                  {log.movement_type === 'IN' ? '📥 وارد' : '📤 صادر'}
                </span>
              </td>
              <td className="p-3 text-center font-mono font-bold text-lg text-white">
                {Math.abs(log.quantity_change)}
              </td>
              <td className="p-3 text-sm">
                {reasonLabels[log.reason] || log.reason}
              </td>
              <td className="p-3 text-sm text-gray-400">
                {log.reference_number && <span className="block text-yellow-500">#{log.reference_number}</span>}
                {log.notes}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}