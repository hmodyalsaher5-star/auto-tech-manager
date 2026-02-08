import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function TechnicianPayout() {
  const [loading, setLoading] = useState(false);
  
  // البيانات من القاعدة
  const [allIncentives, setAllIncentives] = useState([]);
  const [dbTechs, setDbTechs] = useState([]); 
  const [dbPrep, setDbPrep] = useState([]);   
  const [dbSales, setDbSales] = useState([]); 
  
  // التواريخ
  const [availableDates, setAvailableDates] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(''); 

  // بيانات اليوم
  const [totalPot, setTotalPot] = useState(0); 
  const [techniciansList, setTechniciansList] = useState([]); 
  
  // 💵 المدخلات المالية (القيم)
  const [payouts, setPayouts] = useState({});      // { tech_id: amount }
  const [staffPayouts, setStaffPayouts] = useState({}); // { staff_id: amount }
  const [supervisorsCount, setSupervisorsCount] = useState(3); 

  // النوافذ
  const [modalType, setModalType] = useState(null); 
  const [newName, setNewName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // --- 1. جلب البيانات ---
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) setLoading(true);
      try {
        const { data: allStaff } = await supabase.from('technicians').select('*').order('name');
        const { data: incentives } = await supabase.from('technician_incentives').select('*').eq('is_paid', false);

        if (isMounted && allStaff && incentives) {
            // تصنيف الموظفين
            setDbTechs(allStaff.filter(p => p.role === 'technician' || p.role === null));
            setDbPrep(allStaff.filter(p => p.role === 'prep'));
            setDbSales(allStaff.filter(p => p.role === 'sales'));

            setAllIncentives(incentives);

            const datesSet = new Set(incentives.map(item => new Date(item.created_at).toLocaleDateString('en-CA')));
            const datesArray = Array.from(datesSet).sort().reverse();
            setAvailableDates(datesArray);
            
            if (datesArray.length > 0 && !selectedDate) setSelectedDate(datesArray[0]);
        }
      } catch (error) { console.error(error); } 
      finally { if (isMounted) setLoading(false); }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  // --- 2. معالجة اليوم المختار ---
  useEffect(() => {
    if (!selectedDate || allIncentives.length === 0) {
        setTechniciansList([]);
        setTotalPot(0);
        return;
    }

    const dailyIncentives = allIncentives.filter(item => 
        new Date(item.created_at).toLocaleDateString('en-CA') === selectedDate
    );

    // حساب الصندوق
    const uniqueCarsS1 = new Set(dailyIncentives.filter(i => i.is_standard).map(i => i.sale_id)).size;
    const totalS1 = uniqueCarsS1 * 5000;
    
    const processedSales = new Set();
    let totalS2 = 0;
    dailyIncentives.forEach(item => {
        if (Number(item.additional_amount) > 0 && !processedSales.has(item.sale_id)) {
            totalS2 += Number(item.additional_amount);
            processedSales.add(item.sale_id);
        }
    });
    setTotalPot(totalS1 + totalS2);

    // ربط الفنيين
    const techMap = {};
    dbTechs.forEach(t => {
        techMap[t.name.trim()] = { ...t, cars_count: 0, history: [] };
    });

    dailyIncentives.forEach(item => {
        const names = item.technician_name.split('&').map(n => n.trim());
        names.forEach(name => {
            if (techMap[name]) {
                if (!techMap[name].history.includes(item.sale_id)) {
                    techMap[name].cars_count += 1;
                    techMap[name].history.push(item.sale_id);
                }
            } else {
                techMap[name] = { id: 'temp-'+name, name: name, cars_count: 1, history: [item.sale_id] };
            }
        });
    });

    const processedList = Object.values(techMap);
    setTechniciansList(processedList);

    // القيم الافتراضية
    const initialPayouts = {};
    processedList.forEach(t => { initialPayouts[t.id] = t.cars_count * 2000; });
    setPayouts(initialPayouts);
    
    // تصفير مدفوعات الموظفين عند تغيير اليوم
    setStaffPayouts({});

  }, [selectedDate, allIncentives, dbTechs]);

  // --- 🧮 الحسابات الحية ---
  
  // 1. مجموع الفنيين
  const totalPaidToTechs = Object.values(payouts).reduce((a, b) => a + Number(b), 0);
  
  // 2. مجموع التجهيز (نحسب القيم من staffPayouts للأشخاص في قائمة dbPrep)
  const totalPrep = dbPrep.reduce((sum, person) => sum + (Number(staffPayouts[person.id]) || 0), 0);
  
  // 3. مجموع المبيعات
  const totalSales = dbSales.reduce((sum, person) => sum + (Number(staffPayouts[person.id]) || 0), 0);

  // 4. الفائض النهائي
  const finalSurplus = totalPot - totalPaidToTechs - totalPrep - totalSales;
  
  const sharePerSupervisor = supervisorsCount > 0 ? finalSurplus / supervisorsCount : 0;


  // --- التحكم ---
  const handleTechPayChange = (id, value) => setPayouts(prev => ({ ...prev, [id]: Number(value) })); // ✅ تحويل لرقم فوراً
  const handleStaffPayChange = (id, value) => setStaffPayouts(prev => ({ ...prev, [id]: Number(value) })); // ✅ تحويل لرقم فوراً

  const handleAddNewItem = async () => {
    if (!newName.trim()) return alert("اكتب الاسم");
    setLoading(true);
    const { error } = await supabase.from('technicians').insert([{ name: newName.trim(), role: modalType }]);
    if (error) alert("خطأ: " + error.message);
    else {
        setRefreshTrigger(prev => prev + 1);
        setNewName(""); setModalType(null);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    const oldTitle = document.title;
    document.title = " "; 
    window.print();
    document.title = oldTitle;
  };

  const handleFinalize = async () => {
    if (!window.confirm(`تأكيد إغلاق يوم (${selectedDate})؟`)) return;
    setLoading(true);
    const idsToClose = allIncentives
        .filter(item => new Date(item.created_at).toLocaleDateString('en-CA') === selectedDate)
        .map(item => item.id);
    const { error } = await supabase.from('technician_incentives').update({ is_paid: true }).in('id', idsToClose);
    if (error) alert("خطأ: " + error.message);
    else {
        alert("✅ تم الإغلاق بنجاح!");
        setRefreshTrigger(prev => prev + 1);
        setTotalPot(0);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center text-white py-10 animate-pulse">جاري التحميل...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 dir-rtl text-right animate-fadeIn mb-20" dir="rtl">
      
      {/* 🎮 الشريط العلوي */}
      <div className="print:hidden bg-gray-800 p-4 rounded-lg shadow-lg mb-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <div>
                <h2 className="text-xl font-bold text-yellow-400">💰 محاسبة وتوزيع</h2>
                <p className="text-xs text-gray-400">توزيع الأرباح حسب التاريخ</p>
            </div>
            {availableDates.length > 0 ? (
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-gray-700 border border-gray-500 text-white font-bold rounded p-2 outline-none focus:border-yellow-400">
                    {availableDates.map(date => (<option key={date} value={date}>{date}</option>))}
                </select>
            ) : <span className="text-gray-500 bg-gray-900 px-3 py-1 rounded">لا توجد أيام معلقة ✅</span>}
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrint} disabled={!selectedDate} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded font-bold disabled:opacity-50 flex items-center gap-2"><span>طباعة التوزيع</span> 🖨️</button>
        </div>
      </div>

      {/* ⚠️ المحتوى التفاعلي */}
      <div className="print:hidden">
          {/* الصندوق */}
          <div className="bg-gradient-to-l from-green-800 to-gray-900 p-6 rounded-xl border border-green-600 mb-8 shadow-2xl flex justify-between items-center">
            <div><h2 className="text-gray-300 text-lg">الصندوق اليومي</h2></div>
            <div className="text-4xl font-bold text-white font-mono">{totalPot.toLocaleString()} <span className="text-lg text-green-400">د.ع</span></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 1️⃣ الفنيين */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-4">
                    <h3 className="text-xl font-bold text-white">👷 حصص الفنيين</h3>
                    <button onClick={() => setModalType('technician')} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded-full shadow">➕ فني</button>
                </div>
                {techniciansList.map(tech => (
                    <div key={tech.id} className={`p-4 rounded-lg border flex items-center justify-between shadow-md transition ${tech.cars_count > 0 ? 'bg-gray-800 border-gray-600' : 'bg-gray-800/50 border-gray-800 opacity-50'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${tech.cars_count > 0 ? 'bg-blue-900 text-white' : 'bg-gray-700 text-gray-500'}`}>👤</div>
                            <div>
                                <h4 className="text-white font-bold text-lg">{tech.name}</h4>
                                <p className="text-gray-400 text-sm">{tech.cars_count > 0 ? <span>أنجز <span className="text-yellow-400 font-bold">{tech.cars_count}</span> سيارة</span> : "لم يعمل"}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end w-40">
                            <input type="number" value={payouts[tech.id] || 0} onChange={(e) => handleTechPayChange(tech.id, e.target.value)} className={`w-full border rounded p-2 text-left font-bold text-xl outline-none ${tech.cars_count > 0 ? 'bg-gray-900 border-gray-600 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* الأقسام والمسؤولين */}
            <div className="space-y-6">
                
                {/* المتبقي */}
                <div className="bg-gray-800 p-5 rounded-lg border border-gray-600">
                    <h3 className="text-gray-300 font-bold mb-1">المتبقي (الفائض)</h3>
                    <div className={`text-3xl font-bold font-mono ${finalSurplus < 0 ? 'text-red-500' : 'text-blue-400'}`}>{finalSurplus.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">بعد خصم الفنيين والأقسام</p>
                </div>

                {/* 2️⃣ قسم التجهيز */}
                <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
                        <h3 className="text-white font-bold">🛠️ قسم التجهيز</h3>
                        <button onClick={() => setModalType('prep')} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded">➕ إضافة</button>
                    </div>
                    <div className="space-y-2">
                        {dbPrep.map(item => (
                            <div key={item.id} className="flex gap-2 items-center">
                                <div className="flex-1 text-sm text-gray-300">{item.name}</div>
                                <input 
                                    type="number" 
                                    value={staffPayouts[item.id] || ''} 
                                    onChange={(e) => handleStaffPayChange(item.id, e.target.value)} 
                                    className="w-24 bg-gray-700 border border-gray-600 rounded p-1 text-white text-center font-bold outline-none focus:border-blue-500" 
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-600 flex justify-between items-center">
                        <span className="text-xs text-gray-400">مجموع التجهيز:</span>
                        <span className="text-blue-400 font-bold text-lg">{totalPrep.toLocaleString()}</span>
                    </div>
                </div>

                {/* 3️⃣ قسم المبيعات */}
                <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
                        <h3 className="text-white font-bold">🛒 قسم المبيعات</h3>
                        <button onClick={() => setModalType('sales')} className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded">➕ إضافة</button>
                    </div>
                    <div className="space-y-2">
                        {dbSales.map(item => (
                            <div key={item.id} className="flex gap-2 items-center">
                                <div className="flex-1 text-sm text-gray-300">{item.name}</div>
                                <input 
                                    type="number" 
                                    value={staffPayouts[item.id] || ''} 
                                    onChange={(e) => handleStaffPayChange(item.id, e.target.value)} 
                                    className="w-24 bg-gray-700 border border-gray-600 rounded p-1 text-white text-center font-bold outline-none focus:border-yellow-500" 
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-600 flex justify-between items-center">
                        <span className="text-xs text-gray-400">مجموع المبيعات:</span>
                        <span className="text-yellow-400 font-bold text-lg">{totalSales.toLocaleString()}</span>
                    </div>
                </div>

                {/* 4️⃣ المسؤولين */}
                <div className="bg-purple-900/40 p-5 rounded-lg border border-purple-500/50">
                    <h3 className="text-purple-300 font-bold mb-3">👑 حصة المسؤولين</h3>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-300">العدد:</span>
                        <div className="flex bg-gray-700 rounded">{[1, 2, 3].map(num => (<button key={num} onClick={() => setSupervisorsCount(num)} className={`px-4 py-1 rounded ${supervisorsCount === num ? 'bg-purple-600 text-white font-bold' : 'text-gray-400'}`}>{num}</button>))}</div>
                    </div>
                    <div className="text-center pt-2 border-t border-purple-800">
                        <p className="text-xs text-gray-400">حصة الفرد</p>
                        <div className="text-3xl font-bold text-white">{Math.floor(sharePerSupervisor).toLocaleString()}</div>
                        <p className="text-xs text-purple-400 mt-1">الصافي النهائي: {finalSurplus.toLocaleString()}</p>
                    </div>
                </div>
                
                <button onClick={handleFinalize} disabled={!selectedDate} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-lg shadow-lg text-lg disabled:opacity-50">إغلاق وتوزيع 🏁</button>
            </div>
          </div>
      </div>

      {/* 📄 الطباعة (Print Area) */}
      <div id="print-area" className="hidden print:block bg-white text-black p-8 max-w-[210mm] mx-auto">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-3xl font-bold">كشف توزيع الأرباح</h1>
            <p className="text-lg mt-2">التاريخ: {selectedDate}</p>
        </div>

        <div className="flex justify-between mb-6 bg-gray-100 p-4 border border-black">
            <div><span className="font-bold">الصندوق الكلي:</span> <span className="text-xl">{totalPot.toLocaleString()}</span></div>
            <div><span className="font-bold">مجموع رواتب الفنيين:</span> <span className="text-xl">{totalPaidToTechs.toLocaleString()}</span></div>
        </div>

        <h3 className="font-bold border-b border-black mb-2">تفاصيل الفنيين:</h3>
        <table className="w-full text-sm border-collapse border border-black mb-6 text-right">
            <thead>
                <tr className="bg-gray-200">
                    <th className="border border-black p-2">الفني</th>
                    <th className="border border-black p-2 text-center">عدد السيارات</th>
                    <th className="border border-black p-2 text-center">المبلغ المستلم</th>
                </tr>
            </thead>
            <tbody>
                {techniciansList.filter(t => payouts[t.id] > 0).map(tech => (
                    <tr key={tech.id}>
                        <td className="border border-black p-2">{tech.name}</td>
                        <td className="border border-black p-2 text-center">{tech.cars_count}</td>
                        <td className="border border-black p-2 text-center font-bold">{Number(payouts[tech.id]).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="flex justify-between items-start mt-8 gap-4">
            
            {/* جدول التجهيز */}
            <div className="w-1/3 border border-black p-2">
                <h4 className="font-bold border-b border-black mb-2 bg-gray-100 p-1">قسم التجهيز</h4>
                {dbPrep.map(item => (
                    <div key={item.id} className="flex justify-between text-sm mb-1 border-b border-gray-300">
                        <span>{item.name}</span> 
                        <span className="font-bold">{Number(staffPayouts[item.id] || 0).toLocaleString()}</span>
                    </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-1 border-t border-black">
                    <span>المجموع:</span> <span>{totalPrep.toLocaleString()}</span>
                </div>
            </div>

            {/* جدول المبيعات */}
            <div className="w-1/3 border border-black p-2">
                <h4 className="font-bold border-b border-black mb-2 bg-gray-100 p-1">قسم المبيعات</h4>
                {dbSales.map(item => (
                    <div key={item.id} className="flex justify-between text-sm mb-1 border-b border-gray-300">
                        <span>{item.name}</span> 
                        <span className="font-bold">{Number(staffPayouts[item.id] || 0).toLocaleString()}</span>
                    </div>
                ))}
                <div className="flex justify-between font-bold mt-2 pt-1 border-t border-black">
                    <span>المجموع:</span> <span>{totalSales.toLocaleString()}</span>
                </div>
            </div>

            {/* صافي المسؤول */}
            <div className="w-1/3 border-2 border-black p-4 bg-gray-50">
                <h4 className="font-bold text-center mb-2">صافي حصة المسؤول</h4>
                <div className="text-center text-2xl font-bold">{Math.floor(sharePerSupervisor).toLocaleString()}</div>
                <div className="text-center text-xs mt-1">(عدد المسؤولين: {supervisorsCount})</div>
            </div>
        </div>
      </div>

      {/* 🆕 النافذة الموحدة للإضافة */}
      {modalType && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 print:hidden">
            <div className="bg-gray-800 w-full max-w-sm rounded-lg shadow-2xl border border-gray-600 p-6 animate-scaleIn">
                <h3 className="text-lg font-bold text-white mb-4">
                    {modalType === 'technician' ? 'إضافة فني جديد' : modalType === 'prep' ? 'إضافة لقسم التجهيز' : 'إضافة لقسم المبيعات'}
                </h3>
                <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-500 rounded p-2 text-white mb-4 outline-none" 
                    placeholder="الاسم..." 
                    autoFocus 
                />
                <div className="flex gap-3">
                    <button onClick={() => setModalType(null)} className="flex-1 py-2 bg-gray-600 text-white rounded">إلغاء</button>
                    <button onClick={handleAddNewItem} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded">حفظ</button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        @page { size: auto; margin: 0mm; }
        @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 15mm; }
        }
      `}</style>
    </div>
  );
}