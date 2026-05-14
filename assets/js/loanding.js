function showLoading() {
    const div = document.createElement("div");
    div.classList.add("loading");

    const img = document.createElement("img");
    img.src = "/assets/imgs/loading.png";

    div.appendChild(img);

    document.body.appendChild(div);
}

function hideLoading() {
    const loadings = document.getElementsByClassName("loading");
    if (loadings.length) {
        loadings[0].remove();
    }
}

function messageError() {
    const existing = document.querySelector(".error-login");
    if (existing) {
        existing.remove();
    }

    const div = document.createElement("div");
    div.classList.add("error-login");
    div.innerText = "Usuário não encontrado!!";

    const container = document.querySelector(".container");
    const logo = document.querySelector(".logo");

    container.insertBefore(div, logo.nextSibling);

    setTimeout(() => {
        div.classList.add("hide");
        setTimeout(() => div.remove(), 500);
    }, 1000);
}

function resetPasswordSend() {
    const existing = document.querySelector(".resetPassword");
    if (existing) {
        existing.remove();
    }

    const div = document.createElement("div");
    div.classList.add("resetPassword");
    div.innerText = "E-mail enviado com sucesso ✓";

    const container = document.querySelector(".container");
    const logo = document.querySelector(".logo");

    container.insertBefore(div, logo.nextSibling);

    setTimeout(() => {
        div.classList.add("hide");
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

function resetPasswordError() {
    const existing = document.querySelector(".resetPasswordError");
    if (existing) {
        existing.remove();
    }

    const div = document.createElement("div");
    div.classList.add("resetPassword");
    div.innerText = "E-mail inválido verifique o e-mail novamente!!";

    const container = document.querySelector(".container");
    const logo = document.querySelector(".logo");

    container.insertBefore(div, logo.nextSibling);

    setTimeout(() => {
        div.classList.add("hide");
        setTimeout(() => div.remove(), 500);
    }, 3000);
}

function registerMessageError() {
    const existing = document.querySelector(".error-register");
    if (existing) {
        existing.remove();
    }

    const div = document.createElement("div");
    div.classList.add("error-register");
    div.innerText = "O e-mail informado já está vinculado a uma conta";

    const container = document.querySelector(".container");
    const logo = document.querySelector(".logo");

    container.insertBefore(div, logo.nextSibling);

    setTimeout(() => {
        div.classList.add("hide");
        setTimeout(() => div.remove(), 500);
    }, 3000);
}