export async function enableSharedPoiOffsets(build) {
  const v = encodeURIComponent(String(build || Date.now()));
  const base = await import(`../data/guide-data.js?v=${v}`);
  let landmarks = base.LANDMARKS.map(x => ({ ...x }));
  const river = base.RIVER;

  try {
    const custom = await import(`../data/custom-landmarks.js?v=${v}`);
    for (const l of landmarks) {
      if (custom.LANDMARK_OVERRIDES?.[l.id]) Object.assign(l, custom.LANDMARK_OVERRIDES[l.id]);
    }
    for (const add of custom.LANDMARK_ADDITIONS || []) {
      if (!landmarks.some(x => x.id === add.id)) landmarks.push({ ...add });
    }
  } catch (e) {}

  const map = document.getElementById('map');
  if (!map) return;

  const currentRoute = () => document.getElementById('routeSelect')?.value || 'main';
  const allPoints = () => river.main.concat(river.south.slice(1), river.north.slice(1));

  function bounds(points) {
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    return {
      minLat: Math.min(...lats) - .0022,
      maxLat: Math.max(...lats) + .0022,
      minLng: Math.min(...lngs) - .0030,
      maxLng: Math.max(...lngs) + .0030
    };
  }

  function project(lat, lng, b) {
    return {
      x: 5 + ((lng - b.minLng) / (b.maxLng - b.minLng)) * 90,
      y: 8 + ((b.maxLat - lat) / (b.maxLat - b.minLat)) * 112
    };
  }

  function nearest(lat, lng, pts, b) {
    const q = project(lat, lng, b);
    let best = null, bestDist = Infinity;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = project(pts[i][0], pts[i][1], b);
      const c = project(pts[i + 1][0], pts[i + 1][1], b);
      const vx = c.x - a.x, vy = c.y - a.y;
      const wx = q.x - a.x, wy = q.y - a.y;
      const d = vx * vx + vy * vy;
      const t = d ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / d)) : 0;
      const p = { x: a.x + t * vx, y: a.y + t * vy };
      const dist = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (dist < bestDist) {
        const mag = Math.hypot(vx, vy) || 1;
        bestDist = dist;
        best = { ...p, q, dist: Math.sqrt(dist), tx: vx / mag, ty: vy / mag };
      }
    }
    return best;
  }

  function apply() {
    const svg = map.querySelector('svg.offline-map');
    if (!svg) return;
    const route = currentRoute();
    const pts = river[route];
    const b = bounds(allPoints());
    const placed = [];

    const bridgeBoxes = [...svg.querySelectorAll('.map-bridge text')]
      .map(t => { try { return t.getBBox(); } catch (e) { return null; } })
      .filter(Boolean);
    const labelHits = (x, y, r = 3.25) => bridgeBoxes.reduce((n, bb) =>
      n + ((x + r) >= bb.x && (x - r) <= bb.x + bb.width && (y + r) >= bb.y && (y - r) <= bb.y + bb.height ? 1 : 0), 0);

    function limits(id) {
      if (route === 'main' && id === 'merchandise-mart') return { min: -4.5, max: -2.8 };
      if (route === 'south' && id === '300-wacker') return { min: 2, max: 5.5 };
      if (route === 'south' && id === 'willis-tower') return { min: -5.5, max: -2 };
      return { min: -5.5, max: 5.5 };
    }
    function initial(id) {
      if (route === 'main' && id === 'merchandise-mart') return -4;
      if (route === 'south' && id === '300-wacker') return 3.8;
      if (route === 'south' && id === 'willis-tower') return -3.8;
      return 0;
    }
    function update(m) {
      const lim = limits(m.id);
      m.shift = Math.max(lim.min, Math.min(lim.max, m.shift));
      m.ox = m.baseOx + m.p.tx * m.shift;
      m.oy = m.baseOy + m.p.ty * m.shift;
      m.x = m.p.x + m.ox;
      m.y = m.p.y + m.oy;
    }

    svg.querySelectorAll('.map-pin').forEach(g => {
      const l = landmarks.find(x => x.id === g.dataset.id);
      if (!l) return;
      const p = nearest(l.lat, l.lng, pts, b);
      if (!p) return;
      const centerline = /bridge|lock/i.test(l.id) || /bridge|lock/i.test(l.name || '') || l.id === 'wolf-point';
      if (centerline) { g.removeAttribute('transform'); return; }
      const dx = p.q.x - p.x, dy = p.q.y - p.y;
      const mag = Math.hypot(dx, dy) || 1;
      const offset = Math.max(9, Math.min(12, p.dist));
      const m = { id: l.id, g, p, baseOx: dx / mag * offset, baseOy: dy / mag * offset, shift: initial(l.id) };
      update(m);
      placed.push(m);
    });

    const minGap = 8;
    for (let pass = 0; pass < 12; pass++) {
      let moved = false;
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i], c = placed[j];
          const d = Math.hypot(c.x - a.x, c.y - a.y);
          if (d >= minGap) continue;
          const n = (minGap - d) / 2 + .15;
          a.shift -= n; c.shift += n; update(a); update(c); moved = true;
        }
      }
      if (!moved) break;
    }

    for (const m of placed) {
      if (labelHits(m.x, m.y)) {
        const lim = limits(m.id);
        for (const delta of [-3, -2, -1, 1, 2, 3]) {
          const test = Math.max(lim.min, Math.min(lim.max, m.shift + delta));
          const x = m.p.x + m.baseOx + m.p.tx * test;
          const y = m.p.y + m.baseOy + m.p.ty * test;
          if (!labelHits(x, y)) { m.shift = test; update(m); break; }
        }
      }
      m.g.setAttribute('transform', `translate(${m.ox.toFixed(2)} ${m.oy.toFixed(2)})`);
    }
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  };
  new MutationObserver(schedule).observe(map, { childList: true, subtree: true });
  document.getElementById('routeSelect')?.addEventListener('change', schedule);
  document.getElementById('mapRouteSelect')?.addEventListener('change', schedule);
  document.querySelectorAll('.direction-toggle button').forEach(b => b.addEventListener('click', schedule));
  schedule();
}
