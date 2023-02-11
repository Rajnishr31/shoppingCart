const { isValid } = require('../validators/validation')
const UserModel = require('../models/usermodel')
const validator = require('validator')
const { uploadFile } = require('../aws/s3Service')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId




// password hashing
const passwordHashing =async function(password){
  return new Promise((resolve, reject) => {
      const saltRounds = 10 //default
      bcrypt.hash(password, saltRounds, function (err, hash) {
  
        if (err) return  reject(res.status(400).send({ status: false, message: "invalid password" }))
        else return resolve(hash)
          
      });
  })
}










const createUser = async (req, res) => {
  try {
    let data = req.body;
    let files = req.files;
    let fields = Object.keys(data);
    if (fields.length == 0) return res.status(400).send({ status: false, message: "Please provide data for create the user." });


    if (!isValid(data.fname)) return res.status(400).send({ status: false, message: "fname is mandatory" });
    if (!(data.fname).match(/^[a-zA-Z_ ]+$/)) return res.status(400).send({ status: false, message: "give valid name" });

    if (!isValid(data.lname)) return res.status(400).send({ status: false, message: "lname is mandatory" });
    if (!(data.lname).match(/^[a-zA-Z_ ]+$/)) return res.status(400).send({ status: false, message: "give valid name" });
    //check validation for email ---------------------------------------------------------------
    if (!isValid(data.email)) return res.status(400).send({ status: false, message: "email is mandatory" });
    if (!validator.isEmail(data.email.trim())) return res.status(400).send({ status: false, msg: "please enter valid email address!" })

    if (files.length == 0) return res.status(400).send({ status: false, message: "profile image  is mandatory" });

    // phone validation ---------------------------------------------
    if (!isValid(data.phone)) return res.status(400).send({ status: false, message: "phone is mandatory" });
    if (!(data.phone.match(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/))) return res.status(400).send({ status: false, message: "phone number is not valid" })
    if(data.phone.length==10) data.phone='91'+data.phone


    /*----------------------------------- Checking Unique -----------------------------*/

    const email = await UserModel.findOne({ email: data.email.trim().toLowerCase() });
    if (email) return res.status(400).send({ status: false, message: "email already exist" })

    const phone = await UserModel.findOne({ phone: data.phone });
    if (phone) return res.status(400).send({ status: false, message: "phone already exist" })


    // password validation --------------------------------
    if (!isValid(data.password)) return res.status(400).send({ status: false, message: "password is mandatory" });
    if (data.password.length < 8 || data.password.length > 15) return res.status(400).send({ status: false, message: "password length should be in range 8-15" });
    if (!(data.password.match(/.*[a-zA-Z]/))) return res.status(400).send({ status: false, message: "Password should contain alphabets" }) // password must be alphabetic //
    if (!(data.password.match(/.*\d/))) return res.status(400).send({ status: false, message: "Password should contain digits" })// we can use number also //
    // encrypt the password
    data.password= await passwordHashing(data.password)

    if(!data.address) return res.status(400).send({status:false,message:"address is mandatory"})
    
    if(typeof(data.address)=='string') data.address=JSON.parse(data.address)
   console.log(data.address)

    if (!isValid(data.address.shipping.street)) return res.status(400).send({ status: false, message: "shipping address street is mandatory" });
    if (!isValid(data.address.shipping.city)) return res.status(400).send({ status: false, message: "shipping address city is mandatory" });
    if (!data.address.shipping.pincode) return res.status(400).send({ status: false, message: "shipping address pincode is mandatory" });
    if (parseInt(data.address.shipping.pincode) != data.address.shipping.pincode) return res.status(400).send({ status: false, message: "shipping address pincode should only be Number" });
    if(data.address.shipping.pincode.trim().length!=6)return res.status(400).send({ status: false, message: "shipping address pincode should be length 6" });

    if (!isValid(data.address.billing.street)) return res.status(400).send({ status: false, message: "billing address street is mandatory" });
    if (!isValid(data.address.billing.city)) return res.status(400).send({ status: false, message: "billing address city is mandatory" });
    if (!data.address.billing.pincode) return res.status(400).send({ status: false, message: "billing address pincode is mandatory" });
    if (parseInt(data.address.billing.pincode) != data.address.billing.pincode) return res.status(400).send({ status: false, message: "billing address pincode should only be Number" });
    if(data.address.billing.pincode.trim().length!=6)return res.status(400).send({ status: false, message: "billing address pincode should be length 6" });


    data.email = data.email.toLowerCase()



    /*-----------------------------------upload files on s3 storage and getting the link----------------------------------------------------*/

    if (files.length > 0) {
      var uploadedFileURL = await uploadFile(files[0]);
    } else {
      return res.status(400).send({ status: false, message: "No file found, it is mandatory" });
    }
    data.profileImage = uploadedFileURL
    /*---------------------------------------------------------------------------------------*/
    let createUser = await UserModel.create(data);

    return res.status(201).send({ status: true, message:"User created successfully", data: createUser});
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};




const login = async function (req, res) {
  try {
    let body = req.body
    if (Object.keys(body).length == 0) return res.status(400).send({ status: false, message: "Please enter some data" })
    if (!body.email || !body.password) return res.status(400).send({ status: false, message: "Please enter email and password" })


    
    if (!validator.isEmail(body.email.trim())) return res.status(400).send({ status: false, msg: "please enter email correctly" })

    let findUser = await UserModel.findOne({ email: body.email.trim().toLowerCase() })
    if (!findUser) return res.status(400).send({ status: false, message: "Invalid email or password" })
    bcrypt.compare(body.password, findUser.password, function (err, result) {  // Compare
      // if passwords match
      if (result) {
        let token = jwt.sign({ userId: findUser._id }, "Secret-key", { expiresIn: "24h" })
        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: findUser._id, token } })
      }
      // if passwords do not match
      else {
        return res.status(400).send({ status: false, message: "Invalid email or password" })
      }
    })

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });

  }
}







