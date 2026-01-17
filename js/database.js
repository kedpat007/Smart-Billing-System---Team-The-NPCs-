// Database Operations for SmartDukaan
import {
    db,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp
} from './firebase-config.js';

// ============================================
// VENDOR PROFILE
// ============================================

export async function saveVendorProfile(data) {
    try {
        const vendorRef = doc(db, 'vendors', 'profile');
        await setDoc(vendorRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        console.log('✅ Vendor profile saved');
        return true;
    } catch (error) {
        console.error('❌ Error saving vendor profile:', error);
        throw error;
    }
}

export async function getVendorProfile() {
    try {
        const vendorRef = doc(db, 'vendors', 'profile');
        const docSnap = await getDoc(vendorRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('❌ Error getting vendor profile:', error);
        throw error;
    }
}

export async function updateVendorProfile(data) {
    try {
        const vendorRef = doc(db, 'vendors', 'profile');
        await updateDoc(vendorRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('❌ Error updating vendor profile:', error);
        throw error;
    }
}

// ============================================
// PRODUCTS
// ============================================

export async function addProduct(data) {
    try {
        const productsRef = collection(db, 'products');
        const docRef = await addDoc(productsRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        console.log('✅ Product added with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error adding product:', error);
        throw error;
    }
}

export async function getProducts() {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (error) {
        console.error('❌ Error getting products:', error);
        throw error;
    }
}

export async function getProductById(productId) {
    try {
        const productRef = doc(db, 'products', productId);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('❌ Error getting product:', error);
        throw error;
    }
}

export async function updateProduct(productId, data) {
    try {
        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('❌ Error updating product:', error);
        throw error;
    }
}

export async function deleteProduct(productId) {
    try {
        const productRef = doc(db, 'products', productId);
        await deleteDoc(productRef);
        console.log('✅ Product deleted');
        return true;
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        throw error;
    }
}

export async function searchProducts(searchTerm) {
    try {
        const products = await getProducts();
        const term = searchTerm.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            (p.sku && p.sku.toLowerCase().includes(term))
        );
    } catch (error) {
        console.error('❌ Error searching products:', error);
        throw error;
    }
}

// ============================================
// INVOICES
// ============================================

export async function generateInvoiceNumber() {
    try {
        const currentYear = new Date().getFullYear();
        const invoicesRef = collection(db, 'invoices');
        const q = query(invoicesRef, orderBy('invoiceNumber', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);

        let nextNumber = 1;
        if (!querySnapshot.empty) {
            const lastInvoice = querySnapshot.docs[0].data();
            const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]) || 0;
            nextNumber = lastNumber + 1;
        }

        return `INV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
        console.error('❌ Error generating invoice number:', error);
        return `INV-${Date.now()}`;
    }
}

export async function createInvoice(data) {
    try {
        const invoiceNumber = await generateInvoiceNumber();
        const invoicesRef = collection(db, 'invoices');
        const docRef = await addDoc(invoicesRef, {
            ...data,
            invoiceNumber,
            createdAt: Timestamp.now()
        });
        console.log('✅ Invoice created:', invoiceNumber);
        return { id: docRef.id, invoiceNumber };
    } catch (error) {
        console.error('❌ Error creating invoice:', error);
        throw error;
    }
}

export async function getInvoices(filters = {}) {
    try {
        const invoicesRef = collection(db, 'invoices');
        let q = query(invoicesRef, orderBy('createdAt', 'desc'));

        if (filters.limit) {
            q = query(q, limit(filters.limit));
        }

        const querySnapshot = await getDocs(q);
        const invoices = [];
        querySnapshot.forEach((doc) => {
            invoices.push({ id: doc.id, ...doc.data() });
        });

        // Apply client-side filters
        let result = invoices;

        if (filters.status) {
            result = result.filter(inv => inv.status === filters.status);
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            result = result.filter(inv => {
                const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
                return invDate >= startDate;
            });
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59);
            result = result.filter(inv => {
                const invDate = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
                return invDate <= endDate;
            });
        }

        return result;
    } catch (error) {
        console.error('❌ Error getting invoices:', error);
        throw error;
    }
}

export async function getInvoiceById(invoiceId) {
    try {
        const invoiceRef = doc(db, 'invoices', invoiceId);
        const docSnap = await getDoc(invoiceRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('❌ Error getting invoice:', error);
        throw error;
    }
}

export async function updateInvoice(invoiceId, data) {
    try {
        const invoiceRef = doc(db, 'invoices', invoiceId);
        await updateDoc(invoiceRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('❌ Error updating invoice:', error);
        throw error;
    }
}

export async function deleteInvoice(invoiceId) {
    try {
        const invoiceRef = doc(db, 'invoices', invoiceId);
        await deleteDoc(invoiceRef);
        return true;
    } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        throw error;
    }
}

// ============================================
// CUSTOMERS
// ============================================

export async function addCustomer(data) {
    try {
        const customersRef = collection(db, 'customers');
        const docRef = await addDoc(customersRef, {
            ...data,
            totalPurchases: 0,
            creditBalance: 0,
            visitCount: 0,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        console.log('✅ Customer added');
        return docRef.id;
    } catch (error) {
        console.error('❌ Error adding customer:', error);
        throw error;
    }
}

export async function getCustomers() {
    try {
        const customersRef = collection(db, 'customers');
        const q = query(customersRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const customers = [];
        querySnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        return customers;
    } catch (error) {
        console.error('❌ Error getting customers:', error);
        throw error;
    }
}

export async function getCustomerById(customerId) {
    try {
        const customerRef = doc(db, 'customers', customerId);
        const docSnap = await getDoc(customerRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('❌ Error getting customer:', error);
        throw error;
    }
}

export async function updateCustomer(customerId, data) {
    try {
        const customerRef = doc(db, 'customers', customerId);
        await updateDoc(customerRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('❌ Error updating customer:', error);
        throw error;
    }
}

export async function getCustomersWithCredit() {
    try {
        const customersRef = collection(db, 'customers');
        // Retrieve all customers where creditBalance > 0
        const q = query(customersRef, where('creditBalance', '>', 0), orderBy('creditBalance', 'desc'));

        const querySnapshot = await getDocs(q);
        const customers = [];
        querySnapshot.forEach((doc) => {
            customers.push({ id: doc.id, ...doc.data() });
        });

        return customers;
    } catch (error) {
        console.error('❌ Error getting credit customers:', error);
        throw error;
    }
}

// ============================================
// EXPENSES
// ============================================

export async function addExpense(data) {
    try {
        const expensesRef = collection(db, 'expenses');
        const docRef = await addDoc(expensesRef, {
            ...data,
            createdAt: Timestamp.now()
        });
        console.log('✅ Expense added');
        return docRef.id;
    } catch (error) {
        console.error('❌ Error adding expense:', error);
        throw error;
    }
}

export async function getExpenses(filters = {}) {
    try {
        const expensesRef = collection(db, 'expenses');
        const q = query(expensesRef, orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const expenses = [];
        querySnapshot.forEach((doc) => {
            expenses.push({ id: doc.id, ...doc.data() });
        });

        // Apply filters
        let result = expenses;

        if (filters.startDate) {
            result = result.filter(exp => exp.date >= filters.startDate);
        }

        if (filters.endDate) {
            result = result.filter(exp => exp.date <= filters.endDate);
        }

        if (filters.category) {
            result = result.filter(exp => exp.category === filters.category);
        }

        return result;
    } catch (error) {
        console.error('❌ Error getting expenses:', error);
        throw error;
    }
}

export async function deleteExpense(expenseId) {
    try {
        const expenseRef = doc(db, 'expenses', expenseId);
        await deleteDoc(expenseRef);
        return true;
    } catch (error) {
        console.error('❌ Error deleting expense:', error);
        throw error;
    }
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getSalesTrend(period = 'daily') {
    try {
        const now = new Date();
        let startDate = new Date();
        let dateFormat;

        // Set date range based on period
        if (period === 'daily') {
            startDate.setDate(now.getDate() - 30); // Last 30 days
            dateFormat = { month: 'short', day: 'numeric' };
        } else if (period === 'weekly') {
            startDate.setDate(now.getDate() - 90); // Last 12 weeks approx
            dateFormat = { month: 'short', day: 'numeric' };
        } else if (period === 'monthly') {
            startDate.setFullYear(now.getFullYear() - 1); // Last 1 year
            dateFormat = { month: 'short', year: 'numeric' };
        }

        // Get all invoices from start date
        const invoices = await getInvoices({ startDate: startDate.toISOString() });

        // Group data
        const salesData = {};

        invoices.forEach(inv => {
            const date = inv.createdAt?.toDate ? inv.createdAt.toDate() : new Date(inv.createdAt);
            let key;

            if (period === 'daily') {
                key = date.toLocaleDateString('en-US', dateFormat);
            } else if (period === 'weekly') {
                // Get start of week
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                const weekStart = new Date(d.setDate(diff));
                key = weekStart.toLocaleDateString('en-US', dateFormat);
            } else {
                key = date.toLocaleDateString('en-US', dateFormat);
            }

            if (!salesData[key]) salesData[key] = 0;
            salesData[key] += inv.grandTotal || 0;
        });

        // Fill in missing dates only for daily view to ensure continuous line
        if (period === 'daily') {
            for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
                const key = d.toLocaleDateString('en-US', dateFormat);
                if (!salesData[key]) salesData[key] = 0;
            }
        }

        // Sort by date
        const sortedLabels = Object.keys(salesData).sort((a, b) => new Date(a) - new Date(b));

        return {
            labels: sortedLabels,
            data: sortedLabels.map(label => salesData[label])
        };
    } catch (error) {
        console.error('❌ Error getting sales trend:', error);
        throw error;
    }
}

export async function getDashboardStats(dateRange = 'today') {
    try {
        const now = new Date();
        let startDate = new Date();

        switch (dateRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        const invoices = await getInvoices({ startDate: startDate.toISOString() });
        const expenses = await getExpenses({ startDate: startDate.toISOString().split('T')[0] });

        // Calculate stats
        const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const totalGST = invoices.reduce((sum, inv) => sum + (inv.gstTotal || 0), 0);
        const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const unpaidAmount = invoices.filter(inv => inv.status === 'unpaid').reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        // Payment mode breakdown - support both old single mode and new split payments
        const paymentModes = {
            cash: 0,
            upi: 0,
            card: 0,
            credit: unpaidAmount
        };

        invoices.forEach(inv => {
            if (inv.paymentSplit) {
                // New split payment format
                paymentModes.cash += inv.paymentSplit.cash || 0;
                paymentModes.upi += inv.paymentSplit.upi || 0;
                paymentModes.card += inv.paymentSplit.card || 0;
            } else {
                // Old single payment mode format
                const amount = inv.grandTotal || 0;
                if (inv.paymentMode === 'cash') paymentModes.cash += amount;
                else if (inv.paymentMode === 'upi') paymentModes.upi += amount;
                else if (inv.paymentMode === 'card') paymentModes.card += amount;
            }
        });

        // Top selling products
        const productSales = {};
        invoices.forEach(inv => {
            (inv.items || []).forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                }
                productSales[item.name].quantity += item.quantity;
                productSales[item.name].revenue += item.total;
            });
        });
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            totalSales,
            totalGST,
            paidAmount,
            unpaidAmount,
            totalExpenses,
            netProfit: totalSales - totalExpenses,
            billCount: invoices.length,
            averageBillValue: invoices.length > 0 ? totalSales / invoices.length : 0,
            paymentModes,
            topProducts
        };
    } catch (error) {
        console.error('❌ Error getting dashboard stats:', error);
        throw error;
    }
}

// ============================================
// GST REPORTS
// ============================================

export async function getGSTReport(month, year) {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const invoices = await getInvoices({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        const gstBreakdown = {
            '0': { taxable: 0, gst: 0 },
            '5': { taxable: 0, gst: 0 },
            '12': { taxable: 0, gst: 0 },
            '18': { taxable: 0, gst: 0 },
            '28': { taxable: 0, gst: 0 }
        };

        invoices.forEach(inv => {
            (inv.items || []).forEach(item => {
                const rate = String(item.gstRate || 0);
                if (gstBreakdown[rate]) {
                    gstBreakdown[rate].taxable += item.baseTotal || 0;
                    gstBreakdown[rate].gst += item.gstAmount || 0;
                }
            });
        });

        return {
            period: `${month}/${year}`,
            breakdown: gstBreakdown,
            totalTaxable: Object.values(gstBreakdown).reduce((sum, g) => sum + g.taxable, 0),
            totalGST: Object.values(gstBreakdown).reduce((sum, g) => sum + g.gst, 0)
        };
    } catch (error) {
        console.error('❌ Error generating GST report:', error);
        throw error;
    }
}

// ============================================
// DATA EXPORT
// ============================================

export async function exportData(type) {
    try {
        let data = [];

        switch (type) {
            case 'products':
                data = await getProducts();
                break;
            case 'invoices':
                data = await getInvoices();
                break;
            case 'customers':
                data = await getCustomers();
                break;
            case 'expenses':
                data = await getExpenses();
                break;
            case 'all':
                data = {
                    products: await getProducts(),
                    invoices: await getInvoices(),
                    customers: await getCustomers(),
                    expenses: await getExpenses(),
                    vendor: await getVendorProfile()
                };
                break;
        }

        return data;
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        throw error;
    }
}

// ============================================
// RETURNS
// ============================================

export async function addReturn(data) {
    try {
        const returnsRef = collection(db, 'returns');
        const docRef = await addDoc(returnsRef, {
            ...data,
            createdAt: Timestamp.now()
        });
        console.log('✅ Return recorded');
        return docRef.id;
    } catch (error) {
        console.error('❌ Error adding return:', error);
        throw error;
    }
}

export async function getReturns(filters = {}) {
    try {
        const returnsRef = collection(db, 'returns');
        let q = query(returnsRef, orderBy('createdAt', 'desc'));

        if (filters.limit) {
            q = query(q, limit(filters.limit));
        }

        const querySnapshot = await getDocs(q);
        const returns = [];
        querySnapshot.forEach((doc) => {
            returns.push({ id: doc.id, ...doc.data() });
        });

        return returns;
    } catch (error) {
        console.error('❌ Error getting returns:', error);
        throw error;
    }
}

// ============================================
// PAYMENTS / CREDIT HISTORY
// ============================================

export async function addPaymentRecord(data) {
    try {
        const paymentsRef = collection(db, 'payments');
        const docRef = await addDoc(paymentsRef, {
            ...data,
            createdAt: Timestamp.now()
        });
        console.log('✅ Payment recorded');
        return docRef.id;
    } catch (error) {
        console.error('❌ Error adding payment record:', error);
        throw error;
    }
}

export async function getCustomerPayments(customerId) {
    try {
        const paymentsRef = collection(db, 'payments');
        const q = query(paymentsRef, where('customerId', '==', customerId), orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(q);
        const payments = [];
        querySnapshot.forEach((doc) => {
            payments.push({ id: doc.id, ...doc.data() });
        });

        return payments;
    } catch (error) {
        console.error('❌ Error getting customer payments:', error);
        throw error;
    }
}
