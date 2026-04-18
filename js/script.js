// ================================================
// LAUNDRY KILAT — script.js
// Vanilla JS: State, Form Validation, Tracker,
// Payment Modal, Map (Leaflet), localStorage
// ================================================

// ===== KONSTANTA HARGA =====
const HARGA_PAKET = {
  reguler: { nama: 'Reguler (2–3 Hari)', harga: 8000 },
  kilat:   { nama: 'Kilat 24 Jam',       harga: 12000 },
  express: { nama: 'Express 6 Jam',      harga: 18000 },
};
const BIAYA_ANTAR = 5000;
const STATUS_LIST = ['diproses', 'jemput', 'antar', 'selesai'];
const STATUS_LABEL = {
  diproses: 'Diproses',
  jemput:   'Kurir Jemput',
  antar:    'Kurir Antar',
  selesai:  'Selesai',
};

// ===== UTILITY: FORMAT RUPIAH =====
function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

// ===== UTILITY: GENERATE ID PESANAN =====
// Format: LK-{timestamp}-{random 4 digit}
function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LK-${ts}-${rand}`;
}

// ===== UTILITY: FORMAT TANGGAL =====
function formatTanggal(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ===== LOCALSTORAGE: SIMPAN & AMBIL PESANAN =====
function simpanPesanan(pesanan) {
  const semua = ambilSemuaPesanan();
  semua.push(pesanan);
  localStorage.setItem('laundrykilat_orders', JSON.stringify(semua));
}

function ambilSemuaPesanan() {
  try {
    return JSON.parse(localStorage.getItem('laundrykilat_orders')) || [];
  } catch { return []; }
}

function cariPesanan(id) {
  return ambilSemuaPesanan().find(p => p.id === id.trim()) || null;
}

function updateStatusPesanan(id, statusBaru) {
  const semua = ambilSemuaPesanan();
  const idx = semua.findIndex(p => p.id === id);
  if (idx !== -1) {
    semua[idx].status = statusBaru;
    localStorage.setItem('laundrykilat_orders', JSON.stringify(semua));
  }
}

// ===== TOAST NOTIFIKASI =====
let toastTimer;
function tampilkanToast(pesan, durasi = 3000) {
  const el = document.getElementById('toast');
  el.textContent = pesan;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), durasi);
}

// ===== NAVBAR: SCROLL & HAMBURGER =====
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');

  // Scroll efek navbar
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Toggle hamburger menu
  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Tutup menu saat klik nav link
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Tutup menu saat klik di luar
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
})();

// ===== SCROLL REVEAL ANIMASI =====
(function initReveal() {
  const els = document.querySelectorAll(
    '.feature-card, .pricing-card, .contact-card, .calculator-card, .order-form, .order-info'
  );
  els.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => observer.observe(el));
})();

// ===== PRICING CARDS: Pilih Paket → Isi Form =====
document.querySelectorAll('.pricing-choose').forEach(btn => {
  btn.addEventListener('click', () => {
    const paket = btn.dataset.paket;
    // Isi select di form pemesanan
    const selectPaket = document.getElementById('paket');
    if (selectPaket) selectPaket.value = paket;
    // Scroll ke form
    document.getElementById('pesan').scrollIntoView({ behavior: 'smooth' });
    tampilkanToast(`✅ Paket ${HARGA_PAKET[paket].nama} dipilih!`);
    // Trigger preview harga
    hitungPreviewHarga();
  });
});

// ===== KALKULATOR HARGA =====
(function initKalkulator() {
  const btnHitung = document.getElementById('btn-hitung');
  const calcBerat = document.getElementById('calc-berat');
  const calcPaket = document.getElementById('calc-paket');
  const calcResult = document.getElementById('calc-result');

  function hitungKalkulator() {
    const berat = parseFloat(calcBerat.value);
    const paketKey = calcPaket.value;
    const paket = HARGA_PAKET[paketKey];

    if (!berat || berat < 2) {
      tampilkanToast('⚠️ Masukkan berat minimal 2 kg');
      calcBerat.focus();
      return;
    }

    const subtotal = berat * paket.harga;
    const total = subtotal + BIAYA_ANTAR;

    // Isi invoice preview
    document.getElementById('inv-date').textContent = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
    document.getElementById('inv-paket').textContent = paket.nama;
    document.getElementById('inv-berat').textContent = berat + ' kg';
    document.getElementById('inv-hargakg').textContent = formatRupiah(paket.harga);
    document.getElementById('inv-total').textContent = formatRupiah(total);

    calcResult.hidden = false;
    calcResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btnHitung.addEventListener('click', hitungKalkulator);

  // Trigger saat tekan Enter di input
  calcBerat.addEventListener('keydown', e => { if (e.key === 'Enter') hitungKalkulator(); });

  // Tombol lanjut pesan dari kalkulator
  document.getElementById('btn-pesan-dari-kalkulator').addEventListener('click', () => {
    const berat = parseFloat(calcBerat.value);
    const paketKey = calcPaket.value;
    if (berat >= 2) {
      document.getElementById('berat').value = berat;
      document.getElementById('paket').value = paketKey;
      hitungPreviewHarga();
    }
    document.getElementById('pesan').scrollIntoView({ behavior: 'smooth' });
  });
})();

// ===== PREVIEW HARGA DI FORM PESAN =====
function hitungPreviewHarga() {
  const berat = parseFloat(document.getElementById('berat').value);
  const paketKey = document.getElementById('paket').value;
  const previewEl = document.getElementById('preview-total');

  if (berat >= 2 && paketKey && HARGA_PAKET[paketKey]) {
    const total = (berat * HARGA_PAKET[paketKey].harga) + BIAYA_ANTAR;
    previewEl.textContent = formatRupiah(total);
  } else {
    previewEl.textContent = '—';
  }
}

document.getElementById('berat').addEventListener('input', hitungPreviewHarga);
document.getElementById('paket').addEventListener('change', hitungPreviewHarga);

// ===== VALIDASI FORM PESANAN =====
function validasiForm(data) {
  const errors = {};

  if (!data.nama || data.nama.trim().length < 3)
    errors.nama = 'Nama minimal 3 karakter.';

  // Validasi format WA: dimulai 08 atau +628, panjang 10-15 digit
  const waClean = data.wa.replace(/[\s\-]/g, '');
  if (!waClean || !/^(\+628|08)\d{8,13}$/.test(waClean))
    errors.wa = 'Format WA tidak valid. Contoh: 08123456789 atau +628123456789';

  if (!data.alamat || data.alamat.trim().length < 10)
    errors.alamat = 'Alamat terlalu pendek. Mohon isi alamat lengkap.';

  if (!data.berat || isNaN(data.berat) || parseFloat(data.berat) < 2)
    errors.berat = 'Berat minimal 2 kg.';

  if (!data.paket || !HARGA_PAKET[data.paket])
    errors.paket = 'Pilih paket layanan terlebih dahulu.';

  return errors;
}

function tampilkanError(fieldId, pesan) {
  const el = document.getElementById(`error-${fieldId}`);
  const input = document.getElementById(fieldId);
  if (el) el.textContent = pesan;
  if (input) {
    input.classList.toggle('error', !!pesan);
    if (pesan) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }
}

function bersihkanSemuaError() {
  ['nama', 'wa', 'alamat', 'berat', 'paket'].forEach(f => tampilkanError(f, ''));
}

// ===== STATE PESANAN AKTIF (untuk modal) =====
let pesananAktif = null;

// ===== SUBMIT FORM PESANAN =====
document.getElementById('order-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const data = {
    nama:    document.getElementById('nama').value,
    wa:      document.getElementById('wa').value,
    alamat:  document.getElementById('alamat').value,
    berat:   document.getElementById('berat').value,
    paket:   document.getElementById('paket').value,
    catatan: document.getElementById('catatan').value,
  };

  bersihkanSemuaError();
  const errors = validasiForm(data);

  // Tampilkan error jika ada
  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, msg]) => tampilkanError(field, msg));
    // Fokus ke error pertama
    const pertama = Object.keys(errors)[0];
    document.getElementById(pertama)?.focus();
    return;
  }

  // Generate ID pesanan & buat objek pesanan
  const id = generateOrderId();
  const berat = parseFloat(data.berat);
  const paket = HARGA_PAKET[data.paket];
  const totalLaundry = berat * paket.harga;
  const total = totalLaundry + BIAYA_ANTAR;

  const pesanan = {
    id,
    nama:      data.nama.trim(),
    wa:        data.wa.trim(),
    alamat:    data.alamat.trim(),
    berat,
    paket:     data.paket,
    catatan:   data.catatan.trim(),
    status:    'diproses',
    timestamp: Date.now(),
    total,
  };

  // Simpan ke localStorage
  simpanPesanan(pesanan);
  pesananAktif = pesanan;

  // Tampilkan modal pembayaran
  tampilkanModalPembayaran(pesanan, totalLaundry, total);
});

// ===== MODAL PEMBAYARAN =====
function tampilkanModalPembayaran(pesanan, totalLaundry, total) {
  // Isi data modal
  document.getElementById('modal-order-id').textContent = pesanan.id;
  document.getElementById('mi-nama').textContent = pesanan.nama;
  document.getElementById('mi-paket').textContent = HARGA_PAKET[pesanan.paket].nama;
  document.getElementById('mi-berat').textContent = pesanan.berat + ' kg';
  document.getElementById('mi-laundry').textContent = formatRupiah(totalLaundry);
  document.getElementById('mi-total').textContent = formatRupiah(total);
  document.getElementById('qr-total').textContent = formatRupiah(total);
  document.getElementById('transfer-total').textContent = formatRupiah(total);

  // Generate QR placeholder
  generasiQR();

  // Link WA dengan pesan konfirmasi
  const pesan = encodeURIComponent(
    `Konfirmasi Pembayaran Laundry Kilat\n\nID Pesanan: ${pesanan.id}\nNama: ${pesanan.nama}\nPaket: ${HARGA_PAKET[pesanan.paket].nama}\nBerat: ${pesanan.berat} kg\nTotal: ${formatRupiah(total)}\n\nBukti transfer/QRIS terlampir.`
  );
  document.getElementById('btn-kirim-bukti').href = `https://wa.me/6281234567890?text=${pesan}`;

  // Tampilkan modal
  const modal = document.getElementById('payment-modal');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  // Fokus ke modal untuk aksesibilitas
  document.getElementById('modal-close').focus();
}

