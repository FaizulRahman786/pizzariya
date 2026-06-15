# Anamika Sweets Audit Fix Report

All line numbers below refer to the corrected files in `10000/`.

## 1A Encoding / Mojibake

Changed all top-level HTML pages: `about.html`, `cart.html`, `gallery.html`, `index.html`, `likes.html`, `menu.html`, `packages.html`, `profile.html`, `reserve.html`, `testimonials.html`.

Line ranges:

| File | Corrected block |
| --- | --- |
| `index.html` | head/title `14-31`, prices/reviewers `324-428` |
| `cart.html` | head/title `13-28`, rupee defaults `831`, `894`, `899`, `909` |
| `about.html` | title `28` |
| `gallery.html` | title `28`, lightbox caption JS `406` |
| `likes.html` | title/meta `13-29` |
| `menu.html` | title `28`, brochure prices `256`, `261`, `266`, `271` |
| `packages.html` | title `28`, price badges `123`, `142`, `161`, `180` |
| `profile.html` | title/meta `13-28`, password placeholder `1161`, status/rupee text `2229`, `2763`, `2767`, `2775` |
| `reserve.html` | title `28` |
| `testimonials.html` | title/reviewer dashes `28`, `131`, `144`, `157`, `170`, `183`, `196` |

Representative corrected block:

```html
<title>ANAMIKA SWEETS — Premium Bakery & Restaurant</title>
```

## 1B Sitemap + Robots Domain

`sitemap.xml:4-40`

```xml
<loc>https://anamisweat.vercel.app/index.html</loc>
<loc>https://anamisweat.vercel.app/about.html</loc>
<loc>https://anamisweat.vercel.app/menu.html</loc>
<loc>https://anamisweat.vercel.app/packages.html</loc>
<loc>https://anamisweat.vercel.app/testimonials.html</loc>
<loc>https://anamisweat.vercel.app/gallery.html</loc>
<loc>https://anamisweat.vercel.app/reserve.html</loc>
```

`robots.txt:8`

```txt
Sitemap: https://anamisweat.vercel.app/sitemap.xml
```

## 1C Open Graph + Twitter Cards

Added to every HTML page head. Line ranges:

| File | Lines |
| --- | --- |
| `index.html` | `17-27` |
| `about.html`, `gallery.html`, `menu.html`, `packages.html`, `profile.html`, `reserve.html`, `testimonials.html` | `15-25` |
| `cart.html` | `15-25` |
| `likes.html` | `16-26` |

Representative corrected block:

```html
<meta property="og:type" content="restaurant">
<meta property="og:site_name" content="Anamika Sweets">
<meta property="og:locale" content="en_IN">
<meta property="og:title" content="ANAMIKA SWEETS — Premium Bakery & Restaurant">
<meta property="og:description" content="Saharanpur's finest destination for premium sweets, fine bakery items, North Indian cuisine, and party packages.">
<meta property="og:image" content="https://anamisweat.vercel.app/green_messenger_preview.png">
<meta property="og:url" content="https://anamisweat.vercel.app/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ANAMIKA SWEETS — Premium Bakery & Restaurant">
<meta name="twitter:description" content="Saharanpur's finest premium sweets, bakery & restaurant.">
<meta name="twitter:image" content="https://anamisweat.vercel.app/green_messenger_preview.png">
```

## 1D Canonical Links

Added to all pages:

| File | Line | URL |
| --- | ---: | --- |
| `index.html` | `29` | `https://anamisweat.vercel.app/` |
| `about.html` | `26` | `https://anamisweat.vercel.app/about.html` |
| `cart.html` | `26` | `https://anamisweat.vercel.app/cart.html` |
| `gallery.html` | `26` | `https://anamisweat.vercel.app/gallery.html` |
| `likes.html` | `27` | `https://anamisweat.vercel.app/likes.html` |
| `menu.html` | `26` | `https://anamisweat.vercel.app/menu.html` |
| `packages.html` | `26` | `https://anamisweat.vercel.app/packages.html` |
| `profile.html` | `26` | `https://anamisweat.vercel.app/profile.html` |
| `reserve.html` | `26` | `https://anamisweat.vercel.app/reserve.html` |
| `testimonials.html` | `26` | `https://anamisweat.vercel.app/testimonials.html` |

```html
<link rel="canonical" href="https://anamisweat.vercel.app/">
```

## 1E Description Typo

`config.js:38`

```js
description: "ANAMIKA SWEETS - Saharanpur's finest destination for premium sweets, fine bakery items, North Indian cuisine, and celebratory party packages.",
```

## 1F Dead Social Links

`components/footer.html:10-13`, plus runtime config `config.js:21-24` and `data.js:23-26`.

```html
<a href="https://www.facebook.com/anamikasweets" aria-label="Facebook" class="social-link-facebook"><i class="fa-brands fa-facebook-f"></i></a>
<a href="https://www.instagram.com/anamikasweets" aria-label="Instagram" class="social-link-instagram"><i class="fa-brands fa-instagram"></i></a>
<a href="https://x.com/anamikasweets" aria-label="Twitter" class="social-link-twitter"><i class="fa-brands fa-twitter"></i></a>
<a href="https://www.youtube.com/@anamikasweets" aria-label="YouTube" class="social-link-youtube"><i class="fa-brands fa-youtube"></i></a>
```

## 1G FSSAI Placeholder

`index.html:172`

```html
<span id="fssai-placeholder">FSSAI License: 12724999000123</span>
```

`config.js:43`

```js
fssaiLicense: "FSSAI License: 12724999000123",
```

## 2A Defer Head Scripts

All HTML pages now load head scripts in this order:

