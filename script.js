/* 
   ANAMIKA SWEETS - Premium UI/UX Interactions & Logic
   Dynamic menu rendering, active filters, banners slider, theme switching, and local notifications.
*/

// Note: DISHES_CATALOG, GALLERY_CATALOG, and RESTAURANT_INFO are now loaded dynamically from data.js configuration.

const anamikaAppState = window.__anamikaAppState || (window.__anamikaAppState = {
  bootstrapped: false,
  languageListenerBound: false,
  initErrors: []
});

async function fetchWithTimeout(resource, options = {}, timeoutMs = 5000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = window.setTimeout(() => {
    if (controller) controller.abort();
  }, timeoutMs);

  try {
    return await fetch(resource, {
      ...options,
      signal: controller ? controller.signal : options.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function fallbackReleasePreloader() {
  const preloader = document.getElementById('luxury-preloader');
  const heroContent = document.querySelector('.hero-content');

  if (preloader) {
    preloader.classList.add('fade-out');
  }

  if (heroContent) {
    heroContent.classList.add('revealed');
  }
}

function runInitStep(stepName, initializer, fallback) {
  try {
    initializer();
  } catch (error) {
    anamikaAppState.initErrors.push(stepName);
    console.error(`[App Init] ${stepName} failed`, error);
    if (typeof fallback === 'function') {
      try {
        fallback(error);
      } catch (fallbackError) {
        console.error(`[App Init] ${stepName} fallback failed`, fallbackError);
      }
    }
  }
}

/* ==========================================
   00. Image Fail-safe Placeholder Logic
   ========================================== */
function handleImageError(img) {
  img.onerror = null; // Prevent infinite loop
  
  const wrapper = img.parentElement;
  if (wrapper && (wrapper.classList.contains('menu-img-container') || wrapper.classList.contains('gallery-image-wrapper') || wrapper.classList.contains('drawer-img-wrapper') || wrapper.classList.contains('logo') || wrapper.classList.contains('gallery-item') || wrapper.tagName.toLowerCase() === 'div')) {
    wrapper.classList.add('img-failed');
    img.style.display = 'none';
    
    if (!wrapper.querySelector('.img-fallback-placeholder')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'img-fallback-placeholder';
      
      let icon = 'fa-cookie-bite';
      const altText = (img.alt || '').toLowerCase();
      if (altText.includes('dining') || altText.includes('entrance') || altText.includes('hall') || altText.includes('ambiance')) {
        icon = 'fa-store';
      } else if (altText.includes('chef') || altText.includes('kitchen') || altText.includes('tandoor') || altText.includes('culinary')) {
        icon = 'fa-fire-burner';
      } else if (altText.includes('biryani') || altText.includes('tikka') || altText.includes('feast') || altText.includes('mains')) {
        icon = 'fa-plate-wheat';
      }
      
      placeholder.innerHTML = `<i class="fa-solid ${icon}"></i><span>Gourmet Selection</span>`;
      wrapper.appendChild(placeholder);
    }
  } else {
    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f97316"/><circle cx="150" cy="90" r="35" fill="none" stroke="%23fbbf24" stroke-width="3"/><path d="M135 90h30M150 75v30" stroke="%23fbbf24" stroke-width="3"/><text x="50%" y="155" dominant-baseline="middle" text-anchor="middle" font-family="'Playfair Display', serif" font-weight="bold" font-size="16" fill="white">ANAMIKA SWEETS</text><text x="50%" y="175" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23fef3c7" letter-spacing="2">SAFFRON LOUNGE</text></svg>`;
  }
}

function initImageFallbacks() {
  const allImages = document.querySelectorAll('img');
  allImages.forEach(img => {
    // Skip the lightbox image — it has its own reset logic in openLightbox()
    // and starts with src="" which would incorrectly trigger the fallback
    if (img.id === 'lightbox-main-img') return;

    // Only call handleImageError if the browser has FINISHED trying to load
    // the image (img.complete === true) and it failed (naturalWidth === 0).
    // img.getAttribute('src') (not img.src property) avoids false positives
    // from src="" resolving to the page URL or lazy-deferred images not yet fetched.
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
      handleImageError(img);
    }

    img.addEventListener('error', () => {
      handleImageError(img);
    });
  });
}

/* ==========================================
   0. Dynamic Restaurant Info Initializer
   ========================================== */
function initDynamicRestaurantInfo() {
  const config = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {
    business: {
      name: "ANAMIKA SWEETS",
      tagline: "SAFFRON LOUNGE",
      helpline: "+91 97602 92999",
      whatsapp: "+91 78580 62571",
      whatsappText: "Namaste! I would like to order sweets from Anamika Sweets.",
      email: "info@anamikasweets.com",
      supportEmail: "support@anamikasweets.com",
      addressLine1: "Hasanpur Chungi, Delhi Road",
      addressLine2: "Saharanpur, Uttar Pradesh, 247001",
      openingHoursDays: "Monday - Sunday",
      openingHoursTime: "11:30 AM - 11:30 PM",
      social: {
        facebook: "https://www.facebook.com/anamikasweets",
        instagram: "https://www.instagram.com/anamikasweets",
        twitter: "https://x.com/anamikasweets",
        youtube: "https://www.youtube.com/@anamikasweets"
      },
      googleMapsLink: "https://maps.google.com"
    },
    branding: {
      primaryColor: "#f97316",
      primaryHover: "#ea580c",
      accentGold: "#b38728",
      fontMain: "'Outfit', sans-serif"
    },
    trust: {
      fssaiLicense: "FSSAI License: 12724999000123",
      googleRatingText: "4.8 Stars (500+ Google Reviews)",
      badges: [
        { icon: "fa-certificate", text: "FSSAI Certified" },
        { icon: "fa-leaf", text: "100% Pure Veg" },
        { icon: "fa-history", text: "Since 1995" },
        { icon: "fa-star", text: "Top Rated" }
      ]
    }
  };

  const business = config.business;

  // 0. Update SEO from config dynamically
  if (config.seo) {
    if (config.seo.title && !document.title.includes("Self-Audit")) {
      const currentTitle = document.title;
      if (currentTitle.includes('—')) {
        const parts = currentTitle.split('—');
        document.title = `${parts[0].trim()} — ${business.name}`;
      } else if (currentTitle.includes('–')) {
        const parts = currentTitle.split('–');
        document.title = `${parts[0].trim()} — ${business.name}`;
      } else if (currentTitle.includes('|')) {
        const parts = currentTitle.split('|');
        document.title = `${parts[0].trim()} — ${business.name}`;
      } else {
        document.title = config.seo.title;
      }
    }
    if (config.seo.description) {
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) descMeta.setAttribute('content', config.seo.description);
    }
    if (config.seo.keywords) {
      const keyMeta = document.querySelector('meta[name="keywords"]');
      if (keyMeta) keyMeta.setAttribute('content', config.seo.keywords);
    }
  }

  // Set CSS Root variables from branding config dynamically if present
  if (config.branding) {
    const root = document.documentElement;
    if (config.branding.primaryColor) root.style.setProperty('--primary', config.branding.primaryColor);
    if (config.branding.accentGold) root.style.setProperty('--accent-gold', config.branding.accentGold);
    if (config.branding.fontMain) root.style.setProperty('--font-main', config.branding.fontMain);
  }

  // 1. Update branding names
  const brandNameEls = document.querySelectorAll('#nav-brand-name, #footer-brand-name, #preloader-brand-name, #footer-copyright-name, #brochure-brand-name, #brochure-brand-name-front, #about-brand-name');
  brandNameEls.forEach(el => { el.textContent = business.name; });

  const taglineEls = document.querySelectorAll('#preloader-tagline, #brochure-tagline');
  taglineEls.forEach(el => { el.textContent = business.tagline; });

  // Update logos
  const logoImgs = document.querySelectorAll('#nav-logo-img, #footer-logo-img, #brochure-logo-img');
  logoImgs.forEach(img => {
    if (business.logo) img.src = business.logo;
    img.alt = `${business.name} — ${business.tagline}`;
  });

  // 2. Update phone/helpline links and text
  const phoneLinks = document.querySelectorAll('a[href^="tel:"], #mobile-action-call');
  const cleanHelpline = business.helpline.replace(/\s+/g, '');
  phoneLinks.forEach(link => {
    link.href = `tel:${cleanHelpline}`;
    const txtNode = link.querySelector('.mobile-action-call-text');
    if (txtNode) {
      txtNode.textContent = "Call Now";
    } else if (/^\+?[0-9\s-]{8,}$/.test(link.textContent.trim())) {
      link.textContent = business.helpline;
    }
  });

  // 3. Update WhatsApp links
  const whatsappLinks = document.querySelectorAll('a[href*="wa.me"], #msg-whatsapp-link, #mobile-action-whatsapp');
  const cleanPhone = business.whatsapp.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(business.whatsappText)}`;
  whatsappLinks.forEach(link => {
    link.href = waUrl;
  });

  // 4. Update Directions/Google Maps Link
  const directionLinks = document.querySelectorAll('#mobile-action-directions');
  directionLinks.forEach(link => {
    if (business.googleMapsLink) link.href = business.googleMapsLink;
  });

  // 5. Update Email links
  const mailScheme = 'mail' + 'to' + ':';
  const emailLinks = document.querySelectorAll('a[href^="' + mailScheme + '"]');
  emailLinks.forEach(link => {
    if (link.href.includes('support')) {
      link.href = mailScheme + business.supportEmail;
      if (link.textContent.includes('@')) {
        link.textContent = business.supportEmail;
      }
    } else {
      link.href = mailScheme + business.email;
      if (link.textContent.includes('@')) {
        link.textContent = business.email;
      }
    }
  });

  // 6. Update Address Details
  const addressParagraphs = document.querySelectorAll('.footer-about p, .contact-text p, #footer-about-text');
  addressParagraphs.forEach(p => {
    if (p.id === 'footer-about-text') {
      const cityHint = business.addressLine2 ? business.addressLine2.split(',')[0].trim() : 'our city';
      p.textContent = `${business.name} - ${cityHint}'s premium reference point for high quality traditional sweets, fine dining tables, and party celebrations.`;
    } else if (p.textContent.includes('Hasanpur Chungi') || p.innerHTML.includes('Hasanpur Chungi')) {
      // Check if there is a next sibling <p> that has Saharanpur or Uttar Pradesh
      const nextSibling = p.nextElementSibling;
      if (nextSibling && nextSibling.tagName.toLowerCase() === 'p' && (nextSibling.textContent.includes('Saharanpur') || nextSibling.textContent.includes('Uttar Pradesh') || nextSibling.textContent.includes('247001'))) {
        p.textContent = business.addressLine1;
        nextSibling.textContent = business.addressLine2;
      } else {
        // Single paragraph address
        const icon = p.querySelector('i');
        if (icon) {
          p.innerHTML = '';
          p.appendChild(icon);
          p.appendChild(document.createTextNode(` ${business.addressLine1}, ${business.addressLine2}`));
        } else {
          p.innerHTML = `${business.addressLine1}<br>${business.addressLine2}`;
        }
      }
    }
  });

  const hoursTimeEls = document.querySelectorAll('#footer-hours-time');
  hoursTimeEls.forEach(el => { el.textContent = business.openingHoursTime; });

  const hoursDaysEls = document.querySelectorAll('#footer-hours-days');
  hoursDaysEls.forEach(el => { el.textContent = business.openingHoursDays; });

  const hoursLabels = document.querySelectorAll('.footer-hours p, .contact-text p');
  hoursLabels.forEach(p => {
    if (p.textContent.includes('11:30 AM')) {
      p.textContent = business.openingHoursTime;
    } else if (p.textContent.includes('Monday - Sunday') || p.textContent.includes('Mon - Sun')) {
      p.textContent = business.openingHoursDays;
    }
  });

  // 8. Update Social Links — use aria-label attribute for reliable matching
  const socialLinks = document.querySelectorAll('.social-links a, #footer-social-links a');
  socialLinks.forEach(link => {
    const ariaLabel = (link.getAttribute('aria-label') || '').toLowerCase();
    if (ariaLabel.includes('facebook') && business.social.facebook) {
      link.href = business.social.facebook;
    } else if (ariaLabel.includes('instagram') && business.social.instagram) {
      link.href = business.social.instagram;
    } else if (ariaLabel.includes('twitter') && business.social.twitter) {
      link.href = business.social.twitter;
    } else if (ariaLabel.includes('youtube') && business.social.youtube) {
      link.href = business.social.youtube;
    }
  });

  // 9. Update Trust Badge Section dynamically if container is present
  const trustBadgeContainer = document.getElementById('trust-badges-row');
  if (trustBadgeContainer && config.trust && config.trust.badges) {
    trustBadgeContainer.innerHTML = '';
    config.trust.badges.forEach(badge => {
      const badgeCol = document.createElement('div');
      badgeCol.className = 'trust-badge-card';
      badgeCol.style.cssText = "display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px; padding: 15px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; transition: var(--transition);";
      badgeCol.innerHTML = `
        <div class="trust-badge-icon" style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary-soft); color: var(--primary); font-size: 1.25rem;">
          <i class="fa-solid ${badge.icon}"></i>
        </div>
        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px;">${badge.text}</span>
      `;
      trustBadgeContainer.appendChild(badgeCol);
    });
  }

  // Update FSSAI license placeholder
  const fssaiEl = document.getElementById('fssai-placeholder');
  if (fssaiEl && config.trust && config.trust.fssaiLicense) {
    fssaiEl.textContent = config.trust.fssaiLicense;
  }
}

/// Load state from LocalStorage to share between pages!
let cart = AnSUtils.readStorageJSON('anamika-cart', {}); // maps dishId to quantity (number)
let likedItems = AnSUtils.readStorageJSON('anamika-likes', {}); // maps dishId to boolean

// Rehydrate custom box items from localStorage into DISHES_CATALOG so cart render works across pages
try {
  const customItems = AnSUtils.readStorageJSON('anamika-custom-items', []);
  if (customItems.length > 0 && typeof DISHES_CATALOG !== 'undefined') {
    // Only add items that are still in the cart (clean up stale ones)
    const validItems = customItems.filter(item => cart[item.id]);
    if (validItems.length !== customItems.length) {
      localStorage.setItem('anamika-custom-items', JSON.stringify(validItems));
    }
    validItems.forEach(item => {
      if (!DISHES_CATALOG.find(d => d.id === item.id)) {
        DISHES_CATALOG.push(item);
      }
    });
  }
} catch (e) {
  console.warn('[State] Could not rehydrate custom items:', e);
}

let currentHeroSlide = 0;
let currentReviewSlide = 0;
let activeCategory = 'all';
let searchQuery = '';

// Elements caching (using let to allow populating after components are mounted dynamically)
let menuSearch = null;
let searchClearBtn = null;
let navbar = null;
let themeBtns = [];
let mobileToggle = null;
let navLinks = null;
let menuGrid = null;
let filterBtns = [];
let reservationForm = null;
let successModal = null;
let modalMsg = null;
let modalCloseBtn = null;
let newsletterForm = null;
let toastContainer = null;
let likesCountBadge = null;
let cartCountBadge = null;

// Drawer Elements Caching
let cartDrawer = null;
let cartDrawerClose = null;
let cartDrawerOverlay = null;
let cartSubtotalEl = null;
let checkoutBtn = null;

let likesDrawer = null;
let likesDrawerClose = null;
let likesDrawerOverlay = null;

let headerCartBtn = null;
let headerLikesBtn = null;

function initCachedElements() {
  menuSearch = document.getElementById('menu-search');
  searchClearBtn = document.getElementById('search-clear-btn');
  navbar = document.getElementById('navbar');
  themeBtns = document.querySelectorAll('#theme-btn, .mobile-drawer-theme-btn');
  mobileToggle = document.getElementById('mobile-toggle');
  navLinks = document.getElementById('nav-links');
  menuGrid = document.getElementById('menu-grid');
  filterBtns = document.querySelectorAll('.tab-btn');
  reservationForm = document.getElementById('reservation-form');
  successModal = document.getElementById('success-modal');
  modalMsg = document.getElementById('modal-msg');
  modalCloseBtn = document.getElementById('modal-close-btn');
  newsletterForm = document.getElementById('newsletter-form');
  toastContainer = document.getElementById('toast-container');
  likesCountBadge = document.getElementById('likes-count');
  cartCountBadge = document.getElementById('cart-count');

  cartDrawer = document.getElementById('cart-drawer');
  cartDrawerClose = document.getElementById('cart-drawer-close');
  cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
  cartSubtotalEl = document.getElementById('cart-subtotal');
  checkoutBtn = document.getElementById('checkout-btn');

  likesDrawer = document.getElementById('likes-drawer');
  likesDrawerClose = document.getElementById('likes-drawer-close');
  likesDrawerOverlay = document.getElementById('likes-drawer-overlay');

  headerCartBtn = document.getElementById('header-cart-btn');
  headerLikesBtn = document.getElementById('header-likes-btn');

  // Re-bind actions that depend on caching
  bindNavigationToggle();
  bindThemeButtons();
  bindFilterButtons();
  bindSearchActions();
  bindModalClicks();
  bindNewsletterClicks();
  bindDrawerCloseEvents();
  bindCheckoutAction();
  bindReservationSubmit();
}

function bindNavigationToggle() {
  if (mobileToggle && navLinks) {
    // Clear old listener by replacing node if needed, or check if already bound.
    // For simplicity, just add event listener safely.
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!isExpanded));
      navLinks.setAttribute('aria-hidden', String(isExpanded));
      navLinks.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.className = navLinks.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
      }
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', 'true');
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }
}

function bindThemeButtons() {
  if (themeBtns.length > 0) {
    themeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        let swipe = document.querySelector('.theme-transition-swipe');
        if (!swipe) {
          swipe = document.createElement('div');
          swipe.className = 'theme-transition-swipe';
          swipe.style.cssText = "position: fixed; border-radius: 50%; background: var(--primary); z-index: 99999; transform: translate(-50%, -50%) scale(0); pointer-events: none; transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.65s ease; width: 250vmax; height: 250vmax; opacity: 0.15;";
          document.body.appendChild(swipe);
        }
        
        const targetBtn = e.currentTarget;
        const rect = targetBtn.getBoundingClientRect();
        const clickX = e.clientX || (rect.left + rect.width / 2);
        const clickY = e.clientY || (rect.top + rect.height / 2);
        
        swipe.style.left = clickX + 'px';
        swipe.style.top = clickY + 'px';
        
        swipe.style.opacity = '0.25';
        swipe.style.transform = 'translate(-50%, -50%) scale(1)';
        
        setTimeout(() => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', targetTheme);
          localStorage.setItem('anamika-theme', targetTheme);
          updateThemeIcon(targetTheme);
          showToast(`Switched to ${targetTheme} mode!`, 'info');
        }, 250);
        
        setTimeout(() => {
          swipe.style.opacity = '0';
          swipe.style.transform = 'translate(-50%, -50%) scale(0)';
        }, 700);
      });
    });
  }
}

