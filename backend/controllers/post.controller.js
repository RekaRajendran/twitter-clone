import User from "../models/user.model.js";
import cloudinary from "cloudinary";
import Post from "../models/post.model.js";
import Notification from "../models/notification.model.js";
export const createPost=async (req,res)=>{
    try{    
        const {text} = req.body;
        let {img} = req.body;
         const userId=req.user._id.toString();

         const user=await User.findOne({_id:userId})
         if(!user){
            return res.status(500).json({error:"User not found"});
         }
         if(!text && !img){
            return res.status(500).json({error:"Post must have text or image"});
         }
         if(img){
            const uploadedResponse=await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
         }
         const newPost=new Post({
             user:userId,
             text,
             img 
         })
         await newPost.save();
         res.status(201).json(newPost)

    }catch(error){
        console.log(`Error in Post controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
}

/* Delete the post*/
export const deletePost = async (req,res)=>{
    try{
        const {id}=req.params;
        const post =await Post.findOne({_id:id});
        if(!post){
            return res.status(404).json({error:"post not found"})
        }
        if(post.user.toString() !==req.user._id.toString()){
            res.status(401).json({error:"You are not authorized to delete this post"});
        }
        if(post.img){
            const  imgId=post.img.split("/").pop().split(".")[0];
            await  cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
        }
        await Post.findByIdAndDelete({_id:id}); 
        res.status(200).json({message:"Post deleted successfully"});

    }catch(error){
        console.log(`Error in deleteing post controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
}
export const createComment=async(req,res)=>{
    try{
        const {text}=req.body;
        const postId=req.params.id;
        const userId=req.user._id;
        console.log("Post Id ",req.params.id);
        console.log("Post Id ",postId);
        if(!text){
            return res.status(400).json({error:"Comment text is required"});
        } 
        const post =await Post.findOne({_id:postId});
        if(!post){
            return  res.status(404).json({error:"Post not found"});
        }
        const comment ={
            user:userId,
            text
        }
        post.comments.push(comment);
        await post.save();
        res.status(200).json(post.comments);
    }catch(error){
        console.log(`Error in Comment controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
} 
export const likeUnlikePost=async(req,res)=>{

    try{
        const userId=req.user._id;
        const {id:postId}=req.params;
        console.log("userId ",userId)
        console.log("postId ",postId)
        const post=await Post.findOne({_id:postId}) 
        if(!post){
            return res.status(404).json({error:"post not found"})
        }

        const userLikedPost=post.likes.includes(userId)
        if(userLikedPost){
            /* If already post is their for particular user, need to do unlike function here */
            await Post.updateOne({_id:postId},{$pull:{likes:userId}})
            await User.updateOne({_id:userId},{$pull:{likedPosts:postId}})
            const updatedLikes=post.likes.filter((id)=>id.toString() !== userId.toString())
            //  res.status(200).json({message:"Post unlike successfully"})
            res.status(200).json(updatedLikes)
        }else{
            //need to like post concept
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save();
          

            const notification= new Notification({
                 type:"like",
                from:userId,
                to:post.user,
               
            })
            await notification.save();
            const updatedLikes=post.likes;
            //  res.status(200).json({message:"Post like successfully"})
            res.status(200).json(updatedLikes)
      
        }

    }catch(error){
        console.log(`Error in likeUnlikePost controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
} 

export const getAllPosts=async(req,res)=>{

    try{
        const userId=req.user._id; 
        const posts= await Post.find().sort({createdAt:-1}).populate({
            path:"user",
            select:"-password"
        }).
        populate({
            path:"comments.user",
            select:["-password","-email","-following","-followers","-bio","-link"]
        })
        // const post=await Post.find({user:userId}) 
        if(posts.length==0){
            return res.status(200).json([])
        }
        return res.status(200).json(posts)

    }catch(error){
        console.log(`Error in getAllPosts controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
} 
//Which users want to know about like
export const getLikedPosts=async(req,res)=>{

    try{
        const userId=req.params.id
        const user =await User.findById({_id:userId}) 
        console.log("In getLikedPosts userId ",userId)
        if(!user){
            return  res.status(404).json({error:"User not found"});
        }
        console.log("In getLikedPosts userId ",userId)
        const likedPost=await Post.find({_id:{$in:user.likedPosts}})
            .populate({
                path:'user',
                select:["-password","-email","-following","-followers","-bio","-link"]
      
            })
            
               
        res.status(200).json(likedPost)

    }catch(error){
        console.log(`Error in getLikedPosts controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
} 
/* Get the all following post */
export const getFollowingPosts=async(req,res)=>{

    try{
        const userId=req.user._id
        const user =await User.findById({_id:userId}) 
       
        if(!user){
            return  res.status(404).json({error:"User not found"});
        }
        const following=user.following;
        const feedPosts=await Post.find({user:{$in:following}})
            .sort({createdAt:-1})
            .populate({
                path:"user",
                select:"-password"
            })
            .populate({
                path:"comments.user",
                select:"-password"
            })
               
        res.status(200).json(feedPosts)

    }catch(error){
        console.log(`Error in getFollowingPosts controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
} 

/* Get the all following post */
export const getUserPosts=async(req,res)=>{

    try{
        const { username }=req.params;
        console.log("In getUserPosts username ",username)
        const user =await User.findOne({username}) 
       
        if(!user){
            return  res.status(404).json({error:"User not found2"});
        }
        
        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password"
            })
            .populate({
                path: "comments.user",
                select: "-password"
            });
               
        res.status(200).json(posts)

    }catch(error){
        console.log(`Error in getUserPosts controller ${error}`)
        res.status(500).json({error:"Internal Server Error"});
    }
} 