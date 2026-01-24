// حذفنا { useState } لأننا لا نحتاجها هنا
import React from 'react'; 

function ProductCard({ product, userRole, onDelete, onEdit }) {
  // تحديد رمز العملة للعرض
  const currencySymbol = product.currency === 'IQD' ? 'د.ع' : '$';
  
  // تنسيق الرقم (الدينار يظهر بفواصل، الدولار كما هو)
  const formattedPrice = product.currency === 'IQD' 
    ? product.price.toLocaleString() 
    : product.price;

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 flex flex-col hover:shadow-2xl transition-shadow duration-300 relative group">
      
      {/* صورة المنتج */}
      <div className="relative h-48 w-full bg-gray-900 overflow-hidden">
         <img 
           src={product.image_url || "https://via.placeholder.com/300?text=No+Image"} 
           alt={product.name} 
           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
         />
         <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 m-2 rounded shadow">
           {product.type}
         </div>
      </div>

      {/* تفاصيل المنتج */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
           <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-white leading-tight">{product.name || 'منتج بدون اسم'}</h3>
           </div>
           
           {/* عرض السعر مع العملة */}
           <div className="text-2xl font-bold text-yellow-400 mb-3 flex items-center gap-1">
              <span>{formattedPrice}</span>
              <span className="text-sm text-yellow-600">{currencySymbol}</span>
           </div>
           
           <div className="space-y-1 text-sm text-gray-400 mb-4">
              {product.screen_size && <p>📏 الحجم: <span className="text-gray-200">{product.screen_size}</span></p>}
              {product.ram && <p>💾 الذاكرة: <span className="text-gray-200">{product.ram}</span></p>}
              {product.processor && <p>⚙️ المعالج: <span className="text-gray-200">{product.processor}</span></p>}
              {product.storage && <p>💽 التخزين: <span className="text-gray-200">{product.storage}</span></p>}
              {product.details && <p className="mt-2 text-xs border-t border-gray-700 pt-2">{product.details}</p>}
           </div>
        </div>

        {/* أزرار التحكم */}
        {(userRole === 'admin' || userRole === 'supervisor') && (
           <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
               <button 
                 onClick={() => onEdit(product)}
                 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-bold transition"
               >
                 ✏️ تعديل
               </button>
               
               {userRole === 'admin' && (
                 <button 
                   onClick={() => onDelete(product.id, product.table)}
                   className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-bold transition"
                 >
                   🗑️ حذف
                 </button>
               )}
           </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard