// kostymeFremvisning.js

const container = document.getElementById("cardContainer");
const modalImage = document.getElementById("modalImage");

async function loadCostumesFromSheety() {
  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbwGyq1qrj2AKjmiuWMwMt8NApojFvHuwuIGggYr9YOUFHZbCsT_WI5mXulTqlQQ9f3k9A/exec");
    const data = await res.json();

    if (data.sheet1 && Array.isArray(data.sheet1)) {
      // Clear existing cards
      container.innerHTML = "";

      // Filter out deleted entries and sort by ID (oldest first)
      data.sheet1
        .filter(c => !c.deleted)
        .sort((a, b) => Number(a.id) - Number(b.id))
        .forEach(c => addCostumeCard(c));
    }
  } catch (err) {
    console.error("❌ Feil ved lasting av kostymer:", err.message);
  }
}

function addCostumeCard(c) {
  const imageId = c.imagegurl?.match(/[-\w]{25,}/)?.[0]; // Extract file ID
  const directImageUrl = imageId ? `https://drive.google.com/uc?export=view&id=${imageId}` : "";

  const col = document.createElement("div");
  col.className = "col-sm-6 col-md-4 col-lg-3 mb-4";

    col.innerHTML = `
    <div class="card shadow-sm h-100">
        <img src="${directImageUrl}" alt="${c.title}" class="card-img-top"
            data-bs-toggle="modal" data-bs-target="#imageModal" data-img="${directImageUrl}" style="cursor:pointer;">
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