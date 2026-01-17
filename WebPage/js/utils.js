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
    amountPaid: { en: 'Amount Paid', hi: 'भुगतान राशि' },
    balance: { en: 'Balance Due', hi: 'बकाया राशि' },
    paymentMode: { en: 'Payment Mode', hi: 'भुगतान का प्रकार' },
    cash: { en: 'Cash', hi: 'नकद' },
    online: { en: 'Online', hi: 'ऑनलाइन' },
    credit: { en: 'Credit', hi: 'उधार' },
    date: { en: 'Date', hi: 'तारीख' },
    status: { en: 'Status', hi: 'स्थिति' },
    paid: { en: 'Paid', hi: 'भुगतान किया' },
    pending: { en: 'Pending', hi: 'लंबित' },

    // Status
    unpaid: { en: 'Unpaid', hi: 'बाकी' },

    // Payment Modes
    upi: { en: 'UPI', hi: 'यूपीआई' },
    card: { en: 'Card', hi: 'कार्ड' },

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
// GST CALCULATIONS & SMART RATES
// ============================================

export const CATEGORY_MARGINS = {
    'grocery': 10,
    'dairy': 25,
    'beverages': 8,
    'snacks': 30,
    'personal': 15,
    'household': 20,
    'clothing': 20,    // Default generic
    'electronics': 15, // Default generic
    'pharmacy': 20,    // Default generic
    'restaurant': 30,  // Service margin
    'hardware': 20,
    'stationery': 25
};

export const GST_CATEGORIES = {
    'grocery': 5,          // Packaged food/Essentials
    'electronics': 18,     // Standard electronics
    'pharmacy': 12,        // Medicines (Check keywords for essentials)
    'clothing': 18,        // Apparel (Standard)
    'hardware': 18,        // Industrial
    'stationery': 12,      // Paper/Pens
    'restaurant': 5,       // Services
    'dairy': 5,            // Butter/Ghee (Milk is 0 via keyword)
    'beverages': 18,       // Juices
    'snacks': 18,          // Processed foods
    'personal': 18,        // Cosmetics/Soaps
    'household': 18,       // Detergents
    'automobile': 28,      // Standard Auto
    'luxury': 40           // Sin goods
};

export const KEYWORD_RATES = {
    // 0% Exempt
    'milk': 0, 'curd': 0, 'egg': 0, 'bread': 0, 'vegetable': 0, 'fruit': 0, 'grain': 0, 'salt': 0,
    'flour': 0, 'rice': 0, 'wheat': 0, 'dal': 0, 'fresh': 0,

    // 5% Essentials
    'butter': 5, 'ghee': 5, 'cheese': 5, 'paneer': 5, 'oil': 5, 'tea': 5, 'coffee': 5,
    'sugar': 5, 'spice': 5, 'sweet': 5, 'footwear': 5, 'shoe': 5, 'sandal': 5,
    'ev': 5, 'electric vehicle': 5,

    // 12% Standard
    'medicine': 12, 'mobile': 18, // Mobile often 18 now, user said "Most electronics 18"

    // 18% Standard
    'soap': 18, 'shampoo': 18, 'paste': 18, 'hair': 18, 'cream': 18, // Cosmetics
    'tv': 28, 'television': 28, 'fridge': 28, 'refrigerator': 28, // Specific appliances often 18/28
    'monitor': 18, 'laptop': 18, 'computer': 18, 'camera': 18,
    'printer': 18, 'cable': 18, 'fan': 18, 'light': 18,

    // 28% Luxury/Durables
    'ac': 28, 'conditioner': 28, 'car': 28, 'bike': 28,
    'paint': 28, 'cement': 28, 'tobacco': 28,

    // 40% Sin/Luxury
    'aerated': 40, 'soda': 40, 'cigarette': 40, 'cigar': 40,
    'luxury car': 40, 'yacht': 40, 'aircraft': 40
};

