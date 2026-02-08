import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

export default function DailyReport() {
  const [loading, setLoading] = useState(false);
  const [groupedSection1, setGroupedSection1] = useState([]);
  const [groupedSection2, setGroupedSection2] = useState([]);
  const [rawIds, setRawIds] = useState([]);
  const [viewMode, setViewMode] = useState('accountant'); 

  // --- 🛠️ المحرك الجديد للتجميع (التجميع بالبيانات وليس بالمعرف فقط) ---
  const groupDataStrict = (items) => {
    const map = new Map();

    items.forEach((item) => {
      // ننشئ "بصمة" فريدة للسيارة (النوع + التفاصيل + السعر الإجمالي)
      // هذا يضمن أنه لو تكرر نفس الفني أو فني آخر على نفس السيارة، سيندمجون
      const carSignature = `${item.sales_operations?.car_type}-${item.sales_operations?.details}-${item.sales_operations?.amount_total}`;

      if (map.has(carSignature)) {
        const existing = map.get(carSignature);
        // دمج أسماء الفنيين بدون تكرار
        if (!existing.tech_names.includes(item.technician_name)) {
          existing.tech_names.push(item.technician_name);
        }
      } else {
        // إضافة السيارة كإدخال جديد
        map.set(carSignature, {
          ...item,
          tech_names: [item.technician_name], 
        });
      }
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) setLoading(true);
      
      const { data: incentives } = await supabase
        .from('technician_incentives')
        .select('*, sales_operations(car_type, details, amount_total)')
        .eq('is_paid', false)
        .order('created_at', { ascending: false });

      if (isMounted && incentives) {
        // نحفظ كل الـ IDs الأصلية للإغلاق لاحقاً
        setRawIds(incentives.map(i => i.id));

        const s1Raw = incentives.filter(i => i.is_standard);
        const s2Raw = incentives.filter(i => Number(i.additional_amount) > 0);

        setGroupedSection1(groupDataStrict(s1Raw));
        setGroupedSection2(groupDataStrict(s2Raw));
      }
      if (isMounted) setLoading(false);
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // الحسابات الآن ستعتمد على الطول الحقيقي للمصفوفة المجمعة
  const totalIncentiveS1 = groupedSection1.length * 5000;
  const totalIncentiveS2 = groupedSection2.reduce((sum, item) => sum + Number(item.additional_amount), 0);
  const grandTotal = totalIncentiveS1 + totalIncentiveS2;

  const handlePrint = () => {
    document.title = `Report_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`;
    window.print();
  };

  const handleCloseDay = async () => {
    if (!window.confirm(`هل أنت متأكد من إغلاق اليوم؟\nالمبلغ المتوقع استلامه: ${grandTotal.toLocaleString()}`)) return;
    setLoading(true);
    const { error } = await supabase.from('technician_incentives').update({ is_paid: true }).in('id', rawIds);

    if (error) alert("خطأ: " + error.message);
    else {
        alert("✅ تم إغلاق اليوم بنجاح.");
        setGroupedSection1([]); setGroupedSection2([]); setRawIds([]);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center text-white py-10">جاري إعداد التقرير...</div>;

  return (
    <div className="p-4 min-h-screen bg-gray-100 text-black dir-rtl text-right" dir="rtl">
      
      {/* لوحة التحكم */}
      <div className="print:hidden bg-gray-800 p-4 rounded-lg shadow-lg mb-6 text-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-xl font-bold text-yellow-400">🖨️ الكشف اليومي (نظام التجميع الذكي)</h2>
            <p className="text-sm text-gray-400">يتم احتساب السيارة مرة واحدة مهما تعدد الفنيون.</p>
        </div>
        <div className="flex bg-gray-700 rounded p-1">
            <button onClick={() => setViewMode('accountant')} className={`px-4 py-2 rounded transition ${viewMode === 'accountant' ? 'bg-blue-600 font-bold' : 'text-gray-300'}`}>👁️‍🗨️ محاسب</button>
            <button onClick={() => setViewMode('manager')} className={`px-4 py-2 rounded transition ${viewMode === 'manager' ? 'bg-purple-600 font-bold' : 'text-gray-300'}`}>🔓 إدارة</button>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded font-bold">حفظ PDF / طباعة 📥</button>
            <button onClick={handleCloseDay} disabled={rawIds.length === 0} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-bold disabled:opacity-50">إغلاق اليوم ✅</button>
        </div>
      </div>

      <div id="print-area" className="max-w-[210mm] mx-auto bg-white p-4 shadow-md print:shadow-none print:w-full text-right">
        
        <div className="text-left border-b border-black pb-2 mb-4">
            <span className="text-sm font-bold">Date: {new Date().toLocaleDateString('en-GB')}</span>
        </div>

        {/* الجدول الأول - حوافز عادية */}
        <div className="mb-8">
            <table className="w-full text-sm border-collapse border border-black">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-1 w-8 text-center">ت</th>
                        <th className="border border-black p-1">المنتج والسيارة</th>
                        <th className="border border-black p-1 w-24 text-center">المبلغ المستلم</th>
                        <th className="border border-black p-1">الفني</th>
                        <th className="border border-black p-1">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    {groupedSection1.map((item, idx) => (
                        <tr key={idx}>
                            <td className="border border-black p-1 text-center">{idx + 1}</td>
                            <td className="border border-black p-1">
                                <span className="font-bold block">{item.sales_operations?.car_type}</span>
                                <span className="text-xs">{item.sales_operations?.details}</span>
                            </td>
                            <td className="border border-black p-1 text-center font-bold">
                                {Number(item.sales_operations?.amount_total).toLocaleString()}
                            </td>
                            <td className="border border-black p-1">
                                {item.tech_names.join(' + ')}
                            </td>
                            <td className="border border-black p-1 text-xs">{item.notes || '-'}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-gray-100 font-bold">
                        <td colSpan="2" className="border border-black p-1 text-left pl-2">
                             مجموع الحوافز ({groupedSection1.length} سيارات × 5000):
                        </td>
                        <td className="border border-black p-1 text-center bg-white">
                            {totalIncentiveS1.toLocaleString()}
                        </td>
                        <td colSpan="2" className="border border-black p-1"></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        {/* المجموع الكلي النهائي */}
        <div className="border-2 border-black p-2 mt-4 flex justify-between items-center bg-white w-1/2 mr-auto">
            <span className="font-bold text-sm">صافي الحافز المستحق:</span>
            <span className="text-xl font-bold border-b-2 border-black">
                {grandTotal.toLocaleString()}
            </span>
        </div>
      </div>

      <style>{`
        @media print {
            body { background: white; }
            .print\\:hidden { display: none !important; }
            #print-area { width: 100%; border: none; }
            table { width: 100%; direction: rtl; }
            @page { margin: 10mm; }
        }
      `}</style>
    </div>
  );
}