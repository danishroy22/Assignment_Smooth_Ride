console.log("Script loaded");

const firebaseConfig = {
    apiKey: "AIzaSyDv9aVCAK3QfpyZPsRzekJlc3MsBfZoxrg",
    authDomain: "test-f6ef2.firebaseapp.com",
    databaseURL: "https://test-f6ef2-default-rtdb.firebaseio.com",
    projectId: "test-f6ef2",
    storageBucket: "test-f6ef2.appspot.com",
    messagingSenderId: "148456236172",
    appId: "1:148456236172:web:8a09751c0fd0a1a76f47a9",
    measurementId: "G-MX40KYM5YS"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let map;
let markers = {};

function initMap() {
    console.log("Map initialized");

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -20.3484, lng: 57.5522 },
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    // Initialize directionsService and directionsRenderer
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions-panel')
    });

    const geolocateButton = document.createElement('button');
    geolocateButton.textContent = 'Geolocate';
    geolocateButton.classList.add('custom-map-control-button');
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(geolocateButton);
     geolocateButton.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                // Add a marker for the current location
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: '#4285F4', // Blue color
                        fillOpacity: 0.8,
                        strokeColor: 'white',
                        strokeWeight: 1,
                    }
                });

                // Center the map at the user's location
                map.setCenter(pos);
                map.setZoom(15); // Zoom in to the user's location
            },
            (error) => {
                console.error("Error watching position: ", error);
                alert("Unable to retrieve your location. Please check if location access is enabled.");
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

    // Fetch data and plot markers
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

    snapToRoads(location.latitude, location.longitude, (snappedLat, snappedLng) => {
        const latLng = new google.maps.LatLng(snappedLat, snappedLng);

        const marker = new google.maps.Marker({
            position: latLng,
            map: map,
            title: `Lat: ${location.latitude}, Lng: ${location.longitude}, PDI: ${location.pdi}`,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: getColorByPdi(location.pdi),
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

function getColorByPdi(pdi) {
    switch (pdi) {
        case '2':
            return '#FFFF00'; // Yellow
        case '3':
            return '#FFA500'; // Orange
        default:
            return '#FF0000'; // Red
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
            callback(lat, lng); // If there's an error, use the original coordinates
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

window.onload = () => {
    console.log("Script loaded");
};
