// Adds Sears Tower (Willis Tower) to the South Branch tour.
(function(){
  if (typeof LANDMARKS==='undefined' || typeof TOUR_ORDERS==='undefined') return;
  if (!LANDMARKS.some(function(x){return x.id==='willis';})) {
    LANDMARKS.push({id:'willis',name:'Sears Tower (Willis Tower)',lat:41.878876,lng:-87.635918,side:'Starboard',route:'south',out:8,ret:8,photo:'assets/photo-16.jpg',subtitle:'Chicago’s bundled-tube icon rising above the South Branch',architect:'Skidmore, Owings & Merrill — Bruce Graham & Fazlur Rahman Khan',year:'1973',style:'Modern / bundled-tube skyscraper',story:'Built as the Sears Tower, this 110-story landmark became the world’s tallest building when it opened. Its nine bundled square tubes step back at different heights, giving the tower its unmistakable profile while creating an exceptionally efficient structure for its height.',fact:'It held the title of world’s tallest building for nearly 25 years, and Chicagoans still commonly call it the Sears Tower.'});
  }
  var so=TOUR_ORDERS.south.outbound, sr=TOUR_ORDERS.south.return;
  if (so.indexOf('willis')<0) so.splice(so.indexOf('300-wacker'),0,'willis');
  if (sr.indexOf('willis')<0) sr.splice(sr.indexOf('150-riverside'),0,'willis');
  if (typeof MAP_REFS!=='undefined' && !MAP_REFS.some(function(x){return x.name==='Adams';})) MAP_REFS.push({name:'Adams',lat:41.87925,lng:-87.63755,dx:1.5,dy:.4,anchor:'start'});
  if (typeof renderCruise==='function') renderCruise();
  if (typeof renderList==='function') renderList();
  if (typeof renderMap==='function') renderMap();
})();
