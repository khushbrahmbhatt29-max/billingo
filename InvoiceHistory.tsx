import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Invoice } from '../db/db';
import { Printer, Copy } from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceHistoryProps {
  onClone: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
}

export function InvoiceHistory({ onClone, onView }: InvoiceHistoryProps) {
  const invoices = useLiveQuery(() => db.invoices.reverse().sortBy('invoiceNumber'));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Invoice History</h2>
          <p className="text-slate-500 text-sm mt-1">View past generated invoices</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs">
            <tr>
              <th className="px-6 py-4">Inv No.</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {invoices?.map(inv => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-mono font-medium text-slate-900">#{inv.invoiceNumber.toString().padStart(4, '0')}</td>
                <td className="px-6 py-4">{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{inv.customerDetails.name}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-900">₹{inv.grandTotal.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => onView(inv)} className="text-slate-400 hover:text-emerald-500 mx-2 transition-colors" title="View / Print">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => onClone(inv)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Clone Invoice">
                    <Copy className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {invoices?.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No invoices found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
