"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayersManager = void 0;
class LayersManager {
    constructor() {
    }
    /**
     * Add custom layers to the map
     * Called after layers is created in initMapEarly
     */
    addCustomLayers() {
        window.airspacesLayer.addLayers();
        // Reverse the order of the layers so newer layers are at the bottom of the layer switcher
        layers.getArray().reverse();
    }
    /**
     * Initialize custom layers
     * Called after OLMap is created in ol_map_init
     */
    initCustomLayers() {
        window.airspacesLayer.mapInit();
    }
}
exports.LayersManager = LayersManager;
window.layersManager = new LayersManager();
