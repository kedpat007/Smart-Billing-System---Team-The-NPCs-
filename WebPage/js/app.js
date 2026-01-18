// SmartDukaan - Main Application
import {
    saveVendorProfile,
    getVendorProfile,
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    createInvoice,
    getInvoices,
    getCustomers,
    addCustomer,
    updateCustomer,
    getCustomersWithCredit,
    getExpenses,
    addExpense,
    getDashboardStats,
    getSalesTrend,
    getGSTReport,
    exportData,
    addReturn,
    getReturns,
    addPaymentRecord,
    getCustomerPayments,
    addPurchase,
    getLastCostPrice
} from './database.js';

import {
    formatCurrency,
    formatDate,
    formatNumber,
    calculateInvoiceTotal,
    showToast,
    saveToLocal,
    getFromLocal,
    shareOnWhatsApp,
    generateInvoiceMessage,
    generatePaymentReminder,
    exportToCSV,
    printInvoice,
    generateSKU,
    debounce,
    generateUPIQRData,
    validatePhone,
    validateGST,
    CATEGORY_MARGINS,
    validatePIN,
    suggestGSTRate,
    calculateSellingPrice,
    findProductByName,
    downloadInvoicePDF,
    downloadPDF
} from './utils.js';

import {
    auth,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from './firebase-config.js';

// Global Helpers for Auto-Fill (Available to renderCatalog)
let autoFillData;
let autoCalcPrice;

// Define them here or make them window globals if needed, 
// but since renderCatalog filters down, we can define them as module-level functions.

// Smart Margin Auto-calc Logic
autoCalcPrice = () => {
    const costInput = document.getElementById('prodCost');
    const categoryInput = document.getElementById('prodCategory');
    if (!costInput || !categoryInput) return;

    const cost = parseFloat(costInput.value) || 0;
    const category = categoryInput.value;

    if (cost) {
        const sellingPrice = calculateSellingPrice(cost, category);
        const priceInput = document.getElementById('prodPrice');
        if (priceInput) priceInput.value = sellingPrice;

        // Calculate Profit
        const profit = sellingPrice - cost;
        const margin = ((profit / sellingPrice) * 100).toFixed(1);

        const marginDisplay = document.getElementById('marginDisplay');
        if (marginDisplay) {
            marginDisplay.textContent = `Profit: ₹${profit.toFixed(2)} (${margin}%)`;
        }

        // Visual feedback
        if (priceInput) {
            priceInput.classList.add('highlight-update');
            setTimeout(() => priceInput.classList.remove('highlight-update'), 500);
        }
    }
};

// Smart GST & Product Auto-fill Logic
// Smart GST & Product Auto-fill Logic
autoFillData = async () => {
    const nameInput = document.getElementById('prodName');
    const categoryInput = document.getElementById('prodCategory');
    if (!nameInput || !categoryInput) return;

    const name = nameInput.value.trim();
    if (!name) return;

    let costPrice = 0;
    let finalName = name;

    // 1. Try to find standard product (Standardize the name for consistency)
    const standardProduct = findProductByName(name);

    if (standardProduct) {
        finalName = standardProduct.name;
        nameInput.value = finalName; // Standardize UI
        categoryInput.value = standardProduct.category;
        const prodUnit = document.getElementById('prodUnit');
        if (prodUnit) prodUnit.value = standardProduct.unit;
    }

    // 2. Check for Manual Stock Entry using the standardized name
    console.log(`🔍 Fetching cost for finalName: "${finalName}" (input was: "${name}")`);
    const lastCost = await getLastCostPrice(finalName);
    if (lastCost) {
        console.log(`✅ Found cost price: ${lastCost}`);
        costPrice = lastCost;
        const prodCost = document.getElementById('prodCost');
        if (prodCost) {
            prodCost.value = costPrice;
            prodCost.classList.add('highlight-update');
        }
        showToast('Found recent purchase price!', 'success');
    } else {
        console.log(`❌ No cost found for: "${finalName}"`);
        if (standardProduct) {
            showToast('Please enter Cost Price (No stock found for this item)', 'info');
        }
    }

    // 3. Trigger calculation
    if (costPrice) {
        autoCalcPrice();
        ['prodCategory', 'prodPrice', 'prodUnit', 'prodCost'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('highlight-update');
                setTimeout(() => el.classList.remove('highlight-update'), 500);
            }
        });
    }

    // 4. Auto-suggest GST
    const suggestedRate = suggestGSTRate(categoryInput.value, finalName);
    const prodGST = document.getElementById('prodGST');
    if (prodGST) {
        prodGST.value = suggestedRate;
        prodGST.classList.add('highlight-update');
        setTimeout(() => prodGST.classList.remove('highlight-update'), 500);
    }
};

// ============================================
// APP STATE
// ============================================

const state = {
    vendor: null,
    currentPage: 'dashboard',
    isLoggedIn: false,
    cart: [],
    products: [],
    customers: []
};

// ============================================
// INITIALIZATION
// ============================================



async function initApp() {
    console.log('🚀 Initializing SmartDukaan...');

    // Protocol check for Firebase Auth
    if (window.location.protocol === 'file:') {
        setTimeout(() => {
            showToast('⚠️ Firebase Auth requires a web server (http/https) to work. It will NOT work if opened directly as a file.', 'error');
        }, 2000);
    }

    setupRecaptcha();
    setupNavigation();

    // Auth Listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('✅ User logged in:', user.phoneNumber || user.email);
            state.isLoggedIn = true;

            // Allow time for modal to close if open
            const loginModal = document.getElementById('loginModal');
            if (loginModal) loginModal.classList.remove('active');

            try {
                state.vendor = await getVendorProfile();
                if (!state.vendor) {
                    showSetupModal(user.phoneNumber || '');
                } else {
                    updateUserInfo();
                    showPage('dashboard');
                    showToast('Welcome back!', 'success');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                showToast('Error loading profile', 'error');
            }
        } else {
            console.log('🔒 User logged out');
            state.isLoggedIn = false;
            state.vendor = null;
            showLoginModal();
        }
    });

    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', logout);

    // Login Form Listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Prevent default submission
        loginForm.addEventListener('submit', (e) => e.preventDefault());
    }

    document.getElementById('sendOtpBtn')?.addEventListener('click', handleSendOTP);
    document.getElementById('verifyOtpBtn')?.addEventListener('click', handleVerifyOTP);
    document.getElementById('googleLoginBtn')?.addEventListener('click', handleGoogleLogin);



    // Stock Modal Listeners (Moved here to ensure DOM is ready)
    const stockNameInput = document.getElementById('stockName');
    if (stockNameInput) {
        stockNameInput.addEventListener('blur', (e) => {
            const name = e.target.value.trim();
            if (!name) return;
            const std = findProductByName(name);
            if (std) {
                e.target.value = std.name; // Standardize name
                document.getElementById('stockCategory').value = std.category;
                updateStockSP();
            }
        });
    }

    const stockCostInput = document.getElementById('stockCost');
    if (stockCostInput) stockCostInput.addEventListener('input', debounce(updateStockSP, 300));

    const stockCategoryInput = document.getElementById('stockCategory');
    if (stockCategoryInput) stockCategoryInput.addEventListener('change', updateStockSP);

    const stockForm = document.getElementById('stockForm');
    if (stockForm) {
        stockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let name = document.getElementById('stockName').value.trim();
            const costPrice = parseFloat(document.getElementById('stockCost').value);
            const quantity = parseInt(document.getElementById('stockQty').value);
            const category = document.getElementById('stockCategory').value;

            // Standardize name before saving
            const std = findProductByName(name);
            if (std) name = std.name;

            if (name && costPrice && quantity) {
                try {
                    await addPurchase({ name, costPrice, quantity, category });
                    showToast('Stock added successfully!', 'success');
                    closeStockModal();
                } catch (error) {
                    showToast('Error saving stock', 'error');
                }
            }
        });
    }

    // OTP Input Logic
    const otpInputs = document.querySelectorAll('.pin-input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < 5) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
}

// ============================================
// AUTHENTICATION (OTP)
// ============================================

function setupRecaptcha() {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved
                console.log('Recaptcha solved');
            }
        });
    }
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');

    // Reset state
    document.getElementById('phoneStep').style.display = 'block';
    document.getElementById('otpStep').style.display = 'none';
    const loginPhone = document.getElementById('loginPhone');
    if (loginPhone) loginPhone.value = '';

    document.querySelectorAll('.pin-input').forEach(i => i.value = '');
    const otpError = document.getElementById('otpError');
    if (otpError) otpError.textContent = '';
}

async function handleSendOTP(e) {
    if (e) e.preventDefault();
    const phoneInput = document.getElementById('loginPhone');
    const phoneNumber = '+91' + phoneInput.value.trim();

    if (phoneInput.value.length !== 10) {
        showToast('Please enter valid 10-digit number', 'error');
        return;
    }

    const btn = document.getElementById('sendOtpBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const appVerifier = window.recaptchaVerifier;
        window.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

        showToast('OTP Sent successfully!', 'success');
        document.getElementById('phoneStep').style.display = 'none';
        document.getElementById('otpStep').style.display = 'block';
        document.querySelector('.pin-input').focus();

    } catch (error) {
        console.error('Error sending OTP:', error);
        showToast('Error sending OTP. try again.', 'error');
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.render().then(widgetId => {
                grecaptcha.reset(widgetId);
            });
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send OTP (ओटीपी भेजें)';
    }
}

