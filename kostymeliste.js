// kostymeliste.js
// global variables
window.kostymeliste = window.kostymeliste || {};

// Store all costume data for filtering
kostymeliste.allCostumes = [];
kostymeliste.filteredCostumes = [];

kostymeliste.addCostumeCard = function({ title, subcategory, size, description, imagecurl, amount }) {

  let directImageUrl, fullImageUrl;
  // console log for imagecurl
    console.log("📷 Image URL:", imagecurl);
  if (imagecurl && imagecurl.startsWith("https://drive.google.com/")) {
    // Case 1: Google Drive image — extract ID and use thumbnail
    const imageId = imagecurl.match(/[-\w]{25,}/)?.[0];
    directImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s150`
      : "placeholder.png";
    fullImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
      : "placeholder.png";
  } else {
    // Case 2: Base64 or direct link
    directImageUrl = imagecurl || "placeholder.png";
    fullImageUrl = imagecurl || "placeholder.png";
  }

  const container = document.getElementById('costumeList');
  const card = document.createElement('div');
  card.className = "col";

    card.innerHTML = `
    <div class="card small-costume-card shadow-sm"
        data-bs-toggle="modal"
        data-bs-target="#imageModal"
        data-img="${fullImageUrl}">

        <img src="${directImageUrl}" class="card-img-thumbnail" alt="Kostyme bilde">
        <div class="card-body">
        <h6 class="mb-1">${title}</h6>
        <div style="font-size: 0.85rem;">
            <div><strong>Underkategori:</strong> ${subcategory || 'Ikke angitt'}</div>
            <div><strong>Størrelse:</strong> ${size || 'Ikke angitt'}</div>
            <div><strong>Antall:</strong> ${amount || 1}</div>
            <div><strong>Beskrivelse:</strong> ${description && description.trim() ? description : 'Ingen beskrivelse'}</div>
        </div>
        </div>
    </div>
    `;


  container.prepend(card);
}

// Function to add costume card with edit button (for endre.html)
kostymeliste.addEditableCostumeCard = function({ kostymeid, title, subcategory, size, description, imagecurl, amount }) {

  let directImageUrl, fullImageUrl;
  // console log for imagecurl
    // console.log("📷 Image URL:", imagecurl);
  if (imagecurl && imagecurl.startsWith("https://drive.google.com/")) {
    // Case 1: Google Drive image — extract ID and use thumbnail
    const imageId = imagecurl.match(/[-\w]{25,}/)?.[0];
    directImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s400`
      : "placeholder.png";
    fullImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
      : "placeholder.png";
  } else {
    // Case 2: Base64 or direct link
    directImageUrl = imagecurl || "placeholder.png";
    fullImageUrl = imagecurl || "placeholder.png";
  }

  const container = document.getElementById('costumeList');
  const card = document.createElement('div');
  card.className = "col";

    card.innerHTML = `
    <div class="card small-costume-card shadow-sm costume-edit-card" 
         data-kostyme-id="${kostymeid}"
         data-title="${title || ''}"
         data-subcategory="${subcategory || ''}"
         data-size="${size || ''}"
         data-description="${description || ''}"
         data-amount="${amount || 1}"
         data-image-url="${imagecurl || ''}">

        <img src="${directImageUrl}" class="card-img-thumbnail clickable-image" alt="Kostyme bilde"
             data-bs-toggle="modal" data-bs-target="#imageModal" data-img="${fullImageUrl}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="mb-0 flex-grow-1">${title}</h6>
            <button class="btn btn-primary btn-sm edit-costume-btn ms-2" data-kostyme-id="${kostymeid}">
                <i class="fas fa-edit"></i>
            </button>
          </div>
          <div style="font-size: 0.85rem;">
              <div><strong>Underkategori:</strong> ${subcategory || 'Ikke angitt'}</div>
              <div><strong>Størrelse:</strong> ${size || 'Ikke angitt'}</div>
              <div><strong>Antall:</strong> ${amount || 1}</div>
              <div><strong>Beskrivelse:</strong> ${description && description.trim() ? description : 'Ingen beskrivelse'}</div>
          </div>
        </div>
    </div>
    `;

  container.prepend(card);
}

