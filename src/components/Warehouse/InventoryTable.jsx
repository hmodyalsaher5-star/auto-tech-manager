// أضفنا prop جديد اسمه showActions
export default function InventoryTable({ products, sizes, onTransaction, onMaintenance, onHistory, showActions = true }) {
  if (products.length === 0) return <p className="text-center text-gray-500 py-10">لا توجد منتجات</p>;

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-700 animate-fadeIn">
      <table className="w-full text-right bg-gray-800 min-w-[600px]">
        <thead className="bg-gray-900 text-gray-300 text-xs md:text-sm">
          <tr>
            <th className="p-3 whitespace-nowrap">المنتج</th>
            <th className="p-3 text-center whitespace-nowrap">الرصيد الصالح</th>
            <th className="p-3 text-center whitespace-nowrap">التالف</th>
            <th className="p-3 text-center whitespace-nowrap">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 text-sm">
          {products.map((item) => (
            <tr key={`${item.table}-${item.id}`} className="hover:bg-gray-750">
              <td className="p-3 whitespace-nowrap">
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400">{item.typeLabel} - {sizes.find(s => s.id === item.size_id)?.size_name}</div>
              </td>
              <td className={`p-3 text-center font-bold text-lg whitespace-nowrap ${item.stock_quantity === 0 ? 'text-gray-500' : 'text-green-400'}`}>{item.stock_quantity}</td>
              <td className="p-3 text-center whitespace-nowrap">{item.damaged_quantity > 0 ? <span className="bg-red-900/60 text-red-200 px-2 py-1 rounded text-xs">{item.damaged_quantity}</span> : '-'}</td>
              <td className="p-3 text-center whitespace-nowrap">
                <div className="flex justify-center gap-2">
                  
                  {/* 🔒 عرض أزرار العمليات فقط إذا كان مسموحاً (للمدير والعامل) */}
                  {showActions && (
                    <>
                      <button onClick={() => onTransaction(item, 'OUT')} className="bg-red-900/30 border border-red-800 text-red-200 px-2 py-1 rounded text-xs" title="صرف">📤</button>
                      <button onClick={() => onTransaction(item, 'IN')} className="bg-green-900/30 border border-green-800 text-green-200 px-2 py-1 rounded text-xs" title="استلام">📥</button>
                      <button onClick={() => onMaintenance(item)} className="bg-orange-900/30 border border-orange-700 text-orange-200 px-2 py-1 rounded text-xs" title="صيانة/تالف">🛠️</button>
                    </>
                  )}

                  {/* 📜 زر السجل يظهر للجميع دائماً */}
                  <button onClick={() => onHistory(item)} className="bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600 text-xs flex items-center gap-1">
                    📜 <span className="hidden md:inline">السجل</span>
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