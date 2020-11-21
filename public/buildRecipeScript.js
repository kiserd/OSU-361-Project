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
            userRecipe = {"name":data.name, "id":data.id};
            var addRecipeToUserUrl = `/add_recipe?recipe_id=${userRecipe.id}&recipe_name=${userRecipe.name}`;
            return goFetch(addRecipeToUserUrl)
            
        }).then(res=>{
            if(res["error"]){
                window.open(`/new_user?triedSave=true&n=${res["name"]}`, "_self")
                
            } else{
                window.open(`/my_recipes#${res.id}`, "_self");
            }
        })
    }
});

function setRecipeButton(r){
    let button = r.recipeIngredientButton;
    button.setAttribute("data-target", `#i_${r.ingredientId}_collapse`);
    button.textContent = r.ingredientTitle;

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

function setDeleteButton(r){;
    r.deleteButton.for = r.ingredientId;
    r.deleteButton.addEventListener("click", () => {
        if(document.getElementsByClassName("tooltip") != null){
            for(let tooltip of document.getElementsByClassName("tooltip")){
                tooltip.style.display = "none";
            }
        }
        recipeListDiv.removeChild(document.getElementById(`rrow_${r.deleteButton.for}`));
        CURRENT_RECIPE_INGREDIENTS.delete(r.deleteButton.for);

        if (Array.from(CURRENT_RECIPE_INGREDIENTS).length == 0) {
            showPlaceholderText();
            sendRecipeButton.disabled = true;
        }
    });
};

function setTopHalfRecipeRow(r){
    var topHalfRecipeRow = r.recipeRow;
    topHalfRecipeRow.id = `r_${r.ingredientId}`;
    CURRENT_RECIPE_INGREDIENTS.set(r.ingredientId, { "id": r.ingredientId, "name": r.ingredientTitle });

    setRecipeButton(r);

    let recipeIngredientImpactBadge = makeRecipeImpactBadge(r.ingredientId);
    r.recipeIngredientImpactDiv.appendChild(recipeIngredientImpactBadge);
    setDeleteButton(r);
};

function setBottomHalfRecipeRow(r){
    var bottomHalfRecipeRow = r.collapsedDiv;
    bottomHalfRecipeRow.id = `i_${r.ingredientId}_collapse`;

    let arrowIndentCell = bottomHalfRecipeRow.firstElementChild;
    let amountInputCell = arrowIndentCell.nextElementSibling;
    let amountInput = amountInputCell.firstElementChild;
    amountInput.id = `amount_${r.ingredientId}`;

    let prepInputCell = amountInputCell.nextElementSibling;
    let prepInput = prepInputCell.firstElementChild;
    prepInput.id = `prep_${r.ingredientId}`;
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

function initRowObjectProperties(r, ingredientId){
    r.recipeRowDiv = r.querySelector("#recipeRowDiv");
    r.recipeRowDiv.id = `rrow_${ingredientId}`;
    r.recipeRow = r.querySelector("#recipeRow");
    console.log(r.recipeRow)
    r.recipeIngredientTitleDiv = r.querySelector("#recipeIngredientTitleDiv") ;
    r.recipeIngredientButton = r.querySelector("#recipeIngredientButton") ;
    r.recipeIngredientImpactDiv = r.querySelector("#recipeIngredientImpactDiv") ;
    r.deleteButtonDiv = r.querySelector("#deleteButtonDiv") ;
    r.deleteButton = r.querySelector("#deleteButton") ;
    r.collapsedDiv = r.querySelector("#collapsedDiv") ;
    r.arrowIndentDiv = r.querySelector("#arrowIndentDiv") ;
    r.amountInputDiv = r.querySelector("#amountInputDiv") ;
    r.prepInputDiv = r.querySelector("#prepInputDiv") ;
    r.ingredientTitle = document.getElementById(`ingredientName_${ingredientId}`).textContent;
    r.ingredientId = ingredientId;
};

function makeRecipeRow(ingredientId){
    if (CURRENT_RECIPE_INGREDIENTS.get(ingredientId) != null) {
        pulseIngredient(ingredientId);
        return
    };
    let recipeRowTemplate = document.getElementById("recipe-row-template")
    let r = recipeRowTemplate.content.cloneNode(true);
    initRowObjectProperties(r, ingredientId);
    setTopHalfRecipeRow(r);
    setBottomHalfRecipeRow(r);
    hidePlaceholderText();
    
    sendRecipeButton.disabled = false;
    recipeListDiv.appendChild(r);
    
    setTimeout(() => {
        r.recipeRow.classList.add("show");
    }, 100);
};

