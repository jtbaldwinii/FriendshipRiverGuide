let BUILD='dev';
let LANDMARKS=[],TOUR_ORDERS={},RIVER={},MAP_REFS=[],BRIDGES=[];
let currentRoute='south',direction='outbound',currentIndex=0,userPos=null,watchId=null;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

export async function startApp(build){
  BUILD=String(build||Date.now());
  const base=await import(`../data/guide-data.js?v=${encodeURIComponent(BUILD)}`);
  LANDMARKS=base.LANDMARKS.map(x=>({...x}));
  TOUR_ORDERS=JSON.parse(JSON.stringify(base.TOUR_ORDERS));
  RIVER=base.RIVER;
  MAP_REFS=base.MAP_REFS;

  try{
    const custom=await import(`../data/custom-landmarks.js?v=${encodeURIComponent(BUILD)}`);
    applyCustomData(custom);
  }catch(e){console.warn('Custom landmark layer unavailable',e)}
  try{
    const b=await import(`../data/bridges.js?v=${encodeURIComponent(BUILD)}`);
    BRIDGES=b.BRIDGES||[];
  }catch(e){console.warn('Bridge layer unavailable',e)}

  bindUI();
  renderList();
  renderCruise();
}

function applyCustomData({LANDMARK_OVERRIDES={},LANDMARK_ADDITIONS=[],ROUTE_INSERTS=[]}){
  for(const l of LANDMARKS)if(LANDMARK_OVERRIDES[l.id])Object.assign(l,LANDMARK_OVERRIDES[l.id]);
  for(const add of LANDMARK_ADDITIONS||[]){if(!LANDMARKS.some(x=>x.id===add.id))LANDMARKS.push({...add})}
  for(const e of ROUTE_INSERTS||[]){
    const arr=TOUR_ORDERS?.[e.route]?.[e.direction];if(!arr||arr.includes(e.id))continue;
    let i=e.after?arr.indexOf(e.after)+1:e.before?arr.indexOf(e.before):arr.length;
    if(i<0)i=arr.length;arr.splice(i,0,e.id);
  }
}

const routeItems=()=>TOUR_ORDERS[currentRoute][direction].map(id=>LANDMARKS.find(x=>x.id===id)).filter(Boolean);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
function photoUrl(l){if(!l.photo)return '';return l.photo.startsWith('assets/')?`${l.photo}?v=${encodeURIComponent(BUILD)}`:l.photo}
function photoStyle(l){const u=photoUrl(l);return u?`background-image:url("${u}")`:''}
function distanceMeters(a,b){const R=6371e3,p1=a.lat*Math.PI/180,p2=b.lat*Math.PI/180,dp=(b.lat-a.lat)*Math.PI/180,dl=(b.lng-a.lng)*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))}
function fmtDist(m){if(m==null)return '';const ft=m*3.28084;return ft<1000?`${Math.max(25,Math.round(ft/25)*25)} ft`:`${(ft/5280).toFixed(1)} mi`}
function thingsFor(l){const s=(l.story||'').split(/(?<=[.!?])\s+/).filter(Boolean),out=[`Designed by ${l.architect}.`,`Completed in ${l.year}; ${l.style} architecture.`];for(const x of s){if(out.length>=5)break;if(!out.includes(x))out.push(x)}return out.slice(0,5)}

function renderCruise(){
  const items=routeItems();if(!items.length)return;
  if(currentIndex>=items.length)currentIndex=0;if(currentIndex<0)currentIndex=items.length-1;
  const l=items[currentIndex],dist=userPos?distanceMeters(userPos,l):null;
  $('#heroCard').innerHTML=`<div class="hero-image" style='${photoStyle(l)}'><span class="hero-badge">${userPos&&dist<180?'NOW VIEWING':'LANDMARK '+(currentIndex+1)+' / '+items.length}</span>${dist!=null?`<span class="hero-distance">${fmtDist(dist)}</span>`:''}<div class="hero-title-wrap"><span class="eyebrow">${direction.toUpperCase()} • ${esc(l.side).toUpperCase()}</span><h1>${esc(l.name)}</h1><p>${esc(l.subtitle)}</p></div></div><div class="hero-body">${l.credit?`<div class="photo-credit">Photo: ${esc(l.credit)}</div>`:''}<p>${esc(l.story)}</p><div class="fact-row"><span class="fact-chip">${esc(l.architect)}</span><span class="fact-chip">${esc(l.year)}</span><span class="fact-chip">${esc(l.style)}</span></div><button class="more-btn" id="heroMoreBtn">Things to know + fun fact <span>›</span></button></div>`;
  $('#heroMoreBtn').onclick=()=>openDetail(l.id);
  const n=items[(currentIndex+1)%items.length];$('#nextName').textContent=n.name;$('#nextMeta').textContent=`${n.side}${userPos?' • '+fmtDist(distanceMeters(userPos,n)):''}`;
  renderMap();
}

