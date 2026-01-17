// Utility Functions for SmartDukaan

// ============================================
// TRANSLATIONS (Hindi/English)
// ============================================

export const translations = {
    // Navigation
    dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड' },
    newBill: { en: 'New Bill', hi: 'नया बिल' },
    products: { en: 'Products', hi: 'उत्पाद' },
    billHistory: { en: 'Bill History', hi: 'बिल इतिहास' },
    creditBook: { en: 'Credit Book', hi: 'उधार खाता' },
    customers: { en: 'Customers', hi: 'ग्राहक' },
    expenses: { en: 'Expenses', hi: 'खर्च' },
    reports: { en: 'Reports', hi: 'रिपोर्ट' },
    settings: { en: 'Settings', hi: 'सेटिंग्स' },

    // Actions
    save: { en: 'Save', hi: 'सेव करें' },
    cancel: { en: 'Cancel', hi: 'रद्द करें' },
    delete: { en: 'Delete', hi: 'हटाएं' },
    edit: { en: 'Edit', hi: 'संपादित करें' },
    print: { en: 'Print', hi: 'प्रिंट करें' },
    share: { en: 'Share', hi: 'शेयर करें' },
    search: { en: 'Search', hi: 'खोजें' },
    add: { en: 'Add', hi: 'जोड़ें' },
    export: { en: 'Export', hi: 'निर्यात' },

    // Labels
    businessName: { en: 'Business Name', hi: 'दुकान का नाम' },
    address: { en: 'Address', hi: 'पता' },
    phone: { en: 'Phone', hi: 'फ़ोन नंबर' },
    customerName: { en: 'Customer Name', hi: 'ग्राहक का नाम' },
    productName: { en: 'Product Name', hi: 'उत्पाद का नाम' },
    price: { en: 'Price', hi: 'कीमत' },
    quantity: { en: 'Quantity', hi: 'मात्रा' },
    total: { en: 'Total', hi: 'कुल' },
    subtotal: { en: 'Subtotal', hi: 'उप-कुल' },
    grandTotal: { en: 'Grand Total', hi: 'कुल योग' },

    // Status
    paid: { en: 'Paid', hi: 'भुगतान हुआ' },
    unpaid: { en: 'Unpaid', hi: 'बाकी' },
    pending: { en: 'Pending', hi: 'लंबित' },

    // Payment Modes
    cash: { en: 'Cash', hi: 'नकद' },
    upi: { en: 'UPI', hi: 'यूपीआई' },
    card: { en: 'Card', hi: 'कार्ड' },
    credit: { en: 'Credit', hi: 'उधार' },

    // Categories
    grocery: { en: 'Grocery', hi: 'किराना' },
    electronics: { en: 'Electronics', hi: 'इलेक्ट्रॉनिक्स' },
    pharmacy: { en: 'Pharmacy', hi: 'दवाई' },
    clothing: { en: 'Clothing', hi: 'कपड़े' },
    hardware: { en: 'Hardware', hi: 'हार्डवेयर' },
    stationery: { en: 'Stationery', hi: 'स्टेशनरी' },
    restaurant: { en: 'Restaurant', hi: 'रेस्टोरेंट' },
    general: { en: 'General Store', hi: 'जनरल स्टोर' },

    // Units
    kg: { en: 'Kg', hi: 'किलो' },
    liter: { en: 'Liter', hi: 'लीटर' },
    piece: { en: 'Piece', hi: 'पीस' },
    dozen: { en: 'Dozen', hi: 'दर्जन' },
    box: { en: 'Box', hi: 'बॉक्स' },
    packet: { en: 'Packet', hi: 'पैकेट' },

    // Messages
    noProducts: { en: 'No products found', hi: 'कोई उत्पाद नहीं मिला' },
    noInvoices: { en: 'No bills found', hi: 'कोई बिल नहीं मिला' },
    noCustomers: { en: 'No customers found', hi: 'कोई ग्राहक नहीं मिला' },
    loading: { en: 'Loading...', hi: 'लोड हो रहा है...' },
    success: { en: 'Success!', hi: 'सफल!' },
    error: { en: 'Error occurred', hi: 'त्रुटि हुई' }
};

export function t(key, lang = 'en') {
    if (translations[key]) {
        return translations[key][lang] || translations[key].en;
    }
    return key;
}

export function bilingualText(key) {
    if (translations[key]) {
        return `${translations[key].en} (${translations[key].hi})`;
    }
    return key;
}

// ============================================
// CURRENCY FORMATTING
// ============================================

export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

export function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num || 0);
}

// ============================================
// DATE FORMATTING
// ============================================

export function formatDate(date, format = 'short') {
    const d = date instanceof Date ? date : new Date(date);

    if (isNaN(d.getTime())) return '-';

    const options = {
        short: { day: '2-digit', month: '2-digit', year: 'numeric' },
        long: { day: '2-digit', month: 'long', year: 'numeric' },
        full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit', hour12: true },
        datetime: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }
    };

    return d.toLocaleString('en-IN', options[format] || options.short);
}

