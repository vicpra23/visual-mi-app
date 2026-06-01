const CACHE_NAME = 'xiaomi-trainer-v40.61';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './src/main.js',
  './src/services/api.js',
  './src/views/Login.js',
  './src/views/Dashboard.js',
  './src/views/ReportForm.js',
  './src/views/Calendar.js',
  './src/views/Vacations.js',
  './src/views/Materials.js',
  './src/views/Messages.js',
  './Xiaomi_logo_(2021-).svg.png',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si hay internet, devuelve lo nuevo y actualiza la caché en segundo plano
        return response;
      })
      .catch(() => {
        // Si no hay red (offline), busca en la caché ignorando los parámetros ?v=...
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
