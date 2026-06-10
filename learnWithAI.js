// learnWithAI.js

let selectedQuizData = [];
let currentIndex = 0;

// DOM Elements - Safe references with null checks
const closeButton = document.getElementById('closeButton');

const questionNumberText = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const prevQuestionBtn = document.getElementById('prevQuestion');
const nextQuestionBtn = document.getElementById('nextQuestion');

const userAnswerTextarea = document.getElementById('userAnswer');
const submitAnswerBtn = document.getElementById('submitAnswer');

const loadingSkeleton = document.getElementById('loadingSkeleton');
const evaluationContainer = document.getElementById('evaluationContainer');
const evaluationBody = document.getElementById('evaluationBody');

// Optional DOM Elements (may not exist in all pages)
const groqModelSelect = document.getElementById('groqModel');
const feedbackLanguageSelect = document.getElementById('feedbackLanguage');

// Language Names Mapping for System Prompts
const languageNames = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano'
};

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
  // Load Quiz Data
  const storedQuizData = localStorage.getItem('selectedQuizData');
  if (storedQuizData) {
    try {
      selectedQuizData = JSON.parse(storedQuizData);
    } catch (e) {
      console.error('Error parsing selectedQuizData:', e);
    }
  }

  if (!selectedQuizData || selectedQuizData.length === 0) {
    alert('No questions selected. Please select range first.');
    window.location.href = 'selectQuestion.html';
    return;
  }

  // Detect Browser Language
  let defaultLang = 'en';
  const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
  if (languageNames[browserLang]) {
    defaultLang = browserLang;
  }

  // Restore Settings from LocalStorage
  const storedApiKey = localStorage.getItem('groq_api_key') || '';

  // Event Listeners - Only add if elements exist
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.location.href = 'selectQuestion.html';
    });
  }

  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener('click', showPreviousQuestion);
  }

  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', showNextQuestion);
  }

  if (submitAnswerBtn) {
    submitAnswerBtn.addEventListener('click', submitTranslation);
  }

  // Render first question
  renderQuestion();
});

// Render current question
function renderQuestion() {
  const current = selectedQuizData[currentIndex];
  
  if (questionNumberText) {
    questionNumberText.innerText = `Question number: ${currentIndex + 1}/${selectedQuizData.length}`;
  }
  
  if (questionText) {
    questionText.innerText = current.question;
  }
  
  if (userAnswerTextarea) {
    userAnswerTextarea.value = '';
  }

  // Hide Evaluation and Loading elements
  if (evaluationContainer) {
    evaluationContainer.style.display = 'none';
  }
  
  if (evaluationBody) {
    evaluationBody.innerHTML = '';
  }
  
  if (loadingSkeleton) {
    loadingSkeleton.style.display = 'none';
  }

  // Navigation button states
  if (prevQuestionBtn) {
    prevQuestionBtn.disabled = (currentIndex === 0);
  }
  
  if (nextQuestionBtn) {
    nextQuestionBtn.disabled = (currentIndex === selectedQuizData.length - 1);
  }
}

// Navigation Actions
function showPreviousQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function showNextQuestion() {
  if (currentIndex < selectedQuizData.length - 1) {
    currentIndex++;
    renderQuestion();
  }
}

