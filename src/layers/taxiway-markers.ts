class TaxiwayMarkersLayer {
    public addLayers() {
        $.getJSON("/api/data/taxiways", (data: any[][]) => {
            const source = new ol.source.Vector({
                features: data.map((item: any) => new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([item[1][1], item[1][0]])),
                    text: item[0]}
                ))
            });

            let airportsGroup = layers.getArray().find(layer => layer.get('name') === 'airports') as ol.layer.Group;
            airportsGroup.getLayers().push(new ol.layer.Vector({
                source: source,
                // @ts-ignore
                name: 'taxiway_markers',
                title: 'Taxiway Markers',
                type: 'overlay',
                zIndex: 98,
                visible: true,
                minZoom: 15,
                style: function(feature) {
                    return new ol.style.Style({
                        text: new ol.style.Text({
                            text: feature.get("text"),
                            font: 'bold 12px Roboto, sans-serif',
                            overflow: true,
                            fill: new ol.style.Fill({
                                color: '#FFF'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#000',
                                width: 1
                            })
                        })
                    })
                }
            }));
        });
    }
}

window.taxiwayMarkersLayer = new TaxiwayMarkersLayer();