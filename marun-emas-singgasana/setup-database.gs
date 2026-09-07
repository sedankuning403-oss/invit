/**
 * DATABASE PUSAT 296 UNDANGAN — Google Apps Script v2.0
 * Disesuaikan dengan 47 template pada TEMPLATE 296 Undangan.zip.
 * Mendukung JSON/FormData serta alias field Indonesia dan Inggris.
 *
 * CARA PASANG
 * 1. Buat Spreadsheet > Ekstensi > Apps Script.
 * 2. Tempel seluruh kode ini, simpan, jalankan setupDatabaseUndangan().
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me | Who has access: Anyone.
 */

const APP = {
  VERSION: '2.0', TZ: 'Asia/Jakarta',
  SHEETS: {
    ACARA: ['EVENT_ID','NAMA_ACARA','NAMA_TEMPLATE','URL_UNDANGAN','TANGGAL_ACARA','STATUS','DIBUAT_PADA','CATATAN'],
    TAMU: ['GUEST_ID','EVENT_ID','NAMA_TAMU','NOMOR_WA','ALAMAT','KATEGORI','URL_PERSONAL','STATUS_KIRIM','CATATAN'],
    RESPON: ['RESPONSE_ID','EVENT_ID','GUEST_ID','NAMA_TAMU','KEHADIRAN','JUMLAH_TAMU','PESAN','TAMPILKAN_PESAN','NAMA_TEMPLATE','SUMBER_URL','DIBUAT_PADA','DIPERBARUI_PADA'],
    RINGKASAN: ['EVENT_ID','NAMA_ACARA','TOTAL_RESPON','HADIR','TIDAK_HADIR','RAGU_RAGU','JUMLAH_ORANG_HADIR','JUMLAH_PESAN','TERAKHIR_DIPERBARUI'],
    PENGATURAN: ['KUNCI','NILAI','KETERANGAN']
  }
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('296 Undangan')
    .addItem('Buat/Periksa Database','setupDatabaseUndangan')
    .addItem('Tambah Contoh Acara','tambahContohAcara')
    .addItem('Perbarui Ringkasan','perbaruiRingkasan').addToUi();
}

/** Membuat tabel tanpa menghapus data yang sudah ada. */
function setupDatabaseUndangan() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  Object.keys(APP.SHEETS).forEach(n => buatSheet_(ss,n,APP.SHEETS[n]));
  isiPengaturan_(ss.getSheetByName('PENGATURAN'));
  pasangValidasi_(ss);
  formatKolom_(ss);
  perbaruiRingkasan();
  SpreadsheetApp.flush();
  ss.toast('Database pusat 296 Undangan siap.','Berhasil',6);
}

/** GET: ?action=list&event_id=KODE atau ?action=summary&event_id=KODE */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = teks_(p.action || 'list',30).toLowerCase();
    const eventId = alias_(p,['event_id','eventId','event','slug']);
    if (action === 'ping' || action === 'test')
      return output_({status:'success',message:'API 296 Undangan aktif',version:APP.VERSION},p.callback);
    if (action === 'summary' || action === 'ringkasan')
      return output_({status:'success',data:bacaRingkasan_(eventId)},p.callback);
    const limit = Math.min(Math.max(Number(p.limit)||100,1),500);
    const data = bacaRespon_(eventId,limit);
    return output_({status:'success',data:data,total:data.length},p.callback);
  } catch (err) {
    return output_({status:'error',message:String(err.message||err)});
  }
}

/** POST: menerima JSON text/plain, JSON application/json, atau FormData. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const b = bacaBody_(e);
    const eventId = teks_(alias_(b,['event_id','eventId','event','slug','wedding_id','weddingId']) || 'DEFAULT',100);
    const guestId = teks_(alias_(b,['guest_id','guestId','kode_tamu','kodeTamu','guest']),100);
    const name = amanSheet_(teks_(alias_(b,['nama','name','nama_tamu','guestName','guest_name','fullname','fullName']),120));
    const attendance = normalKehadiran_(alias_(b,['kehadiran','attendance','status','presence','hadir','attend']));
    const qty = attendance === 'HADIR' ? normalJumlah_(alias_(b,['jumlah_tamu','jumlahTamu','jumlah','qty','count','guestCount','guests'])) : 0;
    const message = amanSheet_(teks_(alias_(b,['pesan','message','ucapan','wishes','wish','comment','komentar','doa']),1500));
    const template = amanSheet_(teks_(alias_(b,['template','template_name','templateName','tema','theme']),120));
    const source = teks_(alias_(b,['source_url','sourceUrl','url','page_url','pageUrl']),500);
    if (!name) return output_({status:'error',message:'Nama tamu wajib diisi.'});
    if (!attendance) return output_({status:'error',message:'Status kehadiran wajib diisi.'});
    const result = simpanRespon_({eventId,guestId,name,attendance,qty,message,template,source});
    perbaruiRingkasan();
    return output_({status:'success',message:result.updated?'Konfirmasi berhasil diperbarui.':'Konfirmasi berhasil disimpan.',response_id:result.id,updated:result.updated});
  } catch (err) {
    return output_({status:'error',message:String(err.message||err)});
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** Upsert: GUEST_ID diprioritaskan; fallback EVENT_ID + nama tamu. */
function simpanRespon_(d) {
  const sh = db_().getSheetByName('RESPON');
  const v = sh.getDataRange().getValues();
  let rowNo = 0, oldId = '';
  for (let i=v.length-1;i>=1;i--) {
    const sameEvent = String(v[i][1]) === d.eventId;
    const sameGuest = d.guestId ? String(v[i][2]) === d.guestId : key_(v[i][3]) === key_(d.name);
    if (sameEvent && sameGuest) { rowNo=i+1; oldId=String(v[i][0]); break; }
  }
  const now = new Date();
  const id = oldId || id_('RSP');
  const created = rowNo ? sh.getRange(rowNo,11).getValue() : now;
  const row = [id,d.eventId,d.guestId,d.name,d.attendance,d.qty,d.message,'YA',d.template,d.source,created||now,now];
  if (rowNo) sh.getRange(rowNo,1,1,row.length).setValues([row]); else sh.appendRow(row);
  return {id:id,updated:Boolean(rowNo)};
}

