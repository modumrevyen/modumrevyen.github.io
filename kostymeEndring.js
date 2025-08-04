// kostymeEndring.js
// Edit functionality for costumes

const editForm = document.getElementById('editForm');
const editMessageBox = document.getElementById('editMessageBox');
const editSection = document.getElementById('editSection');
const noSelectionMessage = document.getElementById('noSelectionMessage');

// Google Apps Script URL and proxy setup (same as registration)
const googleurl = 'https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec';
const proxy = "https://modumrevyen.sayver.net/proxy.php";
const proxiedUrl = `${proxy}?url=${encodeURIComponent(googleurl)}`;

let currentEditingCostume = null;

// Initialize edit functionality
document.addEventListener('DOMContentLoaded', function() {
  // Edit functionality will be handled by kostymeliste.js automatically
  // based on detecting the presence of editForm element
  
  // Add image preview functionality for edit image input
  const editImageInput = document.getElementById('editImageInput');
  if (editImageInput) {
    editImageInput.addEventListener('change', handleImagePreview);
  }
});

// Handle edit button clicks
document.addEventListener('click', function(e) {
  if (e.target.closest('.edit-costume-btn')) {
    const button = e.target.closest('.edit-costume-btn');
    const costumeId = button.getAttribute('data-kostyme-id');
    const card = button.closest('.costume-edit-card');
    
    if (card) {
      loadCostumeForEdit(card);
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

// Load costume data into edit form
function loadCostumeForEdit(card) {
  const kostymeId = card.getAttribute('data-kostyme-id');
  const title = card.getAttribute('data-title');
  const subcategory = card.getAttribute('data-subcategory');
  const size = card.getAttribute('data-size');
  const amount = card.getAttribute('data-amount');
  const description = card.getAttribute('data-description');
  const imageUrl = card.getAttribute('data-image-url');

  // Find the full costume object
  currentEditingCostume = kostymeliste.allCostumes.find(c => c.kostymeid === kostymeId);
  
  if (!currentEditingCostume) {
    console.error('Could not find costume with ID:', kostymeId);
    return;
  }

  // Populate form fields
  document.getElementById('editKostymeId').value = kostymeId;
  document.getElementById('editTitle').value = title;
  document.getElementById('editSubcategory').value = subcategory;
  document.getElementById('editSize').value = size;
  document.getElementById('editAmount').value = amount || "1";
  document.getElementById('editDescription').value = description;

  // Set current image
  const currentImage = document.getElementById('currentImage');
  let directImageUrl, fullImageUrl;
  if (imageUrl && imageUrl.startsWith("https://drive.google.com/")) {
    const imageId = imageUrl.match(/[-\w]{25,}/)?.[0];
    directImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s150`
      : "placeholder.png";
    fullImageUrl = imageId
      ? `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`
      : "placeholder.png";
  } else {
    directImageUrl = imageUrl || "placeholder.png";
    fullImageUrl = imageUrl || "placeholder.png";
  }
  currentImage.src = directImageUrl;
  currentImage.setAttribute('data-img', fullImageUrl); // For modal functionality

  // Show edit section, hide no selection message
  editSection.classList.remove('d-none');
  noSelectionMessage.classList.add('d-none');

  // Clear any previous messages
  editMessageBox.classList.add('d-none');
  
  // Clear file input
  document.getElementById('editImageInput').value = '';

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

// Handle image preview when new image is selected
async function handleImagePreview(event) {
  const file = event.target.files[0];
  const currentImage = document.getElementById('currentImage');
  
  if (!file || !currentImage) {
    return;
  }
  
  try {
    // Show loading state
    showEditMessage('⏳ Forhåndsviser nytt bilde...', 'info');
    
    // Compress the image for preview
    const compressedImage = await compressImage(file, 0.9);
    if (!compressedImage) {
      throw new Error("Feil under bildekomprimering for forhåndsvisning.");
    }
    
    // Convert to base64 for preview
    const previewBase64 = await imageToBase64(compressedImage);
    const previewUrl = `data:image/jpeg;base64,${previewBase64}`;
    
    // Update the current image display with the new preview
    currentImage.src = previewUrl;
    currentImage.setAttribute('data-img', previewUrl); // For modal functionality
    
    // ✅ ALSO update the costume card image in the list
    if (currentEditingCostume) {
      const costumeCard = document.querySelector(`[data-kostyme-id="${currentEditingCostume.kostymeid}"]`);
      if (costumeCard) {
        const cardImage = costumeCard.querySelector('.card-img-thumbnail, .clickable-image');
        if (cardImage) {
          cardImage.src = previewUrl;
          cardImage.setAttribute('data-img', previewUrl); // For modal functionality
        }
      }
    }
    
    // Clear the loading message
    editMessageBox.classList.add('d-none');
    
    console.log('📷 Image preview updated in both form and card');
    
  } catch (error) {
    console.error('❌ Preview error:', error);
    showEditMessage(`❌ Feil ved forhåndsvisning: ${error.message}`, 'danger');
  }
}

// Handle form submission
editForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (!currentEditingCostume) {
    showEditMessage('Ingen kostyme valgt for redigering.', 'danger');
    return;
  }

  showEditMessage('⏳ Lagrer endringer...', 'info');

  try {
    const kostymeId = document.getElementById('editKostymeId').value;
    const title = document.getElementById('editTitle').value.trim();
    const subcategory = document.getElementById('editSubcategory').value.trim();
    const size = document.getElementById('editSize').value.trim();
    const amount = document.getElementById('editAmount').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const imageFile = document.getElementById('editImageInput').files[0];

    if (!title) {
      showEditMessage('Tittel er påkrevd.', 'danger');
      return;
    }

    let imagecbase64 = '';
    let imagecname = currentEditingCostume.imagecname;
    let imagecurl = currentEditingCostume.imagecurl;

    // Handle image replacement if new image is uploaded
    if (imageFile) {
      showEditMessage('⏳ Behandler nytt bilde...', 'info');
      
      // Compress and convert new image
      const compressedImage = await compressImage(imageFile, 0.9);
      if (!compressedImage) {
        throw new Error("Feil under bildekomprimering.");
      }

      imagecbase64 = await imageToBase64(compressedImage);
      console.log("📦 Original file name:", imageFile.name);
      console.log("📦 Compressed file name:", imagecname);
      console.log("📷 New image base64:", imagecbase64);
      const timestamp = Date.now();
      imagecname = `compressed_${timestamp}_${imageFile.name.replace(/\s+/g, "-")}`;
      imagecurl = ''; // Will be updated by Google Apps Script
    }

    // Prepare update data
    console.log("🕒 Original createdat:", currentEditingCostume.createdat, typeof currentEditingCostume.createdat);
    
    // Ensure createdat preserves its original format (don't let JS convert it to ISO)
    let preservedCreatedat = currentEditingCostume.createdat;
    if (typeof preservedCreatedat === 'string' && preservedCreatedat.includes('T')) {
      // If it's already in ISO format, extract just the date part
      preservedCreatedat = preservedCreatedat.split('T')[0];
    }
    console.log("🕒 Preserved createdat:", preservedCreatedat);

    const Sheet1 = {
      kostymeid: kostymeId,
      title,
      subcategory,
      size,
      amount,
      description,
      imagecname,
      imagecurl,
      createdat: preservedCreatedat, // Use preserved format
      reservasjonid: currentEditingCostume.reservasjonid || "",
      reservedname: currentEditingCostume.reservedname || "",
      reservedphone: currentEditingCostume.reservedphone || "",
      reservedemail: currentEditingCostume.reservedemail || "",
      reservedfrom: currentEditingCostume.reservedfrom || "",
      reservedto: currentEditingCostume.reservedto || "",
      returned: currentEditingCostume.returned || false,
      deleted: false
    };

    // ✅ Only include new image base64 if a new file was uploaded
    if (imageFile) {
      Sheet1.imagecbase64 = imagecbase64 || "";
    }

    console.log("📄 Costume data to update:", Sheet1)
    ;
    const updateData = {
      sheet: "Sheet1",
      action: 'update',
      kostymeid: kostymeId,
      Sheet1: Sheet1
    };

    console.log("📄 Update data:", updateData);

    // Submit to Google Apps Script using PUT for updates
    const response = await fetch(proxiedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });


    const result = await response.text();
    console.log("📄 Google Script response:", result);

    showEditMessage('✅ Kostyme oppdatert!', 'success');
    
    // Update local data with new values including new image if uploaded
    const costumeIndex = kostymeliste.allCostumes.findIndex(c => c.kostymeid === kostymeId);
    if (costumeIndex !== -1) {
      // Create updated costume object
      const updatedCostume = { 
        ...currentEditingCostume, 
        title, 
        subcategory, 
        size, 
        amount,
        description,
        imagecname,
        imagecurl
      };
      
      // ✅ If new image was uploaded, preserve the preview image URL for display
      if (imageFile) {
        const currentImage = document.getElementById('currentImage');
        if (currentImage && currentImage.src.startsWith('data:image/')) {
          // Keep the base64 preview URL until the real Google Drive URL is available
          updatedCostume.imagecurl = currentImage.src;
        }
      }
      
      kostymeliste.allCostumes[costumeIndex] = updatedCostume;
      
      // Update filtered costumes if needed
      const filteredIndex = kostymeliste.filteredCostumes.findIndex(c => c.kostymeid === kostymeId);
      if (filteredIndex !== -1) {
        kostymeliste.filteredCostumes[filteredIndex] = kostymeliste.allCostumes[costumeIndex];
      }
    }

    // Refresh the costume list display
    kostymeliste.displayEditableCostumes();
    kostymeliste.populateFilters();
    
    // Hide edit form after successful update
    setTimeout(() => {
      cancelEdit();
    }, 2000);

  } catch (error) {
    console.error('❌ Edit error:', error);
    showEditMessage(`❌ Feil ved oppdatering: ${error.message}`, 'danger');
  }
});

// Cancel edit
document.getElementById('cancelEdit').addEventListener('click', cancelEdit);

function cancelEdit() {
  editSection.classList.add('d-none');
  noSelectionMessage.classList.remove('d-none');
  currentEditingCostume = null;
  editForm.reset();
  editMessageBox.classList.add('d-none');
}

// Show edit message
function showEditMessage(message, type) {
  editMessageBox.classList.remove('alert-info', 'alert-success', 'alert-danger', 'd-none');
  editMessageBox.classList.add(`alert-${type}`);
  editMessageBox.textContent = message;
}

// Image compression function (same as in kostymeRegistrering.js)
function compressImage(file, quality = 0.9, maxSize = 1200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Resize logic (preserve aspect ratio)
      if (width > height && width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Base64 conversion function (same as in kostymeRegistrering.js)
function imageToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result.split(",")[1]); // Remove prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
