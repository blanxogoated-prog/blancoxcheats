// Particle System (unchanged)
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.resize();
        this.createParticles();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            if (particle.x <= 0 || particle.x >= this.canvas.width) particle.vx *= -1;
            if (particle.y <= 0 || particle.y >= this.canvas.height) particle.vy *= -1;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        requestAnimationFrame(() => this.animate());
    }
}

// Navigation Manager
class NavigationManager {
    constructor() {
        this.currentPage = 'home';
        this.userLoggedIn = this.checkLoginStatus();
        this.initializeNavigation();
        this.updateAuthLink();
    }
    initializeNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');
                this.showPage(page);
            });
        });
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
        document.addEventListener('click', e => {
            if (!e.target.closest('.navbar')) navMenu.classList.remove('active');
        });
    }
    showPage(pageName) {
        if (pageName === 'dashboard' && !this.userLoggedIn) {
            this.showPage('login');
            this.showNotification('Please login to access the dashboard', 'error');
            return;
        }
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageName);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            window.location.hash = pageName;
            if (pageName === 'dashboard' && this.userLoggedIn) {
                this.loadDashboardData();
            }
        }
        document.getElementById('navMenu').classList.remove('active');
    }
    checkLoginStatus() {
        return localStorage.getItem('userToken') !== null;
    }
    updateAuthLink() {
        const authLink = document.getElementById('authLink');
        const link = authLink.querySelector('a');
        if (this.userLoggedIn) {
            link.textContent = 'Dashboard';
            link.setAttribute('data-page', 'dashboard');
            link.setAttribute('href', '#dashboard');
        } else {
            link.textContent = 'Login';
            link.setAttribute('data-page', 'login');
            link.setAttribute('href', '#login');
        }
    }
    loadDashboardData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        document.getElementById('dashUsername').textContent = userData.username || 'User';
        document.getElementById('dashExpiry').textContent = userData.expiry || 'N/A';
        document.getElementById('dashStatus').textContent = userData.status || 'Inactive';
    }
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }
}

// KeyAuth API Manager
class KeyAuthManager {
    constructor() {
        this.apiUrl = 'https://keyauth.win/api/1.2/';
        this.appName = 'cheat';        // Your app name here
        this.ownerID = 'ODkpNkljhD';   // Your owner id here
        this.appSecret = '3ebe5ef112f122d6e7433be24400f8c2a38ee5b3867c877cb2efccc53540c8bb'; // Your app secret here
        this.version = '1.0';
    }

    async makeRequest(type, data) {
        try {
            const params = new URLSearchParams({
                type,
                name: this.appName,
                ownerid: this.ownerID,
                secret: this.appSecret,
                version: this.version,
                ...data
            });
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });
            return await response.json();
        } catch (error) {
            console.error('KeyAuth API error:', error);
            return { success: false, message: 'Connection error' };
        }
    }

    async login(username, password) {
        return this.makeRequest('login', { user: username, pass: password });
    }

    async register(username, password, key) {
        return this.makeRequest('register', { user: username, pass: password, key: key });
    }

    async resetHWID(username) {
        return this.makeRequest('sethwid', { user: username });
    }
}

// Main App Controller
class App {
    constructor() {
        this.particleSystem = new ParticleSystem();
        this.navigationManager = new NavigationManager();
        this.keyAuthManager = new KeyAuthManager();
        this.initializeEventListeners();
        this.handleInitialRoute();
    }

    initializeEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', e => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', e => this.handleRegister(e));
        document.querySelectorAll('.contact-form form').forEach(form => {
            form.addEventListener('submit', e => this.handleContact(e));
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        if (!username || !password) {
            this.navigationManager.showNotification('Please fill in all fields', 'error');
            return;
        }
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;
        try {
            const result = await this.keyAuthManager.login(username, password);
            if (result.success) {
                localStorage.setItem('userToken', result.sessionid || 'token');
                localStorage.setItem('userData', JSON.stringify({
                    username: result.username,
                    expiry: result.expiry,
                    status: result.subscribed ? 'Active' : 'Inactive',
                    hwid: result.hwid
                }));
                this.navigationManager.userLoggedIn = true;
                this.navigationManager.updateAuthLink();
                this.navigationManager.showNotification('Login successful!', 'success');
                this.navigationManager.showPage('dashboard');
                e.target.reset();
            } else {
                this.navigationManager.showNotification(result.message || 'Login failed', 'error');
            }
        } catch {
            this.navigationManager.showNotification('Login failed. Please try again.', 'error');
        } finally {
            submitBtn.textContent = origText;
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const key = document.getElementById('registerKey').value.trim();
        if (!username || !password || !key) {
            this.navigationManager.showNotification('Please fill in all fields', 'error');
            return;
        }
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const origText = submitBtn.textContent;
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;
        try {
            const result = await this.keyAuthManager.register(username, password, key);
            if (result.success) {
                localStorage.setItem('userToken', result.sessionid || 'token');
                localStorage.setItem('userData', JSON.stringify({
                    username: result.username,
                    expiry: result.expiry,
                    status: result.subscribed ? 'Active' : 'Inactive',
                    hwid: result.hwid
                }));
                this.navigationManager.userLoggedIn = true;
                this.navigationManager.updateAuthLink();
                this.navigationManager.showNotification('Registration successful!', 'success');
                this.navigationManager.showPage('dashboard');
                e.target.reset();
            } else {
                this.navigationManager.showNotification(result.message || 'Registration failed', 'error');
            }
        } catch {
            this.navigationManager.showNotification('Registration failed. Please try again.', 'error');
        } finally {
            submitBtn.textContent = origText;
            submitBtn.disabled = false;
        }
    }

    handleContact(e) {
        e.preventDefault();
        this.navigationManager.showNotification('Message sent successfully!', 'success');
        e.target.reset();
    }

    handleInitialRoute() {
        const hash = window.location.hash.substring(1);
        if (hash) this.navigationManager.showPage(hash);
    }
}

// Global functions called from HTML buttons etc.
function showPage(pageName) {
    if (window.app) window.app.navigationManager.showPage(pageName);
}

async function resetHWID() {
    if (!window.app) return;
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.username) {
        window.app.navigationManager.showNotification('User not logged in', 'error');
        return;
    }
    const result = await window.app.keyAuthManager.resetHWID(userData.username);
    if (result.success) {
        window.app.navigationManager.showNotification('HWID reset successfully!', 'success');
    } else {
        window.app.navigationManager.showNotification(result.message || 'Failed to reset HWID', 'error');
    }
}

function downloadSoftware() {
    if (window.app) window.app.navigationManager.showNotification('Download started!', 'success');
    window.location.href = "exe/WOLFES-LOADER.exe";
}

function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    if (window.app) {
        window.app.navigationManager.userLoggedIn = false;
        window.app.navigationManager.updateAuthLink();
        window.app.navigationManager.showNotification('Logged out successfully', 'success');
        window.app.navigationManager.showPage('home');
    }
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {transform: translateX(100%);opacity: 0;}
        to {transform: translateX(0);opacity: 1;}
    }
    @keyframes slideOut {
        from {transform: translateX(0);opacity: 1;}
        to {transform: translateX(100%);opacity: 0;}
    }
`;
document.head.appendChild(style);

// Initialize app when DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
