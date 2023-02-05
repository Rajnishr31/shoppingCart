const express = require('express');
const router = express.Router();

const middleware =require('../middlewares/auth')
const userController=require('../controllers/userController');
const productController= require('../controllers/productController')
const cartController=require('../controllers/cartController');
const orderController=require('../controllers/orderController')
const { RoboMaker } = require('aws-sdk');







router.post('/register',userController.createUser)
router.post('/login',userController.login)
router.get('/user/:userId/profile',middleware.authentication,middleware.userAuthorization,userController.getUser)
router.put('/user/:userId/profile',middleware.authentication,middleware.userAuthorization,userController.updateUser)
