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
    label: "Pedidos", singular: "pedido", description: "Consulte e acompanhe os pedidos registrados.",
    allowInsert: true,
    fields: [
      ["id_cliente", "ID do cliente", "number", true],
      ["data_emissao", "Data de Emissão (Opcional)", "datetime-local", false]
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
function renderForm() {
  const entity = entities[currentEntity];
  const fields = entity.fields.map(fieldMarkup).join("");
  let extraContent = "";
  if (currentEntity === "pedidos") {
    extraContent = `
      <div class="order-items-section">
        <div class="order-items-header">
          <span>Itens do Pedido</span>
          <button type="button" class="add-item-btn" id="add-order-item">+ Adicionar Item</button>
        </div>
        <div id="order-items-container">
          <div class="order-item-row">
            <div class="form-field">
              <label>ID do Produto *</label>
              <input type="number" class="item-produto" min="1" required placeholder="ID do produto">
            </div>
            <div class="form-field">
              <label>Quantidade *</label>
              <input type="number" class="item-quantidade" min="1" value="1" required placeholder="Qtd">
            </div>
            <div class="form-field">
              <label>Preço Unitário (R$) *</label>
              <input type="number" class="item-preco" min="0" step="any" required placeholder="Preço un.">
            </div>
            <button type="button" class="action-btn delete remove-item-btn">X</button>
          </div>
        </div>
        <div style="margin-top: 15px; text-align: right; font-size: 16px;">
          <strong>Valor Total Calculado: <span id="display-total-pedido">R$ 0,00</span></strong>
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
    const calcularTotalGeral = () => {
      let total = 0;
      document.querySelectorAll(".order-item-row").forEach(row => {
        const qtd = parseFloat(row.querySelector(".item-quantidade").value) || 0;
        const preco = parseFloat(row.querySelector(".item-preco").value) || 0;
        total += qtd * preco;
      });
      const displayTotal = document.querySelector("#display-total-pedido");
      if (displayTotal) displayTotal.textContent = `R$ ${total.toFixed(2)}`;
    };
    const attachRowEvents = (row) => {
      row.querySelector(".item-quantidade").addEventListener("input", calcularTotalGeral);
      row.querySelector(".item-preco").addEventListener("input", calcularTotalGeral);
      row.querySelector(".remove-item-btn").addEventListener("click", () => {
        if (document.querySelectorAll(".order-item-row").length > 1) {
          row.remove();
          calcularTotalGeral();
        } else {
          alert("O pedido precisa ter pelo menos um item.");
        }
      });
    };
    document.querySelectorAll(".order-item-row").forEach(attachRowEvents);
    document.querySelector("#add-order-item").addEventListener("click", () => {
      const container = document.querySelector("#order-items-container");
      const newRow = document.createElement("div");
      newRow.className = "order-item-row";
      newRow.innerHTML = `
        <div class="form-field">
          <label>ID do Produto *</label>
          <input type="number" class="item-produto" min="1" required placeholder="ID do produto">
        </div>
        <div class="form-field">
          <label>Quantidade *</label>
          <input type="number" class="item-quantidade" min="1" value="1" required placeholder="Qtd">
        </div>
        <div class="form-field">
          <label>Preço Unitário (R$) *</label>
          <input type="number" class="item-preco" min="0" step="any" required placeholder="Preço un.">
        </div>
        <button type="button" class="action-btn delete remove-item-btn">X</button>
      `;
      container.appendChild(newRow);
      attachRowEvents(newRow);
    });
  }
  document.querySelector("#cancel-form").addEventListener("click", () => renderAction("list"));
  const saveBtn = document.querySelector(".save-button");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
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
        let valorTotal = 0;
        itensRows.forEach(row => {
          const id_produto = Number(row.querySelector(".item-produto").value);
          const quantidade = Number(row.querySelector(".item-quantidade").value);
          const preco_unitario = Number(row.querySelector(".item-preco").value);
          const subtotal = quantidade * preco_unitario;
          valorTotal += subtotal;
          itens.push({ id_produto, quantidade, preco_unitario, subtotal });
        });
        const dataEmissaoVal = document.querySelector("#field-data_emissao")?.value || null;
        salvarNovoPedido({
          id_vendedor: vendedorLogado.id_vendedor,
          id_cliente: Number(document.querySelector("#field-id_cliente").value),
          data_emissao: dataEmissaoVal ? dataEmissaoVal.replace("T", " ") + ":00" : null,
          valor_total: valorTotal,
          itens: itens
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

// PRODUTOS
async function carregarProdutosReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/produtos?id_vendedor=${vendedorLogado.id_vendedor}`);
    const produtos = await res.json();
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="7" style="text-align: center;">Nenhum produto encontrado.</td></tr>` :
        lista.map(p => `
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
          </tr>`).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", () => {
            const detail = row.getAttribute("data-detail");
            if (detail) openDetailModal("Detalhes do Produto", JSON.parse(detail));
          });
        });
      }
    };
    desenharTabela(produtos);
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
      desenharTabela(filtrados);
    };
    document.querySelector("#search-input")?.addEventListener("input", aplicarFiltros);
    document.querySelector("#filter-category")?.addEventListener("change", aplicarFiltros);
    document.querySelector("#filter-stock")?.addEventListener("change", aplicarFiltros);
    document.querySelector("#price-min")?.addEventListener("input", aplicarFiltros);
    document.querySelector("#price-max")?.addEventListener("input", aplicarFiltros);
    document.querySelector("#apply-filters")?.addEventListener("click", aplicarFiltros);
    document.querySelector("#clear-filters")?.addEventListener("click", () => {
      if (document.querySelector("#search-input")) document.querySelector("#search-input").value = "";
      if (document.querySelector("#filter-category")) document.querySelector("#filter-category").value = "";
      if (document.querySelector("#price-min")) document.querySelector("#price-min").value = "";
      if (document.querySelector("#price-max")) document.querySelector("#price-max").value = "";
      if (document.querySelector("#filter-stock")) document.querySelector("#filter-stock").value = "";
      desenharTabela(produtos);
    });
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}
async function salvarNovoProduto(dados) {
  try {
    const res = await fetch('http://localhost:3000/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (res.ok) {
      alert("Produto salvo com sucesso!");
      renderAction("list");
    } else {
      const errorData = await res.json();
      alert("Erro ao salvar: " + errorData.error);
    }
  } catch (err) {
    console.error("Erro:", err);
  }
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
  newBtn.addEventListener("click", async () => {
    const atualizados = {
      id_categoria: Number(document.querySelector("#field-id_categoria").value),
      nome: document.querySelector("#field-nome").value,
      descricao: document.querySelector("#field-descricao")?.value || "",
      preco_unitario: Number(document.querySelector("#field-preco_unitario").value),
      estoque: Number(document.querySelector("#field-estoque").value)
    };
    try {
      const res = await fetch(`http://localhost:3000/api/produtos/${p.id_produto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizados)
      });
      if (res.ok) {
        alert("Produto atualizado com sucesso!");
        renderAction("list");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  });
}
async function deletarProduto(id) {
  if (confirm("Deseja realmente deletar este produto?")) {
    try {
      const res = await fetch(`http://localhost:3000/api/produtos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert("Produto deletado com sucesso!");
        renderAction("list");
      } else {
        alert(data.error || "Erro ao deletar produto.");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }
}

// CATEGORIAS
async function carregarCategoriasReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/categorias?id_vendedor=${vendedorLogado.id_vendedor}`);
    const categorias = await res.json();
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
  try {
    const res = await fetch('http://localhost:3000/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (res.ok) {
      alert("Categoria salva com sucesso!");
      renderAction("list");
    } else {
      const errorData = await res.json();
      alert("Erro ao salvar: " + errorData.error);
    }
  } catch (err) {
    console.error("Erro:", err);
  }
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
  newBtn.addEventListener("click", async () => {
    const atualizados = {
      nome: document.querySelector("#field-nome").value,
      descricao: document.querySelector("#field-descricao").value,
      id_categoria_pai: document.querySelector("#field-id_categoria_pai").value ? Number(document.querySelector("#field-id_categoria_pai").value) : null
    };
    try {
      const res = await fetch(`http://localhost:3000/api/categorias/${c.id_categoria}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizados)
      });
      if (res.ok) {
        alert("Categoria atualizada com sucesso!");
        renderAction("list");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  });
}
async function deletarCategoria(id) {
  if (confirm("Deseja deletar esta categoria?")) {
    try {
      const res = await fetch(`http://localhost:3000/api/categorias/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert("Categoria deletada com sucesso!");
        renderAction("list");
      } else {
        alert(data.error || "Erro ao deletar categoria.");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }
}

// CLIENTES
async function carregarClientesReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/clientes?id_vendedor=${vendedorLogado.id_vendedor}`);
    const clientes = await res.json();
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="7" style="text-align: center;">Nenhum cliente encontrado.</td></tr>` :
        lista.map(c => `
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
          </tr>`).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", () => {
            const detail = row.getAttribute("data-detail");
            if (detail) openDetailModal("Detalhes do Cliente", JSON.parse(detail));
          });
        });
      }
    };
    desenharTabela(clientes);
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
        desenharTabela(filtrados);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
  }
}
async function salvarNovoCliente(dados) {
  try {
    const res = await fetch('http://localhost:3000/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (res.ok) {
      alert("Cliente salvo com sucesso!");
      renderAction("list");
    } else {
      const errorData = await res.json();
      alert("Erro ao salvar: " + errorData.error);
    }
  } catch (err) {
    console.error("Erro:", err);
  }
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
  newBtn.addEventListener("click", async () => {
    const atualizados = {
      nome: document.querySelector("#field-nome").value,
      cpf: document.querySelector("#field-cpf").value,
      email: document.querySelector("#field-email").value,
      telefone: document.querySelector("#field-telefone")?.value || ""
    };
    try {
      const res = await fetch(`http://localhost:3000/api/clientes/${c.id_pessoa}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizados)
      });
      if (res.ok) {
        alert("Cliente atualizado com sucesso!");
        renderAction("list");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  });
}
async function deletarCliente(id) {
  if (confirm("Deseja realmente deletar este cliente?")) {
    try {
      const res = await fetch(`http://localhost:3000/api/clientes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert("Cliente deletado com sucesso!");
        renderAction("list");
      } else {
        alert(data.error || "Erro ao deletar cliente.");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }
}

// FORNECEDORES
async function carregarFornecedoresReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/fornecedores?id_vendedor=${vendedorLogado.id_vendedor}`);
    const fornecedores = await res.json();
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="7" style="text-align: center;">Nenhum fornecedor encontrado.</td></tr>` :
        lista.map(f => `
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
          </tr>`).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", () => {
            const detail = row.getAttribute("data-detail");
            if (detail) openDetailModal("Detalhes do Fornecedor", JSON.parse(detail));
          });
        });
      }
    };
    desenharTabela(fornecedores);
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
        desenharTabela(filtrados);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar fornecedores:", err);
  }
}
async function salvarNovoFornecedor(dados) {
  try {
    const res = await fetch('http://localhost:3000/api/fornecedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (res.ok) {
      alert("Fornecedor salvo com sucesso!");
      renderAction("list");
    } else {
      const errorData = await res.json();
      alert("Erro ao salvar: " + errorData.error);
    }
  } catch (err) {
    console.error("Erro:", err);
  }
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
  newBtn.addEventListener("click", async () => {
    const atualizados = {
      nome: document.querySelector("#field-nome").value,
      cnpj: document.querySelector("#field-cnpj").value,
      email: document.querySelector("#field-email").value,
      telefone: document.querySelector("#field-telefone")?.value || ""
    };
    try {
      const res = await fetch(`http://localhost:3000/api/fornecedores/${f.id_fornecedor}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atualizados)
      });
      if (res.ok) {
        alert("Fornecedor atualizado com sucesso!");
        renderAction("list");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  });
}
async function deletarFornecedor(id) {
  if (confirm("Deseja realmente deletar este fornecedor?")) {
    try {
      const res = await fetch(`http://localhost:3000/api/fornecedores/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert("Fornecedor deletado com sucesso!");
        renderAction("list");
      } else {
        alert(data.error || "Erro ao deletar fornecedor.");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }
}

// FORNECEDOR-PRODUTO
async function carregarFornecedorProdutoReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/fornecedor-produto?id_vendedor=${vendedorLogado.id_vendedor}`);
    const itens = await res.json();
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="6" style="text-align: center;">Nenhum vínculo encontrado.</td></tr>` :
        lista.map(fp => `
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
          </tr>`).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", () => {
            const detail = row.getAttribute("data-detail");
            if (detail) openDetailModal("Detalhes do Vínculo", JSON.parse(detail));
          });
        });
      }
    };
    desenharTabela(itens);
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
        desenharTabela(filtrados);
      });
    }
  } catch (err) {
    console.error("Erro ao carregar vínculos fornecedor-produto:", err);
  }
}
async function salvarNovoFornecedorProduto(dados) {
  try {
    const res = await fetch('http://localhost:3000/api/fornecedor-produto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (res.ok) {
      alert("Vínculo salvo com sucesso!");
      renderAction("list");
    } else {
      const errorData = await res.json();
      alert("Erro ao salvar: " + errorData.error);
    }
  } catch (err) {
    console.error("Erro:", err);
  }
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
  if (confirm("Deseja realmente deletar este vínculo?")) {
    try {
      const res = await fetch(`http://localhost:3000/api/fornecedor-produto/${idFornecedor}/${idProduto}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert("Vínculo deletado com sucesso!");
        renderAction("list");
      } else {
        alert(data.error || "Erro ao deletar vínculo.");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }
}

// PEDIDOS
// PEDIDOS (Integrado com Pagamentos e Histórico)
async function carregarPedidosReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/pedidos?id_vendedor=${vendedorLogado.id_vendedor}`);
    const pedidos = await res.json();
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
  try {
    const res = await fetch(`http://localhost:3000/api/pedidos/${p.id_pedido}/itens`);
    const itens = await res.json();
    const container = document.querySelector("#order-items-container");
    if (container && itens.length > 0) {
      container.innerHTML = "";
      itens.forEach((i, idx) => {
        const row = document.createElement("div");
        row.className = "order-item-row";
        row.innerHTML = `
          <div class="form-field">
            <label>ID do Produto *</label>
            <input type="number" class="item-produto" min="1" value="${i.id_produto}" required placeholder="ID do produto">
          </div>
          <div class="form-field">
            <label>Quantidade *</label>
            <input type="number" class="item-quantidade" min="1" value="${i.quantidade}" required placeholder="Qtd">
          </div>
          <div class="form-field">
            <label>Preço Unitário (R$) *</label>
            <input type="number" class="item-preco" min="0" step="any" value="${i.preco_unitario}" required placeholder="Preço un.">
          </div>
          <button type="button" class="action-btn delete remove-item-btn">X</button>
        `;
        container.appendChild(row);
        row.querySelector(".remove-item-btn").addEventListener("click", () => {
          if (document.querySelectorAll(".order-item-row").length > 1) {
            row.remove();
          } else {
            alert("O pedido precisa ter pelo menos um item.");
          }
        });
      });
    }
  } catch (err) {
    console.error("Erro ao carregar itens para edição:", err);
  }
  const saveBtn = document.querySelector(".save-button");
  const newBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newBtn, saveBtn);
  newBtn.addEventListener("click", async () => {
    const itensRows = document.querySelectorAll(".order-item-row");
    const itens = [];
    let valorTotal = 0;
    itensRows.forEach(row => {
      const id_produto = Number(row.querySelector(".item-produto").value);
      const quantidade = Number(row.querySelector(".item-quantidade").value);
      const preco_unitario = Number(row.querySelector(".item-preco").value);
      const subtotal = quantidade * preco_unitario;
      valorTotal += subtotal;
      itens.push({ id_produto, quantidade, preco_unitario, subtotal });
    });
    const dataEmissaoVal = document.querySelector("#field-data_emissao")?.value || null;
    const atualizados = {
      id_cliente: Number(document.querySelector("#field-id_cliente").value),
      data_emissao: dataEmissaoVal ? dataEmissaoVal.replace("T", " ") + ":00" : null,
      valor_total: valorTotal,
      itens: itens
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
  try {
    const res = await fetch('http://localhost:3000/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (res.ok) {
      alert("Pedido cadastrado com sucesso!");
      renderAction("list");
    } else {
      const errorData = await res.json();
      alert("Erro ao salvar: " + errorData.error);
    }
  } catch (err) {
    console.error("Erro:", err);
  }
}
async function deletarPedido(id) {
  if (confirm("Deseja realmente deletar este pedido?")) {
    try {
      const res = await fetch(`http://localhost:3000/api/pedidos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert("Pedido deletado com sucesso!");
        renderAction("list");
      } else {
        alert(data.error || "Erro ao deletar pedido.");
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  }
}

// PAGAMENTOS
async function carregarPagamentosReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/pagamentos?id_vendedor=${vendedorLogado.id_vendedor}`);
    const pagamentos = await res.json();
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="6" style="text-align: center;">Nenhum pagamento encontrado.</td></tr>` :
        lista.map(pg => `
          <tr data-detail='${JSON.stringify(pg)}'>
            <td>#${pg.id_pagamento}</td>
            <td>Pedido #${pg.id_pedido} (${pg.cliente_nome || 'Cliente'})</td>
            <td>${pg.forma_pagamento}</td>
            <td>R$ ${Number(pg.valor).toFixed(2)}</td>
            <td><span class="status-pill finished">${pg.status}</span></td>
            <td>-</td>
          </tr>`).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", () => {
            const detail = row.getAttribute("data-detail");
            if (detail) openDetailModal("Detalhes do Pagamento", JSON.parse(detail));
          });
        });
      }
    };
    desenharTabela(pagamentos);
  } catch (err) {
    console.error("Erro ao carregar pagamentos:", err);
  }
}

// HISTÓRICO DE STATUS
async function carregarHistoricoStatusReais() {
  try {
    const res = await fetch(`http://localhost:3000/api/historico-status?id_vendedor=${vendedorLogado.id_vendedor}`);
    const historico = await res.json();
    const desenharTabela = (lista) => {
      let rowsHtml = lista.length === 0 ? `<tr><td colspan="3" style="text-align: center;">Nenhum registro no histórico.</td></tr>` :
        lista.map(h => `
          <tr data-detail='${JSON.stringify(h)}'>
            <td><strong>#Pedido ${h.id_pedido}</strong></td>
            <td>${new Date(h.data_alteracao).toLocaleString('pt-BR')}</td>
            <td>
              <span class="status-pill ${h.status === 'FINALIZADO' || h.status === 'PAGO' ? 'finished' : 'processing'}">${h.status}</span>
            </td>
          </tr>`).join("");
      const tbody = document.querySelector(".data-table tbody");
      if (tbody) {
        tbody.innerHTML = rowsHtml;
        tbody.querySelectorAll("tr").forEach(row => {
          row.addEventListener("click", () => {
            const detail = row.getAttribute("data-detail");
            if (detail) openDetailModal("Detalhes do Histórico", JSON.parse(detail));
          });
        });
      }
    };
    desenharTabela(historico);
  } catch (err) {
    console.error("Erro ao carregar histórico de status:", err);
  }
}

// MOCKS
function renderList() {
  const entity = entities[currentEntity];
  const headers = entity.columns.map(c => `<th>${c}</th>`).join("");
  let rowsHtml = "";
  const entidadesReais = ["produtos", "categorias", "clientes", "fornecedores", "fornecedor-produto", "pedidos", "pagamentos", "historico-status"];
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