// Layer Manager layer-manager.js
class LayerManager {
    constructor(map) {
        this.map = map;
        this.layers = {};
        this.layerGroups = {};
        this.bounds = null;
        this.popupLockedByClick = false; 
        this.initializeLayerGroups();
    }

    initializeLayerGroups() {
        Object.keys(mapConfig.dataSources).forEach(layerName => {
            this.layerGroups[layerName] = L.layerGroup();
        });
    }

    async loadLayer(layerName) {
        try {
            const response = await fetch(mapConfig.dataSources[layerName]);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const geojsonData = await response.json();

            const isPointLayer = ['pendidikan', 'perdaganganjasa', 'peribadatan', 'industri_pergudangan'].includes(layerName);

            const layer = L.geoJSON(geojsonData, {
                style: (feature) => this.getLayerStyle(layerName, feature),
                pointToLayer: isPointLayer
                    ? (feature, latlng) => {
                        const style = mapConfig.layerStyles[layerName];
                        return L.circleMarker(latlng, style);
                    }
                    : undefined,
                onEachFeature: (feature, layer) => {
                    // Hover popup (simple)
                    layer.on('mouseover', (e) => {
                        if (this.popupLockedByClick) return;
                        const propToShow = layerName === 'area_rt' ? feature.properties?.RT_RW : feature.properties?.KETERANGAN || feature.properties?.Nama || '-';
                        layer.bindPopup(`<div style="font-size:12px;padding:2px 8px;">${propToShow}</div>`, {
                            closeButton: false,
                            offset: [0, -8],
                            className: 'popup-hover'
                        }).openPopup();
                        if (layer.setStyle && feature.geometry.type !== 'Point') {
                             layer.setStyle({ weight: 4, color: '#ff7800' });
                        }
                    });

                    // Mouseout event
                    layer.on('mouseout', (e) => {
                        if (this.popupLockedByClick) return;
                        layer.closePopup();
                        layer.unbindPopup();
                        if (layer.setStyle && feature.geometry.type !== 'Point') {
                             this.layers[layerName].resetStyle(layer);
                        }
                    });

                    // Click popup (detailed)
                    layer.on('click', (e) => {
                        this.popupLockedByClick = true;
                        layer.bindPopup(popupHandler.createPopupContent(feature, layerName), {
                            closeButton: true,
                            className: 'popup-click'
                        }).openPopup();
                         if (layer.setStyle && feature.geometry.type !== 'Point') {
                            layer.setStyle({ weight: 4, color: '#ff7800' });
                        }
                    });

                    // Popup close event
                    layer.on('popupclose', (e) => {
                        this.popupLockedByClick = false;
                        layer.unbindPopup();
                        if (layer.setStyle && feature.geometry.type !== 'Point') {
                            this.layers[layerName].resetStyle(layer);
                        }
                    });

                    // Add permanent labels for roads
                    if (layerName === 'jalan_lokal' && feature.properties && feature.properties.Nama) {
                        layer.bindTooltip(feature.properties.Nama, {
                            permanent: true,
                            direction: 'center',
                            className: 'road-label'
                        });
                    }
                }
            });

            this.layerGroups[layerName].clearLayers();
            this.layerGroups[layerName].addLayer(layer);
            this.layers[layerName] = layer;
            this.updateBounds(layer);
        } catch (error) {
            console.error(`Error loading layer ${layerName}:`, error);
            this.showError(`Gagal memuat layer ${layerName}`);
            return null;
        }
    }

    getLayerStyle(layerName, feature) {
        if (layerName === 'lahan') {
            const keterangan = feature.properties?.KETERANGAN;
            const fillColor = mapConfig.lahanColorMap[keterangan] || '#cccccc';
            return {
                ...mapConfig.layerStyles.lahan,
                fillColor: fillColor
            };
        }
        return mapConfig.layerStyles[layerName] || {};
    }

    updateBounds(layer) {
        if (this.bounds) {
            this.bounds.extend(layer.getBounds());
        } else {
            this.bounds = layer.getBounds();
        }
    }

    toggleLayer(layerName, visible) {
        if (this.layerGroups[layerName]) {
            if (visible) {
                if (!this.map.hasLayer(this.layerGroups[layerName])) {
                    this.layerGroups[layerName].addTo(this.map);
                }
            } else {
                this.map.removeLayer(this.layerGroups[layerName]);
            }
            this.setLayerOrder();
        }
    }

    zoomToExtent() {
        if (this.bounds && this.bounds.isValid()) {
            this.map.fitBounds(this.bounds, { padding: [20, 20] });
        }
    }

    async loadAllLayers() {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';

        try {
            const layerOrder = [
                'pendidikan', 'perdaganganjasa', 'peribadatan', 'industri_pergudangan',
                'jalan_lokal', 'sungai', 'bangunan', 'lahan', 
                'area_rt', 'dimajar2_batas'
            ];
            for (const layerName of layerOrder) {
                await this.loadLayer(layerName);
                const checkbox = document.getElementById(layerName);
                if (checkbox && checkbox.checked) {
                    this.layerGroups[layerName].addTo(this.map);
                }
            }
            this.setLayerOrder();

            setTimeout(() => {
                this.zoomToExtent();
            }, 500);

        } catch (error) {
            console.error('Error loading layers:', error);
            this.showError('Gagal memuat beberapa layer');
        } finally {
            loadingElement.style.display = 'none';
        }
    }
    
    setLayerOrder() {
        const order = [
             'pendidikan', 'perdaganganjasa', 'peribadatan', 'industri_pergudangan', // Points on top
             'jalan_lokal', // Lines
             'bangunan', // Small polygons
             'sungai', // Environmental polygons
             'lahan', // Base land use
             'area_rt', // Administrative areas
             'dimajar2_batas' // Main boundary at the bottom
        ];
        
        order.forEach((name, index) => {
            const layerGroup = this.layerGroups[name];
            if (layerGroup && this.map.hasLayer(layerGroup)) {
                // Leaflet's zIndex is complex. bringToFront/Back is more reliable.
                // We bring layers to the front starting from the one that should be at the bottom.
            }
        });

        // Set z-index by bringing layers to the front in reverse order of how they should appear
         for (let i = order.length - 1; i >= 0; i--) {
            const name = order[i];
            if (this.layerGroups[name] && this.map.hasLayer(this.layerGroups[name])) {
                this.layerGroups[name].bringToFront();
            }
        }
    }

    showError(message) {
        // Implementation for showing error messages
    }
    
    toggleBatasFill(showFill) {
        const layerName = 'dimajar2_batas';
        if (this.layers[layerName]) {
            const newOpacity = showFill ? 0.4 : 0;
            this.layers[layerName].setStyle({
                fillOpacity: newOpacity
            });
        }
    }

    updateLayerStyle(layerName, styleOptions) {
        const layer = this.layers[layerName];
        if (!layer) return;

        Object.assign(mapConfig.layerStyles[layerName], styleOptions);

        if (layer.setStyle) {
            layer.setStyle(styleOptions);
        }
    }

    updateLahanCategoryColor(keterangan, newColor) {
        if (mapConfig.lahanColorMap && mapConfig.lahanColorMap[keterangan] !== undefined) {
            mapConfig.lahanColorMap[keterangan] = newColor;
            if (this.layers['lahan']) {
                this.layers['lahan'].setStyle((feature) => this.getLayerStyle('lahan', feature));
            }
        }
    }
}