import React from 'react';
import { User, Phone, MapPin, Map } from 'lucide-react';

export default function CustomerInfo({ formData, setFormData }) {
  
  // دالة بسيطة لتحديث البيانات عندما يكتب الموظف أي حرف
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // شرط خاص: إذا كان الحقل هو "رقم الهاتف"، تأكد أنه أرقام فقط ولا يتجاوز 11 رقم
    if ((name === 'phone1' || name === 'phone2') && value.length > 11) {
        return; // توقف، لا تقبل أرقاماً إضافية
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 mb-6 shadow-lg relative z-10">
        <h3 className="text-xl font-bold text-amber-400 mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
            <User className="w-6 h-6" /> 1. معلومات الزبون
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* اسم الزبون */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">اسم الزبون (إجباري)</label>
                <div className="relative">
                    <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all" />
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* رقم الهاتف الأول */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">رقم الهاتف (11 رقم - إجباري)</label>
                <div className="relative">
                    <input type="number" name="phone1" value={formData.phone1} onChange={handleChange} required placeholder="07..."
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all" />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* رقم الهاتف الثاني */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">رقم هاتف بديل (اختياري)</label>
                <div className="relative">
                    <input type="number" name="phone2" value={formData.phone2} onChange={handleChange} placeholder="07..."
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all" />
                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* المحافظة */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">المحافظة (إجباري)</label>
                <div className="relative">
                    <select name="governorate" value={formData.governorate} onChange={handleChange} required
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer">
                        <option value="" className="bg-gray-900">اختر المحافظة...</option>
                        <option value="بغداد" className="bg-gray-900">بغداد</option>
                        <option value="البصرة" className="bg-gray-900">البصرة</option>
                        <option value="أربيل" className="bg-gray-900">أربيل</option>
                        {/* يمكنك إضافة بقية المحافظات لاحقاً */}
                    </select>
                    <Map className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* المنطقة */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">المنطقة (إجباري)</label>
                <div className="relative">
                    <input type="text" name="region" value={formData.region} onChange={handleChange} required
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all" />
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* نقطة دالة */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">أقرب نقطة دالة (اختياري)</label>
                <div className="relative">
                    <input type="text" name="landmark" value={formData.landmark} onChange={handleChange}
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all" />
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>
    </div>
  );
}