import jwt from "jsonwebtoken";
import User from "../models/user.model.js"
const protectRoute = async(req,res,next)=>{
    try{
        const token=  req.cookies.jwt;
        if(!token){
            return res.status(400).json({error:"Unauthorized: No token Provided"})
        }
        //Encrypted token will decrypt by using jwt verify
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if(!decoded){
            return res.status(400).json({error:"Unauthorized invalid Token"}) 
        }

        const user =await User.findOne({_id:decoded.userId}).select("-paassword")
        if(!user){
            return res.status(400).json({error:"User Not found"})
        }
        req.user=user;
        next();

    }catch(error){ 
        console.log(`Error in protectRoute middlewar5 : ${error}`);
        res.status(500).json({error:"Internal server error"})
    }
}
export default protectRoute;