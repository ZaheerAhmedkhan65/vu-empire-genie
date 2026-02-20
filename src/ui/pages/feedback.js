// ui/pages/feedback.js
import { registerRoute } from "../core/router.js";

registerRoute("feedback", () => {
  const container = document.createElement('div');
  container.classList.add('container', 'app-container');
  container.innerHTML = `
    <div class="fs-1 mb-3">Feedback</div>
    
    <div class="mb-3">
      <p class="text-muted">
        We value your feedback! Help us improve VU Empire Genie by sharing your thoughts and suggestions.
      </p>
    </div>

    <!-- Rating Section -->
    <div class="my-3">
      <div class="card bg-transparent border-0">
        <div class="card-body p-0">
          <h5 class="card-title fs-2">Rate Your Experience</h5>
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center gap-2 w-100" role="group" aria-label="Rating">
              <button type="button" class="btn p-2 bg-transparent" data-rating="1"> 
                <img src="../../assets/svg/star.svg" style="width:30px;"> 
              </button>
              <button type="button" class="btn p-2 bg-transparent" data-rating="2"> 
                <img src="../../assets/svg/star.svg" style="width:30px;"> 
              </button>
              <button type="button" class="btn p-2 bg-transparent" data-rating="3"> 
                <img src="../../assets/svg/star.svg" style="width:30px;"> 
              </button>
              <button type="button" class="btn p-2 bg-transparent" data-rating="4"> 
                <img src="../../assets/svg/star.svg" style="width:30px;"> 
              </button>
              <button type="button" class="btn p-2 bg-transparent" data-rating="5"> 
                <img src="../../assets/svg/star.svg" style="width:30px;"> 
              </button>
            </div>
          </div>
          <small class="text-muted">How would you rate VU Empire Genie?</small>
        </div>
      </div>
    </div>

    <!-- General Feedback Form -->
    <div class="card mb-3 bg-transparent border-0">
      <div class="card-body p-0">
        <h5 class="card-title fs-2 mb-4">General Feedback</h5>
        <form id="generalFeedbackForm">
          <div class="mb-3">
            <label for="feedbackType" class="form-label">Feedback Type</label>
            <select class="form-select" id="feedbackType" required>
              <option value="" disabled selected>Choose...</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="suggestion">Suggestion</option>
              <option value="compliment">Compliment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="mb-3">
            <label for="feedbackMessage" class="form-label">Your Message</label>
            <textarea class="form-control mb-0" id="feedbackMessage" rows="5" placeholder="Please share your thoughts..." required></textarea>
          </div>
          <div class="mb-4">
            <label for="contactEmail" class="form-label">Contact Email (Optional)</label>
            <input type="email" class="form-control" id="contactEmail" placeholder="your.email@example.com">
          </div>
          <div class="d-flex justify-content-center mt-2 mb-3">
            <button type="submit" class="btn btn-primary">Submit Feedback</button>
          </div>
        </form>
      </div>
    </div>

    <div class="alert alert-info mb-0" role="alert">
      We read every message and use your input to make VU Empire Genie better.
    </div>
  `;

  // --- Rating stars handler ---
  const starButtons = container.querySelectorAll('[data-rating]');
  starButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      // Get rating value
      const rating = parseInt(btn.dataset.rating, 10);

      try {
        // Get student ID from sync storage
        const { studentInfo } = await chrome.storage.sync.get(['studentInfo']);
        const userId = studentInfo?.studentId || 'unknown';

        const response = await fetch('https://vu-empire-genie.vercel.app/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating,
            user_id: userId,
            feedback_type: 'rating'
          })
        });

        const result = await response.json();
        if (response.ok && result.success) {
          alerts.show('success','Thank you for your rating!');
        } else {
          alerts.show('error','Failed to submit rating. Please try again.', { bounce: true });
        }
      } catch (error) {
        console.error('Rating submission error:', error);
        alerts.show('error','Network error. Please check your connection.', { bounce: true });
      }
    });
  });

  // --- General feedback form handler ---
  const form = container.querySelector('#generalFeedbackForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const feedbackType = container.querySelector('#feedbackType').value;
    const message = container.querySelector('#feedbackMessage').value.trim();
    const contactEmail = container.querySelector('#contactEmail').value.trim();

    if (!feedbackType || !message) {
      alerts.show('warning','Please select a feedback type and enter a message.', { bounce: true });
      return;
    }

    try {
      const { studentInfo } = await chrome.storage.sync.get(['studentInfo']);
      const userId = studentInfo?.studentId || 'unknown';
      console.log("User ID:", userId);
      const payload = {
        rating: 1,
        user_id: userId,
        feedback_type: feedbackType,
        message: message
      };
      if (contactEmail) {
        payload.contact_email = contactEmail;
      }

      const response = await fetch('https://vu-empire-genie.vercel.app/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alerts.show('success','Feedback submitted successfully!');
        form.reset(); // clear the form
      } else {
        alerts.show('error','Failed to submit feedback. Please try again.', { bounce: true });
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alerts.show('error','Network error. Please check your connection.', { bounce: true });
    }
  });

  return container;
});