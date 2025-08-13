// kostymeReservasjoner.js
// Admin interface for managing costume reservations

// Google Apps Script URL and proxy setup
const googleurl = 'https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec';
const proxy = "https://modumrevyen.sayver.net/proxy.php";
const proxiedUrl = `${proxy}?url=${encodeURIComponent(googleurl)}`;

// Helper function to parse Norwegian date format "DD.MM.YYYY - HH:MM"
function parseNorwegianDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return new Date(); // Return current date if invalid
    }
    
    // Handle the format "DD.MM.YYYY - HH:MM"
    const match = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2}):(\d{2})$/);
    if (match) {
        const [, day, month, year, hour, minute] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    
    // Fallback: try to parse as regular date
    const fallbackDate = new Date(dateString);
    return isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
}

// Global variables
let allReservations = [];
let allCostumes = [];
let costumeReservationLinks = [];
let currentReservationId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminReservations();
});

// Initialize the admin reservations interface
async function initializeAdminReservations() {
    console.log('🎯 Initializing admin reservations interface');
    
    setupEventListeners();
    await loadAllData();
    displayReservations();
}

// Setup event listeners
function setupEventListeners() {
    // Filter controls
    document.getElementById('statusFilter').addEventListener('change', filterReservations);
    document.getElementById('customerFilter').addEventListener('input', debounce(filterReservations, 300));
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('refreshData').addEventListener('click', refreshData);
    
    // Availability overview toggle (optional - may not exist)
    const toggleAvailabilityBtn = document.getElementById('toggleAvailability');
    if (toggleAvailabilityBtn) {
        toggleAvailabilityBtn.addEventListener('click', toggleAvailabilityDetails);
    }
    
    // Modal events
    document.getElementById('confirmRemoveCostume').addEventListener('click', confirmRemoveCostume);
    
    console.log('✅ Event listeners set up');
}

// Load all data from the backend
async function loadAllData() {
    try {
        showLoadingSpinner(true);
        
        // Add timestamp for cache-busting
        const timestamp = Date.now();
        
        // Load reservations
        const reservationsResponse = await fetch(`reservasjoner.json?ts=${timestamp}`);
        const reservationsData = await reservationsResponse.json();
        allReservations = reservationsData.sheet2 || [];
        
        // Load costume-reservation links
        const linksResponse = await fetch(`kostymer_til_reservering.json?ts=${timestamp}`);
        const linksData = await linksResponse.json();
        costumeReservationLinks = linksData.sheet3 || [];
        
        // Load costumes
        const costumesResponse = await fetch(`kostymer.json?ts=${timestamp}`);
        const costumesData = await costumesResponse.json();
        allCostumes = costumesData.sheet1 || [];
        
        console.log('📊 Data loaded:', {
            reservations: allReservations.length,
            links: costumeReservationLinks.length,
            costumes: allCostumes.length
        });
        
        // Clean up orphaned links (links pointing to non-existent reservations)
        cleanupOrphanedLinks();
        
        updateStatistics();
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError('Feil ved lasting av data. Prøv å oppdatere siden.');
    } finally {
        showLoadingSpinner(false);
    }
}

// Update statistics cards
function updateStatistics() {
    const stats = {
        pending: allReservations.filter(r => r.status === 'pending').length,
        approved: allReservations.filter(r => r.status === 'approved').length,
        rented: allReservations.filter(r => r.status === 'rented').length,
        declined: allReservations.filter(r => r.status === 'declined').length
    };
    
    // Update mobile displays
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('approvedCount').textContent = stats.approved;
    document.getElementById('rentedCount').textContent = stats.rented;
    document.getElementById('declinedCount').textContent = stats.declined;
    
    // Update desktop displays
    const pendingCountLarge = document.getElementById('pendingCountLarge');
    const approvedCountLarge = document.getElementById('approvedCountLarge');
    const rentedCountLarge = document.getElementById('rentedCountLarge');
    const declinedCountLarge = document.getElementById('declinedCountLarge');
    
    if (pendingCountLarge) pendingCountLarge.textContent = stats.pending;
    if (approvedCountLarge) approvedCountLarge.textContent = stats.approved;
    if (rentedCountLarge) rentedCountLarge.textContent = stats.rented;
    if (declinedCountLarge) declinedCountLarge.textContent = stats.declined;
    
    // Update costume availability overview
    updateAvailabilityOverview();
}

