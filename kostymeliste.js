// kostymeliste.js
// global variables
window.kostymeliste = window.kostymeliste || {};

kostymeliste.addCostumeCard = function({ title, subcategory, size, imageurl }) {

    // if imageurl start with "https://drive.google.com/" do this part if not skip it
    if (!imageurl || !imageurl.startsWith("https://drive.google.com/")) {
        const imageId = imageurl?.match(/[-\w]{25,}/)?.[0]; // Extract file ID from imageurl
        const directImageUrl = imageId
            ? `https://drive.google.com/thumbnail?id=${imageId}`
            : "placeholder.png"; // fallback image if needed
    } else {
        // if imageurl is base64 or direct URL, use it directly
        directImageUrl = imageurl;
    }


  const container = document.getElementById('costumeList');
  const card = document.createElement('div');
  card.className = "col";

    card.innerHTML = `
    <div class="card small-costume-card shadow-sm"
        data-bs-toggle="modal"
        data-bs-target="#imageModal"
        data-img="${directImageUrl}">

        <img src="${directImageUrl}" class="card-img-thumbnail" alt="Kostyme bilde">
        <div class="card-body">
        <h6 class="mb-1">${title}</h6>
        <div style="font-size: 0.85rem;">
            <div><strong>Underkategori:</strong> ${subcategory}</div>
            <div><strong>Størrelse:</strong> ${size}</div>
        </div>
        </div>
    </div>
    `;


  container.prepend(card);
}

kostymeliste.loadCostumes = async function () {
  const container = document.getElementById('costumeList');
  container.innerHTML = '';

  try {
    const googleUrl = "https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec";
    const proxyUrl = "https://modumrevyen.sayver.net/proxy.php?url=" + encodeURIComponent(googleUrl);

    const res = await fetch(proxyUrl);
        if (!res.ok) {
      throw new Error(`❌ HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (data.sheet1 && Array.isArray(data.sheet1)) {
      data.sheet1
        .filter(row => !row.deleted)
        .sort((a, b) => Number(a.id) - Number(b.id)) // ✅ oldest first
        .forEach(c => {
          kostymeliste.addCostumeCard(c);
          console.log("📄 Loaded costume:", c);
        });
    }

  } catch (err) {
    console.error("❌ Feil ved lasting av kostymer:", err.message);
  }
};