import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression';

// 🎨 استدعاء الأيقونات العصرية
import { 
  PackagePlus, LayoutTemplate, Monitor, Headphones, Plus, Save, X, 
  Image as ImageIcon, Link, Ruler, CarFront, Settings2, Calendar, 
  FileText, CheckCircle2, AlertCircle, Loader2, ChevronDown, 
  DollarSign, FolderOpen, Tag 
} from 'lucide-react';

export default function AddProductForm() {
  const [activeTab, setActiveTab] = useState('frame'); 

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [sizes, setSizes] = useState([]);
  
  const [accessoryCategories, setAccessoryCategories] = useState([]);
  
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
    category: '' 
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error' | 'loading'

  // --- جلب البيانات الأساسية ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: brandsData } = await supabase.from('brands').select('*');
      const { data: sizesData } = await supabase.from('standard_sizes').select('*');
      const { data: categoriesData } = await supabase.from('accessory_categories').select('*'); 
      
      if (brandsData) setBrands(brandsData);
      if (sizesData) setSizes(sizesData);
      if (categoriesData && categoriesData.length > 0) {
          setAccessoryCategories(categoriesData);
          setFormData(prev => ({ ...prev, category: categoriesData[0].name })); 
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

  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const { data, error } = await supabase
        .from('accessory_categories')
        .insert([{ name: newCategoryName }])
        .select();

    if (error) {
        setMessage({ text: "خطأ: ربما هذه الفئة موجودة مسبقاً!", type: 'error' });
    } else if (data) {
        setAccessoryCategories([...accessoryCategories, data[0]]);
        setFormData({ ...formData, category: data[0].name });
        setIsAddingCategory(false);
        setNewCategoryName('');
        setMessage({ text: "تمت إضافة الفئة الجديدة بنجاح", type: 'success' });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage({ text: 'جاري ضغط ورفع الصورة...', type: 'loading' });

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
      setMessage({ text: 'تم رفع الصورة بنجاح!', type: 'success' });

    } catch (error) {
      console.error("Image upload error:", error);
      setMessage({ text: `خطأ في رفع الصورة: ${error.message}`, type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: 'جاري الحفظ في قاعدة البيانات...', type: 'loading' });

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

      setMessage({ text: '✅ تم إضافة المنتج بنجاح للمستودع!', type: 'success' });
      setFormData({ ...formData, name: '', price: '', specs: '', image_url: '', currency: 'USD' });

    } catch (err) {
      setMessage({ text: `❌ خطأ: ${err.message}`, type: 'error' });
    }
    setLoading(false);
  };

  // تفاصيل التبويبات للتنسيق
  const tabs = [
    { id: 'frame', label: 'إطار / ديكور', icon: <LayoutTemplate className="w-5 h-5"/>, color: 'text-teal-400', activeBg: 'bg-teal-500/20 border-teal-500/50' },
    { id: 'screen', label: 'شاشة إلكترونية', icon: <Monitor className="w-5 h-5"/>, color: 'text-indigo-400', activeBg: 'bg-indigo-500/20 border-indigo-500/50' },
    { id: 'accessory', label: 'إكسسوارات', icon: <Headphones className="w-5 h-5"/>, color: 'text-amber-400', activeBg: 'bg-amber-500/20 border-amber-500/50' }
  ];
  const currentTabStyle = tabs.find(t => t.id === activeTab);

  return (
    <div className="p-2 md:p-6 animate-fadeIn relative text-right dir-rtl z-10 max-w-4xl mx-auto">
      
      {/* 🎨 العنوان */}
      <h2 className="text-2xl md:text-3xl font-extrabold mb-8 flex items-center justify-center gap-3">
          <PackagePlus className="w-8 h-8 text-amber-400 drop-shadow-md hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-600 drop-shadow-sm">
             إضافة منتج جديد للمخزون
          </span>
      </h2>

      <div className="relative z-20 bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] border border-amber-500/20 mb-10 shadow-2xl">
        
        {/* توهج داخلي للجمالية يتبع لون التبويب */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 blur-3xl rounded-full pointer-events-none transition-colors duration-500 ${activeTab === 'frame' ? 'bg-teal-500/10' : activeTab === 'screen' ? 'bg-indigo-500/10' : 'bg-amber-500/10'}`}></div>

        {/* 🎨 شريط التبويبات الزجاجي */}
        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5 shadow-inner relative z-10">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMessage({text:'', type:''}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm md:text-base font-bold transition-all duration-300 border ${
                activeTab === tab.id 
                ? `${tab.activeBg} ${tab.color} shadow-lg` 
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="grid grid-cols-1 gap-5">
            {/* 1. اسم المنتج */}
            <div className="relative group">
                <input 
                  type="text" name="name" required
                  placeholder={activeTab === 'accessory' ? "اسم المنتج (مثال: داش كام شاومي)" : "اسم المنتج (مثال: إطار كامري)"} 
                  value={formData.name} onChange={handleChange} 
                  className={`w-full p-4 pl-4 pr-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:ring-1 outline-none transition-all shadow-inner text-sm ${activeTab === 'frame' ? 'focus:border-teal-500/50 focus:ring-teal-500/50' : activeTab === 'screen' ? 'focus:border-indigo-500/50 focus:ring-indigo-500/50' : 'focus:border-amber-500/50 focus:ring-amber-500/50'}`}
                />
                <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-gray-300 transition-colors" />
            </div>
            
            {/* 2. فئة الإكسسوار (ديناميكية) */}
            {activeTab === 'accessory' && (
              <div className="flex flex-col gap-3 animate-fadeIn">
                {!isAddingCategory ? (
                  <div className="flex gap-3">
                    <div className="relative flex-grow group">
                        <select name="category" value={formData.category} onChange={handleChange} required
                          className="w-full p-4 pl-4 pr-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer">
                          {accessoryCategories.length === 0 && <option className="bg-gray-900" value="">جاري التحميل...</option>}
                          {accessoryCategories.map(cat => <option className="bg-gray-900" key={cat.id} value={cat.name}>{cat.name}</option>)}
                        </select>
                        <FolderOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 pointer-events-none transition-colors" />
                        <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    <button 
                      type="button" onClick={() => setIsAddingCategory(true)}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 px-5 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-5 h-5" /> جديد
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3 animate-fadeIn">
                    <div className="relative flex-grow">
                        <input 
                          type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} autoFocus
                          placeholder="اكتب اسم الفئة الجديدة (مثال: معطرات)"
                          className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/50 text-amber-50 outline-none shadow-inner text-sm placeholder-amber-200/50"
                        />
                    </div>
                    <button 
                      type="button" onClick={handleSaveNewCategory}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 px-5 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                    >
                      حفظ
                    </button>
                    <button 
                      type="button" onClick={() => setIsAddingCategory(false)}
                      className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400 px-4 rounded-2xl font-bold transition-all active:scale-95 shadow-sm"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* 3. السعر والعملة */}
            <div className="flex gap-3">
              <div className="relative flex-grow group">
                  <input 
                      type="number" name="price" placeholder="السعر" 
                      value={formData.price} onChange={handleChange} required
                      className={`w-full p-4 pl-4 pr-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:ring-1 outline-none transition-all shadow-inner text-sm ${activeTab === 'frame' ? 'focus:border-teal-500/50 focus:ring-teal-500/50' : activeTab === 'screen' ? 'focus:border-indigo-500/50 focus:ring-indigo-500/50' : 'focus:border-amber-500/50 focus:ring-amber-500/50'}`}
                  />
                  <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-gray-300 transition-colors" />
              </div>
              <div className="relative w-1/3 group">
                  <select 
                      name="currency" value={formData.currency} onChange={handleChange}
                      className={`w-full p-4 pl-4 pr-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 text-center font-bold focus:ring-1 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer ${activeTab === 'frame' ? 'focus:border-teal-500/50 focus:ring-teal-500/50' : activeTab === 'screen' ? 'focus:border-indigo-500/50 focus:ring-indigo-500/50' : 'focus:border-amber-500/50 focus:ring-amber-500/50'}`}
                  >
                      <option className="bg-gray-900" value="USD">دولار ($)</option>
                      <option className="bg-gray-900" value="IQD">دينار (د.ع)</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
          
          {/* 4. رفع الصورة (واجهة زجاجية أنيقة) */}
          <div className="bg-black/20 p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
              <h3 className="text-orange-200/70 font-bold text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> صورة المنتج (اختياري)
              </h3>
              
              <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative w-full md:w-auto">
                      <input 
                          type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`px-6 py-3 rounded-xl font-bold text-sm text-center transition-all flex items-center justify-center gap-2 border ${uploadingImage ? 'bg-white/5 border-white/10 text-gray-400 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 border-white/20 text-orange-50 shadow-md'}`}>
                          {uploadingImage ? <><Loader2 className="w-4 h-4 animate-spin"/> جاري الرفع...</> : <><ImageIcon className="w-4 h-4"/> اختر صورة من الجهاز</>}
                      </div>
                  </div>
                  <span className="text-xs text-gray-500 font-bold">أو ضع الرابط يدوياً بالأسفل 👇</span>
              </div>

              <div className="relative group">
                  <input 
                    type="text" name="image_url" placeholder="رابط الصورة سيظهر هنا بعد الرفع..." 
                    value={formData.image_url} onChange={handleChange}
                    className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/5 text-gray-300 focus:border-white/20 outline-none transition-all text-sm shadow-inner"
                  />
                  <Link className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>

              {formData.image_url && (
                  <div className="mt-3 animate-fadeIn flex justify-center md:justify-start">
                      <div className="p-1.5 bg-white/5 border border-white/10 rounded-xl shadow-lg">
                         <img src={formData.image_url} alt="Preview" className="h-24 object-contain rounded-lg" />
                      </div>
                  </div>
              )}
          </div>

          {/* 5. المواصفات */}
          {(activeTab === 'screen' || activeTab === 'accessory') && (
             <div className="relative group animate-fadeIn">
                 <textarea 
                   name="specs" rows="3"
                   placeholder={activeTab === 'accessory' ? "المواصفات (مثال: دقة 4K، رؤية ليلية...)" : "المواصفات (مثال: 4GB RAM, 64GB ROM)"}
                   value={formData.specs} onChange={handleChange}
                   className={`w-full p-4 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:ring-1 outline-none transition-all shadow-inner text-sm resize-none ${activeTab === 'screen' ? 'focus:border-indigo-500/50 focus:ring-indigo-500/50' : 'focus:border-amber-500/50 focus:ring-amber-500/50'}`}
                 />
                 <FileText className="absolute right-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-gray-300 transition-colors" />
             </div>
          )}

          <hr className="border-white/10 my-6" />

          {/* 6. التوافقية */}
          <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5 shadow-inner">
              <h3 className="text-teal-400/80 font-bold text-sm flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4" /> إعدادات التوافق والمقاسات:
              </h3>
              
              {activeTab !== 'accessory' && (
                <div className="relative group mb-3">
                    <select name="size_id" value={formData.size_id} onChange={handleChange} 
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all text-sm appearance-none cursor-pointer">
                        <option className="bg-gray-900" value="">-- اختر المقاس المعياري (مثل 9 بوصة) --</option>
                        {sizes.map(s => <option className="bg-gray-900" key={s.id} value={s.id}>{s.size_name}</option>)}
                    </select>
                    <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-teal-400 pointer-events-none transition-colors" />
                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative group">
                      <select name="brand_id" value={formData.brand_id} onChange={handleChange}
                          className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all text-sm appearance-none cursor-pointer">
                          <option className="bg-gray-900" value="">1. اختر الشركة (اختياري)</option>
                          {brands.map(b => <option className="bg-gray-900" key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                      <CarFront className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-teal-400 pointer-events-none transition-colors" />
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>

                  <div className="relative group">
                      <select name="model_id" value={formData.model_id} onChange={handleChange} disabled={!formData.brand_id}
                          className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                          <option className="bg-gray-900" value="">2. اختر الموديل</option>
                          {models.map(m => <option className="bg-gray-900" key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none transition-colors" />
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>

                  <div className="relative group">
                      <select name="generation_id" value={formData.generation_id} onChange={handleChange} disabled={!formData.model_id}
                          className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                          <option className="bg-gray-900" value="">3. اختر الجيل/السنة</option>
                          {generations.map(g => (
                              <option className="bg-gray-900" key={g.id} value={g.id}>
                                  {g.start_year} - {g.end_year} {g.name ? `(${g.name})` : ''}
                              </option>
                          ))}
                      </select>
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none transition-colors" />
                      <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
              </div>
              
              {/* تلميحات */}
              <div className="mt-3">
                 {activeTab === 'frame' && <p className="text-xs text-teal-400/70 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> الإطار: يجب تحديد السيارة والمقاس لتسهيل البحث.</p>}
                 {activeTab === 'screen' && <p className="text-xs text-indigo-400/70 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> الشاشة: حدد المقاس فقط (للعام) أو السيارة والمقاس (للسبشل).</p>}
                 {activeTab === 'accessory' && <p className="text-xs text-amber-400/70 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> الإكسسوارات: تحديد السيارة (اختياري) إذا كان المنتج يركب لسيارة محددة فقط.</p>}
              </div>
          </div>

          {/* 7. زر الحفظ */}
          <button 
            type="submit" disabled={loading || uploadingImage}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl flex justify-center items-center gap-2 active:scale-[0.98] ${
              loading || uploadingImage 
              ? 'bg-white/10 text-gray-400 cursor-not-allowed border border-white/5' 
              : `${currentTabStyle.activeBg.replace('/20', '/30').replace('border-', 'bg-').split(' ')[0]} border border-${currentTabStyle.color.split('-')[1]}-500/50 ${currentTabStyle.color.replace('text-', 'text-')} hover:brightness-125`
            }`}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {loading ? 'جاري الحفظ في المستودع...' : `حفظ بيانات الـ ${currentTabStyle.label}`}
          </button>

          {/* 8. رسائل النظام */}
          {message.text && (
            <div className={`p-4 rounded-2xl font-bold text-sm flex items-center gap-3 animate-fadeIn border shadow-lg ${
                message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                'bg-sky-500/10 text-sky-400 border-sky-500/20'
            }`}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5"/> : message.type === 'success' ? <CheckCircle2 className="w-5 h-5"/> : <Loader2 className="w-5 h-5 animate-spin"/>}
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}