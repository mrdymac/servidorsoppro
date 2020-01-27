var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var http = require('request');
// const keys = require('../path/to/api-4842214081322638001-491425-ae0051694b10.json');
var packageName="com.mrdymac.sopro";



const {JWT} = require('google-auth-library');
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
   var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
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
                var validade=new Date(Date.now() - 86400000);
                if(f.carteira.length>0 )            
                f.carteira.forEach((g)=>{                                        
                    Empresas.find({_id:g.id_empresa}).lean().exec(
                        async function (s, em) {
                            var Google = db.Mongoose.model('google', db.GoogleSchema, 'google');
                            var keys;
                            await Google.find().lean().exec((err,k)=>{
                              keys=k[0];
                            
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
                                    if(f.carteira.length==index){
                                        if(f.validade.getTime()<validade.getTime()){

                                            Planos.findOne({_id:f.idPlano}).lean().exec(async(erro,plan)=>{
                            
                                                if(plan.codigo!="GRATIS"){                                               
                                                    const client = new JWT({    
                                                        project_id:keys.project_id,
                                                        email:keys.client_email,
                                                        key:"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC3aV+4uQl7Nbq3\n1t3zycJHpCjfxOGT5+43n7uGuZdlqoDO1XNPytzgDqhaeim8tdZtAvcuzU4kQsnu\nUMRwCUG7iCqtCtxsdqsskfuohLWpu9i1XD37s8wXRo5Vm5rnzoQmoC02REKE/m5F\n9v+YrLfbj+mJF28LGJUeMrPpj8FUWW/N1f6XQ0gasazbJNOuoyivxEa11ILHNlSy\n18Q3oPVpsOLNShavqiEvrfxXmHFr8qQBS3T4qH2hlVX7i99h8UsUU2b+15k2HWBQ\nQFJBL2RTjTjXpB8IHP9Y7sv8gn9eRD3pmOs6/uW8aN9I7bOaUwjQQKkcu3Y0MHAp\nRpM6PlinAgMBAAECggEAGo1ZuzSmfRImiYNvYbddYIu7vca94BtdLuuj9U7G7oPu\n3oKjjUimuJUb+u/hPPLs1klDSaDqkBtPKn4Xgh9aRxuLuhNux7us75M5Zd3DLY2x\nQ3LVfQE8KZ51mp/Kntu/Npb3v08bJi/DUm5TSwyuF/jPQUva2otg2HH/U8UTovHf\nOIyOmsxcTMrEPB5l4cOgZTL+b+fka/hSm/75RdnG1fkiMl0uH18BWqRs+QdixoK0\nkbm9vqM7R9M9bqWTC4NIV7WVqhxup338atJWqUDIPJIu8429jX8RMvoflFTyMKBS\n2ESMosQ/R6b6J4v2Pxmzn7ugsij7BTItSI+e1lqLAQKBgQDyXFFohHSVKESqYtMt\nXs0FoJ0U2x5Uk2V5jWNbVCr9/BqPVljUUkmbRhnqw08cTJ/jLwhgmBZDqlpQhc8f\n9o5UU30Yn3lDxMnVemuNqfe/SJevwd58uwPaJiKdB+xRA/mQaQGrdz9TYPNV9YC1\n2AO6Zj6VOGR7WFq1L4w4iClvJwKBgQDBu8eLG+kRMT9/pPnJNGiccJEqGFk57OwH\nmIA9Hmp/myJjF4yqK02iQy8TL5ixafh3y5tjqMbYJN7nzOGa4gmOnpJKmmveBUfR\nAPJT3odkNmqbZSvpksJQrxHfeJIC/pnEt9ut1da0D50ZDAb1WQs6aI2jF+A5u2D0\nooznuW26gQKBgBAxoPLl3tBUl3n3Dns6mWJl3/kTxwwJqT8c9mWU0yaTYMbxExBk\nyyxH29V25WNTr19DtkCWCO7OhChbOIK/O7VgurwZc8XWcVIFUwhtMfOjCxegUZht\n+ozp/WgWrnCfXl6K1aS6XA3bLYcx1z7PRzh+OnJICVbAiZcPrUPdvT8DAoGAZJG7\nS36IpdEf+n5E4Osg5x0UbnrHTueru2GyKIgylt2Mo04lSm1CVtpzhI0vweGWB3Id\nz0VdO/Uf9csIzqNKfMvae3ngRxgMqPXJ1jntpNsOym5htlXmI4ZOS+jGO2G5p0Ie\newZH958nWUpCDnlT99UwuZp6Xt3jvfroFJ7Q1IECgYAf/2tHGnEO3828DL68fcWg\n4gX6VVNuJizHRe4CCkKlTzIQEBVmsYgcAM244QfHsRZcUezZ8KlgQwoqN1SHek4e\nHYG9yGoUuCm7hjmdDjW9qlSt1iFuNqNpDdQi+DlbNWyGP1sgb5+GfR3umobWwzZG\n2TvwoAxGzi1yKAtsLnXvyQ==\n-----END PRIVATE KEY-----\n",
                                                        scopes: ['https://www.googleapis.com/auth/androidpublisher']
                                                    });
                                                    if(f.tokenCompra==""){
                                                        res.status(200).send([{'status':'expirado'}]);
                                                        return ;
                                                    }
                                                    var url="https://www.googleapis.com/androidpublisher/v3/applications/"+packageName+"/purchases/subscriptions/"+plan.idGooglePlay+"/tokens/"+f.tokenCompra;
                                                    
                                                    await client.authorize((err, response) => {
                                                        
                                                        url+="?access_token="+response.access_token;
                                                        http.get(url,(erro,retorno)=>{
                                                            var json=JSON.parse(retorno.body);
                                                            var novaData=parseInt(json.expiryTimeMillis);
                                                            if (novaData>=validade.getTime()){                  
                                                                Users.findOneAndUpdate({email:f.email},{idPlano:plan._id, validade:new Date(novaData)},function(e,u){
                                                                    res.status(200).send(lista);  
                                                                });
                                                            }else{
                                                                Users.findOneAndUpdate({email:f.email},{idPlano:null, validade:null},function(e,u){
                                                                    res.status(200).send([{'status':'expirado'}]); 
                                                                });
                                                                
                                                            }
                                                        });
                                                    });
                                                } else{
                                                    res.status(200).send([{'status':'expirado'}]);
                                                 
                                                }
                                            });
                                        
                                            }else{
                                                res.status(200).send(lista);
                                            }
                                        }                            
                                    
                                    }else                          
                                        res.status(200).send([]);  
                                    });
                                });
                        }
                    );                     
                })
                else{
                    
                    res.status(200).send(lista);
                }
                    
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
    var reco=undefined;
    em.recomendacoes.sort((a,b)=>{
        if ( a.data < b.data ){
            return -1;
          }
          if ( a.data > b.data ){
            return 1;
          }
          return 0;
    });
    em.recomendacoes.forEach(element => {
        if(element.publicado){
            reco=element;            
        }
        
    });
    return reco;
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
