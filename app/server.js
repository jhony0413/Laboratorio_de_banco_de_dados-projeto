const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
const db = mysql.createConnection({
    host: 'localhost',
    user: 'user_app',
    password: 'AppServerPass456!',
    database: 'sgl_db'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err.message);
        return;
    }

    console.log('Conectado ao banco de dados sgl_db com sucesso!');
});

// ROTA DE CADASTRO DE VENDEDOR
app.post('/api/cadastrar', (req, res) => {
    const { nome, cpf, email, telefone, login, senha } = req.body;
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
    const queryPessoa = `
    INSERT INTO pessoa (nome, cpf, email, telefone, ativo) 
    VALUES (?, ?, ?, ?, TRUE)
  `;
    db.query(queryPessoa, [nome, cpfLimpo, email, telefone], (err, resultPessoa) => {
        if (err) {
            console.error('Erro ao cadastrar pessoa:', err);
            return res.status(500).json({ error: 'Este CPF ou e-mail já está cadastrado no sistema.' });

        }

        const idPessoa = resultPessoa.insertId;
        const queryVendedor = `
      INSERT INTO vendedor (id_pessoa, login, senha_hash) 
      VALUES (?, ?, ?)
    `;
        db.query(queryVendedor, [idPessoa, login, senha], (errVendedor) => {
            if (errVendedor) {
                console.error('Erro ao cadastrar vendedor:', errVendedor);
                return res.status(500).json({ error: 'Este nome de login já está em uso. Escolha outro.' });

            }

            res.status(201).json({ message: 'Conta criada com sucesso!' });

        });

    });

});

// ROTA DE LOGIN
app.post('/api/login', (req, res) => {
    const { login, senha } = req.body;
    const query = `
    SELECT v.id_pessoa AS id_vendedor, p.nome, v.login 
    FROM vendedor v
    JOIN pessoa p ON v.id_pessoa = p.id_pessoa
    WHERE v.login = ? AND v.senha_hash = ? AND p.ativo = TRUE
  `;
    db.query(query, [login, senha], (err, results) => {
        if (err) {
            console.error('Erro no login:', err);
            return res.status(500).json({ error: 'Erro no servidor' });

        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos!' });

        }

        const vendedor = results[0];
        res.json({
            message: 'Login realizado com sucesso!',
            vendedor: {
                id_vendedor: vendedor.id_vendedor,
                nome: vendedor.nome,
                login: vendedor.login
            }

        });

    });

});

// ROTAS DE CONSULTAS PARAMETRIZADAS COM JUNÇÃO E AGREGAÇÃO (Requisito B1)
app.get('/api/relatorios/vendas-cliente', (req, res) => {
    const { id_vendedor, min_total } = req.query;
    if (!id_vendedor) return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    let query = `
        SELECT c.id_pessoa AS id_clientepessoa, p_pes.nome AS cliente_nome, 
               COUNT(ped.id_pedido) AS total_pedidos, 
               SUM(ped.valor_total) AS valor_gasto_total
        FROM cliente c
        JOIN pessoa p_pes ON c.id_pessoa = p_pes.id_pessoa
        JOIN pedido ped ON c.id_pessoa = ped.id_cliente
        WHERE ped.id_vendedor = ?
        GROUP BY c.id_pessoa, p_pes.nome
    `;
    let params = [id_vendedor];
    if (min_total) {
        query += ` HAVING SUM(ped.valor_total) >= ?`;
        params.push(Number(min_total));
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar relatório de vendas por cliente:', err);
            return res.status(500).json({ error: 'Erro ao gerar relatório' });

        }

        res.json(results);
    });

});

app.get('/api/relatorios/produtos-vendidos', (req, res) => {
    const { id_vendedor, min_qtd } = req.query;
    if (!id_vendedor) return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    let query = `
        SELECT pr.id_produto, pr.nome AS produto_nome, 
               SUM(ip.quantidade) AS qtd_total_vendida,
               SUM(ip.subtotal) AS receita_total
        FROM produto pr
        JOIN item_pedido ip ON pr.id_produto = ip.id_produto
        JOIN pedido ped ON ip.id_pedido = ped.id_pedido
        WHERE pr.id_vendedor = ?
        GROUP BY pr.id_produto, pr.nome
    `;
    let params = [id_vendedor];
    if (min_qtd) {
        query += ` HAVING SUM(ip.quantidade) >= ?`;
        params.push(Number(min_qtd));
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar relatório de produtos vendidos:', err);
            return res.status(500).json({ error: 'Erro ao gerar relatório' });

        }

        res.json(results);
    });

});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

