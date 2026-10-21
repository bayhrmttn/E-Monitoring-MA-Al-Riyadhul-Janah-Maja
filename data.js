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