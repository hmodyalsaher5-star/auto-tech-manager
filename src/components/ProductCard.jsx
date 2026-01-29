export default function ProductCard({ product, userRole, onDelete, onEdit }) {
  // ... (تأكد من أن userRole يصل هنا عبر الـ props)
  
  // دالة مساعدة لتحديد الألوان (لم تتغير)
  const getStockColor = (qty) => {
    if (qty === 0) return 'text-red-500';
    if (qty <= 5) return 'text-yellow-500';
    return 'text-green-400';
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-gray-500 transition relative group animate-fadeIn">
      
      {/* شريط الإجراءات (يظهر فقط للمدير والمشرف) */}
      {(userRole === 'admin' || userRole === 'supervisor') && (
        <div className="absolute top-2 left-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition duration-300">
            
            {/* زر التعديل: يظهر للمدير والمشرف */}
            <button 
                onClick={() => onEdit(product)} 
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg" 
                title="تعديل"
            >
                ✏️
            </button>

            {/* 🔒 زر الحذف: يظهر للمدير فقط (admin) */}
            {userRole === 'admin' && (
                <button 
                    onClick={() => onDelete(product.id, product.table)} 
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg" 
                    title="حذف"
                >
                    🗑️
                </button>
            )}
        </div>
      )}

      {/* باقي تصميم الكارت (الصورة والتفاصيل) يبقى كما هو */}
      <div className="h-48 overflow-hidden bg-gray-900 flex justify-center items-center relative">
         {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
         ) : (
            <span className="text-gray-600 text-4xl">🖼️</span>
         )}
         <div className="absolute bottom-0 w-full bg-black/60 p-1 text-center text-xs text-gray-300">
             {product.type}
         </div>
      </div>

      <div className="p-4 text-right">
        <h3 className="text-lg font-bold text-white mb-2 truncate">{product.name}</h3>
        
        <div className="flex justify-between items-center mb-2">
           <span className="text-sm text-gray-400">الرصيد:</span>
           <span className={`font-bold ${getStockColor(product.stock_quantity)}`}>{product.stock_quantity} قطعة</span>
        </div>

        {product.selling_price && (
            <div className="text-xl font-bold text-green-400 mt-2">
                {Number(product.selling_price).toLocaleString()} د.ع
            </div>
        )}
      </div>
    </div>
  );
}