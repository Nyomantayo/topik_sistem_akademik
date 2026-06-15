const toast = {
  success: msg => iziToast.success({ message: msg, position: 'topRight', timeout: 3000 }),
  error:   msg => iziToast.error({ message: msg, position: 'topRight', timeout: 4000 }),
  warning: msg => iziToast.warning({ message: msg, position: 'topRight', timeout: 3000 }),
};
const showModal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).show();
const hideModal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).hide();

let currentPage   = 1;
let currentSearch = '';
let deleteTarget  = null;
let editTarget    = null;
const LIMIT = 10;

if (!Auth.requireAuth(true)) { /* redirect */ } else {
  Auth.initLayout();
  init();
}

function init() { loadDosenList(); fetchData(); bindEvents(); }

async function fetchData() {
  showTableLoading();
  try {
    const res   = await api.get('/mahasiswa', { page: currentPage, limit: LIMIT, search: currentSearch });
    const rows  = res.data || [];
    const total = res.pagination?.total || 0;
    renderTable(rows);
    renderPagination(total);
    document.getElementById('totalBadge').textContent = total;
  } catch (err) {
    toast.error(err.message || 'Gagal memuat data');
    document.getElementById('tableBody').innerHTML =
      '<tr><td colspan="6" class="text-center text-danger py-4">Gagal memuat data</td></tr>';
  }
}

async function loadDosenList() {
  try {
    const res = await api.get('/dosen', { limit: 200 });
    const sel = document.getElementById('fDosenPa');
    (res.data || []).forEach(d => {
      const o = document.createElement('option');
      o.value = d.id; o.textContent = `${d.nama} (${d.nidn})`; sel.appendChild(o);
    });
  } catch { /* tidak kritis */ }
}

function renderTable(rows) {
  const isAdmin = Auth.isAdmin();
  const tbody = document.getElementById('tableBody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">Tidak ada mahasiswa ditemukan</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="nim-badge">${esc(r.nim)}</span></td>
      <td class="fw-semibold">${esc(r.nama)}</td>
      <td>${esc(r.jurusan)}</td>
      <td><span class="badge-smt">Smt ${r.semester}</span></td>
      <td>${r.dosen_pa_nama ? esc(r.dosen_pa_nama) : '<span class="text-muted fst-italic small">Belum ada</span>'}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-info me-1" onclick="showDetail(${r.id})" title="Detail"><i class="fas fa-eye"></i></button>
        ${isAdmin ? `
        <button class="btn btn-sm btn-outline-warning me-1" onclick="showEdit(${r.id})" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="confirmHapus(${r.id},'${esc(r.nama)}')" title="Hapus"><i class="fas fa-trash"></i></button>
        ` : ''}
      </td>
    </tr>`).join('');
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / LIMIT);
  const wrap = document.getElementById('paginationWrap');
  if (total === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  const from = (currentPage - 1) * LIMIT + 1, to = Math.min(currentPage * LIMIT, total);
  document.getElementById('paginationInfo').textContent = `Menampilkan ${from}–${to} dari ${total} data`;
  let html = `<li class="page-item ${currentPage===1?'disabled':''}"><a class="page-link" href="#" onclick="goPage(${currentPage-1});return false;">&laquo;</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
      if (i === 2 || i === totalPages - 1) html += '<li class="page-item disabled"><span class="page-link">…</span></li>';
      continue;
    }
    html += `<li class="page-item ${i===currentPage?'active':''}"><a class="page-link" href="#" onclick="goPage(${i});return false;">${i}</a></li>`;
  }
  html += `<li class="page-item ${currentPage===totalPages?'disabled':''}"><a class="page-link" href="#" onclick="goPage(${currentPage+1});return false;">&raquo;</a></li>`;
  document.getElementById('pagination').innerHTML = html;
}

function showTableLoading() {
  document.getElementById('tableBody').innerHTML =
    '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat...</td></tr>';
}

