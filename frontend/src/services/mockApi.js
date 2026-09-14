/**
 * AERO-QC Machine Vision Inspection Services - Mock & Integration API Layer
 * 
 * Target Backend: FastAPI REST Service (Member 4 - Aryan)
 * Endpoints mirrored:
 *   - POST /api/v1/inspect (predict)
 *   - GET  /api/v1/history
 *   - GET  /api/v1/stats
 *   - GET  /api/v1/health
 * 
 * Response Contract for inspection:
 * {
 *   verdict: "PASS" | "FAIL" | "REVIEW",
 *   label: "OK" | "DEFECT",
 *   confidence: float,
 *   defect_region: string,
 *   anomaly_score: float,
 *   overlay_image_url: string
 * }
 */

// Use the local FastAPI service and the trained PatchCore model by default.
// Set to true only when demonstrating the UI without the backend running.
export const USE_MOCK = false;
export const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

const toApiUrl = (path) => path?.startsWith('/') ? `http://127.0.0.1:8000${path}` : path;

async function dataUrlToPngBlob(dataUrl) {
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error('Unable to prepare the sample image for inspection.'));
    image.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d').drawImage(image, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('Unable to create a PNG inspection sample.')),
    'image/png',
  ));
}

/**
 * Helper to generate procedural SVG data URIs for industrial test components
 * Provides realistic visual assets (fan blade, motor housing, metal nut, screw)
 * with authentic surface textures, defect markings, and OpenCV-style Jet heatmaps.
 */
