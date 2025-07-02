// Map Configuration
const mapConfig = {
    // Default map center (adjust according to your area)
    center: [-7.8, 110.4], // Approximate coordinates for Yogyakarta area
    zoom: 15,
    
    // Basemap definitions
    basemaps: {
        osm: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        },
        esri: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '© Esri, Maxar, Earthstar Geographics',
            maxZoom: 19
        },
        google: {
            url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
            attribution: '© Google',
            maxZoom: 20
        },
        topo: {
            url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            attribution: '© OpenTopoMap contributors',
            maxZoom: 17
        }
    },
    
    // Layer styles
    layerStyles: {
        bangunan: {
            fillColor: '#ff6b6b',
            color: '#c92a2a',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        },
        jalan_lokal: {
            color: '#4ecdc4',
            weight: 4,
            opacity: 0.8
        },
        pendidikan: {
            radius: 8,
            fillColor: '#45b7d1',
            color: '#1e88e5',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        },
        perdaganganjasa: {
            radius: 8,
            fillColor: '#96ceb4',
            color: '#26a69a',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        },
        peribadatan: {
            radius: 8,
            fillColor: '#feca57',
            color: '#ff9f43',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        },
        dimajar2_batas: {
            color: '#f7b731',
            weight: 3,
            fill: true,
            fillColor: '#fff700',
            fillOpacity: 0 // default: tanpa fill
        },
        lahan: {
            color: '#888',
            weight: 1.5,
            fillOpacity: 1
            // fillColor akan diatur dinamis di layer-manager.js
        }
    },
    
    // Layer data sources
    dataSources: {
        bangunan: 'data/bangunan.geojson',
        lahan: 'data/lahan.geojson',
        jalan_lokal: 'data/jalan_lokal.geojson',
        pendidikan: 'data/pendidikan.geojson',
        perdaganganjasa: 'data/perdaganganjasa.geojson',
        peribadatan: 'data/peribadatan.geojson',
        dimajar2_batas: 'data/dimajar2_batas.geojson'
    }
};