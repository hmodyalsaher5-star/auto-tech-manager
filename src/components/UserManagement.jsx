import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
    Users, UserPlus, Trash2, 
    ShieldAlert, UserCheck, ShoppingCart, Calculator, 
    Package, Box, Eye, Truck, ClipboardCheck, Loader2
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  // دالة جلب البيانات
  const fetchUsers = async () => {
    const { data, error } = await supabase.from('user_roles').select('*');
    if (!error) setUsers(data);
  };

useEffect(() => {
    // هذا السطر يخبر المحرر بتجاهل التحذير في السطر القادم فقط
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchUsers();
  }, []); // المصفوفة الفارغة تعني: نفذ هذا مرة واحدة فقط عند فتح الصفحة

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUserEmail,
      password: newUserPassword,
    });

    if (authError) {
      alert("فشل الحساب: " + authError.message);
    } else if (authData.user) {
      await supabase.from('user_roles').insert([{ 
            id: authData.user.id, 
            email: newUserEmail, 
            role: newUserRole 
      }]);
      alert("✅ تم إضافة الموظف!");
      setNewUserEmail(''); setNewUserPassword('');
      fetchUsers(); 
    }
    setLoading(false);
  };

  const handleUpdateRole = async (userId, newRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', userId);
    if (!error) fetchUsers();
  };

  // مصفوفة الصلاحيات لسهولة العرض
  const roleOptions = [
    { id: 'admin', name: 'مدير عام', color: 'text-rose-400' },
    { id: 'supervisor', name: 'مشرف عام', color: 'text-amber-400' },
    { id: 'sales', name: 'مبيعات (وتسجيل طلبات)', color: 'text-blue-400' },
    { id: 'preparer', name: 'مجهز طلبات', color: 'text-teal-400' },
    { id: 'delivery', name: 'مندوب توصيل', color: 'text-sky-400' },
    { id: 'accountant', name: 'محاسب', color: 'text-emerald-400' },
    { id: 'warehouse_supervisor', name: 'مشرف مخزن', color: 'text-orange-400' },
    { id: 'warehouse_worker', name: 'موظف مخزن', color: 'text-stone-400' },
    { id: 'viewer', name: 'زائر', color: 'text-gray-400' }
  ];

  return (
    <div className="p-2 md:p-6 animate-fadeIn text-right" dir="rtl">
      
      <h2 className="text-2xl md:text-3xl font-extrabold mb-8 flex items-center gap-3 text-indigo-400">
          <Users className="w-8 h-8" /> إدارة الموظفين
      </h2>

      {/* نموذج الإضافة */}
      <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 mb-10 shadow-2xl">
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs text-indigo-300 block mb-2 px-2">البريد الإلكتروني</label>
            <input type="email" required placeholder="mail@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full p-3 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="text-xs text-indigo-300 block mb-2 px-2">كلمة المرور</label>
            <input type="password" required placeholder="******" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full p-3 rounded-2xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500" />
          </div>

          <div>
            <label className="text-xs text-indigo-300 block mb-2 px-2">تحديد الدور</label>
            <select 
              value={newUserRole} 
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full p-3 rounded-2xl bg-black/40 border border-white/10 text-white outline-none cursor-pointer"
            >
              {roleOptions.map(opt => <option key={opt.id} value={opt.id} className="bg-gray-900">{opt.name}</option>)}
            </select>
          </div>

          <button disabled={loading} className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex justify-center items-center gap-2 shadow-lg">
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "إضافة موظف"}
          </button>
        </form>
      </div>

      {/* الجدول المحدث */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <table className="w-full text-right">
          <thead className="bg-black/40 border-b border-white/10 text-indigo-200">
            <tr>
              <th className="p-5">الموظف</th>
              <th className="p-5 text-center">تغيير الصلاحية</th>
              <th className="p-5 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-5 text-indigo-50 text-sm md:text-base">{user.email}</td>
                <td className="p-5 text-center">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className="p-2 rounded-xl bg-black/40 border border-white/10 text-xs font-bold text-indigo-300 outline-none cursor-pointer"
                  >
                    {roleOptions.map(opt => <option key={opt.id} value={opt.id} className="bg-gray-900">{opt.name}</option>)}
                  </select>
                </td>
                <td className="p-5 text-center">
                  <button onClick={async () => { if(window.confirm("حذف الموظف؟")) { await supabase.from('user_roles').delete().eq('id', user.id); fetchUsers(); } }} className="text-rose-400 p-2 hover:bg-rose-500/10 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}