(() => {
  const state = {
    map: null,
    userMarker: null,
    watchId: null,
    poiMarkers: [],
    pois: [],
    uiBound: false,
    suggest: { box: null, items: [], active: -1 },
  };

  function initMap() {
    // Default center Seoul
    state.map = new Tmapv2.Map('map_div', {
      center: new Tmapv2.LatLng(37.5665, 126.9780),
      width: '100%',
      height: '100%',
      zoom: 14,
    });
  }

  function setUserMarker(lat, lon) {
    const pos = new Tmapv2.LatLng(lat, lon);
    if (!state.userMarker) {
      state.userMarker = new Tmapv2.Marker({
        position: pos,
        icon: '/images/pin-red.svg',
        map: state.map,
      });
      state.map.setCenter(pos);
    } else {
      state.userMarker.setPosition(pos);
    }
  }

  function watchLocation() {
    if (!('geolocation' in navigator)) return;
    state.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserMarker(latitude, longitude);
      },
      (err) => console.warn('geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }

  function clearPoiMarkers() {
    for (const m of state.poiMarkers) {
      try { m.setMap(null); } catch (_) {}
    }
    state.poiMarkers = [];
  }

  // Load POIs from server and display on map
  async function loadPois() {
    const res = await fetch('/poi');
    const data = await res.json();
    const list = data.resultData || [];
    state.pois = list;
    clearPoiMarkers();
    for (const p of list) {
      if (p.latitude == null || p.longitude == null) continue;
      const marker = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(p.latitude, p.longitude),
        icon: '/images/pin-location.svg',
        map: state.map,
        title: p.name || '',
      });
      marker.poi = p;
      state.poiMarkers.push(marker);
    }
  }

  // ---------- Search scoring helpers ----------
  function normalize(s) { return String(s || '').trim().toLowerCase(); }

  function scoreName(name, term) {
    const n = normalize(name);
    const q = normalize(term);
    if (!q) return 0;
    if (n === q) return 100;              // exact match
    if (n.startsWith(q)) return 80;       // starts-with
    const tokens = n.split(/\s+/);
    if (tokens.includes(q)) return 70;    // token match
    const idx = n.indexOf(q);
    if (idx >= 0) return 60 - idx / 100;  // partial (earlier index slightly better)
    return 0;
  }

  function findBestPoi(query) {
    let best = null;
    let bestScore = 0;
    for (const p of state.pois) {
      const s = scoreName(p?.name || '', query);
      if (s > bestScore) { best = p; bestScore = s; continue; }
      if (s === bestScore && s > 0 && best) {
        if (String(p.name || '').localeCompare(String(best.name || ''), 'ko') < 0) best = p;
      }
    }
    return best;
  }

  function centerOnPoi(poi) {
    if (!poi) return;
    const pos = new Tmapv2.LatLng(poi.latitude, poi.longitude);
    state.map.setCenter(pos);
  }

  function performSearch(inputEl) {
    if (!inputEl) return;
    const poi = findBestPoi(inputEl.value);
    if (poi) centerOnPoi(poi);
  }

  // ---------- Suggestion dropdown ----------
  function debounce(fn, wait) {
    let t = null;
    return function(...args) {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function ensureSuggestBox(input) {
    if (!input) return;
    const label = input.parentElement;
    if (!label) return;
    if (getComputedStyle(label).position === 'static') label.style.position = 'relative';
    const box = document.createElement('div');
    box.style.position = 'absolute';
    box.style.top = '100%';
    box.style.left = '0';
    box.style.right = '0';
    box.style.zIndex = '50';
    box.style.background = '#fff';
    box.style.border = '1px solid #e5e7eb';
    box.style.borderTop = 'none';
    box.style.maxHeight = '260px';
    box.style.overflowY = 'auto';
    box.style.display = 'none';
    box.setAttribute('role', 'listbox');
    label.appendChild(box);
    state.suggest.box = box;

    document.addEventListener('click', (e) => {
      if (!box || !input) return;
      if (e.target === input || box.contains(e.target)) return;
      hideSuggestions();
    });
  }

  function hideSuggestions() {
    state.suggest.items = [];
    state.suggest.active = -1;
    if (state.suggest.box) state.suggest.box.style.display = 'none';
    if (state.suggest.box) state.suggest.box.innerHTML = '';
  }

  function updateSuggestions(input) {
    if (!state.suggest.box || !input) return;
    const q = normalize(input.value);
    if (!q) { hideSuggestions(); return; }
    const scored = state.pois
      .map(p => ({ p, s: scoreName(p?.name || '', q) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || String(a.p.name||'').localeCompare(String(b.p.name||''), 'ko'))
      .slice(0, 10);
    state.suggest.items = scored.map(x => x.p);
    state.suggest.active = scored.length ? 0 : -1;
    renderSuggestions(input);
  }

  function renderSuggestions(input) {
    const box = state.suggest.box;
    if (!box) return;
    box.innerHTML = '';
    if (!state.suggest.items.length) { hideSuggestions(); return; }
    box.style.display = 'block';
    const q = normalize(input?.value || '');
    state.suggest.items.forEach((p, idx) => {
      const item = document.createElement('div');
      item.style.padding = '8px 10px';
      item.style.cursor = 'pointer';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(idx === state.suggest.active));
      item.style.background = (idx === state.suggest.active) ? '#f3f4f6' : '#fff';

      const name = String(p.name || '');
      const n = name.toLowerCase();
      const i = n.indexOf(q.toLowerCase());
      if (i >= 0) {
        const before = document.createTextNode(name.slice(0, i));
        const mark = document.createElement('mark');
        mark.textContent = name.slice(i, i + q.length);
        mark.style.background = '#fde68a';
        mark.style.padding = '0 0.1em';
        const after = document.createTextNode(name.slice(i + q.length));
        item.appendChild(before); item.appendChild(mark); item.appendChild(after);
      } else {
        item.textContent = name;
      }

      // Use mousedown to select before any blur/hide logic, and prevent label default
      item.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        selectSuggestion(idx, input);
      });
      // Fallback for environments where click is preferred
      item.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        selectSuggestion(idx, input);
      });
      box.appendChild(item);
    });
  }

  function selectSuggestion(idx, input) {
    const poi = state.suggest.items[idx];
    if (!poi) return;
    if (input) {
      input.value = poi.name || '';
      try { input.focus(); } catch (_) {}
    }
    performSearch(input);
    hideSuggestions();
  }

  function bindUI() {
    if (state.uiBound) return;
    const input = document.querySelector('input[type="search"]');
    const btnSearch = input?.parentElement?.parentElement?.querySelector('button');
    const buttons = document.querySelectorAll('[data-location="box"] button');
    const [btnRefresh, btnImport] = buttons;

    // Suggestions: init and wire interactions
    ensureSuggestBox(input);
    const onInput = debounce(() => updateSuggestions(input), 200);
    input?.addEventListener('input', onInput);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (state.suggest.active >= 0) {
          selectSuggestion(state.suggest.active, input);
        } else {
          performSearch(input);
        }
        e.preventDefault();
      }
    });
    btnSearch?.addEventListener('click', () => performSearch(input));

    // Refresh
    btnRefresh?.addEventListener('click', () => {
      if (state.map) {
        loadPois();
      } else {
        console.warn('Map not initialized yet');
      }
    });
    // Import
    let fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    btnImport?.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async () => {
      if (!fileInput.files || fileInput.files.length === 0) return;
      const file = fileInput.files[0];
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/poi/import', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok) {
          alert(`Imported ${data.resultCnt || 0} rows`);
        } else {
          alert(data.errorMessage || 'Import failed');
        }
      } catch (e) {
        alert('Import failed');
      } finally {
        fileInput.value = '';
      }
    });
    state.uiBound = true;
  }
  document.addEventListener('DOMContentLoaded', () => {
    bindUI();
  });
  // Initialize map when Tmap SDK becomes available
  window.addEventListener('load', async () => {
    const check = setInterval(() => {
      if (window.Tmapv2) {
        clearInterval(check);
        initMap();
        watchLocation();
        loadPois();
      }
    }, 50);
  });
})();
