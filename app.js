// ================== STATE GLOBAL ==================
let siswaList = [];
let absensiHarian = [];
let hafalanList = [];
let sholatList = [];
let absensiGuruList = [];

let modeAbsen = "masuk";
let modeSholat = "dhuha";
let rekapTab = "absen";
let isAdminUnlocked = false;
let editingNis = null;

// ================== UTIL ==================
function todayStr(){ return new Date().toISOString().slice(0,10); }
function nowTime(){ return new Date().toTimeString().slice(0,5); }
function getSiswaByNIS(nis){ return siswaList.find(s => s.nis === nis); }

function beep(sukses=true){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.value = sukses ? 880 : 220;
    osc.connect(ctx.destination);
    osc.start(); setTimeout(()=>osc.stop(), 150);
  }catch(e){}
}

// ================== TEMA LIGHT/DARK ==================
function applyTheme(theme){
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.getElementById('btnToggleTheme').innerText = theme === 'dark' ? '☀️ Mode Terang' : '🌙 Mode Gelap';
}
document.getElementById('btnToggleTheme').addEventListener('click', ()=>{
  const current = document.body.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ================== SINKRONISASI DENGAN GOOGLE SHEETS ==================
async function loadAllDataFromServer(){
  if(!APPS_SCRIPT_URL){
    siswaList       = JSON.parse(localStorage.getItem('siswaList'))       || DEFAULT_SISWA;
    absensiHarian   = JSON.parse(localStorage.getItem('absensiHarian'))   || [];
    hafalanList     = JSON.parse(localStorage.getItem('hafalanList'))     || [];
    sholatList      = JSON.parse(localStorage.getItem('sholatList'))      || [];
    absensiGuruList = JSON.parse(localStorage.getItem('absensiGuruList')) || [];
    document.getElementById('syncStatus').innerText = '⚪ Mode Lokal (belum terhubung Sheets)';
    renderSemua();
    return;
  }
  document.getElementById('syncStatus').innerText = '⏳ Menyinkronkan...';
  try{
    const res  = await fetch(APPS_SCRIPT_URL + '?action=getAllData');
    const data = await res.json();

    siswaList       = (data.siswaList && data.siswaList.length) ? data.siswaList : DEFAULT_SISWA;
    absensiHarian   = data.absensiHarian || [];
    hafalanList     = data.hafalanList || [];
    sholatList      = data.sholatList || [];
    absensiGuruList = data.absensiGuruList || [];

    localStorage.setItem('siswaList', JSON.stringify(siswaList));
    localStorage.setItem('absensiHarian', JSON.stringify(absensiHarian));
    localStorage.setItem('hafalanList', JSON.stringify(hafalanList));
    localStorage.setItem('sholatList', JSON.stringify(sholatList));
    localStorage.setItem('absensiGuruList', JSON.stringify(absensiGuruList));

    document.getElementById('syncStatus').innerText = '🟢 Tersinkron: ' + new Date().toLocaleTimeString();
  }catch(err){
    console.error('Gagal sinkron:', err);
    siswaList       = JSON.parse(localStorage.getItem('siswaList'))       || DEFAULT_SISWA;
    absensiHarian   = JSON.parse(localStorage.getItem('absensiHarian'))   || [];
    hafalanList     = JSON.parse(localStorage.getItem('hafalanList'))     || [];
    sholatList      = JSON.parse(localStorage.getItem('sholatList'))      || [];
    absensiGuruList = JSON.parse(localStorage.getItem('absensiGuruList')) || [];
    document.getElementById('syncStatus').innerText = '🔴 Offline (data cache)';
  }
  renderSemua();
}

async function kirimKeServer(action, payload){
  if(!APPS_SCRIPT_URL) return;
  try{
    await fetch(APPS_SCRIPT_URL, {
      method:'POST',
      headers:{'Content-Type':'text/plain'},
      body: JSON.stringify({ action, ...payload })
    });
  }catch(err){ console.error('Gagal kirim ke server:', err); }
}

function renderSemua(){
  renderDashboard();
  renderTabelAbsenHariIni();
  renderTabelHafalanHariIni();
  renderTabelSholatHariIni();
  renderFilterKelasOptions();
  renderLaporanOptions();
  if(isAdminUnlocked) renderTabelSiswa();
  renderRekap();
}

// ================== NAVIGASI ==================
document.querySelectorAll('.nav-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+btn.dataset.page).classList.add('active');
    document.getElementById('pageTitle').innerText = btn.innerText.trim();
    document.getElementById('sidebar').classList.remove('open');
  });
});
document.getElementById('btnToggleSidebar').addEventListener('click', ()=>{
  document.getElementById('sidebar').classList.toggle('open');
});
document.getElementById('btnRefresh').addEventListener('click', loadAllDataFromServer);

function tickJam(){
  document.getElementById('jamSekarang').innerText = new Date().toLocaleString('id-ID');
}
setInterval(tickJam, 1000);

