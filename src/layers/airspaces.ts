import type { Coordinate } from "openlayers";

class AirspacesLayer {
    private airspaceStatus: { [p: string]: AussieADSB.Website.Models.Airspaces.AirspaceGroup<AussieADSB.Website.Models.Airspaces.Airspace>[] } = {};

    private layerUrls: { [TKey in AirspaceCategory]: string } = {
        [AirspaceCategory.C]: "/layers/ClassCAirspaces_28NOV2024.geojson",
        [AirspaceCategory.D]: "/layers/ClassDAirspaces_28NOV2024.geojson",
        [AirspaceCategory.E]: "/layers/ClassEAirspaces_28NOV2024.geojson",
        //UPDATE AIRSPACES PAGE airspaces.ts InitMap WITH NEW R/Q KML FILES
        [AirspaceCategory.R]: "/layers/ClassRAirspaces_28NOV2024.geojson",
        [AirspaceCategory.Q]: "/layers/ClassQAirspaces_28NOV2024.geojson",
        [AirspaceCategory.CTR]: "/layers/CTRAirspaces_28NOV2024.geojson"
    }

    private popupContainer: HTMLElement | undefined;
    private popupContent: HTMLElement | undefined;
    private popupCloseButton: HTMLElement | undefined;
    private popupOverlay: ol.Overlay | undefined;

    public mapInit() {
        this.popupContainer = document.getElementById('airspaces-popup')!;
        this.popupContent = document.getElementById('airspaces-popup-content')!;
        this.popupCloseButton = document.getElementById('airspaces-popup-closer')!;
        this.popupOverlay = new ol.Overlay({ element: this.popupContainer });
        OLMap.addOverlay(this.popupOverlay);

        eventTarget.addEventListener(eventTypes.mapClick, (event: Event) => {
            const mapEvent = (event as CustomEvent).detail.event as ol.MapBrowserEvent;
            const selectedHex = (event as CustomEvent).detail.hex as string;

            if (selectedHex) {
                this.hideInfobox();
                return;
            }

            this.onAirspacesClick(mapEvent);
        });

        this.popupCloseButton.addEventListener('click', () => {
            this.hideInfobox();
            this.popupCloseButton!.blur();
            return false;
        });

        setInterval(() => {
            if (this.isLayerWithStatusVisible()) {
                this.updateAirspaceStatus();
            }
        }, 60000);//1 minute in milliseconds
    }

