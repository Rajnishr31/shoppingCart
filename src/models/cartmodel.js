const mongoose = require("mongoose")
const objectId= mongoose.Schema.Types.ObjectId

const cartSchema =new mongoose.Schema({
    userId:{
        type:objectId,
        ref:'user',
        required:true,
        unique:true
    },
    items:[
        {
            productId:{
                type:objectId,
                ref:'product',
                required:true
            },
            quantity:{
                type:Number,
                required:true,
                
            }
        }
    ],
    totalPrice:{
        type:Number,
        required:true,
        Comment:"Holds total price of all the items in the cart"
    },
    totalItems:{
        type:Number,
        required:true,
        Comment:"Holds total number of items in the cart"
    }
},{timestamps:true})


module.exports=mongoose.model('cart',cartSchema)