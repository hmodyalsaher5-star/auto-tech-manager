import { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; 

import InventoryTable from './InventoryTable';
import LogsTable from './LogsTable';
import TransactionModal from './TransactionModal';
import MaintenanceModal from './MaintenanceModal';
import ProductHistoryModal from './ProductHistoryModal';

// 🆕 نستقبل userRole كـ prop
export default function WarehouseManagement({ userRole }) {
  
  // تحديد هل المستخدم "مشرف مخزن" فقط؟
  const isSupervisorOnly = userRole === 'warehouse_supervisor';

  // إذا كان مشرفاً، نبدأ بتبويب السجلات، وإلا نبدأ بالمخزون
  const [activeTab, setActiveTab] = useState(isSupervisorOnly ? 'logs' : 'inventory'); 
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [sizes, setSizes] = useState([]); 
  const [logs, setLogs] = useState([]);

  // الفلاتر
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSize, setFilterSize] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [filterLogType, setFilterLogType] = useState('all');

  // التحكم بالنوافذ
  const [transactionModal, setTransactionModal] = useState({ isOpen: false, item: null, type: 'IN' });
  const [maintenanceModal, setMaintenanceModal] = useState({ isOpen: false, item: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, item: null });

  // التحميل التلقائي
  useEffect(() => {
    let isMounted = true; 
    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'inventory') {
            // المشرف لا يحتاج تحميل المخزون لأنه ممنوع من رؤيته
            if (isSupervisorOnly) return; 

            const { data: frames } = await supabase.from('frames').select('*').order('id');
            const { data: screens } = await supabase.from('screens').select('*').order('id');
            const { data: sizesData } = await supabase.from('standard_sizes').select('*');
            
            if (isMounted) {
                const allItems = [
                    ...(frames || []).map(f => ({ ...f, table: 'frames', type: 'frame', typeLabel: 'إطار 🖼️' })),
                    ...(screens || []).map(s => ({ ...s, table: 'screens', type: 'screen', typeLabel: 'شاشة 📺' }))
                ];
                setProducts(allItems);
                if (sizesData) setSizes(sizesData);
            }
        } else {
            const { data } = await supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100);
            if (isMounted && data) setLogs(data);
        }
        if (isMounted) setLoading(false);
    };
    fetchData();
    return () => { isMounted = false };
  }, [activeTab, isSupervisorOnly]);

  // دالة التحديث
  const refreshData = async () => {
      setLoading(true);
      if (activeTab === 'inventory' && !isSupervisorOnly) {
          const { data: frames } = await supabase.from('frames').select('*').order('id');
          const { data: screens } = await supabase.from('screens').select('*').order('id');
          const allItems = [
            ...(frames || []).map(f => ({ ...f, table: 'frames', type: 'frame', typeLabel: 'إطار 🖼️' })),
            ...(screens || []).map(s => ({ ...s, table: 'screens', type: 'screen', typeLabel: 'شاشة 📺' }))
          ];
          setProducts(allItems);
      } else {
          const { data } = await supabase.from('stock_logs').select('*').order('created_at', { ascending: false }).limit(100);
          if (data) setLogs(data);
      }
      setLoading(false);
  };

  // الفلترة
  const filteredProducts = products.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSize = filterSize === 'all' || item.size_id == filterSize;
      
      let matchesStatus = true;
      if (filterStatus === 'available') matchesStatus = item.stock_quantity > 0;
      if (filterStatus === 'has_damage') matchesStatus = item.damaged_quantity > 0;
      if (filterStatus === 'low') matchesStatus = item.stock_quantity <= 5 && item.stock_quantity > 0;
      if (filterStatus === 'out') matchesStatus = item.stock_quantity === 0;

      return matchesSearch && matchesType && matchesSize && matchesStatus;
  });

  const filteredLogs = logs.filter(log => filterLogType === 'all' || log.movement_type === filterLogType);

  // دوال الحركات (لن تظهر للمشرف، ولكن نبقيها للكود)
  const handleTransactionSubmit = async (data) => {
    const { item, type, quantity, reason, refNumber, notes } = data;
    const qty = parseInt(quantity);
    const change = type === 'IN' ? qty : -qty;
    const newStock = item.stock_quantity + change;

    if (newStock < 0) return alert("❌ لا يمكن أن يصبح الرصيد سالب!");

    await supabase.from(item.table).update({ stock_quantity: newStock }).eq('id', item.id);
    await supabase.from('stock_logs').insert([{
        product_id: item.id, product_table: item.table, product_name: item.name,
        movement_type: type, quantity_change: change, current_stock: newStock,
        reason: reason, reference_number: refNumber, notes: notes, employee_name: 'Admin'
    }]);

    setProducts(prev => prev.map(p => p.id === item.id && p.table === item.table ? { ...p, stock_quantity: newStock } : p));
    setTransactionModal({ ...transactionModal, isOpen: false });
    alert("✅ تمت العملية");
  };

  const handleMaintenanceSubmit = async (data) => {
    const { item, action, quantity, notes } = data;
    const qty = parseInt(quantity);
    let newStock = item.stock_quantity;
    let newDamaged = item.damaged_quantity || 0;
    let logType = 'OUT';
    let logReason = '';

    if (action === 'TO_DAMAGED') {
        if (newStock < qty) return alert("العدد الصالح غير كافي!");
        newStock -= qty; newDamaged += qty; logReason = 'damage_reported';
    } else if (action === 'REPAIRED') {
        if (newDamaged < qty) return alert("لا يوجد عدد تالف كافي!");
        newDamaged -= qty; newStock += qty; logType = 'IN'; logReason = 'repaired_return';
    } else if (action === 'SCRAP') {
        if (newDamaged < qty) return alert("لا يوجد عدد تالف كافي!");
        newDamaged -= qty; logReason = 'final_scrap';
    }

    await supabase.from(item.table).update({ stock_quantity: newStock, damaged_quantity: newDamaged }).eq('id', item.id);
    await supabase.from('stock_logs').insert([{
        product_id: item.id, product_table: item.table, product_name: item.name,
        movement_type: logType, quantity_change: (action === 'SCRAP' ? 0 : (logType === 'IN' ? qty : -qty)),
        current_stock: newStock, reason: logReason, notes: `[صيانة] ${notes}`, employee_name: 'Admin'
    }]);

    setProducts(prev => prev.map(p => p.id === item.id && p.table === item.table ? { ...p, stock_quantity: newStock, damaged_quantity: newDamaged } : p));
    setMaintenanceModal({ ...maintenanceModal, isOpen: false });
    alert("✅ تم التحديث");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 dir-rtl font-sans text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* === Header === */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-4 gap-4">
            <div><h1 className="text-2xl font-bold text-gray-100">🏭 إدارة المستودع</h1></div>
            <div className="flex bg-gray-800 p-1 rounded-lg">
                
                {/* 🔒 إخفاء زر المخزون إذا كان المستخدم مشرف مخزن */}
                {!isSupervisorOnly && (
                    <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-md font-bold transition ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>📦 المخزون</button>
                )}
                
                <button onClick={() => setActiveTab('logs')} className={`px-6 py-2 rounded-md font-bold transition ${activeTab === 'logs' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>📜 السجل العام</button>
            </div>
        </div>

        {/* === Tab Content === */}
        <div className="animate-fadeIn">
            {/* 1. أدوات التحكم والفلاتر */}
            <div className="bg-gray-800 p-4 rounded-lg flex flex-col lg:flex-row gap-4 justify-between items-center shadow border border-gray-700 mb-6">
                {activeTab === 'inventory' ? (
                   <>
                      <input type="text" placeholder="🔍 بحث..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full lg:w-1/3 p-3 rounded bg-gray-700 border border-gray-600 text-white outline-none"/>
                      <div className="flex gap-2 flex-wrap">
                          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white"><option value="all">كل الأنواع</option><option value="screen">شاشات</option><option value="frame">إطارات</option></select>
                          <select value={filterSize} onChange={(e) => setFilterSize(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white"><option value="all">كل المقاسات</option>{sizes.map(s => <option key={s.id} value={s.id}>{s.size_name}</option>)}</select>
                          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 rounded bg-gray-700 border border-gray-600 text-white font-bold"><option value="all">📊 كل الحالات</option><option value="available" className="text-green-400">✅ المتوفر</option><option value="has_damage" className="text-red-400">🛠️ تالف/صيانة</option><option value="low" className="text-yellow-400">⚠️ النواقص</option><option value="out" className="text-gray-400">❌ المنتهية</option></select>
                      </div>
                   </>
                ) : (
                    <div className="flex gap-2 w-full justify-end">
                        <select value={filterLogType} onChange={(e) => setFilterLogType(e.target.value)} className="bg-gray-700 border border-gray-600 text-white p-2 rounded"><option value="all">📊 الكل</option><option value="IN">📥 الوارد فقط</option><option value="OUT">📤 الصادر فقط</option></select>
                    </div>
                )}
                <button onClick={refreshData} className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-500 font-bold">🔄 تحديث</button>
            </div>

            {/* 2. عرض الجداول */}
            {loading ? <p className="text-center text-gray-400">جاري التحميل...</p> : (
                activeTab === 'inventory' && !isSupervisorOnly ? (
                    <InventoryTable 
                        products={filteredProducts} 
                        sizes={sizes} 
                        onTransaction={(item, type) => setTransactionModal({ isOpen: true, item, type })}
                        onMaintenance={(item) => setMaintenanceModal({ isOpen: true, item })}
                        onHistory={(item) => setHistoryModal({ isOpen: true, item })}
                    />
                ) : (
                    <LogsTable logs={filteredLogs} />
                )
            )}
        </div>

        {/* === Modals === */}
        {/* لن نسمح بفتح نوافذ التعديل إذا كان المستخدم مشرفاً فقط */}
        {!isSupervisorOnly && (
            <>
                <TransactionModal 
                    isOpen={transactionModal.isOpen} 
                    onClose={() => setTransactionModal({ ...transactionModal, isOpen: false })} 
                    item={transactionModal.item} 
                    type={transactionModal.type} 
                    onSubmit={handleTransactionSubmit} 
                />
                <MaintenanceModal 
                    isOpen={maintenanceModal.isOpen} 
                    onClose={() => setMaintenanceModal({ ...maintenanceModal, isOpen: false })} 
                    item={maintenanceModal.item} 
                    onSubmit={handleMaintenanceSubmit} 
                />
            </>
        )}
        
        {/* نافذة السجل التاريخي متاحة للجميع */}
        <ProductHistoryModal 
            isOpen={historyModal.isOpen} 
            onClose={() => setHistoryModal({ ...historyModal, isOpen: false })} 
            item={historyModal.item} 
        />
        
      </div>
    </div>
  );
}