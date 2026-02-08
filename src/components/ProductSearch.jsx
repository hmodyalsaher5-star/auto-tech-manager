import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; // ✅ انتبه للنقطتين للرجوع للخلف
import ProductCard from './ProductCard';
import EditProductModal from './EditProductModal';

export default function ProductSearch({ userRole, sizes }) {
  // --- States ---
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // الاختيارات
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);

  // 1. جلب الماركات
  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase.from('brands').select('*');
      if (!error) setBrands(data);
    };
    fetchBrands();
  }, []);

  // 2. جلب الموديلات (يعمل فقط عند وجود BrandId)
  useEffect(() => {
    if (!selectedBrandId) return; // 👈 لا نقم بالتصفير هنا لتجنب الخطأ
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', selectedBrandId);
      setModels(data || []);
    };
    fetchModels();
  }, [selectedBrandId]);

  // 3. جلب السنوات
  useEffect(() => {
    if (!selectedModelId) return; // 👈 لا نقم بالتصفير هنا
    const fetchYears = async () => {
      const { data } = await supabase.from('car_generations').select('start_year, end_year').eq('car_model_id', selectedModelId);
      if (data) {
        let yearsSet = new Set();
        data.forEach(gen => { for (let y = gen.start_year; y <= gen.end_year; y++) yearsSet.add(y); });
        setAvailableYears([...yearsSet].sort((a, b) => b - a));
      }
    };
    fetchYears();
  }, [selectedModelId]);

  // 4. البحث عن المنتجات
  useEffect(() => {
    if (!selectedYear || !selectedModelId) return;

    const fetchProductsByCar = async () => {
      setLoading(true);
      try {
        const { data: genData } = await supabase.from('car_generations').select('id').eq('car_model_id', selectedModelId).lte('start_year', selectedYear).gte('end_year', selectedYear).single();
        
        if (genData) {
          const generationId = genData.id;
          const { data: frames } = await supabase.from('frames').select('*').eq('generation_id', generationId);
          const { data: screens } = await supabase.from('screens').select('*').eq('generation_id', generationId);

          const allItems = [
            ...(frames || []).map(f => ({ ...f, type: 'إطار/ديكور 🖼️', table: 'frames' })),
            ...(screens || []).map(s => ({ ...s, type: 'شاشة إلكترونية 📺', table: 'screens' }))
          ];
          setDisplayedProducts(allItems);
        } else {
          setDisplayedProducts([]);
        }
      } catch (error) { console.error(error); }
      setLoading(false);
    };

    fetchProductsByCar();
  }, [selectedYear, selectedModelId]);

  // --- Handlers (هنا نقوم بتصفير البيانات بشكل آمن) ---
  const handleBrandChange = (e) => { 
      const val = e.target.value;
      setSelectedBrandId(val); 
      // ✅ التصفير هنا آمن ولا يسبب مشاكل
      setModels([]); 
      setSelectedModelId(""); 
      setAvailableYears([]); 
      setSelectedYear(""); 
      setDisplayedProducts([]); 
  };
  
  const handleModelChange = (e) => { 
      const val = e.target.value;
      setSelectedModelId(val); 
      // ✅ التصفير هنا آمن
      setAvailableYears([]); 
      setSelectedYear(""); 
      setDisplayedProducts([]); 
  };

  const handleDeleteProduct = async (productId, tableName) => {
    if (userRole !== 'admin') { return alert("⛔ غير مسموح"); }
    if (!window.confirm("حذف نهائي؟")) return;
    const { error } = await supabase.from(tableName).delete().eq('id', productId);
    if (error) { alert(error.message); } 
    else { setDisplayedProducts(prev => prev.filter(item => item.id !== productId || item.table !== tableName)); alert("تم الحذف 🗑️"); }
  };

  const handleProductUpdate = (updatedProduct) => {
    setDisplayedProducts(prevProducts => prevProducts.map(p => (p.id === updatedProduct.id && p.table === updatedProduct.table) ? updatedProduct : p));
  };

  // --- JSX ---
  return (
    <main className="p-4 md:p-8 flex-grow container mx-auto animate-fadeIn">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-auto mb-8">
            <h2 className="text-xl font-bold mb-4 text-blue-400 text-center">🚗 البحث عن المنتجات</h2>
            <div className="space-y-4">
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600" value={selectedBrandId} onChange={handleBrandChange}>
                <option value="">-- اختر الشركة --</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50" value={selectedModelId} onChange={handleModelChange} disabled={!selectedBrandId}>
                <option value="">-- اختر الموديل --</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 disabled:opacity-50" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!selectedModelId}>
                <option value="">-- اختر السنة --</option>
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (<p className="text-center text-white col-span-3">جاري البحث... ⏳</p>) : displayedProducts.length > 0 ? (displayedProducts.map((product) => (
            <ProductCard 
                key={`${product.table}-${product.id}`} 
                product={product} 
                userRole={userRole} 
                sizes={sizes}
                onDelete={handleDeleteProduct} 
                onEdit={setEditingProduct} 
            />
            ))) : (
            <div className="col-span-3 text-center text-gray-500 mt-10">
                {selectedYear ? "لا توجد منتجات مطابقة لهذا الموديل" : "الرجاء اختيار سيارة لعرض المنتجات"}
            </div>
            )}
        </div>

        {editingProduct && (<EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={handleProductUpdate}/>)}
    </main>
  );
}