# Post2Market

Post2Market is a mobile-friendly React web app for small businesses and informal sellers. It brings product management, poster design, captions, and social sharing into one place.

## Features

- Create, edit, search, and organize products with images, prices, and categories.
- Save business details, contact information, and a logo for use in posters.
- Design posters with templates, fonts, colors, and stickers.
- Export square posts (1080 x 1080) and portrait status images (1080 x 1920).
- Generate captions from built-in templates and reuse designs from the poster gallery.
- Download posters, copy captions, open WhatsApp, or use the browser's native share dialog.
- Create posters in bulk and prepare messages with the group posting helper.
- Plan posts in a schedule and view locally recorded activity in the analytics dashboard.
- Switch supported interface labels between English and Kiswahili.

## Current implementation

This repository is a frontend prototype. Accounts, products, images, posters, schedules, and activity are stored in the current browser's `localStorage` under the key `p2m-v1`. Data does not sync between devices or browsers, and clearing site data removes it.

Authentication is simulated locally, including storing passwords as plain text. Use test credentials only. Production authentication and server-side storage still need to be implemented.

Scheduling is a planning tool: users copy and share posts manually when due. The app does not automatically publish to social platforms or WhatsApp groups. Premium access is a local profile toggle with no payment integration. Analytics reflect in-app activity rather than social platform engagement.

## Requirements

- Node.js 22.12 or newer. The locked Vite packages also support Node.js 20.19 or newer within the Node.js 20 release line.
- npm, supplied with Node.js.
- A modern browser with JavaScript and local storage enabled.

Check your installed versions:

```sh
node --version
npm --version
```

## Installation and local development

1. Clone or download this repository and open a terminal in its root folder:

   ```sh
   cd post2market
   ```

2. Install the dependencies from the lockfile:

   ```sh
   npm ci
   ```

   Use `npm install` when intentionally adding or updating dependencies, and commit the resulting changes to `package.json` and `package-lock.json` together.

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open the URL printed in the terminal, normally `http://localhost:5173`.

On Windows, if PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`, for example `npm.cmd ci` and `npm.cmd run dev`.

### Configuration

No `.env` file, API key, database, or Supabase project is required to run the current app. The source does not currently read environment variables or initialize a Supabase client.

### Try the demo

On the authentication screen, select **Continue as demo seller** to load sample seller data. After the demo account has been created in your browser, you can also log in with:

- Email: `seller@post2market.app`
- Password: `demo123`

A typical workflow is to update your business profile, add a product, open the designer, choose a template, save the poster, and download or share it from the gallery.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependency versions in `package-lock.json`. |
| `npm run dev` | Start Vite with hot module replacement. |
| `npm run build` | Generate the production site in `dist/`. |
| `npm run preview` | Preview the production build locally, normally at `http://localhost:4173`. |
| `npm run lint` | Run ESLint across the project. |

Run `npm run build` before `npm run preview`. There is currently no automated test script in `package.json`.

## Packages

The versions below are the declared ranges in `package.json`; `package-lock.json` records the exact installed versions.

### Application dependencies

| Package | Version range | Purpose |
| --- | --- | --- |
| `react` | `^19.2.4` | Components, hooks, and application state. |
| `react-dom` | `^19.2.4` | Render React into the browser DOM. |
| `react-router-dom` | `^7.13.1` | Client-side routing and navigation. |
| `@supabase/supabase-js` | `^2.99.2` | Installed Supabase SDK; currently unused by the app. |

### Development dependencies

| Package | Version range | Purpose |
| --- | --- | --- |
| `vite` | `^8.0.0` | Development server and production builds. |
| `@vitejs/plugin-react` | `^6.0.0` | React integration and Fast Refresh for Vite. |
| `eslint` | `^9.39.4` | JavaScript and JSX linting. |
| `@eslint/js` | `^9.39.4` | ESLint's JavaScript rule presets. |
| `eslint-plugin-react-hooks` | `^7.0.1` | React Hooks lint rules. |
| `eslint-plugin-react-refresh` | `^0.5.2` | Fast Refresh lint checks. |
| `globals` | `^17.4.0` | Global variable definitions for linting. |
| `@types/react` | `^19.2.14` | React type definitions for editor tooling. |
| `@types/react-dom` | `^19.2.3` | React DOM type definitions for editor tooling. |
| `tailwindcss` | `^4.2.1` | Installed CSS tooling; not currently wired into the build. |
| `postcss` | `^8.5.8` | Installed CSS processing tooling. |
| `autoprefixer` | `^10.4.27` | Installed CSS prefixing plugin. |

The current interface uses plain CSS in `src/index.css`. There is no project PostCSS configuration or Tailwind integration in `vite.config.js`.

## Project structure