// ================== DASHBOARD ==================
let chartMingguan = null;

function renderDashboard(){
  const today = todayStr();
  const absenHariIni = absensiHarian.filter(a=>a.tanggal===today);
  const sudahMasuk = absenHariIni.filter(a=>a.jamMasuk).length;
  const terlambat  = absenHariIni.filter(a=>a.statusMasuk==='Terlambat').length;
  const sudahPulang = absenHariIni.filter(a=>a.jamPulang).length;
  const hafalanHariIni = hafalanList.filter(h=>h.tanggal===today).length;
  const dhuhaHariIni = sholatList.filter(s=>s.tanggal===today && s.jenis==='Dhuha').length;
  const dzuhurHariIni = sholatList.filter(s=>s.tanggal===today && s.jenis==='Dzuhur').length;

  const stats = [
    { label:'Total Siswa', val: siswaList.length },
    { label:'Sudah Absen Masuk', val: sudahMasuk },
    { label:'Terlambat', val: terlambat },
    { label:'Sudah Absen Pulang', val: sudahPulang },
    { label:'Setoran Hafalan Hari Ini', val: hafalanHariIni },
    { label:'Absen Dhuha', val: dhuhaHariIni },
    { label:'Absen Dzuhur', val: dzuhurHariIni },
  ];
  document.getElementById('statGrid').innerHTML = stats.map(s=>`
    <div class="stat-card"><h4>${s.label}</h4><div class="num">${s.val}</div></div>
  `).join('');

  const labels = [], dataMasuk = [], dataHafalan = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const str = d.toISOString().slice(0,10);
    labels.push(d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric'}));
    dataMasuk.push(absensiHarian.filter(a=>a.tanggal===str && a.jamMasuk).length);
    dataHafalan.push(hafalanList.filter(h=>h.tanggal===str).length);
  }
  const ctx = document.getElementById('chartMingguan').getContext('2d');
  if(chartMingguan) chartMingguan.destroy();
  chartMingguan = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[
      { label:'Absen Masuk', data:dataMasuk, borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,.15)', tension:.3, fill:true },
      { label:'Setoran Hafalan', data:dataHafalan, borderColor:'#f97316', backgroundColor:'rgba(249,115,22,.15)', tension:.3, fill:true }
    ]},
    options:{ responsive:true, plugins:{legend:{position:'bottom'}} }
  });

  const guruHariIni = absensiGuruList.filter(g=>g.tanggal===today);
  document.getElementById('guruPiketHariIni').innerHTML = guruHariIni.map(g=>`
    <div class="item"><strong>${g.jamLogin}</strong> — ${g.nama} login sebagai guru piket</div>
  `).join('') || '<p>Belum ada guru piket login hari ini.</p>';

  let aktivitas = [];
  absensiHarian.forEach(a=>{
    if(a.jamMasuk) aktivitas.push({waktu:a.tanggal+' '+a.jamMasuk, teks:`${a.nama} absen masuk (${a.statusMasuk})`});
    if(a.jamPulang) aktivitas.push({waktu:a.tanggal+' '+a.jamPulang, teks:`${a.nama} absen pulang`});
  });
  hafalanList.forEach(h=> aktivitas.push({waktu:h.tanggal+' '+h.waktu, teks:`${h.nama} setor hafalan ${h.jenis} - ${h.surat} (${h.predikat})`}));
  sholatList.forEach(s=> aktivitas.push({waktu:s.tanggal+' '+s.waktu, teks:`${s.nama} absen sholat ${s.jenis}`}));
  aktivitas.sort((a,b)=> b.waktu.localeCompare(a.waktu));
  document.getElementById('aktivitasTerbaru').innerHTML = aktivitas.slice(0,15).map(a=>`
    <div class="item"><strong>${a.waktu}</strong> — ${a.teks}</div>
  `).join('') || '<p>Belum ada aktivitas.</p>';
}

// ================== ABSEN MASUK & PULANG ==================
document.getElementById('btnModeMasuk').addEventListener('click', ()=>{
  modeAbsen='masuk';
  document.getElementById('btnModeMasuk').classList.add('active');
  document.getElementById('btnModePulang').classList.remove('active');
  document.getElementById('labelScanAbsen').innerText='Scan Kartu untuk Absen Masuk';
});
document.getElementById('btnModePulang').addEventListener('click', ()=>{
  modeAbsen='pulang';
  document.getElementById('btnModePulang').classList.add('active');
  document.getElementById('btnModeMasuk').classList.remove('active');
  document.getElementById('labelScanAbsen').innerText='Scan Kartu untuk Absen Pulang';
});

document.getElementById('inputScanAbsen').addEventListener('keypress', e=>{
  if(e.key==='Enter'){
    const nis = e.target.value.trim();
    e.target.value='';
    prosesScanAbsen(nis);
  }
});

