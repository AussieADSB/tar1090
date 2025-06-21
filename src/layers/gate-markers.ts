class GateMarkersLayer {
    public addLayers() {
        $.getJSON("/api/data/gates", (data: any[][]) => {
            const source = new ol.source.Vector({
                features: data.map((item: any, i: number) => new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([item[1][1], item[1][0]])),
                    text: item[0],
                    zIndex: i},
                ))
            });

            let airportsGroup = layers.getArray().find(layer => layer.get('name') === 'airports') as ol.layer.Group;
            airportsGroup.getLayers().push(new ol.layer.Vector({
                source: source,
                // @ts-ignore
                name: 'gate_markers',
                title: 'Gate Markers',
                type: 'overlay',
                visible: true,
                minZoom: 15,
                zIndex: 98,
                style: function(feature) {
                    return [new ol.style.Style({
                        zIndex: feature.get('zIndex'),
                        image: new ol.style.Circle({
                            radius: 14,
                            fill: new ol.style.Fill({
                                color: 'black'
                            }),
                            stroke: new ol.style.Stroke({
                                color: '#f5a600',
                                width: 2
                            })
                        })
                    }),
                    new ol.style.Style({
                        zIndex: feature.get('zIndex'),
                        text: new ol.style.Text({
                            text: feature.get('text'),
                            font: `bold ${feature.get('text').length === 4 ? '10px' : '12px'} monospace`,
                            fill: new ol.style.Fill({
                                color: '#f5a600'
                            })
                        })
                    })]
                }
            }));
        });
    }
}

window.gateMarkersLayer = new GateMarkersLayer();