var express = require('express');
var router = express.Router();
var mongo = require('mongodb');

router.post('/save', function(req, res, next) {
  if(req.session.curtisp!="f4ucorsair")
      return res.status(401).send("não autorizado");
    var db = require("../db");
    var cod=req.body.codigo;
    var num_empr=req.body.num_empresas;
    var idGoogle=req.body.idgoogle;
    var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
    var plano=new Planos({_id:new mongo.ObjectID(),codigo:cod,num_empresas:num_empr, idGooglePlay:idGoogle});
    plano.save(function (err) {
        if(err){
            return res.send([{'erro':'erro'}]);
          }else{
            return res.send([{'ok':'saved'}]);
          }
     });
  });

router.get('/', function(req, res) {
  
    var db = require("../db");
    var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
    Planos.find({}).lean().exec((a,plano)=>{
        res.send(plano);
    });
      
});
router.get('/productList', function(req, res) {
  var db = require("../db");
  var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
  Planos.find({},{idGooglePlay:1}).lean().exec((a,plano)=>{
    var l=[];
    plano.forEach((item)=>{
      if(item.idGooglePlay!=null)
      l.push(item);
    });
      res.send(l);
  });
    
});
module.exports = router;