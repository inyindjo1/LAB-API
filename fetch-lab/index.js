// Import components
import { appendCarousel, createCarouselItem } from "./Carousel.js";

const { Carousel } = bootstrap;

// DOM Elements
const breedSelect = document.getElementById("breedSelect");
const infoDump = document.getElementById("infoDump");
const progressBar = document.getElementById("progressBar");
const getFavouritesBtn = document.getElementById("getFavouritesBtn");

const API_KEY = "live_f0KyUVRcJ8pMl8aGwEzsQ2W7diRrqaPP3zKWSyKRA0W0Jvfe9DpBz3jUwgcLsQGf";

// Axios Configuration
axios.defaults.baseURL = "https://api.thecatapi.com/v1";
axios.defaults.headers.common["x-api-key"] = API_KEY;

// Axios Interceptors
axios.interceptors.request.use(config => {
  console.log("Request started:", config.url);
  config.metadata = { startTime: new Date() };
  document.body.style.cursor = "progress";
  progressBar.style.width = "0%";
  return config;
});

axios.interceptors.response.use(response => {
  const duration = new Date() - response.config.metadata.startTime;
  console.log(`Response received in ${duration} ms`);
  document.body.style.cursor = "default";
  progressBar.style.width = "100%";
  return response;
});

function updateProgress(event) {
  if (event.lengthComputable) {
    const percent = (event.loaded / event.total) * 100;
    progressBar.style.width = `${percent}%`;
  }
}

// 1. Initial Load - Populate Dropdown
async function initialLoad() {
  const response = await axios.get("/breeds");
  const breeds = response.data;
  breeds.forEach(breed => {
    const option = document.createElement("option");
    option.value = breed.id;
    option.textContent = breed.name;
    breedSelect.appendChild(option);
  });
  catImage(); // Load default on page load
}
initialLoad();

// 2. Load breed-specific images/info
breedSelect.addEventListener("change", catImage);
async function catImage() {
  const breedID = breedSelect.value;
  const imageResponse = await axios.get(`/images/search`, {
    params: { breed_ids: breedID, limit: 15 },
    onDownloadProgress: updateProgress,
  });
  const infoResponse = await axios.get(`/breeds/search`, {
    params: { q: breedID },
  });
  const images = imageResponse.data;
  const info = infoResponse.data[0];

  // Clear carousel and info
  document.querySelector(".carousel-inner").innerHTML = "";
  infoDump.innerHTML = "";

  images.forEach(img => {
    let element = createCarouselItem(img.url, "", img.id);
    appendCarousel(element);
  });

  const infoHTML = `
    <h2>${info.name}</h2>
    <p><strong>Origin:</strong> ${info.origin}</p>
    <p><strong>Temperament:</strong> ${info.temperament}</p>
    <p><strong>Description:</strong> ${info.description}</p>
  `;
  infoDump.innerHTML = infoHTML;
}

// 8. Favourite Toggle
export async function favourite(imgId) {
  try {
    const favs = await axios.get("/favourites");
    const exists = favs.data.find(fav => fav.image_id === imgId);

    if (exists) {
      await axios.delete(`/favourites/${exists.id}`);
      console.log("Unfavourited", imgId);
    } else {
      await axios.post("/favourites", { image_id: imgId });
      console.log("Favourited", imgId);
    }
  } catch (error) {
    console.error("Error toggling favourite:", error);
  }
}

// 9. Get and display favourites
getFavouritesBtn.addEventListener("click", getFavourites);
async function getFavourites() {
  try {
    const response = await axios.get("/favourites");
    const favourites = response.data;

    document.querySelector(".carousel-inner").innerHTML = "";
    infoDump.innerHTML = "<h2>Your Favourites</h2>";

    favourites.forEach(fav => {
      let element = createCarouselItem(fav.image.url, "", fav.image_id);
      appendCarousel(element);
    });
  } catch (error) {
    console.error("Error getting favourites:", error);
  }
}







































