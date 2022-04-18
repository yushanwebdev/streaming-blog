const toCache = require("static-to-cache")();
const revGet = require("static-rev-get");

addEventListener("install", (event) => {
  skipWaiting();
  event.waitUntil(
    (async function () {
      const cache = await caches.open("static");
      await cache.addAll(toCache);
    })()
  );
});

addEventListener("fetch", (event) => {
  event.respondWith(
    (async function () {
      const cachedResponse = await caches.match(event.request);

      if (cachedResponse) return cachedResponse;

      try {
        return await fetch(event.request);
      } catch (err) {
        return caches.match(revGet("/static/offline.html"));
      }
    })()
  );
});
