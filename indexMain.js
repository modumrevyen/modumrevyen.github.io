// indexMain.js - Main functionality for index.html

// Check authentication immediately and show content only if authenticated
if (!auth.requireMemberAuth()) {
    // Will redirect to login.html if not authenticated
    // Keep body hidden during redirect
} else {
    // Authentication successful - show the page content
    document.body.classList.remove('checking-auth');
    
    // Check if user is also an admin and show admin panel button
    if (auth.isAdminAuthenticated()) {
        document.getElementById('adminPanelBtn').classList.remove('d-none');
        document.getElementById('adminPanelBtn').addEventListener('click', function() {
            window.location.href = 'admin.html';
        });
    }
    
    // Setup logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Er du sikker på at du vil logge ut?')) {
            auth.logoutMember();
            window.location.href = 'velkommen.html';
        }
    });
    
    // Wait for Bootstrap to be available before setting up Bootstrap-dependent functionality
    function initializeBootstrapComponents() {
        // Setup help button functionality
        document.getElementById('helpBtn').addEventListener('click', function() {
            const helpModal = new bootstrap.Modal(document.getElementById('helpModal'));
            helpModal.show();
        });
        
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Check if Bootstrap is available, if not wait for it
    if (typeof bootstrap !== 'undefined') {
        initializeBootstrapComponents();
    } else {
        // Wait for Bootstrap to load
        document.addEventListener('DOMContentLoaded', function() {
            // Check again after DOM is loaded
            const checkBootstrap = setInterval(function() {
                if (typeof bootstrap !== 'undefined') {
                    clearInterval(checkBootstrap);
                    initializeBootstrapComponents();
                }
            }, 50);
        });
    }
}
