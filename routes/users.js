const mongoose= require('mongoose');
var plm = require('passport-local-mongoose')
require('dotenv').config();
const userSchema= new mongoose.Schema({
  username:String,
  pic:String,
  chats:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"user"
    }
  ],  
  currentSocket:String
})
userSchema.plugin(plm);
mongoose.connect(process.env.MONGO_URL).then((result)=>{
console.log("connected to database")
}).catch(err=>{
  console.log(err)
})
module.exports = mongoose.model('user',userSchema)
