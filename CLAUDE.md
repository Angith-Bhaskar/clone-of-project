# CLAUDE.md — BookMyShow Clone (Phase 2: Backend + Frontend Integration)

This file tells Claude Code how to finish this project. **Claude writes the code directly** in this phase. (The earlier "mentor mode", where the user typed everything, is over.) Work through the task list in order, verify each task, and keep the user informed.

**Authentication is NOT part of this cycle.** Do not build login, signup, JWT, password hashing, or protected routes. Those come in the next cycle.

---

## 1. Project summary

A college Web Development group project: a clone of the BookMyShow website.

- **Frontend:** plain HTML5, CSS3 and vanilla JavaScript. No frameworks, no libraries, no build tools. 14 pages, already built and styled with dummy data.
- **Backend:** Node.js + Express 5 + Mongoose 9, in `backend/`.
- **Database:** MongoDB Atlas, database name `bookmyshow` (lowercase).
- **Goal of this cycle:** every page that still reads hardcoded dummy data must read from the MongoDB-backed API. The full booking flow (seats → summary → payment → confirmation → history) must work and write real data.
- Look and feel must not change. Visual design is finished. Only data sourcing changes.

---

## 2. Current state (Steps 0–26 are DONE)

Working and tested. Do not rewrite these unless a task below says so.

- `backend/` project: `package.json`, `.env` (has `PORT` and `MONGODB_URI`), `.gitignore`, `index.js`, `config/db.js`.
- Models: `Movie`, `Theatre`, `Screen`, `Show` (includes a `pricing` object), `Seat`.
- Routes: `GET /api/movies`, `GET /api/movies/:id`, `GET /api/shows?movieId=&date=` (grouped by theatre, sorted).
- `seed.js` currently seeds Theatres, Screens, Shows and Seats for movie `m1` only.
- Frontend `js/api.js` exists with `apiGet` and `toLocalDateString`.
- **Show Timings page** already loads real shows and date pills from the API. Its heading is still hardcoded ("The Last Signal").
- Atlas already holds 3 real movies (`m1`, `m2`, `m3`) created by the team. They are real shared data.

Everything else (Home, Search, Listing, Details, Seat Selection, Summary, Payment, Confirmation, History) still uses dummy JS data.

---

## 3. Environment and how to run

- Backend: `cd backend`, then `npm run dev` (nodemon, port 5000). nodemon does not watch `.env`, so restart after editing it.
- Frontend: served by VS Code Live Server at `http://127.0.0.1:5500`. It calls the API at `http://localhost:5000/api`. CORS is already enabled.
- Node scripts are run directly, for example `node seed.js`.
- **Never print, log or commit the contents of `.env`.** The Atlas password was exposed earlier; remind the user to rotate it.

---

## 4. Hard rules

1. **No authentication work.** No user registration, login, tokens, bcrypt, or auth middleware. Bookings belong to the placeholder user id `guest`.
2. **Vanilla frontend only.** No React, Vue, jQuery, Bootstrap, Tailwind or build step. Backend may only add packages if truly necessary; prefer none.
3. **Never delete or overwrite the `Movies` collection.** It holds the team's real data. Adding movies must use an insert-only upsert. `seed.js` must never call `Movie.deleteMany`.
4. **Confirm before running any seed script.** Seeding wipes shared collections in a database the whole team uses. Ask the user first, and tell them what will be deleted.
5. **Preserve the existing UI.** Read each page's HTML and JS before editing. Adapt to the ids and class names that already exist; do not rename them or restyle pages. If you must add an element id, add it without changing layout.
6. **Never trust the browser for money or availability.** Prices, fees, GST and seat status are always computed and validated on the server.
7. **No secrets in code or in git.** Confirm `.env` and `node_modules/` are git-ignored.
8. **Keep changes small and reversible.** One task at a time. After each task, run the checks in its acceptance criteria before moving on.
9. **Ask, don't guess, when the design is unclear.** In particular: never invent field names that would need a change to existing Atlas documents without telling the user.

---

## 5. Data model (source of truth)

Database `bookmyshow`. Collection names are **case-sensitive** and use a capital first letter, so every Mongoose model must set `collection` to the exact name. Documents use **readable string `_id`s** (not ObjectIds), so `_id` is declared as String in schemas.

