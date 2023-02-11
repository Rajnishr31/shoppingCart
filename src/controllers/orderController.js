const cartModel = require('../models/cartmodel')
const { isValid } = require('../validators/validation')
const ObjectId = require('mongoose').Types.ObjectId
const userModel= require('../models/usermodel')
const productModel=require('../models/productmodel')
const orderController= require('../models/orderModel')
const mongoose =require('mongoose')
const { default: isBoolean } = require('validator/lib/isboolean')
const orderModel = require('../models/orderModel')


const createOrder= async function(req,res){
    try{
        let userId = req.params.userId;
        let bodyData= req.body
        let createOrder ={}
        if(!ObjectId.isValid(userId)) return res.status(400).send({status:false,message:"userId invalid"})

        if(bodyData.cartId){
            if(!ObjectId.isValid(bodyData.cartId)) return res.status(400).send({status:false,message:"userId invalid"})
            const cartByCartId= await cartModel.findById(bodyData.cartId)
            if(!cartByCartId) return res.status(404).send({status:false,message:"cart id Wrong in body"})

            //second layer authorization

            if(cartByCartId.userId!=userId) return res.status(403).send({status:false,message:"you can not authorised to create order with anthor user cart"})

        }
    
        const user = await userModel.findById(userId)
        if(!user) return res.status(404).send({status:true, message:"user not  found"});
        createOrder.userId=userId
    
        const cartDetails =await cartModel.findOne({userId:userId})
        if(!cartDetails) return res.status(404).send({status:false,message:"cart not found"})
        if(cartDetails.items.length==0) return res.status(400).send({status:false,message:"to create your order, you need to add atleast 1 product in your cart"})
    
        createOrder.items=cartDetails.items
        createOrder.totalPrice=cartDetails.totalPrice
        createOrder.totalItems=cartDetails.totalItems
    
        const items= cartDetails.items
        let totalQuantity=0
        for(let i=0;i<items.length;i++){
            totalQuantity=totalQuantity+items[i].quantity
        }
        createOrder.totalQuantity=totalQuantity
    
        if(bodyData.cancellable){
            bodyData.cancellable=bodyData.cancellable.trim()
            if(!isBoolean(bodyData.cancellable)) return res.status(400).send({status:false,message:"cancellable should only be a boolean value"})
            createOrder.cancellable=bodyData.cancellable
        }
    
        const orderCreated= await (await orderModel.create(createOrder)).populate('items.productId')
        await cartModel.findOneAndUpdate({userId: userId},{$set:{items:[],totalPrice: 0, totalItems: 0}},{new: true})
        res.status(201).send({status:true,message:"Success",data:orderCreated})
    
    }
    catch(error){
        return res.status(500).send({ status: false, message: error.message });
    }


}


const updateOrderStatus =async function(req,res){
    try{
        let userId = req.params.userId;
        let orderId= req.body.orderId
      
        
        if(!ObjectId.isValid(userId)) return res.status(400).send({status:false,message:"userId invalid"})
        if(!ObjectId.isValid(orderId)) return res.status(400).send({status:false,message:"orderId invalid"})
    
        const user = await userModel.findById(userId)
        if(!user) return res.status(404).send({status:true, message:"user not  found"});
    
        const order = await orderModel.findById(orderId)
        if(!order) return res.status(404).send({status:true, message:"order not  found"});
        if(order.status=='cancled') return res.status(400).send({status:false,message:"order is already cancled"})
    
        //second layer authorization
        if(order.userId!=userId) return res.status(403).send({status:false,message:"you are not authorized to update order status"})
    
        if(order.cancellable==true) {
            
            const updatedOrder =await orderModel.findByIdAndUpdate(orderId,{$set:{status:'cancled'}},{new:true})
            return res.status(200).send({status:true,message:"Success",data:updatedOrder})
        }
    
        res.status(400).send({status:false,message:"You can not cancled the order"})
    }
    catch(error){
        return res.status(500).send({ status: false, message: error.message });
    }

}



module.exports.createOrder=createOrder
module.exports.updateOrderStatus=updateOrderStatus