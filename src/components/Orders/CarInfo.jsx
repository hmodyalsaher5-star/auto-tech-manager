import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // 👈 مسار الرجوع للخلف مهم جداً
import { CarFront, Settings2, Calendar } from 'lucide-react';

export default function CarInfo({ formData, setFormData }) {
  // ذواكر محلية للموظف ليحفظ بها القوائم التي يجلبها من المخزن (قاعدة البيانات)
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [generations, setGenerations] = useState([]);

  // 1. عندما يداوم الموظف (يفتح القسم)، يجلب قائمة الشركات فوراً
  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('brands').select('*');
      if (data) setBrands(data);
    };
    fetchBrands();
  }, []);

  // 2. عندما يختار الزبون شركة، يجلب الموظف الموديلات الخاصة بها
  useEffect(() => {
    if (!formData.carBrandId) return;
    const fetchModels = async () => {
      const { data } = await supabase.from('car_models').select('*').eq('brand_id', formData.carBrandId);
      setModels(data || []);
    };
    fetchModels();
  }, [formData.carBrandId]);

  // 3. عندما يختار الموديل، يجلب الأجيال (السنوات)
  useEffect(() => {
    if (!formData.carModelId) return;
    const fetchGenerations = async () => {
      const { data } = await supabase.from('car_generations').select('*').eq('car_model_id', formData.carModelId);
      setGenerations(data || []);
    };
    fetchGenerations();
  }, [formData.carModelId]);

  // دوال "ناقل الحركة" لتحديث الاستمارة المركزية وتفريغ القوائم السابقة
  const handleBrandChange = (e) => {
    setFormData(prev => ({ ...prev, carBrandId: e.target.value, carModelId: '', carGenerationId: '' }));
    setModels([]);
    setGenerations([]);
  };

  const handleModelChange = (e) => {
    setFormData(prev => ({ ...prev, carModelId: e.target.value, carGenerationId: '' }));
    setGenerations([]);
  };

  const handleGenerationChange = (e) => {
    setFormData(prev => ({ ...prev, carGenerationId: e.target.value }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 mb-6 shadow-lg relative z-10">
        <h3 className="text-xl font-bold text-amber-400 mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
            <CarFront className="w-6 h-6" /> 2. معلومات سيارة الزبون (إجباري)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. الشركة */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">الشركة المصنعة</label>
                <div className="relative group">
                    <select value={formData.carBrandId || ''} onChange={handleBrandChange} 
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer">
                        <option value="" className="bg-gray-900">اختر الشركة...</option>
                        {brands.map(b => <option key={b.id} value={b.id} className="bg-gray-900">{b.name}</option>)}
                    </select>
                    <CarFront className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* 2. الموديل */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">الموديل (السيارة)</label>
                <div className="relative group">
                    <select value={formData.carModelId || ''} onChange={handleModelChange}  disabled={!formData.carBrandId}
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <option value="" className="bg-gray-900">اختر الموديل...</option>
                        {models.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)}
                    </select>
                    <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* 3. الجيل / السنة */}
            <div>
                <label className="text-sm text-orange-200/80 mb-2 block font-bold">سنة الصنع / الجيل</label>
                <div className="relative group">
                    <select value={formData.carGenerationId || ''} onChange={handleGenerationChange}  disabled={!formData.carModelId}
                        className="w-full p-3.5 pl-4 pr-11 rounded-xl bg-black/40 border border-white/10 text-white focus:border-amber-500 outline-none transition-all appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                        <option value="" className="bg-gray-900">اختر السنة...</option>
                        {generations.map(g => (
                            <option key={g.id} value={g.id} className="bg-gray-900">
                                {g.start_year} - {g.end_year} {g.name ? `(${g.name})` : ''}
                            </option>
                        ))}
                    </select>
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
    </div>
  );
}