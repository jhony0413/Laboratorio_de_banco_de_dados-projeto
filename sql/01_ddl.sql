CREATE DATABASE IF NOT EXISTS sgl_db
  DEFAULT CHARACTER SET utf8mb4;

USE sgl_db;

-- Tabela: Pessoa (Implementa RN01, RN02, RN27)

CREATE TABLE pessoa (
    id_pessoa INT AUTO_INCREMENT, -- Identificador único (PK)
    nome VARCHAR(100) NOT NULL,
    cpf CHAR(11) NOT NULL,        -- RN01: CPF único
    email VARCHAR(120) NOT NULL,  -- RN02: E-mail obrigatório e único
    telefone VARCHAR(20) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE, -- RN27: Inativação lógica
    
    CONSTRAINT pk_pessoa PRIMARY KEY (id_pessoa),
    CONSTRAINT uq_pessoa_cpf UNIQUE (cpf),
    CONSTRAINT uq_pessoa_email UNIQUE (email),
    CONSTRAINT ck_pessoa_cpf_tamanho CHECK (CHAR_LENGTH(cpf) = 11)
) ENGINE=InnoDB;

-- Tabela: Vendedor (Implementa RN03, RN27)

CREATE TABLE vendedor (
    id_pessoa INT NOT NULL,
    login VARCHAR(50) NOT NULL,       -- RN03: Login único
    senha_hash VARCHAR(255) NOT NULL, -- RN03: Senha em hash
    
    CONSTRAINT pk_vendedor PRIMARY KEY (id_pessoa),
    CONSTRAINT uq_vendedor_login UNIQUE (login),
    CONSTRAINT fk_vendedor_pessoa FOREIGN KEY (id_pessoa)
        REFERENCES pessoa (id_pessoa)
        ON DELETE RESTRICT -- Ajustado de CASCADE para RESTRICT (RN27)
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Tabela: Cliente (Implementa RN04, RN27)

CREATE TABLE cliente (
    id_pessoa INT NOT NULL,
    id_vendedor INT NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- RN04

    CONSTRAINT pk_cliente PRIMARY KEY (id_pessoa),

    CONSTRAINT fk_cliente_pessoa
        FOREIGN KEY (id_pessoa)
        REFERENCES pessoa (id_pessoa)
        ON DELETE RESTRICT -- Ajustado para RESTRICT (RN27)
        ON UPDATE CASCADE,

    CONSTRAINT fk_cliente_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE RESTRICT -- Ajustado de CASCADE para RESTRICT (RN27)
        ON UPDATE CASCADE,

    CONSTRAINT uq_cliente_vendedor
        UNIQUE (id_pessoa, id_vendedor)
) ENGINE=InnoDB;

-- Tabela: Fornecedor (Implementa RN06, RN07, RN27)

CREATE TABLE fornecedor (
    id_fornecedor INT AUTO_INCREMENT,
    id_vendedor INT NOT NULL,
    cnpj CHAR(14) NOT NULL,       -- RN06: CNPJ com 14 dígitos único por vendedor
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,  -- RN07: E-mail obrigatório
    telefone VARCHAR(20) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE, -- RN27

    CONSTRAINT pk_fornecedor PRIMARY KEY (id_fornecedor),
    CONSTRAINT uq_fornecedor_cnpj UNIQUE (cnpj, id_vendedor),
    CONSTRAINT ck_fornecedor_cnpj_tamanho CHECK (CHAR_LENGTH(cnpj) = 14),

    CONSTRAINT fk_fornecedor_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE RESTRICT -- Ajustado de CASCADE para RESTRICT (RN27)
        ON UPDATE CASCADE,

    CONSTRAINT uq_fornecedor_vendedor
        UNIQUE (id_fornecedor, id_vendedor)
) ENGINE=InnoDB;

-- Tabela: Categoria (Implementa RN08, RN09)

CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT,
    id_vendedor INT NOT NULL,
    nome VARCHAR(100) NOT NULL,      -- RN08: Nome único por vendedor
    descricao VARCHAR(255) NULL,
    id_categoria_pai INT NULL,       -- RN09: Autorrelacionamento hierárquico

    CONSTRAINT pk_categoria PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categoria_nome UNIQUE (nome, id_vendedor),

    CONSTRAINT fk_categoria_pai
        FOREIGN KEY (id_categoria_pai)
        REFERENCES categoria (id_categoria)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_categoria_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE RESTRICT -- Ajustado de CASCADE para RESTRICT (RN27)
        ON UPDATE CASCADE,

    CONSTRAINT uq_categoria_vendedor
        UNIQUE (id_categoria, id_vendedor)
) ENGINE=InnoDB;

-- Tabela: Produto (Implementa RN10, RN27)

CREATE TABLE produto (
    id_produto INT AUTO_INCREMENT,
    id_vendedor INT NOT NULL,
    id_categoria INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NULL,
    preco_unitario DECIMAL(10,2) NOT NULL, -- RN10: Não negativo
    estoque INT NOT NULL DEFAULT 0,         -- RN10: Não negativo
    ativo BOOLEAN NOT NULL DEFAULT TRUE,    -- RN27

    CONSTRAINT pk_produto PRIMARY KEY (id_produto),

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria, id_vendedor)
        REFERENCES categoria (id_categoria, id_vendedor)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_produto_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE RESTRICT -- Ajustado de CASCADE para RESTRICT (RN27)
        ON UPDATE CASCADE,

    CONSTRAINT ck_produto_preco CHECK (preco_unitario >= 0.00),
    CONSTRAINT ck_produto_estoque CHECK (estoque >= 0),

    CONSTRAINT uq_produto_vendedor
        UNIQUE (id_produto, id_vendedor)
) ENGINE=InnoDB;