// Tutup modal - EVENT LISTENER LANGSUNG
document.addEventListener('click', function(e) {
  const modal = document.getElementById('payment-modal');
  const btnClose = document.getElementById('modal-close');
  
  // Klik tombol X
  if (e.target === btnClose) {
    e.preventDefault();
    e.stopPropagation();
    if (modal && !modal.hidden) {
      modal.hidden = true;
      document.body.style.overflow = '';
      resetFormSetelahModal();
    }
    return;
  }
  
  // Klik area overlay (luar modal)
  if (modal && e.target === modal && !modal.hidden) {
    modal.hidden = true;
    document.body.style.overflow = '';
    resetFormSetelahModal();
  }
});

// Tekan ESC untuk tutup
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('payment-modal');
    if (modal && !modal.hidden) {
      modal.hidden = true;
      document.body.style.overflow = '';
      resetFormSetelahModal();
    }
  }
});

function resetFormSetelahModal() {
  if (pesananAktif) {
    const form = document.getElementById('order-form');
    const previewTotal = document.getElementById('preview-total');
    const trackerInput = document.getElementById('tracker-input');
    
    if (form) form.reset();
    if (previewTotal) previewTotal.textContent = '—';
    tampilkanToast(`✅ Pesanan ${pesananAktif.id} berhasil disimpan! Selesaikan pembayaran.`);
    
    if (trackerInput) trackerInput.value = pesananAktif.id;
  }
}

