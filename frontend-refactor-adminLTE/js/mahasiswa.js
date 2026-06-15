toastr.options = { closeButton: true, progressBar: true, positionClass: 'toast-top-right', timeOut: 3000 };

let currentPage   = 1;
let currentSearch = '';
let deleteTarget  = null;
let editTarget    = null;
const LIMIT = 10;

if (!Auth.requireAuth(true)) { /* redirect handled */ } else {
  Auth.initLayout();
  init();
}

function init() {
  loadDosenList();
  fetchData();
  bindEvents();
}

// ─── Fetch & Render ──────────────────────────────────────────────────────────

async function fetchData() {
  showTableLoading();
  try {
    const res = await api.get('/mahasiswa', { page: currentPage, limit: LIMIT, search: currentSearch });
    const rows  = res.data || [];
    const total = res.pagination?.total || 0;
    renderTable(rows);
    renderPagination(total);
    document.getElementById('totalBadge').textContent = total + ' mahasiswa';
  } catch (err) {
    toastr.error(err.message || 'Gagal memuat data mahasiswa');
    document.getElementById('tableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Gagal memuat data</td></tr>';
  }
}

async function loadDosenList() {
  try {
    const res = await api.get('/dosen', { limit: 200 });
    const dosenList = res.data || [];
    const select = document.getElementById('fDosenPa');
    const existing = select.innerHTML.startsWith('<option value="">');
    if (!existing) select.innerHTML = '<option value="">-- Tidak ada --</option>';
    dosenList.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = `${d.nama} (${d.nidn})`;
      select.appendChild(opt);
    });
  } catch { /* tidak kritis */ }
}

