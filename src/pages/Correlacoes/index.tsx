import { useState, useEffect } from 'react';

// 1. Interfaces estritas espelhando as colunas reais do arquivo JSON gerado
interface LinhaEstatistica {
  granularidade: 'Bairro' | 'Município';
  rede: 'Pública' | 'Privada';
  disciplina: string;
  infraestrutura: string;
  pearsonR: number;
  pearsonP: number;
  spearmanR: number;
  spearmanP: number;
}

interface Top10Item {
  infraestrutura: string;
  forca: number;
}

interface EstruturaDadosJson {
  correlacoes: LinhaEstatistica[];
  top10: {
    Bairro: Top10Item[];
    Município: Top10Item[];
  };
}

// Dicionário de tradução amigável dos códigos do Censo Escolar
const labelsInfraestrutura: Record<string, { nome: string; cat: string }> = {
  QT_DOC_BAS: { nome: "Quantidade de Docentes na Educação Básica", cat: "Recursos Humanos" },
  QT_MAT_PROF_TEC: { nome: "Matrículas em Ensino Profissional Técnico", cat: "Acadêmico" },
  IN_ESGOTO_REDE_PUBLICA: { nome: "Acesso à Rede Pública de Esgoto", cat: "Estrutura Básica" },
  IN_INTERNET_APRENDIZAGEM: { nome: "Internet para Uso em Aprendizagem", cat: "Tecnologia" },
  QT_SALAS_UTILIZA_CLIMATIZADAS: { nome: "Salas de Aula Climatizadas (Ar-Condicionado)", cat: "Estrutura Avançada" },
  QT_MAT_BAS: { nome: "Volume Total de Matrículas da Educação Básica", cat: "Escala" },
  IN_ALIMENTACAO: { nome: "Oferecimento de Alimentação Escolar", cat: "Insumo Básico" },
  IN_LABORATORIO_CIENCIAS: { nome: "Laboratório de Ciências", cat: "Acadêmico" },
  IN_EQUIP_LOUSA_DIGITAL: { nome: "Equipamento de Lousa Digital", cat: "Tecnologia" },
  IN_BIBLIOTECA: { nome: "Possui Biblioteca Escolar", cat: "Acadêmico" },
  IN_QUADRA_ESPORTES: { nome: "Quadra de Esportes Coberta/Descoberta", cat: "Estrutura Avançada" },
  IN_EQUIP_MULTIMIDIA: { nome: "Equipamentos Multimídia (Projetores)", cat: "Tecnologia" },
  IN_ACESSIBILIDADE_INEXISTENTE: { nome: "Inexistência de Recursos de Acessibilidade", cat: "Inclusão" },
  IN_SALA_LEITURA: { nome: "Sala de Leitura", cat: "Acadêmico" },
  IN_BANHEIRO_PNE: { nome: "Banheiro Adaptado (PNE)", cat: "Inclusão" },
  QT_MAT_EJA: { nome: "Matrículas em EJA (Jovens e Adultos)", cat: "Social/Vulnerabilidade" },
  TP_AEE: { nome: "Atendimento Educacional Especializado (AEE)", cat: "Inclusão" },
  IN_LABORATORIO_INFORMATICA: { nome: "Laboratório de Informática", cat: "Tecnologia" }
};

