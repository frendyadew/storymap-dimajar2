// Main Application "main.js"
class StoryMapApp {
    constructor() {
        this.map = null;
        this.layerManager = null;
        this.currentBasemap = 'osm';

        this.initializeMap();
        this.initializeControls();
        this.loadLayers();
    }

    initializeMap() {
        // Create map
        this.map = L.map('map', {
            center: mapConfig.center,
            zoom: mapConfig.zoom,
            zoomControl: false
        });

        // Add zoom control to bottom right
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Add scale control
        L.control.scale({
            position: 'bottomleft',
            metric: true,
            imperial: false
        }).addTo(this.map);

        // Set initial basemap
        this.setBasemap(this.currentBasemap);

        // Initialize managers
        this.layerManager = new LayerManager(this.map);
    }

    initializeControls() {
        // Basemap selector
        const basemapSelect = document.getElementById('basemapSelect');
        basemapSelect.addEventListener('change', (e) => {
            this.setBasemap(e.target.value);
        });

        // Layer toggles
        Object.keys(mapConfig.dataSources).forEach(layerName => {
            const checkbox = document.getElementById(layerName);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.layerManager.toggleLayer(layerName, e.target.checked);
                });
            }
        });

        // Control buttons
        document.getElementById('aboutBtn').addEventListener('click', () => {
            this.showAboutModal();
        });

        document.getElementById('homeBtn').addEventListener('click', () => {
            this.layerManager.zoomToExtent();
        });
    }

    setBasemap(basemapType) {
        // Remove current basemap
        this.map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                this.map.removeLayer(layer);
            }
        });

        // Add new basemap
        const basemapConfig = mapConfig.basemaps[basemapType];
        if (basemapConfig) {
            const basemapLayer = L.tileLayer(basemapConfig.url, {
                attribution: basemapConfig.attribution,
                maxZoom: basemapConfig.maxZoom
            });
            basemapLayer.addTo(this.map);
            this.currentBasemap = basemapType;
        }
    }

    async loadLayers() {
        try {
            await this.layerManager.loadAllLayers();
            this.updateLayerInfo();
        } catch (error) {
            console.error('Error loading layers:', error);
        }
    }

    updateLayerInfo() {
        // Update layer count in sidebar (optional)
        Object.keys(mapConfig.dataSources).forEach(layerName => {
            const count = this.layerManager.getLayerFeatureCount(layerName);
            const label = document.querySelector(`label[for="${layerName}"]`);
            if (label && count > 0) {
                label.textContent = `${label.textContent.split(' (')[0]} (${count})`;
            }
        });
    }

    showAboutModal() {
        const modal = document.getElementById('aboutModal');
        modal.style.display = 'block';
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StoryMapApp();
});