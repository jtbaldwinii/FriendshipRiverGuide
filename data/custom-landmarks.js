// Small, maintainable layer for changes to the guide.
// Use LANDMARK_OVERRIDES to update an existing POI without editing guide-data.js.
// Use LANDMARK_ADDITIONS + ROUTE_INSERTS to add new POIs.

export const LANDMARK_OVERRIDES = {
  'st-regis': {
    photo: 'assets/st-regis-2026.jpg',
    fact: 'See the dark band near the top of the tallest tower? Wind-tunnel testing showed the building would sway more than desired for occupant comfort, so the design was revised to create an unoccupied, two-story-tall “blow-through” opening. Letting wind pass through the tower reduces wind-induced motion—the unusual dark gap is structural engineering made visible.'
  },
  'willis-tower': {
    photo: 'assets/willis-tower-2026.jpg',
    fact: 'The bundled-tube idea is famously explained with a handful of cigarettes: nine cigarettes held together illustrate the nine structural tubes that form the tower. Engineer Fazlur Rahman Khan used the cigarette-bundle analogy to make the structural concept easy to visualize.'
  },
  '300-wacker': {
    photo: 'assets/300-south-wacker-2026.jpg'
  },
  'marina-city': {
    fact: 'Marina City starred in one of Chicago’s most memorable movie stunts. For Steve McQueen’s 1980 film The Hunter, a Pontiac was sent off the 17th-floor parking ramp of the west tower and plunged into the Chicago River. McQueen was in the film, but he was not driving the flying car.'
  },
  'wolf-point': {
    fact: 'A special one for our healthcare IT guests: look toward the west end of Wolf Point for the office building with the distinctive red sculpture out front. CommonSpirit Health has offices there—an especially appropriate landmark for today’s crew.'
  }
};

export const LANDMARK_ADDITIONS = [
  {
    id:'chicago-harbor-lock',
    name:'Chicago Harbor Lock',
    lat:41.88831,
    lng:-87.61175,
    side:'Ahead',
    route:'main',
    photo:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Chicago_Harbor_Lock_Aerial_Photo.jpg/1280px-Chicago_Harbor_Lock_Aerial_Photo.jpg',
    credit:'Steve Fischer / U.S. Army Corps of Engineers · Public domain',
    subtitle:'The gateway separating Lake Michigan from the Chicago River',
    architect:'Sanitary District of Chicago',
    year:'1936–38',
    style:'Navigation infrastructure',
    story:'The Chicago Harbor Lock separates Lake Michigan from the Chicago River and controls the small but important difference in water level between them. Built as part of the larger river-reversal water-control system, its chamber is 600 feet long and 80 feet wide; boats move through as water enters or leaves by gravity through the lock gates.',
    fact:'A typical lock cycle takes about 15–17 minutes, and the lake and river are commonly separated by roughly two to five feet of water level.'
  },
  {
    id:'civic-opera',
    name:'Civic Opera House / Lyric Opera',
    lat:41.88256,
    lng:-87.63749,
    side:'Port',
    route:'south',
    photo:'assets/civic-opera-2026.jpg',
    credit:'Friendship · Chicago River, 2026',
    subtitle:'Chicago’s monumental opera house disguised as a riverfront office tower',
    architect:'Graham, Anderson, Probst & White',
    year:'1929',
    style:'Art Deco / French Renaissance Revival',
    story:'Built for utility magnate Samuel Insull, the Civic Opera Building combines a grand opera house with a massive commercial office complex. From the river, the composition is especially legible: the low central auditorium, flanking office wings and tall rear tower create a monumental stepped silhouette.',
    fact:'The river facade really does resemble a giant armchair—the opera house is the “seat,” the office wings are the “arms,” and the 45-story tower is the “back.” A popular Chicago legend says Insull deliberately turned that chair’s back toward New York; the armchair form is documented, but the New York snub is best treated as lore rather than proven design intent.'
  }
];

export const ROUTE_INSERTS = [
  {route:'south',direction:'outbound',id:'chicago-harbor-lock',before:'st-regis'},
  {route:'south',direction:'return',id:'chicago-harbor-lock',after:'st-regis'},
  {route:'north',direction:'outbound',id:'chicago-harbor-lock',before:'st-regis'},
  {route:'north',direction:'return',id:'chicago-harbor-lock',after:'st-regis'},

  {route:'south',direction:'outbound',id:'civic-opera',after:'150-riverside'},
  {route:'south',direction:'return',id:'civic-opera',before:'150-riverside'}
];
