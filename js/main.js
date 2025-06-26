// 🔄 Toggles between dark and light mode by adding/removing the `dark` class on <html>
function toggleMode() {
   document.documentElement.classList.toggle('dark');
}

// 🌐 Your OpenWeatherMap API key (keep it safe in production)
const apiKey = '6a57280bad941b2824d6a302e05d9a7a';

// 🌍 Fetches weather data based on city name input
async function getWeather() {
   const city = document.getElementById('cityInput').value.trim();
   if (!city) return showToast("Enter a city name", "warning"); // Show warning if input is empty

   // API endpoints for current weather and 5-day forecast
   const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
   const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

   try {
      // Fetch both APIs simultaneously
      const [weatherRes, forecastRes] = await Promise.all([
         fetch(weatherUrl),
         fetch(forecastUrl)
      ]);

      // Parse the JSON responses
      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();

      // Check if weather data is valid
      if (weatherData.cod !== 200) {
         showToast(weatherData.message, "error"); // Display error if city is invalid
         return;
      }

      // 🎨 Update UI with data
      renderWeatherUI(weatherData, forecastData);
   } catch (err) {
      showToast("Something went wrong. Try again.", "error"); // Catch network/API errors
   }
}

// 🖼️ Renders weather data and forecast to the UI
function renderWeatherUI(weatherData, forecastData) {
   // Extract data from current weather response
   const icon = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
   const desc = weatherData.weather[0].description;
   const temp = Math.round(weatherData.main.temp);
   const feels = Math.round(weatherData.main.feels_like);
   const humidity = weatherData.main.humidity;
   const wind = weatherData.wind.speed;

   // Inject HTML into #weatherInfo
   document.getElementById('weatherInfo').innerHTML = `
      <h2 class="text-2xl font-futuristic mb-4">${weatherData.name}, ${weatherData.sys.country}</h2>
      <img src="${icon}" class="w-24 mx-auto mb-2" alt="${desc}" />
      <div class="capitalize text-lg font-medium mb-2">${desc}</div>
      <div class="text-6xl font-thin mb-4">${temp}&deg;C</div>
      <div class="grid grid-cols-3 gap-4 text-sm text-gray-300">
         <div class="text-center">💧<br>Humidity<br><strong>${humidity}%</strong></div>
         <div class="text-center">🌡️<br>Feels Like<br><strong>${feels}&deg;C</strong></div>
         <div class="text-center">💨<br>Wind<br><strong>${wind} m/s</strong></div>
      </div>`;

   // Show the card
   document.getElementById('weatherInfo').classList.remove("hidden");

   // Update background based on weather
   setBackground(desc);

   // Filter forecast to only show results for 12:00 PM each day
   const noonForecasts = forecastData.list.filter(f => f.dt_txt && f.dt_txt.includes("12:00:00"));
   let forecastHTML = '';

   // Render next 3 days' forecast
   for (let i = 0; i < 3; i++) {
      const day = noonForecasts[i];
      if (!day || !day.dt_txt) continue;

      const date = new Date(day.dt_txt.replace(" ", "T"));
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      const icon = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;

      forecastHTML += `
         <div class="bg-white/10 backdrop-blur-md rounded-xl px-4 py-5 text-center shadow hover:scale-105 transform transition-all">
            <h4 class="text-sm font-semibold mb-2">${weekday}</h4>
            <img src="${icon}" alt="${day.weather[0].description}" class="w-10 h-10 mx-auto mb-2" />
            <p class="text-lg font-bold">${Math.round(day.main.temp)}&deg;C</p>
         </div>`;
   }

   document.getElementById('forecast').innerHTML = forecastHTML;
}

// 🍞 Shows a toast alert using SweetAlert2
function showToast(msg, type = "info") {
   Swal.fire({
      toast: true,
      position: 'top-end',
      icon: type,
      title: msg,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
   });
}

// 📍 Gets weather based on user's geolocation coordinates
async function getWeatherByCoords(lat, lon) {
   const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
   const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

   const [weatherRes, forecastRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(forecastUrl)
   ]);
   const weatherData = await weatherRes.json();
   const forecastData = await forecastRes.json();
   renderWeatherUI(weatherData, forecastData);
}

// 🧭 Attempts to get user’s geolocation and fetch weather for it
function detectLocation() {
   if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
         ({ coords }) => {
            getWeatherByCoords(coords.latitude, coords.longitude);
         },
         () => showToast("Location access denied", "warning")
      );
   } else {
      showToast("Geolocation not supported", "error");
   }
}

// 🎨 Dynamically sets background gradient based on weather description
function setBackground(desc) {
   desc = desc.toLowerCase();
   if (desc.includes("rain")) {
      document.body.style.background = "linear-gradient(to right, #434343, #000000)";
   } else if (desc.includes("cloud")) {
      document.body.style.background = "linear-gradient(to right, #bdc3c7, #2c3e50)";
   } else if (desc.includes("clear")) {
      document.body.style.background = "linear-gradient(to right, #56ccf2, #2f80ed)";
   } else if (desc.includes("snow")) {
      document.body.style.background = "linear-gradient(to right, #e0eafc, #cfdef3)";
   } else {
      document.body.style.background = "#111827"; // fallback background
   }
}

// 🚀 Auto-fetch weather on page load using location
detectLocation();

// ⚙️ Registers service worker for PWA support (offline functionality)
if ('serviceWorker' in navigator) {
   window.addEventListener('load', () => {
      navigator.serviceWorker
         .register('/service-worker.js')
         .then(reg => console.log('Service Worker registered ✅', reg))
         .catch(err => console.error('Service Worker registration failed ❌', err));
   });
}