export function suggestGSTRate(category, productName = '') {
    // 1. Check for specific product keywords (highest priority)
    const nameLower = productName.toLowerCase();

    // Check keywords (exact or partial match)
    for (const [keyword, rate] of Object.entries(KEYWORD_RATES)) {
        if (nameLower.includes(keyword)) {
            return rate;
        }
    }

    // 2. Fallback to Category default
    if (category && GST_CATEGORIES[category] !== undefined) {
        return GST_CATEGORIES[category];
    }

    // 3. Default fallback
    return 18;
}

// ============================================
// STANDARD PRODUCT DATABASE (AUTO-FILL)
// ============================================

export const STANDARD_PRODUCTS = [
    // Grocery
    { keywords: ['basmati', 'rice'], name: 'Basmati Rice (5kg)', category: 'grocery', unit: 'packet' },
    { keywords: ['sona', 'masoori', 'everyday rice'], name: 'Sona Masoori Rice (5kg)', category: 'grocery', unit: 'packet' },
    { keywords: ['atta', 'wheat flour'], name: 'Whole Wheat Atta (10kg)', category: 'grocery', unit: 'packet' },
    { keywords: ['sugar', 'refined'], name: 'Sugar (Refined)', category: 'grocery', unit: 'kg' },
    { keywords: ['oil', 'sunflower', 'ricebran'], name: 'Refined Cooking Oil (1L)', category: 'grocery', unit: 'liter' },
    { keywords: ['toor', 'arhar', 'dal'], name: 'Toor Dal', category: 'grocery', unit: 'kg' },
    { keywords: ['chana', 'chickpeas'], name: 'Chana Dal', category: 'grocery', unit: 'kg' },
    { keywords: ['salt', 'iodized'], name: 'Iodized Salt', category: 'grocery', unit: 'kg' },

    // Dairy
    { keywords: ['milk', 'toned', 'fresh'], name: 'Milk (Fresh/Toned)', category: 'dairy', unit: 'liter' },
    { keywords: ['ghee'], name: 'Ghee', category: 'dairy', unit: 'kg' },
    { keywords: ['paneer'], name: 'Paneer (200g)', category: 'dairy', unit: 'packet' },
    { keywords: ['curd', 'dahi'], name: 'Curd (500g)', category: 'dairy', unit: 'packet' },
    { keywords: ['butter'], name: 'Butter (Unsalted, 250g)', category: 'dairy', unit: 'packet' },
    { keywords: ['milk powder'], name: 'Milk Powder (1kg)', category: 'dairy', unit: 'kg' },
    { keywords: ['cheese', 'slice'], name: 'Cheese Slices (200g)', category: 'dairy', unit: 'packet' },
    { keywords: ['flavoured milk', 'tetra'], name: 'Flavoured Milk (200ml)', category: 'dairy', unit: 'packet' },

    // Beverages
    { keywords: ['tea', 'chai'], name: 'Tea Packet', category: 'beverages', unit: 'kg' },
    { keywords: ['coffee', 'instant'], name: 'Instant Coffee (100g)', category: 'beverages', unit: 'box' },
    { keywords: ['green tea', 'tea bags'], name: 'Green Tea Bags (25s)', category: 'beverages', unit: 'box' },
    { keywords: ['juice', 'fruit'], name: 'Fruit Juice (1L)', category: 'beverages', unit: 'liter' },
    { keywords: ['soft drink', 'soda'], name: 'Soft Drink (2L)', category: 'beverages', unit: 'piece' },
    { keywords: ['water', 'mineral'], name: 'Mineral Water (1L)', category: 'beverages', unit: 'liter' },
    { keywords: ['energy', 'drink'], name: 'Energy Drink (250ml)', category: 'beverages', unit: 'piece' },
    { keywords: ['health drink', 'horlicks', 'bournvita'], name: 'Health Drink (500g)', category: 'beverages', unit: 'packet' },

    // Snacks
    { keywords: ['chips', 'potato'], name: 'Potato Chips', category: 'snacks', unit: 'packet' },
    { keywords: ['biscuit', 'family'], name: 'Biscuits (Family Pack 300g)', category: 'snacks', unit: 'packet' },
    { keywords: ['namkeen', 'bhujia'], name: 'Namkeen (200g)', category: 'snacks', unit: 'packet' },
    { keywords: ['chocolate', 'bar'], name: 'Chocolate Bar (50g)', category: 'snacks', unit: 'piece' },
    { keywords: ['cookie'], name: 'Cookies (200g)', category: 'snacks', unit: 'packet' },
    { keywords: ['noodle', 'maggi'], name: 'Instant Noodles', category: 'snacks', unit: 'packet' },
    { keywords: ['popcorn'], name: 'Popcorn (100g)', category: 'snacks', unit: 'packet' },
    { keywords: ['peanut'], name: 'Roasted Peanuts (200g)', category: 'snacks', unit: 'packet' },

    // Personal Care
    { keywords: ['soap', 'bath'], name: 'Bath Soap (75g)', category: 'personal', unit: 'piece' },
    { keywords: ['shampoo'], name: 'Shampoo (180ml)', category: 'personal', unit: 'piece' },
    { keywords: ['toothpaste'], name: 'Toothpaste (100g)', category: 'personal', unit: 'piece' },
    { keywords: ['toothbrush'], name: 'Toothbrush', category: 'personal', unit: 'piece' },
    { keywords: ['deodorant', 'spray'], name: 'Deodorant (150ml)', category: 'personal', unit: 'piece' },
    { keywords: ['handwash'], name: 'Handwash (500ml)', category: 'personal', unit: 'piece' },
    { keywords: ['blade', 'shaving'], name: 'Shaving Blades (5s)', category: 'personal', unit: 'packet' },
    { keywords: ['sanitary', 'pads'], name: 'Sanitary Pads (8s)', category: 'personal', unit: 'packet' },

    // Household
    { keywords: ['detergent', 'powder'], name: 'Detergent Powder (1kg)', category: 'household', unit: 'kg' },
    { keywords: ['dishwash', 'liquid'], name: 'Dishwash Liquid (500ml)', category: 'household', unit: 'piece' },
    { keywords: ['toilet', 'cleaner'], name: 'Toilet Cleaner (500ml)', category: 'household', unit: 'piece' },
    { keywords: ['floor', 'cleaner', 'phenyl'], name: 'Floor Cleaner (1L)', category: 'household', unit: 'liter' },
    { keywords: ['coil', 'mosquito'], name: 'Mosquito Coil (10s)', category: 'household', unit: 'packet' },
    { keywords: ['garbage', 'bin', 'liner'], name: 'Garbage Bags (50s)', category: 'household', unit: 'packet' },
    { keywords: ['foil', 'aluminium'], name: 'Aluminium Foil (10m)', category: 'household', unit: 'piece' },
    { keywords: ['bulb', 'led'], name: 'LED Bulb', category: 'household', unit: 'piece' }
];

