// kundeReservasjoner.js
// Handle customer reservation data processing and database operations

// Google Apps Script URL and proxy setup (same as registration)
const googleurl = 'https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec';
const proxy = "https://modumrevyen.sayver.net/proxy.php";
const proxiedUrl = `${proxy}?url=${encodeURIComponent(googleurl)}`;

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
    
    console.log('📋 Form data:', { customerName, customerPhone, customerEmail, reservationNotes });
    
    // Validate required fields
    if (!customerName || !customerPhone) {
      throw new Error('Navn og telefonnummer er påkrevd.');
    }
    
    // Get cart items (assuming cart.js provides this)
    const cartItems = (typeof cart !== 'undefined' && typeof cart.getItems === 'function') 
      ? cart.getItems() 
      : [];
    console.log('🛒 Cart items:', cartItems);
    
    if (cartItems.length === 0) {
      throw new Error('Ingen kostymer i handlekurven.');
    }
    
    // Create reservation data for the 3-table approach
    const reservationId = `r_${Date.now()}`;
    const currentDate = new Date().toISOString().split("T")[0];
    
    // Step 1: Create reservation in Sheet2
    const reservationData = {
      sheet: "Sheet2",
      Sheet2: {
        reservasjonid: reservationId,
        customername: customerName,
        customeremail: customerEmail || "",
        customerphone: customerPhone,
        notes: reservationNotes || "",
        adminnotes: "",
        reservedfrom: "", // Will be filled when admin approves
        reservedto: "",   // Will be filled when admin approves
        status: "pending",
        createdat: currentDate
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
    
    // Step 2: Create costume-reservation links in Sheet3 (batched)
    const linkDataArray = cartItems.map(item => ({
      kostymeid: item.id,
      reservasjonid: reservationId
    }));

    const payload = {
      sheet: "Sheet3",
      Sheet3: linkDataArray
    };

    console.log("🔗 Creating batched costume links in Sheet3:", payload);

    const response = await fetch(proxiedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();
    console.log("📄 Batched Sheet3 response:", resultText);
    
    // Show success message
    showReservationSuccess(reservationId, customerName, cartItems.length);
    
    // Clear cart after successful reservation
    if (typeof cart !== 'undefined' && typeof cart.clearCartExternal === 'function') {
      cart.clearCartExternal();
    }
    
    // Note: Modal will stay open for customer to read the confirmation message
    
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
    Din reservasjon er mottatt og venter på godkjenning. Vi vil kontakte deg på telefonnummeret du oppga.<br><br>
    <small class="text-muted"><i class="fas fa-info-circle me-1"></i>Du kan lukke dette vinduet når du er ferdig med å lese.</small>
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

// Clear reservation message when modal is closed
document.addEventListener('DOMContentLoaded', function() {
  const reservationModal = document.getElementById('reservationModal');
  if (reservationModal) {
    reservationModal.addEventListener('hidden.bs.modal', function() {
      // Remove any success/error alerts when modal is closed
      const modalBody = reservationModal.querySelector('.modal-body');
      const existingAlert = modalBody.querySelector('.alert');
      if (existingAlert) {
        existingAlert.remove();
      }
      
      // Reset the form as well
      const form = document.getElementById('reservationForm');
      if (form) {
        form.reset();
      }
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
