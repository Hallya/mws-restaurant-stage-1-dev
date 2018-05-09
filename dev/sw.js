const CACHE_STATIC = 'static-cache-4';
const CACHE_MAP = 'cache-map-api-3';
const URLS_TO_CACHE = [
  'index.html',
  'manifest.webmanifest',
  'restaurant.html',
  'assets/css/fonts/iconicfill.woff2',
  'assets/css/fonts/fontawesome.woff2',
  'assets/css/fonts/1cXxaUPXBpj2rGoU7C9WiHGFq8Kk1Q.woff2',
  'assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gnD_vx3rCs.woff2',
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
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => {
        console.log('- All resources cached.');
        self.skipWaiting();
        console.log('- SW version skipped.');
      })
      .catch(error => console.error('Open cache failed :', error))
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_STATIC && key !== CACHE_MAP) {
          console.log('- Deleting', key);
          return caches.delete(key)
        }
      })
    )).then(() => console.log(`- "${CACHE_STATIC}" now ready to handle fetches!`))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  let newPath;
  if (url.hostname.indexOf('maps') > -1) {
    event.respondWith(
      caches.open(CACHE_MAP)
        .then((cache) => cache.match(event.request)
          .then((match) => match || fetch(url.href, { mode: 'no-cors' }))
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          }, (error) => console.error(error)))
      // fetch(event.request)
    );
  }
  else if (url.pathname.indexOf('restaurant.html') > -1) {
    newPath = url.href.replace(/[?&]id=\d/, '');
    event.respondWith(
      caches.open(CACHE_STATIC)
        .then((cache) => cache.match(newPath)
          .then((match) => match || fetch(event.request))
          .then((response) => {
            cache.put(newPath, response.clone());
            return response;
          }, (error) => console.error(error)))
    );
  }
  else if (url.pathname.indexOf('browser-sync') > -1 || url.pathname.endsWith('restaurants.json')) {
    event.respondWith(fetch(event.request));
  }
  else if (url.hostname.indexOf(['localhost', 'hally.github.io']) > -1) {
    event.respondWith(
      caches.open(CACHE_STATIC)
        .then((cache) => {
          return cache.match(event.request)
            .then((match) => match || fetch(event.request))
            .then((response) => {
              cache.put(event.request, response.clone());
              return response;
            },(error) => console.error(error))
        })
    );
  }
});