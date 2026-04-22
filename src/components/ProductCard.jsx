import React, { useState } from 'react';
import { 
  ZoomIn, Edit3, Trash2, Download, X, 
  Ruler, Server, Cpu, PackageSearch 
} from 'lucide-react';

function ProductCard({ product, userRole, onDelete, onEdit, sizes = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const price = product.selling_price || product.price || 0;
  const currencySymbol = product.currency === 'USD' ? '$' : 'د.ع';
  const formattedPrice = Number(price).toLocaleString();

  // ألوان المخزون متناسقة مع الخلفية الداكنة
  const getStockColor = (qty) => {
    if (!qty || qty === 0) return 'text-rose-400 font-bold drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]';
    if (qty <= 5) return 'text-amber-400 font-bold drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]';
    return 'text-emerald-400 font-bold drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]';
  };

  const sizeObj = sizes.find(s => s.id === product.size_id);
  const sizeName = sizeObj ? sizeObj.size_name : (product.screen_size || 'قياسي');

  const showEditButton = userRole === 'admin' || userRole === 'supervisor';
  const showDeleteButton = userRole === 'admin';

  const handleDownload = async (e) => {
    e.stopPropagation();
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
      {/* 🎨 البطاقة الزجاجية */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-xl border border-white/10 flex flex-col hover:border-amber-500/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300 relative group animate-fadeIn">
        
        {/* قسم الصورة */}
        <div 
          className="relative h-60 w-full bg-black/40 cursor-pointer overflow-hidden"
          onClick={() => setIsModalOpen(true)}
        >
          <img 
            src={product.image_url || "https://via.placeholder.com/300?text=No+Image"} 
            alt={product.name} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
          />
          
          {/* تراكب العدسة المكبرة (يظهر عند التحويم) */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="bg-amber-500/20 border border-amber-500/50 p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <ZoomIn className="text-amber-400 w-8 h-8" />
             </div>
          </div>
          
          {/* تصنيف المنتج */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 text-orange-100/90 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
            {product.type || product.typeLabel}
          </div>
        </div>

        {/* تفاصيل المنتج */}
        <div className="p-6 flex-grow flex flex-col relative">
          
          {/* توهج داخلي خفيف للبطاقة */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none"></div>

          <h3 className="text-xl font-bold text-orange-50 mb-1 truncate drop-shadow-sm">{product.name || 'منتج بدون اسم'}</h3>
          
          <div className="text-2xl font-black text-amber-400 mb-5 flex items-baseline gap-1 drop-shadow-md">
            <span>{formattedPrice}</span>
            <span className="text-sm font-bold text-amber-600/80">{currencySymbol}</span>
          </div>

          {/* المخزون */}
          <div className="mb-5 text-sm font-bold bg-black/30 backdrop-blur-sm p-4 rounded-2xl flex justify-between items-center border border-white/5 shadow-inner">
            <span className="text-orange-200/60 flex items-center gap-2">
                <PackageSearch className="w-4 h-4" /> المخزون:
            </span>
            <span className={getStockColor(product.stock_quantity)}>
              {product.stock_quantity || 0} قطعة
            </span>
          </div>
          
          {/* المواصفات */}
          <div className="space-y-3 text-sm text-orange-100/70 mb-2">
            <p className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="flex items-center gap-2"><Ruler className="w-4 h-4 text-teal-500/70"/> الحجم:</span>
              <span className="text-orange-50 font-bold">{sizeName}</span>
            </p>
            {product.ram && (
                <p className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2"><Server className="w-4 h-4 text-teal-500/70"/> الذاكرة:</span> 
                    <span className="text-orange-50 font-bold">{product.ram}</span>
                </p>
            )}
            {product.processor && (
                <p className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-teal-500/70"/> المعالج:</span> 
                    <span className="text-orange-50 font-bold">{product.processor}</span>
                </p>
            )}
          </div>

          {/* أزرار التحكم (تظهر في الأسفل دائماً) */}
          <div className="flex gap-3 mt-auto pt-6">
            {showEditButton && (
              <button 
                onClick={() => onEdit(product)}
                className="flex-1 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 py-3 rounded-2xl text-sm font-bold shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4" /> تعديل
              </button>
            )}
            
            {showDeleteButton && (
              <button 
                onClick={() => onDelete(product.id, product.table)}
                className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 py-3 rounded-2xl text-sm font-bold shadow-lg flex justify-center items-center gap-2 transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" /> حذف
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🎨 النافذة المنبثقة للصورة (Modal الزجاجي) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          {/* زر الإغلاق */}
          <button className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full p-2 transition-colors">
              <X className="w-6 h-6" />
          </button>
          
          {/* الصورة الكبيرة */}
          <div className="relative p-2 bg-white/5 border border-white/10 rounded-2xl shadow-2xl">
            <img 
              src={product.image_url} 
              className="max-w-full max-h-[75vh] rounded-xl object-contain"
              alt="Full view"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>

          {/* أزرار أسفل الصورة في المودال */}
          <div className="mt-8 flex gap-4">
             <button 
                onClick={handleDownload}
                className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all active:scale-95"
             >
                <Download className="w-5 h-5" /> حفظ الصورة
             </button>
             <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 px-8 py-3 rounded-full font-bold transition-all active:scale-95"
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