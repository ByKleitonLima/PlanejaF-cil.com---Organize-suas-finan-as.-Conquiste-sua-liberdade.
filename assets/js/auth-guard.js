firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.replace("/index.html");
    }
});