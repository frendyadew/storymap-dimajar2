// Main Application "main.js"

class StoryMapApp {
    constructor() {
        this.map = null;
        this.layerManager = null;
        this.currentBasemap = 'google';
        this.drawnItems = null;
        this.drawControl = null;
        this.customFeatureCounter = 1;
        this.drawnLayers = {};

        const urlParams = new URLSearchParams(window.location.search);
        this.layerToZoom = urlParams.get('layer');

        this.initializeMap();
        this.initializeControls();
        this.initializeDraw();
        this.loadLayers();
    }

    initializeMap() {
        this.map = L.map('map', {
            center: mapConfig.center,
            zoom: mapConfig.zoom,
            zoomControl: false
        });

        this.map.createPane('pane_dimajar2_batas');
        this.map.getPane('pane_dimajar2_batas').style.zIndex = 410;
        this.map.createPane('pane_lahan');
        this.map.getPane('pane_lahan').style.zIndex = 420;
        this.map.createPane('pane_area_rt');
        this.map.getPane('pane_area_rt').style.zIndex = 430;
        this.map.createPane('pane_sungai');
        this.map.getPane('pane_sungai').style.zIndex = 440;
        this.map.createPane('pane_bangunan');
        this.map.getPane('pane_bangunan').style.zIndex = 450;
        this.map.createPane('pane_jalan_lokal');
        this.map.getPane('pane_jalan_lokal').style.zIndex = 460;
        this.map.createPane('pane_sarana');
        this.map.getPane('pane_sarana').style.zIndex = 470;

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(this.map);
        
        this.setBasemap(this.currentBasemap);
        this.layerManager = new LayerManager(this.map);
    }

