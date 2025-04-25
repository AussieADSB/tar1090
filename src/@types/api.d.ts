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

    export const enum StatusType {
        Expired = 0,
        Inactive = 1,
        Future = 2,
        Unknown = 3,
        Next48H = 4,
        Next24H = 5,
        Soon = 6,
        Now = 7
    }

    export class AltitudeBlock
    {
        public floorType: AussieADSB.Website.Models.AltType;
        public ceilingType: AussieADSB.Website.Models.AltType;
        public floor?: number;
        public ceiling?: number;
    }

    export const enum AltType {
        Specific = 0,
        NOTAM = 1,
        SFC = 2,
        BCTA = 3,
        UNL = 4,
        Unknown = 5
    }
}
declare module AussieADSB.Website.Models.Airspaces {
    export class Activation
    {
        public type: AussieADSB.Website.Models.Airspaces.ActivationType;
        public isERSA: boolean;
        public notamId?: string;
        public period: AussieADSB.Website.Models.Period;
        public altitudeBlock: AussieADSB.Website.Models.AltitudeBlock;
        public timesModifiers: AussieADSB.Website.Models.Airspaces.TimesModifiers[];
        public notes: string;
    }
    export const enum ActivationType {
        Full = 0,
        Partial = 1,
        Deactivation = 2
    }
    export class Airspace
    {
        public activations: AussieADSB.Website.Models.Airspaces.Activation[];
        public identifier: string;
        public hours: AussieADSB.Website.Models.Airspaces.PeriodDefinition;
        public altitudeBlock: AussieADSB.Website.Models.AltitudeBlock;
        public timesModifiers: AussieADSB.Website.Models.Airspaces.TimesModifiers[];
    }
    export class AirspaceGroup<T>
    {
        public name: string;
        public identifier: string;
        public naipsParentGroupIDs: string;
        public airspaces: T[];
        public hideFromList: boolean;
    }
    export class AirspacesStatusDto
    {
        public checkTime: any;
        public airspaces: { [key:string]: AussieADSB.Website.Models.Airspaces.AirspaceGroup<AussieADSB.Website.Models.Airspaces.Airspace>[] };
    }
    export class PeriodDefinition
    {
        public timeType: AussieADSB.Website.Models.Airspaces.TimesType;
        public startTime?: any;
        public endTime?: any;
    }
    export const enum TimesType {
        NOTAM = 1,
        H24 = 2,
        DayOfWeek = 3,
        Unknown = 4
    }
    export const enum TimesModifiers {
        HJ = 0,
        HN = 1,
        JO = 2,
        JF = 3
    }
}