```html
<script src="utils.js" defer></script>
<script src="config.js" defer></script>
<script src="layout.js?v=9" defer></script>
<script src="translations.js?v=9" defer></script>
<script src="schema.js" defer></script>
```

Line ranges: `index.html:46-50`; most other pages `43-47`; `likes.html:44-48`.

## 2B Google Fonts

`css/style.css:6` now only imports local variables; the Google Fonts `@import` was removed.

```css
@import 'variables.css';
```

Every HTML page now has:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap">
```

Line ranges: `index.html:33-35`; most pages `30-32`; `likes.html:31-33`.

## 2C CDN Resource Hints

Every HTML page now has:

```html
<link rel="preconnect" href="https://cdnjs.cloudflare.com">
<link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

Line ranges: `index.html:38-40`; most pages `35-37`; `likes.html:36-38`.

## 2D Component Fetch Cache

`layout.js:69-72`

```js
const response = await withTimeout(
  signal => fetch(filepath, {
    signal,
    cache: 'default',
```

## 2E Lazy Images

Static below-fold images and generated images now include `loading="lazy"`, `decoding="async"`, and explicit dimensions. Examples:

`index.html:327`

```html
<img src="images/package_kitty.png" alt="Kitty Party Package" loading="lazy" decoding="async" width="1024" height="1024">
```

`gallery.html:133`

```html
<img src="images/gallery_interior.png" alt="Saffron Lounge Dining Hall" loading="lazy" decoding="async" width="1024" height="1024">
```

`script.js:692`

```js
<img src="${dish.image}" alt="${dish.name}" loading="lazy" decoding="async" width="1024" height="1024" onerror="handleImageError(this)">
```

## 2F LCP Preload

`index.html:28`

```html
<link rel="preload" as="image" href="images/hero_slider_1.png" fetchpriority="high">
```

## 3A Main Landmark + Skip Link

Every page has one skip link and one `main-content` landmark. Example:

`index.html:54`

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

`index.html:96-567`

```html
<main id="main-content">
  ...
</main>
```

`css/style.css:8-24`

```css
.skip-link {
  position: absolute;
  top: -100px;
  left: 16px;
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  font-weight: 700;
  border-radius: 0 0 8px 8px;
  z-index: 10000;
  transition: top 0.2s ease;
  text-decoration: none;
}

.skip-link:focus {
  top: 0;
}
```

## 3B Mobile Nav ARIA

`components/navbar.html:78`

```html
<button class="mobile-toggle" id="mobile-toggle" aria-label="Toggle Navigation Menu" aria-expanded="false" aria-controls="nav-links">
```

`script.js:440-454`

```js
const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
mobileToggle.setAttribute('aria-expanded', String(!isExpanded));
navLinks.setAttribute('aria-hidden', String(isExpanded));
navLinks.classList.toggle('active');
```

## 3C Logo Alt Text

`components/navbar.html:3`

```html
<img src="images/logo.png" alt="Anamika Sweets — Saffron Lounge" class="logo-img" id="nav-logo-img" decoding="async" width="1024" height="1024">
```

`components/footer.html:5`

```html
<img src="images/logo.png" alt="Anamika Sweets — Saffron Lounge" class="footer-logo-img" id="footer-logo-img" loading="lazy" decoding="async" width="1024" height="1024">
```

## 3D Newsletter Label

`components/footer.html:40-43`

```html
<label for="newsletter-email" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);">
  Email address for newsletter
</label>
<input type="email" id="newsletter-email" placeholder="Your email address" required>
```

## 3E Phone Pattern

`index.html:489`, `reserve.html:162`

```html
<input type="tel" id="phone" pattern="[+\d\s\-]{10,15}" title="Enter a valid mobile number (10 digits)" required placeholder="10-digit mobile number">
```

## 4A Security Headers

`vercel.json:1-24`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=()" }
      ]
    }
  ]
}
```

## 4B Remove `document.write()` From Cart Print

`cart-controller.js:641-648`

```js
const blob = new Blob([html], { type: 'text/html' });
const blobUrl = URL.createObjectURL(blob);
const popup = window.open(blobUrl, '_blank', 'width=800,height=600');
if (popup) {
  popup.addEventListener('load', () => {
    popup.print();
    URL.revokeObjectURL(blobUrl);
  });
}
```

## 5A Shared Utilities

`utils.js:1-18`

```js
(function() {
  window.AnSUtils = {
    readStorageJSON: function(key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return fallback;
        var parsed = JSON.parse(raw);
        return parsed == null ? fallback : parsed;
      } catch(e) {
        console.warn('[Storage] Failed to parse "' + key + '"', e);
        return fallback;
      }
    },
    writeStorageJSON: function(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  };
})();
```

Usage examples:

`script.js:333-338`, `cart-controller.js:51-74`, `notifications.js:19-55`.

## 5B Duplicate `formatCurrency`

`cart-controller.js:16-18`

```js
function formatCurrency(amount) {
  return `₹${Number(amount || 0)}`;
}
```

The second reassignment was deleted.

## 5C Honest Reservation Success Message

`index.html:550-552`, `reserve.html:296`

```html
<p class="modal-subtitle">Your reservation request has been saved. Please call us at +91 97602 92999 or WhatsApp us to confirm your booking.</p>
```

## Verification Summary

| Check | Result |
| --- | --- |
| Mojibake searches for `â` / `Ã` in top-level HTML | Passed |
| Placeholder domains in sitemap/robots | Passed |
| `javascript:void(0)` in project | Passed |
| `document.write()` in `cart-controller.js` | Passed |
| `node --check` for changed JS files | Passed |
| Every HTML page has one skip link/main/canonical/OG block | Passed |
| Head scripts all use `defer` | Passed |