-- Tabela associativa: Fornecedor e Produto (Implementa RN12, FNBC)

CREATE TABLE fornecedor_produto (
    id_fornecedor INT NOT NULL,
    id_produto INT NOT NULL,
    id_vendedor INT NOT NULL,
    quantidade INT NOT NULL,       -- RN12: Maior que zero
    preco_custo DECIMAL(10,2) NOT NULL, -- RN12: Não-negativo
    prazo_entrega_dias INT NOT NULL DEFAULT 1, -- RN12: Maior que zero

    -- Correção A5 (FNBC): PK mínima é (id_fornecedor, id_produto), pois id_fornecedor já determina id_vendedor
    CONSTRAINT pk_fornecedor_produto
        PRIMARY KEY (id_fornecedor, id_produto),

    CONSTRAINT fk_fp_fornecedor
        FOREIGN KEY (id_fornecedor, id_vendedor)
        REFERENCES fornecedor (id_fornecedor, id_vendedor)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_fp_produto
        FOREIGN KEY (id_produto, id_vendedor)
        REFERENCES produto (id_produto, id_vendedor)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_fp_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE RESTRICT -- Ajustado de CASCADE para RESTRICT (RN27)
        ON UPDATE CASCADE,

    CONSTRAINT ck_fp_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_fp_preco CHECK (preco_custo >= 0.00),
    CONSTRAINT ck_fp_prazo CHECK (prazo_entrega_dias > 0)
) ENGINE=InnoDB;

-- Tabela: Pedido (Implementa RN13, RN18)

CREATE TABLE pedido (
    id_pedido INT AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    id_vendedor INT NOT NULL,
    data_emissao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- RN18: Desnormalização controlada

    CONSTRAINT pk_pedido PRIMARY KEY (id_pedido),

    CONSTRAINT fk_pedido_cliente
        FOREIGN KEY (id_cliente, id_vendedor)
        REFERENCES cliente (id_pessoa, id_vendedor)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_pedido_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT ck_pedido_valor_total CHECK (valor_total >= 0.00),

    CONSTRAINT uq_pedido_vendedor
        UNIQUE (id_pedido, id_vendedor)
) ENGINE=InnoDB;

-- Tabela associativa fraca: Item Pedido (Implementa RN15, RN16, RN17)

CREATE TABLE item_pedido (
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,        -- RN15: > 0
    preco_unitario DECIMAL(10,2) NOT NULL, -- RN16: Congelado no momento da venda
    subtotal DECIMAL(10,2) NOT NULL,     -- RN17: Validado por cálculo

    CONSTRAINT pk_item_pedido
        PRIMARY KEY (id_pedido, id_produto),

    CONSTRAINT fk_item_pedido_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_item_pedido_produto
        FOREIGN KEY (id_produto)
        REFERENCES produto (id_produto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT ck_item_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_item_preco CHECK (preco_unitario >= 0.00),
    CONSTRAINT ck_item_subtotal CHECK (subtotal >= 0.00),
    CONSTRAINT ck_item_subtotal_calculo
        CHECK (subtotal = quantidade * preco_unitario)
) ENGINE=InnoDB;

-- Tabela fraca: Histórico Status Pedido (Implementa RN20, RN21, RN22)

CREATE TABLE historico_status_pedido (
    id_pedido INT NOT NULL,
    data_alteracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- RN22
    status VARCHAR(20) NOT NULL,                                -- RN21

    CONSTRAINT pk_historico_status
        PRIMARY KEY (id_pedido, data_alteracao),

    CONSTRAINT fk_historico_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT ck_historico_status
        CHECK (status IN (
            'PENDENTE',
            'PAGO',
            'FINALIZADO',
            'CANCELADO'
        ))
) ENGINE=InnoDB;

-- Tabela: Pagamento (Implementa RN24, RN25, RN26)

CREATE TABLE pagamento (
    id_pagamento INT AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    forma_pagamento VARCHAR(30) NOT NULL, -- RN25
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor DECIMAL(10,2) NOT NULL,         -- RN24: > 0
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSANDO', -- RN26

    CONSTRAINT pk_pagamento PRIMARY KEY (id_pagamento),

    CONSTRAINT fk_pagamento_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT ck_pagamento_valor CHECK (valor > 0.00),

    CONSTRAINT ck_pagamento_forma
        CHECK (forma_pagamento IN (
            'DINHEIRO',
            'CARTAO_CREDITO',
            'CARTAO_DEBITO',
            'PIX',
            'BOLETO'
        )),

    CONSTRAINT ck_pagamento_status
        CHECK (status IN (
            'PROCESSANDO',
            'APROVADO',
            'RECUSADO',
            'ESTORNADO'
        ))
) ENGINE=InnoDB;

-- ÍNDICES PARA CONSULTAS PRINCIPAIS (C3) *REVISAR*

CREATE INDEX idx_pessoa_nome ON pessoa(nome);
CREATE INDEX idx_produto_preco ON produto(preco_unitario);
CREATE INDEX idx_produto_estoque ON produto(estoque);
CREATE INDEX idx_pedido_data ON pedido(data_emissao);
CREATE INDEX idx_historico_status ON historico_status_pedido(status);