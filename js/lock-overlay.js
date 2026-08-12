export async function enableLockOverlay(build){
  const v=encodeURIComponent(String(build||Date.now()));
  const base=await import(`../data/guide-data.js?v=${v}`);
  let landmarks=base.LANDMARKS.map(x=>({...x}));
  const orders=JSON.parse(JSON.stringify(base.TOUR_ORDERS));
  const river=base.RIVER;

  try{
    const custom=await import(`../data/custom-landmarks.js?v=${v}`);
    const overrides=custom.LANDMARK_OVERRIDES||{};
    for(const l of landmarks)if(overrides[l.id])Object.assign(l,overrides[l.id]);
    for(const add of custom.LANDMARK_ADDITIONS||[])if(!landmarks.some(x=>x.id===add.id))landmarks.push({...add});
    for(const e of custom.ROUTE_INSERTS||[]){
      const arr=orders?.[e.route]?.[e.direction];if(!arr||arr.includes(e.id))continue;
      let i=e.after?arr.indexOf(e.after)+1:e.before?arr.indexOf(e.before):arr.length;
      if(i<0)i=arr.length;arr.splice(i,0,e.id);
    }
  }catch(e){console.warn('Lock overlay custom data unavailable',e)}

  const map=document.getElementById('map');
  if(!map)return;
  const NS='http://www.w3.org/2000/svg';
  const route=()=>document.getElementById('routeSelect')?.value||'south';
  const dir=()=>document.querySelector('.direction-toggle button.active')?.dataset.dir||'outbound';
  const activeRiver=r=>river.main.concat((r==='north'?river.north:river.south).slice(1));
  const routeItems=(r,d)=>(orders?.[r]?.[d]||[]).map(id=>landmarks.find(x=>x.id===id)).filter(Boolean);
  function bounds(points,items){
    const lats=points.map(p=>p[0]).concat(items.map(l=>l.lat)),lngs=points.map(p=>p[1]).concat(items.map(l=>l.lng));
    return{minLat:Math.min(...lats)-.0018,maxLat:Math.max(...lats)+.0018,minLng:Math.min(...lngs)-.0025,maxLng:Math.max(...lngs)+.0025};
  }
  function project(lat,lng,b){
    const x=(lng-b.minLng)/(b.maxLng-b.minLng),y=(b.maxLat-lat)/(b.maxLat-b.minLat);
    return{x:5+x*90,y:8+y*112};
  }
  function line(x1,y1,x2,y2,cls){const e=document.createElementNS(NS,'line');for(const [k,val] of Object.entries({x1,y1,x2,y2}))e.setAttribute(k,val);e.setAttribute('class',cls);return e}

  function apply(){
    const svg=map.querySelector('svg.offline-map');if(!svg||svg.querySelector('.map-lock'))return;
    svg.querySelectorAll('.map-ref').forEach(g=>{if(/Chicago Lock/i.test(g.textContent||''))g.remove()});

    const r=route(),d=dir(),pts=activeRiver(r),items=routeItems(r,d),b=bounds(pts,items);
    const west=project(41.88831,-87.61345,b),east=project(41.88831,-87.61060,b);
    const left=Math.min(west.x,east.x),right=Math.max(west.x,east.x)+1.0,cy=(west.y+east.y)/2,h=7.0;

    // Lake Michigan: a full-height field east of the lock makes the shoreline transition obvious.
    const lake=document.createElementNS(NS,'g');lake.setAttribute('class','map-lake');
    const lakeRect=document.createElementNS(NS,'rect');
    lakeRect.setAttribute('x',right-.2);lakeRect.setAttribute('y','0');
    lakeRect.setAttribute('width',Math.max(0,100-right+.2));lakeRect.setAttribute('height','128');
    lakeRect.setAttribute('class','lake-water');lake.appendChild(lakeRect);
    const lakeLabel=document.createElementNS(NS,'text');
    const lx=Math.min(96,right+Math.max(5,(100-right)/2));
    lakeLabel.setAttribute('x',lx);lakeLabel.setAttribute('y',cy-5.2);lakeLabel.setAttribute('text-anchor','middle');lakeLabel.setAttribute('class','lake-label');
    const t1=document.createElementNS(NS,'tspan');t1.setAttribute('x',lx);t1.textContent='LAKE';lakeLabel.appendChild(t1);
    const t2=document.createElementNS(NS,'tspan');t2.setAttribute('x',lx);t2.setAttribute('dy','3.1');t2.textContent='MICHIGAN';lakeLabel.appendChild(t2);
    lake.appendChild(lakeLabel);
    const first=svg.firstChild;if(first)svg.insertBefore(lake,first);else svg.appendChild(lake);

    const g=document.createElementNS(NS,'g');g.setAttribute('class','map-lock');
    const rect=document.createElementNS(NS,'rect');rect.setAttribute('x',left);rect.setAttribute('y',cy-h/2);rect.setAttribute('width',right-left);rect.setAttribute('height',h);rect.setAttribute('rx','.45');rect.setAttribute('class','lock-chamber');g.appendChild(rect);
    const westGate=project(41.88831,-87.61325,b),eastGate=project(41.88831,-87.61082,b);
    g.appendChild(line(westGate.x,cy-h/2+.25,westGate.x,cy+h/2-.25,'lock-gate'));
    g.appendChild(line(eastGate.x,cy-h/2+.25,eastGate.x,cy+h/2-.25,'lock-gate'));
    const label=document.createElementNS(NS,'text');label.setAttribute('x',(left+right)/2);label.setAttribute('y',cy+.7);label.setAttribute('text-anchor','middle');label.setAttribute('class','lock-label');label.textContent='LOCK';g.appendChild(label);
    const before=svg.querySelector('.route-line')||svg.querySelector('.map-bridge');
    if(before)svg.insertBefore(g,before);else svg.appendChild(g);
  }

  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.querySelectorAll('.direction-toggle button').forEach(b=>b.addEventListener('click',schedule));
  schedule();
}
