import { useEffect, useState } from 'react';

async function request(path, options) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options && options.headers),
      ...(options && options.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  const result = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(result?.error || 'Permintaan gagal. Silakan coba lagi.');
    error.status = response.status;
    throw error;
  }
  return result;
}

function Header({ isAdmin, onLogout }) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Portal Sekolah, beranda">
        <span className="brand-mark" aria-hidden="true">S</span>
        <span>Portal<span className="brand-light">Sekolah</span></span>
      </a>
      <nav className="site-nav" aria-label="Navigasi utama">
        {isAdmin ? (
          <>
            <a className="nav-link" href="/">Lihat katalog <span aria-hidden="true">↗</span></a>
            <a className="nav-link active" href="/admin" aria-current="page">Dashboard admin</a>
            {onLogout && <button className="nav-link nav-button" type="button" onClick={onLogout}>Keluar</button>}
          </>
        ) : (
          <>
            <a className="nav-link active" href="/" aria-current="page">Katalog siswa</a>
            <a className="nav-link" href="/admin">Dashboard admin <span aria-hidden="true">↗</span></a>
          </>
        )}
      </nav>
    </header>
  );
}

function Footer({ isAdmin }) {
  return (
    <footer className="site-footer">
      <span>© 2025 PortalSekolah</span>
      <span>{isAdmin ? 'Dashboard admin · Pengelolaan katalog' : 'Informasi siswa, satu tempat.'}</span>
    </footer>
  );
}

function Notice({ message, error = false }) {
  if (!message) return null;
  return <p className={`notice${error ? ' error' : ''}`} role="status">{message}</p>;
}

function AdminLogin({ onLogin, initialError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await onLogin(username.trim(), password);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell admin-shell login-shell">
      <div className="login-layout">
        <section className="login-visual" aria-label="Portal pengelolaan sekolah">
          <div className="login-visual-orbit login-orbit-one" />
          <div className="login-visual-orbit login-orbit-two" />
          <div className="login-visual-content">
            <span className="login-visual-kicker"><span className="status-dot" /> PORTAL PENGELOLAAN SEKOLAH</span>
            <h1>Satu tempat<br />untuk mengelola<br /><span>masa depan.</span></h1>
            <p>Kelola informasi siswa dengan lebih mudah, rapi, dan terarah.</p>
            <div className="login-visual-footer">
              <span className="login-visual-icon" aria-hidden="true">✳</span>
              <span><strong>PortalSekolah</strong><small>Panel administrator</small></span>
            </div>
          </div>
          <div className="login-float-card" aria-hidden="true">
            <span className="login-float-icon">✓</span>
            <span><strong>Data tersimpan</strong><small>Informasi sekolah terorganisir</small></span>
          </div>
          <span className="login-visual-sparkle sparkle-top" aria-hidden="true">✦</span>
          <span className="login-visual-sparkle sparkle-bottom" aria-hidden="true">✳</span>
        </section>
        <section className="login-panel" aria-labelledby="login-heading">
          <div className="login-heading">
            <span className="login-lock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
              </svg>
            </span>
            <p className="eyebrow muted-eyebrow">SELAMAT DATANG KEMBALI</p>
            <h2 id="login-heading">Login admin</h2>
            <p className="hero-description">Masuk dengan akun administrator untuk melanjutkan.</p>
          </div>
          <Notice message={error} error />
          <form onSubmit={submit}>
            <div className="form-grid login-fields">
              <label className="field">
                <span>Username</span>
                <input name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required maxLength={100} placeholder="Masukkan username" />
              </label>
              <label className="field">
                <span>Password</span>
                <input name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required maxLength={200} placeholder="Masukkan password" />
              </label>
            </div>
            <button className="button button-primary login-submit" type="submit" disabled={submitting}>
              {submitting ? 'Memeriksa...' : <>Masuk ke dashboard <span aria-hidden="true">→</span></>}
            </button>
          </form>
          <p className="login-secure-note"><span aria-hidden="true">●</span> Akses aman khusus administrator</p>
        </section>
      </div>
    </main>
  );
}

