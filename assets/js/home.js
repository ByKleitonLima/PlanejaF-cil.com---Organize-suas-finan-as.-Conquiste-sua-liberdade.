firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.replace("../../login.html");
        return;
    }

    const name = user.displayName || "Usuário";
    document.getElementById("welcome").innerText = `${name}`;

    const foto = user.photoURL;
    const imgEl = document.getElementById("profileImage");
    if (foto && imgEl) imgEl.src = foto;
});

function setActiveMenu() {
    const links = document.querySelectorAll('.menu li a');
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPage.includes(href.replace('./', ''))) {
            link.classList.add('active');
        }
    });
}

function setPageTitle() {
    const titles = {
        'home.html': 'Dashboard',
        'transactions.html': 'Transações',
        'profile.html': 'Profile'
    };

    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.innerText = titles[currentPage] || 'Dashboard';
}

const mesesNome = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

function atualizarLabelMes() {
    const label = document.getElementById("labelMes");
    if (label) label.innerText = `${mesesNome[mesAtual]} ${anoAtual}`;
}

function abrirSeletorMes() {
    const existente = document.getElementById("mesPicker");
    if (existente) {
        existente.remove();
        document.getElementById("mesBackdrop")?.remove();
        return;
    }

    const backdrop = document.createElement("div");
    backdrop.id = "mesBackdrop";
    backdrop.className = "mes-picker-backdrop";
    backdrop.onclick = () => {
        document.getElementById("mesPicker")?.remove();
        backdrop.remove();
    };

    const picker = document.createElement("div");
    picker.id = "mesPicker";
    picker.innerHTML = `
        <div class="mes-picker-header">
            <button type="button" onclick="mudarAno(-1)">&#8592;</button>
            <span id="anoLabel">${anoAtual}</span>
            <button type="button" onclick="mudarAno(1)">&#8594;</button>
        </div>
        <div class="mes-picker-grid" id="mesGrid"></div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(picker);
    renderizarMeses();
}

function renderizarMeses() {
    const grid = document.getElementById("mesGrid");
    if (!grid) return;

    grid.innerHTML = mesesNome.map((m, i) => `
        <button 
            type="button"
            class="mes-item ${i === mesAtual ? 'mes-ativo' : ''}" 
            onclick="selecionarMes(${i})">
            ${m.slice(0, 3)}
        </button>
    `).join("");

    document.getElementById("anoLabel").innerText = anoAtual;
}

function mudarAno(direcao) {
    anoAtual += direcao;
    renderizarMeses();
}

function selecionarMes(index) {
    mesAtual = index;
    atualizarLabelMes();
    document.getElementById("mesPicker")?.remove();
    document.getElementById("mesBackdrop")?.remove();

    const user = firebase.auth().currentUser;
    if (user) loadTransactions(user);
}

document.addEventListener("click", e => {
    const picker = document.getElementById("mesPicker");
    const btn = document.getElementById("btnMes");
    if (picker && !picker.contains(e.target) && btn && !btn.contains(e.target)) {
        picker.remove();
        document.getElementById("mesBackdrop")?.remove();
    }
});

function filtrarTransacoesPorMes(transactions) {
    return transactions.filter(t => {
        if (!t.date?.seconds) return false;
        const data = new Date(t.date.seconds * 1000);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
}

function exportarExcel() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    transactionServices.findByUser(user).then(transactions => {
        const doMes = filtrarTransacoesPorMes(transactions);

        const receitas = doMes
            .filter(t => t.type === "income")
            .map(t => ({
                Descrição: t.description || "-",
                Categoria: t.transactionType || "-",
                Moeda: t.money?.currency || "BRL",
                Valor: t.money?.value || 0,
                Data: t.date?.seconds
                    ? new Date(t.date.seconds * 1000).toLocaleDateString("pt-BR")
                    : "-"
            }));

        const despesas = doMes
            .filter(t => t.type === "expense")
            .map(t => ({
                Descrição: t.description || "-",
                Categoria: t.transactionType || "-",
                Moeda: t.money?.currency || "BRL",
                Valor: t.money?.value || 0,
                Data: t.date?.seconds
                    ? new Date(t.date.seconds * 1000).toLocaleDateString("pt-BR")
                    : "-"
            }));

        const wb = XLSX.utils.book_new();

        const wsReceitas = XLSX.utils.json_to_sheet(
            receitas.length ? receitas : [{ Descrição: "Nenhuma receita no mês" }]
        );
        const wsDespesas = XLSX.utils.json_to_sheet(
            despesas.length ? despesas : [{ Descrição: "Nenhuma despesa no mês" }]
        );

        XLSX.utils.book_append_sheet(wb, wsReceitas, "Receitas");
        XLSX.utils.book_append_sheet(wb, wsDespesas, "Despesas");

        const nomeMes = mesesNome[mesAtual];
        XLSX.writeFile(wb, `Relatorio_${nomeMes}_${anoAtual}.xlsx`);

    }).catch(() => {
        showToast('error', 'Erro ao gerar relatório');
    });
}

let cardAtual = 0;

function irParaCard(index) {
    const track = document.getElementById("carouselTrack");
    const card = document.querySelector(".card");
    const cards = document.querySelectorAll(".card");
    const dots = document.querySelectorAll(".dot");

    if (!track || !card || !cards.length) return;

    const limite = cards.length - 1;
    const indexSeguro = Math.max(0, Math.min(index, limite));
    const largura = card.offsetWidth + 16;

    cardAtual = indexSeguro;
    track.style.transform = `translateX(-${largura * indexSeguro}px)`;

    dots.forEach((dot, i) => {
        dot.classList.toggle("dot-ativo", i === indexSeguro);
    });
}

function iniciarCarrossel() {
    const track = document.getElementById("carouselTrack");
    const cards = document.querySelectorAll(".card");

    if (!track || !cards.length) return;

    cardAtual = 0;
    irParaCard(0);

    let startX = 0;
    let isDragging = false;

    track.addEventListener("touchstart", e => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    track.addEventListener("touchend", e => {
        const endX = e.changedTouches[0].clientX;
        handleSwipe(startX, endX);
    }, { passive: true });

    track.addEventListener("mousedown", e => {
        isDragging = true;
        startX = e.clientX;
    });

    document.addEventListener("mouseup", e => {
        if (!isDragging) return;
        isDragging = false;
        const endX = e.clientX;
        handleSwipe(startX, endX);
    });

    function handleSwipe(start, end) {
        const diff = start - end;
        if (Math.abs(diff) < 50) return;

        if (diff > 0 && cardAtual < cards.length - 1) {
            irParaCard(cardAtual + 1);
        }
        if (diff < 0 && cardAtual > 0) {
            irParaCard(cardAtual - 1);
        }
    }
}

function atualizarCards(transactions) {
    const doMes = filtrarTransacoesPorMes(transactions);
    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const receita = doMes
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.money?.value || 0), 0);

    const despesa = doMes
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.money?.value || 0), 0);

    const saldo = receita - despesa;

    const elSaldo = document.getElementById("cardSaldo");
    const elReceita = document.getElementById("cardReceita");
    const elDespesa = document.getElementById("cardDespesa");

    if (elSaldo) {
        elSaldo.innerText = fmt(saldo);
        elSaldo.style.color = "#2d2d2d";
    }
    if (elReceita) elReceita.innerText = fmt(receita);
    if (elDespesa) elDespesa.innerText = fmt(despesa);
}

function init() {
    setActiveMenu();
    setPageTitle();
    atualizarLabelMes();
    iniciarCarrossel();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

const CATEGORY_CONFIG = {
    'Acomodação': { color: '#2d2d2d' },
    'Alimentação': { color: '#2d2d2d' },
    'Supermercado': { color: '#2d2d2d' },
    'Transporte': { color: '#2d2d2d' },
    'Estudos': { color: '#2d2d2d' },
    'Emprestimo': { color: '#2d2d2d' },
    'Salário': { color: '#2d2d2d' },
    'Outros': { color: '#2d2d2d' },
};

const CATEGORY_DEFAULT = { icon: '📌', color: '#B4B2A9' };

function updateCategoryCard(allTransactions) {
    const list = document.getElementById('categoryList');
    const monthLabel = document.getElementById('categoryMonthLabel');
    if (!list) return;

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    if (monthLabel) monthLabel.textContent = `${meses[mesAtual]} ${anoAtual}`;

    const doMes = (allTransactions || []).filter(t => {
        if (!t.date?.seconds) return false;
        const d = new Date(t.date.seconds * 1000);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });

    const totalIncome = doMes
        .filter(t => t.type === 'income')
        .reduce((s, t) => s + (t.money?.value || 0), 0);

    const totalExpense = doMes
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + (t.money?.value || 0), 0);

    const balance = totalIncome - totalExpense;
    const positiveBalance = Math.max(balance, 0);
    const totalBase = totalIncome + totalExpense + positiveBalance;

    const totals = {};
    doMes
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const cat = t.transactionType || 'Outros';
            totals[cat] = (totals[cat] || 0) + (t.money?.value || 0);
        });

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
        list.innerHTML = `
            <div class="category-empty">
                <p>Nenhum gasto registrado neste mês</p>
            </div>`;
        return;
    }

    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    list.innerHTML = entries.map(([cat, value]) => {
        const pct = totalBase > 0 ? Math.round((value / totalBase) * 100) : 0;

        return `
            <div class="category-item">
                <div class="category-item-header">
                    <span class="category-name">${cat}</span>
                    <span class="category-percent">${pct}%</span>
                </div>
                <div class="category-bar-track">
                    <div class="category-bar-fill" style="width: ${pct}%;"></div>
                </div>
                <span class="category-value">${fmt(value)}</span>
            </div>`;
    }).join('');
}

const iconMap = {
    '🎉': '../../assets/imgs/icons/fireworks.png',
    '⚠️': '../../assets/imgs/icons/exclamation.png',
    '📈': '../../assets/imgs/icons/increase.png',
    '📉': '../../assets/imgs/icons/trend.png',
    '🛒': '../../assets/imgs/icons/grocery-store.png',
    '💡': '../../assets/imgs/icons/idea.png',
    '✨': '../../assets/imgs/icons/star-inside-circle.png',
    '💰': '../../assets/imgs/icons/money.png',
    '🏆': '../../assets/imgs/icons/trophy.png',
    '🔥': '../../assets/imgs/icons/fire.png',
    '📭': '../../assets/imgs/icons/default.png'
};

async function updateSmartSummary(allTransactions) {
    const content = document.getElementById('smartSummaryContent');
    const monthEl = document.getElementById('smartSummaryMonth');
    if (!content) return;

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    if (monthEl) monthEl.textContent = `${meses[mesAtual]} ${anoAtual}`;

    content.innerHTML = `
        <div class="smart-summary-loading">
            <div class="smart-loading-dots">
                <span></span><span></span><span></span>
            </div>
            <p>Analisando suas finanças...</p>
        </div>`;

    const doMes = (allTransactions || []).filter(t => {
        if (!t.date?.seconds) return false;
        const d = new Date(t.date.seconds * 1000);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });

    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    const doMesAnterior = (allTransactions || []).filter(t => {
        if (!t.date?.seconds) return false;
        const d = new Date(t.date.seconds * 1000);
        return d.getMonth() === mesAnterior && d.getFullYear() === anoAnterior;
    });

    const income = doMes.filter(t => t.type === 'income').reduce((s, t) => s + (t.money?.value || 0), 0);
    const expense = doMes.filter(t => t.type === 'expense').reduce((s, t) => s + (t.money?.value || 0), 0);
    const balance = income - expense;

    const incomeAnterior = doMesAnterior.filter(t => t.type === 'income').reduce((s, t) => s + (t.money?.value || 0), 0);
    const expenseAnterior = doMesAnterior.filter(t => t.type === 'expense').reduce((s, t) => s + (t.money?.value || 0), 0);

    const categorias = {};
    doMes.filter(t => t.type === 'expense').forEach(t => {
        const cat = t.transactionType || 'Outros';
        categorias[cat] = (categorias[cat] || 0) + (t.money?.value || 0);
    });

    const topCategorias = Object.entries(categorias)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, val]) => `${cat}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (doMes.length === 0) {
        content.innerHTML = `
            <div class="smart-insight-item" style="animation-delay: 0s">
                <span class="smart-insight-emoji">📭</span>
                <span class="smart-insight-text">Nenhuma transação registrada em <b>${meses[mesAtual]}</b>. Comece registrando suas receitas e despesas!</span>
            </div>`;
        return;
    }

    const hoje = new Date().toDateString();
    const cacheKey = `smartSummary_${mesAtual}_${anoAtual}`;

    try {
        const cacheRaw = sessionStorage.getItem(cacheKey);
        if (cacheRaw) {
            const cache = JSON.parse(cacheRaw);
            if (cache.data === hoje && cache.insights?.length) {
                renderInsights(cache.insights, content);
                return;
            }
        }
    } catch (_) { }

    const contexto = {
        mes: `${meses[mesAtual]} ${anoAtual}`,
        receita: fmt(income),
        despesa: fmt(expense),
        saldo: fmt(balance),
        totalTransacoes: doMes.length,
        receitaAnterior: incomeAnterior > 0 ? fmt(incomeAnterior) : null,
        despesaAnterior: expenseAnterior > 0 ? fmt(expenseAnterior) : null,
        topCategorias: topCategorias.length > 0 ? topCategorias : null,
    };

    try {
        const token = await firebase.auth().currentUser.getIdToken();

        const response = await fetch('https://planejafacil-api-production.up.railway.app/ai/summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contexto })
        });

        const data = await response.json();

        if (!data.summary?.insights?.length) throw new Error('Resposta inválida do servidor');

        const insights = data.summary.insights;

        sessionStorage.setItem(cacheKey, JSON.stringify({ data: hoje, insights }));

        renderInsights(insights, content);

    } catch (err) {
        console.error('Erro no resumo inteligente:', err);

        const insights = gerarInsightsLocais({
            income, expense, balance,
            incomeAnterior, expenseAnterior,
            topCategorias, doMes, meses
        });

        renderInsights(insights, content);
    }
}

