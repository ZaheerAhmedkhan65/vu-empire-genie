import { registerRoute } from "../core/router.js";

registerRoute("terms", () => {
    const container = document.createElement('div');
  container.classList.add('container','app-container');
    container.innerHTML = `
    <div class="fs-1 mb-3">Terms of Service</div>
    
    <div class="mb-3">
      <p class="text-muted">
        Last updated: January 2026
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">1. Acceptance of Terms</h4>
      <p class="text-muted">
        By using VU Empire Genie, you agree to be bound by these Terms of Service. 
        If you do not agree to these terms, please do not use our extension.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">2. Use License</h4>
      <p class="text-muted mb-1">
        Permission is granted to temporarily download one copy of VU Empire Genie 
        for personal, non-commercial use only. This is the grant of a license, 
        not a transfer of title, and under this license you may not:
      </p>
      <ul class="list-unstyled text-muted">
        <li class="mb-2 list-style-none">• Modify or copy the materials</li>
        <li class="mb-2 list-style-none">• Use the materials for any commercial purpose</li>
        <li class="mb-2 list-style-none">• Attempt to decompile or reverse engineer any software</li>
        <li class="mb-2 list-style-none">• Remove any copyright or other proprietary notations</li>
      </ul>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">3. Disclaimer</h4>
      <p class="text-muted">
        The materials on VU Empire Genie are provided on an 'as is' basis. 
        VU Empire Genie makes no warranties, expressed or implied, and hereby 
        disclaims and negates all other warranties including without limitation, 
        implied warranties or conditions of merchantability, fitness for a 
        particular purpose, or non-infringement of intellectual property rights.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">4. Limitations</h4>
      <p class="text-muted">
        In no event shall VU Empire Genie or its suppliers be liable for any 
        damages (including, without limitation, damages for loss of data or 
        profit, or due to business interruption) arising out of the use or 
        inability to use the materials on VU Empire Genie.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">5. Accuracy of Materials</h4>
      <p class="text-muted">
        The materials appearing on VU Empire Genie may include technical, 
        typographical, or photographic errors. VU Empire Genie does not warrant 
        that any of the materials on its extension are accurate, complete, or current.
      </p>
    </div>

    <div class="mb-3">
      <h4 class="fs-4 mb-2">6. Links</h4>
      <p class="text-muted">
        VU Empire Genie has not reviewed all of the sites linked to its extension 
        and is not responsible for the contents of any such linked site.
      </p>
    </div>

    <div class="mt-0">
      <h4 class="fs-4 mb-2">7. Modifications</h4>
      <p class="text-muted">
        VU Empire Genie may revise these terms of service for its extension at 
        any time without notice. By using this extension you are agreeing to be 
        bound by the then current version of these terms of service.
      </p>
    </div>
  `;
    return container;
});