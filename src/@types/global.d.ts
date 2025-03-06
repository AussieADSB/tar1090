// This file is for global tar1090 variables used by the typescript scripts
declare var g: {
    planes: { [key: string]: any };
    planesOrdered: any[];
};

declare var SelectedPlane: PlaneObject | null;
declare var SelPlanes: PlaneObject[];
declare var onMobile: boolean;

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