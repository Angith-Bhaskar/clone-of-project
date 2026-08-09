# CLAUDE.md

## Project Overview

Frontend clone of the BookMyShow platform, built for a college Web Development group project. This is **Phase 1 / first evaluation**: UI and database architecture only — no backend, no live data, no real integrations.

## Scope

### In scope
- 14 static pages (listed below), built with plain HTML/CSS/JS
- Fully responsive layouts across mobile / tablet / desktop
- Client-side JS interactions using dummy/hardcoded data
- MongoDB Atlas schema **design**, documented as markdown — not implemented

### Out of scope — do not build
- Backend server, Node.js, or Express.js
- Any API endpoints
- Real authentication, sessions, or password hashing
- Real payment gateway integration
- An actual MongoDB connection
- Any framework or UI library (React, Vue, Angular, Bootstrap, Tailwind, jQuery, etc.)

## Tech Stack

- HTML5, CSS3, vanilla JavaScript (ES6+)
- No build tools, no package manager, no dependencies
- MongoDB Atlas — architecture/documentation only

## Running the Project

No build step needed, but serve the folder with a static server rather than opening files via `file://`, so relative paths behave consistently:

```bash
npx serve .
# or
python3 -m http.server 5500
```

## Design Language

Reference bookmyshow.com for layout and UX patterns only. Don't pull their actual logo, poster art, or other trademarked assets — use a similar-style placeholder wordmark and stock/placeholder images (e.g. Unsplash, placeholder.com) for posters and banners, so the visual language matches without reproducing copyrighted material.

Suggested design tokens — define once as CSS variables in `css/common.css` and reuse everywhere rather than repeating hex values per file:

- Primary red: `#c4242a` — buttons, active states, price highlights, accents
- Text: `#111827` (primary) / `#6b7280` (muted)
- Backgrounds: `#ffffff` (cards/base) / `#f5f5f5` (sections)
- Border radius: `10px`–`14px` on cards, `4px`–`6px` on buttons/inputs
- Font: a clean sans-serif — "Inter" or "Roboto", `system-ui` fallback
- Card shadow: soft — `0 2px 8px rgba(0,0,0,0.08)`, slightly deeper on hover

Overall look: red-and-white theme, rounded cards, generous whitespace, subtle hover animations — matching the source site's density rather than a simplified version of it.

## Folder Structure

```
BookMyShow/
├── index.html                 → Home
├── search-results.html
├── login.html
├── signup.html
├── forgot-password.html
├── movies.html                 → Movie Listing
├── movie-details.html
├── show-timings.html
├── seat-selection.html
├── booking-summary.html
├── payment.html
├── booking-confirmation.html
├── profile.html
├── booking-history.html
│
├── css/
│   ├── common.css              → variables, navbar, footer, buttons, shared components
│   ├── home.css
│   ├── auth.css                → login, signup, forgot-password
│   ├── movies.css              → search-results, movies, movie-details, show-timings
│   ├── booking.css             → seat-selection, booking-summary, payment, booking-confirmation
│   └── profile.css             → profile, booking-history
│
├── js/
│   ├── common.js                → navbar/footer injection, city selector, shared utils
│   ├── home.js
│   ├── auth.js
│   ├── movies.js
│   ├── booking.js
│   └── profile.js
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── posters/
│
└── mongodb/
    └── architecture.md
```

## Shared Components Convention

There's no templating engine, so don't hand-duplicate navbar/footer markup across 14 files. Instead:

- `js/common.js` exports functions like `renderNavbar()` and `renderFooter()` that inject markup into `<div id="navbar"></div>` / `<div id="footer"></div>` placeholders on `DOMContentLoaded`.
- Every page loads `common.css` + `common.js` in addition to its category-specific CSS/JS file.
- Page-specific behavior stays in that page's own JS file.

## Build Approach

- Work through the pages in the order listed below; get one looking right before starting the next, rather than scaffolding all 14 at once.
- Semantic HTML throughout (`<nav>`, `<main>`, `<section>`, `<footer>`).
- Comment CSS sections and any non-obvious JS logic.
- One `<script src="...">` per page (plus `common.js`) — no large inline scripts.

## Pages & Requirements

- [ ] **Home** — navbar, logo, city selector, search bar, Sign In button, menu button, banner carousel, Recommended Movies, Live Events, Premieres, Outdoor Events, Laughter Shows, footer. JS: banner slider, dummy search suggestions, responsive menu, hover effects.
- [ ] **Search Results** — search bar, search suggestions, movie cards, event cards, empty state. JS: dummy search filtering.
- [ ] **Login** — phone login, Google login button, email login, continue button. JS: form validation, phone number validation.
- [ ] **Sign Up** — name, email, phone, password, confirm password. JS: validation, password visibility toggle, error messages.
- [ ] **Forgot Password** — email input, reset button. JS: email validation.
- [ ] **Movie Listing** — filters (language, genre, format, price, rating), movie cards (poster, name, genre, rating). JS: dummy filtering.
- [ ] **Movie Details** — large banner, poster, rating, languages, genres, duration, release date, about, cast, crew, reviews, Book Tickets button. JS: expandable description.
- [ ] **Show Timings** — date selector, theatre list, show timings, language badges, format badges. JS: date selection, highlight selected timing.
- [ ] **Seat Selection** — screen, seat layout (Platinum / Gold / Silver), available/booked/selected states. JS: select/deselect seats, live total calculation.
- [ ] **Booking Summary** — movie, theatre, seats, date, time, ticket count, convenience fee, GST, grand total. JS: live price updates.
- [ ] **Payment (UI only)** — UPI, credit card, debit card, net banking, wallet. JS: payment method selection only, no integration.
- [ ] **Booking Confirmation** — success icon, booking ID, dummy QR code, movie, theatre, seats, date, time. JS: copy booking ID.
- [ ] **User Profile** — profile photo, name, email, phone, Edit Profile button. JS: frontend-only edit mode.
- [ ] **Booking History** — previous bookings with poster, date, theatre, ticket status. JS: filter bookings.

## MongoDB Atlas Architecture (design only — do not connect)

Database: `BookMyShow`. Document as `mongodb/architecture.md`; no driver, no connection string, no live queries.

- **Users** — `_id`, `name`, `email`, `phone`, `password`, `profileImage`, `createdAt`
- **Movies** — `_id`, `title`, `description`, `languages`, `genres`, `duration`, `releaseDate`, `rating`, `poster`, `banner`, `cast`, `crew`
- **Theatres** — `_id`, `theatreName`, `city`, `address`, `screens`
- **Screens** — `_id`, `theatreId`, `screenName`, `totalSeats`
- **Shows** — `_id`, `movieId`, `theatreId`, `screenId`, `showDate`, `showTime`, `language`, `format`
- **Seats** — `_id`, `showId`, `row`, `number`, `category`, `status`
- **Bookings** — `_id`, `userId`, `showId`, `seatIds`, `totalAmount`, `bookingStatus`, `bookedAt`
- **Payments** — `_id`, `bookingId`, `paymentMethod`, `transactionId`, `paymentStatus`, `paidAt`

## Hard Constraints — Do NOT

- Build a backend, Node.js server, or Express app
- Create any API endpoints
- Implement real authentication or session handling
- Integrate a real payment gateway
- Connect to MongoDB — architecture doc only
- Pull in any framework or UI library
- Reproduce BookMyShow's actual logo or copyrighted imagery
