const form = {
    date: () => document.getElementById('date'),
    currency: () => document.getElementById('currency'),
    dateRequiredError: () => document.getElementById('date-required-error'),
    value: () => document.getElementById('value'),
    valueRequiredError: () => document.getElementById('value-required-error'),
    valueLessEqualToZeroError: () => document.getElementById('value-less-equal-to-zero-error'),
    saveButton: () => document.getElementById('save-button'),
    description: () => document.getElementById('transaction-description'),
    transactionType: () => document.getElementById('transactionType'),
    transactionTypeRequiredError: () => document.getElementById('transactionType-required-error'),
    titleRequiredError: () => document.getElementById('title-required-error')
};

firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loadTransactions(user);
    } else {
        window.location.href = "../../login.html";
    }
});

function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    const icons = { success: '✓', error: '✕', warning: '!' };
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-icon">${icons[type]}</div><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

function loadTransactions(user) {
    transactionServices.findByUser(user)
        .then(transactions => {
            const container = document.getElementById('transaction');
            const accountantNumber = document.querySelector(".accountant .number");
            const itemNull = document.querySelector(".item-null");

            if (container) container.innerHTML = "";
            if (accountantNumber) accountantNumber.textContent = transactions.length;
            if (itemNull) itemNull.style.display = transactions.length > 0 ? "none" : "flex";

            updateDashboard(transactions);
            updateCategoryCard(transactions);
            updateSmartSummary(transactions)

            if (container) {
                transactions.forEach(transaction => {
                    addTransactionToScreen(transaction.uid, transaction);
                });
            }
        })
        .catch(error => {
            console.error("Erro ao carregar transações:", error);
            showToast('error', 'Erro ao carregar transações');
        });
}

function updateDashboard(transactions) {
    if (!transactions || transactions.length === 0) {
        const cardSaldo = document.getElementById('cardSaldo');
        const cardReceita = document.getElementById('cardReceita');
        const cardDespesa = document.getElementById('cardDespesa');
        const dashIncomePercent = document.getElementById('dashIncomePercent');
        const dashExpensePercent = document.getElementById('dashExpensePercent');
        const dashBalancePercent = document.getElementById('dashBalancePercent');
        if (cardSaldo) { cardSaldo.textContent = 'R$ 0,00'; cardSaldo.style.color = '#2d2d2d'; }
        if (cardReceita) cardReceita.textContent = 'R$ 0,00';
        if (cardDespesa) cardDespesa.textContent = 'R$ 0,00';
        if (dashIncomePercent) dashIncomePercent.textContent = '0%';
        if (dashExpensePercent) dashExpensePercent.textContent = '0%';
        if (dashBalancePercent) dashBalancePercent.textContent = '0%';
        drawDonut(0, 0, 0);
        return;
    }

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.money?.value || 0), 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.money?.value || 0), 0);

    const balance = income - expense;

    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const cardSaldo = document.getElementById('cardSaldo');
    const cardReceita = document.getElementById('cardReceita');
    const cardDespesa = document.getElementById('cardDespesa');

    if (cardSaldo) { cardSaldo.textContent = fmt(balance); cardSaldo.style.color = '#2d2d2d'; }
    if (cardReceita) cardReceita.textContent = fmt(income);
    if (cardDespesa) cardDespesa.textContent = fmt(expense);

    const positiveBalance = Math.max(balance, 0);
    const total = income + expense + positiveBalance;

    const incomePercent = total > 0 ? Math.round((income / total) * 100) : 0;
    const expensePercent = total > 0 ? Math.round((expense / total) * 100) : 0;
    const balancePercent = total > 0 ? Math.round((positiveBalance / total) * 100) : 0;

    const dashIncomePercent = document.getElementById('dashIncomePercent');
    const dashExpensePercent = document.getElementById('dashExpensePercent');
    const dashBalancePercent = document.getElementById('dashBalancePercent');

    if (dashIncomePercent) dashIncomePercent.textContent = `${incomePercent}%`;
    if (dashExpensePercent) dashExpensePercent.textContent = `${expensePercent}%`;
    if (dashBalancePercent) dashBalancePercent.textContent = `${balancePercent}%`;

    drawDonut(income, expense, positiveBalance);
}