export default function Resultados() {
  // Estados para armazenamento de dados da API estática
  const [dadosBase, setDadosBase] = useState<EstruturaDadosJson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Filtros Interativos do Painel
  const [granularidade, setGranularidade] = useState<'Bairro' | 'Município'>('Bairro');
  const [redeAtiva, setRedeAtiva] = useState<'Pública' | 'Privada'>('Pública');
  const [materiaAtiva, setMateriaAtiva] = useState<'CH' | 'CN' | 'LC' | 'MT' | 'REDACAO'>('MT');
  const [olharVariancia, setOlharVariancia] = useState<boolean>(false); // Liga/desliga o sufixo _std
  const [metodoCoeficiente, setMetodoCoeficiente] = useState<'pearson' | 'spearman'>('pearson');

  // Efeito assíncrono para buscar o JSON puro
  useEffect(() => {
    fetch('/data/dados_resultados.json')
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível carregar a tabela unificada de microdados.');
        return res.json();
      })
      .then((data: EstruturaDadosJson) => {
        setDadosBase(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-slate-400 tracking-wider">Conectando e parseando matrizes de microdados...</p>
      </div>
    );
  }

  if (error || !dadosBase) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-xl text-center max-w-lg mx-auto my-12">
        <span className="text-2xl">⚠️</span>
        <h4 className="text-md font-bold text-rose-400 mt-2">Falha no Carregamento</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{error || "Arquivo JSON não encontrado na pasta pública."}</p>
      </div>
    );
  }

  // Define dinamicamente o ID da coluna (Ex: "MT" ou "MT_std")
  const identificadorDisciplina = olharVariancia ? `${materiaAtiva}_std` : materiaAtiva;

  // Executa o filtro de dados e a ordenação em tempo real via JavaScript client-side
  const linhasFiltradas = dadosBase.correlacoes.filter(
    (item) =>
      item.granularidade === granularidade &&
      item.rede === redeAtiva &&
      item.disciplina === identificadorDisciplina
  );

  const top10Ativo = dadosBase.top10[granularidade] || [];

  const formatCientifico = (num: number) => {
    // Se for um número extremamente pequeno (como a notação "e-158")
    if (num < 0.001) return "< 0,001";

    // Para os restantes, fixa em 3 casas decimais e usa vírgula
    return num.toFixed(3).replace('.', ',');
  };

  return (
    <div className="space-y-6">

      {/* 1. SEÇÃO DE CONTROLES MULTIFATORIAIS */}
      <div className="bg-[#1c2541] rounded-xl p-5 border border-slate-700 shadow-md grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">

        {/* Filtro 1: Granularidade Espacial */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-emerald-400 tracking-wider block">1. Escala Geográfica</label>
          <div className="bg-[#0b132b] p-1 rounded-lg border border-slate-700 flex">
            {(['Bairro', 'Município'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularidade(g)}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${granularidade === g ? 'bg-emerald-500 text-slate-950 font-extrabold shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Nível {g}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro 2: Tipo de Escola */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block">2. Dependência Administrativa</label>
          <div className="bg-[#0b132b] p-1 rounded-lg border border-slate-700 flex">
            {(['Pública', 'Privada'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRedeAtiva(r)}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all ${redeAtiva === r ? 'bg-[#232c4e] text-emerald-400 border border-emerald-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro 3: As 5 Áreas de Conhecimento Reais */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block">3. Área do Conhecimento (ENEM)</label>
          <select
            value={materiaAtiva}
            onChange={(e) => setMateriaAtiva(e.target.value as any)}
            className="w-full bg-[#0b132b] border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 font-semibold focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="MT">Matemática</option>
            <option value="CH">Ciências Humanas</option>
            <option value="CN">Ciências da Natureza</option>
            <option value="LC">Linguagens e Códigos</option>
            <option value="REDACAO">Redação</option>
          </select>
        </div>

        {/* Filtro 4: Coeficiente Estatístico */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider block">4. Formulação de Postos</label>
          <div className="bg-[#0b132b] p-1 rounded-lg border border-slate-700 flex">
            {(['pearson', 'spearman'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetodoCoeficiente(m)}
                className={`flex-1 text-center py-2 text-xs font-mono font-bold capitalize rounded-md transition-all ${metodoCoeficiente === m ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* CHANGER NOTA MÉDIA VS FLUTUAÇÃO DE DESIGUALDADE (_std) */}
      <div className="flex flex-wrap items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-800 gap-2">
        <div className="text-xs text-slate-300">
          Escala Ativa: <span className="text-emerald-400 font-bold">{granularidade}</span> | Filtro Técnico:{' '}
          <span className="text-slate-400 font-mono font-bold bg-[#1c2541] px-2 py-0.5 rounded border border-slate-700">{identificadorDisciplina}</span>
        </div>
        <button
          onClick={() => setOlharVariancia(!olharVariancia)}
          className={`px-4 py-1.5 text-xs font-mono font-bold rounded border transition-all ${olharVariancia ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-slate-100'
            }`}
        >
          {olharVariancia ? "← Analisar Notas Médias" : "Analisar Dispersão e Volatilidade (_std) →"}
        </button>
      </div>

      {/* 2. TABELA TOTALMENTE ORIENTADA A DADOS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LADO ESQUERDO: LISTAGEM DINÂMICA DA MATRIZ DO ARQUIVO */}
        <div className="xl:col-span-2 bg-[#1c2541] rounded-xl border border-slate-700 overflow-hidden shadow-md">
          <div className="p-4 bg-[#232c4e] border-b border-slate-700">
            <h3 className="text-xs font-extrabold uppercase text-slate-200 tracking-wider">
              Variáveis Estatisticamente Relevantes Encontradas (p &lt; 0.05)
            </h3>
          </div>

          <div className="overflow-x-auto">
            {linhasFiltradas.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/60 bg-slate-900/30 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <th className="p-4">Indicador de Infraestrutura (Censo)</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4 text-center">Coeficiente (r)</th>
                    <th className="p-4 text-right">p-valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-sm">
                  {linhasFiltradas
                    // Ordena dinamicamente pela força absoluta da correlação selecionada
                    .sort((a, b) => {
                      const valA = metodoCoeficiente === 'pearson' ? a.pearsonR : a.spearmanR;
                      const valB = metodoCoeficiente === 'pearson' ? b.pearsonR : b.spearmanR;
                      return Math.abs(valB) - Math.abs(valA);
                    })
                    .map((item) => {
                      const r = metodoCoeficiente === 'pearson' ? item.pearsonR : item.spearmanR;
                      const p = metodoCoeficiente === 'pearson' ? item.pearsonP : item.spearmanP;
                      const meta = labelsInfraestrutura[item.infraestrutura] || { nome: item.infraestrutura, cat: "Escala / Matrícula" };

                      return (
                        <tr key={item.infraestrutura} className="hover:bg-slate-800/20 transition-all">
                          <td className="p-4">
                            <div className="font-bold text-slate-200 text-xs">{meta.nome}</div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">{item.infraestrutura}</div>
                          </td>
                          <td className="p-4">
                            <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-900 rounded text-slate-400 border border-slate-700">
                              {meta.cat}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded border ${r < 0
                                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              }`}>
                              {r >= 0 ? `+${r.toFixed(4)}` : r.toFixed(4)}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-xs text-slate-400">
                            {formatCientifico(p)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 italic">
                Nenhuma variável com p-valor significativo de corte (&lt; 0.05) para este quadrante no arquivo JSON.
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: RANKING GERAL HISTÓRICO DO JSON */}
        <div className="space-y-6">

          <div className="bg-[#1c2541] rounded-xl p-4 border border-slate-700 shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              🏆 Top 5 Força Média Geral: {granularidade}
            </h4>
            <div className="space-y-2">
              {top10Ativo.slice(0, 5).map((item, index) => {
                const meta = labelsInfraestrutura[item.infraestrutura] || { nome: item.infraestrutura };
                return (
                  <div key={item.infraestrutura} className="flex items-center justify-between p-2 rounded bg-slate-900/40 text-xs border border-slate-800">
                    <span className="text-slate-400 truncate max-w-[70%]">
                      {index + 1}. {meta.nome}
                    </span>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/5 px-2 rounded">
                      {item.forca.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

         {/*  <div className="bg-gradient-to-br from-slate-900 to-[#1c2541] rounded-xl p-5 border border-slate-800 space-y-3">
            <h5 className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">
              🔬 Comportamento Científico Observado
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Ao desacoplar a visualização e ler diretamente o JSON gerado pelos seus scripts, as nuances geográficas emergem. Índices negativos de escala como <span className="font-mono text-slate-200">QT_MAT_EJA</span> provam estatisticamente o peso de barreiras socioeconômicas no nível municipal, enquanto insumos operacionais como a climatização de salas (<span className="font-mono text-slate-200">QT_SALAS_UTILIZA_CLIMATIZADAS</span>) impulsionam o desvio-padrão das notas nos bairros.
            </p>
          </div> */}

        </div>

      </div>

    </div>
  );
}