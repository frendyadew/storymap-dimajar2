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

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);
        L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(this.map);
        this.setBasemap(this.currentBasemap);
        this.layerManager = new LayerManager(this.map);
    }

    initializeDraw() {
        this.drawnItems = new L.FeatureGroup();
        this.map.addLayer(this.drawnItems);

        this.drawControl = new L.Control.Draw({
            edit: {
                featureGroup: this.drawnItems,
                remove: true
            },
            draw: {
                marker: true,
                circle: false,
                circlemarker: false,
                rectangle: true,
                polygon: {
                    allowIntersection: false,
                    shapeOptions: { color: '#ff6b6b' }
                },
                polyline: {
                    shapeOptions: { color: '#4ecdc4' }
                }
            }
        });
        this.map.addControl(this.drawControl);

        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            const layerType = e.layerType;
            let defaultPromptName = `Fitur ${this.customFeatureCounter}`;
            
            const featureName = prompt("Masukkan Nama Fitur:", defaultPromptName);
            if (!featureName) {
                return;
            }
            
            layer.bindPopup(featureName);
            this.drawnItems.addLayer(layer);
            this._addCustomLayerUI(layer, layerType, featureName);
            this.customFeatureCounter++;
        });
        
        this.map.on(L.Draw.Event.DELETED, (e) => {
            e.layers.eachLayer(layer => {
                const layerId = L.Util.stamp(layer);
                const uiElement = document.getElementById(`ui-item-${layerId}`);
                if (uiElement) {
                    uiElement.remove();
                }
                if (this.drawnLayers[layerId]) {
                    delete this.drawnLayers[layerId];
                }
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
        
        itemDiv.innerHTML = `
            <div class="layer-item">
                <input type="checkbox" id="custom-${layerId}" checked>
                <label for="custom-${layerId}">${customName}</label>
                <div class="layer-legend" style="background-color: ${defaultColor};"></div>
                <button class="style-toggle-btn" data-target="style-controls-custom-${layerId}"><i class="fas fa-palette"></i></button>
            </div>
            <div class="style-controls" id="style-controls-custom-${layerId}" style="display: none;">
                <div class="control-row"><label>Warna</label><input type="color" value="${defaultColor}"></div>
                <div class="control-row"><label>Opacity</label><input type="range" min="0" max="1" step="0.1" value="0.8"></div>
            </div>
        `;
        container.appendChild(itemDiv);

        itemDiv.querySelector(`#custom-${layerId}`).addEventListener('change', (e) => {
            if (e.target.checked) this.drawnItems.addLayer(this.drawnLayers[layerId]);
            else this.drawnItems.removeLayer(this.drawnLayers[layerId]);
        });

        itemDiv.querySelector('.style-toggle-btn').addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const styleControls = document.getElementById(targetId);
            styleControls.style.display = styleControls.style.display === 'none' ? 'block' : 'none';
        });

        itemDiv.querySelector('input[type="color"]').addEventListener('input', (e) => {
            const styleProp = (type === 'polyline') ? 'color' : 'fillColor';
            this.drawnLayers[layerId].setStyle({ [styleProp]: e.target.value });
            itemDiv.querySelector('.layer-legend').style.backgroundColor = e.target.value;
        });
        
        itemDiv.querySelector('input[type="range"]').addEventListener('input', (e) => {
            const styleProp = (type === 'polyline') ? 'opacity' : 'fillOpacity';
            this.drawnLayers[layerId].setStyle({ [styleProp]: parseFloat(e.target.value) });
        });
    }


    initializeControls() {
        const basemapSelect = document.getElementById('basemapSelect');
        basemapSelect.value = this.currentBasemap;
        basemapSelect.addEventListener('change', (e) => this.setBasemap(e.target.value));

        Object.keys(mapConfig.dataSources).forEach(layerName => {
            const checkbox = document.getElementById(layerName);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => this.layerManager.toggleLayer(layerName, e.target.checked));
            }
        });

        document.querySelectorAll('.style-toggle-btn').forEach(button => {
             button.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                const controls = document.getElementById(targetId);
                if (controls) {
                    controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
                }
            });
        });

        Object.keys(mapConfig.layerStyles).forEach(layerName => {
            if (layerName === 'lahan') {
                 document.getElementById(`opacity-lahan`)?.addEventListener('input', (e) => this.layerManager.updateLayerStyle('lahan', { fillOpacity: parseFloat(e.target.value) }));
                 document.querySelectorAll('.lahan-color-picker').forEach(picker => picker.addEventListener('input', (e) => this.layerManager.updateLahanCategoryColor(e.target.dataset.keterangan, e.target.value)));
            } else {
                const colorInput = document.getElementById(`color-${layerName}`);
                const opacityInput = document.getElementById(`opacity-${layerName}`);
                const legend = document.getElementById(`legend-${layerName}`);

                if (colorInput) {
                    colorInput.addEventListener('input', (e) => {
                        const newColor = e.target.value;
                        const isLine = layerName.includes('jalan') || layerName.includes('batas');
                        const isAreaRT = layerName === 'area_rt';
                        let styleProp = isLine ? 'color' : 'fillColor';
                        if (isAreaRT) styleProp = 'fillColor';

                        this.layerManager.updateLayerStyle(layerName, { [styleProp]: newColor });
                        
                        if(layerName === 'area_rt') { // Also update border for area_rt
                             this.layerManager.updateLayerStyle(layerName, { color: newColor });
                        }

                        if (legend) {
                            if (layerName === 'dimajar2_batas') legend.style.borderColor = newColor;
                            else legend.style.backgroundColor = newColor;
                        }
                    });
                }
                if (opacityInput) {
                    opacityInput.addEventListener('input', (e) => {
                        const newOpacity = parseFloat(e.target.value);
                        const isLine = layerName.includes('jalan') || layerName.includes('batas');
                        let styleProp = isLine ? 'opacity' : 'fillOpacity';
                        this.layerManager.updateLayerStyle(layerName, { [styleProp]: newOpacity });
                    });
                }
            }
        });

        document.getElementById('batasFillToggle')?.addEventListener('change', (e) => this.layerManager.toggleBatasFill(e.target.checked));
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAboutModal());
        document.getElementById('homeBtn').addEventListener('click', () => this.layerManager.zoomToExtent());
    }

    setBasemap(basemapType) {
        this.map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                this.map.removeLayer(layer);
            }
        });
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