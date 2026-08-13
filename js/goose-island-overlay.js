// Clean schematic for the North Branch around Goose Island.
// This intentionally uses stable SVG coordinates instead of trying to force the
// original single-line river geometry to represent two separate channels.
export async function enableGooseIslandOverlay(){
  const map=document.getElementById('map');
  if(!map)return;
  const NS='http://www.w3.org/2000/svg';

  // Shared SVG coordinates (viewBox 0 0 100 128).
  // Stem = Wolf Point north to the south end of Goose Island.
  const STEM=[[46,73],[44,69],[42,65],[40,61],[39,57]];
  // North Branch proper on the west side of Goose Island.
  const WEST=[[39,57],[32,53],[25,47],[19,41],[15,34],[14,29],[16,25]];
  // North Branch Canal on the east side of Goose Island.
  const CANAL=[[39,57],[40,51],[38,45],[35,39],[30,33],[24,28],[16,25]];

  const path=pts=>pts.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' ');
  const add=(tag,cls,attrs={},parent)=>{
    const el=document.createElementNS(NS,tag);el.setAttribute('class',cls);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    (parent||map.querySelector('svg.offline-map'))?.appendChild(el);return el;
  };

  const POIS={
    'wolf-point':[46,73],
    'erie-park':[49,64],
    'montgomery-ward':[47,57],
    'wild-mile':[42,40],
    'ballys':[29,56],
    'salt-shed':[8,34]
  };

  function bridgeGroup(svg,name,deck,labelX,labelY,secondDeck=null){
    const g=add('g','map-bridge north-custom-bridge',{},svg);
    const [x1,y1,x2,y2]=deck;
    add('line','bridge-shadow',{x1,y1,x2,y2},g);
    add('line','bridge-deck',{x1,y1,x2,y2},g);
    if(secondDeck){
      const [a,b,c,d]=secondDeck;
      add('line','bridge-shadow bridge-secondary',{x1:a,y1:b,x2:c,y2:d},g);
      add('line','bridge-deck bridge-secondary',{x1:a,y1:b,x2:c,y2:d},g);
    }
    const t=add('text','',{x:labelX,y:labelY,'text-anchor':'middle'},g);t.textContent=name;
    return g;
  }

  function drawNorth(svg,active){
    const riverClass=active?'river-line':'context-river';
    const coreClass=active?'river-core':'context-river-core';
    const g=add('g',`goose-overlay ${active?'active':'context'}`,{},svg);

    [STEM,WEST,CANAL].forEach(seg=>{
      add('path',riverClass,{d:path(seg)},g);
      if(active)add('path',coreClass,{d:path(seg)},g);
    });

    // Explicit island land mass between the two channels.
    const island='M 39 57 L 32 53 L 25 47 L 19 41 L 15 34 L 14 29 L 16 25 L 24 28 L 30 33 L 35 39 L 38 45 L 40 51 Z';
    add('path','goose-island-land',{d:island},g);
    const label=add('text',`goose-label${active?' active':''}`,{x:26,y:39,'text-anchor':'middle'},g);label.textContent='GOOSE ISLAND';

    if(active){
      // Replace the generic North Branch bridge groups with schematic crossings
      // that actually span the appropriate water channel(s).
      svg.querySelectorAll('.map-bridge:not(.north-custom-bridge)').forEach(n=>n.remove());
      bridgeGroup(svg,'Kinzie St RR',[41,69,47,68],44,66.5);
      bridgeGroup(svg,'Grand Ave',[38,63,45,61.5],41.5,60);
      bridgeGroup(svg,'Chicago Ave',[35.5,57.5,42,55.5],38.5,54);
      // Division crosses both sides of Goose Island.
      bridgeGroup(svg,'Division St',[18,43.5,23.5,39.5],28,43,[34,43.5,39,41]);
      bridgeGroup(svg,'North Ave',[12.5,28,18,24],14.5,22.5);
    }
  }

  function apply(){
    const svg=map.querySelector('svg.offline-map');if(!svg)return;
    const route=document.getElementById('routeSelect')?.value||'main';
    svg.querySelectorAll('.goose-overlay,.north-custom-bridge').forEach(n=>n.remove());

    // Remove the old North context line; the clean schematic below replaces it.
    const ctx=svg.querySelector('.context-river[data-branch="north"]');if(ctx)ctx.remove();

    if(route==='north'){
      // Hide the generic active North river; draw the clean three-part schematic instead.
      svg.querySelectorAll(':scope > .river-line,:scope > .river-core,:scope > .route-line').forEach(n=>n.style.display='none');
      drawNorth(svg,true);

      // Final POI positions. Bank side is encoded directly here so the marker
      // cannot be flipped across the channel by the generic collision code.
      svg.querySelectorAll('.map-pin').forEach(g=>{
        const p=POIS[g.dataset.id];if(!p)return;
        g.removeAttribute('transform');
        const c=g.querySelector('circle');if(c){c.setAttribute('cx',p[0]);c.setAttribute('cy',p[1])}
        const t=g.querySelector('.pin-num');if(t){t.setAttribute('x',p[0]);t.setAttribute('y',p[1]+.05)}
      });
    }else{
      drawNorth(svg,false);
    }
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})};
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.getElementById('mapRouteSelect')?.addEventListener('change',schedule);
  schedule();
}
