import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ProductCard from './ProductCard';
import EditProductModal from './EditProductModal';

// 🎨 استدعاء الأيقونات العصرية الفاخرة
import { 
    Search, Filter, Ruler, FolderOpen, Loader2, 
    PackageSearch, Sparkles, Library, ArrowUp 
} from 'lucide-react';

export default function ProductCatalog({ userRole, sizes: propSizes }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [accessoryCategories, setAccessoryCategories] = useState([]);
  const [showTopBtn, setShowTopBtn] = useState(false); 

  // --- الفلاتر ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterSize, setFilterSize] = useState('all');
  const [filterAccessoryCategory, setFilterAccessoryCategory] = useState('all');

  // --- التعديل ---
  const [editingProduct, setEditingProduct] = useState(null);

  // مراقبة التمرير لإظهار الزر
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. جلب المقاسات وفئات الإكسسوارات
  useEffect(() => {
    const fetchInitialData = async () => {
      if (propSizes && propSizes.length > 0) {
          setSizes(propSizes);
      } else {
          const { data } = await supabase.from('standard_sizes').select('*');
          if (data) setSizes(data);
      }
      const { data: catData } = await supabase.from('accessory_categories').select('*');
      if (catData) setAccessoryCategories(catData);
    };
    fetchInitialData();
  }, [propSizes]);

  // 2. جلب المنتجات
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let framesQuery = supabase.from('frames').select('*');
        let screensQuery = supabase.from('screens').select('*');
        let accessoriesQuery = supabase.from('accessories').select('*');

        if (filterSize !== 'all') {
          framesQuery = framesQuery.eq('size_id', filterSize);
          screensQuery = screensQuery.eq('size_id', filterSize);
        }

        if (filterType === 'accessories' && filterAccessoryCategory !== 'all') {
            accessoriesQuery = accessoriesQuery.eq('category', filterAccessoryCategory);
        }

        if (searchTerm) {
          framesQuery = framesQuery.ilike('name', `%${searchTerm}%`);
          screensQuery = screensQuery.ilike('name', `%${searchTerm}%`);
          accessoriesQuery = accessoriesQuery.ilike('name', `%${searchTerm}%`);
        }

        let fetchedFrames = [];
        let fetchedScreens = [];
        let fetchedAccessories = [];

        if (filterType === 'all' || filterType === 'frames') {
          const res = await framesQuery;
          if (res.data) fetchedFrames = res.data.map(f => ({ ...f, type: 'إطار/ديكور', table: 'frames' }));
        }

        if (filterType === 'all' || filterType === 'screens') {
          const res = await screensQuery;
          if (res.data) fetchedScreens = res.data.map(s => ({ ...s, type: 'شاشة إلكترونية', table: 'screens' }));
        }

        if ((filterType === 'all' || filterType === 'accessories') && filterSize === 'all') {
          const res = await accessoriesQuery;
          if (res.data) fetchedAccessories = res.data.map(a => ({ ...a, type: a.category || 'إكسسوارات', table: 'accessories' }));
        }

        const combined = [...fetchedFrames, ...fetchedScreens, ...fetchedAccessories];
        combined.sort((a, b) => b.id - a.id);
        setProducts(combined);
      } catch (error) {
        console.error("Error fetching catalog:", error);
      }
      setLoading(false);
    };

    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filterType, filterSize, filterAccessoryCategory]);

  const handleTypeChange = (e) => {
      const selectedType = e.target.value;
      setFilterType(selectedType);
      if (selectedType === 'accessories') {
          setFilterSize('all');
      } else {
          setFilterAccessoryCategory('all');
      }
  };

  const handleDelete = async (productId, tableName) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) return;
    const { error } = await supabase.from(tableName).delete().eq('id', productId);
    if (error) {
      alert("خطأ في الحذف: " + error.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId || p.table !== tableName));
      alert("تم الحذف بنجاح");
    }
  };

  const handleUpdate = (updatedProduct) => {
    setProducts(prev => prev.map(p => 
      (p.id === updatedProduct.id && p.table === updatedProduct.table) ? updatedProduct : p
    ));
  };

  return (
    <div className="p-2 md:p-6 animate-fadeIn relative text-right dir-rtl min-h-[600px]">
      
      {/* 🎨 العنوان الفاخر */}
      <h2 className="text-2xl md:text-3xl font-extrabold mb-8 flex items-center gap-3">
          <Library className="w-8 h-8 text-amber-400 drop-shadow-md hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-600 drop-shadow-sm">
             كتالوج المنتجات الشامل
          </span>
      </h2>

      {/* 🎨 صندوق الفلاتر الزجاجي (غير مثبت - Relative) */}
      <div className="relative z-10 bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] border border-amber-500/20 mb-10 shadow-2xl overflow-hidden">
        
        {/* توهج داخلي للجمالية */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10">
          
          {/* 1. بحث بالاسم */}
          <div className="relative group">
              <label className="text-xs md:text-sm text-orange-200/60 mb-1.5 block font-bold">البحث النصي</label>
              <div className="relative">
                  <input 
                      type="text" 
                      placeholder="اكتب اسم المنتج..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner text-sm"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 group-focus-within:text-amber-400 transition-colors" />
              </div>
          </div>

          {/* 2. فلتر النوع */}
          <div className="relative group">
              <label className="text-xs md:text-sm text-orange-200/60 mb-1.5 block font-bold">تصفية حسب النوع</label>
              <div className="relative">
                  <select 
                      value={filterType} 
                      onChange={handleTypeChange}
                      className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer"
                  >
                      <option className="bg-gray-900 text-white" value="all">الكل (شاشات، إطارات، إكسسوارات)</option>
                      <option className="bg-gray-900 text-white" value="screens">شاشات فقط</option>
                      <option className="bg-gray-900 text-white" value="frames">إطارات فقط</option>
                      <option className="bg-gray-900 text-white" value="accessories">إكسسوارات فقط</option>
                  </select>
                  <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 group-focus-within:text-amber-400 pointer-events-none transition-colors" />
              </div>
          </div>

          {/* 3. فلتر المقاس */}
          <div className="relative group">
              <label className="text-xs md:text-sm text-orange-200/60 mb-1.5 block font-bold">المقاس (للشاشات)</label>
              <div className="relative">
                  <select 
                      value={filterSize} 
                      onChange={(e) => setFilterSize(e.target.value)}
                      disabled={filterType === 'accessories'} 
                      className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                      <option className="bg-gray-900 text-white" value="all">كل المقاسات</option>
                      {sizes.map(size => (
                          <option className="bg-gray-900 text-white" key={size.id} value={size.id}>
                              {size.size_name}
                          </option>
                      ))}
                  </select>
                  <Ruler className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${filterType === 'accessories' ? 'text-gray-600' : 'text-amber-500/50 group-focus-within:text-amber-400'}`} />
              </div>
          </div>

          {/* 4. فلتر فئة الإكسسوار */}
          <div className="relative group">
              <label className={`text-xs md:text-sm mb-1.5 block font-bold transition-colors ${filterType === 'accessories' ? 'text-teal-400' : 'text-orange-200/60'}`}>
                  فئة الإكسسوار 
              </label>
              <div className="relative">
                  <select 
                      value={filterAccessoryCategory} 
                      onChange={(e) => setFilterAccessoryCategory(e.target.value)}
                      disabled={filterType !== 'accessories'} 
                      className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 outline-none transition-all shadow-inner text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                      <option className="bg-gray-900 text-white" value="all">كل الإكسسوارات</option>
                      {accessoryCategories.map(cat => (
                          <option className="bg-gray-900 text-white" key={cat.id} value={cat.name}>
                              {cat.name}
                          </option>
                      ))}
                  </select>
                  <FolderOpen className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${filterType !== 'accessories' ? 'text-gray-600' : 'text-teal-500/50 group-focus-within:text-teal-400'}`} />
              </div>
          </div>

        </div>
        
        {/* شريط الإحصائيات السفلي */}
        <div className="mt-6 pt-5 border-t border-white/10 flex justify-between items-center text-sm">
            <span className="text-orange-200/80 font-bold bg-white/5 px-4 py-2 rounded-full border border-white/5 shadow-inner flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
              {loading ? 'جاري البحث...' : `تم العثور على: ${products.length} منتج`}
            </span>
        </div>
      </div>

      {/* 🎨 شبكة المنتجات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20 text-amber-500/80 gap-3">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-bold tracking-wide">جاري سحب البيانات...</p>
           </div>
        ) : products.length > 0 ? (
           products.map(product => (
             <ProductCard 
                key={`${product.table}-${product.id}`}
                product={product}
                userRole={userRole}
                sizes={sizes}
                onDelete={handleDelete}
                onEdit={setEditingProduct}
             />
           ))
        ) : (
           <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/5 backdrop-blur-sm rounded-[2rem] border border-white/10 border-dashed shadow-inner">
              <PackageSearch className="w-16 h-16 text-rose-500/50 mb-4" />
              <p className="text-orange-200/60 text-xl font-bold">لا توجد منتجات تطابق معايير البحث</p>
           </div>
        )}
      </div>

      {/* 🎨 زر العودة للأعلى الزجاجي */}
      {showTopBtn && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[60] bg-amber-500/20 backdrop-blur-xl border border-amber-500/50 text-amber-400 p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-500/40 transition-all active:scale-95 animate-fadeIn flex flex-col items-center gap-1 group"
          title="العودة للأعلى"
        >
          <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          <span className="text-[10px] font-bold">فوق</span>
        </button>
      )}

      {editingProduct && (
        <EditProductModal 
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}