function drawDonut(income, expense, balance) {
    const canvas = document.getElementById('donutChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = Math.min(canvas.width, canvas.height) * 0.35;
    const stroke = Math.min(canvas.width, canvas.height) * 0.08;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const values = [income, expense, balance];
    const colors = ['#36B20D', '#EF3131', '#E5E6E5'];
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total <= 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#E5E6E5';
        ctx.lineWidth = stroke;
        ctx.stroke();
        return;
    }

    const gap = 0.04;
    let start = -Math.PI / 2;

    values.forEach((value, index) => {
        if (value <= 0) return;
        const angle = (value / total) * (Math.PI * 2 - gap * values.length);
        ctx.beginPath();
        ctx.arc(cx, cy, r, start, start + angle);
        ctx.strokeStyle = colors[index];
        ctx.lineWidth = stroke;
        ctx.lineCap = 'butt';
        ctx.stroke();
        start += angle + gap;
    });
}

let selectedType = null;
let currentEditId = null;

const modal = document.getElementById('modalOverlay');
const openBtn = document.getElementById('openModalBtn');
const closeBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancel-button');

if (openBtn) {
    openBtn.addEventListener('click', () => {
        currentEditId = null;
        clearForm();
        const modalTitle = document.querySelector('.modal-header h3');
        if (modalTitle) modalTitle.textContent = "NOVO LANÇAMENTO";
        if (modal) modal.style.display = 'flex';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        currentEditId = null;
        if (modal) modal.style.display = 'none';
    });
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        currentEditId = null;
        if (modal) modal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (modal && event.target === modal) {
        currentEditId = null;
        modal.style.display = 'none';
    }
});

function openModal() {
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    currentEditId = null;
    if (modal) modal.style.display = 'none';
}

function addTransactionToScreen(docId, data) {
    const container = document.getElementById('transaction');
    if (!container) return;

    const item = document.createElement('li');
    item.addEventListener('click', () => openEditModal(docId, data));

    let date = '';
    if (data.date?.seconds) {
        date = new Date(data.date.seconds * 1000).toLocaleDateString('pt-BR');
    }

    const typeClass = data.type === 'income' ? 'income' : 'expense';
    const amount = typeof data.money?.value === 'number' ? data.money.value : 0;

    item.innerHTML = `
        <div class="item-name">
            <b>${data.description || 'Sem título'}</b>
            <p>${data.transactionType || 'Outros'}</p>
            <p>${date}</p>
        </div>
        <div class="item-left">
            <div class="price">
                <p class="value">
                    ${data.money?.currency || 'BRL'} 
                    <b>${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>
                </p>
            </div>
            <div class="${typeClass}"></div>
            <div class="trash" onclick="event.stopPropagation(); deleteTransaction('${docId}')">
                <div class="trash-lid"></div>
                <div class="trash-body">
                    <div class="trash-line"></div>
                    <div class="trash-line"></div>
                    <div class="trash-line"></div>
                </div>
            </div>
        </div>
    `;

    container.appendChild(item);
}

function deleteTransaction(docId) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
        <div class="confirm-box">
            <p>Excluir transação?</p>
            <span>Essa ação não pode ser desfeita.</span>
            <div class="confirm-buttons">
                <button class="confirm-btn-cancel" id="confirmCancel">Cancelar</button>
                <button class="confirm-btn-delete" id="confirmDelete">Excluir</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('confirmCancel').addEventListener('click', () => overlay.remove());

    document.getElementById('confirmDelete').addEventListener('click', () => {
        overlay.remove();
        transactionServices.delete(docId)
            .then(() => {
                showToast('success', 'Transação excluída!');
                loadTransactions(firebase.auth().currentUser);
            })
            .catch(error => {
                console.error("Erro ao excluir:", error);
                showToast('error', 'Erro ao excluir transação');
            });
    });
}

function openEditModal(docId, data) {
    const currentUser = firebase.auth().currentUser;

    if (!currentUser || data.user.uid !== currentUser.uid) {
        showToast('warning', 'Sem permissão para editar esta transação');
        return;
    }

    transactionServices.findById(docId)
        .then(transaction => {
            currentEditId = docId;
            const modalTitle = document.querySelector('.modal-header h3');
            if (modalTitle) modalTitle.textContent = 'EDITAR LANÇAMENTO';

            const descEl = form.description();
            if (descEl) descEl.value = transaction.description || '';

            const transactionTypeSelect = document.querySelector('.transactionStyle');
            if (transactionTypeSelect) transactionTypeSelect.value = transaction.transactionType || '';

            const curEl = form.currency();
            if (curEl) curEl.value = transaction.money?.currency || 'BRL';

            const valEl = form.value();
            if (valEl) valEl.value = transaction.money?.value || '';

            if (transaction.date?.seconds) {
                const d = new Date(transaction.date.seconds * 1000);
                const dateEl = form.date();
                if (dateEl) dateEl.value = d.toISOString().split('T')[0];
            }

            selectedType = transaction.type || '';

            const saveBtn = form.saveButton();
            if (saveBtn) saveBtn.disabled = false;
            if (modal) modal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Erro ao buscar transação:', error);
            showToast('error', 'Erro ao carregar transação');
        });
}

