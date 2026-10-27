const vendedorLogado = JSON.parse(localStorage.getItem("sgl_vendedor"));
if (!vendedorLogado) {
  window.location.href = "index.html";
} else {
  window.addEventListener("DOMContentLoaded", () => {
    const sellerNameEl = document.querySelector("#seller-name");
    if (sellerNameEl) sellerNameEl.textContent = vendedorLogado.nome;
  });

}

"use strict";
const layout = document.querySelector("#app-layout");
const menuToggle = document.querySelector("#menu-toggle");
const entityButtons = [...document.querySelectorAll(".nav-item")];
const crudButtons = [...document.querySelectorAll(".crud-button")];
const crudToolbar = document.querySelector(".crud-toolbar");
const pageTitle = document.querySelector("#page-title");
const breadcrumb = document.querySelector("#breadcrumb-current");
const pageDescription = document.querySelector("#page-description");
const workspaceTitle = document.querySelector("#workspace-title");
const workspaceSubtitle = document.querySelector("#workspace-subtitle");
const operationTitle = document.querySelector("#operation-title");
const operationDescription = document.querySelector("#operation-description");
const recordCount = document.querySelector("#record-count");
const operationContent = document.querySelector("#operation-content");
const modalDelete = document.querySelector("#modal-delete");
const modalDeleteCancel = document.querySelector("#modal-delete-cancel");
const modalDeleteConfirm = document.querySelector("#modal-delete-confirm");
const modalDetail = document.querySelector("#modal-detail");
const detailModalTitle = document.querySelector("#detail-modal-title");
const detailModalContent = document.querySelector("#detail-modal-content");
const modalDetailClose = document.querySelector("#modal-detail-close");
const entities = {
  "produtos": {
    label: "Produtos", singular: "produto", description: "Visualize e gerencie os produtos cadastrados.",
    allowInsert: true,
    fields: [
      ["nome", "Nome do produto", "text", true],
      ["id_categoria", "ID da categoria", "number", true],
      ["preco_unitario", "Preço unitário (R$)", "number", true],
      ["estoque", "Estoque", "number", true],
      ["descricao", "Descrição", "textarea", false],
      ["ativo", "Ativo", "select", true, ["Ativo", "Desativado"]]
    ],
    columns: ["ID", "Nome", "Categoria", "Preço", "Estoque", "Status", "Ações"]
  },
  "categorias": {
    label: "Categorias", singular: "categoria", description: "Organize os produtos por categoria.",
    allowInsert: true,
    fields: [
      ["nome", "Nome da categoria", "text", true],
      ["descricao", "Descrição", "textarea", false],
      ["id_categoria_pai", "ID da categoria principal (opcional)", "number", false]
    ],
    columns: ["ID", "Nome", "Descrição", "Categoria principal", "Ações"]
  },
  "clientes": {
    label: "Clientes", singular: "cliente", description: "Gerencie o cadastro de clientes.",
    allowInsert: true,
    fields: [
      ["nome", "Nome completo", "text", true],
      ["cpf", "CPF", "text", true],
      ["email", "E-mail", "email", true],
      ["telefone", "Telefone", "tel", false],
      ["status", "Status", "select", true, ["Ativo", "Desativado"]]
    ],
    columns: ["ID", "Nome", "CPF", "E-mail", "Telefone", "Status", "Ações"]
  },
  "fornecedores": {
    label: "Fornecedores", singular: "fornecedor", description: "Gerencie os fornecedores vinculados à loja.",
    allowInsert: true,
    fields: [
      ["nome", "Nome do fornecedor", "text", true],
      ["cnpj", "CNPJ", "text", true],
      ["email", "E-mail", "email", true],
      ["telefone", "Telefone", "tel", false],
      ["ativo", "Ativo", "select", true, ["Ativo", "Desativado"]]
    ],
    columns: ["ID", "Nome", "CNPJ", "E-mail", "Telefone", "Status", "Ações"]
  },
  "pedidos": {
    label: "Pedidos", singular: "pedido", description: "Consulte, edite e gerencie pedidos, itens e pagamentos.",
    allowInsert: true,
    fields: [
      ["id_cliente", "ID do cliente", "number", true],
      ["data_emissao", "Data de Emissão (Opcional)", "datetime-local", false],
      ["status_pedido", "Status do Pedido", "select", true, ["PENDENTE", "PAGO", "FINALIZADO", "CANCELADO"]]
    ],
    columns: ["ID", "Cliente", "Data", "Valor total", "Status", "Ações"]
  },
  "fornecedor-produto": {
    label: "Fornecedor / produto", singular: "vínculo fornecedor-produto", description: "Associe fornecedores aos produtos e defina custo e prazo.",
    allowInsert: true,
    fields: [
      ["id_fornecedor", "ID do fornecedor", "number", true],
      ["id_produto", "ID do produto", "number", true],
      ["quantidade", "Quantidade fornecida", "number", true],
      ["preco_custo", "Preço de custo (R$)", "number", true],
      ["prazo_entrega_dias", "Prazo de entrega (dias)", "number", true]
    ],
    columns: ["Fornecedor", "Produto", "Quantidade", "Custo", "Prazo (dias)", "Ações"]
  },
  "vendas-cliente": {
    label: "Vendas por Cliente", singular: "relatório de vendas por cliente", description: "Consulta agregada de vendas agrupada por cliente com filtros.",
    allowInsert: false,
    columns: ["ID Cliente", "Nome do Cliente", "Total de Pedidos", "Valor Gasto Total", "Ações"]
  },
  "produtos-vendidos": {
    label: "Produtos Vendidos", singular: "relatório de produtos vendidos", description: "Consulta agregada de quantidade vendida e receita por produto.",
    allowInsert: false,
    columns: ["ID Produto", "Nome do Produto", "Qtd Total Vendida", "Receita Total", "Ações"]
  },
  "relatorio-consolidado": {
    label: "Relatório Consolidado", singular: "relatório consolidado", description: "Relatório geral consolidado de pedidos e clientes alimentado por visão (VIEW).",
    allowInsert: false,
    columns: ["ID Pedido", "Data", "Cliente", "CPF", "Valor Total", "Status", "Ações"]
  }

};

let currentEntity = "produtos";
let currentAction = "list";
if (menuToggle && layout) {
  menuToggle.addEventListener("click", () => {
    const collapsed = layout.classList.toggle("is-collapsed");
    menuToggle.setAttribute("aria-expanded", String(!collapsed));
    menuToggle.setAttribute("aria-label", collapsed ? "Expandir menu" : "Recolher menu");
  });

}

entityButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentEntity = button.dataset.entity;
    entityButtons.forEach(item => item.classList.toggle("is-active", item === button));
    renderEntity();
    renderAction("list");
  });

});

crudButtons.forEach(button => button.addEventListener("click", () => renderAction(button.dataset.action)));
if (modalDeleteCancel) modalDeleteCancel.addEventListener("click", () => modalDelete.hidden = true);
if (modalDeleteConfirm) modalDeleteConfirm.addEventListener("click", () => modalDelete.hidden = true);
if (modalDetailClose) modalDetailClose.addEventListener("click", () => modalDetail.hidden = true);
function openDeleteModal() {
  if (modalDelete) modalDelete.hidden = false;
}

function openDetailModal(title, dataObj) {
  if (!modalDetail) return;
  detailModalTitle.textContent = title;
  detailModalContent.innerHTML = Object.entries(dataObj).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join("");
  modalDetail.hidden = false;
}

