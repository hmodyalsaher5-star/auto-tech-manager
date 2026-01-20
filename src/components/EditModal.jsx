import { useState } from 'react'
import { supabase } from '../supabase'

function EditModal({ product, onClose }) {
  const [loading, setLoading] = useState(false);
  // نملأ الاستمارة ببيانات المنتج القديمة
  const [formData, setFormData] = useState({
    name: product.name,
    brand: product.brand,
    model: product.model,
    year: product.year,
    price: product.price,
    image_url: product.image_url
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // أمر التحديث (Update)
    const { error } = await supabase
      .from('products')
      .update(formData)     // البيانات الجديدة
      .eq('id', product.id); // شرط: عدل فقط المنتج الذي يحمل هذا الرقم

    if (error) {
      alert("❌ حدث خطأ: " + error.message);
      setLoading(false);
    } else {
      alert("✅ تم تعديل البيانات بنجاح!");
      window.location.reload(); // تحديث الصفحة لرؤية التغيير
    }
  };

  return (
    // خلفية سوداء شفافة تغطي الشاشة
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      
      {/* الصندوق الأبيض (النافذة) */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600 relative">
        
        <h2 className="text-xl font-bold text-white mb-4">✏️ تعديل المنتج</h2>
        
        <form onSubmit={handleUpdate} className="space-y-3">
          
          <div>
            <label className="text-gray-400 text-sm">الاسم</label>
            <input name="name" value={formData.name} onChange={handleChange} 
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-gray-400 text-sm">الشركة</label>
              <input name="brand" value={formData.brand} onChange={handleChange} 
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">الموديل</label>
              <input name="model" value={formData.model} onChange={handleChange} 
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
          </div>

          <div>
             <label className="text-gray-400 text-sm">السنة</label>
             <input name="year" value={formData.year} onChange={handleChange} 
               className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
          </div>

          <div>
             <label className="text-gray-400 text-sm">السعر</label>
             <input name="price" value={formData.price} onChange={handleChange} 
               className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-2 mt-6">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-bold">
              {loading ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
            
            <button type="button" onClick={onClose}
              className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded">
              إلغاء
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default EditModal