// Prompt Generation based on Target Language Selection
function buildEvaluationPrompt(question, userAnswer, feedbackLang) {
  if (feedbackLang === 'tr') {
    return `Senin rolün dil öğretmeni. Kullanıcı sana şu cümleyi:

"${question}"

şu şekilde çevirdi:

"${userAnswer}"

Lütfen cevap cümlesine göre dilin ve yazımı nazik bir şekilde değerlendir. ÖNEMLI: Yanıtı LÜTFEn MARKDOWN KULLANMADAN, sadece DÜZGÜN VE TEMIZ METINLE ver. Aşağıdaki hususları ele al:

1. Dilbilgisi Kontrolü
Cümlenin kaynak dilinden hedef dile çevirisinin dilbilgisi açısından doğru olup olmadığını kontrol et. Sonuç: Doğru / Hatalı 
Açıklama: (eğer hata varsa açıkla ve doğru cümleyi yaz)

2. Hedef Dildeki Günlük Konuşma Alternatifi
Bu cümlenin günlük hayatta söylenebilecek başka şekilleri:
- (alternatif 1)
- (alternatif 2)
- Eğer varsa (alternatif 3)
- Eğer varsa (alternatif 4)

Cevapları Türkçe olarak nazik, teşvik edici ve yapıcı tarzda ver. MARKDOWN, BOLD, TABLO, ÖZEL KARAKTERLER KULLANMA.`;
  } else if (feedbackLang === 'de') {
    return `Deine Rolle ist die eines Sprachlehrers. Der Benutzer hat folgenden Satz:

"${question}"

wie folgt übersetzt:

"${userAnswer}"

Bitte bewerten Sie die Übersetzung höflich anhand des Satzes und der Schreibweise. WICHTIG: Bitte geben Sie die Antwort OHNE MARKDOWN, nur in ORDENTLICHEM UND SAUBEREM TEXT an. Gehen Sie auf folgende Punkte ein:

1. Grammatikprüfung
Prüfen Sie, ob die Übersetzung aus der Ausgangssprache in die Zielsprache grammatikalisch korrekt ist. Ergebnis: Richtig / Falsch
Erklärung: (falls Fehler vorhanden, erklären Sie diese)

2. Alternativen für die Alltagssprache
Andere Möglichkeiten, diesen Satz im Alltag zu sagen:
- (Alternative 1)
- (Alternative 2)
- Falls vorhanden (Alternative 3)
- Falls vorhanden (Alternative 4)

Geben Sie die Antworten auf Deutsch in einem höflichen, ermutigenden und konstruktiven Ton. VERWENDEN SIE KEIN MARKDOWN, KEINEN FETTDRUCK, KEINE TABELLEN UND KEINE SONDERZEICHEN.`;
  } else if (feedbackLang === 'ru') {
    return `Твоя роль — учитель языка. Пользователь перевел следующее предложение:

"${question}"

следующим образом:

"${userAnswer}"

Пожалуйста, вежливо оцените перевод на основе предложения и правописания. ВАЖНО: Пожалуйста, предоставьте ответ БЕЗ ИСПОЛЬЗОВАНИЯ MARKDOWN, только ПРОСТЫМ И ЧИСТЫМ ТЕКСТОМ. Рассмотрите следующие аспекты:

1. Проверка грамматики
Проверьте, правилен ли перевод с исходного языка на целевой с точки зрения грамматики. Результат: Правильно / Неправильно
Объяснение: (если есть ошибки, объясните)

2. Разговорные альтернативы
Другие способы сказать это предложение в повседневной жизни:
- (альтернатива 1)
- (альтернатива 2)
- если есть (альтернатива 3)
- если есть (альтернатива 4)

Дайте ответы на русском языке в вежливом, ободряющем и конструктивном тоне. НЕ ИСПОЛЬЗУЙТЕ MARKDOWN, ЖИРНЫЙ ШРИФТ, ТАБЛИЦЫ, СПЕЦИАЛЬНЫЕ СИМВОЛЫ.`;
  } else if (feedbackLang === 'fr') {
    return `Votre rôle est celui d'un professeur de langue. L'utilisateur a traduit la phrase suivante:

"${question}"

comme suit:

"${userAnswer}"

Veuillez évaluer poliment la langue et l'orthographe en fonction de la phrase de réponse. IMPORTANT: Veuillez fournir la réponse SANS UTILISER DE MARKDOWN, uniquement en TEXTE PROPRE ET NET. Abordez les points suivants:

1. Contrôle de grammaire
Vérifiez si la traduction de la langue source vers la langue cible est grammaticalement correcte. Résultat: Correct / Incorrect
Explication: (s'il y a des erreurs, expliquez)

2. Alternatives de conversation quotidienne
Autres façons de dire cette phrase dans la vie de tous les jours:
- (alternative 1)
- (alternative 2)
- Le cas échéant (alternative 3)
- Le cas échéant (alternative 4)

Donnez les réponses en français dans un style poli, encourageant et constructif. N'UTILISEZ PAS DE MARKDOWN, DE GRAS, DE TABLEAUX OU DE CARACTÈRES SPÉCIAUX.`;
  } else if (feedbackLang === 'es') {
    return `Tu rol es el de un profesor de idiomas. El usuario tradujo la siguiente oración:

"${question}"

de la siguiente manera:

"${userAnswer}"

Por favor, evalúa amablemente el idioma y la ortografía en función de la oración de respuesta. IMPORTANTE: Por favor, proporciona la respuesta SIN USAR MARKDOWN, solo en TEXTO LIMPIO Y CLARO. Aborda los siguientes puntos:

1. Control de gramática
Verifica si la traducción del idioma de origen al de destino es gramaticalmente correcta. Resultado: Correcto / Incorrecto
Explicación: (si hay errores, explica)

2. Alternativas para la conversación diaria
Otras formas de decir esta oración en la vida cotidiana:
- (alternativa 1)
- (alternativa 2)
- Si hay (alternativa 3)
- Si hay (alternativa 4)

Da las respuestas en español con un estilo amable, alentador y constructivo. NO UTILICES MARKDOWN, NEGRITA, TABLAS NI CARACTERES ESPECIALES.`;
  } else if (feedbackLang === 'it') {
    return `Il tuo ruolo è quello di un insegnante di lingua. L'utente ha tradotto la seguente frase:

"${question}"

come segue:

"${userAnswer}"

Si prega di valutare educatamente la lingua e l'ortografia in base alla frase di risposta. IMPORTANTE: Si prega di fornire la risposta SENZA UTILIZZARE MARKDOWN, solo in TESTO ORDINATO E PULITO. Affronta i seguenti punti:

1. Controllo grammaticale
Verifica se la traduzione dalla lingua di origine a quella di destinazione è grammaticalmente corretta. Risultato: Corretto / Errato
Spiegazione: (se ci sono errori, spiega)

2. Alternative nella conversazione quotidiana
Altri modi per dire questa frase nella vita di tutti i giorni:
- (alternativa 1)
- (alternativa 2)
- Se presenti (alternativa 3)
- Se presenti (alternativa 4)

Fornisci le risposte in italiano con uno stile gentile, incoraggiante e costruttivo. NON USARE MARKDOWN, GRASSETTO, TABELLE O CARATTERI SPECIALI.`;
  } else if (feedbackLang === 'ar') {
    return `دورك هو أستاذ لغة. المستخدم ترجم الجملة التالية:

"${question}"

على النحو التالي:

"${userAnswer}"

يرجى تقييم اللغة والتهجئة بأدب بناءً على الجملة المترجمة. مهم: يرجى تقديم الإجابة بدون استخدام MARKDOWN، فقط بنص نظيف وواضح. تناول النقاط التالية:

1. فحص القواعد النحوية
تحقق مما إذا كانت الترجمة من اللغة المصدر إلى اللغة المستهدفة صحيحة نحويًا. النتيجة: صحيح / غير صحيح
الشرح: (إذا كان هناك أخطاء، اشرح)

2. بدائل المحادثة اليومية
طرق أخرى للتعبير عن هذه الجملة في الحياة اليومية:
- (بديل 1)
- (بديل 2)
- إن وجد (بديل 3)
- إن وجد (بديل 4)

قدم الإجابات باللغة العربية بأسلوب مهذب وتشجيعي وبناء. لا تستخدم MARKDOWN أو الخط الغامق أو الجداول أو الأحرف الخاصة.`;
  } else {
    // English (Default)
    return `Your role is a language teacher. The user translated the following sentence:

"${question}"

as follows:

"${userAnswer}"

Please politely evaluate the language and spelling based on the answer sentence. IMPORTANT: Please provide the response WITHOUT USING MARKDOWN, only in NEAT AND CLEAN TEXT. Address the following points:

1. Grammar Check
Check if the translation from the source language to the target language is grammatically correct. Result: Correct / Incorrect
Explanation: (if there are errors, explain)

2. Everyday Conversation Alternatives
Other ways to say this sentence in everyday life:
- (alternative 1)
- (alternative 2)
- If any (alternative 3)
- If any (alternative 4)

Give the answers in English in a polite, encouraging, and constructive style. DO NOT USE MARKDOWN, BOLD, TABLES, OR SPECIAL CHARACTERS.`;
  }
}

