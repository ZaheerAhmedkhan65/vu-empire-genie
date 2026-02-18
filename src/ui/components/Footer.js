// ui/components/Footer.js
const Footer = () => {
    const footer = document.createElement('footer');
    footer.className = 'my-5 bg-primary-subtle pb-5';
    footer.id = 'app-footer'; // Add an ID for easy detection
    footer.innerHTML = `
        <ul class="navbar d-flex py-2 container">
            <div class="col-4 text-center">
                <li>
                    <button class="nav-link border-0 bg-transparent outline-0 text-white" data-route="faq">FAQ</button>
                </li>
                <li>
                    <button class="nav-link border-0 bg-transparent outline-0 text-white" data-route="about">About</button>
                </li>
                <li>
                    <button class="nav-link border-0 bg-transparent outline-0 text-white" data-route="support">Support</button>
                </li>
            </div>
            <div class="col-4 text-center">
                <li>
                    <button class="nav-link border-0 bg-transparent outline-0 text-white" data-route="updates">Updates</button>
                </li>
                <li>
                    <button class="nav-link border-0 bg-transparent outline-0 text-white" data-route="feedback">Feedback</button>
                </li>
            </div>
            <div class="col-4 text-center">
                <li>
                    <button class="nav-link border-0 bg-transparent outline-0 text-white" data-route="terms">Terms</button>
                </li>
                <li>
                    <button class="nav-link border-0 bg-transparent outline-0 text-white" data-route="privacy">Privacy</button>
                </li>
            </div>
        </ul>
        <div class="fs-5 text-center text-muted mt-3">
            Powered by VU Empire • Made with ❤️ for VU Students
        </div>
    `;
    return footer;
};

export default Footer;