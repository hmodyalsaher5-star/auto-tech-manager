import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
    Users, UserPlus, Shield, Mail, Key, Trash2, 
    ShieldAlert, UserCheck, ShoppingCart, Calculator, Package, Box, Eye, ChevronDown 
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  
  // للتحكم بالقوائم המخصصة
  const [openDropdown, setOpenDropdown] = useState(null);

  const fetchUsersManual = async () => {
    const { data, error } = await supabase.from('user_roles').select('*');
    if (error) console.error('Error fetching users:', error);
    else setUsers(data);
  };

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
        setNewUserRole('viewer');
        fetchUsersManual(); 
      }
    }
    setLoading(false);
  };

  const handleUpdateRole = async (userId, newRole) => {
    const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', userId);
    if (error) alert("فشل التعديل");
    else { fetchUsersManual(); }
  };

  const handleDeleteUser = async (userId) => {
    if(!window.confirm("هل أنت متأكد من حذف هذا الموظف نهائياً؟")) return;
    const { error } = await supabase.from('user_roles').delete().eq('id', userId);
    if (!error) { fetchUsersManual(); }
  };

  // قائمة الصلاحيات مع أيقوناتها وألوانها
  const roleOptions = [
    { id: 'admin', name: 'مدير عام', icon: <ShieldAlert className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'supervisor', name: 'مشرف عام', icon: <UserCheck className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'sales', name: 'مبيعات', icon: <ShoppingCart className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'accountant', name: 'محاسب', icon: <Calculator className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'warehouse_supervisor', name: 'مشرف مخزن', icon: <Package className="w-4 h-4" />, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'warehouse_worker', name: 'موظف مخزن', icon: <Box className="w-4 h-4" />, color: 'text-stone-400', bg: 'bg-stone-500/10' },
    { id: 'viewer', name: 'زائر', icon: <Eye className="w-4 h-4" />, color: 'text-teal-400', bg: 'bg-teal-500/10' }
  ];

  const getRoleDetails = (roleId) => {
      return roleOptions.find(r => r.id === roleId) || roleOptions[6];
  };

  return (
    <div className="p-2 md:p-6 animate-fadeIn relative text-right dir-rtl z-10">
      
      {/* طبقة شفافة لإغلاق القوائم عند النقر خارجها */}
      {openDropdown && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)}></div>}

      {/* 🎨 العنوان */}
      <h2 className="text-2xl md:text-3xl font-extrabold mb-8 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-400 drop-shadow-md hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-400 to-indigo-600 drop-shadow-sm">
             إدارة الموظفين والصلاحيات
          </span>
      </h2>

      {/* 🎨 صندوق إضافة موظف جديد */}
      <div className="relative z-20 bg-white/5 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] border border-indigo-500/20 mb-10 shadow-2xl overflow-visible">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>

        <h3 className="text-xl font-bold text-indigo-100 mb-6 flex items-center gap-2 relative z-10">
            <UserPlus className="w-5 h-5 text-indigo-400" /> تسجيل موظف جديد
        </h3>
        
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
          
          <div className="relative group">
              <input 
                  type="email" 
                  required 
                  placeholder="البريد الإلكتروني" 
                  value={newUserEmail} 
                  onChange={e => setNewUserEmail(e.target.value)} 
                  className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-indigo-50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all shadow-inner text-sm"
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50 group-focus-within:text-indigo-400 transition-colors" />
          </div>

          <div className="relative group">
              <input 
                  type="password" 
                  required 
                  placeholder="كلمة المرور" 
                  value={newUserPassword} 
                  onChange={e => setNewUserPassword(e.target.value)} 
                  className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-indigo-50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all shadow-inner text-sm"
              />
              <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50 group-focus-within:text-indigo-400 transition-colors" />
          </div>

          {/* قائمة الصلاحيات המخصصة عند الإضافة */}
          <div className={`relative ${openDropdown === 'newRole' ? 'z-50' : 'z-10'}`}>
              <div 
                  onClick={() => setOpenDropdown(openDropdown === 'newRole' ? null : 'newRole')}
                  className={`w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md text-indigo-50 border transition-all cursor-pointer flex items-center text-sm ${openDropdown === 'newRole' ? 'border-indigo-500/50 ring-1 ring-indigo-500/50' : 'border-white/10 hover:border-indigo-500/30'}`}
              >
                  <span className={`flex items-center gap-2 font-bold ${getRoleDetails(newUserRole).color}`}>
                      {getRoleDetails(newUserRole).icon} {getRoleDetails(newUserRole).name}
                  </span>
                  <Shield className={`absolute right-4 w-4 h-4 transition-colors ${openDropdown === 'newRole' ? 'text-indigo-400' : 'text-indigo-500/50'}`} />
                  <ChevronDown className={`absolute left-4 w-4 h-4 transition-transform ${openDropdown === 'newRole' ? 'rotate-180 text-indigo-400' : 'text-gray-500'}`} />
              </div>
              
              {openDropdown === 'newRole' && (
                  <div className="absolute top-full mt-2 w-full bg-[#110c1f]/95 backdrop-blur-3xl border border-indigo-500/30 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden">
                      {roleOptions.map((role) => (
                          <div 
                            key={`new-${role.id}`} 
                            onClick={() => { setNewUserRole(role.id); setOpenDropdown(null); }} 
                            className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-3 text-sm ${newUserRole === role.id ? 'bg-indigo-500/20 font-bold border-r-2 border-indigo-400' : 'hover:bg-white/10'} ${role.color}`}
                          >
                              {role.icon} {role.name}
                          </div>
                      ))}
                  </div>
              )}
          </div>

          <button 
            disabled={loading} 
            className="bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/50 text-white font-bold py-3.5 px-4 rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5"/> إضافة الموظف</>}
          </button>
        </form>
      </div>

      {/* 🎨 جدول الموظفين الزجاجي */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-black/40 border-b border-white/10 text-indigo-200/80 text-sm">
              <tr>
                  <th className="p-5 font-bold">البريد الإلكتروني</th>
                  <th className="p-5 font-bold">الصلاحية الحالية</th>
                  <th className="p-5 font-bold">تغيير الصلاحية</th>
                  <th className="p-5 font-bold text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => {
                const currentRole = getRoleDetails(user.role);
                const isDropdownOpen = openDropdown === `update-${user.id}`;
                
                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    
                    <td className="p-5 text-indigo-50 font-medium">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-full"><Users className="w-4 h-4 text-indigo-300" /></div>
                            {user.email}
                        </div>
                    </td>
                    
                    <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-white/5 shadow-sm ${currentRole.bg} ${currentRole.color}`}>
                            {currentRole.icon} {currentRole.name}
                        </span>
                    </td>
                    
                    <td className="p-5 relative">
                        {/* قائمة تغيير الصلاحية המخصصة في الجدول */}
                        <div className={`relative ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                            <div 
                                onClick={() => setOpenDropdown(isDropdownOpen ? null : `update-${user.id}`)}
                                className={`w-48 p-2 pl-2 pr-8 rounded-xl bg-black/30 backdrop-blur-md text-indigo-50 border transition-all cursor-pointer flex items-center text-xs ${isDropdownOpen ? 'border-indigo-500/50 ring-1 ring-indigo-500/50' : 'border-white/10 hover:border-indigo-500/30'}`}
                            >
                                <span className={`flex items-center gap-2 font-bold ${currentRole.color}`}>
                                    {currentRole.name}
                                </span>
                                <ChevronDown className={`absolute left-2 w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180 text-indigo-400' : 'text-gray-500'}`} />
                            </div>
                            
                            {isDropdownOpen && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-[#110c1f]/95 backdrop-blur-3xl border border-indigo-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 py-1 overflow-hidden">
                                    {roleOptions.map((role) => (
                                        <div 
                                            key={`update-${user.id}-${role.id}`} 
                                            onClick={() => { handleUpdateRole(user.id, role.id); setOpenDropdown(null); }} 
                                            className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 text-xs ${user.role === role.id ? 'bg-indigo-500/20 font-bold border-r-2 border-indigo-400' : 'hover:bg-white/10'} ${role.color}`}
                                        >
                                            {role.icon} {role.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>

                    <td className="p-5 text-center relative z-0">
                        <button 
                            onClick={() => handleDeleteUser(user.id)} 
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl transition-all active:scale-90 border border-rose-500/20 hover:border-rose-500/50 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            title="حذف الموظف"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {users.length === 0 && (
             <div className="p-10 text-center text-indigo-200/50 font-bold flex flex-col items-center gap-2">
                 <Shield className="w-10 h-10 opacity-50" />
                 لا يوجد موظفين مسجلين حالياً
             </div>
          )}
        </div>
      </div>
      
    </div>
  );
}