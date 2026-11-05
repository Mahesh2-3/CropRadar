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
│   /api/unified-assistant & Google AI Studio (Gemini)             │
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

Nearby outbreak notifications are sent immediately after a signed-in farmer reports a disease; agronomist approval is not required to send them. An eligible image diagnosis also sends an AI-assisted notice when the visual match is at least 70%, additional image angles are not requested, and the suspected pathogen is fungal, bacterial, viral, or a pest. These notices are explicitly marked as not field-verified and should be treated as a reason to scout, not a confirmed outbreak. Other farmers with saved farm locations within 5 km receive in-app notifications. Exact reporter coordinates remain private.

The optional agronomist setting below is only for the separate report-review workflow; it is not required to submit a report or notify nearby farmers. Add authorized Firebase Auth UIDs to the server-only `.env.local` variable, or assign the `agronomist: true` custom claim to those accounts:

```env
AGRONOMIST_UIDS=uid-one,uid-two
```

Reports are stored with their verification status, and agronomists may still review them. The map and notification inbox show the fuzzed report area and crop-specific scouting guidance; they do not expose exact reporter coordinates or invent pesticide dosages.

### Cloudinary Image Uploads

The app uploads selected images through an authenticated server route. Add these server-only variables to `.env.local`; the API secret is never sent to the browser:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Images are uploaded to the `crop-radar` folder with a 10 MB limit. If these values are missing, image analysis still runs, but Cloudinary storage reports an upload warning.

### Deploy to Vercel

1. Push the project to GitHub and import the repository in Vercel. Keep the project root at the repository root and use the detected Next.js framework settings (`npm install` and `npm run build`).
2. In **Project Settings → Environment Variables**, add the values from `.env.local.example` for Production and any Preview environments you plan to use. Do not upload `.env` or `.env.local`. `NEXT_PUBLIC_*` Firebase web settings are included in browser code; Gemini, Firebase Admin, and Cloudinary credentials must remain server-only.
3. Before deploying, rotate any Gemini or Firebase Admin credentials that have been shared or copied into a sample file. Generate a dedicated Firebase Admin service-account key and enter its project ID, client email, and private key as `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY`. For the private key, preserve the line breaks or enter them as `\n`; the server converts escaped newlines. Do not set `GOOGLE_APPLICATION_CREDENTIALS` to a local file path on Vercel.
4. In Firebase Authentication, enable Google sign-in and add the Vercel production domain (and any Preview domains used for testing) to **Authorized domains**. Enable Firestore and deploy `firestore.rules` and `firestore.indexes.json` to the same Firebase project.
5. Optionally set `AGRONOMIST_UIDS` to comma-separated Firebase Auth UIDs authorized to approve outbreak reports. Add the three `CLOUDINARY_*` variables to enable persistent image uploads; they are optional.
6. Deploy, then smoke-test Google sign-in, the initial crop-selection prompt, a chat request, farm-location setup, and an eligible disease-image diagnosis from one account; confirm a nearby account receives the unverified in-app notice. Check Vercel function logs if a server API fails.

Vercel's default Next.js Node.js runtime is required for Firebase Admin API routes. No custom `vercel.json` or output-directory override is needed.

### Verify the Production Build
```powershell
npm.cmd run build
```

### Start Development Server
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
- **`disease_outbreak_alert` Card:** Proximity distance (km), nearby disease report status, and recommended preventive scouting steps.
- **`crop_history` Card:** Historical timeline snapshots.

---

## 🔒 Security & Privacy Guarantees

- **Location Privacy:** The farmer's high-precision GPS coordinates are stored privately. Public community reports are fuzzed to 1.0 km centroid grids (`fuzzCoordinatesToGrid`).
- **Pesticide Safety Invariant:** Gemini is strictly forbidden from guessing chemical quantities. Calculations are derived deterministically from CIBRC verified registrations; unregistered applications are refused.
- **Outbreak Notices:** Eligible visual diagnoses and signed-in farmer reports can notify nearby users without agronomist approval. AI-assisted notices are labeled unverified and are limited to contagious pathogen categories and clear visual matches.
