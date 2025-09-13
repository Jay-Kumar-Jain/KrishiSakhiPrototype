const apiKey = "f9ddd8227d96478f87c82943251309";
let forecastData;
let chart;

function toggleInputFields() {
  let type = document.getElementById("inputType").value;
  document.getElementById("cityInput").classList.toggle("hidden", type !== "city");
  document.getElementById("latlonInput").classList.toggle("hidden", type !== "latlon");
  document.getElementById("postalInput").classList.toggle("hidden", type !== "postal");
}

async function getWeather() {
  let type = document.getElementById("inputType").value;
  let query = "";

  if (type === "city") {
    query = document.getElementById("cityInput").value || "Kochi";
  } else if (type === "latlon") {
    let lat = document.getElementById("latitude").value;
    let lon = document.getElementById("longitude").value;
    query = `${lat},${lon}`;
  } else if (type === "postal") {
    query = document.getElementById("postalInput").value;
  }

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=7&aqi=yes&alerts=yes`;

  try {
    document.getElementById("currentWeather").innerHTML = `
      <div class="current-temp">...</div>
      <div class="current-info">Fetching weather...</div>
    `;

    const res = await fetch(url);
    forecastData = await res.json();

    if (forecastData.error) {
      document.getElementById("currentWeather").innerHTML = `
        <div class="current-temp">--</div>
        <div class="current-info">${forecastData.error.message}</div>
      `;
      document.getElementById("forecast").innerHTML = "";
      document.getElementById("extraDetails").innerHTML = "";
      if (chart) chart.destroy();
      return;
    }

    displayCurrent(forecastData);
    displayExtra(forecastData);
    showChart("temp");
    displayForecast(forecastData);
  } catch (err) {
    console.error(err);
  }
}

function displayCurrent(data) {
  document.getElementById("currentWeather").innerHTML = `
    <div class="current-temp">${data.current.temp_c}°C</div>
    <div class="current-info">
      <div><b>${data.location.name}, ${data.location.country}</b></div>
      <div>${data.current.condition.text}</div>
    </div>
  `;
}

function displayExtra(data) {
  document.getElementById("extraDetails").innerHTML = `
    <div>Feels Like: ${data.current.feelslike_c}°C</div>
    <div>Humidity: ${data.current.humidity}%</div>
    <div>Wind: ${data.current.wind_kph} km/h</div>
    <div>Gusts: ${data.current.gust_kph} km/h</div>
    <div>UV Index: ${data.current.uv}</div>
    <div>Visibility: ${data.current.vis_km} km</div>
    <div>Pressure: ${data.current.pressure_mb} mb</div>
    <div>Dew Point: ${data.current.dewpoint_c ?? "-"}°C</div>
    <div>Sunrise: ${data.forecast.forecastday[0].astro.sunrise}</div>
    <div>Sunset: ${data.forecast.forecastday[0].astro.sunset}</div>
    <div>Moonrise: ${data.forecast.forecastday[0].astro.moonrise}</div>
    <div>Moon Phase: ${data.forecast.forecastday[0].astro.moon_phase}</div>
  `;
}

function showChart(type) {
  if (!forecastData) return;
  const hours = forecastData.forecast.forecastday[0].hour;
  let labels = hours.map(h => h.time.split(" ")[1]);
  let data = [];

  if (type === "temp") {
    data = hours.map(h => h.temp_c);
  } else if (type === "precip") {
    data = hours.map(h => h.chance_of_rain);
  } else if (type === "wind") {
    data = hours.map(h => h.wind_kph);
  }

  if (chart) chart.destroy();
  const ctx = document.getElementById("weatherChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: type.toUpperCase(),
        data: data,
        borderColor: "#2f6d35",
        backgroundColor: "rgba(47,109,53,0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { 
        x: { ticks: { color: "#555" } }, 
        y: { ticks: { color: "#555" } } 
      }
    }
  });

  document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + type).classList.add("active");
}

function displayForecast(data) {
  const days = data.forecast.forecastday;
  const container = document.getElementById("forecast");
  container.innerHTML = "";
  days.forEach(d => {
    container.innerHTML += `
      <div class="day-card">
        <div>${new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })}</div>
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

// Auto-load default city
window.onload = () => getWeather();
