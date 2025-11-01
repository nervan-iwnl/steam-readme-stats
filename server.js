// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const widgetRoute = require('./src/routes/widgetRoute');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// все виджеты сюда
app.use('/', widgetRoute);

app.listen(PORT, () => {
  console.log(`steam-readme-stats running on http://localhost:${PORT}`);
});
