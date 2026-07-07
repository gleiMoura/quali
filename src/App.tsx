import { useState } from 'react';
import Metodologia from './pages/AnaliseCorrelacao/Metodologia/index.tsx';
import Correlacoes from './pages/AnaliseCorrelacao/Correlacoes/index.tsx';
import Heatmaps from './pages/AnaliseCorrelacao/Heatmaps/index.tsx';
import Mapas from './pages/AnaliseCorrelacao/Mapas/index.tsx';

// 1. Definição dos tipos de análises globais (Linhas de Pesquisa)
type TipoAnalise = 'quali' | 'horizontal';

// 2. Definição das sub-abas internas
type SubAba = 'metodologia' | 'correlações' | 'heatmaps' | "mapas";

interface EstruturaPagina {
  titulo: string;
  subtitulo: string;
  imagemFundo: string;
}

// Configurações baseadas na Análise Ativa (Header)
const configAnalises: Record<TipoAnalise, EstruturaPagina> = {
  quali: {
    titulo: "Análise de Correlação e Infraestrutura (Quali)",
    subtitulo: "Explorando os coeficientes de Pearson, Spearman e p-valores para mapear o impacto da infraestrutura escolar no ENEM.",
    imagemFundo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80"
  },
  horizontal: {
    titulo: "Análise Longitudinal Horizontal",
    subtitulo: "Acompanhando a evolução histórica temporal e os cruzamentos de dados ao longo dos anos (Em Breve).",
    imagemFundo: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
  }
};

export default function App() {
  // Estado para controlar a linha de pesquisa global (Header)
  const [analiseAtiva, setAnaliseAtiva] = useState<TipoAnalise>('quali');

  // Estado para controlar as seções internas da pesquisa
  const [abaAtiva, setAbaAtiva] = useState<SubAba>('metodologia');

  const dadosAnaliseAtual = configAnalises[analiseAtiva];

  return (
    <div className="min-h-screen bg-[#0b132b] flex flex-col">

      {/* 1. BARRA DE NAVEGAÇÃO SUPERIOR (HEADER GLOBAL) */}
      <nav className="bg-[#1c2541] border-b border-slate-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 w-3 h-6 rounded-sm"></div>
            <span className="text-lg font-bold tracking-wider text-slate-100">
              INFRAESTRUTURA E <span className="text-emerald-400 font-medium">EDUCAÇÃO</span>
            </span>
          </div>

          {/* Abas Superiores: Seleção da Linha de Pesquisa Temporal/Evolutiva */}
          <div className="flex h-full space-x-2">
            <button
              onClick={() => setAnaliseAtiva('quali')}
              className={`h-full px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${analiseAtiva === 'quali'
                  ? 'border-emerald-400 text-emerald-400 bg-[#232c4e]'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1e2746]'
                }`}
            >
              Pesquisa Quali (Correlações)
            </button>

            <button
              onClick={() => setAnaliseAtiva('horizontal')}
              className={`h-full px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 relative ${analiseAtiva === 'horizontal'
                  ? 'border-emerald-400 text-emerald-400 bg-[#232c4e]'
                  : 'border-transparent text-slate-500 hover:text-slate-400'
                }`}
            >
              Análise Horizontal
              <span className="absolute top-1 right-1 text-[9px] bg-amber-500/20 text-amber-400 px-1 rounded border border-amber-500/30 font-sans">
                Breve
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO BANNER DINÂMICO (Atualiza com base na linha de pesquisa ativa) */}
      <header className="relative bg-slate-900 overflow-hidden shadow-inner border-b border-slate-800">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform scale-105"
          style={{
            backgroundImage: `url('${dadosAnaliseAtual.imagemFundo}')`,
            opacity: 0.12
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b132b] via-[#0b132b]/90 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 py-10 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Plataforma Longitudinal de Microdados
          </span>
          <h1 className="text-3xl font-extrabold text-slate-100 mt-3 tracking-tight max-w-3xl">
            {dadosAnaliseAtual.titulo}
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-2xl font-light leading-relaxed">
            {dadosAnaliseAtual.subtitulo}
          </p>

          {/* 3. SUB-NAVEGAÇÃO (Fica logo abaixo das informações do Header) */}
          <div className="flex space-x-1 mt-6 border-b border-slate-700/50 max-w-max">
            {(['metodologia', 'correlações', 'heatmaps', 'mapas'] as SubAba[]).map((subAba) => (
              <button
                key={subAba}
                onClick={() => setAbaAtiva(subAba)}
                className={`px-5 py-2 text-xs font-semibold uppercase tracking-wider rounded-t-lg transition-all duration-150 relative -mb-[1px] ${abaAtiva === subAba
                    ? 'bg-[#1c2541] text-emerald-400 border-t-2 border-x border-slate-700 border-t-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                disabled={analiseAtiva === 'horizontal'} // Trava a navegação interna na aba "breve"
              >
                {subAba}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 4. CONTEÚDO PRINCIPAL MODULAR */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {analiseAtiva === 'quali' ? (
          <>
            {abaAtiva === 'metodologia' && <Metodologia />}
            {abaAtiva === 'correlações' && <Correlacoes />}
            {abaAtiva === 'heatmaps' && <Heatmaps />}
            {abaAtiva === 'mapas' && <Mapas />}
          </>
        ) : (
          /* Placeholder visual elegante para a aba Horizontal que está por vir */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
            <div className="p-4 bg-slate-800/50 rounded-full border border-slate-700 text-amber-400 animate-pulse">
              📊
            </div>
            <h3 className="text-xl font-bold text-slate-200">Módulo Horizontal em Desenvolvimento</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Esta seção está sendo estruturada para exibir o comportamento longitudinal das variáveis ao longo da série histórica. O pipeline Python correspondente está em fase de modelagem.
            </p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0b132b] text-center py-6 border-t border-slate-800 text-xs text-slate-500">
        2026 — Análise Longitudinal Baseada em Evidências Científicas.
      </footer>
    </div>
  );
}