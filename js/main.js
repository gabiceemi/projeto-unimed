document.addEventListener('DOMContentLoaded', function () {
    alasql('CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username STRING, password STRING)');
    alasql('CREATE TABLE IF NOT EXISTS clientes (id INT AUTO_INCREMENT PRIMARY KEY, nome STRING, cpf STRING UNIQUE, nascimento DATE, telefone STRING, celular STRING)');
    alasql('CREATE TABLE IF NOT EXISTS enderecos (id INT AUTO_INCREMENT PRIMARY KEY, cliente_id INT, cep STRING, rua STRING, bairro STRING, cidade STRING, estado STRING, pais STRING, principal BOOLEAN)');

    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        let username = document.getElementById('username').value;
        let password = document.getElementById('password').value;
        let user = alasql('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

        if (user.length > 0) {
            window.location.href = 'clientes.html';
        } else {
            alert('Usuário ou senha incorretos');
        }
    });

    document.getElementById('registerLink').addEventListener('click', function () {
        document.getElementById('registerContainer').style.display = 'block';
    });

    document.getElementById('registerForm').addEventListener('submit', function (e) {
        e.preventDefault();
        let newUsername = document.getElementById('newUsername').value;
        let newPassword = document.getElementById('newPassword').value;

        let existingUser = alasql('SELECT * FROM users WHERE username = ?', [newUsername]);

        if (existingUser.length > 0) {
            alert('Usuário já existe!');
        } else {
            alasql('INSERT INTO users (username, password) VALUES (?, ?)', [newUsername, newPassword]);
            alert('Usuário cadastrado com sucesso!');
            document.getElementById('registerContainer').style.display = 'none';
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('configLink').addEventListener('click', function () {
        document.getElementById('uploadDb').click();
    });

    document.getElementById('uploadDb').addEventListener('change', function (e) {
        let file = e.target.files[0];
        if (file) {
            let reader = new FileReader();
            reader.onload = function (event) {
                let data = JSON.parse(event.target.result);

                alasql('DELETE FROM clientes');
                alasql('DELETE FROM enderecos');

                data.clientes.forEach(cliente => {
                    alasql('INSERT INTO clientes (id, nome, cpf, nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?, ?)', 
                        [cliente.id, cliente.nome, cliente.cpf, cliente.nascimento, cliente.telefone, cliente.celular]);
                });

                data.enderecos.forEach(endereco => {
                    alasql('INSERT INTO enderecos (id, cliente_id, cep, rua, bairro, cidade, estado, pais, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                        [endereco.id, endereco.cliente_id, endereco.cep, endereco.rua, endereco.bairro, endereco.cidade, endereco.estado, endereco.pais, endereco.principal]);
                });

                alert('Banco de dados carregado com sucesso');

                listarClientes();
            };
            reader.readAsText(file);
        }
    });

    function listarClientes() {
        let clientes = alasql('SELECT * FROM clientes');
        let tableBody = document.querySelector('#clientesTable tbody');
        tableBody.innerHTML = '';
        clientes.forEach(cliente => {
            let row = document.createElement('tr');
            row.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.cpf}</td>
                <td>${cliente.nascimento}</td>
                <td>${cliente.telefone}</td>
                <td>${cliente.celular}</td>
                <td><button>Selecionar</button></td>
            `;

            row.querySelector('button').addEventListener('click', function () {
                localStorage.setItem('clienteId', cliente.id);
                localStorage.setItem('clienteNome', cliente.nome);

                listarEnderecos(cliente.id); 
            });
            tableBody.appendChild(row);
        });
    }

    function listarEnderecos(clienteId) {
        let enderecos = alasql('SELECT * FROM enderecos WHERE cliente_id = ?', [clienteId]);
        let tableBody = document.querySelector('#enderecosTable tbody');
        tableBody.innerHTML = '';

        if (enderecos.length > 0) {
            enderecos.forEach(endereco => {
                let row = `
                <tr>
                    <td>${endereco.cep}</td>
                    <td>${endereco.rua}</td>
                    <td>${endereco.bairro}</td>
                    <td>${endereco.cidade}</td>
                    <td>${endereco.estado}</td>
                    <td>${endereco.pais}</td>
                    <td>${endereco.principal ? 'Sim' : 'Não'}</td>
                </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="7">Nenhum endereço cadastrado para este cliente.</td></tr>';
        }
    }

    document.getElementById('clienteForm').addEventListener('submit', function (e) {
        e.preventDefault();
        let nome = document.getElementById('nome').value;
        let cpf = document.getElementById('cpf').value;
        let nascimento = document.getElementById('nascimento').value;
        let telefone = document.getElementById('telefone').value;
        let celular = document.getElementById('celular').value;
    
        let existingCliente = alasql('SELECT * FROM clientes WHERE cpf = ?', [cpf]);
    
        if (existingCliente.length > 0) {
            alert('CPF já cadastrado!');
        } else {
            alasql('INSERT INTO clientes (nome, cpf, nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?)', 
                [nome, cpf, nascimento, telefone, celular]);
            
            listarClientes();
            alert('Cliente cadastrado com sucesso!');
        }
    });

    document.getElementById('enderecoForm').addEventListener('submit', function (e) {
        e.preventDefault();

        document.getElementById('exportDb').addEventListener('click', function () {
            let clientes = alasql('SELECT * FROM clientes');
            let enderecos = alasql('SELECT * FROM enderecos');
    
            console.log(clientes); 
    
            let data = {
                clientes: clientes,
                enderecos: enderecos
            };
    
            let jsonString = JSON.stringify(data, null, 2);
    
            let blob = new Blob([jsonString], { type: 'application/json' });
            let url = URL.createObjectURL(blob);
    
            let a = document.createElement('a');
            a.href = url;
            a.download = 'database.json';
            a.click();
    
            URL.revokeObjectURL(url);
        });

        let clienteId = localStorage.getItem('clienteId');

        if (!clienteId) {
            alert('Erro: clienteId não encontrado! Por favor, selecione um cliente.');
            return;
        }

        let cep = document.getElementById('cep').value;
        let rua = document.getElementById('rua').value;
        let bairro = document.getElementById('bairro').value;
        let cidade = document.getElementById('cidade').value;
        let estado = document.getElementById('estado').value;
        let pais = document.getElementById('pais').value;
        let principal = document.getElementById('principal').checked;

        if (principal) {
            alasql('UPDATE enderecos SET principal = FALSE WHERE cliente_id = ?', [clienteId]);
        }

        alasql('INSERT INTO enderecos (cliente_id, cep, rua, bairro, cidade, estado, pais, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [clienteId, cep, rua, bairro, cidade, estado, pais, principal]);

        listarEnderecos(clienteId); 

        alert('Endereço cadastrado com sucesso!');

        document.getElementById('enderecoForm').reset();
    });

    listarClientes();
});



