export async function enablePoiBankOffsets(build){
  const v=encodeURIComponent(String(build||Date.now()));
  const base=await import(`../data/guide-data.js?v=${v}`);
  let landmarks=base.LANDMARKS.map(x=>({...x}));
  const orders=JSON.parse(JSON.stringify(base.TOUR_ORDERS));
  const river=base.RIVER;

  try{
    const custom=await import(`../data/custom-landmarks.js?v=${v}`);
    const overrides=custom.LANDMARK_OVERRIDES||{};
    for(const l of landmarks) if(overrides[l.id]) Object.assign(l,overrides[l.id]);
    for(const add of custom.LANDMARK_ADDITIONS||[]) if(!landmarks.some(x=>x.id===add.id)) landmarks.push({...add});
    for(const e of custom.ROUTE_INSERTS||[]){
      const arr=orders?.[e.route]?.[e.direction];
      if(!arr||arr.includes(e.id)) continue;
      let i=e.after?arr.indexOf(e.after)+1:e.before?arr.indexOf(e.before):arr.length;
      if(i<0)i=arr.length;
      arr.splice(i,0,e.id);
    }
  }catch(e){console.warn('POI bank-offset custom data unavailable',e)}

  const map=document.getElementById('map');
  if(!map) return;

  function currentRoute(){return document.getElementById('routeSelect')?.value||'south'}
  function currentDirection(){return document.querySelector('.direction-toggle button.active')?.dataset.dir||'outbound'}
  function activeRiver(route){return river.main.concat((route==='north'?river.north:river.south).slice(1))}
  function routeLandmarks(route,dir){return (orders?.[route]?.[dir]||[]).map(id=>landmarks.find(x=>x.id===id)).filter(Boolean)}
  function bounds(points,items){
    const lats=points.map(p=>p[0]).concat(items.map(l=>l.lat));
    const lngs=points.map(p=>p[1]).concat(items.map(l=>l.lng));
    return {minLat:Math.min(...lats)-.0018,maxLat:Math.max(...lats)+.0018,minLng:Math.min(...lngs)-.0025,maxLng:Math.max(...lngs)+.0025};
  }
  function project(lat,lng,b){
    const x=(lng-b.minLng)/(b.maxLng-b.minLng),y=(b.maxLat-lat)/(b.maxLat-b.minLat);
    return {x:5+x*90,y:8+y*112};
  }
  function nearest(lat,lng,pts,b){
    const q=project(lat,lng,b);let best=null,bd=Infinity;
    for(let i=0;i<pts.length-1;i++){
      const a=project(pts[i][0],pts[i][1],b),c=project(pts[i+1][0],pts[i+1][1],b);
      const vx=c.x-a.x,vy=c.y-a.y,wx=q.x-a.x,wy=q.y-a.y,d=vx*vx+vy*vy;
      const t=d?Math.max(0,Math.min(1,(wx*vx+wy*vy)/d)):0;
      const p={x:a.x+t*vx,y:a.y+t*vy};
      const dd=(q.x-p.x)**2+(q.y-p.y)**2;
      if(dd<bd){bd=dd;best={...p,q,dist:Math.sqrt(dd)}}
    }
    return best;
  }

  function apply(){
    const svg=map.querySelector('svg.offline-map');
    if(!svg) return;
    const route=currentRoute(),dir=currentDirection(),items=routeLandmarks(route,dir),pts=activeRiver(route),b=bounds(pts,items);
    svg.querySelectorAll('.map-pin').forEach(g=>{
      const l=landmarks.find(x=>x.id===g.dataset.id);if(!l)return;
      const p=nearest(l.lat,l.lng,pts,b);if(!p)return;
      // Bridge POIs belong on the water. All other POIs sit completely beyond the river's blue corridor.
      if(/bridge/i.test(l.id)||/bridge/i.test(l.name||'')){g.removeAttribute('transform');return;}
      const dx=p.q.x-p.x,dy=p.q.y-p.y,mag=Math.hypot(dx,dy)||1;
      // River outer stroke is 10 SVG units wide (5 each side), and POI circles are ~2.65 units radius.
      // A minimum centerline offset of 9.0 puts the entire marker beyond the bank with a small visual gap.
      const offset=Math.max(9.0,Math.min(12.0,p.dist));
      g.setAttribute('transform',`translate(${(dx/mag*offset).toFixed(2)} ${(dy/mag*offset).toFixed(2)})`);
    });
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.querySelectorAll('.direction-toggle button').forEach(b=>b.addEventListener('click',schedule));
  schedule();
}