function renderList(filter=''){
  const q=filter.toLowerCase();
  $('#landmarkList').innerHTML=LANDMARKS.filter(l=>!q||[l.name,l.story,l.architect].some(v=>(v||'').toLowerCase().includes(q))).map(l=>`<div class="landmark-item" data-id="${l.id}"><div class="landmark-thumb" style='${photoStyle(l)}'></div><div><h3>${esc(l.name)}</h3><p>${esc(l.style)} • ${esc(l.year)}</p></div><button aria-label="Open ${esc(l.name)}">›</button></div>`).join('');
  $$('.landmark-item').forEach(el=>el.onclick=()=>openDetail(el.dataset.id));
}

function openDetail(id){
  const l=LANDMARKS.find(x=>x.id===id);if(!l)return;const things=thingsFor(l);
  $('#modalContent').innerHTML=`<div class="modal-photo" style='${photoStyle(l)}'></div><div class="modal-copy">${l.credit?`<div class="photo-credit">Photo: ${esc(l.credit)}</div>`:''}<span class="eyebrow">${esc(l.side).toUpperCase()}</span><h2>${esc(l.name)}</h2><p class="subtitle">${esc(l.subtitle)}</p><div class="things-box"><h3>Things to know</h3><ul>${things.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="fun-box"><h3>★ Fun fact</h3><p>${esc(l.fact)}</p></div><div class="detail-grid"><div><strong>Architect</strong><span>${esc(l.architect)}</span></div><div><strong>Completed</strong><span>${esc(l.year)}</span></div><div><strong>Style</strong><span>${esc(l.style)}</span></div><div><strong>GPS</strong><span>${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}</span></div></div></div>`;
  $('#detailModal').classList.add('open');$('#detailModal').setAttribute('aria-hidden','false');
}
function closeDetail(){$('#detailModal').classList.remove('open');$('#detailModal').setAttribute('aria-hidden','true')}

function activeRiverPoints(){return RIVER.main.concat((currentRoute==='north'?RIVER.north:RIVER.south).slice(1))}
function mapBoundsFor(points,landmarks){const lats=points.map(p=>p[0]).concat(landmarks.map(l=>l.lat)),lngs=points.map(p=>p[1]).concat(landmarks.map(l=>l.lng));return{minLat:Math.min(...lats)-.0018,maxLat:Math.max(...lats)+.0018,minLng:Math.min(...lngs)-.0025,maxLng:Math.max(...lngs)+.0025}}
let MAP_BOUNDS=null;
function project(lat,lng){const b=MAP_BOUNDS,x=(lng-b.minLng)/(b.maxLng-b.minLng),y=(b.maxLat-lat)/(b.maxLat-b.minLat);return{x:5+x*90,y:8+y*112}}
function geoPath(points){return points.map((c,i)=>{const p=project(c[0],c[1]);return `${i?'L':'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`}).join(' ')}
function nearestProjection(lat,lng,pts){const q=project(lat,lng);let best=null,bd=Infinity;for(let i=0;i<pts.length-1;i++){const a=project(pts[i][0],pts[i][1]),b=project(pts[i+1][0],pts[i+1][1]),vx=b.x-a.x,vy=b.y-a.y,wx=q.x-a.x,wy=q.y-a.y,d=vx*vx+vy*vy,t=d?Math.max(0,Math.min(1,(wx*vx+wy*vy)/d)):0,p={x:a.x+t*vx,y:a.y+t*vy},dd=(q.x-p.x)**2+(q.y-p.y)**2;if(dd<bd){const mag=Math.hypot(vx,vy)||1;bd=dd;best={...p,tx:vx/mag,ty:vy/mag}}}return best}
function inBounds(r){const b=MAP_BOUNDS;return r.lat>=b.minLat&&r.lat<=b.maxLat&&r.lng>=b.minLng&&r.lng<=b.maxLng}
function bridgeSvg(activeRiver){
  return BRIDGES.filter(b=>b.branch==='main'||b.branch===currentRoute).map(b=>{
    const p=nearestProjection(b.lat,b.lng,activeRiver);if(!p)return '';
    const nx=-p.ty,ny=p.tx,half=3.6,x1=p.x-nx*half,y1=p.y-ny*half,x2=p.x+nx*half,y2=p.y+ny*half,s=b.labelSide||1,lx=p.x+nx*5.0*s,ly=p.y+ny*5.0*s;
    const anchor=nx*s>.18?'start':nx*s<-.18?'end':'middle';
    return `<g class="map-bridge"><line class="bridge-shadow" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line><line class="bridge-deck" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line><text x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(b.name)}</text></g>`;
  }).join('')
}