/** Mengembalikan field ganda agar semua template lama dapat membacanya. */
function bacaRespon_(eventId,limit) {
  const sh = db_().getSheetByName('RESPON');
  if (!sh || sh.getLastRow()<2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,APP.SHEETS.RESPON.length).getValues()
    .filter(r => r[3] && String(r[7]).toUpperCase()!=='TIDAK' && (!eventId || String(r[1])===eventId))
    .sort((a,b) => new Date(b[11])-new Date(a[11])).slice(0,limit)
    .map(r => {
      const t=iso_(r[11]||r[10]), k=judulKehadiran_(r[4]), j=Number(r[5])||0, m=r[6]||'';
      return {id:r[0],event_id:r[1],guest_id:r[2],name:r[3],attendance:k,count:j,message:m,timestamp:t,date:t,
        nama:r[3],kehadiran:k,jumlah:j,ucapan:m,pesan:m,waktu:t};
    });
}

function perbaruiRingkasan() {
  const ss=db_(), rs=ss.getSheetByName('RESPON'), ac=ss.getSheetByName('ACARA'), sh=ss.getSheetByName('RINGKASAN');
  if (!rs || !ac || !sh) return;
  const map={};
  if (ac.getLastRow()>1) ac.getRange(2,1,ac.getLastRow()-1,2).getValues().forEach(r=>{
    if(r[0]) map[String(r[0])]={name:r[1]||'',total:0,hadir:0,tidak:0,ragu:0,orang:0,pesan:0};
  });
  if (rs.getLastRow()>1) rs.getRange(2,1,rs.getLastRow()-1,APP.SHEETS.RESPON.length).getValues().forEach(r=>{
    if(!r[1]||!r[3]) return;
    const id=String(r[1]);
    if(!map[id]) map[id]={name:'',total:0,hadir:0,tidak:0,ragu:0,orang:0,pesan:0};
    const x=map[id]; x.total++;
    if(r[4]==='HADIR'){x.hadir++;x.orang+=Number(r[5])||1;} else if(r[4]==='TIDAK_HADIR')x.tidak++; else x.ragu++;
    if(r[6]) x.pesan++;
  });
  if(sh.getLastRow()>1) sh.getRange(2,1,sh.getLastRow()-1,APP.SHEETS.RINGKASAN.length).clearContent();
  const now=new Date(), rows=Object.keys(map).sort().map(id=>{
    const x=map[id]; return [id,x.name,x.total,x.hadir,x.tidak,x.ragu,x.orang,x.pesan,now];
  });
  if(rows.length) sh.getRange(2,1,rows.length,rows[0].length).setValues(rows);
}

function bacaRingkasan_(eventId) {
  perbaruiRingkasan();
  const sh=db_().getSheetByName('RINGKASAN');
  if(sh.getLastRow()<2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,APP.SHEETS.RINGKASAN.length).getValues()
    .filter(r=>!eventId||String(r[0])===eventId).map(r=>({event_id:r[0],nama_acara:r[1],total_respon:r[2],hadir:r[3],
      tidak_hadir:r[4],ragu_ragu:r[5],jumlah_orang_hadir:r[6],jumlah_pesan:r[7],diperbarui:iso_(r[8])}));
}

function bacaBody_(e) {
  const p=(e&&e.parameter)||{}; let j={};
  const raw=e&&e.postData&&e.postData.contents;
  if(raw) try { j=JSON.parse(raw); } catch(ignore) {}
  return Object.assign({},p,j&&typeof j==='object'?j:{});
}

function buatSheet_(ss,name,headers) {
  let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name);
  if(sh.getMaxColumns()<headers.length) sh.insertColumnsAfter(sh.getMaxColumns(),headers.length-sh.getMaxColumns());
  const old=sh.getRange(1,1,1,headers.length).getValues()[0];
  headers.forEach((h,i)=>{if(!old[i])sh.getRange(1,i+1).setValue(h);});
  sh.getRange(1,1,1,headers.length).setBackground('#7B2D3B').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
  sh.setFrozenRows(1); sh.setRowHeight(1,34);
  if(!sh.getFilter()&&sh.getMaxRows()>1) sh.getRange(1,1,sh.getMaxRows(),headers.length).createFilter();
}

