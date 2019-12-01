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
   var tick=req.body.ticker;
   var lo=req.body.logo;
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   var empresa=new Empresas({_id:new mongo.ObjectID(),nome:n,logo:lo,recomendacoes:[{}],normalized:n.toLowerCase(),tickers:tick});
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
router.delete('/delete/:id',function(req,res){
   var db = require("../db");
   var id=req.params.id;
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.findOneAndDelete({_id:new mongo.ObjectId(id)}).exec((err,emp)=>{      
      if (err) {
          console.log("Error! " + err.message);
          res.status(500);
          return err;
          
      }
      else {
          console.log("Deleted");
          res.status(200).send({"ok":"deletado"});
      }
   });
});
router.get('/tickers',function(req,res){
   var db = require("../db");   
   var id=req.query.empresa;
   var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
// Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec((e,empresa)=>{
      //empresa.tickers.push({codigo:cod,cotacoes:[]});
      Tickers.find({idEmpresa:new mongo.ObjectID(id)},
         function(err, doc){
            Empresas.findOne({_id:new mongo.ObjectID(id)},
            function(e,emp){
               if (err)
               return res.send(500, { error: err });
               return res.render("tickers",{lista:doc,empresa:emp});
       });
      });
   });
   
router.post('/ticker/save',function(req,res){
   var db = require("../db");
   var cod=req.body.codigo;
   var id=req.body.empresa;
   var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
// Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec((e,empresa)=>{
      //empresa.tickers.push({codigo:cod,cotacoes:[]});
      Tickers.findOneAndUpdate({codigo:cod},{idEmpresa:new mongo.ObjectID(id),codigo:cod,cotacoes:[],dividendos:[]},
             {upsert:true}, function(err, doc){
         if (err)
          return res.send(500, { error: err });
         return res.redirect("/tickers");
       });
   });
   router.delete('/ticker/delete/:id',function(req,res){
      var db = require("../db");
      var id=req.param.id;
      
      var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   // Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec((e,empresa)=>{
         //empresa.tickers.push({codigo:cod,cotacoes:[]});
         Tickers.findOneAndDelete({_id:id},
                function(err, doc){
                  if (err)
                  return res.send(500, { error: err });
                  return res.redirect("/tickers?empresa="+doc.idEmpresa);
                  
               });
      });
//});
router.post('/ticker/dividendos/save',function(req,res){
   var db = require("../db");
  // var id=req.body.empresa;
   var cod=req.body.codigo;
   var dat=req.body.data;
   var val=req.body.valor;  
  
   var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   setTimeout(()=>{

   
         
         Tickers.findOneAndUpdate({
            // _id:new mongo.ObjectId(id),
            "codigo":cod, "dividendos.data":dat},
            {$set:{"dividendos.$.valor":parseFloat(val)}},
            
          function(err, doc){
            console.log(doc);
            if(doc==null)
            Tickers.findOneAndUpdate({
                // _id:new mongo.ObjectId(id),
                "codigo":cod},
                {$push:{"dividendos":{data:dat,valor:parseFloat(val)}}},
                function(err2,dd){
           if (err2)
            return res.send(500, { error: err2 });
            return res.status(200).send("[{\"ok\":\"saved cotacoes\"}]");
         });
         else {
        if (err)
         return res.send(500, { error: err });
         return res.status(200).send("[{\"ok\":\"saved cotacoes\"}]");
         }
        });
   }, 3000);
});
 //  });
 router.post('/ticker/cotacoes/save',function(req,res){
   var db = require("../db");
  // var id=req.body.empresa;
   var cod=req.body.codigo;
   var dat=req.body.data;
   var val=req.body.valor;  
  
   var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   setTimeout(()=>{

   
         
         Tickers.findOneAndUpdate({
            // _id:new mongo.ObjectId(id),
            "codigo":cod, "cotacoes.data":dat},
            {$set:{"cotacoes.$.fechamento":parseFloat(val)}},
            
          function(err, doc){
            console.log(doc);
            if(doc==null)
            Tickers.findOneAndUpdate({
                // _id:new mongo.ObjectId(id),
                "codigo":cod},
                {$push:{"cotacoes":{data:dat,fechamento:parseFloat(val)}}},
                function(err2,dd){
           if (err2)
            return res.send(500, { error: err2 });
            return res.status(200).send("[{\"ok\":\"saved cotacoes\"}]");
         });
         else {
        if (err)
         return res.send(500, { error: err });
         return res.status(200).send("[{\"ok\":\"saved cotacoes\"}]");
         }
        });
   }, 3000);
  });
//});
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
                     console.log(users.carteira);
                     res.status(200).send(lista2);
                  }) 
             else 
                res.status(200).send(lista);    
        });
});

router.get('/cotacoes', function(req, res) {
   var db = require("../db");
   var lastid=req.query.id;  
 //  var ticker=req.query.ticker;  
   var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   Tickers.find({idEmpresa:new mongo.ObjectId(lastid)},{cotacoes:1}).lean().exec(
      function (e, docs) { 
       var lista=docs[0].cotacoes;
          
       lista.forEach(element => {
           element.data=getDataFormatada(element.data);
       });
         res.status(200).send(lista);               
        });
});

router.get('/cotacoes/ultima', function(req, res) {
   var db = require("../db");
   var id=req.query.id;  
  // var ticker=req.query.ticker;  
   var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   Tickers.find({idEmpresa:new mongo.ObjectId(id)},{cotacoes:1}).lean().exec(
      function (e, docs) { 
          var cotacao=getUltimaCotacao(docs[0]);
          cotacao.data=getDataFormatada(cotacao.data);
          
          
         res.status(200).send(cotacao);               
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

router.get('/lista', function(req, res) {
   var db = require("../db");
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.find({}).lean().exec((a,b)=>{
         res.render("empresas",{lista:b});
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

function getUltimaCotacao(tick){
   var cotacao=tick.cotacoes.sort(
       (a,b)=>{
           if ( a.data < b.data ){
               return -1;
             }
             if ( a.data > b.data ){
               return 1;
             }
             return 0;
       }
   )[tick.cotacoes.length-1];
   return cotacao;
}
module.exports = router;

