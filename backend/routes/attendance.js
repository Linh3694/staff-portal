const express = require('express');
const router = express.Router();

router.post('/api/attendances/save', (req, res) => {
    const data = req.body.data;
    console.log('Received data:', data);
    res.status(200).json({ message: 'Attendance data saved successfully!' });
});

module.exports = router;