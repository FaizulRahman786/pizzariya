/*
   Pizzariya Town - Lightweight Hindi/English Translation System (translations.js)
   Enables seamless language switching for key labels, titles, CTA buttons, and form inputs.
*/

const TRANSLATIONS = {
  en: {
    // Navbar / Footer Quick Links
    home: "Home",
    about: "About Us",
    menu: "Our Menu",
    packages: "Party Packages",
    testimonials: "Testimonials",
    gallery: "Gallery",
    likes: "Liked Items",
    reserve: "Reserve Table",
    contact: "Contact Us",
    
    // Banner / Main Hero Buttons
    exploreMenu: "Explore Menu",
    quickOrder: "Quick Order",
    callNow: "Call Now",
    whatsapp: "WhatsApp",
    directions: "Directions",

    // Section Titles
    standardsTitle: "Our Premium Standards",
    tasteTitle: "Our Culinary Masterpieces",
    craftTitle: "The Confectionery Craft",
    bookingTitle: "Reserve Your Table",

    // Buttons
    addToCart: "Add to Cart",
    inCart: "In Cart",
    placeOrder: "Place Order",
    submitRes: "Submit Reservation Request"
  },
  hi: {
    // Navbar / Footer Quick Links
    home: "मुख्य पृष्ठ",
    about: "हमारे बारे में",
    menu: "हमारा मेनू",
    packages: "पार्टी पैकेजेस",
    testimonials: "प्रशंसापत्र",
    gallery: "गैलरी",
    likes: "पसंदीदा आइटम",
    reserve: "टेबल बुक करें",
    contact: "संपर्क करें",

    // Banner / Main Hero Buttons
    exploreMenu: "मेनू देखें",
    quickOrder: "तुरंत आर्डर",
    callNow: "अभी कॉल करें",
    whatsapp: "व्हाट्सएप",
    directions: "दिशा निर्देश",

    // Section Titles
    standardsTitle: "हमारे प्रीमियम मानक",
    tasteTitle: "हमारे शानदार व्यंजन",
    craftTitle: "हलवाई की कारीगरी",
    bookingTitle: "अपनी टेबल रिजर्व करें",

    // Buttons
    addToCart: "कार्ट में जोड़ें",
    inCart: "कार्ट में है",
    placeOrder: "ऑर्डर सबमिट करें",
    submitRes: "आरक्षण सबमिट करें"
  }
};

let currentLanguage = localStorage.getItem('anamika-language') || 'en';

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLanguage = lang;
  localStorage.setItem('anamika-language', lang);

  // Apply translations to data-translate elements
  const translateEls = document.querySelectorAll('[data-translate]');
  translateEls.forEach(el => {
    const key = el.getAttribute('data-translate');
    if (TRANSLATIONS[lang][key]) {
      // If it's an input or textarea placeholder
      if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
        el.placeholder = TRANSLATIONS[lang][key];
      } else {
        // Retain any inner HTML tags (like icons) if they exist, only update text nodes
        const icon = el.querySelector('i');
        if (icon) {
          el.innerHTML = '';
          el.appendChild(icon);
          el.appendChild(document.createTextNode(' ' + TRANSLATIONS[lang][key]));
        } else {
          el.textContent = TRANSLATIONS[lang][key];
        }
      }
    }
  });

  // Dispatch event so layout.js or page scripts can react if needed
  window.dispatchEvent(new CustomEvent('LanguageChanged', { detail: lang }));
}

// Auto translate elements on load
window.addEventListener('LayoutComponentsLoaded', () => {
  setLanguage(currentLanguage);

  // Inject language switcher into ALL matching action containers (desktop nav-actions + mobile drawer)
  const langContainers = document.querySelectorAll('.mobile-drawer-only-actions, .nav-actions');
  langContainers.forEach((langContainer, idx) => {
    // Use unique ID for each instance to avoid querySelector collision
    const btnId = idx === 0 ? 'lang-switch-btn' : `lang-switch-btn-${idx}`;
    if (document.getElementById(btnId)) return; // Already injected

    const switcher = document.createElement('button');
    switcher.id = btnId;
    switcher.className = 'btn-icon lang-switch-btn';
    switcher.textContent = currentLanguage === 'en' ? 'हिं' : 'EN';
    switcher.setAttribute('aria-label', 'Switch Language');
    switcher.setAttribute('title', currentLanguage === 'en' ? 'Switch to Hindi' : 'Switch to English');

    switcher.addEventListener('click', () => {
      const nextLang = currentLanguage === 'en' ? 'hi' : 'en';
      setLanguage(nextLang);
      // Update all switcher buttons together
      document.querySelectorAll('.lang-switch-btn').forEach(btn => {
        btn.textContent = nextLang === 'en' ? 'हिं' : 'EN';
        btn.setAttribute('title', nextLang === 'en' ? 'Switch to Hindi' : 'Switch to English');
      });
    });

    langContainer.insertBefore(switcher, langContainer.firstChild);
  });
});