async function handleVerifyOTP(e) {
    if (e) e.preventDefault();
    const otpInputs = document.querySelectorAll('.pin-input');
    const code = Array.from(otpInputs).map(i => i.value).join('');

    if (code.length !== 6) {
        document.getElementById('otpError').textContent = 'Enter 6-digit OTP';
        return;
    }

    const btn = document.getElementById('verifyOtpBtn');
    btn.disabled = true;
    btn.innerHTML = 'Verifying...';

    try {
        const result = await window.confirmationResult.confirm(code);
        console.log('User verified:', result.user);
        // onAuthStateChanged will handle navigation
    } catch (error) {
        console.error('Error verifying OTP:', error);
        document.getElementById('otpError').textContent = 'Invalid OTP. Try again.';
        otpInputs.forEach(i => i.value = '');
        otpInputs[0].focus();
    } finally {
        btn.disabled = false;
        btn.textContent = 'Verify & Login (सत्यापित करें)';
    }
}

async function handleGoogleLogin() {
    const btn = document.getElementById('googleLoginBtn');
    if (btn.disabled) return;

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Signing in...';

    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        console.log('✅ Google login success:', result.user.email);
        showToast('Logged in with Google!', 'success');
    } catch (error) {
        console.error('❌ Google login error:', error);

        let message = 'Error signing in with Google';
        if (error.code === 'auth/popup-blocked') {
            message = 'Wait! Popup was blocked. Please allow it.';
        } else if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname || 'this domain';
            message = `Security Error: "${domain}" is not authorized in Firebase Console.`;
        } else if (error.code === 'auth/operation-not-allowed') {
            message = 'Google Login is not enabled in Firebase Auth.';
        } else {
            message = `Auth Error: ${error.code || error.message}`;
        }

        showToast(message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

window.resetLogin = function () {
    document.getElementById('phoneStep').style.display = 'block';
    document.getElementById('otpStep').style.display = 'none';
    document.getElementById('loginPhone').value = '';
}

async function logout() {
    try {
        await signOut(auth);
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================
// SETUP WIZARD
// ============================================

function showSetupModal(phoneNumber = '') {
    const modal = document.getElementById('setupModal');
    modal.classList.add('active');

    const form = document.getElementById('setupForm');
    if (phoneNumber) {
        const rawPhone = phoneNumber.replace('+91', '');
        form.phoneNumber.value = rawPhone;
        form.phoneNumber.readOnly = true;
    } else {
        form.phoneNumber.value = '';
        form.phoneNumber.readOnly = false;
    }

    form.addEventListener('submit', handleSetup);
}

async function handleSetup(e) {
    e.preventDefault();

    const form = e.target;
    const data = {
        businessName: form.elements['businessName'].value.trim(),
        address: form.elements['address'].value.trim(),
        gstNumber: form.elements['gstNumber'].value.trim().toUpperCase(),
        phone: form.elements['phone'].value.trim(),
        category: form.elements['category'].value,
        upiId: form.elements['upiId'].value.trim()
        // PIN removed
    };

    // Validate
    if (!validatePhone(data.phone)) {
        showToast('Please enter a valid 10-digit phone number', 'error');
        return;
    }

    if (data.gstNumber && !validateGST(data.gstNumber)) {
        showToast('Please enter a valid GST number', 'error');
        return;
    }

    try {
        await saveVendorProfile(data);
        state.vendor = data;

        document.getElementById('setupModal').classList.remove('active');

        state.isLoggedIn = true;
        updateUserInfo();
        showPage('dashboard');

        showToast('Setup complete! Welcome to SmartDukaan 🎉', 'success');
    } catch (error) {
        showToast('Error saving profile. Please try again.', 'error');
        console.error(error);
    }
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && state.vendor) {
        userInfo.querySelector('.user-name').textContent = state.vendor.businessName;
    }
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
        });
    });
}

function showPage(page) {
    if (!state.isLoggedIn && page !== 'setup') return;

    state.currentPage = page;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Render page
    const mainContent = document.getElementById('mainContent');

    switch (page) {
        case 'dashboard':
            renderDashboard(mainContent);
            break;
        case 'new-bill':
            renderNewBill(mainContent);
            break;
        case 'returns':
            renderReturns(mainContent);
            break;
        case 'catalog':
            renderCatalog(mainContent);
            break;
        case 'bills':
            renderBillHistory(mainContent);
            break;
        case 'credit':
            renderCreditBook(mainContent);
            break;
        case 'customers':
            renderCustomers(mainContent);
            break;
        case 'expenses':
            renderExpenses(mainContent);
            break;
        case 'reports':
            renderReports(mainContent);
            break;
        case 'settings':
            renderSettings(mainContent);
            break;
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// ============================================
// DASHBOARD PAGE
// ============================================

async function renderDashboard(container) {
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Dashboard (डैशबोर्ड)</h1>
                <p class="page-subtitle">Overview of your business</p>
            </div>
            <div class="date-filter" id="dateFilter">
                <button class="date-filter-btn active" data-range="today">Today</button>
                <button class="date-filter-btn" data-range="week">Week</button>
                <button class="date-filter-btn" data-range="month">Month</button>
            </div>
        </div>
        
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card primary">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value" id="totalSales">₹0</div>
                    <div class="stat-label">Total Sales (कुल बिक्री)</div>
                </div>
            </div>
            <div class="stat-card success">
                <div class="stat-icon">🧾</div>
                <div class="stat-content">
                    <div class="stat-value" id="billCount">0</div>
                    <div class="stat-label">Bills Generated (बिल)</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <div class="stat-value" id="avgBill">₹0</div>
                    <div class="stat-label">Avg Bill Value (औसत)</div>
                </div>
            </div>
            <div class="stat-card danger">
                <div class="stat-icon">⏳</div>
                <div class="stat-content">
                    <div class="stat-value" id="creditAmount">₹0</div>
                    <div class="stat-label">Credit Pending (उधार)</div>
                </div>
            </div>
        </div>
        
        <div class="grid-2">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Payment Breakdown (भुगतान विवरण)</h3>
                </div>
                <div class="chart-container">
                    <canvas id="paymentChart"></canvas>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Top Products (लोकप्रिय उत्पाद)</h3>
                </div>
                <div id="topProducts" class="item-list"></div>
            </div>
        </div>
        
        <div class="card" style="margin-top: 1.5rem;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 class="card-title">Sales Trend (बिक्री प्रवृत्ति)</h3>
                <div class="trend-filter" id="trendFilter">
                    <button class="trend-filter-btn active" data-trend="daily">Daily</button>
                    <button class="trend-filter-btn" data-trend="weekly">Weekly</button>
                    <button class="trend-filter-btn" data-trend="monthly">Monthly</button>
                </div>
            </div>
            <div class="chart-container" style="height: 300px;">
                <canvas id="salesTrendChart"></canvas>
            </div>
        </div>
        
        <button class="fab" onclick="document.querySelector('[data-page=new-bill]').click()">+</button>
    `;

    // Setup date filter
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadDashboardStats(btn.dataset.range);
        });
    });

    // Setup trend filter
    document.querySelectorAll('.trend-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.trend-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadSalesTrend(btn.dataset.trend);
        });
    });

    // Load initial stats
    loadDashboardStats('today');

    // Load initial sales trend
    loadSalesTrend('daily');
}

async function loadDashboardStats(range) {
    try {
        const stats = await getDashboardStats(range);

        document.getElementById('totalSales').textContent = formatCurrency(stats.totalSales);
        document.getElementById('billCount').textContent = stats.billCount;
        document.getElementById('avgBill').textContent = formatCurrency(stats.averageBillValue);
        document.getElementById('creditAmount').textContent = formatCurrency(stats.unpaidAmount);

        // Render payment chart
        renderPaymentChart(stats.paymentModes);

        // Render top products
        renderTopProducts(stats.topProducts);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function renderPaymentChart(paymentModes) {
    const ctx = document.getElementById('paymentChart');
    if (!ctx) return;

    // Destroy existing chart
    if (window.paymentChartInstance) {
        window.paymentChartInstance.destroy();
    }

    window.paymentChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Cash (नकद)', 'UPI', 'Card (कार्ड)', 'Credit (उधार)'],
            datasets: [{
                data: [paymentModes.cash, paymentModes.upi, paymentModes.card, paymentModes.credit],
                backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function loadSalesTrend(range) {
    try {
        const trendData = await getSalesTrend(range);
        renderSalesTrendChart(trendData, range);
    } catch (error) {
        console.error('Error loading sales trend:', error);
    }
}

function renderSalesTrendChart(data, range) {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    // Destroy existing chart
    if (window.salesTrendChartInstance) {
        window.salesTrendChartInstance.destroy();
    }

    window.salesTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Sales (₹)',
                data: data.data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return '₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '₹' + value;
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderTopProducts(products) {
    const container = document.getElementById('topProducts');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No sales data yet (अभी कोई बिक्री नहीं)</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map((p, i) => `
        <div class="item-row">
            <div class="item-name">
                <span class="badge badge-primary">#${i + 1}</span>
                ${p.name}
            </div>
            <div class="item-qty">${p.quantity} sold</div>
            <div class="item-price">${formatCurrency(p.revenue)}</div>
        </div>
    `).join('');
}

// ============================================
// NEW BILL PAGE
// ============================================

async function renderNewBill(container) {
    state.cart = [];
    state.products = await getProducts();
    state.customers = await getCustomers();

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">New Bill (नया बिल)</h1>
                <p class="page-subtitle">Create a new invoice</p>
            </div>
        </div>
        
        <div class="invoice-builder">
            <div class="invoice-items">
                <div class="search-bar">
                    <input type="text" id="productSearch" placeholder="Search products... (उत्पाद खोजें)">
                </div>
                
                <div id="searchResults" class="product-grid" style="margin-top: 1rem;"></div>
                
                <h3 style="margin: 1.5rem 0 1rem;">Cart Items (कार्ट)</h3>
                <div id="cartItems" class="item-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">🛒</div>
                        <h3>Cart is empty</h3>
                        <p>Search and add products above</p>
                    </div>
                </div>
            </div>
            
            <div class="invoice-preview">
                <div class="invoice-preview-header">
                    <h2>${state.vendor?.businessName || 'Your Business'}</h2>
                    <p class="business-address">${state.vendor?.address || ''}</p>
                    ${state.vendor?.gstNumber ? `<p>GSTIN: ${state.vendor.gstNumber}</p>` : ''}
                    <p>📞 ${state.vendor?.phone || ''}</p>
                </div>
                
                <div class="form-group">
                    <label>Customer (ग्राहक)</label>
                    <input type="text" id="customerName" placeholder="Customer name (optional)" list="customerList">
                    <datalist id="customerList">
                        ${state.customers.map(c => `<option value="${c.name}">`).join('')}
                    </datalist>
                </div>
                
                <div class="form-group">
                    <label>Phone (फ़ोन)</label>
                    <input type="tel" id="customerPhone" placeholder="Phone number (optional)" maxlength="10">
                </div>
                
                <div id="invoiceItems"></div>
                
                <div class="invoice-totals">
                    <div class="invoice-total-row">
                        <span>Subtotal (उप-कुल)</span>
                        <span id="subtotal">₹0</span>
                    </div>
                    <div class="invoice-total-row">
                        <span>GST</span>
                        <span id="gstTotal">₹0</span>
                    </div>
                    <div class="invoice-total-row grand-total">
                        <span>Grand Total (कुल)</span>
                        <span id="grandTotal">₹0</span>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 1rem;">
                    <label>Split Payment (विभाजित भुगतान)</label>
                    <p style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 0.5rem;">Enter amount for each payment mode. Total must equal grand total.</p>
                    <div class="split-payment-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div class="split-payment-item">
                            <label style="font-size: 0.75rem;">💵 Cash (नकद)</label>
                            <input type="number" id="paymentCash" min="0" step="0.01" value="0" placeholder="0" class="split-payment-input">
                        </div>
                        <div class="split-payment-item">
                            <label style="font-size: 0.75rem;">📱 UPI</label>
                            <input type="number" id="paymentUPI" min="0" step="0.01" value="0" placeholder="0" class="split-payment-input">
                        </div>
                        <div class="split-payment-item">
                            <label style="font-size: 0.75rem;">💳 Card (कार्ड)</label>
                            <input type="number" id="paymentCard" min="0" step="0.01" value="0" placeholder="0" class="split-payment-input">
                        </div>
                        <div class="split-payment-item">
                            <label style="font-size: 0.75rem;">⏳ Credit (उधार)</label>
                            <input type="number" id="paymentCredit" min="0" step="0.01" value="0" placeholder="0" class="split-payment-input">
                        </div>
                    </div>
                    <div id="paymentValidation" style="margin-top: 0.5rem; font-size: 0.85rem; font-weight: 500;"></div>
                    <button type="button" class="btn btn-outline" style="margin-top: 0.5rem; font-size: 0.75rem;" onclick="fillRemainingCash()">Fill remaining in Cash</button>
                </div>
                
                <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                    <button class="btn btn-success" style="flex: 1;" onclick="saveBill()">
                        💾 Save & Print
                    </button>
                    <button class="btn btn-primary" onclick="saveBill(true)">
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup search
    const searchInput = document.getElementById('productSearch');
    searchInput.addEventListener('input', debounce((e) => {
        searchProducts(e.target.value);
    }, 300));

    // Show all products initially
    searchProducts('');

    // Setup payment validation on input change
    ['paymentCash', 'paymentUPI', 'paymentCard', 'paymentCredit'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updatePaymentValidation);
    });
}

function searchProducts(term) {
    const container = document.getElementById('searchResults');
    let filtered = state.products;

    if (term) {
        const lowerTerm = term.toLowerCase();
        filtered = state.products.filter(p =>
            p.name.toLowerCase().includes(lowerTerm) ||
            (p.sku && p.sku.toLowerCase().includes(lowerTerm))
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-state">No products found</p>`;
        return;
    }

    container.innerHTML = filtered.slice(0, 12).map(p => `
        <div class="product-card" onclick="addToCart('${p.id}')">
            <div class="product-name">${p.name}</div>
            <div class="product-price">${formatCurrency(p.price)} / ${p.unit}</div>
            <div class="product-meta">
                <span>GST: ${p.gstRate || 0}%</span>
                ${p.stock !== undefined ? `<span>Stock: ${p.stock}</span>` : ''}
            </div>
        </div>
    `).join('');
}

window.addToCart = function (productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            unit: product.unit,
            gstRate: product.gstRate || 0,
            quantity: 1
        });
    }

    updateCart();
    showToast(`${product.name} added to cart`, 'success');
};

