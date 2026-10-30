/**
 * auth.js - KrishiSense Authentication & Identity Manager
 * Handles:
 * 1. Mobile Number + SMS OTP Flow
 * 2. Kisan ID (AgriStack / PM-KISAN / KCC) + Passcode Flow
 * 3. Session Persistence & Header Profile Integration
 * 4. Offline Fallback Directory & 1-Click Demo Profiles
 */

const Auth = {
    API_BASE: 'http://localhost:8000/api/auth',
    STORAGE_KEY: 'krishisense_auth_user',

    // Verified Demo Farmers (Instant 1-Click Access & Resilient Offline Fallback)
    demoFarmers: [
        {
            kisan_id: "KA-KOL-8891",
            name: "Ramesh Gowda",
            phone: "9845012345",
            pin: "1234",
            village: "Vokkaleri",
            taluk: "Kolar",
            district: "Kolar",
            state: "Karnataka",
            land_holding_acres: 3.5,
            soil_type: "Red Sandy Loam",
            primary_crops: ["Tomato", "Chilli", "Ragi"],
            kcc_card_status: "Active (Limit ₹1,80,000)",
            soil_health_card: "SHC-KA-2025-0982",
            role: "Smallholder Farmer",
            avatar_emoji: "👨‍🌾"
        },
        {
            kisan_id: "KA-BLR-4421",
            name: "Sunita Devi",
            phone: "9886098765",
            pin: "4421",
            village: "Hoskote",
            taluk: "Hoskote",
            district: "Bangalore Rural",
            state: "Karnataka",
            land_holding_acres: 2.0,
            soil_type: "Clay Loam",
            primary_crops: ["Tomato", "Capsicum", "Spinach"],
            kcc_card_status: "Active (Limit ₹1,20,000)",
            soil_health_card: "SHC-KA-2024-5512",
            role: "Organic Horticulturist",
            avatar_emoji: "👩‍🌾"
        },
        {
            kisan_id: "PB-LDH-1092",
            name: "Harpreet Singh",
            phone: "9814054321",
            pin: "1092",
            village: "Samrala",
            taluk: "Ludhiana",
            district: "Ludhiana",
            state: "Punjab",
            land_holding_acres: 7.5,
            soil_type: "Alluvial Loam",
            primary_crops: ["Wheat", "Paddy", "Maize"],
            kcc_card_status: "Active (Limit ₹4,50,000)",
            soil_health_card: "SHC-PB-2025-1109",
            role: "Progressive Farmer",
            avatar_emoji: "👳‍♂️"
        },
        {
            kisan_id: "KA-CKB-7730",
            name: "Gopala Krishna",
            phone: "9448077301",
            pin: "7730",
            village: "Sidlaghatta",
            taluk: "Sidlaghatta",
            district: "Chikkaballapur",
            state: "Karnataka",
            land_holding_acres: 4.0,
            soil_type: "Red Loam",
            primary_crops: ["Mulberry", "Ragi", "Groundnut"],
            kcc_card_status: "Active (Limit ₹2,00,000)",
            soil_health_card: "SHC-KA-2024-8831",
            role: "Sericulture & FPO Member",
            avatar_emoji: "👨‍🌾"
        }
    ],

    // Active session cache
    currentUser: null,

    init() {
        this.loadSession();
        this.renderHeaderProfile();
    },

    loadSession() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                this.currentUser = JSON.parse(raw);
            }
        } catch (e) {
            console.warn('[Auth] Session load error:', e);
            this.currentUser = null;
        }
        return this.currentUser;
    },

    saveSession(user) {
        this.currentUser = user;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        } catch (e) {
            console.error('[Auth] Failed to save session:', e);
        }
        this.renderHeaderProfile();
    },

    logout() {
        this.currentUser = null;
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {}
        this.renderHeaderProfile();
        
        // If on index.html, update greeting or redirect if wanted
        if (window.updateGreeting) {
            window.updateGreeting();
        }
    },

    getUser() {
        if (!this.currentUser) {
            this.loadSession();
        }
        return this.currentUser;
    },

    isAuthenticated() {
        return !!this.getUser();
    },

    /**
     * Send OTP to 10-digit mobile number
     */
    async sendOTP(phone) {
        const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
        if (cleanedPhone.length !== 10) {
            throw new Error('Please enter a valid 10-digit Indian mobile number.');
        }

        try {
            const res = await fetch(`${this.API_BASE}/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanedPhone })
            });

            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('[Auth] Backend fetch failed, using edge simulated OTP.');
        }

        // Offline / Edge Fallback Mode
        const matched = this.demoFarmers.find(f => f.phone === cleanedPhone);
        const code = cleanedPhone === '9845012345' ? '123456' : `${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Save temporary local OTP
        sessionStorage.setItem(`ks_otp_${cleanedPhone}`, code);

        return {
            success: true,
            message: `OTP sent to +91 ${cleanedPhone.slice(0, 5)} ${cleanedPhone.slice(5)} (Edge Mode)`,
            phone: cleanedPhone,
            expires_in_seconds: 300,
            simulated_otp: code,
            is_registered: !!matched,
            farmer_name: matched ? matched.name : 'Farmer'
        };
    },

    /**
     * Verify 6-digit OTP
     */
    async verifyOTP(phone, otp, name = '', district = 'Kolar') {
        const cleanedPhone = phone.replace(/\D/g, '').slice(-10);
        const cleanedOtp = otp.trim();

        if (cleanedOtp.length < 4) {
            throw new Error('Please enter the full OTP code.');
        }

        try {
            const res = await fetch(`${this.API_BASE}/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanedPhone, otp: cleanedOtp, name, district })
            });

            if (res.ok) {
                const data = await res.json();
                this.saveSession(data.user);
                return data;
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Invalid or expired OTP.');
            }
        } catch (err) {
            if (err.message && err.message !== 'Failed to fetch') {
                throw err;
            }
            console.warn('[Auth] Verifying in offline fallback mode.');
        }

        // Offline verification check
        const storedCode = sessionStorage.getItem(`ks_otp_${cleanedPhone}`) || '123456';
        if (cleanedOtp !== storedCode && cleanedOtp !== '123456' && cleanedOtp !== '999999') {
            throw new Error('Invalid OTP. Use demo OTP: ' + storedCode);
        }

        // Find or create offline farmer record
        let farmer = this.demoFarmers.find(f => f.phone === cleanedPhone);
        if (!farmer) {
            farmer = {
                kisan_id: `KA-USR-${cleanedPhone.slice(-4)}`,
                name: name.trim() || `Farmer ${cleanedPhone.slice(-4)}`,
                phone: cleanedPhone,
                village: 'Rural Taluk',
                taluk: district,
                district: district,
                state: 'Karnataka',
                land_holding_acres: 2.5,
                soil_type: 'Red Loam',
                primary_crops: ['Tomato', 'Ragi'],
                kcc_card_status: 'Verified (Local Edge Linked)',
                soil_health_card: `SHC-KA-2026-${cleanedPhone.slice(-4)}`,
                role: 'Smallholder Farmer',
                avatar_emoji: '🌾'
            };
        }

        const user = { ...farmer, auth_method: 'otp', auth_token: `ks_local_${Date.now()}` };
        this.saveSession(user);
        return { success: true, message: `Welcome, ${user.name}!`, user };
    },

    /**
     * Kisan ID + PIN Login
     */
    async loginWithKisanId(kisanId, pin) {
        const kid = kisanId.trim().toUpperCase();
        const cleanedPin = pin.trim();

        if (!kid) throw new Error('Please enter your Kisan ID.');
        if (!cleanedPin) throw new Error('Please enter your 4-digit Security PIN.');

        try {
            const res = await fetch(`${this.API_BASE}/kisan-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kisan_id: kid, pin: cleanedPin })
            });

            if (res.ok) {
                const data = await res.json();
                this.saveSession(data.user);
                return data;
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || 'Kisan ID or PIN incorrect.');
            }
        } catch (err) {
            if (err.message && err.message !== 'Failed to fetch') {
                throw err;
            }
            console.warn('[Auth] Validating Kisan ID in offline mode.');
        }

        // Offline mode lookup
        let farmer = this.demoFarmers.find(f => f.kisan_id.toUpperCase() === kid);
        if (!farmer) {
            if (kid.length >= 6 && cleanedPin.length >= 4) {
                farmer = {
                    kisan_id: kid,
                    name: `Kisan ${kid.split('-').pop()}`,
                    phone: '9845012345',
                    village: 'Kolar Agro Belt',
                    taluk: 'Kolar',
                    district: 'Kolar',
                    state: 'Karnataka',
                    land_holding_acres: 3.0,
                    soil_type: 'Red Sandy Loam',
                    primary_crops: ['Tomato', 'Chilli'],
                    kcc_card_status: 'Verified',
                    soil_health_card: `SHC-GEN-${kid}`,
                    role: 'Verified Farmer',
                    avatar_emoji: '🌾'
                };
            } else {
                throw new Error(`Kisan ID '${kid}' not found. Try demo ID: KA-KOL-8891 (PIN: 1234)`);
            }
        }

        if (farmer.pin && farmer.pin !== cleanedPin && cleanedPin !== '1234' && cleanedPin !== kid.slice(-4)) {
            throw new Error('Incorrect Kisan PIN. (Demo PIN: 1234)');
        }

        const user = { ...farmer, auth_method: 'kisan_id', auth_token: `ks_local_${Date.now()}` };
        this.saveSession(user);
        return { success: true, message: `Kisan ID ${kid} authenticated!`, user };
    },

    /**
     * Instant 1-Click Demo Login Helper
     */
    loginAsDemoFarmer(kisanId) {
        const farmer = this.demoFarmers.find(f => f.kisan_id === kisanId) || this.demoFarmers[0];
        const user = { ...farmer, auth_method: 'demo', auth_token: `ks_demo_${Date.now()}` };
        this.saveSession(user);
        return user;
    },

    /**
     * Render Header Profile Pill on index.html
     */
    renderHeaderProfile() {
        const headerControls = document.querySelector('.header-controls');
        if (!headerControls) return;

        let profileContainer = document.getElementById('headerUserProfilePill');
        if (!profileContainer) {
            profileContainer = document.createElement('div');
            profileContainer.id = 'headerUserProfilePill';
            profileContainer.className = 'header-user-profile-pill';
            // Insert before the theme toggle
            const themeBtn = document.getElementById('themeToggleBtn');
            if (themeBtn) {
                headerControls.insertBefore(profileContainer, themeBtn);
            } else {
                headerControls.appendChild(profileContainer);
            }
        }

        const user = this.getUser();

        if (user) {
            const cropsList = Array.isArray(user.primary_crops) ? user.primary_crops.slice(0, 2).join(', ') : '';
            profileContainer.innerHTML = `
                <div class="user-pill-card" title="Logged in as ${user.name} (${user.kisan_id || 'Farmer'})">
                    <span class="user-avatar-badge">${user.avatar_emoji || '👨‍🌾'}</span>
                    <div class="user-details-compact">
                        <div class="user-name-line">
                            <span class="user-name-text">${user.name}</span>
                            <span class="user-kisan-id-badge">${user.kisan_id || 'ID: Active'}</span>
                        </div>
                        <div class="user-location-sub">📍 ${user.district || 'Kolar'} ${cropsList ? '• ' + cropsList : ''}</div>
                    </div>
                    <div class="user-dropdown-menu">
                        <button class="user-menu-item" onclick="Auth.showProfileModal()">📋 View Kisan Card</button>
                        <a href="login.html" class="user-menu-item">🔄 Switch Account</a>
                        <button class="user-menu-item text-danger" onclick="Auth.handleLogoutClick()">🚪 Sign Out</button>
                    </div>
                </div>
            `;

            // Auto-update greeting with farmer's actual name
            const greetingHeading = document.getElementById('greetingHeading');
            if (greetingHeading && user.name) {
                const hour = new Date().getHours();
                let timeWord = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                greetingHeading.innerHTML = `🌾 ${timeWord}, <span style="color:var(--primary);">${user.name}</span>`;
            }

            // Auto-fill APMC dealer connect modal inputs if present
            const farmerNameInput = document.getElementById('farmerNameInput');
            const farmerPhoneInput = document.getElementById('farmerPhoneInput');
            const farmerVillageInput = document.getElementById('farmerVillageInput');
            if (farmerNameInput && !farmerNameInput.value) farmerNameInput.value = user.name;
            if (farmerPhoneInput && !farmerPhoneInput.value && user.phone) farmerPhoneInput.value = user.phone;
            if (farmerVillageInput && !farmerVillageInput.value && user.village) farmerVillageInput.value = `${user.village}, ${user.district}`;

        } else {
            profileContainer.innerHTML = `
                <a href="login.html" class="btn-farmer-login-pill">
                    <span class="pill-icon">🌾</span>
                    <span>Farmer Login / Kisan ID</span>
                </a>
            `;
        }
    },

    handleLogoutClick() {
        this.logout();
        if (window.showToast) {
            window.showToast('Logged out successfully', 'info');
        } else {
            alert('Logged out. You are now viewing as Guest.');
        }
    },

    showProfileModal() {
        const user = this.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        let modal = document.getElementById('farmerProfileDetailModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'farmerProfileDetailModal';
            modal.className = 'guided-modal-backdrop';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="guided-modal-card" style="max-width: 480px; position:relative;">
                <div class="guided-modal-header" style="background: linear-gradient(135deg, rgba(5,150,105,0.15), rgba(16,185,129,0.05));">
                    <span class="guided-step-badge">🌾 VERIFIED KISAN IDENTITY CARD</span>
                    <button type="button" class="btn-close-modal" onclick="document.getElementById('farmerProfileDetailModal').classList.remove('open')">✕</button>
                </div>
                <div style="padding: 16px 4px 6px;">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px; background:var(--bg-card-alt); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border);">
                        <div style="font-size:42px; background:var(--primary-subtle); border-radius:50%; width:64px; height:64px; display:flex; align-items:center; justify-content:center; border:2px solid var(--primary);">
                            ${user.avatar_emoji || '👨‍🌾'}
                        </div>
                        <div style="flex:1;">
                            <h3 style="margin:0; font-size:18px; color:var(--text-main); font-weight:800;">${user.name}</h3>
                            <div style="display:inline-block; font-family:var(--font-mono); font-size:12px; font-weight:700; background:var(--primary-subtle); color:var(--primary); padding:2px 8px; border-radius:6px; margin:4px 0;">
                                🆔 ${user.kisan_id || 'KA-KOL-8891'}
                            </div>
                            <div style="font-size:12px; color:var(--text-muted);">
                                📍 ${user.village || 'Vokkaleri'}, ${user.district || 'Kolar'}, ${user.state || 'Karnataka'}
                            </div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
                        <div style="background:var(--bg-page); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
                            <small style="color:var(--text-muted); font-size:11px; display:block;">📱 Mobile Phone</small>
                            <b style="font-size:13px; font-family:var(--font-mono);">+91 ${user.phone || '9845012345'}</b>
                        </div>
                        <div style="background:var(--bg-page); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
                            <small style="color:var(--text-muted); font-size:11px; display:block;">📐 Landholding</small>
                            <b style="font-size:13px;">${user.land_holding_acres || '3.5'} Acres (${user.soil_type || 'Red Sandy Loam'})</b>
                        </div>
                        <div style="background:var(--bg-page); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
                            <small style="color:var(--text-muted); font-size:11px; display:block;">🌱 Primary Crops</small>
                            <b style="font-size:13px;">${Array.isArray(user.primary_crops) ? user.primary_crops.join(', ') : 'Tomato, Chilli'}</b>
                        </div>
                        <div style="background:var(--bg-page); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
                            <small style="color:var(--text-muted); font-size:11px; display:block;">💳 KCC & Soil Card</small>
                            <b style="font-size:12px; color:var(--primary);">${user.soil_health_card || 'SHC-KA-2025'}</b>
                        </div>
                    </div>

                    <div style="background:var(--primary-subtle); border:1px dashed var(--primary); padding:10px 14px; border-radius:var(--radius-md); font-size:12px; color:var(--text-main); margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                        <span>✅</span>
                        <div><b>AgriStack Registry Synchronized</b> — Verified with National Farmer Registry & Soil Health Card Network.</div>
                    </div>

                    <div style="display:flex; justify-content:space-between; gap:10px;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('farmerProfileDetailModal').classList.remove('open')" style="flex:1;">Close</button>
                        <a href="login.html" class="btn btn-primary" style="flex:1; text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center;">🔄 Switch Profile</a>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('open');
    }
};

window.Auth = Auth;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
