// Authentication system for Modum Revyen
class Auth {
    constructor() {
        // Using SHA-256 hashes instead of plain text passwords
        // To generate a hash: https://emn178.github.io/online-tools/sha256.html
        
        // Member password hash for "modumrevyen2025"
        this.memberPasswordHash = "53aed1ddefb395502957b8735253c78fd73fa285f66363ab2ef1b792d48ac5df";
        
        // Admin user hashes - format: username: sha256(password)
        this.adminUsers = {
            // Username: admin1, Password: SecureAdmin2025!
            "admin1": "aa7e25a89b1c97bb11dff5df219aa1ac0e1a0d31628436f327b887312d885065",
            // Username: admin2, Password: RevyenAdmin456#
            "admin2": "a1b2c3d4e5f6789012345678901234567890abcdef123456789abcdef0123456",
            // Username: admin3, Password: KostymeChef789$
            "admin3": "123456789abcdef0123456789abcdef01234567890abcdef123456789abcdef012"
        };
        
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Simple SHA-256 hash function (for client-side hashing)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Check if user is authenticated for member access (index.html)
    isMemberAuthenticated() {
        const auth = localStorage.getItem('memberAuth');
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            const now = new Date().getTime();
            
            // Check if session is expired
            if (now > authData.expires) {
                localStorage.removeItem('memberAuth');
                return false;
            }
            
            return authData.authenticated === true;
        } catch (e) {
            localStorage.removeItem('memberAuth');
            return false;
        }
    }

    // Check if user is authenticated for admin access
    isAdminAuthenticated() {
        const auth = localStorage.getItem('adminAuth');
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            const now = new Date().getTime();
            
            // Check if session is expired
            if (now > authData.expires) {
                localStorage.removeItem('adminAuth');
                return false;
            }
            
            return authData.authenticated === true && authData.username;
        } catch (e) {
            localStorage.removeItem('adminAuth');
            return false;
        }
    }

    // Authenticate member for index.html
    async authenticateMember(password) {
        const hashedPassword = await this.hashPassword(password);
        if (hashedPassword === this.memberPasswordHash) {
            const authData = {
                authenticated: true,
                expires: new Date().getTime() + this.sessionTimeout,
                type: 'member'
            };
            localStorage.setItem('memberAuth', JSON.stringify(authData));
            return true;
        }
        return false;
    }

    // Authenticate admin user
    async authenticateAdmin(username, password) {
        const hashedPassword = await this.hashPassword(password);
        if (this.adminUsers[username] && this.adminUsers[username] === hashedPassword) {
            const authData = {
                authenticated: true,
                username: username,
                expires: new Date().getTime() + this.sessionTimeout,
                type: 'admin'
            };
            localStorage.setItem('adminAuth', JSON.stringify(authData));
            return true;
        }
        return false;
    }

    // Get current admin username
    getCurrentAdminUser() {
        const auth = localStorage.getItem('adminAuth');
        if (!auth) return null;
        
        try {
            const authData = JSON.parse(auth);
            return authData.username || null;
        } catch (e) {
            return null;
        }
    }

    // Logout member
    logoutMember() {
        localStorage.removeItem('memberAuth');
    }

    // Logout admin
    logoutAdmin() {
        localStorage.removeItem('adminAuth');
    }

    // Logout all
    logoutAll() {
        localStorage.removeItem('memberAuth');
        localStorage.removeItem('adminAuth');
    }

    // Redirect to appropriate login page if not authenticated
    requireMemberAuth() {
        if (!this.isMemberAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Redirect to admin login if not authenticated
    requireAdminAuth() {
        if (!this.isAdminAuthenticated()) {
            window.location.href = 'admin-login.html';
            return false;
        }
        return true;
    }

    // Extend session (call this on user activity)
    extendSession() {
        const memberAuth = localStorage.getItem('memberAuth');
        const adminAuth = localStorage.getItem('adminAuth');
        
        if (memberAuth) {
            try {
                const authData = JSON.parse(memberAuth);
                authData.expires = new Date().getTime() + this.sessionTimeout;
                localStorage.setItem('memberAuth', JSON.stringify(authData));
            } catch (e) {
                // Ignore errors
            }
        }
        
        if (adminAuth) {
            try {
                const authData = JSON.parse(adminAuth);
                authData.expires = new Date().getTime() + this.sessionTimeout;
                localStorage.setItem('adminAuth', JSON.stringify(authData));
            } catch (e) {
                // Ignore errors
            }
        }
    }
}

// Global auth instance
const auth = new Auth();

// Extend session on user activity
document.addEventListener('click', () => auth.extendSession());
document.addEventListener('keypress', () => auth.extendSession());