// Submit answer to AI for evaluation
async function submitTranslation() {
  const apiKey = localStorage.getItem('groq_api_key') || '';
  
  if (!apiKey) {
    alert('Please insert a valid Groq API key. Go to Groq API Guide page to get your API key.');
    return;
  }

  if (!userAnswerTextarea) {
    alert('Error: Translation text area not found.');
    return;
  }

  const answer = userAnswerTextarea.value.trim();
  if (!answer) {
    alert('Please type your translation first.');
    return;
  }

  const question = selectedQuizData[currentIndex].question;
  const model = localStorage.getItem('groq_model') || 'openai/gpt-oss-120b';
  const feedbackLang = localStorage.getItem('feedback_language') || 'en';

  // UI state for loading
  if (evaluationContainer) {
    evaluationContainer.style.display = 'none';
  }
  
  if (evaluationBody) {
    evaluationBody.innerHTML = '';
  }
  
  if (loadingSkeleton) {
    loadingSkeleton.style.display = 'block';
  }

  // Disable controls during request
  if (userAnswerTextarea) {
    userAnswerTextarea.disabled = true;
  }
  
  if (submitAnswerBtn) {
    submitAnswerBtn.disabled = true;
  }
  
  if (prevQuestionBtn) {
    prevQuestionBtn.disabled = true;
  }
  
  if (nextQuestionBtn) {
    nextQuestionBtn.disabled = true;
  }

  try {
    const prompt = buildEvaluationPrompt(question, answer, feedbackLang);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const responseData = await response.json();

    if (response.ok) {
      const content = responseData.choices[0].message.content;
      // Render AI output
      if (evaluationBody) {
        evaluationBody.textContent = content.toString();
      }
      if (evaluationContainer) {
        evaluationContainer.style.display = 'block';
      }
    } else {
      const errMsg = responseData.error?.message || 'Unknown error';
      throw new Error(`Groq API Hatası: ${errMsg} (${response.status})`);
    }
  } catch (err) {
    if (evaluationBody) {
      evaluationBody.innerHTML = `<span style="color: #f44336; font-weight: bold;">Hata:</span> ${err.message}`;
    }
    if (evaluationContainer) {
      evaluationContainer.style.display = 'block';
    }
  } finally {
    // Hide Loading Spinner
    if (loadingSkeleton) {
      loadingSkeleton.style.display = 'none';
    }

    // Re-enable controls
    if (userAnswerTextarea) {
      userAnswerTextarea.disabled = false;
    }
    
    if (submitAnswerBtn) {
      submitAnswerBtn.disabled = false;
    }
    
    if (prevQuestionBtn) {
      prevQuestionBtn.disabled = (currentIndex === 0);
    }
    
    if (nextQuestionBtn) {
      nextQuestionBtn.disabled = (currentIndex === selectedQuizData.length - 1);
    }
  }
}