function renderEntity() {
  const entity = entities[currentEntity];
  if (!entity) return;
  pageTitle.textContent = entity.label;
  breadcrumb.textContent = entity.label;
  pageDescription.textContent = entity.description;
  workspaceTitle.textContent = `Gerenciar ${entity.label.toLowerCase()}`;
  workspaceSubtitle.textContent = "Escolha uma operação para continuar.";
  const insertBtn = crudToolbar.querySelector('[data-action="insert"]');
  if (insertBtn) insertBtn.style.display = entity.allowInsert ? "inline-flex" : "none";
}

function selectAction(action) {
  currentAction = action;
  crudButtons.forEach(button => {
    const selected = button.dataset.action === action;
    button.classList.toggle("is-selected", selected);
    button.classList.toggle("primary", button.dataset.action === "insert" && action === "insert");
  });

}

function renderAction(action) {
  selectAction(action);
  const entity = entities[currentEntity];
  if (!entity) return;
  const plural = entity.label.toLowerCase();
  if (action === "insert" && entity.allowInsert) {
    operationTitle.textContent = `Inserir ${entity.singular}`;
    operationDescription.textContent = "Preencha os campos para cadastrar um novo registro.";
    recordCount.textContent = "Novo registro";
    renderForm();
  } else {
    operationTitle.textContent = `Lista de ${plural}`;
    operationDescription.textContent = `Consulte os registros cadastrados em ${plural}.`;
    recordCount.textContent = currentEntity === "historico-status" ? "4 registros" : "1 registro";
    renderList();
  }

}

function fieldMarkup(field) {
  const [name, label, type, required, options] = field;
  const id = `field-${name}`;
  let control = "";
  if (type === "textarea") {
    control = `<textarea id="${id}" name="${name}" ${required ? "required" : ""} placeholder="${label}"></textarea>`;
  } else if (type === "select") {
    control = `<select id="${id}" name="${name}" ${required ? "required" : ""}><option value="">Selecione...</option>${options.map(o => `<option value="${o}">${o}</option>`).join("")}</select>`;
  } else {
    const min = type === "number" ? 'min="0" step="any"' : "";
    control = `<input id="${id}" name="${name}" type="${type}" ${min} ${required ? "required" : ""} placeholder="${label}">`;
  }

  return `<div class="form-field ${type === "textarea" ? "full" : ""}"><label for="${id}">${label}${required ? " *" : ""}</label>${control}</div>`;
}

async function calcularTotalGeral() {
  let total = 0;
  const rows = document.querySelectorAll(".order-item-row");
  for (const row of rows) {
    const idProd = row.querySelector(".item-produto")?.value;
    const qtd = parseFloat(row.querySelector(".item-quantidade")?.value) || 0;
    if (idProd && qtd > 0) {
      try {
        const res = await fetch(`http://localhost:3000/api/produtos?id_vendedor=${vendedorLogado.id_vendedor}`);
        const produtos = await res.json();
        const prod = produtos.find(p => String(p.id_produto) === String(idProd));
        if (prod) {
          const preco = Number(prod.preco_unitario) || 0;
          total += qtd * preco;
        }
      } catch (e) {
        console.error("Erro ao buscar preço do produto", e);
      }
    }
  }
  const displayTotal = document.querySelector("#display-total-pedido");
  if (displayTotal) displayTotal.textContent = `R$ ${total.toFixed(2)}`;
}

function attachRowEvents(row) {
  row.querySelector(".item-produto").addEventListener("input", calcularTotalGeral);
  row.querySelector(".item-quantidade").addEventListener("input", calcularTotalGeral);
  row.querySelector(".remove-item-btn").addEventListener("click", () => {
    if (document.querySelectorAll(".order-item-row").length > 1) {
      row.remove();
      calcularTotalGeral();
    } else {
      alert("O pedido precisa ter pelo menos um item.");
    }
  });
}

