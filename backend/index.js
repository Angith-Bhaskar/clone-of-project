require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Register every model once so populate() can resolve refs anywhere.
require('./models/Movie');
require('./models/Theatre');
require('./models/Screen');
require('./models/Show');
require('./models/Seat');
require('./models/Event');
require('./models/Booking');
require('./models/Payment');

const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const eventRoutes = require('./routes/eventRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('BookMyShow API is running');
});

app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

// Unknown /api/* path -> JSON 404. Must stay last.
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});