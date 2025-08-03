// kostymeReservasjoner.js
// Admin interface for managing costume reservations

// Google Apps Script URL and proxy setup
const googleurl = 'https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec';
const proxy = "https://modumrevyen.sayver.net/proxy.php";
const proxiedUrl = `${proxy}?url=${encodeURIComponent(googleurl)}`;

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
    document.getElementById('dateFilter').addEventListener('change', filterReservations);
    document.getElementById('customerFilter').addEventListener('input', debounce(filterReservations, 300));
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('refreshData').addEventListener('click', refreshData);
    
    // Modal events
    document.getElementById('confirmRemoveCostume').addEventListener('click', confirmRemoveCostume);
    
    console.log('✅ Event listeners set up');
}

// Load all data from the backend
async function loadAllData() {
    try {
        showLoadingSpinner(true);
        
        // Load reservations
        const reservationsResponse = await fetch('reservasjoner.json');
        const reservationsData = await reservationsResponse.json();
        allReservations = reservationsData.sheet2 || [];
        
        // Load costume-reservation links
        const linksResponse = await fetch('kostymer_til_reservering.json');
        const linksData = await linksResponse.json();
        costumeReservationLinks = linksData.sheet3 || [];
        
        // Load costumes
        const costumesResponse = await fetch('kostymer.json');
        const costumesData = await costumesResponse.json();
        allCostumes = costumesData.sheet1 || [];
        
        console.log('📊 Data loaded:', {
            reservations: allReservations.length,
            links: costumeReservationLinks.length,
            costumes: allCostumes.length
        });
        
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
    
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('approvedCount').textContent = stats.approved;
    document.getElementById('rentedCount').textContent = stats.rented;
    document.getElementById('declinedCount').textContent = stats.declined;
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
        const createdDate = new Date(reservation.createdat).toLocaleDateString('no-NO');
        
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
                                    const isAvailable = checkCostumeAvailability(costume.kostymeid, reservation.reservasjonid);
                                    const availabilityClass = isAvailable ? 'bg-success' : 'bg-warning text-dark';
                                    const availabilityIcon = isAvailable ? 'check' : 'exclamation-triangle';
                                    
                                    return `
                                        <span class="badge ${availabilityClass}">
                                            <i class="fas fa-${availabilityIcon} me-1"></i>
                                            ${costume.title} (${costume.size || costume.description || 'N/A'})
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
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter').value;
    if (dateFilter) {
        filtered = filtered.filter(r => {
            const reservationDate = new Date(r.createdat).toISOString().split('T')[0];
            return reservationDate === dateFilter;
        });
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
        const dateA = new Date(a.createdat);
        const dateB = new Date(b.createdat);
        
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

// Check if a costume is available (not rented by another reservation)
function checkCostumeAvailability(costumeId, excludeReservationId = null) {
    // Find all reservations that have this costume
    const reservationsWithCostume = costumeReservationLinks
        .filter(link => link.kostymeid === costumeId && link.reservasjonid !== excludeReservationId)
        .map(link => link.reservasjonid);
    
    // Check if any of these reservations are in 'rented' status
    const rentedReservations = allReservations.filter(r => 
        reservationsWithCostume.includes(r.reservasjonid) && r.status === 'rented'
    );
    
    return rentedReservations.length === 0;
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
    document.getElementById('modalCreatedAt').textContent = new Date(reservation.createdat).toLocaleString('no-NO');
    document.getElementById('modalNotes').textContent = reservation.notes || 'Ingen kommentarer';
    
    // Set status badge
    const statusElement = document.getElementById('modalStatus');
    statusElement.className = `badge ${getStatusClass(reservation.status)}`;
    statusElement.textContent = getStatusText(reservation.status);
    
    // Set dates
    document.getElementById('modalReservedFrom').value = reservation.reservedfrom || '';
    document.getElementById('modalReservedTo').value = reservation.reservedto || '';
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
            const isAvailable = checkCostumeAvailability(costume.kostymeid, reservationId);
            const availabilityClass = isAvailable ? 'text-success' : 'text-warning';
            const availabilityText = isAvailable ? 'Tilgjengelig' : 'Ikke tilgjengelig';
            const availabilityIcon = isAvailable ? 'check-circle' : 'exclamation-triangle';
            
            return `
                <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <div class="d-flex align-items-center">
                        <img src="${costume.image || getPlaceholderImage()}" class="rounded me-3" 
                             style="width: 50px; height: 50px; object-fit: cover;" alt="${costume.title}"
                             onerror="this.src='${getPlaceholderImage()}'">
                        <div>
                            <h6 class="mb-1">${costume.title}</h6>
                            <small class="text-muted">
                                ${costume.subcategory || 'Ingen kategori'} • 
                                ${costume.title?.toLowerCase() === 'rekvisitter' ? 'Beskrivelse' : 'Størrelse'}: 
                                ${costume.size || costume.description || 'Ikke angitt'}
                            </small>
                            <br>
                            <small class="${availabilityClass}">
                                <i class="fas fa-${availabilityIcon} me-1"></i>${availabilityText}
                            </small>
                        </div>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" 
                            onclick="openRemoveCostumeModal('${costume.kostymeid}', '${reservationId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');    container.innerHTML = costumesHTML;
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
            break;
    }
}

// Update reservation status
async function updateReservationStatus(newStatus) {
    if (!currentReservationId) return;
    
    try {
        const reservation = allReservations.find(r => r.reservasjonid === currentReservationId);
        if (!reservation) {
            throw new Error('Reservasjon ikke funnet');
        }
        
        // Get updated dates and notes
        const reservedFrom = document.getElementById('modalReservedFrom').value;
        const reservedTo = document.getElementById('modalReservedTo').value;
        const adminNotes = document.getElementById('modalAdminNotes').value;
        
        // Prepare update data
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
                reservedfrom: reservedFrom,
                reservedto: reservedTo,
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
        
        // Update local data
        reservation.status = newStatus;
        reservation.reservedfrom = reservedFrom;
        reservation.reservedto = reservedTo;
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
    
    try {
        const { costumeId, reservationId } = window.costumeToRemove;
        
        // Prepare removal data
        const removeData = {
            action: 'remove_costume_from_reservation',
            kostymeid: costumeId,
            reservasjonid: reservationId
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
    document.getElementById('dateFilter').value = '';
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
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
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
