// scripts/content_student_info.js
// Content script for extracting student information from VU LMS pages

// Function to extract and send student info
async function extractAndSendStudentInfo() {
  try {
    console.log("extracting info")
    // Get existing data from storage
    const storedData = await chrome.storage.local.get(['studentInfo']);
    const existingInfo = storedData.studentInfo || {};

    // Extract current page info
    const currentInfo = await extractStudentInfo();

    if (currentInfo && (currentInfo.name || currentInfo.studentId)) {
      // Merge existing and current data intelligently
      const mergedInfo = mergeStudentInfo(existingInfo, currentInfo);

      console.log('Merged student info:', mergedInfo);

      // Send to background script
      chrome.runtime.sendMessage({
        type: 'EXTRACT_STUDENT_INFO',
        studentInfo: mergedInfo
      }, (response) => {
        if (response && response.success) {
          console.log('Student info saved successfully');
        } else {
          console.warn('Failed to save student info:', response?.error);
        }
      });

      // Also store in local storage for quick access
      await chrome.storage.local.set({
        studentInfo: mergedInfo,
        lastExtracted: new Date().toISOString()
      });

      return mergedInfo;
    }
  } catch (error) {
    console.error('Error extracting student info:', error);
  }
  return null;
}

// Intelligent merge function
function mergeStudentInfo(existing, current) {
  const merged = { ...existing };

  // Always update metadata
  merged.timestamp = new Date().toISOString();
  merged.extractedFrom = current.extractedFrom || existing.extractedFrom;
  merged.pageUrl = current.pageUrl || existing.pageUrl;

  // Update basic info if current has better data
  if (current.name && !existing.name) merged.name = current.name;
  if (current.studentId && !existing.studentId) merged.studentId = current.studentId;
  if (current.program && !existing.program) merged.program = current.program;
  if (current.profileImage && !existing.profileImage) merged.profileImage = current.profileImage;

  // Update profile-specific info (only from profile page)
  if (current.extractedFrom === 'profile') {
    // Student Profile section
    if (current.formNo) merged.formNo = current.formNo;
    if (current.registrationNumber) merged.registrationNumber = current.registrationNumber;
    if (current.studyProgram) merged.studyProgram = current.studyProgram;
    if (current.admissionDate) merged.admissionDate = current.admissionDate;
    if (current.studyStatus) merged.studyStatus = current.studyStatus;
    if (current.currentSemester) merged.currentSemester = current.currentSemester;

    // Personal Information section
    if (current.fatherName) merged.fatherName = current.fatherName;
    if (current.gender) merged.gender = current.gender;
    if (current.dateOfBirth) merged.dateOfBirth = current.dateOfBirth;
    if (current.cnic) merged.cnic = current.cnic;
    if (current.permanentAddress) merged.permanentAddress = current.permanentAddress;
    if (current.mailingAddress) merged.mailingAddress = current.mailingAddress;
    if (current.personalEmail) merged.personalEmail = current.personalEmail;
    if (current.phone) merged.phone = current.phone;
    if (current.mobile) merged.mobile = current.mobile;
    if (current.vuEmail) merged.vuEmail = current.vuEmail;

    // Academic History section
    if (current.matricMarks) merged.matricMarks = current.matricMarks;
    if (current.matricTotal) merged.matricTotal = current.matricTotal;
    if (current.interMarks) merged.interMarks = current.interMarks;
    if (current.interTotal) merged.interTotal = current.interTotal;
    if (current.bachelorDegree) merged.bachelorDegree = current.bachelorDegree;
    if (current.bachelorMarks) merged.bachelorMarks = current.bachelorMarks;
    if (current.bachelorTotal) merged.bachelorTotal = current.bachelorTotal;
    if (current.masterDegree) merged.masterDegree = current.masterDegree;
    if (current.masterMarks) merged.masterMarks = current.masterMarks;
    if (current.masterTotal) merged.masterTotal = current.masterTotal;
  }

  // Update course info (only from home page, and only if we have new data)
  if (current.extractedFrom === 'home') {
    // Always update semester from home page
    if (current.semester) merged.semester = current.semester;

    // Update courses only if we have new courses data
    if (current.courses && current.courses.length > 0) {
      merged.courses = current.courses;
      merged.totalCourses = current.courses.length;

      // Calculate total credits
      merged.totalCredits = current.courses.reduce((total, course) => {
        if (course.credits) {
          const creditsMatch = course.credits.match(/(\d+)/);
          return total + (creditsMatch ? parseInt(creditsMatch[1]) : 0);
        }
        return total;
      }, 0);
    }
  }

  // If we're on a different page, preserve existing courses if we have them
  if (current.extractedFrom !== 'home' && existing.courses && existing.courses.length > 0) {
    merged.courses = existing.courses;
    merged.totalCourses = existing.totalCourses;
    merged.totalCredits = existing.totalCredits;

    // Also preserve semester from existing data if current page doesn't have it
    if (!merged.semester && existing.semester) {
      merged.semester = existing.semester;
    }
  }

  // Clean up undefined/null/empty values
  Object.keys(merged).forEach(key => {
    if (merged[key] === null || merged[key] === undefined ||
      merged[key] === '' ||
      (Array.isArray(merged[key]) && merged[key].length === 0)) {
      delete merged[key];
    }
  });

  return merged;
}

