// Initialize maps and get location
document.addEventListener('DOMContentLoaded', function() {
    // Get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successLocation, errorLocation);
    }

    // Initialize the SOS button
    document.getElementById('sos-button').addEventListener('click', launchSOSPlan);
});

// Success callback for geolocation
function successLocation(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    // Display coordinates
    document.getElementById('coordinates').textContent = 
        `Latitude: ${latitude}, Longitude: ${longitude}`;

    // Initialize main map
    initializeMap(latitude, longitude);
    
    // Get weather data
    fetchWeatherData(latitude, longitude);
}

// Error callback for geolocation
function errorLocation() {
    alert('Unable to retrieve your location');
}

// Initialize Leaflet map
function initializeMap(lat, lon) {
    const map = L.map('map').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    L.marker([lat, lon]).addTo(map)
        .bindPopup('Your Location')
        .openPopup();
}

// Weather data fetch with API
async function fetchWeatherData(lat, lon) {
    const API_KEY = '8224d2b200e0f0663e86aa1f3d1ea740';
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=5`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        const data = await response.json();
        
        // Create weather display
        const weatherContainer = document.getElementById('weather-container');
        weatherContainer.innerHTML = ''; // Clear existing content
        
        data.list.forEach(day => {
            const date = new Date(day.dt * 1000);
            const temp = Math.round(day.main.temp);
            const description = day.weather[0].description;
            const icon = day.weather[0].icon;
            
            const weatherCard = document.createElement('div');
            weatherCard.className = 'weather-card';
            weatherCard.innerHTML = `
                <div class="weather-date">${date.toLocaleDateString()}</div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
                <div class="weather-temp">${temp}°C</div>
                <div class="weather-desc">${description}</div>
            `;
            
            weatherContainer.appendChild(weatherCard);
        });
    } catch (error) {
        console.error('Error fetching weather:', error);
        document.getElementById('weather-container').innerHTML = 
            '<p>Weather data temporarily unavailable. Please try again later.</p>';
    }
}

// Launch SOS Plan
function launchSOSPlan() {
    alert('SOS Plan feature coming soon!');
    // We'll add the actual navigation later
}
