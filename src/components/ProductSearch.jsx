import { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import ProductCard from './ProductCard';
import EditProductModal from './EditProductModal';

import { Search, CarFront, Settings2, Calendar, Loader2, PackageX, Sparkles, ChevronDown } from 'lucide-react';

export default function ProductSearch({ userRole, sizes }) {
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [editingProduct, setEditingProduct] = useState(null);
  
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase.from('brands').select('*');
      if (!error) setBrands(data);
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!selectedBrandId) return; 
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', selectedBrandId);
      setModels(data || []);
    };
    fetchModels();
  }, [selectedBrandId]);

  useEffect(() => {
    if (!selectedModelId) return; 
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
            ...(frames || []).map(f => ({ ...f, type: 'إطار/ديكور', table: 'frames' })),
            ...(screens || []).map(s => ({ ...s, type: 'شاشة إلكترونية', table: 'screens' }))
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

  // --- Handlers ---
  const handleBrandSelect = (id) => { 
      setSelectedBrandId(id); 
      setModels([]); 
      setSelectedModelId(""); 
      setAvailableYears([]); 
      setSelectedYear(""); 
      setDisplayedProducts([]); 
      setOpenDropdown(null);
  };
  
  const handleModelSelect = (id) => { 
      setSelectedModelId(id); 
      setAvailableYears([]); 
      setSelectedYear(""); 
      setDisplayedProducts([]); 
      setOpenDropdown(null);
  };

  const handleYearSelect = (year) => {
      setSelectedYear(year);
      setOpenDropdown(null);
  };

  const handleDeleteProduct = async (productId, tableName) => {
    if (userRole !== 'admin') { return alert("⛔ غير مسموح"); }
    if (!window.confirm("حذف نهائي؟")) return;
    const { error } = await supabase.from(tableName).delete().eq('id', productId);
    if (error) { alert(error.message); } 
    else { setDisplayedProducts(prev => prev.filter(item => item.id !== productId || item.table !== tableName)); alert("تم الحذف بنجاح"); }
  };

  const handleProductUpdate = (updatedProduct) => {
    setDisplayedProducts(prevProducts => prevProducts.map(p => (p.id === updatedProduct.id && p.table === updatedProduct.table) ? updatedProduct : p));
  };

  const selectedBrandName = brands.find(b => b.id.toString() === selectedBrandId.toString())?.name;
  const selectedModelName = models.find(m => m.id.toString() === selectedModelId.toString())?.name;

  return (
    <main className="p-4 md:p-8 flex-grow container mx-auto animate-fadeIn relative">
        
        {/* ✅ حل المشكلة: تم تعديل الطبقة لـ z-40 */}
        {openDropdown && (
            <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>
        )}

        {/* ✅ حل المشكلة: إعطاء الصندوق الأساسي z-50 ليكون فوق الطبقة الشفافة */}
        <div className="bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-2xl border border-white/10 max-w-xl mx-auto mb-10 relative z-50">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>

            <h2 className="text-2xl font-extrabold mb-8 text-center flex justify-center items-center gap-3">
                <Search className="w-6 h-6 text-amber-400 drop-shadow-md" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-600 drop-shadow-sm">
                  البحث المخصص بالسيارة
                </span>
            </h2>

            <div className="space-y-5 relative">
                
                {/* ✅ حل المشكلة: إعطاء القائمة المفتوحة z-50 والمغلقة z-10 لمنع التداخل */}
                <div className={`relative ${openDropdown === 'brand' ? 'z-50' : 'z-10'}`}>
                    <div 
                        onClick={() => setOpenDropdown(openDropdown === 'brand' ? null : 'brand')}
                        className={`w-full p-4 pl-4 pr-12 rounded-2xl bg-black/40 backdrop-blur-md text-orange-50 border transition-all shadow-inner cursor-pointer flex items-center ${openDropdown === 'brand' ? 'border-amber-500/50 ring-1 ring-amber-500/50' : 'border-white/10 hover:border-amber-500/30'}`}
                    >
                        <span className={`block truncate ${selectedBrandName ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {selectedBrandName || '-- اختر الشركة المصنعة --'}
                        </span>
                        <CarFront className={`absolute right-4 w-5 h-5 transition-colors ${selectedBrandId || openDropdown === 'brand' ? 'text-amber-400' : 'text-gray-500'}`} />
                        <ChevronDown className={`absolute left-4 w-5 h-5 transition-transform duration-300 ${openDropdown === 'brand' ? 'rotate-180 text-amber-400' : 'text-gray-500'}`} />
                    </div>

                    {openDropdown === 'brand' && (
                        <div className="absolute top-full mt-2 w-full bg-[#1a0f07]/95 backdrop-blur-3xl border border-amber-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-60 overflow-y-auto py-2 custom-scrollbar">
                            <div onClick={() => handleBrandSelect("")} className="px-5 py-3 text-gray-400 hover:bg-white/5 cursor-pointer transition-colors text-sm">
                                -- إزالة الاختيار --
                            </div>
                            {brands.map((b) => (
                                <div key={b.id} onClick={() => handleBrandSelect(b.id)} className={`px-5 py-3 cursor-pointer transition-colors flex items-center gap-2 ${selectedBrandId === b.id ? 'bg-amber-500/20 text-amber-400 font-bold border-r-2 border-amber-400' : 'text-orange-50 hover:bg-white/10 hover:text-amber-200'}`}>
                                    {b.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. قائمة الموديلات */}
                <div className={`relative ${openDropdown === 'model' ? 'z-50' : 'z-10'}`}>
                    <div 
                        onClick={() => selectedBrandId && setOpenDropdown(openDropdown === 'model' ? null : 'model')}
                        className={`w-full p-4 pl-4 pr-12 rounded-2xl bg-black/40 backdrop-blur-md text-orange-50 border transition-all shadow-inner flex items-center ${!selectedBrandId ? 'opacity-50 cursor-not-allowed border-white/5' : 'cursor-pointer border-white/10 hover:border-amber-500/30'} ${openDropdown === 'model' ? 'border-amber-500/50 ring-1 ring-amber-500/50' : ''}`}
                    >
                        <span className={`block truncate ${selectedModelName ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {selectedModelName || '-- اختر موديل السيارة --'}
                        </span>
                        <Settings2 className={`absolute right-4 w-5 h-5 transition-colors ${selectedModelId || openDropdown === 'model' ? 'text-amber-400' : 'text-gray-500'}`} />
                        <ChevronDown className={`absolute left-4 w-5 h-5 transition-transform duration-300 ${openDropdown === 'model' ? 'rotate-180 text-amber-400' : 'text-gray-500'}`} />
                    </div>

                    {openDropdown === 'model' && (
                        <div className="absolute top-full mt-2 w-full bg-[#1a0f07]/95 backdrop-blur-3xl border border-amber-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-60 overflow-y-auto py-2 custom-scrollbar">
                            <div onClick={() => handleModelSelect("")} className="px-5 py-3 text-gray-400 hover:bg-white/5 cursor-pointer transition-colors text-sm">
                                -- إزالة الاختيار --
                            </div>
                            {models.map((m) => (
                                <div key={m.id} onClick={() => handleModelSelect(m.id)} className={`px-5 py-3 cursor-pointer transition-colors flex items-center gap-2 ${selectedModelId === m.id ? 'bg-amber-500/20 text-amber-400 font-bold border-r-2 border-amber-400' : 'text-orange-50 hover:bg-white/10 hover:text-amber-200'}`}>
                                    {m.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. قائمة السنوات */}
                <div className={`relative ${openDropdown === 'year' ? 'z-50' : 'z-10'}`}>
                    <div 
                        onClick={() => selectedModelId && setOpenDropdown(openDropdown === 'year' ? null : 'year')}
                        className={`w-full p-4 pl-4 pr-12 rounded-2xl bg-black/40 backdrop-blur-md text-orange-50 border transition-all shadow-inner flex items-center ${!selectedModelId ? 'opacity-50 cursor-not-allowed border-white/5' : 'cursor-pointer border-white/10 hover:border-amber-500/30'} ${openDropdown === 'year' ? 'border-amber-500/50 ring-1 ring-amber-500/50' : ''}`}
                    >
                        <span className={`block truncate ${selectedYear ? 'text-white font-bold' : 'text-gray-400'}`}>
                            {selectedYear || '-- حدد سنة الصنع --'}
                        </span>
                        <Calendar className={`absolute right-4 w-5 h-5 transition-colors ${selectedYear || openDropdown === 'year' ? 'text-amber-400' : 'text-gray-500'}`} />
                        <ChevronDown className={`absolute left-4 w-5 h-5 transition-transform duration-300 ${openDropdown === 'year' ? 'rotate-180 text-amber-400' : 'text-gray-500'}`} />
                    </div>

                    {openDropdown === 'year' && (
                        <div className="absolute top-full mt-2 w-full bg-[#1a0f07]/95 backdrop-blur-3xl border border-amber-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-60 overflow-y-auto py-2 custom-scrollbar">
                            <div onClick={() => handleYearSelect("")} className="px-5 py-3 text-gray-400 hover:bg-white/5 cursor-pointer transition-colors text-sm">
                                -- إزالة الاختيار --
                            </div>
                            {availableYears.map((y) => (
                                <div key={y} onClick={() => handleYearSelect(y)} className={`px-5 py-3 cursor-pointer transition-colors flex items-center gap-2 ${selectedYear === y ? 'bg-amber-500/20 text-amber-400 font-bold border-r-2 border-amber-400' : 'text-orange-50 hover:bg-white/10 hover:text-amber-200'}`}>
                                    {y}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* شبكة عرض المنتجات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
            {loading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-amber-500/80 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-bold tracking-wide">جاري البحث في قاعدة البيانات...</p>
                </div>
            ) : displayedProducts.length > 0 ? (
                displayedProducts.map((product) => (
                <ProductCard 
                    key={`${product.table}-${product.id}`} 
                    product={product} 
                    userRole={userRole} 
                    sizes={sizes}
                    onDelete={handleDeleteProduct} 
                    onEdit={setEditingProduct} 
                />
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/5 border-dashed">
                    {selectedYear ? (
                        <>
                            <PackageX className="w-16 h-16 text-rose-500/50 mb-4" />
                            <p className="text-orange-200/60 text-lg md:text-xl font-bold">لا توجد منتجات مطابقة لهذه السيارة حالياً</p>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-16 h-16 text-amber-500/30 mb-4" />
                            <p className="text-orange-200/50 text-lg md:text-xl">الرجاء اختيار بيانات السيارة لاستعراض المنتجات المتاحة</p>
                        </>
                    )}
                </div>
            )}
        </div>

        {editingProduct && (<EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={handleProductUpdate}/>)}
    </main>
  );
}