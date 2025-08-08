// Device fingerprinting utility
class DeviceFingerprint {
    constructor() {
        this.fingerprint = null;
        this.generateFingerprint();
    }

    async generateFingerprint() {
        try {
            const components = await this.collectComponents();
            const fingerprintString = JSON.stringify(components);
            this.fingerprint = await this.hashString(fingerprintString);
            return this.fingerprint;
        } catch (error) {
            console.warn('Failed to generate device fingerprint:', error);
            // Fallback to a basic fingerprint
            this.fingerprint = this.generateFallbackFingerprint();
            return this.fingerprint;
        }
    }

    async collectComponents() {
        const components = {};

        // Screen information
        components.screen = {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth
        };

        // Timezone
        components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // Language
        components.language = navigator.language;
        components.languages = navigator.languages;

        // Platform
        components.platform = navigator.platform;
        components.userAgent = navigator.userAgent;

        // Hardware concurrency
        components.hardwareConcurrency = navigator.hardwareConcurrency;

        // Device memory (if available)
        if ('deviceMemory' in navigator) {
            components.deviceMemory = navigator.deviceMemory;
        }

        // Canvas fingerprint
        components.canvas = await this.getCanvasFingerprint();

        // WebGL fingerprint
        components.webgl = this.getWebGLFingerprint();

        // Audio context fingerprint
        components.audio = await this.getAudioFingerprint();

        return components;
    }

    async getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 200;
            canvas.height = 50;
            
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Church Vlog Fingerprint', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Church Vlog Fingerprint', 4, 17);
            
            return canvas.toDataURL();
        } catch (error) {
            return 'canvas_error';
        }
    }

    getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'no_webgl';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            return {
                vendor,
                renderer,
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
            };
        } catch (error) {
            return 'webgl_error';
        }
    }

    async getAudioFingerprint() {
        try {
            if (!window.AudioContext && !window.webkitAudioContext) {
                return 'no_audio_context';
            }

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContext();
            let isCleanedUp = false;

            const cleanup = () => {
                if (!isCleanedUp) {
                    isCleanedUp = true;
                    oscillator.stop();
                    scriptProcessor.disconnect();
                    if (context.state !== 'closed') {
                        context.close();
                    }
                }
            };
            
            const oscillator = context.createOscillator();
            const analyser = context.createAnalyser();
            const gain = context.createGain();
            const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
            
            gain.gain.value = 0;
            oscillator.type = 'triangle';
            oscillator.frequency.value = 10000;
            
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gain);
            gain.connect(context.destination);
            
            oscillator.start(0);
            
            return new Promise((resolve) => {
                let sample = 0;
                scriptProcessor.onaudioprocess = (event) => {
                    const buffer = event.inputBuffer.getChannelData(0);
                    let sum = 0;
                    for (let i = 0; i < buffer.length; i++) {
                        sum += Math.abs(buffer[i]);
                    }
                    
                    sample = sum;
                    cleanup();
                    resolve(sample.toString());
                };
                
                // Fallback timeout
                setTimeout(() => {
                    cleanup();
                    resolve('audio_timeout');
                }, 1000);
            });
        } catch (error) {
            return 'audio_error';
        }
    }

    async hashString(str) {
        if (crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } else {
            // Fallback simple hash for older browsers
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16);
        }
    }

    generateFallbackFingerprint() {
        const components = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.platform
        ].join('|');
        
        // Simple hash
        let hash = 0;
        for (let i = 0; i < components.length; i++) {
            const char = components.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(16);
    }

    getFingerprint() {
        return this.fingerprint;
    }
}

// Global instance
window.deviceFingerprint = new DeviceFingerprint();

// Export for use in other modules
window.DeviceFingerprint = DeviceFingerprint;