// ROTA PARA O RELATÓRIO CONSOLIDADO VIA VISÃO (Requisito B1)
app.get('/api/relatorios/consolidado', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = 'SELECT * FROM vw_relatorio_consolidado WHERE id_vendedor = ?';
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar relatório consolidado da view:', err);
            return res.status(500).json({ error: 'Erro ao gerar relatório consolidado' });

        }

        res.json(results);
    });

});

// ROTAS DE PRODUTOS
app.get('/api/produtos', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = 'SELECT * FROM produto WHERE ativo = TRUE AND id_vendedor = ?';
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar produtos:', err);
            return res.status(500).json({ error: 'Erro ao buscar produtos' });

        }

        res.json(results);
    });

});

app.post('/api/produtos', (req, res) => {
    const { id_vendedor, id_categoria, nome, descricao, preco_unitario, estoque } = req.body;
    const query = `
    INSERT INTO produto (id_vendedor, id_categoria, nome, descricao, preco_unitario, estoque, ativo) 
    VALUES (?, ?, ?, ?, ?, ?, TRUE)
  `;
    const values = [id_vendedor, id_categoria, nome, descricao, preco_unitario, estoque];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro no produto:', err);
            if (err.errno === 1452) {
                return res.status(400).json({ error: 'A categoria informada não existe no sistema.' });
            }
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ message: 'Produto cadastrado com sucesso!', id_produto: result.insertId });

    });

});

app.put('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    const { id_categoria, nome, descricao, preco_unitario, estoque } = req.body;
    const query = `
    UPDATE produto 
    SET id_categoria = ?, nome = ?, descricao = ?, preco_unitario = ?, estoque = ?
    WHERE id_produto = ?
  `;
    const values = [id_categoria, nome, descricao, preco_unitario, estoque, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro no produto:', err);
            if (err.errno === 1452) {
                return res.status(400).json({ error: 'A categoria informada não existe no sistema.' });
            }
            return res.status(500).json({ error: err.message });
        }

        res.json({ message: 'Produto atualizado com sucesso!' });

    });

});

app.delete('/api/produtos/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM produto WHERE id_produto = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar produto:', err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
                return res.status(400).json({ error: 'Não é possível excluir este produto pois ele possui pedidos ou vínculos ativos.' });

            }

            return res.status(500).json({ error: 'Não foi possível excluir o produto no momento. Tente novamente mais tarde.' });

        }

        res.json({ message: 'Produto deletado com sucesso!' });

    });

});

// ROTAS DE CATEGORIAS
app.get('/api/categorias', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = 'SELECT * FROM categoria WHERE id_vendedor = ?';
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar categorias:', err);
            return res.status(500).json({ error: 'Erro ao buscar categorias' });

        }

        res.json(results);
    });

});

app.post('/api/categorias', (req, res) => {
    const { id_vendedor, nome, descricao, id_categoria_pai } = req.body;
    const query = `
    INSERT INTO categoria (id_vendedor, nome, descricao, id_categoria_pai) 
    VALUES (?, ?, ?, ?)
  `;
    const values = [id_vendedor, nome, descricao, id_categoria_pai || null];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar categoria:', err);
            if (err.errno === 1452) {
                return res.status(400).json({ error: 'A categoria principal informada não existe no sistema.' });
            }
            return res.status(500).json({ error: 'Não foi possível cadastrar a categoria. Verifique os dados.' });

        }

        res.status(201).json({ message: 'Categoria cadastrada com sucesso!', id_categoria: result.insertId });

    });

});

app.put('/api/categorias/:id', (req, res) => {
    const { id } = req.params;
    const { nome, descricao, id_categoria_pai } = req.body;
    const query = `
    UPDATE categoria 
    SET nome = ?, descricao = ?, id_categoria_pai = ?
    WHERE id_categoria = ?
  `;
    const values = [nome, descricao, id_categoria_pai || null, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar categoria:', err);
            return res.status(500).json({ error: 'Não foi possível atualizar a categoria no momento.' });

        }

        res.json({ message: 'Categoria atualizada com sucesso!' });

    });

});

