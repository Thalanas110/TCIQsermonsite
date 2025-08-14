class SessionManager {
    constructor() {
        this.timeoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
        this.warningTime = 60 * 1000; // Show warning 1 minute before timeout
        this.timeoutTimer = null;
        this.warningTimer = null;
        this.warningAlert = null;
        this.init();
    }

    init() {
        this.resetTimers();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Reset timers on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.resetTimers());
        });
    }

    resetTimers() {
        clearTimeout(this.timeoutTimer);
        clearTimeout(this.warningTimer);
        this.hideWarning();

        // Set new timers
        this.warningTimer = setTimeout(() => this.showWarning(), this.timeoutDuration - this.warningTime);
        this.timeoutTimer = setTimeout(() => this.handleTimeout(), this.timeoutDuration);
    }

    showWarning() {
        if (this.warningAlert) {
            this.hideWarning();
        }

        const alertHTML = `
            <div class="alert alert-warning" role="alert">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <p>Your session will expire in 1 minute due to inactivity.</p>
                </div>
                <div class="alert-actions">
                    <button class="alert-button primary" onclick="window.sessionManager.extendSession()">Stay Connected</button>
                </div>
            </div>
        `;

        const alertContainer = document.createElement('div');
        alertContainer.innerHTML = alertHTML;
        this.warningAlert = alertContainer.firstElementChild;
        document.body.appendChild(this.warningAlert);
    }

    hideWarning() {
        if (this.warningAlert) {
            this.warningAlert.classList.add('hiding');
            setTimeout(() => {
                this.warningAlert.remove();
                this.warningAlert = null;
            }, 300); // Match animation duration
        }
    }

    extendSession() {
        this.hideWarning();
        this.resetTimers();
        this.showSuccessMessage();
    }

    showSuccessMessage() {
        const successHTML = `
            <div class="alert alert-info" role="alert">
                <span class="alert-icon">✓</span>
                <div class="alert-content">
                    <p>Session extended successfully!</p>
                </div>
            </div>
        `;

        const alertContainer = document.createElement('div');
        alertContainer.innerHTML = successHTML;
        const successAlert = alertContainer.firstElementChild;
        document.body.appendChild(successAlert);

        setTimeout(() => {
            successAlert.classList.add('hiding');
            setTimeout(() => successAlert.remove(), 300);
        }, 2000);
    }

    async handleTimeout() {
        this.hideWarning();
        
        try {
            // Call logout endpoint
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });
            
            // Show timeout message and redirect
            const timeoutHTML = `
                <div class="alert alert-warning" role="alert">
                    <span class="alert-icon">⏰</span>
                    <div class="alert-content">
                        <p>Your session has expired. Redirecting to login...</p>
                    </div>
                </div>
            `;
            
            const alertContainer = document.createElement('div');
            alertContainer.innerHTML = timeoutHTML;
            document.body.appendChild(alertContainer.firstElementChild);
            
            // Redirect after showing message
            setTimeout(() => {
                window.location.href = '/admin.html';
            }, 2000);
        } catch (error) {
            console.error('Error during session timeout:', error);
        }
    }
}

// Initialize session manager
window.sessionManager = new SessionManager();
