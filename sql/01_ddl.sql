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
    forma_pagamento VARCHAR(30) NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valor DECIMAL(10 , 2 ) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSANDO',
    CONSTRAINT pk_pagamento PRIMARY KEY (id_pagamento),
    CONSTRAINT fk_pagamento_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_pagamento_valor CHECK (valor > 0.00),
    CONSTRAINT ck_pagamento_forma CHECK (forma_pagamento IN ('DINHEIRO' , 'CARTAO_CREDITO',
        'CARTAO_DEBITO',
        'PIX',
        'BOLETO')),
    CONSTRAINT ck_pagamento_status CHECK (status IN ('PROCESSANDO' , 'APROVADO', 'RECUSADO', 'ESTORNADO'))
)  ENGINE=INNODB;

-- VIEW (B1 e B5)

CREATE OR REPLACE VIEW vw_relatorio_consolidado AS
SELECT 
    p.id_pedido,
    p.id_vendedor,
    p.data_emissao,
    p.valor_total,
    c.id_pessoa AS id_cliente,
    pes_cliente.nome AS cliente_nome,
    pes_cliente.cpf AS cliente_cpf,
    (SELECT h.status FROM historico_status_pedido h WHERE h.id_pedido = p.id_pedido ORDER BY h.data_alteracao DESC LIMIT 1) AS status_atual
FROM pedido p
JOIN cliente c ON p.id_cliente = c.id_pessoa AND p.id_vendedor = c.id_vendedor
JOIN pessoa pes_cliente ON c.id_pessoa = pes_cliente.id_pessoa;

-- EXPLAIN e INDEX 1 (B4)

EXPLAIN
SELECT c.id_pessoa AS id_clientepessoa, p_pes.nome AS cliente_nome, 
       COUNT(ped.id_pedido) AS total_pedidos, 
       SUM(ped.valor_total) AS valor_gasto_total
FROM cliente c
JOIN pessoa p_pes ON c.id_pessoa = p_pes.id_pessoa
JOIN pedido ped ON c.id_pessoa = ped.id_cliente
WHERE ped.id_vendedor = 1
GROUP BY c.id_pessoa, p_pes.nome;

CREATE INDEX idx_pedido_vendedor_cliente ON pedido(id_vendedor, id_cliente);

-- EXPLAIN e INDEX 2 (B4)

EXPLAIN
SELECT pr.id_produto, pr.nome AS produto_nome, 
       SUM(ip.quantidade) AS qtd_total_vendida,
       SUM(ip.subtotal) AS receita_total
FROM produto pr
JOIN item_pedido ip ON pr.id_produto = ip.id_produto
WHERE pr.id_vendedor = 1
GROUP BY pr.id_produto, pr.nome;

CREATE INDEX idx_item_pedido_produto ON item_pedido(id_produto);

-- EXPLAIN e INDEX 3 (B4)

EXPLAIN
SELECT p.*, pes.nome AS cliente_nome,
       (SELECT h.status FROM historico_status_pedido h WHERE h.id_pedido = p.id_pedido ORDER BY h.data_alteracao DESC LIMIT 1) AS status_atual
FROM pedido p
JOIN cliente c ON p.id_cliente = c.id_pessoa
JOIN pessoa pes ON c.id_pessoa = pes.id_pessoa
WHERE p.id_vendedor = 1;

CREATE INDEX idx_historico_pedido_data ON historico_status_pedido(id_pedido, data_alteracao DESC);

-- DCL (B5)

-- 1. CRIAÇÃO DOS ROLES / PERFIS
CREATE ROLE IF NOT EXISTS 'sgl_admin';
CREATE ROLE IF NOT EXISTS 'sgl_vendedor';
CREATE ROLE IF NOT EXISTS 'sgl_auditor';

-- 2. ATRIBUIÇÃO DE PRIVILÉGIOS PARA O PERFIL ADMINISTRADOR
GRANT ALL PRIVILEGES ON sgl_db.* TO 'sgl_admin';

-- 3. ATRIBUIÇÃO DE PRIVILÉGIOS PARA O PERFIL VENDEDOR (Princípio do Menor Privilégio)
GRANT SELECT, INSERT, UPDATE ON sgl_db.pessoa TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE ON sgl_db.cliente TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE ON sgl_db.vendedor TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE ON sgl_db.categoria TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE ON sgl_db.produto TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE, DELETE ON sgl_db.fornecedor TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE, DELETE ON sgl_db.fornecedor_produto TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE, DELETE ON sgl_db.pedido TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE, DELETE ON sgl_db.item_pedido TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE, DELETE ON sgl_db.historico_status_pedido TO 'sgl_vendedor';
GRANT SELECT, INSERT, UPDATE, DELETE ON sgl_db.pagamento TO 'sgl_vendedor';
GRANT SELECT ON sgl_db.vw_relatorio_consolidado TO 'sgl_vendedor';