function createComponentSvg({ type, defect = null, overlay = false }) {
  const width = 400;
  const height = 400;

  if (type === 'fan_blade') {
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bladeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#475569" />
            <stop offset="50%" stop-color="#64748b" />
            <stop offset="100%" stop-color="#334155" />
          </linearGradient>
          <radialGradient id="anomalyJet" cx="35%" cy="25%" r="28%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.85" />
            <stop offset="40%" stop-color="#f59e0b" stop-opacity="0.6" />
            <stop offset="70%" stop-color="#3b82f6" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#1e293b" stroke-width="0.5" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="#1e293b" stroke-width="0.5" />
          </pattern>
        </defs>
        <rect width="${width}" height="${height}" fill="#0f172a" />
        <rect width="${width}" height="${height}" fill="url(#grid)" opacity="0.6" />
        
        <!-- Calibration Reticle Marks -->
        <circle cx="200" cy="200" r="180" stroke="#334155" stroke-width="1" fill="none" stroke-dasharray="4,4" />
        
        <!-- Ceiling Fan Aerodynamic Blade Profile -->
        <path d="M 90 320 C 110 240, 120 140, 150 90 C 180 50, 290 40, 310 110 C 330 180, 260 260, 180 330 Z" 
              fill="url(#bladeMetal)" stroke="#94a3b8" stroke-width="2" />
        <line x1="140" y1="120" x2="160" y2="300" stroke="#cbd5e1" stroke-width="1.5" opacity="0.4" />
        
        <!-- Surface texture grooves -->
        <path d="M 170 110 C 220 100, 270 130, 260 200" stroke="#1e293b" stroke-width="1" fill="none" opacity="0.5" />
        <path d="M 150 180 C 190 170, 240 190, 230 250" stroke="#1e293b" stroke-width="1" fill="none" opacity="0.5" />
        
        ${defect === 'scratch_top_left' ? `
          <!-- Paint Scratch Defect -->
          <path d="M 140 100 Q 155 125 170 115 T 195 140" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" />
          <path d="M 142 102 Q 157 127 172 117 T 197 142" stroke="#ef4444" stroke-width="1.5" fill="none" opacity="0.8" />
        ` : ''}

        ${defect === 'reflection_ambiguous' ? `
          <!-- Specular Glint / Ambiguous Lighting Flare -->
          <ellipse cx="230" cy="160" rx="35" ry="18" transform="rotate(-25 230 160)" fill="#ffffff" opacity="0.75" />
        ` : ''}

        ${overlay && defect === 'scratch_top_left' ? `
          <!-- Anomaly Reconstruction Error Heatmap & Bounding Box -->
          <rect x="120" y="80" width="100" height="80" rx="4" fill="url(#anomalyJet)" />
          <rect x="125" y="85" width="90" height="70" fill="none" stroke="#ff3b30" stroke-width="2" stroke-dasharray="6,3" />
          <rect x="125" y="65" width="130" height="18" fill="#ff3b30" rx="2" />
          <text x="130" y="78" fill="#ffffff" font-family="monospace" font-size="10" font-weight="bold">DEFECT: SCRATCH [0.082]</text>
        ` : ''}

        ${overlay && defect === 'reflection_ambiguous' ? `
          <!-- Anomaly Heatmap without Classification Agreement (Review) -->
          <ellipse cx="230" cy="160" rx="40" ry="24" transform="rotate(-25 230 160)" fill="#fbbf24" opacity="0.45" />
          <rect x="180" y="130" width="100" height="60" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4" />
          <rect x="180" y="112" width="120" height="16" fill="#f59e0b" rx="2" />
          <text x="185" y="124" fill="#000" font-family="monospace" font-size="9" font-weight="bold">ANOMALY SPIKE: 0.048</text>
        ` : ''}

        <text x="15" y="385" fill="#64748b" font-family="monospace" font-size="11">QC_INSP_OPTIC // BLADE_GEO_V4 // ${type.toUpperCase()}</text>
      </svg>
    `)}`;
  }

  if (type === 'motor_housing') {
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <radialGradient id="housingGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#64748b" />
            <stop offset="70%" stop-color="#334155" />
            <stop offset="100%" stop-color="#1e293b" />
          </radialGradient>
          <radialGradient id="pitJet" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9" />
            <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.6" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="#0b111e" />
        
        <!-- Motor Stator / Cast Housing -->
        <circle cx="200" cy="200" r="140" fill="url(#housingGrad)" stroke="#475569" stroke-width="3" />
        <circle cx="200" cy="200" r="90" fill="#1e293b" stroke="#334155" stroke-width="2" />
        <circle cx="200" cy="200" r="35" fill="#0f172a" stroke="#64748b" stroke-width="2" />
        
        <!-- Bolt Holes -->
        <circle cx="200" cy="90" r="8" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" />
        <circle cx="200" cy="310" r="8" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" />
        <circle cx="90" cy="200" r="8" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" />
        <circle cx="310" cy="200" r="8" fill="#0f172a" stroke="#94a3b8" stroke-width="1.5" />

        ${defect === 'pit_void' ? `
          <!-- Casting Pit / Void Defect -->
          <ellipse cx="235" cy="165" rx="9" ry="7" fill="#000000" stroke="#b91c1c" stroke-width="2" />
          <circle cx="242" cy="172" r="3" fill="#000000" />
        ` : ''}

        ${overlay && defect === 'pit_void' ? `
          <circle cx="235" cy="165" r="35" fill="url(#pitJet)" />
          <rect x="205" y="135" width="60" height="60" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,2" />
          <rect x="205" y="118" width="105" height="15" fill="#ef4444" rx="2" />
          <text x="208" y="129" fill="#ffffff" font-family="monospace" font-size="9" font-weight="bold">VOID: PIT [0.074]</text>
        ` : ''}

        <text x="15" y="385" fill="#64748b" font-family="monospace" font-size="11">QC_INSP_OPTIC // MOTOR_STATOR // DIE_CAST_ALUM</text>
      </svg>
    `)}`;
  }

  // Fallback / MVTec AD Metal Nut Category
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <radialGradient id="nutGrad" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#94a3b8" />
          <stop offset="60%" stop-color="#475569" />
          <stop offset="100%" stop-color="#1e293b" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#0f172a" />
      <polygon points="200,60 320,130 320,270 200,340 80,270 80,130" fill="url(#nutGrad)" stroke="#cbd5e1" stroke-width="2" />
      <circle cx="200" cy="200" r="65" fill="#0b111e" stroke="#64748b" stroke-width="2" />
      <circle cx="200" cy="200" r="55" fill="none" stroke="#334155" stroke-width="1.5" stroke-dasharray="5,3" />

      ${defect === 'thread_burr' ? `
        <!-- Thread Pitch Burr Defect -->
        <polygon points="148,190 142,205 152,210" fill="#f87171" stroke="#dc2626" stroke-width="1.5" />
      ` : ''}

      ${overlay && defect === 'thread_burr' ? `
        <circle cx="146" cy="200" r="28" fill="#ef4444" opacity="0.55" />
        <rect x="125" y="175" width="45" height="50" fill="none" stroke="#ef4444" stroke-width="2" />
        <rect x="95" y="155" width="105" height="16" fill="#ef4444" rx="2" />
        <text x="98" y="167" fill="#fff" font-family="monospace" font-size="9" font-weight="bold">THREAD BURR [0.088]</text>
      ` : ''}

      <text x="15" y="385" fill="#64748b" font-family="monospace" font-size="11">QC_INSP_OPTIC // MVTEC_AD // METAL_NUT_HEX</text>
    </svg>
  `)}`;
}

