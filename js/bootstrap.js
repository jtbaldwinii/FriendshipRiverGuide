async function boot(){
  let version=Date.now().toString();
  try{
    const r=await fetch('data/build.json?_='+Date.now(),{cache:'no-store'});
    if(r.ok){const j=await r.json();if(j.version)version=String(j.version)}
  }catch(e){}

  const css=document.getElementById('appStyles');
  if(css)css.href=`css/app.css?v=${encodeURIComponent(version)}`;
  const bridgeCss=document.getElementById('bridgeStyles');
  if(bridgeCss)bridgeCss.href=`css/bridges.css?v=${encodeURIComponent(version)}`;

  try{
    const analytics=await import(`./analytics.js?v=${encodeURIComponent(version)}`);
    analytics.enableAnalytics();
    const mod=await import(`./app.js?v=${encodeURIComponent(version)}`);
    await mod.startApp(version);
    const lockOverlay=await import(`./lock-overlay.js?v=${encodeURIComponent(version)}`);
    await lockOverlay.enableLockOverlay(version);
    const bankOffsets=await import(`./shared-poi-offset.js?v=${encodeURIComponent(version)}`);
    await bankOffsets.enableSharedPoiOffsets(version);
    const gooseIsland=await import(`./goose-island-overlay.js?v=${encodeURIComponent(version)}`);
    await gooseIsland.enableGooseIslandOverlay(version);
    const bridgeCallouts=await import(`./bridge-callouts.js?v=${encodeURIComponent(version)}`);
    bridgeCallouts.enableBridgeCallouts();
    const poiUse=await import(`./poi-use.js?v=${encodeURIComponent(version)}`);
    poiUse.enablePoiUse();
  }catch(err){
    console.error(err);
    const card=document.getElementById('gpsStatus');
    if(card)card.innerHTML='<strong>Guide failed to load</strong><p>Refresh once or check the network connection.</p>';
  }
}
boot();
