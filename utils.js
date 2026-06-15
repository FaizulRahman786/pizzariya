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
