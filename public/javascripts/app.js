(() => {
  const state = {
    map: null,
    userMarker: null,
    watchId: null,
    poiMarkers: [],
    pois: [],
    uiBound: false,
    searchTimeout: null,
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

  // Search POIs by name
  async function searchPois(query) {
    if (!query.trim()) {
      hideSearchResults();
      return;
    }
    try {
      const res = await fetch(`/poi/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = Array.isArray(data.resultData) ? data.resultData : [];
      displaySearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      hideSearchResults();
    }
  }

  // Display search results in dropdown
  function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    if (!Array.isArray(results) || results.length === 0) {
      container.innerHTML = '<div class="p-2 text-gray-500">No results found</div>';
      container.classList.remove('hidden');
      return;
    }

    container.innerHTML = results.map(poi => 
      `<div class="search-result-item p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100" 
           data-lat="${poi.latitude}" data-lng="${poi.longitude}" data-name="${escapeHtml(poi.name)}">
         <div class="font-medium">${escapeHtml(poi.name)}</div>
         <div class="text-sm text-gray-600">${poi.latitude}, ${poi.longitude}</div>
       </div>`
    ).join('');
    container.classList.remove('hidden');

    // Add click listeners to search results
    container.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const lat = parseFloat(item.dataset.lat);
        const lng = parseFloat(item.dataset.lng);
        const name = item.dataset.name;
        centerMapOnLocation(lat, lng, name);
        hideSearchResults();
        document.getElementById('searchInput').value = name;
      });
    });
  }

  // Hide search results
  function hideSearchResults() {
    const container = document.getElementById('searchResults');
    if (container) {
      container.classList.add('hidden');
    }
  }

  // Center map on specific location
  function centerMapOnLocation(lat, lng, name) {
    if (!state.map) return;
    const position = new Tmapv2.LatLng(lat, lng);
    state.map.setCenter(position);
    state.map.setZoom(16);
    
    // Optional: Show info window or highlight the marker
    console.log(`Centered on: ${name} at ${lat}, ${lng}`);
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function bindUI() {
    if (state.uiBound) return;
    const buttons = document.querySelectorAll('[data-location="box"] button');
    const [btnRefresh, btnImport] = buttons;
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    
    if (searchInput) {
      // Debounced search on input
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        clearTimeout(state.searchTimeout);
        state.searchTimeout = setTimeout(() => {
          searchPois(query);
        }, 300);
      });

      // Hide results when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchInput') && !e.target.closest('#searchResults')) {
          hideSearchResults();
        }
      });

      // Clear search results when input is cleared
      searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim()) {
          searchPois(searchInput.value);
        }
      });
    }

    if (searchButton) {
      searchButton.addEventListener('click', () => {
        const query = searchInput?.value || '';
        if (query.trim()) {
          searchPois(query);
        }
      });
    }

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
