import { useState } from 'react';
import { supabase } from '../supabase';

export default function EditProductModal({ product, onClose, onUpdate }) {
  // تهيئة البيانات (مع إضافة العملة)
  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price,
    currency: product.currency || 'USD', // 🆕 قراءة العملة الحالية أو افتراضياً دولار
    image_url: product.image_url || '',
    specs: product.specs || '', 
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from(product.table) 
        .update({
          name: formData.name,
          price: parseInt(formData.price),
          currency: formData.currency, // 🆕 تحديث العملة
          image_url: formData.image_url,
          ...(product.table === 'screens' && { specs: formData.specs }) 
        })
        .eq('id', product.id);

      if (error) throw error;

      onUpdate({ ...product, ...formData });
      onClose();
      alert("✅ تم تعديل المنتج بنجاح");

    } catch (error) {
      alert("❌ حدث خطأ: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-600 shadow-2xl">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">✏️ تعديل المنتج</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm">اسم المنتج</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleChange} required
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500"
            />
          </div>

          {/* 🆕 قسم السعر والعملة */}
          <div>
            <label className="text-gray-400 text-sm">السعر والعملة</label>
            <div className="flex gap-2">
                <input 
                  type="number" name="price" value={formData.price} onChange={handleChange} required
                  className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600"
                />
                <select 
                  name="currency" 
                  value={formData.currency} 
                  onChange={handleChange}
                  className="w-1/3 p-2 rounded bg-gray-700 text-white border border-gray-600 font-bold text-center"
                >
                    <option value="USD">دولار ($)</option>
                    <option value="IQD">دينار (د.ع)</option>
                </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm">رابط الصورة</label>
            <input 
              type="text" name="image_url" value={formData.image_url} onChange={handleChange}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {product.table === 'screens' && (
            <div>
              <label className="text-gray-400 text-sm">المواصفات</label>
              <textarea 
                name="specs" value={formData.specs} onChange={handleChange}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                rows="3"
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button 
              type="button" onClick={onClose}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white transition"
            >
              إلغاء
            </button>
            <button 
              type="submit" disabled={loading}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}