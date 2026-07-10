const itensBotao = document.querySelectorAll('.cardapio-item button');
const listaPedido = document.getElementById('lista-pedido');
const totalSpan = document.getElementById('total');
const limparPedido = document.getElementById('limpar-pedido');

let pedido = [];

function formatarPreco(valor) {
    return valor.toFixed(2).replace('.', ',');
}

function atualizarResumo() {
    const total = pedido.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
    totalSpan.textContent = formatarPreco(total);
}

function renderizarPedido() {
    listaPedido.innerHTML = '';

    if (pedido.length === 0) {
        const vazio = document.createElement('li');
        vazio.className = 'vazio';
        vazio.textContent = 'Nenhum item adicionado ainda.';
        listaPedido.appendChild(vazio);
        atualizarResumo();
        return;
    }

    pedido.forEach(item => {
        const li = document.createElement('li');

        const info = document.createElement('div');
        info.className = 'item-info';
        info.innerHTML = `<strong>${item.nome}</strong><span>${item.quantidade}x R$ ${formatarPreco(item.preco)}</span>`;

        const botaoRemover = document.createElement('button');
        botaoRemover.type = 'button';
        botaoRemover.textContent = 'Remover';
        botaoRemover.addEventListener('click', () => {
            removerItem(item.nome);
        });

        li.appendChild(info);
        li.appendChild(botaoRemover);
        listaPedido.appendChild(li);
    });

    atualizarResumo();
}

function adicionarAoPedido(nome, preco) {
    const itemExistente = pedido.find(item => item.nome === nome);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        pedido.push({ nome, preco, quantidade: 1 });
    }

    renderizarPedido();
}

function removerItem(nome) {
    pedido = pedido.filter(item => item.nome !== nome);
    renderizarPedido();
}

itensBotao.forEach(botao => {
    botao.addEventListener('click', () => {
        const item = botao.closest('.cardapio-item');
        const nome = item.dataset.name;
        const preco = Number(item.dataset.price);
        adicionarAoPedido(nome, preco);
    });
});

limparPedido.addEventListener('click', () => {
    pedido = [];
    renderizarPedido();
});

renderizarPedido();

// ==========================
// Modal / salvar pedidos (localStorage)
// ==========================

const abrirAppBtn = document.getElementById('abrir-app');
const appModal = document.getElementById('app-modal');
const fecharAppModal = document.getElementById('fechar-app-modal');

const clienteNomeInput = document.getElementById('cliente-nome');
const salvarPedidoBtn = document.getElementById('salvar-pedido-btn');
const limparClienteBtn = document.getElementById('limpar-cliente-btn');
const clientesList = document.getElementById('clientes-list');
const pedidosRecentesList = document.getElementById('pedidos-recentes-list');

// Helpers de storage
function carregarPedidosStorage() {
    try {
        const raw = localStorage.getItem('lanchonete_pedidos');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro ao ler pedidos do storage', e);
        return [];
    }
}

function salvarPedidosStorage(pedidos) {
    localStorage.setItem('lanchonete_pedidos', JSON.stringify(pedidos));
}

function carregarClientesStorage() {
    try {
        const raw = localStorage.getItem('lanchonete_clientes');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Erro ao ler clientes do storage', e);
        return [];
    }
}

function salvarClientesStorage(clientes) {
    localStorage.setItem('lanchonete_clientes', JSON.stringify(clientes));
}

// Render listas no modal
function renderClientesList() {
    const clientes = carregarClientesStorage();
    if (!clientesList) return;
    clientesList.innerHTML = '';
    if (clientes.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Nenhum cliente cadastrado.';
        li.style.color = '#666';
        clientesList.appendChild(li);
        return;
    }
    clientes.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        clientesList.appendChild(li);
    });
}

function formatData(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleString();
}

function renderPedidosRecentes() {
    const pedidos = carregarPedidosStorage();
    if (!pedidosRecentesList) return;
    pedidosRecentesList.innerHTML = '';
    if (pedidos.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Ainda não há pedidos salvos.';
        li.style.color = '#666';
        pedidosRecentesList.appendChild(li);
        return;
    }
    // Mostrar últimos 8 pedidos (do mais recente)
    const recentes = pedidos.slice(-8).reverse();
    recentes.forEach(p => {
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        const total = p.itens.reduce((s, it) => s + it.preco * it.quantidade, 0);
        li.innerHTML = `<strong>${p.cliente}</strong> — R$ ${formatarPreco(total)} <br/><small style="color:#666">${formatData(p.criadoEm)} · ${p.itens.length} itens</small>`;
        // detalhes toggle
        li.addEventListener('click', () => {
            const details = li.querySelector('.detalhes');
            if (details) {
                details.remove();
                return;
            }
            const det = document.createElement('div');
            det.className = 'detalhes';
            det.style.marginTop = '6px';
            det.style.fontSize = '0.9rem';
            det.style.color = '#444';
            det.innerHTML = p.itens.map(it => `${it.quantidade}x ${it.nome} — R$ ${formatarPreco(it.preco)}`).join('<br/>');
            li.appendChild(det);
        });
        pedidosRecentesList.appendChild(li);
    });
}

// Salvar pedido atual
function salvarPedidoAtual() {
    if (!pedido || pedido.length === 0) {
        alert('Não há itens no pedido para salvar.');
        return;
    }
    const nome = clienteNomeInput ? clienteNomeInput.value.trim() : '';
    if (!nome) {
        alert('Informe o nome do cliente antes de salvar.');
        return;
    }

    const pedidos = carregarPedidosStorage();
    const pedidoObj = {
        cliente: nome,
        itens: pedido.map(i => ({ nome: i.nome, preco: i.preco, quantidade: i.quantidade })),
        criadoEm: Date.now()
    };
    pedidos.push(pedidoObj);
    salvarPedidosStorage(pedidos);

    // atualizar lista de clientes (evita duplicatas)
    const clientes = carregarClientesStorage();
    if (!clientes.includes(nome)) {
        clientes.push(nome);
        salvarClientesStorage(clientes);
    }

    renderClientesList();
    renderPedidosRecentes();
    alert('Pedido salvo com sucesso!');
}

// Limpar input de cliente
function limparCliente() {
    if (clienteNomeInput) clienteNomeInput.value = '';
}

// Abrir modal e popular listas
if (abrirAppBtn && appModal) {
    abrirAppBtn.addEventListener('click', () => {
        // popular conteúdos do modal ao abrir
        renderClientesList();
        renderPedidosRecentes();
        if (clienteNomeInput) clienteNomeInput.value = '';
        appModal.setAttribute('aria-hidden', 'false');
    });
}

if (fecharAppModal && appModal) {
    fecharAppModal.addEventListener('click', () => {
        appModal.setAttribute('aria-hidden', 'true');
    });
}

// Fechar modal ao clicar fora do conteúdo
if (appModal) {
    appModal.addEventListener('click', (e) => {
        if (e.target === appModal) {
            appModal.setAttribute('aria-hidden', 'true');
        }
    });
}

if (salvarPedidoBtn) {
    salvarPedidoBtn.addEventListener('click', () => {
        salvarPedidoAtual();
    });
}

if (limparClienteBtn) {
    limparClienteBtn.addEventListener('click', () => {
        limparCliente();
    });
}
