import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { NewInvoice } from './views/NewInvoice'
import { InvoiceHistory } from './views/InvoiceHistory'
import { CustomerDirectory } from './views/CustomerDirectory'
import { ProductCatalog } from './views/ProductCatalog'
import { SalesAnalytics } from './views/SalesAnalytics'
import { Settings } from './views/Settings'
import { Login } from './components/Login'
import { seedDatabase, type Invoice } from './db/db'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeView, setActiveView] = useState('new-invoice')
  const [clonedInvoice, setClonedInvoice] = useState<Invoice | null>(null)
  const [viewOnlyInvoice, setViewOnlyInvoice] = useState<boolean>(false)
  const [isDbSeeded, setIsDbSeeded] = useState(false)

  useEffect(() => {
    seedDatabase().then(() => setIsDbSeeded(true))
  }, [])

  const handleClone = (invoice: Invoice) => {
    setClonedInvoice(invoice)
    setViewOnlyInvoice(false)
    setActiveView('new-invoice')
  }

  const handleView = (invoice: Invoice) => {
    setClonedInvoice(invoice)
    setViewOnlyInvoice(true)
    setActiveView('new-invoice')
  }

  const handleClearClone = () => {
    setClonedInvoice(null)
    setViewOnlyInvoice(false)
  }

  if (!isAuthenticated) {
    return <Login onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (!isDbSeeded) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500">Loading Database...</p></div>
  }

  return (
    <Layout activeView={activeView} setActiveView={(v) => {
      setActiveView(v);
      if (v !== 'new-invoice') {
        handleClearClone();
      }
    }}>
      {activeView === 'new-invoice' && (
        <NewInvoice 
          clonedInvoice={clonedInvoice} 
          viewOnly={viewOnlyInvoice} 
          onClearClone={handleClearClone} 
        />
      )}
      {activeView === 'history' && <InvoiceHistory onClone={handleClone} onView={handleView} />}
      {activeView === 'customers' && <CustomerDirectory onClone={handleClone} onView={handleView} />}
      {activeView === 'products' && <ProductCatalog />}
      {activeView === 'analytics' && <SalesAnalytics />}
      {activeView === 'settings' && <Settings />}
    </Layout>
  )
}

export default App
