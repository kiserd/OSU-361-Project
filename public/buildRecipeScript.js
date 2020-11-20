var CURRENT_RECIPE_INGREDIENTS = new Map();

var recipeListDiv = document.getElementById("recipeListDiv");

var isFirstIngredient = true;

async function goFetch(url, toSend) {
    if (toSend) {
        console.log(toSend)
        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(toSend)
        })
        return response.json();
    } else {
        const response = await fetch(url);
        return response.json();
    }

}

var sendRecipeButton = document.getElementById("sendRecipeButton");
sendRecipeButton.addEventListener("click", function () {
    var ingredients = Array.from(CURRENT_RECIPE_INGREDIENTS);
    for(let ingredient of ingredients){
        let id = ingredient[1].id
        ingredient[1].amount = document.getElementById(`amount_${id}`).value;
        ingredient[1].prep = document.getElementById(`prep_${id}`).value;
    }
    var userRecipeName = document.getElementById("userRecipeName").value;
    var mealType = document.getElementById("mealType").value;
    if (userRecipeName == "") {
        alert("Please name your recipe!");
        return
    } else if(mealType == ""){
        alert("Please select a meal type!");
        return
    }else {
        var toSend = { 
            "userRecipeName": userRecipeName, 
            "userRecipeType": mealType, 
            "ingredients": ingredients 
        };
        var url = "/add_to_recipes_global";
        goFetch(url, toSend).then(data => {
            window.open(`/my_recipes#${data.id}`, "_self");
        })
    }
});

function setRecipeButton(button, ingredientId, title){
    button.setAttribute("data-target", `#i_${ingredientId}_collapse`);
    button.textContent = title;

    if(isFirstIngredient){
        handleTooltips(button.parentElement, button);
        isFirstIngredient = false;
    };
}

function makeRecipeImpactBadge(ingredientId){
    let recipeIngredientImpactBadge = document.getElementById(`ingredientImpact_${ingredientId}`).cloneNode(true);
    recipeIngredientImpactBadge.classList.remove("ingredientImpact");
    recipeIngredientImpactBadge.classList.add("recipeImpact");

    return recipeIngredientImpactBadge
    
}

function setDeleteButton(deleteButton, ingredientId){
    deleteButton.for = ingredientId;
    deleteButton.addEventListener("click", () => {
        if(document.getElementsByClassName("tooltip") != null){
            for(let tooltip of document.getElementsByClassName("tooltip")){
                tooltip.style.display = "none";
            }
        }
        recipeListDiv.removeChild(document.getElementById(`rrow_${deleteButton.for}`));
        CURRENT_RECIPE_INGREDIENTS.delete(deleteButton.for);

        
        if (Array.from(CURRENT_RECIPE_INGREDIENTS).length == 0) {
            showPlaceholderText();
            sendRecipeButton.disabled = true;
        }
    });
};

function setTopHalfRecipeRow(topHalfRecipeRow, ingredientId){
    topHalfRecipeRow.id = `r_${ingredientId}`;
    let recipeIngredientTitleCell = topHalfRecipeRow.firstElementChild;

    let recipeIngredientTitle = document.getElementById(`ingredientName_${ingredientId}`).textContent;
    CURRENT_RECIPE_INGREDIENTS.set(ingredientId, { "id": ingredientId, "name": recipeIngredientTitle });

    let recipeIngredientButton = recipeIngredientTitleCell.firstElementChild;

    setRecipeButton(recipeIngredientButton, ingredientId, recipeIngredientTitle);

    let recipeIngredientImpactCell = recipeIngredientTitleCell.nextElementSibling;
    let recipeIngredientImpactBadge = makeRecipeImpactBadge(ingredientId);
    recipeIngredientImpactCell.appendChild(recipeIngredientImpactBadge);

    let deleteButton = recipeIngredientImpactCell.nextElementSibling.firstElementChild;
    setDeleteButton(deleteButton, ingredientId);
};

function setBottomHalfRecipeRow(bottomHalfRecipeRow, ingredientId){
    bottomHalfRecipeRow.id = `i_${ingredientId}_collapse`;

    let arrowIndentCell = bottomHalfRecipeRow.firstElementChild;
    let amountInputCell = arrowIndentCell.nextElementSibling;
    let amountInput = amountInputCell.firstElementChild;
    amountInput.id = `amount_${ingredientId}`;

    let prepInputCell = amountInputCell.nextElementSibling;
    let prepInput = prepInputCell.firstElementChild;
    prepInput.id = `prep_${ingredientId}`;
};

function showPlaceholderText(){
    var placeholderText = document.getElementById("recipePlaceholder");
    if(placeholderText.style.display == "none"){
        placeholderText.style.display = "";
    }
};

function hidePlaceholderText(){
    var placeholderText = document.getElementById("recipePlaceholder");
    if (placeholderText.style.display != "none") {
        
        placeholderText.style.display = "none";
    }
};

function pulseIngredient(ingredientId){
    var thisRow = document.getElementById(`r_${ingredientId}`);
    thisRow.classList.add("pulse");
    setTimeout(function () { thisRow.classList.remove("pulse") }, 500);
};

function handleTooltips(divForTooltip, button){
    divForTooltip.setAttribute("data-toggle", "tooltip");
    divForTooltip.setAttribute("data-placement", "left");
    divForTooltip.title = "Click ingredient names to add amounts/prep notes.";

    button.classList.add("btn-focus-hover");

    // Toggle Bootstrap tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip('show')
      });
    setTimeout(()=>{
        $(function () {
            $('[data-toggle="tooltip"]').tooltip('hide')
            button.classList.remove("btn-focus-hover");
          });
    }, 3000);
    setTimeout(()=>{
        $(function () {
            $('[data-toggle="tooltip"]').tooltip('dispose')
          });
    }, 3500);
};

function makeRecipeRow(ingredientId){
    if (CURRENT_RECIPE_INGREDIENTS.get(ingredientId) != null) {
        pulseIngredient(ingredientId);
        return
    };

    let recipeRowDiv = document.getElementById("recipeRowDiv").cloneNode(true);
    recipeRowDiv.id = `rrow_${ingredientId}`;

    let topHalfRecipeRow = recipeRowDiv.firstElementChild;
    setTopHalfRecipeRow(topHalfRecipeRow, ingredientId);

    let bottomHalfRecipeRow = topHalfRecipeRow.nextElementSibling;
    setBottomHalfRecipeRow(bottomHalfRecipeRow, ingredientId);

    hidePlaceholderText();

    sendRecipeButton.disabled = false;

    recipeRowDiv.classList.remove("no-show");
    recipeListDiv.appendChild(recipeRowDiv);
    
    setTimeout(() => {
        topHalfRecipeRow.classList.add("show");
    }, 100);
};



