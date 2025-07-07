// Main Application "main.js"
class StoryMapApp {
    constructor() {
        this.map = null;
        this.layerManager = null;
        this.measureTool = null;
        this.currentBasemap = 'osm';
        this.drawnItems = new L.FeatureGroup();

        this.initializeMap();
        this.initializeControls();
        this.initializeDrawing();
        this.initializeModals();
        this.loadLayers();
        this.loadCustomFeatures();
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
        this.measureTool = new MeasureTool(this.map);
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

        document.getElementById('measureBtn').addEventListener('click', () => {
            this.measureTool.toggle();
        });

        document.getElementById('homeBtn').addEventListener('click', () => {
            this.layerManager.zoomToExtent();
        });

        // Add clear measurements button (right-click on measure button)
        document.getElementById('measureBtn').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.measureTool.clearAll();
        });

        // Toggle fill warna batas
        const batasFillToggle = document.getElementById('batasFillToggle');
        if (batasFillToggle) {
            batasFillToggle.addEventListener('change', (e) => {
                const fillOn = e.target.checked;
                const style = mapConfig.layerStyles.dimajar2_batas;
                style.fillOpacity = fillOn ? 0.3 : 0;
                // Update style on map
                const layer = this.layerManager.layers['dimajar2_batas'];
                if (layer) layer.setStyle({ fillOpacity: style.fillOpacity });
            });
        }

        // Layer toggle for batas
        const batasCheckbox = document.getElementById('dimajar2_batas');
        if (batasCheckbox) {
            batasCheckbox.addEventListener('change', (e) => {
                this.layerManager.toggleLayer('dimajar2_batas', e.target.checked);
            });
        }

        // Tambahkan event listener untuk layer kustom
        document.getElementById('custom_feature').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.map.addLayer(this.drawnItems);
            } else {
                this.map.removeLayer(this.drawnItems);
            }
        });

        document.getElementById('saveCustomFeatures').addEventListener('click', () => {
            this.saveFeatures();
        });

    }

    // TAMBAHKAN FUNGSI BARU INI
    initializeDrawing() {
        this.map.addLayer(this.drawnItems); // Tambahkan layer gambar ke peta

        const drawControl = new L.Control.Draw({
            edit: {
                featureGroup: this.drawnItems, // Izinkan edit pada layer yang sudah digambar
            },
            draw: {
                polygon: true,
                polyline: true,
                rectangle: false,
                circle: false,
                marker: true,
                circlemarker: false
            }
        });
        this.map.addControl(drawControl);

        // Event ketika sebuah fitur selesai digambar
        this.map.on(L.Draw.Event.CREATED, (e) => {
            const layer = e.layer;
            // Tambahkan properti default, bisa dikembangkan dengan modal/form
            layer.feature = layer.feature || {};
            layer.feature.properties = layer.feature.properties || {};
            layer.feature.properties.keterangan = "Fitur baru";

            this.drawnItems.addLayer(layer);
        });
    }

    // TAMBAHKAN FUNGSI BARU INI
    async loadCustomFeatures() {
        try {
            // Panggil API GET dari backend Anda
            const response = await fetch('/api/get-features');
            const geojsonData = await response.json();

            L.geoJSON(geojsonData, {
                onEachFeature: (feature, layer) => {
                    // Beri popup sederhana
                    if (feature.properties && feature.properties.keterangan) {
                        layer.bindPopup(feature.properties.keterangan);
                    }
                    this.drawnItems.addLayer(layer);
                }
            });
        } catch (error) {
            console.error('Gagal memuat fitur kustom:', error);
        }
    }

    // TAMBAHKAN FUNGSI BARU INI
    async saveFeatures() {
        const geojsonToSave = this.drawnItems.toGeoJSON();

        // Cek jika tidak ada fitur untuk disimpan
        if (geojsonToSave.features.length === 0) {
            alert("Tidak ada fitur baru untuk disimpan.");
            return;
        }

        try {
            // Panggil API POST dari backend Anda
            const response = await fetch('/api/save-features', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(geojsonToSave),
            });

            if (response.ok) {
                alert('Fitur berhasil disimpan!');
            } else {
                throw new Error('Gagal menyimpan fitur.');
            }
        } catch (error) {
            console.error('Error saat menyimpan:', error);
            alert('Terjadi kesalahan saat menyimpan fitur.');
        }
    }

    initializeModals() {
        const modal = document.getElementById('aboutModal');
        const closeBtn = document.querySelector('.close');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
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

    addCustomControls() {
        // Add attribution control
        const attributionText = 'Data: Survey Lapangan | Visualisasi: Story Map';
        L.control.attribution({
            position: 'bottomright',
            prefix: attributionText
        }).addTo(this.map);

        // Add custom control for layer statistics
        const LayerStatsControl = L.Control.extend({
            onAdd: function (map) {
                const div = L.DomUtil.create('div', 'layer-stats-control');
                div.style.cssText = `
                    background: rgba(255, 255, 255, 0.9);
                    padding: 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    line-height: 1.4;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                `;

                this.update = function () {
                    let html = '<strong>Layer Statistics:</strong><br>';
                    Object.keys(mapConfig.dataSources).forEach(layerName => {
                        const count = app.layerManager.getLayerFeatureCount(layerName);
                        if (count > 0) {
                            html += `${layerName}: ${count}<br>`;
                        }
                    });
                    div.innerHTML = html;
                };

                return div;
            }
        });

        this.statsControl = new LayerStatsControl({ position: 'topleft' });
        this.statsControl.addTo(this.map);
    }

    handleResize() {
        // Handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        });
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + M for measure tool
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.measureTool.toggle();
            }

            // Ctrl/Cmd + H for home extent
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.layerManager.zoomToExtent();
            }

            // Ctrl/Cmd + I for about info
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.showAboutModal();
            }
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StoryMapApp();

    // Add additional features
    app.handleResize();
    app.addKeyboardShortcuts();

    // Add stats control after layers are loaded
    setTimeout(() => {
        app.addCustomControls();
        if (app.statsControl && app.statsControl.update) {
            app.statsControl.update();
        }
    }, 2000);
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);

    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 2000;
        max-width: 300px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    errorDiv.innerHTML = `
        <strong>Error:</strong> Something went wrong. Please check the console for details.
        <div style="margin-top: 10px;">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                Close
            </button>
        </div>
    `;

    document.body.appendChild(errorDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.parentElement.removeChild(errorDiv);
        }
    }, 10000);
});