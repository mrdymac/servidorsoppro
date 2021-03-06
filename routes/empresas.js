var express = require('express');
var router = express.Router();
var mongo = require('mongodb');


var http = require('axios');
const { JSDOM } = require( 'jsdom' );



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
   if(req.session.curtisp!="f4ucorsair")
      return res.status(401).send("não autorizado");
   var db = require("../db");
   var n=req.body.nome;
   var tick=req.body.ticker;
   var lo=req.body.logo;
   var idInvest=req.body.idInvesting;
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
   var empresa=new Empresas({_id:new mongo.ObjectID(),nome:n,logo:lo,recomendacoes:[],normalized:n.toLowerCase(),tickers:tick,idInvesting:idInvest});
  
   var id=req.body.id;  
   if(id=="") 
   empresa.save(function (err) {
      if (err) {
          console.log("Error! " + err.message);
          return err;
      }
      else {
          console.log("Post saved");
          var hoje=Date.now();
          Users.find({validade:{$gte:new Date(hoje)}}).lean().exec(function (errr,users){
            var listaNotification=[];
            users.forEach((user)=>{
               if(user.idNotification!=null && user.idNotification!="")
                   listaNotification.push(user.idNotification);
            });
            if(listaNotification.length>0)
            enviaNotificacao(listaNotification,"Iniciamos a cobertura de "+n,"Nova empresa inserida")
         });
          
        res.redirect("/empresas?page=1&id="+empresa._id);
      }
   });
   else  
      Empresas.findOneAndUpdate({_id:new mongo.ObjectId(id)},{$set:{nome:n,logo:lo,tickers:tick,normalized:n.toLowerCase(),idInvesting:idInvest}}).lean().exec((a,b)=>{
         res.redirect("/empresas?page=1&id="+empresa._id);
      });
   
});
router.delete('/delete/:id',function(req,res){
   if(req.session.curtisp!="f4ucorsair")
      return res.status(401).send("não autorizado");
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
   if(req.session.curtisp!="f4ucorsair")
   return res.redirect("/login");
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
   if(req.session.curtisp!="f4ucorsair")
      return res.status(401).send("não autorizado");
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
          return res.redirect("/empresas/tickers?empresa="+id);
       });
   });
   router.delete('/ticker/delete/:id',function(req,res){
      if(req.session.curtisp!="f4ucorsair")
         return res.status(401).send("não autorizado");
      var db = require("../db");
      var id=req.params.id;
      
      var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   // Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec((e,empresa)=>{
         //empresa.tickers.push({codigo:cod,cotacoes:[]});
         Tickers.findOneAndDelete({_id:new mongo.ObjectID(id)},
                function(err, doc){
                  if (err)
                  return res.send(500, { error: err });
                  return res.redirect("/tickers?empresa="+doc.idEmpresa);
                  
               });
      });
