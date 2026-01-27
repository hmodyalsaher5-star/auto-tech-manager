import { useState } from 'react';

export default function TransactionModal({ isOpen, onClose, item, type, onSubmit }) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState(type === 'IN' ? 'supplier' : 'showroom');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ item, type, quantity, reason, refNumber, notes });
    // تصفية الحقول بعد الإرسال
    setQuantity('');
    setRefNumber('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg border border-gray-600 shadow-2xl">
        <h2 className={`text-xl font-bold mb-4 ${type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
          {type === 'IN' ? '📥 استلام وارد' : '📤 صرف صادر'}: {item.name}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">الكمية</label>
            <input 
              type="number" min="1" required autoFocus 
              value={quantity} onChange={e => setQuantity(e.target.value)} 
              className="w-full p-2 bg-gray-900 border border-gray-600 text-white rounded focus:border-blue-500 outline-none"
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400">{type === 'IN' ? 'المصدر' : 'الوجهة'}</label>
            <select 
              value={reason} onChange={e => setReason(e.target.value)} 
              className="w-full p-2 bg-gray-900 border border-gray-600 text-white rounded"
            >
              {type === 'IN' ? (
                <>
                  <option value="supplier">🏭 شراء من مورد</option>
                  <option value="showroom_return">↩️ مرتجع من المعرض</option>
                  <option value="wholesale_return">↩️ مرتجع من الجملة</option>
                  <option value="repaired_return">✅ تم الإصلاح</option>
                  <option value="manual_adjustment">🔧 تسوية (زيادة)</option>
                </>
              ) : (
                <>
                  <option value="showroom">🏢 تحويل للمعرض</option>
                  <option value="wholesale">📦 تحويل للجملة</option>
                  <option value="damage">🗑️ تالف / كسر</option>
                  <option value="manual_adjustment">🔧 تسوية (نقص)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400">رقم السند</label>
            <input 
              type="text" value={refNumber} onChange={e => setRefNumber(e.target.value)} 
              className="w-full p-2 bg-gray-900 border border-gray-600 text-white rounded"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">ملاحظات</label>
            <textarea 
              value={notes} onChange={e => setNotes(e.target.value)} 
              className="w-full p-2 bg-gray-900 border border-gray-600 text-white rounded"
            ></textarea>
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white">إلغاء</button>
            <button type="submit" className={`flex-1 py-2 rounded font-bold text-white ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>تأكيد</button>
          </div>
        </form>
      </div>
    </div>
  );
}