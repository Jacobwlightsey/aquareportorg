/**
 * AquaReport Tracking Pixel v1.1
 * Lightweight consent-aware event tracker with built-in consent banner.
 *
 * Usage:
 *   <script src="https://aquareport.org/pixel.js"
 *           data-company-id="YOUR_COMPANY_ID"
 *           data-api="https://groovy-basilisk-939.convex.site"></script>
 *
 *   window.AquaReport.track("Lead", { email: "user@example.com" });
 *
 * Options (data attributes on the script tag):
 *   data-no-banner="true"  — Disable the built-in consent banner
 *                             (use AquaReport.grantConsent() manually)
 */
(function () {
  "use strict";
  var STORAGE_KEY = "aq_sid";
  var CONSENT_KEY = "aq_consent";
  var BANNER_DISMISSED_KEY = "aq_banner_dismissed";
  var script = document.currentScript;
  if (!script) return;

  var companyId = script.getAttribute("data-company-id");
  var apiBase = (script.getAttribute("data-api") || "").replace(/\/$/, "");
  var noBanner = script.getAttribute("data-no-banner") === "true";
  if (!companyId || !apiBase) return;

  // Session ID (localStorage, not cookies)
  function getSessionId() {
    var sid = localStorage.getItem(STORAGE_KEY);
    if (!sid) {
      sid = "aq_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(STORAGE_KEY, sid);
    }
    return sid;
  }

  // Read first-party Facebook cookies
  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
  }

  // SHA-256 hash (browser native)
  function sha256(str) {
    var buf = new TextEncoder().encode(str.trim().toLowerCase());
    return crypto.subtle.digest("SHA-256", buf).then(function (hash) {
      return Array.from(new Uint8Array(hash))
        .map(function (b) { return b.toString(16).padStart(2, "0"); })
        .join("");
    });
  }

  // Parse UTM params
  function getUtm() {
    var params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || undefined,
      utmMedium: params.get("utm_medium") || undefined,
      utmCampaign: params.get("utm_campaign") || undefined,
      utmContent: params.get("utm_content") || undefined,
      utmTerm: params.get("utm_term") || undefined,
    };
  }

  // Check consent
  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === "1";
  }

  // Send event (fire and forget)
  function sendEvent(name, data) {
    if (!hasConsent()) return Promise.resolve();

    var utm = getUtm();
    var payload = {
      companyId: companyId,
      eventName: name,
      sessionId: getSessionId(),
      sourceUrl: window.location.href,
      referrer: document.referrer || undefined,
      fbClickId: getCookie("_fbc") || undefined,
      fbBrowserId: getCookie("_fbp") || undefined,
      fbEventId: "aq_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      utmContent: utm.utmContent,
      utmTerm: utm.utmTerm,
      metadata: data || undefined,
    };

    // Hash PII if provided
    var hashPromises = [];
    if (data && data.email) {
      hashPromises.push(
        sha256(data.email).then(function (h) { payload.emailHash = h; })
      );
    }
    if (data && data.phone) {
      hashPromises.push(
        sha256(data.phone).then(function (h) { payload.phoneHash = h; })
      );
    }

    return Promise.all(hashPromises).then(function () {
      // Remove raw PII from metadata
      if (payload.metadata) {
        delete payload.metadata.email;
        delete payload.metadata.phone;
        if (Object.keys(payload.metadata).length === 0) {
          payload.metadata = undefined;
        }
      }

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          apiBase + "/api/track",
          new Blob([JSON.stringify(payload)], { type: "application/json" })
        );
      } else {
        fetch(apiBase + "/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(function () {});
      }
    });
  }

  // ─── Consent Banner ──────────────────────────────────────────
  function showConsentBanner() {
    // Don't show if: no-banner mode, already consented, or already dismissed
    if (noBanner) return;
    if (hasConsent()) return;
    if (localStorage.getItem(BANNER_DISMISSED_KEY) === "1") return;

    // Wait for DOM ready
    function inject() {
      var banner = document.createElement("div");
      banner.id = "aq-consent-banner";
      banner.setAttribute("role", "dialog");
      banner.setAttribute("aria-label", "Cookie consent");
      banner.innerHTML =
        '<div style="position:fixed;bottom:0;left:0;right:0;z-index:999999;padding:16px;background:#1e293b;border-top:1px solid #334155;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">' +
          '<p style="margin:0;color:#cbd5e1;font-size:14px;max-width:600px">' +
            'We use cookies and tracking to improve your experience and measure marketing performance. ' +
            '<a href="/privacy" style="color:#22d3ee;text-decoration:underline" target="_blank">Privacy Policy</a>' +
          '</p>' +
          '<div style="display:flex;gap:8px;flex-shrink:0">' +
            '<button id="aq-consent-accept" style="padding:8px 20px;background:#22d3ee;color:#0f172a;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">Accept</button>' +
            '<button id="aq-consent-decline" style="padding:8px 20px;background:transparent;color:#94a3b8;border:1px solid #475569;border-radius:6px;font-size:13px;cursor:pointer">Decline</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(banner);

      document.getElementById("aq-consent-accept").addEventListener("click", function () {
        localStorage.setItem(CONSENT_KEY, "1");
        banner.remove();
        // Fire initial PageView on consent
        sendEvent("PageView");
      });

      document.getElementById("aq-consent-decline").addEventListener("click", function () {
        localStorage.setItem(BANNER_DISMISSED_KEY, "1");
        banner.remove();
      });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", inject);
    } else {
      inject();
    }
  }

  // Public API
  window.AquaReport = {
    track: sendEvent,
    grantConsent: function () {
      localStorage.setItem(CONSENT_KEY, "1");
      // Remove banner if it exists
      var banner = document.getElementById("aq-consent-banner");
      if (banner) banner.remove();
      // Auto-fire initial PageView on consent grant
      sendEvent("PageView");
    },
    revokeConsent: function () {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BANNER_DISMISSED_KEY);
    },
    hasConsent: hasConsent,
  };

  // Auto-track PageView if consent already granted (returning visitor)
  if (hasConsent()) {
    sendEvent("PageView");
  } else {
    // Show consent banner for new visitors
    showConsentBanner();
  }
})();
