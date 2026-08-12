// Small, maintainable layer for changes to the guide.
// Use LANDMARK_OVERRIDES to update an existing POI without editing guide-data.js.
// Use LANDMARK_ADDITIONS + ROUTE_INSERTS to add new POIs.

export const LANDMARK_OVERRIDES = {
  'st-regis': {
    photo: 'assets/st-regis-2026.jpg',
    fact: 'See the dark band near the top of the tallest tower? Wind-tunnel testing showed the building would sway more than desired for occupant comfort, so the design was revised to create an unoccupied, two-story-tall “blow-through” opening. Letting wind pass through the tower reduces wind-induced motion—the unusual dark gap is structural engineering made visible.'
  },
  'willis-tower': { photo: 'assets/willis-tower-2026(1).jpg' }
};

export const LANDMARK_ADDITIONS = [
  {
    id:'chicago-harbor-lock',
    name:'Chicago Harbor Lock',
    lat:41.88831,
    lng:-87.61175,
    side:'Ahead',
    route:'main',
    photo:'',
    subtitle:'The gateway separating Lake Michigan from the Chicago River',
    architect:'Sanitary District of Chicago',
    year:'1936–38',
    style:'Navigation infrastructure',
    story:'The Chicago Harbor Lock separates Lake Michigan from the Chicago River and controls the small but important difference in water level between them. Built as part of the larger river-reversal water-control system, its chamber is 600 feet long and 80 feet wide; boats move through as water enters or leaves by gravity through the lock gates.',
    fact:'A typical lock cycle takes about 15–17 minutes, and the lake and river are commonly separated by roughly two to five feet of water level.'
  }
];

export const ROUTE_INSERTS = [
  {route:'south',direction:'outbound',id:'chicago-harbor-lock',before:'st-regis'},
  {route:'south',direction:'return',id:'chicago-harbor-lock',after:'st-regis'},
  {route:'north',direction:'outbound',id:'chicago-harbor-lock',before:'st-regis'},
  {route:'north',direction:'return',id:'chicago-harbor-lock',after:'st-regis'}
];