// Update costume availability overview
function updateAvailabilityOverview() {
    let available = 0;
    let lowStock = 0;
    let outOfStock = 0;
    
    allCostumes.forEach(costume => {
        const availability = getCostumeAvailability(costume.kostymeid);
        if (availability.available === 0) {
            outOfStock++;
        } else if (availability.available <= Math.max(1, Math.floor(availability.total * 0.3))) {
            lowStock++;
        } else {
            available++;
        }
    });
    
    // Update availability counters (optional elements)
    const availableCostumesEl = document.getElementById('availableCostumes');
    const lowStockCostumesEl = document.getElementById('lowStockCostumes');
    const outOfStockCostumesEl = document.getElementById('outOfStockCostumes');
    
    if (availableCostumesEl) availableCostumesEl.textContent = available;
    if (lowStockCostumesEl) lowStockCostumesEl.textContent = lowStock;
    if (outOfStockCostumesEl) outOfStockCostumesEl.textContent = outOfStock;
}

// Toggle availability details view
function toggleAvailabilityDetails() {
    const detailsDiv = document.getElementById('availabilityDetails');
    const toggleBtn = document.getElementById('toggleAvailability');
    
    // If elements don't exist, do nothing
    if (!detailsDiv || !toggleBtn) return;
    
    const icon = toggleBtn.querySelector('i');
    
    if (detailsDiv.classList.contains('d-none')) {
        detailsDiv.classList.remove('d-none');
        icon.className = 'fas fa-eye-slash me-1';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash me-1"></i>Skjul detaljer';
        populateAvailabilityDetails();
    } else {
        detailsDiv.classList.add('d-none');
        icon.className = 'fas fa-eye me-1';
        toggleBtn.innerHTML = '<i class="fas fa-eye me-1"></i>Vis detaljer';
    }
}

