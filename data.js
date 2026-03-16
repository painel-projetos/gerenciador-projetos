// data.js
// Mocking de dados fictícios em Vanilla JS

const Analistas = [
    "Ana Silva", "Bruno Costa", "Carlos Mendez", "Daniel Pereira", 
    "Elena Santos", "Fabio Guedes", "Gabriela Rocha", "Hugo Ramos", 
    "Isabela Lima", "Joao Fernandes", "Katia Sousa", "Lucas Morais", "Marina Neves"
];

const Categorias = [
    "Infraestrutura", "Marketing", "Desenvolvimento de Software", 
    "Operações", "Recursos Humanos", "Vendas", "Pesquisa & Inovação"
];

const Objetivos = [
    "Redução de Custos em 15%", "Aumentar Receita em 20%", 
    "Melhorar SLA para 99.9%", "Otimização de Processo Interno", 
    "Expansão Internacional", "Lançamento de Novo Produto",
    "Automação de Relatórios"
];

const Prioridades = ["Baixa", "Normal", "Alta", "Crítica"];

// Utilitário para gerar data aleatória
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Formatador de data
function formatDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return d.toLocaleDateString('pt-BR');
}

// Gera 50 projetos randomicamente
function generateProjects() {
    const projects = [];
    const today = new Date();
    
    for (let i = 1; i <= 50; i++) {
        // Datas
        const startDate = randomDate(new Date(2023, 0, 1), new Date(2024, 5, 1));
        const projectedEndDate = new Date(startDate);
        projectedEndDate.setMonth(startDate.getMonth() + Math.floor(Math.random() * 6) + 1);
        
        // Simular se o projeto ja finalizou (30% de chance)
        let isCompleted = Math.random() > 0.7;
        let realEndDate = null;
        
        if (isCompleted) {
            realEndDate = new Date(projectedEndDate);
            // Variação de atraso ou adiantamento no real
            realEndDate.setDate(realEndDate.getDate() + (Math.floor(Math.random() * 30) - 15));
        }

        // Histórico de status (próximas ações)
        // Todo projeto tem ao menos uma interação inicial
        const history = [
            {
                date: startDate.toISOString(),
                statusText: "Projeto Iniciado. Levantamento de requisitos em andamento."
            }
        ];

        // Adicionando um segundo status pra dar corpo, se não foi recém criado
        if (new Date() > projectedEndDate || isCompleted) {
            history.unshift({
                date: new Date(startDate.getTime() + 1000000000).toISOString(),
                statusText: isCompleted ? "Aprovado e homologado para produção." : "Analisando atraso no fluxo principal."
            });
        }

        const project = {
            id: i,
            descricao: `Projeto Estratégico Alpha-${Math.floor(Math.random()*1000)}`,
            categoria: Categorias[Math.floor(Math.random() * Categorias.length)],
            responsavel: Analistas[Math.floor(Math.random() * Analistas.length)],
            objetivo: Objetivos[Math.floor(Math.random() * Objetivos.length)],
            prioridade: Prioridades[Math.floor(Math.random() * Prioridades.length)],
            dataInicial: startDate.toISOString(),
            dataFinalProjetada: projectedEndDate.toISOString(),
            dataFinalRealizada: realEndDate ? realEndDate.toISOString() : null,
            historico: history
        };

        projects.push(project);
    }
    return projects;
}

// Estado Global no Window para acesso no app.js
// Tenta carregar do LocalStorage primeiro, para manter a persistência se fechar a aba
function loadInitialState() {
    const saved = localStorage.getItem('projmanager_db');
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Se não tiver nada salvo ainda, gera os 50 iniciais
    const newState = {
        projects: generateProjects(),
        analistas: Analistas,
        categorias: Categorias,
        prioridades: Prioridades
    };
    
    // Salva pela primeira vez
    localStorage.setItem('projmanager_db', JSON.stringify(newState));
    return newState;
}

window.appState = loadInitialState();
