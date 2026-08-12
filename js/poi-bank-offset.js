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
      if(dd<bd){
        const mag=Math.hypot(vx,vy)||1;
        bd=dd;best={...p,q,dist:Math.sqrt(dd),tx:vx/mag,ty:vy/mag};
      }
    }
    return best;
  }

  function apply(){
    const svg=map.querySelector('svg.offline-map');
    if(!svg) return;
    const route=currentRoute(),dir=currentDirection(),items=routeLandmarks(route,dir),pts=activeRiver(route),b=bounds(pts,items);
    const placements=[];

    svg.querySelectorAll('.map-pin').forEach(g=>{
      const l=landmarks.find(x=>x.id===g.dataset.id);if(!l)return;
      const p=nearest(l.lat,l.lng,pts,b);if(!p)return;
      const isCenterline=/bridge|lock/i.test(l.id)||/bridge|lock/i.test(l.name||'');
      if(isCenterline){g.removeAttribute('transform');return;}

      const dx=p.q.x-p.x,dy=p.q.y-p.y,mag=Math.hypot(dx,dy)||1;
      const bankOffset=Math.max(9.0,Math.min(12.0,p.dist));
      const ox=dx/mag*bankOffset,oy=dy/mag*bankOffset;
      placements.push({g,p,ox,oy,x:p.x+ox,y:p.y+oy});
    });

    const minGap=7.0;
    for(let pass=0;pass<12;pass++){
      let moved=false;
      for(let i=0;i<placements.length;i++){
        for(let j=i+1;j<placements.length;j++){
          const a=placements[i],c=placements[j];
          const dx=c.x-a.x,dy=c.y-a.y,d=Math.hypot(dx,dy);
          if(d>=minGap) continue;
          const need=(minGap-d)/2+.12;
          let tx=a.p.tx+c.p.tx,ty=a.p.ty+c.p.ty;
          if(Math.hypot(tx,ty)<.1){tx=a.p.tx;ty=a.p.ty}
          const tm=Math.hypot(tx,ty)||1;tx/=tm;ty/=tm;
          a.ox-=tx*need;a.oy-=ty*need;a.x-=tx*need;a.y-=ty*need;
          c.ox+=tx*need;c.oy+=ty*need;c.x+=tx*need;c.y+=ty*need;
          moved=true;
        }
      }
      if(!moved)break;
    }

    for(const m of placements){
      m.g.setAttribute('transform',`translate(${m.ox.toFixed(2)} ${m.oy.toFixed(2)})`);
    }
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.querySelectorAll('.direction-toggle button').forEach(b=>b.addEventListener('click',schedule));
  schedule();
}
