// Comments management
class CommentsManager {
    constructor() {
        this.currentVideoId = null;
        this.bindEvents();
    }

    bindEvents() {
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        }
    }

    async loadComments(videoId) {
        this.currentVideoId = videoId;
        const commentsList = document.getElementById('commentsList');
        
        if (!commentsList) return;

        commentsList.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading comments...</p>
            </div>
        `;

        try {
            const response = await fetch(`/api/comments/video/${videoId}`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            
            const comments = await response.json();
            this.renderComments(comments);
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load comments. Please try again later.</p>
                </div>
            `;
        }
    }

    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        
        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${this.escapeHtml(comment.commenter_name)}</span>
                    <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
            </div>
        `).join('');
    }

    async handleCommentSubmit(e) {
        e.preventDefault();
        
        const commenterName = document.getElementById('commenterName').value.trim();
        const commentContent = document.getElementById('commentContent').value.trim();
        const videoId = this.currentVideoId;

        if (!commenterName || !commentContent || !videoId) {
            this.showError('Please fill in all fields');
            return;
        }

        // Wait for device fingerprint to be ready
        const fingerprint = await this.getDeviceFingerprint();

        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_id: videoId,
                    commenter_name: commenterName,
                    content: commentContent,
                    device_fingerprint: fingerprint
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to post comment');
            }

            // Clear form
            document.getElementById('commenterName').value = '';
            document.getElementById('commentContent').value = '';

            // Reload comments
            await this.loadComments(videoId);

            this.showSuccess('Comment posted successfully!');
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showError(error.message || 'Failed to post comment. Please try again.');
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    async getDeviceFingerprint() {
        if (window.deviceFingerprint && window.deviceFingerprint.getFingerprint()) {
            return window.deviceFingerprint.getFingerprint();
        }

        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (window.deviceFingerprint) {
            return await window.deviceFingerprint.generateFingerprint();
        }

        // Fallback fingerprint
        return 'fallback_' + Date.now();
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        // Add notification styles
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

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutToRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInFromRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutToRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--text-secondary);
    }

    .empty-state i {
        font-size: 3rem;
        color: var(--accent-primary);
        margin-bottom: 15px;
    }

    .error-message {
        text-align: center;
        padding: 40px;
        color: var(--error);
    }

    .error-message i {
        font-size: 2rem;
        margin-bottom: 10px;
    }
`;
document.head.appendChild(notificationStyles);

// Initialize comments manager
window.commentsManager = new CommentsManager();

// Export for use in other modules
window.CommentsManager = CommentsManager;
