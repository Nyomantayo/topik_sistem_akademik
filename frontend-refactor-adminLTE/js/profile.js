toastr.options = { closeButton: true, progressBar: true, positionClass: 'toast-top-right', timeOut: 3000 };

if (!Auth.requireAuth(false)) { /* redirect handled */ } else {
  Auth.initLayout();
  init();
}

const ROLE_LABEL = { admin: 'Administrator', mahasiswa: 'Mahasiswa', dosen: 'Dosen', guest: 'Tamu' };

function init() {
  const user = Auth.getUser();
  if (!user) return;

  // Isi field profil dari data lokal terlebih dahulu
  document.getElementById('profileAvatar').textContent = (user.name?.[0] || '?').toUpperCase();
  document.getElementById('profileEmail').textContent  = user.email;
  document.getElementById('profileRole').textContent   = ROLE_LABEL[user.role] || user.role;
  document.getElementById('fName').value  = user.name;
  document.getElementById('fEmail').value = user.email;

  // Kartu akademik hanya untuk mahasiswa
  if (user.role === 'mahasiswa') {
    document.getElementById('cardAkademik').style.display = '';
    loadAkademik();
  }

  bindEvents();
}

// ─── Data Akademik ────────────────────────────────────────────────────────────

async function loadAkademik() {
  const el = document.getElementById('akademikBody');
  try {
    const res = await api.get('/mahasiswa/me');
    const m   = res.data;
    el.innerHTML = `
      <div class="row">
        ${[
          { icon: 'fa-id-card',    label: 'NIM',      value: m.nim },
          { icon: 'fa-user',       label: 'Nama',     value: m.nama },
          { icon: 'fa-book',       label: 'Jurusan',  value: m.jurusan },
          { icon: 'fa-calendar',   label: 'Semester', value: 'Semester ' + m.semester },
        ].map(item => `
          <div class="col-6 mb-3">
            <div class="akademik-item">
              <div class="akademik-icon"><i class="fas ${item.icon}"></i></div>
              <div>
                <small class="text-muted d-block">${item.label}</small>
                <span class="font-weight-bold">${esc(item.value)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="p-3 mt-2 rounded border border-primary" style="background:#eff6ff;">
        <p class="text-primary font-weight-bold mb-2" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.05em;">
          <i class="fas fa-chalkboard-teacher mr-1"></i> Dosen Pembimbing Akademik
        </p>
        ${m.dosen_pa_nama ? `
          <div class="d-flex align-items-center">
            <div class="profile-avatar mr-3" style="width:48px;height:48px;font-size:1.2rem;">
              ${(m.dosen_pa_nama?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <p class="mb-0 font-weight-bold">${esc(m.dosen_pa_nama)}</p>
              <span class="badge badge-primary">Dosen PA</span>
            </div>
          </div>
        ` : '<p class="text-muted mb-0 font-italic">Belum ada Dosen PA yang ditugaskan</p>'}
      </div>
    `;
  } catch {
    el.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="fas fa-graduation-cap fa-3x mb-3 opacity-50"></i>
        <p>Data akademik belum terhubung ke akun ini.</p>
        <small>Hubungi admin untuk menghubungkan data Anda.</small>
      </div>`;
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEvents() {
  // Update profil
  document.getElementById('formProfile').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('fName').value.trim();
    if (!name) { toastr.warning('Nama tidak boleh kosong'); return; }

    const btn = document.getElementById('btnSaveProfile');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menyimpan...';

    try {
      const res  = await api.put('/auth/profile', { name });
      const user = Auth.getUser();
      const updated = { ...user, name: res.data?.name || name };
      Auth.setSession(Auth.getToken(), updated);

      // Perbarui tampilan
      document.getElementById('profileAvatar').textContent = (updated.name?.[0] || '?').toUpperCase();
      document.querySelectorAll('.user-display-name').forEach(el => el.textContent = updated.name);
      document.querySelectorAll('.user-avatar-initials').forEach(el => el.textContent = (updated.name?.[0] || '?').toUpperCase());

      toastr.success('Profil berhasil diperbarui');
    } catch (err) {
      toastr.error(err.message || 'Gagal memperbarui profil');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save mr-1"></i> Simpan Perubahan';
    }
  });

  // Ubah password
  document.getElementById('formPassword').addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPass     = document.getElementById('fOldPass').value;
    const newPass     = document.getElementById('fNewPass').value;
    const confirmPass = document.getElementById('fConfirmPass').value;

    // Reset error
    ['errOldPass','errNewPass','errConfirmPass'].forEach(id => {
      document.getElementById(id).textContent = '';
      document.getElementById(id).classList.add('d-none');
    });

    let valid = true;
    if (!oldPass) { showErr('errOldPass', 'Wajib diisi'); valid = false; }
    if (!newPass) { showErr('errNewPass', 'Wajib diisi'); valid = false; }
    else if (newPass.length < 8) { showErr('errNewPass', 'Minimal 8 karakter'); valid = false; }
    if (newPass !== confirmPass) { showErr('errConfirmPass', 'Konfirmasi password tidak sesuai'); valid = false; }
    if (!valid) return;

    const btn = document.getElementById('btnSavePass');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menyimpan...';

    try {
      await api.put('/auth/change-password', { old_password: oldPass, new_password: newPass });
      toastr.success('Password berhasil diubah');
      document.getElementById('formPassword').reset();
    } catch (err) {
      toastr.error(err.message || 'Gagal mengubah password');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-key mr-1"></i> Ubah Password';
    }
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove('d-none');
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
