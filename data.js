/* 
   Pizzariya Town - Centralized Data & Configuration
   This file consolidates all restaurant settings, menu items, gallery details, and pricing structures
   to make customization simple and code maintainable.
*/

// NOTE: All business info (name, helpline, email, address) is managed in config.js → SITE_CONFIG.
// RESTAURANT_INFO is kept as a legacy convenience alias for backward compatibility with any custom templates.
// Template buyers should ONLY edit config.js to customize their business information.
const RESTAURANT_INFO = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.business : {
  name: "Pizzariya Town",
  tagline: "MIRZAPUR NOTTA",
  helpline: "7858062571",
  whatsapp: "7858062571",
  whatsappText: "Namaste! I would like to order from Pizzariya Town.",
  email: "info@pizzariyatown.com",
  supportEmail: "support@pizzariyatown.com",
  addressLine1: "Mirzapur Notta",
  addressLine2: "",
  openingHoursDays: "Monday - Sunday",
  openingHoursTime: "10:00 AM - 10:00 PM",
  social: {
    facebook: "https://www.facebook.com/pizzariyatown",
    instagram: "https://www.instagram.com/pizzariyatown",
    twitter: "https://x.com/pizzariyatown",
    youtube: "https://www.youtube.com/@pizzariyatown"
  }
};

const DISHES_CATALOG = [
  {
    id: 1,
    name: "Kaju Katli Special",
    category: "sweets",
    isVeg: true,
    description: "Luxurious cashew fudge crafted with premium hand-picked nuts and delicate silver foil.",
    price: 320,
    image: "images/dish_kaju_katli.png"
  },
  {
    id: 2,
    name: "Premium Paneer Tikka",
    category: "mains",
    isVeg: true,
    description: "Juicy cottage cheese blocks marinated in traditional spiced yogurt, fire-roasted with bell peppers.",
    price: 250,
    image: "images/dish_paneer_tikka.png"
  },
  {
    id: 3,
    name: "Chocolate Truffle Cake",
    category: "bakery",
    isVeg: true,
    description: "Indulgent, moist layers of premium dark chocolate ganache, decorated with soft glaze.",
    price: 450,
    image: "images/dish_chocolate_cake.png"
  },
  {
    id: 4,
    name: "Shahi Kheer Thali",
    category: "sweets",
    isVeg: true,
    description: "Slow-cooked aromatic basmati rice pudding infused with saffron, cardamom, and sliced almonds.",
    price: 180,
    image: "images/dish_shahi_kheer.png"
  },
  {
    id: 5,
    name: "Chef Special Biryani",
    category: "mains",
    isVeg: true,
    description: "Layers of premium long-grain basmati rice, slow-cooked in sealed clay pots with saffron and herbs.",
    price: 320,
    image: "images/dish_biryani.png"
  },
  {
    id: 6,
    name: "Butter Croissants (Pair)",
    category: "bakery",
    isVeg: true,
    description: "Golden, flaky, and layered French-style pastries baked fresh using premium local dairy.",
    price: 150,
    image: "images/dish_croissant.png"
  }
];

