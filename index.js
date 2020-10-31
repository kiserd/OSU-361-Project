var express = require('express');
var path = require('path')
var handlebars = require('express-handlebars').create({ defaultLayout:'main' });
var PORT = process.env.PORT || 5000
var app = express();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/', (req , res, next) => {
  res.render('home');
});

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(PORT, function(){
  console.log(`Listening on: ${ PORT }; press Ctrl-C to terminate.`);
});
