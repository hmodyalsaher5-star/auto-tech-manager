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
            .select(`*, sales_operations (car_type, details, amount_total)`)
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
    const { data: incentives } = await supabase.from('technician_incentives').select(`*, sales_operations (car_type, details, amount_total)`).eq('is_paid', false).order('created_at', { ascending: false });
    if (incentives) {
        setSection1Data(incentives.filter(item => item.is_standard));
        setSection2Data(incentives.filter(item => Number(item.additional_amount) > 0));
    }
  };

  // ✅ دالة حذف السجل من المراجعة (Inbox)
  const handleDeleteSale = async (saleId) => {
      if (!window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟ (سيتم إلغاء عملية البيع)")) return;
      
      const { error } = await supabase.from('sales_operations').delete().eq('id', saleId);
      
      if (error) alert("❌ خطأ أثناء الحذف: " + error.message);
      else {
          alert("🗑️ تم الحذف بنجاح");
          setSalesToReview(prev => prev.filter(s => s.id !== saleId)); 
      }
  };

  // ✅ دالة حذف الحافز من القسمين الأول والثاني (إلغاء الترحيل)
  const handleDeleteIncentive = async (ids, saleId) => {
    if (!window.confirm("هل تريد حذف هذا الحافز وإعادة الطلب للقائمة العلوية؟")) return;

    // 1. حذف الحوافز المسجلة
    const { error: deleteError } = await supabase
        .from('technician_incentives')
        .delete()
        .in('id', ids);

    if (deleteError) return alert("❌ خطأ في الحذف: " + deleteError.message);

    // 2. إعادة حالة الطلب إلى confirmed ليعود للجدول العلوي
    const { error: updateError } = await supabase
        .from('sales_operations')
        .update({ status: 'confirmed' })
        .eq('id', saleId);

    if (updateError) alert("⚠️ تم الحذف لكن فشل تحديث حالة الطلب");
    else {
        alert("✅ تم الحذف وإعادة الطلب للمراجعة");
        refreshData();
    }
  };

  // --- بقية الدوال ---
  const openExtraModal = (item) => { setExtraTarget(item); setExtraAmount(''); setIsExtraModalOpen(true); };
  const submitExtraFromSection1 = async () => {
    if (!extraAmount || Number(extraAmount) <= 0) return alert("الرجاء إدخال مبلغ صحيح");
    const targetId = extraTarget.ids[0]; 
    const newTotal = 5000 + Number(extraAmount);
    const { error } = await supabase.from('technician_incentives').update({ additional_amount: Number(extraAmount), amount: newTotal }).eq('id', targetId);
    if (error) alert("خطأ: " + error.message);
    else { alert("✅ تم الترحيل"); setIsExtraModalOpen(false); refreshData(); }
  };

  const openTechModal = (saleId) => {
    setCurrentSaleId(saleId); setModalTechId(''); setIsModalOpen(true);
    if (!tempAssignments[saleId]) {
        setTempAssignments(prev => ({ ...prev, [saleId]: { techs: [], notes: '', is_standard: true, additional_amount: 0 } }));
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
        const current = prev[saleId] || { techs: [], notes: '', is_standard: true, additional_amount: 0 };
        return { ...prev, [saleId]: { ...current, [field]: value } };
    });
  };
  
  const handleCheckboxChange = (saleId) => {
    if (selectedForTransfer.includes(saleId)) setSelectedForTransfer(prev => prev.filter(id => id !== saleId));
    else setSelectedForTransfer(prev => [...prev, saleId]);
  };
  
  const handleBulkTransfer = async () => {
    if (selectedForTransfer.length === 0) return;
    if (!window.confirm(`هل أنت متأكد من ترحيل ${selectedForTransfer.length} عمليات؟`)) return;

    const incentivesPayload = []; 
    const salesToUpdate = [];
// داخل دالة handleBulkTransfer
    selectedForTransfer.forEach(saleId => {
        const assignment = tempAssignments[saleId];
        
        // ✅ 1. العثور على سجل البيع الأصلي لجلب التاريخ منه
        const originalSale = salesToReview.find(s => s.id === saleId);

        if (assignment && assignment.techs.length > 0 && originalSale) {
            const standardVal = assignment.is_standard ? 5000 : 0;
            const additionalVal = Number(assignment.additional_amount) || 0;
            const totalForCar = standardVal + additionalVal;
            if (totalForCar === 0) return;

            const combinedTechNames = assignment.techs.map(t => t.name).join(' & ');
            const primaryTechId = assignment.techs[0].id;

            incentivesPayload.push({
                sale_id: saleId,
                technician_id: primaryTechId,
                technician_name: combinedTechNames,
                is_standard: assignment.is_standard,
                additional_amount: additionalVal,
                amount: totalForCar,
                notes: assignment.notes,
                
                // ✅ 2. هذا هو السطر السحري: نستخدم تاريخ البيع الأصلي بدلاً من تاريخ اليوم
                created_at: originalSale.created_at 
            });
            salesToUpdate.push(saleId);
        }
    });

    if (incentivesPayload.length === 0) return alert("❌ تأكد من تحديد البيانات!");
    const { error: insertError } = await supabase.from('technician_incentives').insert(incentivesPayload);
    if (insertError) return alert("خطأ: " + insertError.message);
    await supabase.from('sales_operations').update({ status: 'reviewed' }).in('id', salesToUpdate);
    alert("✅ تم الترحيل بنجاح"); 
    setTempAssignments({}); 
    setSelectedForTransfer([]); 
    refreshData(); 
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

  const groupedSection1 = groupIncentives(section1Data);
  const groupedSection2 = groupIncentives(section2Data);
  const totalSection1Count = groupedSection1.length; 
  const totalStandardAmount = totalSection1Count * 5000;
  const totalAdditionalSum = groupedSection2.reduce((sum, item) => sum + Number(item.additional_amount), 0);
  const grandTotal = totalStandardAmount + totalAdditionalSum;

  if (loading) return <div className="text-center text-white py-10">جاري تحميل البيانات...</div>;

  return (
    <div className="p-4 dir-rtl text-right space-y-8 animate-fadeIn max-w-[95%] mx-auto">
      
      {/* 🔴 Inbox - المبيعات الواردة */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-yellow-400">📥 مبيعات بانتظار التحديد ({salesToReview.length})</h2>
            {selectedForTransfer.length > 0 && <button onClick={handleBulkTransfer} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow-lg animate-pulse">ترحيل ({selectedForTransfer.length}) ⬅️</button>}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 border-collapse">
                <thead className="bg-gray-900 text-white">
                    <tr>
                        <th className="p-3 text-center border border-gray-700 w-10">تحديد</th>
                        <th className="p-3 text-right border border-gray-700 w-10">ت</th>
                        <th className="p-3 text-right border border-gray-700 w-1/4">المنتج والسيارة</th>
                        <th className="p-3 text-right border border-gray-700 w-1/4">الفنيين</th>
                        <th className="p-3 text-center border border-gray-700 w-24">شامل 5000؟</th>
                        <th className="p-3 text-right border border-gray-700 w-32">مبلغ إضافي</th>
                        <th className="p-3 text-right border border-gray-700">ملاحظات</th>
                        <th className="p-3 text-center border border-gray-700 w-12">حذف</th>
                    </tr>
                </thead>
                <tbody>
                    {salesToReview.map((sale, index) => {
                        const assigned = tempAssignments[sale.id] || { techs: [], notes: '', is_standard: true, additional_amount: 0 };
                        const hasTechs = assigned.techs.length > 0;
                        return (
                            <tr key={sale.id} className={`hover:bg-gray-700/50 transition ${selectedForTransfer.includes(sale.id) ? 'bg-blue-900/20' : ''}`}>
                                <td className="p-3 text-center border border-gray-700"><input type="checkbox" className="w-5 h-5 rounded cursor-pointer" disabled={!hasTechs} checked={selectedForTransfer.includes(sale.id)} onChange={() => handleCheckboxChange(sale.id)} /></td>
                                <td className="p-3 border border-gray-700 text-center">{index + 1}</td>
                                <td className="p-3 border border-gray-700"><div className="font-bold text-white text-base">{sale.car_type}</div><div className="text-gray-400">{sale.details}</div><div className="text-xs text-yellow-500 mt-1 font-mono">الأصلي: {Number(sale.amount_total).toLocaleString()}</div></td>
                                <td className="p-3 border border-gray-700">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {assigned.techs && assigned.techs.map(t => (
                                            <span key={t.id} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                                {t.name}<button onClick={() => removeTechFromRow(sale.id, t.id)} className="hover:text-red-300 font-bold">×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <button onClick={() => openTechModal(sale.id)} className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded border border-gray-500">➕ إضافة</button>
                                </td>
                                <td className="p-3 border border-gray-700 text-center bg-blue-900/10"><input type="checkbox" className="w-5 h-5 rounded cursor-pointer accent-blue-500" checked={assigned.is_standard} onChange={(e) => updateAssignmentField(sale.id, 'is_standard', e.target.checked)} /></td>
                                <td className="p-3 border border-gray-700 bg-purple-900/10"><input type="number" className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white focus:border-purple-500 outline-none text-center font-bold text-purple-300" placeholder="0" value={assigned.additional_amount} onChange={(e) => updateAssignmentField(sale.id, 'additional_amount', e.target.value)} /></td>
                                <td className="p-3 border border-gray-700"><input type="text" className="w-full bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none text-white text-sm" placeholder="ملاحظة..." value={assigned.notes} onChange={(e) => updateAssignmentField(sale.id, 'notes', e.target.value)} /></td>
                                <td className="p-3 border border-gray-700 text-center">
                                    <button 
                                        onClick={() => handleDeleteSale(sale.id)} 
                                        className="text-red-500 hover:text-red-400 font-bold text-xl transition transform hover:scale-110"
                                        title="حذف السجل"
                                    >
                                        &times;
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {salesToReview.length === 0 && <tr><td colSpan="8" className="p-6 text-center text-gray-500">لا توجد مبيعات بانتظار المراجعة</td></tr>}
                </tbody>
            </table>
        </div>
      </div>

      {/* 🔵 القسم الأول */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold text-blue-400 mb-4 border-b border-gray-600 pb-2">📋 القسم الأول: السجل (5,000 د.ع)</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 min-w-[600px] border-collapse">
                <thead className="bg-gray-900 text-white">
                    <tr>
                        <th className="p-2 text-right border border-gray-700 w-12">ت</th>
                        <th className="p-2 text-right border border-gray-700">السيارة</th>
                        <th className="p-2 text-right border border-gray-700">المبلغ الأصلي</th>
                        <th className="p-2 text-right border border-gray-700">الفنيين</th>
                        <th className="p-2 text-right border border-gray-700">ملاحظات</th>
                        <th className="p-2 text-center border border-gray-700 w-24">إجراءات</th>
                        {/* ✅ عمود حذف القسم الأول */}
                        <th className="p-2 text-center border border-gray-700 w-12">حذف</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedSection1.map((item, index) => (
                        <tr key={item.sale_id} className="hover:bg-gray-700/50">
                            <td className="p-2 border border-gray-700 text-center">{index + 1}</td>
                            <td className="p-2 border border-gray-700 font-bold text-white">{item.sales_operations?.car_type}</td>
                            <td className="p-2 border border-gray-700 text-yellow-500">{Number(item.sales_operations?.amount_total).toLocaleString()}</td>
                            <td className="p-2 border border-gray-700 text-blue-300">
                                <div className="flex flex-wrap gap-1">
                                    {item.tech_names.map((name, idx) => (
                                        <span key={idx} className="bg-blue-900/50 border border-blue-700 px-2 py-0.5 rounded text-xs">{name}</span>
                                    ))}
                                </div>
                            </td>
                            <td className="p-2 border border-gray-700 text-gray-400">{item.notes || '-'}</td>
                            <td className="p-2 border border-gray-700 text-center">
                                <button onClick={() => openExtraModal(item)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded shadow">➕ إضافة</button>
                            </td>
                            {/* ✅ زر الحذف للقسم الأول */}
                            <td className="p-2 border border-gray-700 text-center">
                                <button onClick={() => handleDeleteIncentive(item.ids, item.sale_id)} className="text-red-500 hover:text-red-400 font-bold text-lg">&times;</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-4 text-left bg-blue-900/20 p-3 rounded border border-blue-900 inline-block">
            <span className="text-gray-400 ml-2">مجموع القسم الأول:</span>
            <span className="text-2xl font-bold text-blue-400">{totalSection1Count} (سيارات) × 5,000 = {totalStandardAmount.toLocaleString()} د.ع</span>
        </div>
      </div>

      {/* 🟣 القسم الثاني */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-bold text-purple-400 mb-4 border-b border-gray-600 pb-2">⭐ القسم الثاني: حوافز إضافية</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300 min-w-[600px] border-collapse">
                <thead className="bg-gray-900 text-white">
                    <tr>
                        <th className="p-2 text-right border border-gray-700">المنتج والسيارة</th>
                        <th className="p-2 text-right border border-gray-700">مبلغ الحافز</th>
                        <th className="p-2 text-right border border-gray-700">المبلغ الأصلي</th>
                        <th className="p-2 text-right border border-gray-700">نوع التسجيل</th>
                        <th className="p-2 text-right border border-gray-700">الفنيين</th>
                        {/* ✅ عمود حذف القسم الثاني */}
                        <th className="p-2 text-center border border-gray-700 w-12">حذف</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {groupedSection2.map((item) => (
                        <tr key={item.sale_id} className="hover:bg-gray-700/50">
                            <td className="p-2 border border-gray-700">
                                <span className="block text-white font-bold">{item.sales_operations?.car_type}</span>
                                <span className="text-xs text-gray-400">{item.sales_operations?.details}</span>
                            </td>
                            <td className="p-2 border border-gray-700 text-green-400 font-bold text-lg">{Number(item.additional_amount).toLocaleString()}</td>
                            <td className="p-2 border border-gray-700 text-yellow-500">{Number(item.sales_operations?.amount_total).toLocaleString()}</td>
                            <td className="p-2 border border-gray-700">
                                {item.is_standard ? <span className="bg-blue-900/50 text-blue-200 px-2 py-1 rounded text-xs border border-blue-800 block w-fit">➕ إضافة</span> : <span className="bg-purple-900/50 text-purple-200 px-2 py-1 rounded text-xs border border-purple-800 block w-fit">🖐️ يدوي</span>}
                            </td>
                            <td className="p-2 border border-gray-700 text-gray-300">
                                <div className="flex flex-wrap gap-1">
                                    {item.tech_names.map((name, idx) => (
                                        <span key={idx} className="bg-gray-700 px-2 py-0.5 rounded text-xs">{name}</span>
                                    ))}
                                </div>
                            </td>
                            {/* ✅ زر الحذف للقسم الثاني */}
                            <td className="p-2 border border-gray-700 text-center">
                                <button onClick={() => handleDeleteIncentive(item.ids, item.sale_id)} className="text-red-500 hover:text-red-400 font-bold text-lg">&times;</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-4 text-left bg-purple-900/20 p-3 rounded border border-purple-900 inline-block">
            <span className="text-gray-400 ml-2">مجموع الإضافي/اليدوي:</span>
            <span className="text-2xl font-bold text-purple-400">{totalAdditionalSum.toLocaleString()} د.ع</span>
        </div>
      </div>

      <div className="bg-gradient-to-l from-green-900 to-gray-800 p-6 rounded-lg border border-green-600 text-center shadow-2xl">
        <h3 className="text-gray-300 mb-2 text-lg">المجموع الكلي للحوافز</h3>
        <div className="text-4xl font-bold text-white dir-ltr">{grandTotal.toLocaleString()} <span className="text-green-400 text-2xl">د.ع</span></div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-sm rounded-lg shadow-2xl border border-gray-600 p-6 animate-scaleIn">
                <h3 className="text-lg font-bold text-white mb-4">اختيار الفنيين</h3>
                <div className="flex gap-2 mb-4">
                    <select value={modalTechId} onChange={e => setModalTechId(e.target.value)} className="flex-grow p-2 rounded bg-gray-700 text-white border border-gray-500 outline-none">
                        <option value="">-- اختر فني --</option>
                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button onClick={addTechToRow} className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-500">إضافة</button>
                </div>
                <div className="space-y-2 mb-6">
                    {tempAssignments[currentSaleId]?.techs.length === 0 && <p className="text-gray-500 text-sm text-center">لم يتم إضافة فنيين بعد</p>}
                    {tempAssignments[currentSaleId]?.techs.map(t => (
                        <div key={t.id} className="flex justify-between bg-gray-700 p-2 rounded items-center">
                            <span className="text-white">{t.name}</span>
                            <button onClick={() => removeTechFromRow(currentSaleId, t.id)} className="text-red-400 font-bold hover:text-red-200">حذف</button>
                        </div>
                    ))}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-full py-2 bg-green-600 text-white rounded font-bold hover:bg-green-500">تم (إغلاق) ✅</button>
            </div>
        </div>
      )}

      {isExtraModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 w-full max-w-sm rounded-lg shadow-2xl border border-gray-600 p-6 animate-scaleIn">
                <h3 className="text-lg font-bold text-white mb-2">إضافة حافز للقسم الثاني</h3>
                <p className="text-sm text-gray-400 mb-4">سيتم نسخ: <span className="text-yellow-400">{extraTarget?.sales_operations?.car_type}</span> للفني <span className="text-blue-300">{extraTarget?.technician_name}</span></p>
                <div className="mb-6">
                    <label className="block text-gray-300 text-sm mb-1">المبلغ الإضافي</label>
                    <input type="number" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} className="w-full p-2 rounded bg-gray-700 text-white border border-gray-500 focus:border-purple-500 outline-none font-bold text-center text-xl" placeholder="0" autoFocus />
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsExtraModalOpen(false)} className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">إلغاء</button>
                    <button onClick={submitExtraFromSection1} className="flex-1 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-500 shadow-lg">حفظ وترحيل ✅</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}