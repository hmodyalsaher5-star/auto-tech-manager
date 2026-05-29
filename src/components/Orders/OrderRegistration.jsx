import React, { useState } from 'react';
import CustomerInfo from './CustomerInfo';
import CarInfo from './CarInfo';
import OrderProducts from './OrderProducts'; 
import { PackageOpen, Banknote, RefreshCw, PackagePlus, FileText, UserCheck, ShieldAlert } from 'lucide-react'; 
import { supabase } from '../../supabase';

export default function OrderRegistration({ sizes }) {
  
  const [formData, setFormData] = useState({
    orderType: 'original', 
    originalTrackingNumber: '', 

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
    costPrice: '', // 🆕 إضافة حقل سعر التكلفة في الذاكرة
    salesEmployee: '', // 🆕 إضافة حقل موظف المبيعات في الذاكرة
    currency: 'IQD' // 🆕 التعديل الأول: جعل العملة الافتراضية هي الدينار العراقي
  });

  const needsCarInfo = formData.products.some(p => p.category === 'screen');

  const handleSubmit = async (e) => {
    e.preventDefault();

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
          cost_price: formData.costPrice || 0, // 🆕 التعديل الثالث: إرسال سعر التكلفة إلى عمود cost_price
          sales_employee: formData.salesEmployee, // 🆕 التعديل الثاني: إرسال اسم الموظف إلى عمود sales_employee
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
          
          {/* 1. قسم تحديد نوع الطلب */}
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

          {/* 🆕 التعديل الثاني: إضافة حقل موظف المبيعات الإجباري قبل بيانات الزبون لضمان تحديد هوية كاتب الطلب */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 mb-6 shadow-lg relative z-10">
              <label className="text-sm text-amber-400 mb-3 block font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" /> مسؤول الفاتورة / موظف المبيعات (إجباري)
              </label>
              <input 
                  type="text"
                  value={formData.salesEmployee}
                  onChange={(e) => setFormData({...formData, salesEmployee: e.target.value})}
                  required
                  placeholder="اكتب اسم موظف المبيعات الذي أنشأ هذا الطلب..."
                  className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm"
              />
          </div>

          <CustomerInfo formData={formData} setFormData={setFormData} />

          {needsCarInfo && (
              <CarInfo formData={formData} setFormData={setFormData} />
          )}

          <OrderProducts formData={formData} setFormData={setFormData} />

          {/* التعديل الثالث: إدراج وتوسيع الصندوق المالي ليشمل السعر الإجمالي وسعر التكلفة معاً بالدينار العراقي */}
          <div className="bg-gradient-to-br from-teal-900/40 to-black/60 p-5 sm:p-6 rounded-[2rem] border border-teal-500/30 mt-6 max-w-xl mr-auto shadow-xl">
              <label className="text-sm text-teal-300 mb-3 font-bold flex items-center gap-2">
                  <Banknote className="w-5 h-5" /> تفاصيل التسعير والعملة والربط المالي
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  {/* قائمة اختيار العملة - القيمة الافتراضية أصبحت IQD */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-gray-400 mr-1">العملة:</span>
                    <select 
                        value={formData.currency}
                        onChange={(e) => setFormData({...formData, currency: e.target.value})}
                        className="w-full p-3.5 rounded-xl bg-black/60 border border-teal-500/50 text-amber-400 font-bold outline-none focus:border-teal-400 cursor-pointer text-sm"
                    >
                        <option className="bg-gray-900 text-white" value="IQD">د.ع دينار</option>
                        <option className="bg-gray-900 text-white" value="USD">$ دولار</option>
                    </select>
                  </div>

                  {/* حقل سعر التكلفة الجديد (إجباري) */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-orange-300 font-bold mr-1">سعر التكلفة للشركة: *</span>
                    <input 
                        type="number" 
                        value={formData.costPrice} 
                        onChange={(e) => setFormData({...formData, costPrice: e.target.value})} 
                        required
                        placeholder="تكلفة المنتج"
                        className="w-full p-3.5 rounded-xl bg-black/60 border border-amber-500/40 text-orange-200 font-bold outline-none focus:border-orange-400 text-center text-sm"
                    />
                  </div>

                  {/* حقل السعر الإجمالي المطلوب من الزبون */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] text-teal-300 font-bold mr-1">السعر المطلوب من الزبون: *</span>
                    <input 
                        type="number" 
                        value={formData.totalPrice} 
                        onChange={(e) => setFormData({...formData, totalPrice: e.target.value})} 
                        required
                        placeholder="المبلغ المطلوب كاملاً"
                        className="w-full p-3.5 rounded-xl bg-black/60 border border-teal-500/50 text-white font-bold outline-none focus:border-teal-400 text-center text-sm"
                    />
                  </div>
              </div>

              {formData.orderType === 'replacement' && (
                  <p className="text-xs text-amber-400 mt-3 text-center">
                      ملاحظة: في طلبات الاستبدال عادة يكون المبلغ المطلوب 0 أو يمثل أجور التوصيل فقط.
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