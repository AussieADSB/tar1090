"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AirspacesLayer {
    constructor() {
        this.airspaceStatus = {};
        this.kmlLayerUrls = {
            [AirspaceCategory.C]: "/layers/ClassCAirspaces_30NOV2023.kml",
            [AirspaceCategory.D]: "/layers/ClassDAirspaces_30NOV2023.kml",
            [AirspaceCategory.E]: "/layers/ClassEAirspaces_30NOV2023.kml",
            //UPDATE AIRSPACES PAGE airspaces.ts InitMap WITH NEW R/Q KML FILES
            [AirspaceCategory.R]: "/layers/ClassRAirspaces_30NOV2023_MOAsRenamed.kml",
            [AirspaceCategory.Q]: "/layers/ClassQAirspaces_30NOV2023.kml",
            [AirspaceCategory.CTR]: "/layers/CTRAirspaces_30NOV2023.kml"
        };
    }
    mapInit() {
        this.popupContainer = document.getElementById('airspaces-popup');
        this.popupContent = document.getElementById('airspaces-popup-content');
        this.popupCloseButton = document.getElementById('airspaces-popup-closer');
        this.popupOverlay = new ol.Overlay({ element: this.popupContainer });
        OLMap.addOverlay(this.popupOverlay);
        eventTarget.addEventListener(eventTypes.mapClick, (event) => {
            const mapEvent = event.detail;
            this.onAirspacesClick(mapEvent);
        });
        this.popupCloseButton.addEventListener('click', () => {
            this.popupOverlay.setPosition(undefined);
            this.popupCloseButton.blur();
            return false;
        });
        setInterval(() => {
            if (this.isLayerWithStatusVisible()) {
                this.updateAirspaceStatus();
            }
        }, 60000); //1 minute in milliseconds
    }
    addLayers() {
        let airspacesLayers = new ol.Collection();
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.E, "class_e_airspaces", "Class E"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.D, "class_d_airspaces", "Class D"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.C, "class_c_airspaces", "Class C"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.CTR, "ctr_airspaces", "Control Zones"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.Q, "class_q_airspaces", "Danger"));
        airspacesLayers.push(this.addKMLLayer(AirspaceCategory.R, "class_r_airspaces", "Restricted"));
        layers.push(new ol.layer.Group({
            // @ts-ignore
            name: 'airspaces',
            title: 'Airspaces',
            layers: airspacesLayers
        }));
    }
    isLayerWithStatusVisible() {
        let layerWithStatusVisible = false;
        layers.forEach(layer => {
            if (layer.get("name") == "airspaces") {
                layer.getLayers().forEach(layer => {
                    if ((layer.get("name") == "class_r_airspaces" || layer.get("name") == "class_q_airspaces") && layer.getVisible()) {
                        layerWithStatusVisible = true;
                    }
                });
            }
        });
        return layerWithStatusVisible;
    }
    updateAirspaceStatus() {
        this.getAirspaceStatus(() => {
            layers.forEach(layer => {
                if (layer.get("name") == "airspaces") {
                    layer.getLayers().forEach(layer => {
                        if (layer.get("name") == "class_r_airspaces") {
                            this.styleLayersWithStatus(layer, "#FF0000");
                        }
                        if (layer.get("name") == "class_q_airspaces") {
                            this.styleLayersWithStatus(layer, "#FF00FF");
                        }
                    });
                }
            });
        });
    }
    getAirspaceStatus(callback) {
        $.getJSON("/api/airspaces/status", (json) => {
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
    addKMLLayer(layerId, name, title) {
        const layer = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: this.kmlLayerUrls[layerId],
                format: new ol.format.KML()
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
            this.parseExtendedData(layer);
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
    onAirspacesClick(event) {
        let airspaces = [];
        OLMap.forEachFeatureAtPixel(event.pixel, (feature) => {
            if (feature === undefined)
                return;
            airspaces.push(feature);
        });
        if (airspaces.length) {
            this.showInfobox(event.coordinate, airspaces);
        }
        else if (this.popupOverlay) {
            this.popupOverlay.setPosition(undefined);
        }
    }
    showInfobox(latLng, airspaces) {
        if (!this.popupOverlay || !this.popupContent)
            return;
        let content = "<table>";
        let airspaceRows = [];
        for (let i = 0; i < airspaces.length; i++) {
            let matchFound = false;
            if (this.airspaceStatus !== null) {
                for (const oKey in this.airspaceStatus) {
                    for (const gKey in this.airspaceStatus[oKey]) {
                        const group = this.airspaceStatus[oKey][gKey];
                        for (const aspKey in group.airspaces) {
                            const airspace = group.airspaces[aspKey];
                            if (airspaces[i].get("id") === airspace.identifier) {
                                matchFound = true;
                                let airspaceContent = `<tr><td colspan='4'>${airspace.identifier} (${group.name})</td></tr>`;
                                let minAlt = 99999;
                                let maxAlt = 0;
                                let activationCount = 0;
                                for (const aKey in airspace.activations) {
                                    const activation = airspace.activations[aKey];
                                    const actStatus = activation.period.status;
                                    if (actStatus < 2 /* AussieADSB.Website.Models.StatusType.Future */)
                                        continue;
                                    activationCount++;
                                    const alt = this.altBlockToElement(activation.altitudeBlock, true);
                                    if (activation.altitudeBlock.floorType === 2 /* AussieADSB.Website.Models.AltType.SFC */)
                                        minAlt = 0;
                                    else if (activation.altitudeBlock.floor && activation.altitudeBlock.floor < minAlt)
                                        minAlt = activation.altitudeBlock.floor;
                                    if (activation.altitudeBlock.ceilingType === 4 /* AussieADSB.Website.Models.AltType.UNL */)
                                        maxAlt = 99999;
                                    else if (activation.altitudeBlock.ceiling && activation.altitudeBlock.ceiling > maxAlt)
                                        maxAlt = activation.altitudeBlock.ceiling;
                                    const time = document.createElement("div");
                                    time.className = "text-nowrap";
                                    const est = activation.period.isEndEstimated ? " (EST)" : "";
                                    time.appendChild(document.createTextNode(this.formatDateTime(activation.period.startTime) + " - " + this.formatDateTime(activation.period.endTime) + est));
                                    airspaceContent += this.createActivationRowInfobox(activation.type, time, alt, actStatus, false).outerHTML;
                                }
                                if (activationCount === 0) {
                                    let status = 1 /* AussieADSB.Website.Models.StatusType.Inactive */;
                                    let type = ActivationType.Inactive;
                                    let t = document.createElement("div");
                                    t.className = "text-nowrap";
                                    //Also add to airspaces.js RenderActivationsList
                                    if (airspace.hours.timeType === 4 /* AussieADSB.Website.Models.Airspaces.TimesType.Unknown */) {
                                        status = 3 /* AussieADSB.Website.Models.StatusType.Unknown */;
                                        type = ActivationType.Activation;
                                        let timeString = "";
                                        for (let mKey in airspace.timesModifiers)
                                            timeString += this.getTimeModifierDescription(airspace.timesModifiers[mKey]) + ", ";
                                        if (timeString.length > 0)
                                            timeString = timeString.substring(0, timeString.length - 2);
                                        t.appendChild(document.createTextNode(timeString));
                                    }
                                    if (airspace.hours.timeType === 2 /* AussieADSB.Website.Models.Airspaces.TimesType.H24 */) {
                                        status = 7 /* AussieADSB.Website.Models.StatusType.Now */;
                                        type = ActivationType.Activation;
                                        t.appendChild(document.createTextNode("24 Hours"));
                                    }
                                    let alt = this.altBlockToElement(airspace.altitudeBlock, true);
                                    if (airspace.altitudeBlock.floorType === 2 /* AussieADSB.Website.Models.AltType.SFC */)
                                        minAlt = 0;
                                    else if (airspace.altitudeBlock.floor && airspace.altitudeBlock.floor < minAlt)
                                        minAlt = airspace.altitudeBlock.floor;
                                    if (airspace.altitudeBlock.ceilingType === 4 /* AussieADSB.Website.Models.AltType.UNL */)
                                        maxAlt = 99999;
                                    else if (airspace.altitudeBlock.ceiling && airspace.altitudeBlock.ceiling > maxAlt)
                                        maxAlt = airspace.altitudeBlock.ceiling;
                                    airspaceContent += this.createActivationRowInfobox(type, t, alt, status, false).outerHTML;
                                }
                                if (minAlt === 99999)
                                    minAlt = 0;
                                airspaceRows.push([minAlt, maxAlt, airspaceContent]);
                            }
                        }
                    }
                }
            }
            if (!matchFound) {
                let unknownAirspaceContent = `<tr><td colspan='4'>${airspaces[i].get("name")}</td></tr>`;
                let unknownFloor = airspaces[i].get("altitudeBlock").floor;
                let unknownCeiling = airspaces[i].get("altitudeBlock").ceiling;
                if (!Number.isInteger(unknownFloor))
                    unknownFloor = 0;
                if (!Number.isInteger(unknownCeiling))
                    unknownCeiling = 99999;
                let unknownStatus = 3 /* AussieADSB.Website.Models.StatusType.Unknown */;
                const unknownType = ActivationType.Activation;
                const unknownT = document.createElement("div");
                unknownT.className = "text-nowrap";
                //Also add to airspaces.js RenderActivationsList
                if (airspaces[i].get("hours").timeType === 1 /* AussieADSB.Website.Models.Airspaces.TimesType.NOTAM */) {
                    unknownT.appendChild(document.createTextNode("NOTAM"));
                }
                else if (airspaces[i].get("hours").timeType === 2 /* AussieADSB.Website.Models.Airspaces.TimesType.H24 */) {
                    unknownStatus = 7 /* AussieADSB.Website.Models.StatusType.Now */;
                    unknownT.appendChild(document.createTextNode("24 Hours"));
                }
                let alt = this.altBlockToElement(airspaces[i].get("altitudeBlock"), true);
                unknownAirspaceContent += this.createActivationRowInfobox(unknownType, unknownT, alt, unknownStatus, false).outerHTML;
                airspaceRows.push([unknownFloor, unknownCeiling, unknownAirspaceContent]);
            }
        }
        airspaceRows.sort((a, b) => (a[1] < b[1]) ? 1 : ((b[1] < a[1]) ? -1 : 0)); //Sort by max alt
        airspaceRows.sort((a, b) => (a[0] < b[0]) ? 1 : ((b[0] < a[0]) ? -1 : 0)); //Sort by min alt
        for (let ar = 0; ar < airspaceRows.length; ar++)
            content += airspaceRows[ar][2];
        content += "</table>";
        this.popupContent.innerHTML = content;
        this.popupOverlay.setPosition(latLng);
    }
    createActivationRowInfobox(type, time, alt, statusType, first) {
        const atr = document.createElement("tr");
        if (first)
            atr.className = "firstofairspace";
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
    altBlockToElement(altBlock, oneLine) {
        const floor = this.altToString(altBlock.floorType, altBlock.floor);
        const ceiling = this.altToString(altBlock.ceilingType, altBlock.ceiling);
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
    parseExtendedData(kmlLayer) {
        kmlLayer.getSource().forEachFeature((feature) => {
            const featureName = feature.get("name");
            const bracketIndex = featureName.indexOf("[");
            if (bracketIndex === -1) {
                console.warn(feature, " nobracket");
                return;
            }
            const name = featureName.substring(0, bracketIndex);
            const hoursTypeString = featureName.substring(bracketIndex + 1, featureName.length - 1);
            feature.set("name", name);
            let hoursType;
            switch (hoursTypeString) {
                case "H24":
                    hoursType = 2 /* AussieADSB.Website.Models.Airspaces.TimesType.H24 */;
                    break;
                case "NOTAM":
                    hoursType = 1 /* AussieADSB.Website.Models.Airspaces.TimesType.NOTAM */;
                    break;
                default:
                    hoursType = 4 /* AussieADSB.Website.Models.Airspaces.TimesType.Unknown */;
                    break;
            }
            let floor, ceiling;
            let floorType = 5 /* AussieADSB.Website.Models.AltType.Unknown */;
            let ceilingType = 5 /* AussieADSB.Website.Models.AltType.Unknown */;
            const kmlFloor = feature.get("FLOOR");
            if (kmlFloor === "SFC") {
                floorType = 2 /* AussieADSB.Website.Models.AltType.SFC */;
                floor = undefined;
            }
            else if (kmlFloor === "NOTAM") {
                floorType = 1 /* AussieADSB.Website.Models.AltType.NOTAM */;
                floor = undefined;
            }
            else if (kmlFloor.endsWith("FT")) {
                floorType = 0 /* AussieADSB.Website.Models.AltType.Specific */;
                floor = parseInt(kmlFloor.substring(0, kmlFloor.length - 2));
            }
            else if (kmlFloor.startsWith("FL")) {
                floorType = 0 /* AussieADSB.Website.Models.AltType.Specific */;
                floor = parseInt(kmlFloor.substring(2)) * 100;
            }
            else if (kmlFloor.endsWith(" AGL")) {
                floorType = 0 /* AussieADSB.Website.Models.AltType.Specific */;
                floor = parseInt(kmlFloor.substring(0, kmlFloor.length - " AGL".length));
            }
            else {
                console.error("kml alt parsing error", kmlFloor);
            }
            const kmlCeiling = feature.get("CEILING");
            if (kmlCeiling === "NOTAM") {
                ceilingType = 1 /* AussieADSB.Website.Models.AltType.NOTAM */;
                ceiling = undefined;
            }
            else if (kmlCeiling === "UNL") {
                ceilingType = 4 /* AussieADSB.Website.Models.AltType.UNL */;
                ceiling = undefined;
            }
            else if (kmlCeiling === "BCTA") {
                ceilingType = 3 /* AussieADSB.Website.Models.AltType.BCTA */;
                ceiling = undefined;
            }
            else if (kmlCeiling.endsWith("FT")) {
                ceilingType = 0 /* AussieADSB.Website.Models.AltType.Specific */;
                ceiling = parseInt(kmlCeiling.substring(0, kmlCeiling.length - 2));
            }
            else if (kmlCeiling.startsWith("FL")) {
                ceilingType = 0 /* AussieADSB.Website.Models.AltType.Specific */;
                ceiling = parseInt(kmlCeiling.substring(2)) * 100;
            }
            else if (kmlCeiling.endsWith(" AGL")) {
                ceilingType = 0 /* AussieADSB.Website.Models.AltType.Specific */;
                ceiling = parseInt(kmlCeiling.substring(0, kmlCeiling.length - " AGL".length));
            }
            else {
                console.error("kml alt parsing error", kmlCeiling);
            }
            feature.set("hours", { timeType: hoursType });
            feature.set("altitudeBlock", {
                floor: floor,
                floorType: floorType,
                ceiling: ceiling,
                ceilingType: ceilingType
            });
        });
    }
    styleLayersFillColour(layer, colour) {
        if (layer === undefined)
            return;
        layer.getSource().forEachFeature(feature => {
            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: colour,
                }),
                stroke: new ol.style.Stroke({
                    color: "black",
                    width: 2
                })
            }));
        });
    }
    styleLayersWithStatus(layer, strokeColour) {
        if (layer === undefined || this.airspaceStatus === undefined) {
            console.warn("Can't style airspace layer, layers or airspaceStatus undefined");
        }
        layer.getSource().forEachFeature((feature) => {
            if (feature.get("id") === undefined) {
                feature.set("id", this.getAirspaceId(feature.get("name"), true));
            }
            const id = feature.get("id");
            const airspace = this.getAirspaceById(id);
            //Get status
            let status = 3 /* AussieADSB.Website.Models.StatusType.Unknown */;
            if (airspace)
                status = this.getAirspaceStatusType(airspace);
            else if (feature.get("hours").timeType === 2 /* AussieADSB.Website.Models.Airspaces.TimesType.H24 */)
                status = 7 /* AussieADSB.Website.Models.StatusType.Now */;
            //Get fill colour
            let colour = this.getFormattedStatusTypeValue(status).backgroundColour;
            if (status !== 7 /* AussieADSB.Website.Models.StatusType.Now */ && status !== 3 /* AussieADSB.Website.Models.StatusType.Unknown */)
                colour = "#FFFFFF";
            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({
                    color: colour + "33"
                }),
                stroke: new ol.style.Stroke({
                    color: strokeColour,
                    width: 2
                })
            }));
        });
    }
    getFormattedStatusTypeValue(type) {
        switch (type) {
            case 0 /* AussieADSB.Website.Models.StatusType.Expired */: return new ColouredText("Expired", "#FFFF00", "#000000");
            case 1 /* AussieADSB.Website.Models.StatusType.Inactive */: return new ColouredText("Inactive", "#000000", "#FFFFFF");
            case 2 /* AussieADSB.Website.Models.StatusType.Future */: return new ColouredText("Future", "#000000", "#00AA00");
            case 3 /* AussieADSB.Website.Models.StatusType.Unknown */: return new ColouredText("Unknown", "#FFFFFF", "#8000FF");
            case 4 /* AussieADSB.Website.Models.StatusType.Next48H */: return new ColouredText("Next 48H", "#FFFFFF", "#FF8000");
            case 5 /* AussieADSB.Website.Models.StatusType.Next24H */: return new ColouredText("Next 24H", "#000000", "#FFE000");
            case 6 /* AussieADSB.Website.Models.StatusType.Soon */: return new ColouredText("Soon", "#FFFFFF", "#FF5000");
            case 7 /* AussieADSB.Website.Models.StatusType.Now */: return new ColouredText("Now", "#FFFFFF", "#FF0000");
        }
    }
    getFormattedActivationType(type) {
        switch (type) {
            case ActivationType.Activation: return new ColouredText("Activation", "#FFF", "#F00");
            case ActivationType.Partial: return new ColouredText("Partial", "#000", "#FA0");
            case ActivationType.Deactivation: return new ColouredText("Deactivation", "#000", "#0A0");
            case ActivationType.Inactive: return new ColouredText("Inactive", "#000", "#FFF");
        }
    }
    getTimeModifierDescription(modifier) {
        switch (modifier) {
            case 0 /* AussieADSB.Website.Models.Airspaces.TimesModifiers.HJ */: return "Sunrise-Sunset";
            case 1 /* AussieADSB.Website.Models.Airspaces.TimesModifiers.HN */: return "Sunset-Sunrise";
            case 2 /* AussieADSB.Website.Models.Airspaces.TimesModifiers.JO */: return "Mon-Fri";
            case 3 /* AussieADSB.Website.Models.Airspaces.TimesModifiers.JF */: return "Sat/Sun";
        }
    }
    altToString(type, value) {
        if (type === 0 /* AussieADSB.Website.Models.AltType.Specific */ && value !== undefined)
            return value.toString() + "ft";
        else if (type === 1 /* AussieADSB.Website.Models.AltType.NOTAM */)
            return "NOTAM";
        else if (type === 2 /* AussieADSB.Website.Models.AltType.SFC */)
            return "SFC";
        else if (type === 3 /* AussieADSB.Website.Models.AltType.BCTA */)
            return "BCTA";
        else if (type === 4 /* AussieADSB.Website.Models.AltType.UNL */)
            return "UNL";
        else
            return "Unknown";
    }
    getAirspaceStatusType(airspace) {
        let type = 1 /* AussieADSB.Website.Models.StatusType.Inactive */;
        if (airspace.hours.timeType === 2 /* AussieADSB.Website.Models.Airspaces.TimesType.H24 */)
            return 7 /* AussieADSB.Website.Models.StatusType.Now */;
        if (airspace.hours.timeType === 4 /* AussieADSB.Website.Models.Airspaces.TimesType.Unknown */)
            return 3 /* AussieADSB.Website.Models.StatusType.Unknown */;
        for (let aKey in airspace.activations) {
            const actType = airspace.activations[aKey].period.status;
            if (actType > type)
                type = actType;
        }
        return type;
    }
    getAirspaceId(name, trim) {
        let id = name;
        if (trim) {
            const firstSpace = id.indexOf(" ");
            if (firstSpace !== -1) {
                id = id.substring(0, firstSpace);
            }
        }
        else {
            const firstBracket = id.indexOf("[");
            if (firstBracket !== -1) {
                id = id.substring(0, firstBracket - 1);
            }
        }
        return id;
    }
    getAirspaceById(id) {
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
    formatDateTime(date) {
        const time = (date.getHours() < 10 ? "0" : "") + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
        if (onMobile)
            return date.getDate() + " " + time;
        return date.getDate() + "/" + (date.getMonth() + 1) + " " + time;
    }
}
window.airspacesLayer = new AirspacesLayer();
