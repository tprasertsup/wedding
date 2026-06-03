const express = require('express');
const { config } = require('./src/config');
const { corsMiddleware } = require('./src/cors');
const { loginAdmin, requireAdmin } = require('./src/auth');
const { initUpload, completeUpload } = require('./src/uploads');
const { readSubmissions, updateSubmission, exportSubmissionsCsv } = require('./src/sheets');

const app = express();

app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'nine-tom-guestbook-api' });
});

app.post('/api/admin/login', loginAdmin);
app.get('/api/admin/submissions', requireAdmin, async (req, res, next) => {
  try {
    res.json({ success: true, submissions: await readSubmissions() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/update-status', requireAdmin, async (req, res, next) => {
  try {
    const submission = await updateSubmission(req.body);
    res.json({ success: true, submission });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/export.csv', requireAdmin, async (req, res, next) => {
  try {
    const csv = await exportSubmissionsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="nine-tom-guestbook-submissions.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

app.post('/api/upload/init', async (req, res, next) => {
  try {
    res.json(await initUpload(req.body));
  } catch (error) {
    next(error);
  }
});

app.post('/api/upload/complete', async (req, res, next) => {
  try {
    res.json(await completeUpload(req.body));
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found.' });
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const safeMessage = status >= 500 ? 'Server error.' : error.message;
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, error: safeMessage });
});

app.listen(config.port, () => {
  console.log(`Guestbook API listening on ${config.port}`);
});

