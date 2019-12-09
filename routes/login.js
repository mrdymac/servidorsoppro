var express = require('express');
var router = express.Router();


router.get("/",(req,res)=>{    
    res.render("login");

});

router.post("/",(req,res)=>{
    
    var user=req.body.user;
    var senha=req.body.senha;
    if(user=="mrdymac" && senha=="Curtisp40!@#")
        req.session.curtisp="f4ucorsair";
    res.redirect("/empresas/lista");
});

module.exports = router;