class AlertManager {
    constructor(containerId = 'alertContainer', defaultDuration = 4000) {
        this.container = document.getElementById(containerId);
        this.defaultDuration = defaultDuration;
    }

    show(type = 'info', message = '', options = {}) {
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        if (options.bounce) alert.style.animation = 'slideIn 0.5s forwards, bounce 0.5s 1';
        alert.innerHTML = `
            ${options.icon ? `<span class="icon">${options.icon}</span>` : ''}
            <span class="message">${message}</span>
            <span class="close-btn">&times;</span>
        `;

        // Close button
        alert.querySelector('.close-btn').onclick = () => this.hide(alert);

        // Append to container
        this.container.appendChild(alert);

        // Auto-dismiss
        const duration = options.duration || this.defaultDuration;
        const timeout = setTimeout(() => this.hide(alert), duration);

        // Optional callbacks
        if (options.onShow) options.onShow(alert);

        // Store timeout to allow clearing if needed
        alert._timeout = timeout;
    }

    hide(alert) {
        if (alert._timeout) clearTimeout(alert._timeout);
        alert.style.animation = 'slideOut 0.5s forwards';
        setTimeout(() => alert.remove(), 500);
    }

    hideAll() {
        const alerts = this.container.querySelectorAll('.alert');
        alerts.forEach(alert => this.hide(alert));
    }
}

// Initialize
const alerts = new AlertManager();