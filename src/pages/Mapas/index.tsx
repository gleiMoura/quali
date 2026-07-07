import { useState, useEffect, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip } from 'react-tooltip';

// Ativação obrigatória dos estilos visuais da Tooltip
import 'react-tooltip/dist/react-tooltip.css';

// Interface do nosso arquivo de dados JSON
interface NotaMunicipio {
  id_municipio: number;
  uf: string;
  rede: 'Pública' | 'Privada';
  CN: number;
  CH: number;
  LC: number;
  MT: number;
  REDACAO: number;
}

// Configuração Geográfica Fixa para centralização automática (Otimização de Performance)
const CONFIG_GEOGRAFICA: Record<string, { center: [number, number]; scale: number }> = {
  BR: { center: [-52, -20], scale: 1000 },
  SP: { center: [-49, -22], scale: 3500 },
  RJ: { center: [-42.5, -22.3], scale: 7000 },
  MG: { center: [-44.5, -18.5], scale: 2800 },
  CE: { center: [-39.5, -5.5], scale: 4500 },
  BA: { center: [-41.5, -12.5], scale: 2200 },
  PR: { center: [-51, -24.5], scale: 3500 },
  RS: { center: [-53, -30], scale: 3200 },
  PE: { center: [-37.5, -8.5], scale: 4500 },
  MA: { center: [-45, -5], scale: 2500 },
  PA: { center: [-52, -4], scale: 1600 },
  AM: { center: [-64, -4], scale: 1400 },
};

const COLUNAS_NOTAS = ['MT', 'CH', 'CN', 'LC', 'REDACAO'];

