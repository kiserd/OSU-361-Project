const express = require('express');
const session = require('express-session');
const ingredientIcons = require('./ingredientIcons');
const handlebars = require('express-handlebars').create({ defaultLayout:'main' });
const PORT = process.env.PORT || 5000;
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const {Pool} = require('pg');
const pool = new Pool({
  connectionString: "postgres://qxtetfyciswbov:31134b5dcc9de86cf5f8f815858b9140d07cff36a764dfb7b90424c6804a5e38@ec2-3-211-176-230.compute-1.amazonaws.com:5432/d3u5cr9kigu0n5",
  ssl: {
    rejectUnauthorized: false
  }
});
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

// Frequently used query text
const queryTextSelectAllIngredients =     `SELECT * FROM ingredients`;
const queryTextSelectAllSystemRecipes =   `SELECT * FROM recipes WHERE user_recipe = false`;
const queryTextIngredientsByRecipe =      `SELECT i.*, ri.amount, ri.prep 
                                          FROM recipes AS r 
                                          LEFT JOIN recipes_ingredients AS ri 
                                          ON (r.id = ri.recipes_id) 
                                          LEFT JOIN ingredients AS i 
                                          ON (ri.ingredients_id = i.id) 
                                          WHERE r.id = $1`;
const queryTextRecipeIdByUserId =         `SELECT recipes_id FROM users_recipes WHERE users_id=$1`;
const queryTextRecipesByUserId =          'SELECT users_recipes.*, recipes.*, SUM(impact) as recipes_impact FROM recipes_ingredients '+
                                          'JOIN ingredients ON recipes_ingredients.ingredients_id=ingredients.id '+
                                          'JOIN users_recipes ON recipes_ingredients.recipes_id=users_recipes.recipes_id '+
                                          'JOIN recipes ON users_recipes.recipes_id=recipes.id '+
                                          'WHERE users_recipes.users_id=$1 '+
                                          'GROUP BY users_recipes.recipes_id, users_recipes.users_id, recipes.id ';
const queryTextSelectAllWhereId =         'SELECT * FROM ingredients WHERE id=$1';
const queryTextSelectRecipeById =         'SELECT * FROM recipes WHERE id=$1';

function getIngredientImage(type){
    if (type == "Meat") {
        return ingredientIcons.getMeatUrl();
    } else if (type == "Bread") {
        return ingredientIcons.getBreadUrl();
    } else if (type == "Vegetable") {
        return ingredientIcons.getCarrotUrl();
    } else if (type == "Milk") {
        return ingredientIcons.getMilkUrl();
    } else if (type == "Dairy") {
        return ingredientIcons.getCheeseUrl();
    } else if (type == "Sauce") {
        return ingredientIcons.getSauceUrl();
    }
    else {
        return ingredientIcons.getForkUrl();
    }
};

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

app.get('/water_impact', (req , res, next) => {
  res.render('water_impact');
});

app.get('/about_us', (req , res, next) => {
  res.render('water_impact');
});

class ChooseRecipeMap extends Map{
  constructor(rows=Array){
    super();
    for(let row of rows){
      row.in_book = false;
      this.set(row.id, row)
    }
  }
  async checkUserRecipes(req){
    if(req.session.loggedin){
      var querySelectUserRecipesByUserId = {
        text: queryTextRecipeIdByUserId,
        values: [req.session.user.id]
      };
      const rows_1 = await makeQuery(querySelectUserRecipesByUserId, true).catch(err=>{return Promise.reject(err)});
      var RECIPES_TO_SEND_FILTERED = this._setUserRecipes(rows_1);
      return Promise.resolve(RECIPES_TO_SEND_FILTERED);
    } else {
      return Promise.resolve(this);
    }
  }
  toSortedArray(desc){
    if(desc == true){
      return Array.from(this.values()).sort(this._inRecipeBookCompare).reverse();
    }
    return Array.from(this.values()).sort(this._inRecipeBookCompare);
  }
  toSortedByName(desc){
    if(desc == true){
      return Array.from(this.values()).sort(this._nameCompare).reverse();
    }
    return Array.from(this.values()).sort(this._nameCompare);
  }
  toSortedByType(desc){
    if(desc == true){
      return Array.from(this.values()).sort(this._typeCompare).reverse();
    }
    return Array.from(this.values()).sort(this._typeCompare);
  
  }
  _setUserRecipes(user_recipe_rows){
    var RECIPES_TO_SEND_FILTERED = this;
    for(let row of user_recipe_rows){
      let recipe = RECIPES_TO_SEND_FILTERED.get(row.recipes_id);
      if(recipe != null){
        recipe.in_book = true;
        RECIPES_TO_SEND_FILTERED.set(row.recipes_id, recipe);
      }
      
      
    }
    return RECIPES_TO_SEND_FILTERED;
  }
  _inRecipeBookCompare(book1, book2){
     return book1.in_book - book2.in_book;
  }
  _nameCompare(book1, book2){
      if(book1.name.toLowerCase() <= book2.name.toLowerCase()){
        return -1
      } else{
        return 1
      };
  }
  _typeCompare(book1, book2){
    if(book1.type.toLowerCase() <= book2.type.toLowerCase()){
      return -1
    }else{
      return 1
    }
  }
}

