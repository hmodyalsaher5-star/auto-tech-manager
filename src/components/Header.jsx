import { CarFront } from 'lucide-react';

function Header() {
  return (
    <header className="bg-black/20 backdrop-blur-xl p-4 md:px-8 border-b border-white/5 flex justify-between items-center shadow-lg">
      
      {/* جهة اليمين: الشعار واسم النظام */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <CarFront className="w-6 h-6 text-amber-400" />
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-orange-400 to-amber-600 drop-shadow-sm tracking-wide">
          إلكترونيات السيارات
        </h1>
      </div>

      {/* جهة اليسار: شارة النظام */}
      <div className="hidden md:flex items-center gap-2 text-orange-200/70 text-sm font-bold bg-white/5 px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
        <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)] animate-pulse"></span>
        نظام الإدارة المركزي
      </div>
      
    </header>
  )
}

export default Header;