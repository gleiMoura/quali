import { useState } from 'react';

interface EtapaMetodologica {
  id: number;
  fase: string;
  titulo: string;
  descricao: string;
  detalhesTecnicos: string[];
  snippetPython: string;
}

const passosMetodologia: EtapaMetodologica[] = [
  {
    id: 1,
    fase: "Fase 01",
    titulo: "Ingestão e Carregamento de Microdados",
    descricao: "Consumo das bases de dados massivas do INEP diretamente de repositórios em nuvem, utilizando a biblioteca gdown para automação do download dos arquivos estruturados em formato CSV.",
    detalhesTecnicos: [
      "Dataset ENEM: Microdados dos participantes do exame.",
      "Dataset Censo Escolar 2024: Infraestrutura e dados de matrículas das entidades.",
      "Biblioteca geobr: Importação de malhas municipais para geoprocessamento futuro."
    ],
    snippetPython: `import pandas as pd\nimport gdown\n\n# Downloads automatizados via ID do Drive\ngdown.download(gd_link_enem, 'enem.csv', fuzzy=True)\ngdown.download(gd_link_censo, 'censo.csv', fuzzy=True)\n\ndata_enem = pd.read_csv('enem.csv', encoding='latin1', sep=';')\ndata_censo = pd.read_csv('censo.csv', encoding='latin1', sep=';')`
  },
  {
    id: 2,
    fase: "Fase 02",
    titulo: "Filtragem Amostral e Limpeza do ENEM",
    descricao: "Tratamento inicial da base do ENEM para focar exclusivamente em alunos presentes em todas as provas e que possuíam vínculo escolar mapeável. Candidatos treineiros ou que já concluíram o ensino médio em anos anteriores foram desconsiderados.",
    detalhesTecnicos: [
      "Filtro de presença: TP_PRESENCA_XX == 1 (Presente nos 2 dias).",
      "Eliminação de dados nulos nas notas das 5 competências avaliadas.",
      "Exclusão de registros sem vínculo escolar (Remoção de CO_ESCOLA nulo).",
      "Volume restante para análise: 1.193.432 registros de candidatos."
    ],
    snippetPython: `# Filtro de presença integral\ndf_enem = df_enem[(df_enem['TP_PRESENCA_CN'] == 1) & (df_enem['TP_PRESENCA_CH'] == 1) & ...]\n\n# Eliminação de nulos nas notas e na identificação escolar\ncols_notas = ['NU_NOTA_CN', 'NU_NOTA_CH', 'NU_NOTA_LC', 'NU_NOTA_MT', 'NU_NOTA_REDACAO']\ndf_enem = df_enem.dropna(subset=cols_notas)\ndf_enem = df_enem.dropna(subset=['CO_ESCOLA'])\ndf_enem['CO_ESCOLA'] = df_enem['CO_ESCOLA'].astype(int)`
  },
  {
    id: 3,
    fase: "Fase 03",
    titulo: "Tratamento de Atributos do Censo Escolar",
    descricao: "Seleção de variáveis de infraestrutura escolar (básicas e avançadas), remoção de inconsistências espaciais e imputação de dados nulos para variáveis de contagem e indicadores binários.",
    detalhesTecnicos: [
      "Atributos básicos: Água potável, energia, esgoto e coleta de lixo.",
      "Atributos acadêmicos: Biblioteca, laboratórios, salas climatizadas, computadores por aluno.",
      "Normalização de strings: Caixa alta e remoção de espaços nas chaves de bairros.",
      "Imputação simples: Preenchimento de dados faltantes (NaN) com valor 0."
    ],
    snippetPython: `# Seleção de colunas e tratamento de strings do bairro\ndf_censo = data_censo[colunas_censo].dropna(subset=['NO_BAIRRO']).copy()\df_censo['NO_BAIRRO'] = df_censo['NO_BAIRRO'].str.upper().str.strip()\n\n# Imputação de nulos para quantidades (QT) e indicadores (IN)\ndf_censo[cols_qt] = df_censo[cols_qt].fillna(0)\ndf_censo[cols_in] = df_censo[cols_in].fillna(0)`
  },
  {
    id: 4,
    fase: "Fase 04",
    titulo: "Engenharia de Recursos (Métricas Proporcionais)",
    descricao: "Criação de novos indicadores relativos para anular o efeito de escala do tamanho das escolas, permitindo comparar o impacto real dos investimentos de forma justa entre instituições de grande e pequeno porte.",
    detalhesTecnicos: [
      "Taxa de Tempo Integral: Matrículas em tempo integral / Matrículas totais.",
      "Profissionais de Saúde: Psicólogos e Nutricionistas por cada 1.000 alunos.",
      "Qualificação Docente: Taxa de professores da educação básica com Pós-Graduação.",
      "Tecnologia e Ensino Técnico: Taxas proporcionais de computadores e matrículas profissionais."
    ],
    snippetPython: `# Criação de recursos proporcionais por aluno/escola\ndf_censo['TX_TEMPO_INTEGRAL'] = df_censo['QT_MAT_BAS_INT'] / df_censo['QT_MAT_BAS']\ndf_censo['PSICOLOGOS_POR_ALUNO'] = (df_censo['QT_PROF_PSICOLOGO'] / df_censo['QT_MAT_BAS']) * 1000\ndf_censo['TX_DOC_POS'] = df_censo['QT_DOC_BAS_POS_GRAD'] / df_censo['QT_DOC_BAS']\n\n# Substituição de infinitos e NaNs resultantes de divisões por zero\ndf_censo[cols_novas] = df_censo[cols_novas].replace([np.inf, -np.inf], np.nan).fillna(0)`
  },
  {
    id: 5,
    fase: "Fase 05",
    titulo: "Consolidação e Agrupamento Geográfico",
    descricao: "Execução do cruzamento (Inner Join) entre os dados de desempenho do ENEM e a infraestrutura mapeada no Censo. Em seguida, os dados foram agregados ao nível de Bairro e Tipo de Rede para a análise de correlação estatística.",
    detalhesTecnicos: [
      "Chave de união: CO_ESCOLA (ENEM) ligado ao CO_ENTIDADE (Censo).",
      "Amostra consolidada final: 1.159.779 estudantes integrados.",
      "Segmentação por rede: Criação da variável binária 'Pública' vs 'Privada'.",
      "Agrupamento: Agregação por Bairro gerando médias e desvios-padrão (std) das notas."
    ],
    snippetPython: `# Merge interno das bases de dados\ndf = pd.merge(df_enem, df_censo, left_on='CO_ESCOLA', right_on='CO_ENTIDADE', how='inner')\n\n# Classificação da rede escolar\ndf['TIPO_ESCOLA'] = df['TP_DEPENDENCIA_ADM_ESC'].apply(lambda x: 'Privada' if x == 4 else 'Pública')\n\n# Agrupamento dinâmico para nível de Bairro\nagg_dict = {col: ['mean', 'std'] for col in cols_notas}\nfor col in cols_infra: agg_dict[col] = ['mean']\ndf_bairro = df.groupby(['NO_BAIRRO', 'TIPO_ESCOLA']).agg(agg_dict).reset_index()`
  }
];

