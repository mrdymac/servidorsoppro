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
 
  Users.findOne({email:e}).lean().exec(
    function (a,b){
     
      
      if(b==null){
        res.send([]);
        return;
      }
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

router.post('/plano/assina', function(req, res, next) {
  var db = require("../db");
  var e=req.body.email;
  var plano=req.body.plano;  
  var tok=req.body.token; 
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
  //verifica na api do google ou ios apple a situacao da assinatura
  var validad=hojeToString();
  Planos.findOne({codigo:plano}).lean().exec((e,p)=>{
    Users.findOneAndUpdate({email:e, token:tok},{$set:{idPlano:p._id,validade:validad}}).lean().exec(
      function (a,b){     
        if(a){
          return res.send([{'erro':'erro'}]);
        }else{
          return res.send([{'ok':'saved'}]);
        }
      });
  });
 
  
});
function hojeToString(){
 var data = new Date(Date.now());
 var newDate = new Date(data.setTime( data.getTime() + 30 * 86400000 ));
 
 return newDate.getFullYear().toString()+newDate.getMonth().toString()+newDate.getDate();
}
function checaValidade(userPlano, Model){
  if(userPlano.validade==null)
  return;
  var validade=new Date(userPlano.validade.substr(0,4),userPlano.validade.substr(4,2),userPlano.validade.substr(6,2));
  var hoje=Date.now();
  if(validade<hoje){
    
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
