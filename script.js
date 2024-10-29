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
    
    // Get wildfire data
    fetchWildfireData(latitude, longitude);
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
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    
    // Helper function to get wind direction
    function getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');
        const data = await response.json();
        
        const weatherContainer = document.getElementById('weather-container');
        weatherContainer.innerHTML = '';
        
        const dailyForecasts = {};
        
        data.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dateString = date.toLocaleDateString();
            
            if (!dailyForecasts[dateString]) {
                dailyForecasts[dateString] = forecast;
            }
        });
        
        Object.values(dailyForecasts).slice(0, 5).forEach(day => {
            const date = new Date(day.dt * 1000);
            const tempC = Math.round(day.main.temp);
            const tempF = Math.round((tempC * 9/5) + 32);
            const description = day.weather[0].description;
            const icon = day.weather[0].icon;
            const weatherMain = day.weather[0].main.toLowerCase();
            const humidity = day.main.humidity;
            const windSpeed = Math.round(day.wind.speed * 2.237); // Convert m/s to mph
            const windDir = getWindDirection(day.wind.deg); // Get wind direction
            
            const weatherCard = document.createElement('div');
            weatherCard.className = `weather-card weather-${weatherMain}`;
            weatherCard.innerHTML = `
                <div class="weather-date-container">
                    <div class="weather-day">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="weather-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
                <div class="weather-temp">
                    <span class="temp-c">${tempC}°C</span>
                    <span class="temp-divider"> | </span>
                    <span class="temp-f">${tempF}°F</span>
                </div>
                <div class="weather-desc">${description}</div>
                <div class="weather-details">
                    <div class="humidity">💧 ${humidity}%</div>
                    <div class="wind">💨 ${windSpeed} mph ${windDir}</div>
                </div>
            `;
            
            weatherContainer.appendChild(weatherCard);
        });
    } catch (error) {
        console.error('Error fetching weather:', error);
        document.getElementById('weather-container').innerHTML = 
            '<p>Weather data temporarily unavailable. Please try again later.</p>';
    }
}

// Wildfire data fetch
async function fetchWildfireData(lat, lon) {
    try {
        // Using CORS proxy with CalFire's GeoJSON feed
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const targetUrl = 'https://www.fire.ca.gov/incidents.geojson';
        const url = proxyUrl + targetUrl;
        
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url, {
            headers: {
                'Origin': 'https://j19s84.github.io'
            }
        });
        
        if (!response.ok) throw new Error('CalFire GeoJSON error');
        const data = await response.json();
        
        console.log('Fire data received:', data);
        
        // Rest of your code remains the same...
        const wildfireMap = L.map('wildfire-map').setView([lat, lon], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(wildfireMap);

        // Add fire markers with better visibility
        data.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            
            if (!coords || coords.length < 2) return;

            // Create a more visible fire marker
            const fireMarker = L.circle([coords[1], coords[0]], {
                color: '#FF0000',
                fillColor: '#FF4444',
                fillOpacity: 0.5,
                radius: 5000  // 5km radius to make fires more visible
            }).addTo(wildfireMap);

            // Add a pulsing effect
            const pulsingIcon = L.divIcon({
                className: 'pulsing-icon',
                html: '<div class="pulsing-dot"></div>',
                iconSize: [20, 20]
            });

            L.marker([coords[1], coords[0]], { icon: pulsingIcon })
                .addTo(wildfireMap)
                .bindPopup(`
                    <div class="fire-popup">
                        <h3>${props.name || 'Active Fire'}</h3>
                        <p><strong>Status:</strong> ${props.status || 'Active'}</p>
                        <p><strong>Location:</strong> ${props.location || 'N/A'}</p>
                        <p><strong>County:</strong> ${props.county || 'N/A'}</p>
                        <p><strong>Size:</strong> ${props.acres ? props.acres + ' acres' : 'N/A'}</p>
                        <p><strong>Containment:</strong> ${props.containment || 'N/A'}</p>
                        <p><strong>Updated:</strong> ${new Date(props.updated).toLocaleDateString()}</p>
                    </div>
                `);
        });

        // Add legend
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = `
                <div class="legend-container">
                    <h4>Active Fires</h4>
                    <div class="legend-item">
                        <span class="pulsing-dot"></span>
                        <span>Current Fire Location</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-circle"></span>
                        <span>Fire Area</span>
                    </div>
                </div>
            `;
            return div;
        };
        legend.addTo(wildfireMap);

    } catch (error) {
        console.error('Error fetching wildfire data:', error);
        document.getElementById('wildfire-map').innerHTML = 
            '<p>Wildfire data temporarily unavailable. Please try again later.</p>';
    }
}
// Launch SOS Plan
function launchSOSPlan() {
    alert('SOS Plan feature coming soon!');
    // We'll add the actual navigation later
}
