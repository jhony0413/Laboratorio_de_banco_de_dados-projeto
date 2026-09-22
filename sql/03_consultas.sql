USE sgl_db;

-- 1 CONSULTAS BÁSICAS (5 Consultas)
-- Requisitos: Projeção, seleção com WHERE, ordenação, uso de LIKE, BETWEEN, IN e tratamento de NULL

-- 1.1 Quais são os clientes ativos cujo nome começa com a letra 'A' ou 'B'?
-- Atende ao requisito: Uso de LIKE
SELECT nome, cpf, email
FROM pessoa
WHERE ativo = TRUE AND (nome LIKE 'A%' OR nome LIKE 'B%')
ORDER BY nome;

-- 1.2 Quais clientes (pessoas cadastradas) não informaram um número de telefone?
-- Atende ao requisito: Tratamento de NULL
SELECT nome, cpf, email, telefone
FROM pessoa
WHERE telefone IS NULL
ORDER BY nome;

-- 1.3 Quais produtos possuem preço unitário na faixa de 100.00 a 200.00?
-- Atende ao requisito: Uso de BETWEEN
SELECT id_produto, nome, preco_unitario
FROM produto
WHERE preco_unitario BETWEEN 100.00 AND 200.00
ORDER BY preco_unitario DESC;

-- 1.4 Quais fornecedores estão ativos e possuem os IDs 1, 3 ou 5?
-- Atende ao requisito: Uso de IN
SELECT id_fornecedor, nome, cnpj, email
FROM fornecedor
WHERE id_fornecedor IN (1, 3, 5) AND ativo = TRUE
ORDER BY nome;

-- 1.5 Qual é a situação atual do estoque dos produtos com quantidade menor ou igual a 10?
-- Atende ao requisito: Projeção, WHERE e Ordenação
SELECT 
    id_produto, 
    nome AS produto, 
    estoque,
    CASE 
        WHEN estoque = 0 THEN 'CRÍTICO (SEM ESTOQUE)'
        WHEN estoque <= 10 THEN 'ALERTA (ESTOQUE BAIXO)'
        ELSE 'NORMAL'
    END AS situacao_estoque
FROM produto
WHERE ativo = TRUE AND estoque <= 10
ORDER BY estoque ASC;


-- 2 JUNÇÕES E AGREGAÇÃO (5 Consultas)
-- Requisitos: Ao menos uma com três tabelas, uma com LEFT JOIN, uma com GROUP BY e HAVING

-- 2.1 Quais são os produtos ativos, suas categorias e as respectivas categorias pai, se existirem?
-- Atende ao requisito: LEFT JOIN
SELECT 
    p.id_produto,
    p.nome AS produto,
    p.preco_unitario,
    p.estoque,
    c.nome AS categoria,
    COALESCE(cpai.nome, 'Categoria Principal') AS categoria_pai
FROM produto p
INNER JOIN categoria c ON p.id_categoria = c.id_categoria
LEFT JOIN categoria cpai ON c.id_categoria_pai = cpai.id_categoria
WHERE p.ativo = TRUE
ORDER BY c.nome, p.nome;

-- 2.2 Quais são os clientes cadastrados e os dados de seus vendedores responsáveis?
-- Atende ao requisito: Junção com múltiplas tabelas
SELECT 
    p_cli.id_pessoa AS id_cliente,
    p_cli.nome AS nome_cliente,
    p_cli.email AS email_cliente,
    c.data_cadastro,
    p_vend.nome AS vendedor_responsavel,
    v.login AS login_vendedor
FROM cliente c
INNER JOIN pessoa p_cli ON c.id_pessoa = p_cli.id_pessoa
INNER JOIN vendedor v ON c.id_vendedor = v.id_pessoa
INNER JOIN pessoa p_vend ON v.id_pessoa = p_vend.id_pessoa
ORDER BY p_cli.nome;

-- 2.3 Qual é o faturamento total e a quantidade de pedidos gerados por cada vendedor?
-- Atende ao requisito: GROUP BY com LEFT JOIN
SELECT 
    v.id_pessoa AS id_vendedor,
    p_vend.nome AS vendedor,
    COUNT(ped.id_pedido) AS total_pedidos,
    COALESCE(SUM(ped.valor_total), 0.00) AS faturamento_total
FROM vendedor v
INNER JOIN pessoa p_vend ON v.id_pessoa = p_vend.id_pessoa
LEFT JOIN pedido ped ON v.id_pessoa = ped.id_vendedor
GROUP BY v.id_pessoa, p_vend.nome
ORDER BY faturamento_total DESC;

-- 2.4 Quais clientes possuem um total gasto em compras superior à média geral de todos os pedidos da loja?
-- Atende ao requisito: GROUP BY e HAVING
SELECT 
    p_cli.nome AS cliente,
    COUNT(ped.id_pedido) AS quantidade_pedidos,
    SUM(ped.valor_total) AS total_gasto
FROM pedido ped
INNER JOIN cliente c ON ped.id_cliente = c.id_pessoa
INNER JOIN pessoa p_cli ON c.id_pessoa = p_cli.id_pessoa
GROUP BY c.id_pessoa, p_cli.nome
HAVING SUM(ped.valor_total) > (
    SELECT AVG(valor_total) 
    FROM pedido
)
ORDER BY total_gasto DESC;

