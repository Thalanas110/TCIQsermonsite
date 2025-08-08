// Theme management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.bindEvents();
    }

    applyTheme(theme) {
        document.body.className = `${theme}-theme`;
        this.updateThemeIcon(theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
    }

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    bindEvents() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Handle mobile navigation
        const navHamburger = document.getElementById('navHamburger');
        const navMenu = document.getElementById('navMenu');
        
        if (navHamburger && navMenu) {
            navHamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navHamburger.classList.toggle('active');
            });
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});

// Export for use in other modules
window.ThemeManager = ThemeManager;