export default function Municipios() {
  const [malhaGeo, setMalhaGeo] = useState<any>(null);
  const [dadosNotas, setDadosNotas] = useState<NotaMunicipio[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [redeAtiva, setRedeAtiva] = useState<'Pública' | 'Privada'>('Pública');
  const [disciplinaAtiva, setDisciplinaAtiva] = useState<string>('MT');
  const [ufAtiva, setUfAtiva] = useState<string>('BR');
  const [tooltipContent, setTooltipContent] = useState("");

  // Carregamento dos dados em paralelo
  useEffect(() => {
    Promise.all([
      fetch('/data/malha_brasil.json').then(res => res.json()),
      fetch('/data/notas_municipios.json').then(res => res.json())
    ]).then(([geoData, notasData]) => {
      setMalhaGeo(geoData);
      setDadosNotas(notasData);
      setLoading(false);
    }).catch(err => {
      console.error("Erro ao carregar arquivos do mapa:", err);
      setLoading(false);
    });
  }, []);

  // Processamento e Calibragem da Escala de Cores (YlOrRd)
  const { notasFiltradas, colorScale } = useMemo(() => {
    if (!dadosNotas.length) return { notasFiltradas: [] as NotaMunicipio[], colorScale: () => '#1e293b' };

    const filtrado = dadosNotas.filter(d => d.rede === redeAtiva);
    const valores = filtrado.map(d => d[disciplinaAtiva as keyof NotaMunicipio] as number).filter(v => v > 0);
    
    // Define os limites reais com base nos dados para dar maior contraste
    const min = valores.length ? Math.min(...valores) : 400;
    const max = valores.length ? Math.max(...valores) : 800;

    const scale = scaleLinear<string>()
      .domain([min, (min + max) / 2, max])
      .range(["#ffeda0", "#feb24c", "#f03b20"]); 

    return { notasFiltradas: filtrado, colorScale: scale };
  }, [dadosNotas, redeAtiva, disciplinaAtiva]);

  // Filtro de Geometrias em tempo real (evita renderizar polígonos invisíveis)
  const geografiasAtivas = useMemo(() => {
    if (!malhaGeo) return [];
    if (ufAtiva === 'BR') return malhaGeo.features;
    return malhaGeo.features.filter((feat: any) => feat.properties.abbrev_state === ufAtiva);
  }, [malhaGeo, ufAtiva]);

  // Recupera as configurações de enquadramento da região selecionada
  const geoConfig = CONFIG_GEOGRAFICA[ufAtiva] || CONFIG_GEOGRAFICA['BR'];

  if (loading || !malhaGeo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-slate-400">Processando malha geográfica e notas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* PAINEL DE FILTROS */}
      <div className="bg-[#1c2541] rounded-xl p-5 border border-slate-700 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        
        {/* Filtro: Rede Escolar */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Rede</label>
          <div className="bg-[#0b132b] p-1 rounded-lg border border-slate-700 flex">
            {(['Pública', 'Privada'] as const).map((r) => (
              <button key={r} onClick={() => setRedeAtiva(r)}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${redeAtiva === r ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro: Disciplina */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Média ENEM</label>
          <select value={disciplinaAtiva} onChange={(e) => setDisciplinaAtiva(e.target.value)}
            className="w-full bg-[#0b132b] border border-slate-700 text-slate-200 text-xs rounded-lg p-3 font-bold focus:ring-emerald-500 focus:border-emerald-500">
            {COLUNAS_NOTAS.map(col => (
              <option key={col} value={col}>{col === 'MT' ? 'Matemática' : col === 'REDACAO' ? 'Redação' : col}</option>
            ))}
          </select>
        </div>

        {/* Filtro: Navegação por UF */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Região em Foco (UF)</label>
          <select value={ufAtiva} onChange={(e) => setUfAtiva(e.target.value)}
            className="w-full bg-[#0b132b] border border-slate-700 text-slate-200 text-xs rounded-lg p-3 font-bold focus:ring-emerald-500 focus:border-emerald-500">
            <option value="BR">Brasil Inteiro (Visão Geral)</option>
            {Object.keys(CONFIG_GEOGRAFICA).filter(uf => uf !== 'BR').map(uf => (
              <option key={uf} value={uf}>Estado: {uf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* QUADRO DO MAPA FIXO */}
      <div className="bg-slate-950 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative">
        
        {/* Título e Legenda sobrepostos */}
        <div className="absolute top-6 left-6 z-10 bg-[#1c2541]/90 backdrop-blur-sm p-4 rounded-xl border border-slate-700 pointer-events-none shadow-lg">
          <h3 className="text-sm font-extrabold uppercase text-slate-100 tracking-wider">
            Média de {disciplinaAtiva === 'MT' ? 'Matemática' : disciplinaAtiva === 'REDACAO' ? 'Redação' : disciplinaAtiva}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Rede {redeAtiva} • {ufAtiva === 'BR' ? 'Escala Nacional' : `Estado: ${ufAtiva}`}</p>
          <div className="mt-4 flex items-center space-x-2 text-[10px] font-mono text-slate-300">
            <span>Menor Média</span>
            <div className="w-24 h-2 rounded bg-gradient-to-r from-[#ffeda0] via-[#feb24c] to-[#f03b20]"></div>
            <span>Maior Média</span>
          </div>
        </div>

        {/* Canvas de Renderização Cartográfica */}
        <div className="w-full h-[800px]">
          <ComposableMap 
            projection="geoMercator" 
            projectionConfig={{ 
              center: geoConfig.center, 
              scale: geoConfig.scale 
            }}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={{ type: "FeatureCollection", features: geografiasAtivas }}>
              {({ geographies }) =>
                geographies.map((geo: any) => {
                  // Casamento seguro de tipos numéricos usando a função intParse
                  const municipioData = notasFiltradas.find(n => n.id_municipio === intParse(geo.properties.code_muni));
                  const notaValor = municipioData ? (municipioData[disciplinaAtiva as keyof NotaMunicipio] as number) : 0;
                  
                  // Se o município não contiver notas válidas, fica na cor escura do fundo (neutraliza áreas fantasmas)
                  const fillCor = notaValor > 0 ? colorScale(notaValor) : "#111827";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fillCor}
                      stroke="#030712"
                      // Remove as bordas pretas na visão nacional para limpar o borrão de tinta
                      strokeWidth={ufAtiva === 'BR' ? 0.05 : 0.25}
                      className="outline-none transition-all duration-150 hover:stroke-emerald-400 hover:stroke-1 cursor-default"
                      onMouseEnter={() => {
                        const nome = geo.properties.name_muni;
                        const estado = geo.properties.abbrev_state;
                        if (notaValor > 0) {
                          setTooltipContent(`<strong>${nome} (${estado})</strong><br/>Média: <span style="color:#34d399;font-weight:bold">${notaValor.toFixed(1)}</span> pts`);
                        } else {
                          setTooltipContent(`<strong>${nome} (${estado})</strong><br/><span style="color:#94a3b8;font-style:italic">Sem registros cadastrados</span>`);
                        }
                      }}
                      onMouseLeave={() => setTooltipContent("")}
                      data-tooltip-id="map-tooltip"
                      data-tooltip-html={tooltipContent}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        </div>
      </div>

      {/* Elemento de Tooltip Flutuante */}
      <Tooltip id="map-tooltip" float className="z-50 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 shadow-2xl font-sans text-xs" />
    </div>
  );
}

// Função auxiliar interna para conversão e validação segura de IDs de texto em números
function intParse(val: any): number {
  const p = parseInt(val, 10);
  return isNaN(p) ? 0 : p;
}