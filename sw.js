const CACHE_STATIC = `static-cache-v6`;
const urlToCache = [
  './',
  'assets/css/iconicfill.ttf',
  'assets/css/styles.css',
  'js/main.js',
  'js/dbhelper.js',
  'js/restaurant_info.js'
];

self.addEventListener('install', event => {
  console.log(`cache version : ${CACHE_STATIC}`);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(urlToCache))
      .then(() => console.log('All resources fetched and cached.'))
      .catch(error => console.error('Open cache failed :', error))
  );
})

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
  if (url.hostname.indexOf('maps') > -1) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(function (cache) {
        return cache.match(event.request).then(res => {
          return res || fetch(url.href, { mode: 'no-cors'}).then(response => {
            cache.put(event.request, response.clone());
            return response;
          }, error => console.error(error));
        });
      })
    );
  }else {
    event.respondWith(
      caches.open(CACHE_STATIC).then(cache => {
        return cache.match(url).then(res => {
          return res || fetch(event.request).then(response => {
            cache.put(event.request, response.clone()); 
            return response;
          });
        });
      })
    );
  }
})