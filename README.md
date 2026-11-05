# 🌾 CROP RADAR (క్రాప్ రాడార్) — AI Farming Companion for Andhra Pradesh

> **One Application. One Assistant. One Conversation.**  
> An intelligent, multilingual agricultural decision-support and early-warning companion specifically architected for farmers in Andhra Pradesh, India.

---

## 🌟 Core Product Transformation

Crop Radar has been transformed from a multi-page dashboard into a **simple, conversational AI companion**:
- **One Chat Stream:** Farmers never have to hunt through tabs or separate tools.
- **Multimodal Visual Diagnostics:** Upload or snap photographs of crop leaves, stems, or pesticide bottle labels using the same unified controls.
- **Natural Voice-to-Voice Interaction:** Speaks and understands natural Telugu (`te-IN`) with speech recognition, acoustic Telugu text-to-speech, and instant text chat fallback.
- **Strict Telugu Language Fidelity:** When Telugu mode is active, **100% of user-facing content is presented in pure Telugu script** without mixed English sentences or English headings.
- **Deterministic Agricultural Safety:** **Zero AI chemical dosage invention.** Dosages for knapsack sprayers (15L, 16L, 20L) are computed strictly from verified Central Insecticides Board & Registration Committee (CIBRC) labels.
- **Geospatial Early-Warning Proximity Alerts:** Configurable radius (1km, 3km, 5km, 10km, 15km) detecting verified contagious crop diseases near the farmer's land while preserving farm GPS privacy via 1.0 km centroid fuzzing.
- **Live Weather Spray Suitability:** Integrated Open-Meteo evaluations auditing wind drift limits (>15 km/h), rainfastness wash-off, and heat scorch (>34°C).

---

## 🏛️ Architectural Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                   UNIFIED FARMER INTERFACE                       │
│   Next.js 16 | React 19 | Tailwind CSS | Strict TypeScript      │
│   - Header: Brand, Language Toggle (తెలుగు / EN), Location, Settings  │
│   - Feed: Conversational Stream with Inline Contextual Cards     │
│   - Composer: Attach Photo | Open Camera | Text Input | Mic | Send │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│             CENTRAL AI COMPANION ORCHESTRATION LAYER             │
│   /api/unified-assistant & Google AI Studio (Gemini 2.5 Flash)   │
│   - Visual pathology extraction & differential diagnosis         │
│   - Pesticide label OCR entity matching against CIBRC catalog    │
│   - Pure Telugu acoustic translation and conversational synthesis│
└──────────────┬──────────────────┬──────────────────┬─────────────┘
               │                  │                  │
               ▼                  ▼                  ▼
┌───────────────────────┐ ┌──────────────────┐ ┌───────────────────┐
│ DETERMINISTIC DOSAGE  │ │ WEATHER ADVISORY │ │ GEOSPATIAL RADAR  │
│ CIBRC Registered Rates│ │ Open-Meteo REST  │ │ Geohash L6 +      │
│ Knapsack Tank Mixer   │ │ 4 Safety Audits  │ │ 5km Haversine     │
│ IRAC/FRAC MoA Rotation│ │ Rain / Wind Risk │ │ Agronomist Verify │
└───────────────────────┘ └──────────────────┘ └───────────────────┘
```

---

## 🚀 Quick Start & Verification

### Firebase Google Sign-In

Enable Google as a sign-in provider in Firebase Authentication and add the app's local and deployed domains to Authorized domains. Create a Firebase Admin service account with permission to verify Firebase Authentication tokens, then set these server-only variables in `.env.local` (never expose or commit them):

```env
FIREBASE_ADMIN_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=service-account-email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The existing `NEXT_PUBLIC_FIREBASE_*` web configuration remains required for client sign-in. Firestore must be enabled and `firestore.rules` deployed. Sign-in exchanges the Firebase ID token for a five-day HttpOnly session cookie; protected app pages redirect to `/login` when the cookie is missing or invalid.

