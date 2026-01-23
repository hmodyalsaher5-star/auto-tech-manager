import React from 'react';

// لاحظ أننا نستقبل خاصية جديدة اسمها onDelete
export default function ProductCard({ product, userRole, onDelete }) {
  
  return (
    <div className="bg-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 relative border border-gray-600">
      
      {/* صورة المنتج */}
      <div className="h-48 overflow-hidden bg-gray-800 flex items-center justify-center">
        {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
            <span className="text-gray-500">لا توجد صورة</span>
        )}
      </div>

      {/* المحتوى */}
      <div className="p-4">
        {/* التسمية التوضيحية (شاشة / إطار) */}
        <div className="flex justify-between items-start mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${product.table === 'frames' ? 'bg-blue-900 text-blue-200' : 'bg-purple-900 text-purple-200'}`}>
                {product.type}
            </span>
            <span className="text-green-400 font-bold text-lg">{product.price} ر.س</span>
        </div>

        <h3 className="text-xl font-bold mb-2 text-white">{product.name}</h3>
        
        {product.specs && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.specs}</p>
        )}

        <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded transition duration-200">
          أضف للسلة 🛒
        </button>

        {/* 🗑️ زر الحذف (يظهر فقط للمدير) */}
        {userRole === 'admin' && (
          <button 
            onClick={() => onDelete(product.id, product.table)} // استدعاء دالة الحذف
            className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200 flex items-center justify-center gap-2"
          >
            🗑️ حذف المنتج
          </button>
        )}
      </div>
    </div>
  );
}