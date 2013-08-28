var layout = (function () {
    var map = null;

    return {
        initMap : function () {
            var mapDet = {
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(document.getElementById('transitMap'), mapDet);
            return map;
        },

        initMarker : function (coords, hoverText) {
            hoverText = (typeof hoverText == 'undefined') ? 'Marker' : hoverText;
            var markerPos = new google.maps.LatLng(coords[0], coords[1]);

            var markerIcon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'black',
                fillOpacity: 0.8,
                scale: 4
            };

            var marker = {
                position: markerPos,
                title: hoverText,
                icon: markerIcon
            };

            marker = new google.maps.Marker(marker);
            return marker;
        },

        moveMarkers : function (markerSet, interval) {
            interval = (typeof interval == 'undefined') ? 1000 : interval;
            var transition = setInterval(
                    function () {
                        for (var counter = 0; counter < markerSet.length; counter++) {
                            for (var i = 0; i < markerSet.length; i++) {
                                var curPos = new google.maps.LatLng(markerSet[i].coordSet[counter][0],
                                    markerSet[i].coordSet[counter][1]);
                                markerSet[i].marker.position = curPos;
                                markerSet[i].marker.setMap(map);
                            }
                        }
                    },
                    interval);
        },

        constructMarkerSet : function (markers) {
            var markerSet = new Array();
            for (var counter = 0; counter < markers.length; counter++) {
                markerObj = layout.initMarker(markers[counter].coords[0], markers[counter].hoverText);
                coordList = markers[counter].coords.slice(1);

                markerSet.push({
                    marker: markerObj,
                    coordSet: coordList
                });
            }
            return markerSet;
        },

        overlayKml : function (kmlUrl) {
            var kmlOptions = {
                map: map
            };
            var kmlLayer = new google.maps.KmlLayer(kmlUrl, kmlOptions);
        },

        init : function (kmlUrl, markerList, interval) {
            google.maps.event.addDomListener(window, 'load',
                    function () {
                        map = layout.initMap();
                        layout.overlayKml(kmlUrl);
                        var markerSet = layout.constructMarkerSet(markerList);
                        layout.moveMarkers(markerSet, interval);
                    });
        }
    };
})();

var processRoute = (function () {
    return {
        parseXml : function (xmlUrl) {
            $.ajax({
                url: xmlUrl,
                dataType: 'xml',
                success : function (data) {
                    var xmlNode = $('Document', data);
                    var lines = new Array();
                    xmlNode.find('Placemark > LineString > coordinates').each(function () {
                        lines.push($(this).text());
                    });
                },
                error : function (data) {
                    console.log('Error');
                }
            });
        }
    };
})();
