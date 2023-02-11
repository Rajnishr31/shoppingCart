const isValid= function(value){
    if(!value || value==null) return false
    if(typeof(value)=='number') return false
    if(typeof(value)=='string' && value.trim()=="") return false
    
    return true
}



module.exports={isValid}