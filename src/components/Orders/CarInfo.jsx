import React from 'react';
import { CarFront, Settings2, Calendar } from 'lucide-react';

export default function CarInfo({ formData, setFormData }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 mb-6 shadow-lg relative z-10">
        <h3 className="text-xl font-bold text-amber-400 mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
            <CarFront className="w-6 h-6" /> 2. معلومات سيارة الزبون
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">الشركة المصنعة</label>
                <div className="relative group">
                    <input 
                        type="text" name="carBrand" value={formData.carBrand || ''} onChange={handleChange} 
                        placeholder="مثال: تويوتا" required
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all"
                    />
                    <CarFront className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">الموديل (السيارة)</label>
                <div className="relative group">
                    <input 
                        type="text" name="carModel" value={formData.carModel || ''} onChange={handleChange} 
                        placeholder="مثال: كامري" required
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all"
                    />
                    <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">سنة الصنع</label>
                <div className="relative group">
                    <input 
                        type="text" inputMode="numeric" pattern="[0-9]*" name="carYear" value={formData.carYear || ''} onChange={handleChange} 
                        placeholder="مثال: 2023" required
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
    </div>
  );
}