| Collection | Key fields | Notes |
|---|---|---|
| `Movies` | `_id` (m1…), title, description, languages[], genres[], duration (minutes), releaseDate, rating, poster, banner, cast[{name, photo}], crew[{name, role, photo}] | Exists. Cast and crew are sub-schemas without their own `_id`. |
| `Theatres` | `_id` (t1…), theatreName, city, address, screens[] | Seeded. |
| `Screens` | `_id` (sc1…), theatreId, screenName, totalSeats | Seeded. |
| `Shows` | `_id` (sh1…), movieId, theatreId, screenId, showDate (local midnight), showTime (e.g. "10:30 AM"), language, format (2D/3D/IMAX), **pricing {Platinum, Gold, Silver}** | `pricing` is a deliberate addition to the original design. |
| `Seats` | `_id` (`<showId>-<row><number>`, e.g. `sh1-A3`), showId, row, number, category (Platinum/Gold/Silver), status (available/booked) | 86 seats per show. |
| `Events` | `_id` (e1…), title, category (`live`, `premiere`, `outdoor`, `laughter`), type, city, rating, poster, date | **New collection.** Add to `mongodb/architecture.md`. |
| `Bookings` | `_id` (`BMS…`), userId (default `guest`), showId, seatIds[], totalAmount, bookingStatus (upcoming/completed/cancelled), bookedAt | **New.** |
| `Payments` | `_id` (`PAY…`), bookingId, paymentMethod (UPI, Credit Card, Debit Card, Net Banking, Wallet), transactionId, paymentStatus (success/failed/pending), paidAt | **New.** Simulated, no gateway. |

Seat layout (per show): Platinum rows A–B (10 seats each, ₹350), Gold rows C–E (10 each, ₹250), Silver rows F–H (12 each, ₹150). Seats initially booked in every show: A3, A4, C7, D2, D3, F10, G1, G2, H11.

`Users` (the Atlas collection is currently named `User`; the design doc says `Users`) belongs to the auth cycle. Do not touch it now.

---

## 6. API contract

Base path `/api`. JSON in, JSON out. Errors are `{ "error": "message" }` with a meaningful status: 400 bad input, 404 not found, 409 conflict, 500 server error. Any unknown `/api` path returns a JSON 404, and that handler must stay last in `index.js`.

| Method | Path | Behaviour |
|---|---|---|
| GET | `/movies` | Query params: `q` (title search, case-insensitive, regex-escaped), `language`, `genre`, `format` (comma-separated lists), `minRating`, `maxPrice`, `limit`. Sorted by rating descending. `format` and `maxPrice` are answered from `Shows` (movies that have a matching show; price compares against the cheapest category, Silver). Invalid numbers → 400. |
| GET | `/movies/:id` | One movie, or 404. |
| GET | `/events` | Params: `q`, `category`, `city`, `limit`. Sorted by rating descending. |
| GET | `/shows` | Exists. Theatres with their shows for `movieId` on `date` (YYYY-MM-DD, local time). |
| GET | `/shows/:id` | One show with movie and theatre summarised, plus pricing. 404 if missing. |
| GET | `/shows/:id/seats` | Seats grouped Platinum → Gold → Silver, each with its price and its rows (sorted), each row with seats `{id, number, status}`. |
| POST | `/bookings/preview` | Body `{showId, seatIds}`. Validates, requires every seat to be available (409 otherwise), returns the show summary, sorted seat labels, ticket count, ticket total, convenience fee, GST, grand total. **Writes nothing.** |
| POST | `/bookings` | Body `{showId, seatIds, paymentMethod}`. Creates the booking and payment atomically (see section 7). Returns `{bookingId}` with 201. |
| GET | `/bookings/:id` | Full booking for the confirmation page: show, seat labels, amount, payment info. |
| GET | `/bookings` | Params `userId` (default `guest`), `status`. Newest first, with movie, theatre, date, time, seat count, amount, status. |

Notes for implementers:
- Express 5 leaves `req.body` undefined when a request has no body. Always read it defensively.
- Mongoose 9 and Express 5 are in use. Check behaviour against current docs if unsure.
- A model must be `require`d before `populate` can use it. Register all models once in `index.js`.
- Dates: shows are stored at local midnight, and queries use a local-day range. Do not use `toISOString()` for date strings on the frontend, since it shifts the day across time zones. Use the existing `toLocalDateString`.

---

## 7. Booking rules (most important logic in the project)

