export async function enableSharedPoiOffsets(build) {
  const v = encodeURIComponent(String(build || Date.now()));
  const base = await import(`../data/guide-data.js?v=${v}`);
  let landmarks = base.LANDMARKS.map(x => ({ ...x }));
  const river = base.RIVER;
  const NORTH_WEST=[
    [41.88748,-87.63745],[41.88930,-87.63820],[41.89130,-87.63910],
    [41.89340,-87.64000],[41.89550,-87.64100],[41.89750,-87.64494],
    [41.89940,-87.64870],[41.90170,-87.65220],[41.90410,-87.65570],
    [41.90670,-87.65920],[41.90880,-87.66020],[41.91046,-87.65671]
  ];
  const NORTH_CANAL=[
    [41.89750,-87.64494],[41.89950,-87.64730],[41.90200,-87.64950],
    [41.90435,-87.65041],[41.90758,-87.65263],[41.90920,-87.65480],
    [41.91046,-87.65671]
  ];

  try {
    const custom = await import(`../data/custom-landmarks.js?v=${v}`);
    for (const l of landmarks) if (custom.LANDMARK_OVERRIDES?.[l.id]) Object.assign(l, custom.LANDMARK_OVERRIDES[l.id]);
    for (const add of custom.LANDMARK_ADDITIONS || []) if (!landmarks.some(x => x.id === add.id)) landmarks.push({ ...add });
  } catch (e) {}

  const map = document.getElementById('map');if (!map) return;
  const currentRoute = () => document.getElementById('routeSelect')?.value || 'main';
  const allPoints = () => river.main.concat(river.south.slice(1), river.north.slice(1));
  function bounds(points){const lats=points.map(p=>p[0]),lngs=points.map(p=>p[1]);return{minLat:Math.min(...lats)-.0022,maxLat:Math.max(...lats)+.0022,minLng:Math.min(...lngs)-.0030,maxLng:Math.max(...lngs)+.0030}}
  function project(lat,lng,b){return{x:5+((lng-b.minLng)/(b.maxLng-b.minLng))*90,y:8+((b.maxLat-lat)/(b.maxLat-b.minLat))*112}}
  function nearest(lat,lng,pts,b){const q=project(lat,lng,b);let best=null,bd=Infinity;for(let i=0;i<pts.length-1;i++){const a=project(pts[i][0],pts[i][1],b),c=project(pts[i+1][0],pts[i+1][1],b),vx=c.x-a.x,vy=c.y-a.y,wx=q.x-a.x,wy=q.y-a.y,d=vx*vx+vy*vy,t=d?Math.max(0,Math.min(1,(wx*vx+wy*vy)/d)):0,p={x:a.x+t*vx,y:a.y+t*vy},dist=(q.x-p.x)**2+(q.y-p.y)**2;if(dist<bd){const mag=Math.hypot(vx,vy)||1;bd=dist;best={...p,q,dist:Math.sqrt(dist),tx:vx/mag,ty:vy/mag}}}return best}

  function apply(){
    const svg=map.querySelector('svg.offline-map');if(!svg)return;
    const route=currentRoute(),pts=route==='north'?NORTH_WEST:river[route],b=bounds(allPoints()),placed=[];
    const bridgeBoxes=[...svg.querySelectorAll('.map-bridge text')].map(t=>{try{return t.getBBox()}catch(e){return null}}).filter(Boolean);
    const labelHits=(x,y,r=3.25)=>bridgeBoxes.reduce((n,bb)=>n+((x+r)>=bb.x&&(x-r)<=bb.x+bb.width&&(y+r)>=bb.y&&(y-r)<=bb.y+bb.height?1:0),0);

    function limits(id){
      if(route==='main'&&id==='merchandise-mart')return{min:-4.5,max:-2.8};
      if(route==='main'&&id==='trump')return{min:-4.5,max:-1.5};
      if(route==='main'&&id==='marina-city')return{min:1.5,max:4.5};
      if(route==='south'&&id==='300-wacker')return{min:2,max:5.5};
      if(route==='south'&&id==='willis-tower')return{min:-5.5,max:-2};
      if(route==='south'&&id==='old-post-office')return{min:-1.5,max:1.5};
      if(route==='north'&&['erie-park','montgomery-ward','wild-mile','ballys','salt-shed'].includes(id))return{min:-1.5,max:1.5};
      return{min:-5.5,max:5.5};
    }
    function initial(id){
      if(route==='main'&&id==='merchandise-mart')return-4;
      if(route==='main'&&id==='trump')return-3;
      if(route==='main'&&id==='marina-city')return 3;
      if(route==='south'&&id==='300-wacker')return 3.8;
      if(route==='south'&&id==='willis-tower')return-3.8;
      return 0;
    }
    function update(m){const lim=limits(m.id);m.shift=Math.max(lim.min,Math.min(lim.max,m.shift));m.ox=m.baseOx+m.p.tx*m.shift;m.oy=m.baseOy+m.p.ty*m.shift;m.x=m.p.x+m.ox;m.y=m.p.y+m.oy}

    svg.querySelectorAll('.map-pin').forEach(g=>{
      const l=landmarks.find(x=>x.id===g.dataset.id);if(!l)return;
      const pinPts=route==='north'&&l.id==='wild-mile'?NORTH_CANAL:pts;
      const p=nearest(l.lat,l.lng,pinPts,b);if(!p)return;
      const centerline=/bridge|lock/i.test(l.id)||/bridge|lock/i.test(l.name||'')||l.id==='wolf-point';
      if(centerline){g.removeAttribute('transform');return}
      const dx=p.q.x-p.x,dy=p.q.y-p.y,mag=Math.hypot(dx,dy)||1,offset=Math.max(9,Math.min(12,p.dist));
      const m={id:l.id,g,p,baseOx:dx/mag*offset,baseOy:dy/mag*offset,shift:initial(l.id)};

      // Fixed bank placement for visually important North Branch POIs.
      // On the map, +x is east and -x is west.
      if(route==='north'&&['erie-park','montgomery-ward','wild-mile'].includes(l.id)){m.baseOx=11;m.baseOy=0}
      if(route==='north'&&['ballys','salt-shed'].includes(l.id)){m.baseOx=-11;m.baseOy=0}
      if(route==='south'&&l.id==='old-post-office'){m.baseOx=-11;m.baseOy=0}

      update(m);placed.push(m);
    });

    const minGap=8;
    for(let pass=0;pass<12;pass++){
      let moved=false;
      for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++){
        const a=placed[i],c=placed[j],d=Math.hypot(c.x-a.x,c.y-a.y);if(d>=minGap)continue;
        const n=(minGap-d)/2+.15;a.shift-=n;c.shift+=n;update(a);update(c);moved=true;
      }
      if(!moved)break;
    }

    for(const m of placed){
      if(labelHits(m.x,m.y)){
        const lim=limits(m.id);
        for(const delta of[-3,-2,-1,1,2,3]){const test=Math.max(lim.min,Math.min(lim.max,m.shift+delta)),x=m.p.x+m.baseOx+m.p.tx*test,y=m.p.y+m.baseOy+m.p.ty*test;if(!labelHits(x,y)){m.shift=test;update(m);break}}
      }
      m.g.setAttribute('transform',`translate(${m.ox.toFixed(2)} ${m.oy.toFixed(2)})`);
    }
  }

  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.getElementById('mapRouteSelect')?.addEventListener('change',schedule);
  document.querySelectorAll('.direction-toggle button').forEach(b=>b.addEventListener('click',schedule));
  schedule();
}
