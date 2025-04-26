console.log("Hello from the Client Side");

// const locations = document.getElementById("map").dataset.locations;
// console.log(locations);

// var map = L.map("map").setView([51.505, -0.09], 13);

// L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   maxZoom: 19,
//   attribution:
//     '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
// }).addTo(map);

// const locations = [
//   { coordinates: [19.7515, 75.7139], description: "Aurangabad" },
//   { coordinates: [18.5204, 73.8567], description: "Pune" },
//   { coordinates: [19.076, 72.8777], description: "Mumbai" },
// ];

export const displayMap = (locations) => {
  const map = L.map("map", {
    scrollWheelZoom: false,
    dragging: false,
  });

  // Add OpenStreetMap tiles
  // 1)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // 2)Light color style

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }
  ).addTo(map);

  // 3) Dark color style
  L.tileLayer("https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://stamen.com">Stamen Design</a>',
  }).addTo(map);

  // Create a bounds object to fit all markers
  const bounds = [];

  locations.forEach((loc) => {
    const [lng, lat] = loc.coordinates;
    const coords = [lat, lng]; // Reverse to [lat, lng]

    // Create and add marker
    L.marker(coords)
      .addTo(map)
      .bindPopup(`<strong>Day ${loc.day}:</strong> ${loc.description}`)
      .openPopup();

    bounds.push(coords);
  });

  // Fit the map to include all markers

  map.fitBounds(bounds, {
    padding: [100, 100],
    maxZoom: 10,
  });
};
