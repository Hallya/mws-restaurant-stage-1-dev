const CACHE_NAME = 'static-cache-v1';
const urlToCache = [
  './',
  'assets/css/iconicfill.ttf',
  'assets/css/styles.css',
  'js/main.js',
  'js/dbhelper.js',
  'js/restaurant_info.js',
  'https://maps.googleapis.com/maps/api/js?key=AIzaSyAhh8UfYBFgAt3jlejXNTbrAuCnJqQtIPc&libraries=places&callback=initMap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlToCache);
    }, error => console.error('Open cache failed :', error))
  );
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      const fetchClone = event.request.clone();

      return fetch(fetchClone).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          }, error => console.error('failed to add request to cache :', error));
        return response
      });
    })
  )
})