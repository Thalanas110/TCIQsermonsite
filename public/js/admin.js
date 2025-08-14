// Admin dashboard functionality
class AdminDashboard {
    constructor() {
        this.isLoggedIn = false;
        this.currentSection = 'overview';
        this.videos = [];
        this.comments = [];
        this.bannedUsers = [];
        this.churchInfo = {};
        this.announcements = [];
        this.galleryItems = [];
        this.overviewChart = null;
        this.activityChart = null;
        this.inactivityTimeout = null;
        this.inactivityWarningTimeout = null;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.bindEvents();
        
        if (this.isLoggedIn) {
            this.showDashboard();
            await this.loadDashboardData();
            this.resetInactivityTimer();
        } else {
            this.showLogin();
        }
    }

    resetInactivityTimer() {
        if (!this.isLoggedIn) return;

        // Clear existing timeouts
        if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
        if (this.inactivityWarningTimeout) clearTimeout(this.inactivityWarningTimeout);

        // Set warning timeout (4 minutes)
        this.inactivityWarningTimeout = setTimeout(() => {
            this.showInactivityWarning();
        }, 4 * 60 * 1000);

        // Set logout timeout (5 minutes)
        this.inactivityTimeout = setTimeout(() => {
            this.handleInactivityLogout();
        }, 5 * 60 * 1000);
    }

    showInactivityWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'inactivity-warning';
        warningDiv.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Your session will expire in 1 minute due to inactivity.</p>
                <button onclick="window.adminDashboard.resetInactivityTimer(); this.parentElement.parentElement.remove();">
                    Keep Session Active
                </button>
            </div>
        `;
        document.body.appendChild(warningDiv);
    }

    async handleInactivityLogout() {
        await this.handleLogout();
        const warningDiv = document.querySelector('.inactivity-warning');
        if (warningDiv) warningDiv.remove();
        
        // Show message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'logout-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-clock"></i>
                <p>You have been logged out due to inactivity.</p>
            </div>
        `;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 5000);
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => this.handleLogout());
        }

        // Activity tracking for session timeout
        ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.resetInactivityTimer());
        });

        // Initialize logs section listeners
        this.initLogsListeners();

        // Sidebar navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.sidebar-link')) {
                const section = e.target.dataset.section;
                this.switchSection(section);
            }
        });

        // Activity tracking
        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.resetInactivityTimer());
        });

        // Check session status periodically
        setInterval(() => this.checkAuthStatus(), 30000); // Check every 30 seconds

        // Video management
        const addVideoButton = document.getElementById('addVideoButton');
        if (addVideoButton) {
            addVideoButton.addEventListener('click', () => this.showVideoForm());
        }

        const cancelVideoForm = document.getElementById('cancelVideoForm');
        if (cancelVideoForm) {
            cancelVideoForm.addEventListener('click', () => this.hideVideoForm());
        }

        const videoForm = document.getElementById('videoForm');
        if (videoForm) {
            videoForm.addEventListener('submit', (e) => this.handleVideoSubmit(e));
        }

        const videoType = document.getElementById('videoType');
        if (videoType) {
            videoType.addEventListener('change', (e) => this.handleVideoTypeChange(e));
        }

        // Church info form
        const churchInfoForm = document.getElementById('churchInfoForm');
        if (churchInfoForm) {
            churchInfoForm.addEventListener('submit', (e) => this.handleChurchInfoSubmit(e));
        }

        // Announcements management
        const addAnnouncementButton = document.getElementById('addAnnouncementButton');
        if (addAnnouncementButton) {
            addAnnouncementButton.addEventListener('click', () => this.showAnnouncementForm());
        }

        const cancelAnnouncementForm = document.getElementById('cancelAnnouncementForm');
        if (cancelAnnouncementForm) {
            cancelAnnouncementForm.addEventListener('click', () => this.hideAnnouncementForm());
        }

        const announcementForm = document.getElementById('announcementForm');
        if (announcementForm) {
            announcementForm.addEventListener('submit', (e) => this.handleAnnouncementSubmit(e));
        }

        // Gallery management
        const addGalleryButton = document.getElementById('addGalleryButton');
        if (addGalleryButton) {
            addGalleryButton.addEventListener('click', () => this.showGalleryForm());
        }

        const cancelGalleryForm = document.getElementById('cancelGalleryForm');
        if (cancelGalleryForm) {
            cancelGalleryForm.addEventListener('click', () => this.hideGalleryForm());
        }

        const galleryForm = document.getElementById('galleryForm');
        if (galleryForm) {
            galleryForm.addEventListener('submit', (e) => this.handleGallerySubmit(e));
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/admin/auth-status');
            const data = await response.json();
            this.isLoggedIn = data.isAdmin;
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.isLoggedIn = false;
        }
    }

    showLogin() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('loginError');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        loginError.textContent = '';
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.isLoggedIn = true;
                this.showDashboard();
                await this.loadDashboardData();
            } else {
                loginError.textContent = data.error || 'Login failed';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Login failed. Please try again.';
        } finally {
            submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            submitButton.disabled = false;
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            this.isLoggedIn = false;
            this.showLogin();
            
            // Clear form
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    switchSection(section) {
        // Update sidebar active state
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Show/hide sections
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        // Load section-specific data
        this.loadSectionData(section);
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadStats(),
            this.loadVideos(),
            this.loadComments(),
            this.loadBannedUsers(),
            this.loadChurchInfo(),
            this.loadAnnouncements(),
            this.loadGallery()
        ]);
    }

    async loadSectionData(section) {
        switch (section) {
            case 'overview':
                await this.loadStats();
                break;
            case 'videos':
                await this.loadVideos();
                break;
            case 'comments':
                await this.loadComments();
                break;
            case 'bans':
                await this.loadBannedUsers();
                break;
            case 'announcements':
                await this.loadAnnouncements();
                break;
            case 'gallery':
                await this.loadGallery();
                break;
            case 'church-info':
                await this.loadChurchInfo();
                break;
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/admin/stats');
            if (!response.ok) throw new Error('Failed to fetch stats');
            
            const stats = await response.json();
            
            document.getElementById('totalVideos').textContent = stats.totalVideos || 0;
            document.getElementById('totalComments').textContent = stats.totalComments || 0;
            document.getElementById('totalViews').textContent = this.formatViews(stats.totalViews || 0);
            document.getElementById('recentActivity').textContent = stats.recentVideos || 0;
            
            // Update charts with new data
            this.updateCharts(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadVideos() {
        const videosList = document.getElementById('videosList');
        
        videosList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading videos...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/videos');
            if (!response.ok) throw new Error('Failed to fetch videos');
            
            this.videos = await response.json();
            this.renderVideosList();
        } catch (error) {
            console.error('Error loading videos:', error);
            videosList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load videos.</p>
                </div>
            `;
        }
    }

    renderVideosList() {
        const videosList = document.getElementById('videosList');
        
        if (this.videos.length === 0) {
            videosList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-video"></i>
                    <p>No videos uploaded yet.</p>
                </div>
            `;
            return;
        }

        videosList.innerHTML = this.videos.map(video => `
            <div class="video-item">
                <div class="video-item-info">
                    <h4>${this.escapeHtml(video.title)}</h4>
                    <p>${this.escapeHtml(video.description || '')}</p>
                    <p><strong>Type:</strong> ${video.type} | <strong>Views:</strong> ${video.views || 0} | <strong>Created:</strong> ${this.formatDate(video.created_at)}</p>
                </div>
                <div class="video-item-actions">
                    <button class="edit-button" onclick="adminDashboard.editVideo(${video.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="danger-button" onclick="adminDashboard.deleteVideo(${video.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadComments() {
        const commentsList = document.getElementById('commentsList');
        
        commentsList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading comments...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/comments');
            if (!response.ok) throw new Error('Failed to fetch comments');
            
            this.comments = await response.json();
            this.renderCommentsList();
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load comments.</p>
                </div>
            `;
        }
    }

    renderCommentsList() {
        const commentsList = document.getElementById('commentsList');
        
        if (this.comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No comments yet.</p>
                </div>
            `;
            return;
        }

        commentsList.innerHTML = this.comments.map(comment => `
            <div class="comment-admin-item">
                <div class="comment-admin-header">
                    <div class="comment-admin-info">
                        <strong>${this.escapeHtml(comment.commenter_name)}</strong>
                        <span>${this.formatDate(comment.created_at)}</span>
                        <small>Device: ${comment.device_fingerprint.substring(0, 8)}...</small>
                    </div>
                    <div class="comment-admin-actions">
                        <button class="ban-button" onclick="adminDashboard.banUser('${comment.device_fingerprint}', '${this.escapeHtml(comment.commenter_name)}')">
                            <i class="fas fa-ban"></i> Ban User
                        </button>
                        <button class="danger-button" onclick="adminDashboard.deleteComment(${comment.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
            </div>
        `).join('');
    }

    async loadBannedUsers() {
        const bannedUsersList = document.getElementById('bannedUsersList');
        
        bannedUsersList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading banned users...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/comments/banned');
            if (!response.ok) throw new Error('Failed to fetch banned users');
            
            this.bannedUsers = await response.json();
            this.renderBannedUsersList();
        } catch (error) {
            console.error('Error loading banned users:', error);
            bannedUsersList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load banned users.</p>
                </div>
            `;
        }
    }

    renderBannedUsersList() {
        const bannedUsersList = document.getElementById('bannedUsersList');
        
        if (this.bannedUsers.length === 0) {
            bannedUsersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-ban"></i>
                    <p>No banned users.</p>
                </div>
            `;
            return;
        }

        bannedUsersList.innerHTML = this.bannedUsers.map(user => `
            <div class="comment-admin-item">
                <div class="comment-admin-header">
                    <div class="comment-admin-info">
                        <strong>Device: ${user.device_fingerprint.substring(0, 16)}...</strong>
                        <span>Banned: ${this.formatDate(user.banned_at)}</span>
                        <small>${this.escapeHtml(user.reason || 'No reason provided')}</small>
                    </div>
                    <div class="comment-admin-actions">
                        <button class="edit-button" onclick="adminDashboard.unbanUser('${user.device_fingerprint}')">
                            <i class="fas fa-check"></i> Unban
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadChurchInfo() {
        try {
            const response = await fetch('/api/church');
            if (!response.ok) throw new Error('Failed to fetch church info');
            
            this.churchInfo = await response.json();
            this.populateChurchInfoForm();
        } catch (error) {
            console.error('Error loading church info:', error);
        }
    }

    populateChurchInfoForm() {
        document.getElementById('churchName').value = this.churchInfo.name || '';
        document.getElementById('pastorName').value = this.churchInfo.pastor || '';
        document.getElementById('churchMission').value = this.churchInfo.mission || '';
        document.getElementById('churchDescription').value = this.churchInfo.description || '';
        document.getElementById('churchAddress').value = this.churchInfo.address || '';
        document.getElementById('churchPhone').value = this.churchInfo.phone || '';
        document.getElementById('churchEmail').value = this.churchInfo.email || '';
        document.getElementById('serviceTimes').value = this.churchInfo.service_times || '';
    }

    showVideoForm(video = null) {
        const container = document.getElementById('videoFormContainer');
        const form = document.getElementById('videoForm');
        const editVideoId = document.getElementById('editVideoId');
        
        container.style.display = 'block';
        
        if (video) {
            // Edit mode
            editVideoId.value = video.id;
            document.getElementById('videoTitle').value = video.title;
            document.getElementById('videoDescription').value = video.description || '';
            document.getElementById('videoType').value = video.type;
            this.handleVideoTypeChange({ target: { value: video.type } });
            
            if (video.type === 'youtube') {
                document.getElementById('youtubeUrl').value = video.url;
            }
        } else {
            // Add mode
            editVideoId.value = '';
            form.reset();
            this.handleVideoTypeChange({ target: { value: '' } });
        }
        
        container.scrollIntoView({ behavior: 'smooth' });
    }

    hideVideoForm() {
        document.getElementById('videoFormContainer').style.display = 'none';
        document.getElementById('videoForm').reset();
    }

    handleVideoTypeChange(e) {
        const type = e.target.value;
        const youtubeGroup = document.getElementById('youtubeUrlGroup');
        const mp4Group = document.getElementById('mp4FileGroup');
        
        youtubeGroup.style.display = type === 'youtube' ? 'block' : 'none';
        mp4Group.style.display = type === 'mp4' ? 'block' : 'none';
    }

    async handleVideoSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const editVideoId = document.getElementById('editVideoId').value;
        const isEdit = !!editVideoId;
        
        formData.append('title', document.getElementById('videoTitle').value);
        formData.append('description', document.getElementById('videoDescription').value);
        formData.append('type', document.getElementById('videoType').value);
        
        if (document.getElementById('videoType').value === 'youtube') {
            formData.append('youtube_url', document.getElementById('youtubeUrl').value);
        } else if (document.getElementById('videoType').value === 'mp4') {
            const fileInput = document.getElementById('mp4File');
            if (fileInput.files[0]) {
                formData.append('video', fileInput.files[0]);
            } else if (!isEdit) {
                this.showNotification('Please select an MP4 file', 'error');
                return;
            }
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitButton.disabled = true;

        try {
            let url = '/api/videos';
            let method = 'POST';
            
            if (isEdit) {
                url = `/api/videos/${editVideoId}`;
                method = 'PUT';
                // For updates, we only send JSON data (no file uploads for edits)
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: document.getElementById('videoTitle').value,
                        description: document.getElementById('videoDescription').value
                    }),
                });
                
                if (!response.ok) throw new Error('Failed to update video');
            } else {
                const response = await fetch(url, {
                    method,
                    body: formData,
                });
                
                if (!response.ok) throw new Error('Failed to create video');
            }

            this.showNotification(isEdit ? 'Video updated successfully!' : 'Video created successfully!', 'success');
            this.hideVideoForm();
            await this.loadVideos();
            await this.loadStats();
        } catch (error) {
            console.error('Error saving video:', error);
            this.showNotification(error.message || 'Failed to save video', 'error');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async handleChurchInfoSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('churchName').value,
            pastor: document.getElementById('pastorName').value,
            mission: document.getElementById('churchMission').value,
            description: document.getElementById('churchDescription').value,
            address: document.getElementById('churchAddress').value,
            phone: document.getElementById('churchPhone').value,
            email: document.getElementById('churchEmail').value,
            service_times: document.getElementById('serviceTimes').value
        };

        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/church', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error('Failed to update church information');

            this.showNotification('Church information updated successfully!', 'success');
            await this.loadChurchInfo();
        } catch (error) {
            console.error('Error updating church info:', error);
            this.showNotification('Failed to update church information', 'error');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async editVideo(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (video) {
            this.showVideoForm(video);
        }
    }

    async deleteVideo(videoId) {
        if (!confirm('Are you sure you want to delete this video?')) return;

        try {
            const response = await fetch(`/api/videos/${videoId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete video');

            this.showNotification('Video deleted successfully!', 'success');
            await this.loadVideos();
            await this.loadStats();
        } catch (error) {
            console.error('Error deleting video:', error);
            this.showNotification('Failed to delete video', 'error');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete comment');

            this.showNotification('Comment deleted successfully!', 'success');
            await this.loadComments();
            await this.loadStats();
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.showNotification('Failed to delete comment', 'error');
        }
    }

    async banUser(deviceFingerprint, userName) {
        const reason = prompt(`Enter reason for banning ${userName}:`, 'Inappropriate behavior');
        if (reason === null) return;

        try {
            const response = await fetch('/api/comments/ban', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    device_fingerprint: deviceFingerprint,
                    reason: reason
                }),
            });

            if (!response.ok) throw new Error('Failed to ban user');

            this.showNotification('User banned successfully!', 'success');
            await this.loadComments();
            await this.loadBannedUsers();
        } catch (error) {
            console.error('Error banning user:', error);
            this.showNotification('Failed to ban user', 'error');
        }
    }

    async unbanUser(deviceFingerprint) {
        if (!confirm('Are you sure you want to unban this user?')) return;

        try {
            const response = await fetch('/api/comments/unban', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    device_fingerprint: deviceFingerprint
                }),
            });

            if (!response.ok) throw new Error('Failed to unban user');

            this.showNotification('User unbanned successfully!', 'success');
            await this.loadBannedUsers();
            await this.loadComments();
        } catch (error) {
            console.error('Error unbanning user:', error);
            this.showNotification('Failed to unban user', 'error');
        }
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.admin-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `admin-notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'error' ? 'var(--error)' : 'var(--success)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideInFromRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutToRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    formatViews(views) {
        if (views < 1000) return views.toString();
        if (views < 1000000) return `${(views / 1000).toFixed(1)}K`;
        return `${(views / 1000000).toFixed(1)}M`;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    updateCharts(stats) {
        this.createOverviewChart(stats);
        this.createActivityChart(stats);
    }

    createOverviewChart(stats) {
        const ctx = document.getElementById('overviewChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.overviewChart) {
            this.overviewChart.destroy();
        }

        this.overviewChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Videos', 'Comments', 'Total Views (÷100)'],
                datasets: [{
                    data: [
                        stats.totalVideos || 0,
                        stats.totalComments || 0,
                        Math.floor((stats.totalViews || 0) / 100) // Scale down views for better visualization
                    ],
                    backgroundColor: [
                        '#D4AF37', // Gold
                        '#4A90E2', // Blue
                        '#7B68EE'  // Purple
                    ],
                    borderWidth: 2,
                    borderColor: '#1a1a2e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: document.documentElement.classList.contains('dark-theme') ? '#e0e0e0' : '#333',
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }

    createActivityChart(stats) {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.activityChart) {
            this.activityChart.destroy();
        }

        this.activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['New Videos', 'New Comments'],
                datasets: [{
                    label: 'Recent Activity',
                    data: [
                        stats.recentVideos || 0,
                        stats.recentComments || 0
                    ],
                    backgroundColor: [
                        'rgba(212, 175, 55, 0.8)', // Gold with transparency
                        'rgba(74, 144, 226, 0.8)'  // Blue with transparency
                    ],
                    borderColor: [
                        '#D4AF37',
                        '#4A90E2'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: document.documentElement.classList.contains('dark-theme') ? '#e0e0e0' : '#666'
                        },
                        grid: {
                            color: document.documentElement.classList.contains('dark-theme') ? '#333' : '#e0e0e0'
                        }
                    },
                    x: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark-theme') ? '#e0e0e0' : '#666'
                        },
                        grid: {
                            color: document.documentElement.classList.contains('dark-theme') ? '#333' : '#e0e0e0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Announcements Management
    async loadAnnouncements() {
        const announcementsList = document.getElementById('announcementsList');
        
        announcementsList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading announcements...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/announcements/all');
            if (!response.ok) throw new Error('Failed to fetch announcements');
            
            this.announcements = await response.json();
            this.renderAnnouncementsList();
        } catch (error) {
            console.error('Error loading announcements:', error);
            announcementsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load announcements.</p>
                </div>
            `;
        }
    }

    renderAnnouncementsList() {
        const announcementsList = document.getElementById('announcementsList');
        
        if (this.announcements.length === 0) {
            announcementsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <p>No announcements yet.</p>
                </div>
            `;
            return;
        }

        announcementsList.innerHTML = this.announcements.map(announcement => `
            <div class="announcement-item">
                <div class="announcement-header">
                    <h4>${this.escapeHtml(announcement.title)}</h4>
                    <div class="announcement-actions">
                        <button class="edit-button" onclick="adminDashboard.editAnnouncement(${announcement.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="danger-button" onclick="adminDashboard.deleteAnnouncement(${announcement.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="announcement-content">
                    <p>${this.escapeHtml(announcement.content)}</p>
                    ${announcement.image_data ? `<img src="data:image/jpeg;base64,${announcement.image_data}" alt="${this.escapeHtml(announcement.title)}" style="max-width: 200px; height: auto; margin-top: 10px; border-radius: 8px;">` : ''}
                </div>
                <div class="announcement-meta">
                    <span>Created: ${this.formatDate(announcement.created_at)}</span>
                    <span class="status ${announcement.is_active ? 'active' : 'inactive'}">
                        ${announcement.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    showAnnouncementForm(announcement = null) {
        const container = document.getElementById('announcementFormContainer');
        const form = document.getElementById('announcementForm');
        const editId = document.getElementById('editAnnouncementId');
        
        container.style.display = 'block';
        
        if (announcement) {
            editId.value = announcement.id;
            document.getElementById('announcementTitle').value = announcement.title;
            document.getElementById('announcementContent').value = announcement.content;
        } else {
            editId.value = '';
            form.reset();
        }
        
        container.scrollIntoView({ behavior: 'smooth' });
    }

    hideAnnouncementForm() {
        document.getElementById('announcementFormContainer').style.display = 'none';
        document.getElementById('announcementForm').reset();
    }

    async handleAnnouncementSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('announcementTitle').value;
        const content = document.getElementById('announcementContent').value;
        const imageFile = document.getElementById('announcementImage').files[0];
        const editId = document.getElementById('editAnnouncementId').value;
        const isEdit = !!editId;

        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitButton.disabled = true;

        try {
            let requestData = { title, content };
            
            if (imageFile && !isEdit) {
                // Validate file size (100KB limit)
                if (imageFile.size > 100 * 1024) {
                    throw new Error('Image size must not exceed 100KB');
                }
                
                const imageData = await this.fileToBase64(imageFile);
                requestData.image_data = imageData;
                requestData.image_name = imageFile.name;
            }

            const url = isEdit ? `/api/announcements/${editId}` : '/api/announcements';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save announcement');
            }

            this.showNotification(isEdit ? 'Announcement updated!' : 'Announcement created!', 'success');
            this.hideAnnouncementForm();
            await this.loadAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            this.showNotification(error.message || 'Failed to save announcement', 'error');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async editAnnouncement(announcementId) {
        const announcement = this.announcements.find(a => a.id === announcementId);
        if (announcement) {
            this.showAnnouncementForm(announcement);
        }
    }

    async deleteAnnouncement(announcementId) {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const response = await fetch(`/api/announcements/${announcementId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete announcement');

            this.showNotification('Announcement deleted successfully!', 'success');
            await this.loadAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
            this.showNotification('Failed to delete announcement', 'error');
        }
    }

    // Gallery Management
    async loadGallery() {
        const galleryItemsList = document.getElementById('galleryItemsList');
        
        galleryItemsList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading gallery...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/gallery/all');
            if (!response.ok) throw new Error('Failed to fetch gallery');
            
            this.galleryItems = await response.json();
            this.renderGalleryList();
        } catch (error) {
            console.error('Error loading gallery:', error);
            galleryItemsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load gallery.</p>
                </div>
            `;
        }
    }

    renderGalleryList() {
        const galleryItemsList = document.getElementById('galleryItemsList');
        
        if (this.galleryItems.length === 0) {
            galleryItemsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>No gallery images yet.</p>
                </div>
            `;
            return;
        }

        galleryItemsList.innerHTML = `
            <div class="gallery-admin-grid">
                ${this.galleryItems.map(item => `
                    <div class="gallery-admin-item">
                        <img src="data:image/jpeg;base64,${item.image_data}" alt="${this.escapeHtml(item.title)}">
                        <div class="gallery-admin-overlay">
                            <h5>${this.escapeHtml(item.title)}</h5>
                            <p>${this.escapeHtml(item.description || '')}</p>
                            <div class="gallery-admin-actions">
                                <button class="edit-button" onclick="adminDashboard.editGalleryItem(${item.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="danger-button" onclick="adminDashboard.deleteGalleryItem(${item.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    showGalleryForm() {
        const container = document.getElementById('galleryFormContainer');
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }

    hideGalleryForm() {
        document.getElementById('galleryFormContainer').style.display = 'none';
        document.getElementById('galleryForm').reset();
    }

    async handleGallerySubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('galleryTitle').value;
        const description = document.getElementById('galleryDescription').value;
        const imageFile = document.getElementById('galleryImage').files[0];

        if (!imageFile) {
            this.showNotification('Please select an image', 'error');
            return;
        }

        // Validate file size (100KB limit)
        if (imageFile.size > 100 * 1024) {
            this.showNotification('Image size must not exceed 100KB', 'error');
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitButton.disabled = true;

        try {
            const imageData = await this.fileToBase64(imageFile);
            
            const response = await fetch('/api/gallery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                    image_data: imageData,
                    image_name: imageFile.name
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add gallery item');
            }

            this.showNotification('Image added to gallery!', 'success');
            this.hideGalleryForm();
            await this.loadGallery();
        } catch (error) {
            console.error('Error adding gallery item:', error);
            this.showNotification(error.message || 'Failed to add gallery item', 'error');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async deleteGalleryItem(itemId) {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const response = await fetch(`/api/gallery/${itemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete gallery item');

            this.showNotification('Gallery image deleted successfully!', 'success');
            await this.loadGallery();
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            this.showNotification('Failed to delete gallery item', 'error');
        }
    }

    // Helper function to convert file to base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Logs Management
    async loadLogs() {
        const logsList = document.getElementById('logsList');
        const level = document.getElementById('logLevel').value;
        const category = document.getElementById('logCategory').value;
        const date = document.getElementById('logDate').value;

        logsList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading logs...</p>
            </div>
        `;

        try {
            const response = await fetch(`/api/admin/logs?level=${level}&category=${category}&date=${date}`);
            if (!response.ok) throw new Error('Failed to fetch logs');
            
            const logs = await response.json();
            
            if (logs.length === 0) {
                logsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No logs found for the selected filters</p>
                    </div>
                `;
                return;
            }

            logsList.innerHTML = logs.map(log => `
                <div class="log-entry">
                    <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                    <div class="log-content">
                        <div class="log-message">${this.escapeHtml(log.message)}</div>
                        ${log.details ? `<div class="log-details">${this.escapeHtml(log.details)}</div>` : ''}
                    </div>
                    <span class="log-level ${log.level.toLowerCase()}">${log.level}</span>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading logs:', error);
            logsList.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load logs. Please try again.</p>
                </div>
            `;
        }
    }

    downloadLogs() {
        const level = document.getElementById('logLevel').value;
        const category = document.getElementById('logCategory').value;
        const date = document.getElementById('logDate').value;
        
        window.location.href = `/api/admin/logs/download?level=${level}&category=${category}&date=${date}`;
    }

    initLogsListeners() {
        document.getElementById('logLevel')?.addEventListener('change', () => this.loadLogs());
        document.getElementById('logCategory')?.addEventListener('change', () => this.loadLogs());
        document.getElementById('logDate')?.addEventListener('change', () => this.loadLogs());
        document.getElementById('refreshLogs')?.addEventListener('click', () => this.loadLogs());
        document.getElementById('downloadLogs')?.addEventListener('click', () => this.downloadLogs());
    }
}

// Initialize admin dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Make it globally available for onclick handlers
window.adminDashboard = adminDashboard;
