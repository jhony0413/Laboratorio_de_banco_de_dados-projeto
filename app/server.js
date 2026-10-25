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
    user: 'root',
    password: 'senha_aqui',
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
            return res.status(500).json({ error: 'Erro ao cadastrar: ' + err.message });
        }
        const idPessoa = resultPessoa.insertId;
        const queryVendedor = `
      INSERT INTO vendedor (id_pessoa, login, senha_hash) 
      VALUES (?, ?, ?)
    `;
        db.query(queryVendedor, [idPessoa, login, senha], (errVendedor) => {
            if (errVendedor) {
                console.error('Erro ao cadastrar vendedor:', errVendedor);
                return res.status(500).json({ error: 'Erro ao cadastrar vendedor: ' + errVendedor.message });
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
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
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
            console.error('Erro ao cadastrar produto:', err);
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
            console.error('Erro ao atualizar produto:', err);
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
                return res.status(400).json({ error: 'Não é possível excluir este produto pois ele possui vínculos ativos (como itens em pedidos ou fornecedores).' });
            }
            return res.status(500).json({ error: 'Erro ao deletar produto: ' + err.message });
        }
        res.json({ message: 'Produto deletado com sucesso!' });
    });
});

// ROTA DE CATEGORIAS
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
            return res.status(500).json({ error: err.message });
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
            return res.status(500).json({ error: err.message });
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
            return res.status(500).json({ error: 'Erro ao deletar categoria: ' + err.message });
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
            return res.status(500).json({ error: 'Erro ao cadastrar cliente: ' + err.message });
        }
        const idPessoa = resultPessoa.insertId;
        const queryCliente = `
            INSERT INTO cliente (id_pessoa, id_vendedor) 
            VALUES (?, ?)
        `;
        db.query(queryCliente, [idPessoa, id_vendedor], (errCliente) => {
            if (errCliente) {
                console.error('Erro ao vincular cliente:', errCliente);
                return res.status(500).json({ error: 'Erro ao vincular cliente: ' + errCliente.message });
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
            return res.status(500).json({ error: err.message });
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
                return res.status(400).json({ error: 'Não é possível excluir este cliente pois existem pedidos ou registros associados a ele.' });
            }
            return res.status(500).json({ error: 'Erro ao deletar cliente: ' + errCliente.message });
        }
        const queryPessoa = 'DELETE FROM pessoa WHERE id_pessoa = ?';
        db.query(queryPessoa, [id], (errPessoa) => {
            if (errPessoa) {
                console.error('Erro ao deletar pessoa do cliente:', errPessoa);
                return res.status(500).json({ error: 'Erro ao deletar registro de pessoa: ' + errPessoa.message });
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
            console.error('Erro ao cadastrar fornecedor:', err);
            return res.status(500).json({ error: err.message });
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
            return res.status(500).json({ error: err.message });
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
            return res.status(500).json({ error: 'Erro ao deletar fornecedor: ' + err.message });
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
            return res.status(500).json({ error: err.message });
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
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Vínculo atualizado com sucesso!' });
    });
});

