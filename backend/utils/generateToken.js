import jwt from "jsonwebtoken";
const generateToken=(userId,res)=>{
    console.log("userid ");
    console.log(userId);
    const token=jwt.sign({userId},process.env.JWT_SECRET,{
        expiresIn:"15d"
    })
    res.cookie("jwt",token,{
        maxAge:15*24*60*1000,
        httpOnly:true,// xss attact prevent,
        // sameSite:"strict", //CSRF attact prevents,
        // secure:process.env.NODE_ENV !=="development",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
         secure: process.env.NODE_ENV === "production"
    })
}

export default generateToken;