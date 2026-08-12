import {LANDMARKS} from '../data/guide-data.js?v=3';

const stRegis = LANDMARKS.find(x => x.id === 'st-regis');
if (stRegis) stRegis.photo = 'assets/st-regis-2026.jpg';

const willis = LANDMARKS.find(x => x.id === 'willis-tower');
if (willis) willis.photo = 'assets/willis-tower-2026(1).jpg';

// Force the existing app to re-render after swapping image assets.
const route = document.getElementById('routeSelect');
if (route) route.dispatchEvent(new Event('change', { bubbles: true }));
const search = document.getElementById('searchInput');
if (search) search.dispatchEvent(new Event('input', { bubbles: true }));
