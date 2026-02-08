import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  // دالة لجلب المستخدمين (تستخدم عند الإضافة أو الحذف)
  const fetchUsersManual = async () => {
    const { data, error } = await supabase.from('user_roles').select('*');
    if (error) console.error('Error fetching users:', error);
    else setUsers(data);
  };

  // التحميل الأولي
  useEffect(() => {
    let isMounted = true;
    const initFetch = async () => {
        const { data, error } = await supabase.from('user_roles').select('*');
        if (isMounted && !error) setUsers(data);
    };
    initFetch();
    return () => { isMounted = false; };
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUserEmail,
      password: newUserPassword,
    });

    if (authError) {
      alert("فشل إنشاء الحساب: " + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ 
            id: authData.user.id, 
            email: newUserEmail, 
            role: newUserRole 
        }]);

      if (roleError) {
        alert("فشل تحديد الصلاحية: " + roleError.message);
      } else {
        alert("✅ تم إضافة الموظف بنجاح!");
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsersManual(); // تحديث القائمة
      }
    }
    setLoading(false);
  };

  const handleUpdateRole = async (userId, newRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', userId);
    if (error) alert("فشل التعديل");
    else { alert("✅ تم التعديل"); fetchUsersManual(); }
  };

  const handleDeleteUser = async (userId) => {
    if(!window.confirm("هل أنت متأكد؟")) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', userId);
    if (!error) { alert("تم الحذف"); fetchUsersManual(); }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-right dir-rtl animate-fadeIn">
      <h2 className="text-2xl font-bold text-purple-400 mb-6 border-b border-gray-700 pb-2">👥 إدارة الموظفين</h2>
      
      <form onSubmit={handleAddUser} className="mb-8 bg-gray-900 p-4 rounded border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">إضافة موظف جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="email" required placeholder="البريد الإلكتروني" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="p-2 rounded bg-gray-800 border border-gray-600 text-white" />
          <input type="password" required placeholder="كلمة المرور" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="p-2 rounded bg-gray-800 border border-gray-600 text-white" />
          
          {/* ✅ قائمة اختيار الصلاحية عند الإضافة */}
          <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} className="p-2 rounded bg-gray-800 border border-gray-600 text-white font-bold">
            <option value="admin">🔴 مدير عام</option>
            <option value="supervisor">🟡 مشرف عام</option>
            <option value="sales">🛒 مبيعات</option>
            <option value="accountant">🧮 محاسب</option>
            <option value="warehouse_supervisor">📋 مشرف مخزن</option>
            <option value="warehouse_worker">📦 موظف مخزن</option>
            <option value="viewer">🟢 زائر</option>
          </select>

          <button disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">{loading ? "جاري..." : "إضافة +"}</button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-right bg-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-900 text-white">
            <tr><th className="p-3">البريد</th><th className="p-3">الصلاحية</th><th className="p-3">تغيير</th><th className="p-3">حذف</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-650">
                <td className="p-3 text-gray-200">{user.email}</td>
                <td className="p-3"><span className="px-2 py-1 rounded text-xs font-bold bg-blue-900 text-blue-200">{user.role}</span></td>
                <td className="p-3">
                   {/* ✅ قائمة تعديل الصلاحية في الجدول */}
                   <select value={user.role} onChange={(e) => handleUpdateRole(user.id, e.target.value)} className="bg-gray-800 border border-gray-600 text-white text-sm p-1 rounded">
                        <option value="admin">مدير</option>
                        <option value="supervisor">مشرف</option>
                        <option value="sales">مبيعات</option>
                        <option value="accountant">محاسب</option>
                        <option value="warehouse_supervisor">مشرف مخزن</option>
                        <option value="warehouse_worker">موظف مخزن</option>
                        <option value="viewer">زائر</option>
                   </select>
                </td>
                <td className="p-3"><button onClick={() => handleDeleteUser(user.id)} className="text-red-400 font-bold">&times;</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}