const toCache = require("static-to-cache")();
const revGet = require("static-rev-get");
const version = require("static-version")();

const cacheName = `static-${version}`;

addEventListener("install", (event) => {
  skipWaiting();
  event.waitUntil(
    (async function () {
      const cache = await caches.open(cacheName);
      await cache.addAll(toCache);
    })()
  );
});

addEventListener("activate", (event) => {
  event.waitUntil(
    (async function () {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key !== cacheName) await caches.delete(key);
      }
    })()
  );
});

function streamArticle(event, url) {
  const includeUrl = new URL(url);
  includeUrl.pathname += "include";

  const parts = [
    caches.match(revGet("/static/shell-start.html")),
    fetch(includeUrl),
    caches.match(revGet("/static/shell-end.html")),
  ];

  const { readable, writable } = new TransformStream();

  event.waitUntil(
    (async function () {
      for (const responsePromise of parts) {
        const response = await responsePromise;
        await response.body.pipeTo(writable, {
          preventClose: true,
        });
      }

      writable.getWriter().close();
    })()
  );

  return new Response(readable, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  event.respondWith(
    (async function () {
      if (
        url.origin === location.origin &&
        /^\/\d{4}\/[^\/]+\/$/.test(url.pathname)
      ) {
        return streamArticle(event, url);
      }

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
