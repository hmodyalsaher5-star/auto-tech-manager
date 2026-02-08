import { useState } from 'react';
import { supabase } from '../../supabase';

export default function SalesEntry({ session }) {
  const [formData, setFormData] = useState({ 
    car_type: '', 
    details: '',
    amount: '', 
    // نأخذ اسم الموظف من الجلسة الحالية
    salesperson_name: session?.user?.email || 'موظف مبيعات' 
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.car_type) return alert("الرجاء تعبئة البيانات الأساسية");
    
    setLoading(true);

    const { error } = await supabase.from('sales_operations').insert([{
        car_type: formData.car_type,
        details: formData.details,
        amount_total: Number(formData.amount),
        salesperson_name: formData.salesperson_name,
        status: 'pending' // يذهب للمحاسب
    }]);

    if (error) {
        alert("❌ حدث خطأ: " + error.message);
    } else {
        alert("✅ تم تسجيل الطلب وإرساله للمحاسب");
        setFormData({ ...formData, car_type: '', details: '', amount: '' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-gray-800 rounded-lg border border-gray-700 shadow-2xl animate-fadeIn">
      <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center border-b border-gray-600 pb-4">
        📝 تسجيل مبيعات جديد
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 dir-rtl text-right">
        
        {/* نوع السيارة */}
        <div>
            <label className="text-gray-300 font-bold mb-2 block">نوع السيارة / الموديل</label>
            <input 
                type="text" required value={formData.car_type} 
                onChange={e => setFormData({...formData, car_type: e.target.value})} 
                className="w-full p-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 outline-none transition" 
                placeholder="مثلاً: كيا سورينتو 2021" 
            />
        </div>

        {/* المبلغ الإجمالي */}
        <div>
            <label className="text-gray-300 font-bold mb-2 block">المبلغ الإجمالي (د.ع)</label>
            <input 
                type="number" required value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})} 
                className="w-full p-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 outline-none transition font-bold text-lg" 
                placeholder="0" 
            />
        </div>

        {/* التفاصيل */}
        <div>
            <label className="text-gray-300 font-bold mb-2 block">تفاصيل المنتجات والعمل</label>
            <textarea 
                required value={formData.details} 
                onChange={e => setFormData({...formData, details: e.target.value})} 
                className="w-full p-4 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-purple-500 outline-none transition" 
                rows="4" placeholder="مثلاً: شاشة أندرويد + كاميرا"
            ></textarea>
        </div>

        <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg shadow-lg transform active:scale-95 transition duration-200 text-lg">
            {loading ? 'جاري الحفظ...' : 'حفظ وإرسال للمحاسب ➡️'}
        </button>

      </form>
    </div>
  );
}