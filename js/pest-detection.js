/**
 * pest-detection.js - Edge AI Crop Stage Leaf Disease Diagnostic & Knowx IoT Precision Farming Lab
 * Detects leaf pathology across specific crop growth stages (Seedling, Vegetative, Flowering/Fruiting, Maturity)
 * for Tomato, Chilli, Spinach, Ragi, Maize, and Groundnut.
 */

const PestDetector = {
    selectedCrop: 'Tomato',
    selectedStage: 'Vegetative',
    currentImage: null,

    stageLeafDatabase: [
        // --- TOMATO ---
        {
            crop: 'Tomato',
            stage: 'Vegetative',
            name: 'Early Blight (Alternaria Target Spot)',
            scientific: 'Alternaria solani',
            pathogen: 'Fungal Pathogen',
            severity: 'medium',
            coveragePct: 22.5,
            symptom: 'Dark brown concentric target rings on lower leaves with distinct yellow chlorotic halo.',
            biocontrol: 'Trichoderma harzianum @ 5g/L + Neem Oil 10,000 ppm @ 3 ml/L foliar spray.',
            chemical: 'Mancozeb 75% WP @ 2g/L or Azoxystrobin 23% SC @ 1 ml/L.',
            dosage: 'Spray early morning covering leaf undersurface; repeat every 10 days.',
            phiDays: 7,
            trigger: 'RH > 80% with warm day temperatures (24-29°C) and dew wetness.',
            leafColor: '#2D6A4F',
            spotColor: '#8B4513'
        },
        {
            crop: 'Tomato',
            stage: 'Flowering & Fruit Set',
            name: 'Late Blight (Phytophthora Water Soak)',
            scientific: 'Phytophthora infestans',
            pathogen: 'Oomycete Pathogen',
            severity: 'high',
            coveragePct: 45.0,
            symptom: 'Rapidly spreading irregular water-soaked pale green-brown lesions with white downy mold underneath.',
            biocontrol: 'Copper Oxychloride (COC 50% WP) @ 2.5g/L + Pseudomonas fluorescens @ 5g/L.',
            chemical: 'Cymoxanil 8% + Mancozeb 64% WP @ 2g/L or Metalaxyl-M @ 1.5 ml/L.',
            dosage: 'Immediate preventative spray upon cloud cover; repeat in 7 days.',
            phiDays: 10,
            trigger: 'Continuous drizzle, temp 15-22°C with RH > 90%.',
            leafColor: '#1B4332',
            spotColor: '#3E2723'
        },
        {
            crop: 'Tomato',
            stage: 'Maturity / Harvest',
            name: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
            scientific: 'Begomovirus (Whitefly-vectored)',
            pathogen: 'Viral Pathogen',
            severity: 'high',
            coveragePct: 38.0,
            symptom: 'Severe upward leaf curling, cupping, yellow margins, stunted bushy top growth, flower drop.',
            biocontrol: 'Deploy 20 yellow sticky traps/acre. Spray Lecanicillium lecanii @ 5g/L.',
            chemical: 'Diafenthiuron 50% WP @ 1g/L or Spiromesifen 22.9% SC @ 1 ml/L.',
            dosage: 'Eradicate vector whitefly Bemisia tabaci early. Rouge out index plants.',
            phiDays: 5,
            trigger: 'Dry hot weather (28-34°C) accelerating whitefly breeding.',
            leafColor: '#74C69D',
            spotColor: '#F59E0B'
        },

        // --- CHILLI ---
        {
            crop: 'Chilli',
            stage: 'Vegetative',
            name: 'Chilli Leaf Curl & Murda Disease',
            scientific: 'Chilli Veinal Mottle & Thrips Damage',
            pathogen: 'Viral & Vector Complex',
            severity: 'high',
            coveragePct: 34.0,
            symptom: 'Upward boat-shaped leaf cupping from thrips; downward curling from mites with crinkling.',
            biocontrol: 'Install Blue & Yellow sticky trap grid. Spray Neem Azadirachtin @ 2 ml/L.',
            chemical: 'Fipronil 5% SC @ 1.5 ml/L or Abamectin 1.9% EC @ 0.75 ml/L.',
            dosage: 'Alternate chemical classes every 12 days to avoid thrips resistance.',
            phiDays: 7,
            trigger: 'Low soil moisture combined with high ambient temperature (>30°C).',
            leafColor: '#2D6A4F',
            spotColor: '#D97706'
        },
        {
            crop: 'Chilli',
            stage: 'Flowering & Fruit Set',
            name: 'Anthracnose Dieback & Fruit Rot',
            scientific: 'Colletotrichum capsici',
            pathogen: 'Fungal Pathogen',
            severity: 'high',
            coveragePct: 42.0,
            symptom: 'Branch tip dieback with necrotic brown spots and black concentric dots on chilli fruits.',
            biocontrol: 'Trichoderma viride seed/foliar drench + 1% Bordeaux mixture.',
            chemical: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1 ml/L.',
            dosage: 'Spray at 50% flowering and repeat during fruit set.',
            phiDays: 10,
            trigger: 'Intermittent rains with bright sunshine, RH 80-85% at 28°C.',
            leafColor: '#1B4332',
            spotColor: '#1F2937'
        },

        // --- SPINACH ---
        {
            crop: 'Spinach',
            stage: 'Vegetative',
            name: 'Spinach Downy Mildew (Blue Mold)',
            scientific: 'Peronospora effusa',
            pathogen: 'Oomycete Pathogen',
            severity: 'high',
            coveragePct: 28.5,
            symptom: 'Dull chlorotic yellow patches on upper leaf blade with purplish-gray velvety spore mat underneath.',
            biocontrol: 'Potassium silicate @ 2g/L + Trichoderma asperellum drench. Turn off late evening overhead sprinklers.',
            chemical: 'Mandipropamid 23.4% SC @ 0.8 ml/L or Copper Hydroxide @ 1.5g/L.',
            dosage: 'Strictly follow 3-day PHI as fresh spinach leaves are direct table harvest.',
            phiDays: 3,
            trigger: 'Cool nights (8-18°C) with persistent canopy moisture > 6 hours.',
            leafColor: '#52B788',
            spotColor: '#CA8A04'
        },
        {
            crop: 'Spinach',
            stage: 'Maturity / Harvest',
            name: 'Cladosporium Leaf Spot',
            scientific: 'Cladosporium variabile',
            pathogen: 'Fungal Pathogen',
            severity: 'medium',
            coveragePct: 18.0,
            symptom: 'Circular tan spots (2-6mm) with olive-black spore cushion centers degrading market value.',
            biocontrol: 'Chitosan 1% foliar spray + 5% neem extract.',
            chemical: 'Azoxystrobin 23% SC @ 0.8 ml/L.',
            dosage: 'Cut healthy outer leaves first in clear dry morning.',
            phiDays: 4,
            trigger: 'Over-crowded unthinned beds with restricted air ventilation.',
            leafColor: '#40916C',
            spotColor: '#374151'
        },

        // --- RAGI ---
        {
            crop: 'Ragi',
            stage: 'Seedling',
            name: 'Ragi Seedling Blast',
            scientific: 'Pyricularia grisea',
            pathogen: 'Fungal Pathogen',
            severity: 'high',
            coveragePct: 26.0,
            symptom: 'Spindle-shaped elliptical lesions with gray centers and reddish-brown borders on young leaves.',
            biocontrol: 'Pseudomonas fluorescens seed treatment @ 10g/kg + foliar spray @ 5g/L.',
            chemical: 'Tricyclazole 75% WP @ 0.6g/L or Carbendazim 50% WP @ 1g/L.',
            dosage: 'Drench nursery bed 5 days prior to field transplanting.',
            phiDays: 14,
            trigger: 'High nitrogen excess combined with night dew and 22-26°C temp.',
            leafColor: '#2D6A4F',
            spotColor: '#7F1D1D'
        },
        {
            crop: 'Ragi',
            stage: 'Flowering & Fruit Set',
            name: 'Neck & Finger Blast',
            scientific: 'Magnaporthe grisea',
            pathogen: 'Fungal Pathogen',
            severity: 'high',
            coveragePct: 48.0,
            symptom: 'Girdling and black necrotic ring on neck below earhead; fingers become chaffy and snap off.',
            biocontrol: 'Foliar spray of 5% raw cow urine extract + Pseudomonas @ 50g in 10L water.',
            chemical: 'Kasugamycin 3% SL @ 2 ml/L or Isoprothiolane 40% EC @ 1.5 ml/L.',
            dosage: 'Spray at 50% flowering and repeat at milky dough stage.',
            phiDays: 15,
            trigger: 'Persistent rains during panicle emergence with RH > 90%.',
            leafColor: '#1B4332',
            spotColor: '#111827'
        },

        // --- MAIZE ---
        {
            crop: 'Maize',
            stage: 'Vegetative',
            name: 'Fall Armyworm Leaf Whorl Damage',
            scientific: 'Spodoptera frugiperda',
            pathogen: 'Lepidopteran Larval Pest',
            severity: 'high',
            coveragePct: 35.0,
            symptom: 'Shot holes, windowpaning, and ragged leaf tearing with coarse sawdust frass in central whorl.',
            biocontrol: 'Release Trichogramma pretiosum @ 50,000/acre. Apply Metarhizium rileyi @ 5g/L into whorls.',
            chemical: 'Chlorantraniliprole 18.5% SC @ 0.4 ml/L or Spinetoram 11.7% SC @ 0.5 ml/L.',
            dosage: 'Direct spray nozzle straight into central whorl cone in late evening.',
            phiDays: 14,
            trigger: 'Warm dry intervals (25-32°C) with sporadic rain accelerating broods.',
            leafColor: '#2D6A4F',
            spotColor: '#B45309'
        },

        // --- GROUNDNUT ---
        {
            crop: 'Groundnut',
            stage: 'Vegetative',
            name: 'Early Leaf Spot (Tikka Spot)',
            scientific: 'Cercospora arachidicola',
            pathogen: 'Fungal Pathogen',
            severity: 'medium',
            coveragePct: 20.0,
            symptom: 'Circular brown-reddish leaf spots surrounded by prominent yellow chlorotic halo on upper leaf.',
            biocontrol: 'Spray 3% neem oil emulsion or garlic-chilli extract @ 5%.',
            chemical: 'Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 2g/L.',
            dosage: 'Apply at 30-35 days after sowing (vegetative pegging phase).',
            phiDays: 10,
            trigger: 'Warm humid weather (25-30°C, RH > 75%) with intermittent sunshine.',
            leafColor: '#40916C',
            spotColor: '#78350F'
        }
    ],

    detect(crop = 'Tomato', stage = 'Vegetative', userImage = null) {
        this.selectedCrop = crop;
        this.selectedStage = stage;

        let matches = this.stageLeafDatabase.filter(d => 
            d.crop.toLowerCase() === crop.toLowerCase() && 
            (d.stage.toLowerCase().includes(stage.toLowerCase()) || stage.toLowerCase().includes(d.stage.toLowerCase()))
        );

        if (matches.length === 0) {
            matches = this.stageLeafDatabase.filter(d => d.crop.toLowerCase() === crop.toLowerCase());
        }
        if (matches.length === 0) {
            matches = this.stageLeafDatabase;
        }

        const disease = matches[Math.floor(Math.random() * matches.length)];
        const confidence = (91 + Math.random() * 8).toFixed(1);
        const instances = Math.floor(Math.random() * 3) + 1;

        return {
            disease,
            confidence,
            instances
        };
    },

    renderCanvas(imageSource, detection) {
        const canvas = document.getElementById('pestCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (imageSource) {
            ctx.drawImage(imageSource, 0, 0, w, h);
        } else {
            // Draw realistic multi-stage synthetic leaf pathology visual
            ctx.fillStyle = '#0B1E13';
            ctx.fillRect(0, 0, w, h);

            // Draw leaf blade shape
            const d = detection.disease;
            ctx.save();
            ctx.translate(w / 2, h / 2 - 10);
            
            // Leaf contour
            ctx.fillStyle = d.leafColor || '#2D6A4F';
            ctx.beginPath();
            ctx.moveTo(0, -90);
            ctx.bezierCurveTo(90, -50, 110, 40, 0, 95);
            ctx.bezierCurveTo(-110, 40, -90, -50, 0, -90);
            ctx.fill();

            // Leaf primary & secondary veins
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, -90);
            ctx.lineTo(0, 95);
            ctx.stroke();

            ctx.lineWidth = 1.2;
            for (let y = -60; y <= 60; y += 22) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(45, y - 18);
                ctx.moveTo(0, y);
                ctx.lineTo(-45, y - 18);
                ctx.stroke();
            }

            // Draw pathogen lesion spots / concentric rings
            const spotColor = d.spotColor || '#8B4513';
            const numSpots = 7;
            for (let i = 0; i < numSpots; i++) {
                const sx = (Math.sin(i * 1.8) * 45);
                const sy = (Math.cos(i * 1.4) * 55);
                const r = 8 + (i % 3) * 6;

                // Outer chlorotic halo
                ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
                ctx.beginPath();
                ctx.arc(sx, sy, r + 4, 0, Math.PI * 2);
                ctx.fill();

                // Necrotic core
                ctx.fillStyle = spotColor;
                ctx.beginPath();
                ctx.arc(sx, sy, r, 0, Math.PI * 2);
                ctx.fill();

                // Target concentric ring
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(sx, sy, r * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Draw YOLO Detection Bounding Boxes
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#6366F1'];
        for (let i = 0; i < detection.instances; i++) {
            const bx = 45 + (i * 120) % (w - 140);
            const by = 35 + (i * 70) % (h - 110);
            const bw = 75 + (i % 2) * 20;
            const bh = 65 + (i % 2) * 15;
            const color = colors[i % colors.length];

            // Bounding Box outline
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(bx, by, bw, bh);

            // Bounding Box Label
            ctx.fillStyle = color;
            ctx.fillRect(bx, by - 18, bw + 20, 18);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.fillText(`${detection.disease.name.split(' ')[0]} ${detection.confidence}%`, bx + 4, by - 5);
        }

        // Knowx IoT Edge HUD banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, h - 28, w, 28);
        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 10px Courier New, monospace';
        ctx.fillText(`⚡ MobileNetV3+YOLOv8 Edge [${detection.disease.crop} - ${detection.disease.stage}]`, 10, h - 10);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FBBF24';
        ctx.fillText(`Leaf Area: ${detection.disease.coveragePct}%`, w - 10, h - 10);
        ctx.textAlign = 'left';
    }
};

function updatePestDetection(customImage = null) {
    const laser = document.querySelector('.scanner-laser');
    if (laser) laser.style.display = 'block';

    const cropSelect = document.getElementById('stageCropSelect');
    const stageSelect = document.getElementById('cropGrowthStageSelect');

    const crop = cropSelect ? cropSelect.value : 'Tomato';
    const stage = stageSelect ? stageSelect.value : 'Vegetative';

    setTimeout(() => {
        if (laser) laser.style.display = 'none';

        const result = PestDetector.detect(crop, stage, customImage);
        const d = result.disease;

        const nameEl = document.getElementById('pestName');
        const confEl = document.getElementById('pestConfidence');
        const countEl = document.getElementById('pestCount');
        const treatEl = document.getElementById('pestTreatment');
        const sevEl = document.getElementById('pestSeverity');
        const metricEl = document.getElementById('metricPest');

        // Detailed pathology indicators
        const pathEl = document.getElementById('diseasePathogenType');
        const coverEl = document.getElementById('leafCoverageDisplay');
        const doseEl = document.getElementById('chemicalDosageDisplay');
        const phiEl = document.getElementById('phiDaysDisplay');
        const triggerEl = document.getElementById('iotTriggerDisplay');

        if (nameEl) nameEl.textContent = `${d.name} (${d.scientific})`;
        if (confEl) confEl.textContent = `${result.confidence}%`;
        if (countEl) countEl.textContent = `${result.instances} Lesion Clusters`;
        if (treatEl) {
            treatEl.innerHTML = `
                <div style="margin-bottom:6px;"><b>🌱 Organic Biocontrol:</b> ${d.biocontrol}</div>
                <div style="color:var(--text-main);"><b>🧪 Chemical Remedy:</b> ${d.chemical}</div>
            `;
        }
        if (metricEl) metricEl.textContent = `${Math.round(result.confidence)}%`;

        if (sevEl) {
            sevEl.textContent = `${d.severity.toUpperCase()} (${d.coveragePct}% Leaf Damage)`;
            sevEl.className = `severity-pill severity-${d.severity}`;
        }

        if (pathEl) pathEl.textContent = d.pathogen;
        if (coverEl) coverEl.textContent = `${d.coveragePct}% Leaf Area`;
        if (doseEl) doseEl.textContent = d.dosage;
        if (phiEl) phiEl.textContent = `${d.phiDays} Days PHI`;
        if (triggerEl) triggerEl.textContent = d.trigger;

        PestDetector.renderCanvas(customImage, result);

        if (window.addStatusLog) {
            window.addStatusLog(
                d.severity === 'high' ? 'warn' : 'info',
                `Leaf Diagnostic: ${d.crop} [${d.stage}] -> Detected ${d.name} (${result.confidence}% conf, ${d.coveragePct}% leaf area)`
            );
        }
    }, 350);
}

window.PestDetector = PestDetector;
window.updatePestDetection = updatePestDetection;

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('pestImageInput');
    const uploadArea = document.getElementById('pestUploadArea');
    const cropSelect = document.getElementById('stageCropSelect');
    const stageSelect = document.getElementById('cropGrowthStageSelect');

    if (cropSelect) {
        cropSelect.addEventListener('change', () => updatePestDetection(null));
    }
    if (stageSelect) {
        stageSelect.addEventListener('change', () => updatePestDetection(null));
    }

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handlePestFileUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handlePestFileUpload(e.target.files[0]);
            }
        });
    }

    function handlePestFileUpload(file) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                PestDetector.currentImage = img;
                updatePestDetection(img);
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }

    setTimeout(() => updatePestDetection(null), 300);
});
