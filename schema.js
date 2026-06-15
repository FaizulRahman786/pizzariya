/*
   ANAMIKA SWEETS - Structured Schema.org JSON-LD Generator (schema.js)
   Generates local SEO restaurant metadata schema matching Google's specifications.
   All address fields are pulled from SITE_CONFIG (config.js) — no hardcoded city/state/pin.
*/

window.addEventListener('LayoutComponentsLoaded', () => {
  const config = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {
    business: {
      name: "ANAMIKA SWEETS",
      logo: "images/logo.png",
      helpline: "+91 97602 92999",
      email: "info@anamikasweets.com",
      addressLine1: "Hasanpur Chungi, Delhi Road",
      addressLine2: "Saharanpur, Uttar Pradesh, 247001",
      googleMapsLink: "https://maps.google.com"
    }
  };

  const business = config.business;

  // Parse addressLine2 "City, State, PIN" → separate fields
  const addrParts = (business.addressLine2 || '').split(',').map(s => s.trim());
  const addrCity    = addrParts[0] || '';
  const addrState   = addrParts[1] || '';
  const addrPin     = addrParts[2] || '';
  const addrCountry = business.addressCountry || 'IN';

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": business.name,
    "image": window.location.origin + "/" + (business.logo || "images/logo.png"),
    "@id": window.location.href + "#restaurant",
    "url": window.location.origin,
    "telephone": business.helpline,
    "email": business.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": business.addressLine1 || '',
      "addressLocality": addrCity,
      "addressRegion": addrState,
      "postalCode": addrPin,
      "addressCountry": addrCountry
    },
    "geo": (business.geo && business.geo.latitude) ? {
      "@type": "GeoCoordinates",
      "latitude": business.geo.latitude,
      "longitude": business.geo.longitude
    } : undefined,
    "hasMap": business.googleMapsLink,
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday", "Tuesday", "Wednesday", "Thursday",
          "Friday", "Saturday", "Sunday"
        ],
        "opens": business.openingHoursOpens || "11:30",
        "closes": business.openingHoursCloses || "23:30"
      }
    ],
    "servesCuisine": (config.seo && config.seo.cuisine) ? config.seo.cuisine : [
      "Indian", "Sweets", "Bakery", "Vegetarian"
    ],
    "priceRange": (config.seo && config.seo.priceRange) ? config.seo.priceRange : "₹₹"
  };

  // Remove undefined geo if not configured
  if (!schemaData.geo) delete schemaData.geo;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schemaData);
  document.head.appendChild(script);
});
