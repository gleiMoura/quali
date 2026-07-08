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
    titulo: "Seleção Baseada na Análise Quali (2024)",
    descricao: "Os atributos utilizados nesta modelagem longitudinal não foram escolhidos ao acaso. Eles são o resultado direto da análise de correlação (Quali) feita sobre os microdados de 2024, onde isolamos as variáveis estruturais e de desempenho que apresentaram maior significância estatística.",
    detalhesTecnicos: [
      "ENEM: Notas das 4 áreas de conhecimento, redação, dados de localização e dependência administrativa.",
      "ENEM (Controle): Flags de presença (TP_PRESENCA_XX) para garantir a validade dos dados.",
      "CENSO: Variáveis binárias de infraestrutura (Laboratórios, Internet, Lousa, Esgoto).",
      "CENSO (Absolutos): Quantitativos de matrículas e salas de aula para posterior transformação."
    ],
    snippetPython: `# Atributos do ENEM selecionados via matriz de correlação 2024
colunas_enem = [
    'CO_MUNICIPIO_ESC',
    'NO_MUNICIPIO_ESC',
    'SG_UF_ESC',
    'TP_DEPENDENCIA_ADM_ESC',
    'TP_LOCALIZACAO_ESC',
    'NU_NOTA_CN',
    'NU_NOTA_CH',
    'NU_NOTA_LC',
    'NU_NOTA_MT',
    'NU_NOTA_REDACAO',
    'TP_PRESENCA_CN',
    'TP_PRESENCA_CH',
    'TP_PRESENCA_LC',
    'TP_PRESENCA_MT',
]

# Atributos estruturais do Censo com maior impacto prévio
colunas_censo = [
    'CO_ENTIDADE',
    'CO_MUNICIPIO',
    'TP_LOCALIZACAO',
    'QT_DOC_BAS',
    'QT_MAT_PROF_TEC',
    'QT_MAT_BAS',
    'IN_ESGOTO_REDE_PUBLICA',
    'QT_SALAS_UTILIZA_CLIMATIZADAS',
    'QT_SALAS_UTILIZADAS',
    'IN_LABORATORIO_INFORMATICA',
    'IN_LABORATORIO_CIENCIAS',
    'IN_INTERNET_APRENDIZAGEM',
    'IN_QUADRA_ESPORTES',
    'IN_ALIMENTACAO',
    'IN_EQUIP_LOUSA_DIGITAL'
]`
  },
  {
    id: 2,
    fase: "Fase 02",
    titulo: "Filtro de Presença e Limpeza de Ruído",
    descricao: "Para garantir que a análise meça o desempenho real, removemos sumariamente os registos de alunos que faltaram a qualquer um dos dias de aplicação das provas do ENEM.",
    detalhesTecnicos: [
      "Aplicação de máscara booleana exigindo valor 1 (Presente) nas 4 áreas do conhecimento.",
      "Isolamento da base para conter apenas estudantes que completaram o exame.",
      "Eliminação de notas zeradas decorrentes de ausência (evitando viés de queda artificial na média da escola)."
    ],
    snippetPython: `# Remoção de alunos ausentes (Garantindo presença integral)
filtro_presenca = (
    (df_enem['TP_PRESENCA_CN'] == 1) & 
    (df_enem['TP_PRESENCA_CH'] == 1) & 
    (df_enem['TP_PRESENCA_LC'] == 1) & 
    (df_enem['TP_PRESENCA_MT'] == 1)
)

df_enem_filtrado = df_enem[filtro_presenca].copy()

# Remoção de NaNs residuais nas notas
cols_notas = ['NU_NOTA_CN', 'NU_NOTA_CH', 'NU_NOTA_LC', 'NU_NOTA_MT', 'NU_NOTA_REDACAO']
df_enem_filtrado = df_enem_filtrado.dropna(subset=cols_notas)`
  },
  {
    id: 3,
    fase: "Fase 03",
    titulo: "Criação de Variáveis de Tipificação (Features)",
    descricao: "A partir de colunas numéricas codificadas pelo INEP, criamos novas categorias textuais e indicadores (dummies) mais semânticos para segmentar as escolas durante a regressão em painel.",
    detalhesTecnicos: [
      "TIPO_REDE: Mapeia o TP_DEPENDENCIA_ADM_ESC (1 a 3 para Pública; 4 para Privada).",
      "TIPO_TERRITORIO: Traduz o TP_LOCALIZACAO_ESC (1 = Urbano, 2 = Rural).",
      "TX_RURALIDADE: Variável binária/indicadora (1 ou 0) para uso em modelos matemáticos econométricos."
    ],
    snippetPython: `# Criação da coluna TIPO_REDE (Pública vs Privada)
df_enem_filtrado['TIPO_REDE'] = df_enem_filtrado['TP_DEPENDENCIA_ADM_ESC'].apply(
    lambda x: 'Privada' if x == 4 else 'Pública'
)

# Criação das colunas de geoclassificação do território
df_enem_filtrado['TIPO_TERRITORIO'] = df_enem_filtrado['TP_LOCALIZACAO_ESC'].apply(
    lambda x: 'Urbano' if x == 1 else 'Rural'
)

# Indicador numérico para regressões
import numpy as np
df_enem_filtrado['TX_RURALIDADE'] = np.where(df_enem_filtrado['TP_LOCALIZACAO_ESC'] == 2, 1, 0)`
  },
  {
    id: 4,
    fase: "Fase 04",
    titulo: "Normalização e Taxas Proporcionais",
    descricao: "Números absolutos geram viés para escolas maiores. Para resolver isso, convertemos colunas de quantitativos (QT_) do Censo Escolar em taxas e proporções, normalizando a comparação entre instituições de diferentes portes.",
    detalhesTecnicos: [
      "Taxa de Climatização: Obtida dividindo QT_SALAS_UTILIZA_CLIMATIZADAS por QT_SALAS_UTILIZADAS.",
      "Taxa Profissionalizante: Divisão de alunos técnicos (QT_MAT_PROF_TEC) pelo total da educação básica (QT_MAT_BAS).",
      "Preenchimento Seguro: Tratamento matemático para evitar divisões por zero (transformando NaN em 0)."
    ],
    snippetPython: `# Conversão de valores absolutos para proporções (Normalização de Escala)

# Qual o percentual de salas da escola que possui ar condicionado?
df_censo['TX_SALAS_CLIMATIZADAS'] = (
    df_censo['QT_SALAS_UTILIZA_CLIMATIZADAS'] / df_censo['QT_SALAS_UTILIZADAS']
)

# Qual a proporção de alunos no ensino técnico em relação à base total?
df_censo['TX_ENSINO_TECNICO'] = (
    df_censo['QT_MAT_PROF_TEC'] / df_censo['QT_MAT_BAS']
)

# Tratamento para escolas onde o denominador era 0 (evitando divisão infinita)
df_censo[['TX_SALAS_CLIMATIZADAS', 'TX_ENSINO_TECNICO']] = df_censo[['TX_SALAS_CLIMATIZADAS', 'TX_ENSINO_TECNICO']].fillna(0)`
  }
];