function StudentCard({ student }) {
  const initials = student.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <article className="student-card">
      <div className="student-card-top">
        <span className="student-avatar" aria-hidden="true">{initials}</span>
        <div>
          <h3>{student.name}</h3>
          <span className="student-nis-label">NIS {student.nis}</span>
        </div>
      </div>
      <dl className="student-details">
        <div><dt>Kelas</dt><dd>{student.className}</dd></div>
        <div><dt>Jurusan</dt><dd>{student.major}</dd></div>
        <div className="email-detail"><dt>Email</dt><dd>{student.email}</dd></div>
      </dl>
    </article>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" /> PORTAL DATA SEKOLAH</p>
        <h1>Kenali siswa<br />kami lebih dekat.</h1>
        <p className="hero-description">Jelajahi katalog siswa dan temukan informasi berdasarkan nama, kelas, atau jurusan.</p>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-card">
          <span className="art-avatar">✳</span>
          <span className="art-line" />
          <span className="art-line short" />
          <span className="art-chip">DATA SISWA</span>
        </div>
        <span className="art-sparkle sparkle-one">✦</span>
        <span className="art-sparkle sparkle-two">✳</span>
      </div>
    </section>
  );
}

function Catalog({ students, loading, error }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('id');
  const filteredStudents = students.filter((student) =>
    [student.name, student.nis, student.className, student.major]
      .some((value) => value.toLocaleLowerCase('id').includes(normalizedQuery))
  );

  return (
    <main className="page-shell">
      <Hero />
      <section className="catalog-section" aria-labelledby="catalog-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow muted-eyebrow">DIREKTORI SEKOLAH</p>
            <h2 id="catalog-heading">Katalog siswa</h2>
          </div>
          <div className="student-count"><strong>{students.length}</strong><span>siswa terdaftar</span></div>
        </div>
        <label className="search-box">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <span className="sr-only">Cari siswa</span>
          <input
            type="search"
            placeholder="Cari nama, NIS, kelas, atau jurusan..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
          <kbd>⌘ K</kbd>
        </label>
        <Notice message={error} error />
        {loading ? (
          <p className="empty-state" role="status">Memuat data siswa...</p>
        ) : filteredStudents.length ? (
          <div className="student-grid" aria-live="polite">
            {filteredStudents.map((student) => <StudentCard key={student.id} student={student} />)}
          </div>
        ) : (
          <p className="empty-state">{error ? 'Data siswa belum dapat ditampilkan.' : 'Tidak ada siswa yang cocok dengan pencarian.'}</p>
        )}
      </section>
    </main>
  );
}

const EMPTY_FORM = { name: '', nis: '', className: '', major: '', email: '' };

function StudentForm({ student, onSubmit, onCancel, saving }) {
  const [values, setValues] = useState(student || EMPTY_FORM);
  const isEditing = Boolean(student);

  useEffect(() => {
    setValues(student || EMPTY_FORM);
  }, [student]);

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitForm(event) {
    event.preventDefault();
    onSubmit(Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()])
    ));
  }

  return (
    <section className="form-panel" aria-labelledby="form-heading">
      <div className="form-panel-heading">
        <div>
          <p className="eyebrow muted-eyebrow">FORMULIR DATA</p>
          <h2 id="form-heading">{isEditing ? 'Edit data siswa' : 'Tambah siswa'}</h2>
        </div>
        <button className="icon-button" type="button" aria-label="Tutup formulir" onClick={onCancel}>×</button>
      </div>
      <form onSubmit={submitForm}>
        <div className="form-grid">
          <label className="field"><span>Nama lengkap</span><input name="name" value={values.name} onChange={updateField} required maxLength={100} placeholder="Contoh: Alya Putri" /></label>
          <label className="field"><span>Nomor induk siswa (NIS)</span><input name="nis" value={values.nis} onChange={updateField} required maxLength={30} placeholder="Contoh: 2025001" /></label>
          <label className="field"><span>Kelas</span><input name="className" value={values.className} onChange={updateField} required maxLength={30} placeholder="Contoh: XII IPA 1" /></label>
          <label className="field"><span>Jurusan</span><input name="major" value={values.major} onChange={updateField} required maxLength={60} placeholder="Contoh: Ilmu Pengetahuan Alam" /></label>
          <label className="field field-wide"><span>Email</span><input name="email" type="email" value={values.email} onChange={updateField} required maxLength={120} placeholder="nama@email.com" /></label>
        </div>
        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>Batal</button>
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan data'}</button>
        </div>
      </form>
    </section>
  );
}

