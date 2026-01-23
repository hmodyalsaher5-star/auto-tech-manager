import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

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
    image_url: '',
    specs: '', // للشاشات فقط
    brand_id: '',
    model_id: '',
    generation_id: '',
    size_id: '',
  });

  const [loading, setLoading] = useState(false);
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

  // --- إرسال البيانات (الحفظ في Supabase) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let error;

      if (activeTab === 'frame') {
        // 🖼️ إضافة إطار (يجب ربطه بجيل ومقاس)
        if (!formData.generation_id || !formData.size_id) {
          throw new Error("الرجاء تحديد السيارة والمقاس للإطار");
        }
        
        const { error: err } = await supabase.from('frames').insert([{
          name: formData.name,
          price: parseInt(formData.price),
          image_url: formData.image_url || 'https://via.placeholder.com/150',
          generation_id: parseInt(formData.generation_id),
          size_id: parseInt(formData.size_id)
        }]);
        error = err;

      } else {
        // 📺 إضافة شاشة (تربط بالمقاس بشكل أساسي)
        if (!formData.size_id && !formData.generation_id) {
            throw new Error("يجب تحديد المقاس (للعام) أو السيارة (للسبشل)");
        }

        const insertData = {
          name: formData.name,
          price: parseInt(formData.price),
          image_url: formData.image_url || 'https://via.placeholder.com/150',
          specs: formData.specs,
          // إذا اختار مقاس نرسله، وإذا اختار سيارة نرسلها
          size_id: formData.size_id ? parseInt(formData.size_id) : null,
          generation_id: formData.generation_id ? parseInt(formData.generation_id) : null
        };

        const { error: err } = await supabase.from('screens').insert([insertData]);
        error = err;
      }

      if (error) throw error;

      setMessage('✅ تم إضافة المنتج بنجاح!');
      // تصفير الحقول
      setFormData({ ...formData, name: '', price: '', specs: '' });

    } catch (err) {
      setMessage(`❌ خطأ: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg shadow-xl border border-gray-600">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400 text-center">📦 إضافة منتج جديد للمخزون</h2>

      {/* 1. نظام التبويبات (Tabs) */}
      <div className="flex mb-6 border-b border-gray-600">
        <button 
          onClick={() => setActiveTab('frame')}
          className={`flex-1 py-2 text-lg font-bold ${activeTab === 'frame' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
        >
          🖼️ إضافة إطار/ديكور
        </button>
        <button 
          onClick={() => setActiveTab('screen')}
          className={`flex-1 py-2 text-lg font-bold ${activeTab === 'screen' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'}`}
        >
          📺 إضافة شاشة
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* بيانات مشتركة (الاسم، السعر، الصورة) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" name="name" placeholder="اسم المنتج (مثال: إطار كامري / شاشة سوني)" 
            value={formData.name} onChange={handleChange} required
            className="p-2 rounded bg-gray-800 border border-gray-500 text-white"
          />
          <input 
            type="number" name="price" placeholder="السعر (ر.س)" 
            value={formData.price} onChange={handleChange} required
            className="p-2 rounded bg-gray-800 border border-gray-500 text-white"
          />
        </div>
        
        <input 
            type="text" name="image_url" placeholder="رابط الصورة (URL)" 
            value={formData.image_url} onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 border border-gray-500 text-white"
        />

        {/* حقل المواصفات (يظهر فقط للشاشات) */}
        {activeTab === 'screen' && (
           <textarea 
             name="specs" placeholder="المواصفات (مثال: 4GB RAM, 64GB ROM, Android 12)"
             value={formData.specs} onChange={handleChange}
             className="w-full p-2 rounded bg-gray-800 border border-gray-500 text-white"
           />
        )}

        <hr className="border-gray-600 my-4" />

        {/* 2. منطق الربط (الذكاء هنا) */}
        
        <div className="space-y-3 bg-gray-800 p-4 rounded">
            <h3 className="text-blue-300 font-bold">🔗 إعدادات التوافق:</h3>
            
            {/* اختيار المقاس (مهم للطرفين) */}
            <select name="size_id" value={formData.size_id} onChange={handleChange} 
                className="w-full p-2 rounded bg-gray-600 text-white border border-gray-500">
                <option value="">-- اختر المقاس المعياري (مثل 9 بوصة) --</option>
                {sizes.map(s => <option key={s.id} value={s.id}>{s.size_name}</option>)}
            </select>

            {/* اختيار السيارة (اجباري للإطار - واختياري للشاشة السبشل) */}
            {(activeTab === 'frame' || activeTab === 'screen') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select name="brand_id" value={formData.brand_id} onChange={handleChange}
                        className="p-2 rounded bg-gray-600 text-white">
                        <option value="">1. اختر الشركة</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>

                    <select name="model_id" value={formData.model_id} onChange={handleChange} disabled={!formData.brand_id}
                        className="p-2 rounded bg-gray-600 text-white disabled:opacity-50">
                        <option value="">2. اختر الموديل</option>
                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>

                    <select name="generation_id" value={formData.generation_id} onChange={handleChange} disabled={!formData.model_id}
                        className="p-2 rounded bg-gray-600 text-white disabled:opacity-50">
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
          type="submit" disabled={loading}
          className={`w-full py-3 rounded font-bold text-lg transition ${loading ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? 'جاري الحفظ...' : activeTab === 'frame' ? 'حفظ الإطار 🖼️' : 'حفظ الشاشة 📺'}
        </button>

        {message && (
          <div className={`p-3 rounded text-center font-bold ${message.includes('✅') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}