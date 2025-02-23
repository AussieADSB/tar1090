let selectedAircraft: string[] = [];
let mostViewed: ViewedAircraft[] = [];
const pollIntervalMs = 10000;
const maxCount = 10;

let uiContainer: JQuery;
let trayOpen = false;

(window as any).initAircraftViews = init;

async function init() {
    if (onMobile)
        return;

    eventTarget.addEventListener(events.aircraftSelected.type, async () => {
        if (SelectedPlane && !selectedAircraft.includes(SelectedPlane.icao))
            selectedAircraft.push(SelectedPlane.icao);
    });

    async function fetchDoneHandler() {
        eventTarget.removeEventListener(events.fetchDone.type, fetchDoneHandler);

        await $.ajax("/api/aircraft-view/most-viewed",
            {
                type: "GET",
                success: (response: AussieADSB.Website.Models.ViewedAircraft[]) => {
                    mostViewed = mapViewedAircraft(response);
                    refreshUi();
                }
            });
    }

    eventTarget.addEventListener(events.fetchDone.type, fetchDoneHandler);

    if (onMobile) {
        $(document.body).append(createMostWatchedMobile());
        $(document.body).append(createMostWatchedButtonMobile());
    }
    else {
        $(document.body).append(createMostWatchedDesktop());
    }

    setInterval(async () => {
        await sendView();
    }, pollIntervalMs);
}

async function sendView() {
    const request: AussieADSB.Website.Models.IAddViewRequest = {
        currentlySelectedAircraftIcao: SelectedPlane?.icao,
        selectedAircraftIcaos: selectedAircraft
    };

    await $.ajax("/api/aircraft-view/add", {
        type: "POST",
        data: JSON.stringify(request),
        contentType: "application/json",
        success: (response: AussieADSB.Website.Models.ViewedAircraft[]) => {
            mostViewed = mapViewedAircraft(response);
            refreshUi();
        }
    });

    selectedAircraft = [];
}

function mapViewedAircraft(response: AussieADSB.Website.Models.ViewedAircraft[]): ViewedAircraft[] {
    const mostViewedAircraft: ViewedAircraft[] = [];
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

    for (let i = 0; i < mostViewed.length; i++) {
        const plane = mostViewed[i].plane;

        if (onMobile) {
            table.append(createTableRowMobile(i + 1, plane));
        }
        else {
            table.append(createTableRowDesktop(i + 1, plane));
        }
    }

    container.html("");
    container.append(table);
}

function createMostWatchedDesktop() {
    uiContainer = $("<div></div>", { class: "vrs-map-element", id: "most-watched" });

    const map = $("#map_container");
    uiContainer.css("left", map.offset()!.left + 10);
    uiContainer.css("top", map.offset()!.top + 10);

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

function createTableRowDesktop(rank: number, plane: PlaneObject) {
    const summaryRow = $("<tr/>");

    summaryRow.append($("<td/>", { text: rank }));
    summaryRow.append($("<td/>", { text: plane.registration || "*" + plane.icao }));
    summaryRow.append($("<td/>", { text: plane.icaoType ?? "" }));
    summaryRow.append($("<td/>", { text: plane.name ?? "" }));

    const rows = [summaryRow];

    rows.forEach((row) => {
        row.on("click", () => {
            selectPlaneByHex(plane.icao, {follow: true});
        });
    });

    return rows;
}

function createTableRowMobile(rank: number, plane: PlaneObject) {
    const summaryRow = $("<tr/>");

    summaryRow.append($("<td/>", { text: rank }));
    summaryRow.append($("<td/>", { text: plane.registration || "*" + plane.icao }));
    summaryRow.append($("<td/>", { text: plane.icaoType ?? "" }));
    summaryRow.append($("<td/>", { text: plane.name ?? "" }));

    const opRow = $(`<tr><td colspan=4>${plane.ownOp}</td></tr>`);

    const rows = [summaryRow, opRow];

    rows.forEach((row) => {
        row.on("click", () => {
            closeTray();
            selectPlaneByHex(plane.icao, {follow: true});
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
    plane: PlaneObject;
    views: number;

    constructor(plane: PlaneObject, views: number) {
        this.plane = plane;
        this.views = views;
    }
}