app.get('/choose_recipe', async (req , res, next) => {

  var context = {};
  var all_recipes = await makeQuery(queryTextSelectAllSystemRecipes, true).catch(err=>console.error(err));
  var RECIPES_MAP = new ChooseRecipeMap(all_recipes);
  RECIPES_MAP.checkUserRecipes(req).then((FILTERED)=>{
    
    if(req.query["sort"]){
      var q = req.query["sort"];
      var d = (req.query["desc"] == 'true' ? true : false);
      if(q == "name"){
        context["recipes"] = FILTERED.toSortedByName(d);
        context["isName"] = true;
      } else if(q == "type"){
        context["recipes"] = FILTERED.toSortedByType(d);
        context["isType"] = true;
      } else if(q == "in_book"){
        context["recipes"] = FILTERED.toSortedArray(d);
        context["isBook"] = true;
      }
      context.desc = (d == true ? false : true);
      context.isDesc =  !(context.desc);
    }else{
      context.desc = true;
      context.isDesc = false;
      context["isBook"] = true;
      context["recipes"] = FILTERED.toSortedArray();
    }
    
    res.render('choose_recipe', context);
  }).catch(err=>console.error(err));

});

app.get('/get_ingredients', (req, res, next)=>{
  var context = {};
  if(req.query["recipes_id"]){
    var getIngredientsQuery = {
      text: queryTextIngredientsByRecipe,
      values:[req.query["recipes_id"]]
    }
    makeQuery(getIngredientsQuery, true).then(rows=>{
      context.recipes_id = req.query["recipes_id"];
      context.ingredients = rows;
      res.send(context);
    }).catch(err=>console.error(err))
  } else {
    var queryGetAllIngredients = {
      text: queryTextSelectAllIngredients
    };
    makeQuery(queryGetAllIngredients, true).then(rows=>{
      
      for(let row of rows){
        row.color = getImpactColor(row.impact);
      };
      context.ingredients = rows;
      res.send(context);
    }).catch(err=>console.error(err));
  }
});

app.get('/add_recipe', (req, res, next)=>{
  if(req.query["recipe_id"] && req.session.loggedin){
    var addRecipeQuery = {
      text: `INSERT INTO users_recipes (users_id, recipes_id, date) VALUES ($1, $2, to_timestamp(${Date.now() / 1000.0}))
            ON CONFLICT ON CONSTRAINT users_recipes_pkey DO UPDATE SET date = EXCLUDED.date;`,
      values: [req.session.user.id, req.query["recipe_id"]]
    };
    var getRecipeQuery = {
      text: queryTextSelectAllWhereId,
      values: [req.query["recipe_id"]]
    };
    makeQuery(addRecipeQuery, false).then(()=>makeQuery(getRecipeQuery, true)).then(rows=>{
      res.send(rows[0]);
    }).catch(err=>console.error(err))
  } else {
    if(req.query["recipe_id"]){
      req.session.tempRecipe = req.query["recipe_id"];
      res.send({"error":"not logged-in", "name":req.query["recipe_name"]});
    }else{
      res.send({"error":"not logged-in"});
    }
  };
});

