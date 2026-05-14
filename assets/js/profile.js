firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.replace("../../login.html");
        return;
    }

    loadProfile(user);
});

function loadProfile(user) {
    const name = user.displayName || "Usuário";

    const welcomeEl = document.getElementById("welcome");
    if (welcomeEl) {
        welcomeEl.innerText = name;
    }

    if (user.photoURL) {
        const images = document.querySelectorAll(".profileImage");
        const placeholders = document.querySelectorAll(".avatarPlaceholder");

        images.forEach((img) => {
            img.src = user.photoURL;
            img.style.display = "block";
        });

        placeholders.forEach((placeholder) => {
            placeholder.style.display = "none";
        });
    }

    document.querySelectorAll(".profileName").forEach((element) => {
        element.innerText = name;
    });

    document.getElementById("profileEmail").innerText = user.email || "";
    document.getElementById("inputName").value = name;

    const providerMap = {
        "google.com": "Google",
        "password": "E-mail e senha",
        "github.com": "GitHub",
        "facebook.com": "Facebook",
    };

    const providerId = user.providerData?.[0]?.providerId || "—";
    document.getElementById("profileProvider").innerText =
        providerMap[providerId] || providerId;

    const metadata = user.metadata;
    document.getElementById("profileCreatedAt").innerText =
        formatDate(metadata.creationTime);
    document.getElementById("profileLastLogin").innerText =
        formatDate(metadata.lastSignInTime);
}

function formatDate(isoString) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function onChangeName() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const newName = document.getElementById("inputName").value.trim();
    const currentName = user.displayName || "";
    const btnSave = document.getElementById("btnSaveName");

    btnSave.disabled = !newName || newName === currentName;
}

function saveName() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const newName = document.getElementById("inputName").value.trim();
    if (!newName) return;

    const btn = document.getElementById("btnSaveName");
    btn.disabled = true;
    btn.innerText = "Salvando...";

    user.updateProfile({ displayName: newName })
        .then(() => {
            document.querySelectorAll(".profileName").forEach((element) => {
                element.innerText = newName;
            });
            document.getElementById("welcome").innerText = newName;
            btn.innerText = "Salvar nome";
            showToast("success", "Nome atualizado com sucesso!");
        })
        .catch(() => {
            btn.disabled = false;
            btn.innerText = "Salvar nome";
            showToast("error", "Erro ao atualizar o nome.");
        });
}

function logout() {
    firebase.auth().signOut()
        .then(() => window.location.replace("../../login.html"))
        .catch((error) => console.error("Erro ao sair:", error));
}

function openDeleteConfirm() {
    document.getElementById("deleteConfirmOverlay").classList.add("open");
}

function closeDeleteConfirm() {
    document.getElementById("deleteConfirmOverlay").classList.remove("open");
}

function deleteAccount() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    closeDeleteConfirm();
    showLoading();

    firebase.firestore()
        .collection("transactions")
        .where("user.uid", "==", user.uid)
        .get()
        .then((snapshot) => {
            const batch = firebase.firestore().batch();
            snapshot.forEach((doc) => batch.delete(doc.ref));
            return batch.commit();
        })
        .then(() => user.delete())
        .then(() => {
            hideLoading();
            window.location.replace("/index.html");
        })
        .catch((error) => {
            hideLoading();

            if (error.code === "auth/requires-recent-login") {
                showToast("error", "Por segurança, faça login novamente antes de excluir.");
                setTimeout(() => {
                    firebase.auth().signOut().then(() => window.location.replace("/index.html"));
                }, 2500);
            } else {
                showToast("error", "Erro ao excluir a conta. Tente novamente.");
                console.error(error);
            }
        });
}

function showToast(type, message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.4s";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}