const express = require('express');
const router = express.Router();

const {authentication,userAuthorization} =require('../middlewares/auth')
const {createUser,login,getUser,updateUser}=require('../controllers/userController');
const {createProduct,getProducts,getProductById,updateProduct,deleteProduct}= require('../controllers/productController')
const {createCart,removeProductFromCart,cartDetails,deleteCart}=require('../controllers/cartController');
const {createOrder,updateOrderStatus}=require('../controllers/orderController')








router.post('/register',createUser)
router.post('/login',login)
router.get('/user/:userId/profile',authentication,userAuthorization,getUser)
router.put('/user/:userId/profile',authentication,userAuthorization,updateUser)


router.post('/products',createProduct)
router.get('/products',getProducts)
router.get('/products/:productId',getProductById)
router.put('/products/:productId',updateProduct)
router.delete('/products/:productId',deleteProduct)



router.post('/users/:userId/cart', authentication,userAuthorization,createCart)
router.put('/users/:userId/cart',authentication,userAuthorization,removeProductFromCart)
router.get('/users/:userId/cart',authentication, userAuthorization, cartDetails)
router.delete('/users/:userId/cart',authentication, userAuthorization,deleteCart)



router.post('/users/:userId/orders',authentication, userAuthorization,createOrder)
router.put('/users/:userId/orders',authentication, userAuthorization,updateOrderStatus)



router.all('/*',(req,res)=>res.status(404).send("page not found"));
module.exports = router;