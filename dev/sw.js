const window = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this;
const idbKey = require('./js/indexedb');
const DBHelper = require('./js/dbhelper');

const version = 3;
/**
 * Object containing different cache names.
 */
const CURRENT_CACHES = {
  CACHE_STATIC: 'static-cache-' + version,
  CACHE_MAP: 'map-api-' + version,
  CACHE_FONT: 'google-fonts-' + version
}

/**
 * List of files to add put in cache immediately at first connexion.
 */
const URLS_TO_CACHE = [
  '/',
  'manifest.webmanifest',
  'index.html',
  'restaurant.html',
  'sw.js',
  'js/main.js',
  'js/restaurant_info.js',
  'assets/css/index.css',
  'assets/css/restaurant_info.css',
  'assets/css/fonts/iconicfill.woff2',
  'assets/css/fonts/fontawesome.woff2',
  'assets/img/svg/puff.svg',
  'assets/img/svg/map-loader.svg',
  'assets/img/svg/marker.svg',
  'assets/img/svg/no-wifi.svg',
  'assets/img/svg/favorite.svg',
  'assets/img/svg/not-favorite.svg',
  'assets/img/png/logo-64.png',
  'assets/img/png/logo-128.png',
  'assets/img/png/logo-256.png',
  'assets/img/png/logo-512.png',
  'assets/img/png/launchScreen-ipad-9.7.png',
  'assets/img/png/launchScreen-ipadpro-10.5.png',
  'assets/img/png/launchScreen-ipadpro-12.9.png',
  'assets/img/png/launchScreen-iphone-8.png',
  'assets/img/png/launchScreen-iphone-8plus.png',
  'assets/img/png/launchScreen-iphone-x.png',
  'assets/img/png/launchScreen-iphone-se.png'
];

/**
 * Event triggered when a service worker is in installing state, it will add a set of static files.
 */
self.addEventListener('install', event => {
  
  console.log(`SW - Cache version : "${CURRENT_CACHES.CACHE_STATIC}"`);

  event.waitUntil(
    caches.open(CURRENT_CACHES.CACHE_STATIC)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => {
        console.log('SW - All resources cached.');
        console.log('SW - SW version skipped.');
        return self.skipWaiting();
      })
      .catch(error => console.error('SW - Open cache failed :', error))
  );

});

/**
 * Event triggered when a service worker is in activating state, it will remove old cache to keep the latest.
 */
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
      .then(() => {
        console.log(`SW - "${CURRENT_CACHES.CACHE_STATIC}" now ready to handle fetches!`);
        return self.clients.claim();
      })
  );

});

/**
 * Event triggered when a service worker is active and intercepting all request, it will act differentely depending on url request.
 */
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

      else if (
        url.pathname.startsWith('/restaurants')
        || url.pathname.startsWith('/reviews')
        || event.request.method !== 'GET') {
        
        event.respondWith( fetch(event.request) );
      }
      else {
        event.respondWith(getFromCacheOrFetch(CURRENT_CACHES.CACHE_STATIC, event.request))
      }
    break;

    default:
      event.respondWith(fetch(event.request));
    break;
  }
  
});

/**
 * Handle any error and return default image if request for webp or jpg fails.
 */
async function handleError(error, request) {
  console.error('ERROR handled by SW:', error);
  if (request.url.match(/undefined/) && request.format === 'image') {
    console.log(url);
  }
  if (request.url.match(/\.(jpe?g|webp)$/i)) {
    const cache = await caches.open(CURRENT_CACHES.CACHE_STATIC);
    return cache.match('assets/img/svg/no-wifi.svg');
  }
  if (request.url.match(/reviews\/\?restaurant_id=$/)) {
    return console.log('couocu');
  }
}

/**
 * The function name speaks for itself ;).
 */
async function getFromCacheOrFetch(cache_id, request) {
  const cache = await caches.open(cache_id);
  const match = await cache.match(request);

  if (match) return match;

  const response = await fetch(request).catch((e) =>  handleError(e, request));
  if (!response.url.match(/no-wifi.svg$/)) {
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Function called on "post-review" tag event, it will try to post reviews to server.
 */
async function postLocalReviews(count = 0) {
  const store = 'posts';
  const reviews = await idbKey.getAll(store).catch(err => console.error(err));
  console.log('postLocalReviews triggered');
  return await Promise.all(reviews
    .map(async review => {
      const response = await DBHelper.DATABASE_URL.POST.newReview(review).catch((error) => {
        if (count === 0) {
          self.registration.showNotification("Your review will be posted later");
        }
        console.error('Review not posted', error);
        setTimeout(() => postLocalReviews(1), 10000);
        return null;
      })
      console.log('Response after post request', response,'\nStatus :',response.status)
      if (response && response.status === 201) {
        await self.registration.showNotification("Review synchronised to server");
        return await idbKey.delete(store, review.restaurant_id);
      }
      return response;
    })
  )
}

/**
 * Function called on "fetch-new-reviews" tag event, it will add or update new reviews.
 */
const fetchLastReviews = async () => {
  const clients = await self.clients.matchAll();
  const id = clients.replace(window.location.host, '').match(/\d+/)[0];
  const response = await DBHelper.DATABASE_URL.GET.restaurantReviews(id);
  const reviews = await response.json(),
    store = 'reviews';
  reviews.forEach(review => idbKey.set(store, review))
}

/**
 * Function triggered by sync registration.
 */
self.addEventListener('sync', function (event) {
  console.log('sync event triggered');
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