/**
 * pwa.js - Service Worker Registration, Install Banner, and Network Status
 */

let deferredPrompt = null;

function initPWA() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('KrishiSense PWA ServiceWorker registered with scope:', reg.scope);
                })
                .catch(err => {
                    console.warn('PWA ServiceWorker registration skipped/failed:', err);
                });
        });
    }

    // 2. Offline / Online Event Listeners
    const updateOnlineStatus = () => {
        const isOnline = navigator.onLine;
        const banner = document.getElementById('offlineBanner');
        const badge = document.getElementById('networkStatusBadge');

        if (badge) {
            badge.innerHTML = isOnline 
                ? '<span class="status-dot online"></span> <span>Online</span>'
                : '<span class="status-dot offline"></span> <span>Offline Mode</span>';
            badge.className = `status-badge ${isOnline ? 'online' : 'offline'}`;
        }

        if (banner) {
            if (!isOnline) {
                banner.classList.remove('hidden');
                banner.textContent = '⚡ You are offline. KrishiSense is operating in local edge-cache mode (Crop Advisor & on-device tools remain fully functional).';
            } else {
                banner.classList.add('hidden');
            }
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // 3. Install App Prompt Handling
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.style.display = 'inline-flex';
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`User response to the install prompt: ${outcome}`);
                    deferredPrompt = null;
                    installBtn.style.display = 'none';
                }
            });
        }
    });

    window.addEventListener('appinstalled', () => {
        console.log('KrishiSense PWA was installed');
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) installBtn.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', initPWA);
