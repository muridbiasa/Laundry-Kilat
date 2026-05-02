// ================================================
// LAUNDRY KILAT — script.js
// Vanilla JS: State, Form Validation, Tracker,
// Payment Modal, Map (Leaflet), localStorage
// ================================================

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

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LK-${ts}-${rand}`;
}

function formatTanggal(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

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

let toastTimer;
function tampilkanToast(pesan, durasi = 3000) {
  const el = document.getElementById('toast');
  el.textContent = pesan;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), durasi);
}

// Navbar Scroll & Hamburger
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });

  hamburger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
})();

// Scroll Reveal
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

// Pricing Cards
document.querySelectorAll('.pricing-choose').forEach(btn => {
  btn.addEventListener('click', () => {
    const paket = btn.dataset.paket;
    const selectPaket = document.getElementById('paket');
    if (selectPaket) selectPaket.value = paket;
    document.getElementById('pesan').scrollIntoView({ behavior: 'smooth' });
    tampilkanToast(`✅ Paket ${HARGA_PAKET[paket].nama} dipilih!`);
    hitungPreviewHarga();
  });
});

// Kalkulator
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

    document.getElementById('inv-date').textContent = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
    document.getElementById('inv-paket').textContent = paket.nama;
    document.getElementById('inv-berat').textContent = berat + ' kg';
    document.getElementById('inv-hargakg').textContent = formatRupiah(paket.harga);
    document.getElementById('inv-total').textContent = formatRupiah(total);

    calcResult.hidden = false;
    calcResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btnHitung.addEventListener('click', hitungKalkulator);
  calcBerat.addEventListener('keydown', e => { if (e.key === 'Enter') hitungKalkulator(); });

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

// Validasi Form
function validasiForm(data) {
  const errors = {};

  if (!data.nama || data.nama.trim().length < 3)
    errors.nama = 'Nama minimal 3 karakter.';

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

// Form Pemesanan
let pesananAktif = null;

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

  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, msg]) => tampilkanError(field, msg));
    const pertama = Object.keys(errors)[0];
    document.getElementById(pertama)?.focus();
    return;
  }

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

  simpanPesanan(pesanan);
  pesananAktif = pesanan;

  tampilkanModalPembayaran(pesanan, totalLaundry, total);
});

// Modal Pembayaran & Integrasi Midtrans Serverless API
function tampilkanModalPembayaran(pesanan, totalLaundry, total) {
  document.getElementById('modal-order-id').textContent = pesanan.id;
  document.getElementById('mi-nama').textContent = pesanan.nama;
  document.getElementById('mi-paket').textContent = HARGA_PAKET[pesanan.paket].nama;
  document.getElementById('mi-berat').textContent = pesanan.berat + ' kg';
  document.getElementById('mi-laundry').textContent = formatRupiah(totalLaundry);
  document.getElementById('mi-total').textContent = formatRupiah(total);

  const modal = document.getElementById('payment-modal');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-close').focus();
}

document.getElementById('btn-bayar-midtrans').addEventListener('click', async function() {
    if (!pesananAktif) return;
    
    const btn = this;
    btn.innerHTML = '⏳ Memproses...';
    btn.disabled = true;

    try {
        // Ini akan memanggil endpoint Vercel Serverless Function yang kamu buat
        const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: pesananAktif.id,
                gross_amount: pesananAktif.total,
                name: pesananAktif.nama,
                phone: pesananAktif.wa
            })
        });
        
        if (!response.ok) throw new Error('Gagal memanggil API Token');

        const data = await response.json();
        const snapToken = data.token; 

        window.snap.pay(snapToken, {
            onSuccess: function(result) {
                tampilkanToast('✅ Pembayaran Berhasil! Mengalihkan ke WhatsApp...');
                updateStatusPesanan(pesananAktif.id, 'diproses');
                
                const noWAAdmin = "6285869951609";
                const rincian = HARGA_PAKET[pesananAktif.paket].nama;
                const totalRp = formatRupiah(pesananAktif.total);
                
                const pesanWA = encodeURIComponent(`Halo Admin Laundry Kilat! Pembayaran berhasil via Midtrans.\n\nID Pesanan: ${pesananAktif.id}\nNama: ${pesananAktif.nama}\nPaket: ${rincian}\nTotal: ${totalRp}\n\nMohon pesanan segera diproses. Terima kasih!`);
                
                window.location.href = `https://api.whatsapp.com/send?phone=${noWAAdmin}&text=${pesanWA}`;
            },
            onPending: function(result) {
                tampilkanToast('⚠️ Menunggu pembayaran diselesaikan.');
                resetBtn();
            },
            onError: function(result) {
                tampilkanToast('❌ Pembayaran gagal. Silakan coba lagi.');
                resetBtn();
            },
            onClose: function() {
                tampilkanToast('⚠️ Pop-up ditutup sebelum pembayaran selesai.');
                resetBtn();
            }
        });
    } catch (error) {
        console.error("Error memuat Snap Token:", error);
        alert('Terjadi kesalahan saat menghubungi server pembayaran. Pastikan kamu sudah setup Vercel Serverless Function di /api/token.js');
        resetBtn();
    }

    function resetBtn() {
        btn.innerHTML = '💳 Bayar Sekarang (Snap Midtrans)';
        btn.disabled = false;
    }
});

