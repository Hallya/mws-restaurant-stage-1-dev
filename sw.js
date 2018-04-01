const CACHE_STATIC = `static-cache-v2`;
const urlToCache = [
  './',
  'assets/css/iconicfill.ttf',
  'assets/css/styles.css',
  'js/main.js',
  'js/dbhelper.js',
  'js/restaurant_info.js',
  'assets/img_resized/1-large_x1.jpg',
  'assets/img_resized/2-large_x1.jpg',
  'assets/img_resized/3-large_x1.jpg',
  'assets/img_resized/4-large_x1.jpg',
  'assets/img_resized/5-large_x1.jpg',
  'assets/img_resized/6-large_x1.jpg',
  'assets/img_resized/7-large_x1.jpg',
  'assets/img_resized/8-large_x1.jpg',
  'assets/img_resized/9-large_x1.jpg',
  'assets/img_resized/10-large_x1.jpg'
];

self.addEventListener('install', event => {
  console.log(`cache version : ${CACHE_STATIC}`);
  event.waitUntil(
    self.skipWaiting(),
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
  } else {
    event.respondWith(
      caches.open(CACHE_STATIC).then(cache => {
        return cache.match(event.request).then(res => {
          return res || fetch(url.href).then(response => {
            cache.put(event.request, response.clone()); 
            return response;
          }, error => console.error(error));
        });
      })
    );
  }
})