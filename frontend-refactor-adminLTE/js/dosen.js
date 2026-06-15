toastr.options = { closeButton: true, progressBar: true, positionClass: 'toast-top-right', timeOut: 3000 };

let currentPage       = 1;
let currentSearch     = '';
let deleteTarget      = null;
let editTarget        = null;
let bimbinganDosen    = null;
let bimbinganPage     = 1;
const LIMIT           = 10;
const LIMIT_BIMBINGAN = 8;

if (!Auth.requireAuth(true)) { /* redirect handled */ } else {
  Auth.initLayout();
  init();
}

function init() {
  fetchData();
  bindEvents();
}

// ─── Fetch & Render ──────────────────────────────────────────────────────────

async function fetchData() {
  showTableLoading();
  try {
    const res   = await api.get('/dosen', { page: currentPage, limit: LIMIT, search: currentSearch });
    const rows  = res.data || [];
    const total = res.pagination?.total || 0;
    renderTable(rows);
    renderPagination(total);
    document.getElementById('totalBadge').textContent = total + ' dosen';
  } catch (err) {
    toastr.error(err.message || 'Gagal memuat data dosen');
    document.getElementById('tableBody').innerHTML =
      '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>';
  }
}

function renderTable(rows) {
  const isAdmin = Auth.isAdmin();
  const tbody   = document.getElementById('tableBody');

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Tidak ada dosen ditemukan</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="nidn-badge">${esc(r.nidn)}</span></td>
      <td>${esc(r.nama)}</td>
      <td class="d-none d-md-table-cell">${esc(r.email)}</td>
      <td><span class="badge-prodi">${esc(r.prodi)}</span></td>
      <td class="text-center">
        <button class="btn btn-xs btn-info mr-1" onclick="showBimbingan(${r.id}, '${esc(r.nama)}')" title="Mahasiswa Bimbingan">
          <i class="fas fa-users"></i>
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
    '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Memuat...</td></tr>';
}

// ─── Mahasiswa Bimbingan ──────────────────────────────────────────────────────

async function showBimbingan(id, nama) {
  bimbinganDosen = { id, nama };
  bimbinganPage  = 1;
  document.getElementById('bimbinganTitle').textContent = `Mahasiswa Bimbingan — ${nama}`;
  document.getElementById('bimbinganBody').innerHTML =
    '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';
  document.getElementById('bimbinganPagination').innerHTML = '';
  $('#modalBimbingan').modal('show');
  await fetchBimbingan();
}

async function fetchBimbingan() {
  if (!bimbinganDosen) return;
  try {
    const res   = await api.get(`/dosen/${bimbinganDosen.id}/mahasiswa`, { page: bimbinganPage, limit: LIMIT_BIMBINGAN });
    const rows  = res.data || [];
    const total = res.pagination?.total || 0;

    document.getElementById('bimbinganInfo').textContent = `${total} mahasiswa dibimbing`;

    if (!rows.length) {
      document.getElementById('bimbinganBody').innerHTML =
        '<p class="text-center text-muted py-4">Belum ada mahasiswa bimbingan</p>';
      document.getElementById('bimbinganPagination').innerHTML = '';
      return;
    }

    document.getElementById('bimbinganBody').innerHTML = rows.map(m => `
      <div class="d-flex align-items-center p-2 mb-2 bg-light rounded">
        <div class="avatar-bimbingan mr-3">${(m.nama?.[0] || '?').toUpperCase()}</div>
        <div>
          <p class="mb-0 font-weight-bold">${esc(m.nama)}</p>
          <small class="text-muted">${esc(m.nim)} &middot; ${esc(m.jurusan)} &middot; Semester ${m.semester}</small>
        </div>
      </div>
    `).join('');

    // Pagination bimbingan
    const totalPages = Math.ceil(total / LIMIT_BIMBINGAN);
    if (totalPages <= 1) { document.getElementById('bimbinganPagination').innerHTML = ''; return; }
    let html = '';
    html += `<li class="page-item ${bimbinganPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goBimbinganPage(${bimbinganPage - 1});return false;">&laquo;</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === bimbinganPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="goBimbinganPage(${i});return false;">${i}</a></li>`;
    }
    html += `<li class="page-item ${bimbinganPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goBimbinganPage(${bimbinganPage + 1});return false;">&raquo;</a></li>`;
    document.getElementById('bimbinganPagination').innerHTML = html;
  } catch (err) {
    toastr.error(err.message || 'Gagal memuat mahasiswa bimbingan');
  }
}

async function goBimbinganPage(page) {
  if (page < 1) return;
  bimbinganPage = page;
  document.getElementById('bimbinganBody').innerHTML =
    '<div class="text-center py-4"><i class="fas fa-spinner fa-spin fa-2x text-muted"></i></div>';
  await fetchBimbingan();
}

// ─── Create ───────────────────────────────────────────────────────────────────

function showCreate() {
  editTarget = null;
  document.getElementById('modalFormTitle').textContent = 'Tambah Dosen';
  document.getElementById('formDosen').reset();
  document.getElementById('fNidn').disabled = false;
  $('#modalForm').modal('show');
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

async function showEdit(id) {
  try {
    const res = await api.get('/dosen/' + id);
    const d   = res.data;
    editTarget = d;
    document.getElementById('modalFormTitle').textContent = 'Edit Dosen';
    document.getElementById('fNidn').value  = d.nidn;
    document.getElementById('fNidn').disabled = true;
    document.getElementById('fNama').value  = d.nama;
    document.getElementById('fEmail').value = d.email;
    document.getElementById('fProdi').value = d.prodi;
    $('#modalForm').modal('show');
  } catch (err) {
    toastr.error(err.message || 'Gagal memuat data');
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

function confirmHapus(id, nama) {
  deleteTarget = { id, nama };
  document.getElementById('hapusMsg').textContent = `Yakin ingin menghapus dosen "${nama}"? Data yang dihapus tidak dapat dikembalikan.`;
  $('#modalHapus').modal('show');
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('btnTambah').addEventListener('click', showCreate);

  let searchTimer;
  document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = this.value.trim();
      currentPage   = 1;
      fetchData();
    }, 400);
  });

  document.getElementById('btnSimpan').addEventListener('click', async () => {
    const nidn  = document.getElementById('fNidn').value.trim();
    const nama  = document.getElementById('fNama').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const prodi = document.getElementById('fProdi').value.trim();

    if (!nama || !email || !prodi) { toastr.warning('Lengkapi semua field wajib'); return; }

    const payload = { nidn, nama, email, prodi };
    const btn = document.getElementById('btnSimpan');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menyimpan...';

    try {
      if (editTarget) {
        await api.put('/dosen/' + editTarget.id, payload);
        toastr.success('Dosen berhasil diperbarui');
      } else {
        await api.post('/dosen', payload);
        toastr.success('Dosen berhasil ditambahkan');
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

  document.getElementById('btnKonfirmasiHapus').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = document.getElementById('btnKonfirmasiHapus');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Menghapus...';
    try {
      await api.delete('/dosen/' + deleteTarget.id);
      toastr.success('Dosen berhasil dihapus');
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
