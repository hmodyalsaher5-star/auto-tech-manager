import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';
import * as XLSX from 'xlsx';

export default function DailyReport() {
  const [loading, setLoading] = useState(false);
  
  // البيانات
  const [allIncentives, setAllIncentives] = useState([]);
  const [availableDates, setAvailableDates] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(''); 
  const [viewMode, setViewMode] = useState('accountant'); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 🆕 حالة نافذة الإضافة اليدوية
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [retroData, setRetroData] = useState({
      date: new Date().toISOString().split('T')[0], // التاريخ الافتراضي (اليوم)
      carType: '',
      details: 'تسجيل يدوي',
      amountTotal: '', 
      incentiveAmount: 5000, 
      techName: ''
  });

  // --- دالة التجميع ---
  const groupDataStrict = (items) => {
    const map = new Map();
    items.forEach((item) => {
      if (map.has(item.sale_id)) {
        const existing = map.get(item.sale_id);
        existing.tech_names.push(item.technician_name);
      } else {
        map.set(item.sale_id, {
          ...item,
          tech_names: [item.technician_name],
        });
      }
    });
    return Array.from(map.values());
  };

  // --- جلب البيانات ---
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) setLoading(true);
      
      const { data } = await supabase
        .from('technician_incentives')
        .select('*, sales_operations(car_type, details, amount_total)')
        .eq('is_paid', false)
        .order('created_at', { ascending: false });

      if (isMounted && data) {
        setAllIncentives(data);
        const datesSet = new Set(data.map(item => new Date(item.created_at).toLocaleDateString('en-CA')));
        const datesArray = Array.from(datesSet).sort().reverse();
        setAvailableDates(datesArray);
        
        // منطق اختيار التاريخ: حاول البقاء على التاريخ الحالي، وإلا اختر الأحدث
        if (datesArray.length > 0) {
            if (!selectedDate || !datesArray.includes(selectedDate)) {
                setSelectedDate(datesArray[0]);
            }
        }
      }
      if (isMounted) setLoading(false);
    };
    fetchData();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  // --- الفلترة ---
  const { groupedSection1, groupedSection2 } = useMemo(() => {
    if (!selectedDate || allIncentives.length === 0) {
        return { groupedSection1: [], groupedSection2: [] };
    }
    const filteredData = allIncentives.filter(item => 
        new Date(item.created_at).toLocaleDateString('en-CA') === selectedDate
    );
    const s1Raw = filteredData.filter(i => i.is_standard);
    const s2Raw = filteredData.filter(i => Number(i.additional_amount) > 0);

    return {
        groupedSection1: groupDataStrict(s1Raw),
        groupedSection2: groupDataStrict(s2Raw)
    };
  }, [selectedDate, allIncentives]);

  const totalIncentiveS1 = groupedSection1.length * 5000;
  const totalIncentiveS2 = groupedSection2.reduce((sum, item) => sum + Number(item.additional_amount), 0);
  const grandTotal = totalIncentiveS1 + totalIncentiveS2;

  // --- 🛠️ دالة حفظ القيد اليدوي (الحل الجذري للتاريخ) ---
  const handleRetroSubmit = async () => {
    if (!retroData.carType || !retroData.techName || !retroData.amountTotal) {
        return alert("الرجاء تعبئة نوع السيارة، المبلغ، واسم الفني");
    }
    
    setLoading(true);

    // ✅ الحل الجذري: بناء نص التاريخ يدوياً بصيغة ISO مع تثبيت الساعة 12 ظهراً
    // هذا يمنع قاعدة البيانات من استخدام تاريخ اليوم (NOW)
    // الصيغة النهائية ستكون مثل: "2023-10-06T12:00:00.000Z"
    const fixedDateString = `${retroData.date}T12:00:00.000Z`;
    
    // 1. إنشاء سجل مبيعات
    const { data: saleData, error: saleError } = await supabase
      .from('sales_operations')
      .insert([{
          car_type: retroData.carType,
          details: retroData.details,
          amount_total: Number(retroData.amountTotal),
          status: 'reviewed', 
          created_at: fixedDateString // 🔴 إرسال التاريخ المثبت
      }])
      .select()
      .single();

    if (saleError) {
        alert("خطأ في المبيعات: " + saleError.message);
        setLoading(false);
        return;
    }

    // 2. إنشاء سجل الحوافز
    const { error: incError } = await supabase
      .from('technician_incentives')
      .insert([{
          sale_id: saleData.id,
          technician_name: retroData.techName,
          technician_id: null,
          is_standard: Number(retroData.incentiveAmount) === 5000,
          amount: Number(retroData.incentiveAmount),
          additional_amount: Number(retroData.incentiveAmount) > 5000 ? Number(retroData.incentiveAmount) - 5000 : 0,
          is_paid: false,
          created_at: fixedDateString // 🔴 إرسال نفس التاريخ المثبت
      }]);

    if (incError) alert("خطأ في الحافز: " + incError.message);
    else {
        alert(`✅ تم حفظ القيد بتاريخ ${retroData.date} بنجاح!`);
        setIsRetroModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
        
        // تصفير النموذج
        setRetroData({
            date: new Date().toISOString().split('T')[0],
            carType: '',
            details: 'تسجيل يدوي',
            amountTotal: '',
            incentiveAmount: 5000,
            techName: ''
        });
    }
    setLoading(false);
  };

  // --- التصدير والطباعة ---
  const handleExportExcel = () => {
    const data = [['م', 'القسم', 'السيارة', 'التفاصيل', 'المبلغ المستلم', 'قيمة الحافز', 'الفنيين', 'ملاحظات']];

    groupedSection1.forEach((item, index) => {
        data.push([
            index + 1, 'القسم الأول', item.sales_operations?.car_type, item.sales_operations?.details,
            Number(item.sales_operations?.amount_total), 5000, item.tech_names.join(' + '), item.notes || ''
        ]);
    });

    groupedSection2.forEach((item, index) => {
        data.push([
            index + 1, 'القسم الثاني', item.sales_operations?.car_type, item.sales_operations?.details,
            Number(item.sales_operations?.amount_total), Number(item.additional_amount), item.tech_names.join(' + '), item.notes || ''
        ]);
    });

    data.push(['', '', '', '', 'المجموع الكلي:', grandTotal, '', '']);

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    if(!workbook.Workbook) workbook.Workbook = {};
    if(!workbook.Workbook.Views) workbook.Workbook.Views = [];
    if(!workbook.Workbook.Views[0]) workbook.Workbook.Views[0] = {};
    workbook.Workbook.Views[0].RTL = true;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily_Report");
    XLSX.writeFile(workbook, `Report_${selectedDate}.xlsx`);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = " ";
    window.print();
    document.title = originalTitle;
  };

  const handleCloseDay = async () => {
    if (!window.confirm(`هل أنت متأكد من إغلاق حسابات يوم (${selectedDate})؟`)) return;
    setLoading(true);
    
    const idsToClose = allIncentives
        .filter(item => new Date(item.created_at).toLocaleDateString('en-CA') === selectedDate)
        .map(item => item.id);

    const { error } = await supabase.from('technician_incentives').update({ is_paid: true }).in('id', idsToClose);

    if (error) alert("خطأ: " + error.message);
    else {
        alert(`✅ تم إغلاق يوم ${selectedDate} بنجاح.`);
        setRefreshTrigger(prev => prev + 1);
        // الانتقال لتاريخ آخر إن وجد
        const remainingDates = availableDates.filter(d => d !== selectedDate);
        if (remainingDates.length > 0) setSelectedDate(remainingDates[0]); 
        else setSelectedDate('');
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center text-white py-10 animate-pulse">جاري المعالجة...</div>;

  return (
    <div className="p-4 min-h-screen bg-gray-100 text-black dir-rtl text-right" dir="rtl">
      
      {/* لوحة التحكم */}
      <div className="print:hidden bg-gray-800 p-4 rounded-lg shadow-lg mb-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <div>
                <h2 className="text-xl font-bold text-yellow-400">🖨️ الكشف اليومي</h2>
                <p className="text-xs text-gray-400">اختر التاريخ</p>
            </div>
            {availableDates.length > 0 ? (
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-gray-700 border border-gray-500 text-white font-bold rounded p-2 outline-none">
                    {availableDates.map(date => (<option key={date} value={date}>{date}</option>))}
                </select>
            ) : <span className="text-gray-500 px-2">لا توجد سجلات</span>}
        </div>

        <div className="flex items-center gap-2">
            <div className="flex bg-gray-700 rounded p-1 ml-2">
                <button onClick={() => setViewMode('accountant')} className={`px-3 py-1 rounded transition ${viewMode === 'accountant' ? 'bg-blue-600 font-bold' : 'text-gray-300'}`}>محاسب</button>
                <button onClick={() => setViewMode('manager')} className={`px-3 py-1 rounded transition ${viewMode === 'manager' ? 'bg-purple-600 font-bold' : 'text-gray-300'}`}>إدارة</button>
            </div>
            
            <button onClick={() => setIsRetroModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded font-bold flex items-center gap-1 border border-purple-400">
                <span>➕ قيد يدوي</span>
            </button>

            <button onClick={handleExportExcel} disabled={!selectedDate} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded font-bold disabled:opacity-50 flex items-center gap-1">Excel 📊</button>
            <button onClick={handlePrint} disabled={!selectedDate} className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded font-bold disabled:opacity-50">طباعة 🖨️</button>
            <button onClick={handleCloseDay} disabled={!selectedDate} className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded font-bold disabled:opacity-50 border border-red-800">إغلاق 🔒</button>
        </div>
      </div>

      {/* منطقة التقرير */}
      {selectedDate ? (
      <div id="print-area" className="max-w-[210mm] mx-auto bg-white p-4 shadow-md print:shadow-none print:w-full text-right print:p-0">
        
        <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold mb-1">كشف حوافز الفنيين اليومي</h1>
            <p className="text-sm">التاريخ: {new Date(selectedDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* الجدول الأول */}
        <div className="mb-8">
            <h4 className="font-bold mb-1 border-b w-fit print:hidden">القسم الأول</h4>
            <table className="w-full text-sm border-collapse border border-black text-right" dir="rtl">
                <thead>
                    <tr className="bg-gray-100 print:bg-gray-200">
                        <th className="border border-black p-1 w-8 text-center">ت</th>
                        <th className="border border-black p-1">السيارة / المنتج</th>
                        <th className="border border-black p-1 w-24 text-center">المستلم</th>
                        <th className="border border-black p-1">الفني</th>
                        <th className="border border-black p-1">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedSection1.map((item, idx) => (
                        <tr key={item.id}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1">
                                <span className="font-bold block">{item.sales_operations?.car_type}</span>
                                <span className="text-xs">{item.sales_operations?.details}</span>
                            </td>
                            <td className="border border-black p-1 text-center font-bold dir-ltr">{Number(item.sales_operations?.amount_total).toLocaleString()}</td>
                            <td className="border border-black p-1 text-xs">{item.tech_names.join(' + ')}</td>
                            <td className="border border-black p-1 text-xs">{item.notes || '-'}</td>
                        </tr>
                    ))}
                    {groupedSection1.length === 0 && <tr><td colSpan="5" className="text-center p-2">لا يوجد بيانات</td></tr>}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 print:bg-gray-200 font-bold">
                        <td colSpan="2" className="border border-black p-1 text-left pl-2">مجموع حوافز ({groupedSection1.length} سيارات):</td>
                        <td className="border border-black p-1 text-center bg-white">{totalIncentiveS1.toLocaleString()}</td>
                        <td colSpan="2" className="border border-black p-1"></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        {/* الجدول الثاني */}
        <div className="mb-8">
            <h4 className="font-bold mb-1 border-b w-fit print:hidden">القسم الثاني</h4>
            <table className="w-full text-sm border-collapse border border-black text-right" dir="rtl">
                <thead>
                    <tr className="bg-gray-100 print:bg-gray-200">
                        <th className="border border-black p-1 w-8 text-center">ت</th>
                        <th className="border border-black p-1">السيارة / المنتج</th>
                        {viewMode === 'manager' && <th className="border border-black p-1 w-24 text-center">الحافز</th>}
                        <th className="border border-black p-1 w-24 text-center">المستلم</th>
                        <th className="border border-black p-1">الفني</th>
                        <th className="border border-black p-1">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedSection2.map((item, idx) => (
                        <tr key={item.id}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1">
                                <span className="font-bold block">{item.sales_operations?.car_type}</span>
                                {viewMode === 'manager' && <span className="text-xs">{item.sales_operations?.details}</span>}
                            </td>
                            {viewMode === 'manager' && <td className="border border-black p-1 text-center font-bold">{Number(item.additional_amount).toLocaleString()}</td>}
                            <td className="border border-black p-1 text-center font-bold dir-ltr">{Number(item.sales_operations?.amount_total).toLocaleString()}</td>
                            <td className="border border-black p-1 text-xs">{item.tech_names.join(' + ')}</td>
                            <td className="border border-black p-1 text-xs">{item.notes || '-'}</td>
                        </tr>
                    ))}
                    {groupedSection2.length === 0 && <tr><td colSpan={viewMode === 'manager' ? 6 : 5} className="text-center p-2">لا يوجد بيانات</td></tr>}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 print:bg-gray-200 font-bold">
                        <td colSpan={viewMode === 'manager' ? 2 : 2} className="border border-black p-1 text-left pl-2">مجموع حوافز القسم:</td>
                        <td className="border border-black p-1 text-center bg-white">{totalIncentiveS2.toLocaleString()}</td>
                        <td colSpan={viewMode === 'manager' ? 3 : 2} className="border border-black p-1"></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div className="border-2 border-black p-2 mt-4 flex justify-between items-center bg-white w-1/2 mr-auto">
            <span className="font-bold text-sm">صافي الحافز المستحق:</span>
            <span className="text-xl font-bold border-b-2 border-black">{grandTotal.toLocaleString()}</span>
        </div>

      </div>
      ) : <div className="text-center py-20 text-gray-500"><p className="text-2xl">🎉 لا توجد تقارير معلقة!</p></div>}

      {/* 🆕 نافذة التسجيل اليدوي */}
      {isRetroModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 print:hidden">
            <div className="bg-gray-800 w-full max-w-sm rounded-lg shadow-2xl border border-gray-600 p-6 animate-scaleIn">
                <h3 className="text-lg font-bold text-white mb-4">📅 تسجيل قيد سابق/يدوي</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-400">تاريخ القيد</label>
                        <input type="date" value={retroData.date} onChange={(e) => setRetroData({...retroData, date: e.target.value})} className="w-full bg-gray-700 rounded p-2 text-white" />
                    </div>
                    <input type="text" placeholder="نوع السيارة / البيان" value={retroData.carType} onChange={(e) => setRetroData({...retroData, carType: e.target.value})} className="w-full bg-gray-700 rounded p-2 text-white" />
                    
                    <div>
                        <label className="text-xs text-gray-400">الفنيين (اسم & اسم)</label>
                        <input type="text" placeholder="مثال: علي & أحمد" value={retroData.techName} onChange={(e) => setRetroData({...retroData, techName: e.target.value})} className="w-full bg-gray-700 rounded p-2 text-white" />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400">قيمة الحافز (للفني)</label>
                            <input type="number" value={retroData.incentiveAmount} onChange={(e) => setRetroData({...retroData, incentiveAmount: Number(e.target.value)})} className="w-full bg-gray-700 rounded p-2 text-white text-center font-bold" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-400">المبلغ المستلم (صندوق)</label>
                            <input type="number" value={retroData.amountTotal} onChange={(e) => setRetroData({...retroData, amountTotal: Number(e.target.value)})} className="w-full bg-gray-700 rounded p-2 text-white text-center" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setIsRetroModalOpen(false)} className="flex-1 py-2 bg-gray-600 text-white rounded">إلغاء</button>
                    <button onClick={handleRetroSubmit} className="flex-1 py-2 bg-purple-600 text-white font-bold rounded">حفظ القيد</button>
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
            table { width: 100%; direction: rtl; border-collapse: collapse; }
            th, td { text-align: right; border: 1px solid black !important; padding: 4px; }
        }
      `}</style>
    </div>
  );
}