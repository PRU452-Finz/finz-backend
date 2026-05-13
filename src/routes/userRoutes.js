'use strict';

const router = require('express').Router();
const userController = require('../controllers/userController');
const verifyToken     = require('../middlewares/verifyToken');

// All user routes are protected
router.get('/:id',  verifyToken, userController.show);
router.put('/:id',  verifyToken, userController.update);

module.exports = router;
