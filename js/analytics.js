// Friendship River Guide analytics. No GPS coordinates or user-entered data are sent.
const MEASUREMENT_ID='G-EXR0EH5GRD';

function send(name,params={}){
  if(typeof window.gtag!=='function')return;
  window.gtag('event',name,{...params,transport_type:'beacon'});
}
function viewName(id){return({cruiseView:'cruise',mapView:'map',browseView:'explore',chicagoView:'chicago'})[id]||id||'unknown'}

export function enableAnalytics(){
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config',MEASUREMENT_ID,{send_page_view:true,anonymize_ip:true});

  const s=document.createElement('script');s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;document.head.appendChild(s);

  send('guide_loaded',{
    device_class:matchMedia('(max-width: 767px)').matches?'phone':matchMedia('(max-width: 1100px)').matches?'tablet':'desktop',
    screen_width:window.screen?.width||0,
    screen_height:window.screen?.height||0,
    viewport_width:window.innerWidth,
    viewport_height:window.innerHeight
  });

  document.addEventListener('click',e=>{
    const pin=e.target.closest('.map-pin,.map-key');
    if(pin?.dataset.id){send('poi_open',{poi_id:pin.dataset.id,source:pin.classList.contains('map-pin')?'map_pin':'map_key'});return}
    const item=e.target.closest('.landmark-item');
    if(item?.dataset.id){send('poi_open',{poi_id:item.dataset.id,source:'explore'});return}
    if(e.target.closest('#heroMoreBtn')){const title=document.querySelector('#heroCard h1')?.textContent||'unknown';send('poi_detail_open',{poi_name:title,source:'cruise'});return}
    const nav=e.target.closest('.bottom-nav button');if(nav){send('view_draw',{view:viewName(nav.dataset.view)});return}
    if(e.target.closest('#gpsBtn')){send('gps_started');return}
    if(e.target.closest('#nextBtn')){send('poi_navigate',{direction:'next'});return}
    if(e.target.closest('#prevBtn')){send('poi_navigate',{direction:'previous'});return}
    const d=e.target.closest('.direction-toggle button');if(d){send('direction_selected',{direction:d.dataset.dir||'unknown'});return}
  },true);

  document.getElementById('routeSelect')?.addEventListener('change',e=>send('route_selected',{route:e.target.value}));

  // Treat each visible app view as a logical page draw in this single-page guide.
  const observer=new MutationObserver(()=>{
    document.querySelectorAll('.view.active').forEach(v=>{
      if(v.dataset.analyticsVisible==='1')return;
      document.querySelectorAll('.view').forEach(x=>delete x.dataset.analyticsVisible);
      v.dataset.analyticsVisible='1';send('screen_view',{screen_name:viewName(v.id)});
    });
  });
  const main=document.querySelector('main');if(main)observer.observe(main,{attributes:true,subtree:true,attributeFilter:['class']});
  const initial=document.querySelector('.view.active');if(initial){initial.dataset.analyticsVisible='1';send('screen_view',{screen_name:viewName(initial.id)})}
}
