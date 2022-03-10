//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const mongoose = require('mongoose');
const {
    Schema
} = mongoose;
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

/* ---->  initialize and use passport  <---- */

app.use(session({
    secret:"Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/* ---->  Mongoose connection string  <---- */

mongoose.connect("mongodb://localhost:27017/userDB");

/* ---->  create schema  <---- */
const userSchema = new Schema({
    email: {
        type: String
    },
    password: {
        type: String
    }
});

/* ---->  Enable the usage of passport-local-mongoose package  <---- */
userSchema.plugin(passportLocalMongoose);

/* ---->  create model  <---- */
const User = new mongoose.model("User", userSchema);

/* ---->  Initialize passport-local-mongoose  <---- */
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render("home", {

    });
});

/* ---->  login section  <---- */

app.get("/login", function (req, res) {
    res.render("login", {

    });
});
app.post("/login", (req, res) => {
   const user = new User({
       username: req.body.username,
       password: req.body.password
   });

   /* ---->  passport method that allows the login verifs  <---- */

   req.login(user, (err) => {
       if(err){
           console.log(err);
       }else{
           passport.authenticate("local")(req, res, function(){
               res.redirect("/secrets");
           });
       }
   });

});

/* ---->  register section  <---- */

app.get("/register", function (req, res) {
    res.render("register", {

    });
});

app.post("/register", function (req, res) {
    /* ---->  passport-local-mongoose method to store  <---- */
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
   
});

app.get("/secrets",(req, res) => {
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});     

app.get("/logout",(req, res) => {

    /* ---->  passport logout method breaks cookie  <---- */

req.logout();
res.redirect("/");
});

/* ---->  server spinup  <---- */

app.listen(process.env.PORT || 3000, function () {
    console.log('server started');
});