async function prosesScanAbsen(nis){
  const fb = document.getElementById('feedbackAbsen');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan: '+nis; beep(false); return; }

  const today = todayStr();
  let rec = absensiHarian.find(a=>a.nis===nis && a.tanggal===today);

  if(modeAbsen==='masuk'){
    if(rec && rec.jamMasuk){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} sudah absen masuk hari ini.`; beep(false); return; }
    const jam = nowTime();
    const status = jam > APP_CONFIG.jamMasukBatas ? 'Terlambat' : 'Tepat Waktu';
    if(!rec){ rec = { nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:today, jamMasuk:jam, statusMasuk:status, jamPulang:'' }; absensiHarian.push(rec); }
    else { rec.jamMasuk=jam; rec.statusMasuk=status; }
    fb.className='scan-feedback success'; fb.innerText=`✅ ${siswa.nama} - Absen Masuk (${status}) jam ${jam}`;
    beep(true);
    kirimKeServer('saveAbsensi', rec);
  } else {
    if(!rec || !rec.jamMasuk){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} belum absen masuk hari ini.`; beep(false); return; }
    if(rec.jamPulang){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} sudah absen pulang.`; beep(false); return; }
    rec.jamPulang = nowTime();
    fb.className='scan-feedback success'; fb.innerText=`✅ ${siswa.nama} - Absen Pulang jam ${rec.jamPulang}`;
    beep(true);
    kirimKeServer('saveAbsensi', rec);
  }
  localStorage.setItem('absensiHarian', JSON.stringify(absensiHarian));
  renderDashboard(); renderTabelAbsenHariIni();
}

function renderTabelAbsenHariIni(){
  const today = todayStr();
  const data = absensiHarian.filter(a=>a.tanggal===today);
  const tbl = document.getElementById('tabelAbsenHariIni');
  tbl.innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Jam Masuk</th><th>Status</th><th>Jam Pulang</th></tr>` +
    data.map(a=>`<tr><td>${a.nis}</td><td>${a.nama}</td><td>${a.kelas}</td><td>${a.jamMasuk||'-'}</td><td>${a.statusMasuk||'-'}</td><td>${a.jamPulang||'-'}</td></tr>`).join('');
}

// ================== SETORAN HAFALAN ==================
document.getElementById('inputScanHafalan').addEventListener('keypress', e=>{
  if(e.key==='Enter'){
    const nis = e.target.value.trim();
    e.target.value='';
    const siswa = getSiswaByNIS(nis);
    const fb = document.getElementById('feedbackHafalan');
    if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }
    fb.className='scan-feedback success'; fb.innerText=`Kartu terbaca: ${siswa.nama}`;
    bukaModalHafalan(siswa);
  }
});

function bukaModalHafalan(siswa){
  document.getElementById('infoSiswaHafalan').innerText = `${siswa.nama} - NIS ${siswa.nis} - Kelas ${siswa.kelas}`;
  document.getElementById('hafalanNis').value = siswa.nis;
  updateOpsiSurat();
  document.getElementById('modalHafalan').classList.remove('hidden');
}
document.getElementById('hafalanJenis').addEventListener('change', updateOpsiSurat);
function updateOpsiSurat(){
  const jenis = document.getElementById('hafalanJenis').value;
  const list = jenis==='Juz 30' ? JUZ30_LIST : SURAT_PILIHAN_LIST;
  document.getElementById('hafalanSurat').innerHTML = list.map(s=>`<option>${s}</option>`).join('');
}
document.getElementById('btnBatalHafalan').addEventListener('click', ()=> document.getElementById('modalHafalan').classList.add('hidden'));

document.getElementById('btnSimpanHafalan').addEventListener('click', async ()=>{
  const nis = document.getElementById('hafalanNis').value;
  const siswa = getSiswaByNIS(nis);
  const rec = {
    nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:todayStr(), waktu:nowTime(),
    jenis: document.getElementById('hafalanJenis').value,
    surat: document.getElementById('hafalanSurat').value,
    predikat: document.getElementById('hafalanPredikat').value,
    catatan: document.getElementById('hafalanCatatan').value
  };
  hafalanList.push(rec);
  localStorage.setItem('hafalanList', JSON.stringify(hafalanList));
  document.getElementById('modalHafalan').classList.add('hidden');
  document.getElementById('hafalanCatatan').value='';
  renderDashboard(); renderTabelHafalanHariIni();
  await kirimKeServer('saveHafalan', rec);
});

