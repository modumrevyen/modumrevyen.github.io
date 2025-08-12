// reservasjoner.js
// Handle reservation functionality for cart items

// Note: Google Apps Script URL and proxy are already defined in kostymeReservasjoner.js

// Initialize reservation functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const confirmReservationBtn = document.getElementById('confirmReservationBtn');
  const reservationForm = document.getElementById('reservationForm');
  
  if (confirmReservationBtn && reservationForm) {
    // Handle form submission
    reservationForm.addEventListener('submit', handleReservationSubmit);
    
    // Handle direct button click as backup
    confirmReservationBtn.addEventListener('click', function(e) {
      e.preventDefault();
      handleReservationSubmit(e);
    });
  }
});

// Handle reservation form submission
async function handleReservationSubmit(event) {
  event.preventDefault();
  
  const confirmBtn = document.getElementById('confirmReservationBtn');
  const originalBtnText = confirmBtn.innerHTML;
  
  try {
    // Disable button and show loading
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Behandler reservasjon...';
    
    // Get form data
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const reservationNotes = document.getElementById('reservationNotes').value.trim();
    
    // Validate required fields
    if (!customerName || !customerPhone) {
      throw new Error('Navn og telefonnummer er påkrevd.');
    }
    
    // Get cart items (assuming cart.js provides this)
    const cartItems = typeof cart !== 'undefined' ? cart.getItems() : [];
    
    if (cartItems.length === 0) {
      throw new Error('Ingen kostymer i handlekurven.');
    }
    
    // Create reservation data for the 3-table approach
    const reservationId = `r_${Date.now()}`;
    const currentDate = new Date().toISOString().split("T")[0];
    
    // Step 1: Create reservation in Sheet2
    const reservationData = {
      sheet2: {
        reservasjonid: reservationId,
        customername: customerName,
        customeremail: customerEmail || "",
        customerphone: customerPhone,
        comment: customerComment || "",
        reservedfrom: "", // Will be filled when admin approves
        reservedto: "",   // Will be filled when admin approves
        status: "pending",
        createdat: currentDate,
        notes: reservationNotes || ""
      }
    };
    
    console.log("📋 Creating reservation in Sheet2:", reservationData);
    
    // Submit reservation to Sheet2
    const reservationResponse = await fetch(proxiedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reservationData)
    });
    
    const reservationResult = await reservationResponse.text();
    console.log("� Sheet2 response:", reservationResult);
    
    // Step 2: Create costume-reservation links in Sheet3
    for (const item of cartItems) {
      const linkData = {
        sheet3: {
          kostymeid: item.kostymeid || item.id,
          reservasjonid: reservationId
        }
      };
      
      console.log("🔗 Creating costume link in Sheet3:", linkData);
      
      const linkResponse = await fetch(proxiedUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData)
      });
      
      const linkResult = await linkResponse.text();
      console.log("📄 Sheet3 response for", item.kostymeid, ":", linkResult);
    }
    
    // Show success message
    showReservationSuccess(reservationId, customerName, cartItems.length);
    
    // Clear cart after successful reservation
    if (typeof cart !== 'undefined' && typeof cart.clearCart === 'function') {
      cart.clearCart();
    }
    
    // Close reservation modal after short delay
    setTimeout(() => {
      const reservationModal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
      if (reservationModal) {
        reservationModal.hide();
      }
    }, 4000);
    
  } catch (error) {
    console.error('❌ Reservation error:', error);
    showReservationError(error.message);
  } finally {
    // Re-enable button
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = originalBtnText;
  }
}

