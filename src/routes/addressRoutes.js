const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/authMiddleware');

//  ROTA PÚBLICA 

router.get('/shared/:token', addressController.getSharedAddress);


//  BARREIRA DE AUTENTICAÇÃO
router.use(authMiddleware);


//  ROTAS PROTEGIDAS 

router.post('/addresses', addressController.createAddress);
router.get('/addresses', addressController.getAddresses);
router.put('/addresses/:id', addressController.updateAddress);
router.delete('/addresses/:id', addressController.deleteAddress);
router.post('/addresses/:id/share', addressController.shareAddress);

module.exports = router;