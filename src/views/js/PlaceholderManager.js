export default class PlaceholderManager {
    constructor() {
        this.activePlaceholders = new Map();
    }

    createPlaceholder(type, options = {}) {
        const el = document.createElement('div');

        const map = {
            shimmer: 'placeholder',
            pulse: 'placeholder-pulse',
            wave: 'placeholder-wave',
            stripes: 'placeholder-stripes',
            soft: 'placeholder-soft'
        };

        if (type === 'skeleton-text') {
            el.className = 'skeleton-wrapper';
            const lines = options.lines || 3;
            for (let i = 0; i < lines; i++) {
                const line = document.createElement('div');
                line.className = 'skeleton-line';
                if (options.lastShort && i === lines - 1) {
                    line.style.width = '70%';
                }
                el.appendChild(line);
            }
            return el;
        }

        if (type === 'skeleton-card') {
            el.className = 'skeleton-card';
            el.innerHTML = `
                <div class="skeleton-img"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text" style="width:80%"></div>
            `;
            return el;
        }

        if (!map[type]) {
            console.warn('Unknown placeholder type:', type);
            return null;
        }

        el.className = map[type];
        return el;
    }

    show(target, type, options = {}) {
        this.hide(target);

        const placeholder = this.createPlaceholder(type, options);
        if (!placeholder) return;

        const original = document.createElement('div');
        original.className = 'lm-original';
        original.style.display = 'none';

        while (target.firstChild) {
            original.appendChild(target.firstChild);
        }

        target.style.position ||= 'relative';
        target.appendChild(placeholder);
        target.appendChild(original);

        this.activePlaceholders.set(target, {
            placeholder,
            original
        });
    }

    hide(target) {
        const record = this.activePlaceholders.get(target);
        if (!record) return;

        target.removeChild(record.placeholder);
        record.original.style.display = '';
        this.activePlaceholders.delete(target);
    }

    hideAll() {
        for (const target of this.activePlaceholders.keys()) {
            this.hide(target);
        }
    }
}
