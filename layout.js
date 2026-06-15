/*
   ANAMIKA SWEETS - Shared Component Loader (layout.js)
   Loads shared HTML fragments safely without allowing a stalled request
   or repeated initialization to trap the page behind the preloader.
*/

(function () {
  const LAYOUT_EVENT = 'LayoutComponentsLoaded';
  const COMPONENT_TIMEOUT_MS = 5000;
  const SCRIPT_TIMEOUT_MS = 5000;
  const LAYOUT_FALLBACK_MS = 12000;

  const layoutState = window.__anamikaLayoutState || (window.__anamikaLayoutState = {
    started: false,
    completed: false,
    eventDispatched: false,
    componentLoads: Object.create(null),
    scriptLoads: Object.create(null),
    fallbackTimer: null
  });

  function dispatchLayoutReady(detail = {}) {
    if (layoutState.eventDispatched) return;
    layoutState.eventDispatched = true;
    layoutState.completed = true;

    if (layoutState.fallbackTimer) {
      clearTimeout(layoutState.fallbackTimer);
      layoutState.fallbackTimer = null;
    }

    window.dispatchEvent(new CustomEvent(LAYOUT_EVENT, {
      detail: {
        completedAt: new Date().toISOString(),
        ...detail
      }
    }));
  }

  function withTimeout(promiseFactory, timeoutMs, timeoutMessage) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        if (controller) controller.abort();
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      Promise.resolve(promiseFactory(controller ? controller.signal : undefined))
        .then(resolve)
        .catch(reject)
        .finally(() => {
          clearTimeout(timeoutId);
        });
    });
  }

  async function loadComponent(elementId, filepath) {
    if (layoutState.componentLoads[elementId]) {
      return layoutState.componentLoads[elementId];
    }

    layoutState.componentLoads[elementId] = (async () => {
      const mount = document.getElementById(elementId);
      if (!mount) return { status: 'skipped', reason: 'mount-missing', elementId, filepath };

      try {
        const response = await withTimeout(
          signal => fetch(filepath, {
            signal,
            cache: 'default',
            headers: { 'X-Requested-With': 'layout-loader' }
          }),
          COMPONENT_TIMEOUT_MS,
          `[Layout] Timed out loading component: ${filepath}`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = (await response.text()).trim();
        if (!html) {
          throw new Error('Empty component response');
        }

        const template = document.createElement('template');
        template.innerHTML = html;
        const componentNode = template.content.firstElementChild;

        if (!componentNode) {
          throw new Error('Component has no root element');
        }

        // Guard against accidental recursive self-mounting.
        if (componentNode.id === elementId || componentNode.querySelector(`#${elementId}`)) {
          throw new Error(`Component "${filepath}" contains mount id "${elementId}"`);
        }

        if (mount.parentNode) {
          mount.parentNode.replaceChild(componentNode, mount);
        }

        return { status: 'loaded', elementId, filepath };
      } catch (error) {
        console.error(`[Layout] Failed to load component: ${filepath}`, error);
        if (mount) {
          mount.setAttribute('data-layout-error', filepath);
          mount.style.display = 'none';
        }
        return { status: 'error', elementId, filepath, error: error.message };
      }
    })();

    return layoutState.componentLoads[elementId];
  }

  async function loadScript(src) {
    if (layoutState.scriptLoads[src]) {
      return layoutState.scriptLoads[src];
    }

    layoutState.scriptLoads[src] = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement('script');
      const timeoutId = window.setTimeout(() => {
        script.remove();
        reject(new Error(`[Layout] Timed out loading script: ${src}`));
      }, SCRIPT_TIMEOUT_MS);

      script.src = src;
      script.async = true;
      script.onload = () => {
        clearTimeout(timeoutId);
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(script);
    }).catch(error => {
      console.error(error);
    });

    return layoutState.scriptLoads[src];
  }

  async function initLayout() {
    if (layoutState.started) return;
    layoutState.started = true;

    layoutState.fallbackTimer = window.setTimeout(() => {
      console.warn('[Layout] Layout fallback fired; continuing without waiting for all components.');
      dispatchLayoutReady({ fallback: true });
    }, LAYOUT_FALLBACK_MS);

    const componentJobs = [
      loadComponent('navbar-mount', 'components/navbar.html'),
      loadComponent('box-builder-mount', 'components/box-builder.html'),
      loadComponent('mobile-actions-mount', 'components/mobile-actions.html'),
      loadComponent('whatsapp-widget-mount', 'components/whatsapp-widget.html'),
      loadComponent('footer-mount', 'components/footer.html')
    ];

    if (!document.getElementById('luxury-preloader')) {
      componentJobs.push(loadComponent('preloader-mount', 'components/preloader.html'));
    }

    const componentResults = await Promise.allSettled(componentJobs);

    try {
      await loadScript('notifications.js');
    } catch (error) {
      console.error('[Layout] Failed to load notifications.js:', error);
    }

    const yearEl = document.getElementById('footer-copyright-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }

    dispatchLayoutReady({
      fallback: false,
      components: componentResults.map(result => (
        result.status === 'fulfilled' ? result.value : { status: 'error', error: String(result.reason) }
      ))
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout, { once: true });
  } else {
    initLayout();
  }
})();
