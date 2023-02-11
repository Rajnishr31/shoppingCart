const mongoose = require('mongoose')
const objectId= mongoose.Schema.Types.ObjectId

const orderSchema =new mongoose.Schema({
    userId:{
        type:objectId,
        ref:'user',
        required:true
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
                required:true
            }
        }
    ],
    totalPrice:{
        type:Number,
        required:true,
        comment: "Holds total price of all the items in the cart"

    },
    totalItems:{
        type:Number,
        required:true,
        comment: "Holds total number of items in the cart"

    },
    totalQuantity:{
        type:Number,
        required:true,
        comment: "Holds total number of quantity in the cart"

    },
    cancellable:{
        type:Boolean,
        default:true
    },
    status:{
        type:String,
        enum:['pending','completed','cancled'],
        default:'pending'
    },
    isDeleted:{
        type:Boolean,
        default:false
    }
},{timestamps:true})


module.exports=mongoose.model('order',orderSchema)