import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Package, Plus, Trash2, Barcode } from 'lucide-react'; // 🆕 أضفنا أيقونة الباركود

export default function OrderProducts({ formData, setFormData, sizes }) {
  const [compatibleFrames, setCompatibleFrames] = useState([]);
  const [availableScreens, setAvailableScreens] = useState([]);
  const [allAccessories, setAllAccessories] = useState([]);
  
  const [accessoryCategories, setAccessoryCategories] = useState([]);
  const [accCategory, setAccCategory] = useState('all'); 
  const [accSearch, setAccSearch] = useState(''); 

  // جلب الفريمات (تم حل مشكلة التحذير الأحمر)
  useEffect(() => {
    const fetchFrames = async () => {
      // نقلنا الشرط لداخل الدالة لكي يعمل بهدوء ولا يسبب حلقة لا نهائية
      if (!formData.carGenerationId) { 
          setCompatibleFrames([]); 
          return; 
      }
      
      const { data } = await supabase.from('frames').select('*').eq('generation_id', formData.carGenerationId);
      setCompatibleFrames(data || []);
    };
    
    fetchFrames();
  }, [formData.carGenerationId]);

  // جلب الشاشات
  useEffect(() => {
    const fetchScreens = async () => {
      if (!formData.screenSizeId) { setAvailableScreens([]); return; }
      let query = supabase.from('screens').select('*').eq('size_id', formData.screenSizeId);
      if (String(formData.screenSizeId) === '3') {
          if (formData.carGenerationId) query = query.eq('generation_id', formData.carGenerationId);
          else { setAvailableScreens([]); return; }
      } else {
          query = query.is('generation_id', null);
      }
      const { data } = await query;
      setAvailableScreens(data || []);
    };
    fetchScreens();
  }, [formData.screenSizeId, formData.carGenerationId]); 

  // جلب الإكسسوارات
  useEffect(() => {
    const fetchAccData = async () => {
      const { data: accData } = await supabase.from('accessories').select('*');
      setAllAccessories(accData || []);
      const { data: catData } = await supabase.from('accessory_categories').select('*');
      setAccessoryCategories(catData || []);
    };
    fetchAccData();
  }, []);

  // إضافة إكسسوار
  const addAccessory = (accItem) => { // 🆕 عدلنا الدالة لتستقبل المنتج كاملاً وليس الـ ID فقط
    if (!accItem) return;
    if (!formData.otherProducts.find(p => p.id === accItem.id)) {
      setFormData(prev => ({ ...prev, otherProducts: [...prev.otherProducts, accItem] }));
    }
  };

  const removeAccessory = (id) => {
    setFormData(prev => ({ ...prev, otherProducts: prev.otherProducts.filter(p => p.id !== id) }));
  };

  const filteredAccessories = allAccessories.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(accSearch.toLowerCase()) || 
                            (a.barcode && a.barcode.includes(accSearch)); // 🆕 البحث أصبح يشمل الباركود أيضاً
      const matchesCategory = accCategory === 'all' || a.category === accCategory;
      return matchesSearch && matchesCategory;
  });

  // 🆕 دالة قراءة الباركود (الصياد)
  const handleBarcodeSubmit = (e) => {
      // 1. إذا ضغطنا Enter (وهو ما يفعله جهاز الباركود تلقائياً)
      if (e.key === 'Enter') {
          e.preventDefault(); // نمنع تحديث الصفحة

          // 2. نبحث عن منتج يطابق الباركود تماماً
          const foundProduct = allAccessories.find(a => a.barcode && a.barcode === accSearch.trim());
          
          if (foundProduct) {
              addAccessory(foundProduct); // 3. إذا وجدناه، نضيفه مباشرة
              setAccSearch(''); // 4. نفرغ المربع للباركود القادم
          }
      }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 mb-6 shadow-lg relative z-10">
        <h3 className="text-xl font-bold text-amber-400 mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
            <Package className="w-6 h-6" /> 3. تفاصيل المنتجات المطلوبة
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">قياس الشاشة (إجباري)</label>
                <select value={formData.screenSizeId} onChange={(e) => setFormData({...formData, screenSizeId: e.target.value, screenId: ''})} 
                    className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-amber-500">
                    <option value="">اختر القياس...</option>
                    {sizes.map(s => <option className="bg-gray-900" key={s.id} value={s.id}>{s.size_name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">الفريم / الديكور (اختياري)</label>
                <select value={formData.frameId} onChange={(e) => setFormData({...formData, frameId: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-amber-500 disabled:opacity-50"
                    disabled={!formData.carGenerationId || String(formData.screenSizeId) === '3'}>
                    <option value="">{String(formData.screenSizeId) === '3' ? "لا تحتاج فريم" : (formData.carGenerationId ? "اختر الفريم..." : "حدد السيارة أولاً")}</option>
                    {compatibleFrames.map(f => <option className="bg-gray-900" key={f.id} value={f.id}>{f.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">نوع الشاشة (اختياري)</label>
                <select value={formData.screenId} onChange={(e) => setFormData({...formData, screenId: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-amber-500 disabled:opacity-50"
                    disabled={!formData.screenSizeId}>
                    <option value="">{formData.screenSizeId ? "اختر الشاشة..." : "حدد القياس أولاً"}</option>
                    {availableScreens.map(s => <option className="bg-gray-900" key={s.id} value={s.id}>{s.name} - {s.price ? s.price + '$' : ''}</option>)}
                </select>
            </div>
        </div>

        <div className="border-t border-white/5 pt-4">
            <label className="text-sm text-orange-200/80 mb-2 block font-bold flex items-center gap-2">
                <Barcode className="w-4 h-4 text-amber-400" /> إضافة إكسسوارات (ابحث أو اقرأ الباركود)
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <select value={accCategory} onChange={(e) => setAccCategory(e.target.value)}
                    className="sm:w-1/3 p-3 rounded-xl bg-black/60 border border-white/10 text-amber-300 outline-none focus:border-amber-500 text-sm cursor-pointer">
                    <option value="all" className="bg-gray-900">كل الأقسام</option>
                    {accessoryCategories.map(cat => <option className="bg-gray-900" key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>

                {/* 🆕 مربع البحث المتطور (يدعم الباركود) */}
                <input 
                    type="text" 
                    placeholder="🔍 اقرأ الباركود هنا، أو اكتب اسم المنتج..." 
                    value={accSearch} 
                    onChange={(e) => setAccSearch(e.target.value)}
                    onKeyDown={handleBarcodeSubmit} // 👈 🆕 المستشعر الذي ينتظر ضغطة Enter من جهاز الباركود
                    className="flex-1 p-3 pl-4 rounded-xl bg-black/60 border border-emerald-500/30 text-orange-50 outline-none focus:border-emerald-500 text-sm shadow-[0_0_10px_rgba(16,185,129,0.1)] focus:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                />
            </div>

            <div className="flex gap-2 mb-4">
                <select onChange={(e) => { 
                    const item = allAccessories.find(a => String(a.id) === String(e.target.value));
                    addAccessory(item); 
                    setAccSearch(''); 
                }} value=""
                    className="flex-1 p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-teal-500 cursor-pointer">
                    <option className="bg-gray-900" value="">أو اختر يدوياً ({filteredAccessories.length} نتيجة)...</option>
                    {filteredAccessories.map(a => <option className="bg-gray-900" key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <div className="bg-teal-500/20 p-3 rounded-xl border border-teal-500/50 text-teal-400 flex items-center justify-center cursor-default">
                    <Plus className="w-5 h-5" />
                </div>
            </div>

            <div className="space-y-2 mt-4">
                {formData.otherProducts.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-emerald-500/20 animate-fadeIn">
                        <span className="text-orange-50 font-medium flex items-center gap-2">
                            <Package className="w-4 h-4 text-emerald-400" /> {item.name}
                        </span>
                        <button type="button" onClick={() => removeAccessory(item.id)} className="text-rose-400 hover:text-rose-300 p-1 bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}