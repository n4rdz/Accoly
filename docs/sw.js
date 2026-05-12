const CACHE_NAME = 'accoly-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './login.html',
  './signup.html',
  './dashboard.html',
  './community.html',
  './notes.html',
  './notepad.html',
  './flashcards.html',
  './quiz.html',
  './leaderboard.html',
  './profile.html',
  './settings.html',
  './messages.html',
  './styles.css',
  './auth.css',
  './dashboard.css',
  './modules.css',
  './quiz.css',
  './leaderboard.css',
  './profile.css',
  './js/storage.js',
  './js/theme.js',
  './js/nav-header.js',
  './js/ui.js',
  './js/auth.js',
  './js/dashboard.js',
  './js/community.js',
  './js/notes.js',
  './js/notepad.js',
  './js/flashcards.js',
  './js/quiz-data.js',
  './js/quiz.js',
  './js/leaderboard.js',
  './js/profile.js',
  './js/messages.js',
  './js/premium.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});

