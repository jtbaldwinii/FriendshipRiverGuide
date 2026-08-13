// Draws the two non-selected river branches as muted geographic context.
export async function enableBranchContext(build){
  const v=encodeURIComponent(String(build||Date.now()));
  const base=await import(`../data/guide-data.js?v=${v}`);
  let landmarks=base.LANDMARKS.map(x=>({...x}));
  try{
    const custom=await import(`../data/custom-landmarks.js?v=${v}`);
    for(const l of landmarks)if(custom.LANDMARK_OVERRIDES?.[l.id])Object.assign(l,custom.LANDMARK_OVERRIDES[l.id]);
    for(const add of custom.LANDMARK_ADDITIONS||[])if(!landmarks.some(x=>x.id===add.id))landmarks.push({...add});
  }catch(e){}

  const orders={
    main:{outbound:['chicago-harbor-lock','st-regis','aqua','wrigley','trump','marina-city','merchandise-mart','wolf-point'],return:['wolf-point','merchandise-mart','marina-city','trump','wrigley','carbide','aqua','st-regis','chicago-harbor-lock']},
    south:{outbound:['wolf-point','150-riverside','civic-opera','300-wacker','willis-tower','river-city','st-charles-bridge'],return:['st-charles-bridge','river-city','cbot','300-wacker','willis-tower','civic-opera','150-riverside','wolf-point']},
    north:{outbound:['wolf-point','erie-park','wild-mile','ballys','salt-shed'],return:['salt-shed','ballys','wild-mile','erie-park','wolf-point']}
  };
  const map=document.getElementById('map');if(!map)return;
  const NS='http://www.w3.org/2000/svg';
  const route=()=>document.getElementById('routeSelect')?.value||'main';
  const dir=()=>document.querySelector('.direction-toggle button.active')?.dataset.dir||'outbound';
  const activePoints=r=>base.RIVER[r];
  const routeItems=(r,d)=>(orders[r]?.[d]||[]).map(id=>landmarks.find(x=>x.id===id)).filter(Boolean);
  function bounds(points,items){
    const lats=points.map(p=>p[0]).concat(items.map(l=>l.lat)),lngs=points.map(p=>p[1]).concat(items.map(l=>l.lng));
    return{minLat:Math.min(...lats)-.0018,maxLat:Math.max(...lats)+.0018,minLng:Math.min(...lngs)-.0025,maxLng:Math.max(...lngs)+.0025};
  }
  function project(lat,lng,b){const x=(lng-b.minLng)/(b.maxLng-b.minLng),y=(b.maxLat-lat)/(b.maxLat-b.minLat);return{x:5+x*90,y:8+y*112}}
  function path(points,b){return points.map((c,i)=>{const p=project(c[0],c[1],b);return `${i?'L':'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`}).join(' ')}
  function visibleStem(selected,other){
    const pts=base.RIVER[other];
    if(other==='main')return pts.slice(-5); // approach Wolf Point from the east
    return pts.slice(0,5); // leave Wolf Point toward north/south
  }
  function apply(){
    const svg=map.querySelector('svg.offline-map');if(!svg)return;
    svg.querySelectorAll('.branch-context').forEach(n=>n.remove());
    const r=route(),d=dir(),b=bounds(activePoints(r),routeItems(r,d));
    for(const other of ['main','south','north'].filter(x=>x!==r)){
      const p=document.createElementNS(NS,'path');p.setAttribute('class','context-river branch-context');p.setAttribute('d',path(visibleStem(r,other),b));p.dataset.branch=other;
      const before=svg.querySelector('.river-line');if(before)svg.insertBefore(p,before);else svg.appendChild(p);
    }
  }
  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.querySelectorAll('.direction-toggle button').forEach(b=>b.addEventListener('click',schedule));
  schedule();
}
