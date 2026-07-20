import { useState, useEffect } from 'react';

// 1. Tipagens exatas do nosso ficheiro JSON
interface LinhaEstatistica {
  granularidade: 'Bairro' | 'Município';
  rede: 'Pública' | 'Privada';
  disciplina: string;
  infraestrutura: string;
  pearsonR: number;
  spearmanR: number;
}

interface EstruturaDadosJson {
  correlacoes: LinhaEstatistica[];
}

// 2. Dicionário para deixar os nomes do Censo mais fáceis de ler no ecrã
const labelsInfraestrutura: Record<string, string> = {
  QT_DOC_BAS: "Docentes Educação Básica",
  QT_MAT_PROF_TEC: "Matrículas Ensino Técnico",
  IN_ESGOTO_REDE_PUBLICA: "Rede Pública de Esgoto",
  IN_INTERNET_APRENDIZAGEM: "Internet para Aprendizagem",
  QT_SALAS_UTILIZA_CLIMATIZADAS: "Salas Climatizadas",
  QT_MAT_BAS: "Matrículas Totais (Escala)",
  IN_ALIMENTACAO: "Alimentação Escolar",
  IN_LABORATORIO_CIENCIAS: "Laboratório de Ciências",
  IN_EQUIP_LOUSA_DIGITAL: "Lousa Digital",
  IN_BIBLIOTECA: "Biblioteca Escolar",
  IN_QUADRA_ESPORTES: "Quadra de Esportes",
  IN_EQUIP_MULTIMIDIA: "Equipamentos Multimídia",
  IN_ACESSIBILIDADE_INEXISTENTE: "Sem Acessibilidade",
  IN_SALA_LEITURA: "Sala de Leitura",
  IN_BANHEIRO_PNE: "Banheiro Adaptado (PNE)",
  QT_MAT_EJA: "Matrículas EJA",
  TP_AEE: "Atendimento Especializado",
  IN_LABORATORIO_INFORMATICA: "Laboratório de Informática"
};

// As colunas fixas da nossa matriz (As 5 áreas do ENEM)
const COLUNAS_NOTAS = ['CH', 'CN', 'LC', 'MT', 'REDACAO'];

