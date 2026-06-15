/* 
   Pizzariya Town - Shared Notification Center Engine (notifications.js)
   Manages notification lifecycle, dynamic order status updates, localStorage persistence,
   badge counts, bell animations, and the unified responsive dropdown/drawer UI.
*/

(function () {

  // Load CSS dynamically if not already linked
  if (!document.getElementById('notifications-stylesheet')) {
    const link = document.createElement('link');
    link.id = 'notifications-stylesheet';
    link.rel = 'stylesheet';
    link.href = 'css/notifications.css';
    document.head.appendChild(link);
  }

  // State Variables
  let prevProfile = AnSUtils.readStorageJSON('anamika-profile', null);
  let prevAddresses = AnSUtils.readStorageJSON('anamika-addresses', []);
  let isPanelOpen = false;
  let isSyncingOrders = false;
  let syncOrdersIntervalId = null;

  // Initialize notifications in localStorage if empty
  function initDefaultNotifications() {
    const notifications = AnSUtils.readStorageJSON('anamika-notifications', null);
    if (notifications === null) {
      const defaults = [
        {
          id: 'NOTIF-INIT-1',
          userId: 'guest',
          type: 'SYSTEM',
          title: 'Welcome to Pizzariya Town!',
          message: 'Explore our premium hand-crafted sweets, fine dining reservation system, and dynamic order tracking.',
          readStatus: 'unread',
          createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: 'NOTIF-INIT-2',
          userId: 'guest',
          type: 'OFFER',
          title: 'Grand Inaugural Offer',
          message: 'Enjoy 30% automatic savings applied directly to all cart items. Try our special Kaju Katli today!',
          readStatus: 'unread',
          createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        }
      ];
      localStorage.setItem('anamika-notifications', JSON.stringify(defaults));
    }
  }

  // Get notifications
  function getNotifications() {
    return AnSUtils.readStorageJSON('anamika-notifications', []);
  }

  // Save notifications & dispatch updates
  function saveNotifications(notifications) {
    localStorage.setItem('anamika-notifications', JSON.stringify(notifications));
    updateNavbarBadge();
    
    // Dispatch custom event for page controllers
    window.dispatchEvent(new CustomEvent('NotificationsUpdated', { detail: notifications }));
  }

  // Helper to map notification type to FontAwesome icon
  function getIconForType(type) {
    switch (type) {
      case 'ORDER':
        return 'fa-box-open';
      case 'PAYMENT':
        return 'fa-credit-card';
      case 'ACCOUNT':
        return 'fa-user-gear';
      case 'SYSTEM':
        return 'fa-circle-info';
      case 'OFFER':
        return 'fa-tags';
      default:
        return 'fa-bell';
    }
  }

  // Create new notification
  function createNotification(type, title, message) {
    const notifications = getNotifications();
    const newNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: 'guest',
      type: type,
      title: title,
      message: message,
      readStatus: 'unread',
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    saveNotifications(notifications);
    
    triggerBellAnimation();
    
    // Also display as a temporary visual toast alert if user is active
    if (typeof showToast === 'function') {
      let toastType = 'success';
      if (type === 'OFFER') toastType = 'success';
      else if (type === 'ACCOUNT' || type === 'SYSTEM') toastType = 'info';
      else if (type === 'ORDER') toastType = 'success';
      showToast(title, toastType);
    }

    return newNotif;
  }

  // Mark all notifications as read
  function markAllAsRead() {
    const notifications = getNotifications();
    let updated = false;
    notifications.forEach(n => {
      if (n.readStatus === 'unread') {
        n.readStatus = 'read';
        updated = true;
      }
    });
    if (updated) {
      saveNotifications(notifications);
      renderNotificationsList();
    }
  }

  // Mark single notification as read
  function markAsRead(id) {
    const notifications = getNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1 && notifications[idx].readStatus === 'unread') {
      notifications[idx].readStatus = 'read';
      saveNotifications(notifications);
      renderNotificationsList();
    }
  }

  // Delete notification
  function deleteNotification(id) {
    let notifications = getNotifications();
    notifications = notifications.filter(n => n.id !== id);
    saveNotifications(notifications);
    renderNotificationsList();
  }

  // Clear all notifications
  function clearAllNotifications() {
    saveNotifications([]);
    renderNotificationsList();
  }

  // Trigger bell shake wiggle
  function triggerBellAnimation() {
    const bellIcon = document.querySelector('#header-notifications-btn i');
    if (bellIcon) {
      bellIcon.classList.add('bell-animate');
      setTimeout(() => {
        bellIcon.classList.remove('bell-animate');
      }, 800);
    }
  }

  // Update navbar count badge
  function updateNavbarBadge() {
    const badge = document.getElementById('notifications-count');
    if (!badge) return;

    const notifications = getNotifications();
    const unreadCount = notifications.filter(n => n.readStatus === 'unread').length;

    if (unreadCount > 0) {
      badge.style.display = 'flex';
      badge.textContent = unreadCount;
      badge.classList.add('badge-pop');
      setTimeout(() => badge.classList.remove('badge-pop'), 300);
    } else {
      badge.style.display = 'none';
      badge.textContent = '0';
    }
  }

  // Human-friendly relative time formatter
  function formatRelativeTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const elapsedMs = now - date;

    const seconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Render list inside dropdown/drawer
  function renderNotificationsList() {
    const listContainer = document.getElementById('notif-center-list');
    if (!listContainer) return;

    const notifications = getNotifications();
    listContainer.innerHTML = '';

    if (notifications.length === 0) {
      listContainer.innerHTML = `
        <div class="notif-empty-state">
          <i class="fa-solid fa-bell-slash"></i>
          <p><strong>All caught up!</strong><br>You have no new notifications at the moment.</p>
        </div>
      `;
      return;
    }

    notifications.forEach(n => {
      const item = document.createElement('div');
      item.className = `notif-item ${n.readStatus === 'unread' ? 'unread' : ''}`;
      item.setAttribute('data-id', n.id);
      
      const icon = getIconForType(n.type);
      const timeStr = formatRelativeTime(n.createdAt);

      item.innerHTML = `
        <div class="notif-item-icon-wrapper">
          <i class="fa-solid ${icon}"></i>
        </div>
        <div class="notif-item-content">
          <div class="notif-item-title-row">
            <span class="notif-item-title">${n.title}</span>
            <button class="notif-item-delete-btn" data-id="${n.id}" title="Delete notification">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
          <p class="notif-item-desc">${n.message}</p>
          <span class="notif-item-time">${timeStr}</span>
        </div>
      `;

      // Click to mark as read
      item.addEventListener('click', (e) => {
        // If clicking delete button, do not trigger read status change
        if (e.target.closest('.notif-item-delete-btn')) return;
        markAsRead(n.id);
        
        // If it is an order notification, let's redirect to active tracking!
        if (n.type === 'ORDER') {
          const orderMatch = n.message.match(/ORD-2026-\d+/);
          if (orderMatch) {
            const orderId = orderMatch[0];
            const orders = AnSUtils.readStorageJSON('anamika-orders', []);
            const foundOrder = orders.find(o => o.orderId === orderId);
            if (foundOrder) {
              localStorage.setItem('anamika-active-order-id', orderId);
              // Route to profile page with track active order tab
              window.location.href = `profile.html?tab=track&orderId=${orderId}`;
            }
          }
        }
      });

      listContainer.appendChild(item);
    });

    // Bind delete buttons
    listContainer.querySelectorAll('.notif-item-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        deleteNotification(id);
      });
    });
  }

  // Toggle dropdown / drawer view
  function toggleNotifications(forceState) {
    const wrapper = document.getElementById('notif-center-wrapper');
    if (!wrapper) return;

    const show = (forceState !== undefined) ? forceState : !isPanelOpen;
    isPanelOpen = show;

    if (show) {
      wrapper.classList.add('active');
      renderNotificationsList();
      document.body.style.overflow = 'hidden'; // Lock background scrolling
    } else {
      wrapper.classList.remove('active');
      document.body.style.overflow = ''; // Release scroll lock
    }
  }

  // Dynamic Background Order Notification Sync
  function syncOrderNotifications() {
    if (isSyncingOrders) {
      updateNavbarBadge();
      return;
    }

    const orders = AnSUtils.readStorageJSON('anamika-orders', []);
    const notifications = getNotifications();
    let changed = false;
    let ordersChanged = false;

    // Helper to see if stage notification exists
    const hasNotif = (orderId, stageLabel) => {
      return notifications.some(n => (
        n.type === 'ORDER' &&
        n.orderId === orderId &&
        n.stageLabel === stageLabel
      ));
    };

    orders.forEach(order => {
      const elapsedSeconds = (new Date().getTime() - new Date(order.createdAt).getTime()) / 1000;

      // Define stages in order status progression
      const stages = [
        { time: 0, label: 'placed', title: 'Order Placed Successfully', message: `Your sweets order ${order.orderId} has been placed successfully.` },
        { time: 15, label: 'confirmed', title: 'Order Confirmed', message: `Your order ${order.orderId} has been confirmed.` },
        { time: 40, label: 'preparing', title: 'Preparing Order', message: `Your sweets order preparation started for order ${order.orderId}.` },
        { time: 75, label: 'out for delivery', title: 'Out For Delivery', message: `Your order ${order.orderId} is out for delivery.` },
        { time: 120, label: 'delivered', title: 'Order Delivered', message: `Your order ${order.orderId} has been delivered. Thank you!` }
      ];

      // Check stages reached
      stages.forEach(stage => {
        if (elapsedSeconds >= stage.time) {
          if (!hasNotif(order.orderId, stage.label)) {
            // Generate notification for this stage!
            const newNotif = {
              id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId: 'guest',
              type: 'ORDER',
              orderId: order.orderId,
              stageLabel: stage.label,
              title: stage.title,
              message: stage.message,
              readStatus: 'unread',
              // Use simulated timestamp based on when the event occurred in the past
              createdAt: new Date(new Date(order.createdAt).getTime() + stage.time * 1000).toISOString()
            };
            notifications.push(newNotif);
            changed = true;
            
            // Push dynamic order status updates in local storage order objects too!
            // E.g., if background timer progresses the order, we update the status field of the order itself
            // to make sure orders history shows correct status.
            let labelCapitalized = stage.label.charAt(0).toUpperCase() + stage.label.slice(1);
            if (stage.label === 'out for delivery') labelCapitalized = 'Out For Delivery';
            if (stage.label === 'preparing') labelCapitalized = 'Preparing Order';

            let canonicalStatus = 'Pending';
            if (stage.label === 'preparing' || stage.label === 'out for delivery') canonicalStatus = 'Preparing';
            if (stage.label === 'delivered') canonicalStatus = 'Completed';
            
            if (order.status !== labelCapitalized || order.orderStatus !== canonicalStatus) {
              order.status = labelCapitalized;
              order.orderStatus = canonicalStatus;
              ordersChanged = true;
            }
          }
        }
      });

      // Receipt ready alert
      const hasReceipt = notifications.some(n => (
        n.type === 'ORDER' &&
        n.orderId === order.orderId &&
        n.stageLabel === 'receipt'
      ));
      if (!hasReceipt) {
        const receiptNotif = {
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: 'guest',
          type: 'ORDER',
          orderId: order.orderId,
          stageLabel: 'receipt',
          title: 'Receipt Generated',
          message: `Your receipt is ready to download for order ${order.orderId}.`,
          readStatus: 'unread',
          createdAt: new Date(order.createdAt).toISOString()
        };
        notifications.push(receiptNotif);
        changed = true;
      }
    });

    if (changed) {
      // Sort newest first
      notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      saveNotifications(notifications);
    } else {
      updateNavbarBadge();
    }

    if (ordersChanged) {
      isSyncingOrders = true;
      try {
        localStorage.setItem('anamika-orders', JSON.stringify(orders));
      } finally {
        isSyncingOrders = false;
      }

      // Dispatch event to update order dashboard tabs dynamically
      window.dispatchEvent(new CustomEvent('OrdersStatusSynced'));
    }
  }

  // Intercept profile updates for Account Updates notifications
  function handleProfileUpdateNotification(newValue) {
    try {
      const newProf = JSON.parse(newValue);
      if (prevProfile && newProf && (prevProfile.name !== newProf.name || prevProfile.phone !== newProf.phone || prevProfile.email !== newProf.email)) {
        createNotification('ACCOUNT', 'Profile Updated', 'Your account information was updated successfully.');
      }
      prevProfile = newProf;
    } catch (e) {
      console.warn('[Notifications] Profile update check failed:', e);
    }
  }

  // Intercept address changes
  function handleAddressUpdateNotification(newValue) {
    try {
      const newAddrs = JSON.parse(newValue) || [];
      if (prevAddresses.length < newAddrs.length) {
        createNotification('ACCOUNT', 'Address Added', 'A new shipping address was added to your account.');
      } else if (prevAddresses.length > newAddrs.length) {
        createNotification('ACCOUNT', 'Address Deleted', 'A shipping address was removed from your account.');
      } else {
        // Same length, check if default status or details changed
        let isChanged = false;
        newAddrs.forEach((addr, i) => {
          const prev = prevAddresses[i];
          if (prev && (prev.house !== addr.house || prev.street !== addr.street || prev.isDefault !== addr.isDefault)) {
            isChanged = true;
          }
        });
        if (isChanged) {
          createNotification('ACCOUNT', 'Address Updated', 'Your saved address details have been updated.');
        }
      }
      prevAddresses = newAddrs;
    } catch (e) {
      console.warn('[Notifications] Address update check failed:', e);
    }
  }

  // Monkey patch localStorage.setItem to listen for changes on same tab
  if (!localStorage.__anamikaNotificationsPatched) {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);

      if (key === 'anamika-orders') {
        if (!isSyncingOrders) {
          syncOrderNotifications();
        }
      } else if (key === 'anamika-profile') {
        handleProfileUpdateNotification(value);
      } else if (key === 'anamika-addresses') {
        handleAddressUpdateNotification(value);
      }
    };
    localStorage.__anamikaNotificationsPatched = true;
  }

  // Cross-tab Synchronization using 'storage' event listener
  window.addEventListener('storage', (e) => {
    if (e.key === 'anamika-notifications') {
      updateNavbarBadge();
      renderNotificationsList();
    } else if (e.key === 'anamika-orders') {
      syncOrderNotifications();
    }
  });

  // Inject Notification Dropdown/Drawer HTML structure dynamically
  function injectPanelHTML() {
    if (document.getElementById('notif-center-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'notif-center-wrapper';
    wrapper.className = 'notif-wrapper';
    wrapper.innerHTML = `
      <div id="notif-center-overlay" class="notif-overlay"></div>
      <div class="notif-panel" id="notif-center-panel">
        <div class="notif-header">
          <div class="notif-title">
            <i class="fa-solid fa-bell" style="color:var(--primary);"></i>
            <span>Notifications</span>
          </div>
          <div class="notif-actions-header">
            <button id="notif-mark-all-read-btn" class="notif-action-btn-link">Mark all as read</button>
          </div>
          <button id="notif-center-close-btn" class="notif-close-btn" aria-label="Close notifications">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div id="notif-center-list" class="notif-list"></div>
        <div id="notif-center-footer" class="notif-footer" style="display: none;">
          <button id="notif-view-dashboard-btn" class="notif-footer-btn btn-primary" style="background:var(--primary); color:white; border:none; padding:10px 16px; border-radius:10px; width:100%; font-weight:700; cursor:pointer;">Go to Notification Center</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);
  }

  // Setup DOM Hook listeners
  function initHeaderBellListeners() {
    const bellBtn = document.getElementById('header-notifications-btn');
    if (!bellBtn) return;

    // Remove any existing clone listeners by recreating button click
    const newBtn = bellBtn.cloneNode(true);
    bellBtn.parentNode.replaceChild(newBtn, bellBtn);

    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotifications();
    });
  }

  // Setup UI elements inside Dropdown/Drawer Panel
  function initPanelActionListeners() {
    const overlay = document.getElementById('notif-center-overlay');
    const closeBtn = document.getElementById('notif-center-close-btn');
    const markAllReadBtn = document.getElementById('notif-mark-all-read-btn');
    const viewDashboardBtn = document.getElementById('notif-view-dashboard-btn');

    if (overlay) overlay.addEventListener('click', () => toggleNotifications(false));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleNotifications(false));
    
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        markAllAsRead();
        if (typeof showToast === 'function') {
          showToast('All notifications marked as read', 'info');
        }
      });
    }

    if (viewDashboardBtn) {
      viewDashboardBtn.addEventListener('click', () => {
        toggleNotifications(false);
        window.location.href = 'profile.html?tab=db-notifications';
      });
    }

    // Show panel footer redirect button only if NOT on profile page
    const isProfilePage = window.location.pathname.includes('profile.html');
    const footer = document.getElementById('notif-center-footer');
    if (footer) {
      footer.style.display = isProfilePage ? 'none' : 'flex';
    }
  }

  // Run initialization setup
  initDefaultNotifications();
  
  // Hook layout loaded event (since navbar is injected dynamically)
  window.addEventListener('LayoutComponentsLoaded', () => {
    injectPanelHTML();
    initHeaderBellListeners();
    initPanelActionListeners();
    syncOrderNotifications();
  });

  // Run periodic background sync checks for simulated order progression (every 5 seconds)
  if (!syncOrdersIntervalId) {
    syncOrdersIntervalId = setInterval(syncOrderNotifications, 5000);
  }

  // Expose key API interfaces globally for other scripts (dashboard integration)
  window.NotificationEngine = {
    getNotifications,
    saveNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    syncOrderNotifications,
    triggerBellAnimation,
    updateNavbarBadge
  };
})();
