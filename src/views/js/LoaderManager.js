class LoaderManager {
    constructor() {
        this.activeLoaders = new Map(); // target => loader element
    }

    createLoader(type) {
        const loader = document.createElement('div');
        loader.classList.add('loader');

        switch (type) {
            case 'spinner': loader.innerHTML = '<div class="spinner"></div>'; break;
            case 'dots': loader.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>'; break;
            case 'wave': loader.innerHTML = '<div class="wave"><span></span><span></span><span></span></div>'; break;
            case 'bars': loader.innerHTML = '<div class="bars"><span></span><span></span><span></span><span></span></div>'; break;
            case 'dual-ring': loader.innerHTML = '<div class="dual-ring"></div>'; break;
            case 'glow': loader.innerHTML = '<div class="glow"></div>'; break;
            case 'percentage': loader.innerHTML = '<div class="percentage-wrapper"><div class="progress-bar"><div class="progress-fill"></div></div><div class="percentage-text">0%</div></div>'; break;
            default: console.warn('Unknown loader type'); return null;
        }
        loader.style.position = 'absolute';
        loader.style.top = '50%';
        loader.style.left = '50%';
        loader.style.transform = 'translate(-50%,-50%)';
        return loader;
    }

    show(targetElement, type, options = {}) {
        this.hide(targetElement); // remove existing loader
        const loader = this.createLoader(type);
        if (!loader) return;
        targetElement.appendChild(loader);
        this.activeLoaders.set(targetElement, { loader, type, options });

        // Percentage loader animation
        if (type === 'percentage') {
            const fill = loader.querySelector('.progress-fill');
            const text = loader.querySelector('.percentage-text');
            let percent = 0;
            const speed = options.speed || 30;
            const interval = setInterval(() => {
                percent++;
                if (percent > 100) {
                    clearInterval(interval);
                    if (options.onComplete) options.onComplete();
                } else {
                    fill.style.width = percent + '%';
                    text.textContent = percent + '%';
                }
            }, speed);
            this.activeLoaders.get(targetElement).interval = interval;
        }

        if (options.onStart) options.onStart();
    }

    hide(targetElement) {
        const record = this.activeLoaders.get(targetElement);
        if (record) {
            if (record.interval) clearInterval(record.interval);
            targetElement.removeChild(record.loader);
            this.activeLoaders.delete(targetElement);
        }
    }

    hideAll() {
        for (const [target] of this.activeLoaders) {
            this.hide(target);
        }
    }

    setPercentage(targetElement, value) {
        const record = this.activeLoaders.get(targetElement);
        if (record && record.type === 'percentage') {
            const fill = record.loader.querySelector('.progress-fill');
            const text = record.loader.querySelector('.percentage-text');
            value = Math.min(Math.max(value, 0), 100);
            fill.style.width = value + '%';
            text.textContent = value + '%';
        }
    }
}

// Initialize
const lm = new LoaderManager();