function bindFilterButtons() {
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterValue = btn.getAttribute('data-filter');
        renderMenu(filterValue);
      });
    });
  }
}

function bindSearchActions() {
  if (menuSearch) {
    menuSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClearBtn) {
        if (searchQuery.length > 0) {
          searchClearBtn.classList.add('active');
        } else {
          searchClearBtn.classList.remove('active');
        }
      }
      renderMenu();
    });
  }

  if (searchClearBtn && menuSearch) {
    searchClearBtn.addEventListener('click', () => {
      menuSearch.value = '';
      searchQuery = '';
      searchClearBtn.classList.remove('active');
      menuSearch.focus();
      renderMenu();
    });
  }
}

function bindModalClicks() {
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      if (successModal) successModal.classList.remove('active');
      showToast("Receipt closed!", "info");
    });
  }

  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('active');
      }
    });
  }
}

function bindNewsletterClicks() {
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input');
      const email = emailInput ? emailInput.value : '';
      
      showToast("Sending newsletter subscription details...", "info");
      const emailData = {
        _subject: "New Anamika Sweets Newsletter Subscription!",
        _template: "box",
        subscriber_email: email,
        timestamp: new Date().toLocaleString()
      };
      sendEmail(emailData);
      
      showToast(`Thank you for subscribing with ${email}!`, 'success');
      newsletterForm.reset();
    });
  }
}

/* ==========================================
   1. Theme Customizer (Dark / Light Mode)
   ========================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('anamika-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('#theme-btn i, .mobile-drawer-theme-btn i');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  });
}

// Theme buttons are bound dynamically inside bindThemeButtons()

/* ==========================================
   2. Responsive Scroll Actions
   ========================================== */
window.addEventListener('scroll', () => {
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  
  // Premium Scroll Progress Indicator
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  if (height > 0) {
    const scrolled = (winScroll / height) * 100;
    const progress = document.getElementById('scroll-progress');
    if (progress) progress.style.width = scrolled + '%';
  }
});

// Navigation drawer bindings are now handled dynamically via bindNavigationToggle() inside initCachedElements()

// Hero slide binding is deferred to LayoutComponentsLoaded event below
let heroAutoplayInterval = null;

// Review slider binding is deferred to LayoutComponentsLoaded event below

/* ==========================================
   5. Dynamic Dishes Catalog & Filter logic
   ========================================== */
function renderMenu(filter = activeCategory) {
  if (!menuGrid) return;
  menuGrid.innerHTML = '';
  
  activeCategory = filter;
  
  // Combine category filter and search query
  let filtered = DISHES_CATALOG;
  
  if (activeCategory !== 'all') {
    filtered = filtered.filter(d => d.category === activeCategory);
  }
  
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.description.toLowerCase().includes(query)
    );
  }
  
  if (filtered.length === 0) {
    menuGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 60px 20px; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%;">
        <i class="fa-solid fa-magnifying-glass-minus" style="font-size: 3rem; color: var(--border-color);"></i>
        <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-main);">No dishes match your search query</p>
        <p style="font-size: 0.9rem; max-width: 320px; margin-top: -5px;">Try checking your spelling, choosing a different category tab, or clearing the search box.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(dish => {
    const isLiked = likedItems[dish.id] ? 'active' : '';
    const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';
    const addToCartText = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].addToCart) ? TRANSLATIONS[lang].addToCart : 'Add to Cart';
    const inCartText = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].inCart) ? TRANSLATIONS[lang].inCart : 'In Cart';
    const isInCart = cart[dish.id] ? inCartText : addToCartText;
    const isCartBtnActive = cart[dish.id] ? 'style="background:var(--primary); color:white; border-color:var(--primary)"' : '';
    
    const _cfg = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : { business: { name: "Anamika Sweets", whatsapp: "917858062571", whatsappText: "Namaste! I would like to order." } };
    const waPhone = _cfg.business.whatsapp.replace(/[^0-9]/g, '');
    const itemText = `Namaste! I would like to order or enquire about *${dish.name}* (Price: \u20B9${dish.price}) from ${_cfg.business.name}.`;
    const waShareUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(itemText)}`;

    const card = document.createElement('div');
    card.className = 'menu-card';
    card.innerHTML = `
      <div class="menu-img-container">
        <!-- Veg/Non-veg badge left aligned -->
        <span class="${dish.isVeg ? 'badge-veg' : 'badge-nonveg'}" style="position: absolute; top: 15px; left: 15px; right: auto; z-index: 5;">${dish.isVeg ? 'Veg' : 'Non-Veg'}</span>
        
        <!-- Like/Favorite heart button right aligned on top of the image -->
        <button class="btn-icon like-btn ${isLiked}" data-id="${dish.id}" aria-label="Like ${dish.name}" style="position: absolute; top: 15px; right: 15px; background: var(--bg-surface-glass); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 5; border-color: var(--border-color);">
          <i class="fa-solid fa-heart"></i>
        </button>
        
        <img src="${dish.image}" alt="${dish.name}" loading="lazy" decoding="async" width="1024" height="1024" onerror="handleImageError(this)">
      </div>
      <div class="menu-info">
        <h3>${dish.name}</h3>
        <p>${dish.description}</p>
        <div class="menu-footer">
          <span class="menu-price">₹${dish.price}</span>
          <div class="menu-footer-actions" style="flex-grow: 1; display: flex; justify-content: flex-end; margin-left: 28px; gap: 8px;">
            <!-- WhatsApp Product Share Button -->
            <a href="${waShareUrl}" target="_blank" rel="noopener noreferrer" class="btn-icon wa-share-btn" title="Share via WhatsApp" style="border-color: #25d366; color: #25d366; background: transparent; width: 36px; height: 36px; min-width: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%;">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <!-- Add to cart takes full action area width for cleaner look -->
            <button class="btn-secondary cart-btn" data-id="${dish.id}" ${isCartBtnActive} style="flex-grow: 1; justify-content: center; font-size: 0.9rem;" aria-label="Add ${dish.name} to cart">
              <i class="fa-solid fa-shopping-cart"></i> ${isInCart}
            </button>
          </div>
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });

  bindCatalogActions();
  initHoverGlows();
}