function renderTabelHafalanHariIni(){
  const today = todayStr();
  const data = hafalanList.filter(h=>h.tanggal===today);
  const tbl = document.getElementById('tabelHafalanHariIni');
  tbl.innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Jenis</th><th>Surat</th><th>Predikat</th><th>Waktu</th></tr>` +
    data.map(h=>`<tr><td>${h.nis}</td><td>${h.nama}</td><td>${h.jenis}</td><td>${h.surat}</td><td>${h.predikat}</td><td>${h.waktu}</td></tr>`).join('');
}

// ================== ABSEN SHOLAT ==================
document.getElementById('btnModeDhuha').addEventListener('click', ()=>{
  modeSholat='dhuha';
  document.getElementById('btnModeDhuha').classList.add('active');
  document.getElementById('btnModeDzuhur').classList.remove('active');
  document.getElementById('labelScanSholat').innerText='Scan Kartu untuk Absen Sholat Dhuha';
});
document.getElementById('btnModeDzuhur').addEventListener('click', ()=>{
  modeSholat='dzuhur';
  document.getElementById('btnModeDzuhur').classList.add('active');
  document.getElementById('btnModeDhuha').classList.remove('active');
  document.getElementById('labelScanSholat').innerText='Scan Kartu untuk Absen Sholat Dzuhur';
});

document.getElementById('inputScanSholat').addEventListener('keypress', e=>{
  if(e.key==='Enter'){
    const nis = e.target.value.trim();
    e.target.value='';
    prosesScanSholat(nis);
  }
});

async function prosesScanSholat(nis){
  const fb = document.getElementById('feedbackSholat');
  const siswa = getSiswaByNIS(nis);
  if(!siswa){ fb.className='scan-feedback error'; fb.innerText='❌ NIS tidak ditemukan.'; beep(false); return; }

  const today = todayStr();
  const jenis = modeSholat==='dhuha' ? 'Dhuha' : 'Dzuhur';
  const sudah = sholatList.find(s=>s.nis===nis && s.tanggal===today && s.jenis===jenis);
  if(sudah){ fb.className='scan-feedback error'; fb.innerText=`⚠️ ${siswa.nama} sudah absen sholat ${jenis} hari ini.`; beep(false); return; }

  const rec = { nis, nama:siswa.nama, kelas:siswa.kelas, tanggal:today, jenis, waktu:nowTime(), status:'Hadir' };
  sholatList.push(rec);
  localStorage.setItem('sholatList', JSON.stringify(sholatList));
  fb.className='scan-feedback success'; fb.innerText=`✅ ${siswa.nama} - Absen Sholat ${jenis} jam ${rec.waktu}`;
  beep(true);
  renderDashboard(); renderTabelSholatHariIni();
  await kirimKeServer('saveSholat', rec);
}

function renderTabelSholatHariIni(){
  const today = todayStr();
  const data = sholatList.filter(s=>s.tanggal===today);
  const tbl = document.getElementById('tabelSholatHariIni');
  tbl.innerHTML = `<tr><th>NIS</th><th>Nama</th><th>Jenis</th><th>Waktu</th></tr>` +
    data.map(s=>`<tr><td>${s.nis}</td><td>${s.nama}</td><td>${s.jenis}</td><td>${s.waktu}</td></tr>`).join('');
}

// ================== LOGIN GURU PIKET ==================
document.getElementById('btnLoginGuruPiket').addEventListener('click', ()=>{
  document.getElementById('modalGuruPiket').classList.remove('hidden');
});
document.getElementById('btnBatalLoginGuru').addEventListener('click', ()=>{
  document.getElementById('modalGuruPiket').classList.add('hidden');
});

document.getElementById('btnSubmitLoginGuru').addEventListener('click', async ()=>{
  const username = document.getElementById('gpUsername').value.trim();
  const password = document.getElementById('gpPassword').value.trim();
  const guru = GURU_PIKET_LIST.find(g=>g.username===username && g.password===password);
  if(!guru){ alert('Username atau password salah!'); return; }

  const today = todayStr();
  let sudahAbsen = absensiGuruList.find(g=>g.username===username && g.tanggal===today);
  if(!sudahAbsen){
    const rec = { username, nama:guru.nama, tanggal:today, jamLogin:nowTime() };
    absensiGuruList.push(rec);
    localStorage.setItem('absensiGuruList', JSON.stringify(absensiGuruList));
    await kirimKeServer('saveAbsensiGuru', rec);
  }

  localStorage.setItem('guruPiketAktif', JSON.stringify({username, nama:guru.nama}));
  tampilkanStatusGuruPiket(guru.nama);
  document.getElementById('modalGuruPiket').classList.add('hidden');
  document.getElementById('gpUsername').value='';
  document.getElementById('gpPassword').value='';
  renderDashboard();
});

document.getElementById('btnLogoutGuruPiket').addEventListener('click', ()=>{
  localStorage.removeItem('guruPiketAktif');
  document.getElementById('guruPiketBelumLogin').classList.remove('hidden');
  document.getElementById('guruPiketSudahLogin').classList.add('hidden');
});

function tampilkanStatusGuruPiket(nama){
  document.getElementById('namaGuruPiketAktif').innerText = nama;
  document.getElementById('guruPiketBelumLogin').classList.add('hidden');
  document.getElementById('guruPiketSudahLogin').classList.remove('hidden');
}

function cekSesiGuruPiket(){
  const data = JSON.parse(localStorage.getItem('guruPiketAktif'));
  if(data) tampilkanStatusGuruPiket(data.nama);
}

// ================== DATA SISWA (ADMIN) ==================
document.getElementById('btnBukaSiswa').addEventListener('click', ()=>{
  const pin = document.getElementById('inputPinSiswa').value;
  if(pin === ADMIN_PIN){
    isAdminUnlocked = true;
    document.getElementById('siswaLocked').classList.add('hidden');
    document.getElementById('siswaUnlocked').classList.remove('hidden');
    renderTabelSiswa();
  } else {
    alert('PIN salah!');
  }
});

function renderFilterKelasOptions(){
  const kelasUnik = [...new Set(siswaList.map(s=>s.kelas))];
  const opt = '<option value="">Semua Kelas</option>' + kelasUnik.map(k=>`<option value="${k}">${k}</option>`).join('');
  document.getElementById('filterKelasSiswa').innerHTML = opt;
  document.getElementById('rekapFilterKelas').innerHTML = opt;
  document.getElementById('laporanFilterKelas').innerHTML = '<option value="">-- Pilih Kelas untuk Laporan Massal --</option>' +
    kelasUnik.map(k=>`<option value="${k}">${k}</option>`).join('');
}

function renderLaporanOptions(){
  document.getElementById('laporanPilihSiswa').innerHTML = '<option value="">-- Pilih Siswa --</option>' +
    siswaList.map(s=>`<option value="${s.nis}">${s.nama} - ${s.kelas}</option>`).join('');
}

function renderTabelSiswa(){
  const keyword = (document.getElementById('searchSiswa').value||'').toLowerCase();
  const filterKelas = document.getElementById('filterKelasSiswa').value;
  let data = siswaList.filter(s=>
    (s.nama.toLowerCase().includes(keyword) || s.nis.includes(keyword)) &&
    (!filterKelas || s.kelas===filterKelas)
  );
  const tbl = document.getElementById('tabelSiswa');
  tbl.innerHTML = `<tr><th><input type="checkbox" id="checkAllSiswa"></th><th>NIS</th><th>Nama</th><th>Kelas</th><th>JK</th><th>Aksi</th></tr>` +
    data.map(s=>`
      <tr>
        <td><input type="checkbox" class="chk-siswa" value="${s.nis}"></td>
        <td>${s.nis}</td><td>${s.nama}</td><td>${s.kelas}</td><td>${s.jk}</td>
        <td>
          <button class="btn-secondary" onclick="bukaEditSiswa('${s.nis}')">✏️</button>
          <button class="btn-secondary" onclick="hapusSiswa('${s.nis}')">🗑️</button>
          <button class="btn-secondary" onclick="tampilkanKartuMultiple([getSiswaByNIS('${s.nis}')])">🪪 Kartu</button>
        </td>
      </tr>
    `).join('');

  const chkAll = document.getElementById('checkAllSiswa');
  if(chkAll){
    chkAll.addEventListener('change', ()=>{
      document.querySelectorAll('.chk-siswa').forEach(c=> c.checked = chkAll.checked);
    });
  }
}
document.getElementById('searchSiswa').addEventListener('input', renderTabelSiswa);
document.getElementById('filterKelasSiswa').addEventListener('change', renderTabelSiswa);

document.getElementById('btnTambahSiswa').addEventListener('click', ()=>{
  editingNis = null;
  document.getElementById('judulModalSiswa').innerText='Tambah Siswa';
  document.getElementById('formNis').value='';
  document.getElementById('formNama').value='';
  document.getElementById('formKelas').value='';
  document.getElementById('formJk').value='L';
  document.getElementById('formNis').disabled=false;
  document.getElementById('modalSiswaForm').classList.remove('hidden');
});

function bukaEditSiswa(nis){
  const s = getSiswaByNIS(nis);
  editingNis = nis;
  document.getElementById('judulModalSiswa').innerText='Edit Siswa';
  document.getElementById('formNis').value=s.nis;
  document.getElementById('formNis').disabled=true;
  document.getElementById('formNama').value=s.nama;
  document.getElementById('formKelas').value=s.kelas;
  document.getElementById('formJk').value=s.jk;
  document.getElementById('modalSiswaForm').classList.remove('hidden');
}

document.getElementById('btnBatalSiswa').addEventListener('click', ()=> document.getElementById('modalSiswaForm').classList.add('hidden'));

document.getElementById('btnSimpanSiswa').addEventListener('click', async ()=>{
  const nis = document.getElementById('formNis').value.trim();
  const nama = document.getElementById('formNama').value.trim();
  const kelas = document.getElementById('formKelas').value.trim();
  const jk = document.getElementById('formJk').value;
  if(!nis || !nama || !kelas){ alert('Lengkapi semua data!'); return; }

  if(editingNis){
    const s = getSiswaByNIS(editingNis);
    s.nama=nama; s.kelas=kelas; s.jk=jk;
  } else {
    if(getSiswaByNIS(nis)){ alert('NIS sudah terdaftar!'); return; }
    siswaList.push({nis, nama, kelas, jk});
  }
  localStorage.setItem('siswaList', JSON.stringify(siswaList));
  document.getElementById('modalSiswaForm').classList.add('hidden');
  renderTabelSiswa(); renderFilterKelasOptions(); renderLaporanOptions(); renderDashboard();
  await kirimKeServer('saveSiswa', {nis, nama, kelas, jk});
});

async function hapusSiswa(nis){
  if(!confirm('Yakin hapus siswa ini?')) return;
  siswaList = siswaList.filter(s=>s.nis!==nis);
  localStorage.setItem('siswaList', JSON.stringify(siswaList));
  renderTabelSiswa(); renderFilterKelasOptions(); renderLaporanOptions(); renderDashboard();
  await kirimKeServer('deleteSiswa', {nis});
}

// ================== GENERATE KARTU BARCODE/QR ==================
function buatHtmlKartu(s){
  return `
    <div class="kartu-siswa" data-nis="${s.nis}">
      <h4>${APP_CONFIG.namaSekolah}</h4>
      <p>Kartu Monitoring Siswa ${APP_CONFIG.tahunAjaran}</p>
      <h3>${s.nama}</h3>
      <p>NIS: ${s.nis} | Kelas: ${s.kelas}</p>
      <canvas id="barcode-${s.nis}" class="barcode-canvas"></canvas>
      <div id="qr-${s.nis}" class="qr-wrap"></div>
    </div>
  `;
}

function renderBarcodeQR(data){
  setTimeout(()=>{
    data.forEach(s=>{
      JsBarcode(`#barcode-${s.nis}`, s.nis, { format:"CODE128", width:2, height:50, displayValue:true });
      document.getElementById(`qr-${s.nis}`).innerHTML = '';
      new QRCode(document.getElementById(`qr-${s.nis}`), { text:s.nis, width:80, height:80 });
    });
  }, 100);
}

