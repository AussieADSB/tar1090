const eventTarget = new EventTarget();
const events = {
    aircraftSelected: new Event('aircraftSelected'),
    fetchDone: new Event('fetchDone'),
    planeTableRefreshDone: new Event('planeTableRefreshDone')
}