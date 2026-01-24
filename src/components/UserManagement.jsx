import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [loading, setLoading] = useState(false);

  // 🔄 دالة نجلب بها البيانات (نستخدمها للأزرار فقط)
  const refreshUsers = async () => {
    const { data, error } = await supabase.from('user_roles').select('*');
    if (!error) setUsers(data);
  };

  // 🚀 التحميل عند فتح الصفحة (نكتب الكود داخله مباشرة لتجنب الأخطاء)
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (!error) setUsers(data);
    };
    
    fetchInitialData();
  }, []);

  // --- إضافة مستخدم ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail) return;
    setLoading(true);

    const { error } = await supabase.from('user_roles').insert([
      { email: newUserEmail, role: newUserRole }
    ]);

    if (error) {
      alert("❌ خطأ: " + error.message);
    } else {
      alert("✅ تم إضافة صلاحية الموظف بنجاح");
      setNewUserEmail('');
      refreshUsers(); // تحديث القائمة
    }
    setLoading(false);
  };

  // --- حذف مستخدم ---
  const handleDeleteUser = async (id) => {
    if (!window.confirm("هل أنت متأكد من سحب الصلاحيات؟")) return;
    
    const { error } = await supabase.from('user_roles').delete().eq('id', id);
    if (!error) refreshUsers(); // تحديث القائمة
  };

  // --- تعديل دور مستخدم ---
  const handleUpdateRole = async (id, newRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', id);
    if (!error) {
        refreshUsers(); // تحديث القائمة
        alert("تم تعديل الصلاحية 👍");
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-600 shadow-xl mb-8">
      <h3 className="text-xl font-bold text-yellow-400 mb-4 border-b border-gray-600 pb-2">👥 إدارة صلاحيات الموظفين</h3>

      {/* نموذج الإضافة */}
      <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 mb-6 bg-gray-900 p-4 rounded">
        <input 
          type="email" 
          placeholder="إيميل الموظف (يجب أن يكون مسجلاً في Supabase)" 
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-600"
          required
        />
        <select 
          value={newUserRole} 
          onChange={(e) => setNewUserRole(e.target.value)}
          className="p-2 rounded bg-gray-700 text-white border border-gray-600"
        >
          <option value="viewer">Viewer (مشاهد فقط)</option>
          <option value="supervisor">Supervisor (مشرف)</option>
          <option value="admin">Admin (مدير)</option>
        </select>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold"
        >
          {loading ? 'جاري الإضافة...' : 'إضافة صلاحية ➕'}
        </button>
      </form>

      {/* جدول المستخدمين */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-gray-300">
          <thead className="text-gray-400 uppercase bg-gray-700 text-xs">
            <tr>
              <th className="px-4 py-3">البريد الإلكتروني</th>
              <th className="px-4 py-3">الصلاحية الحالية</th>
              <th className="px-4 py-3 text-right">تحكم</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="px-4 py-3 font-medium text-white">{user.email}</td>
                <td className="px-4 py-3">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    className={`bg-transparent border-b border-gray-500 text-sm focus:outline-none ${
                        user.role === 'admin' ? 'text-red-400' : 
                        user.role === 'supervisor' ? 'text-yellow-400' : 'text-blue-400'
                    }`}
                  >
                    <option value="viewer" className="bg-gray-800 text-blue-400">Viewer</option>
                    <option value="supervisor" className="bg-gray-800 text-yellow-400">Supervisor</option>
                    <option value="admin" className="bg-gray-800 text-red-400">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm bg-gray-900 px-3 py-1 rounded"
                  >
                    سحب الصلاحية 🗑️
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
                <tr>
                    <td colSpan="3" className="text-center py-4 text-gray-500">لا يوجد موظفين مضافين بعد.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}