// ===== COPY BUTTON =====
document.addEventListener('click', e => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;

  // Salin nomor rekening atau order ID
  const teks = btn.dataset.copy || document.getElementById('modal-order-id')?.textContent;
  if (!teks) return;

  navigator.clipboard.writeText(teks).then(() => {
    const asli = btn.textContent;
    btn.textContent = '✓ Tersalin!';
    setTimeout(() => { btn.textContent = asli; }, 1500);
    tampilkanToast('📋 Berhasil disalin!');
  }).catch(() => {
    tampilkanToast('Gagal menyalin. Coba salin manual.');
  });
});

// ===== PAYMENT TABS =====
document.querySelectorAll('.payment-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Update tab aktif
    document.querySelectorAll('.payment-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    // Tampilkan panel yang sesuai
    const target = tab.dataset.tab;
    document.querySelectorAll('.payment-panel').forEach(panel => {
      panel.hidden = panel.id !== `panel-${target}`;
    });
  });
});

// ===== GENERATE QR PLACEHOLDER (CSS Grid + Random Cells) =====
function generasiQR() {
  const grid = document.getElementById('qr-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const SIZE = 10; // 10x10 grid
  // Seed warna untuk pola QR dummy yang konsisten
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'qr-cell';
    // Pojok QR (3 kotak penjaga)
    const row = Math.floor(i / SIZE);
    const col = i % SIZE;
    const isGuard = (
      (row < 3 && col < 3) ||
      (row < 3 && col >= SIZE - 3) ||
      (row >= SIZE - 3 && col < 3) ||
      (row === 0 || row === 2 || row === SIZE - 1 || row === SIZE - 3) ||
      (col === 0 || col === 2 || col === SIZE - 1 || col === SIZE - 3)
    );
    const isDark = isGuard || Math.random() > 0.45;
    cell.style.background = isDark ? '#0F172A' : 'white';
    grid.appendChild(cell);
  }
}

