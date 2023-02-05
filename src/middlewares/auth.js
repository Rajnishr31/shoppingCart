const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId

const authentication = async function(req,res,next){
    
    let token=req.headers['authorization']

    if(!token) return res.status(401).send({status:false,message:"not getting token"})
    
    token = token.replace("Bearer ","")


    jwt.verify(token,"Secret-key",function(err,decodedToken){
        if(err) return res.status(401).send({status:false,message:err.message})
        else{
            req.userId= decodedToken.userId

            next()
        }
    })

}

const userAuthorization = async function (req,res,next){
    const userId=req.params.userId
    if(!(ObjectId.isValid(userId))) return res.status(400).send({status:false,message:"user id is not valid"})
    if(userId==req.userId) return next()
    else return res.status(403).send({status:false,message:"you are not authorized "})
}

module.exports.authentication=authentication
module.exports.userAuthorization=userAuthorization