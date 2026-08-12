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
    const mod=await import(`./app.js?v=${encodeURIComponent(version)}`);
    await mod.startApp(version);
  }catch(err){
    console.error(err);
    const card=document.getElementById('gpsStatus');
    if(card)card.innerHTML='<strong>Guide failed to load</strong><p>Refresh once or check the network connection.</p>';
  }
}
boot();