window.updateQuantity = function (productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => i.id !== productId);
    }

    updateCart();
};

window.removeFromCart = function (productId) {
    state.cart = state.cart.filter(i => i.id !== productId);
    updateCart();
};

function updateCart() {
    const container = document.getElementById('cartItems');

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🛒</div>
                <h3>Cart is empty</h3>
                <p>Search and add products above</p>
            </div>
        `;
        document.getElementById('subtotal').textContent = '₹0';
        document.getElementById('gstTotal').textContent = '₹0';
        document.getElementById('grandTotal').textContent = '₹0';
        return;
    }

    container.innerHTML = state.cart.map(item => {
        const itemTotal = item.price * item.quantity;
        const gstAmount = (itemTotal * item.gstRate) / 100;
        item.total = itemTotal + gstAmount;
        item.baseTotal = itemTotal;
        item.gstAmount = gstAmount;

        return `
            <div class="item-row">
                <div class="item-name">${item.name}</div>
                <div class="item-qty">
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <div class="item-price">${formatCurrency(item.total)}</div>
                <span class="item-remove" onclick="removeFromCart('${item.id}')">🗑️</span>
            </div>
        `;
    }).join('');

    const totals = calculateInvoiceTotal(state.cart);
    document.getElementById('subtotal').textContent = formatCurrency(totals.subtotal);
    document.getElementById('gstTotal').textContent = formatCurrency(totals.gstTotal);
    document.getElementById('grandTotal').textContent = formatCurrency(totals.grandTotal);
}

window.saveBill = async function (share = false) {
    if (state.cart.length === 0) {
        showToast('Cart is empty!', 'error');
        return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();

    // Get split payment amounts
    const paymentCash = parseFloat(document.getElementById('paymentCash').value) || 0;
    const paymentUPI = parseFloat(document.getElementById('paymentUPI').value) || 0;
    const paymentCard = parseFloat(document.getElementById('paymentCard').value) || 0;
    const paymentCredit = parseFloat(document.getElementById('paymentCredit').value) || 0;

    const totals = calculateInvoiceTotal(state.cart);
    const totalPaid = paymentCash + paymentUPI + paymentCard + paymentCredit;

    // Validate payment amounts
    if (Math.abs(totalPaid - totals.grandTotal) > 0.01) {
        showToast(`Payment total (₹${totalPaid.toFixed(2)}) must equal grand total (₹${totals.grandTotal.toFixed(2)})`, 'error');
        return;
    }

    // Determine primary payment mode for backward compatibility
    let primaryPaymentMode = 'cash';
    if (paymentCredit > 0 && paymentCredit >= paymentCash && paymentCredit >= paymentUPI && paymentCredit >= paymentCard) {
        primaryPaymentMode = 'credit';
    } else if (paymentUPI > 0 && paymentUPI >= paymentCash && paymentUPI >= paymentCard) {
        primaryPaymentMode = 'upi';
    } else if (paymentCard > 0 && paymentCard >= paymentCash) {
        primaryPaymentMode = 'card';
    }

    const invoiceData = {
        items: state.cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            unit: item.unit,
            gstRate: item.gstRate,
            baseTotal: item.baseTotal,
            gstAmount: item.gstAmount,
            total: item.total
        })),
        customerName,
        customerPhone,
        paymentMode: primaryPaymentMode,
        paymentSplit: {
            cash: paymentCash,
            upi: paymentUPI,
            card: paymentCard,
            credit: paymentCredit
        },
        status: paymentCredit > 0 ? 'unpaid' : 'paid',
        subtotal: totals.subtotal,
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal
    };

    try {
        const result = await createInvoice(invoiceData);
        invoiceData.invoiceNumber = result.invoiceNumber;
        invoiceData.createdAt = new Date();

        // Update stock for each item
        for (const item of state.cart) {
            const product = state.products.find(p => p.id === item.id);
            if (product && product.stock !== undefined) {
                const newStock = Math.max(0, product.stock - item.quantity);
                await updateProduct(item.id, { stock: newStock });
            }
        }

        // Update customer if credit payment
        if (paymentCredit > 0 && customerName) {
            let customer = state.customers.find(c => c.name === customerName);
            if (customer) {
                await updateCustomer(customer.id, {
                    creditBalance: (customer.creditBalance || 0) + paymentCredit,
                    totalPurchases: (customer.totalPurchases || 0) + totals.grandTotal,
                    visitCount: (customer.visitCount || 0) + 1
                });
            } else {
                await addCustomer({
                    name: customerName,
                    phone: customerPhone,
                    creditBalance: paymentCredit,
                    totalPurchases: totals.grandTotal,
                    visitCount: 1
                });
            }
        }

        showToast(`Bill ${result.invoiceNumber} saved! ✓`, 'success');

        if (share) {
            const message = generateInvoiceMessage(invoiceData, state.vendor);
            shareOnWhatsApp(message, customerPhone);
        } else {
            // Print
            printInvoiceReceipt(invoiceData);
        }

        // Reset cart and payment fields
        state.cart = [];
        updateCart();
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';
        document.getElementById('paymentCash').value = '0';
        document.getElementById('paymentUPI').value = '0';
        document.getElementById('paymentCard').value = '0';
        document.getElementById('paymentCredit').value = '0';
        updatePaymentValidation();

    } catch (error) {
        console.error('Error saving bill:', error);
        showToast('Error saving bill. Please try again.', 'error');
    }
};

// Helper function to fill remaining amount in cash
window.fillRemainingCash = function () {
    const totals = calculateInvoiceTotal(state.cart);
    if (!totals || totals.grandTotal === 0) {
        showToast('Add items to cart first', 'warning');
        return;
    }

    const paymentUPI = parseFloat(document.getElementById('paymentUPI').value) || 0;
    const paymentCard = parseFloat(document.getElementById('paymentCard').value) || 0;
    const paymentCredit = parseFloat(document.getElementById('paymentCredit').value) || 0;

    const remaining = totals.grandTotal - paymentUPI - paymentCard - paymentCredit;
    document.getElementById('paymentCash').value = Math.max(0, remaining).toFixed(2);
    updatePaymentValidation();
};

// Update payment validation display
function updatePaymentValidation() {
    const validationDiv = document.getElementById('paymentValidation');
    if (!validationDiv) return;

    const totals = calculateInvoiceTotal(state.cart);
    const grandTotal = totals?.grandTotal || 0;

    const paymentCash = parseFloat(document.getElementById('paymentCash')?.value) || 0;
    const paymentUPI = parseFloat(document.getElementById('paymentUPI')?.value) || 0;
    const paymentCard = parseFloat(document.getElementById('paymentCard')?.value) || 0;
    const paymentCredit = parseFloat(document.getElementById('paymentCredit')?.value) || 0;

    const totalPaid = paymentCash + paymentUPI + paymentCard + paymentCredit;
    const diff = grandTotal - totalPaid;

    if (Math.abs(diff) < 0.01) {
        validationDiv.innerHTML = `<span style="color: var(--success-500);">✓ Payment matches total (₹${grandTotal.toFixed(2)})</span>`;
    } else if (diff > 0) {
        validationDiv.innerHTML = `<span style="color: var(--warning-500);">⚠ ₹${diff.toFixed(2)} remaining to allocate</span>`;
    } else {
        validationDiv.innerHTML = `<span style="color: var(--danger-500);">✗ ₹${Math.abs(diff).toFixed(2)} over-allocated</span>`;
    }
}

function printInvoiceReceipt(invoice) {
    const html = `
        <div class="header">
            <h2>${state.vendor?.businessName}</h2>
            <p>${state.vendor?.address}</p>
            ${state.vendor?.gstNumber ? `<p>GSTIN: ${state.vendor.gstNumber}</p>` : ''}
            <p>📞 ${state.vendor?.phone}</p>
        </div>
        <p><strong>Invoice: ${invoice.invoiceNumber}</strong></p>
        <p>Date: ${formatDate(invoice.createdAt, 'datetime')}</p>
        ${invoice.customerName ? `<p>Customer: ${invoice.customerName}</p>` : ''}
        <hr>
        <div class="items">
            ${invoice.items.map(item => `
                <div class="item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>₹${item.total.toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        <div class="total">
            <div class="item"><span>Subtotal</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
            <div class="item"><span>GST</span><span>₹${invoice.gstTotal.toFixed(2)}</span></div>
            <div class="item"><span><strong>TOTAL</strong></span><span><strong>₹${invoice.grandTotal.toFixed(2)}</strong></span></div>
        </div>
        <p>Payment: ${invoice.paymentSplit ?
            `${invoice.paymentSplit.cash > 0 ? `Cash: ₹${invoice.paymentSplit.cash.toFixed(2)} ` : ''}${invoice.paymentSplit.upi > 0 ? `UPI: ₹${invoice.paymentSplit.upi.toFixed(2)} ` : ''}${invoice.paymentSplit.card > 0 ? `Card: ₹${invoice.paymentSplit.card.toFixed(2)} ` : ''}${invoice.paymentSplit.credit > 0 ? `Credit: ₹${invoice.paymentSplit.credit.toFixed(2)}` : ''}`
            : invoice.paymentMode.toUpperCase()} | ${invoice.status === 'paid' ? '✓ Paid' : '⏳ Pending'}</p>
        <div class="footer">
            <p>Thank you for shopping with us! 🙏</p>
        </div>
    `;

    printInvoice(html);
}

// ============================================
// PRODUCT CATALOG PAGE
// ============================================


// ============================================
// REFUND/RETURN PAGE
// ============================================

async function renderReturns(container) {
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Returns & Exchange (वापसी)</h1>
                <p class="page-subtitle">Process returns and refunds</p>
            </div>
        </div>

        <div class="card">
            <div class="search-bar">
                <input type="text" id="invoiceSearch" placeholder="Search by Invoice Number (e.g. INV-2024-0001)">
                    <button class="btn btn-primary" onclick="searchInvoiceForReturn()">Search</button>
            </div>
            <div id="returnInvoiceDetails" style="margin-top: 1.5rem;"></div>
        </div>
    `;

    document.getElementById('invoiceSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchInvoiceForReturn();
    });
}

window.searchInvoiceForReturn = async function () {
    const term = document.getElementById('invoiceSearch').value.trim();
    if (!term) return;

    const container = document.getElementById('returnInvoiceDetails');
    container.innerHTML = '<p class="text-center">Searching...</p>';

    try {
        // Fetch all invoices and find match (MVP approach)
        // In prod, use specific query
        const invoices = await getInvoices();
        const invoice = invoices.find(inv => inv.invoiceNumber.toLowerCase() === term.toLowerCase());

        if (!invoice) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Invoice not found (बिल नहीं मिला)</p>
                </div>
            `;
            return;
        }

        renderReturnInvoice(invoice);
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="error-message">Error searching invoice</p>';
    }
};

