/* Insert-safe seed: adds 8 events (live/premiere/outdoor/laughter) based on
   the frontend's dummy event rows (js/home.js), plus two premieres.
   Never deletes anything. Run with: node seedEvents.js */
require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const EVENTS = [
  // Live Events (from home.js LIVE_EVENTS)
  { _id: 'e1', title: 'Comedy Nights Live', category: 'live', type: 'Stand-up', city: 'Mumbai', rating: 8.5, poster: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&q=80', date: new Date('2026-10-18') },
  { _id: 'e2', title: 'Neon Dreams Tour', category: 'live', type: 'Music Concert', city: 'Delhi', rating: 9.0, poster: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80', date: new Date('2026-10-25') },
  { _id: 'e3', title: 'Jazz Under Stars', category: 'live', type: 'Music', city: 'Bengaluru', rating: 8.1, poster: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', date: new Date('2026-11-02') },

  // Two extra premieres, tied to real movies in the catalog so they surface
  // alongside the movie itself in search (CLAUDE.md Task 8 acceptance check).
  { _id: 'e4', title: 'Fireheart: Premiere Night', category: 'premiere', type: 'Premiere Screening', city: 'Mumbai', rating: 8.4, poster: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&q=80', date: new Date('2026-10-10') },
  { _id: 'e5', title: "Winter's Edge: Premiere Night", category: 'premiere', type: 'Premiere Screening', city: 'Delhi', rating: 8.0, poster: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&q=80', date: new Date('2026-10-15') },

  // Outdoor Events (from home.js OUTDOOR_EVENTS)
  { _id: 'e6', title: 'Street Food Carnival', category: 'outdoor', type: 'Food Fest', city: 'Chennai', rating: 8.6, poster: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', date: new Date('2026-11-08') },
  { _id: 'e7', title: 'Kite Flying Festival', category: 'outdoor', type: 'Outdoor', city: 'Ahmedabad', rating: 8.0, poster: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&q=80', date: new Date('2026-11-15') },

  // Laughter Shows (from home.js LAUGHTER_SHOWS)
  { _id: 'e8', title: 'Stand-Up Saturdays', category: 'laughter', type: 'Comedy', city: 'Mumbai', rating: 8.7, poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&q=80', date: new Date('2026-10-31') },
];

async function seedEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    let inserted = 0;
    let skipped = 0;

    for (const event of EVENTS) {
      const result = await Event.updateOne(
        { _id: event._id },
        { $setOnInsert: event },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log(`Events seed: ${inserted} inserted, ${skipped} already existed (untouched).`);
  } catch (err) {
    console.error('Event seed failed:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

seedEvents();
