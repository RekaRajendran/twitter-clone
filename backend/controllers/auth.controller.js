import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import generateToken from "../utils/generateToken.js";
/* Signup the page */
export const signup = async (req,res)=>{
   try{
    const {username,fullName,email,password}=req.body;

    const emailRegex= /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
     if(!emailRegex.test(email)){
        return res.status(400).json({error:"Invalid Email format"})
     }

     const existingEmail = await User.findOne({email:email}) //or check with user name . {email:email} is equal to {email}
     const existingUsername = await User.findOne({username}) //or check with user name . {email:email} is equal to {email}
    
    if(existingEmail || existingUsername){
        return res.status(400).json({error:"Already Existing user or email"})
    }

    if(password.length <6){
        return res.status(400).json({error:"Password must have atleast 6 char length"}) 
    }
    //genSalt - Number of rounds to use, defaults to 10 if omitted
    const salt= await bcrypt.genSalt(10)
    const passwordString=String(password)
    const hashedPassword= await bcrypt.hash(passwordString,salt)
    
    const newUser = new User({
        username,
        fullName,
        email,
        password: hashedPassword
    })

    if(newUser){
        generateToken(newUser._id,res)
        await newUser.save();
        res.status(200).json({
           _id:newUser._id,
           username:newUser.username,
           fullName:newUser.fullName,
           email: newUser.email,
           followers:newUser.followers,
           following:newUser.following,
           profileImg:newUser.profileImg,
           coverImg:newUser.coverImg,
           bio:newUser.bio,
           link:newUser.link
        })
    }else{
        res.status(400).json({error:"Invaild user Data"})
    }

   }catch(error){
        console.log(`Error in Signup controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});

   }
};

/* Login code here */
export const login = async(req,res)=>{
    try{
        const {username,password}=req.body;
        console.log(username);
        console.log(password);
        const user =await User.findOne({username});
        const isPasswordCorrect=await bcrypt.compare(password,user?.password||"")
        
        if(!user || !isPasswordCorrect){
            return res.status(400).json({error:"Login Invalid username or password"})
        }
        generateToken(user._id,res);
        res.status(200).json({
            _id:user._id,
            username:user.username,
            fullName:user.fullName,
            email: user.email,
            followers:user.followers,
            following:user.following,
            profileImg:user.profileImg,
            coverImg:user.coverImg,
            bio:user.bio,
            link:user.link
        })
    }catch(error){
        console.log(`Error in login controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});

   }
};

/* Logout code here */
export const logout= async(req,res)=>{
    try{
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logout successfuly"})
    }catch(error){
        console.log(`Error in logout Controller : ${error}`);
        res.status(400).json({error:"Internal server error"})
    }
   
};

/* Check the userid and cookie id */
export const getMe= async(req,res)=>{
    try{
        const user=await User.findOne({_id:req.user._id}).select("-password");
        res.status(200).json(user);
    }catch(error){
        console.log(`Error in getMe Controller : ${error}`);
        res.status(400).json({error:"Internal server error"})
    }
}