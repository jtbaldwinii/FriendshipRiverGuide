# Friendship Chicago River Guide

Static GitHub Pages guide for `friendship.catioresort.com`.

## Updating an existing landmark

Edit `data/custom-landmarks.js` and add or change an entry in `LANDMARK_OVERRIDES`.

Example:

```js
'st-regis': { photo: 'assets/st-regis-2026.jpg', subtitle: 'Updated subtitle' }
```

## Replacing a photo

1. Upload the new image into `assets/` with a new descriptive filename.
2. Update that landmark's `photo` value in `data/custom-landmarks.js`.
3. Change the version string in `data/build.json` to any new value, e.g. `20260812-1530`.

Visitors can continue using the normal URL. `js/bootstrap.js` checks `build.json` with browser caching disabled and automatically loads the current CSS, JS, data and local images with the new build version.

## Adding a point of interest

Add the landmark object to `LANDMARK_ADDITIONS` in `data/custom-landmarks.js`, then add one or more `ROUTE_INSERTS` entries describing where it belongs in the tour.

Example:

```js
export const LANDMARK_ADDITIONS = [
  {
    id:'new-poi',
    name:'New POI',
    lat:41.88,
    lng:-87.63,
    side:'Port',
    route:'south',
    photo:'assets/new-poi.jpg',
    subtitle:'Short recognition cue',
    architect:'Architect',
    year:'2026',
    style:'Style',
    story:'Main guide story.',
    fact:'Fun fact.'
  }
];

export const ROUTE_INSERTS = [
  {route:'south',direction:'outbound',id:'new-poi',after:'300-wacker'},
  {route:'south',direction:'return',id:'new-poi',before:'300-wacker'}
];
```

Then bump `data/build.json`.

## Bridges

Bridge centers and labels live in `data/bridges.js`. The map renderer projects each bridge onto the river and automatically draws a deck perpendicular to the river centerline, with its name nearby. Add or adjust a bridge by editing only its name, branch and coordinates.

## Core files

- `index.html` — app shell
- `js/bootstrap.js` — automatic build/version loader
- `js/app.js` — UI, GPS and map rendering
- `data/guide-data.js` — legacy/base guide dataset
- `data/custom-landmarks.js` — preferred place for POI changes and additions
- `data/bridges.js` — bridge map layer
- `data/build.json` — current build version
- `css/app.css` — main styling
- `css/bridges.css` — bridge map styling
- `assets/` — landmark photos