// ROTA DE DELETAR PEDIDO COM EXCLUSÃO EM CASCATA DE DEPENDÊNCIAS
app.delete('/api/pedidos/:id', (req, res) => {
    const { id } = req.params;
    db.beginTransaction((errTrans) => {
        if (errTrans) {
            console.error('Erro ao iniciar transação:', errTrans);
            return res.status(500).json({ error: 'Erro interno ao processar exclusão.' });
        }
        db.query('DELETE FROM historico_status_pedido WHERE id_pedido = ?', [id], (errHist) => {
            if (errHist) {
                return db.rollback(() => {
                    console.error('Erro ao deletar histórico do pedido:', errHist);
                    res.status(500).json({ error: 'Erro ao remover histórico associado.' });
                });
            }
            db.query('DELETE FROM pagamento WHERE id_pedido = ?', [id], (errPag) => {
                if (errPag) {
                    return db.rollback(() => {
                        console.error('Erro ao deletar pagamentos do pedido:', errPag);
                        res.status(500).json({ error: 'Erro ao remover pagamentos associados.' });
                    });
                }
                db.query('DELETE FROM item_pedido WHERE id_pedido = ?', [id], (errItem) => {
                    if (errItem) {
                        return db.rollback(() => {
                            console.error('Erro ao deletar itens do pedido:', errItem);
                            res.status(500).json({ error: 'Erro ao remover itens associados.' });
                        });
                    }
                    db.query('DELETE FROM pedido WHERE id_pedido = ?', [id], (errPed) => {
                        if (errPed) {
                            return db.rollback(() => {
                                console.error('Erro ao deletar pedido:', errPed);
                                res.status(500).json({ error: 'Erro ao deletar pedido.' });
                            });
                        }
                        db.commit((errCommit) => {
                            if (errCommit) {
                                return db.rollback(() => {
                                    console.error('Erro ao confirmar transação:', errCommit);
                                    res.status(500).json({ error: 'Erro ao finalizar exclusão.' });
                                });
                            }
                            res.json({ message: 'Pedido e todas as suas dependências foram deletados com sucesso!' });
                        });
                    });
                });
            });
        });
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
    const { id_vendedor, id_cliente, data_emissao, valor_total, itens } = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: 'O pedido deve conter pelo menos um item.' });
    }

    db.beginTransaction((errTrans) => {
        if (errTrans) {
            console.error('Erro ao iniciar transação:', errTrans);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }

        const queryPedido = data_emissao
            ? `INSERT INTO pedido (id_cliente, id_vendedor, data_emissao, valor_total) VALUES (?, ?, ?, ?)`
            : `INSERT INTO pedido (id_cliente, id_vendedor, valor_total) VALUES (?, ?, ?)`;

        const paramsPedido = data_emissao
            ? [id_cliente, id_vendedor, data_emissao, valor_total]
            : [id_cliente, id_vendedor, valor_total];

        db.query(queryPedido, paramsPedido, (errPed, resultPed) => {
            if (errPed) {
                return db.rollback(() => {
                    console.error('Erro ao inserir pedido:', errPed);
                    res.status(500).json({ error: 'Erro ao cadastrar pedido: ' + errPed.message });
                });
            }

            const idPedido = resultPed.insertId;

            const valoresItens = itens.map(i => {
                const subtotal = Number(i.quantidade) * Number(i.preco_unitario);
                return [idPedido, i.id_produto, i.quantidade, i.preco_unitario, subtotal];
            });

            const queryItens = `
                INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario, subtotal) 
                VALUES ?
            `;

            db.query(queryItens, [valoresItens], (errItens) => {
                if (errItens) {
                    return db.rollback(() => {
                        console.error('Erro ao inserir itens:', errItens);
                        res.status(500).json({ error: 'Erro ao registrar itens: ' + errItens.message });
                    });
                }

                const queryHist = `
                    INSERT INTO historico_status_pedido (id_pedido, status) 
                    VALUES (?, 'PENDENTE')
                `;
                db.query(queryHist, [idPedido], (errHist) => {
                    if (errHist) {
                        return db.rollback(() => {
                            console.error('Erro ao criar histórico:', errHist);
                            res.status(500).json({ error: 'Erro ao gerar histórico de status.' });
                        });
                    }

                    db.commit((errCommit) => {
                        if (errCommit) {
                            return db.rollback(() => {
                                console.error('Erro ao confirmar transação:', errCommit);
                                res.status(500).json({ error: 'Erro ao finalizar cadastro.' });
                            });
                        }
                        res.status(201).json({ message: 'Pedido cadastrado com sucesso!', id_pedido: idPedido });
                    });
                });
            });
        });
    });
});
app.put('/api/pedidos/:id', (req, res) => {
    const { id } = req.params;
    const { id_cliente, data_emissao, valor_total, itens } = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: 'O pedido deve conter pelo menos um item.' });
    }

    db.beginTransaction((errTrans) => {
        if (errTrans) {
            return res.status(500).json({ error: 'Erro interno ao iniciar transação.' });
        }

        const queryUpd = `UPDATE pedido SET id_cliente = ?, data_emissao = ?, valor_total = ? WHERE id_pedido = ?`;
        db.query(queryUpd, [id_cliente, data_emissao, valor_total, id], (errUpd) => {
            if (errUpd) {
                return db.rollback(() => {
                    res.status(500).json({ error: 'Erro ao atualizar pedido: ' + errUpd.message });
                });
            }

            db.query('DELETE FROM item_pedido WHERE id_pedido = ?', [id], (errDel) => {
                if (errDel) {
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Erro ao atualizar itens do pedido.' });
                    });
                }

                const valoresItens = itens.map(i => {
                    const subtotal = Number(i.quantidade) * Number(i.preco_unitario);
                    return [id, i.id_produto, i.quantidade, i.preco_unitario, subtotal];
                });

                const queryItens = `
                    INSERT INTO item_pedido (id_pedido, id_produto, quantidade, preco_unitario, subtotal) 
                    VALUES ?
                `;

                db.query(queryItens, [valoresItens], (errItens) => {
                    if (errItens) {
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Erro ao registrar novos itens.' });
                        });
                    }

                    db.commit((errCommit) => {
                        if (errCommit) {
                            return db.rollback();
                        }
                        res.json({ message: 'Pedido atualizado com sucesso!' });
                    });
                });
            });
        });
    });
});

// ROTAS AUXILIARES
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
            return res.status(500).json({ error: err.message });
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