import { useState } from 'react';

// Tipagem das Páginas Principais (Abas Superiores)
type PaginaPrincipal = 'metodologia' | 'resultados' | 'municipios';

// Tipagem das Subpáginas da Metodologia
type SubFaseMetodologia = 'fontes' | 'peneira' | 'justica' | 'modelo';

interface EstruturaPagina {
  titulo: string;
  subtitulo: string;
  imagemFundo: string;
}

// Configuração de metadados visuais de cada página principal
const configPaginas: Record<PaginaPrincipal, EstruturaPagina> = {
  metodologia: {
    titulo: "Evidências na Educação Brasileira",
    subtitulo: "Desvendando o impacto real da infraestrutura escolar no desempenho do ENEM através da ciência de dados.",
    imagemFundo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80" // Sala de aula ampla representativa
  },
  resultados: {
    titulo: "Painel de Impacto Analítico",
    subtitulo: "Explore os coeficientes econométricos e descubra quais investimentos geram maior retorno educacional.",
    imagemFundo: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" // Gráficos e dados analíticos
  },
  municipios: {
    titulo: "Explorador de Cidades",
    subtitulo: "Consulte o histórico individual e longitudinal de cada município brasileiro mapeado na nossa pesquisa.",
    imagemFundo: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80" // Mapa/Globo/Estudo macro
  }
};

export default function App() {
  // Estados para controlar a navegação
  const [abaAtiva, setAbaAtiva] = useState<PaginaPrincipal>('metodologia');
  const [subFaseAtiva, setSubFaseAtiva] = useState<SubFaseMetodologia>('fontes');

  const paginaAtual = configPaginas[abaAtiva];

  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col">
      
      {/* 1. BARRA DE NAVEGAÇÃO SUPERIOR PRINCIPAL */}
      <nav className="bg-[#1c2541] border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo / Título do Projeto */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 w-3 h-6 rounded-sm"></div>
            <span className="text-lg font-bold tracking-wider text-slate-100">
              GALAXY <span className="text-emerald-400 font-medium">EDUCAÇÃO</span>
            </span>
          </div>

          {/* Abas de Páginas Principais */}
          <div className="flex h-full space-x-1">
            {(Object.keys(configPaginas) as PaginaPrincipal[]).map((aba) => (
              <button
                key={aba}
                onClick={() => setAbaAtiva(aba)}
                className={`h-full px-6 text-sm font-semibold transition-all duration-200 border-b-2 relative capitalize ${
                  abaAtiva === aba 
                    ? 'border-emerald-400 text-emerald-400 bg-[#232c4e]' 
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1e2746]'
                }`}
              >
                {aba}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION COM IMAGEM DE FUNDO ESTÁTICA E DINÂMICA POR ABA */}
      <header className="relative bg-slate-900 overflow-hidden shadow-inner border-b border-slate-800">
        {/* Imagem de Fundo Estática com Filtro de Opacidade */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform scale-105"
          style={{ 
            backgroundImage: `url('${paginaAtual.imagemFundo}')`,
            opacity: 0.15 
          }}
        />
        {/* Gradiente para mesclar a imagem com o tema escuro */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b132b] via-[#0b132b]/80 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Plataforma Longitudinal de Microdados
          </span>
          <h1 className="text-4xl font-extrabold text-slate-100 mt-4 tracking-tight max-w-3xl">
            {paginaAtual.titulo}
          </h1>
          <p className="text-slate-400 mt-2 text-base max-w-2xl font-light leading-relaxed">
            {paginaAtual.subtitulo}
          </p>
        </div>
      </header>

      {/* 3. CONTEÚDO PRINCIPAL (RENDERIZAÇÃO CONDICIONAL) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 fade-enter">
        
        {abaAtiva === 'metodologia' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* SUBPÁGINAS / MENU LATERAL OU HORIZONTAL INTERNO */}
            <div className="lg:col-span-1 flex flex-col space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-3 mb-2">
                Fases do Processamento
              </span>
              {[
                { id: 'fontes', label: '1. Fontes de Dados' },
                { id: 'peneira', label: '2. Filtros de Qualidade' },
                { id: 'justica', label: '3. Justiça Métrica' },
                { id: 'modelo', label: '4. Modelo Estatístico' }
              ].map((subAba) => (
                <button
                  key={subAba.id}
                  onClick={() => setSubFaseAtiva(subAba.id as SubFaseMetodologia)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                    subFaseAtiva === subAba.id
                      ? 'bg-[#1c2541] text-cyan-400 border-l-4 border-cyan-400 font-semibold shadow-md'
                      : 'text-slate-400 hover:bg-[#151f38] hover:text-slate-200 border-l-4 border-transparent'
                  }`}
                >
                  {subAba.label}
                </button>
              ))}
            </div>

            {/* CONTAINER DA SUBPÁGINA ATIVA */}
            <div className="lg:col-span-3 bg-[#1c2541] rounded-xl border border-slate-700/50 p-8 shadow-xl min-h-[300px]">
              {subFaseAtiva === 'fontes' && (
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Unificação dos Bancos de Dados Nacionais</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
                    Cruzamento massivo estruturado entre bases de dados do INEP.
                  </p>
                  <div className="h-1 w-20 bg-cyan-400 rounded mb-6"></div>
                  {/* Espaço para o fluxo futuro ou tabelas de exemplo */}
                  <div className="border border-dashed border-slate-600 rounded-lg p-6 bg-[#111930] text-center text-slate-400 text-sm font-mono">
                    [Área Reservada para Diagrama de Carga de Dados JSON]
                  </div>
                </div>
              )}
              {subFaseAtiva === 'peneira' && (
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Remoção de Ruídos e Viés de Presença</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
                    Garantia de que ausências em provas não distorçam a realidade municipal.
                  </p>
                  <div className="h-1 w-20 bg-cyan-400 rounded mb-6"></div>
                </div>
              )}
              {subFaseAtiva === 'justica' && (
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Engenharia de Recursos Proporcionais</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
                    Mitigação do viés de escala física de prédios escolares.
                  </p>
                  <div className="h-1 w-20 bg-cyan-400 rounded mb-6"></div>
                </div>
              )}
              {subFaseAtiva === 'modelo' && (
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Regressão de Efeitos Fixos de Duas Vias</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed mb-4">
                    Isolamento estatístico do impacto da pandemia e perfis imutáveis das cidades.
                  </p>
                  <div className="h-1 w-20 bg-cyan-400 rounded mb-6"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {abaAtiva === 'resultados' && (
          <div className="bg-[#1c2541] rounded-xl border border-slate-700/50 p-8 text-center shadow-xl">
            <h2 className="text-xl font-bold mb-4">Módulo de Regressão Longitudinal</h2>
            <p className="text-slate-400 text-sm font-light">Os gráficos econométricos de coeficientes serão acoplados aqui.</p>
          </div>
        )}

        {abaAtiva === 'municipios' && (
          <div className="bg-[#1c2541] rounded-xl border border-slate-700/50 p-8 text-center shadow-xl">
            <h2 className="text-xl font-bold mb-4">Explorador Territorial Municipal</h2>
            <p className="text-slate-400 text-sm font-light">Mecanismo de busca e filtros estaduais por MultiIndex.</p>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0b132b] text-center py-6 border-t border-slate-800 text-xs text-slate-500">
        Galaxy Educação © 2026 — Análise Longitudinal Baseada em Evidências Científicas.
      </footer>
    </div>
  );
}