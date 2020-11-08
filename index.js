const express = require('express');
const path = require('path');
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

// main recipes 'database' :P
var recipes = [
    {"type": "breakfast", "userRecipe": false, "name": "Oatmeal", "ingredients": ["oats", "milk", "cranberries", "cinnamon", "sugar"]},
    {"type": "breakfast", "userRecipe": false, "name": "Scrambled Eggs", "ingredients": ["egg", "cheese", "bell pepper"]},
    {"type": "breakfast", "userRecipe": false, "name": "Breakfast Burrito", "ingredients": ["Tortilla", "Black Beans", "Eggs", "Onion", "Potato", "Sour Cream", "Salsa", "Avocado"]},
    {"type": "lunch", "userRecipe": false, "name": "Bean Burrito", "ingredients": ["beans", "cheese", "rice", "tortilla", "salsa"]},
    {"type": "lunch", "userRecipe": false, "name": "Chicken Teriyaki", "ingredients": ["rice", "chicken", "teriyaki sauce"]},
    {"type": "lunch", "userRecipe": false, "name": "Turkey Sandwich", "ingredients": ["turkey", "bread", "cheese", "mayonaise", "lettuce", "tomato"]},
    {"type": "lunch", "userRecipe": false, "name": "Waldorf Salad", "ingredients": ["mayonaise", "apples", "celery", "walnuts", "grapes", "Lemon", "lettuce"]},
    {"type": "lunch", "userRecipe": false, "name": "Pumpkin Soup", "ingredients": ["pumpkin", "olive oil", "onion", "vegetable broth", "coconut milk", "pumpkin seeds"]},
    {"type": "lunch", "userRecipe": false, "name": "Chicken Caesar Wrap", "ingredients": ["tortilla", "chicken", "lettuce", "tomato", "cheese", "caesar dressing", "crouton"]},
    {"type": "dinner", "userRecipe": false, "name": "Pepperoni Pizza", "ingredients": ["pork", "flour", "cheese", "tomato sauce"]},
    {"type": "dinner", "userRecipe": false, "name": "Cheese Pizza", "ingredients": ["flour", "cheese", "tomato sauce"]},
    {"type": "dinner", "userRecipe": false, "name": "Hamburger", "ingredients": ["ground beef", "ketchup", "bread", "lettuce", "tomato"]},
    {"type": "dinner", "userRecipe": false, "name": "Cheeseburger", "ingredients": ["ground beef", "ketchup", "bread", "lettuce", "tomato", "cheese"]},
    {"type": "dinner", "userRecipe": false, "name": "Mac and Cheese", "ingredients": ["pasta", "milk", "butter", "cheese"]},
    {"type": "dinner", "userRecipe": false, "name": "Spaghetti", "ingredients": ["pasta", "tomato sauce", "ground beef"]},
    {"type": "dinner", "userRecipe": false, "name": "Mostaccioli", "ingredients": ["pasta", "cheese", "egg", "pork", "tomato sauce"]},
    {"type": "dinner", "userRecipe": false, "name": "Meatloaf", "ingredients": ["ground beef", "egg", "ketchup", "Worcestshire Sauce", "Dijon Mustard", "onion", "breadcrumbs", "brown sugar"]}
]

// main ingredients 'database' :P
var ingredients = [
  {"type": "meat", "name": "ground beef", "impact": 13021},
  {"type": "meat", "name": "chicken", "impact": 2868},
  {"type": "meat", "name": "pork", "impact": 5736},
  {"type": "bread", "name": "pasta", "impact": 616},
  {"type": "bread", "name": "bread", "impact": 536},
  {"type": "bread", "name": "rice", "impact": 832},
  {"type": "vegetable", "name": "lettuce", "impact": 133},
  {"type": "vegetable", "name": "tomato", "impact": 108},
  {"type": "dairy", "name": "cheese", "impact": 3153},
  {"type": "dairy", "name": "butter", "impact": 7193},
  {"type": "dairy", "name": "egg", "impact": 2017},
  {"type": "sauce", "name": "ketchup", "impact": 178},
  {"type": "sauce", "name": "tomato sauce", "impact": 285}
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

app.get('/', (req , res, next) => {
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
  ingredients.push(new_recipe);
  res.render('make_substitution', context);
});

app.get('/build_recipe', (req , res, next) => {
  res.render('build_recipe');
});

app.get('/my_recipes', (req , res, next) => {
  var context = {};
  var recipeBook = require('./myRecipes.json');

  context["myRecipes"] = [];
  for (var i = 0; i < recipeBook.length; i++) {
    var recipe_dict = {};
    recipe_dict["name"] = recipeBook[i]["name"];
    recipe_dict["date"] = recipeBook[i]["date"];
    recipe_dict["impact"] = recipeBook[i]["impact"];
    context["myRecipes"].push(recipe_dict);
  }

  console.log(context);

  res.render('my_recipes', context);
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
