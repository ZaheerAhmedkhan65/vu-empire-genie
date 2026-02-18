//views/js/appView.js
export const appView = document.querySelector("#app-view");
setTimeout(() => {
    initializeStudentInfo();
}, 0);

function initializeStudentInfo() {
    // Load student info on page load
    loadStudentInfo();
}

// Load student info from storage
async function loadStudentInfo() {
    try {
        const result = await chrome.storage.local.get(['studentInfo']);
        const studentInfo = result.studentInfo;

        if (studentInfo) {
            displayStudentInfo(studentInfo);
        }
    } catch (error) {
        console.error('Error loading student info:', error);
    }
}

function displayStudentInfo(studentInfo) {
    const studentProfile = document.querySelector("#student-profile");
    const profileImages = document.querySelectorAll('.student-profile-image');

    // Set profile image
    if (studentInfo.profileImage) {
        profileImages.forEach(img => {
            img.src = studentInfo.profileImage;
            img.style.display = 'block';
        });
        studentProfile.innerHTML = `<img alt="Student Profile" src="${studentInfo.profileImage}" class="rounded-circle" width="45" height="45">`;
    } else {
        profileImages.forEach(img => {
            img.style.display = 'none';
        });
        studentProfile.innerHTML = '';
    }
}