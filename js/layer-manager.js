// BARU: Fungsi untuk menggelapkan warna (dipindahkan dari main.js untuk digunakan di sini)
function darkenColor(hex, percent) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = parseInt(r * (100 + percent) / 100);
    g = parseInt(g * (100 + percent) / 100);
    b = parseInt(b * (100 + percent) / 100);

    r = (r < 255) ? r : 255; r = (r < 0) ? 0 : r;
    g = (g < 255) ? g : 255; g = (g < 0) ? 0 : g;
    b = (b < 255) ? b : 255; b = (b < 0) ? 0 : b;

    const toHex = (c) => ('0' + c.toString(16)).slice(-2);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


// Layer Manager layer-manager.js
class LayerManager {
    constructor(map) {
        this.map = map;
        this.layers = {};
        this.layerGroups = {};
        this.bounds = null;
        this.popupLockedByClick = false;

        this.facilityIcons = {
            pendidikan: L.icon({
                iconUrl: 'legends/sekolah.png',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15]
            }),
            perdaganganjasa: L.icon({
                iconUrl: 'legends/pasar.png',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15]
            }),
            peribadatan: L.icon({
                iconUrl: 'legends/masjid.png',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15]
            }),
            industri_pergudangan: L.icon({
                iconUrl: 'legends/pabrik.png',
                iconSize: [30, 30],
                iconAnchor: [15, 15],
                popupAnchor: [0, -15]
            })
        };

        this.paneMapping = {
            dimajar2_batas: 'pane_dimajar2_batas',
            lahan: 'pane_lahan',
            area_rt: 'pane_area_rt',
            sungai: 'pane_sungai',
            bangunan: 'pane_bangunan',
            jalan_lokal: 'pane_jalan_lokal',
            pendidikan: 'pane_sarana',
            perdaganganjasa: 'pane_sarana',
            peribadatan: 'pane_sarana',
            industri_pergudangan: 'pane_sarana'
        };

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

            const geoJsonOptions = {
                style: (feature) => this.getLayerStyle(layerName, feature),
                onEachFeature: (feature, layer) => {

                    layer.on('mouseover', (e) => {
                        if (this.popupLockedByClick) return;
                        let hoverContent = '';

                        if (layerName === 'dimajar2_batas') {
                            hoverContent = `<b>RW 15</b>`;
                        } else if (layerName === 'jalan_lokal') {
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
                        return L.marker(latlng, {
                            icon: this.facilityIcons[layerName],
                            pane: this.paneMapping[layerName]
                        });
                    }
                },
                pane: this.paneMapping[layerName]
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
        if (layerName === 'area_rt') {
            // DIUBAH: Mengambil data dari field 'RT_RW' dan mengekstrak nomornya
            const rt_rw_string = feature.properties?.RT_RW; // Hasilnya "RT 1" atau "RT 2"
            let rt_number = null;

            if (rt_rw_string) {
                // Menghapus "RT " dari teks untuk mendapatkan nomornya saja ("1" atau "2")
                rt_number = rt_rw_string.replace('RT ', '');
            }

            // Mencari warna di rtColorMap menggunakan nomor yang sudah diekstrak
            const color = mapConfig.rtColorMap[rt_number] || '#cccccc'; // Gunakan warna abu-abu jika tidak ditemukan

            return {
                ...mapConfig.layerStyles.area_rt,
                color: color,
                fillColor: color
            };
        }
        // DIUBAH: Logika untuk membuat warna outline dinamis untuk lahan
        if (layerName === 'lahan') {
            const keterangan = feature.properties?.KETERANGAN;
            const fillColor = mapConfig.lahanColorMap[keterangan] || '#cccccc';
            const outlineColor = darkenColor(fillColor, -30); // Buat warna outline lebih gelap 30%

            return {
                ...mapConfig.layerStyles.lahan,
                fillColor: fillColor,
                color: outlineColor // Terapkan warna outline dinamis
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
    }

    zoomToLayer(layerName) {
        if (this.layers[layerName]) {
            const bounds = this.layers[layerName].getBounds();
            if (bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [50, 50] });
            }
        } else {
            console.warn(`Layer "${layerName}" not found for zooming.`);
            this.zoomToExtent();
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
            const layerNames = Object.keys(mapConfig.dataSources);
            for (const layerName of layerNames) {
                await this.loadLayer(layerName);
                const checkbox = document.getElementById(layerName);
                if (checkbox && checkbox.checked) {
                    this.layerGroups[layerName].addTo(this.map);
                }
            }
        } catch (error) {
            console.error('Error loading layers:', error);
            this.showError('Gagal memuat beberapa layer');
        } finally {
            loadingElement.style.display = 'none';
        }
    }

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
        } else if (layer.eachLayer) {
            layer.eachLayer(subLayer => {
                if (subLayer.setStyle) {
                    subLayer.setStyle(finalStyle);
                }
            });
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