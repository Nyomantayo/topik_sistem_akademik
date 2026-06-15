toastr.options = { closeButton: true, progressBar: true, positionClass: 'toast-top-right', timeOut: 3000 };

if (!Auth.requireAuth(false)) { /* redirect handled */ } else {
  Auth.initLayout();
  loadDashboard();
  if (Auth.getUser()?.role === 'mahasiswa') loadAkademik();
}

async function loadDashboard() {
  try {
    const res = await api.get('/dashboard/stats');
    const stats = res.data;
    renderStatCards(stats);
    renderJurusanChart(stats);
    renderProdiChart(stats);
    document.getElementById('chartSection').style.display = '';
  } catch (err) {
    toastr.error(err.message || 'Gagal memuat statistik');
    document.getElementById('statCards').innerHTML =
      '<div class="col-12"><div class="alert alert-danger">Gagal memuat data dashboard. Coba refresh halaman.</div></div>';
  }
}

async function loadAkademik() {
  document.getElementById('rowAkademik').style.display = '';
  const el = document.getElementById('akademikBody');
  try {
    const res = await api.get('/mahasiswa/me');
    const m   = res.data;
    el.innerHTML = `
      <div class="row align-items-stretch">

        <!-- Info NIM, Nama, Jurusan, Semester -->
        <div class="col-md-7">
          <div class="row">
            ${[
              { icon: 'fa-id-card',  color: 'text-primary', label: 'NIM',      value: esc(m.nim) },
              { icon: 'fa-user',     color: 'text-info',    label: 'Nama',     value: esc(m.nama) },
              { icon: 'fa-book',     color: 'text-warning', label: 'Jurusan',  value: esc(m.jurusan) },
              { icon: 'fa-calendar', color: 'text-success', label: 'Semester', value: 'Semester ' + m.semester },
            ].map(item => `
              <div class="col-sm-6 mb-3">
                <div class="info-box mb-0 shadow-none border">
                  <span class="info-box-icon ${item.color}" style="background:transparent;font-size:1.4rem;width:50px;">
                    <i class="fas ${item.icon}"></i>
                  </span>
                  <div class="info-box-content">
                    <span class="info-box-text text-muted" style="font-size:.75rem;">${item.label}</span>
                    <span class="info-box-number" style="font-size:1rem;font-weight:600;">${item.value}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Dosen PA -->
        <div class="col-md-5">
          <div class="card card-outline card-primary h-100 mb-0">
            <div class="card-header py-2">
              <h3 class="card-title" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;">
                <i class="fas fa-chalkboard-teacher mr-1 text-primary"></i>Dosen Pembimbing Akademik
              </h3>
            </div>
            <div class="card-body d-flex align-items-center">
              ${m.dosen_pa_nama ? `
                <div class="d-flex align-items-center">
                  <div style="
                    width:56px;height:56px;border-radius:14px;
                    background:#2563eb;color:#fff;
                    display:flex;align-items:center;justify-content:center;
                    font-size:1.5rem;font-weight:700;flex-shrink:0;margin-right:14px;">
                    ${esc(m.dosen_pa_nama[0])}
                  </div>
                  <div>
                    <p class="mb-1 font-weight-bold" style="font-size:1rem;">${esc(m.dosen_pa_nama)}</p>
                    <span class="badge badge-primary">Dosen PA</span>
                  </div>
                </div>
              ` : `
                <div class="text-muted text-center w-100">
                  <i class="fas fa-user-slash fa-2x mb-2 d-block"></i>
                  <span>Belum ada Dosen PA yang ditugaskan</span>
                </div>
              `}
            </div>
          </div>
        </div>

      </div>
    `;
  } catch {
    el.innerHTML = `
      <div class="text-center text-muted py-3">
        <i class="fas fa-graduation-cap fa-2x mb-2"></i>
        <p class="mb-0">Data akademik belum terhubung ke akun ini.</p>
        <small>Hubungi admin untuk menghubungkan data Anda.</small>
      </div>`;
  }
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderStatCards(stats) {
  const cards = [
    { label: 'Total Mahasiswa', value: stats.total_mahasiswa ?? 0, icon: 'fa-user-graduate', color: 'info',    sub: 'Data mahasiswa terdaftar' },
    { label: 'Total Dosen',     value: stats.total_dosen     ?? 0, icon: 'fa-chalkboard-teacher', color: 'success', sub: 'Dosen aktif' },
    { label: 'Program Studi',   value: stats.dosen_per_prodi?.length ?? 0,    icon: 'fa-book-open', color: 'warning', sub: 'Prodi tersedia' },
    { label: 'Jurusan',         value: stats.mahasiswa_per_jurusan?.length ?? 0, icon: 'fa-layer-group', color: 'danger',  sub: 'Jurusan aktif' },
  ];

  document.getElementById('statCards').innerHTML = cards.map(c => `
    <div class="col-lg-3 col-6">
      <div class="small-box bg-${c.color}">
        <div class="inner">
          <h3>${c.value}</h3>
          <p>${c.label}</p>
        </div>
        <div class="icon"><i class="fas ${c.icon}"></i></div>
        <div class="small-box-footer">${c.sub}</div>
      </div>
    </div>
  `).join('');
}

function renderJurusanChart(stats) {
  const list = stats.mahasiswa_per_jurusan || [];
  const total = stats.total_mahasiswa || 1;
  const el = document.getElementById('jurusanChart');

  if (!list.length) {
    el.innerHTML = '<p class="text-muted text-center py-4">Belum ada data mahasiswa</p>';
    return;
  }

  el.innerHTML = list.map(item => {
    const pct = Math.round((item.count / total) * 100);
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="font-weight-bold">${item.jurusan}</span>
          <span class="text-muted">${item.count} (${pct}%)</span>
        </div>
        <div class="progress progress-sm">
          <div class="progress-bar progress-bar-jurusan" style="width:${pct}%" role="progressbar"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderProdiChart(stats) {
  const list = stats.dosen_per_prodi || [];
  const total = stats.total_dosen || 1;
  const el = document.getElementById('prodiChart');

  if (!list.length) {
    el.innerHTML = '<p class="text-muted text-center py-4">Belum ada data dosen</p>';
    return;
  }

  el.innerHTML = list.map(item => {
    const pct = Math.round((item.count / total) * 100);
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="font-weight-bold">${item.prodi}</span>
          <span class="text-muted">${item.count} (${pct}%)</span>
        </div>
        <div class="progress progress-sm">
          <div class="progress-bar progress-bar-prodi" style="width:${pct}%" role="progressbar"></div>
        </div>
      </div>
    `;
  }).join('');
}