// ===== TRACKER PESANAN =====
(function initTracker() {
  const btnLacak = document.getElementById('btn-lacak');
  const trackerInput = document.getElementById('tracker-input');
  const trackerResult = document.getElementById('tracker-result');
  const trackerEmpty = document.getElementById('tracker-empty');
  const errorTracker = document.getElementById('error-tracker');
  let pesananDilacak = null;

  function getStepIndex(status) {
    return STATUS_LIST.indexOf(status);
  }

  function updateProgressUI(status) {
    const idx = getStepIndex(status);

    // Update setiap step
    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      const connEl = stepEl?.nextElementSibling; // .progress-connector
      if (stepEl) stepEl.classList.toggle('active', i - 1 <= idx);
      if (connEl && connEl.classList.contains('progress-connector')) {
        connEl.classList.toggle('active', i - 1 < idx);
      }
    }

    // Update status badge
    const badge = document.getElementById('tr-status');
    if (badge) {
      badge.textContent = STATUS_LABEL[status] || status;
      // Warna badge berdasarkan status
      badge.style.background = idx === 3 ? 'var(--success)' : 'var(--primary-white)';
      badge.style.color = idx === 3 ? 'white' : 'var(--success)';
    }
  }

  function lacakPesanan() {
    const id = trackerInput.value.trim();
    errorTracker.textContent = '';

    if (!id) {
      errorTracker.textContent = 'Masukkan ID Pesanan terlebih dahulu.';
      trackerInput.focus();
      return;
    }

    const pesanan = cariPesanan(id);

    if (!pesanan) {
      errorTracker.textContent = 'ID Pesanan tidak ditemukan. Pastikan ID sudah benar.';
      trackerResult.hidden = true;
      trackerEmpty.hidden = false;
      trackerEmpty.removeAttribute('aria-hidden');
      return;
    }

    pesananDilacak = pesanan;

    // Isi data tracker
    document.getElementById('tr-id').textContent = pesanan.id;
    document.getElementById('tr-nama').textContent = pesanan.nama;
    document.getElementById('tr-paket').textContent = HARGA_PAKET[pesanan.paket]?.nama || pesanan.paket;

    updateProgressUI(pesanan.status);

    // Tampilkan result, sembunyikan empty
    trackerResult.hidden = false;
    trackerEmpty.hidden = true;
    trackerEmpty.setAttribute('aria-hidden', 'true');
    trackerResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btnLacak.addEventListener('click', lacakPesanan);
  trackerInput.addEventListener('keydown', e => { if (e.key === 'Enter') lacakPesanan(); });

  // ===== SIMULASI PERUBAHAN STATUS =====
  document.getElementById('btn-simulasi').addEventListener('click', () => {
    if (!pesananDilacak) return;

    const currentIdx = getStepIndex(pesananDilacak.status);
    if (currentIdx >= STATUS_LIST.length - 1) {
      tampilkanToast('✅ Pesanan sudah selesai! Terima kasih telah menggunakan Laundry Kilat.');
      return;
    }

    const btnSimulasi = document.getElementById('btn-simulasi');
    btnSimulasi.disabled = true;
    btnSimulasi.textContent = '⏳ Memperbarui status...';

    // Simulasi delay jaringan
    setTimeout(() => {
      const statusBaru = STATUS_LIST[currentIdx + 1];
      pesananDilacak.status = statusBaru;

      // Update localStorage
      updateStatusPesanan(pesananDilacak.id, statusBaru);

      // Update UI
      updateProgressUI(statusBaru);

      btnSimulasi.disabled = false;
      btnSimulasi.textContent = '⏩ Simulasikan Perubahan Status';

      tampilkanToast(`🔄 Status diperbarui: ${STATUS_LABEL[statusBaru]}`);

      // Jika sudah selesai, perbarui posisi kurir di peta
      if (statusBaru === 'selesai' && typeof updateKurirPeta === 'function') {
        updateKurirPeta('selesai');
      }
    }, 1200);
  });
})();

// ===== PETA LEAFLET =====
let mapInstance = null;
let kurirMarker = null;

