// Register service worker for cache control
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/Accoly/sw.js')
            .then(function(reg) {
                // Check for updates on every load
                reg.update();
            })
            .catch(function(err) {
                console.warn('Service worker registration failed:', err);
            });
    });
}
