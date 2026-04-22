import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function SalesEntry({ session }) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({ 
    car_type: '', 
    details: '',
    amount: '', 
    salesperson_name: session?.user?.email || 'موظف مبيعات' 
  });
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [pendingSales, setPendingSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

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

    const finalDate = new Date(selectedDate);
    finalDate.setHours(12, 0, 0, 0); 

    const { error } = await supabase.from('sales_operations').insert([{
        car_type: formData.car_type,
        details: formData.details,
        amount_total: Number(formData.amount),
        salesperson_name: formData.salesperson_name,
        status: 'pending',
        created_at: finalDate.toISOString() 
    }]);

    if (error) {
        alert("❌ حدث خطأ: " + error.message);
    } else {
        alert("✅ تم إرسال الطلب للمحاسب");
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
    <div className="max-w-5xl mx-auto mt-6 md:p-4 animate-fadeIn space-y-8 dir-rtl text-right relative z-10">
      
      {/* 🎨 قسم إدخال المبيعات (النموذج الزجاجي الفاخر) */}
      <div className="relative bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] pointer-events-none"></div>

        <h2 className="text-2xl md:text-3xl font-black text-purple-400 mb-8 border-b border-white/10 pb-4 flex items-center gap-3 relative z-10 drop-shadow-md">
          📝 تسجيل مبيعات جديد
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          {/* حقل التاريخ البارز */}
          <div className="bg-purple-900/10 p-4 rounded-2xl border border-purple-500/20 shadow-inner flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="text-purple-200/80 font-bold text-sm">📅 تاريخ البيع (لليوم الحالي أو تسجيل مبيعات سابقة):</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)} 
                className="w-full md:w-auto p-3 rounded-xl bg-black/40 text-orange-50 border border-white/10 focus:border-purple-500/50 outline-none font-bold transition-all shadow-inner"
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="text-orange-200/80 font-bold mb-2 block">نوع السيارة / المنتج</label>
                <input 
                  type="text" required 
                  value={formData.car_type} 
                  onChange={e => setFormData({...formData, car_type: e.target.value})} 
                  className="w-full p-4 rounded-xl bg-black/40 text-orange-50 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all shadow-inner text-lg" 
                  placeholder="مثال: كيا سورينتو 2023" 
                />
            </div>
            <div>
                <label className="text-orange-200/80 font-bold mb-2 block">المبلغ الإجمالي (د.ع)</label>
                <input 
                  type="number" required 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                  className="w-full p-4 rounded-xl bg-black/40 text-emerald-400 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all shadow-inner font-black text-2xl dir-ltr placeholder:text-gray-600" 
                  placeholder="0" 
                />
            </div>
          </div>

          <div>
              <label className="text-orange-200/80 font-bold mb-2 block">التفاصيل / الملاحظات</label>
              <textarea 
                required 
                value={formData.details} 
                onChange={e => setFormData({...formData, details: e.target.value})} 
                className="w-full p-4 rounded-xl bg-black/40 text-orange-50 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all shadow-inner" 
                rows="2" 
                placeholder="أدخل تفاصيل العمل، الشاشة، أو أي ملاحظات للمحاسب..."
              ></textarea>
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.15)] active:scale-95 transition-all text-lg flex justify-center items-center gap-2"
          >
              {loading ? '⏳ جاري الحفظ...' : 'إرسال للمحاسب ➡️'}
          </button>
        </form>
      </div>

      {/* 🎨 قائمة الطلبات المعلقة (سجل اليوم) */}
      <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-lg">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-orange-100/80 flex items-center gap-2">
               ⏳ طلبات بانتظار الدفع <span className="text-xs font-normal text-orange-200/50">(معلقة لدى المحاسب)</span>
            </h3>
            <button 
              onClick={fetchPendingSales} 
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 px-4 py-2 rounded-xl transition-all active:scale-95 font-bold"
            >
              تحديث 🔄
            </button>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-inner">
            <table className="w-full text-right text-sm">
                <thead className="bg-black/60 text-purple-300 border-b border-white/10 text-xs font-bold uppercase">
                    <tr>
                        <th className="p-4 border-l border-white/5">التاريخ</th>
                        <th className="p-4 border-l border-white/5">السيارة</th>
                        <th className="p-4 border-l border-white/5">المبلغ (د.ع)</th>
                        <th className="p-4 border-l border-white/5">التفاصيل</th>
                        <th className="p-4 text-center">إجراء</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-orange-50">
                    {pendingSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-teal-400/80 font-mono text-xs border-l border-white/5">{new Date(sale.created_at).toLocaleDateString('en-CA')}</td>
                            <td className="p-4 font-bold border-l border-white/5 drop-shadow-sm">{sale.car_type}</td>
                            <td className="p-4 text-emerald-400 font-bold dir-ltr border-l border-white/5">{Number(sale.amount_total).toLocaleString()}</td>
                            <td className="p-4 text-orange-200/70 text-xs border-l border-white/5">{sale.details}</td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => setEditingSale(sale)}
                                    className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                                >
                                    ✏️ تعديل
                                </button>
                            </td>
                        </tr>
                    ))}
                    {pendingSales.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-orange-200/50 font-bold">لا توجد طلبات معلقة حالياً</td></tr>}
                </tbody>
            </table>
          </div>
      </div>

      {/* 🎨 نافذة التعديل */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4 dir-rtl text-right">
            <div className="bg-white/5 backdrop-blur-xl w-full max-w-md rounded-[2rem] p-6 md:p-8 border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.6)] animate-scaleIn relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none"></div>
                <h3 className="text-xl md:text-2xl font-black text-purple-400 mb-6 border-b border-white/10 pb-4 relative z-10 drop-shadow-md">✏️ تعديل الطلب</h3>
                
                <div className="space-y-5 relative z-10">
                    <div>
                        <label className="text-orange-200/80 font-bold text-sm mb-1 block">نوع السيارة</label>
                        <input type="text" value={editingSale.car_type} onChange={e => setEditingSale({...editingSale, car_type: e.target.value})} className="w-full p-3 rounded-xl bg-black/40 text-orange-50 border border-white/10 focus:border-purple-500/50 outline-none shadow-inner transition-all" />
                    </div>
                    <div>
                        <label className="text-orange-200/80 font-bold text-sm mb-1 block">المبلغ الجديد</label>
                        <input type="number" value={editingSale.amount_total} onChange={e => setEditingSale({...editingSale, amount_total: e.target.value})} className="w-full p-3 rounded-xl bg-black/40 text-emerald-400 border border-white/10 focus:border-purple-500/50 outline-none font-bold text-xl dir-ltr shadow-inner transition-all" />
                    </div>
                    <div>
                        <label className="text-orange-200/80 font-bold text-sm mb-1 block">التفاصيل</label>
                        <textarea value={editingSale.details} onChange={e => setEditingSale({...editingSale, details: e.target.value})} className="w-full p-3 rounded-xl bg-black/40 text-orange-50 border border-white/10 focus:border-purple-500/50 outline-none shadow-inner transition-all" rows="3"></textarea>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-8 relative z-10">
                    <button onClick={handleUpdate} className="flex-1 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 font-bold rounded-2xl shadow-lg transition-all active:scale-95">حفظ التعديلات ✅</button>
                    <button onClick={() => setEditingSale(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 font-bold rounded-2xl transition-all active:scale-95">إلغاء ✖️</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}