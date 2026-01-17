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
    getGSTReport,
    exportData
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
    validatePIN
} from './utils.js';

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

    // Check for existing vendor profile
    try {
        state.vendor = await getVendorProfile();

        if (!state.vendor) {
            // First time user - show setup
            showSetupModal();
        } else {
            // Existing user - show login
            showLoginModal();
        }
    } catch (error) {
        console.error('Init error:', error);
        showSetupModal();
    }

    // Setup navigation
    setupNavigation();

    // Setup sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', toggleSidebar);

    // Setup logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

// ============================================
// SETUP WIZARD
// ============================================

function showSetupModal() {
    const modal = document.getElementById('setupModal');
    modal.classList.add('active');

    const form = document.getElementById('setupForm');
    form.addEventListener('submit', handleSetup);
}

async function handleSetup(e) {
    e.preventDefault();

    const form = e.target;
    const data = {
        businessName: form.businessName.value.trim(),
        address: form.businessAddress.value.trim(),
        gstNumber: form.gstNumber.value.trim().toUpperCase(),
        phone: form.phoneNumber.value.trim(),
        category: form.businessCategory.value,
        upiId: form.upiId.value.trim(),
        pin: form.userPin.value
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

    if (!validatePIN(data.pin)) {
        showToast('PIN must be 4 digits', 'error');
        return;
    }

    try {
        await saveVendorProfile(data);
        state.vendor = data;
        saveToLocal('vendorPin', data.pin);

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

// ============================================
// LOGIN
// ============================================

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');

    // Update business name
    if (state.vendor) {
        document.getElementById('loginBusinessName').textContent = state.vendor.businessName;
    }

    // Setup PIN inputs
    const pinInputs = document.querySelectorAll('.pin-input');
    pinInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < 3) {
                pinInputs[index + 1].focus();
            }

            // Check if all filled
            const pin = Array.from(pinInputs).map(i => i.value).join('');
            if (pin.length === 4) {
                verifyPIN(pin);
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });

    pinInputs[0].focus();
}

async function verifyPIN(enteredPin) {
    const storedPin = getFromLocal('vendorPin') || state.vendor?.pin;

    if (enteredPin === storedPin) {
        document.getElementById('loginModal').classList.remove('active');
        state.isLoggedIn = true;
        updateUserInfo();
        showPage('dashboard');
        showToast('Welcome back! 🙏', 'success');
    } else {
        document.getElementById('pinError').textContent = 'Incorrect PIN. Try again.';
        document.querySelectorAll('.pin-input').forEach(i => {
            i.value = '';
            i.classList.add('error');
        });
        document.querySelector('.pin-input').focus();

        setTimeout(() => {
            document.querySelectorAll('.pin-input').forEach(i => i.classList.remove('error'));
            document.getElementById('pinError').textContent = '';
        }, 2000);
    }
}

