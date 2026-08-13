// Draws Goose Island as a real island between the North Branch (west) and
// North Branch Canal (east), and re-anchors North Branch bridges to the
// corrected river geometry before label callouts are applied.
export async function enableGooseIslandOverlay(build){
  const v=encodeURIComponent(String(build||Date.now()));
  const base=await import(`../data/guide-data.js?v=${v}`);
  const bridgeData=await import(`../data/bridges.js?v=${v}`);
  const map=document.getElementById('map');if(!map)return;
  const NS='http://www.w3.org/2000/svg';

  // Shared channel from Wolf Point to the south tip of Goose Island.
  const STEM=[
    [41.88748,-87.63745],[41.88935,-87.63815],[41.89145,-87.63905],
    [41.89355,-87.64005],[41.89555,-87.64135],[41.89715,-87.64455]
  ];

  // Main North Branch: west side of Goose Island.
  const WEST_CHANNEL=[
    [41.89715,-87.64455],[41.89935,-87.64820],[41.90165,-87.65215],
    [41.90410,-87.65605],[41.90655,-87.65905],[41.90865,-87.65965],
    [41.91046,-87.65671]
  ];

  // North Branch Canal: east side of Goose Island. Deliberately straighter
  // than the west channel so the island reads clearly at schematic scale.
  const CANAL=[
    [41.89715,-87.64455],[41.89935,-87.64535],[41.90175,-87.64705],
    [41.90415,-87.64935],[41.90655,-87.65175],[41.90865,-87.65420],
    [41.91046,-87.65671]
  ];

  const WEST=STEM.concat(WEST_CHANNEL.slice(1));
  const northBridges=(bridgeData.BRIDGES||[]).filter(b=>b.branch==='north');

  function allPoints(){return base.RIVER.main.concat(base.RIVER.south.slice(1),base.RIVER.north.slice(1))}
  function bounds(points){const lats=points.map(p=>p[0]),lngs=points.map(p=>p[1]);return{minLat:Math.min(...lats)-.0022,maxLat:Math.max(...lats)+.0022,minLng:Math.min(...lngs)-.0030,maxLng:Math.max(...lngs)+.0030}}
  const B=bounds(allPoints());
  function project(lat,lng){return{x:5+((lng-B.minLng)/(B.maxLng-B.minLng))*90,y:8+((B.maxLat-lat)/(B.maxLat-B.minLat))*112}}
  function path(points,close=false){const d=points.map((c,i)=>{const p=project(c[0],c[1]);return`${i?'L':'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`}).join(' ');return close?d+' Z':d}
  function nearest(lat,lng,pts){
    const q=project(lat,lng);let best=null,bd=Infinity;
    for(let i=0;i<pts.length-1;i++){
      const a=project(pts[i][0],pts[i][1]),c=project(pts[i+1][0],pts[i+1][1]);
      const vx=c.x-a.x,vy=c.y-a.y,wx=q.x-a.x,wy=q.y-a.y,d=vx*vx+vy*vy;
      const t=d?Math.max(0,Math.min(1,(wx*vx+wy*vy)/d)):0;
      const p={x:a.x+t*vx,y:a.y+t*vy};
      const dd=(q.x-p.x)**2+(q.y-p.y)**2;
      if(dd<bd){const mag=Math.hypot(vx,vy)||1;bd=dd;best={...p,tx:vx/mag,ty:vy/mag}}
    }
    return best;
  }
  function addPath(svg,cls,d,before){const p=document.createElementNS(NS,'path');p.setAttribute('class',cls);p.setAttribute('d',d);if(before)svg.insertBefore(p,before);else svg.appendChild(p);return p}

  function reanchorNorthBridges(svg){
    const groups=[...svg.querySelectorAll('.map-bridge')];
    groups.forEach((g,i)=>{
      const b=northBridges[i];if(!b)return;
      // All guide bridges on this route cross the navigated/main North Branch;
      // Chicago Ave is near the split but still resolves cleanly on WEST.
      const p=nearest(b.lat,b.lng,WEST);if(!p)return;
      const nx=-p.ty,ny=p.tx,half=3.6;
      const x1=p.x-nx*half,y1=p.y-ny*half,x2=p.x+nx*half,y2=p.y+ny*half;
      const shadow=g.querySelector('.bridge-shadow'),deck=g.querySelector('.bridge-deck'),text=g.querySelector('text');
      [shadow,deck].forEach(line=>{if(!line)return;line.setAttribute('x1',x1.toFixed(2));line.setAttribute('y1',y1.toFixed(2));line.setAttribute('x2',x2.toFixed(2));line.setAttribute('y2',y2.toFixed(2))});
      if(text){const s=b.labelSide||1;text.setAttribute('x',(p.x+nx*5*s).toFixed(2));text.setAttribute('y',(p.y+ny*5*s).toFixed(2));text.setAttribute('text-anchor','middle')}
    });
  }

  function apply(){
    const svg=map.querySelector('svg.offline-map');if(!svg)return;
    const selected=(document.getElementById('routeSelect')?.value||'main')==='north';
    const signature=selected?'north-active-v2':'north-context-v2';
    if(svg.dataset.gooseOverlay===signature)return;
    svg.dataset.gooseOverlay=signature;
    svg.querySelectorAll('.goose-overlay').forEach(n=>n.remove());

    const westD=path(WEST),canalD=path(CANAL);
    const islandPoints=WEST_CHANNEL.concat([...CANAL].reverse().slice(1,-1));
    const islandD=path(islandPoints,true);
    const firstRiver=svg.querySelector('.river-line,.context-river');
    addPath(svg,`goose-island-land goose-overlay${selected?' active':''}`,islandD,firstRiver);

    if(selected){
      const outer=svg.querySelector('.river-line'),inner=svg.querySelector('.river-core'),route=svg.querySelector('.route-line');
      if(outer)outer.setAttribute('d',westD);if(inner)inner.setAttribute('d',westD);if(route)route.setAttribute('d',westD);
      const before=svg.querySelector('.map-bridge')||svg.querySelector('.route-line');
      addPath(svg,'river-line goose-overlay',canalD,before);
      addPath(svg,'river-core goose-overlay',canalD,before);

      reanchorNorthBridges(svg);

      // Re-anchor POI base centers to the appropriate channel before bank offsets.
      svg.querySelectorAll('.map-pin').forEach(g=>{
        const id=g.dataset.id;
        const coords={
          'wolf-point':[41.88770,-87.63730],
          'erie-park':[41.8940,-87.6418],
          'montgomery-ward':[41.89677,-87.64349],
          'wild-mile':[41.90758,-87.65263],
          'ballys':[41.89626,-87.64753],
          'salt-shed':[41.90671,-87.65924]
        }[id];
        if(!coords)return;
        const p=nearest(coords[0],coords[1],id==='wild-mile'?CANAL:WEST);if(!p)return;
        const c=g.querySelector('circle');if(c){c.setAttribute('cx',p.x.toFixed(2));c.setAttribute('cy',p.y.toFixed(2))}
        const t=g.querySelector('.pin-num');if(t){t.setAttribute('x',p.x.toFixed(2));t.setAttribute('y',(p.y+.05).toFixed(2))}
      });
    }else{
      const n=svg.querySelector('.context-river[data-branch="north"]');if(n)n.setAttribute('d',westD);
      const before=svg.querySelector('.river-line');addPath(svg,'context-river goose-overlay',canalD,before);
    }

    const gp=project(41.90425,-87.65275),label=document.createElementNS(NS,'text');
    label.setAttribute('class',`goose-label goose-overlay${selected?' active':''}`);label.setAttribute('x',gp.x);label.setAttribute('y',gp.y);label.setAttribute('text-anchor','middle');label.textContent='GOOSE ISLAND';svg.appendChild(label);
  }

  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.getElementById('mapRouteSelect')?.addEventListener('change',schedule);
  schedule();
}
