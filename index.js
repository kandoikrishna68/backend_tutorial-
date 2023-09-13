const path = require("path");
const fs = require("fs");
const express = require("express");
const app = express(); 
const mongoose = require("mongoose");
const { getMaxListeners } = require("events");
const dotenv = require("dotenv").config();
const users = [];
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Connecting database 
mongoose.connect("mongodb://127.0.0.1:27017", {dbName: "Backend"}).then(()=>{
    console.log("Database connected");
}).catch((e)=>{
    console.log(e);
})

const UserSchema = new mongoose.Schema({
    name: String, 
    email: String,
    password: String,
})

const User = mongoose.model("User", UserSchema);

// Using Middlewares
// express.static is used to access public folder 
app.use(express.static(path.join(path.resolve(), "public")));
// express.urlencoded is used to access req.body
app.use(express.urlencoded({extended:true}));
// Used to access cookies 
app.use(cookieParser());

const Authenticated = async (req, res, next)=>{
    const token = req.cookies.token;
    if (token){
        const decoded = jwt.verify(token, "jqejhhfl");
        req.user = await User.findById(decoded._id);
        next();
    }
    else{
        res.redirect("/login");
    }
}

app.get("/", Authenticated, (req, res) => {
    res.render("logout.ejs", {name: req.user.name});
})

app.get("/register", async(req, res)=>{
    res.render("register.ejs");
})

app.get("/login", (req, res)=>{
    res.render("login.ejs");
})

app.post("/login", async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user){
        return res.redirect("/register");
    }
    const pw_match = await bcrypt.compare(password, user.password);
    if(!pw_match){
        return res.render("login.ejs", {email, message: "*Incorrect password"});
    } 
    const token = jwt.sign({_id:user._id}, "jqejhhfl");
    res.cookie("token", token, {httpOnly: true, expires: new Date(Date.now()+30*1000)})
    res.redirect("/");
})

app.post("/register", async (req, res)=>{
    const {name,email,password} = req.body;
    let user = await User.findOne({email});
    if(user){
        return res.redirect("/login");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({name , email, password: hashedPassword});
    const token = jwt.sign({_id:user._id}, "jqejhhfl");
    res.cookie("token", token, {httpOnly: true, expires: new Date(Date.now()+30*1000)})
    res.redirect("/");
})

app.get("/logout", (req, res)=>{
    res.cookie("token", null, {
        httpOnly: true, expires: new Date(Date.now())
    });
    res.redirect("/");
})

app.listen(5000, ()=>{
    console.log("Server is listening");
})
