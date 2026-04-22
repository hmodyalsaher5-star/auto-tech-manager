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
    // 🎨 خلفية زجاجية معتمة
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn dir-rtl text-right">
      
      {/* 🎨 صندوق النافذة الزجاجي المتناسق */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 w-full max-w-md border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-y-auto max-h-[90vh] relative">
        
        {/* توهج داخلي للنافذة */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-[60px] pointer-events-none"></div>

        <h2 className="text-xl md:text-2xl font-black text-amber-400 mb-6 border-b border-white/10 pb-4 text-center drop-shadow-md relative z-10">
          ✏️ تعديل بيانات المنتج
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          <div>
            <label className="text-orange-200/70 text-sm font-bold mb-1 block">اسم المنتج</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleChange} required 
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner" 
            />
          </div>

          <div>
            <label className="text-orange-200/70 text-sm font-bold mb-1 block">السعر والعملة</label>
            <div className="flex gap-2">
                <input 
                  type="number" name="price" value={formData.price} onChange={handleChange} required 
                  className="flex-grow p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner text-left dir-ltr" 
                />
                <select 
                  name="currency" value={formData.currency} onChange={handleChange} 
                  className="w-1/3 p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner font-bold text-center appearance-none cursor-pointer"
                >
                    <option value="USD" className="bg-gray-900">دولار ($)</option>
                    <option value="IQD" className="bg-gray-900">دينار (د.ع)</option>
                </select>
            </div>
          </div>

          {product.table !== 'accessories' && (
            <div>
              <label className="text-orange-200/70 text-sm font-bold mb-1 block">📏 مقاس المنتج</label>
              <select 
                name="size_id" value={formData.size_id} onChange={handleChange} 
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner appearance-none cursor-pointer"
              >
                  <option value="" className="bg-gray-900">-- اختر المقاس --</option>
                  {sizes.map(size => <option key={size.id} value={size.id} className="bg-gray-900">{size.size_name}</option>)}
              </select>
            </div>
          )}

          {/* 🎨 تنسيق خيار المنتج العام */}
          <div className="bg-black/30 p-4 rounded-xl border border-white/10 shadow-inner">
             <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" name="is_universal" checked={formData.is_universal} onChange={handleChange} 
                  className="w-5 h-5 rounded bg-black/50 border-white/20 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0 cursor-pointer" 
                />
                <span className="text-amber-300 font-bold group-hover:text-amber-200 transition-colors">جعل المنتج "عام" (يونيفرسال) 🌍</span>
             </label>
             <p className="text-xs text-orange-200/50 mt-2 mr-8 leading-relaxed">تفعيل هذا الخيار سيقوم بفك ارتباط المنتج بالسيارة الحالية ويجعله يظهر لكل السيارات.</p>
          </div>

          {/* 🎨 قسم تعديل الصورة */}
          <div className="bg-black/30 p-5 rounded-2xl border border-white/10 space-y-4 shadow-inner">
              <label className="text-amber-400 font-bold text-sm block">صورة المنتج</label>
              
              {formData.image_url && (
                  <div className="flex flex-col items-center space-y-3 bg-white/5 p-3 rounded-xl border border-white/10">
                      <img src={formData.image_url} alt="Current Product" className="h-32 rounded-lg shadow-lg object-cover" />
                      <button 
                          type="button" 
                          onClick={handleDeleteImageClick}
                          disabled={uploadingImage}
                          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs px-5 py-2 rounded-full shadow-lg transition-all active:scale-95 font-bold"
                      >
                          🗑️ حذف الصورة نهائياً
                      </button>
                  </div>
              )}

              <div className="relative w-full">
                  <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full px-4 py-3 rounded-xl font-bold text-sm text-center transition-all border border-dashed flex items-center justify-center gap-2 ${uploadingImage ? 'border-gray-500 bg-gray-800 text-gray-400' : 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'}`}>
                      {uploadingImage ? '⏳ جاري المعالجة...' : formData.image_url ? '🔄 رفع صورة بديلة' : '📂 اضغط هنا لرفع صورة'}
                  </div>
              </div>

              <input 
                  type="text" name="image_url" 
                  value={formData.image_url} onChange={handleChange} 
                  placeholder="أو ضع الرابط اليدوي للصورة هنا..."
                  className="w-full p-2.5 text-xs rounded-xl bg-black/50 text-orange-200/60 border border-white/10 outline-none focus:border-amber-500/30 text-left transition-colors" dir="ltr" 
              />
              
              {message && (
                  <div className={`text-xs text-center mt-2 font-bold p-2 rounded-lg bg-black/40 ${message.includes('❌') || message.includes('⚠️') ? 'text-rose-400 border border-rose-500/20' : 'text-emerald-400 border border-emerald-500/20'}`}>
                      {message}
                  </div>
              )}
          </div>

          {(product.table === 'screens' || product.table === 'accessories') && (
            <div>
              <label className="text-orange-200/70 text-sm font-bold mb-1 block">المواصفات</label>
              <textarea 
                name="specs" value={formData.specs} onChange={handleChange} 
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner" 
                rows="3" 
              />
            </div>
          )}

          {/* 🎨 أزرار التحكم */}
          <div className="flex gap-3 mt-8 pt-2">
            <button 
              type="submit" 
              disabled={loading || uploadingImage} 
              className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 py-3 rounded-2xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:scale-95 flex justify-center items-center"
            >
              {loading ? 'جاري الحفظ... ⏳' : 'حفظ التعديلات ✔️'}
            </button>

            <button 
              type="button" 
              onClick={onClose} 
              disabled={uploadingImage} 
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
            >
              إلغاء ✖️
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}