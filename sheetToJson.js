// sheetToJson.js
// Convert Google Sheets URL to CSV link
function convertToCsvLink(sheetUrl) {
  const regexWithGid = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/.*gid=([0-9]+)/;
  const regexWithUsp = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit\?usp=drivesdk/;
  const matchWithUsp = sheetUrl.match(regexWithUsp);
  if (matchWithUsp) {
    const sheetId = matchWithUsp[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
  }

  const matchWithGid = sheetUrl.match(regexWithGid);
  if (matchWithGid) {
    const sheetId = matchWithGid[1];
    const gid = matchWithGid[2];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  // Handle generic edit link (default gid 0)
  const regexGeneric = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const matchGeneric = sheetUrl.match(regexGeneric);
  if (matchGeneric) {
    const sheetId = matchGeneric[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
  }

  throw new Error('Geçersiz Google Sheets linki. Lütfen tam linki girin.');
}

// Robust CSV Parser for columns A and C (with backward compatibility for ',|,' split)
function parseCsvColumnsAC(csvText) {
  const lines = csvText.split(/\r?\n/);
  const quizData = [];
  
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    
    // Backward compatibility for old ',|,' format
    if (line.includes(',|,')) {
      const parts = line.split(',|,');
      const colA = parts[0].replace(/^"|"$/g, '').trim();
      const colB = parts[1].replace(/^"|"$/g, '').trim();
      if (colA && colA !== 'ColumnA' && colA !== 'Column A') {
        quizData.push({ ColumnA: colA, ColumnB: colB });
      }
      continue;
    }
    
    // Standard CSV parser respecting double quotes
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    
    // Clean outer quotes and escape quotes
    const cleanedFields = fields.map(val => {
      let cleaned = val.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }
      return cleaned.replace(/""/g, '"').trim();
    });
    
    const colA = cleanedFields[0] || '';
    const colC = cleanedFields[2] || '';
    
    // Ignore header rows
    if (colA && 
        colA !== 'ColumnA' && 
        colA !== 'Column A' && 
        colA !== 'Frage' && 
        colA !== 'Fragen' && 
        colA !== 'Türkçe' && 
        colA !== 'Turkish' &&
        colA.toLowerCase() !== 'türkçe' &&
        colA.toLowerCase() !== 'turkish') {
      // Map to ColumnA (Turkish) and ColumnB (Deutsch) for selectColumnGenerateQuestion.js
      quizData.push({ 
        ColumnA: colA, 
        ColumnB: colC 
      });
    }
  }
  return quizData;
}

// Function to handle loading questions from a specific sheet url
async function handleLoadSheet(sheetUrl) {
  try {
    const csvLink = convertToCsvLink(sheetUrl);
    const response = await fetch(csvLink);
    if (!response.ok) {
      throw new Error(`Google Sheets bağlantı hatası: ${response.statusText}`);
    }
    const csvText = await response.text();
    const quizData = parseCsvColumnsAC(csvText);
    
    if (quizData.length === 0) {
      alert('Bu listede kelime bulunamadı.');
      return;
    }
    
    // Save JSON data to localStorage
    localStorage.setItem('jsonData', JSON.stringify(quizData));
    localStorage.setItem('quizData', JSON.stringify(quizData));
    
    // Redirect the user to the Select Column page
    window.location.href = 'selectColumnGenerateQuestion.html';
  } catch (error) {
    alert(`Hata: ${error.message}`);
    console.error('Error loading sheet:', error);
  }
}

// Dynamically Load Categories from Master Sheet
async function loadCategories() {
  const loadingIndicator = document.getElementById('loading-indicator');
  const categoriesContainer = document.getElementById('categories-container');
  
  try {
    // The master database URL for memorizeAsListV2
    const masterUrl = 'https://docs.google.com/spreadsheets/d/1kgq4o030nC2Zdi16KMjCkMNVDhnKTILyaSPGFdlWrxw/edit?gid=2074365192#gid=2074365192';
    const csvLink = convertToCsvLink(masterUrl);
    
    const response = await fetch(csvLink);
    if (!response.ok) throw new Error('Veritabanı yüklenemedi.');
    const csvText = await response.text();
    
    const lines = csvText.split(/\r?\n/);
    const categories = [];
    let currentCategory = null;
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Parse CSV line
      const fields = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());
      
      // Clean quotes
      const cleanedFields = fields.map(val => {
        let cleaned = val.trim();
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        return cleaned.replace(/""/g, '"').trim();
      });
      
      const colA = cleanedFields[0] || '';
      const colB = cleanedFields[1] || '';
      
      if (!colA || colA.startsWith('CBJ') || colA === 'ColumnA' || colA === 'Name' || colA === 'Category') continue;
      
      if (!colB || !colB.startsWith('http')) {
        // It's a category header
        currentCategory = { name: colA, items: [] };
        categories.push(currentCategory);
      } else {
        // It's a list item
        const item = { name: colA, url: colB };
        if (!currentCategory) {
          currentCategory = { name: 'Genel / General', items: [] };
          categories.push(currentCategory);
        }
        currentCategory.items.push(item);
      }
    }
    
    // Render dynamic elements
    categoriesContainer.innerHTML = '';
    categories.forEach(cat => {
      if (cat.items.length === 0) return;
      
      const header = document.createElement('button');
      header.className = 'accordion-header';
      header.textContent = cat.name;
      
      const content = document.createElement('div');
      content.className = 'accordion-content';
      
      cat.items.forEach(item => {
        const itemBtn = document.createElement('button');
        itemBtn.textContent = item.name;
        itemBtn.addEventListener('click', () => handleLoadSheet(item.url));
        content.appendChild(itemBtn);
      });
      
      header.addEventListener('click', function () {
        const isActive = this.classList.contains('active');
        
        // Close all accordion panels
        document.querySelectorAll('.accordion-header').forEach(h => {
          h.classList.remove('active');
        });
        document.querySelectorAll('.accordion-content').forEach(c => {
          c.style.display = 'none';
        });
        
        if (!isActive) {
          this.classList.add('active');
          content.style.display = 'flex';
        }
      });
      
      categoriesContainer.appendChild(header);
      categoriesContainer.appendChild(content);
    });
    
    // Toggle displays
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    categoriesContainer.style.display = 'flex';
    
  } catch (error) {
    if (loadingIndicator) {
      loadingIndicator.textContent = `❌ Hata: ${error.message}`;
      loadingIndicator.style.color = '#ef4444';
    }
    console.error('Error loading master categories:', error);
  }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  
  const closeButton = document.getElementById('closeButton');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
});


