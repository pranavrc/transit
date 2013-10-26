/* transit-osm.js 0.1.0
 * (c) Pranav Ravichandran <me@onloop.net>
 * transit-osm.js carries the MIT license.
 * http://onloop.net/transit/
 */

var transit = (function () {
    return {
        // Get a selector div, a list of names of stops in the map, and the points of the stops,
        // and return a map object with a status and a search bar.
        initMap : function (selector, tileLayer, stopsList, routePoints, showLog, showSearch) {
            // Remove the initialization message before overlaying the map on the div.
            $(selector + "> #init").html('');

            $(selector).append("<div id=\"timezone\"></div>");
            $(selector + "> #timezone").css({
                'position': 'absolute',
                'bottom': '3%',
                'right': '0.8%',
                'z-index': '99',
                'font-weight': 'bold',
            });

            $(selector).append("<div id=\"transitMap\"></div>");
            $(selector + "> #transitMap").css({
                'position': 'absolute',
                'width': '100%',
                'height': '100%',
            });

            if (showLog) {
                $(selector).append("<div id=\"toggleLog\">Start Logging</div>");
                $(selector + "> #toggleLog").css({
                    'position': 'absolute',
                    'bottom': '4%',
                    'left': '1%',
                    'z-index': '99',
                    'color': '#800000',
                    '-webkit-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                    '-moz-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                    'box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                    'background-color': 'hsl(0, 0%, 90%)',
                    'border-radius': '10px',
                    'padding': '10px',
                    'font-weight': 'bold',
                    'cursor': 'pointer',
                });

                // Open the log when the toggle button is clicked.
                $(selector + "> #toggleLog").click(function () {
                    transit.initTicker(selector);
                    var tickerDiv = selector + "> #tickerDiv";
                    $(tickerDiv).css('display', 'inline');
                    $(tickerDiv).fadeOut(5000);
                });

                transit.initStatus(selector);
            }

            var map = L.map('transitMap');
            tileLayer.addTo(map);
            if (showSearch) transit.initSearch(selector, stopsList, routePoints, map);

            return map;
        },

        // Initialize the ticker that shows a log of events.
        initTicker : function (selector) {
            $(selector).append('<div id="tickerDiv"><span style="color:#800000"><strong>Transit Log</span>' +
                               '<br /><br /></strong><div id="ticker"></div><br /><div id="tickerCtrl">' +
                               '<span id="clear"><strong>Reset</strong></span> | ' +
                               '<span id="stop"><strong>Stop logging</span></div></div>');
            var tickerDiv = selector + "> #tickerDiv";
            var ticker = tickerDiv + "> #ticker";
            var tickerCtrl = tickerDiv + "> #tickerCtrl";
            var clear = tickerCtrl + "> #clear";
            var stop = tickerCtrl + "> #stop";
            // Clear the toggle button when the log is active.
            $(selector + "> #toggleLog").css('display', 'none');

            $(tickerDiv).css({
                'position': 'absolute',
                'bottom': '1%',
                'left': '1%',
                'width': '40%',
                'z-index': '99',
                'background-color': 'hsl(0, 0%, 90%)',
                'height': '38%',
                '-webkit-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                '-moz-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'border-radius': '10px',
                'padding': '10px',
                'text-align': 'center',
                'overflow-y': 'auto',
                'overflow-x': 'auto',
                'display': 'none'
            });

            $(ticker).css({
                'height': '75%',
                'overflow-y': 'auto',
                'overflow-x': 'auto',
                'text-align': 'left',
                'line-height': '150%'
            });

            $(tickerCtrl).css({
                'cursor': 'pointer',
                'color': '#800000'
            });

            // Clear/reset the log.
            $(clear).click(function () {
                $(ticker).html('');
            });

            // Remove the log and show the toggle button.
            $(stop).click(function () {
                $(tickerDiv).remove();
                $(selector + "> #toggleLog").css('display', 'inline');
            });

            // Show log on mouseover, and fade it out on mouseout.
            $(tickerDiv).hover(function () {
                $(tickerDiv).stop(true, true);
                $(tickerDiv).css('display', 'inline');
            }, function () {
                $(tickerDiv).fadeOut(5000);
            });
        },

        // Initialize a status div to show error messages and vehicle details
        // on the bottom right corner.
        initStatus : function (selector) {
            $(selector).append('<div id="status"></div>');

            $(selector + '> #status').css({
                'position': 'absolute',
                'bottom': '3%',
                'right': '0.8%',
                'z-index': '99',
                'background-color': 'hsl(0, 0%, 90%)',
                '-webkit-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                '-moz-box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'box-shadow': '0px 0px 8px rgba(0, 0, 0, 0.3)',
                'border-radius': '5px',
                'padding': '10px',
                'display': 'none'
            });
        },

        // Initialize a search box that takes a list of names of stops, and their coordinates.
        // Autocompletes on key down from the list of stops. Zooms into the respective coordinates
        // of a stop, when selected.
        initSearch : function (selector, stopsList, routePoints, map) {
            $('head').append('<link rel="stylesheet" ' +
                             'href="http://code.jquery.com/ui/1.10.3/themes/smoothness/jquery-ui.css" />');

            $.getScript("http://ajax.googleapis.com/ajax/libs/jqueryui/1.10.3/jquery-ui.min.js", function () {
                $(selector).append("<input type=\"text\" id=\"search\" " +
                                    "placeholder=\"Search for a stop and select it from the dropdown.\">");
                var searchDiv = selector + "> #search";

                $(searchDiv).css({
                    'position': 'absolute',
                    'width': '50%',
                    'height': '13px',
                    'top': '1%',
                    'left': '25%',
                    'z-index': '99',
                    'border-radius': '5px',
                    'padding': '5px',
                });

                $(searchDiv).autocomplete({
                    source: stopsList,
                    select: function (event, ui) {
                        var coordsOfItem = routePoints[ui.item.value];
                        var zeroIn = new L.LatLng(coordsOfItem.x, coordsOfItem.y);
                        map.setView(zeroIn, 15);
                    }
                });

                // Style the dropdown using a predefined jquery-ui class.
                $('.ui-autocomplete').css({
                    'max-height': '50%',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden',
                    'padding-right': '20px'
                });
            });
        },

        // Initialize a marker at a point specified by the coords parameter in the map.
        initMarker : function (coords, selector, map, color) {
            var markerPos = new L.LatLng(coords.x, coords.y);

            marker = new L.CircleMarker(markerPos, {
                radius: 7,
                color: 'black',
                opacity: 1,
                weight: 7,
                fill: true,
                fillColor: color,
                fillOpacity: 0.7
            });

            return marker;
        },

        // Event handlers for marker mouseover, like infowindow popups and status messages.
        onMarkerMouseover : function (selector, map, marker, mouseoverText, showLog) {
            if (showLog) {
                // Clear all listeners so they don't accumulate.
                marker.removeEventListener('mouseover');
                marker.removeEventListener('mouseout');

                L.DomEvent.addListener(marker, 'mouseover', function () {
                    $(selector + '> #status').stop(true, true);
                    $(selector + '> #status').css('display', 'inline');
                    $(selector + '> #status').html(mouseoverText);
                });

                L.DomEvent.addListener(marker, 'mouseout', function () {
                    $(selector + '> #status').css('display', 'none');
                });
            }

            if (typeof marker.popup != "undefined") {
                // Update content of existing infowindow.
                marker.popup.setContent(mouseoverText);
            } else {
                marker.unbindPopup();
                marker.popup = new L.Popup().setContent(mouseoverText);

                // Open an infowindow on clicking a marker.
                marker.bindPopup(marker.popup);

                // Close all info windows on clicking anywhere on the map.
                L.DomEvent.addListener(map, 'click', function () {
                    map.closePopup();
                });
            }
        },

        // Take a KML file in a public domain and overlay it on the map.
        overlayKml : function (kmlUrl, map) {
            var kmlLayer = new L.KML(kmlUrl, {async: true});
            kmlLayer.on("loaded", function (e) { map.fitBounds(e.target.getBounds()); });

            map.addLayer(kmlLayer);
            map.addControl(new L.Control.Layers({}, {'Show Routes': kmlLayer}));
        },

        // AJAX promise for doing stuff with the kml data later.
        kmlPromise : function (kmlUrl) {
            return $.ajax({
                url: kmlUrl,
                dataType: 'xml',
                async: true
            });
        },

        // AJAX promise bla json bla.
        jsonPromise : function (jsonUrl) {
            return $.ajax({
                url: jsonUrl,
                dataType: 'json',
                async: true
            });
        },

        // Take KML data and parse it to get a list of stop names, an object of line name-coordinates,
        // and an object of stopname - points.
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

        // Take JSON schedule data and return a list of vehicle objects,
        // the timezone of the map and the default stop interval for the vehicles
        // if specified.
        vehicleParser : function (data) {
            var vehicleObj = {};

            vehicleObj.timezone = data.timezone;
            vehicleObj.vehicles = data.vehicles;
            vehicleObj.stopinterval = data.defaultstopinterval;

            return vehicleObj;
        },

        // Takes a vehicleParser output object, a routeParser output object,
        // and builds another object to be used by the estimator (estimateCurrentPosition).
        // Contains keys such as time-adjusted traveltimes, arrival times, departure times et al.
        scheduler : function (vehicleObj, routes, stopinterval) {
            var vehicleArrivals = {};
            var vehicleDepartures = {};
            var vehicleTravelTimes = new Array();
            var vehicleTravelTimesAsStrings = new Array();
            var stopsObj = vehicleObj.stops;
            var noOfStops = vehicleObj.stops.length;
            var firstStop = stopsObj[0];
            var firstStopName = firstStop.name;

            // Throw error if the first stop's departure isn't mentioned.
            if (typeof firstStop.departure == 'undefined')
                throw new Error(vehicleObj.name + " is missing its initial departure time at " + firstStopName);

            var startTime = transit.parseTime(firstStop.departure.time, firstStop.departure.day);
            var vehicleStopCoords = {};
            var points = routes.points;
            var opLine = routes.lines[vehicleObj.route.toLowerCase()];

            // Error if vehicle's travelling on a non-existent route.
            if (typeof opLine == "undefined")
                throw new Error(vehicleObj.name + "'s route " + vehicleObj.route + " doesn't exist.");

            vehicleTravelTimesAsStrings.push(firstStop.departure.time);
            vehicleDepartures[startTime - startTime] = firstStopName;
            vehicleTravelTimes.push(startTime - startTime);

            try {
                // If the user's not placed a marker exactly on the line, resolve the marker to a point on the line.
                vehicleStopCoords[firstStopName] = transit.resolvePointToLine(opLine,
                                                                              points[firstStopName.toLowerCase()]);
            } catch (err) {
                // Invalid stop name error.
                throw new Error("The stop " + firstStopName + " in vehicle " +
                                vehicleObj.name + "'s schedule wasn't found in its route.");
            }

            for (var eachStop = 1; eachStop < noOfStops - 1; eachStop++) {
                var temp = stopsObj[eachStop];
                var prevStop = stopsObj[eachStop - 1];
                var tempName = temp.name;

                // If arrival time isn't specified, calculate it from the defaultstopinterval
                // and the departure time specified.
                if (typeof temp.arrival == 'undefined') {
                    var currDepartureTime = transit.parseTime(temp.departure.time, temp.departure.day) -
                                            startTime;
                    var currArrivalTime = currDepartureTime - transit.parseTime(stopinterval, 1);
                    temp.arrival = {};
                    temp.arrival.time = transit.secondsToHours(currArrivalTime + startTime).replace('+', '');
                    temp.arrival.day = Math.ceil((currArrivalTime + startTime) / 86400);
                } else {
                    var currArrivalTime = transit.parseTime(temp.arrival.time, temp.arrival.day) -
                                          startTime;
                }

                // Do the same as above with departure times.
                if (typeof temp.departure == 'undefined') {
                    var currArrivalTime = transit.parseTime(temp.arrival.time, temp.arrival.day) - startTime;
                    var currDepartureTime = currArrivalTime + transit.parseTime(stopinterval, 1);
                    temp.departure = {};
                    temp.departure.time = transit.secondsToHours(currDepartureTime + startTime).replace('+', '');
                    temp.departure.day = Math.ceil((currDepartureTime + startTime) / 86400);
                } else {
                    var currDepartureTime = transit.parseTime(temp.departure.time, temp.departure.day) -
                                            startTime;
                }

                vehicleTravelTimesAsStrings.push(temp.arrival.time, temp.departure.time);
                vehicleArrivals[currArrivalTime] = tempName;
                vehicleDepartures[currDepartureTime] = tempName;
                vehicleTravelTimes.push(currArrivalTime, currDepartureTime);

                try {
                    vehicleStopCoords[tempName] = transit.resolvePointToLine(opLine,
                                                                             points[tempName.toLowerCase()]);
                } catch (err) {
                    throw new Error("The stop " + tempName + " in vehicle " +
                                    vehicleObj.name + "'s schedule wasn't found in its route.");
                }
            }

            var lastStop = stopsObj[noOfStops - 1];
            var lastStopName = lastStop.name;

            // Error if reaching time isn't specified.
            if (typeof lastStop.arrival == 'undefined')
                throw new Error(vehicleObj.name + " is missing its final arrival time at " + lastStopName);

            var endTime = transit.parseTime(lastStop.arrival.time, lastStop.arrival.day) - startTime;
            vehicleArrivals[endTime] = lastStopName;
            vehicleTravelTimesAsStrings.push(lastStop.arrival.time);
            vehicleTravelTimes.push(endTime);

            // If the vehicle has a schedule that's going in reverse, throw an error.
            if (!transit.isSorted(vehicleTravelTimes))
                throw new Error(vehicleObj.name + " seems to be going backwards in time.");

            try {
                vehicleStopCoords[lastStopName] = transit.resolvePointToLine(opLine,
                                                                             points[lastStopName.toLowerCase()]);
            } catch (err) {
                throw new Error("The stop " + lastStopName + " in vehicle " +
                                vehicleObj.name + "'s schedule wasn't found in its route.");
            }

            // Thanks to https://gist.github.com/bobspace/2712980 for the color list.
            var colors = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black",
                          "BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse",
                          "Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan",
                          "DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta",
                          "DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen",
                          "DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink",
                          "DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen",
                          "Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow",
                          "HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush",
                          "LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow",
                          "LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen",
                          "LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime",
                          "LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid",
                          "MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise",
                          "MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy",
                          "OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen",
                          "PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue",
                          "Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen",
                          "SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow",
                          "SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat",
                          "White","WhiteSmoke","Yellow","YellowGreen"];

            // Assign a distinct color for each vehicle. This helps track the vehicle and
            // since transit returns multiple markers for vehicles travelling over multiple days,
            // it helps track other markers associated with the same vehicle.
            vehicleObj.color = colors[Math.floor(Math.random() * colors.length)];

            return {
                "name": vehicleObj.name,
                "info": vehicleObj.info,
                "color": vehicleObj.color,
                "starts": startTime,
                // Create basic information about the vehicle.
                "baseinfo": transit.createBaseInfo(vehicleObj.name, vehicleObj.info,
                                                   firstStopName, firstStop.departure.time,
                                                   lastStopName, lastStop.arrival.time),
                "route": opLine,
                "stops": vehicleStopCoords,
                "days": lastStop.arrival.day - firstStop.departure.day,
                "arrivals": vehicleArrivals,
                "departures": vehicleDepartures,
                "traveltimes": vehicleTravelTimes,
                "traveltimesasstrings": vehicleTravelTimesAsStrings
            };
        },

        // Remove newlines and whitespaces.
        strip : function (string) {
            return string.replace(/\s+/g, '').replace(/\n/g, '');
        },

        // Remove leading and trailing whitespaces.
        trim : function (string) {
            return string.replace(/^\s+|\s+$/g, '');
        },

        // Return true if a list is sorted. False if not.
        // Acts as a helper to check if a vehicle's schedule is chronologically ordered.
        isSorted : function (list) {
            for (var i = 0; i < list.length - 1; i++) {
                if (list[i] > list[i+1]) return false;
            }

            return true;
        },

        // Take a line [(x1,y1),(x2,y2)..(xn,yn)] and a point (x,y).
        // Return the point on the line that's closest to (x,y).
        resolvePointToLine : function (line, point) {
            if (point.x == line[0].x && point.y == line[0].y)
                return point;
            var closestDist = transit.linearDist(line[0], point).toFixed(20);
            var currPt = line[0];
            for (var count = 1; count < line.length; count++) {
                if (point.x == line[count].x && point.y == line[count].y)
                    return point;

                var currDist = transit.linearDist(line[count], point).toFixed(20);

                if (closestDist > currDist) {
                    currPt = line[count];
                    closestDist = currDist;
                }
            }

            return currPt;
        },

        // Reimplemented from http://www.movable-type.co.uk/scripts/latlong.html
        // Calculate great circle distance between two coordinates.
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

        // Calculate linear distance on a plane between two points (x1,y1) and (x2,y2).
        linearDist : function (sourceCoords, targetCoords) {
            return Math.sqrt(Math.pow((targetCoords.x - sourceCoords.x), 2) +
                             Math.pow((targetCoords.y - sourceCoords.y), 2));
        },

        // Take two coordinates (x1,y1), (x2,y2) and a percentage. Return the coordinates that
        // are on the line between (x1,y1) and (x2,y2) at percentage%.
        percentDist : function (sourceCoords, targetCoords, percentage) {
            var newCoords = {};
            var ratio = percentage / 100;
            newCoords.x = (1 - ratio) * sourceCoords.x + ratio * targetCoords.x;
            newCoords.y = (1 - ratio) * sourceCoords.y + ratio * targetCoords.y;
            return newCoords;
        },

        // Opposite of percentDist(). Take two values and return the percentage of target
        // value in the range.
        percentInRange : function (lower, upper, target) {
            return ((target - lower) / (upper - lower)) * 100;
        },

        // Take a list of coordinates in the route, and slice the list between start and end.
        // If the start is after the end, make sure the slicing goes well by swapping.
        pointsBetweenStops : function (route, start, end) {
            var startingAt = transit.indexOfCoordsObjInList(route, start);
            var endingAt = transit.indexOfCoordsObjInList(route, end);

            if (startingAt > endingAt)
                return route.slice(endingAt, startingAt + 1).reverse();
            else
                return route.slice(startingAt, endingAt + 1);
        },

        // Since indexOf() doesn't work for objects, make a substitute function to return
        // the index of a coordinates (x,y) object in a list.
        indexOfCoordsObjInList : function (list, coords) {
            for (var i = 0; i < list.length; i++) {
                if (coords.x == list[i].x && coords.y == list[i].y)
                    return i;
            }

            return -1;
        },

        // Take a list of coordinates, and return the percentage distances of each
        // point in the list from start to end.
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
                totalDist += transit.linearDist(points[x], points[x + 1]);
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

        // Take a timezone string and return the difference in seconds
        // between the client's timezone and the given timezone.
        parseTimeZone : function (timezone) {
            var timeOffset = new Date().getTimezoneOffset();

            var tzS = timezone.split(':');
            tzS = tzS.map(function (x) { return parseInt(x, 10); });

            if (tzS.length < 3)
                tzS[2] = 0;

            if (tzS[0] < 0) {
                tzS[1] *= -1;
                tzS[2] *= -1;
            }

            return tzS[0] * 3600 + tzS[1] * 60 + tzS[2] + timeOffset * 60;
        },

        // Take a timezone string and return the day in the timezone by calculating
        // the offset between client timezone and target timezone. Returns 0 - 6
        // based on the index of the day in the week. 0 being Sunday and 6 being Saturday.
        dayInTimezone : function (timezone) {
            var difference = Math.ceil((transit.parseTime(transit.currTime(), 1) +
                                        transit.parseTimeZone(timezone)) / 86400) - 1;
            var currDay = new Date().getDay();
            var offset = currDay + difference;

            var dayIndex = (offset < 0) ? 6 + (offset % 7) : offset % 7;

            return dayIndex;
        },

        // Take a time string and a day and return the number of seconds from 00:00:00,
        // adding the respective number of days in seconds.
        parseTime : function (timeString, day) {
            var hmsRe = /^(?:2[0-3]|[01]?[0-9]):[0-5]?[0-9](:[0-5]?[0-9])?$/;

            if (!hmsRe.test(timeString))
                throw new Error(timeString + " is not a valid timestring.");

            var hms = timeString.split(':');
            hms = hms.map(function (x) { return parseInt(x, 10); });

            if (hms.length < 3)
                hms[2] = 0;

            return hms[0] * 3600 + hms[1] * 60 + hms[2] + (day - 1) * 86400;
        },

        // Return current time as a HH:MM:SS string.
        currTime : function () {
            var t = new Date();
            return t.getHours().toString() + ":" +
                   t.getMinutes().toString() + ":" +
                   t.getSeconds().toString();
        },

        // Convert seconds to a HH:MM:SS string.
        secondsToHours : function (timeInSeconds) {
            var absTime = Math.abs(timeInSeconds);
            var hours = parseInt(absTime / 3600 ) % 24;
            var minutes = parseInt(absTime / 60 ) % 60;
            var seconds = absTime % 60;

            var result = (hours < 10 ? "0" + hours : hours) + ":" +
                         (minutes < 10 ? "0" + minutes : minutes) + ":" +
                         (seconds  < 10 ? "0" + seconds : seconds);

            if (timeInSeconds >= 0)
                return "+" + result;
            else
                return "-" + result;
        },

        // Main estimator function. Takes an object returned by the scheduler.
        // From the client's current time, and the travel times of the target vehicle,
        // estimates the current position of the vehicle and returns the coordinates
        // of the marker that should be placed on the map.
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
                // Take the current time, adjust it to account for the timezone, and find out
                // where in the vehicle's journey it lies.
                var range = transit.enclosure.call(travelTimes, transit.parseTime(time, i) +
                                                   (transit.parseTimeZone(timezone) % 86400) - starts);

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

                // If the vehicle is moving between two stops.
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
                                                             (transit.parseTimeZone(timezone) % 86400) - starts);
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
                    // If the vehicle is stationary at a stop.
                    if (range[0] % 2 != 0 && range.length == 2) {
                        currPos.stationaryAt = departures[travelTimes[range[1]]];
                        currPos.departureTime = travelTimesAsStrings[range[1]];
                        currPos.currentCoords = stops[currPos.stationaryAt];
                    } else if (range > 0 && range < travelTimes.length - 1) {
                        if (range % 2 != 0) { // Vehicle just reached a stop.
                            currPos.justReached = true;
                            currPos.stationaryAt = departures[travelTimes[range + 1]];
                            currPos.departureTime = travelTimesAsStrings[range + 1];
                            currPos.currentCoords = stops[currPos.stationaryAt];
                        } else { // Vehicle just left a stop.
                            currPos.justLeft = true;
                            currPos.stationaryAt = departures[travelTimes[range]];
                            currPos.approachingStop = arrivals[travelTimes[range + 1]];
                            currPos.departureTime = travelTimesAsStrings[range];
                            currPos.approachTime = travelTimesAsStrings[range + 1];
                            currPos.currentCoords = stops[currPos.stationaryAt];
                        }
                    } else if (range == travelTimes.length - 1) { // Vehicle's done with its journey.
                        currPos.completed = true;
                        currPos.stationaryAt = arrivals[travelTimes[range]];
                        currPos.currentCoords = stops[currPos.stationaryAt];
                    } else if (range == 0) { // Vehicle just started on its journey.
                        currPos.started = true;
                        currPos.stationaryAt = departures[travelTimes[range]];
                        currPos.approachingStop = arrivals[travelTimes[range + 1]];
                        currPos.approachTime = travelTimesAsStrings[range + 1];
                        currPos.currentCoords = stops[currPos.stationaryAt];
                    }
                }

                positions.push(currPos);
            }

            return positions;
        },

        // Create a basic info string about a vehicle.
        createBaseInfo : function (name, info, startpoint, starttime, endpoint, endtime) {
            return "<strong>Vehicle: </strong>" + name + "<br />" +
                   ((typeof info != "undefined") ? "<strong>Info: </strong>" + info + "<br />" : "") +
                   "<strong>Start: </strong>" + startpoint + " (" + starttime +
                   ")<br />" + "<strong>End: </strong>" + endpoint + " (" +
                   endtime + ")<br />";
        },

        // Build on a vehicle's basic info and create position info based on the current position.
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

        // Write events to the ticker log.
        writeLog : function (selector, currPosition, vehicle) {
            var tickerDiv = selector + "> #tickerDiv";
            var ticker = tickerDiv + "> #ticker";

            if (!($(tickerDiv).length > 0) || !(currPosition.justReached ||
                currPosition.justLeft || currPosition.started || currPosition.completed)) return;

            $(tickerDiv).show();
            $(tickerDiv).stop(true, true);

            if (currPosition.justReached) {
                $(ticker).append("<em>" + transit.currTime() + "</em> | " +
                                 "<strong>" + vehicle.name + "</strong> just reached <strong>" +
                                 currPosition.stationaryAt + "</strong>. " +
                                 "Departs at: <strong>" + currPosition.departureTime + "</strong>.<br />");
            } else if (currPosition.justLeft || currPosition.started) {
                var sOrL = currPosition.started ? 'just started from' : 'just left';
                $(ticker).append("<em>" + transit.currTime() + "</em> | " +
                                 "<strong>" + vehicle.name + "</strong> " + sOrL + " <strong>" +
                                 currPosition.stationaryAt + "</strong>. " +
                                 "Next Stop: <strong>" + currPosition.approachingStop +
                                 "</strong> at <strong>" + currPosition.approachTime + "</strong>.<br />");
            } else if (currPosition.completed) {
                $(ticker).append("<em>" + transit.currTime() + "</em> | " +
                                 "<strong>" + vehicle.name +
                                 "</strong> just reached its destination at <strong>" +
                                 currPosition.stationaryAt + "</strong>.<br />");
            }

            $(tickerDiv).css('display','inline');
            $(ticker).scrollTop($(ticker)[0].scrollHeight);
            $(tickerDiv).fadeOut(5000);
        },

        // Recognize if client is using a handheld device. Some nasty useragent sniffing down here.
        // Taken from http://detectmobilebrowsers.com/
        isMobileDevice : function () {
            var userAgent = navigator.userAgent || navigator.vendor || window.opera;
            if(/(android|ipad|playbook|silk|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0,4)))
                return true;
            else
                return false;
        },

        // Sets the vehicles in motion. Continuously estimates positions of vehicles and moves markers to
        // the acquired coordinate positions. refreshInterval determines the time of waiting between two
        // cycles of movements.
        setInMotion : function (selector, refreshInterval, vehicles, noOfVehicles, stopinterval, timezone, map, showLog) {
            var transition = setInterval(
                    function() {
                        for (var count = 0; count < noOfVehicles; count++) {
                            var vehicle = vehicles[count];

                            if (typeof vehicle.markers == "undefined") {
                                vehicle.markers = new Array();
                            }

                            var currPositions = transit.estimateCurrentPosition(vehicle, timezone);

                            for (var i = 0; i < currPositions.length; i++) {
                                var currPosition = currPositions[i];

                                if (!currPosition.currentCoords) {
                                    if (typeof vehicle.markers[i] != "undefined") {
                                        map.removeLayer(vehicle.markers[i]);
                                        delete vehicle.markers[i];
                                    }
                                    continue;
                                }

                                if (showLog) transit.writeLog(selector, currPosition, vehicle);

                                if (currPosition.completed) {
                                    map.removeLayer(vehicle.markers[i]);
                                    delete vehicle.markers[i];
                                }

                                var mouseOverInfo = transit.createPositionInfo(vehicle.baseinfo, currPosition);

                                if (typeof vehicle.markers[i] == "undefined") {
                                    var currMarker = transit.initMarker(currPosition.currentCoords, selector,
                                                                        map, vehicle.color);
                                    currMarker.addTo(map);
                                    vehicle.markers[i] = currMarker;
                                } else {
                                    var currMarkerPos = new L.LatLng(currPosition.currentCoords.x,
                                                                     currPosition.currentCoords.y);
                                    vehicle.markers[i].setLatLng(currMarkerPos);
                                }

                                transit.onMarkerMouseover(selector, map, vehicle.markers[i], mouseOverInfo, showLog);
                            }
                        }
                    }, refreshInterval);
        },

        // String all the function calls together. Kinda like C's main().
        callMain : function (selector, tileLayer, refreshInterval, routeObj, vehicleObj, kmlFile, showLog, showSearch, vehicles) {
            var timezone = vehicleObj.timezone;
            var stopinterval = vehicleObj.stopinterval;
            var map = transit.initMap(selector, tileLayer, routeObj.stopnames, routeObj.points, showLog, showSearch);
            map.invalidateSize();
            transit.overlayKml(kmlFile, map);

            $('#timezone').append("UTC" + timezone + "/Local" +
                                  transit.secondsToHours(transit.parseTimeZone(timezone) % 86400));

            if (typeof vehicles == "undefined") {
                var vehicles = vehicleObj.vehicles;
                var noOfVehicles = vehicles.length;

                for (var count = 0; count < noOfVehicles; count++) {
                    try {
                        vehicles[count] = transit.scheduler(vehicles[count], routeObj, stopinterval);
                    } catch (err) {
                        $(selector + '> #init').html(err);
                        throw new Error(err);
                    }
                }
            } else {
                var noOfVehicles = vehicles.length;
            }

            transit.setInMotion(selector, refreshInterval, vehicles, noOfVehicles,
                                stopinterval, timezone, map, showLog);
        },

        // Initialize stuff. Run the promises, acquire the kml and json data, add the main DOM listener,
        // call the main function and write statuses if anything goes awry.
        initialize : function (selector, tileLayer, kmlFile, jsonFile, showLog, showSearch, refreshInterval) {
            // Default the refreshInterval to 1 second if it's less than 1 or unspecified.
            refreshInterval = (typeof refreshInterval == "undefined" ||
                               refreshInterval < 1) ? 1000 : refreshInterval * 1000;
            showLog = (typeof showLog == "undefined") ? true : showLog;
            showSearch = (typeof showSearch == "undefined") ? true : showSearch;
            $(selector).css({
                'position': 'relative',
                'font-family': '"Lucida Grande", "Lucida Sans Unicode",' +
                               'Verdana, Arial, Helvetica, sans-serif',
                'font-size': '12px',
                'text-shadow': 'hsla(0,0%,40%,0.5) 0 -1px 0, hsla(0,0%,100%,.6) 0 2px 1px',
                'background-color': 'hsl(0, 0%, 90%)'
            });

            // Write an initialization message while loading the map and markers.
            $(selector).append("<div id='init' style='position:absolute;width:100%;" +
                               "text-align:center;top:48%;font-weight:bold;z-index:99;'></div>");
            $(selector + '> #init').html('Initialis(z)ing...');

            $(document).ready(function () {
                var kml = transit.kmlPromise(kmlFile);
                var json = transit.jsonPromise(jsonFile);

                kml.success(function (kmlData) {
                    json.success(function (jsonData) {
                        var routeObj = transit.routeParser(kmlData);
                        var vehicleObj = transit.vehicleParser(jsonData);
                        transit.callMain(selector, tileLayer, refreshInterval, routeObj, vehicleObj,
                                         kmlFile, showLog, showSearch);
                    }).fail(function () {
                        $(selector + '> #init').html('Oh Shoot, there was an error loading the JSON file. ' +
                                                     'Check your file path or syntax.');
                    });
                }).fail(function () {
                    $(selector + '> #init').html('Oh Shoot, there was an error loading the KML file.');
                });
            });
        }
    };
})();

