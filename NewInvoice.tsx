import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LineItem, type Invoice } from '../db/db';
import { Plus, Trash2, Printer, Save, Copy, X } from 'lucide-react';
import { numberToWords } from '../utils/numberToWords';
import { format } from 'date-fns';

interface NewInvoiceProps {
  clonedInvoice?: Invoice | null;
  onClearClone?: () => void;
  viewOnly?: boolean;
}

export function NewInvoice({ clonedInvoice, onClearClone, viewOnly }: NewInvoiceProps) {
  const customers = useLiveQuery(() => db.customers.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const recentInvoices = useLiveQuery(() => db.invoices.reverse().limit(10).toArray());

  const [invoiceNumber, setInvoiceNumber] = useState<number>(1);
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [transportMode, setTransportMode] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [showCloneDrawer, setShowCloneDrawer] = useState(false);

  const selectedCustomer = useMemo(() => {
    return customers?.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (!viewOnly && !clonedInvoice) {
      db.invoices.orderBy('invoiceNumber').last().then(lastInv => {
        setInvoiceNumber(lastInv ? lastInv.invoiceNumber + 1 : 1);
      });
    }
  }, [viewOnly, clonedInvoice]);

  useEffect(() => {
    if (clonedInvoice) {
      if (!viewOnly) {
        db.invoices.orderBy('invoiceNumber').last().then(lastInv => {
          setInvoiceNumber(lastInv ? lastInv.invoiceNumber + 1 : 1);
        });
        setDate(format(new Date(), 'yyyy-MM-dd'));
      } else {
        setInvoiceNumber(clonedInvoice.invoiceNumber);
        setDate(clonedInvoice.date);
      }
      setSelectedCustomerId(clonedInvoice.customerId);
      setItems(clonedInvoice.items.map(item => ({ ...item })));
      setTransportMode(clonedInvoice.transportMode || '');
      setVehicleNumber(clonedInvoice.vehicleNumber || '');
      setMobileNumber(clonedInvoice.customerDetails.mobile || '');
    }
  }, [clonedInvoice, viewOnly]);

  // Auto-fill mobile when a new customer is selected (but not if viewing/cloning)
  useEffect(() => {
    if (selectedCustomer && !clonedInvoice && !viewOnly) {
      setMobileNumber(selectedCustomer.mobile || '');
    }
  }, [selectedCustomer]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : '');
  };

  const handleAddItem = () => {
    if (items.length >= 5) return alert('Maximum 5 products allowed per bill.');
    setItems([...items, { productId: 0, productName: '', hsn: '', uom: '', rate: 0, qty: 1, total: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'productId') {
      const product = products?.find(p => p.id === parseInt(value));
      if (product) {
        item.productId = product.id!;
        item.productName = product.name;
        item.hsn = product.hsn;
        item.uom = product.uom;
        item.rate = product.rate;
      } else {
        item.productId = 0;
      }
    } else {
      (item as any)[field] = value;
    }

    item.total = item.rate * item.qty;
    setItems(newItems);
  };

  const subTotal = items.reduce((sum, item) => sum + item.total, 0);
  const sgst = parseFloat((subTotal * 0.09).toFixed(2));
  const cgst = parseFloat((subTotal * 0.09).toFixed(2));
  const grandTotalRaw = subTotal + sgst + cgst;
  const grandTotal = Math.round(grandTotalRaw);
  const roundOff = parseFloat((grandTotal - grandTotalRaw).toFixed(2));
  const amountInWords = numberToWords(grandTotal);

  const handleSave = async () => {
    if (!selectedCustomer) return alert('Please select a customer.');
    if (items.length === 0) return alert('Please add at least one line item.');

    const invoice: Invoice = {
      invoiceNumber,
      date,
      customerId: selectedCustomer.id!,
      customerDetails: { ...selectedCustomer, mobile: mobileNumber },
      items,
      subTotal,
      sgst,
      cgst,
      roundOff,
      grandTotal,
      amountInWords,
      transportMode,
      vehicleNumber
    };

    await db.invoices.add(invoice);
    alert('Invoice Saved Successfully!');
    if (onClearClone) onClearClone();
    setSelectedCustomerId('');
    setItems([]);
    setTransportMode('');
    setVehicleNumber('');
    setMobileNumber('');
    db.invoices.orderBy('invoiceNumber').last().then(lastInv => {
      setInvoiceNumber(lastInv ? lastInv.invoiceNumber + 1 : 1);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloneDrawerItem = (inv: Invoice) => {
    setSelectedCustomerId(inv.customerId);
    setItems(inv.items.map(item => ({ ...item })));
    setTransportMode(inv.transportMode || '');
    setVehicleNumber(inv.vehicleNumber || '');
    setMobileNumber(inv.customerDetails.mobile || '');
    setShowCloneDrawer(false);
  };

  return (
    <div className="flex h-full relative">
      {/* LEFT: INPUT FORM */}
      <div className={`w-[60%] p-6 overflow-y-auto border-r border-slate-200 no-print transition-all duration-300 ${viewOnly ? 'hidden' : 'block'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {clonedInvoice && !viewOnly ? 'Clone Invoice' : 'New Invoice'}
          </h2>
          <button onClick={() => setShowCloneDrawer(true)} className="flex items-center space-x-1 text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <Copy className="w-4 h-4" />
            <span>Repeat Past Order</span>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4 border-b pb-2">Customer & Transport Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Customer</label>
                <select 
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2"
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                >
                  <option value="">-- Select Customer --</option>
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Date</label>
                <input type="date" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <input type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Transport Mode</label>
                <input type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={transportMode} onChange={e => setTransportMode(e.target.value)} placeholder="e.g. By Road" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number</label>
                <input type="text" className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 border p-2 outline-none"
                  value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. GJ05 XX 1234" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="font-semibold text-slate-800">Line Items</h3>
              <button onClick={handleAddItem} className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex space-x-2 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Product</label>
                    <select 
                      className="w-full rounded-md border-slate-300 shadow-sm border p-2 text-sm outline-none"
                      value={item.productId || ''}
                      onChange={e => handleItemChange(index, 'productId', e.target.value)}
                    >
                      <option value="">Select...</option>
                      {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-20 shrink-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">HSN</label>
                    <input type="text" readOnly value={item.hsn} className="w-full rounded-md border-slate-300 shadow-sm border p-2 bg-slate-100 text-sm outline-none" />
                  </div>
                  <div className="w-16 shrink-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
                    <input type="number" min="1" value={item.qty} onChange={e => handleItemChange(index, 'qty', parseInt(e.target.value) || 0)} className="w-full rounded-md border-slate-300 shadow-sm border p-2 text-sm outline-none" />
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Rate</label>
                    <input type="number" step="0.01" value={item.rate} onChange={e => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)} className="w-full rounded-md border-slate-300 shadow-sm border p-2 text-sm outline-none" />
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total</label>
                    <input type="text" readOnly value={item.total.toFixed(2)} className="w-full rounded-md border-slate-300 shadow-sm border p-2 bg-slate-100 text-sm font-medium outline-none" />
                  </div>
                  <button onClick={() => handleRemoveItem(index)} className="p-2 text-slate-400 hover:text-red-500 mb-0.5 shrink-0 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-sm text-slate-500 py-4">No items added.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* CLONE DRAWER */}
      {showCloneDrawer && (
        <div className="absolute inset-y-0 left-0 w-80 bg-white border-r border-slate-200 shadow-2xl z-10 no-print flex flex-col animate-in slide-in-from-left-4 duration-300">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center"><Copy className="w-4 h-4 mr-2 text-emerald-600" /> Clone Past Order</h3>
            <button onClick={() => setShowCloneDrawer(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {recentInvoices?.map(inv => (
              <div key={inv.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all" onClick={() => handleCloneDrawerItem(inv)}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-slate-800">#{inv.invoiceNumber.toString().padStart(4, '0')}</span>
                  <span className="text-xs text-slate-500">{format(new Date(inv.date), 'dd MMM yyyy')}</span>
                </div>
                <div className="text-sm text-slate-600 truncate">{inv.customerDetails.name}</div>
                <div className="text-xs font-bold text-emerald-700 mt-2">₹{inv.grandTotal.toFixed(2)}</div>
              </div>
            ))}
            {recentInvoices?.length === 0 && <p className="text-sm text-slate-500 text-center">No past invoices available.</p>}
          </div>
        </div>
      )}

      {/* RIGHT: LIVE PAPER PREVIEW */}
      <div className={`${viewOnly ? 'w-full' : 'w-[40%]'} bg-slate-400 p-8 overflow-auto print:p-0 print:bg-white print:w-full flex flex-col items-center relative`}>
        {!viewOnly && (
          <div className="absolute top-4 right-8 flex space-x-3 no-print">
            <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm transition-colors">
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm transition-colors">
              <Printer className="w-4 h-4" />
              <span>Print Tax Invoice</span>
            </button>
          </div>
        )}
        {viewOnly && (
          <div className="absolute top-4 right-8 flex space-x-3 no-print">
            {onClearClone && (
              <button onClick={onClearClone} className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm transition-colors">
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
            <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium shadow-sm transition-colors">
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        )}
        
        {/* EXACT TEMPLATE CONTAINER */}
        <div className="bg-white w-[19cm] h-[26.5cm] shrink-0 border-2 border-black print:border-2 text-black font-sans text-xs box-border flex flex-col shadow-2xl print:shadow-none mx-auto print:m-[10mm]">
          
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b-2 border-black">
            <div className="w-24 h-24 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full p-1" xmlns="http://www.w3.org/2000/svg">
                <circle cx="42" cy="42" r="36" fill="white" stroke="black" strokeWidth="8" />
                <line x1="64" y1="64" x2="70" y2="70" stroke="black" strokeWidth="8" />
                <line x1="70" y1="70" x2="88" y2="88" stroke="black" strokeWidth="18" strokeLinecap="square" />
                <text x="42" y="42" fontSize="28" fontWeight="900" fontFamily="Georgia, serif" fill="black" textAnchor="middle" dominantBaseline="central" letterSpacing="0.5">SBE</text>
              </svg>
            </div>
            <div className="flex-1 text-center pl-2">
              <h1 className="text-3xl font-extrabold uppercase tracking-tight font-serif" style={{WebkitTextStroke: '1px black', color: 'transparent', textShadow: '2px 2px 0 #000'}} >SHREE BRAHMANI ENTERPRISE</h1>
              <p className="font-bold mt-1 text-sm tracking-wide">UDYAM-GJ-22-0150680</p>
              <p className="font-bold mt-1 text-[13px] tracking-wide">101/ Surbhi Complex, Parvat Patiya, Surat, Gujarat. 395010</p>
              <p className="font-bold mt-1 text-[13px] tracking-wide flex justify-center items-center gap-6">
                <span><strong className="text-sm">✆</strong> : +91 9825152746/ 8530237399</span>
                <span><strong className="text-sm">✉</strong> : khushbarot22@gmail.com</span>
              </p>
            </div>
          </div>

          {/* GST Block */}
          <div className="flex border-b-2 border-black font-bold h-16">
            <div className="w-[45%] flex items-center justify-center text-lg border-r-2 border-black uppercase tracking-wider">
              GST NO : 24AHWPB8958M1ZG
            </div>
            <div className="w-[55%] flex flex-col text-[13px] text-center">
              <div className="border-b-2 border-black flex-1 flex items-center justify-center">Original For Recipent</div>
              <div className="border-b-2 border-black flex-1 flex items-center justify-center">Duplicate For Transporter</div>
              <div className="flex-1 flex items-center justify-center">Triplicate For Assessee</div>
            </div>
          </div>

          {/* Tax Invoice Title */}
          <div className="text-center font-bold italic text-3xl py-1.5 border-b-2 border-black">
            Tax Invoice
          </div>

          {/* Meta Block */}
          <div className="flex border-b-2 border-black font-bold text-[13px]">
            <div className="w-1/2 border-r-2 border-black flex flex-col">
              <div className="flex border-b-2 border-black"><div className="w-1/2 p-1.5 border-r-2 border-black">Invoice No :</div><div className="w-1/2 p-1.5">{invoiceNumber.toString().padStart(3, '0')}</div></div>
              <div className="flex border-b-2 border-black"><div className="w-1/2 p-1.5 border-r-2 border-black">Invoice Date :</div><div className="w-1/2 p-1.5">{format(new Date(date), 'dd-MM-yyyy')}</div></div>
              <div className="flex border-b-2 border-black"><div className="w-1/2 p-1.5 border-r-2 border-black">Reverse Charges ( Y/N)</div><div className="w-1/2 p-1.5 text-center">N</div></div>
              <div className="flex"><div className="w-[50%] p-1.5 border-r-2 border-black flex">State : <span className="ml-auto">Gujarat</span></div><div className="p-1.5 px-3 border-r-2 border-black">Code</div><div className="p-1.5 flex-1 text-center">24</div></div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="flex border-b-2 border-black"><div className="w-1/2 p-1.5 border-r-2 border-black">Transport Mode :</div><div className="w-1/2 p-1.5">{transportMode}</div></div>
              <div className="flex border-b-2 border-black"><div className="w-1/2 p-1.5 border-r-2 border-black">Vehicle Number :</div><div className="w-1/2 p-1.5 uppercase">{vehicleNumber}</div></div>
              <div className="flex border-b-2 border-black"><div className="w-1/2 p-1.5 border-r-2 border-black">Date Of Supply :</div><div className="w-1/2 p-1.5">{format(new Date(date), 'dd-MM-yyyy')}</div></div>
              <div className="flex"><div className="w-1/2 p-1.5 border-r-2 border-black">Place Of Supply :</div><div className="w-1/2 p-1.5">Gujarat</div></div>
            </div>
          </div>

          {/* Party Block */}
          <div className="flex border-b-2 border-black h-36">
            <div className="w-1/2 border-r-2 border-black flex flex-col">
              <div className="text-center font-bold p-1.5 text-[14px] border-b-2 border-black tracking-wide">Bill To Party</div>
              <div className="p-3 flex-1 flex flex-col text-[14px]">
                <p className="font-bold text-center">M/S {selectedCustomer?.name || ''}</p>
                <p className="text-center mt-1 leading-tight">{selectedCustomer?.address || ''}</p>
              </div>
              <div className="flex font-bold border-t-2 border-black text-[13px]">
                <div className="flex-1 p-1.5 border-r-2 border-black">State : Gujarat</div>
                <div className="p-1.5 px-3 border-r-2 border-black">Code</div>
                <div className="p-1.5 w-12 text-center">24</div>
              </div>
            </div>
            <div className="w-1/2 flex flex-col">
              <div className="text-center font-bold p-1.5 text-[14px] border-b-2 border-black tracking-wide">Ship To Party</div>
              <div className="p-0 flex-1 flex flex-col text-[14px] justify-end">
                {/* Normally Ship To is same as Bill To, but template specifically places MO and GST here at the bottom */}
                <div className="border-t-2 border-black">
                  <p className="font-bold p-1.5 flex"><span className="w-16">MO:</span> {mobileNumber}</p>
                  <p className="font-bold p-1.5 border-t-2 border-black flex text-[15px]"><span className="w-16">GST :</span> {selectedCustomer?.gstin || ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table Container */}
          <div className="flex-1 flex flex-col">
            {/* Table Header */}
            <div className="flex font-bold text-center border-b-2 border-black text-[13px]">
              <div className="w-10 p-1 border-r-2 border-black flex items-center justify-center">SR<br/>NO</div>
              <div className="flex-1 p-1 border-r-2 border-black flex items-center justify-center">Description</div>
              <div className="w-12 p-1 border-r-2 border-black flex items-center justify-center">OUM</div>
              <div className="w-12 p-1 border-r-2 border-black flex items-center justify-center">QTY</div>
              <div className="w-20 p-1 border-r-2 border-black flex items-center justify-center">HSN</div>
              <div className="w-20 p-1 border-r-2 border-black flex items-center justify-center">RATE</div>
              <div className="w-24 p-1 flex items-center justify-center">Amount</div>
            </div>
            
            {/* Table Rows Wrapper (gives solid height for visual) */}
            <div className="flex-1 border-b-2 border-black flex flex-col font-bold text-[13px]">
              {items.map((item, i) => (
                <div key={i} className="flex text-center border-b border-black">
                  <div className="w-10 p-1.5 border-r-2 border-black">{i+1}</div>
                  <div className="flex-1 p-1.5 border-r-2 border-black text-left uppercase tracking-wide">{item.productName}</div>
                  <div className="w-12 p-1.5 border-r-2 border-black">{item.uom}</div>
                  <div className="w-12 p-1.5 border-r-2 border-black">{item.qty}</div>
                  <div className="w-20 p-1.5 border-r-2 border-black">{item.hsn}</div>
                  <div className="w-20 p-1.5 border-r-2 border-black">{item.rate}</div>
                  <div className="w-24 p-1.5">{item.total}</div>
                </div>
              ))}
              {/* Single stretching filler row to continue vertical borders */}
              <div className="flex text-center flex-1">
                <div className="w-10 border-r-2 border-black"></div>
                <div className="flex-1 border-r-2 border-black"></div>
                <div className="w-12 border-r-2 border-black"></div>
                <div className="w-12 border-r-2 border-black"></div>
                <div className="w-20 border-r-2 border-black"></div>
                <div className="w-20 border-r-2 border-black"></div>
                <div className="w-24"></div>
              </div>
            </div>
            
            {/* Totals Sub-block inside table container */}
            <div className="flex border-b-2 border-black font-bold text-[14px]">
              <div className="flex-1 border-r-2 border-black text-center p-1.5">Total Before Tax</div>
              <div className="w-24 p-1.5 text-center">{subTotal}</div>
            </div>
            <div className="flex border-b-2 border-black font-bold text-[14px]">
              <div className="flex-1 border-r-2 border-black text-center p-1.5">S GST</div>
              <div className="w-20 p-1.5 border-r-2 border-black text-center">9%</div>
              <div className="w-24 p-1.5 text-center">{sgst}</div>
            </div>
            <div className="flex border-b-2 border-black font-bold text-[14px]">
              <div className="flex-1 border-r-2 border-black text-center p-1.5">C GST</div>
              <div className="w-20 p-1.5 border-r-2 border-black text-center">9%</div>
              <div className="w-24 p-1.5 text-center">{cgst}</div>
            </div>
            <div className="flex border-b-2 border-black font-bold text-[14px]">
              <div className="flex-1 border-r-2 border-black text-center p-1.5">Round Off</div>
              <div className="w-24 p-1.5 text-center">{roundOff}</div>
            </div>
            <div className="flex border-b-2 border-black font-bold text-[14px]">
              <div className="flex-1 border-r-2 border-black text-center p-1.5">Total After Tax</div>
              <div className="w-24 p-1.5 text-center">{grandTotal}</div>
            </div>
          </div>

          {/* Amount In Word */}
          <div className="font-bold p-2 border-b-2 border-black text-[14px]">
            Amount ( In Word ) : {amountInWords}
          </div>

          {/* Footer */}
          <div className="flex h-36">
            <div className="w-[65%] border-r-2 border-black flex flex-col">
              <div className="font-bold text-center border-b-2 border-black p-1 text-[13px]">Bank Details</div>
              <div className="flex border-b-2 border-black text-[13px]">
                <div className="w-1/3 font-bold border-r-2 border-black p-1.5 pl-2">Bank Name :</div>
                <div className="flex-1 p-1.5 font-bold">The Sutex Co-Op. Bank LTD</div>
              </div>
              <div className="flex border-b-2 border-black text-[13px]">
                <div className="w-1/3 font-bold border-r-2 border-black p-1.5 pl-2">Bank A/C :</div>
                <div className="flex-1 p-1.5 font-bold tracking-widest">2480111071837</div>
              </div>
              <div className="flex border-b-2 border-black text-[13px]">
                <div className="w-1/3 font-bold border-r-2 border-black p-1.5 pl-2">Bank IFCS :</div>
                <div className="flex-1 p-1.5 font-bold tracking-widest">SUTB0248011</div>
              </div>
              <div className="font-bold text-center text-[14px] p-1 bg-slate-100 print:bg-transparent">Tearms & Conditions</div>
              <div className="flex-1 p-2 text-[10px] bg-slate-50 print:bg-transparent">
                {/* Empty in template */}
              </div>
            </div>
            <div className="w-[35%] flex flex-col justify-between">
              <div className="font-bold text-center p-2 text-[14px] bg-slate-100 print:bg-transparent h-8 flex items-center justify-center">For Shree Brahmani Enterprise</div>
              <div className="font-bold text-center p-2 mt-auto text-[13px]">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
