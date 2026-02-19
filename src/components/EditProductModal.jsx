import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression'; // 🆕 استدعاء مكتبة الضغط

export default function EditProductModal({ product, onClose, onUpdate }) {
  const [sizes, setSizes] = useState([]);

  // تهيئة البيانات
  const [formData, setFormData] = useState({
    name: product.name,
    price: product.price || 0, 
    currency: product.currency || 'USD',
    image_url: product.image_url || '',
    specs: product.specs || '', 
    size_id: product.size_id || '', 
    is_universal: !product.generation_id 
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // 🆕 حالة لرفع الصورة
  const [message, setMessage] = useState('');

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

  // 🆕 --- دالة ضغط ورفع الصورة ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage('⏳ جاري ضغط ورفع الصورة...');

    try {
      // 1. إعدادات الضغط
      const options = {
        maxSizeMB: 0.2, // أقصى حجم 200 كيلوبايت
        maxWidthOrHeight: 1200, // أقصى عرض
        useWebWorker: true,
        fileType: 'image/webp' // التحويل القسري لـ webp
      };

      // 2. ضغط الصورة في المتصفح
      const compressedFile = await imageCompression(file, options);
      
      // 3. توليد اسم فريد
      const fileName = `product_${Date.now()}.webp`;

      // 4. الرفع إلى باكت products في Supabase
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
           cacheControl: '3600',
           upsert: false
        });

      if (error) throw error;

      // 5. جلب الرابط العام للصورة الجديدة
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      // 6. تحديث الاستمارة بالرابط الجديد
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      setMessage('✅ تم تحديث الصورة بنجاح!');

    } catch (error) {
      console.error("Image upload error:", error);
      setMessage(`❌ خطأ في الرفع: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // تجهيز كائن التحديث
      const updates = {
          name: formData.name,
          price: parseInt(formData.price), 
          currency: formData.currency,
          image_url: formData.image_url,
          size_id: formData.size_id ? parseInt(formData.size_id) : null,
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
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-600 shadow-2xl overflow-y-auto max-h-[90vh] dir-rtl text-right">
        <h2 className="text-xl font-bold text-yellow-400 mb-4 text-center border-b border-gray-700 pb-2">✏️ تعديل المنتج</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-gray-400 text-sm block mb-1">اسم المنتج</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">السعر والعملة</label>
            <div className="flex gap-2">
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none" />
                <select name="currency" value={formData.currency} onChange={handleChange} className="w-1/3 p-2 rounded bg-gray-700 text-white border border-gray-600 font-bold text-center focus:border-blue-500 outline-none">
                    <option value="USD">دولار ($)</option>
                    <option value="IQD">دينار (د.ع)</option>
                </select>
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm block mb-1">📏 مقاس المنتج</label>
            <select name="size_id" value={formData.size_id} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none">
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

          {/* 🆕 قسم تعديل الصورة */}
          <div className="bg-gray-900/50 p-4 rounded border border-gray-600 space-y-3">
              <label className="text-gray-300 font-bold text-sm block">صورة المنتج</label>
              
              {/* عرض الصورة الحالية إن وجدت */}
              {formData.image_url && (
                  <div className="flex justify-center mb-2">
                      <img src={formData.image_url} alt="Current Product" className="h-24 rounded border border-gray-500 shadow-md object-cover" />
                  </div>
              )}

              <div className="flex items-center gap-3">
                  <div className="relative flex-grow">
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`w-full px-4 py-2 rounded font-bold text-sm text-center transition border border-dashed ${uploadingImage ? 'border-gray-500 bg-gray-700 text-gray-400' : 'border-blue-500 bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'}`}>
                          {uploadingImage ? 'جاري الرفع...' : '📂 رفع صورة جديدة'}
                      </div>
                  </div>
              </div>

              <input 
                  type="text" name="image_url" 
                  value={formData.image_url} onChange={handleChange} 
                  placeholder="الرابط اليدوي للصورة..."
                  className="w-full p-2 text-xs rounded bg-gray-800 text-gray-400 border border-gray-600 outline-none text-left" dir="ltr" 
              />
              
              {/* رسالة الرفع */}
              {message && (
                  <div className={`text-xs text-center mt-1 ${message.includes('❌') ? 'text-red-400' : 'text-green-400'}`}>
                      {message}
                  </div>
              )}
          </div>

          {product.table === 'screens' && (
            <div>
              <label className="text-gray-400 text-sm block mb-1">المواصفات</label>
              <textarea name="specs" value={formData.specs} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 outline-none" rows="3" />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} disabled={uploadingImage} className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 rounded text-white transition font-bold">إلغاء</button>
            <button type="submit" disabled={loading || uploadingImage} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition shadow-lg">{loading ? 'جاري الحفظ...' : 'حفظ التعديلات ✅'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}