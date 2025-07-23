// Map Configuration "map-config.js"
const mapConfig = {
    // Default map center (adjust according to your area)
    center: [-7.569, 110.179], 
    zoom: 16,
    
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

    lahanColorMap: {
        'Vegetasi Non Budidaya Lainnya': '#aed581',
        'Tempat Tinggal': '#ef9a9a',
        'Lahan Terbuka (Tanah Kosong)': '#bcaaa4',
        'Transportasi': '#b0bec5',
        'Perikanan air tawar': '#90caf9',
        'Pekarangan': '#dce775',
        'Sawah': '#81c784',
        'Peribadatan': '#fff59d',
        'Perkebunan': '#c5e1a5',
        'Pendidikan': '#ffcc80',
        'Sungai': '#aadef0',
        'Industri dan Perdagangan': '#c7b2de',
        'Kebun Campur': '#a2b975',
        'Pos Ronda': '#f5deb3',
        'Rumput': '#c0d581'
    },
    
    // Layer styles
    layerStyles: {
        bangunan: {
            fillColor: '#ff6b6b',
            color: '#c92a2a',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.85
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
        industri_pergudangan: {
             radius: 8,
             fillColor: '#8e44ad',
             color: '#6a1b9a',
             weight: 2,
             opacity: 1,
             fillOpacity: 0.8
        },
        sungai: {
            fillColor: '#3498db',
            color: '#2980b9',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        },
        area_rt: {
            color: '#ff17ab',
            weight: 2.5,
            fill: true,
            fillColor: '#ff17ab',
            fillOpacity: 0.35,
            dashArray: '5, 5'
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
        industri_pergudangan: 'data/industri_pergudangan.geojson',
        sungai: 'data/sungai.geojson',
        area_rt: 'data/area_rt.geojson',
        dimajar2_batas: 'data/dimajar2_batas.geojson'
    }
};