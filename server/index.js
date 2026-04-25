const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('node:fs/promises');
const path = require('node:path');
const iconv = require('iconv-lite');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5001;
const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

const projectRoot = path.resolve(__dirname, '..');
const datasetDir = path.join(projectRoot, 'dataset');

const datasetFiles = {
  scenic: 'Scenic_Spot_C_f.csv',
  hotel: '臺北市一般旅館名冊.csv',
  hostel: '臺北市民宿名冊.csv',
  busStops: '8_站牌.csv',
  touristService: '臺北市旅遊服務中心服務據點資訊1140919.csv',
};

// Map files to their probable encodings
const fileEncodings = {
  'Scenic_Spot_C_f.csv': 'utf8',
  '臺北市一般旅館名冊.csv': 'big5',
  '臺北市民宿名冊.csv': 'big5',
  '8_站牌.csv': 'utf8',
  '臺北市旅遊服務中心服務據點資訊1140919.csv': 'big5',
  '臺北市借問站據點資訊1140919.csv': 'big5',
  '臺北市臺北旅遊網住宿資料(中文).csv': 'big5',
  '附件2-臺北旅遊網景點資料中文(更1140715 (1).csv': 'big5',
};

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function parseCsvLine(line) {
  const columns = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      columns.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  columns.push(current.trim());
  return columns;
}

async function readCsvRecords(fileName, limit = 10) {
  const filePath = path.join(datasetDir, fileName);
  const buffer = await fs.readFile(filePath);
  const encoding = fileEncodings[fileName] || 'utf8';
  const content = iconv.decode(buffer, encoding);
  
  // Clean up BOM if present
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1, limit + 1).map((line) => {
    const values = parseCsvLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    return record;
  });
}

async function getFileLineCount(fileName) {
  const filePath = path.join(datasetDir, fileName);
  const buffer = await fs.readFile(filePath);
  const encoding = fileEncodings[fileName] || 'utf8';
  const content = iconv.decode(buffer, encoding);
  const rows = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  return Math.max(rows.length - 1, 0);
}

async function fetchPythonHealth() {
  try {
    const response = await fetch(`${pythonBackendUrl}/health`);
    if (!response.ok) {
      throw new Error(`Python health check failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return {
      status: 'unavailable',
      service: 'python-ai-backend',
      reason: error.message,
    };
  }
}

app.get('/api/health', async (_req, res) => {
  const python = await fetchPythonHealth();

  res.json({
    status: 'ok',
    service: 'taipei-vibe-api-gateway',
    timestamp: new Date().toISOString(),
    python,
  });
});

app.get('/api/datasets/overview', async (_req, res) => {
  try {
    const [scenicCount, hotelCount, hostelCount, busStopCount, serviceCenterCount] = await Promise.all([
      getFileLineCount(datasetFiles.scenic),
      getFileLineCount(datasetFiles.hotel),
      getFileLineCount(datasetFiles.hostel),
      getFileLineCount(datasetFiles.busStops),
      getFileLineCount(datasetFiles.touristService),
    ]);

    res.json({
      scenicCount,
      hotelCount,
      hostelCount,
      busStopCount,
      serviceCenterCount,
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to read datasets: ${error.message}` });
  }
});

// Map numeric Class1 codes from Scenic_Spot_C_f.csv to human-readable Chinese labels
const CATEGORY_LABELS = {
  '1': '觀光工廠', '2': '歷史建築', '3': '古蹟', '4': '博物館', '5': '藝文空間',
  '6': '自然景觀', '7': '主題公園', '8': '夜市', '9': '購物', '10': '宗教場所',
  '11': '溫泉', '12': '海洋休閒', '13': '登山步道', '14': '文創園區', '15': '農場體驗',
};

function mapCategory(raw) {
  if (!raw) return '旅遊景點';
  return CATEGORY_LABELS[raw.trim()] || raw.trim() || '旅遊景點';
}

