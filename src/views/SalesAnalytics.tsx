import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { BarChart3 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function SalesAnalytics() {
  const invoices = useLiveQuery(() => db.invoices.toArray());

  const analytics = useMemo(() => {
    if (!invoices) return [];

    const grouped = invoices.reduce((acc, inv) => {
      // Parse 'YYYY-MM-DD' into 'YYYY-MM'
      const monthBucket = inv.date.substring(0, 7); 
      
      if (!acc[monthBucket]) {
        acc[monthBucket] = {
          monthKey: monthBucket,
          totalInvoices: 0,
          totalTaxable: 0,
          totalRevenue: 0
        };
      }
      
      acc[monthBucket].totalInvoices += 1;
      acc[monthBucket].totalTaxable += inv.subTotal;
      acc[monthBucket].totalRevenue += inv.grandTotal;
      
      return acc;
    }, {} as Record<string, { monthKey: string; totalInvoices: number; totalTaxable: number; totalRevenue: number }>);

    // Convert to array and sort descending by monthKey
    return Object.values(grouped).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [invoices]);

  const totals = useMemo(() => {
    return analytics.reduce((acc, curr) => {
      acc.totalInvoices += curr.totalInvoices;
      acc.totalTaxable += curr.totalTaxable;
      acc.totalRevenue += curr.totalRevenue;
      return acc;
    }, { totalInvoices: 0, totalTaxable: 0, totalRevenue: 0 });
  }, [analytics]);

  const formatMonth = (monthKey: string) => {
    // monthKey is YYYY-MM
    try {
      return format(parseISO(`${monthKey}-01`), 'MMMM yyyy');
    } catch {
      return monthKey;
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center">
            <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
            Month-Wise Sales Summary
          </h2>
          <p className="text-slate-500 text-sm mt-1">Aggregated financial performance metrics</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 relative">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4 text-center">Invoices Issued</th>
                <th className="px-6 py-4 text-right">Taxable Amount</th>
                <th className="px-6 py-4 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analytics.map(row => (
                <tr key={row.monthKey} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{formatMonth(row.monthKey)}</td>
                  <td className="px-6 py-4 text-center">{row.totalInvoices}</td>
                  <td className="px-6 py-4 text-right font-mono">₹{row.totalTaxable.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-700">₹{row.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
              {analytics.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No sales data available.</td>
                </tr>
              )}
            </tbody>
            {analytics.length > 0 && (
              <tfoot className="bg-slate-800 text-white font-bold sticky bottom-0 z-10">
                <tr>
                  <td className="px-6 py-4 uppercase">TOTALS</td>
                  <td className="px-6 py-4 text-center">{totals.totalInvoices}</td>
                  <td className="px-6 py-4 text-right font-mono">₹{totals.totalTaxable.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono text-emerald-400">₹{totals.totalRevenue.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