function renderForm() {
  const entity = entities[currentEntity];
  const fields = entity.fields.map(fieldMarkup).join("");
  let extraContent = "";
  if (currentEntity === "pedidos") {
    extraContent = `
      <div class="order-items-section" style="margin-top: 15px;">
        <div class="order-items-header">
          <span>Itens do Pedido</span>
          <button type="button" class="add-item-btn" id="add-order-item">+ Adicionar Item</button>
        </div>
        <div id="order-items-container">
          <div class="order-item-row" style="grid-template-columns: 2fr 1fr auto;">
            <div class="form-field"><label>ID do Produto *</label><input type="number" class="item-produto" min="1" required placeholder="ID do produto"></div>
            <div class="form-field"><label>Quantidade *</label><input type="number" class="item-quantidade" min="1" value="1" required placeholder="Qtd"></div>
            <button type="button" class="action-btn delete remove-item-btn" style="align-self:end; margin-bottom:4px;">X</button>
          </div>
        </div>
        <div style="margin-top: 10px; text-align: right; font-size: 15px;">
          <strong>Total dos Itens: <span id="display-total-pedido">R$ 0,00</span></strong>
        </div>
      </div>
      <div class="order-items-section" style="margin-top: 15px;">
        <div class="order-items-header">
          <span>Pagamentos Associados</span>
          <button type="button" class="add-item-btn" id="add-order-pagamento">+ Adicionar Pagamento</button>
        </div>
        <div id="order-pagamentos-container">
          <!-- Linha dinâmica de pagamento -->
        </div>
      </div>
    `;
  }

  operationContent.innerHTML = `
    <form id="entity-form" onsubmit="event.preventDefault();">
      <div class="form-grid">${fields}</div>
      ${extraContent}

      <div class="form-actions">
        <button class="save-button" type="button">Cadastrar</button>
        <button type="button" id="cancel-form">Cancelar</button>
      </div>
    </form>`;

  if (currentEntity === "pedidos") {
    document.querySelectorAll(".order-item-row").forEach(attachRowEvents);
    document.querySelector("#add-order-item").addEventListener("click", () => {
      const container = document.querySelector("#order-items-container");
      const newRow = document.createElement("div");
      newRow.className = "order-item-row";
      newRow.style.gridTemplateColumns = "2fr 1fr auto";
      newRow.innerHTML = `
        <div class="form-field"><label>ID do Produto *</label><input type="number" class="item-produto" min="1" required placeholder="ID do produto"></div>
        <div class="form-field"><label>Quantidade *</label><input type="number" class="item-quantidade" min="1" value="1" required placeholder="Qtd"></div>
        <button type="button" class="action-btn delete remove-item-btn" style="align-self:end; margin-bottom:4px;">X</button>
      `;
      container.appendChild(newRow);
      attachRowEvents(newRow);
    });

    document.querySelector("#add-order-pagamento").addEventListener("click", () => {
      const container = document.querySelector("#order-pagamentos-container");
      const newPagRow = document.createElement("div");
      newPagRow.className = "order-pag-row order-item-row";
      newPagRow.innerHTML = `
        <div class="form-field"><label>Forma</label><select class="pag-forma"><option value="PIX">PIX</option><option value="CARTAO_CREDITO">Cartão de Crédito</option><option value="CARTAO_DEBITO">Cartão de Débito</option><option value="DINHEIRO">Dinheiro</option><option value="BOLETO">Boleto</option></select></div>
        <div class="form-field"><label>Valor (R$)</label><input type="number" class="pag-valor" min="0" step="any" placeholder="Valor"></div>
        <div class="form-field"><label>Status</label><select class="pag-status"><option value="APROVADO">Aprovado</option><option value="PROCESSANDO">Processando</option><option value="RECUSADO">Recusado</option></select></div>
        <button type="button" class="action-btn delete remove-pag-btn" style="align-self:end; margin-bottom:4px;">X</button>
      `;
      container.appendChild(newPagRow);
      newPagRow.querySelector(".remove-pag-btn").addEventListener("click", () => newPagRow.remove());
    });
  }

  document.querySelector("#cancel-form").addEventListener("click", () => renderAction("list"));
  const saveBtn = document.querySelector(".save-button");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      // (mantém os blocos de salvamento normais para cada entidade...)
      if (currentEntity === "produtos") {
        salvarNovoProduto({
          id_vendedor: vendedorLogado.id_vendedor,
          id_categoria: Number(document.querySelector("#field-id_categoria").value),
          nome: document.querySelector("#field-nome").value,
          descricao: document.querySelector("#field-descricao")?.value || "",
          preco_unitario: Number(document.querySelector("#field-preco_unitario").value),
          estoque: Number(document.querySelector("#field-estoque").value)
        });
      } else if (currentEntity === "categorias") {
        salvarNovaCategoria({
          id_vendedor: vendedorLogado.id_vendedor,
          nome: document.querySelector("#field-nome").value,
          descricao: document.querySelector("#field-descricao")?.value || "",
          id_categoria_pai: document.querySelector("#field-id_categoria_pai")?.value ? Number(document.querySelector("#field-id_categoria_pai").value) : null
        });
      } else if (currentEntity === "clientes") {
        salvarNovoCliente({
          id_vendedor: vendedorLogado.id_vendedor,
          nome: document.querySelector("#field-nome").value,
          cpf: document.querySelector("#field-cpf").value,
          email: document.querySelector("#field-email").value,
          telefone: document.querySelector("#field-telefone")?.value || "",
          status: document.querySelector("#field-status")?.value || "Ativo"
        });
      } else if (currentEntity === "fornecedores") {
        salvarNovoFornecedor({
          id_vendedor: vendedorLogado.id_vendedor,
          nome: document.querySelector("#field-nome").value,
          cnpj: document.querySelector("#field-cnpj").value,
          email: document.querySelector("#field-email").value,
          telefone: document.querySelector("#field-telefone")?.value || ""
        });
      } else if (currentEntity === "fornecedor-produto") {
        salvarNovoFornecedorProduto({
          id_vendedor: vendedorLogado.id_vendedor,
          id_fornecedor: Number(document.querySelector("#field-id_fornecedor").value),
          id_produto: Number(document.querySelector("#field-id_produto").value),
          quantidade: Number(document.querySelector("#field-quantidade").value),
          preco_custo: Number(document.querySelector("#field-preco_custo").value),
          prazo_entrega_dias: Number(document.querySelector("#field-prazo_entrega_dias").value)
        });
      } else if (currentEntity === "pedidos") {
        const itensRows = document.querySelectorAll(".order-item-row");
        const itens = [];
        itensRows.forEach(row => {
          const id_produto = Number(row.querySelector(".item-produto")?.value);
          const quantidade = Number(row.querySelector(".item-quantidade")?.value);
          if (id_produto && quantidade) {
            itens.push({ id_produto, quantidade });
          }
        });

        const pagamentos = [];
        document.querySelectorAll(".order-pag-row").forEach(row => {
          const forma_pagamento = row.querySelector(".pag-forma").value;
          const valor = Number(row.querySelector(".pag-valor").value);
          const status = row.querySelector(".pag-status").value;
          if (valor > 0) pagamentos.push({ forma_pagamento, valor, status });
        });

        const dataEmissaoVal = document.querySelector("#field-data_emissao")?.value || null;
        const status_inicial = document.querySelector("#field-status_pedido")?.value || "PENDENTE";

        salvarNovoPedido({
          id_vendedor: vendedorLogado.id_vendedor,
          id_cliente: Number(document.querySelector("#field-id_cliente").value),
          data_emissao: dataEmissaoVal ? dataEmissaoVal.replace("T", " ") + ":00" : null,
          itens,
          pagamentos,
          status_inicial
        });
      }
    });
  }
}

async function renderFilterBar() {
  if (currentEntity !== "produtos") {
    return `
      <div class="filter-bar">
        <div class="filter-grid">
          <div class="filter-item search-item">
            <label for="search-input">Pesquisar por ID ou Termo</label>
            <input id="search-input" type="text" placeholder="Digite para buscar...">
          </div>
        </div>
      </div>`;
  }

  let optionsHtml = '<option value="">Todas</option>';
  try {
    const res = await fetch(`http://localhost:3000/api/categorias?id_vendedor=${vendedorLogado.id_vendedor}`);
    const categorias = await res.json();
    categorias.forEach(c => {
      optionsHtml += `<option value="${c.id_categoria}">${c.nome}</option>`;
    });

  } catch (err) {
    console.error("Erro ao carregar categorias do vendedor para o filtro:", err);
  }

  return `
    <div class="filter-bar">
      <div class="filter-grid">
        <div class="filter-item search-item">
          <label for="search-input">Pesquisar</label>
          <input id="search-input" type="text" placeholder="Nome ou ID do produto...">
        </div>
        <div class="filter-item">
          <label for="filter-category">Categoria</label>
          <select id="filter-category">
            ${optionsHtml}

          </select>
        </div>
        <div class="filter-item">
          <label>Preço</label>
          <div class="price-range-inputs">
            <input id="price-min" type="number" placeholder="Mín" min="0">
            <span>até</span>
            <input id="price-max" type="number" placeholder="Máx" min="0">
          </div>
        </div>
        <div class="filter-item">
          <label for="filter-stock">Estoque</label>
          <select id="filter-stock">
            <option value="">Todos</option>
            <option value="in_stock">Em Estoque (> 5)</option>
            <option value="low_stock">Estoque Baixo (1 - 5)</option>
            <option value="out_of_stock">Esgotado (0)</option>
          </select>
        </div>
      </div>
      <div class="filter-actions-row">
        <button class="filter-btn secondary" type="button" id="clear-filters">Limpar Filtros</button>
        <button class="filter-btn" type="button" id="apply-filters">Filtrar</button>
      </div>
    </div>`;
}

// Função genérica para exclusão de registros (DELETE)
async function deletarRegistro(url, mensagem = "Deseja realmente deletar este registro?") {
  if (!confirm(mensagem)) return;
  try {
    const res = await fetch(url, { method: 'DELETE' });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Registro deletado com sucesso!");
      renderAction("list");
    } else {
      alert(data.error || "Erro ao deletar registro.");
    }

  } catch (err) {
    console.error("Erro:", err);
    alert("Erro de conexão ao tentar deletar.");
  }

}

// Função genérica para salvamento (POST)
async function salvarRegistro(url, dados) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Salvo com sucesso!");
      renderAction("list");
    } else {
      alert("Não foi possível salvar o registro. Verifique os dados informados ou tente novamente.");
    }

  } catch (err) {
    console.error("Erro:", err);
    alert("Erro de conexão ao tentar salvar.");
  }

}

// Função genérica para atualização de registros (PUT)
async function atualizarRegistro(url, dados) {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "Atualizado com sucesso!");
      renderAction("list");
    } else {
      alert("Não foi possível atualizar o registro. Verifique os campos e tente novamente.");
    }

  } catch (err) {
    console.error("Erro:", err);
    alert("Erro de conexão ao tentar atualizar.");
  }

}