Verified outbreak alerts require an agronomist account. Add authorized Firebase Auth UIDs to the server-only `.env.local` variable below, or assign the `agronomist: true` custom claim to those accounts:

```env
AGRONOMIST_UIDS=uid-one,uid-two
```

Farmer reports are stored as pending and do not trigger alerts until an authorized agronomist approves them. Approval creates in-app notifications for other farmers whose saved farm locations are within 5 km. The map and notification inbox show the fuzzed report area and crop-specific scouting guidance; they do not expose exact reporter coordinates or invent pesticide dosages.

### Cloudinary Image Uploads

The app uploads selected images through an authenticated server route. Add these server-only variables to `.env.local`; the API secret is never sent to the browser:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Images are uploaded to the `crop-radar` folder with a 10 MB limit. If these values are missing, image analysis still runs, but Cloudinary storage reports an upload warning.

### 1. Run the Core Verification Suite (25 / 25 Passing)
```powershell
npm.cmd run test:engines
```
*Validates weather drift rules, deterministic pesticide calculations, unregistered chemical refusal, Haversine 5km filtering, Geohash L6 indexing, GPS privacy fuzzing, agronomist report verification workflow, resistance MoA audits, crop recovery delta scoring, and 100% Telugu localization coverage across all 13 Andhra Pradesh districts.*

### 2. Build for Production
```powershell
npm.cmd run build
```

### 3. Start Development Server
```powershell
npm.cmd run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📱 User Experience & Features

### 1. Header
- **Brand Logo & Name:** క్రాప్ రాడార్ (CROP RADAR AP).
- **Location Selector:** Displays selected Andhra Pradesh district (e.g. `గుంటూరు, ఆంధ్రప్రదేశ్`) and opens the farm location setup modal.
- **History Drawer:** Quick slide-over timeline of past observations.
- **Settings & Outbreak Radius:** Allows farmer to configure alert perimeter (1 km, 3 km, 5 km, 10 km, 15 km) and gives authorized experts access to the **Agronomist Verification Console**.
- **Language Switcher:** Instant one-tap toggle between **తెలుగు** and **English**.

### 2. Unified Message Composer (Bottom Controls)
1. 📎 **Attachment Button:** Upload crop photograph or pesticide bottle label.
2. 📷 **Camera Button:** Opens device camera with live viewfinder and snap controls.
3. 💬 **Text Input:** Type questions in Telugu or English.
4. 🎙️ **Microphone Button:** Voice-to-voice conversation with pulsing waveform and audio synthesis playback.
5. 🚀 **Send Button:** Submits the query.

### 3. Inline Contextual Cards
- **`crop_diagnosis` Card:** Primary suspect, scientific name, visual match percentage, observed symptom bullets, differential diagnoses, visual severity, uncertainty disclaimer, next steps.
- **`pesticide_treatment` Card:** CIBRC product name, active ingredient, exact dosage per 16L tank, total field formulation, step-by-step arithmetic, FRAC/IRAC rotation warning, PHI days, PPE checklist.
- **`weather_spray` Card:** Temperature, wind speed, relative humidity, spray suitability badge (OPTIMAL / MARGINAL / PROHIBITED), safe spray recommendation.
- **`disease_outbreak_alert` Card:** Proximity distance (km), verified contagious disease, recommended preventive scouting steps.
- **`crop_history` Card:** Historical timeline snapshots.

---

## 🔒 Security & Privacy Guarantees

- **Location Privacy:** The farmer's high-precision GPS coordinates are stored privately. Public community reports are fuzzed to 1.0 km centroid grids (`fuzzCoordinatesToGrid`).
- **Pesticide Safety Invariant:** Gemini is strictly forbidden from guessing chemical quantities. Calculations are derived deterministically from CIBRC verified registrations; unregistered applications are refused.
- **Verification Gate:** AI predictions never trigger public outbreak notifications automatically. Reports require expert verification via the verification workflow before broadcasting.