app.delete('/api/categorias/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM categoria WHERE id_categoria = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar categoria:', err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
                return res.status(400).json({ error: 'Não é possível excluir esta categoria pois existem produtos ou subcategorias vinculados a ela.' });

            }

            return res.status(500).json({ error: 'Não foi possível excluir a categoria.' });

        }

        res.json({ message: 'Categoria deletada com sucesso!' });

    });

});

// ROTAS DE CLIENTES
app.get('/api/clientes', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = `
        SELECT p.*, c.data_cadastro 
        FROM pessoa p
        JOIN cliente c ON p.id_pessoa = c.id_pessoa
        WHERE p.ativo = TRUE AND c.id_vendedor = ?
    `;
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err);
            return res.status(500).json({ error: 'Erro ao buscar clientes' });

        }

        res.json(results);
    });

});

app.post('/api/clientes', (req, res) => {
    const { id_vendedor, nome, cpf, email, telefone } = req.body;
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
    const queryPessoa = `
        INSERT INTO pessoa (nome, cpf, email, telefone, ativo) 
        VALUES (?, ?, ?, ?, TRUE)
    `;
    db.query(queryPessoa, [nome, cpfLimpo, email, telefone], (err, resultPessoa) => {
        if (err) {
            console.error('Erro ao cadastrar pessoa do cliente:', err);
            if (err.errno === 1062) {
                return res.status(400).json({ error: 'Este CPF ou e-mail já está cadastrado para outro cliente.' });
            }
            return res.status(500).json({ error: 'Não foi possível cadastrar o cliente. Verifique os dados.' });

        }

        const idPessoa = resultPessoa.insertId;
        const queryCliente = `
            INSERT INTO cliente (id_pessoa, id_vendedor) 
            VALUES (?, ?)
        `;
        db.query(queryCliente, [idPessoa, id_vendedor], (errCliente) => {
            if (errCliente) {
                console.error('Erro ao vincular cliente:', errCliente);
                return res.status(500).json({ error: 'Não foi possível concluir o vínculo do cliente.' });

            }

            res.status(201).json({ message: 'Cliente cadastrado com sucesso!', id_pessoa: idPessoa });

        });

    });

});

app.put('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { nome, cpf, email, telefone } = req.body;
    const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '';
    const query = `
        UPDATE pessoa 
        SET nome = ?, cpf = ?, email = ?, telefone = ?
        WHERE id_pessoa = ?
    `;
    const values = [nome, cpfLimpo, email, telefone, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar cliente:', err);
            if (err.errno === 1062) {
                return res.status(400).json({ error: 'Este CPF ou e-mail já pertence a outro cliente.' });
            }
            return res.status(500).json({ error: 'Não foi possível atualizar os dados do cliente.' });

        }

        res.json({ message: 'Cliente atualizado com sucesso!' });

    });

});

app.delete('/api/clientes/:id', (req, res) => {
    const { id } = req.params;
    const queryCliente = 'DELETE FROM cliente WHERE id_pessoa = ?';
    db.query(queryCliente, [id], (errCliente) => {
        if (errCliente) {
            console.error('Erro ao deletar vínculo do cliente:', errCliente);
            if (errCliente.code === 'ER_ROW_IS_REFERENCED_2' || errCliente.errno === 1451) {
                return res.status(400).json({ error: 'Não é possível excluir este cliente pois ele possui pedidos cadastrados.' });

            }

            return res.status(500).json({ error: 'Não foi possível excluir o cliente.' });

        }

        const queryPessoa = 'DELETE FROM pessoa WHERE id_pessoa = ?';
        db.query(queryPessoa, [id], (errPessoa) => {
            if (errPessoa) {
                console.error('Erro ao deletar pessoa do cliente:', errPessoa);
                return res.status(500).json({ error: 'Erro ao remover os dados pessoais do cliente.' });

            }

            res.json({ message: 'Cliente deletado com sucesso!' });

        });

    });

});

// ROTAS DE FORNECEDORES
app.get('/api/fornecedores', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = 'SELECT * FROM fornecedor WHERE id_vendedor = ?';
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar fornecedores:', err);
            return res.status(500).json({ error: 'Erro ao buscar fornecedores' });

        }

        res.json(results);
    });

});

