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
};