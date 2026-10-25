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

const singleMockProduct = {
  id: 1,
  nome: "Teclado Mecânico RGB",
  categoria: "Periféricos",
  preco: "R$ 299,00",
  estoque: 15,
  status: "Ativo"
};

const singleMockCategory = {
  id: 1,
  nome: "Periféricos",
  descricao: "Acessórios e periféricos para computador",
  categoriaPai: "Informática"
};

const singleMockClient = {
  id: 1,
  nome: "Maria da Silva",
  cpf: "123.456.789-00",
  email: "maria@email.com",
  telefone: "(11) 98765-4321",
  status: "Ativo"
};

const singleMockSupplier = {
  id: 1,
  nome: "TechDistribuidora Ltda",
  cnpj: "12.345.678/0001-99",
  email: "contato@techdist.com",
  telefone: "(11) 3333-4444",
  status: "Ativo"
};

const singleMockOrder = {
  id: 1,
  cliente: "Maria da Silva",
  categoria: "Periféricos",
  valor: "R$ 299,00",
  statusClass: "finished",
  statusLabel: "FINALIZADO"
};

const mockStatusHistory = [
  { id: "#1001", data: "24/10/2026 14:30", statusClass: "created", statusLabel: "CRIADO" },
  { id: "#1002", data: "24/10/2026 15:10", statusClass: "processing", statusLabel: "PROCESSANDO" },
  { id: "#1003", data: "24/10/2026 16:00", statusClass: "finished", statusLabel: "FINALIZADO" },
  { id: "#1004", data: "24/10/2026 16:45", statusClass: "canceled", statusLabel: "CANCELADO" }
];

const mockPayment = {
  id: 1,
  forma: "PIX",
  data: "24/10/2026 15:10",
  valor: "R$ 299,00",
  statusClass: "processing",
  statusLabel: "PROCESSANDO"
};

