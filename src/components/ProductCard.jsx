import { useState } from 'react'
// import { supabase } from '../supabase' // 👈 أوقفناها مؤقتاً لأننا في وضع التجربة المحلية
import EditModal from './EditModal'

// 1. نستقبل userRole بدلاً من isAdmin
function ProductCard({ product, userRole }) {
  const [showEditModal, setShowEditModal] = useState(false);

  // دالة الحذف (تم تعديلها للمحاكاة)
  const handleDelete = async () => {
    // التحقق: هل أنت مدير؟ (حماية إضافية)
    if (userRole !== 'admin') {
      alert("⛔ ليس لديك صلاحية الحذف!");
      return;
    }

    const isConfirmed = confirm(`هل أنت متأكد أنك تريد حذف: ${product.name}؟ \n(ملاحظة: هذا حذف تجريبي لأننا نستخدم بيانات محلية)`);
    
    if (isConfirmed) {
      // 🛑 كود Supabase القديم (سنعيده لاحقاً)
      // const { error } = await supabase.from('products').delete().eq('id', product.id);
      // if (error) alert("❌ خطأ"); else window.location.reload();
      
      // ✅ كود التجربة الحالي:
      alert("✅ تمت عملية الحذف بنجاح (محاكاة)!");
    }
  };

  return (
    <>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-500 transition-all shadow-lg relative group">
        
        {/* التعامل الذكي مع الصور: إذا كانت من النت يعرضها، وإذا محلية يعرض بديل */}
        <img 
          src={product.image_url || product.image || "https://placehold.co/600x400?text=Auto+Part"} 
          alt={product.name} 
          className="w-full h-48 object-cover rounded-lg mb-4 bg-gray-900"
        />

        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white">{product.name}</h3>
          <span className="bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">
            {product.year}
          </span>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          {product.brand} - {product.model}
        </p>

        <div className="flex justify-between items-center mt-4 border-t border-gray-700 pt-4">
          <span className="text-green-400 font-bold text-xl">{product.price}</span>
          
          {/* 2. منطقة الأزرار: تظهر للمدير والمشرف فقط (ليس للزائر) */}
          {userRole !== 'guest' && (
            <div className="flex gap-2">
              
              {/* زر التعديل: يظهر للجميع (مدير ومشرف) */}
              <button 
                onClick={() => setShowEditModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
                title="تعديل المنتج"
              >
                ✏️
              </button>

              {/* 3. زر الحذف: يظهر للمدير (admin) فـقـط */}
              {userRole === 'admin' && (
                <button 
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
                  title="حذف المنتج"
                >
                  🗑️
                </button>
              )}
            </div>
          )}
          
        </div>

      </div>

      {showEditModal && (
        <EditModal 
          product={product} 
          onClose={() => setShowEditModal(false)} 
        />
      )}
    </>
  )
}

export default ProductCard