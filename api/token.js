module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { order_id, gross_amount, name, phone } = req.body;

    // CARA AMAN: Mengambil key dari Environment Variable Vercel
    const serverKey = process.env.MIDTRANS_SERVER_KEY; 
    
    // Keamanan ekstra: Cek apakah key terbaca
    if (!serverKey) {
        return res.status(500).json({ error: 'Server Key tidak dikonfigurasi dengan benar.' });
    }
    
    const encodedKey = Buffer.from(serverKey + ':').toString('base64');

    try {
        // PERHATIAN: Pastikan URL ini sesuai dengan environment kamu. 
        // Jika pakai Production Key, ganti url ke: https://app.midtrans.com/snap/v1/transactions
        const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + encodedKey
            },
            body: JSON.stringify({
                transaction_details: {
                    order_id: order_id,
                    gross_amount: gross_amount
                },
                customer_details: {
                    first_name: name,
                    phone: phone
                }
            })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error dari Midtrans:', error);
        res.status(500).json({ error: 'Gagal membuat token pembayaran' });
    }

// ===== PENANGANAN REDIRECT DARI APLIKASI MOBILE (DEEP LINK) =====
window.addEventListener('DOMContentLoaded', () => {
  // Baca parameter di URL bar
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  const statusCode = urlParams.get('status_code');
  const transactionStatus = urlParams.get('transaction_status');

  // Jika URL mengandung parameter sukses dari Midtrans
  if (orderId && (statusCode === '200' || statusCode === '201') && (transactionStatus === 'settlement' || transactionStatus === 'capture')) {
      
      // Cari data pesanan di localStorage
      const pesanan = cariPesanan(orderId);
      
      if (pesanan) {
          // Update status jadi diproses
          updateStatusPesanan(orderId, 'diproses');
          
          const noWAAdmin = "6285869951609";
          const rincian = HARGA_PAKET[pesanan.paket]?.nama || pesanan.paket;
          const totalRp = formatRupiah(pesanan.total);
          
          const pesanWA = encodeURIComponent(`Halo Admin Laundry Kilat! Pembayaran berhasil via Midtrans.\n\nID Pesanan: ${pesanan.id}\nNama: ${pesanan.nama}\nPaket: ${rincian}\nTotal: ${totalRp}\n\nMohon pesanan segera diproses. Terima kasih!`);
          
          tampilkanToast('Pembayaran Terverifikasi! Mengalihkan ke WhatsApp...');
          
          // Beri jeda 2 detik agar user sempat melihat pesan sukses sebelum dialihkan
          setTimeout(() => {
              window.location.href = `https://api.whatsapp.com/send?phone=${noWAAdmin}&text=${pesanWA}`;
          }, 2000);
          
          // Bersihkan URL agar tidak terus-terusan redirect kalau di-refresh
          window.history.replaceState({}, document.title, window.location.pathname);
      }
  }
});

};