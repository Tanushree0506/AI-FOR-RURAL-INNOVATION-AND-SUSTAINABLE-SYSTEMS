/**
 * main.js - KrishiSense Application Coordinator
 * Handles theme toggles, mobile drawer, status logging, metrics sync, and canvas resizing.
 */

const DashboardApp = {
    theme: 'light',

    greetings: {
        en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening', farmer: 'Farmer' },
        hi: { morning: 'शुभ प्रभात', afternoon: 'शुभ दोपहर', evening: 'शुभ संध्या', farmer: 'किसान मित्र' },
        kn: { morning: 'ಶುಭೋದಯ', afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ', evening: 'ಶುಭ ಸಂಜೆ', farmer: 'ರೈತರೆ' },
        ta: { morning: 'காலை வணக்கம்', afternoon: 'மதிய வணக்கம்', evening: 'மாலை வணக்கம்', farmer: 'விவசாயி' },
        te: { morning: 'శుభోదయం', afternoon: 'శుభ మధ్యాహ్నం', evening: 'శుభ సాయంత్రం', farmer: 'రైతు సోదరా' },
        mr: { morning: 'शुभ प्रभात', afternoon: 'शुभ दुपार', evening: 'शुभ संध्याकाळ', farmer: 'शेतकरी मित्र' },
        bn: { morning: 'সুপ্রভাত', afternoon: 'শুভ দুপুর', evening: 'শুভ সন্ধ্যা', farmer: 'কৃষক বন্ধু' },
        pa: { morning: 'ਸ਼ੁਭ ਸਵੇਰ', afternoon: 'ਸ਼ੁਭ ਦੁਪਹਿਰ', evening: 'ਸ਼ੁਭ ਸੰਝ', farmer: 'ਕਿਸਾਨ ਵੀਰ' },
        gu: { morning: 'શુભ સવાર', afternoon: 'શુભ બપોર', evening: 'શુભ સાંજ', farmer: 'ખેડૂત મિત્ર' },
        or: { morning: 'ଶୁଭ ସକାଳ', afternoon: 'ଶୁଭ ଅପରାହ୍ନ', evening: 'ଶୁଭ ସନ୍ଧ୍ୟା', farmer: 'ଚାଷୀ ଭାଇ' },
        sw: { morning: 'Habari za asubuhi', afternoon: 'Habari za mchana', evening: 'Habari za jioni', farmer: 'Mkulima' },
        ha: { morning: 'Ina kwana', afternoon: 'Ina wuni', evening: 'Barka da yamma', farmer: 'Manomi' }
    },

    init() {
        this.updateGreeting();
        this.bindThemeToggle();
        this.bindMobileNav();
        this.bindRefreshButtons();
        this.bindCanvasResize();
        this.bindMandiSearch();

        setInterval(() => this.updateGreeting(), 30000);

        setTimeout(() => {
            addStatusLog('info', 'KrishiSense Engine initialized. Real on-device Naive Bayes & Edge Models online.');
        }, 300);
    },

    updateGreeting() {
        const greetingEl = document.getElementById('greetingHeading');
        if (!greetingEl) return;

        const lang = window.VoiceAssistant?.currentLang || document.getElementById('headerLanguageSelect')?.value || 'en';
        const langPack = this.greetings[lang] || this.greetings.en;

        const hour = new Date().getHours();
        let period = 'morning';
        let emoji = '🌾';

        if (hour >= 5 && hour < 12) {
            period = 'morning';
            emoji = '🌅';
        } else if (hour >= 12 && hour < 17) {
            period = 'afternoon';
            emoji = '☀️';
        } else if (hour >= 17 && hour < 21) {
            period = 'evening';
            emoji = '🌆';
        } else {
            period = 'evening';
            emoji = '🌙';
        }

        const greetingText = langPack[period] || this.greetings.en[period];
        const farmerText = langPack.farmer || this.greetings.en.farmer;
        greetingEl.innerHTML = `${emoji} ${greetingText}, ${farmerText}`;
    },

    bindThemeToggle() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                this.theme = this.theme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', this.theme);
                themeBtn.innerHTML = this.theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
                
                // Redraw canvas charts for new theme palette
                window.updateYieldForecast?.();
                window.drawFedChart?.();
                window.updateSupplyChain?.();
            });
        }
    },

    bindMobileNav() {
        const toggleBtn = document.getElementById('menuToggleBtn');
        const sidebar = document.querySelector('aside');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                if (sidebar) sidebar.classList.remove('open');
            });
        });
    },

    bindRefreshButtons() {
        document.querySelectorAll('.btn-refresh').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.dataset.panel;
                btn.style.transform = 'rotate(180deg)';
                btn.style.transition = 'transform 0.4s ease';

                if (panel === 'sensors') window.updateSensors?.();
                else if (panel === 'yield') window.updateYieldForecast?.();
                else if (panel === 'pest') window.updatePestDetection?.();
                else if (panel === 'resource') window.updateResourceOptimizer?.();
                else if (panel === 'supply') window.updateSupplyChain?.();
                else if (panel === 'federated') window.updateFederatedLearning?.();

                setTimeout(() => {
                    btn.style.transform = 'rotate(0deg)';
                }, 400);
            });
        });
    },

    bindCanvasResize() {
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                window.updateYieldForecast?.();
                window.drawFedChart?.();
                window.updateSupplyChain?.();
            }, 200);
        });
    },

    bindMandiSearch() {
        const searchInput = document.getElementById('mandiSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (window.SupplyChain) {
                    window.SupplyChain.renderMandiTable(e.target.value);
                }
            });
        }
    }
};

function addStatusLog(type, message) {
    const logFeed = document.getElementById('statusLogFeed');
    if (!logFeed) return;

    const row = document.createElement('div');
    row.className = `log-row ${type || 'info'}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    row.textContent = `[${time}] ${message}`;

    logFeed.prepend(row);

    while (logFeed.children.length > 15) {
        logFeed.removeChild(logFeed.lastElementChild);
    }
}

window.addStatusLog = addStatusLog;
window.DashboardApp = DashboardApp;
window.updateGreeting = () => DashboardApp.updateGreeting();

document.addEventListener('DOMContentLoaded', () => {
    DashboardApp.init();
});
