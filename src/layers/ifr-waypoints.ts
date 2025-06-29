class IfrWaypointsLayer {
    public addLayers() {
        $.getJSON("/api/data/ifr-waypoints", (data: any[][]) => {
            const source = new ol.source.Vector({
                features: data.map((item: any) => new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([item[1][1], item[1][0]])),
                    text: item[0]}
                ))
            });

            let airportsGroup = layers.getArray().find(layer => layer.get('name') === 'navigation') as ol.layer.Group;
            airportsGroup.getLayers().push(new ol.layer.Vector({
                source: source,
                // @ts-ignore
                name: 'ifr_waypoints',
                title: 'IFR Waypoints',
                type: 'overlay',
                zIndex: 98,
                visible: true,
                style: function(feature) {
                    return new ol.style.Style({
                        image: new ol.style.Icon({
                            src: 'images/triangle_marker.png',
                            anchor: [0.5, 0.5],
                            anchorXUnits: 'fraction',
                            anchorYUnits: 'fraction'
                        })
                    })
                }
            }));
        });
    }
}

window.ifrWaypointsLayer = new IfrWaypointsLayer();