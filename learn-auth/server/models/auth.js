const mongoose = require("mongoose");
const crypto = require("crypto");  // for salting(no developer can know password of user) - helps in cryptography

const UserSchema = new mongoose.Schema(
  {
      name: {
          type: String,
          trim: true ,                //removes spaces from beginning and end
          required: true,
          max: 32
        },
      email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true
        },
      hashed_password: {
          type: String,
          required: true,
        },
      salt: {
          type: String,
          required: true
        },
      role: {
          type: String,
          default: "Subscriber"
      },
      resetPasswordLink: {
          data: String,
          default: ''
      },

  }, 
   { timestamps: true }
  );

  UserSchema.methods = {
      makeSalt: function(){                                                 // salt creation
          return Math.round(new Date().valueOf * Math.random() + "");     //Always be unique as date epoch stamp is changing evry millisecond and then converted to string using + ""
      },

      encryptPassword: function(password){
          if(!password) {return "";} 
         
          
          try{
                return crypto.createHmac("sha1", this.salt)    //created a container for password using hmac of crypto and ssl provided algo 'sha1'  
                  .update(password)                       //update by whatever key you've created
                  .digest("hex");                           //stop and save in hex format
                
                
          }     
          catch(err){
                return err;
          }
      },

      authenticate: function(password){
          return (this.encryptPassword === this.hashed_password);
      }
  }

  UserSchema.virtual("password").set(function(password){             //using the data for sometime not saving it in database
      ///temporary variable called password
    this._password = password;

    //generate a salt and save it in database
    this.salt = this.makeSalt();

    //encrypt the password
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function(){
      return this._password;
  });                 
  module.exports = mongoose.model("User", UserSchema);            //exporting userschema as user