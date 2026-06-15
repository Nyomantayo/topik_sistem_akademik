const toast = {
  success: msg => iziToast.success({ message: msg, position: 'topRight', timeout: 3000 }),
  error:   msg => iziToast.error({ message: msg, position: 'topRight', timeout: 4000 }),
  warning: msg => iziToast.warning({ message: msg, position: 'topRight', timeout: 3000 }),
};
const showModal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).show();
const hideModal = id => bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).hide();

let currentPage       = 1;
let currentSearch     = '';
let deleteTarget      = null;
let editTarget        = null;
let bimbinganDosen    = null;
let bimbinganPage     = 1;
const LIMIT           = 10;
const LIMIT_BIMBINGAN = 8;

if (!Auth.requireAuth(true)) { /* redirect */ } else {
  Auth.initLayout();
  init();
}

function init() { fetchData(); bindEvents(); }

async function fetchData() {
  showTableLoading();
  try {
    const res   = await api.get('/dosen', { page: currentPage, limit: LIMIT, search: currentSearch });
    const rows  = res.data || [];
    const total = res.pagination?.total || 0;
    renderTable(rows);
    renderPagination(total);
    document.getElementById('totalBadge').textContent = total;
  } catch (err) {
    toast.error(err.message || 'Gagal memuat data');
    document.getElementById('tableBody').innerHTML =
      '<tr><td colspan="5" class="text-center text-danger py-4">Gagal memuat data</td></tr>';
  }
}

function renderTable(rows) {
  const isAdmin = Auth.isAdmin();
  const tbody   = document.getElementById('tableBody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-5">Tidak ada dosen ditemukan</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><span class="nidn-badge">${esc(r.nidn)}</span></td>
      <td class="fw-semibold">${esc(r.nama)}</td>
      <td class="d-none d-md-table-cell text-muted small">${esc(r.email)}</td>
      <td><span class="badge-prodi">${esc(r.prodi)}</span></td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-info me-1" onclick="showBimbingan(${r.id},'${esc(r.nama)}')" title="Mahasiswa Bimbingan"><i class="fas fa-users"></i></button>
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
  const from = (currentPage-1)*LIMIT+1, to = Math.min(currentPage*LIMIT, total);
  document.getElementById('paginationInfo').textContent = `Menampilkan ${from}–${to} dari ${total} data`;
  let html = `<li class="page-item ${currentPage===1?'disabled':''}"><a class="page-link" href="#" onclick="goPage(${currentPage-1});return false;">&laquo;</a></li>`;
  for (let i=1;i<=totalPages;i++) {
    if (totalPages>7 && Math.abs(i-currentPage)>2 && i!==1 && i!==totalPages) {
      if (i===2||i===totalPages-1) html+='<li class="page-item disabled"><span class="page-link">…</span></li>';
      continue;
    }
    html+=`<li class="page-item ${i===currentPage?'active':''}"><a class="page-link" href="#" onclick="goPage(${i});return false;">${i}</a></li>`;
  }
  html+=`<li class="page-item ${currentPage===totalPages?'disabled':''}"><a class="page-link" href="#" onclick="goPage(${currentPage+1});return false;">&raquo;</a></li>`;
  document.getElementById('pagination').innerHTML = html;
}

function showTableLoading() {
  document.getElementById('tableBody').innerHTML =
    '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat...</td></tr>';
}

async function showBimbingan(id, nama) {
  bimbinganDosen = { id, nama }; bimbinganPage = 1;
  document.getElementById('bimbinganTitle').textContent = `Mahasiswa Bimbingan — ${nama}`;
  document.getElementById('bimbinganBody').innerHTML = '<div class="text-center py-4"><div class="spinner-border text-info"></div></div>';
  document.getElementById('bimbinganPagination').innerHTML = '';
  showModal('modalBimbingan');
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
      document.getElementById('bimbinganBody').innerHTML = '<p class="text-center text-muted py-4">Belum ada mahasiswa bimbingan</p>';
      return;
    }
    document.getElementById('bimbinganBody').innerHTML = rows.map(m => `
      <div class="d-flex align-items-center gap-3 p-2 mb-2 bg-light rounded-3">
        <div class="bimbingan-avatar">${(m.nama?.[0]||'?').toUpperCase()}</div>
        <div>
          <p class="fw-semibold mb-0 small">${esc(m.nama)}</p>
          <p class="text-muted mb-0" style="font-size:.75rem;">${esc(m.nim)} &middot; ${esc(m.jurusan)} &middot; Semester ${m.semester}</p>
        </div>
      </div>`).join('');
    const tp = Math.ceil(total/LIMIT_BIMBINGAN);
    if (tp<=1) { document.getElementById('bimbinganPagination').innerHTML=''; return; }
    let html=`<li class="page-item ${bimbinganPage===1?'disabled':''}"><a class="page-link" href="#" onclick="goBimbinganPage(${bimbinganPage-1});return false;">&laquo;</a></li>`;
    for(let i=1;i<=tp;i++) html+=`<li class="page-item ${i===bimbinganPage?'active':''}"><a class="page-link" href="#" onclick="goBimbinganPage(${i});return false;">${i}</a></li>`;
    html+=`<li class="page-item ${bimbinganPage===tp?'disabled':''}"><a class="page-link" href="#" onclick="goBimbinganPage(${bimbinganPage+1});return false;">&raquo;</a></li>`;
    document.getElementById('bimbinganPagination').innerHTML = html;
  } catch (err) { toast.error(err.message || 'Gagal memuat mahasiswa bimbingan'); }
}