//});
router.post('/ticker/dividendos/save',function(req,res){
   if(req.session.curtisp!="f4ucorsair")
   return res.status(401).send("não autorizado");

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
            //console.log(doc);
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
  //  console.log(req.body.meta);
   //  if(req.body.meta!="havilandmosquito") 
   //  return res.status(401).send("não autorizado");
  //  console.log(req.body.meta=="havilandmosquito");
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
      //      console.log(doc);
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

  router.post('/ticker/alertas/save',function(req,res){
   //console.log(req.body.meta);
   // if(req.body.meta!="havilandmosquito") 
   // return res.status(401).send("não autorizado");

  var db = require("../db");
 // var id=req.body.empresa;
  var cod=req.body.codigo;
  var dat=req.body.data;
  var val=req.body.valor;  
  var st=req.body.stop;  
  var reco=req.body.recomendacao;  
  var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
  var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  setTimeout(()=>{
      Tickers.findOne({
           // _id:new mongo.ObjectId(id),
           "codigo":cod, "alertas.data":dat},
           //{$set:{"cotacoes.$.fechamento":parseFloat(val)}},
           
         function(err, doc){
         //  console.log(doc);
         if(doc!=null)
            return res.send([]);
         if(doc==null)
            Tickers.findOneAndUpdate({
                  // _id:new mongo.ObjectId(id),
                  "codigo":cod},
                  {$push:{"alertas":{data:dat,limite:parseFloat(val),recomendacao:reco, stop:parseFloat(st)}}},
                  function(err2,ti){
                     if (err2)
                        return res.send(500, { error: err2 });
                     
                        Empresas.findOne({_id:new mongo.ObjectId(ti.idEmpresa)},
                         function(err, rec){       
                            Users.find({"carteira.id_empresa":rec._id,"carteira.alertar":true}).lean().exec(function (errr,users){
                                var listaNotification=[];
                                users.forEach((user)=>{
                                    var hoje=Date.now();
                                    if(user.validade>=new Date(hoje))
                                       listaNotification.push(user.idNotification);
                                }); 
                                if(listaNotification.length==0)
                                    return res.send("{'ok':'sem usuarios'}");
                                var recc="";
                                var msg="";
                                if(reco=="COMPRA"){
                                    recc="COMPRAR "+ti.codigo;
                                    msg="Oportunidade em "+getCurrencyMode(val)+" e Stop em "+getCurrencyMode(st);                                    
                                }else if(reco=="ALVO"){
                                    recc=ti.codigo+" ALVO ATINGIDO";
                                    msg="Alvo de "+getCurrencyMode(val)+" foi atingido.";
                                }
                                else if(rec=="NEWSTOP"){
                                    recc="NOVO ALVO "+ti.codigo;
                                    msg="Ajuste o stop para de "+getCurrencyMode(st);
                                 }else if(reco=="VENDA"){
                                    recc="VENDA "+ti.codigo;
                                    msg="Alvo de "+getCurrencyMode(val)+" foi atingido.";
                                 }
                                enviaNotificacao(listaNotification, msg ,  "Trade Alert! "+recc);
                               res.send([{'ok':'saved'}]);
                            });
                        });
                  
                    // return res.status(200).send("[{\"ok\":\"saved alertas\"}]");
        });         
         
       });
  }, 3000);
 });

 router.get('/alertas', function(req, res) {
   var db = require("../db");
   var id = req.query.empresa;
   var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
   Tickers.findOne({idEmpresa:new mongo.ObjectId(id)},(err,doc)=>{
      //   console.log(doc);
         if(err)
            return res.status(500).send([{'erro':'erro'}]);
         var lista=[];
         var topAlerts=doc.alertas.sort(
            (a,b)=>{
                if ( a.data < b.data ){
                    return -1;
                  }
                  if ( a.data > b.data ){
                    return 1;
                  }
                  return 0;
            }
        );
         var total=doc.alertas.length;
         if(total>5)
            total=5;
         for(var i=0;i<total;i++)
         lista.push({
            recomendacao:topAlerts[i].recomendacao,
            data:getDataFormatada(topAlerts[i].data),
            stop:getCurrencyMode(topAlerts[i].stop),
            limite:getCurrencyMode(topAlerts[i].limite)
         });
         return res.status(200).send(lista);
   })
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
                var num_rec=0;
                if(f.recomendacoes[0]!=undefined && f.recomendacoes[0].dados_recomendacao!=undefined){
                  f.recomendacoes.forEach((item)=>{
                     if(item.publicado)
                        num_rec++;
                  });
                  f.num_recomendacao=num_rec.toString();
                }
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
                   //  console.log(users.carteira);
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
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.findOne({_id:new mongo.ObjectId(lastid)}).lean().exec(
      function (e, empr) {
         var idInvesting=empr.idInvesting;
         var dataIni=new Date(Date.now() - 180 * 86400000).toISOString().substr(0,10);
         dataIni=dataIni.substr(8,2)+"/"+dataIni.substr(5,2)+"/"+dataIni.substr(0,4);
         var dataFim= new Date(Date.now()).toISOString().substr(0,10);
         dataFim=dataFim.substr(8,2)+"/"+dataFim.substr(5,2)+"/"+dataFim.substr(0,4);
         const data = "curr_id="+idInvesting+"&smlID=1166714&header=PRIO3&st_date="+dataIni+"&end_date="+dataFim+"&"+
         "interval_sec=Weekly&sort_col=date&sort_ord=DESC&action=historical_data";        
         const options = {
            headers: {
               'Host':'br.investing.com',
               'Accept': '*/*',
               'Accept-Encoding': 'gzip, deflate, br',             
               'Content-Type': 'application/x-www-form-urlencoded', 
               'Connection': 'keep-alive',
               "Cache-Control":"no-cache",
               "Cookie":'ses_id=deleted; PHPSESSID=n0ctur4patjbjkj2rs047366sf; StickySession=id.34756005100.401.br.investing.com; geoC=BR; adBlockerNewUserDomains=1578678782; nyxDorf=ODw%2FZDRlZiQyYGp4ZjM2Mz9wNG40Nzcz',
               "Content-Length":                Buffer.byteLength(data),
               "User-Agent": "PostmanRuntime/7.21.0",   
               'Postman-Token':'2bf677c3-aa6c-4def-85ff-02bc768b85cd',
               "X-Requested-With": "XMLHttpRequest"
             },
            method:"POST"
          };
          var lista=[];
      http.post("https://br.investing.com/instruments/HistoricalDataAjax",data,options).then((resp) => {
         lista=call_jsdom(resp.data);
           
           lista.forEach(element => {
             element.data=getDataFormatada(element.data);              
           });
          lista.pop();
          res.status(200).send(lista);               
         }).catch((error) => {
            if( error.response ){
               res.status(200).send([]); // => the response payload 
            }
        });;
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
   Empresas.findOne({_id:new mongo.ObjectID(lastid),"recomendacoes.publicado":true}).lean().exec(
      function (e, docs) {   
         if(docs==null){
            res.send([]);
            return;
         }
         var lista=[];
         docs.recomendacoes.forEach(rec=>{
            if(rec._id!=undefined && rec.publicado)
            lista.push({data:getDataFormatada(rec.data), id:rec._id});   
            
         });
         res.status(200).send(lista);               
        });
});

router.get('/lista', function(req, res) {
   
   if(req.session.curtisp!="f4ucorsair")
   return res.redirect("/login");

   var db = require("../db");
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.find({}).lean().exec((a,b)=>{
         res.render("empresas",{lista:b});
   });   
});

router.get('/editar/:id', function(req, res) {
   
   if(req.  session.curtisp!="f4ucorsair")
   return res.redirect("/login");

   var db = require("../db");
   var id=req.params.id;
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec((a,b)=>{
         res.send({id:id,nome:b.nome,url:b.logo,tickers:b.tickers,idInvesting:b.idInvesting});
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

function enviaNotificacao(tokens, msg, title){
   var db = require("../db");
   var message = {       
       notification:{
         title : title,
         body : msg
       }
     };
   // if(tokens=="all")
   //    db.FCM.send(message, function(err, response) {
   //       if(err){
   //          console.log('err--', err);
   //       }else {
   //          console.log('response-----', response);
   //       }
      
   //       });
   // else
      db.FCM.sendToMultipleToken(message, tokens, function(err, response) {
            if(err){
               console.log('err--', err);
            }else {
               console.log('response-----', response);
            }
         
      });
}

function call_jsdom(source, callback) {
    var jsdom = new JSDOM( source );

   // Set window and document from jsdom
   var { window } = jsdom;
  // var { document } = window;
   // Also set global window and document before requiring jQuery

   var $ =  require( 'jquery' )(window);
   var retorno = [];
   $("#results_box > table > tbody > tr").each(function (index,val){
      var data=$($(val).find("td")[0]).html();
      data=data.replace(".","").replace(".","").replace(".","");
      data=data.substr(4,4)+data.substr(2,2)+data.substr(0,2);
      var valor= $($(val).find("td")[1]).html();
      valor=valor.replace(",",".");
      retorno.push({_id:0,data:data,fechamento:parseFloat(valor)})
      //console.log(retorno[index]);      
   });
   var listaOrdenada=retorno.sort((a,b)=>{
      if ( a.data < b.data ){
          return -1;
        }
        if ( a.data > b.data ){
          return 1;
        }
        return 0;
  });
   return listaOrdenada;
}
module.exports = router;

