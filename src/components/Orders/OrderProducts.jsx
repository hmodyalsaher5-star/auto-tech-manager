import React from 'react';
import { Package, Monitor, Layers, Smartphone, Hash, Trash2, Plus, ListTree } from 'lucide-react';

export default function OrderProducts({ formData, setFormData }) {
  
  // دالة لإضافة منتج جديد للسلة
  const addProduct = () => {
    setFormData(prev => ({
        ...prev,
        products: [...prev.products, { id: Date.now(), category: 'other', screenSize: '', frame: '', productName: '', quantity: '1' }]
    }));
  };

  // دالة لحذف منتج من السلة
  const removeProduct = (id) => {
    if(formData.products.length === 1) return; // منع حذف المنتج الوحيد
    setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
    }));
  };

  // دالة لتحديث بيانات منتج معين
  const updateProduct = (id, field, value) => {
    setFormData(prev => ({
        ...prev,
        products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 mb-6 shadow-lg relative z-10">
        <h3 className="text-xl font-bold text-amber-400 mb-6 border-b border-white/10 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2"><Package className="w-6 h-6" /> المنتجات المطلوبة</div>
            <span className="bg-amber-500/20 text-amber-300 text-sm px-3 py-1 rounded-full">{formData.products.length} منتجات</span>
        </h3>

        <div className="space-y-6">
            {formData.products.map((product) => {
                const isScreen = product.category === 'screen';
                
                return (
                    <div key={product.id} className="bg-black/40 p-5 rounded-2xl border border-white/10 relative group">
                        
                        {/* رأس المنتج وزر الحذف */}
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer text-white font-medium hover:text-amber-400">
                                    <input type="radio" checked={isScreen} onChange={() => updateProduct(product.id, 'category', 'screen')} className="accent-amber-500 w-4 h-4" />
                                    شاشة سيارة
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-white font-medium hover:text-emerald-400">
                                    <input type="radio" checked={!isScreen} onChange={() => updateProduct(product.id, 'category', 'other')} className="accent-emerald-500 w-4 h-4" />
                                    منتج آخر
                                </label>
                            </div>
                            {formData.products.length > 1 && (
                                <button type="button" onClick={() => removeProduct(product.id)} className="text-rose-400 hover:text-rose-300 bg-rose-500/10 p-2 rounded-lg transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* الحقول الخاصة بالمنتج */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {isScreen && (
                                <>
                                    <div>
                                        <label className="text-xs text-orange-200/80 mb-2 block font-bold">القياس (إجباري)</label>
                                        <div className="relative">
                                            <input type="text" value={product.screenSize} onChange={(e) => updateProduct(product.id, 'screenSize', e.target.value)} required={isScreen} placeholder="مثال: 9 بوصة" className="w-full p-3 pl-4 pr-11 rounded-xl bg-black/60 border border-white/10 text-white focus:border-amber-500 outline-none" />
                                            <Monitor className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-orange-200/80 mb-2 block font-bold">الإطار / الديكور</label>
                                        <div className="relative">
                                            <input type="text" value={product.frame} onChange={(e) => updateProduct(product.id, 'frame', e.target.value)} placeholder="مثال: كامري 2020" className="w-full p-3 pl-4 pr-11 rounded-xl bg-black/60 border border-white/10 text-white focus:border-amber-500 outline-none" />
                                            <Layers className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="text-xs text-orange-200/80 mb-2 block font-bold">{isScreen ? "نوع الشاشة" : "اسم المنتج"}</label>
                                <div className="relative">
                                    <input type="text" value={product.productName} onChange={(e) => updateProduct(product.id, 'productName', e.target.value)} required placeholder={isScreen ? "مثال: أندرويد 4 رام" : "مثال: سماعات بايونير"} className="w-full p-3 pl-4 pr-11 rounded-xl bg-black/60 border border-white/10 text-white focus:border-amber-500 outline-none" />
                                    <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-orange-200/80 mb-2 block font-bold">العدد</label>
                                <div className="relative">
                                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={product.quantity} onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)} className="w-full p-3 pl-4 pr-11 rounded-xl bg-black/60 border border-white/10 text-white focus:border-amber-500 outline-none" />
                                    <Hash className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* زر إضافة منتج إضافي */}
        <button type="button" onClick={addProduct} className="mt-4 w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all font-bold">
            <Plus className="w-5 h-5" /> إضافة منتج آخر لهذه الطلبية
        </button>
    </div>
  );
}