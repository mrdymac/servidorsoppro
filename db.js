var mongoose = require('mongoose');
// mongoose.connect('mongodb://adminmongo:Curtisp40@mongo_soprodb:27017/soprodb');
//  mongoose.connect('mongodb://adminmongo:havilandmosquito@kamino.mongodb.umbler.com:45553/soprodb');mongodb+srv://adminmongo:<password>@cluster0-qwok3.gcp.mongodb.net/test
// mongoose.connect("mongodb+srv://adminmongo:havilandmosquito@cluster0-qwok3.gcp.mongodb.net/soprodb?retryWrites=true&w=majority");
 mongoose.connect("mongodb+srv://dymac:curtisP40@cluster0-qwok3.gcp.mongodb.net/soprodb?retryWrites=true&w=majority");
const Schema = mongoose.Schema;
var  fcm = require ('fcm-notification') ; 
var Fcm = new fcm ('./path/to/privatekkey.json') ;
var adminSchema = new mongoose.Schema({
    login: String,
    senha: String,
    token: String
}, { collection: 'admin' }
);

var empresasSchema = new mongoose.Schema({
    nome: String,
    _id: Schema.Types.ObjectId,
    logo: String,  
    tickers:String,
    recomendacoes:Array,
    normalized:String,
    setor_id:String, 
    idInvesting:String
}, { collection: 'empresas' }
);

var usersSchema = new mongoose.Schema({
   _id:Schema.Types.ObjectId,
   idNotification: String,
   email:String,
   token: String,
   tokenCompra:String,
   senha: String,
   carteira: Array ,
   idPlano: String,
   validade: Date,
   normalized: String,
   n_indicacoes: Number,
   senha: String,
   ind_confirmado:Boolean
}, { collection: 'users' }
);
var planoSchema=new mongoose.Schema({
    _id:Schema.Types.ObjectId,
    num_empresas: String,
    codigo: String,
    idGooglePlay:String,
}, { collection: 'planos' }
);
var tickersSchema=new mongoose.Schema({
    _id:Schema.Types.ObjectId,
    idEmpresa:Schema.Types.ObjectId,    codigo: String,
    alertas:[{data:String, limite: Number, recomendacao:String, stop:Number}],
    cotacoes:[{data:String, fechamento: Number}],
    dividendos: [{data:String, valor: Number}]
},{collection:'tickers'}
);

var googleSchema=new mongoose.Schema(
    {
        type: String,
        project_id: String,
        private_key_id: String,
        private_key: String,
        client_email: String,
        client_id: String,
        auth_uri: String,
        token_uri: String,
        auth_provider_x509_cert_url:String,
        client_x509_cert_url: String
      }
,{collection:'google'}
);

module.exports = { Mongoose: mongoose, 
    EmpresasSchema: empresasSchema, UsersSchema:usersSchema, 
    PlanoSchema: planoSchema, TickersSchema:tickersSchema, GoogleSchema:googleSchema,
    FCM:Fcm } 