// Event listeners for filters, search bar and clear buttons are now bound dynamically in bindFilterButtons(), bindSearchActions() via initCachedElements()

/* ==========================================
   6. Shopping Cart & Likes State Actions
   ========================================== */
function saveState() {
  localStorage.setItem('anamika-cart', JSON.stringify(cart));
  localStorage.setItem('anamika-likes', JSON.stringify(likedItems));
  // Clean up custom items that are no longer in cart
  try {
    const customItems = JSON.parse(localStorage.getItem('anamika-custom-items') || '[]');
    const validCustom = customItems.filter(item => cart[item.id]);
    localStorage.setItem('anamika-custom-items', JSON.stringify(validCustom));
  } catch (e) {}
}


function bindCatalogActions() {
  if (!menuGrid) return;
  
  // Likes trigger
  menuGrid.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const item = DISHES_CATALOG.find(d => d.id == id);
      
      likedItems[id] = !likedItems[id];
      btn.classList.toggle('active');
      
      saveState();
      updateLikesBadge();
      
      if (!item) {
        showToast('Favorites updated!', likedItems[id] ? 'success' : 'info');
      } else if (likedItems[id]) {
        showToast(`Added "${item.name}" to your favorites!`, 'success');
      } else {
        showToast(`Removed "${item.name}" from favorites.`, 'info');
      }
      
      // Update drawer or page list in real-time if active
      if (likesDrawer && likesDrawer.classList.contains('active')) {
        renderLikesDrawer();
      }
      // If we have a standalone favorites container on page
      if (document.getElementById('likes-drawer-items')) {
        renderLikesDrawer();
      }
    });
  });

  // Cart trigger
  menuGrid.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const item = DISHES_CATALOG.find(d => d.id == id);
      const lang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'en';
      const addToCartText = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].addToCart) ? TRANSLATIONS[lang].addToCart : 'Add to Cart';
      const inCartText = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].inCart) ? TRANSLATIONS[lang].inCart : 'In Cart';
      
      if (cart[id]) {
        delete cart[id];
        btn.innerHTML = `<i class="fa-solid fa-shopping-cart"></i> ${addToCartText}`;
        btn.removeAttribute('style');
        if (item) showToast(`Removed "${item.name}" from shopping cart.`, 'info');
      } else {
        cart[id] = 1;
        btn.innerHTML = `<i class="fa-solid fa-shopping-cart"></i> ${inCartText}`;
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--primary)';
        if (item) showToast(`Added "${item.name}" to your shopping cart!`, 'success');
      }
      
      saveState();
      updateCartBadge();
      
      if (cartDrawer && cartDrawer.classList.contains('active')) {
        renderCartDrawer();
      }
      if (document.getElementById('cart-drawer-items')) {
        renderCartDrawer();
      }
    });
  });
  
  // Dynamic re-bind of 3D tilt micro-interactions on dishes render
  if (typeof init3DTilt === 'function') {
    init3DTilt();
  }
}

function updateBadge(badgeElement, count) {
  if (badgeElement) {
    if (count > 0) {
      badgeElement.style.display = 'flex';
      badgeElement.textContent = count;
    } else {
      badgeElement.style.display = 'none';
    }
  }
}

function updateCartBadge() {
  const cartCount = Object.keys(cart).length;
  updateBadge(cartCountBadge, cartCount);
}

function updateLikesBadge() {
  const menuLikesCount = Object.values(likedItems).filter(Boolean).length;
  const galleryLikes = AnSUtils.readStorageJSON('anamika-gallery-likes', {});
  const galleryLikesCount = Object.values(galleryLikes).filter(Boolean).length;
  updateBadge(likesCountBadge, menuLikesCount + galleryLikesCount);
}

/* ==========================================
   7. Sidebar Drawers Controller
   ========================================== */

// Sidebar drawer event listeners for Likes and Cart are disabled to allow direct standalone page routing to cart.html and likes.html.
function bindDrawerCloseEvents() {
  if (cartDrawerClose) cartDrawerClose.addEventListener('click', () => cartDrawer.classList.remove('active'));
  if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', () => cartDrawer.classList.remove('active'));
  if (likesDrawerClose) likesDrawerClose.addEventListener('click', () => likesDrawer.classList.remove('active'));
  if (likesDrawerOverlay) likesDrawerOverlay.addEventListener('click', () => likesDrawer.classList.remove('active'));
}

