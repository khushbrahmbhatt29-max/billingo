import { FileText, History, Users, Package, BarChart3, Settings } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const navItems = [
  { id: 'new-invoice', label: 'New Invoice', icon: FileText },
  { id: 'history', label: 'Invoice History', icon: History },
  { id: 'customers', label: 'Customer Directory', icon: Users },
  { id: 'products', label: 'Product Catalog', icon: Package },
  { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings & Backup', icon: Settings },
];

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col no-print">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-emerald-400">Billing Pro</h1>
        <p className="text-xs text-slate-400 mt-1">Shree Brahmani Enterprise</p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={clsx(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        v1.0.0
      </div>
    </div>
  );
}
