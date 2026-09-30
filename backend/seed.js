require('dotenv').config();
const mongoose = require('mongoose');
const Theatre = require('./models/Theatre');
const Screen = require('./models/Screen');
const Show = require('./models/Show');
const Seat = require('./models/Seat');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');

// Shows are created for these movies only. m6-m8 are deliberately left
// without shows, to exercise empty states (CLAUDE.md Task 3).
const MOVIE_IDS = ['m1', 'm2', 'm3', 'm4', 'm5'];
const DAYS = 7;          // how many days of shows to create

const SEAT_CATEGORIES = [
  { name: 'Platinum', price: 350, rows: ['A', 'B'], seatsPerRow: 10 },
  { name: 'Gold', price: 250, rows: ['C', 'D', 'E'], seatsPerRow: 10 },
  { name: 'Silver', price: 150, rows: ['F', 'G', 'H'], seatsPerRow: 12 },
];

const BOOKED = ['A3', 'A4', 'C7', 'D2', 'D3', 'F10', 'G1', 'G2', 'H11'];

// Replace with the FULL array from your frontend file
const THEATRES = [
  {
    name: 'PVR Cinemas: Phoenix Mall',
    address: 'Phoenix Marketcity, Kurla West, Mumbai',
    languages: ['English', 'Hindi'],
    formats: ['IMAX', '2D'],
    times: ['10:30 AM', '1:45 PM', '5:00 PM', '8:30 PM'],
  },
  {
    name: 'INOX: R-City',
    address: 'R-City Mall, Ghatkopar West, Mumbai',
    languages: ['Hindi'],
    formats: ['2D'],
    times: ['11:00 AM', '2:15 PM', '6:00 PM'],
  },
  {
    name: 'Cinepolis: Fun Republic',
    address: 'Fun Republic Mall, Andheri West, Mumbai',
    languages: ['English'],
    formats: ['3D', '2D'],
    times: ['12:00 PM', '3:30 PM', '7:15 PM', '10:00 PM'],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Promise.all([
      Theatre.deleteMany({}),
      Screen.deleteMany({}),
      Show.deleteMany({}),
      Seat.deleteMany({}),
      // Bookings/Payments reference showId/seatIds that are about to be
      // recreated with fresh ids, so any old ones would dangle otherwise.
      Booking.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    const totalSeats = SEAT_CATEGORIES.reduce(
      (sum, c) => sum + c.rows.length * c.seatsPerRow, 0
    );
    const pricing = Object.fromEntries(
      SEAT_CATEGORIES.map((c) => [c.name, c.price])
    );

    const theatres = [], screens = [], shows = [], seats = [];
    let showCounter = 1;

    THEATRES.forEach((t, i) => {
      const theatreId = `t${i + 1}`;
      const screenId = `sc${i + 1}`;

      theatres.push({
        _id: theatreId,
        theatreName: t.name,
        city: 'Mumbai',
        address: t.address,
        screens: [screenId],
      });
      screens.push({ _id: screenId, theatreId, screenName: 'Screen 1', totalSeats });

      MOVIE_IDS.forEach((movieId) => {
        for (let d = 0; d < DAYS; d++) {
          const showDate = new Date();
          showDate.setDate(showDate.getDate() + d);
          showDate.setHours(0, 0, 0, 0);

          t.times.forEach((time, k) => {
            const showId = `sh${showCounter++}`;

            shows.push({
              _id: showId,
              movieId,
              theatreId,
              screenId,
              showDate,
              showTime: time,
              language: t.languages[k % t.languages.length],
              format: t.formats[k % t.formats.length],
              pricing,
            });

            SEAT_CATEGORIES.forEach((cat) => {
              cat.rows.forEach((row) => {
                for (let n = 1; n <= cat.seatsPerRow; n++) {
                  seats.push({
                    _id: `${showId}-${row}${n}`,
                    showId,
                    row,
                    number: n,
                    category: cat.name,
                    status: BOOKED.includes(`${row}${n}`) ? 'booked' : 'available',
                  });
                }
              });
            });
          });
        }
      });
    });

    await Theatre.insertMany(theatres);
    await Screen.insertMany(screens);
    await Show.insertMany(shows);
    await Seat.insertMany(seats);

    console.log(
      `Seeded: ${theatres.length} theatres, ${screens.length} screens, ` +
      `${shows.length} shows, ${seats.length} seats`
    );
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

seed();