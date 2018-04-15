/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
const CACHE_STATIC = 'static-cache-45';
const URLS_TO_CACHE = [
  'index.html',
  'manifest.webmanifest',
  'restaurant.html',
  'assets/css/fonts/iconicfill.ttf',
  'assets/css/fonts/fontawesome.ttf',
  'assets/css/fonts/1cXxaUPXBpj2rGoU7C9WhnGFq8Kk1doH.woff2',
  'assets/css/fonts/1cXxaUPXBpj2rGoU7C9WiHGFq8Kk1Q.woff2',
  'assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3g3D_vx3rCubqg.woff2',
  'assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gbD_vx3rCubqg.woff2',
  'assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gfD_vx3rCubqg.woff2',
  'assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gnD_vx3rCs.woff2',
  'assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gTD_vx3rCubqg.woff2',
  'assets/css/styles.css',
  'js/main.js',
  'js/restaurant_info.js',
  'js/dbhelper.js'
];

self.addEventListener('install', event => {
  console.log(`cache version : ${CACHE_STATIC}`);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(URLS_TO_CACHE))
      .then(() => {
        console.log('All resources cached.');
        self.skipWaiting();
        console.log('SW version skipped.');
      })
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
          if (url.href.indexOf('spotlight-poi2') > -1 && res) {
            send_message_to_all_clients({ message: 'confirmed'});
          }
          return res || fetch(url.href, { mode: 'no-cors' }).then(response => {
            if (url.href.indexOf('spotlight-poi2') > -1) {
              send_message_to_all_clients({ message: 'confirmed' });
              console.log('Message sent from SW to Client');
            }
            cache.put(event.request, response.clone());
            return response;
          }, error => console.error(error));
        });
      })
    );
  } else if (url.pathname.indexOf('restaurant.html') > -1) {
    newPath = url.href.replace(/[?&]id=\d/, '');
    console.log(newPath);
    event.respondWith(
      caches.open(CACHE_STATIC).then(cache => {
        return cache.match(newPath).then(res => {
          return res || fetch(event.request).then(response => {
            cache.put(newPath, response.clone());
            console.log(newPath, 'cached');
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

self.addEventListener('message', (event) => {
  console.log('Message received from Client', event.data);

  event.ports[0].postMessage('Service worker says Hello !');
});

function send_message_to_all_clients(msg) {
  clients.matchAll().then(clients => {
    clients.forEach(client => {
      send_message_to_client(client, msg)
        .then(m => console.log(`SW Received Message: ${m}`));
    });
  });
}
function send_message_to_client(client, msg) {
  return new Promise(function (resolve, reject) {
    var msg_chan = new MessageChannel();

    msg_chan.port1.onmessage = function (event) {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    client.postMessage(msg, [msg_chan.port2]);
  });
}