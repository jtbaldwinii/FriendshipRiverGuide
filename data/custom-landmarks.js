// Small, maintainable layer for changes to the guide.
// Use LANDMARK_OVERRIDES to update an existing POI without editing guide-data.js.
// Use LANDMARK_ADDITIONS + ROUTE_INSERTS to add new POIs.

export const LANDMARK_OVERRIDES = {
  'st-regis': { photo: 'assets/st-regis-2026.jpg' },
  'willis-tower': { photo: 'assets/willis-tower-2026(1).jpg' }
};

export const LANDMARK_ADDITIONS = [
  // Example:
  // {id:'new-poi',name:'New POI',lat:41.88,lng:-87.63,side:'Port',route:'south',photo:'assets/new-poi.jpg',subtitle:'...',architect:'...',year:'...',style:'...',story:'...',fact:'...'}
];

export const ROUTE_INSERTS = [
  // Example:
  // {route:'south',direction:'outbound',id:'new-poi',after:'300-wacker'},
  // {route:'south',direction:'return',id:'new-poi',before:'300-wacker'}
];