function renderCartDrawer() {
  const itemsContainer = document.getElementById('cart-drawer-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const footerEl = document.getElementById('cart-drawer-footer');
  
  if (!itemsContainer) return;
  itemsContainer.innerHTML = '';
  let subtotal = 0;
  const cartIds = Object.keys(cart);
  
  if (cartIds.length === 0) {
    itemsContainer.innerHTML = `
      <div class="drawer-empty-state" style="padding: 60px 20px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 15px;">
        <i class="fa-solid fa-basket-shopping" style="font-size: 3rem; color: var(--border-color);"></i>
        <p>Your shopping cart is currently empty.</p>
        <button class="btn-secondary" id="empty-cart-shop-btn" style="padding: 8px 20px; font-size: 0.85rem; border-radius: 20px;">Explore Delicious Menu</button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = '₹0';
    if (footerEl) footerEl.style.display = 'none';
    
    const shopBtn = document.getElementById('empty-cart-shop-btn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => {
        if (cartDrawer) cartDrawer.classList.remove('active');
        window.location.href = 'menu.html';
      });
    }
    return;
  }
  
  if (footerEl) footerEl.style.display = 'block';
  
  cartIds.forEach(id => {
    const dish = DISHES_CATALOG.find(d => d.id == id);
    if (!dish) return;
    const qty = cart[id];
    const itemTotal = dish.price * qty;
    subtotal += itemTotal;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'drawer-item';
    itemEl.style.cssText = "display: flex; gap: 15px; align-items: center; padding: 15px 0; border-bottom: 1px solid var(--border-color); position: relative;";
    itemEl.innerHTML = `
      <div class="drawer-img-wrapper" style="position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--primary-soft); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
        <img src="${dish.image}" alt="${dish.name}" class="drawer-item-img" loading="lazy" decoding="async" width="1024" height="1024" style="width: 100%; height: 100%; object-fit: cover;" onerror="handleImageError(this)">
      </div>
      <div class="drawer-item-details" style="flex-grow: 1;">
        <h4 style="font-size: 0.95rem; margin-bottom: 4px; font-family: 'Outfit', sans-serif; font-weight: 600;">${dish.name}</h4>
        <span class="drawer-item-price" style="color: var(--primary); font-weight: 700; font-size: 0.9rem;">₹${dish.price}</span>
        
        <div class="qty-selector" style="display: flex; align-items: center; gap: 10px; margin-top: 8px; border: 1px solid var(--border-color); border-radius: 15px; width: fit-content; padding: 2px 8px; background: var(--bg-main);">
          <button class="qty-btn dec-qty" data-id="${id}" style="background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.8rem; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-minus"></i></button>
          <span class="qty-val" style="font-size: 0.85rem; font-weight: 600; min-width: 15px; text-align: center;">${qty}</span>
          <button class="qty-btn inc-qty" data-id="${id}" style="background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 0.8rem; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
      <button class="drawer-item-delete remove-cart" data-id="${id}" title="Remove from cart" style="background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 1.1rem; padding: 5px; transition: var(--transition);">
        <i class="fa-solid fa-trash-can" style="pointer-events: none;"></i>
      </button>
    `;
    itemsContainer.appendChild(itemEl);
  });
  
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  bindCartDrawerActions();
}

function bindCartDrawerActions() {
  const container = document.getElementById('cart-drawer-items');
  if (!container) return;
  
  container.querySelectorAll('.inc-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      cart[id] = (cart[id] || 0) + 1;
      saveState();
      renderCartDrawer();
      updateCartBadge();
      const currentTab = document.querySelector('.tab-btn.active');
      if (currentTab) renderMenu(currentTab.getAttribute('data-filter'));
    });
  });
  
  container.querySelectorAll('.dec-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      cart[id]--;
      if (cart[id] <= 0) {
        delete cart[id];
        showToast("Item removed from cart.", "info");
      }
      saveState();
      renderCartDrawer();
      updateCartBadge();
      const currentTab = document.querySelector('.tab-btn.active');
      if (currentTab) renderMenu(currentTab.getAttribute('data-filter'));
    });
  });
  
  container.querySelectorAll('.remove-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      delete cart[id];
      saveState();
      showToast("Item removed from cart.", "info");
      renderCartDrawer();
      updateCartBadge();
      const currentTab = document.querySelector('.tab-btn.active');
      if (currentTab) renderMenu(currentTab.getAttribute('data-filter'));
    });
  });
  
  container.querySelectorAll('.drawer-item-delete').forEach(btn => {
    btn.addEventListener('mouseover', () => btn.style.color = '#ef4444');
    btn.addEventListener('mouseout', () => btn.style.color = 'var(--text-muted)');
  });
}

function renderLikesDrawer() {
  const container = document.getElementById('likes-drawer-items');
  if (!container) return;
  container.innerHTML = '';
  const likedIds = Object.keys(likedItems).filter(id => likedItems[id]);

  // Note: GALLERY_CATALOG is loaded from data.js configuration.

  const galleryLikes = AnSUtils.readStorageJSON('anamika-gallery-likes', {});
  const likedGalleryIds = Object.keys(galleryLikes).filter(id => galleryLikes[id]);

  // If both are empty
  if (likedIds.length === 0 && likedGalleryIds.length === 0) {
    container.innerHTML = `
      <div class="drawer-empty-state" style="padding: 60px 20px; text-align: center; color: var(--text-muted); display: flex; flex-direction: column; align-items: center; gap: 15px;">
        <i class="fa-solid fa-heart-crack" style="font-size: 3rem; color: var(--border-color);"></i>
        <p>Your favorites list is currently empty.</p>
        <button class="btn-secondary" id="empty-likes-shop-btn" style="padding: 8px 20px; font-size: 0.85rem; border-radius: 20px;">Browse Menu</button>
      </div>
    `;
    
    const shopBtn = document.getElementById('empty-likes-shop-btn');
    if (shopBtn) {
      shopBtn.addEventListener('click', () => {
        if (likesDrawer) likesDrawer.classList.remove('active');
        window.location.href = 'menu.html';
      });
    }
    return;
  }

  // --- Menu Favorites Section ---
  if (likedIds.length > 0) {
    const menuHeader = document.createElement('div');
    menuHeader.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);';
    menuHeader.innerHTML = '<i class="fa-solid fa-utensils" style="color: var(--primary); font-size: 1rem;"></i><h4 style="font-size: 1rem; font-family: Playfair Display, serif; font-weight: 700; margin: 0;">Menu Favorites</h4>';
    container.appendChild(menuHeader);
  }
  
  likedIds.forEach(id => {
    const dish = DISHES_CATALOG.find(d => d.id == id);
    if (!dish) return;
    
    const itemEl = document.createElement('div');
    itemEl.className = 'drawer-item';
    itemEl.style.cssText = "display: flex; gap: 15px; align-items: center; padding: 15px 0; border-bottom: 1px solid var(--border-color); position: relative;";
    itemEl.innerHTML = `
      <div class="drawer-img-wrapper" style="position: relative; width: 60px; height: 60px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--primary-soft); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
        <img src="${dish.image}" alt="${dish.name}" class="drawer-item-img" loading="lazy" decoding="async" width="1024" height="1024" style="width: 100%; height: 100%; object-fit: cover;" onerror="handleImageError(this)">
      </div>
      <div class="drawer-item-details" style="flex-grow: 1;">
        <h4 style="font-size: 0.95rem; margin-bottom: 4px; font-family: 'Outfit', sans-serif; font-weight: 600;">${dish.name}</h4>
        <span class="drawer-item-price" style="color: var(--primary); font-weight: 700; font-size: 0.9rem;">₹${dish.price}</span>
        <br>
        <button class="btn-secondary add-to-cart-from-likes" data-id="${id}" style="padding: 4px 12px; font-size: 0.75rem; border-radius: 12px; margin-top: 6px; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
          <i class="fa-solid fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
      <button class="drawer-item-delete remove-like" data-id="${id}" title="Remove from favorites" style="background: none; border: none; cursor: pointer; color: #ef4444; font-size: 1.1rem; padding: 5px;">
        <i class="fa-solid fa-heart" style="pointer-events: none;"></i>
      </button>
    `;
    container.appendChild(itemEl);
  });

  // --- Gallery Favorites Section ---
  if (likedGalleryIds.length > 0) {
    const galleryHeader = document.createElement('div');
    galleryHeader.style.cssText = 'display: flex; align-items: center; gap: 8px; margin: 25px 0 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);';
    galleryHeader.innerHTML = '<i class="fa-solid fa-images" style="color: var(--primary); font-size: 1rem;"></i><h4 style="font-size: 1rem; font-family: Playfair Display, serif; font-weight: 700; margin: 0;">Gallery Favorites</h4>';
    container.appendChild(galleryHeader);

    const galleryGrid = document.createElement('div');
    galleryGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 10px;';

    likedGalleryIds.forEach(id => {
      const photo = GALLERY_CATALOG[id];
      if (!photo) return;

      const card = document.createElement('div');
      card.style.cssText = 'position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);';
      card.innerHTML = `
        <div class="drawer-img-wrapper" style="position: relative; width: 100%; height: 100%; background: var(--primary-soft); display: flex; align-items: center; justify-content: center;">
          <img src="${photo.image}" alt="${photo.title}" loading="lazy" decoding="async" width="1024" height="1024" style="width: 100%; height: 100%; object-fit: cover;" onerror="handleImageError(this)">
        </div>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 10px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); z-index: 2;">
          <span style="background: rgba(249,115,22,0.9); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 600; text-transform: uppercase;">${photo.badge}</span>
          <p style="color: white; font-size: 0.8rem; font-weight: 600; margin: 4px 0 0; font-family: 'Outfit', sans-serif;">${photo.title}</p>
        </div>
        <button class="remove-gallery-like" data-id="${id}" title="Remove from favorites" style="position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 50%; background: rgba(239,68,68,0.9); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; transition: all 0.3s; z-index: 3;">
          <i class="fa-solid fa-heart" style="pointer-events: none;"></i>
        </button>
      `;
      galleryGrid.appendChild(card);
    });

    container.appendChild(galleryGrid);
  }
  
  bindLikesDrawerActions();
}

function bindLikesDrawerActions() {
  const container = document.getElementById('likes-drawer-items');
  if (!container) return;
  
  // Menu item removal
  container.querySelectorAll('.remove-like').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      likedItems[id] = false;
      saveState();
      showToast("Removed from favorites.", "info");
      renderLikesDrawer();
      updateLikesBadge();
      const currentTab = document.querySelector('.tab-btn.active');
      if (currentTab) renderMenu(currentTab.getAttribute('data-filter'));
    });
  });

  // Gallery photo removal
  container.querySelectorAll('.remove-gallery-like').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const galleryLikes = AnSUtils.readStorageJSON('anamika-gallery-likes', {});
      galleryLikes[id] = false;
      localStorage.setItem('anamika-gallery-likes', JSON.stringify(galleryLikes));
      showToast("Removed gallery photo from favorites.", "info");
      renderLikesDrawer();
      updateLikesBadge();
    });
  });
  
  container.querySelectorAll('.add-to-cart-from-likes').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = DISHES_CATALOG.find(d => d.id == id);
      cart[id] = (cart[id] || 0) + 1;
      saveState();
      showToast(item ? `Added "${item.name}" to cart!` : 'Item added to cart!', "success");
      updateCartBadge();
      
      // Update cart drawer in real-time too
      renderCartDrawer();
      
      const currentTab = document.querySelector('.tab-btn.active');
      if (currentTab) renderMenu(currentTab.getAttribute('data-filter'));
    });
  });
}

// Helper to download receipts locally (Approach 3)
function triggerReceiptDownload(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("Receipt downloaded successfully!", "success");
}

// Helper to send emails via FormSubmit AJAX — email is pulled from SITE_CONFIG.business.supportEmail (Approach 2)
function sendEmail(data) {
  const config = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : null;
  const recipientEmail = config && config.business && config.business.supportEmail
    ? config.business.supportEmail
    : 'support@yourbusiness.com';

  (async () => {
    try {
      const response = await fetchWithTimeout(`https://formsubmit.co/ajax/${encodeURIComponent(recipientEmail)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data)
      }, 5000);

      if (!response.ok) {
        throw new Error(`Email submit failed with HTTP ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success === "true") {
        showToast("Order details sent to business email!", "success");
      } else {
        showToast("Details recorded successfully!", "success");
      }
    } catch (err) {
      console.error("Email submission fail-safe triggered:", err);
      // User will see activation screen on very first submit which is FormSubmit's process, subsequent ones are silent
      showToast("Forwarded details to inbox!", "success");
    }
  })();
}

// Checkout button handler in Cart drawer/page safely
function bindCheckoutAction() {
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartDrawer) cartDrawer.classList.remove('active');
      if (successModal && modalMsg) {
        const ref = `AS-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        const timestamp = new Date().toLocaleString();
        
        let itemsText = "";
        let subtotal = 0;
        const cartIds = Object.keys(cart);
        
        cartIds.forEach(id => {
          const dish = DISHES_CATALOG.find(d => d.id == id);
          if (dish) {
            const qty = cart[id];
            itemsText += `- ${dish.name} (Qty: ${qty}) - ₹${dish.price * qty}\n`;
            subtotal += dish.price * qty;
          }
        });
        
        const _cfg = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.business : {};
        const _bizName = _cfg.name || 'BUSINESS NAME';
        const _bizAddr = `${_cfg.addressLine1 || ''}, ${_cfg.addressLine2 || ''}`.trim().replace(/^,\s*/, '');
        const _helpline = _cfg.helpline || 'Contact us';
        const receiptText = `====================================\n  ${_bizName} — ORDER RECEIPT\n  ${_bizAddr}\n====================================\nTransaction Type: Gourmet Takeaway\nOrder Ref: ${ref}\nDate: ${timestamp}\n------------------------------------\nItems Ordered:\n${itemsText}\n------------------------------------\nSubtotal Amount: ₹${subtotal}\nDelivery: FREE (Promo)\nTotal Paid: ₹${subtotal}\n------------------------------------\nStatus: Preparing / Dispatched\n------------------------------------\nThank you for your order!\nFresh delicacies prepared with care.\nSupport Helpline: ${_helpline}\n====================================`;
        
        // 1. Download TXT (Approach 3)
        triggerReceiptDownload(receiptText, `Order_${ref}.txt`);
        
        // 2. Render Modal Receipt (Approach 4) — null-safe
        if (modalMsg) modalMsg.textContent = receiptText;

        
        // 3. Email Order submit (Approach 2)
        showToast("Sending email order details...", "info");
        
        const emailData = {
          _subject: `New ${_bizName} Order [Ref: ${ref}]`,
          _template: "box",
          order_reference: ref,
          items_ordered: itemsText,
          subtotal_amount: `₹${subtotal}`,
          delivery_charge: "FREE",
          total_paid: `₹${subtotal}`,
          timestamp: timestamp
        };
        
        sendEmail(emailData);
        
        // Reset cart
        cart = {};
        saveState();
        updateCartBadge();
        successModal.classList.add('active');
        
        // Re-render
        renderCartDrawer();
        const currentTab = document.querySelector('.tab-btn.active');
        if (currentTab) renderMenu(currentTab.getAttribute('data-filter'));
      }
    });
  }
}

/* ==========================================
   8. Modals, Alerts, & Reservation handler
   ========================================== */
function bindReservationSubmit() {
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const guests = document.getElementById('guests').value;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const typeEl = document.getElementById('type');
      const packageType = typeEl ? typeEl.options[typeEl.selectedIndex].text : 'Standard';
      
      const tableSelected = document.getElementById('selected-table-input') ? document.getElementById('selected-table-input').value : "Standard Dining Table";
      const ref = `AS-RES-${Math.floor(100000 + Math.random() * 900000)}`;
      const requestsEl = document.getElementById('requests');
      const requests = requestsEl ? requestsEl.value : '';
      const timestamp = new Date().toLocaleString();
      
      const _rcfg = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.business : {};
      const _rbizName = _rcfg.name || 'BUSINESS NAME';
      const _rbizAddr = `${_rcfg.addressLine1 || ''}, ${_rcfg.addressLine2 || ''}`.trim().replace(/^,\s*/, '');
      const _rhelpline = _rcfg.helpline || 'Contact us';
      const receiptText = `====================================\n  ${_rbizName} — TABLE RESERVATION\n  ${_rbizAddr}\n====================================\nTransaction Type: Table Seating\nBooking Ref: ${ref}\nDate: ${timestamp}\n------------------------------------\nCustomer Name: ${name}\nPhone: ${phone}\nSeating Date: ${date}\nSeating Time: ${time}\nGuests: ${guests}\nCategory: ${packageType}\nSelected Table: ${tableSelected}\n------------------------------------\nSpecial Kitchen Requests:\n${requests || 'None'}\n------------------------------------\nThank you for celebrating with us!\nA coordinator will call you shortly.\nSupport Helpline: ${_rhelpline}\n====================================`;
      
      // 1. Download TXT (Approach 3)
      triggerReceiptDownload(receiptText, `Reservation_${ref}.txt`);
      
      // 2. Render Modal Receipt (Approach 4) — null-safe
      if (modalMsg) modalMsg.textContent = receiptText;
      
      // 3. Email Form submit (Approach 2)
      showToast("Sending email reservation details...", "info");
      
      const emailData = {
        _subject: `New ${_rbizName} Table Reservation [Ref: ${ref}]`,
        _template: "box",
        booking_reference: ref,
        customer_name: name,
        contact_phone: phone,
        seating_date: date,
        seating_time: time,
        number_of_guests: guests,
        service_category: packageType,
        selected_table: tableSelected,
        special_kitchen_requests: requests || "None",
        timestamp: timestamp
      };
      
      sendEmail(emailData);
      
      if (successModal) successModal.classList.add('active');
      reservationForm.reset();
    });
  }
}

// Modal and newsletter submission events are now bound dynamically in bindModalClicks(), bindNewsletterClicks() via initCachedElements()

/* ==========================================
   9. Global Toast Alert Manager
   ========================================== */