export default function Heatmaps() {
  // Estado para guardar o JSON inteiro
  const [dadosBase, setDadosBase] = useState<EstruturaDadosJson | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros Dinâmicos (O utilizador controla isto)
  const [granularidade, setGranularidade] = useState<'Bairro' | 'Município'>('Bairro');
  const [redeAtiva, setRedeAtiva] = useState<'Pública' | 'Privada'>('Pública');
  const [metodo, setMetodo] = useState<'pearson' | 'spearman'>('pearson');

  // Efeito para carregar o ficheiro apenas uma vez quando a página abre
  useEffect(() => {
    fetch('/data/dados_resultados.json')
      .then((res) => res.json())
      .then((data: EstruturaDadosJson) => {
        setDadosBase(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar os dados:", err);
        setLoading(false);
      });
  }, []);

  if (loading || !dadosBase) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-slate-400 tracking-wider">A gerar Matrizes de Calor dinâmicas...</p>
      </div>
    );
  }

  // =========================================================================
  // MOTOR DE DADOS DINÂMICO
  // =========================================================================
  
  // 1. Filtra em tempo real com base nos botões selecionados
  // (Removemos as linhas "_std" para focar apenas nas notas médias diretas)
  const dadosFiltrados = dadosBase.correlacoes.filter(
    (d) => 
      d.granularidade === granularidade && 
      d.rede === redeAtiva &&
      !d.disciplina.includes('_std')
  );

  // 2. Extrai os nomes das infraestruturas para criar as linhas da tabela
  const infraestruturasSet = new Set(dadosFiltrados.map((d) => d.infraestrutura));
  let infraestruturas = Array.from(infraestruturasSet);

  // 3. Função que cruza a Linha (Infra) com a Coluna (Disciplina)
  const getValorCorrelacao = (infra: string, disc: string) => {
    const celula = dadosFiltrados.find(d => d.infraestrutura === infra && d.disciplina === disc);
    if (!celula) return 0;
    
    // Aqui está a magia: Devolve o R do Pearson ou o R do Spearman dependendo do botão ativo!
    return metodo === 'pearson' ? celula.pearsonR : celula.spearmanR;
  };

  // 4. Ordena as linhas para que as infraestruturas com maior impacto fiquem no topo
  infraestruturas = infraestruturas.sort((a, b) => {
    const mediaA = COLUNAS_NOTAS.reduce((acc, disc) => acc + Math.abs(getValorCorrelacao(a, disc)), 0) / 5;
    const mediaB = COLUNAS_NOTAS.reduce((acc, disc) => acc + Math.abs(getValorCorrelacao(b, disc)), 0) / 5;
    return mediaB - mediaA; 
  });

  // 5. Função para gerar a cor da célula (O nosso "Coolwarm" adaptado)
  const getCorDeFundo = (valor: number) => {
    if (valor === 0) return 'rgba(30, 41, 59, 0.4)'; // Vazio / Neutro (Cinza escuro)
    
    // Intensificamos a cor com base na força da correlação
    const opacidade = Math.min(Math.abs(valor) * 2.5, 1).toFixed(2);
    
    // Verde-Esmeralda para impactos positivos, Vermelho-Rosa para negativos
    return valor > 0 
      ? `rgba(16, 185, 129, ${opacidade})` 
      : `rgba(244, 63, 94, ${opacidade})`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ========================================================================= */}
      {/* 1. PAINEL DE FILTROS DINÂMICOS */}
      {/* ========================================================================= */}
      <div className="bg-[#1c2541] rounded-xl p-5 border border-slate-700 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        
        {/* Filtro: Granularidade */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-emerald-400 tracking-wider">1. Escala Espacial</label>
          <div className="bg-[#0b132b] p-1 rounded-lg border border-slate-700 flex">
            {(['Bairro', 'Município'] as const).map((g) => (
              <button key={g} onClick={() => setGranularidade(g)}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${granularidade === g ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro: Rede Pública/Privada */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">2. Rede Escolar</label>
          <div className="bg-[#0b132b] p-1 rounded-lg border border-slate-700 flex">
            {(['Pública', 'Privada'] as const).map((r) => (
              <button key={r} onClick={() => setRedeAtiva(r)}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${redeAtiva === r ? 'bg-[#232c4e] text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro: Pearson vs Spearman */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">3. Método Estatístico (Matriz)</label>
          <div className="bg-[#0b132b] p-1 rounded-lg border border-slate-700 flex">
            <button onClick={() => setMetodo('pearson')} className={`flex-1 py-2 text-xs font-mono font-bold rounded-md transition-all ${metodo === 'pearson' ? 'bg-slate-700 text-emerald-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}>
              Pearson
            </button>
            <button onClick={() => setMetodo('spearman')} className={`flex-1 py-2 text-xs font-mono font-bold rounded-md transition-all ${metodo === 'spearman' ? 'bg-slate-700 text-emerald-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}>
              Spearman
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ÁREA DA MATRIZ DE CALOR (HEATMAP) */}
      {/* ========================================================================= */}
      <div className="bg-[#1c2541] rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho do Gráfico e Legenda */}
        <div className="p-4 bg-[#232c4e] border-b border-slate-700 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">
              Heatmap de Correlações <span className="text-emerald-400 capitalize">({metodo})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Corte Ativo: Rede {redeAtiva} a nível de {granularidade}.
            </p>
          </div>
          
          {/* Legenda de Cores */}
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 bg-[#0b132b] px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="text-rose-400 font-bold">-1.0</span>
            <div className="w-24 h-2.5 rounded bg-gradient-to-r from-rose-500 via-slate-700 to-emerald-500"></div>
            <span className="text-emerald-400 font-bold">+1.0</span>
          </div>
        </div>

        {/* Grelha do Heatmap */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs font-bold text-slate-400 uppercase tracking-widest w-1/3 border-b border-slate-700">
                  Infraestrutura (Censo Escolar)
                </th>
                {COLUNAS_NOTAS.map((col) => (
                  <th key={col} className="p-2 text-center text-xs font-bold text-slate-200 uppercase tracking-widest w-24 border-b border-slate-700">
                    {col === 'MT' ? 'Matemática' : col === 'REDACAO' ? 'Redação' : col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {infraestruturas.map((infra) => (
                <tr key={infra} className="group">
                  
                  {/* Célula do Nome da Linha */}
                  <td className="p-3 text-xs font-medium text-slate-300 border-r border-slate-700/50 group-hover:bg-slate-800/40 transition-colors">
                    {labelsInfraestrutura[infra] || infra}
                    <span className="block text-[9px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                      {infra}
                    </span>
                  </td>
                  
                  {/* Células Coloridas (O Heatmap) */}
                  {COLUNAS_NOTAS.map((disc) => {
                    const valor = getValorCorrelacao(infra, disc);
                    
                    // Condição para que o texto fique legível sobre fundos muito escuros/coloridos
                    const isCorForte = Math.abs(valor) > 0.15;

                    return (
                      <td key={disc} className="p-1 group-hover:bg-slate-800/20">
                        <div 
                          className="w-full h-11 rounded flex items-center justify-center text-xs font-mono font-bold transition-all duration-200 hover:scale-110 cursor-crosshair border border-slate-700/20 hover:border-slate-300 shadow-sm hover:shadow-lg hover:z-10 relative"
                          style={{
                            backgroundColor: getCorDeFundo(valor),
                            color: isCorForte ? '#ffffff' : '#94a3b8',
                            textShadow: isCorForte ? '0px 1px 2px rgba(0,0,0,0.6)' : 'none'
                          }}
                          // Tooltip nativa que aparece quando o rato passa por cima
                          title={`Correlação entre ${labelsInfraestrutura[infra] || infra} e nota de ${disc}:\nr = ${valor.toFixed(4)}`}
                        >
                          {valor === 0 ? '-' : (valor > 0 ? `+${valor.toFixed(2)}` : valor.toFixed(2))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mensagem caso não existam dados para o filtro atual */}
          {infraestruturas.length === 0 && (
            <div className="text-center py-16 text-slate-500 text-sm font-light">
              Não existem cruzamentos estatisticamente significativos para os filtros selecionados.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}