// Tutup modal
document.addEventListener('click', function(e) {
  const modal = document.getElementById('payment-modal');
  const btnClose = document.getElementById('modal-close');
  
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
  
  if (modal && e.target === modal && !modal.hidden) {
    modal.hidden = true;
    document.body.style.overflow = '';
    resetFormSetelahModal();
  }
});

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

// Copy Button
document.addEventListener('click', e => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;

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

// Tracker Pesanan
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

    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      const connEl = stepEl?.nextElementSibling; 
      if (stepEl) stepEl.classList.toggle('active', i - 1 <= idx);
      if (connEl && connEl.classList.contains('progress-connector')) {
        connEl.classList.toggle('active', i - 1 < idx);
      }
    }

    const badge = document.getElementById('tr-status');
    if (badge) {
      badge.textContent = STATUS_LABEL[status] || status;
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

    document.getElementById('tr-id').textContent = pesanan.id;
    document.getElementById('tr-nama').textContent = pesanan.nama;
    document.getElementById('tr-paket').textContent = HARGA_PAKET[pesanan.paket]?.nama || pesanan.paket;

    updateProgressUI(pesanan.status);

    trackerResult.hidden = false;
    trackerEmpty.hidden = true;
    trackerEmpty.setAttribute('aria-hidden', 'true');
    trackerResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btnLacak.addEventListener('click', lacakPesanan);
  trackerInput.addEventListener('keydown', e => { if (e.key === 'Enter') lacakPesanan(); });

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

    setTimeout(() => {
      const statusBaru = STATUS_LIST[currentIdx + 1];
      pesananDilacak.status = statusBaru;

      updateStatusPesanan(pesananDilacak.id, statusBaru);
      updateProgressUI(statusBaru);

      btnSimulasi.disabled = false;
      btnSimulasi.textContent = '⏩ Simulasikan Perubahan Status';

      tampilkanToast(`🔄 Status diperbarui: ${STATUS_LABEL[statusBaru]}`);

      if (statusBaru === 'selesai' && typeof updateKurirPeta === 'function') {
        updateKurirPeta('selesai');
      }
    }, 1200);
  });
})();

// Peta Leaflet
let mapInstance = null;
let kurirMarker = null;

const KOORDINAT_RUMAH  = [-6.2088, 106.8456]; 
const KOORDINAT_LAUNDRY = [-6.1944, 106.8229]; 
const ROUTE_KURIR = [
  [-6.1944, 106.8229],
  [-6.1980, 106.8300],
  [-6.2030, 106.8360],
  [-6.2088, 106.8456],
];

function buatIcon(emoji, ukuran = 32) {
  return L.divIcon({
    html: `<div style="font-size:${ukuran}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${emoji}</div>`,
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran],
    className: '',
  });
}

function initPeta() {
  if (mapInstance) return; 

  mapInstance = L.map('map', {
    center: [-6.2010, 106.8340],
    zoom: 14,
    scrollWheelZoom: false, 
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(mapInstance);

  L.marker(KOORDINAT_RUMAH, { icon: buatIcon('🏠') })
    .addTo(mapInstance)
    .bindPopup('<strong>📍 Lokasi Pickup Kamu</strong><br>Jl. Contoh No. 1, Jakarta Pusat');

  L.marker(KOORDINAT_LAUNDRY, { icon: buatIcon('🫧') })
    .addTo(mapInstance)
    .bindPopup('<strong>🫧 Laundry Kilat</strong><br>Jl. Sudirman No. 45, Jakarta');

  kurirMarker = L.marker(ROUTE_KURIR[0], { icon: buatIcon('🛵') })
    .addTo(mapInstance)
    .bindPopup('<strong>🛵 Posisi Kurir</strong><br>Dalam perjalanan ke lokasi kamu...');

  L.polyline(ROUTE_KURIR, {
    color: '#A8FBD3',
    weight: 4,
    opacity: 0.8,
    dashArray: '8, 6',
  }).addTo(mapInstance);

  let routeIdx = 0;
  setInterval(() => {
    routeIdx = (routeIdx + 1) % ROUTE_KURIR.length;
    if (kurirMarker) {
      kurirMarker.setLatLng(ROUTE_KURIR[routeIdx]);
    }
  }, 30000);
}

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

// Active Nav Link
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

// Smooth Anchor
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;
    
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const offset = 76; 
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

console.info('%c🫧 Laundry Kilat', 'font-size:18px;font-weight:bold;color:#A8FBD3;background:#0F172A;padding:8px 16px;border-radius:8px;');
console.info('✅ API Midtrans dengan Vercel Serverless Function aktif.');