function renderReturnInvoice(invoice) {
    const container = document.getElementById('returnInvoiceDetails');

    container.innerHTML = `
        <div class="invoice-meta" style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--gray-200);">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <h3>Invoice #${invoice.invoiceNumber}</h3>
                    <p class="text-gray">${formatDate(invoice.createdAt, 'datetime')}</p>
                    <p>Customer: ${invoice.customerName || 'Walk-in'}</p>
                </div>
                <div class="text-right">
                    <div class="badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}">${invoice.status}</div>
                    <p style="margin-top: 0.5rem;">Total: ${formatCurrency(invoice.grandTotal)}</p>
                </div>
            </div>
        </div>
        
        <h4>Select items to return (वापसी के लिए आइटम चुनें)</h4>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">Select</th>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Return Qty</th>
                        <th>Refund Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map((item, index) => `
                        <tr>
                            <td>
                                <input type="checkbox" class="return-check" 
                                    data-index="${index}" 
                                    onchange="updateReturnTotal()">
                            </td>
                            <td>${item.name}</td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>${item.quantity}</td>
                            <td>
                                <input type="number" class="return-qty" 
                                    data-index="${index}" 
                                    min="0" max="${item.quantity}" value="0"
                                    style="width: 80px; padding: 4px;"
                                    disabled
                                    onchange="updateReturnTotal()">
                            </td>
                            <td class="refund-amount" data-index="${index}">₹0.00</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="return-summary" style="margin-top: 1.5rem; text-align: right;">
            <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">
                Total Refund: <span id="totalRefund">₹0.00</span>
            </div>
            <button class="btn btn-danger" onclick="processReturn('${invoice.id}')" id="processReturnBtn" disabled>
                Process Return (वापसी करें)
            </button>
        </div>
    `;

    // Setup checkbox listeners to toggle quantity input
    document.querySelectorAll('.return-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            const qtyInput = document.querySelector(`.return-qty[data-index="${index}"]`);
            qtyInput.disabled = !e.target.checked;
            if (e.target.checked) {
                qtyInput.value = 1; // Default to 1
                qtyInput.focus();
            } else {
                qtyInput.value = 0;
            }
            updateReturnTotal();
        });
    });
}

window.updateReturnTotal = function () {
    let totalRefund = 0;
    const checks = document.querySelectorAll('.return-check:checked');
    const invoice = window.currentReturnInvoice; // Don't rely on global state if possible, but here we need original items
    // Re-fetch items from DOM or store in render?
    // Let's attach item data to DOM or look up.
    // Easier: Store current invoice in state or re-fetch logic. 
    // We didn't store it globally. Let's fix loop.

    // Better logic: Iterate all rows, look at checkbox and qty.
    // But we need PRICE. It is in the DOM? Yes in <td> but unformatted?
    // Let's attach price to the checkbox dataset for valid precision.
};

// Redefine renderReturnInvoice to include data needed for calculation
// Actually, let's just make updateReturnTotal properly parse the DOM or keep a reference.
// Since `invoice` was passed to renderReturnInvoice, we can attach it to the container?
// Or simpler: put price in data attribute.

window.updateReturnTotal = function () {
    let total = 0;
    document.querySelectorAll('.return-check').forEach(cb => {
        const index = cb.dataset.index;
        const row = cb.closest('tr');
        const qtyInput = row.querySelector('.return-qty');
        const refundCell = row.querySelector('.refund-amount');
        const priceCell = row.cells[2]; // Price column

        // Parse price from text (remove ₹ and comma)
        const priceText = priceCell.textContent.replace(/[₹,]/g, '').trim();
        const price = parseFloat(priceText) || 0;

        if (cb.checked) {
            const qty = parseInt(qtyInput.value) || 0;
            const itemTotal = price * qty;
            total += itemTotal;
            refundCell.textContent = formatCurrency(itemTotal);
        } else {
            refundCell.textContent = '₹0.00';
        }
    });

    document.getElementById('totalRefund').textContent = formatCurrency(total);
    document.getElementById('processReturnBtn').disabled = total <= 0;
};

window.processReturn = async function (invoiceId) {
    if (!confirm('Are you sure you want to process this return? Stock will be updated.')) return;

    const itemsToReturn = [];
    document.querySelectorAll('.return-check:checked').forEach(cb => {
        const row = cb.closest('tr');
        const name = row.cells[1].textContent;
        const qty = parseInt(row.querySelector('.return-qty').value);
        const refundAmount = parseFloat(row.querySelector('.refund-amount').textContent.replace(/[₹,]/g, ''));

        if (qty > 0) {
            itemsToReturn.push({ name, quantity: qty, refundAmount });
        }
    });

    if (itemsToReturn.length === 0) return;

    const totalRefund = parseFloat(document.getElementById('totalRefund').textContent.replace(/[₹,]/g, ''));

    try {
        await addReturn({
            invoiceId,
            items: itemsToReturn,
            totalRefund,
            reason: 'Customer Return'
        });

        // Update stock (increase)
        const products = await getProducts();
        for (const item of itemsToReturn) {
            const product = products.find(p => p.name === item.name);
            if (product && product.stock !== undefined) {
                await updateProduct(product.id, {
                    stock: product.stock + item.quantity
                });
            }
        }

        showToast('Return processed successfully! Stock updated.', 'success');
        document.getElementById('returnInvoiceDetails').innerHTML = '';
        document.getElementById('invoiceSearch').value = '';

    } catch (error) {
        console.error('Error processing return:', error);
        showToast('Error processing return', 'error');
    }
};

// ============================================
// PRODUCT CATALOG PAGE
// ============================================

async function renderCatalog(container) {
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Product Catalog (उत्पाद सूची)</h1>
                <p class="page-subtitle">Manage your inventory</p>
            </div>
            <button class="btn btn-primary" onclick="showAddProductModal()">
                + Add Product (नया उत्पाद)
            </button>
        </div>
        
        <div class="card" style="margin-bottom: 1.5rem;">
            <div class="search-bar">
                <input type="text" id="catalogSearch" placeholder="Search products... (उत्पाद खोजें)">
            </div>
        </div>
        
        <div id="productGrid" class="product-grid"></div>
        
        <!--Add Product Modal-->
        <div class="modal" id="productModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="productModalTitle">Add Product (उत्पाद जोड़ें)</h3>
                    <button class="modal-close" onclick="closeProductModal()">×</button>
                </div>
                <form id="productForm">
                    <input type="hidden" id="productId">
                        <div class="form-group">
                            <label>Product Name (नाम) *</label>
                            <input type="text" id="prodName" required placeholder="Enter product name">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Cost Price (CP) ₹</label>
                                <input type="number" id="prodCost" min="0" step="0.01" placeholder="Cost" style="border-color: var(--primary-200);">
                            </div>
                            <div class="form-group">
                                <label>Selling Price (SP) ₹ *</label>
                                <input type="number" id="prodPrice" required min="0" step="0.01" placeholder="0.00">
                                <small id="marginDisplay" style="color: var(--success-600); font-weight: 500;"></small>
                            </div>
                            <div class="form-group">
                                <label>Unit (इकाई) *</label>
                                <select id="prodUnit" required>
                                    <option value="piece">Piece (पीस)</option>
                                    <option value="kg">Kg (किलो)</option>
                                    <option value="liter">Liter (लीटर)</option>
                                    <option value="dozen">Dozen (दर्जन)</option>
                                    <option value="box">Box (बॉक्स)</option>
                                    <option value="packet">Packet (पैकेट)</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>GST Rate (%)</label>
                                <select id="prodGST">
                                    <option value="0">0%</option>
                                    <option value="5">5%</option>
                                    <option value="12">12%</option>
                                    <option value="18">18%</option>
                                    <option value="28">28%</option>
                                    <option value="40">40% (Luxury/Sin)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Stock Quantity</label>
                                <input type="number" id="prodStock" min="0" placeholder="Optional">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Category (श्रेणी)</label>
                            <select id="prodCategory">
                                <option value="">Select category</option>
                                <option value="grocery">Grocery (किराना)</option>
                                <option value="dairy">Dairy (डेयरी)</option>
                                <option value="beverages">Beverages (पेय)</option>
                                <option value="snacks">Snacks (स्नैक्स)</option>
                                <option value="personal">Personal Care</option>
                                <option value="household">Household</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>SKU Code</label>
                            <input type="text" id="prodSKU" placeholder="Auto-generated if empty">
                        </div>
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%;">
                            Save Product
                        </button>
                </form>
            </div>
        </div>
    `;

    renderProductGrid(state.products);

    // Setup search
    document.getElementById('catalogSearch').addEventListener('input', debounce((e) => {
        const term = e.target.value.toLowerCase();
        const filtered = state.products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            (p.sku && p.sku.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        );
        renderProductGrid(filtered);
    }, 300));

    // Setup form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSave);
        // We need to re-attach auto-fill listeners since the form is re-rendered
        document.getElementById('prodName').addEventListener('blur', autoFillData);
        document.getElementById('prodCategory').addEventListener('change', () => {
            autoFillData();
            autoCalcPrice();
        });
        document.getElementById('prodCost').addEventListener('input', debounce(autoCalcPrice, 300));
    }
}

