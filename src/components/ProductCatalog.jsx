import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ProductCard from './ProductCard';
import EditProductModal from './EditProductModal';

export default function ProductCatalog({ userRole, sizes: propSizes }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sizes, setSizes] = useState([]);

  // --- الفلاتر ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterSize, setFilterSize] = useState('all');

  // --- التعديل ---
  const [editingProduct, setEditingProduct] = useState(null);

  // 1. جلب المقاسات
  useEffect(() => {
    const fetchSizes = async () => {
      if (propSizes && propSizes.length > 0) {
          setSizes(propSizes);
      } else {
          const { data } = await supabase.from('standard_sizes').select('*');
          if (data) setSizes(data);
      }
    };
    fetchSizes();
  }, [propSizes]);

  // 2. جلب المنتجات (عند تغيير أي فلتر)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      try {
        let framesQuery = supabase.from('frames').select('*');
        let screensQuery = supabase.from('screens').select('*');

        if (filterSize !== 'all') {
          framesQuery = framesQuery.eq('size_id', filterSize);
          screensQuery = screensQuery.eq('size_id', filterSize);
        }

        if (searchTerm) {
          framesQuery = framesQuery.ilike('name', `%${searchTerm}%`);
          screensQuery = screensQuery.ilike('name', `%${searchTerm}%`);
        }

        let fetchedFrames = [];
        let fetchedScreens = [];

        if (filterType === 'all' || filterType === 'frames') {
          const res = await framesQuery;
          if (res.data) fetchedFrames = res.data.map(f => ({ ...f, type: 'إطار/ديكور 🖼️', table: 'frames' }));
        }

        if (filterType === 'all' || filterType === 'screens') {
          const res = await screensQuery;
          if (res.data) fetchedScreens = res.data.map(s => ({ ...s, type: 'شاشة إلكترونية 📺', table: 'screens' }));
        }

        const combined = [...fetchedFrames, ...fetchedScreens];
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

  }, [searchTerm, filterType, filterSize]);

  // --- عمليات الحذف والتعديل ---
  const handleDelete = async (productId, tableName) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) return;

    const { error } = await supabase.from(tableName).delete().eq('id', productId);
    if (error) {
      alert("خطأ في الحذف: " + error.message);
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId || p.table !== tableName));
      alert("تم الحذف بنجاح 🗑️");
    }
  };

  const handleUpdate = (updatedProduct) => {
    setProducts(prev => prev.map(p => 
      (p.id === updatedProduct.id && p.table === updatedProduct.table) ? updatedProduct : p
    ));
  };

  return (
    // تقليل الحواف في الهاتف p-3 وتوسيعها في الشاشات الكبيرة md:p-6
    <div className="bg-gray-800 p-3 md:p-6 rounded-lg shadow-lg animate-fadeIn text-right dir-rtl min-h-[500px]">
      <h2 className="text-xl md:text-2xl font-bold text-blue-400 mb-4 border-b border-gray-700 pb-4">
         📦 كتالوج المنتجات الشامل
      </h2>

      {/* شريط الفلاتر (أصبح ثابتاً Sticky) */}
      <div className="sticky top-2 z-50 bg-gray-900/95 backdrop-blur-sm p-4 rounded-xl border border-gray-700 mb-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* بحث بالاسم */}
          <div>
              <label className="text-xs md:text-sm text-gray-400 mb-1 block">بحث بالاسم</label>
              <input 
                  type="text" 
                  placeholder="اكتب اسم المنتج..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white focus:border-blue-500 outline-none text-sm"
              />
          </div>

          {/* فلتر النوع */}
          <div>
              <label className="text-xs md:text-sm text-gray-400 mb-1 block">تصفية حسب النوع</label>
              <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:border-blue-500 outline-none"
              >
                  <option value="all">📦 الكل (شاشات وإطارات)</option>
                  <option value="screens">📺 شاشات فقط</option>
                  <option value="frames">🖼️ إطارات فقط</option>
              </select>
          </div>

          {/* فلتر المقاس */}
          <div>
              <label className="text-xs md:text-sm text-gray-400 mb-1 block">تصفية حسب المقاس</label>
              <select 
                  value={filterSize} 
                  onChange={(e) => setFilterSize(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:border-blue-500 outline-none"
              >
                  <option value="all">📏 كل المقاسات</option>
                  {sizes.map(size => (
                      <option key={size.id} value={size.id}>
                          {size.size_name}
                      </option>
                  ))}
              </select>
          </div>
        </div>
        
        {/* عداد النتائج */}
        <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center text-sm">
           <span className="text-gray-400 font-bold">
             {loading ? 'جاري البحث... ⏳' : `📊 تم العثور على: ${products.length} منتج`}
           </span>
        </div>
      </div>

      {/* شبكة المنتجات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
           <div className="col-span-full flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
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
           <div className="col-span-full text-center py-16 bg-gray-900/50 rounded-xl border border-gray-700 border-dashed">
              <p className="text-gray-400 text-lg md:text-xl">لا توجد منتجات تطابق بحثك حالياً 🔍</p>
           </div>
        )}
      </div>

      {/* نافذة التعديل */}
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