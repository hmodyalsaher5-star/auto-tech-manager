import { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; 

import InventoryTable from './InventoryTable';
import LogsTable from './LogsTable';
import TransactionModal from './TransactionModal';
import MaintenanceModal from './MaintenanceModal';
import ProductHistoryModal from './ProductHistoryModal';
import CarFilter from './CarFilter';

export default function WarehouseManagement({ userRole }) {
  
  const isSupervisor = userRole === 'warehouse_supervisor';
  const isAdmin = userRole === 'admin'; 

  const [activeTab, setActiveTab] = useState('inventory'); 
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [sizes, setSizes] = useState([]); 
  const [logs, setLogs] = useState([]);

  // 🆕 ذواكر الفلتر الذكي بالأسماء الصحيحة لقاعدة بياناتك
  const [brandsList, setBrandsList] = useState([]);
  const [modelsList, setModelsList] = useState([]);
  const [generationsList, setGenerationsList] = useState([]);

  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterGeneration, setFilterGeneration] = useState('');

  // الفلاتر الأساسية
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [filterLogType, setFilterLogType] = useState('all');
  
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [transactionModal, setTransactionModal] = useState({ isOpen: false, item: null, type: 'IN' });
  const [maintenanceModal, setMaintenanceModal] = useState({ isOpen: false, item: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, item: null });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    let isMounted = true; 
    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'inventory') {
            const { data: frames } = await supabase.from('frames').select('*').order('id');
            const { data: screens } = await supabase.from('screens').select('*').order('id');
            const { data: sizesData } = await supabase.from('standard_sizes').select('*');
            
            // 🆕 جلب بيانات السيارات بالجداول الصحيحة
            const { data: brandsData } = await supabase.from('brands').select('*');
            const { data: modelsData } = await supabase.from('car_models').select('*');
            const { data: generationsData } = await supabase.from('car_generations').select('*');
            
            if (isMounted) {
                const allItems = [
                    ...(frames || []).map(f => ({ ...f, table: 'frames', type: 'frame', typeLabel: 'إطار 🖼️' })),
                    ...(screens || []).map(s => ({ ...s, table: 'screens', type: 'screen', typeLabel: 'شاشة 📺' }))
                ];
                setProducts(allItems);
                if (sizesData) setSizes(sizesData);
                
                if (brandsData) setBrandsList(brandsData);
                if (modelsData) setModelsList(modelsData);
                if (generationsData) setGenerationsList(generationsData);
            }
        } else {
            const { data } = await supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(500);
            if (isMounted && data) setLogs(data);
        }
        if (isMounted) setLoading(false);
    };
    fetchData();
    return () => { isMounted = false };
  }, [activeTab]); 

  const refreshData = async () => {
      setLoading(true);
      if (activeTab === 'inventory') {
          const { data: frames } = await supabase.from('frames').select('*').order('id');
          const { data: screens } = await supabase.from('screens').select('*').order('id');
          const allItems = [
            ...(frames || []).map(f => ({ ...f, table: 'frames', type: 'frame', typeLabel: 'إطار 🖼️' })),
            ...(screens || []).map(s => ({ ...s, table: 'screens', type: 'screen', typeLabel: 'شاشة 📺' }))
          ];
          setProducts(allItems);
      } else {
          const { data } = await supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(500);
          if (data) setLogs(data);
      }
      setLoading(false);
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("⚠️ هل أنت متأكد من حذف هذا السجل نهائياً؟")) return;
    const { error } = await supabase.from('stock_logs').delete().eq('id', logId);
    if (!error) setLogs(prev => prev.filter(log => log.id !== logId));
  };

  const handleUpdateLog = async (logId, updatedFields) => {
    const { error } = await supabase.from('stock_logs').update(updatedFields).eq('id', logId);
    if (!error) setLogs(prev => prev.map(log => log.id === logId ? { ...log, ...updatedFields } : log));
  };

  // 🧠 الفلترة المحدثة والذكية جداً
  const filteredProducts = products.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSize = filterSize === 'all' || item.size_id == filterSize;
      
      let matchesStatus = true;
      if (filterStatus === 'available') matchesStatus = item.stock_quantity > 0;
      if (filterStatus === 'has_damage') matchesStatus = item.damaged_quantity > 0;
      if (filterStatus === 'low') matchesStatus = item.stock_quantity <= 5 && item.stock_quantity > 0;
      if (filterStatus === 'out') matchesStatus = item.stock_quantity === 0;

      // 🔍 منطق مطابقة السيارة المحدث
      let matchesCar = true;
      if (filterGeneration) {
          matchesCar = item.generation_id == filterGeneration;
      } else if (filterModel) {
          const validGenIds = generationsList.filter(g => g.car_model_id == filterModel).map(g => g.id);
          matchesCar = validGenIds.includes(item.generation_id);
      } else if (filterBrand) {
          const validModelIds = modelsList.filter(m => m.brand_id == filterBrand).map(m => m.id);
          const validGenIds = generationsList.filter(g => validModelIds.includes(g.car_model_id)).map(g => g.id);
          matchesCar = validGenIds.includes(item.generation_id);
      }

      return matchesSearch && matchesType && matchesSize && matchesStatus && matchesCar;
  });

  const filteredLogs = logs.filter(log => {
      const matchesType = filterLogType === 'all' || log.movement_type === filterLogType;
      let matchesDate = true;
      if (filterDateFrom || filterDateTo) {
          const logDate = new Date(log.created_at);
          logDate.setHours(0, 0, 0, 0);
          if (filterDateFrom && logDate < new Date(filterDateFrom).setHours(0, 0, 0, 0)) matchesDate = false;
          if (filterDateTo && logDate > new Date(filterDateTo).setHours(23, 59, 59, 999)) matchesDate = false;
      }
      return matchesType && matchesDate;
  });

  const handleTransactionSubmit = async (data) => {
    const { item, type, quantity, reason, refNumber, notes } = data;
    const change = type === 'IN' ? parseInt(quantity) : -parseInt(quantity);
    const newStock = item.stock_quantity + change;
    if (newStock < 0) return alert("❌ لا يمكن أن يصبح الرصيد سالب!");
    
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from(item.table).update({ stock_quantity: newStock }).eq('id', item.id);
    await supabase.from('stock_logs').insert([{
        product_id: item.id, product_table: item.table, product_name: item.name,
        movement_type: type, quantity_change: change, current_stock: newStock,
        reason: reason, reference_number: refNumber, notes: notes, 
        employee_name: user?.email ? user.email.split('@')[0] : 'مجهول'
    }]);

    setProducts(prev => prev.map(p => p.id === item.id && p.table === item.table ? { ...p, stock_quantity: newStock } : p));
    setTransactionModal({ ...transactionModal, isOpen: false });
  };

  const handleMaintenanceSubmit = async (data) => {
    const { item, action, quantity, notes } = data;
    const qty = parseInt(quantity);
    let newStock = item.stock_quantity;
    let newDamaged = item.damaged_quantity || 0;
    let logType = 'OUT'; let logReason = '';

    if (action === 'TO_DAMAGED') { newStock -= qty; newDamaged += qty; logReason = 'damage_reported'; }
    else if (action === 'REPAIRED') { newDamaged -= qty; newStock += qty; logType = 'IN'; logReason = 'repaired_return'; }
    else if (action === 'SCRAP') { newDamaged -= qty; logReason = 'final_scrap'; }

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from(item.table).update({ stock_quantity: newStock, damaged_quantity: newDamaged }).eq('id', item.id);
    await supabase.from('stock_logs').insert([{
        product_id: item.id, product_table: item.table, product_name: item.name,
        movement_type: logType, quantity_change: (action === 'SCRAP' ? 0 : (logType === 'IN' ? qty : -qty)),
        current_stock: newStock, reason: logReason, notes: `[صيانة] ${notes}`, 
        employee_name: user?.email ? user.email.split('@')[0] : 'مجهول'
    }]);

    setProducts(prev => prev.map(p => p.id === item.id && p.table === item.table ? { ...p, stock_quantity: newStock, damaged_quantity: newDamaged } : p));
    setMaintenanceModal({ ...maintenanceModal, isOpen: false });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 dir-rtl font-sans text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-4 gap-4">
            <div><h1 className="text-2xl font-bold text-gray-100">🏭 إدارة المستودع</h1></div>
            <div className="flex bg-gray-800 p-1 rounded-lg">
                <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-md font-bold transition ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>📦 المخزون</button>
                <button onClick={() => setActiveTab('logs')} className={`px-6 py-2 rounded-md font-bold transition ${activeTab === 'logs' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>📜 السجل العام</button>
            </div>
        </div>

        <div className="animate-fadeIn">
            <div className="bg-gray-800 p-4 rounded-lg flex flex-col gap-4 shadow border border-gray-700 mb-6">
                
                {activeTab === 'inventory' ? (
                   <>
                      {/* 🆕 استدعاء مكون الفلتر الذكي الخاص بك وتمرير القوائم الصحيحة */}
                      <CarFilter 
                          brands={brandsList}
                          models={modelsList.filter(m => m.brand_id == filterBrand)}
                          generations={generationsList.filter(g => g.car_model_id == filterModel)}
                          filterBrand={filterBrand}
                          filterModel={filterModel}
                          filterGeneration={filterGeneration}
                          onBrandChange={(e) => { setFilterBrand(e.target.value); setFilterModel(''); setFilterGeneration(''); }}
                          onModelChange={(e) => { setFilterModel(e.target.value); setFilterGeneration(''); }}
                          onGenerationChange={(val) => setFilterGeneration(val)}
                      />

                      {/* زر إزالة فلتر السيارة */}
                      {(filterBrand) && (
                          <div className="flex justify-end -mt-8 relative z-20">
                             <button onClick={() => { setFilterBrand(''); setFilterModel(''); setFilterGeneration(''); }} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold border border-rose-500/30 bg-black/50 backdrop-blur-md">
                                 ✖ مسح فلتر السيارة
                             </button>
                          </div>
                      )}

                      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full mt-4">
                          <input type="text" placeholder="🔍 بحث عن منتج بالاسم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full lg:w-1/3 p-3 rounded bg-gray-700 border border-gray-600 text-white outline-none"/>
                          <div className="flex gap-2 flex-wrap items-center">
                              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white"><option value="all">كل الأنواع</option><option value="screen">شاشات</option><option value="frame">إطارات</option></select>
                              <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white"><option value="all">كل المقاسات</option>{sizes.map(s => <option key={s.id} value={s.id}>{s.size_name}</option>)}</select>
                              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white font-bold"><option value="all">📊 كل الحالات</option><option value="available" className="text-green-400">✅ المتوفر</option><option value="has_damage" className="text-red-400">🛠️ تالف/صيانة</option><option value="low" className="text-yellow-400">⚠️ النواقص</option><option value="out" className="text-gray-400">❌ المنتهية</option></select>
                          </div>
                      </div>
                   </>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-center w-full">
                        <div className="flex flex-wrap gap-3 w-full justify-end items-center">
                            <div className="flex flex-wrap items-center gap-2 bg-gray-700/50 p-2 rounded-lg border border-gray-600">
                                <span className="text-gray-300 text-xs font-bold">من:</span>
                                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="bg-gray-800 text-white p-1.5 rounded text-xs outline-none border border-gray-600 cursor-pointer" />
                                <span className="text-gray-300 text-xs font-bold mr-2">إلى:</span>
                                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="bg-gray-800 text-white p-1.5 rounded text-xs outline-none border border-gray-600 cursor-pointer" />
                                {(filterDateFrom || filterDateTo) && (
                                    <button onClick={() => {setFilterDateFrom(''); setFilterDateTo('');}} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-full transition-colors" title="إلغاء التواريخ">✖</button>
                                )}
                            </div>
                            <select value={filterLogType} onChange={(e) => setFilterLogType(e.target.value)} className="bg-gray-700 border border-gray-600 text-white p-2.5 rounded-lg text-sm font-bold">
                                <option value="all">📊 كل الحركات</option>
                                <option value="IN">📥 الوارد فقط</option>
                                <option value="OUT">📤 الصادر فقط</option>
                            </select>
                        </div>
                        <button onClick={refreshData} className="bg-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-500 font-bold transition-colors">🔄 تحديث</button>
                    </div>
                )}
            </div>

            {loading ? <p className="text-center text-gray-400 py-10">جاري التحميل...</p> : (
                activeTab === 'inventory' ? (
                    <InventoryTable 
                        products={filteredProducts} sizes={sizes} showActions={!isSupervisor}
                        onImageClick={(imageUrl) => setPreviewImage(imageUrl)}
                        onTransaction={(item, type) => setTransactionModal({ isOpen: true, item, type })}
                        onMaintenance={(item) => setMaintenanceModal({ isOpen: true, item })}
                        onHistory={(item) => setHistoryModal({ isOpen: true, item })}
                    />
                ) : (
                    <LogsTable 
                        logs={filteredLogs} products={products} isAdmin={isAdmin} 
                        onDeleteLog={handleDeleteLog} onUpdateLog={handleUpdateLog}
                        onImageClick={(imageUrl) => setPreviewImage(imageUrl)}
                    />
                )
            )}
        </div>

        {!isSupervisor && (
            <>
                <TransactionModal isOpen={transactionModal.isOpen} onClose={() => setTransactionModal({ ...transactionModal, isOpen: false })} item={transactionModal.item} type={transactionModal.type} onSubmit={handleTransactionSubmit} />
                <MaintenanceModal isOpen={maintenanceModal.isOpen} onClose={() => setMaintenanceModal({ ...maintenanceModal, isOpen: false })} item={maintenanceModal.item} onSubmit={handleMaintenanceSubmit} />
            </>
        )}
        <ProductHistoryModal isOpen={historyModal.isOpen} onClose={() => setHistoryModal({ ...historyModal, isOpen: false })} item={historyModal.item} />

        {previewImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-3xl max-h-[85vh] bg-white/10 backdrop-blur-2xl p-2 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
               <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 bg-black/70 text-white w-10 h-10 rounded-full hover:bg-rose-600 transition flex items-center justify-center font-bold text-lg shadow-lg">✕</button>
               <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}