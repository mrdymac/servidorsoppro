var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

/* GET Userlist page. 
   GET BY ID,
   GET PAGINADA
   GET BY LIKE NOME
*/ 

router.post('/save',function(req,res){
   var db = require("../db");
   var n=req.body.nome;
   //var ticker=req.body.ticker;
   var lo=req.body.logo;
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   var empresa=new Empresas({_id:new mongo.ObjectID(),nome:n,logo:lo,recomendacoes:[{}],normalized:n.toLowerCase()});
   empresa.save(function (err) {
      if (err) {
          console.log("Error! " + err.message);
          return err;
      }
      else {
          console.log("Post saved");
        res.redirect("/empresas?page=1&id="+empresa._id);
      }
   });
});
router.post('/ticker/save',function(req,res){
   var db = require("../db");
   var cod=req.body.codigo;
   var id=req.body.empresa;  
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec((e,empresa)=>{
      empresa.tickers.push({codigo:cod,cotacoes:[]});
      Empresas.findOneAndUpdate({_id:new mongo.ObjectId(id)},{tickers:empresa.tickers},
       {upsert:true}, function(err, doc){
         if (err)
          return res.send(500, { error: err });
         return res.send("succesfully saved");
       });
   });
   
});
router.post('/ticker/dividendos/save',function(req,res){
   var db = require("../db");
   var cod=req.body.codigo;
   var div=req.body.dividendo.replace(',','.');  
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.findOne({"tickers.codigo":cod},{tickers:1}).lean().exec((e,tk)=>{      
      Empresas.findOneAndUpdate({"tickers.codigo":cod},{ $push:{"tickers.$[t].dividendo":div}}, { arrayFilters: [ { "t.codigo": cod } ]},
        function(err, doc){
         if (err)
          return res.send(500, { error: err });
         return res.send("succesfully saved");
       });
   });
   
});
router.post('/ticker/cotacoes/save',function(req,res){
   var db = require("../db");
  // var id=req.body.empresa;
   var cod=req.body.codigo;
   var dat=req.body.data;
   var valor=req.body.valor.replace(',','.');  
  
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
  Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec(
     function(i,emp){
        var tt=[];
         emp.tickers.forEach(t=>{
               if(t.codigo==cod){
                  t.cotacoes.push({data:dat,fechamento:parseFloat(valor),dividendo:parseFloat(div)});
                  tt=t;
               }
         });
         Empresas.findOneAndUpdate({_id:new mongo.ObjectId(id)},{tickers:tt},
         {upsert:true}, function(err, doc){
           if (err)
            return res.send(500, { error: err });
           return res.send("[{\"ok\":\"saved\"}]");
         });
  });
});
router.get('/', function(req, res) {
   var db = require("../db");
   var lastid=req.query.id;
   var pag=req.query.page;    
   var name=req.query.nome;
   var em=req.query.email;
   var tok=req.query.token;
   var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   let limit=10;
   var skip=0;   
      
   skip=limit *(pag-1);
   var query={};
   if((lastid==undefined || lastid=="") && name!="" && name!=undefined)
      query={normalized:new RegExp(name.toLowerCase())};
   else if(lastid!=undefined && lastid!="")
      query={_id:new mongo.ObjectID(lastid)};
        
   Empresas.find(query).skip(skip).limit(limit).sort({nome: 1}).lean().exec(
      function (e, docs) {
         var lista=[];
         docs.forEach((f)=>{
            var ff="";

                f.tickers.forEach((g)=>{
                    ff+=g.codigo+",";
                });
                f.tickers=ff.substr(0,ff.length-1);
                f.id=f._id;
                if(f.recomendacoes[0].dados_recomendacao!=undefined)
                  f.num_recomendacao=f.recomendacoes.length.toString();
                else
                  f.num_recomendacao="0";
               delete(f.recomendacoes);
               delete(f._id);               
               lista.push(f); 
            });
            if(lastid==undefined)
            Users.findOne({email:em,token:tok}).lean().exec(
                  function (e, users) { 
                     if(users!=null && users.idPlano==null){
                        res.status(200).send([]);
                        return ;
                     }

                     var lista2=[];
                     var listauser=[];
                     if(users!=null){
                     users.carteira.forEach((cart)=>{listauser.push(cart.id_empresa.toString())});
                     lista.forEach((item)=>{
                       
                           if(!listauser.includes(item.id.toString()))
                           lista2.push(item);
                        
                     });
                  }
                     res.status(200).send(lista2);
                  }) 
             else 
                res.status(200).send(lista);    
        });
});
router.get('/cotacoes', function(req, res) {
   var db = require("../db");
   var lastid=req.query.id;  
  // var ticker=req.query.ticker;  
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.find({_id:new mongo.ObjectID(lastid)}).lean().exec(
      function (e, docs) {   
         var lista=[];
         docs[0].tickers.forEach(t=>{            
               t.cotacoes.forEach(cotacao=>{
                  if(cotacao.data!=undefined)
               lista.push({data: getDataFormatada(cotacao.data), values:parseFloat(cotacao.fechamento)});   
            });
         });
         res.status(200).send(lista);               
        });
});



router.get('/recomendacoes', function(req, res) {
   var db = require("../db");
   var lastid=req.query.id; 
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.find({_id:new mongo.ObjectID(lastid)}).lean().exec(
      function (e, docs) {   
         var lista=[];
         docs[0].recomendacoes.forEach(rec=>{
            if(rec._id!=undefined)
            lista.push({data:getDataFormatada(rec.data), id:rec._id});   
            
         });
         res.status(200).send(lista);               
        });
});
function getCurrencyMode(valor){
   var moeda=valor.toString().split('.');
   if(moeda.length==2)
       if(moeda[1].length==1)
           return "R$ "+moeda[0]+","+moeda[1]+"0"
       else
       return "R$ "+moeda[0]+","+moeda[1]
   else
       return "R$ "+moeda[0]+",00";
}
function getDataFormatada(valor){   
   var data=valor;//.toISOString().substr(0,10);
  return data.substr(6,2)+"/"+data.substr(4,2)+"/"+data.substr(0,4)
}
module.exports = router;

