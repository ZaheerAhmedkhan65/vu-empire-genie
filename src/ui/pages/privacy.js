import { registerRoute } from "../core/router.js";

registerRoute("privacy", () => {
  const el = document.createElement('div');
    el.innerHTML = `
    <div class="fs-1 mb-2">Privacy</div>
    <p class="text-muted">
      Common questions about VU Empire Genie.
    </p>
  `;

  return el;
});
