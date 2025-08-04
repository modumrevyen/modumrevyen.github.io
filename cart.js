// cart.js - Shopping cart functionality for costume reservations

class ShoppingCart {
    constructor() {
        this.items = [];
        this.initializeEventListeners();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Cart button in header
        document.getElementById('cartBtn')?.addEventListener('click', () => {
            this.showCart();
        });

        // Clear cart button
        document.getElementById('clearCartBtn')?.addEventListener('click', () => {
            this.clearCart();
        });

        // Proceed to reservation button
        document.getElementById('proceedToReservationBtn')?.addEventListener('click', () => {
            this.showReservationForm();
        });

        // Back to cart button
        document.getElementById('backToCartBtn')?.addEventListener('click', () => {
            this.backToCart();
        });

        // Reservation form submission
        document.getElementById('reservationForm')?.addEventListener('submit', (e) => {
            this.handleReservationSubmit(e);
        });

        // Listen for add to cart events on costume cards (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                const btn = e.target.closest('.add-to-cart-btn');
                this.addToCart(btn);
            }
        });
    }

    // Add item to cart
    addToCart(button) {
        const costume = {
            id: button.dataset.costumeId,
            title: button.dataset.costumeTitle,
            subcategory: button.dataset.costumeSubcategory,
            size: button.dataset.costumeSize,
            description: button.dataset.costumeDescription,
            image: button.dataset.costumeImage
        };

        // Check if item already exists in cart
        const existingItem = this.items.find(item => item.id === costume.id);
        if (existingItem) {
            this.showMessage('Dette kostymet er allerede i handlekurven!', 'warning');
            return;
        }

        this.items.push(costume);
        this.updateCartDisplay();
        // this.showMessage('Kostyme lagt til i handlekurven!', 'success');
        
        // Update button state
        button.classList.remove('btn-primary');
        button.classList.add('btn-success');
        button.innerHTML = '<i class="fas fa-check"></i><span class="d-none d-sm-inline ms-1">Lagt til</span>';
        button.disabled = true;
    }

    // Remove item from cart
    removeFromCart(costumeId) {
        this.items = this.items.filter(item => item.id !== costumeId);
        this.updateCartDisplay();
        this.updateButtonStates();
        // this.showMessage('Kostyme fjernet fra handlekurven', 'info');
    }

    // Clear entire cart
    clearCart() {
        if (this.items.length === 0) return;
        
        if (confirm('Er du sikker på at du vil tømme hele handlekurven?')) {
            this.items = [];
            this.updateCartDisplay();
            this.updateButtonStates();
        }
    }

    // Update cart display
    updateCartDisplay() {
        this.updateCartCount();
        this.updateCartItems();
        this.updateProceedButton();
    }

    // Update cart count badge
    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.items.length;
            if (this.items.length > 0) {
                cartCount.classList.remove('d-none');
            } else {
                cartCount.classList.add('d-none');
            }
        }
    }

    // Update cart items display
    updateCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const emptyMessage = document.getElementById('emptyCartMessage');
        
        if (!cartItemsContainer || !emptyMessage) return;

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyMessage.style.display = 'block';
        } else {
            emptyMessage.style.display = 'none';
            cartItemsContainer.innerHTML = this.items.map(item => this.createCartItemHTML(item)).join('');
        }
    }

    // Create HTML for cart item
    createCartItemHTML(item) {
        const sizeOrDescription = item.title?.toLowerCase() === 'rekvisitter' 
            ? (item.description || 'Ingen beskrivelse')
            : (item.size || 'Ikke angitt');
        
        return `
            <div class="card mb-2">
                <div class="card-body p-2">
                    <div class="row g-2 align-items-center">
                        <div class="col-3 col-md-2">
                            <img src="${item.image}" class="img-fluid rounded" 
                                 style="width: 100%; height: 60px; object-fit: cover;" alt="${item.title}">
                        </div>
                        <div class="col-8 col-md-9">
                            <h6 class="mb-1 text-truncate">${item.title}</h6>
                            <small class="text-muted d-block">
                                ${item.subcategory || 'Ikke angitt'}
                            </small>
                            <small class="text-muted d-block">
                                ${item.title?.toLowerCase() === 'rekvisitter' ? 'Beskrivelse' : 'Størrelse'}: 
                                ${sizeOrDescription}
                            </small>
                        </div>
                        <div class="col-1">
                            <button class="btn btn-outline-danger btn-sm p-1" 
                                    onclick="cart.removeFromCart('${item.id}')"
                                    title="Fjern fra handlekurv">
                                <i class="fas fa-times" style="font-size: 0.75rem;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Update proceed button state
    updateProceedButton() {
        const proceedBtn = document.getElementById('proceedToReservationBtn');
        if (proceedBtn) {
            proceedBtn.disabled = this.items.length === 0;
        }
    }

    // Update button states on costume cards
    updateButtonStates() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            const costumeId = btn.dataset.costumeId;
            const isInCart = this.items.some(item => item.id === costumeId);
            
            if (isInCart) {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-success');
                btn.innerHTML = '<i class="fas fa-check"></i><span class="d-none d-sm-inline ms-1">Lagt til</span>';
                btn.disabled = true;
            } else {
                btn.classList.remove('btn-success');
                btn.classList.add('btn-primary');
                btn.innerHTML = '<i class="fas fa-plus"></i><span class="d-none d-sm-inline ms-1">Legg til</span>';
                btn.disabled = false;
            }
        });
    }

    // Show cart modal
    showCart() {
        this.updateCartDisplay();
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
    }

    // Show reservation form
    showReservationForm() {
        this.updateReservationSummary();
        
        // Hide cart modal and show reservation modal
        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        const reservationModal = new bootstrap.Modal(document.getElementById('reservationModal'));
        
        cartModal.hide();
        setTimeout(() => {
            reservationModal.show();
        }, 300);
    }

    // Go back to cart from reservation form
    backToCart() {
        const reservationModal = bootstrap.Modal.getInstance(document.getElementById('reservationModal'));
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        
        reservationModal.hide();
        setTimeout(() => {
            cartModal.show();
        }, 300);
    }

    // Update reservation summary
    updateReservationSummary() {
        const summaryContainer = document.getElementById('reservationSummary');
        if (!summaryContainer) return;

        if (this.items.length === 0) {
            summaryContainer.innerHTML = '<p class="text-muted">Ingen kostymer valgt</p>';
            return;
        }

        const summaryHTML = this.items.map(item => {
            const sizeOrDescription = item.title?.toLowerCase() === 'rekvisitter' 
                ? (item.description || 'Ingen beskrivelse')
                : (item.size || 'Ikke angitt');
            
            return `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <strong>${item.title}</strong>
                        <br>
                        <small class="text-muted">
                            ${item.subcategory || 'Ikke angitt'} • 
                            ${item.title?.toLowerCase() === 'rekvisitter' ? 'Beskrivelse' : 'Størrelse'}: ${sizeOrDescription}
                        </small>
                    </div>
                    <img src="${item.image}" class="rounded" style="width: 50px; height: 50px; object-fit: cover;" alt="${item.title}">
                </div>
            `;
        }).join('');

        summaryContainer.innerHTML = `
            <div class="mb-2">
                <strong>Antall kostymer: ${this.items.length}</strong>
            </div>
            ${summaryHTML}
        `;
    }

    // Handle reservation form submission
    handleReservationSubmit(e) {
        e.preventDefault();
        
        // Check if kundeReservasjoner.js is loaded and delegate to it
        if (typeof handleReservationSubmit === 'function') {
            handleReservationSubmit(e);
        } else {
            console.error('kundeReservasjoner.js not loaded or handleReservationSubmit function not available');
            this.showMessage('Feil: Reservasjonssystem ikke tilgjengelig', 'danger');
        }
    }

    // Get current cart items (for external access)
    getItems() {
        return [...this.items]; // Return a copy to prevent external modification
    }

    // Clear cart (for external access)
    clearCartExternal() {
        this.items = [];
        this.updateCartDisplay();
        this.updateButtonStates();
        document.getElementById('reservationForm')?.reset();
    }

    // Show message to user
    showMessage(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        toast.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.cart = new ShoppingCart();
});
