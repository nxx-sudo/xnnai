(function () {
  "use strict";

  var THEME_MODES = ["auto", "light", "dark"];
  var mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function getStoredMode() {
    return localStorage.getItem("theme-mode") || "auto";
  }

  function resolveTheme(mode) {
    if (mode === "auto") {
      return mediaQuery.matches ? "dark" : "light";
    }
    return mode;
  }

  function applyTheme(mode) {
    var resolved = resolveTheme(mode);
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-mode", mode);
    updateThemeButton(mode, resolved);
  }

  function setThemeMode(mode) {
    localStorage.setItem("theme-mode", mode);
    applyTheme(mode);
  }

  var ICONS = {
    light:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7"/></svg>',
    dark:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 13.4A8.4 8.4 0 1 1 10.6 4a6.7 6.7 0 0 0 9.4 9.4Z"/></svg>',
    auto:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4.5" width="18" height="12" rx="1.4"/><path d="M8 20h8M12 16.5V20"/></svg>'
  };

  function updateThemeButton(mode, resolved) {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.innerHTML = ICONS[mode];
    var t = window.i18n ? window.i18n.t : function (k) { return k; };
    var label = (t("theme.ariaPrefix") || "Tema") + ": " + (t("theme." + mode) || mode);
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  }

  function cycleTheme() {
    var current = getStoredMode();
    var next = THEME_MODES[(THEME_MODES.indexOf(current) + 1) % THEME_MODES.length];
    setThemeMode(next);
  }

  mediaQuery.addEventListener("change", function () {
    if (getStoredMode() === "auto") applyTheme("auto");
  });

  /* -----------------------------------------------------
     IDIOMA
     Cada archivo lang/xx.js registra sus textos en
     window.translations['xx'], incluyendo un bloque
     meta.label con el nombre visible del idioma. La lista
     de idiomas disponibles en el selector se calcula sola
     a partir de las claves de window.translations.
     ----------------------------------------------------- */
  var DEFAULT_LANG = "es";

  function availableLangs() {
    return Object.keys(window.translations || {});
  }

  function detectInitialLang() {
    var stored = localStorage.getItem("lang");
    var langs = availableLangs();
    if (stored && langs.indexOf(stored) !== -1) return stored;

    var nav = (navigator.language || "").slice(0, 2).toLowerCase();
    if (langs.indexOf(nav) !== -1) return nav;

    return langs.indexOf(DEFAULT_LANG) !== -1 ? DEFAULT_LANG : langs[0];
  }

  function getPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc && typeof acc === "object" ? acc[key] : undefined;
    }, obj);
  }

  var currentLang = DEFAULT_LANG;

  function t(key) {
    var dict = (window.translations || {})[currentLang] || {};
    var value = getPath(dict, key);
    if (value === undefined) {
      var fallback = (window.translations || {})[DEFAULT_LANG] || {};
      value = getPath(fallback, key);
    }
    return value !== undefined ? value : key;
  }

  function applyTranslations() {
    document.documentElement.setAttribute("lang", currentLang);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = t(key);
      if (typeof value === "string") el.textContent = value;
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria-label");
      el.setAttribute("aria-label", t(key));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", t(key));
    });
  }

  /* -----------------------------------------------------
     Menú de idioma (botón + panel a medida, sin <select>
     nativo, para poder darle el mismo diseño que el resto
     de los controles del encabezado).
     ----------------------------------------------------- */
  var CHECK_ICON =
    '<svg class="lang-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5 10 17l9-10"/></svg>';

  function buildLangPanel() {
    var panel = document.getElementById("lang-panel");
    if (!panel) return;
    panel.innerHTML = "";
    availableLangs().sort().forEach(function (code) {
      var label = getPath(window.translations[code], "meta.label") || code.toUpperCase();
      var opt = document.createElement("button");
      opt.type = "button";
      opt.className = "lang-option";
      opt.setAttribute("role", "option");
      opt.setAttribute("data-lang", code);
      opt.setAttribute("aria-selected", code === currentLang ? "true" : "false");
      opt.innerHTML = "<span>" + label + "</span>" + CHECK_ICON;
      opt.addEventListener("click", function () {
        setLang(code);
        closeLangPanel();
        var trigger = document.getElementById("lang-trigger");
        if (trigger) trigger.focus();
      });
      panel.appendChild(opt);
    });
  }

  function updateLangTrigger() {
    var codeEl = document.getElementById("lang-current-code");
    if (codeEl) codeEl.textContent = currentLang.toUpperCase();
    document.querySelectorAll(".lang-option").forEach(function (opt) {
      opt.setAttribute("aria-selected", opt.getAttribute("data-lang") === currentLang ? "true" : "false");
    });
  }

  function openLangPanel() {
    var trigger = document.getElementById("lang-trigger");
    var panel = document.getElementById("lang-panel");
    if (!trigger || !panel) return;
    panel.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
  }

  function closeLangPanel() {
    var trigger = document.getElementById("lang-trigger");
    var panel = document.getElementById("lang-panel");
    if (!trigger || !panel) return;
    panel.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function toggleLangPanel() {
    var panel = document.getElementById("lang-panel");
    if (!panel) return;
    if (panel.classList.contains("is-open")) closeLangPanel();
    else openLangPanel();
  }

  function initLangDropdown() {
    var trigger = document.getElementById("lang-trigger");
    var dropdown = document.getElementById("lang-dropdown");
    if (!trigger || !dropdown) return;

    buildLangPanel();
    updateLangTrigger();

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleLangPanel();
    });

    document.addEventListener("click", function (e) {
      if (!dropdown.contains(e.target)) closeLangPanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeLangPanel();
        trigger.focus();
      }
    });
  }

  function setLang(code) {
    if (availableLangs().indexOf(code) === -1) code = DEFAULT_LANG;
    currentLang = code;
    localStorage.setItem("lang", code);
    applyTranslations();
    updateLangTrigger();
    updateThemeButton(getStoredMode(), resolveTheme(getStoredMode()));
  }

  window.i18n = { t: t, setLang: setLang, get lang() { return currentLang; } };

  /* -----------------------------------------------------
     Modal: "¿Dónde instalar el bot?" (Servidor / Usuario)
     Se abre al pulsar cualquier botón con la clase
     js-invite-trigger.
     ----------------------------------------------------- */
  function initInviteModal() {
    var overlay = document.getElementById("invite-modal");
    if (!overlay) return;
    var card = overlay.querySelector(".modal-card");
    var closeBtn = document.getElementById("invite-modal-close");
    var triggers = document.querySelectorAll(".js-invite-trigger");
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    triggers.forEach(function (btn) {
      btn.addEventListener("click", open);
    });

    if (closeBtn) closeBtn.addEventListener("click", close);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });

    if (card) card.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  /* -----------------------------------------------------
     Revelado suave al hacer scroll
     ----------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  /* -----------------------------------------------------
     Arranque
     ----------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    currentLang = detectInitialLang();
    applyTranslations();
    initLangDropdown();
    applyTheme(getStoredMode());
    initInviteModal();

    var themeBtn = document.getElementById("theme-toggle");
    if (themeBtn) themeBtn.addEventListener("click", cycleTheme);

    var yearEl = document.getElementById("current-year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var navToggle = document.getElementById("nav-toggle");
    var mainNav = document.getElementById("main-nav");
    if (navToggle && mainNav) {
      navToggle.addEventListener("click", function () {
        var open = mainNav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    initReveal();
  });
})();
