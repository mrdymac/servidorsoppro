var express = require('express');
var router = express.Router();
var mongo = require('mongodb');

/* GET users listing. */
router.post("/signin",function(req,res){
  var db = require("../db");
  var e=req.body.email;
  var tok=req.body.token;
  var idNot=req.body.idNotification;
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.findOneAndUpdate({"email":e},{token:tok,idNotification:idNot},function(e){
     if (e) {
          console.log("Error! " + err.message);
          return err;
      }
      else {
          console.log("Post saved");
        res.send("[{\"ok\":\"saved\"}]");
      }
  });
});
router.post("/save",function(req,res){
  var db = require("../db");
  var e=req.body.email;
  var tok=req.body.token;
  var idNot=req.body.idNotification;
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.findOneAndUpdate({"email":e},{token:tok,idNotification:idNot},function(e){
     if (e) {
          console.log("Error! " + err.message);
          return err;
      }
      else {
          console.log("Post saved");
        res.send("[{\"ok\":\"saved\"}]");
      }
  });
});

router.get('/plano', function(req, res, next) {
  var db = require("../db");
  var e=req.query.email;
  
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
  Users.find({}).lean().exec(function (a,b){
      console.log(b);
  });
  Users.findOne({"email":e}).lean().exec(
    function (a,b){
      //checa validade (b.validade)
      console.log(e);
      if(b==null)
      res.send([]);
      return;
      checaValidade(b, Users);
      if(b.idPlano!=null && b.idPlano!=undefined && b.idPlano!="" ){
        Planos.find({_id:b.idPlano}).lean().exec((c,plano)=>{
          if(plano[0]._id!=undefined){
          var p={
            id:b.idPlano,
            codigo:plano[0].codigo,
            num_empresas:plano[0].num_empresas,
            validade:b.validade
          };
          
          res.send([p]);
         
        }else
        res.send([]);
        });
        
    }else{
      res.send([]);
    }
    
}
  );
  
});

function checaValidade(userPlano, Model){
  var validade=new Date(userPlano.validade.substr(0,4),userPlano.validade.substr(4,2),userPlano.validade.substr(6,2));
  var hoje=Date.now();
  if(validade<hoje){
    console.log("vencido");
    Model.findOneAndUpdate({email:userPlano.email},{idPlano:null},function(e){
      if (e) {
        console.log("Error! " + err.message);
        return err;
      }
      else {
          console.log("Post saved");       
      }
    })
  }

}

module.exports = router;
