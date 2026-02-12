// scripts/readers/user_info.js
// Enhanced API for cross-page student info extraction
class StudentInfoExtractor {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }

    // Get student info from current page
    getStudentInfo() {
        const cacheKey = 'studentInfo';
        const cached = this.getFromCache(cacheKey);

        if (cached) {
            return cached;
        }

        const info = this.extractComprehensiveInfo();
        this.saveToCache(cacheKey, info);
        return info;
    }

    // Extract comprehensive info from all available sources
    extractComprehensiveInfo() {
        const info = {
            basicInfo: this.extractBasicInfo(),
            profileInfo: this.extractProfilePageInfo(),
            courseInfo: this.extractCourseInfo(),
            timestamp: new Date().toISOString(),
            pageType: this.detectPageType()
        };

        // Merge and deduplicate information
        return this.mergeInfo(info);
    }

    // Extract basic info available on all pages
    extractBasicInfo() {
        const basicInfo = {};

        // Method 1: From header (available on all pages)
        const headerSpan = document.querySelector('span.m-nav__link-text');
        if (headerSpan) {
            const text = headerSpan.textContent.trim();
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length >= 2) {
                basicInfo.name = lines[0];
                const idMatch = lines[1].match(/\(([^)]+)\)/);
                if (idMatch) {
                    basicInfo.studentId = idMatch[1].toUpperCase();
                }
            }
        }

        // Method 2: From profile dropdown
        const dropdownName = document.querySelector('.m-card-user__name');
        if (dropdownName) {
            basicInfo.name = dropdownName.textContent.trim() || basicInfo.name;
        }

        const dropdownEmail = document.querySelector('.m-card-user__email');
        if (dropdownEmail) {
            basicInfo.program = dropdownEmail.textContent.trim();
        }

        // Method 3: From profile image
        const profileImg = document.querySelector('img[src*="GridImageTemplate.aspx"]');
        if (profileImg) {
            basicInfo.profileImage = profileImg.src;
            basicInfo.profileImageAlt = profileImg.alt || basicInfo.studentId || '';
        }

        return basicInfo;
    }

    // Extract info specifically from profile page
    extractProfilePageInfo() {
        if (!this.isProfilePage()) {
            return {};
        }

        const profileInfo = {};

        // Extract Student Profile section
        profileInfo.formNo = this.getTextContentById('MainContent_lblFormNo');
        profileInfo.registrationNumber = this.getTextContentById('MainContent_lblRegNo');
        profileInfo.studyProgram = this.getTextContentById('MainContent_lblStudyPro');
        profileInfo.admissionDate = this.getTextContentById('MainContent_lblAddDate');
        profileInfo.studyStatus = this.getTextContentById('MainContent_lblCampus');
        profileInfo.currentSemester = this.getTextContentById('MainContent_lblCurSemester');

        // Extract Personal Information section
        profileInfo.fatherName = this.getTextContentById('MainContent_lblFather');
        profileInfo.gender = this.getTextContentById('MainContent_lblGender');
        profileInfo.dateOfBirth = this.getTextContentById('MainContent_lblBirthDate');
        profileInfo.cnic = this.getTextContentById('MainContent_lblCNIC');
        profileInfo.permanentAddress = this.getTextAreaValue('MainContent_txtPAddress');
        profileInfo.mailingAddress = this.getTextAreaValue('MainContent_txtMAddress');
        profileInfo.personalEmail = this.getInputValue('MainContent_txtStdEmail');
        profileInfo.phone = this.getInputValue('MainContent_txtPhone');
        profileInfo.mobile = this.getInputValue('MainContent_txtMobileNo');

        // Extract Academic History section
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

        // Get VU Email from profile card
        const vuEmailElement = document.getElementById('MainContent_lblVuEmail');
        if (vuEmailElement) {
            profileInfo.vuEmail = vuEmailElement.textContent.trim();
        }

        // Get full name and ID from profile card
        const stdNameElement = document.getElementById('MainContent_lblStdName');
        if (stdNameElement) {
            profileInfo.fullName = stdNameElement.textContent.trim();
        }

        const stdIdElement = document.getElementById('MainContent_lblStdId');
        if (stdIdElement) {
            profileInfo.studentId = stdIdElement.textContent.trim().toUpperCase();
        }

        return profileInfo;
    }

    // Extract course info from home page
    extractCourseInfo() {
        if (!this.isHomePage()) {
            return {};
        }

        const courseInfo = {
            currentSemester: '',
            courses: []
        };

        // Extract semester from title
        const titleElement = document.querySelector('.m-subheader__title span.text-primary');
        if (titleElement) {
            courseInfo.currentSemester = titleElement.textContent.trim();
        }

        // Alternative: Get semester from h3 element
        if (!courseInfo.currentSemester) {
            const semesterSpan = document.querySelector('span.text-capitalize.text-primary');
            if (semesterSpan) {
                courseInfo.currentSemester = semesterSpan.textContent.trim();
            }
        }

        // Extract courses from home page
        const courseElements = document.querySelectorAll('.m-portlet');
        courseElements.forEach((course, index) => {
            const courseData = {
                code: '',
                title: '',
                fullTitle: '',
                credits: '',
                instructor: '',
                qualification: '',
                currentLesson: '',
                assignments: '',
                gdb: '',
                quiz: '',
                activity: '',
                announcements: ''
            };

            // Extract course code and title from h3
            const titleElement = course.querySelector('.m-portlet__head-text');
            if (titleElement) {
                const h3Element = titleElement.querySelector('h3.m-portlet__head-text');
                if (h3Element) {
                    const titleText = h3Element.textContent.trim();
                    // Format: "CS205 - Information Security"
                    const parts = titleText.split(' - ');
                    if (parts.length >= 2) {
                        courseData.code = parts[0].trim();
                        courseData.title = parts[1].trim();
                        courseData.fullTitle = titleText;
                    } else {
                        courseData.code = titleText;
                    }
                }
            }

            // Extract credits
            const creditsElement = course.querySelector('span[id*="lblCourseCredits_"]');
            if (creditsElement) {
                courseData.credits = creditsElement.textContent.trim();
            }

            // Extract instructor name
            const instructorElement = course.querySelector('span[id*="lblinstructor_"]');
            if (instructorElement) {
                courseData.instructor = instructorElement.textContent.trim();
            }

            // Extract instructor qualification
            const qualificationElement = course.querySelector('span[id*="lblInstructorQualification_"]');
            if (qualificationElement) {
                courseData.qualification = qualificationElement.textContent.trim();
            }

            // Extract current lesson
            const lessonElement = course.querySelector('span[id*="lblCurrentLessonNo_"]');
            if (lessonElement) {
                courseData.currentLesson = lessonElement.textContent.trim();
            }

            // Extract course category
            const categoryElement = course.querySelector('span[id*="lblCategory_"]');
            if (categoryElement) {
                courseData.category = categoryElement.textContent.trim();
            }

            // Extract course image
            const courseImage = course.querySelector('img[src*="Courses/"]');
            if (courseImage) {
                courseData.instructorImage = courseImage.src;
                courseData.instructorImageAlt = courseImage.alt || courseImage.title || '';
            }

            // Extract links availability
            const assignmentElement = course.querySelector('a[id*="hylnkAssignment_"] span');
            if (assignmentElement) {
                courseData.assignments = assignmentElement.textContent.trim();
            }

            const gdbElement = course.querySelector('a[id*="hylnkGDB_"] span');
            if (gdbElement) {
                courseData.gdb = gdbElement.textContent.trim();
            }

            const quizElement = course.querySelector('a[id*="hylnkQuizList_"] span');
            if (quizElement) {
                courseData.quiz = quizElement.textContent.trim();
            }

            const activityElement = course.querySelector('a[id*="hylnkActivitySession_"] span');
            if (activityElement) {
                courseData.activity = activityElement.textContent.trim();
            }

            const announcementElement = course.querySelector('a[id*="hylnkAnnouncements_"] span');
            if (announcementElement) {
                courseData.announcements = announcementElement.textContent.trim();
            }

            if (courseData.code) {
                courseInfo.courses.push(courseData);
            }
        });

        return courseInfo;
    }

    // Helper methods for getting DOM elements
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

    // Page detection methods
    isProfilePage() {
        return window.location.pathname.includes('StudentProfile.aspx');
    }

    isHomePage() {
        return window.location.pathname.includes('Home.aspx') ||
            window.location.href.includes('Home.aspx') ||
            (window.location.pathname === '/' && window.location.href.includes('vulms.vu.edu.pk'));
    }

    detectPageType() {
        if (this.isProfilePage()) return 'profile';
        if (this.isHomePage()) return 'home';
        if (window.location.pathname.includes('ActivityCalendar.aspx')) return 'calendar';
        if (window.location.pathname.includes('CourseHome.aspx')) return 'course';
        return 'other';
    }

    // Merge info from different sections
    mergeInfo(info) {
        const merged = {
            // Basic info always available
            name: info.basicInfo.name || '',
            studentId: info.basicInfo.studentId || '',
            program: info.basicInfo.program || '',
            profileImage: info.basicInfo.profileImage || '',

            // Profile info (if available)
            ...info.profileInfo,

            // Course info (if available)
            semester: info.courseInfo.currentSemester || '',
            courses: info.courseInfo.courses || [],

            // Metadata
            extractedFrom: info.pageType,
            timestamp: info.timestamp,
            pageUrl: window.location.href
        };

        // Override with profile info if available
        if (info.profileInfo.fullName) {
            merged.name = info.profileInfo.fullName;
        }

        if (info.profileInfo.studentId) {
            merged.studentId = info.profileInfo.studentId;
        }

        if (info.profileInfo.studyProgram) {
            merged.program = info.profileInfo.studyProgram;
        }

        if (info.profileInfo.currentSemester) {
            merged.currentSemesterNo = info.profileInfo.currentSemester;
        }

        // Calculate totals
        if (merged.courses && merged.courses.length > 0) {
            merged.totalCourses = merged.courses.length;
            merged.totalCredits = merged.courses.reduce((total, course) => {
                const creditsMatch = course.credits ? course.credits.match(/(\d+)/) : null;
                return total + (creditsMatch ? parseInt(creditsMatch[1]) : 0);
            }, 0);
        }

        // Remove duplicates and empty values
        Object.keys(merged).forEach(key => {
            if (merged[key] === null || merged[key] === undefined ||
                merged[key] === '' ||
                (Array.isArray(merged[key]) && merged[key].length === 0)) {
                delete merged[key];
            }
        });

        return merged;
    }

    // Cache methods
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }

    saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // Export student info as JSON
    exportAsJSON() {
        const info = this.getStudentInfo();
        return JSON.stringify(info, null, 2);
    }

    // Download student info as JSON file
    downloadJSON(filename = 'student-info.json') {
        const json = this.exportAsJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Quick utility functions for common use cases
function getStudentBasicInfo() {
    const extractor = new StudentInfoExtractor();
    return extractor.extractBasicInfo();
}

function getStudentFullInfo() {
    const extractor = new StudentInfoExtractor();
    return extractor.getStudentInfo();
}

function exportStudentInfo() {
    const extractor = new StudentInfoExtractor();
    return extractor.exportAsJSON();
}

// Browser console shortcuts
window.getVUStudentInfo = getStudentFullInfo;
window.exportVUStudentInfo = exportStudentInfo;

// Export for use in other modules
export default {
    StudentInfoExtractor,
    getStudentBasicInfo,
    getStudentFullInfo,
    exportStudentInfo
}