app.post('/api/fornecedores', (req, res) => {
    const { id_vendedor, nome, cnpj, email, telefone } = req.body;
    const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : '';
    const query = `
        INSERT INTO fornecedor (id_vendedor, nome, cnpj, email, telefone, ativo) 
        VALUES (?, ?, ?, ?, ?, TRUE)
    `;
    const values = [id_vendedor, nome, cnpjLimpo, email, telefone];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao salvar fornecedor:', err);
            if (err.errno === 1062) {
                return res.status(400).json({ error: 'Este CNPJ já está cadastrado para outro fornecedor.' });
            }
            return res.status(500).json({ error: 'Não foi possível salvar o fornecedor. Verifique os dados.' });

        }

        res.status(201).json({ message: 'Fornecedor cadastrado com sucesso!', id_fornecedor: result.insertId });

    });

});

app.put('/api/fornecedores/:id', (req, res) => {
    const { id } = req.params;
    const { nome, cnpj, email, telefone } = req.body;
    const cnpjLimpo = cnpj ? cnpj.replace(/\D/g, '') : '';
    const query = `
        UPDATE fornecedor 
        SET nome = ?, cnpj = ?, email = ?, telefone = ?
        WHERE id_fornecedor = ?
    `;
    const values = [nome, cnpjLimpo, email, telefone, id];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar fornecedor:', err);
            if (err.errno === 1062) {
                return res.status(400).json({ error: 'Este CNPJ já está cadastrado para outro fornecedor.' });
            }
            return res.status(500).json({ error: 'Não foi possível atualizar o fornecedor no momento.' });

        }

        res.json({ message: 'Fornecedor atualizado com sucesso!' });

    });

});

app.delete('/api/fornecedores/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM fornecedor WHERE id_fornecedor = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Erro ao deletar fornecedor:', err);
            if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
                return res.status(400).json({ error: 'Não é possível excluir este fornecedor pois existem produtos associados a ele.' });

            }

            return res.status(500).json({ error: 'Não foi possível excluir o fornecedor no momento.' });

        }

        res.json({ message: 'Fornecedor deletado com sucesso!' });

    });

});

// ROTAS DE FORNECEDOR-PRODUTO
app.get('/api/fornecedor-produto', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = `
        SELECT fp.*, f.nome AS fornecedor_nome, p.nome AS produto_nome 
        FROM fornecedor_produto fp
        JOIN fornecedor f ON fp.id_fornecedor = f.id_fornecedor
        JOIN produto p ON fp.id_produto = p.id_produto
        WHERE fp.id_vendedor = ?
    `;
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar vínculos fornecedor-produto:', err);
            return res.status(500).json({ error: 'Erro ao buscar vínculos' });

        }

        res.json(results);
    });

});

