/* 
   ANAMIKA SWEETS - Centralized Template Configuration (config.js)
   Edit this single file to customize branding, SEO, trust badges, contacts, and hours.
*/

const SITE_CONFIG = {
  business: {
    name: "ANAMIKA SWEETS",
    tagline: "SAFFRON LOUNGE",
    logo: "images/logo.png",
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
    googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3444.0201174984534!2d77.52554767626947!3d29.950153474971268!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390eeb6ad8043681%3A0xc304be359873d1f1!2sDelhi%20Rd%2C%20Hasanpur%20Chungi%2C%20Saharanpur%2C%20Uttar%20Pradesh%20247001!5e0!3m2!1sen!2sin!4v1716982929999!5m2!1sen!2sin",
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
    title: "ANAMIKA SWEETS — Premium Bakery & Restaurant",
    description: "ANAMIKA SWEETS - Saharanpur's finest destination for premium sweets, fine bakery items, North Indian cuisine, and celebratory party packages.",
    keywords: "Anamika Sweets, Saharanpur sweets shop, local bakery, party packages, fine dining reservation",
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
