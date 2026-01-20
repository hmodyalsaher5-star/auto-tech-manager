import { useState } from 'react'
import { supabase } from '../supabase'

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // الاتصال بـ Supabase للتحقق من البيانات
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("❌ بيانات الدخول غير صحيحة!");
    } else {
      // لا نحتاج لرسالة نجاح، الصفحة ستتحدث تلقائياً لأن App.jsx يراقب حالة الدخول
      window.location.reload(); 
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-600 w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">🔐 دخول المدير</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="كلمة المرور"
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors"
          >
            {loading ? "جارٍ التحقق..." : "دخول"}
          </button>
          
          <button
            type="button"
            onClick={() => window.location.reload()} // زر لإلغاء الدخول
            className="w-full text-gray-400 hover:text-white text-sm mt-2"
          >
            إلغاء والعودة كزائر
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login