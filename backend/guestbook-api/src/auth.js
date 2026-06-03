const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { config } = require('./config');
const { httpError } = require('./errors');

function signAdminToken() {
  return jwt.sign({ role: 'admin' }, config.adminJwtSecret, {
    algorithm: 'HS256',
    expiresIn: '12h'
  });
}

async function loginAdmin(req, res, next) {
  try {
    const password = String(req.body.password || '');
    const ok = await bcrypt.compare(password, config.adminPasswordHash);
    if (!ok) throw httpError(401, 'Invalid password.');
    res.json({ success: true, token: signAdminToken() });
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw httpError(401, 'Admin login required.');
    const payload = jwt.verify(match[1], config.adminJwtSecret, { algorithms: ['HS256'] });
    if (payload.role !== 'admin') throw httpError(403, 'Admin access required.');
    req.admin = payload;
    next();
  } catch (error) {
    if (!error.statusCode) error.statusCode = 401;
    next(error);
  }
}

module.exports = { loginAdmin, requireAdmin, signAdminToken };