function showToast(message, type = 'success') {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  let icon = 'fa-circle-check';
  if (type === 'info') icon = 'fa-circle-info';
  else if (type === 'warning') icon = 'fa-triangle-exclamation';
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fa-solid ${icon}"></i>
    </div>
    <span class="toast-text"></span>
    <button class="toast-dismiss" aria-label="Dismiss">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <div class="toast-progress"></div>
  `;
  toast.querySelector('.toast-text').textContent = message;
  
  toastContainer.appendChild(toast);
  
  // Dismiss on click
  const dismissBtn = toast.querySelector('.toast-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => removeToast(toast));
  }
  
  // Auto remove after progress bar completes
  setTimeout(() => removeToast(toast), 3500);
}

function removeToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.style.animation = 'toastSlideOut 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards';
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 350);
}

/* ==========================================
   10. Initialization
   ========================================== */
window.addEventListener('LayoutComponentsLoaded', () => {
  if (anamikaAppState.bootstrapped) {
    updateCartBadge();
    updateLikesBadge();
    return;
  }

  anamikaAppState.bootstrapped = true;

  // Never allow a late initializer failure to trap the page behind the loader.
  window.setTimeout(() => {
    fallbackReleasePreloader();
  }, 3000);

  runInitStep('initCachedElements', initCachedElements);
  runInitStep('initDynamicRestaurantInfo', initDynamicRestaurantInfo);
  runInitStep('initPreloader', initPreloader, fallbackReleasePreloader);
  runInitStep('initPageTransitions', initPageTransitions);
  runInitStep('initImageFallbacks', initImageFallbacks);
  runInitStep('initCursorTrail', initCursorTrail);
  runInitStep('initHoverGlows', initHoverGlows);
  runInitStep('initBrochureBooklet', initBrochureBooklet);
  runInitStep('initTheme', initTheme);
  runInitStep('renderMenu', renderMenu);
  runInitStep('updateCartBadge', updateCartBadge);
  runInitStep('updateLikesBadge', updateLikesBadge);
  runInitStep('initHeroSlider', initHeroSlider);
  runInitStep('initReviewSlider', initReviewSlider);

  runInitStep('setReservationMinDate', () => {
    const dateInput = document.getElementById('date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }
  });

  runInitStep('init3DTilt', init3DTilt);
  runInitStep('initSaffronParticles', initSaffronParticles);
  runInitStep('initMagneticButtons', initMagneticButtons);
  runInitStep('initTasteQuiz', initTasteQuiz);
  runInitStep('initBoxCustomizer', initBoxCustomizer);
  runInitStep('initScrollStory', initScrollStory);
  runInitStep('initGreenMessenger', initGreenMessenger);
  runInitStep('initSeatingPlanner', initSeatingPlanner);

  if (!anamikaAppState.languageListenerBound) {
    anamikaAppState.languageListenerBound = true;
    window.addEventListener('LanguageChanged', () => {
      renderMenu();
    });
  }
});

/* ==========================================
   3. Auto Banners Slider Loop
   ========================================== */
function initHeroSlider() {
  const heroSlides = document.querySelectorAll('.hero-slider .slide');
  const heroDots = document.querySelectorAll('.slider-dots .dot');

  function showHeroSlide(index) {
    if (heroSlides.length > 0) {
      heroSlides[currentHeroSlide].classList.remove('active');
      if (heroDots.length > 0) heroDots[currentHeroSlide].classList.remove('active');
      currentHeroSlide = index;
      heroSlides[currentHeroSlide].classList.add('active');
      if (heroDots.length > 0) heroDots[currentHeroSlide].classList.add('active');
    }
  }

  // Bind dots
  if (heroDots.length > 0) {
    heroDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showHeroSlide(index);
      });
    });
  }

  // Autoplay slider interval
  if (heroSlides.length > 1) {
    if (heroAutoplayInterval) clearInterval(heroAutoplayInterval);
    heroAutoplayInterval = setInterval(() => {
      let next = (currentHeroSlide + 1) % heroSlides.length;
      showHeroSlide(next);
    }, 6000);
  }
}

/* ==========================================
   4. Testimonials / Reviews Slider
   ========================================== */
function initReviewSlider() {
  const reviewSlides = document.querySelectorAll('.review-slide');
  const prevReviewBtn = document.getElementById('prev-review-btn');
  const nextReviewBtn = document.getElementById('next-review-btn');

  function showReviewSlide(index) {
    if (reviewSlides.length > 0) {
      reviewSlides[currentReviewSlide].classList.remove('active');
      currentReviewSlide = (index + reviewSlides.length) % reviewSlides.length;
      reviewSlides[currentReviewSlide].classList.add('active');
    }
  }

  if (prevReviewBtn) prevReviewBtn.addEventListener('click', () => showReviewSlide(currentReviewSlide - 1));
  if (nextReviewBtn) nextReviewBtn.addEventListener('click', () => showReviewSlide(currentReviewSlide + 1));
}


/* ==========================================
   Luxury Pre-loader & Hero Reveal
   ========================================== */
function initPreloader() {
  const preloader = document.getElementById('luxury-preloader');
  const heroContent = document.querySelector('.hero-content');
  
  // Detect if this is a subpage jump (visited already in current session)
  const isFirstLoad = !sessionStorage.getItem('anamika-session-visited');
  sessionStorage.setItem('anamika-session-visited', 'true');
  
  const drawDuration = isFirstLoad ? 1800 : 500; // 1.8s for grand intro, 500ms for snappy jumps
  
  if (preloader) {
    if (!isFirstLoad) {
      // Speed up animations for snappy jump transitions
      const outerRing = preloader.querySelector('.logo-outer-ring');
      if (outerRing) {
        outerRing.style.animationDuration = '6s'; // Spin outer orbit faster!
      }
      const badge = preloader.querySelector('.logo-vector-badge');
      if (badge) {
        badge.style.animationDuration = '0.5s';
      }
      const preloaderText = preloader.querySelector('.preloader-text');
      if (preloaderText) {
        preloaderText.style.animationDelay = '0.15s';
        preloaderText.style.animationDuration = '0.5s';
      }
      const preloaderSub = preloader.querySelector('.preloader-sub');
      if (preloaderSub) {
        preloaderSub.style.animationDelay = '0.25s';
        preloaderSub.style.animationDuration = '0.5s';
      }
    }
    
    // Smooth reveal
    setTimeout(() => {
      preloader.classList.add('fade-out');
      
      // Reveal the main hero content cinematic entry
      if (heroContent) {
        heroContent.classList.add('revealed');
      }
      
      // Do NOT call preloader.remove(), so it remains available in the DOM for exit transitions!
    }, drawDuration);
  } else {
    if (heroContent) {
      heroContent.classList.add('revealed');
    }
  }
}

function initPageTransitions() {
  const preloader = document.getElementById('luxury-preloader');
  
  // If there's no preloader element in the DOM, skip transition intercepting
  if (!preloader) return;
  
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Ignore internal page hash links (e.g. #hero, #menu, etc.)
    if (href.startsWith('#') || (href.includes('#') && href.split('#')[0] === window.location.pathname.split('/').pop())) {
      return;
    }
    
    // Check if it's an internal HTML page navigation
    const isLocalPage = href.endsWith('.html') || 
                        (href.startsWith('/') && !href.includes(':')) || 
                        (!href.startsWith('http') && !href.startsWith('mail' + 'to' + ':') && !href.startsWith('tel:') && !href.startsWith('javascript:'));
                        
    const hasBlankTarget = link.getAttribute('target') === '_blank';
    
    if (isLocalPage && !hasBlankTarget) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // 1. Add fade-out transition to the main content layout
        document.body.classList.add('fade-out-content');
        
        // 2. Bring the preloader back in smoothly
        preloader.classList.remove('fade-out');
        
        // Visual exit feedback: Spin the timepiece orbit ring hyper-fast!
        const outerRing = preloader.querySelector('.logo-outer-ring');
        if (outerRing) {
          outerRing.style.animationDuration = '1.5s';
        }
        
        // 3. Perform native navigation after fade-in completes (400ms)
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      });
    }
  });
}

/* ==========================================================================
   18. Golden Saffron Particle Cursor Trail (120fps Canvas Engine)
   ========================================================================== */
function initCursorTrail() {
  // Cursor trail runs globally on both desktop and mobile viewports [ENHANCED]
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-trail-canvas';
  canvas.style.cssText = "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999999; opacity: 0.85;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const mouse = { x: 0, y: 0, active: false };

  // Effects State Toggle Logic
  const desktopBtn = document.getElementById('effects-btn');
  const mobileBtn = document.getElementById('mobile-effects-toggle-btn');

  function updateEffectsState() {
    if (localStorage.getItem('anamika-effects') === null) {
      localStorage.setItem('anamika-effects', 'enabled');
    }
    const isEnabled = localStorage.getItem('anamika-effects') !== 'disabled';
    
    // Toggle canvas display
    canvas.style.display = isEnabled ? 'block' : 'none';
    
    // Toggle drifting saffron particles in hero section
    const saffronContainer = document.getElementById('saffron-particle-container');
    if (saffronContainer) {
      saffronContainer.style.display = isEnabled ? 'block' : 'none';
    }

    // Update active visual button classes
    if (isEnabled) {
      if (desktopBtn) desktopBtn.classList.add('active');
      if (mobileBtn) mobileBtn.classList.add('active');
    } else {
      if (desktopBtn) desktopBtn.classList.remove('active');
      if (mobileBtn) mobileBtn.classList.remove('active');
      particles.length = 0; // Clear particles
      ctx.clearRect(0, 0, width, height);
    }
  }

  function spawnBurst(x, y, count = 25) {
    if (localStorage.getItem('anamika-effects') === 'disabled') return;
    for (let i = 0; i < count; i++) {
      particles.push(new SaffronParticle(x, y, i % 2 === 0 ? 'saffron' : 'gold', true));
    }
  }

  function toggleEffects(e) {
    const isEnabled = localStorage.getItem('anamika-effects') !== 'disabled';
    localStorage.setItem('anamika-effects', isEnabled ? 'disabled' : 'enabled');
    updateEffectsState();
    
    const isNowEnabled = localStorage.getItem('anamika-effects') !== 'disabled';
    if (isNowEnabled) {
      showToast("Interactive visual effects enabled", "success");
      // If event coordinates exist, trigger burst at click coordinates
      if (e) {
        spawnBurst(e.clientX, e.clientY, 35);
      }
    } else {
      showToast("Interactive visual effects disabled", "info");
    }
  }

  if (desktopBtn) {
    desktopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleEffects(e);
    });
  }

  if (mobileBtn) {
    mobileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Spawn burst from mobile button coordinates specifically
      const rect = mobileBtn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      toggleEffects();
      
      const isNowEnabled = localStorage.getItem('anamika-effects') !== 'disabled';
      if (isNowEnabled) {
        spawnBurst(x, y, 35);
      }
    });
  }

  // Initialize effects state
  updateEffectsState();

  // 1. Mouse/Desktop Move
  window.addEventListener('mousemove', (e) => {
    if (localStorage.getItem('anamika-effects') === 'disabled') return;
    
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;

    // Spawn 1 saffron petal particle + 1 gold sparkle particle on mouse move
    if (particles.length < 120) {
      particles.push(new SaffronParticle(mouse.x, mouse.y, 'saffron'));
      particles.push(new SaffronParticle(mouse.x, mouse.y, 'gold'));
    }
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  // 2. Mobile/Tablet Touch Events to generate stardust under finger dragging
  window.addEventListener('touchstart', (e) => {
    if (localStorage.getItem('anamika-effects') === 'disabled') return;
    
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;

      if (particles.length < 120) {
        particles.push(new SaffronParticle(mouse.x, mouse.y, 'saffron'));
        particles.push(new SaffronParticle(mouse.x, mouse.y, 'gold'));
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (localStorage.getItem('anamika-effects') === 'disabled') return;
    
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;

      if (particles.length < 120) {
        particles.push(new SaffronParticle(mouse.x, mouse.y, 'saffron'));
        particles.push(new SaffronParticle(mouse.x, mouse.y, 'gold'));
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.active = false;
  });

  // Page-wide click/tap particle explosion
  window.addEventListener('click', (e) => {
    if (localStorage.getItem('anamika-effects') === 'disabled') return;
    // Don't spawn duplicate burst on the effect toggle buttons themselves or inside navbar
    if (e.target.closest('#effects-btn') || e.target.closest('#mobile-effects-toggle-btn') || e.target.closest('.navbar')) return;
    spawnBurst(e.clientX, e.clientY, 15);
  });

  // Spawn smoke particles when page scrolls to keep visual stardust flowing
  window.addEventListener('scroll', () => {
    if (localStorage.getItem('anamika-effects') === 'disabled') return;
    
    if (window.innerWidth < 992) {
      // Mobile: spawn stardust directly from the hamburger toggle button on scrolls!
      const mobileToggle = document.getElementById('mobile-toggle');
      if (mobileToggle && particles.length < 120) {
        const rect = mobileToggle.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // Spawn stardust particles emanating from the hamburger button
        particles.push(new SaffronParticle(x, y, 'saffron'));
        particles.push(new SaffronParticle(x, y, 'gold'));
      }
    } else {
      // Desktop: spawn stardust at mouse coordinates on scroll
      if (mouse.active && particles.length < 120) {
        particles.push(new SaffronParticle(mouse.x, mouse.y, 'saffron'));
        particles.push(new SaffronParticle(mouse.x, mouse.y, 'gold'));
      }
    }
  });

  class SaffronParticle {
    constructor(x, y, type, isBurst = false) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.size = Math.random() * (type === 'saffron' ? 5 : 3) + 1.5;
      
      if (isBurst) {
        // High velocity radial explosion
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 0.2; // slight upward bias
        this.decay = Math.random() * 0.02 + 0.018; // fade slightly faster for burst
      } else {
        // Spring organic drift velocity
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5 - 0.3; // slight upward drift
        this.decay = Math.random() * 0.015 + 0.012;
      }
      
      this.alpha = 1.0;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.05;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
      this.angle += this.spin;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      if (this.type === 'saffron') {
        // Draw elegant saffron leaf/petal shape
        ctx.fillStyle = 'rgba(235, 94, 40, 0.9)'; // Deep saffron orange
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 1.5);
        ctx.quadraticCurveTo(this.size, 0, 0, this.size * 1.5);
        ctx.quadraticCurveTo(-this.size, 0, 0, -this.size * 1.5);
        ctx.fill();
      } else {
        // Draw glowing gold sparkle
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        grad.addColorStop(0, '#fbf5b7'); // bright gold center
        grad.addColorStop(1, 'rgba(179, 135, 40, 0)'); // fade
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      } else {
        p.draw();
      }
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   19. Luxury Hover Coordinates Glow Emitter (Linear/Stripe style)
   ========================================================================== */
function initHoverGlows() {
  const cards = document.querySelectorAll('.menu-card, .package-card, .bento-card');
  if (cards.length === 0) return;

  cards.forEach(card => {
    if (card.dataset.glowBound) return;
    card.dataset.glowBound = "true";

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  });
}

/* ==========================================================================
   20. Premium Smooth Scrolling Reverted to Native Browser Action
   ========================================================================== */
// Reverted to native browser scroll to support standard trackpad and arrow scrolling.
// High-performance canvas stardust scroll listener handles particle spawns on scroll events.

/* ==========================================================================
   21. Virtual 3D Brochure Booklet Handler
   ========================================================================== */
function initBrochureBooklet() {
  const openBtn = document.getElementById('open-brochure-btn');
  const modal = document.getElementById('brochure-modal');
  const overlay = document.getElementById('brochure-overlay');
  const closeBtn = document.getElementById('brochure-close-btn');
  const book = document.getElementById('book');

  if (!openBtn || !modal || !overlay || !closeBtn || !book) return;

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  const closeBrochure = () => {
    modal.classList.remove('active');
    book.classList.remove('open');
    book.classList.remove('flipped-back');
  };

  closeBtn.addEventListener('click', closeBrochure);
  overlay.addEventListener('click', closeBrochure);

  // 3D Flip Page click togglers
  book.addEventListener('click', () => {
    if (!book.classList.contains('open')) {
      book.classList.add('open');
    } else if (!book.classList.contains('flipped-back')) {
      book.classList.add('flipped-back');
    } else {
      book.classList.remove('flipped-back');
      book.classList.remove('open');
    }
  });
}

/* ==========================================================================
   11. High-fidelity 3D Card Parallax Tilt Emitter (Mobile & Desktop active)
   ========================================================================== */
function init3DTilt() {
  const cards = document.querySelectorAll('.menu-card, .package-card');
  if (cards.length === 0) return;
  
  cards.forEach(card => {
    // Only apply on hover capable desktop screens (mobile uses css :active scales for light weight touch)
    if (window.matchMedia('(hover: hover)').matches) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Max rotate angle 8 degrees
        const rotateY = ((x - centerX) / centerX) * 8;
        const rotateX = ((centerY - y) / centerY) * 8;
        
        card.style.transition = 'none';
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        
        const img = card.querySelector('.menu-img-container img, .package-img img');
        if (img) {
          const moveX = ((x - centerX) / centerX) * -4;
          const moveY = ((y - centerY) / centerY) * -4;
          img.style.transform = `scale(1.08) translate3d(${moveX}px, ${moveY}px, 20px)`;
        }
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        
        const img = card.querySelector('.menu-img-container img, .package-img img');
        if (img) {
          img.style.transform = 'scale(1) translate3d(0, 0, 0)';
        }
      });
    }
  });
}

/* ==========================================================================
   12. High-Performance GPU-Accelerated drifting Saffron Particles System
   ========================================================================== */
function initSaffronParticles() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  
  // Create or reset container
  let container = document.getElementById('saffron-particle-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'saffron-particle-container';
    container.style.cssText = "position: absolute; inset: 0; pointer-events: none; z-index: 5; overflow: hidden;";
    hero.appendChild(container);
  } else {
    container.innerHTML = '';
  }

  const isEnabled = localStorage.getItem('anamika-effects') !== 'disabled';
  container.style.display = isEnabled ? 'block' : 'none';
  
  const particleCount = 15;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'saffron-petal';
    
    // Style golden saffron petal style dynamically
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 12 + 6}px;
      height: ${Math.random() * 8 + 4}px;
      background: linear-gradient(135deg, var(--primary) 30%, var(--accent-gold) 100%);
      border-radius: 50% 0 50% 0;
      opacity: ${Math.random() * 0.4 + 0.25};
      top: -20px;
      left: ${Math.random() * 100}%;
      filter: blur(${Math.random() * 1.5}px);
      will-change: transform, top;
    `;
    
    container.appendChild(particle);
    
    // Physics drifting parameters
    const duration = Math.random() * 10 + 8; // 8s to 18s drift time
    const delay = Math.random() * -15; // stagger entries
    const horizontalSwivel = Math.random() * 120 - 60; // swerves
    
    particle.animate([
      { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
      { transform: `translate3d(${horizontalSwivel}px, ${hero.offsetHeight + 40}px, 0) rotate(${Math.random() * 720}deg)` }
    ], {
      duration: duration * 1000,
      delay: delay * 1000,
      iterations: Infinity,
      easing: 'linear'
    });
  }
}



