import { useState } from 'react'
import { supabase } from '../supabase'

// نستقبل خاصية onClose لإغلاق النافذة بدون ريفريش
function Login({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // الاتصال بـ Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("❌ بيانات الدخول غير صحيحة!");
      setLoading(false);
    } else {
      // ✅ نجاح! لا نحتاج لفعل شيء، App.jsx سيكتشف الدخول ويغلق النافذة تلقائياً
      // لكن يمكننا استدعاء onClose للاحتياط
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-600 w-full max-w-md relative">
        
        {/* زر إغلاق صغير في الزاوية */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">🔐 دخول المدير</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="كلمة المرور"
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 outline-none"
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
            onClick={onClose} // ✅ هنا التغيير: نغلق النافذة بدلاً من إعادة تحميل الصفحة
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