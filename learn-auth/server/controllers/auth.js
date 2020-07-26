const nodemailer = require("nodemailer");
const User = require("../models/auth");
const { json } = require("body-parser");
const jwt = require("jsonwebtoken");
const _ = require("lodash");

const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "1164c77ba8bfd1",
      pass: "8a57d03e0c98c6"
    }
  });

  
  exports.signUp = (req, res) => {
    const { name, email, password } = req.body;
  
    User.findOne({ email }).exec((err, user) => {
      if (err) {
        return res.status(401).json({
          error: "Something went wrong!!",
        });
      }
  
      if (user) {
        return res.status(400).json({
          error: "Email already exists!!",
        });
      }
  
      const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, {
        expiresIn: "10m",
      });
  
      const activateLink = `${process.env.CLIENT_URL}/auth/activate/${token}`;
  
      const emailData = {
        to: [
          {
            address: email,
            name,
          },
        ],
        from: {
          address: process.env.EMAIL_FROM,
          name: "MERN, AUTH",
        },
        subject: "Account Activation Link",
        html: `
          <div>
            <h1>Please use the following link to activate the account.</h1>
            <a href="${activateLink}" target="_blank">
              ${activateLink}
            </a>
            <hr />
            <p>This email contains sensitive information</p>
            <a href="${process.env.CLIENT_URL}" target="_blank">
              ${process.env.CLIENT_URL}
            </a>
          </div>
        `,
      };
  
      transport.sendMail(emailData, (err, info) => {
        if (err) {
          return res.status(400).json({
            error: err,
          });
        }
  
        res.json({
          message: `Email has been successfully sent to ${email}. Follow the instructions i the email to activate your account.`,
        });
      });
    });
  };

exports.accountActivation = (req,res) => {
    const {token} = req.body;
    const activation_link = `${process.env.CLIENT_URL}/api/activate/${token};`
    if(token){
        return jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err)=>{
             if(err){
                return res.status(401).json({
                    message: "Token expired"
                });
             }
            
        

        const {name,email,password} = jwt.decode(token);
        const newUser = new User({name, email, password});     //creating an instance of user and passing the values

        User.findOne({email}).exec((err, user)=>{

            if(err){
                return res.status(400).json({
                    message: "Something went wrong"
                });
            }
            if(user){
                return res.status(400).json({
                    message: "Email already exists"
                });
            }

            newUser.save((err, userData)=>{
                if(err){
                    return res.status(400).json({
                        message: "Something went wrong"
                    }); 
                }
                return res.json({
                    message: `Hey ${name}, welcome to the app!!`
                });
            });

        });
    });

    }

    return res.status(401).json({
        error: "Token is invalid"
    });
}


exports.signIn = (req,res) =>{
    const {email,password} = req.body;
    User.findOne({email}).exec((err,user)=>{
        if(err|| !user){
            return res.status(400).json({
                error: "Such email doesn't exist in database"
            });
        }
        if(!user.authenticate(password)){                    //checks if entered password matches
            return res.status(400).json({
                error: "Password is incorrect"
            });
        }
        const token = jwt.sign({_id: user._id}. process.env.JWT_SECRET,{ //adding jwt secret for sign in
          expiresIn: '7d',  //storing token for 7 days so we don't need signing in
        });   

        const {_id, name, role, email} = user;
        return res.json({
          token,
          user:{
            _id,
            name,
            role,
            email,
          },
          message: "Signed in successfully",
        })

    });
}

exports.forgotPassword = (req,res) =>{
  const {email} = req.body;
  User.findOne({email}).exec((err,user)=>{
    if(err||!user){
      return res.status(400).json({
        error: "User with such email doesn't exist in our database"
      });
    }
    const token = jwt.sign({_id: user._id}. process.env.JWT_RESET_PASSWORD,{ //adding jwt key for reset password 
      expiresIn: '1hr',  //storing token for 1hr for resetting the password
    }); 
    const resetLink = `${process.env.CLIENT_URL}/auth/password/reset/${token}`;
    const emailData = {
      to: [
        {
          address: email,
          name,
        },
      ],
      from: {
        address: process.env.EMAIL_FROM,
        name: "MERN, AUTH",
      },
      subject: "Password reset Link",
      html: `
        <div>
          <h1>Please use the following link to reset your password.</h1>
          <a href="${resetLink}" target="_blank">
            ${resetLink}
          </a>
          <hr />
          <p>This email contains sensitive information</p>
          <a href="${process.env.CLIENT_URL}" target="_blank">
            ${process.env.CLIENT_URL}
          </a>
        </div>
      `,
    };

    return user.updateOne({resetPAsswordLink: token}).exec((err, success)=>{
      if(err){
        return res.status(400).json({
          error: "Error in saving the password link"
        });
      }

      transport.sendMail(emailData).then(()=>{
        res.json({
          message: `Email has been successfully sent to ${email}. Follow the instructions i the email to activate your account.`,
        });
      }
          
      ).catch(err=>{
        return res.status(400).json({
          error: "Error in sending the password link"
        });
      });
             
    });    
});
}

exports.resetPassword = (req,res) =>{
  const {resetPasswordLink, newPassword} = req.body;
  if(resetPasswordLink){
    jwt.verify(resetPasswordLink, JWT_RESET_PASSWORD, (err)=>{
      if(err){
        return res.status(400).json({
          error: "Link expired, Try again"
        });
      }

      User.findOne({resetPasswordLink}).exec((err,user)=>{
        if(err||!user){
          return res.status(400).json({
            error: "Something went wrong. Try later"
          });
        }

        const updateFields = {
          password: newPassword,
          resetPasswordLink: ''
        }

        user = _.extend(user, updateFields);

        user.save((err)=>{
          if(err){
            return res.status(400).json({
              error: "Error in resetting the password"
            });
          }

          return res.json({
            message: "Password has reset successfully"
          })
        });

      });
    });
  }

  return res.status(400).json({
    error: "we have not received the reset password link"
  });
}