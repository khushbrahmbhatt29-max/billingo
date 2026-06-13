import Dexie, { type EntityTable } from 'dexie';

export interface Customer {
  id?: number;
  name: string;
  address: string;
  stateCode: string;
  gstin: string;
  mobile?: string;
}

export interface Product {
  id?: number;
  name: string;
  hsn: string;
  uom: string;
  rate: number;
}

export interface LineItem {
  productId: number;
  productName: string;
  hsn: string;
  uom: string;
  rate: number;
  qty: number;
  total: number;
}

export interface Invoice {
  id?: number;
  invoiceNumber: number;
  date: string;
  customerId: number;
  customerDetails: Customer; // snapshot
  items: LineItem[];
  subTotal: number;
  sgst: number;
  cgst: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  transportMode?: string;
  vehicleNumber?: string;
}

const db = new Dexie('BillingDatabase') as Dexie & {
  customers: EntityTable<Customer, 'id'>;
  products: EntityTable<Product, 'id'>;
  invoices: EntityTable<Invoice, 'id'>;
};

db.version(1).stores({
  customers: '++id, name, gstin',
  products: '++id, name, hsn',
  invoices: '++id, invoiceNumber, date, customerId'
});

export const seedDatabase = async () => {
  const customerCount = await db.customers.count();
  if (customerCount === 0) {
    await db.customers.add({
      name: "M/S PARSHWANATH SUPPLIERS",
      address: "Ashoka Shopping Centre, GIDC, Pandesara, SURAT.",
      stateCode: "24",
      gstin: "24AERPB8735L1Z2"
    });
  }

  const productCount = await db.products.count();
  if (productCount === 0) {
    await db.products.add({
      name: "S.L. FLAP RUPTURE DISC",
      hsn: "84819090",
      uom: "Nos",
      rate: 1050
    });
  }

  const invoiceCount = await db.invoices.count();
  if (invoiceCount === 0) {
    const customer = await db.customers.toArray().then(res => res[0]);
    const product = await db.products.toArray().then(res => res[0]);
    
    if (customer && product) {
      const qty = 10;
      const rate = product.rate;
      const total = qty * rate;
      const subTotal = total;
      const sgst = parseFloat((subTotal * 0.09).toFixed(2));
      const cgst = parseFloat((subTotal * 0.09).toFixed(2));
      const grandTotalRaw = subTotal + sgst + cgst;
      const grandTotal = Math.round(grandTotalRaw);
      const roundOff = parseFloat((grandTotal - grandTotalRaw).toFixed(2));

      await db.invoices.add({
        invoiceNumber: 1,
        date: new Date().toISOString().split('T')[0],
        customerId: customer.id!,
        customerDetails: customer,
        items: [{
          productId: product.id!,
          productName: product.name,
          hsn: product.hsn,
          uom: product.uom,
          rate: rate,
          qty: qty,
          total: total
        }],
        subTotal,
        sgst,
        cgst,
        roundOff,
        grandTotal,
        amountInWords: "Twelve Thousand Three Hundred Ninety Only"
      });
    }
  }
};

export { db };
