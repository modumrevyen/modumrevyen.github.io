// kostymeSlett.js
// Delete functionality for costumes

const deleteSection = document.getElementById('deleteSection');
const noSelectionMessage = document.getElementById('noSelectionMessage');
const deleteMessageBox = document.getElementById('deleteMessageBox');

// Google Apps Script URL and proxy setup (same as registration and editing)
const googleurl = 'https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec';
const proxy = "https://modumrevyen.sayver.net/proxy.php";
const proxiedUrl = `${proxy}?url=${encodeURIComponent(googleurl)}`;

let currentDeletingCostume = null;

// Initialize delete functionality
document.addEventListener('DOMContentLoaded', function() {
  // The kostymeliste.js will automatically detect this is the delete page and show delete buttons
});

// Handle delete button clicks
document.addEventListener('click', function(e) {
  if (e.target.closest('.delete-costume-btn')) {
    const button = e.target.closest('.delete-costume-btn');
    const card = button.closest('.costume-delete-card');
    
    if (card) {
      loadCostumeForDelete(card);
    }
  }
  
  // Handle modal image clicks for costume list images
  if (e.target.closest('.clickable-image')) {
    const img = e.target.closest('.clickable-image');
    const imageUrl = img.getAttribute('data-img') || img.src;
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
      modalImage.src = imageUrl;
    }
  }
});

// Load costume data for deletion confirmation
function loadCostumeForDelete(card) {
  const kostymeId = card.getAttribute('data-kostyme-id');
  const title = card.getAttribute('data-title');
  const subcategory = card.getAttribute('data-subcategory');
  const size = card.getAttribute('data-size');
  const amount = card.getAttribute('data-amount');
  const description = card.getAttribute('data-description');
  const imageUrl = card.getAttribute('data-image-url');

  // Store current costume data
  currentDeletingCostume = {
    id: kostymeId,
    title,
    subcategory,
    size,
    amount,
    description,
    imageUrl
  };

  // Populate delete confirmation section
  document.getElementById('deleteTitle').textContent = title || 'Ikke angitt';
  document.getElementById('deleteSubcategory').textContent = subcategory || 'Ikke angitt';
  document.getElementById('deleteSize').textContent = size || 'Ikke angitt';
  document.getElementById('deleteAmount').textContent = amount || '1';
  document.getElementById('deleteDescription').textContent = description || 'Ingen beskrivelse';
  document.getElementById('deleteKostymeId').textContent = kostymeId;

  // Set up image
  const deleteImage = document.getElementById('deleteImage');
  if (imageUrl) {
    let directImageUrl, fullImageUrl;
    if (imageUrl.startsWith("https://drive.google.com/")) {
      const imageId = imageUrl.match(/[-\w]{25,}/)?.[0];
      directImageUrl = imageId
        ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s150`
        : "placeholder.png";
      fullImageUrl = imageId
        ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
        : "placeholder.png";
    } else {
      directImageUrl = imageUrl;
      fullImageUrl = imageUrl;
    }
    deleteImage.src = directImageUrl;
    deleteImage.setAttribute('data-img', fullImageUrl);
  }

  // Show delete section, hide no selection message
  deleteSection.classList.remove('d-none');
  noSelectionMessage.classList.add('d-none');
  
  // Clear any previous messages
  hideMessage();

  // Try multiple scroll approaches
  console.log('🔝 Attempting to scroll to top...');
  console.log('Current scroll position:', window.pageYOffset || document.documentElement.scrollTop);
  
  // Try different scroll methods
  window.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // Also try scrolling the content area specifically
  const contentArea = document.querySelector('.content-area');
  if (contentArea) {
    contentArea.scrollTop = 0;
    console.log('Content area scrollTop set to 0');
  }
  
  console.log('🔝 All scroll commands executed');
}

// Handle confirm delete button
document.getElementById('confirmDelete').addEventListener('click', async function() {
  if (!currentDeletingCostume) {
    showMessage('Ingen kostyme valgt for sletting.', 'danger');
    return;
  }

  const button = this;
  const originalText = button.innerHTML;
  
  try {
    // Disable button and show loading
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sletter...';
    
    showMessage('Sletter kostyme...', 'info');

    // Find the full costume object from kostymeliste
    const fullCostume = kostymeliste.allCostumes.find(c => c.kostymeid === currentDeletingCostume.id);
    
    if (!fullCostume) {
      throw new Error('Kunne ikke finne kostyme data');
    }

    // Prepare update data to mark as deleted (similar to kostymeEndring.js)
    const updateData = {
      sheet: "Sheet1",
      action: 'update',
      kostymeid: currentDeletingCostume.id,
      Sheet1: {
        kostymeid: currentDeletingCostume.id,
        title: fullCostume.title,
        subcategory: fullCostume.subcategory,
        size: fullCostume.size,
        amount: fullCostume.amount,
        description: fullCostume.description,
        imagecname: fullCostume.imagecname,
        imagecurl: fullCostume.imagecurl,
        createdat: fullCostume.createdat,
        reservasjonid: fullCostume.reservasjonid || "",
        reservedname: fullCostume.reservedname || "",
        reservedphone: fullCostume.reservedphone || "",
        reservedemail: fullCostume.reservedemail || "",
        reservedfrom: fullCostume.reservedfrom || "",
        reservedto: fullCostume.reservedto || "",
        returned: fullCostume.returned || false,
        deleted: true // ✅ This is the key change - mark as deleted
      }
    };

    // Submit to Google Apps Script using POST (like kostymeEndring.js)
    const response = await fetch(proxiedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });

    const result = await response.text();
    console.log('📄 Delete/Update response:', result);

    showMessage(`✅ Kostyme "${currentDeletingCostume.title}" er slettet!`, 'success');
    
    // Remove the costume from the current view
    const costumeCard = document.querySelector(`[data-kostyme-id="${currentDeletingCostume.id}"]`);
    if (costumeCard) {
      costumeCard.closest('.col').remove();
    }
    
    // Update the costume data in kostymeliste
    if (typeof kostymeliste !== 'undefined' && kostymeliste.allCostumes) {
      const costume = kostymeliste.allCostumes.find(c => c.kostymeid === currentDeletingCostume.id);
      if (costume) {
        costume.deleted = true;
      }
      // Update filtered costumes as well
      kostymeliste.filteredCostumes = kostymeliste.filteredCostumes.filter(c => c.kostymeid !== currentDeletingCostume.id);
      
      // Update filter count
      if (typeof kostymeliste.updateFilterCount === 'function') {
        kostymeliste.updateFilterCount();
      }
    }
    
    // Clear the delete section after successful deletion
    setTimeout(() => {
      cancelDelete();
    }, 2000);

  } catch (error) {
    console.error('Error deleting costume:', error);
    showMessage('Feil ved sletting av kostyme. Prøv igjen.', 'danger');
  } finally {
    // Re-enable button
    button.disabled = false;
    button.innerHTML = originalText;
  }
});

// Handle cancel delete button
document.getElementById('cancelDelete').addEventListener('click', cancelDelete);

function cancelDelete() {
  // Hide delete section, show no selection message
  deleteSection.classList.add('d-none');
  noSelectionMessage.classList.remove('d-none');
  
  // Clear current costume data
  currentDeletingCostume = null;
  
  // Clear any messages
  hideMessage();
}

function showMessage(message, type = 'info') {
  deleteMessageBox.className = `alert alert-${type} mt-4`;
  deleteMessageBox.textContent = message;
  deleteMessageBox.classList.remove('d-none');
}

function hideMessage() {
  deleteMessageBox.classList.add('d-none');
}
