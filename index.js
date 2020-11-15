const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs')
const handlebars = require('express-handlebars').create({ defaultLayout:'main' });
const PORT = process.env.PORT || 5000;
const app = express();
const {Pool} = require('pg')
const pool = new Pool({
  connectionString: "postgres://qxtetfyciswbov:31134b5dcc9de86cf5f8f815858b9140d07cff36a764dfb7b90424c6804a5e38@ec2-3-211-176-230.compute-1.amazonaws.com:5432/d3u5cr9kigu0n5",
  ssl: {
    rejectUnauthorized: false
  }
});

// Logan testing out some queries
const querySelectAllSystemRecipes =       `SELECT * FROM recipes WHERE user_recipe = false`;
const querySelectIngredientById =         'SELECT * FROM ingredients WHERE id = $1';
const querySelectRecipeById =             'SELECT * FROM recipes WHERE id = $1';
const querySelectIngredientsByRecipeId =  `SELECT i.* 
                                           FROM recipes AS r
                                           LEFT JOIN recipes_ingredients AS ri
                                           ON (r.id = ri.recipes_id)
                                           LEFT JOIN ingredients AS i
                                           ON ri.ingredients_id = i.id
                                           WHERE r.id = $1`;

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
  // Testing database 
  pool.query(`SELECT * FROM Ingredients;`, (err, res) => {
    if (err) {
        console.log("Error - Failed to select all from Ingredients");
        console.log(err);
    }
    else{
        //console.log(res.rows);
    }
  });
  res.render('homepage');
});

app.get('/choose_recipe', (req , res, next) => {
  var context = {};
  pool.query(querySelectAllSystemRecipes, (err, {rows}) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    RECIPES_TO_SEND = new Map()
    for(let row of rows){
      row.in_book = false;
      RECIPES_TO_SEND.set(row.id, row);
    }
    if(req.session.loggedin){
      pool.query('SELECT recipes_id FROM users_recipes WHERE users_id=$1', [req.session.user.id], (err, {rows})=>{
        if(err) {
          console.log(err)
          res.send(false);
        }
        for(let row of rows){
          let recipe = RECIPES_TO_SEND.get(row.recipes_id);
          recipe.in_book = true;
          RECIPES_TO_SEND.set(row.recipes_id, recipe);
        }
        context["recipes"] = makeRecipeArray(RECIPES_TO_SEND);
        res.render('choose_recipe', context)
      })
    } else{
      context["recipes"] = makeRecipeArray(RECIPES_TO_SEND);
      res.render('choose_recipe', context)
    }
  });
});

app.get('/get_ingredients', (req, res, next)=>{
  var context = {};
  if(req.query["recipes_id"]){
    pool.query('SELECT * FROM ingredients WHERE id IN (SELECT ingredients_id FROM recipes_ingredients WHERE recipes_id=$1)',[req.query["recipes_id"]], (err, {rows})=>{
      if(err) console.log(err)
      context.recipes_id = req.query["recipes_id"];
      context.ingredients = rows
      res.send(context);
    })
  }
})

function makeRecipeArray(RECIPES_TO_SEND){
  return Array.from(RECIPES_TO_SEND.values()).sort(inRecipeBookCompare);
}

function inRecipeBookCompare(book1, book2){
  return book1.in_book - book2.in_book
}

app.get('/add_recipe', (req, res, next)=>{
  if(req.query["recipe_id"] && req.session.loggedin){
    var addRecipeQuery = {
      text: `INSERT INTO users_recipes (users_id, recipes_id, date) VALUES ($1, $2, to_timestamp(${Date.now() / 1000.0}))
            ON CONFLICT ON CONSTRAINT users_recipes_pkey DO UPDATE SET date = EXCLUDED.date;`,
      values: [req.session.user.id, req.query["recipe_id"]]
    }
    pool.query(addRecipeQuery, (err, result)=>{
      if(err){
        console.log(err)
        res.send(false);
      } 
      else{
        var getRecipeQuery = {
          text: `SELECT * FROM recipes WHERE id=$1`,
          values: [req.query["recipe_id"]]
        }
        pool.query(getRecipeQuery, (err, {rows})=>{
          if(err) console.log(err)
          else{
            res.send(rows[0]);
          }
        })
      }
    })
  }else{
    res.send(false);
  }
})

app.get('/get_user_recipes', (req, res, next)=>{
  if(req.session["user"] == null){
    res.send(false);
  }else{
    pool.query('SELECT recipes_id FROM users_recipes WHERE users_id=$1', [req.session.user.id], (err, {rows})=>{
      if(err) {
        console.log(err)
        res.send(false);
      }
      res.send(rows);
    })
  }
  
})

app.get('/view_ingredients', (req , res, next) => {
  var context = {};
  var recipe_id = req.query["recipe_id"];
  // get ingredients associated with recipe
  pool.query(querySelectIngredientsByRecipeId, [recipe_id], (err, result) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    context["ingredients"] = result.rows;
    // get recipe info to provide to user
    pool.query(querySelectRecipeById, [recipe_id], (err, result) => {
      if (err) {
        return console.error('Error executing query', err.stack);
      }
      context["recipe"] = result.rows[0];
      res.render('view_ingredients', context);
    });
  });
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
  context["new_recipe"] = name;
  res.render('make_substitution', context);
});