function tampilkanKartuMultiple(data){
  if(!data || data.length===0){ alert('Tidak ada siswa untuk ditampilkan.'); return; }
  document.getElementById('areaKartu').innerHTML = data.map(buatHtmlKartu).join('');
  document.getElementById('modalKartu').classList.remove('hidden');
  renderBarcodeQR(data);
}

document.getElementById('btnCetakDipilih').addEventListener('click', ()=>{
  const checked = [...document.querySelectorAll('.chk-siswa:checked')].map(c=>c.value);
  if(checked.length===0){ alert('Pilih minimal 1 siswa dengan checkbox terlebih dahulu.'); return; }
  tampilkanKartuMultiple(siswaList.filter(s=> checked.includes(s.nis)));
});

document.getElementById('btnCetakPerKelas').addEventListener('click', ()=>{
  const kelas = document.getElementById('filterKelasSiswa').value;
  if(!kelas){ alert('Pilih kelas terlebih dahulu di dropdown filter kelas.'); return; }
  tampilkanKartuMultiple(siswaList.filter(s=>s.kelas===kelas));
});

document.getElementById('btnCetakSemua').addEventListener('click', ()=>{
  tampilkanKartuMultiple(siswaList);
});

document.getElementById('btnTutupKartu').addEventListener('click', ()=> document.getElementById('modalKartu').classList.add('hidden'));
document.getElementById('btnPrintKartu').addEventListener('click', ()=> window.print());

