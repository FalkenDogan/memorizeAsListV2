//flaschcad.js

let selectedQuizData = [];
let currentQuestion = 0;
let score = 0;
let previousAnswers = []; // To store previous answers

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function displayQuestion() {
  const quizContainer = document.getElementById('quiz');
  quizContainer.style.display = 'block';

  const questionData = selectedQuizData[currentQuestion];
  quizContainer.innerHTML = `
    <div class="flashcard" onclick="flipCard()">
      <div class="front" style="overflow-y: auto; display: flex; align-items: flex-start; justify-content: center;">${questionData.question}</div>
      <div class="back" style="overflow-y: auto; display: flex; align-items: flex-start; justify-content: center;">${questionData.answer}</div>
    </div>
  `;

  // Update question number
  const questionNumberElement = document.getElementById('questionNumber');
  questionNumberElement.innerText = `Question number: ${currentQuestion + 1}/${selectedQuizData.length}`;
}

function flipCard() {
  const flashcard = document.querySelector('.flashcard');
  flashcard.classList.toggle('flipped');
}

function startQuiz() {
  const quizData = JSON.parse(localStorage.getItem('selectedQuizData')); // Questions from selectQuestion.js
  if (!quizData || quizData.length === 0) {
    alert('No questions selected for the quiz.');
    window.location.href = 'selectQuestion.html';
    return;
  }

  selectedQuizData = quizData;
  currentQuestion = 0;
  score = 0;
  previousAnswers = new Array(selectedQuizData.length).fill(null);

  document.getElementById('submit').style.display = 'inline-block';
  document.getElementById('previous').style.display = 'inline-block';
  displayQuestion();
}

function checkAnswer() {
  currentQuestion++;
  if (currentQuestion < selectedQuizData.length) {
    displayQuestion();
  } else {
    displayResult();
  }
}

function showPreviousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    displayQuestion();
  }
}

function displayResult() {
  const quizContainer = document.getElementById('quiz');
  const resultContainer = document.getElementById('result');
  quizContainer.style.display = 'none';
  document.getElementById('submit').style.display = 'none';
  document.getElementById('previous').style.display = 'none';
  resultContainer.innerHTML = `You scored ${score} out of ${selectedQuizData.length}!`;

  document.getElementById('exit').classList.remove('hide');
  document.getElementById('selectQuestionPage').classList.remove('hide');
}

function exitQuiz() {
  window.location.href = 'sheetToJson.html';
}

function goSelectQuestionPage() {
  window.location.href = 'selectQuestion.html';
}

document.getElementById('submit').addEventListener('click', checkAnswer);
document.getElementById('previous').addEventListener('click', showPreviousQuestion);
document.getElementById('exit').addEventListener('click', exitQuiz);
document.getElementById('selectQuestionPage').addEventListener('click', goSelectQuestionPage);
// Close the window
document.getElementById('closeButton').addEventListener('click', () => {
  window.location.href = 'sheetToJson.html';
});
startQuiz(); // Start the quiz