app.post('/api/fornecedor-produto', (req, res) => {
    const { id_vendedor, id_fornecedor, id_produto, quantidade, preco_custo, prazo_entrega_dias } = req.body;
    const query = `
        INSERT INTO fornecedor_produto (id_fornecedor, id_produto, id_vendedor, quantidade, preco_custo, prazo_entrega_dias) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [id_fornecedor, id_produto, id_vendedor, quantidade, preco_custo, prazo_entrega_dias || 1];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar vínculo:', err);
            if (err.errno === 1452) {
                return res.status(400).json({ error: 'O fornecedor ou produto selecionado não foi encontrado no sistema.' });
            }
            if (err.errno === 1062) {
                return res.status(400).json({ error: 'Este produto já está vinculado a este fornecedor.' });
            }
            return res.status(500).json({ error: 'Não foi possível criar o vínculo entre fornecedor e produto.' });
        }

        res.status(201).json({ message: 'Vínculo cadastrado com sucesso!' });

    });

});

app.put('/api/fornecedor-produto/:id_fornecedor/:id_produto', (req, res) => {
    const { id_fornecedor, id_produto } = req.params;
    const { quantidade, preco_custo, prazo_entrega_dias } = req.body;
    const query = `
        UPDATE fornecedor_produto 
        SET quantidade = ?, preco_custo = ?, prazo_entrega_dias = ?
        WHERE id_fornecedor = ? AND id_produto = ?
    `;
    const values = [quantidade, preco_custo, prazo_entrega_dias, id_fornecedor, id_produto];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar vínculo:', err);
            return res.status(500).json({ error: 'Não foi possível atualizar o vínculo entre fornecedor e produto.' });

        }

        res.json({ message: 'Vínculo atualizado com sucesso!' });

    });

});

// ROTA PARA BUSCAR OS ITENS DE UM PEDIDO
app.get('/api/pedidos/:id/itens', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT ip.*, p.nome AS produto_nome 
        FROM item_pedido ip
        JOIN produto p ON ip.id_produto = p.id_produto
        WHERE ip.id_pedido = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar itens do pedido:', err);
            return res.status(500).json({ error: 'Erro ao buscar itens do pedido' });

        }

        res.json(results);
    });

});

// ROTAS AUXILIARES PARA PAGAMENTOS E HISTÓRICOS DE PEDIDO ESPECIFICO
app.get('/api/pedidos/:id/pagamentos', (req, res) => {
    db.query('SELECT * FROM pagamento WHERE id_pedido = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar pagamentos' });

        res.json(results);
    });

});

app.get('/api/pedidos/:id/historico', (req, res) => {
    db.query('SELECT * FROM historico_status_pedido WHERE id_pedido = ? ORDER BY data_alteracao DESC', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar histórico' });

        res.json(results);
    });

});

// ROTAS DE PEDIDOS
app.get('/api/pedidos', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });
    }

    const query = `
        SELECT p.*, pes.nome AS cliente_nome,
               (SELECT h.status FROM historico_status_pedido h WHERE h.id_pedido = p.id_pedido ORDER BY h.data_alteracao DESC LIMIT 1) AS status_atual
        FROM pedido p
        JOIN cliente c ON p.id_cliente = c.id_pessoa
        JOIN pessoa pes ON c.id_pessoa = pes.id_pessoa
        WHERE p.id_vendedor = ?
    `;
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pedidos:', err);
            return res.status(500).json({ error: 'Erro ao buscar pedidos' });
        }
        res.json(results);
    });
});

app.post('/api/pedidos', (req, res) => {
    const { id_vendedor, id_cliente, data_emissao, pagamentos, status_inicial } = req.body;
    let { itens } = req.body;
    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: 'O pedido deve conter pelo menos um item.' });
    }

    db.beginTransaction((errTrans) => {
        if (errTrans) return res.status(500).json({ error: 'Erro interno no servidor.' });

        let itensProcessados = [];
        let valorTotalCalculado = 0;
        let validacoesPendentes = itens.length;
        let erroProcessamento = null;

        itens.forEach(i => {
            db.query('SELECT estoque, nome, preco_unitario FROM produto WHERE id_produto = ?', [i.id_produto], (errP, resP) => {
                if (errP || resP.length === 0) {
                    erroProcessamento = `Produto ID ${i.id_produto} não encontrado.`;
                } else {
                    const prod = resP[0];
                    if (prod.estoque < i.quantidade) {
                        erroProcessamento = `Estoque insuficiente para o produto "${prod.nome}". Disponível: ${prod.estoque}, Solicitado: ${i.quantidade}.`;
                    } else {
                        const precoUnitarioOficial = Number(prod.preco_unitario);
                        const subtotal = Number(i.quantidade) * precoUnitarioOficial;
                        valorTotalCalculado += subtotal;
                        itensProcessados.push({
                            id_produto: i.id_produto,
                            quantidade: i.quantidade,
                            preco_unitario: precoUnitarioOficial,
                            subtotal: subtotal
                        });
                    }
                }

                validacoesPendentes--;
                if (validacoesPendentes === 0) {
                    if (erroProcessamento) {
                        return db.rollback(() => res.status(400).json({ error: erroProcessamento }));
                    }

                    // Criar o pedido com o valor total calculado
                    const queryPedido = data_emissao
                        ? `INSERT INTO pedido (id_cliente, id_vendedor, data_emissao, valor_total) VALUES (?, ?, ?, ?)`
                        : `INSERT INTO pedido (id_cliente, id_vendedor, valor_total) VALUES (?, ?, ?)`;
                    const paramsPedido = data_emissao
                        ? [id_cliente, id_vendedor, data_emissao, valorTotalCalculado]
                        : [id_cliente, id_vendedor, valorTotalCalculado];

                    db.query(queryPedido, paramsPedido, (errPed, resultPed) => {
                        if (errPed) {
                            return db.rollback(() => res.status(500).json({ error: 'Erro ao cadastrar pedido: ' + errPed.message }));
                        }

                        const idPedido = resultPed.insertId;
                        const valoresItens = itensProcessados.map(ip => [idPedido, ip.id_produto, ip.quantidade, ip.preco_unitario, ip.subtotal]);

                        db.query(`INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario, subtotal) VALUES ?`, [valoresItens], (errItens) => {
                            if (errItens) {
                                return db.rollback(() => res.status(500).json({ error: 'Erro ao registrar itens: ' + errItens.message }));
                            }

                            // Reduzir o estoque dos produtos
                            let atualizacoesEstoque = itensProcessados.length;
                            let erroBaixa = false;

                            itensProcessados.forEach(ip => {
                                db.query(`UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?`, [ip.quantidade, ip.id_produto], (errBaixa) => {
                                    if (errBaixa) erroBaixa = true;
                                    atualizacoesEstoque--;

                                    if (atualizacoesEstoque === 0) {
                                        if (erroBaixa) {
                                            return db.rollback(() => res.status(500).json({ error: 'Erro ao dar baixa no estoque.' }));
                                        }

                                        db.query(`INSERT INTO historico_status_pedido (id_pedido, status) VALUES (?, ?)`, [idPedido, status_inicial || 'PENDENTE'], (errHist) => {
                                            if (errHist) {
                                                return db.rollback(() => res.status(500).json({ error: 'Erro ao gerar histórico de status.' }));
                                            }

                                            const inserePagamentos = (callback) => {
                                                if (!pagamentos || pagamentos.length === 0) return callback();
                                                const valoresPags = pagamentos.map(pg => [idPedido, pg.forma_pagamento, pg.valor, pg.status || 'APROVADO']);
                                                db.query(`INSERT INTO pagamento (id_pedido, forma_pagamento, valor, status) VALUES ?`, [valoresPags], callback);
                                            };

                                            inserePagamentos((errPag) => {
                                                if (errPag) {
                                                    return db.rollback(() => res.status(500).json({ error: 'Erro ao registrar pagamentos.' }));
                                                }

                                                db.commit((errCommit) => {
                                                    if (errCommit) return db.rollback();
                                                    res.status(201).json({ message: 'Pedido cadastrado e estoque atualizado com sucesso!', id_pedido: idPedido });
                                                });
                                            });
                                        });
                                    }
                                });
                            });
                        });
                    });
                }
            });
        });
    });
});

app.put('/api/pedidos/:id', (req, res) => {
    const { id } = req.params;
    const { id_cliente, data_emissao, pagamentos, status_novo } = req.body;
    let { itens } = req.body;
    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: 'O pedido deve conter pelo menos um item.' });
    }

    db.beginTransaction((errTrans) => {
        if (errTrans) return res.status(500).json({ error: 'Erro interno.' });

        // 1. Devolver os itens antigos ao estoque
        db.query('SELECT id_produto, quantidade FROM item_pedido WHERE id_pedido = ?', [id], (errSel, itensAntigos) => {
            if (errSel) return db.rollback(() => res.status(500).json({ error: 'Erro ao buscar itens antigos para estorno.' }));

            let devolucosPendentes = itensAntigos.length;
            if (devolucosPendentes === 0) {
                processarAtualizacaoPedido();
            } else {
                itensAntigos.forEach(ia => {
                    db.query('UPDATE produto SET estoque = estoque + ? WHERE id_produto = ?', [ia.quantidade, ia.id_produto], () => {
                        devolucosPendentes--;
                        if (devolucosPendentes === 0) processarAtualizacaoPedido();
                    });
                });
            }

            function processarAtualizacaoPedido() {
                let itensProcessados = [];
                let valorTotalCalculado = 0;
                let validacoesPendentes = itens.length;
                let erroEstoque = null;

                // 2. Validar estoque e buscar preço ATUAL do produto para a atualização
                itens.forEach(i => {
                    db.query('SELECT estoque, nome, preco_unitario FROM produto WHERE id_produto = ?', [i.id_produto], (errP, resP) => {
                        if (errP || resP.length === 0) {
                            erroEstoque = `Produto ID ${i.id_produto} não encontrado.`;
                        } else {
                            const prod = resP[0];
                            if (prod.estoque < i.quantidade) {
                                erroEstoque = `Estoque insuficiente para o produto "${prod.nome}". Disponível: ${prod.estoque}, Solicitado: ${i.quantidade}.`;
                            } else {
                                const precoUnitarioOficial = Number(prod.preco_unitario);
                                const subtotal = Number(i.quantidade) * precoUnitarioOficial;
                                valorTotalCalculado += subtotal;
                                itensProcessados.push({
                                    id_produto: i.id_produto,
                                    quantidade: i.quantidade,
                                    preco_unitario: precoUnitarioOficial,
                                    subtotal: subtotal
                                });
                            }
                        }

                        validacoesPendentes--;
                        if (validacoesPendentes === 0) {
                            if (erroEstoque) {
                                return db.rollback(() => res.status(400).json({ error: erroEstoque }));
                            }

                            // 3. Atualizar dados principais do pedido
                            const queryUpd = `UPDATE pedido SET id_cliente = ?, data_emissao = ?, valor_total = ? WHERE id_pedido = ?`;
                            db.query(queryUpd, [id_cliente, data_emissao, valorTotalCalculado, id], (errUpd) => {
                                if (errUpd) return db.rollback(() => res.status(500).json({ error: 'Erro ao atualizar pedido.' }));

                                // 4. Substituir itens antigos pelos novos
                                db.query('DELETE FROM item_pedido WHERE id_pedido = ?', [id], (errDel) => {
                                    if (errDel) return db.rollback(() => res.status(500).json({ error: 'Erro ao atualizar itens.' }));

                                    const valoresItens = itensProcessados.map(ip => [id, ip.id_produto, ip.quantidade, ip.preco_unitario, ip.subtotal]);
                                    db.query(`INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario, subtotal) VALUES ?`, [valoresItens], (errItens) => {
                                        if (errItens) return db.rollback(() => res.status(500).json({ error: 'Erro ao inserir novos itens.' }));

                                        // 5. Baixar o estoque com os novos itens
                                        let baixaPendentes = itensProcessados.length;
                                        itensProcessados.forEach(ip => {
                                            db.query('UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?', [ip.quantidade, ip.id_produto], () => {
                                                baixaPendentes--;
                                                if (baixaPendentes === 0) {
                                                    finalizarPagamentosEStatus();
                                                }
                                            });
                                        });
                                    });
                                });
                            });
                        }
                    });
                });
            }

            function finalizarPagamentosEStatus() {
                db.query('DELETE FROM pagamento WHERE id_pedido = ?', [id], (errDelPag) => {
                    if (errDelPag) return db.rollback(() => res.status(500).json({ error: 'Erro ao atualizar pagamentos.' }));

                    const processarHistoricoECommit = () => {
                        if (status_novo) {
                            db.query(`INSERT INTO historico_status_pedido (id_pedido, status) VALUES (?, ?)`, [id, status_novo], (errH) => {
                                if (errH) return db.rollback(() => res.status(500).json({ error: 'Erro ao atualizar histórico de status.' }));
                                db.commit(errC => errC ? db.rollback() : res.json({ message: 'Pedido atualizado com sucesso!' }));
                            });
                        } else {
                            db.commit(errC => errC ? db.rollback() : res.json({ message: 'Pedido atualizado com sucesso!' }));
                        }
                    };

                    if (pagamentos && pagamentos.length > 0) {
                        const valoresPags = pagamentos.map(pg => [id, pg.forma_pagamento, pg.valor, pg.status || 'APROVADO']);
                        db.query(`INSERT INTO pagamento (id_pedido, forma_pagamento, valor, status) VALUES ?`, [valoresPags], (errInsP) => {
                            if (errInsP) return db.rollback(() => res.status(500).json({ error: 'Erro ao salvar pagamentos.' }));
                            processarHistoricoECommit();
                        });
                    } else {
                        processarHistoricoECommit();
                    }
                });
            }
        });
    });
});

app.delete('/api/pedidos/:id', (req, res) => {
    const { id } = req.params;
    db.beginTransaction((errTrans) => {
        if (errTrans) return res.status(500).json({ error: 'Erro interno.' });

        // 1. Devolver os produtos ao estoque antes de excluir o pedido
        db.query('SELECT id_produto, quantidade FROM item_pedido WHERE id_pedido = ?', [id], (errSel, itens) => {
            if (errSel) return db.rollback(() => res.status(500).json({ error: 'Erro ao buscar itens para estorno de estoque.' }));

            let estornosPendentes = itens.length;
            if (estornosPendentes === 0) {
                reremoverPedidoCompleto();
            } else {
                itens.forEach(item => {
                    db.query('UPDATE produto SET estoque = estoque + ? WHERE id_produto = ?', [item.quantidade, item.id_produto], (errEst) => {
                        if (errEst) return db.rollback(() => res.status(500).json({ error: 'Erro ao retornar produtos ao estoque.' }));
                        estornosPendentes--;
                        if (estornosPendentes === 0) {
                            reremoverPedidoCompleto();
                        }
                    });
                });
            }

            function reremoverPedidoCompleto() {
                db.query('DELETE FROM historico_status_pedido WHERE id_pedido = ?', [id], (errHist) => {
                    if (errHist) return db.rollback(() => res.status(500).json({ error: 'Erro ao remover histórico.' }));
                    db.query('DELETE FROM pagamento WHERE id_pedido = ?', [id], (errPag) => {
                        if (errPag) return db.rollback(() => res.status(500).json({ error: 'Erro ao remover pagamentos.' }));
                        db.query('DELETE FROM item_pedido WHERE id_pedido = ?', [id], (idItem) => {
                            if (idItem) return db.rollback(() => res.status(500).json({ error: 'Erro ao remover itens.' }));
                            db.query('DELETE FROM pedido WHERE id_pedido = ?', [id], (errPed) => {
                                if (errPed) return db.rollback(() => res.status(500).json({ error: 'Erros ao deletar pedido.' }));
                                db.commit(errC => errC ? db.rollback() : res.json({ message: 'Pedido excluído e estoque devolvido com sucesso!' }));
                            });
                        });
                    });
                });
            }
        });
    });
});

// ROTAS DE PAGAMENTOS
app.get('/api/pagamentos', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = `
        SELECT pg.*, p.id_pedido, pes.nome AS cliente_nome 
        FROM pagamento pg
        JOIN pedido p ON pg.id_pedido = p.id_pedido
        JOIN cliente c ON p.id_cliente = c.id_pessoa
        JOIN pessoa pes ON c.id_pessoa = pes.id_pessoa
        WHERE p.id_vendedor = ?
    `;
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar pagamentos:', err);
            return res.status(500).json({ error: 'Erro ao buscar pagamentos' });

        }

        res.json(results);
    });

});

app.post('/api/pagamentos', (req, res) => {
    const { id_pedido, forma_pagamento, valor } = req.body;
    const query = `
        INSERT INTO pagamento (id_pedido, forma_pagamento, valor, status) 
        VALUES (?, ?, ?, 'APROVADO')
    `;
    const values = [id_pedido, forma_pagamento || 'PIX', valor];
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao registrar pagamento:', err);
            if (err.errno === 1452) {
                return res.status(400).json({ error: 'O pedido informado não foi encontrado.' });
            }
            return res.status(500).json({ error: 'Não foi possível registrar o pagamento. Verifique o pedido.' });

        }

        const queryHist = `
            INSERT INTO historico_status_pedido (id_pedido, status) 
            VALUES (?, 'PAGO')
        `;
        db.query(queryHist, [id_pedido], () => {
            res.status(201).json({ message: 'Pagamento registrado com sucesso!' });

        });

    });

});

// ROTAS DE HISTÓRICO DE STATUS
app.get('/api/historico-status', (req, res) => {
    const { id_vendedor } = req.query;
    if (!id_vendedor) {
        return res.status(400).json({ error: 'ID do vendedor não fornecido.' });

    }

    const query = `
        SELECT h.*, p.id_vendedor 
        FROM historico_status_pedido h
        JOIN pedido p ON h.id_pedido = p.id_pedido
        WHERE p.id_vendedor = ?
        ORDER BY h.data_alteracao DESC
    `;
    db.query(query, [id_vendedor], (err, results) => {
        if (err) {
            console.error('Erro ao buscar histórico de status:', err);
            return res.status(500).json({ error: 'Erro ao buscar histórico' });

        }

        res.json(results);
    });

});