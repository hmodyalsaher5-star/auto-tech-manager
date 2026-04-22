import { useState } from 'react'
import { supabase } from '../supabase'

function Login({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert("❌ بيانات الدخول غير صحيحة!");
      setLoading(false);
    } else {
      if (onClose) onClose();
    }
  };

  return (
    // 1. عزل كامل: خلفية سوداء شبه قاتمة مع تغبيش قوي جداً لإخفاء ما خلفها
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex justify-center items-center p-4 dir-rtl text-right animate-fadeIn">
      
      {/* 2. بطاقة صلبة (Solid): استخدمنا لون داكن جداً بدون شفافية لمنع التداخل */}
      <div className="bg-[#1a1a1a] p-8 md:p-10 rounded-[2rem] shadow-[0_0_50px_rgba(245,158,11,0.1)] border border-amber-500/20 w-full max-w-md relative overflow-hidden">
        
        {/* إضاءة داخلية ديكورية */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <button 
          onClick={onClose} 
          className="absolute top-6 left-6 text-gray-500 hover:text-rose-400 transition-colors font-black text-xl relative z-10"
          title="إغلاق"
        >
          ✕
        </button>

        <div className="text-center mb-8 relative z-10">
            <div className="text-5xl mb-3 drop-shadow-lg">🔐</div>
            <h2 className="text-2xl md:text-3xl font-black text-amber-400 drop-shadow-md">تسجيل الدخول</h2>
            <p className="text-gray-400 text-sm mt-2 font-bold">يرجى إدخال بيانات الاعتماد الخاصة بك</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          
          <div>
              <label className="text-amber-200/80 text-sm font-bold mb-2 block">البريد الإلكتروني</label>
              {/* حقول إدخال صلبة (bg-black) بدون شفافية */}
              <input
                type="email"
                dir="ltr"
                placeholder="admin@example.com"
                className="w-full p-4 rounded-xl bg-black text-white border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-inner text-left placeholder:text-gray-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
          </div>
          
          <div>
              <label className="text-amber-200/80 text-sm font-bold mb-2 block">كلمة المرور</label>
              <input
                type="password"
                dir="ltr"
                placeholder="••••••••"
                className="w-full p-4 rounded-xl bg-black text-white border border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-inner text-left placeholder:text-gray-600 tracking-widest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
          </div>

          <div className="pt-4">
              {/* زر ذهبي مشع وبارز */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                {loading ? "جارٍ التحقق... ⏳" : "تسجيل الدخول 🚪"}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="w-full text-gray-500 hover:text-white text-sm mt-5 font-bold transition-colors"
              >
                إلغاء والعودة كزائر
              </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default Login