export default function MetodologiaHorizontal() {
  const [passoAtivo, setPassoAtivo] = useState<number>(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* SEÇÃO DA ESQUERDA: A LINHA DO TEMPO */}
      <div className="lg:col-span-4 bg-[#1c2541] rounded-xl p-6 border border-slate-700 shadow-md">
        <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center space-x-2">
          <span className="text-emerald-400">#</span>
          <span>Pipeline de Transformação</span>
        </h2>
        
        <div className="relative border-l-2 border-slate-700 ml-3 space-y-6">
          {passosMetodologia.map((passo) => (
            <div 
              key={passo.id} 
              onClick={() => setPassoAtivo(passo.id)}
              className="relative pl-6 cursor-pointer group"
            >
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

      {/* SEÇÃO DA DIREITA: DETALHAMENTO DO PASSO SELECIONADO */}
      <div className="lg:col-span-8 space-y-6">
        {passosMetodologia.filter(p => p.id === passoAtivo).map((passo) => (
          <div key={passo.id} className="space-y-6 animate-fade-in">
            
            {/* Bloco de Informações Textuais */}
            <div className="bg-[#1c2541] rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                  {passo.fase} Metodológica
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: ETL_TEMPORAL_0{passo.id}</span>
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
                  <span className="text-xs text-slate-500 pl-2">feature_engineering.py</span>
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