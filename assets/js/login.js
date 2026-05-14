firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        window.location.replace("/pages/home/home.html");
    }
});

window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
        window.location.reload();
    }
});

function loginWithGoogle() {
    showLoading();
    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider)
        .then(() => {
            hideLoading();
            window.location.replace("/pages/home/home.html");
        })
        .catch((error) => {
            hideLoading();
            if (error.code === "auth/popup-closed-by-user") return;
            messageError();
            console.error(error);
        });
}