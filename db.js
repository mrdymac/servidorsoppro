var mongoose = require('mongoose');
mongoose.connect('mongodb://adminmongo:Curtisp40@mongo_soprodb:27017/soprodb');
//  mongoose.connect('mongodb://adminmongo:Curtisp40@kamino.mongodb.umbler.com:45553/soprodb');
const Schema = mongoose.Schema;

var adminSchema = new mongoose.Schema({
    login: String,
    senha: String,
    token: String
}, { collection: 'admin' }
);

var empresasSchema = new mongoose.Schema({
    tickers: [{
        codigo: String,
        cotacoes:[{data:String, fechamento: String}],
        dividendo: [{data:String, valor: String}]
    },
    {

    }],
    nome: String,
    _id: Schema.Types.ObjectId,
    logo: String,  
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
    codigo: String
}, { collection: 'planos' }
);
module.exports = { Mongoose: mongoose, EmpresasSchema: empresasSchema, UsersSchema:usersSchema, PlanoSchema: planoSchema }