/**
 * Pre-calibrated sample library for instant factory floor testing and camera presets.
 */
export const SAMPLE_COMPONENTS = [
  {
    id: 'SMP-01',
    name: 'Ceiling Fan Blade (Top Surface Scratch)',
    category: 'fan_blade',
    defectKey: 'scratch_top_left',
    originalUrl: createComponentSvg({ type: 'fan_blade', defect: 'scratch_top_left', overlay: false }),
    overlayUrl: createComponentSvg({ type: 'fan_blade', defect: 'scratch_top_left', overlay: true }),
    simulatedResult: {
      verdict: 'FAIL',
      label: 'DEFECT',
      confidence: 0.962,
      defect_region: 'Top-Left Leading Rim (X: 140, Y: 100) — Deep Paint Scratch',
      anomaly_score: 0.0824,
      overlay_image_url: '' // populated dynamically
    }
  },
  {
    id: 'SMP-02',
    name: 'Ceiling Fan Blade (Compliant Production)',
    category: 'fan_blade',
    defectKey: null,
    originalUrl: createComponentSvg({ type: 'fan_blade', defect: null, overlay: false }),
    overlayUrl: createComponentSvg({ type: 'fan_blade', defect: null, overlay: false }),
    simulatedResult: {
      verdict: 'PASS',
      label: 'OK',
      confidence: 0.984,
      defect_region: 'None (Uniform Surface Profile)',
      anomaly_score: 0.0089,
      overlay_image_url: ''
    }
  },
  {
    id: 'SMP-03',
    name: 'Motor Stator Housing (Casting Pit / Void)',
    category: 'motor_housing',
    defectKey: 'pit_void',
    originalUrl: createComponentSvg({ type: 'motor_housing', defect: 'pit_void', overlay: false }),
    overlayUrl: createComponentSvg({ type: 'motor_housing', defect: 'pit_void', overlay: true }),
    simulatedResult: {
      verdict: 'FAIL',
      label: 'DEFECT',
      confidence: 0.915,
      defect_region: 'Center Mounting Flange (X: 235, Y: 165) — Subsurface Casting Void',
      anomaly_score: 0.0742,
      overlay_image_url: ''
    }
  },
  {
    id: 'SMP-04',
    name: 'Fan Blade (Specular Reflection / Anomaly Discrepancy)',
    category: 'fan_blade',
    defectKey: 'reflection_ambiguous',
    originalUrl: createComponentSvg({ type: 'fan_blade', defect: 'reflection_ambiguous', overlay: false }),
    overlayUrl: createComponentSvg({ type: 'fan_blade', defect: 'reflection_ambiguous', overlay: true }),
    simulatedResult: {
      verdict: 'REVIEW',
      label: 'OK',
      confidence: 0.765,
      defect_region: 'Mid-Span Upper Arc (X: 230, Y: 160) — Specular Lighting Glint vs Subtle Pinhole',
      anomaly_score: 0.0485,
      overlay_image_url: ''
    }
  },
  {
    id: 'SMP-05',
    name: 'MVTec AD Metal Nut (Thread Pitch Burr)',
    category: 'metal_nut',
    defectKey: 'thread_burr',
    originalUrl: createComponentSvg({ type: 'metal_nut', defect: 'thread_burr', overlay: false }),
    overlayUrl: createComponentSvg({ type: 'metal_nut', defect: 'thread_burr', overlay: true }),
    simulatedResult: {
      verdict: 'FAIL',
      label: 'DEFECT',
      confidence: 0.948,
      defect_region: 'Inner Bore Thread Rim (X: 146, Y: 200) — Metal Extrusion Burr',
      anomaly_score: 0.0881,
      overlay_image_url: ''
    }
  }
];

