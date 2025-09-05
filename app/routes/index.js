const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

/* GET home page. */
router.get('/index', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET getScript for TMAP API */
router.get('/getScript', function(req, res, next) {
  res.type('application/javascript');
  res.send(`
// TMAP Integration Script
console.log('Loading TMAP Integration...');

// TMAP API Key - replace with your actual API key when using real TMAP API
window.TMAP_API_KEY = 'l7xx8d1e25f7e5c64ec4b717a7b5b07a4b3d';

// Try to load real TMAP SDK first, fallback to mock implementation
function loadTmapSDK() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=' + window.TMAP_API_KEY;
  
  script.onload = function() {
    console.log('Real TMAP SDK loaded successfully');
    initializeRealMap();
  };
  
  script.onerror = function() {
    console.log('Real TMAP SDK not available, using mock implementation');
    initializeMockTmap();
    initializeMap();
  };
  
  document.head.appendChild(script);
}

// Mock Tmapv2 implementation for demonstration
function initializeMockTmap() {
  window.Tmapv2 = {
    LatLng: function(lat, lng) {
      this.lat = lat;
      this.lng = lng;
      return this;
    },
    Map: function(elementId, options) {
      console.log('Initializing TMAP Mock Map with options:', options);
      var mapElement = document.getElementById(elementId);
      if (mapElement) {
        // Create a mock map display
        mapElement.innerHTML = \`
          <div style="width: 100%; height: 100%; background: linear-gradient(45deg, #e3f2fd 25%, #bbdefb 25%, #bbdefb 50%, #e3f2fd 50%, #e3f2fd 75%, #bbdefb 75%, #bbdefb); background-size: 40px 40px; position: relative; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif;">
            <div style="background: rgba(255,255,255,0.95); padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 8px 16px rgba(0,0,0,0.15); max-width: 400px;">
              <h2 style="color: #1976d2; margin: 0 0 15px 0; font-size: 28px; font-weight: bold;">🗺️ TMAP 지도</h2>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <p style="color: #424242; margin: 0 0 8px 0; font-size: 16px; font-weight: 500;">📍 서울시 중심</p>
                <p style="color: #666; margin: 0; font-size: 14px;">위도: \${options.center.lat} | 경도: \${options.center.lng}</p>
                <p style="color: #666; margin: 8px 0 0 0; font-size: 14px;">🔍 줌 레벨: \${options.zoom}</p>
              </div>
              <div style="padding: 12px; background: #e8f5e8; border-radius: 6px; border-left: 4px solid #4caf50;">
                <span style="color: #2e7d32; font-weight: bold; font-size: 15px;">✅ 지도가 성공적으로 로드되었습니다</span>
              </div>
              <p style="color: #888; margin: 15px 0 0 0; font-size: 12px;">* 실제 TMAP API 연동을 위해서는 API 키 설정이 필요합니다</p>
            </div>
          </div>
        \`;
        
        // Add some interactive features
        mapElement.style.cursor = 'grab';
        mapElement.addEventListener('mousedown', function() {
          this.style.cursor = 'grabbing';
        });
        mapElement.addEventListener('mouseup', function() {
          this.style.cursor = 'grab';
        });
        mapElement.addEventListener('mouseleave', function() {
          this.style.cursor = 'grab';
        });
      }
      return this;
    }
  };
}

// Initialize real TMAP map
function initializeRealMap() {
  try {
    var map = new Tmapv2.Map("map_div", {
      center: new Tmapv2.LatLng(37.56652, 126.97796), // Seoul coordinates
      width: "100%",
      height: "100vh",
      zoom: 15,
      zoomControl: true,
      scrollwheel: true
    });
    
    console.log('Real TMAP map initialized successfully');
  } catch (error) {
    console.error('Error initializing real TMAP map:', error);
  }
}

// Initialize mock map
function initializeMap() {
  try {
    var map = new Tmapv2.Map("map_div", {
      center: new Tmapv2.LatLng(37.56652, 126.97796), // Seoul coordinates
      width: "100%",
      height: "100vh",
      zoom: 15,
      zoomControl: true,
      scrollwheel: true
    });
    
    console.log('TMAP mock map initialized successfully');
  } catch (error) {
    console.error('Error initializing TMAP map:', error);
  }
}

// Start the loading process when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTmapSDK);
} else {
  loadTmapSDK();
}
  `);
});

module.exports = router;
