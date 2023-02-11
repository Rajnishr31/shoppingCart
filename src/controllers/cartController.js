const cartModel = require('../models/cartmodel')
const { isValid } = require('../validators/validation')
const ObjectId = require('mongoose').Types.ObjectId
const userModel= require('../models/usermodel')
const productModel=require('../models/productmodel')
const mongoose =require('mongoose')




const createCart =async function(req,res){
    try{
        const data=req.body
        const userId = req.params.userId
        if (!ObjectId.isValid(userId)) return res.status(400).send({ status: false, message: "userId is not valid" })
        if(data.cartId) {
            if(!ObjectId.isValid(data.cartId)) return res.status(400).send({status:false,message:"cart Id is not valid"})
            const cartByCartId= await cartModel.findById(data.cartId)
            if(!cartByCartId) return res.status(404).send({status:false,message:"cart id Wrong in body"})

            //second layer authorization

            if(cartByCartId.userId!=userId) return res.status(403).send({status:false,message:"you can not authorised to add product to anthor user cart"})


        }
        const user = await userModel.findOne({ _id: userId })
        if (!user) return res.status(404).send({ status: false, message: "user not exist" })
    
        

    
    
        if (!isValid(data.productId)) return res.status(400).send({ status: false, message: "productId is mandatory" })
        if (!ObjectId.isValid(data.productId)) return res.status(400).send({ status: false, message: "productId from body is not valid" })
    
    
    
        const cart = await cartModel.findOne({ userId: userId })
        
    
        const productData = await productModel.findOne({ _id: data.productId, isDeleted: false })
    
        if (!productData) return res.status(404).send({ status: false, message: "product not found" })
        if (cart) {
                

            //second layer authorization
            
            if(cart._id!=data.cartId) return res.status(403).send({status:false,message:"you can not authorised to add product to anthor user cart"})

            let items = cart.items
            const product = items.filter(x => x.productId == data.productId)
            if (product.length == 0) {
                items.push({ productId: data.productId, quantity: 1 })
                const updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: items }, $inc: { totalPrice: productData.price, totalItems: 1 } }, { new: true }).populate('items.productId')
                return res.status(200).send({ status: true, message: "Success", data: updatedCart })
            }
            else {
                product[0].quantity = product[0].quantity + 1
                const updatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { $set: { items: items }, $inc: { totalPrice: productData.price} }, { new: true }).populate('items.productId')
                return res.status(200).send({ status: true, message: "Success", data: updatedCart })
            }
        }
        else {
            const dataForCreate = {}
            dataForCreate.userId = userId
            dataForCreate.items = []
            dataForCreate.items.push({ productId: data.productId, quantity: 1 })
            dataForCreate.totalPrice = productData.price
            dataForCreate.totalItems = 1
            const cart = await (await cartModel.create(dataForCreate)).populate('items.productId')
            return res.status(201).send({ status: true, message: "Success", data: cart })
        }
    
    }
    catch(error){
        res.status(500).send({status:false,message:error.message})
    }


}


const removeProductFromCart = async function (req, res) {
    try{
        let userId = req.params.userId
        let cartId = req.body.cartId
        let productId = req.body.productId
        const removeProduct = String(req.body.removeProduct)
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, message: "invalid user Id" })
        if(!cartId) return res.status(400).send({status:false,message:"not getting cartId"})
        if (!mongoose.Types.ObjectId.isValid(cartId)) return res.status(400).send({ status: false, message: "invalid cart Id" })
    
        if(!isValid(productId)) return res.status(400).send({status:false,message:"productId required"})
        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, message: "invalid product Id" })
        
        if(!removeProduct) return res.status(400).send({status:false,message:"removeProduct is required"})
        if(!['1','0'].includes(removeProduct)) return res.status(400).send({status:false, message:"removeProduct should only be 0 or 1"})
    
        
    
        let user = await userModel.findById(userId)
        if (!user) return res.status(404).send({ status: false, message: "User not found" })
    
        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, message: "Product not found" })
    
        let checkCart = await cartModel.findOne({ userId: userId ,_id:cartId})
        if (!checkCart) return res.status(404).send({ status: false, message: "Cart not found" })
    
        let items = checkCart.items
        let filteritem = items.filter(x => x.productId == productId)
        if (filteritem.length == 0) return res.status(400).send({ status: false, message: "Product is not exist in cart items" })
    
    
        if (removeProduct == '0' || filteritem[0].quantity==1) {
            
            const productToBeRemove =items.filter(x=>x.productId == productId)
            const restOfProducts = items.filter(x => x.productId != productId)
    
            let newCart = await cartModel.findOneAndUpdate({ userId: userId }, {$set:{ items: restOfProducts},$inc:{ totalPrice: -(productToBeRemove[0].quantity*findProduct.price),totalItems:-1}}, { new: true }).populate('items.productId')
            return res.status(200).send({ status: true, message: "Success", data: newCart })
    
        }
        if (removeProduct == '1' && filteritem[0].quantity>1) {
            for(let i=0;i<items.length;i++){
                if(items[i].productId==productId){
                    items[i].quantity=items[i].quantity-1
                }
            }
    
    
            let newCart = await cartModel.findOneAndUpdate({ userId: userId }, {$set:{ items: items},$inc:{ totalPrice: -findProduct.price}}, { new: true }).populate('items.productId')
            return res.status(200).send({ status: true, message: "Success", data: newCart })
        }
    }
    catch(error){
        res.status(500).send({status:false,message:error.message})
    }
}


const cartDetails = async function (req, res) {
    try{
        let userId = req.params.userId;

        if(!ObjectId.isValid(userId)) return res.status(400).send({status:false,message:"userId invalid"})
    
        const user = await userModel.findById(userId)
        if(!user) return res.status(404).send({status:true, message:"user not  found"});
    
        const cartDetatil= await cartModel.findOne({userId:userId}).populate('items.productId')
        res.status(200).send({status:true, message:"Success",data:cartDetatil})
    }
    catch(error){
        return res.status(500).send({ status: false, message: error.message });
    }


}


const deleteCart= async function(req,res){
    try {
        let userId = req.params.userId;

        if(!ObjectId.isValid(userId)) return res.status(400).send({status:false,message:"userId invalid"})

        const user = await userModel.findById(userId)
        if(!user) return res.status(404).send({status:true, message:"user not  found"});



        const cart = await cartModel.findOne({userId: userId})
        if(!cart) return res.status(404).send({status:true, message:"cart not found "});

        if(cart.items.length==0 && cart.totalPrice==0 && cart.totalItems==0) return res.status(400).send({status:false,message:"cart already empty"})

        
        const updatedCart = await cartModel.findOneAndUpdate({userId: userId},{$set:{items:[],totalPrice: 0, totalItems: 0}},{new: true})
        

        res.status(204).send({status:true, message:"Cart clear", data: updatedCart});
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};





module.exports.createCart = createCart
module.exports.removeProductFromCart = removeProductFromCart
module.exports.cartDetails = cartDetails
module.exports.deleteCart = deleteCart