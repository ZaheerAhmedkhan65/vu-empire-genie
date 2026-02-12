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
    console.log('Displaying student info:', studentInfo);
    const profileImage = document.getElementById('student-profile-image');
    const studentId = document.getElementById('student-id');
    const studentName = document.getElementById('student-name');

    // Set profile image
    if (studentInfo.profileImage) {
        profileImage.src = studentInfo.profileImage;
    } else {
        profileImage.style.display = 'none';
    }

    // Set student details
    studentId.textContent = studentInfo.studentId || 'Not available';
    studentName.textContent = studentInfo.name || 'Not available';

}