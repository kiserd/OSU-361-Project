const express = require('express');
const session = require('express-session');
const path = require('path');
const users = require('./users.json') 
const fs = require('fs')
const handlebars = require('express-handlebars').create({ defaultLayout:'main' });
const PORT = process.env.PORT || 5000;
const app = express();
// var ingredients = require('./ingredients.json');
// var recipes = require('./recipes.json');


app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret:'secret',
  resave:true,
  saveUninitialized:true
}))
app.use(function(req, res, next){
  res.locals.session = req.session;
  console.log(res.locals.session)
  next();
})

// main recipes 'database' :P
var recipes = [
    {"type": "breakfast", "userRecipe": false, "name": "Oatmeal", "ingredients": ["oat", "milk", "cranberry", "cinnamon", "sugar"]},
    {"type": "breakfast", "userRecipe": false, "name": "Scrambled Eggs", "ingredients": ["egg", "cheese", "bell pepper"]},
    {"type": "breakfast", "userRecipe": false, "name": "Breakfast Burrito", "ingredients": ["tortilla", "bean", "egg", "onion", "potato", "sour cream", "salsa", "avocado"]},
    {"type": "lunch", "userRecipe": false, "name": "Bean Burrito", "ingredients": ["beans", "cheese", "rice", "tortilla", "salsa"]},
    {"type": "lunch", "userRecipe": false, "name": "Chicken Teriyaki", "ingredients": ["rice", "chicken", "teriyaki sauce"]},
    {"type": "lunch", "userRecipe": false, "name": "Turkey Sandwich", "ingredients": ["turkey", "bread", "cheese", "mayonaise", "lettuce", "tomato"]},
    {"type": "lunch", "userRecipe": false, "name": "Waldorf Salad", "ingredients": ["mayonaise", "apple", "celery", "walnut", "grapes", "Lemon", "lettuce"]},
    {"type": "lunch", "userRecipe": false, "name": "Pumpkin Soup", "ingredients": ["pumpkin", "olive oil", "onion", "vegetable broth", "coconut milk", "pumpkin seed"]},
    {"type": "lunch", "userRecipe": false, "name": "Chicken Caesar Wrap", "ingredients": ["tortilla", "chicken", "lettuce", "tomato", "cheese", "caesar dressing", "crouton"]},
    {"type": "dinner", "userRecipe": false, "name": "Pepperoni Pizza", "ingredients": ["pork", "flour", "cheese", "tomato sauce"]},
    {"type": "dinner", "userRecipe": false, "name": "Cheese Pizza", "ingredients": ["flour", "cheese", "tomato sauce"]},
    {"type": "dinner", "userRecipe": false, "name": "Hamburger", "ingredients": ["ground beef", "ketchup", "bread", "lettuce", "tomato"]},
    {"type": "dinner", "userRecipe": false, "name": "Cheeseburger", "ingredients": ["ground beef", "ketchup", "bread", "lettuce", "tomato", "cheese"]},
    {"type": "dinner", "userRecipe": false, "name": "Mac and Cheese", "ingredients": ["pasta", "milk", "butter", "cheese"]},
    {"type": "dinner", "userRecipe": false, "name": "Spaghetti", "ingredients": ["pasta", "tomato sauce", "ground beef"]},
    {"type": "dinner", "userRecipe": false, "name": "Mostaccioli", "ingredients": ["pasta", "cheese", "egg", "pork", "tomato sauce"]},
    {"type": "dinner", "userRecipe": false, "name": "Meatloaf", "ingredients": ["ground beef", "egg", "ketchup", "worcestshire wauce", "mustard", "onion", "bread", "brown sugar"]}
]