- **Price is calculated on the server** from `Shows.pricing` and the seats' categories: ticket total, plus a per-ticket convenience fee, plus GST on the fee. Use ₹30 per ticket and 18% GST rounded to a whole rupee. **Before writing this, check the dummy numbers on the existing Booking Summary page and match them if they differ.** Keep these constants in one place.
- **Limits:** at least 1 and at most 10 seats per booking; duplicate seat ids are ignored; all seats must belong to the given show.
- **Double-booking protection:** creating a booking must run in a MongoDB transaction that (1) updates only the requested seats that are still `available` to `booked`, (2) checks that the number changed equals the number requested, otherwise aborts with 409 ("just booked by someone else"), (3) creates the Booking, (4) creates the Payment. All or nothing. Atlas is a replica set, so transactions work.
- **Payments are simulated.** The Payment is recorded as `success` with a generated transaction id. No gateway.
- Ids are readable and generated on the server (`BMS…`, `PAY…`, `TXN…`).
- The frontend passes only `showId` and `seatIds` between pages, kept in `sessionStorage` under the key `bookingDraft`. Prices are never stored on the client. The confirmation page loads its data by `bookingId` in the URL.

---

## 8. Frontend conventions

- Every page that fetches data loads `js/api.js` **before** its own page script. Classic scripts share one global scope, so a top-level `const`/`let` name may not be declared in two files (use function declarations for shared helpers).
- `js/api.js` is the single shared toolkit. It should provide: the API base URL; GET and POST helpers that check `res.ok` and throw errors carrying `status`; `toLocalDateString`; `getQueryParam`; `escapeHTML`; `debounce`; `setText`; rating, duration, date and rupee formatters; and mappers that turn API movies and events into the object shape `mediaCardHTML()` expects (including an `href` to the movie details page).
- Use `textContent` or `escapeHTML` for anything that comes from the database or the user. Never put unescaped data in `innerHTML`.
- Debounce search-as-you-type. Guard against out-of-order responses (ignore a response if a newer request has started).
- Every data-driven view needs three states: loading, empty, and error. Use friendly messages, never a blank area.
- Page navigation stays as plain `<a href>` links with query strings (`?id=`, `?movieId=`, `?showId=`, `?bookingId=`). Do not introduce client-side routing.
- Read each page's existing HTML/JS first and adapt to it. If an element needs an id, add one without changing layout or classes.

---

## 9. Task list (do in order)

Mark each done only when its acceptance checks pass. Report progress to the user after each task.

### Task 1 — Show Timings heading
Load the heading and meta line from `GET /movies/:id` using the `movieId` in the URL. Fall back to "Movie not found".
**Accept:** `?movieId=m1` shows Fireheart with its languages and genres; an unknown id shows "Movie not found".

### Task 2 — Backend foundation
Enable JSON body parsing; register all models in `index.js`; add the JSON 404 handler for unknown `/api` routes (kept last).
**Accept:** `/api/nothing` returns a JSON 404; existing routes still work.

### Task 3 — Seed data
- Add an insert-only script that adds five more movies (`m4`–`m8`, matching the titles, languages, genres and posters in the frontend's dummy list: Midnight Runners, Crimson Sky, Echoes of Us, Winter's Edge, The Glass House) without touching `m1`–`m3`. Give them descriptions, durations, release dates, ratings, banners, cast and crew in the same shape as existing movies.
- Update `seed.js`: shows for movies `m1`–`m5` (leave `m6`–`m8` without shows on purpose, to exercise empty states), 7 days ahead, same theatres and seat layout. Never delete Movies.
- Ask the user before running any seed.
**Accept:** 8 movies in Atlas; roughly 385 shows and 33,110 seats after seeding; `m6`–`m8` have no shows.

### Task 4 — Movies API filters
Implement the query parameters in section 6 for `GET /movies`, with shared helper utilities (list parsing, regex escaping).
**Accept:** `?q=glass` returns The Glass House; `?language=Hindi&genre=Action` returns Fireheart and Midnight Runners; `?format=IMAX` excludes movies with no shows; `?minRating=abc` returns 400.

