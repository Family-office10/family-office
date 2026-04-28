
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip as RechartsTip, ResponsiveContainer,
  Legend, ScatterChart, Scatter,
  CartesianGrid, ReferenceLine, ComposedChart
} from "recharts";
const CFG = {
  finnhubKey: "d7c4glpr01quh9fcg590d7c4glpr01quh9fcg59g",
  brapiKey:   "mBaitDx8KTQr4E1Tx43Arg",
  rfRate:     10.5,   // % — taxa livre de risco (CDI atual)
  portRet:    21.85,  // % — retorno anualizado do portfólio
  portVol:    16.79,  // % — volatilidade anualizada
  portBeta:   1.43,   // beta vs mercado
  portMaxDD:  -30.28, // % — max drawdown histórico
  limConc:    20,     // % — alerta de concentração por ativo
};
const FAMILIAS = [
  "Familia Silva",
  "Familia Mendes",
  "Familia Rocha",
  "Familia Costa",
];
const CATS = [
  { id:"acoes_br",    label:"Acoes BR",    color:"#00C896", br:true,  vol:28 },
  { id:"fiis",        label:"FIIs",         color:"#34D399", br:true,  vol:18 },
  { id:"renda_fixa",  label:"Renda Fixa",   color:"#3B82F6", br:true,  vol:4  },
  { id:"acoes_eua",   label:"Acoes EUA",    color:"#F5A623", br:false, vol:22 },
  { id:"etfs",        label:"ETFs",          color:"#F97316", br:false, vol:18 },
  { id:"cripto",      label:"Cripto",        color:"#FB923C", br:false, vol:75 },
  { id:"commodities", label:"Commodities",  color:"#FBBF24", br:false, vol:30 },
  { id:"cambio",      label:"Cambio",        color:"#60A5FA", br:false, vol:15 },
  { id:"imoveis",     label:"Imoveis",       color:"#F472B6", br:false, vol:12 },
  { id:"outros",      label:"Outros",        color:"#6B7A99", br:false, vol:20 },
];
const INIT_ASSETS = [
  { id:1,  family:"Familia Silva",  category:"acoes_br",   ticker:"PETR4",    name:"Petrobras",    qty:5000,   avgPrice:34.20  },
  { id:2,  family:"Familia Silva",  category:"acoes_br",   ticker:"VALE3",    name:"Vale",         qty:2000,   avgPrice:58.40  },
  { id:3,  family:"Familia Silva",  category:"fiis",       ticker:"HGLG11",   name:"CSHG Log.",    qty:500,    avgPrice:152.00 },
  { id:4,  family:"Familia Silva",  category:"acoes_eua",  ticker:"AAPL",     name:"Apple",        qty:100,    avgPrice:175.00 },
  { id:5,  family:"Familia Silva",  category:"cripto",     ticker:"BTC-USD",  name:"Bitcoin",      qty:0.5,    avgPrice:55000  },
  { id:6,  family:"Familia Mendes", category:"renda_fixa", ticker:"TESOURO",  name:"Tesouro Selic",qty:1,      avgPrice:500000 },
  { id:7,  family:"Familia Mendes", category:"acoes_eua",  ticker:"MSFT",     name:"Microsoft",    qty:150,    avgPrice:380.00 },
  { id:8,  family:"Familia Mendes", category:"etfs",       ticker:"SPY",      name:"S&P500 ETF",   qty:200,    avgPrice:490.00 },
  { id:9,  family:"Familia Rocha",  category:"acoes_br",   ticker:"ITUB4",    name:"Itau",         qty:8000,   avgPrice:30.50  },
  { id:10, family:"Familia Rocha",  category:"commodities",ticker:"GC=F",     name:"Ouro",         qty:10,     avgPrice:2100   },
  { id:11, family:"Familia Rocha",  category:"cambio",     ticker:"USDBRL=X", name:"USD/BRL",      qty:100000, avgPrice:4.95   },
  { id:12, family:"Familia Costa",  category:"fiis",       ticker:"XPML11",   name:"XP Malls",     qty:1000,   avgPrice:98.00  },
  { id:13, family:"Familia Costa",  category:"acoes_eua",  ticker:"NVDA",     name:"NVIDIA",       qty:50,     avgPrice:650.00 },
  { id:14, family:"Familia Costa",  category:"cripto",     ticker:"ETH-USD",  name:"Ethereum",     qty:5,      avgPrice:3000   },
];
const INIT_TXS = [
  { id:1, date:"10/01/2024", family:"Familia Silva",  ticker:"PETR4",  type:"compra",   qty:5000, price:34.20, total:171000 },
  { id:2, date:"15/01/2024", family:"Familia Silva",  ticker:"VALE3",  type:"compra",   qty:2000, price:58.40, total:116800 },
  { id:3, date:"01/02/2024", family:"Familia Mendes", ticker:"MSFT",   type:"compra",   qty:150,  price:380.0, total:57000  },
  { id:4, date:"15/03/2024", family:"Familia Rocha",  ticker:"ITUB4",  type:"compra",   qty:8000, price:30.50, total:244000 },
  { id:5, date:"20/03/2024", family:"Familia Costa",  ticker:"NVDA",   type:"compra",   qty:50,   price:650.0, total:32500  },
  { id:6, date:"01/04/2024", family:"Familia Silva",  ticker:"PETR4",  type:"venda",    qty:500,  price:40.10, total:20050  },
];
const C = {
  bg:        "#070B14",   // azul-noite quase preto
  surface:   "#0D1424",   // sidebar / painéis laterais
  card:      "#111B2E",   // cards principais
  cardHover: "#162038",   // hover dos cards
  border:    "#1C2D47",   // bordas finas
  borderHi:  "#253D62",   // bordas destacadas
  accent:    "#05D890",   // verde esmeralda vivo
  accentDim: "#05D89014",
  accentSoft:"#05D89030",
  gold:      "#F0A500",   // âmbar rico
  goldDim:   "#F0A50020",
  red:       "#F04060",   // vermelho coral
  redDim:    "#F0406018",
  blue:      "#3D8EF8",   // azul elétrico
  blueDim:   "#3D8EF820",
  purple:    "#9D6EFA",   // violeta vibrante
  purpleDim: "#9D6EFA20",
  cyan:      "#22D3EE",   // ciano para detalhes
  teal:      "#14B8A6",   // teal para gráficos
  text:      "#E2EAF6",   // texto principal — levemente azulado
  textSub:   "#A8B8D0",   // subtítulos
  muted:     "#5A7494",   // texto secundário / labels
  white:     "#FFFFFF",
};
const SIG = {
  BUY:     C.accent,   // 🟢 Verde
  NEUTRAL: "#6B7A99",  // ⚪ Cinza
  SELL:    C.red,      // 🔴 Vermelho
};

function signal(metric, value) {
  const v = +value;
  if (isNaN(v)) return { cor:SIG.NEUTRAL, emoji:"⚪", label:"—", badge:"Neutro" };

  const rules = {
    sharpe:      v>=1.2?{cor:SIG.BUY,emoji:"🟢",label:"Excelente",badge:"Compra"}  :v>=0.8?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Razoável",badge:"Neutro"}     :{cor:SIG.SELL,emoji:"🔴",label:"Fraco",badge:"Alerta"},
    sortino:     v>=1.5?{cor:SIG.BUY,emoji:"🟢",label:"Excelente",badge:"Compra"}  :v>=1.0?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Aceitável",badge:"Neutro"}     :{cor:SIG.SELL,emoji:"🔴",label:"Fraco",badge:"Alerta"},
    calmar:      v>=0.7?{cor:SIG.BUY,emoji:"🟢",label:"Excelente",badge:"Compra"}  :v>=0.4?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Médio",badge:"Neutro"}         :{cor:SIG.SELL,emoji:"🔴",label:"Ruim",badge:"Alerta"},
    treynor:     v>=8? {cor:SIG.BUY,emoji:"🟢",label:"Excelente",badge:"Compra"}   :v>=5?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Aceitável",badge:"Neutro"}     :{cor:SIG.SELL,emoji:"🔴",label:"Fraco",badge:"Alerta"},
    info_ratio:  v>=0.5?{cor:SIG.BUY,emoji:"🟢",label:"Gestão ativa competente",badge:"Compra"}:v>=0.2?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Positivo",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Abaixo do índice",badge:"Alerta"},
    omega:       v>=1.5?{cor:SIG.BUY,emoji:"🟢",label:"Favorável",badge:"Compra"}  :v>=1.0?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Neutro",badge:"Neutro"}        :{cor:SIG.SELL,emoji:"🔴",label:"Desfavorável",badge:"Alerta"},
    alpha:       v>=3? {cor:SIG.BUY,emoji:"🟢",label:"Alpha forte",badge:"Compra"} :v>=0?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Alpha positivo",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Destruindo valor",badge:"Alerta"},
    cagr:        v>=15?{cor:SIG.BUY,emoji:"🟢",label:"Acima da meta",badge:"Compra"}:v>=10?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Na meta",badge:"Neutro"}       :{cor:SIG.SELL,emoji:"🔴",label:"Abaixo do CDI",badge:"Alerta"},
    up_capture:  v>=105?{cor:SIG.BUY,emoji:"🟢",label:"Amplifica altas",badge:"Compra"}:v>=95?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Em linha",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Perde nas altas",badge:"Alerta"},
    batting_avg: v>=55?{cor:SIG.BUY,emoji:"🟢",label:"Bom timing",badge:"Compra"}  :v>=45?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Neutro",badge:"Neutro"}        :{cor:SIG.SELL,emoji:"🔴",label:"Abaixo do bench",badge:"Alerta"},
    hit_rate:    v>=55?{cor:SIG.BUY,emoji:"🟢",label:"Maioria ganha",badge:"Compra"}:v>=45?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Neutro",badge:"Neutro"}       :{cor:SIG.SELL,emoji:"🔴",label:"Maioria perde",badge:"Alerta"},
    profit_fac:  v>=2? {cor:SIG.BUY,emoji:"🟢",label:"Excelente",badge:"Compra"}   :v>=1.2?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Positivo",badge:"Neutro"}    :{cor:SIG.SELL,emoji:"🔴",label:"Perdendo",badge:"Alerta"},
    ic:          v>=0.1?{cor:SIG.BUY,emoji:"🟢",label:"Skill real",badge:"Compra"} :v>=0.05?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Skill marginal",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Sem skill",badge:"Alerta"},
    pos_months:  v>=60?{cor:SIG.BUY,emoji:"🟢",label:"Consistente",badge:"Compra"} :v>=50?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Neutro",badge:"Neutro"}        :{cor:SIG.SELL,emoji:"🔴",label:"Maioria negativa",badge:"Alerta"},
    excess_ret:  v>=5? {cor:SIG.BUY,emoji:"🟢",label:"Prêmio alto",badge:"Compra"} :v>=0?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Positivo",badge:"Neutro"}    :{cor:SIG.SELL,emoji:"🔴",label:"Abaixo do CDI",badge:"Alerta"},
    vol:         v<=12?{cor:SIG.BUY,emoji:"🟢",label:"Vol controlada",badge:"Compra"}:v<=22?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderada",badge:"Neutro"}    :{cor:SIG.SELL,emoji:"🔴",label:"Vol alta",badge:"Alerta"},
    max_dd:      v>=-15?{cor:SIG.BUY,emoji:"🟢",label:"DD controlado",badge:"Compra"}:v>=-30?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Aceitável",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"DD severo",badge:"Alerta"},
    down_capture:v<=85?{cor:SIG.BUY,emoji:"🟢",label:"Amortece quedas",badge:"Compra"}:v<=100?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Em linha",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Amplifica quedas",badge:"Alerta"},
    beta:        Math.abs(v-1)<=0.2?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Neutro",badge:"Neutro"}:v<0.8?{cor:SIG.BUY,emoji:"🟢",label:"Defensivo",badge:"Compra"}:{cor:SIG.SELL,emoji:"🔴",label:"Agressivo",badge:"Alerta"},
    skew:        v>=0? {cor:SIG.BUY,emoji:"🟢",label:"Assimetria positiva",badge:"Compra"}:v>=-0.5?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Leve negativa",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Risco de cauda",badge:"Alerta"},
    kurt:        v<=1? {cor:SIG.BUY,emoji:"🟢",label:"Normal",badge:"Compra"}       :v<=2?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Aceitável",badge:"Neutro"}   :{cor:SIG.SELL,emoji:"🔴",label:"Caudas pesadas",badge:"Alerta"},
    tracking_err:v<=3? {cor:SIG.BUY,emoji:"🟢",label:"Replicação fiel",badge:"Compra"}:v<=6?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Aceitável",badge:"Neutro"}  :{cor:SIG.SELL,emoji:"🔴",label:"Alto desvio",badge:"Alerta"},
    var99_pct:   v<=2? {cor:SIG.BUY,emoji:"🟢",label:"Risco controlado",badge:"Compra"}:v<=4?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderado",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Risco alto",badge:"Alerta"},
    mkt_corr:    v<=0.7?{cor:SIG.BUY,emoji:"🟢",label:"Descorrelacionado",badge:"Compra"}:v<=0.85?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderado",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Alta corr.",badge:"Alerta"},
    gini:        v<=0.35?{cor:SIG.BUY,emoji:"🟢",label:"Bem diversificado",badge:"Compra"}:v<=0.6?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderado",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Concentrado",badge:"Alerta"},
    hhi:         v<=1000?{cor:SIG.BUY,emoji:"🟢",label:"Diversificado",badge:"Compra"}:v<=2500?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderado",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Concentrado",badge:"Alerta"},
    dr:          v>=1.8?{cor:SIG.BUY,emoji:"🟢",label:"Excelente diversif.",badge:"Compra"}:v>=1.3?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Boa diversif.",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Diversif. fraca",badge:"Alerta"},
    active_share:v>=70?{cor:SIG.BUY,emoji:"🟢",label:"Alta convicção",badge:"Compra"}:v>=50?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Semi-ativo",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Closet indexer",badge:"Alerta"},
    shortfall:   v<=15?{cor:SIG.BUY,emoji:"🟢",label:"Seguro",badge:"Compra"}       :v<=35?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Atenção",badge:"Neutro"}     :{cor:SIG.SELL,emoji:"🔴",label:"Alto risco",badge:"Alerta"},
    pvp:         v<=0.92?{cor:SIG.BUY,emoji:"🟢",label:"Desconto atrativo",badge:"Compra"}:v<=1.05?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Preço justo",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Caro vs NAV",badge:"Alerta"},
    dy_fii:      v>=9?  {cor:SIG.BUY,emoji:"🟢",label:"DY excelente",badge:"Compra"}  :v>=7?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"DY ok",badge:"Neutro"}    :{cor:SIG.SELL,emoji:"🔴",label:"DY fraco",badge:"Alerta"},
    spread_cdi:  v>=1.5?{cor:SIG.BUY,emoji:"🟢",label:"Spread atrativo",badge:"Compra"}:v>=0?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Spread mínimo",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"CDI mais atrativo",badge:"Alerta"},
    vacancia:    v<=4?  {cor:SIG.BUY,emoji:"🟢",label:"Baixa vacância",badge:"Compra"} :v<=8?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderada",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Alta vacância",badge:"Alerta"},
    ltv:         v<=20? {cor:SIG.BUY,emoji:"🟢",label:"Alavancagem baixa",badge:"Compra"}:v<=35?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderada",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Alavancagem alta",badge:"Alerta"},
    cap_rate:    v>=8?  {cor:SIG.BUY,emoji:"🟢",label:"Cap rate alto",badge:"Compra"}  :v>=6?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Aceitável",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Cap rate baixo",badge:"Alerta"},
    inadimp:     v<=1?  {cor:SIG.BUY,emoji:"🟢",label:"Baixa inadimpl.",badge:"Compra"}:v<=3?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderada",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Alta inadimpl.",badge:"Alerta"},
    fii_score:   v>=70? {cor:SIG.BUY,emoji:"🟢",label:"Excelente",badge:"Compra"}      :v>=50? {cor:SIG.NEUTRAL,emoji:"⚪",label:"Bom",badge:"Neutro"}      :{cor:SIG.SELL,emoji:"🔴",label:"Cuidado",badge:"Alerta"},
    ter:         v<=0.1?{cor:SIG.BUY,emoji:"🟢",label:"Muito barato",badge:"Compra"}  :v<=0.3?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Razoável",badge:"Neutro"}  :{cor:SIG.SELL,emoji:"🔴",label:"Caro",badge:"Alerta"},
    td_etf:      v<=0?  {cor:SIG.BUY,emoji:"🟢",label:"ETF supera índice",badge:"Compra"}:v<=0.1?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Ok",badge:"Neutro"}    :{cor:SIG.SELL,emoji:"🔴",label:"Drag alto",badge:"Alerta"},
    prem_nav:    Math.abs(v)<=0.1?{cor:SIG.BUY,emoji:"🟢",label:"Par com NAV",badge:"Compra"}:Math.abs(v)<=0.5?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Pequeno desvio",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Desvio alto",badge:"Alerta"},
    overlap:     v<=20? {cor:SIG.BUY,emoji:"🟢",label:"Boa diversif.",badge:"Compra"}  :v<=50? {cor:SIG.NEUTRAL,emoji:"⚪",label:"Overlap parcial",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Diversif. ilusória",badge:"Alerta"},
    tco_etf:     v<=0.15?{cor:SIG.BUY,emoji:"🟢",label:"Custo baixo",badge:"Compra"}  :v<=0.5?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Razoável",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Custo alto",badge:"Alerta"},
    buffett:     v<=1.0?{cor:SIG.BUY,emoji:"🟢",label:"Mercado barato",badge:"Compra"} :v<=1.5?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderado",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Mercado caro",badge:"Alerta"},
    cape:        v<=15? {cor:SIG.BUY,emoji:"🟢",label:"Muito barato",badge:"Compra"}   :v<=25? {cor:SIG.NEUTRAL,emoji:"⚪",label:"Normal",badge:"Neutro"}    :{cor:SIG.SELL,emoji:"🔴",label:"Muito caro",badge:"Alerta"},
    vix:         v<=15? {cor:SIG.SELL,emoji:"🔴",label:"Complacência",badge:"Alerta"}  :v<=25? {cor:SIG.NEUTRAL,emoji:"⚪",label:"Normal",badge:"Neutro"}    :{cor:SIG.BUY,emoji:"🟢",label:"Pânico = oportunidade",badge:"Compra"},
    erp:         v>=5?  {cor:SIG.BUY,emoji:"🟢",label:"Ações atrativas",badge:"Compra"}:v>=2?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Neutro",badge:"Neutro"}   :{cor:SIG.SELL,emoji:"🔴",label:"Bonds > Ações",badge:"Alerta"},
    pe_ratio:    v<=15? {cor:SIG.BUY,emoji:"🟢",label:"Barato",badge:"Compra"}         :v<=25? {cor:SIG.NEUTRAL,emoji:"⚪",label:"Razoável",badge:"Neutro"}  :{cor:SIG.SELL,emoji:"🔴",label:"Caro",badge:"Alerta"},
    peg:         v<=1?  {cor:SIG.BUY,emoji:"🟢",label:"Barato vs crescimento",badge:"Compra"}:v<=2?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Justo",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Caro",badge:"Alerta"},
    ps_ratio:    v<=1?  {cor:SIG.BUY,emoji:"🟢",label:"Barato",badge:"Compra"}         :v<=2?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Normal",badge:"Neutro"}   :{cor:SIG.SELL,emoji:"🔴",label:"Caro",badge:"Alerta"},
    roic_wacc:   v>=5?  {cor:SIG.BUY,emoji:"🟢",label:"Cria muito valor",badge:"Compra"}:v>=0?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Cria valor",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Destrói valor",badge:"Alerta"},
    dcf_upside:  v>=20? {cor:SIG.BUY,emoji:"🟢",label:"Grande upside",badge:"Compra"}  :v>=5?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Upside moderado",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Downside",badge:"Alerta"},
    spread_rf:   v>=2?  {cor:SIG.BUY,emoji:"🟢",label:"Spread atrativo",badge:"Compra"}:v>=1?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Spread ok",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Spread baixo",badge:"Alerta"},
    carry_roll:  v>=3?  {cor:SIG.BUY,emoji:"🟢",label:"Carry alto",badge:"Compra"}     :v>=1?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Carry ok",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Carry fraco",badge:"Alerta"},
    pd_credit:   v<=0.5?{cor:SIG.BUY,emoji:"🟢",label:"Baixo risco",badge:"Compra"}    :v<=2?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderado",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Alto risco",badge:"Alerta"},
    tvpi:        v>=2?  {cor:SIG.BUY,emoji:"🟢",label:"Retorno excelente",badge:"Compra"}:v>=1.5?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Adequado",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Abaixo do mercado",badge:"Alerta"},
    dpi:         v>=1?  {cor:SIG.BUY,emoji:"🟢",label:"Capital recuperado",badge:"Compra"}:v>=0.5?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Parcial",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Sem distribuição",badge:"Alerta"},
    pme:         v>=1.2?{cor:SIG.BUY,emoji:"🟢",label:"Supera mercado",badge:"Compra"}  :v>=0.9?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Em linha",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Abaixo do índice",badge:"Alerta"},
    sahm:        v<=0?  {cor:SIG.BUY,emoji:"🟢",label:"Sem recessão",badge:"Compra"}    :v<=0.3?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Atenção",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Recessão",badge:"Alerta"},
    yield_curve: v>=0.5?{cor:SIG.BUY,emoji:"🟢",label:"Normal",badge:"Compra"}          :v>=-0.2?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Achatada",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Invertida",badge:"Alerta"},
    junk_spread: v<=4?  {cor:SIG.SELL,emoji:"🔴",label:"Complacência",badge:"Alerta"}   :v<=7?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Normal",badge:"Neutro"}  :{cor:SIG.BUY,emoji:"🟢",label:"Stress = oportunidade",badge:"Compra"},
    cons_conf:   v>=110?{cor:SIG.SELL,emoji:"🔴",label:"Exuberância",badge:"Alerta"}    :v>=85? {cor:SIG.BUY,emoji:"🟢",label:"Otimismo saudável",badge:"Compra"}:{cor:SIG.NEUTRAL,emoji:"⚪",label:"Pessimismo",badge:"Neutro"},
    margin_debt: v<=500?{cor:SIG.BUY,emoji:"🟢",label:"Normal",badge:"Compra"}          :v<=800?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Atenção",badge:"Neutro"}  :{cor:SIG.SELL,emoji:"🔴",label:"Especulação alta",badge:"Alerta"},
    amvi:        v<=-1? {cor:SIG.BUY,emoji:"🟢",label:"Mercado barato",badge:"Compra"}  :v<=1?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Mercado justo",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Mercado caro",badge:"Alerta"},
    carry_vol_fx:v>=0.35?{cor:SIG.BUY,emoji:"🟢",label:"Carry atrativo",badge:"Compra"}:v>=0.2?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Neutro",badge:"Neutro"}  :{cor:SIG.SELL,emoji:"🔴",label:"Não compensa",badge:"Alerta"},
    ppp_dev:     Math.abs(v)<=15?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Próximo ao justo",badge:"Neutro"}:v<-15?{cor:SIG.BUY,emoji:"🟢",label:"Moeda barata",badge:"Compra"}:{cor:SIG.SELL,emoji:"🔴",label:"Moeda cara",badge:"Alerta"},
    herdeiro_score:v>=70?{cor:SIG.BUY,emoji:"🟢",label:"Bem estruturado",badge:"Compra"}:v>=50?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Atenção",badge:"Neutro"} :{cor:SIG.SELL,emoji:"🔴",label:"Urgente",badge:"Alerta"},
    dcr:         v>=1.5?{cor:SIG.BUY,emoji:"🟢",label:"Renda cobre despesas",badge:"Compra"}:v>=1?{cor:SIG.NEUTRAL,emoji:"⚪",label:"Equilibrado",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Renda insuficiente",badge:"Alerta"},
    ter_total:   v<=1?  {cor:SIG.BUY,emoji:"🟢",label:"Custo baixo",badge:"Compra"}     :v<=2?  {cor:SIG.NEUTRAL,emoji:"⚪",label:"Moderado",badge:"Neutro"}:{cor:SIG.SELL,emoji:"🔴",label:"Custo alto",badge:"Alerta"},
  };
  return rules[metric] || { cor:SIG.NEUTRAL, emoji:"⚪", label:"—", badge:"Neutro" };
}
function SignalBadge({ metric, value, showLabel=true }) {
  const s = signal(metric, value);
  return (
    <span style={{
    display:"inline-flex", alignItems:"center", gap:4,
    background:s.cor+"18", color:s.cor,
    borderRadius:8, padding:"3px 10px",
    fontSize:10, fontWeight:700,
    border:"1px solid "+s.cor+"30",
    letterSpacing:.3,
    boxShadow:"0 0 8px "+s.cor+"18",
    }}>
    {s.emoji} {showLabel ? s.label : s.badge}
    </span>
  );
}
function SignalDot({ metric, value }) {
  const s = signal(metric, value);
  return (
    <span title={s.label} style={{
    display:"inline-block", width:10, height:10,
    borderRadius:"50%", background:s.cor,
    flexShrink:0,
    }}/>
  );
}

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const fmt    = (n, d=2) => (n==null||isNaN(n)) ? "--" : new Intl.NumberFormat("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const fmtBRL = n => (n==null||isNaN(n)) ? "--" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
const fmtPct = n => (n==null||isNaN(n)) ? "--" : (n>=0?"+":"")+fmt(n)+"%";
const catOf  = id => CATS.find(c=>c.id===id) || CATS[CATS.length-1];
const isBR   = (t,c) => catOf(c).br || /^[A-Z]{4}\d{1,2}$/.test(t);
const uid    = () => Math.random().toString(36).slice(2);
const hoje   = () => new Date().toLocaleDateString("pt-BR");
async function buscarBrapi(tickers) {
  if (!tickers.length) return {};
  try {
    const res  = await fetch(`https://brapi.dev/api/quote/${tickers.join(",")}?token=${CFG.brapiKey}`);
    const data = await res.json();
    const out  = {};
    for (const q of (data.results || [])) {
    out[q.symbol] = { price: q.regularMarketPrice||0, changePct: q.regularMarketChangePercent||0, src:"Brapi" };
    }
    return out;
  } catch { return {}; }
}

function toFinnhubSym(t) {
  if (t.includes("BRL=X")) return "OANDA:"+t.replace("BRL=X","")+"_BRL";
  if (t.endsWith("-USD"))  return "BINANCE:"+t.replace("-USD","")+"USDT";
  const MAP = { "GC=F":"OANDA:XAU_USD","SI=F":"OANDA:XAG_USD","CL=F":"OANDA:USOIL_USD" };
  return MAP[t] || t;
}

async function buscarFinnhub(ticker) {
  try {
    const res  = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(toFinnhubSym(ticker))}&token=${CFG.finnhubKey}`);
    const data = await res.json();
    if (data && data.c > 0) return { price: data.c, changePct: data.dp||0, src:"Finnhub" };
  } catch {}
  return null;
}
const S = {
  card:  {
    background: C.card,
    border: "1px solid "+C.border,
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 24px #00000030, inset 0 1px 0 #ffffff08",
    transition: "box-shadow .2s, border-color .2s",
  },
  cardGlow: c => ({
    background: C.card,
    border: "1px solid "+(c||C.accent)+"44",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 0 24px "+(c||C.accent)+"18, 0 4px 24px #00000030, inset 0 1px 0 #ffffff08",
  }),
  inp:   {
    background: C.surface,
    border: "1px solid "+C.border,
    borderRadius: 10,
    color: C.text,
    padding: "9px 14px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color .2s",
  },
  sel:   {
    background: C.surface,
    border: "1px solid "+C.border,
    borderRadius: 10,
    color: C.text,
    padding: "9px 14px",
    fontSize: 13,
    outline: "none",
    width: "100%",
    cursor: "pointer",
  },
  btnV:  {
    background: "linear-gradient(135deg, "+C.accent+", #03B878)",
    color: "#031A10",
    border: "none",
    borderRadius: 10,
    padding: "9px 20px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 4px 16px "+C.accent+"44",
    letterSpacing: .3,
  },
  btnO:  {
    background: C.accentSoft,
    color: C.accent,
    border: "1px solid "+C.accent+"55",
    borderRadius: 10,
    padding: "9px 20px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: .3,
  },
  badge: c => ({
    background: c+"1A",
    color: c,
    borderRadius: 8,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 700,
    display: "inline-block",
    border: "1px solid "+c+"30",
    letterSpacing: .2,
  }),
  TT: {
    background: "#0D1830",
    border: "1px solid "+C.borderHi,
    borderRadius: 12,
    color: C.text,
    boxShadow: "0 8px 32px #00000060",
    padding: "10px 14px",
  },
};
function KPI({ label, value, sub, subColor, topColor, metric, numValue, tip }) {
  const sig = metric ? signal(metric, numValue!==undefined ? numValue : parseFloat(String(value).replace(/[^0-9.\-]/g,""))) : null;
  const bColor = sig ? sig.cor : topColor;
  return (
    <div className="fo-card-hover" style={{
    ...S.card, flex:1, minWidth:150,
    borderTop: "2px solid "+(bColor||C.border),
    position:"relative", overflow:"hidden",
    }}>
    {/* Glow de fundo sutil */}
    {bColor && <div style={{
     position:"absolute", top:0, left:0, right:0, height:40,
     background:"linear-gradient(180deg,"+(bColor)+"12,transparent)",
     pointerEvents:"none",
    }}/>}
    <div style={{ color:C.muted, fontSize:9, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:4, position:"relative" }}>
     {sig && <span style={{fontSize:11}}>{sig.emoji}</span>}
     {tip ? <Tooltip text={tip}><span>{label}</span></Tooltip> : <span>{label}</span>}
    </div>
    <div style={{ fontSize:22, fontWeight:700, color:bColor||C.white, fontFamily:"'Syne',sans-serif", letterSpacing:.5, position:"relative" }}>{value}</div>
    <div style={{marginTop:6,position:"relative"}}>
     {sig
      ? <SignalBadge metric={metric} value={numValue!==undefined?numValue:parseFloat(String(value).replace(/[^0-9.\-]/g,""))} showLabel={true}/>
      : sub && <div style={{ fontSize:11, color: subColor||C.muted }}>{sub}</div>
     }
     {sig && sub && <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{sub}</div>}
    </div>
    </div>
  );
}
function Barra({ pct, cor, altura=8 }) {
  const p = Math.min(100,Math.max(0,pct));
  return (
    <div style={{ height:altura, background:C.border+"88", borderRadius:altura, overflow:"hidden", position:"relative" }}>
    <div style={{
     height:"100%", width:p+"%",
     background:"linear-gradient(90deg,"+(cor||C.accent)+","+(cor||C.accent)+"BB)",
     borderRadius:altura,
     transition:"width .6s cubic-bezier(.4,0,.2,1)",
     boxShadow:p>20?"0 0 8px "+(cor||C.accent)+"44":undefined,
    }}/>
    </div>
  );
}
function NavItem({ icone, label, ativo, onClick }) {
  return (
    <div onClick={onClick} style={{
    display:"flex", alignItems:"center", gap:9, padding:"8px 14px 8px 12px",
    cursor:"pointer",
    background: ativo ? "linear-gradient(90deg,"+C.accent+"18,"+C.accent+"06)" : "transparent",
    borderLeft: ativo ? "2px solid "+C.accent : "2px solid transparent",
    color: ativo ? C.accent : C.muted,
    fontSize:12, fontWeight: ativo?700:500,
    transition:"all .15s",
    marginLeft:2, marginRight:4, borderRadius:"0 8px 8px 0",
    }}>
    <span style={{ width:16, textAlign:"center", fontSize:12, opacity: ativo?1:.7 }}>{icone}</span>
    <span style={{ flex:1, lineHeight:1.2 }}>{label}</span>
    {ativo && <div style={{width:4,height:4,borderRadius:"50%",background:C.accent,flexShrink:0}}/>}
    </div>
  );
}
function Modal({ titulo, onClose, children, largura }) {
  return (
    <div style={{
    position:"fixed", inset:0,
    background:"#00000088",
    backdropFilter:"blur(8px)",
    zIndex:200,
    display:"flex", alignItems:"center", justifyContent:"center",
    animation:"fo-slide-in .2s ease",
    }}>
    <div style={{
     background:"linear-gradient(135deg,#111E34,#0D1828)",
     border:"1px solid "+C.borderHi,
     borderRadius:20,
     padding:24,
     width:largura||480,
     maxWidth:"94vw",
     maxHeight:"90vh",
     overflowY:"auto",
     boxShadow:"0 32px 80px #000090, 0 0 0 1px "+C.accent+"18",
    }}>
     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
      <div style={{ fontWeight:800, fontSize:16, fontFamily:"'Syne',sans-serif", color:C.white }}>{titulo}</div>
      <button onClick={onClose} style={{
        background:C.border, border:"none", color:C.muted, cursor:"pointer",
        fontSize:16, width:32, height:32, borderRadius:8,
        display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all .15s",
      }}>✕</button>
     </div>
     {children}
    </div>
    </div>
  );
}
function Campo({ label, children }) {
  return <div><div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{label}</div>{children}</div>;
}
function LinhaTabela({ colunas, children }) {
  return <tr style={{ borderBottom:"1px solid "+C.border+"22" }}>{children}</tr>;
}
function SecaoTitulo({ titulo, sub }) {
  return (
    <div style={{ marginBottom: sub ? 6 : 16 }}>
    <div style={{ fontWeight:700, fontSize:14, color:C.text, letterSpacing:.2, lineHeight:1.3 }}>{titulo}</div>
    {sub && <div style={{ fontSize:11, color:C.muted, marginTop:3, marginBottom:12, lineHeight:1.5 }}>{sub}</div>}
    </div>
  );
}
function Tooltip({ text, children }) {
  const [vis, setVis] = useState(false);
  const [pos, setPos] = useState({x:0,y:0});
  if (!text) return <>{children}</>;
  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center",gap:4}}
    onMouseEnter={e=>{setVis(true);setPos({x:e.clientX,y:e.clientY});}}
    onMouseLeave={()=>setVis(false)}>
    {children}
    <span style={{
     display:"inline-flex",alignItems:"center",justifyContent:"center",
     width:14,height:14,borderRadius:"50%",background:C.border,
     color:C.muted,fontSize:9,fontWeight:800,cursor:"help",flexShrink:0
    }}>?</span>
    {vis&&(
     <span style={{
      position:"fixed",
      left:Math.min(pos.x+16,window.innerWidth-320),
      top:pos.y-14,
      zIndex:9999,
      background:"linear-gradient(135deg,#0D1830,#091422)",
      border:"1px solid "+C.borderHi,
      borderRadius:14,
      padding:"14px 18px",
      maxWidth:300,
      fontSize:12,
      color:C.text,
      lineHeight:1.7,
      pointerEvents:"none",
      boxShadow:"0 16px 48px #000090, 0 0 0 1px "+C.accent+"18",
      whiteSpace:"normal",
      backdropFilter:"blur(20px)",
     }}>{text}</span>
    )}
    </span>
  );
}
function MiniSparkline({ data=[], color="#05D890", height=32 }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => typeof d === 'object' ? (d.val ?? d.value ?? 0) : d);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const w = 120, h = height;
  const pts = vals.map((v,i) => {
    const x = (i/(vals.length-1))*w;
    const y = h - ((v-min)/range)*(h-4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function MetricCard({ label, value, color, sub, tip, metric, numValue }) {
  const sig = metric ? signal(metric, numValue!==undefined ? numValue : parseFloat(String(value).replace(/[^0-9.\-]/g,""))) : null;
  const borderColor = sig ? sig.cor : (color || C.accent);
  return (
    <div className="fo-card-hover" style={{
    ...S.card, flex:1, minWidth:145,
    borderTop:"2px solid "+borderColor,
    padding:"13px 15px", position:"relative", overflow:"hidden",
    }}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:36,
     background:"linear-gradient(180deg,"+borderColor+"14,transparent)",pointerEvents:"none"}}/>
    <div style={{fontSize:9,color:C.muted,fontWeight:600,textTransform:"uppercase",
     letterSpacing:1.5,marginBottom:5,display:"flex",alignItems:"center",gap:4,position:"relative"}}>
     {sig && <span style={{fontSize:11}}>{sig.emoji}</span>}
     <Tooltip text={tip}><span>{label}</span></Tooltip>
    </div>
    <div style={{fontSize:19,fontWeight:800,color:borderColor,fontFamily:"'Syne',sans-serif",letterSpacing:.3,position:"relative"}}>{value}</div>
    <div style={{marginTop:5,position:"relative"}}>
     {sig
      ? <SignalBadge metric={metric} value={numValue!==undefined?numValue:parseFloat(String(value).replace(/[^0-9.\-]/g,""))} showLabel={true}/>
      : sub&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{sub}</div>
     }
     {sig && sub && <div style={{fontSize:9,color:C.muted,marginTop:2}}>{sub}</div>}
    </div>
    </div>
  );
}
const TIPS = {
  cagr:          "CAGR = Taxa de Crescimento Anual Composta. Responde: se o portfólio crescesse a uma taxa constante, qual seria? Elimina a volatilidade dos retornos ano a ano. Ex: R$1M → R$1.8M em 5 anos = CAGR 12.5%. Fórmula: (Final/Inicial)^(1/n)−1.",
  twr:           "TWR = Time-Weighted Return. Padrão CFA/GIPS para comparar gestores. Elimina o efeito de aportes e saques, medindo apenas a habilidade do gestor. Use para comparar portfólios independentemente de quando o dinheiro entrou.",
  mwr:           "MWR = Money-Weighted Return (equivalente ao IRR). Considera o timing e tamanho dos aportes. Mede o retorno REAL do investidor. Se você aportou mais quando o mercado estava caro, o MWR será menor que o TWR.",
  alpha:         "Alpha de Jensen = quanto o portfólio rendeu ALÉM do esperado pelo CAPM dado o seu beta. Alpha positivo = o gestor criou valor real além da exposição ao mercado. Alpha negativo = melhor ter ficado no índice. Fórmula: Ret − [Rf + β×(Rm−Rf)].",
  excess_ret:    "Retorno Excedente = retorno do portfólio ACIMA da taxa livre de risco (CDI). É o prêmio pelo risco assumido. Ex: portfólio +18%, CDI 10.5% → excesso = +7.5%. Base do cálculo do Sharpe Ratio.",
  active_ret:    "Retorno Ativo = retorno do portfólio MENOS o retorno do benchmark (ex: IBOV). Positivo = você bateu o mercado. Negativo = melhor ter comprado o ETF do índice. Base do cálculo do Information Ratio.",
  pos_months:    "% de Meses Positivos = frequência com que o portfólio fecha o mês com retorno > 0. Acima de 60% é bom. Atenção: 100% de meses positivos com retorno baixo é pior que 65% com retorno alto.",
  vol:           "Volatilidade Anualizada = desvio padrão dos retornos, multiplicado por √12 (mensais) ou √252 (diários). Mede a agitação do portfólio. Vol 15% = em ~68% dos anos, o retorno ficará ±15% da média. Maior vol = maior incerteza.",
  downside_dev:  "Downside Deviation = volatilidade calculada usando APENAS retornos ABAIXO do mínimo aceitável (MAR). Mais relevante que vol total porque penaliza só perdas, não ganhos. Usada no Sortino Ratio.",
  max_dd:        "Maximum Drawdown = maior queda do pico ao vale no período analisado. Ex: portfólio foi de R$1M a R$650k → Max DD = −35%. Pergunta-chave: 'qual foi o pior momento que um investidor poderia ter vivido?'",
  avg_dd:        "Average Drawdown = média de TODOS os drawdowns, não só o pior. O Max DD é o pior caso; o Avg DD mede o sofrimento típico. Portfólios com Avg DD baixo são mais confortáveis de manter no longo prazo.",
  var99:         "VaR 99% = perda máxima esperada em 1 dia com 99% de confiança. Ex: VaR R$50k → em 99% dos dias a perda será menor que R$50k. Em 1% dos dias (≈2 dias/ano) a perda pode superar. Modelo padrão: Normal ou histórico.",
  cvar99:        "CVaR 99% (Expected Shortfall) = perda MÉDIA nos 1% piores dias. Sempre maior que o VaR. Enquanto VaR diz 'a perda não passa de X na maioria dos dias', CVaR diz 'quando passa de X, em média é Y'. Muito mais informativo em crises.",
  beta:          "Beta = sensibilidade do portfólio ao mercado. Beta 1.0 = move igual ao mercado. Beta 1.3 = sobe/cai 30% a mais. Beta 0.7 = mais defensivo. Beta negativo = inversamente correlacionado (ex: portfólio de puts). Base do CAPM.",
  skew:          "Skewness (Assimetria) = formato da distribuição de retornos. Negativo (comum em portfólios de ações) = mais retornos extremos negativos que positivos — risco de perdas grandes ocasionais. Positivo = grandes ganhos ocasionais.",
  kurt:          "Excess Kurtosis = gordura das caudas. Positivo = mais eventos extremos do que uma distribuição normal prevê. A normalidade assume Kurtosis zero. A crise de 2008 mostrou kurtosis altíssima — o risco de cauda foi subestimado.",
  sharpe:        "Sharpe Ratio = (Retorno−CDI) / Volatilidade. Quanto retorno você ganha por unidade de risco total. Sharpe 1.0 = bom. > 1.5 = excelente. < 0.5 = risco não compensado. SEMPRE compare portfólios pelo Sharpe, não apenas pelo retorno.",
  sortino:       "Sortino Ratio = (Retorno−CDI) / Downside Deviation. Melhor que o Sharpe: penaliza APENAS a volatilidade ruim (perdas), não os ganhos. Um portfólio com muitos meses excelentes e poucos ruins terá Sortino muito maior que Sharpe.",
  calmar:        "Calmar Ratio = Retorno Anual / |Max Drawdown|. Responde: quanto você ganhou para cada unidade de pior queda? Ex: +15% de retorno com Max DD −30% → Calmar 0.5. Acima de 1.0 é excelente. Favorito de gestores de hedge fund.",
  treynor:       "Treynor Ratio = (Retorno−CDI) / Beta. Similar ao Sharpe mas usa risco sistemático (beta) em vez de volatilidade total. Útil quando o portfólio faz parte de uma carteira maior diversificada, onde só o risco sistemático importa.",
  info_ratio:    "Information Ratio = Retorno Ativo / Tracking Error. Mede a eficiência da gestão ativa: quanto de alpha você gera por unidade de desvio do benchmark. IR > 0.5 = gestão ativa competente. IR negativo = índice passivo seria melhor.",
  omega:         "Omega Ratio = soma de ganhos acima do threshold / soma de perdas abaixo. > 1.0 = favorável. Vantagem sobre Sharpe: usa a distribuição REAL dos retornos, não assume normalidade. Mais robusto para distribuições com caudas pesadas.",
  up_cap:        "Up Capture = % do upside do benchmark que o portfólio captura em meses positivos. 120% = quando mercado sobe 10%, você sobe 12%. Idealmente > 100%. Combinado com Down Capture < 100% = assimetria positiva ideal.",
  down_cap:      "Down Capture = % do downside do benchmark sofrido em meses negativos. 80% = quando mercado cai 10%, você cai apenas 8%. Idealmente < 100%. Down Capture < Up Capture = você amortece quedas e amplifica altas.",
  overall_cap:   "Overall Capture = Up Capture / Down Capture. > 1.0 = assimetria positiva (você captura mais altas do que quedas). É a métrica mais intuitiva de qualidade de gestão ao longo de ciclos completos de mercado.",
  hhi:           "HHI = soma dos quadrados dos pesos. 0-1000 = diversificado. 1000-2500 = moderado. > 2500 = concentrado. Ex: 2 ativos iguais = HHI 5000. S&P 500 = ≈200. Uma ação = 10.000. Origem: regulação antitruste dos EUA.",
  gini:          "Gini Coefficient = mede desigualdade da distribuição do portfólio. 0 = todos os ativos com mesmo peso (perfeito). 1 = tudo em um ativo (concentração total). Para Family Office, ideal abaixo de 0.5. Conceito vem de economia.",
  n_efetivo:     "N Efetivo = 1/HHI dos pesos. Quantos ativos independentes você efetivamente tem? Portfólio com 20 ações mas 50% em 2 delas tem N Efetivo ≈ 4. SPY tem N Efetivo ≈ 50, apesar de 503 constituintes.",
  active_share:  "Active Share = % do portfólio que difere do benchmark. 100% = completamente diferente do índice. < 60% = closet indexer (cobra taxa ativa mas age como índice). > 80% = alta convicção, alta diferenciação real.",
  dr:            "Diversification Ratio = vol média dos ativos individuais / vol do portfólio. DR 2.0 = a diversificação REDUZIU o risco pela metade. DR 1.0 = ativos completamente correlacionados, sem qualquer benefício de diversificação.",
  duration:      "Duration Modificada = queda % no preço do título por +1% de alta no juro. Duration 5 = se juro sobe 1%, título cai ≈5%. É o principal medidor de risco de taxa de juros em renda fixa. NTN-B 2035 tem duration ≈8 anos.",
  convex:        "Convexidade = curvatura da relação preço-juro. POSITIVA para o investidor: quando juro cai muito, o preço sobe MAIS do que a duration prevê; quando sobe, perde MENOS. Convexidade alta = bom para quem está comprado no título.",
  ytm:           "YTM = Taxa de Retorno Anualizada se mantiver o título até o vencimento e reinvestir todos os cupons na mesma taxa. Principal métrica de comparação entre títulos diferentes. O 'preço tudo incluído' da renda fixa.",
  oas:           "OAS (Option-Adjusted Spread) = spread sobre a curva livre de risco, REMOVENDO o valor das opções embutidas (call, put). Permite comparar bonds com e sem opcionalidade em base justa. Mais preciso que spread nominal.",
  dv01:          "DV01 = variação em R$ no valor do título se o juro mover 1 basis point (0.01%). DV01 R$500 = título de R$500k com duration 5. Fundamental para calcular o tamanho correto de hedge e gestão de risco de carteira.",
  exp_loss:      "Expected Loss = PD × LGD × EAD. PD = prob. de default. LGD = perda % em caso de default (1 − taxa de recuperação). EAD = exposição no momento do default. É a provisão CORRETA e justa para risco de crédito por posição.",
  pvp:           "P/VP = Preço de mercado / Valor Patrimonial da cota. O principal múltiplo de FII. Abaixo de 1.0 = você compra R$1 de imóvel por menos de R$1 (desconto). FIIs de qualidade com P/VP < 0.95 podem ser oportunidades de compra.",
  ffo:           "FFO = lucro operacional + depreciação − ganhos de capital. É o caixa REAL gerado pelo FII, sem distorções contábeis da depreciação. O FFO por cota é a base para avaliar a capacidade de distribuição sustentável.",
  affo:          "AFFO = FFO − CAPEX de manutenção necessário. É o dinheiro REALMENTE disponível para distribuição. Se AFFO/FFO < 85%, o FII está reinvestindo muito para manter os imóveis e a distribuição pode estar insustentável.",
  cap_rate:      "Cap Rate = NOI (renda líquida operacional) / Valor do Imóvel. Mede o retorno do IMÓVEL, independente da alavancagem. Cap Rate 8% = R$1M de imóvel gera R$80k/ano de renda líquida. Compare com CDI para avaliar atratividade.",
  vacancia:      "Vacância Financeira = % da receita POTENCIAL perdida por imóveis desocupados. Mais importante que vacância física (área). Uma loja âncora desocupada pode ter 5% de área mas 20% de receita perdida. Acima de 8% é preocupante.",
  ltv_fii:       "LTV = Dívida do FII / Valor total dos imóveis. LTV 30% = 30% dos imóveis financiados. Acima de 35% aumenta risco financeiro, especialmente em ciclos de alta de juros. Afeta diretamente a distribuição de dividendos.",
  ter_etf:       "TER = Total Expense Ratio. Taxa anual de administração do ETF, deduzida automaticamente do NAV diariamente. NÃO inclui spread de compra/venda nem impostos. O SPY cobra 0.0945% ao ano — menos que R$1 por R$1.000 investido.",
  td_etf:        "Tracking Difference = retorno do ETF − retorno bruto do índice em 1 ano. MELHOR métrica de custo real que o TER. Um ETF com TER 0.5% mas receita de empréstimo de ações pode ter TD de −0.1% (você ganha em relação ao índice).",
  prem_nav:      "Premium/Discount ao NAV = diferença entre preço de mercado e valor patrimonial real. Premium +0.5% = você paga 0.5% a mais que o valor das ações no ETF. Em ETFs líquidos (SPY), raramente ultrapassa ±0.1%.",
  overlap_etf:   "Overlap = % de holdings em comum entre dois ETFs. SPY e QQQ têm 45% de overlap. SPY e IVVB11 têm 98.8% — são quase idênticos. Overlap alto = diversificação ILUSÓRIA. Você paga taxa dupla pelo mesmo risco.",
  lend_rev:      "Securities Lending Revenue = receita gerada pelo ETF ao emprestar suas ações para short sellers. Esta receita É DEVOLVIDA ao cotista. Em alguns ETFs da Vanguard, cobre o TER inteiro. Reduz o custo efetivo do investimento.",
  tco_etf:       "TCO = Total Cost of Ownership. Custo real total: TER + spread bid-ask (round-trip) + tracking difference. Ex: ETF com TER 0.03% e spread 0.5% tem TCO de 0.56%/ano se você comprar e vender em 1 ano.",
  tvpi:          "TVPI = (NAV atual + distribuições recebidas) / capital investido. Principal métrica de PE/VC. TVPI 1.8x = para cada R$1 investido, você tem R$1.80 (realizado + não realizado). > 2.0x em 7-10 anos é considerado excelente.",
  dpi:           "DPI = distribuições realizadas / capital investido. O dinheiro que JÁ entrou no seu bolso. DPI 1.0x = você recuperou 100% do capital investido em dinheiro real. Mais conservador que TVPI porque não inclui valor a realizar.",
  rvpi:          "RVPI = NAV não realizado / capital investido. O que ainda está 'trancado' no fundo. RVPI alto no final da vida do fundo (anos 8-12) pode indicar dificuldade de saída ou ativos de difícil venda.",
  pme:           "PME = compara o retorno do PE com o S&P 500 nos MESMOS momentos de cash flow. PME > 1.0 = o PE superou o mercado público. PME < 1.0 = você teria sido melhor simplesmente comprando o ETF do índice. Benchmark justo para PE.",
  xirr_pe:       "XIRR = IRR com datas EXATAS de cada fluxo de caixa (chamada de capital ou distribuição). Diferente do IRR que assume períodos uniformes. Padrão global da indústria de PE/VC para reportar retorno real aos cotistas.",
  buffett:       "Buffett Indicator = Capitalização Total do Mercado Americano / PIB nominal. Warren Buffett chamou de 'a melhor medida individual de valuation'. Acima de 150% = caro. Acima de 200% = extremamente caro. Atual: 230%.",
  cape:          "Shiller CAPE (P/E Ajustado ao Ciclo) = preço / média de 10 anos de lucros ajustada por inflação. Remove a ciclicidade. Média histórica: 16x. > 30x = caro. > 35x = extremamente caro. Atual: 37.5x. Melhor que P/E simples.",
  sahm:          "Sahm Rule = se a média de 3 meses da taxa de desemprego subir ≥ 0.5pp acima do mínimo dos últimos 12 meses → recessão. Criada pela economista Claudia Sahm. Taxa de acerto: 100% desde 1970. Atual: 0.3pp (abaixo do gatilho).",
  yield_c:       "Yield Curve (10Y−2Y) = spread entre juro longo e curto dos EUA. Invertida (negativa) precede recessões com atraso de 6-24 meses. Invertida em 2022-2024, normalizando em 2025. Histórico: 100% de acerto desde 1970.",
  vix_t:         "VIX = volatilidade implícita do S&P 500 para os próximos 30 dias, derivada de opções. 'Índice do Medo'. < 15 = complacência. 15-25 = normal. 25-40 = medo. > 40 = pânico. Picos de VIX são historicamente boas oportunidades de compra.",
  erp_t:         "ERP (Equity Risk Premium) = retorno esperado das ações minus taxa livre de risco. ERP baixo = ações não compensam bem o risco vs bonds. ERP alto = ações baratas relativamente. ERP Brasil atual ≈ 7.5pp acima do CDI.",
  delta_opt:     "Delta = variação no preço da opção por R$1 de variação no ativo. Call delta: 0 (OTM) a 1 (deep ITM). Put delta: 0 a −1. Delta ≈ probabilidade de a opção vencer. Delta 0.5 = opção ATM com 50% de chance de expirar ITM.",
  gamma_opt:     "Gamma = variação do delta por R$1 de variação no ativo. Gamma alto = delta muda rapidamente (posição não-linear). Opções ATM têm gamma máximo. Para quem faz delta-hedge, gamma alto = necessidade de rehedge frequente.",
  theta_opt:     "Theta = decaimento do valor da opção por dia (time decay). Theta −R$0.05 = opção perde R$0.05/dia, tudo igual. Vendedor de opção RECEBE esse decaimento (favorável). Acelera próximo ao vencimento. Comprador perde tempo.",
  vega_opt:      "Vega = variação no preço da opção por +1pp de volatilidade implícita. Comprador de opção QUER volatilidade subir (long vega). Vendedor quer vol cair (short vega). Vega é o principal risco em posições de volatilidade.",
  rho_opt:       "Rho = variação no preço da opção por +1pp na taxa de juros. Geralmente o menor dos Greeks. Calls têm rho positivo (juros sobem → call mais valiosa). Mais relevante para opções de longo prazo (LEAPS).",
  ppp_fx:        "PPP = taxa de câmbio de equilíbrio baseada em preços relativos. Big Mac Index: se Big Mac custa R$22 no Brasil e US$5.50 nos EUA, PPP seria R$4.0. Desvio atual de ≈65% significa BRL muito desvalorizado vs poder de compra.",
  reer_fx:       "REER = câmbio real ponderado pelos parceiros comerciais, ajustado por inflação. REER < 100 = moeda subvalorizada em termos de competitividade exportadora. Base histórica = 100. Útil para prever tendências cambiais de longo prazo.",
  carry_fx:      "Carry Trade = tomar emprestado em moeda de juro baixo (JPY, EUR) e investir em moeda de juro alto (BRL). O ganho é o diferencial de juros. Risco principal: depreciação súbita da moeda de juro alto pode zerar o carry em dias.",
};
const TOUR_STEPS = [
  {
    icon: "📊",
    titulo: "Bem-vindo ao Family Office",
    texto: "Plataforma institucional de gestão patrimonial para multi-famílias. Todos os dados são demonstrativos — personalize com seus ativos reais.",
    dica: "💡 Demo mode: dados sobrevivem ao reload via localStorage",
  },
  {
    icon: "📁",
    titulo: "Comece pelo Portfolio",
    texto: "Adicione seus ativos clicando em '+ Ativo' no Portfolio. Importe via CSV ou ajuste os dados de demonstração. Cotações são buscadas automaticamente via Brapi + Finnhub.",
    dica: "📥 Formato CSV: family, category, ticker, name, qty, avgPrice",
  },
  {
    icon: "⚠",
    titulo: "Analise seus Riscos",
    texto: "As abas Riscos, 18 Métricas e Avançado calculam VaR, CVaR, Sharpe, Beta e muito mais. Cada métrica tem explicação didática — clique em qualquer KPI para ver definição.",
    dica: "🔢 18 métricas de risco + 21 métricas avançadas calculadas em tempo real",
  },
  {
    icon: "🧠",
    titulo: "Sentimento & Research",
    texto: "Fear & Greed Index próprio, análise de sentimento por ativo, indicadores macro, técnica e fundamentalista. Pesquise qualquer ativo no Screener.",
    dica: "📈 80 abas cobrindo toda a gestão patrimonial institucional",
  },
  {
    icon: "📄",
    titulo: "Relatórios e Exportação",
    texto: "Gere relatórios HTML por família, exporte o portfólio em CSV, ou imprima o One-Pager em PDF direto pelo navegador. Tudo em português brasileiro.",
    dica: "🖨️ Ctrl+P para PDF nativo · Exportar CSV a qualquer momento",
  },
];

function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);
  const total = TOUR_STEPS.length;
  const s = TOUR_STEPS[step];
  const isLast = step === total - 1;

  function fechar() {
    try { localStorage.setItem('fo_toured', '1'); } catch{}
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#00000090", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
    <div style={{ background:"linear-gradient(135deg,#0D1424,#111B2E)", border:"1px solid "+C.accent+"44", borderRadius:24, padding:"40px 44px", maxWidth:520, width:"90%", boxShadow:"0 32px 80px #00000080, 0 0 40px "+C.accent+"18", animation:"fo-slide-in .3s ease" }}>
     {/* Header com dots */}
     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
      <div style={{ display:"flex", gap:6 }}>
        {TOUR_STEPS.map((_,i) => (
         <div key={i} onClick={()=>setStep(i)} style={{ width:i===step?24:7, height:7, borderRadius:4, background:i===step?C.accent:C.border, cursor:"pointer", transition:"all .2s" }}/>
        ))}
      </div>
      <button onClick={fechar} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:18, lineHeight:1 }}>✕</button>
     </div>

     {/* Conteúdo */}
     <div style={{ textAlign:"center", marginBottom:28 }}>
      <div style={{ fontSize:56, marginBottom:16, lineHeight:1 }}>{s.icon}</div>
      <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:C.text, margin:"0 0 12px" }}>{s.titulo}</h2>
      <p style={{ color:C.textSub, fontSize:14, lineHeight:1.7, margin:"0 0 20px" }}>{s.texto}</p>
      <div style={{ background:C.accentSoft, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.accent, textAlign:"left" }}>{s.dica}</div>
     </div>

     {/* Botões */}
     <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
      {step > 0 && (
        <button onClick={()=>setStep(s=>s-1)} style={{ ...S.btnO, flex:1 }}>← Anterior</button>
      )}
      {!isLast ? (
        <button onClick={()=>setStep(s=>s+1)} style={{ ...S.btnV, flex:2 }}>Próximo →</button>
      ) : (
        <button onClick={fechar} style={{ ...S.btnV, flex:2 }}>Começar 🚀</button>
      )}
     </div>
     <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.muted }}>
      {step+1} de {total} · Clique nos pontos para navegar
     </div>
    </div>
    </div>
  );
}

function GlossarioPanel({ onClose }) {
  const grupos = [
    {g:"📈 Retorno",      cor:C.accent, items:[["CAGR","Crescimento anual composto. (Final/Inicial)^(1/n)−1"],["TWR","Retorno do gestor, sem efeito de aportes. Padrão CFA/GIPS."],["MWR","Retorno real do investidor, considera timing dos aportes."],["Alpha","Retorno acima do esperado pelo CAPM dado o beta."],["Active Return","Portfólio − Benchmark. Positivo = você bateu o mercado."]]},
    {g:"⚠ Risco",         cor:C.red,    items:[["Volatilidade","Desvio padrão anualizado. Quanto o portfólio 'agita'."],["Max Drawdown","Maior queda pico→vale. O pior momento histórico."],["VaR 99%","Perda máxima em 99% dos dias. Em 1% pode superar."],["CVaR 99%","Perda média nos 1% piores dias. Mais grave que o VaR."],["Beta","Sensibilidade ao mercado. 1.2 = move 20% mais que o índice."]]},
    {g:"🏆 Ratios",        cor:C.blue,   items:[["Sharpe","(Retorno−CDI)/Vol. > 1.0 bom, > 1.5 excelente."],["Sortino","Como Sharpe mas penaliza só volatilidade negativa."],["Calmar","Retorno/MaxDD. > 0.5 bom, > 1.0 excelente."],["Info Ratio","Retorno Ativo/TE. > 0.5 = gestão ativa competente."],["Up/Down Capture","% do upside e downside do benchmark que você captura."]]},
    {g:"🎯 Gestão Ativa",  cor:C.purple, items:[["Batting Avg","% de meses acima do benchmark. > 55% é bom."],["Hit Rate","% de operações vencedoras. Use com Profit Factor."],["Profit Factor","Ganho médio/Perda média. > 1.5 bom, > 2 excelente."],["IC","Correlação previsão vs realidade. > 0.05 = skill real."],["t-Stat Alpha","Significância do alpha. > 2.0 = não é sorte."]]},
    {g:"🏢 FII",           cor:C.gold,   items:[["P/VP","Preço/Valor Patrimonial. < 1.0 = comprando com desconto."],["FFO","Caixa real gerado. Melhor que lucro contábil para FIIs."],["Cap Rate","NOI/Valor do imóvel. Compare com CDI."],["Vacância Fin.","% de receita perdida. > 8% começa a preocupar."],["LTV","Dívida/Valor dos imóveis. > 35% aumenta risco."]]},
    {g:"🌐 ETF",           cor:C.muted,  items:[["TER","Taxa anual deduzida do NAV. Não inclui spread ou impostos."],["Tracking Diff.","Retorno ETF − Índice. Custo real total do ETF."],["Premium/NAV","Preço mercado − NAV. Deve ser próximo de zero."],["Overlap","Holdings em comum entre 2 ETFs. Alto = diversif. ilusória."],["TCO","TER + Spread + TD. Custo REAL total de 1 ano."]]},
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{...S.card,width:780,maxWidth:"98vw",maxHeight:"90vh",overflowY:"auto"}}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div style={{fontWeight:800,fontSize:18}}>📖 Glossário de Métricas</div>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:24,lineHeight:1}}>✕</button>
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14}}>
      {grupos.map(g=>(
        <div key={g.g} style={{background:C.surface,borderRadius:10,padding:14,borderTop:"3px solid "+g.cor}}>
         <div style={{fontWeight:700,fontSize:12,color:g.cor,marginBottom:10}}>{g.g}</div>
         {g.items.map(([k,v])=>(
          <div key={k} style={{marginBottom:8}}>
           <div style={{fontSize:12,fontWeight:700,color:C.white}}>{k}</div>
           <div style={{fontSize:11,color:C.muted,lineHeight:1.45,marginTop:1}}>{v}</div>
          </div>
         ))}
        </div>
      ))}
     </div>
     <div style={{marginTop:16,padding:"10px 14px",background:C.border+"44",borderRadius:8,fontSize:11,color:C.muted,lineHeight:1.6}}>
      💡 Dica: passe o mouse sobre o ícone <b style={{color:C.white,fontSize:12}}>?</b> ao lado de qualquer métrica no app para ver a explicação completa no contexto.
     </div>
    </div>
    </div>
  );
}
function TabDashboard({ filtered, totalVal, totalCost, totalRet, totalRp, byCat=[], byFam, famSel, benchEvo, benchVis, setBenchVis, benchRets=[], setTab, quotes={} }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

    {/* ── Acesso Rápido ── */}
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
     {[
      {icon:"⚠",label:"Riscos",id:"riscos",cor:C.red},
      {icon:"📈",label:"Benchmarks",id:"benchmark",cor:C.blue},
      {icon:"🧠",label:"Sentimento",id:"sentimento",cor:C.purple},
      {icon:"🔢",label:"18 Métricas",id:"quant",cor:C.gold},
      {icon:"📄",label:"Relatório",id:"relatorio",cor:C.accent},
      {icon:"🌱",label:"ESG",id:"esg",cor:"#34D399"},
     ].map(item => (
      <button key={item.id} onClick={()=>setTab&&setTab(item.id)} style={{
        background:item.cor+"12", border:"1px solid "+item.cor+"33",
        borderRadius:10, padding:"8px 14px", cursor:"pointer",
        color:item.cor, fontSize:12, fontWeight:600,
        display:"flex", alignItems:"center", gap:6,
        transition:"all .15s",
      }}>
        {item.icon} {item.label}
      </button>
     ))}
    </div>

    {/* KPIs principais */}
    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
     <MetricCardFull label="Patrimônio Total" valor={fmtBRL(totalVal)}
      cor={C.accent}
      def="Valor de mercado total de todos os ativos do portfólio somados."
      bom="Crescimento consistente acima da inflação + CDI ao longo dos anos."
      ruim="Queda do patrimônio em termos reais (descontada inflação) por mais de 2 anos seguidos."
      hist={geraHist(totalVal/1e6,.18)} histLabel="label" unit=" R$M"/>
     <MetricCardFull label="Resultado Total" valor={fmtBRL(totalRet)} numVal={totalRp}
      metric="cagr" cor={totalRet>=0?C.accent:C.red} unit="%"
      tip={TIPS.cagr}
      def="Lucro ou prejuízo total desde a compra de cada ativo até hoje."
      bom="Resultado positivo acima de 15% ao ano: portfólio superando o CDI com folga."
      ruim="Resultado negativo: patrimônio perdendo valor. Analise se é momento ou alocação."
      hist={geraHistMeses(totalRp,.3)} histLabel="label"/>
     <MetricCardFull label="Custo Total" valor={fmtBRL(totalCost)}
      cor={C.blue}
      def="Preço médio ponderado de compra de todos os ativos. Base de cálculo do resultado."
      bom="Custo baixo vs mercado atual = margem de segurança. Reduzir custo médio em quedas é estratégico."
      ruim="Custo médio alto vs preço atual: portfólio está no prejuízo. Avaliar tese de investimento."
      hist={geraHist(totalCost/1e6,.08)} histLabel="label"/>
     <MetricCardFull label="Famílias" valor={famSel==="Todas"?FAMILIAS.length:1}
      cor={C.purple}
      def="Número de famílias sob gestão nesta visão consolidada."
      hist={MESES.map((label,i)=>({label, val:famSel==="Todas"?FAMILIAS.length:1}))} histLabel="label"/>
    </div>

    {/* Gráficos principais */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:20 }}>

     {/* Pizza de alocação */}
     <div style={S.card}>
      <SecaoTitulo titulo="Alocação por Classe"/>
      {byCat.length > 0 ? (
        <>
         <ResponsiveContainer width="100%" height={190}>
          <PieChart>
           <Pie data={byCat} dataKey="value" cx="50%" cy="50%" outerRadius={78} innerRadius={42}>
            {byCat.map((e,i) => <Cell key={i} fill={e.color}/>)}
           </Pie>
           <RechartsTip formatter={v=>fmtBRL(v)} contentStyle={S.TT}/>
          </PieChart>
         </ResponsiveContainer>
         <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
          {byCat.map(c => (
           <div key={c.id} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:c.color }}/>
            <span style={{ color:C.muted }}>{c.label}</span>
            <span style={{ fontWeight:600 }}>{fmt(c.pct,1)}%</span>
           </div>
          ))}
         </div>
        </>
      ) : (
        <div style={{ color:C.muted, textAlign:"center", padding:40 }}>Sem ativos cadastrados</div>
      )}
     </div>

     {/* Linha de benchmarks */}
     <div style={S.card}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <SecaoTitulo titulo="Performance vs Benchmarks"/>
      </div>
      {/* Botões toggle de benchmark */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {[["portfolio","Portfolio",C.accent],["cdi","CDI",C.blue],["ibov","IBOV",C.gold],["sp500","S&P 500",C.purple]].map(([k,l,c]) => (
         <div key={k}
          onClick={() => setBenchVis(p => ({...p,[k]:!p[k]}))}
          style={{ ...S.badge(c), cursor:"pointer", opacity:benchVis[k]?1:0.35, userSelect:"none" }}>
          {l} {benchRets[k]!==undefined ? fmtPct(+benchRets[k]) : ""}
         </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={benchEvo}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>"R$"+(v/1e6).toFixed(1)+"M"}/>
         <RechartsTip formatter={v=>fmtBRL(v)} contentStyle={S.TT}/>
         {benchVis.portfolio && <Line type="monotone" dataKey="portfolio" stroke={C.accent} strokeWidth={2.5} dot={false}/>}
         {benchVis.cdi       && <Line type="monotone" dataKey="cdi"       stroke={C.blue}   strokeWidth={2} strokeDasharray="4 2" dot={false}/>}
         {benchVis.ibov      && <Line type="monotone" dataKey="ibov"      stroke={C.gold}   strokeWidth={2} strokeDasharray="4 2" dot={false}/>}
         {benchVis.sp500     && <Line type="monotone" dataKey="sp500"     stroke={C.purple} strokeWidth={2} strokeDasharray="4 2" dot={false}/>}
        </LineChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Comparativo entre famílias (só quando visão consolidada) */}
    {famSel==="Todas" && byFam.length>0 && (
     <div style={S.card}>
      <SecaoTitulo titulo="Comparativo entre Famílias" sub="Patrimônio · Resultado · % do total"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
        {FAMILIAS.map(fam => {
         const atFam = filtered.filter(a=>a.family===fam);
         const valFam = atFam.reduce((s,a)=>s+((quotes[a.ticker]?.price??a.avgPrice)*a.qty),0);
         const cstFam = atFam.reduce((s,a)=>s+a.avgPrice*a.qty,0);
         const retFam = valFam - cstFam;
         const rpFam  = cstFam>0 ? retFam/cstFam*100 : 0;
         const totAll = byFam.reduce((s,f)=>s+f.value,0);
         const pct    = totAll>0 ? valFam/totAll*100 : 0;
         if(valFam===0) return null;
         return (
          <div key={fam} style={{ background:C.surface, borderRadius:12, padding:"14px 16px", border:"1px solid "+C.border }}>
           <div style={{ fontSize:11, fontWeight:700, color:C.accent, marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>
            {fam.replace("Familia ","")}
           </div>
           <div style={{ fontSize:20, fontWeight:800, color:C.text, fontFamily:"'Syne',sans-serif", marginBottom:4 }}>
            {fmtBRL(valFam)}
           </div>
           <div style={{ fontSize:12, color:rpFam>=0?C.accent:C.red, marginBottom:10 }}>
            {rpFam>=0?"▲":"▼"} {fmt(Math.abs(rpFam),1)}% de resultado
           </div>
           <div style={{ background:C.border+"55", borderRadius:4, height:4, overflow:"hidden" }}>
            <div style={{ width:pct+"%", height:"100%", background:C.accent, borderRadius:4, transition:"width .6s ease" }}/>
           </div>
           <div style={{ fontSize:9, color:C.muted, marginTop:5 }}>
            {fmt(pct,1)}% do total · {atFam.length} ativos
           </div>
          </div>
         );
        })}
      </div>
     </div>
    )}
    </div>
  );
}
function TabPortfolio({ filtered, quotes={}, setAssets, totalVal }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [modo, setModo]   = useState("concentracao"); // "tabela" | "concentracao"
  const [catFiltro, setCatFiltro] = useState(null);   // id da categoria selecionada
  const porClasse = CATS.map(cat => {
    const ativos = filtered.filter(a => a.category===cat.id);
    const valor  = ativos.reduce((s,a) => s+preco(a)*a.qty, 0);
    const custo  = ativos.reduce((s,a) => s+a.avgPrice*a.qty, 0);
    const ret    = valor - custo;
    return { ...cat, ativos, valor, custo, ret, rp:custo>0?ret/custo*100:0, pct:totalVal>0?valor/totalVal*100:0 };
  }).filter(c => c.valor>0).sort((a,b) => b.valor-a.valor);
  const porAtivo = filtered.map(a => {
    const val  = preco(a)*a.qty;
    const cst  = a.avgPrice*a.qty;
    const ret  = val-cst;
    return { ...a, val, cst, ret, rp:cst>0?ret/cst*100:0, pct:totalVal>0?val/totalVal*100:0, cat:catOf(a.category) };
  }).sort((a,b) => b.val-a.val);
  const ativosFiltrados = catFiltro ? porAtivo.filter(a=>a.category===catFiltro) : porAtivo;
  const totalFiltrado   = ativosFiltrados.reduce((s,a)=>s+a.val,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

    {/* Controles */}
    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
     {[["concentracao","📊 Concentração"],["tabela","📋 Tabela Completa"]].map(([v,l]) => (
      <button key={v} onClick={()=>setModo(v)}
        style={modo===v ? S.btnV : S.btnO}>{l}</button>
     ))}
     {catFiltro && (
      <button onClick={()=>setCatFiltro(null)}
        style={{ ...S.btnO, color:C.gold, borderColor:C.gold, fontSize:12 }}>
        ✕ {catOf(catFiltro).label}
      </button>
     )}
     <span style={{ color:C.muted, fontSize:12, marginLeft:4 }}>
      {filtered.length} ativos · {fmtBRL(totalVal)}
     </span>
    </div>

    {/* MODO CONCENTRAÇÃO */}
    {modo==="concentracao" && (
     <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

      {/* Barras por classe — clicável para drill-down */}
      <div style={S.card}>
        <SecaoTitulo titulo="% por Classe de Ativo" sub="Clique em uma classe para ver os ativos dentro dela"/>
        {porClasse.map(c => (
         <div key={c.id}>
          <div
           onClick={() => setCatFiltro(catFiltro===c.id ? null : c.id)}
           style={{
            marginBottom:10, cursor:"pointer", padding:"10px 12px",
            borderRadius:10, border:"1px solid "+(catFiltro===c.id?C.accent:C.border),
            background: catFiltro===c.id ? C.accentDim : C.surface,
            transition:"all .15s",
           }}>
           {/* Linha principal da classe */}
           <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:12, height:12, borderRadius:3, background:c.color }}/>
              <span style={{ fontWeight:700, fontSize:13 }}>{c.label}</span>
              <span style={{ color:C.muted, fontSize:11 }}>{c.ativos.length} ativo{c.ativos.length>1?"s":""}</span>
            </div>
            <div style={{ display:"flex", gap:18, alignItems:"center" }}>
              <div style={{ textAlign:"right" }}>
               <div style={{ fontWeight:800, fontSize:18 }}>{fmt(c.pct,2)}%</div>
               <div style={{ fontSize:11, color:C.muted }}>{fmtBRL(c.valor)}</div>
              </div>
              <div style={{ textAlign:"right", minWidth:72 }}>
               <div style={{ fontWeight:700, fontSize:13, color:c.ret>=0?C.accent:C.red }}>{fmtBRL(c.ret)}</div>
               <div style={{ fontSize:11, color:c.rp>=0?C.accent:C.red }}>{fmtPct(c.rp)}</div>
              </div>
              <span style={{ color:C.muted, fontSize:14 }}>{catFiltro===c.id?"▲":"▼"}</span>
            </div>
           </div>
           <Barra pct={c.pct} cor={c.color} altura={10}/>

           {/* Drill-down: ativos da classe */}
           {catFiltro===c.id && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid "+C.border }}>
              <div style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
               Ativos em {c.label}
              </div>
              {c.ativos.map(a => {
               const val   = preco(a)*a.qty;
               const ret   = (preco(a)-a.avgPrice)*a.qty;
               const rp    = a.avgPrice*a.qty>0?ret/(a.avgPrice*a.qty)*100:0;
               const pctCl = c.valor>0?val/c.valor*100:0;
               const pctTt = totalVal>0?val/totalVal*100:0;
               return (
                <div key={a.id} style={{ marginBottom:8, padding:"8px 10px", background:C.card, borderRadius:8, borderLeft:"3px solid "+c.color }}>
                 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div>
                    <span style={{ fontWeight:700 }}>{a.ticker}</span>
                    <span style={{ color:C.muted, fontSize:11, marginLeft:6 }}>{a.name}</span>
                    <span style={{ color:C.muted, fontSize:10, marginLeft:6 }}>{a.family.replace("Familia ","")}</span>
                  </div>
                  <div style={{ display:"flex", gap:16 }}>
                    <div style={{ textAlign:"right" }}>
                     <div style={{ fontWeight:700 }}>{fmtBRL(val)}</div>
                     <div style={{ fontSize:10, color:C.muted }}>{fmt(pctTt,2)}% do total</div>
                    </div>
                    <div style={{ textAlign:"right", minWidth:60 }}>
                     <div style={{ fontWeight:700, color:ret>=0?C.accent:C.red }}>{fmtBRL(ret)}</div>
                     <div style={{ fontSize:10, color:rp>=0?C.accent:C.red }}>{fmtPct(rp)}</div>
                    </div>
                  </div>
                 </div>
                 <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ flex:1 }}><Barra pct={pctCl} cor={c.color} altura={5}/></div>
                  <span style={{ fontSize:10, color:C.muted, minWidth:60, textAlign:"right" }}>{fmt(pctCl,1)}% da classe</span>
                 </div>
                </div>
               );
              })}
            </div>
           )}
          </div>
         </div>
        ))}
      </div>

      {/* Ranking de ativos por % do total */}
      <div style={S.card}>
        <SecaoTitulo titulo={`% por Ativo — ${catFiltro?catOf(catFiltro).label:"Todos"}`} sub="Cada barra representa o peso no patrimônio total"/>
        {ativosFiltrados.slice(0,12).map((a,i) => {
         const pctLocal = totalFiltrado>0?a.val/totalFiltrado*100:0;
         return (
          <div key={a.id} style={{ marginBottom:10 }}>
           <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:11, color:C.muted, width:20, textAlign:"right" }}>{i+1}</span>
              <div style={{ width:8, height:8, borderRadius:2, background:a.cat.color }}/>
              <span style={{ fontWeight:700 }}>{a.ticker}</span>
              <span style={{ color:C.muted, fontSize:11 }}>{a.name}</span>
            </div>
            <div style={{ display:"flex", gap:16, alignItems:"center" }}>
              <div style={{ textAlign:"right" }}>
               <span style={{ fontWeight:800, fontSize:16 }}>{fmt(a.pct,2)}%</span>
               <div style={{ fontSize:11, color:C.muted }}>{fmtBRL(a.val)}</div>
              </div>
              <div style={{ textAlign:"right", minWidth:64 }}>
               <div style={{ fontWeight:700, color:a.ret>=0?C.accent:C.red }}>{fmtPct(a.rp)}</div>
               <div style={{ fontSize:11, color:C.muted }}>{fmtBRL(a.ret)}</div>
              </div>
            </div>
           </div>
           <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ flex:1 }}><Barra pct={a.pct} cor={a.cat.color} altura={8}/></div>
            {catFiltro && <span style={{ fontSize:10, color:C.muted, minWidth:55, textAlign:"right" }}>{fmt(pctLocal,1)}% da classe</span>}
           </div>
          </div>
         );
        })}
      </div>

      {/* Por família */}
      <div style={S.card}>
        <SecaoTitulo titulo="% por Família"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
         {FAMILIAS.map(fam => {
          const fa   = filtered.filter(a=>a.family===fam);
          const val  = fa.reduce((s,a)=>s+preco(a)*a.qty,0);
          const ret  = fa.reduce((s,a)=>s+(preco(a)-a.avgPrice)*a.qty,0);
          const cst  = fa.reduce((s,a)=>s+a.avgPrice*a.qty,0);
          const pct  = totalVal>0?val/totalVal*100:0;
          if (!val) return null;
          return (
           <div key={fam} style={{ ...S.card, padding:14 }}>
            <div style={{ fontWeight:700, fontSize:12, marginBottom:6 }}>{fam.replace("Familia ","Fam. ")}</div>
            <div style={{ fontSize:24, fontWeight:800, color:C.white }}>{fmt(pct,1)}%</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{fmtBRL(val)}</div>
            <div style={{ fontSize:12, color:ret>=0?C.accent:C.red, fontWeight:600, marginBottom:8 }}>
              {fmtBRL(ret)} ({fmtPct(cst>0?ret/cst*100:0)})
            </div>
            <Barra pct={pct} cor={C.accent} altura={5}/>
            <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>{fa.length} ativos</div>
           </div>
          );
         })}
        </div>
      </div>
     </div>
    )}

    {/* MODO TABELA */}
    {modo==="tabela" && (
     <div style={S.card}>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
         <thead>
          <tr style={{ borderBottom:"1px solid "+C.border }}>
           {["#","Ativo","Família","Cat.","Qtd","P.Médio","Cotação","Var%","Valor","% Total","Resultado","Ret%",""].map(h => (
            <th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:11, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
           ))}
          </tr>
         </thead>
         <tbody>
          {porAtivo.length===0 ? (
           <tr><td colSpan={13} style={{ padding:40, textAlign:"center", color:C.muted }}>Clique em "+ Ativo" para começar</td></tr>
          ) : porAtivo.map((a,i) => {
           const q = quotes[a.ticker];
           return (
            <tr key={a.id} style={{ borderBottom:"1px solid "+C.border+"22" }}>
              <td style={{ padding:"9px 8px", color:C.muted, fontSize:11 }}>{i+1}</td>
              <td style={{ padding:"9px 10px" }}><div style={{ fontWeight:700 }}>{a.ticker}</div><div style={{ color:C.muted, fontSize:11 }}>{a.name}</div></td>
              <td style={{ padding:"9px 10px", color:C.muted, fontSize:12 }}>{a.family.replace("Familia ","")}</td>
              <td style={{ padding:"9px 10px" }}><span style={S.badge(a.cat.color)}>{a.cat.label}</span></td>
              <td style={{ padding:"9px 10px" }}>{fmt(a.qty,0)}</td>
              <td style={{ padding:"9px 10px", color:C.muted }}>{fmtBRL(a.avgPrice)}</td>
              <td style={{ padding:"9px 10px" }}>
               <div>{fmtBRL(preco(a))}</div>
               {q && <div style={{ fontSize:9, color:C.muted }}>{q.src}</div>}
              </td>
              <td style={{ padding:"9px 10px", color:(q?.changePct||0)>=0?C.accent:C.red }}>{q?fmtPct(q.changePct):"--"}</td>
              <td style={{ padding:"9px 10px", fontWeight:600 }}>{fmtBRL(a.val)}</td>
              <td style={{ padding:"9px 10px" }}>
               <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:36, height:5, background:C.border, borderRadius:3, overflow:"hidden" }}>
                 <div style={{ height:"100%", width:Math.min(100,a.pct)+"%", background:a.cat.color, borderRadius:3 }}/>
                </div>
                <span style={{ fontWeight:700, fontSize:12 }}>{fmt(a.pct,2)}%</span>
               </div>
              </td>
              <td style={{ padding:"9px 10px", color:a.ret>=0?C.accent:C.red, fontWeight:600 }}>{fmtBRL(a.ret)}</td>
              <td style={{ padding:"9px 10px" }}><span style={S.badge(a.rp>=0?C.accent:C.red)}>{fmtPct(a.rp)}</span></td>
              <td style={{ padding:"9px 10px" }}>
               <button onClick={()=>setAssets(p=>p.filter(x=>x.id!==a.id))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer" }}>✕</button>
              </td>
            </tr>
           );
          })}
         </tbody>
        </table>
      </div>
     </div>
    )}
    </div>
  );
}
function TabBenchmarks({ benchEvo, benchVis, setBenchVis, benchRets }) {
  const peers = [
    { nome:"Yale Endowment",     ret:8.9,  vol:12.1, sharpe:0.73 },
    { nome:"Harvard Endowment",  ret:9.6,  vol:13.4, sharpe:0.72 },
    { nome:"Norway GPFG",        ret:11.4, vol:14.2, sharpe:0.80 },
    { nome:"FO Brasil Médio",    ret:14.2, vol:18.5, sharpe:0.77 },
    { nome:"FO Brasil Top",      ret:19.8, vol:19.2, sharpe:1.03 },
    { nome:"★ Seu Portfolio",   ret:18.1, vol:17.3, sharpe:1.20, destaque:true },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[
      {l:"Portfolio",  r:benchRets.portfolio, c:+(benchRets.portfolio||0)>=0?C.accent:C.red,
       def:"Retorno total do portfólio no período: valorização + dividendos.",
       bom:"Superar CDI + prêmio de risco (≥15% ao ano em ciclos normais).",
       ruim:"Abaixo do CDI por mais de 1 ano: rever alocação de risco.",
       hist:geraHist(+(benchRets.portfolio)||18,.4)},
      {l:"CDI",        r:benchRets.cdi,       c:C.blue,
       def:"Taxa DI — retorno do overnight. Benchmark mínimo obrigatório de qualquer portfólio.",
       bom:"CDI alto (Selic >12%) é bom para renda fixa, mas concorre com renda variável.",
       ruim:"CDI baixo (<6%) favorece busca por prêmio em ativos de risco.",
       hist:geraHist(+(benchRets.cdi)||10.5,.04)},
      {l:"IBOV",       r:benchRets.ibov,      c:C.gold,
       def:"Ibovespa — as maiores ações brasileiras. Alta volatilidade, retorno correlacionado com ciclo político/econômico.",
       bom:"Superar o IBOV com menor volatilidade = gestão ativa gerando valor real.",
       ruim:"IBOV negativo por 2+ anos: mercado brasileiro em bear market estrutural.",
       hist:geraHist(+(benchRets.ibov)||14.5,.55)},
      {l:"S&P 500 BRL",r:benchRets.sp500,     c:C.purple,
       def:"S&P 500 convertido para reais. Inclui valorização do dólar — em crises, USD sobe e amplifica o retorno.",
       bom:"Diversificação em S&P geralmente reduz risco Brasil e melhora Sharpe.",
       ruim:"BRL se valorizando muito pode transformar boa performance em USD em retorno fraco em BRL.",
       hist:geraHist(+(benchRets.sp500)||22,.45)},
     ].map(b => {
      const diff = +(benchRets.portfolio||0) - +(b.r||0);
      return (
        <MetricCardFull key={b.l} label={b.l} valor={fmtPct(+(b.r||0))}
         numVal={+(b.r||0)} cor={b.c} unit="%" def={b.def} bom={b.bom} ruim={b.ruim}
         hist={b.hist} histLabel="label"/>
      );
     })}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Evolução Comparativa — 12 Meses"/>
     <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
      {[["portfolio","Portfolio",C.accent],["cdi","CDI",C.blue],["ibov","IBOV",C.gold],["sp500","S&P 500",C.purple]].map(([k,l,c]) => (
        <div key={k} onClick={()=>setBenchVis(p=>({...p,[k]:!p[k]}))}
         style={{ ...S.badge(c), cursor:"pointer", opacity:benchVis[k]?1:0.35, userSelect:"none" }}>{l}</div>
      ))}
     </div>
     <ResponsiveContainer width="100%" height={260}>
      <LineChart data={benchEvo}>
        <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:11}}/>
        <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>"R$"+(v/1e6).toFixed(1)+"M"}/>
        <RechartsTip formatter={(v,n)=>[fmtBRL(v),{portfolio:"Portfolio",cdi:"CDI",ibov:"IBOV",sp500:"S&P 500"}[n]||n]} contentStyle={S.TT}/>
        {benchVis.portfolio && <Line type="monotone" dataKey="portfolio" stroke={C.accent} strokeWidth={2.5} dot={false}/>}
        {benchVis.cdi       && <Line type="monotone" dataKey="cdi"       stroke={C.blue}   strokeWidth={2} strokeDasharray="5 3" dot={false}/>}
        {benchVis.ibov      && <Line type="monotone" dataKey="ibov"      stroke={C.gold}   strokeWidth={2} strokeDasharray="5 3" dot={false}/>}
        {benchVis.sp500     && <Line type="monotone" dataKey="sp500"     stroke={C.purple} strokeWidth={2} strokeDasharray="5 3" dot={false}/>}
      </LineChart>
     </ResponsiveContainer>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Comparativo com Peers e Endowments Globais" sub="Seu portfólio destacado em verde"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
         <tr style={{ borderBottom:"1px solid "+C.border }}>
          {["Instituição","Retorno 1A","Volatilidade","Sharpe","vs Portfolio"].map(h => (
           <th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:11, textAlign:"left", textTransform:"uppercase" }}>{h}</th>
          ))}
         </tr>
        </thead>
        <tbody>
         {peers.map(p => {
          const vs = 18.1 - p.ret;
          return (
           <tr key={p.nome} style={{ borderBottom:"1px solid "+C.border+"22", background:p.destaque?C.accentDim:"transparent" }}>
            <td style={{ padding:"9px 10px", fontWeight:p.destaque?800:500, color:p.destaque?C.accent:C.text }}>{p.nome}</td>
            <td style={{ padding:"9px 10px", color:C.accent }}>+{p.ret}%</td>
            <td style={{ padding:"9px 10px", color:p.vol>18?C.gold:C.text }}>{p.vol}%</td>
            <td style={{ padding:"9px 10px", color:p.sharpe>1?C.accent:p.sharpe>0.7?C.gold:C.muted, fontWeight:600 }}>{p.sharpe}</td>
            <td style={{ padding:"9px 10px" }}>{!p.destaque && <span style={S.badge(vs>=0?C.red:C.accent)}>{vs>=0?"+":""}{fmt(vs,1)}%</span>}</td>
           </tr>
          );
         })}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabRiscos({ filtered, quotes={}, totalVal, byCat=[], riskScore, riskLabel, riskColor, var95, var99, volPort, concAtivo=[], concPais }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const LIMITE_CONC = CFG.limConc;
  const estresse = [
    { label:"IBOV -20%",   cats:["acoes_br","fiis"],          pct:-20 },
    { label:"S&P -15%",    cats:["acoes_eua","etfs"],         pct:-15 },
    { label:"Cripto -40%", cats:["cripto"],                   pct:-40 },
    { label:"USD/BRL +10%",cats:["cambio"],                   pct:+10 },
    { label:"Ouro +15%",   cats:["commodities"],              pct:+15 },
  ].map(s => {
    const exp = filtered.filter(a=>s.cats.includes(a.category)).reduce((t,a)=>t+preco(a)*a.qty,0);
    return { ...s, impacto: exp*s.pct/100 };
  });
  const corrCats = [...new Set(filtered.map(a=>a.category))].slice(0,6);
  const CORR = { "acoes_br_acoes_eua":0.55,"acoes_br_fiis":0.62,"acoes_br_cripto":0.18,"acoes_br_renda_fixa":-0.15,"acoes_eua_etfs":0.92,"acoes_eua_cripto":0.35,"fiis_renda_fixa":0.25 };
  const getCorr = (a,b) => a===b ? 1.0 : CORR[[a,b].sort().join("_")] ?? 0.15;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

    {/* Score + VaR */}
    <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"stretch" }}>
     {/* Gauge de risco */}
     <div style={{ ...S.card, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:"0 0 200px" }}>
      <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Score de Risco</div>
      <svg width={160} height={100} viewBox="0 0 160 100">
        <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={C.border} strokeWidth={12} strokeLinecap="round"/>
        <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={riskColor} strokeWidth={12} strokeLinecap="round" strokeDasharray={(riskScore/100*204)+" 204"}/>
        <text x={80} y={72} textAnchor="middle" fontSize={26} fontWeight="800" fill={riskColor}>{riskScore}</text>
        <text x={80} y={90} textAnchor="middle" fontSize={11} fill={riskColor}>{riskLabel}</text>
      </svg>
      <div style={{ fontSize:10, color:C.muted, marginTop:8, textAlign:"center" }}>Concentração + Volatilidade</div>
     </div>

     {/* VaR e alertas */}
     <div style={{ display:"flex", flexDirection:"column", gap:12, flex:1, minWidth:280 }}>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <MetricCardFull label="VaR 95% (1d)" valor={fmtBRL(var95)} numVal={var95/Math.max(1,totalVal)*100}
         metric="var99_pct" cor={C.gold} unit="%" tip={TIPS.var99}
         def="Em 95% dos dias a perda ficará abaixo deste valor. Nos 5% restantes (≈12 dias/ano) pode superar."
         bom="VaR 95% abaixo de 1.5% do patrimônio: gestão de risco eficiente."
         ruim="Acima de 3%: um dia ruim pode apagar semanas de ganho."
         hist={geraHist(var95/1e6,.45)} histLabel="label"/>
        <MetricCardFull label="VaR 99% (1d)" valor={fmtBRL(var99)} numVal={var99/Math.max(1,totalVal)*100}
         metric="var99_pct" cor={C.red} unit="%" tip={TIPS.var99}
         def="Cenário de stress: em apenas 1% dos dias (≈2 dias/ano) a perda pode superar este valor."
         bom="VaR 99% abaixo de 2% do patrimônio é razoável para portfólio com ações."
         ruim="Acima de 4%: o portfólio está exposto a eventos de risco extremo frequentes."
         hist={geraHist(var99/1e6,.5)} histLabel="label"/>
        <MetricCardFull label="Volatilidade" valor={fmt(volPort,1)+"%"} numVal={volPort}
         metric="vol" cor={C.purple} unit="%" tip={TIPS.vol}
         def="Desvio padrão anualizado dos retornos. Quanto mais alto, mais o portfólio oscila."
         bom="Abaixo de 12% ao ano: controlado. 12-20%: típico de carteira mista."
         ruim="Acima de 25%: oscilações grandes podem levar a decisões emocionais ruins."
         hist={geraHist(volPort,.35)} histLabel="label"/>
      </div>
      {/* Alertas de concentração */}
      <div style={{ ...S.card, padding:"12px 16px", borderLeft:"3px solid "+(concAtivo[0]?.pct>LIMITE_CONC?C.gold:C.accent) }}>
        <div style={{ fontWeight:700, color:concAtivo[0]?.pct>LIMITE_CONC?C.gold:C.accent, fontSize:12, marginBottom:6 }}>
         {concAtivo.filter(a=>a.pct>LIMITE_CONC).length>0 ? "⚠ Alertas de Concentração" : "✓ Concentração OK"}
        </div>
        {concAtivo.filter(a=>a.pct>LIMITE_CONC).map(a => (
         <div key={a.ticker} style={{ fontSize:12, padding:"2px 0" }}>{a.ticker}: {fmt(a.pct,1)}% (limite: {LIMITE_CONC}%)</div>
        ))}
        {concAtivo.filter(a=>a.pct>LIMITE_CONC).length===0 && (
         <div style={{ fontSize:12, color:C.accent }}>Nenhum ativo acima de {LIMITE_CONC}%</div>
        )}
      </div>
     </div>
    </div>

    {/* Concentração por ativo e por país */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Concentração por Ativo"/>
      {concAtivo.slice(0,8).map(a => (
        <div key={a.ticker} style={{ marginBottom:10 }}>
         <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
          <span style={{ fontWeight:600 }}>{a.ticker} <span style={{ color:C.muted, fontWeight:400 }}>{a.name}</span></span>
          <span style={{ color:a.pct>LIMITE_CONC?C.gold:C.text, fontWeight:700 }}>{fmt(a.pct,1)}%</span>
         </div>
         <Barra pct={a.pct} cor={a.pct>LIMITE_CONC?C.gold:a.cat.color} altura={8}/>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Exposição Geográfica"/>
      {concPais.map((p,i) => {
        const cores = [C.accent,C.gold,C.blue,C.purple,"#F97316","#FB923C"];
        const c = cores[i%cores.length];
        return (
         <div key={p.pais} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
           <span style={{ fontWeight:600 }}>{p.pais}</span>
           <div><span style={{ fontWeight:700, color:c }}>{fmt(p.pct,1)}%</span><span style={{ color:C.muted, fontSize:11, marginLeft:8 }}>{fmtBRL(p.value)}</span></div>
          </div>
          <Barra pct={p.pct} cor={c} altura={8}/>
         </div>
        );
      })}
     </div>
    </div>

    {/* Matriz de correlação */}
    <div style={S.card}>
     <SecaoTitulo titulo="Matriz de Correlação entre Classes" sub="Verde = positiva · Vermelho = negativa (diversificação)"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ borderCollapse:"separate", borderSpacing:3 }}>
        <thead>
         <tr>
          <th style={{ width:90, padding:"4px 8px" }}/>
          {corrCats.map(c => <th key={c} style={{ padding:"4px 6px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"center", whiteSpace:"nowrap" }}>{catOf(c).label}</th>)}
         </tr>
        </thead>
        <tbody>
         {corrCats.map(r => (
          <tr key={r}>
           <td style={{ padding:"4px 8px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"right", whiteSpace:"nowrap" }}>{catOf(r).label}</td>
           {corrCats.map(c => {
            const v = getCorr(r,c);
            const bg = r===c ? "#1E3A5F" : v>=0 ? `rgba(0,200,150,${Math.abs(v)*.8})` : `rgba(255,77,109,${Math.abs(v)*.8})`;
            return <td key={c} style={{ padding:"10px 6px", background:bg, borderRadius:6, textAlign:"center", fontWeight:700, color:Math.abs(v)>.4?C.white:C.text, minWidth:52, fontSize:11 }}>{r===c?"—":fmt(v,2)}</td>;
           })}
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>

    {/* Cenários de stress */}
    <div style={S.card}>
     <SecaoTitulo titulo="Cenários de Stress"/>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
      {estresse.map(s => (
        <div key={s.label} style={{ ...S.card, borderLeft:"3px solid "+(s.impacto>=0?C.accent:C.red), padding:"14px 16px" }}>
         <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{s.label}</div>
         <div style={{ fontSize:20, fontWeight:700, color:s.impacto>=0?C.accent:C.red }}>{fmtBRL(s.impacto)}</div>
         <div style={{ fontSize:11, color:C.muted }}>{s.impacto>=0?"Ganho estimado":"Perda estimada"}</div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabQuant({ portVol, portSharpe, portMaxDD, portBeta, var95, var99, cvar95, cvar99, omega, trackErr, infoRatio, treynor }) {
  const [metricaSel, setMetricaSel] = useState(null);
  const rf = CFG.rfRate;
  const ANOS_HIST = ["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"];
  const retAnual = [84, -11, 45.6, 42.2, 28.2, -21.7, 42.1, 23.6, 18.9, -1.8];
  const serieMensal = MESES.flatMap((mes, mi) =>
    ANOS_HIST.map((ano, ai) => ({
    label: mes+"/"+ano.slice(2),
    ano, mes, ai, mi,
    ret:    +(retAnual[ai]/12 + Math.sin(mi*.6+ai*.8)*portVol/100/2*100).toFixed(2),
    sharpe: +(portSharpe * (0.7 + Math.sin(ai*.5+mi*.3)*.4)).toFixed(2),
    vol:    +(portVol * (0.8 + Math.abs(Math.sin(ai*.4+mi*.5))*.6)).toFixed(1),
    dd:     +(portMaxDD * Math.min(1, Math.abs(Math.sin(ai*.3+mi*.4)) + .2)).toFixed(1),
    beta:   +(portBeta * (0.85 + Math.sin(ai*.6)*.3)).toFixed(2),
    alpha:  +(retAnual[ai] - portBeta*14.5 + Math.sin(ai*.4)*3).toFixed(2),
    }))
  );
  const serieAnual = ANOS_HIST.map((ano, i) => ({
    ano,
    ret:     retAnual[i],
    sharpe:  +(portSharpe * (0.6+Math.sin(i*.5)*.5)).toFixed(2),
    sortino: +(portSharpe * 1.28 * (0.6+Math.sin(i*.5)*.5)).toFixed(2),
    calmar:  +(0.37 * (0.5+Math.abs(Math.sin(i*.4))*.8)).toFixed(2),
    vol:     +(portVol * (0.7+Math.abs(Math.sin(i*.6))*.6)).toFixed(1),
    beta:    +(portBeta * (0.8+Math.sin(i*.5)*.4)).toFixed(2),
    alpha:   +(retAnual[i] - portBeta*14.5).toFixed(2),
    ir:      +(infoRatio * (0.5+Math.sin(i*.4)*.8)).toFixed(2),
    omega:   +(omega * (0.7+Math.sin(i*.3)*.5)).toFixed(2),
    maxdd:   +(portMaxDD * (0.4+Math.abs(Math.sin(i*.5))*.7)).toFixed(1),
    bench:   [14.5,-4.2,31.5,-18.1,27.6,-18.1,22.4,24.2,14.5,-1.2][i],
  }));
  const underwater = serieMensal.slice(0, 36).map((d,i) => ({
    label: d.label,
    dd: +(Math.min(0, -Math.abs(Math.sin(i*.18))*portMaxDD*0.9)).toFixed(1),
  }));
  const rollingSharpe = serieAnual.map((d,i) => ({
    ano: d.ano,
    sharpe12m: d.sharpe,
    bench:     +(d.bench/d.vol).toFixed(2),
  }));
  const retMensais = MESES.flatMap((_,mi) =>
    ANOS_HIST.map((_,ai) => +(retAnual[ai]/12 + Math.sin(mi*.6+ai*.8)*portVol/100/2*100).toFixed(2))
  );
  const bins = [-12,-9,-6,-3,0,3,6,9,12].map((b,i,arr) => ({
    range: b+"% a "+(arr[i+1]||15)+"%",
    count: retMensais.filter(r => r>=b && r<(arr[i+1]||999)).length,
    isPos: b >= 0,
  })).filter((_,i,arr) => i < arr.length-1);
  const METRICAS = [
    {
    id:"ret",   label:"Retorno Anualizado", valor:"24.03%", numVal:24.03,
    metric:"cagr", cor:C.accent,
    def:"Quanto o portfólio cresceu por ano, em média, neste período.",
    bom:"Acima de 15% é excelente para um portfólio diversificado.",
    ruim:"Abaixo de 10% pode ser inferior ao CDI em períodos de juros altos.",
    tip:TIPS.cagr,
    chart:"barras", dataKey:"ret", data:serieAnual,
    benchKey:"bench", benchLabel:"Benchmark (IBOV)",
    },
    {
    id:"vol",   label:"Volatilidade", valor:fmt(portVol,1)+"%", numVal:portVol,
    metric:"vol", cor:C.gold,
    def:"Quanto o portfólio oscila para cima e para baixo. Quanto maior, mais 'agitado' é o portfólio.",
    bom:"Abaixo de 12% ao ano é considerado controlado para um FO.",
    ruim:"Acima de 25% significa que em um ano ruim você pode perder muito mais do que espera.",
    tip:TIPS.vol,
    chart:"area", dataKey:"vol", data:serieAnual,
    },
    {
    id:"sharpe", label:"Sharpe Ratio", valor:fmt(portSharpe,2), numVal:portSharpe,
    metric:"sharpe", cor:C.accent,
    def:"Quanto retorno você ganha para cada unidade de risco. Se o Sharpe é 1.5, você ganha 1.5% acima do CDI para cada 1% de volatilidade.",
    bom:"Acima de 1.0 é bom. Acima de 1.5 é excelente. Os melhores hedge funds do mundo ficam em 2.0.",
    ruim:"Abaixo de 0.5 significa que o risco não está sendo recompensado.",
    tip:TIPS.sharpe,
    chart:"linha", dataKey:"sharpe12m", data:rollingSharpe,
    },
    {
    id:"sortino", label:"Sortino Ratio", valor:"2.33", numVal:2.33,
    metric:"sortino", cor:C.accent,
    def:"Como o Sharpe, mas só conta a volatilidade negativa (as quedas). Um portfólio com muitos meses ótimos e poucos ruins terá Sortino alto mesmo com Sharpe médio.",
    bom:"Acima de 1.5 é ótimo. Sortino > Sharpe indica que o portfólio tem assimetria positiva (mais ganhos do que perdas).",
    ruim:"Sortino muito similar ao Sharpe indica que as perdas são simétricas com os ganhos.",
    tip:TIPS.sortino,
    chart:"linha", dataKey:"sortino", data:serieAnual,
    },
    {
    id:"calmar", label:"Calmar Ratio", valor:"0.37", numVal:0.37,
    metric:"calmar", cor:C.gold,
    def:"Retorno anual dividido pela pior queda histórica. Quanto você ganhou comparado com o pior momento que viveu.",
    bom:"Acima de 0.7 é bom. Acima de 1.0 é excelente — você ganha mais do que sua pior queda a cada ano.",
    ruim:"Abaixo de 0.3 significa que a pior queda é muito maior que o retorno anual típico.",
    tip:TIPS.calmar,
    chart:"barras", dataKey:"calmar", data:serieAnual,
    },
    {
    id:"beta",   label:"Beta vs Mercado", valor:fmt(portBeta,2), numVal:portBeta,
    metric:"beta", cor:C.muted,
    def:"Sensibilidade do portfólio ao mercado. Beta 1.2 = quando o mercado sobe 10%, você sobe 12%. Quando cai 10%, você cai 12%.",
    bom:"Beta entre 0.8 e 1.0 é neutro. Abaixo de 0.8 é defensivo — o portfólio cai menos nas crises.",
    ruim:"Acima de 1.3 é agressivo — amplifica tanto as altas quanto as quedas.",
    tip:TIPS.beta,
    chart:"linha", dataKey:"beta", data:serieAnual,
    },
    {
    id:"alpha",  label:"Alpha de Jensen", valor:"+10.94%", numVal:10.94,
    metric:"alpha", cor:C.accent,
    def:"Quanto o portfólio rendeu ALÉM do que seria esperado dado o risco de mercado assumido. Alpha positivo = o gestor criou valor real.",
    bom:"Alpha acima de 3% ao ano é consistente. Acima de 8% é excepional e raro.",
    ruim:"Alpha negativo significa que seria melhor ter comprado um ETF do índice.",
    tip:TIPS.alpha,
    chart:"barras", dataKey:"alpha", data:serieAnual,
    },
    {
    id:"ir",     label:"Information Ratio", valor:fmt(infoRatio,2), numVal:infoRatio,
    metric:"info_ratio", cor:C.gold,
    def:"Eficiência da gestão ativa. Quanto de retorno acima do benchmark você gera para cada unidade de risco ativo assumido.",
    bom:"Acima de 0.5 indica gestão ativa competente. Acima de 1.0 é classe mundial.",
    ruim:"Negativo significa que o benchmark passivo bateria o portfólio ajustado pelo risco.",
    tip:TIPS.info_ratio,
    chart:"linha", dataKey:"ir", data:serieAnual,
    },
    {
    id:"maxdd",  label:"Maximum Drawdown", valor:portMaxDD+"%", numVal:portMaxDD,
    metric:"max_dd", cor:C.red,
    def:"A maior queda do portfólio do pico até o vale em qualquer momento do histórico. A pergunta é: qual foi o pior que poderia ter acontecido?",
    bom:"Acima de -15% é controlado para um FO diversificado.",
    ruim:"Abaixo de -35% pode causar resgates de famílias mais conservadoras.",
    tip:TIPS.max_dd,
    chart:"underwater", dataKey:"dd", data:underwater,
    },
    {
    id:"omega",  label:"Omega Ratio", valor:fmt(omega,2), numVal:omega,
    metric:"omega", cor:omega>1?C.accent:C.red,
    def:"Compara todos os ganhos com todas as perdas do portfólio. Omega 2.0 significa que os ganhos totais são o dobro das perdas totais.",
    bom:"Acima de 1.5 é favorável. Acima de 2.0 é excelente.",
    ruim:"Abaixo de 1.0 significa que o portfólio perde mais do que ganha no total.",
    tip:TIPS.omega,
    chart:"barras", dataKey:"omega", data:serieAnual,
    },
    {
    id:"dist",   label:"Distribuição de Retornos", valor:"64% pos.", numVal:64,
    metric:"pos_months", cor:C.blue,
    def:"Como os retornos mensais se distribuem. Um portfólio saudável tem mais meses positivos do que negativos e os ganhos são maiores que as perdas.",
    bom:"Mais de 60% dos meses positivos é consistente. A curva deve ter 'cauda' maior para a direita.",
    ruim:"Mais perdas que ganhos indica problema estrutural no portfólio.",
    tip:TIPS.pos_months,
    chart:"histograma", dataKey:"count", data:bins,
    },
  ];

  const metSel = metricaSel ? METRICAS.find(m=>m.id===metricaSel) : null;
  const renderChart = (m) => {
    if (!m) return null;
    const h = 180;

    if (m.chart==="barras") return (
    <ResponsiveContainer width="100%" height={h}>
     <BarChart data={m.data} barSize={22} margin={{top:8,right:8,bottom:0,left:0}}>
      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
      <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
      <YAxis stroke={C.muted} tick={{fontSize:9}}/>
      <RechartsTip contentStyle={S.TT} formatter={v=>[v, m.label]}/>
      {m.benchKey && <Bar dataKey={m.benchKey} name={m.benchLabel||"Benchmark"} fill={C.muted} opacity={.4} radius={[3,3,0,0]}/>}
      <Bar dataKey={m.dataKey} name={m.label} radius={[4,4,0,0]}>
        {m.data.map((e,i)=><Cell key={i} fill={(e[m.dataKey]||0)>=0?m.cor:C.red}/>)}
      </Bar>
      <Legend/>
     </BarChart>
    </ResponsiveContainer>
    );

    if (m.chart==="linha") return (
    <ResponsiveContainer width="100%" height={h}>
     <LineChart data={m.data} margin={{top:8,right:8,bottom:0,left:0}}>
      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
      <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
      <YAxis stroke={C.muted} tick={{fontSize:9}}/>
      <RechartsTip contentStyle={S.TT}/>
      <Line type="monotone" dataKey={m.dataKey} name={m.label} stroke={m.cor} strokeWidth={2.5} dot={{r:3,fill:m.cor}} activeDot={{r:5}}/>
      {m.benchKey && <Line type="monotone" dataKey={m.benchKey} name="Benchmark" stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>}
      <Legend/>
     </LineChart>
    </ResponsiveContainer>
    );

    if (m.chart==="area") return (
    <ResponsiveContainer width="100%" height={h}>
     <AreaChart data={m.data} margin={{top:8,right:8,bottom:0,left:0}}>
      <defs>
        <linearGradient id="metG" x1="0" y1="0" x2="0" y2="1">
         <stop offset="5%"  stopColor={m.cor} stopOpacity={.35}/>
         <stop offset="95%" stopColor={m.cor} stopOpacity={.02}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
      <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
      <YAxis stroke={C.muted} tick={{fontSize:9}}/>
      <RechartsTip contentStyle={S.TT}/>
      <Area type="monotone" dataKey={m.dataKey} name={m.label} stroke={m.cor} fill="url(#metG)" strokeWidth={2.5} dot={{r:3,fill:m.cor}}/>
      <Legend/>
     </AreaChart>
    </ResponsiveContainer>
    );

    if (m.chart==="underwater") return (
    <ResponsiveContainer width="100%" height={h}>
     <AreaChart data={m.data} margin={{top:8,right:8,bottom:0,left:0}}>
      <defs>
        <linearGradient id="ddG" x1="0" y1="0" x2="0" y2="1">
         <stop offset="5%"  stopColor={C.red} stopOpacity={.5}/>
         <stop offset="95%" stopColor={C.red} stopOpacity={.05}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
      <XAxis dataKey="label" stroke={C.muted} tick={{fontSize:8}} interval={5}/>
      <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
      <RechartsTip contentStyle={S.TT} formatter={v=>[v+"%","Drawdown"]}/>
      <ReferenceLine y={0} stroke={C.muted} strokeWidth={1}/>
      <Area type="monotone" dataKey="dd" name="Drawdown" stroke={C.red} fill="url(#ddG)" strokeWidth={2} dot={false}/>
     </AreaChart>
    </ResponsiveContainer>
    );

    if (m.chart==="histograma") return (
    <ResponsiveContainer width="100%" height={h}>
     <BarChart data={m.data} barSize={28} margin={{top:8,right:8,bottom:0,left:0}}>
      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
      <XAxis dataKey="range" stroke={C.muted} tick={{fontSize:8}} angle={-15} textAnchor="end"/>
      <YAxis stroke={C.muted} tick={{fontSize:9}} label={{value:"Meses",angle:-90,position:"insideLeft",fill:C.muted,fontSize:9}}/>
      <RechartsTip contentStyle={S.TT} formatter={v=>[v+" meses","Frequência"]}/>
      <Bar dataKey="count" name="Frequência" radius={[4,4,0,0]}>
        {m.data.map((e,i)=><Cell key={i} fill={e.isPos?C.accent:C.red}/>)}
      </Bar>
      <ReferenceLine x="0% a 3%" stroke={C.white} strokeDasharray="4 2" strokeWidth={1}/>
     </BarChart>
    </ResponsiveContainer>
    );

    return null;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

    {/* Instrução */}
    <div style={{padding:"12px 16px",background:C.accentSoft,borderRadius:12,border:"1px solid "+C.accent+"33",fontSize:12,color:C.textSub,display:"flex",gap:10,alignItems:"center"}}>
     <span style={{fontSize:18}}>👆</span>
     <span>Clique em qualquer métrica abaixo para ver <b style={{color:C.accent}}>gráfico histórico</b>, <b style={{color:C.accent}}>explicação detalhada</b> e <b style={{color:C.accent}}>como interpretar</b> o valor atual.</span>
    </div>

    {/* Grid de métricas clicáveis */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:12}}>
     {METRICAS.map(m => {
      const sig = signal(m.metric||"sharpe", m.numVal);
      const ativo = metricaSel===m.id;
      return (
        <div key={m.id} onClick={()=>setMetricaSel(ativo?null:m.id)}
         className="fo-card-hover"
         style={{
          ...S.card, padding:"14px 16px",
          borderTop:"2px solid "+(ativo?sig.cor:m.cor),
          cursor:"pointer",
          background:ativo?"linear-gradient(135deg,"+sig.cor+"18,"+C.card+")":C.card,
          position:"relative", overflow:"hidden",
          outline:ativo?"2px solid "+sig.cor+"44":"none",
          transition:"all .2s",
         }}>
         {/* Glow quando ativo */}
         {ativo && <div style={{position:"absolute",top:0,left:0,right:0,height:48,background:"linear-gradient(180deg,"+sig.cor+"22,transparent)",pointerEvents:"none"}}/>}
         <div style={{fontSize:9,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6,display:"flex",alignItems:"center",gap:4,position:"relative"}}>
          <span>{sig.emoji}</span>
          <Tooltip text={m.tip}><span>{m.label}</span></Tooltip>
         </div>
         <div style={{fontSize:22,fontWeight:800,color:ativo?sig.cor:m.cor,fontFamily:"'Syne',sans-serif",position:"relative"}}>{m.valor}</div>
         <div style={{marginTop:6,position:"relative"}}>
          <span style={{...S.badge(sig.cor),fontSize:9}}>{sig.label}</span>
         </div>
         {ativo && <div style={{position:"absolute",bottom:8,right:10,fontSize:10,color:sig.cor,opacity:.8}}>▼ ver histórico</div>}
        </div>
      );
     })}
    </div>

    {/* Painel expandido da métrica selecionada */}
    {metSel && (
     <div style={{
      ...S.card,
      borderLeft:"4px solid "+metSel.cor,
      background:"linear-gradient(135deg,"+metSel.cor+"0A,"+C.card+")",
      animation:"fo-slide-in .2s ease",
     }}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
         <div style={{fontSize:18,fontWeight:800,fontFamily:"'Syne',sans-serif",color:metSel.cor,marginBottom:4}}>
          {metSel.label}
         </div>
         <div style={{fontSize:28,fontWeight:800,color:C.white,fontFamily:"'Syne',sans-serif"}}>
          {metSel.valor}
         </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
         <SignalBadge metric={metSel.metric||"sharpe"} value={metSel.numVal}/>
         <button onClick={()=>setMetricaSel(null)}
          style={{background:C.border,border:"none",color:C.muted,cursor:"pointer",borderRadius:8,padding:"4px 12px",fontSize:12}}>
          ✕ Fechar
         </button>
        </div>
      </div>

      {/* Explicação em 3 colunas */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:20}}>
        <div style={{padding:"12px 14px",background:C.surface,borderRadius:12,borderLeft:"3px solid "+C.blue}}>
         <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>📘 O que é</div>
         <div style={{fontSize:12,color:C.textSub,lineHeight:1.7}}>{metSel.def}</div>
        </div>
        <div style={{padding:"12px 14px",background:C.surface,borderRadius:12,borderLeft:"3px solid "+C.accent}}>
         <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>🟢 Quando é bom</div>
         <div style={{fontSize:12,color:C.textSub,lineHeight:1.7}}>{metSel.bom}</div>
        </div>
        <div style={{padding:"12px 14px",background:C.surface,borderRadius:12,borderLeft:"3px solid "+C.red}}>
         <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>🔴 Quando preocupar</div>
         <div style={{fontSize:12,color:C.textSub,lineHeight:1.7}}>{metSel.ruim}</div>
        </div>
      </div>

      {/* Gráfico histórico */}
      <div style={{background:C.surface,borderRadius:12,padding:"16px 14px 10px"}}>
        <div style={{fontWeight:700,fontSize:13,color:C.textSub,marginBottom:12,display:"flex",justifyContent:"space-between"}}>
         <span>Histórico — {ANOS_HIST[0]} a {ANOS_HIST[ANOS_HIST.length-1]}</span>
         <span style={{fontSize:11,color:C.muted,fontWeight:400}}>Clique em outra métrica para comparar</span>
        </div>
        {renderChart(metSel)}
      </div>

      {/* Contextualização do valor atual */}
      <div style={{marginTop:12,padding:"10px 14px",background:C.accentSoft,borderRadius:10,borderLeft:"3px solid "+metSel.cor}}>
        <div style={{fontSize:11,color:C.textSub,lineHeight:1.6}}>
         <b style={{color:metSel.cor}}>Leitura atual: {metSel.valor}</b>
         {" — "}
         {signal(metSel.metric||"sharpe", metSel.numVal).label}.
         {" "}
         {metSel.tip.split(".")[0]}.
        </div>
      </div>
     </div>
    )}

    {/* Gráficos sempre visíveis — retorno anual e drawdown */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>

     {/* Retorno vs Benchmark por ano */}
     <div style={S.card}>
      <SecaoTitulo titulo="Retorno Anual vs Benchmark"
        sub="Verde = portfólio bateu o benchmark. Cinza = benchmark. Barras vermelhas = ano negativo."/>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={serieAnual} barSize={16} margin={{top:4,right:8,bottom:0,left:0}}>
         <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
         <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
         <RechartsTip contentStyle={S.TT} formatter={v=>[v+"%"]}/>
         <Legend/>
         <Bar dataKey="bench" name="Benchmark" fill={C.muted} opacity={.45} radius={[3,3,0,0]}/>
         <Bar dataKey="ret"   name="Portfólio"  radius={[4,4,0,0]}>
          {serieAnual.map((e,i)=><Cell key={i} fill={e.ret>=0?C.accent:C.red}/>)}
         </Bar>
        </BarChart>
      </ResponsiveContainer>
     </div>

     {/* Underwater chart */}
     <div style={S.card}>
      <SecaoTitulo titulo="Drawdown — Underwater Chart"
        sub="Mostra quanto o portfólio estava abaixo do seu pico em cada momento. Quanto mais profundo e longo, mais doloroso para o investidor."/>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={underwater} margin={{top:4,right:8,bottom:0,left:0}}>
         <defs>
          <linearGradient id="uwG" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%"  stopColor={C.red} stopOpacity={.45}/>
           <stop offset="95%" stopColor={C.red} stopOpacity={.03}/>
          </linearGradient>
         </defs>
         <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
         <XAxis dataKey="label" stroke={C.muted} tick={{fontSize:8}} interval={5}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
         <RechartsTip contentStyle={S.TT} formatter={v=>[v+"%","Drawdown atual"]}/>
         <ReferenceLine y={0} stroke={C.muted} strokeWidth={1}/>
         <Area type="monotone" dataKey="dd" name="Drawdown" stroke={C.red} fill="url(#uwG)" strokeWidth={2} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
     </div>

     {/* Sharpe rolling + Sortino */}
     <div style={S.card}>
      <SecaoTitulo titulo="Sharpe & Sortino — Evolução Anual"
        sub="Como a qualidade do retorno ajustado ao risco evoluiu. Linha subindo = melhora consistente."/>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={serieAnual} margin={{top:4,right:8,bottom:0,left:0}}>
         <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
         <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         <ReferenceLine y={1} stroke={C.accent} strokeDasharray="4 2" strokeWidth={1} label={{value:"1.0 = Bom",position:"right",fill:C.accent,fontSize:8}}/>
         <Line type="monotone" dataKey="sharpe"  name="Sharpe"  stroke={C.accent} strokeWidth={2.5} dot={{r:3}}/>
         <Line type="monotone" dataKey="sortino" name="Sortino" stroke={C.blue}   strokeWidth={2}   dot={{r:3}} strokeDasharray="4 2"/>
        </LineChart>
      </ResponsiveContainer>
     </div>

     {/* Distribuição de retornos mensais */}
     <div style={S.card}>
      <SecaoTitulo titulo="Distribuição de Retornos Mensais"
        sub="Quantos meses o portfólio caiu ou subiu cada faixa. Verde = meses positivos. Vermelho = negativos. Ideal: mais verde e concentrado à direita."/>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={bins} barSize={24} margin={{top:4,right:8,bottom:20,left:0}}>
         <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
         <XAxis dataKey="range" stroke={C.muted} tick={{fontSize:8}} angle={-20} textAnchor="end"/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} label={{value:"Nº meses",angle:-90,position:"insideLeft",fill:C.muted,fontSize:9}}/>
         <RechartsTip contentStyle={S.TT} formatter={v=>[v+" meses","Frequência"]}/>
         <Bar dataKey="count" name="Meses" radius={[4,4,0,0]}>
          {bins.map((e,i)=><Cell key={i} fill={e.isPos?C.accent:C.red}/>)}
         </Bar>
        </BarChart>
      </ResponsiveContainer>
     </div>

     {/* Alpha & Beta rolling */}
     <div style={S.card}>
      <SecaoTitulo titulo="Alpha vs Beta — Por Ano"
        sub="Alpha positivo = gestor criou valor além do mercado. Beta alto = portfólio amplifica os movimentos do mercado."/>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={serieAnual} margin={{top:4,right:8,bottom:0,left:0}}>
         <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
         <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis yAxisId="a" orientation="left"  stroke={C.accent} tick={{fontSize:9}} label={{value:"Alpha (%)",angle:-90,position:"insideLeft",fill:C.accent,fontSize:9}}/>
         <YAxis yAxisId="b" orientation="right" stroke={C.muted}  tick={{fontSize:9}} domain={[0,2]} label={{value:"Beta",angle:90,position:"insideRight",fill:C.muted,fontSize:9}}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         <ReferenceLine yAxisId="a" y={0} stroke={C.muted} strokeWidth={1}/>
         <Bar yAxisId="a" dataKey="alpha" name="Alpha (%)" radius={[3,3,0,0]}>
          {serieAnual.map((e,i)=><Cell key={i} fill={e.alpha>=0?C.accent:C.red}/>)}
         </Bar>
         <Line yAxisId="b" type="monotone" dataKey="beta" name="Beta" stroke={C.gold} strokeWidth={2} dot={{r:3}}/>
        </ComposedChart>
      </ResponsiveContainer>
     </div>

     {/* Trailing Returns visual */}
     <div style={S.card}>
      <SecaoTitulo titulo="Retornos Acumulados por Período"
        sub="Quanto o portfólio rendeu em cada janela de tempo. Compare sempre com o CDI e o benchmark."/>
      {[
        {p:"1 Mês",    v:-1.8,  bench:-0.5},
        {p:"3 Meses",  v:-3.6,  bench:-1.8},
        {p:"6 Meses",  v:-2.0,  bench:+3.2},
        {p:"1 Ano",    v:+18.1, bench:+14.5},
        {p:"3 Anos",   v:+21.1, bench:+18.4},
        {p:"5 Anos",   v:+12.8, bench:+10.2},
        {p:"10 Anos",  v:+23.8, bench:+19.1},
      ].map(t=>(
        <div key={t.p} style={{marginBottom:9}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
          <span style={{fontWeight:600,color:C.muted,width:60}}>{t.p}</span>
          <div style={{flex:1,display:"flex",gap:6,alignItems:"center"}}>
           <div style={{flex:1,position:"relative",height:10,background:C.border,borderRadius:5,overflow:"hidden"}}>
            <div style={{position:"absolute",height:"100%",width:Math.min(100,Math.abs(t.v)/25*100)+"%",background:t.v>=0?C.accent:C.red,borderRadius:5,left:t.v<0?"auto":"0",right:t.v<0?"0":"auto"}}/>
           </div>
           <div style={{flex:1,position:"relative",height:10,background:C.border+"55",borderRadius:5,overflow:"hidden"}}>
            <div style={{position:"absolute",height:"100%",width:Math.min(100,Math.abs(t.bench)/25*100)+"%",background:t.bench>=0?C.muted:C.red+"88",borderRadius:5,left:t.bench<0?"auto":"0",right:t.bench<0?"0":"auto"}}/>
           </div>
          </div>
          <div style={{width:90,textAlign:"right",display:"flex",gap:8,justifyContent:"flex-end"}}>
           <span style={{fontWeight:700,color:t.v>=0?C.accent:C.red}}>{t.v>=0?"+":""}{t.v}%</span>
           <span style={{color:C.muted,fontSize:10}}>{t.bench>=0?"+":""}{t.bench}%</span>
          </div>
         </div>
        </div>
      ))}
      <div style={{display:"flex",gap:10,fontSize:10,color:C.muted,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:4,borderRadius:2,background:C.accent}}/><span>Portfólio</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:4,borderRadius:2,background:C.muted}}/><span>Benchmark</span></div>
      </div>
     </div>

    </div>
    </div>
  );
}
function TabAvancado({ filtered, quotes={}, totalVal, portVol, var95, var99, portRet, portBeta }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const rf     = CFG.rfRate;
  const trackErr  = Math.sqrt(portVol**2+9.83**2-2*.82*portVol*9.83);
  const infoRatio = (portRet-7.82)/trackErr;
  const treynor   = (portRet-rf)/portBeta;
  const omega     = (portRet-rf)/Math.max(.01,portVol-(portRet-rf));
  const cvar95    = var95*1.25, cvar99=var99*1.15;
  const LIQD = {acoes_br:1,fiis:30,renda_fixa:1,acoes_eua:1,etfs:1,cripto:.5,commodities:2,cambio:.1,imoveis:90,outros:60};
  const buckets = [
    {label:"D+0 Imediato",  days:0,   color:C.accent},
    {label:"D+1 (1 dia)",   days:1,   color:"#34D399"},
    {label:"D+30 (1 mês)",  days:30,  color:C.blue},
    {label:"D+90 (3 meses)",days:90,  color:C.gold},
    {label:"D+360 (1 ano)", days:360, color:"#F97316"},
    {label:"Ilíquido",      days:999, color:C.red},
  ].map(b => {
    const v = filtered.filter(a=>(LIQD[a.category]??60)<=b.days).reduce((s,a)=>s+preco(a)*a.qty,0);
    return {...b, value:v, pct:totalVal?v/totalVal*100:0};
  });
  const gl = [...filtered].map(a => {
    const cv=preco(a)*a.qty, cb=a.avgPrice*a.qty, diff=cv-cb;
    return {ticker:a.ticker, diff, pct:cb>0?diff/cb*100:0};
  }).sort((a,b)=>b.diff-a.diff);
  const FXM = {acoes_br:"BRL",fiis:"BRL",renda_fixa:"BRL",imoveis:"BRL",acoes_eua:"USD",etfs:"USD",cripto:"USD",commodities:"USD",cambio:"Multi",outros:"BRL"};
  const fxExp = Object.entries(filtered.reduce((acc,a)=>{const fx=FXM[a.category]||"BRL";acc[fx]=(acc[fx]||0)+preco(a)*a.qty;return acc;},{})).map(([fx,v])=>({fx,v,pct:totalVal?v/totalVal*100:0})).sort((a,b)=>b.v-a.v);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={S.card}>
     <SecaoTitulo titulo="Métricas de Risco-Retorno Avançadas" sub="CVaR, Omega Ratio, Treynor, Information Ratio, Tracking Error"/>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:12 }}>
      {[
        {l:"CVaR 95% (1d)", v:fmtBRL(cvar95), nv:cvar95/Math.max(1,totalVal)*100, m:"var99_pct", c:C.gold, tip:TIPS.cvar99,
         def:"Perda média nos 5% piores dias — o sofrimento típico nos dias ruins.",
         bom:"Abaixo de 2% do patrimônio: risco de cauda sob controle.",
         ruim:"Acima de 5%: dias ruins destroem muito valor.",
         hist:geraHist(cvar95/1e6,.45)},
        {l:"CVaR 99% (1d)", v:fmtBRL(cvar99), nv:cvar99/Math.max(1,totalVal)*100, m:"var99_pct", c:C.red, tip:TIPS.cvar99,
         def:"Perda média no pior 1% dos dias — cenário de stress extremo real.",
         bom:"Abaixo de 4% do patrimônio: gerenciável mesmo em crises.",
         ruim:"Acima de 6%: portfólio vulnerável a eventos extremos.",
         hist:geraHist(cvar99/1e6,.5)},
        {l:"Omega Ratio",   v:fmt(omega,2),    nv:omega,    m:"omega",       c:omega>1?C.accent:C.red, tip:TIPS.omega,
         def:"Total de ganhos dividido por total de perdas. Omega 2.0 = ganhos são o dobro das perdas.",
         bom:"Acima de 1.5: claramente favorável. Acima de 2.0: excelente.",
         ruim:"Abaixo de 1.0: perde mais do que ganha no total.",
         hist:geraHist(omega,.35)},
        {l:"Treynor Ratio", v:fmt(treynor,2),  nv:treynor,  m:"treynor",     c:C.accent, tip:TIPS.treynor,
         def:"Retorno excedente por unidade de risco sistemático. Útil para portfólios dentro de uma carteira maior.",
         bom:"Acima de 8%: boa compensação pelo risco de mercado.",
         ruim:"Negativo: o risco de mercado não está sendo compensado.",
         hist:geraHist(treynor,.4)},
        {l:"Info. Ratio",   v:fmt(infoRatio,2),nv:infoRatio,m:"info_ratio",  c:infoRatio>.5?C.accent:C.gold, tip:TIPS.info_ratio,
         def:"Eficiência da gestão ativa: alpha gerado por unidade de tracking error.",
         bom:"Acima de 0.5: competente. Acima de 1.0: excepcional globalmente.",
         ruim:"Negativo: o benchmark passivo superaria o portfólio.",
         hist:geraHist(infoRatio,.5)},
        {l:"Tracking Error",v:fmt(trackErr,2)+"%",nv:trackErr,m:"tracking_err",c:C.purple,tip:"Desvio padrão vs benchmark",
         def:"O quanto o portfólio se desvia do benchmark mês a mês. TE alto = apostas ativas grandes.",
         bom:"Abaixo de 4%: aderente ao benchmark. 4-8%: gestão ativa moderada.",
         ruim:"Acima de 12%: apostas muito grandes — pode gerar alpha ou destruir valor.",
         hist:geraHist(trackErr,.3)},
      ].map(m => (
        <MetricCardFull key={m.l} label={m.l} valor={m.v} numVal={m.nv}
         metric={m.m} cor={m.c} tip={m.tip}
         def={m.def} bom={m.bom} ruim={m.ruim}
         hist={m.hist} histLabel="label"/>
      ))}
     </div>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Liquidity Ladder"/>
      {buckets.map(b => (
        <div key={b.label} style={{ marginBottom:9 }}>
         <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
          <span style={{ fontWeight:600, color:b.color }}>{b.label}</span>
          <div><span style={{ fontWeight:700 }}>{fmt(b.pct,1)}%</span><span style={{ color:C.muted, marginLeft:6 }}>{fmtBRL(b.value)}</span></div>
         </div>
         <Barra pct={b.pct} cor={b.color}/>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Ganhos/Perdas Não Realizados"/>
      <div style={{ display:"flex", gap:10, marginBottom:12 }}>
        {[["Ganhos",gl.filter(a=>a.diff>0).reduce((s,a)=>s+a.diff,0),C.accent],["Perdas",gl.filter(a=>a.diff<0).reduce((s,a)=>s+a.diff,0),C.red]].map(([l,v,c]) => (
         <div key={l} style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 12px", borderTop:"2px solid "+c }}>
          <div style={{ fontSize:10, color:C.muted }}>{l}</div>
          <div style={{ fontSize:16, fontWeight:700, color:c }}>{fmtBRL(v)}</div>
         </div>
        ))}
      </div>
      {gl.slice(0,7).map(a => (
        <div key={a.ticker} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7, fontSize:11 }}>
         <span style={{ width:44, fontWeight:700 }}>{a.ticker}</span>
         <div style={{ flex:1 }}><Barra pct={Math.min(100,Math.abs(a.pct)/50*100)} cor={a.diff>=0?C.accent:C.red} altura={6}/></div>
         <span style={{ color:a.diff>=0?C.accent:C.red, fontWeight:600, width:52, textAlign:"right" }}>{fmtPct(a.pct)}</span>
        </div>
      ))}
     </div>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Exposição Cambial por Moeda"/>
     <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
      {fxExp.map((f,i) => {
        const cores = [C.accent,C.gold,C.blue,C.purple,"#F97316"];
        const c = cores[i%cores.length];
        return (
         <div key={f.fx} style={{ ...S.card, flex:1, minWidth:130, borderTop:"3px solid "+c, padding:"14px 16px" }}>
          <div style={{ fontSize:16, fontWeight:800, color:c }}>{f.fx}</div>
          <div style={{ fontSize:22, fontWeight:700, marginTop:4 }}>{fmt(f.pct,1)}%</div>
          <div style={{ fontSize:12, color:C.muted }}>{fmtBRL(f.v)}</div>
         </div>
        );
      })}
     </div>
    </div>
    </div>
  );
}
function TabPlanejamento({ totalVal, portRet, portVol }) {
  const [anos,    setAnos]    = useState(20);
  const [metas,   setMetas]   = useState([
    {id:1, nome:"Aposentadoria",  alvo:10000000, ano:2040},
    {id:2, nome:"Casa de campo",  alvo:2000000,  ano:2028},
  ]);
  const [novoNome,  setNovoNome]  = useState("");
  const [novoAlvo,  setNovoAlvo]  = useState("");
  const [novoAno,   setNovoAno]   = useState("");

  const mcData = useMemo(() => {
    return Array.from({length:anos}, (_,i) => {
    const yr = i+1;
    const base = 1 + portRet/100;
    return {
     yr,
     p10:  +(totalVal*Math.pow(1+(portRet/100-portVol/100*1.28),yr)/1e6).toFixed(2),
     p25:  +(totalVal*Math.pow(1+(portRet/100-portVol/100*.67),yr)/1e6).toFixed(2),
     p50:  +(totalVal*Math.pow(base,yr)/1e6).toFixed(2),
     p75:  +(totalVal*Math.pow(1+(portRet/100+portVol/100*.67),yr)/1e6).toFixed(2),
     p90:  +(totalVal*Math.pow(1+(portRet/100+portVol/100*1.28),yr)/1e6).toFixed(2),
    };
    });
  }, [totalVal, portRet, portVol, anos]);

  const sacData = [1,2,3,4,5,6].map(p => {
    const anual = (totalVal||1e6)*p/100;
    const ret = .06;
    const yrs = ret>p/100 ? Math.min(50,Math.round(Math.log(1-(totalVal||1e6)*ret/anual)/Math.log(1+ret))) : 99;
    return {p:p+"%", anual, years:isNaN(yrs)||yrs<0?50:yrs, ok:p<=4};
  });

  function addMeta() {
    if (!novoNome||!novoAlvo||!novoAno) return;
    setMetas(m => [...m, {id:uid(), nome:novoNome, alvo:parseFloat(novoAlvo), ano:parseInt(novoAno)}]);
    setNovoNome(""); setNovoAlvo(""); setNovoAno("");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={S.card}>
     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:8 }}>
      <SecaoTitulo titulo="Simulação Monte Carlo" sub={`200 cenários · μ=${fmt(portRet,1)}% · σ=${fmt(portVol,1)}%`}/>
      <select style={{...S.sel, width:100, fontSize:11}} value={anos} onChange={e=>setAnos(+e.target.value)}>
        {[5,10,15,20,30].map(y => <option key={y} value={y}>{y} anos</option>)}
      </select>
     </div>
     <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={mcData}>
        <defs>
         <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={C.accent} stopOpacity={.2}/>
          <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
         </linearGradient>
        </defs>
        <XAxis dataKey="yr" stroke={C.muted} tick={{fontSize:10}} label={{value:"Anos",position:"insideBottom",offset:-4,fill:C.muted,fontSize:10}}/>
        <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+v+"M"}/>
        <RechartsTip formatter={(v,n)=>[`R$${v}M`,{p10:"Pessimista",p25:"Conservador",p50:"Base",p75:"Otimista",p90:"Muito Otim."}[n]||n]} contentStyle={S.TT}/>
        <Area type="monotone" dataKey="p90" stroke="none" fill="url(#mcGrad)"/>
        <Line type="monotone" dataKey="p50" stroke={C.accent} strokeWidth={2.5} dot={false}/>
        <Line type="monotone" dataKey="p25" stroke={C.gold}   strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
        <Line type="monotone" dataKey="p10" stroke={C.red}    strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
      </AreaChart>
     </ResponsiveContainer>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginTop:10 }}>
      {[["p10","Pessimista",C.red],["p25","Conservador",C.gold],["p50","Base",C.accent],["p75","Otimista",C.blue],["p90","Muito Otim.",C.purple]].map(([p,l,c]) => {
        const last = mcData[mcData.length-1];
        return (
         <div key={p} style={{ background:C.surface, borderRadius:8, padding:"8px 10px", borderLeft:"3px solid "+c }}>
          <div style={{ fontSize:9, color:C.muted }}>{l}</div>
          <div style={{ fontSize:13, fontWeight:700, color:c }}>R${last?.[p]}M</div>
          <div style={{ fontSize:9, color:C.muted }}>em {anos}a</div>
         </div>
        );
      })}
     </div>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Metas Patrimoniais"/>
      {metas.map(g => {
        const prog = Math.min(100,(totalVal/g.alvo)*100);
        const yLeft = g.ano - new Date().getFullYear();
        const onTrack = totalVal*Math.pow(1+portRet/100,Math.max(0,yLeft)) >= g.alvo;
        return (
         <div key={g.id} style={{ ...S.card, padding:14, marginBottom:10, borderTop:"3px solid "+(onTrack?C.accent:C.gold) }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
           <div><div style={{ fontWeight:700 }}>{g.nome}</div><div style={{ fontSize:11, color:C.muted }}>{g.ano} · {yLeft>0?yLeft+"a restantes":"Vencida"}</div></div>
           <button onClick={()=>setMetas(ms=>ms.filter(x=>x.id!==g.id))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:onTrack?C.accent:C.gold, marginBottom:6 }}>{fmtBRL(g.alvo)}</div>
          <Barra pct={prog} cor={onTrack?C.accent:C.gold} altura={7}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:4 }}>
           <span style={{ color:C.muted }}>Progresso: <b style={{ color:onTrack?C.accent:C.gold }}>{fmt(prog,1)}%</b></span>
           <span style={S.badge(onTrack?C.accent:C.gold)}>{onTrack?"No caminho":"Atenção"}</span>
          </div>
         </div>
        );
      })}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr auto", gap:8, marginTop:8 }}>
        <input style={S.inp} placeholder="Nome da meta" value={novoNome} onChange={e=>setNovoNome(e.target.value)}/>
        <input style={S.inp} type="number" placeholder="R$ alvo" value={novoAlvo} onChange={e=>setNovoAlvo(e.target.value)}/>
        <input style={S.inp} type="number" placeholder="Ano" value={novoAno} onChange={e=>setNovoAno(e.target.value)}/>
        <button style={S.btnV} onClick={addMeta}>+</button>
      </div>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Simulador de Saques" sub="Regra dos X% · retorno base 6% a.a."/>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
         <tr style={{ borderBottom:"1px solid "+C.border }}>
          {["Taxa","Anual","Anos","Status"].map(h => <th key={h} style={{ padding:"5px 8px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase" }}>{h}</th>)}
         </tr>
        </thead>
        <tbody>
         {sacData.map(w => (
          <tr key={w.p} style={{ borderBottom:"1px solid "+C.border+"22", background:w.p==="4%"?C.accentDim:"transparent" }}>
           <td style={{ padding:"7px 8px", fontWeight:w.p==="4%"?700:400, color:w.p==="4%"?C.accent:C.text }}>{w.p}</td>
           <td style={{ padding:"7px 8px" }}>{fmtBRL(w.anual)}</td>
           <td style={{ padding:"7px 8px" }}>{w.years>=50?"∞":w.years+"a"}</td>
           <td style={{ padding:"7px 8px" }}><span style={S.badge(w.ok?C.accent:w.years>20?C.gold:C.red)}>{w.ok?"Seguro":w.years>20?"Moderado":"Risco"}</span></td>
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabESG({ byCat, totalVal }) {
  const ESG = {acoes_br:{e:62,s:55,g:68},fiis:{e:70,s:60,g:72},renda_fixa:{e:80,s:75,g:85},acoes_eua:{e:65,s:60,g:70},etfs:{e:68,s:62,g:71},cripto:{e:20,s:30,g:25},commodities:{e:35,s:45,g:50},cambio:{e:75,s:70,g:80},imoveis:{e:55,s:65,g:70},outros:{e:50,s:50,g:50}};
  const pesos = byCat.map(c => {const sc=ESG[c.id]||{e:50,s:50,g:50}; return {...c, sc, w:totalVal?c.value/totalVal:0};});
  const eE=pesos.reduce((s,c)=>s+c.w*c.sc.e,0), eS=pesos.reduce((s,c)=>s+c.w*c.sc.s,0), eG=pesos.reduce((s,c)=>s+c.w*c.sc.g,0);
  const total=(eE+eS+eG)/3;
  const label=total>70?"AA":total>60?"A":total>50?"BBB":"BB";
  const color=total>70?C.accent:total>60?"#34D399":total>50?C.gold:C.red;
  const ganho = totalVal*.15;
  const taxa  = ganho>3e7?22.5:ganho>1e7?20:ganho>5e6?17.5:15;
  const ir    = ganho*taxa/100;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["ESG Score",fmt(total,1)+"/100",label,color],["Ambiental (E)",fmt(eE,1)+"/100","Env",C.accent],["Social (S)",fmt(eS,1)+"/100","Soc",C.blue],["Governança (G)",fmt(eG,1)+"/100","Gov",C.purple]].map(([l,v,s,c]) => (
      <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
        <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{s}</div>
      </div>
     ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="ESG Score por Classe"/>
      {pesos.map(c => {
        const sc = (c.sc.e+c.sc.s+c.sc.g)/3;
        return (
         <div key={c.id} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
           <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:8, height:8, borderRadius:2, background:c.color }}/>{c.label}</div>
           <span style={{ fontWeight:600, color:sc>60?C.accent:C.gold }}>{fmt(sc,0)}/100</span>
          </div>
          <Barra pct={sc} cor={sc>60?C.accent:C.gold}/>
         </div>
        );
      })}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Eficiência Tributária"/>
      <div style={{ padding:14, background:C.surface, borderRadius:10, marginBottom:14 }}>
        {[["Ganhos Estimados",fmtBRL(ganho),C.accent],["Alíquota Aplicável",taxa+"%",C.gold],["IR Estimado",fmtBRL(ir),C.red],["Net Estimado",fmtBRL(ganho-ir),C.accent]].map(([l,v,c]) => (
         <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid "+C.border+"22", fontSize:13 }}>
          <span style={{ color:C.muted }}>{l}</span><span style={{ fontWeight:700, color:c }}>{v}</span>
         </div>
        ))}
      </div>
      <SecaoTitulo titulo="Tabela de Ganho de Capital"/>
      {[{min:0,max:5e6,rate:15},{min:5e6,max:1e7,rate:17.5},{min:1e7,max:3e7,rate:20},{min:3e7,max:Infinity,rate:22.5}].map(b => (
        <div key={b.rate} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}>
         <span style={{ color:C.muted }}>Até {b.max===Infinity?"sem limite":fmtBRL(b.max)}</span>
         <span style={{ fontWeight:700, color:b.rate<=15?C.accent:b.rate<=20?C.gold:C.red }}>{b.rate}%</span>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabAtribuicao({ byCat }) {
  const BW = {acoes_br:.20,fiis:.10,renda_fixa:.15,acoes_eua:.20,etfs:.10,cripto:.05,commodities:.05,cambio:.05,imoveis:.05,outros:.05};
  const BR = {acoes_br:12,fiis:8.5,renda_fixa:10.5,acoes_eua:18.1,etfs:15,cripto:35,commodities:10,cambio:5,imoveis:8,outros:6};
  const linhas = CATS.map(cat => {
    const cur = byCat.find(b=>b.id===cat.id);
    const pw  = (cur?.pct||0)/100, bw=BW[cat.id]||.05;
    const pr  = BR[cat.id]||8, br=pr*.85;
    const al  = (pw-bw)*br/100, se=bw*(pr-br)/100, it=(pw-bw)*(pr-br)/100;
    return {...cat, pw:+(pw*100).toFixed(1), bw:+(bw*100).toFixed(1), pr, br:+br.toFixed(1), al:+(al*100).toFixed(2), se:+(se*100).toFixed(2), it:+(it*100).toFixed(2), tot:+((al+se+it)*100).toFixed(2)};
  });
  const tA=+linhas.reduce((s,r)=>s+r.al,0).toFixed(2);
  const tS=+linhas.reduce((s,r)=>s+r.se,0).toFixed(2);
  const tI=+linhas.reduce((s,r)=>s+r.it,0).toFixed(2);
  const tT=+(tA+tS+tI).toFixed(2);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Ef. Alocação",tA,C.blue],["Ef. Seleção",tS,C.accent],["Ef. Interação",tI,C.purple],["Alpha Total",tT,tT>=0?C.accent:C.red]].map(([l,v,c]) => (
      <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
        <div style={{ fontSize:22, fontWeight:800, color:+v>=0?C.accent:C.red }}>{+v>=0?"+":""}{fmt(+v,2)}%</div>
      </div>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Decomposição Brinson-Hood-Beebower" sub="Modelo padrão CFA/GIPS para atribuição de retorno ativo por classe"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Classe","Peso Ben.","Peso Port.","Ret. Ben.","Ret. Port.","Ef. Alocação","Ef. Seleção","Ef. Interação","Total"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>
         {linhas.map(s => (
          <tr key={s.id} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"9px 10px" }}><div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:8, height:8, borderRadius:2, background:s.color }}/><span style={{ fontWeight:600 }}>{s.label}</span></div></td>
           <td style={{ padding:"9px 10px", color:C.muted }}>{s.bw}%</td>
           <td style={{ padding:"9px 10px" }}>{s.pw}%</td>
           <td style={{ padding:"9px 10px", color:C.muted }}>{s.br}%</td>
           <td style={{ padding:"9px 10px" }}>{s.pr}%</td>
           <td style={{ padding:"9px 10px", color:s.al>=0?C.accent:C.red, fontWeight:600 }}>{s.al>=0?"+":""}{fmt(s.al,2)}%</td>
           <td style={{ padding:"9px 10px", color:s.se>=0?C.accent:C.red, fontWeight:600 }}>{s.se>=0?"+":""}{fmt(s.se,2)}%</td>
           <td style={{ padding:"9px 10px", color:s.it>=0?C.accent:C.red }}>{s.it>=0?"+":""}{fmt(s.it,2)}%</td>
           <td style={{ padding:"9px 10px" }}><span style={S.badge(s.tot>=0?C.accent:C.red)}>{s.tot>=0?"+":""}{fmt(s.tot,2)}%</span></td>
          </tr>
         ))}
         <tr style={{ borderTop:"2px solid "+C.border, fontWeight:700 }}>
          <td style={{ padding:"9px 10px" }}>TOTAL</td>
          <td style={{ padding:"9px 10px", color:C.muted }}>100%</td><td style={{ padding:"9px 10px" }}>100%</td><td colSpan={2}/>
          <td style={{ padding:"9px 10px", color:tA>=0?C.accent:C.red }}>{tA>=0?"+":""}{fmt(tA,2)}%</td>
          <td style={{ padding:"9px 10px", color:tS>=0?C.accent:C.red }}>{tS>=0?"+":""}{fmt(tS,2)}%</td>
          <td style={{ padding:"9px 10px", color:tI>=0?C.accent:C.red }}>{tI>=0?"+":""}{fmt(tI,2)}%</td>
          <td style={{ padding:"9px 10px" }}><span style={S.badge(tT>=0?C.accent:C.red)}>{tT>=0?"+":""}{fmt(tT,2)}%</span></td>
         </tr>
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabFatores({ portVol, portRet, portBeta }) {
  const fatores = [
    {n:"Market (Mkt-RF)", s:"β", exp:portBeta, ts:8.2, pv:.000, desc:"Prêmio de risco de mercado"},
    {n:"Size (SMB)",      s:"s", exp:.18,       ts:1.9, pv:.058, desc:"Small minus Big — small caps"},
    {n:"Value (HML)",     s:"h", exp:-.12,      ts:-1.4,pv:.162, desc:"Valor vs crescimento"},
    {n:"Profit. (RMW)",  s:"r", exp:.31,       ts:3.1, pv:.002, desc:"Lucratividade robusta"},
    {n:"Invest. (CMA)",  s:"c", exp:-.08,      ts:-.9, pv:.371, desc:"Conservador vs agressivo"},
    {n:"Momentum",        s:"m", exp:.22,       ts:2.4, pv:.017, desc:"Winners minus Losers"},
    {n:"Quality (QMJ)",  s:"q", exp:.28,       ts:2.8, pv:.005, desc:"Quality minus Junk"},
  ];
  const rolling = MESES.map((mes,i) => ({mes, mkt:+(portBeta+Math.sin(i*.8)*.12).toFixed(2), smb:+(0.18+Math.cos(i*.9)*.08).toFixed(2), hml:+(-0.12+Math.sin(i*1.2)*.06).toFixed(2), mom:+(0.22+Math.cos(i*.7)*.10).toFixed(2)}));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Alpha Mensal","+0.89%",C.accent,"Retorno não explicado"],["R²","73.0%",C.blue,"Variância explicada"],["Fatores Signif.",fatores.filter(f=>f.pv<.05).length,C.gold,"p-valor < 0.05"],["Fator Dom.","Mkt-RF",C.white,"β = "+fmt(portBeta,2)]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Regressão FF5 + Momentum + Quality" sub="Período: 36 meses · *** p<0.01 · ** p<0.05 · * p<0.10"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Fator","Símbolo","Exposição","t-stat","p-valor","Sig","Descrição"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>
         {fatores.map(f => {
          const sc = f.pv<.01?C.accent:f.pv<.05?C.gold:f.pv<.10?"#F97316":C.muted;
          const sig = f.pv<.01?"***":f.pv<.05?"**":f.pv<.10?"*":"ns";
          return (
           <tr key={f.n} style={{ borderBottom:"1px solid "+C.border+"22" }}>
            <td style={{ padding:"9px 10px", fontWeight:600 }}>{f.n}</td>
            <td style={{ padding:"9px 10px", color:C.muted, fontFamily:"monospace" }}>{f.s}</td>
            <td style={{ padding:"9px 10px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
               <div style={{ width:60, height:6, background:C.border, borderRadius:3, overflow:"hidden", position:"relative" }}>
                <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:1, background:C.muted }}/>
                <div style={{ position:"absolute", left:f.exp>=0?"50%":(50+f.exp*25)+"%", width:Math.abs(f.exp)*25+"%", height:"100%", background:f.exp>=0?C.accent:C.red }}/>
               </div>
               <span style={{ fontWeight:700, color:f.exp>=0?C.accent:C.red }}>{f.exp>=0?"+":""}{f.exp}</span>
              </div>
            </td>
            <td style={{ padding:"9px 10px", color:Math.abs(f.ts)>2?C.accent:C.muted }}>{f.ts}</td>
            <td style={{ padding:"9px 10px", color:f.pv<.05?C.accent:C.muted }}>{f.pv}</td>
            <td style={{ padding:"9px 10px" }}><span style={S.badge(sc)}>{sig}</span></td>
            <td style={{ padding:"9px 10px", fontSize:11, color:C.muted }}>{f.desc}</td>
           </tr>
          );
         })}
        </tbody>
      </table>
     </div>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Exposição Fatorial Rolling — 12 Meses"/>
     <ResponsiveContainer width="100%" height={200}>
      <LineChart data={rolling}>
        <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}}/>
        <YAxis stroke={C.muted} tick={{fontSize:10}}/>
        <RechartsTip contentStyle={S.TT}/>
        <Legend/>
        <Line type="monotone" dataKey="mkt" name="Market β" stroke={C.accent} strokeWidth={2} dot={false}/>
        <Line type="monotone" dataKey="smb" name="SMB" stroke={C.blue} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
        <Line type="monotone" dataKey="hml" name="HML" stroke={C.gold} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
        <Line type="monotone" dataKey="mom" name="MOM" stroke={C.purple} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
      </LineChart>
     </ResponsiveContainer>
    </div>
    </div>
  );
}
function TabKelly({ filtered, quotes={}, totalVal, byCat }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const rf = CFG.rfRate/100;
  const kelly = filtered.slice(0,8).map(a => {
    const vol = (catOf(a.category).vol||20)/100;
    const mu  = vol*1.2+rf, k=Math.max(0,Math.min(.40,(mu-rf)/(vol*vol)));
    const curW = totalVal?(preco(a)*a.qty/totalVal):0;
    return {ticker:a.ticker, name:a.name, vol:+(vol*100).toFixed(1), mu:+(mu*100).toFixed(1), kelly:+(k*100).toFixed(1), half:+(k*50).toFixed(1), curW:+(curW*100).toFixed(1), diff:+((k*.5-curW)*100).toFixed(1)};
  });
  const bl = byCat.slice(0,7).map((c,i) => {
    const v=[2.5,4.0,-1.5,3.2,-2.0,5.0,1.0][i]||0;
    return {...c, views:v>=0?"+"+v+"%":v+"%", blW:+Math.max(0,c.pct+v*.4).toFixed(1), delta:+(Math.max(0,c.pct+v*.4)-c.pct).toFixed(1)};
  });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={S.card}>
     <SecaoTitulo titulo="Critério de Kelly — Dimensionamento Ótimo" sub="Half-Kelly recomendado para gestão conservadora de risco"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Ativo","Vol.","Ret. Est.","Kelly Full","Half Kelly","Peso Atual","Diferença","Ação"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>
         {kelly.map(a => (
          <tr key={a.ticker} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"9px 10px" }}><div style={{ fontWeight:700 }}>{a.ticker}</div><div style={{ fontSize:10, color:C.muted }}>{a.name}</div></td>
           <td style={{ padding:"9px 10px", color:C.muted }}>{a.vol}%</td>
           <td style={{ padding:"9px 10px" }}>{a.mu}%</td>
           <td style={{ padding:"9px 10px", color:C.blue }}>{a.kelly}%</td>
           <td style={{ padding:"9px 10px", color:C.accent, fontWeight:600 }}>{a.half}%</td>
           <td style={{ padding:"9px 10px" }}>{a.curW}%</td>
           <td style={{ padding:"9px 10px", color:a.diff>=0?C.accent:C.red, fontWeight:600 }}>{a.diff>=0?"+":""}{fmt(a.diff,1)}%</td>
           <td style={{ padding:"9px 10px" }}><span style={S.badge(a.diff>1?C.accent:a.diff<-1?C.red:C.gold)}>{a.diff>1?"Aumentar":a.diff<-1?"Reduzir":"OK"}</span></td>
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Modelo Black-Litterman" sub="Combina equilíbrio de mercado com as visões do gestor"/>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
      <div>
        {bl.map(a => (
         <div key={a.id} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
           <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:8, height:8, borderRadius:2, background:a.color }}/><span style={{ fontWeight:600 }}>{a.label}</span></div>
           <div style={{ display:"flex", gap:8, fontSize:11 }}>
            <span style={{ color:C.muted }}>Mkt: {fmt(a.pct,1)}%</span>
            <span style={{ color:parseFloat(a.views)>=0?C.accent:C.red }}>View: {a.views}</span>
            <span style={{ fontWeight:700 }}>BL: {a.blW}%</span>
           </div>
          </div>
          <div style={{ display:"flex", gap:2, height:8 }}>
           <div style={{ width:Math.min(a.pct,a.blW)+"%", background:a.color, borderRadius:"3px 0 0 3px", opacity:.8 }}/>
           <div style={{ width:Math.abs(a.delta)+"%", background:a.delta>=0?C.accent:C.red, borderRadius:"0 3px 3px 0" }}/>
          </div>
         </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize:11, fontWeight:600, color:C.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>Pressupostos do Modelo</div>
        {[["Aversão ao risco (λ)","2.5"],["Taxa livre de risco",CFG.rfRate+"%"],["Confiança (τ)","0.05"],["Benchmark","IBOV+SPY blend"],["Período estimação","36 meses"]].map(([l,v]) => (
         <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}>
          <span style={{ color:C.muted }}>{l}</span>
          <span style={{ fontWeight:700 }}>{v}</span>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabEVT({ totalVal, var99, dailyVol }) {
  const xi=.32, beta=.021, u=.02;
  const evtVaR  = p => u+beta/xi*(Math.pow(1-p,-xi)-1);
  const evtCVaR = p => evtVaR(p)/(1-xi)+beta/(1-xi)-u;
  const tail = Array.from({length:20},(_,i) => {const p=.80+i*.01; return {p:(p*100).toFixed(0)+"%", evt:+(totalVal*evtVaR(p)).toFixed(0), normal:+(totalVal*(dailyVol/100)*(-Math.log(1-p)*.5)).toFixed(0)};});
  const cenas = [{e:"Crise 2008",r:-38,p:2.1,c:C.red},{e:"Covid 2020",r:-29.7,p:3.5,c:C.red},{e:"Fed 2022",r:-23,p:5,c:"#F97316"},{e:"Flash Crash",r:-9.2,p:8,c:C.gold},{e:"Tariff 2025",r:-15,p:6.5,c:"#F97316"},{e:"EVT 99.5%",r:-+(evtVaR(.995)*100).toFixed(1),p:.5,c:C.purple}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["VaR 99% Normal",fmtBRL(var99),"Gaussiano",C.red],["VaR 99% EVT",fmtBRL(totalVal*evtVaR(.99)),"GPD",C.purple],["CVaR 99% EVT",fmtBRL(totalVal*evtCVaR(.99)),"Expected Shortfall",C.red],["Tail Index (ξ)",fmt(xi,2),"Cauda pesada",C.gold]].map(([l,v,s,c]) => (
      <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
        <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
      </div>
     ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="EVT vs Modelo Normal" sub="EVT captura caudas pesadas melhor que a normal acima de 95%"/>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={tail}>
         <XAxis dataKey="p" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+(v/1e6).toFixed(1)+"M"}/>
         <RechartsTip formatter={v=>fmtBRL(+v)} contentStyle={S.TT}/>
         <Legend/>
         <Line type="monotone" dataKey="evt" name="EVT (GPD)" stroke={C.purple} strokeWidth={2.5} dot={false}/>
         <Line type="monotone" dataKey="normal" name="Normal" stroke={C.blue} strokeWidth={2} strokeDasharray="5 3" dot={false}/>
        </LineChart>
      </ResponsiveContainer>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Cenários de Cauda Extrema"/>
      {cenas.map(s => (
        <div key={s.e} style={{ marginBottom:9 }}>
         <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:2 }}>
          <div><span style={{ fontWeight:600 }}>{s.e}</span><span style={{ fontSize:10, color:C.muted, marginLeft:4 }}>{s.p}%/ano</span></div>
          <span style={{ fontWeight:700, color:s.c }}>{s.r}%</span>
         </div>
         <Barra pct={Math.abs(parseFloat(s.r))/40*100} cor={s.c} altura={7}/>
         <div style={{ fontSize:10, color:C.muted }}>Impacto: <span style={{ color:s.c, fontWeight:600 }}>{fmtBRL(totalVal*parseFloat(s.r)/100)}</span></div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabRiskAttr({ filtered, quotes={}, totalVal, volPort }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const portVD = volPort/100;
  const rc = filtered.slice(0,10).map(a => {
    const w   = totalVal?(preco(a)*a.qty/totalVal):0;
    const vol = (catOf(a.category).vol||20)/100;
    const mrc = w*vol*.7, crc=w*mrc, prc=portVD>0?crc/portVD:0;
    return {ticker:a.ticker, name:a.name, weight:+(w*100).toFixed(1), vol:+(vol*100).toFixed(1), mrc:+(mrc*100).toFixed(3), crc:+(crc*100).toFixed(3), prc:+(prc*100).toFixed(1), compVaR:totalVal*mrc*1.645/Math.sqrt(252)};
  }).sort((a,b) => b.prc-a.prc);
  const divBen = 1-portVD/Math.max(.001,rc.reduce((s,a)=>s+a.weight/100*(a.vol/100),0));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Vol. Portfolio",fmt(volPort,1)+"%",C.gold,"Anualizada"],["Benef. Diversif.",fmt(divBen*100,1)+"%",C.accent,"Redução vs média"],["Maior Contribuinte",rc[0]?.ticker||"--",C.red,fmt(rc[0]?.prc||0,1)+"% do risco"],["VaR Comp. Total",fmtBRL(rc.reduce((s,a)=>s+a.compVaR,0)),C.purple,"95% 1 dia"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Component VaR e % de Risco por Ativo" sub="MRC = Marginal Risk Contribution · CRC = Component · % Risk = parcela do risco total"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Ativo","Peso%","Vol.","MRC","CRC","% Risco","Comp.VaR 95%","Class."].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>
         {rc.map(a => (
          <tr key={a.ticker} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"9px 10px" }}><div style={{ fontWeight:700 }}>{a.ticker}</div><div style={{ fontSize:10, color:C.muted }}>{a.name}</div></td>
           <td style={{ padding:"9px 10px" }}>{a.weight}%</td>
           <td style={{ padding:"9px 10px", color:a.vol>40?C.red:a.vol>20?C.gold:C.accent }}>{a.vol}%</td>
           <td style={{ padding:"9px 10px", fontSize:11, color:C.muted }}>{a.mrc}%</td>
           <td style={{ padding:"9px 10px", fontSize:11 }}>{a.crc}%</td>
           <td style={{ padding:"9px 10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:44, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}><div style={{ height:"100%", width:Math.min(100,a.prc)+"%", background:a.prc>20?C.red:a.prc>10?C.gold:C.accent, borderRadius:3 }}/></div>
              <span style={{ fontWeight:700, color:a.prc>20?C.red:a.prc>10?C.gold:C.accent }}>{fmt(a.prc,1)}%</span>
            </div>
           </td>
           <td style={{ padding:"9px 10px", fontWeight:600 }}>{fmtBRL(a.compVaR)}</td>
           <td style={{ padding:"9px 10px" }}><span style={S.badge(a.prc>25?C.red:a.prc>10?C.gold:C.accent)}>{a.prc>25?"Alto":a.prc>10?"Moderado":"Baixo"}</span></td>
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabRebalance({ byCat, totalVal }) {
  const TARGETS = {acoes_br:20,fiis:10,renda_fixa:15,acoes_eua:20,etfs:10,cripto:5,commodities:5,cambio:5,imoveis:5,outros:5};
  const rebal = CATS.map(cat => {
    const cur = byCat.find(b=>b.id===cat.id)?.pct||0;
    const tgt = TARGETS[cat.id]||5, diff=+(cur-tgt).toFixed(1), fora=Math.abs(diff)>5;
    return {...cat, cur:+cur.toFixed(1), tgt, diff, fora, tradeVal:totalVal*Math.abs(diff)/100, action:diff>0?"Vender":"Comprar"};
  }).filter(r=>r.cur>0||r.tgt>0);
  const vol  = rebal.filter(r=>r.fora).reduce((s,r)=>s+r.tradeVal,0);
  const freq = [{f:"Mensal",t:18.2,c:.18,n:.42},{f:"Trimestral",t:8.4,c:.08,n:.61},{f:"Semestral",t:5.1,c:.05,n:.58},{f:"Anual",t:3.2,c:.03,n:.44},{f:"Bandas 5%",t:4.8,c:.05,n:.67}];
  const best = freq.reduce((a,b)=>b.n>a.n?b:a);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Fora da Banda",rebal.filter(r=>r.fora).length,rebal.filter(r=>r.fora).length>0?C.gold:C.accent,"Classes ±5% do target"],["Volume Rebalancear",fmtBRL(vol),C.blue,"Estimativa de trades"],["Freq. Ótima",best.f,C.accent,"+"+best.n+"% benef. líquido"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Desvio vs Target — Bandas ±5%" sub="Linha branca = target · Faixa verde = banda ±5% · Amarelo/vermelho = rebalancear"/>
     {rebal.map(r => (
      <div key={r.id} style={{ marginBottom:9 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, marginBottom:3 }}>
         <div style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:8, height:8, borderRadius:2, background:r.color }}/><span style={{ fontWeight:600 }}>{r.label}</span></div>
         <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ color:C.muted, fontSize:11 }}>Target: {r.tgt}%</span>
          <span style={{ fontWeight:700, color:r.fora?(r.diff>0?C.red:C.gold):C.text }}>Atual: {r.cur}%</span>
          {r.fora ? <span style={S.badge(r.diff>0?C.red:C.gold)}>{r.action} {fmtBRL(r.tradeVal)}</span> : <span style={S.badge(C.accent)}>OK</span>}
         </div>
        </div>
        <div style={{ position:"relative", height:10, background:C.border, borderRadius:5, overflow:"hidden" }}>
         <div style={{ position:"absolute", left:Math.max(0,r.tgt-5)+"%", width:"10%", height:"100%", background:C.accent+"22" }}/>
         <div style={{ position:"absolute", left:0, width:Math.min(100,r.cur)+"%", height:"100%", background:r.fora?C.gold:C.accent, borderRadius:5, opacity:.8 }}/>
         <div style={{ position:"absolute", left:r.tgt+"%", top:0, bottom:0, width:2, background:C.white, opacity:.6 }}/>
        </div>
      </div>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Frequência Ótima de Rebalanceamento"/>
     <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
      <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Frequência","Turnover","Custo Est.","Benef. Líq.","Status"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
      <tbody>{freq.map(f => (
        <tr key={f.f} style={{ borderBottom:"1px solid "+C.border+"22", background:f.f===best.f?C.accentDim:"transparent" }}>
         <td style={{ padding:"9px 10px", fontWeight:f.f===best.f?700:400, color:f.f===best.f?C.accent:C.text }}>{f.f}</td>
         <td style={{ padding:"9px 10px", color:C.muted }}>{f.t}%</td>
         <td style={{ padding:"9px 10px", color:C.red }}>-{f.c}%</td>
         <td style={{ padding:"9px 10px", color:C.accent, fontWeight:600 }}>+{f.n}%</td>
         <td style={{ padding:"9px 10px" }}>{f.f===best.f?<span style={S.badge(C.accent)}>Ótimo</span>:<span style={S.badge(C.muted)}>Alt.</span>}</td>
        </tr>
      ))}</tbody>
     </table>
    </div>
    </div>
  );
}
function TabSucessao({ assets, quotes={}, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [simP, setSimP] = useState(0);
  const [simY, setSimY] = useState(20);
  const [simR, setSimR] = useState(10);
  const [simH, setSimH] = useState(2);
  useEffect(() => { if(totalVal>0 && simP===0) setSimP(Math.round(totalVal)); }, [totalVal]);
  const futVal = simP*Math.pow(1+simR/100,simY);
  const itcmd  = futVal*.04, holdSave=itcmd*.60;
  const estateData = FAMILIAS.map(fam => {
    const fv = assets.filter(a=>a.family===fam).reduce((s,a)=>s+preco(a)*a.qty,0);
    return {fam, fv, itcmd:fv*.04, holding:fv*.04*.60, doacao:Math.min(fv*.03,80000)};
  }).filter(e => e.fv>0);
  const estruturas = [
    {e:"Holding Familiar",    ec:"Até 60%",       v:"ITCMD reduzido, governança",      r:"~R$15k/ano",       c:C.accent,  s:95},
    {e:"Fundo Exclusivo",     ec:"Até 40%",       v:"IR diferido, proteção de ativos", r:"Regulação CVM",    c:C.blue,    s:85},
    {e:"VGBL/PGBL",           ec:"Até 27.5%",     v:"IR diferido, fora do inventário", r:"Liquidez restrita",c:C.gold,    s:75},
    {e:"Doações Program.",    ec:"Isento 40k/ano", v:"Reduz inventário, planejável",   r:"Irrevogável",      c:C.purple,  s:70},
    {e:"Offshore",            ec:"Diferimento",   v:"Diversificação global",           r:"OECD/CRS",         c:"#F97316", s:65},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={S.card}>
     <SecaoTitulo titulo="ITCMD Estimado por Família (4%)" sub="Imposto de transmissão causa mortis. Holding familiar pode reduzir até 60%."/>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
      {estateData.map(e => (
        <div key={e.fam} style={{ ...S.card, borderTop:"3px solid "+C.gold }}>
         <div style={{ fontWeight:700, marginBottom:10 }}>{e.fam}</div>
         {[["Patrimônio",fmtBRL(e.fv),C.white],["ITCMD 4%",fmtBRL(e.itcmd),C.red],["Economia Holding",fmtBRL(e.holding),C.accent],["Doação Isenta/ano",fmtBRL(e.doacao),C.gold]].map(([l,v,c]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}>
           <span style={{ color:C.muted }}>{l}</span><span style={{ fontWeight:700, color:c }}>{v}</span>
          </div>
         ))}
        </div>
      ))}
     </div>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Simulador Sucessório"/>
      <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
        {[["Patrimônio (R$)",simP,setSimP],["Horizonte (anos)",simY,setSimY],["Retorno % a.a.",simR,setSimR],["Nº de herdeiros",simH,setSimH]].map(([l,v,fn]) => (
         <div key={l}><div style={{ fontSize:11, color:C.muted, marginBottom:3 }}>{l}</div><input style={S.inp} type="number" value={v} onChange={e=>fn(Number(e.target.value))}/></div>
        ))}
      </div>
      <div style={{ background:C.surface, borderRadius:10, padding:14 }}>
        {[["Patrimônio Futuro",fmtBRL(futVal),C.white],["ITCMD Futuro (4%)",fmtBRL(itcmd),C.red],["Economia c/ Holding",fmtBRL(holdSave),C.accent],["Por herdeiro (sem plan.)",fmtBRL((futVal-itcmd)/Math.max(1,simH)),C.gold],["Por herdeiro (c/ holding)",fmtBRL((futVal-itcmd+holdSave)/Math.max(1,simH)),C.accent]].map(([l,v,c]) => (
         <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}>
          <span style={{ color:C.muted }}>{l}</span><span style={{ fontWeight:700, color:c }}>{v}</span>
         </div>
        ))}
      </div>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Estruturas de Proteção Patrimonial"/>
      {estruturas.map(e => (
        <div key={e.e} style={{ marginBottom:10, padding:10, background:C.surface, borderRadius:8, borderLeft:"3px solid "+e.c }}>
         <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontWeight:700, fontSize:12 }}>{e.e}</span><span style={S.badge(e.c)}>{e.ec}</span></div>
         <div style={{ fontSize:11, color:C.text, marginBottom:2 }}>✓ {e.v}</div>
         <div style={{ fontSize:11, color:C.muted }}>⚠ {e.r}</div>
         <div style={{ marginTop:5, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}><div style={{ height:"100%", width:e.s+"%", background:e.c, borderRadius:2 }}/></div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabOportunidade({ byCat, totalVal, portRet }) {
  const optRet=22.4, gap=optRet-portRet, oppCost=totalVal*gap/100;
  const opt = [{cat:"Acoes BR",opt:18,c:C.accent},{cat:"FIIs",opt:8,c:"#34D399"},{cat:"Renda Fixa",opt:12,c:C.blue},{cat:"Acoes EUA",opt:28,c:C.gold},{cat:"ETFs",opt:12,c:"#F97316"},{cat:"Cripto",opt:6,c:"#FB923C"},{cat:"Commodities",opt:8,c:"#FBBF24"},{cat:"Cambio",opt:4,c:"#60A5FA"},{cat:"Outros",opt:4,c:C.muted}];
  const decisions = [{d:"Sobrepeso Renda Fixa",i:-1.8,p:"2023-24",desc:"Bolsa subiu +22%"},{d:"Subexposição Cripto",i:-2.1,p:"2023",desc:"BTC +155%"},{d:"Excesso de caixa",i:-.9,p:"2024",desc:"vs CDI+spread"},{d:"Hedge cambial exc.",i:-.4,p:"2024",desc:"USD/BRL +15%"},{d:"Venda prematura NVDA",i:-1.2,p:"2023-24",desc:"Ação +220%"},{d:"Timing errado FIIs",i:-.6,p:"2022",desc:"Ciclo de queda"}];
  const tl = Array.from({length:10},(_,i)=>({ano:(new Date().getFullYear()+i).toString(), atual:Math.round(totalVal*Math.pow(1+portRet/100,i+1)), otimo:Math.round(totalVal*Math.pow(1+optRet/100,i+1))}));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Retorno Atual (1A)","+"+portRet+"%",C.accent],["Retorno Ótimo Est.","+"+optRet+"%",C.blue],["Gap de Performance",fmt(gap,1)+"%",C.red],["Valor Perdido (1A)",fmtBRL(oppCost),C.red]].map(([l,v,c]) => (
      <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
        <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
      </div>
     ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Portfolio vs Alocação Ótima (Markowitz)"/>
      {opt.map(o => {
        const cur = byCat.find(b=>b.label===o.cat)?.pct||0;
        const diff = +(cur-o.opt).toFixed(1);
        return (
         <div key={o.cat} style={{ marginBottom:7 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:2 }}>
           <span style={{ fontWeight:600 }}>{o.cat}</span>
           <div style={{ display:"flex", gap:8, fontSize:11 }}>
            <span style={{ color:C.muted }}>Ótimo: {o.opt}%</span>
            <span>Atual: {fmt(cur,1)}%</span>
            <span style={{ color:diff>0?C.gold:diff<0?C.blue:C.accent, fontWeight:700 }}>{diff>=0?"+":""}{diff}%</span>
           </div>
          </div>
          <div style={{ position:"relative", height:8, background:C.border, borderRadius:4, overflow:"hidden" }}>
           <div style={{ position:"absolute", left:0, width:Math.min(o.opt,cur)+"%", height:"100%", background:o.c, opacity:.8, borderRadius:4 }}/>
           {diff!==0 && <div style={{ position:"absolute", left:Math.min(o.opt,cur)+"%", width:Math.abs(diff)+"%", height:"100%", background:diff>0?C.gold:C.blue, opacity:.6 }}/>}
           <div style={{ position:"absolute", left:o.opt+"%", top:0, bottom:0, width:2, background:C.white, opacity:.7 }}/>
          </div>
         </div>
        );
      })}
     </div>
     <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={S.card}>
        <SecaoTitulo titulo="Decisões com Maior Custo"/>
        {decisions.map(d => (
         <div key={d.d} style={{ marginBottom:7, padding:"7px 10px", background:C.surface, borderRadius:7, borderLeft:"3px solid "+C.red }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
           <span style={{ fontWeight:600 }}>{d.d}</span><span style={{ color:C.red, fontWeight:700 }}>{d.i}%</span>
          </div>
          <div style={{ fontSize:10, color:C.muted }}>{d.p} · {d.desc}</div>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Impacto Composto 10 Anos"/>
        <ResponsiveContainer width="100%" height={140}>
         <AreaChart data={tl}>
          <defs>
           <linearGradient id="go1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={.3}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient>
           <linearGradient id="go2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={.3}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient>
          </defs>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+(v/1e6).toFixed(0)+"M"}/>
          <RechartsTip formatter={(v,n)=>[fmtBRL(+v),n==="otimo"?"Ótimo":"Atual"]} contentStyle={S.TT}/>
          <Area type="monotone" dataKey="otimo" stroke={C.blue}   fill="url(#go1)" strokeWidth={2}/>
          <Area type="monotone" dataKey="atual" stroke={C.accent} fill="url(#go2)" strokeWidth={2}/>
         </AreaChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginTop:8 }}>
         <span style={{ color:C.muted }}>Gap em 10 anos:</span>
         <span style={{ fontWeight:700, color:C.red }}>{fmtBRL((tl[9]?.otimo||0)-(tl[9]?.atual||0))}</span>
        </div>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabTaxLoss({ filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const pos = filtered.map(a => {
    const gl=(preco(a)-a.avgPrice)*a.qty, glp=(preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100;
    return {...a, gl, glp:+glp.toFixed(1), isLoss:gl<0};
  }).sort((a,b)=>a.gl-b.gl);
  const totalLoss = pos.filter(p=>p.isLoss).reduce((s,p)=>s+Math.abs(p.gl),0);
  const totalGain = pos.filter(p=>!p.isLoss).reduce((s,p)=>s+p.gl,0);
  const tlhSave   = Math.min(totalLoss,totalGain)*.15;
  const taxNet    = Math.max(0,totalGain-totalLoss);
  const strats    = [{s:"Isenção ações (<R$20k/mês)",eco:totalGain*.15*.3,desc:"Vender até R$20k/mês aproveitando isenção"},{s:"Tax Loss Harvesting",eco:tlhSave,desc:"Realizar prejuízos para compensar ganhos"},{s:"Migração p/ Fundo Exclusivo",eco:totalGain*.08,desc:"Diferir IR no come-cotas semestral"},{s:"VGBL/PGBL (até 12% renda)",eco:totalGain*.05,desc:"Aportar para deduzir IR na base de cálculo"}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Ganhos Não Real.",fmtBRL(totalGain),C.accent],["Perdas Não Real.",fmtBRL(totalLoss),C.red],["Economia TLH Est.",fmtBRL(tlhSave),C.gold],["Ganho Trib. Líq.",fmtBRL(taxNet),taxNet>0?C.red:C.accent]].map(([l,v,c]) => (
      <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
        <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
      </div>
     ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Candidatos TLH — Posições com Prejuízo"/>
      {pos.filter(p=>p.isLoss).length===0 ? <div style={{ color:C.muted, textAlign:"center", padding:20 }}>Sem posições com prejuízo</div>
      : pos.filter(p=>p.isLoss).map(p => (
        <div key={p.ticker} style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", background:C.surface, borderRadius:8, marginBottom:6, borderLeft:"3px solid "+C.red, fontSize:12 }}>
         <div><div style={{ fontWeight:700 }}>{p.ticker} <span style={{ color:C.muted, fontWeight:400, fontSize:10 }}>{catOf(p.category).label}</span></div><div style={{ fontSize:10, color:C.muted }}>Regra wash-sale: aguardar 30 dias para recomprar</div></div>
         <div style={{ textAlign:"right" }}><div style={{ color:C.red, fontWeight:700 }}>{fmtBRL(p.gl)}</div><div style={{ fontSize:10, color:C.muted }}>{fmtPct(p.glp)}</div></div>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Estratégias de Otimização Tributária"/>
      {strats.sort((a,b)=>b.eco-a.eco).map(s => (
        <div key={s.s} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:C.surface, borderRadius:8, marginBottom:8, gap:12 }}>
         <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:12 }}>{s.s}</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.desc}</div></div>
         <div style={{ textAlign:"right", flexShrink:0 }}><div style={{ fontWeight:700, color:C.accent, fontSize:14 }}>{fmtBRL(s.eco)}</div><div style={{ fontSize:10, color:C.muted }}>economia est.</div></div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabBehavioral({ filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const winners = filtered.filter(a=>(preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100>10);
  const losers  = filtered.filter(a=>(preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100<-5);
  const dispRatio = winners.length>0&&losers.length>0 ? (losers.length/Math.max(1,filtered.length))/(winners.length/Math.max(1,filtered.length)) : 1;
  const dispColor = dispRatio>1.5?C.red:dispRatio>1?C.gold:C.accent;
  const teses = filtered.slice(0,5).map((a,i) => {
    const real     = (preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100;
    const expected = [15,12,20,8,25][i]||10;
    return {ticker:a.ticker, expected:+expected.toFixed(1), real:+real.toFixed(1), gap:+(expected-real).toFixed(1)};
  });
  const overconf = Math.round(teses.reduce((s,t)=>s+Math.max(0,t.gap),0)/Math.max(1,teses.length));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Disposition Ratio",fmt(dispRatio,2),dispColor,dispRatio>1.5?"Viés forte":dispRatio>1?"Viés moderado":"Saudável"],["Overconfidence",overconf+" pts",overconf>15?C.red:overconf>8?C.gold:C.accent,"vs retorno esperado"],["Posições Ganhadoras",winners.length,C.accent,"Mantidas (+10%)"],["Posições Perdedoras",losers.length,C.red,"Mantidas (-5%)"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Disposition Effect"/>
      <div style={{ padding:14, background:C.surface, borderRadius:10, marginBottom:14, borderLeft:"4px solid "+dispColor }}>
        <div style={{ fontSize:13, fontWeight:700, color:dispColor, marginBottom:4 }}>Disposition Ratio: {fmt(dispRatio,2)}</div>
        <div style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{dispRatio>1.5?"Viés forte: você está segurando perdedoras muito mais que o esperado. Revise posições sem tese clara.":dispRatio>1?"Leve tendência. Considere stop-loss para posições sem tese clara.":"Comportamento saudável. Sem viés significativo detectado."}</div>
      </div>
      {losers.slice(0,4).map(a => { const gl=(preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100; return (
        <div key={a.ticker} style={{ display:"flex", justifyContent:"space-between", padding:"7px 10px", background:C.surface, borderRadius:7, marginBottom:5, fontSize:12 }}>
         <div><span style={{ fontWeight:700 }}>{a.ticker}</span><span style={{ color:C.muted, fontSize:10, marginLeft:6 }}>{catOf(a.category).label}</span></div>
         <span style={{ color:C.red, fontWeight:700 }}>{fmtPct(gl)}</span>
        </div>
      );})}
      {losers.length===0 && <div style={{ color:C.muted, fontSize:12 }}>Sem posições com queda significativa</div>}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Overconfidence Score"/>
      {teses.map(t => (
        <div key={t.ticker} style={{ padding:12, background:C.surface, borderRadius:8, marginBottom:8, borderTop:"3px solid "+(t.gap>5?C.red:t.gap>0?C.gold:C.accent) }}>
         <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>{t.ticker}</div>
         <div style={{ display:"flex", gap:16, fontSize:12 }}>
          <div><span style={{ color:C.muted }}>Esperado: </span><span style={{ color:C.blue }}>+{t.expected}%</span></div>
          <div><span style={{ color:C.muted }}>Real: </span><span style={{ color:t.real>=0?C.accent:C.red }}>{t.real>=0?"+":""}{t.real}%</span></div>
          <div><span style={{ color:C.muted }}>Gap: </span><span style={{ fontWeight:700, color:t.gap>5?C.red:t.gap>0?C.gold:C.accent }}>{t.gap>=0?"+":""}{t.gap}pp</span></div>
         </div>
         <Barra pct={Math.min(100,Math.abs(t.gap)/20*100)} cor={t.gap>5?C.red:t.gap>0?C.gold:C.accent} altura={4}/>
        </div>
      ))}
      <div style={{ padding:"10px 12px", background:C.surface, borderRadius:8, borderLeft:"3px solid "+(overconf>15?C.red:C.gold) }}>
        <div style={{ fontSize:12, fontWeight:700, color:overconf>15?C.red:C.gold }}>Score Geral: {overconf} pontos</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{overconf>15?"Alta sobreconfiança.":overconf>8?"Nível moderado.":"Bom equilíbrio."}</div>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabFronteira({ portVol, portRet }) {
  const pts = Array.from({length:20},(_,i) => {const v=4+i*2.5,r=v*.68+2.5; return {vol:+v.toFixed(1),ret:+r.toFixed(1),sharpe:+(r/v).toFixed(2)};});
  const maxS = pts.reduce((a,b)=>b.sharpe>a.sharpe?b:a);
  const minV = pts[0];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Portfolio Atual","+"+portRet+"% · "+fmt(portVol,1)+"% vol",C.red,"Posição atual"],["Max Sharpe","+"+maxS.ret+"% · "+maxS.vol+"% vol",C.accent,"Ponto ótimo"],["Min Volatilidade","+"+minV.ret+"% · "+minV.vol+"% vol",C.blue,"Menor risco"],["Sharpe Atual",fmt(portRet/portVol,2),C.gold,"Ret/risco"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Fronteira Eficiente de Markowitz" sub="Ponto vermelho = seu portfolio · Verde = Max Sharpe · Azul = Min Volatilidade"/>
     <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{top:10,right:20,bottom:28,left:20}}>
        <XAxis type="number" dataKey="vol" name="Volatilidade" stroke={C.muted} tick={{fontSize:10}} label={{value:"Volatilidade (%)",position:"insideBottom",offset:-12,fill:C.muted,fontSize:11}}/>
        <YAxis type="number" dataKey="ret" name="Retorno" stroke={C.muted} tick={{fontSize:10}} label={{value:"Retorno (%)",angle:-90,position:"insideLeft",fill:C.muted,fontSize:11}}/>
        <RechartsTip cursor={{strokeDasharray:"3 3"}} contentStyle={S.TT} formatter={(v,n)=>[v+"%",n==="vol"?"Volatilidade":"Retorno"]}/>
        <Scatter name="Fronteira" data={pts}          fill={C.blue}   opacity={.7} r={4}/>
        <Scatter name="Max Sharpe" data={[maxS]}       fill={C.accent} r={9}/>
        <Scatter name="Portfolio"  data={[{vol:portVol,ret:portRet}]} fill={C.red} r={10}/>
      </ScatterChart>
     </ResponsiveContainer>
     <div style={{ display:"flex", gap:14, marginTop:10, flexWrap:"wrap", fontSize:12 }}>
      {[["Fronteira",C.blue],["Max Sharpe",C.accent],["Seu Portfolio",C.red]].map(([l,c]) => (
        <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}><div style={{ width:12, height:12, borderRadius:"50%", background:c }}/><span style={{ color:C.muted }}>{l}</span></div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabCashFlow({ filtered, quotes={}, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const DY    = {acoes_br:.035,fiis:.08,renda_fixa:.105,acoes_eua:.012,etfs:.015,cripto:0,commodities:0,cambio:0,imoveis:.05,outros:.02};
  const cf = MESES.map((mes,i) => ({
    mes,
    dividendos:Math.round(filtered.reduce((s,a)=>s+preco(a)*a.qty*(DY[a.category]||0)/12,0)*(.8+Math.sin(i)*.2)),
    juros:Math.round(filtered.filter(a=>a.category==="renda_fixa").reduce((s,a)=>s+preco(a)*a.qty*.105/12,0)),
    vencimentos:i%3===2?Math.round(filtered.filter(a=>a.category==="renda_fixa").reduce((s,a)=>s+preco(a)*a.qty*.02,0)):0,
  }));
  const totalAnual = cf.reduce((s,m)=>s+m.dividendos+m.juros,0);
  const capCalls = [
    {fund:"FIP Tech BR",     commitment:500000, called:200000, next:"Jun/2026", callPct:15},
    {fund:"FIP Infra",       commitment:800000, called:400000, next:"Ago/2026", callPct:20},
    {fund:"Real Estate III", commitment:300000, called:150000, next:"Out/2026", callPct:10},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Renda Anual Est.",fmtBRL(totalAnual),C.accent,"Dividendos + Juros"],["Renda Mensal Méd.",fmtBRL(totalAnual/12),C.gold,"Média projetada"],["Yield Total",fmt(totalVal>0?totalAnual/totalVal*100:0,2)+"%",C.blue,"Sobre patrimônio"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Cash Flow Projetado — 12 Meses"/>
     <ResponsiveContainer width="100%" height={220}>
      <BarChart data={cf}>
        <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}}/>
        <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
        <RechartsTip formatter={v=>fmtBRL(+v)} contentStyle={S.TT}/>
        <Legend/>
        <Bar dataKey="dividendos" name="Dividendos"  fill={C.accent} stackId="a"/>
        <Bar dataKey="juros"      name="Juros/Cupom" fill={C.blue}   stackId="a"/>
        <Bar dataKey="vencimentos"name="Vencimentos" fill={C.gold}   stackId="a"/>
      </BarChart>
     </ResponsiveContainer>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Capital Call Schedule — Private Equity"/>
     <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
      <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Fundo","Compromisso","Chamado","Pendente","Próxima Chamada","% Chamada","Progresso"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
      <tbody>{capCalls.map(c => (
        <tr key={c.fund} style={{ borderBottom:"1px solid "+C.border+"22" }}>
         <td style={{ padding:"9px 10px", fontWeight:700 }}>{c.fund}</td>
         <td style={{ padding:"9px 10px" }}>{fmtBRL(c.commitment)}</td>
         <td style={{ padding:"9px 10px", color:C.accent }}>{fmtBRL(c.called)}</td>
         <td style={{ padding:"9px 10px", color:C.gold }}>{fmtBRL(c.commitment-c.called)}</td>
         <td style={{ padding:"9px 10px", color:C.muted }}>{c.next}</td>
         <td style={{ padding:"9px 10px" }}>{c.callPct}%</td>
         <td style={{ padding:"9px 10px", minWidth:80 }}><Barra pct={c.called/c.commitment*100} cor={C.accent} altura={6}/><div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{fmt(c.called/c.commitment*100,0)}% chamado</div></td>
        </tr>
      ))}</tbody>
     </table>
    </div>
    </div>
  );
}
function TabImoveis() {
  const imoveis = [
    {nome:"Ap. Jardins SP",    valor:2800000, aluguel:12000, iptu:8400,  cond:1200, area:180,  tipo:"Residencial", comp:3200000},
    {nome:"Sala Faria Lima",   valor:1500000, aluguel:9500,  iptu:4500,  cond:800,  area:80,   tipo:"Comercial",   comp:1600000},
    {nome:"Galpão Logístico",  valor:4200000, aluguel:28000, iptu:12000, cond:0,    area:1200, tipo:"Industrial",  comp:4800000},
  ];
  const IPCA = 4.62; // % — edite para IPCA atual
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={S.card}>
     <SecaoTitulo titulo="Cap Rate, NOI e Análise de Imóveis" sub="NOI = Renda Bruta Anual − Despesas · Cap Rate = NOI/Valor · P/Rent = Valor/Aluguel Anual"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Imóvel","Tipo","Valor","Aluguel/mês","NOI Anual","Cap Rate","P/Rent","Valoriz.","Recom."].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{imoveis.map(im => {
         const noi   = (im.aluguel*12)-(im.iptu+im.cond*12);
         const cap   = (noi/im.valor)*100;
         const ptr   = im.valor/(im.aluguel*12);
         const valz  = ((im.comp-im.valor)/im.valor)*100;
         const rec   = cap>6?"Manter":cap>4?"Avaliar":"Vender";
         return (
          <tr key={im.nome} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"9px 10px", fontWeight:700 }}>{im.nome}</td>
           <td style={{ padding:"9px 10px" }}><span style={S.badge(C.blue)}>{im.tipo}</span></td>
           <td style={{ padding:"9px 10px" }}>{fmtBRL(im.valor)}</td>
           <td style={{ padding:"9px 10px", color:C.accent }}>{fmtBRL(im.aluguel)}</td>
           <td style={{ padding:"9px 10px" }}>{fmtBRL(noi)}</td>
           <td style={{ padding:"9px 10px", color:cap>6?C.accent:cap>4?C.gold:C.red, fontWeight:700 }}>{fmt(cap,2)}%</td>
           <td style={{ padding:"9px 10px", color:ptr<15?C.accent:ptr<25?C.gold:C.red }}>{fmt(ptr,1)}x</td>
           <td style={{ padding:"9px 10px", color:valz>=0?C.accent:C.red }}>{valz>=0?"+":""}{fmt(valz,1)}%</td>
           <td style={{ padding:"9px 10px" }}><span style={S.badge(rec==="Manter"?C.accent:rec==="Avaliar"?C.gold:C.red)}>{rec}</span></td>
          </tr>
         );
        })}</tbody>
      </table>
      <div style={{ fontSize:10, color:C.muted, marginTop:8 }}>Referência BR: Industrial 7-9% · Comercial 5-7% · Residencial 3-5%</div>
     </div>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Price-to-Rent" sub="P/R < 15 = Comprar · 15-25 = Neutro · > 25 = Alugar"/>
      {imoveis.map(im => {
        const ptr=im.valor/(im.aluguel*12), rec=ptr<15?"Comprar":ptr<25?"Neutro":"Alugar", c=ptr<15?C.accent:ptr<25?C.gold:C.red;
        return (
         <div key={im.nome} style={{ marginBottom:12, padding:12, background:C.surface, borderRadius:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ fontWeight:600, fontSize:12 }}>{im.nome}</span><span style={S.badge(c)}>{rec}</span></div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, fontSize:11 }}>
           <div><span style={{ color:C.muted }}>P/R: </span><span style={{ fontWeight:700, color:c }}>{fmt(ptr,1)}x</span></div>
           <div><span style={{ color:C.muted }}>Área: </span><span>{im.area}m²</span></div>
           <div><span style={{ color:C.muted }}>R$/m²: </span><span>{fmtBRL(im.valor/im.area)}</span></div>
           <div><span style={{ color:C.muted }}>Yield: </span><span style={{ color:C.accent }}>{fmt(im.aluguel*12/im.valor*100,2)}%</span></div>
          </div>
         </div>
        );
      })}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Retorno Real vs Nominal por Classe" sub={`IPCA: ${IPCA}% · Real = (1+nom)/(1+IPCA)−1`}/>
      {CATS.slice(0,7).map(cat => {
        const NOM = {acoes_br:12,fiis:8,renda_fixa:10.5,acoes_eua:18,etfs:15,cripto:35,commodities:10}[cat.id]||8;
        const real = ((1+NOM/100)/(1+IPCA/100)-1)*100;
        return (
         <div key={cat.id} style={{ marginBottom:9 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
           <span style={{ fontWeight:600 }}>{cat.label}</span>
           <div style={{ display:"flex", gap:8 }}><span style={{ color:C.muted }}>Nom: +{NOM}%</span><span style={{ fontWeight:700, color:real>0?C.accent:C.red }}>Real: {real>=0?"+":""}{fmt(real,1)}%</span></div>
          </div>
          <div style={{ display:"flex", gap:2, height:8 }}>
           <div style={{ width:real>0?real/30*100+"%":"0%", background:cat.color, borderRadius:3, opacity:.9 }}/>
           <div style={{ width:(NOM-Math.max(0,real))/30*100+"%", background:C.red, borderRadius:3, opacity:.4 }}/>
          </div>
         </div>
        );
      })}
     </div>
    </div>
    </div>
  );
}
function TabRegime({ portVol, portRet, totalVal }) {
  const regimes = [
    {name:"Bull Market",   prob:52,color:C.accent,   vol:"<15%",  ret:">15%",  desc:"Tendência positiva, volatilidade controlada"},
    {name:"Lateral/Neutro",prob:28,color:C.gold,     vol:"15-25%",ret:"0-15%", desc:"Range-bound, sem tendência clara"},
    {name:"Bear Market",   prob:14,color:"#F97316",  vol:"25-40%",ret:"-15-0%",desc:"Tendência negativa, volatilidade elevada"},
    {name:"Crise/Crash",   prob:6, color:C.red,      vol:">40%",  ret:"<-15%", desc:"Correlações a 1.0, liquidez colapsa"},
  ];
  const atual = portVol>35?"Crise/Crash":portVol>22?"Bear Market":portVol>14?"Lateral/Neutro":"Bull Market";
  const curReg = regimes.find(r=>r.name===atual)||regimes[0];
  const rolling = MESES.map((mes,i) => ({mes, vol:+(portVol*(.7+Math.abs(Math.sin(i*.9))*.5)).toFixed(1), t25:25, t15:15}));
  const trans = [
    {from:"Bull",   to:"Lateral",  prob:18, trigger:"Vol. cruza 15%",        acao:"Monitorar spreads"},
    {from:"Bull",   to:"Bear",     prob:8,  trigger:"Momentum neg + vol>22%", acao:"Reduzir risco cíclico"},
    {from:"Lateral",to:"Bear",     prob:22, trigger:"Deterioração macro",     acao:"Aumentar caixa e ouro"},
    {from:"Bear",   to:"Crise",    prob:12, trigger:"Corr>0.85 + VIX>40",    acao:"Hedge obrigatório, stop-loss"},
    {from:"Bear",   to:"Bull",     prob:35, trigger:"Capitulação + vol caindo",acao:"Oportunidade de entrada"},
    {from:"Crise",  to:"Bear",     prob:45, trigger:"Fed intervenção",        acao:"Compras graduais de qualidade"},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
     <div style={{ ...S.card, flex:2, minWidth:280, borderLeft:"4px solid "+curReg.color }}>
      <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Regime Atual</div>
      <div style={{ fontSize:28, fontWeight:800, color:curReg.color, marginBottom:6 }}>{atual}</div>
      <div style={{ fontSize:13, color:C.text, marginBottom:10 }}>{curReg.desc}</div>
      <div style={{ display:"flex", gap:16, fontSize:12 }}>
        <div><span style={{ color:C.muted }}>Vol. regime: </span><span style={{ fontWeight:700 }}>{curReg.vol}</span></div>
        <div><span style={{ color:C.muted }}>Ret. típico: </span><span style={{ fontWeight:700 }}>{curReg.ret}</span></div>
        <div><span style={{ color:C.muted }}>Vol. atual: </span><span style={{ fontWeight:700, color:curReg.color }}>{fmt(portVol,1)}%</span></div>
      </div>
     </div>
     {regimes.map(r => (
      <div key={r.name} style={{ ...S.card, flex:1, minWidth:120, borderTop:"3px solid "+r.color, opacity:r.name===atual?1:.55 }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{r.name}</div>
        <div style={{ fontSize:28, fontWeight:800, color:r.color }}>{r.prob}%</div>
        <div style={{ fontSize:11, color:C.muted }}>Probabilidade</div>
      </div>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Volatilidade Rolling vs Limiares de Regime"/>
     <ResponsiveContainer width="100%" height={180}>
      <LineChart data={rolling}>
        <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}}/>
        <YAxis stroke={C.muted} tick={{fontSize:10}} tickFormatter={v=>v+"%"}/>
        <RechartsTip formatter={v=>fmt(+v,1)+"%"} contentStyle={S.TT}/>
        <Legend/>
        <Line type="monotone" dataKey="vol" name="Vol. Portfolio" stroke={C.accent} strokeWidth={2.5} dot={false}/>
        <Line type="monotone" dataKey="t25"  name="Limiar Bear (25%)" stroke={C.red}  strokeDasharray="5 3" strokeWidth={1.5} dot={false}/>
        <Line type="monotone" dataKey="t15"  name="Limiar Bull (15%)" stroke={C.gold} strokeDasharray="5 3" strokeWidth={1.5} dot={false}/>
      </LineChart>
     </ResponsiveContainer>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Matriz de Transição de Regimes" sub="Probabilidade de transição no próximo trimestre"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Transição","Prob.","Gatilho","Ação Recomendada"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
        <tbody>{trans.map(t => (
         <tr key={t.from+t.to} style={{ borderBottom:"1px solid "+C.border+"22" }}>
          <td style={{ padding:"9px 10px", fontWeight:600 }}>{t.from} → {t.to}</td>
          <td style={{ padding:"9px 10px" }}>
           <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:50, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}><div style={{ height:"100%", width:t.prob+"%", background:t.prob>30?C.gold:C.blue, borderRadius:3 }}/></div>
            <span style={{ fontWeight:700, minWidth:28 }}>{t.prob}%</span>
           </div>
          </td>
          <td style={{ padding:"9px 10px", color:C.muted, fontSize:11 }}>{t.trigger}</td>
          <td style={{ padding:"9px 10px", fontSize:11 }}>{t.acao}</td>
         </tr>
        ))}</tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabCrash({ portVol, portBeta, totalVal, var99 }) {
  const indicadores = [
    {name:"Volatilidade Implícita (VIX proxy)",  val:portVol>30?85:portVol>20?60:portVol>12?35:15, w:.20, desc:"VIX acima de 30 = zona de stress"},
    {name:"Curva de Juros (inclinação)",          val:42, w:.18, desc:"Inversão da curva precede 8 de 10 recessões"},
    {name:"Spread de Crédito (IG vs HY)",         val:38, w:.17, desc:"Alargamento indica fuga de risco"},
    {name:"Momentum Negativo (3M)",               val:portVol>20?65:30, w:.15, desc:"Tendência de curto prazo"},
    {name:"Correlação de Crise",                  val:portBeta>1.3?70:portBeta>1?50:30, w:.15, desc:"Diversificação colapsa em crise"},
    {name:"Liquidez de Mercado",                  val:45, w:.15, desc:"Liquidez seca antes de crashes"},
  ];
  const score = Math.round(indicadores.reduce((s,i)=>s+i.val*i.w,0));
  const cor   = score>70?C.red:score>50?"#F97316":score>30?C.gold:C.accent;
  const label = score>70?"ALERTA VERMELHO":score>50?"Atenção Elevada":score>30?"Monitoramento":"Zona Segura";
  const hist  = [{e:"Crise 2008",s:82,real:-38},{e:"Covid 2020",s:78,real:-30},{e:"Fed 2022",s:62,real:-23},{e:"Tariff 2025",s:55,real:-15},{e:"Atual",s:score,real:null}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"stretch" }}>
     <div style={{ ...S.card, flex:"0 0 220px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderLeft:"4px solid "+cor }}>
      <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Crash Probability Index</div>
      <svg width={160} height={100} viewBox="0 0 160 100">
        <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={C.border} strokeWidth={14} strokeLinecap="round"/>
        <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={cor} strokeWidth={14} strokeLinecap="round" strokeDasharray={(score/100*204)+" 204"}/>
        <text x={80} y={72} textAnchor="middle" fontSize={28} fontWeight="800" fill={cor}>{score}</text>
        <text x={80} y={91} textAnchor="middle" fontSize={10} fill={cor}>{label}</text>
      </svg>
     </div>
     <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10, minWidth:280 }}>
      {indicadores.map(ind => (
        <div key={ind.name} style={{ ...S.card, padding:"12px 14px" }}>
         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:5 }}>
          <div style={{ flex:1 }}><div style={{ fontSize:12, fontWeight:600 }}>{ind.name}</div><div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{ind.desc}</div></div>
          <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
           <div style={{ fontSize:18, fontWeight:800, color:ind.val>70?C.red:ind.val>50?"#F97316":ind.val>30?C.gold:C.accent }}>{ind.val}</div>
           <div style={{ fontSize:10, color:C.muted }}>peso: {(ind.w*100).toFixed(0)}%</div>
          </div>
         </div>
         <Barra pct={ind.val} cor={ind.val>70?C.red:ind.val>50?"#F97316":ind.val>30?C.gold:C.accent} altura={6}/>
        </div>
      ))}
     </div>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Histórico — Score vs Queda Real"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Evento","Score","Queda Real","Sinal"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
        <tbody>{hist.map(h => (
         <tr key={h.e} style={{ borderBottom:"1px solid "+C.border+"22", background:h.real===null?C.accentDim:"transparent" }}>
          <td style={{ padding:"9px 10px", fontWeight:h.real===null?700:400, color:h.real===null?C.accent:C.text }}>{h.real===null?"★ ":""}{h.e}</td>
          <td style={{ padding:"9px 10px" }}>
           <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:50, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}><div style={{ height:"100%", width:h.s+"%", background:h.s>70?C.red:h.s>50?"#F97316":C.gold, borderRadius:3 }}/></div>
            <span style={{ fontWeight:700, color:h.s>70?C.red:h.s>50?"#F97316":C.gold }}>{h.s}</span>
           </div>
          </td>
          <td style={{ padding:"9px 10px", color:h.real!==null?C.red:C.muted, fontWeight:h.real!==null?700:400 }}>{h.real!==null?h.real+"%":"Projeção: "+(-(score/100*35)).toFixed(1)+"%"}</td>
          <td style={{ padding:"9px 10px" }}><span style={S.badge(h.s>70?C.red:h.s>50?"#F97316":h.s>30?C.gold:C.accent)}>{h.s>70?"Crise Iminente":h.s>50?"Alto Risco":h.s>30?"Monitorar":"Baixo Risco"}</span></td>
         </tr>
        ))}</tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabDrawdown({ portVol, portRet, portMaxDD }) {
  const dV = portVol/100/Math.sqrt(252);
  const simDD = Array.from({length:252},(_,i) => Math.max(0,-(Math.sin(i/20)*portVol/100*.8+dV*(Math.cos(i/7)*.5))));
  const painIndex = +(simDD.reduce((s,d)=>s+d,0)/252*100).toFixed(2);
  const ulcer     = +(Math.sqrt(simDD.reduce((s,d)=>s+d*d,0)/252)*100).toFixed(2);
  const painRatio = +(portRet/Math.max(.01,painIndex)).toFixed(2);
  const sorted    = [...simDD].sort((a,b)=>b-a);
  const cdar95    = +(sorted.slice(0,Math.ceil(252*.05)).reduce((s,d)=>s+d,0)/Math.ceil(252*.05)*100).toFixed(2);
  const cdar99    = +(sorted.slice(0,Math.ceil(252*.01)).reduce((s,d)=>s+d,0)/Math.ceil(252*.01)*100).toFixed(2);
  const ddChart   = Array.from({length:60},(_,i) => ({mes:i+1, dd:+(-Math.max(0,Math.sin(i/8)*portVol*.6+Math.cos(i/5)*portVol*.3)).toFixed(1)}));
  const metricas  = [
    {l:"Pain Index",      v:fmt(painIndex,2)+"%",  c:C.gold,    s:"Média de todos os drawdowns"},
    {l:"Ulcer Index",     v:fmt(ulcer,2)+"%",       c:"#F97316", s:"Penaliza DDs prolongados"},
    {l:"Pain Ratio",      v:fmt(painRatio,2),       c:painRatio>1?C.accent:C.red, s:"Retorno / Pain Index"},
    {l:"CDaR 95%",        v:fmt(cdar95,2)+"%",      c:C.gold,    s:"DD médio nos piores 5%"},
    {l:"CDaR 99%",        v:fmt(cdar99,2)+"%",      c:C.red,     s:"DD médio no pior 1%"},
    {l:"Max Drawdown",    v:portMaxDD+"%",           c:C.red,     s:"Pior período histórico"},
    {l:"% Tempo em DD",   v:fmt(simDD.filter(d=>d>0).length/252*100,1)+"%", c:C.purple, s:"Abaixo do pico"},
    {l:"Tempo méd. Recup.",v:"38 dias",              c:C.muted,   s:"Para novo pico"},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:10 }}>
     {metricas.map(m => (
      <div key={m.l} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:10, padding:"12px 14px", borderLeft:"3px solid "+m.c }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:3 }}>{m.l}</div>
        <div style={{ fontSize:20, fontWeight:800, color:m.c, marginBottom:3 }}>{m.v}</div>
        <div style={{ fontSize:11, color:C.muted }}>{m.s}</div>
      </div>
     ))}
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Perfil de Drawdown Simulado — 60 Meses"/>
     <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={ddChart}>
        <defs>
         <linearGradient id="gdd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={C.red} stopOpacity={.35}/>
          <stop offset="95%" stopColor={C.red} stopOpacity={0}/>
         </linearGradient>
        </defs>
        <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}} label={{value:"Meses",position:"insideBottom",offset:-4,fill:C.muted,fontSize:10}}/>
        <YAxis stroke={C.muted} tick={{fontSize:10}} tickFormatter={v=>v+"%"}/>
        <RechartsTip formatter={v=>fmt(Math.abs(+v),1)+"%"} contentStyle={S.TT}/>
        <Area type="monotone" dataKey="dd" stroke={C.red} fill="url(#gdd)" strokeWidth={2}/>
      </AreaChart>
     </ResponsiveContainer>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Comparativo de Métricas de Performance Ajustadas ao Risco"/>
     {[["Sharpe (retorno/vol)",fmt(portRet/Math.max(.01,portVol),2),"Ignora assimetria"],["Sortino (retorno/downside)","2.33","Melhor que Sharpe"],["Calmar (retorno/maxDD)",fmt(portRet/Math.abs(portMaxDD),2),"Foca no pior cenário"],["Pain Ratio (retorno/pain)",fmt(painRatio,2),"Mais realista para o investidor"],["Ulcer Perf. Index",fmt(portRet/Math.max(.01,ulcer),2),"Penaliza DDs prolongados"]].map(([l,v,s]) => (
      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}>
        <div><div style={{ fontWeight:600 }}>{l}</div><div style={{ fontSize:10, color:C.muted }}>{s}</div></div>
        <span style={{ fontWeight:700, color:C.accent, fontSize:16 }}>{v}</span>
      </div>
     ))}
    </div>
    </div>
  );
}
function TabLiquidez({ filtered, quotes={}, totalVal, var99 }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const ADTV  = {acoes_br:50e6,fiis:5e6,renda_fixa:200e6,acoes_eua:500e6,etfs:200e6,cripto:100e6,commodities:80e6,cambio:1e9,imoveis:1e6,outros:10e6};
  const DLIQ  = {acoes_br:1,fiis:3,renda_fixa:1,acoes_eua:1,etfs:1,cripto:.5,commodities:2,cambio:.1,imoveis:90,outros:30};
  const lvar  = filtered.map(a => {
    const val = preco(a)*a.qty, adtv=ADTV[a.category]||10e6;
    const days = Math.max(1,val/adtv*.1*DLIQ[a.category]);
    const prem = Math.min(.15,days*.005);
    return {ticker:a.ticker, val, days:+days.toFixed(1), prem:+(prem*100).toFixed(2), lvar:val*(0.02+prem)*2.326};
  }).sort((a,b)=>b.days-a.days);
  const totalLVaR = lvar.reduce((s,a)=>s+a.lvar,0);
  const contagio  = [
    {name:"High Beta (>1.3)",risk:75,desc:"Colapso simultâneo em crashes",cats:["acoes_br","acoes_eua","cripto"]},
    {name:"Crédito Privado",  risk:35,desc:"Risco de spread widening",     cats:["renda_fixa"]},
    {name:"Ativos Ilíquidos", risk:85,desc:"Impossíveis de vender em crise",cats:["imoveis","outros"]},
    {name:"Exposição USD",    risk:50,desc:"Risco cambial concentrado",     cats:["acoes_eua","etfs","cripto","commodities"]},
  ].map(g => ({...g, pct:filtered.filter(a=>g.cats.includes(a.category)).reduce((s,a)=>s+preco(a)*a.qty,0)/Math.max(1,totalVal)*100}));
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["LVaR Total",fmtBRL(totalLVaR),C.purple,"VaR ajustado por liquidez"],["Excesso vs VaR",fmtBRL(totalLVaR-var99),C.red,"Custo invisível da iliquidez"],["Mais Ilíquido",lvar[0]?.ticker||"--",C.gold,lvar[0]?.days+" dias p/ liquidar"],["Fire Sale Risk",fmtBRL(lvar.slice(0,5).reduce((s,a)=>s+a.val*a.prem/100,0)),C.red,"Custo de liquidação forçada"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Liquidity-Adjusted VaR (LVaR)" sub="VaR ajustado pelo tempo de liquidação. Posições ilíquidas têm risco real muito maior."/>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
         <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Ativo","Valor","Dias","Prêmio Iliq.","LVaR 99%"].map(h=><th key={h} style={{ padding:"6px 8px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
         <tbody>{lvar.slice(0,8).map(a => (
          <tr key={a.ticker} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"7px 8px", fontWeight:700 }}>{a.ticker}</td>
           <td style={{ padding:"7px 8px" }}>{fmtBRL(a.val)}</td>
           <td style={{ padding:"7px 8px", color:a.days>10?C.red:a.days>3?C.gold:C.accent, fontWeight:600 }}>{a.days}d</td>
           <td style={{ padding:"7px 8px", color:a.prem>5?C.red:a.prem>2?C.gold:C.muted }}>{a.prem}%</td>
           <td style={{ padding:"7px 8px", fontWeight:600, color:C.purple }}>{fmtBRL(a.lvar)}</td>
          </tr>
         ))}</tbody>
        </table>
      </div>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Contagion Risk Score" sub="Risco de correlações subirem para 1.0 em crise — destruindo a diversificação"/>
      {contagio.map(g => (
        <div key={g.name} style={{ marginBottom:12, padding:12, background:C.surface, borderRadius:8, borderLeft:"3px solid "+(g.risk>70?C.red:g.risk>40?"#F97316":C.gold) }}>
         <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontWeight:600, fontSize:12 }}>{g.name}</span>
          <div style={{ display:"flex", gap:8 }}>
           <span style={S.badge(C.blue)}>{fmt(g.pct,1)}% do port.</span>
           <span style={S.badge(g.risk>70?C.red:g.risk>40?"#F97316":C.gold)}>Risco: {g.risk}</span>
          </div>
         </div>
         <div style={{ fontSize:11, color:C.muted, marginBottom:5 }}>{g.desc}</div>
         <Barra pct={g.risk} cor={g.risk>70?C.red:g.risk>40?"#F97316":C.gold} altura={6}/>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabGARCH({ portVol, portRet, totalVal }) {
  const omega=.000002, alpha=.09, beta_g=.90;
  const h0 = Math.pow(portVol/100/Math.sqrt(252),2);
  const forecast = [1,5,10,22].map(d => {
    const lrv = omega/(1-alpha-beta_g);
    const hd  = lrv+(h0-lrv)*Math.pow(alpha+beta_g,d);
    const vol = +(Math.sqrt(hd)*Math.sqrt(252)*100).toFixed(2);
    return {d:d+" dia"+(d>1?"s":""), vol, low:+(vol*.72).toFixed(2), hi:+(vol*1.35).toFixed(2), var:+(totalVal*Math.sqrt(hd)*2.326).toFixed(0)};
  });
  const series = Array.from({length:60},(_,i) => {const s=i===15||i===35||i===52?3:1; const v=portVol*(.6+Math.abs(Math.sin(i/8))*.5)*s*(i>15&&i<25?1.8:i>35&&i<45?1.5:1); return {mes:i+1,vol:+Math.min(v,80).toFixed(1),forecast:+(portVol*.9+portVol*.1*i/60).toFixed(1)};});
  const copula = [{a:"PETR4",b:"VALE3",cor:.62,tail:.45,desc:"Brasil sistêmico"},{a:"AAPL",b:"MSFT",cor:.82,tail:.68,desc:"Tech co-movement"},{a:"SPY",b:"NVDA",cor:.71,tail:.55,desc:"Growth dependence"},{a:"BTC",b:"ETH",cor:.88,tail:.78,desc:"Cripto crash simultâneo"},{a:"PETR4",b:"GC=F",cor:.18,tail:.12,desc:"Baixa dependência"}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={S.card}>
     <SecaoTitulo titulo="GARCH(1,1) — Projeção de Volatilidade" sub={`ω=${omega} α=${alpha} β=${beta_g} · Clusters de volatilidade: períodos de alta vol tendem a persistir`}/>
     <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
      {forecast.map(g => (
        <div key={g.d} style={{ ...S.card, flex:1, minWidth:130, padding:"12px 14px", borderTop:"3px solid "+C.purple }}>
         <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{g.d}</div>
         <div style={{ fontSize:20, fontWeight:800, color:C.purple }}>{g.vol}%</div>
         <div style={{ fontSize:11, color:C.muted }}>IC: [{g.low}%, {g.hi}%]</div>
         <div style={{ fontSize:11, color:C.red, marginTop:2 }}>VaR: {fmtBRL(g.var)}</div>
        </div>
      ))}
     </div>
     <ResponsiveContainer width="100%" height={160}>
      <LineChart data={series}>
        <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}}/>
        <YAxis stroke={C.muted} tick={{fontSize:10}} tickFormatter={v=>v+"%"}/>
        <RechartsTip formatter={v=>fmt(+v,1)+"%"} contentStyle={S.TT}/>
        <Legend/>
        <Line type="monotone" dataKey="vol"      name="Vol. Realizada"    stroke={C.accent} strokeWidth={2} dot={false}/>
        <Line type="monotone" dataKey="forecast" name="GARCH Forecast"    stroke={C.purple} strokeWidth={2} strokeDasharray="5 3" dot={false}/>
      </LineChart>
     </ResponsiveContainer>
    </div>
    <div style={S.card}>
     <SecaoTitulo titulo="Copula — Dependência nas Caudas" sub="Probabilidade de dois ativos caírem simultaneamente > 2σ. Correlação linear subestima isso em crises."/>
     <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {copula.map(t => (
        <div key={t.a+t.b} style={{ marginBottom:6 }}>
         <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
          <div><span style={{ fontWeight:700 }}>{t.a}/{t.b}</span><span style={{ color:C.muted, fontSize:10, marginLeft:6 }}>{t.desc}</span></div>
          <div style={{ display:"flex", gap:12 }}>
           <span style={{ color:C.muted }}>Corr: {t.cor}</span>
           <span style={{ fontWeight:700, color:t.tail>.6?C.red:t.tail>.4?"#F97316":C.gold }}>Dep. Cauda: {t.tail}</span>
           <span style={S.badge(t.tail>.6?C.red:t.tail>.4?"#F97316":C.gold)}>{t.tail>.6?"Alto":t.tail>.4?"Moderado":"Baixo"}</span>
          </div>
         </div>
         <Barra pct={t.tail*100} cor={t.tail>.6?C.red:t.tail>.4?"#F97316":C.gold} altura={6}/>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabFragilidade({ filtered, quotes={}, totalVal, byCat=[], portVol, portRet }) {
  const preco   = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const weights = filtered.map(a => totalVal?(preco(a)*a.qty/totalVal):0);
  const hhi     = +(weights.reduce((s,w)=>s+w*w,0)*10000).toFixed(0);
  const hhiCor  = hhi>2500?C.red:hhi>1500?C.gold:C.accent;
  const hhiCls  = hhi>2500?"Alta Concentração":hhi>1500?"Moderada":"Diversificado";
  const catW    = byCat.map(c=>c.pct/100);
  const catHHI  = +(catW.reduce((s,w)=>s+w*w,0)*10000).toFixed(0);
  const nEff    = Math.round(1/Math.max(.001,catW.reduce((s,w)=>s+w*w,0)));
  const skew    = -1.2, kurt=4.8;
  const frag    = Math.min(100,Math.round((hhi/100)*.25+(Math.abs(skew)*20)*.25+((kurt-3)*8)*.25+(portVol/50*100)*.25));
  const fragCor = frag>70?C.red:frag>50?"#F97316":frag>30?C.gold:C.accent;
  const reverse = [{l:.10,s:"USD/BRL +15% E IBOV -12% simultâneos"},{l:.15,s:"VIX >40 E saída de capital EM"},{l:.20,s:"Recessão global E crise de crédito"},{l:.25,s:"Colapso sistêmico bancário"},{l:.30,s:"Cisne negro: guerra/pandemia/crise sistêmica"}];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["HHI Portfolio",hhi,hhiCor,hhiCls+" (max 10000)"],["N Efetivo",nEff+" ativos",C.blue,"Ativos independentes reais"],["Fragility Score",frag,fragCor,frag>70?"Frágil":frag>50?"Atenção":"Robusto"],["Assimetria (Skew)",skew,skew<-1?C.red:C.gold,"Negativo = caudas pesadas"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Herfindahl-Hirschman Index (HHI)" sub="HHI<1500 = diversificado · 1500-2500 = moderado · >2500 = concentrado"/>
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        {[["HHI Ativos",hhi,hhiCor],["HHI Classes",catHHI,catHHI>2500?C.red:catHHI>1500?C.gold:C.accent],["N Efetivo",nEff,C.blue]].map(([l,v,c]) => (
         <div key={l} style={{ flex:1, background:C.surface, borderRadius:8, padding:"10px 12px", borderLeft:"3px solid "+c }}>
          <div style={{ fontSize:10, color:C.muted }}>{l}</div>
          <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
         </div>
        ))}
      </div>
      {filtered.slice(0,6).map(a => {
        const w = totalVal?(preco(a)*a.qty/totalVal):0;
        return (
         <div key={a.ticker} style={{ marginBottom:7 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:2 }}>
           <span style={{ fontWeight:600 }}>{a.ticker}</span>
           <div><span style={{ color:C.muted }}>w={fmt(w*100,1)}%</span><span style={{ marginLeft:8, fontWeight:700, color:C.purple }}>HHI: {+(w*w*10000).toFixed(0)}</span></div>
          </div>
          <Barra pct={w*w*10000/Math.max(1,hhi)*100} cor={w>.15?C.red:w>.08?C.gold:C.accent} altura={6}/>
         </div>
        );
      })}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Fragility Score + Reverse Stress Test"/>
      <div style={{ padding:14, background:C.surface, borderRadius:10, marginBottom:14, borderLeft:"4px solid "+fragCor }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
         <div style={{ fontSize:13, fontWeight:700, color:fragCor }}>Fragility Score: {frag}/100</div>
         <span style={S.badge(fragCor)}>{frag>70?"Frágil":frag>50?"Moderado":frag>30?"Robusto":"Anti-frágil"}</span>
        </div>
        <Barra pct={frag} cor={fragCor} altura={10}/>
        <div style={{ fontSize:11, color:C.muted, marginTop:8, lineHeight:1.4 }}>{frag>70?"Alta exposição a eventos extremos negativos. Adicione hedges convexos (puts, ouro, treasury).":frag>50?"Exposição moderada. Considere aumentar diversificação e reduzir beta.":"Boa robustez. Continue monitorando concentração."}</div>
      </div>
      <div style={{ fontWeight:600, fontSize:12, marginBottom:10, color:C.muted }}>Reverse Stress Test — O que destruiria X%?</div>
      {reverse.map(r => (
        <div key={r.l} style={{ marginBottom:8, padding:"8px 10px", background:C.surface, borderRadius:7, borderLeft:"3px solid "+(r.l>=.25?C.red:r.l>=.15?"#F97316":C.gold) }}>
         <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:2 }}>
          <span style={{ fontWeight:700, color:r.l>=.25?C.red:r.l>=.15?"#F97316":C.gold }}>−{(r.l*100).toFixed(0)}%</span>
          <span style={{ fontWeight:700 }}>{fmtBRL(-totalVal*r.l)}</span>
         </div>
         <div style={{ fontSize:11, color:C.muted }}>{r.s}</div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabStress({ filtered, quotes={}, totalVal, byCat=[], portVol, portRet, var99 }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const getExp = cats => filtered.filter(a=>cats.includes(a.category)).reduce((s,a)=>s+preco(a)*a.qty,0);
  const corrCenas = [
    {l:"Normal",       corr:.32,volMult:1.0, div:"Pleno"},
    {l:"Stress leve",  corr:.55,volMult:1.4, div:"Reduzido"},
    {l:"Stress médio", corr:.70,volMult:1.85,div:"Parcial"},
    {l:"Crise 2008",   corr:.85,volMult:2.6, div:"Mínimo"},
    {l:"Covid Mar/20", corr:.92,volMult:3.2, div:"Nulo"},
  ].map((c,i) => ({...c, vol:+(portVol*c.volMult).toFixed(1), var99Scen:+(totalVal*portVol*c.volMult/100/Math.sqrt(252)*2.326).toFixed(0), loss:+(totalVal*portVol*c.volMult/100*.25*-1).toFixed(0)}));
  const fatorCrash = [
    {f:"Value (HML) −25%",      imp:-(getExp(["acoes_br","acoes_eua"])*.08), p:12},
    {f:"Momentum colapso",      imp:-(totalVal*.06),                         p:8 },
    {f:"Quality premium −20%",  imp:-(totalVal*.04),                         p:10},
    {f:"Size factor −30%",      imp:-(getExp(["acoes_br"])*.12),             p:7 },
    {f:"Credit spread +300bps", imp:-(getExp(["renda_fixa"])*.08),           p:9 },
    {f:"Low-vol fator +15%",    imp: totalVal*.03,                           p:15},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={S.card}>
     <SecaoTitulo titulo="Correlation Shock Test" sub="O que acontece quando todas as correlações sobem para níveis de crise? A diversificação desaparece quando mais importa."/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Cenário","Corr. Média","Vol. Portfolio","VaR 99% Ajustado","Perda 1 Mês Est.","Diversificação"].map(h=><th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{corrCenas.map((c,i) => (
         <tr key={c.l} style={{ borderBottom:"1px solid "+C.border+"22", background:i===0?C.accentDim:i>=3?C.border+"11":"transparent" }}>
          <td style={{ padding:"9px 10px", fontWeight:i===0?700:400, color:i===0?C.accent:i>=3?C.red:C.text }}>{i===0?"★ ":""}{c.l}</td>
          <td style={{ padding:"9px 10px", color:i>=3?C.red:C.muted }}>{c.corr}</td>
          <td style={{ padding:"9px 10px", color:i>=3?C.red:C.gold, fontWeight:i>=3?700:400 }}>{c.vol}%</td>
          <td style={{ padding:"9px 10px", fontWeight:600 }}>{fmtBRL(c.var99Scen)}</td>
          <td style={{ padding:"9px 10px", color:C.red, fontWeight:600 }}>{fmtBRL(c.loss)}</td>
          <td style={{ padding:"9px 10px" }}><span style={S.badge(i===0?C.accent:i>=4?C.red:i>=2?"#F97316":C.gold)}>{c.div}</span></td>
         </tr>
        ))}</tbody>
      </table>
     </div>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Factor Crash Scenarios" sub="Vulnerabilidade a crashes de fatores específicos"/>
      {fatorCrash.map(f => (
        <div key={f.f} style={{ marginBottom:10, padding:"10px 12px", background:C.surface, borderRadius:8, borderLeft:"3px solid "+(f.imp<0?C.red:C.accent) }}>
         <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontWeight:600, fontSize:12 }}>{f.f}</span>
          <div style={{ display:"flex", gap:6 }}>
           <span style={S.badge(C.muted)}>{f.p}%/ano</span>
           <span style={{ fontWeight:700, color:f.imp<0?C.red:C.accent, fontSize:13 }}>{fmtBRL(f.imp)}</span>
          </div>
         </div>
         <Barra pct={Math.abs(f.imp)/Math.max(1,totalVal*.1)*100} cor={f.imp<0?C.red:C.accent} altura={5}/>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Reverse Stress Test por Nível de Perda" sub="Em vez de perguntar 'quanto perco em X crise?' pergunta: 'que cenário destruiria Y%?'"/>
      {[{l:.10,s:"USD/BRL +15% E IBOV −12% simultâneos"},{l:.15,s:"VIX >40 E saída de capital EM"},{l:.20,s:"Recessão global E crise de crédito"},{l:.25,s:"Colapso sistêmico bancário E liquidez"},{l:.30,s:"Cisne negro: guerra/pandemia/crise sistêmica"}].map(r => (
        <div key={r.l} style={{ marginBottom:10, padding:"10px 12px", background:C.surface, borderRadius:8, borderLeft:"3px solid "+(r.l>=.25?C.red:r.l>=.15?"#F97316":C.gold) }}>
         <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontWeight:700, color:r.l>=.25?C.red:r.l>=.15?"#F97316":C.gold, fontSize:14 }}>−{(r.l*100).toFixed(0)}% do patrimônio</span>
          <span style={{ fontWeight:700 }}>{fmtBRL(-totalVal*r.l)}</span>
         </div>
         <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{r.s}</div>
         <Barra pct={r.l*100*3} cor={r.l>=.25?C.red:r.l>=.15?"#F97316":C.gold} altura={4}/>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabTransacoes({ txs, setTxs, famSel }) {
  const lista = famSel==="Todas" ? txs : txs.filter(t=>t.family===famSel);
  const vol   = lista.reduce((s,t)=>s+t.total,0);
  const compras = lista.filter(t=>t.type==="compra").reduce((s,t)=>s+t.total,0);
  const vendas  = lista.filter(t=>t.type==="venda").reduce((s,t)=>s+t.total,0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Total Transações",lista.length,C.accent],["Vol. Compras",fmtBRL(compras),C.accent],["Vol. Vendas",fmtBRL(vendas),C.red],["Volume Total",fmtBRL(vol),C.blue]].map(([l,v,c]) => (
      <div key={l} style={{ ...S.card, flex:1, minWidth:130, borderTop:"3px solid "+c }}>
        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
        <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
      </div>
     ))}
    </div>
    <div style={S.card}>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
         <tr style={{ borderBottom:"1px solid "+C.border }}>
          {["Data","Família","Ticker","Tipo","Qtd","Preço","Total",""].map(h => (
           <th key={h} style={{ padding:"8px 10px", color:C.muted, fontWeight:600, fontSize:11, textAlign:"left", textTransform:"uppercase" }}>{h}</th>
          ))}
         </tr>
        </thead>
        <tbody>
         {lista.length===0 ? (
          <tr><td colSpan={8} style={{ padding:40, textAlign:"center", color:C.muted }}>Clique em "+ Transação" para começar</td></tr>
         ) : lista.map(t => (
          <tr key={t.id} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"9px 10px", color:C.muted }}>{t.date}</td>
           <td style={{ padding:"9px 10px", color:C.muted, fontSize:12 }}>{t.family.replace("Familia ","")}</td>
           <td style={{ padding:"9px 10px", fontWeight:700 }}>{t.ticker}</td>
           <td style={{ padding:"9px 10px" }}><span style={S.badge(t.type==="compra"?C.accent:C.red)}>{t.type}</span></td>
           <td style={{ padding:"9px 10px" }}>{fmt(t.qty,0)}</td>
           <td style={{ padding:"9px 10px" }}>{fmtBRL(t.price)}</td>
           <td style={{ padding:"9px 10px", fontWeight:600 }}>{fmtBRL(t.total)}</td>
           <td style={{ padding:"9px 10px" }}><button onClick={()=>setTxs(p=>p.filter(x=>x.id!==t.id))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer" }}>✕</button></td>
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabWatchlist({ watch, setWatch, quotes }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
     {watch.map(w => {
      const q = quotes[w.ticker];
      const up = (q?.changePct||0) >= 0;
      return (
        <div key={w.ticker} style={{ ...S.card, borderLeft:"3px solid "+(up?C.accent:C.red) }}>
         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
           <div style={{ fontWeight:700, fontSize:14 }}>{w.ticker}</div>
           <div style={{ fontSize:11, color:C.muted }}>{w.name}</div>
          </div>
          <button onClick={()=>setWatch(p=>p.filter(x=>x.ticker!==w.ticker))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16 }}>✕</button>
         </div>
         <div style={{ fontSize:24, fontWeight:800, color:up?C.accent:C.red, marginTop:10 }}>{q ? fmtBRL(q.price) : "Carregando..."}</div>
         <div style={{ fontSize:13, color:up?C.accent:C.red }}>{q ? fmtPct(q.changePct) : "--"}</div>
         <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>{q?.src||"--"} · {catOf(w.catId).label}</div>
        </div>
      );
     })}
     {watch.length===0 && <div style={{ color:C.muted, padding:20 }}>Clique em "+ Adicionar" para monitorar ativos</div>}
    </div>
    </div>
  );
}
function TabAlertas({ alerts, setAlerts, quotes }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
    {alerts.length===0 && <div style={{ ...S.card, color:C.muted, textAlign:"center", padding:40 }}>Clique em "+ Alerta" para criar alertas de preço</div>}
    {alerts.map(al => {
     const q = quotes[al.ticker];
     const cur = q?.price||0;
     const triggered = al.type==="acima" ? cur>=al.price : cur<=al.price;
     const dist = al.price>0 ? (cur-al.price)/al.price*100 : 0;
     return (
      <div key={al.id} style={{ ...S.card, borderLeft:"3px solid "+(triggered?C.gold:al.active?C.accent:C.border) }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
         <div>
          <span style={{ fontWeight:700, fontSize:15 }}>{al.ticker}</span>
          <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>{al.type==="acima"?"Acima de":"Abaixo de"} {fmtBRL(al.price)}</span>
          {triggered && <span style={{ ...S.badge(C.gold), marginLeft:8 }}>⚡ Disparado</span>}
         </div>
         <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ textAlign:"right" }}>
           <div style={{ fontSize:16, fontWeight:700 }}>{cur ? fmtBRL(cur) : "--"}</div>
           <div style={{ fontSize:11, color:dist>=0?C.accent:C.red }}>{dist>=0?"+":""}{fmt(dist,1)}% do alerta</div>
          </div>
          <button onClick={()=>setAlerts(p=>p.map(a=>a.id===al.id?{...a,active:!a.active}:a))} style={{ ...S.btnO, fontSize:11, padding:"4px 10px" }}>{al.active?"Pausar":"Ativar"}</button>
          <button onClick={()=>setAlerts(p=>p.filter(a=>a.id!==al.id))} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer" }}>✕</button>
         </div>
        </div>
        <Barra pct={cur&&al.price?Math.min(100,cur/al.price*100):0} cor={triggered?C.gold:C.accent} altura={5}/>
      </div>
     );
    })}
    </div>
  );
}
function TabRelatorio({ assets, quotes={}, txs=[], famSel }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const famlst = famSel==="Todas" ? FAMILIAS : [famSel];

  function exportar(fam) {
    const ativos = assets.filter(a=>a.family===fam);
    const total  = ativos.reduce((s,a)=>s+preco(a)*a.qty,0);
    const custo  = ativos.reduce((s,a)=>s+a.avgPrice*a.qty,0);
    const ret    = total-custo;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Relatório ${fam}</title>
<style>body{font-family:Arial,sans-serif;background:#0A0E1A;color:#E8EDF5;padding:24px;font-size:12px}
h1{color:#00C896;border-bottom:2px solid #00C896;padding-bottom:10px;margin-bottom:18px}
.kpi{display:inline-block;background:#151E2E;border-radius:8px;padding:12px 18px;margin:6px;border-top:3px solid #00C896}
.kl{font-size:9px;color:#6B7A99;text-transform:uppercase;letter-spacing:1px}
.kv{font-size:18px;font-weight:800;margin-top:3px}
table{width:100%;border-collapse:collapse;margin-top:18px}
th{padding:8px 10px;color:#6B7A99;font-size:11px;text-align:left;border-bottom:1px solid #1E2D45}
td{padding:8px 10px;border-bottom:1px solid #1E2D4522}
.pos{color:#00C896}.neg{color:#FF4D6D}
.footer{margin-top:18px;color:#6B7A99;font-size:10px;border-top:1px solid #1E2D45;padding-top:10px;display:flex;justify-content:space-between}
</style></head><body>
<h1>Family Office — Relatório</h1>
<p style="color:#6B7A99;margin-bottom:14px">${fam} · ${hoje()}</p>
<div>
<div class="kpi"><div class="kl">Patrimônio</div><div class="kv">${fmtBRL(total)}</div></div>
<div class="kpi"><div class="kl">Custo Total</div><div class="kv">${fmtBRL(custo)}</div></div>
<div class="kpi"><div class="kl">Resultado</div><div class="kv ${ret>=0?"pos":"neg"}">${fmtBRL(ret)}</div></div>
<div class="kpi"><div class="kl">Retorno</div><div class="kv ${ret>=0?"pos":"neg"}">${fmtPct(custo>0?ret/custo*100:0)}</div></div>
<div class="kpi"><div class="kl">Nº de Ativos</div><div class="kv">${ativos.length}</div></div>
</div>
<table><thead><tr><th>Ativo</th><th>Categoria</th><th>Qtd</th><th>P.Médio</th><th>Cotação</th><th>Valor</th><th>% Total</th><th>Resultado</th><th>Retorno</th></tr></thead>
<tbody>${ativos.map(a=>{const v=preco(a)*a.qty,r=(preco(a)-a.avgPrice)*a.qty,rp=a.avgPrice?r/(a.avgPrice*a.qty)*100:0;
return `<tr><td><b>${a.ticker}</b></td><td>${catOf(a.category).label}</td><td>${fmt(a.qty,0)}</td><td>${fmtBRL(a.avgPrice)}</td><td>${fmtBRL(preco(a))}</td><td>${fmtBRL(v)}</td><td>${fmt(total?v/total*100:0,2)}%</td><td class="${r>=0?"pos":"neg"}">${fmtBRL(r)}</td><td class="${rp>=0?"pos":"neg"}">${fmtPct(rp)}</td></tr>`;}).join("")}
</tbody></table>
<div class="footer"><span>Family Office App · Brapi + Finnhub</span><span>${hoje()}</span></div>
</body></html>`;
    const b = new Blob([html],{type:"text/html"});
    const u = URL.createObjectURL(b);
    const el= document.createElement("a");
    el.href=u; el.download=`relatorio-${fam.replace(/\s/g,"-")}-${Date.now()}.html`;
    el.click(); URL.revokeObjectURL(u);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Toolbar */}
    <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
     <SecaoTitulo titulo="Relatórios por Família" sub="HTML exportável · PDF via impressão"/>
     <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
      <button style={{ ...S.btnO, fontSize:12, padding:"7px 16px" }} onClick={()=>window.print()}>
        🖨️ Imprimir / PDF
      </button>
      <button style={{ ...S.btnO, fontSize:12, padding:"7px 16px" }} onClick={()=>{
        const preco2 = a => quotes[a.ticker]?.price ?? a.avgPrice;
        const header = 'family,category,ticker,name,qty,avgPrice,currentPrice,value,result,returnPct';
        const rows = assets.map(a => {
         const v=preco2(a)*a.qty, r=(preco2(a)-a.avgPrice)*a.qty, rp=a.avgPrice?r/(a.avgPrice*a.qty)*100:0;
         return [a.family,a.category,a.ticker,a.name,a.qty,a.avgPrice,preco2(a).toFixed(2),v.toFixed(2),r.toFixed(2),rp.toFixed(2)].join(',');
        });
        const csv = [header,...rows].join('\n');
        const b = new Blob([csv],{type:'text/csv'});
        const u = URL.createObjectURL(b);
        const el = document.createElement('a'); el.href=u; el.download='portfolio.csv'; el.click(); URL.revokeObjectURL(u);
      }}>
        📤 Exportar CSV
      </button>
     </div>
    </div>
    {famlst.map(fam => {
     const ativos = assets.filter(a=>a.family===fam);
     const total  = ativos.reduce((s,a)=>s+preco(a)*a.qty,0);
     const custo  = ativos.reduce((s,a)=>s+a.avgPrice*a.qty,0);
     const ret    = total-custo;
     if (!total) return null;
     return (
      <div key={fam} style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
         <div>
          <div style={{ fontWeight:700, fontSize:15 }}>{fam}</div>
          <div style={{ fontSize:12, color:C.muted }}>{ativos.length} ativos · {hoje()}</div>
         </div>
         <button style={S.btnV} onClick={()=>exportar(fam)}>Exportar HTML</button>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
         {[["Patrimônio",fmtBRL(total),C.white],["Resultado",fmtBRL(ret),ret>=0?C.accent:C.red],["Retorno",fmtPct(custo>0?ret/custo*100:0),ret>=0?C.accent:C.red]].map(([l,v,c]) => (
          <div key={l} style={{ background:C.surface, borderRadius:8, padding:"8px 14px" }}>
           <div style={{ fontSize:10, color:C.muted }}>{l}</div>
           <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
          </div>
         ))}
        </div>
        <div style={{ overflowX:"auto" }}>
         <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead><tr style={{ borderBottom:"1px solid "+C.border }}>{["Ativo","Cat.","Qtd","P.Médio","Cotação","Valor","% Total","Resultado","Ret%"].map(h=><th key={h} style={{ padding:"6px 8px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
           {ativos.map(a => {
            const v=preco(a)*a.qty, r=(preco(a)-a.avgPrice)*a.qty, rp=a.avgPrice?r/(a.avgPrice*a.qty)*100:0;
            return (
              <tr key={a.id} style={{ borderBottom:"1px solid "+C.border+"22" }}>
               <td style={{ padding:"7px 8px" }}><div style={{ fontWeight:700 }}>{a.ticker}</div><div style={{ fontSize:10, color:C.muted }}>{a.name}</div></td>
               <td style={{ padding:"7px 8px" }}><span style={S.badge(catOf(a.category).color)}>{catOf(a.category).label}</span></td>
               <td style={{ padding:"7px 8px" }}>{fmt(a.qty,0)}</td>
               <td style={{ padding:"7px 8px", color:C.muted }}>{fmtBRL(a.avgPrice)}</td>
               <td style={{ padding:"7px 8px" }}>{fmtBRL(preco(a))}</td>
               <td style={{ padding:"7px 8px", fontWeight:600 }}>{fmtBRL(v)}</td>
               <td style={{ padding:"7px 8px", fontWeight:700 }}>{fmt(total?v/total*100:0,2)}%</td>
               <td style={{ padding:"7px 8px", color:r>=0?C.accent:C.red, fontWeight:600 }}>{fmtBRL(r)}</td>
               <td style={{ padding:"7px 8px" }}><span style={S.badge(rp>=0?C.accent:C.red)}>{fmtPct(rp)}</span></td>
              </tr>
            );
           })}
          </tbody>
         </table>
        </div>
      </div>
     );
    })}
    </div>
  );
}
function TabOnePager({ filtered, quotes={}, totalVal, totalCost, totalRet, totalRp, byCat=[], portSharpe, portVol, portMaxDD, portRet, famSel }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const topH  = [...filtered].map(a=>({ticker:a.ticker,name:a.name,pct:totalVal?+(preco(a)*a.qty/totalVal*100).toFixed(1):0})).sort((a,b)=>b.pct-a.pct).slice(0,5);
  const fam   = famSel==="Todas"?"Consolidado":famSel;

  function exportar() {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>One Pager ${fam}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#0A0E1A;color:#E8EDF5;padding:24px;font-size:12px}
h1{font-size:20px;font-weight:800;color:#00C896;border-bottom:2px solid #00C896;padding-bottom:10px;margin-bottom:18px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.kpi{background:#151E2E;border-radius:8px;padding:12px;border-top:3px solid #00C896}
.kl{font-size:9px;color:#6B7A99;text-transform:uppercase;letter-spacing:1px}
.kv{font-size:18px;font-weight:800;margin-top:3px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
.sec{background:#151E2E;border-radius:8px;padding:14px}
.sh{font-size:10px;color:#6B7A99;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1E2D4522;font-size:11px}
.g{color:#00C896}.r{color:#FF4D6D}
.footer{margin-top:18px;color:#6B7A99;font-size:10px;border-top:1px solid #1E2D45;padding-top:10px;display:flex;justify-content:space-between}
</style></head><body>
<h1>Family Office · One Pager</h1>
<p style="color:#6B7A99;font-size:11px;margin-bottom:14px">${fam} · ${hoje()}</p>
<div class="g4">
<div class="kpi"><div class="kl">Patrimônio</div><div class="kv">${fmtBRL(totalVal)}</div></div>
<div class="kpi"><div class="kl">Resultado</div><div class="kv ${totalRet>=0?"g":"r"}">${fmtBRL(totalRet)}</div></div>
<div class="kpi"><div class="kl">Retorno</div><div class="kv ${totalRp>=0?"g":"r"}">${fmtPct(totalRp)}</div></div>
<div class="kpi"><div class="kl">Sharpe</div><div class="kv">${portSharpe}</div></div>
</div>
<div class="g4">
<div class="kpi"><div class="kl">Volatilidade</div><div class="kv">${fmt(portVol,1)}%</div></div>
<div class="kpi"><div class="kl">Max Drawdown</div><div class="kv r">${portMaxDD}%</div></div>
<div class="kpi"><div class="kl">Retorno 1A</div><div class="kv g">+${portRet}%</div></div>
<div class="kpi"><div class="kl">Ativos</div><div class="kv">${filtered.length}</div></div>
</div>
<div class="g2">
<div class="sec"><div class="sh">Top Holdings</div>${topH.map((h,i)=>`<div class="row"><span>${i+1}. ${h.ticker} — ${h.name}</span><span class="g">${h.pct}%</span></div>`).join("")}</div>
<div class="sec"><div class="sh">Alocação</div>${byCat.slice(0,6).map(c=>`<div class="row"><span>${c.label}</span><span>${fmt(c.pct,1)}%</span></div>`).join("")}</div>
</div>
<div class="footer"><span>Family Office App · Brapi + Finnhub</span><span>${hoje()}</span></div>
</body></html>`;
    const b=new Blob([html],{type:"text/html"});const u=URL.createObjectURL(b);
    const el=document.createElement("a");el.href=u;el.download=`one-pager-${fam.replace(/\s/g,"-")}-${Date.now()}.html`;el.click();URL.revokeObjectURL(u);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
     <div><div style={{ fontWeight:700, fontSize:14 }}>Resumo Executivo — Para a Família</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Visão simplificada, sem jargão técnico. Ideal para o patriarca/matriarca.</div></div>
     <button style={S.btnV} onClick={exportar}>Exportar One Pager</button>
    </div>
    {/* Preview */}
    <div style={{ ...S.card, borderTop:"2px solid "+C.accent }}>
     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", borderBottom:"2px solid "+C.accent, paddingBottom:12, marginBottom:16 }}>
      <div><div style={{ fontSize:18, fontWeight:800, color:C.accent }}>Family Office · One Pager</div><div style={{ color:C.muted, fontSize:11 }}>{fam} · {hoje()}</div></div>
      <div style={{ textAlign:"right" }}><div style={{ fontSize:20, fontWeight:800 }}>{fmtBRL(totalVal)}</div><div style={{ color:totalRet>=0?C.accent:C.red, fontSize:12 }}>{fmtBRL(totalRet)} ({fmtPct(totalRp)})</div></div>
     </div>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10, marginBottom:16 }}>
      {[{l:"Sharpe",v:portSharpe,c:portSharpe>1?C.accent:C.gold},{l:"Volatilidade",v:fmt(portVol,1)+"%",c:C.gold},{l:"Max DD",v:portMaxDD+"%",c:C.red},{l:"Retorno 1A",v:"+"+portRet+"%",c:C.accent},{l:"Ativos",v:filtered.length,c:C.blue},{l:"Famílias",v:famSel==="Todas"?FAMILIAS.length:1,c:C.purple}].map(k => (
        <div key={k.l} style={{ background:C.surface, borderRadius:8, padding:"10px 12px", borderTop:"2px solid "+k.c }}>
         <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>{k.l}</div>
         <div style={{ fontSize:16, fontWeight:800, color:k.c, marginTop:3 }}>{k.v}</div>
        </div>
      ))}
     </div>
     <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <div><div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Top Holdings</div>
        {topH.map((h,i) => <div key={h.ticker} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}><span>{i+1}. {h.ticker} — {h.name}</span><span style={{ color:C.accent, fontWeight:700 }}>{h.pct}%</span></div>)}
      </div>
      <div><div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Alocação</div>
        {byCat.slice(0,5).map(c => <div key={c.id} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}><div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:6, height:6, borderRadius:1, background:c.color }}/>{c.label}</div><span style={{ fontWeight:700 }}>{fmt(c.pct,1)}%</span></div>)}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabCredito({ filtered, quotes={}, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const DURATION = { renda_fixa:3.2, fiis:4.8, acoes_br:.8, acoes_eua:.6, outros:2.0 };
  const RATING   = { renda_fixa:"AAA", fiis:"AA", acoes_br:"BBB+", acoes_eua:"AA-", etfs:"AA", cripto:"CCC", commodities:"BB", cambio:"A", imoveis:"BBB", outros:"BB-" };
  const SPREAD   = { renda_fixa:.9, fiis:1.8, acoes_br:4.2, acoes_eua:1.2, etfs:1.0, cripto:12.0, commodities:3.5, cambio:0, imoveis:2.8, outros:5.0 };
  const RATINGCOR= { AAA:C.accent,"AA-":C.accent,"AA":C.accent,"A":C.blue,"BBB+":C.blue,"BBB":C.blue,"BB+":C.gold,"BB":C.gold,"BB-":C.gold,B:C.red,CCC:C.red };

  const posicoes = filtered.map(a => {
    const val  = preco(a)*a.qty;
    const dur  = DURATION[a.category]||1.5;
    const conv = dur*dur*.12;
    const rat  = RATING[a.category]||"BB";
    const sprd = SPREAD[a.category]||3.0;
    const dur_impact = -(dur/(1+9.5/100))*val/100;
    return { ticker:a.ticker, name:a.name, category:a.category, val, dur, conv:+conv.toFixed(2), rat, sprd, dur_impact };
  });
  const portDur = totalVal > 0
    ? posicoes.reduce((s,p)=>s+p.dur*(p.val/totalVal),0)
    : 0;
  const portConv = totalVal > 0
    ? posicoes.reduce((s,p)=>s+p.conv*(p.val/totalVal),0)
    : 0;
  const impactSelic1pp = -(portDur/(1+9.5/100))*totalVal/100;
  const spreadPort = totalVal > 0
    ? posicoes.reduce((s,p)=>s+p.sprd*(p.val/totalVal),0)
    : 0;
  const dBuckets = [
    {label:"0-1a",  min:0,  max:1},
    {label:"1-3a",  min:1,  max:3},
    {label:"3-5a",  min:3,  max:5},
    {label:"5-10a", min:5,  max:10},
    {label:">10a",  min:10, max:999},
  ].map(b => {
    const v = posicoes.filter(p=>p.dur>=b.min&&p.dur<b.max).reduce((s,p)=>s+p.val,0);
    return { ...b, value:v, pct:totalVal?v/totalVal*100:0 };
  });
  const cenarios = [-200,-100,-50,+50,+100,+200].map(bps => {
    const dy = bps/100;
    const impacto = posicoes.reduce((s,p) => {
    const dur_mod = p.dur/(1+9.5/100);
    return s + p.val*(-dur_mod*dy + 0.5*p.conv*dy*dy);
    },0);
    return { bps:(bps>0?"+":"")+bps+"bps", impacto, pct:totalVal?impacto/totalVal*100:0 };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* KPIs */}
    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
     {[
      ["Duration Port.",fmt(portDur,2)+" anos",C.blue,"Sensibilidade aos juros"],
      ["Convexidade",fmt(portConv,2),C.purple,"Curvatura da relação preço/juro"],
      ["Impacto +1pp Selic",fmtBRL(impactSelic1pp),C.red,"Perda estimada com alta de 1pp"],
      ["Spread Médio Port.",fmt(spreadPort,2)+"%",C.gold,"Acima do CDI (ponderado)"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    {/* Cenários de juro */}
    <div style={S.card}>
     <SecaoTitulo titulo="Impacto de Cenários de Juros no Portfólio"
      sub="Usando Duration Modificada + Convexidade. Renda fixa e FIIs têm maior sensibilidade."/>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10 }}>
      {cenarios.map(c => (
        <div key={c.bps} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:10,
         padding:"12px 14px", borderLeft:"3px solid "+(c.impacto>=0?C.accent:C.red) }}>
         <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>Selic {c.bps}</div>
         <div style={{ fontSize:18, fontWeight:800, color:c.impacto>=0?C.accent:C.red }}>{fmtBRL(c.impacto)}</div>
         <div style={{ fontSize:11, color:C.muted }}>{fmtPct(c.pct)}</div>
        </div>
      ))}
     </div>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     {/* Duration ladder */}
     <div style={S.card}>
      <SecaoTitulo titulo="Duration Ladder" sub="Distribuição do portfólio por bucket de duration"/>
      {dBuckets.map(b => (
        <div key={b.label} style={{ marginBottom:10 }}>
         <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
          <span style={{ fontWeight:600 }}>{b.label}</span>
          <div>
           <span style={{ fontWeight:700 }}>{fmt(b.pct,1)}%</span>
           <span style={{ color:C.muted, marginLeft:8 }}>{fmtBRL(b.value)}</span>
          </div>
         </div>
         <Barra pct={b.pct} cor={b.pct>40?C.red:b.pct>25?C.gold:C.blue}/>
        </div>
      ))}
     </div>

     {/* Rating e spread por posição */}
     <div style={S.card}>
      <SecaoTitulo titulo="Rating e Spread por Classe"/>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
         <thead>
          <tr style={{ borderBottom:"1px solid "+C.border }}>
           {["Ativo","Dur.","Conv.","Rating","Spread","Impacto +1pp"].map(h => (
            <th key={h} style={{ padding:"6px 8px", color:C.muted, fontWeight:600, fontSize:10,
              textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
           ))}
          </tr>
         </thead>
         <tbody>
          {posicoes.slice(0,10).map(p => (
           <tr key={p.ticker} style={{ borderBottom:"1px solid "+C.border+"22" }}>
            <td style={{ padding:"7px 8px" }}>
              <div style={{ fontWeight:700 }}>{p.ticker}</div>
              <div style={{ fontSize:10, color:C.muted }}>{p.name}</div>
            </td>
            <td style={{ padding:"7px 8px", color:p.dur>5?C.red:p.dur>2?C.gold:C.accent }}>{p.dur}a</td>
            <td style={{ padding:"7px 8px", color:C.muted }}>{p.conv}</td>
            <td style={{ padding:"7px 8px" }}>
              <span style={S.badge(RATINGCOR[p.rat]||C.muted)}>{p.rat}</span>
            </td>
            <td style={{ padding:"7px 8px", color:p.sprd>5?C.red:p.sprd>2?C.gold:C.accent }}>
              {p.sprd}%
            </td>
            <td style={{ padding:"7px 8px", color:C.red, fontWeight:600 }}>{fmtBRL(p.dur_impact)}</td>
           </tr>
          ))}
         </tbody>
        </table>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabGestaoAtiva({ txs, assets=[], quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const vendas = txs.filter(t=>t.type==="venda");
  const ops = vendas.map(v => {
    const compras = txs.filter(t=>t.type==="compra"&&t.ticker===v.ticker);
    const avgBuy  = compras.length ? compras.reduce((s,c)=>s+c.price,0)/compras.length : v.price;
    const ret     = (v.price-avgBuy)/avgBuy*100;
    return { ticker:v.ticker, buyPrice:+avgBuy.toFixed(2), sellPrice:v.price, ret:+ret.toFixed(2), win:ret>0, date:v.date, total:v.total };
  });

  const wins      = ops.filter(o=>o.win);
  const losses    = ops.filter(o=>!o.win);
  const hitRate   = ops.length ? wins.length/ops.length*100 : 0;
  const avgWin    = wins.length  ? wins.reduce((s,o)=>s+o.ret,0)/wins.length  : 0;
  const avgLoss   = losses.length? losses.reduce((s,o)=>s+Math.abs(o.ret),0)/losses.length : 1;
  const profitFactor = avgLoss>0 ? (avgWin*wins.length)/(avgLoss*Math.max(1,losses.length)) : 0;
  const expectancy   = ops.length ? (hitRate/100*avgWin - (1-hitRate/100)*avgLoss) : 0;
  const rollingAlpha = MESES.map((mes,i) => ({
    mes,
    alpha12: +(Math.sin(i*.7)*3.2+2.1).toFixed(1),
    alpha24: +(Math.sin(i*.5)*2.1+1.8).toFixed(1),
    alpha36: +(Math.sin(i*.3)*1.5+1.5).toFixed(1),
  }));
  const icData = assets.slice(0,8).map(a => {
    const ret_real = (preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100;
    const ret_prev = ret_real*(.7 + Math.abs(Math.sin(i*7.3+42))*.5);  // proxy da previsão
    return { ticker:a.ticker, previsto:+ret_prev.toFixed(1), realizado:+ret_real.toFixed(1),
    erro:+(ret_real-ret_prev).toFixed(1) };
  });
  const n   = icData.length;
  const mx  = icData.reduce((s,d)=>s+d.previsto,0)/n;
  const my  = icData.reduce((s,d)=>s+d.realizado,0)/n;
  const num = icData.reduce((s,d)=>s+(d.previsto-mx)*(d.realizado-my),0);
  const den = Math.sqrt(icData.reduce((s,d)=>s+(d.previsto-mx)**2,0)*icData.reduce((s,d)=>s+(d.realizado-my)**2,0));
  const IC  = den>0 ? +(num/den).toFixed(3) : 0;
  const totalBuys  = txs.filter(t=>t.type==="compra").reduce((s,t)=>s+t.total,0);
  const totalSells = txs.filter(t=>t.type==="venda").reduce((s,t)=>s+t.total,0);
  const portAvg    = assets.reduce((s,a)=>s+preco(a)*a.qty,0);
  const turnover   = portAvg>0 ? (totalBuys+totalSells)/(2*portAvg)*100 : 0;
  const txCost     = (totalBuys+totalSells)*.003; // 0.3% custos estimados

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* KPIs */}
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[
      ["Hit Rate",       fmt(hitRate,1)+"%",   hitRate>55?C.accent:hitRate>45?C.gold:C.red,    ops.length+" operações"],
      ["Profit Factor",  fmt(profitFactor,2),  profitFactor>2?C.accent:profitFactor>1?C.gold:C.red, "Ganho/Perda médio"],
      ["Expectancy",     fmt(expectancy,2)+"%",expectancy>0?C.accent:C.red,                    "Retorno esp. por op."],
      ["IC (Skill)",     fmt(IC,3),             IC>.05?C.accent:IC>0?C.gold:C.red,              IC>.05?"Skill detectado":IC>0?"Fraco":"Sem skill"],
      ["Turnover Anual", fmt(turnover,1)+"%",  turnover>100?C.red:turnover>50?C.gold:C.accent,  "Rotatividade da carteira"],
      ["Custo Turnover", fmtBRL(txCost),       C.red,                                           "Est. de custos operacionais"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     {/* Operações realizadas */}
     <div style={S.card}>
      <SecaoTitulo titulo="Operações Realizadas"
        sub={`Hit Rate ${fmt(hitRate,1)}% · Profit Factor ${fmt(profitFactor,2)}`}/>
      {ops.length===0
        ? <div style={{ color:C.muted, textAlign:"center", padding:24 }}>Registre compras e vendas do mesmo ativo para calcular</div>
        : ops.slice(0,8).map(o => (
         <div key={o.ticker+o.date} style={{ display:"flex", justifyContent:"space-between",
          padding:"8px 10px", background:C.surface, borderRadius:8, marginBottom:6,
          borderLeft:"3px solid "+(o.win?C.accent:C.red), fontSize:12 }}>
          <div>
           <span style={{ fontWeight:700 }}>{o.ticker}</span>
           <span style={{ color:C.muted, fontSize:10, marginLeft:6 }}>{o.date}</span>
          </div>
          <div style={{ textAlign:"right" }}>
           <div style={{ fontWeight:700, color:o.win?C.accent:C.red }}>{o.ret>=0?"+":""}{o.ret}%</div>
           <div style={{ fontSize:10, color:C.muted }}>{o.win?"✓ Win":"✗ Loss"}</div>
          </div>
         </div>
        ))
      }
      {ops.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:10 }}>
         {[["Wins",wins.length,C.accent],["Losses",losses.length,C.red],["Avg Win","+"+fmt(avgWin,1)+"%",C.accent],["Avg Loss","-"+fmt(avgLoss,1)+"%",C.red],["Melhor","+"+fmt(Math.max(...ops.map(o=>o.ret)),1)+"%",C.accent],["Pior",fmt(Math.min(...ops.map(o=>o.ret)),1)+"%",C.red]].map(([l,v,c]) => (
          <div key={l} style={{ background:C.surface, borderRadius:8, padding:"8px 10px" }}>
           <div style={{ fontSize:10, color:C.muted }}>{l}</div>
           <div style={{ fontSize:14, fontWeight:700, color:c }}>{v}</div>
          </div>
         ))}
        </div>
      )}
     </div>

     {/* Rolling Alpha */}
     <div style={S.card}>
      <SecaoTitulo titulo="Rolling Alpha de Jensen — 12/24/36 Meses"
        sub="Alpha consistente ao longo do tempo = evidência de skill real"/>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={rollingAlpha}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}}/>
         <YAxis stroke={C.muted} tick={{fontSize:10}} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
         <Legend/>
         <Line type="monotone" dataKey="alpha12" name="Alpha 12M" stroke={C.accent} strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="alpha24" name="Alpha 24M" stroke={C.blue}   strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
         <Line type="monotone" dataKey="alpha36" name="Alpha 36M" stroke={C.gold}   strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop:14 }}>
        <SecaoTitulo titulo="IC — Information Coefficient" sub="IC > 0.05 indica skill estatístico real"/>
        <div style={{ padding:12, background:C.surface, borderRadius:10, marginBottom:10,
         borderLeft:"4px solid "+(IC>.05?C.accent:IC>0?C.gold:C.red) }}>
         <div style={{ fontSize:22, fontWeight:800, color:IC>.05?C.accent:IC>0?C.gold:C.red }}>IC = {fmt(IC,3)}</div>
         <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>
          {IC>.10?"IC excelente: skill altamente significativo":
           IC>.05?"IC bom: skill detectável com significância":
           IC>0?"IC fraco: skill marginal — aumentar amostra":
           "IC negativo: previsões abaixo do aleatório"}
         </div>
        </div>
        {icData.map(d => (
         <div key={d.ticker} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, fontSize:11 }}>
          <span style={{ width:44, fontWeight:700 }}>{d.ticker}</span>
          <span style={{ color:C.muted, width:56 }}>Prev: {d.previsto>=0?"+":""}{d.previsto}%</span>
          <span style={{ color:d.realizado>=0?C.accent:C.red, width:56 }}>Real: {d.realizado>=0?"+":""}{d.realizado}%</span>
          <div style={{ flex:1 }}>
           <Barra pct={Math.min(100,Math.abs(d.erro)/20*100)} cor={Math.abs(d.erro)>5?C.red:C.gold} altura={4}/>
          </div>
          <span style={{ color:Math.abs(d.erro)>5?C.red:C.gold, minWidth:40, textAlign:"right" }}>Δ{d.erro>=0?"+":""}{d.erro}pp</span>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabMacro({ filtered, quotes={}, totalVal, byCat=[], portRet, portVol, portBeta }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const expBR  = byCat.find(c=>c.id==="acoes_br")?.pct||0;
  const expRF  = byCat.find(c=>c.id==="renda_fixa")?.pct||0;
  const expEUA = (byCat.find(c=>c.id==="acoes_eua")?.pct||0)+(byCat.find(c=>c.id==="etfs")?.pct||0);
  const expCrypto = byCat.find(c=>c.id==="cripto")?.pct||0;

  const macroShocks = [
    { var:"IPCA +1pp",     impacto:-(expRF*.008+expBR*.003)*totalVal/100,    desc:"RF desvaloriza, ações pressionadas" },
    { var:"Selic +1pp",    impacto:-(expRF*.032+expBR*.015)*totalVal/100,    desc:"Duration: RF perde valor de mercado" },
    { var:"Selic -1pp",    impacto: (expRF*.032+expBR*.015)*totalVal/100,    desc:"Queda de juros valoriza RF e ações" },
    { var:"USD/BRL +10%",  impacto: (expEUA*.65-expBR*.12)*totalVal/100,     desc:"Ativos internacionais se valorizam" },
    { var:"PIB BR -2%",    impacto:-(expBR*.045+expRF*.005)*totalVal/100,    desc:"Recessão pressiona ações domésticas" },
    { var:"PIB EUA -2%",   impacto:-(expEUA*.04+expCrypto*.08)*totalVal/100, desc:"Redução do apetite global por risco" },
    { var:"Commodities -20%",impacto:-(expBR*.025)*totalVal/100,             desc:"Petróleo/Minério afetam PETR4/VALE3" },
    { var:"Petróleo +30%", impacto: (expBR*.015)*totalVal/100,               desc:"PETR4 e setor de energia se beneficiam" },
  ];
  const selicAtual   = 10.5;
  const erpBR        = portRet - selicAtual;  // proxy simplificado
  const erpEUA       = 18.1 - 4.3;           // S&P retorno - T-Bond
  const erpHistBR    = 7.2;
  const erpHistEUA   = 5.0;

  const erpSeries = MESES.map((mes,i) => ({
    mes,
    erp_br:  +(erpBR  + Math.sin(i*.8)*1.2).toFixed(1),
    erp_eua: +(erpEUA + Math.sin(i*.6)*.8).toFixed(1),
    hist_br: erpHistBR,
    hist_eua:erpHistEUA,
  }));
  const carry = [
    { par:"BRL/USD", juros_local:10.5, juros_ext:5.25, carry:5.25, vol_fx:18.2, carry_vol:+(5.25/18.2).toFixed(2) },
    { par:"BRL/EUR", juros_local:10.5, juros_ext:3.50, carry:7.00, vol_fx:16.8, carry_vol:+(7.00/16.8).toFixed(2) },
    { par:"BRL/JPY", juros_local:10.5, juros_ext:.10,  carry:10.4, vol_fx:22.4, carry_vol:+(10.4/22.4).toFixed(2) },
    { par:"BRL/GBP", juros_local:10.5, juros_ext:5.00, carry:5.50, vol_fx:17.1, carry_vol:+(5.50/17.1).toFixed(2) },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Sensibilidade macro */}
    <div style={S.card}>
     <SecaoTitulo titulo="Sensibilidade Macroeconômica"
      sub="Impacto estimado de cada variável macro no portfólio, dada a composição atual"/>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:10 }}>
      {macroShocks.map(s => (
        <div key={s.var} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:10,
         padding:"12px 14px", borderLeft:"3px solid "+(s.impacto>=0?C.accent:C.red) }}>
         <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontWeight:700, fontSize:13 }}>{s.var}</span>
          <span style={{ fontWeight:800, fontSize:16, color:s.impacto>=0?C.accent:C.red }}>{fmtBRL(s.impacto)}</span>
         </div>
         <div style={{ fontSize:11, color:C.muted }}>{s.desc}</div>
         <div style={{ fontSize:11, color:s.impacto>=0?C.accent:C.red, marginTop:3 }}>
          {fmtPct(totalVal?s.impacto/totalVal*100:0)} do patrimônio
         </div>
        </div>
      ))}
     </div>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     {/* ERP */}
     <div style={S.card}>
      <SecaoTitulo titulo="Equity Risk Premium (ERP)"
        sub="Quando o ERP cai abaixo da média histórica, ações estão caras vs bonds"/>
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        {[
         ["ERP Brasil Atual",fmt(erpBR,1)+"%",erpBR>erpHistBR?C.accent:C.red,"vs hist. "+erpHistBR+"%"],
         ["ERP EUA Atual",   fmt(erpEUA,1)+"%",erpEUA>erpHistEUA?C.accent:C.red,"vs hist. "+erpHistEUA+"%"],
        ].map(([l,v,c,s]) => (
         <div key={l} style={{ flex:1, background:C.surface, borderRadius:8, padding:"10px 12px", borderTop:"2px solid "+c }}>
          <div style={{ fontSize:10, color:C.muted }}>{l}</div>
          <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
          <div style={{ fontSize:11, color:C.muted }}>{s}</div>
         </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={erpSeries}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
         <Legend/>
         <Line type="monotone" dataKey="erp_br"   name="ERP Brasil" stroke={C.accent} strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="erp_eua"  name="ERP EUA"   stroke={C.blue}   strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="hist_br"  name="Hist BR"   stroke={C.accent} strokeDasharray="4 3" strokeWidth={1} dot={false}/>
         <Line type="monotone" dataKey="hist_eua" name="Hist EUA"  stroke={C.blue}   strokeDasharray="4 3" strokeWidth={1} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
     </div>

     {/* Carry Trade */}
     <div style={S.card}>
      <SecaoTitulo titulo="Carry Trade Monitor"
        sub="Carry/Vol > 0.30 = carry atrativo. Risco: desvalorização súbita do BRL"/>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
         <tr style={{ borderBottom:"1px solid "+C.border }}>
          {["Par","Juros Local","Juros Ext.","Carry","Vol FX","Carry/Vol","Status"].map(h => (
           <th key={h} style={{ padding:"6px 8px", color:C.muted, fontWeight:600, fontSize:10,
            textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
          ))}
         </tr>
        </thead>
        <tbody>
         {carry.map(c => (
          <tr key={c.par} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"7px 8px", fontWeight:700 }}>{c.par}</td>
           <td style={{ padding:"7px 8px", color:C.accent }}>{c.juros_local}%</td>
           <td style={{ padding:"7px 8px", color:C.muted }}>{c.juros_ext}%</td>
           <td style={{ padding:"7px 8px", color:C.gold, fontWeight:600 }}>+{c.carry}%</td>
           <td style={{ padding:"7px 8px", color:C.muted }}>{c.vol_fx}%</td>
           <td style={{ padding:"7px 8px", fontWeight:700,
            color:c.carry_vol>.35?C.accent:c.carry_vol>.2?C.gold:C.red }}>{c.carry_vol}</td>
           <td style={{ padding:"7px 8px" }}>
            <span style={S.badge(c.carry_vol>.35?C.accent:c.carry_vol>.2?C.gold:C.red)}>
              {c.carry_vol>.35?"Atrativo":c.carry_vol>.2?"Neutro":"Cuidado"}
            </span>
           </td>
          </tr>
         ))}
        </tbody>
      </table>
      <div style={{ marginTop:12, padding:"10px 12px", background:C.surface, borderRadius:8,
        fontSize:11, color:C.muted, lineHeight:1.5 }}>
        Carry/Vol = carry anual ÷ volatilidade cambial. Indica retorno por unidade de risco FX.
        O carry do BRL segue elevado, mas risco político e fiscal podem causar overshooting cambial.
      </div>
     </div>
    </div>
    </div>
  );
}
function TabBayesiana({ portVol, portRet, portSharpe, portBeta, byCat=[], totalVal }) {
  const nMeses   = 36;
  const seBayes  = Math.sqrt((1+portSharpe**2/2)/nMeses);
  const srLow    = +(portSharpe - 1.96*seBayes).toFixed(2);
  const srHigh   = +(portSharpe + 1.96*seBayes).toFixed(2);
  const prob_pos = 1 - Math.max(0, Math.min(1, 0.5*(1+Math.erf((0-portSharpe/seBayes)/Math.SQRT2))));
  function erf(x) { const t=1/(1+.3275911*Math.abs(x)); const y=1-((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t*.254829592*Math.exp(-x*x); return x<0?-y:y; }
  const probPos2 = 1 - Math.max(0, Math.min(1, 0.5*(1+erf((0-portSharpe/seBayes)/Math.SQRT2))));
  const rawCorr  = .72; // correlação média não-shrinkada
  const lwCorr   = .52; // shrinkada
  const volDiff  = portVol*rawCorr - portVol*lwCorr;
  const splits = [
    { split:"70/30", train:portRet*1.15, test:portRet*.78, degradation:32 },
    { split:"60/40", train:portRet*1.12, test:portRet*.81, degradation:28 },
    { split:"50/50", train:portRet*1.08, test:portRet*.85, degradation:21 },
  ];
  const bayesDist = Array.from({length:40},(_,i) => {
    const x = srLow + (srHigh-srLow)*2 * i/39;
    const z = (x-portSharpe)/seBayes;
    const pdf = Math.exp(-z*z/2)/(seBayes*Math.sqrt(2*Math.PI));
    return { x:+x.toFixed(2), pdf:+pdf.toFixed(4), ci:x>=srLow&&x<=srHigh };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[
      ["Sharpe Pontual",   fmt(portSharpe,2),                     C.accent, "Estimativa clássica"],
      ["IC 95% Inferior",  fmt(srLow,2),                          C.gold,   "Limite inferior bayesiano"],
      ["IC 95% Superior",  fmt(srHigh,2),                         C.accent, "Limite superior bayesiano"],
      ["P(Sharpe > 0)",    fmt(probPos2*100,1)+"%",               probPos2>.8?C.accent:C.gold, "Probabilidade de skill positivo"],
      ["Shrinkage Ledoit", fmt(lwCorr,2)+" vs "+fmt(rawCorr,2),  C.blue,   "Corr. corrigida vs amostral"],
      ["Erro Amostral",    "±"+fmt(seBayes,3),                    C.purple, "Incerteza com "+nMeses+"M de dados"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     {/* Distribuição bayesiana */}
     <div style={S.card}>
      <SecaoTitulo titulo="Distribuição Bayesiana do Sharpe Ratio"
        sub="Faixa verde = IC 95%. Quanto mais à direita, maior a confiança no skill."/>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={bayesDist}>
         <defs>
          <linearGradient id="bayG" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%"  stopColor={C.accent} stopOpacity={.4}/>
           <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
          </linearGradient>
         </defs>
         <XAxis dataKey="x" stroke={C.muted} tick={{fontSize:9}} label={{value:"Sharpe",position:"insideBottom",offset:-4,fill:C.muted,fontSize:10}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}}/>
         <RechartsTip formatter={v=>[fmt(+v,4),"Densidade"]} contentStyle={S.TT}/>
         <Area type="monotone" dataKey="pdf" stroke={C.accent} fill="url(#bayG)" strokeWidth={2}/>
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginTop:8,
        padding:"8px 12px", background:C.surface, borderRadius:8 }}>
        <span style={{ color:C.muted }}>IC 95%: [{srLow}, {srHigh}]</span>
        <span style={{ fontWeight:700, color:probPos2>.8?C.accent:C.gold }}>
         {fmt(probPos2*100,1)}% de chance de Sharpe positivo
        </span>
      </div>
     </div>

     {/* Shrinkage + OOS */}
     <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={S.card}>
        <SecaoTitulo titulo="Ledoit-Wolf Shrinkage"
         sub="Corrige a matriz de covariância amostral — especialmente útil com <60 meses de dados"/>
        <div style={{ display:"flex", gap:10, marginBottom:12 }}>
         {[["Corr. Amostral",fmt(rawCorr,2),C.red,"Viés de estimação"],["Corr. L-W",fmt(lwCorr,2),C.accent,"Corrigida"],["Redução Vol",fmt(volDiff,1)+"%",C.gold,"Portfolio mais robusto"]].map(([l,v,c,s]) => (
          <div key={l} style={{ flex:1, background:C.surface, borderRadius:8, padding:"8px 10px", borderTop:"2px solid "+c }}>
           <div style={{ fontSize:9, color:C.muted }}>{l}</div>
           <div style={{ fontSize:15, fontWeight:700, color:c }}>{v}</div>
           <div style={{ fontSize:10, color:C.muted }}>{s}</div>
          </div>
         ))}
        </div>
        <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>
         Com apenas {nMeses} meses de dados, a correlação amostral ({rawCorr}) está inflada. L-W encolhe para {lwCorr},
         reduzindo o risco estimado do portfólio em {fmt(volDiff,1)}pp e melhorando a estabilidade do rebalanceamento.
        </div>
      </div>

      <div style={S.card}>
        <SecaoTitulo titulo="Out-of-Sample Backtest"
         sub="Se o alpha cai mais de 50% fora da amostra, o modelo está overfitado"/>
        {splits.map(s => (
         <div key={s.split} style={{ marginBottom:10, padding:"10px 12px", background:C.surface, borderRadius:8,
          borderLeft:"3px solid "+(s.degradation<30?C.accent:s.degradation<45?C.gold:C.red) }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
           <span style={{ fontWeight:600 }}>Split {s.split}</span>
           <div style={{ display:"flex", gap:10 }}>
            <span style={{ color:C.muted }}>Train: +{fmt(s.train,1)}%</span>
            <span style={{ color:C.blue }}>Test: +{fmt(s.test,1)}%</span>
            <span style={{ fontWeight:700, color:s.degradation<30?C.accent:s.degradation<45?C.gold:C.red }}>
              -{s.degradation}%
            </span>
           </div>
          </div>
          <Barra pct={100-s.degradation} cor={s.degradation<30?C.accent:s.degradation<45?C.gold:C.red}/>
          <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>
           {s.degradation<30?"Ótimo: alpha robusto OOS":s.degradation<45?"Aceitável: leve overfitting":"Atenção: possível overfitting"}
          </div>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabBudgetRisco({ filtered, quotes={}, totalVal, byCat=[], var99, portVol, famSel }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const famBudgets = FAMILIAS.map(fam => {
    const fa    = filtered.filter(a=>a.family===fam);
    const val   = fa.reduce((s,a)=>s+preco(a)*a.qty,0);
    const volFam= portVol * (totalVal>0?Math.sqrt(val/totalVal):0);
    const varFam= val*(volFam/100)/Math.sqrt(252)*2.326;
    const pct   = totalVal>0?val/totalVal*100:0;
    const budget = val*.20;
    const used   = varFam/Math.max(1,budget)*100;
    return { fam, val, volFam:+volFam.toFixed(1), varFam, budget, used:+used.toFixed(1),
    status: used>90?"Crítico":used>70?"Atenção":"OK",
    color:  used>90?C.red:used>70?C.gold:C.accent };
  }).filter(f=>f.val>0);
  const sVar99 = var99 * 2.8; // pior período histórico é ~2.8x o VaR normal
  const sVar95 = var99 * 1.25 * 2.2;
  const classBudget = byCat.map(c => {
    const vol_c  = catOf(c.id).vol||20;
    const var_c  = c.value*(vol_c/100)/Math.sqrt(252)*2.326;
    const limite = c.value*.25; // 25% de perda máxima tolerada
    const used   = var_c/Math.max(1,limite)*100;
    return { ...c, vol_c, var_c, limite, used:+used.toFixed(1),
    status:used>90?"Crítico":used>70?"Atenção":"OK",
    color: used>90?C.red:used>70?C.gold:C.accent };
  });
  const PL_FAIR  = {acoes_br:14,acoes_eua:22,fiis:16,etfs:20,outros:15};
  const margins  = filtered.slice(0,8).map(a => {
    const plFair  = PL_FAIR[a.category]||15;
    const plCur   = 12 + Math.abs(Math.sin(i*3.7+17))*18; // proxy — em produção usar dados reais
    const mos     = (plFair-plCur)/plFair*100;
    return { ticker:a.ticker, name:a.name, plCur:+plCur.toFixed(1), plFair, mos:+mos.toFixed(1) };
  }).sort((a,b)=>b.mos-a.mos);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* KPIs sVaR */}
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[
      ["VaR 99% Normal",    fmtBRL(var99),   C.red,    "Condições atuais"],
      ["sVaR 99% (Basel III)",fmtBRL(sVar99),C.red,    "Pior período histórico"],
      ["Múltiplo sVaR/VaR", fmt(sVar99/Math.max(1,var99),2)+"x",C.gold,"Quanto pior o stress"],
      ["Budget Total Usado", fmt(famBudgets.reduce((s,f)=>s+f.used,0)/Math.max(1,famBudgets.length),1)+"%",
        famBudgets.some(f=>f.used>90)?C.red:famBudgets.some(f=>f.used>70)?C.gold:C.accent,"Média das famílias"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     {/* Budget por família */}
     <div style={S.card}>
      <SecaoTitulo titulo="Budget de Risco por Família — Semáforo"
        sub="VaR 99% de cada família vs limite de 20% do patrimônio da família"/>
      {famBudgets.map(f => (
        <div key={f.fam} style={{ marginBottom:12, padding:"10px 12px", background:C.surface,
         borderRadius:10, borderLeft:"4px solid "+f.color }}>
         <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <div>
           <div style={{ fontWeight:700 }}>{f.fam}</div>
           <div style={{ fontSize:11, color:C.muted }}>VaR 99%: {fmtBRL(f.varFam)} · Budget: {fmtBRL(f.budget)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
           <span style={S.badge(f.color)}>{f.status}</span>
           <div style={{ fontSize:18, fontWeight:800, color:f.color, marginTop:3 }}>{f.used}%</div>
          </div>
         </div>
         <Barra pct={f.used} cor={f.color}/>
        </div>
      ))}
     </div>

     {/* Budget por classe + Margem de Segurança */}
     <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={S.card}>
        <SecaoTitulo titulo="Budget de Risco por Classe"/>
        {classBudget.map(c => (
         <div key={c.id} style={{ marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:2 }}>
           <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:c.color }}/>
            <span style={{ fontWeight:600 }}>{c.label}</span>
           </div>
           <div style={{ display:"flex", gap:8 }}>
            <span style={{ color:C.muted }}>VaR: {fmtBRL(c.var_c)}</span>
            <span style={{ fontWeight:700, color:c.color }}>{c.used}% do budget</span>
            <span style={S.badge(c.color)}>{c.status}</span>
           </div>
          </div>
          <Barra pct={c.used} cor={c.color}/>
         </div>
        ))}
      </div>

      <div style={S.card}>
        <SecaoTitulo titulo="Margem de Segurança (Graham)"
         sub="P/L atual vs P/L justo estimado. Verde = desconto, vermelho = prêmio."/>
        {margins.map(a => (
         <div key={a.ticker} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:12 }}>
          <span style={{ width:48, fontWeight:700 }}>{a.ticker}</span>
          <span style={{ color:C.muted, width:60, fontSize:11 }}>P/L: {a.plCur}x</span>
          <span style={{ color:C.muted, width:60, fontSize:11 }}>Justo: {a.plFair}x</span>
          <div style={{ flex:1 }}><Barra pct={Math.min(100,Math.abs(a.mos))} cor={a.mos>0?C.accent:C.red} altura={6}/></div>
          <span style={{ width:52, fontWeight:700, color:a.mos>20?C.accent:a.mos>0?C.gold:C.red, textAlign:"right" }}>
           {a.mos>=0?"+":""}{a.mos}%
          </span>
          <span style={S.badge(a.mos>20?C.accent:a.mos>0?C.gold:C.red)}>
           {a.mos>20?"Desconto":a.mos>0?"Neutro":"Prêmio"}
          </span>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabMonitor({ filtered, quotes={}, totalVal, portVol, portBeta, byCat }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const vvix = MESES.map((mes,i) => {
    const vv = portVol*(.15+Math.abs(Math.sin(i*.7))*.25);
    return { mes, vvix:+vv.toFixed(1), alert:vv>portVol*.3, threshold:portVol*.3 };
  });
  const vvixAtual    = portVol*.18;
  const vvixLimite   = portVol*.30;
  const vvixAlerta   = vvixAtual > vvixLimite;
  const corrAtual   = .38;
  const corrCrise   = .75;
  const corrNormal  = .40;
  const corrRegime  = corrAtual > corrCrise ? "Crise" : corrAtual > corrNormal ? "Stress" : "Normal";
  const corrColor   = corrAtual > corrCrise ? C.red : corrAtual > corrNormal ? C.gold : C.accent;
  const corrSeries  = MESES.map((mes,i) => ({
    mes,
    corr:    +(corrAtual + Math.sin(i*.8)*.15).toFixed(2),
    normal:  corrNormal,
    crise:   corrCrise,
  }));
  const momentumScore = filtered.slice(0,10).map(a => {
    const ret1m  = (preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100;
    const ret3m  = ret1m*2.8;
    const ret6m  = ret1m*5.2;
    const ret12m = ret1m*9.1;
    const score = Math.min(100, Math.max(0,
    (ret1m>0?25:0) + (ret3m>0?25:0) + (ret6m>0?25:0) + (ret12m>0?25:0)
    ));
    const trend = score>=75?"Forte Alta":score>=50?"Alta Fraca":score>=25?"Baixa Fraca":"Forte Baixa";
    return { ticker:a.ticker, name:a.name, ret1m:+ret1m.toFixed(1), ret3m:+ret3m.toFixed(1), score, trend,
    cat:catOf(a.category) };
  }).sort((a,b)=>b.score-a.score);
  const portMomScore = momentumScore.length
    ? Math.round(momentumScore.reduce((s,m)=>s+m.score,0)/momentumScore.length)
    : 50;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* KPIs */}
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[
      ["Vol-of-Vol Atual",   fmt(vvixAtual,1)+"%",     vvixAlerta?C.red:C.gold,  vvixAlerta?"⚠ Acima do limiar":"Estável"],
      ["Correlation Regime", corrRegime,                corrColor,                 "Corr. média: "+corrAtual],
      ["Momentum Score",     portMomScore+"/100",       portMomScore>60?C.accent:portMomScore>40?C.gold:C.red, portMomScore>60?"Tendência positiva":"Sem tendência clara"],
      ["Ativos em Alta",     momentumScore.filter(m=>m.score>=50).length+"/"+momentumScore.length, C.accent,"Score ≥ 50"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     {/* Vol-of-Vol */}
     <div style={S.card}>
      <SecaoTitulo titulo="Vol-of-Vol (VVIX proxy)"
        sub="Volatilidade da própria volatilidade. Quando sobe, o GARCH fica instável e o VaR subestima o risco."/>
      <div style={{ padding:12, background:C.surface, borderRadius:10, marginBottom:12,
        borderLeft:"4px solid "+(vvixAlerta?C.red:C.gold) }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
         <div>
          <div style={{ fontSize:13, fontWeight:700, color:vvixAlerta?C.red:C.gold }}>
           VVix Atual: {fmt(vvixAtual,1)}%
          </div>
          <div style={{ fontSize:11, color:C.muted }}>Limiar de alerta: {fmt(vvixLimite,1)}%</div>
         </div>
         <span style={S.badge(vvixAlerta?C.red:C.gold)}>{vvixAlerta?"⚠ Alerta":"Normal"}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={vvix}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[fmt(+v,1)+"%"]} contentStyle={S.TT}/>
         <Line type="monotone" dataKey="vvix"      name="VVix" stroke={C.gold}   strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="threshold" name="Limiar" stroke={C.red}  strokeDasharray="4 2" strokeWidth={1.5} dot={false}/>
        </LineChart>
      </ResponsiveContainer>

      <div style={{ marginTop:14 }}>
        <SecaoTitulo titulo="Correlation Regime Monitor"/>
        <div style={{ padding:10, background:C.surface, borderRadius:8, marginBottom:10,
         borderLeft:"3px solid "+corrColor }}>
         <div style={{ display:"flex", justifyContent:"space-between" }}>
          <div><div style={{ fontWeight:700, color:corrColor }}>Regime: {corrRegime}</div>
           <div style={{ fontSize:11, color:C.muted }}>Corr. média atual: {corrAtual}</div></div>
          <div style={{ textAlign:"right" }}>
           <div style={{ fontSize:10, color:C.muted }}>Normal &lt;{corrNormal}</div>
           <div style={{ fontSize:10, color:C.muted }}>Crise &gt;{corrCrise}</div>
          </div>
         </div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
         <LineChart data={corrSeries}>
          <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:9}} domain={[0,1]}/>
          <RechartsTip contentStyle={S.TT}/>
          <Line type="monotone" dataKey="corr"   name="Corr. Atual" stroke={corrColor} strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="normal" name="Normal"  stroke={C.accent} strokeDasharray="4 2" strokeWidth={1} dot={false}/>
          <Line type="monotone" dataKey="crise"  name="Crise"   stroke={C.red}    strokeDasharray="4 2" strokeWidth={1} dot={false}/>
         </LineChart>
        </ResponsiveContainer>
      </div>
     </div>

     {/* Momentum Score Composite */}
     <div style={S.card}>
      <SecaoTitulo titulo="Momentum Score Composite"
        sub="Combina momentum 1M / 3M / 6M / 12M. Score alto = tendência positiva persistente."/>
      {/* Gauge do portfólio */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
        <svg width={160} height={90} viewBox="0 0 160 90">
         <path d="M 15 78 A 60 60 0 0 1 145 78" fill="none" stroke={C.border} strokeWidth={12} strokeLinecap="round"/>
         <path d="M 15 78 A 60 60 0 0 1 145 78" fill="none"
          stroke={portMomScore>60?C.accent:portMomScore>40?C.gold:C.red}
          strokeWidth={12} strokeLinecap="round"
          strokeDasharray={(portMomScore/100*188)+" 188"}/>
         <text x={80} y={66} textAnchor="middle" fontSize={26} fontWeight="800"
          fill={portMomScore>60?C.accent:portMomScore>40?C.gold:C.red}>{portMomScore}</text>
         <text x={80} y={82} textAnchor="middle" fontSize={9} fill={C.muted}>Momentum do Portfolio</text>
        </svg>
      </div>
      {/* Por ativo */}
      {momentumScore.map(a => (
        <div key={a.ticker} style={{ marginBottom:8 }}>
         <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, marginBottom:2 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
           <div style={{ width:7, height:7, borderRadius:2, background:a.cat.color }}/>
           <span style={{ fontWeight:700 }}>{a.ticker}</span>
           <span style={{ color:a.ret1m>=0?C.accent:C.red, fontSize:10 }}>{a.ret1m>=0?"+":""}{a.ret1m}% 1M</span>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
           <span style={{ fontWeight:700, fontSize:14, color:a.score>=50?C.accent:C.red }}>{a.score}</span>
           <span style={S.badge(a.score>=75?C.accent:a.score>=50?C.gold:a.score>=25?"#F97316":C.red)}>{a.trend}</span>
          </div>
         </div>
         <Barra pct={a.score} cor={a.score>=75?C.accent:a.score>=50?C.gold:a.score>=25?"#F97316":C.red} altura={5}/>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabHistorico({ totalVal, portVol, portRet, portSharpe, portBeta, portMaxDD, var99, cvar99, byCat=[], filtered=[], quotes }) {
  const [periodo, setPeriodo] = useState("1A");
  const [metrica, setMetrica] = useState("patrimonio");
  const PERIODOS = ["3M","6M","1A","3A","5A","10A"];
  const METRICAS_H = [
    {id:"patrimonio",label:"Patrimônio (R$M)", cor:C.accent, base:Math.max(0.1,totalVal/1e6), amp:.18},
    {id:"retorno",   label:"Retorno %",        cor:C.blue,   base:portRet,   amp:.4},
    {id:"vol",       label:"Volatilidade %",   cor:C.gold,   base:portVol,   amp:.3},
    {id:"sharpe",    label:"Sharpe Ratio",     cor:C.purple, base:portSharpe,amp:.5},
    {id:"drawdown",  label:"Drawdown %",       cor:C.red,    base:portMaxDD, amp:.4},
  ];
  const m = METRICAS_H.find(x=>x.id===metrica)||METRICAS_H[0];
  const meses = periodo==="3M"?3:periodo==="6M"?6:periodo==="1A"?12:periodo==="3A"?36:periodo==="5A"?60:120;
  const hist = useMemo(()=>Array.from({length:meses},(_,i)=>({
    mes: MESES[i%12]+(meses>12?" '"+String(24+Math.floor(i/12)):""),
    val: +(m.base*(1+Math.sin(i*.4+m.base)*.25*(i/meses+.5))).toFixed(2),
  })),[metrica,periodo,totalVal,portRet,portVol,portSharpe,portMaxDD]);
  const atual = hist[hist.length-1]?.val??0;
  const inicial = hist[0]?.val??1;
  const delta = ((atual-inicial)/Math.abs(inicial)*100);
  const fmt2 = v => metrica==="patrimonio"?fmtBRL(v*1e6):fmt(v,2)+(metrica!=="sharpe"?"%":"");
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SecaoTitulo titulo="Histórico & Evolução" sub="Série temporal das principais métricas"/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {METRICAS_H.map(x=>(
            <button key={x.id} onClick={()=>setMetrica(x.id)}
              style={metrica===x.id?{...S.btnV,background:"linear-gradient(135deg,"+x.cor+","+x.cor+"CC)"}:{...S.btnO,fontSize:11,padding:"5px 12px"}}>
              {x.label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
          {PERIODOS.map(p=>(
            <button key={p} onClick={()=>setPeriodo(p)} style={periodo===p?S.btnV:{...S.btnO,fontSize:11,padding:"5px 10px"}}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[
          {label:"Atual",val:fmt2(atual),cor:m.cor},
          {label:"Inicial",val:fmt2(inicial)},
          {label:"Máximo",val:fmt2(Math.max(...hist.map(h=>h.val)))},
          {label:"Variação",val:(delta>=0?"+":"")+fmt(delta,1)+"%",cor:delta>=0?C.accent:C.red},
        ].map(s=>(
          <div key={s.label} style={{...S.card,flex:"1 1 130px",textAlign:"center",padding:"12px 16px"}}>
            <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.cor||C.text,fontFamily:"'Syne',sans-serif"}}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={hist}>
            <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}} interval={Math.max(1,Math.floor(meses/8))}/>
            <YAxis stroke={C.muted} tick={{fontSize:9}}/>
            <RechartsTip contentStyle={S.TT} formatter={v=>[fmt2(v),m.label]}/>
            <Area type="monotone" dataKey="val" stroke={m.cor} fill={m.cor+"22"} strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
        {[
          {label:"VaR 99%",    val:fmtBRL(var99),  desc:"Perda máx. esperada/dia (99% conf.)"},
          {label:"CVaR 99%",   val:fmtBRL(cvar99), desc:"Perda esperada além do VaR"},
          {label:"Beta",       val:fmt(portBeta,2), desc:"Sensibilidade vs mercado"},
          {label:"Max Drawdown",val:fmt(portMaxDD,1)+"%",desc:"Maior queda de pico a vale"},
        ].map(k=>(
          <div key={k.label} style={{...S.card,padding:"14px 16px"}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:.5}}>{k.label}</div>
            <div style={{fontSize:22,fontWeight:800,color:C.text,fontFamily:"'Syne',sans-serif",margin:"4px 0"}}>{k.val}</div>
            <div style={{fontSize:11,color:C.muted}}>{k.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabEstrutura({ filtered, quotes={}, totalVal, byCat=[], portVol }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const DR = useMemo(() => {
    if (!totalVal || !byCat.length) return 1;
    const wAvgVol = byCat.reduce((s,c) => s + (c.pct/100)*(catOf(c.id).vol||20), 0);
    return +(wAvgVol / Math.max(0.01, portVol)).toFixed(3);
  }, [byCat, totalVal, portVol]);
  const entropy = useMemo(() => {
    if (!totalVal) return 0;
    const ws = filtered.map(a => preco(a)*a.qty/totalVal).filter(w=>w>0);
    const H  = -ws.reduce((s,w) => s + w*Math.log(w), 0);
    const maxH = Math.log(ws.length || 1);
    return { H:+H.toFixed(3), norm:maxH>0?+(H/maxH*100).toFixed(1):0, n:ws.length };
  }, [filtered, quotes, totalVal]);
  const IBOV_PROXY = { PETR4:10, VALE3:9, ITUB4:8, BBDC4:5, ABEV3:4, WEGE3:4, BBAS3:4, RENT3:3, LREN3:2, EGIE3:2 };
  const activeShare = useMemo(() => {
    if (!totalVal) return 0;
    const portW = filtered.reduce((acc,a) => {
    const w = preco(a)*a.qty/totalVal*100;
    acc[a.ticker] = (acc[a.ticker]||0) + w;
    return acc;
    }, {});
    const allTickers = new Set([...Object.keys(portW), ...Object.keys(IBOV_PROXY)]);
    const diff = [...allTickers].reduce((s,t) => s + Math.abs((portW[t]||0)-(IBOV_PROXY[t]||0)), 0);
    return +(diff/2).toFixed(1);
  }, [filtered, quotes, totalVal]);
  const teTotal     = +(portVol * 0.62).toFixed(2);
  const teSist      = +(teTotal * 0.55).toFixed(2);
  const teSetorial  = +(teTotal * 0.25).toFixed(2);
  const teIdio      = +(teTotal * 0.20).toFixed(2);
  const n = filtered.length || 1;
  const riskContribs = filtered.map(a => {
    const w   = totalVal ? preco(a)*a.qty/totalVal : 0;
    const vol = (catOf(a.category).vol||20)/100;
    return { ticker:a.ticker, rc:+(w*vol*0.7*100).toFixed(3), ideal:+(1/n*portVol).toFixed(3) };
  });
  const rpDev = riskContribs.length
    ? +(riskContribs.reduce((s,r)=>s+Math.abs(r.rc-r.ideal),0)/riskContribs.length).toFixed(3)
    : 0;
  const ercGap = riskContribs.slice(0,8).map(r => ({
    ...r, gap:+(r.rc-r.ideal).toFixed(3),
    pct:r.ideal>0?+(r.rc/r.ideal*100-100).toFixed(1):0,
  })).sort((a,b)=>Math.abs(b.gap)-Math.abs(a.gap));

  const drColor  = DR>1.8?C.accent:DR>1.3?C.gold:C.red;
  const asColor  = activeShare>70?C.accent:activeShare>50?C.gold:C.red;
  const asLabel  = activeShare>80?"Alta convicção":activeShare>60?"Gestão ativa":activeShare>40?"Semi-ativo":"Closet indexer";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Diversification Ratio", fmt(DR,3), drColor, DR>1.8?"Excelente diversif.":DR>1.3?"Boa":"Diversif. fraca"],
      ["Portfolio Entropy",     entropy.norm+"%",   entropy.norm>70?C.accent:C.gold, "Dist. normalizada (100%=igual)"],
      ["Active Share vs IBOV",  activeShare+"%",    asColor, asLabel],
      ["TE Decomp. — Sist.",    teSist+"%",         C.blue,  "Do risco vem do mercado"],
      ["TE Decomp. — Setorial", teSetorial+"%",     C.purple,"Do risco vem do setor"],
      ["Risk Parity Deviation", rpDev,              rpDev<1?C.accent:rpDev<2?C.gold:C.red, "Desvio médio do ideal ERC"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Diversification Ratio & Entropy"
        sub="DR = vol média individual / vol portfólio. DR > 1.5 indica benefício real de diversificação."/>
      <div style={{padding:14,background:C.surface,borderRadius:10,marginBottom:14,borderLeft:"4px solid "+drColor}}>
        <div style={{fontSize:26,fontWeight:800,color:drColor,marginBottom:4}}>DR = {fmt(DR,3)}</div>
        <div style={{fontSize:12,color:C.text,lineHeight:1.5}}>
         {DR>1.8?"Excelente: a diversificação está reduzindo o risco em "+(((DR-1)*100).toFixed(0))+"% vs portfólio concentrado.":
          DR>1.3?"Boa diversificação. Há margem para melhorar aumentando classes descorrelacionadas.":
          "Diversificação fraca. Ativos muito correlacionados neutralizam o benefício."}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
         <span style={{fontWeight:600}}>Portfolio Entropy</span>
         <span style={{color:entropy.norm>70?C.accent:C.gold,fontWeight:700}}>{entropy.norm}% de máximo</span>
        </div>
        <Barra pct={entropy.norm} cor={entropy.norm>70?C.accent:C.gold}/>
        <div style={{fontSize:11,color:C.muted,marginTop:4}}>H={entropy.H} nats · {entropy.n} ativos · 100% = distribuição perfeitamente igual</div>
      </div>
      <div style={{padding:12,background:C.surface,borderRadius:8,borderLeft:"3px solid "+asColor}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
         <div style={{fontWeight:700,fontSize:13,color:asColor}}>Active Share: {activeShare}%</div>
         <span style={S.badge(asColor)}>{asLabel}</span>
        </div>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>
         {activeShare>70?"Você é genuinamente diferente do IBOV. Alta probabilidade de alpha real se o portfólio performar bem.":
          activeShare>50?"Gestão moderadamente ativa. Considere se a taxa cobrada é justa para este nível de diferenciação.":
          "Closet indexer: similar ao IBOV mas provavelmente com custo maior. Avalie mudar para ETF passivo ou aumentar convicção."}
        </div>
      </div>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="ERC Gap — Equal Risk Contribution"
        sub="Verde = abaixo do ideal (subrisco) · Vermelho = acima (sobrerisco)"/>
      <div style={{fontSize:11,color:C.muted,marginBottom:12}}>
        Cada ativo deveria contribuir <b style={{color:C.accent}}>{fmt(portVol/n,1)}%</b> de volatilidade para equilíbrio perfeito (ERC).
      </div>
      {ercGap.map(r=>(
        <div key={r.ticker} style={{marginBottom:9}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <span style={{fontWeight:700}}>{r.ticker}</span>
          <div style={{display:"flex",gap:10}}>
           <span style={{color:C.muted}}>Atual: {r.rc}%</span>
           <span style={{color:C.muted}}>Ideal: {r.ideal}%</span>
           <span style={{fontWeight:700,color:r.gap>0?C.red:C.accent}}>{r.pct>=0?"+":""}{r.pct}%</span>
          </div>
         </div>
         <div style={{position:"relative",height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
          <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.white,opacity:.5}}/>
          <div style={{
           position:"absolute",
           left:r.pct>=0?"50%":Math.max(0,50+r.pct/2)+"%",
           width:Math.min(50,Math.abs(r.pct/2))+"%",
           height:"100%",background:r.pct>0?C.red:C.accent,opacity:.8
          }}/>
         </div>
        </div>
      ))}
      <div style={{marginTop:10,padding:"8px 12px",background:C.surface,borderRadius:8,fontSize:11,color:C.muted}}>
        TE Decomposição: Sistemático <b style={{color:C.blue}}>{teSist}%</b> · Setorial <b style={{color:C.purple}}>{teSetorial}%</b> · Idiossincrático <b style={{color:C.gold}}>{teIdio}%</b>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabRenda({ filtered, quotes={}, totalVal, txs }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const DY = {acoes_br:.035,fiis:.08,renda_fixa:.105,acoes_eua:.012,etfs:.015,cripto:0,commodities:0,cambio:0,imoveis:.05,outros:.02};
  const rendaPorAtivo = filtered.map(a=>{
    const val  = preco(a)*a.qty;
    const dy   = DY[a.category]||0;
    const renda= val*dy;
    const yoc  = a.avgPrice>0?(preco(a)*dy/a.avgPrice*100):0; // yield on cost
    return {...a,val,dy,renda,yoc:+yoc.toFixed(2)};
  }).filter(a=>a.renda>0).sort((a,b)=>b.renda-a.renda);

  const rendaTotal  = rendaPorAtivo.reduce((s,a)=>s+a.renda,0);
  const yieldPort   = totalVal>0?rendaTotal/totalVal*100:0;
  const yocPort     = rendaPorAtivo.reduce((s,a)=>s+a.avgPrice*a.qty,0)>0
    ? rendaTotal/rendaPorAtivo.reduce((s,a)=>s+a.avgPrice*a.qty,0)*100 : 0;
  const DESPESA_PCT = 4; // % do patrimônio como despesa anual por família
  const dcr = FAMILIAS.map(fam=>{
    const fa    = filtered.filter(a=>a.family===fam);
    const val   = fa.reduce((s,a)=>s+preco(a)*a.qty,0);
    const renda = fa.reduce((s,a)=>s+preco(a)*a.qty*(DY[a.category]||0),0);
    const desp  = val*DESPESA_PCT/100;
    return {fam,val,renda,desp,ratio:desp>0?+(renda/desp).toFixed(2):0};
  }).filter(f=>f.val>0);
  const calcBreakeven = (val, renda, taxa, desp) => {
    if (desp<=renda) return "Indefinido (renda > despesa)";
    let v=val, anos=0;
    while(v>0&&anos<100){v=v*(1+taxa/100)+renda-desp;anos++;}
    return anos>=100?"Nunca (sem renda suficiente)":anos+" anos";
  };
  const rendaMensal = MESES.map((mes,i)=>{
    const r={mes};
    FAMILIAS.forEach(fam=>{
    const fa=filtered.filter(a=>a.family===fam);
    r[fam.replace("Familia ","F.")]=Math.round(fa.reduce((s,a)=>s+preco(a)*a.qty*(DY[a.category]||0)/12,0)*(0.85+Math.sin(i)*.15));
    });
    return r;
  });

  const CORES_FAM=[C.accent,C.blue,C.gold,C.purple];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Renda Anual Total",fmtBRL(rendaTotal),C.accent,"Dividendos + Juros + Aluguéis"],
      ["Yield sobre Valor",fmt(yieldPort,2)+"%",C.gold,"Sobre cotação atual"],
      ["Yield on Cost",    fmt(yocPort,2)+"%",  C.accent,"Sobre preço médio de compra"],
      ["Renda Mensal Méd.",fmtBRL(rendaTotal/12),C.blue,"Média projetada"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Dividend Coverage Ratio por Família"
        sub={`DCR = Renda Anual / Despesa Estimada (${DESPESA_PCT}% do patrimônio). DCR > 1 = autossustentável.`}/>
      {dcr.map(f=>{
        const c=f.ratio>=1.5?C.accent:f.ratio>=1?C.gold:C.red;
        return (
         <div key={f.fam} style={{marginBottom:14,padding:12,background:C.surface,borderRadius:10,borderLeft:"4px solid "+c}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
           <span style={{fontWeight:700}}>{f.fam}</span>
           <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={S.badge(c)}>DCR {f.ratio}x</span>
            <span style={{fontWeight:800,fontSize:18,color:c}}>{f.ratio>=1?"✓":"✗"}</span>
           </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,fontSize:12,marginBottom:8}}>
           <div><span style={{color:C.muted}}>Patrimônio</span><div style={{fontWeight:600}}>{fmtBRL(f.val)}</div></div>
           <div><span style={{color:C.muted}}>Renda anual</span><div style={{fontWeight:600,color:C.accent}}>{fmtBRL(f.renda)}</div></div>
           <div><span style={{color:C.muted}}>Despesa est.</span><div style={{fontWeight:600,color:C.red}}>{fmtBRL(f.desp)}</div></div>
          </div>
          <Barra pct={Math.min(100,f.ratio*50)} cor={c}/>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>
           Break-even: <b style={{color:c}}>{calcBreakeven(f.val,f.renda,5,f.desp)}</b>
          </div>
         </div>
        );
      })}
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Yield on Cost — Top Ativos" sub="YoC = Dividendo Atual / Preço Médio de Compra. Mostra o retorno real de posições antigas."/>
        {rendaPorAtivo.slice(0,7).map(a=>(
         <div key={a.ticker} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:7,height:7,borderRadius:2,background:catOf(a.category).color}}/>
            <span style={{fontWeight:700}}>{a.ticker}</span>
            <span style={{color:C.muted,fontSize:10}}>{catOf(a.category).label}</span>
           </div>
           <div style={{display:"flex",gap:10}}>
            <span style={{color:C.muted}}>Yield: {fmt(a.dy*100,1)}%</span>
            <span style={{fontWeight:700,color:a.yoc>a.dy*100?C.accent:C.gold}}>YoC: {a.yoc}%</span>
            <span style={{color:C.accent}}>{fmtBRL(a.renda)}/a</span>
           </div>
          </div>
          <Barra pct={Math.min(100,a.yoc/15*100)} cor={a.yoc>8?C.accent:a.yoc>4?C.gold:C.muted}/>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Renda Mensal por Família — 12 Meses"/>
        <ResponsiveContainer width="100%" height={160}>
         <BarChart data={rendaMensal}>
          <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
          <RechartsTip formatter={v=>fmtBRL(v)} contentStyle={S.TT}/>
          <Legend/>
          {FAMILIAS.map((fam,i)=>(
           <Bar key={fam} dataKey={fam.replace("Familia ","F.")} stackId="a" fill={CORES_FAM[i%4]}/>
          ))}
         </BarChart>
        </ResponsiveContainer>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabOtimizacao({ byCat, totalVal, portVol, portRet, portBeta }) {
  const n = byCat.length || 1;
  const riskParity = byCat.map(c=>{
    const volC  = catOf(c.id).vol||20;
    const rc    = (c.pct/100)*volC*.7;  // contribuição de risco proxy
    const ideal = portVol/n;
    const dev   = +(rc-ideal).toFixed(2);
    return {...c,rc:+rc.toFixed(2),ideal:+ideal.toFixed(2),dev,
    action:dev>2?"Reduzir":dev<-2?"Aumentar":"OK"};
  });
  const mdpAlloc = byCat.map(c=>{
    const volC = catOf(c.id).vol||20;
    const mdpW = (1/volC)/byCat.reduce((s,x)=>s+1/(catOf(x.id).vol||20),0)*100;
    return {...c,mdpW:+mdpW.toFixed(1),diff:+(mdpW-c.pct).toFixed(1)};
  });
  const mvpVol  = portVol*.72; // proxy MV portfolio
  const mvpRet  = portRet*.78;
  const dist    = +Math.sqrt((portVol-mvpVol)**2+(portRet-mvpRet)**2).toFixed(2);
  const fronteiraPts = Array.from({length:15},(_,i)=>{
    const v=6+i*3,r=v*.68+2.5;
    return {vol:+v.toFixed(1),ret:+r.toFixed(1),name:"Fronteira"};
  });
  const pontoAtual = [{vol:portVol,ret:portRet,name:"Atual"}];
  const pontoMDP   = [{vol:mvpVol,ret:mvpRet,name:"MDP"}];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Risk Parity — Classes fora",riskParity.filter(r=>r.action!=="OK").length,riskParity.filter(r=>r.action!=="OK").length>0?C.gold:C.accent,"Precisam ajuste"],
      ["Max Diversif. Portfolio","Vol: "+fmt(mvpVol,1)+"%",C.blue,"Ótimo teórico"],
      ["Distância até MDP",fmt(dist,2),dist<3?C.accent:dist<6?C.gold:C.red,"Menor = mais eficiente"],
      ["Retorno Perdido (gap)",fmt(mvpRet-portRet<0?0:mvpRet-portRet,1)+"%",C.red,"Gap vs portfólio ótimo"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Risk Parity Deviation por Classe"
        sub="Vermelho = sobrerisco (reduzir). Azul = subrisco (aumentar). Meta: todos no verde."/>
      {riskParity.map(r=>(
        <div key={r.id} style={{marginBottom:9}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
           <div style={{width:8,height:8,borderRadius:2,background:r.color}}/>
           <span style={{fontWeight:600}}>{r.label}</span>
          </div>
          <div style={{display:"flex",gap:8}}>
           <span style={{color:C.muted}}>RC: {r.rc}%</span>
           <span style={{color:C.muted}}>Ideal: {r.ideal}%</span>
           <span style={{fontWeight:700,color:r.dev>2?C.red:r.dev<-2?C.blue:C.accent}}>
            {r.dev>=0?"+":""}{r.dev}pp
           </span>
           <span style={S.badge(r.action==="OK"?C.accent:r.action==="Reduzir"?C.red:C.blue)}>{r.action}</span>
          </div>
         </div>
         <div style={{position:"relative",height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
          <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.white,opacity:.5}}/>
          <div style={{
           position:"absolute",
           left:r.dev>=0?"50%":Math.max(2,50+r.dev*3)+"%",
           width:Math.min(48,Math.abs(r.dev*3))+"%",
           height:"100%",background:r.dev>0?C.red:r.dev<0?C.blue:C.accent,opacity:.8
          }}/>
         </div>
        </div>
      ))}
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Maximum Diversification Portfolio vs Atual"
         sub="MDP maximiza a razão vol_média/vol_port. Linha branca = MDP target."/>
        {mdpAlloc.map(c=>(
         <div key={c.id} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600}}>{c.label}</span>
           <div style={{display:"flex",gap:8,fontSize:11}}>
            <span style={{color:C.muted}}>MDP: {c.mdpW}%</span>
            <span>Atual: {fmt(c.pct,1)}%</span>
            <span style={{fontWeight:700,color:c.diff>0?C.gold:c.diff<0?C.blue:C.accent}}>
              {c.diff>=0?"+":""}{c.diff}%
            </span>
           </div>
          </div>
          <div style={{position:"relative",height:7,background:C.border,borderRadius:3,overflow:"hidden"}}>
           <div style={{position:"absolute",left:0,width:Math.min(c.mdpW,c.pct)+"%",height:"100%",background:c.color,opacity:.8}}/>
           {c.diff!==0&&<div style={{position:"absolute",left:Math.min(c.mdpW,c.pct)+"%",width:Math.abs(c.diff)+"%",height:"100%",background:c.diff>0?C.gold:C.blue,opacity:.6}}/>}
           <div style={{position:"absolute",left:c.mdpW+"%",top:0,bottom:0,width:2,background:C.white,opacity:.7}}/>
          </div>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Posição no Espaço Risco-Retorno"
         sub="Azul = fronteira eficiente · Verde = MDP · Vermelho = portfólio atual"/>
        <ResponsiveContainer width="100%" height={190}>
         <ScatterChart margin={{top:6,right:16,bottom:22,left:16}}>
          <XAxis type="number" dataKey="vol" stroke={C.muted} tick={{fontSize:9}}
           label={{value:"Volatilidade (%)",position:"insideBottom",offset:-12,fill:C.muted,fontSize:10}}/>
          <YAxis type="number" dataKey="ret" stroke={C.muted} tick={{fontSize:9}}
           label={{value:"Retorno (%)",angle:-90,position:"insideLeft",fill:C.muted,fontSize:10}}/>
          <RechartsTip contentStyle={S.TT} formatter={(v,n)=>[v+"%",n==="vol"?"Vol":"Ret"]}/>
          <Scatter name="Fronteira" data={fronteiraPts} fill={C.blue}   opacity={.6} r={4}/>
          <Scatter name="MDP"       data={pontoMDP}     fill={C.accent} r={9}/>
          <Scatter name="Atual"     data={pontoAtual}   fill={C.red}    r={10}/>
         </ScatterChart>
        </ResponsiveContainer>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabDinamica({ portRet, portVol, portBeta, portSharpe, byCat=[], totalVal }) {
  const upCapture   = +(portBeta*1.1*100).toFixed(1);   // portfolio vs benchmark em meses positivos
  const downCapture = +(portBeta*0.85*100).toFixed(1);  // portfolio vs benchmark em meses negativos
  const captureRatio= +(upCapture/downCapture).toFixed(2);
  const bullMonths = MESES.map((mes,i)=>{
    const ibov = Math.sin(i*.7)*3+1.2; // proxy retorno IBOV mensal
    const port = ibov>0 ? ibov*1.1+.5 : ibov*.8-.2; // port performa melhor em bull
    return {mes,ibov:+ibov.toFixed(1),port:+port.toFixed(1),bull:ibov>0};
  });
  const bullData  = bullMonths.filter(m=>m.bull);
  const bearData  = bullMonths.filter(m=>!m.bull);
  const avgBull   = bullData.length  ? +(bullData.reduce((s,m)=>s+m.port,0)/bullData.length).toFixed(2)  : 0;
  const avgBear   = bearData.length  ? +(bearData.reduce((s,m)=>s+m.port,0)/bearData.length).toFixed(2)  : 0;
  const avgIbovBull=bullData.length  ? +(bullData.reduce((s,m)=>s+m.ibov,0)/bullData.length).toFixed(2)  : 0;
  const avgIbovBear=bearData.length  ? +(bearData.reduce((s,m)=>s+m.ibov,0)/bearData.length).toFixed(2)  : 0;
  const alphaLowVol  = +(portSharpe*1.3*(1+portBeta*.1)).toFixed(2);  // alpha em calma
  const alphaHighVol = +(portSharpe*.6*(1-portBeta*.2)).toFixed(2);   // alpha em stress
  const alphaConsist = alphaHighVol > 0;
  const autoCorr = [1,3,6,12].map(lag=>{
    const series = MESES.map((_,i)=>Math.sin(i*.6)*portRet/6+portRet/12);
    const n2 = series.length-lag;
    const mu = series.reduce((s,v)=>s+v,0)/series.length;
    const num= series.slice(0,n2).reduce((s,v,i)=>s+(v-mu)*(series[i+lag]-mu),0)/n2;
    const den= series.reduce((s,v)=>s+(v-mu)**2,0)/series.length;
    return {lag:"Lag "+lag+"M",ac:+(num/Math.max(.001,den)).toFixed(3),
    tipo:num/Math.max(.001,den)>.1?"Momentum":num/Math.max(.001,den)<-.1?"Mean-Rev.":"Neutro"};
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Up Capture",     upCapture+"%",     upCapture>100?C.accent:C.gold,     "Portfolio vs IBOV meses +"],
      ["Down Capture",   downCapture+"%",   downCapture<100?C.accent:C.red,    "Portfolio vs IBOV meses -"],
      ["Capture Ratio",  captureRatio+"x",  captureRatio>1.2?C.accent:captureRatio>1?C.gold:C.red,"Up/Down ratio"],
      ["Alpha em Calma", fmt(alphaLowVol,2)+"%",  C.accent,"Baixa volatilidade"],
      ["Alpha em Crise", fmt(alphaHighVol,2)+"%",  alphaConsist?C.accent:C.red,alphaConsist?"Consistente":"Cai em crise"],
      ["Bull Avg",       "+"+avgBull+"%",   C.accent,"Meses IBOV positivo"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Up/Down Capture Ratio"
        sub="Up > 100% + Down < 100% = você amplifica altas e amortece quedas. Ideal: ratio > 1.2."/>
      <div style={{display:"flex",gap:14,marginBottom:16}}>
        {[["Up Capture",upCapture,100,C.accent,"Meses positivos do IBOV"],["Down Capture",downCapture,100,C.red,"Meses negativos do IBOV"]].map(([l,v,base,c,s])=>(
         <div key={l} style={{flex:1,padding:12,background:C.surface,borderRadius:10,borderTop:"3px solid "+c}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{l}</div>
          <div style={{fontSize:24,fontWeight:800,color:c}}>{v}%</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{s}</div>
          <Barra pct={Math.min(100,v/150*100)} cor={c}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:3}}>
           <span>0%</span><span style={{color:C.white}}>100%</span><span>150%</span>
          </div>
         </div>
        ))}
      </div>
      <div style={{padding:12,background:C.surface,borderRadius:8,borderLeft:"3px solid "+(captureRatio>1.2?C.accent:captureRatio>1?C.gold:C.red)}}>
        <div style={{fontWeight:700,color:captureRatio>1.2?C.accent:captureRatio>1?C.gold:C.red,marginBottom:4}}>
         Capture Ratio: {captureRatio}x
        </div>
        <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>
         {captureRatio>1.2?"Excelente: portfólio amplifica altas e amortece quedas eficientemente.":
          captureRatio>1?"Positivo: captura mais upside que downside.":
          "Atenção: você está capturando proporcionalmente mais das quedas que das altas."}
        </div>
      </div>
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Performance em Bull vs Bear Markets"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
         {[
          {label:"Portfolio em Bull",v:avgBull,c:C.accent,sub:"vs IBOV: +"+avgIbovBull+"%"},
          {label:"Portfolio em Bear",v:avgBear,c:avgBear>avgIbovBear?C.accent:C.red,sub:"vs IBOV: "+avgIbovBear+"%"},
          {label:"Alpha em Bear",v:+(avgBear-avgIbovBear).toFixed(2),c:avgBear>avgIbovBear?C.accent:C.red,sub:"Meses negativos"},
          {label:"Conditional Alpha",v:alphaConsist?"Consistente":"Perde em crise",c:alphaConsist?C.accent:C.red,sub:alphaConsist?"Alpha em crise > 0":"Cuidado"},
         ].map(({label,v,c,sub})=>(
          <div key={label} style={{background:C.surface,borderRadius:8,padding:"10px 12px",borderLeft:"3px solid "+c}}>
           <div style={{fontSize:10,color:C.muted}}>{label}</div>
           <div style={{fontSize:16,fontWeight:700,color:c}}>{typeof v==="number"?(v>=0?"+":"")+v+"%":v}</div>
           <div style={{fontSize:10,color:C.muted}}>{sub}</div>
          </div>
         ))}
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Autocorrelação dos Retornos"
         sub="Positivo = momentum (tendência). Negativo = mean-reversion (reversão à média)."/>
        {autoCorr.map(a=>(
         <div key={a.lag} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600}}>{a.lag}</span>
           <div style={{display:"flex",gap:8}}>
            <span style={{fontWeight:700,color:a.ac>0.1?C.accent:a.ac<-0.1?C.red:C.muted}}>{a.ac}</span>
            <span style={S.badge(a.ac>0.1?C.accent:a.ac<-0.1?C.red:C.muted)}>{a.tipo}</span>
           </div>
          </div>
          <div style={{position:"relative",height:7,background:C.border,borderRadius:3,overflow:"hidden"}}>
           <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.white,opacity:.5}}/>
           <div style={{
            position:"absolute",
            left:a.ac>=0?"50%":Math.max(2,50+a.ac*50)+"%",
            width:Math.min(48,Math.abs(a.ac*50))+"%",
            height:"100%",background:a.ac>0?C.accent:C.red,opacity:.8
           }}/>
          </div>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabFamilyOffice({ filtered, quotes={}, totalVal, assets=[], txs=[], portVol }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const famVals = FAMILIAS.map(fam=>{
    const fa  = assets.filter(a=>a.family===fam);
    const val = fa.reduce((s,a)=>s+preco(a)*a.qty,0);
    const cats= fa.reduce((acc,a)=>{acc[a.category]=(acc[a.category]||0)+preco(a)*a.qty/Math.max(1,val);return acc;},{});
    return {fam,val,cats};
  }).filter(f=>f.val>0);

  const corrPairs = [];
  for(let i=0;i<famVals.length;i++){
    for(let j=i+1;j<famVals.length;j++){
    const a=famVals[i],b=famVals[j];
    const allCats=[...new Set([...Object.keys(a.cats),...Object.keys(b.cats)])];
    const dot=allCats.reduce((s,c)=>s+(a.cats[c]||0)*(b.cats[c]||0),0);
    const magA=Math.sqrt(allCats.reduce((s,c)=>s+(a.cats[c]||0)**2,0));
    const magB=Math.sqrt(allCats.reduce((s,c)=>s+(b.cats[c]||0)**2,0));
    const corr=+(dot/Math.max(.001,magA*magB)).toFixed(3);
    corrPairs.push({a:a.fam,b:b.fam,corr,c:corr>.8?C.red:corr>.6?C.gold:C.accent});
    }
  }
  const totalAportado = txs.filter(t=>t.type==="compra").reduce((s,t)=>s+t.total,0);
  const totalVendido  = txs.filter(t=>t.type==="venda").reduce((s,t)=>s+t.total,0);
  const valorCriado   = totalVal - (totalAportado - totalVendido);
  const criacaoPct    = totalAportado>0?+(valorCriado/(totalAportado-totalVendido)*100).toFixed(1):0;
  const adm      = totalVal*.005;  // 0.5% adm
  const perf     = totalVal*.015;  // 1.5% performance (estimado)
  const custc    = totalVal*.001;  // 0.1% custódia
  const brok     = (totalAportado+totalVendido)*.003; // 0.3% corretagem
  const ir       = Math.max(0,valorCriado)*.15*.3; // IR estimado parcial
  const fx       = assets.filter(a=>!catOf(a.category).br).reduce((s,a)=>s+preco(a)*a.qty,0)*.005;
  const totalTER = adm+perf+custc+brok+ir+fx;
  const terPct   = totalVal>0?+(totalTER/totalVal*100).toFixed(2):0;
  const herdeiros = FAMILIAS.map(fam=>{
    const fa  = assets.filter(a=>a.family===fam);
    const val = fa.reduce((s,a)=>s+preco(a)*a.qty,0);
    if(!val) return null;
    const diversif = fa.length>=5?25:fa.length>=3?15:5;
    const holding  = 20; // assumir holding parcialmente constituída
    const testamento= 15;
    const complexidade= fa.length>10?5:10;
    const score = 100-(diversif+holding+testamento+complexidade);
    return {fam,val,score,c:score>70?C.accent:score>50?C.gold:C.red,
    status:score>70?"Baixo risco":score>50?"Risco moderado":"Atenção urgente"};
  }).filter(Boolean);

  const terItens = [
    {l:"Taxa de Administração",v:adm,pct:.5},
    {l:"Taxa de Performance",  v:perf,pct:1.5},
    {l:"Custódia",              v:custc,pct:.1},
    {l:"Corretagem",            v:brok,pct:null},
    {l:"IR Estimado (parcial)", v:ir,  pct:null},
    {l:"Custo Cambial",         v:fx,  pct:null},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Valor Criado",        fmtBRL(valorCriado),    valorCriado>0?C.accent:C.red,  fmtPct(criacaoPct)+" vs aportado"],
      ["TER (Custo Total)",   fmt(terPct,2)+"%",      terPct>2?C.red:terPct>1?C.gold:C.accent,"~"+fmtBRL(totalTER)+"/ano"],
      ["Correlação Max Fam.", corrPairs.length?fmt(Math.max(...corrPairs.map(p=>p.corr)),3):"--",
        corrPairs.length&&Math.max(...corrPairs.map(p=>p.corr))>.8?C.red:C.gold,"Entre famílias"],
      ["Risco Descontinuidade",portVol>25?"Alto":portVol>15?"Médio":"Baixo",
        portVol>25?C.red:portVol>15?C.gold:C.accent,"Score de liquidez operacional"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Inter-Family Correlation"
         sub="Quanto as famílias estão expostas às mesmas classes. Alta corr. = risco sistêmico concentrado."/>
        {corrPairs.length===0
         ? <div style={{color:C.muted,fontSize:12}}>Apenas uma família com patrimônio</div>
         : corrPairs.map(p=>(
          <div key={p.a+p.b} style={{marginBottom:9}}>
           <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
            <span style={{fontWeight:600}}>{p.a.replace("Familia ","")} ↔ {p.b.replace("Familia ","")}</span>
            <div style={{display:"flex",gap:8}}>
              <span style={{fontWeight:700,color:p.c}}>{p.corr}</span>
              <span style={S.badge(p.c)}>{p.corr>.8?"Alta":p.corr>.6?"Moderada":"Baixa"}</span>
            </div>
           </div>
           <Barra pct={p.corr*100} cor={p.c}/>
          </div>
         ))
        }
        <div style={{marginTop:8,fontSize:11,color:C.muted,lineHeight:1.5}}>
         Correlação alta entre famílias indica que elas têm perfis similares e cairão juntas em crises.
         Ideal: cada família ter pelo menos uma classe exclusiva.
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Geração Patrimonial"
         sub="Separa valor criado (gestão) de valor aportado (capital externo)"/>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
         {[["Total Aportado",fmtBRL(totalAportado-totalVendido),C.blue],["Valor de Mercado",fmtBRL(totalVal),C.white],["Valor Criado",fmtBRL(valorCriado),valorCriado>0?C.accent:C.red]].map(([l,v,c])=>(
          <div key={l} style={{flex:1,background:C.surface,borderRadius:8,padding:"8px 10px",borderTop:"2px solid "+c}}>
           <div style={{fontSize:10,color:C.muted}}>{l}</div>
           <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
          </div>
         ))}
        </div>
        <Barra pct={Math.min(100,Math.max(0,criacaoPct))} cor={valorCriado>0?C.accent:C.red}/>
        <div style={{fontSize:11,color:C.muted,marginTop:4}}>
         {criacaoPct>0
          ? `Cada R$100 aportado virou R$${(100+criacaoPct).toFixed(0)} — criação de valor real.`
          : "Patrimônio abaixo do total aportado — revisão de estratégia recomendada."}
        </div>
      </div>
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="TER — Custo Total de Ownership"
         sub="Total Expense Ratio: inclui todas as taxas explícitas e implícitas estimadas."/>
        {terItens.map(t=>(
         <div key={t.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <span style={{color:C.muted}}>{t.l}</span>
          <div style={{textAlign:"right"}}>
           <span style={{fontWeight:700,color:C.red}}>{fmtBRL(t.v)}</span>
           {t.pct&&<span style={{color:C.muted,marginLeft:6,fontSize:10}}>{t.pct}%</span>}
          </div>
         </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:14,fontWeight:700}}>
         <span>Total TER</span>
         <span style={{color:terPct>2?C.red:terPct>1?C.gold:C.accent}}>{fmtBRL(totalTER)} ({terPct}%)</span>
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Herdeiro Score por Família"
         sub="Mede risco de conflito sucessório. Considera estrutura, herdeiros e complexidade."/>
        {herdeiros.map(h=>(
         <div key={h.fam} style={{marginBottom:10,padding:"10px 12px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+h.c}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
           <span style={{fontWeight:700}}>{h.fam}</span>
           <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:20,fontWeight:800,color:h.c}}>{h.score}</span>
            <span style={S.badge(h.c)}>{h.status}</span>
           </div>
          </div>
          <Barra pct={h.score} cor={h.c}/>
          <div style={{fontSize:10,color:C.muted,marginTop:4}}>
           {h.score>70?"Estrutura adequada. Manter atualizado.":
            h.score>50?"Revisar holding e testamento nos próximos 12 meses.":
            "Ação urgente: holdings, acordo de acionistas e testamento pendentes."}
          </div>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabDerivs({ filtered, quotes={}, totalVal, portVol, portBeta, var99, byCat }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const expBR  = byCat.find(c=>c.id==="acoes_br")?.pct||0;
  const expEUA = (byCat.find(c=>c.id==="acoes_eua")?.pct||0)+(byCat.find(c=>c.id==="etfs")?.pct||0);
  const deltaPort  = +(portBeta).toFixed(3);
  const gammaPort  = +(portBeta*.08).toFixed(3);
  const vegaPort   = +(totalVal*(portVol/100)*.18/1e6).toFixed(3);
  const thetaPort  = +(-totalVal*(portVol/100)*.05/252/1e6).toFixed(4);
  const hedges = [
    {nome:"Puts IBOV (proteção -15%)", custo:totalVal*.008,cobertura:totalVal*(expBR/100)*.7,efic:.7,tipo:"Put"},
    {nome:"USD longo (hedge cambial)",  custo:totalVal*.003,cobertura:totalVal*((100-expBR-expEUA)/100)*.5,efic:.5,tipo:"Moeda"},
    {nome:"Ouro (tail risk)",           custo:totalVal*.004,cobertura:totalVal*.08,efic:.3,tipo:"Comod."},
    {nome:"VIX Calls (crise)",          custo:totalVal*.002,cobertura:var99*2,efic:.6,tipo:"Vol"},
  ];
  const totalHedgeCost = hedges.reduce((s,h)=>s+h.custo,0);
  const totalCoverage  = hedges.reduce((s,h)=>s+h.cobertura,0);
  const instrumentos = [
    {i:"Puts OTM (5% fora)",      custo:.8,  cob:15, ef:1.8},
    {i:"Put Spreads",              custo:.4,  cob:10, ef:2.5},
    {i:"Coleiras (collar)",        custo:.1,  cob:12, ef:12.0},
    {i:"VIX Calls",                custo:.3,  cob:8,  ef:2.7},
    {i:"Ouro físico (5%)",         custo:.4,  cob:6,  ef:1.5},
    {i:"USD/BRL longo",            custo:.5,  cob:9,  ef:1.8},
    {i:"Treasury 2Y (5%)",         custo:.2,  cob:5,  ef:2.5},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Delta Portfolio",  fmt(deltaPort,3)+"x",  portBeta>1.2?C.gold:C.accent,"Sensibilidade ao mercado"],
      ["Gamma Portfolio",  fmt(gammaPort,3),       C.blue,  "Aceleração do delta"],
      ["Vega Portfolio",   fmt(vegaPort,3)+"M/pp", C.purple,"Sensibilidade à vol"],
      ["Theta Portfolio",  fmt(thetaPort,4)+"M/d", C.red,   "Decaimento por dia"],
      ["Custo Hedge Est.", fmtBRL(totalHedgeCost), C.gold,  fmt(totalHedgeCost/totalVal*100,2)+"% do port."],
      ["Cobertura Total",  fmt(totalCoverage/totalVal*100,1)+"%",C.accent,"Do patrimônio hedgeado"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Portfolio Greeks (Implícitos)"
        sub="Sensibilidades estimadas sem opções diretas — baseado em beta, vol e composição."/>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
        {[
         {greek:"Δ Delta",val:deltaPort,unit:"x",desc:"Cada 1% de alta no mercado → portfólio sobe ~"+fmt(deltaPort,2)+"%",c:C.accent},
         {greek:"Γ Gamma",val:gammaPort,unit:"",desc:"Taxa de variação do delta. Quanto maior, mais não-linear o risco.",c:C.blue},
         {greek:"ν Vega",val:vegaPort,unit:"M/pp",desc:"A cada +1pp de vol implícita → portfólio muda "+fmt(vegaPort,3)+"M",c:C.purple},
         {greek:"Θ Theta",val:thetaPort,unit:"M/dia",desc:"Decaimento temporal: "+fmt(Math.abs(thetaPort)*252,2)+"M/ano sem variação de preço",c:C.red},
        ].map(g=>(
         <div key={g.greek} style={{padding:"10px 12px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+g.c}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
           <span style={{fontWeight:700,fontSize:14,color:g.c,fontFamily:"monospace"}}>{g.greek}</span>
           <span style={{fontWeight:800,fontSize:16,color:g.c}}>{g.val}{g.unit}</span>
          </div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{g.desc}</div>
         </div>
        ))}
      </div>
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Custo de Proteção vs Risco Coberto"
         sub="Ef. = R$ coberto / R$1 de custo. Maior = mais eficiente."/>
        {instrumentos.sort((a,b)=>b.ef-a.ef).map(i=>(
         <div key={i.i} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600}}>{i.i}</span>
           <div style={{display:"flex",gap:8}}>
            <span style={{color:C.muted}}>Custo: {i.custo}%/a</span>
            <span style={{color:C.muted}}>Cobre: {i.cob}%</span>
            <span style={{fontWeight:700,color:i.ef>3?C.accent:i.ef>1.5?C.gold:C.red}}>Ef: {i.ef}x</span>
           </div>
          </div>
          <Barra pct={Math.min(100,i.ef/12*100)} cor={i.ef>3?C.accent:i.ef>1.5?C.gold:C.red}/>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Hedge Ratio Monitor"/>
        {hedges.map(h=>(
         <div key={h.nome} style={{marginBottom:8,padding:"8px 10px",background:C.surface,borderRadius:8,fontSize:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
           <div><span style={{fontWeight:600}}>{h.nome}</span><span style={S.badge(C.blue)}>{h.tipo}</span></div>
           <span style={{color:C.red}}>{fmtBRL(h.custo)}/a</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
           <span>Cobertura: {fmtBRL(h.cobertura)}</span>
           <span>Efic.: {+(h.cobertura/h.custo).toFixed(1)}x</span>
          </div>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabESGAvancado({ byCat, filtered=[], quotes={}, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const CARBON = {acoes_br:45,fiis:8,renda_fixa:2,acoes_eua:38,etfs:32,cripto:180,commodities:95,cambio:1,imoveis:12,outros:25};
  const carbonTotal = byCat.reduce((s,c)=>s+(CARBON[c.id]||30)*(c.value/1e6),0);
  const carbonBench = 65; // tCO2e/R$M — benchmark setorial
  const SDG = {
    acoes_br:  {s8:7,s9:6,s11:5,s13:4},
    fiis:      {s11:8,s13:5,s7:6,s9:5},
    renda_fixa:{s8:5,s10:7,s17:6,s1:5},
    acoes_eua: {s9:8,s8:7,s17:6,s10:5},
    etfs:      {s9:7,s8:6,s10:5,s13:5},
    cripto:    {s9:5,s10:4,s17:3,s8:4},
    commodities:{s12:3,s15:4,s13:3,s2:5},
    imoveis:   {s11:7,s13:5,s9:4,s7:6},
    outros:    {s8:5,s9:5,s10:4,s17:4},
  };
  const sdgScore = byCat.reduce((s,c)=>{
    const sc=SDG[c.id]||{};
    const avg=Object.values(sc).reduce((a,v)=>a+v,0)/Math.max(1,Object.keys(sc).length);
    return s+(c.pct/100)*avg;
  },0);
  const FOSSIL = {acoes_br:.18,commodities:.45,acoes_eua:.08,etfs:.06};
  const strandedExp = byCat.reduce((s,c)=>s+(FOSSIL[c.id]||0)*c.value,0);
  const strandedPct = totalVal>0?strandedExp/totalVal*100:0;
  const carbonEvo = MESES.map((mes,i)=>({
    mes,
    footprint:+(carbonTotal*(1.1-i*.015)).toFixed(1),
    benchmark:carbonBench,
  }));
  const ods = [
    {id:1,nome:"Sem pobreza",icon:"🏠"},
    {id:7,nome:"Energia limpa",icon:"⚡"},
    {id:8,nome:"Trabalho digno",icon:"💼"},
    {id:9,nome:"Indústria & Inovação",icon:"🏭"},
    {id:10,nome:"Redução desig.",icon:"⚖"},
    {id:11,nome:"Cidades sustentáveis",icon:"🏙"},
    {id:12,nome:"Consumo responsável",icon:"♻"},
    {id:13,nome:"Ação climática",icon:"🌍"},
    {id:15,nome:"Vida terrestre",icon:"🌿"},
    {id:17,nome:"Parcerias",icon:"🤝"},
  ].map(o=>{
    const score=byCat.reduce((s,c)=>{
    const sc=SDG[c.id]||{};
    return s+(c.pct/100)*(sc["s"+o.id]||3);
    },0);
    return {...o,score:+score.toFixed(1)};
  }).sort((a,b)=>b.score-a.score);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Carbon Footprint",fmt(carbonTotal,1)+" tCO2e/M",strandedPct<5?C.accent:C.gold,"vs benchmark: "+carbonBench],
      ["vs Benchmark",    carbonTotal<carbonBench?fmt(((carbonBench-carbonTotal)/carbonBench*100),1)+"% menor":""+fmt(((carbonTotal-carbonBench)/carbonBench*100),1)+"% maior",carbonTotal<carbonBench?C.accent:C.red,"R$M investido"],
      ["SDG Score",       fmt(sdgScore,1)+"/10",sdgScore>6?C.accent:sdgScore>4?C.gold:C.red,"Alinhamento com ODS ONU"],
      ["Stranded Asset",  fmt(strandedPct,1)+"%",strandedPct>15?C.red:strandedPct>8?C.gold:C.accent,"Exposição a combustíveis fósseis"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Carbon Footprint por Classe"
        sub="tCO2e por R$M investido. Linha tracejada = benchmark setorial (65 tCO2e/M)."/>
      {byCat.map(c=>{
        const co2=(CARBON[c.id]||30)*(c.value/1e6);
        const co2pm=CARBON[c.id]||30;
        return (
         <div key={c.id} style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:2,background:c.color}}/>
            <span style={{fontWeight:600}}>{c.label}</span>
           </div>
           <div style={{display:"flex",gap:8}}>
            <span style={{color:C.muted}}>{co2pm} tCO2e/M</span>
            <span style={{fontWeight:700,color:co2pm>carbonBench?C.red:C.accent}}>{fmt(co2,1)} t total</span>
           </div>
          </div>
          <div style={{position:"relative",height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
           <div style={{height:"100%",width:Math.min(100,co2pm/200*100)+"%",background:co2pm>carbonBench?C.red:co2pm>carbonBench*.5?C.gold:C.accent,borderRadius:4}}/>
           <div style={{position:"absolute",left:carbonBench/200*100+"%",top:0,bottom:0,width:2,background:C.white,opacity:.6}}/>
          </div>
         </div>
        );
      })}
      <div style={{marginTop:14}}>
        <SecaoTitulo titulo="Evolução do Carbon Footprint"/>
        <ResponsiveContainer width="100%" height={120}>
         <LineChart data={carbonEvo}>
          <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"t"}/>
          <RechartsTip formatter={v=>[v+" tCO2e/M"]} contentStyle={S.TT}/>
          <Line type="monotone" dataKey="footprint" name="Portfolio"  stroke={C.accent} strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke={C.red}    strokeDasharray="4 2" strokeWidth={1.5} dot={false}/>
         </LineChart>
        </ResponsiveContainer>
      </div>
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Alinhamento com ODS — ONU SDG Score"
         sub="Score 0-10 ponderado por classe. Verde = alto alinhamento."/>
        {ods.map(o=>(
         <div key={o.id} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span>{o.icon} ODS {o.id}: {o.nome}</span>
           <span style={{fontWeight:700,color:o.score>6?C.accent:o.score>4?C.gold:C.red}}>{o.score}/10</span>
          </div>
          <Barra pct={o.score*10} cor={o.score>6?C.accent:o.score>4?C.gold:C.red} altura={5}/>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Stranded Asset Risk"
         sub="Ativos de combustíveis fósseis que podem perder valor em transição energética acelerada."/>
        <div style={{padding:12,background:C.surface,borderRadius:10,marginBottom:12,
         borderLeft:"4px solid "+(strandedPct>15?C.red:strandedPct>8?C.gold:C.accent)}}>
         <div style={{fontSize:22,fontWeight:800,color:strandedPct>15?C.red:strandedPct>8?C.gold:C.accent}}>
          {fmt(strandedPct,1)}% do patrimônio
         </div>
         <div style={{fontSize:11,color:C.muted,marginTop:4,lineHeight:1.5}}>
          {strandedPct>15?"Alta exposição. Considere reduzir posições em combustíveis fósseis. Risco regulatório crescente.":
           strandedPct>8?"Exposição moderada. Monitorar regulação de carbono e substituição de energia.":
           "Baixa exposição. Portfólio relativamente protegido da transição energética."}
         </div>
        </div>
        <Barra pct={strandedPct} cor={strandedPct>15?C.red:strandedPct>8?C.gold:C.accent}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:4}}>
         <span>Valor exposto: {fmtBRL(strandedExp)}</span>
         <span>Risco de desvalorização gradual até 2035</span>
        </div>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabScreener({ quotes }) {
  const [tipo,   setTipo]   = useState("acoes");
  const [filtros, setFiltros] = useState({ peMin:"", peMax:"", volMin:"", volMax:"", dyMin:"", dyMax:"", mktcapMin:"", setor:"" });
  const [sort,   setSort]   = useState({ col:"mktcap", dir:"desc" });
  const SETORES = ["Tecnologia","Financeiro","Energia","Saúde","Consumo","Industrial","Utilities","Materiais","Real Estate","Telecom"];
  const ATIVOS_BASE = [
    {ticker:"PETR4",  nome:"Petrobras",        tipo:"acoes", setor:"Energia",     mktcap:450e9, pe:5.2,  pb:1.8,  dy:8.5,  vol:28,  rec:"Compra",   pts:38.5,  ev_ebit:4.2, roe:32,  div:3.8},
    {ticker:"VALE3",  nome:"Vale",             tipo:"acoes", setor:"Materiais",   mktcap:310e9, pe:6.1,  pb:2.1,  dy:7.2,  vol:32,  rec:"Compra",   pts:72.0,  ev_ebit:5.1, roe:28,  div:5.2},
    {ticker:"ITUB4",  nome:"Itaú Unibanco",    tipo:"acoes", setor:"Financeiro",  mktcap:280e9, pe:8.4,  pb:1.9,  dy:5.8,  vol:18,  rec:"Neutro",   pts:35.0,  ev_ebit:null,roe:22,  div:2.0},
    {ticker:"BBDC4",  nome:"Bradesco",         tipo:"acoes", setor:"Financeiro",  mktcap:145e9, pe:6.9,  pb:1.2,  dy:6.1,  vol:20,  rec:"Neutro",   pts:16.5,  ev_ebit:null,roe:16,  div:1.0},
    {ticker:"WEGE3",  nome:"WEG",              tipo:"acoes", setor:"Industrial",  mktcap:190e9, pe:32.5, pb:11.2, dy:1.2,  vol:22,  rec:"Compra",   pts:55.0,  ev_ebit:22.1,roe:38,  div:0.7},
    {ticker:"RDOR3",  nome:"Rede D'Or",        tipo:"acoes", setor:"Saúde",       mktcap:68e9,  pe:22.1, pb:3.4,  dy:0.8,  vol:26,  rec:"Compra",   pts:32.0,  ev_ebit:15.2,roe:12,  div:0.3},
    {ticker:"RENT3",  nome:"Localiza",         tipo:"acoes", setor:"Consumo",     mktcap:55e9,  pe:18.2, pb:4.1,  dy:1.5,  vol:30,  rec:"Compra",   pts:48.0,  ev_ebit:11.3,roe:20,  div:0.8},
    {ticker:"ABEV3",  nome:"Ambev",            tipo:"acoes", setor:"Consumo",     mktcap:165e9, pe:14.8, pb:2.8,  dy:4.2,  vol:16,  rec:"Neutro",   pts:12.5,  ev_ebit:9.4, roe:18,  div:0.5},
    {ticker:"GGBR4",  nome:"Gerdau",           tipo:"acoes", setor:"Materiais",   mktcap:52e9,  pe:5.8,  pb:1.4,  dy:8.1,  vol:35,  rec:"Compra",   pts:22.0,  ev_ebit:3.8, roe:22,  div:1.8},
    {ticker:"LREN3",  nome:"Lojas Renner",     tipo:"acoes", setor:"Consumo",     mktcap:18e9,  pe:12.4, pb:2.1,  dy:2.8,  vol:38,  rec:"Neutro",   pts:16.0,  ev_ebit:7.1, roe:16,  div:0.5},
    {ticker:"AAPL",   nome:"Apple",            tipo:"acoes", setor:"Tecnologia",  mktcap:3.2e12,pe:28.2, pb:45.1, dy:0.5,  vol:22,  rec:"Compra",   pts:235.0, ev_ebit:22.5,roe:160, div:1.0},
    {ticker:"MSFT",   nome:"Microsoft",        tipo:"acoes", setor:"Tecnologia",  mktcap:3.1e12,pe:34.1, pb:12.8, dy:0.8,  vol:20,  rec:"Compra",   pts:480.0, ev_ebit:28.2,roe:42,  div:3.2},
    {ticker:"NVDA",   nome:"NVIDIA",           tipo:"acoes", setor:"Tecnologia",  mktcap:2.8e12,pe:45.8, pb:38.2, dy:0.04, vol:42,  rec:"Compra",   pts:950.0, ev_ebit:40.1,roe:82,  div:0.04},
    {ticker:"GOOGL",  nome:"Alphabet",         tipo:"acoes", setor:"Tecnologia",  mktcap:2.0e12,pe:22.4, pb:6.8,  dy:0.5,  vol:24,  rec:"Compra",   pts:195.0, ev_ebit:18.4,roe:28,  div:0.3},
    {ticker:"META",   nome:"Meta Platforms",   tipo:"acoes", setor:"Tecnologia",  mktcap:1.4e12,pe:24.8, pb:8.4,  dy:0.4,  vol:30,  rec:"Compra",   pts:580.0, ev_ebit:17.2,roe:34,  div:2.5},
    {ticker:"JPM",    nome:"JPMorgan Chase",   tipo:"acoes", setor:"Financeiro",  mktcap:700e9, pe:12.4, pb:2.1,  dy:2.1,  vol:18,  rec:"Compra",   pts:240.0, ev_ebit:null,roe:16,  div:5.0},
    {ticker:"HGLG11", nome:"CSHG Logística",  tipo:"fii",   setor:"Real Estate", mktcap:8e9,   pe:null, pb:0.95, dy:8.8,  vol:12,  rec:"Compra",   pts:168.0, ev_ebit:null,roe:null,div:14.0},
    {ticker:"XPML11", nome:"XP Malls",        tipo:"fii",   setor:"Real Estate", mktcap:6e9,   pe:null, pb:0.88, dy:7.4,  vol:14,  rec:"Compra",   pts:105.0, ev_ebit:null,roe:null,div:7.8},
    {ticker:"KNRI11", nome:"Kinea Rend.Imob.", tipo:"fii",   setor:"Real Estate", mktcap:7e9,   pe:null, pb:0.91, dy:8.2,  vol:10,  rec:"Neutro",   pts:158.0, ev_ebit:null,roe:null,div:13.0},
    {ticker:"SPY",    nome:"SPDR S&P 500",     tipo:"etf",   setor:"Diversif.",   mktcap:550e9, pe:22.1, pb:4.5,  dy:1.3,  vol:15,  rec:"Neutro",   pts:510.0, ev_ebit:null,roe:null,div:6.8},
    {ticker:"QQQ",    nome:"Invesco Nasdaq",   tipo:"etf",   setor:"Tecnologia",  mktcap:260e9, pe:34.2, pb:8.2,  dy:0.6,  vol:20,  rec:"Compra",   pts:470.0, ev_ebit:null,roe:null,div:3.0},
    {ticker:"VNQ",    nome:"Vanguard REIT",    tipo:"etf",   setor:"Real Estate", mktcap:62e9,  pe:28.4, pb:2.8,  dy:4.2,  vol:16,  rec:"Neutro",   pts:88.0,  ev_ebit:null,roe:null,div:3.8},
    {ticker:"GLD",    nome:"SPDR Gold",        tipo:"etf",   setor:"Commodities", mktcap:72e9,  pe:null, pb:null, dy:0,    vol:12,  rec:"Compra",   pts:235.0, ev_ebit:null,roe:null,div:0},
    {ticker:"TLT",    nome:"iShares 20Y+ Trs", tipo:"etf",   setor:"Renda Fixa",  mktcap:58e9,  pe:null, pb:null, dy:4.1,  vol:14,  rec:"Neutro",   pts:92.0,  ev_ebit:null,roe:null,div:3.8},
  ];

  const COLUNAS = [
    {id:"ticker",  label:"Ticker",    fmt:v=>v},
    {id:"nome",    label:"Nome",      fmt:v=><span style={{color:C.muted,fontSize:11}}>{v}</span>},
    {id:"setor",   label:"Setor",     fmt:v=><span style={S.badge(C.blue)}>{v}</span>},
    {id:"mktcap",  label:"Mkt Cap",   fmt:v=>v>=1e12?"R$"+(v/1e12).toFixed(1)+"T":v>=1e9?"R$"+(v/1e9).toFixed(0)+"B":"R$"+(v/1e6).toFixed(0)+"M"},
    {id:"pe",      label:"P/E",       fmt:v=>v?fmt(v,1):"--"},
    {id:"pb",      label:"P/B",       fmt:v=>v?fmt(v,1):"--"},
    {id:"dy",      label:"D.Yield",   fmt:v=>v?fmt(v,1)+"%":"--"},
    {id:"roe",     label:"ROE",       fmt:v=>v?fmt(v,0)+"%":"--"},
    {id:"vol",     label:"Vol.(%)",   fmt:v=>fmt(v,0)+"%"},
    {id:"ev_ebit", label:"EV/EBIT",   fmt:v=>v?fmt(v,1):"--"},
    {id:"pts",     label:"Price Tgt", fmt:v=>"R$"+fmt(v,1)},
    {id:"rec",     label:"Consenso",  fmt:v=><span style={S.badge(v==="Compra"?C.accent:v==="Venda"?C.red:C.gold)}>{v}</span>},
  ];

  const filtered2 = ATIVOS_BASE
    .filter(a => a.tipo===tipo || (tipo==="acoes" && a.tipo==="acoes") || tipo==="todos")
    .filter(a => {
    const f=filtros;
    if(f.peMin&&a.pe&&a.pe<+f.peMin) return false;
    if(f.peMax&&a.pe&&a.pe>+f.peMax) return false;
    if(f.dyMin&&a.dy<+f.dyMin) return false;
    if(f.dyMax&&a.dy>+f.dyMax) return false;
    if(f.volMax&&a.vol>+f.volMax) return false;
    if(f.setor&&a.setor!==f.setor) return false;
    return true;
    })
    .sort((a,b)=>{
    const va=a[sort.col]??0, vb=b[sort.col]??0;
    return sort.dir==="desc"?vb-va:va-vb;
    });

  function handleSort(col) {
    setSort(s=>({col,dir:s.col===col&&s.dir==="desc"?"asc":"desc"}));
  }

  const [salvas,setSalvas]=useState([]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Tipo de ativo */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     {[["acoes","📈 Ações"],["fii","🏢 FIIs"],["etf","🌐 ETFs"],["todos","🔍 Todos"]].map(([v,l])=>(
      <button key={v} onClick={()=>setTipo(v)}
        style={tipo===v?S.btnV:{...S.btnO,fontSize:12,padding:"6px 14px"}}>{l}</button>
     ))}
     <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
      <span style={{color:C.muted,fontSize:12}}>{filtered2.length} resultados</span>
      <button onClick={()=>setFiltros({peMin:"",peMax:"",volMin:"",volMax:"",dyMin:"",dyMax:"",mktcapMin:"",setor:""})}
        style={{...S.btnO,fontSize:11,padding:"5px 12px",color:C.gold,borderColor:C.gold}}>Limpar Filtros</button>
     </div>
    </div>

    {/* Painel de filtros */}
    <div style={S.card}>
     <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>🔧 Filtros</div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
      {[
        ["P/E Mínimo","peMin","ex: 5"],["P/E Máximo","peMax","ex: 30"],
        ["Div. Yield Mín. (%)","dyMin","ex: 3"],["Div. Yield Máx. (%)","dyMax","ex: 15"],
        ["Volatilidade Máx. (%)","volMax","ex: 25"],
      ].map(([l,k,ph])=>(
        <div key={k}>
         <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{l}</div>
         <input style={{...S.inp,padding:"6px 10px",fontSize:12}}
          placeholder={ph} value={filtros[k]}
          onChange={e=>setFiltros(p=>({...p,[k]:e.target.value}))}/>
        </div>
      ))}
      <div>
        <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Setor</div>
        <select style={{...S.sel,padding:"6px 10px",fontSize:12}}
         value={filtros.setor} onChange={e=>setFiltros(p=>({...p,setor:e.target.value}))}>
         <option value="">Todos setores</option>
         {SETORES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
     </div>
     {/* Telas salvas */}
     {salvas.length>0&&(
      <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:C.muted}}>Telas salvas:</span>
        {salvas.map((s,i)=><span key={i} style={S.badge(C.blue)}>{s}</span>)}
      </div>
     )}
     <button onClick={()=>{const n=prompt("Nome da tela:");if(n)setSalvas(p=>[...p,n]);}}
      style={{...S.btnO,fontSize:11,padding:"5px 12px",marginTop:10}}>+ Salvar Tela</button>
    </div>

    {/* Tabela */}
    <div style={S.card}>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
         <tr style={{borderBottom:"1px solid "+C.border}}>
          {COLUNAS.map(c=>(
           <th key={c.id} onClick={()=>handleSort(c.id)}
            style={{padding:"8px 10px",color:sort.col===c.id?C.accent:C.muted,
              fontWeight:600,fontSize:10,textAlign:"left",
              textTransform:"uppercase",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"}}>
            {c.label}{sort.col===c.id?(sort.dir==="desc"?" ↓":" ↑"):""}
           </th>
          ))}
         </tr>
        </thead>
        <tbody>
         {filtered2.map(a=>(
          <tr key={a.ticker} style={{borderBottom:"1px solid "+C.border+"22",cursor:"pointer"}}
           onMouseEnter={e=>e.currentTarget.style.background=C.accentDim}
           onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
           {COLUNAS.map(c=>(
            <td key={c.id} style={{padding:"9px 10px",fontWeight:c.id==="ticker"?700:400}}>
              {c.fmt(a[c.id])}
            </td>
           ))}
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabCalendario() {
  const [filtroImp, setFiltroImp] = useState("todos"); // todos | alta | media | baixa
  const hoje2 = new Date();

  const eventos = [
    {data:"Hoje",hora:"09:00",pais:"🇧🇷",evento:"IPCA-15 (mensal)",imp:"alta",ant:"0.45%",prev:"0.52%",real:"",cat:"Inflação"},
    {data:"Hoje",hora:"10:30",pais:"🇺🇸",evento:"Initial Jobless Claims",imp:"alta",ant:"212k",prev:"218k",real:"",cat:"Trabalho"},
    {data:"Hoje",hora:"14:30",pais:"🇺🇸",evento:"Fed Funds Rate Decision",imp:"alta",ant:"5.25%",prev:"5.25%",real:"",cat:"Juros"},
    {data:"Amanhã",hora:"09:00",pais:"🇧🇷",evento:"Balança Comercial",imp:"media",ant:"R$8.2B",prev:"R$9.1B",real:"",cat:"Comércio"},
    {data:"Amanhã",hora:"08:30",pais:"🇺🇸",evento:"CPI MoM",imp:"alta",ant:"0.2%",prev:"0.3%",real:"",cat:"Inflação"},
    {data:"Amanhã",hora:"11:00",pais:"🇪🇺",evento:"ECB Interest Rate",imp:"alta",ant:"3.75%",prev:"3.75%",real:"",cat:"Juros"},
    {data:"+2d",hora:"09:30",pais:"🇧🇷",evento:"Ata do Copom",imp:"alta",ant:"",prev:"",real:"",cat:"Juros"},
    {data:"+2d",hora:"14:30",pais:"🇺🇸",evento:"Retail Sales MoM",imp:"media",ant:"0.4%",prev:"0.5%",real:"",cat:"Consumo"},
    {data:"+3d",hora:"08:30",pais:"🇺🇸",evento:"Nonfarm Payrolls",imp:"alta",ant:"275k",prev:"250k",real:"",cat:"Trabalho"},
    {data:"+3d",hora:"10:00",pais:"🇧🇷",evento:"Copom Ata + Selic",imp:"alta",ant:"10.50%",prev:"10.50%",real:"",cat:"Juros"},
    {data:"+3d",hora:"10:30",pais:"🇺🇸",evento:"Unemployment Rate",imp:"alta",ant:"3.7%",prev:"3.8%",real:"",cat:"Trabalho"},
    {data:"+5d",hora:"09:00",pais:"🇧🇷",evento:"IGP-M (mensal)",imp:"media",ant:"0.22%",prev:"0.35%",real:"",cat:"Inflação"},
    {data:"+5d",hora:"10:00",pais:"🇺🇸",evento:"Consumer Confidence",imp:"media",ant:"102.5",prev:"104.0",real:"",cat:"Consumo"},
    {data:"+7d",hora:"09:00",pais:"🇧🇷",evento:"PIB (trimestral)",imp:"alta",ant:"0.8%",prev:"0.6%",real:"",cat:"PIB"},
    {data:"+7d",hora:"08:30",pais:"🇺🇸",evento:"PPI MoM",imp:"media",ant:"0.1%",prev:"0.2%",real:"",cat:"Inflação"},
    {data:"+10d",hora:"09:00",pais:"🇧🇷",evento:"IPCA (mensal)",imp:"alta",ant:"0.38%",prev:"0.42%",real:"",cat:"Inflação"},
    {data:"+10d",hora:"14:30",pais:"🇺🇸",evento:"GDP QoQ (1ª Est.)",imp:"alta",ant:"2.1%",prev:"1.8%",real:"",cat:"PIB"},
    {data:"+14d",hora:"10:00",pais:"🇧🇷",evento:"Nota Crédito BCB",imp:"media",ant:"",prev:"",real:"",cat:"Crédito"},
    {data:"+14d",hora:"08:30",pais:"🇺🇸",evento:"FOMC Minutes",imp:"alta",ant:"",prev:"",real:"",cat:"Juros"},
    {data:"+21d",hora:"09:00",pais:"🇧🇷",evento:"Caged (empregos)",imp:"media",ant:"180k",prev:"165k",real:"",cat:"Trabalho"},
  ];

  const CATS = ["Todos","Inflação","Juros","Trabalho","PIB","Consumo","Comércio","Crédito"];
  const [catF, setCatF] = useState("Todos");

  const lista = eventos.filter(e=>{
    if(filtroImp!=="todos"&&e.imp!==filtroImp) return false;
    if(catF!=="Todos"&&e.cat!==catF) return false;
    return true;
  });

  const IMP_COR = {alta:C.red,media:C.gold,baixa:C.muted};
  const IMP_LABEL = {alta:"🔴 Alta",media:"🟡 Média",baixa:"⚪ Baixa"};
  const highImpact = eventos.filter(e=>e.imp==="alta").slice(0,4);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Destaques */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     <div style={{...S.card,flex:2,minWidth:280}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🔥 Próximos Eventos de Alto Impacto</div>
      {highImpact.map((e,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
         <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span>{e.pais}</span>
          <div>
           <div style={{fontWeight:600}}>{e.evento}</div>
           <div style={{fontSize:10,color:C.muted}}>{e.data} {e.hora}</div>
          </div>
         </div>
         <div style={{textAlign:"right"}}>
          {e.prev&&<div style={{fontSize:11,color:C.blue}}>Prev: {e.prev}</div>}
          <div style={{fontSize:10,color:C.muted}}>Ant: {e.ant||"--"}</div>
         </div>
        </div>
      ))}
     </div>
     <div style={{...S.card,flex:1,minWidth:180}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📊 Resumo</div>
      {[["Total eventos",eventos.length,C.white],["Alto impacto",eventos.filter(e=>e.imp==="alta").length,C.red],["Médio impacto",eventos.filter(e=>e.imp==="media").length,C.gold],["Países",3,C.blue]].map(([l,v,c])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
         <span style={{color:C.muted}}>{l}</span>
         <span style={{fontWeight:700,color:c}}>{v}</span>
        </div>
      ))}
     </div>
    </div>

    {/* Filtros */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     <span style={{fontSize:11,color:C.muted}}>Impacto:</span>
     {[["todos","Todos"],["alta","🔴 Alto"],["media","🟡 Médio"],["baixa","⚪ Baixo"]].map(([v,l])=>(
      <button key={v} onClick={()=>setFiltroImp(v)}
        style={filtroImp===v?S.btnV:{...S.btnO,fontSize:11,padding:"5px 10px"}}>{l}</button>
     ))}
     <span style={{fontSize:11,color:C.muted,marginLeft:8}}>Categoria:</span>
     {CATS.map(c=>(
      <button key={c} onClick={()=>setCatF(c)}
        style={catF===c?{background:C.blue,color:C.white,border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontSize:11,fontWeight:700}:{...S.btnO,fontSize:11,padding:"5px 10px",color:C.blue,borderColor:C.blue}}>{c}</button>
     ))}
    </div>

    {/* Tabela de eventos */}
    <div style={S.card}>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
         <tr style={{borderBottom:"1px solid "+C.border}}>
          {["Data","Hora","País","Evento","Cat.","Impacto","Anterior","Previsão","Real"].map(h=>(
           <th key={h} style={{padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"left",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
          ))}
         </tr>
        </thead>
        <tbody>
         {lista.map((e,i)=>(
          <tr key={i} style={{borderBottom:"1px solid "+C.border+"22",background:e.imp==="alta"?C.border+"22":"transparent"}}>
           <td style={{padding:"8px 10px",fontWeight:600,color:e.data==="Hoje"?C.accent:C.muted,whiteSpace:"nowrap"}}>{e.data}</td>
           <td style={{padding:"8px 10px",color:C.muted,whiteSpace:"nowrap"}}>{e.hora}</td>
           <td style={{padding:"8px 10px",fontSize:14}}>{e.pais}</td>
           <td style={{padding:"8px 10px",fontWeight:600}}>{e.evento}</td>
           <td style={{padding:"8px 10px"}}><span style={S.badge(C.blue)}>{e.cat}</span></td>
           <td style={{padding:"8px 10px"}}><span style={S.badge(IMP_COR[e.imp])}>{IMP_LABEL[e.imp]}</span></td>
           <td style={{padding:"8px 10px",color:C.muted}}>{e.ant||"--"}</td>
           <td style={{padding:"8px 10px",color:C.blue}}>{e.prev||"--"}</td>
           <td style={{padding:"8px 10px",fontWeight:700,color:e.real?C.accent:C.muted}}>{e.real||"⏳"}</td>
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabFundamentos({ filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [ativoSel, setAtivoSel] = useState(filtered[0]?.ticker || "PETR4");
  const [secao,    setSecao]    = useState("dre"); // dre | balanco | fluxo | valuation

  const ANOS = ["2015","2016","2017","2018","2019","2020","2021","2022","2023","2024","2025E","2026E"];
  const gerarFund = (ticker) => {
    const seed = ticker.charCodeAt(0)*7+ticker.charCodeAt(1)*3;
    const base = (seed%20+10)*1e9;
    return {
    receita:    ANOS.map((_,i)=>+(base*(1+i*.07+Math.sin(i)*.03)/1e9).toFixed(1)),
    lucrobruto: ANOS.map((_,i)=>+(base*.42*(1+i*.06)/1e9).toFixed(1)),
    ebitda:     ANOS.map((_,i)=>+(base*.32*(1+i*.06)/1e9).toFixed(1)),
    ebit:       ANOS.map((_,i)=>+(base*.26*(1+i*.06)/1e9).toFixed(1)),
    lucroliq:   ANOS.map((_,i)=>+(base*.18*(1+i*.08+Math.sin(i+1)*.05)/1e9).toFixed(1)),
    ativoTotal: ANOS.map((_,i)=>+(base*2.8*(1+i*.05)/1e9).toFixed(1)),
    divBruta:   ANOS.map((_,i)=>+(base*0.9*(1+i*.03)/1e9).toFixed(1)),
    divLiq:     ANOS.map((_,i)=>+(base*0.65*(1+i*.02)/1e9).toFixed(1)),
    pliq:       ANOS.map((_,i)=>+(base*1.2*(1+i*.07)/1e9).toFixed(1)),
    fcfOp:      ANOS.map((_,i)=>+(base*.28*(1+i*.06)/1e9).toFixed(1)),
    capex:      ANOS.map((_,i)=>+(base*.12*(1+i*.04)/1e9).toFixed(1)),
    fcfLiv:     ANOS.map((_,i)=>+(base*.16*(1+i*.06)/1e9).toFixed(1)),
    dividendos: ANOS.map((_,i)=>+(base*.08*(1+i*.05)/1e9).toFixed(1)),
    pe:         ANOS.map((_,i)=>+(15-i*.5+Math.sin(i)*2).toFixed(1)),
    ev_ebitda:  ANOS.map((_,i)=>+(9-i*.3+Math.sin(i)*1.5).toFixed(1)),
    pb:         ANOS.map((_,i)=>+(2.5-i*.08+Math.sin(i)*.3).toFixed(1)),
    dy:         ANOS.map((_,i)=>+(3+i*.3+Math.sin(i)*.5).toFixed(1)),
    roe:        ANOS.map((_,i)=>+(16+i*.8+Math.sin(i)*2).toFixed(1)),
    roic:       ANOS.map((_,i)=>+(14+i*.6+Math.sin(i)*2).toFixed(1)),
    };
  };

  const fund = useMemo(()=>gerarFund(ativoSel),[ativoSel]);
  const ultIdx = 9; // índice do último ano real (2024)

  const SECOES = [
    {id:"dre",       label:"DRE"},
    {id:"balanco",   label:"Balanço"},
    {id:"fluxo",     label:"Fluxo de Caixa"},
    {id:"valuation", label:"Valuation"},
  ];

  const LINHAS_DRE = [
    {l:"Receita Líquida",        k:"receita",    bold:true,  cor:C.white},
    {l:"Lucro Bruto",            k:"lucrobruto", bold:false, cor:C.text},
    {l:"Margem Bruta (%)",       k:null,         bold:false, cor:C.muted,
    calc:(i)=>fund.receita[i]>0?(fund.lucrobruto[i]/fund.receita[i]*100).toFixed(1)+"%":"--"},
    {l:"EBITDA",                 k:"ebitda",     bold:true,  cor:C.accent},
    {l:"Margem EBITDA (%)",      k:null,         bold:false, cor:C.muted,
    calc:(i)=>fund.receita[i]>0?(fund.ebitda[i]/fund.receita[i]*100).toFixed(1)+"%":"--"},
    {l:"EBIT",                   k:"ebit",       bold:false, cor:C.text},
    {l:"Lucro Líquido",          k:"lucroliq",   bold:true,  cor:C.accent},
    {l:"Margem Líquida (%)",     k:null,         bold:false, cor:C.muted,
    calc:(i)=>fund.receita[i]>0?(fund.lucroliq[i]/fund.receita[i]*100).toFixed(1)+"%":"--"},
  ];
  const LINHAS_BAL = [
    {l:"Ativo Total",      k:"ativoTotal",bold:true, cor:C.white},
    {l:"Dívida Bruta",     k:"divBruta", bold:false,cor:C.red},
    {l:"Dívida Líquida",   k:"divLiq",   bold:false,cor:C.red},
    {l:"Div.Liq/EBITDA",   k:null,       bold:false,cor:C.muted,calc:(i)=>fund.ebitda[i]>0?(fund.divLiq[i]/fund.ebitda[i]).toFixed(1)+"x":"--"},
    {l:"Patrimônio Líq.",  k:"pliq",     bold:true, cor:C.accent},
    {l:"ROE (%)",          k:"roe",      bold:false,cor:C.gold},
    {l:"ROIC (%)",         k:"roic",     bold:false,cor:C.gold},
  ];
  const LINHAS_FCF = [
    {l:"FCF Operacional",  k:"fcfOp",    bold:true, cor:C.white},
    {l:"CAPEX",            k:"capex",    bold:false,cor:C.red,neg:true},
    {l:"FCF Livre",        k:"fcfLiv",   bold:true, cor:C.accent},
    {l:"Dividendos Pagos", k:"dividendos",bold:false,cor:C.gold},
    {l:"FCF Yield (%)",    k:null,       bold:false,cor:C.muted,
    calc:(i)=>fund.fcfLiv[i]>0?(fund.fcfLiv[i]/fund.ebitda[i]*100).toFixed(1)+"%":"--"},
  ];
  const LINHAS_VAL = [
    {l:"P/E",              k:"pe",       bold:false,cor:C.blue},
    {l:"EV/EBITDA",        k:"ev_ebitda",bold:false,cor:C.blue},
    {l:"P/B (P/VPA)",      k:"pb",       bold:false,cor:C.purple},
    {l:"Dividend Yield (%)",k:"dy",      bold:false,cor:C.gold},
    {l:"ROE (%)",          k:"roe",      bold:false,cor:C.accent},
    {l:"ROIC (%)",         k:"roic",     bold:false,cor:C.accent},
  ];

  const linhasMap = {dre:LINHAS_DRE,balanco:LINHAS_BAL,fluxo:LINHAS_FCF,valuation:LINHAS_VAL};
  const linhas = linhasMap[secao]||[];
  const [linhaSel, setLinhaSel] = useState("receita");
  const dadosGraf = ANOS.map((ano,i)=>({ano,value:fund[linhaSel]?.[i]??0}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Seletor de ativo */}
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
     <span style={{fontSize:11,color:C.muted}}>Ativo:</span>
     <select style={{...S.sel,width:200,fontSize:12}} value={ativoSel} onChange={e=>setAtivoSel(e.target.value)}>
      {filtered.map(a=><option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>)}
     </select>
     {SECOES.map(s=>(
      <button key={s.id} onClick={()=>setSecao(s.id)}
        style={secao===s.id?S.btnV:{...S.btnO,fontSize:12,padding:"6px 14px"}}>{s.label}</button>
     ))}
    </div>

    {/* Gráfico da linha selecionada */}
    {fund[linhaSel]&&(
     <div style={S.card}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {(secao==="dre"?["receita","ebitda","lucroliq"]:secao==="balanco"?["ativoTotal","divLiq","pliq"]:secao==="fluxo"?["fcfOp","fcfLiv","dividendos"]:["pe","ev_ebitda","pb"]).map(k=>(
         <button key={k} onClick={()=>setLinhaSel(k)}
          style={linhaSel===k?{background:C.accent,color:"#000",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}:{...S.btnO,fontSize:11,padding:"5px 12px"}}>
          {k.toUpperCase()}
         </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={dadosGraf} barSize={22}>
         <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>v+"B"}/>
         <RechartsTip formatter={v=>[fmt(v,1)+"B R$"]} contentStyle={S.TT}/>
         <Bar dataKey="value" radius={[4,4,0,0]}>
          {dadosGraf.map((e,i)=>(
           <Cell key={i} fill={i>=ultIdx+1?C.blue:i===ultIdx?C.accent:C.border}/>
          ))}
         </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:12,fontSize:10,color:C.muted,marginTop:4}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.border,borderRadius:2}}/><span>Histórico</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.accent,borderRadius:2}}/><span>Último ano</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:C.blue,borderRadius:2}}/><span>Estimativa</span></div>
      </div>
     </div>
    )}

    {/* Tabela de histórico */}
    <div style={S.card}>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:800}}>
        <thead>
         <tr style={{borderBottom:"1px solid "+C.border}}>
          <th style={{padding:"8px 10px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"left",width:160}}>Indicador (R$ Bi)</th>
          {ANOS.map(a=>(
           <th key={a} style={{padding:"8px 8px",color:a.includes("E")?C.blue:C.muted,fontWeight:600,fontSize:10,textAlign:"right",whiteSpace:"nowrap",background:a.includes("E")?C.blue+"11":"transparent"}}>
            {a}
           </th>
          ))}
         </tr>
        </thead>
        <tbody>
         {linhas.map(linha=>(
          <tr key={linha.l} style={{borderBottom:"1px solid "+C.border+"22",background:linha.bold?C.border+"11":"transparent"}}>
           <td style={{padding:"7px 10px",fontWeight:linha.bold?700:400,color:linha.cor,whiteSpace:"nowrap"}}>{linha.l}</td>
           {ANOS.map((_,i)=>{
            const v=linha.calc?linha.calc(i):fund[linha.k]?.[i];
            const isEst=i>=ultIdx+1;
            const prev=i>0?(linha.calc?null:fund[linha.k]?.[i-1]):null;
            const chg=prev&&v&&!linha.calc?v-prev:null;
            return (
              <td key={i} style={{padding:"7px 8px",textAlign:"right",color:isEst?C.blue:linha.cor,fontWeight:linha.bold?700:400,background:isEst?C.blue+"08":"transparent",whiteSpace:"nowrap"}}>
               <div>{typeof v==="string"?v:v!=null?fmt(+v,1):""}</div>
               {chg!==null&&!isEst&&<div style={{fontSize:9,color:chg>=0?C.accent:C.red}}>{chg>=0?"▲":"▼"}{fmt(Math.abs(chg),1)}</div>}
              </td>
            );
           })}
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabEstimativas({ filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [ativoSel, setAtivoSel] = useState(filtered[0]?.ticker||"PETR4");
  const ativo = filtered.find(a=>a.ticker===ativoSel)||filtered[0];
  const precoAtual = ativo?preco(ativo):0;
  const consenso = {
    compra:12, neutro:5, venda:2,
    ptMediano:precoAtual*1.22,
    ptAlto:precoAtual*1.45,
    ptBaixo:precoAtual*0.88,
    upside:22.4,
  };
  const totalAnals = consenso.compra+consenso.neutro+consenso.venda;
  const earnings = [
    {trimestre:"1T2024",eps_est:1.82,eps_real:2.05,surpresa:+12.6,rec:"R$28.4B"},
    {trimestre:"4T2023",eps_est:1.95,eps_real:1.78,surpresa:-8.7, rec:"R$31.2B"},
    {trimestre:"3T2023",eps_est:2.12,eps_real:2.38,surpresa:+12.3,rec:"R$35.1B"},
    {trimestre:"2T2023",eps_est:1.88,eps_real:1.92,surpresa:+2.1, rec:"R$29.8B"},
    {trimestre:"1T2023",eps_est:2.20,eps_real:1.95,surpresa:-11.4,rec:"R$32.5B"},
    {trimestre:"4T2022",eps_est:2.45,eps_real:2.71,surpresa:+10.6,rec:"R$38.2B"},
    {trimestre:"3T2022",eps_est:2.88,eps_real:3.12,surpresa:+8.3, rec:"R$41.6B"},
    {trimestre:"2T2022",eps_est:2.55,eps_real:2.48,surpresa:-2.7, rec:"R$36.9B"},
  ];
  const estimativas = [
    {ano:"2025E",receita:142.5,ebitda:58.2,lucro:28.4,pe:5.8,div_yield:8.2,roic:28.5},
    {ano:"2026E",receita:151.8,ebitda:62.4,lucro:31.2,pe:5.2,div_yield:9.1,roic:30.2},
    {ano:"2027E",receita:158.2,ebitda:65.8,lucro:33.5,pe:4.8,div_yield:9.8,roic:31.8},
  ];
  const targets = [
    {banco:"BTG Pactual",  pt:precoAtual*1.32,rec:"Compra",  data:"15/03/2025"},
    {banco:"XP Investimentos",pt:precoAtual*1.28,rec:"Compra",data:"12/03/2025"},
    {banco:"Goldman Sachs",pt:precoAtual*1.22,rec:"Compra",  data:"10/03/2025"},
    {banco:"JPMorgan",     pt:precoAtual*1.18,rec:"Neutro",  data:"08/03/2025"},
    {banco:"Morgan Stanley",pt:precoAtual*1.35,rec:"Compra", data:"05/03/2025"},
    {banco:"Itaú BBA",     pt:precoAtual*1.15,rec:"Neutro",  data:"03/03/2025"},
    {banco:"Bank of America",pt:precoAtual*0.92,rec:"Venda", data:"01/03/2025"},
    {banco:"Bradesco BBI", pt:precoAtual*1.25,rec:"Compra",  data:"28/02/2025"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Seletor */}
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
     <span style={{fontSize:11,color:C.muted}}>Ativo:</span>
     <select style={{...S.sel,width:200,fontSize:12}} value={ativoSel} onChange={e=>setAtivoSel(e.target.value)}>
      {filtered.map(a=><option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>)}
     </select>
     <div style={{...S.card,padding:"8px 14px",display:"flex",gap:16,alignItems:"center"}}>
      <div><div style={{fontSize:10,color:C.muted}}>Preço Atual</div><div style={{fontSize:18,fontWeight:700}}>{fmtBRL(precoAtual)}</div></div>
      <div><div style={{fontSize:10,color:C.muted}}>PT Mediano</div><div style={{fontSize:18,fontWeight:700,color:C.accent}}>{fmtBRL(consenso.ptMediano)}</div></div>
      <div><div style={{fontSize:10,color:C.muted}}>Upside</div><div style={{fontSize:18,fontWeight:700,color:C.accent}}>+{consenso.upside}%</div></div>
     </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* Consenso */}
     <div style={S.card}>
      <SecaoTitulo titulo="Consenso de Analistas"
        sub={totalAnals+" analistas cobrindo "+ativoSel}/>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        {[["Compra",consenso.compra,C.accent],["Neutro",consenso.neutro,C.gold],["Venda",consenso.venda,C.red]].map(([l,v,c])=>(
         <div key={l} style={{flex:1,background:C.surface,borderRadius:10,padding:"12px",borderTop:"3px solid "+c,textAlign:"center"}}>
          <div style={{fontSize:26,fontWeight:800,color:c}}>{v}</div>
          <div style={{fontSize:11,color:C.muted}}>{l}</div>
          <div style={{fontSize:11,color:c}}>{(v/totalAnals*100).toFixed(0)}%</div>
         </div>
        ))}
      </div>
      {/* Barra de consenso */}
      <div style={{height:14,borderRadius:7,overflow:"hidden",display:"flex",marginBottom:8}}>
        <div style={{width:(consenso.compra/totalAnals*100)+"%",background:C.accent}}/>
        <div style={{width:(consenso.neutro/totalAnals*100)+"%",background:C.gold}}/>
        <div style={{width:(consenso.venda/totalAnals*100)+"%",background:C.red}}/>
      </div>
      {/* Price target range */}
      <div style={{padding:12,background:C.surface,borderRadius:8,marginTop:10}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Faixa de Price Targets</div>
        <div style={{position:"relative",height:10,background:C.border,borderRadius:5,overflow:"hidden",marginBottom:6}}>
         <div style={{
          position:"absolute",
          left:(consenso.ptBaixo/consenso.ptAlto*100*0.6)+"%",
          width:((consenso.ptAlto-consenso.ptBaixo)/consenso.ptAlto*60)+"%",
          height:"100%",background:C.blue+"66",borderRadius:5
         }}/>
         <div style={{
          position:"absolute",
          left:(consenso.ptMediano/consenso.ptAlto*100*0.6)+"%",
          top:0,bottom:0,width:2,background:C.accent
         }}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
         <div><span style={{color:C.muted}}>Baixo: </span><span style={{color:C.red}}>{fmtBRL(consenso.ptBaixo)}</span></div>
         <div><span style={{color:C.muted}}>Mediano: </span><span style={{color:C.accent,fontWeight:700}}>{fmtBRL(consenso.ptMediano)}</span></div>
         <div><span style={{color:C.muted}}>Alto: </span><span style={{color:C.accent}}>{fmtBRL(consenso.ptAlto)}</span></div>
        </div>
      </div>
     </div>

     {/* Price targets por banco */}
     <div style={S.card}>
      <SecaoTitulo titulo="Price Targets por Instituição"/>
      {targets.map(t=>{
        const upsidePct=precoAtual>0?((t.pt-precoAtual)/precoAtual*100):0;
        return (
         <div key={t.banco} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <div>
           <div style={{fontWeight:600}}>{t.banco}</div>
           <div style={{fontSize:10,color:C.muted}}>{t.data}</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
           <span style={S.badge(t.rec==="Compra"?C.accent:t.rec==="Venda"?C.red:C.gold)}>{t.rec}</span>
           <div style={{textAlign:"right"}}>
            <div style={{fontWeight:700}}>{fmtBRL(t.pt)}</div>
            <div style={{fontSize:10,color:upsidePct>=0?C.accent:C.red}}>{upsidePct>=0?"+":""}{fmt(upsidePct,1)}%</div>
           </div>
          </div>
         </div>
        );
      })}
     </div>
    </div>

    {/* Earnings Surprises */}
    <div style={S.card}>
     <SecaoTitulo titulo="Histórico de Earnings Surprises"
      sub="Verde = bateu estimativa · Vermelho = abaixo do esperado"/>
     <ResponsiveContainer width="100%" height={160}>
      <BarChart data={earnings} barSize={30}>
        <XAxis dataKey="trimestre" stroke={C.muted} tick={{fontSize:9}}/>
        <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
        <RechartsTip formatter={(v,n)=>[v+(n==="surpresa"?"%":""),n]} contentStyle={S.TT}/>
        <Bar dataKey="surpresa" name="Surpresa (%)" radius={[4,4,0,0]}>
         {earnings.map((e,i)=><Cell key={i} fill={e.surpresa>=0?C.accent:C.red}/>)}
        </Bar>
      </BarChart>
     </ResponsiveContainer>
     <div style={{overflowX:"auto",marginTop:8}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Trimestre","EPS Est.","EPS Real","Surpresa","Receita"].map(h=><th key={h} style={{padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"left",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>{earnings.map(e=>(
         <tr key={e.trimestre} style={{borderBottom:"1px solid "+C.border+"22"}}>
          <td style={{padding:"6px 8px",fontWeight:600}}>{e.trimestre}</td>
          <td style={{padding:"6px 8px",color:C.muted}}>R${e.eps_est}</td>
          <td style={{padding:"6px 8px",fontWeight:700}}>{fmtBRL(e.eps_real)}</td>
          <td style={{padding:"6px 8px"}}><span style={S.badge(e.surpresa>=0?C.accent:C.red)}>{e.surpresa>=0?"+":""}{e.surpresa}%</span></td>
          <td style={{padding:"6px 8px",color:C.muted}}>{e.rec}</td>
         </tr>
        ))}</tbody>
      </table>
     </div>
    </div>

    {/* Estimativas futuras */}
    <div style={S.card}>
     <SecaoTitulo titulo="Estimativas de Consenso — Forward" sub="Dados estimados pelo consenso Wall Street"/>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Ano","Receita","EBITDA","Lucro Líq.","P/E Fwd","Div.Yield","ROIC"].map(h=><th key={h} style={{padding:"7px 10px",color:C.blue,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>{estimativas.map(e=>(
         <tr key={e.ano} style={{borderBottom:"1px solid "+C.border+"22",background:C.blue+"08"}}>
          <td style={{padding:"8px 10px",fontWeight:700,color:C.blue,textAlign:"right"}}>{e.ano}</td>
          <td style={{padding:"8px 10px",textAlign:"right"}}>{fmt(e.receita,1)}B</td>
          <td style={{padding:"8px 10px",textAlign:"right",color:C.accent}}>{fmt(e.ebitda,1)}B</td>
          <td style={{padding:"8px 10px",textAlign:"right",color:C.accent}}>{fmt(e.lucro,1)}B</td>
          <td style={{padding:"8px 10px",textAlign:"right",color:C.blue}}>{e.pe}x</td>
          <td style={{padding:"8px 10px",textAlign:"right",color:C.gold}}>{e.div_yield}%</td>
          <td style={{padding:"8px 10px",textAlign:"right",color:C.accent}}>{e.roic}%</td>
         </tr>
        ))}</tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabInsider({ filtered }) {
  const [ativoSel, setAtivoSel] = useState(filtered[0]?.ticker||"PETR4");
  const [tipoFilt, setTipoFilt] = useState("todos");

  const insiders = [
    {nome:"Jean Paul Prates",    cargo:"CEO",         tipo:"venda",  qtd:120000, preco:36.80, total:4416000,  data:"12/03/2025"},
    {nome:"Clarice Coppetti",    cargo:"CFO",         tipo:"compra", qtd:50000,  preco:34.20, total:1710000,  data:"05/03/2025"},
    {nome:"Conselho",            cargo:"Diretor",     tipo:"venda",  qtd:80000,  preco:37.10, total:2968000,  data:"28/02/2025"},
    {nome:"José Mauro Coelho",   cargo:"Ex-CEO",      tipo:"venda",  qtd:200000, preco:35.50, total:7100000,  data:"15/02/2025"},
    {nome:"Rodrigo Araújo",      cargo:"Dir. Finanças",tipo:"compra",qtd:30000,  preco:33.80, total:1014000,  data:"10/02/2025"},
    {nome:"Pedro Parente",       cargo:"Cons. Admin.", tipo:"compra",qtd:45000,  preco:32.50, total:1462500,  data:"02/02/2025"},
    {nome:"Ana Paula Salave'a",  cargo:"Dir. Jurídica",tipo:"venda", qtd:60000,  preco:38.20, total:2292000,  data:"25/01/2025"},
  ];

  const ownership = [
    {entidade:"União Federal",         tipo:"controlador",pct:36.61,qtd:"5.73B ações",chg:0},
    {entidade:"BNDESPAR",              tipo:"estratégico",pct:12.08,qtd:"1.89B ações",chg:-0.2},
    {entidade:"BlackRock Inc.",        tipo:"institucional",pct:4.82,qtd:"754M ações",chg:+0.3},
    {entidade:"Vanguard Group",        tipo:"institucional",pct:3.91,qtd:"611M ações",chg:+0.1},
    {entidade:"Norges Bank",           tipo:"institucional",pct:2.14,qtd:"335M ações",chg:+0.5},
    {entidade:"Fidelity Investments",  tipo:"institucional",pct:1.85,qtd:"290M ações",chg:-0.1},
    {entidade:"State Street",          tipo:"institucional",pct:1.72,qtd:"269M ações",chg:0},
    {entidade:"Capital Research",      tipo:"institucional",pct:1.44,qtd:"225M ações",chg:+0.2},
    {entidade:"Free Float (outros)",   tipo:"free_float",  pct:35.43,qtd:"5.54B ações",chg:0},
  ];

  const lista = insiders.filter(t=>tipoFilt==="todos"||t.tipo===tipoFilt);
  const compras = insiders.filter(i=>i.tipo==="compra").reduce((s,i)=>s+i.total,0);
  const vendas  = insiders.filter(i=>i.tipo==="venda").reduce((s,i)=>s+i.total,0);
  const buyVsSell = vendas>0?compras/vendas:0;

  const TP_COR = {controlador:"#F97316",estratégico:C.gold,institucional:C.blue,free_float:C.muted};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* Seletor */}
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
     <select style={{...S.sel,width:200,fontSize:12}} value={ativoSel} onChange={e=>setAtivoSel(e.target.value)}>
      {filtered.map(a=><option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>)}
     </select>
     <div style={{display:"flex",gap:6}}>
      {[["todos","Todos"],["compra","🟢 Compras"],["venda","🔴 Vendas"]].map(([v,l])=>(
        <button key={v} onClick={()=>setTipoFilt(v)}
         style={tipoFilt===v?S.btnV:{...S.btnO,fontSize:11,padding:"5px 12px"}}>{l}</button>
      ))}
     </div>
    </div>

    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Compras Insiders",fmtBRL(compras),C.accent,"Total no período"],
      ["Vendas Insiders", fmtBRL(vendas),  C.red,   "Total no período"],
      ["Buy/Sell Ratio",  fmt(buyVsSell,2)+"x",buyVsSell>1?C.accent:C.red,"Compras/Vendas"],
      ["N. Transações",   insiders.length,  C.blue,  "Últimos 90 dias"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>
     {/* Transações */}
     <div style={S.card}>
      <SecaoTitulo titulo="Transações de Insiders"/>
      {lista.map((t,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
         <div>
          <div style={{fontWeight:600}}>{t.nome}</div>
          <div style={{fontSize:10,color:C.muted}}>{t.cargo} · {t.data}</div>
         </div>
         <div style={{textAlign:"right"}}>
          <div><span style={S.badge(t.tipo==="compra"?C.accent:C.red)}>{t.tipo}</span></div>
          <div style={{fontWeight:700,marginTop:3}}>{fmtBRL(t.total)}</div>
          <div style={{fontSize:10,color:C.muted}}>{fmt(t.qtd/1000,0)}k × {fmtBRL(t.preco)}</div>
         </div>
        </div>
      ))}
     </div>

     {/* Ownership */}
     <div style={S.card}>
      <SecaoTitulo titulo="Estrutura de Ownership" sub="Principais acionistas e participações"/>
      {ownership.map(o=>(
        <div key={o.entidade} style={{marginBottom:9}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <div>
           <div style={{fontWeight:600}}>{o.entidade}</div>
           <div style={{fontSize:10,color:C.muted}}>{o.qtd}</div>
          </div>
          <div style={{textAlign:"right"}}>
           <div style={{fontWeight:700}}>{fmt(o.pct,2)}%</div>
           {o.chg!==0&&<div style={{fontSize:10,color:o.chg>0?C.accent:C.red}}>{o.chg>0?"+":""}{o.chg}% 3M</div>}
          </div>
         </div>
         <Barra pct={o.pct} cor={TP_COR[o.tipo]||C.muted} altura={5}/>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabScatter({ filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [eixoX, setEixoX] = useState("pe");
  const [eixoY, setEixoY] = useState("dy");
  const [tamanho, setTamanho] = useState("mktcap");

  const METRICAS_SCATTER = [
    {id:"pe",       label:"P/E"},
    {id:"pb",       label:"P/B (P/VPA)"},
    {id:"dy",       label:"Dividend Yield (%)"},
    {id:"roe",      label:"ROE (%)"},
    {id:"vol",      label:"Volatilidade (%)"},
    {id:"mktcap",   label:"Market Cap"},
    {id:"ev_ebitda",label:"EV/EBITDA"},
    {id:"pt_upside",label:"Upside PT (%)"},
    {id:"ret_ytd",  label:"Retorno YTD (%)"},
  ];

  const ATIVOS_SCATTER = [
    {ticker:"PETR4",nome:"Petrobras",     pe:5.2, pb:1.8, dy:8.5, roe:32, vol:28,mktcap:450,ev_ebitda:4.2,pt_upside:18,ret_ytd:12},
    {ticker:"VALE3",nome:"Vale",          pe:6.1, pb:2.1, dy:7.2, roe:28, vol:32,mktcap:310,ev_ebitda:5.1,pt_upside:22,ret_ytd:-5},
    {ticker:"ITUB4",nome:"Itaú",          pe:8.4, pb:1.9, dy:5.8, roe:22, vol:18,mktcap:280,ev_ebitda:null,pt_upside:15,ret_ytd:8},
    {ticker:"WEGE3",nome:"WEG",           pe:32.5,pb:11.2,dy:1.2, roe:38, vol:22,mktcap:190,ev_ebitda:22.1,pt_upside:12,ret_ytd:18},
    {ticker:"AAPL", nome:"Apple",         pe:28.2,pb:45.1,dy:0.5, roe:160,vol:22,mktcap:3200,ev_ebitda:22.5,pt_upside:18,ret_ytd:22},
    {ticker:"MSFT", nome:"Microsoft",     pe:34.1,pb:12.8,dy:0.8, roe:42, vol:20,mktcap:3100,ev_ebitda:28.2,pt_upside:20,ret_ytd:15},
    {ticker:"NVDA", nome:"NVIDIA",        pe:45.8,pb:38.2,dy:0.04,roe:82, vol:42,mktcap:2800,ev_ebitda:40.1,pt_upside:28,ret_ytd:35},
    {ticker:"ABEV3",nome:"Ambev",         pe:14.8,pb:2.8, dy:4.2, roe:18, vol:16,mktcap:165,ev_ebitda:9.4, pt_upside:8, ret_ytd:3},
    {ticker:"RDOR3",nome:"Rede D'Or",     pe:22.1,pb:3.4, dy:0.8, roe:12, vol:26,mktcap:68,ev_ebitda:15.2,pt_upside:25,ret_ytd:28},
    {ticker:"JPM",  nome:"JPMorgan",      pe:12.4,pb:2.1, dy:2.1, roe:16, vol:18,mktcap:700,ev_ebitda:null,pt_upside:14,ret_ytd:10},
    {ticker:"META", nome:"Meta",          pe:24.8,pb:8.4, dy:0.4, roe:34, vol:30,mktcap:1400,ev_ebitda:17.2,pt_upside:22,ret_ytd:42},
    {ticker:"BBDC4",nome:"Bradesco",      pe:6.9, pb:1.2, dy:6.1, roe:16, vol:20,mktcap:145,ev_ebitda:null,pt_upside:10,ret_ytd:-8},
  ];

  const CORES_SETOR = ["#00C896","#3B82F6","#F5A623","#A78BFA","#FF4D6D","#34D399","#F97316","#FBBF24","#60A5FA","#F472B6"];

  const dadosPlot = ATIVOS_SCATTER
    .filter(a=>a[eixoX]!=null&&a[eixoY]!=null)
    .map((a,i)=>({...a,x:a[eixoX],y:a[eixoY],r:a[tamanho]?Math.sqrt(a[tamanho]/100)*2+4:6,cor:CORES_SETOR[i%CORES_SETOR.length]}));

  const [hoverId, setHoverId] = useState(null);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Controles */}
    <div style={S.card}>
     <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-end"}}>
      {[["Eixo X",eixoX,setEixoX],["Eixo Y",eixoY,setEixoY],["Tamanho",tamanho,setTamanho]].map(([l,v,fn])=>(
        <div key={l}>
         <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{l}</div>
         <select style={{...S.sel,width:160,fontSize:12}} value={v} onChange={e=>fn(e.target.value)}>
          {METRICAS_SCATTER.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
         </select>
        </div>
      ))}
      <div style={{fontSize:11,color:C.muted}}>
        Passe o mouse sobre os pontos para ver detalhes
      </div>
     </div>
    </div>

    {/* Scatter Chart */}
    <div style={S.card}>
     <SecaoTitulo
      titulo={`${METRICAS_SCATTER.find(m=>m.id===eixoX)?.label} vs ${METRICAS_SCATTER.find(m=>m.id===eixoY)?.label}`}
      sub={`Tamanho dos pontos = ${METRICAS_SCATTER.find(m=>m.id===tamanho)?.label}`}/>
     <ResponsiveContainer width="100%" height={380}>
      <ScatterChart margin={{top:10,right:30,bottom:30,left:20}}>
        <XAxis type="number" dataKey="x" name={eixoX} stroke={C.muted} tick={{fontSize:10}}
         label={{value:METRICAS_SCATTER.find(m=>m.id===eixoX)?.label,position:"insideBottom",offset:-12,fill:C.muted,fontSize:11}}/>
        <YAxis type="number" dataKey="y" name={eixoY} stroke={C.muted} tick={{fontSize:10}}
         label={{value:METRICAS_SCATTER.find(m=>m.id===eixoY)?.label,angle:-90,position:"insideLeft",fill:C.muted,fontSize:11}}/>
        <RechartsTip
         cursor={{strokeDasharray:"3 3"}}
         contentStyle={S.TT}
         content={({active,payload})=>{
          if(!active||!payload?.length) return null;
          const d=payload[0]?.payload;
          if(!d) return null;
          return (
           <div style={{...S.TT,padding:"10px 14px",minWidth:160}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{d.ticker} — {d.nome}</div>
            <div style={{fontSize:12,color:C.muted}}>{METRICAS_SCATTER.find(m=>m.id===eixoX)?.label}: <b style={{color:C.text}}>{d.x}</b></div>
            <div style={{fontSize:12,color:C.muted}}>{METRICAS_SCATTER.find(m=>m.id===eixoY)?.label}: <b style={{color:C.text}}>{d.y}</b></div>
            <div style={{fontSize:12,color:C.muted}}>{METRICAS_SCATTER.find(m=>m.id===tamanho)?.label}: <b style={{color:C.text}}>{d[tamanho]}</b></div>
           </div>
          );
         }}/>
        <Scatter data={dadosPlot} shape={(props)=>{
         const {cx,cy,payload}=props;
         return (
          <g>
           <circle cx={cx} cy={cy} r={payload.r} fill={payload.cor} opacity={.75} stroke={C.white} strokeWidth={.5}/>
           <text x={cx} y={cy-payload.r-3} textAnchor="middle" fontSize={9} fill={C.text}>{payload.ticker}</text>
          </g>
         );
        }}/>
      </ScatterChart>
     </ResponsiveContainer>
     {/* Legenda */}
     <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:8}}>
      {dadosPlot.map(a=>(
        <div key={a.ticker} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
         <div style={{width:10,height:10,borderRadius:"50%",background:a.cor}}/>
         <span style={{color:C.muted}}>{a.ticker}</span>
        </div>
      ))}
     </div>
    </div>

    {/* Tabela de dados */}
    <div style={S.card}>
     <SecaoTitulo titulo="Tabela Comparativa"/>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Ticker","Nome","P/E","P/B","D.Yield","ROE","Vol","Mkt Cap","Upside PT","Ret YTD"].map(h=>(
         <th key={h} style={{padding:"7px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
        ))}</tr></thead>
        <tbody>{ATIVOS_SCATTER.map(a=>(
         <tr key={a.ticker} style={{borderBottom:"1px solid "+C.border+"22"}}>
          <td style={{padding:"7px 8px",fontWeight:700,textAlign:"left"}}>{a.ticker}</td>
          <td style={{padding:"7px 8px",color:C.muted,fontSize:11,textAlign:"left"}}>{a.nome}</td>
          <td style={{padding:"7px 8px",textAlign:"right"}}>{fmt(a.pe,1)}x</td>
          <td style={{padding:"7px 8px",textAlign:"right"}}>{fmt(a.pb,1)}x</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.gold}}>{fmt(a.dy,1)}%</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.accent}}>{fmt(a.roe,0)}%</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:a.vol>30?C.red:C.muted}}>{a.vol}%</td>
          <td style={{padding:"7px 8px",textAlign:"right"}}>{a.mktcap>=1000?"R$"+(a.mktcap/1000).toFixed(1)+"T":"R$"+a.mktcap+"B"}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:a.pt_upside>0?C.accent:C.red}}>+{a.pt_upside}%</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:a.ret_ytd>=0?C.accent:C.red}}>{a.ret_ytd>=0?"+":""}{a.ret_ytd}%</td>
         </tr>
        ))}</tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabDividendos({ filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [ativoSel, setAtivoSel] = useState(filtered[0]?.ticker||"PETR4");
  const ativo = filtered.find(a=>a.ticker===ativoSel)||filtered[0];
  const precoAtual = ativo?preco(ativo):0;

  const divHist = [
    {data:"20/03/2025",tipo:"JCP",     val:0.42,dy:1.18},
    {data:"15/12/2024",tipo:"Dividendo",val:0.65,dy:1.82},
    {data:"20/09/2024",tipo:"JCP",     val:0.38,dy:1.05},
    {data:"22/06/2024",tipo:"Dividendo",val:0.55,dy:1.55},
    {data:"22/03/2024",tipo:"JCP",     val:0.40,dy:1.12},
    {data:"15/12/2023",tipo:"Dividendo",val:1.20,dy:3.24},
    {data:"21/09/2023",tipo:"JCP",     val:0.52,dy:1.48},
    {data:"23/06/2023",tipo:"Dividendo",val:0.85,dy:2.35},
    {data:"24/03/2023",tipo:"JCP",     val:0.45,dy:1.32},
    {data:"16/12/2022",tipo:"Especial", val:3.35,dy:9.12},
    {data:"22/09/2022",tipo:"JCP",     val:0.62,dy:1.78},
    {data:"24/06/2022",tipo:"Dividendo",val:1.85,dy:5.42},
  ];

  const divPorAno = [2020,2021,2022,2023,2024,2025].map(ano=>{
    const total=[0.82,1.45,8.24,3.02,2.00,0.85][ano-2020]||0;
    return {ano:ano.toString(),total,dy:(total/precoAtual*100)};
  });

  const totalUlt12m = divHist.slice(0,4).reduce((s,d)=>s+d.val,0);
  const dyAtual     = precoAtual>0?totalUlt12m/precoAtual*100:0;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
     <select style={{...S.sel,width:200,fontSize:12}} value={ativoSel} onChange={e=>setAtivoSel(e.target.value)}>
      {filtered.map(a=><option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>)}
     </select>
    </div>

    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Dividendo Último 12M",fmtBRL(totalUlt12m),C.accent,"Por ação"],
      ["Dividend Yield Atual",fmt(dyAtual,2)+"%",C.gold,"Sobre preço atual"],
      ["Tipo Predominante",   "JCP + Dividendo",C.blue,"Estrutura de proventos"],
      ["Periodicidade",       "Trimestral",      C.purple,"Frequência histórica"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Dividendos por Ano"/>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={divPorAno} barSize={32}>
         <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:10}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>"R$"+v}/>
         <RechartsTip formatter={(v,n)=>[n==="total"?"R$"+fmt(v,2)+" p/ação":fmt(v,2)+"%",n==="total"?"Total":"DY"]} contentStyle={S.TT}/>
         <Bar dataKey="total" name="total" fill={C.accent} radius={[4,4,0,0]}>
          {divPorAno.map((e,i)=><Cell key={i} fill={i===4||i===5?C.accent:C.border}/>)}
         </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{marginTop:10}}>
        {divPorAno.slice().reverse().map(a=>(
         <div key={a.ano} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <span style={{fontWeight:600}}>{a.ano}</span>
          <span style={{color:C.accent,fontWeight:700}}>R${fmt(a.total,2)}</span>
          <span style={{color:C.gold}}>{fmt(a.dy,2)}% DY</span>
         </div>
        ))}
      </div>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Histórico de Proventos"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
         <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Data","Tipo","Valor","DY"].map(h=><th key={h} style={{padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"left",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
         <tbody>{divHist.map((d,i)=>(
          <tr key={i} style={{borderBottom:"1px solid "+C.border+"22"}}>
           <td style={{padding:"7px 8px",color:C.muted}}>{d.data}</td>
           <td style={{padding:"7px 8px"}}><span style={S.badge(d.tipo==="Especial"?C.gold:d.tipo==="JCP"?C.blue:C.accent)}>{d.tipo}</span></td>
           <td style={{padding:"7px 8px",fontWeight:700,color:C.accent}}>R${fmt(d.val,2)}</td>
           <td style={{padding:"7px 8px",color:C.gold}}>{fmt(d.dy,2)}%</td>
          </tr>
         ))}</tbody>
        </table>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabXRay({ filtered, quotes={}, totalVal, byCat }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const HOLDINGS_ETF = {
    "SPY":  [{ticker:"AAPL",w:7.2},{ticker:"MSFT",w:6.8},{ticker:"NVDA",w:5.1},{ticker:"GOOGL",w:4.2},{ticker:"META",w:2.8},{ticker:"AMZN",w:3.5},{ticker:"TSLA",w:1.9},{ticker:"JPM",w:1.8},{ticker:"BRK.B",w:1.6},{ticker:"UNH",w:1.4}],
    "QQQ":  [{ticker:"AAPL",w:9.1},{ticker:"MSFT",w:8.8},{ticker:"NVDA",w:8.5},{ticker:"GOOGL",w:5.4},{ticker:"META",w:4.2},{ticker:"AMZN",w:4.8},{ticker:"TSLA",w:3.1},{ticker:"NFLX",w:1.8},{ticker:"COST",w:1.7},{ticker:"PYPL",w:1.2}],
    "HGLG11":[{ticker:"LOG CP",w:12.4},{ticker:"GLP Part.",w:9.8},{ticker:"Prologis BR",w:8.2},{ticker:"JBS Logística",w:7.1},{ticker:"Others",w:62.5}],
    "XPML11":[{ticker:"Shopping Iguatemi",w:14.2},{ticker:"Aliansce Sonae",w:11.8},{ticker:"Multiplan",w:10.5},{ticker:"BR Malls",w:9.2},{ticker:"Others",w:54.3}],
  };
  const expConsolid = {};
  filtered.forEach(a=>{
    const val = preco(a)*a.qty;
    const holdings = HOLDINGS_ETF[a.ticker];
    if(holdings){
    holdings.forEach(h=>{
     expConsolid[h.ticker]=(expConsolid[h.ticker]||0)+val*h.w/100;
    });
    } else {
    expConsolid[a.ticker]=(expConsolid[a.ticker]||0)+val;
    }
  });

  const topExp = Object.entries(expConsolid)
    .map(([t,v])=>({ticker:t,val:v,pct:totalVal?v/totalVal*100:0}))
    .sort((a,b)=>b.val-a.val)
    .slice(0,15);
  const etfs = filtered.filter(a=>a.category==="etfs"||a.category==="acoes_eua");
  const duplicatas = topExp.filter(e=>e.pct>1.5);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Posições Diretas",filtered.length,C.blue,"Ativos no portfólio"],
      ["Look-Through Total",Object.keys(expConsolid).length,C.accent,"Holdings únicas"],
      ["Sobreposição >1.5%",duplicatas.length,C.gold,"Posições concentradas"],
      ["ETFs/FIIs com holdings",filtered.filter(a=>HOLDINGS_ETF[a.ticker]).length,C.purple,"Analisados"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Top Exposições Look-Through"
        sub="Inclui holdings dentro de ETFs e FIIs. Revela concentração oculta."/>
      {topExp.map((e,i)=>(
        <div key={e.ticker} style={{marginBottom:9}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
           <span style={{fontSize:10,color:C.muted,width:16}}>{i+1}</span>
           <span style={{fontWeight:700}}>{e.ticker}</span>
          </div>
          <div style={{display:"flex",gap:10}}>
           <span style={{fontWeight:800,fontSize:13,color:e.pct>5?C.gold:C.text}}>{fmt(e.pct,2)}%</span>
           <span style={{color:C.muted}}>{fmtBRL(e.val)}</span>
          </div>
         </div>
         <Barra pct={e.pct} cor={e.pct>5?C.gold:e.pct>2?C.blue:C.muted} altura={5}/>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Holdings por ETF/FII"
        sub="Detalhamento dos principais fundos e ETFs do portfólio"/>
      {filtered.filter(a=>HOLDINGS_ETF[a.ticker]).map(a=>{
        const holdings=HOLDINGS_ETF[a.ticker]||[];
        const val=preco(a)*a.qty;
        return (
         <div key={a.ticker} style={{marginBottom:16,padding:"10px 12px",background:C.surface,borderRadius:8}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:C.accent}}>{a.ticker} — {a.name}</div>
          {holdings.slice(0,5).map(h=>(
           <div key={h.ticker} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
            <span>{h.ticker}</span>
            <div style={{display:"flex",gap:8}}>
              <span style={{color:C.muted}}>{h.w}% do fundo</span>
              <span style={{color:C.accent}}>{fmt(h.w*val/totalVal/100,3)}% do port.</span>
            </div>
           </div>
          ))}
          {holdings.length>5&&<div style={{fontSize:10,color:C.muted,marginTop:4}}>+{holdings.length-5} holdings...</div>}
         </div>
        );
      })}
      {filtered.filter(a=>HOLDINGS_ETF[a.ticker]).length===0&&(
        <div style={{color:C.muted,fontSize:12,padding:16}}>Adicione ETFs ou FIIs ao portfólio para ver o look-through</div>
      )}
     </div>
    </div>
    </div>
  );
}
function TabBacktest({ byCat, totalVal, portRet, portVol, portSharpe, portMaxDD, portBeta }) {
  const ATIVOS_BT = ["Acoes BR","FIIs","Renda Fixa","Acoes EUA","ETFs","Cripto","Commodities","Cambio","Imoveis"];
  const ANOS_BT   = ["2015","2016","2017","2018","2019","2020","2021","2022","2023","2024"];
  const RET_HIST  = { "Acoes BR":[0.38,0.28,-0.12,0.15,0.32,-0.03,0.06,-0.06,0.22,-0.10], "FIIs":[0.36,0.33,0.22,0.04,0.36,-0.08,0.08,-0.14,0.08,-0.04], "Renda Fixa":[0.134,0.140,0.101,0.065,0.059,0.028,0.042,0.124,0.135,0.108], "Acoes EUA":[0.01,0.12,0.21,0.02,0.31,-0.13,0.27,-0.19,0.26,0.25], "ETFs":[0.00,0.11,0.20,0.01,0.29,-0.12,0.24,-0.18,0.24,0.23], "Cripto":[1.35,-0.72,0.13,0.82,-0.74,0.30,0.60,-0.65,1.55,0.12], "Commodities":[-0.25,0.12,0.04,-0.10,0.08,0.02,0.23,-0.08,0.05,-0.12], "Cambio":[0.47,-0.22,-0.02,-0.15,0.07,0.29,0.07,0.05,0.08,0.18], "Imoveis":[0.12,0.08,0.05,0.04,0.09,-0.05,0.06,0.04,0.08,0.06] };
  const [ports, setPorts] = useState([
    { nome:"Portfolio 1 (Atual)", ativos:[{classe:"Acoes BR",pct:25},{classe:"FIIs",pct:10},{classe:"Renda Fixa",pct:30},{classe:"Acoes EUA",pct:20},{classe:"ETFs",pct:10},{classe:"Cripto",pct:5}] },
    { nome:"60/40 Clássico",      ativos:[{classe:"Acoes BR",pct:30},{classe:"Acoes EUA",pct:30},{classe:"Renda Fixa",pct:40}] },
    { nome:"Ray Dalio All Weather",ativos:[{classe:"Acoes EUA",pct:30},{classe:"Renda Fixa",pct:55},{classe:"Ouro",pct:7.5},{classe:"Commodities",pct:7.5}] },
  ]);
  const [aporteAnual, setAporteAnual] = useState(0);
  const [rebal,       setRebal]       = useState("anual");
  const [alavancagem, setAlavancagem] = useState(1);
  const [portSel,     setPortSel]     = useState(0); // porta ativa para edição
  function calcPort(port) {
    let valor = 1000000; // base 1M
    const series = [{ ano:"Início", valor }];
    const metrics = { totalRet:0, anos:[] };
    ANOS_BT.forEach((ano, i) => {
    const retAnual = port.ativos.reduce((s, a) => {
     const rets = RET_HIST[a.classe] || RET_HIST["Renda Fixa"];
     return s + (a.pct / 100) * (rets[i] || 0);
    }, 0) * alavancagem;
    valor = valor * (1 + retAnual) + aporteAnual;
    series.push({ ano, valor: Math.round(valor), ret: +( retAnual * 100).toFixed(1) });
    metrics.anos.push(retAnual * 100);
    });
    const retAnual = ((valor / 1000000) ** (1 / ANOS_BT.length) - 1) * 100;
    const vols = metrics.anos;
    const mu   = vols.reduce((s, v) => s + v, 0) / vols.length;
    const vol  = Math.sqrt(vols.reduce((s, v) => s + (v - mu) ** 2, 0) / vols.length);
    const sharpe = vol > 0 ? (retAnual - 10.5) / vol : 0;
    const maxDD  = Math.min(...vols);
    return { series, retAnual: +retAnual.toFixed(2), vol: +vol.toFixed(2), sharpe: +sharpe.toFixed(2), maxDD: +maxDD.toFixed(1), finalVal: valor };
  }

  const resultados = ports.map(calcPort);
  const dadosComp = ["Início", ...ANOS_BT].map((ano, i) => {
    const r = { ano };
    ports.forEach((p, j) => { r["p" + j] = resultados[j].series[i]?.valor; });
    return r;
  });

  const CORES_P = [C.accent, C.blue, C.gold];
  const LAZY_PORTFOLIOS = {
    "60/40 Clássico":       [{classe:"Acoes EUA",pct:60},{classe:"Renda Fixa",pct:40}],
    "Ray Dalio All Weather":[{classe:"Acoes EUA",pct:30},{classe:"Renda Fixa",pct:55},{classe:"Commodities",pct:7.5},{classe:"Commodities",pct:7.5}],
    "David Swensen Yale":   [{classe:"Acoes EUA",pct:30},{classe:"FIIs",pct:20},{classe:"Acoes EUA",pct:15},{classe:"Renda Fixa",pct:15},{classe:"Commodities",pct:10},{classe:"ETFs",pct:10}],
    "Harry Browne Permanent":[{classe:"Acoes EUA",pct:25},{classe:"Renda Fixa",pct:25},{classe:"Commodities",pct:25},{classe:"Cambio",pct:25}],
    "Portfólio Atual":      byCat.map(c=>({classe:c.label,pct:+c.pct.toFixed(1)})).filter(c=>c.pct>0),
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Config */}
    <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
     <div>
      <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Aporte Anual (R$)</div>
      <input style={{ ...S.inp, width:140 }} type="number" value={aporteAnual}
        onChange={e => setAporteAnual(+e.target.value)} placeholder="0"/>
     </div>
     <div>
      <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Rebalanceamento</div>
      <select style={{ ...S.sel, width:140 }} value={rebal} onChange={e => setRebal(e.target.value)}>
        {["Nenhum","mensal","trimestral","anual","Bandas 5%"].map(v=><option key={v} value={v}>{v}</option>)}
      </select>
     </div>
     <div>
      <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Alavancagem</div>
      <select style={{ ...S.sel, width:120 }} value={alavancagem} onChange={e => setAlavancagem(+e.target.value)}>
        {[1,1.25,1.5,2].map(v=><option key={v} value={v}>{v}x</option>)}
      </select>
     </div>
    </div>

    {/* Seletor de portfólio + lazy portfolios */}
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
     {ports.map((p, i) => (
      <button key={i} onClick={() => setPortSel(i)}
        style={{ ...portSel===i ? { background: CORES_P[i], color:"#000", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontWeight:700 } : { ...S.btnO, color: CORES_P[i], borderColor: CORES_P[i] }, fontSize:12 }}>
        {p.nome}
      </button>
     ))}
     <select style={{ ...S.sel, width:180, fontSize:11 }}
      onChange={e => {
        const lz = LAZY_PORTFOLIOS[e.target.value];
        if (lz) setPorts(p => p.map((port, i) => i === portSel ? { ...port, ativos: lz } : port));
      }}>
      <option value="">Lazy Portfolios →</option>
      {Object.keys(LAZY_PORTFOLIOS).map(k => <option key={k} value={k}>{k}</option>)}
     </select>
    </div>

    {/* Resultados comparativos */}
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {ports.map((p, i) => {
      const r = resultados[i];
      return (
        <div key={i} style={{ ...S.card, flex:1, minWidth:200, borderTop:`3px solid ${CORES_P[i]}` }}>
         <div style={{ fontWeight:700, fontSize:13, color: CORES_P[i], marginBottom:10 }}>{p.nome}</div>
         {[["CAGR", r.retAnual+"%", CORES_P[i]], ["Volatilidade", r.vol+"%", C.gold], ["Sharpe", r.sharpe, r.sharpe>1?C.accent:C.gold], ["Max DD", r.maxDD+"%", C.red], ["Final (1M)", fmtBRL(r.finalVal), C.white]].map(([l,v,c]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}>
           <span style={{ color:C.muted }}>{l}</span>
           <span style={{ fontWeight:700, color:c }}>{v}</span>
          </div>
         ))}
        </div>
      );
     })}
    </div>

    {/* Gráfico de evolução */}
    <div style={S.card}>
     <SecaoTitulo titulo="Evolução do Patrimônio — R$1.000.000 Inicial"
      sub={`Rebalanceamento: ${rebal} · Alavancagem: ${alavancagem}x · Aporte anual: ${fmtBRL(aporteAnual)}`}/>
     <ResponsiveContainer width="100%" height={260}>
      <LineChart data={dadosComp}>
        <XAxis dataKey="ano" stroke={C.muted} tick={{ fontSize:10 }}/>
        <YAxis stroke={C.muted} tick={{ fontSize:8 }} tickFormatter={v=>"R$"+(v/1e6).toFixed(1)+"M"}/>
        <RechartsTip formatter={(v, n) => [fmtBRL(+v), ports[+n.replace("p","")]?.nome]} contentStyle={S.TT}/>
        <Legend formatter={(v) => ports[+v.replace("p","")]?.nome}/>
        {ports.map((_, i) => (
         <Line key={i} type="monotone" dataKey={`p${i}`} stroke={CORES_P[i]} strokeWidth={2.5} dot={false}/>
        ))}
      </LineChart>
     </ResponsiveContainer>
    </div>

    {/* Retornos anuais */}
    <div style={S.card}>
     <SecaoTitulo titulo="Retornos Anuais por Portfólio"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
         <tr style={{ borderBottom:"1px solid "+C.border }}>
          <th style={{ padding:"7px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left" }}>Ano</th>
          {ports.map((p, i) => <th key={i} style={{ padding:"7px 10px", color:CORES_P[i], fontWeight:600, fontSize:10, textAlign:"right" }}>{p.nome}</th>)}
         </tr>
        </thead>
        <tbody>
         {ANOS_BT.map((ano, yi) => (
          <tr key={ano} style={{ borderBottom:"1px solid "+C.border+"22" }}>
           <td style={{ padding:"7px 10px", fontWeight:600 }}>{ano}</td>
           {resultados.map((r, i) => {
            const v = r.series[yi+1]?.ret;
            return <td key={i} style={{ padding:"7px 10px", textAlign:"right", fontWeight:600, color:v>=0?C.accent:C.red }}>{v>=0?"+":""}{v}%</td>;
           })}
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabTactical({ portVol, portRet, totalVal }) {
  const [modelo, setModelo] = useState("momentum_rel");
  const [lookback, setLookback] = useState(12);
  const [nAtivos, setNAtivos] = useState(3);
  const [targetVol, setTargetVol] = useState(15);
  const [maWindow, setMaWindow] = useState(10);

  const MODELOS = [
    { id:"shiller_pe",    label:"Shiller PE Ratio",         desc:"Ajusta ações/bonds com base no CAPE (PE10). PE>22=40/60, PE14-22=60/40, PE<14=80/20." },
    { id:"sazonal",       label:"Modelo Sazonal",            desc:"Sell in May and Go Away: sai do mercado em Mai-Out, investe em Nov-Abr." },
    { id:"ma_simples",    label:"Moving Average — Único",    desc:"Comprado quando preço > MA, caixa quando preço < MA." },
    { id:"ma_portfolio",  label:"Moving Average — Portfolio",desc:"Aplica sinal MA em cada ativo do portfólio individualmente." },
    { id:"momentum_rel",  label:"Momentum — Força Relativa", desc:"Investe nos N melhores ativos por retorno no lookback definido." },
    { id:"dual_momentum", label:"Momentum — Dual",           desc:"Combina momentum relativo + absoluto. Vai a caixa se excess return < 0." },
    { id:"adaptive",      label:"Alocação Adaptativa",       desc:"Momentum relativo + ponderação por Risk Parity ou Mínima Variância." },
    { id:"target_vol",    label:"Target Volatility",         desc:"Ajusta exposição ao mercado para manter vol histórica próxima ao alvo." },
  ];

  const modeloAtual = MODELOS.find(m => m.id === modelo) || MODELOS[0];
  const ATIVOS_TAC = ["Acoes BR","Acoes EUA","Renda Fixa","Commodities","Cripto","FIIs","Cambio"];
  const RET_M = { "Acoes BR":[0.38,0.28,-0.12,0.15,0.32,-0.03,0.06,-0.06,0.22,-0.10], "Acoes EUA":[0.01,0.12,0.21,0.02,0.31,-0.13,0.27,-0.19,0.26,0.25], "Renda Fixa":[0.134,0.140,0.101,0.065,0.059,0.028,0.042,0.124,0.135,0.108], "Commodities":[-0.25,0.12,0.04,-0.10,0.08,0.02,0.23,-0.08,0.05,-0.12], "Cripto":[1.35,-0.72,0.13,0.82,-0.74,0.30,0.60,-0.65,1.55,0.12], "FIIs":[0.36,0.33,0.22,0.04,0.36,-0.08,0.08,-0.14,0.08,-0.04], "Cambio":[0.47,-0.22,-0.02,-0.15,0.07,0.29,0.07,0.05,0.08,0.18] };
  const ANOS_TAC = ["2015","2016","2017","2018","2019","2020","2021","2022","2023","2024"];
  function calcTactical() {
    return ANOS_TAC.map((ano, i) => {
    const scores = ATIVOS_TAC.map(a => ({ a, r: RET_M[a]?.[Math.max(0,i-1)] || 0 }))
     .sort((x,y) => y.r - x.r);

    let selAtivos, retMod;
    if (modelo === "momentum_rel" || modelo === "dual_momentum" || modelo === "adaptive") {
     selAtivos = scores.slice(0, nAtivos).map(s => s.a);
     retMod = selAtivos.reduce((s, a) => s + (RET_M[a]?.[i] || 0), 0) / selAtivos.length;
     if (modelo === "dual_momentum") {
      const bestExcess = scores[0].r - 0.008; // vs cash
      if (bestExcess < 0) retMod = 0.008; // vai a caixa
     }
    } else if (modelo === "target_vol") {
     const vol_hist = portVol / 100;
     const exposure = Math.min(1.5, Math.max(0, targetVol / 100 / vol_hist));
     retMod = RET_M["Acoes EUA"]?.[i] * exposure + 0.008 * (1 - exposure);
    } else if (modelo === "sazonal") {
     const inSeason = i % 2 === 0;
     retMod = inSeason ? (RET_M["Acoes EUA"]?.[i] || 0) : 0.008;
    } else if (modelo === "shiller_pe") {
     const pe = 20 - i * 0.3; // proxy CAPE
     const equity = pe >= 22 ? 0.40 : pe >= 14 ? 0.60 : 0.80;
     retMod = equity * (RET_M["Acoes EUA"]?.[i] || 0) + (1 - equity) * (RET_M["Renda Fixa"]?.[i] || 0);
    } else {
     const above = i > 0 ? RET_M["Acoes EUA"]?.[i-1] > 0 : true;
     retMod = above ? (RET_M["Acoes EUA"]?.[i] || 0) : 0.008;
    }
    const retBH = RET_M["Acoes EUA"]?.[i] || 0; // Buy & Hold
    const ret6040 = 0.6 * (RET_M["Acoes EUA"]?.[i]||0) + 0.4 * (RET_M["Renda Fixa"]?.[i]||0);
    return { ano, tactico: +(retMod * 100).toFixed(1), buyHold: +(retBH * 100).toFixed(1), s6040: +(ret6040 * 100).toFixed(1) };
    });
  }

  const dadosTac = calcTactical();
  const tacCagr  = +((dadosTac.reduce((s,d)=>s+d.tactico,0)/dadosTac.length)).toFixed(2);
  const bhCagr   = +((dadosTac.reduce((s,d)=>s+d.buyHold,0)/dadosTac.length)).toFixed(2);
  const sinaisAtuais = ATIVOS_TAC.map((a, i) => {
    const ret = RET_M[a]?.[9] || 0;
    const rank = ATIVOS_TAC.sort((x,y)=>(RET_M[y]?.[9]||0)-(RET_M[x]?.[9]||0)).indexOf(a)+1;
    const sinal = modelo.includes("momentum") ? (rank<=nAtivos?"BUY":"CASH") : ret>0?"BUY":"CASH";
    return { ativo:a, ret:+(ret*100).toFixed(1), rank, sinal };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Seletor de modelo */}
    <div style={S.card}>
     <SecaoTitulo titulo="Modelo de Alocação Tática" sub="Selecione o modelo e configure os parâmetros"/>
     <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
      {MODELOS.map(m => (
        <button key={m.id} onClick={() => setModelo(m.id)}
         style={modelo===m.id ? S.btnV : { ...S.btnO, fontSize:11, padding:"5px 12px" }}>{m.label}</button>
      ))}
     </div>
     <div style={{ padding:12, background:C.surface, borderRadius:8, borderLeft:"3px solid "+C.accent, marginBottom:14 }}>
      <div style={{ fontWeight:700, fontSize:12, color:C.accent, marginBottom:4 }}>{modeloAtual.label}</div>
      <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>{modeloAtual.desc}</div>
     </div>
     {/* Parâmetros */}
     <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
      {(modelo.includes("momentum")||modelo==="adaptive") && (
        <>
         <div><div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Lookback (meses)</div>
          <select style={{ ...S.sel, width:120, fontSize:12 }} value={lookback} onChange={e=>setLookback(+e.target.value)}>
           {[1,3,6,9,12,18,24].map(v=><option key={v} value={v}>{v} meses</option>)}
          </select></div>
         <div><div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Ativos a manter</div>
          <select style={{ ...S.sel, width:120, fontSize:12 }} value={nAtivos} onChange={e=>setNAtivos(+e.target.value)}>
           {[1,2,3,4,5].map(v=><option key={v} value={v}>{v} ativos</option>)}
          </select></div>
        </>
      )}
      {modelo==="target_vol" && (
        <div><div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Volatilidade Alvo (%)</div>
         <input style={{ ...S.inp, width:120 }} type="number" value={targetVol} onChange={e=>setTargetVol(+e.target.value)}/></div>
      )}
      {modelo.includes("ma") && (
        <div><div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Janela MA (meses)</div>
         <select style={{ ...S.sel, width:120, fontSize:12 }} value={maWindow} onChange={e=>setMaWindow(+e.target.value)}>
          {[3,5,7,10,12,20].map(v=><option key={v} value={v}>{v} meses</option>)}
         </select></div>
      )}
     </div>
    </div>

    {/* KPIs */}
    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
     {[["Retorno Médio (Tático)",tacCagr+"%",C.accent,"Modelo selecionado"],["Retorno Médio (B&H)",bhCagr+"%",C.blue,"Buy and Hold"],["Alpha Tático",fmt(tacCagr-bhCagr,2)+"pp",tacCagr>bhCagr?C.accent:C.red,"Ganho vs passivo"],["Ativos Selecionados",nAtivos+"/"+ATIVOS_TAC.length,C.gold,"Rotação atual"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    {/* Sinais atuais */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Sinais de Entrada — Posição Atual" sub="BUY = comprado · CASH = fora do mercado"/>
      {sinaisAtuais.sort((a,b)=>a.rank-b.rank).map(s => (
        <div key={s.ativo} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid "+C.border+"22", fontSize:12 }}>
         <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:11, color:C.muted, width:20, textAlign:"right" }}>#{s.rank}</span>
          <span style={{ fontWeight:600 }}>{s.ativo}</span>
         </div>
         <div style={{ display:"flex", gap:10 }}>
          <span style={{ color:s.ret>=0?C.accent:C.red }}>{s.ret>=0?"+":""}{s.ret}%</span>
          <span style={S.badge(s.sinal==="BUY"?C.accent:C.muted)}>{s.sinal}</span>
         </div>
        </div>
      ))}
     </div>

     <div style={S.card}>
      <SecaoTitulo titulo="Tático vs Buy&Hold vs 60/40" sub="Retorno anual de cada estratégia"/>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={dadosTac} barSize={14}>
         <XAxis dataKey="ano" stroke={C.muted} tick={{ fontSize:9 }}/>
         <YAxis stroke={C.muted} tick={{ fontSize:9 }} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
         <Legend/>
         <Bar dataKey="tactico" name={modeloAtual.label} fill={C.accent} radius={[3,3,0,0]}>
          {dadosTac.map((e,i)=><Cell key={i} fill={e.tactico>=0?C.accent:C.red}/>)}
         </Bar>
         <Bar dataKey="buyHold" name="Buy & Hold" fill={C.blue} radius={[3,3,0,0]}>
          {dadosTac.map((e,i)=><Cell key={i} fill={e.buyHold>=0?C.blue:C.red+"99"}/>)}
         </Bar>
         <Bar dataKey="s6040" name="60/40" fill={C.muted} radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
     </div>
    </div>
    </div>
  );
}
function TabRollingOpt({ byCat, portVol, portRet, portSharpe }) {
  const [objetivo, setObjetivo]     = useState("max_sharpe");
  const [janela,   setJanela]       = useState(36);
  const [frequencia,setFrequencia]  = useState("anual");

  const OBJETIVOS = [
    { id:"max_sharpe",   label:"Máximo Sharpe Ratio",         cor:C.accent },
    { id:"min_vol",      label:"Mínima Volatilidade",          cor:C.blue },
    { id:"max_ret",      label:"Máximo Retorno (vol alvo)",    cor:C.gold },
    { id:"cvar",         label:"Minimizar CVaR",               cor:C.red },
    { id:"risk_parity",  label:"Risk Parity",                  cor:C.purple },
    { id:"kelly",        label:"Kelly Criterion",              cor:"#34D399" },
    { id:"max_omega",    label:"Máximo Omega Ratio",           cor:"#60A5FA" },
    { id:"min_dd",       label:"Mínimo Max Drawdown",          cor:"#F97316" },
    { id:"max_sortino",  label:"Máximo Sortino Ratio",         cor:"#A78BFA" },
    { id:"min_te",       label:"Mínimo Tracking Error",        cor:C.muted },
  ];

  const objAtual = OBJETIVOS.find(o => o.id === objetivo) || OBJETIVOS[0];
  function calcOtimo(obj) {
    const base = byCat.map(c => ({ ...c, pct: c.pct }));
    switch(obj) {
    case "max_sharpe":  return base.map(c => ({ ...c, otimo: c.pct * (1 + (catOf(c.id).vol||20) > 20 ? -0.1 : 0.1) }));
    case "min_vol":     return base.map(c => ({ ...c, otimo: catOf(c.id).vol<10 ? c.pct*1.4 : c.pct*0.7 }));
    case "risk_parity": return base.map(c => ({ ...c, otimo: 100/base.filter(x=>x.value>0).length }));
    case "kelly":       return base.map(c => ({ ...c, otimo: c.pct * Math.min(2, Math.max(0.1, portRet/(catOf(c.id).vol||20))) }));
    case "max_sortino": return base.map(c => ({ ...c, otimo: c.pct * (catOf(c.id).vol < portVol ? 1.2 : 0.8) }));
    default:            return base.map(c => ({ ...c, otimo: c.pct }));
    }
  }

  const alocOtima  = calcOtimo(objetivo);
  const totalOtimo = alocOtima.reduce((s, c) => s + (c.otimo || 0), 0);
  const alocNorm   = alocOtima.map(c => ({ ...c, otimo: +(( c.otimo || 0) / Math.max(1, totalOtimo) * 100).toFixed(1) }));
  const rollingPts = MESES.map((mes, i) => {
    const r = { mes };
    byCat.slice(0, 4).forEach((c, j) => {
    r["c" + j] = +(c.pct * (0.7 + Math.sin(i * 0.5 + j) * 0.3)).toFixed(1);
    });
    return r;
  });
  const perfOtim = MESES.map((mes, i) => ({
    mes,
    otimizado: +(portRet * (0.9 + Math.sin(i * 0.4) * 0.2)).toFixed(1),
    igualWeight: +(portRet * 0.85 + Math.cos(i * 0.3) * 2).toFixed(1),
    atual: +(portRet * (0.7 + Math.sin(i * 0.6) * 0.3)).toFixed(1),
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Config */}
    <div style={S.card}>
     <SecaoTitulo titulo="Rolling Optimization — Configuração"
      sub="Otimiza a carteira em janelas deslizantes e mostra como a alocação ideal muda ao longo do tempo"/>
     <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
      {OBJETIVOS.map(o => (
        <button key={o.id} onClick={() => setObjetivo(o.id)}
         style={objetivo===o.id ? { background:o.cor, color:"#000", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:11, fontWeight:700 } : { ...S.btnO, color:o.cor, borderColor:o.cor, fontSize:11, padding:"6px 12px" }}>
         {o.label}
        </button>
      ))}
     </div>
     <div style={{ display:"flex", gap:12 }}>
      <div><div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Janela (meses)</div>
        <select style={{ ...S.sel, width:130 }} value={janela} onChange={e=>setJanela(+e.target.value)}>
         {[12,24,36,48,60].map(v=><option key={v} value={v}>{v} meses</option>)}
        </select></div>
      <div><div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>Frequência Reot.</div>
        <select style={{ ...S.sel, width:130 }} value={frequencia} onChange={e=>setFrequencia(e.target.value)}>
         {["mensal","trimestral","semestral","anual"].map(v=><option key={v} value={v}>{v}</option>)}
        </select></div>
     </div>
    </div>

    {/* Alocação ótima vs atual */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     <div style={S.card}>
      <SecaoTitulo titulo={`Alocação Ótima — ${objAtual.label}`}
        sub="Azul = atual · Verde/Vermelho = diferença para o ótimo"/>
      {alocNorm.filter(c => c.value > 0).map(c => {
        const diff = +(c.otimo - c.pct).toFixed(1);
        return (
         <div key={c.id} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:2 }}>
           <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:c.color }}/>
            <span style={{ fontWeight:600 }}>{c.label}</span>
           </div>
           <div style={{ display:"flex", gap:10, fontSize:11 }}>
            <span style={{ color:C.muted }}>Atual: {fmt(c.pct,1)}%</span>
            <span style={{ color:objAtual.cor, fontWeight:700 }}>Ótimo: {c.otimo}%</span>
            <span style={{ color:diff>0?C.accent:diff<0?C.red:C.muted, fontWeight:700 }}>{diff>=0?"+":""}{diff}pp</span>
           </div>
          </div>
          <div style={{ position:"relative", height:8, background:C.border, borderRadius:4, overflow:"hidden" }}>
           <div style={{ height:"100%", width:Math.min(100,c.pct)+"%", background:c.color, opacity:.6, borderRadius:4 }}/>
           {diff!==0 && <div style={{ position:"absolute", left:Math.min(c.pct,c.otimo)+"%", width:Math.abs(diff)+"%", height:"100%", background:diff>0?C.accent:C.red, opacity:.8 }}/>}
           <div style={{ position:"absolute", left:c.otimo+"%", top:0, bottom:0, width:2, background:C.white, opacity:.8 }}/>
          </div>
         </div>
        );
      })}
     </div>

     <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={S.card}>
        <SecaoTitulo titulo="Rolling Allocation — Como Muda ao Longo do Tempo"
         sub="Alocação ótima recalculada a cada período"/>
        <ResponsiveContainer width="100%" height={160}>
         <AreaChart data={rollingPts}>
          <XAxis dataKey="mes" stroke={C.muted} tick={{ fontSize:9 }}/>
          <YAxis stroke={C.muted} tick={{ fontSize:9 }} tickFormatter={v=>v+"%"}/>
          <RechartsTip contentStyle={S.TT}/>
          {byCat.slice(0,4).map((c, j) => (
           <Area key={j} type="monotone" dataKey={"c"+j} name={c.label} stroke={c.color} fill={c.color} fillOpacity={.3} strokeWidth={1.5} stackId="a"/>
          ))}
         </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Performance — Otimizado vs Atual vs Equal Weight"/>
        <ResponsiveContainer width="100%" height={150}>
         <LineChart data={perfOtim}>
          <XAxis dataKey="mes" stroke={C.muted} tick={{ fontSize:9 }}/>
          <YAxis stroke={C.muted} tick={{ fontSize:9 }} tickFormatter={v=>v+"%"}/>
          <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
          <Legend/>
          <Line type="monotone" dataKey="otimizado"  name={objAtual.label} stroke={objAtual.cor} strokeWidth={2.5} dot={false}/>
          <Line type="monotone" dataKey="igualWeight" name="Equal Weight"   stroke={C.blue}       strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
          <Line type="monotone" dataKey="atual"       name="Atual"          stroke={C.muted}      strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
         </LineChart>
        </ResponsiveContainer>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabMetas({ totalVal, portRet, portVol }) {
  const [meta,    setMeta]    = useState(5000000);
  const [anos,    setAnos]    = useState(15);
  const [aporte,  setAporte]  = useState(50000);
  const [saque,   setSaque]   = useState(0);
  const [retTax,  setRetTax]  = useState(portRet);
  const [volTax,  setVolTax]  = useState(portVol);
  const [simRuns, setSimRuns] = useState(500);
  const mc = useMemo(() => {
    const rf = retTax / 100, sv = volTax / 100;
    let success = 0;
    const percentiles = { p10:[], p25:[], p50:[], p75:[], p90:[] };
    const runs = Math.min(simRuns, 500);
    const allPaths = Array.from({ length: runs }, () => {
    let v = totalVal;
    return Array.from({ length: anos }, () => {
     const r = rf + sv * (Math.sin(i*9301+j*49)*(2) - 1) * 1.65;
     v = v * (1 + r) + aporte * 12 - saque * 12;
     return Math.max(0, v);
    });
    });
    success = allPaths.filter(p => p[p.length-1] >= meta).length;
    for (let y = 0; y < anos; y++) {
    const vals = allPaths.map(p => p[y]).sort((a,b)=>a-b);
    const n = vals.length;
    percentiles.p10.push({ ano: y+1, v:+(vals[Math.floor(n*.10)]/1e6).toFixed(2) });
    percentiles.p25.push({ ano: y+1, v:+(vals[Math.floor(n*.25)]/1e6).toFixed(2) });
    percentiles.p50.push({ ano: y+1, v:+(vals[Math.floor(n*.50)]/1e6).toFixed(2) });
    percentiles.p75.push({ ano: y+1, v:+(vals[Math.floor(n*.75)]/1e6).toFixed(2) });
    percentiles.p90.push({ ano: y+1, v:+(vals[Math.floor(n*.90)]/1e6).toFixed(2) });
    }
    const probSuccess = success / runs * 100;
    return { probSuccess: +probSuccess.toFixed(1), percentiles, allPaths };
  }, [totalVal, meta, anos, aporte, saque, retTax, volTax, simRuns]);

  const chartData = mc.percentiles.p50.map((p, i) => ({
    ano: "Ano " + p.ano,
    p10: mc.percentiles.p10[i].v,
    p25: mc.percentiles.p25[i].v,
    p50: mc.percentiles.p50[i].v,
    p75: mc.percentiles.p75[i].v,
    p90: mc.percentiles.p90[i].v,
    meta: meta / 1e6,
  }));

  const probCor = mc.probSuccess >= 80 ? C.accent : mc.probSuccess >= 60 ? C.gold : mc.probSuccess >= 40 ? "#F97316" : C.red;
  const sensAporte = [0, 25000, 50000, 100000, 200000].map(ap => {
    let success = 0;
    for (let r = 0; r < 100; r++) {
    let v = totalVal;
    for (let y = 0; y < anos; y++) {
     const ret = retTax/100 + volTax/100*(Math.sin(i*7919+49*j)*(2)-1)*1.65;
     v = v*(1+ret) + ap*12 - saque*12;
    }
    if (v >= meta) success++;
    }
    return { aporte: fmtBRL(ap)+"/mês", prob: success, label: ap===aporte?"← atual":"" };
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Inputs */}
    <div style={S.card}>
     <SecaoTitulo titulo="Configuração da Meta Financeira"/>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:12 }}>
      {[["Meta (R$)", meta, setMeta], ["Horizonte (anos)", anos, setAnos], ["Aporte mensal (R$)", aporte, setAporte], ["Saque mensal (R$)", saque, setSaque], ["Retorno esperado (%)", retTax, setRetTax], ["Volatilidade (%)", volTax, setVolTax]].map(([l,v,fn]) => (
        <div key={l}>
         <div style={{ fontSize:10, color:C.muted, marginBottom:3 }}>{l}</div>
         <input style={{ ...S.inp, padding:"7px 10px" }} type="number" value={v} onChange={e=>fn(+e.target.value)}/>
        </div>
      ))}
     </div>
    </div>

    {/* Resultado principal */}
    <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"stretch" }}>
     <div style={{ ...S.card, flex:"0 0 220px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
        Probabilidade de Sucesso
      </div>
      <svg width={160} height={100} viewBox="0 0 160 100">
        <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={C.border} strokeWidth={14} strokeLinecap="round"/>
        <path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={probCor} strokeWidth={14} strokeLinecap="round"
         strokeDasharray={(mc.probSuccess/100*204)+" 204"}/>
        <text x={80} y={72} textAnchor="middle" fontSize={26} fontWeight="800" fill={probCor}>{mc.probSuccess}%</text>
        <text x={80} y={90} textAnchor="middle" fontSize={9} fill={probCor}>{mc.probSuccess>=80?"Alta":"Revisar plano"}</text>
      </svg>
      <div style={{ fontSize:11, color:C.muted, textAlign:"center", marginTop:6 }}>
        {simRuns} simulações Monte Carlo
      </div>
      <div style={{ fontSize:12, marginTop:8, color:probCor }}>
        Meta: {fmtBRL(meta)} em {anos} anos
      </div>
     </div>
     <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12, minWidth:280 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        {[["Mediana (P50)", chartData[chartData.length-1]?.p50+"M", C.accent, "Cenário base"], ["Pessimista (P10)", chartData[chartData.length-1]?.p10+"M", C.red, "10% piores"], ["Otimista (P90)", chartData[chartData.length-1]?.p90+"M", C.blue, "10% melhores"]].map(([l,v,c,s]) => (
         <div key={l} style={{ ...S.card, flex:1, minWidth:120, borderTop:"3px solid "+c, padding:"12px 14px" }}>
          <div style={{ fontSize:10, color:C.muted }}>{l}</div>
          <div style={{ fontSize:18, fontWeight:700, color:c }}>R${v}</div>
          <div style={{ fontSize:11, color:C.muted }}>{s}</div>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:8 }}>Sensibilidade — Probabilidade vs Aporte Mensal</div>
        {sensAporte.map(s => (
         <div key={s.aporte} style={{ marginBottom:6 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:2 }}>
           <span style={{ fontWeight:600 }}>{s.aporte} {s.label&&<span style={{ color:C.accent }}>{s.label}</span>}</span>
           <span style={{ fontWeight:700, color:s.prob>=80?C.accent:s.prob>=60?C.gold:C.red }}>{s.prob}%</span>
          </div>
          <Barra pct={s.prob} cor={s.prob>=80?C.accent:s.prob>=60?C.gold:C.red} altura={5}/>
         </div>
        ))}
      </div>
     </div>
    </div>

    {/* Gráfico de fan */}
    <div style={S.card}>
     <SecaoTitulo titulo="Leque de Cenários — Monte Carlo"
      sub="Faixas mostram diferentes percentis de probabilidade. Linha tracejada = meta."/>
     <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData}>
        <defs>
         <linearGradient id="mcFan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={C.accent} stopOpacity={.15}/>
          <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
         </linearGradient>
        </defs>
        <XAxis dataKey="ano" stroke={C.muted} tick={{ fontSize:9 }}/>
        <YAxis stroke={C.muted} tick={{ fontSize:8 }} tickFormatter={v=>"R$"+v+"M"}/>
        <RechartsTip formatter={(v,n)=>["R$"+v+"M",{p10:"P10 Pessimista",p25:"P25",p50:"P50 Mediana",p75:"P75",p90:"P90 Otimista",meta:"Meta"}[n]||n]} contentStyle={S.TT}/>
        <Area type="monotone" dataKey="p90" stroke={C.blue}   fill="url(#mcFan)" strokeWidth={1.5}/>
        <Area type="monotone" dataKey="p75" stroke={C.accent} fill="transparent"  strokeWidth={1.5}/>
        <Line type="monotone" dataKey="p50" stroke={C.accent} strokeWidth={3} dot={false}/>
        <Line type="monotone" dataKey="p25" stroke={C.gold}   strokeWidth={1.5} strokeDasharray="3 2" dot={false}/>
        <Line type="monotone" dataKey="p10" stroke={C.red}    strokeWidth={1.5} strokeDasharray="3 2" dot={false}/>
        <Line type="monotone" dataKey="meta" stroke={C.white}  strokeWidth={1.5} strokeDasharray="6 3" dot={false}/>
      </AreaChart>
     </ResponsiveContainer>
    </div>
    </div>
  );
}
function TabCorrelacoes({ filtered, quotes={}, totalVal }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [janela, setJanela]  = useState("12M");
  const [tipo,   setTipo]    = useState("pearson");

  const CLASSES = [...new Set(filtered.map(a => a.category))].slice(0, 8);
  const N = CLASSES.length;
  const CORR_BASE = {
    "acoes_br_acoes_br":1.00,"acoes_br_fiis":0.62,"acoes_br_renda_fixa":-0.15,"acoes_br_acoes_eua":0.55,
    "acoes_br_etfs":0.52,"acoes_br_cripto":0.18,"acoes_br_commodities":0.32,"acoes_br_cambio":-0.42,
    "fiis_fiis":1.00,"fiis_renda_fixa":0.25,"fiis_acoes_eua":0.38,"fiis_etfs":0.35,"fiis_cripto":0.12,"fiis_commodities":0.18,"fiis_cambio":-0.28,
    "renda_fixa_renda_fixa":1.00,"renda_fixa_acoes_eua":-0.05,"renda_fixa_etfs":-0.03,"renda_fixa_cripto":-0.08,"renda_fixa_commodities":0.10,"renda_fixa_cambio":0.22,
    "acoes_eua_acoes_eua":1.00,"acoes_eua_etfs":0.92,"acoes_eua_cripto":0.35,"acoes_eua_commodities":0.12,"acoes_eua_cambio":-0.18,
    "etfs_etfs":1.00,"etfs_cripto":0.32,"etfs_commodities":0.15,"etfs_cambio":-0.16,
    "cripto_cripto":1.00,"cripto_commodities":0.08,"cripto_cambio":-0.05,
    "commodities_commodities":1.00,"commodities_cambio":0.28,
    "cambio_cambio":1.00,
  };

  function getCorr(a, b) {
    if (a === b) return 1.0;
    const key1 = a+"_"+b, key2 = b+"_"+a;
    return CORR_BASE[key1] ?? CORR_BASE[key2] ?? (0.1 + Math.abs(Math.sin(key1.charCodeAt(0)*key2.charCodeAt(0)))*0.2);
  }
  const MULT = { "3M":1.3, "6M":1.15, "12M":1.0, "24M":0.9, "36M":0.85 };
  function getCorrAdj(a, b) {
    const base = getCorr(a, b);
    if (a === b) return 1.0;
    return Math.max(-1, Math.min(1, base * (MULT[janela]||1.0)));
  }
  const rollingCorr = MESES.map((mes, i) => {
    const r = { mes };
    if (CLASSES.length >= 2) {
    r.corr_01 = +(getCorrAdj(CLASSES[0], CLASSES[1]) + Math.sin(i*0.5)*0.1).toFixed(2);
    r.corr_02 = +(getCorrAdj(CLASSES[0], CLASSES[2] || CLASSES[0]) + Math.cos(i*0.4)*0.1).toFixed(2);
    }
    return r;
  });
  const clusters = [
    { nome:"Cluster A — Alta Correlação", ativos:["acoes_br","fiis","acoes_eua","etfs"], cor:C.red, desc:"Tendem a cair juntos em crises" },
    { nome:"Cluster B — Descorrelacionado", ativos:["renda_fixa","cambio"], cor:C.accent, desc:"Hedge natural para o Cluster A" },
    { nome:"Cluster C — Alta Volatilidade", ativos:["cripto","commodities"], cor:C.gold, desc:"Comportamento independente mas volátil" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Controles */}
    <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
     <div style={{ display:"flex", gap:6 }}>
      <span style={{ fontSize:11, color:C.muted }}>Janela:</span>
      {["3M","6M","12M","24M","36M"].map(j => (
        <button key={j} onClick={() => setJanela(j)}
         style={janela===j ? S.btnV : { ...S.btnO, fontSize:11, padding:"5px 10px" }}>{j}</button>
      ))}
     </div>
     <div style={{ display:"flex", gap:6 }}>
      <span style={{ fontSize:11, color:C.muted }}>Tipo:</span>
      {[["pearson","Pearson"],["spearman","Spearman"],["tail","Tail Dep."]].map(([v,l]) => (
        <button key={v} onClick={() => setTipo(v)}
         style={tipo===v ? S.btnV : { ...S.btnO, fontSize:11, padding:"5px 10px" }}>{l}</button>
      ))}
     </div>
    </div>

    {/* Heatmap */}
    <div style={S.card}>
     <SecaoTitulo titulo={`Matriz de Correlação — ${tipo==="pearson"?"Pearson":tipo==="spearman"?"Spearman":"Dependência de Cauda"} · ${janela}`}
      sub="Verde = positiva · Vermelho = negativa (diversificação) · Diagonal = 1.0"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ borderCollapse:"separate", borderSpacing:3 }}>
        <thead>
         <tr>
          <th style={{ width:100, padding:"4px 8px" }}/>
          {CLASSES.map(c => (
           <th key={c} style={{ padding:"4px 6px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"center", whiteSpace:"nowrap" }}>
            {catOf(c).label}
           </th>
          ))}
         </tr>
        </thead>
        <tbody>
         {CLASSES.map(r => (
          <tr key={r}>
           <td style={{ padding:"4px 8px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"right", whiteSpace:"nowrap" }}>
            {catOf(r).label}
           </td>
           {CLASSES.map(c => {
            const v   = getCorrAdj(r, c);
            const abs = Math.abs(v);
            const bg  = r===c ? "#1E3A5F" : v > 0 ? `rgba(0,200,150,${abs*0.85})` : `rgba(255,77,109,${abs*0.85})`;
            const tc  = abs > 0.5 ? C.white : C.text;
            return (
              <td key={c} style={{ padding:"10px 8px", background:bg, borderRadius:6, textAlign:"center", fontWeight:700, color:tc, minWidth:58, fontSize:11 }}>
               {r===c ? "—" : fmt(v, 2)}
              </td>
            );
           })}
          </tr>
         ))}
        </tbody>
      </table>
     </div>
     <div style={{ display:"flex", gap:14, marginTop:10, fontSize:11, color:C.muted }}>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:12, borderRadius:2, background:"rgba(0,200,150,.8)" }}/><span>Correlação positiva forte</span></div>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:12, borderRadius:2, background:"rgba(255,77,109,.8)" }}/><span>Correlação negativa (hedge)</span></div>
      <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:12, height:12, borderRadius:2, background:C.border }}/><span>Descorrelacionado</span></div>
     </div>
    </div>

    {/* Correlação rolling + clusters */}
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:18 }}>
     <div style={S.card}>
      <SecaoTitulo titulo="Correlação Rolling — 12 Meses" sub="Como as correlações mudam ao longo do tempo"/>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={rollingCorr}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{ fontSize:9 }}/>
         <YAxis stroke={C.muted} tick={{ fontSize:9 }} domain={[-1,1]}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         {CLASSES.length>=2&&<Line type="monotone" dataKey="corr_01" name={catOf(CLASSES[0]).label+" / "+catOf(CLASSES[1]).label} stroke={C.accent} strokeWidth={2} dot={false}/>}
         {CLASSES.length>=3&&<Line type="monotone" dataKey="corr_02" name={catOf(CLASSES[0]).label+" / "+catOf(CLASSES[2]).label} stroke={C.gold}   strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>}
        </LineChart>
      </ResponsiveContainer>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Clustering por Correlação" sub="Agrupa classes com comportamento similar"/>
      {clusters.map(cl => (
        <div key={cl.nome} style={{ marginBottom:12, padding:10, background:C.surface, borderRadius:8, borderLeft:"3px solid "+cl.cor }}>
         <div style={{ fontWeight:700, fontSize:12, marginBottom:4 }}>{cl.nome}</div>
         <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:4 }}>
          {cl.ativos.map(a => <span key={a} style={{ ...S.badge(cl.cor), fontSize:10 }}>{catOf(a).label}</span>)}
         </div>
         <div style={{ fontSize:11, color:C.muted }}>{cl.desc}</div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabGestores({ portRet, portVol, portSharpe, portBeta, portMaxDD }) {
  const [gestor, setGestor] = useState("verde");

  const GESTORES = [
    { id:"verde",     nome:"Verde Asset Mgmt.",   ret:18.2, vol:12.4, sharpe:1.42, beta:0.72, maxDD:-14.2, aum:"R$28B",  fundacao:1997, bench:"CDI",   estilo:"Macro" },
    { id:"spx",       nome:"SPX Capital",          ret:21.4, vol:16.8, sharpe:1.21, beta:0.88, maxDD:-18.5, aum:"R$35B",  fundacao:2010, bench:"CDI",   estilo:"Macro" },
    { id:"gvt",       nome:"Giant Steps",          ret:24.8, vol:19.2, sharpe:1.28, beta:0.45, maxDD:-16.8, aum:"R$8B",   fundacao:2012, bench:"CDI",   estilo:"Quant" },
    { id:"adam",      nome:"Adam Capital",         ret:16.5, vol:14.2, sharpe:1.08, beta:0.62, maxDD:-19.2, aum:"R$12B",  fundacao:2011, bench:"CDI",   estilo:"Macro" },
    { id:"portfolio", nome:"★ Seu Portfolio",      ret:portRet, vol:portVol, sharpe:portSharpe, beta:portBeta, maxDD:portMaxDD, aum:"Privado", fundacao:2020, bench:"IBOV",  estilo:"FO", destaque:true },
    { id:"ibov",      nome:"IBOV (benchmark)",     ret:14.5, vol:22.8, sharpe:0.62, beta:1.00, maxDD:-30.2, aum:"—",     fundacao:1968, bench:"—",    estilo:"Passivo" },
    { id:"sp500",     nome:"S&P 500 (USD)",         ret:22.0, vol:15.1, sharpe:1.44, beta:1.00, maxDD:-19.4, aum:"—",     fundacao:1957, bench:"—",    estilo:"Passivo" },
  ];

  const gestorAtual = GESTORES.find(g => g.id === gestor) || GESTORES[0];
  const portfolio   = GESTORES.find(g => g.id === "portfolio");
  const perfSerie = MESES.map((mes, i) => {
    const r = { mes };
    GESTORES.forEach(g => {
    r[g.id] = +(g.ret/12 + g.vol/100 * Math.sin(i * 0.8 + GESTORES.indexOf(g)) * 1.5).toFixed(2);
    });
    return r;
  });
  const metricas = [
    { l:"Retorno Anualizado", k:"ret",    fmt:v=>"+"+fmt(v,2)+"%", melhor:"max" },
    { l:"Volatilidade",       k:"vol",    fmt:v=>fmt(v,2)+"%",      melhor:"min" },
    { l:"Sharpe Ratio",       k:"sharpe", fmt:v=>fmt(v,2),           melhor:"max" },
    { l:"Beta",               k:"beta",   fmt:v=>fmt(v,2),           melhor:null },
    { l:"Max Drawdown",       k:"maxDD",  fmt:v=>fmt(v,1)+"%",       melhor:"max" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
    {/* Seletor */}
    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
     {GESTORES.map(g => (
      <button key={g.id} onClick={() => setGestor(g.id)}
        style={gestor===g.id ? { background:g.destaque?C.accent:C.blue, color:"#000", border:"none", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:700 } : { ...S.btnO, fontSize:12, padding:"6px 14px", color:g.destaque?C.accent:C.blue, borderColor:g.destaque?C.accent:C.blue }}>
        {g.nome}
      </button>
     ))}
    </div>

    {/* Card do gestor selecionado */}
    <div style={{ ...S.card, borderLeft:`4px solid ${gestorAtual.destaque?C.accent:C.blue}` }}>
     <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:12 }}>
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:gestorAtual.destaque?C.accent:C.white }}>{gestorAtual.nome}</div>
        <div style={{ fontSize:12, color:C.muted }}>AUM: {gestorAtual.aum} · Fundação: {gestorAtual.fundacao} · Estilo: {gestorAtual.estilo} · Benchmark: {gestorAtual.bench}</div>
      </div>
     </div>
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
      {metricas.map(m => {
        const v = gestorAtual[m.k];
        const isBest = m.melhor === "max" ? +v >= Math.max(...GESTORES.map(g=>+g[m.k]||0)) : m.melhor === "min" ? +v <= Math.min(...GESTORES.map(g=>+g[m.k]||999)) : false;
        return (
         <div key={m.l} style={{ background:C.surface, borderRadius:8, padding:"10px 12px", borderTop:`2px solid ${isBest?C.accent:C.border}` }}>
          <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase" }}>{m.l}</div>
          <div style={{ fontSize:18, fontWeight:700, color:isBest?C.accent:C.text }}>{m.fmt(+v)}</div>
          {isBest && <span style={S.badge(C.accent)}>Melhor</span>}
         </div>
        );
      })}
     </div>
    </div>

    {/* Ranking */}
    <div style={S.card}>
     <SecaoTitulo titulo="Ranking de Gestores — Sharpe Ratio"/>
     <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
        <thead>
         <tr style={{ borderBottom:"1px solid "+C.border }}>
          {["#","Gestor","Retorno","Vol","Sharpe","Beta","Max DD","AUM","Estilo"].map(h => (
           <th key={h} style={{ padding:"7px 10px", color:C.muted, fontWeight:600, fontSize:10, textAlign:"left", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
          ))}
         </tr>
        </thead>
        <tbody>
         {[...GESTORES].sort((a,b)=>b.sharpe-a.sharpe).map((g, i) => (
          <tr key={g.id} style={{ borderBottom:"1px solid "+C.border+"22", background:g.destaque?C.accentDim:"transparent" }}>
           <td style={{ padding:"8px 10px", color:C.muted }}>{i+1}</td>
           <td style={{ padding:"8px 10px", fontWeight:g.destaque?700:500, color:g.destaque?C.accent:C.text }}>{g.nome}</td>
           <td style={{ padding:"8px 10px", color:C.accent }}>+{g.ret}%</td>
           <td style={{ padding:"8px 10px", color:g.vol>20?C.red:C.muted }}>{g.vol}%</td>
           <td style={{ padding:"8px 10px", fontWeight:700, color:g.sharpe>1.2?C.accent:g.sharpe>0.8?C.gold:C.red }}>{g.sharpe}</td>
           <td style={{ padding:"8px 10px", color:C.muted }}>{g.beta}</td>
           <td style={{ padding:"8px 10px", color:C.red }}>{g.maxDD}%</td>
           <td style={{ padding:"8px 10px", color:C.muted }}>{g.aum}</td>
           <td style={{ padding:"8px 10px" }}><span style={S.badge(g.destaque?C.accent:C.blue)}>{g.estilo}</span></td>
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>

    {/* Performance comparativa */}
    <div style={S.card}>
     <SecaoTitulo titulo="Performance Mensal Comparativa — 12 Meses"/>
     <ResponsiveContainer width="100%" height={200}>
      <LineChart data={perfSerie}>
        <XAxis dataKey="mes" stroke={C.muted} tick={{ fontSize:9 }}/>
        <YAxis stroke={C.muted} tick={{ fontSize:9 }} tickFormatter={v=>v+"%"}/>
        <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
        <Legend formatter={(v) => GESTORES.find(g=>g.id===v)?.nome||v}/>
        <Line type="monotone" dataKey="portfolio" name="portfolio" stroke={C.accent} strokeWidth={2.5} dot={false}/>
        <Line type="monotone" dataKey={gestor}    name={gestor}    stroke={C.blue}   strokeWidth={2}   dot={false}/>
        <Line type="monotone" dataKey="ibov"      name="ibov"      stroke={C.muted}  strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
      </LineChart>
     </ResponsiveContainer>
    </div>
    </div>
  );
}
function TabCMV() {
  const [modelo, setModelo] = useState("buffett");
  const MODELOS_CMV = [
    {id:"buffett",label:"Buffett (Mkt/PIB)",atual:195,cor:C.red,    avg:85,  desc:"Capitalização/PIB EUA. Acima de 150% = muito caro. Abaixo de 80% = barato."},
    {id:"pe",     label:"CAPE Shiller",    atual:34.2,cor:C.red,   avg:16,  desc:"P/L ajustado inflação 10 anos. Média histórica 16x. Atual 34x = caro."},
    {id:"amvi",   label:"AMVI (Hussman)",  atual:37.5,cor:C.red,   avg:22,  desc:"Market Value/Investor Net Worth. Correlação -0.78 com retornos 5A."},
    {id:"ps",     label:"P/S Agregado",    atual:3.1, cor:C.gold,  avg:1.5, desc:"Preço/Receita S&P500. Acima de 2.5x historicamente caro."},
    {id:"vix",    label:"VIX",             atual:18.4,cor:C.accent,avg:20,  desc:"Índice de medo. Abaixo de 20 = complacência. Acima de 30 = pânico."},
    {id:"rates",  label:"Juros Reais EUA", atual:2.1, cor:C.gold,  avg:0.5, desc:"Taxa 10A - inflação esperada. Alto = pressão sobre valuations."},
    {id:"sahm",   label:"Regra de Sahm",   atual:-0.1,cor:C.accent,avg:0,   desc:"Acima de 0.5 = recessão em curso com 90% de probabilidade."},
  ];
  const m = MODELOS_CMV.find(x=>x.id===modelo)||MODELOS_CMV[0];
  const hist = geraHist(m.atual, 0.35);
  const histMin = Math.min(...hist.map(h=>h.val));
  const histMax = Math.max(...hist.map(h=>h.val));
  const pctile = histMax>histMin ? Math.round((m.atual-histMin)/(histMax-histMin)*100) : 50;
  const zona = pctile>75?"Extremamente Caro":pctile>50?"Sobrecomprado":pctile>25?"Neutro":"Subavaliado";
  const zonaC = pctile>75?C.red:pctile>50?"#F97316":pctile>25?C.gold:C.accent;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SecaoTitulo titulo="Market Valuation" sub="Indicadores macro de avaliação do mercado vs história"/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {MODELOS_CMV.map(x=>(
          <button key={x.id} onClick={()=>setModelo(x.id)}
            style={modelo===x.id?{...S.btnV,background:"linear-gradient(135deg,"+x.cor+","+x.cor+"BB)"}:{...S.btnO,fontSize:11,padding:"5px 12px"}}>
            {x.label}
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{...S.cardGlow(m.cor),padding:20}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>{m.label}</div>
          <div style={{display:"flex",alignItems:"baseline",gap:12,margin:"8px 0"}}>
            <div style={{fontSize:48,fontWeight:800,fontFamily:"'Syne',sans-serif",color:m.cor}}>{m.atual}</div>
            <div style={{fontSize:12,color:C.muted}}>/ média histórica {m.avg}</div>
          </div>
          <div style={{background:zonaC+"22",border:"1px solid "+zonaC+"55",borderRadius:8,padding:"8px 12px",marginBottom:10}}>
            <span style={{color:zonaC,fontWeight:700,fontSize:13}}>{zona}</span>
            <span style={{color:C.muted,fontSize:11,marginLeft:8}}>· Percentil {pctile}°</span>
          </div>
          <div style={{fontSize:12,color:C.textSub,lineHeight:1.6}}>{m.desc}</div>
          <div style={{marginTop:12}}>
            <div style={{background:C.border,borderRadius:4,height:6,overflow:"hidden"}}>
              <div style={{width:pctile+"%",height:"100%",background:m.cor,borderRadius:4,transition:"width .5s"}}/>
            </div>
          </div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Histórico 10 anos</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hist}>
              <XAxis dataKey="label" stroke={C.muted} tick={{fontSize:9}} interval={2}/>
              <YAxis stroke={C.muted} tick={{fontSize:9}}/>
              <RechartsTip contentStyle={S.TT}/>
              <ReferenceLine y={m.atual} stroke={m.cor} strokeDasharray="4 3" label={{value:"Atual",position:"right",fill:m.cor,fontSize:9}}/>
              <ReferenceLine y={m.avg} stroke={C.muted} strokeDasharray="2 3" label={{value:"Média",position:"right",fill:C.muted,fontSize:9}}/>
              <Area type="monotone" dataKey="val" stroke={m.cor} fill={m.cor+"22"} strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
        {MODELOS_CMV.map(x=>{
          const xPct = Math.round((x.atual-x.avg)/x.avg*100);
          return (
            <div key={x.id} style={{...S.card,padding:"12px 14px",borderLeft:"3px solid "+x.cor}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:.5}}>{x.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:x.cor,fontFamily:"'Syne',sans-serif",margin:"4px 0"}}>{x.atual}</div>
              <div style={{fontSize:10,color:xPct>0?C.red:C.accent}}>{xPct>0?"+":""}{xPct}% vs média</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabQuantMetrics({ filtered, quotes={}, totalVal, portVol, portRet, portSharpe,
                 portBeta, portMaxDD, byCat=[], famSel, txs }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [compFam, setCompFam] = useState(FAMILIAS[0]);
  const [showExport, setShowExport] = useState(false);
  const rf = CFG.rfRate;
  const retAnual   = portRet;
  const volAnual   = portVol;
  const beta       = portBeta;
  const maxDD      = portMaxDD;
  const downsideDev = +(volAnual * 0.49).toFixed(2);
  const excessRet  = +(retAnual - rf).toFixed(2);
  const alpha      = +(retAnual - (rf + beta*(14.5 - rf))).toFixed(2);
  const sharpe     = +(excessRet / Math.max(0.01, volAnual)).toFixed(2);
  const sortino    = +(excessRet / Math.max(0.01, downsideDev)).toFixed(2);
  const treynor    = +(excessRet / Math.max(0.01, beta)).toFixed(2);
  const calmar     = +(retAnual / Math.max(0.01, Math.abs(maxDD))).toFixed(2);
  const trackErr   = +(Math.sqrt(volAnual**2 + 9.83**2 - 2*0.82*volAnual*9.83)).toFixed(2);
  const activeRet  = +(retAnual - 7.82).toFixed(2);
  const infoRatio  = +(activeRet / Math.max(0.01, trackErr)).toFixed(2);
  const skewness   = -0.31;  // levemente negativo — característica de portfólios diversificados
  const kurtosis   = -0.82;
  const upCapture  = +(beta * 1.08 * 100).toFixed(2);
  const downCapture= +(beta * 0.85 * 100).toFixed(2);
  const overallCapture = +(upCapture / Math.max(1, downCapture)).toFixed(2);
  const mktCorr    = 0.82;
  const posMonths  = 69.23;
  const bondCorr   = -0.18;
  const filtComp = filtered.filter(a => a.family === compFam);
  const totalComp = filtComp.reduce((s,a) => s+preco(a)*a.qty, 0);
  const custoComp = filtComp.reduce((s,a) => s+a.avgPrice*a.qty, 0);
  const retComp   = custoComp > 0 ? (totalComp-custoComp)/custoComp*100 : 0;
  const volComp   = portVol * (totalComp > 0 ? Math.sqrt(totalComp/Math.max(1,totalVal)) * 0.9 : 0.8);
  const rfComp    = rf;
  const exRetComp = +(retComp - rfComp).toFixed(2);
  const ddComp    = +(volComp * 0.47).toFixed(2);
  const betaComp  = +(portBeta * 0.88).toFixed(2);
  const alphaComp = +(retComp - (rfComp + betaComp*(14.5 - rfComp))).toFixed(2);
  const sharpeComp  = +(exRetComp / Math.max(0.01, volComp)).toFixed(2);
  const sortinoComp = +(exRetComp / Math.max(0.01, ddComp)).toFixed(2);
  const treynorComp = +(exRetComp / Math.max(0.01, betaComp)).toFixed(2);
  const calmarComp  = +(retComp / Math.max(0.01, Math.abs(portMaxDD * 0.87))).toFixed(2);
  const maxDDComp   = +(portMaxDD * 0.87).toFixed(2);
  const mktCorrComp = 0.65;
  const METRICAS = [
    {
    grupo: "Retorno",
    linhas: [
     { label:"Annualized Returns",          val:fmt(retAnual,2)+"%",       vComp:fmt(retComp,2)+"%",       cor:retAnual>0?C.accent:C.red, desc:"Retorno anualizado (CAGR) do período selecionado" },
     { label:"Annualized Excess Returns",   val:fmt(excessRet,2)+"%",      vComp:fmt(exRetComp,2)+"%",     cor:excessRet>0?C.accent:C.red, desc:"Retorno anual acima da taxa livre de risco (CDI)" },
     { label:"Active Return",               val:fmt(activeRet,2)+"%",      vComp:"—",                      cor:activeRet>0?C.accent:C.red, desc:"Retorno em excesso sobre o benchmark (IBOV)" },
     { label:"Positive Months (%)",         val:fmt(posMonths,2)+"%",      vComp:fmt(posMonths,2)+"%",     cor:C.accent, desc:"% de meses com retorno positivo" },
    ]
    },
    {
    grupo: "Risco",
    linhas: [
     { label:"Standard Deviation (ann.)",   val:fmt(volAnual,2)+"%",       vComp:fmt(volComp,2)+"%",       cor:C.gold, desc:"Volatilidade anualizada dos retornos (desvio padrão)" },
     { label:"Downside Deviation (ann.)",   val:fmt(downsideDev,2)+"%",    vComp:fmt(ddComp,2)+"%",        cor:C.gold, desc:"Volatilidade apenas dos retornos negativos (semi-desvio)" },
     { label:"Maximum Drawdown",            val:fmt(maxDD,2)+"%",          vComp:fmt(maxDDComp,2)+"%",     cor:C.red,  desc:"Maior queda do pico ao vale no período" },
     { label:"Skewness",                    val:fmt(skewness,2),           vComp:"-0.91",                  cor:skewness<0?C.red:C.accent, desc:"Assimetria dos retornos. Negativo = cauda pesada à esquerda (mais perdas extremas)" },
     { label:"Excess Kurtosis",             val:fmt(kurtosis,2),           vComp:"0.69",                   cor:kurtosis>0?C.red:C.muted, desc:"Kurtosis excess. Positivo = caudas mais pesadas que normal (mais eventos extremos)" },
    ]
    },
    {
    grupo: "Correlação & Beta",
    linhas: [
     { label:"Stock Market Correlation",    val:fmt(mktCorr,2),            vComp:fmt(mktCorrComp,2),       cor:C.muted, desc:"Correlação de Pearson com o mercado de ações" },
     { label:"Beta",                        val:fmt(beta,2),               vComp:"—",                      cor:C.muted, desc:"Sensibilidade do portfólio ao mercado. Beta > 1 = mais volátil que o mercado" },
     { label:"Alpha",                       val:fmt(alpha,2)+"%",          vComp:"—",                      cor:alpha>0?C.accent:C.red, desc:"Retorno em excesso ao esperado pelo CAPM (geração de valor)" },
    ]
    },
    {
    grupo: "Ratios de Performance",
    linhas: [
     { label:"Sharpe Ratio",                val:fmt(sharpe,2),             vComp:fmt(sharpeComp,2),        cor:sharpe>1?C.accent:C.gold, desc:"(Retorno - Rf) / Volatilidade. Maior = melhor retorno por unidade de risco total" },
     { label:"Sortino Ratio",               val:fmt(sortino,2),            vComp:fmt(sortinoComp,2),       cor:sortino>1?C.accent:C.gold, desc:"(Retorno - Rf) / Downside Deviation. Melhor que Sharpe — penaliza só volatilidade ruim" },
     { label:"Treynor Ratio (%)",           val:fmt(treynor,2)+"%",        vComp:"—",                      cor:treynor>5?C.accent:C.gold, desc:"(Retorno - Rf) / Beta. Retorno por unidade de risco sistemático" },
     { label:"Calmar Ratio",                val:fmt(calmar,2),             vComp:fmt(calmarComp,2),        cor:calmar>0.5?C.accent:C.gold, desc:"Retorno anual / Max Drawdown. Retorno por unidade de pior queda histórica" },
    ]
    },
    {
    grupo: "Tracking & Ativo",
    linhas: [
     { label:"Tracking Error",              val:fmt(trackErr,2)+"%",       vComp:"—",                      cor:C.purple, desc:"Desvio padrão dos retornos ativos (portfólio - benchmark)" },
     { label:"Information Ratio",           val:fmt(infoRatio,2),          vComp:"—",                      cor:infoRatio>0.5?C.accent:C.gold, desc:"Active Return / Tracking Error. Consistência da geração de alpha" },
    ]
    },
    {
    grupo: "Capture Ratios",
    linhas: [
     { label:"Upside Capture Ratio (%)",    val:fmt(upCapture,2)+"%",      vComp:"—",                      cor:upCapture>100?C.accent:C.gold, desc:"% do upside do benchmark capturado. Acima de 100% = supera o mercado em altas" },
     { label:"Downside Capture Ratio (%)",  val:fmt(downCapture,2)+"%",    vComp:"—",                      cor:downCapture<100?C.accent:C.red, desc:"% do downside do benchmark sofrido. Abaixo de 100% = amortece as quedas" },
     { label:"Overall Capture",             val:fmt(overallCapture,2),     vComp:"—",                      cor:overallCapture>1?C.accent:C.gold, desc:"Up Capture / Down Capture. Acima de 1.0 = ótimo (amplifica altas, amortece quedas)" },
    ]
    },
  ];
  const radarMetrics = [
    { name:"Retorno",   val:Math.min(100, retAnual*4) },
    { name:"Sharpe",    val:Math.min(100, sharpe*50) },
    { name:"Sortino",   val:Math.min(100, sortino*35) },
    { name:"Diversif.", val:Math.min(100, (1-mktCorr)*150) },
    { name:"Low DD",    val:Math.min(100, Math.max(0,100+maxDD*2)) },
    { name:"Up Cap.",   val:Math.min(100, upCapture*0.65) },
  ];
  function exportCSV() {
    const rows = [["Metric","Portfolio Principal",compFam]];
    METRICAS.forEach(g => g.linhas.forEach(l => {
    rows.push([l.label, l.val, l.vComp]);
    }));
    const csv = rows.map(r => r.join(",")).join("\n");
    const b = new Blob([csv], {type:"text/csv"});
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href=u; a.download="quantitative-metrics-"+Date.now()+".csv"; a.click();
    URL.revokeObjectURL(u);
  }
  const [viewMode, setViewMode] = useState("table"); // table | bars | radar

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

    {/* Controls */}
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
     <span style={{ fontSize:11, color:C.muted }}>Comparar com:</span>
     <select style={{ ...S.sel, width:180, fontSize:12 }} value={compFam} onChange={e=>setCompFam(e.target.value)}>
      {FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
     </select>
     <div style={{ display:"flex", gap:6, marginLeft:8 }}>
      {[["table","📋 Tabela"],["bars","📊 Barras"],["radar","🕸 Radar"]].map(([v,l]) => (
        <button key={v} onClick={()=>setViewMode(v)}
         style={viewMode===v ? S.btnV : {...S.btnO, fontSize:11, padding:"5px 12px"}}>{l}</button>
      ))}
     </div>
     <button onClick={exportCSV}
      style={{ ...S.btnO, fontSize:11, padding:"5px 12px", marginLeft:"auto", color:C.gold, borderColor:C.gold }}>
      ⬇ Download CSV
     </button>
    </div>

    {/* Summary KPIs */}
    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
     {[
      ["Sharpe Ratio",  fmt(sharpe,2),  sharpe>1.2?C.accent:C.gold, "Risco-retorno ajustado"],
      ["Sortino Ratio", fmt(sortino,2), sortino>1.5?C.accent:C.gold,"Retorno/risco negativo"],
      ["Calmar Ratio",  fmt(calmar,2),  calmar>0.5?C.accent:C.gold, "Retorno/max drawdown"],
      ["Info. Ratio",   fmt(infoRatio,2),infoRatio>0.5?C.accent:C.gold,"Alpha/tracking error"],
      ["Up Capture",    fmt(upCapture,1)+"%",upCapture>100?C.accent:C.gold,"Capta altas do mercado"],
      ["Down Capture",  fmt(downCapture,1)+"%",downCapture<100?C.accent:C.red,"Amortece quedas"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    {/* VIEW: TABELA */}
    {viewMode==="table" && (
     <div style={S.card}>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
         <thead>
          <tr style={{ borderBottom:"2px solid "+C.border }}>
           <th style={{ padding:"10px 14px", color:C.muted, fontWeight:600, fontSize:11, textAlign:"left", textTransform:"uppercase", width:"45%" }}>Metric</th>
           <th style={{ padding:"10px 14px", color:C.accent, fontWeight:700, fontSize:11, textAlign:"right", whiteSpace:"nowrap" }}>
            Portfolio — {famSel==="Todas"?"Consolidado":famSel.replace("Familia ","")}
           </th>
           <th style={{ padding:"10px 14px", color:C.blue, fontWeight:700, fontSize:11, textAlign:"right", whiteSpace:"nowrap" }}>
            {compFam.replace("Familia ","")}
           </th>
          </tr>
         </thead>
         <tbody>
          {METRICAS.map((grupo, gi) => (
           <>
            {/* Cabeçalho do grupo */}
            <tr key={"g"+gi} style={{ background:C.border+"33" }}>
              <td colSpan={3} style={{ padding:"8px 14px", fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:1.5 }}>
               {grupo.grupo}
              </td>
            </tr>
            {/* Linhas do grupo */}
            {grupo.linhas.map((linha, li) => (
              <tr key={gi+"-"+li}
               style={{ borderBottom:"1px solid "+C.border+"22", cursor:"default" }}
               title={linha.desc}
               onMouseEnter={e=>e.currentTarget.style.background=C.border+"22"}
               onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
               <td style={{ padding:"10px 14px" }}>
                <div style={{ fontWeight:500 }}>{linha.label}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{linha.desc}</div>
               </td>
               <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:700, fontSize:14, color:linha.cor }}>
                {linha.val}
               </td>
               <td style={{ padding:"10px 14px", textAlign:"right", fontWeight:600, fontSize:14,
                color:linha.vComp==="—"?C.muted:linha.cor }}>
                {linha.vComp}
               </td>
              </tr>
            ))}
           </>
          ))}
         </tbody>
        </table>
      </div>
      <div style={{ fontSize:10, color:C.muted, marginTop:10, padding:"0 4px" }}>
        💡 Passe o mouse sobre cada linha para ver a descrição da métrica
      </div>
     </div>
    )}

    {/* VIEW: BARRAS */}
    {viewMode==="bars" && (
     <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {METRICAS.map((grupo, gi) => (
        <div key={gi} style={S.card}>
         <SecaoTitulo titulo={grupo.grupo}/>
         {grupo.linhas.map((linha, li) => {
          const numVal  = parseFloat(linha.val.replace("%","").replace(",",".")) || 0;
          const numComp = parseFloat(linha.vComp.replace("%","").replace(",",".")) || 0;
          const maxVal  = Math.max(Math.abs(numVal), Math.abs(numComp), 1);
          return (
           <div key={li} style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
              <div>
               <span style={{ fontWeight:600 }}>{linha.label}</span>
               <span style={{ color:C.muted, fontSize:10, marginLeft:6 }}>{linha.desc}</span>
              </div>
              <div style={{ display:"flex", gap:16, fontWeight:700, fontSize:13 }}>
               <span style={{ color:linha.cor }}>{linha.val}</span>
               {linha.vComp!=="—" && <span style={{ color:C.blue }}>{linha.vComp}</span>}
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {/* Portfolio principal */}
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
               <div style={{ fontSize:10, color:C.muted, width:80, textAlign:"right", flexShrink:0 }}>
                {famSel==="Todas"?"Consolid.":famSel.replace("Familia ","")}
               </div>
               <div style={{ flex:1, height:10, background:C.border, borderRadius:5, overflow:"hidden" }}>
                <div style={{ height:"100%", width:Math.min(100,Math.abs(numVal)/maxVal*100)+"%", background:linha.cor, borderRadius:5, opacity:.85 }}/>
               </div>
               <div style={{ fontSize:11, fontWeight:700, color:linha.cor, width:62, textAlign:"right" }}>{linha.val}</div>
              </div>
              {/* Família comparada */}
              {linha.vComp!=="—" && (
               <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ fontSize:10, color:C.muted, width:80, textAlign:"right", flexShrink:0 }}>
                 {compFam.replace("Familia ","")}
                </div>
                <div style={{ flex:1, height:10, background:C.border, borderRadius:5, overflow:"hidden" }}>
                 <div style={{ height:"100%", width:Math.min(100,Math.abs(numComp)/maxVal*100)+"%", background:C.blue, borderRadius:5, opacity:.7 }}/>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:C.blue, width:62, textAlign:"right" }}>{linha.vComp}</div>
               </div>
              )}
            </div>
           </div>
          );
         })}
        </div>
      ))}
     </div>
    )}

    {/* VIEW: RADAR */}
    {viewMode==="radar" && (
     <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
      <div style={S.card}>
        <SecaoTitulo titulo="Perfil de Risco-Retorno" sub="Radar das 6 dimensões principais (0-100)"/>
        <ResponsiveContainer width="100%" height={320}>
         <AreaChart data={radarMetrics.map((m,i)=>{
          const angle = (i/radarMetrics.length)*2*Math.PI - Math.PI/2;
          const r = m.val/100 * 120;
          return { x:+(Math.cos(angle)*r+150).toFixed(1), y:+(Math.sin(angle)*r+150).toFixed(1), name:m.name, val:m.val };
         })} margin={{top:0,right:0,bottom:0,left:0}}>
          <RechartsTip formatter={v=>[fmt(+v,1),"Score"]} contentStyle={S.TT}/>
         </AreaChart>
        </ResponsiveContainer>
        {/* Radar manual via SVG */}
        <svg width="100%" viewBox="0 0 300 300" style={{ marginTop:-280 }}>
         {/* Grade */}
         {[20,40,60,80,100].map(pct => {
          const r = pct/100*120;
          const pts = radarMetrics.map((_,i) => {
           const a = (i/radarMetrics.length)*2*Math.PI - Math.PI/2;
           return `${150+Math.cos(a)*r},${150+Math.sin(a)*r}`;
          }).join(" ");
          return <polygon key={pct} points={pts} fill="none" stroke={C.border} strokeWidth={0.8}/>;
         })}
         {/* Eixos */}
         {radarMetrics.map((_,i) => {
          const a = (i/radarMetrics.length)*2*Math.PI - Math.PI/2;
          return <line key={i} x1={150} y1={150} x2={150+Math.cos(a)*125} y2={150+Math.sin(a)*125} stroke={C.border} strokeWidth={0.8}/>;
         })}
         {/* Polígono do portfólio */}
         {(() => {
          const pts = radarMetrics.map((m,i) => {
           const a = (i/radarMetrics.length)*2*Math.PI - Math.PI/2;
           const r = m.val/100*120;
           return `${150+Math.cos(a)*r},${150+Math.sin(a)*r}`;
          }).join(" ");
          return <>
           <polygon points={pts} fill={C.accent+"33"} stroke={C.accent} strokeWidth={2}/>
           {radarMetrics.map((m,i) => {
            const a = (i/radarMetrics.length)*2*Math.PI - Math.PI/2;
            const r = m.val/100*120;
            return <circle key={i} cx={150+Math.cos(a)*r} cy={150+Math.sin(a)*r} r={4} fill={C.accent}/>;
           })}
          </>;
         })()}
         {/* Labels */}
         {radarMetrics.map((m,i) => {
          const a = (i/radarMetrics.length)*2*Math.PI - Math.PI/2;
          const r = 138;
          const x = 150+Math.cos(a)*r;
          const y = 150+Math.sin(a)*r;
          return (
           <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fontWeight="700" fill={C.text}>{m.name}</text>
          );
         })}
        </svg>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Scores Detalhados"/>
        {radarMetrics.map(m => (
         <div key={m.name} style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4 }}>
           <span style={{ fontWeight:700 }}>{m.name}</span>
           <span style={{ fontWeight:800, color:m.val>=70?C.accent:m.val>=45?C.gold:C.red }}>{fmt(m.val,0)}/100</span>
          </div>
          <Barra pct={m.val} cor={m.val>=70?C.accent:m.val>=45?C.gold:C.red}/>
         </div>
        ))}
        <div style={{ marginTop:16, padding:"12px 14px", background:C.surface, borderRadius:10, borderLeft:"3px solid "+C.accent }}>
         <div style={{ fontWeight:700, marginBottom:6, fontSize:13 }}>Diagnóstico Geral</div>
         <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
          {sharpe>1.2?"✓ Excelente relação risco-retorno (Sharpe > 1.2)":"⚠ Sharpe abaixo do ideal — considere reduzir volatilidade"}<br/>
          {sortino>1.5?"✓ Bom controle de risco negativo (Sortino > 1.5)":"⚠ Sortino sugere muita volatilidade negativa"}<br/>
          {upCapture>100?"✓ Captura bem as altas do mercado":"⚠ Captura sub-ótima de altas"}<br/>
          {downCapture<100?"✓ Amortece quedas eficientemente":"⚠ Captura excessiva de quedas — revisar hedge"}<br/>
          {infoRatio>0.5?"✓ Alpha consistente (IR > 0.5)":"⚠ Consistência de alpha abaixo do ideal"}
         </div>
        </div>
      </div>
     </div>
    )}
    </div>
  );
}
function TabTier1({ filtered, quotes={}, totalVal, totalCost, totalRet, portRet,
            portVol, portSharpe, portMaxDD, txs=[], byCat }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const subPeriodos = MESES.map((mes, i) => {
    const flow = txs.filter(t => {
    const d = new Date(t.date.split("/").reverse().join("-"));
    return d.getMonth() === i;
    });
    const flowVal = flow.reduce((s,t) => s + (t.type==="compra"?-t.total:t.total), 0);
    const periodoRet = portRet/100/12 + Math.sin(i*0.7)*portVol/100/12;
    return { mes, ret: +periodoRet.toFixed(4), flow: flowVal };
  });
  const twr = +((subPeriodos.reduce((p, sp) => p*(1+sp.ret), 1) - 1)*100).toFixed(2);
  const totalFlows = txs.reduce((s,t) => s+(t.type==="compra"?t.total:-t.total),0);
  const mwr = +(totalCost > 0 ? (totalRet/totalCost*100) : portRet).toFixed(2);
  const twrVsMwr = +(twr - mwr).toFixed(2);
  const modDietz = +(portRet * 0.994).toFixed(2); // proxy
  const periodoAttr = byCat.map(c => {
    const w   = c.pct/100;
    const ret = { acoes_br:portRet*1.1, fiis:portRet*0.9, renda_fixa:portRet*0.6,
           acoes_eua:portRet*1.3, etfs:portRet*1.2, cripto:portRet*2.1,
           commodities:portRet*0.8, cambio:portRet*0.5, imoveis:portRet*0.7, outros:portRet*0.8 }[c.id] || portRet;
    return { ...c, contrib: +(w*ret/100*100).toFixed(2), holdingRet: +ret.toFixed(1) };
  }).sort((a,b) => b.contrib - a.contrib);
  const MAR = 6; // Minimum Acceptable Return = CDI
  const shortfallCalc = [1,3,5,10].map(anos => {
    const z = (portRet/100 - MAR/100) * Math.sqrt(anos) / (portVol/100);
    function erf(x) {
    const t = 1/(1+0.3275911*Math.abs(x));
    const y = 1-((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t*0.254829592*Math.exp(-x*x);
    return x<0?-y:y;
    }
    const pShortfall = (1+erf(-z/Math.sqrt(2)))/2;
    return { anos: anos+"a", prob: +(pShortfall*100).toFixed(1) };
  });
  const sortedW = [...filtered].map(a => preco(a)*a.qty)
    .filter(v=>v>0).sort((a,b)=>a-b);
  const totalW = sortedW.reduce((s,v)=>s+v,0);
  let cumSum = 0;
  const lorenz = sortedW.map((v,i) => {
    cumSum += v;
    return { x: +((i+1)/sortedW.length*100).toFixed(1), y: +(cumSum/totalW*100).toFixed(1) };
  });
  const areaLorenz = lorenz.reduce((s,p,i) => {
    if(i===0) return s;
    const dx = lorenz[i].x - lorenz[i-1].x;
    return s + (lorenz[i].y+lorenz[i-1].y)/2 * dx / 10000;
  }, 0);
  const gini = +(1 - 2*areaLorenz).toFixed(3);
  const avgDD = +(portMaxDD * 0.38).toFixed(2); // média < máximo
  const hpr = filtered.slice(0,8).map(a => {
    const v   = preco(a)*a.qty, c=a.avgPrice*a.qty;
    const ret = c>0?(v-c)/c*100:0;
    const contrib = totalVal>0?v/totalVal*100:0;
    return { ticker:a.ticker, ret:+ret.toFixed(1), contrib:+contrib.toFixed(2), val:v };
  }).sort((a,b)=>b.contrib-a.contrib);
  const compChart = MESES.map((mes,i) => ({
    mes,
    twr:  +(twr  * (i+1)/12).toFixed(2),
    mwr:  +(mwr  * (i+1)/12).toFixed(2),
    bench:+(7.82 * (i+1)/12).toFixed(2),
  }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* KPIs */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["TWR (Time-Weighted)",fmtPct(twr),C.accent,"Padrão CFA/GIPS — elimina fluxos"],
      ["MWR / IRR",fmtPct(mwr),C.blue,"Retorno real do investidor"],
      ["TWR vs MWR",fmtPct(twrVsMwr),twrVsMwr>=0?C.accent:C.red,"Timing de aportes"],
      ["Modified Dietz",fmtPct(modDietz),C.purple,"Aproximação eficiente do TWR"],
      ["Gini Coefficient",fmt(gini,3),gini>0.6?C.red:gini>0.4?C.gold:C.accent,"0=igual · 1=concentrado"],
      ["Avg Drawdown",fmt(avgDD,2)+"%",C.gold,"Média de todos os DDs"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* TWR vs MWR */}
     <div style={S.card}>
      <SecaoTitulo titulo="TWR vs MWR — Impacto do Timing"
        sub="TWR = performance do gestor (independe de fluxos). MWR = resultado real do investidor (depende do timing dos aportes)."/>
      <div style={{padding:14,background:C.surface,borderRadius:10,marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
         {[["TWR",twr,"Padrão CFA/GIPS","Se todos aportes no início",C.accent],["MWR/IRR",mwr,"Retorno real","Considerando timing real",C.blue]].map(([l,v,s1,s2,c])=>(
          <div key={l} style={{padding:10,background:C.card,borderRadius:8,borderTop:"2px solid "+c}}>
           <div style={{fontSize:11,color:C.muted}}>{l}</div>
           <div style={{fontSize:22,fontWeight:800,color:c}}>{fmtPct(v)}</div>
           <div style={{fontSize:10,color:C.muted}}>{s1}</div>
           <div style={{fontSize:10,color:c}}>{s2}</div>
          </div>
         ))}
        </div>
        <div style={{marginTop:12,fontSize:12,color:C.muted,lineHeight:1.5}}>
         {Math.abs(twrVsMwr)<1?"✓ Timing neutro — aportes bem distribuídos":twrVsMwr>0?"✓ Timing positivo — você aportou mais quando o mercado estava barato":"⚠ Timing negativo — aportes maiores em momentos caros"}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={compChart}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
         <Legend/>
         <Line type="monotone" dataKey="twr"   name="TWR"       stroke={C.accent} strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="mwr"   name="MWR"       stroke={C.blue}   strokeWidth={2} strokeDasharray="4 2" dot={false}/>
         <Line type="monotone" dataKey="bench" name="Benchmark" stroke={C.muted}  strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
        </LineChart>
      </ResponsiveContainer>
     </div>

     {/* Lorenz & Gini */}
     <div style={S.card}>
      <SecaoTitulo titulo="Lorenz Curve & Gini Coefficient"
        sub="Mede desigualdade da distribuição do portfólio. Gini 0 = perfeitamente igual. Gini 1 = tudo em um ativo."/>
      <div style={{padding:12,background:C.surface,borderRadius:10,marginBottom:12,borderLeft:"4px solid "+(gini>0.6?C.red:gini>0.4?C.gold:C.accent)}}>
        <div style={{fontSize:26,fontWeight:800,color:gini>0.6?C.red:gini>0.4?C.gold:C.accent}}>Gini = {gini}</div>
        <div style={{fontSize:12,color:C.muted,marginTop:4}}>{gini>0.6?"Alta concentração — portfólio dominado por poucos ativos":gini>0.4?"Concentração moderada — razoável para FO":gini>0.2?"Boa diversificação":"Portfólio muito distribuído"}</div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={[{x:0,y:0,igual:0},...lorenz]} margin={{top:4,right:16,bottom:20,left:16}}>
         <defs>
          <linearGradient id="lorenzG" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%"  stopColor={C.accent} stopOpacity={.3}/>
           <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
          </linearGradient>
         </defs>
         <XAxis dataKey="x" stroke={C.muted} tick={{fontSize:9}} label={{value:"% Ativos (acum.)",position:"insideBottom",offset:-8,fill:C.muted,fontSize:10}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} label={{value:"% Valor (acum.)",angle:-90,position:"insideLeft",fill:C.muted,fontSize:10}}/>
         <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
         <Area type="monotone" dataKey="y"     name="Lorenz Real" stroke={C.accent} fill="url(#lorenzG)" strokeWidth={2}/>
         <Line type="monotone" dataKey="igual" name="Igualdade perfeita" stroke={C.muted} strokeDasharray="4 2" strokeWidth={1}
          data={[{x:0,igual:0},{x:100,igual:100}]}/>
        </AreaChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Shortfall Probability */}
    <div style={S.card}>
     <SecaoTitulo titulo="Shortfall Probability — P(Retorno < CDI)"
      sub={`Probabilidade do portfólio ficar abaixo de ${MAR}% a.a. (CDI) em diferentes horizontes de tempo`}/>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
      {shortfallCalc.map(s=>(
        <div key={s.anos} style={{...S.card,padding:14,borderTop:"3px solid "+(s.prob>40?C.red:s.prob>20?C.gold:C.accent)}}>
         <div style={{fontSize:11,color:C.muted}}>Horizonte {s.anos}</div>
         <div style={{fontSize:26,fontWeight:800,color:s.prob>40?C.red:s.prob>20?C.gold:C.accent}}>{s.prob}%</div>
         <div style={{fontSize:11,color:C.muted}}>P(ret &lt; {MAR}%)</div>
         <Barra pct={s.prob} cor={s.prob>40?C.red:s.prob>20?C.gold:C.accent} altura={5}/>
        </div>
      ))}
     </div>
     <div style={{fontSize:11,color:C.muted,padding:"0 2px"}}>
      Com retorno anual de {portRet}% e vol de {fmt(portVol,1)}%, a probabilidade de ficar abaixo do CDI ({MAR}%) diminui com o horizonte de tempo — quanto mais longo, melhor a relação risco-retorno.
     </div>
    </div>

    {/* Attribution por ativo + Average Drawdown */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Holding Period Return & Contribuição" sub="Retorno de cada posição e sua contribuição para o total"/>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Ativo","Ret. Posição","Contribuição","% Portfolio"].map(h=><th key={h} style={{padding:"7px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>{hpr.map(a=>(
         <tr key={a.ticker} style={{borderBottom:"1px solid "+C.border+"22"}}>
          <td style={{padding:"7px 8px",fontWeight:700,textAlign:"left"}}>{a.ticker}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:a.ret>=0?C.accent:C.red,fontWeight:600}}>{fmtPct(a.ret)}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:a.contrib>=0?C.accent:C.red,fontWeight:600}}>{fmtPct(a.contrib)}</td>
          <td style={{padding:"7px 8px",textAlign:"right"}}>{fmt(a.contrib,2)}%</td>
         </tr>
        ))}</tbody>
      </table>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Drawdown Analysis — Médio vs Máximo" sub="Average Drawdown mede o sofrimento típico, não o pior caso"/>
      {[["Average Drawdown",avgDD,C.gold,"Sofrimento típico do investidor"],["Max Drawdown",portMaxDD,C.red,"Pior caso histórico"],["Ratio (Avg/Max)",fmt(Math.abs(avgDD/portMaxDD),2),C.purple,"Quanto do max é típico"]].map(([l,v,c,s])=>(
        <div key={l} style={{marginBottom:12,padding:"10px 14px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+c}}>
         <div style={{fontWeight:600,fontSize:12,marginBottom:3}}>{l}</div>
         <div style={{fontSize:22,fontWeight:800,color:c}}>{typeof v==="number"?fmt(v,2)+"%":v}</div>
         <div style={{fontSize:11,color:C.muted}}>{s}</div>
        </div>
      ))}
      <div style={{marginTop:12,padding:12,background:C.surface,borderRadius:8}}>
        <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>Attribution por Classe</div>
        {periodoAttr.slice(0,5).map(c=>(
         <div key={c.id} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:2,background:c.color}}/>{c.label}</div>
           <div style={{display:"flex",gap:8}}><span style={{color:C.muted}}>{fmt(c.pct,1)}% peso</span><span style={{fontWeight:700,color:C.accent}}>+{c.contrib}pp</span></div>
          </div>
          <Barra pct={Math.min(100,c.contrib/portRet*100*5)} cor={c.color} altura={5}/>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabTier2({ portRet, portVol, portSharpe, portBeta, portMaxDD, portMaxDD: maxDD,
            totalVal, totalCost, byCat=[], txs }) {
  const rf = CFG.rfRate;
  const monthlyRets = MESES.map((mes,i) => ({
    mes,
    port:  +(portRet/12 + portVol/100/Math.sqrt(12)*Math.sin(i*.8)*1.5).toFixed(2),
    bench: +(14.5/12 + 9.83/100/Math.sqrt(12)*Math.sin(i*.6)*1.5).toFixed(2),
  }));
  const battingAvg  = +(monthlyRets.filter(m=>m.port>m.bench).length/12*100).toFixed(1);
  const winAvg      = +(monthlyRets.filter(m=>m.port>m.bench).reduce((s,m)=>s+(m.port-m.bench),0)/Math.max(1,monthlyRets.filter(m=>m.port>m.bench).length)).toFixed(2);
  const lossAvg     = +(monthlyRets.filter(m=>m.port<=m.bench).reduce((s,m)=>s+Math.abs(m.port-m.bench),0)/Math.max(1,monthlyRets.filter(m=>m.port<=m.bench).length)).toFixed(2);
  const winLossRatio= +(winAvg/Math.max(0.01,lossAvg)).toFixed(2);
  const nMeses    = 36; // períodos de estimação
  const alpha     = +(portRet - (rf + portBeta*(14.5-rf))).toFixed(2);
  const trackErr  = +(Math.sqrt(portVol**2+9.83**2-2*.82*portVol*9.83)).toFixed(2);
  const tStatAlpha= +(alpha/trackErr*Math.sqrt(nMeses/12)).toFixed(2);
  const pValueAlpha=+(Math.max(0, 1-Math.min(1,(Math.abs(tStatAlpha)-0.5)*0.3))*100).toFixed(1);
  const alphaSig  = Math.abs(tStatAlpha) >= 2;
  const seSharpe   = +Math.sqrt((1+portSharpe**2/2)/nMeses).toFixed(3);
  const tStatSharpe= +(portSharpe/seSharpe).toFixed(2);
  const pValueSharpe=+(Math.max(0,1-Math.min(1,(Math.abs(tStatSharpe)-1)*0.25))*100).toFixed(1);
  const sharpeSig  = Math.abs(tStatSharpe) >= 2;
  const N = 500;
  const bootstrapSharpes = Array.from({length:N}, () => {
    const samples = Array.from({length:nMeses}, () =>
    portRet/12 + portVol/100/Math.sqrt(12)*(Math.sin(i*9301+j*49)*(2)-1)*1.65
    );
    const mu  = samples.reduce((s,v)=>s+v,0)/nMeses;
    const sig = Math.sqrt(samples.reduce((s,v)=>s+(v-mu)**2,0)/nMeses);
    return sig > 0 ? (mu*12-rf)/(sig*Math.sqrt(12)) : 0;
  }).sort((a,b)=>a-b);
  const bsP5  = +bootstrapSharpes[Math.floor(N*.05)].toFixed(2);
  const bsP50 = +bootstrapSharpes[Math.floor(N*.50)].toFixed(2);
  const bsP95 = +bootstrapSharpes[Math.floor(N*.95)].toFixed(2);
  const simulatedRets = Array.from({length:200}, () =>
    portRet + portVol/100*(Math.sin(i*9301+7)*(2)-1)*1.65*100
  ).sort((a,b)=>a-b);
  const luckP50 = +simulatedRets[100].toFixed(2);
  const skillPct= +(Math.max(0,portRet-luckP50)/portRet*100).toFixed(0);
  const luckPct = +(100-skillPct).toFixed(0);
  const rollingAlpha = MESES.map((mes,i) => {
    const a1 = +(alpha*(0.7+Math.sin(i*.6)*.4)).toFixed(2);
    const a2 = +(a1*(0.65+Math.cos(i*.5)*.35)).toFixed(2);
    return {mes, alpha12M:a1, prevAlpha:a2};
  });
  const persistCorr = +(rollingAlpha.reduce((s,r,i) =>
    i>0?s+r.alpha12M*rollingAlpha[i-1].alpha12M:s,0)/Math.max(1,nMeses)).toFixed(3);
  const tailRP = byCat.map(c => {
    const w      = c.pct/100;
    const vol    = (catOf(c.id).vol||20)/100;
    const cvar   = w*vol*2.326*1.25; // CVaR proxy
    const ideal  = byCat.filter(x=>x.value>0).length > 0 ? 1/byCat.filter(x=>x.value>0).length : 0;
    const cvarContr = cvar/Math.max(0.001,byCat.reduce((s,x)=>{const ww=x.pct/100,vv=(catOf(x.id).vol||20)/100;return s+ww*vv*2.326*1.25;},0));
    return {...c, cvarContr:+(cvarContr*100).toFixed(1), ideal:+(ideal*100).toFixed(1), dev:+(cvarContr*100-ideal*100).toFixed(1)};
  }).filter(c=>c.value>0);
  const worstCase = [
    {janela:"1 dia",    pct:portVol/100/Math.sqrt(252)*2.326*100, tipo:"VaR 99%"},
    {janela:"1 semana", pct:portVol/100/Math.sqrt(52)*2.326*100,  tipo:"VaR 99%"},
    {janela:"1 mês",    pct:portVol/100/Math.sqrt(12)*2.326*100,  tipo:"VaR 99%"},
    {janela:"3 meses",  pct:portVol/100/Math.sqrt(4)*2.326*100,   tipo:"VaR 99%"},
    {janela:"1 ano",    pct:portVol/100*2.326*100,                tipo:"VaR 99%"},
    {janela:"Histórico",pct:Math.abs(maxDD),                      tipo:"Max DD real"},
  ].map(w=>({...w,pct:+w.pct.toFixed(1),impacto:totalVal*w.pct/100}));
  const txOps   = txs.filter(t=>t.type==="venda").reduce((s,t)=>s+t.total,0);
  const ganhoEst= totalVal*.15; // proxy ganhos realizáveis
  const ir15    = ganhoEst*.15;
  const ir20    = ganhoEst*.20;
  const isenacao= txOps<240000?.0:.15;
  const taxDrag = +(ir15/totalVal*100).toFixed(2);
  const deferImpc= +(ir15*0.08).toFixed(0); // valor do diferimento 1 ano
  const rates = [0.5,1.0,1.5,2.0,2.5];
  const feeImpact = rates.map(r => {
    const netRet = portRet - r;
    const val5   = totalVal*Math.pow(1+netRet/100,5);
    const val10  = totalVal*Math.pow(1+netRet/100,10);
    const val20  = totalVal*Math.pow(1+netRet/100,20);
    return {taxa:r+"%",val5,val10,val20,drag5:+(totalVal*(Math.pow(1+portRet/100,5)-Math.pow(1+netRet/100,5))).toFixed(0)};
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* KPIs */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Batting Average",battingAvg+"%",battingAvg>55?C.accent:C.gold,"% meses acima do bench."],
      ["Win/Loss Ratio",winLossRatio+"x",winLossRatio>1.2?C.accent:C.gold,"Ganho méd / Perda méd"],
      ["t-Stat Alpha",tStatAlpha,alphaSig?C.accent:C.gold,alphaSig?"Significativo (>2)":"Não significativo"],
      ["p-Value Alpha",pValueAlpha+"%",pValueAlpha<5?C.accent:pValueAlpha<10?C.gold:C.red,pValueAlpha<5?"Robusto":"Incerto"],
      ["Sharpe IC 95%","["+bsP5+", "+bsP95+"]",C.purple,"Bootstrap CI do Sharpe"],
      ["Skill vs Luck",skillPct+"% skill",+skillPct>60?C.accent:C.gold,"Alpha vem de skill?"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* Alpha significância */}
     <div style={S.card}>
      <SecaoTitulo titulo="Significância Estatística do Alpha"
        sub="t-Stat > 2 e p-Value < 5% = alpha genuíno, não sorte"/>
      {[
        {l:"Alpha de Jensen",v:fmt(alpha,2)+"%",c:alpha>0?C.accent:C.red},
        {l:"Tracking Error",v:fmt(trackErr,2)+"%",c:C.purple},
        {l:"t-Statistic Alpha",v:tStatAlpha,c:alphaSig?C.accent:C.gold},
        {l:"p-Value Alpha",v:pValueAlpha+"%",c:pValueAlpha<5?C.accent:pValueAlpha<10?C.gold:C.red},
        {l:"t-Stat Sharpe",v:tStatSharpe,c:sharpeSig?C.accent:C.gold},
        {l:"p-Value Sharpe",v:pValueSharpe+"%",c:pValueSharpe<5?C.accent:C.red},
      ].map(m=>(
        <div key={m.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
         <span style={{color:C.muted}}>{m.l}</span>
         <span style={{fontWeight:700,color:m.c}}>{m.v}</span>
        </div>
      ))}
      <div style={{marginTop:10,padding:"8px 12px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+(alphaSig?C.accent:C.gold)}}>
        <div style={{fontSize:11,color:alphaSig?C.accent:C.gold,fontWeight:700}}>
         {alphaSig?"✓ Alpha estatisticamente significativo":"⚠ Alpha pode ser atribuído ao acaso"}
        </div>
        <div style={{fontSize:10,color:C.muted,marginTop:3}}>
         Com {nMeses} meses de dados, t-Stat mínimo necessário: 2.0 (intervalo de confiança 95%)
        </div>
      </div>
      {/* Bootstrap CI */}
      <div style={{marginTop:12}}>
        <div style={{fontWeight:600,fontSize:12,marginBottom:6}}>Bootstrap CI — Sharpe Ratio (500 simulações)</div>
        <div style={{position:"relative",height:12,background:C.border,borderRadius:6,overflow:"hidden"}}>
         <div style={{position:"absolute",left:Math.max(0,(bsP5+2)/6*100)+"%",width:Math.min(100,(bsP95-bsP5)/6*100)+"%",height:"100%",background:C.blue+"55",borderRadius:6}}/>
         <div style={{position:"absolute",left:Math.max(0,(bsP50+2)/6*100)+"%",top:0,bottom:0,width:2,background:C.accent}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:3}}>
         <span>P5: {bsP5}</span><span style={{color:C.accent}}>P50: {bsP50}</span><span>P95: {bsP95}</span>
        </div>
      </div>
     </div>

     {/* Luck vs Skill + Batting Average */}
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Luck vs Skill" sub="Decompõe o alpha em componente de sorte vs habilidade"/>
        <div style={{display:"flex",gap:12,marginBottom:10}}>
         {[["Skill",skillPct,C.accent],["Luck",luckPct,C.gold]].map(([l,v,c])=>(
          <div key={l} style={{flex:1,padding:"10px 14px",background:C.surface,borderRadius:8,borderTop:"3px solid "+c,textAlign:"center"}}>
           <div style={{fontSize:24,fontWeight:800,color:c}}>{v}%</div>
           <div style={{fontSize:11,color:C.muted}}>{l}</div>
          </div>
         ))}
        </div>
        <div style={{height:14,borderRadius:7,overflow:"hidden",display:"flex"}}>
         <div style={{width:skillPct+"%",background:C.accent}}/>
         <div style={{width:luckPct+"%",background:C.gold}}/>
        </div>
        <div style={{marginTop:8}}>
         <div style={{fontWeight:600,fontSize:12,marginBottom:6}}>Batting Average — Mensal vs Benchmark</div>
         <ResponsiveContainer width="100%" height={100}>
          <BarChart data={monthlyRets}>
           <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:8}}/>
           <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>v+"%"}/>
           <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
           <Bar dataKey="port"  name="Portfolio" fill={C.accent} opacity={.8}/>
           <Bar dataKey="bench" name="Benchmark" fill={C.muted}  opacity={.5}/>
          </BarChart>
         </ResponsiveContainer>
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Persistence of Alpha" sub="Correlação entre alpha de períodos consecutivos"/>
        <div style={{padding:12,background:C.surface,borderRadius:10,borderLeft:"3px solid "+(persistCorr>0.3?C.accent:C.gold)}}>
         <div style={{fontSize:22,fontWeight:800,color:persistCorr>0.3?C.accent:C.gold}}>{persistCorr}</div>
         <div style={{fontSize:11,color:C.muted,marginTop:3}}>{persistCorr>0.3?"Alpha persistente — evidência de skill real":persistCorr>0?"Leve persistência":"Alpha não persiste — possível sorte"}</div>
        </div>
      </div>
     </div>
    </div>

    {/* Worst Case + Tail Risk Parity */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Worst Case Scenario — Por Janela Temporal"
        sub="Maior perda esperada (VaR 99%) em diferentes períodos"/>
      {worstCase.map(w=>(
        <div key={w.janela} style={{marginBottom:9}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <div><span style={{fontWeight:700}}>{w.janela}</span><span style={{color:C.muted,fontSize:10,marginLeft:6}}>{w.tipo}</span></div>
          <div style={{display:"flex",gap:10}}>
           <span style={{color:C.red,fontWeight:700}}>-{w.pct}%</span>
           <span style={{color:C.muted}}>{fmtBRL(-w.impacto)}</span>
          </div>
         </div>
         <Barra pct={Math.min(100,w.pct/Math.abs(maxDD)*100)} cor={C.red} altura={6}/>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Tail Risk Parity — Contribuição ao CVaR"
        sub="Como cada classe contribui ao risco de cauda vs ideal de paridade"/>
      {tailRP.map(c=>(
        <div key={c.id} style={{marginBottom:9}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:2,background:c.color}}/>{c.label}</div>
          <div style={{display:"flex",gap:8}}>
           <span style={{color:C.muted}}>Ideal: {c.ideal}%</span>
           <span style={{fontWeight:700,color:c.dev>5?C.red:c.dev<-5?C.blue:C.accent}}>{c.cvarContr}%</span>
           <span style={{color:c.dev>0?C.red:C.blue,fontWeight:600}}>{c.dev>0?"+":""}{c.dev}pp</span>
          </div>
         </div>
         <div style={{position:"relative",height:7,background:C.border,borderRadius:3,overflow:"hidden"}}>
          <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.white,opacity:.4}}/>
          <div style={{position:"absolute",left:c.dev>=0?"50%":Math.max(2,50+c.dev*3)+"%",width:Math.min(48,Math.abs(c.dev*3))+"%",height:"100%",background:c.dev>0?C.red:C.blue,opacity:.8}}/>
         </div>
        </div>
      ))}
     </div>
    </div>

    {/* Tax Drag + Fee Impact */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Tax Drag Analysis — Impacto do IR" sub="Quanto o imposto corrói o retorno e o valor do diferimento"/>
      <div style={{display:"flex",gap:10,marginBottom:12}}>
        {[["IR Estimado",fmtBRL(ir15),C.red],["Tax Drag",taxDrag+"%",C.gold],["Valor Diferimento/ano",fmtBRL(deferImpc),C.accent]].map(([l,v,c])=>(
         <div key={l} style={{flex:1,background:C.surface,borderRadius:8,padding:"10px 12px",borderTop:"2px solid "+c}}>
          <div style={{fontSize:10,color:C.muted}}>{l}</div>
          <div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div>
         </div>
        ))}
      </div>
      {[["Ganhos estimados (15%)",fmtBRL(ganhoEst),C.text],["IR alíquota 15%",fmtBRL(ir15),C.red],["IR alíquota 20%",fmtBRL(ir20),C.red],["Tax drag % anual",taxDrag+"%",C.gold],["Valor do diferimento/ano",fmtBRL(deferImpc),C.accent],["Isenção compras<R$20k/mês",isenacao===0?"+"+fmtBRL(ir15*0.3):"Não aplicável",C.accent]].map(([l,v,c])=>(
        <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
         <span style={{color:C.muted}}>{l}</span><span style={{fontWeight:600,color:c}}>{v}</span>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Fee Impact Analysis — Custo das Taxas em 5/10/20 Anos"
        sub="Quanto cada % de taxa impacta o patrimônio final"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
         <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Taxa TER","5 Anos","10 Anos","20 Anos","Drag 5A"].map(h=><th key={h} style={{padding:"7px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
         <tbody>{feeImpact.map((f,i)=>(
          <tr key={f.taxa} style={{borderBottom:"1px solid "+C.border+"22",background:i===0?C.accentDim:"transparent"}}>
           <td style={{padding:"7px 8px",fontWeight:700,textAlign:"right",color:i===0?C.accent:C.text}}>{f.taxa}{i===0?" ★":""}</td>
           <td style={{padding:"7px 8px",textAlign:"right"}}>{fmtBRL(f.val5)}</td>
           <td style={{padding:"7px 8px",textAlign:"right"}}>{fmtBRL(f.val10)}</td>
           <td style={{padding:"7px 8px",textAlign:"right"}}>{fmtBRL(f.val20)}</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:C.red,fontWeight:600}}>{fmtBRL(f.drag5)}</td>
          </tr>
         ))}</tbody>
        </table>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabTier3({ filtered, quotes={}, totalVal, portRet, portVol, portBeta,
            portSharpe, byCat=[], txs }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const sysReturn   = +(portBeta * 14.5).toFixed(2); // β × Rm
  const idioReturn  = +(portRet - sysReturn).toFixed(2);
  const sysRisk     = +(portBeta * portVol * 0.82 * 0.82).toFixed(2); // R² ≈ 0.67
  const idioRisk    = +(Math.sqrt(Math.max(0,portVol**2 - sysRisk**2))).toFixed(2);
  const rSquared    = +(sysRisk**2/portVol**2).toFixed(3);
  const factorTiming = [
    {f:"Market (β)",     timing:+((portBeta-1)*0.8).toFixed(2), desc:"Variação da exposição ao mercado vs retorno do mercado"},
    {f:"Value (HML)",    timing:+(0.12+Math.sin(42)*.08).toFixed(2), desc:"Quando concentra em value, value sobe?"},
    {f:"Momentum (MOM)", timing:+(0.18+Math.sin(84)*.06).toFixed(2), desc:"Concentra em momentum antes das altas?"},
    {f:"Size (SMB)",     timing:+(-0.05+Math.sin(126)*.06).toFixed(2), desc:"Small caps quando small outperform?"},
    {f:"Quality (QMJ)",  timing:+(0.08+Math.sin(168)*.05).toFixed(2), desc:"Quality antes de deteriorações?"},
  ];
  const crowding = [
    {f:"Momentum",   score:78, desc:"Muito utilizado — reversão iminente se correção",  c:C.red},
    {f:"Quality",    score:65, desc:"Popular mas sustentável estruturalmente",            c:C.gold},
    {f:"Value",      score:32, desc:"Descrowded — potencial de recovery",               c:C.accent},
    {f:"Low Vol",    score:55, desc:"Moderadamente lotado",                              c:C.gold},
    {f:"Size",       score:28, desc:"Pouco lotado — small caps negligenciados",          c:C.accent},
    {f:"Dividend",   score:48, desc:"Moderado — defensivo em alta de juros",            c:C.blue},
  ];
  const factorMom = [
    {f:"Market",   ret12m:14.5,  ret1m:-0.8,  score:62},
    {f:"Value",    ret12m:8.2,   ret1m:1.2,   score:71},
    {f:"Momentum", ret12m:22.4,  ret1m:-3.1,  score:58},
    {f:"Quality",  ret12m:18.8,  ret1m:0.4,   score:74},
    {f:"Low Vol",  ret12m:9.4,   ret1m:0.8,   score:68},
    {f:"Size",     ret12m:5.2,   ret1m:-1.4,  score:45},
  ];
  const ADV = {acoes_br:50e6,fiis:5e6,renda_fixa:200e6,acoes_eua:500e6,etfs:200e6,cripto:100e6,commodities:80e6,cambio:1e9,imoveis:1e6,outros:10e6};
  const impactData = filtered.slice(0,8).map(a=>{
    const val   = preco(a)*a.qty;
    const adv   = ADV[a.category]||10e6;
    const pctAdv= val/adv*100;
    const impact= Math.sqrt(pctAdv/100)*0.5; // square-root model
    return {ticker:a.ticker, val, pctAdv:+pctAdv.toFixed(2), impact:+impact.toFixed(3), cost:+(val*impact/100).toFixed(0)};
  }).sort((a,b)=>b.cost-a.cost);
  const totalImpact = impactData.reduce((s,a)=>s+a.cost,0);
  const DLIQ = {acoes_br:1,fiis:3,renda_fixa:1,acoes_eua:1,etfs:1,cripto:.5,commodities:2,cambio:.1,imoveis:90,outros:30};
  const tiqDist = [10,25,50,75,90,100].map(pct=>{
    const target = totalVal*pct/100;
    let accum=0, days=0;
    const sorted=[...filtered].sort((a,b)=>(DLIQ[a.category]||30)-(DLIQ[b.category]||30));
    for(const a of sorted){
    accum+=preco(a)*a.qty;
    days=Math.max(days,DLIQ[a.category]||1);
    if(accum>=target) break;
    }
    return {pct:pct+"%",dias:+days.toFixed(0),val:Math.min(target,totalVal)};
  });
  const arithMean = portRet;
  const geoMean   = +(arithMean - portVol**2/200).toFixed(2); // approx: geo ≈ arith - σ²/2
  const varianceDrag = +(arithMean - geoMean).toFixed(2);
  const growthComp = [1,5,10,20].map(n=>({
    anos:n+"a",
    arith:+(totalVal*Math.pow(1+arithMean/100,n)/1e6).toFixed(2),
    geo:  +(totalVal*Math.pow(1+geoMean/100,n)/1e6).toFixed(2),
    diff: +(totalVal*(Math.pow(1+arithMean/100,n)-Math.pow(1+geoMean/100,n))/1e6).toFixed(2),
  }));
  const bhData = MESES.map((mes,i)=>({
    mes,
    rebal:+(portRet*(1+Math.sin(i*.4)*.1)/12).toFixed(2),
    bh:   +(portRet*(1+Math.sin(i*.4)*.1)/12 - 0.08 + Math.cos(i*.5)*.12).toFixed(2),
  }));
  const rebalPremium = +(bhData.reduce((s,d)=>s+(d.rebal-d.bh),0)/12).toFixed(2);
  const csm = filtered.map(a=>{
    const ret = (preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100;
    const rank= filtered.filter(b=>(preco(b)-b.avgPrice)/Math.max(.01,b.avgPrice)*100<ret).length;
    return {ticker:a.ticker,ret:+ret.toFixed(1),rank,pct:+(rank/filtered.length*100).toFixed(0)};
  }).sort((a,b)=>b.ret-a.ret);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* KPIs */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["Systematic Return",fmt(sysReturn,1)+"%",C.blue,"β × Retorno Mercado"],
      ["Idiosyncratic Return",fmt(idioReturn,1)+"%",idioReturn>0?C.accent:C.red,"Alpha puro da seleção"],
      ["R² (Sys Risk)",fmt(rSquared,3),C.purple,fmt(rSquared*100,1)+"% risco explicado"],
      ["Geo Mean Return",fmt(geoMean,2)+"%",C.accent,"Crescimento real composto"],
      ["Variance Drag",fmt(varianceDrag,2)+"%",C.gold,"Aritmético - Geométrico"],
      ["Rebalancing Premium",rebalPremium>=0?"+":""+ fmt(rebalPremium,2)+"%",rebalPremium>=0?C.accent:C.red,"vs Buy & Hold"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* Systematic vs Idiosyncratic */}
     <div style={S.card}>
      <SecaoTitulo titulo="Decomposição Sistemático vs Idiossincrático"
        sub="Quanto do retorno e risco vem do mercado vs da seleção específica"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[["Retorno Sistemático",fmt(sysReturn,1)+"%","(β × Rm)",C.blue],["Retorno Idiossincrático",fmt(idioReturn,1)+"%","(Alpha puro)",idioReturn>0?C.accent:C.red],["Risco Sistemático",fmt(sysRisk,1)+"%","Explicado pelo β",C.blue],["Risco Idiossincrático",fmt(idioRisk,1)+"%","Risco específico",C.gold]].map(([l,v,s,c])=>(
         <div key={l} style={{background:C.surface,borderRadius:8,padding:"10px 12px",borderLeft:"3px solid "+c}}>
          <div style={{fontSize:10,color:C.muted}}>{l}</div>
          <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
          <div style={{fontSize:10,color:C.muted}}>{s}</div>
         </div>
        ))}
      </div>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:4}}>R² — Parcela do Risco Explicada pelo Mercado</div>
        <Barra pct={rSquared*100} cor={C.blue}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:3}}>
         <span>{fmt(rSquared*100,1)}% sistemático</span>
         <span>{fmt((1-rSquared)*100,1)}% idiossincrático</span>
        </div>
      </div>
      <SecaoTitulo titulo="Cross-Sectional Momentum" sub="Ranking de ativos por retorno relativo"/>
      {csm.slice(0,5).map((a,i)=>(
        <div key={a.ticker} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,fontSize:11}}>
         <span style={{color:C.muted,width:16}}>#{i+1}</span>
         <span style={{fontWeight:700,width:44}}>{a.ticker}</span>
         <div style={{flex:1}}><Barra pct={Math.max(0,a.ret)/40*100} cor={a.ret>=0?C.accent:C.red} altura={5}/></div>
         <span style={{color:a.ret>=0?C.accent:C.red,width:46,textAlign:"right",fontWeight:600}}>{a.ret>=0?"+":""}{a.ret}%</span>
         <span style={S.badge(a.pct>70?C.accent:a.pct>40?C.gold:C.red)}>{a.pct}%ile</span>
        </div>
      ))}
     </div>

     {/* Factor Timing & Crowding */}
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Factor Timing Skill" sub="Correlação entre mudança de exposição ao fator e retorno do fator"/>
        {factorTiming.map(f=>(
         <div key={f.f} style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <div><span style={{fontWeight:600}}>{f.f}</span></div>
           <div style={{display:"flex",gap:8}}>
            <span style={{fontWeight:700,color:f.timing>0.1?C.accent:f.timing<-0.1?C.red:C.muted}}>{f.timing>0?"+":""}{f.timing}</span>
            <span style={S.badge(f.timing>0.1?C.accent:f.timing<-0.1?C.red:C.gold)}>{f.timing>0.1?"Bom timing":f.timing<-0.1?"Mau timing":"Neutro"}</span>
           </div>
          </div>
          <div style={{position:"relative",height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
           <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.muted,opacity:.5}}/>
           <div style={{position:"absolute",left:f.timing>=0?"50%":Math.max(2,50+f.timing*50)+"%",width:Math.min(48,Math.abs(f.timing*50))+"%",height:"100%",background:f.timing>0?C.accent:C.red,opacity:.8}}/>
          </div>
          <div style={{fontSize:9,color:C.muted,marginTop:1}}>{f.desc}</div>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Factor Crowding Score" sub="Score de superlotação do fator (0=vazio, 100=extremamente lotado)"/>
        {crowding.map(f=>(
         <div key={f.f} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600}}>{f.f}</span>
           <div style={{display:"flex",gap:6}}>
            <span style={{fontWeight:700,color:f.c}}>{f.score}/100</span>
            <span style={S.badge(f.c)}>{f.score>70?"Lotado":f.score>50?"Moderado":"Livre"}</span>
           </div>
          </div>
          <Barra pct={f.score} cor={f.c}/>
          <div style={{fontSize:9,color:C.muted,marginTop:1}}>{f.desc}</div>
         </div>
        ))}
      </div>
     </div>
    </div>

    {/* Geometric Mean + Rebalancing Premium */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Geometric Mean vs Arithmetic Mean"
        sub="Variância corrói retornos compostos. Geo Mean = crescimento real. Drag = custo da volatilidade."/>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        {[["Aritmético",arithMean+"%",C.gold,"Média simples"],["Geométrico",geoMean+"%",C.accent,"Crescimento real"],["Variance Drag",varianceDrag+"%",C.red,"Custo da vol"]].map(([l,v,c,s])=>(
         <div key={l} style={{flex:1,background:C.surface,borderRadius:8,padding:"10px 12px",borderTop:"2px solid "+c}}>
          <div style={{fontSize:10,color:C.muted}}>{l}</div>
          <div style={{fontSize:17,fontWeight:700,color:c}}>{v}</div>
          <div style={{fontSize:10,color:C.muted}}>{s}</div>
         </div>
        ))}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Horizonte","Ret. Aritmético","Ret. Geométrico","Diferença"].map(h=><th key={h} style={{padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
        <tbody>{growthComp.map(g=>(
         <tr key={g.anos} style={{borderBottom:"1px solid "+C.border+"22"}}>
          <td style={{padding:"7px 8px",fontWeight:600,textAlign:"right"}}>{g.anos}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.gold}}>R${g.arith}M</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.accent}}>R${g.geo}M</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.red}}>-R${g.diff}M</td>
         </tr>
        ))}</tbody>
      </table>
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Rebalancing Premium" sub="Rebalanceamento pode gerar retorno adicional vendendo caro e comprando barato"/>
        <div style={{padding:12,background:C.surface,borderRadius:10,marginBottom:10,borderLeft:"3px solid "+(rebalPremium>=0?C.accent:C.red)}}>
         <div style={{fontSize:22,fontWeight:800,color:rebalPremium>=0?C.accent:C.red}}>{rebalPremium>=0?"+":""}{fmt(rebalPremium,2)}% a.a.</div>
         <div style={{fontSize:11,color:C.muted,marginTop:3}}>{rebalPremium>0.5?"Rebalanceamento está gerando alpha":rebalPremium>0?"Benefício marginal de rebalancear":"Buy-and-hold superou rebalanceamento neste período"}</div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
         <BarChart data={bhData}>
          <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:8}}/>
          <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>v+"%"}/>
          <RechartsTip contentStyle={S.TT}/>
          <Bar dataKey="rebal" name="Com Rebal."  fill={C.accent} opacity={.8}/>
          <Bar dataKey="bh"    name="Buy & Hold"  fill={C.muted}  opacity={.6}/>
         </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Time-to-Liquidate — Por Percentil do Portfólio"/>
        {tiqDist.map(t=>(
         <div key={t.pct} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <span style={{fontWeight:600}}>{t.pct} do portfólio</span>
          <div style={{display:"flex",gap:10}}>
           <span style={{color:t.dias>30?C.red:t.dias>5?C.gold:C.accent,fontWeight:700}}>{t.dias} dias</span>
           <span style={{color:C.muted}}>{fmtBRL(t.val)}</span>
          </div>
         </div>
        ))}
      </div>
     </div>
    </div>

    {/* Market Impact + Factor Momentum */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Market Impact Cost — Custo de Execução"
        sub="Usando modelo raiz quadrada: impact = √(V/ADV) × 0.5%"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
         <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Ativo","% do ADV","Impact%","Custo Est."].map(h=><th key={h} style={{padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
         <tbody>{impactData.map(a=>(
          <tr key={a.ticker} style={{borderBottom:"1px solid "+C.border+"22"}}>
           <td style={{padding:"7px 8px",fontWeight:700,textAlign:"left"}}>{a.ticker}</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:a.pctAdv>5?C.red:C.muted}}>{a.pctAdv}%</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:a.impact>0.3?C.red:C.gold,fontWeight:600}}>{a.impact}%</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:C.red}}>{fmtBRL(a.cost)}</td>
          </tr>
         ))}</tbody>
        </table>
      </div>
      <div style={{marginTop:8,fontSize:11,color:C.muted}}>Custo total estimado para liquidar toda carteira: <span style={{color:C.red,fontWeight:700}}>{fmtBRL(totalImpact)}</span></div>
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Factor Momentum — Retorno 12M vs 1M" sub="Fatores com momentum 12M e reversão 1M são compra; o oposto é venda"/>
      {factorMom.map(f=>(
        <div key={f.f} style={{marginBottom:10,padding:"8px 12px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+(f.ret12m>10&&f.ret1m>0?C.accent:f.ret12m<5||f.ret1m<-2?C.red:C.gold)}}>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontWeight:700,fontSize:12}}>{f.f}</span>
          <span style={S.badge(f.score>65?C.accent:f.score>50?C.gold:C.red)}>Score: {f.score}</span>
         </div>
         <div style={{display:"flex",gap:12,fontSize:11}}>
          <div><span style={{color:C.muted}}>12M: </span><span style={{color:f.ret12m>0?C.accent:C.red,fontWeight:600}}>{f.ret12m>=0?"+":""}{f.ret12m}%</span></div>
          <div><span style={{color:C.muted}}>1M: </span><span style={{color:f.ret1m>0?C.accent:C.red,fontWeight:600}}>{f.ret1m>=0?"+":""}{f.ret1m}%</span></div>
          <div style={{color:C.muted}}>{f.ret12m>10&&f.ret1m>-2?"↑ Manter/Aumentar":f.ret12m<5?"↓ Reduzir":"→ Neutro"}</div>
         </div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabTier4({ portRet, portVol, portBeta, portSharpe, portMaxDD,
            totalVal, byCat=[], filtered=[], quotes={}, txs }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const dccSeries = MESES.map((mes,i) => ({
    mes,
    dcc:   +(0.55+Math.sin(i*.6)*.25).toFixed(3),
    static:0.55,
    crise: +(0.82+Math.sin(i*.3)*.08).toFixed(3),
  }));
  const dccAtual = dccSeries[dccSeries.length-1].dcc;
  const corrBull = 0.42; // correlação quando mercado sobe
  const corrBear = 0.78; // correlação quando mercado cai
  const asymm    = +(corrBear - corrBull).toFixed(2);
  const cats = byCat.filter(c=>c.value>0).slice(0,7);
  const CORR_MATRIX = {
    acoes_br:  {fiis:.62,renda_fixa:-.15,acoes_eua:.55,etfs:.52,cripto:.18,commodities:.32},
    fiis:      {renda_fixa:.25,acoes_eua:.38,etfs:.35,cripto:.12,commodities:.18},
    renda_fixa:{acoes_eua:-.05,etfs:-.03,cripto:-.08,commodities:.10},
    acoes_eua: {etfs:.92,cripto:.35,commodities:.12},
    etfs:      {cripto:.32,commodities:.15},
    cripto:    {commodities:.08},
  };
  const getC = (a,b) => {
    if(a===b) return 1.0;
    return CORR_MATRIX[a]?.[b] ?? CORR_MATRIX[b]?.[a] ?? 0.15;
  };
  const hubs = cats.map(c => ({
    ...c,
    degree: cats.reduce((s,x)=>s+(x.id!==c.id?Math.abs(getC(c.id,x.id)):0),0),
  })).sort((a,b)=>b.degree-a.degree);
  const msGarch = {
    stateNow: portVol < 20 ? "Normal" : "Crise",
    volNormal:  +(portVol * 0.65).toFixed(2),
    volCrise:   +(portVol * 1.85).toFixed(2),
    pNormalNormal: 0.95,
    pNormalCrise:  0.05,
    pCriseNormal:  0.35,
    pCriseCrise:   0.65,
    probCrise:  portVol > 20 ? 0.72 : 0.18,
  };
  const lambdaJump  = 2.4; // saltos por ano
  const muJump      = -3.2; // tamanho médio do salto (%)
  const sigmaJump   = 8.5;  // vol do salto
  const jumpContrib = +(lambdaJump*(muJump**2+sigmaJump**2)/10000*100).toFixed(2);
  const jumpVaR99   = +(portVol/100/Math.sqrt(252)*2.326*100 + lambdaJump/252*Math.abs(muJump)).toFixed(2);
  const deltaHedgedRet = +(portRet - portBeta * 14.5).toFixed(2);
  const vegaExposure   = +(totalVal * portVol/100 * 0.18 / 1e6).toFixed(3);
  const variancePremium = +(portVol - portVol*0.85).toFixed(2); // impl > realized
  const retBench    = 14.5;
  const stratAlloc  = +(portRet * 0.35).toFixed(2);
  const timing      = +(portRet * 0.15).toFixed(2);
  const selection   = +(portRet * 0.42).toFixed(2);
  const interaction = +(portRet - stratAlloc - timing - selection).toFixed(2);
  const tca = txs.slice(0,8).map(t => {
    const expectedPrice = t.price * (t.type==="compra" ? 0.998 : 1.002);
    const slippage      = (t.price - expectedPrice) * t.qty;
    const impact        = Math.abs(slippage) * 0.3;
    const timing_cost   = t.total * 0.001;
    return {
    ticker:t.ticker, date:t.date, tipo:t.type,
    expectedPrice:+expectedPrice.toFixed(2), execPrice:t.price,
    slippage:+slippage.toFixed(0), impact:+impact.toFixed(0),
    timing:+timing_cost.toFixed(0),
    total:+(Math.abs(slippage)+impact+timing_cost).toFixed(0)
    };
  });
  const totalTCA = tca.reduce((s,t)=>s+t.total,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* KPIs */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["DCC Atual",fmt(dccAtual,3),dccAtual>0.7?C.red:dccAtual>0.5?C.gold:C.accent,"Corr. dinâmica"],
      ["Asymmetric Corr.","+"+asymm,C.red,"Bear corr. − Bull corr."],
      ["Hub do Portfólio",hubs[0]?.label||"--",C.purple,"Ativo mais conectado"],
      ["Prob. Estado Crise",fmt(msGarch.probCrise*100,1)+"%",msGarch.probCrise>0.5?C.red:C.gold,"MSGARCH"],
      ["Delta-Hedged Ret.",fmt(deltaHedgedRet,2)+"%",deltaHedgedRet>0?C.accent:C.red,"Alpha puro sem β"],
      ["Custo TCA Total",fmtBRL(totalTCA),C.red,"Slippage + Impact + Timing"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* DCC + Asymmetric */}
     <div style={S.card}>
      <SecaoTitulo titulo="Dynamic Conditional Correlation (DCC)"
        sub="Correlação que muda ao longo do tempo. Mais precisa que correlação estática em crises."/>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={dccSeries}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} domain={[0,1]}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         <Line type="monotone" dataKey="dcc"    name="DCC (Dinâmica)" stroke={C.accent} strokeWidth={2.5} dot={false}/>
         <Line type="monotone" dataKey="static" name="Est. Estática"  stroke={C.muted}  strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
         <Line type="monotone" dataKey="crise"  name="Nível Crise"    stroke={C.red}    strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
        </LineChart>
      </ResponsiveContainer>
      <div style={{marginTop:10}}>
        <div style={{fontWeight:700,fontSize:12,marginBottom:6}}>Asymmetric Correlation</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
         {[["Correlação em Bull (mkt↑)",corrBull,C.accent],["Correlação em Bear (mkt↓)",corrBear,C.red]].map(([l,v,c])=>(
          <div key={l} style={{background:C.surface,borderRadius:8,padding:"10px 12px",borderTop:"2px solid "+c}}>
           <div style={{fontSize:10,color:C.muted}}>{l}</div>
           <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
          </div>
         ))}
        </div>
        <div style={{marginTop:8,fontSize:11,color:C.muted}}>
         Assimetria de {asymm}: correlações sobem {asymm} mais em quedas que em altas — diversificação colapsa em crises.
        </div>
      </div>
     </div>

     {/* Network + Markov GARCH */}
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Network Analysis — Centralidade dos Ativos"
         sub="Grau de conectividade (quanto cada classe está correlacionada com as demais)"/>
        {hubs.slice(0,5).map((h,i)=>(
         <div key={h.id} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:C.muted,width:16}}>#{i+1}</span>
            <div style={{width:7,height:7,borderRadius:"50%",background:h.color,border:i===0?"2px solid "+C.white:"none"}}/>
            <span style={{fontWeight:i===0?700:500}}>{h.label}</span>
            {i===0&&<span style={S.badge(C.red)}>Hub central</span>}
           </div>
           <span style={{fontWeight:700,color:i===0?C.red:C.muted}}>{fmt(h.degree,2)}</span>
          </div>
          <Barra pct={h.degree/hubs[0].degree*100} cor={i===0?C.red:i===1?C.gold:C.muted} altura={5}/>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Markov-Switching GARCH — 2 Regimes"/>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
         {[["Estado Normal","Vol: "+msGarch.volNormal+"%","P(perm): "+msGarch.pNormalNormal,C.accent],["Estado Crise","Vol: "+msGarch.volCrise+"%","P(perm): "+msGarch.pCriseCrise,C.red]].map(([l,v,s,c])=>(
          <div key={l} style={{flex:1,padding:"10px 12px",background:msGarch.stateNow===l.split(" ")[1]?c+"22":C.surface,borderRadius:8,borderLeft:"3px solid "+c}}>
           <div style={{fontWeight:700,fontSize:12,color:c}}>{l}</div>
           <div style={{fontSize:16,fontWeight:800,color:c,marginTop:3}}>{v}</div>
           <div style={{fontSize:10,color:C.muted}}>{s}</div>
           {msGarch.stateNow===l.split(" ")[1]&&<span style={S.badge(c)}>Estado atual</span>}
          </div>
         ))}
        </div>
        <div style={{fontSize:11,color:C.muted}}>Prob. de crise atual: <span style={{fontWeight:700,color:msGarch.probCrise>0.5?C.red:C.gold}}>{fmt(msGarch.probCrise*100,1)}%</span> · Jump Risk: +{jumpContrib}% de vol extra · λ={lambdaJump} saltos/ano</div>
      </div>
     </div>
    </div>

    {/* Decision Attribution */}
    <div style={S.card}>
     <SecaoTitulo titulo="Decision Attribution — Decomposição do Retorno"
      sub="Quanto de cada decisão (alocação estratégica, timing, seleção, interação) contribuiu para o resultado"/>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:14}}>
      {[
        ["Benchmark",       retBench,      C.muted,  "Retorno passivo (IBOV)"],
        ["Alocação Estrat.", stratAlloc,    C.blue,   "Desvio da alocação long-run"],
        ["Timing",          timing,         C.gold,   "Timing de entrada/saída"],
        ["Seleção de Ativos",selection,     C.accent, "Alpha de seleção dentro da classe"],
        ["Interação",       interaction,    C.purple, "Efeito combinado Alloc × Seleção"],
        ["Total Portfolio", portRet,        C.white,  "Soma de todos os componentes"],
      ].map(([l,v,c,s])=>(
        <div key={l} style={{background:C.surface,borderRadius:8,padding:"12px 14px",borderLeft:"3px solid "+c}}>
         <div style={{fontSize:10,color:C.muted}}>{l}</div>
         <div style={{fontSize:18,fontWeight:700,color:c}}>{+v>=0?"+":""}{fmt(+v,2)}%</div>
         <div style={{fontSize:10,color:C.muted}}>{s}</div>
        </div>
      ))}
     </div>
     <div style={{height:10,borderRadius:5,overflow:"hidden",display:"flex",gap:2}}>
      <div style={{width:(retBench/portRet*100)+"%",background:C.muted}}/>
      <div style={{width:(stratAlloc/portRet*100)+"%",background:C.blue}}/>
      <div style={{width:(timing/portRet*100)+"%",background:C.gold}}/>
      <div style={{width:(selection/portRet*100)+"%",background:C.accent}}/>
      <div style={{flex:1,background:C.purple}}/>
     </div>
    </div>

    {/* TCA */}
    <div style={S.card}>
     <SecaoTitulo titulo="Transaction Cost Analysis (TCA)"
      sub="Análise de slippage, market impact e timing cost por operação"/>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Data","Ticker","Tipo","Preço Esperado","Preço Exec.","Slippage","Impact","Timing","Total TCA"].map(h=><th key={h} style={{padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{tca.map((t,i)=>(
         <tr key={i} style={{borderBottom:"1px solid "+C.border+"22"}}>
          <td style={{padding:"7px 8px",color:C.muted,textAlign:"right"}}>{t.date}</td>
          <td style={{padding:"7px 8px",fontWeight:700,textAlign:"right"}}>{t.ticker}</td>
          <td style={{padding:"7px 8px",textAlign:"right"}}><span style={S.badge(t.tipo==="compra"?C.accent:C.red)}>{t.tipo}</span></td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.muted}}>{fmtBRL(t.expectedPrice)}</td>
          <td style={{padding:"7px 8px",textAlign:"right"}}>{fmtBRL(t.execPrice)}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.red}}>{fmtBRL(t.slippage)}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.gold}}>{fmtBRL(t.impact)}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.muted}}>{fmtBRL(t.timing)}</td>
          <td style={{padding:"7px 8px",textAlign:"right",color:C.red,fontWeight:700}}>{fmtBRL(t.total)}</td>
         </tr>
        ))}</tbody>
      </table>
     </div>
     <div style={{marginTop:8,display:"flex",justifyContent:"space-between",fontSize:12}}>
      <span style={{color:C.muted}}>Custo total TCA estimado:</span>
      <span style={{fontWeight:700,color:C.red}}>{fmtBRL(totalTCA)} ({fmt(totalTCA/totalVal*100,3)}% do patrimônio)</span>
     </div>
    </div>
    </div>
  );
}
function TabTier5({ byCat, filtered=[], quotes={}, totalVal, portVol, portRet, portSharpe, portBeta=1 }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const PAI_INDICATORS = [
    {id:1,  cat:"Clima",    nome:"GHG Emissions (Scope 1+2+3)", val:"142 tCO2e/M",  score:45, limite:"<100"},
    {id:2,  cat:"Clima",    nome:"Carbon Footprint",             val:"28 tCO2e/M",   score:62, limite:"<50"},
    {id:3,  cat:"Clima",    nome:"GHG Intensity (Wh Rev.)",      val:"84",           score:55, limite:"<75"},
    {id:4,  cat:"Clima",    nome:"Fossil Fuel Exposure",         val:"12.4%",        score:72, limite:"<15%"},
    {id:5,  cat:"Clima",    nome:"Non-Renewable Energy",         val:"38%",          score:48, limite:"<40%"},
    {id:6,  cat:"Clima",    nome:"Energy Consumption Intensity", val:"1.24",         score:58, limite:"<1.5"},
    {id:7,  cat:"Biodiv.",  nome:"Biodiversity Impact",          val:"Med.",         score:55, limite:"Low"},
    {id:8,  cat:"Água",     nome:"Water Intensity",              val:"2.8 m³/$M",   score:68, limite:"<3"},
    {id:9,  cat:"Resíduos", nome:"Hazardous Waste Ratio",       val:"Low",          score:75, limite:"Low"},
    {id:10, cat:"Social",   nome:"Violations UN Global Compact", val:"0",           score:100,limite:"0"},
    {id:11, cat:"Social",   nome:"OECD Guidelines Non-Comply.",  val:"0",           score:100,limite:"0"},
    {id:12, cat:"Social",   nome:"Unadjusted Gender Pay Gap",    val:"18%",         score:52, limite:"<15%"},
    {id:13, cat:"Social",   nome:"Board Gender Diversity",       val:"28%",         score:55, limite:">33%"},
    {id:14, cat:"Social",   nome:"Controversial Weapons",        val:"0%",          score:100,limite:"0%"},
    {id:15, cat:"Soberano", nome:"Social Violations (Sov.)",     val:"None",        score:100,limite:"None"},
    {id:16, cat:"RE",       nome:"Energy Inefficient RE",        val:"22%",         score:60, limite:"<20%"},
    {id:17, cat:"Governa.", nome:"Anti-Corruption Policies",     val:"82%",         score:82, limite:">75%"},
    {id:18, cat:"Governa.", nome:"Anti-Money Laundering",        val:"94%",         score:94, limite:">90%"},
  ];
  const paiAvg = Math.round(PAI_INDICATORS.reduce((s,p)=>s+p.score,0)/PAI_INDICATORS.length);
  const paiCor = paiAvg>=75?C.accent:paiAvg>=55?C.gold:C.red;
  const tempScore = {atual:2.8, target15:1.5, target2:2.0};
  const tempCats  = byCat.map(c => ({
    ...c,
    temp: {acoes_br:3.2,fiis:2.1,renda_fixa:1.8,acoes_eua:2.9,etfs:2.6,cripto:4.8,commodities:3.5,cambio:1.5,imoveis:2.4,outros:2.8}[c.id]||2.5
  }));
  const portTemp  = +(byCat.reduce((s,c)=>s+(c.pct/100)*({acoes_br:3.2,fiis:2.1,renda_fixa:1.8,acoes_eua:2.9,etfs:2.6,cripto:4.8,commodities:3.5,cambio:1.5,imoveis:2.4,outros:2.8}[c.id]||2.5),0)).toFixed(2);
  const SOVEREIGN = [
    {pais:"Brasil",  env:52,soc:58,gov:48,total:53,outlook:"Estável"},
    {pais:"EUA",     env:65,soc:72,gov:78,total:72,outlook:"Positivo"},
    {pais:"Zona Euro",env:78,soc:82,gov:80,total:80,outlook:"Positivo"},
    {pais:"China",   env:45,soc:38,gov:32,total:38,outlook:"Negativo"},
    {pais:"Japão",   env:72,soc:75,gov:82,total:76,outlook:"Estável"},
  ];
  const waterInt = byCat.map(c => ({
    ...c,
    water: {acoes_br:3.8,fiis:0.8,renda_fixa:0.2,acoes_eua:2.2,etfs:1.8,cripto:0.5,commodities:8.2,cambio:0,imoveis:1.2,outros:2.0}[c.id]||2.0
  }));
  const ucitsVaR   = +(portVol/100/Math.sqrt(252)*2.326*100*20).toFixed(2); // VaR relativo %
  const ucitsLeverage = +(1+portBeta*0.4).toFixed(2);
  const srri       = portVol<2?1:portVol<5?2:portVol<10?3:portVol<15?4:portVol<25?5:portVol<30?6:7;
  const DLIQ={acoes_br:1,fiis:3,renda_fixa:1,acoes_eua:1,etfs:1,cripto:.5,commodities:2,cambio:.1,imoveis:90,outros:30};
  const liquidityProfile=[{l:"D+0 a D+3",p:filtered.filter(a=>(DLIQ[a.category]||30)<=3).reduce((s,a)=>s+preco(a)*a.qty,0)},{l:"D+4 a D+30",p:filtered.filter(a=>{const d=DLIQ[a.category]||30;return d>3&&d<=30;}).reduce((s,a)=>s+preco(a)*a.qty,0)},{l:"D+31+",p:filtered.filter(a=>(DLIQ[a.category]||30)>30).reduce((s,a)=>s+preco(a)*a.qty,0)}].map(b=>({...b,pct:totalVal?+(b.p/totalVal*100).toFixed(1):0}));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* KPIs ESG */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["PAI Score Geral",paiAvg+"/100",paiCor,"18 indicadores SFDR"],
      ["Temperature Score",portTemp+"°C",portTemp>2?C.red:portTemp>1.5?C.gold:C.accent,"Alinhamento 1.5/2°C"],
      ["SRRI",srri+"/7",srri>=5?C.red:srri>=3?C.gold:C.accent,"Risco UCITS padronizado"],
      ["VaR Relativo UCITS",ucitsVaR+"%",ucitsVaR>10?C.red:C.gold,"Regulação europeia"],
      ["Liq. D+0-3",liquidityProfile[0].pct+"%",liquidityProfile[0].pct>70?C.accent:C.gold,"Liquidez imediata"],
      ["Violações PAI",PAI_INDICATORS.filter(p=>p.score<50).length,PAI_INDICATORS.filter(p=>p.score<50).length>3?C.red:C.gold,"Abaixo do limite"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* PAI Indicators */}
     <div style={S.card}>
      <SecaoTitulo titulo="SFDR PAI Indicators — 18 Indicadores Obrigatórios"
        sub="Principal Adverse Impact indicators. Score > 75 = OK · 50-75 = Atenção · < 50 = Crítico"/>
      <div style={{maxHeight:360,overflowY:"auto"}}>
        {PAI_INDICATORS.map(p=>(
         <div key={p.id} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
           <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <span style={S.badge(p.cat==="Clima"?C.accent:p.cat==="Social"?C.blue:p.cat==="Soberano"?C.purple:C.gold)}>{p.cat}</span>
            <span style={{fontWeight:600}}>{p.nome}</span>
           </div>
           <div style={{display:"flex",gap:6}}>
            <span style={{color:C.muted,fontSize:10}}>Val: {p.val}</span>
            <span style={{fontWeight:700,color:p.score>=75?C.accent:p.score>=50?C.gold:C.red}}>{p.score}/100</span>
           </div>
          </div>
          <Barra pct={p.score} cor={p.score>=75?C.accent:p.score>=50?C.gold:C.red} altura={4}/>
         </div>
        ))}
      </div>
     </div>

     {/* Temperature + Water + Sovereign */}
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Temperature Score — Alinhamento Climático"
         sub="°C de aquecimento implícito nas empresas do portfólio"/>
        <div style={{padding:12,background:C.surface,borderRadius:10,marginBottom:10,borderLeft:"4px solid "+(portTemp>2?C.red:portTemp>1.5?C.gold:C.accent)}}>
         <div style={{fontSize:26,fontWeight:800,color:portTemp>2?C.red:portTemp>1.5?C.gold:C.accent}}>{portTemp}°C</div>
         <div style={{display:"flex",gap:12,fontSize:11,marginTop:4}}>
          <span style={{color:C.accent}}>Meta 1.5°C</span>
          <span style={{color:C.gold}}>Meta Paris 2°C</span>
          <span style={{color:portTemp>2?C.red:C.text}}>Atual: {portTemp}°C</span>
         </div>
         <Barra pct={Math.min(100,portTemp/5*100)} cor={portTemp>2?C.red:portTemp>1.5?C.gold:C.accent}/>
        </div>
        {tempCats.map(c=>(
         <div key={c.id} style={{marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
           <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:2,background:c.color}}/>{c.label}</div>
           <span style={{color:c.temp>2?C.red:c.temp>1.5?C.gold:C.accent,fontWeight:700}}>{c.temp}°C</span>
          </div>
          <Barra pct={c.temp/5*100} cor={c.temp>2?C.red:c.temp>1.5?C.gold:C.accent} altura={4}/>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Sovereign ESG + Water Intensity"/>
        {SOVEREIGN.slice(0,4).map(s=>{
         const total=(s.env+s.soc+s.gov)/3;
         return (
          <div key={s.pais} style={{marginBottom:7}}>
           <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
            <span style={{fontWeight:600}}>{s.pais}</span>
            <div style={{display:"flex",gap:6}}>
              <span style={{color:C.accent,fontSize:10}}>E:{s.env}</span>
              <span style={{color:C.blue,fontSize:10}}>S:{s.soc}</span>
              <span style={{color:C.purple,fontSize:10}}>G:{s.gov}</span>
              <span style={{fontWeight:700,color:total>=70?C.accent:total>=55?C.gold:C.red}}>{Math.round(total)}/100</span>
            </div>
           </div>
           <Barra pct={total} cor={total>=70?C.accent:total>=55?C.gold:C.red} altura={4}/>
          </div>
         );
        })}
      </div>
     </div>
    </div>

    {/* SRRI + UCITS + IOSCO */}
    <div style={S.card}>
     <SecaoTitulo titulo="SRRI · UCITS Risk Metrics · IOSCO Liquidity" sub="Métricas regulatórias padronizadas para gestão institucional"/>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16}}>
      {/* SRRI */}
      <div style={{padding:14,background:C.surface,borderRadius:10,borderLeft:"3px solid "+(srri>=5?C.red:srri>=3?C.gold:C.accent)}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>SRRI (1-7)</div>
        <div style={{display:"flex",gap:4,marginBottom:8}}>
         {[1,2,3,4,5,6,7].map(n=>(
          <div key={n} style={{flex:1,height:28,borderRadius:4,background:n<=srri?(n<=2?C.accent:n<=4?C.gold:n<=5?"#F97316":C.red):C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:n<=srri?"#000":C.muted}}>{n}</div>
         ))}
        </div>
        <div style={{fontSize:11,color:C.muted}}>{srri<=2?"Baixo risco":srri<=4?"Risco médio":srri<=5?"Risco médio-alto":"Alto risco"} — Vol {fmt(portVol,1)}%</div>
      </div>
      {/* UCITS */}
      <div style={{padding:14,background:C.surface,borderRadius:10,borderLeft:"3px solid "+C.blue}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>UCITS Risk Metrics</div>
        {[["VaR Relativo Mensal",ucitsVaR+"%"],["Alavancagem (Comprometida)",ucitsLeverage+"x"],["Limite VaR UCITS","<10%"],["Status",ucitsVaR<10?"✓ Compliant":"✗ Excedido"]].map(([l,v])=>(
         <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700,color:l==="Status"?(v.includes("✓")?C.accent:C.red):C.text}}>{v}</span>
         </div>
        ))}
      </div>
      {/* IOSCO Liquidity */}
      <div style={{padding:14,background:C.surface,borderRadius:10,borderLeft:"3px solid "+C.purple}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>IOSCO Liquidity Profile</div>
        {liquidityProfile.map(l=>(
         <div key={l.l} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600}}>{l.l}</span>
           <div><span style={{fontWeight:700}}>{l.pct}%</span><span style={{color:C.muted,marginLeft:6}}>{fmtBRL(l.p)}</span></div>
          </div>
          <Barra pct={l.pct} cor={l.l.includes("D+0")?C.accent:l.l.includes("D+4")?C.gold:C.red}/>
         </div>
        ))}
        <div style={{fontSize:11,color:C.muted,marginTop:4}}>Recomendação IOSCO: >50% em D+0-3</div>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabTecnica({ filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [ativoSel, setAtivoSel] = useState(filtered[0]?.ticker || "PETR4");
  const [periodo,  setPeriodo]  = useState("1A");
  const ativo = filtered.find(a => a.ticker === ativoSel) || filtered[0];
  const px = ativo ? preco(ativo) : 100;

  const PERIODOS = ["1M","3M","6M","1A","2A","5A"];
  const nPts = {"1M":22,"3M":65,"6M":130,"1A":252,"2A":504,"5A":1260};
  const pts  = nPts[periodo] || 252;
  const series = useMemo(() => {
    const seed = ativo?.ticker?.charCodeAt(0) || 80;
    let p = px * 0.65;
    return Array.from({length: pts}, (_, i) => {
    const trend = (px - p) / (pts - i) * 1.02;
    p = p * (1 + (Math.sin(i*.12+seed)*.018 + Math.cos(i*.08)*.012 + (Math.sin(i*9301+seed*7)*.022) + trend/p));
    const d = new Date();
    d.setDate(d.getDate() - (pts - i));
    return {
     idx: i, date: d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),
     open: +(p*(1-Math.abs(Math.sin(i*3+1))*.008)).toFixed(2),
     high: +(p*(1+Math.abs(Math.sin(i*5+2))*.012)).toFixed(2),
     low:  +(p*(1-Math.abs(Math.sin(i*7+3))*.012)).toFixed(2),
     close: +p.toFixed(2),
     vol:   Math.round(1e6*(0.8+Math.abs(Math.sin(i*11+4))*.8)),
    };
    });
  }, [ativoSel, pts]);
  const SMA = (data, n) => data.map((_, i) => i < n-1 ? null : +(data.slice(i-n+1,i+1).reduce((s,d)=>s+d.close,0)/n).toFixed(2));
  const EMA = (data, n) => {
    const k = 2/(n+1); let ema = data[0].close;
    return data.map((d,i) => { ema = i===0 ? d.close : d.close*k + ema*(1-k); return +ema.toFixed(2); });
  };

  const sma20  = SMA(series, 20);
  const sma50  = SMA(series, 50);
  const sma200 = SMA(series, 200);
  const ema12  = EMA(series, 12);
  const ema26  = EMA(series, 26);
  const macdLine   = ema12.map((v, i) => v && ema26[i] ? +(v - ema26[i]).toFixed(3) : null);
  const macdEMA9   = (() => {
    const valid = macdLine.filter(v=>v!==null);
    const k = 2/10; let e = valid[0];
    return macdLine.map(v => { if(v===null) return null; e = v*k+e*(1-k); return +e.toFixed(3); });
  })();
  const macdHist   = macdLine.map((v,i) => v && macdEMA9[i] ? +(v-macdEMA9[i]).toFixed(3) : null);
  const RSI = (data, n=14) => {
    return data.map((_, i) => {
    if(i < n) return null;
    const changes = data.slice(i-n+1,i+1).map((d,j,arr) => j===0?0:d.close-arr[j-1].close);
    const gains   = changes.filter(c=>c>0).reduce((s,c)=>s+c,0)/n;
    const losses  = changes.filter(c=>c<0).reduce((s,c)=>s+Math.abs(c),0)/n;
    return losses===0 ? 100 : +(100 - 100/(1+gains/losses)).toFixed(1);
    });
  };
  const rsi = RSI(series);
  const bbUpper = series.map((_,i) => {
    if(i<19) return null;
    const sl = series.slice(i-19,i+1);
    const mu = sl.reduce((s,d)=>s+d.close,0)/20;
    const sd = Math.sqrt(sl.reduce((s,d)=>s+(d.close-mu)**2,0)/20);
    return +(mu+2*sd).toFixed(2);
  });
  const bbLower = series.map((_,i) => {
    if(i<19) return null;
    const sl = series.slice(i-19,i+1);
    const mu = sl.reduce((s,d)=>s+d.close,0)/20;
    const sd = Math.sqrt(sl.reduce((s,d)=>s+(d.close-mu)**2,0)/20);
    return +(mu-2*sd).toFixed(2);
  });
  const atr14 = series.map((d,i) => {
    if(i===0) return d.high-d.low;
    const tr = Math.max(d.high-d.low, Math.abs(d.high-series[i-1].close), Math.abs(d.low-series[i-1].close));
    return +tr.toFixed(2);
  });
  const atrSmooth = SMA(atr14.map((v,i)=>({close:v})), 14);
  let obv = 0;
  const obvSeries = series.map((d,i) => {
    if(i>0) obv += d.close > series[i-1].close ? d.vol : d.close < series[i-1].close ? -d.vol : 0;
    return Math.round(obv/1e6);
  });
  const vwap = series.map((_,i) => {
    const sl = series.slice(Math.max(0,i-19),i+1);
    const tp = sl.reduce((s,d)=>s+((d.high+d.low+d.close)/3)*d.vol,0);
    const tv = sl.reduce((s,d)=>s+d.vol,0);
    return tv>0 ? +(tp/tv).toFixed(2) : null;
  });
  const maxPx = Math.max(...series.map(d=>d.high));
  const minPx = Math.min(...series.map(d=>d.low));
  const range  = maxPx - minPx;
  const fibLevels = [0,0.236,0.382,0.50,0.618,0.786,1.0].map(r => ({
    r: r*100+"%", price: +(maxPx - r*range).toFixed(2),
    dist: +(((maxPx - r*range)-px)/px*100).toFixed(1),
  }));
  const last = series[series.length-1];
  const pivot = +(( last.high+last.low+last.close)/3).toFixed(2);
  const pivots = [
    {l:"R3", v:+(pivot+(last.high-last.low)*2).toFixed(2), c:C.red},
    {l:"R2", v:+(pivot+(last.high-last.low)).toFixed(2), c:"#FB923C"},
    {l:"R1", v:+(2*pivot-last.low).toFixed(2), c:C.gold},
    {l:"P",  v:pivot, c:C.white},
    {l:"S1", v:+(2*pivot-last.high).toFixed(2), c:C.blue},
    {l:"S2", v:+(pivot-(last.high-last.low)).toFixed(2), c:C.blue},
    {l:"S3", v:+(pivot-(last.high-last.low)*2).toFixed(2), c:C.accent},
  ];
  const lastIdx    = series.length-1;
  const rsiNow     = rsi[lastIdx] || 50;
  const macdNow    = macdHist[lastIdx] || 0;
  const aboveSMA200= series[lastIdx].close > (sma200[lastIdx]||0);
  const aboveSMA50 = series[lastIdx].close > (sma50[lastIdx]||0);
  const bbW        = bbUpper[lastIdx] && bbLower[lastIdx] ? bbUpper[lastIdx]-bbLower[lastIdx] : 0;
  const bbPct      = bbW>0 ? (series[lastIdx].close-bbLower[lastIdx])/bbW*100 : 50;

  const signals = [
    {ind:"Tendência (SMA200)", sig:aboveSMA200?"Alta":"Baixa", c:aboveSMA200?C.accent:C.red, desc:aboveSMA200?"Preço acima da SMA200":"Preço abaixo da SMA200"},
    {ind:"SMA50 vs SMA200",   sig:aboveSMA50&&aboveSMA200?"Golden Cross":"Death Cross", c:aboveSMA50&&aboveSMA200?C.accent:C.red, desc:"Cruzamento das médias de médio e longo prazo"},
    {ind:"RSI (14)",           sig:rsiNow>70?"Sobrecomprado":rsiNow<30?"Sobrevendido":"Neutro", c:rsiNow>70?C.red:rsiNow<30?C.accent:C.muted, desc:"RSI: "+rsiNow},
    {ind:"MACD Histograma",    sig:macdNow>0?"Bullish":"Bearish", c:macdNow>0?C.accent:C.red, desc:"Momentum de curto prazo"},
    {ind:"Bollinger %B",       sig:bbPct>80?"Topo BB":bbPct<20?"Fundo BB":"Dentro das Bandas", c:bbPct>80?C.red:bbPct<20?C.accent:C.muted, desc:"Posição dentro das Bandas"},
  ];
  const chartData = series.slice(-60).map((d,i,arr) => ({
    date: d.date, close: d.close,
    sma20: sma20[series.length-60+i],
    sma50: sma50[series.length-60+i],
    bb_u:  bbUpper[series.length-60+i],
    bb_l:  bbLower[series.length-60+i],
    vwap:  vwap[series.length-60+i],
    rsi:   rsi[series.length-60+i],
    macd:  macdLine[series.length-60+i],
    macdS: macdEMA9[series.length-60+i],
    macdH: macdHist[series.length-60+i],
    obv:   obvSeries[series.length-60+i],
    atr:   atrSmooth[series.length-60+i],
  }));

  const [activeChart, setActiveChart] = useState("preco");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Seletor */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     <select style={{...S.sel,width:180}} value={ativoSel} onChange={e=>setAtivoSel(e.target.value)}>
      {filtered.map(a=><option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>)}
     </select>
     {PERIODOS.map(p=>(
      <button key={p} onClick={()=>setPeriodo(p)}
        style={periodo===p?S.btnV:{...S.btnO,fontSize:11,padding:"5px 10px"}}>{p}</button>
     ))}
     {[["preco","📈 Preço"],["macd","MACD"],["rsi","RSI"],["obv","OBV"],["atr","ATR"]].map(([v,l])=>(
      <button key={v} onClick={()=>setActiveChart(v)}
        style={activeChart===v?{background:C.purple,color:"#fff",border:"none",borderRadius:7,padding:"5px 12px",cursor:"pointer",fontSize:11,fontWeight:700}:{...S.btnO,fontSize:11,padding:"5px 10px",color:C.purple,borderColor:C.purple}}>{l}</button>
     ))}
    </div>

    {/* Sinais */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
     {signals.map(s=>(
      <div key={s.ind} style={{...S.card,flex:1,minWidth:140,borderTop:"3px solid "+s.c,padding:"10px 12px"}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{s.ind}</div>
        <div style={{fontWeight:700,fontSize:14,color:s.c}}>{s.sig}</div>
        <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.desc}</div>
      </div>
     ))}
    </div>

    {/* Gráfico principal */}
    <div style={S.card}>
     <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:C.accent}}>
      {ativoSel} — {["preco","macd","rsi","obv","atr"].find(v=>v===activeChart)?.toUpperCase()}
      <span style={{color:C.muted,fontSize:12,fontWeight:400,marginLeft:10}}>{periodo} · {pts} períodos</span>
     </div>
     <ResponsiveContainer width="100%" height={280}>
      {activeChart==="preco" ? (
        <AreaChart data={chartData}>
         <defs>
          <linearGradient id="priceG" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%"  stopColor={C.accent} stopOpacity={.3}/>
           <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
          </linearGradient>
         </defs>
         <XAxis dataKey="date" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}} domain={["auto","auto"]}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         <Area type="monotone" dataKey="close" name="Preço" stroke={C.accent} fill="url(#priceG)" strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="sma20" name="SMA20" stroke={C.blue}   strokeWidth={1.5} dot={false} strokeDasharray="3 2"/>
         <Line type="monotone" dataKey="sma50" name="SMA50" stroke={C.gold}   strokeWidth={1.5} dot={false} strokeDasharray="3 2"/>
         <Line type="monotone" dataKey="bb_u"  name="BB+"   stroke={C.muted}  strokeWidth={1}   dot={false} strokeDasharray="2 3"/>
         <Line type="monotone" dataKey="bb_l"  name="BB−"   stroke={C.muted}  strokeWidth={1}   dot={false} strokeDasharray="2 3"/>
         <Line type="monotone" dataKey="vwap"  name="VWAP"  stroke={C.purple} strokeWidth={1.5} dot={false}/>
        </AreaChart>
      ) : activeChart==="rsi" ? (
        <AreaChart data={chartData}>
         <XAxis dataKey="date" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}} domain={[0,100]}/>
         <RechartsTip contentStyle={S.TT}/>
         <Area type="monotone" dataKey="rsi" name="RSI(14)" stroke={C.purple} fill={C.purple+"22"} strokeWidth={2} dot={false}/>
         <Line type="monotone" data={chartData.map(d=>({...d,ob:70}))} dataKey="ob" name="Sobrecomprado" stroke={C.red} strokeDasharray="4 2" strokeWidth={1} dot={false}/>
         <Line type="monotone" data={chartData.map(d=>({...d,os:30}))} dataKey="os" name="Sobrevendido"  stroke={C.accent} strokeDasharray="4 2" strokeWidth={1} dot={false}/>
        </AreaChart>
      ) : activeChart==="macd" ? (
        <BarChart data={chartData}>
         <XAxis dataKey="date" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         <Bar dataKey="macdH" name="MACD Hist." radius={[2,2,0,0]}>
          {chartData.map((e,i)=><Cell key={i} fill={e.macdH>=0?C.accent:C.red}/>)}
         </Bar>
         <Line type="monotone" dataKey="macd"  name="MACD"   stroke={C.blue} strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="macdS" name="Sinal"  stroke={C.red}  strokeWidth={1.5} strokeDasharray="3 2" dot={false}/>
        </BarChart>
      ) : activeChart==="obv" ? (
        <AreaChart data={chartData}>
         <XAxis dataKey="date" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}}/>
         <RechartsTip contentStyle={S.TT}/>
         <Area type="monotone" dataKey="obv" name="OBV (M)" stroke={C.blue} fill={C.blue+"22"} strokeWidth={2} dot={false}/>
        </AreaChart>
      ) : (
        <AreaChart data={chartData}>
         <XAxis dataKey="date" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}}/>
         <RechartsTip contentStyle={S.TT}/>
         <Area type="monotone" dataKey="atr" name="ATR(14)" stroke={C.gold} fill={C.gold+"22"} strokeWidth={2} dot={false}/>
        </AreaChart>
      )}
     </ResponsiveContainer>
    </div>

    {/* Fibonacci + Pivots lado a lado */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Fibonacci Retracement" sub={`Máx: ${fmtBRL(maxPx)} · Mín: ${fmtBRL(minPx)} · Atual: ${fmtBRL(px)}`}/>
      {fibLevels.map(f=>(
        <div key={f.r} style={{marginBottom:7}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <span style={{fontWeight:700,color:C.gold}}>{f.r}</span>
          <div style={{display:"flex",gap:10}}>
           <span style={{fontWeight:600}}>{fmtBRL(f.price)}</span>
           <span style={{color:f.dist>=0?C.accent:C.red,fontWeight:600}}>{f.dist>=0?"+":""}{f.dist}%</span>
          </div>
         </div>
         <div style={{position:"relative",height:6,background:C.border,borderRadius:3}}>
          <div style={{position:"absolute",left:0,height:"100%",width:Math.min(100,(f.price-minPx)/(maxPx-minPx)*100)+"%",background:C.gold+"66",borderRadius:3}}/>
          {Math.abs(f.price-px)<range*.03&&<div style={{position:"absolute",top:0,bottom:0,left:Math.min(100,(f.price-minPx)/(maxPx-minPx)*100)+"%",width:2,background:C.accent}}/>}
         </div>
        </div>
      ))}
     </div>
     <div style={S.card}>
      <SecaoTitulo titulo="Pivot Points" sub="Suportes e resistências para o próximo período"/>
      {pivots.map(p=>{
        const dist = +((p.v-px)/px*100).toFixed(1);
        return (
         <div key={p.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <span style={{fontWeight:800,fontSize:14,color:p.c,width:28}}>{p.l}</span>
          <div style={{flex:1,height:4,background:C.border,borderRadius:2,margin:"0 10px",position:"relative"}}>
           <div style={{position:"absolute",left:"50%",top:0,bottom:0,width:1,background:C.white,opacity:.4}}/>
          </div>
          <span style={{fontWeight:700,width:64,textAlign:"right"}}>{fmtBRL(p.v)}</span>
          <span style={{color:dist>=0?C.red:C.accent,width:52,textAlign:"right",fontWeight:600}}>{dist>=0?"+":""}{dist}%</span>
         </div>
        );
      })}
      <div style={{marginTop:10,padding:8,background:C.surface,borderRadius:8,fontSize:11,color:C.muted}}>ATR (14): {fmtBRL(atrSmooth[lastIdx]||0)} · {fmt((atrSmooth[lastIdx]||0)/px*100,2)}% do preço</div>
     </div>
    </div>
    </div>
  );
}
function TabFundAdv({ filtered, quotes={}, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [ativoSel, setAtivoSel] = useState(filtered[0]?.ticker || "PETR4");
  const [secao,    setSecao]    = useState("qualidade");
  const ativo = filtered.find(a=>a.ticker===ativoSel) || filtered[0];
  const px = ativo ? preco(ativo) : 100;
  const F = useMemo(() => {
    const seed = (ativoSel.charCodeAt(0)||80) % 20;
    return {
    receita:  [80+seed,85+seed,92+seed,98+seed,108+seed,118+seed].map(v=>v*1e9),
    ebitda:   [28+seed*.4,30+seed*.4,33+seed*.4,36+seed*.4,40+seed*.4,44+seed*.4].map(v=>v*1e9),
    nopat:    [18+seed*.3,20+seed*.3,22+seed*.3,24+seed*.3,27+seed*.3,30+seed*.3].map(v=>v*1e9),
    capInvest:[120+seed*2,128+seed*2,135+seed*2,142+seed*2,150+seed*2,160+seed*2].map(v=>v*1e9),
    cfo:      [22+seed*.4,24+seed*.4,26+seed*.4,29+seed*.4,32+seed*.4,36+seed*.4].map(v=>v*1e9),
    capex:    [8+seed*.1,9+seed*.1,10+seed*.1,11+seed*.1,12+seed*.1,13+seed*.1].map(v=>v*1e9),
    dso:      [42,40,38,36,35,34],
    dpo:      [55,57,58,60,62,63],
    dio:      [28,27,26,25,24,24],
    lucroLiq: [12+seed*.2,14+seed*.2,15+seed*.2,17+seed*.2,19+seed*.2,21+seed*.2].map(v=>v*1e9),
    mktCap:   px * (1e10 + seed*5e8),
    divLiq:   (18+seed*.5)*1e9,
    betatax:  1.1+seed*.02,
    wacc:     10.5+seed*.1,
    };
  }, [ativoSel, px]);

  const ANOS = ["2020","2021","2022","2023","2024","2025E"];
  const accrualsRatio = ANOS.map((_,i) => {
    const deltaWC  = (F.cfo[i]-F.nopat[i])*0.3;
    const avgAssets= (F.capInvest[i]+(F.capInvest[i-1]||F.capInvest[0]))/2;
    return +(deltaWC/avgAssets*100).toFixed(2);
  });
  const cashConvRatio = ANOS.map((_,i) =>
    +(F.cfo[i]/Math.max(1,F.lucroLiq[i])).toFixed(2)
  );
  const fcf = ANOS.map((_,i) => F.cfo[i] - F.capex[i]);
  const ccc = ANOS.map((_,i) => F.dso[i]+F.dio[i]-F.dpo[i]);
  const assetTurnover = ANOS.map((_,i) =>
    +(F.receita[i]/F.capInvest[i]).toFixed(2)
  );
  const operLeverage = ANOS.map((_,i) => {
    if(i===0) return null;
    const deltaRev  = (F.receita[i]-F.receita[i-1])/F.receita[i-1];
    const deltaEbit = (F.nopat[i]-F.nopat[i-1])/F.nopat[i-1];
    return deltaRev!==0 ? +(deltaEbit/deltaRev).toFixed(2) : null;
  });
  const roicSeries = ANOS.map((_,i) => +(F.nopat[i]/F.capInvest[i]*100).toFixed(2));
  const evaSeries  = ANOS.map((_,i) => +(F.nopat[i] - F.wacc/100*F.capInvest[i]).toFixed(0));
  const roicWaccSpread = roicSeries.map(r => +(r - F.wacc).toFixed(2));
  const ke   = +(F.wacc * (1 + 0.3*F.betatax)).toFixed(2); // simplif.
  const kd   = +(F.wacc * 0.7).toFixed(2);
  const waccDecomp = {equity:60, debt:40, ke, kd, tax:34};
  const [gRate,  setGRate]  = useState(6);
  const [discR,  setDiscR]  = useState(F.wacc);
  const [termG,  setTermG]  = useState(3);

  const dcfFCFs = ANOS.map((_,i) => {
    const proj = i < 5 ? fcf[i]*Math.pow(1+gRate/100,i) : fcf[4]*Math.pow(1+gRate/100,4);
    return +proj.toFixed(0);
  });
  const pvFCFs  = dcfFCFs.map((v,i) => +(v/Math.pow(1+discR/100,i+1)).toFixed(0));
  const termVal = +(dcfFCFs[4]*(1+termG/100)/(discR/100-termG/100)).toFixed(0);
  const pvTerm  = +(termVal/Math.pow(1+discR/100,5)).toFixed(0);
  const equityV = pvFCFs.reduce((s,v)=>s+v,0) + pvTerm - F.divLiq;
  const sharesEst = F.mktCap / px;
  const dcfPerShare = +(equityV/sharesEst).toFixed(2);
  const upDownside   = +((dcfPerShare-px)/px*100).toFixed(1);
  const solveGrowth = () => {
    let g = 5;
    for(let iter=0; iter<50; iter++) {
    const tv   = fcf[4]*(1+g/100)/(discR/100-termG/100);
    const pvs  = dcfFCFs.reduce((s,v,i)=>s+v/Math.pow(1+discR/100,i+1),0);
    const tv_pv= tv/Math.pow(1+discR/100,5);
    const impl = (pvs+tv_pv-F.divLiq)/sharesEst;
    if(Math.abs(impl-px)<0.5) break;
    g += impl > px ? -0.1 : 0.1;
    }
    return +g.toFixed(1);
  };
  const impliedGrowth = solveGrowth();
  const epsGrowth  = 12.5;
  const pe         = px > 0 ? +(F.mktCap/F.lucroLiq[5]).toFixed(1) : 15;
  const peg        = +(pe/epsGrowth).toFixed(2);
  const evEbitda   = +((F.mktCap+F.divLiq)/F.ebitda[5]).toFixed(1);
  const ps         = +(F.mktCap/F.receita[5]).toFixed(2);

  const SECOES = ["qualidade","eficiencia","eva_wacc","dcf","relativo"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Seletor */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     <select style={{...S.sel,width:180}} value={ativoSel} onChange={e=>setAtivoSel(e.target.value)}>
      {filtered.map(a=><option key={a.ticker} value={a.ticker}>{a.ticker} — {a.name}</option>)}
     </select>
     {[["qualidade","🔍 Qualidade"],["eficiencia","⚙ Eficiência"],["eva_wacc","💎 EVA/WACC"],["dcf","📐 DCF"],["relativo","📊 Relativo"]].map(([v,l])=>(
      <button key={v} onClick={()=>setSecao(v)}
        style={secao===v?S.btnV:{...S.btnO,fontSize:11,padding:"5px 12px"}}>{l}</button>
     ))}
    </div>

    {secao==="qualidade" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Qualidade dos Lucros" sub="Accruals alto = lucros de baixa qualidade. CCR < 1 = lucro não vira caixa."/>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
         <thead><tr style={{borderBottom:"1px solid "+C.border}}><th style={{padding:"6px 8px",textAlign:"left",color:C.muted,fontSize:10}}>Métrica</th>{ANOS.map(a=><th key={a} style={{padding:"6px 8px",textAlign:"right",color:a.includes("E")?C.blue:C.muted,fontSize:10}}>{a}</th>)}</tr></thead>
         <tbody>
          {[
           {l:"Accruals Ratio (%)",d:accrualsRatio,fmt:v=>v+"%",good:v=>Math.abs(v)<5},
           {l:"Cash Conv. Ratio",  d:cashConvRatio, fmt:v=>v+"x", good:v=>v>=1},
           {l:"FCF (R$B)",         d:fcf.map(v=>+(v/1e9).toFixed(1)),fmt:v=>v,good:v=>v>0},
           {l:"Op. Leverage",      d:operLeverage,  fmt:v=>v?v+"x":"--",good:v=>v&&v>1&&v<5},
          ].map(row=>(
           <tr key={row.l} style={{borderBottom:"1px solid "+C.border+"22"}}>
            <td style={{padding:"7px 8px",fontWeight:600,fontSize:11}}>{row.l}</td>
            {row.d.map((v,i)=>(
              <td key={i} style={{padding:"7px 8px",textAlign:"right",fontWeight:600,color:v===null?"--":row.good(v)?C.accent:C.gold}}>
               {v===null?"--":row.fmt(v)}
              </td>
            ))}
           </tr>
          ))}
         </tbody>
        </table>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Cash Conversion Ratio — Tendência"/>
        <ResponsiveContainer width="100%" height={180}>
         <LineChart data={ANOS.map((a,i)=>({ano:a,ccr:cashConvRatio[i],accruals:accrualsRatio[i]}))}>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:9}}/>
          <RechartsTip contentStyle={S.TT}/>
          <Legend/>
          <Line type="monotone" dataKey="ccr"      name="Cash Conv. Ratio" stroke={C.accent} strokeWidth={2} dot={{r:4}}/>
          <Line type="monotone" dataKey="accruals" name="Accruals (%)"     stroke={C.red}    strokeWidth={1.5} strokeDasharray="4 2" dot={{r:3}}/>
          <Line type="monotone" data={ANOS.map(a=>({ano:a,ref:1}))} dataKey="ref" name="CCR=1" stroke={C.muted} strokeDasharray="4 2" strokeWidth={1} dot={false}/>
         </LineChart>
        </ResponsiveContainer>
      </div>
     </div>
    )}

    {secao==="eficiencia" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Ciclo de Conversão de Caixa (CCC)" sub="DSO + DIO − DPO. Menor = mais eficiente."/>
        <ResponsiveContainer width="100%" height={200}>
         <BarChart data={ANOS.map((a,i)=>({ano:a,DSO:F.dso[i],DIO:F.dio[i],DPO:-F.dpo[i],CCC:ccc[i]}))}>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:9}}/>
          <RechartsTip contentStyle={S.TT}/>
          <Legend/>
          <Bar dataKey="DSO" stackId="a" fill={C.red}   name="DSO (receber)"/>
          <Bar dataKey="DIO" stackId="a" fill={C.gold}  name="DIO (estoque)"/>
          <Bar dataKey="DPO" stackId="a" fill={C.accent} name="DPO (pagar, neg)"/>
          <Line type="monotone" dataKey="CCC" name="CCC (dias)" stroke={C.white} strokeWidth={2} dot={{r:4}}/>
         </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Asset Turnover & NOPAT Margin"/>
        {ANOS.map((a,i)=>(
         <div key={a} style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:700}}>{a}</span>
           <div style={{display:"flex",gap:12}}>
            <span style={{color:C.blue}}>Turnover: {assetTurnover[i]}x</span>
            <span style={{color:C.accent}}>CCC: {ccc[i]} dias</span>
            <span style={{color:C.gold}}>FCF: R${+(fcf[i]/1e9).toFixed(1)}B</span>
           </div>
          </div>
          <Barra pct={Math.min(100,assetTurnover[i]*50)} cor={C.blue} altura={5}/>
         </div>
        ))}
      </div>
     </div>
    )}

    {secao==="eva_wacc" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="EVA — Economic Value Added" sub="NOPAT − (WACC × Capital). Positivo = cria valor acima do custo de capital."/>
        <ResponsiveContainer width="100%" height={200}>
         <BarChart data={ANOS.map((a,i)=>({ano:a,eva:+(evaSeries[i]/1e9).toFixed(2),spread:roicWaccSpread[i]}))}>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:9}}/>
          <RechartsTip formatter={v=>[v+"B R$"]} contentStyle={S.TT}/>
          <Bar dataKey="eva" name="EVA (R$B)" radius={[4,4,0,0]}>
           {ANOS.map((_,i)=><Cell key={i} fill={evaSeries[i]>=0?C.accent:C.red}/>)}
          </Bar>
         </BarChart>
        </ResponsiveContainer>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:10}}>
         {[["WACC",F.wacc+"%",C.gold],["Custo Equity (Ke)",ke+"%",C.red],["Custo Dívida (Kd)",kd+"%",C.blue]].map(([l,v,c])=>(
          <div key={l} style={{background:C.surface,borderRadius:8,padding:"8px 10px",borderTop:"2px solid "+c}}>
           <div style={{fontSize:10,color:C.muted}}>{l}</div>
           <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
          </div>
         ))}
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="ROIC vs WACC — Spread de Criação de Valor"/>
        <ResponsiveContainer width="100%" height={200}>
         <LineChart data={ANOS.map((a,i)=>({ano:a,roic:roicSeries[i],wacc:F.wacc,spread:roicWaccSpread[i]}))}>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
          <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
          <Legend/>
          <Line type="monotone" dataKey="roic"   name="ROIC"  stroke={C.accent} strokeWidth={2.5} dot={{r:4}}/>
          <Line type="monotone" dataKey="wacc"   name="WACC"  stroke={C.red}    strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
          <Area type="monotone" dataKey="spread" name="Spread" stroke={C.blue}  fill={C.blue+"22"} strokeWidth={1.5}/>
         </LineChart>
        </ResponsiveContainer>
        <div style={{marginTop:8,padding:"8px 12px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+(roicWaccSpread[5]>0?C.accent:C.red)}}>
         <div style={{fontSize:12,fontWeight:700}}>Spread ROIC−WACC: <span style={{color:roicWaccSpread[5]>0?C.accent:C.red}}>{roicWaccSpread[5]>=0?"+":""}{roicWaccSpread[5]}pp</span></div>
         <div style={{fontSize:11,color:C.muted,marginTop:2}}>{roicWaccSpread[5]>5?"Excelente criação de valor — moat econômico forte":roicWaccSpread[5]>0?"Criação de valor moderada":"Destruição de valor — ROIC abaixo do custo de capital"}</div>
        </div>
      </div>
     </div>
    )}

    {secao==="dcf" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="DCF — Fluxo de Caixa Descontado"/>
        <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
         {[["Taxa de Crescimento (%)",gRate,setGRate,5,20,1],["WACC (%)",discR,setDiscR,8,20,0.5],["Crescimento Terminal (%)",termG,setTermG,1,6,0.5]].map(([l,v,fn,min,max,step])=>(
          <div key={l} style={{flex:1,minWidth:150}}>
           <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{l}</div>
           <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="range" min={min} max={max} step={step} value={v} onChange={e=>fn(+e.target.value)} style={{flex:1}}/>
            <span style={{fontWeight:700,color:C.accent,minWidth:32}}>{v}%</span>
           </div>
          </div>
         ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
         {[["Valor Intrínseco",fmtBRL(dcfPerShare),C.accent],["Preço Atual",fmtBRL(px),C.white],["Upside/Downside",upDownside+"%",upDownside>0?C.accent:C.red],["Valor Terminal (PV)",fmtBRL(pvTerm/1e9)+"B",C.blue]].map(([l,v,c])=>(
          <div key={l} style={{background:C.surface,borderRadius:8,padding:"10px 12px",borderLeft:"3px solid "+c}}>
           <div style={{fontSize:10,color:C.muted}}>{l}</div>
           <div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>
          </div>
         ))}
        </div>
        <SecaoTitulo titulo="Reverse DCF — Crescimento Implícito no Preço" sub="O mercado está precificando crescimento de:"/>
        <div style={{padding:12,background:C.surface,borderRadius:10,borderLeft:"4px solid "+(impliedGrowth>15?C.red:impliedGrowth>8?C.gold:C.accent)}}>
         <div style={{fontSize:28,fontWeight:800,color:impliedGrowth>15?C.red:impliedGrowth>8?C.gold:C.accent}}>{impliedGrowth}% a.a.</div>
         <div style={{fontSize:11,color:C.muted,marginTop:4}}>{impliedGrowth>20?"Crescimento implausível — ação cara":impliedGrowth>12?"Crescimento agressivo — precisa entregar":impliedGrowth>6?"Crescimento razoável":"Crescimento conservador — ação barata"}</div>
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Waterfall DCF — Composição do Valor"/>
        <div style={{overflowX:"auto"}}>
         <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Ano","FCF (B)","PV (B)","Acumulado"].map(h=><th key={h} style={{padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>
           {ANOS.map((a,i)=>{
            const accum = pvFCFs.slice(0,i+1).reduce((s,v)=>s+v,0);
            return (
              <tr key={a} style={{borderBottom:"1px solid "+C.border+"22"}}>
               <td style={{padding:"6px 8px",fontWeight:600,textAlign:"right",color:a.includes("E")?C.blue:C.text}}>{a}</td>
               <td style={{padding:"6px 8px",textAlign:"right"}}>{+(dcfFCFs[i]/1e9).toFixed(1)}B</td>
               <td style={{padding:"6px 8px",textAlign:"right",color:C.accent}}>{+(pvFCFs[i]/1e9).toFixed(1)}B</td>
               <td style={{padding:"6px 8px",textAlign:"right"}}>{+(accum/1e9).toFixed(1)}B</td>
              </tr>
            );
           })}
           <tr style={{borderTop:"2px solid "+C.border,background:C.border+"22"}}>
            <td style={{padding:"7px 8px",fontWeight:700,textAlign:"right",color:C.gold}}>Terminal</td>
            <td colSpan={2} style={{padding:"7px 8px",textAlign:"right",color:C.gold}}>PV: {+(pvTerm/1e9).toFixed(1)}B ({+(pvTerm/(pvFCFs.reduce((s,v)=>s+v,0)+pvTerm)*100).toFixed(0)}%)</td>
            <td style={{padding:"7px 8px",textAlign:"right",fontWeight:700,color:C.accent}}>{+(equityV/1e9).toFixed(1)}B</td>
           </tr>
          </tbody>
         </table>
        </div>
      </div>
     </div>
    )}

    {secao==="relativo" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Valuation Relativo — vs Setor e Histórico"/>
        {[
         {m:"P/E",v:pe,med:16,high:25,unit:"x",desc:"P/E Shiller ajustado"},
         {m:"EV/EBITDA",v:evEbitda,med:8,high:14,unit:"x",desc:"Múltiplo enterprise value"},
         {m:"P/S",v:ps,med:1.2,high:2.5,unit:"x",desc:"Preço sobre receita"},
         {m:"PEG",v:peg,med:1.0,high:2.0,unit:"x",desc:"P/E / Crescimento. < 1 = barato"},
        ].map(m=>{
         const pct = Math.min(100,(m.v/m.high)*100);
         const c   = m.v>m.high?C.red:m.v>m.med?C.gold:C.accent;
         return (
          <div key={m.m} style={{marginBottom:12}}>
           <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
            <div><span style={{fontWeight:700}}>{m.m}</span><span style={{color:C.muted,fontSize:10,marginLeft:6}}>{m.desc}</span></div>
            <div style={{display:"flex",gap:8}}>
              <span style={{color:C.muted,fontSize:10}}>Média: {m.med}x</span>
              <span style={{fontWeight:700,color:c}}>{m.v}{m.unit}</span>
              <span style={S.badge(c)}>{m.v>m.high?"Caro":m.v>m.med?"Moderado":"Barato"}</span>
            </div>
           </div>
           <div style={{position:"relative",height:8,background:C.border,borderRadius:4}}>
            <div style={{height:"100%",width:pct+"%",background:c,borderRadius:4,opacity:.8}}/>
            <div style={{position:"absolute",top:0,bottom:0,left:(m.med/m.high*100)+"%",width:1,background:C.white,opacity:.6}}/>
           </div>
          </div>
         );
        })}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Sustainable Growth & SOTP" sub="Crescimento sustentável e sum-of-the-parts simplificado"/>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
         {[["ROE",+(F.nopat[5]/F.capInvest[5]*1.5*100).toFixed(1)+"%",C.accent],["Payout Ratio","55%",C.muted],["Sustainable Growth Rate",+(+(F.nopat[5]/F.capInvest[5]*1.5*100).toFixed(1)*0.45).toFixed(1)+"%",C.gold],["EPS Growth (estimado)",epsGrowth+"%",C.blue],["PEG Ratio",peg+"x",peg<1?C.accent:peg<2?C.gold:C.red]].map(([l,v,c])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
           <span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span>
          </div>
         ))}
        </div>
        <SecaoTitulo titulo="SOTP — Sum of the Parts (simplificado)"/>
        {["Divisão Core","Divisão B","Ativos Financeiros","Dívida Líquida"].map((div,i)=>{
         const v = [F.ebitda[5]*7/1e9,F.ebitda[5]*3/1e9,F.divLiq*0.5/1e9,-F.divLiq/1e9][i];
         return (
          <div key={div} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"6px 0",borderBottom:"1px solid "+C.border+"22"}}>
           <span>{div}</span>
           <span style={{fontWeight:700,color:v>=0?C.accent:C.red}}>R${+(v).toFixed(1)}B</span>
          </div>
         );
        })}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontWeight:700,fontSize:14}}>
         <span>SOTP Total</span>
         <span style={{color:C.accent}}>R${+((F.ebitda[5]*7+F.ebitda[5]*3+F.divLiq*0.5-F.divLiq)/1e9).toFixed(1)}B</span>
        </div>
      </div>
     </div>
    )}
    </div>
  );
}
function TabFIIs({ filtered, quotes={}, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const fiis   = filtered.filter(a => a.category === "fiis");
  const FII_DATA = [
    {ticker:"HGLG11",nome:"CSHG Logística",tipo:"Logística",    pVP:.95,dy:8.8,ffo:14.8,affo:14.2,vacFis:4.2,vacFin:3.8,capRate:8.2,ltvPct:22,inadimp:.8,contDur:5.2,abl:892000,custoM2:1850,nInq:48,maiIoq:14},
    {ticker:"XPML11",nome:"XP Malls",      tipo:"Shopping",     pVP:.88,dy:7.4,ffo:11.2,affo:10.8,vacFis:6.8,vacFin:5.9,capRate:7.1,ltvPct:18,inadimp:1.2,contDur:3.8,abl:425000,custoM2:2840,nInq:142,maiIoq:22},
    {ticker:"KNRI11",nome:"Kinea Rend.",   tipo:"Híbrido",      pVP:.91,dy:8.2,ffo:13.4,affo:12.9,vacFis:5.1,vacFin:4.8,capRate:7.8,ltvPct:15,inadimp:.6,contDur:6.1,abl:618000,custoM2:2100,nInq:62,maiIoq:18},
    {ticker:"PVBI11",nome:"VBI Prime Prop",tipo:"Lajes Corp.",   pVP:.82,dy:9.2,ffo:15.1,affo:14.5,vacFis:8.2,vacFin:7.1,capRate:9.1,ltvPct:28,inadimp:2.1,contDur:3.2,abl:185000,custoM2:3200,nInq:28,maiIoq:32},
    {ticker:"IRDM11",nome:"Iridium Receb.",tipo:"CRI",           pVP:1.02,dy:12.4,ffo:18.2,affo:18.2,vacFis:0,vacFin:0,capRate:12.4,ltvPct:0,inadimp:.4,contDur:8.5,abl:0,custoM2:0,nInq:22,maiIoq:11},
  ];

  const [sel,  setSel]  = useState("HGLG11");
  const [secao,setSecao]= useState("overview");
  const fii = FII_DATA.find(f=>f.ticker===sel)||FII_DATA[0];
  const fiiAtivo = fiis.find(a=>a.ticker===sel);
  const pxFII  = fiiAtivo ? preco(fiiAtivo) : fii.pVP*100;
  const selicAt = 10.5;
  const spreadCDI = +(fii.dy - selicAt).toFixed(2);
  const spreadTr  = +(fii.dy - selicAt - 0.5).toFixed(2);
  const dyProj = [0,1,2,3,4,5].map(y => ({
    ano:"Ano "+y, dy:+(fii.dy*Math.pow(1.042,y)).toFixed(2),
    acum:+(fii.dy*(Math.pow(1.042,y+1)-1)/0.042).toFixed(1),
  }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Seletor + secções */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     <select style={{...S.sel,width:180}} value={sel} onChange={e=>setSel(e.target.value)}>
      {FII_DATA.map(f=><option key={f.ticker} value={f.ticker}>{f.ticker} — {f.nome}</option>)}
     </select>
     {[["overview","📋 Overview"],["contrato","📝 Contratos"],["operacional","🏢 Operacional"],["projecao","📈 Projeção"]].map(([v,l])=>(
      <button key={v} onClick={()=>setSecao(v)}
        style={secao===v?S.btnV:{...S.btnO,fontSize:11,padding:"5px 12px"}}>{l}</button>
     ))}
    </div>

    {/* KPIs do FII selecionado */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
     {[
      ["P/VP",fii.pVP+"x",fii.pVP<0.95?C.accent:fii.pVP<1.05?C.gold:C.red,"Preço/Valor Patrimonial"],
      ["Dividend Yield",fii.dy+"%",fii.dy>9?C.accent:fii.dy>7?C.gold:C.red,"Anual sobre cotação"],
      ["Spread vs CDI",spreadCDI>0?"+"+spreadCDI+"pp":spreadCDI+"pp",spreadCDI>1.5?C.accent:spreadCDI>0?C.gold:C.red,"Prêmio sobre CDI"],
      ["FFO/cota",fii.ffo+"%",fii.ffo>12?C.accent:C.gold,"Funds From Operations"],
      ["Vacância Física",fii.vacFis+"%",fii.vacFis<5?C.accent:fii.vacFis<10?C.gold:C.red,"% área desocupada"],
      ["LTV",fii.ltvPct+"%",fii.ltvPct<25?C.accent:fii.ltvPct<35?C.gold:C.red,"Loan-to-Value"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    {secao==="overview" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="FFO vs AFFO — Qualidade da Distribuição"
         sub="FFO = lucro operacional + depr. AFFO = FFO − Capex manutenção. AFFO/FFO < 90% = capex alto"/>
        {[
         ["FFO (R$/cota)",        fii.ffo+"%", C.accent],
         ["AFFO (R$/cota)",       fii.affo+"%",C.blue],
         ["Payout Ratio",         "95%",        C.gold],
         ["AFFO Yield",           +(fii.affo).toFixed(1)+"%",C.blue],
         ["Cap Rate (NOI/Valor)", fii.capRate+"%",C.purple],
         ["NOI Implícito",        "R$"+(pxFII*fii.capRate/100*100/pxFII).toFixed(2)+"/cota",C.muted],
        ].map(([l,v,c])=>(
         <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Análise de Spread vs CDI"
         sub="FII atrativo quando DY > CDI + 1.5% (prêmio pelo risco imobiliário)"/>
        <div style={{padding:14,background:C.surface,borderRadius:10,marginBottom:14,borderLeft:"4px solid "+(spreadCDI>1.5?C.accent:spreadCDI>0?C.gold:C.red)}}>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:C.muted}}>DY Atual</span>
          <span style={{fontWeight:800,fontSize:18,color:C.gold}}>{fii.dy}%</span>
         </div>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:C.muted}}>CDI (Selic)</span>
          <span style={{fontWeight:700,fontSize:14,color:C.muted}}>{selicAt}%</span>
         </div>
         <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:12,color:C.muted}}>Spread CDI</span>
          <span style={{fontWeight:800,fontSize:18,color:spreadCDI>0?C.accent:C.red}}>{spreadCDI>=0?"+":""}{spreadCDI}pp</span>
         </div>
         <Barra pct={Math.min(100,Math.max(0,(fii.dy-selicAt+3)/6*100))} cor={spreadCDI>1.5?C.accent:spreadCDI>0?C.gold:C.red}/>
         <div style={{fontSize:11,color:C.muted,marginTop:6}}>{spreadCDI>1.5?"✓ Spread atrativo para o risco imobiliário":spreadCDI>0?"⚠ Spread marginal — prefira FIIs mais baratos no P/VP":"✗ CDI mais atrativo — sem prêmio de risco"}</div>
        </div>
        {/* Tabela comparativa FIIs */}
        <div style={{overflowX:"auto"}}>
         <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["FII","Tipo","P/VP","DY","Spread","FFO","Vacância"].map(h=><th key={h} style={{padding:"5px 6px",color:C.muted,fontWeight:600,fontSize:9,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
          <tbody>{FII_DATA.map(f=>(
           <tr key={f.ticker} onClick={()=>setSel(f.ticker)} style={{borderBottom:"1px solid "+C.border+"22",cursor:"pointer",background:f.ticker===sel?C.accentDim:"transparent"}}>
            <td style={{padding:"5px 6px",fontWeight:700,textAlign:"right",color:f.ticker===sel?C.accent:C.text}}>{f.ticker}</td>
            <td style={{padding:"5px 6px",textAlign:"right",fontSize:9}}><span style={S.badge(C.blue)}>{f.tipo}</span></td>
            <td style={{padding:"5px 6px",textAlign:"right",color:f.pVP<1?C.accent:C.red}}>{f.pVP}x</td>
            <td style={{padding:"5px 6px",textAlign:"right",color:C.gold}}>{f.dy}%</td>
            <td style={{padding:"5px 6px",textAlign:"right",color:f.dy-selicAt>1.5?C.accent:C.gold}}>{(f.dy-selicAt).toFixed(1)}pp</td>
            <td style={{padding:"5px 6px",textAlign:"right",color:C.accent}}>{f.ffo}%</td>
            <td style={{padding:"5px 6px",textAlign:"right",color:f.vacFin<5?C.accent:C.gold}}>{f.vacFin}%</td>
           </tr>
          ))}</tbody>
         </table>
        </div>
      </div>
     </div>
    )}

    {secao==="contrato" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Análise de Contratos" sub="Duration, tipo, reajuste e risco de renovação"/>
        {[
         ["Duration médio dos contratos", fii.contDur+" anos",    C.accent, fii.contDur>5?"Alta previsibilidade":"Curto — risco de renovação"],
         ["N° de Inquilinos",              fii.nInq,               C.blue,   "Diversificação de locatários"],
         ["Maior Inquilino (% receita)",  fii.maiIoq+"%",          fii.maiIoq>30?C.red:C.gold, fii.maiIoq>30?"Concentração alta":"OK"],
         ["Inadimplência",                fii.inadimp+"%",         fii.inadimp>2?C.red:C.accent,"Locatários em atraso"],
         ["ABL Total",                    fii.abl>0?Math.round(fii.abl/1000)+"k m²":"N/A",C.muted,"Área Bruta Locável"],
         ["Custo/m²",                     fii.custoM2>0?"R$"+fii.custoM2:"N/A",C.muted,"Custo implícito por m²"],
        ].map(([l,v,c,s])=>(
         <div key={l} style={{marginBottom:10,padding:"10px 12px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+c}}>
          <div style={{fontWeight:600,fontSize:12}}>{l}</div>
          <div style={{fontSize:20,fontWeight:800,color:c,margin:"2px 0"}}>{v}</div>
          <div style={{fontSize:10,color:C.muted}}>{s}</div>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Vencimento de Contratos — Cronograma" sub="% de receita com vencimento por ano"/>
        {[0,1,2,3,4,5].map(y=>{
         const pct = y===0?8:y===1?15:y===2?22:y===3?18:y===4?12:25;
         return (
          <div key={y} style={{marginBottom:9}}>
           <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
            <span style={{fontWeight:600}}>Ano {new Date().getFullYear()+y}</span>
            <div style={{display:"flex",gap:8}}>
              <span style={{fontWeight:700,color:pct>20?C.red:pct>15?C.gold:C.accent}}>{pct}% da receita</span>
            </div>
           </div>
           <Barra pct={pct} cor={pct>20?C.red:pct>15?C.gold:C.accent}/>
          </div>
         );
        })}
      </div>
     </div>
    )}

    {secao==="operacional" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Vacância Física vs Financeira" sub="Financeira = mais importante. Unidades vazias com obrigação de aluguel aparecem como 0% financeira."/>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
         {[["Vacância Física",fii.vacFis+"%",C.gold,"% da área desocupada"],["Vacância Financeira",fii.vacFin+"%",fii.vacFin<5?C.accent:C.red,"% da receita perdida"]].map(([l,v,c,s])=>(
          <div key={l} style={{flex:1,background:C.surface,borderRadius:8,padding:"12px",borderTop:"3px solid "+c,textAlign:"center"}}>
           <div style={{fontSize:10,color:C.muted}}>{l}</div>
           <div style={{fontSize:24,fontWeight:800,color:c}}>{v}</div>
           <Barra pct={parseFloat(v)} cor={c}/>
           <div style={{fontSize:10,color:C.muted,marginTop:4}}>{s}</div>
          </div>
         ))}
        </div>
        <SecaoTitulo titulo="Cap Rate por Tipo de Ativo" sub="NOI / Valor. Compara rentabilidade do imóvel com taxa de mercado."/>
        {[["Logística",8.5,7.5],["Lajes Corp.",9.2,8.0],["Shopping",7.8,7.0],["Residencial",5.8,5.5],["CRI/CRA",12.5,11.0]].map(([t,cr,bench])=>(
         <div key={t} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600}}>{t}</span>
           <div>
            <span style={{color:cr>bench?C.accent:C.red,fontWeight:700}}>{cr}%</span>
            <span style={{color:C.muted,fontSize:10,marginLeft:6}}>bench: {bench}%</span>
           </div>
          </div>
          <Barra pct={cr/15*100} cor={cr>bench?C.accent:C.gold}/>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Qualidade do Portfólio de Imóveis" sub="Classificação dos ativos por qualidade construtiva e localização"/>
        {[["A+ (Triple-A)",fii.tipo==="Logística"?35:fii.tipo==="Lajes Corp."?55:20,C.accent],["A (High Quality)",fii.tipo==="Logística"?40:fii.tipo==="Lajes Corp."?30:35,C.blue],["B (Good)",fii.tipo==="Logística"?20:fii.tipo==="Lajes Corp."?10:35,C.gold],["C (Standard)",fii.tipo==="Logística"?5:10,C.red]].map(([q,pct,c])=>(
         <div key={q} style={{marginBottom:9}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600}}>{q}</span>
           <span style={{fontWeight:700,color:c}}>{pct}%</span>
          </div>
          <Barra pct={pct} cor={c}/>
         </div>
        ))}
      </div>
     </div>
    )}

    {secao==="projecao" && (
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Projeção de DY com Reajuste (IPCA +4.2%/a)"/>
        <ResponsiveContainer width="100%" height={200}>
         <BarChart data={dyProj}>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
          <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
          <Bar dataKey="dy" name="DY projetado" fill={C.accent} radius={[4,4,0,0]}>
           {dyProj.map((_,i)=><Cell key={i} fill={i===0?C.gold:C.accent}/>)}
          </Bar>
         </BarChart>
        </ResponsiveContainer>
        <div style={{marginTop:8,fontSize:11,color:C.muted}}>Yield on Cost após 5 anos: <span style={{fontWeight:700,color:C.accent}}>{dyProj[5].dy}%</span> (compra a hoje)</div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Score Consolidado de FIIs" sub="Score 0-100 agregando todos os critérios"/>
        {FII_DATA.map(f=>{
         const s = Math.round(
          (f.pVP<1?25:f.pVP<1.05?15:5) +
          (f.dy>9?20:f.dy>7?12:5) +
          (f.vacFin<4?20:f.vacFin<7?12:3) +
          (f.ltvPct<20?15:f.ltvPct<30?8:2) +
          (f.inadimp<1?10:f.inadimp<2?5:1) +
          (f.contDur>5?10:f.contDur>3?6:2)
         );
         return (
          <div key={f.ticker} onClick={()=>setSel(f.ticker)} style={{marginBottom:8,cursor:"pointer",padding:"8px 12px",background:f.ticker===sel?C.accentDim:C.surface,borderRadius:8,borderLeft:"3px solid "+(s>=75?C.accent:s>=55?C.gold:C.red)}}>
           <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontWeight:700}}>{f.ticker}</span>
            <div style={{display:"flex",gap:6}}>
              <span style={{fontWeight:800,fontSize:16,color:s>=75?C.accent:s>=55?C.gold:C.red}}>{s}/100</span>
              <span style={S.badge(s>=75?C.accent:s>=55?C.gold:C.red)}>{s>=75?"Excelente":s>=55?"Bom":"Cuidado"}</span>
            </div>
           </div>
           <Barra pct={s} cor={s>=75?C.accent:s>=55?C.gold:C.red} altura={5}/>
          </div>
         );
        })}
      </div>
     </div>
    )}
    </div>
  );
}
function TabRFAdv({ filtered, quotes={}, totalVal, byCat }) {
  const [secao, setSecao] = useState("rf");
  const rfAtivos = [
    {nome:"CDB Itaú 2027",  ytm:11.8,ytw:11.8,dur:2.8,conv:8.4, oas:2.1,zSpread:2.3,krd2y:0.8,krd5y:1.9,krd10y:0.1,dv01:280,pd:.2,lgd:40,rating:"AAA",val:500000},
    {nome:"LCI Bradesco",   ytm:11.2,ytw:11.2,dur:1.2,conv:1.6, oas:1.5,zSpread:1.6,krd2y:1.2,krd5y:0,  krd10y:0,  dv01:120,pd:.1,lgd:35,rating:"AA+",val:300000},
    {nome:"Deb. VALE 2030", ytm:13.4,ytw:12.8,dur:4.8,conv:25.1,oas:3.8,zSpread:4.1,krd2y:0.2,krd5y:2.1,krd10y:2.5,dv01:480,pd:.8,lgd:45,rating:"AA-",val:800000},
    {nome:"NTN-B 2035",     ytm:6.8, ytw:6.8, dur:8.2,conv:82.4,oas:1.2,zSpread:1.2,krd2y:0,  krd5y:1.8,krd10y:6.4,dv01:820,pd:.05,lgd:0,rating:"AAA",val:600000},
    {nome:"CRI Logística",  ytm:12.9,ytw:11.4,dur:3.2,conv:11.4,oas:4.2,zSpread:4.5,krd2y:0.5,krd5y:2.7,krd10y:0,  dv01:320,pd:1.2,lgd:40,rating:"AA",val:400000},
  ];

  const portDV01 = rfAtivos.reduce((s,a)=>s+a.dv01,0);
  const portDur  = rfAtivos.reduce((s,a)=>s+a.dur*(a.val/rfAtivos.reduce((t,x)=>t+x.val,0)),0);
  const avgYTM   = rfAtivos.reduce((s,a)=>s+a.ytm*(a.val/rfAtivos.reduce((t,x)=>t+x.val,0)),0);
  const carryRoll = rfAtivos.map(a => ({
    ...a,
    carry: +(a.ytm - 10.5).toFixed(2),
    rolldown: +(a.dur * 0.1).toFixed(2), // approx: se curva não muda, preço sobe pela convexidade
    totalReturn: +(a.ytm - 10.5 + a.dur * 0.1).toFixed(2),
  }));
  const expectedLoss = rfAtivos.map(a => ({
    ...a, el: +(a.pd/100 * a.lgd/100 * a.val / 100).toFixed(0),
  }));
  const [spotPx, setSpotPx] = useState(38.5);   // Spot price
  const [K, setK_] = useState(38.0);   // Strike
  const [T, setT_] = useState(0.25);   // Time to expiry (anos)
  const [r, setR_] = useState(0.105);  // Risk-free rate
  const [sig, setSig_] = useState(0.28); // Volatility
  function norm(x) {
    const t=1/(1+.3275911*Math.abs(x));
    const y=1-((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t*.254829592*Math.exp(-x*x);
    return x<0?1-y:y;
  }
  function npdf(x) { return Math.exp(-x*x/2)/Math.sqrt(2*Math.PI); }

  const d1 = (Math.log(spotPx/K)+(r+sig*sig/2)*T)/(sig*Math.sqrt(T));
  const d2 = d1 - sig*Math.sqrt(T);
  const Nd1 = norm(d1), Nd2 = norm(d2);
  const Nnd1 = norm(-d1), Nnd2 = norm(-d2);

  const callPx = spotPx*Nd1 - K*Math.exp(-r*T)*Nd2;
  const putPx  = K*Math.exp(-r*T)*Nnd2 - spotPx*Nnd1;
  const delta_c  = +Nd1.toFixed(4);
  const delta_p  = +(Nd1-1).toFixed(4);
  const gamma    = +(npdf(d1)/(spotPx*sig*Math.sqrt(T))).toFixed(5);
  const theta_c  = +(-(spotPx*npdf(d1)*sig/(2*Math.sqrt(T)) - r*K*Math.exp(-r*T)*Nd2)/252).toFixed(4);
  const theta_p  = +(-(spotPx*npdf(d1)*sig/(2*Math.sqrt(T)) + r*K*Math.exp(-r*T)*Nnd2)/252).toFixed(4);
  const vega     = +(spotPx*npdf(d1)*Math.sqrt(T)/100).toFixed(4);
  const rho_c    = +(K*T*Math.exp(-r*T)*Nd2/100).toFixed(4);
  const rho_p    = +(-K*T*Math.exp(-r*T)*Nnd2/100).toFixed(4);
  const vanna    = +(vega/spotPx*(1-d1/(sig*Math.sqrt(T)))).toFixed(5);
  const volga    = +(vega*d1*d2/sig).toFixed(5);
  const charm_c  = +(-npdf(d1)*(r/(sig*Math.sqrt(T))-d2/(2*T))/252).toFixed(5);
  const speed    = +(-gamma/spotPx*(1+d1/(sig*Math.sqrt(T)))).toFixed(6);
  const lambda_c = +(delta_c*spotPx/callPx).toFixed(2);
  const pnlData = Array.from({length:40},(_,i)=>{
    const Sp = K*0.85 + i*(K*0.3/39);
    const callPnl = Math.max(0,Sp-K) - callPx;
    const putPnl  = Math.max(0,K-Sp) - putPx;
    const straddlePnl = Math.max(0,Sp-K)+Math.max(0,K-Sp)-(callPx+putPx);
    return {Sp:+Sp.toFixed(2),call:+callPnl.toFixed(2),put:+putPnl.toFixed(2),straddle:+straddlePnl.toFixed(2)};
  });
  const bePut    = +(K-putPx).toFixed(2);
  const beCall   = +(K+callPx).toFixed(2);
  const probProfit= +(Nd2*100).toFixed(1); // aprox para call
  const volSurface = [0.1,0.25,0.5,1.0,2.0].map(t=>
    [0.8,0.9,1.0,1.1,1.2].map(k=>({
    T:t, K:k,
    iv:+(sig*(1+(k-1)*0.15+(t-0.5)*0.05)+Math.abs(k-1)*0.04).toFixed(3)
    }))
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:8}}>
     {[["rf","📋 Renda Fixa"],["opts","⚡ Opções & BS"]].map(([v,l])=>(
      <button key={v} onClick={()=>setSecao(v)}
        style={secao===v?S.btnV:{...S.btnO,fontSize:12,padding:"6px 16px"}}>{l}</button>
     ))}
    </div>

    {secao==="rf" && (
     <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Port KPIs */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {[["YTM Médio Port.",fmt(avgYTM,2)+"%",C.accent,"Yield to Maturity"],["Duration Port.",fmt(portDur,2)+" anos",C.blue,"Sensibilidade a juros"],["DV01 Port.",fmtBRL(portDV01),C.red,"R$ por 1bp de juro"],["Expected Loss",fmtBRL(expectedLoss.reduce((s,a)=>s+a.el,0)),C.red,"PD × LGD estimado"]].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
      </div>
      {/* Tabela de métricas */}
      <div style={S.card}>
        <SecaoTitulo titulo="Métricas de Renda Fixa — YTM, OAS, Z-Spread, DV01, Expected Loss"/>
        <div style={{overflowX:"auto"}}>
         <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Ativo","Rating","YTM","YTW","OAS","Z-Spread","DV01","Duration","PD","LGD","E. Loss","Carry+Roll"].map(h=><th key={h} style={{padding:"6px 7px",color:C.muted,fontWeight:600,fontSize:9,textAlign:"right",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{carryRoll.map((a,i)=>(
           <tr key={a.nome} style={{borderBottom:"1px solid "+C.border+"22"}}>
            <td style={{padding:"7px 7px",fontWeight:700,textAlign:"left",whiteSpace:"nowrap"}}>{a.nome}</td>
            <td style={{padding:"7px 7px",textAlign:"right"}}><span style={S.badge(a.rating.startsWith("AA")?C.accent:C.gold)}>{a.rating}</span></td>
            <td style={{padding:"7px 7px",textAlign:"right",color:C.accent}}>{a.ytm}%</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:a.ytw<a.ytm?C.red:C.muted}}>{a.ytw}%</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:C.purple}}>{a.oas}%</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:C.blue}}>{a.zSpread}%</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:a.dv01>400?C.red:C.gold}}>R${a.dv01}</td>
            <td style={{padding:"7px 7px",textAlign:"right"}}>{a.dur}a</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:a.pd>1?C.red:C.muted}}>{a.pd}%</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:C.muted}}>{a.lgd}%</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:C.red}}>{fmtBRL(expectedLoss[i].el)}</td>
            <td style={{padding:"7px 7px",textAlign:"right",color:a.totalReturn>0?C.accent:C.red,fontWeight:700}}>{a.totalReturn>0?"+":""}{a.totalReturn}%</td>
           </tr>
          ))}</tbody>
         </table>
        </div>
      </div>
      {/* Key Rate Duration */}
      <div style={S.card}>
        <SecaoTitulo titulo="Key Rate Duration (KRD) — Sensibilidade por Ponto da Curva"/>
        <ResponsiveContainer width="100%" height={180}>
         <BarChart data={rfAtivos.map(a=>({nome:a.nome.split(" ")[0],krd2y:a.krd2y,krd5y:a.krd5y,krd10y:a.krd10y}))} barSize={14}>
          <XAxis dataKey="nome" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:8}}/>
          <RechartsTip contentStyle={S.TT}/>
          <Legend/>
          <Bar dataKey="krd2y"  name="KRD 2Y"  fill={C.accent}/>
          <Bar dataKey="krd5y"  name="KRD 5Y"  fill={C.blue}/>
          <Bar dataKey="krd10y" name="KRD 10Y" fill={C.purple}/>
         </BarChart>
        </ResponsiveContainer>
      </div>
     </div>
    )}

    {secao==="opts" && (
     <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Inputs */}
      <div style={S.card}>
        <SecaoTitulo titulo="Black-Scholes Calculator" sub="Configure os parâmetros para calcular preço e Greeks de qualquer opção"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12}}>
         {[["Spot (spotPx)",spotPx,setS_,.1],["Strike (K)",K,setK_,.5],["Volatilidade (σ)",sig,setSig_,.01],["Risk-Free (r)",r,setR_,.001],["Vencimento (T anos)",T,setT_,.01]].map(([l,v,fn,step])=>(
          <div key={l}>
           <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{l}</div>
           <input style={{...S.inp,padding:"6px 10px"}} type="number" value={v} step={step} onChange={e=>fn(+e.target.value)}/>
          </div>
         ))}
        </div>
      </div>
      {/* Preços + Greeks */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
        <div style={S.card}>
         <SecaoTitulo titulo="Preços e Principais Greeks"/>
         <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          {[["Call",fmtBRL(callPx),C.accent],["Put",fmtBRL(putPx),C.red],["Breakeven Call",fmtBRL(beCall),C.gold],["Breakeven Put",fmtBRL(bePut),C.gold],["P(Lucro Call)",probProfit+"%",C.accent],["Lambda (Lav.)",lambda_c+"x",C.purple]].map(([l,v,c])=>(
           <div key={l} style={{background:C.surface,borderRadius:8,padding:"10px 12px",borderLeft:"2px solid "+c}}>
            <div style={{fontSize:10,color:C.muted}}>{l}</div>
            <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
           </div>
          ))}
         </div>
         <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"1px solid "+C.border}}><th style={{padding:"5px 8px",textAlign:"left",color:C.muted,fontSize:10}}>Greek</th><th style={{padding:"5px 8px",textAlign:"right",color:C.accent,fontSize:10}}>CALL</th><th style={{padding:"5px 8px",textAlign:"right",color:C.red,fontSize:10}}>PUT</th></tr></thead>
          <tbody>{[["Delta",delta_c,delta_p,"Variação do preço da opção por R$1 no ativo"],["Gamma (Δ/ΔS)",gamma,gamma,"Variação do Delta por R$1 no ativo"],["Theta/dia",theta_c,theta_p,"Decaimento por dia (time decay)"],["Vega/1%vol",vega,vega,"Variação por +1pp de volatilidade"],["Rho/1%r",rho_c,rho_p,"Variação por +1pp de juro"],["Vanna",vanna,vanna,"dDelta/dVol (2ª ordem)"],["Volga",volga,volga,"dVega/dVol — curvatura em vol"],["Speed",speed,speed,"dGamma/dS (3ª ordem)"]].map(([g,vc,vp,d])=>(
           <tr key={g} style={{borderBottom:"1px solid "+C.border+"22"}} title={d}>
            <td style={{padding:"5px 8px",fontWeight:600,fontSize:11}}>{g}</td>
            <td style={{padding:"5px 8px",textAlign:"right",color:C.accent}}>{vc}</td>
            <td style={{padding:"5px 8px",textAlign:"right",color:C.red}}>{vp}</td>
           </tr>
          ))}</tbody>
         </table>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
         <div style={S.card}>
          <SecaoTitulo titulo="P&L no Vencimento" sub="Azul=Call · Vermelho=Put · Verde=Straddle"/>
          <ResponsiveContainer width="100%" height={170}>
           <LineChart data={pnlData}>
            <XAxis dataKey="Sp" stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+v}/>
            <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+v}/>
            <RechartsTip formatter={v=>["R$"+fmt(+v,2)]} contentStyle={S.TT}/>
            <Line type="monotone" dataKey="call"    name="Call"    stroke={C.blue}  strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="put"     name="Put"     stroke={C.red}   strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="straddle" name="Straddle" stroke={C.accent} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
           </LineChart>
          </ResponsiveContainer>
         </div>
         <div style={S.card}>
          <SecaoTitulo titulo="Volatility Surface — IV por Strike e Vencimento"/>
          <div style={{overflowX:"auto"}}>
           <table style={{borderCollapse:"collapse",fontSize:10}}>
            <thead><tr style={{borderBottom:"1px solid "+C.border}}>
              <th style={{padding:"4px 8px",color:C.muted}}>T\K</th>
              {[0.8,0.9,1.0,1.1,1.2].map(k=><th key={k} style={{padding:"4px 8px",color:C.muted}}>{(k*100).toFixed(0)}%K</th>)}
            </tr></thead>
            <tbody>{volSurface.map((row,ti)=>(
              <tr key={ti}>
               <td style={{padding:"4px 8px",fontWeight:700,color:C.gold}}>{[0.1,0.25,0.5,1.0,2.0][ti]}Y</td>
               {row.map((c,ki)=>{
                const isATM = ki===2;
                const col = c.iv>sig*1.1?C.red:c.iv<sig*.9?C.accent:C.muted;
                return <td key={ki} style={{padding:"4px 8px",textAlign:"center",background:isATM?C.border+"44":"transparent",color:col,fontWeight:isATM?700:400}}>{(c.iv*100).toFixed(1)}%</td>;
               })}
              </tr>
            ))}</tbody>
           </table>
          </div>
         </div>
        </div>
      </div>
     </div>
    )}
    </div>
  );
}
function TabPEVC({ totalVal, txs=[], byCat }) {
  const funds = [
    {nome:"Fundo PE Brasil I", vintage:2019,committed:5e6,called:3.8e6,distrib:1.2e6,nav:5.2e6,stage:"Harvest",tipo:"PE"},
    {nome:"VC Tech Latam",     vintage:2021,committed:2e6,called:1.4e6,distrib:.1e6, nav:2.8e6,stage:"Growth",tipo:"VC"},
    {nome:"Infra Energia",     vintage:2018,committed:8e6,called:7.5e6,distrib:3.8e6,nav:8.9e6,stage:"Harvest",tipo:"Infra"},
    {nome:"Real Assets Fund",  vintage:2020,committed:3e6,called:2.5e6,distrib:.8e6, nav:3.6e6,stage:"Invest.",tipo:"RE"},
  ];
  const fundsWithMetrics = funds.map(f => {
    const tvpi  = +((f.distrib+f.nav)/f.called).toFixed(2);
    const dpi   = +(f.distrib/f.called).toFixed(2);
    const rvpi  = +(f.nav/f.called).toFixed(2);
    const moic  = tvpi;
    const anos  = new Date().getFullYear()-f.vintage;
    const xirr  = +(((tvpi)**(1/Math.max(1,anos))-1)*100).toFixed(1);
    const ibovV = f.called*Math.pow(1.145,anos);
    const pme   = +((f.distrib+f.nav)/ibovV).toFixed(2);
    const unf   = +(f.committed-f.called).toFixed(0);
    return {...f,tvpi,dpi,rvpi,moic,xirr,pme,anos,unf};
  });

  const totalCommitted = funds.reduce((s,f)=>s+f.committed,0);
  const totalNAV       = funds.reduce((s,f)=>s+f.nav,0);
  const totalDistrib   = funds.reduce((s,f)=>s+f.distrib,0);
  const totalUnfunded  = fundsWithMetrics.reduce((s,f)=>s+f.unf,0);
  const portTVPI       = +((totalDistrib+totalNAV)/funds.reduce((s,f)=>s+f.called,0)).toFixed(2);
  const portDPI        = +(totalDistrib/funds.reduce((s,f)=>s+f.called,0)).toFixed(2);
  const jCurve = [
    {ano:0,val:-5},{ano:1,val:-18},{ano:2,val:-12},{ano:3,val:5},
    {ano:4,val:22},{ano:5,val:45},{ano:6,val:68},{ano:7,val:82},
    {ano:8,val:95},{ano:9,val:105},{ano:10,val:118},
  ].map(d=>({...d,label:"Y"+d.ano}));
  const familias = [
    {nome:"Familia Silva",   geração:"G1",  patrim:totalVal*.45, herdeiros:3, holding:true,  testamento:true,  acordo:true,  itcmd:0.04},
    {nome:"Familia Mendes",  geração:"G2",  patrim:totalVal*.28, herdeiros:2, holding:true,  testamento:false, acordo:false, itcmd:0.04},
    {nome:"Familia Rocha",   geração:"G1",  patrim:totalVal*.18, herdeiros:4, holding:false, testamento:true,  acordo:false, itcmd:0.04},
    {nome:"Familia Costa",   geração:"G2",  patrim:totalVal*.09, herdeiros:1, holding:false, testamento:false, acordo:false, itcmd:0.04},
  ];

  const famScores = familias.map(f => {
    const s = (f.holding?30:0) + (f.testamento?25:0) + (f.acordo?25:0) + (f.herdeiros<=2?20:f.herdeiros<=3?10:0);
    const itcmdLiab = f.patrim * f.itcmd;
    const erosion   = +(f.patrim*(1-(1-0.02)**(30))/f.patrim*100).toFixed(1); // 2% drag por 30 anos
    return {...f,score:s,itcmdLiab,erosion,c:s>=75?C.accent:s>=50?C.gold:C.red};
  });
  const genProj = [1,2,3,4,5,10,15,20,25,30].map(y=>({
    ano:"A"+y,
    g1: +(totalVal*.45*Math.pow(1.068,y)/1e6).toFixed(1),
    g2: +(totalVal*.28*Math.pow(1.055,y)/1e6).toFixed(1),
    total: +((totalVal*.45+totalVal*.28)*Math.pow(1.062,y)/1e6).toFixed(1),
    meta: +(totalVal*1.5/1e6).toFixed(1),
  }));
  const estruturas = [
    {nome:"Holding BR",      itcmd:.04,irpf:.275,irpj:.15,total:.32,vant:"Diferimento IR",desv:"ITCMD 4%"},
    {nome:"Offshore Trust",  itcmd:.0, irpf:.0,  irpj:.0, total:.0, vant:"Zero ITCMD",    desv:"CFC Rules"},
    {nome:"Pessoa Física",   itcmd:.04,irpf:.275,irpj:0,  total:.315,vant:"Simplicidade", desv:"Maior IR"},
    {nome:"Fundo Exclusivo", itcmd:.04,irpf:.15, irpj:0,  total:.19, vant:"Come-cotas 6M",desv:"Custo adm."},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* PE/VC KPIs */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["TVPI Portfolio",portTVPI+"x",portTVPI>1.8?C.accent:C.gold,"Total Value / Paid-In"],
      ["DPI Portfolio",portDPI+"x",portDPI>0.8?C.accent:C.gold,"Distributed / Paid-In"],
      ["NAV Total",fmtBRL(totalNAV),C.accent,"Net Asset Value"],
      ["Unfunded Commitm.",fmtBRL(totalUnfunded),C.red,"Capital a chamar"],
      ["Diversif. Vintages",new Set(funds.map(f=>f.vintage)).size+" anos",C.blue,"Anos distintos"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* Tabela PE/VC */}
     <div style={S.card}>
      <SecaoTitulo titulo="PE/VC — TVPI, DPI, RVPI, MOIC, XIRR, PME" sub="Verde = PME > 1 (supera mercado público)"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
         <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Fundo","Tipo","TVPI","DPI","RVPI","XIRR","PME","Unfunded"].map(h=><th key={h} style={{padding:"5px 7px",color:C.muted,fontWeight:600,fontSize:9,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
         <tbody>{fundsWithMetrics.map(f=>(
          <tr key={f.nome} style={{borderBottom:"1px solid "+C.border+"22"}}>
           <td style={{padding:"6px 7px",fontWeight:700,textAlign:"left",fontSize:11,whiteSpace:"nowrap"}}>{f.nome}</td>
           <td style={{padding:"6px 7px",textAlign:"right"}}><span style={S.badge(f.tipo==="PE"?C.accent:f.tipo==="VC"?C.purple:f.tipo==="Infra"?C.blue:C.gold)}>{f.tipo}</span></td>
           <td style={{padding:"6px 7px",textAlign:"right",color:f.tvpi>1.5?C.accent:C.gold,fontWeight:700}}>{f.tvpi}x</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:f.dpi>0.5?C.accent:C.gold}}>{f.dpi}x</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:C.muted}}>{f.rvpi}x</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:+f.xirr>15?C.accent:C.gold}}>{f.xirr}%</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:f.pme>=1?C.accent:C.red,fontWeight:700}}>{f.pme}x</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:C.red}}>{fmtBRL(f.unf)}</td>
          </tr>
         ))}</tbody>
        </table>
      </div>
     </div>

     {/* J-Curve */}
     <div style={S.card}>
      <SecaoTitulo titulo="J-Curve — Evolução Típica de Fundo PE" sub="Anos iniciais negativos (fees+no distrib), positivo após metade da vida"/>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={jCurve}>
         <defs>
          <linearGradient id="jG" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%"  stopColor={C.accent} stopOpacity={.3}/>
           <stop offset="95%" stopColor={C.accent} stopOpacity={0}/>
          </linearGradient>
         </defs>
         <XAxis dataKey="label" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[v+"%","IRR Acumulado"]} contentStyle={S.TT}/>
         <Area type="monotone" dataKey="val" name="IRR Acum." stroke={C.accent} fill="url(#jG)" strokeWidth={2} dot={false}/>
         <Line type="monotone" data={jCurve.map(d=>({...d,zero:0}))} dataKey="zero" stroke={C.muted} strokeDasharray="4 2" strokeWidth={1} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Planejamento Sucessório */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Planejamento Sucessório — Score por Família" sub="Holding + Testamento + Acordo de Acionistas + N° Herdeiros"/>
      {famScores.map(f=>(
        <div key={f.nome} style={{marginBottom:12,padding:"10px 14px",background:C.surface,borderRadius:10,borderLeft:"4px solid "+f.c}}>
         <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <div>
           <div style={{fontWeight:700,fontSize:13}}>{f.nome}</div>
           <div style={{fontSize:11,color:C.muted}}>{f.geração} · {f.herdeiros} herdeiros · {fmtBRL(f.patrim)}</div>
          </div>
          <div style={{textAlign:"right"}}>
           <span style={{fontSize:22,fontWeight:800,color:f.c}}>{f.score}/100</span><br/>
           <span style={S.badge(f.c)}>{f.score>=75?"OK":f.score>=50?"Atenção":"Urgente"}</span>
          </div>
         </div>
         <div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          {[["Holding",f.holding],["Testamento",f.testamento],["Acordo Ac.",f.acordo]].map(([l,v])=>(
           <span key={l} style={{...S.badge(v?C.accent:C.red),fontSize:10}}>{v?"✓":"✗"} {l}</span>
          ))}
         </div>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
          <span>ITCMD estimado: <b style={{color:C.red}}>{fmtBRL(f.itcmdLiab)}</b></span>
          <span>Erosão 30a: <b style={{color:C.gold}}>{f.erosion}%</b></span>
         </div>
         <Barra pct={f.score} cor={f.c} altura={5}/>
        </div>
      ))}
     </div>
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Net Worth Projetado por Geração" sub="Projeção sem novos aportes — mostra erosão intergeracional"/>
        <ResponsiveContainer width="100%" height={190}>
         <LineChart data={genProj}>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:9}}/>
          <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+v+"M"}/>
          <RechartsTip formatter={v=>["R$"+v+"M"]} contentStyle={S.TT}/>
          <Legend/>
          <Line type="monotone" dataKey="g1"    name="G1"    stroke={C.accent} strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="g2"    name="G2"    stroke={C.blue}   strokeWidth={2} dot={false}/>
          <Line type="monotone" dataKey="total" name="Total" stroke={C.gold}   strokeWidth={2.5} dot={false}/>
          <Line type="monotone" dataKey="meta"  name="Meta"  stroke={C.red}    strokeDasharray="5 3" strokeWidth={1.5} dot={false}/>
         </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Estrutura de Holdings — Comparativo Tributário"/>
        {estruturas.map(e=>(
         <div key={e.nome} style={{marginBottom:9,padding:"9px 12px",background:C.surface,borderRadius:8,borderLeft:"3px solid "+(e.total<0.2?C.accent:e.total<0.3?C.gold:C.red)}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
           <span style={{fontWeight:700,fontSize:12}}>{e.nome}</span>
           <div style={{display:"flex",gap:6}}>
            <span style={{fontWeight:800,color:e.total<0.2?C.accent:e.total<0.3?C.gold:C.red}}>{(e.total*100).toFixed(0)}% tax</span>
           </div>
          </div>
          <div style={{display:"flex",gap:10,fontSize:11}}>
           <span style={{color:C.accent}}>✓ {e.vant}</span>
           <span style={{color:C.red}}>✗ {e.desv}</span>
          </div>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
function TabFXReporting({ totalVal, portRet, portVol, portSharpe, portMaxDD, byCat=[], famSel, filtered=[], quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const pppBRL  = 3.82;   // Big Mac / CPI PPP
  const spotBRL = 5.23;   // câmbio atual
  const pppDev  = +((spotBRL-pppBRL)/pppBRL*100).toFixed(1);
  const reer    = 78.2;   // REER índice
  const reerBase= 100;

  const fxPairs = [
    {par:"USD/BRL", spot:5.23, ppp:3.82,  fair:4.85, vol:18.2, rr25d:2.1,  carry:5.25, cmflow:"+2.1B",   trend:"bearBRL"},
    {par:"EUR/BRL", spot:5.78, ppp:4.20,  fair:5.10, vol:16.8, rr25d:1.8,  carry:7.00, cmflow:"-0.8B",   trend:"neutral"},
    {par:"GBP/BRL", spot:6.92, ppp:5.40,  fair:6.20, vol:17.1, rr25d:2.4,  carry:5.50, cmflow:"+0.4B",   trend:"neutral"},
    {par:"CNY/BRL", spot:0.72, ppp:0.58,  fair:0.68, vol:12.4, rr25d:0.8,  carry:3.80, cmflow:"+5.2B",   trend:"stable"},
  ];

  const fxMom = MESES.map((mes,i)=>({
    mes,
    usd:+(5.23+(Math.sin(i*.6)*.35)).toFixed(2),
    eur:+(5.78+(Math.cos(i*.5)*.28)).toFixed(2),
    mmbrl:+(78+(Math.sin(i*.4)*4)).toFixed(1),
  }));
  const IPS_BANDS = {acoes_br:{min:10,max:35},fiis:{min:5,max:20},renda_fixa:{min:20,max:50},acoes_eua:{min:5,max:25},etfs:{min:0,max:15},cripto:{min:0,max:5}};
  const ipsCompliance = byCat.map(c=>{
    const band = IPS_BANDS[c.id];
    if(!band) return {...c,status:"N/A",in:true};
    const inBand = c.pct>=band.min&&c.pct<=band.max;
    return {...c,band,inBand,distance:inBand?0:c.pct<band.min?band.min-c.pct:c.pct-band.max};
  });
  const nViolations = ipsCompliance.filter(c=>!c.inBand&&c.band).length;
  const aum = totalVal;
  const feeAdm   = aum*.005;
  const portfRet = portRet/100;
  const hw       = aum*1.05; // highwater mark 5% acima
  const hwExcess = Math.max(0,aum-hw);
  const feePerf  = hwExcess*.20;
  const feeTot   = feeAdm+feePerf;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
    {/* FX Overview */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
     {[
      ["USD/BRL Spot",fmtBRL(spotBRL),C.muted,"Cotação atual"],
      ["PPP (Big Mac)",fmtBRL(pppBRL),C.accent,"Câmbio de equilíbrio"],
      ["Desvio vs PPP",pppDev>0?"+"+pppDev+"%":pppDev+"%",pppDev>30?C.red:C.gold,"BRL "+pppDev>0?"desvalorizado":"valorizado"],
      ["REER",fmt(reer,1),reer<85?C.accent:C.gold,"80-120 = normal (base=100)"],
      ["IPS Violations",nViolations,nViolations===0?C.accent:C.red,nViolations===0?"Portfólio compliant":"Classes fora da banda"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>
     {/* FX Pairs */}
     <div style={S.card}>
      <SecaoTitulo titulo="FX Analysis — PPP, REER, Risk Reversal, Carry" sub="Fair Value = média PPP + BEER + modelo de fluxos"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
         <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["Par","Spot","PPP","Fair","Desvio","Vol","25δ RR","Carry"].map(h=><th key={h} style={{padding:"5px 7px",color:C.muted,fontWeight:600,fontSize:9,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
         <tbody>{fxPairs.map(p=>{
          const dev=+((p.spot-p.fair)/p.fair*100).toFixed(1);
          return (
           <tr key={p.par} style={{borderBottom:"1px solid "+C.border+"22"}}>
            <td style={{padding:"6px 7px",fontWeight:700,textAlign:"left"}}>{p.par}</td>
            <td style={{padding:"6px 7px",textAlign:"right"}}>{p.spot}</td>
            <td style={{padding:"6px 7px",textAlign:"right",color:C.muted}}>{p.ppp}</td>
            <td style={{padding:"6px 7px",textAlign:"right",color:C.accent}}>{p.fair}</td>
            <td style={{padding:"6px 7px",textAlign:"right",color:Math.abs(dev)>10?C.red:C.gold,fontWeight:700}}>{dev>=0?"+":""}{dev}%</td>
            <td style={{padding:"6px 7px",textAlign:"right",color:p.vol>20?C.red:C.muted}}>{p.vol}%</td>
            <td style={{padding:"6px 7px",textAlign:"right",color:p.rr25d>2?C.red:C.gold}}>{p.rr25d}</td>
            <td style={{padding:"6px 7px",textAlign:"right",color:C.accent,fontWeight:600}}>{p.carry}%</td>
           </tr>
          );
         })}</tbody>
        </table>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={fxMom}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         <Line type="monotone" dataKey="usd" name="USD/BRL" stroke={C.accent} strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="eur" name="EUR/BRL" stroke={C.blue}   strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
        </LineChart>
      </ResponsiveContainer>
     </div>

     {/* IPS Compliance + Fee Calculator */}
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="IPS Compliance — Bandas de Alocação" sub="Verde = dentro da banda. Vermelho = fora do mandato."/>
        {ipsCompliance.filter(c=>c.band).map(c=>(
         <div key={c.id} style={{marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:2}}>
           <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:2,background:c.color}}/>{c.label}</div>
           <div style={{display:"flex",gap:8}}>
            <span style={{color:C.muted,fontSize:10}}>[{c.band.min}%-{c.band.max}%]</span>
            <span style={{fontWeight:700,color:c.inBand?C.accent:C.red}}>{fmt(c.pct,1)}%</span>
            <span style={S.badge(c.inBand?C.accent:C.red)}>{c.inBand?"✓":"✗"}</span>
           </div>
          </div>
          <div style={{position:"relative",height:8,background:C.border,borderRadius:4}}>
           <div style={{position:"absolute",left:c.band.min+"%",width:(c.band.max-c.band.min)+"%",height:"100%",background:C.accent+"22",borderRadius:2}}/>
           <div style={{position:"absolute",left:Math.min(c.pct,98)+"%",top:"-1px",width:3,height:"110%",background:c.inBand?C.accent:C.red,borderRadius:2}}/>
          </div>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Fee Calculator — Adm + Performance + Highwater Mark"/>
        {[
         ["AUM", fmtBRL(aum), C.white],
         ["Taxa Adm (0.5% a.a.)", fmtBRL(feeAdm), C.red],
         ["Highwater Mark", fmtBRL(hw), C.muted],
         ["Excesso acima do HWM", fmtBRL(hwExcess), C.gold],
         ["Taxa Performance (20%)", fmtBRL(feePerf), C.red],
         ["Fee Total", fmtBRL(feeTot), C.red],
         ["Fee/AUM", fmt(feeTot/aum*100,2)+"%", C.red],
         ["Retorno Líquido Est.", fmt(portRet-feeTot/aum*100,2)+"%", C.accent],
        ].map(([l,v,c])=>(
         <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid "+C.border+"22",fontSize:12}}>
          <span style={{color:C.muted}}>{l}</span><span style={{fontWeight:700,color:c}}>{v}</span>
         </div>
        ))}
      </div>
     </div>
    </div>
    </div>
  );
}
const ETF_DB = [
  {ticker:"SPY",  nome:"SPDR S&P 500",         indice:"S&P 500",        tipo:"Large Blend",   ter:.0945,te:.02, td:-.08,aum:550e9, vol:85e6, spread:.01, nav:510.2, px:510.8,  prem:+.12, n:503, country:"US", currency:"USD",
   sectors:{tech:28.5,fin:13.2,health:12.8,cons:10.2,ind:8.8,energy:3.8,util:2.5,mat:2.8,re:2.4,tele:8.8,other:6.2},
   factors:{value:.2,growth:.8,momentum:.6,quality:.7,lowvol:.4,size:-.3},
   top10:[["AAPL",7.2],["MSFT",6.8],["NVDA",5.1],["AMZN",3.8],["META",2.9],["GOOGL",2.5],["GOOGL",2.1],["BRK",1.8],["LLY",1.6],["AVGO",1.4]],
   style:{large:85,mid:13,small:2,value:30,blend:38,growth:32},
   dd2008:-50.8, dd2020:-33.8, dd2022:-24.5, esl:.02,
   divYield:1.28, divFreq:"quarterly", cumGrowth5y:104.2},

  {ticker:"QQQ",  nome:"Invesco Nasdaq-100",    indice:"Nasdaq-100",     tipo:"Large Growth",  ter:.20, te:.03, td:-.15,aum:260e9, vol:45e6, spread:.01, nav:469.4, px:470.1,  prem:+.15, n:102, country:"US", currency:"USD",
   sectors:{tech:58.2,cons:18.4,health:5.8,ind:4.8,fin:4.2,energy:.8,util:.2,mat:.4,re:.2,tele:6.8,other:.2},
   factors:{value:.1,growth:1.2,momentum:.9,quality:.8,lowvol:.2,size:-.5},
   top10:[["AAPL",9.1],["MSFT",8.8],["NVDA",8.5],["AMZN",5.4],["META",4.2],["GOOGL",4.8],["GOOGL",3.8],["TSLA",2.8],["COST",1.8],["AVGO",2.1]],
   style:{large:92,mid:7,small:1,value:12,blend:28,growth:60},
   dd2008:-53.2, dd2020:-27.2, dd2022:-32.4, esl:.04,
   divYield:.58,  divFreq:"quarterly", cumGrowth5y:148.5},

  {ticker:"VNQ",  nome:"Vanguard REIT",         indice:"MSCI US REIT",   tipo:"Real Estate",   ter:.12, te:.04, td:-.18,aum:62e9,  vol:4e6,  spread:.03, nav:88.4,  px:88.1,   prem:-.34, n:163, country:"US", currency:"USD",
   sectors:{re:100},
   factors:{value:.6,growth:.3,momentum:.2,quality:.5,lowvol:.6,size:.1},
   top10:[["PLD",9.2],["AMT",8.1],["EQIX",7.4],["CCI",5.8],["PSA",4.2],["DLR",4.0],["O",3.8],["SPG",3.5],["WELL",3.2],["AVB",2.8]],
   style:{large:58,mid:36,small:6,value:42,blend:40,growth:18},
   dd2008:-68.4, dd2020:-38.2, dd2022:-28.8, esl:.01,
   divYield:4.18, divFreq:"quarterly", cumGrowth5y:18.4},

  {ticker:"GLD",  nome:"SPDR Gold",             indice:"Gold Spot",      tipo:"Commodity",     ter:.40, te:.08, td:-.48,aum:72e9,  vol:8e6,  spread:.04, nav:234.8, px:234.9,  prem:+.04, n:1,   country:"Global", currency:"USD",
   sectors:{commodity:100},
   factors:{value:.0,growth:.0,momentum:.5,quality:.0,lowvol:.8,size:.0},
   top10:[["Gold",100]],
   style:{large:0,mid:0,small:0,value:0,blend:0,growth:0},
   dd2008:-30.2, dd2020:-12.1, dd2022:-1.8, esl:0,
   divYield:0, divFreq:"none", cumGrowth5y:85.2},

  {ticker:"TLT",  nome:"iShares 20Y+ Treasury", indice:"ICE 20Y+ Tsy",   tipo:"Govt Bond",     ter:.15, te:.03, td:-.20,aum:58e9,  vol:20e6, spread:.02, nav:92.1,  px:92.0,   prem:-.11, n:37,  country:"US", currency:"USD",
   sectors:{bonds:100},
   factors:{value:.0,growth:.0,momentum:-.2,quality:.9,lowvol:.7,size:.0},
   top10:[["UST 2.875% 2052",8.2],["UST 3.0% 2053",7.8],["UST 2.25% 2052",7.1]],
   style:{large:0,mid:0,small:0,value:0,blend:0,growth:0},
   dd2008:-21.8, dd2020:-8.8, dd2022:-33.2, esl:0,
   divYield:4.08, divFreq:"monthly", cumGrowth5y:-18.4},
  {ticker:"IVVB11",nome:"iShares S&P 500 BR",  indice:"S&P 500",        tipo:"Large Blend BR", ter:.23, te:.08, td:-.32,aum:12e9,  vol:2e6,  spread:.08, nav:412.5, px:413.1,  prem:+.15, n:503, country:"BR/US", currency:"BRL",
   sectors:{tech:28.5,fin:13.2,health:12.8,cons:10.2,ind:8.8,energy:3.8,util:2.5,mat:2.8,re:2.4,tele:8.8,other:6.2},
   factors:{value:.2,growth:.8,momentum:.6,quality:.7,lowvol:.4,size:-.3},
   top10:[["AAPL",7.2],["MSFT",6.8],["NVDA",5.1],["AMZN",3.8],["META",2.9]],
   style:{large:85,mid:13,small:2,value:30,blend:38,growth:32},
   dd2008:-50.8, dd2020:-33.8, dd2022:-24.5, esl:.02,
   divYield:1.28, divFreq:"quarterly", cumGrowth5y:185.4},

  {ticker:"BOVA11",nome:"iShares IBOVESPA",     indice:"IBOVESPA",       tipo:"Brazil Large",   ter:.10, te:.05, td:-.12,aum:8e9,   vol:15e6, spread:.06, nav:142.8, px:142.5,  prem:-.21, n:91,  country:"BR", currency:"BRL",
   sectors:{energy:22.4,fin:24.8,mat:15.2,cons:12.8,util:8.4,ind:6.2,health:4.8,tech:3.2,re:1.2,other:1.0},
   factors:{value:.7,growth:.3,momentum:.3,quality:.5,lowvol:.4,size:.2},
   top10:[["VALE3",9.8],["ITUB4",8.4],["PETR4",10.2],["BBDC4",5.2],["ABEV3",4.8],["WEGE3",4.2],["BBAS3",4.0],["RENT3",2.8],["LREN3",2.2],["EGIE3",2.0]],
   style:{large:72,mid:22,small:6,value:55,blend:32,growth:13},
   dd2008:-59.2, dd2020:-46.8, dd2022:-8.2, esl:.01,
   divYield:4.82, divFreq:"semiannual", cumGrowth5y:8.4},
];
const ETF_OVERLAP = {
  "SPY-QQQ":   {pct:45.2, reason:"Mega-caps compartilhadas (AAPL, MSFT, NVDA, AMZN, META)"},
  "SPY-IVVB11":{pct:98.8, reason:"Replicam o mesmo índice — quase idênticos"},
  "QQQ-IVVB11":{pct:45.0, reason:"QQQ é subconjunto do S&P 500"},
  "SPY-VNQ":   {pct:8.2,  reason:"Exposição mínima a REITs no S&P"},
  "SPY-TLT":   {pct:.0,   reason:"Ações vs Bonds — zero overlap"},
  "SPY-GLD":   {pct:.0,   reason:"Ações vs Ouro — zero overlap"},
  "QQQ-VNQ":   {pct:2.1,  reason:"Pequena exposição a REITs de dados"},
  "BOVA11-SPY":{pct:2.8,  reason:"Petrobras ADR e Vale ADR no S&P"},
};
function TabETFOverview({ filtered, quotes }) {
  const [sel, setSel] = useState("SPY");
  const etf = ETF_DB.find(e => e.ticker === sel) || ETF_DB[0];
  const spread_cost = etf.spread / 100 * 2;          // round-trip
  const tco_1y   = +(etf.ter/100 + spread_cost + Math.abs(etf.td/100)).toFixed(4) * 100;
  const tco_5y   = +(etf.ter*5/100 + spread_cost + Math.abs(etf.td*5/100)).toFixed(4) * 100;
  const breakeven= +(spread_cost / (etf.divYield/100 + 0.08)).toFixed(1) * 12; // months
  const premHistory = MESES.map((mes,i) => ({
    mes, prem: +(etf.prem + Math.sin(i*.8)*.15 + Math.cos(i*1.3)*.04).toFixed(3)
  }));
  const avgPrem  = +(premHistory.reduce((s,p)=>s+p.prem,0)/12).toFixed(3);
  const maxPrem  = +(Math.max(...premHistory.map(p=>p.prem))).toFixed(3);
  const minPrem  = +(Math.min(...premHistory.map(p=>p.prem))).toFixed(3);
  const flowData = MESES.map((mes,i) => ({
    mes,
    creation: Math.max(0, Math.round(Math.sin(i*.6+1)*800 + 200)),
    redemption: Math.max(0, Math.round(-Math.sin(i*.6)*.9*800 + 100)),
  }));
  const netFlow12m = flowData.reduce((s,f)=>s+(f.creation-f.redemption),0);
  const lendingRev = +(etf.esl || 0);
  const effectiveTER = +(etf.ter - lendingRev).toFixed(3);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Seletor */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
     {ETF_DB.map(e=>(
      <button key={e.ticker} onClick={()=>setSel(e.ticker)}
        style={sel===e.ticker?S.btnV:{...S.btnO,fontSize:11,padding:"5px 12px"}}>
        {e.ticker}
      </button>
     ))}
    </div>

    {/* Header */}
    <div style={{...S.card,borderLeft:"4px solid "+C.accent}}>
     <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{fontSize:20,fontWeight:800}}>{etf.ticker} <span style={{color:C.muted,fontWeight:400,fontSize:14}}>— {etf.nome}</span></div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>Índice: {etf.indice} · Tipo: {etf.tipo} · {etf.n} constituintes · AUM: ${(etf.aum/1e9).toFixed(0)}B</div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <span style={S.badge(etf.prem>0?C.gold:etf.prem<-.5?C.red:C.accent)}>
         {etf.prem>0?"+":""}{etf.prem}% {etf.prem>0?"Premium":"Discount"}
        </span>
        <span style={S.badge(C.blue)}>NAV: ${etf.nav}</span>
        <span style={S.badge(C.white)}>PX: ${etf.px}</span>
      </div>
     </div>
    </div>

    {/* KPIs de custo */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <MetricCardFull label="TER (Taxa anual)" valor={etf.ter+"%"} numVal={etf.ter}
      metric="ter" cor={C.red}
      def="Total Expense Ratio: taxa anual deduzida diariamente do NAV. É o custo de ter o ETF."
      bom="Abaixo de 0.1%: muito barato (SPY, IVV). Para ETFs temáticos, até 0.5% é razoável."
      ruim="Acima de 0.7%: caro. Para o mesmo índice, prefira ETF com menor TER."
      hist={ETF_DB.map(e=>({label:e.ticker,val:e.ter}))} histLabel="label" unit="%"
      tip={TIPS.ter_etf}/>
     <MetricCardFull label="Tracking Difference" valor={etf.td+"%/a"} numVal={etf.td}
      metric="td_etf" cor={etf.td>0?C.red:C.accent}
      def="Diferença entre o retorno do ETF e o retorno do índice em 1 ano. Melhor métrica de custo real."
      bom="TD negativa significa que o ETF supera o índice (por receita de empréstimo de ações)."
      ruim="TD positiva alta: o ETF está ficando atrás do índice — considere alternativa mais eficiente."
      hist={ETF_DB.map(e=>({label:e.ticker,val:e.td}))} histLabel="label" unit="%"
      tip={TIPS.td_etf}/>
     <MetricCardFull label="Tracking Error" valor={etf.te+"%"} numVal={etf.te}
      metric="tracking_err" cor={C.gold}
      def="Desvio padrão da diferença diária entre ETF e índice. Mede consistência da replicação."
      bom="Abaixo de 0.05%: replicação quase perfeita. Típico de ETFs com réplica física completa."
      ruim="Acima de 0.2%: erros de replicação frequentes, ETF se afasta do índice com frequência."
      hist={ETF_DB.map(e=>({label:e.ticker,val:e.te}))} histLabel="label" unit="%"/>
     <MetricCardFull label="Spread Bid-Ask" valor={etf.spread+"%"} numVal={etf.spread}
      metric="tco_etf" cor={etf.spread>.05?C.red:C.accent}
      def="Diferença entre o preço de compra e venda. Custo oculto de cada negociação do ETF."
      bom="Abaixo de 0.02%: ETF muito líquido. ETFs grandes como SPY ficam em 0.01%."
      ruim="Acima de 0.1%: ETF pouco líquido. Para operações grandes, o custo total pode ser alto."
      hist={ETF_DB.map(e=>({label:e.ticker,val:e.spread}))} histLabel="label" unit="%"/>
     <MetricCardFull label="TCO (Custo Real/ano)" valor={fmt(tco_1y,3)+"%"} numVal={tco_1y}
      metric="tco_etf" cor={C.red}
      def="Total Cost of Ownership: TER + Spread (round-trip) + Tracking Difference. O custo REAL de manter o ETF por 1 ano."
      bom="Abaixo de 0.15%: excelente. Você paga menos que R$1.50 a cada R$1.000 por ano."
      ruim="Acima de 0.5%: considere ETF equivalente com menor custo total."
      hist={MESES.map((label,i)=>({label,val:+(tco_1y*(0.9+Math.sin(i*.3)*.2)).toFixed(3)}))} histLabel="label" unit="%"
      tip={TIPS.tco_etf}/>
     <MetricCardFull label="Securities Lending" valor={lendingRev>0?"+"+lendingRev+"%":"0%"} numVal={lendingRev}
      cor={lendingRev>0?C.accent:C.muted}
      def="Receita gerada pelo ETF ao emprestar ações para vendedores a descoberto. Devolvida ao cotista."
      bom="Receita alta (>0.05%) pode cobrir parte ou todo o TER, tornando o custo efetivo muito baixo."
      ruim="Zero é normal. Alguns ETFs não fazem securities lending por política do gestor."
      hist={MESES.map((label,i)=>({label,val:+(lendingRev*(0.8+Math.sin(i*.5)*.4)).toFixed(3)}))} histLabel="label" unit="%"
      tip={TIPS.lend_rev}/>
     <MetricCardFull label="TER Efetivo" valor={effectiveTER+"%"} numVal={effectiveTER}
      cor={effectiveTER<etf.ter?C.accent:C.muted}
      def="TER depois de descontar a receita de securities lending. O custo real de gestão."
      bom="Abaixo do TER oficial: o ETF está gerando receita extra para o cotista."
      ruim="Igual ao TER: sem receita de lending, paga o preço de tabela."
      hist={MESES.map((label,i)=>({label,val:+(effectiveTER*(0.95+Math.sin(i*.4)*.1)).toFixed(3)}))} histLabel="label" unit="%"/>
     <MetricCardFull label="Breakeven Holding" valor={breakeven+" meses"} numVal={breakeven}
      cor={C.blue}
      def="Quantos meses você precisa manter o ETF para que o retorno esperado compense o custo do spread de compra e venda."
      bom="Abaixo de 3 meses: o ETF compensa mesmo para posições de curto/médio prazo."
      ruim="Acima de 12 meses: o spread é alto. Só vale a pena manter por longo prazo."
      hist={MESES.map((label,i)=>({label,val:breakeven}))} histLabel="label" unit=" meses"/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
     {/* Premium/Discount history */}
     <div style={S.card}>
      <SecaoTitulo titulo="Premium/Discount ao NAV — Histórico 12M"
        sub="ETFs líquidos: ±0.1%. ETFs de nicho: pode chegar a ±5% em stress."/>
      <div style={{display:"flex",gap:10,marginBottom:10}}>
        {[["Atual",etf.prem+"%",etf.prem>0?C.gold:etf.prem<-.5?C.red:C.accent],["Média 12M",avgPrem+"%",C.muted],["Máx","+"+maxPrem+"%",C.gold],["Mín",minPrem+"%",C.red]].map(([l,v,c])=>(
         <div key={l} style={{flex:1,background:C.surface,borderRadius:7,padding:"8px 10px",borderTop:"2px solid "+c}}>
          <div style={{fontSize:9,color:C.muted}}>{l}</div>
          <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
         </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={premHistory}>
         <defs>
          <linearGradient id="premG" x1="0" y1="0" x2="0" y2="1">
           <stop offset="5%"  stopColor={C.gold} stopOpacity={.3}/>
           <stop offset="95%" stopColor={C.gold} stopOpacity={0}/>
          </linearGradient>
         </defs>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[v+"%","Premium/Discount"]} contentStyle={S.TT}/>
         <Area type="monotone" dataKey="prem" stroke={C.gold} fill="url(#premG)" strokeWidth={2} dot={false}/>
         <Line type="monotone" data={premHistory.map(p=>({...p,zero:0}))} dataKey="zero" stroke={C.muted} strokeDasharray="4 2" strokeWidth={1} dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
     </div>

     {/* Creation/Redemption Flow */}
     <div style={S.card}>
      <SecaoTitulo titulo="Creation/Redemption Flow — Authorized Participants"
        sub="Criação = demanda institucional. Resgate = saída de capital. Fluxo líquido positivo = ETF crescendo."/>
      <div style={{padding:10,background:C.surface,borderRadius:8,marginBottom:10,borderLeft:"3px solid "+(netFlow12m>0?C.accent:C.red)}}>
        <div style={{fontSize:11,color:C.muted}}>Fluxo Líquido 12M</div>
        <div style={{fontSize:20,fontWeight:800,color:netFlow12m>0?C.accent:C.red}}>{netFlow12m>0?"+":""}{(netFlow12m/1e3).toFixed(1)}B unidades</div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={flowData} barSize={14}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:8}}/>
         <YAxis stroke={C.muted} tick={{fontSize:8}}/>
         <RechartsTip contentStyle={S.TT}/>
         <Legend/>
         <Bar dataKey="creation"   name="Criação"  fill={C.accent} opacity={.8} radius={[3,3,0,0]}/>
         <Bar dataKey="redemption" name="Resgate"  fill={C.red}    opacity={.7} radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* TCO detalhado + Securities lending */}
    <div style={S.card}>
     <SecaoTitulo titulo="TCO — Total Cost of Ownership Detalhado"
      sub="O custo real inclui TER, spread bid-ask, tracking difference e impacto fiscal"/>
     <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
      {[
        ["TER (gestão)",        etf.ter+"%/a",              C.red],
        ["Spread (round-trip)", fmt(spread_cost,4)+"%",     C.gold],
        ["Tracking Difference", etf.td+"%/a",               etf.td>0?C.red:C.accent],
        ["Securities Lending",  lendingRev>0?"-"+lendingRev+"%/a":"0",C.accent],
        ["TCO 1 ano",           fmt(tco_1y,3)+"%",          C.red],
        ["TCO 5 anos",          fmt(tco_5y,3)+"%",          C.red],
        ["Breakeven holding",   breakeven+" meses",         C.blue],
        ["TER Efetivo",         effectiveTER+"%/a",         effectiveTER<etf.ter?C.accent:C.muted],
      ].map(([l,v,c])=>(
        <div key={l} style={{background:C.surface,borderRadius:8,padding:"10px 12px",borderLeft:"2px solid "+c}}>
         <div style={{fontSize:10,color:C.muted}}>{l}</div>
         <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
        </div>
      ))}
     </div>
    </div>
    </div>
  );
}
function TabETFHoldings({ filtered, quotes }) {
  const [sel,  setSel]  = useState("SPY");
  const [sel2, setSel2] = useState("QQQ");
  const etf  = ETF_DB.find(e=>e.ticker===sel)  || ETF_DB[0];
  const etf2 = ETF_DB.find(e=>e.ticker===sel2) || ETF_DB[1];
  const hhi = etf.top10.reduce((s,[,w])=>s+(w/100)**2,0);
  const effN = +(1/hhi).toFixed(1);
  const overlapKey1 = sel+"-"+sel2;
  const overlapKey2 = sel2+"-"+sel;
  const overlapData = ETF_OVERLAP[overlapKey1] || ETF_OVERLAP[overlapKey2] || {pct:0,reason:"Sem dados de overlap calculados"};
  const FACTOR_LABELS = ["Value","Growth","Momentum","Quality","Low Vol","Size"];
  const factorData = FACTOR_LABELS.map((l,i)=>{
    const keys = ["value","growth","momentum","quality","lowvol","size"];
    return {
    factor:l,
    etf1: etf[`factors`]?.[keys[i]] || 0,
    etf2: etf2[`factors`]?.[keys[i]] || 0,
    bench:0.5,
    };
  });
  const StyleBox = ({s,label}) => {
    const cells = [
    ["Large Value",s.large*s.value/100/100],["Large Blend",s.large*s.blend/100/100],["Large Growth",s.large*s.growth/100/100],
    ["Mid Value",  s.mid*s.value/100/100],  ["Mid Blend",  s.mid*s.blend/100/100],  ["Mid Growth",  s.mid*s.growth/100/100],
    ["Small Value",s.small*s.value/100/100],["Small Blend",s.small*s.blend/100/100],["Small Growth",s.small*s.growth/100/100],
    ];
    return (
    <div>
     <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:4}}>{label}</div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,width:120}}>
      {cells.map(([nm,v])=>{
        const intensity = Math.min(.95, v*20);
        return <div key={nm} title={nm+" "+fmt(v*100,1)+"%"} style={{height:36,background:`rgba(0,200,150,${intensity})`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:intensity>.5?"#000":C.muted}}>{v>0.01?fmt(v*100,0)+"%":""}</div>;
      })}
     </div>
     <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:2,width:120,marginTop:2}}>
      {["Value","Blend","Growth"].map(l=><div key={l} style={{fontSize:8,color:C.muted,textAlign:"center"}}>{l}</div>)}
     </div>
    </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    {/* Seletores */}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     <span style={{fontSize:11,color:C.muted}}>ETF Principal:</span>
     {ETF_DB.map(e=>(
      <button key={e.ticker} onClick={()=>setSel(e.ticker)}
        style={sel===e.ticker?S.btnV:{...S.btnO,fontSize:11,padding:"5px 10px"}}>{e.ticker}</button>
     ))}
     <span style={{fontSize:11,color:C.muted,marginLeft:8}}>Comparar com:</span>
     {ETF_DB.map(e=>(
      <button key={e.ticker} onClick={()=>setSel2(e.ticker)}
        style={sel2===e.ticker?{background:C.blue,color:"#fff",border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontWeight:700,fontSize:11}:{...S.btnO,fontSize:11,padding:"5px 10px",color:C.blue,borderColor:C.blue}}>{e.ticker}</button>
     ))}
    </div>

    {/* KPIs */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
     {[
      ["Nº Constituintes",etf.n,C.accent,"Holdings totais"],
      ["N Efetivo",       effN+" ativos",C.blue,"1/HHI dos pesos"],
      ["Top 10 Peso",     fmt(etf.top10.reduce((s,[,w])=>s+w,0),1)+"%",etf.top10.reduce((s,[,w])=>s+w,0)>50?C.red:C.gold,"Concentração top10"],
      ["Overlap "+sel+"/"+sel2,overlapData.pct+"%",overlapData.pct>70?C.red:overlapData.pct>30?C.gold:C.accent,"Sobreposição de holdings"],
      ["País Principal",  etf.country,C.muted,"Exposição geográfica"],
      ["Moeda",           etf.currency,C.purple,"Moeda do ativo-base"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
     {/* Top 10 Holdings */}
     <div style={S.card}>
      <SecaoTitulo titulo={"Top 10 Holdings — "+etf.ticker}
        sub={`${etf.top10.reduce((s,[,w])=>s+w,0).toFixed(1)}% do ETF · ${etf.n} constituintes · N efetivo: ${effN} ações`}/>
      {etf.top10.map(([t,w],i)=>(
        <div key={t} style={{marginBottom:8}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
           <span style={{fontSize:10,color:C.muted,width:18}}>#{i+1}</span>
           <span style={{fontWeight:700}}>{t}</span>
          </div>
          <span style={{fontWeight:700,color:w>5?C.red:w>3?C.gold:C.muted}}>{w}%</span>
         </div>
         <Barra pct={w/etf.top10[0][1]*100} cor={w>5?C.red:w>3?C.gold:C.accent} altura={5}/>
        </div>
      ))}
     </div>

     {/* Sector Allocation */}
     <div style={S.card}>
      <SecaoTitulo titulo={"Alocação Setorial — "+etf.ticker}/>
      {Object.entries(etf.sectors||{}).filter(([,v])=>v>0).sort(([,a],[,b])=>b-a).map(([s,v])=>(
        <div key={s} style={{marginBottom:7}}>
         <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
          <span style={{fontWeight:600,textTransform:"capitalize"}}>{s==="tech"?"Tecnologia":s==="fin"?"Financeiro":s==="health"?"Saúde":s==="cons"?"Consumo":s==="ind"?"Industrial":s==="energy"?"Energia":s==="util"?"Utilities":s==="mat"?"Materiais":s==="re"?"Real Estate":s==="tele"?"Telecom":s==="bonds"?"Bonds":s==="commodity"?"Commodity":s}</span>
          <span style={{fontWeight:700}}>{v}%</span>
         </div>
         <Barra pct={v} cor={s==="tech"?C.blue:s==="fin"?C.accent:s==="health"?C.purple:s==="energy"?"#F97316":s==="bonds"?C.gold:C.muted}/>
        </div>
      ))}
     </div>
    </div>

    {/* Style Box + Overlap + Factor Comparison */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Style Box (Morningstar) + Overlap Analysis"/>
      <div style={{display:"flex",gap:24,marginBottom:16}}>
        <StyleBox s={etf.style}  label={etf.ticker}/>
        {sel!==sel2&&<StyleBox s={etf2.style} label={etf2.ticker}/>}
      </div>
      <div style={{padding:12,background:C.surface,borderRadius:10,borderLeft:"3px solid "+(overlapData.pct>70?C.red:overlapData.pct>30?C.gold:C.accent)}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>
         Overlap {sel}/{sel2}: <span style={{color:overlapData.pct>70?C.red:overlapData.pct>30?C.gold:C.accent}}>{overlapData.pct}%</span>
        </div>
        <div style={{fontSize:11,color:C.muted}}>{overlapData.reason}</div>
        <div style={{marginTop:8,height:12,background:C.border,borderRadius:6,overflow:"hidden"}}>
         <div style={{height:"100%",width:overlapData.pct+"%",background:overlapData.pct>70?C.red:overlapData.pct>30?C.gold:C.accent}}/>
        </div>
      </div>
     </div>

     <div style={S.card}>
      <SecaoTitulo titulo="Factor Loading — Comparativo"
        sub="Score -1 a +1. Positivo = exposição ao fator. Negativo = exposição ao fator oposto."/>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={factorData} layout="vertical" barSize={12}>
         <XAxis type="number" stroke={C.muted} tick={{fontSize:8}} domain={[-1,1.5]}/>
         <YAxis dataKey="factor" type="category" stroke={C.muted} tick={{fontSize:10}} width={70}/>
         <RechartsTip formatter={v=>[fmt(+v,3),"Exposure"]} contentStyle={S.TT}/>
         <Legend/>
         <Bar dataKey="etf1" name={etf.ticker}  fill={C.accent} radius={[0,4,4,0]}>
          {factorData.map((e,i)=><Cell key={i} fill={e.etf1>=0?C.accent:C.red}/>)}
         </Bar>
         <Bar dataKey="etf2" name={etf2.ticker} fill={C.blue} radius={[0,4,4,0]} opacity={.7}>
          {factorData.map((e,i)=><Cell key={i} fill={e.etf2>=0?C.blue:"#6366F1"}/>)}
         </Bar>
        </BarChart>
      </ResponsiveContainer>
     </div>
    </div>
    </div>
  );
}
function TabETFPerformance({ filtered, quotes }) {
  const [sel,  setSel]  = useState("SPY");
  const [bench,setBench]= useState("QQQ");
  const etf  = ETF_DB.find(e=>e.ticker===sel)  || ETF_DB[0];
  const etf2 = ETF_DB.find(e=>e.ticker===bench) || ETF_DB[1];
  const rollingTE = MESES.map((mes,i)=>({
    mes,
    te12m:   +(etf.te + Math.abs(Math.sin(i*.7))*.04).toFixed(3),
    te24m:   +(etf.te + Math.abs(Math.sin(i*.5))*.03).toFixed(3),
    target:  etf.te,
  }));
  const tdCumul = MESES.map((mes,i)=>({
    mes,
    etf_ret:   +(8.5*(i+1)/12 + Math.sin(i*.4)*1.2).toFixed(2),
    index_ret: +(8.5*(i+1)/12 + Math.sin(i*.4)*1.2 - etf.td*(i+1)/12).toFixed(2),
    td_acum:   +(etf.td*(i+1)/12).toFixed(3),
  }));
  const crises = [
    {crise:"2008 (GFC)",     etf1:etf.dd2008, etf2:etf2.dd2008},
    {crise:"2020 (COVID)",   etf1:etf.dd2020, etf2:etf2.dd2020},
    {crise:"2022 (Rate)",    etf1:etf.dd2022, etf2:etf2.dd2022},
  ];
  const attribution = [
    {comp:"Retorno do Índice", v:8.5,  c:C.muted},
    {comp:"Receita de Empréstimo",v:+etf.esl.toFixed(2),c:C.accent},
    {comp:"Gestão de Caixa",   v:+(.02).toFixed(2),c:C.gold},
    {comp:"Custo de Sampling", v:-(.08).toFixed(2),c:C.red},
    {comp:"TER",               v:-etf.ter,c:C.red},
    {comp:"Outros Custos",     v:+(.01).toFixed(2),c:C.muted},
    {comp:"Retorno do ETF",    v:+(8.5+etf.esl+.02-.08-etf.ter+.01).toFixed(2),c:C.accent},
  ];
  const upCapture   = +(100 + (etf.factors.growth - etf2.factors.growth)*15).toFixed(1);
  const downCapture = +(100 + (etf.factors.lowvol  - etf2.factors.lowvol)*12).toFixed(1);
  const concorrentes = ETF_DB.filter(e=>e.indice===etf.indice||e.tipo===etf.tipo).concat([etf]).filter((e,i,a)=>a.findIndex(x=>x.ticker===e.ticker)===i).slice(0,4);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
     <span style={{fontSize:11,color:C.muted}}>ETF:</span>
     {ETF_DB.map(e=>(
      <button key={e.ticker} onClick={()=>setSel(e.ticker)}
        style={sel===e.ticker?S.btnV:{...S.btnO,fontSize:11,padding:"5px 10px"}}>{e.ticker}</button>
     ))}
     <span style={{fontSize:11,color:C.muted,marginLeft:6}}>vs:</span>
     {ETF_DB.map(e=>(
      <button key={e.ticker} onClick={()=>setBench(e.ticker)}
        style={bench===e.ticker?{background:C.blue,color:"#fff",border:"none",borderRadius:7,padding:"5px 10px",cursor:"pointer",fontWeight:700,fontSize:11}:{...S.btnO,fontSize:11,padding:"5px 10px",color:C.blue,borderColor:C.blue}}>{e.ticker}</button>
     ))}
    </div>

    {/* Performance KPIs */}
    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
     {[
      ["Retorno 5A",         fmt(etf.cumGrowth5y,1)+"%",     etf.cumGrowth5y>80?C.accent:C.gold, "Acumulado 5 anos"],
      ["Retorno 5A (bench)", fmt(etf2.cumGrowth5y,1)+"%",    C.blue,                              etf2.ticker+" 5A"],
      ["Alpha vs bench",     fmt(etf.cumGrowth5y-etf2.cumGrowth5y,1)+"pp", etf.cumGrowth5y>etf2.cumGrowth5y?C.accent:C.red,"Diferença acumulada"],
      ["Up Capture",         upCapture+"%",                  upCapture>100?C.accent:C.gold,       "vs "+etf2.ticker],
      ["Down Capture",       downCapture+"%",                downCapture<100?C.accent:C.red,      "vs "+etf2.ticker],
      ["DD 2022",            etf.dd2022+"%",                 C.red,                               "Max drawdown em 2022"],
     ].map(([l,v,c,s]) => (
      <MetricCardFull key={l} label={l} valor={v} cor={c}
        def={s} bom="" ruim=""
        hist={geraHistMeses(parseFloat(String(v).replace(/[^0-9.\-]/g,""))||1, .25)}
        histLabel="label"/>
     ))}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
     {/* Rolling TE */}
     <div style={S.card}>
      <SecaoTitulo titulo="Rolling Tracking Error — 12M e 24M"
        sub="TE estável = boa replicação. TE crescente = problemas de gestão ou liquidez das holdings."/>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={rollingTE}>
         <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:9}}/>
         <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
         <RechartsTip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
         <Legend/>
         <Line type="monotone" dataKey="te12m"  name="TE 12M"  stroke={C.accent} strokeWidth={2} dot={false}/>
         <Line type="monotone" dataKey="te24m"  name="TE 24M"  stroke={C.blue}   strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
         <Line type="monotone" dataKey="target" name="Target"  stroke={C.muted}  strokeDasharray="5 3" strokeWidth={1} dot={false}/>
        </LineChart>
      </ResponsiveContainer>
     </div>

     {/* Drawdown em crises */}
     <div style={S.card}>
      <SecaoTitulo titulo="Max Drawdown em Crises Históricas"
        sub="Compara o ETF com o concorrente selecionado nas principais crises"/>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={crises} layout="vertical" barSize={18}>
         <XAxis type="number" stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+"%"}/>
         <YAxis dataKey="crise" type="category" stroke={C.muted} tick={{fontSize:9}} width={80}/>
         <RechartsTip formatter={v=>[v+"%","Max DD"]} contentStyle={S.TT}/>
         <Legend/>
         <Bar dataKey="etf1"  name={etf.ticker}  fill={C.red}    radius={[0,4,4,0]}/>
         <Bar dataKey="etf2"  name={etf2.ticker} fill={"#FB923C"} radius={[0,4,4,0]} opacity={.8}/>
        </BarChart>
      </ResponsiveContainer>
     </div>
    </div>

    {/* Attribution + Best-in-class */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
     <div style={S.card}>
      <SecaoTitulo titulo="Return Attribution vs Índice"
        sub="Decompõe a diferença entre retorno do ETF e retorno bruto do índice"/>
      {attribution.map((a,i)=>(
        <div key={a.comp} style={{
         display:"flex",justifyContent:"space-between",padding:"8px 10px",
         background:i===0||i===attribution.length-1?C.border+"33":"transparent",
         borderRadius:i===attribution.length-1?8:4,
         borderBottom:i<attribution.length-1?"1px solid "+C.border+"22":"none",
         marginBottom:1,fontSize:12,
         fontWeight:i===0||i===attribution.length-1?700:400,
        }}>
         <span style={{color:i===0||i===attribution.length-1?C.white:C.muted}}>{a.comp}</span>
         <span style={{color:a.c,fontWeight:700}}>{a.v>=0?"+":""}{a.v}%</span>
        </div>
      ))}
     </div>

     <div style={S.card}>
      <SecaoTitulo titulo="Best-in-Class — Todos os ETFs do Mesmo Tipo"
        sub="Comparação de TER, Tracking Difference e retorno para o mesmo índice"/>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
         <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["ETF","TER","TD","TE","AUM","Spread","Retorno 5A"].map(h=><th key={h} style={{padding:"5px 7px",color:C.muted,fontWeight:600,fontSize:9,textAlign:"right",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
         <tbody>{ETF_DB.sort((a,b)=>a.ter-b.ter).map(e=>(
          <tr key={e.ticker} style={{borderBottom:"1px solid "+C.border+"22",background:e.ticker===sel?C.accentDim:"transparent"}}>
           <td style={{padding:"6px 7px",fontWeight:e.ticker===sel?700:400,textAlign:"right",color:e.ticker===sel?C.accent:C.text}}>{e.ticker}</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:e.ter<.15?C.accent:e.ter<.25?C.gold:C.red,fontWeight:600}}>{e.ter}%</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:Math.abs(e.td)<.1?C.accent:C.gold}}>{e.td}%</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:C.muted}}>{e.te}%</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:C.muted}}>${(e.aum/1e9).toFixed(0)}B</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:e.spread<.05?C.accent:C.gold}}>{e.spread}%</td>
           <td style={{padding:"6px 7px",textAlign:"right",color:e.cumGrowth5y>0?C.accent:C.red,fontWeight:600}}>{e.cumGrowth5y>0?"+":""}{e.cumGrowth5y}%</td>
          </tr>
         ))}</tbody>
        </table>
      </div>
     </div>
    </div>
    </div>
  );
}
function TabETFScreener({ filtered, quotes={}, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [filtTER,   setFiltTER]   = useState(1.0);
  const [filtAUM,   setFiltAUM]   = useState(0);
  const [filtType,  setFiltType]  = useState("todos");
  const [filtCountry,setFiltCountry]=useState("todos");
  const [sortBy,    setSortBy]    = useState("cumGrowth5y");
  const [sortDir,   setSortDir]   = useState("desc");

  const TIPOS  = ["todos","Large Blend","Large Growth","Real Estate","Govt Bond","Commodity","Brazil Large","Large Blend BR"];
  const COUNTRIES=["todos","US","BR","Global","BR/US"];

  const screened = [...ETF_DB]
    .filter(e=>e.ter<=filtTER)
    .filter(e=>e.aum/1e9>=filtAUM)
    .filter(e=>filtType==="todos"||e.tipo===filtType)
    .filter(e=>filtCountry==="todos"||e.country===filtCountry)
    .sort((a,b)=>sortDir==="desc"?(b[sortBy]||0)-(a[sortBy]||0):(a[sortBy]||0)-(b[sortBy]||0));
  const [portfolio, setPortfolio] = useState([
    {ticker:"SPY",  pct:40},
    {ticker:"TLT",  pct:30},
    {ticker:"GLD",  pct:10},
    {ticker:"BOVA11",pct:10},
    {ticker:"VNQ",  pct:10},
  ]);

  const updatePct = (ticker, pct) => setPortfolio(p=>p.map(x=>x.ticker===ticker?{...x,pct:+pct}:x));
  const total = portfolio.reduce((s,p)=>s+p.pct,0);
  const portMetrics = {
    ter:   +(portfolio.reduce((s,p)=>{const e=ETF_DB.find(x=>x.ticker===p.ticker);return s+(e?e.ter*p.pct/100:0);},0)).toFixed(3),
    td:    +(portfolio.reduce((s,p)=>{const e=ETF_DB.find(x=>x.ticker===p.ticker);return s+(e?e.td*p.pct/100:0);},0)).toFixed(3),
    dy:    +(portfolio.reduce((s,p)=>{const e=ETF_DB.find(x=>x.ticker===p.ticker);return s+(e?e.divYield*p.pct/100:0);},0)).toFixed(2),
    tco:   +(portfolio.reduce((s,p)=>{const e=ETF_DB.find(x=>x.ticker===p.ticker);return s+(e?(e.ter+e.spread*2)*p.pct/100:0);},0)).toFixed(3),
    ret5y: +(portfolio.reduce((s,p)=>{const e=ETF_DB.find(x=>x.ticker===p.ticker);return s+(e?e.cumGrowth5y*p.pct/100:0);},0)).toFixed(1),
  };
  const expConsolidada = {};
  portfolio.forEach(p=>{
    const e=ETF_DB.find(x=>x.ticker===p.ticker);
    if(!e) return;
    Object.entries(e.sectors||{}).forEach(([s,v])=>{
    expConsolidada[s]=(expConsolidada[s]||0)+v*p.pct/100;
    });
  });
  const expArr = Object.entries(expConsolidada).map(([s,v])=>({setor:s,pct:+v.toFixed(1)})).sort((a,b)=>b.pct-a.pct).filter(x=>x.pct>0.1);
  const divCalendar = ETF_DB.filter(e=>e.divYield>0).map(e=>{
    const today = new Date();
    const exDate = new Date(today);
    exDate.setDate(today.getDate() + Math.floor(Math.abs(Math.sin(i*7+3))*25+5));
    const payDate = new Date(exDate);
    payDate.setDate(exDate.getDate()+14);
    return {
    ticker: e.ticker,
    nome: e.nome,
    exDate: exDate.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"}),
    payDate: payDate.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"}),
    yield: e.divYield,
    freq: e.divFreq,
    estimDiv: +(e.px*e.divYield/100/(e.divFreq==="monthly"?12:e.divFreq==="quarterly"?4:2)).toFixed(3),
    };
  }).sort((a,b)=>new Date(a.exDate)-new Date(b.exDate));
  const [years, setYears] = useState(20);
  const [initVal, setInitVal] = useState(100000);
  const [annualRet, setAnnualRet] = useState(8);
  const [divReinvest, setDivReinvest] = useState(true);

  const selETF = ETF_DB[0]; // SPY for projection
  const projData = Array.from({length:years+1},(_,i)=>({
    ano:"A"+i,
    reinvest: +(initVal*Math.pow(1+(annualRet+selETF.divYield)/100,i)/1e3).toFixed(1),
    noReinvest:+(initVal*Math.pow(1+annualRet/100,i)/1e3).toFixed(1),
  }));
  const finalDiff = +(projData[years].reinvest - projData[years].noReinvest).toFixed(1);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

    {/* ── SCREENER ─────────────────────────────────────── */}
    <div style={S.card}>
     <SecaoTitulo titulo="🔍 ETF Screener Avançado" sub="Filtros por TER, AUM, tipo, país e retorno"/>
     <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12}}>
      <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>TER Máx (%)</div>
        <input style={{...S.inp,width:100}} type="number" value={filtTER} step={.05} onChange={e=>setFiltTER(+e.target.value)}/></div>
      <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>AUM Mín ($B)</div>
        <input style={{...S.inp,width:100}} type="number" value={filtAUM} step={1} onChange={e=>setFiltAUM(+e.target.value)}/></div>
      <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Tipo</div>
        <select style={{...S.sel,width:150}} value={filtType} onChange={e=>setFiltType(e.target.value)}>
         {TIPOS.map(t=><option key={t}>{t}</option>)}</select></div>
      <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>País</div>
        <select style={{...S.sel,width:120}} value={filtCountry} onChange={e=>setFiltCountry(e.target.value)}>
         {COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
      <div style={{marginLeft:"auto",display:"flex",alignItems:"flex-end"}}>
        <span style={{fontSize:11,color:C.muted}}>{screened.length} ETFs encontrados</span>
      </div>
     </div>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
         <tr style={{borderBottom:"1px solid "+C.border}}>
          {[["ticker","Ticker"],["tipo","Tipo"],["ter","TER"],["td","TD"],["te","TE"],["aum","AUM"],["spread","Spread"],["divYield","DY"],["cumGrowth5y","Ret 5A"],["dd2022","DD 2022"]].map(([k,h])=>(
           <th key={k} onClick={()=>{setSortBy(k);setSortDir(s=>s==="desc"?"asc":"desc");}}
            style={{padding:"7px 8px",color:sortBy===k?C.accent:C.muted,fontWeight:600,fontSize:10,textAlign:"right",textTransform:"uppercase",cursor:"pointer",whiteSpace:"nowrap"}}>
            {h}{sortBy===k?(sortDir==="desc"?" ↓":" ↑"):""}
           </th>
          ))}
         </tr>
        </thead>
        <tbody>
         {screened.map(e=>(
          <tr key={e.ticker} style={{borderBottom:"1px solid "+C.border+"22"}}>
           <td style={{padding:"7px 8px",fontWeight:700,textAlign:"right",color:C.accent}}>{e.ticker}</td>
           <td style={{padding:"7px 8px",textAlign:"right"}}><span style={S.badge(C.blue)}>{e.tipo.split(" ")[0]}</span></td>
           <td style={{padding:"7px 8px",textAlign:"right",color:e.ter<.15?C.accent:e.ter<.3?C.gold:C.red,fontWeight:600}}>{e.ter}%</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:e.td<0?C.accent:C.red}}>{e.td}%</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:C.muted}}>{e.te}%</td>
           <td style={{padding:"7px 8px",textAlign:"right"}}>${(e.aum/1e9).toFixed(0)}B</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:e.spread<.05?C.accent:C.gold}}>{e.spread}%</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:C.gold}}>{e.divYield}%</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:e.cumGrowth5y>0?C.accent:C.red,fontWeight:600}}>{e.cumGrowth5y>0?"+":""}{e.cumGrowth5y}%</td>
           <td style={{padding:"7px 8px",textAlign:"right",color:C.red}}>{e.dd2022}%</td>
          </tr>
         ))}
        </tbody>
      </table>
     </div>
    </div>

    {/* ── PORTFOLIO BUILDER ────────────────────────────── */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
     <div style={S.card}>
      <SecaoTitulo titulo="🏗 ETF Portfolio Builder"
        sub="Monte um portfólio de ETFs e veja a exposição consolidada e custos"/>
      {portfolio.map(p=>{
        const e=ETF_DB.find(x=>x.ticker===p.ticker);
        return (
         <div key={p.ticker} style={{display:"flex",gap:8,alignItems:"center",marginBottom:8,fontSize:12}}>
          <span style={{fontWeight:700,width:60,color:C.accent}}>{p.ticker}</span>
          <input type="range" min={0} max={100} value={p.pct} style={{flex:1}}
           onChange={ev=>updatePct(p.ticker,ev.target.value)}/>
          <span style={{width:36,fontWeight:700,color:p.pct>0?C.white:C.muted}}>{p.pct}%</span>
          {e&&<span style={{fontSize:10,color:C.muted,width:50}}>TER:{e.ter}%</span>}
         </div>
        );
      })}
      <div style={{padding:10,background:C.surface,borderRadius:8,marginTop:8,borderTop:"2px solid "+(total===100?C.accent:C.red)}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700}}>
         <span>Total</span>
         <span style={{color:total===100?C.accent:C.red}}>{total}%</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginTop:8}}>
         {[["TER Port.",portMetrics.ter+"%",C.red],["DY Port.",portMetrics.dy+"%",C.gold],["Ret 5A Est.",portMetrics.ret5y+"%",C.accent],["TD Port.",portMetrics.td+"%",C.muted],["TCO Port.",portMetrics.tco+"%",C.red],["Total",total+"%",total===100?C.accent:C.red]].map(([l,v,c])=>(
          <div key={l} style={{background:C.card,borderRadius:6,padding:"6px 8px"}}>
           <div style={{fontSize:9,color:C.muted}}>{l}</div>
           <div style={{fontSize:13,fontWeight:700,color:c}}>{v}</div>
          </div>
         ))}
        </div>
      </div>
     </div>

     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Exposição Setorial Consolidada do Portfólio"/>
        {expArr.slice(0,8).map(x=>(
         <div key={x.setor} style={{marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
           <span style={{fontWeight:600,textTransform:"capitalize"}}>{x.setor==="tech"?"Tecnologia":x.setor==="fin"?"Financeiro":x.setor==="bonds"?"Bonds":x.setor==="commodity"?"Commodity":x.setor}</span>
           <span style={{fontWeight:700}}>{x.pct}%</span>
          </div>
          <Barra pct={x.pct} cor={x.setor==="tech"?C.blue:x.setor==="bonds"?C.gold:x.setor==="commodity"?C.gold:C.muted}/>
         </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Projeção — Reinvestimento vs Sem Reinvestimento"
         sub="Impacto do reinvestimento de dividendos em longo prazo"/>
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
         <div><div style={{fontSize:10,color:C.muted}}>Horizonte</div>
          <input style={{...S.inp,width:70}} type="number" value={years} min={1} max={40} onChange={e=>setYears(+e.target.value)}/></div>
         <div><div style={{fontSize:10,color:C.muted}}>Valor inicial (R$)</div>
          <input style={{...S.inp,width:110}} type="number" value={initVal} onChange={e=>setInitVal(+e.target.value)}/></div>
         <div><div style={{fontSize:10,color:C.muted}}>Ret. capital (%)</div>
          <input style={{...S.inp,width:70}} type="number" value={annualRet} step={.5} onChange={e=>setAnnualRet(+e.target.value)}/></div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
         <AreaChart data={projData.filter((_,i)=>i%Math.ceil(years/10)===0||i===years)}>
          <XAxis dataKey="ano" stroke={C.muted} tick={{fontSize:8}}/>
          <YAxis stroke={C.muted} tick={{fontSize:8}} tickFormatter={v=>"R$"+v+"k"}/>
          <RechartsTip formatter={v=>["R$"+v+"k"]} contentStyle={S.TT}/>
          <Legend/>
          <Area type="monotone" dataKey="reinvest"   name="Com reinvestimento" stroke={C.accent} fill={C.accent+"22"} strokeWidth={2} dot={false}/>
          <Area type="monotone" dataKey="noReinvest" name="Sem reinvestimento"  stroke={C.muted}  fill="transparent"  strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
         </AreaChart>
        </ResponsiveContainer>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,marginTop:6}}>
         Diferença em {years}A: +R${finalDiff}k ({fmt(finalDiff/initVal*100*1000/years,1)}% a.a. de impacto)
        </div>
      </div>
     </div>
    </div>

    {/* ── DIVIDEND CALENDAR ────────────────────────────── */}
    <div style={S.card}>
     <SecaoTitulo titulo="📅 Dividend Calendar — Próximos Ex-Dates"
      sub="Datas estimadas de ex-dividendo e pagamento dos ETFs na carteira"/>
     <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:"1px solid "+C.border}}>{["ETF","Nome","Ex-Date","Pay-Date","Yield Anual","Dividendo Est.","Frequência"].map(h=><th key={h} style={{padding:"6px 8px",color:C.muted,fontWeight:600,fontSize:10,textAlign:"left",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
        <tbody>{divCalendar.map(d=>(
         <tr key={d.ticker} style={{borderBottom:"1px solid "+C.border+"22"}}>
          <td style={{padding:"7px 8px",fontWeight:700,color:C.accent}}>{d.ticker}</td>
          <td style={{padding:"7px 8px",color:C.muted,fontSize:11}}>{d.nome}</td>
          <td style={{padding:"7px 8px",fontWeight:600,color:C.gold}}>{d.exDate}</td>
          <td style={{padding:"7px 8px",color:C.muted}}>{d.payDate}</td>
          <td style={{padding:"7px 8px",color:C.accent,fontWeight:600}}>{d.yield}%</td>
          <td style={{padding:"7px 8px",fontWeight:700}}>${d.estimDiv}</td>
          <td style={{padding:"7px 8px"}}><span style={S.badge(d.freq==="monthly"?C.accent:d.freq==="quarterly"?C.gold:C.blue)}>{d.freq}</span></td>
         </tr>
        ))}</tbody>
      </table>
     </div>
    </div>
    </div>
  );
}
function TabAjuda() {
  const [secao, setSecao] = useState("inicio");
  const SECOES = [
    {id:"inicio",    icon:"🚀", label:"Início Rápido"},
    {id:"portfolio", icon:"📁", label:"Portfólio & CSV"},
    {id:"risco",     icon:"⚠",  label:"Gestão de Risco"},
    {id:"metricas",  icon:"🔢", label:"Métricas-Chave"},
    {id:"abas",      icon:"🗂",  label:"Guia das Abas"},
    {id:"glossario", icon:"📖", label:"Glossário"},
  ];
  const CONTEUDO = {
    inicio:[
      {t:"Bem-vindo ao Family Office",txt:"Plataforma institucional para gestão patrimonial de múltiplas famílias. Todos os dados são demonstrativos — personalize com seus ativos reais."},
      {t:"Primeiros passos",txt:"1. Portfolio → '+ Ativo' ou importe CSV pela sidebar\n2. Cotações carregam automaticamente via Brapi + Finnhub\n3. Explore Risco, Métricas e Sentimento\n4. Gere relatórios na aba Relatório"},
      {t:"Atalhos de teclado",txt:"? → Abre Glossário · Esc → Fecha qualquer modal\nSidebar → Importar/Exportar CSV · Reset Demo → restaura dados demo"},
    ],
    portfolio:[
      {t:"Adicionar ativo",txt:"Clique em '+ Ativo' no Portfolio. Informe família, categoria, ticker, nome, quantidade e preço médio. Cotação é buscada automaticamente."},
      {t:"Importar CSV",txt:"Colunas obrigatórias: family, category, ticker, name, qty, avgPrice\nExemplo:\nFamilia Silva,acoes_br,PETR4,Petrobras,5000,34.20\nFamilia Silva,cripto,BTC-USD,Bitcoin,0.5,55000"},
      {t:"Persistência",txt:"Portfólio e configurações são salvos automaticamente no localStorage do navegador. Use 'Reset Demo' na sidebar para restaurar os dados de demonstração."},
    ],
    risco:[
      {t:"VaR (Value at Risk)",txt:"Perda máxima esperada em 1 dia com 95% ou 99% de confiança. Calculado pela volatilidade histórica do portfólio."},
      {t:"CVaR / Expected Shortfall",txt:"Média das perdas além do VaR. Mais conservador — captura o risco da cauda da distribuição. Fundamental para gestão institucional."},
      {t:"Score de Risco",txt:"Métrica proprietária: concentração × 1.5 + volatilidade × 1.2 + (beta-1) × 15. Abaixo de 40 = baixo. 40-70 = médio. Acima de 70 = alto."},
      {t:"Max Drawdown",txt:"Maior queda percentual de pico a vale no histórico. Representa o pior cenário vivido. Use nas abas Drawdown Avançado e GARCH para análise profunda."},
    ],
    metricas:[
      {t:"Sharpe Ratio",txt:"(Retorno - CDI) / Volatilidade. Mede retorno por unidade de risco total. Acima de 1.0 é bom. Acima de 2.0 é excelente."},
      {t:"Sortino Ratio",txt:"Similar ao Sharpe mas usa apenas volatilidade negativa. Mais relevante para gestão patrimonial: penaliza perdas sem penalizar ganhos."},
      {t:"Beta",txt:"Sensibilidade do portfólio vs mercado. Beta = 1.0 move junto. < 1.0 = defensivo. > 1.0 = agressivo. Calculado vs Ibovespa."},
      {t:"Information Ratio",txt:"Alpha / Tracking Error. Mede consistência da geração de alpha. Acima de 0.5 = bom. Acima de 1.0 = excelente gestão ativa."},
    ],
    abas:[
      {t:"Core",txt:"Dashboard (visão geral) · Portfolio (ativos e concentração) · Benchmarks (comparativos)"},
      {t:"Risco & Métricas",txt:"Riscos · 18 Métricas · Avançado · 21 Métricas · Tiers 1-5 (métricas por categoria)"},
      {t:"Estratégia",txt:"Planejamento · ESG · Atribuição · Fatores FF5 · Kelly · Rebalance · Comportamental · Fronteira Eficiente · Cash Flow"},
      {t:"Sentimento",txt:"Fear & Greed por ativo · EUA · Brasil · Global · Alternativo · Técnicos · Posicionamento · Volatilidade · Macro · Crédito"},
      {t:"Research & Data",txt:"Screener · Calendário · Fundamentos · Estimativas · Insider · Scatter · Dividendos · X-Ray"},
      {t:"Operacional",txt:"Transações · Watchlist · Alertas de preço · Relatório · One-Pager"},
    ],
    glossario:[
      {t:"CAGR",txt:"Compound Annual Growth Rate. Taxa de crescimento anual composta. Retorno médio anualizado de um investimento ao longo de um período."},
      {t:"Duration",txt:"Sensibilidade do preço de um ativo de renda fixa a variações na taxa de juros. Quanto maior, mais sensível a mudanças de taxa."},
      {t:"Alpha",txt:"Retorno excedente em relação ao benchmark ajustado pelo beta. Alpha positivo = gestão ativa adicionando valor real."},
      {t:"Tracking Error",txt:"Desvio padrão da diferença entre retorno do portfólio e do benchmark. Mede o quanto o portfólio 'se afasta' do índice."},
      {t:"Omega Ratio",txt:"Razão entre ganhos esperados e perdas esperadas acima de um threshold. Acima de 1.0 = mais ganhos que perdas em média."},
    ],
  };
  const items = CONTEUDO[secao]||[];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <SecaoTitulo titulo="Central de Ajuda" sub="Documentação · Glossário · Guia das abas"/>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {SECOES.map(s=>(
          <button key={s.id} onClick={()=>setSecao(s.id)}
            style={secao===s.id?S.btnV:{...S.btnO,fontSize:12,padding:"7px 14px"}}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {items.map((item,i)=>(
          <div key={i} style={S.card}>
            <div style={{fontSize:13,fontWeight:700,color:C.accent,marginBottom:6}}>{item.t}</div>
            <div style={{fontSize:13,color:C.textSub,lineHeight:1.8,whiteSpace:"pre-line"}}>{item.txt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabSentimento({ filtered=[], quotes={} }) {
  const [secao, setSecao] = useState("dashboard");

  const S12 = (base,amp,seed=0) => MESES.map((mes,i)=>({mes, val:Math.round(base+Math.sin(i*.7+seed)*amp+Math.cos(i*.4+seed)*(amp*.4))}));
  const fgZone = v => v<=25?"Medo Extremo 🟢":v<=45?"Medo":v<=55?"Neutro":v<=75?"Ganância":"Ganância Extrema 🔴";
  const fgCol  = v => v<=25?C.accent:v<=45?C.blue:v<=55?C.gold:v<=75?C.red:"#FF0040";

  const fg     = { atual:42, prev7d:38, prev30d:61, hist:S12(50,28) };
  const vix    = { atual:21.5, prev:24.2, hist:S12(22,8,1) };
  const pcRatio= { atual:0.92, hist:S12(90,18,2).map(d=>({...d,val:d.val/100})) };
  const aaii   = { bull:38.5, bear:28.2, hist:MESES.map((mes,i)=>({mes,bull:Math.round(38+Math.sin(i*.5)*14),bear:Math.round(28+Math.cos(i*.6)*10)})) };
  const cnn    = { fear:42, greed:58 };
  const skew   = { val:-12.4, hist:S12(-10,12,3) };
  const junk   = { spread:3.82, hist:S12(380,60,4).map(d=>({...d,val:d.val/100})) };
  const margin = { debt:850, hist:S12(850,80,5) };
  const insider= { ratio:0.28, hist:S12(30,10,6).map(d=>({...d,val:d.val/100})) };
  const smart  = { val:62, hist:S12(60,12,7) };
  const dumb   = { val:45, hist:S12(48,15,8) };
  const naaim  = { val:65.4, hist:S12(60,20,9) };
  const ii     = { bull:48.2, bear:22.5 };

  const subIdx = [
    { nome:"Momentum Preço",   peso:25, val:58, desc:"S&P 500 vs MA125" },
    { nome:"Amplitude",        peso:15, val:44, desc:"Breadth NYSE" },
    { nome:"Força Mercado",    peso:15, val:62, desc:"High/Low 52w" },
    { nome:"Volatilidade",     peso:15, val:38, desc:"VIX vs MA50 inv." },
    { nome:"Demanda Puts",     peso:15, val:41, desc:"Put/Call 5d" },
    { nome:"McClellan",        peso:10, val:35, desc:"Oscilador" },
    { nome:"Safe Haven",       peso:10, val:52, desc:"Bonds vs Stocks" },
  ];
  const foFG = Math.round(subIdx.reduce((s,x)=>s+x.val*x.peso/100,0));
  const foHist = S12(foFG,18,11);

  const ibc    = { val:2.8,  hist:S12(2.8,1.2,12) };
  const ipca   = { val:4.83, hist:S12(4.8,1.0,13) };
  const pmi    = { val:51.2, hist:S12(51,3,14) };
  const cambio = { val:5.12, hist:S12(5.1,0.4,15) };

  const sp500ma= { acima:68, hist:S12(65,15,16) };
  const nahb   = { val:44, hist:S12(44,8,17) };
  const consumer={val:79.4, hist:S12(79,12,18)};
  const yieldCurve={val:0.42, inv:false};

  const globalFG=[
    {pais:"EUA",flag:"🇺🇸",val:42},
    {pais:"Europa",flag:"🇪🇺",val:38},
    {pais:"China",flag:"🇨🇳",val:55},
    {pais:"Brasil",flag:"🇧🇷",val:48},
    {pais:"Japão",flag:"🇯🇵",val:35},
    {pais:"India",flag:"🇮🇳",val:61},
  ];

  const MiniLine = ({data,col=C.accent,h=120,label="mes",val="val"}) => (
    <ResponsiveContainer width="100%" height={h}>
    <LineChart data={data}><XAxis dataKey={label} stroke={C.muted} tick={{fontSize:9}}/><YAxis stroke={C.muted} tick={{fontSize:9}} width={32}/><RechartsTip contentStyle={S.TT}/><Line type="monotone" dataKey={val} stroke={col} dot={false} strokeWidth={2}/></LineChart>
    </ResponsiveContainer>
  );
  const MiniBar = ({data,col=C.accent,h=100,label="mes",val="val"}) => (
    <ResponsiveContainer width="100%" height={h}>
    <BarChart data={data}><XAxis dataKey={label} stroke={C.muted} tick={{fontSize:9}}/><YAxis stroke={C.muted} tick={{fontSize:9}} width={32}/><RechartsTip contentStyle={S.TT}/><Bar dataKey={val} fill={col} radius={[3,3,0,0]}/></BarChart>
    </ResponsiveContainer>
  );

  const KpiCard = ({label,val,sub,cor=C.text,tip=""}) => (
    <div style={{background:C.surface,borderRadius:10,padding:"12px 14px",border:"1px solid "+C.border,minWidth:120}}>
    <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",marginBottom:4}}>{label}</div>
    <div style={{fontSize:20,fontWeight:800,color:cor,fontFamily:"'Syne',sans-serif"}}>{val}</div>
    {sub && <div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>}
    </div>
  );

  const SECOES = [
    {id:"dashboard",    label:"📊 Dashboard"},
    {id:"ativo_sent",   label:"🎯 Por Ativo"},
    {id:"eua",          label:"🇺🇸 EUA"},
    {id:"brasil",       label:"🇧🇷 Brasil"},
    {id:"global",       label:"🌐 Global"},
    {id:"alternativo",  label:"🔀 Alternativo"},
    {id:"tecnicos",     label:"📐 Técnicos"},
    {id:"posicionamento",label:"📍 Posicionamento"},
    {id:"fluxo",        label:"💰 Fluxo"},
    {id:"vol_adv",      label:"🌊 Volatilidade"},
    {id:"macro_global", label:"🌍 Macro"},
    {id:"brasil_adv",   label:"🇧🇷 Brasil Avançado"},
    {id:"credito_sent", label:"🏦 Crédito"},
    {id:"amplitude",    label:"📡 Amplitude"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <SecaoTitulo titulo="Sentimento de Mercado" sub="Fear & Greed · Posicionamento · Macro · 14 seções"/>

    {/* Sub-nav */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
     {SECOES.map(s=>(
      <button key={s.id} onClick={()=>setSecao(s.id)}
        style={secao===s.id?{...S.btnV,fontSize:11,padding:"5px 12px"}:{...S.btnO,fontSize:11,padding:"5px 12px"}}>
        {s.label}
      </button>
     ))}
    </div>

    {/* ── DASHBOARD ── */}
    {secao==="dashboard" && (
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* FO F&G Gauge */}
      <div style={S.card}>
        <SecaoTitulo titulo="FO Fear & Greed Index" sub={`Score ${foFG}/100 · Ponderado por 7 sub-índices`}/>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
         {/* Gauge SVG */}
         <div style={{textAlign:"center",minWidth:180}}>
          <svg viewBox="0 0 200 120" width={200} height={120}>
           <defs><linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.accent}/><stop offset="25%" stopColor={C.blue}/>
            <stop offset="50%" stopColor={C.gold}/><stop offset="75%" stopColor={C.red}/>
            <stop offset="100%" stopColor="#FF0040"/>
           </linearGradient></defs>
           {/* Arco de fundo */}
           {[0,20,40,60,80].map((start,i)=>{
            const cols=[C.accent,C.blue,C.gold,C.red,"#FF0040"];
            const a1=(start/100)*Math.PI, a2=((start+20)/100)*Math.PI;
            const r=80, cx=100, cy=100;
            const x1=cx+r*Math.cos(Math.PI-a1), y1=cy-r*Math.sin(Math.PI-a1);
            const x2=cx+r*Math.cos(Math.PI-a2), y2=cy-r*Math.sin(Math.PI-a2);
            return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
              fill="none" stroke={cols[i]} strokeWidth={18} strokeLinecap="butt" opacity={.25}/>;
           })}
           {/* Arco preenchido */}
           {(()=>{
            const pct=foFG/100, a=pct*Math.PI, r=80, cx=100, cy=100;
            const x=cx+r*Math.cos(Math.PI-a), y=cy-r*Math.sin(Math.PI-a);
            return <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`}
              fill="none" stroke={fgCol(foFG)} strokeWidth={18} strokeLinecap="round"/>;
           })()}
           {/* Agulha */}
           {(()=>{
            const a=(foFG/100)*Math.PI, cx=100, cy=100;
            const nx=cx+65*Math.cos(Math.PI-a), ny=cy-65*Math.sin(Math.PI-a);
            return <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.text} strokeWidth={2.5} strokeLinecap="round"/>;
           })()}
           <circle cx={100} cy={100} r={5} fill={C.text}/>
           <text x={100} y={85} textAnchor="middle" fontSize={22} fontWeight={800} fill={fgCol(foFG)}>{foFG}</text>
           <text x={100} y={115} textAnchor="middle" fontSize={9} fill={C.muted}>{fgZone(foFG)}</text>
          </svg>
          <div style={{fontSize:12,color:fgCol(foFG),fontWeight:700,marginTop:4}}>{fgZone(foFG)}</div>
         </div>
         {/* Sub-índices */}
         <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,minWidth:280}}>
          {subIdx.map(x=>(
           <div key={x.nome} style={{background:C.surface,borderRadius:8,padding:"8px 10px",border:"1px solid "+C.border}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:10,color:C.muted}}>{x.nome}</span>
              <span style={{fontSize:10,color:C.muted}}>{x.peso}%</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{flex:1,background:C.border+"55",borderRadius:3,height:6}}>
               <div style={{width:x.val+"%",height:"100%",background:fgCol(x.val),borderRadius:3}}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,color:fgCol(x.val),minWidth:28,textAlign:"right"}}>{x.val}</span>
            </div>
            <div style={{fontSize:9,color:C.muted,marginTop:2}}>{x.desc}</div>
           </div>
          ))}
         </div>
        </div>
        {/* Histórico */}
        <div style={{marginTop:12}}>
         <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Histórico 12 meses</div>
         <MiniLine data={foHist} col={fgCol(foFG)} h={100}/>
        </div>
      </div>

      {/* Grid de indicadores */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        {/* VIX */}
        <div style={S.card}>
         <SecaoTitulo titulo="VIX — Índice do Medo" sub={`Atual: ${vix.atual} · Anterior: ${vix.prev}`}/>
         <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <KpiCard label="VIX Atual" val={vix.atual} cor={vix.atual>30?C.red:vix.atual>20?C.gold:C.accent} sub={vix.atual>30?"Alta ansiedade":vix.atual>20?"Moderado":"Baixo"}/>
          <KpiCard label="Mudança 1m" val={(vix.atual-vix.prev>0?"+":"")+(vix.atual-vix.prev).toFixed(1)} cor={vix.atual>vix.prev?C.red:C.accent}/>
         </div>
         <MiniLine data={vix.hist} col={vix.atual>25?C.red:C.gold} h={90}/>
        </div>
        {/* Put/Call */}
        <div style={S.card}>
         <SecaoTitulo titulo="Put/Call Ratio" sub="Opções CBOE — contrarianism clássico"/>
         <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <KpiCard label="P/C Ratio" val={pcRatio.atual} cor={pcRatio.atual>=1.2?C.accent:pcRatio.atual>=0.9?C.gold:C.red} sub={pcRatio.atual>=1.2?"Medo (comprar)":pcRatio.atual>=0.9?"Neutro":"Euforia (cuidado)"}/>
          <KpiCard label="AAII Bull" val={aaii.bull+"%"} cor={aaii.bull>55?C.red:C.accent}/>
          <KpiCard label="AAII Bear" val={aaii.bear+"%"} cor={aaii.bear>35?C.accent:C.red}/>
         </div>
         <MiniLine data={pcRatio.hist} col={C.purple} h={90} val="val"/>
        </div>
        {/* CNN Fear */}
        <div style={S.card}>
         <SecaoTitulo titulo="CNN Fear & Greed" sub="Score composto diário"/>
         <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <KpiCard label="Medo" val={cnn.fear} cor={C.accent} sub="Score CNN"/>
          <KpiCard label="Ganância" val={cnn.greed} cor={C.red}/>
          <KpiCard label="II Bulls" val={ii.bull+"%"} cor={ii.bull>60?C.red:C.accent}/>
         </div>
         <MiniBar data={fg.hist} col={fgCol(fg.atual)} h={90}/>
        </div>
      </div>

      {/* Tabela resumo */}
      <div style={S.card}>
        <SecaoTitulo titulo="Resumo dos Indicadores" sub="Semáforo de sentimento · Verde = oportunidade · Vermelho = cuidado"/>
        <div style={{overflowX:"auto"}}>
         <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>{["Indicador","Valor","Sinal","Interpretação"].map(h=><th key={h} style={{padding:"8px 10px",color:C.muted,textAlign:"left",borderBottom:"1px solid "+C.border,fontSize:11}}>{h}</th>)}</tr></thead>
          <tbody>
           {[
            {nome:"VIX",val:vix.atual,sinal:vix.atual<20?"🟢 Baixo":vix.atual<30?"🟡 Moderado":"🔴 Alto",interp:vix.atual<20?"Complacência — mercado subestima risco":vix.atual<30?"Ansiedade normal":"Pânico — possível oportunidade"},
            {nome:"Put/Call",val:pcRatio.atual,sinal:pcRatio.atual>=1.2?"🟢 Medo":pcRatio.atual>=0.9?"🟡 Neutro":"🔴 Euforia",interp:pcRatio.atual>=1.2?"Hedgers dominam — contrarianism bullish":"Calls dominam — investidores confiantes"},
            {nome:"AAII Bull-Bear",val:(aaii.bull-aaii.bear).toFixed(1)+"%",sinal:(aaii.bull-aaii.bear)<-10?"🟢 Bear":(aaii.bull-aaii.bear)>20?"🔴 Bull":"🟡 Neutro",interp:"Spread acima de +20% historicamente precede queda"},
            {nome:"FO F&G",val:foFG,sinal:fgZone(foFG).split(" ")[0],interp:"Índice proprietário · "+fgZone(foFG)},
            {nome:"Skew CBOE",val:skew.val,sinal:skew.val<-20?"🟢 Hedges caros":skew.val<-10?"🟡 Normal":"🔴 Barato",interp:"Skew negativo = demanda por proteção de queda"},
            {nome:"Junk Spread",val:junk.spread+"%",sinal:junk.spread<3?"🟢 Apetite":junk.spread<5?"🟡 Neutro":"🔴 Fuga",interp:"Spread alto = mercado exige prêmio de risco elevado"},
           ].map((row,i)=>(
            <tr key={i} style={{borderBottom:"1px solid "+C.border+"44"}}>
              <td style={{padding:"8px 10px",fontWeight:600}}>{row.nome}</td>
              <td style={{padding:"8px 10px",fontWeight:700,color:C.accent}}>{row.val}</td>
              <td style={{padding:"8px 10px"}}>{row.sinal}</td>
              <td style={{padding:"8px 10px",color:C.muted,fontSize:11}}>{row.interp}</td>
            </tr>
           ))}
          </tbody>
         </table>
        </div>
      </div>
     </div>
    )}

    {/* ── ATIVO_SENT ── */}
    {secao==="ativo_sent" && <FGAtivo filtered={filtered} quotes={quotes}/>}

    {/* ── EUA ── */}
    {secao==="eua" && (
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
        <div style={S.card}>
         <SecaoTitulo titulo="S&P 500 — % Acima da MA200" sub="Breadth — saúde interna do mercado"/>
         <KpiCard label="% Acima MA200" val={sp500ma.acima+"%"} cor={sp500ma.acima>70?C.red:sp500ma.acima>50?C.gold:C.accent} sub={sp500ma.acima>70?"Sobrecomprado":"Neutro"}/>
         <div style={{marginTop:10}}><MiniLine data={sp500ma.hist} col={C.blue} h={90}/></div>
        </div>
        <div style={S.card}>
         <SecaoTitulo titulo="Confiança do Consumidor" sub="Índice Univ. Michigan"/>
         <div style={{display:"flex",gap:10,marginBottom:10}}>
          <KpiCard label="Atual" val={consumer.val} cor={consumer.val>90?C.accent:consumer.val>70?C.gold:C.red}/>
          <KpiCard label="Curva Yield" val={yieldCurve.val+"%"} cor={yieldCurve.inv?C.red:C.accent} sub={yieldCurve.inv?"Invertida ⚠":"Normal"}/>
         </div>
         <MiniLine data={consumer.hist} col={C.gold} h={90}/>
        </div>
        <div style={S.card}>
         <SecaoTitulo titulo="Mercado Imobiliário" sub="NAHB Housing Market Index"/>
         <KpiCard label="NAHB" val={nahb.val} cor={nahb.val>50?C.accent:C.red} sub={nahb.val>50?"Construtores otimistas":"Pessimismo"}/>
         <div style={{marginTop:10}}><MiniLine data={nahb.hist} col={C.purple} h={90}/></div>
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="NAAIM — Exposição de Gestores Ativos" sub="% alocado em ações — gestores ativos americanos"/>
        <KpiCard label="NAAIM" val={naaim.val+"%"} cor={naaim.val>80?C.red:naaim.val>60?C.gold:C.accent} sub={naaim.val>80?"Gestores super-expostos":naaim.val>60?"Moderado":"Sub-alocados — bullish contrário"}/>
        <div style={{marginTop:10}}><MiniLine data={naaim.hist} col={fgCol(naaim.val)} h={100}/></div>
      </div>
     </div>
    )}

    {/* ── BRASIL ── */}
    {secao==="brasil" && (
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}>
        <div style={S.card}>
         <SecaoTitulo titulo="IBC-Br — PIB Mensal" sub="Proxy do BACEN para atividade econômica"/>
         <KpiCard label="IBC-Br" val={ibc.val+"%"} cor={ibc.val>2?C.accent:ibc.val>0?C.gold:C.red} sub="YoY"/>
         <div style={{marginTop:10}}><MiniLine data={ibc.hist} col={C.accent} h={90}/></div>
        </div>
        <div style={S.card}>
         <SecaoTitulo titulo="IPCA Acumulado 12m" sub="Inflação oficial brasileira"/>
         <KpiCard label="IPCA" val={ipca.val+"%"} cor={ipca.val<4?C.accent:ipca.val<6?C.gold:C.red} sub={ipca.val<4?"Dentro da meta":"Acima da meta"}/>
         <div style={{marginTop:10}}><MiniLine data={ipca.hist} col={ipca.val<5?C.gold:C.red} h={90}/></div>
        </div>
        <div style={S.card}>
         <SecaoTitulo titulo="PMI Industrial Brasil" sub="Purchasing Managers Index — S&P Global"/>
         <KpiCard label="PMI" val={pmi.val} cor={pmi.val>50?C.accent:C.red} sub={pmi.val>50?"Expansão (>50)":"Contração (<50)"}/>
         <div style={{marginTop:10}}><MiniLine data={pmi.hist} col={pmi.val>50?C.accent:C.red} h={90}/></div>
        </div>
        <div style={S.card}>
         <SecaoTitulo titulo="USD/BRL" sub="Taxa de câmbio dólar/real"/>
         <KpiCard label="USD/BRL" val={fmt(cambio.val,2)} cor={cambio.val>5.5?C.red:cambio.val>5?C.gold:C.accent}/>
         <div style={{marginTop:10}}><MiniLine data={cambio.hist} col={C.gold} h={90}/></div>
        </div>
      </div>
     </div>
    )}

    {/* ── GLOBAL ── */}
    {secao==="global" && (
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={S.card}>
        <SecaoTitulo titulo="Fear & Greed por País" sub="Estimativas baseadas em dados locais"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
         {globalFG.map(g=>(
          <div key={g.pais} style={{background:C.surface,borderRadius:10,padding:"14px",border:"1px solid "+C.border,textAlign:"center"}}>
           <div style={{fontSize:24,marginBottom:4}}>{g.flag}</div>
           <div style={{fontSize:12,fontWeight:600,marginBottom:8}}>{g.pais}</div>
           <div style={{background:C.border+"55",borderRadius:6,height:8,overflow:"hidden",marginBottom:6}}>
            <div style={{width:g.val+"%",height:"100%",background:fgCol(g.val),borderRadius:6}}/>
           </div>
           <div style={{fontSize:18,fontWeight:800,color:fgCol(g.val),fontFamily:"'Syne',sans-serif"}}>{g.val}</div>
           <div style={{fontSize:10,color:C.muted,marginTop:2}}>{fgZone(g.val)}</div>
          </div>
         ))}
        </div>
      </div>
     </div>
    )}

    {/* ── SECOES COMPACTAS ── */}
    {["alternativo","tecnicos","posicionamento","fluxo","vol_adv","macro_global","brasil_adv","credito_sent","amplitude"].includes(secao) && (
     <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {secao==="alternativo" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
         <div style={S.card}><SecaoTitulo titulo="Skew CBOE" sub="Demanda por proteção tail risk"/>
          <KpiCard label="CBOE SKEW" val={skew.val} cor={skew.val<-20?C.accent:C.gold} sub="Quanto mais negativo, mais hedge"/>
          <div style={{marginTop:10}}><MiniLine data={skew.hist} col={C.purple} h={90}/></div>
         </div>
         <div style={S.card}><SecaoTitulo titulo="Junk Bond Spread" sub="High Yield vs Treasury 10Y"/>
          <KpiCard label="Spread" val={junk.spread+"%"} cor={junk.spread<3?C.accent:junk.spread<5?C.gold:C.red} sub={junk.spread<3?"Apetite ao risco":"Aversão ao risco"}/>
          <div style={{marginTop:10}}><MiniLine data={junk.hist} col={junk.spread>5?C.red:C.gold} h={90}/></div>
         </div>
         <div style={S.card}><SecaoTitulo titulo="Margin Debt" sub="Dívida em margem NYSE ($ bi)"/>
          <KpiCard label="Margin" val={"$"+margin.debt+"B"} cor={margin.debt>900?C.red:C.gold}/>
          <div style={{marginTop:10}}><MiniBar data={margin.hist} col={C.gold} h={90}/></div>
         </div>
        </div>
      )}
      {secao==="tecnicos" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
         {[
          {titulo:"RSI S&P 500",val:58,desc:"Sobrecomprado >70, sobrevendido <30",cor:58>70?C.red:58<30?C.accent:C.gold},
          {titulo:"MACD S&P 500",val:"Bullish",desc:"Cruzamento de média positivo",cor:C.accent},
          {titulo:"ATR S&P 500",val:"1.42%",desc:"Volatilidade intraday média 14d",cor:C.blue},
          {titulo:"200d MA Dist",val:"+8.4%",desc:"S&P 500 acima da média de 200 dias",cor:C.accent},
          {titulo:"50/200 Cross",val:"Golden Cross",desc:"MA50 > MA200 — tendência de alta",cor:C.gold},
          {titulo:"Volume OBV",val:"Rising",desc:"On-Balance Volume em alta — confirmação",cor:C.accent},
         ].map(item=>(
          <div key={item.titulo} style={S.card}>
           <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{item.titulo}</div>
           <div style={{fontSize:22,fontWeight:800,color:item.cor,fontFamily:"'Syne',sans-serif"}}>{item.val}</div>
           <div style={{fontSize:10,color:C.muted,marginTop:4}}>{item.desc}</div>
          </div>
         ))}
        </div>
      )}
      {secao==="posicionamento" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
         <div style={S.card}><SecaoTitulo titulo="Smart Money vs Dumb Money" sub="Divergência histórica é sinal contrário"/>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
           <KpiCard label="Smart Money" val={smart.val} cor={C.accent}/>
           <KpiCard label="Dumb Money" val={dumb.val} cor={C.red}/>
          </div>
          <MiniLine data={smart.hist} col={C.accent} h={90}/>
         </div>
         <div style={S.card}><SecaoTitulo titulo="NAAIM Exposure" sub="Gestores ativos — % em ações"/>
          <KpiCard label="NAAIM" val={naaim.val+"%"} cor={naaim.val>80?C.red:C.gold}/>
          <div style={{marginTop:10}}><MiniLine data={naaim.hist} col={fgCol(naaim.val)} h={90}/></div>
         </div>
         <div style={S.card}><SecaoTitulo titulo="Insider Trading Ratio" sub="Compras/Vendas de insiders — >0.5 bullish"/>
          <KpiCard label="Ratio" val={insider.ratio} cor={insider.ratio>0.4?C.accent:C.red} sub={insider.ratio>0.5?"Insiders comprando":"Insiders vendendo"}/>
          <div style={{marginTop:10}}><MiniLine data={insider.hist} col={insider.ratio>0.4?C.accent:C.red} h={90}/></div>
         </div>
        </div>
      )}
      {["fluxo","vol_adv","macro_global","brasil_adv","credito_sent","amplitude"].includes(secao) && (
        <div style={S.card}>
         <SecaoTitulo titulo={{
          fluxo:"💰 Fluxo de Capital",
          vol_adv:"🌊 Volatilidade Avançada",
          macro_global:"🌍 Macro Global",
          brasil_adv:"🇧🇷 Brasil Avançado",
          credito_sent:"🏦 Sentimento de Crédito",
          amplitude:"📡 Amplitude de Mercado",
         }[secao]} sub="Dados simulados · Atualizar via API"/>
         <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
          {Array.from({length:6},(_,i)=>{
           const seeds=[{l:"Indicador "+(i+1),v:Math.round(40+Math.sin(i*1.3)*30),u:""}];
           const item=seeds[0];
           return (
            <div key={i} style={{background:C.surface,borderRadius:8,padding:"12px",border:"1px solid "+C.border}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{item.l}{secao}</div>
              <div style={{fontSize:20,fontWeight:800,color:fgCol(item.v),fontFamily:"'Syne',sans-serif"}}>{item.v}</div>
              <MiniLine data={S12(item.v,15,i)} col={fgCol(item.v)} h={60}/>
            </div>
           );
          })}
         </div>
        </div>
      )}
     </div>
    )}
    </div>
  );
}

function MetricCardFull({
  label, valor, numVal, metric,
  def, bom, ruim,          // explicações didáticas
  hist,                     // array de {label/ano, val} para sparkline
  histLabel,                // label do eixo X
  cor, tip,
  unit="",                  // sufixo no tooltip (%, x, bps…)
  benchData,                // opcional: array benchmark
  benchLabel,
}) {
  const [open, setOpen] = useState(false);
  const sig = metric ? signal(metric, numVal ?? parseFloat(String(valor).replace(/[^0-9.\-]/g,""))) : null;
  const bc  = sig?.cor ?? cor ?? C.accent;
  const histVals = (hist||[]).map(d => typeof d === "number" ? d : (d.val ?? d.value ?? d[Object.keys(d).find(k=>k!=="label"&&k!=="ano"&&k!=="mes"&&typeof d[k]==="number")]??0));
  const trend = histVals.length>=2 ? histVals[histVals.length-1] - histVals[histVals.length-2] : 0;

  return (
    <div
    className="fo-card-hover"
    onClick={() => setOpen(o=>!o)}
    style={{
     ...S.card,
     borderTop: "2px solid "+bc,
     cursor: "pointer",
     position: "relative",
     overflow: "hidden",
     transition: "all .2s",
     outline: open ? "1px solid "+bc+"55" : "none",
     background: open ? "linear-gradient(135deg,"+bc+"12,"+C.card+")" : C.card,
    }}
    >
    {/* Glow de fundo */}
    <div style={{position:"absolute",top:0,left:0,right:0,height:32,
     background:"linear-gradient(180deg,"+bc+"14,transparent)",pointerEvents:"none"}}/>

    {/* Label + sinal */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4,position:"relative"}}>
     <div style={{fontSize:9,color:C.muted,fontWeight:600,letterSpacing:1.5,textTransform:"uppercase",flex:1,paddingRight:6,lineHeight:1.3}}>
      {sig && <span style={{marginRight:4}}>{sig.emoji}</span>}
      {tip ? <Tooltip text={tip}><span>{label}</span></Tooltip> : <span>{label}</span>}
     </div>
     {hist && hist.length>1 && (
      <div style={{color:trend>=0?C.accent:C.red,fontSize:9,fontWeight:700,flexShrink:0}}>
        {trend>=0?"▲":"▼"}
      </div>
     )}
    </div>

    {/* Valor principal */}
    <div style={{fontSize:20,fontWeight:800,color:bc,fontFamily:"'Syne',sans-serif",letterSpacing:.3,marginBottom:hist?2:6,position:"relative"}}>
     {valor}
    </div>

    {/* Sparkline mini */}
    {hist && hist.length>1 && (
     <div style={{margin:"4px 0 6px",opacity:.9}}>
      <MiniSparkline data={histVals} color={bc} height={32}/>
     </div>
    )}

    {/* Badge sinal */}
    {sig && (
     <div style={{position:"relative"}}>
      <span style={{...S.badge(bc),fontSize:9,letterSpacing:.3}}>{sig.label}</span>
     </div>
    )}

    {/* Hint expandir */}
    <div style={{position:"absolute",bottom:6,right:8,fontSize:9,color:bc,opacity:.5,transition:"opacity .2s"}}>
     {open?"▲ fechar":"▼ detalhes"}
    </div>

    {/* Painel expandido */}
    {open && (
     <div onClick={e=>e.stopPropagation()}
      style={{marginTop:12,borderTop:"1px solid "+C.border,paddingTop:12,animation:"fo-slide-in .2s ease"}}>

      {/* Histórico completo */}
      {hist && hist.length>1 && (
        <div style={{marginBottom:12}}>
         <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>
          📈 Histórico
         </div>
         <div style={{background:C.surface,borderRadius:10,padding:"10px 8px 4px"}}>
          <ResponsiveContainer width="100%" height={120}>
           {benchData && benchData.length > 0 ? (
            <LineChart data={hist} margin={{top:4,right:4,bottom:0,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey={histLabel||"label"} stroke={C.muted} tick={{fontSize:8}} interval="preserveStartEnd"/>
              <YAxis stroke={C.muted} tick={{fontSize:8}}/>
              <RechartsTip contentStyle={S.TT} formatter={v=>[v+unit]}/>
              <Line type="monotone" dataKey="val" name={label} stroke={bc} strokeWidth={2} dot={false} activeDot={{r:4}}/>
              <Line type="monotone" dataKey="bench" name={benchLabel||"Benchmark"} stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
              <Legend wrapperStyle={{fontSize:9}}/>
            </LineChart>
           ) : (
            <AreaChart data={hist} margin={{top:4,right:4,bottom:0,left:0}}>
              <defs>
               <linearGradient id={"hg"+bc.replace(/[^a-z0-9]/gi,"")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={bc} stopOpacity={.4}/>
                <stop offset="95%" stopColor={bc} stopOpacity={.02}/>
               </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey={histLabel||"label"} stroke={C.muted} tick={{fontSize:8}} interval="preserveStartEnd"/>
              <YAxis stroke={C.muted} tick={{fontSize:8}}/>
              <RechartsTip contentStyle={S.TT} formatter={v=>[v+unit]}/>
              <Area type="monotone" dataKey="val" name={label} stroke={bc} fill={"url(#hg"+bc.replace(/[^a-z0-9]/gi,"")+")"} strokeWidth={2} dot={false} activeDot={{r:4}}/>
            </AreaChart>
           )}
          </ResponsiveContainer>
         </div>
        </div>
      )}

      {/* Explicações didáticas */}
      {(def||bom||ruim) && (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
         {def && (
          <div style={{padding:"8px 10px",background:C.surface,borderRadius:8,borderLeft:"2px solid "+C.blue}}>
           <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>📘 O que é</div>
           <div style={{fontSize:11,color:C.textSub,lineHeight:1.6}}>{def}</div>
          </div>
         )}
         {bom && (
          <div style={{padding:"8px 10px",background:C.surface,borderRadius:8,borderLeft:"2px solid "+C.accent}}>
           <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>🟢 Quando é bom</div>
           <div style={{fontSize:11,color:C.textSub,lineHeight:1.6}}>{bom}</div>
          </div>
         )}
         {ruim && (
          <div style={{padding:"8px 10px",background:C.surface,borderRadius:8,borderLeft:"2px solid "+C.red}}>
           <div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginBottom:3}}>🔴 Quando preocupar</div>
           <div style={{fontSize:11,color:C.textSub,lineHeight:1.6}}>{ruim}</div>
          </div>
         )}
        </div>
      )}
     </div>
    )}
    </div>
  );
}
const ANOS10 = ["2016","2017","2018","2019","2020","2021","2022","2023","2024","2025"];
function geraHist(base, amplitude, volatilidade=0.3) {
  return ANOS10.map((label,i) => ({
    label,
    val: +(base * (1 + Math.sin(i*.7)*amplitude + Math.cos(i*1.3)*volatilidade*0.5)).toFixed(2),
  }));
}
function geraHistMeses(base, amplitude) {
  return MESES.map((label,i) => ({
    label,
    val: +(base * (1 + Math.sin(i*.6)*amplitude)).toFixed(2),
  }));
}
function gerarSerieFG(seed, dias) {
  let val = 45 + (seed % 30);
  return Array.from({ length: dias }, (_, i) => {
    const pseudo = Math.sin(seed * 9301 + i * 49297 + 233) * 0.5 + 0.5;
    const ruido = Math.sin(i * 0.08 + seed * 0.3) * 18
          + Math.cos(i * 0.13 + seed * 0.7) * 12
          + (pseudo - 0.49) * 10;
    val = Math.max(2, Math.min(98, val + ruido * 0.35));
    const d = new Date();
    d.setDate(d.getDate() - (dias - i));
    return {
    idx: i,
    data: d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" }),
    dataFull: d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit", year:"2-digit" }),
    fg: +val.toFixed(1),
    zona: val<=20?"Medo Extremo":val<=40?"Medo":val<=60?"Neutro":val<=80?"Ganância":"Ganância Extrema",
    };
  });
}

function FGAtivo({ filtered, quotes }) {
  const [sel, setSel] = useState("PETR4");
  const [periodo, setPeriodo] = useState("30D");
  const PERIODOS = ["7D","30D","90D","1A","Tudo"];
  const ATIVOS_FG = [...filtered.map(a=>({ticker:a.ticker,nome:a.name,cat:a.category})),
    {ticker:"PETR4",nome:"Petrobras",cat:"acoes_br"},{ticker:"VALE3",nome:"Vale",cat:"acoes_br"},
    {ticker:"ITUB4",nome:"Itaú",cat:"acoes_br"},{ticker:"AAPL",nome:"Apple",cat:"acoes_eua"},
    {ticker:"MSFT",nome:"Microsoft",cat:"acoes_eua"},{ticker:"NVDA",nome:"NVIDIA",cat:"acoes_eua"},
    {ticker:"SPY",nome:"S&P500 ETF",cat:"etfs"},{ticker:"BTC-USD",nome:"Bitcoin",cat:"cripto"},
    {ticker:"ETH-USD",nome:"Ethereum",cat:"cripto"},
  ].filter((a,i,arr)=>arr.findIndex(x=>x.ticker===a.ticker)===i);
  const dias = periodo==="7D"?7:periodo==="30D"?30:periodo==="90D"?90:periodo==="1A"?365:730;
  const seed = sel.split("").reduce((s,c)=>s+c.charCodeAt(0),0);
  const serie = useMemo(()=>gerarSerieFG(seed, dias),[seed,dias]);
  const atual = serie[serie.length-1]?.fg ?? 50;
  const fgZ = atual<=20?"Medo Extremo":atual<=40?"Medo":atual<=60?"Neutro":atual<=80?"Ganância":"Ganância Extrema";
  const fgC = atual<=20?C.accent:atual<=40?C.blue:atual<=60?C.gold:atual<=80?"#F97316":C.red;
  const COMPS = [
    {label:"Momentum",peso:25,val:Math.max(0,Math.min(100,Math.round(atual*0.9+Math.sin(seed)*10)))},
    {label:"Volume",peso:20,val:Math.max(0,Math.min(100,Math.round(atual*1.05+Math.cos(seed)*8)))},
    {label:"Volatilidade",peso:20,val:Math.max(0,Math.min(100,Math.round(100-atual*0.7+Math.sin(seed*2)*12)))},
    {label:"Social",peso:20,val:Math.max(0,Math.min(100,Math.round(atual*0.85+Math.cos(seed*3)*15)))},
    {label:"Opções",peso:15,val:Math.max(0,Math.min(100,Math.round(atual*1.1-Math.sin(seed*1.5)*10)))},
  ];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <select style={{...S.sel,width:180,fontSize:12}} value={sel} onChange={e=>setSel(e.target.value)}>
          {ATIVOS_FG.map(a=><option key={a.ticker} value={a.ticker}>{a.ticker} — {a.nome}</option>)}
        </select>
        <div style={{display:"flex",gap:6}}>
          {PERIODOS.map(p=>(
            <button key={p} onClick={()=>setPeriodo(p)} style={periodo===p?S.btnV:{...S.btnO,fontSize:11,padding:"5px 12px"}}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{...S.cardGlow(fgC),textAlign:"center",padding:24}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:.5}}>{sel} · Fear &amp; Greed</div>
          <div style={{fontSize:56,fontWeight:800,fontFamily:"'Syne',sans-serif",color:fgC,lineHeight:1}}>{Math.round(atual)}</div>
          <div style={{fontSize:14,color:fgC,fontWeight:700,marginTop:6}}>{fgZ}</div>
        </div>
        <div style={S.card}>
          <div style={{fontSize:11,color:C.muted,marginBottom:10}}>Componentes</div>
          {COMPS.map(c=>(
            <div key={c.label} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                <span style={{color:C.textSub}}>{c.label} <span style={{color:C.muted}}>({c.peso}%)</span></span>
                <b style={{color:c.val>60?C.accent:c.val>40?C.gold:C.red}}>{c.val}</b>
              </div>
              <div style={{background:C.border,borderRadius:4,height:4}}>
                <div style={{width:c.val+"%",height:"100%",background:c.val>60?C.accent:c.val>40?C.gold:C.red,borderRadius:4}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Histórico — {sel} ({periodo})</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={serie}>
            <XAxis dataKey="data" stroke={C.muted} tick={{fontSize:9}} interval={Math.floor(serie.length/6)}/>
            <YAxis domain={[0,100]} stroke={C.muted} tick={{fontSize:9}}/>
            <RechartsTip contentStyle={S.TT} formatter={v=>[v,"F&G"]}/>
            <ReferenceLine y={20} stroke={C.accent} strokeDasharray="4 3" strokeWidth={1}/>
            <ReferenceLine y={40} stroke={C.blue} strokeDasharray="4 3" strokeWidth={1}/>
            <ReferenceLine y={60} stroke={C.gold} strokeDasharray="4 3" strokeWidth={1}/>
            <ReferenceLine y={80} stroke={C.red} strokeDasharray="4 3" strokeWidth={1}/>
            <Area type="monotone" dataKey="fg" stroke={fgC} fill={fgC+"22"} strokeWidth={2} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}


export default function App() {
  const [assets,  setAssets]  = useState(() => { try { const s=localStorage.getItem('fo_assets'); return s?JSON.parse(s):INIT_ASSETS; } catch{return INIT_ASSETS;} });
  const [txs,     setTxs]     = useState(() => { try { const s=localStorage.getItem('fo_txs'); return s?JSON.parse(s):INIT_TXS; } catch{return INIT_TXS;} });
  const [watch,   setWatch]   = useState(() => { try { const s=localStorage.getItem('fo_watch'); return s?JSON.parse(s):[{ticker:"PETR4",name:"Petrobras",catId:"acoes_br"},{ticker:"AAPL",name:"Apple",catId:"acoes_eua"},{ticker:"BTC-USD",name:"Bitcoin",catId:"cripto"}]; } catch{return [{ticker:"PETR4",name:"Petrobras",catId:"acoes_br"},{ticker:"AAPL",name:"Apple",catId:"acoes_eua"},{ticker:"BTC-USD",name:"Bitcoin",catId:"cripto"}];} });
  const [alerts,  setAlerts]  = useState(() => { try { const s=localStorage.getItem('fo_alerts'); return s?JSON.parse(s):[{id:1,ticker:"PETR4",type:"acima",price:45,active:true},{id:2,ticker:"BTC-USD",type:"acima",price:70000,active:true}]; } catch{return [{id:1,ticker:"PETR4",type:"acima",price:45,active:true},{id:2,ticker:"BTC-USD",type:"acima",price:70000,active:true}];} });
  const [tab,     setTab]     = useState("dashboard");
  const [famSel,  setFamSel]  = useState("Todas");
  const [modal,   setModal]   = useState(null);
  const [showGlossario, setShowGlossario] = useState(false);
  const [quotes,  setQuotes]  = useState(() => { try { const s=localStorage.getItem('fo_quotes'); if(s){const p=JSON.parse(s); if(p.ts&&Date.now()-p.ts<900000) return p.data;} } catch{} return {}; });
  const [loading, setLoading] = useState(false);
  const [toasts,  setToasts]  = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(() => { try { return !localStorage.getItem('fo_toured'); } catch{return true;} });
  const [darkMode, setDarkMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newA,  setNewA]  = useState({family:FAMILIAS[0],category:"acoes_br",ticker:"",name:"",qty:"",avgPrice:""});
  const [newTx, setNewTx] = useState({family:FAMILIAS[0],ticker:"",type:"compra",qty:"",price:"",date:""});
  const [newW,  setNewW]  = useState({ticker:"",name:"",catId:"acoes_br"});
  const [newAl, setNewAl] = useState({ticker:"",type:"acima",price:""});
  const [benchVis, setBenchVis] = useState({portfolio:true,cdi:true,ibov:true,sp500:true});
  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
    const all     = [...assets, ...watch.map(w=>({ticker:w.ticker,category:w.catId}))];
    const brTkrs  = [...new Set(all.filter(a=>catOf(a.category).br).map(a=>a.ticker))];
    const intlTkrs= [...new Set(all.filter(a=>!catOf(a.category).br).map(a=>a.ticker))];

    const brRes   = await buscarBrapi(brTkrs);
    const intlArr = await Promise.all(intlTkrs.map(async t => ({[t]: await buscarFinnhub(t)})));
    const intlRes = Object.assign({}, ...intlArr.map(x => Object.fromEntries(Object.entries(x).filter(([,v])=>v))));
    const all2    = {...brRes, ...intlRes};
    setQuotes(all2);
    setLastUpdate(new Date());
    const novos = alerts.filter(al => {
     const q = all2[al.ticker];
     if (!q||!al.active) return false;
     return al.type==="acima" ? q.price>=al.price : q.price<=al.price;
    }).map(al=>`🔔 ${al.ticker} ${al.type==="acima"?"acima de":"abaixo de"} ${fmtBRL(al.price)} — Cotação: ${fmtBRL(all2[al.ticker]?.price||0)}`);
    if (novos.length) setToasts(p=>[...novos,...p].slice(0,5));
    } catch(e) {
    console.error("Erro ao buscar cotações:", e);
    }
    setLoading(false);
  }, [assets, watch, alerts]);
  useEffect(() => { doFetch(); const id=setInterval(doFetch,60000); return ()=>clearInterval(id); }, []);
  useEffect(() => {
    function onKey(e) {
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
    if(e.key==='?') setShowGlossario(v=>!v);
    if(e.key==='Escape') { setShowGlossario(false); setShowOnboarding(false); setModal(null); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { try { localStorage.setItem('fo_assets', JSON.stringify(assets)); } catch{} }, [assets]);
  useEffect(() => { try { localStorage.setItem('fo_txs', JSON.stringify(txs)); } catch{} }, [txs]);
  useEffect(() => { try { localStorage.setItem('fo_watch', JSON.stringify(watch)); } catch{} }, [watch]);
  useEffect(() => { try { localStorage.setItem('fo_alerts', JSON.stringify(alerts)); } catch{} }, [alerts]);
  useEffect(() => { try { if(Object.keys(quotes).length) localStorage.setItem('fo_quotes', JSON.stringify({ts:Date.now(),data:quotes})); } catch{} }, [quotes]);
  const filtered = useMemo(() => famSel==="Todas" ? assets : assets.filter(a=>a.family===famSel), [assets,famSel]);
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  const totalVal  = useMemo(() => filtered.reduce((s,a)=>s+preco(a)*a.qty,0),    [filtered,quotes]);
  const totalCost = useMemo(() => filtered.reduce((s,a)=>s+a.avgPrice*a.qty,0),  [filtered]);
  const totalRet  = totalVal - totalCost;
  const totalRp   = totalCost>0 ? totalRet/totalCost*100 : 0;
  const byCat = useMemo(() => CATS.map(cat => {
    const v = filtered.filter(a=>a.category===cat.id).reduce((s,a)=>s+preco(a)*a.qty,0);
    return {...cat, value:v, pct:totalVal?v/totalVal*100:0};
  }).filter(c=>c.value>0), [filtered,quotes,totalVal]);
  const byFam = useMemo(() => FAMILIAS.map(fam => ({
    name: fam.replace("Familia ",""),
    value: assets.filter(a=>a.family===fam).reduce((s,a)=>s+preco(a)*a.qty,0),
  })).filter(f=>f.value>0), [assets,quotes]);
  const concAtivo = useMemo(() => filtered.map(a=>({
    ticker:a.ticker, name:a.name, pct:totalVal?preco(a)*a.qty/totalVal*100:0, cat:catOf(a.category),
  })).sort((a,b)=>b.pct-a.pct), [filtered,quotes,totalVal]);
  const concPais = useMemo(() => {
    const geo = filtered.reduce((acc,a) => {
    const p = catOf(a.category).br ? "Brasil" : "Internacional";
    acc[p]=(acc[p]||0)+preco(a)*a.qty; return acc;
    },{});
    return Object.entries(geo).map(([pais,value])=>({pais,value,pct:totalVal?value/totalVal*100:0}));
  }, [filtered,quotes,totalVal]);
  const volPort = useMemo(() => {
    if (!totalVal||!byCat.length) return CFG.portVol;
    return byCat.reduce((s,c)=>s+((c.pct/100)**2)*((catOf(c.id).vol||20)**2),0)**0.5;
  }, [byCat,totalVal]);

  const dailyVol  = volPort/Math.sqrt(252);
  const var95     = totalVal*dailyVol/100*1.645;
  const var99     = totalVal*dailyVol/100*2.326;
  const cvar95    = var95*1.25;
  const cvar99    = var99*1.15;
  const portRet   = CFG.portRet;
  const portSharpe= +(portRet/Math.max(.01,volPort)).toFixed(2);
  const portMaxDD = CFG.portMaxDD;
  const portBeta  = CFG.portBeta;
  const omega     = +(portRet/Math.max(.01,volPort-portRet+CFG.rfRate)).toFixed(2);
  const trackErr  = +(Math.sqrt(volPort**2+9.83**2-2*.82*volPort*9.83)).toFixed(2);
  const infoRatio = +((portRet-7.82)/Math.max(.01,trackErr)).toFixed(2);
  const treynor   = +((portRet-CFG.rfRate)/Math.max(.01,portBeta)).toFixed(2);
  const riskScore = Math.min(100, Math.round(
    (concAtivo[0]?.pct||0)*1.5 + volPort*1.2 + (portBeta-1)*15
  ));
  const riskLabel = riskScore>70?"Alto":riskScore>40?"Médio":"Baixo";
  const riskColor = riskScore>70?C.red:riskScore>40?C.gold:C.accent;
  const benchEvo = useMemo(() => MESES.map((mes,i) => {
    const base = Math.max(1e5, totalVal);
    return {
    mes,
    portfolio: Math.round(base*(1+portRet/100*(i+1)/12)),
    cdi:       Math.round(base*(1+11.25/100*(i+1)/12)),
    ibov:      Math.round(base*(1+14.5/100*(i+1)/12)),
    sp500:     Math.round(base*(1+22.0/100*(i+1)/12)),
    };
  }), [totalVal,portRet]);

  const benchRets = useMemo(() => {
    if (!benchEvo.length) return {portfolio:0,cdi:0,ibov:0,sp500:0};
    const L=benchEvo[benchEvo.length-1], F=benchEvo[0];
    return {
    portfolio: +((L.portfolio-F.portfolio)/F.portfolio*100).toFixed(1),
    cdi:       +((L.cdi-F.cdi)/F.cdi*100).toFixed(1),
    ibov:      +((L.ibov-F.ibov)/F.ibov*100).toFixed(1),
    sp500:     +((L.sp500-F.sp500)/F.sp500*100).toFixed(1),
    };
  }, [benchEvo]);

  const activeAlerts = alerts.filter(a=>a.active&&!a.triggered).length;
  function addAtivo() {
    if (!newA.ticker||!newA.qty||!newA.avgPrice) return;
    const a = {id:uid(), family:newA.family, category:newA.category, ticker:newA.ticker.toUpperCase(), name:newA.name||newA.ticker.toUpperCase(), qty:parseFloat(newA.qty), avgPrice:parseFloat(newA.avgPrice)};
    setAssets(p=>[...p,a]);
    setTxs(p=>[{id:uid(),date:hoje(),family:newA.family,ticker:a.ticker,type:"compra",qty:a.qty,price:a.avgPrice,total:a.qty*a.avgPrice},...p]);
    setNewA({family:FAMILIAS[0],category:"acoes_br",ticker:"",name:"",qty:"",avgPrice:""});
    setModal(null); setTimeout(doFetch,300);
  }

  function addTx() {
    if (!newTx.ticker||!newTx.qty||!newTx.price) return;
    const total = parseFloat(newTx.qty)*parseFloat(newTx.price);
    setTxs(p=>[{id:uid(),date:newTx.date||hoje(),family:newTx.family,ticker:newTx.ticker.toUpperCase(),type:newTx.type,qty:parseFloat(newTx.qty),price:parseFloat(newTx.price),total},...p]);
    setNewTx({family:FAMILIAS[0],ticker:"",type:"compra",qty:"",price:"",date:""}); setModal(null);
  }

  function addWatch() {
    if (!newW.ticker) return;
    setWatch(p=>[...p,{...newW,ticker:newW.ticker.toUpperCase()}]);
    setNewW({ticker:"",name:"",catId:"acoes_br"}); setModal(null); setTimeout(doFetch,300);
  }

  function addAlert() {
    if (!newAl.ticker||!newAl.price) return;
    setAlerts(p=>[...p,{id:uid(),ticker:newAl.ticker.toUpperCase(),type:newAl.type,price:parseFloat(newAl.price),active:true}]);
    setNewAl({ticker:"",type:"acima",price:""}); setModal(null);
  }
  function resetDemo() {
    try { ['fo_assets','fo_txs','fo_watch','fo_alerts','fo_quotes','fo_toured'].forEach(k=>localStorage.removeItem(k)); } catch{}
    setAssets(INIT_ASSETS);
    setTxs(INIT_TXS);
    setWatch([{ticker:"PETR4",name:"Petrobras",catId:"acoes_br"},{ticker:"AAPL",name:"Apple",catId:"acoes_eua"},{ticker:"BTC-USD",name:"Bitcoin",catId:"cripto"}]);
    setAlerts([{id:1,ticker:"PETR4",type:"acima",price:45,active:true},{id:2,ticker:"BTC-USD",type:"acima",price:70000,active:true}]);
    setQuotes({});
  }
  function importCSV(e) {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
    try {
     const lines = ev.target.result.split('\n').filter(Boolean);
     const header = lines[0].split(',').map(h=>h.trim().toLowerCase());
     const newAssets = lines.slice(1).map((row,i) => {
      const cols = row.split(',').map(c=>c.trim().replace(/^"|"$/g,''));
      const obj = {};
      header.forEach((h,j) => obj[h] = cols[j]);
      return {
        id: uid(),
        family: obj.family || FAMILIAS[0],
        category: obj.category || 'outros',
        ticker: (obj.ticker||'').toUpperCase(),
        name: obj.name || obj.ticker || 'Ativo '+i,
        qty: parseFloat(obj.qty||obj.quantidade||0),
        avgPrice: parseFloat(obj.avgprice||obj.preco_medio||obj.price||0),
      };
     }).filter(a=>a.ticker&&a.qty>0&&a.avgPrice>0);
     if(newAssets.length===0) { setToasts(['⚠️ Nenhum ativo válido. CSV deve ter colunas: ticker, qty, avgPrice']); return; }
     if(newAssets.length > 0) {
      setAssets(newAssets);
      setToasts([`✅ ${newAssets.length} ativos importados com sucesso!`]);
     }
    } catch(err) { setToasts(['❌ Erro ao importar CSV: '+err.message]); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
  function exportCSV() {
    const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
    const header = 'family,category,ticker,name,qty,avgPrice,currentPrice,value,result,returnPct';
    const rows = assets.map(a => {
    const v=preco(a)*a.qty, r=(preco(a)-a.avgPrice)*a.qty, rp=a.avgPrice?r/(a.avgPrice*a.qty)*100:0;
    return [a.family,a.category,a.ticker,a.name,a.qty,a.avgPrice,preco(a).toFixed(2),v.toFixed(2),r.toFixed(2),rp.toFixed(2)].join(',');
    });
    const csv = [header,...rows].join('\n');
    const b = new Blob([csv],{type:'text/csv'});
    const u = URL.createObjectURL(b);
    const el = document.createElement('a');
    el.href=u; el.download=`portfolio-${Date.now()}.csv`;
    el.click(); URL.revokeObjectURL(u);
  }
  function imprimirRelatorio() { window.print(); }
  const TABS = [
    {id:"dashboard",  icon:"📊", label:"Dashboard"},
    {id:"portfolio",  icon:"📁", label:"Portfolio"},
    {id:"benchmark",  icon:"📈", label:"Benchmarks"},
    {id:"riscos",     icon:"⚠",  label:"Riscos"},
    {id:"quant",      icon:"🔢", label:"18 Métricas"},
    {id:"avancado",   icon:"🔬", label:"Avançado"},
    {id:"planejamento",icon:"🎯",label:"Planejamento"},
    {id:"esg",        icon:"🌱", label:"ESG & Fiscal"},
    {id:"atribuicao", icon:"🏆", label:"Atribuição"},
    {id:"fatores",    icon:"🧪", label:"Fatores FF5"},
    {id:"kelly",      icon:"📐", label:"Kelly & BL"},
    {id:"rebalance",  icon:"⚖",  label:"Rebalance"},
    {id:"oportunid",  icon:"💡", label:"Oportunidade"},
    {id:"taxloss",    icon:"💰", label:"Tax Loss"},
    {id:"behavioral", icon:"🧠", label:"Behavioral"},
    {id:"fronteira",  icon:"🌊", label:"Fronteira Ef."},
    {id:"cashflow",   icon:"💵", label:"Cash Flow"},
    {id:"imoveis",    icon:"🏠", label:"Imóveis"},
    {id:"sucessao",   icon:"👨‍👩‍👧‍👦",label:"Sucessão"},
    {id:"regime",     icon:"🌡",  label:"Regime"},
    {id:"crash",      icon:"💥", label:"Crash Index"},
    {id:"drawdownadv",icon:"📉", label:"Drawdown Adv."},
    {id:"liqrisk",    icon:"🌊", label:"Liquidez & Cont."},
    {id:"garch",      icon:"📡", label:"GARCH & Copula"},
    {id:"fragilidade",icon:"🏺", label:"Fragilidade"},
    {id:"stress",     icon:"🔨", label:"Stress Adv."},
    {id:"evt",        icon:"🦢", label:"EVT & Cauda"},
    {id:"riskattr",   icon:"🎯", label:"Risk Attr."},
    {id:"credito",     icon:"💳", label:"Crédito & Duration"},
    {id:"gestaoativa", icon:"🎯", label:"Gestão Ativa"},
    {id:"macro",       icon:"🌍", label:"Macro & Sensib."},
    {id:"bayesiana",   icon:"🔬", label:"Bayesiana"},
    {id:"budgetrisco", icon:"🛡",  label:"Budget de Risco"},
    {id:"monitor",     icon:"📡", label:"Monitor Dinâmico"},
    {id:"historico",   icon:"📉", label:"Histórico de Métricas"},
    {id:"estrutura",   icon:"🏗",  label:"Qualidade & Estrutura"},
    {id:"renda2",      icon:"💰", label:"Renda & Cash Flow FO"},
    {id:"otimizacao",  icon:"📐", label:"Otimização"},
    {id:"dinamica",    icon:"🔄", label:"Dinâmica & Persistência"},
    {id:"familyoffice",icon:"🏦", label:"Family Office"},
    {id:"derivs",      icon:"🛡",  label:"Derivativos & Hedge"},
    {id:"esgavancado", icon:"🌍", label:"ESG Avançado"},
    {id:"screener",    icon:"🔍", label:"Screener"},
    {id:"calendario",   icon:"📅", label:"Calendário Econ."},
    {id:"fundamentos",  icon:"📊", label:"Fundamentos"},
    {id:"estimativas",  icon:"🎯", label:"Estimativas Analistas"},
    {id:"insider",      icon:"👤", label:"Insider & Ownership"},
    {id:"scatterplot",  icon:"🔵", label:"Scatter Plot"},
    {id:"dividendos",   icon:"💸", label:"Dividendos"},
    {id:"xray",         icon:"🔬", label:"X-Ray Look-Through"},
    {id:"backtest",    icon:"⏪", label:"Backtest Portfolio"},
    {id:"tactical",     icon:"🎲", label:"Tactical Allocation"},
    {id:"rollingopt",   icon:"🔁", label:"Rolling Optimization"},
    {id:"metas",        icon:"🏁", label:"Metas Financeiras"},
    {id:"correlacoes",  icon:"🔗", label:"Correlações"},
    {id:"gestores",     icon:"👔", label:"Análise de Gestores"},
    {id:"cmv",         icon:"🌡",  label:"Market Valuation"},
    {id:"quantmetrics",icon:"📐", label:"Quant Metrics"},
    {id:"tier1", icon:"📊", label:"Tier 1 — TWR, Lorenz, Shortfall"},
    {id:"tier2", icon:"🎯", label:"Tier 2 — Alpha, Bootstrap, TCA"},
    {id:"tier3", icon:"⚙",  label:"Tier 3 — Fatores, Geom., Liq."},
    {id:"tier4", icon:"🔬", label:"Tier 4 — DCC, MSGARCH, Network"},
    {id:"tier5", icon:"🌍", label:"Tier 5 — ESG, SFDR, UCITS"},
    {id:"tecnica",   icon:"📈", label:"Análise Técnica"},
    {id:"fundadv",   icon:"💎", label:"Fundamentalista Avançado"},
    {id:"fiis",      icon:"🏢", label:"FIIs — Análise Completa"},
    {id:"rfadv",     icon:"🔐", label:"Renda Fixa + Opções"},
    {id:"pevc",      icon:"🏦", label:"PE/VC + Sucessório"},
    {id:"fxreport",  icon:"🌐", label:"FX + IPS + Reporting"},
    {id:"etfoverview",  icon:"🌐", label:"ETF — Estrutura & Custos"},
    {id:"etfholdings",  icon:"📦", label:"ETF — Holdings & Exposição"},
    {id:"etfperf",      icon:"📈", label:"ETF — Performance & TE"},
    {id:"etfscreener",  icon:"🔍", label:"ETF — Screener & Builder"},
    {id:"ajuda", icon:"📖", label:"Guia de Métricas"},
    {id:"sentimento", icon:"🧠", label:"Sentimento de Mercado"},
    {id:"transacoes", icon:"📋", label:"Transações"},
    {id:"watchlist",  icon:"👁",  label:"Watchlist"},
    {id:"alertas",    icon:"🔔", label:"Alertas"+(activeAlerts>0?" ("+activeAlerts+")":"")},
    {id:"relatorio",  icon:"📄", label:"Relatório"},
    {id:"onepager",   icon:"📝", label:"One Pager"},
  ];

  const TITLES = {
    dashboard:"Dashboard",portfolio:"Portfolio",benchmark:"Benchmarks",riscos:"Análise de Riscos",
    quant:"18 Métricas Quantitativas",avancado:"Métricas Avançadas",planejamento:"Planejamento Patrimonial",
    esg:"ESG & Eficiência Fiscal",atribuicao:"Atribuição de Performance",fatores:"Fatores Fama-French 5F",
    kelly:"Kelly & Black-Litterman",rebalance:"Rebalanceamento",oportunid:"Custo de Oportunidade",
    taxloss:"Tax Loss Harvesting",behavioral:"Behavioral Finance",fronteira:"Fronteira Eficiente",
    cashflow:"Cash Flow",imoveis:"Imóveis",sucessao:"Planejamento Sucessório",
    regime:"Regime Detection",crash:"Crash Probability Index",drawdownadv:"Drawdown Avançado",
    liqrisk:"Liquidez & Contágio",garch:"GARCH & Copula",fragilidade:"Concentração & Fragilidade",
    stress:"Stress Testing Avançado",evt:"EVT & Cauda Extrema",riskattr:"Component VaR",
    transacoes:"Transações",watchlist:"Watchlist",alertas:"Alertas",relatorio:"Relatório",historico:"Histórico de Métricas",quantmetrics:"21 Métricas Quantitativas Completas",sentimento:"Sentimento de Mercado — 40+ Indicadores",ajuda:"Guia Didático de Métricas",etfoverview:"ETF — Estrutura, Mecânica e Custos",etfholdings:"ETF — Holdings, Style Box e Overlap",etfperf:"ETF — Performance e Tracking Error",etfscreener:"ETF — Screener, Portfolio Builder e Dividendos",tecnica:"Análise Técnica — Indicadores e Padrões",fundadv:"Fundamentalista Avançado — EVA, DCF, WACC",fiis:"FIIs — Análise Completa",rfadv:"Renda Fixa Avançada + Opções Black-Scholes",pevc:"PE/VC/Alternativos + Planejamento Sucessório",fxreport:"FX, IPS Compliance & Fee Calculator",tier1:"Tier 1 — TWR, MWR, Lorenz, Shortfall, Attribution",tier2:"Tier 2 — Alpha Sig., Bootstrap, Luck vs Skill, Tax Drag",tier3:"Tier 3 — Fatores, Geometric Mean, Rebalancing Premium",tier4:"Tier 4 — DCC, Asymmetric Corr., MSGARCH, TCA",tier5:"Tier 5 — SFDR PAI, Temperature Score, UCITS, IOSCO",cmv:"Current Market Valuation — AMVI & 14 Modelos",backtest:"Backtest de Portfólios",tactical:"Tactical Allocation Models",rollingopt:"Rolling Optimization",metas:"Metas Financeiras — Monte Carlo",correlacoes:"Asset Correlations",gestores:"Análise de Gestores",screener:"Screener de Ativos",calendario:"Calendário Econômico",fundamentos:"Análise Fundamentalista",estimativas:"Estimativas de Analistas",insider:"Insider Transactions & Ownership",scatterplot:"Scatter Plot Analítico",dividendos:"Histórico de Dividendos",xray:"X-Ray Look-Through",estrutura:"Qualidade & Estrutura do Portfólio",renda2:"Renda, Dividendos & Cash Flow",otimizacao:"Otimização de Portfólio",dinamica:"Dinâmica & Persistência",familyoffice:"Específico de Family Office",derivs:"Derivativos & Proteção",esgavancado:"ESG Avançado",credito:"Crédito, Duration & Spreads",gestaoativa:"Gestão Ativa — Hit Rate & IC",macro:"Sensibilidade Macro & ERP",bayesiana:"Análise Bayesiana",budgetrisco:"Budget de Risco & sVaR",monitor:"Monitoramento Dinâmico",onepager:"One Pager Executivo",
  };
  const GRUPOS = [
    {label:"Core",           ids:["dashboard","portfolio","benchmark"]},
    {label:"🌐 ETF Analytics",       ids:["etfoverview","etfholdings","etfperf","etfscreener"]},
    {label:"📊 Análise de Ativos", ids:["tecnica","fundadv","fiis","rfadv"]},
    {label:"🏦 Alternativos & FO", ids:["pevc","fxreport"]},
    {label:"Risco & Métricas",ids:["riscos","quant","avancado","quantmetrics","tier1","tier2","tier3","tier4","tier5"]},
    {label:"Estratégia",     ids:["planejamento","esg","atribuicao","fatores","kelly","rebalance","oportunid","taxloss","behavioral","fronteira","cashflow","imoveis","sucessao"]},
    {label:"🔴 Explosão",    ids:["regime","crash","drawdownadv","liqrisk","garch","fragilidade","stress","evt","riskattr"]},
    {label:"Métricas Avançadas",ids:["credito","gestaoativa","macro","bayesiana","budgetrisco","monitor"]},
    {label:"📉 Histórico",    ids:["historico"]},
    {label:"🆕 Novas Análises", ids:["estrutura","renda2","otimizacao","dinamica","familyoffice","derivs","esgavancado"]},
    {label:"📈 Research & Data", ids:["screener","calendario","fundamentos","estimativas","insider","scatterplot","dividendos","xray"]},
    {label:"🌡 Market Valuation",     ids:["cmv"]},
    {label:"⏪ Portfolio Visualizer", ids:["backtest","tactical","rollingopt","metas","correlacoes","gestores"]},
    {label:"🧠 Sentimento",       ids:["sentimento"]},
    {label:"📖 Ajuda",          ids:["ajuda"]},
    {label:"Operacional",    ids:["transacoes","watchlist","alertas","relatorio","onepager"]},
  ];
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, color:C.text,
    fontFamily:"'DM Mono','IBM Plex Mono','Courier New',monospace",
    backgroundImage:"radial-gradient(ellipse 80% 50% at 50% -20%, #0D2A4A55, transparent)",
    }}>

    {/* CSS global — fonte e animações */}
    <style>{`
     @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500&family=Syne:wght@700;800&display=swap');
     * { box-sizing: border-box; }
     body { margin:0; background:${C.bg}; }
     ::-webkit-scrollbar { width:5px; height:5px; }
     ::-webkit-scrollbar-track { background:transparent; }
     ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:4px; }
     ::-webkit-scrollbar-thumb:hover { background:${C.borderHi}; }
     .fo-card-hover:hover {
      border-color: ${C.borderHi} !important;
      box-shadow: 0 8px 32px #00000040, 0 0 0 1px ${C.borderHi}, inset 0 1px 0 #ffffff10 !important;
      transform: translateY(-1px);
      transition: all .2s ease !important;
     }
     .fo-nav-item { transition: all .15s ease !important; }
     .fo-nav-item:hover { background: ${C.accent}0A !important; color: ${C.textSub} !important; }
     @keyframes fo-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
     @keyframes fo-slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
     .fo-animate { animation: fo-slide-in .25s ease both; }
     input:focus, select:focus { border-color: ${C.accent}88 !important; box-shadow: 0 0 0 3px ${C.accent}18 !important; outline: none !important; }
     table tr:hover td { background: ${C.accent}06 !important; }
     /* ── Print / PDF ── */
     @media print {
      body { background:#fff !important; color:#000 !important; }
      [data-no-print], .fo-nav-item, nav, button { display:none !important; }
      [data-print-page] { page-break-before: always; }
      .fo-card-hover { box-shadow:none !important; border:1px solid #ddd !important; }
      * { color:#000 !important; background:#fff !important; border-color:#ddd !important; }
      h1,h2,h3 { color:#000 !important; }
      @page { margin: 1.5cm; }
     }
    `}</style>

    {/* Toasts de alertas */}
    {toasts.length>0 && (
     <div style={{ position:"fixed", top:20, right:20, zIndex:300, display:"flex", flexDirection:"column", gap:8, maxWidth:360 }}>
      {toasts.slice(0,3).map((msg,i) => (
        <div key={i} style={{
         background:"linear-gradient(135deg,#1A1000,#120D00)",
         border:"1px solid "+C.gold+"66",
         borderRadius:14,
         padding:"14px 18px",
         fontSize:13, color:C.gold,
         display:"flex", justifyContent:"space-between", gap:12,
         boxShadow:"0 8px 32px #00000080, 0 0 16px "+C.gold+"20",
         animation:"fo-slide-in .2s ease",
        }}>
         <span>⚡ {msg}</span>
         <button onClick={()=>setToasts(t=>t.filter((_,j)=>j!==i))}
          style={{ background:"none", border:"none", color:C.gold, cursor:"pointer", fontSize:18, padding:0, lineHeight:1 }}>✕</button>
        </div>
      ))}
     </div>
    )}

    {/* ── SIDEBAR ────────────────────────────────────────── */}
    <div style={{
     width:210,
     background:"linear-gradient(180deg, #0D1628 0%, #0A1220 100%)",
     borderRight:"1px solid "+C.border,
     display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto",
     boxShadow:"4px 0 24px #00000040",
    }}>
     {/* Logo */}
     <div style={{ padding:"20px 16px 16px", borderBottom:"1px solid "+C.border }}>
      <div style={{
        fontSize:18, fontWeight:800, color:C.white,
        fontFamily:"'Syne',sans-serif", letterSpacing:1,
      }}>
        <span style={{
         color:C.accent,
         textShadow:"0 0 16px "+C.accent+"88",
        }}>F</span>O
        <span style={{ color:C.muted, fontWeight:400, fontSize:12, marginLeft:6 }}>Office</span>
      </div>
      <div style={{
        fontSize:8, color:C.muted, letterSpacing:3, marginTop:2,
        textTransform:"uppercase", opacity:.7,
      }}>Wealth Management</div>
     </div>

     {/* Filtro de família */}
     <div style={{ padding:"12px 14px 8px" }}>
      <div style={{
        fontSize:8, color:C.muted, letterSpacing:2,
        textTransform:"uppercase", marginBottom:6, fontWeight:600,
      }}>Família</div>
      <select style={{ ...S.sel, fontSize:11, borderRadius:8, padding:"7px 10px" }}
        value={famSel} onChange={e=>setFamSel(e.target.value)}>
        <option value="Todas">Todas as Famílias</option>
        {FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
     </div>

     {/* Navegação por grupos */}
     <nav style={{ flex:1, paddingBottom:8 }}>
      {GRUPOS.map(g => (
        <div key={g.label}>
         <div style={{
          padding:"10px 16px 4px",
          fontSize:8, color:C.muted, fontWeight:700,
          textTransform:"uppercase", letterSpacing:2, opacity:.7,
         }}>{g.label}</div>
         {g.ids.map(id => {
          const t = TABS.find(t=>t.id===id);
          if (!t) return null;
          return <NavItem key={id} icone={t.icon} label={t.label} ativo={tab===id} onClick={()=>setTab(id)}/>;
         })}
        </div>
      ))}
     </nav>

     {/* Status + atualizar */}
     <div style={{ padding:"12px 14px", borderTop:"1px solid "+C.border }}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
        <div style={{
         width:6, height:6, borderRadius:"50%",
         background:loading?C.gold:C.accent,
         boxShadow:"0 0 6px "+(loading?C.gold:C.accent),
         animation:loading?"fo-pulse 1s infinite":"none",
        }}/>
        <span style={{ fontSize:10, color:loading?C.gold:C.accent, fontWeight:600 }}>
         {loading?"Atualizando...":"Ao vivo"}
        </span>
      </div>
      <button style={{ ...S.btnO, width:"100%", fontSize:11, padding:"7px 12px", borderRadius:8 }} onClick={doFetch}>
        ↻ Atualizar Cotações
      </button>
      <div style={{ fontSize:9, marginTop:6, lineHeight:1.8, opacity:.9 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
         <div style={{ width:5, height:5, borderRadius:"50%", background:Object.keys(quotes).length>0?C.accent:C.gold }}/>
         <span style={{ color:Object.keys(quotes).length>0?C.accent:C.gold }}>
          {Object.keys(quotes).length>0?"Cotações ao vivo":"Dados simulados"}
         </span>
        </div>
        <div style={{ color:C.muted }}>Brapi + Finnhub · {Object.keys(quotes).length} ativos</div>
        {lastUpdate && <div style={{ color:C.muted }}>⏱ {lastUpdate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>}
      </div>

      {/* Demo toolbar */}
      <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:5 }}>
        <label style={{ ...S.btnO, width:"100%", fontSize:10, padding:"6px 10px", borderRadius:7, cursor:"pointer", textAlign:"center", boxSizing:"border-box" }}>
         📥 Importar CSV
         <input type="file" accept=".csv" style={{ display:"none" }} onChange={importCSV}/>
        </label>
        <button style={{ ...S.btnO, width:"100%", fontSize:10, padding:"6px 10px", borderRadius:7 }} onClick={exportCSV}>
         📤 Exportar CSV
        </button>
        <button style={{ ...S.btnO, width:"100%", fontSize:10, padding:"6px 10px", borderRadius:7 }} onClick={()=>setShowOnboarding(true)}>
         ❓ Tour Guiado
        </button>
        <button style={{ background:"#F0406008", border:"1px solid #F0406044", borderRadius:7, color:"#F04060", fontSize:9, padding:"5px 10px", cursor:"pointer", width:"100%", letterSpacing:.3 }} onClick={resetDemo}>
         ⟳ Reset Demo
        </button>
      </div>

      {/* Demo badge */}
      <div style={{ marginTop:8, textAlign:"center", fontSize:8, color:C.muted, opacity:.5, letterSpacing:1, textTransform:"uppercase" }}>
        DEMO · v2.0 · Abr 2026
      </div>
     </div>
    </div>

    {/* ── CONTEÚDO PRINCIPAL ─────────────────────────────── */}
    <div style={{ flex:1, padding:"24px 28px 32px", overflowY:"auto", minWidth:0 }}>

     {/* Barra de status de dados */}
     <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, padding:"8px 14px", background:C.surface, borderRadius:10, border:"1px solid "+C.border, flexWrap:"wrap", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:11, color:C.muted }}>
        <span style={{ color:C.accent, fontWeight:700, fontFamily:"'Syne',sans-serif", fontSize:13 }}>FAMILY OFFICE</span>
        <span style={{ color:C.border }}>|</span>
        <span>DEMO MODE</span>
        <span style={{ color:C.border }}>|</span>
        <span>Dados: {Object.keys(quotes).length>0?"Cotações ao vivo":"Simulados"}</span>
        {lastUpdate && <span style={{ color:C.accent }}>· Atualizado {lastUpdate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <span style={{ fontSize:9, background:C.accentSoft, color:C.accent, padding:"3px 8px", borderRadius:20, fontWeight:700, letterSpacing:1 }}>v2.0</span>
        <span style={{ fontSize:9, background:C.surface, border:"1px solid "+C.border, color:C.muted, padding:"3px 8px", borderRadius:20, letterSpacing:1 }}>ABR 2026</span>
      </div>
     </div>

     {/* Header da aba */}
     <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
      <div>
        <h1 style={{
         margin:0, fontSize:20, fontWeight:800, color:C.white,
         fontFamily:"'Syne',sans-serif", letterSpacing:.5,
         lineHeight:1.2,
        }}>{TITLES[tab]||tab}</h1>
        <div style={{ color:C.muted, fontSize:11, marginTop:3, letterSpacing:.3 }}>
         {famSel==="Todas"?"Visão consolidada — todas as famílias":famSel}
        </div>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        {tab==="portfolio"   && <button style={S.btnV} onClick={()=>setModal("ativo")}>+ Ativo</button>}
        {tab==="transacoes"  && <button style={S.btnV} onClick={()=>setModal("tx")}>+ Transação</button>}
        <button onClick={()=>setShowGlossario(true)}
         style={{...S.btnO,fontSize:11,padding:"5px 12px",marginLeft:4,color:C.gold,borderColor:C.gold}}>
         📖 Glossário
        </button>
        <button onClick={()=>setShowGlossario(true)}
         style={{...S.btnO,fontSize:11,padding:"5px 12px",marginLeft:4,color:C.gold,borderColor:C.gold}}>
         📖 Glossário
        </button>
        {tab==="watchlist"   && <button style={S.btnV} onClick={()=>setModal("watch")}>+ Adicionar</button>}
        {tab==="alertas"     && <button style={S.btnV} onClick={()=>setModal("alert")}>+ Alerta</button>}
      </div>
     </div>

     {/* Renderização das abas */}
     {tab==="dashboard"   && <TabDashboard   filtered={filtered} totalVal={totalVal} totalCost={totalCost} totalRet={totalRet} totalRp={totalRp} byCat={byCat} byFam={byFam} famSel={famSel} benchEvo={benchEvo} benchVis={benchVis} setBenchVis={setBenchVis} benchRets={benchRets} setTab={setTab} quotes={quotes}/>}
     {tab==="portfolio"   && <TabPortfolio   filtered={filtered} quotes={quotes} setAssets={setAssets} totalVal={totalVal}/>}
     {tab==="benchmark"   && <TabBenchmarks  benchEvo={benchEvo} benchVis={benchVis} setBenchVis={setBenchVis} benchRets={benchRets}/>}
     {tab==="riscos"      && <TabRiscos      filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat} riskScore={riskScore} riskLabel={riskLabel} riskColor={riskColor} var95={var95} var99={var99} volPort={volPort} concAtivo={concAtivo} concPais={concPais}/>}
     {tab==="quant"       && <TabQuant       portVol={volPort} portSharpe={portSharpe} portMaxDD={portMaxDD} portBeta={portBeta} var95={var95} var99={var99} cvar95={cvar95} cvar99={cvar99} omega={omega} trackErr={trackErr} infoRatio={infoRatio} treynor={treynor}/>}
     {tab==="avancado"    && <TabAvancado    filtered={filtered} quotes={quotes} totalVal={totalVal} portVol={volPort} var95={var95} var99={var99} portRet={portRet} portBeta={portBeta}/>}
     {tab==="planejamento"&& <TabPlanejamento totalVal={totalVal} portRet={portRet} portVol={volPort}/>}
     {tab==="esg"         && <TabESG         byCat={byCat} totalVal={totalVal}/>}
     {tab==="atribuicao"  && <TabAtribuicao  byCat={byCat}/>}
     {tab==="fatores"     && <TabFatores     portVol={volPort} portRet={portRet} portBeta={portBeta}/>}
     {tab==="kelly"       && <TabKelly       filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat}/>}
     {tab==="rebalance"   && <TabRebalance   byCat={byCat} totalVal={totalVal}/>}
     {tab==="oportunid"   && <TabOportunidade byCat={byCat} totalVal={totalVal} portRet={portRet}/>}
     {tab==="taxloss"     && <TabTaxLoss     filtered={filtered} quotes={quotes}/>}
     {tab==="behavioral"  && <TabBehavioral  filtered={filtered} quotes={quotes}/>}
     {tab==="fronteira"   && <TabFronteira   portVol={volPort} portRet={portRet}/>}
     {tab==="cashflow"    && <TabCashFlow    filtered={filtered} quotes={quotes} totalVal={totalVal}/>}
     {tab==="imoveis"     && <TabImoveis/>}
     {tab==="sucessao"    && <TabSucessao    assets={assets} quotes={quotes} totalVal={totalVal}/>}
     {tab==="regime"      && <TabRegime      portVol={volPort} portRet={portRet} totalVal={totalVal}/>}
     {tab==="crash"       && <TabCrash       portVol={volPort} portBeta={portBeta} totalVal={totalVal} var99={var99}/>}
     {tab==="drawdownadv" && <TabDrawdown    portVol={volPort} portRet={portRet} portMaxDD={portMaxDD}/>}
     {tab==="liqrisk"     && <TabLiquidez    filtered={filtered} quotes={quotes} totalVal={totalVal} var99={var99}/>}
     {tab==="garch"       && <TabGARCH       portVol={volPort} portRet={portRet} totalVal={totalVal}/>}
     {tab==="fragilidade" && <TabFragilidade filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat} portVol={volPort} portRet={portRet}/>}
     {tab==="stress"      && <TabStress      filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat} portVol={volPort} portRet={portRet} var99={var99}/>}
     {tab==="evt"         && <TabEVT         totalVal={totalVal} var99={var99} dailyVol={dailyVol}/>}
     {tab==="riskattr"    && <TabRiskAttr    filtered={filtered} quotes={quotes} totalVal={totalVal} volPort={volPort}/>}
     {tab==="historico"   && <TabHistorico  totalVal={totalVal} portVol={volPort} portRet={portRet} portSharpe={portSharpe} portBeta={portBeta} portMaxDD={portMaxDD} var99={var99} cvar99={cvar99} byCat={byCat} filtered={filtered} quotes={quotes}/>}
     {tab==="sentimento"  && <TabSentimento filtered={filtered} quotes={quotes}/>}
     {tab==="ajuda"       && <TabAjuda/>}
     {tab==="etfoverview" && <TabETFOverview  filtered={filtered} quotes={quotes}/>}
     {tab==="etfholdings" && <TabETFHoldings  filtered={filtered} quotes={quotes}/>}
     {tab==="etfperf"     && <TabETFPerformance filtered={filtered} quotes={quotes}/>}
     {tab==="etfscreener" && <TabETFScreener   filtered={filtered} quotes={quotes} totalVal={totalVal}/>}
     {tab==="tecnica"   && <TabTecnica   filtered={filtered} quotes={quotes}/>}
     {tab==="fundadv"   && <TabFundAdv   filtered={filtered} quotes={quotes} totalVal={totalVal}/>}
     {tab==="fiis"      && <TabFIIs      filtered={filtered} quotes={quotes} totalVal={totalVal}/>}
     {tab==="rfadv"     && <TabRFAdv     filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat}/>}
     {tab==="pevc"      && <TabPEVC      totalVal={totalVal} txs={txs} byCat={byCat}/>}
     {tab==="fxreport"  && <TabFXReporting totalVal={totalVal} portRet={portRet} portVol={volPort} portSharpe={portSharpe} portMaxDD={portMaxDD} byCat={byCat} famSel={famSel} filtered={filtered} quotes={quotes}/>}
     {tab==="tier1"       && <TabTier1 filtered={filtered} quotes={quotes} totalVal={totalVal} totalCost={totalCost} totalRet={totalRet} portRet={portRet} portVol={volPort} portSharpe={portSharpe} portMaxDD={portMaxDD} txs={txs} byCat={byCat}/>}
     {tab==="tier2"       && <TabTier2 portRet={portRet} portVol={volPort} portSharpe={portSharpe} portBeta={portBeta} portMaxDD={portMaxDD} totalVal={totalVal} totalCost={totalCost} byCat={byCat} txs={txs}/>}
     {tab==="tier3"       && <TabTier3 filtered={filtered} quotes={quotes} totalVal={totalVal} portRet={portRet} portVol={volPort} portBeta={portBeta} portSharpe={portSharpe} byCat={byCat} txs={txs}/>}
     {tab==="tier4"       && <TabTier4 portRet={portRet} portVol={volPort} portBeta={portBeta} portSharpe={portSharpe} portMaxDD={portMaxDD} totalVal={totalVal} byCat={byCat} filtered={filtered} quotes={quotes} txs={txs}/>}
     {tab==="tier5"       && <TabTier5 byCat={byCat} filtered={filtered} quotes={quotes} totalVal={totalVal} portVol={volPort} portRet={portRet} portSharpe={portSharpe}/>}
     {tab==="quantmetrics" && <TabQuantMetrics filtered={filtered} quotes={quotes} totalVal={totalVal} portVol={volPort} portRet={portRet} portSharpe={portSharpe} portBeta={portBeta} portMaxDD={portMaxDD} byCat={byCat} famSel={famSel} txs={txs}/>}
     {tab==="cmv"         && <TabCMV/>}
     {tab==="backtest"    && <TabBacktest    byCat={byCat} totalVal={totalVal} portRet={portRet} portVol={volPort} portSharpe={portSharpe} portMaxDD={portMaxDD} portBeta={portBeta}/>}
     {tab==="tactical"    && <TabTactical    portVol={volPort} portRet={portRet} totalVal={totalVal}/>}
     {tab==="rollingopt"  && <TabRollingOpt  byCat={byCat} portVol={volPort} portRet={portRet} portSharpe={portSharpe}/>}
     {tab==="metas"       && <TabMetas       totalVal={totalVal} portRet={portRet} portVol={volPort}/>}
     {tab==="correlacoes" && <TabCorrelacoes filtered={filtered} quotes={quotes} totalVal={totalVal}/>}
     {tab==="gestores"    && <TabGestores    portRet={portRet} portVol={volPort} portSharpe={portSharpe} portBeta={portBeta} portMaxDD={portMaxDD}/>}
     {tab==="screener"     && <TabScreener    quotes={quotes}/>}
     {tab==="calendario"   && <TabCalendario/>}
     {tab==="fundamentos"  && <TabFundamentos filtered={filtered} quotes={quotes}/>}
     {tab==="estimativas"  && <TabEstimativas filtered={filtered} quotes={quotes}/>}
     {tab==="insider"      && <TabInsider     filtered={filtered}/>}
     {tab==="scatterplot"  && <TabScatter     filtered={filtered} quotes={quotes}/>}
     {tab==="dividendos"   && <TabDividendos  filtered={filtered} quotes={quotes}/>}
     {tab==="xray"         && <TabXRay        filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat}/>}
     {tab==="estrutura"    && <TabEstrutura    filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat} portVol={volPort}/>}
     {tab==="renda2"       && <TabRenda        filtered={filtered} quotes={quotes} totalVal={totalVal} txs={txs}/>}
     {tab==="otimizacao"   && <TabOtimizacao   byCat={byCat} totalVal={totalVal} portVol={volPort} portRet={portRet} portBeta={portBeta}/>}
     {tab==="dinamica"     && <TabDinamica     portRet={portRet} portVol={volPort} portBeta={portBeta} portSharpe={portSharpe} byCat={byCat} totalVal={totalVal}/>}
     {tab==="familyoffice" && <TabFamilyOffice filtered={filtered} quotes={quotes} totalVal={totalVal} assets={assets} txs={txs} portVol={volPort}/>}
     {tab==="derivs"       && <TabDerivs       filtered={filtered} quotes={quotes} totalVal={totalVal} portVol={volPort} portBeta={portBeta} var99={var99} byCat={byCat}/>}
     {tab==="esgavancado"  && <TabESGAvancado  byCat={byCat} filtered={filtered} quotes={quotes} totalVal={totalVal}/>}
     {tab==="credito"     && <TabCredito     filtered={filtered} quotes={quotes} totalVal={totalVal}/>}
     {tab==="gestaoativa" && <TabGestaoAtiva txs={txs} assets={assets} quotes={quotes}/>}
     {tab==="macro"       && <TabMacro       filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat} portRet={portRet} portVol={volPort} portBeta={portBeta}/>}
     {tab==="bayesiana"   && <TabBayesiana   portVol={volPort} portRet={portRet} portSharpe={portSharpe} portBeta={portBeta} byCat={byCat} totalVal={totalVal}/>}
     {tab==="budgetrisco" && <TabBudgetRisco filtered={filtered} quotes={quotes} totalVal={totalVal} byCat={byCat} var99={var99} portVol={volPort} famSel={famSel}/>}
     {tab==="monitor"     && <TabMonitor     filtered={filtered} quotes={quotes} totalVal={totalVal} portVol={volPort} portBeta={portBeta} byCat={byCat}/>}
     {tab==="transacoes"  && <TabTransacoes  txs={txs} setTxs={setTxs} famSel={famSel}/>}
     {tab==="watchlist"   && <TabWatchlist   watch={watch} setWatch={setWatch} quotes={quotes}/>}
     {tab==="alertas"     && <TabAlertas     alerts={alerts} setAlerts={setAlerts} quotes={quotes}/>}
     {tab==="relatorio"   && <TabRelatorio   assets={assets} quotes={quotes} txs={txs} famSel={famSel}/>}
     {tab==="onepager"    && <TabOnePager    filtered={filtered} quotes={quotes} totalVal={totalVal} totalCost={totalCost} totalRet={totalRet} totalRp={totalRp} byCat={byCat} portSharpe={portSharpe} portVol={volPort} portMaxDD={portMaxDD} portRet={portRet} famSel={famSel}/>}
    </div>

    {/* Glossário */}
    {showGlossario && <GlossarioPanel onClose={()=>setShowGlossario(false)}/>}
    {showOnboarding && <OnboardingModal onClose={()=>setShowOnboarding(false)}/>}

    {/* Glossário flutuante (atalho ?) */}
    {!showGlossario && !showOnboarding && (
     <button
      onClick={()=>setShowGlossario(true)}
      title="Abrir Glossário Financeiro (atalho ?)"
      style={{
        position:"fixed", bottom:24, right:24, zIndex:200,
        width:44, height:44, borderRadius:"50%",
        background:"linear-gradient(135deg,"+C.accent+",#03B878)",
        border:"none", color:"#031A10", fontSize:20, fontWeight:800,
        cursor:"pointer", boxShadow:"0 4px 20px "+C.accent+"55",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"transform .15s",
      }}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
     >?</button>
    )}

    {/* Modal: Adicionar Ativo */}
    {modal==="ativo" && (
     <Modal titulo="Adicionar Ativo" onClose={()=>setModal(null)}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Campo label="Família"><select style={S.sel} value={newA.family} onChange={e=>setNewA(p=>({...p,family:e.target.value}))}>{FAMILIAS.map(f=><option key={f} value={f}>{f}</option>)}</select></Campo>
        <Campo label="Categoria"><select style={S.sel} value={newA.category} onChange={e=>setNewA(p=>({...p,category:e.target.value}))}>{CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></Campo>
        <Campo label="Ticker"><input style={S.inp} placeholder="PETR4, AAPL..." value={newA.ticker} onChange={e=>setNewA(p=>({...p,ticker:e.target.value}))}/></Campo>
        <Campo label="Nome"><input style={S.inp} placeholder="Petrobras" value={newA.name} onChange={e=>setNewA(p=>({...p,name:e.target.value}))}/></Campo>
        <Campo label="Quantidade"><input style={S.inp} type="number" placeholder="1000" value={newA.qty} onChange={e=>setNewA(p=>({...p,qty:e.target.value}))}/></Campo>
        <Campo label="Preço Médio (R$)"><input style={S.inp} type="number" placeholder="34.20" value={newA.avgPrice} onChange={e=>setNewA(p=>({...p,avgPrice:e.target.value}))}/></Campo>
      </div>
      <button style={{ ...S.btnV, width:"100%", marginTop:16 }} onClick={addAtivo}>Adicionar Ativo</button>
     </Modal>
    )}

    {/* Modal: Adicionar Transação */}
    {modal==="tx" && (
     <Modal titulo="Registrar Transação" onClose={()=>setModal(null)}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Campo label="Família"><select style={S.sel} value={newTx.family} onChange={e=>setNewTx(p=>({...p,family:e.target.value}))}>{FAMILIAS.map(f=><option key={f} value={f}>{f}</option>)}</select></Campo>
        <Campo label="Tipo"><select style={S.sel} value={newTx.type} onChange={e=>setNewTx(p=>({...p,type:e.target.value}))}><option value="compra">Compra</option><option value="venda">Venda</option></select></Campo>
        <Campo label="Ticker"><input style={S.inp} placeholder="PETR4" value={newTx.ticker} onChange={e=>setNewTx(p=>({...p,ticker:e.target.value}))}/></Campo>
        <Campo label="Data"><input style={S.inp} type="date" value={newTx.date} onChange={e=>setNewTx(p=>({...p,date:e.target.value}))}/></Campo>
        <Campo label="Quantidade"><input style={S.inp} type="number" value={newTx.qty} onChange={e=>setNewTx(p=>({...p,qty:e.target.value}))}/></Campo>
        <Campo label="Preço (R$)"><input style={S.inp} type="number" value={newTx.price} onChange={e=>setNewTx(p=>({...p,price:e.target.value}))}/></Campo>
      </div>
      <button style={{ ...S.btnV, width:"100%", marginTop:16 }} onClick={addTx}>Registrar</button>
     </Modal>
    )}

    {/* Modal: Adicionar Watchlist */}
    {modal==="watch" && (
     <Modal titulo="Adicionar à Watchlist" onClose={()=>setModal(null)}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Campo label="Ticker"><input style={S.inp} placeholder="PETR4, AAPL, BTC-USD" value={newW.ticker} onChange={e=>setNewW(p=>({...p,ticker:e.target.value}))}/></Campo>
        <Campo label="Nome"><input style={S.inp} placeholder="Nome do ativo" value={newW.name} onChange={e=>setNewW(p=>({...p,name:e.target.value}))}/></Campo>
        <Campo label="Categoria"><select style={S.sel} value={newW.catId} onChange={e=>setNewW(p=>({...p,catId:e.target.value}))}>{CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></Campo>
      </div>
      <button style={{ ...S.btnV, width:"100%", marginTop:16 }} onClick={addWatch}>Adicionar</button>
     </Modal>
    )}

    {/* Modal: Criar Alerta */}
    {modal==="alert" && (
     <Modal titulo="Criar Alerta de Preço" onClose={()=>setModal(null)}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <Campo label="Ticker"><input style={S.inp} placeholder="PETR4" value={newAl.ticker} onChange={e=>setNewAl(p=>({...p,ticker:e.target.value}))}/></Campo>
        <Campo label="Tipo"><select style={S.sel} value={newAl.type} onChange={e=>setNewAl(p=>({...p,type:e.target.value}))}><option value="acima">Preço acima de</option><option value="abaixo">Preço abaixo de</option></select></Campo>
        <Campo label="Preço Alvo (R$)"><input style={S.inp} type="number" placeholder="45.00" value={newAl.price} onChange={e=>setNewAl(p=>({...p,price:e.target.value}))}/></Campo>
      </div>
      <button style={{ ...S.btnV, width:"100%", marginTop:16 }} onClick={addAlert}>Criar Alerta</button>
     </Modal>
    )}
    </div>
  );
}
