// public/weather.js
const apiKey = "YOUR_WEATHER_API_KEY"; // replace with your key
let forecastData;
let chart;

function toggleInputFields() {
  const type = document.getElementById("inputType").value;
  document.getElementById("cityInput").classList.toggle("hidden", type !== "city");
  document.getElementById("latlonInput").classList.toggle("hidden", type !== "latlon");
  document.getElementById("postalInput").classList.toggle("hidden", type !== "postal");
}

async function getWeather() {
  const type = document.getElementById("inputType").value;
  let query = "";

  if (type === "city") {
    query = document.getElementById("cityInput").value.trim();
  } else if (type === "latlon") {
    const lat = document.getElementById("latitude").value.trim();
    const lon = document.getElementById("longitude").value.trim();
    if (lat && lon) query = `${lat},${lon}`;
  } else if (type === "postal") {
    query = document.getElementById("postalInput").value.trim();
    if (/^\d{6}$/.test(query)) query += ",IN";
  }

  if (!query) return showError("⚠️ Please enter a location first.");

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=7&aqi=yes&alerts=yes`;

  try {
    document.getElementById("currentWeather").innerHTML =
      `<div class="loader"></div><div class="placeholder">Fetching weather data...</div>`;
    const res = await fetch(url);
    forecastData = await res.json();

    if (forecastData.error) return showError("❌ " + forecastData.error.message);

    displayCurrent(forecastData);
    displayExtra(forecastData);
    displayForecast(forecastData);
    showChart("temp");
  } catch (err) {
    console.error(err);
    showError("❌ Unable to fetch weather data. Please try again.");
  }
}

function showError(message) {
  document.getElementById("currentWeather").innerHTML = `<div class="placeholder">${message}</div>`;
  document.getElementById("extraDetails").innerHTML = "";
  document.getElementById("forecast").innerHTML = "";
  if (chart) chart.destroy();
}

function displayCurrent(data) {
  document.getElementById("currentWeather").innerHTML = `
    <div class="current-temp">${data.current.temp_c}°C / ${data.current.temp_f}°F</div>
    <div class="current-info">
      <div><b>${data.location.name}, ${data.location.country}</b></div>
      <div>${data.current.condition.text}</div>
      <div>Updated: ${data.current.last_updated}</div>
    </div>
  `;
}

function displayExtra(data) {
  const dew = data.current.dewpoint_c ?? "-";
  document.getElementById("extraDetails").innerHTML = `
    <div>🌡 Feels Like: ${data.current.feelslike_c}°C</div>
    <div>💧 Humidity: ${data.current.humidity}%</div>
    <div>💨 Wind: ${data.current.wind_kph} km/h</div>
    <div>🌬 Gusts: ${data.current.gust_kph} km/h</div>
    <div>☀ UV Index: ${data.current.uv}</div>
    <div>👁 Visibility: ${data.current.vis_km} km</div>
    <div>📊 Pressure: ${data.current.pressure_mb} mb</div>
    <div>💧 Dew Point: ${dew}°C</div>
    <div>🌅 Sunrise: ${data.forecast.forecastday[0].astro.sunrise}</div>
    <div>🌇 Sunset: ${data.forecast.forecastday[0].astro.sunset}</div>
    <div>🌙 Moonrise: ${data.forecast.forecastday[0].astro.moonrise}</div>
    <div>🌘 Moon Phase: ${data.forecast.forecastday[0].astro.moon_phase}</div>
  `;
}

function displayForecast(data) {
  const container = document.getElementById("forecast");
  container.innerHTML = "";
  data.forecast.forecastday.forEach((d) => {
    container.innerHTML += `
      <div class="day-card">
        <div><b>${new Date(d.date).toLocaleDateString("en-US",{weekday:"short"})}</b></div>
        <img src="${d.day.condition.icon}" alt="icon" />
        <div>${d.day.condition.text}</div>
        <div class="day-temp">${d.day.maxtemp_c}° / ${d.day.mintemp_c}°</div>
        <div class="day-extra">🌧 ${d.day.daily_chance_of_rain}% | ❄ ${d.day.daily_chance_of_snow}%</div>
        <div class="day-extra">💨 ${d.day.maxwind_kph} km/h</div>
        <div class="day-extra">☀ UV: ${d.day.uv}</div>
      </div>
    `;
  });
}

function showChart(type) {
  if (!forecastData) return;
  const hours = forecastData.forecast.forecastday[0].hour;
  const labels = hours.map((h) => h.time.split(" ")[1]);
  let data = [];
  if (type === "temp") data = hours.map((h) => h.temp_c);
  else if (type === "precip") data = hours.map((h) => h.chance_of_rain);
  else if (type === "wind") data = hours.map((h) => h.wind_kph);

  if (chart) chart.destroy();
  const ctx = document.getElementById("weatherChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: type.toUpperCase(),
          data,
          borderColor: "#2f6d35",
          backgroundColor: "rgba(47,109,53,0.2)",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#2f6d35",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#2f6d35",
          titleColor: "#fff",
          bodyColor: "#fff",
        },
      },
      scales: {
        x: { ticks: { color: "#444" }, grid: { color: "rgba(0,0,0,0.05)" } },
        y: { ticks: { color: "#444" }, grid: { color: "rgba(0,0,0,0.05)" } },
      },
    },
  });

  document.querySelectorAll(".tabs button").forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + type).classList.add("active");
}
