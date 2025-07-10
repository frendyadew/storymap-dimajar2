// Main Application "main.js"
class StoryMapApp {
    constructor() {
        this.map = null;
        this.layerManager = null;
        this.currentBasemap = 'google';

        // Variabel baru untuk fitur custom yang digambar
        this.drawnItems = null;
        this.drawControl = null;
        this.customFeatureCounter = 1; // Penghitung untuk nama layer
        this.drawnLayers = {}; // Objek untuk menyimpan referensi layer yang digambar

        this.initializeMap();
        this.initializeControls();
        this.initializeDraw(); // Method baru untuk Leaflet Draw
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
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // Add scale control
        L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(this.map);

        // Set initial basemap
        this.setBasemap(this.currentBasemap);

        // Initialize managers
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

        // -- UPDATE: Logika prompt nama sekarang berlaku untuk semua jenis gambar --
        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            const layerType = e.layerType;
            let featureName = null;
            let defaultPromptName = '';

            // Tentukan nama default yang lebih baik berdasarkan tipe gambar
            switch (layerType) {
                case 'marker':
                    defaultPromptName = `Titik ${this.customFeatureCounter}`;
                    break;
                case 'polyline':
                    defaultPromptName = `Garis ${this.customFeatureCounter}`;
                    break;
                case 'polygon':
                case 'rectangle':
                    defaultPromptName = `Area ${this.customFeatureCounter}`;
                    break;
            }
            
            // Tampilkan prompt untuk semua jenis gambar
            featureName = prompt("Masukkan Nama Fitur:", defaultPromptName);
            if (!featureName) { // Jika pengguna menekan "Cancel" atau mengosongkan nama
                return; // Batalkan penambahan fitur
            }
            
            // Ikat nama ke popup
            layer.bindPopup(featureName);
            
            // Lanjutkan proses
            this.drawnItems.addLayer(layer);
            this._addCustomLayerUI(layer, layerType, featureName);
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
        
        const layerName = customName || `Custom Feature ${this.customFeatureCounter++}`;
        this.drawnLayers[layerId] = layer;

        const defaultColor = type === 'polyline' ? '#4ecdc4' : (type === 'marker' ? '#feca57' : '#ff6b6b');

        const container = document.getElementById('custom-layers-container');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'control-group-inner custom-feature-item';
        itemDiv.id = `ui-item-${layerId}`; 
        
        itemDiv.innerHTML = `
            <div class="layer-item">
                <input type="checkbox" id="custom-${layerId}" checked>
                <label for="custom-${layerId}">${layerName}</label>
                <div class="layer-legend" style="background-color: ${defaultColor};"></div>
                <button class="style-toggle-btn" data-target="style-controls-custom-${layerId}"><i class="fas fa-palette"></i></button>
            </div>
            <div class="style-controls" id="style-controls-custom-${layerId}" style="display: none;">
                <div class="control-row"><label>Warna</label><input type="color" value="${defaultColor}"></div>
                <div class="control-row"><label>Opacity</label><input type="range" min="0" max="1" step="0.1" value="0.8"></div>
            </div>
        `;
        container.appendChild(itemDiv);

        const checkbox = itemDiv.querySelector(`#custom-${layerId}`);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.drawnItems.addLayer(this.drawnLayers[layerId]);
            } else {
                this.drawnItems.removeLayer(this.drawnLayers[layerId]);
            }
        });

        const toggleBtn = itemDiv.querySelector('.style-toggle-btn');
        const styleControls = itemDiv.querySelector('.style-controls');
        toggleBtn.addEventListener('click', () => {
            styleControls.style.display = styleControls.style.display === 'none' ? 'block' : 'none';
        });

        const colorInput = itemDiv.querySelector('input[type="color"]');
        colorInput.addEventListener('input', (e) => {
            const styleProp = (type === 'polyline' || type === 'marker') ? 'color' : 'fillColor';
            if (type === 'marker') {
                // Untuk marker standar, warna diatur via L.Icon, bukan setStyle.
                // Kode ini hanya akan efektif jika Anda menggunakan L.CircleMarker.
            } else {
                 this.drawnLayers[layerId].setStyle({ [styleProp]: e.target.value });
            }
            itemDiv.querySelector('.layer-legend').style.backgroundColor = e.target.value;
        });
        
        const opacityInput = itemDiv.querySelector('input[type="range"]');
        opacityInput.addEventListener('input', (e) => {
            const styleProp = (type === 'polyline' || type === 'marker') ? 'opacity' : 'fillOpacity';
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

        Object.keys(mapConfig.dataSources).forEach(layerName => {
            const styleToggleBtn = document.querySelector(`[data-target="style-controls-${layerName}"]`);
            const styleControlsDiv = document.getElementById(`style-controls-${layerName}`);

            if (styleToggleBtn && styleControlsDiv) {
                styleToggleBtn.addEventListener('click', () => {
                    const isVisible = styleControlsDiv.style.display === 'block';
                    styleControlsDiv.style.display = isVisible ? 'none' : 'block';
                });
            }

            if (layerName === 'lahan') {
                const opacityInput = document.getElementById(`opacity-lahan`);
                if (opacityInput) {
                    opacityInput.addEventListener('input', (e) => {
                        this.layerManager.updateLayerStyle('lahan', { fillOpacity: parseFloat(e.target.value) });
                    });
                }
                const lahanColorPickers = document.querySelectorAll('.lahan-color-picker');
                lahanColorPickers.forEach(picker => {
                    picker.addEventListener('input', (e) => {
                        this.layerManager.updateLahanCategoryColor(e.target.dataset.keterangan, e.target.value);
                    });
                });
            } else {
                const colorInput = document.getElementById(`color-${layerName}`);
                const opacityInput = document.getElementById(`opacity-${layerName}`);
                const legend = document.getElementById(`legend-${layerName}`);
                if (colorInput) {
                    colorInput.addEventListener('input', (e) => {
                        const newColor = e.target.value;
                        const styleProp = (layerName === 'jalan_lokal' || layerName === 'dimajar2_batas') ? 'color' : 'fillColor';
                        this.layerManager.updateLayerStyle(layerName, { [styleProp]: newColor });
                        if (legend) {
                            if (layerName === 'dimajar2_batas') {
                                legend.style.borderColor = newColor;
                            } else {
                                legend.style.backgroundColor = newColor;
                            }
                        }
                    });
                }
                if (opacityInput) {
                    opacityInput.addEventListener('input', (e) => {
                        const newOpacity = parseFloat(e.target.value);
                        const styleProp = (layerName === 'jalan_lokal' || layerName === 'dimajar2_batas') ? 'opacity' : 'fillOpacity';
                        this.layerManager.updateLayerStyle(layerName, { [styleProp]: newOpacity });
                    });
                }
            }
        });

        const batasFillCheckbox = document.getElementById('batasFillToggle');
        if (batasFillCheckbox) {
            batasFillCheckbox.addEventListener('change', (e) => this.layerManager.toggleBatasFill(e.target.checked));
        }
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
        try {
            await this.layerManager.loadAllLayers();
            this.updateLayerInfo();
        } catch (error) {
            console.error('Error loading layers:', error);
        }
    }

    updateLayerInfo() {
        Object.keys(mapConfig.dataSources).forEach(layerName => {
            const count = this.layerManager.getLayerFeatureCount(layerName);
            const label = document.querySelector(`label[for="${layerName}"]`);
            if (label && count > 0) {
                const currentText = label.textContent.split(' (')[0];
                if (currentText) {
                    label.textContent = `${currentText} (${count})`;
                }
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