async function goBimbinganPage(p) {
  if (p<1) return; bimbinganPage=p;
  document.getElementById('bimbinganBody').innerHTML='<div class="text-center py-4"><div class="spinner-border text-info"></div></div>';
  await fetchBimbingan();
}

function showCreate() {
  editTarget=null;
  document.getElementById('modalFormTitle').textContent='Tambah Dosen';
  document.getElementById('formDosen').reset();
  document.getElementById('fNidn').disabled=false;
  showModal('modalForm');
}

async function showEdit(id) {
  try {
    const res=await api.get('/dosen/'+id); const d=res.data; editTarget=d;
    document.getElementById('modalFormTitle').textContent='Edit Dosen';
    document.getElementById('fNidn').value=d.nidn; document.getElementById('fNidn').disabled=true;
    document.getElementById('fNama').value=d.nama; document.getElementById('fEmail').value=d.email;
    document.getElementById('fProdi').value=d.prodi;
    showModal('modalForm');
  } catch(err){toast.error(err.message||'Gagal memuat data');}
}

function confirmHapus(id,nama) {
  deleteTarget={id,nama};
  document.getElementById('hapusMsg').textContent=`Yakin ingin menghapus dosen "${nama}"? Data tidak dapat dikembalikan.`;
  showModal('modalHapus');
}

function bindEvents() {
  document.getElementById('btnTambah').addEventListener('click',showCreate);
  let timer;
  document.getElementById('searchInput').addEventListener('input',function(){
    clearTimeout(timer);
    timer=setTimeout(()=>{currentSearch=this.value.trim();currentPage=1;fetchData();},400);
  });
  document.getElementById('btnSimpan').addEventListener('click',async()=>{
    const payload={nidn:document.getElementById('fNidn').value.trim(),nama:document.getElementById('fNama').value.trim(),email:document.getElementById('fEmail').value.trim(),prodi:document.getElementById('fProdi').value.trim()};
    if(!payload.nama||!payload.email||!payload.prodi){toast.warning('Lengkapi semua field wajib');return;}
    const btn=document.getElementById('btnSimpan');
    btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
    try{
      if(editTarget){await api.put('/dosen/'+editTarget.id,payload);toast.success('Dosen berhasil diperbarui');}
      else{await api.post('/dosen',payload);toast.success('Dosen berhasil ditambahkan');}
      hideModal('modalForm');fetchData();
    }catch(err){toast.error(err.message||'Gagal menyimpan');}
    finally{btn.disabled=false;btn.innerHTML='<i class="fas fa-save me-1"></i>Simpan';}
  });
  document.getElementById('btnKonfirmasiHapus').addEventListener('click',async()=>{
    if(!deleteTarget)return;
    const btn=document.getElementById('btnKonfirmasiHapus');
    btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-1"></span>Menghapus...';
    try{
      await api.delete('/dosen/'+deleteTarget.id);toast.success('Dosen berhasil dihapus');
      hideModal('modalHapus');deleteTarget=null;fetchData();
    }catch(err){toast.error(err.message||'Gagal menghapus');}
    finally{btn.disabled=false;btn.innerHTML='<i class="fas fa-trash me-1"></i>Hapus';}
  });
}

function goPage(p){if(p<1)return;currentPage=p;fetchData();window.scrollTo(0,0);}
function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
