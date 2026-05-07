import React, { useState } from 'react';
import CustomerInfo from './CustomerInfo';
import CarInfo from './CarInfo';
import OrderProducts from './OrderProducts'; 
import { PackageOpen, Banknote, RefreshCw, PackagePlus, FileText } from 'lucide-react'; 
import { supabase } from '../../supabase';

export default function OrderRegistration({ sizes }) {
  
  const [formData, setFormData] = useState({
    // 🆕 متغيرات نوع الطلب والاستبدال
    orderType: 'original', // 'original' (أصلي) | 'replacement' (استبدال)
    originalTrackingNumber: '', // رقم الوصل القديم (للاستبدال فقط)

    customerName: '',
    phone1: '',
    phone2: '',
    governorate: '',
    region: '',
    landmark: '',
    carBrand: '',
    carModel: '',
    carYear: '',
    
    products: [
        { id: 1, category: 'screen', screenSize: '', frame: '', productName: '', quantity: '1' }
    ],
    
    manualDetails: '', 
    totalPrice: '', 
    currency: 'USD' 
  });

  const needsCarInfo = formData.products.some(p => p.category === 'screen');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🆕 تحقق بسيط: إذا كان استبدال، نفضل كتابة رقم الوصل القديم
    if (formData.orderType === 'replacement' && !formData.originalTrackingNumber.trim()) {
       const confirmEmpty = window.confirm("لم تقم بكتابة رقم الوصل الأصلي لهذا الاستبدال. هل تريد المتابعة بدون ربطه بالطلب القديم؟");
       if (!confirmEmpty) return;
    }
    
    const formattedProducts = formData.products.map((p, index) => {
        if (p.category === 'screen') {
            return `${index + 1}- [شاشة]: ${p.productName} | القياس: ${p.screenSize} | الإطار: ${p.frame || 'بدون'} | العدد: ${p.quantity}`;
        } else {
            return `${index + 1}- [منتج عام]: ${p.productName} | العدد: ${p.quantity}`;
        }
    }).join('\n'); 

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('orders')
      .insert([
        {
          // 🆕 نرسل نوع الطلب ورقم الوصل القديم لقاعدة البيانات
          order_type: formData.orderType,
          original_tracking_number: formData.orderType === 'replacement' ? formData.originalTrackingNumber : null,

          customer_name: formData.customerName,
          phone1: formData.phone1,
          phone2: formData.phone2,
          governorate: formData.governorate,
          region: formData.region,
          landmark: formData.landmark,
          
          car_brand: needsCarInfo ? formData.carBrand : null,
          car_model: needsCarInfo ? formData.carModel : null,
          car_year: needsCarInfo ? formData.carYear : null,
          
          product_type: formattedProducts, 
          screen_size: 'متعدد', 
          frame: 'متعدد',
          quantity: 'متعدد',
          
          manual_details: formData.manualDetails || null, 
          total_price: formData.totalPrice || 0, 
          currency: formData.currency, 
          user_email: user?.email || 'unknown',
          status: 'pending' 
        }
      ]);

    if (error) {
      alert("عذراً، فشل تسجيل الطلب.\nالخطأ: " + error.message);
    } else {
      alert(formData.orderType === 'replacement' ? "تم تسجيل طلب الاستبدال بنجاح! 🔄" : "تم تسجيل الطلب بنجاح! 🎉");
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
          
          {/* 🆕 1. قسم تحديد نوع الطلب (أصلي أم استبدال) */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 mb-6 shadow-lg relative z-10">
              <label className="text-sm text-teal-300 mb-4 block font-bold flex items-center gap-2">
                  <PackageOpen className="w-5 h-5" /> ما هو نوع هذه الطلبية؟
              </label>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${formData.orderType === 'original' ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'}`}>
                      <input 
                          type="radio" name="orderType" value="original"
                          checked={formData.orderType === 'original'}
                          onChange={(e) => setFormData({...formData, orderType: e.target.value})} 
                          className="w-5 h-5 accent-sky-500 cursor-pointer" 
                      />
                      <PackagePlus className="w-5 h-5" />
                      <span className="font-bold text-lg">طلب جديد (بيع أصلي)</span>
                  </label>
                  <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${formData.orderType === 'replacement' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'}`}>
                      <input 
                          type="radio" name="orderType" value="replacement"
                          checked={formData.orderType === 'replacement'}
                          onChange={(e) => setFormData({...formData, orderType: e.target.value})} 
                          className="w-5 h-5 accent-amber-500 cursor-pointer" 
                      />
                      <RefreshCw className="w-5 h-5" />
                      <span className="font-bold text-lg">طلب استبدال (ضمان/صيانة)</span>
                  </label>
              </div>

              {/* 🆕 يظهر حقل رقم الوصل الأصلي فقط إذا كان الطلب استبدال */}
              {formData.orderType === 'replacement' && (
                  <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/30 animate-fadeIn">
                      <label className="text-sm text-amber-300 mb-2 block font-bold flex items-center gap-2">
                          <FileText className="w-4 h-4" /> رقم وصل الطلب الأصلي المراد استبداله (للمطابقة)
                      </label>
                      <input 
                          type="text" 
                          value={formData.originalTrackingNumber}
                          onChange={(e) => setFormData({...formData, originalTrackingNumber: e.target.value})}
                          placeholder="اكتب رقم وصل الشحنة القديمة هنا..."
                          className="w-full p-3.5 rounded-xl bg-black/60 border border-amber-500/50 text-white focus:border-amber-400 outline-none font-mono"
                          dir="ltr"
                      />
                  </div>
              )}
          </div>

          <CustomerInfo formData={formData} setFormData={setFormData} />

          {needsCarInfo && (
              <CarInfo formData={formData} setFormData={setFormData} />
          )}

          <OrderProducts formData={formData} setFormData={setFormData} />

          <div className="bg-gradient-to-br from-teal-900/40 to-black/60 p-5 sm:p-6 rounded-[2rem] border border-teal-500/30 mt-6 max-w-md mr-auto shadow-xl">
              <label className="text-sm text-teal-300 mb-3 font-bold flex items-center gap-2">
                  <Banknote className="w-5 h-5" /> السعر الإجمالي المطلوب من الزبون (إجباري)
              </label>
              <div className="flex flex-row gap-2 sm:gap-3 w-full">
                  <select 
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-1/3 p-3 sm:p-4 rounded-xl bg-black/60 border border-teal-500/50 text-amber-400 font-bold outline-none focus:border-teal-400 cursor-pointer"
                  >
                      <option className="bg-gray-900 text-white" value="USD">$ دولار</option>
                      <option className="bg-gray-900 text-white" value="IQD">د.ع دينار</option>
                  </select>
                  <input 
                      type="number" 
                      value={formData.totalPrice} 
                      onChange={(e) => setFormData({...formData, totalPrice: e.target.value})} 
                      required
                      placeholder="المبلغ (ضع 0 إذا كان مجاني)"
                      className="w-2/3 p-3 sm:p-4 rounded-xl bg-black/60 border border-teal-500/50 text-white font-bold text-lg sm:text-xl outline-none focus:border-teal-400 text-center"
                  />
              </div>
              {formData.orderType === 'replacement' && (
                  <p className="text-xs text-amber-400 mt-3 text-center">
                      ملاحظة: في طلبات الاستبدال عادة يكون المبلغ 0 أو يمثل أجور التوصيل فقط.
                  </p>
              )}
          </div>

          <div className="flex justify-end mt-8">
              <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-black px-10 py-4 rounded-2xl font-extrabold transition-all active:scale-95 text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {formData.orderType === 'replacement' ? 'تسجيل طلب الاستبدال 🔄' : 'تسجيل الطلب الآن ✅'}
              </button>
          </div>
      </form>
    </div>
  );
}