-- 4. ATRIBUIÇÃO DE PRIVILÉGIOS PARA O PERFIL AUDITOR (Apenas Leitura)
GRANT SELECT ON sgl_db.vw_relatorio_consolidado TO 'sgl_auditor';
GRANT SELECT ON sgl_db.produto TO 'sgl_auditor';
GRANT SELECT ON sgl_db.categoria TO 'sgl_auditor';
GRANT SELECT ON sgl_db.historico_status_pedido TO 'sgl_auditor';

-- 5. CRIAÇÃO DOS USUÁRIOS E ATRIBUIÇÃO DOS ROLES
CREATE USER IF NOT EXISTS 'user_admin'@'localhost' IDENTIFIED BY 'AdminPass123!';
CREATE USER IF NOT EXISTS 'user_app'@'localhost' IDENTIFIED BY 'AppServerPass456!';
CREATE USER IF NOT EXISTS 'user_auditor'@'localhost' IDENTIFIED BY 'AuditorPass789!';

GRANT 'sgl_admin' TO 'user_admin'@'localhost';
GRANT 'sgl_vendedor' TO 'user_app'@'localhost';
GRANT 'sgl_auditor' TO 'user_auditor'@'localhost';

-- Definir roles ativas por padrão no login
SET DEFAULT ROLE 'sgl_admin' TO 'user_admin'@'localhost';
SET DEFAULT ROLE 'sgl_vendedor' TO 'user_app'@'localhost';
SET DEFAULT ROLE 'sgl_auditor' TO 'user_auditor'@'localhost';

FLUSH PRIVILEGES;

-- Tabela centralizadora de auditoria do sistema (B6)
CREATE TABLE IF NOT EXISTS auditoria_sistema (
    id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
    tabela_afetada VARCHAR(50) NOT NULL,
    id_registro INT NOT NULL,
    operacao VARCHAR(20) NOT NULL,          -- Ex: 'UPDATE_PRECO', 'UPDATE_STATUS'
    id_vendedor INT NULL,                   -- Operador responsável pela alteração
    valor_antigo TEXT NULL,                 -- Estado dos dados antes da modificação
    valor_novo TEXT NULL,                   -- Estado dos dados após a modificação
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- GATILHO 1 (B6)
DELIMITER //

CREATE TRIGGER trg_auditoria_preco_produto
BEFORE UPDATE ON produto
FOR EACH ROW
BEGIN
    -- Verifica se houve alteração efetiva no preço unitário
    IF OLD.preco_unitario <> NEW.preco_unitario THEN
        INSERT INTO auditoria_sistema (
            tabela_afetada, 
            id_registro, 
            operacao, 
            id_vendedor, 
            valor_antigo, 
            valor_novo
        ) 
        VALUES (
            'produto',
            OLD.id_produto,
            'UPDATE_PRECO',
            NEW.id_vendedor,
            CONCAT('Preço Anterior: R$ ', OLD.preco_unitario),
            CONCAT('Novo Preço: R$ ', NEW.preco_unitario)
        );
    END IF;
END//

DELIMITER ;

-- GATILHO 2 (B6)
DELIMITER //

CREATE TRIGGER trg_auditoria_status_pedido
AFTER INSERT ON historico_status_pedido
FOR EACH ROW
BEGIN
    DECLARE v_id_vendedor INT;

    -- Recupera o id_vendedor associado ao pedido em questão
    SELECT id_vendedor INTO v_id_vendedor 
    FROM pedido 
    WHERE id_pedido = NEW.id_pedido;

    -- Insere o registro na tabela de auditoria central
    INSERT INTO auditoria_sistema (
        tabela_afetada, 
        id_registro, 
        operacao, 
        id_vendedor, 
        valor_antigo, 
        valor_novo
    ) 
    VALUES (
        'pedido',
        NEW.id_pedido,
        'MUDANCA_STATUS',
        v_id_vendedor,
        'Status Anterior (Ver historico_status_pedido)',
        CONCAT('Novo Status: ', NEW.status)
    );
END//

DELIMITER ;