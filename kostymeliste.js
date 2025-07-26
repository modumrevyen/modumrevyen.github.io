// kostymeliste.js
// global variables
window.kostymeliste = window.kostymeliste || {};

kostymeliste.addCostumeCard = function({ title, subcategory, size, imagecurl }) {

  let directImageUrl;
  // console log for imagecurl
    console.log("📷 Image URL:", imagecurl);
  if (imagecurl && imagecurl.startsWith("https://drive.google.com/")) {
    // Case 1: Google Drive image — extract ID and use thumbnail
    const imageId = imagecurl.match(/[-\w]{25,}/)?.[0];
    directImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
      : "placeholder.png";
  } else {
    // Case 2: Base64 or direct link
    directImageUrl = imagecurl || "placeholder.png";
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
    // const githubUrl = "https://modumrevyen.github.io/kostymer.json"; // caching json as normal
    const githubUrl = "https://modumrevyen.github.io/kostymer.json?ts=" + Date.now(); // no json caching
    const res = await fetch(githubUrl);
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