app.post('/add_to_recipes_global', (req, res, next)=>{
  var queryRecipeByName = {
    text:`SELECT * FROM recipes WHERE name=$1`,
    values:[req.body["userRecipeName"]]
  };
  var addUserRecipeGlobal = {
    text:`INSERT INTO recipes (name, type, user_recipe) VALUES ($1, $2, $3)`,
    values:[req.body["userRecipeName"], req.body["userRecipeType"], true]
  };
  makeQuery(queryRecipeByName, true).then(rows=>{
    if(rows.length > 0){
      res.send({"error":"Recipe name taken!"})
    } else {
      Promise.resolve()
    }
  }).then(()=>{makeQuery(addUserRecipeGlobal, false)}).then(()=>makeQuery(queryRecipeByName, true)).then(rows=>{
    var ingredients = [];
    var queries = [];
    for(let ingredient of req.body["ingredients"]){
      ingredients.push({
        "id":parseInt(ingredient[0]),
        "amount":ingredient[1].amount,
        "prep":ingredient[1].prep
      });
    }
    for(let ingredient of ingredients){
      queries.push(
        new Promise((resolve,reject)=>{
          return makeQuery({
            text: 'INSERT INTO recipes_ingredients (recipes_id, ingredients_id, amount, prep) VALUES ($1, $2, $3, $4) RETURNING *',
            values: [rows[0].id, ingredient.id, ingredient.amount, ingredient.prep]
          },true).then((rows)=>resolve(rows))
        })
      )
    }

    
    return Promise.all(queries).catch(err=>console.error(err));
  })
  .then(()=>{
    return makeQuery(queryRecipeByName, true)
  }).then(rows=>{
      res.send(rows[0]);
    }).catch(err=>console.error(err))
})

app.get('/get_user_recipes', (req, res, next)=>{
  if(req.session["user"] == null){
    res.send(false);
  }else{
    pool.query(queryTextRecipeIdByUserId, [req.session.user.id], (err, {rows})=>{
      if(err) {
        console.error(err)
        res.send(false);
      }
      res.send(rows);
    })
  }
})

app.get('/view_ingredients', async (req , res, next) => {
  // assign request header to convenient variable
  var recipe_id = req.query["recipe_id"];

  // get recipe info associated
  var queryRecipeById = {
    text: queryTextSelectRecipeById,
    values: [recipe_id]
  }
  var recipes = await makeQuery(queryRecipeById, true);

  // get ingredients associated with recipe
  var queryIngredientsByRecipe = {
    text: queryTextIngredientsByRecipe,
    values: [recipe_id]
   }
   var ingredients = await makeQuery(queryIngredientsByRecipe, true);
  
  // assign data to context and render page
  context = {};
  context["ingredients"] = ingredients;
  context["recipe"] = recipes[0];
  res.render('view_ingredients', context);
});

app.get('/view_substitutes', (req, res, next) => {
  var ingredient = {};
  ingredient.id = req.query["ingredient"];
  ingredient.name = req.query["ingredientName"];
  var recipe = {}
  recipe.id = req.query["recipe"]
  recipe.name = req.query["recipeName"];

  var queryCurrIngredient = {
    text: queryTextSelectAllWhereId,
    values: [ingredient.id]
  };

  makeQuery(queryCurrIngredient, true)
    .then(rows => getSubstitutes(rows))
    .then(rows => {renderSubstitutes(res, rows, recipe, ingredient);
    }).catch(err => {console.error(err)})
});

function getSubstitutes(rows)
{
  return new Promise((resolve, reject)=>{
    var query = {
      text: 'SELECT * FROM ingredients WHERE type=$1 AND impact<$2',
      values: [rows[0].type, rows[0].impact]
    }
    pool.query(query, (err, result)=>{
      if(err) reject(err)
      else resolve(result.rows);
    })
  })
};

function renderSubstitutes(res, rows, recipe, ingredient)
{
  context = {};
  context["recipe"] = recipe;
  context["ingredient"] = ingredient;
  if(rows.length > 0){
    var substitutes = [];
    for(i=0; i < rows.length; i++){
      substitutes[i] = {};
      substitutes[i].name = rows[i].name;
      substitutes[i].impact = rows[i].impact;
      substitutes[i].id = rows[i].id;
    }
    context["substitutes"] = substitutes;
  } else{
    context["message"] = 'No substitutions available!';
  }
  res.render('view_substitutes', context);
}

function getRandIconColor(){
    const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
    const r = randomBetween(0, 255);
    const g = randomBetween(0, 255);
    const b = randomBetween(0, 255);
    const rgb = `rgba(${r},${g},${b}, 0.35)`; // Collect all to a css color string
    return rgb
};

