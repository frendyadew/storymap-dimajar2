// Popup Handler popup-handler.js
class PopupHandler {
    constructor() {
        this.fieldMappings = {
            bangunan: ['Fungsi_Ban', 'Nama_Pemil', 'Kepemilika', 'Jumlah_Pen', 'Mata_Penca', 'Jenis_Mate', 'Kelayakan'],
            jalan_lokal: ['Nama', 'KETERANGAN', 'SHAPE_Length'],
            pendidikan: ['KETERANGAN'],
            perdaganganjasa: ['KETERANGAN'],
            peribadatan: ['KETERANGAN'],
            industri_pergudangan: ['KETERANGAN'],
            sungai: ['KETERANGAN'],
            area_rt: ['RT_RW'],
            lahan: ['KETERANGAN', 'SHAPE_Area']
        };
        
        this.fieldLabels = {
            'KETERANGAN': 'Keterangan',
            'RT_RW': 'Kawasan',
            'SHAPE_Length': 'Panjang (m)',
            'SHAPE_Area': 'Luas (m²)',
            'Fungsi_Ban': 'Fungsi Bangunan',
            'Nama_Pemil': 'Nama Pemilik',
            'Kepemilika': 'Kepemilikan',
            'Jumlah_Pen': 'Jumlah Penghuni',
            'Mata_Penca': 'Mata Pencaharian',
            'Jenis_Mate': 'Material',
            'Kelayakan': 'Kelayakan Hunian',
            'Nama': 'Nama Jalan'
        };
    }
    
    createPopupContent(feature, layerName) {
        if (!feature.properties) {
            return '<div class="popup-content">No data available</div>';
        }
        const props = feature.properties;
        const geomType = feature.geometry.type;

        const layerType = layerName;

        let content = `<div class="popup-header">${this.getLayerDisplayName(layerType)}</div>`;
        content += '<div class="popup-content">';
        const fields = this.fieldMappings[layerType] || Object.keys(props);

        fields.forEach(field => {
            if (props[field] !== undefined && props[field] !== null && props[field] !== '' && props[field] !== ' ') {
                const label = this.fieldLabels[field] || field;
                let value = props[field];
                if (typeof value === 'number' && (field.includes('SHAPE_') || field.includes('Luas') || field.includes('Panjang'))) {
                    value = this.formatNumber(value);
                }
                content += `
                    <div style="margin: 5px 0;">
                        <span class="popup-label">${label}:</span> ${value}
                    </div>
                `;
            }
        });
        
        content += '</div>';
        
        return content;
    }
    
    getLayerDisplayName(layerType) {
        const displayNames = {
            bangunan: 'Informasi Bangunan',
            jalan_lokal: 'Informasi Jalan',
            pendidikan: 'Fasilitas Pendidikan',
            perdaganganjasa: 'Perdagangan & Jasa',
            peribadatan: 'Tempat Peribadatan',
            industri_pergudangan: 'Industri & Pergudangan',
            sungai: 'Sungai',
            area_rt: 'Batas RT',
            lahan: 'Informasi Lahan'
        };
        
        return displayNames[layerType] || 'Informasi Fitur';
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
}

// Initialize popup handler
const popupHandler = new PopupHandler();