// const express = require("express")
import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import cloundinary from  "cloudinary"

import connectDB from "./db/connectDb.js"
import authRoute from "./routes/auth.route.js"
import userRoute from "./routes/user.route.js"
import postRoute from "./routes/post.route.js"
import notificationRoute from "./routes/notification.route.js"
import cors from "cors";
import path from "path";
dotenv.config();
const app=express();
const __dirname=path.resolve();
cloundinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret :process.env.CLOUDINARY_API_SECRET_KEY
}) 

app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))
const PORT = process.env.PORT;
// console.log(process.env);

app.get("/",(req,res)=>{
    res.send("Hello word")     
}) 
//Retrun middleware that only pass json
app.use(express.json(
    {
        limit:"5mb"//default value 100kb
    }
));
//cookieParser middleware used for get the cookie value from frontend and client
app.use(cookieParser())
app.use(express.urlencoded({
    extended:true
}))
app.use("/api/auth",authRoute);
app.use("/api/users",userRoute);
app.use("/api/posts",postRoute);
app.use("/api/notifications",notificationRoute)

if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(__dirname,"/frontend/build/")))
    app.use("*",(req,res)=>{
        res.sendFile(path.resolve(__dirname,"frontend","build","index.html"))
    })
}

app.listen(PORT,()=>{
    console.log(`server is running on port number ${PORT}`)
    connectDB();
})