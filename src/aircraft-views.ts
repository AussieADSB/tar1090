class AircraftViews {
    private selectedAircraft: string[] = [];
    private mostViewed: ViewedAircraft[] = [];
    private pollIntervalMs = 10000;
    private maxCount = 10;
    private aircraftSelectCount = 0;

    public async init() {
        eventTarget.addEventListener(eventTypes.aircraftSelected, async () => {
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
        });

        const fetchDoneHandler = async () => {
            eventTarget.removeEventListener(eventTypes.fetchDone, fetchDoneHandler);

            await $.ajax("/api/aircraft-view/most-viewed",
                {
                    type: "GET",
                    success: (response: AussieADSB.Website.Models.ViewedAircraft[]) => {
                        this.mostViewed = this.mapViewedAircraft(response);
                        this.refreshUi();
                    }
                });
        }

        eventTarget.addEventListener(eventTypes.fetchDone, fetchDoneHandler);
        eventTarget.addEventListener(eventTypes.planeTableRefreshDone, () => this.refreshUi());

        setInterval(async () => {
            await this.sendView();
        }, this.pollIntervalMs);
    }

    private async sendView() {
        const request: AussieADSB.Website.Models.IAddViewRequest = {
            currentlySelectedAircraftIcao: SelectedPlane?.icao,
            selectedAircraftIcaos: this.selectedAircraft
        };

        await $.ajax("/api/aircraft-view/add", {
            type: "POST",
            data: JSON.stringify(request),
            contentType: "application/json",
            success: (response: AussieADSB.Website.Models.ViewedAircraft[]) => {
                this.mostViewed = this.mapViewedAircraft(response);
                this.refreshUi();
            }
        });

        this.selectedAircraft = [];
    }

    private mapViewedAircraft(response: AussieADSB.Website.Models.ViewedAircraft[]): ViewedAircraft[] {
        const mostViewedAircraft: ViewedAircraft[] = [];
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

    private refreshUi() {
        const container = $("#most-watched-container");

        const table = $("<table/>");

        table.append($('#planesTable .aircraft_table_header').first().clone());

        for (let i = 0; i < this.mostViewed.length; i++) {
            const plane = this.mostViewed[i].plane;

            const row = $(plane.tr).clone();
            row.on("click", () => {
                selectPlaneByHex(plane.icao, {follow: true});
            });

            table.append(row);
        }

        container.html("");
        container.append(table);
    }
}

window.aircraftViews = new AircraftViews();

class ViewedAircraft {
    plane: PlaneObject;
    views: number;

    constructor(plane: PlaneObject, views: number) {
        this.plane = plane;
        this.views = views;
    }
}