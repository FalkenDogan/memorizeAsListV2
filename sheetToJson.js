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

  throw new Error('Geçersiz Google Sheets linki. Lütfen tam linki girin.');
}



// Fetch CSV data from Google Sheets and convert it to JSON
// Google Sheets'ten CSV verilerini al ve JSON'a çevir
async function fetchGoogleSheetData(sheetUrl) {
  const response = await fetch(sheetUrl);
  if (!response.ok) {
    throw new Error(`Google Sheets linki hatalı: ${response.statusText}`);
  }
  const csvData = await response.text();

  // Convert CSV to JSON format
  const rows = csvData.split('\n');
  return rows
  .filter(row => row.trim() !== '') // boş satırları atla
  .map(row => {
    const [ColumnA, ColumnB] = row.split(',|,');
    return { ColumnA: ColumnA?.trim(), ColumnB: ColumnB?.trim() };
  });

  
}

// Process user input to create a quiz and redirect to the next page
document.querySelectorAll('#generate-json').forEach(button => {
  button.addEventListener('click', async () => {
    const sheetLink = button.getAttribute('data-link');

    try {
      // Convert Google Sheets data to JSON
      const csvLink = convertToCsvLink(sheetLink);
      const jsonData = await fetchGoogleSheetData(csvLink);

      // Save JSON data to localStorage
      localStorage.setItem('jsonData', JSON.stringify(jsonData));

      // Redirect the user to the Select Column page
      window.location.href = 'selectColumnGenerateQuestion.html';
    } catch (error) {
      alert(`Hata: ${error.message}`);
      console.error('Hata:', error);
    }
  });
});