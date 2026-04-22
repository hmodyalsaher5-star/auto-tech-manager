import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function AdminReview() {
  const [salesToReview, setSalesToReview] = useState([]); 
  const [technicians, setTechnicians] = useState([]); 
  const [section1Data, setSection1Data] = useState([]); 
  const [section2Data, setSection2Data] = useState([]); 
  const [loading, setLoading] = useState(false); 
  
  const [tempAssignments, setTempAssignments] = useState({});
  const [selectedForTransfer, setSelectedForTransfer] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [currentSaleId, setCurrentSaleId] = useState(null);
  const [modalTechId, setModalTechId] = useState('');

  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [extraTarget, setExtraTarget] = useState(null); 
  const [extraAmount, setExtraAmount] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSaleData, setEditingSaleData] = useState(null);

  // حالة فلتر التاريخ (الافتراضي: تاريخ اليوم)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // دالة مساعدة لقص التاريخ بشكل آمن ومنع مشاكل التوقيت
  const safeDate = (dateString) => {
      if (!dateString) return '';
      return dateString.substring(0, 10); // تأخذ YYYY-MM-DD فقط
  };

  // جلب البيانات
  useEffect(() => {
    let isMounted = true; 
    const fetchData = async () => {
      if (isMounted) setLoading(true);
      try {
        const { data: sales } = await supabase.from('sales_operations').select('*').eq('status', 'confirmed').order('created_at', { ascending: false });
        if (isMounted && sales) setSalesToReview(sales);

        const { data: techs } = await supabase.from('technicians').select('*').order('created_at', { ascending: true }); 
        if (isMounted && techs) setTechnicians(techs);

        const { data: incentives } = await supabase
            .from('technician_incentives')
            .select(`*, sales_operations (car_type, details, amount_total, created_at)`)
            .eq('is_paid', false)
            .order('created_at', { ascending: false });

        if (isMounted && incentives) {
            setSection1Data(incentives.filter(item => item.is_standard));
            setSection2Data(incentives.filter(item => Number(item.additional_amount) > 0));
        }
      } catch (error) { console.error("Error:", error); } 
      finally { if (isMounted) setLoading(false); }
    };
    fetchData();
    return () => { isMounted = false; }; 
  }, []); 

  const refreshData = async () => {
    const { data: sales } = await supabase.from('sales_operations').select('*').eq('status', 'confirmed').order('created_at', { ascending: false });
    if (sales) setSalesToReview(sales);
    const { data: incentives } = await supabase.from('technician_incentives').select(`*, sales_operations (car_type, details, amount_total, created_at)`).eq('is_paid', false).order('created_at', { ascending: false });
    if (incentives) {
        setSection1Data(incentives.filter(item => item.is_standard));
        setSection2Data(incentives.filter(item => Number(item.additional_amount) > 0));
    }
  };

  // الفلترة الآمنة لجميع الأقسام بناءً على تاريخ "عملية البيع الأصلية"
  const filteredSalesToReview = salesToReview.filter(sale => !filterDate || safeDate(sale.created_at) === filterDate);
  
  const filteredSection1Data = section1Data.filter(item => {
      if (!filterDate) return true;
      const parentDate = item.sales_operations?.created_at || item.created_at; 
      return safeDate(parentDate) === filterDate;
  });

  const filteredSection2Data = section2Data.filter(item => {
      if (!filterDate) return true;
      const parentDate = item.sales_operations?.created_at || item.created_at; 
      return safeDate(parentDate) === filterDate;
  });

  const otherDatesCount = salesToReview.length - filteredSalesToReview.length;

  const openEditModal = (sale) => { setEditingSaleData({ ...sale }); setIsEditModalOpen(true); };

  const handleSaveEdit = async () => {
      if (!editingSaleData.car_type || !editingSaleData.amount_total) return alert("الرجاء التأكد من البيانات");
      const { error } = await supabase.from('sales_operations').update({
          car_type: editingSaleData.car_type, details: editingSaleData.details, amount_total: Number(editingSaleData.amount_total)
      }).eq('id', editingSaleData.id);
      if (error) alert("❌ حدث خطأ: " + error.message);
      else { alert("✅ تم التعديل"); setIsEditModalOpen(false); refreshData(); }
  };

  const handleDeleteSale = async (saleId) => {
      if (!window.confirm("حذف نهائي؟")) return;
      const { error } = await supabase.from('sales_operations').delete().eq('id', saleId);
      if (error) alert("❌ خطأ: " + error.message);
      else { alert("🗑️ تم الحذف"); setSalesToReview(prev => prev.filter(s => s.id !== saleId)); }
  };

  const handleDeleteIncentive = async (ids, saleId) => {
    if (!window.confirm("حذف وإعادة للقائمة العلوية؟")) return;
    const { error: deleteError } = await supabase.from('technician_incentives').delete().in('id', ids);
    if (deleteError) return alert("❌ خطأ: " + deleteError.message);
    const { error: updateError } = await supabase.from('sales_operations').update({ status: 'confirmed' }).eq('id', saleId);
    if (updateError) alert("⚠️ فشل تحديث الحالة"); else { alert("✅ تم الإرجاع بنجاح"); refreshData(); }
  };

  const openExtraModal = (item) => { setExtraTarget(item); setExtraAmount(''); setIsExtraModalOpen(true); };
  
  const submitExtraFromSection1 = async () => {
    if (!extraAmount || Number(extraAmount) <= 0) return alert("مبلغ غير صحيح");
    const targetId = extraTarget.ids[0]; 
    const newTotal = 5000 + Number(extraAmount);
    const { error } = await supabase.from('technician_incentives').update({ additional_amount: Number(extraAmount), amount: newTotal }).eq('id', targetId);
    if (error) alert("خطأ: " + error.message); else { alert("✅ تم الحفظ"); setIsExtraModalOpen(false); refreshData(); }
  };

  const openTechModal = (saleId) => {
    setCurrentSaleId(saleId); setModalTechId(''); setIsModalOpen(true);
    if (!tempAssignments[saleId]) {
        setTempAssignments(prev => ({ ...prev, [saleId]: { techs: [], notes: '', is_standard: true, standard_amount: 2000, additional_amount: 0 } }));
    }
  };

  const addTechToRow = () => {
    if (!modalTechId) return;
    const techObj = technicians.find(t => t.id === modalTechId);
    setTempAssignments(prev => {
        const current = prev[currentSaleId];
        if (current.techs.find(t => t.id === modalTechId)) return prev;
        return { ...prev, [currentSaleId]: { ...current, techs: [...current.techs, { id: techObj.id, name: techObj.name }] } };
    });
    setModalTechId('');
  };

  const removeTechFromRow = (saleId, techId) => {
      setTempAssignments(prev => ({ ...prev, [saleId]: { ...prev[saleId], techs: prev[saleId].techs.filter(t => t.id !== techId) } }));
  };

  const updateAssignmentField = (saleId, field, value) => {
    setTempAssignments(prev => {
        const current = prev[saleId] || { techs: [], notes: '', is_standard: true, standard_amount: 2000, additional_amount: 0 };
        return { ...prev, [saleId]: { ...current, [field]: value } };
    });
  };
  
  const handleCheckboxChange = (saleId) => {
    if (selectedForTransfer.includes(saleId)) setSelectedForTransfer(prev => prev.filter(id => id !== saleId));
    else setSelectedForTransfer(prev => [...prev, saleId]);
  };
  
  const handleBulkTransfer = async () => {
    if (selectedForTransfer.length === 0) return;
    if (!window.confirm(`ترحيل ${selectedForTransfer.length} عمليات؟`)) return;

    const incentivesPayload = []; 
    const salesToUpdate = [];

    selectedForTransfer.forEach(saleId => {
        const assignment = tempAssignments[saleId];
        const originalSale = salesToReview.find(s => s.id === saleId);

        if (assignment && assignment.techs.length > 0 && originalSale) {
            const standardVal = assignment.is_standard ? 5000 : 0; 
            const additionalVal = Number(assignment.additional_amount) || 0;
            const totalForCar = standardVal + additionalVal;
            if (totalForCar === 0) return;

            const combinedTechNames = assignment.techs.map(t => t.name).join(' & ');
            const primaryTechId = assignment.techs[0].id;

            incentivesPayload.push({
                sale_id: saleId, technician_id: primaryTechId, technician_name: combinedTechNames,
                is_standard: assignment.is_standard, additional_amount: additionalVal,
                amount: totalForCar, notes: assignment.notes, created_at: originalSale.created_at 
            });
            salesToUpdate.push(saleId);
        }
    });

    if (incentivesPayload.length === 0) return alert("❌ تأكد من البيانات (هل أضفت فنيين للمبيعات المحددة؟)");
    const { error: insertError } = await supabase.from('technician_incentives').insert(incentivesPayload);
    if (insertError) return alert("خطأ: " + insertError.message);
    await supabase.from('sales_operations').update({ status: 'reviewed' }).in('id', salesToUpdate);
    alert("✅ تم الترحيل بنجاح"); 
    setTempAssignments({}); setSelectedForTransfer([]); refreshData(); 
  };

  const groupIncentives = (items) => {
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.sale_id]) {
            acc[item.sale_id] = { ...item, tech_names: [item.technician_name], ids: [item.id] };
        } else {
            acc[item.sale_id].tech_names.push(item.technician_name);
            acc[item.sale_id].ids.push(item.id);
        }
        return acc;
    }, {});
    return Object.values(grouped);
  };

  const groupedSection1 = groupIncentives(filteredSection1Data);
  const groupedSection2 = groupIncentives(filteredSection2Data);

  const totalSection1Count = groupedSection1.length; 
  const totalStandardAmount = groupedSection1.reduce((sum, item) => {
      const itemTotal = Number(item.amount); const itemAdditional = Number(item.additional_amount);
      return sum + (itemTotal - itemAdditional);
  }, 0);
  const totalAdditionalSum = groupedSection2.reduce((sum, item) => sum + Number(item.additional_amount), 0);
  const grandTotal = totalStandardAmount + totalAdditionalSum;

  if (loading) return (
      <div className="flex justify-center py-20">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
      </div>
  );

  return (
    <div className="p-4 dir-rtl text-right space-y-10 animate-fadeIn max-w-[98%] mx-auto relative z-10">
      
      {/* 🔴 Inbox - المبيعات الواردة */}
      <div className="relative bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden">
        {/* توهج داخلي */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 relative z-10">
            <div>
                <h2 className="text-xl md:text-2xl font-black text-amber-400 drop-shadow-md">📥 مبيعات بانتظار التحديد</h2>
                <p className="text-xs text-orange-200/60 mt-1 font-bold">يتم عرض المعاملات حسب التاريخ المحدد فقط</p>
            </div>

            {/* شريط فلترة التاريخ */}
            <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-orange-200/80 text-sm font-bold">📅 عرض يوم:</span>
                <input 
                    type="date" 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)} 
                    className="bg-white/5 text-orange-50 border border-white/10 rounded-xl p-2 text-sm focus:border-amber-500/50 outline-none cursor-pointer transition-all"
                />
                <button onClick={() => setFilterDate('')} className="text-xs text-amber-400 underline hover:text-amber-300 font-bold transition-colors">عرض الكل</button>
            </div>

            {selectedForTransfer.length > 0 && (
                <button onClick={handleBulkTransfer} className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-bold py-3 px-8 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.2)] transition-all animate-pulse active:scale-95">
                    ترحيل ({selectedForTransfer.length}) ⬅️
                </button>
            )}
        </div>

        {otherDatesCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 mb-6 rounded-xl text-center text-amber-200 text-sm font-bold shadow-inner relative z-10">
                ⚠️ يوجد ({otherDatesCount}) عمليات معلقة في تواريخ أخرى. قم بتغيير التاريخ لمشاهدتها.
            </div>
        )}

        <div className="overflow-x-auto relative z-10 rounded-xl border border-white/10 bg-black/20 shadow-inner">
            <table className="w-full text-sm text-left dir-rtl">
                <thead className="bg-black/60 text-amber-300 border-b border-white/10 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th className="p-4 text-center border-l border-white/5 w-12">تحديد</th>
                        <th className="p-4 text-center border-l border-white/5 w-10">ت</th>
                        <th className="p-4 text-right border-l border-white/5 w-1/4">المنتج والسيارة</th>
                        <th className="p-4 text-right border-l border-white/5 w-1/4">الفنيين</th>
                        <th className="p-4 text-center border-l border-white/5 w-24">شامل 5000؟</th>
                        <th className="p-4 text-right border-l border-white/5 w-36">مبلغ إضافي</th>
                        <th className="p-4 text-right border-l border-white/5">ملاحظات</th>
                        <th className="p-4 text-center w-28">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredSalesToReview.map((sale, index) => {
                        const assigned = tempAssignments[sale.id] || { techs: [], notes: '', is_standard: true, standard_amount: 2000, additional_amount: 0 };
                        const hasTechs = assigned.techs.length > 0;
                        return (
                            <tr key={sale.id} className={`hover:bg-white/5 transition-colors ${selectedForTransfer.includes(sale.id) ? 'bg-amber-500/10' : ''}`}>
                                <td className="p-4 text-center border-l border-white/5">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded bg-black/50 border-white/20 accent-amber-500 cursor-pointer" 
                                        disabled={!hasTechs} 
                                        checked={selectedForTransfer.includes(sale.id)} 
                                        onChange={() => handleCheckboxChange(sale.id)} 
                                    />
                                </td>
                                <td className="p-4 text-center border-l border-white/5 text-orange-100/50 font-bold">{index + 1}</td>
                                <td className="p-4 border-l border-white/5">
                                    <div className="font-bold text-orange-50 text-base drop-shadow-sm">{sale.car_type}</div>
                                    <div className="text-orange-200/60 text-xs mt-1">{sale.details}</div>
                                    <div className="text-xs text-teal-400/80 mt-2 font-mono">📅 {safeDate(sale.created_at)}</div>
                                    <div className="text-xs text-amber-500 mt-1 font-bold">الأصلي: {Number(sale.amount_total).toLocaleString()} د.ع</div>
                                </td>
                                <td className="p-4 border-l border-white/5">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {assigned.techs && assigned.techs.map(t => (
                                            <span key={t.id} className="bg-amber-500/20 text-amber-200 border border-amber-500/30 px-3 py-1 rounded-lg text-xs flex items-center gap-2 shadow-sm font-bold">
                                                {t.name}
                                                <button onClick={() => removeTechFromRow(sale.id, t.id)} className="hover:text-rose-400 font-black text-sm">&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                    <button onClick={() => openTechModal(sale.id)} className="text-xs bg-white/5 hover:bg-white/10 text-orange-100 px-3 py-1.5 rounded-lg border border-white/10 transition-all active:scale-95 font-bold">➕ اختيار فني</button>
                                </td>
                                <td className="p-4 border-l border-white/5 text-center bg-teal-500/5">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded cursor-pointer accent-teal-500" 
                                        checked={assigned.is_standard} 
                                        onChange={(e) => updateAssignmentField(sale.id, 'is_standard', e.target.checked)} 
                                    />
                                </td>
                                <td className="p-4 border-l border-white/5 bg-purple-500/5">
                                    <input 
                                        type="number" 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-orange-50 focus:border-amber-500/50 outline-none text-center font-bold shadow-inner" 
                                        placeholder="0" 
                                        value={assigned.additional_amount} 
                                        onChange={(e) => updateAssignmentField(sale.id, 'additional_amount', e.target.value)} 
                                    />
                                </td>
                                <td className="p-4 border-l border-white/5">
                                    <input 
                                        type="text" 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-orange-50 focus:border-amber-500/50 outline-none text-sm shadow-inner" 
                                        placeholder="اكتب ملاحظة..." 
                                        value={assigned.notes} 
                                        onChange={(e) => updateAssignmentField(sale.id, 'notes', e.target.value)} 
                                    />
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => openEditModal(sale)} className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-lg transition-all active:scale-95" title="تعديل">✏️</button>
                                        <button onClick={() => handleDeleteSale(sale.id)} className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shadow-lg transition-all active:scale-95" title="حذف">&times;</button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredSalesToReview.length === 0 && (
                        <tr><td colSpan="8" className="p-10 text-center text-orange-200/50 font-bold text-lg">لا توجد مبيعات بانتظار التحديد لهذا التاريخ 🔍</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* 🔵 القسم الأول */}
          <div className="relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden">
            <h2 className="text-xl font-black text-cyan-400 mb-6 border-b border-white/10 pb-4 flex items-center gap-2 drop-shadow-md">
                📋 القسم الأول: السجل الأساسي (5,000)
            </h2>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-inner">
                <table className="w-full text-sm text-left dir-rtl">
                    <thead className="bg-black/60 text-cyan-300 border-b border-white/10 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-3 text-center border-l border-white/5 w-12">ت</th>
                            <th className="p-3 text-right border-l border-white/5">السيارة</th>
                            <th className="p-3 text-right border-l border-white/5">الأصلي</th>
                            <th className="p-3 text-right border-l border-white/5">الفنيين</th>
                            <th className="p-3 text-right border-l border-white/5">ملاحظات</th>
                            <th className="p-3 text-center border-l border-white/5 w-24">إضافة</th>
                            <th className="p-3 text-center w-12">حذف</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {groupedSection1.map((item, index) => (
                            <tr key={item.sale_id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 text-center border-l border-white/5 text-orange-100/50">{index + 1}</td>
                                <td className="p-3 border-l border-white/5 font-bold text-orange-50">
                                    {item.sales_operations?.car_type}
                                    <div className="text-xs text-teal-400/80 font-mono mt-1">{safeDate(item.sales_operations?.created_at || item.created_at)}</div>
                                </td>
                                <td className="p-3 border-l border-white/5 text-amber-400 font-bold">{Number(item.sales_operations?.amount_total).toLocaleString()}</td>
                                <td className="p-3 border-l border-white/5 text-orange-100">
                                    <div className="flex flex-wrap gap-1">
                                        {item.tech_names.map((name, idx) => (<span key={idx} className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded-lg text-xs">{name}</span>))}
                                    </div>
                                </td>
                                <td className="p-3 border-l border-white/5 text-orange-200/60 text-xs">{item.notes || '-'}</td>
                                <td className="p-3 border-l border-white/5 text-center">
                                    <button onClick={() => openExtraModal(item)} className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs px-3 py-1.5 rounded-lg shadow transition-all active:scale-95 font-bold">➕ إضافي</button>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handleDeleteIncentive(item.ids, item.sale_id)} className="text-rose-400 hover:text-rose-300 font-bold text-xl drop-shadow-md">&times;</button>
                                </td>
                            </tr>
                        ))}
                        {groupedSection1.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-orange-200/50 font-bold">لا توجد حوافز لهذا التاريخ</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="mt-5 text-left bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20 inline-block shadow-inner">
                <span className="text-cyan-200/80 font-bold ml-3">مجموع القسم الأول:</span>
                <span className="text-2xl font-black text-cyan-400 drop-shadow-sm">{totalSection1Count} × 5,000 = {totalStandardAmount.toLocaleString()} د.ع</span>
            </div>
          </div>

          {/* 🟣 القسم الثاني */}
          <div className="relative bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden">
            <h2 className="text-xl font-black text-purple-400 mb-6 border-b border-white/10 pb-4 flex items-center gap-2 drop-shadow-md">
                ⭐ القسم الثاني: حوافز إضافية واستثناءات
            </h2>
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 shadow-inner">
                <table className="w-full text-sm text-left dir-rtl">
                    <thead className="bg-black/60 text-purple-300 border-b border-white/10 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-3 text-right border-l border-white/5">المنتج والسيارة</th>
                            <th className="p-3 text-right border-l border-white/5">مبلغ الحافز</th>
                            <th className="p-3 text-right border-l border-white/5">الأصلي</th>
                            <th className="p-3 text-center border-l border-white/5">التسجيل</th>
                            <th className="p-3 text-right border-l border-white/5">الفنيين</th>
                            <th className="p-3 text-center w-12">حذف</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {groupedSection2.map((item) => (
                            <tr key={item.sale_id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 border-l border-white/5">
                                    <span className="block text-orange-50 font-bold">{item.sales_operations?.car_type}</span>
                                    <span className="text-xs text-teal-400/80 font-mono mt-1 block">{safeDate(item.sales_operations?.created_at || item.created_at)}</span>
                                </td>
                                <td className="p-3 border-l border-white/5 text-emerald-400 font-black text-lg drop-shadow-sm">{Number(item.additional_amount).toLocaleString()}</td>
                                <td className="p-3 border-l border-white/5 text-amber-400 font-bold">{Number(item.sales_operations?.amount_total).toLocaleString()}</td>
                                <td className="p-3 border-l border-white/5 text-center">
                                    {item.is_standard ? 
                                        <span className="bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded-lg text-xs border border-cyan-500/30 inline-block">➕ من القسم الأول</span> : 
                                        <span className="bg-purple-500/10 text-purple-300 px-2 py-1 rounded-lg text-xs border border-purple-500/30 inline-block">🖐️ يدوي فقط</span>
                                    }
                                </td>
                                <td className="p-3 border-l border-white/5 text-orange-100">
                                    <div className="flex flex-wrap gap-1">
                                        {item.tech_names.map((name, idx) => (<span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-xs">{name}</span>))}
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handleDeleteIncentive(item.ids, item.sale_id)} className="text-rose-400 hover:text-rose-300 font-bold text-xl drop-shadow-md">&times;</button>
                                </td>
                            </tr>
                        ))}
                        {groupedSection2.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-orange-200/50 font-bold">لا توجد حوافز إضافية لهذا التاريخ</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="mt-5 text-left bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 inline-block shadow-inner">
                <span className="text-purple-200/80 font-bold ml-3">مجموع الإضافي/اليدوي:</span>
                <span className="text-2xl font-black text-purple-400 drop-shadow-sm">{totalAdditionalSum.toLocaleString()} د.ع</span>
            </div>
          </div>
      </div>

      {/* 🟢 المجموع الكلي */}
      <div className="relative bg-emerald-500/10 backdrop-blur-xl p-8 rounded-[2rem] border border-emerald-500/30 text-center shadow-[0_0_30px_rgba(52,211,153,0.15)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent pointer-events-none"></div>
        <h3 className="text-emerald-200/80 font-bold mb-3 text-lg md:text-xl relative z-10">المجموع الكلي للحوافز (للتاريخ المحدد)</h3>
        <div className="text-5xl md:text-6xl font-black text-emerald-400 dir-ltr drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] relative z-10">
            {grandTotal.toLocaleString()} <span className="text-emerald-500/60 text-2xl md:text-3xl">د.ع</span>
        </div>
      </div>

      {/* 🎨 النوافذ المنبثقة (Modals) */}
      
      {/* 1. نافذة الفنيين */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn dir-rtl text-right">
            <div className="bg-white/5 backdrop-blur-xl w-full max-w-sm rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] pointer-events-none"></div>
                <h3 className="text-xl font-black text-amber-400 mb-6 drop-shadow-md relative z-10">🛠️ اختيار الفنيين</h3>
                
                <div className="flex gap-2 mb-6 relative z-10">
                    <select value={modalTechId} onChange={e => setModalTechId(e.target.value)} className="flex-grow p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-amber-500/50 outline-none shadow-inner appearance-none cursor-pointer">
                        <option value="" className="bg-gray-900">-- اختر فني --</option>
                        {technicians.map(t => <option key={t.id} value={t.id} className="bg-gray-900">{t.name}</option>)}
                    </select>
                    <button onClick={addTechToRow} className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 px-5 rounded-xl font-bold shadow-lg transition-all active:scale-95">إضافة</button>
                </div>
                
                <div className="space-y-3 mb-8 relative z-10">
                    {tempAssignments[currentSaleId]?.techs.length === 0 && <p className="text-orange-200/50 text-sm text-center font-bold">لم يتم إضافة فنيين بعد</p>}
                    {tempAssignments[currentSaleId]?.techs.map(t => (
                        <div key={t.id} className="flex justify-between bg-black/30 border border-white/5 p-3 rounded-xl items-center shadow-inner">
                            <span className="text-orange-50 font-bold">{t.name}</span>
                            <button onClick={() => removeTechFromRow(currentSaleId, t.id)} className="text-rose-400 hover:text-rose-300 font-bold text-sm bg-rose-500/10 px-3 py-1 rounded-lg">حذف</button>
                        </div>
                    ))}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-xl font-bold shadow-lg transition-all active:scale-95 relative z-10">تم (إغلاق) ✅</button>
            </div>
        </div>
      )}

      {/* 2. نافذة الإضافي */}
      {isExtraModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn dir-rtl text-right">
            <div className="bg-white/5 backdrop-blur-xl w-full max-w-sm rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/10 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none"></div>
                <h3 className="text-xl font-black text-purple-400 mb-2 relative z-10">💸 إضافة حافز إضافي</h3>
                <p className="text-sm text-orange-200/70 mb-6 relative z-10">
                    سيتم تخصيص المبلغ للسيارة: <br/> <span className="text-amber-400 font-bold">{extraTarget?.sales_operations?.car_type}</span> <br/>
                    للفني: <span className="text-cyan-300 font-bold">{extraTarget?.technician_name}</span>
                </p>
                
                <div className="mb-8 relative z-10">
                    <label className="block text-orange-200/80 font-bold text-sm mb-2">المبلغ الإضافي (د.ع)</label>
                    <input type="number" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-purple-500/50 outline-none font-black text-center text-2xl shadow-inner dir-ltr" placeholder="0" autoFocus />
                </div>
                
                <div className="flex gap-3 relative z-10">
                    <button onClick={submitExtraFromSection1} className="flex-1 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 font-bold rounded-xl shadow-lg transition-all active:scale-95">حفظ وترحيل ✅</button>
                    <button onClick={() => setIsExtraModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 rounded-xl font-bold transition-all active:scale-95">إلغاء</button>
                </div>
            </div>
        </div>
      )}

      {/* 3. نافذة التعديل */}
      {isEditModalOpen && editingSaleData && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn dir-rtl text-right">
            <div className="bg-white/5 backdrop-blur-xl w-full max-w-md rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/10 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 blur-[60px] pointer-events-none"></div>
                <h3 className="text-xl md:text-2xl font-black text-blue-400 mb-6 border-b border-white/10 pb-4 relative z-10 drop-shadow-md">✏️ تعديل بيانات السجل</h3>
                
                <div className="space-y-5 relative z-10">
                    <div>
                        <label className="block text-orange-200/80 font-bold text-sm mb-1">نوع السيارة / المنتج</label>
                        <input type="text" value={editingSaleData.car_type} onChange={(e) => setEditingSaleData({...editingSaleData, car_type: e.target.value})} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-blue-500/50 outline-none shadow-inner transition-all" />
                    </div>
                    <div>
                        <label className="block text-orange-200/80 font-bold text-sm mb-1">السعر الإجمالي (د.ع)</label>
                        <input type="number" value={editingSaleData.amount_total} onChange={(e) => setEditingSaleData({...editingSaleData, amount_total: e.target.value})} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-blue-500/50 outline-none font-bold text-xl text-emerald-400 dir-ltr shadow-inner transition-all" />
                    </div>
                    <div>
                        <label className="block text-orange-200/80 font-bold text-sm mb-1">التفاصيل / الملاحظات</label>
                        <textarea rows="3" value={editingSaleData.details} onChange={(e) => setEditingSaleData({...editingSaleData, details: e.target.value})} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-orange-50 focus:border-blue-500/50 outline-none shadow-inner transition-all" />
                    </div>
                </div>
                
                <div className="flex gap-3 mt-8 relative z-10">
                    <button onClick={handleSaveEdit} className="flex-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-bold rounded-2xl shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all active:scale-95">حفظ التعديلات ✅</button>
                    <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-orange-50 font-bold rounded-2xl transition-all active:scale-95">إلغاء ✖️</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}