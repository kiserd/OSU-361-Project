var buttons = document.getElementsByClassName("save_recipe_button")

for(let button of buttons){
    button.addEventListener("click", async function(){
        let save_loader = document.getElementById(`save_loader_${button.id}`);
        let save_text = document.getElementById(`save_text_${button.id}`);
        if(!save_loader.classList.contains("spinner-border")){
            save_loader.classList.add("spinner-border");
            save_loader.classList.add("spinner-border-sm");
            button.disabled = true;
        }
        if(!save_text.classList.contains("sr-only")){
            save_text.classList.add("sr-only")
        
        }
        var url = `/add_recipe?recipe_id=${button.id}`
        goFetch(url).then(data=>{
            console.log(data)
            save_loader = document.getElementById(`save_loader_${data.id}`);
            save_text = document.getElementById(`save_text_${data.id}`);
            save_button = document.getElementById(data.id);
            if(save_loader.classList.contains("spinner-border")){
                save_loader.classList.remove("spinner-border");
                save_loader.classList.remove("spinner-border-sm");
            }
            if(save_button.classList.contains("btn-primary")){
                save_button.classList.remove("btn-primary");
                save_button.classList.add("btn-success")
            }
            if(save_text.classList.contains("sr-only")){
                save_text.classList.remove("sr-only")
                save_text.textContent = "Added!"
            }
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

async function goFetch(url){
    const response = await fetch(url);
    return response.json();
}