// Populate detailed availability information
function populateAvailabilityDetails() {
    const container = document.getElementById('availabilityList');
    
    // If container doesn't exist, do nothing
    if (!container) return;
    
    // Group costumes by availability status
    const availabilityGroups = {
        available: [],
        lowStock: [],
        outOfStock: []
    };
    
    allCostumes.forEach(costume => {
        const availability = getCostumeAvailability(costume.kostymeid);
        if (availability.available === 0) {
            availabilityGroups.outOfStock.push({ costume, availability });
        } else if (availability.available <= Math.max(1, Math.floor(availability.total * 0.3))) {
            availabilityGroups.lowStock.push({ costume, availability });
        } else {
            availabilityGroups.available.push({ costume, availability });
        }
    });
    
    const generateCostumeCard = (item, statusClass, statusIcon) => {
        const { costume, availability } = item;
        return `
            <div class="col-md-4 mb-3">
                <div class="card border-${statusClass}">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-${statusIcon} text-${statusClass} me-2"></i>
                            <div class="flex-grow-1">
                                <h6 class="card-title mb-1">${costume.title}</h6>
                                <small class="text-muted">${costume.subcategory || 'Ingen kategori'}</small>
                                <div class="mt-1">
                                    <span class="badge bg-${statusClass}">${availability.details}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    let html = '';
    
    // Out of stock costumes (highest priority)
    if (availabilityGroups.outOfStock.length > 0) {
        html += '<div class="col-12"><h6 class="text-danger"><i class="fas fa-times-circle me-2"></i>Utsolgte kostymer</h6></div>';
        availabilityGroups.outOfStock.forEach(item => {
            html += generateCostumeCard(item, 'danger', 'times-circle');
        });
    }
    
    // Low stock costumes
    if (availabilityGroups.lowStock.length > 0) {
        html += '<div class="col-12 mt-3"><h6 class="text-warning"><i class="fas fa-exclamation-triangle me-2"></i>Få igjen</h6></div>';
        availabilityGroups.lowStock.forEach(item => {
            html += generateCostumeCard(item, 'warning', 'exclamation-triangle');
        });
    }
    
    // Available costumes (show only first 6 to avoid clutter)
    if (availabilityGroups.available.length > 0) {
        html += '<div class="col-12 mt-3"><h6 class="text-success"><i class="fas fa-check-circle me-2"></i>Tilgjengelige kostymer</h6></div>';
        availabilityGroups.available.slice(0, 6).forEach(item => {
            html += generateCostumeCard(item, 'success', 'check-circle');
        });
        if (availabilityGroups.available.length > 6) {
            html += `<div class="col-12"><small class="text-muted">... og ${availabilityGroups.available.length - 6} flere tilgjengelige kostymer</small></div>`;
        }
    }
    
    container.innerHTML = html || '<div class="col-12"><p class="text-muted">Ingen kostymer funnet</p></div>';
}

// Display reservations with current filters
function displayReservations() {
    const filteredReservations = getFilteredReservations();
    const container = document.getElementById('reservationsList');
    const noReservationsDiv = document.getElementById('noReservations');
    
    document.getElementById('totalCount').textContent = filteredReservations.length;
    
    if (filteredReservations.length === 0) {
        container.classList.add('d-none');
        noReservationsDiv.classList.remove('d-none');
        return;
    }
    
    container.classList.remove('d-none');
    noReservationsDiv.classList.add('d-none');
    
    const reservationsHTML = filteredReservations.map(reservation => {
        const costumes = getCostumesForReservation(reservation.reservasjonid);
        const statusBadge = getStatusBadge(reservation.status);
        const createdDate = parseNorwegianDate(reservation.createdat).toLocaleString('no-NO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', ' -');
        
        return `
            <div class="card mb-3">
                <div class="card-header">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h6 class="mb-0">
                                <i class="fas fa-user me-2"></i>${reservation.customername}
                                ${statusBadge}
                            </h6>
                            <small class="text-muted">ID: ${reservation.reservasjonid} • ${createdDate}</small>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <small class="text-muted">
                                <i class="fas fa-phone me-1"></i>${reservation.customerphone}
                                ${reservation.customeremail ? `• <i class="fas fa-envelope me-1"></i>${reservation.customeremail}` : ''}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <h6>Kostymer (${costumes.length}):</h6>
                            <div class="d-flex flex-wrap gap-2">
                                ${costumes.map(costume => {
                                    const availability = getCostumeAvailability(costume.kostymeid, reservation.reservasjonid);
                                    const availabilityClass = availability.isAvailable ? 'bg-success' : 'bg-danger';
                                    const availabilityIcon = availability.isAvailable ? 'check' : 'exclamation-triangle';
                                    
                                    return `
                                        <span class="badge ${availabilityClass}" title="${availability.details}">
                                            <i class="fas fa-${availabilityIcon} me-1"></i>
                                            ${costume.title} (${costume.size || costume.description || 'N/A'})
                                            <small class="ms-1">[${availability.available}/${availability.total}]</small>
                                        </span>
                                    `;
                                }).join('')}
                            </div>
                            ${reservation.notes ? `
                                <div class="mt-2">
                                    <small><strong>Kommentar:</strong> ${reservation.notes}</small>
                                </div>
                            ` : ''}
                        </div>
                        <div class="col-md-4 text-md-end">
                            <button class="btn btn-primary btn-sm" onclick="openReservationModal('${reservation.reservasjonid}')">
                                <i class="fas fa-edit me-1"></i>Administrer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = reservationsHTML;
}

// Get filtered reservations based on current filter settings
function getFilteredReservations() {
    let filtered = [...allReservations];
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter) {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    // Customer filter
    const customerFilter = document.getElementById('customerFilter').value.toLowerCase();
    if (customerFilter) {
        filtered = filtered.filter(r => 
            r.customername.toLowerCase().includes(customerFilter) ||
            r.customerphone.toString().includes(customerFilter) ||
            (r.customeremail && r.customeremail.toLowerCase().includes(customerFilter))
        );
    }
    
    // Sort by creation date - pending reservations show oldest first, others show newest first
    filtered.sort((a, b) => {
        const dateA = parseNorwegianDate(a.createdat);
        const dateB = parseNorwegianDate(b.createdat);
        
        // If filtering by pending status only, or if both are pending, show oldest first
        const statusFilter = document.getElementById('statusFilter').value;
        if (statusFilter === 'pending' || (a.status === 'pending' && b.status === 'pending')) {
            return dateA - dateB; // Oldest first
        }
        
        // For all other cases, show newest first
        return dateB - dateA; // Newest first
    });
    
    return filtered;
}

// Get costumes for a specific reservation
function getCostumesForReservation(reservationId) {
    const costumeIds = costumeReservationLinks
        .filter(link => link.reservasjonid === reservationId)
        .map(link => link.kostymeid);
    
    return costumeIds.map(costumeId => {
        const costume = allCostumes.find(c => c.kostymeid === costumeId);
        return costume || { kostymeid: costumeId, title: 'Ukjent kostyme', size: 'N/A' };
    });
}

// Get costume availability details including quantities
function getCostumeAvailability(costumeId, excludeReservationId = null) {
    const costume = allCostumes.find(c => c.kostymeid === costumeId);
    if (!costume) {
        return { available: 0, total: 0, allocated: 0, isAvailable: false, details: 'Kostyme ikke funnet' };
    }
    
    const totalAmount = parseInt(costume.amount) || 1;
    
    // Find all reservations that have this costume (excluding the specified reservation)
    const reservationsWithCostume = costumeReservationLinks
        .filter(link => link.kostymeid === costumeId && link.reservasjonid !== excludeReservationId)
        .map(link => link.reservasjonid);
    
    // Count allocated costumes (approved and rented reservations)
    const allocatedReservations = allReservations.filter(r => 
        reservationsWithCostume.includes(r.reservasjonid) && 
        (r.status === 'approved' || r.status === 'rented')
    );
    
    const allocatedAmount = allocatedReservations.length;
    const availableAmount = Math.max(0, totalAmount - allocatedAmount);
    const isAvailable = availableAmount > 0;
    
    let details = `${availableAmount} av ${totalAmount} tilgjengelig`;
    if (allocatedAmount > 0) {
        details += ` (${allocatedAmount} reservert)`;
    }
    
    return {
        available: availableAmount,
        total: totalAmount,
        allocated: allocatedAmount,
        isAvailable: isAvailable,
        details: details
    };
}

// Legacy function for backwards compatibility
function checkCostumeAvailability(costumeId, excludeReservationId = null) {
    return getCostumeAvailability(costumeId, excludeReservationId).isAvailable;
}

// Clean up orphaned links (links pointing to non-existent reservations)
function cleanupOrphanedLinks() {
    const validReservationIds = new Set(allReservations.map(r => r.reservasjonid));
    const initialCount = costumeReservationLinks.length;
    
    costumeReservationLinks = costumeReservationLinks.filter(link => {
        return validReservationIds.has(link.reservasjonid);
    });
    
    const cleanedCount = initialCount - costumeReservationLinks.length;
    if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} orphaned reservation links`);
    }
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge bg-warning text-dark ms-2">Ventende</span>',
        'approved': '<span class="badge bg-success ms-2">Godkjent</span>',
        'rented': '<span class="badge bg-info ms-2">Utleid</span>',
        'declined': '<span class="badge bg-danger ms-2">Avslått</span>',
        'returned': '<span class="badge bg-secondary ms-2">Returnert</span>'
    };
    return badges[status] || '<span class="badge bg-secondary ms-2">Ukjent</span>';
}

// Open reservation management modal
function openReservationModal(reservationId) {
    currentReservationId = reservationId;
    const reservation = allReservations.find(r => r.reservasjonid === reservationId);
    
    if (!reservation) {
        showError('Reservasjon ikke funnet');
        return;
    }
    
    // Populate customer info
    document.getElementById('modalCustomerName').textContent = reservation.customername;
    document.getElementById('modalCustomerPhone').textContent = reservation.customerphone;
    document.getElementById('modalCustomerEmail').textContent = reservation.customeremail || 'Ikke oppgitt';
    document.getElementById('modalCreatedAt').textContent = parseNorwegianDate(reservation.createdat).toLocaleString('no-NO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(',', ' -');
    document.getElementById('modalNotes').textContent = reservation.notes || 'Ingen kommentarer';
    
    // Set status badge
    const statusElement = document.getElementById('modalStatus');
    statusElement.className = `badge ${getStatusClass(reservation.status)}`;
    statusElement.textContent = getStatusText(reservation.status);
    
    // Set admin notes
    document.getElementById('modalAdminNotes').value = reservation.adminnotes || '';
    
    // Populate costumes list
    populateModalCostumesList(reservationId);
    
    // Update button states based on current status
    updateModalButtons(reservation.status);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('reservationModal'));
    modal.show();
}

// Populate costumes list in modal
function populateModalCostumesList(reservationId) {
    const costumes = getCostumesForReservation(reservationId);
    const container = document.getElementById('modalCostumesList');
    
    if (costumes.length === 0) {
        container.innerHTML = '<p class="text-muted">Ingen kostymer funnet</p>';
        return;
    }
    
    const costumesHTML = costumes.map(costume => {
        const availability = getCostumeAvailability(costume.kostymeid, reservationId);
        const availabilityClass = availability.isAvailable ? 'text-success' : 'text-danger';
        const availabilityIcon = availability.isAvailable ? 'check-circle' : 'exclamation-triangle';
        
        // Process image URL for Google Drive thumbnails
        let imageUrl = costume.imagecurl || '';
        let fullImageUrl = imageUrl;
        
        if (imageUrl && imageUrl.startsWith("https://drive.google.com/")) {
            const imageId = imageUrl.match(/[-\w]{25,}/)?.[0];
            if (imageId) {
                imageUrl = `https://drive.google.com/thumbnail?id=${imageId}&sz=s400`;
                fullImageUrl = `https://drive.google.com/thumbnail?id=${imageId}&sz=s4000`;
            }
        }
        
        if (!imageUrl) {
            imageUrl = getPlaceholderImage();
            fullImageUrl = getPlaceholderImage();
        }
        
        return `
            <div class="d-flex justify-content-between align-items-start p-3 border-bottom">
                <div class="d-flex align-items-start">
                    <img src="${imageUrl}" class="rounded me-3 clickable-image" 
                         style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;" 
                         alt="${costume.title}"
                         data-bs-toggle="modal" data-bs-target="#imageModal" data-img="${fullImageUrl}"
                         onerror="this.src='${getPlaceholderImage()}'">
                    <div class="flex-grow-1">
                        <h6 class="mb-2">${costume.title}</h6>
                        <div class="small text-muted mb-2">
                            <div><strong>Underkategori:</strong> ${costume.subcategory || 'Ikke angitt'}</div>
                            <div><strong>Størrelse:</strong> ${costume.size || 'Ikke angitt'}</div>
                            <div><strong>Antall:</strong> ${costume.amount || 1}</div>
                            <div><strong>Beskrivelse:</strong> ${costume.description && costume.description.trim() ? costume.description : 'Ingen beskrivelse'}</div>
                        </div>
                        <small class="${availabilityClass}">
                            <i class="fas fa-${availabilityIcon} me-1"></i>
                            <strong>Tilgjengelighet:</strong> ${availability.details}
                        </small>
                    </div>
                </div>
                <button class="btn btn-outline-danger btn-sm" 
                        onclick="openRemoveCostumeModal('${costume.kostymeid}', '${reservationId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = costumesHTML;
}

// Update modal buttons based on reservation status
function updateModalButtons(status) {
    const approveBtn = document.getElementById('approveBtn');
    const rentedBtn = document.getElementById('rentedBtn');
    const returnedBtn = document.getElementById('returnedBtn');
    const declineBtn = document.getElementById('declineBtn');
    
    // Reset all buttons
    [approveBtn, rentedBtn, returnedBtn, declineBtn].forEach(btn => {
        btn.classList.remove('d-none');
        btn.disabled = false;
    });
    
    // Hide/disable buttons based on current status
    switch (status) {
        case 'pending':
            returnedBtn.classList.add('d-none');
            rentedBtn.disabled = true; // Can't rent until approved
            break;
        case 'approved':
            approveBtn.disabled = true;
            returnedBtn.classList.add('d-none');
            break;
        case 'rented':
            approveBtn.disabled = true;
            rentedBtn.disabled = true;
            declineBtn.classList.add('d-none');
            break;
        case 'returned':
            approveBtn.disabled = true;
            rentedBtn.disabled = true;
            returnedBtn.disabled = true;
            declineBtn.classList.add('d-none');
            break;
        case 'declined':
            returnedBtn.classList.add('d-none');
            declineBtn.disabled = true;
            rentedBtn.disabled = true; // Can't rent if declined
            break;
    }
}

// Update reservation status
async function updateReservationStatus(newStatus) {
    if (!currentReservationId) return;
    
    // Get the button that was clicked and store original content
    const buttonMap = {
        'approved': document.getElementById('approveBtn'),
        'rented': document.getElementById('rentedBtn'),
        'returned': document.getElementById('returnedBtn'),
        'declined': document.getElementById('declineBtn')
    };
    
    const activeButton = buttonMap[newStatus];
    const originalContent = activeButton ? activeButton.innerHTML : '';
    
    try {
        // Disable all buttons and show loading on active button
        Object.values(buttonMap).forEach(btn => {
            if (btn) btn.disabled = true;
        });
        
        if (activeButton) {
            activeButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Behandler...';
        }
        
        const reservation = allReservations.find(r => r.reservasjonid === currentReservationId);
        if (!reservation) {
            throw new Error('Reservasjon ikke funnet');
        }
        
        // Get updated admin notes (keep existing date values from the reservation)
        const adminNotes = document.getElementById('modalAdminNotes').value;
        
        // Prepare update data (keep existing date values)
        const updateData = {
            sheet: "Sheet2",
            action: 'update',
            Sheet2 : {
                reservasjonid: currentReservationId,
                customername: reservation.customername,
                customerphone: reservation.customerphone,
                customeremail: reservation.customeremail || "",
                notes: reservation.notes || "",
                adminnotes: adminNotes,
                reservedfrom: reservation.reservedfrom || "",
                reservedto: reservation.reservedto || "",
                status: newStatus,
                createdat: reservation.createdat // Keep original creation date
            }
        };
        
        console.log('📤 Updating reservation:', updateData);
        
        // Send update request
        const response = await fetch(proxiedUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.text();
        console.log('📥 Update response:', result);
        
        // Update local data (keep existing date values)
        reservation.status = newStatus;
        reservation.adminnotes = adminNotes;
        
        // Refresh display
        updateStatistics();
        displayReservations();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
        modal.hide();
        
        showSuccess(`Reservasjon oppdatert til: ${getStatusText(newStatus)}`);
        
    } catch (error) {
        console.error('❌ Error updating reservation:', error);
        showError('Feil ved oppdatering av reservasjon: ' + error.message);
    } finally {
        // Restore all buttons
        Object.values(buttonMap).forEach(btn => {
            if (btn) btn.disabled = false;
        });
        
        if (activeButton) {
            activeButton.innerHTML = originalContent;
        }
        
        // Update button states based on new status if operation was successful
        if (currentReservationId) {
            const reservation = allReservations.find(r => r.reservasjonid === currentReservationId);
            if (reservation) {
                updateModalButtons(reservation.status);
            }
        }
    }
}

// Open remove costume modal
function openRemoveCostumeModal(costumeId, reservationId) {
    const costume = allCostumes.find(c => c.kostymeid === costumeId);
    if (!costume) {
        showError('Kostyme ikke funnet');
        return;
    }
    
    // Store for later use
    window.costumeToRemove = { costumeId, reservationId };
    
    // Populate modal info
    document.getElementById('removeCostumeInfo').innerHTML = `
        <div class="d-flex align-items-center">
            <img src="${costume.image || getPlaceholderImage()}" class="rounded me-3" 
                 style="width: 60px; height: 60px; object-fit: cover;" alt="${costume.title}"
                 onerror="this.src='${getPlaceholderImage()}'">
            <div>
                <h6 class="mb-1">${costume.title}</h6>
                <small class="text-muted">
                    ${costume.subcategory || 'Ingen kategori'} • 
                    ${costume.title?.toLowerCase() === 'rekvisitter' ? 'Beskrivelse' : 'Størrelse'}: 
                    ${costume.size || costume.description || 'Ikke angitt'}
                </small>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('removeCostumeModal'));
    modal.show();
}

