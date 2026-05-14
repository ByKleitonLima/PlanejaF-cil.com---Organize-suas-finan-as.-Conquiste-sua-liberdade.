const transactionServices = {
    findByUser: () => {
        return callApi({
            method: "GET",
            url: "https://planejafacil-api-production.up.railway.app/home"
        })
    },

    findByUid: uid => {
        return callApi({
            method: "GET",
            url: `https://planejafacil-api-production.up.railway.app/home/${uid}`
        })
    },

    findById: uid => transactionServices.findByUid(uid),

    update: (docId, data) => {
        return callApi({
            method: "PATCH",
            url: `https://planejafacil-api-production.up.railway.app/home/${docId}`,
            params: data
        })
    },

    delete: docId => {
        return callApi({
            method: "DELETE",
            url: `https://planejafacil-api-production.up.railway.app/home/${docId}`,
        })
    },

    create: data => {
        return callApi({
            method: "POST",
            url: "https://planejafacil-api-production.up.railway.app/home",
            params: data
        })
    }
}

function callApi({ method, url, params }) {
    return new Promise(async (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        xhr.setRequestHeader("Authorization", "Bearer " + await firebase.auth().currentUser.getIdToken());
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                const json = JSON.parse(this.responseText);
                if (this.status != 200) {
                    reject(json);
                } else {
                    resolve(json);
                }
            }
        }
        xhr.send(JSON.stringify(params));
    })
}