app.get('/make_substitution', async (req, res, next) => {
  // make sure user is logged in
  if(req.session.loggedin){
    
    // define a few convenient variables
    var ingredient_id = req.query["ingredient"];
    var recipe_id = req.query["recipe"];
    var new_name = req.query["new_name"];
    var substitute_id = req.query["substitute"]; 

    // get all recipe info
    var queryRecipeById = {
      text: queryTextSelectAllWhereId,
      values: [recipe_id]
    };
    var recipe = await makeQuery(queryRecipeById, true);
    recipe = recipe[0];

    // get all ingredients associated with recipe
    var queryIngredientsByRecipe = {
      text: queryTextIngredientsByRecipe,
      values: [recipe_id]
    };
    var ingredients = await makeQuery(queryIngredientsByRecipe, true);

    // add skeleton in DB for new user recipe
    var addUserRecipeGlobal = {
      text:`INSERT INTO recipes (name, type, user_recipe) VALUES ($1, $2, $3)`,
      values:[new_name, recipe["type"], true]
    };
    await makeQuery(addUserRecipeGlobal, false)

    // get id of new recipe
    var queryRecipeIdByName = {
      text: 'SELECT id FROM recipes WHERE name = $1',
      values: [new_name]
    };
    new_recipe_id = await makeQuery(queryRecipeIdByName, true);
    new_recipe_id = new_recipe_id[0]["id"];

    // loop through ingredients in original recipe
    for (let ing of ingredients) {
      var current_ingredient = null;
      // handle case where current ingredient is to be substituted FOR
      if (ing.id == ingredient_id) {
        current_ingredient = substitute_id
      }
      // handle case where current ingredient will remain in recipe
      else {
        current_ingredient = ing["id"];
      }
      // Link new recipe ID to current_ingredient
      var linkRecipeToIngredients = {
        text: 'INSERT INTO recipes_ingredients (recipes_id, ingredients_id) VALUES ($1, $2)',
        values: [new_recipe_id, current_ingredient]
      }
      await makeQuery(linkRecipeToIngredients, false);
    }

    // update users_recipes to link recipe to user
    var linkRecipeToUser = {
      text: `INSERT INTO users_recipes (users_id, recipes_id, date) VALUES ($1, $2, to_timestamp(${Date.now() / 1000.0}))`,
      values: [req.session.user.id, new_recipe_id]
    }
    await makeQuery(linkRecipeToUser, false);
    
    // render my_recipes page
    var getRecipesQuery = {
      text: queryTextRecipesByUserId,
      values: [req.session.user.id]
    }
    var myRecipes = await makeQuery(getRecipesQuery, true);
    context = {};
    context["myRecipes"] = makeRecipesObject(myRecipes);
    res.render('my_recipes', context);
  } 
  // handle case where user is not logged in
  else {
    res.send(false);
  };
});


app.get('/build_recipe', async (req , res, next) => {
  var context = {};
  var ingredients = await makeQuery('SELECT * FROM ingredients', true);
  for(let ingredient of ingredients){
    // Uppercase first letter of ingredient type:
    ingredient.type = ingredient.type[0].toUpperCase() + ingredient.type.slice(1);
    ingredient.name = ingredient.name[0].toUpperCase() + ingredient.name.slice(1);
    ingredient.iconColor = getRandIconColor();
    ingredient.icon = getIngredientImage(ingredient.type);
    ingredient.color = getImpactColor(ingredient.impact);
  }
  context["ingredients"] = ingredients;
  res.render('build_recipe', context);
});

app.get('/my_recipes', async (req , res, next) => {
  var context = {};
  if(req.session["user"] == null){
    if(req.query["recipe_id"]){
      req.session.tempRecipe = req.query["recipe_id"];
      var queryRows = await makeQuery({text:`SELECT name FROM recipes WHERE id=$1`, values:[req.query["recipe_id"]]}, true);
      context.triedToSaveRecipe = true;
      context.n = queryRows[0];
      res.render("new_user", context);
    }else{
      context.triedToViewMyRecipes = true;
      res.render("new_user", context);
    }

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
        text: `WITH add_recipe as (INSERT INTO users_recipes (users_id, recipes_id, date) VALUES ($1, $2, to_timestamp(${Date.now() / 1000.0})) 
              ON CONFLICT ON CONSTRAINT users_recipes_pkey DO UPDATE SET date = EXCLUDED.date RETURNING *) 
              SELECT * FROM add_recipe 
              LEFT JOIN recipes ON add_recipe.recipes_id=recipes.id`,
        values: [req.session.user.id, req.query["recipe_id"]]
      }
      var rObject = {};
      makeQuery(addRecipeQuery, true).then((r)=>{
        rObject.rName = r[0].name;
        rObject.rId = r[0].id;
        return makeQuery(getRecipesQuery, true)}).then(rows=>{
        renderMyRecipes(res, rows, {id:rObject.rId, name:rObject.rName, action:"added to", color:"success", undoUrl:"delete_id"});
      }).catch(err=>{console.error(err)})
      
    } else if(req.query["delete_id"]){
      var deleteRecipeQuery = {
        text: `WITH delete_recipe as (DELETE FROM users_recipes WHERE recipes_id=$1 AND users_id=$2 RETURNING *)
        SELECT * FROM delete_recipe LEFT JOIN recipes ON delete_recipe.recipes_id=recipes.id`,
        values: [req.query["delete_id"], req.session.user.id]
      }
      var rObject = {};
      makeQuery(deleteRecipeQuery, true).then((r)=>{
        if(r[0] == null){
          rObject = false;
        }else{
          rObject["name"] = r[0].name;
          rObject["id"] = r[0].id;
          rObject["action"] = "deleted from";
          rObject["color"] = "dark";
          rObject["undoUrl"] = "recipe_id";
        }

        return makeQuery(getRecipesQuery, true)}).then(rows=>{
        renderMyRecipes(res, rows, rObject);
      }).catch(err=>{console.error(err)})
    } else {
      makeQuery(getRecipesQuery, true).then(rows=>{
        renderMyRecipes(res, rows);
      }).catch(err=>{console.error(err)})
    }
  }
});

