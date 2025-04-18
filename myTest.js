// Google Sheets linkini CSV bağlantısına dönüştür
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

// Google Sheets'ten CSV verilerini al ve JSON'a çevir
async function fetchGoogleSheetData(sheetUrl) {
  const response = await fetch(sheetUrl);
  if (!response.ok) {
    throw new Error(`Google Sheets linki hatalı: ${response.statusText}`);
  }
  const csvData = await response.text();

  const rows = csvData.split('\n');
  return rows
    .filter(row => row.trim() !== '') // boş satırları atla
    .map(row => {
      const [ColumnA, ColumnB] = row.split(',|,');
      return { ColumnA: ColumnA?.trim(), ColumnB: ColumnB?.trim() };
    });
}

// Kullanıcının girdiği linki işle ve JSON verisine dönüştür
document.getElementById('generate-json').addEventListener('click', async () => {
  const sheetLink = document.getElementById('sheet-link').value;

  try {
    const csvLink = convertToCsvLink(sheetLink);
    const jsonData = await fetchGoogleSheetData(csvLink);

    // JSON veriyi localStorage'a kaydet
    localStorage.setItem('jsonData', JSON.stringify(jsonData));

    // Quiz üretimi bir sonraki sayfada yapılacak
    window.location.href = 'selectColumnGenerateQuestion.html';
  } catch (error) {
    alert(`Hata: ${error.message}`);
    console.error('Hata:', error);
  }
});

document.getElementById('closeButton').addEventListener('click', function () {
  window.location.href = 'index.html';
});
