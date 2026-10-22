const APP_CONFIG = {
  namaSekolah: "MA Al-Riyadhul Jannah Maja",
  tahunAjaran: "2026/2027",
  jamMasukBatas: "06:45",
  jamPulangMulai: "14:30",
  dhuhaMulai: "07:00",
  dhuhaSelesai: "08:30",
  dzuhurMulai: "12:00",
  dzuhurSelesai: "13:00"
};

// Ganti dengan URL Web App Google Apps Script Anda (lihat panduan Code.gs)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmgzCaK6H6vBpUuMqOnk5lVqt8g3tE1OKWTdNxUIlSiZVo9gmcpu0VT9WdzJD7MfiOJQ/exec";

const ADMIN_PIN = "rijan123";

const DEFAULT_SISWA = [
  { nis: "2425001", nama: "Ahmad Fauzan", kelas: "XI IPA", jk: "L" },
  { nis: "2425002", nama: "Siti Nur Aisyah", kelas: "XI IPA", jk: "P" },
  { nis: "2425003", nama: "Muhammad Rizki", kelas: "XI IPS", jk: "L" },
  { nis: "2425004", nama: "Dewi Lestari", kelas: "XI Agama", jk: "P" },
  { nis: "2425005", nama: "Fajar Nugraha", kelas: "XI IPS", jk: "L" }
];

const JUZ30_LIST = [
  "An-Naba","An-Nazi'at","Abasa","At-Takwir","Al-Infitar","Al-Muthaffifin",
  "Al-Insyiqaq","Al-Buruj","Ath-Thariq","Al-A'la","Al-Ghasyiyah","Al-Fajr",
  "Al-Balad","Asy-Syams","Al-Lail","Adh-Dhuha","Al-Insyirah","At-Tin",
  "Al-'Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-'Adiyat","Al-Qari'ah",
  "At-Takatsur","Al-'Ashr","Al-Humazah","Al-Fil","Quraisy","Al-Ma'un",
  "Al-Kautsar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"
];

const SURAT_PILIHAN_LIST = [
  "Yasin","Al-Waqiah","Ar-Rahman","Al-Mulk","As-Sajdah","Al-Kahfi",
  "Al-Baqarah (ayat pilihan)","Ali Imran (ayat pilihan)","Ad-Dukhan","Al-Insan"
];

// ================== TAMBAHAN: GURU PIKET ==================
const GURU_PIKET_LIST = [
  { username: "piket1", password: "piket123", nama: "Nani Roswinah, S.Pd" },
  { username: "piket2", password: "piket123", nama: "Yuyu Yuhartika, S.Pd" },
  { username: "piket3", password: "piket123", nama: "Zahrotul Uyun, S.Pd" }
  { username: "piket4", password: "piket123", nama: "Dzulkarnaen, S.Hi" }
  { username: "piket5", password: "piket123", nama: "Sumirah, S.Pd.I" }
  { username: "piket6", password: "piket123", nama: "Andri Kurniawan, S.Pd, M.Pd" }
  { username: "piket7", password: "piket123", nama: "Umayah, S.Pd" }
  { username: "piket8", password: "piket123", nama: "Nani Fitriani, S.Pd.I" }
  { username: "piket9", password: "piket123", nama: "Rusmiati, S.Pd" }
  { username: "piket10", password: "piket123", nama: "Firman Alamsyah, S.Pd" }
  { username: "piket11", password: "piket123", nama: "Hasanudin, S.Pd" }
  { username: "piket12", password: "piket123", nama: "Ikbal Nugraha, S.Sos" }
  { username: "piket13", password: "piket123", nama: "Muhamad Yosep, S.Pd" }
  { username: "piket14", password: "piket123", nama: "Siti Allubabah" }
  { username: "piket15", password: "piket123", nama: "Miftahul Lukman, S.Pd" }
  { username: "piket16", password: "piket123", nama: "Tutin Sulistino, S.Pd" }
  { username: "piket17", password: "piket123", nama: "Depan Maulana Pamungkas, S.Pd" }
];