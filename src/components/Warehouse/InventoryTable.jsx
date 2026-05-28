// 🆕 التعديل 1: إضافة onImageClick كـ prop لاستقبال دالة تكبير الصورة
export default function InventoryTable({ products, sizes, onTransaction, onMaintenance, onHistory, showActions = true, onImageClick }) {
  if (products.length === 0) return <p className="text-center text-gray-500 py-10">لا توجد منتجات</p>;

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-700 animate-fadeIn">
      <table className="w-full text-right bg-gray-800 min-w-[600px]">
        <thead className="bg-gray-900 text-gray-300 text-xs md:text-sm">
          <tr>
            {/* 🆕 التعديل 2: إضافة عمود الصورة */}
            <th className="p-3 text-center whitespace-nowrap w-16">الصورة</th>
            <th className="p-3 whitespace-nowrap">المنتج</th>
            <th className="p-3 text-center whitespace-nowrap">الرصيد الصالح</th>
            <th className="p-3 text-center whitespace-nowrap">التالف</th>
            <th className="p-3 text-center whitespace-nowrap">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 text-sm">
          {products.map((item) => (
            <tr key={`${item.table}-${item.id}`} className="hover:bg-gray-750 transition-colors">
              
              {/* 🆕 التعديل 3: عرض الصورة المصغرة أو نص توضيحي */}
              <td className="p-3 text-center">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    onClick={() => onImageClick && onImageClick(item.image_url)}
                    className="w-12 h-12 rounded-xl object-cover cursor-pointer hover:scale-110 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all border border-gray-600 shadow-sm mx-auto"
                    title="انقر لتكبير الصورة"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-700/50 border border-gray-600 border-dashed flex items-center justify-center text-[10px] text-gray-500 mx-auto">
                    بدون
                  </div>
                )}
              </td>

              <td className="p-3 whitespace-nowrap">
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <span>{item.typeLabel}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                  <span>{sizes.find(s => s.id === item.size_id)?.size_name}</span>
                </div>
              </td>
              <td className={`p-3 text-center font-bold text-lg whitespace-nowrap ${item.stock_quantity === 0 ? 'text-gray-500' : 'text-green-400'}`}>
                {item.stock_quantity}
              </td>
              <td className="p-3 text-center whitespace-nowrap">
                {item.damaged_quantity > 0 ? (
                  <span className="bg-red-900/60 border border-red-800 text-red-200 px-2.5 py-1 rounded-md text-xs font-bold shadow-inner">
                    {item.damaged_quantity}
                  </span>
                ) : '-'}
              </td>
              <td className="p-3 text-center whitespace-nowrap">
                <div className="flex justify-center gap-2">
                  
                  {/* عرض أزرار العمليات فقط إذا كان مسموحاً */}
                  {showActions && (
                    <>
                      <button onClick={() => onTransaction(item, 'OUT')} className="bg-red-900/40 hover:bg-red-800/60 border border-red-800 text-red-200 px-2 py-1.5 rounded text-xs transition-colors" title="صرف / سحب من المخزن">📤</button>
                      <button onClick={() => onTransaction(item, 'IN')} className="bg-green-900/40 hover:bg-green-800/60 border border-green-800 text-green-200 px-2 py-1.5 rounded text-xs transition-colors" title="استلام / إدخال للمخزن">📥</button>
                      <button onClick={() => onMaintenance(item)} className="bg-orange-900/40 hover:bg-orange-800/60 border border-orange-700 text-orange-200 px-2 py-1.5 rounded text-xs transition-colors" title="إدارة الصيانة والتالف">🛠️</button>
                    </>
                  )}

                  {/* زر السجل يظهر للجميع دائماً */}
                  <button onClick={() => onHistory(item)} className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded border border-gray-600 text-xs flex items-center gap-1.5 transition-colors font-medium">
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