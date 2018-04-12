/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

const CACHE_STATIC = 'static-cache-2';
const URLS_TO_CACHE = [
  'index.html',
  'restaurant.html',
  'assets/css/iconicfill.ttf',
  'assets/css/styles.css',
  'js/main.js',
  'js/restaurant_info.js',
  'js/dbhelper.js'
];

self.addEventListener('install', event => {
  console.log(`cache version : ${CACHE_STATIC}`);
  event.waitUntil(
    self.skipWaiting(),
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => console.log('All resources fetched and cached.'))
      .catch(error => console.error('Open cache failed :', error))
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_STATIC) {
          return caches.delete(key);
        }
      })
    )).then(() => {
      console.log(`${CACHE_STATIC} now ready to handle fetches!`);
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  let newPath;
  if (url.hostname.indexOf('maps') > -1) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(function (cache) {
        return cache.match(event.request).then(res => {
          return res || fetch(url.href, { mode: 'no-cors' }).then(response => {
            cache.put(event.request, response.clone());
            return response;
          }, error => console.error(error));
        });
      })
    );
  } else if (url.href.indexOf('restaurant.html') > -1) {
    newPath = url.href.replace(/[?&]id=\d/, '');
    event.respondWith(
      caches.open(CACHE_STATIC).then(cache => {
        return cache.match(newPath).then(res => {
          return res || fetch(event.request).then(response => {
            cache.put(newPath, response.clone());
            return response;
          }, error => console.error(error));
        });
      })
    );
  } else {
    event.respondWith(
      caches.open(CACHE_STATIC).then(cache => {
        return cache.match(event.request).then(res => {
          return res || fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          }, error => console.error(error));
        });
      })
    );
  }
});