//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const encrypt = require('mongoose-encryption');
const mongoose = require('mongoose');
const {Schema} = mongoose;
mongoose.connect("mongodb://localhost:27017/userDB");

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

/* ---->  create schema  <---- */
const userSchema = new Schema({
email: {
type: String
},
password:{
    type: String
}
});

/* ---->  encryption  <---- */

const secret = process.env.SECRET;

userSchema.plugin(encrypt, {
    secret: secret,
    encryptedFields: ['password']
});

/* ---->  create model  <---- */
const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home", {

    });
});

/* ---->  login section  <---- */

app.get("/login", function(req, res){
    res.render("login", {
    
    });
});
app.post("/login",(req, res) => {
const username = req.body.username;
const password = req.body.password;
console.log(username + " " + password);
User.findOne({email:username},(err, foundUser) => {
    if (err) {
        console.log(err);
    }else{
        if (foundUser) {
            if(foundUser.password === password){
                res.render("secrets",{

                });
            }
            
        }
    }
});

});

/* ---->  register section  <---- */

app.get("/register", function(req, res){
res.render("register", {

});
});

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password,
    });
    newUser.save((err) => {
        if(err){
            console.log(err);
        }else{
            res.render("secrets", {
            
            });
        }
    });
    });

/* ---->  server spinup  <---- */

app.listen(process.env.PORT || 3000, function () {
    console.log('server started');
});