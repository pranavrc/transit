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

        routeParser : function (xmlUrl) {
            var lines = {};
            var points = {};

            $.ajax({
                url: xmlUrl,
                dataType: 'xml',
                async: false,
                success : function (data) {
                    var xmlNode = $('Document', data);

                    xmlNode.find('Placemark > LineString > coordinates').each(function () {
                        var simPts = transit.trim($(this).text()).split(' ');
                        var grpPts = new Array();
                        var routeName = $(this).closest('Placemark').find('name').text().toLowerCase();
                        for (eachPt in simPts) {
                            var xy = transit.strip(simPts[eachPt]).split(',');
                            grpPts.push({ x: xy[0], y: xy[1] });
                        }
                        lines[transit.trim(routeName)] = grpPts;
                    });

                    xmlNode.find('Point').each(function () {
                        var parentTag = $(this).closest('Placemark');

                        var xy = transit.strip(parentTag.find('Point').text()).split(',');
                        points[transit.trim(parentTag.find('name').text()).toLowerCase()] = {
                            x: xy[0],
                            y: xy[1]
                        };
                    });
                },
                error : function (data) {
                    console.log('Error');
                }
            });

            return {
                "lines": lines,
                "points": points
            };
        },

        vehicleParser : function (jsonUrl) {
            var vehicleObj = {};

            $.ajax({
                url: jsonUrl,
                dataType: 'json',
                async: false,
                success : function (data) {
                    vehicleObj.timezone = data.timezone;
                    vehicleObj.vehicles = data.vehicles;
                },
                error : function (data) {
                    console.log('Error');
                }
            });

            return vehicleObj;
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
            var opLine = routes.lines[vehicleRoute.toLowerCase()];

            vehicleDepartures[startTime - startTime] = firstStopName;
            vehicleTravelTimes.push(startTime - startTime);
            vehicleStopCoords[firstStopName] = transit.resolvePointToLine(opLine, points[firstStopName]);

            for (var eachStop = 1; eachStop < noOfStops - 1; eachStop++) {
                var temp = stopsObj[eachStop];
                var tempName = temp.name.toLowerCase();
                var currArrivalTime = transit.parseTime(temp.arrival, temp.day, timezone) - startTime;
                var currDepartureTime = transit.parseTime(temp.departure, temp.day, timezone) - startTime;
                vehicleArrivals[currArrivalTime] = tempName;
                vehicleDepartures[currDepartureTime] = tempName;
                vehicleTravelTimes.push(currArrivalTime, currDepartureTime);
                vehicleStopCoords[tempName] = transit.resolvePointToLine(opLine, points[tempName]);
            }

            var lastStop = stopsObj[noOfStops - 1];
            var lastStopName = lastStop.name.toLowerCase();
            var endTime = transit.parseTime(lastStop.arrival, lastStop.day, timezone) - startTime;
            vehicleArrivals[endTime] = lastStopName;
            vehicleTravelTimes.push(endTime);
            vehicleStopCoords[lastStopName] = transit.resolvePointToLine(opLine, points[lastStopName]);
            var line = transit.pointsBetweenStops(opLine,
                                                  vehicleStopCoords[firstStopName],
                                                  vehicleStopCoords[lastStopName]);
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

        resolvePointToLine : function (line, point) {
            var closestDist = transit.linearDist(line[0], point);
            var currPt = line[0]
            for (var count = 1; count < line.length; count++) {
                var currDist = transit.linearDist(line[count], point);
                if (closestDist > currDist)
                    currPt = line[count];
            }

            return currPt;
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
                totalDist += transit.linearDist(points[x], points[x + 1]);
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
            var positions = new Array();

            var currPos = {
                "stationaryAt": "",
                "departureTime": 0,
                "leaving": "",
                "approaching": "",
                "leftTime": 0,
                "approachTime": 0,
                "currentCoords": null
            };

            var time = transit.currTime();

            for (var i = 1; i <= noOfDays + 1; i++) {
                var range = transit.enclosure.call(travelTimes, transit.parseTime(time, i, timezone));

                if (range[0] % 2 == 0 && range.length == 2) {
                    currPos.leftTime = travelTimes[range[0]];
                    currPos.approachTime = travelTimes[range[1]];
                    var leavingStop = departures[currPos.leftTime];
                    var approachingStop = arrivals[currPos.approachTime];
                    currPos.leaving = leavingStop;
                    currPos.approaching = approachingStop;

                    var timePercent = transit.percentInRange(travelTimes[range[0]], travelTimes[range[1]],
                                                             transit.parseTime(currTime, i, timezone));
                    var timeRange = transit.enclosure.call(ppoints, timePercent);
                    var percent = transit.percentInRange(ppoints[timeRange[0]],
                                                         ppoints[timeRange[1]], timePercentArray[i]);
                    currPos.currentCoords = transit.percentDist(ppoints[timeRange[0]],
                                                                ppoints[timeRange[1]], percent);
                } else {
                    if (typeof range[1] != 'undefined' && range[0] != 0) {
                        var currentStop = travelTimes[range[1]];
                        currPos.stationaryAt = departures[currentStop];
                        currPos.departureTime = currentStop;
                        currPos.currentCoords = stops[currentStop];
                    }
                }

                positions.push(currPos);
            }

            return positions;
        },

        mouseOverInfo : function (name, info, stationary, departTime, l, a, lT, aT) {
            var base = "Vehicle: " + name + "\n" + info + "\n";
            if (stationary) {
                return base + "\n" + "At: " + stationary + "\n" + "Departs: " + departTime;
            } else {
                return base +
                       "Leaving: " + l + "\n" + " (" + lT + ")" +
                       "Approaching: " + a + " (" + aT + ")";
            }
        },

        main : function (localKmlFile, remoteKmlFile, jsonFile) {
            var map = transit.initMap();
            transit.overlayKml(remoteKmlFile, map);
            var routeObj = transit.routeParser(localKmlFile);
            var routeLines = routeObj.lines;
            var routePoints = routeObj.points;
            var vehicleObj = transit.vehicleParser(jsonFile);
            var timezone = vehicleObj.timezone;
            var vehicles = vehicleObj.vehicles;
            var noOfVehicles = vehicles.length;

            for (var count = 0; count < noOfVehicles; count++) {
                vehicles[count] = transit.schedule(vehicles[count], routeObj, timezone);
            }

            var transition = setInterval(
                    function() {
                        for (var count = 0; count < noOfVehicles; count++) {
                            var vehicle = vehicles[count];

                            if (typeof vehicle.markers == "undefined") {
                                vehicle.markers = new Array();
                            } else {
                                for (var i = 0; i < vehicle.markers.length; i++) {
                                    vehicle.markers[i].setMap(null);
                                }
                            }

                            var currPositions = transit.estimateCurrentPosition(vehicle, timezone);

                            for (var i = 0; i < currPositions.length; i++) {
                                var currPosition = currPositions[0];

                                if (!currPosition.currentCoords) continue;

                                var mouseOverInfo = transit.mouseOverInfo(vehicle.name, vehicle.info,
                                                                          currPosition.stationaryAt,
                                                                          currPosition.departureTime,
                                                                          currPosition.leaving,
                                                                          currPosition.approaching,
                                                                          currPosition.leftTime,
                                                                          currPosition.approachTime);
                                var currMarker = transit.initMarker(currCoords[i], mouseOverInfo, map);
                                currMarker.setMap(map);
                                vehicle.markers[i] = currMarker;
                            }
                        }
                    }, 0);
        },

        initialize : function (localKmlFile, remoteKmlFile, jsonFile) {
            google.maps.event.addDomListener(window, 'load',
                    function () {
                        transit.main(localKmlFile, remoteKmlFile, jsonFile);
                    });
        }
    };
})();
