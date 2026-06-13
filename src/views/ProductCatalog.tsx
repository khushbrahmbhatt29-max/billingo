import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Product } from '../db/db';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export function ProductCatalog() {
  const products = useLiveQuery(() => db.products.toArray());
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.hsn && formData.uom && formData.rate) {
      if (formData.id) {
        await db.products.update(formData.id, formData);
      } else {
        await db.products.add(formData as Product);
      }
      setIsAdding(false);
      setFormData({});
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this product?')) {
      await db.products.delete(id);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setIsAdding(true);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Product Catalog</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your items and default rates</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setFormData({ uom: 'Nos' }); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 animate-in slide-in-from-top-4 fade-in duration-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">{formData.id ? 'Edit' : 'New'} Product</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input required type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">HSN Code</label>
              <input required type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                value={formData.hsn || ''} onChange={e => setFormData({...formData, hsn: e.target.value})} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">UOM (Unit of Measure)</label>
              <input required type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                value={formData.uom || ''} onChange={e => setFormData({...formData, uom: e.target.value})} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Rate (₹)</label>
              <input required type="number" step="0.01" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                value={formData.rate || ''} onChange={e => setFormData({...formData, rate: parseFloat(e.target.value)})} />
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
              <th className="px-6 py-4">Item Name</th>
              <th className="px-6 py-4">HSN</th>
              <th className="px-6 py-4">UOM</th>
              <th className="px-6 py-4 text-right">Rate</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products?.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                <td className="px-6 py-4 font-mono">{p.hsn}</td>
                <td className="px-6 py-4">{p.uom}</td>
                <td className="px-6 py-4 text-right font-medium text-slate-900">₹{p.rate.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(p)} className="text-slate-400 hover:text-emerald-500 mx-2 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id!)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products?.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No products found. Add one to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
