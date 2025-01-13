const express = require('express');
const inspectController = require('../controllers/inspectController');
const router = express.Router();


router.get('/', inspectController.getAllInspections); // Lấy danh sách kiểm tra
router.get('/:id', inspectController.getInspectionById); // Lấy chi tiết kiểm tra
router.put('/:id', inspectController.updateInspection);
router.post('/', inspectController.createInspection); // Tạo bản ghi kiểm tra
router.delete('/:id', inspectController.deleteInspection); // Xóa bản ghi kiểm tra
router.get('/laptop/:laptopId', inspectController.getLatestInspectionByLaptopId);


module.exports = router;