# Customization Guide — Anamika Sweets Template

This template is structured to allow quick rebranding and setup. By customizing the central files, you can deploy a complete local business website in minutes.

---

## 1. Central Configuration (`config.js`)

Open [config.js](file:///d:/c/template/10000/config.js) to configure the primary business parameters. The configuration object contains:

### Business Info
*   `name`: Name of the brand (e.g. `ANAMIKA SWEETS`).
*   `tagline`: Main subheader text.
*   `logo`: Path to the logo image.
*   `helpline`: Direct phone call number.
*   `whatsapp`: Target phone number for WhatsApp chats (include country prefix without `+` or spaces for API compatibility, e.g., `+917858062571`).
*   `email`: Support and contact inbox address.
*   `googleMapsEmbed`: Embed URL for maps section.

### Brand Custom Colors
To change color schemes across the whole site, edit the `branding` config block:
```javascript
branding: {
  primaryColor: "#f97316", // Main brand color (hex)
  primaryHover: "#ea580c", // Hover color
  primarySoft: "rgba(249, 115, 22, 0.1)", // Translucent theme color
  accentGold: "#b38728"    // Accent highlight color
}
```

### Search Engine Optimization (SEO)
Update the metadata tags:
```javascript
seo: {
  title: "...",
  description: "...",
  keywords: "..."
}
```

### Trust Badges & FSSAI
Configure the trust markers:
```javascript
trust: {
  fssaiLicense: "FSSAI License: XXXXXXXXXXXXXX",
  badges: [
    { icon: "fa-certificate", text: "FSSAI Certified" },
    { icon: "fa-leaf", text: "100% Pure Veg" },
    ...
  ]
}
```

---

## 2. Dynamic Product & Menu Customization (`data.js`)

Open [data.js](file:///d:/c/template/10000/data.js) to edit the product listings. The JavaScript array holds items that populate the interactive menus, cart pages, and likes:

```javascript
const DISHES_DATA = [
  {
    id: "kaju-katli",
    name: "Kaju Katli Special",
    category: "sweets",
    price: 380,
    unit: "500g",
    image: "images/dish_kaju_katli.png",
    description: "Classic premium cashew fudge slow-cooked in pure Desi Ghee.",
    veg: true,
    bestseller: true
  },
  ...
];
```

Modify the elements in this array to update products on the menus dynamically.

---

## 3. Language & Localization Translation (`translations.js`)

Open [translations.js](file:///d:/c/template/10000/translations.js) to edit dictionary items. The template supports Hindi (`hi`) and English (`en`). If you add new buttons or static page text, register their Hindi equivalents inside the `DICTIONARY` object.

---

## 4. Logo & Image Assets

To change brand images:
1.  Save your new image assets in the `images/` directory.
2.  Update the filenames in `config.js` or `data.js` to reference the new paths.
3.  Ensure you provide both width/height parameters or standard aspect ratios to maintain Core Web Vitals stability.
