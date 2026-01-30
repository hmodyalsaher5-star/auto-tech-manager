import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function EditProductModal({ product, onClose, onUpdate }) {
  
  const [sizes, setSizes] = useState([]);

  // تهيئة البيانات
  const [formData, setFormData] = useState({
    name: product.name,
    // ✅ هنا التعديل: نعتمد على price الموجود في القاعدة
    price: product.price || 0, 
    currency: product.currency || 'USD',
    image_url: product.image_url || '',
    specs: product.specs || '', 
    size_id: product.size_id || '', 
    is_universal: !product.generation_id 
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSizes = async () => {
      const { data } = await supabase.from('standard_sizes').select('*');
      if (data) setSizes(data);
    };
    fetchSizes();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // تجهيز كائن التحديث
      const updates = {
          name: formData.name,
          // ✅✅✅ هنا التعديل الجوهري: أرسلنا price بدلاً من selling_price
          price: parseInt(formData.price), 
          currency: formData.currency,
          image_url: formData.image_url,
          size_id: formData.size_id,
          generation_id: formData.is_universal ? null : product.generation_id,
          ...(product.table === 'screens' && { specs: formData.specs }) 
      };

      // إرسال التحديث لـ Supabase
      const { error } = await supabase
        .from(product.table) 
        .update(updates)
        .eq('id', product.id);

      if (error) throw error;

      onUpdate({ ...product, ...updates });
      onClose();
      alert("✅ تم تعديل المنتج بنجاح");

    } catch (error) {
      alert("❌ حدث خطأ: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-600 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold text-yellow-400 mb-4 text-right">✏️ تعديل المنتج</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-right dir-rtl">
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">اسم المنتج</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500" />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">السعر والعملة</label>
            <div className="flex gap-2">
                <select name="currency" value={formData.currency} onChange={handleChange} className="w-1/3 p-2 rounded bg-gray-700 text-white border border-gray-600 font-bold text-center">
                    <option value="USD">دولار ($)</option>
                    <option value="IQD">دينار (د.ع)</option>
                </select>
                {/* تأكدنا أن الاسم هنا price ليطابق الـ state */}
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">📏 مقاس المنتج</label>
            <select name="size_id" value={formData.size_id} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600">
                <option value="">-- اختر المقاس --</option>
                {sizes.map(size => <option key={size.id} value={size.id}>{size.size_name}</option>)}
            </select>
          </div>

          <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
             <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_universal" checked={formData.is_universal} onChange={handleChange} className="w-5 h-5 rounded border-gray-500 text-blue-600 focus:ring-blue-500" />
                <span className="text-white font-bold">جعل المنتج "عام" (يونيفرسال) 🌍</span>
             </label>
             <p className="text-xs text-gray-400 mt-2 mr-8">تفعيل هذا الخيار سيقوم بفك ارتباط المنتج بالسيارة الحالية ويجعله يظهر لكل السيارات التي تدعم هذا المقاس.</p>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">رابط الصورة</label>
            <input type="text" name="image_url" value={formData.image_url} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 text-left" dir="ltr" />
          </div>

          {product.table === 'screens' && (
            <div>
              <label className="text-gray-400 text-sm block mb-1">المواصفات</label>
              <textarea name="specs" value={formData.specs} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" rows="3" />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white transition">إلغاء</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition shadow-lg">{loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}