const GALLERY_CATALOG = {
  "gal-1": { 
    title: "Pizzariya Town Dining Hall", 
    badge: "Ambiance", 
    category: "ambiance",
    image: "images/gallery_interior.png",
    description: "Luxury fine dining hall adorned with warm lighting and plush velvet seating."
  },
  "gal-2": { 
    title: "Traditional Arch Entrance", 
    badge: "Ambiance", 
    category: "ambiance",
    image: "images/hero_slider_1.png",
    description: "A royal welcoming corridor showcasing traditional Indian architecture."
  },
  "gal-3": { 
    title: "Tandoor Hot Operations", 
    badge: "Culinary", 
    category: "culinary",
    image: "images/gallery_kitchen.png",
    description: "Our skilled chefs preparing flame-baked naan and roasted kebabs."
  },
  "gal-4": { 
    title: "Hyderabadi Dum Biryani", 
    badge: "Culinary", 
    category: "culinary",
    image: "images/dish_biryani.png",
    description: "Layered aromatic basmati rice cooked on slow dum heat with saffron threads."
  },
  "gal-5": { 
    title: "Sizzling Paneer Tikka", 
    badge: "Culinary", 
    category: "culinary",
    image: "images/dish_paneer_tikka.png",
    description: "Fresh cottage cheese chunks marinated in spiced yogurt and chargrilled."
  },
  "gal-6": { 
    title: "Sweets Display Counter", 
    badge: "Sweets & Bakery", 
    category: "sweets",
    image: "images/gallery_sweets.png",
    description: "A colorful array of premium handmade sweets under golden lighting."
  },
  "gal-7": { 
    title: "Silver Kaju Katli", 
    badge: "Sweets & Bakery", 
    category: "sweets",
    image: "images/dish_kaju_katli.png",
    description: "Melt-in-the-mouth cashew fudge diamond sweets garnished with silver vark."
  },
  "gal-8": { 
    title: "Chocolate Fudge Cake", 
    badge: "Sweets & Bakery", 
    category: "sweets",
    image: "images/dish_chocolate_cake.png",
    description: "Decadent triple-layered chocolate cake decorated with smooth dark ganache."
  },
  "gal-9": { 
    title: "Golden Butter Croissants", 
    badge: "Sweets & Bakery", 
    category: "sweets",
    image: "images/dish_croissant.png",
    description: "Flaky, golden-baked French pastries prepared fresh daily by our bakers."
  },
  "gal-10": { 
    title: "Birthday Celebration Hall", 
    badge: "Celebrations", 
    category: "celebrations",
    image: "images/package_birthday.png",
    description: "A beautifully decorated themed banquet space ready for milestone celebrations."
  },
  "gal-11": { 
    title: "Candlelight Dinner Setup", 
    badge: "Celebrations", 
    category: "celebrations",
    image: "images/package_couple.png",
    description: "Intimate romantic table setting adorned with fresh rose petals and soft candle glow."
  },
  "gal-12": { 
    title: "Grand Family Banquet", 
    badge: "Celebrations", 
    category: "celebrations",
    image: "images/package_family.png",
    description: "Spacious seating configurations for multi-generational celebratory feasts."
  },
  "gal-13": { 
    title: "Royal Kitty Party", 
    badge: "Celebrations", 
    category: "celebrations",
    image: "images/package_kitty.png",
    description: "Vibrant custom themes designed for standard social high-tea parties."
  }
};

const PARTY_PACKAGES = [
  {
    id: "kitty",
    name: "Kitty Party Package",
    priceText: "₹599 / Person",
    caption: "Ladies Special",
    description: "An elegant set menu combining light savory items, fine drinks, and custom desserts for ladies groups.",
    perks: [
      "Elegant Table Seating Layout",
      "2 Starters + 2 Main Courses + Desserts",
      "Welcome Drinks on Arrival"
    ],
    image: "images/package_kitty.png"
  },
  {
    id: "birthday",
    name: "Birthday Celebration",
    priceText: "₹899 / Person",
    caption: "Perfect Milestones",
    description: "Create memories with thematic decoration, sound support, comprehensive buffet services, and custom cakes.",
    perks: [
      "Custom Birthday Cake & Decoration",
      "3 Starters + 3 Main Courses + Desserts",
      "Dedicated Service Host"
    ],
    image: "images/package_birthday.png"
  },
  {
    id: "couple",
    name: "Romantic Couple Date",
    priceText: "₹1,299 / Couple",
    caption: "Special Moments",
    description: "A quiet, private glassmorphic setup under soft candlelights with premium food pairings and customized setups.",
    perks: [
      "Private Candlelight Setting",
      "4-Course Fine Culinary Tasting Menu",
      "Special Personalized Dessert Chef-Creation"
    ],
    image: "images/package_couple.png"
  }
];