export function findProductByName(inputName) {
    if (!inputName) return null;
    const lowerInput = inputName.toLowerCase();

    // Check for exact keyword matches within the input string
    return STANDARD_PRODUCTS.find(p => {
        // Match if ALL keywords are present (strict) or ANY (loose)?
        // Let's try matching if it contains the main keyword
        return p.keywords.some(k => lowerInput.includes(k));
    });
}
export function calculateSellingPrice(costPrice, category) {
    const cost = parseFloat(costPrice) || 0;
    if (cost <= 0) return 0;

    const marginPercent = CATEGORY_MARGINS[category] || 15; // Default 15% if unknown
    const marginAmount = (cost * marginPercent) / 100;

    // Selling Price = Cost + Margin
    // Round to nearest integer for cleaner pricing? Or keep decimals? 
    // Let's keep 2 decimals but maybe recommend ceiling.
    return (cost + marginAmount).toFixed(2);
}

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

    // Clean phone number: remove all non-digits
    let cleanPhone = String(phone).replace(/\D/g, '');

    // For Indian numbers:
    // 1. If 10 digits, add 91 prefix
    // 2. If 11 digits and starts with 0, replace 0 with 91
    // 3. If 12 digits and starts with 91, keep as is
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        cleanPhone = '91' + cleanPhone.slice(1);
    } else if (cleanPhone.length > 12) {
        cleanPhone = cleanPhone.slice(-12);
    }

    const url = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;

    console.log(`🔗 Opening WhatsApp URL: ${url}`);
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
