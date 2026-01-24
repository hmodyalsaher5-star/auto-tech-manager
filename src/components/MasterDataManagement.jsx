import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function MasterDataManagement() {
  // --- البيانات ---
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);

  // --- المدخلات ---
  const [newBrandName, setNewBrandName] = useState('');
  
  const [selectedBrandForModel, setSelectedBrandForModel] = useState('');
  const [newModelName, setNewModelName] = useState('');

  const [selectedBrandForGen, setSelectedBrandForGen] = useState('');
  const [selectedModelForGen, setSelectedModelForGen] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [genName, setGenName] = useState(''); 

  const [loading, setLoading] = useState(false);

  // 🔄 دوال تحديث مساعدة
  const refreshBrands = async () => {
    const { data } = await supabase.from('brands').select('*');
    if (data) setBrands(data);
  };

  const refreshModels = async (brandId) => {
    const { data } = await supabase.from('car_models').select('*').eq('brand_id', brandId);
    if (data) setModels(data);
  };

  // 1️⃣ تحميل الشركات عند فتح الصفحة
  useEffect(() => {
    const loadBrands = async () => {
      const { data } = await supabase.from('brands').select('*');
      if (data) setBrands(data);
    };
    loadBrands();
  }, []);

  // 2️⃣ تحميل الموديلات عند تغيير الشركة (الحل الجذري)
  useEffect(() => {
    // نلغي الـ else تماماً لتجنب المشاكل
    // المسح سيتم يدوياً في زر الاختيار بالأسفل
    if (selectedBrandForGen) {
        const loadModels = async () => {
            const { data } = await supabase.from('car_models').select('*').eq('brand_id', selectedBrandForGen);
            if (data) setModels(data);
        };
        loadModels();
    }
  }, [selectedBrandForGen]);

  // --- دوال الإضافة ---

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName) return;
    setLoading(true);
    
    const { error } = await supabase.from('brands').insert([{ name: newBrandName }]);
    
    if (error) {
        alert("❌ خطأ: " + error.message);
    } else {
        alert("✅ تمت إضافة الشركة بنجاح");
        setNewBrandName('');
        refreshBrands(); 
    }
    setLoading(false);
  };

  const handleAddModel = async (e) => {
    e.preventDefault();
    if (!selectedBrandForModel || !newModelName) return;
    setLoading(true);

    const { error } = await supabase.from('car_models').insert([{ 
        name: newModelName, 
        brand_id: selectedBrandForModel 
    }]);

    if (error) {
        alert("❌ خطأ: " + error.message);
    } else {
        alert("✅ تم إضافة الموديل بنجاح");
        setNewModelName('');
        if (selectedBrandForGen === selectedBrandForModel) {
            refreshModels(selectedBrandForModel);
        }
    }
    setLoading(false);
  };

  const handleAddGen = async (e) => {
    e.preventDefault();
    if (!selectedModelForGen || !startYear || !endYear) return;
    setLoading(true);

    const { error } = await supabase.from('car_generations').insert([{ 
        car_model_id: selectedModelForGen,
        start_year: parseInt(startYear),
        end_year: parseInt(endYear),
        name: genName 
    }]);

    if (error) {
        alert("❌ خطأ: " + error.message);
    } else {
        alert("✅ تم إضافة الجيل بنجاح");
        setStartYear('');
        setEndYear('');
        setGenName('');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
        
      {/* القسم 1: إضافة شركة */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-xl">
        <h3 className="text-lg font-bold text-green-400 mb-4 border-b border-gray-600 pb-2">1️⃣ إضافة شركة سيارات جديدة</h3>
        <form onSubmit={handleAddBrand} className="flex gap-4">
            <input 
                type="text" placeholder="اسم الشركة (مثال: Mazda)" 
                value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
                className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600" required
            />
            <button disabled={loading} className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-bold">حفظ</button>
        </form>
      </div>

      {/* القسم 2: إضافة موديل */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-xl">
        <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-gray-600 pb-2">2️⃣ إضافة موديل لشركة</h3>
        <form onSubmit={handleAddModel} className="flex flex-col md:flex-row gap-4">
            <select 
                value={selectedBrandForModel} onChange={e => setSelectedBrandForModel(e.target.value)}
                className="p-2 rounded bg-gray-700 text-white border border-gray-600" required
            >
                <option value="">-- اختر الشركة --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input 
                type="text" placeholder="اسم الموديل (مثال: CX-9)" 
                value={newModelName} onChange={e => setNewModelName(e.target.value)}
                className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600" required
            />
            <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-bold">حفظ</button>
        </form>
      </div>

      {/* القسم 3: إضافة سنوات */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-xl">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 border-b border-gray-600 pb-2">3️⃣ إضافة سنوات الصنع (جيل)</h3>
        <form onSubmit={handleAddGen} className="space-y-4">
            <div className="flex gap-4">
                {/* 👇👇👇 هنا قمنا بالتغيير الجذري لحل المشكلة 👇👇👇 */}
                <select 
                    value={selectedBrandForGen} 
                    onChange={e => {
                        setSelectedBrandForGen(e.target.value);
                        setModels([]); // ✅ نمسح الموديلات هنا يدوياً بدلاً من استخدام useEffect
                    }}
                    className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600" required
                >
                    <option value="">-- اختر الشركة --</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                
                <select 
                    value={selectedModelForGen} onChange={e => setSelectedModelForGen(e.target.value)}
                    className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600" required
                    disabled={!selectedBrandForGen}
                >
                    <option value="">-- اختر الموديل --</option>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
            
            <div className="flex gap-4">
                <input 
                    type="number" placeholder="من سنة (2010)" 
                    value={startYear} onChange={e => setStartYear(e.target.value)}
                    className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600" required
                />
                <input 
                    type="number" placeholder="إلى سنة (2015)" 
                    value={endYear} onChange={e => setEndYear(e.target.value)}
                    className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600" required
                />
                <input 
                    type="text" placeholder="اسم الجيل (اختياري)" 
                    value={genName} onChange={e => setGenName(e.target.value)}
                    className="flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600" 
                />
            </div>
            <button disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-700 py-3 rounded font-bold">حفظ السنوات</button>
        </form>
      </div>

    </div>
  );
}