// Função genérica para desenhar tabelas e vincular o modal de detalhes
function renderizarTabelaGenerica(seletorTabela, lista, colspan, mensagemVazia, renderizarLinhaFn) {
  const tbody = document.querySelector(seletorTabela);
  if (!tbody) return;
  const recordCountEl = document.querySelector("#record-count");
  if (recordCountEl) {
    const total = lista.length;
    recordCountEl.textContent = total === 1 ? "1 registro" : `${total} registros`;
  }

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">${mensagemVazia}</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(renderizarLinhaFn).join("");
  tbody.querySelectorAll("tr").forEach(row => {
    row.addEventListener("click", () => {
      const detail = row.getAttribute("data-detail");
      if (detail) {
        const titulo = `Detalhes em ${entities[currentEntity]?.label || 'Registro'}`;
        openDetailModal(titulo, JSON.parse(detail));
      }

    });

  });

}

// RELATORIO
async function carregarRelatorioConsolidadoReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/relatorios/consolidado?id_vendedor=${vendedorLogado.id_vendedor}`);
    const dados = await res.json();

    const callbackLinha = item => {
      let statusClass = "processing";
      if (item.status_atual === 'PAGO' || item.status_atual === 'FINALIZADO') statusClass = "finished";
      if (item.status_atual === 'CANCELADO') statusClass = "canceled";
      return `
        <tr data-detail='${JSON.stringify(item)}'>
          <td>#${item.id_pedido}</td>
          <td>${new Date(item.data_emissao).toLocaleString('pt-BR')}</td>
          <td><strong>${item.cliente_nome}</strong></td>
          <td>${item.cliente_cpf || '-'}</td>
          <td>R$ ${Number(item.valor_total).toFixed(2)}</td>
          <td><span class="status-pill ${statusClass}">${item.status_atual || 'PENDENTE'}</span></td>
          <td>-</td>
        </tr>`;
    };

    renderizarTabelaGenerica(".data-table tbody", dados, 7, "Nenhum registro consolidado encontrado.", callbackLinha);
    const searchInput = document.querySelector("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = dados.filter(item =>
          String(item.id_pedido).includes(termo) ||
          (item.cliente_nome && item.cliente_nome.toLowerCase().includes(termo)) ||
          (item.cliente_cpf && item.cliente_cpf.includes(termo)) ||
          (item.status_atual && item.status_atual.toLowerCase().includes(termo))
        );
        renderizarTabelaGenerica(".data-table tbody", filtrados, 7, "Nenhum registro consolidado encontrado.", callbackLinha);
      });
    }

  } catch (err) {
    console.error("Erro ao carregar relatório consolidado:", err);
  }
}

// PRODUTOS
async function carregarProdutosReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/produtos?id_vendedor=${vendedorLogado.id_vendedor}`);
    const produtos = await res.json();
    const callbackLinha = p => `
      <tr data-detail='${JSON.stringify(p)}'>
        <td>#${p.id_produto}</td>
        <td><strong>${p.nome}</strong></td>
        <td>${p.id_categoria}</td>
        <td>R$ ${Number(p.preco_unitario).toFixed(2)}</td>
        <td>${p.estoque} un.</td>
        <td><span class="status-pill finished">Ativo</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); prepararEdicaoProduto(${JSON.stringify(p).replace(/"/g, '&quot;')});">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); deletarProduto(${p.id_produto});">Deletar</button>
          </div>
        </td>
      </tr>`;
    const desenhar = (lista) => renderizarTabelaGenerica(".data-table tbody", lista, 7, "Nenhum produto encontrado.", callbackLinha);
    desenhar(produtos);
    const aplicarFiltros = () => {
      const termo = document.querySelector("#search-input")?.value.toLowerCase() || "";
      const categoria = document.querySelector("#filter-category")?.value || "";
      const precoMin = parseFloat(document.querySelector("#price-min")?.value) || 0;
      const precoMax = parseFloat(document.querySelector("#price-max")?.value) || Infinity;
      const estoqueStatus = document.querySelector("#filter-stock")?.value || "";
      const filtrados = produtos.filter(p => {
        const matchTermo = p.nome.toLowerCase().includes(termo) || String(p.id_produto).includes(termo);
        const matchCategoria = !categoria || String(p.id_categoria) === categoria;
        const matchPreco = p.preco_unitario >= precoMin && p.preco_unitario <= precoMax;
        let matchEstoque = true;
        if (estoqueStatus === "in_stock") matchEstoque = p.estoque > 5;
        else if (estoqueStatus === "low_stock") matchEstoque = p.estoque > 0 && p.estoque <= 5;
        else if (estoqueStatus === "out_of_stock") matchEstoque = p.estoque === 0;
        return matchTermo && matchCategoria && matchPreco && matchEstoque;
      });

      desenhar(filtrados);
    };

    document.querySelector("#search-input")?.addEventListener("input", aplicarFiltros);
    document.querySelector("#filter-category")?.addEventListener("change", aplicarFiltros);
    document.querySelector("#filter-stock")?.addEventListener("change", aplicarFiltros);
    document.querySelector("#price-min")?.addEventListener("input", aplicarFiltros);
    document.querySelector("#price-max")?.addEventListener("input", aplicarFiltros);
    document.querySelector("#apply-filters")?.addEventListener("click", aplicarFiltros);
    document.querySelector("#clear-filters")?.addEventListener("click", () => {
      document.querySelectorAll(".filter-bar input, .filter-bar select").forEach(el => el.value = "");
      desenhar(produtos);
    });

  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }

}

async function salvarNovoProduto(dados) {
  salvarRegistro('http://localhost:3000/api/produtos', dados);
}

function prepararEdicaoProduto(p) {
  renderAction("insert");
  document.querySelector("#operation-title").textContent = `Editar produto #${p.id_produto}`;
  document.querySelector(".save-button").textContent = "Salvar Alterações";
  document.querySelector("#field-nome").value = p.nome || "";
  document.querySelector("#field-id_categoria").value = p.id_categoria || "";
  document.querySelector("#field-preco_unitario").value = p.preco_unitario || "";
  document.querySelector("#field-estoque").value = p.estoque || "";
  if (document.querySelector("#field-descricao")) document.querySelector("#field-descricao").value = p.descricao || "";
  const saveBtn = document.querySelector(".save-button");
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  newBtn.addEventListener("click", () => {
    const atualizados = {
      id_categoria: Number(document.querySelector("#field-id_categoria").value),
      nome: document.querySelector("#field-nome").value,
      descricao: document.querySelector("#field-descricao")?.value || "",
      preco_unitario: Number(document.querySelector("#field-preco_unitario").value),
      estoque: Number(document.querySelector("#field-estoque").value)
    };

    atualizarRegistro(`http://localhost:3000/api/produtos/${p.id_produto}`, atualizados);
  });

}

async function deletarProduto(id) {
  deletarRegistro(`http://localhost:3000/api/produtos/${id}`, "Deseja realmente deletar este produto?");
}