app.get('/api/spots', async (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 8));

  try {
    const rows = await readCsvRecords(datasetFiles.scenic, limit);
    const normalized = rows
      .filter(row => (row.Name || row.stitle || row.名稱) && (row.Zone === '' || row.Zone || true))
      .map((row, index) => ({
        id: index + 1,
        name: (row.Name || row.stitle || row.名稱 || row.旅館名稱 || row.景點名稱 || '').trim(),
        category: mapCategory(row.Class1 || row.CAT1 || row.CAT2 || row.類別 || row.Orgclass),
        location: (row.Add || row.address || row.地址 || row.營業地址 || row.Town || 'Taipei').trim(),
        description: (row.Description || row.xbody || row.簡介 || row.Toldescribe || '').trim(),
        lat: parseFloat(row.Py || row.lat || 0),
        lng: parseFloat(row.Px || row.lng || 0),
        website: row.Website || '',
      }))
      .filter(s => s.name); // remove any rows without a name

    res.json({ spots: normalized });
  } catch (error) {
    res.status(500).json({ error: `Failed to parse scenic spots: ${error.message}` });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const response = await fetch(`${pythonBackendUrl}/posts`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const response = await fetch(`${pythonBackendUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const response = await fetch(`${pythonBackendUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.post('/api/plan', async (req, res) => {
  const payload = req.body || {};

  try {
    const response = await fetch(`${pythonBackendUrl}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python planner failed: ${response.status} ${errorText}`);
    }

    const plannerResult = await response.json();
    res.json(plannerResult);
  } catch (error) {
    res.status(502).json({
      error: error.message,
      fallback: {
        title: 'Taipei Vibe quick fallback',
        summary: 'Python backend unavailable. This is a temporary local route.',
        steps: [
          {
            time: '10:00',
            activity: 'Taipei 101 area walk',
            transport: 'MRT',
            note: 'Start with iconic landmarks.',
          },
          {
            time: '13:00',
            activity: 'Lunch near Xinyi',
            transport: 'Walk',
            note: 'Choose highly rated local restaurants.',
          },
          {
            time: '16:00',
            activity: 'Indoor museum backup',
            transport: 'Bus',
            note: 'Switch here for rain conditions.',
          },
        ],
        safety: ['Verify legal accommodation list before checkout.'],
      },
    });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch(`${pythonBackendUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const response = await fetch(`${pythonBackendUrl}/models`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get('/api/check-hotel', async (req, res) => {
  const query = (req.query.q || '').toLowerCase().trim();
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const [hotels, hostels] = await Promise.all([
      readCsvRecords(datasetFiles.hotel, 1000),
      readCsvRecords(datasetFiles.hostel, 1000)
    ]);
    
    // Combine both arrays
    const allAccommodations = [...hotels, ...hostels];
    
    // Fuzzy search for matching name or URL placeholder
    // The columns might be '旅宿名稱', '名稱', etc. 
    // We will just do a JSON stringify check for simplicity
    const match = allAccommodations.find(acc => {
      const values = Object.values(acc).join(' ').toLowerCase();
      return values.includes(query);
    });

    if (match) {
      // Find name field heuristically
      const name = match['旅館名稱'] || match['民宿名稱'] || match['名稱'] || match.name || 'Unknown Accommodation';
      return res.json({
        legal: true,
        message: `✅ Found legal registration for: ${name}`,
        details: match
      });
    }

    // If not found, return illegal and 3 random recommendations
    const recommendations = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * hotels.length);
      const acc = hotels[randomIndex];
      const name = acc['旅館名稱'] || acc['民宿名稱'] || acc['名稱'] || acc.name || 'Legal Hotel';
      recommendations.push(name);
    }

    return res.json({
      legal: false,
      message: `⚠️ WARNING: "${query}" was not found in the legal accommodation registry. It may be unregistered or illegal.`,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to check accommodation: ${error.message}` });
  }
});

// ── SerpAPI Search endpoints ────────────────────────────────────────────────
const SERP_API_KEY = process.env.SERP_API_KEY;
const SERP_BASE = 'https://serpapi.com/search.json';

// Server-side image cache: spotName → thumbnail URL
const imageCache = new Map();

async function fetchSingleImage(spotName) {
  if (imageCache.has(spotName)) return imageCache.get(spotName);
  if (!SERP_API_KEY) return null;
  try {
    const url = new URL(SERP_BASE);
    url.searchParams.set('engine', 'google_images');
    url.searchParams.set('q', `${spotName} Taipei 景點`);
    url.searchParams.set('num', '3');
    url.searchParams.set('gl', 'tw');
    url.searchParams.set('api_key', SERP_API_KEY);
    const resp = await fetch(url.toString());
    if (!resp.ok) return null;
    const data = await resp.json();
    const first = (data.images_results || []).find(r => r.thumbnail);
    const imgUrl = first?.thumbnail || null;
    imageCache.set(spotName, imgUrl);
    return imgUrl;
  } catch {
    return null;
  }
}

// Batch-fetch images for multiple spot names (comma-separated in ?names=)
app.get('/api/spots/images', async (req, res) => {
  const names = (req.query.names || '').split(',').map(n => n.trim()).filter(Boolean);
  if (!names.length) return res.status(400).json({ error: 'Missing "names" parameter' });

  // Cap at 20 to avoid overwhelming the API
  const batch = names.slice(0, 20);

  // Fetch in parallel (but throttle to 5 concurrent to be polite)
  const results = {};
  const chunks = [];
  for (let i = 0; i < batch.length; i += 5) chunks.push(batch.slice(i, i + 5));

  for (const chunk of chunks) {
    const fetched = await Promise.all(chunk.map(async name => {
      const url = await fetchSingleImage(name);
      return [name, url];
    }));
    fetched.forEach(([name, url]) => { if (url) results[name] = url; });
  }

  res.json({ images: results });
});

app.get('/api/search/text', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query parameter "q"' });

  if (!SERP_API_KEY) return res.status(503).json({ error: 'SerpAPI key not configured' });

  try {
    const url = new URL(SERP_BASE);
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', `${q} Taipei travel`);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('gl', 'tw');
    url.searchParams.set('num', '10');
    url.searchParams.set('api_key', SERP_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`SerpAPI returned ${response.status}`);
    const data = await response.json();

    const results = (data.organic_results || []).map(r => ({
      title: r.title || '',
      snippet: r.snippet || '',
      link: r.link || '',
      displayed_link: r.displayed_link || '',
      favicon: r.favicon || '',
    }));

    res.json({ results, query: q, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search/images', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query parameter "q"' });

  if (!SERP_API_KEY) return res.status(503).json({ error: 'SerpAPI key not configured' });

  try {
    const url = new URL(SERP_BASE);
    url.searchParams.set('engine', 'google_images');
    url.searchParams.set('q', `${q} Taipei`);
    url.searchParams.set('hl', 'en');
    url.searchParams.set('gl', 'tw');
    url.searchParams.set('num', '20');
    url.searchParams.set('api_key', SERP_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`SerpAPI returned ${response.status}`);
    const data = await response.json();

    const images = (data.images_results || []).map(r => ({
      title: r.title || '',
      original: r.original || '',
      thumbnail: r.thumbnail || '',
      source: r.source || '',
      link: r.link || '',
    })).filter(r => r.thumbnail);

    res.json({ images, query: q, total: images.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
  console.log(`Python backend target: ${pythonBackendUrl}`);
});