// Koordinat dummy: Jakarta Pusat
const KOORDINAT_RUMAH  = [-6.2088, 106.8456]; // Rumah pelanggan (Monas area)
const KOORDINAT_LAUNDRY = [-6.1944, 106.8229]; // Lokasi laundry (Grogol area)
const ROUTE_KURIR = [
  [-6.1944, 106.8229],
  [-6.1980, 106.8300],
  [-6.2030, 106.8360],
  [-6.2088, 106.8456],
];

// Ikon custom marker (emoji via divIcon)
function buatIcon(emoji, ukuran = 32) {
  return L.divIcon({
    html: `<div style="font-size:${ukuran}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${emoji}</div>`,
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran],
    className: '',
  });
}

function initPeta() {
  if (mapInstance) return; // Jangan init ulang

  mapInstance = L.map('map', {
    center: [-6.2010, 106.8340],
    zoom: 14,
    scrollWheelZoom: false, // Non-aktifkan scroll zoom untuk UX yang lebih baik
  });

  // Tile layer OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(mapInstance);

  // Marker rumah pelanggan
  L.marker(KOORDINAT_RUMAH, { icon: buatIcon('🏠') })
    .addTo(mapInstance)
    .bindPopup('<strong>📍 Lokasi Pickup Kamu</strong><br>Jl. Contoh No. 1, Jakarta Pusat');

  // Marker lokasi laundry
  L.marker(KOORDINAT_LAUNDRY, { icon: buatIcon('🫧') })
    .addTo(mapInstance)
    .bindPopup('<strong>🫧 Laundry Kilat</strong><br>Jl. Sudirman No. 45, Jakarta');

  // Marker kurir (posisi awal = laundry)
  kurirMarker = L.marker(ROUTE_KURIR[0], { icon: buatIcon('🛵') })
    .addTo(mapInstance)
    .bindPopup('<strong>🛵 Posisi Kurir</strong><br>Dalam perjalanan ke lokasi kamu...');

  // Garis rute (polyline)
  L.polyline(ROUTE_KURIR, {
    color: '#A8FBD3',
    weight: 4,
    opacity: 0.8,
    dashArray: '8, 6',
  }).addTo(mapInstance);

  // Simulasi pergerakan kurir setiap 30 detik
  let routeIdx = 0;
  setInterval(() => {
    routeIdx = (routeIdx + 1) % ROUTE_KURIR.length;
    if (kurirMarker) {
      kurirMarker.setLatLng(ROUTE_KURIR[routeIdx]);
    }
  }, 30000);
}

// Update posisi kurir saat status berubah
window.updateKurirPeta = function(status) {
  if (!kurirMarker) return;
  if (status === 'jemput') {
    kurirMarker.setLatLng(ROUTE_KURIR[1]);
    kurirMarker.bindPopup('<strong>🛵 Kurir sedang menuju lokasi kamu!</strong>').openPopup();
  } else if (status === 'antar') {
    kurirMarker.setLatLng(ROUTE_KURIR[2]);
    kurirMarker.bindPopup('<strong>🚚 Kurir sedang mengantarkan laundry kamu!</strong>').openPopup();
  } else if (status === 'selesai') {
    kurirMarker.setLatLng(ROUTE_KURIR[3]);
    kurirMarker.bindPopup('<strong>✅ Laundry telah diantar!</strong>').openPopup();
  }
};

// Inisialisasi peta saat section tracker masuk viewport
const mapObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      initPeta();
      mapObserver.disconnect();
    }
  });
}, { threshold: 0.1 });

const mapEl = document.getElementById('map');
if (mapEl) mapObserver.observe(mapEl);

// ===== ACTIVE NAV LINK sesuai scroll =====
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 90;
      if (window.scrollY >= top) current = sec.getAttribute('id');
    });

    navLinks.forEach(link => {
      link.style.background = '';
      link.style.color = '';
      if (link.getAttribute('href') === `#${current}`) {
        link.style.background = 'var(--primary-white)';
        link.style.color = 'var(--text)';
      }
    });
  }, { passive: true });
})();

// ===== SMOOTH ANCHOR SCROLL dengan offset navbar =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    // Jangan proses jika href kosong atau hanya "#"
    if (!href || href === '#') return;
    
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 76; // tinggi navbar
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== INISIALISASI: Hapus demo data =====
// Cukup tampilkan empty state saja, user akan membuat pesanan sendiri

// ===== LOG INFO =====
console.info('%c🫧 Laundry Kilat', 'font-size:18px;font-weight:bold;color:#A8FBD3;background:#0F172A;padding:8px 16px;border-radius:8px;');
console.info('✅ Semua pesanan tersimpan di localStorage: laundrykilat_orders');
console.info('🎯 Mulai dengan membuat pesanan baru melalui form pemesanan.');