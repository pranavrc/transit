var transit = (function () {
	map = new google.maps.Map();

	return {
		setMap : function (coords, mapZoom) {
			mapZoom = (typeof mapZoom == 'undefined') ? 1 : mapZoom;
			var mapCenter = new google.maps.LatLng(coords[0], coords[1]);

			var mapDet = {
				center: mapCenter,
				zoom: mapZoom,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

			map = new google.maps.Map(document.getElementById('transitMap'), mapDet);
			return map;
		},

		setMarker : function (coords, hoverText) {
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
				title: hoverText
				icon: markerIcon
			};

			marker = new google.maps.Marker(marker);
			return marker;
		},

		moveMarkers : function (map, markerSet, interval) {
			var counter = 0;
			interval = (typeof interval == 'undefined') ? 1000 : interval;
			setInterval(
					function () {
						for (let i = 0; i < markerSet.length; i++) {
							let curPos = new google.maps.LatLng(markerSet[counter].coordSet[0],
								markerSet[counter].coordSet[1]);
							markerSet[i].marker.position = curPos;
							markerSet[i].marker.setMap(map);
						}
						counter++;
					},
				    interval);
		},

		constructMarkerSet : function (markers, coordsList) {
			var markerSet = new Array();
			for (let counter = 0; counter < markers.length; counter++) {
				markerObj = this.setMarker(markers[counter].coords, markers[counter].hoverText);
				markerSet.push({
					marker: markerObj,
					coordSet: coordsList[counter]
				});
			}
			return markerSet;
		},

		init : function (centerCoords, zoom, markerList, interval) {
			google.maps.event.addDomListener(window, 'load',
					function () {
						this.map = this.setMap(centerCoords, zoom);
						var markerSet = this.constructMarkerSet(markerList, coordsList);
						this.moveMarkers(this.map, markerSet, interval);
					});
		}
	};
})();
