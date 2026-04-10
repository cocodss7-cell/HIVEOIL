// 식용유니버스 Service Worker v1.0
const CACHE_NAME = 'hiveoil-v1';
const STATIC_ASSETS = [
  '/HIVEOIL/',
  '/HIVEOIL/index.html',
  '/HIVEOIL/manifest.json',
  '/HIVEOIL/icon-192.png',
  '/HIVEOIL/icon-512.png',
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// fetch: 네트워크 우선, 실패 시 캐시
self.addEventListener('fetch', event => {
  // Supabase API 요청은 캐시 없이 항상 네트워크
  if (event.request.url.includes('supabase.co')) return;
  // 카카오맵, 네이버맵 등 외부 리소스 패스
  if (event.request.url.includes('kakao') || event.request.url.includes('naver')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공하면 캐시 업데이트
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 오프라인 시 캐시에서 반환
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // HTML 요청이면 index.html 반환
          if (event.request.destination === 'document') {
            return caches.match('/HIVEOIL/index.html');
          }
        });
      })
  );
});
