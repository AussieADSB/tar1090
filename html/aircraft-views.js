"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AircraftViews {
    constructor() {
        this.selectedAircraft = [];
        this.mostViewed = [];
        this.pollIntervalMs = 10000;
        this.maxCount = 10;
        this.aircraftSelectCount = 0;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            eventTarget.addEventListener(eventTypes.aircraftSelected, () => __awaiter(this, void 0, void 0, function* () {
                if (SelectedPlane && !this.selectedAircraft.includes(SelectedPlane.icao)) {
                    this.selectedAircraft.push(SelectedPlane.icao);
                    this.aircraftSelectCount++;
                    if (gtag) {
                        gtag("event", "aircraft_select", {
                            'icao': SelectedPlane.icao,
                            'registration': SelectedPlane.registration,
                            'callsign': SelectedPlane.name,
                            'type': SelectedPlane.icaoType,
                            'ownOp': SelectedPlane.ownOp,
                            'military': SelectedPlane.military,
                            'interesting': SelectedPlane.interesting,
                            'selectCount': this.aircraftSelectCount
                        });
                    }
                }
            }));
            const fetchDoneHandler = () => __awaiter(this, void 0, void 0, function* () {
                eventTarget.removeEventListener(eventTypes.fetchDone, fetchDoneHandler);
                yield $.ajax("/api/aircraft-view/most-viewed", {
                    type: "GET",
                    success: (response) => {
                        this.mostViewed = this.mapViewedAircraft(response);
                        this.refreshUi();
                    }
                });
            });
            eventTarget.addEventListener(eventTypes.fetchDone, fetchDoneHandler);
            eventTarget.addEventListener(eventTypes.planeTableRefreshDone, () => this.refreshUi());
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                yield this.sendView();
            }), this.pollIntervalMs);
        });
    }
    sendView() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                currentlySelectedAircraftIcao: SelectedPlane === null || SelectedPlane === void 0 ? void 0 : SelectedPlane.icao,
                selectedAircraftIcaos: this.selectedAircraft
            };
            yield $.ajax("/api/aircraft-view/add", {
                type: "POST",
                data: JSON.stringify(request),
                contentType: "application/json",
                success: (response) => {
                    this.mostViewed = this.mapViewedAircraft(response);
                    this.refreshUi();
                }
            });
            this.selectedAircraft = [];
        });
    }
    mapViewedAircraft(response) {
        const mostViewedAircraft = [];
        let count = 0;
        for (let viewedAircraft of response) {
            const plane = g.planes[viewedAircraft.icao.toLowerCase()];
            if (plane === undefined)
                continue;
            mostViewedAircraft.push(new ViewedAircraft(plane, viewedAircraft.views));
            count++;
            if (count === this.maxCount)
                return mostViewedAircraft;
        }
        return mostViewedAircraft;
    }
    refreshUi() {
        const container = $("#most-watched-container");
        const table = $("<table/>");
        table.append($('#planesTable .aircraft_table_header').first().clone());
        for (let i = 0; i < this.mostViewed.length; i++) {
            const plane = this.mostViewed[i].plane;
            const row = $(plane.tr).clone();
            row.on("click", () => {
                selectPlaneByHex(plane.icao, { follow: true });
            });
            table.append(row);
        }
        container.html("");
        container.append(table);
    }
}
window.aircraftViews = new AircraftViews();
class ViewedAircraft {
    constructor(plane, views) {
        this.plane = plane;
        this.views = views;
    }
}
