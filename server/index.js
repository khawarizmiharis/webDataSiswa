import 'dotenv/config';
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const studentsPath = join(serverDirectory, 'data', 'students.json');
const frontendDirectory = join(serverDirectory, '..', 'client', 'dist');
const app = express();
const port = Number(process.env.PORT) || 3001;
const sessionCookieName = 'portal-admin-session';
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const failedLoginWindowMs = 15 * 60 * 1000;
const maxFailedLogins = 5;
const sessions = new Map();
const loginAttempts = new Map();
const sessionSecret = process.env.SESSION_SECRET || '';
const credentialsConfigured = Boolean(
  process.env.ADMIN_USERNAME &&
  process.env.ADMIN_PASSWORD &&
  sessionSecret.length >= 32
);

mkdirSync(dirname(studentsPath), { recursive: true });
if (!existsSync(studentsPath)) writeFileSync(studentsPath, '[]\n', 'utf8');

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));

function configuredForLogin(response) {
  if (credentialsConfigured) return true;
  response.status(503).json({
    error: 'Login belum dikonfigurasi. Atur ADMIN_USERNAME, ADMIN_PASSWORD, dan SESSION_SECRET di file .env.'
  });
  return false;
}

function equalSecret(actual, expected) {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function signSession(value) {
  return createHmac('sha256', sessionSecret).update(value).digest('base64url');
}

function readSessionCookie(request) {
  const cookieHeader = request.headers.cookie || '';
  const encodedCookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`))
    ?.slice(sessionCookieName.length + 1);
  if (!encodedCookie) return null;

  const separator = encodedCookie.lastIndexOf('.');
  if (separator <= 0) return null;
  const value = encodedCookie.slice(0, separator);
  const signature = encodedCookie.slice(separator + 1);
  if (!equalSecret(signature, signSession(value))) return null;

  try {
    const payload = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    const session = sessions.get(payload.id);
    if (!session || session.expiresAt <= Date.now() ||
      session.username !== payload.username || payload.expiresAt !== session.expiresAt) {
      sessions.delete(payload.id);
      return null;
    }
    return { id: payload.id, username: session.username };
  } catch {
    return null;
  }
}

function setSessionCookie(response, session) {
  const value = Buffer.from(JSON.stringify({
    id: session.id,
    username: session.username,
    expiresAt: session.expiresAt
  })).toString('base64url');
  const cookie = `${sessionCookieName}=${value}.${signSession(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(sessionLifetimeMs / 1000)}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
  response.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(response) {
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
}

function requireAdmin(request, response, next) {
  if (!configuredForLogin(response)) return;
  const session = readSessionCookie(request);
  if (!session) return response.status(401).json({ error: 'Silakan login sebagai admin.' });
  request.adminSession = session;
  return next();
}

function loginRateLimit(request, response, next) {
  const ip = request.ip;
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.count >= maxFailedLogins && attempts.resetAt > Date.now()) {
    return response.status(429).json({ error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' });
  }
  if (attempts && attempts.resetAt <= Date.now()) loginAttempts.delete(ip);
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of loginAttempts) {
    if (attempts.resetAt <= now) loginAttempts.delete(ip);
  }
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}, 5 * 60 * 1000).unref();

function readStudents() {
  return JSON.parse(readFileSync(studentsPath, 'utf8'));
}

function writeStudents(students) {
  const temporaryPath = `${studentsPath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(students, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, studentsPath);
}

function validateStudent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Data siswa harus berupa objek.';
  }

  const limits = { name: 100, nis: 30, className: 30, major: 60, email: 120 };
  for (const [field, maxLength] of Object.entries(limits)) {
    if (typeof body[field] !== 'string' || !body[field].trim()) {
      return `Kolom ${field} wajib diisi.`;
    }
    if (body[field].trim().length > maxLength) {
      return `Kolom ${field} maksimal ${maxLength} karakter.`;
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return 'Format email tidak valid.';
  }
  return null;
}

function hasDuplicateNis(students, nis, currentId) {
  return students.some((student) =>
    student.id !== currentId && student.nis.toLocaleLowerCase('id') === nis.toLocaleLowerCase('id')
  );
}

app.get('/api/students', (request, response) => {
  response.json(readStudents());
});

app.get('/api/auth/session', (request, response) => {
  if (!configuredForLogin(response)) return;
  const session = readSessionCookie(request);
  if (!session) return response.status(401).json({ error: 'Silakan login sebagai admin.' });
  return response.json({ username: session.username });
});

app.post('/api/auth/login', loginRateLimit, (request, response) => {
  if (!configuredForLogin(response)) return;
  const { username, password } = request.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' ||
    !equalSecret(username, process.env.ADMIN_USERNAME) ||
    !equalSecret(password, process.env.ADMIN_PASSWORD)) {
    const attempts = loginAttempts.get(request.ip);
    if (!attempts || attempts.resetAt <= Date.now()) {
      loginAttempts.set(request.ip, { count: 1, resetAt: Date.now() + failedLoginWindowMs });
    } else {
      attempts.count += 1;
    }
    return response.status(401).json({ error: 'Username atau password salah.' });
  }

  loginAttempts.delete(request.ip);
  const session = {
    id: randomUUID(),
    username: process.env.ADMIN_USERNAME,
    expiresAt: Date.now() + sessionLifetimeMs
  };
  sessions.set(session.id, session);
  setSessionCookie(response, session);
  return response.json({ username: session.username });
});

app.post('/api/auth/logout', requireAdmin, (request, response) => {
  sessions.delete(request.adminSession.id);
  clearSessionCookie(response);
  return response.status(204).end();
});

app.post('/api/students', requireAdmin, (request, response) => {
  const validationError = validateStudent(request.body);
  if (validationError) return response.status(400).json({ error: validationError });

  const students = readStudents();
  const student = Object.fromEntries(
    ['name', 'nis', 'className', 'major', 'email']
      .map((field) => [field, request.body[field].trim()])
  );
  if (hasDuplicateNis(students, student.nis)) {
    return response.status(409).json({ error: 'NIS sudah digunakan siswa lain.' });
  }

  student.id = randomUUID();
  students.push(student);
  writeStudents(students);
  return response.status(201).json(student);
});

app.put('/api/students/:id', requireAdmin, (request, response) => {
  const validationError = validateStudent(request.body);
  if (validationError) return response.status(400).json({ error: validationError });

  const students = readStudents();
  const index = students.findIndex((student) => student.id === request.params.id);
  if (index === -1) return response.status(404).json({ error: 'Data siswa tidak ditemukan.' });

  const student = Object.fromEntries(
    ['name', 'nis', 'className', 'major', 'email']
      .map((field) => [field, request.body[field].trim()])
  );
  if (hasDuplicateNis(students, student.nis, request.params.id)) {
    return response.status(409).json({ error: 'NIS sudah digunakan siswa lain.' });
  }

  student.id = request.params.id;
  students[index] = student;
  writeStudents(students);
  return response.json(student);
});

app.delete('/api/students/:id', requireAdmin, (request, response) => {
  const students = readStudents();
  const remainingStudents = students.filter((student) => student.id !== request.params.id);
  if (remainingStudents.length === students.length) {
    return response.status(404).json({ error: 'Data siswa tidak ditemukan.' });
  }

  writeStudents(remainingStudents);
  return response.status(204).end();
});

if (existsSync(frontendDirectory)) {
  app.use(express.static(frontendDirectory));
  app.get(/.*/, (request, response) => {
    response.sendFile(join(frontendDirectory, 'index.html'));
  });
}

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Format JSON pada permintaan tidak valid.' });
  }
  console.error(error);
  return response.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(port, () => {
  console.log(`Server katalog siswa berjalan di http://localhost:${port}`);
});