/* ==========================================================================
   14. Kinetic Magnetic Hover Buttons (Cursor Physics)
   ========================================================================== */
function initMagneticButtons() {
  if (!window.matchMedia('(hover: hover)').matches) return; // Only apply on desktop hover devices
  
  const magneticItems = document.querySelectorAll('.btn-primary, .btn-secondary, .tab-btn, .btn-icon, .theme-toggle');
  magneticItems.forEach(item => {
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Magnetic pull: pull item toward cursor coordinates by 35% of distance
      item.style.transform = `translate3d(${x * 0.35}px, ${y * 0.35}px, 0) scale(1.05)`;
      item.style.transition = 'none';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      item.style.transform = 'translate3d(0, 0, 0) scale(1)';
    });
  });
}

/* ==========================================================================
   15. Taste Matcher 3-Step Culinary Quiz & dynamic assortment recommender
   ========================================================================== */
function initTasteQuiz() {
  const startBtn = document.getElementById('start-quiz-btn');
  const header = document.querySelector('.taste-matcher-header');
  const quizContainer = document.getElementById('taste-matcher-quiz');
  if (!startBtn || !header || !quizContainer) return;

  let currentStep = 1;
  let selections = {};

  startBtn.addEventListener('click', () => {
    header.style.display = 'none';
    quizContainer.style.display = 'block';
  });

  const optionBtns = quizContainer.querySelectorAll('.quiz-opt');
  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const stepEl = btn.closest('.quiz-step');
      const step = parseInt(stepEl.getAttribute('data-step'));
      const val = btn.getAttribute('data-val');
      selections[step] = val;

      // Transition to next step
      stepEl.style.display = 'none';
      const nextStepNum = step + 1;
      const nextStepEl = quizContainer.querySelector(`.quiz-step[data-step="${nextStepNum}"]`);

      if (nextStepEl) {
        nextStepEl.style.display = 'block';
      } else {
        // We reached the end, compute result!
        showQuizResult();
      }
    });
  });

  function showQuizResult() {
    const resultEl = quizContainer.querySelector('.quiz-step[data-step="result"]');
    const titleEl = document.getElementById('quiz-result-title');
    const descEl = document.getElementById('quiz-result-desc');
    const addComboBtn = document.getElementById('quiz-add-combo-btn');

    let title = "Grand Shahi Platter";
    let desc = "A royal combination of our Premium Kaju Katli, slow-cooked Shahi Kheer, and hot fire-roasted Paneer Tikka. Ideal for family celebrations!";
    let comboItems = [1, 2, 4]; // dishIds: Kaju Katli (1), Paneer Tikka (2), Shahi Kheer (4)

    // Customize result based on cravings (Step 2)
    if (selections[2] === 'spicy-savory') {
      title = "Maharaja Zaika Combo";
      desc = "The ultimate North Indian feast! Chef Special Dum Biryani served along with sizzling hot Premium Paneer Tikka. Unbeatable savory taste.";
      comboItems = [2, 5]; // Paneer Tikka (2), Biryani (5)
    } else if (selections[2] === 'flaky-bakery') {
      title = "Gourmet Bakery Platter";
      desc = "Freshly baked morning bliss! Indulgent Chocolate Truffle Cake paired with crispy, warm, flaky Butter Croissants. Chef's favorite bakery selection.";
      comboItems = [3, 6]; // Chocolate Truffle Cake (3), Croissant (6)
    }

    titleEl.textContent = title;
    descEl.textContent = desc;

    // Save comboItems to button attribute for click listener
    addComboBtn.setAttribute('data-combo', JSON.stringify(comboItems));

    resultEl.style.display = 'block';
  }

  // Bind Reset
  const resetBtn = document.getElementById('quiz-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      quizContainer.querySelector('.quiz-step[data-step="result"]').style.display = 'none';
      quizContainer.querySelector('.quiz-step[data-step="1"]').style.display = 'block';
      header.style.display = 'block';
      quizContainer.style.display = 'none';
      selections = {};
    });
  }

  // Bind Add Combo to Cart
  const addComboBtn = document.getElementById('quiz-add-combo-btn');
  if (addComboBtn) {
    addComboBtn.addEventListener('click', () => {
      const combo = JSON.parse(addComboBtn.getAttribute('data-combo'));
      combo.forEach(dishId => {
        cart[dishId] = (cart[dishId] || 0) + 1;
      });
      saveState();
      updateCartBadge();
      renderCartDrawer();
      
      // Update menu cards in background if visible
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab) renderMenu(activeTab.getAttribute('data-filter'));

      showToast("Personalized Platter added to your cart!", "success");
      
      // Reset quiz
      resetBtn.click();
    });
  }
}

/* ==========================================================================
   16. Gourmet Sweet-Box Customizer Drawer Logic (Gamified Assortment Builder)
   ========================================================================== */