function renderMap(){
  const target=$('#map');if(!target)return;const ordered=routeItems(),activeRiver=activeRiverPoints();MAP_BOUNDS=mapBoundsFor(activeRiver,ordered);
  const context=currentRoute==='north'?RIVER.south:RIVER.north;
  const river=`<path class="river-line" d="${geoPath(activeRiver)}"></path><path class="river-core" d="${geoPath(activeRiver)}"></path>`;
  const contextRiver=`<path class="context-river" d="${geoPath(context)}"></path>`;
  const bridges=bridgeSvg(activeRiver);
  const route=`<path class="route-line" d="${geoPath(activeRiver)}"></path>`;
  const pins=ordered.map((l,i)=>{const p=nearestProjection(l.lat,l.lng,activeRiver);return `<g class="map-pin" data-id="${l.id}"><circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2.65"></circle><text class="pin-num" x="${p.x.toFixed(2)}" y="${(p.y+.05).toFixed(2)}">${i+1}</text></g>`}).join('');
  let up='';if(userPos&&inBounds(userPos)){const p=project(userPos.lat,userPos.lng),ar=Math.min(8,Math.max(2,(userPos.accuracy||30)/65));up=`<circle class="user-accuracy" cx="${p.x}" cy="${p.y}" r="${ar}"></circle><circle class="user-dot" cx="${p.x}" cy="${p.y}" r="2.6"></circle>`}
  const refs=MAP_REFS.filter(inBounds).filter(r=>!/Michigan|State St|Lake St|Jackson|Roosevelt|Chicago Ave|North Ave|16th St/.test(r.name)).map(r=>{const p=project(r.lat,r.lng);return `<g class="map-ref"><circle cx="${p.x}" cy="${p.y}" r=".55"></circle><text text-anchor="${r.anchor}" x="${p.x+r.dx}" y="${p.y+r.dy}">${esc(r.name)}</text></g>`}).join('');
  const lake=project(41.8884,-87.6107),legend=ordered.map((l,i)=>`<div class="map-key ${i===currentIndex?'active':''}" data-id="${l.id}"><b>${i+1}</b><span>${esc(l.name)}</span></div>`).join('');
  target.innerHTML=`<svg class="offline-map" viewBox="0 0 100 128" preserveAspectRatio="xMidYMid meet"><text class="map-bg-label" x="94" y="7" text-anchor="end">N ↑</text><text class="water-label" x="${lake.x-1}" y="${lake.y-3}" text-anchor="end">Lake Michigan</text>${contextRiver}${river}${bridges}${route}${refs}${pins}${up}</svg><div class="map-legend">${legend}</div>`;
  target.querySelectorAll('.map-pin,.map-key').forEach(el=>el.onclick=()=>openDetail(el.dataset.id));
  const active=ordered[currentIndex];$('#mapSheetTitle').textContent=currentRoute==='north'?'Main + North Branch':'Main + South Branch';if(active)$('#mapSheetText').textContent=`${direction[0].toUpperCase()+direction.slice(1)} • Stop ${currentIndex+1}: ${active.name}${userPos?' • '+fmtDist(distanceMeters(userPos,active)):''} • Bridge decks are drawn across the river.`;
}

function nearestForRoute(){if(!userPos)return;const items=routeItems();let best=0,bestD=Infinity;items.forEach((l,i)=>{const d=distanceMeters(userPos,l);if(d<bestD){bestD=d;best=i}});if(bestD<350){currentIndex=best;renderCruise()}$('#gpsStatus').classList.add('live');$('#gpsStatus').innerHTML=`<div><span class="eyebrow">GPS LIVE</span><strong>${fmtDist(bestD)} from ${esc(items[best].name)}</strong></div><p>Reported accuracy: ${userPos.accuracy?Math.round(userPos.accuracy*3.28084)+' ft':'—'}. Nearby landmarks auto-surface within about 1,150 ft.</p>`;renderMap()}
function startGPS(){if(!navigator.geolocation){$('#gpsStatus').innerHTML='<strong>GPS unavailable</strong><p>This browser does not expose geolocation.</p>';return}$('#gpsLabel').textContent='Locating…';watchId=navigator.geolocation.watchPosition(pos=>{userPos={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};$('#gpsBtn').classList.add('live');$('#gpsLabel').textContent='GPS Live';nearestForRoute()},err=>{$('#gpsLabel').textContent='Start GPS';$('#gpsStatus').innerHTML=`<strong>GPS unavailable</strong><p>${esc(err.message)}. Manual Cruise Mode is still available.</p>`},{enableHighAccuracy:true,maximumAge:3000,timeout:12000})}

function bindUI(){
  $('#gpsBtn').onclick=startGPS;$('#nextBtn').onclick=()=>{currentIndex++;renderCruise()};$('#prevBtn').onclick=()=>{currentIndex--;renderCruise()};
  $('#routeSelect').onchange=e=>{currentRoute=e.target.value;currentIndex=0;renderCruise()};
  $$('.direction-toggle button').forEach(b=>b.onclick=()=>{$$('.direction-toggle button').forEach(x=>x.classList.remove('active'));b.classList.add('active');direction=b.dataset.dir;currentIndex=0;renderCruise()});
  $$('.bottom-nav button').forEach(b=>b.onclick=()=>{$$('.bottom-nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(v=>v.classList.remove('active'));$('#'+b.dataset.view).classList.add('active');if(b.dataset.view==='mapView')renderMap()});
  $('#homeBtn').onclick=()=>{$('.bottom-nav button[data-view="cruiseView"]').click()};$('#searchInput').oninput=e=>renderList(e.target.value);$('#closeModal').onclick=closeDetail;$('.modal-backdrop').onclick=closeDetail;
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail();if(e.key==='ArrowRight')$('#nextBtn').click();if(e.key==='ArrowLeft')$('#prevBtn').click()});
}