// Populate overlay URLs
SAMPLE_COMPONENTS.forEach(sample => {
  sample.simulatedResult.overlay_image_url = sample.overlayUrl;
});

/**
 * Historical inspection dataset seeded with realistic production trends.
 * Specifically reflects the pattern:
 * "9 of 14 FAILs this week were paint scratches near the top-left edge"
 */
let mockHistoryDatabase = [
  {
    inspection_id: 'INSP-20260906-8801',
    timestamp: '2026-09-06T10:48:12Z',
    category: 'fan_blade',
    filename: 'blade_batchB_088.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.965,
    defect_region: 'Top-Left Rim (X: 140, Y: 100) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0841,
    threshold: 0.0250,
    inference_time_ms: 38.2,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Confirmed spray nozzle misalignment on Line A'
  },
  {
    inspection_id: 'INSP-20260906-8800',
    timestamp: '2026-09-06T10:32:44Z',
    category: 'fan_blade',
    filename: 'blade_batchB_087.png',
    verdict: 'PASS',
    label: 'OK',
    confidence: 0.988,
    defect_region: 'None',
    defect_type: 'None',
    anomaly_score: 0.0092,
    threshold: 0.0250,
    inference_time_ms: 36.4,
    original_image_url: SAMPLE_COMPONENTS[1].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[1].overlayUrl,
    inspector_notes: 'Approved standard cycle'
  },
  {
    inspection_id: 'INSP-20260906-8799',
    timestamp: '2026-09-06T09:55:10Z',
    category: 'fan_blade',
    filename: 'blade_batchB_086.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.971,
    defect_region: 'Top-Left Rim (X: 138, Y: 104) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0863,
    threshold: 0.0250,
    inference_time_ms: 39.1,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Recurring defect signature'
  },
  {
    inspection_id: 'INSP-20260906-8798',
    timestamp: '2026-09-06T09:12:05Z',
    category: 'motor_housing',
    filename: 'housing_cast_112.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.923,
    defect_region: 'Center Flange (X: 235, Y: 165) — Casting Void',
    defect_type: 'Casting Pit / Void',
    anomaly_score: 0.0755,
    threshold: 0.0250,
    inference_time_ms: 42.0,
    original_image_url: SAMPLE_COMPONENTS[2].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[2].overlayUrl,
    inspector_notes: 'Foundry batch porosity issue'
  },
  {
    inspection_id: 'INSP-20260905-8797',
    timestamp: '2026-09-05T16:40:19Z',
    category: 'fan_blade',
    filename: 'blade_batchB_085.png',
    verdict: 'REVIEW',
    label: 'OK',
    confidence: 0.742,
    defect_region: 'Mid-Span Upper Arc — Specular Lighting Glint',
    defect_type: 'Lighting / Specular Flare',
    anomaly_score: 0.0489,
    threshold: 0.0250,
    inference_time_ms: 37.8,
    original_image_url: SAMPLE_COMPONENTS[3].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[3].overlayUrl,
    inspector_notes: 'Classifier called OK, Autoencoder anomaly spike. Manual QC cleared as lighting glare.'
  },
  {
    inspection_id: 'INSP-20260905-8796',
    timestamp: '2026-09-05T15:20:01Z',
    category: 'fan_blade',
    filename: 'blade_batchB_084.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.958,
    defect_region: 'Top-Left Rim (X: 142, Y: 98) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0815,
    threshold: 0.0250,
    inference_time_ms: 36.9,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Top-left cluster item #3'
  },
  {
    inspection_id: 'INSP-20260905-8795',
    timestamp: '2026-09-05T14:10:45Z',
    category: 'fan_blade',
    filename: 'blade_batchB_083.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.963,
    defect_region: 'Top-Left Rim (X: 139, Y: 102) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0832,
    threshold: 0.0250,
    inference_time_ms: 38.4,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Top-left cluster item #4'
  },
  {
    inspection_id: 'INSP-20260905-8794',
    timestamp: '2026-09-05T13:00:20Z',
    category: 'fan_blade',
    filename: 'blade_batchB_082.png',
    verdict: 'PASS',
    label: 'OK',
    confidence: 0.991,
    defect_region: 'None',
    defect_type: 'None',
    anomaly_score: 0.0078,
    threshold: 0.0250,
    inference_time_ms: 35.8,
    original_image_url: SAMPLE_COMPONENTS[1].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[1].overlayUrl,
    inspector_notes: 'Flawless paint adhesion'
  },
  {
    inspection_id: 'INSP-20260905-8793',
    timestamp: '2026-09-05T11:45:00Z',
    category: 'fan_blade',
    filename: 'blade_batchB_081.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.970,
    defect_region: 'Top-Left Rim (X: 145, Y: 96) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0855,
    threshold: 0.0250,
    inference_time_ms: 37.2,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Top-left cluster item #5'
  },
  {
    inspection_id: 'INSP-20260904-8792',
    timestamp: '2026-09-04T17:15:30Z',
    category: 'metal_nut',
    filename: 'hex_nut_batchA_021.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.945,
    defect_region: 'Thread Pitch (X: 146, Y: 200) — Thread Burr',
    defect_type: 'Thread Burr',
    anomaly_score: 0.0877,
    threshold: 0.0250,
    inference_time_ms: 39.5,
    original_image_url: SAMPLE_COMPONENTS[4].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[4].overlayUrl,
    inspector_notes: 'Threading tap tool worn out'
  },
  {
    inspection_id: 'INSP-20260904-8791',
    timestamp: '2026-09-04T15:30:11Z',
    category: 'fan_blade',
    filename: 'blade_batchB_080.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.961,
    defect_region: 'Top-Left Rim (X: 141, Y: 99) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0820,
    threshold: 0.0250,
    inference_time_ms: 38.0,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Top-left cluster item #6'
  },
  {
    inspection_id: 'INSP-20260904-8790',
    timestamp: '2026-09-04T14:12:44Z',
    category: 'fan_blade',
    filename: 'blade_batchB_079.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.957,
    defect_region: 'Top-Left Rim (X: 137, Y: 105) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0839,
    threshold: 0.0250,
    inference_time_ms: 37.1,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Top-left cluster item #7'
  },
  {
    inspection_id: 'INSP-20260904-8789',
    timestamp: '2026-09-04T11:05:12Z',
    category: 'fan_blade',
    filename: 'blade_batchB_078.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.968,
    defect_region: 'Top-Left Rim (X: 143, Y: 101) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0848,
    threshold: 0.0250,
    inference_time_ms: 38.6,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Top-left cluster item #8'
  },
  {
    inspection_id: 'INSP-20260903-8788',
    timestamp: '2026-09-03T16:22:01Z',
    category: 'fan_blade',
    filename: 'blade_batchB_077.png',
    verdict: 'FAIL',
    label: 'DEFECT',
    confidence: 0.964,
    defect_region: 'Top-Left Rim (X: 139, Y: 97) — Paint Scratch',
    defect_type: 'Paint Scratch',
    anomaly_score: 0.0819,
    threshold: 0.0250,
    inference_time_ms: 36.7,
    original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
    overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
    inspector_notes: 'Top-left cluster item #9'
  }
];

