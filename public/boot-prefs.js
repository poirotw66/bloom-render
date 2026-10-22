/**
 * Early boot prefs (runs before React). Migrates pixshop_ → bloom_ for keys
 * that affect first paint (theme / language / background motion).
 */
(function () {
  try {
    var pairs = [
      ['pixshop_background_motion', 'bloom_background_motion'],
      ['pixshop_theme', 'bloom_theme'],
      ['pixshop_language', 'bloom_language'],
    ];
    for (var i = 0; i < pairs.length; i++) {
      var legacy = pairs[i][0];
      var next = pairs[i][1];
      var legacyVal = localStorage.getItem(legacy);
      if (legacyVal !== null) {
        if (localStorage.getItem(next) === null || localStorage.getItem(next) === '') {
          localStorage.setItem(next, legacyVal);
        }
        localStorage.removeItem(legacy);
      }
    }
    if (localStorage.getItem('bloom_background_motion') !== 'true') {
      document.documentElement.classList.add('background-motion-off');
    }
  } catch (_) {}
})();
