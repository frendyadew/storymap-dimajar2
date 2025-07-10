// Layer Manager layer-manager.js
class LayerManager {
    constructor(map) {
        this.map = map;
        this.layers = {};
        this.layerGroups = {};
        this.bounds = null;
        this.popupLockedByClick = false; // <-- Tambahkan flag global
        this.initializeLayerGroups();
    }

    initializeLayerGroups() {
        // Create layer groups for different types
        Object.keys(mapConfig.dataSources).forEach(layerName => {
            this.layerGroups[layerName] = L.layerGroup(); // Jangan .addTo(this.map)
        });
    }

    async loadLayer(layerName) {
        try {
            const response = await fetch(mapConfig.dataSources[layerName]);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const geojsonData = await response.json();

            // Khusus layer batas, tampilkan saja tanpa event apapun
            if (layerName === 'dimajar2_batas') {
                this.layerGroups[layerName].clearLayers();

                const layer = L.geoJSON(geojsonData, {
                    style: {
                        color: '#f7b731',
                        weight: 3,
                        fillColor: '#fff700',
                        fillOpacity: 0
                    }
                    // Tidak ada onEachFeature!
                });

                this.layerGroups[layerName].addLayer(layer);
                this.layers[layerName] = layer;
                this.updateBounds(layer);
                return;
            }

            const isPointLayer = ['pendidikan', 'perdaganganjasa', 'peribadatan'].includes(layerName);

            const layer = L.geoJSON(geojsonData, {
                style: (feature) => !isPointLayer ? this.getLayerStyle(layerName, feature) : undefined,
                pointToLayer: isPointLayer
                    ? (feature, latlng) => {
                        const style = mapConfig.layerStyles[layerName];
                        return L.circleMarker(latlng, style);
                    }
                    : undefined,
                onEachFeature: (feature, layer) => {
                    // Hanya untuk layer yang perlu interaksi
                    if (layerName !== 'dimajar2_batas') {
                        layer.on('mouseover', (e) => {
                            if (this.popupLockedByClick) return;
                            // Popup kecil hanya KETERANGAN
                            const keterangan = feature.properties?.KETERANGAN || '-';
                            layer.bindPopup(`<div style="font-size:12px;padding:2px 8px;">${keterangan}</div>`, {
                                closeButton: false,
                                offset: [0, -8],
                                className: 'popup-hover'
                            }).openPopup();
                            if (layer.setStyle && feature.geometry.type !== 'Point') {
                                layer.setStyle({ weight: 5, color: '#ff7800' });
                            }
                        });

                        layer.on('mouseout', (e) => {
                            if (this.popupLockedByClick) return;
                            layer.closePopup();
                            // Agar popup hover tidak tertinggal
                            layer.unbindPopup();
                            if (layer.setStyle && feature.geometry.type !== 'Point') {
                                layer.setStyle({ weight: mapConfig.layerStyles[layerName]?.weight || 2, color: mapConfig.layerStyles[layerName]?.color });
                            }
                        });

                        // Klik popup (lengkap)
                        layer.on('click', (e) => {
                            this.popupLockedByClick = true;
                            // Bind popup lengkap
                            layer.bindPopup(popupHandler.createPopupContent(feature, layerName), {
                                closeButton: true,
                                className: 'popup-click'
                            }).openPopup();
                            if (layer.setStyle && feature.geometry.type !== 'Point') {
                                layer.setStyle({ weight: 5, color: '#ff7800' });
                            }
                        });

                        layer.on('popupclose', (e) => {
                            this.popupLockedByClick = false;
                            // Unbind agar hover popup bisa muncul lagi
                            layer.unbindPopup();
                            if (layer.setStyle && feature.geometry.type !== 'Point') {
                                layer.setStyle({ weight: mapConfig.layerStyles[layerName]?.weight || 2, color: mapConfig.layerStyles[layerName]?.color });
                            }
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
            this.showError(`Failed to load ${layerName} layer`);
            return null;
        }
    }

    getLayerStyle(layerName, feature) {
        if (layerName === 'lahan') {
            const keterangan = feature.properties?.KETERANGAN;
            // Ambil warna dari color map terpusat di map-config.js
            const fillColor = mapConfig.lahanColorMap[keterangan] || '#cccccc'; // Fallback color

            return {
                ...mapConfig.layerStyles.lahan, // Ambil style dasar (weight, opacity)
                fillColor: fillColor // Timpa dengan warna spesifik kategori
            };
        }
        const style = mapConfig.layerStyles[layerName] || {};
        return { ...style, className: `layer-${layerName}` };
    }

    createPointLayer(layerName, feature, latlng) {
        const style = mapConfig.layerStyles[layerName] || {};
        const marker = L.circleMarker(latlng, style);

        // Add hover effects (visual)
        marker.on('mouseover', (e) => {
            e.target.setStyle({
                fillOpacity: 1,
                radius: style.radius + 2
            });
            // Show popup on hover
            if (!this.popupLockedByClick) {
                e.target.openPopup();
            }
        });

        marker.on('mouseout', (e) => {
            e.target.setStyle({
                fillOpacity: style.fillOpacity,
                radius: style.radius
            });
            // Hanya tutup popup jika BUKAN sedang locked oleh klik
            if (!this.popupLockedByClick) {
                e.target.closePopup();
            }
        });

        // Tambahkan event click dan popupclose agar flag konsisten
        marker.on('click', (e) => {
            this.popupLockedByClick = true;
            marker.openPopup();
        });
        marker.on('popupclose', (e) => {
            this.popupLockedByClick = false;
        });

        return marker;
    }

    bindPopup(feature, layer, layerName) {
        layer.bindPopup(popupHandler.createPopupContent(feature, layerName));
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
            // Atur ulang urutan layer setiap selesai toggle
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
            // Urutan sesuai permintaan
            const layerOrder = [
                'pendidikan',
                'perdaganganjasa',
                'peribadatan',
                'jalan_lokal',
                'bangunan',
                'lahan',
                'dimajar2_batas'
            ];
            for (const layerName of layerOrder) {
                await this.loadLayer(layerName);
                const checkbox = document.getElementById(layerName);
                if (checkbox && checkbox.checked) {
                    this.layerGroups[layerName].addTo(this.map);
                }
            }
            // Atur urutan layer setelah semua di-add
            this.setLayerOrder();
            // Pastikan area kajian di bawah
            if (this.layerGroups['dimajar2_batas'] && this.map.hasLayer(this.layerGroups['dimajar2_batas'])) {
                this.layerGroups['dimajar2_batas'].bringToBack();
            }

            setTimeout(() => {
                this.zoomToExtent();
            }, 500);

        } catch (error) {
            console.error('Error loading layers:', error);
            this.showError('Failed to load some layers');
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="background: #ff6b6b; color: white; padding: 10px; border-radius: 5px; margin: 10px;">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </div>
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 5000);
    }

    getLayerFeatureCount(layerName) {
        if (this.layers[layerName]) {
            return this.layers[layerName].getLayers().length;
        }
        return 0;
    }

    setLayerOrder() {
        // Urutan dari atas ke bawah (paling atas di indeks 0, paling bawah di indeks terakhir)
        const order = [
            'pendidikan',
            'perdaganganjasa',
            'peribadatan',
            'jalan_lokal',
            'bangunan',
            'lahan',
            'dimajar2_batas'
        ];
        // Dari bawah ke atas, panggil bringToBack
        for (let i = order.length - 1; i >= 0; i--) {
            const name = order[i];
            const layer = this.layers[name];
            if (layer && this.map.hasLayer(this.layerGroups[name])) {
                layer.bringToFront();
            }
        }
    }
    // TAMBAHKAN FUNGSI BARU DI SINI
    toggleBatasFill(showFill) {
        const layerName = 'dimajar2_batas';
        if (this.layers[layerName]) {
            // Jika checkbox dicentang (showFill = true), atur opacity menjadi 0.4.
            // Jika tidak, kembalikan menjadi 0 (transparan).
            const newOpacity = showFill ? 0.4 : 0;
            this.layers[layerName].setStyle({
                fillOpacity: newOpacity
            });
        }
    }

    updateLayerStyle(layerName, styleOptions) {
        const layer = this.layers[layerName];
        if (!layer) return;

        // 1. Simpan perubahan ke object mapConfig agar persist
        Object.assign(mapConfig.layerStyles[layerName], styleOptions);

        // 2. Terapkan style baru ke layer di peta
        if (layer.setStyle) {
            layer.setStyle(styleOptions);
        }
    }

    updateLahanCategoryColor(keterangan, newColor) {
    if (mapConfig.lahanColorMap && mapConfig.lahanColorMap[keterangan] !== undefined) {
        // 1. Perbarui warna di dalam config terpusat
        mapConfig.lahanColorMap[keterangan] = newColor;

        // 2. Paksa layer 'lahan' untuk menggambar ulang stylenya
        if (this.layers['lahan']) {
            this.layers['lahan'].setStyle((feature) => this.getLayerStyle('lahan', feature));
        }
    }
}
}
