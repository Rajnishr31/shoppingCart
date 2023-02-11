const productModel = require('../models/productmodel')
const { isValid } = require('../validators/validation')
const { uploadFile } = require('../aws/s3Service')
const { default: isBoolean } = require('validator/lib/isboolean')
const mongoose =require('mongoose')

const createProduct = async function (req, res) {
    try{
        const file = req.files
        const data = req.body
        
        if (Object.keys(data).length == 0) return res.status(400).send({ status: false, message: "body is mandatory" })
    
        if (!isValid(data.title)) return res.status(400).send({ status: false, message: "title is mandatory" })
        //uniqueNess
        data.title = data.title.trim().toUpperCase()
        const dataWithTitle = await productModel.findOne({ title: data.title, isDeleted: false })
        if (dataWithTitle) return res.status(400).send({ status: false, message: "title already exist" })
        
    
    
        const titleWithDeleteedTrue=await productModel.findOneAndUpdate({ title: data.title, isDeleted: true },{isDeleted:false})
        if(titleWithDeleteedTrue)     return res.status(400).send({status:false,message:"title already exist you can not create again same product but you can update that product details "})
    
    
        if (!isValid(data.description)) return res.status(400).send({ status: false, message: "description is mandatory" })
    
        if (!isValid(data.price)) return res.status(400).send({ status: false, message: "price is mandatory" })
        data.price = data.price.trim()
        if (parseFloat(data.price) != data.price) return res.status(400).send({ status: false, message: "price should only be a Number" })
        data.price = Number(data.price).toFixed(2)
    
        if (!isValid(data.currencyId)) return res.status(400).send({ status: false, message: "currencyId is mandatory" })
        data.currencyId = data.currencyId.trim().toUpperCase()
        if (!['INR'].includes(data.currencyId)) return res.status(400).send({ status: false, message: "currencyId should be valid" })
    
        if (!isValid(data.currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat is mandatory" })
        data.currencyFormat = data.currencyFormat.trim().toUpperCase()
        if (!['₹'].includes(data.currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat should be valid" })
    
        if (data.isFreeShipping) {
            data.isFreeShipping = data.isFreeShipping.trim()
            if (!isBoolean(data.isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping should only be boolean true or false" })
        }
        if (data.isFreeShipping == "") data.isFreeShipping = false
    
        
        if (file.length == 0) return res.status(400).send({ status: false, message: "productImage is mandatory" })
        const imageUrl = await uploadFile(file[0])
        data.productImage = imageUrl
    
        if (data.style) {
            data.style = data.style.trim()
            if (data.style) data.style = data.style.toUpperCase()
        }
    
    
        if(!isValid(data.availableSizes)) return res.status(400).send({status:false,message:"atleast one size is required"})
        data.availableSizes = data.availableSizes.split(",")
        data.availableSizes = data.availableSizes.filter(x => x.trim() != "")
        data.availableSizes=data.availableSizes.map(x=>x.trim().toUpperCase())
        if (data.availableSizes.length == 0) return res.status(400).send({ status: false, message: "at least one size is required ['S', 'XS','M','X', 'L','XXL', 'XL']" })
        let newArr = data.availableSizes.filter(x => !["S", "XS", "M", "X", "L", "XXL", "XL"].includes(x))
        if (newArr.length != 0) return res.status(400).send({ status: false, message: `sizes ${newArr} should be presented in ["S","XS","M","X","L","XXL","XL"] ` })
    
    
        if (data.installments) {
            if (data.installments.trim()) {
                if (parseInt(data.installments) != data.installments) return res.status(400).send({ status: false, message: "installments should only be a Number" })
            }
        }
    
        const productData = await productModel.create(data)
        res.status(201).send({ status: true, message: "Success", data: productData })
    
    }
    catch(error){
        res.status(500).send({status:false,message:error.message})
    }




}


const getProducts = async function (req, res) {
    try {

        let query = req.query



        let filterSize = {}
        if (query.size != undefined) {
            if(Array.isArray(query.size)) query.size= query.size.map(x=>x.trim().toUpperCase())
            else query.size=query.size.trim().toUpperCase()
            filterSize.availableSizes = { $in: query.size }
        }
        if (query.size == undefined)  filterSize.isDeleted = false

        let priceGTFilter = {}
        if (query.priceGreaterThan != undefined) {
            if(!query.priceGreaterThan.match(/^[0-9_ ]+$/)) return res.status(400).send({status:false,message:"priceGreaterThan not valid"})
            priceGTFilter.price = { $gt: query.priceGreaterThan }
        }
        if (query.priceGreaterThan == undefined) priceGTFilter.isDeleted = false

        let priceLTFilter = {}
        if (query.priceLessThan != undefined){
            if(!query.priceLessThan.match(/^[0-9_ ]+$/)) return res.status(400).send({status:false,message:"priceLessThan not valid"})
            priceLTFilter.price = { $lt: query.priceLessThan }
        }     
        if (query.priceLessThan == undefined) priceLTFilter.isDeleted = false

        if (query.name == undefined) query.name = ""

        if(query.priceSort){
            if(!['1','-1'].includes(query.priceSort)) return res.status(400).send({status:false,message:"priceSort query should be 1 or -1"})
        }



        const data = await productModel.find({
            $and: [filterSize, { title: { $regex: `.*${query.name.toUpperCase()}.*` } },
                priceGTFilter, priceLTFilter, { isDeleted: false },
            ]
        }).sort({ price: Number(query.priceSort) })


        if (data.length == 0) return res.status(404).send({ status: false, message: "no product found" })
        return res.status(200).send({ status: true, message: "Success", data: data })
    }

    catch (error) {
        res.status(500).send({ message: error.message })
    }
}

const getProductById = async function (req, res) {
    try {


        let productId = req.params.productId
        if (!mongoose.Types.ObjectId.isValid(productId))
            return res.status(400).send({ status: false, message: "Invalid product ID" });


        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, message: "product not found" })
        return res.status(200).send({ status: true, message: "Success", data: findProduct })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

// Updates a product by changing at least one or all fields
// Check if the productId exists (must have isDeleted false and is present in collection). If it doesn't, return an HTTP status 404 with a response body like this

const updateProduct = async function (req, res) {
    try{
        let data = req.body
        let file=req.files
        let productId = req.params.productId
        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, message: "invalid product id" })
        if (Object.keys(data).length == 0 && file==undefined) return res.status(400).send({ status: false, message: "nothing to update" })
        let findProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!findProduct) return res.status(404).send({ status: false, message: "No product found" })
    
        let updateProduct = {}
    
        if (data.title) {
            if(!isValid(data.title)) return res.status(400).send({status:false,message:"title not valid"})
            data.title = data.title.trim().toUpperCase()
            const Title = await productModel.findOne({ title: data.title, isDeleted: false })
            if (Title) return res.status(400).send({ status: false, message: "title should be unique" })
            updateProduct.title = data.title
        }
        if (data.description) {
            if(!isValid(data.description)) return res.status(400).send({status:false,message:"description not valid"})
            data.description = data.description.trim()
            if (data.description.length == 0) return res.status(400).send({ status: false, message: "description cannot be empty" })
            updateProduct.description = data.description
        }
        if (data.price) {
            data.price = data.price.trim()
            if (parseFloat(data.price) != data.price) return res.status(400).send({ status: false, message: "price should only be a Number" })
            updateProduct.price = data.price
        }
        if (data.isFreeShipping) {
            data.isFreeShipping = data.isFreeShipping.trim()
            if (!isBoolean(data.isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping can only accept true or false" })
            updateProduct.isFreeShipping = data.isFreeShipping
        }
    
        if (file.length>0) {
            const imageUrl = await uploadFile(file[0])
            updateProduct.productImage = imageUrl
        }
    
        if (data.currencyId) {
            data.currencyId = data.currencyId.trim().toUpperCase()
            if (!['INR'].includes(data.currencyId)) return res.status(400).send({ status: false, message: "currencyId should be valid" })
            updateProduct.currencyId = data.currencyId
        }
        if (data.currencyFormat) {
            data.currencyFormat = data.currencyFormat.trim().toUpperCase()
            if (!['₹'].includes(data.currencyFormat)) return res.status(400).send({ status: false, message: "currencyFormat should be valid" })
            updateProduct.currencyFormat = data.currencyFormat
    
        }
    
    
    
        if (data.style) {
            data.style = data.style.trim()
            updateProduct.style = data.style
        }
    
        
    
        if (data.availableSizes) {
            // let productSizes=findProduct.availableSizes
            data.availableSizes = data.availableSizes.split(",")
            data.availableSizes = data.availableSizes.filter(x => x.trim() != "").map(x=>x.trim().toUpperCase())
            
            if (data.availableSizes.length == 0) return res.status(400).send({ status: false, message: "at least one size is required ['S', 'XS','M','X', 'L','XXL', 'XL']" })
            let newArr = data.availableSizes.filter(x => !["S", "XS", "M", "X", "L", "XXL", "XL"].includes(x))
            if (newArr.length != 0) return res.status(400).send({ status: false, message: `sizes ${newArr} should be presented in ["S","XS","M","X","L","XXL","XL"] ` })
            
            // let sizes = [...productSizes,...data.availableSizes]
            // sizes=sizes.filter((item, index) => sizes.indexOf(item) === index);
            updateProduct.availableSizes=data.availableSizes
        }
        if (data.installments) {
            
            if (parseInt(data.installments) != data.installments) return res.status(400).send({ status: false, message: "installments should only be a Number" })
            
            updateProduct.installments = data.installments
        }
        let finalProduct = await productModel.findOneAndUpdate({ _id: productId }, updateProduct, { new: true })
    
        return res.status(200).send({ status: true, message: "Product successfully updated", data: finalProduct })
    
    }
    catch(error){
        return res.status(500).send({ status: false, message: error.message })
    }
}


const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId;
        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, message: "invalid product id" })
        const deleted = await productModel.findOneAndUpdate(
            { _id: productId, isDeleted: false },
            { isDeleted: true ,deletedAt:Date.now()},
            { new: true }
        );
        if (!deleted) {
            return res.status(400).send({ status: false, message: "Product already deleted" })
        }
        res.status(200).send({ status: true, message: "Success", data: deleted });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

module.exports.createProduct = createProduct;
module.exports.getProducts = getProducts;
module.exports.getProductById = getProductById;
module.exports.updateProduct = updateProduct
module.exports.deleteProduct = deleteProduct;