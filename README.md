# CollabX 🎓

**CollabX** is a scholarship discovery mobile application built with React Native and Expo (SDK 57). The user interface emphasizes a focused visual design inspired by deep natural tones and modern editorial typography.

---

## 🎨 Visual Design & Theme System

The design system is centered around earthy greens, warm sage-cream canvases, and crisp card surfaces:

| Element | Specification / Color | Description |
| :--- | :--- | :--- |
| **Home Canvas** | `#F0F2E9` | Warm sage-cream background |
| **Welcome Canvas** | `#17331A` &rarr; `#132A15` | Deep forest green linear gradient |
| **Primary Accents** | `#183119` & `#3D6414` | Deep forest green and rich olive green |
| **Text Highlights** | `#74DE85` & `#3D6414` | Luminous mint italic on dark / olive italic on light |
| **Typography** | Plus Jakarta Sans | Bold headings (`#152A17`), tracked uppercase subtitles (`#798C76`) |
| **Card Style** | `#FFFFFF` | 28px rounded corners, subtle drop shadow, `#ECEFE4` borders |

---

## 📱 Screens & Features

### 1. Welcome (Onboarding) Screen (`src/app/index.tsx`)
- **Brand Squircle Badge**: White badge at the top-left containing a graduation cap icon and the **CollabX** brandmark.
- **Hero Display Headline**: *"Unlock Your / Global Future"* with *"Global Future"* rendered in an italic light green accent.
- **Value Proposition Subtitle**: *"Personalized scholarship matching for every ambitious student."*
- **Social Proof**:
  - Overlapping circular student avatars with a distinct border treatment.
  - Green `10k+` pill badge.
  - Subtitle: `"TRUSTED BY STUDENTS WORLDWIDE"` accompanied by a 4.9/5 student rating row.
- **Actions**:
  - Pure white pill button: `"GET STARTED"` (navigates smoothly to the Home screen).
  - Translucent outlined button: `"SIGN IN"`.

### 2. Home Screen (`src/app/home/homescreen.tsx`)
- **Top Greeting Bar**:
  - User profile avatar for **Alex Johnson** with uppercase tracked `"WELCOME BACK"`.
  - Pure white circular notification bell button with a red badge pip.
- **Headline**:
  - Display text: *"Find your perfect / Scholarship"* with *"Scholarship"* in rich olive italic.
- **Eligibility Banner**:
  - Deep forest green (`#183119`) 28px rounded card.
  - Integrated `"3.8 GPA"` pill badge and `"92% Match Score"` indicator with a right chevron arrow.
- **Filter Chips**:
  - Horizontal scrolling pills: `"All Types"` (active olive `#3D6414`), `"Full Funding"`, `"Undergraduate"`, `"Postgraduate"`, and `"STEM & Tech"`.
- **"Featured for you" Horizontal Carousel**:
  - 28px rounded white cards with drop shadow and `#ECEFE4` borders.
  - Institutional monogram badges (`"GC"` for Gates Cambridge, `"RS"` for Rhodes, `"FB"` for Fulbright, `"SS"` for Schwarzman).
  - Interactive bookmark action, country tag (`UK`, `USA`), funding tag (`FULL FUNDING`), application deadline, and amount (e.g. `$45,000 / year`).
- **"Active Applications" Section**:
  - Pure white card featuring the `"Chevening Scholarship"` with a `"Status: Under Review"` amber badge.
  - Custom SVG circular progress ring component showing **65%** completion.
- **Floating Bottom Nav**:
  - Deep forest green (`#183119`) pill navbar fixed at the bottom with safe area padding.
  - 4 icons: **Home**, **Search**, **Tracker**, and **Profile**.
  - Olive-green (`#3D6414`) squircle highlight on the active tab.

---

## 📂 Project Structure

```text
collabx/
├── src/
│   ├── app/
│   │   ├── _layout.tsx           # Root layout with Plus Jakarta Sans & Stack routing
│   │   ├── index.tsx             # Screen 1: Welcome Screen (Dark Forest Gradient)
│   │   └── home/
│   │       └── homescreen.tsx    # Screen 2: Home Screen (Warm Sage-Cream)
│   ├── components/
│   │   ├── CircularProgress.tsx  # SVG circular progress ring (react-native-svg)
│   │   └── FloatingBottomNav.tsx # Floating pill bottom navbar with squircle highlight
│   └── theme/
│       └── colors.ts             # Centralized design tokens (colors, typography, radii)
├── assets/                       # Static app assets and icons
├── app.json                      # Expo configuration
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: [Expo](https://expo.dev/) (SDK 57)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Styling**: NativeWind v4 & Tailwind CSS with CollabX theme tokens
- **Typography**: `@expo-google-fonts/plus-jakarta-sans` & `expo-font`
- **Gradients**: `expo-linear-gradient`
- **SVGs**: `react-native-svg`
- **Icons**: `@expo/vector-icons` (`Ionicons`)

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```
*(If port 8081 is in use, start on port 8082 with `npx expo start --port 8082`)*

### 3. Open the App
- **Web Browser**: Press `w` in the terminal or navigate to `http://localhost:8082`
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the terminal QR code using the **Expo Go** app (iOS Camera or Android Expo Go)

---

## 🧪 Verification & Type Safety

Run the TypeScript compiler to ensure strict typing:
```bash
npx tsc --noEmit
```
To test the production asset bundling across all platforms:
```bash
npx expo export
```

## Scholarships API (MongoDB Atlas)

`src/data/scholarships.json` is the source dataset (59 records). The Express API stores it in the database selected by `MONGO_URI`, in the `scholarships` collection. Each record's source `id` is unique; imports upsert by that id.

1. Create an Atlas database user and allow your development machine's public IP in Atlas Network Access.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`. Keep this file private.
3. From the project root run `npm run backend:install` and `npm run scholarships:import`.
4. Start the API with `npm run backend:dev` (or `npm run backend:start`). It listens on `0.0.0.0:4000`. Check `http://localhost:4000/api/health`.
5. Set `EXPO_PUBLIC_API_URL` in the root `.env` to `http://<computer-LAN-IP>:4000`. The current Wi-Fi adapter address detected for this computer is `192.168.10.30`. The phone and computer must share a network and the computer firewall must allow inbound TCP port 4000.
6. Start Expo with `npx expo start`; reload the app after changing `.env`.

API routes: `GET /api/scholarships` returns `{ data, count }`; `GET /api/scholarships/:id` looks up a source record id. List filters are `q`, `country`, `level`, `field`, and `eligibleCountry`.

Saved scholarships are local to the device and reference API record ids. The dataset does not include applicant profile data, eligibility rules, match scores, or application progress, so the UI does not claim a match or invent tracked applications.