// Confirm remove costume
async function confirmRemoveCostume() {
    if (!window.costumeToRemove) return;
    
    const confirmBtn = document.getElementById('confirmRemoveCostume');
    const originalBtnContent = confirmBtn.innerHTML;
    
    try {
        // Disable button and show loading
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Fjerner...';
        
        const { costumeId, reservationId } = window.costumeToRemove;
        
        // Prepare removal data
        const removeData = {
            sheet: 'Sheet3',
            action: 'delete',
            Sheet3: {
                kostymeid: costumeId,
                reservasjonid: reservationId
            }
        };
        
        console.log('📤 Removing costume from reservation:', removeData);
        
        // Send removal request
        const response = await fetch(proxiedUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(removeData)
        });
        
        const result = await response.text();
        console.log('📥 Remove response:', result);
        
        // Update local data
        costumeReservationLinks = costumeReservationLinks.filter(
            link => !(link.kostymeid === costumeId && link.reservasjonid === reservationId)
        );
        
        // Refresh modal display
        populateModalCostumesList(reservationId);
        
        // Refresh main display
        displayReservations();
        
        // Close remove modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('removeCostumeModal'));
        modal.hide();
        
        showSuccess('Kostyme fjernet fra reservasjon');
        
    } catch (error) {
        console.error('❌ Error removing costume:', error);
        showError('Feil ved fjerning av kostyme: ' + error.message);
    } finally {
        // Restore button state
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = originalBtnContent;
    }
    
    window.costumeToRemove = null;
}

