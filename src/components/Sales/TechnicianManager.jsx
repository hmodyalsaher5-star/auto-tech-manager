import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function TechnicianManager() {
  const [technicians, setTechnicians] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ 1. جلب البيانات عند فتح الصفحة (داخل useEffect لمنع الأخطاء)
  useEffect(() => {
    let isMounted = true; // متغير لضمان عدم تحديث الذاكرة بعد إغلاق الصفحة

    const getTechnicians = async () => {
      try {
        const { data, error } = await supabase
          .from('technicians')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) console.error(error);
        if (isMounted && data) setTechnicians(data);
      } catch (err) {
        console.error(err);
      }
    };

    getTechnicians();

    return () => { isMounted = false; }; // تنظيف عند الخروج
  }, []);

  // ✅ 2. دالة تحديث يدوية (تستدعى بعد الإضافة والحذف فقط)
  const refreshList = async () => {
    const { data } = await supabase
      .from('technicians')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setTechnicians(data);
  };

  // إضافة فني جديد
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);

    const { error } = await supabase.from('technicians').insert([{ name: newName }]);

    if (error) {
        alert("خطأ: " + error.message);
    } else {
        setNewName(''); // مسح الحقل
        refreshList(); // تحديث القائمة
    }
    setLoading(false);
  };

  // حذف فني
  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الفني؟")) return;
    
    const { error } = await supabase.from('technicians').delete().eq('id', id);
    
    if (error) {
      alert("خطأ في الحذف: " + error.message);
    } else {
      refreshList(); // تحديث القائمة
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg border border-gray-700 animate-fadeIn dir-rtl text-right mt-8">
      <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">🛠️ إدارة قائمة الفنيين</h2>

      {/* نموذج الإضافة */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-8">
        <input 
            type="text" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اكتب اسم الفني هنا (مثلاً: علي حسين)"
            className="flex-grow p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-green-500 outline-none placeholder-gray-400"
        />
        <button 
            disabled={loading} 
            className="bg-green-600 hover:bg-green-700 text-white px-6 rounded font-bold transition transform active:scale-95"
        >
            {loading ? 'جاري...' : 'إضافة +'}
        </button>
      </form>

      {/* قائمة الأسماء */}
      <div className="space-y-3">
        {technicians.map((tech) => (
            <div key={tech.id} className="flex justify-between items-center bg-gray-900 p-4 rounded border border-gray-700 hover:border-gray-500 transition shadow-sm">
                <span className="text-lg text-white font-bold flex items-center gap-2">
                  👤 {tech.name}
                </span>
                <button 
                    onClick={() => handleDelete(tech.id)}
                    className="text-red-400 hover:text-red-200 text-sm font-bold bg-gray-800 px-3 py-1 rounded border border-red-900/50 hover:bg-red-900/20 transition"
                >
                    حذف 🗑️
                </button>
            </div>
        ))}
        
        {technicians.length === 0 && (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded">
                لا يوجد فنيين مسجلين، أضف واحداً الآن.
            </div>
        )}
      </div>
    </div>
  );
}