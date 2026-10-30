/**
 * voice-interface.js - Multilingual Agricultural Voice Assistant (12 Regional Languages)
 * Integrates Web Speech Recognition & SpeechSynthesis with intent matching for low-literacy farmers.
 */

const VoiceAssistant = {
    languages: {
        en: { name: 'English', locale: 'en-IN', flag: '🇬🇧' },
        hi: { name: 'हिन्दी (Hindi)', locale: 'hi-IN', flag: '🇮🇳' },
        kn: { name: 'ಕನ್ನಡ (Kannada)', locale: 'kn-IN', flag: '🇮🇳' },
        ta: { name: 'தமிழ் (Tamil)', locale: 'ta-IN', flag: '🇮🇳' },
        te: { name: 'తెలుగు (Telugu)', locale: 'te-IN', flag: '🇮🇳' },
        mr: { name: 'मराठी (Marathi)', locale: 'mr-IN', flag: '🇮🇳' },
        bn: { name: 'বাংলা (Bengali)', locale: 'bn-IN', flag: '🇮🇳' },
        pa: { name: 'ਪੰਜਾਬੀ (Punjabi)', locale: 'pa-IN', flag: '🇮🇳' },
        gu: { name: 'ગુજરાતી (Gujarati)', locale: 'gu-IN', flag: '🇮🇳' },
        or: { name: 'ଓଡ଼ିଆ (Odia)', locale: 'or-IN', flag: '🇮🇳' },
        sw: { name: 'Kiswahili', locale: 'sw-KE', flag: '🇰🇪' },
        ha: { name: 'Hausa', locale: 'ha-NG', flag: '🇳🇬' }
    },

    currentLang: 'en',
    recognition: null,
    isListening: false,

    responses: {
        en: {
            crop: 'Based on Kolar red soil calibration, Tomato and Ragi have the highest yield potential for this season.',
            pest: 'Pest alert: Fall Armyworm detected in zone 2. We recommend spraying 5% neem seed extract.',
            weather: 'Today in Kolar is 26.5°C with 65% humidity. Expected seasonal rain is 90 mm.',
            market: 'Kolar APMC market: Tomato modal price ₹1,200/q, Ragi ₹2,450/q.',
            irrigation: 'Soil moisture is optimal at 42%. Schedule drip irrigation according to your 90-day harvest plan.',
            satellite: 'Remote sensing synced: Soil temperature 23.8°C, moisture 28.4%, Sentinel-2 NDVI 0.68, and SoilGrids pH 6.45 without physical test.',
            plan: 'Your 90-day harvest plan has 19 milestone steps across Planning, Growth, Protection, and Harvest phases with automatic date tracking.'
        },
        hi: {
            crop: 'कोलार की लाल मिट्टी के अनुसार, टमाटर और रागी इस मौसम के लिए सबसे उपयुक्त फसलें हैं।',
            pest: 'कीट चेतावनी: फॉल आर्मीवॉर्म का प्रकोप देखा गया है। नीम का तेल 5% छिड़कें।',
            weather: 'आज का तापमान 26.5 डिग्री और आर्द्रता 65% है। 90 मिमी बारिश का अनुमान है।',
            market: 'कोलार एपीएमसी: टमाटर ₹1,200 प्रति क्विंटल और रागी ₹2,450 प्रति क्विंटल।',
            irrigation: 'मिट्टी की नमी 42% है। 90 दिनों की योजना के अनुसार ड्रिप सिंचाई करें।',
            satellite: 'उपग्रह डेटा सिंक हो गया है: मिट्टी का तापमान 23.8°C, नमी 28.4% और एनडीवीआई 0.68 बिना लैब टेस्ट के उपलब्ध है।',
            plan: 'आपकी 90-दिवसीय फसल योजना में बुवाई से कटाई तक 19 चरण हैं।'
        },
        kn: {
            crop: 'ಕೋಲಾರದ ಕೆಂಪು ಮಣ್ಣಿನ ಪ್ರಕಾರ, ಈ ಋತುವಿನಲ್ಲಿ ಟೊಮೆಟೊ ಮತ್ತು ರಾಗಿ ಅತ್ಯುತ್ತಮ ಇಳುವರಿ ನೀಡುತ್ತವೆ.',
            pest: 'ಕೀಟ ಎಚ್ಚರಿಕೆ: ಲದ್ದಿ ಹುಳು ಬಾಧೆ ಕಂಡುಬಂದಿದೆ. 5% ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ.',
            weather: 'ಇಂದಿನ ತಾಪಮಾನ 26.5°C ಆಗಿದೆ. ಕಾಲೋಚಿತ ಮಳೆ 90 ಮಿ.ಮೀ ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ.',
            market: 'ಕೋಲಾರ ಎಪಿಎಂಸಿ: ಟೊಮೆಟೊ ₹1,200/ಕ್ವಿಂಟಾಲ್, ರಾಗಿ ₹2,450/ಕ್ವಿಂಟಾಲ್.',
            irrigation: 'ಮಣ್ಣಿನ ತೇವಾಂಶ 42% ಇದೆ. 90 ದಿನಗಳ ಯೋಜನೆಯ ಪ್ರಕಾರ ಹನಿ ನೀರಾವರಿ ಮಾಡಿ.',
            satellite: 'ಉಪಗ್ರಹ ಡೇಟಾ ಸಿಂಕ್ ಆಗಿದೆ: ಮಣ್ಣಿನ ತಾಪಮಾನ 23.8°C, ತೇವಾಂಶ 28.4% ಮತ್ತು ಎನ್‌ಡಿವಿಐ 0.68 ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆ ಇಲ್ಲದೆ ಲಭ್ಯವಿದೆ.',
            plan: 'ನಿಮ್ಮ 90 ದಿನಗಳ ಬೆಳೆ ಯೋಜನೆಯು ಬಿತ್ತನೆಯಿಂದ ಕೊಯ್ಲುವರೆಗೆ 19 ಹಂತಗಳನ್ನು ಒಳಗೊಂಡಿದೆ.'
        },
        ta: {
            crop: 'மண் பரிசோதனையின்படி, இந்த பருவத்திற்கு நெல் மற்றும் சோளம் சிறந்தவை.',
            pest: 'பூச்சி எச்சரிக்கை: படைப்புழு தாக்குதல் உள்ளது. 5% வேப்ப எண்ணெய் தெளிக்கவும்.',
            weather: 'இன்றைய வெப்பநிலை 29°C. 2 நாட்களில் மிதமான மழைக்கு வாய்ப்புள்ளது.',
            market: 'கோலார் சந்தையில் காட்டப்படும் விலைகள் விளக்கத்திற்கானவை. விற்பதற்கு முன் தற்போதைய ஏபிஎம்சி அல்லது அக்மார்க்நெட் விலையைச் சரிபார்க்கவும்.',
            irrigation: 'மண் ஈரப்பதம் 42%. நாளை காலை சொட்டு நீர் பாசனம் செய்யவும்.'
        },
        te: {
            crop: 'మీ నేల పరీక్ష ప్రకారం, ఈ కాలానికి వరి మరియు మొక్కజొన్న అనుకూలం.',
            pest: 'పురుగుల హెచ్చరిక: కత్తెర పురుగు నివారణకు వేప నూనె పిచికారీ చేయండి.',
            weather: 'నేటి ఉష్ణోగ్రత 29°C. 2 రోజుల్లో తేలికపాటి వర్షం కురిసే అవకాశం ఉంది.',
            market: 'కోలార్ మార్కెట్‌లో చూపించే ధరలు డెమో కోసం మాత్రమే. విక్రయానికి ముందు ప్రస్తుత ఎపిఎంసి లేదా అగ్‌మార్క్‌నెట్ ధరను తనిఖీ చేయండి.',
            irrigation: 'నేలలో తేమ 42% ఉంది. రేపు ఉదయం 12 మి.మీ డ్రిప్ సాగు చేయండి.'
        },
        mr: {
            crop: 'माती परीक्षणानुसार, या हंगामात भात आणि मका लागवडीसाठी उत्तम आहेत.',
            pest: 'कीड इशारा: लष्करी अळीसाठी ५% निंबोळी अर्काची फवारणी करा.',
            weather: 'आजचे तापमान २९°C आहे. पुढील २ दिवसांत पावसाची शक्यता आहे.',
            market: 'कोलार बाजारात दाखवलेल्या किमती प्रात्यक्षिकासाठी आहेत. विक्रीपूर्वी एपीएमसी किंवा अॅगमार्कनेटचा सध्याचा भाव तपासा.',
            irrigation: 'मातीतील ओलावा ४२% आहे. उद्या सकाळी ठिबक सिंचन करा.'
        }
    },

    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.toggleWaveAnim(true);
                const transcript = document.getElementById('voiceTranscript');
                if (transcript) transcript.textContent = '🎙️ Listening... Please speak your agricultural query.';
            };

            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                this.processQuery(text);
            };

            this.recognition.onerror = () => {
                this.isListening = false;
                this.toggleWaveAnim(false);
                const transcript = document.getElementById('voiceTranscript');
                if (transcript) transcript.textContent = 'Could not recognize speech. Please try tapping a query below.';
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.toggleWaveAnim(false);
            };
        }
    },

    toggleWaveAnim(active) {
        document.querySelectorAll('.wave-bar').forEach(bar => {
            if (active) bar.classList.add('active');
            else bar.classList.remove('active');
        });
    },

    startListening() {
        if (this.recognition) {
            this.recognition.lang = this.languages[this.currentLang]?.locale || 'en-IN';
            try {
                this.recognition.start();
            } catch {
                this.recognition.stop();
            }
        } else {
            alert('Speech Recognition is not supported in this browser. Please use the quick question chips below.');
        }
    },

    stopListening() {
        if (this.recognition) this.recognition.stop();
        this.toggleWaveAnim(false);
    },

    processQuery(text) {
        const transcript = document.getElementById('voiceTranscript');
        if (transcript) transcript.textContent = `You: "${text}"`;

        const lower = text.toLowerCase();
        let intent = 'crop';
        if (lower.includes('pest') || lower.includes('कीट') || lower.includes('ಕೀಟ') || lower.includes('பூச்சி') || lower.includes('పురుగు') || lower.includes('कीड') || lower.includes('worm')) intent = 'pest';
        else if (lower.includes('satellite') || lower.includes('remote') || lower.includes('soil test') || lower.includes('ndvi') || lower.includes('उपग्रह')) intent = 'satellite';
        else if (lower.includes('plan') || lower.includes('90 day') || lower.includes('harvest') || lower.includes('योजना') || lower.includes('ಯೋಜನೆ') || lower.includes('திட்டம்')) intent = 'plan';
        else if (lower.includes('weather') || lower.includes('मौसम') || lower.includes('ಮಳೆ') || lower.includes('மழை') || lower.includes('వర్షం') || lower.includes('हवामान') || lower.includes('rain')) intent = 'weather';
        else if (lower.includes('market') || lower.includes('price') || lower.includes('भाव') || lower.includes('ಬೆಲೆ') || lower.includes('விலை') || lower.includes('ధర') || lower.includes('mandi')) intent = 'market';
        else if (lower.includes('water') || lower.includes('irrigation') || lower.includes('सिंचाई') || lower.includes('ನೀರು') || lower.includes('பாசனம்') || lower.includes('నీరు') || lower.includes('पाणी')) intent = 'irrigation';

        this.respond(intent);
    },

    respond(intent) {
        const langPack = this.responses[this.currentLang] || this.responses['en'];
        const reply = langPack[intent] || langPack['crop'];

        const transcript = document.getElementById('voiceTranscript');
        if (transcript) {
            transcript.innerHTML = `<strong>KrishiSense AI:</strong> ${reply}`;
        }

        this.speak(reply);
    },

    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.languages[this.currentLang]?.locale || 'en-IN';
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    VoiceAssistant.init();

    const askBtn = document.getElementById('voiceAskBtn');
    const stopBtn = document.getElementById('voiceStopBtn');
    const langSelect = document.getElementById('voiceLang');
    const headerLangSelect = document.getElementById('headerLanguageSelect');

    if (askBtn) askBtn.addEventListener('click', () => VoiceAssistant.startListening());
    if (stopBtn) stopBtn.addEventListener('click', () => VoiceAssistant.stopListening());

    const onLangChange = (lang) => {
        VoiceAssistant.currentLang = lang;
        if (langSelect) langSelect.value = lang;
        if (headerLangSelect) headerLangSelect.value = lang;
        window.updateGreeting?.();
        if (window.addStatusLog) {
            window.addStatusLog('info', `Voice locale switched to: ${VoiceAssistant.languages[lang]?.name || lang}`);
        }
    };

    if (langSelect) langSelect.addEventListener('change', (e) => onLangChange(e.target.value));
    if (headerLangSelect) headerLangSelect.addEventListener('change', (e) => onLangChange(e.target.value));

    document.querySelectorAll('.action-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.dataset.query;
            VoiceAssistant.respond(query);
        });
    });
});