export function getToday() {
    return new Date().toISOString().split('T')[0];
}

export function getDateRange(range) {
    const now = new Date();
    const start = new Date();

    switch (range) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case 'yesterday':
            start.setDate(now.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            now.setDate(now.getDate() - 1);
            break;
        case 'week':
            start.setDate(now.getDate() - 7);
            break;
        case 'month':
            start.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            start.setFullYear(now.getFullYear() - 1);
            break;
    }

    return { start, end: now };
}

// ============================================
// GST CALCULATIONS
// ============================================

export function calculateGST(amount, gstRate) {
    const rate = parseFloat(gstRate) || 0;
    const gstAmount = (amount * rate) / 100;
    return {
        baseAmount: amount,
        gstRate: rate,
        gstAmount: gstAmount,
        total: amount + gstAmount
    };
}

export function calculateInvoiceTotal(items) {
    let subtotal = 0;
    let totalGST = 0;

    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const gstAmount = (itemTotal * (item.gstRate || 0)) / 100;
        subtotal += itemTotal;
        totalGST += gstAmount;
    });

    return {
        subtotal,
        gstTotal: totalGST,
        grandTotal: subtotal + totalGST
    };
}

// ============================================
// VALIDATION
// ============================================

export function validateGST(gst) {
    if (!gst) return true; // Optional field
    const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return pattern.test(gst.toUpperCase());
}

export function validatePhone(phone) {
    if (!phone) return false;
    const pattern = /^[6-9][0-9]{9}$/;
    return pattern.test(phone);
}

export function validatePIN(pin) {
    if (!pin) return false;
    const pattern = /^[0-9]{4}$/;
    return pattern.test(pin);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

export function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// LOCAL STORAGE
// ============================================

export function saveToLocal(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

export function getFromLocal(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
    }
}

export function removeFromLocal(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        console.error('Error removing from localStorage:', e);
        return false;
    }
}

// ============================================
// WHATSAPP INTEGRATION
// ============================================

export function shareOnWhatsApp(text, phone = '') {
    const encodedText = encodeURIComponent(text);
    const url = phone
        ? `https://wa.me/91${phone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
}

export function generateInvoiceMessage(invoice, vendor) {
    const message = `
🧾 *${vendor.businessName}*
${vendor.address}
📞 ${vendor.phone}
${vendor.gstNumber ? `GSTIN: ${vendor.gstNumber}` : ''}

━━━━━━━━━━━━━━━
*Invoice: ${invoice.invoiceNumber}*
Date: ${formatDate(invoice.createdAt)}
━━━━━━━━━━━━━━━

${invoice.items.map(item =>
        `▸ ${item.name} × ${item.quantity}\n   ₹${item.price} = ₹${item.total}`
    ).join('\n\n')}

━━━━━━━━━━━━━━━
Subtotal: ₹${invoice.subtotal}
GST: ₹${invoice.gstTotal}
*Grand Total: ₹${invoice.grandTotal}*
━━━━━━━━━━━━━━━

Payment: ${invoice.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
${invoice.paymentMode ? `Mode: ${invoice.paymentMode.toUpperCase()}` : ''}

Thank you for shopping with us! 🙏
    `.trim();

    return message;
}

export function generatePaymentReminder(customer, amount, dueDate) {
    return `
🔔 *Payment Reminder*

Dear ${customer.name},

This is a friendly reminder about your pending payment of *₹${formatNumber(amount)}*.

${dueDate ? `Due Date: ${formatDate(dueDate)}` : ''}

Please clear the dues at your earliest convenience.

Thank you! 🙏
    `.trim();
}

// ============================================
// EXPORT TO CSV
// ============================================

export function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                let cell = row[header];
                if (typeof cell === 'object') cell = JSON.stringify(cell);
                if (typeof cell === 'string' && cell.includes(',')) {
                    cell = `"${cell}"`;
                }
                return cell || '';
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${getToday()}.csv`;
    link.click();

    showToast('Export successful!', 'success');
}

// ============================================
// PRINT INVOICE
// ============================================

export function printInvoice(invoiceHtml) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; max-width: 80mm; margin: 0 auto; }
                .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                .items { margin: 10px 0; }
                .item { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; }
                .footer { text-align: center; margin-top: 15px; font-size: 12px; }
            </style>
        </head>
        <body>
            ${invoiceHtml}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// GENERATE SKU
// ============================================

export function generateSKU(productName, category) {
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
    const nameCode = productName.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${nameCode}-${random}`;
}

// ============================================
// DEBOUNCE
// ============================================

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// QR CODE GENERATION
// ============================================

export function generateUPIQRData(upiId, amount, name) {
    if (!upiId) return null;

    const params = new URLSearchParams({
        pa: upiId,
        pn: name || 'SmartDukaan',
        am: amount || '',
        cu: 'INR'
    });

    return `upi://pay?${params.toString()}`;
}
