// kostymeliste.js
// global variables
window.kostymeliste = window.kostymeliste || {};

kostymeliste.addCostumeCard = function({ title, subcategory, size, imageurl }) {
  const container = document.getElementById('costumeList');
  const card = document.createElement('div');
  card.className = "col";

    card.innerHTML = `
    <div class="card small-costume-card shadow-sm"
        data-bs-toggle="modal"
        data-bs-target="#imageModal"
        data-img="${imageurl}">

        <img src="${imageurl}" class="card-img-thumbnail" alt="Kostyme bilde">
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
    const res = await fetch("https://api.sheety.co/939198e750dcf5981e21d4ad618f6849/kostymeUtleie/sheet1");
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
    console.error("❌ Failed to load costumes:", err.message);
  }
};