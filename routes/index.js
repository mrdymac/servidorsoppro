var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET Userlist page. */
// router.get('/', function(req, res) {
  
//          res.status(200).send(null);
//        //  res.render('index', { "userlist": docs });
  
// })

module.exports = router;
