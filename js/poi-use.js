// Adds a consistent Type classification to each POI detail page.
const TYPE_BY_TITLE={
  'Chicago Harbor Lock':'Infrastructure',
  'St. Regis Chicago':'Mixed Use',
  'Aqua':'Mixed Use',
  'Wrigley Building':'Commercial / Office',
  'Trump International Hotel & Tower':'Mixed Use',
  'Marina City':'Mixed Use',
  'The Merchandise Mart':'Commercial / Office',
  'Wolf Point':'Mixed Use / Historic Site',
  '150 North Riverside':'Commercial / Office',
  'Civic Opera House / Lyric Opera':'Cultural / Commercial',
  '300 South Wacker':'Commercial / Office',
  'Willis Tower (Sears Tower)':'Commercial / Office',
  'Old Chicago Main Post Office':'Commercial / Adaptive Reuse',
  'River City':'Residential',
  'St. Charles Air Line Bridge':'Infrastructure',
  'Chicago Board of Trade & Ceres':'Commercial / Office',
  'Carbide & Carbon Building':'Hotel / Commercial',
  'Erie on the Park':'Residential',
  'Montgomery Ward Catalog House / 600 West Chicago':'Mixed Use / Adaptive Reuse',
  'The Wild Mile':'Public Space / Ecological',
  'Bally’s Chicago Site':'Entertainment / Redevelopment',
  'The Salt Shed':'Cultural / Entertainment'
};

export function enablePoiUse(){
  const modal=document.getElementById('detailModal');
  if(!modal)return;

  function apply(){
    const grid=modal.querySelector('.detail-grid');
    const title=modal.querySelector('.modal-copy h2')?.textContent?.trim();
    if(!grid||!title)return;
    grid.querySelectorAll('[data-poi-use]').forEach(el=>el.remove());
    const type=TYPE_BY_TITLE[title]||'Other';
    const box=document.createElement('div');
    box.dataset.poiUse='1';
    box.innerHTML=`<strong>Type</strong><span>${type}</span>`;
    const gps=[...grid.children].find(x=>x.querySelector('strong')?.textContent==='GPS');
    if(gps)grid.insertBefore(box,gps);else grid.appendChild(box);
  }

  // Observe the element app.js actually replaces when a detail page opens.
  const content=document.getElementById('modalContent');
  if(content)new MutationObserver(()=>requestAnimationFrame(apply)).observe(content,{childList:true,subtree:true});
  modal.addEventListener('transitionend',apply);
  modal.addEventListener('click',()=>requestAnimationFrame(apply));
  apply();
}
