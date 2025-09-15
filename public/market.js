const API_KEY = "579b464db66ec23bdd00000177792c45e43345e9443afa05867df784";
const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";

let allRecords = [];
let priceChart = null;

const stateSelector = document.getElementById("stateSelector");
const districtSelector = document.getElementById("districtSelector");
const marketSelector = document.getElementById("marketSelector");
const cropInput = document.getElementById("cropInput");

const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("price-data-body");
const chartEmpty = document.getElementById("chartEmpty");
const tableEmpty = document.getElementById("tableEmpty");
const lastUpdated = document.getElementById("lastUpdated");
const loader = document.getElementById("loader");
const appContainer = document.querySelector(".app");

// --- Fetch Data ---
async function fetchData() {
  try {
    const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=5000`;
    const res = await fetch(url);
    const data = await res.json();
    allRecords = data.records || [];
    if (!allRecords.length) {
      alert("No market data available!");
      return;
    }
    loader.style.display = "none";
    appContainer.style.display = "grid";
    populateStateOptions();
    generateTableHeader();
    updateLastUpdated();
  } catch (err) {
    console.error(err);
    alert("Error fetching market data!");
  }
}

// --- Populate States ---
function populateStateOptions() {
  const states = [...new Set(allRecords.map((r) => r.state))].sort();
  states.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    stateSelector.appendChild(opt);
  });
}

// --- Table Header (Arrival Date removed) ---
function generateTableHeader() {
  const headers = [
    "State",
    "District",
    "Market",
    "Commodity",
    "Variety",
    "Grade",
    "Min Price",
    "Max Price",
    "Modal Price",
  ];
  tableHead.innerHTML = "";
  const tr = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    tr.appendChild(th);
  });
  tableHead.appendChild(tr);
}

// --- Filters ---
stateSelector.addEventListener("change", () => {
  const state = stateSelector.value;
  resetDropdown(districtSelector, "Select District");
  resetDropdown(marketSelector, "Select Market");
  hideData();
  if (!state) return;
  const districts = [
    ...new Set(allRecords.filter((r) => r.state === state).map((r) => r.district)),
  ].sort();
  districts.forEach((d) => {
    const o = document.createElement("option");
    o.value = d;
    o.textContent = d;
    districtSelector.appendChild(o);
  });
  districtSelector.disabled = false;
});

districtSelector.addEventListener("change", () => {
  const district = districtSelector.value;
  resetDropdown(marketSelector, "Select Market");
  hideData();
  if (!district) return;
  const markets = [
    ...new Set(allRecords.filter((r) => r.district === district).map((r) => r.market)),
  ].sort();
  markets.forEach((m) => {
    const o = document.createElement("option");
    o.value = m;
    o.textContent = m;
    marketSelector.appendChild(o);
  });
  marketSelector.disabled = false;
  updateData();
});

[marketSelector, cropInput].forEach((el) => el.addEventListener("change", updateData));
cropInput.addEventListener("input", updateData);

function resetDropdown(sel, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  sel.disabled = true;
}

function hideData() {
  tableBody.innerHTML = "";
  if (priceChart) {
    priceChart.destroy();
    priceChart = null;
  }
  chartEmpty.style.display = "block";
  tableEmpty.style.display = "block";
}

// --- Update Data ---
function updateData() {
  const state = stateSelector.value;
  const district = districtSelector.value;
  if (!state || !district) {
    hideData();
    return;
  }

  let filtered = allRecords.filter((r) => r.state === state && r.district === district);
  const market = marketSelector.value;
  const crop = cropInput.value.toLowerCase();

  if (market) filtered = filtered.filter((r) => r.market === market);
  if (crop) filtered = filtered.filter((r) => r.commodity?.toLowerCase().includes(crop));

  updateTable(filtered, crop);
  updateChart(filtered);
}

// --- Table (Arrival Date removed) ---
function updateTable(records, highlight = "") {
  tableBody.innerHTML = "";
  if (!records.length) {
    tableEmpty.style.display = "block";
    return;
  }
  tableEmpty.style.display = "none";

  records.forEach((r) => {
    const tr = document.createElement("tr");
    [
      r.state,
      r.district,
      r.market,
      r.commodity,
      r.variety,
      r.grade,
      r.min_price,
      r.max_price,
      r.modal_price,
    ].forEach((val) => {
      const td = document.createElement("td");
      if (highlight && typeof val === "string") {
        td.innerHTML = val.replace(
          new RegExp(highlight, "gi"),
          (match) => `<mark>${match}</mark>`
        );
      } else td.textContent = val;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

// --- Chart ---
function updateChart(records) {
  const ctx = document.getElementById("marketChart").getContext("2d");
  if (priceChart) priceChart.destroy();
  if (!records.length) {
    chartEmpty.style.display = "block";
    return;
  }
  chartEmpty.style.display = "none";

  const labels = records.map((r) => `${r.commodity} (${r.market})`);
  const data = records.map((r) => parseFloat(r.modal_price) || 0);

  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(46,93,46,0.9)");
  gradient.addColorStop(1, "rgba(46,93,46,0.4)");

  priceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Modal Price (₹/Quintal)",
          data,
          backgroundColor: gradient,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#111827", font: { size: 14, weight: "600" } },
        },
        tooltip: {
          backgroundColor: "#111827",
          titleColor: "#fff",
          bodyColor: "#f9fafb",
          callbacks: {
            label: (ctx) => `₹${ctx.formattedValue} / Quintal`,
          },
        },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
          pan: { enabled: true, mode: "x" },
        },
      },
      scales: {
        x: {
          ticks: { color: "#111827", font: { weight: "600" } },
          grid: { color: "#ddd" },
        },
        y: {
          ticks: {
            color: "#111827",
            font: { weight: "600" },
            callback: (v) => `₹${v}`,
          },
          grid: { color: "#ddd" },
        },
      },
    },
  });
}

// --- Last Updated (still uses arrival_date internally) ---
function updateLastUpdated() {
  if (!allRecords.length) return;
  const latest = allRecords
    .map((r) => new Date(r.arrival_date.split("/").reverse().join("-")))
    .sort((a, b) => b - a)[0];
  lastUpdated.textContent = `📅 Latest Market Data: ${latest.toLocaleDateString()}`;
}

fetchData();
