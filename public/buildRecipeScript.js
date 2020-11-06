var testJSON = [
    { "type": "meat", "name": "ground beef", "impact": 13021 },
    { "type": "meat", "name": "chicken", "impact": 2868 },
    { "type": "meat", "name": "pork", "impact": 5736 },
    { "type": "bread", "name": "pasta", "impact": 616 },
    { "type": "bread", "name": "bread", "impact": 536 },
    { "type": "bread", "name": "rice", "impact": 832 },
    { "type": "vegetable", "name": "lettuce", "impact": 133 },
    { "type": "vegetable", "name": "tomato", "impact": 108 },
    { "type": "dairy", "name": "cheese", "impact": 3153 },
    { "type": "dairy", "name": "butter", "impact": 7193 },
    { "type": "dairy", "name": "egg", "impact": 2017 },
    { "type": "sauce", "name": "ketchup", "impact": 178 },
    { "type": "sauce", "name": "tomato sauce", "impact": 285 }
];

var div = document.getElementById("ingredientList");
div.style.backgroundColor = "beige";

var ingredientTitle = document.getElementById("ingredientListTitle");
var recipeTitle = document.getElementById("recipeListTitle");
ingredientTitle.style.textAlign = "center";
recipeTitle.style.textAlign = "center";

var recipeListDiv = document.getElementById("recipeList");
recipeListDiv.style.backgroundColor = "orange";

function generateIngredientDiv(ingredient, type, impact) {
    var ingredientDiv = document.createElement("div");

    ingredientDiv.style.borderWidth = "2px";
    ingredientDiv.style.margin = "auto";
    ingredientDiv.style.marginTop = "8px";
    ingredientDiv.style.marginRight = "4px";
    ingredientDiv.style.width = "15rem";
    ingredientDiv.style.float = "left";
    ingredientDiv.className = "card";

    ingredientColor = document.createElement("div");
    ingredientColor.className = "rounded-circle";
    ingredientColor.style.width = "30px";
    ingredientColor.style.height = "30px";
    ingredientColor.style.float = "right";
    ingredientColor.style.backgroundColor = get_rand_color();

    ingredientDivCardBody = document.createElement("div");
    ingredientDivCardBody.className = "card-body";

    var ingredientDivGrid1 = document.createElement("div");
    

    var ingredientDivGrid2 = document.createElement("div");
    

    var name = document.createElement("h4");
    name.className = "card-title";

    var ingredientType = document.createElement("h5");
    ingredientType.className = "card-subtitle mb-2 text-muted";

    var ingredientImpact = document.createElement("p");
    impact.className = "card-text";

    name.innerHTML = ingredient;
    ingredientType.innerHTML = type;
    ingredientImpact.innerHTML = impact;

    var add = document.createElement("button");
    add.className = "btn btn-success";
    add.innerHTML = "Add";
    add.style.marginTop = "20px";

    ingredientDivGrid1.appendChild(ingredientColor);
    ingredientDivGrid1.appendChild(name);
    ingredientDivGrid1.appendChild(ingredientType);
    ingredientDivGrid1.appendChild(ingredientImpact);
    ingredientDivGrid2.appendChild(add);
    ingredientDivCardBody.appendChild(ingredientDivGrid1);
    ingredientDivCardBody.appendChild(ingredientDivGrid2);

    ingredientDiv.appendChild(ingredientDivCardBody);

    add.addEventListener("click", function () {
        var recipeListhtml = document.getElementById("recipeList");
        var ingredientToAddClone = ingredientDiv.cloneNode(true);
        ingredientToAddClone.firstChild.childNodes[1].firstChild.innerHTML = "Delete";
        ingredientToAddClone.firstChild.childNodes[1].firstChild.className = "btn btn-danger";

        // when "delete" button clicked, remove item from recipe list
        var deleteButton = ingredientToAddClone.firstChild.childNodes[1].firstChild.addEventListener("click", () => {
            recipeListhtml.removeChild(ingredientToAddClone);
        });

        recipeListhtml.appendChild(ingredientToAddClone);
    });

    return ingredientDiv;
}

for (var i = 0; i < testJSON.length; i++) {
    var ingredientList = document.getElementById("ingredientList");
    ingredientList.appendChild(generateIngredientDiv(testJSON[i].name, testJSON[i].type, testJSON[i].impact.toString()));
}


function get_rand_color() {
    var color = Math.floor(Math.random() * Math.pow(256, 3)).toString(16);
    while (color.length < 6) {
        color = "0" + color;
    }
    return "#" + color;
}