/**
 * Quiz functionality for the Scientific Method Learning Tool
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the quiz
    const quizForm = document.getElementById('quiz-form');
    const quizId = document.getElementById('quiz-id')?.value;
    const questionsContainer = document.getElementById('quiz-questions');
    const resultsContainer = document.getElementById('quiz-results');
    const retryButton = document.getElementById('retry-quiz');
    
    // Check if we have completed parameter in URL (for browser refresh case)
    const urlParams = new URLSearchParams(window.location.search);
    const quizCompleted = urlParams.get('completed') === 'true';
    
    // If we're on a quiz page
    if (quizForm && quizId) {
        // Load quiz data from the HTML (this would be provided by the Flask template)
        let quizData = {};
        try {
            // Extract quiz data from the page
            const quizScript = document.querySelector('script[data-quiz]');
            if (quizScript) {
                quizData = JSON.parse(quizScript.textContent);
            } else {
                // Fallback to fetch
                fetchQuizData(quizId);
                return;
            }
        } catch (error) {
            console.error('Error parsing quiz data:', error);
            questionsContainer.innerHTML = '<div class="alert alert-danger">Error loading quiz. Please try again.</div>';
            return;
        }
        
        // Check if we should show results immediately (page was refreshed after completion)
        if (quizCompleted) {
            // Show results container and hide form
            quizForm.style.display = 'none';
            resultsContainer.style.display = 'block';
            
            // Add message about previously completed quiz
            const message = document.createElement('div');
            message.className = 'alert alert-info mb-4';
            message.innerHTML = `
                <i class="fas fa-info-circle me-2"></i>
                You've already completed this quiz. Your previous results are shown below.
                You can retry the quiz using the button below if you'd like to improve your score.
            `;
            
            // Add message to top of results
            const resultsCardBody = resultsContainer.querySelector('.card-body');
            resultsCardBody.insertBefore(message, resultsCardBody.firstChild);
        } else {
            // Render the quiz as normal
            renderQuiz(quizData);
        }
        
        // Quiz submission handler
        quizForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitQuiz(quizData);
        });
        
        // Retry quiz handler
        if (retryButton) {
            retryButton.addEventListener('click', function() {
                // Remove the completed parameter from URL
                const newUrl = window.location.pathname;
                history.pushState({}, document.title, newUrl);
                
                // Hide results and show form
                resultsContainer.style.display = 'none';
                quizForm.style.display = 'block';
                
                // Re-render quiz
                renderQuiz(quizData);
            });
        }
    }
});

/**
 * Fetch quiz data from the server
 * @param {string} quizId - The ID of the quiz to fetch
 */
function fetchQuizData(quizId) {
    const questionsContainer = document.getElementById('quiz-questions');
    
    fetch(`/static/data/quizzes.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load quiz data');
            }
            return response.json();
        })
        .then(quizzes => {
            const quiz = quizzes.find(q => q.id === parseInt(quizId));
            if (quiz) {
                renderQuiz(quiz);
            } else {
                throw new Error('Quiz not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            questionsContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error: ${error.message}. Please try refreshing the page.
                </div>
            `;
        });
}

/**
 * Render the quiz questions
 * @param {Object} quizData - The quiz data to render
 */
function renderQuiz(quizData) {
    const questionsContainer = document.getElementById('quiz-questions');
    
    // Get a randomized set of questions
    const questions = [...quizData.questions];
    shuffleArray(questions);
    
    // Clear the container
    questionsContainer.innerHTML = '';
    
    // Render each question
    questions.forEach((question, index) => {
        // Randomize the order of answers
        const answers = [...question.answers];
        shuffleArray(answers);
        
        // Create question element
        const questionElement = document.createElement('div');
        questionElement.className = 'card bg-dark mb-4';
        questionElement.dataset.questionId = question.id;
        
        // Question header
        const questionHeader = document.createElement('div');
        questionHeader.className = 'card-header bg-info bg-opacity-25';
        questionHeader.innerHTML = `<h4 class="mb-0">Question ${index + 1}: ${question.text}</h4>`;
        
        // Question body with answers
        const questionBody = document.createElement('div');
        questionBody.className = 'card-body';
        
        // Create answers list
        const answersList = document.createElement('div');
        answersList.className = 'list-group list-group-flush';
        
        answers.forEach(answer => {
            const answerId = `answer-${question.id}-${answer.id}`;
            const answerItem = document.createElement('div');
            answerItem.className = 'list-group-item bg-dark border-info border-opacity-25';
            
            answerItem.innerHTML = `
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="question-${question.id}" 
                           id="${answerId}" value="${answer.id}" data-is-correct="${answer.correct}">
                    <label class="form-check-label" for="${answerId}">
                        ${answer.text}
                    </label>
                </div>
            `;
            
            answersList.appendChild(answerItem);
        });
        
        // Assemble the question
        questionBody.appendChild(answersList);
        questionElement.appendChild(questionHeader);
        questionElement.appendChild(questionBody);
        questionsContainer.appendChild(questionElement);
    });
}

/**
 * Submit the quiz and display results
 * @param {Object} quizData - The quiz data
 */
