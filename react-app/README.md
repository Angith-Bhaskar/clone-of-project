# React pages

Three pages are built with React (the rest of the site is plain HTML/CSS/JS):

| Page | Source | Built file |
|---|---|---|
| Seat Selection | `src/seat-selection/` | `../react-dist/seat-selection.js` |
| Movie Listing | `src/movies/` | `../react-dist/movies.js` |
| Booking History | `src/booking-history/` | `../react-dist/booking-history.js` |

The HTML pages (`seat-selection.html`, `movies.html`, `booking-history.html`) contain a `<div id="root">`
and load the built file. They still use the shared navbar, footer, CSS and `js/api.js`.

## After changing React code

```
cd react-app
npm install        # first time only
npm run build      # rewrites ../react-dist/
```

`npm run watch` rebuilds on every save. The built `react-dist/` is committed, so the site works
with Live Server without needing Node installed.
