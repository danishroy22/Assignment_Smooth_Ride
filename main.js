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
let markers = []; // To store markers
let directionsService;
let directionsRenderer;

function initMap() {
    console.log("Map initialized");

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -20.3484, lng: 57.5522 },
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    // Initialize Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions-panel')
    });

    const geolocateButton = document.createElement('button');
    geolocateButton.textContent = 'Geolocate';
    geolocateButton.classList.add('custom-map-control-button');
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(geolocateButton);
    geolocateButton.addEventListener('click', () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(pos);
                new google.maps.Marker({
                    position: pos,
                    map: map,
                    title: 'You are here'
                });
            }, (error) => {
                console.error('Error getting location:', error);
                alert('Error getting location. Please check your browser permissions.');
            });
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    });

    fetchAndPlotData();
}

function fetchAndPlotData() {
    const locationsRef = database.ref('users');

    locationsRef.on('value', (snapshot) => {
        const locations = snapshot.val();
        if (locations) {
            plotData(locations);
        } else {
            console.error('No data available');
        }
    }, (error) => {
        console.error('Error fetching data:', error);
    });
}

function plotData(locations) {
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    for (const key in locations) {
        if (locations.hasOwnProperty(key)) {
            const location = locations[key];

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

                markers.push(marker);
            });
        }
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

// Initialize the map when the window loads
window.onload = initMap;
