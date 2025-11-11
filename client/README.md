# LibraFlow (Client)

LibraFlow is a modern blogging & AI-assisted writing platform built with a React + Vite front‑end and a Node/Express + MongoDB back‑end. It provides a fluid UI, animated page transitions, lazy‑loaded blog cards, a rich markdown AI chat helper, and profile features (bio, full name, phone) for authors.

## ✨ Frontend Stack
- React (Vite) with fast HMR
- Tailwind CSS (custom design tokens + gradients)
- Framer Motion (page & component animations)
- React Markdown + Remark GFM (rich markdown rendering)
- Prism Syntax Highlighting (code blocks)
- Axios (API communication)
- React Hot Toast (notifications)

## 🚀 Features
- Animated authentication (login/register) with password strength + username availability debounce
- AI Chat widget supporting markdown & syntax highlighting
- Lazy loading blog cards with skeleton shimmer
- Gradient design system (Indigo → Violet → Teal) & reusable utility classes
- Author bios appended to blog posts (server-side support in progress)
- Terms of Service page (`/terms`) linked in Navbar & auth forms

## 📂 Project Structure (client)
```
client/
	src/
		App.jsx                # Routes + page transitions
		pages/                 # Login, Register, Terms, Home, Blog, Admin pages
		components/            # Navbar, Footer, ChatWidget, BlogCard, etc.
		context/               # Global AppContext (axios, auth state)
		assets/                # Logos, images, icons
		index.css              # Global styles & design tokens
```

## 🔧 Environment Variable (Frontend)
Set in Vercel / local `.env` files:
```
VITE_BASE_URL=<backend_render_url>
```
Used by axios in `AppContext` to construct API requests when absolute URLs are needed.

## 🛠 Local Development
```powershell
cd client
npm install
npm run dev
```
The dev server (Vite) will start on an available port (commonly 5173 or 5174).

## ✅ Linting / Formatting
ESLint configuration lives in `eslint.config.js`. React Refresh is enabled automatically by Vite plugins.

## 🔐 Authentication Flow
1. Register: Captures username, fullName, email, password, optional phone & bio.
2. Username availability: Debounced request to `/api/user/check-username`.
3. Password strength meter: Visual bar + label with progressive scoring.
4. JWT token stored client-side via context after successful login/register.

## 🧪 Key UX Components
- `ChatWidget.jsx`: Markdown + code block rendering for AI responses.
- `BlogCard.jsx`: IntersectionObserver for lazy load & skeleton.
- `Navbar.jsx`: Conditional rendering based on auth (`token`, `user.role`).
- `Register.jsx` & `Login.jsx`: Animated forms with gradient buttons.

## 📘 Terms of Service
Located at `src/pages/Terms.jsx` and linked throughout the app. Update copy as policy evolves.

## 🔄 Branding Migration
Original references to QuickBlog have been replaced with LibraFlow across UI and docs, except for any external assets or database names explicitly configured by environment variables.

## ▶️ Production Build
```powershell
cd client
npm run build
```
Outputs static assets to `dist/` (served by Vercel).

## 🧩 Future Enhancements
- Privacy Policy page
- Dark mode toggle
- Rich blog editor enhancements (image embedding, slash commands)
- Analytics dashboard for authors

## 📄 License
MIT Licensed. See root repository license file.

---
LibraFlow – Share knowledge elegantly.
