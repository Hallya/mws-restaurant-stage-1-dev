"use strict";var CACHE_STATIC="static-cache-43",URLS_TO_CACHE=["/","index.html","manifest.webmanifest","restaurant.html","assets/css/fonts/iconicfill.ttf","assets/css/fonts/fontawesome.ttf","assets/css/fonts/1cXxaUPXBpj2rGoU7C9WhnGFq8Kk1doH.woff2","assets/css/fonts/1cXxaUPXBpj2rGoU7C9WiHGFq8Kk1Q.woff2","assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3g3D_vx3rCubqg.woff2","assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gbD_vx3rCubqg.woff2","assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gfD_vx3rCubqg.woff2","assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gnD_vx3rCs.woff2","assets/css/fonts/JTURjIg1_i6t8kCHKm45_ZpC3gTD_vx3rCubqg.woff2","assets/css/styles.css","js/main.js","js/restaurant_info.js","js/dbhelper.js"];function send_message_to_all_clients(n){clients.matchAll().then(function(e){e.forEach(function(e){send_message_to_client(e,n).then(function(e){return console.log("SW Received Message: "+e)})})})}function send_message_to_client(t,o){return new Promise(function(n,s){var e=new MessageChannel;e.port1.onmessage=function(e){e.data.error?s(e.data.error):n(e.data)},t.postMessage(o,[e.port2])})}self.addEventListener("install",function(e){console.log("cache version : "+CACHE_STATIC),e.waitUntil(caches.open(CACHE_STATIC).then(function(e){return e.addAll(URLS_TO_CACHE)}).then(function(){console.log("All resources cached."),self.skipWaiting(),console.log("SW version skipped.")}).catch(function(e){return console.error("Open cache failed :",e)}))}),self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(e){return Promise.all(e.map(function(e){if(e!==CACHE_STATIC)return caches.delete(e)}))}).then(function(){console.log(CACHE_STATIC+" now ready to handle fetches!")}))}),self.addEventListener("fetch",function(s){var t=new URL(s.request.url),o=void 0;-1<t.hostname.indexOf("maps")?s.respondWith(caches.open(CACHE_STATIC).then(function(n){return n.match(s.request).then(function(e){return-1<t.href.indexOf("spotlight-poi2")&&e&&send_message_to_all_clients({message:"confirmed"}),e||fetch(t.href,{mode:"no-cors"}).then(function(e){return-1<t.href.indexOf("spotlight-poi2")&&(send_message_to_all_clients({message:"confirmed"}),console.log("Message sent from SW to Client")),n.put(s.request,e.clone()),e},function(e){return console.error(e)})})})):-1<t.pathname.indexOf("restaurant.html")?(o=t.href.replace(/[?&]id=\d/,""),console.log(o),s.respondWith(caches.open(CACHE_STATIC).then(function(n){return n.match(o).then(function(e){return e||fetch(s.request).then(function(e){return n.put(o,e.clone()),console.log(o,"cached"),e},function(e){return console.error(e)})})}))):s.respondWith(caches.open(CACHE_STATIC).then(function(n){return n.match(s.request).then(function(e){return e||fetch(s.request).then(function(e){return n.put(s.request,e.clone()),e},function(e){return console.error(e)})})}))}),self.addEventListener("message",function(e){console.log("Message received from Client",e.data),e.ports[0].postMessage("Service worker says Hello !")});