function saveTransaction() {
    if (currentEditId) {
        saveEdit();
        return;
    }

    if (!selectedType) {
        showToast('warning', 'Selecione Entrada ou Saída');
        return;
    }

    const descEl = form.description();
    if (!descEl || !descEl.value.trim()) {
        const errEl = form.titleRequiredError();
        if (errEl) errEl.style.display = "flex";
        showToast('warning', 'Informe uma descrição');
        return;
    }

    transactionServices.create(createTransaction())
        .then(() => {
            clearForm();
            closeModal();
            showToast('success', 'Transação salva!');
            loadTransactions(firebase.auth().currentUser);
        })
        .catch(() => showToast('error', 'Erro ao salvar transação'));
}

function saveEdit() {
    const currentUser = firebase.auth().currentUser;

    if (!currentUser) {
        showToast('error', 'Usuário não autenticado');
        return;
    }

    const descEl = form.description();
    const typeEl = form.transactionType();
    const curEl = form.currency();
    const valEl = form.value();
    const dateEl = form.date();

    const description = descEl?.value.trim();
    const transactionType = typeEl?.value;
    const currency = curEl?.value;
    const value = parseFloat(valEl?.value);
    const dateInput = dateEl?.value;

    if (!description || !transactionType || !dateInput || value <= 0 || !selectedType) {
        showToast('warning', 'Preencha todos os campos corretamente');
        return;
    }

    transactionServices.update(currentEditId, {
        description,
        transactionType,
        type: selectedType,
        money: { currency, value },
        date: firebase.firestore.Timestamp.fromDate(new Date(dateInput + "T12:00:00"))
    })
        .then(() => {
            clearForm();
            closeModal();
            showToast('success', 'Transação atualizada!');
            loadTransactions(currentUser);
        })
        .catch(error => showToast('error', 'Erro ao salvar: ' + error.message));
}

function createTransaction() {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    return {
        description: form.description()?.value,
        transactionType: form.transactionType()?.value,
        type: selectedType,
        money: {
            currency: form.currency()?.value,
            value: parseFloat(form.value()?.value)
        },
        date: firebase.firestore.Timestamp.fromDate(
            new Date(form.date()?.value + "T12:00:00")
        ),
        user: { uid: user.uid }
    };
}

function clearForm() {
    const desc = form.description();
    const val = form.value();
    const dt = form.date();
    const cur = form.currency();

    if (desc) desc.value = "";
    if (val) val.value = "";
    if (dt) dt.value = "";
    if (cur) cur.value = "BRL";

    selectedType = null;
    currentEditId = null;

    document.querySelectorAll('.btn-type').forEach(btn => btn.classList.remove('active'));
    toggleSaveButtonDisable();
}

function selectTransactionType(type) {
    selectedType = type;

    document.querySelectorAll('.btn-type').forEach(btn => btn.classList.remove('active'));

    const target = document.querySelector(type === 'income' ? '.entrance' : '.exit');
    if (target) target.classList.add('active');

    toggleSaveButtonDisable();
}

function onChangeDescription() {
    const desc = form.description();
    if (!desc) return;
    const errEl = form.titleRequiredError();
    if (errEl) errEl.style.display = desc.value.trim() ? "none" : "flex";
    toggleSaveButtonDisable();
}

function onChangeTransactionType() {
    const typeEl = form.transactionType();
    if (!typeEl) return;
    const errEl = form.transactionTypeRequiredError();
    if (errEl) errEl.style.display = typeEl.value ? "none" : "flex";
    toggleSaveButtonDisable();
}

function onChangeDate() {
    const dateEl = form.date();
    if (!dateEl) return;
    const errEl = form.dateRequiredError();
    if (errEl) errEl.style.display = dateEl.value ? "none" : "flex";
    toggleSaveButtonDisable();
}

function onChangeValue() {
    const valEl = form.value();
    if (!valEl) return;
    const value = valEl.value;
    const reqErr = form.valueRequiredError();
    const zeroErr = form.valueLessEqualToZeroError();
    if (reqErr) reqErr.style.display = value ? "none" : "flex";
    if (zeroErr) zeroErr.style.display = value <= 0 ? "flex" : "none";
    toggleSaveButtonDisable();
}

function toggleSaveButtonDisable() {
    const btn = form.saveButton();
    if (btn) btn.disabled = !isFormValid();
}

function isFormValid() {
    const desc = form.description();
    const type = form.transactionType();
    const date = form.date();
    const val = form.value();

    if (!desc || !type || !date || !val) return false;

    return Boolean(desc.value.trim() && type.value && date.value && val.value > 0 && selectedType);
}