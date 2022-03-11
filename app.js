//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
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
    },
    googleId: String
});

/* ---->  mongoose plugins  <---- */
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

/* ---->  create model  <---- */
const User = new mongoose.model("User", userSchema);

/* ---->  use passport instead of passport local mongoose  <---- */
/* ---->  Serialize and deserialize  <---- */
passport.use(User.createStrategy());

passport.serializeUser((err, done) => {
done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err,user);
    });
});
/* ---->  google auth implementation  <---- */  

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://yourdomain:3000/auth/google/secrets",
    passReqToCallback   : true,
    useProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

/* ---->  main route  <---- */

app.get("/", function (req, res) {
    res.render("home", {

    });
});

/* ---->  google auth route  <---- */

app.get("/auth/google",(req, res) => {
    passport.authenticate("google", {scope:["profile"]});
});

/* ---->  google auth callback route  <---- */

app.get("/auth/google/secrets",passport.authenticate("google", {failureRedirect: "/login"}),(req, res) => {
    res.redirect("/secrets");
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

/* ---->  athenticate then render app  <---- */

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