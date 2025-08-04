// kostymeFremvisning.js

const container = document.getElementById("cardContainer");
const modalImage = document.getElementById("modalImage");

// Store all costume data for filtering
let allCostumes = [];
let filteredCostumes = [];
let allReservations = [];
let costumeReservationLinks = [];

// Load reservation data for availability calculation
async function loadReservationData() {
  try {
    console.log("📡 Loading reservation data for availability...");
    
    const timestamp = Date.now();
    
    // Load reservations
    const reservationsResponse = await fetch(`reservasjoner.json?ts=${timestamp}`);
    const reservationsData = await reservationsResponse.json();
    allReservations = reservationsData.sheet2 || [];
    
    // Load costume-reservation links
    const linksResponse = await fetch(`kostymer_til_reservering.json?ts=${timestamp}`);
    const linksData = await linksResponse.json();
    costumeReservationLinks = linksData.sheet3 || [];
    
    console.log("✅ Reservation data loaded:", {
      reservations: allReservations.length,
      links: costumeReservationLinks.length
    });
    
  } catch (error) {
    console.warn("⚠️ Could not load reservation data:", error);
    // Continue without availability data - will show all as available
  }
}

// Calculate costume availability
function getCostumeAvailability(costumeId) {
  // Find the costume to get total amount
  const costume = allCostumes.find(c => c.kostymeid === costumeId);
  if (!costume) {
    return { 
      available: 0, 
      total: 0, 
      pending: 0,
      approved: 0,
      rented: 0,
      isAvailable: false,
      shouldHide: false,
      hasPendingWhenZero: false,
      canStillReserve: false
    };
  }
  
  const totalAmount = parseInt(costume.amount) || 1;
  
  // Find all reservations that have this costume
  const reservationsWithCostume = costumeReservationLinks
    .filter(link => link.kostymeid === costumeId)
    .map(link => link.reservasjonid);
  
  // Count different types of reservations
  const pendingReservations = allReservations.filter(r => 
    reservationsWithCostume.includes(r.reservasjonid) && r.status === 'pending'
  );
  
  const approvedReservations = allReservations.filter(r => 
    reservationsWithCostume.includes(r.reservasjonid) && r.status === 'approved'
  );
  
  const rentedReservations = allReservations.filter(r => 
    reservationsWithCostume.includes(r.reservasjonid) && r.status === 'rented'
  );
  
  const pendingCount = pendingReservations.length;
  const approvedCount = approvedReservations.length;
  const rentedCount = rentedReservations.length;
  
  // Calculate availability - ALL reservations (including pending) reduce displayed availability
  const totalReservations = pendingCount + approvedCount + rentedCount;
  const availableAmount = Math.max(0, totalAmount - totalReservations);
  
  // Only approved/rented reservations make item truly unavailable for new reservations
  const confirmedReservations = approvedCount + rentedCount;
  const canStillReserve = confirmedReservations < totalAmount;
  
  // Check if item should be hidden (approved/rented reservations use all stock)
  const shouldHide = confirmedReservations >= totalAmount;
  
  // Check if there are pending reservations when displayed available is 0
  const hasPendingWhenZero = availableAmount === 0 && pendingCount > 0 && canStillReserve;
  
  return {
    available: availableAmount,
    total: totalAmount,
    pending: pendingCount,
    approved: approvedCount,
    rented: rentedCount,
    isAvailable: availableAmount > 0,
    shouldHide: shouldHide,
    hasPendingWhenZero: hasPendingWhenZero,
    canStillReserve: canStillReserve
  };
}

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
      
      // Load reservation data for availability calculation
      await loadReservationData();
      
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
  // Check availability and decide if item should be hidden
  const availability = getCostumeAvailability(c.kostymeid);
  
  // Hide items that are fully allocated through approved/rented reservations
  if (availability.shouldHide) {
    return; // Don't add this card at all
  }
  
  const imageId = c.imagecurl?.match(/[-\w]{25,}/)?.[0]; // Extract file ID
  const thumbUrl = imageId
    ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s600`
    : "placeholder.png";
  const fullSizeUrl = imageId
    ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
    : "placeholder.png";

  // Determine card styling based on availability
  let cardClasses = "card shadow-sm h-100";
  let cornerIndicator = "";
  
  if (availability.hasPendingWhenZero) {
    cardClasses += " border-warning border-2"; // Orange border when 0 available but pending only
    cornerIndicator = `
      <div class="position-absolute top-0 end-0" style="z-index: 10; width: 0; height: 0; border-left: 30px solid transparent; border-top: 30px solid #ffc107;"
           data-bs-toggle="tooltip" 
           data-bs-placement="left" 
           title="Alle reservert">
        <i class="fas fa-clock position-absolute text-dark" style="top: -25px; right: -25px; font-size: 10px;"></i>
      </div>`;
  } else if (!availability.canStillReserve) {
    cardClasses += " border-danger border-2"; // Red border when truly unavailable
    cornerIndicator = `
      <div class="position-absolute top-0 end-0" style="z-index: 10; width: 0; height: 0; border-left: 30px solid transparent; border-top: 30px solid #dc3545;"
           data-bs-toggle="tooltip" 
           data-bs-placement="left" 
           title="Ikke tilgjengelig">
        <i class="fas fa-times position-absolute text-white" style="top: -25px; right: -25px; font-size: 10px;"></i>
      </div>`;
  }

  const col = document.createElement("div");
  col.className = "col-sm-6 col-md-4 col-lg-3 mb-4";

  col.innerHTML = `
    <div class="${cardClasses}" style="position: relative;">
      <div class="image-container" style="position: relative; overflow: hidden;">
        <img src="${thumbUrl}" alt="${c.title}" class="card-img-top costume-image"
          data-bs-toggle="modal" data-bs-target="#imageModal"
          data-img="${fullSizeUrl}" style="cursor:pointer; transition: transform 0.3s ease;">
        ${cornerIndicator}
      </div>
      <div class="card-body d-flex flex-column">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h5 class="card-title mb-0 flex-grow-1">${c.title}</h5>
          <button class="btn btn-primary btn-sm add-to-cart-btn ms-2" 
                  data-costume-id="${c.kostymeid}" 
                  data-costume-title="${c.title}"
                  data-costume-subcategory="${c.subcategory || ''}"
                  data-costume-size="${c.size || ''}"
                  data-costume-description="${c.description || ''}"
                  data-costume-amount="${c.amount || 1}"
                  data-costume-image="${thumbUrl}"
                  ${!availability.canStillReserve ? 'disabled' : ''}>
            <i class="fas fa-plus"></i>
            <span class="d-none d-sm-inline ms-1">Legg til</span>
          </button>
        </div>
        <p class="mb-1"><strong>Underkategori:</strong> ${c.subcategory || 'Ikke angitt'}</p>
        <p class="mb-1"><strong>Størrelse:</strong> ${c.size || 'Ikke angitt'}</p>
        <p class="mb-1"><strong>Antall:</strong> ${availability.available}/${availability.total}</p>
        <p class="mb-1"><strong>Beskrivelse:</strong> ${c.description && c.description.trim() ? c.description : 'Ingen beskrivelse'}</p>
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
  
  // Initialize tooltips for corner indicators
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
  
  // Add hover effects to images
  const images = document.querySelectorAll('.costume-image');
  images.forEach(img => {
    img.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
    });
    
    img.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
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