function renderProductGrid(products) {
    const container = document.getElementById('productGrid');

    if (products.length === 0) {
        container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">📦</div>
                <h3>No products found</h3>
                <p>Add your first product to get started</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            ${p.stock !== undefined && p.stock < 10 ?
            `<span class="product-stock badge badge-warning">Low Stock: ${p.stock}</span>` : ''
        }
            <div class="product-name">${p.name}</div>
            <div class="product-price">${formatCurrency(p.price)} / ${p.unit}</div>
            <div class="product-meta">
                <span>GST: ${p.gstRate || 0}%</span>
                ${p.category ? `<span>${p.category}</span>` : ''}
                ${p.sku ? `<span>${p.sku}</span>` : ''}
            </div>
            <div class="product-actions">
                <button class="btn btn-outline" onclick="editProduct('${p.id}')">✏️ Edit</button>
                <button class="btn btn-danger" onclick="confirmDeleteProduct('${p.id}')">🗑️</button>
            </div>
        </div>
        `).join('');
}

window.showAddProductModal = function () {
    document.getElementById('productModalTitle').textContent = 'Add Product (उत्पाद जोड़ें)';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('marginDisplay').textContent = '';
    document.getElementById('productModal').classList.add('active');
};

window.closeProductModal = function () {
    document.getElementById('productModal').classList.remove('active');
};

window.editProduct = function (productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('productModalTitle').textContent = 'Edit Product (संपादित करें)';
    document.getElementById('productId').value = productId;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCost').value = product.costPrice || '';
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodUnit').value = product.unit;
    document.getElementById('prodGST').value = product.gstRate || 0;
    document.getElementById('prodStock').value = product.stock || '';
    document.getElementById('prodCategory').value = product.category || '';
    document.getElementById('prodSKU').value = product.sku || '';

    // Trigger calculation display if both exist
    if (product.costPrice && product.price) {
        const profit = product.price - product.costPrice;
        const margin = ((profit / product.price) * 100).toFixed(1);
        document.getElementById('marginDisplay').textContent = `Profit: ₹${profit.toFixed(2)} (${margin}%)`;
    } else {
        document.getElementById('marginDisplay').textContent = '';
    }

    document.getElementById('productModal').classList.add('active');
};

async function handleProductSave(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    let name = document.getElementById('prodName').value.trim();
    const costPrice = parseFloat(document.getElementById('prodCost').value) || 0;
    const priceStr = document.getElementById('prodPrice').value;
    const price = parseFloat(priceStr);
    const unit = document.getElementById('prodUnit').value;
    const gstRate = parseInt(document.getElementById('prodGST').value) || 0;
    const stockStr = document.getElementById('prodStock').value;
    const category = document.getElementById('prodCategory').value;
    let sku = document.getElementById('prodSKU').value.trim();

    // Validation
    if (!name) {
        showToast('Product name is required', 'error');
        return;
    }
    if (isNaN(price)) {
        showToast('Valid selling price is required', 'error');
        return;
    }

    // Standardize name before saving to ensure future matches
    const std = findProductByName(name);
    if (std) name = std.name;

    if (!sku) {
        sku = generateSKU(name, category);
    }

    const data = {
        name,
        costPrice,
        price,
        unit,
        gstRate,
        category,
        sku,
        updatedAt: new Date() // Local timestamp for consistency
    };

    // Only add stock if it's a valid number
    if (stockStr && !isNaN(parseInt(stockStr))) {
        data.stock = parseInt(stockStr);
    }

    try {
        if (productId) {
            await updateProduct(productId, data);
            showToast('Product updated! ✓', 'success');
        } else {
            await addProduct(data);
            showToast('Product added! ✓', 'success');
        }

        closeProductModal();
        renderCatalog(document.getElementById('mainContent'));
    } catch (error) {
        console.error('❌ Save Error:', error);
        showToast('Error saving product: ' + (error.message || 'Unknown error'), 'error');
    }
}

window.confirmDeleteProduct = async function (productId) {
    if (confirm('Are you sure you want to delete this product? (क्या आप इस उत्पाद को हटाना चाहते हैं?)')) {
        try {
            await deleteProduct(productId);
            showToast('Product deleted', 'success');
            renderCatalog(document.getElementById('mainContent'));
        } catch (error) {
            showToast('Error deleting product', 'error');
        }
    }
};

// ============================================
// BILL HISTORY PAGE
// ============================================

async function renderBillHistory(container) {
    const invoices = await getInvoices();

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Bill History (बिल इतिहास)</h1>
                <p class="page-subtitle">${invoices.length} invoices</p>
            </div>
            <button class="btn btn-outline" onclick="exportBills()">
                📥 Export
            </button>
        </div>

        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="billsTable">
                        ${invoices.length === 0 ? `
                            <tr><td colspan="6" style="text-align: center; padding: 2rem;">
                                No bills yet (अभी कोई बिल नहीं)
                            </td></tr>
                        ` : invoices.map(inv => `
                            <tr>
                                <td><strong>${inv.invoiceNumber}</strong></td>
                                <td>${formatDate(inv.createdAt?.toDate ? inv.createdAt.toDate() : inv.createdAt, 'datetime')}</td>
                                <td>${inv.customerName || '-'}</td>
                                <td>${formatCurrency(inv.grandTotal)}</td>
                                <td>
                                    <span class="badge ${inv.status === 'paid' ? 'badge-success' : 'badge-danger'}">
                                        ${inv.status === 'paid' ? '✓ Paid' : '⏳ Unpaid'}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-outline" onclick="viewInvoice('${inv.id}')">👁️</button>
                                    <button class="btn btn-outline" onclick="downloadInvoice('${inv.id}')">📥</button>
                                    <button class="btn btn-outline" onclick="shareInvoice('${inv.id}')">📤</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

window.exportBills = async function () {
    try {
        const invoices = await getInvoices();
        const data = invoices.map(inv => ({
            invoiceNumber: inv.invoiceNumber,
            date: formatDate(inv.createdAt?.toDate ? inv.createdAt.toDate() : inv.createdAt),
            customer: inv.customerName || '',
            amount: inv.grandTotal,
            gst: inv.gstTotal,
            status: inv.status,
            paymentMode: inv.paymentMode
        }));
        exportToCSV(data, 'bills');
    } catch (error) {
        showToast('Export failed', 'error');
    }
};

// ============================================
// CREDIT BOOK PAGE
// ============================================

async function renderCreditBook(container) {
    try {
        const customers = await getCustomersWithCredit();

        container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Credit Book (उधार खाता)</h1>
                    <p class="page-subtitle">Track outstanding payments</p>
                </div>
            </div>
            
            <div class="card" style="margin-bottom: 2rem;">
                <div class="stat-grid" style="grid-template-columns: repeat(2, 1fr);">
                    <div style="text-align: center;">
                        <h3 class="stat-value" style="color: var(--danger-500);">${customers.length}</h3>
                        <p class="stat-label">Pending Customers</p>
                    </div>
                    <div style="text-align: center;">
                        <h3 class="stat-value" style="color: var(--danger-500);">
                            ${formatCurrency(customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0))}
                        </h3>
                        <p class="stat-label">Total Outstanding</p>
                    </div>
                </div>
            </div>

            <div class="grid-card">
                ${customers.length === 0 ? `
                    <div class="empty-state">
                        <p>No outstanding credits! 🎉</p>
                    </div>
                ` : customers.map(customer => `
                    <div class="customer-card card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h3>${customer.name}</h3>
                                <p class="text-gray">📞 ${customer.phone}</p>
                                <p class="text-sm">Last Visit: ${formatDate(customer.updatedAt || new Date())}</p>
                            </div>
                            <div class="text-right">
                                <h2 style="color: var(--danger-500);">${formatCurrency(customer.creditBalance)}</h2>
                                <p class="text-xs text-gray">Outstanding</p>
                            </div>
                        </div>
                        
                        <div style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <button class="btn btn-outline" onclick="sendReminder('${customer.id}', ${customer.creditBalance}, '${customer.phone}', '${customer.name}')">
                                📱 Remind
                            </button>
                            <button class="btn btn-primary" onclick="openSettleModal('${customer.id}', ${customer.creditBalance}, '${customer.name}')">
                                ✅ Settle
                            </button>
                        </div>
                         <button class="btn btn-ghost" style="width: 100%; margin-top: 0.5rem;" onclick="viewPaymentHistory('${customer.id}', '${customer.name}')">
                            🕒 View History
                        </button>
                    </div>
                `).join('')}
            </div>
            
            <!--Settle Payment Modal-->
        <div class="modal" id="settleModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Settle Payment (भुगतान)</h3>
                    <button class="modal-close" onclick="closeSettleModal()">×</button>
                </div>
                <div id="settleModalBody">
                    <div class="form-group">
                        <label>Customer</label>
                        <input type="text" id="settleCustomerName" disabled>
                            <input type="hidden" id="settleCustomerId">
                            </div>
                            <div class="form-group">
                                <label>Total Outstanding</label>
                                <input type="text" id="settleTotalDue" disabled>
                            </div>
                            <div class="form-group">
                                <label>Paying Amount (₹) *</label>
                                <input type="number" id="settleAmount" min="1" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label>Payment Mode</label>
                                <div class="split-payment-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                                    <label class="radio-card">
                                        <input type="radio" name="settleMode" value="cash" checked>
                                            <span>Cash</span>
                                    </label>
                                    <label class="radio-card">
                                        <input type="radio" name="settleMode" value="upi">
                                            <span>UPI</span>
                                    </label>
                                    <label class="radio-card">
                                        <input type="radio" name="settleMode" value="card">
                                            <span>Card</span>
                                    </label>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Notes (Optional)</label>
                                <input type="text" id="settleNotes" placeholder="Transaction ID, etc.">
                            </div>
                            <button class="btn btn-success btn-large" style="width: 100%;" onclick="processSettlement()">
                                Receive Payment (भुगतान लें)
                            </button>
                    </div>
                </div>
            </div>

            <!-- History Modal -->
            <div class="modal" id="historyModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="historyTitle">Payment History</h3>
                        <button class="modal-close" onclick="document.getElementById('historyModal').classList.remove('active')">×</button>
                    </div>
                    <div id="historyList" style="max-height: 300px; overflow-y: auto;"></div>
                </div>
            </div>
            `;
    } catch (error) {
        console.error('Error rendering credit book:', error);
        showToast('Error loading credit book', 'error');
    }
}

window.openSettleModal = function (customerId, balance, name) {
    document.getElementById('settleCustomerId').value = customerId;
    document.getElementById('settleCustomerName').value = name;
    document.getElementById('settleTotalDue').value = formatCurrency(balance);
    document.getElementById('settleAmount').max = balance;
    document.getElementById('settleAmount').value = balance.toFixed(2);

    document.getElementById('settleModal').classList.add('active');
};

window.closeSettleModal = function () {
    document.getElementById('settleModal').classList.remove('active');
    document.getElementById('settleAmount').value = '';
    document.getElementById('settleNotes').value = '';
};

window.processSettlement = async function () {
    const customerId = document.getElementById('settleCustomerId').value;
    const amount = parseFloat(document.getElementById('settleAmount').value);
    const mode = document.querySelector('input[name="settleMode"]:checked').value;
    const notes = document.getElementById('settleNotes').value;

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    try {
        const customer = state.customers.find(c => c.id === customerId);
        if (!customer) throw new Error('Customer not found');

        const newBalance = (customer.creditBalance || 0) - amount;

        // 1. Add payment record
        await addPaymentRecord({
            customerId,
            customerName: customer.name,
            amount,
            mode,
            notes,
            previousBalance: customer.creditBalance || 0,
            newBalance
        });

        // 2. Update customer balance
        await updateCustomer(customerId, {
            creditBalance: Math.max(0, newBalance) // Ensure non-negative
        });

        showToast(`Payment of ${formatCurrency(amount)} received!`, 'success');
        closeSettleModal();
        renderCreditBook(document.getElementById('mainContent')); // Refresh view

    } catch (error) {
        console.error('Error processing payment:', error);
        showToast('Error processing payment', 'error');
    }
};

window.viewPaymentHistory = async function (customerId, name) {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    document.getElementById('historyTitle').textContent = `Payment History - ${name}`;

    list.innerHTML = '<p class="text-center">Loading history...</p>';
    modal.classList.add('active');

    try {
        const payments = await getCustomerPayments(customerId);

        if (payments.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No payment history found</p></div>';
            return;
        }

        list.innerHTML = `
            <table style="width: 100%;">
                <thead>
                    <tr>
                        <th style="padding: 8px; text-align: left;">Date</th>
                        <th style="padding: 8px; text-align: right;">Amount</th>
                        <th style="padding: 8px; text-align: center;">Mode</th>
                        <th style="padding: 8px; text-align: left;">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(p => `
                        <tr style="border-bottom: 1px solid var(--gray-200);">
                            <td style="padding: 8px;">${formatDate(p.createdAt, 'datetime')}</td>
                            <td style="padding: 8px; text-align: right; color: var(--success-500); font-weight: 600;">
                                ${formatCurrency(p.amount)}
                            </td>
                            <td style="padding: 8px; text-align: center;">
                                <span class="badge badge-info">${p.mode.toUpperCase()}</span>
                            </td>
                            <td style="padding: 8px; color: var(--gray-500); font-size: 0.85rem;">
                                ${p.notes || '-'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error('Error fetching history:', error);
        list.innerHTML = '<p class="error-message">Error loading history</p>';
    }
};

window.markAsPaid = async function (customerId, amount) {
    if (confirm(`Mark ${formatCurrency(amount)} as paid ? (भुगतान हुआ ?)`)) {
        try {
            await updateCustomer(customerId, { creditBalance: 0 });
            showToast('Payment recorded! ✓', 'success');
            renderCreditBook(document.getElementById('mainContent'));
        } catch (error) {
            showToast('Error updating payment', 'error');
        }
    }
};

window.sendReminder = function (customerId, amount, phone, name) {
    const message = generatePaymentReminder({ name }, amount);
    shareOnWhatsApp(message, phone);
};

// ============================================
// CUSTOMERS PAGE
// ============================================

async function renderCustomers(container) {
    state.customers = await getCustomers();

    container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Customers (ग्राहक सूची)</h1>
                    <p class="page-subtitle">${state.customers.length} customers</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-outline" onclick="showBulkGreetingModal()">
                        📨 Bulk Greetings
                    </button>
                    <button class="btn btn-primary" onclick="showAddCustomerModal()">
                        ➕ Add Customer
                    </button>
                </div>
            </div>

            <div class="card">
                ${state.customers.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No customers yet</h3>
                    <p>Customers are added automatically when you create credit bills</p>
                </div>
            ` : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Total Purchases</th>
                                <th>Credit Balance</th>
                                <th>Visits</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.customers.map(c => `
                                <tr>
                                    <td><strong>${c.name}</strong></td>
                                    <td>${c.phone ? `<a href="tel:${c.phone}">${c.phone}</a>` : '-'}</td>
                                    <td>${formatCurrency(c.totalPurchases || 0)}</td>
                                    <td>
                                        ${c.creditBalance > 0 ?
            `<span class="badge badge-danger">${formatCurrency(c.creditBalance)}</span>` :
            '<span class="badge badge-success">Clear</span>'}
                                    </td>
                                    <td>${c.visitCount || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
            </div>
            `;
}

// Bulk Greetings Logic
window.showBulkGreetingModal = function () {
    const modal = document.getElementById('bulkGreetingModal');
    const customerList = document.getElementById('bulkCustomerList');
    if (!modal || !customerList) return;

    // Load customers into the selection list
    customerList.innerHTML = state.customers.map(c => {
        const phone = c.phone || 'No Phone';
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #eee;">
                <input type="checkbox" class="bulk-customer-check" 
                       data-name="${(c.name || '').replace(/"/g, '&quot;')}" 
                       data-phone="${phone === 'No Phone' ? '' : phone}" 
                       checked>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${c.name}</div>
                    <div style="font-size: 0.8rem; color: #666;">${phone}</div>
                </div>
            </div>
        `;
    }).join('') || '<p style="text-align: center; padding: 1rem; color: #666;">No customers found</p>';

    updateGreetingPreview();
    document.getElementById('bulkSendStatus').style.display = 'none';
    const startBtn = document.getElementById('startBulkSendBtn');
    if (startBtn) {
        startBtn.textContent = 'Start Sending (भेजना शुरू करें)';
        startBtn.disabled = false;
    }
    modal.classList.add('active');
};

window.closeBulkGreetingModal = function () {
    document.getElementById('bulkGreetingModal').classList.remove('active');
    window.bulkState = null; // Clear bulk state
};

window.updateGreetingPreview = function () {
    const template = document.getElementById('greetingTemplate').value;
    const textarea = document.getElementById('greetingMessage');
    const bizName = state.vendor?.businessName || 'SmartDukaan';

    const templates = {
        diwali: `🪔 *Happy Diwali!* 🪔\n\nDear Customer,\n\nWishing you and your family a very Happy and Prosperous Diwali! Thank you for being a valued part of *${bizName}*.\n\nWarm Regards,\n${bizName}`,
        feedback: `📋 *Feedback Request* 📋\n\nDear Customer,\n\nWe hope you had a great experience shopping with *${bizName}*. We would love to hear your feedback to serve you better.\n\nThank you! 🙏`,
        custom: `Hello,\n\n[Write your message here]\n\nRegards,\n*${bizName}*`
    };

    textarea.value = templates[template] || '';
};

window.selectAllCustomers = function (checked) {
    document.querySelectorAll('.bulk-customer-check').forEach(cb => cb.checked = checked);
};

window.handleBulkSendClick = function () {
    if (!window.bulkState || window.bulkState.currentIndex >= window.bulkState.customers.length) {
        startBulkMessaging();
    } else {
        processNextBulkMessage();
    }
};

window.startBulkMessaging = function () {
    const selectedCustomers = Array.from(document.querySelectorAll('.bulk-customer-check:checked'))
        .map(cb => ({ name: cb.dataset.name, phone: cb.dataset.phone }));

    if (selectedCustomers.length === 0) {
        showToast('Please select at least one customer', 'error');
        return;
    }

    const message = document.getElementById('greetingMessage').value;
    if (!message) {
        showToast('Please enter a message', 'error');
        return;
    }

    console.log(`🚀 Starting bulk messaging for ${selectedCustomers.length} customers`);

    // Initialize bulk state
    window.bulkState = {
        customers: selectedCustomers,
        currentIndex: 0,
        message: message
    };

    const statusContainer = document.getElementById('bulkSendStatus');
    if (statusContainer) statusContainer.style.display = 'block';

    processNextBulkMessage();
};

function processNextBulkMessage() {
    if (!window.bulkState) return;

    const { customers, currentIndex, message } = window.bulkState;

    if (currentIndex >= customers.length) {
        document.getElementById('sendProgressText').textContent = '✅ All messages sent!';
        const btn = document.getElementById('startBulkSendBtn');
        if (btn) {
            btn.textContent = 'Finished! (पूर्ण)';
            btn.disabled = true;
        }
        showToast('Bulk messaging completed!', 'success');
        return;
    }

    const customer = customers[currentIndex];
    console.log(`📤 Processing ${customer.name} (${currentIndex + 1}/${customers.length})`);

    const progressText = document.getElementById('sendProgressText');
    if (progressText) {
        progressText.textContent = `Sending to: ${customer.name} (${currentIndex + 1}/${customers.length})`;
    }

    const nextBtn = document.getElementById('startBulkSendBtn');
    if (nextBtn) {
        const nextCustomer = customers[currentIndex + 1];
        nextBtn.textContent = nextCustomer
            ? `Send to: ${nextCustomer.name} (अगला)`
            : 'Close / Finish';
    }

    if (customer.phone && customer.phone !== 'No Phone' && customer.phone !== 'null' && customer.phone !== 'undefined') {
        showToast(`Opening WhatsApp for ${customer.name}...`, 'info');

        // CALL DIRECTLY (No setTimeout) to preserve user gesture context
        // This prevents the browser from blocking the popup
        shareOnWhatsApp(message, customer.phone);

        // Update the manual link in case popup was still blocked
        const encodedText = encodeURIComponent(message);
        let cleanPhone = String(customer.phone).replace(/\D/g, '');
        if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
        else if (cleanPhone.length > 12) cleanPhone = cleanPhone.slice(-12);
        const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;

        if (progressText) {
            progressText.innerHTML = `Sending to: <strong>${customer.name}</strong> (${currentIndex + 1}/${customers.length})<br>
            <a href="${url}" target="_blank" style="color: var(--primary-500); font-size: 0.9rem; text-decoration: underline;">
                Click here if window didn't open (यहाँ क्लिक करें)
            </a>`;
        }
    } else {
        showToast(`Skipping ${customer.name} (No valid phone found)`, 'warning');
    }

    window.bulkState.currentIndex++;
}

// ============================================
// EXPENSES PAGE
// ============================================

async function renderExpenses(container) {
    const expenses = await getExpenses();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Expenses (खर्च)</h1>
                    <p class="page-subtitle">Total: ${formatCurrency(totalExpenses)}</p>
                </div>
                <button class="btn btn-primary" onclick="showAddExpenseModal()">
                    ➕ Add Expense
                </button>
            </div>

            <div class="card">
                ${expenses.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">💸</div>
                    <h3>No expenses recorded</h3>
                    <p>Track your business expenses here</p>
                </div>
            ` : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses.map(e => `
                                <tr>
                                    <td>${formatDate(e.date)}</td>
                                    <td><span class="badge badge-primary">${e.category}</span></td>
                                    <td>${e.description || '-'}</td>
                                    <td><strong>${formatCurrency(e.amount)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
            </div>

            <!--Add Expense Modal-->
            <div class="modal" id="expenseModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add Expense (खर्च जोड़ें)</h3>
                        <button class="modal-close" onclick="closeExpenseModal()">×</button>
                    </div>
                    <form id="expenseForm">
                        <div class="form-group">
                            <label>Category (श्रेणी) *</label>
                            <select id="expCategory" required>
                                <option value="">Select category</option>
                                <option value="Rent">Rent (किराया)</option>
                                <option value="Electricity">Electricity (बिजली)</option>
                                <option value="Salary">Staff Salary (वेतन)</option>
                                <option value="Purchase">Restocking (खरीदारी)</option>
                                <option value="Maintenance">Maintenance (रखरखाव)</option>
                                <option value="Transport">Transport (परिवहन)</option>
                                <option value="Other">Other (अन्य)</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Amount (राशि) ₹ *</label>
                                <input type="number" id="expAmount" required min="0" step="0.01">
                            </div>
                            <div class="form-group">
                                <label>Date (तारीख) *</label>
                                <input type="date" id="expDate" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Description (विवरण)</label>
                            <textarea id="expDescription" rows="2" placeholder="Optional notes"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%;">
                            Save Expense
                        </button>
                    </form>
                </div>
            </div>
            `;

    document.getElementById('expenseForm')?.addEventListener('submit', handleExpenseSave);
}

window.showAddExpenseModal = function () {
    document.getElementById('expenseForm').reset();
    document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('expenseModal').classList.add('active');
};

window.closeExpenseModal = function () {
    document.getElementById('expenseModal').classList.remove('active');
};

async function handleExpenseSave(e) {
    e.preventDefault();

    const data = {
        category: document.getElementById('expCategory').value,
        amount: parseFloat(document.getElementById('expAmount').value),
        date: document.getElementById('expDate').value,
        description: document.getElementById('expDescription').value.trim()
    };

    try {
        await addExpense(data);
        showToast('Expense added! ✓', 'success');
        closeExpenseModal();
        renderExpenses(document.getElementById('mainContent'));
    } catch (error) {
        showToast('Error saving expense', 'error');
    }
}

// ============================================
// REPORTS PAGE
// ============================================

async function renderReports(container) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    container.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Reports (रिपोर्ट)</h1>
                    <p class="page-subtitle">Business analytics and GST reports</p>
                </div>
            </div>

            <div class="grid-2">
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 class="card-title">GST Summary (${month}/${year})</h3>
                        <button class="btn btn-outline" style="font-size: 0.75rem; padding: 4px 8px;" onclick="downloadGSTReport()">
                            📥 PDF
                        </button>
                    </div>
                    <div id="gstReport">Loading...</div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Export Data</h3>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <button class="btn btn-outline" onclick="exportData('products')">
                            📦 Export Products
                        </button>
                        <button class="btn btn-outline" onclick="exportData('invoices')">
                            🧾 Export Invoices
                        </button>
                        <button class="btn btn-outline" onclick="exportData('customers')">
                            👥 Export Customers
                        </button>
                        <button class="btn btn-outline" onclick="exportData('expenses')">
                            💸 Export Expenses
                        </button>
                        <button class="btn btn-primary" onclick="backupAllData()">
                            💾 Full Backup
                        </button>
                    </div>
                </div>
            </div>
            `;

    // Load GST report
    try {
        const gstData = await getGSTReport(month, year);
        document.getElementById('gstReport').innerHTML = `
            <table>
                <thead>
                    <tr><th>GST Rate</th><th>Taxable Amount</th><th>GST Collected</th></tr>
                </thead>
                <tbody>
                    ${Object.entries(gstData.breakdown).map(([rate, data]) => `
                        <tr>
                            <td>${rate}%</td>
                            <td>${formatCurrency(data.taxable)}</td>
                            <td>${formatCurrency(data.gst)}</td>
                        </tr>
                    `).join('')}
                    <tr style="font-weight: bold;">
                        <td>Total</td>
                        <td>${formatCurrency(gstData.totalTaxable)}</td>
                        <td>${formatCurrency(gstData.totalGST)}</td>
                    </tr>
                </tbody>
            </table>
            `;
    } catch (error) {
        console.error(error);
    }
}

window.backupAllData = async function () {
    try {
        const data = await exportData('all');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `smartdukaan_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        showToast('Backup downloaded! ✓', 'success');
    } catch (error) {
        showToast('Backup failed', 'error');
    }
};

// ============================================
// SETTINGS PAGE
// ============================================

async function renderSettings(container) {
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Settings (सेटिंग्स)</h1>
                <p class="page-subtitle">Manage your business profile</p>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Business Profile (व्यापारी प्रोफ़ाइल)</h3>
            </div>
            <form id="settingsForm">
                <div class="form-group">
                    <label>Business Name (दुकान का नाम)</label>
                    <input type="text" id="setBizName" value="${state.vendor?.businessName || ''}">
                </div>
                <div class="form-group">
                    <label>Address (पता)</label>
                    <textarea id="setBizAddress" rows="3">${state.vendor?.address || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>GST Number</label>
                        <input type="text" id="setGST" value="${state.vendor?.gstNumber || ''}" maxlength="15">
                    </div>
                    <div class="form-group">
                        <label>Phone (फ़ोन)</label>
                        <input type="tel" id="setPhone" value="${state.vendor?.phone || ''}" maxlength="10">
                    </div>
                </div>
                <div class="form-group">
                    <label>UPI ID</label>
                    <input type="text" id="setUPI" value="${state.vendor?.upiId || ''}" placeholder="yourname@upi">
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
        </div>
        
        <div class="card" style="margin-top: 1.5rem;">
            <div class="card-header">
                <h3 class="card-title">Change PIN</h3>
            </div>
            <form id="pinChangeForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Current PIN</label>
                        <input type="password" id="currentPin" maxlength="4" required>
                    </div>
                    <div class="form-group">
                        <label>New PIN</label>
                        <input type="password" id="newPin" maxlength="4" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-outline">Update PIN</button>
            </form>
        </div>
    `;

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            businessName: document.getElementById('setBizName').value.trim(),
            address: document.getElementById('setBizAddress').value.trim(),
            gstNumber: document.getElementById('setGST').value.trim().toUpperCase(),
            phone: document.getElementById('setPhone').value.trim(),
            upiId: document.getElementById('setUPI').value.trim()
        };

        try {
            await saveVendorProfile({ ...state.vendor, ...data });
            state.vendor = { ...state.vendor, ...data };
            updateUserInfo();
            showToast('Settings saved! ✓', 'success');
        } catch (error) {
            showToast('Error saving settings', 'error');
        }
    });

    document.getElementById('pinChangeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPin = document.getElementById('currentPin').value;
        const newPin = document.getElementById('newPin').value;

        const storedPin = getFromLocal('vendorPin') || state.vendor?.pin;

        if (currentPin !== storedPin) {
            showToast('Current PIN is incorrect', 'error');
            return;
        }

        if (!validatePIN(newPin)) {
            showToast('New PIN must be 4 digits', 'error');
            return;
        }

        saveToLocal('vendorPin', newPin);
        showToast('PIN updated! ✓', 'success');
        document.getElementById('pinChangeForm').reset();
    });
}

// ============================================
// INITIALIZE ON LOAD
// ============================================


// Stock Logic: Auto-detect Category & Realtime Calc
const updateStockSP = () => {
    const costInput = document.getElementById('stockCost');
    const categoryInput = document.getElementById('stockCategory');
    if (!costInput || !categoryInput) return;

    const cost = parseFloat(costInput.value) || 0;
    const category = categoryInput.value;

    if (cost > 0 && category) {
        const sellingPrice = calculateSellingPrice(cost, category);
        const profit = (sellingPrice - cost).toFixed(2);
        const margin = ((profit / sellingPrice) * 100).toFixed(1);

        document.getElementById('stockSPDisplay').textContent = `₹${sellingPrice}`;
        document.getElementById('stockMarginDisplay').textContent = `Profit: ₹${profit} (${margin}%) per unit`;
    } else {
        const spDisplay = document.getElementById('stockSPDisplay');
        const marginDisplay = document.getElementById('stockMarginDisplay');
        if (spDisplay) spDisplay.textContent = '₹0.00';
        if (marginDisplay) marginDisplay.textContent = 'Enter Cost & Category to see profit';
    }
};

// Setup Stock Modal (Global)
window.showStockModal = function () {
    document.getElementById('stockForm')?.reset();
    const spDisplay = document.getElementById('stockSPDisplay');
    const marginDisplay = document.getElementById('stockMarginDisplay');
    if (spDisplay) spDisplay.textContent = '₹0.00';
    if (marginDisplay) marginDisplay.textContent = 'Enter Cost & Category to see profit';
    const modal = document.getElementById('stockModal');
    if (modal) modal.classList.add('active');
};

window.closeStockModal = function () {
    const modal = document.getElementById('stockModal');
    if (modal) modal.classList.remove('active');
};


// ============================================
// INVOICE DETAILS & PDF ACTIONS
// ============================================

window.viewInvoice = async function (id) {
    try {
        const invoices = await getInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        if (!invoice) {
            showToast('Invoice not found', 'error');
            return;
        }

        // Show a modal or overlay with invoice details and actions
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'invoiceViewModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Invoice Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div id="invoicePrintArea" style="padding: 1rem; background: white;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <h2>${state.vendor?.businessName}</h2>
                        <p>${state.vendor?.address}</p>
                        <p>📞 ${state.vendor?.phone}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                        <div>
                            <p><strong>To:</strong> ${invoice.customerName || 'Walk-in'}</p>
                            <p><strong>Phone:</strong> ${invoice.customerPhone || '-'}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Inv #:</strong> ${invoice.invoiceNumber}</p>
                            <p><strong>Date:</strong> ${formatDate(invoice.createdAt?.toDate ? invoice.createdAt.toDate() : invoice.createdAt, 'datetime')}</p>
                        </div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #eee;">
                                <th style="text-align: left; padding: 5px;">Item</th>
                                <th style="text-align: center; padding: 5px;">Qty</th>
                                <th style="text-align: right; padding: 5px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 5px;">${item.name}</td>
                                    <td style="text-align: center; padding: 5px;">${item.quantity}</td>
                                    <td style="text-align: right; padding: 5px;">${formatCurrency(item.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 1rem; border-top: 2px solid #eee; padding-top: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>GST:</span>
                            <span>${formatCurrency(invoice.gstTotal)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem;">
                            <span>Grand Total:</span>
                            <span>${formatCurrency(invoice.grandTotal)}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 1.5rem;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="downloadInvoice('${id}')">
                        📥 Download PDF
                    </button>
                    <button class="btn btn-outline" style="flex: 1;" onclick="printExistingInvoice('${id}')">
                        🖨️ Print
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error viewing invoice:', error);
        showToast('Error loading invoice', 'error');
    }
};

window.downloadInvoice = async function (id) {
    try {
        const invoices = await getInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        if (!invoice) return;

        showToast('Generating PDF...', 'info');
        await downloadInvoicePDF(invoice, state.vendor);
        showToast('PDF downloaded! ✓', 'success');
    } catch (error) {
        console.error('PDF Error:', error);
        showToast('Error generating PDF', 'error');
    }
};

window.printExistingInvoice = async function (id) {
    try {
        const invoices = await getInvoices();
        const invoice = invoices.find(inv => inv.id === id);
        if (!invoice) return;
        printInvoiceReceipt(invoice);
    } catch (error) {
        showToast('Print error', 'error');
    }
};

window.downloadGSTReport = async function () {
    const reportElement = document.getElementById('gstReport');
    if (!reportElement) return;

    showToast('Generating Report PDF...', 'info');
    const now = new Date();
    const filename = `GST_Report_${now.getMonth() + 1}_${now.getFullYear()}.pdf`;

    const wrapper = document.createElement('div');
    wrapper.style.padding = '20px';
    wrapper.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1>${state.vendor?.businessName}</h1>
            <h2>GST Report (${now.getMonth() + 1}/${now.getFullYear()})</h2>
        </div>
        ${reportElement.innerHTML}
    `;

    await downloadPDF(wrapper, filename);
    showToast('Report downloaded! ✓', 'success');
};

document.addEventListener('DOMContentLoaded', initApp);
