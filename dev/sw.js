const window = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this;
const idbKey = require('./js/indexedb');
const DBHelper = require('./js/dbhelper');

const version = 6;
const CURRENT_CACHES = {
  CACHE_STATIC: 'static-cache-' + version,
  CACHE_MAP: 'map-api-' + version,
  CACHE_FONT: 'google-fonts-3'
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
  'js/restaurant_info.js'
];

self.addEventListener('install', event => {
  
  console.log(`SW - Cache version : "${CURRENT_CACHES.CACHE_STATIC}"`);

  event.waitUntil(
    caches.open(CURRENT_CACHES.CACHE_STATIC)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => {
        console.log('SW - All resources cached.');
        self.skipWaiting();
        console.log('SW - SW version skipped.');
      })
      .catch(error => console.error('SW - Open cache failed :', error))
  );

});

self.addEventListener('activate', event => {
  
  const expectedCaches = Object.keys(CURRENT_CACHES).map(key => CURRENT_CACHES[key]);

  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => {
          if (expectedCaches.indexOf(key) == -1) {
            console.log('SW - Deleting', key);
            return caches.delete(key)
          }
        })
      ))
      .then(() => console.log(`SW - "${CURRENT_CACHES.CACHE_STATIC}" now ready to handle fetches!`))
  );

});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const location = window.location;

  switch (url.hostname) {
    case 'maps.gstatic.com':
      event.respondWith(getFromCacheOrFetch(CURRENT_CACHES.CACHE_MAP, event.request));
    break;

    case 'fonts.gstatic.com':
      event.respondWith(getFromCacheOrFetch(CURRENT_CACHES.CACHE_FONT, event.request));
    break;

    case location.hostname:
      if (url.pathname.startsWith('/restaurant.html')) {
        const newPath = url.href.replace(/[?&]id=\d{1,}/, '');
        event.respondWith(getFromCacheOrFetch(CURRENT_CACHES.CACHE_STATIC, newPath));
      }

      else if (url.pathname.endsWith('restaurants.json')) {
        event.respondWith(fetch(event.request));
      }
      
      else {
        event.request.method !== 'POST'
          ? event.respondWith(getFromCacheOrFetch(CURRENT_CACHES.CACHE_STATIC, event.request))
          : event.respondWith(fetch(event.request));
      }
    break;

    default:
      event.respondWith(fetch(event.request));
    break;
  }
  
});

function getFromCacheOrFetch(cache_id, request) {
  return caches.open(cache_id)
    .then((cache) => cache.match(request)
      .then((match) => match || fetch(request))
        .then((response) => {
          cache.put(request, response.clone());
          return response;
        }, (error) => console.error('Error :', error))
    , (error) => console.error('Error: ', error))
}

async function postLocalReviews() {
  const store = 'posts';
  const reviews = await idbKey.getAll(store).catch(err => console.error(err));
  
  const promises = await Promise.all(reviews
    .map(review => {
      return DBHelper.DATABASE_URL.POST.newReview(review)
        .then(response => {
          console.log('Response after post request', response,'\nStatus :',response.status)
          if (response.status === 201) {
            self.registration.showNotification("Review synchronised to server")
              .then(() => idbKey.delete(store, review.restaurant_id))
          }

          return response;
        })
        .catch(error => {
          self.registration.showNotification("Your review will be posted later");
          self.registration.showNotification("You can quit this app if needed");
          console.error('Review not posted',error);
        })
    }))
}

const fetchLastReviews = async () => {
  const response = await DBHelper.DATABASE_URL.GET.allReviews();
  const reviews = await response.json(),
    store = 'reviews';
  reviews.forEach(review => idbKey.set(store, review))
}

self.addEventListener('sync', function (event) {
  if (event.tag === 'post-review') {
    event.waitUntil(postLocalReviews());
  }
  if (event.lastChance) {
    console.log('Last time trying to sync')
  }
  if (event.tag === 'fetch-new-reviews') {
    event.waitUntil(fetchLastReviews())
  }
});