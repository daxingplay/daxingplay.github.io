// Selected DOM elements
var html = document.querySelector('html');
var body = document.querySelector('body');
var menuToggle = document.querySelector('.menu-toggle');
var menuIcon = document.querySelector('.icon-menu');
var siteMenu = document.querySelector('.site-menu');
var socialMenu = document.querySelector('.social-menu');
var toTopBtn = document.querySelector('.to-top');

// Site and social menu toggle
menuToggle &&
  menuToggle.addEventListener('click', function() {
    siteMenu.classList.toggle('collapsed');
    socialMenu.classList.toggle('collapsed');
    menuIcon.classList.toggle('icon-menu');
    menuIcon.classList.toggle('icon-close');
    var expandStatus = menuToggle.getAttribute('aria-expanded');
    if (expandStatus === 'false') menuToggle.setAttribute('aria-expanded', 'true');
    else menuToggle.setAttribute('aria-expanded', 'false');
  });

// Remember an explicit language choice. Once set, the head script stops
// consulting the browser's Accept-Language and always honours this instead.
var languageLinks = document.querySelectorAll('[data-set-language]');
Array.prototype.forEach.call(languageLinks, function(link) {
  link.addEventListener('click', function() {
    try {
      window.localStorage.setItem('preferred-language', link.getAttribute('data-set-language'));
    } catch (e) {
      // Storage unavailable: the click still navigates, it just won't stick.
    }
  });
});

// Medium zoom init
var zoomables = document.querySelectorAll('.zoomable > img, img.zoomable');
zoomables.length && mediumZoom(zoomables);

// Random emoji for 404 error message.
function randomErrorEmoji() {
  var error = document.getElementsByClassName('error-emoji')[0];
  var emojiArray = [
    '\\(o_o)/',
    '(o^^)o',
    '(˚Δ˚)b',
    '(^-^*)',
    '(≥o≤)',
    '(^_^)b',
    '(·_·)',
    "(='X'=)",
    '(>_<)',
    '(;-;)',
    '\\(^Д^)/',
  ];
  if (error) {
    var errorEmoji = emojiArray[Math.floor(Math.random() * emojiArray.length)];
    error.appendChild(document.createTextNode(errorEmoji));
  }
};
randomErrorEmoji();

// Show toTopBtn when scroll to 600px
/* eslint-disable no-undef */
var lastPosition = 0;
var ticking = false;
window.addEventListener('scroll', function() {
  lastPosition = body.scrollTop === 0 ? html.scrollTop : body.scrollTop;
  if (!ticking) {
    window.requestAnimationFrame(function() {
      if (lastPosition >= 600) {
        toTopBtn.classList.remove('is-hide');
      } else {
        toTopBtn.classList.add('is-hide');
      }
      ticking = false;
    });
  }
  ticking = true;
});

// Smooth Scroll to top when click toTopBtn
var scroll = new SmoothScroll('a[href*="#"]');
toTopBtn &&
  toTopBtn.addEventListener('click', function() {
    scroll.animateScroll(0);
  });
