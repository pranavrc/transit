var transit = (function () {
    return {
        initMap : function () {
            var mapDet = {
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map = new google.maps.Map(document.getElementById('transitMap'), mapDet);
            return map;
        },

        initMarker : function (coords, mouseoverText, map) {
            mouseoverText = (typeof mouseoverText == 'undefined') ? 'Marker' : mouseoverText;
            var markerPos = new google.maps.LatLng(coords[0], coords[1]);

            var markerIcon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'red',
                fillOpacity: 0.8,
                scale: 5
            };

            var mouseoverInfo = new google.maps.InfoWindow({
                content: mouseoverText,
                map: map
            });

            var marker = {
                position: markerPos,
                title: mouseoverText,
                icon: markerIcon
            };

            marker = new google.maps.Marker(marker);

            google.maps.event.addListener(marker, 'mouseover', function() {
            	mouseoverInfo.open(map, this);
            });

            google.maps.event.addListener(marker, 'mouseout', function() {
            	mouseoverInfo.close();
            });

            return marker;
        },

        moveMarkers : function (markerSet, interval, map) {
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
                var markerObj = transit.initMarker(markers[counter].coords[0], markers[counter].title);
                var coordList = markers[counter].coords.slice(1);

                markerSet.push({
                    marker: markerObj,
                    coordSet: coordList
                });
            }
            return markerSet;
        },

        overlayKml : function (kmlUrl, map) {
            var kmlOptions = {
                map: map
            };
            var kmlLayer = new google.maps.KmlLayer(kmlUrl, kmlOptions);
        },

        init : function (kmlUrl, markerList, interval) {
            google.maps.event.addDomListener(window, 'load',
                    function () {
                        var map = transit.initMap();
                        transit.overlayKml(kmlUrl, map);
                        var markerSet = transit.constructMarkerSet(markerList);
                        transit.moveMarkers(markerSet, interval, map);
                    });
        },

        routeParser : function (xmlUrl) {
            $.ajax({
                url: xmlUrl,
                dataType: 'xml',
                success : function (data) {
                    var xmlNode = $('Document', data);
                    var lines = {};
                    var points = {};

                    xmlNode.find('Placemark > LineString > coordinates').each(function () {
                        var simPts = transit.trim($(this).text()).split(' ');
                        var grpPts = new Array();
                        var routeName = $(this).closest('Placemark').find('name').text().toLowerCase();
                        for (eachPt in simPts) {
                            var xy = transit.strip(simPts[eachPt]).split(',');
                            grpPts.push({ x: xy[0], y: xy[1] });
                        }
                        lines[routeName] = grpPts;
                    });

                    xmlNode.find('Point').each(function () {
                        var parentTag = $(this).closest('Placemark');

                        var xy = transit.strip(parentTag.find('Point').text()).split(',');
                        points[parentTag.find('name').text().toLowerCase()] = { x: xy[0], y: xy[1] };
                    });

                    return {
                        "lines": lines,
                        "points": points
                    };
                },
                error : function (data) {
                    console.log('Error');
                }
            });
        },

        vehicleParser : function (jsonUrl) {
            $.getJSON(jsonUrl).success(function (data) {
                return {
                    "timezone": data.timezone,
                    "vehicles": data.vehicles
                };
            });
        },

        schedule : function (vehicleObj, routes, timezone) {
            var vehicleArrivals = {};
            var vehicleDepartures = {};
            var vehicleTravelTimes = [];
            var vehicleRoute = vehicleObj.route;
            var stopsObj = vehicleObj.stops;
            var noOfStops = vehicleObj.stops.length;
            var firstStop = stopsObj[0];
            var firstStopName = firstStop.name.toLowerCase();
            var startTime = transit.parseTime(firstStop.departure, firstStop.day, timezone);
            var vehicleStopCoords = {};
            var points = routes.points;

            vehicleDepartures[startTime] = firstStopName;
            vehicleTravelTimes.push(startTime);
            vehicleStopCoords[firstStopName] = points[firstStopName];

            for (var eachStop = 1; eachStop < noOfStops - 1; eachStop++) {
                var temp = stopsObj[eachStop];
                var tempName = temp.name.toLowerCase();
                var currArrivalTime = transit.parseTime(temp.arrival, temp.day, timezone) - startTime;
                var currDepartureTime = transit.parseTime(temp.departure, temp.day, timezone) - startTime;
                vehicleArrivals[currArrivalTime] = tempName;
                vehicleDepartures[currDepartureTime] = tempName;
                vehicleTravelTimes.push(currArrivalTime, currDepartureTime);
                vehicleStopCoords[tempName] = points[tempName];
            }

            var lastStop = stopsObj[noOfStops];
            var lastStopName = lastStop.name.toLowerCase();
            var endTime = transit.parseTime(lastStop.arrival, lastStop.day, timezone) - startTime;
            vehicleArrivals[endTime] = lastStopName;
            vehicleTravelTimes.push(endTime);
            vehicleStopCoords[lastStopName] = points[lastStopName];
            var line = transit.pointsBetweenStops(routes.lines[vehicleRoute], points[firstStopName],
                                                  points[lastStopName]);
            var percentStopDists = transit.hashOfPercentDists(line);

            return {
                "name": vehicleObj.name,
                "info": vehicleObj.info,
                "route": line,
                "stops": vehicleStopCoords,
                "ppoints": percentStopDists,
                "days": lastStop.day - firstStop.day,
                "arrivals": vehicleArrivals,
                "departures": vehicleDepartures,
                "traveltimes": vehicleTravelTimes
            };
        },

        strip : function (string) {
            return string.replace(/\s+/g, '').replace(/\n/g, '');
        },

        trim : function (string) {
            return string.replace(/^\s+|\s+$/g, '');
        },

        // Reimplemented from http://www.movable-type.co.uk/scripts/latlong.html
        haversine : function (sourceCoords, targetCoords) {
            var R = 6371; // km

            /** Converts numeric degrees to radians */
            if (typeof(Number.prototype.toRad) === "undefined") {
              Number.prototype.toRad = function() {
                return this * Math.PI / 180;
              }
            }

            var dLat = (targetCoords.x - sourceCoords.x).toRad();
            var dLon = (targetCoords.y - sourceCoords.y).toRad();
            var lat1 = sourceCoords.x.toRad();
            var lat2 = targetCoords.x.toRad();

            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            var d = R * c;
            return d;
        },

        linearDist : function (sourceCoords, targetCoords) {
            return Math.sqrt(Math.pow((targetCoords.x - sourceCoords.x), 2),
                             Math.pow((targetCoords.y - sourceCoords.y), 2));
        },

        percentDist : function (sourceCoords, targetCoords, percentage) {
            var newCoords = {};
            var ratio = percentage / 100;
            newCoords.x = (1 - ratio) * sourceCoords.x + ratio * targetCoords.x;
            newCoords.y = (1 - ratio) * sourceCoords.y + ratio * targetCoords.y;
            return newCoords;
        },

        percentInRange : function (lower, upper, target) {
            return ((target - lower) / (upper - lower)) * 100;
        },

        pointsBetweenStops: function (route, start, end) {
            return route.slice(route.indexOf(start), route.indexOf(end) + 1);
        },

        hashOfPercentDists : function (points) {
            var start = points[0];
            var routeLength = points.length;
            var end = points[routeLength - 1];
            var distanceHash = {
                0 : points[0]
            };
            var distances = new Array();
            var totalDist = 0;

            for (var x = 0; x < routeLength - 1; x++) {
                totalDist += transit.haversine(points[x], points[x + 1]);
                distances.push(totalDist);
            }

            for (var x = 0; x < distances.length; x++) {
                distanceHash[transit.percentInRange(0, totalDist, distances[x])] = points[x + 1];
            }

            return distanceHash;
        },

        // Variant of binary search that returns enclosing elements of searchElement in array.
        enclosure : function (searchElement) {
            'use strict';

            var minIndex = 0;
            var maxIndex = this.length - 1;
            var currentIndex;
            var currentElement;

            while (minIndex <= maxIndex) {
                currentIndex = (minIndex + maxIndex) / 2 | 0;
                currentElement = this[currentIndex];

                if (currentElement < searchElement) {
                    minIndex = currentIndex + 1;
                }
                else if (currentElement > searchElement) {
                    maxIndex = currentIndex - 1;
                }
                else {
                    return currentIndex;
                }
            }

            if (searchElement > this[currentIndex]) {
                if (typeof this[currentIndex + 1] != 'undefined')
                    return [currentIndex, currentIndex + 1];
                else
                    return currentIndex;
            } else {
                if (typeof this[currentIndex - 1] !=  'undefined')
                    return [currentIndex - 1, currentIndex];
                else
                    return 0;
            }
        },

        parseTime : function (timeString, day, timezone) {
            var hms = timeString.split(':');
            hms = hms.map(function (x) { return parseInt(x, 10); });

            if (hms.length < 3)
                hms[2] = 0;

            return hms[0] * 3600 + hms[1] * 60 + hms[2] + (day - 1) * 86400 + timezone * 60;
        },

        currTime : function () {
            var t = new Date();
            return t.getHours().toString() + ":" +
                   t.getMinutes().toString() + ":" +
                   t.getSeconds().toString();
        },

        estimateCurrentPosition : function (vehicleObj, timezone) {
            var arrivals = vehicleObj.arrivals;
            var departures = vehicleObj.departures;
            var travelTimes = vehicleObj.traveltimes;
            var noOfDays = vehicleObj.days;
            var ppoints = vehicleObj.ppoints;

            var route = vehicleObj.route;
            var stops = vehicleObj.stops;
            var percentDists = transit.hashOfPercentDists(stops);

            var coords = new Array();
            var time = transit.currTime();
            var range = transit.enclosure.call(travelTimes, time);

            if (range[0] % 2 == 0 && range.length == 2) {
                var leavingStop = departures[range[0]];
                var approachingStop = arrivals[range[1]];
                var leavingStopCoords = stops[leavingStop];
                var approachingStop = stops[approachingStop];
                var timePercentArray = new Array();

                for (var i = 1; i <= noOfDays + 1; i++) {
                    timePercentArray.push(transit.percentInRange(travelTimes[range[0]], travelTimes[range[1]],
                                                                 transit.parseTime(currTime, i, timezone)));
                }

                for (var i = 0; i < timePercentArray.length; i++) {
                    var timeRange = transit.enclosure.call(ppoints, timePercentArray[i]);
                    var percent = transit.percentInRange(ppoints[timeRange[0]],
                                                         ppoints[timeRange[1]], timePercentArray[i]);
                    coords.push(transit.percentDist(ppoints[timeRange[0]], ppoints[timeRange[1]], percent));
                }
            } else {
                if (typeof range[1] != 'undefined')
                    coords.push(stops[departures[range[1]]]);
            }

            return coords;
        },

        mouseOverInfo : function (name, info, leaving, approaching, leftTime, approachTime) {
            return "Vehicle: " + name + "\n" + info + "\n" +
                   "Leaving: " + leaving + "\n" + " (" + leftTime + ")" +
                   "Approaching: " + approaching + " (" + approachTime + ")";
        }
    };
})();