const mockSupplierProduct = {
  fornecedor: "TechDistribuidora Ltda",
  produto: "Teclado Mecânico RGB",
  quantidade: 50,
  custo: "R$ 150,00",
  prazo: "5 dias"
};

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
      ["id_categoria", "ID da Categoria", "number", true],
      ["valor_total", "Valor total (R$)", "number", true]
    ],
    columns: ["ID", "Cliente", "Categoria", "Valor total", "Status"]
  },
  "pagamentos": {
    label: "Pagamentos", singular: "pagamento", description: "Consulte e gerencie o processamento de pagamentos.",
    allowInsert: false,
    fields: [],
    columns: ["ID", "Forma", "Data", "Valor", "Status", "Ações"]
  },
  "historico-status": {
    label: "Histórico de status", singular: "registro de status", description: "Acompanhe as alterações de status dos pedidos.",
    allowInsert: false,
    fields: [],
    columns: ["ID", "Data da alteração", "Status"]
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

if (modalDeleteCancel) {
  modalDeleteCancel.addEventListener("click", () => modalDelete.hidden = true);
}
if (modalDeleteConfirm) {
  modalDeleteConfirm.addEventListener("click", () => {
    modalDelete.hidden = true;
  });
}
if (modalDetailClose) {
  modalDetailClose.addEventListener("click", () => modalDetail.hidden = true);
}

function openDeleteModal() {
  if (modalDelete) modalDelete.hidden = false;
}

function openDetailModal(title, dataObj) {
  if (!modalDetail) return;
  detailModalTitle.textContent = title;
  
  let htmlContent = "";
  for (const [key, value] of Object.entries(dataObj)) {
    htmlContent += `<p><strong>${key}:</strong> ${value}</p>`;
  }
  detailModalContent.innerHTML = htmlContent;
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
  if (insertBtn) {
    insertBtn.style.display = entity.allowInsert ? "inline-flex" : "none";
  }
}

function selectAction(action) {
  currentAction = action;
  crudButtons.forEach(button => {
    const selected = button.dataset.action === action;
    button.classList.toggle("is-selected", selected);
    if (button.dataset.action === "insert") {
      button.classList.toggle("primary", action === "insert");
    } else {
      button.classList.remove("primary");
    }
  });
}

function renderAction(action) {
  selectAction(action);
  const entity = entities[currentEntity];
  if (!entity) return;
  const plural = entity.label.toLowerCase();
  const singular = entity.singular;

  if (action === "insert" && entity.allowInsert) {
    operationTitle.textContent = `Inserir ${singular}`;
    operationDescription.textContent = "Preencha os campos para cadastrar um novo registro.";
    recordCount.textContent = "Novo registro";
    renderForm();
  } else {
    operationTitle.textContent = `Lista de ${plural}`;
    operationDescription.textContent = `Consulte os registros cadastrados em ${plural}.`;

    if (["produtos", "categorias", "clientes", "fornecedores", "pedidos", "pagamentos", "fornecedor-produto"].includes(currentEntity)) {
      recordCount.textContent = "1 registro";
    } else if (currentEntity === "historico-status") {
      recordCount.textContent = "4 registros";
    } else {
      recordCount.textContent = "0 registros";
    }

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
    control = `<select id="${id}" name="${name}" ${required ? "required" : ""}><option value="">Selecione...</option>${options.map(option => `<option value="${option}">${option}</option>`).join("")}</select>`;
  } else {
    const min = type === "number" ? 'min="0" step="any"' : "";
    control = `<input id="${id}" name="${name}" type="${type}" ${min} ${required ? "required" : ""} placeholder="${label}">`;
  }
  return `<div class="form-field ${type === "textarea" ? "full" : ""}"><label for="${id}">${label}${required ? " *" : ""}</label>${control}</div>`;
}

function renderForm() {
  const entity = entities[currentEntity];
  const fields = entity.fields.map(fieldMarkup).join("");

  let orderItemsHtml = "";
  if (currentEntity === "pedidos") {
    orderItemsHtml = `
      <div class="order-items-section">
        <div class="order-items-header">
          <span>Itens do Pedido</span>
        </div>
        <div class="order-item-row">
          <div class="form-field">
            <label>ID Produto *</label>
            <input type="number" min="1" placeholder="ID Produto">
          </div>
          <div class="form-field">
            <label>Quantidade *</label>
            <input type="number" min="1" placeholder="Quantidade">
          </div>
          <div class="form-field">
            <label>Preço Unitário (R$) *</label>
            <input type="number" min="0" step="any" placeholder="Preço unitário">
          </div>
        </div>
        <button class="add-item-btn" type="button">＋ Adicionar mais produtos</button>
      </div>`;
  }

  operationContent.innerHTML = `
    <form id="entity-form" onsubmit="event.preventDefault();">
      <div class="form-grid">
        ${fields}
        ${orderItemsHtml}
      </div>
      <div class="form-actions">
        <button class="save-button" type="button">Cadastrar</button>
        <button type="button" id="cancel-form">Cancelar</button>
      </div>
    </form>`;

  document.querySelector("#cancel-form").addEventListener("click", () => renderAction("list"));
}

function renderRegisterPaymentForm() {
  operationTitle.textContent = "Registrar Pagamento";
  operationDescription.textContent = "Informe os detalhes para registrar o pagamento do pedido.";
  recordCount.textContent = "Novo Pagamento";

  operationContent.innerHTML = `
    <form id="payment-register-form" onsubmit="event.preventDefault();">
      <div class="form-grid">
        <div class="form-field">
          <label for="pay-id-pedido">ID do Pedido *</label>
          <input id="pay-id-pedido" type="number" min="1" value="1002" required placeholder="ID do pedido">
        </div>
        <div class="form-field">
          <label for="pay-valor-total">Valor Total (R$) *</label>
          <input id="pay-valor-total" type="text" value="299,00" required placeholder="Valor total">
        </div>
        <div class="form-field">
          <label for="pay-valor-restante">Valor Restante (R$) *</label>
          <input id="pay-valor-restante" type="text" value="299,00" required placeholder="Valor restante">
        </div>
        <div class="form-field">
          <label for="pay-forma">Forma de Pagamento *</label>
          <select id="pay-forma" required>
            <option value="">Selecione...</option>
            <option value="PIX" selected>PIX</option>
            <option value="DINHEIRO">DINHEIRO</option>
            <option value="CARTAO_CREDITO">CARTÃO DE CRÉDITO</option>
            <option value="CARTAO_DEBITO">CARTÃO DE DÉBITO</option>
            <option value="BOLETO">BOLETO</option>
          </select>
        </div>
        <div class="form-field full">
          <label for="pay-valor-pago">Valor Pago (R$) *</label>
          <input id="pay-valor-pago" type="number" min="0" step="any" required placeholder="Informe o valor pago">
        </div>
      </div>
      <div class="form-actions">
        <button class="save-button" type="button">Confirmar Pagamento</button>
        <button type="button" id="cancel-payment-form">Voltar para Lista</button>
      </div>
    </form>`;

  document.querySelector("#cancel-payment-form").addEventListener("click", () => renderAction("list"));
}

function renderFilterBar() {
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

  return `
    <div class="filter-bar">
      <div class="filter-grid">
        <div class="filter-item search-item">
          <label for="search-input">Pesquisar por ID ou Nome</label>
          <input id="search-input" type="text" placeholder="Digite o ID ou nome do produto...">
        </div>
        <div class="filter-item">
          <label for="filter-category">Categoria</label>
          <select id="filter-category">
            <option value="">Todas as Categorias</option>
            <option value="perifericos">Periféricos</option>
            <option value="monitores">Monitores</option>
            <option value="moveis">Móveis</option>
          </select>
        </div>
        <div class="filter-item">
          <label>Faixa de Preço (R$)</label>
          <div class="price-range-inputs">
            <input type="number" placeholder="Mín" min="0">
            <span>até</span>
            <input type="number" placeholder="Máx" min="0">
          </div>
        </div>
        <div class="filter-item">
          <label for="filter-stock">Estoque</label>
          <select id="filter-stock">
            <option value="">Todos</option>
            <option value="in_stock">Em Estoque</option>
            <option value="low_stock">Estoque Baixo</option>
            <option value="out_of_stock">Esgotado</option>
          </select>
        </div>
      </div>
      <div class="filter-actions-row">
        <button class="filter-btn secondary" type="button">Limpar Filtros</button>
        <button class="filter-btn" type="button">Filtrar</button>
      </div>
    </div>`;
}

function renderList() {
  const entity = entities[currentEntity];
  const headers = entity.columns.map(column => `<th>${column}</th>`).join("");
  const filterHtml = renderFilterBar();

  let rowsHtml = "";

  if (currentEntity === "produtos") {
    const prod = singleMockProduct;
    rowsHtml = `
      <tr data-detail='${JSON.stringify(prod)}'>
        <td>#${prod.id}</td>
        <td><strong>${prod.nome}</strong></td>
        <td>${prod.categoria}</td>
        <td>${prod.preco}</td>
        <td>${prod.estoque} un.</td>
        <td><span class="status-pill finished">${prod.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); alert('Editar produto #${prod.id}');">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); openDeleteModal();">Deletar</button>
          </div>
        </td>
      </tr>`;
  } else if (currentEntity === "categorias") {
    const cat = singleMockCategory;
    rowsHtml = `
      <tr data-detail='${JSON.stringify(cat)}'>
        <td>#${cat.id}</td>
        <td><strong>${cat.nome}</strong></td>
        <td>${cat.descricao}</td>
        <td>${cat.categoriaPai}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); alert('Editar categoria #${cat.id}');">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); openDeleteModal();">Deletar</button>
          </div>
        </td>
      </tr>`;
  } else if (currentEntity === "clientes") {
    const cli = singleMockClient;
    const isAtivo = cli.status === "Ativo";
    rowsHtml = `
      <tr data-detail='${JSON.stringify(cli)}'>
        <td>#${cli.id}</td>
        <td><strong>${cli.nome}</strong></td>
        <td>${cli.cpf}</td>
        <td>${cli.email}</td>
        <td>${cli.telefone}</td>
        <td><span class="status-pill ${isAtivo ? 'finished' : 'canceled'}">${cli.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); alert('Editar cliente #${cli.id}');">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); openDeleteModal();">Deletar</button>
          </div>
        </td>
      </tr>`;
  } else if (currentEntity === "fornecedores") {
    const sup = singleMockSupplier;
    const isAtivo = sup.status === "Ativo";
    rowsHtml = `
      <tr data-detail='${JSON.stringify(sup)}'>
        <td>#${sup.id}</td>
        <td><strong>${sup.nome}</strong></td>
        <td>${sup.cnpj}</td>
        <td>${sup.email}</td>
        <td>${sup.telefone}</td>
        <td><span class="status-pill ${isAtivo ? 'finished' : 'canceled'}">${sup.status}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" type="button" onclick="event.stopPropagation(); alert('Editar fornecedor #${sup.id}');">Editar</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); openDeleteModal();">Deletar</button>
          </div>
        </td>
      </tr>`;
  } else if (currentEntity === "pedidos") {
    const ord = singleMockOrder;
    rowsHtml = `
      <tr data-detail='${JSON.stringify(ord)}'>
        <td>#${ord.id}</td>
        <td><strong>${ord.cliente}</strong></td>
        <td>${ord.categoria}</td>
        <td>${ord.valor}</td>
        <td><span class="status-pill ${ord.statusClass}">${ord.statusLabel}</span></td>
      </tr>`;
  } else if (currentEntity === "historico-status") {
    rowsHtml = mockStatusHistory.map(item => `
      <tr data-detail='${JSON.stringify(item)}'>
        <td><strong>${item.id}</strong></td>
        <td>${item.data}</td>
        <td><span class="status-pill ${item.statusClass}">${item.statusLabel}</span></td>
      </tr>
    `).join("");
  } else if (currentEntity === "pagamentos") {
    const pay = mockPayment;
    rowsHtml = `
      <tr data-detail='${JSON.stringify(pay)}'>
        <td>#${pay.id}</td>
        <td>${pay.forma}</td>
        <td>${pay.data}</td>
        <td>${pay.valor}</td>
        <td><span class="status-pill ${pay.statusClass}">${pay.statusLabel}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn register" id="btn-register-payment" type="button" onclick="event.stopPropagation(); renderRegisterPaymentForm();">Registrar pagamento</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); openDeleteModal();">Cancelar</button>
          </div>
        </td>
      </tr>`;
  } else if (currentEntity === "fornecedor-produto") {
    const sp = mockSupplierProduct;
    rowsHtml = `
      <tr data-detail='${JSON.stringify(sp)}'>
        <td><strong>${sp.fornecedor}</strong></td>
        <td>${sp.produto}</td>
        <td>${sp.quantidade} un.</td>
        <td>${sp.custo}</td>
        <td>${sp.prazo}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn confirm" type="button" onclick="event.stopPropagation(); alert('Entrega confirmada com sucesso!');">Confirmar entrega</button>
            <button class="action-btn delete" type="button" onclick="event.stopPropagation(); openDeleteModal();">Cancelar entrega</button>
          </div>
        </td>
      </tr>`;
  } else {
    rowsHtml = `
      <tr>
        <td colspan="${entity.columns.length}" style="text-align: center; color: #888; padding: 20px;">
          Nenhum registro encontrado para ${entity.label.toLowerCase()}.
        </td>
      </tr>`;
  }

  operationContent.innerHTML = `
    ${filterHtml}
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

  document.querySelectorAll(".data-table tbody tr").forEach(row => {
    row.addEventListener("click", () => {
      const detailAttr = row.getAttribute("data-detail");
      if (detailAttr) {
        const dataObj = JSON.parse(detailAttr);
        openDetailModal(`Detalhes em ${entities[currentEntity].label}`, dataObj);
      }
    });
  });

  const registerPayBtn = document.querySelector("#btn-register-payment");
  if (registerPayBtn) {
    registerPayBtn.addEventListener("click", renderRegisterPaymentForm);
  }
}

renderEntity();
renderAction("list");