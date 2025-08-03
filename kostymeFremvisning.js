// kostymeFremvisning.js

const container = document.getElementById("cardContainer");
const modalImage = document.getElementById("modalImage");

// Store all costume data for filtering
let allCostumes = [];
let filteredCostumes = [];

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
      // Store all costumes for filtering
      allCostumes = data.sheet1
        .filter(c => !c.deleted)
        .sort((a, b) => a.kostymeid.localeCompare(b.kostymeid));
      
      // Show filter count immediately after data is loaded
      const filterCount = document.getElementById('filterCount');
      if (filterCount) {
        filterCount.textContent = `Viser alle ${allCostumes.length} kostymer`;
      }
      
      // Initially show all costumes
      filteredCostumes = [...allCostumes];
      
      // Populate filters
      populateFilters();
      
      // Display costumes
      displayCostumes();
      
      console.log(`🎭 Displaying ${allCostumes.length} costumes`);
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

  // Determine what to show in the second line based on category
  let secondLineContent;
  if (c.title && c.title.toLowerCase() === "rekvisitter") {
    // For "Rekvisitter" category, show description instead of size
    secondLineContent = c.description && c.description.trim() 
      ? `<p><strong>Beskrivelse:</strong> ${c.description}</p>`
      : `<p><strong>Beskrivelse:</strong> <em>Ingen beskrivelse</em></p>`;
  } else {
    // For all other categories, show size
    secondLineContent = `<p><strong>Størrelse:</strong> ${c.size || 'Ikke angitt'}</p>`;
  }

  const col = document.createElement("div");
  col.className = "col-sm-6 col-md-4 col-lg-3 mb-4";

  col.innerHTML = `
    <div class="card shadow-sm h-100">
      <img src="${thumbUrl}" alt="${c.title}" class="card-img-top"
        data-bs-toggle="modal" data-bs-target="#imageModal"
        data-img="${fullSizeUrl}" style="cursor:pointer;">
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="card-title mb-0 flex-grow-1">${c.title}</h5>
          <button class="btn btn-primary btn-sm add-to-cart-btn ms-2" 
                  data-costume-id="${c.kostymeid}" 
                  data-costume-title="${c.title}"
                  data-costume-subcategory="${c.subcategory || ''}"
                  data-costume-size="${c.size || ''}"
                  data-costume-description="${c.description || ''}"
                  data-costume-image="${thumbUrl}">
            <i class="fas fa-plus"></i>
            <span class="d-none d-sm-inline ms-1">Legg til</span>
          </button>
        </div>
        <p class="mb-1"><strong>Underkategori:</strong> ${c.subcategory || 'Ikke angitt'}</p>
        ${secondLineContent}
      </div>
    </div>
  `;

  container.appendChild(col);
}

// Function to populate filter dropdowns
function populateFilters() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  
  if (!titleFilter || !subcategoryFilter) return;

  // Get unique titles - only show titles that have at least one non-deleted costume
  const uniqueTitles = [...new Set(
    allCostumes
      .filter(c => !c.deleted) // Only include non-deleted costumes
      .map(c => c.title)
      .filter(title => title && title.trim() !== '') // Ensure title exists and is not empty
  )].sort();
  
  // Clear and populate title filter
  titleFilter.innerHTML = '<option value="">Alle kategorier</option>';
  uniqueTitles.forEach(title => {
    const option = document.createElement('option');
    option.value = title;
    option.textContent = title;
    titleFilter.appendChild(option);
  });
}

// Function to update subcategory filter based on selected title
function updateSubcategoryFilter(selectedTitle) {
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  if (!subcategoryFilter) return;

  subcategoryFilter.innerHTML = '<option value="">Alle underkategorier</option>';
  
  if (!selectedTitle) {
    subcategoryFilter.disabled = true;
    return;
  }

  // Get unique subcategories for the selected title from non-deleted costumes only
  const uniqueSubcategories = [...new Set(
    allCostumes
      .filter(c => !c.deleted && c.title === selectedTitle)
      .map(c => c.subcategory)
      .filter(sub => sub && typeof sub === 'string' && sub.trim() !== '')
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
}

// Function to apply filters
function applyFilters() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  
  if (!titleFilter || !subcategoryFilter) return;

  const selectedTitle = titleFilter.value;
  const selectedSubcategory = subcategoryFilter.value;

  filteredCostumes = allCostumes.filter(costume => {
    const titleMatch = !selectedTitle || costume.title === selectedTitle;
    const subcategoryMatch = !selectedSubcategory || costume.subcategory === selectedSubcategory;
    return titleMatch && subcategoryMatch;
  });

  displayCostumes();
  updateFilterCount();
}

// Function to display filtered costumes
function displayCostumes() {
  container.innerHTML = '';
  
  filteredCostumes.forEach(c => {
    addCostumeCard(c);
  });
  
  // Update cart button states after displaying costumes
  if (window.cart) {
    window.cart.updateButtonStates();
  }
}

// Function to update filter count display
function updateFilterCount() {
  const filterCount = document.getElementById('filterCount');
  if (!filterCount) return;

  const total = allCostumes.length;
  const filtered = filteredCostumes.length;
  
  if (filtered === total) {
    filterCount.textContent = `Viser alle ${total} kostymer`;
  } else {
    filterCount.textContent = `Viser ${filtered} av ${total} kostymer`;
  }
}

// Function to clear all filters
function clearFilters() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  
  if (titleFilter) titleFilter.value = '';
  if (subcategoryFilter) {
    subcategoryFilter.value = '';
    subcategoryFilter.disabled = true;
  }
  
  filteredCostumes = [...allCostumes];
  displayCostumes();
  updateFilterCount();
}

// Initialize filter event listeners
function initializeFilters() {
  const titleFilter = document.getElementById('titleFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');

  if (titleFilter) {
    titleFilter.addEventListener('change', function() {
      updateSubcategoryFilter(this.value);
      applyFilters();
    });
  }

  if (subcategoryFilter) {
    subcategoryFilter.addEventListener('change', function() {
      applyFilters();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      clearFilters();
    });
  }
}

// Fullscreen image modal
document.body.addEventListener("click", (e) => {
  const img = e.target.closest("[data-bs-toggle='modal'][data-img]");
  if (img) {
    modalImage.src = img.getAttribute("data-img");
  }
});

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadCostumesFromSheety();
  
  // Initialize filters after a short delay to ensure DOM is ready
  setTimeout(() => {
    initializeFilters();
  }, 100);
});