// CATEGORIAS
async function carregarCategoriasReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/categorias?id_vendedor=${vendedorLogado.id_vendedor}`);
    const categorias = await res.json();
    const recordCountEl = document.querySelector("#record-count");
    if (recordCountEl) {
      recordCountEl.textContent = categorias.length === 1 ? "1 registro" : `${categorias.length} registros`;
    }
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="5" style="text-align: center;">Nenhuma categoria encontrada.</td></tr>` :
        lista.map(c => `
          <tr data-detail='${JSON.stringify(c)}'>
            <td>#${c.id_categoria}</td>
            <td><strong>${c.nome}</strong></td>
            <td>${c.descricao || '-'}</td>
            <td>${c.id_categoria_pai || 'Nenhuma'}</td>
            <td>
              <div class="table-actions">
                <button class="action-btn edit" type="button" onclick="event.stopPropagation(); prepararEdicaoCategoria(${JSON.stringify(c).replace(/"/g, '&quot;')});">Editar</button>
                <button class="action-btn delete" type="button" onclick="event.stopPropagation(); deletarCategoria(${c.id_categoria});">Deletar</button>
              </div>
            </td>
          </tr>`).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", () => {
            const detail = row.getAttribute("data-detail");
            if (detail) openDetailModal("Detalhes da Categoria", JSON.parse(detail));
          });

        });

      }

    };

    desenharTabela(categorias);
    const searchInput = document.querySelector("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = categorias.filter(c =>
          c.nome.toLowerCase().includes(termo) ||
          String(c.id_categoria).includes(termo) ||
          (c.descricao && c.descricao.toLowerCase().includes(termo))
        );
        desenharTabela(filtrados);
      });

    }

  } catch (err) {
    console.error("Erro ao carregar categorias:", err);
  }

}

async function salvarNovaCategoria(dados) {
  salvarRegistro('http://localhost:3000/api/categorias', dados);
}

function prepararEdicaoCategoria(c) {
  renderAction("insert");
  document.querySelector("#operation-title").textContent = `Editar categoria #${c.id_categoria}`;
  document.querySelector(".save-button").textContent = "Salvar Alterações";
  document.querySelector("#field-nome").value = c.nome || "";
  document.querySelector("#field-descricao").value = c.descricao || "";
  document.querySelector("#field-id_categoria_pai").value = c.id_categoria_pai || "";
  const saveBtn = document.querySelector(".save-button");
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  newBtn.addEventListener("click", () => {
    const atualizados = {
      nome: document.querySelector("#field-nome").value,
      descricao: document.querySelector("#field-descricao").value,
      id_categoria_pai: document.querySelector("#field-id_categoria_pai").value ? Number(document.querySelector("#field-id_categoria_pai").value) : null
    };

    atualizarRegistro(`http://localhost:3000/api/categorias/${c.id_categoria}`, atualizados);
  });

}

async function deletarCategoria(id) {
  deletarRegistro(`http://localhost:3000/api/categorias/${id}`, "Deseja deletar esta categoria?");
}

