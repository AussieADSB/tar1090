declare module AussieADSB.Website.Models {
    export interface IAddViewRequest {
        selectedAircraftIcaos: string[];
        currentlySelectedAircraftIcao?: string;
    }

    export class ViewedAircraft
    {
        public icao: string;
        public views: number;
    }
}