function renderInsights(insights, content) {
    content.innerHTML = insights.map((item, i) => {
        const icon = iconMap[item.emoji] || '../../assets/imgs/icons/default.png';
        return `
            <div class="smart-insight-item" style="animation-delay: ${i * 0.12}s">
                <img
                    class="smart-insight-icon"
                    src="${icon}"
                    alt="${item.emoji}"
                >
                <span class="smart-insight-text">${item.texto}</span>
            </div>
        `;
    }).join('');
}

function gerarInsightsLocais({ income, expense, balance, incomeAnterior, expenseAnterior, topCategorias, doMes, meses }) {
    const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const insights = [];

    if (balance >= 0) {
        insights.push({ emoji: '🎉', texto: `Saldo positivo de <b>${fmt(balance)}</b> este mês. Continue assim!` });
    } else {
        insights.push({ emoji: '⚠️', texto: `Saldo negativo de <b>${fmt(Math.abs(balance))}</b>. Tente reduzir os gastos no próximo mês.` });
    }

    if (expenseAnterior > 0 && expense > 0) {
        const diff = ((expense - expenseAnterior) / expenseAnterior) * 100;
        if (diff > 0) {
            insights.push({ emoji: '📈', texto: `Gastos <b>${Math.abs(diff).toFixed(0)}% maiores</b> que no mês anterior (${fmt(expenseAnterior)}).` });
        } else {
            insights.push({ emoji: '📉', texto: `Gastos <b>${Math.abs(diff).toFixed(0)}% menores</b> que no mês anterior. Ótimo controle!` });
        }
    } else {
        insights.push({ emoji: '💡', texto: `Você registrou <b>${doMes.length} transações</b> este mês.` });
    }

    if (topCategorias && topCategorias.length > 0) {
        const top = topCategorias[0];
        insights.push({ emoji: '🛒', texto: `Maior gasto: <b>${top}</b>.` });
    } else {
        insights.push({ emoji: '✨', texto: `Receita de <b>${fmt(income)}</b> registrada este mês.` });
    }

    return insights;
}