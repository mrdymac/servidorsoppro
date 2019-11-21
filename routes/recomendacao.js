var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var  fcm = require ('fcm-notification') ; 
var FCM = new fcm ('privatekey.json') ; 

/* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

router.post('/save',function(req,res){
    var db = require("../db");
    var recom=req.body.recomendacao;
    var id=req.body.empresa;  
    var url=req.body.url;
    var texto=req.body.texto;
    var dat=req.body.data;
    var disc=req.body.disclaimer;
    var tic=req.body.ticker;

    var indicadores=req.body.dados_indicadores;
    var rec_data=req.body.dados_recomendacao;
    var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
    var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
    Empresas.findOne({_id:new mongo.ObjectId(id)}).lean().exec((e,empresa)=>{
        var rec={
            _id:new mongo.ObjectId(),
            recomendacao:recom,
            url_podcast:url,
            texto:texto,
            autor:disc,
            data:dat,
            dados_indicadores:JSON.parse(indicadores),
            dados_recomendacao:JSON.parse(rec_data),
            ticker:tic
       };
       empresa.recomendacoes.push(rec);


       Empresas.findOneAndUpdate({_id:new mongo.ObjectId(id)},{recomendacoes:empresa.recomendacoes},
        {upsert:true}, function(err, doc){
          if (err)
           return res.send(500, { error: err });

        Users.find({"carteira.id_empresa":new mongo.ObjectId(id)}).lean().exec(function (errr,users){
            var t=[];
            users.forEach((user)=>{
                t.push(user.idNotification);
            });
            var ticker="";
            var alvo="";
           
            rec.dados_recomendacao.forEach((item)=>{
                if(item.label.toLowerCase()=="ticker")
                ticker=item.values.toUpperCase();                
                if(item.label.toLowerCase()=="alvo")
                alvo="alvo R$ "+getCurrencyMode(item.values);
            });
            enviaNotificacao(t, ticker+alvo ,  rec.recomendacao);
            return res.send("succesfully saved");
            });
        });
    });
    
 });

/* GET Userlist page. 
   GET BY ID,
   GET PAGINADA
   GET BY LIKE NOME
*/ 
router.get('/', function(req, res) {
   var db = require("../db");
   var id=req.query.id;   
   var idEmpresa=req.query.empresa;
   var inicioAcomp=req.query.inicioAcomp;
   var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
   var Empresas = db.Mongoose.model('empresas', db.EmpresasSchema, 'empresas');
   Empresas.find({_id: new mongo.ObjectID(idEmpresa)}).lean().exec(
       function (i,emps){
        var lista=[];
        var respondido=false;
        if(emps.length==0){
            res.send([]);
            respondido=true;
            return;
        }
            
           emps[0].recomendacoes.forEach(rec => {
               if(rec._id!=undefined){
                reco={
                   id:rec._id,
                   logo: emps[0].logo,
                   recomendacao:rec.recomendacao,
                   url_podcast:rec.url_podcast,
                   dados_recomendacao:rec.dados_recomendacao,
                   empresa:emps[0].nome,                   
                   idEmpresa:emps[0]._id, 
                   texto:rec.texto,
                   dados_indicadores:rec.dados_indicadores,
                   ticker:rec.ticker,
                   data: getDataFormatada(rec.data),
                   disclaimer: rec.autor,
                   inicio_acomp: inicioAcomp.substr(8,2)+"/"+inicioAcomp.substr(5,2)+"/"+inicioAcomp.substr(0,4)
               };
               
               lista.push(reco);
               if(id!=undefined && reco.id.toString()==id){
                    res.status(200).send([reco]);
                    respondido=true;
                    return;
               }  
            }             
           });
           if(id==undefined || id==""){
                var l=[];
               lista.forEach(item=>{
                    l.push({
                        id:item.id,
                        nome:item.empresa,
                        idEmpresa:item.idEmpresa,
                        ultimo_alvo:getCurrencyMode( item.dados_recomendacao[0].values),
                        ultimo_recomendacao: item.recomendacao,
                        atualizacao:item.data

                    })
               });
                res.status(200).send(l);
                respondido=true;
                return;
           }
           if(!respondido)
           res.status(200).send(lista);
       }
   );
})
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
function enviaNotificacao(tokens, msg, title){
    var message = {       
        notification:{
          title : title,
          body : msg
        }
      };
      FCM.sendToMultipleToken(message, tokens, function(err, response) {
          if(err){
              console.log('err--', err);
          }else {
              console.log('response-----', response);
          }
       
      })
}
   

 


module.exports = router;

