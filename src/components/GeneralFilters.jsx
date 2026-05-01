import React from 'react';
import { Search, Filter, Ruler, FolderOpen } from 'lucide-react';

export default function GeneralFilters({
  searchTerm, setSearchTerm,
  filterType, onTypeChange,
  filterSize, setFilterSize, sizes,
  filterAccessoryCategory, setFilterAccessoryCategory, accessoryCategories
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10 mt-6">
      
      {/* 1. البحث النصي */}
      <div className="relative group">
          <label className="text-xs md:text-sm text-orange-200/60 mb-1.5 block font-bold">البحث النصي العام</label>
          <div className="relative">
              <input 
                  type="text" placeholder="اكتب اسم المنتج..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
          </div>
      </div>

      {/* 2. تصفية حسب النوع */}
      <div className="relative group">
          <label className="text-xs md:text-sm text-orange-200/60 mb-1.5 block font-bold">تصفية حسب النوع</label>
          <div className="relative">
              <select value={filterType} onChange={onTypeChange}
                  className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer">
                  <option className="bg-gray-900" value="all">الكل (شاشات، إطارات، إكسسوارات)</option>
                  <option className="bg-gray-900" value="screens">شاشات فقط</option>
                  <option className="bg-gray-900" value="frames">إطارات فقط</option>
                  <option className="bg-gray-900" value="accessories">إكسسوارات فقط</option>
              </select>
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
          </div>
      </div>

      {/* 3. المقاس */}
      <div className="relative group">
          <label className="text-xs md:text-sm text-orange-200/60 mb-1.5 block font-bold">المقاس (للشاشات)</label>
          <div className="relative">
              <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)} disabled={filterType === 'accessories'} 
                  className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  <option className="bg-gray-900" value="all">كل المقاسات</option>
                  {sizes.map(size => (
                      <option className="bg-gray-900" key={size.id} value={size.id}>{size.size_name}</option>
                  ))}
              </select>
              <Ruler className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
          </div>
      </div>

      {/* 4. فئة الإكسسوار */}
      <div className="relative group">
          <label className={`text-xs md:text-sm mb-1.5 block font-bold ${filterType === 'accessories' ? 'text-amber-400' : 'text-orange-200/60'}`}>
              فئة الإكسسوار 
          </label>
          <div className="relative">
              <select value={filterAccessoryCategory} onChange={(e) => setFilterAccessoryCategory(e.target.value)} disabled={filterType !== 'accessories'} 
                  className="w-full p-3.5 pl-4 pr-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-orange-50 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                  <option className="bg-gray-900" value="all">كل الإكسسوارات</option>
                  {accessoryCategories.map(cat => (
                      <option className="bg-gray-900" key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
              </select>
              <FolderOpen className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50 pointer-events-none" />
          </div>
      </div>

    </div>
  );
}