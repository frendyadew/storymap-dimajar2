// Layer Manager layer-manager.js
class LayerManager {
    constructor(map) {
        this.map = map;
        this.layers = {};
        this.layerGroups = {};
        this.bounds = null;
        this.popupLockedByClick = false;

        // =======================================================
        // BARU: Pemetaan dari nama layer ke nama pane
        // =======================================================
        this.paneMapping = {
            dimajar2_batas: 'pane_dimajar2_batas',
            lahan: 'pane_lahan',
            area_rt: 'pane_area_rt',
            sungai: 'pane_sungai',
            bangunan: 'pane_bangunan',
            jalan_lokal: 'pane_jalan_lokal',
            // Semua titik sarana dimasukkan ke satu pane agar selalu di atas poligon/garis
            pendidikan: 'pane_sarana',
            perdaganganjasa: 'pane_sarana',
            peribadatan: 'pane_sarana',
            industri_pergudangan: 'pane_sarana'
        };
        // =======================================================

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
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const geojsonData = await response.json();

            // DIUBAH: Tambahkan opsi 'pane' saat membuat layer GeoJSON
            const geoJsonOptions = {
                style: (feature) => this.getLayerStyle(layerName, feature),
                onEachFeature: (feature, layer) => {
                    if (layerName === 'dimajar2_batas') {
                        return;
                    }

                    layer.on('mouseover', (e) => {
                        if (this.popupLockedByClick) return;
                        let hoverContent = '';
                        if (layerName === 'jalan_lokal') {
                            const nama = feature.properties?.Nama || 'Jalan Tanpa Nama';
                            const ket = feature.properties?.KETERANGAN || 'Jalan Lokal';
                            hoverContent = `<b>${ket}</b><br>${nama}`;
                        } else if (layerName === 'bangunan') {
                            const fungsi = feature.properties?.Fungsi_Ban || 'Fungsi tidak diketahui';
                            const pemilik = feature.properties?.Nama_Pemil || 'Tidak ada data pemilik';
                            hoverContent = `<b>${fungsi}</b><br>Pemilik: ${pemilik}`;
                        } else {
                            hoverContent = feature.properties?.KETERANGAN || feature.properties?.Nama || feature.properties?.RT_RW || 'Info';
                        }
                        L.popup({ closeButton: false, offset: [0, -8], className: 'popup-hover' })
                            .setLatLng(e.latlng).setContent(`<div style="font-size:12px;padding:2px 8px;">${hoverContent}</div>`).openOn(this.map);
                        if (layer.setStyle && feature.geometry.type !== 'Point') {
                            layer.setStyle({ weight: 4, color: '#ff7800' });
                        }
                    });

                    layer.on('mouseout', (e) => {
                        if (this.popupLockedByClick) return;
                        this.map.closePopup();
                        if (layer.setStyle && feature.geometry.type !== 'Point') {
                            this.layers[layerName].resetStyle(layer);
                        }
                    });

                    layer.on('click', (e) => {
                        this.popupLockedByClick = true;
                        const clickContent = popupHandler.createPopupContent(feature, layerName);
                        const popup = L.popup({ closeButton: true, className: 'popup-click' })
                            .setLatLng(e.latlng).setContent(clickContent).openOn(this.map);
                        popup.on('remove', () => {
                            this.popupLockedByClick = false;
                            if (layer.setStyle && feature.geometry.type !== 'Point') {
                                this.layers[layerName].resetStyle(layer);
                            }
                        });
                        if (layer.setStyle && feature.geometry.type !== 'Point') {
                            layer.setStyle({ weight: 4, color: '#ff7800' });
                        }
                        L.DomEvent.stop(e);
                    });

                    if (layerName === 'jalan_lokal' && feature.properties && feature.properties.Nama) {
                        layer.bindTooltip(feature.properties.Nama, { permanent: true, direction: 'center', className: 'road-label' });
                    }
                },
                pointToLayer: (feature, latlng) => {
                    const isPointLayer = ['pendidikan', 'perdaganganjasa', 'peribadatan', 'industri_pergudangan'].includes(layerName);
                    if (isPointLayer) {
                        // Tambahkan opsi 'pane' juga untuk pointToLayer
                        const style = { ...mapConfig.layerStyles[layerName], pane: this.paneMapping[layerName] };
                        return L.circleMarker(latlng, style);
                    }
                },
                pane: this.paneMapping[layerName] // Menetapkan pane untuk poligon dan garis
            };

            const layer = L.geoJSON(geojsonData, geoJsonOptions);

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
            return {
                ...mapConfig.layerStyles.lahan,
                fillColor: mapConfig.lahanColorMap[keterangan] || '#cccccc'
            };
        }
        return mapConfig.layerStyles[layerName] || {};
    }

    updateBounds(layer) {
        if (this.bounds) this.bounds.extend(layer.getBounds());
        else this.bounds = layer.getBounds();
    }

    toggleLayer(layerName, visible) {
        if (!this.layerGroups[layerName]) return;
        if (visible) {
            if (!this.map.hasLayer(this.layerGroups[layerName])) {
                this.layerGroups[layerName].addTo(this.map);
            }
        } else {
            this.map.removeLayer(this.layerGroups[layerName]);
        }
        // DIHAPUS: Panggilan ke setLayerOrder dihapus karena tidak diperlukan lagi
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
            const layerNames = Object.keys(mapConfig.dataSources);
            for (const layerName of layerNames) {
                await this.loadLayer(layerName);
                const checkbox = document.getElementById(layerName);
                if (checkbox && checkbox.checked) {
                    this.layerGroups[layerName].addTo(this.map);
                }
            }
            // DIHAPUS: Panggilan ke setLayerOrder dihapus
            
            setTimeout(() => this.zoomToExtent(), 500);

        } catch (error) {
            console.error('Error loading layers:', error);
            this.showError('Gagal memuat beberapa layer');
        } finally {
            loadingElement.style.display = 'none';
        }
    }
    
    // DIHAPUS: Fungsi setLayerOrder dihapus seluruhnya karena sudah digantikan oleh sistem Panes
    // setLayerOrder() { ... }

    showError(message) {
        alert(message);
    }
    
    toggleBatasFill(showFill) {
        if (this.layers['dimajar2_batas']) {
            this.layers['dimajar2_batas'].setStyle({
                fillOpacity: showFill ? 0.4 : 0
            });
        }
    }

    updateLayerStyle(layerName, styleOptions) {
        const layer = this.layers[layerName];
        if (!layer) return;

        const finalStyle = { ...styleOptions };
        const isLine = layerName.includes('jalan');

        if (finalStyle.fillColor && !isLine) {
            finalStyle.color = darkenColor(finalStyle.fillColor, -40);
        }
        if (finalStyle.fillOpacity !== undefined) {
            finalStyle.opacity = finalStyle.fillOpacity;
        }

        Object.assign(mapConfig.layerStyles[layerName], finalStyle);
        if (layer.setStyle) {
            layer.setStyle(finalStyle);
        }
    }

    updateLahanCategoryColor(keterangan, newColor) {
        if (mapConfig.lahanColorMap?.[keterangan]) {
            mapConfig.lahanColorMap[keterangan] = newColor;
            if (this.layers['lahan']) {
                this.layers['lahan'].setStyle((feature) => this.getLayerStyle('lahan', feature));
            }
        }
    }
}