const toast = {
  error: msg => iziToast.error({ message: msg, position: 'topRight', timeout: 4000 }),
};

if (!Auth.requireAuth(false)) { /* redirect */ } else {
  Auth.initLayout();
  loadDashboard();
  if (Auth.getUser()?.role === 'mahasiswa') loadAkademik();
}

async function loadDashboard() {
  try {
    const res   = await api.get('/dashboard/stats');
    const stats = res.data;
    renderStatCards(stats);
    renderJurusanChart(stats);
    renderProdiChart(stats);
    document.getElementById('chartSection').style.display = '';
  } catch (err) {
    toast.error(err.message || 'Gagal memuat statistik');
    document.getElementById('statCards').innerHTML =
      '<div class="col-12"><div class="alert alert-danger rounded-3">Gagal memuat data. Coba refresh halaman.</div></div>';
  }
}

function renderStatCards(stats) {
  const cards = [
    { label: 'Total Mahasiswa', value: stats.total_mahasiswa ?? 0,                    icon: 'fa-user-graduate',       bg: 'bg-primary bg-opacity-10', text: 'text-primary',  sub: 'Mahasiswa terdaftar' },
    { label: 'Total Dosen',     value: stats.total_dosen     ?? 0,                    icon: 'fa-chalkboard-teacher',  bg: 'bg-success bg-opacity-10', text: 'text-success',  sub: 'Dosen aktif' },
    { label: 'Program Studi',   value: stats.dosen_per_prodi?.length ?? 0,            icon: 'fa-book-open',           bg: 'bg-warning bg-opacity-10', text: 'text-warning',  sub: 'Prodi tersedia' },
    { label: 'Jurusan',         value: stats.mahasiswa_per_jurusan?.length ?? 0,      icon: 'fa-layer-group',         bg: 'bg-danger  bg-opacity-10', text: 'text-danger',   sub: 'Jurusan aktif' },
  ];

  document.getElementById('statCards').innerHTML = cards.map(c => `
    <div class="col-xl-3 col-sm-6">
      <div class="card border-0 shadow-sm rounded-4 h-100">
        <div class="card-body d-flex align-items-center gap-3 p-4">
          <div class="stat-icon ${c.bg} ${c.text}">
            <i class="fas ${c.icon} fa-lg"></i>
          </div>
          <div>
            <p class="text-muted small fw-semibold text-uppercase mb-0" style="font-size:.7rem;letter-spacing:.05em;">${c.label}</p>
            <h3 class="fw-bold mb-0">${c.value}</h3>
            <p class="text-muted small mb-0">${c.sub}</p>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderJurusanChart(stats) {
  const list  = stats.mahasiswa_per_jurusan || [];
  const total = stats.total_mahasiswa || 1;
  const el    = document.getElementById('jurusanChart');
  if (!list.length) { el.innerHTML = '<p class="text-muted text-center py-4">Belum ada data mahasiswa</p>'; return; }
  el.innerHTML = list.map(item => {
    const pct = Math.round((item.count / total) * 100);
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="fw-semibold small">${esc(item.jurusan)}</span>
          <span class="text-muted small">${item.count} (${pct}%)</span>
        </div>
        <div class="progress rounded-pill">
          <div class="progress-bar bg-primary rounded-pill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderProdiChart(stats) {
  const list  = stats.dosen_per_prodi || [];
  const total = stats.total_dosen || 1;
  const el    = document.getElementById('prodiChart');
  if (!list.length) { el.innerHTML = '<p class="text-muted text-center py-4">Belum ada data dosen</p>'; return; }
  el.innerHTML = list.map(item => {
    const pct = Math.round((item.count / total) * 100);
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="fw-semibold small">${esc(item.prodi)}</span>
          <span class="text-muted small">${item.count} (${pct}%)</span>
        </div>
        <div class="progress rounded-pill">
          <div class="progress-bar bg-success rounded-pill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

async function loadAkademik() {
  document.getElementById('rowAkademik').style.display = '';
  const el = document.getElementById('akademikBody');
  try {
    const res = await api.get('/mahasiswa/me');
    const m   = res.data;
    el.innerHTML = `
      <div class="row align-items-stretch g-3">
        <div class="col-md-7">
          <div class="row g-3">
            ${[
              { icon: 'fa-id-card', bg: 'bg-primary bg-opacity-10', text: 'text-primary', label: 'NIM', value: esc(m.nim) },
              { icon: 'fa-user',    bg: 'bg-info bg-opacity-10',    text: 'text-info',    label: 'Nama', value: esc(m.nama) },
              { icon: 'fa-book',    bg: 'bg-warning bg-opacity-10', text: 'text-warning', label: 'Jurusan', value: esc(m.jurusan) },
              { icon: 'fa-calendar',bg: 'bg-success bg-opacity-10', text: 'text-success', label: 'Semester', value: 'Semester ' + m.semester },
            ].map(item => `
              <div class="col-6">
                <div class="d-flex align-items-center gap-2 p-3 rounded-3 bg-light">
                  <div class="akademik-icon ${item.bg} ${item.text}">
                    <i class="fas ${item.icon} small"></i>
                  </div>
                  <div>
                    <p class="text-muted mb-0" style="font-size:.7rem;">${item.label}</p>
                    <p class="fw-bold mb-0 small">${item.value}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="col-md-5">
          <div class="h-100 p-3 rounded-3 border border-primary border-opacity-25" style="background:#eff6ff;">
            <p class="text-primary fw-bold mb-3" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;">
              <i class="fas fa-chalkboard-teacher me-1"></i>Dosen Pembimbing Akademik
            </p>
            ${m.dosen_pa_nama ? `
              <div class="d-flex align-items-center gap-3">
                <div class="dosen-pa-avatar">${esc(m.dosen_pa_nama[0])}</div>
                <div>
                  <p class="fw-bold mb-1">${esc(m.dosen_pa_nama)}</p>
                  <span class="badge bg-primary">Dosen PA</span>
                </div>
              </div>
            ` : `<p class="text-muted fst-italic mb-0 small">Belum ada Dosen PA yang ditugaskan</p>`}
          </div>
        </div>
      </div>`;
  } catch {
    el.innerHTML = `<div class="text-center text-muted py-3">
      <i class="fas fa-graduation-cap fa-2x mb-2 d-block opacity-50"></i>
      <p class="mb-0">Data akademik belum terhubung ke akun ini.</p>
      <small>Hubungi admin untuk menghubungkan data Anda.</small>
    </div>`;
  }
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
