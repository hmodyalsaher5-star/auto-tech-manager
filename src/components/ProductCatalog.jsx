import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import ProductCard from './ProductCard';
import EditProductModal from './EditProductModal';
import html2pdf from 'html2pdf.js';
import PdfCartBar from './PdfCartBar';
import CarFilter from './CarFilter';
import GeneralFilters from './GeneralFilters';
import { 
    Search, Filter, Ruler, FolderOpen, Loader2, 
    PackageSearch, Sparkles, Library, ArrowUp, CarFront, Settings2, Calendar,
    CheckCircle2, CheckSquare, ChevronRight, ChevronLeft
} from 'lucide-react';

export default function ProductCatalog({ userRole, sizes: propSizes }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [accessoryCategories, setAccessoryCategories] = useState([]);
  const [showTopBtn, setShowTopBtn] = useState(false); 

  // إعدادات نظام الصفحات (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 50; 

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [generations, setGenerations] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [filterSize, setFilterSize] = useState('all');
  const [filterAccessoryCategory, setFilterAccessoryCategory] = useState('all');

  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterGeneration, setFilterGeneration] = useState('');

  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
        const isAlreadySelected = prev.some(p => p.id === product.id && p.table === product.table);
        if (isAlreadySelected) {
            return prev.filter(p => !(p.id === product.id && p.table === product.table)); 
        } else {
            return [...prev, product]; 
        }
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length && products.length > 0) {
        setSelectedProducts([]);
    } else {
        setSelectedProducts([...products]);
    }
  };

  const generatePDF = () => {
    const element = document.getElementById('pdf-content');
    const opt = {
      margin:       0.5,
      filename:     'كتالوج_منتجات.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, 
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleBrandChange = (e) => {
    setFilterBrand(e.target.value);
    setFilterModel('');
    setFilterGeneration('');
    setModels([]);
    setGenerations([]);
  };

  const handleModelChange = (e) => {
    setFilterModel(e.target.value);
    setFilterGeneration('');
    setGenerations([]);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShowTopBtn(true);
      else setShowTopBtn(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      const { data: brandsData } = await supabase.from('brands').select('*');
      if (brandsData) setBrands(brandsData);
    };
    fetchInitialData();
  }, [propSizes]);

  useEffect(() => {
    if (!filterBrand) return; 
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', filterBrand);
      setModels(data || []);
    };
    fetchModels();
  }, [filterBrand]);

  useEffect(() => {
    if (!filterModel) return; 
    const fetchGenerations = async () => {
      const { data } = await supabase.from('car_generations').select('*').eq('car_model_id', filterModel);
      setGenerations(data || []);
    };
    fetchGenerations();
  }, [filterModel]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setSelectedProducts([]); 
      setCurrentPage(1); 

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

        if (filterGeneration) {
            framesQuery = framesQuery.eq('generation_id', filterGeneration);
            screensQuery = screensQuery.eq('generation_id', filterGeneration);
            accessoriesQuery = accessoriesQuery.eq('generation_id', filterGeneration);
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
  }, [searchTerm, filterType, filterSize, filterAccessoryCategory, filterGeneration]);

  const handleTypeChange = (e) => {
      const selectedType = e.target.value;
      setFilterType(selectedType);
      if (selectedType === 'accessories') setFilterSize('all');
      else setFilterAccessoryCategory('all');
  };

  const handleDelete = async (productId, tableName) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) return;
    const { error } = await supabase.from(tableName).delete().eq('id', productId);
    if (!error) setProducts(prev => prev.filter(p => p.id !== productId || p.table !== tableName));
  };

  const handleUpdate = (updatedProduct) => {
    setProducts(prev => prev.map(p => 
      (p.id === updatedProduct.id && p.table === updatedProduct.table) ? updatedProduct : p
    ));
  };

  // حسابات التصفح وتقطيع المنتجات
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  const paginate = (pageNumber) => {
      setCurrentPage(pageNumber);
      scrollToTop(); 
  };

  // 🆕 دالة إنشاء الترقيم المباشر على طريقة نظام بحث Google
  const renderPagination = () => {
    if (loading || totalPages <= 1) return null;
    
    // إعداد النطاق الذكي لعرض الأرقام (أقصى عدد أزرار معروضة في نفس الوقت هو 5)
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 my-6 relative z-10 w-full select-none">
            {/* زر السابق */}
            <button 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed font-bold border border-amber-500/20 transition-all text-xs md:text-sm active:scale-95"
            >
                <ChevronRight className="w-4 h-4" /> السابق
            </button>
            
            {/* عرض الصفحة الأولى إذا كانت بعيدة */}
            {startPage > 1 && (
                <>
                    <button 
                        onClick={() => paginate(1)}
                        className="px-3 py-1.5 rounded-xl font-bold transition-all text-xs md:text-sm bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 active:scale-95"
                    >
                        1
                    </button>
                    {startPage > 2 && <span className="text-gray-500 px-1 text-sm">...</span>}
                </>
            )}

            {/* أرقام الصفحات المباشرة (مثل نظام جوجل) */}
            <div className="flex items-center gap-1.5">
                {pageNumbers.map(num => (
                    <button
                        key={num}
                        onClick={() => paginate(num)}
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all text-xs md:text-sm active:scale-95 border ${
                            currentPage === num
                                ? 'bg-amber-500 text-gray-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {num}
                    </button>
                ))}
            </div>

            {/* عرض الصفحة الأخيرة إذا كانت بعيدة */}
            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="text-gray-500 px-1 text-sm">...</span>}
                    <button 
                        onClick={() => paginate(totalPages)}
                        className="px-3 py-1.5 rounded-xl font-bold transition-all text-xs md:text-sm bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 active:scale-95"
                    >
                        {totalPages}
                    </button>
                </>
            )}

            {/* زر التالي */}
            <button 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl disabled:opacity-20 disabled:cursor-not-allowed font-bold border border-amber-500/20 transition-all text-xs md:text-sm active:scale-95"
            >
                التالي <ChevronLeft className="w-4 h-4" />
            </button>
        </div>
    );
  };

  return (
    <div className="p-2 md:p-6 animate-fadeIn relative text-right dir-rtl min-h-[600px]">
      
      <h2 className="text-2xl md:text-3xl font-extrabold mb-8 flex items-center gap-3">
          <Library className="w-8 h-8 text-amber-400 drop-shadow-md hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-600 drop-shadow-sm">
             كتالوج المنتجات الشامل
          </span>
      </h2>

      <div className="relative z-10 bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] border border-amber-500/20 mb-6 shadow-2xl overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <CarFilter 
            brands={brands}
            models={models}
            generations={generations}
            filterBrand={filterBrand}
            filterModel={filterModel}
            filterGeneration={filterGeneration}
            onBrandChange={handleBrandChange}
            onModelChange={handleModelChange}
            onGenerationChange={setFilterGeneration}
        />

        <GeneralFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            onTypeChange={handleTypeChange}
            filterSize={filterSize}
            setFilterSize={setFilterSize}
            sizes={sizes}
            filterAccessoryCategory={filterAccessoryCategory}
            setFilterAccessoryCategory={setFilterAccessoryCategory}
            accessoryCategories={accessoryCategories}
        />
        
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap justify-between items-center gap-4 text-sm">
            <span className="text-orange-200/80 font-bold bg-white/5 px-4 py-2 rounded-full border border-white/5 shadow-inner flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
              {loading ? 'جاري البحث...' : `تم العثور على: ${products.length} منتج`}
            </span>

            {products.length > 0 && (
                <button 
                    onClick={handleSelectAll}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 px-5 py-2 rounded-full font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                >
                    <CheckSquare className="w-5 h-5" />
                    {selectedProducts.length === products.length ? 'إلغاء تحديد الكل' : 'تحديد كل المعروض'}
                </button>
            )}
        </div>
      </div>

      {/* 🆕 شريط التنقل (العلوي المباشر) */}
      {renderPagination()}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10 pb-4 mt-4">
        {loading ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20 text-amber-500/80 gap-3">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-bold tracking-wide">جاري سحب البيانات...</p>
           </div>
        ) : currentProducts.length > 0 ? (
           currentProducts.map(product => {
             const isSelected = selectedProducts.some(p => p.id === product.id && p.table === product.table);
             return (
               <ProductCard 
                  key={`${product.table}-${product.id}`}
                  product={product}
                  userRole={userRole}
                  sizes={sizes}
                  onDelete={handleDelete}
                  onEdit={setEditingProduct}
                  isSelected={isSelected}
                  onSelect={toggleProductSelection}
               />
             )
           })
        ) : (
           <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/5 backdrop-blur-sm rounded-[2rem] border border-white/10 border-dashed shadow-inner">
              <PackageSearch className="w-16 h-16 text-rose-500/50 mb-4" />
              <p className="text-orange-200/60 text-xl font-bold">لا توجد منتجات تطابق معايير البحث</p>
           </div>
        )}
      </div>

      {/* 🆕 شريط التنقل (السفلي المباشر) */}
      <div className="mb-24">
          {renderPagination()}
      </div>

      <PdfCartBar 
          selectedProducts={selectedProducts} 
          onGeneratePDF={generatePDF} 
      />

      {showTopBtn && (
        <button onClick={scrollToTop} className="fixed bottom-24 right-8 z-[60] bg-amber-500/20 backdrop-blur-xl border border-amber-500/50 text-amber-400 p-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-500/40 transition-all active:scale-95 animate-fadeIn flex flex-col items-center gap-1 group">
          <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          <span className="text-[10px] font-bold">فوق</span>
        </button>
      )}

      {editingProduct && (
        <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={handleUpdate} />
      )}

      {/* 📄 الورقة البيضاء المخفية للملفات المستندة على PDF */}
      <div className="absolute left-[-9999px] top-0">
          <div id="pdf-content" style={{ width: '800px', backgroundColor: '#ffffff', padding: '32px', direction: 'rtl', textAlign: 'right', fontFamily: 'sans-serif' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '4px solid #f59e0b', paddingBottom: '24px' }}>
                  <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>كتالوج المنتجات</h1>
                  <p style={{ color: '#6b7280', fontWeight: 'bold', margin: '0' }}>مُصمم خصيصاً لاختياراتك</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                  {selectedProducts.map(product => (
                    <div key={product.id} style={{ width: 'calc(50% - 12px)', border: '2px solid #f3f4f6', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxSizing: 'border-box', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          <img 
                              src={product.image_url || "https://placehold.co/300x300?text=No+Image"} 
                              alt={product.name} 
                              style={{ width: '160px', height: '160px', objectFit: 'contain', marginBottom: '16px', borderRadius: '12px' }}
                              crossOrigin="anonymous" 
                          />
                          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>{product.name}</h2>
                          {product.specs && <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px 0' }}>{product.specs}</p>}
                          
                          <div style={{ marginTop: 'auto', backgroundColor: '#f9fafb', width: '100%', padding: '8px 0', borderRadius: '8px' }}>
                              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706', margin: '0' }}>
                                  {product.selling_price || product.price} {product.currency === 'USD' ? '$' : 'د.ع'}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>

              <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '2px solid #f3f4f6', textAlign: 'center', fontSize: '14px', color: '#9ca3af', fontWeight: 'bold' }}>
                  تم إصدار هذا الكتالوج من نظام مبيعات الشركة
              </div>
          </div>
      </div>
    </div>
  );
}