// kostymeFremvisning.js

const container = document.getElementById("cardContainer");
const modalImage = document.getElementById("modalImage");

async function loadCostumesFromSheety() {
  try {
    console.log("📡 Fetching costumes from GitHub...");

    // const githubUrl = "https://modumrevyen.github.io/kostymer.json"; // caching json as normal
    const githubUrl = "https://modumrevyen.github.io/kostymer.json?ts=" + Date.now(); // no json caching

    const res = await fetch(githubUrl);

    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      throw new Error(`❌ HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("✅ Costume data received:", data);

    if (data.sheet1 && Array.isArray(data.sheet1)) {
      container.innerHTML = "";
      const filtered = data.sheet1.filter(c => !c.deleted);
      console.log(`🎭 Displaying ${filtered.length} costumes`);

      filtered
        .sort((a, b) => a.kostymeid.localeCompare(b.kostymeid))
        .forEach(c => addCostumeCard(c));
    } else {
      console.warn("⚠️ sheet1 data not found or not an array");
    }

  } catch (err) {
    console.error("❌ Feil ved lasting av kostymer:", err.message);
  }
}

function addCostumeCard(c) {
  const imageId = c.imagecurl?.match(/[-\w]{25,}/)?.[0]; // Extract file ID
  const thumbUrl = imageId
    ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s600`
    : "placeholder.png";
  const fullSizeUrl = imageId
    ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
    : "placeholder.png";

  const col = document.createElement("div");
  col.className = "col-sm-6 col-md-4 col-lg-3 mb-4";

  col.innerHTML = `
    <div class="card shadow-sm h-100">
      <img src="${thumbUrl}" alt="${c.title}" class="card-img-top"
        data-bs-toggle="modal" data-bs-target="#imageModal"
        data-img="${fullSizeUrl}" style="cursor:pointer;">
      <div class="card-body">
        <h5 class="card-title">${c.title}</h5>
        <p class="mb-1"><strong>Underkategori:</strong> ${c.subcategory}</p>
        <p><strong>Størrelse:</strong> ${c.size}</p>
      </div>
    </div>
  `;

  container.appendChild(col);
}

// Fullscreen image modal
document.body.addEventListener("click", (e) => {
  const img = e.target.closest("[data-bs-toggle='modal'][data-img]");
  if (img) {
    modalImage.src = img.getAttribute("data-img");
  }
});

// Run on load
loadCostumesFromSheety();