    public addLayers() {
        let airspacesLayers = new ol.Collection<ol.layer.Base>();
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.E, "class_e_airspaces", "Class E"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.D, "class_d_airspaces", "Class D"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.C, "class_c_airspaces", "Class C"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.CTR, "ctr_airspaces", "Control Zones"))
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.Q, "class_q_airspaces", "Danger"))
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.R, "class_r_airspaces", "Restricted"))

        layers.push(new ol.layer.Group({
            // @ts-ignore
            name: 'airspaces',
            title: 'Airspaces',
            layers: airspacesLayers
        }));
    }

    private isLayerWithStatusVisible() {
        let layerWithStatusVisible = false;

        layers.forEach(layer => {
            if (layer.get("name") == "airspaces") {
                (layer as ol.layer.Group).getLayers().forEach(layer => {
                    if ((layer.get("name") == "class_r_airspaces" || layer.get("name") == "class_q_airspaces") && layer.getVisible()) {
                        layerWithStatusVisible = true;
                    }
                });
            }
        })

        return layerWithStatusVisible;
    }

    private updateAirspaceStatus() {
        this.getAirspaceStatus(() => {
            layers.forEach(layer => {
                if (layer.get("name") == "airspaces") {
                    (layer as ol.layer.Group).getLayers().forEach(layer => {
                        if (layer.get("name") == "class_r_airspaces") {
                            this.styleLayersWithStatus(layer as ol.layer.Vector, "#FF000080")
                        }

                        if (layer.get("name") == "class_q_airspaces") {
                            this.styleLayersWithStatus(layer as ol.layer.Vector, "#FF00FF80")
                        }
                    });
                }
            })
        });
    }

    private getAirspaceStatus(callback: (json: AussieADSB.Website.Models.Airspaces.AirspacesStatusDto) => void) {
        $.getJSON("/api/airspaces/status", (json: AussieADSB.Website.Models.Airspaces.AirspacesStatusDto) => {
            this.airspaceStatus = json.airspaces;

            for (let oKey in this.airspaceStatus) {
                const owner = this.airspaceStatus[oKey];
                for (let gKey in owner) {
                    const group = owner[gKey];
                    for (let aspKey in group.airspaces) {
                        const airspace = group.airspaces[aspKey];
                        for (let aKey in airspace.activations) {
                            const activation = airspace.activations[aKey];
                            activation.period.startTime = new Date(activation.period.startTime);
                            activation.period.endTime = new Date(activation.period.endTime);
                        }
                    }
                }
            }

            callback(json);
        });
    }

    private addKMLLayer(layerId: AirspaceCategory, name: string, title: string) {
        const layer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: this.layerUrls[layerId],
                format: new ol.format.GeoJSON()
            }),
            // @ts-ignore
            type: 'overlay',
            name: name,
            title: title,
            visible: false,
            opacity: 0.8,
            zIndex: 99
        });

        layer.getSource().on('featuresloadend', () => {
            this.parseProperties(layer);

            //Style polygons
            switch (layerId) {
                case AirspaceCategory.C:
                    this.styleLayersFillColour(layer, "#00FF8033");
                    break;
                case AirspaceCategory.D:
                    this.styleLayersFillColour(layer, "#00FFFF33");
                    break;
                case AirspaceCategory.E:
                    this.styleLayersFillColour(layer, "#00FF0033");
                    break;
                case AirspaceCategory.CTR:
                    this.styleLayersFillColour(layer, "#FF400033");
                    break;
                case AirspaceCategory.R:
                case AirspaceCategory.Q:
                    this.updateAirspaceStatus();
                    break;
            }
        });

        return layer;
    }

    private onAirspacesClick(event: ol.MapBrowserEvent) {
        let airspaces: ol.Feature[] = [];

        OLMap.forEachFeatureAtPixel(event.pixel, (feature: ol.Feature | ol.render.Feature) => {
            if (feature === undefined) return;

            airspaces.push(feature as ol.Feature);
        }, {
            layerFilter: (layer: ol.layer.Layer) => {
                return layer.get("name").endsWith("airspaces");
            }
        });

        if (airspaces.length) {
            this.showInfobox(event.coordinate, airspaces);
        }
        else {
            this.hideInfobox()
        }
    }

    private showInfobox(latLng: Coordinate, airspaces: ol.Feature[]) {
        if (!this.popupOverlay || !this.popupContent) return;

        let content = "<table>";

        let airspaceRows: any[] = [];

        for (let i = 0; i < airspaces.length; i++) {
            let matchFound = false;
            if (this.airspaceStatus !== null) {
                for (const oKey in this.airspaceStatus) {
                    for (const gKey in this.airspaceStatus[oKey]) {
                        const group = this.airspaceStatus[oKey][gKey];
                        for (const aspKey in group.airspaces) {
                            const airspace = group.airspaces[aspKey];
                            if (airspaces[i].get("airspaceId") === airspace.identifier) {
                                matchFound = true;
                                let airspaceContent = `<tr><td colspan='4'>${airspace.identifier} (${group.name})</td></tr>`;
                                let minAlt = 99999;
                                let maxAlt = 0;

                                let activationCount = 0;
                                for (const aKey in airspace.activations) {
                                    const activation = airspace.activations[aKey];
                                    const actStatus = activation.period.status;

                                    if (actStatus < AussieADSB.Website.Models.StatusType.Future) continue;
                                    activationCount++;

                                    const {floor, ceiling} = this.formatActivationAltitude(activation.altitudeBlock);
                                    let alt = this.createAltitudeElement(floor, ceiling, true);

                                    if (activation.altitudeBlock.floorType === AussieADSB.Website.Models.AltType.SFC) minAlt = 0;
                                    else if (activation.altitudeBlock.floor && activation.altitudeBlock.floor < minAlt) minAlt = activation.altitudeBlock.floor;

                                    if (activation.altitudeBlock.ceilingType === AussieADSB.Website.Models.AltType.UNL) maxAlt = 99999;
                                    else if (activation.altitudeBlock.ceiling && activation.altitudeBlock.ceiling > maxAlt) maxAlt = activation.altitudeBlock.ceiling;

                                    const time = document.createElement("div");
                                    time.className = "text-nowrap";
                                    const est = activation.period.isEndEstimated ? " (EST)" : "";
                                    time.appendChild(document.createTextNode(this.formatDateTime(activation.period.startTime) + " - " + this.formatDateTime(activation.period.endTime) + est));

                                    airspaceContent += this.createActivationRowInfobox(activation.type as number, time, alt, actStatus, false).outerHTML;
                                }

                                if (activationCount === 0) {
                                    let status = AussieADSB.Website.Models.StatusType.Inactive;
                                    let type = ActivationType.Inactive;
                                    let t = document.createElement("div");
                                    t.className = "text-nowrap";
                                    //Also add to airspaces.js RenderActivationsList
                                    if (airspace.hours.timeType === AussieADSB.Website.Models.Airspaces.TimesType.Unknown) {
                                        status = AussieADSB.Website.Models.StatusType.Unknown;
                                        type = ActivationType.Activation;

                                        let timeString = "";
                                        for (let mKey in airspace.timesModifiers)
                                            timeString += this.getTimeModifierDescription(airspace.timesModifiers[mKey]) + ", ";

                                        if (timeString.length > 0) timeString = timeString.substring(0, timeString.length - 2);
                                        t.appendChild(document.createTextNode(timeString));
                                    }
                                    if (airspace.hours.timeType === AussieADSB.Website.Models.Airspaces.TimesType.H24) {
                                        status = AussieADSB.Website.Models.StatusType.Now;
                                        type = ActivationType.Activation;
                                        t.appendChild(document.createTextNode("24 hours"));
                                    }
                                    if (airspace.hours.timeType === AussieADSB.Website.Models.Airspaces.TimesType.NOTAM) {
                                        t.appendChild(document.createTextNode("NOTAM"));
                                    }

                                    const {floor, ceiling} = this.formatActivationAltitude(airspace.altitudeBlock);
                                    let alt = this.createAltitudeElement(floor, ceiling, true);

                                    if (airspace.altitudeBlock.floorType === AussieADSB.Website.Models.AltType.SFC) minAlt = 0;
                                    else if (airspace.altitudeBlock.floor && airspace.altitudeBlock.floor < minAlt) minAlt = airspace.altitudeBlock.floor;

                                    if (airspace.altitudeBlock.ceilingType === AussieADSB.Website.Models.AltType.UNL) maxAlt = 99999;
                                    else if (airspace.altitudeBlock.ceiling && airspace.altitudeBlock.ceiling > maxAlt) maxAlt = airspace.altitudeBlock.ceiling;

                                    airspaceContent += this.createActivationRowInfobox(type, t, alt, status, false).outerHTML;
                                }

                                if (minAlt === 99999) minAlt = 0;
                                airspaceRows.push([minAlt, maxAlt, airspaceContent]);
                            }
                        }
                    }
                }
            }

            if (!matchFound) {
                let featureAirspaceContent = `<tr><td colspan='4'>${airspaces[i].get("name")}</td></tr>`;
                const {numericFloor, numericCeiling} = this.numericFeatureAltitude(airspaces[i]);

                let unknownStatus = AussieADSB.Website.Models.StatusType.Unknown;
                const unknownType = ActivationType.Activation;
                const unknownT = document.createElement("div");
                unknownT.className = "text-nowrap";
                //Also add to airspaces.js RenderActivationsList
                if (airspaces[i].get("hours").timeType === AussieADSB.Website.Models.Airspaces.TimesType.H24) {
                    unknownStatus = AussieADSB.Website.Models.StatusType.Now;
                    unknownT.appendChild(document.createTextNode("24 hours"));
                }

                const {floor, ceiling} = this.formatFeatureAltitude(airspaces[i]);
                let altElement = this.createAltitudeElement(floor, ceiling, true);
                featureAirspaceContent += this.createActivationRowInfobox(unknownType, unknownT, altElement, unknownStatus, false).outerHTML;
                airspaceRows.push([numericFloor, numericCeiling, featureAirspaceContent]);
            }
        }

        airspaceRows.sort((a, b) => (a[1] < b[1]) ? 1 : ((b[1] < a[1]) ? -1 : 0));//Sort by max alt
        airspaceRows.sort((a, b) => (a[0] < b[0]) ? 1 : ((b[0] < a[0]) ? -1 : 0));//Sort by min alt

        for (let ar = 0; ar < airspaceRows.length; ar++) content += airspaceRows[ar][2];

        content += "</table>";

        this.popupContent.innerHTML = content;
        this.popupOverlay.setPosition(latLng);
    }

    private hideInfobox() {
        if (this.popupOverlay) {
            this.popupOverlay.setPosition(undefined);
        }
    }

    private createActivationRowInfobox(type: ActivationType, time: HTMLElement, alt: HTMLElement, statusType: AussieADSB.Website.Models.StatusType, first: boolean) {
        const atr = document.createElement("tr");
        if (first) atr.className = "firstofairspace";

        const gtd0 = document.createElement("td");
        const status = this.getFormattedStatusTypeValue(statusType);
        gtd0.appendChild(document.createTextNode(status.text));
        gtd0.style.color = status.colour;
        gtd0.style.backgroundColor = status.backgroundColour;
        gtd0.className = "statustd";
        atr.appendChild(gtd0);

        const gtd1 = document.createElement("td");
        const actType = this.getFormattedActivationType(type);
        gtd1.appendChild(document.createTextNode(actType.text));
        gtd1.style.color = actType.colour;
        gtd1.style.backgroundColor = actType.backgroundColour;
        gtd1.className = "statustd";
        atr.appendChild(gtd1);

        const gtd3 = document.createElement("td");
        gtd3.appendChild(time);
        atr.appendChild(gtd3);

        const gtd4 = document.createElement("td");
        gtd4.appendChild(alt);
        atr.appendChild(gtd4);

        return atr;
    }

    private formatActivationAltitude(altBlock: AussieADSB.Website.Models.AltitudeBlock) {
        const floor = this.activationAltToString(altBlock.floorType, altBlock.floor);
        const ceiling = this.activationAltToString(altBlock.ceilingType, altBlock.ceiling);

        return {floor, ceiling}
    }

    private formatFeatureAltitude(feature: ol.Feature) {
        const floor = this.featureAltToString(feature.get("lowerCeiling").unit, feature.get("lowerCeiling").value);
        const ceiling = this.featureAltToString(feature.get("upperCeiling").unit, feature.get("upperCeiling").value);

        return {floor, ceiling}
    }

    private numericFeatureAltitude(feature: ol.Feature) {
        let numericFloor = this.featureAltToNumber(feature.get("lowerCeiling").unit, feature.get("lowerCeiling").value, 1);
        let numericCeiling = this.featureAltToNumber(feature.get("upperCeiling").unit, feature.get("upperCeiling").value, 59999);

        return {numericFloor, numericCeiling}
    }

    private createAltitudeElement(floor: string, ceiling: string, oneLine: boolean) {
        const alt = document.createElement("div");
        if (oneLine) {
            alt.className = "text-nowrap";
            alt.appendChild(document.createTextNode(floor + " - " + ceiling));
        }
        else {
            const s21 = document.createElement("span");
            s21.appendChild(document.createTextNode(floor + " - "));
            alt.appendChild(s21);
            const s22 = document.createElement("span");
            s22.appendChild(document.createTextNode(ceiling));
            s22.className = "text-nowrap";
            alt.appendChild(s22);
        }
        return alt;
    }

    private parseProperties(kmlLayer: ol.layer.Vector) {
        kmlLayer.getSource().forEachFeature((feature: ol.Feature) => {
            const featureName = feature.get("name");

            const bracketIndex = featureName.indexOf("[");
            if (bracketIndex === -1) {
                console.warn(feature, " nobracket");
                return;
            }
            const name = featureName.substring(0, bracketIndex);
            const hoursTypeString = featureName.substring(bracketIndex + 1, featureName.length - 1);
            feature.set("name", name);

            let hoursType: AussieADSB.Website.Models.Airspaces.TimesType;
            switch (hoursTypeString) {
                case "H24":
                    hoursType = AussieADSB.Website.Models.Airspaces.TimesType.H24;
                    break;
                case "NOTAM":
                    hoursType = AussieADSB.Website.Models.Airspaces.TimesType.NOTAM;
                    break;
                default:
                    hoursType = AussieADSB.Website.Models.Airspaces.TimesType.Unknown;
                    break;
            }

            feature.set("hours", { timeType: hoursType });
        });
    }

    private styleLayersFillColour(layer: ol.layer.Vector, colour: string) {
        if (layer === undefined)
            return;

        layer.getSource().forEachFeature(feature => {
            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: colour
                }),
                stroke: new ol.style.Stroke({
                    color: "black",
                    width: 1
                })
            }))
        })
    }

    private styleLayersWithStatus(layer: ol.layer.Vector, strokeColour: string): void {
        if (layer === undefined || this.airspaceStatus === undefined) {
            console.warn("Can't style airspace layer, layers or airspaceStatus undefined");
        }

        layer.getSource().forEachFeature((feature: ol.Feature) => {
            if (feature.get("airspaceId") === undefined)
            {
                feature.set("airspaceId", this.getAirspaceId(feature.get("name"), true));
            }

            const id = feature.get("airspaceId") as string;

            const airspace = this.getAirspaceById(id);

            //Get status
            let status: AussieADSB.Website.Models.StatusType = AussieADSB.Website.Models.StatusType.Unknown;
            if (airspace)
                status = this.getAirspaceStatusType(airspace);
            else if (feature.get("hours").timeType === AussieADSB.Website.Models.Airspaces.TimesType.H24)
                status = AussieADSB.Website.Models.StatusType.Now;

            //Get fill colour
            let colour = this.getFormattedStatusTypeValue(status).backgroundColour;
            if (status !== AussieADSB.Website.Models.StatusType.Now && status !== AussieADSB.Website.Models.StatusType.Unknown)
                colour = "#FFFFFF";

            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: colour + "33"
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColour,
                    width: 1
                })
            }));
        });
    }

    private getFormattedStatusTypeValue(type: AussieADSB.Website.Models.StatusType): ColouredText {
        switch (type) {
            case AussieADSB.Website.Models.StatusType.Expired: return new ColouredText("Expired", "#FFFF00", "#000000");
            case AussieADSB.Website.Models.StatusType.Inactive: return new ColouredText("Inactive", "#000000", "#FFFFFF");
            case AussieADSB.Website.Models.StatusType.Future: return new ColouredText("Future", "#000000", "#00AA00");
            case AussieADSB.Website.Models.StatusType.Unknown: return new ColouredText("Unknown", "#FFFFFF", "#8000FF");
            case AussieADSB.Website.Models.StatusType.Next48H: return new ColouredText("Next 48H", "#FFFFFF", "#FF8000");
            case AussieADSB.Website.Models.StatusType.Next24H: return new ColouredText("Next 24H", "#000000", "#FFE000");
            case AussieADSB.Website.Models.StatusType.Soon: return new ColouredText("Soon", "#FFFFFF", "#FF5000");
            case AussieADSB.Website.Models.StatusType.Now: return new ColouredText("Now", "#FFFFFF", "#FF0000");
        }
    }

    private getFormattedActivationType(type: ActivationType): ColouredText {
        switch (type) {
            case ActivationType.Activation: return new ColouredText("Activation", "#FFF", "#F00");
            case ActivationType.Partial: return new ColouredText("Partial", "#000", "#FA0");
            case ActivationType.Deactivation: return new ColouredText("Deactivation", "#000", "#0A0");
            case ActivationType.Inactive: return new ColouredText("Inactive", "#000", "#FFF");
        }
    }

    private getTimeModifierDescription(modifier: AussieADSB.Website.Models.Airspaces.TimesModifiers) {
        switch (modifier) {
            case AussieADSB.Website.Models.Airspaces.TimesModifiers.HJ: return "Sunrise-Sunset";
            case AussieADSB.Website.Models.Airspaces.TimesModifiers.HN: return "Sunset-Sunrise";
            case AussieADSB.Website.Models.Airspaces.TimesModifiers.JO: return "Mon-Fri";
            case AussieADSB.Website.Models.Airspaces.TimesModifiers.JF: return "Sat/Sun";
        }
    }

    private activationAltToString(type: AussieADSB.Website.Models.AltType, value: number | undefined): string {
        if (type === AussieADSB.Website.Models.AltType.Specific && value !== undefined) return value.toString() + "ft";
        else if (type === AussieADSB.Website.Models.AltType.NOTAM) return "NOTAM";
        else if (type === AussieADSB.Website.Models.AltType.SFC) return "SFC";
        else if (type === AussieADSB.Website.Models.AltType.BCTA) return "BCTA";
        else if (type === AussieADSB.Website.Models.AltType.UNL) return "UNL";
        else return "Unknown";
    }

    private featureAltToString(unit: string, value: number | string): string {
        if (value === "NOTAM") return "NOTAM";
        else if (value === "BCTA") return "BCTA";
        else if (unit === "FT" && value === 0) return "SFC";
        else if (unit === "FT" && value !== undefined) return value.toString() + "ft";
        else if (unit === "FL" && value === 999) return "UNL";
        else if (unit === "FL" && value !== undefined) return (+value * 100).toString() + "ft";
        else return "Unknown";
    }

    private featureAltToNumber(unit: string, value: number | string, defaultValue: number): number {
        if (value === "NOTAM") return defaultValue;
        else if (value === "BCTA") return defaultValue;
        else if (unit === "FT" && value !== undefined) return +value;
        else if (unit === "FL" && value === 999) return 60000;
        else if (unit === "FL" && value !== undefined) return (+value * 100);
        else return defaultValue;
    }

    private getAirspaceStatusType(airspace: AussieADSB.Website.Models.Airspaces.Airspace): AussieADSB.Website.Models.StatusType {
        let type = AussieADSB.Website.Models.StatusType.Inactive;

        if (airspace.hours.timeType === AussieADSB.Website.Models.Airspaces.TimesType.H24) return AussieADSB.Website.Models.StatusType.Now;
        if (airspace.hours.timeType === AussieADSB.Website.Models.Airspaces.TimesType.Unknown) return AussieADSB.Website.Models.StatusType.Unknown;

        for (let aKey in airspace.activations) {
            const actType = airspace.activations[aKey].period.status;
            if (actType > type) type = actType;
        }
        return type;
    }

    private getAirspaceId(name: string, trim: boolean): string {
        let id = name;

        if (trim) {
            const firstSpace = id.indexOf(" ");
            if (firstSpace !== -1) {
                id = id.substring(0, firstSpace);
            }
        }
        else {
            const firstBracket = id.indexOf("[");
            if (firstBracket  !== -1) {
                id = id.substring(0, firstBracket-1);
            }
        }

        return id;
    }

    private getAirspaceById(id: string) {
        for (let oKey in this.airspaceStatus) {
            for (let gKey in this.airspaceStatus[oKey]) {
                for (let aspKey in this.airspaceStatus[oKey][gKey].airspaces) {
                    const airspace = this.airspaceStatus[oKey][gKey].airspaces[aspKey];
                    if (id === airspace.identifier) {
                        return airspace;
                    }
                }
            }
        }
        return undefined;
    }

    private formatDateTime(date: Date) {
        const time = (date.getHours() < 10 ? "0" : "") + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
        if (onMobile) return date.getDate() + " " + time;
        return date.getDate() + "/" + (date.getMonth() + 1) + " " + time;
    }

    public getAirspacesWithoutStatus() {
        let airspacesWithoutStatus: {id: string, name: string}[] = [];

        layers.forEach(layer => {
            if (layer.get("name") == "airspaces") {
                (layer as ol.layer.Group).getLayers().forEach(layer => {
                    if (layer.get("name") == "class_r_airspaces" || layer.get("name") == "class_q_airspaces") {
                        (layer as ol.layer.Vector).getSource().forEachFeature((feature: ol.Feature) => {
                            const id = feature.get("airspaceId") as string;

                            if (feature.get("hours").timeType === AussieADSB.Website.Models.Airspaces.TimesType.NOTAM) {
                                const airspace = this.getAirspaceById(id);

                                if (airspace === undefined) {
                                    const airspaceName = feature.get("name");
                                    airspacesWithoutStatus.push({
                                        id: id,
                                        name: airspaceName
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });

        console.log(airspacesWithoutStatus);
    }
}

window.airspacesLayer = new AirspacesLayer();