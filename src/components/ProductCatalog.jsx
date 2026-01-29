import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ProductCard from './ProductCard';
import EditProductModal from './EditProductModal';

// يمكننا استقبال sizes كـ prop من الأب، أو استخدام الـ state الداخلي كما هو موجود في كودك الحالي
export default function ProductCatalog({ userRole, sizes: propSizes }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // نستخدم المقاسات الممررة من App أو نجلبها داخلياً (حسب كودك الحالي سنعتمد على الجلب الداخلي أو الدمج)
  const [sizes, setSizes] = useState([]);

  // --- الفلاتر ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, frames, screens
  const [filterSize, setFilterSize] = useState('all');

  // --- التعديل ---
  const [editingProduct, setEditingProduct] = useState(null);

  // 1. جلب المقاسات (موجود في كودك، سنبقيه لضمان العمل)
  useEffect(() => {
    const fetchSizes = async () => {
      // إذا تم تمرير المقاسات من App نستخدمها، وإلا نجلبها من السيرفر
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
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fadeIn text-right dir-rtl min-h-[500px]">
      <h2 className="text-2xl font-bold text-blue-400 mb-6 border-b border-gray-700 pb-4">
         📦 كتالوج المنتجات الشامل
      </h2>

      {/* شريط الفلاتر */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-900 p-4 rounded border border-gray-700">
        
        {/* بحث بالاسم */}
        <div>
            <label className="text-sm text-gray-400 mb-1 block">بحث بالاسم</label>
            <input 
                type="text" 
                placeholder="اكتب اسم المنتج..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white focus:border-blue-500 outline-none"
            />
        </div>

        {/* فلتر النوع */}
        <div>
            <label className="text-sm text-gray-400 mb-1 block">تصفية حسب النوع</label>
            <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
            >
                <option value="all">📦 الكل (شاشات وإطارات)</option>
                <option value="screens">📺 شاشات فقط</option>
                <option value="frames">🖼️ إطارات فقط</option>
            </select>
        </div>

        {/* فلتر المقاس */}
        <div>
            <label className="text-sm text-gray-400 mb-1 block">تصفية حسب المقاس</label>
            <select 
                value={filterSize} 
                onChange={(e) => setFilterSize(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white"
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

      {/* شبكة المنتجات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <p className="text-center text-gray-400 col-span-3 py-10">جاري البحث في قاعدة البيانات... ⏳</p>
        ) : products.length > 0 ? (
           products.map(product => (
             <ProductCard 
                key={`${product.table}-${product.id}`}
                product={product}
                userRole={userRole}
                
                // ✅✅✅ تم التعديل هنا: تمرير المقاسات للبطاقة ✅✅✅
                sizes={sizes}
                
                onDelete={handleDelete}
                onEdit={setEditingProduct}
             />
           ))
        ) : (
           <div className="col-span-3 text-center py-10 bg-gray-900/50 rounded border border-gray-700 border-dashed">
              <p className="text-gray-500 text-xl">لا توجد منتجات تطابق البحث</p>
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