// https://github.com/Leaflet/Leaflet/pull/1927
// Issue with stationary popups for circle markers. This issue has been fixed in leaflet 0.7.0,
// which hasn't been released yet, so this is a temporary fix.
L.CircleMarker = L.CircleMarker.extend({
    setLatLng: function (latlng) {
        L.Circle.prototype.setLatLng.call(this, latlng);
        if (this._popup && this._popup._isOpen) {
            this._popup.setLatLng(latlng);
        }
    }
});

/* Pavel Shramov's KML Overlay plugin, KML.js
 * https://github.com/shramov/leaflet-plugins
 * /

/* Copyright (c) 2011-2012, Pavel Shramov
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other materials
      provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/*global L: true */

L.KML = L.FeatureGroup.extend({
	options: {
		async: true
	},

	initialize: function(kml, options) {
		L.Util.setOptions(this, options);
		this._kml = kml;
		this._layers = {};

		if (kml) {
			this.addKML(kml, options, this.options.async);
		}
	},

	loadXML: function(url, cb, options, async) {
		if (async == undefined) async = this.options.async;
		if (options == undefined) options = this.options;

		var req = new window.XMLHttpRequest();
		req.open('GET', url, async);
		try {
			req.overrideMimeType('text/xml'); // unsupported by IE
		} catch(e) {}
		req.onreadystatechange = function() {
			if (req.readyState != 4) return;
			if(req.status == 200) cb(req.responseXML, options);
		};
		req.send(null);
	},

	addKML: function(url, options, async) {
		var _this = this;
		var cb = function(gpx, options) { _this._addKML(gpx, options) };
		this.loadXML(url, cb, options, async);
	},

	_addKML: function(xml, options) {
		var layers = L.KML.parseKML(xml);
		if (!layers || !layers.length) return;
		for (var i = 0; i < layers.length; i++)
		{
			this.fire('addlayer', {
				layer: layers[i]
			});
			this.addLayer(layers[i]);
		}
		this.latLngs = L.KML.getLatLngs(xml);
		this.fire("loaded");
	},

	latLngs: []
});

