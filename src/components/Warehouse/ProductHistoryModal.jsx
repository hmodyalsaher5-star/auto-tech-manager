import { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // ⚠️ لاحظ المسار: نقطتين لأننا داخل مجلد فرعي

export default function ProductHistoryModal({ isOpen, onClose, item }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // تعريف المسميات هنا لسهولة الاستخدام
  const reasonLabels = {
    'supplier': '🏭 شراء من مورد', 'showroom_return': '↩️ مرتجع من المعرض', 'wholesale_return': '↩️ مرتجع من الجملة', 'manual_adjustment': '🔧 تسوية جردية',
    'showroom': '🏢 تحويل للمعرض', 'wholesale': '📦 تحويل للجملة', 'damage': '🗑️ إتلاف مباشر',
    'damage_reported': '🛠️ تحويل للصيانة/تالف', 'repaired_return': '✅ تم الإصلاح', 'final_scrap': '❌ إتلاف نهائي'
  };

  useEffect(() => {
    if (isOpen && item) {
      const fetchHistory = async () => {
        setLoading(true);
        const { data } = await supabase
          .from('stock_logs')
          .select('*')
          .eq('product_id', item.id)
          .eq('product_table', item.table)
          .order('created_at', { ascending: false });
        
        setHistory(data || []);
        setLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl border border-gray-600 shadow-2xl h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">📜 سجل: <span className="text-blue-400">{item.name}</span></h2>
            <p className="text-sm text-gray-400 mt-1">الرصيد الحالي: <span className="font-mono text-white font-bold">{item.stock_quantity}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-center text-gray-400 py-10">جاري تحميل السجل...</p>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead className="bg-gray-700 text-gray-300 text-sm sticky top-0">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الموظف</th>
                  <th className="p-3 text-center">نوع الحركة</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3">السبب / المصدر</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {history.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">لا توجد حركات مسجلة</td></tr>
                ) : history.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-700/50">
                    <td className="p-3 text-sm text-gray-400" dir="ltr">
                      {new Date(log.created_at).toLocaleDateString('en-GB')} <br/> 
                      {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </td>
                    <td className="p-3 text-sm font-bold text-blue-200">{log.employee_name || 'Admin'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${log.movement_type === 'IN' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {log.movement_type === 'IN' ? '📥 وارد' : '📤 صادر'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-lg">{Math.abs(log.quantity_change)}</td>
                    <td className="p-3 text-sm">{reasonLabels[log.reason] || log.reason}</td>
                    <td className="p-3 text-sm text-gray-400">
                      {log.reference_number && <span className="block text-yellow-500">#{log.reference_number}</span>}
                      {log.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg flex justify-end">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded font-bold">إغلاق</button>
        </div>
      </div>
    </div>
  );
}