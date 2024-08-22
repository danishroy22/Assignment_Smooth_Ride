console.log("Script loaded");

const firebaseConfig = {
  apiKey: 'AIzaSyBGc13TJXQ0H25FJZKIJuG5eLUKPLYZnZI',
  authDomain: 'database2-c6ea1.firebaseapp.com',
  databaseURL: "https://database2-c6ea1-default-rtdb.firebaseio.com/",
  projectId: "database2-c6ea1",
  storageBucket: "database2-c6ea1.appspot.com",
  messagingSenderId: "876911634659",
  appId: "1:876911634659:web:b975f6b45f90e603903dd6",
  measurementId: "G-F9XCGE0T3Q"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let map;
let markers = {}; // Object to store markers by their Firebase keys
let directionsService;
let directionsRenderer;

function initMap() {
    console.log("Map initialized");

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -20.3484, lng: 57.5522 },
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions-panel')
    });

    const geolocateButton = document.createElement('button');
    geolocateButton.textContent = 'Geolocate';
    geolocateButton.classList.add('custom-map-control-button');
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(geolocateButton);
    geolocateButton.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition((position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                map.setCenter(pos);
            },
            (error) => {
                console.error("Error watching position: ", error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 50000,
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    });

    fetchAndPlotData();
}

function fetchAndPlotData() {
    const locationsRef = database.ref('users');

    // Listen for new data added
    locationsRef.on('child_added', (snapshot) => {
        const key = snapshot.key;
        const location = snapshot.val();
        addOrUpdateMarker(key, location);
    });

    // Listen for data changes
    locationsRef.on('child_changed', (snapshot) => {
        const key = snapshot.key;
        const location = snapshot.val();
        addOrUpdateMarker(key, location);
    });

    // Listen for data removal
    locationsRef.on('child_removed', (snapshot) => {
        const key = snapshot.key;
        removeMarker(key);
    });
}

function addOrUpdateMarker(key, location) {
    // Remove existing marker if it exists
    if (markers[key]) {
        markers[key].setMap(null);
    }

    snapToRoads(location.Latitude, location.Longitude, (snappedLat, snappedLng) => {
        const latLng = new google.maps.LatLng(snappedLat, snappedLng);

        const marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: `Lat: ${location.Latitude}, Lng: ${location.Longitude}, Index: ${location.index}`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: getColorByIndex(location.index),
                fillOpacity: 0.8,
                strokeColor: 'white',
                strokeWeight: 0.6
            }
        });

        // Store the marker by its Firebase key
        markers[key] = marker;
    });
}

function removeMarker(key) {
    if (markers[key]) {
        markers[key].setMap(null); // Remove the marker from the map
        delete markers[key]; // Remove the marker from the object
    }
}

function getColorByIndex(index) {
    switch (index) {
        case 'small':
            return '#FFFF00'; // Yellow
        case 'medium':
            return '#FFA500'; // Orange
        case 'HUGE!!!':
            return '#FF0000'; // Red
        default:
            return '#000000'; // Black
    }
}

function snapToRoads(lat, lng, callback) {
    const roadServiceUrl = `https://roads.googleapis.com/v1/snapToRoads?path=${lat},${lng}&key=AIzaSyCpB72BCljAT2fMDa9f58yg55sEN5xfAZU`;

    fetch(roadServiceUrl)
        .then(response => response.json())
        .then(data => {
            if (data.snappedPoints && data.snappedPoints.length > 0) {
                const snappedPoint = data.snappedPoints[0];
                callback(snappedPoint.location.latitude, snappedPoint.location.longitude);
            } else {
                callback(lat, lng);
            }
        })
        .catch(error => {
            console.error('Error snapping to roads:', error);
            callback(lat, lng);
        });
}

function calculateAndDisplayRoute(origin, destination) {
    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
        } else {
            console.error('Directions request failed due to ' + status);
        }
    });
}

window.onload = initMap;