### Task 5 — Events
Add the `Event` model, an insert-safe events seed script (8 events across live, premiere, outdoor and laughter categories, based on the frontend's dummy events plus two premieres), the `GET /events` route, and mount it. Update `mongodb/architecture.md`.
**Accept:** `/api/events?category=premiere` returns 2 events.

### Task 6 — Shared frontend toolkit
Rewrite `js/api.js` as described in section 8 and make sure every data-driven page loads it before its own script. Update `mediaCardHTML()` in `js/common.js` so cards link to `item.href` (falling back to `#`).
**Accept:** no console errors on any page; Show Timings still works.

### Task 7 — Movie Listing
Replace client-side filtering with API calls built from the filter panel. Only send the price limit when the slider has been moved below its maximum. Keep the result count and empty state working.
**Accept:** every filter changes the grid via a network request; clearing filters restores all movies.

### Task 8 — Search Results
Search movies and events from the API (debounced). Suggestions come from the same results, link to movie details, and escape the typed text. Remove the dummy arrays.
**Accept:** `search-results.html?q=fire` shows Fireheart plus the Fireheart premiere event; nonsense text shows the empty state; typing `<b>x</b>` renders as text.

### Task 9 — Movie Details
Fill banner, poster, title, rating, languages, genres, duration, release date, description, cast and crew from `GET /movies/:id`. The Book Tickets button goes to `show-timings.html?movieId=<id>`. Reviews remain static (no reviews collection exists).
**Accept:** cards on the listing page open the right movie; Book Tickets carries the movie id; a bad id shows "Movie not found".

### Task 10 — Home page
Recommended Movies (top-rated, limit 8) and the four event rows (Live Events, Premieres, Outdoor Events, Laughter Shows) load from the API. Each row loads independently; one failure must not blank the others. Keep the banner carousel static.
**Accept:** all five rows populate from the database; hover and carousel behaviour unchanged.

### Task 11 — Seat API
Add `GET /shows/:id` and `GET /shows/:id/seats` as specified in section 6, with a shared helper that shapes a show summary.
**Accept:** `/api/shows/sh1/seats` returns three categories with correct row and seat counts, and A3 and A4 booked.

### Task 12 — Seat Selection page
Draw the seat map and the show header from the API. Booked seats are disabled. Use one delegated click handler. Limit selection to 10 seats, show the live total (display only), and on Proceed save `{showId, seatIds}` to `sessionStorage["bookingDraft"]` and go to the summary page.
**Accept:** the map matches the current design; booked seats cannot be selected; the total updates live.

### Task 13 — Booking preview API and Summary page
Implement the server-side pricing, `POST /bookings/preview`, and the Summary page reading the draft and showing the server's numbers. Handle a missing draft and a 409 (with a link back to seat selection).
**Accept:** two Platinum seats on the summary total exactly what the server computes; opening the page with no draft shows a friendly message.

### Task 14 — Create booking (transaction) and Payment page
Add the `Booking` and `Payment` models, the `POST /bookings` transaction, and the Payment page wiring. Read the chosen method from the existing selected payment option, disable the Pay button while the request runs, then redirect to the confirmation page with the new booking id. Update `seed.js` to also clear Bookings and Payments.
**Accept:** paying updates the seats to booked in Atlas and creates one Booking and one Payment; repeating the same request returns 409 and creates nothing; two browser tabs racing for the same seat yields exactly one success.

### Task 15 — Confirmation page
Load the booking by `bookingId` from the URL and fill Booking ID, movie, theatre, seats, date, time and amount. The existing Copy Booking ID button must copy the real id. Handle unknown ids.
**Accept:** refreshing the page keeps working; an unknown id shows "Booking not found".

### Task 16 — Booking History
Add `GET /bookings` and wire the history page, including the status filter buttons. Use the `guest` user for now and leave one clearly named constant that the auth cycle will replace.
**Accept:** new bookings appear newest first; each filter button re-queries the server; each card links to its confirmation page.

### Task 17 — Wrap-up
- Remove leftover dummy data and unused code from the frontend.
- Update `mongodb/architecture.md` (pricing on Shows, Events collection, string ids, guest bookings, simulated payments).
- Run the full end-to-end flow: Home → movie → details → Book Tickets → date → showtime → seats → summary → pay → confirmation → history.
- Run the double-booking check.
- Summarise what changed and list anything that needs the team's attention.

---

## 10. Definition of done for this cycle

- No page reads dummy data for movies, events, theatres, shows, seats or bookings.
- The whole booking flow works and persists to Atlas.
- No console errors on any page; loading, empty and error states exist everywhere data is fetched.
- The UI looks exactly as before.
- `.env` and `node_modules/` are not tracked by git.
- Authentication is untouched, ready for the next cycle.

---

## 11. Known gaps (do NOT fix this cycle; mention to the user)

- Booking status never becomes `completed` automatically.
- No seat-hold timer; seats are locked only at payment.
- Reviews and movie certificates (UA/U) are not in the design.
- The navbar city selector (currently Kolkata) does not filter data; seeded theatres are in Mumbai.
- The `User` vs `Users` collection name mismatch is to be resolved at the start of the auth cycle.

---

## 12. Next cycle: authentication (for reference only)

User model with hashed passwords, register and login (email or phone), JWT, an auth middleware, protected booking routes replacing `guest`, Sign Up, Login and Forgot Password pages, navbar login state, and the editable Profile page. Do not start any of this now.
