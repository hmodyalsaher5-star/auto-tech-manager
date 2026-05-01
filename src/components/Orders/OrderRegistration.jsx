import React, { useState } from 'react';
import CustomerInfo from './CustomerInfo';
import CarInfo from './CarInfo';
import OrderProducts from './OrderProducts'; 
import { PackageOpen, Banknote, PenTool } from 'lucide-react'; // 🆕 أضفنا أيقونة القلم للكتابة اليدوية
import { supabase } from '../../supabase';

export default function OrderRegistration({ sizes }) {
  
  // 📋 الاستمارة المركزية
  const [formData, setFormData] = useState({
    customerName: '',
    phone1: '',
    phone2: '',
    governorate: '',
    region: '',
    landmark: '',
    carBrandId: '',
    carModelId: '',
    carGenerationId: '',
    frameId: '',
    screenId: '',
    screenSizeId: '',
    otherProducts: [],
    manualDetails: '', // 🆕 ذاكرة جديدة لحفظ النص اليدوي
    totalPrice: '', 
    currency: 'USD' 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // إرسال البيانات للمخزن (Supabase)
    const { error } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: formData.customerName,
          phone1: formData.phone1,
          phone2: formData.phone2,
          governorate: formData.governorate,
          region: formData.region,
          landmark: formData.landmark,
          car_brand_id: formData.carBrandId || null,
          car_model_id: formData.carModelId || null,
          car_generation_id: formData.carGenerationId || null,
          frame_id: formData.frameId || null,
          screen_size_id: formData.screenSizeId || null, 
          screen_id: formData.screenId || null,
          manual_details: formData.manualDetails || null, // 🆕 إرسال النص اليدوي إلى المخزن
          total_price: formData.totalPrice || 0, 
          currency: formData.currency, 
          other_products: formData.otherProducts, 
          user_email: user?.email || 'unknown' 
        }
      ]);

    if (error) {
      console.error("خطأ في الحفظ:", error.message);
      alert("عذراً، فشل تسجيل الطلب. تأكد من الاتصال بالإنترنت.");
    } else {
      alert("تم تسجيل الطلب بنجاح وتحويله لقسم التجهيز! 🎉");
      window.location.reload(); 
    }
  };

  return (
    <div className="p-2 md:p-6 animate-fadeIn relative text-right dir-rtl min-h-[600px]">
      
      <h2 className="text-2xl md:text-3xl font-extrabold mb-8 flex items-center gap-3">
          <PackageOpen className="w-8 h-8 text-amber-400 drop-shadow-md hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-600 drop-shadow-sm">
             تسجيل طلب توصيل جديد
          </span>
      </h2>

      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          
          <CustomerInfo formData={formData} setFormData={setFormData} />

          <CarInfo formData={formData} setFormData={setFormData} />

          <OrderProducts formData={formData} setFormData={setFormData} sizes={sizes} />

          {/* 🆕 4. قسم الإدخال اليدوي الحر */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mt-6 shadow-xl">
             <label className="text-amber-400 font-bold mb-2 flex items-center gap-2">
                 <PenTool className="w-5 h-5" /> تفاصيل الطلب اليدوية (اختياري)
             </label>
             <p className="text-xs text-gray-400 mb-4">في حال عدم توفر السيارة أو المنتج في القوائم أعلاه، يمكنك كتابة تفاصيل الطلب بالكامل هنا.</p>
             <textarea
                 value={formData.manualDetails}
                 onChange={(e) => setFormData({...formData, manualDetails: e.target.value})}
                 placeholder="مثال: شاشة أندرويد لسيارة غير مدرجة بالقوائم مع كاميرا وكابلات خاصة..."
                 className="w-full p-4 rounded-xl bg-black/60 border border-white/10 text-white outline-none focus:border-amber-400 min-h-[100px] shadow-inner"
             />
          </div>

          {/* 5. قسم الخلاصة والحسابات */}
          <div className="bg-gradient-to-br from-teal-900/40 to-black/60 p-5 sm:p-6 rounded-[2rem] border border-teal-500/30 mt-6 max-w-md mr-auto shadow-xl">
              <label className="text-sm text-teal-300 mb-3 font-bold flex items-center gap-2">
                  <Banknote className="w-5 h-5" /> السعر الإجمالي للطلب (إجباري)
              </label>
              
              <div className="flex flex-row gap-2 sm:gap-3 w-full">
                  <select 
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-1/3 p-3 sm:p-4 rounded-xl bg-black/60 border border-teal-500/50 text-amber-400 font-bold outline-none focus:border-teal-400 cursor-pointer shadow-inner text-sm sm:text-base"
                  >
                      <option className="bg-gray-900 text-white" value="USD">$ دولار</option>
                      <option className="bg-gray-900 text-white" value="IQD">د.ع دينار</option>
                  </select>

                  <input 
                      type="number" 
                      value={formData.totalPrice} 
                      onChange={(e) => setFormData({...formData, totalPrice: e.target.value})} 
                      required
                      placeholder="المبلغ..."
                      className="w-2/3 p-3 sm:p-4 rounded-xl bg-black/60 border border-teal-500/50 text-white font-bold text-lg sm:text-xl outline-none focus:border-teal-400 text-center shadow-inner min-w-0"
                  />
              </div>
          </div>

          <div className="flex justify-end mt-8">
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black px-10 py-4 rounded-2xl font-extrabold transition-all active:scale-95 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  تسجيل الطلب الآن ✅
              </button>
          </div>
      </form>

    </div>
  );
}