function isiPengaturan_(sh) {
  if(sh.getLastRow()>1) return;
  sh.getRange(2,1,5,3).setValues([
    ['NAMA_DATABASE','Database Pusat 296 Undangan','Nama database'],['VERSI',APP.VERSION,'Versi backend'],
    ['ZONA_WAKTU',APP.TZ,'Zona waktu'],['EVENT_ID_DEFAULT','DEFAULT','Jika HTML belum mengirim event_id'],
    ['PESAN_BARU_TAMPIL','YA','Moderasi melalui TAMPILKAN_PESAN']]);
}

function pasangValidasi_(ss) {
  validasi_(ss.getSheetByName('ACARA'),APP.SHEETS.ACARA,'STATUS',['AKTIF','NONAKTIF','SELESAI']);
  validasi_(ss.getSheetByName('TAMU'),APP.SHEETS.TAMU,'STATUS_KIRIM',['BELUM','TERKIRIM','GAGAL']);
  validasi_(ss.getSheetByName('RESPON'),APP.SHEETS.RESPON,'KEHADIRAN',['HADIR','TIDAK_HADIR','RAGU_RAGU']);
  validasi_(ss.getSheetByName('RESPON'),APP.SHEETS.RESPON,'TAMPILKAN_PESAN',['YA','TIDAK']);
}
function validasi_(sh,headers,h,items) {
  const c=headers.indexOf(h)+1, rule=SpreadsheetApp.newDataValidation().requireValueInList(items,true).setAllowInvalid(false).build();
  sh.getRange(2,c,Math.max(sh.getMaxRows()-1,1),1).setDataValidation(rule);
}
function formatKolom_(ss) {
  Object.keys(APP.SHEETS).forEach(n=>{
    const sh=ss.getSheetByName(n), hs=APP.SHEETS[n]; sh.autoResizeColumns(1,hs.length);
    hs.forEach((h,i)=>{
      const rows=Math.max(sh.getMaxRows()-1,1);
      if(/TANGGAL_ACARA/.test(h))sh.getRange(2,i+1,rows,1).setNumberFormat('dd mmmm yyyy');
      else if(/PADA|DIPERBARUI/.test(h))sh.getRange(2,i+1,rows,1).setNumberFormat('dd/mm/yyyy hh:mm:ss');
      if(/PESAN|CATATAN|URL/.test(h))sh.setColumnWidth(i+1,240); else if(/ID/.test(h))sh.setColumnWidth(i+1,145);
    });
  });
}

function tambahContohAcara() {
  const ss=db_(); if(!ss.getSheetByName('ACARA'))setupDatabaseUndangan();
  const id='UND-'+Utilities.formatDate(new Date(),APP.TZ,'yyyyMMdd-HHmmss');
  ss.getSheetByName('ACARA').appendRow([id,'Resepsi Pernikahan','nama-folder-template','https://domain.com/undangan/',new Date(),'AKTIF',new Date(),'Ubah data contoh ini']);
  perbaruiRingkasan(); ss.toast('Contoh acara dibuat: '+id,'Berhasil',6);
}

function db_(){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet();}
function alias_(o,a){for(let i=0;i<a.length;i++){const v=o[a[i]];if(v!==undefined&&v!==null&&String(v).trim()!=='')return v;}return '';}
function teks_(v,max){return v===undefined||v===null?'':String(v).trim().slice(0,max||500);}
function key_(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
function amanSheet_(v){return /^[=+\-@]/.test(v)?"'"+v:v;}
function id_(p){return p+'-'+Utilities.getUuid().split('-')[0].toUpperCase();}
function iso_(v){if(!v)return '';const d=v instanceof Date?v:new Date(v);return isNaN(d.getTime())?String(v):d.toISOString();}
function normalJumlah_(v){const n=parseInt(String(v||'').replace(/[^0-9]/g,''),10);return isNaN(n)?1:Math.min(Math.max(n,1),20);}
function normalKehadiran_(v){const s=key_(v).replace(/_/g,' ');if(!s)return '';if(/tidak|berhalangan|absen|no|cannot|cant/.test(s))return'TIDAK_HADIR';if(/ragu|mungkin|tentative|maybe/.test(s))return'RAGU_RAGU';if(/hadir|datang|yes|attend|bisa/.test(s))return'HADIR';return teks_(v,50).toUpperCase().replace(/\s+/g,'_');}
function judulKehadiran_(v){return v==='HADIR'?'Hadir':v==='TIDAK_HADIR'?'Tidak Hadir':v==='RAGU_RAGU'?'Ragu-ragu':String(v||'');}
function output_(o,cb){const j=JSON.stringify(o);if(cb&&/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(cb))return ContentService.createTextOutput(cb+'('+j+')').setMimeType(ContentService.MimeType.JAVASCRIPT);return ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON);}
