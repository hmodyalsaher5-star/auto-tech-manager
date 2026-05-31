import React from 'react';
import { supabase } from '../../supabase';
// 🛡️ استخدمنا الأيقونات الآمنة والموجودة مسبقاً في مشروعك لتفادي الشاشة البيضاء
import { Library, FileText, Banknote, Trash2, Undo, Printer } from 'lucide-react'; 

export default function AccountingArchiveTab({ archivedOrders, refreshData }) {
  
  // 🛡️ حماية ضد الشاشة البيضاء: التأكد من أن المتغير مصفوفة صالحة قبل تنفيذ أي عملية
  if (!archivedOrders || !Array.isArray(archivedOrders) || archivedOrders.length === 0) {
    return (
      <div className="bg-black/40 border border-indigo-500/30 rounded-3xl p-10 text-center text-indigo-300/50 font-bold text-lg border-dashed">
        أرشيف الحسابات فارغ. لم يتم إنشاء أي فواتير تحاسب بعد! 📁
      </div>
    );
  }

  // 1. تجميع الطلبات حسب رقم الفاتورة 
  const groupedInvoices = archivedOrders.reduce((acc, order) => {
    const ref = order.settlement_ref || 'بدون_رقم';
    if (!acc[ref]) {
      acc[ref] = {
        orders: [],
        totalRevenue: 0,
        totalDeliveryCost: 0,
        totalOriginalCost: 0,
        totalIncentive: 0, 
        date: order.created_at
      };
    }
    acc[ref].orders.push(order);
    
    acc[ref].totalRevenue += parseFloat(order.total_price) || 0;
    acc[ref].totalOriginalCost += parseFloat(order.original_price) || 0;
    acc[ref].totalDeliveryCost += parseFloat(order.delivery_cost) || 0;
    acc[ref].totalIncentive += parseFloat(order.incentive) || 0; 
    
    return acc;
  }, {});

  const invoicesArray = Object.entries(groupedInvoices).map(([ref, data]) => ({
    ref,
    ...data,
    netProfit: data.totalRevenue - (data.totalOriginalCost + data.totalDeliveryCost),
    totalShopRequired: data.totalOriginalCost - data.totalIncentive 
  }));

  // ==========================================
  // 🖨️ دالة طباعة الفاتورة العامة 
  // ==========================================
  const handlePrintInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    const invoiceDate = new Date(invoice.date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });

    const tableRows = invoice.orders.map((order, index) => {
      const orderProfit = (parseFloat(order.total_price) || 0) - ((parseFloat(order.original_price) || 0) + (parseFloat(order.delivery_cost) || 0));
      return `
        <tr>
          <td>${index + 1}</td>
          <td dir="ltr" style="font-family: monospace;">${order.tracking_number || '-'}</td>
          <td>${order.customer_name} ${order.order_type === 'replacement' ? '(استبدال)' : ''}</td>
          <td dir="ltr">${order.original_price || 0}</td>
          <td dir="ltr">${order.delivery_cost || 0}</td>
          <td dir="ltr">${order.total_price || 0}</td>
          <td dir="ltr" style="font-weight: bold; color: ${orderProfit >= 0 ? '#059669' : '#dc2626'};">${orderProfit > 0 ? '+' : ''}${orderProfit}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html dir="rtl">
      <head>
        <title>فاتورة تحاسب عامة - ${invoice.ref}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #111827; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info h1 { margin: 0; color: #4f46e5; font-size: 28px; font-weight: 900; }
          .company-info p { margin: 5px 0 0 0; color: #6b7280; font-size: 16px; }
          .invoice-details { text-align: left; }
          .invoice-details h2 { margin: 0 0 10px 0; font-size: 20px; color: #374151; }
          .invoice-details h2 span { color: #4f46e5; }
          .invoice-details p { margin: 0; color: #6b7280; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #d1d5db; padding: 12px; text-align: right; }
          th { background-color: #f3f4f6; color: #374151; font-weight: bold; font-size: 14px; }
          td { font-size: 14px; }
          .summary-container { display: flex; justify-content: flex-end; }
          .summary { width: 350px; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #4b5563; }
          .summary-row.total { font-weight: 900; font-size: 20px; color: #4f46e5; border-top: 2px dashed #d1d5db; padding-top: 15px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 50px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div class="company-info">
            <h1>نظام إدارة التوصيل</h1>
            <p>كشف حساب مالي نهائي للطلبات الواصلة</p>
          </div>
          <div class="invoice-details">
            <h2>رقم الفاتورة: <span dir="ltr">${invoice.ref}</span></h2>
            <p>تاريخ الإنشاء: ${invoiceDate}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ت</th>
              <th>رقم الوصل</th>
              <th>العميل</th>
              <th>سعر التكلفة</th>
              <th>أجور التوصيل</th>
              <th>المبلغ المُحصل (البيع)</th>
              <th>صافي الربح</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="summary-container">
          <div class="summary">
            <div class="summary-row">
              <span>إجمالي المبالغ المُحصلة:</span>
              <span dir="ltr" style="font-weight: bold; color: #111827;">${invoice.totalRevenue}</span>
            </div>
            <div class="summary-row">
              <span>إجمالي التكلفة (رأس المال):</span>
              <span dir="ltr">${invoice.totalOriginalCost}</span>
            </div>
            <div class="summary-row">
              <span>إجمالي أجور التوصيل:</span>
              <span dir="ltr">${invoice.totalDeliveryCost}</span>
            </div>
            <div class="summary-row total">
              <span>صافي الأرباح:</span>
              <span dir="ltr">${invoice.netProfit > 0 ? '+' : ''}${invoice.netProfit}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>تم إصدار هذا الكشف آلياً من النظام. جميع الحقوق محفوظة.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ==========================================
  // 🖨️ دالة طباعة الفاتورة الخاصة للمحل 
  // ==========================================
  const handlePrintShopInvoice = (invoice) => {
    const printWindow = window.open('', '_blank');
    const invoiceDate = new Date(invoice.date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });

    const tableRows = invoice.orders.map((order, index) => {
      const originalCost = parseFloat(order.original_price) || 0;
      const incentive = parseFloat(order.incentive) || 0;
      const shopRequired = originalCost - incentive;
      
      return `
        <tr>
          <td>${index + 1}</td>
          <td dir="ltr" style="font-family: monospace;">${order.tracking_number || '-'}</td>
          <td>${order.customer_name} ${order.order_type === 'replacement' ? '(استبدال)' : ''}</td>
          <td dir="ltr">${originalCost}</td>
          <td dir="ltr">${incentive}</td>
          <td dir="ltr" style="font-weight: bold; color: #7e22ce;">${shopRequired}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html dir="rtl">
      <head>
        <title>فاتورة المحل - ${invoice.ref}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
          body { font-family: 'Tajawal', sans-serif; padding: 40px; color: #111827; background: white; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #7e22ce; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info h1 { margin: 0; color: #7e22ce; font-size: 28px; font-weight: 900; }
          .company-info p { margin: 5px 0 0 0; color: #6b7280; font-size: 16px; font-weight: bold; }
          .invoice-details { text-align: left; }
          .invoice-details h2 { margin: 0 0 10px 0; font-size: 20px; color: #374151; }
          .invoice-details h2 span { color: #7e22ce; }
          .invoice-details p { margin: 0; color: #6b7280; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #d1d5db; padding: 12px; text-align: right; }
          th { background-color: #f3f4f6; color: #374151; font-weight: bold; font-size: 14px; }
          td { font-size: 14px; }
          .summary-container { display: flex; justify-content: flex-end; }
          .summary { width: 350px; background-color: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px; color: #4b5563; }
          .summary-row.total { font-weight: 900; font-size: 20px; color: #7e22ce; border-top: 2px dashed #d1d5db; padding-top: 15px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 50px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          @media print {
            body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div class="company-info">
            <h1>فاتورة التحاسب الخاصة بالمحل</h1>
            <p>كشف تفصيلي بتكلفة البضاعة والمبالغ المطلوبة للمحل</p>
          </div>
          <div class="invoice-details">
            <h2>رقم الفاتورة: <span dir="ltr">${invoice.ref}</span></h2>
            <p>تاريخ الإنشاء: ${invoiceDate}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ت</th>
              <th>رقم الوصل</th>
              <th>العميل</th>
              <th>سعر التكلفة (رأس المال)</th>
              <th>مبلغ الحافز (يُخصم)</th>
              <th>المطلوب للمحل</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="summary-container">
          <div class="summary">
            <div class="summary-row">
              <span>إجمالي سعر التكلفة:</span>
              <span dir="ltr" style="font-weight: bold; color: #111827;">${invoice.totalOriginalCost}</span>
            </div>
            <div class="summary-row">
              <span>إجمالي الحوافز (خصم):</span>
              <span dir="ltr" style="color: #dc2626;">- ${invoice.totalIncentive}</span>
            </div>
            <div class="summary-row total">
              <span>إجمالي المطلوب للمحل:</span>
              <span dir="ltr">${invoice.totalShopRequired}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>تم إصدار هذا الكشف آلياً من النظام لأغراض المحاسبة الداخلية. جميع الحقوق محفوظة.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleRevertInvoice = async (invoiceRef) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من فك ارتباط الفاتورة رقم (${invoiceRef})؟\nسيتم إرجاع جميع طلباتها إلى "سجل الواصل".`);
    if (!isConfirmed) return;

    const doubleCheck = window.prompt(`لتأكيد فك الفاتورة وإرجاع الطلبات، يرجى كتابة رقم الفاتورة المطابق: ${invoiceRef}`);
    if (doubleCheck !== invoiceRef) { alert("❌ لم يتطابق رقم الفاتورة، تم الإلغاء."); return; }

    const { error } = await supabase.from('orders').update({ status: 'delivered', settlement_ref: null }).eq('settlement_ref', invoiceRef);
    if (!error) { alert("تم إرجاع الطلبات لسجل الواصل بنجاح! ↩️"); if (refreshData) refreshData(); else window.location.reload(); } 
    else alert("خطأ أثناء الإرجاع: " + error.message);
  };

  const handlePermanentDelete = async (invoiceRef) => {
    const isConfirmed = window.confirm(`⚠️ تحذير خطير ⚠️\nهل أنت متأكد من الحذف النهائي للفاتورة رقم (${invoiceRef})؟\nهذا الإجراء لا يمكن التراجع عنه!`);
    if (!isConfirmed) return;

    const doubleCheck = window.prompt(`لتأكيد الحذف النهائي، يرجى كتابة رقم الفاتورة المطابق: ${invoiceRef}`);
    if (doubleCheck !== invoiceRef) { alert("❌ لم يتطابق رقم الفاتورة، تم الإلغاء."); return; }

    const { error } = await supabase.from('orders').delete().eq('settlement_ref', invoiceRef);
    if (!error) { alert("تم حذف الفاتورة وطلباتها نهائياً! 🗑️"); if (refreshData) refreshData(); else window.location.reload(); } 
    else alert("خطأ أثناء الحذف: " + error.message);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {invoicesArray.map((invoice) => (
        <div key={invoice.ref} className="bg-gradient-to-br from-indigo-900/20 to-black/60 border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl relative group">
          
          <div className="absolute top-4 left-4 flex gap-2 z-10">
              
              {/* 🖨️ زر طباعة فاتورة المحل (بنفسجي مع أيقونة Banknote الآمنة) */}
              <button 
                onClick={() => handlePrintShopInvoice(invoice)}
                className="bg-purple-500/20 hover:bg-purple-600 text-purple-400 hover:text-white p-2.5 rounded-xl transition-all shadow-lg border border-purple-500/30"
                title="طباعة كشف حساب المحل (المطلوب للمحل)"
              >
                <Banknote className="w-5 h-5" />
              </button>

              {/* 🖨️ زر طباعة الفاتورة العامة (أزرق) */}
              <button 
                onClick={() => handlePrintInvoice(invoice)}
                className="bg-sky-500/20 hover:bg-sky-600 text-sky-400 hover:text-white p-2.5 rounded-xl transition-all shadow-lg border border-sky-500/30"
                title="طباعة الفاتورة العامة الشاملة"
              >
                <Printer className="w-5 h-5" />
              </button>

              <button 
                onClick={() => handleRevertInvoice(invoice.ref)}
                className="bg-amber-500/20 hover:bg-amber-600 text-amber-400 hover:text-white p-2.5 rounded-xl transition-all shadow-lg border border-amber-500/30"
                title="فك التحاسب وإرجاع الطلبات للسجل"
              >
                <Undo className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => handlePermanentDelete(invoice.ref)}
                className="bg-rose-500/20 hover:bg-rose-600 text-rose-400 hover:text-white p-2.5 rounded-xl transition-all shadow-lg border border-rose-500/30"
                title="حذف الفاتورة نهائياً من النظام!"
              >
                <Trash2 className="w-5 h-5" />
              </button>
          </div>

          <div className="bg-indigo-900/40 p-5 border-b border-indigo-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
                  <Library className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-wider flex items-center gap-2 mt-2 md:mt-0">
                     فاتورة تحاسب: <span className="text-indigo-300 font-mono" dir="ltr">{invoice.ref}</span>
                  </h3>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                     <FileText className="w-4 h-4"/> عدد الطلبات: {invoice.orders.length}
                  </p>
                </div>
             </div>
             
             <div className="flex gap-4 bg-black/40 p-3 rounded-2xl border border-white/5 md:mr-auto md:ml-36">
                <div className="text-center px-3 border-l border-white/10">
                   <p className="text-xs text-gray-400 mb-1">المطلوب للمحل</p>
                   <p className="font-bold text-purple-400" dir="ltr">{invoice.totalShopRequired}</p>
                </div>
                <div className="text-center px-3 border-l border-white/10">
                   <p className="text-xs text-gray-400 mb-1">الإجمالي المُحصل</p>
                   <p className="font-bold text-white" dir="ltr">{invoice.totalRevenue}</p>
                </div>
                <div className="text-center px-3">
                   <p className="text-xs text-indigo-300 mb-1">صافي الربح</p>
                   <p className="font-black text-indigo-400 text-lg" dir="ltr">{invoice.netProfit > 0 ? '+' : ''}{invoice.netProfit}</p>
                </div>
             </div>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm text-right text-gray-300">
              <thead className="text-xs text-indigo-300 uppercase border-b border-indigo-500/20">
                <tr>
                  <th className="px-4 py-3 font-bold">رقم الوصل</th>
                  <th className="px-4 py-3 font-bold">العميل</th>
                  <th className="px-4 py-3 font-bold text-center">التكلفة</th>
                  <th className="px-4 py-3 font-bold text-center">الحافز</th>
                  <th className="px-4 py-3 font-bold text-center">للمحل</th>
                  <th className="px-4 py-3 font-bold text-center">الربح</th>
                </tr>
              </thead>
              <tbody>
                {invoice.orders.map((order) => {
                   const originalCost = parseFloat(order.original_price) || 0;
                   const incentive = parseFloat(order.incentive) || 0;
                   const shopReq = originalCost - incentive;
                   const orderProfit = (parseFloat(order.total_price) || 0) - (originalCost + (parseFloat(order.delivery_cost) || 0));
                   
                   return (
                     <tr key={order.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 font-mono text-white" dir="ltr">{order.tracking_number || '-'}</td>
                        <td className="px-4 py-3 font-bold text-indigo-200">{order.customer_name}</td>
                        <td className="px-4 py-3 text-center">{originalCost}</td>
                        <td className="px-4 py-3 text-center">{incentive}</td>
                        <td className="px-4 py-3 text-center font-bold text-purple-400">{shopReq}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-400" dir="ltr">{orderProfit > 0 ? '+' : ''}{orderProfit}</td>
                     </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}