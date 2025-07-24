// Main Application "main.js"

function darkenColor(hex, percent) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = parseInt(r * (100 + percent) / 100);
    g = parseInt(g * (100 + percent) / 100);
    b = parseInt(b * (100 + percent) / 100);

    r = (r < 255) ? r : 255;
    g = (g < 255) ? g : 255;
    b = (b < 255) ? b : 255;

    const toHex = (c) => ('0' + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

class StoryMapApp {
    constructor() {
        this.map = null;
        this.layerManager = null;
        this.currentBasemap = 'google';
        this.drawnItems = null;
        this.drawControl = null;
        this.customFeatureCounter = 1;
        this.drawnLayers = {};

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
        let content = `<div class="control-row"><label>Opacity</label><input type="range" id="opacity-lahan" min="0" max="1" step="0.1" value="${mapConfig.layerStyles.lahan.fillOpacity || 1}"></div><hr style="margin: 10px 0;"><div class="control-row"><label style="font-weight: bold;">Warna Kategori:</label></div>`;
        for (const [keterangan, color] of Object.entries(mapConfig.lahanColorMap)) {
            content += `<div class="control-row"><label>${keterangan}</label><input type="color" class="lahan-color-picker" data-keterangan="${keterangan}" value="${color}"></div>`;
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
                if (controls) controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
            });
        });

        document.getElementById('opacity-lahan')?.addEventListener('input', (e) => this.layerManager.updateLayerStyle('lahan', { fillOpacity: parseFloat(e.target.value) }));
        document.querySelectorAll('.lahan-color-picker').forEach(picker => picker.addEventListener('input', (e) => this.layerManager.updateLahanCategoryColor(e.target.dataset.keterangan, e.target.value)));
        
        Object.keys(mapConfig.layerStyles).forEach(layerName => {
            if (layerName === 'lahan') return; // Skip 'lahan' karena sudah diurus di atas
            
            const colorInput = document.getElementById(`color-${layerName}`);
            const opacityInput = document.getElementById(`opacity-${layerName}`);
            const legend = document.getElementById(`legend-${layerName}`);

            if (colorInput) {
                colorInput.addEventListener('input', (e) => {
                    const newColor = e.target.value;
                    // DIUBAH: Logika isLine diperbaiki agar lebih akurat
                    const isLine = ['jalan_lokal', 'area_rt', 'dimajar2_batas'].includes(layerName);
                    const styleProp = isLine ? 'color' : 'fillColor';
                    this.layerManager.updateLayerStyle(layerName, { [styleProp]: newColor });

                    if (legend) {
                        if (layerName.includes('batas') || layerName === 'area_rt') legend.style.borderColor = newColor;
                        else legend.style.backgroundColor = newColor;
                    }
                });
            }
            if (opacityInput) {
                opacityInput.addEventListener('input', (e) => {
                    const newOpacity = parseFloat(e.target.value);
                    const isLine = layerName === 'jalan_lokal';
                    const styleProp = isLine ? 'opacity' : 'fillOpacity';
                    this.layerManager.updateLayerStyle(layerName, { [styleProp]: newOpacity });
                });
            }
        });

        document.getElementById('batasFillToggle')?.addEventListener('change', (e) => this.layerManager.toggleBatasFill(e.target.checked));
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
    }

    showAboutModal() {
        const modal = document.getElementById('aboutModal');
        modal.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new StoryMapApp();
});