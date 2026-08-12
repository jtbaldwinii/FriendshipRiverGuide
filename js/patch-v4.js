import {LANDMARKS, TOUR_ORDERS, MAP_REFS} from '../data/guide-data.js?v=3';

if (!LANDMARKS.some(x=>x.id==='willis')) {
  LANDMARKS.push({
    id:'willis',
    name:'Sears Tower (Willis Tower)',
    lat:41.878876,
    lng:-87.635918,
    side:'Starboard',
    route:'south',
    out:8,
    ret:8,
    photo:'assets/willis.svg',
    subtitle:'Chicago’s bundled-tube icon rising above the South Branch',
    architect:'Skidmore, Owings & Merrill — Bruce Graham & Fazlur Rahman Khan',
    year:'1973',
    style:'Modern / bundled-tube skyscraper',
    story:'Built as the Sears Tower, this 110-story landmark became the world’s tallest building when it opened. Its nine bundled square tubes step back at different heights, giving the tower its unmistakable profile while creating an exceptionally efficient structure for its height.',
    fact:'It held the title of world’s tallest building for nearly 25 years, and Chicagoans still commonly call it the Sears Tower.'
  });
}

const outbound=TOUR_ORDERS.south.outbound;
const inbound=TOUR_ORDERS.south.return;
if (!outbound.includes('willis')) outbound.splice(outbound.indexOf('300-wacker'),0,'willis');
if (!inbound.includes('willis')) inbound.splice(inbound.indexOf('150-riverside'),0,'willis');
if (!MAP_REFS.some(x=>x.name==='Adams')) MAP_REFS.push({name:'Adams',lat:41.87925,lng:-87.63755,dx:1.5,dy:.4,anchor:'start'});

// Re-render through the app's existing event handlers after the shared data is patched.
const route=document.getElementById('routeSelect');
if (route) route.dispatchEvent(new Event('change',{bubbles:true}));
const search=document.getElementById('searchInput');
if (search) search.dispatchEvent(new Event('input',{bubbles:true}));