-- 2.5 Quais são os produtos oferecidos pelos fornecedores, destacando os custos e a margem de lucro por unidade?
-- Atende ao requisito: Junção de 3 tabelas com cálculos matemáticos
SELECT 
    prod.nome AS produto,
    f.nome AS fornecedor,
    f.cnpj,
    fp.preco_custo,
    prod.preco_unitario AS preco_venda,
    (prod.preco_unitario - fp.preco_custo) AS margem_lucro,
    fp.prazo_entrega_dias
FROM fornecedor_produto fp
INNER JOIN fornecedor f 
    ON fp.id_fornecedor = f.id_fornecedor 
   AND fp.id_vendedor = f.id_vendedor
INNER JOIN produto prod 
    ON fp.id_produto = prod.id_produto 
   AND fp.id_vendedor = prod.id_vendedor
ORDER BY prod.nome, fp.preco_custo ASC;


-- 3 AVANÇADAS (5 Consultas)
-- Requisitos: Ao menos uma com subconsulta correlacionada, uma com EXISTS e pergunta não trivial

-- 3.1 Qual é o status mais recente e a respectiva forma de pagamento de cada pedido emitido?
-- Atende ao requisito: Subconsulta correlacionada
SELECT 
    ped.id_pedido,
    p_cli.nome AS cliente,
    ped.data_emissao,
    ped.valor_total,
    h.status AS status_atual,
    pag.forma_pagamento,
    pag.status AS status_pagamento
FROM pedido ped
INNER JOIN cliente c ON ped.id_cliente = c.id_pessoa
INNER JOIN pessoa p_cli ON c.id_pessoa = p_cli.id_pessoa
INNER JOIN historico_status_pedido h ON ped.id_pedido = h.id_pedido
LEFT JOIN pagamento pag ON ped.id_pedido = pag.id_pedido
WHERE h.data_alteracao = (
    SELECT MAX(h_sub.data_alteracao)
    FROM historico_status_pedido h_sub
    WHERE h_sub.id_pedido = ped.id_pedido
)
ORDER BY ped.id_pedido;

-- 3.2 Quais fornecedores do sistema possuem pelo menos um produto registrado em seu catálogo que atualmente está inativo?
-- Atende ao requisito: Uso do operador EXISTS
SELECT 
    f.id_fornecedor,
    f.nome,
    f.cnpj
FROM fornecedor f
WHERE EXISTS (
    SELECT 1
    FROM fornecedor_produto fp
    INNER JOIN produto p 
        ON fp.id_produto = p.id_produto 
       AND fp.id_vendedor = p.id_vendedor
    WHERE fp.id_fornecedor = f.id_fornecedor 
      AND fp.id_vendedor = f.id_vendedor
      AND p.ativo = FALSE
)
ORDER BY f.nome;

-- 3.3 Quais clientes realizaram pedidos contendo itens cujo subtotal de venda (unitário x quantidade) superou R$ 200,00?
-- Atende ao requisito: EXISTS com pergunta de negócio não trivial (foco em clientes de alto valor)
SELECT 
    p.id_pessoa,
    p.nome,
    p.email
FROM pessoa p
INNER JOIN cliente c ON p.id_pessoa = c.id_pessoa
WHERE EXISTS (
    SELECT 1
    FROM pedido ped
    INNER JOIN item_pedido ip ON ped.id_pedido = ip.id_pedido
    WHERE ped.id_cliente = c.id_pessoa 
      AND ip.subtotal > 200.00
)
ORDER BY p.nome;

-- 3.4 Quais produtos disponíveis no catálogo nunca foram vendidos (não constam em nenhum pedido)?
-- Atende ao requisito: Pergunta não trivial (identificação de produtos "encalhados" usando NOT EXISTS)
SELECT 
    prod.id_produto,
    prod.nome,
    prod.preco_unitario
FROM produto prod
WHERE NOT EXISTS (
    SELECT 1
    FROM item_pedido ip
    WHERE ip.id_produto = prod.id_produto
)
ORDER BY prod.nome;

-- 3.5 Qual é o detalhamento completo dos pedidos faturados pela loja, discriminando os itens comprados e o cliente final, para a realização de auditorias de venda?
-- Atende ao requisito: Pergunta de negócio não trivial, englobando a junção de 5 tabelas do domínio
SELECT 
    ped.id_pedido,
    ped.data_emissao,
    p_cli.nome AS cliente,
    prod.nome AS produto,
    ip.quantidade,
    ip.preco_unitario,
    ip.subtotal,
    ped.valor_total AS valor_total_pedido
FROM pedido ped
INNER JOIN cliente c ON ped.id_cliente = c.id_pessoa
INNER JOIN pessoa p_cli ON c.id_pessoa = p_cli.id_pessoa
INNER JOIN item_pedido ip ON ped.id_pedido = ip.id_pedido
INNER JOIN produto prod ON ip.id_produto = prod.id_produto
ORDER BY ped.id_pedido, prod.nome;