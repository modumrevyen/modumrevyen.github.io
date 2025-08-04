// kostymeAdmin.js - Admin Dashboard Functionality

// Check authentication immediately and show content only if authenticated
if (!auth.requireAdminAuth()) {
    // Will redirect to admin-login.html if not authenticated
    // Keep body hidden during redirect
} else {
    // Authentication successful - show the page content
    document.body.classList.remove('checking-auth');
    
    // Show current user
    document.getElementById('currentUser').textContent = auth.getCurrentAdminUser();
    
    // Setup logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Er du sikker på at du vil logge ut?')) {
            auth.logoutAdmin();
            window.location.href = 'velkommen.html';
        }
    });

    // Load dashboard data
    loadDashboardData();
}

async function loadDashboardData() {
    try {
        // Load all required data
        const [costumesResponse, reservationsResponse, costumeReservationsResponse] = await Promise.all([
            fetch('kostymer.json'),
            fetch('reservasjoner.json'),
            fetch('kostymer_til_reservering.json')
        ]);

        const costumesData = await costumesResponse.json();
        const reservationsData = await reservationsResponse.json();
        const costumeReservationsData = await costumeReservationsResponse.json();

        const costumes = costumesData.sheet1 || [];
        const reservations = reservationsData.sheet2 || [];
        const costumeReservations = costumeReservationsData.sheet3 || [];

        // Calculate statistics
        const stats = calculateDashboardStats(costumes, reservations, costumeReservations);
        
        // Update dashboard cards
        updateDashboardCards(stats);
        
        // Load recent reservations
        displayRecentReservations(reservations.slice(0, 5));
        
        // Update system status
        updateSystemStatus(costumes);

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showErrorMessage();
    }
}

function calculateDashboardStats(costumes, reservations, costumeReservations) {
    // Total costumes (excluding deleted ones)
    const activeCostumes = costumes.filter(c => !c.deleted);
    const totalCostumes = activeCostumes.reduce((sum, costume) => sum + (costume.amount || 1), 0);

    // Group reservations by status
    const pendingReservations = reservations.filter(r => r.status === 'pending').length;
    const approvedReservations = reservations.filter(r => r.status === 'approved');
    const rentedReservations = reservations.filter(r => r.status === 'rented');

    // Calculate rented costume count
    let rentedCostumeCount = 0;
    rentedReservations.forEach(reservation => {
        const costumeCount = costumeReservations.filter(cr => cr.reservasjonid === reservation.reservasjonid).length;
        rentedCostumeCount += costumeCount;
    });

    // Calculate reserved but not rented costume count  
    let reservedCostumeCount = 0;
    approvedReservations.forEach(reservation => {
        const costumeCount = costumeReservations.filter(cr => cr.reservasjonid === reservation.reservasjonid).length;
        reservedCostumeCount += costumeCount;
    });

    // Calculate pending costume count
    let pendingCostumeCount = 0;
    const pendingReservationsList = reservations.filter(r => r.status === 'pending');
    pendingReservationsList.forEach(reservation => {
        const costumeCount = costumeReservations.filter(cr => cr.reservasjonid === reservation.reservasjonid).length;
        pendingCostumeCount += costumeCount;
    });

    const availableCostumes = totalCostumes - rentedCostumeCount - reservedCostumeCount - pendingCostumeCount;

    return {
        totalCostumes,
        availableCostumes: Math.max(0, availableCostumes),
        pendingReservations,
        rentedCostumes: rentedCostumeCount
    };
}

function updateDashboardCards(stats) {
    document.getElementById('totalCostumes').textContent = stats.totalCostumes;
    document.getElementById('availableCostumes').textContent = stats.availableCostumes;
    document.getElementById('pendingReservations').textContent = stats.pendingReservations;
    document.getElementById('rentedCostumes').textContent = stats.rentedCostumes;
}

function displayRecentReservations(recentReservations) {
    const container = document.getElementById('recentReservations');
    
    if (recentReservations.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Ingen reservasjoner funnet.</p>';
        return;
    }

    const html = recentReservations.map(reservation => {
        const statusClass = getStatusClass(reservation.status);
        const statusText = getStatusText(reservation.status);
        const createdDate = new Date(reservation.createdat).toLocaleDateString('no-NO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        return `
            <div class="reservation-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${reservation.customername}</strong>
                        <br>
                        <small class="text-muted">${reservation.customeremail}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${statusClass} status-badge">${statusText}</span>
                        <br>
                        <small class="text-muted">${createdDate}</small>
                    </div>
                </div>
                ${reservation.notes ? `<div class="mt-2"><small class="text-muted">${reservation.notes}</small></div>` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'bg-warning';
        case 'approved': return 'bg-success';
        case 'rented': return 'bg-info';
        case 'returned': return 'bg-secondary';
        case 'declined': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'pending': return 'Venter';
        case 'approved': return 'Godkjent';
        case 'rented': return 'Utleid';
        case 'returned': return 'Returnert';
        case 'declined': return 'Avslått';
        default: return 'Ukjent';
    }
}

function updateSystemStatus(costumes) {
    // Get unique categories
    const categories = [...new Set(costumes.filter(c => !c.deleted).map(c => c.title))];
    document.getElementById('totalCategories').textContent = categories.length;
    
    // Set last updated time
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString('no-NO');
}

function showErrorMessage() {
    document.getElementById('recentReservations').innerHTML = 
        '<p class="text-danger text-center">Feil ved lasting av data. Prøv å oppdatere siden.</p>';
}
