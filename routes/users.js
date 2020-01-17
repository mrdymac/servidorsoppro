var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var http = require('request');
var mailer = require('nodemailer');
var crypto = require('crypto');
const keys = require('../path/to/api-4842214081322638001-491425-ae0051694b10.json');
var packageName="com.mrdymac.sopro";
/* GET users listing. */

var remetente=mailer.createTransport({host:"imap.gmail.com",service:"imap.gmail.com",port:465,secure:true,auth:{
  user:"noreply.soppro@gmail.com",
  pass:"Curtisp40!@#"
}});
const {JWT} = require('google-auth-library');

// storage
//   .getBuckets()
//   .then(results => {
//     const buckets = results[0];

//     console.log('Buckets:');
//     buckets.forEach(bucket => {
//       console.log(bucket.name);
//     });
//   })
//   .catch(err => {
//     console.error('ERROR:', err);
//   });




/**
 * This example directly instantiates a Compute client to acquire credentials.
 * Generally, you wouldn't directly create this class, rather call the
 * `auth.getClient()` method to automatically obtain credentials.
 */

// const jwtClient = new JWT(
//   keys.client_email,
//   null,
//   keys.private_key,
//   "https://www.googleapis.com/auth/androidpublisher",
//   null
// );





router.post("/signin",function(req,res){
  var db = require("../db");
  var e=req.body.email;
  var tok=req.body.token;
  var idNot=req.body.idNotification;
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.findOneAndUpdate({"email":e},{token:tok,idNotification:idNot},function(e,u){
     if (e) {
          console.log("Error! " + err.message);
          res.send("[{\"erro\":\"erro\"}]");
          return err;
      }
      else {
          console.log("Post saved");
        res.send([u]);
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
        Planos.findOne({_id:b.idPlano}).lean().exec(async (c,plano)=>{
         
          if(plano!=null){
            if(b.validade==null)
            return;
            
            var hoje=Date.now()-86400000;
            if(b.validade<new Date(hoje)){
            
            const client = new JWT({    
              project_id:keys.project_id,
              email:keys.client_email,
              key:keys.private_key,
              scopes: ['https://www.googleapis.com/auth/androidpublisher']
            });
            if(b.tokenCompra==""){
              res.send([]); 
              return;
            }
            var url="https://www.googleapis.com/androidpublisher/v3/applications/"+packageName+"/purchases/subscriptions/"+plano.idGooglePlay+"/tokens/"+b.tokenCompra;
            
           await client.authorize((err, response) => {
              
              url+="?access_token="+response.access_token;
              http.get(url,(erro,retorno)=>{
                
                if(b.codigo!='GRATIS'){
                  var json=JSON.parse(retorno.body);
                  var novaData=new Date(parseInt(json.expiryTimeMillis));
                }else{
                  novaData=Date.now() + 100000 * 86400000;
                }
               // var h=new Date(hoje);
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
                    });
                
              });
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
var tok="";


  // Generate the url that will be used for the consent dialog.
//   const authorizeUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: 'https://www.googleapis.com/auth/androidpublisher',
//  //   approval_prompt:'force',
//     response_type:'code',
//     login_hint:'sr.dyegomachado@gmail.com'
//   });


router.post('/plano/assina', function(req, res, next) {
  var db = require("../db");
  var packageName= 'com.mrdymac.sopro';
  var ema=req.body.email;
  var plano=req.body.plano;  
  var tok=req.body.token;
  var tokc=req.body.tokenCompra; 
  var planoAntigo=req.body.planoAntigo;  
  var tokcAnt=req.body.tokenCompraAntigo;
  var idNot=req.body.idNotification; 
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
  //verifica na api do google ou ios apple a situacao da assinatura
  //getToken(tokc,plano);
  Planos.findOne({$or:[{codigo:plano},{idGooglePlay:plano}]}).lean().exec(async (e,p)=>{
    var url="https://www.googleapis.com/androidpublisher/v3/applications/"+packageName+"/purchases/subscriptions/"+p.idGooglePlay+"/tokens/"+tokc;
    const client = new JWT({    
      project_id:keys.project_id,
      email:keys.client_email,
      key:keys.private_key,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    
   
    
   await client.authorize((err, response) => {
      
      url+="?access_token="+response.access_token;
    
    http.get(url,(erro,retorno)=>{
   //   retorno=ret;
   if(tokcAnt!=""&& tokcAnt!=undefined){
     if(planoAntigo=="1000")
      planoAntigo="ilimitado";
      var url_cancel="https://www.googleapis.com/androidpublisher/v3/applications/"+packageName+"/purchases/subscriptions/empr._."+planoAntigo+"/tokens/"+tokcAnt+":cancel?access_token="+response.access_token;
      http.post(url_cancel);
    }  
    if(p.codigo!='GRATIS'){
      var json=JSON.parse(retorno.body);
      var novaData=new Date(parseInt(json.expiryTimeMillis));
    }else{
      novaData=new Date(Date.now() + 100000 * 86400000);
    }
    var dados={idPlano:p._id,validade:novaData,tokenCompra:tokc};
    var numEmpPlano=p.num_empresas;
    Users.findOneAndUpdate({email:ema},{$set:dados}).lean().exec(
              function (a,b){     
        if(a){
          return res.send([{'erro':'erro'}]);
        }else{
          if(!b){
            var user= new Users({
              _id:new mongo.ObjectId(),
              idNotification: idNot,
              email:ema,
              token: null,
              tokenCompra:tokc,              
              carteira: [] ,
              idPlano: p._id,
              validade: novaData ,
              n_indicacoes:0,
              ind_confirmado:false          
            });
            user.save();
            return res.send([{'ok':'saved'}]);
          }else{
            if(b.carteira.length>numEmpPlano){              
              Users.findOneAndUpdate({email:ema},{$set:{carteira:b.carteira.slice(0,numEmpPlano)}}).lean().exec();              
            }
            return res.send([{'ok':'saved'}]);
          }
        }
      });
    });
  });
  });
 
  
});
router.get("/cadastro",function(req,res){
  var db = require("../db");
  var idIndicacao=req.query.id;
 if (idIndicacao==null)
    idIndicacao="";
  
        res.render('cadastro',{idIndicacao:idIndicacao});
      
  
});

router.post("/cadastro/save",function(req,res){
  var db = require("../db");
  var email=req.body.email;
  var idIndicacao=req.body.idIndicacao;
  var senha=req.body.pass;  
  var confirmacao=req.body.passConfirm;
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.find({"email":email},function(err,user){
    if(err || email==""){
         res.send("[{\"error\":\"erro\"}]");
         return err;
    }
    if (user.length>0) {
        res.send("[{\"found\":\"userFound\"}]");          
     }
    else {
          var user= new Users({
            _id:new mongo.ObjectId(),        
            email:email,
            senha:senha,
            n_indicacoes:0,
            token: null,
            tokenCompra:null,              
            carteira: [] ,
            idPlano:null,
            validade:null,
            ind_confirmado:false
          });
          user.save();
         
         
          console.log("Post saved");
          if(idIndicacao!=""){
            var destino={
              from:"noreply.soppro@gmail.com",
              to:"sr.dyegomachado@gmail.com",
              subject:"Soppro",
              text:"http://localhost:3000/users/confirma?id="+user._id+"&ind="+idIndicacao
            }
            remetente.sendMail(destino,(error)=>{
                if(error)
                  console.log(error);
                else 
                  console.log("email enviado");
            });
          }
          res.send("[{\"ok\":\"saved\"}]"); //,\"email\":\""+email+"\",\"token\":\"\"
      }
  });
});
router.get("/sucess",function(req,res){
  res.render("sucess",{emailUser:req.query.user})
});
router.get("/confirma",function(req,res){
  var db = require("../db");
  var id=req.query.id;  
  var ind=req.query.ind; 
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  var Planos = db.Mongoose.model('planos', db.PlanoSchema, 'planos');
  Users.findOneAndUpdate({_id:new mongo.ObjectId(id),ind_confirmado:false},{ind_confirmado:true},function(err,u){
    if(u){
      Users.findOne({_id:new mongo.ObjectId(ind)},function(errr,uind){
        if(uind){
          uind.n_indicacoes=uind.n_indicacoes+1;
          if(uind.n_indicacoes>1){
            Planos.find({$or:[{codigo:"EMPR5"},{codigo:"GRATIS"}]},(erp,p)=>{
              var planoUser=p[0]._id.toString();
              if(uind.idPlano!=null && uind.idPlano==p[1]._id.toString())
                planoUser=p[1]._id.toString();
              var plano5=p[0];
              
              if(plano5.codigo!="EMPR5")
                plano5=p[1];
              var  novaData=Date.now() + 30 * 86400000;
              if(uind.idPlano==null || planoUser.codigo=="GRATIS")
              Users.findOneAndUpdate({_id:new mongo.ObjectId(ind)},{n_indicacoes:0,validade:novaData,idPlano:plano5._id.toString()},(erind,uindd)=>{
                if(uindd)
                  console.log("att");
              });
            });            
          }else{
            Users.findOneAndUpdate({_id:new mongo.ObjectId(ind)},{n_indicacoes:uind.n_indicacoes},(erind,uindd)=>{
              if(uindd)
                console.log("att");
            });
          }
        }
      });
    }
    
  });

  res.render("sucess",{emailUser:req.query.user})
});
router.post("/login",function(req,res){
  var db = require("../db");
  var email=req.body.user.trim();  
  var pass=req.body.pass;  
  
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.findOne({"email":email,"senha":pass},function(err,user){
    var name = user._id+Date.now()+"supersecretmrdymac!@#$%¨&*(";
    var hash = crypto.createHash('md5').update(name).digest('hex');
    if(user)
        res.send("[{\"ok\":\"success\",\"email\":\""+email+"\",\"token\":\""+hash+"\"}]");
    else 
        res.send("[{\"invalid\":\"invalido\"}]");
  });
});
router.get("/esquecisenha",function(req,res){    
    res.render("esquecisenha");
});
router.post("/cadastro/enviarsenha",function(req,res){  
  var db = require("../db");
  var email=req.body.email; 
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.findOne({email:email},function(e,u){
    if(u){
      var destino={
        from:"noreply.soppro@gmail.com",
        to:email,
        subject:"Soppro",
        text:"http://localhost:3000/users/cadastro/alterarsenha?token="+u.token+"&id="+u._id.toString()
      }
      remetente.sendMail(destino,(error)=>{
          if(error){
            console.log(error);
            res.send("[{\"error\":\"erro\"}]");
          }
          else {
            console.log("email enviado");
            res.send("[{\"email\":\""+email+"\"}]");
          }
      });
    }else{
       res.send("[{\"notFound\":\"inexistente\"}]");
    }
      
  });
  
});
router.get("/emailEnviado",function(req,res){    
  res.render("emailEnviado",{email:req.query.email});
});
router.get("/cadastro/alterarsenha",function(req,res){   
  var db = require("../db");
  var token=req.query.token;  
  var id=req.query.id;
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.findOne({_id:new mongo.ObjectID(id),token:token},function(e,u){
    if(u)
      res.render("alterarsenha",{id:id});
    else
      res.render("linkquebrado");
  });
});
router.post("/cadastro/alterarsenha",function(req,res){    
  var db = require("../db");
  var pass=req.body.pass;  
  var id=req.body.id;
  var Users = db.Mongoose.model('users', db.UsersSchema, 'users');
  Users.findOneAndUpdate({_id:new mongo.ObjectID(id)},{senha:pass},function(err,u){
    if(err)
      res.send("[{\"error\":\"error\"}]");
    else if(u)
      res.send("[{\"ok\":\"ok\"}]");
    else
      res.send("[{\"error\":\"error\"}]");
  });
});
router.get("/cadastro/senhaalterada",function(req,res){    
  res.render("senhaalterada",{email:req.query.email});
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

function getAuthenticatedClient() {
  return new Promise((resolve, reject) => {
    // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
    // which should be downloaded from the Google Developers Console.
   

    //const r = oAuth2Client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens);
    console.info('Tokens acquired.');
    // Open an http server to accept the oauth callback. In this simple example, the
    // only request to our webserver is to /oauth2callback?code=<code>
    // const server = http
    //   .createServer(async (req, res) => {
    //     try {
    //       if (req.url.indexOf('/oauth2callback') > -1) {
    //         // acquire the code from the querystring, and close the web server.
    //         const qs = new url.URL(req.url, 'http://localhost:3000')
    //           .searchParams;
    //         const code = qs.get('code');
    //         console.log(`Code is ${code}`);
    //         res.end('Authentication successful! Please return to the console.');
    //         server.destroy();

    //         // Now that we have the code, use that to acquire tokens.
    //         const r = await oAuth2Client.getToken(code);
    //         // Make sure to set the credentials on the OAuth2 client.
    //         oAuth2Client.setCredentials(r.tokens);
    //         console.info('Tokens acquired.');
    //         resolve(oAuth2Client);
    //       }
    //     } catch (e) {
    //       reject(e);
    //     }
    //   })
    //   .listen(3000, () => {
    //     // open the browser to the authorize url to start the workflow
    //     //opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
    //   });
   // destroyer(server);
  });
}


// var d=Date.now() + 30 * 86400000;
// var ret="{\r\n  \"kind\": \"androidpublisher#subscriptionPurchase\","+
// "\r\n  \"startTimeMillis\": "+d+",\r\n  \"expiryTimeMillis\": "+d+",\r\n "+
// "\"autoResumeTimeMillis\": "+d+",\r\n  \"autoRenewing\": false,\r\n "
// +" \"priceCurrencyCode\": \"\",\r\n  \"priceAmountMicros\": 10,\r\n"
// +"  \"introductoryPriceInfo\": {\r\n    \"introductoryPriceCurrencyCode\": \"\",\r\n   "+
// " \"introductoryPriceAmountMicros\": 10,\r\n    \"introductoryPricePeriod\": \"\",\r\n  "+
// " \"introductoryPriceCycles\": 1\r\n  },\r\n  \"countryCode\": \"\",\r\n "+
// " \"developerPayload\": \"\",\r\n  \"paymentState\": 1,\r\n "+
// " \"cancelReason\": 1,\r\n  \"userCancellationTimeMillis\": "+d+",\r\n  "+
// "\"cancelSurveyResult\": {\r\n    \"cancelSurveyReason\": 1,\r\n    "+
// "\"userInputCancelReason\": \"\"\r\n  },\r\n  \"orderId\": \"\",\r\n  "+
// "\"linkedPurchaseToken\": \"\",\r\n  \"purchaseType\": 1,\r\n  "+
// "\"priceChange\": {\r\n    \"newPrice\": {\r\n      \"priceMicros\": \"\",\r\n "+
// "\"currency\": \"\"\r\n    },\r\n    \"state\": 1\r\n  },\r\n "+
// " \"profileName\": \"\",\r\n  \"emailAddress\": \"\",\r\n "+
// " \"givenName\": \"\",\r\n  \"familyName\": \"\",\r\n  "+
// "\"profileId\": \"\",\r\n  \"acknowledgementState\": 1\r\n}";
module.exports = router;