// main ingredients 'database' :P
var ingredients = [
  {"type": "meat", "name": "ground beef", "impact": 13021},
  {"type": "meat", "name": "chicken", "impact": 2868},
  {"type": "meat", "name": "pork", "impact": 5736},
  {"type": "bread", "name": "pasta", "impact": 616},
  {"type": "bread", "name": "bread", "impact": 536},
  // logan found article showing tortilla as significantly higher than bread
  {"type": "bread", "name": "tortilla", "impact": 2500},
  {"type": "bread", "name": "rice", "impact": 832},
  {"type": "vegetable", "name": "lettuce", "impact": 133},
  {"type": "vegetable", "name": "tomato", "impact": 108},
  {"type": "vegetable", "name": "avocado", "impact": 2623},
  {"type": "vegetable", "name": "corn", "impact": 1611},
  {"type": "vegetable", "name": "green bean", "impact": 741},
  {"type": "vegetable", "name": "broccoli", "impact": 381},
  {"type": "vegetable", "name": "carrot", "impact": 261},
  {"type": "vegetable", "name": "potato", "impact": 381},
  {"type": "vegetable", "name": "pumpkin", "impact": 441},
  {"type": "vegetable", "name": "onion", "impact": 780},
  {"type": "vegetable", "name": "bell pepper", "impact": 379},
  // logan made these seasonings up... educated guess
  {"type": "seasoning", "name": "cinnamon", "impact": 5},
  {"type": "seasoning", "name": "sugar", "impact": 10},
  {"type": "dairy", "name": "cheese", "impact": 3153},
  {"type": "dairy", "name": "butter", "impact": 7193},
  {"type": "dairy", "name": "egg", "impact": 2017},
  {"type": "milk", "name": "milk", "impact": 120},
  {"type": "milk", "name": "rice milk", "impact": 75},
  {"type": "milk", "name": "soy milk", "impact": 5},
  {"type": "milk", "name": "oat milk", "impact": 10},
  {"type": "milk", "name": "almond milk", "impact": 80},
  {"type": "sauce", "name": "ketchup", "impact": 178},
  {"type": "sauce", "name": "tomato sauce", "impact": 285},
  {"type": "sauce", "name": "mayonaise", "impact": 535},
  {"type": "fruit", "name": "apricot", "impact": 1701},
  {"type": "fruit", "name": "blueberry", "impact": 641},
  {"type": "fruit", "name": "cranberry", "impact": 209},
  {"type": "fruit", "name": "apple", "impact": 1172},
  {"type": "grain", "name": "oat", "impact": 846},
  {"type": "nut", "name": "almond", "impact": 21284},
  {"type": "nut", "name": "walnut", "impact": 12273},
  {"type": "bean", "name": "soy bean", "impact": 2834}
]

function getImpactByRecipeIngredient(recipe) {
  var impacts = [];
  for (var i = 0; i < recipes.length; i++) {
    if (recipes[i]["name"] == recipe) {
      for (var j = 0; j < recipes[i]["ingredients"].length; j++) {
        for (var k = 0; k < ingredients.length; k++) {
          if (ingredients[k]["name"] == recipes[i]["ingredients"][j]) {
            var ingDict = {}
            ingDict["name"] = recipes[i]["ingredients"][j];
            ingDict["impact"] = ingredients[k]["impact"];
            impacts.push(ingDict);
          }
        }
      }
    }
  }
  return impacts
}

function subIngredient(ingredients, ingredient, substitute) {
  for (var i = 0; i < ingredients.length; i++) {
    if (ingredients[i] == ingredient) {
      ingredients[i] = substitute;
    }
  }
}

function getIngredientsByRecipe(recipe) {
  var ingredients = [];
  for (var i = 0; i < recipes.length; i++) {
    if (recipes[i]["name"] == recipe) {
      for (var j = 0; j < recipes[i]["ingredients"].length; j++) {
        ingredients.push(recipes[i]["ingredients"][j]);
      }  
    }
  }
  return ingredients;
}

function getTypeByRecipe(recipe) {
  var type = null;
  for (var i = 0; i < recipes.length; i++) {
    if (recipes[i]["name"] == recipe) {
      type = recipes[i]["type"];
    }
  }
  return type;
}

function getSubstitutesByIngredient(ingredient) {
  var type = null;
  var impact = null;
  for (var i = 0; i < ingredients.length; i++) {
    if (ingredients[i]["name"] == ingredient) {
      type = ingredients[i]["type"];
      impact = ingredients[i]["impact"];
    }
  }
  var substitutes = [];
  for (var i = 0; i < ingredients.length; i++) {
    if (ingredients[i]["type"] == type && ingredients[i]["impact"] < impact) {
      var temp_dict = {};
      temp_dict["name"] = ingredients[i]["name"];
      temp_dict["impact"] = ingredients[i]["impact"];
      substitutes.push(temp_dict);
    }
  }
  return substitutes;
}

function get_rand_rgb(){
  const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const r = randomBetween(0, 255);
  const g = randomBetween(0, 255);
  const b = randomBetween(0, 255);
  const rgb = `rgba(${r},${g},${b}, 1)`; // Collect all to a css color string
  return rgb
}

app.get('/', (req , res, next) => {
  res.render('homepage');
});

app.get('/choose_recipe', (req , res, next) => {
  var context = {};
  context['recipes'] = []
  for (var i = 0; i < recipes.length; i++) {
    context['recipes'].push(recipes[i]["name"]);
  }
  console.log(context);
  res.render('choose_recipe', context);
});

