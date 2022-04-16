addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => new Response("you're offline"))
  );
});