/**
 * Model benchmark metrics comparing Classification vs Localization
 * Prepared for Screen 3 (Model Comparison View)
 */
export const MODEL_METRICS = {
  classification: {
    model_name: 'ResNet-50 Classifier (Supervised Baseline)',
    framework: 'PyTorch 2.1.2 + Torchvision',
    input_resolution: '224x224x3 RGB',
    accuracy: 94.8,
    precision: 92.1,
    recall: 96.4,
    f1_score: 94.2,
    roc_auc: 0.978,
    inference_time_ms: 14.2,
    description: 'Trained on binary labeled defect/good samples. High sensitivity for macro defects, but cannot isolate spatial coordinates without Grad-CAM.'
  },
  localization: {
    model_name: 'PyTorch CNN Autoencoder (Reconstruction Anomaly)',
    framework: 'PyTorch 2.1.2 Custom AutoEncoder',
    input_resolution: '128x128x3 RGB (Reconstruction MSE)',
    iou: 0.842,
    map50: 0.887,
    anomaly_auroc: 0.965,
    threshold: 0.0250,
    inference_time_ms: 28.5,
    description: 'Trained strictly on PASS normal surfaces. Computes per-pixel reconstruction difference maps and OpenCV Jet heatmaps for spatial localization.'
  },
  category_breakdown: [
    { category: 'fan_blade (Painted Surface)', classifier_f1: 95.2, localization_auroc: 97.1, total_samples: 320 },
    { category: 'motor_housing (Cast Aluminum)', classifier_f1: 93.6, localization_auroc: 95.8, total_samples: 280 },
    { category: 'metal_nut (MVTec AD Public)', classifier_f1: 96.0, localization_auroc: 96.9, total_samples: 240 },
    { category: 'screw / fastener (MVTec AD)', classifier_f1: 94.1, localization_auroc: 94.8, total_samples: 190 }
  ],
  latency_breakdown: {
    camera_capture_ms: 12.0,
    preprocessing_tensor_ms: 4.5,
    classification_infer_ms: 14.2,
    autoencoder_infer_ms: 28.5,
    heatmap_fusion_ms: 6.8,
    total_pipeline_ms: 66.0
  }
};

