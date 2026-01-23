import React from 'react';

export default function ProductCard({ product, userRole, onDelete, onEdit }) {
  
  // هل المستخدم لديه صلاحية التعديل؟ (مدير أو مشرف)
  const canEdit = userRole === 'admin' || userRole === 'supervisor';

  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 relative border border-gray-600 flex flex-col h-full">
      
      {/* الصورة */}
      <div className="h-48 overflow-hidden bg-gray-800 flex items-center justify-center relative group">
        {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
            <span className="text-gray-500">لا توجد صورة</span>
        )}
      </div>

      {/* المحتوى */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${product.table === 'frames' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}>
                {product.type}
            </span>
            <span className="text-green-400 font-bold text-lg">{product.price} 💰</span>
        </div>

        <h3 className="text-xl font-bold mb-2 text-white">{product.name}</h3>
        
        {product.specs && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.specs}</p>
        )}

        {/* دفع الأزرار للأسفل دائماً */}
        <div className="mt-auto pt-4 space-y-2">
            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition duration-200">
              أضف للسلة 🛒
            </button>

            {/* أزرار التحكم (للمدير والمشرف) */}
            {canEdit && (
              <div className="flex gap-2">
                {/* زر التعديل */}
                <button 
                  onClick={() => onEdit(product)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded transition duration-200 text-sm"
                >
                  ✏️ تعديل
                </button>
                
                {/* زر الحذف (للمدير فقط) */}
                {userRole === 'admin' && (
                  <button 
                    onClick={() => onDelete(product.id, product.table)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded transition duration-200 text-sm"
                  >
                    🗑️ حذف
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}