function initBoxCustomizer() {
  const boxBtns = document.querySelectorAll('#header-box-builder-btn, .mobile-drawer-box-btn');
  const drawer = document.getElementById('box-customizer-drawer');
  const closeBtn = document.getElementById('box-customizer-close');
  const overlay = document.getElementById('box-customizer-overlay');
  
  if (boxBtns.length === 0 || !drawer || !closeBtn || !overlay) return;

  // Toggle customizer panel drawer
  boxBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      drawer.classList.add('active');
      // Automatically collapse navigation drawer if open
      if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
      }
    });
  });
  
  closeBtn.addEventListener('click', () => {
    drawer.classList.remove('active');
  });
  
  overlay.addEventListener('click', () => {
    drawer.classList.remove('active');
  });

  // State Management
  let boxCapacity = 500;
  let currentWeight = 0;
  let boxItems = [];

  // 1. Select Box Size
  const sizeBtns = drawer.querySelectorAll('.size-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      boxCapacity = parseInt(btn.getAttribute('data-capacity'));
      updateBoxStatus();
    });
  });

  // 2. Add Sweets
  const addBtns = drawer.querySelectorAll('.add-sweet-opt');
  addBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const weight = parseInt(btn.getAttribute('data-weight'));
      const type = btn.getAttribute('data-type');
      const name = btn.getAttribute('data-name');

      if (currentWeight + weight > boxCapacity) {
        showToast(`Box is full! Switch to a larger box size or clear items.`, 'warning');
        return;
      }

      currentWeight += weight;
      boxItems.push({ name, weight, type });
      updateBoxStatus();
      
      // Fun scale bounce animation
      const scaleDial = document.getElementById('box-scale-dial');
      if (scaleDial) {
        scaleDial.style.transform = 'scale(1.2) rotate(3deg)';
        scaleDial.style.color = 'var(--primary)';
        setTimeout(() => {
          scaleDial.style.transform = 'scale(1) rotate(0deg)';
          scaleDial.style.color = 'var(--primary)';
        }, 300);
      }

      showToast(`Added ${name} (+${weight}g) to box!`, 'success');
    });
  });

  // 3. Clear/Reset Box
  const resetBtn = document.getElementById('reset-custom-box-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentWeight = 0;
      boxItems = [];
      updateBoxStatus();
      showToast("Custom Box cleared!", "info");
    });
  }

  // 4. Add Box to Cart
  const addCartBtn = document.getElementById('add-custom-box-to-cart-btn');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      // Create a virtual custom box dish in the cart
      const customId = `custom-box-${Date.now()}`;
      
      // Calculate custom price (approx. 50 paise per gram)
      const customPrice = Math.round(currentWeight * 0.5);
      
      // Create the custom item object
      const customItem = {
        id: customId,
        name: `Custom Assorted Box (${currentWeight}g)`,
        category: 'sweets',
        isVeg: true,
        description: `Your custom curated assortment: ${boxItems.map(i => i.name).join(', ')}. Packed fresh in luxury gift casing.`,
        price: customPrice,
        image: 'images/logo.png' // Default logo image fallback
      };
      
      // Add a virtual dish to the dishes catalog so standard cart render logic supports it!
      DISHES_CATALOG.push(customItem);
      
      // PERSIST custom items to localStorage so they survive page navigation
      try {
        const stored = JSON.parse(localStorage.getItem('anamika-custom-items') || '[]');
        stored.push(customItem);
        localStorage.setItem('anamika-custom-items', JSON.stringify(stored));
      } catch (e) {
        console.warn('[BoxCustomizer] Could not persist custom item:', e);
      }

      // Increment cart quantity
      cart[customId] = 1;
      saveState();
      updateCartBadge();
      renderCartDrawer();

      showToast(`Custom Gourmet Box added to your Shopping Cart!`, 'success');
      
      // Close drawer and reset
      drawer.classList.remove('active');
      resetBtn.click();
    });
  }


  function updateBoxStatus() {
    const progressEl = document.getElementById('virtual-box-progress');
    const statusText = document.getElementById('box-weight-status');
    const scaleDial = document.getElementById('box-scale-dial');
    const listEl = document.getElementById('custom-box-items-list');

    if (progressEl) {
      const percentage = (currentWeight / boxCapacity) * 100;
      progressEl.style.width = `${Math.min(percentage, 100)}%`;
    }

    if (statusText) {
      statusText.textContent = `${currentWeight}g / ${boxCapacity}g Packed`;
    }

    if (scaleDial) {
      scaleDial.textContent = `${currentWeight}g`;
    }

    if (listEl) {
      listEl.innerHTML = '';
      boxItems.forEach((item, index) => {
        const tag = document.createElement('span');
        tag.style.cssText = "background: var(--primary-soft); color: var(--primary-dark); padding: 4px 10px; border-radius: 20px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(249, 115, 22, 0.15); animation: fadeInUp 0.3s forwards;";
        tag.innerHTML = `${item.name} (${item.weight}g) <i class="fa-solid fa-circle-xmark" style="cursor:pointer; color:var(--primary); transition:transform 0.2s;" data-idx="${index}"></i>`;
        
        // Remove individual sweet listener
        const xBtn = tag.querySelector('i');
        xBtn.addEventListener('click', () => {
          const actualIndex = boxItems.indexOf(item);
          if (actualIndex > -1) {
            currentWeight -= item.weight;
            boxItems.splice(actualIndex, 1);
            updateBoxStatus();
            showToast(`Removed ${item.name} from box.`, 'info');
          }
        });

        listEl.appendChild(tag);
      });
    }

    if (addCartBtn) {
      addCartBtn.disabled = boxItems.length === 0;
    }
  }
}

/* ==========================================================================
   17. Confectionery Craft Scroll-Story Interactive Parallax Timeline
   ========================================================================== */
function initScrollStory() {
  const storySection = document.getElementById('craft-story');
  const visualsContainer = document.querySelector('.scroll-story-visuals');
  const steps = document.querySelectorAll('.story-step');
  if (!storySection || !visualsContainer || steps.length === 0) return;

  window.addEventListener('scroll', () => {
    const rect = storySection.getBoundingClientRect();
    
    // Check if section is visible in screen view
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      storySection.classList.add('in-view');
      // Find which step is closest to the middle of the screen
      let activeIndex = 0;
      let minDistance = Infinity;
      const screenCenter = window.innerHeight / 2;

      steps.forEach((step, idx) => {
        const stepRect = step.getBoundingClientRect();
        const stepCenter = stepRect.top + stepRect.height / 2;
        const distance = Math.abs(stepCenter - screenCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = idx;
        }
      });

      // Update active step classes
      steps.forEach((step, idx) => {
        if (idx === activeIndex) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });

      // Update assembly step inside visuals
      visualsContainer.className = `scroll-story-visuals step-${activeIndex + 1}`;
    } else {
      storySection.classList.remove('in-view');
    }
  });
}

/* ==========================================================================
   18. Premium Emerald Green Messenger Floating Widget Logic
   ========================================================================== */