async function showDetail(id) {
  try {
    const res = await api.get('/mahasiswa/' + id);
    const m = res.data;
    document.getElementById('detailBody').innerHTML = `
      <table class="table table-sm table-borderless mb-0">
        ${[['NIM',`<span class="nim-badge">${esc(m.nim)}</span>`],['Nama',esc(m.nama)],['Email',esc(m.email)],['Jurusan',esc(m.jurusan)],['Semester',`<span class="badge-smt">Semester ${m.semester}</span>`],['Dosen PA',m.dosen_pa_nama?esc(m.dosen_pa_nama):'<span class="text-muted">—</span>']].map(([l,v])=>`<tr><th class="text-muted fw-normal" width="110">${l}</th><td>${v}</td></tr>`).join('')}
      </table>`;
    showModal('modalDetail');
  } catch (err) { toast.error(err.message || 'Gagal memuat detail'); }
}

function showCreate() {
  editTarget = null;
  document.getElementById('modalFormTitle').textContent = 'Tambah Mahasiswa';
  document.getElementById('formMahasiswa').reset();
  document.getElementById('fNim').disabled = false;
  showModal('modalForm');
}

async function showEdit(id) {
  try {
    const res = await api.get('/mahasiswa/' + id);
    const m = res.data; editTarget = m;
    document.getElementById('modalFormTitle').textContent = 'Edit Mahasiswa';
    document.getElementById('fNim').value = m.nim; document.getElementById('fNim').disabled = true;
    document.getElementById('fNama').value = m.nama; document.getElementById('fEmail').value = m.email;
    document.getElementById('fJurusan').value = m.jurusan; document.getElementById('fSemester').value = m.semester;
    document.getElementById('fDosenPa').value = m.dosen_pa_id || '';
    showModal('modalForm');
  } catch (err) { toast.error(err.message || 'Gagal memuat data'); }
}

function confirmHapus(id, nama) {
  deleteTarget = { id, nama };
  document.getElementById('hapusMsg').textContent = `Yakin ingin menghapus mahasiswa "${nama}"? Data tidak dapat dikembalikan.`;
  showModal('modalHapus');
}

function bindEvents() {
  document.getElementById('btnTambah').addEventListener('click', showCreate);

  let timer;
  document.getElementById('searchInput').addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(() => { currentSearch = this.value.trim(); currentPage = 1; fetchData(); }, 400);
  });

  document.getElementById('btnSimpan').addEventListener('click', async () => {
    const payload = {
      nim:         document.getElementById('fNim').value.trim(),
      nama:        document.getElementById('fNama').value.trim(),
      email:       document.getElementById('fEmail').value.trim(),
      jurusan:     document.getElementById('fJurusan').value.trim(),
      semester:    parseInt(document.getElementById('fSemester').value),
      dosen_pa_id: document.getElementById('fDosenPa').value ? parseInt(document.getElementById('fDosenPa').value) : null,
    };
    if (!payload.nama || !payload.email || !payload.jurusan) { toast.warning('Lengkapi semua field wajib'); return; }
    const btn = document.getElementById('btnSimpan');
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
    try {
      if (editTarget) { await api.put('/mahasiswa/' + editTarget.id, payload); toast.success('Mahasiswa berhasil diperbarui'); }
      else            { await api.post('/mahasiswa', payload); toast.success('Mahasiswa berhasil ditambahkan'); }
      hideModal('modalForm'); fetchData();
    } catch (err) { toast.error(err.message || 'Gagal menyimpan data'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save me-1"></i>Simpan'; }
  });

  document.getElementById('btnKonfirmasiHapus').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const btn = document.getElementById('btnKonfirmasiHapus');
    btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menghapus...';
    try {
      await api.delete('/mahasiswa/' + deleteTarget.id);
      toast.success('Mahasiswa berhasil dihapus'); hideModal('modalHapus'); deleteTarget = null; fetchData();
    } catch (err) { toast.error(err.message || 'Gagal menghapus'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-trash me-1"></i>Hapus'; }
  });
}

function goPage(p) { if (p < 1) return; currentPage = p; fetchData(); window.scrollTo(0,0); }
function esc(s) { if (s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
