// Shuffle the array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Generate Quiz 
function generateQuiz(inputList, columnOption) {
  const quizData = [];

  inputList.forEach((map) => {
    const question = columnOption === 'AtoC' ? map["ColumnA"] : map["ColumnB"];
    const correctAnswer = columnOption === 'AtoC' ? map["ColumnB"] : map["ColumnA"];

    // Set used to select incorrect answers
    const optionsSet = new Set();
    optionsSet.add(correctAnswer);

    // Random incorrect options are being selected
    while (optionsSet.size < 4) {
      const randomEntry = inputList[Math.floor(Math.random() * inputList.length)];
      optionsSet.add(columnOption === 'AtoC' ? randomEntry["ColumnB"] : randomEntry["ColumnA"]);
    }

    // Shuffle the options
    const options = Array.from(optionsSet);
    shuffleArray(options);

    // Create the question structure
    quizData.push({
      question: question,
      options: options,
      answer: correctAnswer,
    });
  });

  return quizData;
}

document.getElementById('column-selection-form').addEventListener('submit', function(event) {
  event.preventDefault();

  const columnOption = document.querySelector('input[name="columnOption"]:checked').value;
  const jsonData = JSON.parse(localStorage.getItem('jsonData'));

  // Generate quiz data
  const quizData = generateQuiz(jsonData, columnOption);

  // Save JSON data to localStorage
  localStorage.setItem('quizData', JSON.stringify(quizData));

  // Redirect the user to the Quiz page
  window.location.href = 'selectQuestion.html';
  });