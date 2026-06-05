import React, { useState } from 'react';
import { Wallet, RefreshCw, Save, Calculator } from 'lucide-react';
import { supabase } from '../../supabase';

export default function SalesBalancesTab({ employees = [], handleClearEmployeeBalance, refreshData, archivedOrders = [] }) {
  // حالة لتخزين التعديلات المؤقتة لكل موظف
  const [editingBalances, setEditingBalances] = useState({});

  const handleUpdateBalance = async (empId, newBalance) => {
    const { error } = await supabase
      .from('employees')
      .update({ total_balance: parseFloat(newBalance) })
      .eq('id', empId);

    if (!error) {
      setEditingBalances(prev => ({ ...prev, [empId]: null }));
      if (refreshData) refreshData();
    } else {
      alert("خطأ أثناء الحفظ: " + error.message);
    }
  };

  // الحسابات المالية (نفس المنطق السابق)
  const totalNetProfitFromArchive = archivedOrders.reduce((sum, order) => {
    return sum + (parseFloat(order.total_price || 0) - (parseFloat(order.cost_price || order.original_price || 0) - parseFloat(order.incentive || 0)) - parseFloat(order.delivery_cost || 0) - parseFloat(order.employee_commission || 0));
  }, 0);

  const totalEmployeesPayout = employees.reduce((sum, emp) => sum + (parseFloat(emp.total_balance) || 0), 0);
  const finalRealProfit = totalNetProfitFromArchive - totalEmployeesPayout;

  return (
    <div className="space-y-6 animate-fadeIn text-right" dir="rtl">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-950/40 to-black/60 border border-amber-500/30 rounded-3xl p-6 flex items-center gap-5 shadow-xl">
          <div className="bg-amber-500/20 p-4 rounded-2xl border border-amber-500/30 text-amber-400">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-bold mb-1">إجمالي الحوافز المستحقة للموظفين:</p>
            <p className="text-2xl font-black text-amber-400 font-mono" dir="ltr">{totalEmployeesPayout.toLocaleString()} د.ع</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-950/40 to-black/60 border border-emerald-500/30 rounded-3xl p-6 flex items-center gap-5 shadow-xl">
          <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30 text-emerald-400">
            <Calculator className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-bold mb-1">صافي الربح الفعلي:</p>
            <p className={`text-2xl font-black font-mono ${finalRealProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`} dir="ltr">{finalRealProfit.toLocaleString()} د.ع</p>
          </div>
        </div>
      </div>

      <div className="bg-black/20 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-sm text-right text-gray-300">
          <thead className="text-xs text-amber-400 uppercase bg-amber-900/10 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold">اسم موظف المبيعات</th>
              <th className="px-6 py-4 font-bold text-center">الرصيد التراكمي (قابل للتعديل)</th>
              <th className="px-6 py-4 font-bold text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold text-white text-base">{emp.name}</td>
                <td className="px-6 py-4 text-center">
                  <input
                    type="number"
                    className="bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-center text-amber-400 font-bold w-32 outline-none focus:border-amber-500"
                    defaultValue={parseFloat(emp.total_balance) || 0}
                    onChange={(e) => setEditingBalances({...editingBalances, [emp.id]: e.target.value})}
                  />
                </td>
                <td className="px-6 py-4 text-center flex justify-center gap-2">
                  {editingBalances[emp.id] !== undefined && (
                    <button onClick={() => handleUpdateBalance(emp.id, editingBalances[emp.id])} className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all">
                      <Save className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleClearEmployeeBalance(emp.id, emp.name, emp.total_balance)} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> تصفير
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}