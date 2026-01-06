// pdfGenerator.js - FIXED VERSION
console.log("loaded pdfGenerator");

async function generatePDFInContentScript(data) {
    try {
        console.log('Generating HTML for grouped PDF:', data);

        // Check if this is grouped data (has groupInfo) or regular data
        let quizzes, groupInfo;

        if (data.quizzes && data.groupInfo) {
            // This is grouped data
            quizzes = data.quizzes;
            groupInfo = data.groupInfo;
        } else {
            // This is regular data (fallback)
            quizzes = Array.isArray(data) ? data : [data];
            groupInfo = {
                courseCode: quizzes[0]?.courseCode || 'Unknown',
                courseName: quizzes[0]?.courseName || 'Unknown',
                studentId: quizzes[0]?.studentId || 'Unknown',
                studentName: quizzes[0]?.studentName || 'Unknown'
            };
        }

        console.log('Group Info:', groupInfo);
        console.log('Number of quizzes:', quizzes.length);

        // Generate complete HTML page with print styles
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>VU Quiz Solutions - ${groupInfo.courseCode} - ${groupInfo.studentName}</title>
            <style>
                /* Print styles */
                @media print {
                    @page {
                        margin: 15mm;
                        size: A4;
                    }
                    
                    body {
                        margin: 0;
                        padding: 0;
                        font-size: 12pt;
                        line-height: 1.4;
                    }
                    
                    .no-print {
                        display: none !important;
                    }
                    
                    .page-break {
                        page-break-before: always;
                    }
                    
                    .question-item {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
                
                /* Screen styles */
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    max-width: 210mm;
                    margin: 20px auto;
                    padding: 20px;
                    background: #f5f5f5;
                    color: #333;
                    line-height: 1.6;
                }
                
                .print-container {
                    background: white;
                    padding: 15mm;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                    border-radius: 8px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #004080;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    color: #004080;
                    margin: 0 0 10px 0;
                }
                
                .controls {
                    text-align: center;
                    margin: 20px 0;
                    padding: 15px;
                    background: #e8f4fc;
                    border-radius: 8px;
                }
                
                .print-btn {
                    background: #004080;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .print-btn:hover {
                    background: #002b5c;
                }
                
                /* Your existing quiz styles */
                .question-item {
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    background: white;
                }
                
                .question-header {
                    padding: 15px;
                    margin: -20px -20px 10px -20px;
                    border-radius: 8px 8px 0 0;
                    background: #f8f9fa;
                }
                
                .question-number {
                    font-size: 18px;
                    font-weight: bold;
                    color: #004080;
                    margin: 0 0 10px 0;
                }
                
                .question {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #222;
                }

                .question-text {
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                    border-left: 4px solid #004080;
                }
                
                .option {
                    margin-bottom: 10px;
                    padding: 10px 15px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                }
                
                .option.correct {
                    background: #d4edda;
                    border-color: #28a745;
                    border-left: 4px solid #28a745;
                }
                
                .solution {
                    background: #e8f4fc;
                    border: 1px solid #b3e0ff;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 15px;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    color: #888;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="header">
                    <h1>VU Empire Genie - Quiz Solutions</h1>
                    <div style="margin: 10px 0;">
                        <div><strong>Course:</strong> ${groupInfo.courseName} (${groupInfo.courseCode})</div>
                        <div><strong>Student:</strong> ${groupInfo.studentName} (${groupInfo.studentId})</div>
                    </div>
                    <div style="color: #666;">
                        Generated on: ${new Date().toLocaleString()} | Total Questions: ${quizzes.length}
                    </div>
                </div>

                <div class="controls no-print">
                    <button class="print-btn" onclick="window.print()">
                        🖨️ Print to PDF
                    </button>
                    <p style="margin-top: 10px; color: #666; font-size: 14px;">
                        Click the button above, then choose "Save as PDF" in the print dialog
                    </p>
                </div>
                
                ${generateQuizzesHTML(quizzes)}
                
                <div class="footer">
                    <div>Generated by VU Empire Genie</div>
                    <div>Powered by VU Empire</div>
                    <div>© ${new Date().getFullYear()} - All rights reserved</div>
                </div>
            </div>
            
            <script>
                // Auto-focus print button for accessibility
                window.onload = function() {
                    const printBtn = document.querySelector('.print-btn');
                    if (printBtn) printBtn.focus();
                };
            </script>
        </body>
        </html>
        `;

        // Create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `VU_Quiz_${groupInfo.courseCode}_${groupInfo.studentId}_${Date.now()}.html`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        return url;

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}
function generateQuizzesHTML(quizQuestions) {
    let html = '';

    quizQuestions.forEach((quizQuestion, index) => {
        // Start a new question item
        html += `
            <div class="question-item">
                <div class="question-header">
                    <div class="question">
                        <div class="question-number">Question #${index + 1}</div>
                        <div class="question-text">${cleanQuestionText(quizQuestion.question || 'No question available')}</div>
                    </div>
                </div>
                
                <div class="options">
        `;

        // Add options
        if (quizQuestion.options && quizQuestion.options.length > 0) {
            quizQuestion.options.forEach((option, optIndex) => {
                const letter = option.letter || String.fromCharCode(65 + optIndex);
                const isCorrect = quizQuestion.solution && quizQuestion.solution.correctAnswers &&
                    quizQuestion.solution.correctAnswers.includes(letter);

                html += `
                    <div class="option ${isCorrect ? 'correct' : ''}">
                        <strong>${letter}.</strong> ${escapeHtml(option.text || '')}
                    </div>
                `;
            });
        }

        // Close options div
        html += `</div>`;

        // Add solution if available
        if (quizQuestion.solution) {
            html += `
                <div class="solution">
                    <h3 style="margin-top: 0; color: #004080;">Solution</h3>
                    
                    ${quizQuestion.solution.correctAnswers && quizQuestion.solution.correctAnswers.length > 0 ? `
                    <div style="background: #d4edda; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                        <strong>Correct Answer${quizQuestion.solution.correctAnswers.length > 1 ? 's' : ''}:</strong> 
                        ${quizQuestion.solution.correctAnswers.join(', ')}
                    </div>
                    ` : ''}
                    
                    ${quizQuestion.solution.explanation ? `
                    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #004080;">
                        <strong>Explanation:</strong><br>
                        ${escapeHtml(quizQuestion.solution.explanation)}
                    </div>
                    ` : ''}
                </div>
            `;
        }

        // Add metadata and CLOSE the question-item div
        html += `
            </div>
        `;

        // Add page break every 3 questions (except after the last one)
        if ((index + 1) % 3 === 0 && index !== quizQuestions.length - 1) {
            html += '<div class="page-break"></div>';
        }
    });

    return html;
}

// Helper function to clean question text (remove garbled nonsense)
function cleanQuestionText(text) {
    if (!text) return '';

    // Split by lines and filter out garbage
    const lines = text.split('\n').map(line => line.trim());

    // Filter out lines that look like garbage (long random strings, single letters, etc.)
    const filteredLines = lines.filter(line => {
        // Skip empty lines
        if (!line) return false;

        // Skip lines that are mostly garbage patterns
        const garbagePatterns = [
            /^[A-Za-z0-9]{10,}$/, // Long random strings
            /^[A-Z][a-z]{2,4}\d{2,}[A-Za-z\d\s]{10,}/, // Pattern like "Lrwio p8iOy vdMYI"
            /^[a-z]\s*$/, // Single letter with spaces
            /^[A-Za-z0-9]{10,}\s+[A-Za-z0-9]{10,}/, // Two long random strings
            /^[A-Z]{2,}\d{2,}[A-Z0-9\s]+/, // Mixed case patterns with numbers
            /^[A-Za-z0-9]{20,}/ // Very long random strings
        ];

        for (const pattern of garbagePatterns) {
            if (pattern.test(line)) {
                return false;
            }
        }

        return true;
    });

    // Join back with proper spacing
    let cleaned = filteredLines.join(' ').trim();

    // If still too garbled, try to extract just the actual question
    if (cleaned.length > 500) { // Too long, probably has garbage
        // Look for the actual question pattern
        const questionMatch = text.match(/A\/an\s+.+?\.|What\s+.+?\?|In\s+.+?\./);
        if (questionMatch) {
            cleaned = questionMatch[0];
        }

        // Or take first reasonable paragraph
        const reasonableLines = lines.filter(line =>
            line.length > 10 &&
            line.length < 200 &&
            !line.match(/[A-Za-z0-9]{15,}/)
        );
        if (reasonableLines.length > 0) {
            cleaned = reasonableLines[0];
        }
    }

    return escapeHtml(cleaned || 'Question text not available');
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Message listener
// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('pdfGenerator received message:', request.type);

    if (request.type === 'GENERATE_PDF_IN_CONTENT') {
        (async () => {
            try {
                console.log('Starting HTML generation for regular PDF...');
                const url = await generatePDFInContentScript(request.data);
                console.log('HTML generation successful');
                sendResponse({
                    success: true,
                    url: url,
                    message: 'HTML file downloaded. Open it and click "Print to PDF".'
                });
            } catch (error) {
                console.error('Generation failed:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        })();
        return true;
    }

    // Add this new handler for grouped PDFs
    if (request.type === 'GENERATE_GROUPED_PDF') {
        (async () => {
            try {
                console.log('Starting HTML generation for GROUPED PDF...');
                const url = await generatePDFInContentScript(request.data);
                console.log('Grouped PDF generation successful');
                sendResponse({
                    success: true,
                    url: url,
                    message: 'Grouped HTML file downloaded. Open it and click "Print to PDF".'
                });
            } catch (error) {
                console.error('Grouped PDF generation failed:', error);
                sendResponse({
                    success: false,
                    error: error.message
                });
            }
        })();
        return true;
    }

    return false;
});