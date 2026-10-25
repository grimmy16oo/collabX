# CollabX

CollabX is a scholarship discovery and application tracking app built with React Native and Expo. Students can browse scholarship listings, save opportunities, track their application stages, and maintain a profile with study preferences.

## Features

- Email/password account registration and sign-in, plus password reset through Firebase Authentication.
- Scholarship search and filtering backed by an Express API and MongoDB.
- Recommended scholarships filtered using study level, target countries, and fields of study when profile data is available. Recommendations are broad filters, not a guaranteed eligibility or match score.
- Saved scholarships and an application tracker. Signed-in users sync these records through the API; guests can keep saved IDs in local device storage.
- Editable student profile: name, headline, degree level, CGPA and scale, nationality, target countries, fields of study, and profile photo.
- A shared forest-green and sage visual theme, file-based navigation with Expo Router, and a floating bottom navigation bar.

## Tech stack

- Expo SDK 58, React Native 0.88, and TypeScript
- Expo Router and NativeWind
- Firebase Authentication
- Multer for authenticated profile photo uploads to the Express server
- Express, Mongoose, and MongoDB for the API and persistent user/scholarship records
- AsyncStorage for local session/profile fallback and guest saved scholarship IDs

## Project layout

```text
collabx/
├── src/
│   ├── app/                    # Onboarding, auth, home, scholarship, tracker, and profile screens
│   ├── components/             # Shared UI, auth, and navigation components
│   ├── config/                 # Firebase configuration
│   ├── context/                # Authentication and user profile state
│   ├── data/                   # Scholarship API hooks and source JSON dataset
│   └── theme/                  # Colors and typography
├── backend/
│   └── src/
│       ├── models/             # User, scholarship, and saved scholarship models
│       ├── routes/             # Authentication, profile, and saved scholarship routes
│       └── server.js           # Express API and scholarship endpoints
├── storage.rules               # Firebase Storage rules for profile images
├── app.json                    # Expo app configuration
└── package.json                # App and backend convenience scripts
```

## Requirements

- Node.js and npm
- A Firebase project with a Web App and Authentication configured
- A MongoDB database (MongoDB Atlas or a local MongoDB instance)
- For physical device testing, a phone and development computer reachable on the same network

## Setup

### 1. Install dependencies

From the project root:

```bash
npm install
npm run backend:install
```

### 2. Configure Firebase Authentication

Copy `.env.example` to `.env` and fill in the Firebase Web App settings from Firebase Console → Project settings → General. Root `.env` is read by Expo and must remain private; do not commit real credentials.

In Firebase Console, enable **Email/Password** under Authentication → Sign-in method. The native app identifiers are `com.collabx.app` for both iOS and Android. Firebase Firestore stores authenticated profiles in `users/{Firebase UID}`.

Create the default Cloud Firestore database in `collabx-8def0` if one does not exist, then publish the project rules with `npx -y firebase-tools@latest deploy --only firestore:rules,storage --project collabx-8def0`. Authenticated profile documents are stored at `users/{Firebase UID}` and are readable/writable only by that signed-in user. Signed-in feedback is stored in `feedback`; optional screenshots use Firebase Storage. The rules are a prototype and should be reviewed before launch.

The Firebase CLI must be logged in before app registration or rules deployment. Register the iOS app with `npx -y firebase-tools@latest apps:create IOS com.collabx.app --project collabx-8def0 --display-name CollabX`.

Example variable names are listed in `.env.example`:

```env
# Optional deployed API override. For local development, leave unset.
# EXPO_PUBLIC_API_URL=https://your-api.example.com
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

During local Expo development, leave `EXPO_PUBLIC_API_URL` unset. The app reads the current Expo development host and connects to the API on port 4000, so changing Wi-Fi does not require editing source or `.env`. Set `EXPO_PUBLIC_API_URL` only when using a deployed backend. Restart Expo after changing environment variables.

### 3. Configure the backend

Copy `backend/.env.example` to `backend/.env` and set a MongoDB connection string and a long, private JWT secret:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/collabx?retryWrites=true&w=majority
PORT=4000
JWT_SECRET=<long-random-secret>
FIREBASE_PROJECT_ID=<same-project-id-as-the-app>
```

For MongoDB Atlas, create a database user and allow your development machine's IP in Network Access. Keep `backend/.env` private.

