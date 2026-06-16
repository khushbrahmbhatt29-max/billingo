import React, { useRef } from 'react';
import { Download, Upload, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { db } from '../db/db';

export function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    try {
      const customers = await db.customers.toArray();
      const products = await db.products.toArray();
      const invoices = await db.invoices.toArray();

      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
          customers,
          products,
          invoices
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Shree_Brahmani_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Failed to generate backup.');
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data || !json.data.customers || !json.data.products || !json.data.invoices) {
          throw new Error('Invalid backup file format');
        }

        const confirmRestore = window.confirm(
          'WARNING: Restoring from a backup will OVERWRITE ALL CURRENT DATA in this application. Are you absolutely sure you want to proceed?'
        );

        if (!confirmRestore) return;

        await db.transaction('rw', db.customers, db.products, db.invoices, async () => {
          await db.customers.clear();
          await db.products.clear();
          await db.invoices.clear();

          if (json.data.customers.length > 0) await db.customers.bulkAdd(json.data.customers);
          if (json.data.products.length > 0) await db.products.bulkAdd(json.data.products);
          if (json.data.invoices.length > 0) await db.invoices.bulkAdd(json.data.invoices);
        });

        alert('Backup restored successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Restore failed:', error);
        alert('Failed to restore backup. Make sure the file is valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-slate-800">Settings & Backup</h2>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Backup Data</h3>
              <p className="text-sm text-slate-500">Download a full copy of your database (Invoices, Customers, Products) safely to your computer.</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <button 
            onClick={handleBackup}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Download Full Backup JSON</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 border-t-amber-500">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Upload className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Restore Data</h3>
              <p className="text-sm text-slate-500">Restore your entire database from a previously downloaded backup JSON file.</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 text-amber-800 p-4 rounded-lg flex items-start space-x-3 text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p><strong>Warning:</strong> Restoring data will completely erase your current invoices, customers, and products, replacing them with the contents of the backup file. It is recommended to download a current backup before restoring an old one.</p>
          </div>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <button 
            onClick={handleRestoreClick}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Upload className="w-5 h-5" />
            <span>Select Backup File to Restore</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden border-t-4 border-t-emerald-500">
        <div className="p-6 border-b border-slate-200 bg-emerald-50">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Security Active</h3>
              <p className="text-sm text-emerald-700">App Lock is enabled.</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-sm">Your application is currently protected by a master admin password. Unauthorized users cannot access your billing data unless they know the password.</p>
        </div>
      </div>
    </div>
  );
}
