const express = require('express');
//const cors = require('cors');
const path = require('path');
const handlebars = require('express-handlebars').create({ defaultLayout:'main' });
const PORT = process.env.PORT || 5000;
const app = express();
const ingredients = require('./ingredients.json');
const recipes = require('./recipes.json');
// const { MongoClient } = require('mongodb');
// const uri = "mongodb+srv://kiserd:ntTnMUdRWyfn9uqc@cluster0.uyadt.mongodb.net/test?retryWrites=true&w=majority";
// const client = new MongoClient(uri);

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
//app.use(cors());
//app.use('/graphql', graphqlHTTP({schema, rootValue}));
//app.get('/playground', expressPlayground({ endpoint: '/graphql' }));

console.log(ingredients);
console.log(recipes);

app.get('/', (req , res, next) => {
  var context = [];
  for (var i = 0; i < recipes.length; i++) {
    context.push(recipes[i]["name"]);
  }
  console.log(context);
  res.render('choose_recipe', context);
});

app.get('/build_recipe', (req , res, next) => {
  res.render('build_recipe');
});

app.get('/my_recipes', (req , res, next) => {
  res.render('my_recipes');
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
