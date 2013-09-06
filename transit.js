var transit = (function () {
    return {
        initMap : function (selector, stopsList, routePoints) {
            var mapDet = {
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            $(selector).append("<div id=\"timezone\"></div>")
                       .append("<div id=\"transitMap\"></div>");

            $(selector).css('position', 'relative');

            $(selector + "> #transitMap").css({
                'position': 'absolute',
                'width': '100%',
                'height': '100%',
            });

            $(selector + "> #timezone").css({
                'position': 'absolute',
                'bottom': '3%',
                'right': '0.8%',
                'z-index': '99',
                'font-family': '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
                'font-weight': 'bold',
                'font-size': '14px',
                'text-shadow': 'hsla(0,0%,40%,0.5) 0 -1px 0, hsla(0,0%,100%,.6) 0 2px 1px',
            });

            transit.initStatus(selector);
            transit.initTicker(selector);
            var map = new google.maps.Map(document.getElementById('transitMap'), mapDet);
            transit.initSearch(selector, stopsList, routePoints, map);

            return map;
        },

        initTicker : function (selector) {
            $(selector).append('<div id="ticker"></div>');

            $(selector + "> #ticker").append('<div id="checkpoint1"></div><br />')
                                     .append('<div id="checkpoint2"></div><br />')
                                     .append('<div id="checkpoint3"></div>');

            $(selector + "> #ticker").css({
                'position': 'absolute',
                'bottom': '1%',
                'left': '1%',
                'z-index': '99',
            });

            var firstCheckPoint = selector + '> #ticker > #checkpoint1';
            var secondCheckPoint = selector + '> #ticker > #checkpoint2';
            var thirdCheckPoint = selector + '> #ticker > #checkpoint3';
            var cpSelector = firstCheckPoint + ',' + secondCheckPoint + ',' + thirdCheckPoint;

            $(cpSelector).css({
                'background-color': 'hsl(0, 0%, 90%)',
                'font-family': '"Lucida Grande", "Lucida Sans Unicode", ' +
                               'Verdana, Arial, Helvetica, sans-serif',
                'font-size': '12px',
                '-webkit-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                '-moz-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'text-shadow': 'hsla(0,0%,40%,0.5) 0 -1px 0, hsla(0,0%,100%,.6) 0 2px 1px',
                'border-radius': '5px',
                'padding': '5px',
                'line-height': '235%',
                'display': 'none'
              });

            $(cpSelector).hover(function () {
                $(cpSelector).stop(true, true);

                if ($(firstCheckPoint).html()) $(firstCheckPoint).css('display', 'inline');
                if ($(secondCheckPoint).html()) $(secondCheckPoint).css('display', 'inline');
                if ($(thirdCheckPoint).html()) $(thirdCheckPoint).css('display', 'inline');
            }, function () {
                $(cpSelector).fadeOut(7500);
            });
        },

        initStatus : function (selector) {
            $(selector).append('<div id="status"></div>');

            $(selector + '> #status').css({
                'position': 'absolute',
                'bottom': '3%',
                'right': '0.8%',
                'z-index': '99',
                'background-color': 'hsl(0, 0%, 90%)',
                'font-family': '"Lucida Grande", "Lucida Sans Unicode", Verdana, Arial, Helvetica, sans-serif',
                'font-size': '12px',
                '-webkit-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                '-moz-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'text-shadow': 'hsla(0,0%,40%,0.5) 0 -1px 0, hsla(0,0%,100%,.6) 0 2px 1px',
                'border-radius': '5px',
                'padding': '10px',
                'display': 'none'
            });
        },

        initSearch : function (selector, stopsList, routePoints, map) {
            $('head').append('<link rel="stylesheet" ' +
                             'href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />');

            $.getScript("http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js", function () {
                $(selector).append("<input type=\"text\" id=\"search\" " +
                                    "placeholder=\"Search for a stop and select it from the dropdown.\">");

                $(selector + "> #search").css({
                    'position': 'absolute',
                    'width': '50%',
                    'height': '12px',
                    'top': '1%',
                    'left': '20%',
                    'z-index': '99',
                    'font-family': '"Lucida Grande", "Lucida Sans Unicode", Verdana,' +
                                   'Arial, Helvetica, sans-serif',
                    'font-size': '12px',
                    'border-radius': '5px',
                    'padding': '5px',
                });

                $(selector + "> #search").autocomplete({
                    source: stopsList,
                    select: function (event, ui) {
                        var coordsOfItem = routePoints[ui.item.value];
                        var zeroIn = new google.maps.LatLng(coordsOfItem.x, coordsOfItem.y);
                        map.setZoom(15);
                        map.setCenter(zeroIn);
                    }
                });

                $(selector + "> #search").focus(function () {
                    $(this).val('');
                });
            });
        },

        initMarker : function (coords, selector, mouseoverText, map, color) {
            mouseoverText = (typeof mouseoverText == 'undefined') ? 'Marker' : mouseoverText;
            var markerPos = new google.maps.LatLng(coords.x, coords.y);

            var markerIcon = {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 0.8,
                scale: 7
            };

            var marker = {
                position: markerPos,
                icon: markerIcon
            };

            marker = new google.maps.Marker(marker);

            google.maps.event.addListener(marker, 'mouseover', function () {
                $(selector + '> #status').stop(true, true);
                $(selector + '> #status').css('display', 'inline');
                $(selector + '> #status').html(mouseoverText);
            });

            google.maps.event.addListener(marker, 'mouseout', function () {
                $(selector + '> #status').css('display', 'none');
            });

            return marker;
        },

        overlayKml : function (kmlUrl, map) {
            var kmlOptions = {
                map: map
            };
            var kmlLayer = new google.maps.KmlLayer(kmlUrl, kmlOptions);
        },

        kmlPromise : function (kmlUrl) {
            return $.ajax({
                url: kmlUrl,
                dataType: 'xml',
                async: true
            });
        },

        jsonPromise : function (jsonUrl) {
            return $.ajax({
                url: jsonUrl,
                dataType: 'json',
                async: true
            });
        },

        routeParser : function (data) {
            var lines = {};
            var points = {};
            var stopNames = new Array();
            var xmlNode = $('Document', data);

            xmlNode.find('Placemark > LineString > coordinates').each(function () {
                var simPts = transit.trim($(this).text()).split(' ');
                var grpPts = new Array();
                var routeName = $(this).closest('Placemark').find('name').text().toLowerCase();
                for (eachPt in simPts) {
                    var xy = transit.strip(simPts[eachPt]).split(',');
                    grpPts.push({ x: parseFloat(xy[1], 10), y: parseFloat(xy[0], 10) });
                }
                lines[transit.trim(routeName)] = grpPts;
            });

            xmlNode.find('Point').each(function () {
                var parentTag = $(this).closest('Placemark');

                var xy = transit.strip(parentTag.find('Point').text()).split(',');
                var stopName = transit.trim(parentTag.find('name').text()).toLowerCase();
                stopNames.push(stopName);

                points[stopName] = {
                    x: parseFloat(xy[1], 10),
                    y: parseFloat(xy[0], 10)
                };
            });

            return {
                "lines": lines,
                "points": points,
                "stopnames": stopNames
            };
        },

        vehicleParser : function (data) {
            var vehicleObj = {};

            vehicleObj.timezone = data.timezone;
            vehicleObj.vehicles = data.vehicles;

            return vehicleObj;
        },

        schedule : function (vehicleObj, routes, timezone) {
            var vehicleArrivals = {};
            var vehicleDepartures = {};
            var vehicleTravelTimes = new Array();
            var vehicleTravelTimesAsStrings = new Array();
            var stopsObj = vehicleObj.stops;
            var noOfStops = vehicleObj.stops.length;
            var firstStop = stopsObj[0];
            var firstStopName = firstStop.name;
            var startTime = transit.parseTime(firstStop.departure, firstStop.day);
            var vehicleStopCoords = {};
            var points = routes.points;
            var opLine = routes.lines[vehicleObj.route.toLowerCase()];

            vehicleTravelTimesAsStrings.push(firstStop.departure);
            vehicleDepartures[startTime - startTime] = firstStopName;
            vehicleTravelTimes.push(startTime - startTime);
            vehicleStopCoords[firstStopName] = transit.resolvePointToLine(opLine, points[firstStopName.toLowerCase()]);

            for (var eachStop = 1; eachStop < noOfStops - 1; eachStop++) {
                var temp = stopsObj[eachStop];
                var tempName = temp.name;
                var currArrivalTime = transit.parseTime(temp.arrival, temp.day) - startTime;
                var currDepartureTime = transit.parseTime(temp.departure, temp.day) - startTime;
                vehicleArrivals[currArrivalTime] = tempName;
                vehicleDepartures[currDepartureTime] = tempName;
                vehicleTravelTimesAsStrings.push(temp.arrival, temp.departure);
                vehicleTravelTimes.push(currArrivalTime, currDepartureTime);
                vehicleStopCoords[tempName] = transit.resolvePointToLine(opLine, points[tempName.toLowerCase()]);
                var prevStop = vehicleStopCoords[stopsObj[eachStop - 1].name];
            }

            var lastStop = stopsObj[noOfStops - 1];
            var lastStopName = lastStop.name;
            var endTime = transit.parseTime(lastStop.arrival, lastStop.day) - startTime;
            vehicleArrivals[endTime] = lastStopName;
            vehicleTravelTimesAsStrings.push(lastStop.arrival);
            vehicleTravelTimes.push(endTime);
            vehicleStopCoords[lastStopName] = transit.resolvePointToLine(opLine, points[lastStopName.toLowerCase()]);

            var colors = ['red', 'blue', 'yellow', 'white', 'green', 'orange'];
            vehicleObj.color = colors[Math.floor(Math.random() * colors.length)];

            return {
                "name": vehicleObj.name,
                "color": vehicleObj.color,
                "starts": startTime,
                "baseinfo": transit.createBaseInfo(vehicleObj.name, firstStopName, firstStop.departure,
                                                   lastStopName, lastStop.arrival),
                "route": opLine,
                "stops": vehicleStopCoords,
                "days": lastStop.day - firstStop.day,
                "arrivals": vehicleArrivals,
                "departures": vehicleDepartures,
                "traveltimes": vehicleTravelTimes,
                "traveltimesasstrings": vehicleTravelTimesAsStrings
            };
        },

        strip : function (string) {
            return string.replace(/\s+/g, '').replace(/\n/g, '');
        },

        trim : function (string) {
            return string.replace(/^\s+|\s+$/g, '');
        },

        resolvePointToLine : function (line, point) {
            if (point.x == line[0].x && point.y == line[0].y)
                return point;
            var closestDist = transit.haversine(line[0], point).toFixed(20);
            var currPt = line[0];
            for (var count = 1; count < line.length; count++) {
                if (point.x == line[count].x && point.y == line[count].y)
                    return point;

                var currDist = transit.haversine(line[count], point).toFixed(20);

                if (closestDist > currDist) {
                    currPt = line[count];
                    closestDist = currDist;
                }
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

        pointsBetweenStops : function (route, start, end) {
            var startingAt = transit.indexOfCoordsObjInList(route, start);
            var endingAt = transit.indexOfCoordsObjInList(route, end);

            if (startingAt > endingAt)
                return route.slice(endingAt, startingAt + 1).reverse();
            else
                return route.slice(startingAt, endingAt + 1);
        },

        indexOfCoordsObjInList : function (list, coords) {
            for (var i = 0; i < list.length; i++) {
                if (coords.x == list[i].x && coords.y == list[i].y)
                    return i;
            }

            return -1;
        },

        hashOfPercentDists : function (points) {
            var start = points[0];
            var routeLength = points.length;
            var end = points[routeLength - 1];
            var distanceHash = {
                0 : points[0]
            };
            var distances = [0];
            var totalDist = 0;
            var percentages = new Array();

            for (var x = 0; x < routeLength - 1; x++) {
                totalDist += transit.haversine(points[x], points[x + 1]);
                distances.push(totalDist);
            }

            for (var x = 0; x < distances.length; x++) {
                var percentage = transit.percentInRange(0, totalDist, distances[x]);
                percentages.push(percentage);
                distanceHash[percentage] = points[x];
            }

            return {
                "percentages": percentages,
                "hash": distanceHash
            };
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
                    return -1;
            } else {
                if (typeof this[currentIndex - 1] !=  'undefined')
                    return [currentIndex - 1, currentIndex];
                else
                    return -1;
            }
        },

        parseTimeZone : function (timezone) {
            var timeOffset = new Date().getTimezoneOffset();

            var tzS = timezone.split(':');
            tzS = tzS.map(function (x) { return parseInt(x, 10); });

            return tzS[0] * 3600 + tzS[1] * 60 + timeOffset * 60;
        },

        parseTime : function (timeString, day) {
            var hms = timeString.split(':');
            hms = hms.map(function (x) { return parseInt(x, 10); });

            if (hms.length < 3)
                hms[2] = 0;

            return hms[0] * 3600 + hms[1] * 60 + hms[2] + (day - 1) * 86400;
        },

        currTime : function () {
            var t = new Date();
            return t.getHours().toString() + ":" +
                   t.getMinutes().toString() + ":" +
                   t.getSeconds().toString();
        },

        secondsToHours : function (timeInSeconds) {
            var absTime = Math.abs(timeInSeconds);
            var hours = parseInt(absTime / 3600 ) % 24;
            var minutes = parseInt(absTime / 60 ) % 60;
            var seconds = absTime % 60;

            var result = (hours < 10 ? "0" + hours : hours) + ":" +
                         (minutes < 10 ? "0" + minutes : minutes) + ":" +
                         (seconds  < 10 ? "0" + seconds : seconds);

            if (timeInSeconds >= 0)
                return result;
            else
                return "-" + result;
        },

        estimateCurrentPosition : function (vehicleObj, timezone) {
            var arrivals = vehicleObj.arrivals;
            var departures = vehicleObj.departures;
            var travelTimes = vehicleObj.traveltimes;
            var travelTimesAsStrings = vehicleObj.traveltimesasstrings;
            var noOfDays = vehicleObj.days;
            var starts = vehicleObj.starts;
            var route = vehicleObj.route;
            var stops = vehicleObj.stops;
            var positions = new Array();

            var timeOffset = new Date().getTimezoneOffset() * 60;
            var time = transit.currTime();

            for (var i = 1; i <= noOfDays + 1; i++) {
                var range = transit.enclosure.call(travelTimes, transit.parseTime(time, i) +
                                                   transit.parseTimeZone(timezone) - starts);

                var currPos = {
                    "stationaryAt": "",
                    "departureTime": 0,
                    "leaving": "",
                    "approaching": "",
                    "leftTime": 0,
                    "approachTime": 0,
                    "started": false,
                    "completed": false,
                    "justReached": false,
                    "justLeft": false,
                    "currentCoords": null
                };

                if (range[0] % 2 == 0 && range.length == 2) {
                    var leftTime = travelTimes[range[0]];
                    var approachTime = travelTimes[range[1]];
                    currPos.leftTime = travelTimesAsStrings[range[0]];
                    currPos.approachTime = travelTimesAsStrings[range[1]];
                    var leavingStop = departures[leftTime];
                    var approachingStop = arrivals[approachTime];
                    currPos.leaving = leavingStop;
                    currPos.approaching = approachingStop;
                    var leavingStopCoords = stops[leavingStop];
                    var approachingStopCoords = stops[approachingStop];
                    var timePercent = transit.percentInRange(travelTimes[range[0]], travelTimes[range[1]],
                                                             transit.parseTime(time, i) +
                                                             transit.parseTimeZone(timezone) - starts);
                    var pointsFromLtoA = transit.pointsBetweenStops(route, leavingStopCoords,
                                                                    approachingStopCoords);
                    var ps = transit.hashOfPercentDists(pointsFromLtoA);
                    var distHash = ps.hash;

                    var distList = ps.percentages;
                    var timeRange = transit.enclosure.call(distList, timePercent);
                    var bef = distList[timeRange[0]];
                    var af = distList[timeRange[1]];
                    var percent = transit.percentInRange(bef, af, timePercent);
                    currPos.currentCoords = transit.percentDist(distHash[bef], distHash[af], percent);
                } else {
                    if (range[0] % 2 != 0 && range.length == 2) {
                        currPos.stationaryAt = departures[travelTimes[range[1]]];
                        currPos.departureTime = travelTimesAsStrings[range[1]];
                        currPos.currentCoords = stops[currPos.stationaryAt];
                    } else if (range > 0 && range < travelTimes.length - 1) {
                        if (range % 2 != 0) {
                            currPos.justReached = true;
                            currPos.stationaryAt = departures[travelTimes[range + 1]];
                            currPos.departureTime = travelTimesAsStrings[range + 1];
                            currPos.currentCoords = stops[currPos.stationaryAt];
                        } else {
                            currPos.justLeft = true;
                            currPos.stationaryAt = departures[travelTimes[range]];
                            currPos.approachingStop = arrivals[travelTimes[range + 1]];
                            currPos.departureTime = travelTimesAsStrings[range];
                            currPos.approachTime = travelTimesAsStrings[range + 1];
                            currPos.currentCoords = stops[currPos.stationaryAt];
                        }
                    } else if (range == travelTimes.length - 1) {
                        currPos.completed = true;
                        currPos.stationaryAt = arrivals[travelTimes[range]];
                        currPos.currentCoords = stops[currPos.stationaryAt];
                    } else if (range == 0) {
                        currPos.started = true;
                        currPos.stationaryAt = departures[travelTimes[range]];
                        currPos.approachingStop = arrivals[travelTimes[range + 1]];
                        currPos.approachTime = travelTimesAsStrings[range + 1];
                        currPos.currentCoords = stops[currPos.stationaryAt];
                    }
                }

                if (currPos.currentCoords) positions.push(currPos);
            }

            return positions;
        },

        createBaseInfo : function (name, startpoint, starttime, endpoint, endtime) {
            return "<strong>Vehicle: </strong>" + name + "<br />" +
                   "<strong>Start: </strong>" + startpoint + " (" + starttime +
                   ")<br />" + "<strong>End: </strong>" + endpoint + " (" +
                   endtime + ")<br />";
        },

        createPositionInfo : function (base, position) {
            if (position.stationaryAt) {
                return base + "<strong>At: </strong>" + position.stationaryAt +
                       "<br />" + "<strong>Departure: </strong>" + position.departureTime;
            } else {
                return base +
                       "<strong>Left: </strong>" + position.leaving + " (" + position.leftTime +
                       ")" + "<br />" + "<strong>Approaching: </strong>" + position.approaching +
                       " (" + position.approachTime + ")";
            }
        },

        writeStatus : function (selector, htmlContent) {
            var firstChild = $(selector + '#checkpoint1');
            var secondChild = $(selector + '#checkpoint2');
            var thirdChild = $(selector + '#checkpoint3');

            firstChild.stop(true, true);
            firstChild.html(secondChild.html());
            if (firstChild.html()) firstChild.css('display', 'inline');
            firstChild.fadeOut(7500);

            secondChild.stop(true, true);
            secondChild.html(thirdChild.html());
            if (secondChild.html()) secondChild.css('display', 'inline');
            secondChild.fadeOut(7500);

            thirdChild.stop(true, true);
            thirdChild.html(htmlContent);
            if (thirdChild.html()) thirdChild.css('display', 'inline');
            thirdChild.fadeOut(7500);
        },

        main : function (selector, remoteKmlFile, routeObj, vehicleObj) {
            var map = transit.initMap(selector, routeObj.stopnames, routeObj.points);
            transit.overlayKml(remoteKmlFile, map);
            var routeLines = routeObj.lines;
            var routePoints = routeObj.points;
            var timezone = vehicleObj.timezone;
            var vehicles = vehicleObj.vehicles;
            var noOfVehicles = vehicles.length;

            $('#timezone').append("UTC" + timezone + "/Local+" +
                                  transit.secondsToHours(transit.parseTimeZone(timezone)));

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
                                var currPosition = currPositions[i];

                                if (!currPosition.currentCoords) continue;

                                if (currPosition.justReached) {
                                    transit.writeStatus(selector + '> #ticker > ',
                                                        "<strong>" + vehicle.name +
                                                        "</strong> just reached <strong>" +
                                                        currPosition.stationaryAt + "</strong>. " +
                                                        "Departs at: <strong>" + currPosition.departureTime +
                                                        "</strong>." );
                                } else if (currPosition.justLeft || currPosition.started) {
                                    var sOrL = currPosition.started ? 'just started from' : 'just left';
                                    transit.writeStatus(selector + '> #ticker > ',
                                                        "<strong>" + vehicle.name +
                                                        "</strong> " + sOrL + " <strong>" +
                                                        currPosition.stationaryAt + "</strong>. " +
                                                        "Next Stop: <strong>" + currPosition.approachingStop +
                                                        "</strong> at <strong>" + currPosition.approachTime +
                                                        "</strong>.");
                                } else if (currPosition.completed) {
                                    transit.writeStatus(selector + '> #ticker > ',
                                                        "<strong>" + vehicle.name +
                                                        "</strong> just reached its destination at <strong>" +
                                                        currPosition.stationaryAt + "</strong>.");
                                }

                                var mouseOverInfo = transit.createPositionInfo(vehicle.baseinfo, currPosition);
                                var currMarker = transit.initMarker(currPosition.currentCoords, selector,
                                                                    mouseOverInfo, map, vehicle.color);
                                currMarker.setMap(map);
                                vehicle.markers[i] = currMarker;
                            }
                        }
                    }, 1000);
        },

        initialize : function (selector, localKmlFile, remoteKmlFile, jsonFile) {
            google.maps.event.addDomListener(window, 'load',
                    function () {
                        var kml = transit.kmlPromise(localKmlFile);
                        var json = transit.jsonPromise(jsonFile);

                        kml.success(function (kmlData) {
                            json.success(function (jsonData) {
                                var routes = transit.routeParser(kmlData);
                                var vehicles = transit.vehicleParser(jsonData);
                                transit.main(selector, remoteKmlFile, routes, vehicles);
                            }).fail(function () {
                                $(selector).css('position', 'relative');
                                transit.initStatus(selector);
                                $(selector + '> #status').css('display', 'inline');
                                $(selector + '> #status').html('Oh Shoot, there was an error' +
                                                               'loading the JSON file.');
                            });
                        }).fail(function () {
                            $(selector).css('position', 'relative');
                            transit.initStatus(selector);
                            $(selector + '> #status').css('display', 'inline');
                            $(selector + '> #status').html('Oh Shoot, there was an error loading the KML file.');
                        });
                    });
        }
    };
})();