Profile photos and feedback screenshots are stored in Cloudinary; MongoDB stores their secure URLs and Cloudinary public IDs. Create a Cloudinary account, copy the cloud name, API key, and API secret from its dashboard into `backend/.env` using the `CLOUDINARY_*` names in `backend/.env.example`, then restart the API. Keep the API secret only in the backend environment. New image uploads return a setup error until these values are configured.

### 4. Import scholarship records

The source dataset is `src/data/scholarships.json`. Import its records into the MongoDB database configured by `MONGODB_URI`:

```bash
npm run scholarships:import
```

The import script upserts by each record's source `id`, so it can be run again to refresh the collection.

## Run locally

Start the API in one terminal:

```bash
npm run backend:dev
```

The API listens on port 4000 by default. Check `http://<computer-address>:4000/api/health`; HTTP 200 and `"database":"connected"` mean both API and MongoDB are ready. HTTP 503 means the API is up but MongoDB is disconnected.

Start Expo in another terminal:

```bash
npx expo start --lan
```

Use the terminal shortcuts to open web or an emulator, or scan the QR code with Expo Go. Keep the phone and development computer on the same reachable network and allow the Expo and backend ports through the computer firewall. The API address follows Expo's current host automatically. Some university and public Wi-Fi networks block device-to-device connections; use a trusted VPN or a deployed backend if client isolation is enabled. Expo's tunnel option tunnels the Expo bundle, not this Express API.

## API overview

Base path: `/api`

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API and MongoDB connection status |
| `GET` | `/scholarships` | Search/filter scholarships with `q`, `country`, `level`, `field`, and `eligibleCountry` query parameters |
| `GET` | `/scholarships/:id` | Retrieve a scholarship by its source dataset ID |
| `GET` | `/scholarships/recommended` | Return a filtered scholarship list, optionally using profile data and query filters |
| `POST` | `/auth/firebase-sync` | Sync a Firebase account with the API user record |
| `GET` / `PUT` | `/users/profile` | Read or update the signed-in user's profile |
| `GET` | `/saved-scholarships` | List the signed-in user's saved scholarships |
| `POST` | `/saved-scholarships/toggle` | Save or unsave a scholarship |
| `PATCH` | `/saved-scholarships/:scholarshipId` | Update saved scholarship tracking details |
| `DELETE` | `/saved-scholarships/:scholarshipId` | Remove a saved scholarship |

Profile updates and Firebase account sync use the signed-in Firebase user's ID token. The backend verifies it with Firebase Admin and resolves its UID to the existing MongoDB user. Set `FIREBASE_PROJECT_ID` in `backend/.env` to the same project ID as the app. Existing API-issued bearer tokens remain supported for scholarship and tracker requests.

## Profile photos

The profile screen uses Expo Image Picker to send the selected photo as multipart form data to the authenticated `PUT /api/users/profile` endpoint. The API stores JPG/JPEG, PNG, or WebP files up to 5 MB under `backend/uploads/avatars/<user-id>/`, then saves the public `/uploads/...` URL in the MongoDB user profile's `photoURL` field. Express serves these files from `/uploads`. The phone must be able to reach the backend on the same network or through the configured deployed API. Uploaded files are ignored by Git.

## Development checks

Run the TypeScript compiler:

```bash
npx tsc --noEmit
```

Clear Expo's cache if changes to configuration or environment variables are not picked up:

```bash
npx expo start -c
```

## Current limitations

- Scholarship details include a preliminary eligibility check for degree, field, nationality, CGPA, and language where structured requirements and profile data are available. Missing criteria are shown as unknown; users should confirm rules with the official provider. Recommendations remain broad field/country/degree filters.
- Saved scholarship IDs have a local guest fallback. Persistent tracker status and server profile data require a working API, MongoDB connection, and signed-in account.
- Firebase account sign-in can work while the API is offline, but profile updates then use the local fallback and will not sync to MongoDB until backend connectivity is restored.
- Profile image upload requires the backend to be reachable and writable storage on the machine running the API. For deployment, use persistent file storage or an object-storage service because local uploaded files may not survive ephemeral hosting.
- Configure and verify Firebase OAuth clients, MongoDB access, and Storage rules for your own development and production environments.
