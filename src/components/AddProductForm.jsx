import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression';

export default function AddProductForm() {
  const [activeTab, setActiveTab] = useState('frame'); 

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [sizes, setSizes] = useState([]);
  
  // 🆕 حالة جديدة لجلب الفئات من قاعدة البيانات
  const [accessoryCategories, setAccessoryCategories] = useState([]);
  
  // 🆕 حالات للتحكم في واجهة إضافة فئة جديدة
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

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
    category: '' // سيتم تعيينها لاحقاً
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');

  // --- جلب البيانات الأساسية (بما فيها الفئات الجديدة) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: brandsData } = await supabase.from('brands').select('*');
      const { data: sizesData } = await supabase.from('standard_sizes').select('*');
      const { data: categoriesData } = await supabase.from('accessory_categories').select('*'); // 🆕 جلب الفئات
      
      if (brandsData) setBrands(brandsData);
      if (sizesData) setSizes(sizesData);
      if (categoriesData && categoriesData.length > 0) {
          setAccessoryCategories(categoriesData);
          setFormData(prev => ({ ...prev, category: categoriesData[0].name })); // تعيين أول فئة كافتراضية
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!formData.brand_id) { setModels([]); return; }
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', formData.brand_id);
      setModels(data || []);
    };
    fetchModels();
  }, [formData.brand_id]);

  useEffect(() => {
    if (!formData.model_id) { setGenerations([]); return; }
    const fetchGenerations = async () => {
      const { data } = await supabase.from('car_generations').select('*').eq('car_model_id', formData.model_id);
      setGenerations(data || []);
    };
    fetchGenerations();
  }, [formData.model_id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🆕 دالة حفظ الفئة الجديدة في قاعدة البيانات
  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    // إدخال الفئة في Supabase
    const { data, error } = await supabase
        .from('accessory_categories')
        .insert([{ name: newCategoryName }])
        .select();

    if (error) {
        alert("خطأ: ربما هذه الفئة موجودة مسبقاً!");
    } else if (data) {
        // تحديث القائمة واختيار الفئة الجديدة تلقائياً
        setAccessoryCategories([...accessoryCategories, data[0]]);
        setFormData({ ...formData, category: data[0].name });
        setIsAddingCategory(false);
        setNewCategoryName('');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage('⏳ جاري ضغط ورفع الصورة...');

    try {
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const compressedFile = await imageCompression(file, options);
      const fileName = `product_${Date.now()}.webp`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path);

      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      setMessage('✅ تم رفع الصورة بنجاح!');

    } catch (error) {
      console.error("Image upload error:", error);
      setMessage(`❌ خطأ في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let error;

      if (activeTab === 'frame') {
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

      } else if (activeTab === 'screen') {
        if (!formData.size_id && !formData.generation_id) {
            throw new Error("يجب تحديد المقاس (للعام) أو السيارة (للسبشل)");
        }
        const { error: err } = await supabase.from('screens').insert([{
          name: formData.name,
          price: parseInt(formData.price),
          currency: formData.currency,
          image_url: formData.image_url || 'https://via.placeholder.com/150',
          specs: formData.specs,
          size_id: formData.size_id ? parseInt(formData.size_id) : null,
          generation_id: formData.generation_id ? parseInt(formData.generation_id) : null
        }]);
        error = err;

      } else if (activeTab === 'accessory') {
        if (!formData.category) throw new Error("الرجاء اختيار أو إضافة فئة للإكسسوار");
        
        const { error: err } = await supabase.from('accessories').insert([{
          name: formData.name,
          category: formData.category,
          price: parseInt(formData.price),
          currency: formData.currency,
          image_url: formData.image_url || 'https://via.placeholder.com/150',
          specs: formData.specs,
          generation_id: formData.generation_id ? parseInt(formData.generation_id) : null
        }]);
        error = err;
      }

      if (error) throw error;

      setMessage('✅ تم إضافة المنتج بنجاح!');
      setFormData({ ...formData, name: '', price: '', specs: '', image_url: '', currency: 'USD' });

    } catch (err) {
      setMessage(`❌ خطأ: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-xl border border-gray-600 dir-rtl text-right">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400 text-center">📦 إضافة منتج جديد للمخزون</h2>

      <div className="flex flex-col md:flex-row mb-6 border-b border-gray-600 rounded overflow-hidden">
        <button 
          onClick={() => setActiveTab('frame')}
          className={`flex-1 py-3 text-sm md:text-base font-bold transition ${activeTab === 'frame' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          🖼️ إطار/ديكور
        </button>
        <button 
          onClick={() => setActiveTab('screen')}
          className={`flex-1 py-3 text-sm md:text-base font-bold transition border-r border-l border-gray-700 md:border-none ${activeTab === 'screen' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          📺 شاشة
        </button>
        <button 
          onClick={() => setActiveTab('accessory')}
          className={`flex-1 py-3 text-sm md:text-base font-bold transition ${activeTab === 'accessory' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
        >
          🎧 إكسسوارات
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" name="name" placeholder={activeTab === 'accessory' ? "اسم المنتج (مثال: داش كام شاومي)" : "اسم المنتج (مثال: إطار كامري)"} 
            value={formData.name} onChange={handleChange} required
            className="w-full p-2 rounded bg-gray-800 border border-gray-500 text-white focus:border-blue-500 outline-none"
          />
          
          {/* 🆕 واجهة اختيار أو إضافة الفئة الديناميكية */}
          {activeTab === 'accessory' && (
            <div className="flex flex-col gap-2">
              {!isAddingCategory ? (
                // حالة الاختيار من القائمة
                <div className="flex gap-2">
                  <select name="category" value={formData.category} onChange={handleChange} required
                    className="flex-grow p-2 rounded bg-gray-800 text-white border border-gray-500 focus:border-orange-500 outline-none">
                    {accessoryCategories.length === 0 && <option value="">جاري التحميل...</option>}
                    {accessoryCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCategory(true)}
                    className="bg-gray-800 hover:bg-gray-600 border border-gray-500 text-white px-4 rounded font-bold transition"
                  >
                    ➕ جديد
                  </button>
                </div>
              ) : (
                // حالة إضافة فئة جديدة
                <div className="flex gap-2 animate-fadeIn">
                  <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="اكتب اسم الفئة (مثال: معطرات 🌸)"
                    className="flex-grow p-2 rounded bg-gray-900 border border-orange-500 text-white outline-none"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={handleSaveNewCategory}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 rounded font-bold transition"
                  >
                    حفظ
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingCategory(false)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 rounded font-bold transition"
                  >
                    ✖
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <input 
                type="number" name="price" placeholder="السعر" 
                value={formData.price} onChange={handleChange} required
                className="flex-grow p-2 rounded bg-gray-800 border border-gray-500 text-white focus:border-blue-500 outline-none"
            />
            <select 
                name="currency" value={formData.currency} onChange={handleChange}
                className="w-1/3 p-2 rounded bg-gray-800 border border-gray-500 text-white text-center font-bold focus:border-blue-500 outline-none"
            >
                <option value="USD">دولار ($)</option>
                <option value="IQD">دينار (د.ع)</option>
            </select>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded border border-gray-600 space-y-3">
            <h3 className="text-gray-300 font-bold text-sm mb-2">📸 صورة المنتج (اختياري)</h3>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <input 
                        type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`px-4 py-2 rounded font-bold text-sm text-center transition ${uploadingImage ? 'bg-gray-500 text-gray-300' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                        {uploadingImage ? 'جاري الرفع...' : '📂 اختر صورة للرفع'}
                    </div>
                </div>
                <span className="text-xs text-gray-400">أو ضع الرابط يدوياً بالأسفل 👇</span>
            </div>

            <input 
              type="text" name="image_url" placeholder="رابط الصورة سيظهر هنا بعد الرفع..." 
              value={formData.image_url} onChange={handleChange}
              className="w-full p-2 text-sm rounded bg-gray-900 border border-gray-600 text-gray-300 focus:border-blue-500 outline-none"
            />

            {formData.image_url && (
                <div className="mt-2">
                    <img src={formData.image_url} alt="Preview" className="h-20 rounded border border-gray-500 shadow-md" />
                </div>
            )}
        </div>

        {(activeTab === 'screen' || activeTab === 'accessory') && (
           <textarea 
             name="specs" placeholder={activeTab === 'accessory' ? "المواصفات (مثال: دقة 4K، رؤية ليلية...)" : "المواصفات (مثال: 4GB RAM, 64GB ROM)"}
             value={formData.specs} onChange={handleChange}
             className="w-full p-2 rounded bg-gray-800 border border-gray-500 text-white focus:border-purple-500 outline-none"
           />
        )}

        <hr className="border-gray-600 my-4" />

        <div className="space-y-3 bg-gray-800 p-4 rounded border border-gray-600">
            <h3 className="text-blue-300 font-bold">🔗 إعدادات التوافق:</h3>
            
            {activeTab !== 'accessory' && (
              <select name="size_id" value={formData.size_id} onChange={handleChange} 
                  className="w-full p-2 rounded bg-gray-700 text-white border border-gray-500 focus:border-blue-500 outline-none">
                  <option value="">-- اختر المقاس المعياري (مثل 9 بوصة) --</option>
                  {sizes.map(s => <option key={s.id} value={s.id}>{s.size_name}</option>)}
              </select>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select name="brand_id" value={formData.brand_id} onChange={handleChange}
                    className="p-2 rounded bg-gray-700 text-white border border-gray-500 focus:border-blue-500 outline-none">
                    <option value="">1. اختر الشركة (اختياري)</option>
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
            
            {activeTab === 'frame' && <p className="text-xs text-gray-400">* الإطار: يجب تحديد السيارة والمقاس.</p>}
            {activeTab === 'screen' && <p className="text-xs text-gray-400">* الشاشة: المقاس فقط (للعام) أو السيارة (للسبشل).</p>}
            {activeTab === 'accessory' && <p className="text-xs text-orange-400">* الإكسسوارات: تحديد السيارة (اختياري) إذا كان المنتج يركب لسيارة محددة فقط.</p>}
        </div>

        <button 
          type="submit" disabled={loading || uploadingImage}
          className={`w-full py-3 rounded font-bold text-lg transition shadow-lg ${loading || uploadingImage ? 'bg-gray-500 cursor-not-allowed' : activeTab === 'frame' ? 'bg-blue-600 hover:bg-blue-500' : activeTab === 'screen' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-orange-600 hover:bg-orange-500'}`}
        >
          {loading ? 'جاري الحفظ...' : activeTab === 'frame' ? 'حفظ الإطار 🖼️' : activeTab === 'screen' ? 'حفظ الشاشة 📺' : 'حفظ الإكسسوار 🎧'}
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