/**
 * Curated failure case studies for Screen 4 (Failure Analysis View)
 * Explicitly structures the two known failure modes:
 * 1) Small Defect Missed
 * 2) Lighting & Specular Reflection Variation
 */
export const FAILURE_CASES = [
  {
    case_id: 'FC-01',
    mode: 'small-defect-missed',
    title: 'Micro-Hairline Scratch on Anodized Blade Tip',
    component: 'Ceiling Fan Blade (Batch B-04)',
    image_url: createComponentSvg({ type: 'fan_blade', defect: 'scratch_top_left', overlay: false }),
    heatmap_url: createComponentSvg({ type: 'fan_blade', defect: 'scratch_top_left', overlay: true }),
    ground_truth: 'FAIL (Defective)',
    classifier_result: { verdict: 'OK', confidence: 0.61 },
    localization_result: { anomaly_score: 0.021, threshold: 0.025 },
    fused_verdict: 'PASS (False Negative)',
    what_went_wrong: 'Scratch thickness was ~2 pixels wide (sub-millimeter). Due to 128x128 downsampling in the autoencoder bottleneck, reconstruction MSE was smoothed over adjacent pixels and fell just beneath the 0.0250 threshold.',
    inspector_recommendation: 'Increase input tensor resolution to 256x256 or implement patch-based PatchCore feature extraction to capture micro-texture discrepancies.'
  },
  {
    case_id: 'FC-02',
    mode: 'small-defect-missed',
    title: 'Subsurface Micro-Pin Pores in Cast Housing',
    component: 'Motor Stator Housing (Cast Aluminum)',
    image_url: createComponentSvg({ type: 'motor_housing', defect: 'pit_void', overlay: false }),
    heatmap_url: createComponentSvg({ type: 'motor_housing', defect: 'pit_void', overlay: true }),
    ground_truth: 'FAIL (Defective)',
    classifier_result: { verdict: 'OK', confidence: 0.78 },
    localization_result: { anomaly_score: 0.023, threshold: 0.025 },
    fused_verdict: 'PASS (False Negative)',
    what_went_wrong: 'The pin pore was isolated and under 5 pixels in area. The baseline ResNet-50 classified the housing as OK with 78% confidence because macro geometry was compliant.',
    inspector_recommendation: 'Add high-magnification multi-angle ring illumination at Inspection Station 02.'
  },
  {
    case_id: 'FC-03',
    mode: 'lighting-variation',
    title: 'High-Gloss Specular Flare Misidentified as Paint Coating Peel',
    component: 'Painted Ceiling Fan Blade (Gloss White)',
    image_url: createComponentSvg({ type: 'fan_blade', defect: 'reflection_ambiguous', overlay: false }),
    heatmap_url: createComponentSvg({ type: 'fan_blade', defect: 'reflection_ambiguous', overlay: true }),
    ground_truth: 'PASS (Flawless surface)',
    classifier_result: { verdict: 'OK', confidence: 0.81 },
    localization_result: { anomaly_score: 0.048, threshold: 0.025 },
    fused_verdict: 'REVIEW (Model Disagreement)',
    what_went_wrong: 'Overhead factory fluorescent tube created an intense specular hotspot. The autoencoder was unable to reconstruct saturated white pixels, yielding high MSE error (0.048) despite the classifier seeing no structural defect.',
    inspector_recommendation: 'Use cross-polarizing lens filter on inspection optics to eliminate surface reflections, and calibrate ambient light normalization.'
  },
  {
    case_id: 'FC-04',
    mode: 'lighting-variation',
    title: 'Shadow Gradient Caused by Overhead Conveyor Gantry',
    component: 'Motor Housing Flange (Line 2)',
    image_url: createComponentSvg({ type: 'motor_housing', defect: null, overlay: false }),
    heatmap_url: createComponentSvg({ type: 'motor_housing', defect: 'pit_void', overlay: true }),
    ground_truth: 'PASS (Compliant part)',
    classifier_result: { verdict: 'DEFECT', confidence: 0.59 },
    localization_result: { anomaly_score: 0.038, threshold: 0.025 },
    fused_verdict: 'REVIEW (Low confidence defect call)',
    what_went_wrong: 'Conveyor hanger cast a diagonal shadow across the flange. Contrast change was misconstrued by both engines as an anomalous dark inclusion or missing material.',
    inspector_recommendation: 'Enclose inspection chamber with diffused dome illumination to ensure uniform shadow-free lighting.'
  }
];