// Filter reservations
function filterReservations() {
    displayReservations();
}

// Clear all filters
function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('customerFilter').value = '';
    displayReservations();
}

// Refresh data
async function refreshData() {
    await loadAllData();
    displayReservations();
    showSuccess('Data oppdatert');
}

// Utility functions
function getPlaceholderImage() {
    // Generate a simple SVG placeholder image as data URL
    const svg = `<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="60" height="60" fill="#f8f9fa"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d" font-family="Arial" font-size="10">Ingen bilde</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function getStatusClass(status) {
    const classes = {
        'pending': 'bg-warning text-dark',
        'approved': 'bg-success',
        'rented': 'bg-info',
        'declined': 'bg-danger',
        'returned': 'bg-secondary'
    };
    return classes[status] || 'bg-secondary';
}

function getStatusText(status) {
    const texts = {
        'pending': 'Ventende',
        'approved': 'Godkjent',
        'rented': 'Utleid',
        'declined': 'Avslått',
        'returned': 'Returnert'
    };
    return texts[status] || 'Ukjent';
}

function showLoadingSpinner(show) {
    const spinner = document.getElementById('loadingSpinner');
    const list = document.getElementById('reservationsList');
    const noReservations = document.getElementById('noReservations');
    
    if (show) {
        spinner.classList.remove('d-none');
        list.classList.add('d-none');
        noReservations.classList.add('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'danger');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    toast.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; max-width: 400px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle image modal clicks
document.body.addEventListener("click", (e) => {
    const img = e.target.closest("[data-bs-toggle='modal'][data-img]");
    if (img) {
        const modalImage = document.getElementById("modalImage");
        if (modalImage) {
            modalImage.src = img.getAttribute("data-img");
        }
    }
});
