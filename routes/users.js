var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var http = require('request');
var packageName="com.mrdymac.sopro";
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
      
        if(b.idPlano!=null && b.idPlano!=undefined && b.idPlano!="" ){
        Planos.findOne({_id:b.idPlano}).lean().exec((c,plano)=>{
         
          if(plano!=null){
            if(b.validade==null)
            return;
            
            var hoje=Date.now();
            if(b.validade<new Date(hoje)){
            var url="https://www.googleapis.com/androidpublisher/v3/applications/"+packageName+"/purchases/subscriptions/"+plano.idGooglePlay+"/tokens/"+b.tokenCompra+"?access_token="+b.token;
            http.get(url,(erro,retorno)=>{
              retorno=ret;
                var json=JSON.parse(retorno);
                var novaData=new Date(json.expiryTimeMillis);
                var h=new Date(hoje);
                if (novaData>=new Date(hoje)){
                  
                  Users.findOneAndUpdate({email:b.email},{idPlano:plano._id, validade:novaData},function(e,u){
                    if (e) {
                      console.log("Error! " + err.message);
                      res.send([]); 
                    }
                    else {
                        console.log("Post saved");  
                        var p={
                          id:plano._id,
                          codigo:plano.codigo,
                          num_empresas:plano.num_empresas,
                          validade:novaData
                        };          
                        res.send([p]);   
                    }
                  });
                
                }else
                Users.findOneAndUpdate({email:b.email},{idPlano:null},function(e){
                  if (e) {
                    console.log("Error! " + err.message);
                    res.send([]);  
                  }
                  else {
                      console.log("Post saved"); 
                      res.send([]);  
                  }
                })
                
              });
                  
            }else{
              var p={
                id:b.idPlano,
                codigo:plano.codigo,
                num_empresas:plano.num_empresas,
                validade:b.validade
              };          
              res.send([p]);
            }
          
        }else
          res.send([]);      
        })
        
    }else{
      res.send([]);
    }
    
}
  );
  
});

router.post('/plano/assina', function(req, res, next) {
  var db = require("../db");
  var ema=req.body.email;
  var plano=req.body.plano;  
  var tok=req.body.token; 
  var tokc=req.body.tokenCompra; 
  var idNot=req.body.idNotification; 
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
  //verifica na api do google ou ios apple a situacao da assinatura
 
  Planos.findOne({$or:[{codigo:plano},{idGooglePlay:plano}]}).lean().exec((e,p)=>{
    var url="https://www.googleapis.com/androidpublisher/v3/applications/"+packageName+"/purchases/subscriptions/"+p.idGooglePlay+"/tokens/"+tokc+"?access_token="+tok;
    http.get(url,(erro,retorno)=>{
      retorno=ret;
      var json=JSON.parse(retorno);
      var novaData=new Date(json.expiryTimeMillis);
    Users.findOneAndUpdate({email:ema, token:tok},{$set:{idPlano:p._id,validade:novaData,tokenCompra:tokc}}).lean().exec(
      function (a,b){     
        if(a){
          return res.send([{'erro':'erro'}]);
        }else{
          if(!b){
            var user= new Users({
              _id:new mongo.ObjectId(),
              idNotification: idNot,
              email:ema,
              token: tok,
              tokenCompra:tokc,              
              carteira: [] ,
              idPlano: p._id,
              validade: novaData              
            });
            user.save();
            return res.send([{'ok':'saved'}]);
          }else
          return res.send([{'ok':'saved'}]);
        }
      });
    });
  });
 
  
});
function hojeToString(){
 var data = new Date(Date.now());
 var newDate = new Date(data.setTime( data.getTime() + 30 * 86400000 ));

 return newDate;//getFullYear().toString()+(newDate.getMonth()+1).toString()+newDate.getDate();
}

async function checaValidade(userPlano,  Model, plano) {
 
// var subscriptionId="android.test.purchased";
  var subscriptionId=plano.idGooglePlay;
 
  if(userPlano.validade==null)
  return;
  
  var hoje=Date.now();
  if(userPlano.validade<new Date(hoje)){
    //checa vencimento no google
    // http.post("https://accounts.google.com/o/oauth2/token",{
    //   "grant_type":"authorization_code",
    //   "code":code,
    //   "client_id":"201347483538-g8j81qrmt01av9vu34pm5j4nudk0ih74.apps.googleusercontent.com",
    //   "client_secret":"372r5rYQ9zfGaH4NZiy554Kp",
    //   "redirect_uri":"https://sopro-39ac3.firebaseapp.com/__/auth/handler",
      
    // }, function (errro,r){
    
    
 //   });
  }else{
    return true;
  }

  
}

var d=Date.now() + 30 * 86400000;
var ret="{\r\n  \"kind\": \"androidpublisher#subscriptionPurchase\","+
"\r\n  \"startTimeMillis\": "+d+",\r\n  \"expiryTimeMillis\": "+d+",\r\n "+
"\"autoResumeTimeMillis\": "+d+",\r\n  \"autoRenewing\": false,\r\n "
+" \"priceCurrencyCode\": \"\",\r\n  \"priceAmountMicros\": 10,\r\n"
+"  \"introductoryPriceInfo\": {\r\n    \"introductoryPriceCurrencyCode\": \"\",\r\n   "+
" \"introductoryPriceAmountMicros\": 10,\r\n    \"introductoryPricePeriod\": \"\",\r\n  "+
" \"introductoryPriceCycles\": 1\r\n  },\r\n  \"countryCode\": \"\",\r\n "+
" \"developerPayload\": \"\",\r\n  \"paymentState\": 1,\r\n "+
" \"cancelReason\": 1,\r\n  \"userCancellationTimeMillis\": "+d+",\r\n  "+
"\"cancelSurveyResult\": {\r\n    \"cancelSurveyReason\": 1,\r\n    "+
"\"userInputCancelReason\": \"\"\r\n  },\r\n  \"orderId\": \"\",\r\n  "+
"\"linkedPurchaseToken\": \"\",\r\n  \"purchaseType\": 1,\r\n  "+
"\"priceChange\": {\r\n    \"newPrice\": {\r\n      \"priceMicros\": \"\",\r\n "+
"\"currency\": \"\"\r\n    },\r\n    \"state\": 1\r\n  },\r\n "+
" \"profileName\": \"\",\r\n  \"emailAddress\": \"\",\r\n "+
" \"givenName\": \"\",\r\n  \"familyName\": \"\",\r\n  "+
"\"profileId\": \"\",\r\n  \"acknowledgementState\": 1\r\n}";
module.exports = router;
