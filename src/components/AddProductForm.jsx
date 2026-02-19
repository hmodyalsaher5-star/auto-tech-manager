import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression'; // 🆕 استدعاء مكتبة ضغط الصور

export default function AddProductForm() {
  // --- 1. حالة التبويب (نوع المنتج المراد إضافته) ---
  const [activeTab, setActiveTab] = useState('frame'); // 'frame' or 'screen'

  // --- 2. مخازن القوائم (للاختيار منها) ---
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [sizes, setSizes] = useState([]);

  // --- 3. بيانات الاستمارة ---
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    currency: 'USD',
    image_url: '',
    specs: '', 
    brand_id: '',
    model_id: '',
    generation_id: '',
    size_id: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // 🆕 حالة رفع الصورة
  const [message, setMessage] = useState('');

  // --- جلب البيانات الأولية (الشركات + المقاسات) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: brandsData } = await supabase.from('brands').select('*');
      const { data: sizesData } = await supabase.from('standard_sizes').select('*');
      
      if (brandsData) setBrands(brandsData);
      if (sizesData) setSizes(sizesData);
    };
    fetchInitialData();
  }, []);

  // --- جلب الموديلات عند اختيار الشركة ---
  useEffect(() => {
    if (!formData.brand_id) { setModels([]); return; }
    
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', formData.brand_id);
      setModels(data || []);
    };
    fetchModels();
  }, [formData.brand_id]);

  // --- جلب الأجيال عند اختيار الموديل ---
  useEffect(() => {
    if (!formData.model_id) { setGenerations([]); return; }

    const fetchGenerations = async () => {
      const { data } = await supabase.from('car_generations').select('*').eq('car_model_id', formData.model_id);
      setGenerations(data || []);
    };
    fetchGenerations();
  }, [formData.model_id]);

  // --- التعامل مع تغيير المدخلات ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🆕 --- دالة ضغط ورفع الصورة ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage('⏳ جاري ضغط ورفع الصورة...');

    try {
      // 1. إعدادات الضغط (التحويل لـ webp وتصغير الحجم)
      const options = {
        maxSizeMB: 0.2, // الحد الأقصى للحجم (200 كيلوبايت)
        maxWidthOrHeight: 1200, // أقصى عرض 1200 بكسل
        useWebWorker: true,
        fileType: 'image/webp' // إجبار التحويل إلى صيغة webp السريعة
      };

      // 2. تنفيذ الضغط في متصفح المستخدم
      const compressedFile = await imageCompression(file, options);
      
      // 3. توليد اسم فريد للصورة لمنع التكرار
      const fileName = `product_${Date.now()}.webp`;

      // 4. رفع الصورة إلى Supabase في باكت products
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, {
           cacheControl: '3600',
           upsert: false
        });

      if (error) throw error;

      // 5. الحصول على الرابط العام (Public URL) للصورة
      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      // 6. وضع الرابط تلقائياً في الاستمارة
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      setMessage('✅ تم رفع الصورة بنجاح!');

    } catch (error) {
      console.error("Image upload error:", error);
      setMessage(`❌ خطأ في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- إرسال البيانات (الحفظ في Supabase) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let error;

      if (activeTab === 'frame') {
        // 🖼️ إضافة إطار
        if (!formData.generation_id || !formData.size_id) {
          throw new Error("الرجاء تحديد السيارة والمقاس للإطار");
        }
        
        const { error: err } = await supabase.from('frames').insert([{
          name: formData.name,
          price: parseInt(formData.price),
          currency: formData.currency,
          image_url: formData.image_url || 'https://via.placeholder.com/150',
          generation_id: parseInt(formData.generation_id),
          size_id: parseInt(formData.size_id)
        }]);
        error = err;

      } else {
        // 📺 إضافة شاشة
        if (!formData.size_id && !formData.generation_id) {
            throw new Error("يجب تحديد المقاس (للعام) أو السيارة (للسبشل)");
        }

        const insertData = {
          name: formData.name,
          price: parseInt(formData.price),
          currency: formData.currency,
          image_url: formData.image_url || 'https://via.placeholder.com/150',
          specs: formData.specs,
          size_id: formData.size_id ? parseInt(formData.size_id) : null,
          generation_id: formData.generation_id ? parseInt(formData.generation_id) : null
        };

        const { error: err } = await supabase.from('screens').insert([insertData]);
        error = err;
      }

      if (error) throw error;

      setMessage('✅ تم إضافة المنتج بنجاح!');
      // تصفير الحقول (مع إعادة العملة للدولار)
      setFormData({ ...formData, name: '', price: '', specs: '', image_url: '', currency: 'USD' });

    } catch (err) {
      setMessage(`❌ خطأ: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-xl border border-gray-600 dir-rtl text-right">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400 text-center">📦 إضافة منتج جديد للمخزون</h2>

      {/* 1. نظام التبويبات (Tabs) */}
      <div className="flex mb-6 border-b border-gray-600">
        <button 
          onClick={() => setActiveTab('frame')}
          className={`flex-1 py-2 text-lg font-bold transition ${activeTab === 'frame' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          🖼️ إضافة إطار/ديكور
        </button>
        <button 
          onClick={() => setActiveTab('screen')}
          className={`flex-1 py-2 text-lg font-bold transition ${activeTab === 'screen' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          📺 إضافة شاشة
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* بيانات مشتركة */}
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" name="name" placeholder="اسم المنتج (مثال: إطار كامري / شاشة سوني)" 
            value={formData.name} onChange={handleChange} required
            className="w-full p-2 rounded bg-gray-800 border border-gray-500 text-white focus:border-blue-500 outline-none"
          />
          
          <div className="flex gap-2">
            <input 
                type="number" name="price" placeholder="السعر" 
                value={formData.price} onChange={handleChange} required
                className="flex-grow p-2 rounded bg-gray-800 border border-gray-500 text-white focus:border-blue-500 outline-none"
            />
            <select 
                name="currency" 
                value={formData.currency} 
                onChange={handleChange}
                className="w-1/3 p-2 rounded bg-gray-800 border border-gray-500 text-white text-center font-bold focus:border-blue-500 outline-none"
            >
                <option value="USD">دولار ($)</option>
                <option value="IQD">دينار (د.ع)</option>
            </select>
          </div>
        </div>
        
        {/* 🆕 قسم رفع الصورة */}
        <div className="bg-gray-800 p-4 rounded border border-gray-600 space-y-3">
            <h3 className="text-gray-300 font-bold text-sm mb-2">📸 صورة المنتج (اختياري)</h3>
            
            <div className="flex items-center gap-4">
                {/* زر رفع الصورة */}
                <div className="relative">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`px-4 py-2 rounded font-bold text-sm text-center transition ${uploadingImage ? 'bg-gray-500 text-gray-300' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                        {uploadingImage ? 'جاري الرفع...' : '📂 اختر صورة للرفع'}
                    </div>
                </div>
                
                <span className="text-xs text-gray-400">
                    أو ضع الرابط يدوياً بالأسفل 👇
                </span>
            </div>

            {/* الحقل النصي للرابط (يُملأ تلقائياً عند الرفع) */}
            <input 
              type="text" name="image_url" placeholder="رابط الصورة سيظهر هنا بعد الرفع..." 
              value={formData.image_url} onChange={handleChange}
              className="w-full p-2 text-sm rounded bg-gray-900 border border-gray-600 text-gray-300 focus:border-blue-500 outline-none"
            />

            {/* معاينة مصغرة للصورة */}
            {formData.image_url && (
                <div className="mt-2">
                    <img src={formData.image_url} alt="Preview" className="h-20 rounded border border-gray-500 shadow-md" />
                </div>
            )}
        </div>

        {/* حقل المواصفات (يظهر فقط للشاشات) */}
        {activeTab === 'screen' && (
           <textarea 
             name="specs" placeholder="المواصفات (مثال: 4GB RAM, 64GB ROM, Android 12)"
             value={formData.specs} onChange={handleChange}
             className="w-full p-2 rounded bg-gray-800 border border-gray-500 text-white focus:border-purple-500 outline-none"
           />
        )}

        <hr className="border-gray-600 my-4" />

        {/* 2. منطق الربط */}
        <div className="space-y-3 bg-gray-800 p-4 rounded border border-gray-600">
            <h3 className="text-blue-300 font-bold">🔗 إعدادات التوافق:</h3>
            
            <select name="size_id" value={formData.size_id} onChange={handleChange} 
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-500 focus:border-blue-500 outline-none">
                <option value="">-- اختر المقاس المعياري (مثل 9 بوصة) --</option>
                {sizes.map(s => <option key={s.id} value={s.id}>{s.size_name}</option>)}
            </select>

            {(activeTab === 'frame' || activeTab === 'screen') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select name="brand_id" value={formData.brand_id} onChange={handleChange}
                        className="p-2 rounded bg-gray-700 text-white border border-gray-500 focus:border-blue-500 outline-none">
                        <option value="">1. اختر الشركة</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <select name="model_id" value={formData.model_id} onChange={handleChange} disabled={!formData.brand_id}
                        className="p-2 rounded bg-gray-700 text-white disabled:opacity-50 border border-gray-500 focus:border-blue-500 outline-none">
                        <option value="">2. اختر الموديل</option>
                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>

                    <select name="generation_id" value={formData.generation_id} onChange={handleChange} disabled={!formData.model_id}
                        className="p-2 rounded bg-gray-700 text-white disabled:opacity-50 border border-gray-500 focus:border-blue-500 outline-none">
                        <option value="">3. اختر الجيل/السنة</option>
                        {generations.map(g => (
                            <option key={g.id} value={g.id}>
                                {g.start_year} - {g.end_year} {g.name ? `(${g.name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}
            
            {activeTab === 'frame' && <p className="text-xs text-gray-400">* عند إضافة إطار، يجب تحديد السيارة والمقاس الذي يوفره هذا الإطار.</p>}
            {activeTab === 'screen' && <p className="text-xs text-gray-400">* للشاشات العامة: اختر المقاس فقط. للشاشات السبشل: اختر السيارة فقط (أو الاثنين).</p>}
        </div>

        {/* زر الحفظ ورسائل الخطأ */}
        <button 
          type="submit" disabled={loading || uploadingImage}
          className={`w-full py-3 rounded font-bold text-lg transition shadow-lg ${loading || uploadingImage ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'}`}
        >
          {loading ? 'جاري الحفظ...' : activeTab === 'frame' ? 'حفظ الإطار 🖼️' : 'حفظ الشاشة 📺'}
        </button>

        {message && (
          <div className={`p-3 rounded text-center font-bold text-sm ${message.includes('❌') ? 'bg-red-900/50 text-red-300 border border-red-800' : 'bg-green-900/50 text-green-300 border border-green-800'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}