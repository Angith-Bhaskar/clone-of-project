/* Insert-only seed: adds movies m4-m8 without touching m1-m3 or any other
   existing document. Never calls Movie.deleteMany — see CLAUDE.md hard rule 3.
   Run with: node seedMovies.js */
require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

// Titles/languages/genres/posters match the frontend's dummy ALL_MOVIES list
// (js/movies.js) exactly, per CLAUDE.md Task 3.
const NEW_MOVIES = [
  {
    _id: 'm4',
    title: 'Midnight Runners',
    description: 'Two mismatched rookie cops chase a smuggling ring across the city in one wild night.',
    languages: ['Hindi'],
    genres: ['Action', 'Comedy'],
    duration: 118,
    releaseDate: new Date('2026-05-08'),
    rating: 7.4,
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&q=80',
    cast: [
      { name: 'Arjun Malhotra', photo: 'https://i.pravatar.cc/150?img=12' },
      { name: 'Naina Sethi', photo: 'https://i.pravatar.cc/150?img=13' },
    ],
    crew: [
      { name: 'Rohan Dutta', role: 'Director', photo: 'https://i.pravatar.cc/150?img=14' },
    ],
  },
  {
    _id: 'm5',
    title: 'Crimson Sky',
    description: 'A daredevil pilot risks everything to complete one last cross-country flight.',
    languages: ['Telugu'],
    genres: ['Adventure'],
    duration: 142,
    releaseDate: new Date('2026-04-17'),
    rating: 8.0,
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&q=80',
    cast: [
      { name: 'Kiran Reddy', photo: 'https://i.pravatar.cc/150?img=15' },
      { name: 'Ananya Rao', photo: 'https://i.pravatar.cc/150?img=16' },
    ],
    crew: [
      { name: 'Sanjay Varma', role: 'Director', photo: 'https://i.pravatar.cc/150?img=17' },
    ],
  },
  {
    _id: 'm6',
    title: 'Echoes of Us',
    description: 'Two childhood friends reconnect years later and confront what was left unsaid.',
    languages: ['Tamil'],
    genres: ['Romance', 'Drama'],
    duration: 131,
    releaseDate: new Date('2026-07-22'),
    rating: 7.9,
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600&q=80',
    cast: [
      { name: 'Meera Pillai', photo: 'https://i.pravatar.cc/150?img=18' },
      { name: 'Vishnu Kumar', photo: 'https://i.pravatar.cc/150?img=19' },
    ],
    crew: [
      { name: 'Lakshmi Iyer', role: 'Director', photo: 'https://i.pravatar.cc/150?img=20' },
    ],
  },
  {
    _id: 'm7',
    title: "Winter's Edge",
    description: 'A detective snowed in at a remote lodge must unmask a killer before the roads clear.',
    languages: ['English'],
    genres: ['Thriller'],
    duration: 124,
    releaseDate: new Date('2026-01-30'),
    rating: 8.3,
    poster: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=1600&q=80',
    cast: [
      { name: 'Claire Bennett', photo: 'https://i.pravatar.cc/150?img=21' },
      { name: 'Daniel Osei', photo: 'https://i.pravatar.cc/150?img=22' },
    ],
    crew: [
      { name: 'Marcus Webb', role: 'Director', photo: 'https://i.pravatar.cc/150?img=23' },
    ],
  },
  {
    _id: 'm8',
    title: 'The Glass House',
    description: 'A family moves into a strange new home where nothing stays where it was left.',
    languages: ['Hindi'],
    genres: ['Mystery'],
    duration: 109,
    releaseDate: new Date('2026-08-14'),
    rating: 7.7,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80',
    banner: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80',
    cast: [
      { name: 'Ishaan Chatterjee', photo: 'https://i.pravatar.cc/150?img=24' },
      { name: 'Ritika Sharma', photo: 'https://i.pravatar.cc/150?img=25' },
    ],
    crew: [
      { name: 'Farhan Ahmed', role: 'Director', photo: 'https://i.pravatar.cc/150?img=26' },
    ],
  },
];

async function seedMovies() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    let inserted = 0;
    let skipped = 0;

    for (const movie of NEW_MOVIES) {
      const result = await Movie.updateOne(
        { _id: movie._id },
        { $setOnInsert: movie },
        { upsert: true }
      );
      if (result.upsertedCount > 0) {
        inserted++;
      } else {
        skipped++;
      }
    }

    console.log(`Movies seed: ${inserted} inserted, ${skipped} already existed (untouched).`);
  } catch (err) {
    console.error('Movie seed failed:', err.message);
  } finally {
    await mongoose.connection.close();
  }
}

seedMovies();