// Function to add costume card with delete button (for slett.html)
kostymeliste.addDeletableCostumeCard = function({ kostymeid, title, subcategory, size, description, imagecurl, amount }) {

  let directImageUrl, fullImageUrl;
  // console log for imagecurl
    console.log("📷 Image URL:", imagecurl);
  if (imagecurl && imagecurl.startsWith("https://drive.google.com/")) {
    // Case 1: Google Drive image — extract ID and use thumbnail
    const imageId = imagecurl.match(/[-\w]{25,}/)?.[0];
    directImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s400`
      : "placeholder.png";
    fullImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
      : "placeholder.png";
  } else {
    // Case 2: Base64 or direct link
    directImageUrl = imagecurl || "placeholder.png";
    fullImageUrl = imagecurl || "placeholder.png";
  }

  const container = document.getElementById('costumeList');
  const card = document.createElement('div');
  card.className = "col";

    card.innerHTML = `
    <div class="card small-costume-card shadow-sm costume-delete-card" 
         data-kostyme-id="${kostymeid}"
         data-title="${title || ''}"
         data-subcategory="${subcategory || ''}"
         data-size="${size || ''}"
         data-description="${description || ''}"
         data-amount="${amount || 1}"
         data-image-url="${imagecurl || ''}">

        <img src="${directImageUrl}" class="card-img-thumbnail clickable-image" alt="Kostyme bilde"
             data-bs-toggle="modal" data-bs-target="#imageModal" data-img="${fullImageUrl}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="mb-0 flex-grow-1">${title}</h6>
            <button class="btn btn-danger btn-sm delete-costume-btn ms-2" data-kostyme-id="${kostymeid}">
                <i class="fas fa-trash"></i>
            </button>
          </div>
          <div style="font-size: 0.85rem;">
              <div><strong>Underkategori:</strong> ${subcategory || 'Ikke angitt'}</div>
              <div><strong>Størrelse:</strong> ${size || 'Ikke angitt'}</div>
              <div><strong>Antall:</strong> ${amount || 1}</div>
              <div><strong>Beskrivelse:</strong> ${description && description.trim() ? description : 'Ingen beskrivelse'}</div>
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
      // Store all costumes for filtering
      kostymeliste.allCostumes = data.sheet1
        .filter(row => !row.deleted)
        .sort((a, b) => Number(a.id) - Number(b.id)); // ✅ oldest first
      
      // Initially show all costumes
      kostymeliste.filteredCostumes = [...kostymeliste.allCostumes];
      
      // Populate filters
      kostymeliste.populateFilters();
      
      // Display costumes
      kostymeliste.displayCostumes();
    }

  } catch (err) {
    console.error("❌ Feil ved lasting av kostymer:", err.message);
  }
};

// Function to determine which display mode to use
kostymeliste.getDisplayMode = function() {
  // Check if we're on the endre.html page by looking for the edit form
  if (document.getElementById('editForm')) {
    return 'edit';
  }
  // Check if we're on the slett.html page by looking for the delete section
  if (document.getElementById('deleteSection')) {
    return 'delete';
  }
  return 'normal';
};

// Function to display costumes with appropriate mode
kostymeliste.displayCostumes = function() {
  const mode = kostymeliste.getDisplayMode();
  if (mode === 'edit') {
    kostymeliste.displayEditableCostumes();
  } else if (mode === 'delete') {
    kostymeliste.displayDeletableCostumes();
  } else {
    kostymeliste.displayNormalCostumes();
  }
};

// Function to display normal costume cards
kostymeliste.displayNormalCostumes = function() {
  const container = document.getElementById('costumeList');
  if (!container) return;

  container.innerHTML = '';
  
  kostymeliste.filteredCostumes.forEach(c => {
    kostymeliste.addCostumeCard(c);
  });
};

