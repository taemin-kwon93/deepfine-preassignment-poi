(() => {
  const state = {
    map: null,
    userMarker: null,
    watchId: null,
    poiMarkers: [],
    pois: [],
    uiBound: false,
  };

  const $ = (sel) => document.querySelector(sel);

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
  function bindUI() {
      if (state.uiBound) return;
      const buttons = document.querySelectorAll('[data-location="box"] button');
      const [, btnImport] = buttons;
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
      }
    }, 50);
  });
})();
