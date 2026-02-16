import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function SalesEntry({ session }) {
  // الحصول على تاريخ اليوم بصيغة YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({ 
    car_type: '', 
    details: '',
    amount: '', 
    salesperson_name: session?.user?.email || 'موظف مبيعات' 
  });
  
  // ✅ حالة جديدة لتاريخ البيع (الافتراضي: اليوم)
  const [selectedDate, setSelectedDate] = useState(today);

  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  // دالة الجلب
  const fetchPendingSales = async () => {
    const { data } = await supabase
        .from('sales_operations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (data) setPendingSales(data);
  };

  useEffect(() => {
    let isMounted = true;
    const initFetch = async () => {
        const { data } = await supabase
            .from('sales_operations')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (isMounted && data) setPendingSales(data);
    };
    initFetch();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.car_type) return alert("الرجاء تعبئة البيانات الأساسية");
    
    setLoading(true);

    // ✅ تجهيز التاريخ المختار مع إضافة وقت افتراضي (مثلاً الظهر) لضمان عدم حدوث مشاكل في التوقيت
    const finalDate = new Date(selectedDate);
    finalDate.setHours(12, 0, 0, 0); // تثبيت الساعة 12 ظهراً

    const { error } = await supabase.from('sales_operations').insert([{
        car_type: formData.car_type,
        details: formData.details,
        amount_total: Number(formData.amount),
        salesperson_name: formData.salesperson_name,
        status: 'pending',
        created_at: finalDate.toISOString() // ✅ إرسال التاريخ المختار يدوياً
    }]);

    if (error) {
        alert("❌ حدث خطأ: " + error.message);
    } else {
        alert("✅ تم إرسال الطلب للمحاسب");
        // إعادة تعيين النموذج (مع الحفاظ على التاريخ المختار لتسهيل الإدخال المتكرر لنفس اليوم)
        setFormData({ ...formData, car_type: '', details: '', amount: '' });
        fetchPendingSales();
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
      if (!editingSale.amount_total || !editingSale.car_type) return alert("البيانات ناقصة");

      const { error } = await supabase
        .from('sales_operations')
        .update({
            car_type: editingSale.car_type,
            details: editingSale.details,
            amount_total: Number(editingSale.amount_total)
        })
        .eq('id', editingSale.id);

      if (error) alert("❌ فشل التعديل");
      else {
          alert("✅ تم تعديل الطلب بنجاح");
          setEditingSale(null);
          fetchPendingSales();
      }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 animate-fadeIn space-y-8">
      
      {/* نموذج الإضافة */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-2xl">
        <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center border-b border-gray-600 pb-4">
          📝 تسجيل مبيعات جديد
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right">
          
          {/* ✅ حقل اختيار التاريخ */}
          <div className="bg-blue-900/20 p-3 rounded border border-blue-800 mb-4">
              <label className="text-blue-300 font-bold mb-2 block text-sm">📅 تاريخ البيع (اتركه لليوم، أو غيره لتسجيل القديم)</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 font-bold"
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="text-gray-300 font-bold mb-1 block">نوع السيارة / الموديل</label>
                <input type="text" required value={formData.car_type} onChange={e => setFormData({...formData, car_type: e.target.value})} className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 outline-none" placeholder="مثلاً: كيا سورينتو" />
            </div>
            <div>
                <label className="text-gray-300 font-bold mb-1 block">المبلغ الإجمالي (د.ع)</label>
                <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 outline-none font-bold text-lg" placeholder="0" />
            </div>
          </div>
          <div>
              <label className="text-gray-300 font-bold mb-1 block">التفاصيل</label>
              <textarea required value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-purple-500 outline-none" rows="2" placeholder="تفاصيل العمل..."></textarea>
          </div>
          <button disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded shadow active:scale-95 transition">
              {loading ? 'جاري الحفظ...' : 'إرسال للمحاسب ➡️'}
          </button>
        </form>
      </div>

      {/* قائمة الطلبات المعلقة */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-2">
            <h3 className="text-xl font-bold text-yellow-400">⏳ طلبات بانتظار الدفع</h3>
            <button onClick={fetchPendingSales} className="text-xs bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 text-white">تحديث 🔄</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right text-gray-300 text-sm">
                <thead className="bg-gray-900 text-white">
                    <tr>
                        <th className="p-3">التاريخ</th> {/* عرضنا التاريخ هنا للتأكد */}
                        <th className="p-3">السيارة</th>
                        <th className="p-3">المبلغ</th>
                        <th className="p-3">التفاصيل</th>
                        <th className="p-3 text-center">تعديل</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingSales.map(sale => (
                        <tr key={sale.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="p-3 text-blue-300 font-mono text-xs">{new Date(sale.created_at).toLocaleDateString('en-CA')}</td>
                            <td className="p-3 font-bold text-white">{sale.car_type}</td>
                            <td className="p-3 text-green-400 font-bold dir-ltr">{Number(sale.amount_total).toLocaleString()}</td>
                            <td className="p-3">{sale.details}</td>
                            <td className="p-3 text-center">
                                <button 
                                    onClick={() => setEditingSale(sale)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs"
                                >
                                    ✏️ تعديل
                                </button>
                            </td>
                        </tr>
                    ))}
                    {pendingSales.length === 0 && <tr><td colSpan="5" className="p-4 text-center">لا توجد طلبات معلقة</td></tr>}
                </tbody>
            </table>
          </div>
      </div>

      {/* نافذة التعديل */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 dir-rtl">
            <div className="bg-gray-800 w-full max-w-md rounded-lg p-6 border border-gray-500 shadow-2xl animate-scaleIn">
                <h3 className="text-xl font-bold text-white mb-4">تعديل الطلب</h3>
                <div className="space-y-4 text-right">
                    <div>
                        <label className="text-gray-400 text-sm">نوع السيارة</label>
                        <input type="text" value={editingSale.car_type} onChange={e => setEditingSale({...editingSale, car_type: e.target.value})} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm">المبلغ الجديد</label>
                        <input type="number" value={editingSale.amount_total} onChange={e => setEditingSale({...editingSale, amount_total: e.target.value})} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 font-bold text-green-400" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm">التفاصيل</label>
                        <textarea value={editingSale.details} onChange={e => setEditingSale({...editingSale, details: e.target.value})} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" rows="3"></textarea>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setEditingSale(null)} className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">إلغاء</button>
                    <button onClick={handleUpdate} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-500">حفظ التعديلات ✅</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}