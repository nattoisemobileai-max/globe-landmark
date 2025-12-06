// --- Landmark Data (Pre-defined dataset for no external Geocoding API) ---
// Note: Names must match exactly for the guess to be recognized.
const landmarks = [
    { name: "Eiffel Tower", region: "Europe", lat: 48.8584, lng: 2.2945 },
    { name: "Colosseum", region: "Europe", lat: 41.8902, lng: 12.4924 },
    { name: "Statue of Liberty", region: "North America", lat: 40.6892, lng: -74.0445 },
    { name: "Machu Picchu", region: "South America", lat: -13.1631, lng: -72.5450 }, // Added one outside the requested list for variety
    { name: "Great Wall of China", region: "Asia", lat: 40.4319, lng: 116.5704 },
    { name: "Burj Khalifa", region: "Asia", lat: 25.1972, lng: 55.2744 }
];

let targetLandmark = null;
let map = null;
let guessedLandmarkCoords = null;
let selectedFace = null;

// --- Step 1 Functions: Setup ---

function selectFace(element) {
    // Deselect all faces
    document.querySelectorAll('.cartoon-face').forEach(f => f.classList.remove('selected'));
    // Select the clicked face
    element.classList.add('selected');
    selectedFace = element.getAttribute('data-face');
}

function startGame() {
    const username = document.getElementById('username-input').value.trim();
    if (!username || !selectedFace) {
        alert("Please enter a username and select a cartoon face.");
        return;
    }

    // Initialize the Game State
    const randomIndex = Math.floor(Math.random() * landmarks.length);
    targetLandmark = landmarks[randomIndex];
    
    // Update UI
    document.getElementById('display-username').textContent = username;
    document.getElementById('display-face').textContent = selectedFace;
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    // Initialize Map
    initMap();
    console.log("Target Landmark:", targetLandmark.name); // Keep this in the console for development testing!
}

// --- Map Initialization ---

function initMap() {
    // Check if map already exists
    if (map) {
        map.remove();
    }
    
    // Initialize Leaflet Map (Default view over the world)
    map = L.map('map').setView([20, 0], 2); 

    // Add OpenStreetMap tiles (this provides the "Earth" background)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);
}


// --- Step 2 & 3 Functions: Guessing and Calculation ---

function checkGuess() {
    const guessName = document.getElementById('landmark-input').value.trim();
    const guessLandmark = landmarks.find(l => l.name.toLowerCase() === guessName.toLowerCase());
    
    const resultDiv = document.getElementById('result-message');
    
    if (!guessLandmark) {
        resultDiv.innerHTML = `<span style="color: red;">"${guessName}" is not in our landmark database. Try again!</span>`;
        return;
    }

    // Found the coordinates from our internal data
    guessedLandmarkCoords = [guessLandmark.lat, guessLandmark.lng];
    
    // Show the location on the Earth
    // 1. Clear previous guess marker
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker && layer !== map.guessMarker) {
            map.removeLayer(layer);
        }
    });

    // 2. Add new guess marker
    map.guessMarker = L.marker(guessedLandmarkCoords).addTo(map)
        .bindPopup(`Guessed: ${guessLandmark.name}`)
        .openPopup();
    
    // 3. Pan the map to the guessed location
    map.panTo(guessedLandmarkCoords, { duration: 1.5 });


    // Check if matched the target landmark
    if (guessLandmark.name.toLowerCase() === targetLandmark.name.toLowerCase()) {
        displayBingo(guessLandmark.name);
    } else {
        // Step 3: Calculate and show distance
        const distance = calculateHaversineDistance(
            guessedLandmarkCoords[0], guessedLandmarkCoords[1],
            targetLandmark.lat, targetLandmark.lng
        );
        
        resultDiv.innerHTML = `
            <p style="color: blue;">**INCORRECT!**</p>
            <p><strong>Step 3: Distance Measurement</strong></p>
            <p>Your guess, **${guessLandmark.name}**, is **${distance.toFixed(0)} km** away from the target!</p>
            <p>(Keep guessing! The target landmark is in ${targetLandmark.region}).</p>
        `;
    }
}


function displayBingo(name) {
    // Show the target location on the map
    L.circle([targetLandmark.lat, targetLandmark.lng], {
        color: 'green',
        fillColor: '#0f3',
        fillOpacity: 0.5,
        radius: 50000 // A large circle to mark the spot
    }).addTo(map).bindPopup(`Target: ${targetLandmark.name}`).openPopup();
    
    // Show the Bingo message
    const bingo = document.getElementById('bingo-message');
    bingo.innerHTML = `BINGO! <br> You found the **${name}**!`;
    bingo.style.display = 'block';

    // Disable input after win
    document.getElementById('landmark-input').disabled = true;
    document.querySelector('#game-screen button').disabled = true;
}

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1.
 * @param {number} lon1 - Longitude of point 1.
 * @param {number} lat2 - Latitude of point 2.
 * @param {number} lon2 - Longitude of point 2.
 * @returns {number} The distance in kilometers.
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    
    // Function to convert degrees to radians
    const toRad = (angle) => angle * (Math.PI / 180);

    // Convert all coordinates to radians
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);

    // The Haversine formula core calculation
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in km
    return distance;
}

// Initial call to set up the map area before the game starts
initMap();
