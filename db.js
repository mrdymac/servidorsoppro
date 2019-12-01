var mongoose = require('mongoose');
// mongoose.connect('mongodb://adminmongo:Curtisp40@mongo_soprodb:27017/soprodb');
//  mongoose.connect('mongodb://adminmongo:Curtisp40@kamino.mongodb.umbler.com:45553/soprodb');
 mongoose.connect("mongodb+srv://adminmongo:Curtisp40@cluster0-qwok3.gcp.mongodb.net/soprodb?retryWrites=true&w=majority");
const Schema = mongoose.Schema;

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
    setor_id:String
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
   normalized: String
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
   
    cotacoes:[{data:String, fechamento: Number}],
    dividendos: [{data:String, valor: Number}]
},{collection:'tickers'}
);
module.exports = { Mongoose: mongoose, EmpresasSchema: empresasSchema, UsersSchema:usersSchema, PlanoSchema: planoSchema, TickersSchema:tickersSchema } 