CREATE DATABASE IF NOT EXISTS sgl_db
  DEFAULT CHARACTER SET utf8mb4;

USE sgl_db;

-- Tabela: Pessoa
CREATE TABLE pessoa (
    id_pessoa INT AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    cpf CHAR(11) NOT NULL,
    email VARCHAR(120) NOT NULL,
    telefone VARCHAR(20) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT pk_pessoa PRIMARY KEY (id_pessoa),
    CONSTRAINT uq_pessoa_cpf UNIQUE (cpf),
    CONSTRAINT uq_pessoa_email UNIQUE (email),
    CONSTRAINT ck_pessoa_cpf_tamanho CHECK (CHAR_LENGTH(cpf) = 11)
) ENGINE=InnoDB;


-- Tabela: Vendedor
CREATE TABLE vendedor (
    id_pessoa INT NOT NULL,
    login VARCHAR(50) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    
    CONSTRAINT pk_vendedor PRIMARY KEY (id_pessoa),
    CONSTRAINT uq_vendedor_login UNIQUE (login),
    CONSTRAINT fk_vendedor_pessoa FOREIGN KEY (id_pessoa)
        REFERENCES pessoa (id_pessoa)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- Tabela: Cliente
CREATE TABLE cliente (
    id_pessoa INT NOT NULL,
    id_vendedor INT NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_cliente PRIMARY KEY (id_pessoa),

    CONSTRAINT fk_cliente_pessoa
        FOREIGN KEY (id_pessoa)
        REFERENCES pessoa (id_pessoa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_cliente_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_cliente_vendedor
        UNIQUE (id_pessoa, id_vendedor)
) ENGINE=InnoDB;


-- Tabela: Fornecedor
CREATE TABLE fornecedor (
    id_fornecedor INT AUTO_INCREMENT,
    id_vendedor INT NOT NULL,
    cnpj CHAR(14) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    telefone VARCHAR(20) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_fornecedor PRIMARY KEY (id_fornecedor),
    CONSTRAINT uq_fornecedor_cnpj UNIQUE (cnpj, id_vendedor),
    CONSTRAINT ck_fornecedor_cnpj_tamanho CHECK (CHAR_LENGTH(cnpj) = 14),

    CONSTRAINT fk_fornecedor_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_fornecedor_vendedor
        UNIQUE (id_fornecedor, id_vendedor)
) ENGINE=InnoDB;


-- Tabela: Categoria
CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT,
    id_vendedor INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NULL,
    id_categoria_pai INT NULL,

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
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_categoria_vendedor
        UNIQUE (id_categoria, id_vendedor)
) ENGINE=InnoDB;


-- Tabela: Produto
CREATE TABLE produto (
    id_produto INT AUTO_INCREMENT,
    id_vendedor INT NOT NULL,
    id_categoria INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_produto PRIMARY KEY (id_produto),

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria, id_vendedor)
        REFERENCES categoria (id_categoria, id_vendedor)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_produto_vendedor
        FOREIGN KEY (id_vendedor)
        REFERENCES vendedor (id_pessoa)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT ck_produto_preco CHECK (preco_unitario >= 0.00),
    CONSTRAINT ck_produto_estoque CHECK (estoque >= 0),

    CONSTRAINT uq_produto_vendedor
        UNIQUE (id_produto, id_vendedor)
) ENGINE=InnoDB;


-- Tabela associativa: Fornecedor e Produto
CREATE TABLE fornecedor_produto (
    id_fornecedor INT NOT NULL,
    id_produto INT NOT NULL,
    id_vendedor INT NOT NULL,
    quantidade INT NOT NULL,
    preco_custo DECIMAL(10,2) NOT NULL,
    prazo_entrega_dias INT NOT NULL DEFAULT 1,

    CONSTRAINT pk_fornecedor_produto
        PRIMARY KEY (id_fornecedor, id_produto, id_vendedor),

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
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT ck_fp_quantidade CHECK (quantidade > 0),
    CONSTRAINT ck_fp_preco CHECK (preco_custo >= 0.00),
    CONSTRAINT ck_fp_prazo CHECK (prazo_entrega_dias > 0)
) ENGINE=InnoDB;


-- Tabela associativa: Cliente e Vendedor
CREATE TABLE pedido (
    id_pedido INT AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    id_vendedor INT NOT NULL,
    data_emissao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

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


-- Tabela associativa fraca: Produto e Pedido
CREATE TABLE item_pedido (
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

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


-- Tabela fraca: Status do Pedido (com histórico)
CREATE TABLE historico_status_pedido (
    id_pedido INT NOT NULL,
    data_alteracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL,

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


-- Tabela: Pagamento
CREATE TABLE pagamento (
    id_pagamento INT AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    forma_pagamento VARCHAR(30) NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSANDO',

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