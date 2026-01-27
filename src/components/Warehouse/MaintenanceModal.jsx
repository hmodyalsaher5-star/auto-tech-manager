import { useState } from 'react';

export default function MaintenanceModal({ isOpen, onClose, item, onSubmit }) {
  const [action, setAction] = useState('TO_DAMAGED');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ item, action, quantity, notes });
    setQuantity('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-orange-600 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛠️</div>
          <h2 className="text-xl font-bold text-orange-400">إدارة التالف والصيانة</h2>
          <p className="text-gray-300 mt-2">{item.name}</p>
          <div className="flex justify-center gap-4 mt-2 text-sm">
            <span className="text-green-400">صالح: {item.stock_quantity}</span>
            <span className="text-red-400 border border-red-800 px-2 rounded">تالف: {item.damaged_quantity || 0}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <label className={`flex items-center gap-2 p-3 rounded border cursor-pointer transition ${action === 'TO_DAMAGED' ? 'bg-red-900/40 border-red-500' : 'bg-gray-700 border-gray-600'}`}>
              <input type="radio" name="action" value="TO_DAMAGED" checked={action === 'TO_DAMAGED'} onChange={e => setAction(e.target.value)} />
              <span className="text-red-300 font-bold">⬇️ تسجيل عطل</span>
            </label>
            <label className={`flex items-center gap-2 p-3 rounded border cursor-pointer transition ${action === 'REPAIRED' ? 'bg-green-900/40 border-green-500' : 'bg-gray-700 border-gray-600'}`}>
              <input type="radio" name="action" value="REPAIRED" checked={action === 'REPAIRED'} onChange={e => setAction(e.target.value)} />
              <span className="text-green-300 font-bold">⬆️ تم الإصلاح</span>
            </label>
            <label className={`flex items-center gap-2 p-3 rounded border cursor-pointer transition ${action === 'SCRAP' ? 'bg-gray-600 border-gray-500' : 'bg-gray-700 border-gray-600'}`}>
              <input type="radio" name="action" value="SCRAP" checked={action === 'SCRAP'} onChange={e => setAction(e.target.value)} />
              <span className="text-gray-300 font-bold">🗑️ إتلاف نهائي</span>
            </label>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">العدد</label>
            <input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white focus:border-orange-500" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white">إلغاء</button>
            <button type="submit" className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 rounded text-white font-bold">تنفيذ</button>
          </div>
        </form>
      </div>
    </div>
  );
}