function submitQuiz(quizData) {
    const quizForm = document.getElementById('quiz-form');
    const resultsContainer = document.getElementById('quiz-results');
    const scoreDisplay = document.getElementById('score-display');
    const scoreMessage = document.getElementById('score-message');
    const feedbackContainer = document.getElementById('question-feedback');
    
    // Get all questions
    const questionElements = document.querySelectorAll('#quiz-questions .card');
    let correctAnswers = 0;
    let totalQuestions = questionElements.length;
    
    // Collect results and provide feedback
    const userAnswers = {};
    feedbackContainer.innerHTML = '';
    
    questionElements.forEach((questionEl, index) => {
        const questionId = questionEl.dataset.questionId;
        const selectedAnswer = questionEl.querySelector('input[type="radio"]:checked');
        
        // Create feedback element
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'card bg-dark mb-3';
        
        // Question data from quiz
        const questionData = quizData.questions.find(q => q.id.toString() === questionId);
        
        if (selectedAnswer) {
            const answerId = selectedAnswer.value;
            const isCorrect = selectedAnswer.dataset.isCorrect === 'true';
            
            // Store the user's answer
            userAnswers[questionId] = answerId;
            
            if (isCorrect) {
                correctAnswers++;
                feedbackEl.innerHTML = `
                    <div class="card-header bg-success bg-opacity-25">
                        <h5 class="mb-0">
                            <i class="fas fa-check-circle me-2"></i>Question ${index + 1}: Correct
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Question:</strong> ${questionData.text}</p>
                        <p><strong>Your answer:</strong> ${questionData.answers.find(a => a.id.toString() === answerId).text}</p>
                        <p class="mb-0"><strong>Explanation:</strong> ${questionData.explanation || 'Great job!'}</p>
                    </div>
                `;
            } else {
                const correctAnswer = questionData.answers.find(a => a.correct);
                feedbackEl.innerHTML = `
                    <div class="card-header bg-danger bg-opacity-25">
                        <h5 class="mb-0">
                            <i class="fas fa-times-circle me-2"></i>Question ${index + 1}: Incorrect
                        </h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Question:</strong> ${questionData.text}</p>
                        <p><strong>Your answer:</strong> ${questionData.answers.find(a => a.id.toString() === answerId).text}</p>
                        <p><strong>Correct answer:</strong> ${correctAnswer.text}</p>
                        <p class="mb-0"><strong>Explanation:</strong> ${questionData.explanation || 'Keep studying this concept.'}</p>
                    </div>
                `;
            }
        } else {
            // No answer selected
            const correctAnswer = questionData.answers.find(a => a.correct);
            feedbackEl.innerHTML = `
                <div class="card-header bg-secondary bg-opacity-25">
                    <h5 class="mb-0">
                        <i class="fas fa-question-circle me-2"></i>Question ${index + 1}: Not Answered
                    </h5>
                </div>
                <div class="card-body">
                    <p><strong>Question:</strong> ${questionData.text}</p>
                    <p><strong>Correct answer:</strong> ${correctAnswer.text}</p>
                    <p class="mb-0"><strong>Explanation:</strong> ${questionData.explanation || 'Make sure to answer all questions next time.'}</p>
                </div>
            `;
        }
        
        feedbackContainer.appendChild(feedbackEl);
    });
    
    // Calculate score
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Update score display
    scoreDisplay.textContent = `${scorePercentage}%`;
    
    // Customize message based on score
    if (scorePercentage >= 90) {
        scoreMessage.innerHTML = 'Excellent! You have mastered this material!';
    } else if (scorePercentage >= 70) {
        scoreMessage.innerHTML = 'Good job! You understand most of the concepts.';
    } else if (scorePercentage >= 50) {
        scoreMessage.innerHTML = 'You\'re on the right track, but might need to review some topics.';
    } else {
        scoreMessage.innerHTML = 'You should spend more time with this material before moving on.';
    }
    
    // Create results chart
    createResultsChart(correctAnswers, totalQuestions - correctAnswers);
    
    // Hide the form and show results
    quizForm.style.display = 'none';
    resultsContainer.style.display = 'block';
    
    // Send results to server
    saveQuizResults(quizData.id, userAnswers, scorePercentage);
}

/**
 * Create a chart showing quiz results
 * @param {number} correct - Number of correct answers
 * @param {number} incorrect - Number of incorrect answers
 */
function createResultsChart(correct, incorrect) {
    const ctx = document.getElementById('results-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.resultsChart) {
        window.resultsChart.destroy();
    }
    
    // Create new chart
    window.resultsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Correct', 'Incorrect'],
            datasets: [{
                data: [correct, incorrect],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)',
                    'rgba(220, 53, 69, 0.7)'
                ],
                borderColor: [
                    'rgb(40, 167, 69)',
                    'rgb(220, 53, 69)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Save quiz results to the server
 * @param {number} quizId - The ID of the quiz
 * @param {Object} answers - User's answers (question_id: answer_id)
 * @param {number} score - Score percentage
 */
function saveQuizResults(quizId, answers, score) {
    fetch(`/submit_quiz/${quizId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            answers: answers,
            score: score
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        
        // Add success message if not already shown
        const resultsContainer = document.getElementById('quiz-results');
        if (!document.getElementById('save-success-message')) {
            const successAlert = document.createElement('div');
            successAlert.id = 'save-success-message';
            successAlert.className = 'alert alert-success mt-3';
            successAlert.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                Your quiz results have been saved successfully!
            `;
            
            // Insert before the buttons section
            const feedbackSection = document.getElementById('question-feedback');
            if (feedbackSection) {
                feedbackSection.parentNode.insertBefore(successAlert, feedbackSection.nextSibling);
            } else {
                resultsContainer.querySelector('.card-body').appendChild(successAlert);
            }
        }
        
        // Update URL with query parameter to prevent form reset on refresh
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('completed')) {
            const newUrl = `${window.location.pathname}?completed=true`;
            history.pushState({completed: true}, document.title, newUrl);
        }
    })
    .catch(error => {
        console.error('Error saving quiz results:', error);
        // Show error message
        const resultsContainer = document.getElementById('quiz-results');
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-3';
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            There was an error saving your quiz results. Please try again.
        `;
        resultsContainer.querySelector('.card-body').appendChild(errorAlert);
    });
}

/**
 * Shuffle array elements in place
 * @param {Array} array - The array to shuffle
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
