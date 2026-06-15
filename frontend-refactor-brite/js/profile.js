const toast = {
  success: msg => iziToast.success({ message: msg, position: 'topRight', timeout: 3000 }),
  error:   msg => iziToast.error({ message: msg, position: 'topRight', timeout: 4000 }),
  warning: msg => iziToast.warning({ message: msg, position: 'topRight', timeout: 3000 }),
};

if (!Auth.requireAuth(false)) { /* redirect */ } else {
  Auth.initLayout();
  init();
}

function init() {
  const user = Auth.getUser();
  renderAccountInfo(user);
  if (user?.role === 'mahasiswa') {
    document.getElementById('sectionAkademik').style.display = '';
    loadAkademik();
  }
  bindEvents();
}

function renderAccountInfo(user) {
  if (!user) return;
  const initials = (user.username || user.email || '?')[0].toUpperCase();
  const roleBadge = {
    admin:      '<span class="badge bg-danger">Admin</span>',
    mahasiswa:  '<span class="badge bg-primary">Mahasiswa</span>',
    dosen:      '<span class="badge bg-success">Dosen</span>',
  }[user.role] || `<span class="badge bg-secondary">${esc(user.role)}</span>`;

  document.getElementById('profileHeader').innerHTML = `
    <div class="profile-avatar">${initials}</div>
    <div>
      <h5 class="fw-bold mb-1">${esc(user.username || user.email)}</h5>
      <div class="d-flex align-items-center gap-2">${roleBadge}<span class="text-muted small">${esc(user.email || '')}</span></div>
    </div>`;

  document.getElementById('profileInfo').innerHTML = `
    <div>
      ${[
        ['Username', esc(user.username || '—')],
        ['Email',    esc(user.email    || '—')],
        ['Role',     roleBadge],
      ].map(([l,v]) => `
        <div class="info-row">
          <span class="info-label">${l}</span>
          <span class="info-value">${v}</span>
        </div>`).join('')}
    </div>`;
}

async function loadAkademik() {
  const el = document.getElementById('akademikContent');
  try {
    const res = await api.get('/mahasiswa/me');
    const m   = res.data;
    el.innerHTML = `
      <div class="row g-3 mb-3">
        ${[
          { icon:'fa-id-card',  bg:'bg-primary bg-opacity-10', text:'text-primary', label:'NIM',      value:`<span class="nim-badge">${esc(m.nim)}</span>` },
          { icon:'fa-user',     bg:'bg-info bg-opacity-10',    text:'text-info',    label:'Nama',     value: esc(m.nama) },
          { icon:'fa-book',     bg:'bg-warning bg-opacity-10', text:'text-warning', label:'Jurusan',  value: esc(m.jurusan) },
          { icon:'fa-calendar', bg:'bg-success bg-opacity-10', text:'text-success', label:'Semester', value:`<span class="badge-smt">Semester ${m.semester}</span>` },
        ].map(item => `
          <div class="col-sm-6">
            <div class="d-flex align-items-center gap-2 p-3 bg-white rounded-3">
              <div class="rounded-3 p-2 ${item.bg} ${item.text}"><i class="fas ${item.icon}"></i></div>
              <div>
                <p class="text-muted mb-0" style="font-size:.7rem;">${item.label}</p>
                <p class="fw-bold mb-0 small">${item.value}</p>
              </div>
            </div>
          </div>`).join('')}
      </div>
      <div class="dosen-pa-card d-flex align-items-center gap-3">
        <div class="dosen-pa-avatar">${m.dosen_pa_nama ? m.dosen_pa_nama[0].toUpperCase() : '?'}</div>
        <div>
          <p class="text-muted mb-0" style="font-size:.7rem;text-transform:uppercase;letter-spacing:.05em;">Dosen Pembimbing Akademik</p>
          <p class="fw-bold mb-0">${m.dosen_pa_nama ? esc(m.dosen_pa_nama) : '<span class="text-muted fst-italic">Belum ditugaskan</span>'}</p>
          ${m.dosen_pa_nama ? '<span class="badge bg-success">Dosen PA</span>' : ''}
        </div>
      </div>`;
  } catch {
    el.innerHTML = `<p class="text-muted fst-italic mb-0">Data akademik belum terhubung ke akun ini. Hubungi admin.</p>`;
  }
}

function bindEvents() {
  document.getElementById('btnGantiPass').addEventListener('click', async () => {
    const lama      = document.getElementById('fPassLama').value;
    const baru      = document.getElementById('fPassBaru').value;
    const konfirmasi= document.getElementById('fPassKonfirmasi').value;

    if (!lama || !baru || !konfirmasi) { toast.warning('Semua field wajib diisi'); return; }
    if (baru.length < 6)               { toast.warning('Password baru minimal 6 karakter'); return; }
    if (baru !== konfirmasi)           { toast.warning('Konfirmasi password tidak cocok'); return; }

    const btn = document.getElementById('btnGantiPass');
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
    try {
      await api.put('/auth/change-password', { old_password: lama, new_password: baru });
      toast.success('Password berhasil diganti');
      document.getElementById('fPassLama').value = '';
      document.getElementById('fPassBaru').value = '';
      document.getElementById('fPassKonfirmasi').value = '';
    } catch (err) {
      toast.error(err.message || 'Gagal mengganti password');
    } finally {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-key me-1"></i>Ganti Password';
    }
  });
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