function renderTable(rows) {
  const isAdmin = Auth.isAdmin();
  const tbody = document.getElementById('tableBody');

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Tidak ada mahasiswa ditemukan</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="nim-badge">${esc(r.nim)}</span></td>
      <td>${esc(r.nama)}</td>
      <td>${esc(r.jurusan)}</td>
      <td><span class="badge-semester">Smt ${r.semester}</span></td>
      <td>${r.dosen_pa_nama ? esc(r.dosen_pa_nama) : '<span class="text-muted font-italic">Belum ada</span>'}</td>
      <td class="text-center">
        <button class="btn btn-xs btn-info mr-1" onclick="showDetail(${r.id})" title="Detail">
          <i class="fas fa-eye"></i>
        </button>
        ${isAdmin ? `
        <button class="btn btn-xs btn-warning mr-1" onclick="showEdit(${r.id})" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-xs btn-danger" onclick="confirmHapus(${r.id}, '${esc(r.nama)}')" title="Hapus">
          <i class="fas fa-trash"></i>
        </button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / LIMIT);
  const wrap  = document.getElementById('paginationWrap');
  const info  = document.getElementById('paginationInfo');
  const ul    = document.getElementById('pagination');

  if (total === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';

  const from = (currentPage - 1) * LIMIT + 1;
  const to   = Math.min(currentPage * LIMIT, total);
  info.textContent = `Menampilkan ${from}–${to} dari ${total} data`;

  let html = '';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="goPage(${currentPage - 1});return false;">&laquo;</a></li>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
      if (i === 2 || i === totalPages - 1) html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
      continue;
    }
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" onclick="goPage(${i});return false;">${i}</a></li>`;
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="goPage(${currentPage + 1});return false;">&raquo;</a></li>`;

  ul.innerHTML = html;
}

function showTableLoading() {
  document.getElementById('tableBody').innerHTML =
    '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat...</td></tr>';
}

// ─── Detail ──────────────────────────────────────────────────────────────────

async function showDetail(id) {
  try {
    const res = await api.get('/mahasiswa/' + id);
    const m = res.data;
    document.getElementById('detailBody').innerHTML = `
      <table class="table table-sm table-borderless mb-0">
        <tr><th width="120">NIM</th><td><span class="nim-badge">${esc(m.nim)}</span></td></tr>
        <tr><th>Nama</th><td>${esc(m.nama)}</td></tr>
        <tr><th>Email</th><td>${esc(m.email)}</td></tr>
        <tr><th>Jurusan</th><td>${esc(m.jurusan)}</td></tr>
        <tr><th>Semester</th><td><span class="badge-semester">Semester ${m.semester}</span></td></tr>
        <tr><th>Dosen PA</th><td>${m.dosen_pa_nama ? esc(m.dosen_pa_nama) : '<span class="text-muted">—</span>'}</td></tr>
      </table>`;
    $('#modalDetail').modal('show');
  } catch (err) {
    toastr.error(err.message || 'Gagal memuat detail');
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

function showCreate() {
  editTarget = null;
  document.getElementById('modalFormTitle').textContent = 'Tambah Mahasiswa';
  document.getElementById('formMahasiswa').reset();
  document.getElementById('fNim').disabled = false;
  $('#modalForm').modal('show');
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

async function showEdit(id) {
  try {
    const res = await api.get('/mahasiswa/' + id);
    const m = res.data;
    editTarget = m;
    document.getElementById('modalFormTitle').textContent = 'Edit Mahasiswa';
    document.getElementById('fNim').value      = m.nim;
    document.getElementById('fNim').disabled   = true;
    document.getElementById('fNama').value     = m.nama;
    document.getElementById('fEmail').value    = m.email;
    document.getElementById('fJurusan').value  = m.jurusan;
    document.getElementById('fSemester').value = m.semester;
    document.getElementById('fDosenPa').value  = m.dosen_pa_id || '';
    $('#modalForm').modal('show');
  } catch (err) {
    toastr.error(err.message || 'Gagal memuat data');
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

function confirmHapus(id, nama) {
  deleteTarget = { id, nama };
  document.getElementById('hapusMsg').textContent = `Yakin ingin menghapus mahasiswa "${nama}"? Data yang dihapus tidak dapat dikembalikan.`;
  $('#modalHapus').modal('show');
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEvents() {
  // Tombol Tambah
  document.getElementById('btnTambah').addEventListener('click', showCreate);

  // Search dengan debounce
  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = this.value.trim();
      currentPage   = 1;
      fetchData();
    }, 400);
  });

  // Simpan (create / update)
  document.getElementById('btnSimpan').addEventListener('click', async () => {
    const nim      = document.getElementById('fNim').value.trim();
    const nama     = document.getElementById('fNama').value.trim();
    const email    = document.getElementById('fEmail').value.trim();
    const jurusan  = document.getElementById('fJurusan').value.trim();
    const semester = parseInt(document.getElementById('fSemester').value);
    const dosenPaId = document.getElementById('fDosenPa').value;

    if (!nama || !email || !jurusan) { toastr.warning('Lengkapi semua field wajib'); return; }

    const payload = { nim, nama, email, jurusan, semester, dosen_pa_id: dosenPaId ? parseInt(dosenPaId) : null };

    const btn = document.getElementById('btnSimpan');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menyimpan...';

    try {
      if (editTarget) {
        await api.put('/mahasiswa/' + editTarget.id, payload);
        toastr.success('Mahasiswa berhasil diperbarui');
      } else {
        await api.post('/mahasiswa', payload);
        toastr.success('Mahasiswa berhasil ditambahkan');
      }
      $('#modalForm').modal('hide');
      fetchData();
    } catch (err) {
      toastr.error(err.message || 'Gagal menyimpan data');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save mr-1"></i> Simpan';
    }
  });

  // Konfirmasi hapus
  document.getElementById('btnKonfirmasiHapus').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = document.getElementById('btnKonfirmasiHapus');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menghapus...';

    try {
      await api.delete('/mahasiswa/' + deleteTarget.id);
      toastr.success('Mahasiswa berhasil dihapus');
      $('#modalHapus').modal('hide');
      deleteTarget = null;
      fetchData();
    } catch (err) {
      toastr.error(err.message || 'Gagal menghapus data');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-trash mr-1"></i> Hapus';
    }
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function goPage(page) {
  if (page < 1) return;
  currentPage = page;
  fetchData();
  window.scrollTo(0, 0);
}

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
