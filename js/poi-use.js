// Adds a consistent Use classification to each POI detail page without changing the base dataset.
const USE_BY_ID={
  'chicago-harbor-lock':'Infrastructure',
  'st-regis':'Mixed Use',
  'aqua':'Mixed Use',
  'wrigley':'Commercial / Office',
  'trump':'Mixed Use',
  'marina-city':'Mixed Use',
  'merchandise-mart':'Commercial / Office',
  'wolf-point':'Mixed Use / Historic Site',
  '150-riverside':'Commercial / Office',
  'civic-opera':'Cultural / Commercial',
  '300-wacker':'Commercial / Office',
  'willis-tower':'Commercial / Office',
  'river-city':'Residential',
  'st-charles-bridge':'Infrastructure',
  'cbot':'Commercial / Office',
  'carbide':'Hotel / Commercial',
  'erie-park':'Residential',
  'wild-mile':'Public Space / Ecological',
  'ballys':'Entertainment / Redevelopment',
  'salt-shed':'Cultural / Entertainment'
};

export function enablePoiUse(){
  const modal=document.getElementById('detailModal');
  if(!modal)return;
  function apply(){
    const grid=modal.querySelector('.detail-grid');
    if(!grid||grid.querySelector('[data-poi-use]'))return;
    const title=modal.querySelector('.modal-copy h2')?.textContent||'';
    const pin=[...document.querySelectorAll('.map-key,.map-pin')].find(el=>{
      const id=el.dataset.id;if(!id)return false;
      const key=el.matches('.map-key')?el.querySelector('span')?.textContent:'';
      return key===title;
    });
    let id=pin?.dataset.id;
    if(!id){
      const norm=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ');
      const t=norm(title);
      id=Object.keys(USE_BY_ID).find(k=>t.includes(norm(k).trim()))||null;
      const aliases={
        'Chicago Harbor Lock':'chicago-harbor-lock','St. Regis Chicago':'st-regis','Aqua':'aqua','Wrigley Building':'wrigley',
        'Trump International Hotel & Tower':'trump','Marina City':'marina-city','The Merchandise Mart':'merchandise-mart','Wolf Point':'wolf-point',
        '150 North Riverside':'150-riverside','Civic Opera House / Lyric Opera':'civic-opera','300 South Wacker':'300-wacker','Willis Tower (Sears Tower)':'willis-tower',
        'River City':'river-city','St. Charles Air Line Bridge':'st-charles-bridge','Chicago Board of Trade & Ceres':'cbot','Carbide & Carbon Building':'carbide',
        'Erie on the Park':'erie-park','The Wild Mile':'wild-mile','Bally’s Chicago Site':'ballys','The Salt Shed':'salt-shed'
      };
      id=aliases[title]||id;
    }
    const use=USE_BY_ID[id]||'Other';
    const box=document.createElement('div');box.dataset.poiUse='1';box.innerHTML=`<strong>Use</strong><span>${use}</span>`;
    const gps=[...grid.children].find(x=>x.querySelector('strong')?.textContent==='GPS');
    if(gps)grid.insertBefore(box,gps);else grid.appendChild(box);
  }
  new MutationObserver(()=>requestAnimationFrame(apply)).observe(modal,{childList:true,subtree:true});
  modal.addEventListener('click',()=>requestAnimationFrame(apply));
}
