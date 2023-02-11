const mongoose = require("mongoose")



const productSchema = new mongoose.Schema({
    title: {
           type: String,
            required:true, 
            unique:true,
            trim:true,
            uppercase:true
    },
    description: {
            type:String, 
            required:true},
    price: {
            type:Number, 
            required:true},
    currencyId: {
            type:String, 
            required:true},  //INR
    currencyFormat: {
            type:String, 
            required:true}, //Rupee symbol
    isFreeShipping: {
            type:Boolean, 
            default: false},
    productImage: {
            type:String,
            required:true
        },  
    style: String,
    availableSizes: {
            type:[String],
            enum:["S", "XS","M","X", "L","XXL", "XL"],
            required:true},
    installments: Number,
    deletedAt: Date, 
           isDeleted: {
    type:Boolean, 
            default: false},
        
    },{timestamps:true})

    module.exports = mongoose.model("product", productSchema)