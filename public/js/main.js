// Main application functionality for index.html
class ChurchVlogApp {
    constructor() {
        this.videos = [];
        this.currentVideo = null;
        this.modal = null;
        this.sessionTimeout = null;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadVideos();
        await this.loadAnnouncements();
        await this.loadGallery();
        this.setupModal();
        this.initImageCarousel();
        this.initSessionTimeout();
    }

    bindEvents() {
        // Scroll to videos function for hero CTA
        window.scrollToVideos = () => {
            document.getElementById('videosSection').scrollIntoView({ 
                behavior: 'smooth' 
            });
        };

        // Handle video clicks
        document.addEventListener('click', (e) => {
            const videoCard = e.target.closest('.video-card');
            if (videoCard) {
                const videoId = videoCard.dataset.videoId;
                this.openVideoModal(videoId);
            }
        });
    }

    async loadVideos() {
        const videosGrid = document.getElementById('videosGrid');
        
        try {
            const response = await fetch('/api/videos');
            if (!response.ok) throw new Error('Failed to fetch videos');
            
            this.videos = await response.json();
            this.renderVideos();
        } catch (error) {
            console.error('Error loading videos:', error);
            videosGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load videos. Please try again later.</p>
                </div>
            `;
        }
    }

    renderVideos() {
        const videosGrid = document.getElementById('videosGrid');
        
        if (this.videos.length === 0) {
            videosGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-video"></i>
                    <p>No videos available yet. Check back soon for new sermons!</p>
                </div>
            `;
            return;
        }

        videosGrid.innerHTML = this.videos.map(video => `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${this.getVideoThumbnail(video)}" alt="${this.escapeHtml(video.title)}" loading="lazy">
                    <div class="video-play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${this.escapeHtml(video.title)}</h3>
                    <p class="video-description">${this.escapeHtml(video.description || '')}</p>
                    <div class="video-stats">
                        <span>
                            <i class="fas fa-eye"></i>
                            ${this.formatViews(video.views || 0)}
                        </span>
                        <span>
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(video.created_at)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getVideoThumbnail(video) {
        if (video.thumbnail) {
            return video.thumbnail;
        }
        
        if (video.type === 'youtube') {
            // Try to extract YouTube video ID and get thumbnail
            const videoId = this.extractYouTubeId(video.url);
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
        }
        
        // Default church image as fallback
        return 'https://pixabay.com/get/g19f27ae6d6665ef093964663986e560ee7343197bf724b782699380b887a161a86bbcd97fa9a13c340adda4ff0deb7cbefa28802c2b0885364532461d4eacd63_1280.jpg';
    }

    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    setupModal() {
        this.modal = document.getElementById('videoModal');
        const modalClose = document.getElementById('modalClose');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeVideoModal());
        }

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeVideoModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeVideoModal();
            }
        });
    }

    async openVideoModal(videoId) {
        const video = this.videos.find(v => v.id == videoId);
        if (!video) return;

        this.currentVideo = video;

        // Update video view count
        try {
            await fetch(`/api/videos/${videoId}`);
        } catch (error) {
            console.warn('Failed to update view count:', error);
        }

        // Update modal content
        document.getElementById('modalVideoTitle').textContent = video.title;
        document.getElementById('modalVideoDescription').textContent = video.description || '';
        document.getElementById('modalVideoViews').innerHTML = `
            <i class="fas fa-eye"></i> ${this.formatViews(video.views || 0)}
        `;
        document.getElementById('modalVideoDate').innerHTML = `
            <i class="fas fa-calendar"></i> ${this.formatDate(video.created_at)}
        `;

        // Set up video container
        const videoContainer = document.getElementById('modalVideoContainer');
        if (video.type === 'youtube') {
            const youtubeId = this.extractYouTubeId(video.url);
            if (youtubeId) {
                videoContainer.innerHTML = `
                    <iframe 
                        src="https://www.youtube.com/embed/${youtubeId}?autoplay=1" 
                        frameborder="0" 
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
                    </iframe>
                `;
            }
        } else if (video.type === 'mp4') {
            videoContainer.innerHTML = `
                <video controls autoplay>
                    <source src="${video.url}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }

        // Set up comments
        document.getElementById('commentVideoId').value = video.id;
        await window.commentsManager.loadComments(video.id);

        // Show modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeVideoModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Stop video playback
        const videoContainer = document.getElementById('modalVideoContainer');
        videoContainer.innerHTML = '';
        
        this.currentVideo = null;
    }

    formatViews(views) {
        if (views === 0) return '0 views';
        if (views === 1) return '1 view';
        if (views < 1000) return `${views} views`;
        if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`;
        return `${(views / 1000000).toFixed(1)}M views`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return 'Today';
        } else if (diffInDays === 1) {
            return 'Yesterday';
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else if (diffInDays < 365) {
            const months = Math.floor(diffInDays / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initImageCarousel() {
        const images = document.querySelectorAll('.hero-image');
        if (images.length === 0) return;

        let currentIndex = 0;
        
        // Function to show next image
        const showNextImage = () => {
            images[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.add('active');
        };

        // Rotate images every 4 seconds
        setInterval(showNextImage, 4000);
    }

    async loadAnnouncements() {
        const announcementsList = document.getElementById('publicAnnouncementsList');
        
        try {
            const response = await fetch('/api/announcements');
            if (!response.ok) throw new Error('Failed to fetch announcements');
            
            const announcements = await response.json();
            this.renderAnnouncements(announcements);
        } catch (error) {
            console.error('Error loading announcements:', error);
            announcementsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <p>No announcements at this time.</p>
                </div>
            `;
        }
    }

