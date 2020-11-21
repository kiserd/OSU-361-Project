var buttons = document.getElementsByClassName("save_recipe_button")

for (let button of buttons) {
    button.addEventListener("click", async function () {
        let save_loader = document.getElementById(`save_loader_${button.id}`);
        let save_text = document.getElementById(`save_text_${button.id}`);
        if (!save_loader.classList.contains("spinner-border")) {
            save_loader.classList.add("spinner-border");
            save_loader.classList.add("spinner-border-sm");
            button.disabled = true;
        }
        if (!save_text.classList.contains("sr-only")) {
            save_text.classList.add("sr-only")
        }
        var url = `/add_recipe?recipe_id=${button.id}&recipe_name=${button.name}`
        goFetch(url).then(data => {
            if (data["error"]) {
                if (save_loader.classList.contains("spinner-border")) {
                    save_loader.classList.remove("spinner-border");
                    save_loader.classList.remove("spinner-border-sm");
                }
                if (save_text.classList.contains("sr-only")) {
                    save_text.classList.remove("sr-only")
                }
                let recipe_name = data["name"];
                window.open(`/new_user?triedSave=true&n=${recipe_name}`, "_self");
                return;
            }
            save_loader = document.getElementById(`save_loader_${data.id}`);
            save_text = document.getElementById(`save_text_${data.id}`);
            save_button = document.getElementById(data.id);
            if (save_loader.classList.contains("spinner-border")) {
                save_loader.classList.remove("spinner-border");
                save_loader.classList.remove("spinner-border-sm");
            }
            if (save_text.classList.contains("sr-only")) {
                save_text.classList.remove("sr-only")
                save_text.textContent = "Added!"
            }
            save_button.style.color = "green";
            $(function () {
                $('[data-toggle="popover"]').popover('hide')
            })
            $(function () {

                $(`#${data.id}`).popover('enable')
                $(`#${data.id}`).popover('show')
            })
        })
    })
}

function makeSpinner(){
    var modal_spinner = document.createElement("div")
    modal_spinner.className = "text-center visible"
    modal_spinner.id = "modal-body-content"
    var spinner_border = document.createElement("div")
    spinner_border.className = "spinner-border"
    spinner_border.role = "status"
    var spinner_span = document.createElement("span")
    spinner_span.className = "sr-only"
    spinner_span.textContent = "Loading..."
    spinner_border.appendChild(spinner_span)
    modal_spinner.appendChild(spinner_border)
    return modal_spinner
}



var activeModalId = -1;

var view_buttons = document.getElementsByClassName("view_recipe_button")
for (let button of view_buttons) {
    button.addEventListener("click", async function () {
        $(function () {
            $('[data-toggle="popover"]').popover('hide')
        })
        if (activeModalId == button.value) {
            return;
        } else {
            var url = `/get_ingredients?recipes_id=${button.value}`
            document.getElementById('ingredientsModalLabel').textContent = "Loading..."
            document.getElementById("modal-body").replaceChild(makeSpinner(), document.getElementById('modal-body-content'));
            goFetch(url).then(data => {
                console.log(data);
                let ingredientsList = document.createElement("ul");
                ingredientsList.style.display = "inline";
                ingredientsList.id = "modal-body-content"
                ingredientsList.classList.add("list-group-flush");
                for (let ingredient of data.ingredients) {
                    let ingredientItem = document.createElement("li");
                    ingredientItem.classList.add("list-group-item");
                    ingredientItem.textContent = ingredient.name;
                    ingredientsList.appendChild(ingredientItem);
                }
                let ingredients_modal_title = document.getElementById(`ingredientsModalLabel`);
                ingredients_modal_title.textContent = document.getElementById(`recipe_name_${data.recipes_id}`).textContent;
                let ingredients_modal_body = document.getElementById(`modal-body`);
                ingredients_modal_body.replaceChild(ingredientsList, document.getElementById("modal-body-content"));
                document.getElementById("view_full_link").href = `/view_ingredients?recipe_id=${data.recipes_id}`;
                activeModalId = data.recipes_id;
            })
        }
    })
}

async function goFetch(url, toSend) {
    if(toSend){
        const response = await fetch({method:"POST", body:toSend, url:url})
        return response.json();
    }
    const response = await fetch(url);
    return response.json();
}

