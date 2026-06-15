/* 
   Pizzariya Town - Centralized Template Configuration (config.js)
   Edit this single file to customize branding, SEO, trust badges, contacts, and hours.
*/

const SITE_CONFIG = {
  business: {
    name: "Pizzariya Town",
    tagline: "MIRZAPUR NOTTA",
    logo: "images/logo.png",
    helpline: "7858062571",
    whatsapp: "7858062571",
    whatsappText: "Namaste! I would like to order from Pizzariya Town.",
    email: "info@pizzariyatown.com",
    supportEmail: "support@pizzariyatown.com",
    addressLine1: "Mirzapur Notta",
    addressLine2: "",
    openingHoursDays: "Monday - Sunday",
    openingHoursTime: "11:30 AM - 11:30 PM",
    social: {
      facebook: "https://www.facebook.com/pizzariyatown",
      instagram: "https://www.instagram.com/pizzariyatown",
      twitter: "https://x.com/pizzariyatown",
      youtube: "https://www.youtube.com/@pizzariyatown"
    },
    googleMapsEmbed: "https://www.google.com/maps?q=Mirzapur%20Notta&output=embed",
    googleMapsLink: "https://maps.google.com"
  },
  branding: {
    primaryColor: "#f97316", // Main primary brand color (e.g. orange)
    primaryHover: "#ea580c",
    primarySoft: "rgba(249, 115, 22, 0.1)",
    accentGold: "#b38728",
    fontMain: "'Outfit', sans-serif"
  },
  seo: {
    title: "Pizzariya Town — Premium Bakery & Restaurant",
    description: "Pizzariya Town - Mirzapur Notta's finest destination for premium sweets, fine bakery items, North Indian cuisine, and celebratory party packages.",
    keywords: "Pizzariya Town, Mirzapur Notta sweets shop, local bakery, party packages, fine dining reservation",
    ogImage: "green_messenger_preview.png"
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
