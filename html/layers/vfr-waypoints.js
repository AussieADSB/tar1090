"use strict";
class VfrWaypointsLayer {
    addLayers() {
        $.getJSON("/api/data/vfr-waypoints", (data) => {
            const source = new ol.source.Vector({
                features: data.map((item) => new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([item[2][1], item[2][0]])),
                    code: item[0],
                    name: item[1]
                }))
            });
            let airportsGroup = layers.getArray().find(layer => layer.get('name') === 'navigation');
            airportsGroup.getLayers().push(new ol.layer.Vector({
                source: source,
                // @ts-ignore
                name: 'vfr_waypoints',
                title: 'VFR Waypoints',
                type: 'overlay',
                zIndex: 98,
                visible: true,
                style: function (feature) {
                    return new ol.style.Style({
                        image: new ol.style.Icon({
                            src: 'images/square_marker.png',
                            anchor: [0.5, 0.5],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction'
                        })
                    });
                }
            }));
        });
    }
}
window.vfrWaypointsLayer = new VfrWaypointsLayer();