function renderMyRecipes(res, rows, ifModify){
  context = {};
  context["myRecipes"] = makeRecipesObject(rows);
  if(ifModify){
    context.isModified = true;
    context["modifyId"] = ifModify["id"];
    context["modifyName"] = ifModify["name"];
    context["modifyAction"] = ifModify["action"];
    context["modifyColor"] = ifModify["color"];
    context["undoUrl"] = ifModify["undoUrl"];
  }
  res.render("my_recipes", context);
};

function makeQuery(query, returnRows){
  return new Promise((resolve, reject)=>{
    pool.query(query, (err, result)=>{
      if(err) reject(err)
      else{
        if(returnRows){
          resolve(result.rows);
        }
        else{
          resolve(true);
        }
      }
    })
  })
};

function getImpactColor(impact){
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
}

function makeRecipesObject(rows){
  var recipes = [];
  for(i=0; i < rows.length; i++){
    recipes[i] = {};
    recipes[i].name = rows[i].name;
    if(rows[i].hasOwnProperty("date") && rows[i].date != null){
      recipes[i].date = rows[i].date.toLocaleString();
    }
    recipes[i].impact = rows[i].recipes_impact;
    recipes[i].impact_color = getImpactColor(recipes[i].impact);
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
    if(err) console.error(err)
    else{
      if(rows.length > 0){
        context = {};
        context.alreadyRegistered = true;
        context.bcMessage = "An account with the username " + req.body.username + " already exists.";
        context.username = req.body.username;
        res.render("new_user", context);
      } else{
        makeQuery(registerUser, false).then(()=>makeQuery(checkUser, true)).then(rows=>{
          if(rows[0].username == username){
            req.session.loggedin = true;
            req.session.user = {
              username: rows[0].username, 
              color: rows[0].color,
              id: rows[0].id
            };
            if(req.session.tempRecipe){
              res.redirect(`/my_recipes?recipe_id=${req.session.tempRecipe}#${req.session.tempRecipe}`);
              req.session.tempRecipe = null;
            } else{
              res.redirect('/');
            }

          }
        }).catch(err=>console.error(err))
      }
    }
  })
}

var login = async function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  pool.query({text:"SELECT * FROM USERS WHERE username=$1", values:[username]}, (err, {rows})=>{
    if(err){
      console.error(err)
    } else{
      if(rows.length == 0){
        context = {};
        context.badCredentials = true;
        context.bcMessage = "There's no account with the username " + req.body.username + ".";
        res.render("new_user", context);
      } else{
        if(rows[0].password != password){
          context = {};
          context.badCredentials = true;
          context.bcMessage = "The password you've entered for " + rows[0].username + " is incorrect.";
          res.render("new_user", context);
        } else{
          req.session.loggedin = true;
          req.session.user = {
            username: rows[0].username,
            color: rows[0].color,
            id: rows[0].id
          };
          if(req.session.tempRecipe){
            res.redirect(`/my_recipes?recipe_id=${req.session.tempRecipe}#${req.session.tempRecipe}`);
            req.session.tempRecipe = null;
          } else{
            res.redirect('/');
          }
          
        };
      };
    };
  });
};

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
  if(req.query["triedSave"]){
    context = {};
    context.triedToSaveRecipe = true;
    if(req.query["n"]){
      context.n = req.query["n"];
    }
    res.render('new_user', context);
  } else{
    res.render('new_user');
  }

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
  console.log(`Listening on: http://localhost:${ PORT }; press Ctrl-C to terminate.`);
});
