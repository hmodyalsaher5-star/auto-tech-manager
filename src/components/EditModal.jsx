import { useState } from 'react'
import { supabase } from '../supabase'

function EditModal({ product, onClose }) {
  const [loading, setLoading] = useState(false);
  
  // نملأ الاستمارة ببيانات المنتج القديمة
  const [formData, setFormData] = useState({
    name: product.name,
    brand: product.brand,
    model: product.model,
    year: product.year,
    price: product.price,
    image_url: product.image_url
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // أمر التحديث (Update)
    const { error } = await supabase
      .from('products')
      .update(formData)     // البيانات الجديدة
      .eq('id', product.id); // شرط: عدل فقط المنتج الذي يحمل هذا الرقم

    if (error) {
      alert("❌ حدث خطأ: " + error.message);
      setLoading(false);
    } else {
      alert("✅ تم تعديل البيانات بنجاح!");
      window.location.reload(); // تحديث الصفحة لرؤية التغيير
    }
  };

  return (
    // 🎨 خلفية سوداء شفافة مع تأثير ضبابي (Blur) تغطي الشاشة
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn dir-rtl text-right">
      
      {/* 🎨 الصندوق الزجاجي (النافذة) */}
      <div className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] w-full max-w-md border border-white/10 relative overflow-hidden">
        
        {/* توهج داخلي خفيف يعطي طابع الفخامة */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-[60px] pointer-events-none"></div>

        <h2 className="text-xl font-black text-amber-400 mb-6 drop-shadow-md flex items-center gap-2 relative z-10">
          ✏️ تعديل بيانات المنتج
        </h2>
        
        <form onSubmit={handleUpdate} className="space-y-4 relative z-10">
          
          <div>
            <label className="text-orange-200/70 text-sm font-bold mb-1 block">الاسم</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-orange-200/70 text-sm font-bold mb-1 block">الشركة</label>
              <input 
                name="brand" 
                value={formData.brand} 
                onChange={handleChange} 
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner" 
              />
            </div>
            <div>
              <label className="text-orange-200/70 text-sm font-bold mb-1 block">الموديل</label>
              <input 
                name="model" 
                value={formData.model} 
                onChange={handleChange} 
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner" 
              />
            </div>
          </div>

          <div>
             <label className="text-orange-200/70 text-sm font-bold mb-1 block">السنة</label>
             <input 
               name="year" 
               value={formData.year} 
               onChange={handleChange} 
               className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner text-left dir-ltr" 
               placeholder="مثال: 2019-2025"
             />
          </div>

          <div>
             <label className="text-orange-200/70 text-sm font-bold mb-1 block">السعر</label>
             <input 
               name="price" 
               value={formData.price} 
               onChange={handleChange} 
               className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all shadow-inner text-left dir-ltr" 
               type="number"
             />
          </div>

          {/* أزرار التحكم */}
          <div className="flex gap-3 mt-8 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 py-3 rounded-2xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:scale-95 flex justify-center items-center"
            >
              {loading ? "جارٍ الحفظ... ⏳" : "حفظ التعديلات ✔️"}
            </button>
            
            <button 
              type="button" 
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95"
            >
              إلغاء ✖️
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default EditModal