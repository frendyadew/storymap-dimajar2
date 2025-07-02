// Popup Handler
class PopupHandler {
    constructor() {
        this.fieldMappings = {
            bangunan: ['KETERANGAN', 'SHAPE_Length', 'SHAPE_Area'],
            jalan_lokal: ['KETERANGAN', 'SHAPE_Length'],
            pendidikan: ['KETERANGAN'],
            perdaganganjasa: ['KETERANGAN'],
            peribadatan: ['KETERANGAN']
        };
        
        this.fieldLabels = {
            'KETERANGAN': 'Keterangan',
            'SHAPE_Length': 'Panjang (m)',
            'SHAPE_Area': 'Luas (m²)'
        };
    }
    
    createPopupContent(feature, layerName) {
        if (!feature.properties) {
            return '<div class="popup-content">No data available</div>';
        }
        const props = feature.properties;
        const geomType = feature.geometry.type;

        // Gunakan layerName langsung
        const layerType = layerName || this.determineLayerType(feature);

        let content = `<div class="popup-header">${this.getLayerDisplayName(layerType)}</div>`;
        content += '<div class="popup-content">';
        const fields = this.fieldMappings[layerType] || Object.keys(props);

        fields.forEach(field => {
            if (props[field] !== undefined && props[field] !== null && props[field] !== '') {
                const label = this.fieldLabels[field] || field;
                let value = props[field];
                if (field === 'SHAPE_Length' || field === 'SHAPE_Area') {
                    value = this.formatNumber(value);
                }
                content += `
                    <div style="margin: 5px 0;">
                        <span class="popup-label">${label}:</span> ${value}
                    </div>
                `;
            }
        });
        
        // Add calculated geometry info
        if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
            const area = this.calculateArea(feature);
            if (area > 0) {
                content += `
                    <div style="margin: 5px 0; border-top: 1px solid #eee; padding-top: 5px;">
                        <span class="popup-label">Luas Terhitung:</span> ${this.formatArea(area)}
                    </div>
                `;
            }
        }
        
        if (geomType === 'LineString' || geomType === 'MultiLineString') {
            const length = this.calculateLength(feature);
            if (length > 0) {
                content += `
                    <div style="margin: 5px 0; border-top: 1px solid #eee; padding-top: 5px;">
                        <span class="popup-label">Panjang Terhitung:</span> ${this.formatLength(length)}
                    </div>
                `;
            }
        }
        
        content += '</div>';
        
        return content;
    }
    
    determineLayerType(feature) {
        // Fallback jika layerName tidak dikirim
        // Coba deteksi dari properties 'name' atau 'layer' jika ada
        const props = feature.properties || {};
        if (props.layer) return props.layer;
        if (props.name) return props.name;
        // Jika tidak ada, fallback ke 'pendidikan' (tidak masalah karena layerName biasanya dikirim)
        return 'pendidikan';
    }
    
    getLayerDisplayName(layerType) {
        const displayNames = {
            bangunan: 'Bangunan',
            jalan_lokal: 'Jalan Lokal',
            pendidikan: 'Fasilitas Pendidikan',
            perdaganganjasa: 'Perdagangan & Jasa',
            peribadatan: 'Tempat Peribadatan'
        };
        
        return displayNames[layerType] || 'Feature Info';
    }
    
    calculateArea(feature) {
        // Simple area calculation using Leaflet
        try {
            const coords = feature.geometry.coordinates;
            if (feature.geometry.type === 'Polygon') {
                return this.polygonArea(coords[0]);
            } else if (feature.geometry.type === 'MultiPolygon') {
                let totalArea = 0;
                coords.forEach(polygon => {
                    totalArea += this.polygonArea(polygon[0]);
                });
                return totalArea;
            }
            return 0;
        } catch (error) {
            console.error('Error calculating area:', error);
            return 0;
        }
    }

    calculateLength(feature) {
        // Calculate length for LineString features
        try {
            const coords = feature.geometry.coordinates;
            if (feature.geometry.type === 'LineString') {
                return this.lineStringLength(coords);
            } else if (feature.geometry.type === 'MultiLineString') {
                let totalLength = 0;
                coords.forEach(lineString => {
                    totalLength += this.lineStringLength(lineString);
                });
                return totalLength;
            }
            return 0;
        } catch (error) {
            console.error('Error calculating length:', error);
            return 0;
        }
    }
    
    lineStringLength(coords) {
        let length = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            length += this.distance(coords[i], coords[i + 1]);
        }
        return length;
    }
    
    distance(coord1, coord2) {
        // Haversine formula for distance calculation
        const R = 6371000; // Earth's radius in meters
        const lat1 = coord1[1] * Math.PI / 180;
        const lat2 = coord2[1] * Math.PI / 180;
        const deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180;
        const deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180;
        
        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    formatNumber(value) {
        if (typeof value !== 'number') {
            value = parseFloat(value);
        }
        return isNaN(value) ? 'N/A' : value.toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    formatArea(area) {
        if (area < 1) {
            return `${(area * 10000).toFixed(2)} cm²`;
        } else if (area < 10000) {
            return `${area.toFixed(2)} m²`;
        } else {
            return `${(area / 10000).toFixed(2)} ha`;
        }
    }
    
    formatLength(length) {
        if (length < 1000) {
            return `${length.toFixed(2)} m`;
        } else {
            return `${(length / 1000).toFixed(2)} km`;
        }
    }
    polygonArea(coords) {
        // Calculate area using shoelace formula (approximation)
        let area = 0;
        const n = coords.length;
        
        for (let i = 0; i < n - 1; i++) {
            const j = (i + 1) % n;
            area += coords[i][0] * coords[j][1];
            area -= coords[j][0] * coords[i][1];
        }
        
        area = Math.abs(area) / 2;
        
        // Convert to approximate square meters (rough approximation)
        // This is a very rough conversion - for accurate results, use proper projection
        const latToMeter = 111000; // approximate meters per degree latitude
        const lonToMeter = 111000 * Math.cos(coords[0][1] * Math.PI / 180);
        
        return area * latToMeter * lonToMeter;
    }
}

// Initialize popup handler
const popupHandler = new PopupHandler();