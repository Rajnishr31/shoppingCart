const express =require('express')
const mongoose= require('mongoose')
const route =require('./routes/route')
const app= express()
const mult = require('multer')


app.use(mult().any())
app.use(express.json())

mongoose.set("strictQuery",true)




mongoose.connect("mongodb+srv://Nish54321:Nish54321@rajnishcalifornium.qhqnlpb.mongodb.net/shhoppingModel",{
    useNewUrlParser:true
})
.then(()=>console.log("mongodb connected"))
.catch((err)=>console.log(err))

app.use('/',route)


app.listen(3000,function(){
    console.log("server running on ",3000)
})