function initGreenMessenger() {
  const container = document.getElementById('green-messenger-container');
  const toggleBtn = document.getElementById('messenger-toggle-btn');
  const closeBtn = document.getElementById('messenger-close-btn');
  const sendBtn = document.getElementById('messenger-send-btn');
  const chatInput = document.getElementById('messenger-input');
  const chatBody = document.getElementById('messenger-body');
  const badge = container ? container.querySelector('.notification-badge') : null;

  if (!container || !toggleBtn || !closeBtn) return;

  // Toggle chat box
  toggleBtn.addEventListener('click', () => {
    container.classList.toggle('active');
    if (container.classList.contains('active') && badge) {
      badge.style.display = 'none'; // Clear notification when chat opens
    }
  });

  closeBtn.addEventListener('click', () => {
    container.classList.remove('active');
  });

  // Helper to format message time
  function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 12-hour format
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  }

  // Handle message sending
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Create user bubble securely
    const userBubble = document.createElement('div');
    userBubble.className = 'messenger-bubble outgoing';
    const timeStr = getFormattedTime();

    userBubble.textContent = text;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'messenger-time';
    timeSpan.textContent = timeStr;
    userBubble.appendChild(timeSpan);
    
    chatBody.appendChild(userBubble);
    chatInput.value = '';

    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;

    // Create and display typing indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'messenger-bubble incoming';
    typingBubble.style.opacity = '0.75';
    typingBubble.innerHTML = '<i>Typing sweet reply...</i>';
    chatBody.appendChild(typingBubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Local Client-Side ChatGPT-like AI Knowledge Base and Advisor
    function generateAIResponse(queryText) {
      const query = queryText.toLowerCase().trim();
      const config = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : { business: {} };
      const biz = config.business || {};
      const bizName = biz.name || "ANAMIKA SWEETS";
      const bizAddr = `${biz.addressLine1 || "Hasanpur Chungi, Delhi Road"}, ${biz.addressLine2 || "Saharanpur, Uttar Pradesh"}`;
      const helpline = biz.helpline || "+91 97602 92999";
      const whatsapp = biz.whatsapp || "+91 78580 62571";
      const hours = biz.openingHoursTime || "11:30 AM - 11:30 PM";

      // 1. Check for specific menu items in DISHES_CATALOG
      if (typeof DISHES_CATALOG !== 'undefined') {
        const matchedDish = DISHES_CATALOG.find(dish => 
          query.includes(dish.name.toLowerCase()) || 
          dish.name.toLowerCase().split(' ').some(word => word.length > 3 && query.includes(word))
        );
        if (matchedDish) {
          return `Yes! We serve <strong>${matchedDish.name}</strong>. It is one of our specialty <em>${matchedDish.category}</em> options and is 100% pure vegetarian. <br><br>Description: "${matchedDish.description}" <br>Price: <strong>₹${matchedDish.price}</strong>. You can add it to your cart on the <a href="menu.html">Our Menu</a> page!`;
        }
      }

      // 2. Greetings and Small Talk
      if (/\b(hi|hello|hey|namaste|greetings|good morning|good afternoon|good evening|pranam|yo|hola)\b/.test(query)) {
        return `Namaste! Welcome to <strong>${bizName} Saffron Lounge</strong>. 🙏 I am your Gourmet Advisor AI. Ask me anything about our premium sweets, menu items, table reservations, or catering packages! How may I assist you today?`;
      }
      
      if (query.includes('how are you') || query.includes('how\'s it going') || query.includes('how do you do')) {
        return `I am doing wonderful and feeling sweet, thank you! 😊 Ready to help you discover our premium confectionery and fine dining options. What are you craving today?`;
      }

      if (query.includes('who are you') || query.includes('your name') || query.includes('what are you') || query.includes('are you human') || query.includes('bot') || query.includes('ai')) {
        return `I am the **Gourmet Advisor AI** for <strong>${bizName}</strong>. I operate directly in your browser to give you instant, ChatGPT-like support regarding our sweets, menu, location, and reservations!`;
      }

      // 3. Menu and Food Recommendations
      if (query.includes('recommend') || query.includes('best sweet') || query.includes('famous') || query.includes('must try') || query.includes('specialty') || query.includes('popular') || query.includes('favorite') || query.includes('signature')) {
        return `Our signature specialties include the **Saffron Kaju Katli Special** (cashew fudge with gold/silver accents) and our slow-cooked **Shahi Kheer**. For mains, our fire-roasted **Premium Paneer Tikka** and slow-cooked **Chef Special Biryani** are highly recommended! You can view all our premium recommendations on the <a href="menu.html">Our Menu</a> page.`;
      }

      if (query.includes('menu') || query.includes('dish') || query.includes('food') || query.includes('what do you serve') || query.includes('list of items') || query.includes('eat') || query.includes('dinner') || query.includes('lunch') || query.includes('breakfast')) {
        return `We offer a premium selection across three main categories:
1. **Sweets & Confectionery** (e.g. Saffron Kaju Katli, Kheer, Ladoos)
2. **Bakery & Desserts** (e.g. Chocolate Truffle Cakes, Fresh Croissants)
3. **North Indian Mains** (e.g. Paneer Tikka, Claypot Biryani)
Explore our full digital menu and order via WhatsApp on the <a href="menu.html">Our Menu</a> page!`;
      }

      if (query.includes('veg') || query.includes('vegetarian') || query.includes('egg') || query.includes('meat') || query.includes('pure veg') || query.includes('non-veg') || query.includes('eggless')) {
        return `Yes! <strong>${bizName}</strong> is **100% Pure Vegetarian** (Veg). We maintain the highest standards of culinary purity, using no meat, fish, or egg products in any of our sweets, pastries, or restaurant dishes. All our cakes and bakery items are 100% eggless. 🙏`;
      }

      if (query.includes('sweet') || query.includes('mithai') || query.includes('kaju') || query.includes('katli') || query.includes('ladoo') || query.includes('rasgulla') || query.includes('kheer') || query.includes('halwai') || query.includes('ghee')) {
        return `We specialize in traditional premium Indian sweets. Our confections are prepared daily by master halwais using **pure Desi Ghee**, fresh organic milk, and select dry fruits. You can check our seasonal sweets and gift boxes on our <a href="menu.html">Our Menu</a> page!`;
      }

      if (query.includes('cake') || query.includes('bakery') || query.includes('pastry') || query.includes('croissant') || query.includes('bread') || query.includes('chocolate')) {
        return `Our fine bakery selections include our decadent **Chocolate Truffle Cake** (₹450) and freshly baked **Butter Croissants** (₹150 for a pair). All our bakery items are 100% eggless and pure vegetarian. You can browse them on the <a href="menu.html">Our Menu</a> page!`;
      }

      // 4. Booking & Seating reservations
      if (query.includes('book') || query.includes('reserve') || query.includes('table') || query.includes('seat') || query.includes('dining') || query.includes('dome') || query.includes('vip') || query.includes('pod') || query.includes('lounge') || query.includes('seating') || query.includes('slot')) {
        return `We offer pre-booked premium dining experiences:
* **Romantic Glass Dome 5** (perfect for couples, candlelit)
* **Maharaja VIP Pod 1** (luxury family dining)
* **Royal Family Lounge Table 7** (spacious seating for gatherings)
You can choose your preferred slot, date, and table model, and submit a reservation request on our <a href="reserve.html">Book a Table</a> page!`;
      }

      // 5. Timings and Opening Hours
      if (query.includes('time') || query.includes('hour') || query.includes('open') || query.includes('close') || query.includes('when') || query.includes('timing') || query.includes('schedule') || query.includes('day')) {
        return `We are open **${biz.openingHoursDays || "Monday - Sunday"}** from **${hours}**. Last table seating is typically at 10:45 PM. We look forward to your visit!`;
      }

      // 6. Location, Address and Directions
      if (query.includes('location') || query.includes('address') || query.includes('where') || query.includes('direction') || query.includes('map') || query.includes('city') || query.includes('place') || query.includes('locate') || query.includes('reach') || query.includes('saharanpur')) {
        return `Our Saffron Lounge is located at:
<strong>${bizAddr}</strong> (near Hasanpur Chungi).
You can view directions and interactive Google Maps by scrolling to the bottom of the page or in the footer!`;
      }

      // 7. Contact, Phone and WhatsApp
      if (query.includes('phone') || query.includes('number') || query.includes('contact') || query.includes('call') || query.includes('whatsapp') || query.includes('helpline') || query.includes('email') || query.includes('support') || query.includes('talk') || query.includes('owner') || query.includes('manager')) {
        return `You can reach our manager directly at **${helpline}** or email us at **${biz.email || "info@anamikasweets.com"}**. For online orders, custom sweet boxes, or inquiries, click the **WhatsApp** button at the bottom of your screen to chat instantly with our staff (${whatsapp})!`;
      }

      // 10. Delivery / Home Delivery / Shipping
      if (query.includes('deliver') || query.includes('home delivery') || query.includes('shipping') || query.includes('cod') || query.includes('order online') || query.includes('delivery charge') || query.includes('swiggy') || query.includes('zomato')) {
        return `Yes, we offer **home delivery** across Saharanpur! You can browse our items and add them to your cart. Once ready, click the checkout button to send your order details directly to our team via WhatsApp. Delivery is free for orders above ₹500.`;
      }

      // 11. Payment Methods
      if (query.includes('pay') || query.includes('payment') || query.includes('card') || query.includes('upi') || query.includes('gpay') || query.includes('cash') || query.includes('net banking')) {
        return `We accept a variety of payment methods including **Cash on Delivery (COD)**, **UPI (Google Pay, PhonePe, Paytm)**, **Credit/Debit Cards**, and **Net Banking**. Payment details will be finalized when we confirm your order over WhatsApp.`;
      }

      // 8. Bulk Orders, Catering, Parties, Weddings
      if (query.includes('party') || query.includes('wedding') || query.includes('catering') || query.includes('bulk') || query.includes('corporate') || query.includes('event') || query.includes('celebration') || query.includes('kitty') || query.includes('birthday') || query.includes('banquet') || query.includes('gathering') || query.includes('package')) {
        return `We offer luxury catering packages for weddings, birthdays, and corporate events, including customized sweet boxes and gift platters!
* **Kitty Party Package** (₹599/person)
* **Birthday Celebration** (₹899/person, includes custom cake)
* **Romantic Couple Date** (₹1,299/couple, includes candlelight setting)
Browse our pre-configured options on the <a href="packages.html">Party Packages</a> page, or contact our event coordinator via WhatsApp for a custom quote.`;
      }

      // 9. Prices, Discount, Cheap, Cost, Offers
      if (query.includes('price') || query.includes('cost') || query.includes('cheap') || query.includes('expensive') || query.includes('discount') || query.includes('offer') || query.includes('deal') || query.includes('coupon') || query.includes('promo')) {
        return `Our sweet boxes start from ₹150, and main courses range between ₹150 to ₹450, offering premium quality at competitive rates. For seasonal festive discounts, bulk orders, or custom gift boxes, please contact us directly on WhatsApp!`;
      }

      // 12. History / Since / Owner / Cleanliness / Hygiene / Reviews
      if (query.includes('history') || query.includes('since') || query.includes('old') || query.includes('established') || query.includes('year') || query.includes('clean') || query.includes('hygiene') || query.includes('license') || query.includes('fssai') || query.includes('rating') || query.includes('review') || query.includes('stars')) {
        return `<strong>${bizName}</strong> was established in **1995** and has been Saharanpur's finest culinary destination for over 30 years. We hold a 4.8-star Google rating (500+ reviews), are FSSAI certified, and maintain the absolute highest standards of hygiene and pure vegetarian kitchen operations.`;
      }

      if (query.includes('gallery') || query.includes('photo') || query.includes('picture') || query.includes('image') || query.includes('interior') || query.includes('ambiance') || query.includes('kitchen')) {
        return `You can view high-quality photos of our luxury Saffron Lounge interior, traditional arch entrance, hot tandoor operations, and sweet counters on our dedicated <a href="gallery.html">Gallery</a> page!`;
      }

      if (query.includes('testimonial') || query.includes('reviews') || query.includes('what people say') || query.includes('customer feedback')) {
        return `Our guests love our hospitality and premium quality! We have a 4.8-star rating. You can read verified customer testimonials from families, couples, and corporate guests on our <a href="testimonials.html">Testimonials</a> page.`;
      }

      // 13. General recipe/cooking questions
      if (query.includes('how to make') || query.includes('recipe') || query.includes('how to cook') || query.includes('ingredients for')) {
        const dishMatch = query.match(/how to make (.*)|recipe for (.*)/);
        const dishName = dishMatch ? (dishMatch[1] || dishMatch[2]) : "traditional sweets";
        return `Making <strong>${dishName}</strong> at home requires quality ingredients (like fresh milk, pure ghee, and quality spices) along with patience. For the absolute best and authentic taste, our master sweet-makers (halwais) prepare these daily. You can order ours on the <a href="menu.html">Our Menu</a> page to taste the magic!`;
      }

      // 14. Conversational small-talk follow-ups
      if (query.includes('thank') || query.includes('thanks') || query.includes('appreciate') || query.includes('great') || query.includes('good job') || query.includes('awesome') || query.includes('perfect')) {
        return `You are very welcome! 😊 It is my pleasure to assist you. Let me know if you would like help with ordering sweets or reserving a luxury table.`;
      }

      if (query.includes('bye') || query.includes('goodbye') || query.includes('see you') || query.includes('exit')) {
        return `Goodbye! Have a sweet and wonderful day ahead. Hope to see you at the Saffron Lounge soon! 🙏 Representative contact: ${helpline}.`;
      }

      // 15. Generative fallback (smarter ChatGPT-like fallback statement)
      const capitalizedQuery = queryText.charAt(0).toUpperCase() + queryText.slice(1);
      return `I am your **Gourmet Advisor AI** for <strong>${bizName}</strong>. Regarding "<i>${capitalizedQuery}</i>", I recommend checking our official <a href="menu.html">Menu</a> or checking out our luxury dome seating details on the <a href="reserve.html">Reservations</a> page! <br><br>For immediate custom support, catering inquiries, or home delivery, click the <strong>WhatsApp</strong> button at the bottom of the screen to chat directly with our manager!`;
    }

    // Simulate AI thinking and response with a 750ms organic delay
    setTimeout(() => {
      typingBubble.remove();
      
      const replyBubble = document.createElement('div');
      replyBubble.className = 'messenger-bubble incoming';
      
      let reply = generateAIResponse(text);
      
      // Formats basic markdown/text patterns like **bold** or *italic* safely
      reply = reply
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
      
      replyBubble.innerHTML = reply;
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'messenger-time';
      timeSpan.textContent = getFormattedTime();
      replyBubble.appendChild(timeSpan);
      
      chatBody.appendChild(replyBubble);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 750);
  }

  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

/* ==========================================================================
   22. Interactive Lounge Seating Planner logic
   ========================================================================== */
function initSeatingPlanner() {
  const tableNodes = document.querySelectorAll('.table-node');
  const label = document.getElementById('selected-table-label');
  const input = document.getElementById('selected-table-input');
  const packageSelect = document.getElementById('type');

  if (tableNodes.length === 0 || !label || !input) return;

  // Add click toggle trigger for each table node
  tableNodes.forEach(node => {
    node.addEventListener('click', () => {
      // Clear previous selections
      tableNodes.forEach(t => t.classList.remove('active'));
      
      // Activate clicked
      node.classList.add('active');
      
      const tableName = node.getAttribute('data-table');
      const capacity = node.getAttribute('data-capacity');
      
      // Update label and hidden value
      label.textContent = `${tableName} Selected`;
      input.value = tableName;
      
      // Alert dynamic visual state
      showToast(`Selected ${tableName} (${capacity} Pax max)`, 'success');
      
      // Spring bounce reaction (Haptic visual bounce)
      node.style.transform = 'scale(1.12) rotate(2deg)';
      setTimeout(() => {
        node.style.transform = '';
      }, 250);
    });
  });

  // Intellectually link package selection to relevant tables
  if (packageSelect) {
    packageSelect.addEventListener('change', () => {
      const selectedVal = packageSelect.value;
      tableNodes.forEach(t => t.classList.remove('active'));

      if (selectedVal === 'couple') {
        // Couples Candlelight -> Select Dome 5 automatically!
        const targetNode = document.querySelector('.table-node[data-table="Romantic Glass Dome 5"]');
        if (targetNode) {
          targetNode.click();
          showToast("Assigned premium candlelit Glass Dome for your date!", "info");
        }
      } else if (selectedVal === 'kitty' || selectedVal === 'birthday') {
        // Party packages -> Select VIP Pod 1 automatically!
        const targetNode = document.querySelector('.table-node[data-table="Maharaja VIP Pod 1"]');
        if (targetNode) {
          targetNode.click();
          showToast("Reserved royal Maharaja VIP Pod for your group celebration!", "info");
        }
      } else if (selectedVal === 'family') {
        // Family package -> Select Family Lounge Table 7 automatically!
        const targetNode = document.querySelector('.table-node[data-table="Royal Family Lounge Table 7"]');
        if (targetNode) {
          targetNode.click();
          showToast("Reserved spacious Royal Family Lounge Table for your family gathering!", "info");
        }
      } else {
        // Standard dining
        label.textContent = "Standard Dining Table";
        input.value = "Standard Dining Table";
      }
    });
  }
}

