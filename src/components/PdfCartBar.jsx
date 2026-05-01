import React from 'react';
import { CheckCircle2 } from 'lucide-react';

// لاحظ هنا أننا نستقبل (selectedProducts) و (onGeneratePDF) كأدوات للعمل
export default function PdfCartBar({ selectedProducts, onGeneratePDF }) {
  
  // إذا لم يكن هناك منتجات محددة، لا تعرض شيئاً (المحاسب يختفي)
  if (!selectedProducts || selectedProducts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] bg-black/80 backdrop-blur-xl border border-emerald-500/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.3)] animate-fadeIn flex flex-wrap justify-center items-center gap-4 w-[90%] md:w-auto">
        <div className="text-emerald-400 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span>تم تحديد {selectedProducts.length} منتجات</span>
        </div>
        <button 
            className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-2.5 rounded-xl font-extrabold transition-all active:scale-95 flex items-center gap-2"
            onClick={onGeneratePDF} // 👈 هنا نستخدم الدالة التي سنمررها له
        >
            توليد الكتالوج (PDF) 📄
        </button>
    </div>
  );
}