```text
post2market/
|-- public/
|   |-- favicon.svg          # Site favicon
|   `-- icons.svg            # SVG icon assets
|-- src/
|   |-- assets/              # Bundled image and SVG assets
|   |-- components/
|   |   |-- Layout.jsx       # Shared app shell and navigation
|   |   `-- PosterCanvas.jsx # Canvas-based poster preview
|   |-- lib/
|   |   |-- captions.js      # Template-based caption generation
|   |   |-- data.js          # Categories, templates, and demo data
|   |   |-- i18n.js          # English and Kiswahili interface strings
|   |   |-- poster.js        # Image loading, rendering, and export helpers
|   |   `-- store.jsx        # React context, local accounts, and persistence
|   |-- pages/
|   |   |-- Analytics.jsx    # Local activity dashboard
|   |   |-- Auth.jsx         # Login, registration, and demo entry
|   |   |-- Bulk.jsx         # Bulk poster generation
|   |   |-- Designer.jsx     # Poster customization
|   |   |-- Gallery.jsx      # Saved posters
|   |   |-- Groups.jsx       # Group posting helper
|   |   |-- Home.jsx         # Seller home screen
|   |   |-- ProductForm.jsx  # Add and edit products
|   |   |-- Products.jsx     # Product library
|   |   |-- Profile.jsx      # Business profile and preferences
|   |   |-- Schedule.jsx     # Manual posting planner
|   |   `-- Share.jsx        # Poster download and sharing
|   |-- App.jsx              # Route definitions and session guard
|   |-- App.css              # Additional stylesheet
|   |-- index.css            # Global styles and interface layout
|   `-- main.jsx             # React entry, router, and store provider
|-- .gitignore
|-- eslint.config.js         # Lint configuration
|-- index.html               # HTML entry point
|-- package.json             # Package declarations and npm scripts
|-- package-lock.json        # Exact dependency versions
|-- README.md
`-- vite.config.js           # Vite configuration
```

`node_modules/` is generated during installation, and `dist/` is generated during a build. Both are ignored by Git.

## Production build and hosting

```sh
npm run build
npm run preview
```

Deploy the contents of `dist/` to a static hosting service. Because the app uses `BrowserRouter`, configure the host to serve `index.html` for application routes such as `/products` and `/gallery` when no static file matches.

Native sharing and clipboard features depend on browser support and generally require HTTPS or localhost. If native sharing is unavailable, use poster download and manual sharing. Remote images and fonts can require internet access; the production build caches the app shell and bundled assets for offline loading after the first successful online visit. External resources are not cached.

## Troubleshooting

- **Installation reports an unsupported Node.js version:** check `node --version` against the requirements above.
- **The development URL uses a different port:** open the address Vite prints; it can select another port when the default is occupied.
- **Refreshing a deployed route returns 404:** configure the static host's fallback to `index.html`.
- **Saved content is missing:** use the same browser, profile, and site origin where it was created. Local data is not shared across ports or domains.
- **Saving fails after adding many images:** browser storage is limited. Remove unneeded products or posters to reduce storage use.

## Install on your phone (PWA)

The production build includes an app manifest, home-screen icons, and a service worker. Once loaded online and cached, the interface and bundled assets can reopen offline, including direct routes. Sharing through WhatsApp and loading external images/fonts still require internet access. Data stays on each device; installing the app does not sync your laptop's data to your phone.

1. Run `npm run build` and deploy `dist/` to an HTTPS host with the route fallback described above.
2. Open that HTTPS address on your phone and let the first load finish.
3. **Android (Chrome):** open the browser menu and choose **Install app** or **Add to Home screen**.
4. **iPhone (Safari):** tap **Share**, then **Add to Home Screen** (enable **Open as Web App** if offered).
5. Launch Post2Market from its home-screen icon. To check offline support, close it, enable airplane mode, then reopen it after the initial online load.

For a desktop offline check, run `npm run build`, then `npm run preview`, open the printed localhost URL, and wait for the service worker to activate before testing offline in browser developer tools. Service worker registration is disabled during `npm run dev` to keep development changes fresh.

To check the mobile layout over the same Wi-Fi, run `npm run dev -- --host 0.0.0.0` and open `http://<your-computer-LAN-IP>:5173` on your phone. Allow access through the firewall if needed. This HTTP LAN address is for layout testing; full PWA installation and service workers require HTTPS on the phone. Use an HTTPS deployment for installation testing.

New builds download in the background. Close all Post2Market windows/tabs and reopen to activate a waiting update. The worker only caches this app's build files, does not cache API responses, and removes its older build caches when an update activates. Configure hosting to revalidate `/sw.js` (for example, `Cache-Control: no-cache`) and serve it as JavaScript, rather than routing it to `index.html`.

PWA files: `public/manifest.webmanifest`, `public/icons/`, registration in `src/main.jsx`, and the build-generated `dist/sw.js` produced by `vite.config.js`. No additional npm packages are required.