// Check if we're on the right pages
function shouldExtractInfo() {
  const currentUrl = window.location.href;
  const currentPath = window.location.pathname;

  // Check for home page with specific ID or general home page
  const isHomePage = currentUrl.includes('Home.aspx') ||
    currentUrl.includes('id=924d258e-def8-4459-92c1-6727e9129cc4') ||
    currentPath.includes('Home.aspx');

  // Check for student profile page
  const isProfilePage = currentPath.includes('StudentProfile.aspx');

  return isHomePage || isProfilePage;
}

// Listen for messages from background or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STUDENT_INFO') {
    chrome.storage.local.get(['studentInfo'], (result) => {
      sendResponse({
        success: true,
        studentInfo: result.studentInfo || {},
        hasData: !!result.studentInfo
      });
    });
    return true;
  }

  if (request.type === 'EXTRACT_NOW') {
    extractAndSendStudentInfo().then(studentInfo => {
      sendResponse({ success: true, studentInfo });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (request.type === 'EXPORT_STUDENT_INFO') {
    chrome.storage.local.get(['studentInfo'], (result) => {
      if (result.studentInfo) {
        sendResponse({
          success: true,
          json: JSON.stringify(result.studentInfo, null, 2)
        });
      } else {
        sendResponse({
          success: false,
          error: 'No student info found. Please extract data first.'
        });
      }
    });
    return true;
  }

  if (request.type === 'CLEAR_STUDENT_INFO') {
    chrome.storage.local.remove(['studentInfo'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Initialize based on page load
function initialize() {
  if (shouldExtractInfo()) {
    // Wait for dynamic content to load
    const checkInterval = setInterval(() => {
      if (document.readyState === 'complete') {
        clearInterval(checkInterval);

        // Wait additional time for dynamic content
        setTimeout(() => {
          extractAndSendStudentInfo();
        }, 1500);

        // Also set up observer for dynamic updates
        setupMutationObserver();
      }
    }, 100);
  }
}

// Setup observer for single page app navigation
function setupMutationObserver() {
  let currentUrl = window.location.href;

  const observer = new MutationObserver(() => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl && shouldExtractInfo()) {
      currentUrl = newUrl;
      setTimeout(() => {
        extractAndSendStudentInfo();
      }, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Export for debugging
window.extractVUStudentInfo = async () => {
  const result = await extractAndSendStudentInfo();
  return result;
};

// Extract student info (keep the existing implementation)
async function extractStudentInfo() {
  try {
    const extractor = new StudentInfoExtractor();
    return extractor.getStudentInfo();
  } catch (error) {
    console.error('Error creating extractor:', error);
    // Fallback to basic extraction
    return extractStudentInfoBasic();
  }
}

// Fallback basic extraction function
function extractStudentInfoBasic() {
  const studentInfo = {};

  // Extract basic info from header
  const headerSpan = document.querySelector('span.m-nav__link-text');
  if (headerSpan) {
    const text = headerSpan.textContent.trim();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length >= 2) {
      studentInfo.name = lines[0];
      const idMatch = lines[1].match(/\(([^)]+)\)/);
      if (idMatch) {
        studentInfo.studentId = idMatch[1].toUpperCase();
      }
    }
  }

  // Extract from profile dropdown
  const dropdownName = document.querySelector('.m-card-user__name');
  if (dropdownName) {
    studentInfo.name = dropdownName.textContent.trim() || studentInfo.name;
  }

  const dropdownEmail = document.querySelector('.m-card-user__email');
  if (dropdownEmail) {
    studentInfo.program = dropdownEmail.textContent.trim();
  }

  // Extract profile image
  const profileImg = document.querySelector('img[src*="GridImageTemplate.aspx"]');
  if (profileImg) {
    studentInfo.profileImage = profileImg.src;
    studentInfo.profileImageAlt = profileImg.alt || studentInfo.studentId || '';
  }

  // Add metadata
  studentInfo.timestamp = new Date().toISOString();
  studentInfo.pageUrl = window.location.href;
  studentInfo.extractedFrom = window.location.pathname.includes('StudentProfile.aspx') ? 'profile' :
    (window.location.href.includes('Home.aspx') ? 'home' : 'other');

  return studentInfo;
}

// Keep the StudentInfoExtractor class as is...
class StudentInfoExtractor {
  constructor() {
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000;
  }

  getStudentInfo() {
    const cacheKey = 'studentInfo';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const info = this.extractComprehensiveInfo();
    this.saveToCache(cacheKey, info);
    return info;
  }

  extractComprehensiveInfo() {
    const info = {
      basicInfo: this.extractBasicInfo(),
      profileInfo: this.extractProfilePageInfo(),
      courseInfo: this.extractCourseInfo(),
      timestamp: new Date().toISOString(),
      pageType: this.detectPageType(),
      pageUrl: window.location.href
    };
    return this.mergeInfo(info);
  }

  extractBasicInfo() {
    const basicInfo = {};
    const headerSpan = document.querySelector('span.m-nav__link-text');
    if (headerSpan) {
      const text = headerSpan.textContent.trim();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length >= 2) {
        basicInfo.name = lines[0];
        const idMatch = lines[1].match(/\(([^)]+)\)/);
        if (idMatch) basicInfo.studentId = idMatch[1].toUpperCase();
      }
    }

    const dropdownName = document.querySelector('.m-card-user__name');
    if (dropdownName) basicInfo.name = dropdownName.textContent.trim() || basicInfo.name;

    const dropdownEmail = document.querySelector('.m-card-user__email');
    if (dropdownEmail) basicInfo.program = dropdownEmail.textContent.trim();

    const profileImg = document.querySelector('img[src*="GridImageTemplate.aspx"]');
    if (profileImg) {
      basicInfo.profileImage = profileImg.src;
      basicInfo.profileImageAlt = profileImg.alt || basicInfo.studentId || '';
    }

    return basicInfo;
  }

  extractProfilePageInfo() {
    if (!this.isProfilePage()) return {};

    const profileInfo = {};

    // Student Profile
    profileInfo.formNo = this.getTextContentById('MainContent_lblFormNo');
    profileInfo.registrationNumber = this.getTextContentById('MainContent_lblRegNo');
    profileInfo.studyProgram = this.getTextContentById('MainContent_lblStudyPro');
    profileInfo.admissionDate = this.getTextContentById('MainContent_lblAddDate');
    profileInfo.studyStatus = this.getTextContentById('MainContent_lblCampus');
    profileInfo.currentSemester = this.getTextContentById('MainContent_lblCurSemester');

    // Personal Information
    profileInfo.fatherName = this.getTextContentById('MainContent_lblFather');
    profileInfo.gender = this.getTextContentById('MainContent_lblGender');
    profileInfo.dateOfBirth = this.getTextContentById('MainContent_lblBirthDate');
    profileInfo.cnic = this.getTextContentById('MainContent_lblCNIC');
    profileInfo.permanentAddress = this.getTextAreaValue('MainContent_txtPAddress');
    profileInfo.mailingAddress = this.getTextAreaValue('MainContent_txtMAddress');
    profileInfo.personalEmail = this.getInputValue('MainContent_txtStdEmail');
    profileInfo.phone = this.getInputValue('MainContent_txtPhone');
    profileInfo.mobile = this.getInputValue('MainContent_txtMobileNo');

    // Academic History
    profileInfo.matricMarks = this.getTextContentById('MainContent_lblMatric');
    profileInfo.matricTotal = this.getTextContentById('MainContent_lblTotalMatric');
    profileInfo.interMarks = this.getTextContentById('MainContent_lblInter');
    profileInfo.interTotal = this.getTextContentById('MainContent_lblTotalInter');
    profileInfo.bachelorDegree = this.getTextContentById('MainContent_lblBachelorDeg');
    profileInfo.bachelorMarks = this.getTextContentById('MainContent_lblBachMarks');
    profileInfo.bachelorTotal = this.getTextContentById('MainContent_lblTotalBach');
    profileInfo.masterDegree = this.getTextContentById('MainContent_lblMasterDeg');
    profileInfo.masterMarks = this.getTextContentById('MainContent_lblMasterMarks');
    profileInfo.masterTotal = this.getTextContentById('MainContent_lblMasterTotal');

    // VU Email
    const vuEmailElement = document.getElementById('MainContent_lblVuEmail');
    if (vuEmailElement) profileInfo.vuEmail = vuEmailElement.textContent.trim();

    return profileInfo;
  }

  extractCourseInfo() {
    if (!this.isHomePage()) return {};

    const courseInfo = {
      currentSemester: '',
      courses: []
    };

    // Extract semester
    const semesterSpan = document.querySelector('span.text-capitalize.text-primary');
    if (semesterSpan) {
      courseInfo.currentSemester = semesterSpan.textContent.trim();
    }

    // Extract courses
    const courseElements = document.querySelectorAll('.m-portlet');
    courseElements.forEach((course) => {
      const courseData = this.extractCourseData(course);
      if (courseData.code) {
        courseInfo.courses.push(courseData);
      }
    });

    return courseInfo;
  }

  extractCourseData(courseElement) {
    const courseData = {
      code: '',
      title: '',
      fullTitle: '',
      credits: '',
      instructor: '',
      qualification: '',
      currentLesson: '',
      category: ''
    };

    // Extract course code and title
    const h3Element = courseElement.querySelector('h3.m-portlet__head-text');
    if (h3Element) {
      const titleText = h3Element.textContent.trim();
      // Clean up the title text
      const cleanedText = titleText.replace(/\s+/g, ' ').trim();
      const parts = cleanedText.split(' - ');
      if (parts.length >= 2) {
        courseData.code = parts[0].trim();
        // Take only the first line for title
        const titleParts = parts[1].split('\n');
        courseData.title = titleParts[0].trim();
        courseData.fullTitle = cleanedText;
      } else {
        courseData.code = cleanedText;
      }
    }

    // Extract other details
    courseData.credits = this.getTextFromSelector(courseElement, 'span[id*="lblCourseCredits_"]');
    courseData.instructor = this.getTextFromSelector(courseElement, 'span[id*="lblinstructor_"]');
    courseData.qualification = this.getTextFromSelector(courseElement, 'span[id*="lblInstructorQualification_"]');
    courseData.currentLesson = this.getTextFromSelector(courseElement, 'span[id*="lblCurrentLessonNo_"]');
    courseData.category = this.getTextFromSelector(courseElement, 'span[id*="lblCategory_"]');

    return courseData;
  }

  // Helper methods
  getTextContentById(id) {
    const element = document.getElementById(id);
    return element ? element.textContent.trim() : '';
  }

  getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  getTextAreaValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  getTextFromSelector(element, selector) {
    const found = element.querySelector(selector);
    return found ? found.textContent.trim() : '';
  }

  isProfilePage() {
    return window.location.pathname.includes('StudentProfile.aspx');
  }

  isHomePage() {
    const url = window.location.href;
    return url.includes('Home.aspx') || url.includes('id=924d258e-def8-4459-92c1-6727e9129cc4');
  }

  detectPageType() {
    if (this.isProfilePage()) return 'profile';
    if (this.isHomePage()) return 'home';
    return 'other';
  }

  mergeInfo(info) {
    const merged = {
      name: info.basicInfo.name || '',
      studentId: info.basicInfo.studentId || '',
      program: info.basicInfo.program || '',
      profileImage: info.basicInfo.profileImage || '',
      ...info.profileInfo,
      semester: info.courseInfo.currentSemester || '',
      courses: info.courseInfo.courses || [],
      extractedFrom: info.pageType,
      timestamp: info.timestamp,
      pageUrl: info.pageUrl
    };

    // Clean up courses data
    if (merged.courses && merged.courses.length > 0) {
      merged.courses = merged.courses.map(course => {
        // Clean up title and fullTitle
        if (course.title) {
          course.title = course.title.replace(/\s+/g, ' ').trim();
        }
        if (course.fullTitle) {
          course.fullTitle = course.fullTitle.replace(/\s+/g, ' ').trim();
        }
        return course;
      });
      merged.totalCourses = merged.courses.length;
    }

    return merged;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  saveToCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}