    renderAnnouncements(announcements) {
        const announcementsList = document.getElementById('publicAnnouncementsList');
        
        if (announcements.length === 0) {
            announcementsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bullhorn"></i>
                    <p>No announcements at this time.</p>
                </div>
            `;
            return;
        }

        announcementsList.innerHTML = announcements.slice(0, 3).map(announcement => `
            <div class="announcement-card">
                <div class="announcement-content">
                    <h3>${this.escapeHtml(announcement.title)}</h3>
                    <p>${this.escapeHtml(announcement.content)}</p>
                    ${announcement.image_data ? `<img src="data:image/jpeg;base64,${announcement.image_data}" alt="${this.escapeHtml(announcement.title)}">` : ''}
                </div>
                <div class="announcement-date">
                    <i class="fas fa-calendar"></i>
                    ${this.formatDate(announcement.created_at)}
                </div>
            </div>
        `).join('');
    }

    async loadGallery() {
        const galleryGrid = document.getElementById('publicGalleryGrid');
        
        try {
            const response = await fetch('/api/gallery');
            if (!response.ok) throw new Error('Failed to fetch gallery');
            
            const galleryItems = await response.json();
            this.renderGallery(galleryItems);
        } catch (error) {
            console.error('Error loading gallery:', error);
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>No gallery images available yet.</p>
                </div>
            `;
        }
    }

    renderGallery(galleryItems) {
        const galleryGrid = document.getElementById('publicGalleryGrid');
        
        if (galleryItems.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>No gallery images available yet.</p>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = galleryItems.map(item => `
            <div class="gallery-item" onclick="this.openGalleryModal('${item.id}')">
                <img src="data:image/jpeg;base64,${item.image_data}" alt="${this.escapeHtml(item.title)}" loading="lazy">
                <div class="gallery-overlay">
                    <h4>${this.escapeHtml(item.title)}</h4>
                    ${item.description ? `<p>${this.escapeHtml(item.description)}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChurchVlogApp();
});

// Add some additional styles for empty states and error messages
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
    }

    .empty-state i {
        font-size: 4rem;
        color: var(--accent-primary);
        margin-bottom: 20px;
    }

    .empty-state p {
        font-size: 1.2rem;
        margin: 0;
    }

    .error-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: var(--error);
    }

    .error-message i {
        font-size: 3rem;
        margin-bottom: 15px;
    }

    .error-message p {
        font-size: 1.1rem;
        margin: 0;
    }

    .video-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .video-card:hover {
        transform: translateY(-5px);
    }

    @media (max-width: 768px) {
        .videos-grid {
            grid-template-columns: 1fr;
        }
        
        .empty-state i {
            font-size: 3rem;
        }
        
        .empty-state p {
            font-size: 1rem;
        }
    }
`;
document.head.appendChild(additionalStyles);
