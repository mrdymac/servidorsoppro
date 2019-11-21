var express = require('express');
var router = express.Router();
var mongo = require('mongodb');

router.post('/save', function(req, res, next) {
    var db = require("../db");
    var cod=req.body.codigo;
    var num_empr=req.body.num_empresas;
    var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
    var plano=new Planos({_id:new mongo.ObjectID(),codigo:cod,num_empresas:num_empr});
    plano.save(function (err) {
        if (err) {
            console.log("Error! " + err.message);
            return err;
        }
        else {
            console.log("Post saved");
          res.redirect("/empresas?page=1");
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
module.exports = router;