const getUser = async function (req, res) {
  try{
    const userId = req.params.userId
    if(!ObjectId.isValid(userId)) return res.status(400).send({status:false,message:"user objectId is not valid"})
    const userData = await UserModel.findById(userId)
    if (!userData) return res.status(404).send({ status: true, message: "User not found" })
    res.status(200).send({ status: true, message: "User profile details", data: userData })
  }
  catch(error){
    return res.status(500).send({ status: false, message:error.message});
  }
}







const updateUser = async function (req, res) {
  try{
    const userId = req.params.userId
    if(!ObjectId.isValid(userId)) return res.status(400).send({status:false,message:"user objectId is not valid"})
    let updationDetails= req.body
    const file=req.files
    let dataForUpdate={}
    console.log(file)
    if(Object.keys(updationDetails).length==0 && file==undefined) return res.status(400).send({status:false,message:"please provide details for updation"})
    const userData = await UserModel.findById(userId)
    if (!userData) return res.status(404).send({ status: true, message: "User not found" })
 
    
    if(updationDetails.fname){
      if(!isValid(updationDetails.fname)) return res.status(400).send({status:false,message:"name is not valid"})
      if (!(updationDetails.fname).match(/^[a-zA-Z_ ]+$/)) return res.status(400).send({ status: false, message: "give valid name" });
      dataForUpdate.fname=updationDetails.fname
    }

    if(updationDetails.lname){
      if(!isValid(updationDetails.lname)) return res.status(400).send({status:false,message:"last name is not valid"})
      if (!(updationDetails.lname).match(/^[a-zA-Z_ ]+$/)) return res.status(400).send({ status: false, message: "give valid last name" });
      dataForUpdate.lname=updationDetails.lname
    }
    
    if(updationDetails.email){
      
      if (!validator.isEmail(updationDetails.email)) return res.status(400).send({ status: false, msg: "please enter valid email address!" })
      
      const user = await UserModel.findOne({email:updationDetails.email})
      if(user) return res.status(400).send({status:false,message:"email already exist"})
      dataForUpdate.email=updationDetails.email
    }
    
    if(updationDetails.phone){
      if (!(updationDetails.phone.match(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/))) return res.status(400).send({ status: false, message: "phone number is not valid" })
      if(updationDetails.phone.length==10) updationDetails.phone='91'+updationDetails.phone
      const user = await UserModel.findOne({phone:updationDetails.phone})
      if(user) return res.status(400).send({status:false,message:"phone already exist"})
      dataForUpdate.phone=updationDetails.phone
      
    }



    
    if(file.length>0){ 
      const profileLink = await uploadFile(file[0])
      dataForUpdate.profileImage=profileLink
      
    }

    if(updationDetails.password){
      if (updationDetails.password.length < 8 || updationDetails.password.length > 15) return res.status(400).send({ status: false, message: "password length should be in range 8-15" });
      if (!(updationDetails.password.match(/.*[a-zA-Z]/))) return res.status(400).send({ status: false, error: "Password should contain alphabets" }) // password must be alphabetic //
      if (!(updationDetails.password.match(/.*\d/))) return res.status(400).send({ status: false, error: "Password should contain digits" })// we can use number also //
      // encrypt the password
      dataForUpdate.password= await passwordHashing(updationDetails.password)
    }


  
    

    if(updationDetails.address){
      if(typeof(updationDetails.address)=='string') updationDetails.address=JSON.parse(updationDetails.address)

      
      let shippingAdd= userData.address.shipping
      
      
      if(updationDetails.address.shipping){
        if(updationDetails.address.shipping.street) shippingAdd.street=updationDetails.address.shipping.street
        if(updationDetails.address.shipping.city) shippingAdd.city=updationDetails.address.shipping.city
        if(updationDetails.address.shipping.pincode) {
          if(parseInt(updationDetails.address.shipping.pincode)!=updationDetails.address.shipping.pincode) return res.status(400).send({status:false,message:" shipping pincode is invalid"})
          if(updationDetails.address.shipping.pincode.trim().length!=6) return  res.status(400).send({status:false,message:"shipping pincode length should be 6"})
          shippingAdd.pincode=updationDetails.address.shipping.pincode
        }
        
      }
      
      let billingAdd= userData.address.billing
      if(updationDetails.address.billing){
        if(updationDetails.address.billing.street) billingAdd.street=updationDetails.address.billing.street
        if(updationDetails.address.billing.city) billingAdd.city=updationDetails.address.billing.city
        if(updationDetails.address.billing.pincode) {
          if(parseInt(updationDetails.address.billing.pincode)!=updationDetails.address.billing.pincode ) return  res.status(400).send({status:false,message:"billing pincode is invalid"})
          if(updationDetails.address.billing.pincode.trim().length!=6) return  res.status(400).send({status:false,message:"billing pincode length should be 6"})
          billingAdd.pincode=updationDetails.address.billing.pincode
        }
        
      }

      updationDetails.address.shipping=shippingAdd
      updationDetails.address.billing=billingAdd
    }
    dataForUpdate.address=updationDetails.address
    
  

    const updatedUser =await UserModel.findByIdAndUpdate(userId,{$set:dataForUpdate},{new:true})
    res.status(200).send({status:true,message:"User profile updated",data:updatedUser})
  }
  catch(err){
    res.status(500).send({status:false,message:err.message})
  }

}



module.exports.createUser = createUser
module.exports.login = login
module.exports.getUser = getUser
module.exports.updateUser = updateUser