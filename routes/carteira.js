var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
router.post('/alertar', function(req, res) {
    var db = require("../db");
    var e=req.body.email;
    var id=req.body.empresa;
    
    var al=req.body.alertar=="true"?true:false;
    var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
    var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
    Users.findOne({email:e}).lean().exec((err2,user)=>{
        Tickers.findOne({idEmpresa:new mongo.ObjectId(id)}).exec((err,tic)=>{ 
          Users.findOneAndUpdate({_id:user._id, "carteira.id_empresa":tic.idEmpresa},{$set:{"carteira.$.alertar":al}},
          {upsert:true},
            function(err, doc){
            if (err)
                return res.send(500, { error: err });
                console.log("Post saved") ;
            return res.send("[{\"ok\":\"saved alertar\"}]");
            });
        });
        
    });
});
router.get('/alertas', function(req, res) {
    var db = require("../db");
    var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
    //Empresas.
});
router.post('/insereEmpresa', function(req, res) {
    var db = require("../db");
    var e=req.body.email;
    var id=req.body.empresa;
    var tick=req.body.ticker;
    var inicio=req.body.inicioAcomp;
    var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
    var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
    Users.findOne({email:e}).lean().exec((err2,user)=>{
        Tickers.findOne({idEmpresa:new mongo.ObjectId(id)}).exec((err,tic)=>{
            var p_entrada=0;
            if(tic!=null)
                p_entrada=getUltimaCotacao(tic);
            else
                return res.send(500, { error: err });
            
            Users.findOneAndUpdate({_id:user._id},{$push:{carteira:{id_empresa:new mongo.ObjectId(id),inicio_acomp:inicio, preco_entrada:p_entrada, alertar:true}}},
            function(err, doc){
            if (err)
                return res.send(500, { error: err }); 
            return res.send("[{\"ok\":\"saved\"}]");
            });
        });
        
    });
});
router.post('/removeEmpresa', function(req, res) {
    var db = require("../db");
    var e=req.body.email;
    var id=req.body.empresa;
   
    var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
    Users.findOne({email:e}).lean().exec((e,user)=>{
        var novaCarteira=[];
        user.carteira.forEach((item)=>{
            if(item.id_empresa.toString()!=id)
                novaCarteira.push(item);

        });
        Users.findOneAndUpdate({_id:user._id},{carteira:novaCarteira},
            {upsert:true}, function(err, doc){
              if (err)
               return res.send(500, { error: err });
              return res.send("[{\"ok\":\"saved\"}]");
            });
    });
});

    
/* GET Userlist page. */
router.get('/', function(req, res) {
   var db = require("../db");
   var e=req.query.email;   
   var pag=req.query.page; 
   var name=req.query.nome; 
   var tok=req.query.token; 
   var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
    if(e==undefined ||e==""){
        res.status(200).send([]);
        return;
    }   
    let limit=10;
    var skip=limit *(pag-1);
    Users.find({email:e,token:tok}).lean().exec(
      function (e, docs) {   
        if(docs[0]!=undefined && docs[0].idPlano==null){
            res.status(200).send([]);
            return;
        }
         var lista=[];
         docs.forEach((f)=>{   
                var index=0;
                if(f.carteira.length>0)            
                f.carteira.forEach((g)=>{                                        
                    Empresas.find({_id:g.id_empresa}).lean().exec(
                        function (s, em) {

                            var ultimacot=0;//getUltimaCotacao(em[0]);
                            var Tickers = db.Mongoose.model('tickers', db.TickersSchema, 'tickers');
                            Tickers.find({idEmpresa:new mongo.ObjectId(g.id_empresa)},{cotacoes:1}).lean().exec(
                               function (e, tick) { 
                                   if(tick.length>0){
                                var emp={
                                    id:g.id_empresa, 
                                    nome: em[0].nome,
                                    logo:em[0].logo,
                                    cotacao_atual:getCurrencyMode(getUltimaCotacao(tick[0])),
                                    ultimo_recomendacao:getUltimaRecomendacao(em[0])==undefined?"":getUltimaRecomendacao(em[0]).recomendacao,
                                    ultimo_alvo:getUltimaRecomendacao(em[0])==undefined?"":getCurrencyMode(getUltimoAlvo(getUltimaRecomendacao(em[0]))),
                                    atualizacao:getUltimaRecomendacao(em[0])==undefined?"":getDataFormatada(getUltimaRecomendacao(em[0]).data), 
                                    normalized: em[0].normalized,
                                    inicio_acompanhamento:g.inicio_acomp,
                                    preco_entrada:getCurrencyMode(g.preco_entrada),
                                    tickers:em[0].tickers,
                                    alertar:g.alertar
                                };
                                index++;
                                if(index>skip && (name==undefined || emp.normalized.includes(name.toLowerCase())  || name==""))
                                    lista.push(emp);
                                if(f.carteira.length==index)                            
                                    res.status(200).send(lista);  
                            }else                          
                                res.status(200).send([]);  
                            });
                        }
                    );                     
                })
                else
                    res.status(200).send(lista);
            }
        );
        if(docs.length==0){
            res.status(200).send([]);
            return;
        } //  res.render('index', { "userlist": docs });
    });
})


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
    if(cotacao==undefined)
    return 0;
    return cotacao.fechamento;
    
       
}
function getUltimaRecomendacao(em){
    return em.recomendacoes.sort((a,b)=>{
        if ( a.data < b.data ){
            return -1;
          }
          if ( a.data > b.data ){
            return 1;
          }
          return 0;
    })[em.recomendacoes.length-1];
}
function getUltimoAlvo(rec){
    var alvo="";
    if(rec.dados_recomendacao!=undefined)
    rec.dados_recomendacao.forEach((r)=>{
        if(r.label.toLowerCase()=="alvo")
        alvo=r.values;
    });
    return alvo;    
}
function getDataFormatada(valor){   
    var data=valor;//.toISOString().substr(0,10);
    if(data!=undefined)
    return data.substr(6,2)+"/"+data.substr(4,2)+"/"+data.substr(0,4)
    return "";
}
function getCurrencyMode(valor){
    var moeda=valor.toString().split('.');
    if(moeda[0]!=""){
    if(moeda.length==2)
        if(moeda[1].length==1)
            return "R$ "+moeda[0]+","+moeda[1]+"0"
        else
        return "R$ "+moeda[0]+","+moeda[1]
    else
        return "R$ "+moeda[0]+",00";
    }else
        return "";
}
module.exports = router;