function Admin({ students, loading, error, reload, onLogout }) {
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messageIsError, setMessageIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  function openForm(student = null) {
    setEditing(student);
    setFormOpen(true);
    setMessage('');
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function saveStudent(values) {
    setSaving(true);
    setMessage('');
    try {
      await request(editing ? `/api/students/${encodeURIComponent(editing.id)}` : '/api/students', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(values)
      });
      closeForm();
      await reload();
      setMessage(editing ? 'Data siswa berhasil diperbarui.' : 'Siswa berhasil ditambahkan.');
      setMessageIsError(false);
    } catch (saveError) {
      if (saveError.status === 401) onLogout();
      setMessage(saveError.message);
      setMessageIsError(true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Hapus data ${student.name}?`)) return;
    setMessage('');
    try {
      await request(`/api/students/${encodeURIComponent(student.id)}`, { method: 'DELETE' });
      await reload();
      setMessage(`Data ${student.name} berhasil dihapus.`);
      setMessageIsError(false);
    } catch (deleteError) {
      if (deleteError.status === 401) onLogout();
      setMessage(deleteError.message);
      setMessageIsError(true);
    }
  }

  return (
    <main className="page-shell admin-shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow muted-eyebrow">RUANG PENGELOLAAN</p>
          <h1>Dashboard admin</h1>
          <p className="hero-description">Kelola informasi siswa yang tampil di katalog.</p>
        </div>
        <button className="button button-primary" type="button" onClick={() => openForm()}><span aria-hidden="true">＋</span> Tambah siswa</button>
      </div>

      <Notice message={message} error={messageIsError} />
      <Notice message={error} error />
      {formOpen && <StudentForm student={editing} onSubmit={saveStudent} onCancel={closeForm} saving={saving} />}

      <section className="admin-table-card" aria-labelledby="table-heading">
        <div className="table-card-heading">
          <div>
            <h2 id="table-heading">Data siswa</h2>
            <p>Daftar seluruh siswa yang tersimpan di katalog.</p>
          </div>
          <span className="table-count">{students.length} siswa</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Nama siswa</th><th>NIS</th><th>Kelas</th><th>Jurusan</th><th>Email</th><th><span className="sr-only">Aksi</span></th></tr></thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td><td>{student.nis}</td><td>{student.className}</td><td>{student.major}</td><td>{student.email}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action" type="button" onClick={() => openForm(student)} aria-label={`Edit ${student.name}`}>Edit</button>
                      <button className="row-action delete" type="button" onClick={() => deleteStudent(student)} aria-label={`Hapus ${student.name}`}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && students.length === 0 && <p className="empty-state table-empty">{error ? 'Data belum dapat dimuat.' : 'Belum ada data siswa. Tambahkan siswa untuk memulai.'}</p>}
          {loading && <p className="empty-state table-empty" role="status">Memuat data siswa...</p>}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authChecking, setAuthChecking] = useState(isAdmin);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    document.title = isAdmin ? 'Dashboard Admin — Portal Sekolah' : 'Katalog Siswa — Portal Sekolah';
  }, [isAdmin]);

  async function reload() {
    try {
      setStudents(await request('/api/students'));
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (!isAdmin) {
      reload();
      return () => { active = false; };
    }

    request('/api/auth/session')
      .then(async () => {
        if (!active) return;
        setIsAuthenticated(true);
        setAuthError('');
        await reload();
      })
      .catch((sessionError) => {
        if (!active) return;
        setIsAuthenticated(false);
        setLoading(false);
        if (sessionError.status !== 401) setAuthError(sessionError.message);
      })
      .finally(() => {
        if (active) setAuthChecking(false);
      });

    return () => { active = false; };
  }, []);

  async function login(username, password) {
    await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setIsAuthenticated(true);
    setAuthError('');
    setLoading(true);
    await reload();
  }

  async function logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (logoutError) {
      if (logoutError.status !== 401) setAuthError(logoutError.message);
    }
    setStudents([]);
    setIsAuthenticated(false);
    setLoading(false);
  }

  return (
    <>
      <Header isAdmin={isAdmin} onLogout={isAdmin && isAuthenticated ? logout : null} />
      {isAdmin
        ? authChecking
          ? <main className="page-shell admin-shell"><p className="empty-state" role="status">Memeriksa sesi admin...</p></main>
          : isAuthenticated
            ? <Admin students={students} loading={loading} error={error} reload={reload} onLogout={logout} />
            : <AdminLogin onLogin={login} initialError={authError} />
        : <Catalog students={students} loading={loading} error={error} />}
      <Footer isAdmin={isAdmin} />
    </>
  );
}
