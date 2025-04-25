export class LayersManager {
    constructor() {

    }

    /**
     * Add custom layers to the map
     * Called after layers is created in initMapEarly
     */
    public addCustomLayers(): void {
        window.airspacesLayer.addLayers();

        // Reverse the order of the layers so newer layers are at the bottom of the layer switcher
        layers = new ol.Collection(layers.getArray().reverse());
    }

    /**
     * Initialize custom layers
     * Called after OLMap is created in ol_map_init
     */
    public initCustomLayers(): void {
        window.airspacesLayer.mapInit();
    }
}

window.layersManager = new LayersManager();