app.get('/view_ingredients', (req , res, next) => {
  var context = {};
  var recipe = req.query["recipe"];
  context["recipe"] = recipe;
  context["ingredients"] = getImpactByRecipeIngredient(recipe);
  res.render('view_ingredients', context);
});

app.get('/view_substitutes', (req, res, next) => {
  var context = {};
  var ingredient = req.query["ingredient"];
  var recipe = req.query["recipe"];
  context["recipe"] = recipe;
  context["ingredient"] = ingredient;
  context["substitutes"] = getSubstitutesByIngredient(ingredient);
  res.render('view_substitutes', context);
});

app.get('/make_substitution', (req, res, next) => {
  var context = {};
  var substitute = req.query["substitute"];
  var ingredient = req.query["ingredient"];
  var recipe = req.query["recipe"];
  var name = req.query["new_name"];
  var ingredients = getIngredientsByRecipe(recipe);
  subIngredient(ingredients, ingredient, substitute);
  var type = getTypeByRecipe(recipe);
  var new_recipe = {};
  new_recipe["type"] = type;
  new_recipe["userRecipe"] = true;
  new_recipe["name"] = name;
  new_recipe["ingredients"] = ingredients;
  recipes.push(new_recipe);
  res.render('make_substitution', context);
});

app.get('/build_recipe', (req , res, next) => {
  res.render('build_recipe');
});

app.get('/my_recipes', (req , res, next) => {
  var context = {};
  var recipeBook = require('./myRecipes.json');

  if(req.query["recipe"])
  {
    var recipe = req.query["recipe"];

    var addRecipe = {}
    addRecipe.name = recipe;
    var today = new Date();
    var date = (today.getMonth()+1)+'-'+today.getDate()+'-'+today.getFullYear();
    addRecipe.date = date.toString();
    addRecipe.impact = 0;

    var arrayOfObjects;

    fs.readFile('./myRecipes.json', 'utf-8', function(err, data) {
      if (err) throw err
    
      arrayOfObjects = JSON.parse(data)
      console.log(arrayOfObjects);
      arrayOfObjects.savedRecipes.push(addRecipe);
      console.log(arrayOfObjects);
    })

    //fs.writeFile('./myRecipes.json', JSON.stringify(arrayOfObjects), 'utf-8', function(err) {
    //  if (err) throw err
    //  console.log('Done!')
    //})

    context["myRecipes"] = [];
    for (var i = 0; i < recipeBook["savedRecipes"].length; i++) {
      var recipe_dict = {};
      recipe_dict["name"] = recipeBook["savedRecipes"][i]["name"];
      recipe_dict["date"] = recipeBook["savedRecipes"][i]["date"];
      recipe_dict["impact"] = recipeBook["savedRecipes"][i]["impact"];
      context["myRecipes"].push(recipe_dict);
    }
  }

  else{
    context["myRecipes"] = [];
    for (var i = 0; i < recipeBook["savedRecipes"].length; i++) {
      var recipe_dict = {};
      recipe_dict["name"] = recipeBook["savedRecipes"][i]["name"];
      recipe_dict["date"] = recipeBook["savedRecipes"][i]["date"];
      recipe_dict["impact"] = recipeBook["savedRecipes"][i]["impact"];
      context["myRecipes"].push(recipe_dict);
    }
  }

  res.render('my_recipes', context);
});

var register = async function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  if(users[username] != null){
    res.send({
      "code":409,
      "failed":"Username already registered"
    })
  }else{
    users[username] = {"username":username, "password":password, "color":get_rand_rgb()};
    fs.writeFile('./users.json', JSON.stringify(users), err=>{
      if(err){
        throw err;
      } else {
        req.session.loggedin = true;
        req.session.user = users[username];
        res.redirect('/');
      }
    }) 
  }
}

var login = async function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  if(users[username] == null){
    res.send({
      "code":206,
      "success":"Invalid E-mail"
    }) 
  } else if(users[username].password != password){
    res.send({
      "code":204,
      "success":"Bad Credentials, Please Try Again"
    })
  } else{
    req.session.loggedin = true;
    req.session.user = users[username];
    res.redirect('/');
  }
}

app.post('/register', register);
app.post('/login', login);

app.get('/logout', function(req, res, next){
  if(req.session){
    req.session.destroy(function(err){
      if(err){
        return next(err);
      } else{
        return res.redirect('/');
      }
    })
  }
})

app.get('/new_user', function(req, res, next){
  res.render('new_user')
})

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
