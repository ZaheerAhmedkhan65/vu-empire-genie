import { registerRoute } from "../core/router.js";

registerRoute("feedback", () => {
    const container = document.createElement('div');
    container.classList.add('pb-5', 'mb-5');
    container.innerHTML = `
    <div class="fs-1 mb-3">Feedback</div>
    
    <div class="mb-3">
      <p class="text-muted">
        We value your feedback! Help us improve VU Empire Genie by sharing your thoughts and suggestions.
      </p>
    </div>

    <div class="my-3">
      <div class="mb-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title fs-2">Rate Your Experience</h5>
            <div class="mb-3">
              <div class="btn-group" role="group" aria-label="Rating">
                <button type="button" class="btn"> <img src="../../assets/svg/star.svg"> </button>
                <button type="button" class="btn"> <img src="../../assets/svg/star.svg"> </button>
                <button type="button" class="btn"> <img src="../../assets/svg/star.svg"> </button>
                <button type="button" class="btn"> <img src="../../assets/svg/star.svg"> </button>
                <button type="button" class="btn"> <img src="../../assets/svg/star.svg"> </button>
              </div>
            </div>
            <small class="text-muted">How would you rate VU Empire Genie?</small>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title fs-2">General Feedback</h5>
        <form>
          <div class="mb-1">
            <label for="feedbackType" class="form-label">Feedback Type</label>
            <select class="form-select" id="feedbackType">
              <option selected>Choose...</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="suggestion">Suggestion</option>
              <option value="compliment">Compliment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="mb-1">
            <label for="feedbackMessage" class="form-label">Your Message</label>
            <textarea class="form-control mb-0" id="feedbackMessage" rows="5" placeholder="Please share your thoughts..."></textarea>
          </div>
          <div class="mb-1">
            <label for="contactEmail" class="form-label">Contact Email (Optional)</label>
            <input type="email" class="form-control" id="contactEmail" placeholder="your.email@example.com">
          </div>
          <button type="submit" class="btn btn-success">Submit Feedback</button>
        </form>
      </div>
    </div>

    <div class="alert alert-info" role="alert">
      We read every message and use your input to make VU Empire Genie better.
    </div>
  `;
    return container;
});