export default function Metodologia() {
  const [passoAtivo, setPassoAtivo] = useState<number>(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* SEÇÃO DA ESQUERDA: A LINHA DO TEMPO (4 colunas) */}
      <div className="lg:col-span-4 bg-[#1c2541] rounded-xl p-6 border border-slate-700 shadow-md">
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center space-x-2">
          <span className="text-emerald-400">#</span>
          <span>Pipeline de Dados</span>
        </h2>
        
        <div className="relative border-l-2 border-slate-700 ml-3 space-y-6">
          {passosMetodologia.map((passo) => (
            <div 
              key={passo.id} 
              onClick={() => setPassoAtivo(passo.id)}
              className="relative pl-6 cursor-pointer group"
            >
              {/* Indicador visual redondo na linha */}
              <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                passoAtivo === passo.id 
                  ? 'bg-emerald-400 border-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                  : 'bg-[#1c2541] border-slate-500 group-hover:border-slate-300'
              }`} />
              
              <div className={`p-3 rounded-lg transition-all duration-200 ${
                passoAtivo === passo.id 
                  ? 'bg-[#232c4e] border-l-4 border-emerald-400' 
                  : 'hover:bg-[#1e2746]'
              }`}>
                <span className={`text-xs font-mono block ${
                  passoAtivo === passo.id ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {passo.fase}
                </span>
                <span className={`text-sm font-semibold block transition-colors duration-150 ${
                  passoAtivo === passo.id ? 'text-slate-100' : 'text-slate-400 group-hover:text-slate-200'
                }`}>
                  {passo.titulo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO DA DIREITA: DETALHAMENTO DO PASSO SELECIONADO (8 colunas) */}
      <div className="lg:col-span-8 space-y-6">
        {passosMetodologia.filter(p => p.id === passoAtivo).map((passo) => (
          <div key={passo.id} className="space-y-6 animate-fade-in">
            
            {/* Bloco de Informações Textuais */}
            <div className="bg-[#1c2541] rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  {passo.fase} Metodológica
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: ETAPA_0{passo.id}</span>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-100">{passo.titulo}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{passo.descricao}</p>
              
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Especificações e Regras de Negócio:
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  {passo.detalhesTecnicos.map((detalhe, index) => (
                    <li key={index} className="text-xs text-slate-400 leading-relaxed">
                      {detalhe}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bloco de Snippet de Código Python Correspondente */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-lg overflow-hidden font-mono">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                  <span className="text-xs text-slate-500 pl-2">data_processing.py</span>
                </div>
                <span className="text-xs text-slate-600">Python 3 (pandas)</span>
              </div>
              <pre className="p-4 overflow-x-auto text-xs text-emerald-400/90 leading-relaxed selection:bg-emerald-500/20">
                <code>{passo.snippetPython}</code>
              </pre>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}