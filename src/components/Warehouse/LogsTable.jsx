import React, { useState } from 'react';

// 🆕 استقبلنا props الجديدة (products و onImageClick)
export default function LogsTable({ logs, products = [], isAdmin, onDeleteLog, onUpdateLog, onImageClick }) {
  const reasonLabels = {
    'supplier': '🏭 شراء من مورد', 'showroom_return': '↩️ مرتجع معرض', 'wholesale_return': '↩️ مرتجع جملة', 'manual_adjustment': '🔧 تسوية جردية',
    'showroom': '🏢 للمعرض', 'wholesale': '📦 للجملة', 'damage': '🗑️ إتلاف',
    'damage_reported': '🛠️ عطل/صيانة', 'repaired_return': '✅ تم الإصلاح', 'final_scrap': '❌ إتلاف نهائي'
  };

  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editRef, setEditRef] = useState('');

  const startEditing = (log) => {
    setEditingId(log.id);
    setEditNotes(log.notes || '');
    setEditReason(log.reason || '');
    setEditRef(log.reference_number || '');
  };

  const saveEditing = (logId) => {
    onUpdateLog(logId, {
      notes: editNotes,
      reason: editReason,
      reference_number: editRef
    });
    setEditingId(null);
  };

  if (logs.length === 0) return <p className="text-center text-gray-500 py-10">لا توجد سجلات</p>;

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-700 animate-fadeIn">
      {/* 🆕 وسعنا عرض الجدول قليلاً ليتسع لعمود الصورة */}
      <table className="w-full text-right bg-gray-800 min-w-[900px]">
        <thead className="bg-gray-900 text-gray-300 text-xs md:text-sm">
          <tr>
            <th className="p-3 whitespace-nowrap">الوقت</th>
            <th className="p-3 whitespace-nowrap">الموظف</th>
            {/* 🆕 عمود الصورة الجديد */}
            <th className="p-3 text-center whitespace-nowrap w-16">الصورة</th>
            <th className="p-3 whitespace-nowrap">المنتج</th>
            <th className="p-3 text-center whitespace-nowrap">الحركة</th>
            <th className="p-3 text-center whitespace-nowrap">العدد</th>
            <th className="p-3 whitespace-nowrap">السبب</th>
            <th className="p-3 min-w-[180px]">ملاحظات / مراجع</th>
            {isAdmin && <th className="p-3 text-center whitespace-nowrap w-24">التحكم</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 text-sm">
          {logs.map((log) => {
            const isEditing = editingId === log.id;
            
            // 🆕 الخدعة الهندسية: البحث عن المنتج في القائمة الأصلية لجلب صورته
            const product = products.find(p => p.id === log.product_id && p.table === log.product_table);
            const imageUrl = product?.image_url;

            return (
              <tr key={log.id} className="hover:bg-gray-750 transition-colors">
                <td className="p-3 text-xs text-gray-400 whitespace-nowrap" dir="ltr">
                  {new Date(log.created_at).toLocaleDateString('en-GB')} <br/>
                  {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2.5 py-1 rounded-xl font-bold text-xs">
                    @{log.employee_name || 'system'}
                  </span>
                </td>

                {/* 🆕 عرض الصورة القابلة للضغط */}
                <td className="p-3 text-center">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={log.product_name} 
                      onClick={() => onImageClick && onImageClick(imageUrl)}
                      className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-110 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all border border-gray-600 shadow-sm mx-auto"
                      title="انقر لتكبير الصورة"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-700/50 border border-gray-600 border-dashed flex items-center justify-center text-[10px] text-gray-500 mx-auto">
                      بدون
                    </div>
                  )}
                </td>

                <td className="p-3 font-bold text-white whitespace-nowrap">{log.product_name}</td>
                <td className="p-3 text-center whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${log.movement_type === 'IN' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {log.movement_type === 'IN' ? '📥 وارد' : '📤 صادر'}
                  </span>
                </td>
                <td className="p-3 text-center font-mono font-bold text-white text-lg">{Math.abs(log.quantity_change)}</td>
                
                <td className="p-3 whitespace-nowrap">
                  {isEditing ? (
                    <select value={editReason} onChange={(e) => setEditReason(e.target.value)} className="bg-gray-700 text-white p-1 rounded text-xs border border-gray-600">
                      {Object.keys(reasonLabels).map(key => <option key={key} value={key}>{reasonLabels[key]}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs">{reasonLabels[log.reason] || log.reason}</span>
                  )}
                </td>

                <td className="p-3 text-xs text-gray-300">
                  {isEditing ? (
                    <div className="flex flex-col gap-1.5">
                      <input type="text" placeholder="رقم المرجع#" value={editRef} onChange={(e) => setEditRef(e.target.value)} className="bg-gray-700 text-yellow-400 p-1 rounded text-xs border border-gray-600 w-full" />
                      <input type="text" placeholder="الملاحظات..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="bg-gray-700 text-white p-1 rounded text-xs border border-gray-600 w-full" />
                    </div>
                  ) : (
                    <>
                      {log.reference_number && <span className="block text-yellow-500 font-bold mb-1">#{log.reference_number}</span>}
                      <span className="text-gray-400">{log.notes || '-'}</span>
                    </>
                  )}
                </td>

                {isAdmin && (
                  <td className="p-3 text-center whitespace-nowrap">
                    <div className="flex justify-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEditing(log.id)} className="bg-green-600 text-white p-1 px-2 rounded text-xs font-bold hover:bg-green-500">حفظ</button>
                          <button onClick={() => setEditingId(null)} className="bg-gray-600 text-white p-1 px-2 rounded text-xs hover:bg-gray-500">إلغاء</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(log)} className="p-1 px-2 bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 rounded text-xs border border-blue-500/20" title="تعديل السجل">✏️</button>
                          <button onClick={() => onDeleteLog(log.id)} className="p-1 px-2 bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 rounded text-xs border border-rose-500/20" title="حذف السجل">🗑️</button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}