export default function InventoryTable({ products, sizes, onTransaction, onMaintenance, onHistory }) {
  if (products.length === 0) {
    return <p className="text-center text-gray-500 py-10">لا توجد منتجات مطابقة للفلاتر</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-700 animate-fadeIn">
      <table className="w-full text-right bg-gray-800">
        <thead className="bg-gray-900 text-gray-300 text-sm">
          <tr>
            <th className="p-4">المنتج</th>
            <th className="p-4 text-center">الرصيد الصالح</th>
            <th className="p-4 text-center">التالف / صيانة</th>
            <th className="p-4 text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {products.map((item) => (
            <tr key={`${item.table}-${item.id}`} className="hover:bg-gray-750 transition">
              <td className="p-3">
                <div className="font-bold text-white">{item.name}</div>
                <span className="text-xs text-gray-400">
                  {item.typeLabel} - {sizes.find(s => s.id === item.size_id)?.size_name || '-'}
                </span>
              </td>
              
              {/* الرصيد الصالح */}
              <td className={`p-3 text-center font-bold text-xl ${item.stock_quantity === 0 ? 'text-gray-500' : 'text-green-400'}`}>
                {item.stock_quantity}
              </td>

              {/* الرصيد التالف */}
              <td className="p-3 text-center">
                {item.damaged_quantity > 0 ? (
                  <span className="bg-red-900/60 text-red-200 border border-red-800 px-3 py-1 rounded-full font-bold">
                    {item.damaged_quantity}
                  </span>
                ) : <span className="text-gray-600">-</span>}
              </td>

              {/* الأزرار */}
              <td className="p-3 text-center">
                <div className="flex justify-center items-center gap-2">
                  <button 
                    onClick={() => onTransaction(item, 'OUT')} 
                    className="bg-red-900/30 hover:bg-red-900 border border-red-800 text-red-200 px-3 py-1 rounded text-sm transition"
                    title="صرف بضاعة"
                  >
                    📤 صرف
                  </button>
                  <button 
                    onClick={() => onTransaction(item, 'IN')} 
                    className="bg-green-900/30 hover:bg-green-900 border border-green-800 text-green-200 px-3 py-1 rounded text-sm transition"
                    title="استلام بضاعة"
                  >
                    📥 استلام
                  </button>
                  <button 
                    onClick={() => onMaintenance(item)} 
                    className="bg-orange-900/30 hover:bg-orange-800 border border-orange-700 text-orange-200 px-3 py-1 rounded text-sm transition"
                    title="إدارة التالف"
                  >
                    🛠️
                  </button>
                  <button 
                    onClick={() => onHistory(item)} 
                    className="bg-gray-700 hover:bg-blue-600 text-gray-300 px-3 py-1 rounded border border-gray-600 text-sm transition"
                    title="سجل الحركات"
                  >
                    📜
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}