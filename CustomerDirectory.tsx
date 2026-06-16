import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Customer, type Invoice } from '../db/db';
import { Plus, Trash2, Edit2, History, X, Copy } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerDirectoryProps {
  onClone?: (invoice: Invoice) => void;
  onView?: (invoice: Invoice) => void;
}

export function CustomerDirectory({ onClone, onView }: CustomerDirectoryProps) {
  const customers = useLiveQuery(() => db.customers.toArray());
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

  const customerInvoices = useLiveQuery(
    () => selectedCustomerForHistory ? db.invoices.where('customerId').equals(selectedCustomerForHistory.id!).reverse().sortBy('date') : [],
    [selectedCustomerForHistory]
  );

  const totalOrders = customerInvoices?.length || 0;
  const lifetimeRevenue = customerInvoices?.reduce((sum, inv) => sum + inv.grandTotal, 0) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.address && formData.stateCode && formData.gstin) {
      if (formData.id) {
        await db.customers.update(formData.id, formData);
      } else {
        await db.customers.add(formData as Customer);
      }
      setIsAdding(false);
      setFormData({});
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Delete this customer?')) {
      await db.customers.delete(id);
      if (selectedCustomerForHistory?.id === id) setSelectedCustomerForHistory(null);
    }
  };

  const handleEdit = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setFormData(customer);
    setIsAdding(true);
  };

  return (
    <div className="p-8 h-full flex relative overflow-hidden">
      <div className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${selectedCustomerForHistory ? 'pr-6 w-2/3' : 'w-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Customer Directory</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your clients and billing details</p>
          </div>
          <button
            onClick={() => { setIsAdding(true); setFormData({}); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>

        {isAdding && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-800">{formData.id ? 'Edit' : 'New'} Customer</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                <input required type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                <input required type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none uppercase"
                  value={formData.gstin || ''} onChange={e => setFormData({...formData, gstin: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input required type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number (Optional)</label>
                <input type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">State Code</label>
                <input required type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={formData.stateCode || ''} onChange={e => setFormData({...formData, stateCode: e.target.value})} />
              </div>
              <div className="col-span-2 flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Cancel</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm">Save</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">GSTIN</th>
                <th className="px-6 py-4">State Code</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers?.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCustomerForHistory(c)}
                  className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedCustomerForHistory?.id === c.id ? 'bg-emerald-50' : ''}`}
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                  <td className="px-6 py-4 font-mono">{c.gstin}</td>
                  <td className="px-6 py-4">{c.stateCode}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => handleEdit(e, c)} className="text-slate-400 hover:text-emerald-500 mx-2 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDelete(e, c.id!)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {customers?.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No customers found. Add one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer History Slide-out Panel */}
      {selectedCustomerForHistory && (
        <div className="w-96 bg-white border-l border-slate-200 shadow-xl absolute right-0 inset-y-0 flex flex-col animate-in slide-in-from-right-8 duration-300 z-20">
          <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <History className="w-5 h-5 mr-2 text-emerald-600" /> 
                Customer History
              </h3>
              <p className="text-sm font-medium text-slate-600 mt-1 uppercase truncate w-64" title={selectedCustomerForHistory.name}>
                {selectedCustomerForHistory.name}
              </p>
            </div>
            <button onClick={() => setSelectedCustomerForHistory(null)} className="text-slate-400 hover:text-slate-800 bg-white p-1 rounded-full shadow-sm border border-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 border-b border-slate-200 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-2xl font-black text-emerald-900">{totalOrders}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">Lifetime Revenue</p>
              <p className="text-xl font-black text-blue-900 font-mono">₹{lifetimeRevenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">Past Transactions</h4>
            <div className="space-y-4">
              {customerInvoices?.map(inv => (
                <div 
                  key={inv.id} 
                  onClick={() => onView && onView(inv)}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-300 transition-colors relative group cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800 font-mono text-sm">#{inv.invoiceNumber.toString().padStart(4, '0')}</span>
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{format(new Date(inv.date), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="text-[13px] text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                    {inv.items.map(i => i.productName).join(', ')}
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-900 font-mono text-[15px]">₹{inv.grandTotal.toFixed(2)}</span>
                    {onClone && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onClone(inv); }} 
                        className="text-xs flex items-center space-x-1.5 text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors font-bold shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Clone</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {customerInvoices?.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No previous orders found for this customer.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
