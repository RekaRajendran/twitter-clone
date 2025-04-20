import mongoose from "mongoose";

const connectDB=async ()=>{
    try{
        await mongoose.connect(process.env.Mongo_URL)
        console.log("Mongo db connected") 
    }catch(error){
        console.log(`Error in connecting db: ${error}`)
        //server will stop when db occur the error
        process.exit(1);
    }
}

export default connectDB;