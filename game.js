// --- Landmark Data (Pre-defined dataset) ---
const landmarks = [
    // Europe
    { name: "Eiffel Tower", region: "Europe", lat: 48.8584, lng: 2.2945 },
    { name: "Colosseum", region: "Europe", lat: 41.8902, lng: 12.4924 },
    { name: "Stonehenge", region: "Europe", lat: 51.1789, lng: -1.8262 },
    
    // North America
    { name: "Statue of Liberty", region: "North America", lat: 40.6892, lng: -74.0445 },
    { name: "Golden Gate Bridge", region: "North America", lat: 37.8199, lng: -122.4783 },
    { name: "Niagara Falls", region: "North America", lat: 43.0828, lng: -79.0742 },

    // Asia
    { name: "Great Wall of China", region: "Asia", lat: 40.4319, lng: 116.5704 },
    { name: "Burj Khalifa", region: "Asia", lat: 25.1972, lng: 55.2744 },
    { name: "Mount Fuji", region: "Asia", lat: 35.3606, lng: 138.7292 },
    { name: "Taj Mahal", region: "Asia", lat: 27.1751, lng: 78.0421 }
];

let targetLandmark = null;
let map = null;
let guessedLandmarkCoords = null;
let selectedFace = null;

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

    // This is often a fix for map rendering issues when placed within complex layouts
    map.invalidateSize(); 
}

// --- Step 1 Functions: Setup ---

function selectFace(element) {
    document.querySelectorAll('.cartoon-face').forEach(f => f.classList.remove('selected'));
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

    // The map is initialized when the DOM loads, so we don't need to call initMap here.
    // However, we call map.invalidateSize() again to be safe.
    if (map) {
        map.invalidateSize();
    }
}


// --- Step 2 & 3 Functions: Guessing and Calculation ---

function checkGuess() {
    const guessName = document.getElementById('landmark-input').value.trim();
    const guessLandmark = landmarks.find(l => l.name.toLowerCase() === guessName.toLowerCase());
    const resultDiv = document.getElementById('result-message');
    
    if (!guessLandmark) {
        resultDiv.innerHTML = `<span style="color: red;">"${guessName}" is not in our landmark database. Please type one of the pre-defined names exactly.</span>`;
        return;
    }

    guessedLandmarkCoords = [guessLandmark.lat, guessLandmark.lng];
    
    // 1. Clear previous guess marker
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker && layer !== map.guessMarker) {
            map.removeLayer(layer);
        }
    });

    // 2. Add new guess marker (Step 2: Show location of filled-in landmark)
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
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    
    const toRad = (angle) => angle * (Math.PI / 180);

    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; 
    return distance;
}

// *** CRITICAL FIX: Ensure the DOM is fully loaded before initializing the map ***
window.addEventListener('DOMContentLoaded', () => {
    initMap();
});