L.Util.extend(L.KML, {

	parseKML: function (xml) {
		var style = this.parseStyle(xml);
		var el = xml.getElementsByTagName("Folder");
		var layers = [], l;
		for (var i = 0; i < el.length; i++) {
			if (!this._check_folder(el[i])) { continue; }
			l = this.parseFolder(el[i], style);
			if (l) { layers.push(l); }
		}
		el = xml.getElementsByTagName('Placemark');
		for (var j = 0; j < el.length; j++) {
			if (!this._check_folder(el[j])) { continue; }
			l = this.parsePlacemark(el[j], xml, style);
			if (l) { layers.push(l); }
		}
		return layers;
	},

	// Return false if e's first parent Folder is not [folder]
	// - returns true if no parent Folders
	_check_folder: function (e, folder) {
		e = e.parentElement;
		while (e && e.tagName !== "Folder")
		{
			e = e.parentElement;
		}
		return !e || e === folder;
	},

	parseStyle: function (xml) {
		var style = {};
		var sl = xml.getElementsByTagName("Style");

		//for (var i = 0; i < sl.length; i++) {
		var attributes = {color: true, width: true, Icon: true, href: true,
						  hotSpot: true};

		function _parse(xml) {
			var options = {};
			for (var i = 0; i < xml.childNodes.length; i++) {
				var e = xml.childNodes[i];
				var key = e.tagName;
				if (!attributes[key]) { continue; }
				if (key === 'hotSpot')
				{
					for (var j = 0; j < e.attributes.length; j++) {
						options[e.attributes[j].name] = e.attributes[j].nodeValue;
					}
				} else {
					var value = e.childNodes[0].nodeValue;
					if (key === 'color') {
						options.opacity = parseInt(value.substring(0, 2), 16) / 255.0;
						options.color = "#" + value.substring(2, 8);
					} else if (key === 'width') {
						options.weight = value;
					} else if (key === 'Icon') {
						ioptions = _parse(e);
						if (ioptions.href) { options.href = ioptions.href; }
					} else if (key === 'href') {
						options.href = value;
					}
				}
			}
			return options;
		}

		for (var i = 0; i < sl.length; i++) {
			var e = sl[i], el;
			var options = {}, poptions = {}, ioptions = {};
			el = e.getElementsByTagName("LineStyle");
			if (el && el[0]) { options = _parse(el[0]); }
			el = e.getElementsByTagName("PolyStyle");
			if (el && el[0]) { poptions = _parse(el[0]); }
			if (poptions.color) { options.fillColor = poptions.color; }
			if (poptions.opacity) { options.fillOpacity = poptions.opacity; }
			el = e.getElementsByTagName("IconStyle");
			if (el && el[0]) { ioptions = _parse(el[0]); }
			if (ioptions.href) {
				// save anchor info until the image is loaded
				options.icon = new L.KMLIcon({
					iconUrl: ioptions.href,
					shadowUrl: null,
					iconAnchorRef: {x: ioptions.x, y: ioptions.y},
					iconAnchorType:	{x: ioptions.xunits, y: ioptions.yunits}
				});
			}
			style['#' + e.getAttribute('id')] = options;
		}
		return style;
	},

	parseFolder: function (xml, style) {
		var el, layers = [], l;
		el = xml.getElementsByTagName('Folder');
		for (var i = 0; i < el.length; i++) {
			if (!this._check_folder(el[i], xml)) { continue; }
			l = this.parseFolder(el[i], style);
			if (l) { layers.push(l); }
		}
		el = xml.getElementsByTagName('Placemark');
		for (var j = 0; j < el.length; j++) {
			if (!this._check_folder(el[j], xml)) { continue; }
			l = this.parsePlacemark(el[j], xml, style);
			if (l) { layers.push(l); }
		}
		if (!layers.length) { return; }
		if (layers.length === 1) { return layers[0]; }
		return new L.FeatureGroup(layers);
	},

	parsePlacemark: function (place, xml, style) {
		var i, j, el, options = {};
		el = place.getElementsByTagName('styleUrl');
		for (i = 0; i < el.length; i++) {
			var url = el[i].childNodes[0].nodeValue;
			for (var a in style[url])
			{
				// for jshint
				if (true)
				{
					options[a] = style[url][a];
				}
			}
		}
		var layers = [];

		var parse = ['LineString', 'Polygon', 'Point'];
		for (j in parse) {
			// for jshint
			if (true)
			{
				var tag = parse[j];
				el = place.getElementsByTagName(tag);
				for (i = 0; i < el.length; i++) {
					var l = this["parse" + tag](el[i], xml, options);
					if (l) { layers.push(l); }
				}
			}
		}

		if (!layers.length) {
			return;
		}
		var layer = layers[0];
		if (layers.length > 1) {
			layer = new L.FeatureGroup(layers);
		}

		var name, descr = "";
		el = place.getElementsByTagName('name');
		if (el.length) {
			name = el[0].childNodes[0].nodeValue;
		}
		el = place.getElementsByTagName('description');
		for (i = 0; i < el.length; i++) {
			for (j = 0; j < el[i].childNodes.length; j++) {
				descr = descr + el[i].childNodes[j].nodeValue;
			}
		}

		if (name) {
			layer.bindPopup("<h2>" + name + "</h2>" + descr);
		}

		return layer;
	},

	parseCoords: function (xml) {
		var el = xml.getElementsByTagName('coordinates');
		return this._read_coords(el[0]);
	},

	parseLineString: function (line, xml, options) {
		var coords = this.parseCoords(line);
		if (!coords.length) { return; }
		return new L.Polyline(coords, options);
	},

	parsePoint: function (line, xml, options) {
		var el = line.getElementsByTagName('coordinates');
		if (!el.length) {
			return;
		}
		var ll = el[0].childNodes[0].nodeValue.split(',');
		return new L.KMLMarker(new L.LatLng(ll[1], ll[0]), options);
	},

	parsePolygon: function (line, xml, options) {
		var el, polys = [], inner = [], i, coords;
		el = line.getElementsByTagName('outerBoundaryIs');
		for (i = 0; i < el.length; i++) {
			coords = this.parseCoords(el[i]);
			if (coords) {
				polys.push(coords);
			}
		}
		el = line.getElementsByTagName('innerBoundaryIs');
		for (i = 0; i < el.length; i++) {
			coords = this.parseCoords(el[i]);
			if (coords) {
				inner.push(coords);
			}
		}
		if (!polys.length) {
			return;
		}
		if (options.fillColor) {
			options.fill = true;
		}
		if (polys.length === 1) {
			return new L.Polygon(polys.concat(inner), options);
		}
		return new L.MultiPolygon(polys, options);
	},

	getLatLngs: function (xml) {
		var el = xml.getElementsByTagName('coordinates');
		var coords = [];
		for (var j = 0; j < el.length; j++) {
			// text might span many childnodes
			coords = coords.concat(this._read_coords(el[j]));
		}
		return coords;
	},

	_read_coords: function (el) {
		var text = "", coords = [], i;
		for (i = 0; i < el.childNodes.length; i++) {
			text = text + el.childNodes[i].nodeValue;
		}
		text = text.split(/[\s\n]+/);
		for (i = 0; i < text.length; i++) {
			var ll = text[i].split(',');
			if (ll.length < 2) {
				continue;
			}
			coords.push(new L.LatLng(ll[1], ll[0]));
		}
		return coords;
	}

});

L.KMLIcon = L.Icon.extend({

	createIcon: function () {
		var img = this._createIcon('icon');
		img.onload = function () {
			var i = new Image();
			i.src = this.src;
			this.style.width = i.width + 'px';
			this.style.height = i.height + 'px';

			if (this.anchorType.x === 'UNITS_FRACTION' || this.anchorType.x === 'fraction') {
				img.style.marginLeft = (-this.anchor.x * i.width) + 'px';
			}
			if (this.anchorType.y === 'UNITS_FRACTION' || this.anchorType.x === 'fraction') {
				img.style.marginTop  = (-(1 - this.anchor.y) * i.height) + 'px';
			}
			this.style.display = "";
		};
		return img;
	},

	_setIconStyles: function (img, name) {
		L.Icon.prototype._setIconStyles.apply(this, [img, name])
		// save anchor information to the image
		img.anchor = this.options.iconAnchorRef;
		img.anchorType = this.options.iconAnchorType;
	}
});


L.KMLMarker = L.Marker.extend({
	options: {
		icon: new L.KMLIcon.Default()
	}
});
