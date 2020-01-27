var express = require('express');
var router = express.Router();


router.get("/",(req,res)=>{    
    res.render("login");

});

router.post("/",(req,res)=>{
    var db = require("../db");
    var user=req.body.user;
    var pass=req.body.senha;
    var Admin = db.Mongoose.model('admin', db.AdminSchema, 'admin');
    Admin.findOne({login:user,senha:pass}).lean().exec((err,u)=>{
        if(u)        {
            req.session.curtisp="f4ucorsair";
            res.redirect("/empresas/lista");
        }
        else
            res.redirect("/login");
    });
    
    
});

module.exports = router;