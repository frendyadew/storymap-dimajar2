// Measure Tool measure-tool.js
class MeasureTool {
    constructor(map) {
        this.map = map;
        this.isActive = false;
        this.measureLayer = L.layerGroup().addTo(map);
        this.currentPolyline = null;
        this.markers = [];
        this.coordinates = [];
        this.totalDistance = 0;
        
        this.initializeStyles();
    }
    
    initializeStyles() {
        this.lineStyle = {
            color: '#ff0000',
            weight: 3,
            opacity: 0.8,
            dashArray: '5, 10'
        };
        
        this.markerStyle = {
            radius: 6,
            fillColor: '#ff0000',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        };
    }
    
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
    
    activate() {
        this.isActive = true;
        this.map.getContainer().style.cursor = 'crosshair';
        
        // Add click event listener
        this.map.on('click', this.onMapClick, this);
        this.map.on('dblclick', this.onMapDoubleClick, this);
        
        // Show instruction tooltip
        this.showInstruction('Click to start measuring, double-click to finish');
        
        // Update button state
        const measureBtn = document.getElementById('measureBtn');
        measureBtn.style.background = '#ff6b6b';
        measureBtn.style.color = 'white';
        measureBtn.title = 'Stop Measuring';
    }
    
    deactivate() {
        this.isActive = false;
        this.map.getContainer().style.cursor = '';
        
        // Remove event listeners
        this.map.off('click', this.onMapClick, this);
        this.map.off('dblclick', this.onMapDoubleClick, this);
        
        // Update button state
        const measureBtn = document.getElementById('measureBtn');
        measureBtn.style.background = '';
        measureBtn.style.color = '';
        measureBtn.title = 'Measure';
        
        this.hideInstruction();
    }
    
    onMapClick(e) {
        if (!this.isActive) return;
        
        const latlng = e.latlng;
        this.coordinates.push(latlng);
        
        // Add marker
        const marker = L.circleMarker(latlng, this.markerStyle);
        this.markers.push(marker);
        this.measureLayer.addLayer(marker);
        
        if (this.coordinates.length === 1) {
            // First point
            marker.bindPopup('Start point').openPopup();
        } else {
            // Calculate distance from previous point
            const prevCoord = this.coordinates[this.coordinates.length - 2];
            const distance = this.calculateDistance(prevCoord, latlng);
            this.totalDistance += distance;
            
            // Update or create polyline
            if (this.currentPolyline) {
                this.currentPolyline.addLatLng(latlng);
            } else {
                this.currentPolyline = L.polyline(this.coordinates, this.lineStyle);
                this.measureLayer.addLayer(this.currentPolyline);
            }
            
            // Add distance label
            const midPoint = this.getMidPoint(prevCoord, latlng);
            const distanceLabel = L.marker(midPoint, {
                icon: this.createDistanceIcon(this.formatDistance(distance))
            });
            this.measureLayer.addLayer(distanceLabel);
            
            // Update total distance popup
            marker.bindPopup(`Total: ${this.formatDistance(this.totalDistance)}`);
        }
    }
    
    onMapDoubleClick(e) {
        if (!this.isActive || this.coordinates.length < 2) return;
        
        e.originalEvent.preventDefault();
        
        // Finish measuring
        this.finishMeasuring();
    }
    
    finishMeasuring() {
        if (this.coordinates.length < 2) return;
        
        // Add final total distance marker
        const lastCoord = this.coordinates[this.coordinates.length - 1];
        const totalMarker = L.marker(lastCoord, {
            icon: this.createTotalDistanceIcon(this.formatDistance(this.totalDistance))
        });
        this.measureLayer.addLayer(totalMarker);
        
        // Reset for next measurement
        this.resetMeasurement();
        this.deactivate();
    }
    
    resetMeasurement() {
        this.currentPolyline = null;
        this.markers = [];
        this.coordinates = [];
        this.totalDistance = 0;
    }
    
    clearAll() {
        this.measureLayer.clearLayers();
        this.resetMeasurement();
        this.deactivate();
    }
    
    calculateDistance(latlng1, latlng2) {
        // Using Haversine formula
        const R = 6371000; // Earth's radius in meters
        const lat1 = latlng1.lat * Math.PI / 180;
        const lat2 = latlng2.lat * Math.PI / 180;
        const deltaLat = (latlng2.lat - latlng1.lat) * Math.PI / 180;
        const deltaLon = (latlng2.lng - latlng1.lng) * Math.PI / 180;
        
        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    getMidPoint(latlng1, latlng2) {
        return L.latLng(
            (latlng1.lat + latlng2.lat) / 2,
            (latlng1.lng + latlng2.lng) / 2
        );
    }
    
    formatDistance(distance) {
        if (distance < 1000) {
            return `${distance.toFixed(2)} m`;
        } else {
            return `${(distance / 1000).toFixed(2)} km`;
        }
    }
    
    createDistanceIcon(text) {
        return L.divIcon({
            className: 'distance-label',
            html: `<div style="
                background: rgba(255, 255, 255, 0.9);
                padding: 2px 6px;
                border-radius: 3px;
                border: 1px solid #ccc;
                font-size: 11px;
                font-weight: bold;
                color: #333;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            ">${text}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
        });
    }
    
    createTotalDistanceIcon(text) {
        return L.divIcon({
            className: 'total-distance-label',
            html: `<div style="
                background: #ff6b6b;
                color: white;
                padding: 4px 8px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                border: 2px solid white;
            ">Total: ${text}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, -20]
        });
    }
    
    showInstruction(text) {
        const instruction = document.createElement('div');
        instruction.id = 'measure-instruction';
        instruction.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        instruction.textContent = text;
        document.body.appendChild(instruction);
    }
    
    hideInstruction() {
        const instruction = document.getElementById('measure-instruction');
        if (instruction) {
            document.body.removeChild(instruction);
        }
    }
}