function logout() {
    state.isLoggedIn = false;
    showLoginModal();
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

    // Load initial stats
    loadDashboardStats('today');
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
                    <label>Payment Mode (भुगतान विधि)</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <label class="btn btn-outline" style="cursor: pointer;">
                            <input type="radio" name="paymentMode" value="cash" checked style="margin-right: 0.5rem;">
                            💵 Cash
                        </label>
                        <label class="btn btn-outline" style="cursor: pointer;">
                            <input type="radio" name="paymentMode" value="upi" style="margin-right: 0.5rem;">
                            📱 UPI
                        </label>
                        <label class="btn btn-outline" style="cursor: pointer;">
                            <input type="radio" name="paymentMode" value="card" style="margin-right: 0.5rem;">
                            💳 Card
                        </label>
                        <label class="btn btn-outline" style="cursor: pointer;">
                            <input type="radio" name="paymentMode" value="credit" style="margin-right: 0.5rem;">
                            ⏳ Credit
                        </label>
                    </div>
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
    const paymentMode = document.querySelector('input[name="paymentMode"]:checked')?.value || 'cash';

    const totals = calculateInvoiceTotal(state.cart);

    const invoiceData = {
        items: state.cart.map(item => ({
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
        paymentMode,
        status: paymentMode === 'credit' ? 'unpaid' : 'paid',
        subtotal: totals.subtotal,
        gstTotal: totals.gstTotal,
        grandTotal: totals.grandTotal
    };

    try {
        const result = await createInvoice(invoiceData);
        invoiceData.invoiceNumber = result.invoiceNumber;
        invoiceData.createdAt = new Date();

        // Update customer if credit
        if (paymentMode === 'credit' && customerName) {
            let customer = state.customers.find(c => c.name === customerName);
            if (customer) {
                await updateCustomer(customer.id, {
                    creditBalance: (customer.creditBalance || 0) + totals.grandTotal,
                    totalPurchases: (customer.totalPurchases || 0) + totals.grandTotal,
                    visitCount: (customer.visitCount || 0) + 1
                });
            } else {
                await addCustomer({
                    name: customerName,
                    phone: customerPhone,
                    creditBalance: totals.grandTotal,
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

        // Reset cart
        state.cart = [];
        updateCart();
        document.getElementById('customerName').value = '';
        document.getElementById('customerPhone').value = '';

    } catch (error) {
        console.error('Error saving bill:', error);
        showToast('Error saving bill. Please try again.', 'error');
    }
};

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
        <p>Payment: ${invoice.paymentMode.toUpperCase()} | ${invoice.status === 'paid' ? '✓ Paid' : '⏳ Pending'}</p>
        <div class="footer">
            <p>Thank you for shopping with us! 🙏</p>
        </div>
    `;

    printInvoice(html);
}

// ============================================
// PRODUCT CATALOG PAGE
// ============================================

async function renderCatalog(container) {
    state.products = await getProducts();

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Products (उत्पाद सूची)</h1>
                <p class="page-subtitle">${state.products.length} products in catalog</p>
            </div>
            <button class="btn btn-primary" onclick="showAddProductModal()">
                ➕ Add Product
            </button>
        </div>
        
        <div class="card" style="margin-bottom: 1.5rem;">
            <div class="search-bar">
                <input type="text" id="catalogSearch" placeholder="Search products... (उत्पाद खोजें)">
            </div>
        </div>
        
        <div id="productGrid" class="product-grid"></div>
        
        <!-- Add Product Modal -->
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
                            <label>Price (कीमत) ₹ *</label>
                            <input type="number" id="prodPrice" required min="0" step="0.01" placeholder="0.00">
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
    document.getElementById('productForm').addEventListener('submit', handleProductSave);
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
            `<span class="product-stock badge badge-warning">Low Stock: ${p.stock}</span>` : ''}
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
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('prodUnit').value = product.unit;
    document.getElementById('prodGST').value = product.gstRate || 0;
    document.getElementById('prodStock').value = product.stock || '';
    document.getElementById('prodCategory').value = product.category || '';
    document.getElementById('prodSKU').value = product.sku || '';

    document.getElementById('productModal').classList.add('active');
};

async function handleProductSave(e) {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const unit = document.getElementById('prodUnit').value;
    const gstRate = parseInt(document.getElementById('prodGST').value) || 0;
    const stock = document.getElementById('prodStock').value ? parseInt(document.getElementById('prodStock').value) : undefined;
    const category = document.getElementById('prodCategory').value;
    let sku = document.getElementById('prodSKU').value.trim();

    if (!sku) {
        sku = generateSKU(name, category);
    }

    const data = { name, price, unit, gstRate, stock, category, sku };

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
        console.error(error);
        showToast('Error saving product', 'error');
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
    const customers = await getCustomersWithCredit();
    const totalCredit = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);

    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Credit Book (उधार खाता)</h1>
                <p class="page-subtitle">Total Outstanding: ${formatCurrency(totalCredit)}</p>
            </div>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 1.5rem;">
            <div class="stat-card danger">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <div class="stat-value">${formatCurrency(totalCredit)}</div>
                    <div class="stat-label">Total Credit (कुल उधार)</div>
                </div>
            </div>
            <div class="stat-card warning">
                <div class="stat-icon">👥</div>
                <div class="stat-content">
                    <div class="stat-value">${customers.length}</div>
                    <div class="stat-label">Customers with Credit</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            ${customers.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <h3>No pending credit!</h3>
                    <p>All payments are cleared (सभी भुगतान हो गए)</p>
                </div>
            ` : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Outstanding</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${customers.map(c => `
                                <tr>
                                    <td><strong>${c.name}</strong></td>
                                    <td>${c.phone || '-'}</td>
                                    <td><span class="badge badge-danger">${formatCurrency(c.creditBalance)}</span></td>
                                    <td>
                                        <button class="btn btn-success" onclick="markAsPaid('${c.id}', ${c.creditBalance})">
                                            ✓ Paid
                                        </button>
                                        <button class="btn btn-outline" onclick="sendReminder('${c.name}', '${c.phone}', ${c.creditBalance})">
                                            📱 Remind
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

window.markAsPaid = async function (customerId, amount) {
    if (confirm(`Mark ${formatCurrency(amount)} as paid? (भुगतान हुआ?)`)) {
        try {
            await updateCustomer(customerId, { creditBalance: 0 });
            showToast('Payment recorded! ✓', 'success');
            renderCreditBook(document.getElementById('mainContent'));
        } catch (error) {
            showToast('Error updating payment', 'error');
        }
    }
};

window.sendReminder = function (name, phone, amount) {
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
            <button class="btn btn-primary" onclick="showAddCustomerModal()">
                ➕ Add Customer
            </button>
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
        
        <!-- Add Expense Modal -->
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
                <div class="card-header">
                    <h3 class="card-title">GST Summary (${month}/${year})</h3>
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

document.addEventListener('DOMContentLoaded', initApp);