document.getElementById('btnUnduhKartu').addEventListener('click', async ()=>{
  const kartuEls = document.querySelectorAll('#areaKartu .kartu-siswa');
  if(kartuEls.length===0) return;
  if(kartuEls.length > 1){
    alert(`Akan mengunduh ${kartuEls.length} gambar kartu. Browser mungkin akan meminta izin "Allow multiple downloads" - silakan klik Izinkan.`);
  }
  for(let i=0;i<kartuEls.length;i++){
    const canvas = await html2canvas(kartuEls[i], {scale:2, backgroundColor:'#ffffff'});
    const nis = kartuEls[i].dataset.nis;
    const link = document.createElement('a');
    link.download = `kartu_${nis}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    await new Promise(r=>setTimeout(r, 400));
  }
});

// ================== SCAN VIA KAMERA ==================
let html5QrCode = null;
let targetInputKamera = null;

function bukaKamera(targetInputId){
  targetInputKamera = targetInputId;
  document.getElementById('modalKamera').classList.remove('hidden');
  html5QrCode = new Html5Qrcode("readerKamera");
  html5QrCode.start({facingMode:"environment"}, {fps:10, qrbox:220}, (text)=>{
    document.getElementById(targetInputKamera).value = text;
    const ev = new KeyboardEvent('keypress', {key:'Enter'});
    document.getElementById(targetInputKamera).dispatchEvent(ev);
    tutupKamera();
  }).catch(err=> console.error(err));
}
function tutupKamera(){
  if(html5QrCode){ html5QrCode.stop().then(()=>html5QrCode.clear()).catch(()=>{}); }
  document.getElementById('modalKamera').classList.add('hidden');
}
document.getElementById('btnKameraAbsen').addEventListener('click', ()=> bukaKamera('inputScanAbsen'));
document.getElementById('btnKameraHafalan').addEventListener('click', ()=> bukaKamera('inputScanHafalan'));
document.getElementById('btnKameraSholat').addEventListener('click', ()=> bukaKamera('inputScanSholat'));
document.getElementById('btnTutupKamera').addEventListener('click', tutupKamera);

// ================== REKAP HASIL ==================
document.querySelectorAll('#page-rekap .mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#page-rekap .mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    rekapTab = btn.dataset.tab;
    renderRekap();
  });
});
document.getElementById('btnFilterRekap').addEventListener('click', renderRekap);

function renderRekap(){
  const dari = document.getElementById('rekapDariTgl').value;
  const sampai = document.getElementById('rekapSampaiTgl').value;
  const kelas = document.getElementById('rekapFilterKelas').value;
  const tbl = document.getElementById('tabelRekap');

  function cocokTanggal(tgl){
    if(dari && tgl < dari) return false;
    if(sampai && tgl > sampai) return false;
    return true;
  }

  if(rekapTab==='absen'){
    let data = absensiHarian.filter(a=> cocokTanggal(a.tanggal) && (!kelas || a.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Jam Masuk</th><th>Status</th><th>Jam Pulang</th></tr>` +
      data.map(a=>`<tr><td>${a.tanggal}</td><td>${a.nis}</td><td>${a.nama}</td><td>${a.kelas}</td><td>${a.jamMasuk||'-'}</td><td>${a.statusMasuk||'-'}</td><td>${a.jamPulang||'-'}</td></tr>`).join('');
  } else if(rekapTab==='hafalan'){
    let data = hafalanList.filter(h=> cocokTanggal(h.tanggal) && (!kelas || h.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Jenis</th><th>Surat</th><th>Predikat</th><th>Catatan</th></tr>` +
      data.map(h=>`<tr><td>${h.tanggal}</td><td>${h.nis}</td><td>${h.nama}</td><td>${h.kelas}</td><td>${h.jenis}</td><td>${h.surat}</td><td>${h.predikat}</td><td>${h.catatan||'-'}</td></tr>`).join('');
  } else if(rekapTab==='sholat'){
    let data = sholatList.filter(s=> cocokTanggal(s.tanggal) && (!kelas || s.kelas===kelas));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Jenis</th><th>Waktu</th></tr>` +
      data.map(s=>`<tr><td>${s.tanggal}</td><td>${s.nis}</td><td>${s.nama}</td><td>${s.kelas}</td><td>${s.jenis}</td><td>${s.waktu}</td></tr>`).join('');
  } else {
    let data = absensiGuruList.filter(g=> cocokTanggal(g.tanggal));
    tbl.innerHTML = `<tr><th>Tanggal</th><th>Nama Guru</th><th>Jam Login</th></tr>` +
      data.map(g=>`<tr><td>${g.tanggal}</td><td>${g.nama}</td><td>${g.jamLogin}</td></tr>`).join('');
  }
}

document.getElementById('btnExportCSV').addEventListener('click', ()=> exportRekap('csv'));
document.getElementById('btnExportExcel').addEventListener('click', ()=> exportRekap('xls'));

function exportRekap(type){
  const tbl = document.getElementById('tabelRekap');
  let csv = [];
  tbl.querySelectorAll('tr').forEach(tr=>{
    let row = [];
    tr.querySelectorAll('th,td').forEach(cell=> row.push('"'+cell.innerText+'"'));
    csv.push(row.join(','));
  });
  const blob = new Blob([csv.join('\n')], {type: type==='csv' ? 'text/csv' : 'application/vnd.ms-excel'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rekap_${rekapTab}_${todayStr()}.${type==='csv'?'csv':'xls'}`;
  a.click();
}

// ================== LAPORAN BULANAN ==================
function buatHtmlLaporan(siswa, bulan){
  const absenBulan = absensiHarian.filter(a=> a.nis===siswa.nis && a.tanggal.startsWith(bulan));
  const hafalanBulan = hafalanList.filter(h=> h.nis===siswa.nis && h.tanggal.startsWith(bulan));
  const sholatBulan = sholatList.filter(s=> s.nis===siswa.nis && s.tanggal.startsWith(bulan));

  const totalHadir = absenBulan.filter(a=>a.jamMasuk).length;
  const totalTerlambat = absenBulan.filter(a=>a.statusMasuk==='Terlambat').length;
  const totalTepatWaktu = absenBulan.filter(a=>a.statusMasuk==='Tepat Waktu').length;
  const totalDhuha = sholatBulan.filter(s=>s.jenis==='Dhuha').length;
  const totalDzuhur = sholatBulan.filter(s=>s.jenis==='Dzuhur').length;

  let namaBulan = bulan;
  try{ namaBulan = new Date(bulan+'-01').toLocaleDateString('id-ID',{month:'long', year:'numeric'}); }catch(e){}

  return `
    <div class="laporan-card" data-nis="${siswa.nis}">
      <div class="laporan-header">
        <h2>${APP_CONFIG.namaSekolah}</h2>
        <p>Laporan Bulanan Kegiatan Siswa - ${namaBulan}</p>
      </div>
      <table class="laporan-info">
        <tr><td><strong>Nama</strong></td><td>: ${siswa.nama}</td></tr>
        <tr><td><strong>NIS</strong></td><td>: ${siswa.nis}</td></tr>
        <tr><td><strong>Kelas</strong></td><td>: ${siswa.kelas}</td></tr>
      </table>

      <h4>📋 Rekap Kehadiran</h4>
      <table class="laporan-table">
        <tr><th>Total Hadir</th><td>${totalHadir} hari</td></tr>
        <tr><th>Tepat Waktu</th><td>${totalTepatWaktu} hari</td></tr>
        <tr><th>Terlambat</th><td>${totalTerlambat} hari</td></tr>
      </table>

      <h4>📖 Rekap Setoran Hafalan (${hafalanBulan.length}x)</h4>
      <table class="laporan-table">
        <tr><th>Tanggal</th><th>Jenis</th><th>Surat</th><th>Predikat</th></tr>
        ${hafalanBulan.map(h=>`<tr><td>${h.tanggal}</td><td>${h.jenis}</td><td>${h.surat}</td><td>${h.predikat}</td></tr>`).join('') || '<tr><td colspan="4">Belum ada setoran bulan ini</td></tr>'}
      </table>

      <h4>🕌 Rekap Sholat Berjamaah</h4>
      <table class="laporan-table">
        <tr><th>Sholat Dhuha</th><td>${totalDhuha} kali</td></tr>
        <tr><th>Sholat Dzuhur</th><td>${totalDzuhur} kali</td></tr>
      </table>

      <p class="laporan-footer">Dicetak otomatis oleh Sistem E-Monitoring pada ${new Date().toLocaleString('id-ID')}</p>
    </div>
  `;
}

document.getElementById('btnTampilkanLaporan').addEventListener('click', ()=>{
  const nis = document.getElementById('laporanPilihSiswa').value;
  const bulan = document.getElementById('laporanBulan').value;
  if(!nis || !bulan){ alert('Pilih siswa dan bulan terlebih dahulu.'); return; }
  const siswa = getSiswaByNIS(nis);
  document.getElementById('areaLaporan').innerHTML = buatHtmlLaporan(siswa, bulan);
});

document.getElementById('btnGenerateLaporanSemua').addEventListener('click', ()=>{
  const bulan = document.getElementById('laporanBulan').value;
  const kelas = document.getElementById('laporanFilterKelas').value;
  if(!bulan || !kelas){ alert('Pilih bulan dan kelas terlebih dahulu.'); return; }
  const data = siswaList.filter(s=>s.kelas===kelas);
  document.getElementById('areaLaporan').innerHTML = data.map(s=> buatHtmlLaporan(s, bulan)).join('<div class="page-break"></div>');
});

document.getElementById('btnGenerateLaporanSemuaSiswa').addEventListener('click', ()=>{
  const bulan = document.getElementById('laporanBulan').value;
  if(!bulan){ alert('Pilih bulan terlebih dahulu.'); return; }
  document.getElementById('areaLaporan').innerHTML = siswaList.map(s=> buatHtmlLaporan(s, bulan)).join('<div class="page-break"></div>');
});

document.getElementById('btnPrintLaporan').addEventListener('click', ()=>{
  if(!document.getElementById('areaLaporan').innerHTML.trim()){ alert('Tampilkan laporan terlebih dahulu.'); return; }
  window.print();
});

document.getElementById('btnUnduhLaporan').addEventListener('click', async ()=>{
  const cards = document.querySelectorAll('#areaLaporan .laporan-card');
  if(cards.length===0){ alert('Tampilkan laporan terlebih dahulu.'); return; }
  if(cards.length > 1){
    alert(`Akan mengunduh ${cards.length} gambar laporan. Browser mungkin meminta izin "Allow multiple downloads" - silakan klik Izinkan.`);
  }
  for(let i=0;i<cards.length;i++){
    const canvas = await html2canvas(cards[i], {scale:2, backgroundColor:'#ffffff'});
    const nis = cards[i].dataset.nis;
    const link = document.createElement('a');
    link.download = `laporan_${nis}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    await new Promise(r=>setTimeout(r, 400));
  }
});

// ================== INIT ==================
async function init(){
  document.getElementById('namaSekolahLabel').innerText = APP_CONFIG.namaSekolah;
  applyTheme(localStorage.getItem('theme') || 'light');
  cekSesiGuruPiket();
  await loadAllDataFromServer();
  tickJam();
  setInterval(loadAllDataFromServer, 20000);
}
window.addEventListener('DOMContentLoaded', init);