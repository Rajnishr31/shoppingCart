const express =require('express')
const mongoose= require('mongoose')
const route =require('./routes/route')
const app= express()
const mult = require('multer')


app.use(mult().any())
app.use(express.json())

mongoose.set("strictQuery",true)




mongoose.connect("mongodb+srv://tarun21:tarun1616@cluster0.h0l8mir.mongodb.net/group6Database",{
    useNewUrlParser:true
})
.then(()=>console.log("mongodb connected"))
.catch((err)=>console.log(err))

app.use('/',route)





app.listen(3000,function(){
    console.log("server running on ",3000)
})