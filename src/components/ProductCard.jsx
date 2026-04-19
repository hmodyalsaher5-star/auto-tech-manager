import React, { useState } from 'react';

function ProductCard({ product, userRole, onDelete, onEdit, sizes = [] }) {
  // حالة التحكم في فتح وإغلاق نافذة الصورة
  const [isModalOpen, setIsModalOpen] = useState(false);

  const price = product.selling_price || product.price || 0;
  const currencySymbol = product.currency === 'USD' ? '$' : 'د.ع';
  const formattedPrice = Number(price).toLocaleString();

  const getStockColor = (qty) => {
    if (!qty || qty === 0) return 'text-red-500';
    if (qty <= 5) return 'text-yellow-500';
    return 'text-green-400';
  };

  const sizeObj = sizes.find(s => s.id === product.size_id);
  const sizeName = sizeObj ? sizeObj.size_name : (product.screen_size || 'قياسي');

  const showEditButton = userRole === 'admin' || userRole === 'supervisor';
  const showDeleteButton = userRole === 'admin';

  // وظيفة تحميل الصورة للجهاز
  const handleDownload = async (e) => {
    e.stopPropagation(); // منع إغلاق النافذة عند الضغط على زر التحميل
    try {
      const response = await fetch(product.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-${product.name || 'image'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("فشل التحميل:", error);
      alert("عذراً، تعذر تحميل الصورة حالياً.");
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 flex flex-col hover:shadow-2xl transition-shadow duration-300 relative animate-fadeIn">
        
        {/* قسم الصورة - قابل للضغط */}
        <div 
          className="relative h-64 w-full bg-gray-900 cursor-pointer overflow-hidden group"
          onClick={() => setIsModalOpen(true)}
        >
          <img 
            src={product.image_url || "https://via.placeholder.com/300?text=No+Image"} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          {/* مؤشر العدسة المكبرة للهواتف */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="bg-black/50 p-3 rounded-full text-white text-2xl">🔍</span>
          </div>
          
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 m-2 rounded-lg shadow-lg">
            {product.type || product.typeLabel}
          </div>
        </div>

        {/* تفاصيل المنتج */}
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="text-xl font-bold text-white mb-2 truncate">{product.name || 'منتج بدون اسم'}</h3>
          
          <div className="text-2xl font-black text-yellow-400 mb-3 flex items-baseline gap-1">
            <span>{formattedPrice}</span>
            <span className="text-sm font-normal text-yellow-600">{currencySymbol}</span>
          </div>

          <div className="mb-4 text-sm font-bold bg-gray-900/50 p-3 rounded-lg flex justify-between border border-gray-700">
            <span className="text-gray-400">المخزون:</span>
            <span className={getStockColor(product.stock_quantity)}>
              {product.stock_quantity || 0} قطعة
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400">
            <p className="flex justify-between border-b border-gray-700/50 pb-1">
              <span>📏 الحجم:</span>
              <span className="text-gray-200 font-bold">{sizeName}</span>
            </p>
            {product.ram && <p className="flex justify-between border-b border-gray-700/50 pb-1"><span>💾 الذاكرة:</span> <span className="text-gray-200">{product.ram}</span></p>}
            {product.processor && <p className="flex justify-between border-b border-gray-700/50 pb-1"><span>⚙️ المعالج:</span> <span className="text-gray-200">{product.processor}</span></p>}
          </div>

          {/* أزرار التحكم - ظاهرة دائماً للموظفين */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
            {showEditButton && (
              <button 
                onClick={() => onEdit(product)}
                className="flex-1 bg-blue-600 active:bg-blue-800 text-white py-3 rounded-xl text-sm font-bold shadow-lg flex justify-center items-center gap-2"
              >
                ✏️ تعديل
              </button>
            )}
            
            {showDeleteButton && (
              <button 
                onClick={() => onDelete(product.id, product.table)}
                className="flex-1 bg-red-600 active:bg-red-800 text-white py-3 rounded-xl text-sm font-bold shadow-lg flex justify-center items-center gap-2"
              >
                🗑️ حذف
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- النافذة المنبثقة للصورة (Modal) --- */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[999] bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          {/* زر الإغلاق */}
          <button className="absolute top-5 right-5 text-white text-4xl p-2">&times;</button>
          
          {/* الصورة الكبيرة */}
          <img 
            src={product.image_url} 
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
            alt="Full view"
            onClick={(e) => e.stopPropagation()} // منع الإغلاق عند الضغط على الصورة نفسها
          />

          {/* أزرار أسفل الصورة في المودال */}
          <div className="mt-8 flex gap-4">
             <button 
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl"
             >
                📥 تحميل الصورة للجهاز
             </button>
             <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-700 text-white px-8 py-3 rounded-full font-bold shadow-xl"
             >
                إغلاق
             </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductCard;