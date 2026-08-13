// Corrects the North Branch schematic around Goose Island.
// The North Branch runs along the west side of Goose Island; the North Branch
// Canal runs along its east side. Both are shown when North Branch is active.
export async function enableGooseIslandOverlay(build){
  const v=encodeURIComponent(String(build||Date.now()));
  const base=await import(`../data/guide-data.js?v=${v}`);
  const map=document.getElementById('map');if(!map)return;
  const NS='http://www.w3.org/2000/svg';

  // Shared stem from Wolf Point, then the west/main channel around Goose Island.
  const WEST=[
    [41.88748,-87.63745],[41.88930,-87.63820],[41.89130,-87.63910],
    [41.89340,-87.64000],[41.89550,-87.64100],[41.89750,-87.64494],
    [41.89940,-87.64870],[41.90170,-87.65220],[41.90410,-87.65570],
    [41.90670,-87.65920],[41.90880,-87.66020],[41.91046,-87.65671]
  ];
  // East channel / North Branch Canal around Goose Island.
  const CANAL=[
    [41.89750,-87.64494],[41.89950,-87.64730],[41.90200,-87.64950],
    [41.90435,-87.65041],[41.90758,-87.65263],[41.90920,-87.65480],
    [41.91046,-87.65671]
  ];

  function allPoints(){return base.RIVER.main.concat(base.RIVER.south.slice(1),base.RIVER.north.slice(1))}
  function bounds(points){const lats=points.map(p=>p[0]),lngs=points.map(p=>p[1]);return{minLat:Math.min(...lats)-.0022,maxLat:Math.max(...lats)+.0022,minLng:Math.min(...lngs)-.0030,maxLng:Math.max(...lngs)+.0030}}
  const B=bounds(allPoints());
  function project(lat,lng){return{x:5+((lng-B.minLng)/(B.maxLng-B.minLng))*90,y:8+((B.maxLat-lat)/(B.maxLat-B.minLat))*112}}
  function path(points){return points.map((c,i)=>{const p=project(c[0],c[1]);return`${i?'L':'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`}).join(' ')}
  function nearest(lat,lng,pts){const q=project(lat,lng);let best=null,bd=Infinity;for(let i=0;i<pts.length-1;i++){const a=project(pts[i][0],pts[i][1]),c=project(pts[i+1][0],pts[i+1][1]),vx=c.x-a.x,vy=c.y-a.y,wx=q.x-a.x,wy=q.y-a.y,d=vx*vx+vy*vy,t=d?Math.max(0,Math.min(1,(wx*vx+wy*vy)/d)):0,p={x:a.x+t*vx,y:a.y+t*vy},dd=(q.x-p.x)**2+(q.y-p.y)**2;if(dd<bd){bd=dd;best=p}}return best}
  function addPath(svg,cls,d,before){const p=document.createElementNS(NS,'path');p.setAttribute('class',cls);p.setAttribute('d',d);if(before)svg.insertBefore(p,before);else svg.appendChild(p);return p}

  function apply(){
    const svg=map.querySelector('svg.offline-map');if(!svg)return;
    svg.querySelectorAll('.goose-overlay').forEach(n=>n.remove());
    const selected=(document.getElementById('routeSelect')?.value||'main')==='north';
    const westD=path(WEST),canalD=path(CANAL);

    if(selected){
      const outer=svg.querySelector('.river-line'),inner=svg.querySelector('.river-core'),route=svg.querySelector('.route-line');
      if(outer)outer.setAttribute('d',westD);if(inner)inner.setAttribute('d',westD);if(route)route.setAttribute('d',westD);
      const before=svg.querySelector('.map-bridge')||svg.querySelector('.route-line');
      addPath(svg,'river-line goose-overlay',canalD,before);
      addPath(svg,'river-core goose-overlay',canalD,before);

      // Re-anchor POI base centers to the corrected waterway before bank offsets run.
      svg.querySelectorAll('.map-pin').forEach(g=>{
        const id=g.dataset.id;let l=null;
        // Coordinates after custom overrides for known North Branch POIs.
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
        g.querySelector('circle')?.setAttribute('cx',p.x.toFixed(2));g.querySelector('circle')?.setAttribute('cy',p.y.toFixed(2));
        const t=g.querySelector('.pin-num');if(t){t.setAttribute('x',p.x.toFixed(2));t.setAttribute('y',(p.y+.05).toFixed(2))}
      });
    }else{
      const n=svg.querySelector('.context-river[data-branch="north"]');if(n)n.setAttribute('d',westD);
      const before=svg.querySelector('.river-line');addPath(svg,'context-river goose-overlay',canalD,before);
    }

    // Goose Island label between the two channels.
    const gp=project(41.9042,-87.6530),label=document.createElementNS(NS,'text');
    label.setAttribute('class',`goose-label goose-overlay${selected?' active':''}`);label.setAttribute('x',gp.x);label.setAttribute('y',gp.y);label.setAttribute('text-anchor','middle');label.textContent='GOOSE ISLAND';svg.appendChild(label);
  }

  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.getElementById('mapRouteSelect')?.addEventListener('change',schedule);
  schedule();
}
