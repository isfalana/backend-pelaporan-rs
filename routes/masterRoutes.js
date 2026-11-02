const express = require('express');
const router = express.Router();
const {
  getUnits,
  getKategoris,
  getRoles,
  getUsers,
  getTindakLanjuts
} = require('../controllers/masterController');

router.get('/units', getUnits);
router.get('/kategoris', getKategoris);
router.get('/roles', getRoles);
router.get('/users', getUsers);
router.get('/tindak-lanjuts', getTindakLanjuts);

module.exports = router;
