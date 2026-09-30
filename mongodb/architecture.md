# BookMyShow — MongoDB Atlas Architecture

> **This document describes the live schema.** The backend (`backend/`) is a
> Node.js + Express + Mongoose API backed by this database, and all 14
> frontend pages read from it through that API — nothing on-screen is
> hardcoded/dummy data any more, except the known gaps called out at the
> bottom of this file.

**Database name:** `bookmyshow` (lowercase). Collection names below are
**case-sensitive** and capitalized, matching each Mongoose model's explicit
`collection` option.

**Ids are readable strings, not ObjectIds** (`m1`, `t1`, `sh1`, `sh1-A3`,
`e1`, `BMS…`, `PAY…`), so every schema declares `_id: String`.

## Collections

### Users
Registered viewers (maps to Login / Sign Up / Profile pages). **Not yet
wired up — belongs to the next (authentication) cycle.** The live Atlas
collection is currently named `User`; this doc's `Users` name should be
reconciled with that at the start of the auth cycle.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Full name |
| `email` | String | Unique, used for email login |
| `phone` | String | 10-digit Indian mobile, used for phone login |
| `password` | String | Would be a bcrypt hash — **not implemented here** |
| `profileImage` | String | URL/path to avatar |
| `createdAt` | Date | Account creation timestamp |

### Movies
Catalog entries (maps to Movie Listing / Movie Details / Search Results / Home).

| Field | Type | Notes |
|---|---|---|
| `_id` | String | e.g. `m1` |
| `title` | String | |
| `description` | String | Shown in the expandable "About" section |
| `languages` | [String] | e.g. `["Hindi", "English"]` |
| `genres` | [String] | e.g. `["Sci-Fi", "Thriller"]` |
| `duration` | Number | Minutes |
| `releaseDate` | Date | |
| `rating` | Number | Aggregate user rating, e.g. `8.9` |
| `poster` | String | Poster image URL |
| `banner` | String | Wide banner image URL |
| `cast` | [{ name: String, photo: String }] | Sub-schema, no own `_id` |
| `crew` | [{ name: String, role: String, photo: String }] | Sub-schema, no own `_id` |

There is no certificate (UA/U) field — the Movie Details tag row and card
meta lines show genres/languages/rating instead. There is also no reviews
collection; Movie Details' reviews section stays static.

### Events
Live events, premieres, outdoor events and laughter shows (maps to the Home
page event rows and Search Results).

| Field | Type | Notes |
|---|---|---|
| `_id` | String | e.g. `e1` |
| `title` | String | |
| `category` | String | `"live"` \| `"premiere"` \| `"outdoor"` \| `"laughter"` |
| `type` | String | e.g. `"Stand-up"`, `"Music Concert"`, `"Food Fest"` |
| `city` | String | |
| `rating` | Number | |
| `poster` | String | Poster image URL |
| `date` | Date | |

### Theatres
Cinema venues (maps to Show Timings).

| Field | Type | Notes |
|---|---|---|
| `_id` | String | e.g. `t1` |
| `theatreName` | String | |
| `city` | String | All seeded theatres are in Mumbai; the navbar city selector doesn't filter by it (known gap) |
| `address` | String | |
| `screens` | [String] | References into `Screens` |

### Screens
Individual auditoriums within a theatre.

| Field | Type | Notes |
|---|---|---|
| `_id` | String | e.g. `sc1` |
| `theatreId` | String | References `Theatres._id` |
| `screenName` | String | e.g. `"Screen 1"` |
| `totalSeats` | Number | Sum across all seat categories (86) |

### Shows
A specific screening: one movie, in one screen, at one date/time.

| Field | Type | Notes |
|---|---|---|
| `_id` | String | e.g. `sh1` |
| `movieId` | String | References `Movies._id` |
| `theatreId` | String | References `Theatres._id` |
| `screenId` | String | References `Screens._id` |
| `showDate` | Date | Stored at local midnight; queries use a local-day range, never `toISOString()` |
| `showTime` | String | e.g. `"8:30 PM"` |
| `language` | String | Dub/subtitle track for this show |
| `format` | String | `"2D"` \| `"3D"` \| `"IMAX"` |
| `pricing` | { Platinum: Number, Gold: Number, Silver: Number } | **Added beyond the original design** — per-category ticket price for this show |

### Seats
Individual seats belonging to a show (maps to Seat Selection's Platinum/Gold/Silver grid).

| Field | Type | Notes |
|---|---|---|
| `_id` | String | `<showId>-<row><number>`, e.g. `sh1-A3` |
| `showId` | String | References `Shows._id` |
| `row` | String | e.g. `"A"` |
| `number` | Number | Seat number within the row |
| `category` | String | `"Platinum"` \| `"Gold"` \| `"Silver"` |
| `status` | String | `"available"` \| `"booked"` — flipped inside the booking transaction, never client-side |

Layout per show: Platinum rows A–B (10 seats each, 86 seats total across
Platinum/Gold/Silver). There is no seat-hold timer — a seat is only locked
at the moment of payment (known gap).

### Bookings
A completed reservation (maps to Booking Summary / Booking Confirmation / Booking History).

| Field | Type | Notes |
|---|---|---|
| `_id` | String | `BMS…`, generated server-side |
| `userId` | String | Defaults to `"guest"` (the `GUEST_USER_ID` constant in `backend/utils/currentUser.js`) — **no authentication in this cycle**, every booking belongs to the same placeholder user until the auth cycle replaces this |
| `showId` | String | References `Shows._id` |
| `seatIds` | [String] | References `Seats._id` |
| `totalAmount` | Number | Grand total (tickets + convenience fee + GST), computed server-side — the client never sends or trusts a price |
| `bookingStatus` | String | `"upcoming"` \| `"completed"` \| `"cancelled"` — never transitions to `"completed"` automatically (known gap) |
| `bookedAt` | Date | |

### Payments
Payment attempt tied to a booking (maps to the Payment page). **Simulated —
no real payment gateway is integrated**; every payment is recorded as an
immediate `"success"` with a generated transaction id.

| Field | Type | Notes |
|---|---|---|
| `_id` | String | `PAY…`, generated server-side |
| `bookingId` | String | References `Bookings._id` |
| `paymentMethod` | String | `"UPI"` \| `"Credit Card"` \| `"Debit Card"` \| `"Net Banking"` \| `"Wallet"` |
| `transactionId` | String | `TXN…`, generated server-side — not a real gateway reference |
| `paymentStatus` | String | `"success"` \| `"failed"` \| `"pending"` (always `"success"` in practice, since there's no real gateway) |
| `paidAt` | Date | |

## Relationships at a glance

```
Users ──< Bookings >── Shows ──> Movies
                │         └──> Screens ──> Theatres
                ├──< Seats (via seatIds, scoped to showId)
                └──< Payments (1:1 per booking)
```

## Booking creation is transactional

`POST /api/bookings` runs a MongoDB transaction (Atlas is a replica set, so
this works): it flips only the requested seats that are still `available` to
`booked`, aborts with 409 if that count doesn't match what was requested
(someone else booked one first), then creates the Booking and Payment — all
or nothing. This is what prevents two users from double-booking the same
seat.

## Known gaps (intentionally out of scope this cycle)

- Booking status never becomes `completed` automatically.
- No seat-hold timer; seats are only locked at payment.
- No reviews collection; Movie Details' reviews section and movie
  certificates (UA/U) aren't in the data model.
- The navbar city selector doesn't filter data; all seeded theatres are in Mumbai.
- The `User` vs `Users` collection name mismatch, and authentication itself,
  are deferred to the next cycle.
