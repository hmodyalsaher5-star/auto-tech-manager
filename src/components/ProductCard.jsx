import React from 'react'; 

// ✅ أضفنا sizes هنا في المدخلات
function ProductCard({ product, userRole, onDelete, onEdit, sizes = [] }) {
  
  const price = product.selling_price || product.price || 0;
  const currencySymbol = product.currency === 'USD' ? '$' : 'د.ع';
  const formattedPrice = Number(price).toLocaleString();

  const getStockColor = (qty) => {
    if (!qty || qty === 0) return 'text-red-500';
    if (qty <= 5) return 'text-yellow-500';
    return 'text-green-400';
  };

  // ✅ كود استخراج اسم المقاس
  // نبحث في قائمة المقاسات عن المقاس الذي يطابق size_id الخاص بالمنتج
  const sizeObj = sizes.find(s => s.id === product.size_id);
  // إذا وجدناه نأخذ اسمه، وإلا نستخدم القيمة القديمة أو نكتب "قياسي"
  const sizeName = sizeObj ? sizeObj.size_name : (product.screen_size || 'قياسي');

  const showEditButton = userRole === 'admin' || userRole === 'supervisor';
  const showDeleteButton = userRole === 'admin';

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 flex flex-col hover:shadow-2xl transition-shadow duration-300 relative group animate-fadeIn">
      
      {/* صورة المنتج */}
      <div className="relative h-48 w-full bg-gray-900 overflow-hidden">
         <img 
           src={product.image_url || "https://via.placeholder.com/300?text=No+Image"} 
           alt={product.name} 
           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
         />
         <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 m-2 rounded shadow">
           {product.type || product.typeLabel}
         </div>
      </div>

      {/* تفاصيل المنتج */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
           <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-white leading-tight">{product.name || 'منتج بدون اسم'}</h3>
           </div>
           
           <div className="text-2xl font-bold text-yellow-400 mb-2 flex items-center gap-1">
              <span>{formattedPrice}</span>
              <span className="text-sm text-yellow-600">{currencySymbol}</span>
           </div>

           <div className="mb-3 text-sm font-bold bg-gray-700/50 p-2 rounded flex justify-between">
              <span className="text-gray-300">الرصيد المخزني:</span>
              <span className={getStockColor(product.stock_quantity)}>
                {product.stock_quantity || 0} قطعة
              </span>
           </div>
           
           <div className="space-y-1 text-sm text-gray-400 mb-4">
              {/* ✅ عرض المقاس الصحيح هنا */}
              <p>📏 الحجم: <span className="text-gray-200 font-bold">{sizeName}</span></p>
              
              {product.ram && <p>💾 الذاكرة: <span className="text-gray-200">{product.ram}</span></p>}
              {product.processor && <p>⚙️ المعالج: <span className="text-gray-200">{product.processor}</span></p>}
              {product.storage && <p>💽 التخزين: <span className="text-gray-200">{product.storage}</span></p>}
              {product.details && <p className="mt-2 text-xs border-t border-gray-700 pt-2">{product.details}</p>}
           </div>
        </div>

        {/* أزرار التحكم */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700 opacity-0 group-hover:opacity-100 transition duration-300">
           {showEditButton && (
             <button 
               onClick={() => onEdit(product)}
               className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-bold transition flex justify-center items-center gap-2"
             >
               ✏️ تعديل
             </button>
           )}
           
           {showDeleteButton && (
             <button 
               onClick={() => onDelete(product.id, product.table)}
               className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-bold transition flex justify-center items-center gap-2"
             >
               🗑️ حذف
             </button>
           )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard;