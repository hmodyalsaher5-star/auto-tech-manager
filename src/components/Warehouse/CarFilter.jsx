import React from 'react';
import { CarFront, Settings2, Calendar } from 'lucide-react';

export default function CarFilter({ 
    brands, models, generations, 
    filterBrand, filterModel, filterGeneration, 
    onBrandChange, onModelChange, onGenerationChange 
}) {
  return (
    <div className="mb-6 pb-6 border-b border-white/10">
        <h3 className="text-sm font-bold text-teal-400 mb-3 flex items-center gap-2">
            <CarFront className="w-4 h-4" /> البحث الدقيق حسب السيارة (الفلتر الذكي)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
            
            {/* 1. قائمة الشركات */}
            <div className="relative group">
                <select value={filterBrand} onChange={onBrandChange}
                    className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-teal-500/50 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer">
                    <option className="bg-gray-900" value="">1. اختر الشركة...</option>
                    {brands.map(b => <option className="bg-gray-900" key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <CarFront className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none transition-colors" />
            </div>

            {/* 2. قائمة الموديلات */}
            <div className="relative group">
                <select value={filterModel} onChange={onModelChange} disabled={!filterBrand}
                    className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-teal-500/50 outline-none transition-all shadow-inner text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    <option className="bg-gray-900" value="">2. اختر الموديل...</option>
                    {models.map(m => <option className="bg-gray-900" key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none transition-colors" />
            </div>

            {/* 3. قائمة السنوات/الأجيال */}
            <div className="relative group">
                <select value={filterGeneration} onChange={(e) => onGenerationChange(e.target.value)} disabled={!filterModel}
                    className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-teal-500/50 outline-none transition-all shadow-inner text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                    <option className="bg-gray-900" value="">3. اختر الجيل/السنة...</option>
                    {generations.map(g => (
                        <option className="bg-gray-900" key={g.id} value={g.id}>
                            {g.start_year} - {g.end_year} {g.name ? `(${g.name})` : ''}
                        </option>
                    ))}
                </select>
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none transition-colors" />
            </div>

        </div>
    </div>
  );
}