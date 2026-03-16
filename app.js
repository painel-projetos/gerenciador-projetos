// app.js
// Lógica de interface e manipulação do DOM

document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const tbody = document.getElementById('projects-tbody');
    const emptyState = document.getElementById('empty-state');
    
    // Filtros
    const filterAnalista = document.getElementById('filter-analista');
    const filterCategoria = document.getElementById('filter-categoria');
    const filterStatus = document.getElementById('filter-status');
    const filterPrioridade = document.getElementById('filter-prioridade');
    const searchInput = document.getElementById('search-input');
    const btnClearFilters = document.getElementById('btn-clear-filters');

    // KPIs
    const kpiTotal = document.getElementById('kpi-total');
    const kpiNoPrazo = document.getElementById('kpi-noprazo');
    const kpiAtrasado = document.getElementById('kpi-atrasado');
    const kpiAcoes = document.getElementById('kpi-acoes');

    // Modal
    const modal = document.getElementById('status-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSaveStatus = document.getElementById('btn-save-status');
    let currentEditingProjectId = null;

    // Elementos do Cadastro de Novo Projeto
    const btnNovoProjeto = document.getElementById('btn-novo-projeto');
    const btnExportar = document.getElementById('btn-exportar');
    const addProjectModal = document.getElementById('add-project-modal');
    const btnCloseAddModal = document.getElementById('btn-close-add-modal');
    const btnSalvarNovoProjeto = document.getElementById('btn-salvar-novo-projeto');

    // Charts Instances
    let workloadChartInstance = null;
    let categoriaChartInstance = null;

    // Persistência
    function saveToLocalStorage() {
        localStorage.setItem('projmanager_db', JSON.stringify(window.appState));
    }

    // Inicializa Filtros com os dados gerados no data.js (window.appState)
    function initFilters() {
        const { analistas, categorias, prioridades } = window.appState;
        
        analistas.sort().forEach(ana => {
            const opt = document.createElement('option');
            opt.value = ana;
            opt.textContent = ana;
            filterAnalista.appendChild(opt);
        });

        categorias.sort().forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            filterCategoria.appendChild(opt);
        });

        if (prioridades) {
            prioridades.sort().forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                filterPrioridade.appendChild(opt);
            });
        }

        // Popula combos do modal de adição
        const selectResp = document.getElementById('add-responsavel');
        const selectCat = document.getElementById('add-categoria');
        const selectPrio = document.getElementById('add-prioridade');

        analistas.sort().forEach(a => selectResp.appendChild(new Option(a, a)));
        categorias.sort().forEach(c => selectCat.appendChild(new Option(c, c)));
        if (prioridades) {
            prioridades.forEach(p => selectPrio.appendChild(new Option(p, p)));
        }
    }

    // Calcula se um projeto está atrasado, no prazo ou concluído
    function getProjectStatus(project) {
        if (project.dataFinalRealizada) {
            return {
                id: 'concluido',
                label: 'Concluído',
                cssClass: 'completed'
            };
        }
        
        const today = new Date();
        const endDate = new Date(project.dataFinalProjetada);
        
        if (today > endDate) {
            return {
                id: 'atrasado',
                label: 'Atrasado',
                cssClass: 'delayed'
            };
        } else {
            return {
                id: 'no_prazo',
                label: 'No Prazo',
                cssClass: 'on_time'
            };
        }
    }

    // Formata Data DD/MM/YYYY
    function formatDateBr(isoString) {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    // Pega a última ação do histórico
    function getLatestAction(historyArray) {
        if (!historyArray || historyArray.length === 0) return 'Sem status registrado.';
        // Histórico [0] é o mais recente, pois usamos unshift na inserção
        return historyArray[0].statusText;
    }

    // Renderiza o Dashboard (KPIs)
    function renderDashboard(projects) {
        kpiTotal.textContent = projects.length;
        
        let noPrazo = 0;
        let atrasado = 0;
        
        projects.forEach(p => {
            const s = getProjectStatus(p).id;
            if (s === 'no_prazo' || s === 'concluido') noPrazo++;
            if (s === 'atrasado') atrasado++;
        });

        kpiNoPrazo.textContent = noPrazo;
        kpiAtrasado.textContent = atrasado;
        
        // Ações pendentes simulado baseando-se nos não concluídos
        const pendentes = projects.filter(p => !p.dataFinalRealizada).length;
        kpiAcoes.textContent = pendentes;

        renderCharts(projects);
    }

    // Função de Plotagem de Gráficos usando Chart.js
    function renderCharts(projects) {
        
        // 1. Processamento para Workload (Barras)
        const anaCount = {};
        // 2. Processamento para Categoria (Rosca)
        const catCount = {};

        projects.forEach(p => {
            anaCount[p.responsavel] = (anaCount[p.responsavel] || 0) + 1;
            catCount[p.categoria] = (catCount[p.categoria] || 0) + 1;
        });

        const ctxWork = document.getElementById('chartWorkload').getContext('2d');
        if (workloadChartInstance) workloadChartInstance.destroy();

        workloadChartInstance = new Chart(ctxWork, {
            type: 'bar',
            data: {
                labels: Object.keys(anaCount),
                datasets: [{
                    label: 'Qtd Projetos',
                    data: Object.values(anaCount),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b949e', stepSize: 1 } },
                    x: { grid: { display: false }, ticks: { color: '#8b949e' } }
                }
            }
        });

        const ctxCat = document.getElementById('chartCategoria').getContext('2d');
        if (categoriaChartInstance) categoriaChartInstance.destroy();

        categoriaChartInstance = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: Object.keys(catCount),
                datasets: [{
                    data: Object.values(catCount),
                    backgroundColor: [
                        '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
                        '#8b5cf6', '#0ea5e9', '#ec4899'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#8b949e', font: { size: 11 } } }
                }
            }
        });
    }

    // Renderiza a Tabela
    function renderTable(projects) {
        tbody.innerHTML = '';
        
        if (projects.length === 0) {
            emptyState.classList.remove('hidden');
            document.getElementById('projects-table').style.display = 'none';
            return;
        }

        emptyState.classList.add('hidden');
        document.getElementById('projects-table').style.display = 'table';

        projects.forEach(p => {
            const tr = document.createElement('tr');
            const status = getProjectStatus(p);
            const latestAction = getLatestAction(p.historico);
            
            // Tratamento de cor de Prio
            let prioClass = 'prio-normal';
            if(p.prioridade === 'Crítica') prioClass = 'prio-critica';
            else if(p.prioridade === 'Alta') prioClass = 'prio-alta';
            else if(p.prioridade === 'Baixa') prioClass = 'prio-baixa';
            
            tr.innerHTML = `
                <td>
                    <div class="max-w-desc" title="${p.descricao}">
                        <strong>${p.descricao}</strong>
                    </div>
                </td>
                <td><span class="tag">${p.categoria}</span></td>
                <td><span class="prio-badge ${prioClass}">${p.prioridade}</span></td>
                <td>${p.responsavel}</td>
                <td><div class="max-w-action" title="${p.objetivo}">${p.objetivo}</div></td>
                <td>${formatDateBr(p.dataInicial)}</td>
                <td>${formatDateBr(p.dataFinalProjetada)}</td>
                <td>
                    ${p.dataFinalRealizada ? formatDateBr(p.dataFinalRealizada) : `<span class="status-badge ${status.cssClass}">${status.label}</span>`}
                </td>
                <td>
                    <div class="max-w-action" style="font-size: 13px; color: var(--text-muted);" title="${latestAction} (Status Modificado: ${formatDateBr(p.historico[0]?.date)})">
                        ${latestAction}
                    </div>
                </td>
                <td>
                    <button class="btn-action update-btn" data-id="${p.id}">Ver Histórico</button>
                </td>
            `;
            
            // Tornando a linha inteira clicável para UX
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', (e) => {
                // Previne abrir duas vezes se clicou no botão
                if(e.target.tagName !== 'BUTTON') {
                    openModal(p.id);
                }
            });
            
            tbody.appendChild(tr);
        });

        // Adiciona eventos aos botões recém criados
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                openModal(id);
            });
        });
    }

    // Filtra e Renderiza a UI Completa
    function updateUI() {
        const { projects } = window.appState;
        
        const fAnalista = filterAnalista.value;
        const fCategoria = filterCategoria.value;
        const fStatus = filterStatus.value;
        const fPrioridade = filterPrioridade ? filterPrioridade.value : 'all';
        const sTerm = searchInput.value.toLowerCase();

        const filtered = projects.filter(p => {
            // Busca por texto
            const matchSearch = p.descricao.toLowerCase().includes(sTerm) || 
                                p.objetivo.toLowerCase().includes(sTerm);
            
            // Combos
            const matchAna = fAnalista === 'all' || p.responsavel === fAnalista;
            const matchCat = fCategoria === 'all' || p.categoria === fCategoria;
            const matchStatusCombo = fStatus === 'all' || getProjectStatus(p).id === fStatus;
            const matchPrio = fPrioridade === 'all' || p.prioridade === fPrioridade;

            return matchSearch && matchAna && matchCat && matchStatusCombo && matchPrio;
        });

        renderDashboard(filtered);
        renderTable(filtered);
    }

    // Event Listeners de Filtro
    [filterAnalista, filterCategoria, filterStatus, filterPrioridade, searchInput].forEach(el => {
        if(el) el.addEventListener('input', updateUI);
    });

    btnClearFilters.addEventListener('click', () => {
        filterAnalista.value = 'all';
        filterCategoria.value = 'all';
        filterStatus.value = 'all';
        if (filterPrioridade) filterPrioridade.value = 'all';
        searchInput.value = '';
        updateUI();
    });

    // ==========================================
    // LÓGICA DO MODAL E HISTÓRICO
    // ==========================================
    function openModal(projectId) {
        currentEditingProjectId = projectId;
        const project = window.appState.projects.find(p => p.id === projectId);
        if (!project) return;

        // Header and Meta
        document.getElementById('modal-project-title').textContent = project.descricao;
        document.getElementById('modal-project-resp').textContent = project.responsavel;
        document.getElementById('modal-project-cat').textContent = project.categoria;
        document.getElementById('modal-project-prio').textContent = project.prioridade || 'Não Definida';
        document.getElementById('modal-project-obj').textContent = project.objetivo;
        document.getElementById('modal-project-start').textContent = formatDateBr(project.dataInicial);
        document.getElementById('modal-project-end').textContent = formatDateBr(project.dataFinalProjetada);
        
        // Limpa campos
        document.getElementById('new-status-text').value = '';
        
        // Se já tiver data realizada, deixa preenchida pra saber que já concluiu
        const dateInput = document.getElementById('new-real-date');
        if (project.dataFinalRealizada) {
            dateInput.value = project.dataFinalRealizada.split('T')[0];
        } else {
            dateInput.value = '';
        }

        renderTimeline(project.historico);
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        currentEditingProjectId = null;
    }

    function renderTimeline(historyArray) {
        const tlContainer = document.getElementById('modal-timeline');
        tlContainer.innerHTML = '';

        historyArray.forEach(item => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = `
                <div class="timeline-date">${formatDateBr(item.date)} às ${new Date(item.date).toLocaleTimeString('pt-BR')}</div>
                <div class="timeline-content">${item.statusText}</div>
            `;
            tlContainer.appendChild(div);
        });
    }

    function saveStatus() {
        if (!currentEditingProjectId) return;
        const projectIndex = window.appState.projects.findIndex(p => p.id === currentEditingProjectId);
        if (projectIndex === -1) return;

        const p = window.appState.projects[projectIndex];
        const newText = document.getElementById('new-status-text').value.trim();
        const newDate = document.getElementById('new-real-date').value;

        if (!newText) {
            alert("Por favor, preencha a Próxima Ação / Status.");
            return;
        }

        // Adiciona histórico no topo (mais recente)
        p.historico.unshift({
            date: new Date().toISOString(),
            statusText: newText
        });

        if (newDate) {
            // Salva a data final como UTC ISO para padronizar
            p.dataFinalRealizada = new Date(newDate).toISOString();
        }

        saveToLocalStorage(); // <--- PERSISTE MUDANÇAS

        closeModal();
        updateUI();
    }

    btnCloseModal.addEventListener('click', closeModal);
    btnSaveStatus.addEventListener('click', saveStatus);
    
    // Fechar clicando no fundo escuro
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    addProjectModal.addEventListener('click', (e) => {
        if (e.target === addProjectModal) closeAddModal();
    });

    // ==========================================
    // LÓGICA DE CADASTRO DE NOVO PROJETO E EXPORTAÇÃO
    // ==========================================
    
    function openAddModal() {
        // Limpa campos
        document.getElementById('add-nome').value = '';
        document.getElementById('add-objetivo').value = '';
        document.getElementById('add-data-fim').value = '';
        document.getElementById('add-acao-inicial').value = '';
        addProjectModal.classList.remove('hidden');
    }

    function closeAddModal() {
        addProjectModal.classList.add('hidden');
    }

    function salvarNovoProjeto() {
        const nome = document.getElementById('add-nome').value.trim();
        const objetivo = document.getElementById('add-objetivo').value.trim();
        const responsavel = document.getElementById('add-responsavel').value;
        const categoria = document.getElementById('add-categoria').value;
        const prioridade = document.getElementById('add-prioridade').value;
        const dataFim = document.getElementById('add-data-fim').value;
        const acaoInicial = document.getElementById('add-acao-inicial').value.trim() || 'Projeto Cadastrado';

        if (!nome || !dataFim) {
            alert('Por favor, preencha a Descrição e a Data Final Prevista.');
            return;
        }

        const hoje = new Date().toISOString();

        const novoProjeto = {
            id: Date.now(),
            descricao: nome,
            categoria: categoria,
            responsavel: responsavel,
            objetivo: objetivo,
            prioridade: prioridade,
            dataInicial: hoje,
            dataFinalProjetada: new Date(dataFim).toISOString(),
            dataFinalRealizada: null,
            historico: [{
                date: hoje,
                statusText: acaoInicial
            }]
        };

        window.appState.projects.unshift(novoProjeto);
        saveToLocalStorage(); // <--- PERSISTE MUDANÇAS
        
        closeAddModal();
        updateUI();
        
        // Destaca a busca para achar o projeto recém criado
        searchInput.value = nome;
        updateUI();
    }

    // Lógica para exportar Tabela filtrada em CSV
    function exportToCSV() {
        // Pega apenas as linhas que estão na tabela agora
        const rows = document.querySelectorAll('#projects-table tr');
        if (rows.length <= 1) {
            alert("Não há dados para exportar.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // \uFEFF para bom encode no Excel/Windows
        
        rows.forEach(function(rowArray) {
            let row = [], cols = rowArray.querySelectorAll("td, th");
            
            for (let j = 0; j < cols.length - 1; j++) { 
                // Omite a última coluna (Botões)
                let text = cols[j].innerText.replace(/"/g, '""'); // Escapa aspas para CSV
                // Se o texto tiver virgula ou aspas, poe encom aspas duplas
                if (text.search(/("|,|\n)/g) >= 0) {
                    text = `"${text}"`;
                }
                row.push(text);
            }
            csvContent += row.join(";") + "\r\n"; // Formato pt-br usa ;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Projetos_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    btnNovoProjeto.addEventListener('click', openAddModal);
    btnCloseAddModal.addEventListener('click', closeAddModal);
    btnSalvarNovoProjeto.addEventListener('click', salvarNovoProjeto);
    btnExportar.addEventListener('click', exportToCSV);

    // START APLICAÇÃO
    initFilters();
    updateUI();
});