// Show success message
function showReservationSuccess(reservationId, customerName, costumeCount) {
  // Create or update success alert in the modal
  const modalBody = document.querySelector('#reservationModal .modal-body');
  
  // Remove any existing alerts
  const existingAlert = modalBody.querySelector('.alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  // Create success alert
  const successAlert = document.createElement('div');
  successAlert.className = 'alert alert-success';
  successAlert.innerHTML = `
    <i class="fas fa-check-circle me-2"></i>
    <strong>Reservasjon sendt!</strong><br>
    <strong>Reservasjons-ID:</strong> ${reservationId}<br>
    <strong>Kunde:</strong> ${customerName}<br>
    <strong>Antall kostymer:</strong> ${costumeCount}<br><br>
    Din reservasjon er mottatt og venter på godkjenning. Vi vil kontakte deg på telefonnummeret du oppga.
  `;
  
  // Insert at the top of modal body
  modalBody.insertBefore(successAlert, modalBody.firstChild);
  
  // Reset form
  document.getElementById('reservationForm').reset();
}

// Show error message
function showReservationError(errorMessage) {
  // Create or update error alert in the modal
  const modalBody = document.querySelector('#reservationModal .modal-body');
  
  // Remove any existing alerts
  const existingAlert = modalBody.querySelector('.alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  // Create error alert
  const errorAlert = document.createElement('div');
  errorAlert.className = 'alert alert-danger';
  errorAlert.innerHTML = `
    <i class="fas fa-exclamation-triangle me-2"></i>
    <strong>Feil ved reservasjon:</strong><br>
    ${errorMessage}
  `;
  
  // Insert at the top of modal body
  modalBody.insertBefore(errorAlert, modalBody.firstChild);
}

// Utility function to generate reservation ID
function generateReservationId() {
  return `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

// Admin-specific functionality for reservasjoner.html
// Check authentication immediately and show content only if authenticated
if (typeof auth !== 'undefined') {
  if (!auth.requireAdminAuth()) {
    // Will redirect to admin-login.html if not authenticated
    // Keep body hidden during redirect
  } else {
    // Authentication successful - show the page content
    document.body.classList.remove('checking-auth');
    
    // Setup logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        if (confirm('Er du sikker på at du vil logge ut?')) {
          auth.logoutAdmin();
          window.location.href = 'velkommen.html';
        }
      });
    }
  }
}

// Setup costume list expand/collapse functionality
document.addEventListener('DOMContentLoaded', function() {
  const expandBtn = document.getElementById('expandCostumesBtn');
  const costumesList = document.getElementById('modalCostumesList');
  
  if (expandBtn && costumesList) {
    expandBtn.addEventListener('click', function() {
      const isCompact = costumesList.classList.contains('costume-list-compact');
      
      if (isCompact) {
        // Expand
        costumesList.classList.remove('costume-list-compact');
        costumesList.classList.add('costume-list-expanded');
        expandBtn.innerHTML = '<i class="fas fa-compress-arrows-alt me-1"></i>Komprimer';
        expandBtn.title = 'Komprimer kostymeoversikt';
      } else {
        // Compact
        costumesList.classList.remove('costume-list-expanded');
        costumesList.classList.add('costume-list-compact');
        expandBtn.innerHTML = '<i class="fas fa-expand-arrows-alt me-1"></i>Utvid';
        expandBtn.title = 'Utvid kostymeoversikt';
      }
    });
  }

  // Setup stats cards with click-to-filter functionality
  const statsCards = document.querySelectorAll('.stats-card');
  
  if (statsCards.length > 0) {
    statsCards.forEach(card => {
      card.addEventListener('click', function() {
        const status = this.dataset.status;
        const statusFilter = document.getElementById('statusFilter');
        
        if (statusFilter) {
          // Set the filter to the clicked status
          statusFilter.value = status;
          
          // Trigger the filter function if it exists
          if (typeof filterReservations === 'function') {
            filterReservations();
          }
          
          // Visual feedback - briefly highlight the card
          this.style.transform = 'scale(0.95)';
          setTimeout(() => {
            this.style.transform = '';
          }, 150);
        }
      });
      
      // Add hover effects
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '';
      });
    });
  }
});

// Export for potential use by other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleReservationSubmit,
    generateReservationId
  };
}
