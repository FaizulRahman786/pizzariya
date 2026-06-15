(() => {
  const state = window.__anamikaCartOverrideState || (window.__anamikaCartOverrideState = {
    initialized: false,
    trackingInterval: null,
    selectedPayment: 'Cash on Delivery',
    activeOrderId: null,
    submitting: false
  });

  window.__anamikaCartControllerV2Active = true;

  function writeStorageJSON(key, value) {
    AnSUtils.writeStorageJSON(key, value);
  }

  function formatCurrency(amount) {
    return `₹${Number(amount || 0)}`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function getBusinessInfo() {
    const business = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.business) ? SITE_CONFIG.business : {};
    return {
      name: business.name || 'Pizzariya Town',
      tagline: business.tagline || 'MIRZAPUR NOTTA',
      logo: business.logo || 'images/logo.png',
      helpline: business.helpline || '7858062571',
      email: business.email || 'info@pizzariyatown.com',
      addressLine1: business.addressLine1 || 'Mirzapur Notta',
      addressLine2: business.addressLine2 || ''
    };
  }

  function replaceWithClone(element) {
    if (!element || !element.parentNode) return element;
    const clone = element.cloneNode(true);
    element.parentNode.replaceChild(clone, element);
    return clone;
  }

  function getCart() {
    return AnSUtils.readStorageJSON('anamika-cart', {});
  }

  function saveCart(cart) {
    writeStorageJSON('anamika-cart', cart);
    if (typeof updateCartBadge === 'function') {
      updateCartBadge();
    }
  }

  function getOrders() {
    return AnSUtils.readStorageJSON('anamika-orders', []);
  }

  function saveOrders(orders) {
    writeStorageJSON('anamika-orders', orders);
  }

  function getSavedAddresses() {
    return AnSUtils.readStorageJSON('anamika-addresses', []);
  }

  function getProfile() {
    return AnSUtils.readStorageJSON('anamika-profile', {});
  }

  function getDishById(id) {
    return (typeof DISHES_CATALOG !== 'undefined' ? DISHES_CATALOG : []).find(item => String(item.id) === String(id));
  }

  function getTotals(cart = getCart()) {
    let subtotal = 0;
    let originalTotal = 0;
    let quantity = 0;

    Object.keys(cart).forEach(id => {
      const dish = getDishById(id);
      if (!dish) return;
      const qty = Number(cart[id] || 0);
      subtotal += dish.price * qty;
      originalTotal += Math.round(dish.price * 1.3) * qty;
      quantity += qty;
    });

    return {
      quantity,
      subtotal,
      savings: Math.max(originalTotal - subtotal, 0),
      totalAmount: subtotal
    };
  }

  function buildOrderStatus(order) {
    if (!order) {
      return { step: 1, orderStatus: 'Pending', timelineLabel: 'Order Placed', message: 'Awaiting order confirmation.' };
    }

    if (order.orderStatus === 'Cancelled') {
      return { step: 1, orderStatus: 'Cancelled', timelineLabel: 'Cancelled', message: 'This order was cancelled.' };
    }

    const elapsedSeconds = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
    if (elapsedSeconds >= 120) {
      return { step: 5, orderStatus: 'Completed', timelineLabel: 'Delivered', message: 'Your order was successfully delivered! Thank you for dining with Pizzariya Town.' };
    }
    if (elapsedSeconds >= 75) {
      return { step: 4, orderStatus: 'Preparing', timelineLabel: 'Out For Delivery', message: 'Our delivery partner is on the way to your doorstep. Keep your mobile nearby.' };
    }
    if (elapsedSeconds >= 40) {
      return { step: 3, orderStatus: 'Preparing', timelineLabel: 'Preparing Order', message: 'Our Pizzariya Town chefs are handcrafting your sweets and mains now.' };
    }
    if (elapsedSeconds >= 15) {
      return { step: 2, orderStatus: 'Pending', timelineLabel: 'Order Confirmed', message: 'Gourmet items checked. Order approved and sent to kitchen prep area.' };
    }
    return { step: 1, orderStatus: 'Pending', timelineLabel: 'Order Placed', message: 'Your order details are received. Awaiting lounge confirmation.' };
  }

  function normalizeProducts(cart) {
    return Object.keys(cart).map(id => {
      const dish = getDishById(id);
      if (!dish) return null;
      const quantity = Number(cart[id] || 0);
      return {
        productId: dish.id,
        id: dish.id,
        name: dish.name,
        image: dish.image,
        quantity,
        qty: quantity,
        price: dish.price,
        lineTotal: dish.price * quantity
      };
    }).filter(Boolean);
  }

  function generateOrderId() {
    const existing = new Set(getOrders().map(order => order.orderId));
    let nextId = '';
    do {
      nextId = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    } while (existing.has(nextId));
    return nextId;
  }

  function createOrder(customer, products, totals) {
    const orderId = generateOrderId();
    const paymentMethod = state.selectedPayment;
    return {
      orderId,
      userId: 'guest',
      customerDetails: customer,
      customer,
      products,
      quantity: totals.quantity,
      price: totals.subtotal,
      totalAmount: totals.totalAmount,
      total: totals.totalAmount,
      savings: totals.savings,
      paymentMethod,
      payment: paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      orderStatus: 'Pending',
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
  }

  function init() {
    if (state.initialized) return;
    state.initialized = true;

    const elements = {};
    elements.emptyCartView = document.getElementById('empty-cart-view');
    elements.checkoutSteps = document.getElementById('checkout-steps-indicator');
    elements.checkoutMainGrid = document.getElementById('checkout-main-grid');
    elements.checkoutRightCol = document.getElementById('checkout-right-col');
    elements.cartStepView = document.getElementById('cart-step-view');
    elements.addressStepView = document.getElementById('address-step-view');
    elements.confirmationStepView = document.getElementById('confirmation-step-view');
    elements.trackingCardView = document.getElementById('tracking-card-view');
    elements.cartItemsContainer = document.getElementById('cart-items-container');
    elements.summaryItemsCount = document.getElementById('summary-items-count');
    elements.summarySubtotal = document.getElementById('summary-subtotal');
    elements.summarySavings = document.getElementById('summary-savings');
    elements.summaryTotal = document.getElementById('summary-total');
    elements.summaryMiniItems = document.getElementById('summary-mini-items');
    elements.step1Ind = document.getElementById('step-1-indicator');
    elements.step2Ind = document.getElementById('step-2-indicator');
    elements.step3Ind = document.getElementById('step-3-indicator');
    elements.conn12 = document.getElementById('connector-1-2');
    elements.conn23 = document.getElementById('connector-2-3');
    elements.confOrderId = document.getElementById('conf-order-id');
    elements.confPaymentMethod = document.getElementById('conf-payment-method');
    elements.confDeliveryDetails = document.getElementById('conf-delivery-details');
    elements.confProductsList = document.getElementById('conf-products-list');
    elements.confTotal = document.getElementById('conf-total');
    elements.trackingProgress = document.getElementById('timeline-progress-indicator');
    elements.trackingStatusMsg = document.getElementById('tracking-status-msg');

    elements.btnProceedToCheckout = replaceWithClone(document.getElementById('btn-proceed-to-checkout'));
    elements.btnBackToCart = replaceWithClone(document.getElementById('btn-back-to-cart'));
    elements.payCod = replaceWithClone(document.getElementById('pay-cod'));
    elements.payUpi = replaceWithClone(document.getElementById('pay-upi'));
    elements.btnDownloadReceipt = replaceWithClone(document.getElementById('btn-download-receipt'));
    elements.btnTrackOrder = replaceWithClone(document.getElementById('btn-track-order'));
    elements.checkoutForm = replaceWithClone(document.getElementById('checkout-address-form'));
    elements.checkoutSubmitBtn = elements.checkoutForm ? elements.checkoutForm.querySelector('button[type="submit"]') : null;
    elements.addressSelect = document.getElementById('checkout-address-select');

    function setStep(step) {
      const cartActive = step === 'cart';
      const addressActive = step === 'address';
      const confirmActive = step === 'confirmation';

      elements.cartStepView.style.display = cartActive ? 'block' : 'none';
      elements.addressStepView.style.display = addressActive ? 'block' : 'none';
      elements.confirmationStepView.style.display = confirmActive ? 'block' : 'none';

      elements.step1Ind.className = `step-item ${cartActive ? 'active' : 'completed'}`;
      elements.conn12.className = `step-connector ${cartActive ? '' : 'completed'}`.trim();
      elements.step2Ind.className = `step-item ${addressActive ? 'active' : (!cartActive ? 'completed' : '')}`.trim();
      elements.conn23.className = `step-connector ${confirmActive ? 'completed' : ''}`.trim();
      elements.step3Ind.className = `step-item ${confirmActive ? 'completed' : ''}`.trim();
      elements.summaryMiniItems.style.display = addressActive || confirmActive ? 'block' : 'none';
      elements.btnProceedToCheckout.style.display = cartActive ? 'flex' : 'none';
    }

    function renderSummary(cart = getCart()) {
      const totals = getTotals(cart);
      elements.summaryItemsCount.textContent = `Subtotal (${totals.quantity} items)`;
      elements.summarySubtotal.textContent = formatCurrency(totals.subtotal);
      elements.summarySavings.textContent = `-${formatCurrency(totals.savings)}`;
      elements.summaryTotal.textContent = formatCurrency(totals.totalAmount);

      elements.summaryMiniItems.innerHTML = '';
      Object.keys(cart).forEach(id => {
        const dish = getDishById(id);
        if (!dish) return;
        const quantity = Number(cart[id] || 0);
        const row = document.createElement('div');
        row.className = 'summary-item-mini';
        row.innerHTML = `
          <img class="summary-item-mini-img" src="${dish.image}" alt="${escapeHtml(dish.name)}" loading="lazy" decoding="async" width="1024" height="1024" onerror="handleImageError(this)">
          <div class="summary-item-mini-info">
            <div class="summary-item-mini-name">${escapeHtml(dish.name)}</div>
            <div class="summary-item-mini-qty">x${quantity}</div>
          </div>
          <div class="summary-item-mini-price">${formatCurrency(dish.price * quantity)}</div>
        `;
        elements.summaryMiniItems.appendChild(row);
      });
    }

    function renderTracking(order, hideSteps) {
      if (!order) return;
      state.activeOrderId = order.orderId;
      elements.emptyCartView.style.display = 'none';
      elements.checkoutMainGrid.style.display = 'grid';
      elements.checkoutRightCol.style.display = 'none';
      elements.checkoutMainGrid.style.gridTemplateColumns = '1fr';
      elements.trackingCardView.style.display = 'block';
      elements.checkoutSteps.style.display = hideSteps ? 'none' : 'flex';
      elements.cartStepView.style.display = 'none';
      elements.addressStepView.style.display = 'none';

      if (state.trackingInterval) {
        clearInterval(state.trackingInterval);
      }

      const update = () => {
        const orders = getOrders();
        const currentOrder = orders.find(item => item.orderId === state.activeOrderId);
        if (!currentOrder) return;
        const snapshot = buildOrderStatus(currentOrder);
        currentOrder.orderStatus = snapshot.orderStatus;
        currentOrder.status = snapshot.timelineLabel;
        saveOrders(orders);

        for (let index = 1; index <= 5; index += 1) {
          const stepEl = document.getElementById(`track-step-${index}`);
          if (!stepEl) continue;
          stepEl.className = 'timeline-step';
          if (index < snapshot.step) stepEl.classList.add('completed');
          if (index === snapshot.step) stepEl.classList.add('active');
        }

        const progressPercentage = (snapshot.step - 1) * 25;
        if (window.innerWidth <= 640) {
          elements.trackingProgress.style.width = '4px';
          elements.trackingProgress.style.height = `${progressPercentage}%`;
        } else {
          elements.trackingProgress.style.height = '4px';
          elements.trackingProgress.style.width = `${progressPercentage}%`;
        }

        elements.trackingStatusMsg.innerHTML = `<strong>Status: ${snapshot.timelineLabel}</strong> - ${snapshot.message}`;

        if (snapshot.orderStatus === 'Completed' || snapshot.orderStatus === 'Cancelled') {
          clearInterval(state.trackingInterval);
          state.trackingInterval = null;
          localStorage.removeItem('anamika-active-order-id');
        }
      };

      update();
      state.trackingInterval = setInterval(update, 5000);
    }

    function renderConfirmation(order) {
      elements.checkoutSteps.style.display = 'flex';
      elements.checkoutMainGrid.style.display = 'grid';
      elements.checkoutRightCol.style.display = 'none';
      elements.checkoutMainGrid.style.gridTemplateColumns = '1fr';
      elements.trackingCardView.style.display = 'none';
      setStep('confirmation');

      elements.confOrderId.textContent = order.orderId;
      elements.confPaymentMethod.textContent = `${order.paymentMethod} / ${order.paymentStatus}`;
      elements.confDeliveryDetails.innerHTML = `
        <strong>${escapeHtml(order.customer.name)}</strong>, +91 ${escapeHtml(order.customer.phone)} ${order.customer.phoneAlt ? `/ ${escapeHtml(order.customer.phoneAlt)}` : ''}<br>
        ${escapeHtml(order.customer.address.house)}, ${escapeHtml(order.customer.address.street)}, ${order.customer.address.landmark ? `${escapeHtml(order.customer.address.landmark)}, ` : ''}${escapeHtml(order.customer.address.city)}, ${escapeHtml(order.customer.address.state)} - <strong>${escapeHtml(order.customer.address.pincode)}</strong>
      `;

      elements.confProductsList.innerHTML = '';
      order.products.forEach(product => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted);';
        row.innerHTML = `
          <span>${escapeHtml(product.name)} <strong style="color:var(--text-main); margin-left: 8px;">x${product.qty}</strong></span>
          <span style="font-weight:600; color:var(--text-main);">${formatCurrency(product.lineTotal)}</span>
        `;
        elements.confProductsList.appendChild(row);
      });
      elements.confTotal.textContent = formatCurrency(order.total);
      state.activeOrderId = order.orderId;
    }

    function renderCart() {
      const cart = getCart();
      const cartIds = Object.keys(cart);

      if (cartIds.length === 0) {
        const activeOrderId = localStorage.getItem('anamika-active-order-id');
        const activeOrder = activeOrderId ? getOrders().find(order => order.orderId === activeOrderId) : null;
        if (activeOrder) {
          renderTracking(activeOrder, true);
          return;
        }

        elements.checkoutSteps.style.display = 'none';
        elements.checkoutMainGrid.style.display = 'none';
        elements.trackingCardView.style.display = 'none';
        elements.emptyCartView.style.display = 'block';
        return;
      }

      elements.emptyCartView.style.display = 'none';
      elements.checkoutSteps.style.display = 'flex';
      elements.checkoutMainGrid.style.display = 'grid';
      elements.checkoutRightCol.style.display = 'block';
      elements.checkoutMainGrid.style.gridTemplateColumns = '';
      elements.trackingCardView.style.display = 'none';
      setStep('cart');

      elements.cartItemsContainer.innerHTML = '';
      cartIds.forEach(id => {
        const dish = getDishById(id);
        if (!dish) return;
        const quantity = Number(cart[id] || 0);
        const oldPrice = Math.round(dish.price * 1.3);
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
          <div class="cart-item-img-wrapper">
            <img src="${dish.image}" alt="${escapeHtml(dish.name)}" loading="lazy" decoding="async" width="1024" height="1024" onerror="handleImageError(this)">
          </div>
          <div class="cart-item-info">
            <div class="cart-item-name">${escapeHtml(dish.name)}</div>
            <div class="cart-item-price-info">
              <span class="cart-item-price">${formatCurrency(dish.price)}</span>
              <span class="cart-item-old-price">${formatCurrency(oldPrice)}</span>
            </div>
            <div style="margin-top: 10px;">
              <div class="qty-selector">
                <button type="button" class="qty-btn dec-qty" data-id="${escapeHtml(id)}"><i class="fa-solid fa-minus"></i></button>
                <span class="qty-val">${quantity}</span>
                <button type="button" class="qty-btn inc-qty" data-id="${escapeHtml(id)}"><i class="fa-solid fa-plus"></i></button>
              </div>
            </div>
          </div>
          <div class="cart-item-actions">
            <div class="cart-item-row-total">${formatCurrency(dish.price * quantity)}</div>
            <button type="button" class="cart-item-delete" data-id="${escapeHtml(id)}" title="Remove item"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        `;
        elements.cartItemsContainer.appendChild(row);
      });

      renderSummary(cart);
    }

    function populateSavedAddresses() {
      if (!elements.addressSelect) return;
      const container = document.getElementById('checkout-saved-address-container');
      const addresses = getSavedAddresses();
      if (!container) return;
      if (addresses.length === 0) {
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';
      elements.addressSelect.innerHTML = '<option value="">-- Select Saved Address --</option>';
      addresses.forEach(address => {
        const option = document.createElement('option');
        option.value = address.id;
        option.textContent = `${address.name} - ${address.house}, ${address.street}, ${address.city} (${address.pincode})${address.isDefault ? ' [Default]' : ''}`;
        elements.addressSelect.appendChild(option);
      });

      const defaultAddress = addresses.find(address => address.isDefault) || addresses[0];
      if (defaultAddress) {
        elements.addressSelect.value = defaultAddress.id;
        autofillAddress(defaultAddress);
      }
    }

    function autofillAddress(address) {
      document.getElementById('cust-name').value = address.name || '';
      document.getElementById('cust-phone').value = address.phone || '';
      document.getElementById('cust-house').value = address.house || '';
      document.getElementById('cust-street').value = address.street || '';
      document.getElementById('cust-landmark').value = address.landmark || '';
      document.getElementById('cust-city').value = address.city || '';
      document.getElementById('cust-state').value = address.state || '';
      document.getElementById('cust-pincode').value = address.pincode || '';

      const profile = getProfile();
      if (profile.email) {
        document.getElementById('cust-email').value = profile.email;
      }
      if (profile.phone && profile.phone !== address.phone) {
        document.getElementById('cust-phone-alt').value = profile.phone;
      }

      ['cust-name', 'cust-phone', 'cust-house', 'cust-street', 'cust-city', 'cust-state', 'cust-pincode'].forEach(id => {
        const input = document.getElementById(id);
        if (input && input.parentElement) {
          input.parentElement.classList.remove('has-error');
        }
      });
    }

    function clearValidation() {
      elements.checkoutForm.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('has-error');
      });
    }

    function validateForm() {
      let valid = true;
      const checks = [
        ['cust-name', value => value.trim().length >= 2],
        ['cust-phone', value => /^[0-9]{10}$/.test(value.trim())],
        ['cust-house', value => value.trim().length > 0],
        ['cust-street', value => value.trim().length > 0],
        ['cust-city', value => value.trim().length > 0],
        ['cust-state', value => value.trim().length > 0],
        ['cust-pincode', value => /^[0-9]{6}$/.test(value.trim())]
      ];

      checks.forEach(([id, validator]) => {
        const input = document.getElementById(id);
        if (!input) return;
        if (!validator(input.value)) {
          input.parentElement.classList.add('has-error');
          valid = false;
        }
      });

      const email = document.getElementById('cust-email');
      if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.parentElement.classList.add('has-error');
        valid = false;
      }

      const altPhone = document.getElementById('cust-phone-alt');
      if (altPhone && altPhone.value.trim() && !/^[0-9]{10}$/.test(altPhone.value.trim())) {
        altPhone.parentElement.classList.add('has-error');
        valid = false;
      }

      return valid;
    }

    function collectCustomer() {
      return {
        name: document.getElementById('cust-name').value.trim(),
        phone: document.getElementById('cust-phone').value.trim(),
        phoneAlt: document.getElementById('cust-phone-alt').value.trim(),
        email: document.getElementById('cust-email').value.trim(),
        address: {
          house: document.getElementById('cust-house').value.trim(),
          street: document.getElementById('cust-street').value.trim(),
          landmark: document.getElementById('cust-landmark').value.trim(),
          city: document.getElementById('cust-city').value.trim(),
          state: document.getElementById('cust-state').value.trim(),
          pincode: document.getElementById('cust-pincode').value.trim()
        },
        notes: document.getElementById('cust-notes').value.trim()
      };
    }

    function generateReceiptInvoice(order) {
      const business = getBusinessInfo();
      const statusSnapshot = buildOrderStatus(order);
      const customer = order.customerDetails || order.customer;
      const createdAt = new Date(order.createdAt).toLocaleString();
      const rows = order.products.map((product, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(product.name)}</td>
          <td>${formatCurrency(product.price)}</td>
          <td>${product.qty}</td>
          <td style="text-align:right;">${formatCurrency(product.lineTotal)}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt - ${escapeHtml(order.orderId)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #fff; }
            .receipt { max-width: 820px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #f97316; padding-bottom: 18px; margin-bottom: 24px; }
            .brand img { max-height: 52px; width: auto; display: block; margin-bottom: 10px; }
            .brand h1 { margin: 0; font-size: 26px; color: #c2410c; }
            .brand p, .meta p, .details p, .footer p { margin: 4px 0; line-height: 1.5; }
            .meta { text-align: right; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
            .details h3 { margin: 0 0 8px 0; font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: #c2410c; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 14px; text-align: left; }
            th { background: #fff7ed; }
            .totals { margin-left: auto; width: min(100%, 320px); }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .totals-row.total { border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 12px; font-weight: 700; font-size: 18px; }
            .footer { border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 18px; text-align: center; color: #6b7280; font-size: 13px; }
            .print-btn { margin-top: 16px; background: #ea580c; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-weight: 700; cursor: pointer; }
            @media print {
              body { padding: 0; }
              .receipt { border: none; border-radius: 0; padding: 0; }
              .print-btn { display: none !important; }
              @page { size: A4; margin: 12mm; }
            }
            @media (max-width: 640px) {
              body { padding: 12px; }
              .header, .grid { display: grid; grid-template-columns: 1fr; }
              .meta { text-align: left; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="brand">
                <img src="${escapeHtml(business.logo)}" alt="${escapeHtml(business.name)} logo" loading="lazy" decoding="async" width="1024" height="1024">
                <h1>${escapeHtml(business.name)}</h1>
                <p>${escapeHtml(business.tagline)}</p>
                <p>${escapeHtml(business.addressLine1)}</p>
                ${business.addressLine2 ? `<p>${escapeHtml(business.addressLine2)}</p>` : ''}
                <p>Phone: ${escapeHtml(business.helpline)}</p>
                <p>Email: ${escapeHtml(business.email)}</p>
              </div>
              <div class="meta">
                <p><strong>Order ID:</strong> ${escapeHtml(order.orderId)}</p>
                <p><strong>Date:</strong> ${escapeHtml(createdAt)}</p>
                <p><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod)}</p>
                <p><strong>Payment Status:</strong> ${escapeHtml(order.paymentStatus)}</p>
                <p><strong>Order Status:</strong> ${escapeHtml(statusSnapshot.orderStatus)}</p>
              </div>
            </div>
            <div class="grid">
              <div class="details">
                <h3>Customer Info</h3>
                <p><strong>Name:</strong> ${escapeHtml(customer.name)}</p>
                <p><strong>Phone:</strong> +91 ${escapeHtml(customer.phone)}</p>
                ${customer.phoneAlt ? `<p><strong>Alt Phone:</strong> +91 ${escapeHtml(customer.phoneAlt)}</p>` : ''}
                ${customer.email ? `<p><strong>Email:</strong> ${escapeHtml(customer.email)}</p>` : ''}
              </div>
              <div class="details">
                <h3>Delivery Address</h3>
                <p>${escapeHtml(customer.address.house)}, ${escapeHtml(customer.address.street)}</p>
                ${customer.address.landmark ? `<p>${escapeHtml(customer.address.landmark)}</p>` : ''}
                <p>${escapeHtml(customer.address.city)}, ${escapeHtml(customer.address.state)} - ${escapeHtml(customer.address.pincode)}</p>
                ${customer.notes ? `<p><strong>Notes:</strong> ${escapeHtml(customer.notes)}</p>` : ''}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th style="text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="totals">
              <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(order.price)}</span></div>
              <div class="totals-row"><span>Discount</span><span>-${formatCurrency(order.savings || 0)}</span></div>
              <div class="totals-row"><span>Delivery</span><span>FREE</span></div>
              <div class="totals-row total"><span>Total Amount</span><span>${formatCurrency(order.totalAmount)}</span></div>
            </div>
            <div class="footer">
              <p>This is a computer-generated receipt.</p>
              <p>Use your browser print dialog to print or save as PDF.</p>
              <button class="print-btn" onclick="window.print()">Print Receipt</button>
            </div>
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      const popup = window.open(blobUrl, '_blank', 'width=800,height=600');
      if (popup) {
        popup.addEventListener('load', () => {
          popup.print();
          URL.revokeObjectURL(blobUrl);
        });
      }
    }

    function setPayment(method) {
      state.selectedPayment = method;
      elements.payCod.classList.toggle('active', method === 'Cash on Delivery');
      elements.payUpi.classList.toggle('active', method === 'UPI Payment');
      if (elements.checkoutSubmitBtn) {
        elements.checkoutSubmitBtn.innerHTML = method === 'Cash on Delivery'
          ? '<i class="fa-solid fa-bag-shopping"></i> Place Order (COD)'
          : '<i class="fa-solid fa-qrcode"></i> Place Order (UPI)';
      }
    }

    elements.cartItemsContainer.addEventListener('click', event => {
      const button = event.target.closest('button[data-id]');
      if (!button) return;

      const id = button.getAttribute('data-id');
      const cart = getCart();
      if (button.classList.contains('inc-qty')) {
        cart[id] = Number(cart[id] || 0) + 1;
      } else if (button.classList.contains('dec-qty')) {
        cart[id] = Number(cart[id] || 0) - 1;
        if (cart[id] <= 0) {
          delete cart[id];
          if (typeof showToast === 'function') showToast('Item removed from cart.', 'info');
        }
      } else if (button.classList.contains('cart-item-delete')) {
        delete cart[id];
        if (typeof showToast === 'function') showToast('Item removed from cart.', 'info');
      }

      saveCart(cart);
      renderCart();
    });

    elements.btnProceedToCheckout.addEventListener('click', () => {
      if (Object.keys(getCart()).length === 0) {
        if (typeof showToast === 'function') showToast('Your cart is empty!', 'warning');
        return;
      }
      populateSavedAddresses();
      elements.trackingCardView.style.display = 'none';
      elements.checkoutRightCol.style.display = 'block';
      elements.checkoutMainGrid.style.gridTemplateColumns = '';
      setStep('address');
    });

    elements.btnBackToCart.addEventListener('click', () => {
      renderCart();
    });

    elements.payCod.addEventListener('click', () => {
      setPayment('Cash on Delivery');
    });

    elements.payUpi.addEventListener('click', () => {
      setPayment('UPI Payment');
      if (typeof showToast === 'function') {
        showToast('UPI Payment Coming Soon! Please choose Cash on Delivery for now.', 'info');
      }
    });

    if (elements.addressSelect) {
      elements.addressSelect.addEventListener('change', event => {
        const selectedId = event.target.value;
        if (!selectedId) return;
        const selectedAddress = getSavedAddresses().find(address => address.id === selectedId);
        if (!selectedAddress) return;
        autofillAddress(selectedAddress);
        if (typeof showToast === 'function') {
          showToast(`Auto-filled address: ${selectedAddress.name}`, 'success');
        }
      });
    }

    elements.checkoutForm.addEventListener('submit', event => {
      event.preventDefault();
      clearValidation();

      if (!validateForm()) {
        const firstError = elements.checkoutForm.querySelector('.has-error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (typeof showToast === 'function') {
          showToast('Please correct the errors in the form.', 'warning');
        }
        return;
      }

      if (state.selectedPayment === 'UPI Payment') {
        if (typeof showToast === 'function') {
          showToast('UPI Payment Coming Soon! Please choose Cash on Delivery for now.', 'warning');
        }
        return;
      }

      if (state.submitting) {
        if (typeof showToast === 'function') {
          showToast('Your order is already being placed. Please wait a moment.', 'info');
        }
        return;
      }

      state.submitting = true;
      const originalButtonHtml = elements.checkoutSubmitBtn ? elements.checkoutSubmitBtn.innerHTML : '';
      if (elements.checkoutSubmitBtn) {
        elements.checkoutSubmitBtn.disabled = true;
        elements.checkoutSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Placing Order...';
      }

      try {
        const cart = getCart();
        const products = normalizeProducts(cart);
        const totals = getTotals(cart);
        const customer = collectCustomer();
        const order = createOrder(customer, products, totals);
        const orders = getOrders();
        orders.unshift(order);
        saveOrders(orders);
        localStorage.setItem('anamika-active-order-id', order.orderId);
        saveCart({});
        renderConfirmation(order);

        if (typeof sendEmail === 'function') {
          const itemsText = products.map(product => `- ${product.name} (Qty: ${product.qty}) - ${formatCurrency(product.lineTotal)}`).join('\n');
          sendEmail({
            _subject: `New Pizzariya Town Order [ID: ${order.orderId}]`,
            _template: 'box',
            order_id: order.orderId,
            customer_name: customer.name,
            contact_phone: customer.phone,
            delivery_address: `${customer.address.house}, ${customer.address.street}, ${customer.address.landmark || ''}, ${customer.address.city}, ${customer.address.state} - ${customer.address.pincode}`,
            items_ordered: itemsText,
            total_amount: formatCurrency(order.totalAmount),
            payment_method: state.selectedPayment,
            timestamp: new Date().toLocaleString()
          });
        }
      } catch (error) {
        console.error('[Cart Controller] Failed to place order.', error);
        if (typeof showToast === 'function') {
          showToast('Could not place your order. Please try again.', 'warning');
        }
      } finally {
        state.submitting = false;
        if (elements.checkoutSubmitBtn) {
          elements.checkoutSubmitBtn.disabled = false;
          elements.checkoutSubmitBtn.innerHTML = originalButtonHtml;
        }
      }
    });

    elements.btnDownloadReceipt.addEventListener('click', () => {
      const order = getOrders().find(item => item.orderId === state.activeOrderId);
      if (order) {
        generateReceiptInvoice(order);
      }
    });

    elements.btnTrackOrder.addEventListener('click', () => {
      const order = getOrders().find(item => item.orderId === state.activeOrderId);
      if (order) {
        elements.confirmationStepView.style.display = 'none';
        renderTracking(order, true);
      }
    });

    window.addEventListener('resize', () => {
      if (state.activeOrderId) {
        const activeOrder = getOrders().find(order => order.orderId === state.activeOrderId);
        if (activeOrder) {
          renderTracking(activeOrder, true);
        }
      }
    });

    window.generateReceiptInvoice = generateReceiptInvoice;
    setPayment('Cash on Delivery');
    renderCart();
  }

  if (window.__anamikaLayoutState && window.__anamikaLayoutState.completed) {
    init();
  } else {
    window.addEventListener('LayoutComponentsLoaded', init, { once: true });
  }
})();
