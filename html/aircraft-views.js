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
let selectedAircraft = [];
let mostViewed = [];
const pollIntervalMs = 10000;
const maxCount = 10;
let uiContainer;
let trayOpen = false;
window.initAircraftViews = init;
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        eventTarget.addEventListener(eventTypes.aircraftSelected, () => __awaiter(this, void 0, void 0, function* () {
            if (SelectedPlane && !selectedAircraft.includes(SelectedPlane.icao))
                selectedAircraft.push(SelectedPlane.icao);
        }));
        function fetchDoneHandler() {
            return __awaiter(this, void 0, void 0, function* () {
                eventTarget.removeEventListener(eventTypes.fetchDone, fetchDoneHandler);
                yield $.ajax("/api/aircraft-view/most-viewed", {
                    type: "GET",
                    success: (response) => {
                        mostViewed = mapViewedAircraft(response);
                        refreshUi();
                    }
                });
            });
        }
        eventTarget.addEventListener(eventTypes.fetchDone, fetchDoneHandler);
        eventTarget.addEventListener(eventTypes.planeTableRefreshDone, refreshUi);
        // if (onMobile) {
        //     $(document.body).append(createMostWatchedMobile());
        //     $(document.body).append(createMostWatchedButtonMobile());
        // }
        // else {
        //     $(document.body).append(createMostWatchedDesktop());
        // }
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            yield sendView();
        }), pollIntervalMs);
    });
}
function sendView() {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            currentlySelectedAircraftIcao: SelectedPlane === null || SelectedPlane === void 0 ? void 0 : SelectedPlane.icao,
            selectedAircraftIcaos: selectedAircraft
        };
        yield $.ajax("/api/aircraft-view/add", {
            type: "POST",
            data: JSON.stringify(request),
            contentType: "application/json",
            success: (response) => {
                mostViewed = mapViewedAircraft(response);
                refreshUi();
            }
        });
        selectedAircraft = [];
    });
}
function mapViewedAircraft(response) {
    const mostViewedAircraft = [];
    let count = 0;
    for (let viewedAircraft of response) {
        const plane = g.planes[viewedAircraft.icao.toLowerCase()];
        if (plane === undefined)
            continue;
        mostViewedAircraft.push(new ViewedAircraft(plane, viewedAircraft.views));
        count++;
        if (count === maxCount)
            return mostViewedAircraft;
    }
    return mostViewedAircraft;
}
function refreshUi() {
    const container = $("#most-watched-container");
    const table = $("<table/>");
    table.append($('#planesTable .aircraft_table_header').first().clone());
    for (let i = 0; i < mostViewed.length; i++) {
        const plane = mostViewed[i].plane;
        const row = $(plane.tr).clone();
        row.on("click", () => {
            selectPlaneByHex(plane.icao, { follow: true });
        });
        table.append(row);
        // if (onMobile) {
        //     table.append(createTableRowMobile(i + 1, plane));
        // }
        // else {
        //     table.append(createTableRowDesktop(i + 1, plane));
        // }
    }
    container.html("");
    container.append(table);
}
function createMostWatchedDesktop() {
    uiContainer = $("<div></div>", { class: "vrs-map-element", id: "most-watched" });
    const map = $("#map_container");
    uiContainer.css("left", map.offset().left + 10);
    uiContainer.css("top", map.offset().top + 10);
    const mwTitle = $("<p id='most-watched-title'><b>Most Watched Aircraft</b></p>");
    uiContainer.append(mwTitle);
    const mwBody = $("<div/>", { id: "most-watched-container" });
    uiContainer.append(mwBody);
    return uiContainer;
}
function createMostWatchedMobile() {
    uiContainer = $("<div/>", { id: "most-watched" });
    uiContainer.css("max-height", `calc(100% - ${getNavbarHeight()})`);
    uiContainer.css("top", getNavbarHeight());
    const mwHeader = $("<div/>", { id: "most-watched-header" });
    mwHeader.append($("<h3/>", { id: "most-watched-title", text: "Most Watched Aircraft" }));
    const mwCloseButton = $("<a/>", { id: "most-watched-close-button" }).on("click", closeTray);
    mwCloseButton.append($("<span/>", { text: "\u2A2F" }));
    mwHeader.append(mwCloseButton);
    uiContainer.append(mwHeader);
    const mwBody = $("<div/>", { id: "most-watched-container" });
    uiContainer.append(mwBody);
    return uiContainer;
}
function createMostWatchedButtonMobile() {
    const button = $("<div></div>", { class: "mapButton" });
    button.append($("<span>Most Watched</span>"));
    button.on("click", () => {
        if (trayOpen)
            closeTray();
        else
            openTray();
    });
    return button;
}
function createTableRowDesktop(rank, plane) {
    var _a, _b;
    const summaryRow = $("<tr/>");
    summaryRow.append($("<td/>", { text: rank }));
    summaryRow.append($("<td/>", { text: plane.registration || "*" + plane.icao.toUpperCase() }));
    summaryRow.append($("<td/>", { text: (_a = plane.icaoType) !== null && _a !== void 0 ? _a : "" }));
    summaryRow.append($("<td/>", { text: (_b = plane.name) !== null && _b !== void 0 ? _b : "" }));
    const rows = [summaryRow];
    rows.forEach((row) => {
        row.on("click", () => {
            selectPlaneByHex(plane.icao, { follow: true });
        });
    });
    return rows;
}
function createTableRowMobile(rank, plane) {
    var _a, _b;
    const summaryRow = $("<tr/>");
    summaryRow.append($("<td/>", { text: rank }));
    summaryRow.append($("<td/>", { text: plane.registration || "*" + plane.icao.toUpperCase() }));
    summaryRow.append($("<td/>", { text: (_a = plane.icaoType) !== null && _a !== void 0 ? _a : "" }));
    summaryRow.append($("<td/>", { text: (_b = plane.name) !== null && _b !== void 0 ? _b : "" }));
    const opRow = $(`<tr><td colspan=4>${plane.ownOp}</td></tr>`);
    const rows = [summaryRow, opRow];
    rows.forEach((row) => {
        row.on("click", () => {
            closeTray();
            selectPlaneByHex(plane.icao, { follow: true });
        });
    });
    return rows;
}
function openTray() {
    uiContainer.css("transform", "translateX(0)");
    uiContainer.css("-webkit-transform", "translateX(0)");
    trayOpen = true;
}
function closeTray() {
    uiContainer.css("transform", "translateX(-100%)");
    uiContainer.css("-webkit-transform", "translateX(-100%)");
    trayOpen = false;
}
class ViewedAircraft {
    constructor(plane, views) {
        this.plane = plane;
        this.views = views;
    }
}
