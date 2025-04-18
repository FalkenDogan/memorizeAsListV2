//selectQuestion.js
let quizData = []; // JSON data will be loaded here

// Load JSON data from LocalStorage
document.addEventListener('DOMContentLoaded', () => {
  const storedQuizData = localStorage.getItem('quizData'); // JSON data created by sheetToJson.js

  if (storedQuizData) {
    try {
      quizData = JSON.parse(storedQuizData); // Load JSON data
      document.getElementById('questionCount').innerText = `Number of questions: ${quizData.length}`;
      document.getElementById('endQuestion').max = quizData.length; // Set maximum number of questions
    } catch (error) {
      console.error('Error processing JSON data:', error);
    }
  } else {
    console.error('JSON data not found. Please ensure sheetToJson.js is working correctly.');
    document.getElementById('questionCount').innerText = 'Number of questions: Data not found!';
  }
});
// Start quiz process
document.getElementById('startQuiz').addEventListener('click', function () {
  const startInput = document.getElementById('startQuestion').value;
  const endInput = document.getElementById('endQuestion').value;
  const start = parseInt(startInput) - 1; // Adjust user input to indices
  const end = parseInt(endInput);

  if (isNaN(start) || isNaN(end) || start < 0 || end > quizData.length || start >= end) {
    alert('Please enter a valid start and end value.');
    return;
  }

  // Save selected range to localStorage
  localStorage.setItem('startQuestion', start);
  localStorage.setItem('endQuestion', end);

  // Save selected questions to localStorage
  const selectedQuizData = quizData.slice(start, end);
  localStorage.setItem('selectedQuizData', JSON.stringify(selectedQuizData));

  window.location.href = 'quiz.html'; // Redirect to question asking page
});

// Start flashcard process
document.getElementById('startFlashcard').addEventListener('click', function () {
  const startInput = document.getElementById('startQuestion').value;
  const endInput = document.getElementById('endQuestion').value;
  const start = parseInt(startInput) - 1; // Adjust user input to indices
  const end = parseInt(endInput);

  if (isNaN(start) || isNaN(end) || start < 0 || end > quizData.length || start >= end) {
    alert('Please enter a valid start and end value.');
    return;
  }

  // Save selected range to localStorage
  localStorage.setItem('startQuestion', start);
  localStorage.setItem('endQuestion', end);

  // Save selected questions to localStorage
  const selectedQuizData = quizData.slice(start, end);
  localStorage.setItem('selectedQuizData', JSON.stringify(selectedQuizData));

  window.location.href = 'flashcard.html'; // Redirect to flashcard page
});
// Close the window
document.getElementById('closeButton').addEventListener('click', () => {
  window.location.href = 'index.html';
});

