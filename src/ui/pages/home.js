// ui/pages/home.js
import { registerRoute } from "../core/router.js";

registerRoute("home", () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <div class="mb-3">
      <div id="action-buttons-cont">
        <!-- Action buttons will be added here -->
      </div>
    </div>
  `;

  return container;
});

// Export student info as JSON
// async function exportStudentInfo() {
//   try {
//     const result = await chrome.storage.local.get(['studentInfo']);
//     const studentInfo = result.studentInfo;

//     if (studentInfo) {
//       const json = JSON.stringify(studentInfo, null, 2);
//       const blob = new Blob([json], { type: 'application/json' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `student-info-${studentInfo.studentId || 'unknown'}.json`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
      
//       // Show success message
//       alerts.show('success', 'Student information exported successfully!', { bounce: true });
//     } else {
//       alerts.show('warning', 'No student information available to export', { bounce: true });
//     }
//   } catch (error) {
//     console.error('Error exporting student info:', error);
//     alerts.show('error', 'Failed to export student information', { bounce: true});
//   }
// }
