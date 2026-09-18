/**
 * Theme & WordPress runtime initialization
 */
window.grecaptcha = window.grecaptcha || {
  ready: function(cb) { if (typeof cb === 'function') { try { cb(); } catch (e) {} } },
  execute: function() { return Promise.resolve(''); }
};

if (typeof wp !== 'undefined' && wp.i18n) {
  wp.i18n.setLocaleData({ 'text directionltr': ['ltr'] });
}

var csJsData = {"linkSelector":"#x-root a[href*=\"#\"]","bp":{"base":4,"ranges":[0,480,767,979,1200],"count":4}};

var xJsData = {
  "scrollTop": "0.15",
  "icons": {
    "down": "<i class='x-framework-icon x-icon-angle-double-down' data-x-icon-s='&#xf103;' aria-hidden=true></i>",
    "subindicator": "<i class=\"x-icon x-framework-icon x-icon-angle-double-down\" aria-hidden=\"true\" data-x-icon-s=\"&#xf103;\"></i>",
    "previous": "<i class='x-framework-icon x-icon-previous' data-x-icon-s='&#xf053;' aria-hidden=true></i>",
    "next": "<i class='x-framework-icon x-icon-next' data-x-icon-s='&#xf054;' aria-hidden=true></i>",
    "star": "<i class='x-framework-icon x-icon-star' data-x-icon-s='&#xf005;' aria-hidden=true></i>"
  }
};

var xJsStackData = {
  "backstretch": [["/wp-content/uploads/cbro.background.newest.svg"], {"fade": "0"}]
};

var wpcf7 = {
  "api": {
    "root": "/wp-json/",
    "namespace": "contact-form-7/v1"
  },
  "cached": 1
};

var wpcf7_recaptcha = {
  "sitekey": "6LclB9cpAAAAACO0ll7AO-d19qCvlpam6jGTRIbh",
  "actions": {
    "homepage": "homepage",
    "contactform": "contactform"
  }
};