// Function to populate filter dropdowns
kostymeliste.populateFilters = function() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  
  if (!titleFilter || !subcategoryFilter) return;

  // Get unique titles
  const uniqueTitles = [...new Set(kostymeliste.allCostumes.map(c => c.title))].sort();
  
  // Clear and populate title filter
  titleFilter.innerHTML = '<option value="">Alle kategorier</option>';
  uniqueTitles.forEach(title => {
    const option = document.createElement('option');
    option.value = title;
    option.textContent = title;
    titleFilter.appendChild(option);
  });
};

// Function to update subcategory filter based on selected title
kostymeliste.updateSubcategoryFilter = function(selectedTitle) {
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  if (!subcategoryFilter) return;

  subcategoryFilter.innerHTML = '<option value="">Alle underkategorier</option>';
  
  if (!selectedTitle) {
    subcategoryFilter.disabled = true;
    return;
  }

  // Get unique subcategories for the selected title
  const uniqueSubcategories = [...new Set(
    kostymeliste.allCostumes
      .filter(c => c.title === selectedTitle)
      .map(c => c.subcategory)
      .filter(sub => sub && sub.trim() !== '')
  )].sort();

  if (uniqueSubcategories.length > 0) {
    subcategoryFilter.disabled = false;
    uniqueSubcategories.forEach(subcategory => {
      const option = document.createElement('option');
      option.value = subcategory;
      option.textContent = subcategory;
      subcategoryFilter.appendChild(option);
    });
  } else {
    subcategoryFilter.disabled = true;
  }
};

// Function to apply filters
kostymeliste.applyFilters = function() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  
  if (!titleFilter || !subcategoryFilter) return;

  const selectedTitle = titleFilter.value;
  const selectedSubcategory = subcategoryFilter.value;

  kostymeliste.filteredCostumes = kostymeliste.allCostumes.filter(costume => {
    const titleMatch = !selectedTitle || costume.title === selectedTitle;
    const subcategoryMatch = !selectedSubcategory || costume.subcategory === selectedSubcategory;
    return titleMatch && subcategoryMatch;
  });

  kostymeliste.displayCostumes();
  kostymeliste.updateFilterCount();
};
kostymeliste.displayEditableCostumes = function() {
  const container = document.getElementById('costumeList');
  if (!container) return;

  container.innerHTML = '';
  
  kostymeliste.filteredCostumes.forEach(c => {
    kostymeliste.addEditableCostumeCard(c);
  });
};

// Function to display costumes for deleting
kostymeliste.displayDeletableCostumes = function() {
  const container = document.getElementById('costumeList');
  if (!container) return;

  container.innerHTML = '';
  
  kostymeliste.filteredCostumes.forEach(c => {
    kostymeliste.addDeletableCostumeCard(c);
  });
};

// Function to update filter count display
kostymeliste.updateFilterCount = function() {
  const filterCount = document.getElementById('filterCount');
  if (!filterCount) return;

  const total = kostymeliste.allCostumes.length;
  const filtered = kostymeliste.filteredCostumes.length;
  
  if (filtered === total) {
    filterCount.textContent = `Viser alle ${total} kostymer`;
  } else {
    filterCount.textContent = `Viser ${filtered} av ${total} kostymer`;
  }
};

// Function to clear all filters
kostymeliste.clearFilters = function() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  
  if (titleFilter) titleFilter.value = '';
  if (subcategoryFilter) {
    subcategoryFilter.value = '';
    subcategoryFilter.disabled = true;
  }
  
  kostymeliste.filteredCostumes = [...kostymeliste.allCostumes];
  kostymeliste.displayCostumes();
  kostymeliste.updateFilterCount();
};

// Initialize filter event listeners
kostymeliste.initializeFilters = function() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');

  if (titleFilter) {
    titleFilter.addEventListener('change', function() {
      kostymeliste.updateSubcategoryFilter(this.value);
      kostymeliste.applyFilters();
    });
  }

  if (subcategoryFilter) {
    subcategoryFilter.addEventListener('change', function() {
      kostymeliste.applyFilters();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      kostymeliste.clearFilters();
    });
  }
};