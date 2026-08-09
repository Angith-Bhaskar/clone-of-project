# BookMyShow — MongoDB Atlas Architecture (Design Only)

> **This is a schema design document, not a live integration.** No driver is
> installed, no connection string exists anywhere in this repo, and none of
> the 14 frontend pages talk to a database — all data on-screen is
> hardcoded/dummy, per the project's Phase 1 scope. This document exists so
> the data model is agreed on ahead of a future backend phase.

**Database name:** `BookMyShow`

## Collections

### Users
Registered viewers (maps to Login / Sign Up / Profile pages).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Full name |
| `email` | String | Unique, used for email login |
| `phone` | String | 10-digit Indian mobile, used for phone login |
| `password` | String | Would be a bcrypt hash in a real backend — **not implemented here** |
| `profileImage` | String | URL/path to avatar |
| `createdAt` | Date | Account creation timestamp |

### Movies
Catalog entries (maps to Movie Listing / Movie Details / Search Results).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `title` | String | |
| `description` | String | Shown in the expandable "About" section |
| `languages` | [String] | e.g. `["Hindi", "English"]` |
| `genres` | [String] | e.g. `["Sci-Fi", "Thriller"]` |
| `duration` | Number | Minutes |
| `releaseDate` | Date | |
| `rating` | Number | Aggregate user rating, e.g. `8.9` |
| `poster` | String | Poster image URL |
| `banner` | String | Wide banner image URL |
| `cast` | [{ name: String, photo: String }] | |
| `crew` | [{ name: String, role: String, photo: String }] | |

### Theatres
Cinema venues (maps to Show Timings).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `theatreName` | String | |
| `city` | String | Matches the navbar city selector |
| `address` | String | |
| `screens` | [ObjectId] | References into `Screens` |

### Screens
Individual auditoriums within a theatre.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `theatreId` | ObjectId | References `Theatres._id` |
| `screenName` | String | e.g. `"Screen 1"`, `"IMAX"` |
| `totalSeats` | Number | Sum across all seat categories |

### Shows
A specific screening: one movie, in one screen, at one date/time.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `movieId` | ObjectId | References `Movies._id` |
| `theatreId` | ObjectId | References `Theatres._id` |
| `screenId` | ObjectId | References `Screens._id` |
| `showDate` | Date | |
| `showTime` | String | e.g. `"8:30 PM"` |
| `language` | String | Dub/subtitle track for this show |
| `format` | String | `"2D"` \| `"3D"` \| `"IMAX"` |

### Seats
Individual seats belonging to a show (maps to Seat Selection's Platinum/Gold/Silver grid).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `showId` | ObjectId | References `Shows._id` |
| `row` | String | e.g. `"A"` |
| `number` | Number | Seat number within the row |
| `category` | String | `"Platinum"` \| `"Gold"` \| `"Silver"` |
| `status` | String | `"available"` \| `"booked"` |

### Bookings
A completed reservation (maps to Booking Summary / Booking Confirmation / Booking History).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `userId` | ObjectId | References `Users._id` |
| `showId` | ObjectId | References `Shows._id` |
| `seatIds` | [ObjectId] | References `Seats._id` |
| `totalAmount` | Number | Grand total (tickets + convenience fee + GST) |
| `bookingStatus` | String | `"upcoming"` \| `"completed"` \| `"cancelled"` |
| `bookedAt` | Date | |

### Payments
Payment attempt tied to a booking (maps to the Payment page).

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `bookingId` | ObjectId | References `Bookings._id` |
| `paymentMethod` | String | `"UPI"` \| `"Credit Card"` \| `"Debit Card"` \| `"Net Banking"` \| `"Wallet"` |
| `transactionId` | String | Would come from the payment gateway — **not implemented here** |
| `paymentStatus` | String | `"success"` \| `"failed"` \| `"pending"` |
| `paidAt` | Date | |

## Relationships at a glance

```
Users ──< Bookings >── Shows ──> Movies
                │         └──> Screens ──> Theatres
                ├──< Seats (via seatIds, scoped to showId)
                └──< Payments (1:1 per booking)
```

## Notes for a future backend phase

- Every ObjectId reference above would be a manual `$lookup`/populate in the
  application layer — Mongo does not enforce foreign keys.
- `Seats` are modeled per-show (not shared across shows) so that `status`
  naturally resets for each new screening without extra bookkeeping.
- Real password hashing, session/JWT handling, and payment gateway
  integration are explicitly out of scope for this document and for the
  current phase of the project — see the root `CLAUDE.md` Hard Constraints.
