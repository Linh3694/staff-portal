// const express = require('express');
// const router = express.Router();
// const DigestFetch = require('digest-fetch');

// // Tạo client Digest Authentication
// const client = new DigestFetch('admin', 'Wellspring#2024', { algorithm: 'MD5' });

// // Route kiểm tra
// router.get('/test', (req, res) => {
//   res.status(200).send('Route /api/attendances/test is working');
// });

// // Route đồng bộ từ Hikvision
// router.post('/sync-hikvision', async (req, res) => {
//   try {
//     const url = 'http://10.1.4.95/ISAPI/AccessControl/AcsEvent?format=json&security=1';
//     const requestBody = req.body;

//     const response = await client.fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(requestBody),
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();

//     res.status(200).json({ message: 'Đồng bộ thành công', data });
//   } catch (error) {
//     console.error('Lỗi đồng bộ dữ liệu từ Hikvision:', error.message);
//     res.status(500).json({ message: 'Lỗi khi đồng bộ dữ liệu từ Hikvision', error: error.message });
//   }
// });

// module.exports = router;
