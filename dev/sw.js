const window = require('../node_modules/window-or-global/lib/index');

const version = new Date();
const CURRENT_CACHES = {
  CACHE_STATIC: 'static-cache-' + version,
  CACHE_MAP: 'map-api-1',
  CACHE_FONT: 'google-fonts-1'
}

const URLS_TO_CACHE = [
  'index.html',
  'manifest.webmanifest',
  'restaurant.html',
  'assets/css/fonts/iconicfill.woff2',
  'assets/css/fonts/fontawesome.woff2',
  'assets/img/svg/puff.svg',
  'assets/img/png/launchScreen-ipad-9.7.png',
  'assets/img/png/launchScreen-ipadpro-10.5.png',
  'assets/img/png/launchScreen-ipadpro-12.9.png',
  'assets/img/png/launchScreen-iphone-8.png',
  'assets/img/png/launchScreen-iphone-8plus.png',
  'assets/img/png/launchScreen-iphone-x.png',
  'assets/img/png/launchScreen-iphone-se.png',
  'assets/img/png/logo-64.png',
  'assets/img/png/logo-128.png',
  'assets/img/png/logo-256.png',
  'assets/img/png/logo-512.png',
  'assets/css/index.css',
  'assets/css/restaurant_info.css',
  'js/main.js',
  'js/restaurant_info.js',
];

self.addEventListener('install', event => {
  
  console.log(`- Cache version : "${CACHE_STATIC}"`);
  
  event.waitUntil(
    caches.open(CURRENT_CACHES.CACHE_STATIC)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => {
        console.log('- All resources cached.');
        self.skipWaiting();
        console.log('- SW version skipped.');
      })
      .catch(error => console.error('Open cache failed :', error))
  );

});

self.addEventListener('activate', event => {
  
  const expectedCaches = Object.keys(CURRENT_CACHES).map(key => CURRENT_CACHES[key]);

  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (expectedCaches.indexOf(key) == -1) {
          console.log('- Deleting', key);
          return caches.delete(key)
        }
      })
    )).then(() => console.log(`- "${CURRENT_CACHES.CACHE_STATIC}" now ready to handle fetches!`))
  );

});

self.addEventListener('fetch', event => {

  const url = new URL(event.request.url);
  const location = window.location;

  switch (url.hostname) {

    case 'maps.gstatic.com':
      event.respondWith(
        caches.open(CURRENT_CACHES.CACHE_MAP)
          .then((cache) => cache.match(event.request)
            .then((match) => match || fetch(url.href, {mode: 'no-cors'}))
            .then((response) => {
              cache.put(event.request, response.clone());
              return response;
            }, (error) => console.error(error)))
      );
    break;

    case 'fonts.gstatic.com':
      event.respondWith(
        caches.open(CURRENT_CACHES.CACHE_FONT)
          .then((cache) => cache.match(event.request)
            .then((match) => match || fetch(url.href))
            .then((response) => {
              cache.put(event.request, response.clone());
              return response;
            }, (error) => console.error(error)))
      );
    break;

    case location.hostname:
      
      if (url.pathname.startsWith('restaurant.html')) {

        const newPath = url.href.replace(/[?&]id=\d/, '');

        event.respondWith(
          caches.open(CURRENT_CACHES.CACHE_STATIC)
          .then((cache) => cache.match(newPath)
            .then((match) => match || fetch(event.request))
            .then((response) => {
              cache.put(newPath, response.clone());
              return response;
            }, (error) => console.error(error)))
        );

      }
      
      else if (url.pathname.endsWith('restaurants.json')) {
        event.respondWith(fetch(event.request));
      }
      
      else {
        event.respondWith(
          caches.open(CURRENT_CACHES.CACHE_STATIC)
          .then((cache) => {
              return cache.match(event.request)
              .then((match) => match || fetch(event.request))
              .then((response) => {
                if (response.status === 200) {
                    cache.put(event.request, response.clone());
                    return response;
                }
                else if (url.pathname.indexOf('assets/img/') > -1) {
                  cache.match(`${location.hostname}'/assets/img/svg/puff.svg`)
                }
                else {
                  return response;
                }
              }, (error) => console.error('error :',error))
          }, (error) => console.error('Error: ',error))
        );
      }
    break;

    default:
      event.respondWith(fetch(event.request));
    break;
  }
  
});