import User from "../models/user.model.js"
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import cloundiary from "cloudinary"
/* Get the profile */
export const getProfile=async(req,res)=>{
    try{
        const {username}=req.params;
        console.log(`In usercontroller - username  ${username} `);
        const user= await User.findOne({username})

        if(!user){
            return res.status(404).json({error:"User not found"})
        }
        return res.status(200).json(user)
    }catch(error){
        console.log(`Error in get User profile controller :${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}
/* Follow / Unfollow user */
export const followUnFollowUser=async(req,res)=>{
    try{
        const {id}=req.params;
        const currentUserId = req.user?._id;
        
        console.log("Inside followUnFollowUser",id, req.user._id)
        const userToModify=await User.findById({_id:id})       
        const currentUser= await User.findById({_id:req.user._id})

        if(id===currentUserId){
            return res.status(400).json({error:"You cant't unfollow/follow yourself"}) 
        }
        if(!userToModify || !currentUser){
            return res.status(404).json({error:"User not found"})
        }
        const isFollowing=currentUser.following.includes(id);
        if(isFollowing){
            //Need to do unfollow
            await User.findByIdAndUpdate({_id:id},{$pull:{followers:req.user._id}})
            await User.findByIdAndUpdate({_id:req.user._id},{$pull:{following:id}})
            return res.status(200).json({message:"Unfollow successfully"})
        }else{
            //Follow
            await User.findByIdAndUpdate({_id:id},{$push:{followers:req.user._id}})
            await User.findByIdAndUpdate({_id:req.user._id},{$push:{following:id}})
           // return res.status(200).json({message:"Follow successfully"})
            //will send notification
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id
            });

            if(newNotification){
              
                await newNotification.save();
                return res.status(200).json({message:"Follow successfully. Notification sent successfully"});
            }else{
                res.status(400).json({error:"Follow successfully. Notification have a problem"})
            }

            
        }

    }catch(error){
        console.log(`Error in followUnFollowUser controller :${error}`)
        res.status(500).json({error:"Internal server error"})
    }
}
/* Get suggest user */
export const getSuggestedUsers =async(req,res)=>{
    try{
        const userId=req.user._id;
        const userFollowedByMe=await User.findById({_id:userId}).select("-password")
        const users= await User.aggregate([
             {
                $match:{
                    _id:{$ne:userId}
                }
             },
             {
                $sample:{
                    size:10
                }
             }
        ])
        const fillteredUser=users.filter((user)=> !userFollowedByMe.following.includes(user._id))
        const suggestedUsers=fillteredUser.slice(0,4)

        suggestedUsers.forEach((user)=>(user.password=null))
        res.status(200).json(suggestedUsers);
    }catch(error){
        console.log(`Error in getSuggestedUsers controller :${error}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}
  
/* Updat the user details*/
export const updateUser=async(req,res)=>{
    try{
        const userId=req.user._id;
        const {username,fullName,email,currentPassword,newPassword,bio,link}=req.body;
        let {profileImg,coverImg}=req.body;
        let user=await User.findById({_id:userId})
        if(!user){
             return res.status(404).json({error:"User not found"})
        }
        if((!newPassword && currentPassword) || (!currentPassword && newPassword)){
            return res.status(400).json({error:"Please provide both the new password and current password"})
        }
        if(currentPassword && newPassword){
            const isMatch=await bcrypt.compare(currentPassword,user.password)
            if(!isMatch){
                return res.status(400).json({error:"Current password is incorrect"})
            }
            if(newPassword.length<6){
                return res.status(400).json({error:"Password must have atleast 6 char"})
            }
            const salt= await bcrypt.genSalt(10);
            user.password=await bcrypt.hash(newPassword,salt)             
        }
        if(profileImg){
            if(user.profileImg){
                await cloundiary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }
            const uploadedResponse=await cloundiary.uploader.upload(profileImg);
            profileImg=uploadedResponse.secure_url;
        }
        if(coverImg){
            if(user.coverImg){
                await cloundiary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
            }
            const uploadedResponse=await cloundiary.uploader.upload(coverImg);
            coverImg=uploadedResponse.secure_url;
            console.log("coverimg",coverImg)
        }
        user.fullName=fullName||user.fullName;
        user.email=email||user.email;
        user.username=username||user.username;
        user.bio=bio||user.bio;
        user.link=link||user.link;
        user.profileImg=profileImg||user.profileImg;
        user.coverImg=coverImg||user.coverImg;



        user=await user.save();
        //password is null in res
        user.password=null;
        return res.status(200).json(user);

    }catch(error){
        console.log(`Error in updateUser controller :${error}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}