    initializeDraw() {
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);
        this.drawControl = new L.Control.Draw({
            edit: { featureGroup: this.drawnItems, remove: true },
            draw: {
                marker: true, circle: false, circlemarker: false, rectangle: true,
                polygon: { allowIntersection: false, shapeOptions: { color: '#ff6b6b' } },
                polyline: { shapeOptions: { color: '#4ecdc4' } }
            }
        });
        this.map.addControl(this.drawControl);

        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            const layerType = e.layerType;
            let defaultPromptName = `Fitur ${this.customFeatureCounter}`;
            const featureName = prompt("Masukkan Nama Fitur:", defaultPromptName);
            if (!featureName) return;
            layer.bindPopup(featureName);
            this.drawnItems.addLayer(layer);
            this._addCustomLayerUI(layer, layerType, featureName);
            this.customFeatureCounter++;
        });

        this.map.on(L.Draw.Event.DELETED, (e) => {
            e.layers.eachLayer(layer => {
                const layerId = L.Util.stamp(layer);
                const uiElement = document.getElementById(`ui-item-${layerId}`);
                if (uiElement) uiElement.remove();
                if (this.drawnLayers[layerId]) delete this.drawnLayers[layerId];
            });
        });
    }

    _addCustomLayerUI(layer, type, customName) {
        const layerId = L.Util.stamp(layer);
        this.drawnLayers[layerId] = layer;
        const defaultColor = type === 'polyline' ? '#4ecdc4' : (type === 'marker' ? '#feca57' : '#ff6b6b');
        const container = document.getElementById('custom-layers-container');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'control-group-inner custom-feature-item';
        itemDiv.id = `ui-item-${layerId}`;
        itemDiv.innerHTML = `...`; // konten HTML seperti sebelumnya
        container.appendChild(itemDiv);
        // ... (event listener untuk custom layer) ...
    }

    populateLahanControls() {
        const container = document.getElementById('style-controls-lahan');
        if (!container) return;
        let content = `<div class="control-row"><label>Opacity</label><input type="range" id="opacity-lahan" min="0" max="1" step="0.1" value="${mapConfig.layerStyles.lahan.fillOpacity || 1}"></div><hr class="style-hr"><div class="control-row-cat-header"><label>Warna Kategori:</label></div>`;
        for (const [keterangan, color] of Object.entries(mapConfig.lahanColorMap)) {
            content += `<div class="control-row-cat"><label>${keterangan}</label><input type="color" class="lahan-color-picker" data-keterangan="${keterangan}" value="${color}"></div>`;
        }
        container.innerHTML = content;
    }

    initializeControls() {
        document.getElementById('basemapSelect').addEventListener('change', (e) => this.setBasemap(e.target.value));
        this.populateLahanControls();

        Object.keys(mapConfig.dataSources).forEach(layerName => {
            document.getElementById(layerName)?.addEventListener('change', (e) => this.layerManager.toggleLayer(layerName, e.target.checked));
        });

        document.querySelectorAll('.style-toggle-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const controls = document.getElementById(targetId);
                if (controls) {
                    controls.style.display = controls.style.display === 'block' || controls.style.display === '' ? 'none' : 'block';
                }
            });
        });

        // Pengaturan layer Lahan
        document.getElementById('opacity-lahan')?.addEventListener('input', (e) => this.layerManager.updateLayerStyle('lahan', { fillOpacity: parseFloat(e.target.value) }));
        document.querySelectorAll('.lahan-color-picker').forEach(picker => picker.addEventListener('input', (e) => this.layerManager.updateLahanCategoryColor(e.target.dataset.keterangan, e.target.value)));
        
        // Pengaturan Jalan Lokal
        document.getElementById('color-jalan_lokal')?.addEventListener('input', (e) => {
             this.layerManager.updateLayerStyle('jalan_lokal', { color: e.target.value });
             document.getElementById('legend-jalan_lokal').style.backgroundColor = e.target.value;
        });
        document.getElementById('opacity-jalan_lokal')?.addEventListener('input', (e) => {
             this.layerManager.updateLayerStyle('jalan_lokal', { opacity: parseFloat(e.target.value) });
        });

        // Pengaturan opacity untuk semua Sarana
        ['pendidikan', 'perdaganganjasa', 'peribadatan', 'industri_pergudangan'].forEach(layerName => {
            document.getElementById(`opacity-${layerName}`)?.addEventListener('input', (e) => {
                this.layerManager.updateLayerStyle(layerName, { opacity: parseFloat(e.target.value) });
            });
        });

        // Pengaturan untuk Sungai & Bangunan
         ['sungai', 'bangunan'].forEach(layerName => {
            document.getElementById(`color-${layerName}`)?.addEventListener('input', (e) => {
                this.layerManager.updateLayerStyle(layerName, { fillColor: e.target.value });
                document.getElementById(`legend-${layerName}`).style.backgroundColor = e.target.value;
            });
            document.getElementById(`opacity-${layerName}`)?.addEventListener('input', (e) => {
                this.layerManager.updateLayerStyle(layerName, { fillOpacity: parseFloat(e.target.value) });
            });
        });

        // Pengaturan untuk Batas RT
        document.getElementById('opacity-area_rt')?.addEventListener('input', (e) => {
             this.layerManager.updateLayerStyle('area_rt', { fillOpacity: parseFloat(e.target.value) });
        });

        // Pengaturan untuk Batas Dusun
        document.getElementById('batasFillToggle')?.addEventListener('change', (e) => this.layerManager.toggleBatasFill(e.target.checked));
        document.getElementById('color-dimajar2_batas')?.addEventListener('input', (e) => {
            this.layerManager.updateLayerStyle('dimajar2_batas', { color: e.target.value }); // Layer manager akan urus outline+fill
             document.getElementById('legend-dimajar2_batas').style.borderColor = e.target.value;
        });


        document.getElementById('aboutBtn').addEventListener('click', () => this.showAboutModal());
        document.getElementById('homeBtn').addEventListener('click', () => this.layerManager.zoomToExtent());
    }

    setBasemap(basemapType) {
        this.map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) this.map.removeLayer(layer);
        });
        const basemapConfig = mapConfig.basemaps[basemapType];
        if (basemapConfig) {
            L.tileLayer(basemapConfig.url, {
                attribution: basemapConfig.attribution,
                maxZoom: basemapConfig.maxZoom || 19
            }).addTo(this.map);
            this.currentBasemap = basemapType;
        }
    }

    async loadLayers() {
        await this.layerManager.loadAllLayers();

        if (this.layerToZoom) {
            setTimeout(() => this.layerManager.zoomToLayer(this.layerToZoom), 200);
        } else {
            setTimeout(() => this.layerManager.zoomToExtent(), 200);
        }
    }

    showAboutModal() {
        const modal = document.getElementById('aboutModal');
        modal.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new StoryMapApp();
});