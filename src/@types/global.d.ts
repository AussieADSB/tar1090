// This file is for global tar1090 variables used by the typescript scripts

declare var g: {
    planes: { [key: string]: any };
    planesOrdered: any[];
    aiscatcherLayer: ol.layer.Vector;
};

declare var OLMap: ol.Map;

declare var SelectedPlane: PlaneObject | null;
declare var SelPlanes: PlaneObject[];
declare var onMobile: boolean;
declare var layers: ol.Collection<ol.layer.Base>;
declare var globalScale: number;
declare var iconLayer: ol.layer.Vector;
declare var webglLayer: ol.layer.WebGLPoints;

declare function selectPlaneByHex(hex: string, options: any | undefined): void;

declare class PlaneObject {
    icao: string;
    registration: string;
    name: string;
    icaoType: string;
    ownOp: string;
    position: number[];
    tr: Element;
}

declare namespace ol {
    import("openlayers/index");
}

interface Window {
    layersManager: LayersManager;
    aircraftViews: AircraftViews;
    airspacesLayer: AirspacesLayer;
    taxiwayMarkersLayer: TaxiwayMarkersLayer;
    gateMarkersLayer: GateMarkersLayer;
}