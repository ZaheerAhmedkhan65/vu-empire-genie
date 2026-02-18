import { registerRoute } from "../core/router.js";

registerRoute("history", () => {
    const container = document.createElement('div');
    container.classList.add('container','app-container');
    container.innerHTML = `
        <div class="fs-1 mb-3">Quiz History</div>
        <table class="table table-bordered  table-striped table-hover w-100">
            <tbody id="quiz-history-list">
                <tr>
                    <td colspan="2" class="text-muted text-center">Loading...</td>
                </tr>
            </tbody>
        </table>
    `;

    loadAndRenderHistory(container.querySelector('#quiz-history-list'));
    return container;
});

async function loadAndRenderHistory(tbody) {
    try {
        const { quizData } = await chrome.storage.local.get(['quizData']);
        if (!quizData || quizData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" class="text-muted text-center">No quiz attempts yet.</td></tr>`;
            return;
        }

        const groups = groupQuizzesByQuiz(quizData);
        tbody.innerHTML = ''; // clear loading row

        groups.forEach(group => {
            const row = createHistoryRow(group);
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load history:', error);
        tbody.innerHTML = `<tr><td colspan="2" class="text-danger text-center">Error loading history.</td></tr>`;
    }
}

function groupQuizzesByQuiz(quizzes) {
    const groups = new Map(); // key: `${courseCode}_${quizIdentifier}`

    quizzes.forEach(quiz => {
        const quizIdentifier = extractQuizIdentifier(quiz.courseName);
        const key = `${quiz.courseCode}_${quizIdentifier}`;

        if (!groups.has(key)) {
            groups.set(key, {
                courseCode: quiz.courseCode,
                courseName: quiz.courseName,
                quizIdentifier,
                studentId: quiz.studentId,
                studentName: quiz.studentName,
                quizzes: [],
                latestTimestamp: quiz.timestamp
            });
        }

        const group = groups.get(key);
        group.quizzes.push(quiz);
        if (new Date(quiz.timestamp) > new Date(group.latestTimestamp)) {
            group.latestTimestamp = quiz.timestamp;
        }
    });

    return Array.from(groups.values());
}

function extractQuizIdentifier(courseName) {
    // Matches patterns like "Attendance Quiz No. 7", "Quiz No. 3", etc.
    const match = courseName.match(/(?:Attendance\s*)?Quiz\s*No\.?\s*\d+/i);
    return match ? match[0] : 'General Quiz';
}

function createHistoryRow(group) {
    const row = document.createElement('tr');

    const date = new Date(group.latestTimestamp).toLocaleString();

    row.innerHTML = `
        <td class="text-start w-100 text-white">
            <strong>${group.courseCode} - ${group.quizIdentifier}</strong><br>
            <small class="text-muted">${date}</small>
        </td>
        <td class="text-center">
            <button class="btn p-2 bg-transparent download-quiz-btn" title="Download PDF">
                <img src="../assets/svg/download.svg" width="16" height="16" alt="Download">
            </button>
        </td>
    `;

    row.querySelector('.download-quiz-btn').addEventListener('click', () => {
        downloadQuizGroup(group);
    });

    return row;
}

function downloadQuizGroup(group) {
    chrome.runtime.sendMessage({
        type: 'DOWNLOAD_QUIZ_GROUP',
        data: {
            quizzes: group.quizzes,
            groupInfo: {
                courseCode: group.courseCode,
                courseName: group.courseName,
                studentId: group.studentId,
                studentName: group.studentName,
                timestamp: group.latestTimestamp
            }
        }
    }, (response) => {
        if (response?.success) {
            // Optional: show success notification
        } else {
            alert('Download failed: ' + (response?.error || 'Unknown error'));
        }
    });
}