app.get('/build_recipe', (req , res, next) => {
  res.render('build_recipe');
});

app.get('/my_recipes', (req , res, next) => {
  var context = {};
  if(req.session["user"] == null){
    res.send("Error! Please log-in!")
  } else{
    var getRecipesQuery = {
      text: 'SELECT users_recipes.*, recipes.*, SUM(impact) as recipes_impact FROM recipes_ingredients '+
            'JOIN ingredients ON recipes_ingredients.ingredients_id=ingredients.id '+
            'JOIN users_recipes ON recipes_ingredients.recipes_id=users_recipes.recipes_id '+
            'JOIN recipes ON users_recipes.recipes_id=recipes.id '+
            'WHERE users_recipes.users_id=$1 '+
            'GROUP BY users_recipes.recipes_id, users_recipes.users_id, recipes.id ',
      values: [req.session.user.id]
    }
    if(req.query["recipe_id"]){
      var addRecipeQuery = {
        text: `INSERT INTO users_recipes (users_id, recipes_id, date) VALUES ($1, $2, to_timestamp(${Date.now() / 1000.0}))
              ON CONFLICT ON CONSTRAINT users_recipes_pkey DO UPDATE SET date = EXCLUDED.date;`,
        values: [req.session.user.id, req.query["recipe_id"]]
      }
      pool.query(addRecipeQuery, (err, result)=>{
        if(err) console.log(err)
        else{
          pool.query(getRecipesQuery, (err, {rows})=>{
            if(err) console.log(err)
            else{
              context["myRecipes"] = makeRecipesObject(rows);
              res.render("my_recipes", context);
            }
          })
        }
      })
    } else if(req.query["delete_id"]){
      var deleteRecipeQuery = {
        text: `DELETE FROM users_recipes WHERE recipes_id=$1`,
        values: [req.query["delete_id"]]
      }
      pool.query(deleteRecipeQuery, (err, result)=>{
        if(err) console.log(err)
        else{
          pool.query(getRecipesQuery, (err, {rows})=>{
            if(err) console.log(err)
            else{
              context["myRecipes"] = makeRecipesObject(rows);
              res.render("my_recipes", context);
            }
          })
        }
      })
    } else {
      pool.query(getRecipesQuery, (err, {rows})=>{
        if(err) console.log(err)
        else{
          context["myRecipes"] = makeRecipesObject(rows);
          res.render("my_recipes", context);
        }
      })
    }
  }
});

function makeRecipesObject(rows){
  var recipes = [];
  for(i=0; i < rows.length; i++){
    recipes[i] = {};
    recipes[i].name = rows[i].name;
    recipes[i].date = rows[i].date.toLocaleString();
    recipes[i].impact = rows[i].recipes_impact;
    recipes[i].impact_color = function(impact){
      var impact_color = ''
      if(impact == null){
        impact_color = 'secondary'
      } else {
        if(impact > 8000){
          impact_color = 'danger'
        } else if (impact < 8000 && impact > 3000){
          impact_color = 'warning'
        } else if (impact < 3000){
          impact_color = 'success'
        }
      }
      return impact_color
    }(recipes[i].impact)
    recipes[i].id = rows[i].recipes_id;
    if(rows[i].hasOwnProperty("type")){
      recipes[i].type = rows[i].type;
    } else{
      recipes[i].type = ""
    }
  }
  return recipes
}

var register = async function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  var checkUser = {text:'SELECT * FROM users WHERE username=$1', values:[username]};
  var registerUser = {
    text:'INSERT INTO users (username, password, color) VALUES ($1, $2, $3)',
    values:[username, password, get_rand_rgb()]
  };
  pool.query(checkUser, (err, {rows})=>{
    if(err) console.log(err)
    else{
      if(rows.length > 0){
        res.send({
          "code":409,
          "failed":"Username already registered"
        })
      } else{
        pool.query(registerUser, (err)=>{
          if(err) console.log(err)
          else{
            pool.query(checkUser, (err, {rows})=>{
              if(err) console.log(err)
              else{
                console.log(rows)
                if(rows[0].username == username){
                  req.session.loggedin = true;
                  req.session.user = {
                    username: rows[0].username, 
                    color: rows[0].color,
                    id: rows[0].id
                  };
                  res.redirect('/');
                }
              }
            }) 
          }
        })
      }
    }
  })
}

var login = async function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  pool.query({text:"SELECT * FROM USERS WHERE username=$1", values:[username]}, (err, {rows})=>{
    if(err){
      console.log(err)
    } else{
      if(rows.length == 0){
        res.send({
          "code":206,
          "success":"Invalid E-mail"
        }) 
      } else{
        if(rows[0].password != password){
          res.send({
            "code":204,
            "success":"Bad Credentials, Please Try Again"
          })
        } else{
          req.session.loggedin = true;
          req.session.user = {
            username: rows[0].username,
            color: rows[0].color,
            id: rows[0].id
          };
          res.redirect('/');
        }
      }
    }
  })
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