// CLIENTES
async function carregarClientesReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/clientes?id_vendedor=${vendedorLogado.id_vendedor}`);
    const clientes = await res.json();
    const callbackLinha = c => `
      <tr data-detail='${JSON.stringify(c)}'>
        <td>#${c.id_pessoa}</td>
        <td><strong>${c.nome}</strong></td>
        <td>${c.cpf}</td>
        <td>${c.email}</td>
        <td>${c.telefone || '-'}</td>
        <td><span class="status-pill finished">${c.ativo ? 'Ativo' : 'Desativado'}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); prepararEdicaoCliente(${JSON.stringify(c).replace(/"/g, '&quot;')});">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); deletarCliente(${c.id_pessoa});">Deletar</button>
          </div>
        </td>
      </tr>`;
    renderizarTabelaGenerica(".data-table tbody", clientes, 7, "Nenhum cliente encontrado.", callbackLinha);
    const searchInput = document.querySelector("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = clientes.filter(c =>
          c.nome.toLowerCase().includes(termo) ||
          String(c.id_pessoa).includes(termo) ||
          (c.cpf && c.cpf.includes(termo)) ||
          (c.email && c.email.toLowerCase().includes(termo))
        );
        renderizarTabelaGenerica(".data-table tbody", filtrados, 7, "Nenhum cliente encontrado.", callbackLinha);
      });

    }

  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
  }

}

async function salvarNovoCliente(dados) {
  salvarRegistro('http://localhost:3000/api/clientes', dados);
}

function prepararEdicaoCliente(c) {
  renderAction("insert");
  document.querySelector("#operation-title").textContent = `Editar cliente #${c.id_pessoa}`;
  document.querySelector(".save-button").textContent = "Salvar Alterações";
  document.querySelector("#field-nome").value = c.nome || "";
  document.querySelector("#field-cpf").value = c.cpf || "";
  document.querySelector("#field-email").value = c.email || "";
  if (document.querySelector("#field-telefone")) document.querySelector("#field-telefone").value = c.telefone || "";
  if (document.querySelector("#field-status")) document.querySelector("#field-status").value = c.ativo ? "Ativo" : "Desativado";
  const saveBtn = document.querySelector(".save-button");
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  newBtn.addEventListener("click", () => {
    const atualizados = {
      nome: document.querySelector("#field-nome").value,
      cpf: document.querySelector("#field-cpf").value,
      email: document.querySelector("#field-email").value,
      telefone: document.querySelector("#field-telefone")?.value || ""
    };

    atualizarRegistro(`http://localhost:3000/api/clientes/${c.id_pessoa}`, atualizados);
  });

}

async function deletarCliente(id) {
  deletarRegistro(`http://localhost:3000/api/clientes/${id}`, "Deseja realmente deletar este cliente?");
}

// FORNECEDORES
async function carregarFornecedoresReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/fornecedores?id_vendedor=${vendedorLogado.id_vendedor}`);
    const fornecedores = await res.json();
    const callbackLinha = f => `
      <tr data-detail='${JSON.stringify(f)}'>
        <td>#${f.id_fornecedor}</td>
        <td><strong>${f.nome}</strong></td>
        <td>${f.cnpj}</td>
        <td>${f.email}</td>
        <td>${f.telefone || '-'}</td>
        <td><span class="status-pill finished">${f.ativo ? 'Ativo' : 'Desativado'}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); prepararEdicaoFornecedor(${JSON.stringify(f).replace(/"/g, '&quot;')});">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); deletarFornecedor(${f.id_fornecedor});">Deletar</button>
          </div>
        </td>
      </tr>`;
    renderizarTabelaGenerica(".data-table tbody", fornecedores, 7, "Nenhum fornecedor encontrado.", callbackLinha);
    const searchInput = document.querySelector("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = fornecedores.filter(f =>
          f.nome.toLowerCase().includes(termo) ||
          String(f.id_fornecedor).includes(termo) ||
          (f.cnpj && f.cnpj.includes(termo)) ||
          (f.email && f.email.toLowerCase().includes(termo))
        );
        renderizarTabelaGenerica(".data-table tbody", filtrados, 7, "Nenhum fornecedor encontrado.", callbackLinha);
      });

    }

  } catch (err) {
    console.error("Erro ao carregar fornecedores:", err);
  }

}

async function salvarNovoFornecedor(dados) {
  salvarRegistro('http://localhost:3000/api/fornecedores', dados);
}

function prepararEdicaoFornecedor(f) {
  renderAction("insert");
  document.querySelector("#operation-title").textContent = `Editar fornecedor #${f.id_fornecedor}`;
  document.querySelector(".save-button").textContent = "Salvar Alterações";
  document.querySelector("#field-nome").value = f.nome || "";
  document.querySelector("#field-cnpj").value = f.cnpj || "";
  document.querySelector("#field-email").value = f.email || "";
  if (document.querySelector("#field-telefone")) document.querySelector("#field-telefone").value = f.telefone || "";
  if (document.querySelector("#field-ativo")) document.querySelector("#field-ativo").value = f.ativo ? "Ativo" : "Desativado";
  const saveBtn = document.querySelector(".save-button");
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  newBtn.addEventListener("click", () => {
    const atualizados = {
      nome: document.querySelector("#field-nome").value,
      cnpj: document.querySelector("#field-cnpj").value,
      email: document.querySelector("#field-email").value,
      telefone: document.querySelector("#field-telefone")?.value || ""
    };

    atualizarRegistro(`http://localhost:3000/api/fornecedores/${f.id_fornecedor}`, atualizados);
  });

}

async function deletarFornecedor(id) {
  deletarRegistro(`http://localhost:3000/api/fornecedores/${id}`, "Deseja realmente deletar este fornecedor?");
}

// FORNECEDOR-PRODUTO
async function carregarFornecedorProdutoReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/fornecedor-produto?id_vendedor=${vendedorLogado.id_vendedor}`);
    const itens = await res.json();
    const callbackLinha = fp => `
      <tr data-detail='${JSON.stringify(fp)}'>
        <td><strong>${fp.fornecedor_nome || fp.id_fornecedor}</strong></td>
        <td>${fp.produto_nome || fp.id_produto}</td>
        <td>${fp.quantidade} un.</td>
        <td>R$ ${Number(fp.preco_custo).toFixed(2)}</td>
        <td>${fp.prazo_entrega_dias} dias</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); prepararEdicaoFornecedorProduto(${JSON.stringify(fp).replace(/"/g, '&quot;')});">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); deletarFornecedorProduto(${fp.id_fornecedor}, ${fp.id_produto});">Deletar</button>
          </div>
        </td>
      </tr>`;
    renderizarTabelaGenerica(".data-table tbody", itens, 6, "Nenhum vínculo encontrado.", callbackLinha);
    const searchInput = document.querySelector("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        const filtrados = itens.filter(fp =>
          (fp.fornecedor_nome && fp.fornecedor_nome.toLowerCase().includes(termo)) ||
          (fp.produto_nome && fp.produto_nome.toLowerCase().includes(termo)) ||
          String(fp.id_fornecedor).includes(termo) ||
          String(fp.id_produto).includes(termo)
        );
        renderizarTabelaGenerica(".data-table tbody", filtrados, 6, "Nenhum vínculo encontrado.", callbackLinha);
      });

    }

  } catch (err) {
    console.error("Erro ao carregar vínculos fornecedor-produto:", err);
  }

}

async function salvarNovoFornecedorProduto(dados) {
  salvarRegistro('http://localhost:3000/api/fornecedor-produto', dados);
}

function prepararEdicaoFornecedorProduto(fp) {
  renderAction("insert");
  document.querySelector("#operation-title").textContent = `Editar vínculo Fornecedor #${fp.id_fornecedor} / Produto #${fp.id_produto}`;
  document.querySelector(".save-button").textContent = "Salvar Alterações";
  document.querySelector("#field-id_fornecedor").value = fp.id_fornecedor || "";
  document.querySelector("#field-id_fornecedor").disabled = true;
  document.querySelector("#field-id_produto").value = fp.id_produto || "";
  document.querySelector("#field-id_produto").disabled = true;
  document.querySelector("#field-quantidade").value = fp.quantidade || "";
  document.querySelector("#field-preco_custo").value = fp.preco_custo || "";
  document.querySelector("#field-prazo_entrega_dias").value = fp.prazo_entrega_dias || "";
  const saveBtn = document.querySelector(".save-button");
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  newBtn.addEventListener("click", async () => {
    const atualizados = {
      quantidade: Number(document.querySelector("#field-quantidade").value),
      preco_custo: Number(document.querySelector("#field-preco_custo").value),
      prazo_entrega_dias: Number(document.querySelector("#field-prazo_entrega_dias").value)
    };

    try {
      const res = await fetch(`http://localhost:3000/api/fornecedor-produto/${fp.id_fornecedor}/${fp.id_produto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizados)
      });

      if (res.ok) {
        alert("Vínculo atualizado com sucesso!");
        renderAction("list");
      } else {
        const errData = await res.json();
        alert(errData.error || "Erro ao atualizar vínculo.");
      }

    } catch (err) {
      console.error("Erro:", err);
    }

  });

}

async function deletarFornecedorProduto(idFornecedor, idProduto) {
  deletarRegistro(`http://localhost:3000/api/fornecedor-produto/${idFornecedor}/${idProduto}`, "Deseja realmente deletar este vínculo?");
}

// PEDIDOS
async function carregarPedidosReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/pedidos?id_vendedor=${vendedorLogado.id_vendedor}`);
    const pedidos = await res.json();
    const recordCountEl = document.querySelector("#record-count");
    if (recordCountEl) {
      recordCountEl.textContent = pedidos.length === 1 ? "1 registro" : `${pedidos.length} registros`;
    }
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="6" style="text-align: center;">Nenhum pedido encontrado.</td></tr>` :
        lista.map(p => {
          let statusClass = "processing";
          if (p.status_atual === 'PAGO' || p.status_atual === 'FINALIZADO') statusClass = "finished";
          if (p.status_atual === 'CANCELADO') statusClass = "canceled";
          return `
          <tr data-detail='${JSON.stringify(p)}'>
            <td>#${p.id_pedido}</td>
            <td><strong>${p.cliente_nome || 'Cliente #' + p.id_cliente}</strong></td>
            <td>${new Date(p.data_emissao).toLocaleString('pt-BR')}</td>
            <td>R$ ${Number(p.valor_total).toFixed(2)}</td>
            <td><span class="status-pill ${statusClass}">${p.status_atual || 'PENDENTE'}</span></td>
            <td>
              <div class="table-actions">
                <button class="action-btn register" type="button" onclick="event.stopPropagation(); abrirModalPagamento(${p.id_pedido}, ${p.valor_total});">Pagar</button>
                <button class="action-btn edit" type="button" onclick="event.stopPropagation(); prepararEdicaoPedido(${JSON.stringify(p).replace(/"/g, '&quot;')});">Editar</button>
                <button class="action-btn delete" type="button" onclick="event.stopPropagation(); deletarPedido(${p.id_pedido});">Deletar</button>
              </div>
            </td>
          `;
        }).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", async () => {
            const detail = JSON.parse(row.getAttribute("data-detail"));
            let infoAdicional = "<p>Carregando detalhes...</p>";
            try {
              const [resItens, resPag, resHist] = await Promise.all([
                fetch(`http://localhost:3000/api/pedidos/${detail.id_pedido}/itens`),
                fetch(`http://localhost:3000/api/pedidos/${detail.id_pedido}/pagamentos`),
                fetch(`http://localhost:3000/api/pedidos/${detail.id_pedido}/historico`)
              ]);
              const itens = await resItens.json();
              const pagamentos = await resPag.json();
              const historico = await resHist.json();
              let itensHtml = itens.length > 0 ?
                `<ul>${itens.map(i => `<li>${i.quantidade}x ${i.produto_nome || ('Produto #' + i.id_produto)} - R$ ${Number(i.subtotal).toFixed(2)}</li>`).join("")}</ul>` :
                `<em>Nenhum item.</em>`;
              let pagHtml = pagamentos.length > 0 ?
                `<ul>${pagamentos.map(pg => `<li>${pg.forma_pagamento} - R$ ${Number(pg.valor).toFixed(2)} (<span style="color:green">${pg.status}</span>) em ${new Date(pg.data_hora).toLocaleString('pt-BR')}</li>`).join("")}</ul>` :
                `<em>Nenhum pagamento registrado.</em>`;
              let histHtml = historico.length > 0 ?
                `<ul>${historico.map(h => `<li><b>${h.status}</b> em ${new Date(h.data_alteracao).toLocaleString('pt-BR')}</li>`).join("")}</ul>` :
                `<em>Sem histórico.</em>`;
              infoAdicional = `
                <div style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 8px; font-size: 0.85rem;">
                  <strong>Itens do Pedido:</strong> ${itensHtml}

                  <strong style="display:block; margin-top:8px;">Pagamentos:</strong> ${pagHtml}

                  <strong style="display:block; margin-top:8px;">Histórico de Status:</strong> ${histHtml}

                </div>
              `;
            } catch (e) {
              infoAdicional = `<p style="color:red;">Erro ao carregar detalhes complementares.</p>`;
            }

            const conteudoCompleto = {
              "ID do Pedido": detail.id_pedido,
              "Cliente": detail.cliente_nome || ('Cliente #' + detail.id_cliente),
              "Data de Emissão": new Date(detail.data_emissao).toLocaleString('pt-BR'),
              "Valor Total": `R$ ${Number(detail.valor_total).toFixed(2)}`
            };

            openDetailModal("Detalhes Completos do Pedido", conteudoCompleto);
            const detailBox = document.querySelector("#detail-modal-content");
            if (detailBox) {
              detailBox.innerHTML += infoAdicional;
            }

          });

        });

      }

    };

    desenharTabela(pedidos);
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
  }

}