/**
 * Primary Mock API Service Class
 * Mirrors real backend contracts
 */
export const inspectionApi = {
  /**
   * Run automated inspection on an uploaded image file or component data
   * Implements simulated 1.2s realistic factory network/GPU inference latency
   */
  async predict(imageData, category = 'fan_blade') {
    if (!USE_MOCK) {
      // Real backend integration with Member 4 FastAPI server
      const formData = new FormData();
      if (imageData instanceof File) {
        formData.append('file', imageData);
      } else if (imageData.blob) {
        formData.append('file', imageData.blob, 'inspection.png');
      } else if (imageData?.originalUrl) {
        // Built-in demo samples are SVG data URLs. Rasterize them so Pillow can
        // process them through the exact same FastAPI/PatchCore route as uploads.
        const sampleBlob = await dataUrlToPngBlob(imageData.originalUrl);
        formData.append('file', sampleBlob, `${imageData.id || 'sample'}.png`);
      } else {
        throw new Error('Select an image or a sample component before inspection.');
      }
      formData.append('category', category);

      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Inference service error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        ...data,
        original_image_url: toApiUrl(data.original_image_url),
        overlay_image_url: toApiUrl(data.overlay_image_url || data.defect_heatmap_url),
        defect_heatmap_url: toApiUrl(data.defect_heatmap_url),
      };
    }

    // SIMULATED INFERENCE LATENCY (1200ms)
    await new Promise(resolve => setTimeout(resolve, 1200));

    // If an existing sample was passed, use its signature
    if (imageData && imageData.simulatedResult) {
      const result = {
        ...imageData.simulatedResult,
        original_image_url: imageData.originalUrl,
        inspection_id: `INSP-${Date.now().toString().slice(-6)}`
      };

      // Add to session history
      mockHistoryDatabase.unshift({
        inspection_id: result.inspection_id,
        timestamp: new Date().toISOString(),
        category: imageData.category || category,
        filename: `${imageData.category || 'component'}_${Date.now().toString().slice(-4)}.png`,
        verdict: result.verdict,
        label: result.label,
        confidence: result.confidence,
        defect_region: result.defect_region,
        defect_type: result.defect_region.includes('Scratch') ? 'Paint Scratch' : 
                     result.defect_region.includes('Void') ? 'Casting Pit / Void' :
                     result.defect_region.includes('Glint') ? 'Lighting / Specular Flare' :
                     result.defect_region.includes('Burr') ? 'Thread Burr' : 'None',
        anomaly_score: result.anomaly_score,
        threshold: 0.0250,
        inference_time_ms: 38.5,
        original_image_url: imageData.originalUrl,
        overlay_image_url: imageData.overlayUrl,
        inspector_notes: 'Real-time camera station evaluation'
      });

      return result;
    }

    // Default simulation for newly uploaded arbitrary files
    const isDefect = Math.random() > 0.4;
    const isDisagreement = Math.random() > 0.75;
    
    let verdict = isDefect ? 'FAIL' : 'PASS';
    let label = isDefect ? 'DEFECT' : 'OK';
    let anomaly_score = isDefect ? 0.065 + Math.random() * 0.03 : 0.012 + Math.random() * 0.008;

    if (isDisagreement) {
      verdict = 'REVIEW';
      // Model 1 says OK, Model 2 detects anomaly
      label = 'OK';
      anomaly_score = 0.042;
    }

    const mockResult = {
      verdict: verdict,
      label: label,
      confidence: 0.88 + Math.random() * 0.1,
      defect_region: verdict === 'PASS' ? 'None (Clean Surface)' : 
                     verdict === 'REVIEW' ? 'Station Check: Classifier OK vs Anomaly Spike (0.042) — Review Required' :
                     'Leading Outer Flange (X: 165, Y: 120) — Paint Scratch Defect',
      anomaly_score: parseFloat(anomaly_score.toFixed(4)),
      overlay_image_url: SAMPLE_COMPONENTS[0].overlayUrl,
      original_image_url: SAMPLE_COMPONENTS[0].originalUrl,
      inspection_id: `INSP-${Date.now().toString().slice(-6)}`
    };

    return mockResult;
  },

  /**
   * Fetch historical inspection records with filters
   */
  async getHistory(filters = {}) {
    if (!USE_MOCK) {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      const res = await fetch(`${API_BASE_URL}/history?${params.toString()}`);
      return await res.json();
    }

    // Simulated network delay (200ms)
    await new Promise(resolve => setTimeout(resolve, 200));

    let items = [...mockHistoryDatabase];

    if (filters.verdict && filters.verdict !== 'ALL') {
      items = items.filter(item => item.verdict === filters.verdict);
    }

    if (filters.defect_type && filters.defect_type !== 'ALL') {
      items = items.filter(item => item.defect_type === filters.defect_type);
    }

    if (filters.category && filters.category !== 'ALL') {
      items = items.filter(item => item.category === filters.category);
    }

    return {
      total_count: items.length,
      items: items,
      pattern_insight: "9 of 14 FAILs this week were paint scratches near the top-left edge (Station 04 - Fan Blade Line A)."
    };
  },

  /**
   * Fetch system health & hardware stats
   */
  async getHealth() {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await res.json();
    }

    return {
      status: 'OPERATIONAL',
      service_name: 'AERO-QC Machine Vision Engine',
      version: '1.2.0',
      pytorch_version: '2.1.2+cu121',
      device: 'NVIDIA RTX 4090 (CUDA:0)',
      active_threshold: 0.0250,
      loaded_models: ['ResNet-50-Classifier', 'PyTorch-AutoEncoder-V3']
    };
  },

  /**
   * Fetch inspection & model benchmark metrics
   */
  async getStats() {
    if (!USE_MOCK) {
      const res = await fetch(`${API_BASE_URL}/stats`);
      return await res.json();
    }

    const total = mockHistoryDatabase.length;
    const passed = mockHistoryDatabase.filter(d => d.verdict === 'PASS').length;
    const failed = mockHistoryDatabase.filter(d => d.verdict === 'FAIL').length;
    const review = mockHistoryDatabase.filter(d => d.verdict === 'REVIEW').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    const failRate = total > 0 ? (((failed + review) / total) * 100).toFixed(1) : '0.0';

    return {
      total_inspections: total,
      passed_count: passed,
      failed_count: failed,
      review_count: review,
      pass_rate: parseFloat(passRate),
      fail_rate: parseFloat(failRate),
      avg_inference_ms: 38.2,
      classifier_accuracy: 94.8,
      classifier_latency: 14.2,
      anomaly_threshold: 0.0250,
      anomaly_fpr: 3.8,
      anomaly_latency: 28.5,
      agreement_rate: 91.4,
    };
  },

  /**
   * Alias for predict to support inspect() callers
   */
  async inspect(imageData, category = 'fan_blade') {
    return this.predict(imageData, category);
  }
};
