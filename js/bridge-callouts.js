// Makes bridge/street names legible by moving labels beyond the bridge deck
// and connecting them back to the crossing with short leader lines.
export function enableBridgeCallouts(){
  const map=document.getElementById('map');
  if(!map)return;
  const NS='http://www.w3.org/2000/svg';

  function apply(){
    const svg=map.querySelector('svg.offline-map');
    if(!svg)return;
    const groups=[...svg.querySelectorAll('.map-bridge')];

    groups.forEach((g,i)=>{
      const deck=g.querySelector('.bridge-deck');
      const text=g.querySelector('text');
      if(!deck||!text)return;

      // Remove any leader from a prior pass.
      g.querySelectorAll('.bridge-leader').forEach(n=>n.remove());

      const x1=Number(deck.getAttribute('x1')), y1=Number(deck.getAttribute('y1'));
      const x2=Number(deck.getAttribute('x2')), y2=Number(deck.getAttribute('y2'));
      const cx=(x1+x2)/2, cy=(y1+y2)/2;
      const dx=x2-x1, dy=y2-y1;
      const mag=Math.hypot(dx,dy)||1;
      const ux=dx/mag, uy=dy/mag;

      // Preserve the intended alternating side from the existing label position.
      const oldX=Number(text.getAttribute('x'))||cx;
      const oldY=Number(text.getAttribute('y'))||cy;
      const dot=(oldX-cx)*ux+(oldY-cy)*uy;
      const side=dot<0?-1:1;

      // Push labels farther from the river. A small stagger helps dense Main Branch labels.
      const dense=(map.dataset.route==='main');
      const distance=(dense?8.0:7.0)+(i%3)*(dense?1.15:.7);
      const lx=cx+ux*side*distance;
      const ly=cy+uy*side*distance;
      const deckEndX=cx+ux*side*(mag/2+.35);
      const deckEndY=cy+uy*side*(mag/2+.35);
      const leaderEndX=cx+ux*side*(distance-1.0);
      const leaderEndY=cy+uy*side*(distance-1.0);

      const leader=document.createElementNS(NS,'line');
      leader.setAttribute('class','bridge-leader');
      leader.setAttribute('x1',deckEndX.toFixed(2));
      leader.setAttribute('y1',deckEndY.toFixed(2));
      leader.setAttribute('x2',leaderEndX.toFixed(2));
      leader.setAttribute('y2',leaderEndY.toFixed(2));
      g.insertBefore(leader,text);

      text.setAttribute('x',lx.toFixed(2));
      text.setAttribute('y',ly.toFixed(2));
      text.setAttribute('text-anchor','middle');
      text.setAttribute('dominant-baseline','middle');
      text.classList.add('bridge-callout-label');
    });
  }

  let queued=false;
  const schedule=()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  };
  new MutationObserver(schedule).observe(map,{childList:true,subtree:true});
  document.getElementById('routeSelect')?.addEventListener('change',schedule);
  document.getElementById('mapRouteSelect')?.addEventListener('change',schedule);
  document.querySelectorAll('.direction-toggle button').forEach(b=>b.addEventListener('click',schedule));
  schedule();
}
