import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression';

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
  const [uploadingImage, setUploadingImage] = useState(false);
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

  // دالة حذف الصورة من السيرفر
  const deleteOldImage = async (oldUrl) => {
      if (!oldUrl || !oldUrl.includes('supabase.co')) return false; 

      try {
          const parts = oldUrl.split('/public/products/');
          if (parts.length > 1) {
              const fileName = parts[1].split('?')[0]; 
              console.log('🔍 جاري الحذف:', fileName); 
              
              const { error } = await supabase.storage.from('products').remove([fileName]);
              
              if (error) {
                  console.error('❌ خطأ من سيرفر Supabase:', error);
                  return false;
              } else {
                  console.log('🗑️ تم الحذف بنجاح!');
                  return true;
              }
          }
      } catch (err) {
          console.error('⚠️ تعذر الحذف:', err);
          return false;
      }
      return false;
  };

  // دالة زر الحذف اليدوي
  const handleDeleteImageClick = async () => {
      if (!formData.image_url) return;
      
      if (!window.confirm("هل أنت متأكد من حذف هذه الصورة نهائياً؟")) return;

      setUploadingImage(true);
      setMessage('⏳ جاري حذف الصورة...');

      const success = await deleteOldImage(formData.image_url);
      
      if (success) {
          setFormData(prev => ({ ...prev, image_url: '' })); 
          setMessage('🗑️ تم حذف الصورة بنجاح!');
      } else {
          setMessage('⚠️ حدثت مشكلة، قد تكون الصورة غير موجودة أصلاً بالسيرفر ولكن تم تفريغ الرابط.');
          setFormData(prev => ({ ...prev, image_url: '' })); 
      }
      
      setUploadingImage(false);
  };

  // --- دالة ضغط ورفع الصورة ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage('⏳ جاري ضغط ورفع الصورة...');

    try {
      const options = {
        maxSizeMB: 0.5, 
        maxWidthOrHeight: 1024, 
        useWebWorker: false, 
        fileType: 'image/webp',
        initialQuality: 0.85
      };

      const compressedFile = await imageCompression(file, options);
      const fileName = `product_${Date.now()}.webp`;

      // 1. حذف الصورة القديمة قبل رفع الجديدة (إن وجدت)
      if (formData.image_url) {
          await deleteOldImage(formData.image_url);
      }

      // 2. رفع الصورة الجديدة
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
           cacheControl: '3600',
           upsert: false
        });

      if (error) throw error;

      // 3. جلب الرابط الجديد
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      // 4. تحديث الاستمارة بالرابط الجديد
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      setMessage('✅ تم رفع الصورة بنجاح!');

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
      // ✅ التعديل الأهم هنا: لا نرسل size_id إذا كان الجدول accessories
      const updates = {
          name: formData.name,
          price: parseInt(formData.price), 
          currency: formData.currency,
          image_url: formData.image_url,
          generation_id: formData.is_universal ? null : product.generation_id,
          ...(product.table !== 'accessories' && { size_id: formData.size_id ? parseInt(formData.size_id) : null }),
          ...((product.table === 'screens' || product.table === 'accessories') && { specs: formData.specs }) 
      };

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

          {/* ✅ إخفاء حقل المقاس عن الإكسسوارات */}
          {product.table !== 'accessories' && (
            <div>
              <label className="text-gray-400 text-sm block mb-1">📏 مقاس المنتج</label>
              <select name="size_id" value={formData.size_id} onChange={handleChange} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none">
                  <option value="">-- اختر المقاس --</option>
                  {sizes.map(size => <option key={size.id} value={size.id}>{size.size_name}</option>)}
              </select>
            </div>
          )}

          <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
             <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_universal" checked={formData.is_universal} onChange={handleChange} className="w-5 h-5 rounded border-gray-500 text-blue-600 focus:ring-blue-500" />
                <span className="text-white font-bold">جعل المنتج "عام" (يونيفرسال) 🌍</span>
             </label>
             <p className="text-xs text-gray-400 mt-2 mr-8">تفعيل هذا الخيار سيقوم بفك ارتباط المنتج بالسيارة الحالية ويجعله يظهر لكل السيارات.</p>
          </div>

          {/* قسم تعديل الصورة */}
          <div className="bg-gray-900/50 p-4 rounded border border-gray-600 space-y-3">
              <label className="text-gray-300 font-bold text-sm block">صورة المنتج</label>
              
              {formData.image_url && (
                  <div className="flex flex-col items-center mb-4 space-y-2 bg-gray-800 p-2 rounded border border-gray-700">
                      <img src={formData.image_url} alt="Current Product" className="h-28 rounded shadow-md object-cover" />
                      <button 
                          type="button" 
                          onClick={handleDeleteImageClick}
                          disabled={uploadingImage}
                          className="bg-red-600/80 hover:bg-red-500 text-white text-xs px-4 py-1.5 rounded-full shadow transition"
                      >
                          🗑️ حذف الصورة نهائياً
                      </button>
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
                          {uploadingImage ? 'جاري المعالجة...' : formData.image_url ? '🔄 رفع صورة بديلة' : '📂 رفع صورة للمنتج'}
                      </div>
                  </div>
              </div>

              <input 
                  type="text" name="image_url" 
                  value={formData.image_url} onChange={handleChange} 
                  placeholder="الرابط اليدوي للصورة..."
                  className="w-full p-2 text-xs rounded bg-gray-800 text-gray-400 border border-gray-600 outline-none text-left" dir="ltr" 
              />
              
              {message && (
                  <div className={`text-xs text-center mt-1 ${message.includes('❌') || message.includes('⚠️') ? 'text-red-400' : 'text-green-400'}`}>
                      {message}
                  </div>
              )}
          </div>

          {/* ✅ إظهار حقل المواصفات للشاشات والإكسسوارات */}
          {(product.table === 'screens' || product.table === 'accessories') && (
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