function abrirModalPagamento(idPedido, valorTotal) {
  const forma = prompt(`Registrar pagamento para o Pedido #${idPedido} (Total: R$ ${Number(valorTotal).toFixed(2)})\nEscolha a forma (PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO, BOLETO):`, "PIX");
  if (!forma) return;
  const valor = prompt("Informe o valor a pagar:", valorTotal);
  if (!valor) return;
  fetch('http://localhost:3000/api/pagamentos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_pedido: idPedido, forma_pagamento: forma.toUpperCase(), valor: Number(valor) })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || "Pagamento registrado com sucesso!");
      renderAction("list");
    })
    .catch(err => {
      console.error("Erro ao registrar pagamento:", err);
      alert("Erro ao registrar pagamento.");
    });

}

async function prepararEdicaoPedido(p) {
  renderAction("insert");
  document.querySelector("#operation-title").textContent = `Editar pedido #${p.id_pedido}`;
  document.querySelector(".save-button").textContent = "Salvar Alterações";
  document.querySelector("#field-id_cliente").value = p.id_cliente || "";
  if (p.data_emissao && document.querySelector("#field-data_emissao")) {
    const dt = new Date(p.data_emissao);
    document.querySelector("#field-data_emissao").value = dt.toISOString().slice(0, 16);
  }

  if (document.querySelector("#field-status_pedido")) {
    document.querySelector("#field-status_pedido").value = p.status_atual || "PENDENTE";
  }

  try {
    const [resItens, resPag] = await Promise.all([
      fetch(`http://localhost:3000/api/pedidos/${p.id_pedido}/itens`),
      fetch(`http://localhost:3000/api/pedidos/${p.id_pedido}/pagamentos`)
    ]);
    const itens = await resItens.json();
    const pagamentos = await resPag.json();
    const container = document.querySelector("#order-items-container");
    if (container && itens.length > 0) {
      container.innerHTML = "";
      itens.forEach(i => {
        const row = document.createElement("div");
        row.className = "order-item-row";
        row.style.gridTemplateColumns = "2fr 1fr auto";
        row.innerHTML = `
          <div class="form-field"><label>ID do Produto *</label><input type="number" class="item-produto" min="1" value="${i.id_produto}" required></div>
          <div class="form-field"><label>Quantidade *</label><input type="number" class="item-quantidade" min="1" value="${i.quantidade}" required></div>
          <button type="button" class="action-btn delete remove-item-btn" style="align-self:end; margin-bottom:4px;">X</button>
        `;
        container.appendChild(row);

        attachRowEvents(row);
      });
      calcularTotalGeral();
    }

    const pagContainer = document.querySelector("#order-pagamentos-container");
    if (pagContainer && pagamentos.length > 0) {
      pagamentos.forEach(pg => {
        const pagRow = document.createElement("div");
        pagRow.className = "order-pag-row order-item-row";
        pagRow.innerHTML = `
          <div class="form-field"><label>Forma</label><select class="pag-forma"><option value="PIX" ${pg.forma_pagamento === 'PIX' ? 'selected' : ''}>PIX</option><option value="CARTAO_CREDITO" ${pg.forma_pagamento === 'CARTAO_CREDITO' ? 'selected' : ''}>Cartão de Crédito</option><option value="CARTAO_DEBITO" ${pg.forma_pagamento === 'CARTAO_DEBITO' ? 'selected' : ''}>Cartão de Débito</option><option value="DINHEIRO" ${pg.forma_pagamento === 'DINHEIRO' ? 'selected' : ''}>Dinheiro</option><option value="BOLETO" ${pg.forma_pagamento === 'BOLETO' ? 'selected' : ''}>Boleto</option></select></div>
          <div class="form-field"><label>Valor (R$)</label><input type="number" class="pag-valor" min="0" step="any" value="${pg.valor}"></div>
          <div class="form-field"><label>Status</label><select class="pag-status"><option value="APROVADO" ${pg.status === 'APROVADO' ? 'selected' : ''}>Aprovado</option><option value="PROCESSANDO" ${pg.status === 'PROCESSANDO' ? 'selected' : ''}>Processando</option><option value="RECUSADO" ${pg.status === 'RECUSADO' ? 'selected' : ''}>Recusado</option></select></div>
          <button type="button" class="action-btn delete remove-pag-btn" style="align-self:end; margin-bottom:4px;">X</button>
        `;
        pagContainer.appendChild(pagRow);
        pagRow.querySelector(".remove-pag-btn").addEventListener("click", () => pagRow.remove());
      });

    }

  } catch (err) {
    console.error("Erro ao carregar dados complementares do pedido:", err);
  }

  const saveBtn = document.querySelector(".save-button");
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  newBtn.addEventListener("click", async () => {
    const itensRows = document.querySelectorAll(".order-item-row");
    const itens = [];
    itensRows.forEach(row => {
      const id_produto = Number(row.querySelector(".item-produto")?.value);
      const quantidade = Number(row.querySelector(".item-quantidade")?.value);
      if (id_produto && quantidade) {
        itens.push({ id_produto, quantidade });
      }
    });

    const pagamentos = [];
    document.querySelectorAll(".order-pag-row").forEach(row => {
      const forma_pagamento = row.querySelector(".pag-forma").value;
      const valor = Number(row.querySelector(".pag-valor").value);
      const status = row.querySelector(".pag-status").value;
      if (valor > 0) pagamentos.push({ forma_pagamento, valor, status });
    });

    const dataEmissaoVal = document.querySelector("#field-data_emissao")?.value || null;
    const status_novo = document.querySelector("#field-status_pedido")?.value;

    const atualizados = {
      id_cliente: Number(document.querySelector("#field-id_cliente").value),
      data_emissao: dataEmissaoVal ? dataEmissaoVal.replace("T", " ") + ":00" : null,
      itens,
      pagamentos,
      status_novo
    };

    try {
      const res = await fetch(`http://localhost:3000/api/pedidos/${p.id_pedido}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizados)
      });

      if (res.ok) {
        alert("Pedido atualizado com sucesso!");
        renderAction("list");
      } else {
        const errData = await res.json();
        alert(errData.error || "Erro ao atualizar pedido.");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  });

}

async function salvarNovoPedido(dados) {
  salvarRegistro('http://localhost:3000/api/pedidos', dados);
}

async function deletarPedido(id) {
  deletarRegistro(`http://localhost:3000/api/pedidos/${id}`, "Deseja realmente deletar este pedido?");
}

// PAGAMENTOS
async function carregarPagamentosReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/pagamentos?id_vendedor=${vendedorLogado.id_vendedor}`);
    const pagamentos = await res.json();
    renderizarTabelaGenerica(".data-table tbody", pagamentos, 6, "Nenhum pagamento encontrado.", pg => `
      <tr data-detail='${JSON.stringify(pg)}'>
        <td>#${pg.id_pagamento}</td>
        <td>Pedido #${pg.id_pedido} (${pg.cliente_nome || 'Cliente'})</td>
        <td>${pg.forma_pagamento}</td>
        <td>R$ ${Number(pg.valor).toFixed(2)}</td>
        <td><span class="status-pill finished">${pg.status}</span></td>
        <td>-</td>
      </tr>`);
  } catch (err) {
    console.error("Erro ao carregar pagamentos:", err);
  }

}

// HISTÓRICO DE STATUS
async function carregarHistoricoStatusReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/historico-status?id_vendedor=${vendedorLogado.id_vendedor}`);
    const historico = await res.json();
    renderizarTabelaGenerica(".data-table tbody", historico, 3, "Nenhum registro no histórico.", h => `
      <tr data-detail='${JSON.stringify(h)}'>
        <td><strong>#Pedido ${h.id_pedido}</strong></td>
        <td>${new Date(h.data_alteracao).toLocaleString('pt-BR')}</td>
        <td>
          <span class="status-pill ${h.status === 'FINALIZADO' || h.status === 'PAGO' ? 'finished' : 'processing'}">${h.status}</span>
        </td>
      </tr>`);
  } catch (err) {
    console.error("Erro ao carregar histórico de status:", err);
  }

}

async function carregarVendasClienteReais() {
  const minTotalInput = document.querySelector("#filter-min-total")?.value || "";
  let url = `http://localhost:3000/api/relatorios/vendas-cliente?id_vendedor=${vendedorLogado.id_vendedor}`;
  if (minTotalInput) url += `&min_total=${minTotalInput}`;
  try {
    const res = await fetch(url);
    const dados = await res.json();
    const tbody = document.querySelector(".data-table tbody");
    if (!tbody) return;
    const recordCountEl = document.querySelector("#record-count");
    if (recordCountEl) {
      recordCountEl.textContent = dados.length === 1 ? "1 registro" : `${dados.length} registros`;
    }

    if (dados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum registro encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = dados.map(item => `
      <tr data-detail='${JSON.stringify(item)}'>
        <td>#${item.id_clientepessoa}</td>
        <td><strong>${item.cliente_nome}</strong></td>
        <td>${item.total_pedidos} pedidos</td>
        <td>R$ ${Number(item.valor_gasto_total).toFixed(2)}</td>
        <td>-</td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Erro ao carregar relatório:", err);
  }

}

async function carregarProdutosVendidosReais() {
  const minQtdInput = document.querySelector("#filter-min-qtd")?.value || "";
  let url = `http://localhost:3000/api/relatorios/produtos-vendidos?id_vendedor=${vendedorLogado.id_vendedor}`;
  if (minQtdInput) url += `&min_qtd=${minQtdInput}`;
  try {
    const res = await fetch(url);
    const dados = await res.json();
    const tbody = document.querySelector(".data-table tbody");
    if (!tbody) return;
    const recordCountEl = document.querySelector("#record-count");
    if (recordCountEl) {
      recordCountEl.textContent = dados.length === 1 ? "1 registro" : `${dados.length} registros`;
    }

    if (dados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum registro encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = dados.map(item => `
      <tr data-detail='${JSON.stringify(item)}'>
        <td>#${item.id_produto}</td>
        <td><strong>${item.produto_nome}</strong></td>
        <td>${item.qtd_total_vendida} un.</td>
        <td>R$ ${Number(item.receita_total).toFixed(2)}</td>
        <td>-</td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Erro ao carregar relatório:", err);
  }

}

// MOCKS
function renderList() {
  const entity = entities[currentEntity];
  const headers = entity.columns.map(c => `<th>${c}</th>`).join("");
  let rowsHtml = "";
  const entidadesReais = ["produtos", "categorias", "clientes", "fornecedores", "fornecedor-produto", "pedidos", "pagamentos", "historico-status", "relatorio-consolidado"];
  if (entidadesReais.includes(currentEntity)) {
    const colspan = entity.columns.length;
    rowsHtml = `
      <tr>
        <td colspan="${colspan}" style="text-align: center; color: #888; padding: 20px;">Carregando...</td>
      </tr>`;
  }

  operationContent.innerHTML = `
    <div id="filter-container">Carregando filtros...</div>
    <div class="data-table-wrap">
      <table class="data-table">
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${rowsHtml}

        </tbody>
      </table>
    </div>`;
  renderFilterBar().then(htmlFiltro => {
    const filterContainer = document.querySelector("#filter-container");
    if (filterContainer) {
      filterContainer.outerHTML = htmlFiltro;
    }

    if (currentEntity === "produtos") carregarProdutosReais();
    if (currentEntity === "categorias") carregarCategoriasReais();
    if (currentEntity === "clientes") carregarClientesReais();
    if (currentEntity === "fornecedores") carregarFornecedoresReais();
    if (currentEntity === "fornecedor-produto") carregarFornecedorProdutoReais();
    if (currentEntity === "pedidos") carregarPedidosReais();
    if (currentEntity === "pagamentos") carregarPagamentosReais();
    if (currentEntity === "historico-status") carregarHistoricoStatusReais();
    if (currentEntity === "relatorio-consolidado") carregarRelatorioConsolidadoReais();
    if (currentEntity === "vendas-cliente") {
      operationContent.innerHTML = `
      <div class="filter-bar">
        <div class="filter-grid">
          <div class="filter-item">
            <label for="filter-min-total">Gasto Mínimo Total (R$)</label>
            <input id="filter-min-total" type="number" placeholder="Ex: 100">
          </div>
        </div>
        <div class="filter-actions-row">
          <button class="filter-btn" type="button" id="apply-vendas-filter">Filtrar</button>
        </div>
      </div>
      <div class="data-table-wrap"><table class="data-table"><thead><tr>${headers}</tr></thead><tbody></tbody></table></div>`;
      document.querySelector("#apply-vendas-filter").addEventListener("click", carregarVendasClienteReais);
      carregarVendasClienteReais();
      return;
    }

    if (currentEntity === "produtos-vendidos") {
      operationContent.innerHTML = `
      <div class="filter-bar">
        <div class="filter-grid">
          <div class="filter-item">
            <label for="filter-min-qtd">Quantidade Mínima Vendida</label>
            <input id="filter-min-qtd" type="number" placeholder="Ex: 5">
          </div>
        </div>
        <div class="filter-actions-row">
          <button class="filter-btn" type="button" id="apply-produtos-filter">Filtrar</button>
        </div>
      </div>
      <div class="data-table-wrap"><table class="data-table"><thead><tr>${headers}</tr></thead><tbody></tbody></table></div>`;
      document.querySelector("#apply-produtos-filter").addEventListener("click", carregarProdutosVendidosReais);
      carregarProdutosVendidosReais();
      return;
    }

  });

  document.querySelectorAll(".data-table tbody tr").forEach(row => {
    row.addEventListener("click", () => {
      const detail = row.getAttribute("data-detail");
      if (detail) openDetailModal(`Detalhes em ${entities[currentEntity].label}`, JSON.parse(detail));
    });

  });

}

renderEntity();
renderAction("list");