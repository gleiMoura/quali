import { useState, useEffect } from 'react';

// Dicionário de tradução para os cabeçalhos da tabela
const dicionarioColunas: Record<string, string> = {
    CO_MUNICIPIO_ESC: "Código do Município",
    NO_MUNICIPIO_ESC: "Nome do Município",
    TIPO_REDE: "Dependência Administrativa",
    NOTA_MEDIA_MUNICIPIO: "Nota Média Geral",
    QT_ALUNOS_ENEM: "Qtd. Alunos (ENEM)",
    TX_RURALIDADE: "Taxa de Ruralidade",
    TIPO_TERRITORIO: "Tipo de Território",
    ANO: "Ano do Censo",
    TX_MAT_TEC: "Taxa Ensino Técnico",
    IN_ESGOTO_REDE_PUBLICA: "Esgoto (Rede Pública)",
    TX_CLIMATIZACAO: "Taxa de Climatização",
    IN_LABORATORIO_INFORMATICA: "Lab. de Informática",
    IN_LABORATORIO_CIENCIAS: "Lab. de Ciências",
    IN_INTERNET_APRENDIZAGEM: "Internet para Ensino",
    IN_QUADRA_ESPORTES: "Quadra de Esportes",
    IN_ALIMENTACAO: "Alimentação Escolar",
    IN_EQUIP_LOUSA_DIGITAL: "Lousa Digital",
    NU_NOTA_CN: "Nota Média (CN)",
    NU_NOTA_CH: "Nota Média (CH)",
    NU_NOTA_LC: "Nota Média (LC)",
    NU_NOTA_MT: "Nota Média (MT)",
    NU_NOTA_REDACAO: "Nota Média (Redação)"
};

export default function VisualizacaoPainel() {
    const [dados, setDados] = useState<any[]>([]);
    const [colunas, setColunas] = useState<string[]>([]);
    const [carregando, setCarregando] = useState<boolean>(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        fetch('/data/painelHorizontal.json')
            .then((resposta) => {
                if (!resposta.ok) {
                    throw new Error('Falha ao carregar o ficheiro JSON.');
                }
                return resposta.json();
            })
            .then((dadosJson) => {
                if (dadosJson && dadosJson.length > 0) {
                    // Extrai apenas as primeiras 10 linhas do JSON inteiro
                    const amostraDezLinhas = dadosJson.slice(0, 10);
                    setDados(amostraDezLinhas);

                    // Extrai os nomes das colunas dinamicamente a partir do primeiro objeto
                    setColunas(Object.keys(amostraDezLinhas[0]));
                } else {
                    setErro("O ficheiro JSON foi carregado, mas está vazio.");
                }
                setCarregando(false);
            })
            .catch((err) => {
                console.error("Erro no Fetch do Painel:", err);
                setErro("Erro ao carregar /data/painelHorizontal.json. Verifique se o ficheiro existe.");
                setCarregando(false);
            });
    }, []);

    // Função para formatar os valores da tabela de forma inteligente
    const formatarValor = (valor: any, nomeColuna: string) => {
        if (valor === null || valor === undefined || valor === "") {
            return <span className="text-slate-600">NaN</span>;
        }

        // Formatação especial para códigos numéricos, quantidades e anos (sem casas decimais)
        if (nomeColuna === 'CO_MUNICIPIO_ESC' || nomeColuna === 'ANO' || nomeColuna === 'QT_ALUNOS_ENEM' || nomeColuna.startsWith('CO_')) {
            return Math.round(Number(valor));
        }

        // Formatação para as taxas (TX), indicadores (IN) e Notas
        if (typeof valor === 'number' && !Number.isInteger(valor)) {
            // 2 casas decimais para notas, 4 casas para taxas de proporção
            if (nomeColuna.includes('NOTA')) return valor.toFixed(2);
            return valor.toFixed(4);
        }

        return String(valor);
    };

    return (
        <div className="bg-[#1c2541] rounded-xl border border-slate-700 shadow-xl overflow-hidden animate-fade-in flex flex-col max-h-[700px]">

            {/* Cabeçalho do Card */}
            <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between bg-[#182039] shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                        <span className="text-emerald-400">#</span>
                        <span>Amostra do Painel Longitudinal</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Visualização dinâmica das primeiras 10 linhas com dicionário de variáveis.
                    </p>
                </div>

                <div className={`border px-3 py-1 rounded-full flex items-center space-x-2 ${carregando ? 'bg-amber-500/10 border-amber-500/20' :
                        erro ? 'bg-red-500/10 border-red-500/20' :
                            'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${carregando ? 'bg-amber-400 animate-pulse' :
                            erro ? 'bg-red-400' :
                                'bg-emerald-400'
                        }`}></span>
                    <span className={`text-xs font-mono tracking-wider ${carregando ? 'text-amber-400' :
                            erro ? 'text-red-400' :
                                'text-emerald-400'
                        }`}>
                        {carregando ? 'PROCESSANDO...' : erro ? 'ERRO' : `${colunas.length} COLUNAS RENDERIZADAS`}
                    </span>
                </div>
            </div>

            {/* Container da Tabela com Scroll duplo (Horizontal e Vertical) */}
            <div className="overflow-auto flex-1 relative bg-[#0b132b]/50">

                {carregando && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c2541]/80 backdrop-blur-sm z-10">
                        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-3"></div>
                        <span className="text-sm font-mono text-emerald-400">A carregar tensores do JSON...</span>
                    </div>
                )}

                {erro && !carregando && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c2541] z-10 px-6 text-center">
                        <span className="text-3xl mb-2">⚠️</span>
                        <span className="text-sm font-mono text-red-400">{erro}</span>
                    </div>
                )}

                {/* Renderização Dinâmica da Tabela */}
                {!carregando && !erro && dados.length > 0 && (
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-[#232c4e] shadow-sm border-b border-slate-700">
                                <th className="px-4 py-3 sticky left-0 bg-[#232c4e] z-30 border-r border-slate-700/50">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/90">Índice</span>
                                        <span className="text-[9px] text-emerald-500/50 font-mono mt-0.5">index</span>
                                    </div>
                                </th>
                                {colunas.map((col, idx) => (
                                    <th key={idx} className="px-4 py-3">
                                        <div className="flex flex-col">
                                            {/* Título Legível */}
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/90">
                                                {dicionarioColunas[col] || col}
                                            </span>
                                            {/* Nome original da coluna menor em baixo */}
                                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 tracking-tight">
                                                {col}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {dados.map((linha, indexLinha) => (
                                <tr
                                    key={indexLinha}
                                    className="hover:bg-slate-800/60 transition-colors duration-150 text-xs font-mono text-slate-300"
                                >
                                    <td className="px-4 py-2 bg-[#1c2541] sticky left-0 border-r border-slate-800/50 text-slate-500 text-center">
                                        {indexLinha}
                                    </td>
                                    {colunas.map((col, indexCol) => (
                                        <td key={indexCol} className="px-4 py-2">
                                            {formatarValor(linha[col], col)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="bg-[#182039] px-6 py-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500 shrink-0">
                <span>Matriz exibida: {dados.length} linhas × {colunas.length} colunas</span>
                <span className="font-mono text-[10px]">Origem: public/data/painelHorizontal.json</span>
            </div>
        </div>
    );
}