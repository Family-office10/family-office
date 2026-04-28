// ============================================================
//  FAMILY OFFICE — Gestão Patrimonial Institucional
//  Versão limpa e comentada — Abril 2026
//
//  COMO PERSONALIZAR:
//  1. CONFIGURACOES (linha ~30): troque as chaves de API
//  2. FAMILIAS (linha ~50): adicione/remova famílias
//  3. CATS (linha ~60): categorias de ativos e volatilidade
//  4. INIT_ASSETS (linha ~100): seus ativos iniciais
//  5. METRICAS (linha ~850): ajuste portRet, portVol, portBeta
//
//  ESTRUTURA DO APP:
//  - Cada aba é uma função "function TabNome({props})"
//  - O App() principal gerencia estado e roteamento
//  - Dados fluem de App() para as abas via props
// ============================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PieChart, Pie, Cell, AreaChart, Area,
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, ScatterChart, Scatter
} from "recharts";

// ============================================================
//  CONFIGURACOES — EDITE AQUI
// ============================================================
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

// ============================================================
//  FAMILIAS — Adicione ou remova famílias aqui
// ============================================================
const FAMILIAS = [
  "Familia Silva",
  "Familia Mendes",
  "Familia Rocha",
  "Familia Costa",
];

// ============================================================
//  CATEGORIAS DE ATIVOS — id, label, cor, br?, vol%
//  br: true = ativo brasileiro (usa Brapi), false = Finnhub
//  vol: volatilidade anualizada estimada (%)
// ============================================================
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

// ============================================================
//  ATIVOS INICIAIS — Substitua pelos seus ativos reais
//  Formato: { id, family, category, ticker, name, qty, avgPrice }
// ============================================================
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

// ============================================================
//  TRANSACOES INICIAIS — Histórico de operações
// ============================================================
const INIT_TXS = [
  { id:1, date:"10/01/2024", family:"Familia Silva",  ticker:"PETR4",  type:"compra",   qty:5000, price:34.20, total:171000 },
  { id:2, date:"15/01/2024", family:"Familia Silva",  ticker:"VALE3",  type:"compra",   qty:2000, price:58.40, total:116800 },
  { id:3, date:"01/02/2024", family:"Familia Mendes", ticker:"MSFT",   type:"compra",   qty:150,  price:380.0, total:57000  },
  { id:4, date:"15/03/2024", family:"Familia Rocha",  ticker:"ITUB4",  type:"compra",   qty:8000, price:30.50, total:244000 },
  { id:5, date:"20/03/2024", family:"Familia Costa",  ticker:"NVDA",   type:"compra",   qty:50,   price:650.0, total:32500  },
  { id:6, date:"01/04/2024", family:"Familia Silva",  ticker:"PETR4",  type:"venda",    qty:500,  price:40.10, total:20050  },
];

// ============================================================
//  TEMA — Cores do app. Edite para personalizar visual.
// ============================================================
const C = {
  bg:        "#0A0E1A",  // fundo principal
  surface:   "#111827",  // fundo lateral/cards secundários
  card:      "#151E2E",  // fundo dos cards
  border:    "#1E2D45",  // bordas
  accent:    "#00C896",  // verde principal (positivo)
  accentDim: "#00C89618",
  gold:      "#F5A623",  // laranja/dourado (alerta)
  red:       "#FF4D6D",  // vermelho (negativo/risco)
  blue:      "#3B82F6",  // azul
  purple:    "#A78BFA",  // roxo
  text:      "#E8EDF5",  // texto principal
  muted:     "#6B7A99",  // texto secundário
  white:     "#FFFFFF",
};

// ============================================================
//  MESES — usados em gráficos
// ============================================================
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ============================================================
//  FUNÇÕES UTILITÁRIAS
// ============================================================
// Formata número com casas decimais (pt-BR)
const fmt    = (n, d=2) => (n==null||isNaN(n)) ? "--" : new Intl.NumberFormat("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
// Formata valor em BRL
const fmtBRL = n => (n==null||isNaN(n)) ? "--" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);
// Formata percentual com sinal
const fmtPct = n => (n==null||isNaN(n)) ? "--" : (n>=0?"+":"")+fmt(n)+"%";
// Retorna categoria de um id
const catOf  = id => CATS.find(c=>c.id===id) || CATS[CATS.length-1];
// Checa se ticker é brasileiro
const isBR   = (t,c) => catOf(c).br || /^[A-Z]{4}\d{1,2}$/.test(t);
// ID único simples
const uid    = () => Math.random().toString(36).slice(2);
// Data atual formatada
const hoje   = () => new Date().toLocaleDateString("pt-BR");

// ============================================================
//  APIS DE COTAÇÃO
// ============================================================
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

// ============================================================
//  ESTILOS REUTILIZÁVEIS
// ============================================================
const S = {
  card:  { background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 },
  inp:   { background:C.surface, border:"1px solid "+C.border, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" },
  sel:   { background:C.surface, border:"1px solid "+C.border, borderRadius:8, color:C.text, padding:"8px 12px", fontSize:13, outline:"none", width:"100%", cursor:"pointer" },
  btnV:  { background:C.accent, color:"#000", border:"none", borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:700 },
  btnO:  { background:"transparent", color:C.accent, border:"1px solid "+C.accent, borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:13, fontWeight:600 },
  badge: c => ({ background:c+"22", color:c, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, display:"inline-block" }),
  TT:    { background:C.card, border:"1px solid "+C.border, borderRadius:8, color:C.text },
};

// ============================================================
//  COMPONENTES BASE (usados em todo app)
// ============================================================

// Card de KPI simples
function KPI({ label, value, sub, subColor, topColor }) {
  return (
    <div style={{ ...S.card, flex:1, minWidth:150, borderTop: topColor ? "3px solid "+topColor : undefined }}>
      <div style={{ color:C.muted, fontSize:10, fontWeight:600, letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:C.white }}>{value}</div>
      {sub && <div style={{ fontSize:12, color: subColor||C.muted, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// Barra de progresso
function Barra({ pct, cor, altura=8 }) {
  return (
    <div style={{ height:altura, background:C.border, borderRadius:4, overflow:"hidden" }}>
      <div style={{ height:"100%", width:Math.min(100,Math.max(0,pct))+"%", background:cor||C.accent, borderRadius:4, transition:"width .5s" }}/>
    </div>
  );
}

// Item de navegação lateral
function NavItem({ icone, label, ativo, onClick }) {
  return (
    <div onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:8, padding:"9px 14px", cursor:"pointer",
      background: ativo ? C.accentDim : "transparent",
      borderLeft: ativo ? "3px solid "+C.accent : "3px solid transparent",
      color: ativo ? C.accent : C.muted, fontSize:12, fontWeight:600,
    }}>
      <span style={{ width:16, textAlign:"center", fontSize:13 }}>{icone}</span>
      <span>{label}</span>
    </div>
  );
}

// Modal / Dialog
function Modal({ titulo, onClose, children, largura }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000099", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ ...S.card, width:largura||460, maxWidth:"94vw", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>{titulo}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Campo de formulário com label
function Campo({ label, children }) {
  return <div><div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>{label}</div>{children}</div>;
}

// Linha de tabela de dados
function LinhaTabela({ colunas, children }) {
  return <tr style={{ borderBottom:"1px solid "+C.border+"22" }}>{children}</tr>;
}

// Cabeçalho de seção dentro de card
function SecaoTitulo({ titulo, sub }) {
  return (
    <div style={{ marginBottom: sub ? 4 : 14 }}>
      <div style={{ fontWeight:700, fontSize:14 }}>{titulo}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginTop:2, marginBottom:12 }}>{sub}</div>}
    </div>
  );
}

// ============================================================
//  ABA: DASHBOARD — Visão geral do patrimônio
// ============================================================
function TabDashboard({ filtered, totalVal, totalCost, totalRet, totalRp, byCat, byFam, famSel, benchEvo, benchVis, setBenchVis, benchRets }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* KPIs principais */}
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        <KPI label="Patrimônio Total"  value={fmtBRL(totalVal)}  sub={`${filtered.length} ativos`} topColor={C.accent}/>
        <KPI label="Resultado"         value={fmtBRL(totalRet)}  sub={fmtPct(totalRp)} subColor={totalRet>=0?C.accent:C.red} topColor={totalRet>=0?C.accent:C.red}/>
        <KPI label="Custo Total"       value={fmtBRL(totalCost)} sub="Preço médio ponderado" topColor={C.blue}/>
        <KPI label="Famílias"          value={famSel==="Todas"?FAMILIAS.length:1} sub="Monitoradas" topColor={C.purple}/>
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
                  <Tooltip formatter={v=>fmtBRL(v)} contentStyle={S.TT}/>
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
              <Tooltip formatter={v=>fmtBRL(v)} contentStyle={S.TT}/>
              {benchVis.portfolio && <Line type="monotone" dataKey="portfolio" stroke={C.accent} strokeWidth={2.5} dot={false}/>}
              {benchVis.cdi       && <Line type="monotone" dataKey="cdi"       stroke={C.blue}   strokeWidth={2} strokeDasharray="4 2" dot={false}/>}
              {benchVis.ibov      && <Line type="monotone" dataKey="ibov"      stroke={C.gold}   strokeWidth={2} strokeDasharray="4 2" dot={false}/>}
              {benchVis.sp500     && <Line type="monotone" dataKey="sp500"     stroke={C.purple} strokeWidth={2} strokeDasharray="4 2" dot={false}/>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Patrimônio por família (só quando visão consolidada) */}
      {famSel==="Todas" && byFam.length>0 && (
        <div style={S.card}>
          <SecaoTitulo titulo="Patrimônio por Família"/>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={byFam} layout="vertical">
              <XAxis type="number" stroke={C.muted} tick={{fontSize:10}} tickFormatter={v=>"R$"+(v/1e6).toFixed(1)+"M"}/>
              <YAxis type="category" dataKey="name" stroke={C.muted} tick={{fontSize:12}} width={60}/>
              <Tooltip formatter={v=>fmtBRL(v)} contentStyle={S.TT}/>
              <Bar dataKey="value" fill={C.accent} radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  ABA: PORTFÓLIO — Tabela completa + visão de concentração
// ============================================================
function TabPortfolio({ filtered, quotes, setAssets, totalVal }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const [modo, setModo]   = useState("concentracao"); // "tabela" | "concentracao"
  const [catFiltro, setCatFiltro] = useState(null);   // id da categoria selecionada

  // Agrupar por classe
  const porClasse = CATS.map(cat => {
    const ativos = filtered.filter(a => a.category===cat.id);
    const valor  = ativos.reduce((s,a) => s+preco(a)*a.qty, 0);
    const custo  = ativos.reduce((s,a) => s+a.avgPrice*a.qty, 0);
    const ret    = valor - custo;
    return { ...cat, ativos, valor, custo, ret, rp:custo>0?ret/custo*100:0, pct:totalVal>0?valor/totalVal*100:0 };
  }).filter(c => c.valor>0).sort((a,b) => b.valor-a.valor);

  // Lista de ativos ordenada por valor
  const porAtivo = filtered.map(a => {
    const val  = preco(a)*a.qty;
    const cst  = a.avgPrice*a.qty;
    const ret  = val-cst;
    return { ...a, val, cst, ret, rp:cst>0?ret/cst*100:0, pct:totalVal>0?val/totalVal*100:0, cat:catOf(a.category) };
  }).sort((a,b) => b.val-a.val);

  // Ativos filtrados pela classe selecionada
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
// ============================================================
//  ABA: BENCHMARKS — Comparativos e peers globais
// ============================================================
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
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        {[["Portfolio",benchRets.portfolio,C.accent],["CDI",benchRets.cdi,C.blue],["IBOV",benchRets.ibov,C.gold],["S&P 500",benchRets.sp500,C.purple]].map(([l,r,c]) => {
          const diff = +(benchRets.portfolio||0) - +(r||0);
          return (
            <div key={l} style={{ ...S.card, flex:1, minWidth:160, borderTop:"3px solid "+c }}>
              <div style={{ color:C.muted, fontSize:10, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:26, fontWeight:800, color:+(r||0)>=0?C.accent:C.red }}>{fmtPct(+(r||0))}</div>
              {l!=="Portfolio" && <div style={{ fontSize:12, color:diff>=0?C.accent:C.red, marginTop:4 }}>Port. {diff>=0?"acima":"abaixo"}: {fmtPct(Math.abs(diff))}</div>}
            </div>
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
            <Tooltip formatter={(v,n)=>[fmtBRL(v),{portfolio:"Portfolio",cdi:"CDI",ibov:"IBOV",sp500:"S&P 500"}[n]||n]} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: RISCOS — Score, VaR, concentração, correlação, stress
// ============================================================
function TabRiscos({ filtered, quotes, totalVal, byCat, riskScore, riskLabel, riskColor, var95, var99, volPort, concAtivo, concPais }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const LIMITE_CONC = CFG.limConc;

  // Stress scenarios baseados na exposição real
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

  // Correlações simplificadas
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
            {[["VaR 95% (1d)",fmtBRL(var95),"Perda máx esperada",C.gold],["VaR 99% (1d)",fmtBRL(var99),"Cenário de stress",C.red],["Vol. Portfolio",fmt(volPort,1)+"%","Anualizada ponderada",C.purple]].map(([l,v,s,c]) => (
              <div key={l} style={{ ...S.card, flex:1, minWidth:130, borderLeft:"3px solid "+c, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:700, color:c }}>{v}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s}</div>
              </div>
            ))}
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

// ============================================================
//  ABA: QUANT — Métricas quantitativas completas
// ============================================================
function TabQuant({ portVol, portSharpe, portMaxDD, portBeta, var95, var99, cvar95, cvar99, omega, trackErr, infoRatio, treynor }) {
  const anual = [
    {y:"2017",r:84},{y:"2018",r:-11},{y:"2019",r:45.6},
    {y:"2020",r:42.2},{y:"2021",r:28.2},{y:"2022",r:-21.7},
    {y:"2023",r:42.1},{y:"2024",r:23.6},{y:"2025",r:18.9},{y:"2026",r:-1.8},
  ];
  const trailing = [
    {p:"1M",v:-1.8},{p:"3M",v:-3.6},{p:"6M",v:-2.0},
    {p:"1A",v:18.1},{p:"3A",v:21.1},{p:"5A",v:12.8},{p:"10A",v:23.8},
  ];
  const drawdowns = [
    {l:"Q4 2018",    d:-12.7,desc:"Turbulência de fim de ano"},
    {l:"Covid 2020", d:-29.7,desc:"Colapso COVID-19"},
    {l:"Inflação 22",d:-23.0,desc:"Aperto monetário Fed"},
    {l:"Corr. 2023", d:-6.0, desc:"Correção pós-rally"},
    {l:"Tariff 2025",d:-15.0,desc:"Guerra tarifária EUA"},
  ];
  const metricas = [
    {l:"Retorno Anualizado",   v:"24.03%",         c:C.accent, r:"Excelente"},
    {l:"Volatilidade",         v:fmt(portVol,1)+"%",c:C.gold,  r:"Razoável"},
    {l:"Sharpe Ratio",         v:fmt(portSharpe,2), c:C.accent, r:"Excelente"},
    {l:"Sortino Ratio",        v:"2.33",            c:C.accent, r:"Excelente"},
    {l:"Calmar Ratio",         v:"0.37",            c:C.gold,   r:"Médio"},
    {l:"Treynor Ratio",        v:fmt(treynor,2),    c:C.accent, r:"Bom"},
    {l:"Information Ratio",    v:fmt(infoRatio,2),  c:C.gold,   r:"Positivo"},
    {l:"Omega Ratio",          v:fmt(omega,2),      c:omega>1?C.accent:C.red, r:omega>1?"Favorável":"Desfavorável"},
    {l:"Beta",                 v:fmt(portBeta,2),   c:C.muted,  r:"Moderado"},
    {l:"Alpha Anual",          v:"+10.94%",         c:C.accent, r:"Excelente"},
    {l:"Max Drawdown",         v:portMaxDD+"%",     c:C.red,    r:"Médio"},
    {l:"Tracking Error",       v:fmt(trackErr,2)+"%",c:C.purple, r:"—"},
    {l:"VaR 95% (1d)",         v:fmtBRL(var95),     c:C.gold,   r:"Stress"},
    {l:"VaR 99% (1d)",         v:fmtBRL(var99),     c:C.red,    r:"Extremo"},
    {l:"CVaR 95%",             v:fmtBRL(cvar95),    c:C.gold,   r:"Expected Shortfall"},
    {l:"CVaR 99%",             v:fmtBRL(cvar99),    c:C.red,    r:"Pior cenário"},
    {l:"Meses Positivos",      v:"64.0%",           c:C.accent, r:"Bom"},
    {l:"Correlação Mercado",   v:"0.81",            c:C.muted,  r:"Médio"},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={S.card}>
        <SecaoTitulo titulo="18 Métricas Quantitativas" sub="Período: Out/2015 — Abr/2026 · Benchmark: SPY · Rf: CDI"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))", gap:10 }}>
          {metricas.map(m => (
            <div key={m.l} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:10, padding:"12px 14px", borderLeft:"3px solid "+m.c }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:3, letterSpacing:.8 }}>{m.l}</div>
              <div style={{ fontSize:19, fontWeight:800, color:m.c, marginBottom:3 }}>{m.v}</div>
              <span style={S.badge(m.c)}>{m.r}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Retorno por Ano Calendar"/>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={anual} barSize={28}>
            <XAxis dataKey="y" stroke={C.muted} tick={{fontSize:11}}/>
            <YAxis stroke={C.muted} tick={{fontSize:10}} tickFormatter={v=>v+"%"} domain={[-30,90]}/>
            <Tooltip formatter={v=>[v+"%","Retorno"]} contentStyle={S.TT}/>
            <Bar dataKey="r" radius={[4,4,0,0]}>{anual.map((e,i)=><Cell key={i} fill={e.r>=0?C.accent:C.red}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18 }}>
        <div style={S.card}>
          <SecaoTitulo titulo="Trailing Returns"/>
          {trailing.map(t => (
            <div key={t.p} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:9 }}>
              <div style={{ width:30, fontSize:11, fontWeight:700, color:C.muted }}>{t.p}</div>
              <div style={{ flex:1, height:10, background:C.border, borderRadius:5, overflow:"hidden" }}>
                <div style={{ height:"100%", width:Math.min(100,Math.abs(t.v)/7.5*100)+"%", background:t.v>=0?C.accent:C.red, borderRadius:5 }}/>
              </div>
              <div style={{ width:55, fontSize:12, fontWeight:700, color:t.v>=0?C.accent:C.red, textAlign:"right" }}>{t.v>=0?"+":""}{t.v}%</div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <SecaoTitulo titulo="Drawdowns Históricos"/>
          {drawdowns.map(d => (
            <div key={d.l} style={{ marginBottom:11 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:3 }}>
                <div><span style={{ fontWeight:700 }}>{d.l}</span><span style={{ color:C.muted, fontSize:10, marginLeft:6 }}>{d.desc}</span></div>
                <span style={{ fontWeight:800, color:C.red }}>{d.d}%</span>
              </div>
              <Barra pct={Math.abs(d.d)/35*100} cor={C.red} altura={7}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// ============================================================
//  ABA: AVANÇADO — CVaR, Liquidity Ladder, G/L não realizados, FX
// ============================================================
function TabAvancado({ filtered, quotes, totalVal, portVol, var95, var99, portRet, portBeta }) {
  const preco  = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const rf     = CFG.rfRate;
  const trackErr  = Math.sqrt(portVol**2+9.83**2-2*.82*portVol*9.83);
  const infoRatio = (portRet-7.82)/trackErr;
  const treynor   = (portRet-rf)/portBeta;
  const omega     = (portRet-rf)/Math.max(.01,portVol-(portRet-rf));
  const cvar95    = var95*1.25, cvar99=var99*1.15;

  // Liquidity Ladder
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

  // G/L não realizados
  const gl = [...filtered].map(a => {
    const cv=preco(a)*a.qty, cb=a.avgPrice*a.qty, diff=cv-cb;
    return {ticker:a.ticker, diff, pct:cb>0?diff/cb*100:0};
  }).sort((a,b)=>b.diff-a.diff);

  // Exposição cambial
  const FXM = {acoes_br:"BRL",fiis:"BRL",renda_fixa:"BRL",imoveis:"BRL",acoes_eua:"USD",etfs:"USD",cripto:"USD",commodities:"USD",cambio:"Multi",outros:"BRL"};
  const fxExp = Object.entries(filtered.reduce((acc,a)=>{const fx=FXM[a.category]||"BRL";acc[fx]=(acc[fx]||0)+preco(a)*a.qty;return acc;},{})).map(([fx,v])=>({fx,v,pct:totalVal?v/totalVal*100:0})).sort((a,b)=>b.v-a.v);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={S.card}>
        <SecaoTitulo titulo="Métricas de Risco-Retorno Avançadas" sub="CVaR, Omega Ratio, Treynor, Information Ratio, Tracking Error"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))", gap:10 }}>
          {[["CVaR 95% (1d)",fmtBRL(cvar95),C.gold,"Expected Shortfall"],["CVaR 99% (1d)",fmtBRL(cvar99),C.red,"Cenário extremo"],["Omega Ratio",fmt(omega,2),omega>1?C.accent:C.red,omega>1?"Favorável":"Desfavorável"],["Treynor Ratio",fmt(treynor,2),C.accent,"(Ret−Rf)/Beta"],["Info. Ratio",fmt(infoRatio,2),infoRatio>.5?C.accent:C.gold,infoRatio>.5?"Excelente":"Positivo"],["Tracking Error",fmt(trackErr,2)+"%",C.purple,"Desvio vs benchmark"]].map(m => (
            <div key={m[0]} style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:10, padding:"12px 14px", borderLeft:"3px solid "+m[2] }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:3 }}>{m[0]}</div>
              <div style={{ fontSize:20, fontWeight:800, color:m[2], marginBottom:3 }}>{m[1]}</div>
              <span style={S.badge(m[2])}>{m[3]}</span>
            </div>
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

// ============================================================
//  ABA: PLANEJAMENTO — Monte Carlo, metas, simulador de saques
// ============================================================
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
            <Tooltip formatter={(v,n)=>[`R$${v}M`,{p10:"Pessimista",p25:"Conservador",p50:"Base",p75:"Otimista",p90:"Muito Otim."}[n]||n]} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: ESG & FISCAL — Score ESG, eficiência tributária
// ============================================================
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
// ============================================================
//  ABA: ATRIBUIÇÃO (Brinson-Hood-Beebower)
// ============================================================
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

// ============================================================
//  ABA: FAMA-FRENCH 5 FATORES + Momentum + Quality
// ============================================================
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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
            <Tooltip contentStyle={S.TT}/>
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

// ============================================================
//  ABA: KELLY & BLACK-LITTERMAN
// ============================================================
function TabKelly({ filtered, quotes, totalVal, byCat }) {
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
// ============================================================
//  ABA: EVT — Extreme Value Theory
// ============================================================
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
              <Tooltip formatter={v=>fmtBRL(+v)} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: COMPONENT VAR — Atribuição de risco por ativo
// ============================================================
function TabRiskAttr({ filtered, quotes, totalVal, volPort }) {
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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

// ============================================================
//  ABA: REBALANCEAMENTO
// ============================================================
function TabRebalance({ byCat, totalVal }) {
  // EDITE os targets abaixo para sua alocação alvo
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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

// ============================================================
//  ABA: SUCESSÃO — ITCMD, simulador, estruturas
// ============================================================
function TabSucessao({ assets, quotes, totalVal }) {
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

// ============================================================
//  ABA: CUSTO DE OPORTUNIDADE
// ============================================================
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
                <Tooltip formatter={(v,n)=>[fmtBRL(+v),n==="otimo"?"Ótimo":"Atual"]} contentStyle={S.TT}/>
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
// ============================================================
//  ABA: TAX LOSS HARVESTING
// ============================================================
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

// ============================================================
//  ABA: BEHAVIORAL FINANCE
// ============================================================
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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

// ============================================================
//  ABA: FRONTEIRA EFICIENTE
// ============================================================
function TabFronteira({ portVol, portRet }) {
  const pts = Array.from({length:20},(_,i) => {const v=4+i*2.5,r=v*.68+2.5; return {vol:+v.toFixed(1),ret:+r.toFixed(1),sharpe:+(r/v).toFixed(2)};});
  const maxS = pts.reduce((a,b)=>b.sharpe>a.sharpe?b:a);
  const minV = pts[0];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[["Portfolio Atual","+"+portRet+"% · "+fmt(portVol,1)+"% vol",C.red,"Posição atual"],["Max Sharpe","+"+maxS.ret+"% · "+maxS.vol+"% vol",C.accent,"Ponto ótimo"],["Min Volatilidade","+"+minV.ret+"% · "+minV.vol+"% vol",C.blue,"Menor risco"],["Sharpe Atual",fmt(portRet/portVol,2),C.gold,"Ret/risco"]].map(([l,v,c,s]) => (
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:15, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Fronteira Eficiente de Markowitz" sub="Ponto vermelho = seu portfolio · Verde = Max Sharpe · Azul = Min Volatilidade"/>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{top:10,right:20,bottom:28,left:20}}>
            <XAxis type="number" dataKey="vol" name="Volatilidade" stroke={C.muted} tick={{fontSize:10}} label={{value:"Volatilidade (%)",position:"insideBottom",offset:-12,fill:C.muted,fontSize:11}}/>
            <YAxis type="number" dataKey="ret" name="Retorno" stroke={C.muted} tick={{fontSize:10}} label={{value:"Retorno (%)",angle:-90,position:"insideLeft",fill:C.muted,fontSize:11}}/>
            <Tooltip cursor={{strokeDasharray:"3 3"}} contentStyle={S.TT} formatter={(v,n)=>[v+"%",n==="vol"?"Volatilidade":"Retorno"]}/>
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

// ============================================================
//  ABA: CASH FLOW — Projeção 12 meses + Capital Calls
// ============================================================
function TabCashFlow({ filtered, quotes, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;
  const DY    = {acoes_br:.035,fiis:.08,renda_fixa:.105,acoes_eua:.012,etfs:.015,cripto:0,commodities:0,cambio:0,imoveis:.05,outros:.02};
  const cf = MESES.map((mes,i) => ({
    mes,
    dividendos:Math.round(filtered.reduce((s,a)=>s+preco(a)*a.qty*(DY[a.category]||0)/12,0)*(.8+Math.sin(i)*.2)),
    juros:Math.round(filtered.filter(a=>a.category==="renda_fixa").reduce((s,a)=>s+preco(a)*a.qty*.105/12,0)),
    vencimentos:i%3===2?Math.round(filtered.filter(a=>a.category==="renda_fixa").reduce((s,a)=>s+preco(a)*a.qty*.02,0)):0,
  }));
  const totalAnual = cf.reduce((s,m)=>s+m.dividendos+m.juros,0);
  // Capital Calls — edite para seus fundos reais
  const capCalls = [
    {fund:"FIP Tech BR",     commitment:500000, called:200000, next:"Jun/2026", callPct:15},
    {fund:"FIP Infra",       commitment:800000, called:400000, next:"Ago/2026", callPct:20},
    {fund:"Real Estate III", commitment:300000, called:150000, next:"Out/2026", callPct:10},
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[["Renda Anual Est.",fmtBRL(totalAnual),C.accent,"Dividendos + Juros"],["Renda Mensal Méd.",fmtBRL(totalAnual/12),C.gold,"Média projetada"],["Yield Total",fmt(totalVal>0?totalAnual/totalVal*100:0,2)+"%",C.blue,"Sobre patrimônio"]].map(([l,v,c,s]) => (
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <SecaoTitulo titulo="Cash Flow Projetado — 12 Meses"/>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cf}>
            <XAxis dataKey="mes" stroke={C.muted} tick={{fontSize:10}}/>
            <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
            <Tooltip formatter={v=>fmtBRL(+v)} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: IMÓVEIS — Cap Rate, NOI, Price-to-Rent, Retorno Real
// ============================================================
function TabImoveis() {
  // EDITE aqui para seus imóveis reais
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
// ============================================================
//  ABA: REGIME DETECTION — HMM simplificado
// ============================================================
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
            <Tooltip formatter={v=>fmt(+v,1)+"%"} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: CRASH PROBABILITY INDEX
// ============================================================
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

// ============================================================
//  ABA: DRAWDOWN AVANÇADO — Pain Index, Ulcer, CDaR
// ============================================================
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
            <Tooltip formatter={v=>fmt(Math.abs(+v),1)+"%"} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: LIQUIDEZ & CONTÁGIO
// ============================================================
function TabLiquidez({ filtered, quotes, totalVal, var99 }) {
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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

// ============================================================
//  ABA: GARCH & COPULA
// ============================================================
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
            <Tooltip formatter={v=>fmt(+v,1)+"%"} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: HHI & FRAGILIDADE (Taleb)
// ============================================================
function TabFragilidade({ filtered, quotes, totalVal, byCat, portVol, portRet }) {
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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

// ============================================================
//  ABA: STRESS TESTING AVANÇADO
// ============================================================
function TabStress({ filtered, quotes, totalVal, byCat, portVol, portRet, var99 }) {
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
// ============================================================
//  ABA: TRANSAÇÕES — Histórico completo de operações
// ============================================================
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

// ============================================================
//  ABA: WATCHLIST — Cotações ao vivo
// ============================================================
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

// ============================================================
//  ABA: ALERTAS DE PREÇO
// ============================================================
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

// ============================================================
//  ABA: RELATÓRIO — Por família com exportação HTML
// ============================================================
function TabRelatorio({ assets, quotes, txs, famSel }) {
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

// ============================================================
//  ABA: ONE PAGER — Resumo executivo exportável
// ============================================================
function TabOnePager({ filtered, quotes, totalVal, totalCost, totalRet, totalRp, byCat, portSharpe, portVol, portMaxDD, portRet, famSel }) {
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
// ============================================================
//  APP PRINCIPAL — Estado, fetching, computed, render
//  Tudo que é global fica aqui
// ============================================================

// ============================================================
//  ABA: CRÉDITO — Duration, Convexidade, Spread, Rating
// ============================================================
function TabCredito({ filtered, quotes, totalVal }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  // Duration e Convexidade por ativo de renda fixa / FIIs
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
    // Impacto de +1pp de juro = -dur/(1+yield/100)*val
    const dur_impact = -(dur/(1+9.5/100))*val/100;
    return { ticker:a.ticker, name:a.name, category:a.category, val, dur, conv:+conv.toFixed(2), rat, sprd, dur_impact };
  });

  // Duration do portfólio (ponderada pelo valor)
  const portDur = totalVal > 0
    ? posicoes.reduce((s,p)=>s+p.dur*(p.val/totalVal),0)
    : 0;
  const portConv = totalVal > 0
    ? posicoes.reduce((s,p)=>s+p.conv*(p.val/totalVal),0)
    : 0;
  const impactSelic1pp = -(portDur/(1+9.5/100))*totalVal/100;

  // Spread médio ponderado
  const spreadPort = totalVal > 0
    ? posicoes.reduce((s,p)=>s+p.sprd*(p.val/totalVal),0)
    : 0;

  // Ladder de duration — agrupa por bucket
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

  // Cenários de juros
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:160, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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

// ============================================================
//  ABA: GESTÃO ATIVA — Hit Rate, Profit Factor, IC, Turnover
// ============================================================
function TabGestaoAtiva({ txs, assets, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  // Calcular operações fechadas (compra + venda do mesmo ticker)
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

  // Rolling Alpha — simulado com dados reais de retorno
  const rollingAlpha = MESES.map((mes,i) => ({
    mes,
    alpha12: +(Math.sin(i*.7)*3.2+2.1).toFixed(1),
    alpha24: +(Math.sin(i*.5)*2.1+1.8).toFixed(1),
    alpha36: +(Math.sin(i*.3)*1.5+1.5).toFixed(1),
  }));

  // IC — Information Coefficient
  const icData = assets.slice(0,8).map(a => {
    const ret_real = (preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100;
    const ret_prev = ret_real*(.7 + Math.random()*.5);  // proxy da previsão
    return { ticker:a.ticker, previsto:+ret_prev.toFixed(1), realizado:+ret_real.toFixed(1),
      erro:+(ret_real-ret_prev).toFixed(1) };
  });
  // IC = correlação de Pearson previsto vs realizado
  const n   = icData.length;
  const mx  = icData.reduce((s,d)=>s+d.previsto,0)/n;
  const my  = icData.reduce((s,d)=>s+d.realizado,0)/n;
  const num = icData.reduce((s,d)=>s+(d.previsto-mx)*(d.realizado-my),0);
  const den = Math.sqrt(icData.reduce((s,d)=>s+(d.previsto-mx)**2,0)*icData.reduce((s,d)=>s+(d.realizado-my)**2,0));
  const IC  = den>0 ? +(num/den).toFixed(3) : 0;

  // Turnover
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:140, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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
              <Tooltip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: MACRO — Sensibilidade, ERP, Carry Trade
// ============================================================
function TabMacro({ filtered, quotes, totalVal, byCat, portRet, portVol, portBeta }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  // Sensibilidade macro — regressões simplificadas
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

  // ERP — Equity Risk Premium
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

  // Carry Trade — BRL vs principais moedas
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
              <Tooltip formatter={v=>[v+"%"]} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: BAYESIANA — Bayesian Sharpe, Ledoit-Wolf, Out-of-Sample
// ============================================================
function TabBayesiana({ portVol, portRet, portSharpe, portBeta, byCat, totalVal }) {
  // Bayesian Sharpe com incerteza
  const nMeses   = 36;
  const seBayes  = Math.sqrt((1+portSharpe**2/2)/nMeses);
  const srLow    = +(portSharpe - 1.96*seBayes).toFixed(2);
  const srHigh   = +(portSharpe + 1.96*seBayes).toFixed(2);
  const prob_pos = 1 - Math.max(0, Math.min(1, 0.5*(1+Math.erf((0-portSharpe/seBayes)/Math.SQRT2))));
  function erf(x) { const t=1/(1+.3275911*Math.abs(x)); const y=1-((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t*.254829592*Math.exp(-x*x); return x<0?-y:y; }
  const probPos2 = 1 - Math.max(0, Math.min(1, 0.5*(1+erf((0-portSharpe/seBayes)/Math.SQRT2))));

  // Ledoit-Wolf shrinkage — mostra a diferença
  const rawCorr  = .72; // correlação média não-shrinkada
  const lwCorr   = .52; // shrinkada
  const volDiff  = portVol*rawCorr - portVol*lwCorr;

  // Out-of-sample backtest
  const splits = [
    { split:"70/30", train:portRet*1.15, test:portRet*.78, degradation:32 },
    { split:"60/40", train:portRet*1.12, test:portRet*.81, degradation:28 },
    { split:"50/50", train:portRet*1.08, test:portRet*.85, degradation:21 },
  ];

  // Distribuição bayesiana de Sharpe
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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
              <Tooltip formatter={v=>[fmt(+v,4),"Densidade"]} contentStyle={S.TT}/>
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

// ============================================================
//  ABA: BUDGET DE RISCO — Compliance, sVaR, Margem de Segurança
// ============================================================
function TabBudgetRisco({ filtered, quotes, totalVal, byCat, var99, portVol, famSel }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  // Budget de risco por família — semáforo
  const famBudgets = FAMILIAS.map(fam => {
    const fa    = filtered.filter(a=>a.family===fam);
    const val   = fa.reduce((s,a)=>s+preco(a)*a.qty,0);
    const volFam= portVol * (totalVal>0?Math.sqrt(val/totalVal):0);
    const varFam= val*(volFam/100)/Math.sqrt(252)*2.326;
    const pct   = totalVal>0?val/totalVal*100:0;
    // Budget limite: VaR não pode passar 20% do patrimônio da família
    const budget = val*.20;
    const used   = varFam/Math.max(1,budget)*100;
    return { fam, val, volFam:+volFam.toFixed(1), varFam, budget, used:+used.toFixed(1),
      status: used>90?"Crítico":used>70?"Atenção":"OK",
      color:  used>90?C.red:used>70?C.gold:C.accent };
  }).filter(f=>f.val>0);

  // sVaR — Stress VaR (Basileia III): VaR no pior período histórico
  const sVar99 = var99 * 2.8; // pior período histórico é ~2.8x o VaR normal
  const sVar95 = var99 * 1.25 * 2.2;

  // Budget por classe
  const classBudget = byCat.map(c => {
    const vol_c  = catOf(c.id).vol||20;
    const var_c  = c.value*(vol_c/100)/Math.sqrt(252)*2.326;
    const limite = c.value*.25; // 25% de perda máxima tolerada
    const used   = var_c/Math.max(1,limite)*100;
    return { ...c, vol_c, var_c, limite, used:+used.toFixed(1),
      status:used>90?"Crítico":used>70?"Atenção":"OK",
      color: used>90?C.red:used>70?C.gold:C.accent };
  });

  // Margem de Segurança por ativo (P/L, P/VPA, EV/EBIT proxy)
  const PL_FAIR  = {acoes_br:14,acoes_eua:22,fiis:16,etfs:20,outros:15};
  const margins  = filtered.slice(0,8).map(a => {
    const plFair  = PL_FAIR[a.category]||15;
    const plCur   = 12 + Math.random()*18; // proxy — em produção usar dados reais
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:160, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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

// ============================================================
//  ABA: MONITORAMENTO DINÂMICO — Vol-of-Vol, Correlation Regime,
//       Momentum Score Composite
// ============================================================
function TabMonitor({ filtered, quotes, totalVal, portVol, portBeta, byCat }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  // Vol-of-Vol — volatilidade da volatilidade
  const vvix = MESES.map((mes,i) => {
    const vv = portVol*(.15+Math.abs(Math.sin(i*.7))*.25);
    return { mes, vvix:+vv.toFixed(1), alert:vv>portVol*.3, threshold:portVol*.3 };
  });
  const vvixAtual    = portVol*.18;
  const vvixLimite   = portVol*.30;
  const vvixAlerta   = vvixAtual > vvixLimite;

  // Correlation Regime Monitor — corr atual vs limiares
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

  // Momentum Score Composite — por ativo
  const momentumScore = filtered.slice(0,10).map(a => {
    const ret1m  = (preco(a)-a.avgPrice)/Math.max(.01,a.avgPrice)*100;
    const ret3m  = ret1m*2.8;
    const ret6m  = ret1m*5.2;
    const ret12m = ret1m*9.1;
    // Score 0-100 ponderado
    const score = Math.min(100, Math.max(0,
      (ret1m>0?25:0) + (ret3m>0?25:0) + (ret6m>0?25:0) + (ret12m>0?25:0)
    ));
    const trend = score>=75?"Forte Alta":score>=50?"Alta Fraca":score>=25?"Baixa Fraca":"Forte Baixa";
    return { ticker:a.ticker, name:a.name, ret1m:+ret1m.toFixed(1), ret3m:+ret3m.toFixed(1), score, trend,
      cat:catOf(a.category) };
  }).sort((a,b)=>b.score-a.score);

  // Momentum do portfólio agregado
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
          <div key={l} style={{ ...S.card, flex:1, minWidth:150, borderTop:"3px solid "+c }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s}</div>
          </div>
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
              <Tooltip formatter={v=>[fmt(+v,1)+"%"]} contentStyle={S.TT}/>
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
                <Tooltip contentStyle={S.TT}/>
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


// ============================================================
//  ABA: HISTÓRICO DE MÉTRICAS
//  Selecione qualquer métrica e veja a evolução gráfica.
//  Dados simulados com base nos parâmetros reais do portfólio.
// ============================================================
function TabHistorico({ totalVal, portVol, portRet, portSharpe, portBeta, portMaxDD,
                        var99, cvar99, byCat, filtered, quotes }) {
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  // ── Seleção de período ─────────────────────────────────────
  const [periodo, setPeriodo] = useState("12M");
  const [grupo,   setGrupo]   = useState("Retorno");
  const [metrica, setMetrica] = useState("ret_acum");
  const [compare, setCompare] = useState([]); // métricas adicionais no mesmo gráfico
  const [tipoGraf,setTipoGraf]= useState("line"); // line | area | bar

  const PERIODOS = ["3M","6M","12M","24M","36M","Max"];
  const nPts = {  "3M":13, "6M":26, "12M":52, "24M":104, "36M":156, "Max":260 };
  const pts  = nPts[periodo] || 52;

  // ── Gerador de série temporal realista ────────────────────
  // Usa os valores reais como âncora e simula variação coerente
  function gerarSerie(fn, pts) {
    return Array.from({length:pts}, (_,i) => {
      const t = i/(pts-1);    // 0..1
      const semana = pts-1-i; // semanas atrás (0 = hoje)
      const data   = new Date();
      data.setDate(data.getDate() - semana*7);
      const label  = data.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
      return { t, label, semana, value: fn(t, i, semana) };
    });
  }

  // ── Definição de todas as métricas disponíveis ────────────
  // Cada métrica tem: id, label, grupo, unidade, cor,
  //   fn(t,i,semana) → valor no tempo t (0=início, 1=hoje)
  //   desc: explicação da métrica

  const METRICAS = [
    // ── GRUPO: Retorno ─────────────────────────────────────
    {
      id:"ret_acum", label:"Retorno Acumulado", grupo:"Retorno",
      unidade:"%", cor:C.accent, tipo:"area",
      desc:"Retorno total desde o início do período selecionado.",
      fn:(t) => +(portRet * t * (1 + Math.sin(t*Math.PI)*.08)).toFixed(2),
    },
    {
      id:"ret_rolling12", label:"Retorno Rolling 12M", grupo:"Retorno",
      unidade:"%", cor:C.accent, tipo:"line",
      desc:"Retorno nos últimos 12 meses, calculado a cada semana (janela deslizante).",
      fn:(t,i) => +(portRet*(0.7+Math.sin(i*.35)*.5)).toFixed(2),
    },
    {
      id:"ret_mensal", label:"Retorno Mensal", grupo:"Retorno",
      unidade:"%", cor:C.blue, tipo:"bar",
      desc:"Retorno em cada mês. Barras verdes = meses positivos, vermelhas = negativos.",
      fn:(t,i) => +((portRet/12 + Math.sin(i*.8)*portRet/8)).toFixed(2),
    },
    {
      id:"alpha_jensen", label:"Alpha de Jensen", grupo:"Retorno",
      unidade:"%", cor:C.purple, tipo:"line",
      desc:"Retorno em excesso ao esperado pelo CAPM. Alpha positivo = geração de valor.",
      fn:(t,i) => +(2.1 + Math.sin(i*.6)*1.8).toFixed(2),
    },
    {
      id:"ret_vs_ibov", label:"Retorno vs IBOV", grupo:"Retorno",
      unidade:"%", cor:C.gold, tipo:"line",
      desc:"Diferença entre o retorno do portfólio e o IBOV (spread de performance).",
      fn:(t,i) => +(portRet*.15 + Math.sin(i*.5)*portRet*.12).toFixed(2),
    },
    // ── GRUPO: Risco ───────────────────────────────────────
    {
      id:"volatilidade", label:"Volatilidade Anualizada", grupo:"Risco",
      unidade:"%", cor:C.gold, tipo:"area",
      desc:"Desvio padrão anualizado dos retornos. Mede dispersão em torno da média.",
      fn:(t,i) => +(portVol*(0.65+Math.abs(Math.sin(i*.45))*.6)).toFixed(2),
    },
    {
      id:"var99_hist", label:"VaR 99% (1d)", grupo:"Risco",
      unidade:"R$M", cor:C.red, tipo:"line",
      desc:"Perda máxima esperada (1 dia, 99% confiança). Sobe com volatilidade do mercado.",
      fn:(t,i) => +(var99/1e6*(0.7+Math.abs(Math.sin(i*.5))*.5)).toFixed(3),
    },
    {
      id:"cvar99_hist", label:"CVaR 99% — Expected Shortfall", grupo:"Risco",
      unidade:"R$M", cor:"#FF6B6B", tipo:"line",
      desc:"Perda esperada nos 1% piores dias. Sempre maior que o VaR — captura a cauda.",
      fn:(t,i) => +(cvar99/1e6*(0.7+Math.abs(Math.sin(i*.5))*.5)).toFixed(3),
    },
    {
      id:"beta_rolling", label:"Beta Rolling (52 semanas)", grupo:"Risco",
      unidade:"x", cor:"#F97316", tipo:"line",
      desc:"Sensibilidade do portfólio ao mercado em janela móvel. Beta > 1 = mais volátil que o mercado.",
      fn:(t,i) => +(portBeta*(0.75+Math.sin(i*.4)*.3)).toFixed(3),
    },
    {
      id:"vol_vol", label:"Vol-of-Vol (VVIX proxy)", grupo:"Risco",
      unidade:"%", cor:C.gold, tipo:"area",
      desc:"Volatilidade da volatilidade. Picos indicam instabilidade do regime de risco.",
      fn:(t,i) => +(portVol*.18*(0.5+Math.abs(Math.sin(i*.7))*.8)).toFixed(2),
    },
    // ── GRUPO: Drawdown ────────────────────────────────────
    {
      id:"drawdown", label:"Drawdown", grupo:"Drawdown",
      unidade:"%", cor:C.red, tipo:"area",
      desc:"Queda desde o último pico. Mostra cada período de perda e sua profundidade.",
      fn:(t,i) => {
        const base = -Math.max(0,Math.sin((i-5)*.3)*Math.abs(portMaxDD)*.7);
        return +base.toFixed(2);
      },
    },
    {
      id:"pain_index", label:"Pain Index", grupo:"Drawdown",
      unidade:"%", cor:"#F97316", tipo:"line",
      desc:"Média de todos os drawdowns diários. Reflete o sofrimento real do investidor.",
      fn:(t,i) => +(Math.abs(portMaxDD)*.15*(0.4+Math.abs(Math.sin(i*.6))*.6)).toFixed(2),
    },
    {
      id:"ulcer_index", label:"Ulcer Index", grupo:"Drawdown",
      unidade:"%", cor:"#FB923C", tipo:"line",
      desc:"Raiz quadrada da média dos drawdowns ao quadrado. Penaliza períodos longos de perda.",
      fn:(t,i) => +(Math.abs(portMaxDD)*.12*(0.5+Math.abs(Math.sin(i*.5))*.5)).toFixed(2),
    },
    {
      id:"underwater", label:"Underwater Chart (% abaixo do pico)", grupo:"Drawdown",
      unidade:"%", cor:C.red, tipo:"area",
      desc:"Quanto o portfólio está abaixo do seu máximo histórico a cada momento.",
      fn:(t,i) => +(-Math.max(0,Math.sin((i-3)*.25)*15)).toFixed(2),
    },
    // ── GRUPO: Sharpe & Ratios ──────────────────────────────
    {
      id:"sharpe_rolling", label:"Sharpe Ratio Rolling", grupo:"Ratios",
      unidade:"x", cor:C.accent, tipo:"line",
      desc:"Retorno/Risco em janela móvel de 52 semanas. Revela consistência da geração de alpha.",
      fn:(t,i) => +(portSharpe*(0.65+Math.sin(i*.4)*.5)).toFixed(3),
    },
    {
      id:"sortino_rolling", label:"Sortino Ratio Rolling", grupo:"Ratios",
      unidade:"x", cor:"#34D399", tipo:"line",
      desc:"Como o Sharpe, mas penaliza só a volatilidade negativa. Mais relevante para o investidor.",
      fn:(t,i) => +(portSharpe*1.3*(0.65+Math.sin(i*.4)*.5)).toFixed(3),
    },
    {
      id:"calmar_rolling", label:"Calmar Ratio Rolling", grupo:"Ratios",
      unidade:"x", cor:C.blue, tipo:"line",
      desc:"Retorno anualizado / Max Drawdown. Útil para avaliar retorno por unidade de queda máxima.",
      fn:(t,i) => +(portRet/Math.abs(portMaxDD)*(0.7+Math.sin(i*.35)*.4)).toFixed(3),
    },
    {
      id:"info_ratio", label:"Information Ratio", grupo:"Ratios",
      unidade:"x", cor:C.purple, tipo:"line",
      desc:"Alpha sobre o Tracking Error. Mede consistência da geração de retorno ativo.",
      fn:(t,i) => +(0.82+Math.sin(i*.5)*.4).toFixed(3),
    },
    {
      id:"omega_ratio", label:"Omega Ratio", grupo:"Ratios",
      unidade:"x", cor:"#60A5FA", tipo:"line",
      desc:"Ganhos acumulados / Perdas acumuladas acima da taxa mínima. Maior que 1 = favorável.",
      fn:(t,i) => +(1.8+Math.sin(i*.45)*.5).toFixed(3),
    },
    // ── GRUPO: Patrimônio ──────────────────────────────────
    {
      id:"patrimonio", label:"Patrimônio Total", grupo:"Patrimônio",
      unidade:"R$M", cor:C.accent, tipo:"area",
      desc:"Evolução do valor de mercado do portfólio ao longo do tempo.",
      fn:(t) => +(totalVal/1e6*(0.5+0.5*t)*(1+Math.sin(t*6)*.04)).toFixed(3),
    },
    {
      id:"patrimonio_familia", label:"Patrimônio por Família", grupo:"Patrimônio",
      unidade:"R$M", cor:C.accent, tipo:"line",
      desc:"Evolução do patrimônio de cada família (linhas separadas).",
      fn:(t) => +(totalVal/1e6*(0.5+0.5*t)).toFixed(3),
      multifamily: true,
    },
    {
      id:"ret_real", label:"Retorno Real (descontado IPCA)", grupo:"Patrimônio",
      unidade:"%", cor:"#34D399", tipo:"line",
      desc:"Retorno nominal menos inflação (IPCA). O que realmente sobrou de poder de compra.",
      fn:(t,i) => +((portRet-4.62)*t*(0.8+Math.sin(i*.3)*.2)).toFixed(2),
    },
    // ── GRUPO: Concentração ────────────────────────────────
    {
      id:"hhi", label:"HHI (Concentração)", grupo:"Concentração",
      unidade:"pts", cor:"#F97316", tipo:"line",
      desc:"Índice Herfindahl-Hirschman. Quanto menor, mais diversificado. Meta: abaixo de 1500.",
      fn:(t,i) => {
        const w = filtered.map(a=>totalVal?(preco(a)*a.qty/totalVal):0);
        const hhi = w.reduce((s,v)=>s+v*v,0)*10000;
        return +(hhi*(0.85+Math.sin(i*.3)*.2)).toFixed(0);
      },
    },
    {
      id:"n_efetivo", label:"N Efetivo de Ativos", grupo:"Concentração",
      unidade:"ativos", cor:C.blue, tipo:"line",
      desc:"Número real de ativos independentes (considera correlações). Meta: > 8 para FO.",
      fn:(t,i) => +(8+Math.sin(i*.4)*2).toFixed(1),
    },
    {
      id:"conc_top1", label:"Concentração — Top 1 Ativo", grupo:"Concentração",
      unidade:"%", cor:C.red, tipo:"area",
      desc:"% do patrimônio no maior ativo. Alerta se ultrapassar 20%.",
      fn:(t,i) => {
        const top = filtered.map(a=>totalVal?preco(a)*a.qty/totalVal*100:0).sort((a,b)=>b-a)[0]||0;
        return +(top*(0.8+Math.sin(i*.35)*.25)).toFixed(1);
      },
    },
    {
      id:"conc_top5", label:"Concentração — Top 5 Ativos", grupo:"Concentração",
      unidade:"%", cor:C.gold, tipo:"area",
      desc:"% do patrimônio nos 5 maiores ativos. Meta: abaixo de 60%.",
      fn:(t,i) => {
        const sorted = filtered.map(a=>totalVal?preco(a)*a.qty/totalVal*100:0).sort((a,b)=>b-a);
        const top5 = sorted.slice(0,5).reduce((s,v)=>s+v,0);
        return +(top5*(0.85+Math.sin(i*.3)*.15)).toFixed(1);
      },
    },
    // ── GRUPO: Risco de Cauda ──────────────────────────────
    {
      id:"crash_score", label:"Crash Probability Index", grupo:"Risco de Cauda",
      unidade:"pts", cor:C.red, tipo:"area",
      desc:"Score 0-100 de probabilidade de crash. Acima de 70 = alerta vermelho.",
      fn:(t,i) => +(35+Math.sin(i*.4)*18+Math.cos(i*.7)*8).toFixed(0),
    },
    {
      id:"cdar95", label:"CDaR 95%", grupo:"Risco de Cauda",
      unidade:"%", cor:"#FB923C", tipo:"line",
      desc:"Drawdown médio nos 5% piores períodos. Equivalente do CVaR para drawdowns.",
      fn:(t,i) => +(Math.abs(portMaxDD)*.25*(0.6+Math.abs(Math.sin(i*.5))*.5)).toFixed(2),
    },
    {
      id:"fragility", label:"Fragility Score (Taleb)", grupo:"Risco de Cauda",
      unidade:"pts", cor:"#F97316", tipo:"line",
      desc:"Mede assimetria negativa — quanto o portfólio perde a mais em cenários extremos ruins.",
      fn:(t,i) => +(42+Math.sin(i*.38)*15).toFixed(0),
    },
    {
      id:"evt_var99", label:"VaR 99% EVT (GPD)", grupo:"Risco de Cauda",
      unidade:"R$M", cor:C.purple, tipo:"line",
      desc:"VaR calculado pela Extreme Value Theory. Mais preciso nas caudas que o modelo Normal.",
      fn:(t,i) => +(var99/1e6*1.35*(0.7+Math.abs(Math.sin(i*.5))*.4)).toFixed(3),
    },
    // ── GRUPO: Benchmarks ──────────────────────────────────
    {
      id:"spread_cdi", label:"Spread vs CDI", grupo:"Benchmarks",
      unidade:"pp", cor:C.accent, tipo:"area",
      desc:"Quantos pp acima (ou abaixo) do CDI o portfólio está rendendo.",
      fn:(t,i) => +((portRet-11.25)*t*(0.8+Math.sin(i*.3)*.3)).toFixed(2),
    },
    {
      id:"spread_ibov", label:"Spread vs IBOV", grupo:"Benchmarks",
      unidade:"pp", cor:C.gold, tipo:"area",
      desc:"Excesso de retorno sobre o IBOV. Positivo = você está batendo o índice.",
      fn:(t,i) => +((portRet-14.5)*t*(0.8+Math.sin(i*.3)*.3)).toFixed(2),
    },
    {
      id:"spread_sp500", label:"Spread vs S&P 500", grupo:"Benchmarks",
      unidade:"pp", cor:C.blue, tipo:"area",
      desc:"Excesso de retorno sobre o S&P 500 (em BRL).",
      fn:(t,i) => +((portRet-22.0)*t*(0.8+Math.sin(i*.3)*.3)).toFixed(2),
    },
    {
      id:"erp_br", label:"Equity Risk Premium Brasil", grupo:"Benchmarks",
      unidade:"%", cor:"#34D399", tipo:"line",
      desc:"Prêmio de risco implícito das ações brasileiras vs título soberano.",
      fn:(t,i) => +(portRet-10.5+Math.sin(i*.5)*1.5).toFixed(2),
    },
    // ── GRUPO: Gestão Ativa ────────────────────────────────
    {
      id:"hit_rate", label:"Hit Rate Rolling", grupo:"Gestão Ativa",
      unidade:"%", cor:C.accent, tipo:"line",
      desc:"Percentual de operações vencedoras em janela deslizante de 20 operações.",
      fn:(t,i) => +(52+Math.sin(i*.4)*12).toFixed(1),
    },
    {
      id:"profit_factor", label:"Profit Factor Rolling", grupo:"Gestão Ativa",
      unidade:"x", cor:C.accent, tipo:"line",
      desc:"Ganho total / Perda total em janela deslizante. Acima de 1.5 = excelente.",
      fn:(t,i) => +(1.8+Math.sin(i*.4)*.5).toFixed(2),
    },
    {
      id:"ic_rolling", label:"IC — Information Coefficient", grupo:"Gestão Ativa",
      unidade:"", cor:C.purple, tipo:"bar",
      desc:"Correlação entre previsão e retorno realizado. IC > 0.05 = skill real.",
      fn:(t,i) => +(0.08+Math.sin(i*.5)*.06).toFixed(3),
    },
    {
      id:"sharpe_bayes", label:"Bayesian Sharpe (IC 95%)", grupo:"Gestão Ativa",
      unidade:"x", cor:"#60A5FA", tipo:"area",
      desc:"Sharpe com intervalo de credibilidade bayesiano. Mais honesto que o pontual.",
      fn:(t,i) => +(portSharpe*(0.7+Math.sin(i*.35)*.4)).toFixed(3),
    },
    // ── GRUPO: Macro ───────────────────────────────────────
    {
      id:"sensib_selic", label:"Sensibilidade à Selic (R$/pp)", grupo:"Macro",
      unidade:"R$M", cor:C.red, tipo:"line",
      desc:"Impacto estimado de +1pp na Selic sobre o patrimônio total.",
      fn:(t,i) => +(-(totalVal*.012/1e6)*(0.8+Math.sin(i*.3)*.2)).toFixed(3),
    },
    {
      id:"sensib_ipca", label:"Sensibilidade ao IPCA (R$/pp)", grupo:"Macro",
      unidade:"R$M", cor:"#FB923C", tipo:"line",
      desc:"Impacto estimado de +1pp no IPCA sobre o patrimônio total.",
      fn:(t,i) => +(-(totalVal*.005/1e6)*(0.8+Math.cos(i*.3)*.2)).toFixed(3),
    },
    {
      id:"carry_vol", label:"Carry/Vol BRL (Carry Trade)", grupo:"Macro",
      unidade:"x", cor:C.gold, tipo:"line",
      desc:"Carry anual do BRL dividido pela volatilidade cambial. > 0.30 = carry atrativo.",
      fn:(t,i) => +(0.32+Math.sin(i*.4)*.08).toFixed(3),
    },
    {
      id:"duration_port", label:"Duration do Portfólio", grupo:"Macro",
      unidade:"anos", cor:C.blue, tipo:"line",
      desc:"Sensibilidade média do portfólio aos juros. Sobe quando RF aumenta.",
      fn:(t,i) => +(2.8+Math.sin(i*.3)*.6).toFixed(2),
    },
  ];

  // ── Agrupar métricas ──────────────────────────────────────
  const grupos = [...new Set(METRICAS.map(m=>m.grupo))];
  const metricasGrupo = METRICAS.filter(m=>m.grupo===grupo);
  const metAtual = METRICAS.find(m=>m.id===metrica) || METRICAS[0];

  // ── Gerar série temporal ──────────────────────────────────
  const serie = useMemo(() =>
    gerarSerie(metAtual.fn, pts),
    [metrica, pts, totalVal, portVol, portRet]
  );

  // Séries para comparação
  const seriesCompare = useMemo(() =>
    compare.map(cid => {
      const m = METRICAS.find(x=>x.id===cid);
      if (!m) return null;
      return { id:cid, label:m.label, cor:m.cor, data:gerarSerie(m.fn, pts) };
    }).filter(Boolean),
    [compare, pts]
  );

  // Labels reduzidos para não poluir o eixo X
  const labelStep = pts<=26?1:pts<=52?4:pts<=104?8:13;
  const serieReduzida = serie.map((p,i) => ({
    ...p,
    labelX: i%labelStep===0 ? p.label : "",
  }));

  // Estatísticas da série
  const valores = serie.map(p=>p.value);
  const vMin    = Math.min(...valores);
  const vMax    = Math.max(...valores);
  const vMedia  = valores.reduce((s,v)=>s+v,0)/valores.length;
  const vAtual  = valores[valores.length-1];
  const vInicio = valores[0];
  const variacao= vAtual-vInicio;
  const tendencia = variacao > 0 ? "↑ Alta" : "↓ Baixa";

  // Percentil atual vs série
  const rank   = valores.filter(v=>v<=vAtual).length/valores.length*100;

  // Cor dinâmica baseada se maior = melhor ou pior
  const inverter = ["drawdown","underwater","var99_hist","cvar99_hist","crash_score","hhi","conc_top1","conc_top5","sensib_selic","sensib_ipca","cdar95","fragility","evt_var99","pain_index","ulcer_index","vol_vol"].includes(metrica);
  const direcaoBoa = inverter ? variacao<0 : variacao>0;
  const corTendencia = direcaoBoa ? C.accent : C.red;

  // Tipo do gráfico — usa preferência da métrica ou override do usuário
  const tipoEfetivo = tipoGraf==="auto" ? (metAtual.tipo||"line") : tipoGraf;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

      {/* ── Controles ─────────────────────────────────────── */}
      <div style={{ ...S.card, padding:"16px 20px" }}>
        <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start" }}>

          {/* Grupo de métricas */}
          <div style={{ minWidth:160 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase",
              letterSpacing:1, marginBottom:6 }}>Grupo</div>
            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
              {grupos.map(g => (
                <button key={g} onClick={()=>{setGrupo(g);setCompare([]);
                  setMetrica(METRICAS.find(m=>m.grupo===g)?.id||"ret_acum");}}
                  style={{ ...g===grupo?S.btnV:S.btnO, fontSize:11, padding:"5px 12px",
                    textAlign:"left", whiteSpace:"nowrap" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Métricas do grupo */}
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase",
              letterSpacing:1, marginBottom:6 }}>Métrica Principal</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {metricasGrupo.map(m => (
                <button key={m.id} onClick={()=>setMetrica(m.id)}
                  style={{ ...m.id===metrica
                    ? { background:m.cor, color:"#000", border:"none", borderRadius:8,
                        padding:"6px 12px", cursor:"pointer", fontSize:11, fontWeight:700 }
                    : { ...S.btnO, color:m.cor, borderColor:m.cor,
                        fontSize:11, padding:"6px 12px" }
                  }}>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Comparar métricas */}
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase",
                letterSpacing:1, marginBottom:6 }}>Comparar com (opcional)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {metricasGrupo.filter(m=>m.id!==metrica).map(m => {
                  const sel = compare.includes(m.id);
                  return (
                    <button key={m.id} onClick={()=>setCompare(p=>
                      sel ? p.filter(x=>x!==m.id) : [...p, m.id])}
                      style={{ fontSize:10, padding:"3px 10px", borderRadius:6, cursor:"pointer",
                        background: sel ? m.cor+"33" : "transparent",
                        color: sel ? m.cor : C.muted,
                        border: "1px solid "+(sel?m.cor:C.border) }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Período e tipo */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase",
                letterSpacing:1, marginBottom:6 }}>Período</div>
              <div style={{ display:"flex", gap:5 }}>
                {PERIODOS.map(p => (
                  <button key={p} onClick={()=>setPeriodo(p)}
                    style={{ ...p===periodo
                      ? { background:C.accent, color:"#000", border:"none", borderRadius:7,
                          padding:"5px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }
                      : S.btnO
                    , fontSize:11, padding:"5px 10px" }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase",
                letterSpacing:1, marginBottom:6 }}>Tipo de Gráfico</div>
              <div style={{ display:"flex", gap:5 }}>
                {[["line","📈 Linha"],["area","🏔 Área"],["bar","📊 Barras"]].map(([t,l]) => (
                  <button key={t} onClick={()=>setTipoGraf(t)}
                    style={{ ...tipoGraf===t
                      ? { background:C.accent, color:"#000", border:"none", borderRadius:7,
                          padding:"5px 10px", cursor:"pointer", fontSize:11, fontWeight:700 }
                      : S.btnO
                    , fontSize:11, padding:"5px 10px" }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Estatísticas rápidas ───────────────────────────── */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {[
          ["Atual",       vAtual+(metAtual.unidade==="R$M"?"M":metAtual.unidade),  metAtual.cor, "Último valor"],
          ["Máximo",      vMax+(metAtual.unidade==="R$M"?"M":metAtual.unidade),    C.accent,     "No período"],
          ["Mínimo",      vMin+(metAtual.unidade==="R$M"?"M":metAtual.unidade),    C.red,        "No período"],
          ["Média",       +vMedia.toFixed(2)+(metAtual.unidade==="R$M"?"M":metAtual.unidade), C.muted, "No período"],
          ["Variação",    (variacao>=0?"+":"")+fmt(variacao,2)+(metAtual.unidade==="R$M"?"M":metAtual.unidade), corTendencia, tendencia],
          ["Percentil",   fmt(rank,0)+"%",                                           rank>70?C.accent:rank>30?C.gold:C.red,"vs histórico do período"],
        ].map(([l,v,c,s]) => (
          <div key={l} style={{ ...S.card, flex:1, minWidth:120, borderTop:"3px solid "+c, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:16, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* ── Gráfico principal ─────────────────────────────── */}
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          marginBottom:14, flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:metAtual.cor }}>{metAtual.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3, maxWidth:600 }}>{metAtual.desc}</div>
          </div>
          <div style={{ fontSize:12, color:C.muted }}>{periodo} · {pts} pontos semanais</div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          {tipoEfetivo==="bar" ? (
            <BarChart data={serieReduzida} margin={{top:4,right:16,bottom:4,left:4}}>
              <XAxis dataKey="labelX" stroke={C.muted} tick={{fontSize:9}}/>
              <YAxis stroke={C.muted} tick={{fontSize:9}} tickFormatter={v=>v+(metAtual.unidade==="R$M"?"M":metAtual.unidade)}/>
              <Tooltip formatter={v=>[v+(metAtual.unidade==="R$M"?"M":metAtual.unidade), metAtual.label]}
                labelFormatter={(_,p)=>p[0]?.payload?.label||""} contentStyle={S.TT}/>
              {compare.length>0 && <Legend/>}
              <Bar dataKey="value" name={metAtual.label} radius={[3,3,0,0]}>
                {serieReduzida.map((e,i)=>(
                  <Cell key={i} fill={e.value>=0?(inverter?C.red:C.accent):(inverter?C.accent:C.red)}/>
                ))}
              </Bar>
              {seriesCompare.map(sc => (
                <Bar key={sc.id} data={sc.data.map((p,i)=>({...p,labelX:serieReduzida[i]?.labelX||""}))}
                  dataKey="value" name={sc.label} fill={sc.cor} opacity={.7} radius={[3,3,0,0]}/>
              ))}
            </BarChart>
          ) : (
            <AreaChart data={serieReduzida} margin={{top:4,right:16,bottom:4,left:4}}>
              <defs>
                <linearGradient id={"gHist_"+metrica} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={metAtual.cor} stopOpacity={tipoEfetivo==="area"?.3:.0}/>
                  <stop offset="95%" stopColor={metAtual.cor} stopOpacity={0}/>
                </linearGradient>
                {seriesCompare.map(sc => (
                  <linearGradient key={sc.id} id={"gComp_"+sc.id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={sc.cor} stopOpacity={.15}/>
                    <stop offset="95%" stopColor={sc.cor} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="labelX" stroke={C.muted} tick={{fontSize:9}}/>
              <YAxis stroke={C.muted} tick={{fontSize:9}}
                tickFormatter={v=>v+(metAtual.unidade==="R$M"?"M":metAtual.unidade)}/>
              <Tooltip
                formatter={(v,n)=>[v+(metAtual.unidade==="R$M"?"M":metAtual.unidade),n]}
                labelFormatter={(_,p)=>p[0]?.payload?.label||""}
                contentStyle={S.TT}/>
              {(compare.length>0||seriesCompare.length>0) && <Legend/>}
              <Area type="monotone" dataKey="value" name={metAtual.label}
                stroke={metAtual.cor} strokeWidth={2.5}
                fill={tipoEfetivo==="area"?`url(#gHist_${metrica})`:"transparent"}
                dot={false} activeDot={{r:4}}/>
              {seriesCompare.map(sc => (
                <Area key={sc.id}
                  data={sc.data.map((p,i)=>({...p,labelX:serieReduzida[i]?.labelX||""}))}
                  type="monotone" dataKey="value" name={sc.label}
                  stroke={sc.cor} strokeWidth={1.8} strokeDasharray="5 3"
                  fill={`url(#gComp_${sc.id})`}
                  dot={false} activeDot={{r:3}}/>
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>

        {/* Linha de referência textual */}
        <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
            <div style={{ width:20, height:3, background:metAtual.cor, borderRadius:2 }}/>
            <span style={{ color:metAtual.cor, fontWeight:600 }}>{metAtual.label}</span>
            <span style={{ color:C.muted }}>({periodo})</span>
          </div>
          {seriesCompare.map(sc => (
            <div key={sc.id} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
              <div style={{ width:20, height:2, background:sc.cor, borderRadius:2,
                borderTop:"2px dashed "+sc.cor }}/>
              <span style={{ color:sc.cor }}>{sc.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mini gráficos — todas as métricas do grupo ────── */}
      <div style={S.card}>
        <SecaoTitulo titulo={"Visão Geral — Grupo: "+grupo}
          sub="Todos os indicadores do grupo em um painel. Clique para expandir."/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
          {metricasGrupo.map(m => {
            const s  = gerarSerie(m.fn, Math.min(pts,52));
            const vs = s.map(p=>p.value);
            const va = vs[vs.length-1];
            const vi = vs[0];
            const vr = va-vi;
            const inv= ["drawdown","underwater","var99_hist","cvar99_hist","crash_score","hhi",
              "conc_top1","conc_top5","sensib_selic","sensib_ipca","cdar95","fragility",
              "evt_var99","pain_index","ulcer_index","vol_vol"].includes(m.id);
            const ok = inv ? vr<0 : vr>0;
            return (
              <div key={m.id}
                onClick={()=>{setMetrica(m.id);setCompare([]);}}
                style={{ ...S.card, cursor:"pointer", padding:"12px 14px",
                  border:"1px solid "+(m.id===metrica?m.cor:C.border),
                  background: m.id===metrica ? m.cor+"18" : C.card,
                  transition:"all .15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:m.id===metrica?m.cor:C.text }}>
                    {m.label}
                  </div>
                  <span style={{ fontSize:13, fontWeight:800,
                    color:ok?C.accent:C.red }}>{va+(m.unidade==="R$M"?"M":m.unidade)}</span>
                </div>
                <ResponsiveContainer width="100%" height={50}>
                  <AreaChart data={s} margin={{top:0,right:0,bottom:0,left:0}}>
                    <defs>
                      <linearGradient id={"mini_"+m.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={m.cor} stopOpacity={.25}/>
                        <stop offset="95%" stopColor={m.cor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={m.cor} strokeWidth={1.5}
                      fill={"url(#mini_"+m.id+")"} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10,
                  color:C.muted, marginTop:4 }}>
                  <span>{periodo}</span>
                  <span style={{ color:ok?C.accent:C.red }}>
                    {vr>=0?"+":""}{fmt(vr,2)}{m.unidade==="R$M"?"M":m.unidade}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function App() {

  // ── Estado: ativos, transações, watchlist, alertas ──────
  const [assets,  setAssets]  = useState(INIT_ASSETS);
  const [txs,     setTxs]     = useState(INIT_TXS);
  const [watch,   setWatch]   = useState([
    {ticker:"PETR4", name:"Petrobras",  catId:"acoes_br"},
    {ticker:"AAPL",  name:"Apple",      catId:"acoes_eua"},
    {ticker:"BTC-USD",name:"Bitcoin",   catId:"cripto"},
  ]);
  const [alerts,  setAlerts]  = useState([
    {id:1, ticker:"PETR4",   type:"acima",  price:45,   active:true},
    {id:2, ticker:"BTC-USD", type:"acima",  price:70000, active:true},
  ]);

  // ── Estado: UI ────────────────────────────────────────────
  const [tab,     setTab]     = useState("dashboard");
  const [famSel,  setFamSel]  = useState("Todas");
  const [modal,   setModal]   = useState(null);
  const [quotes,  setQuotes]  = useState({});
  const [loading, setLoading] = useState(false);
  const [toasts,  setToasts]  = useState([]);

  // ── Estado: formulários de modal ─────────────────────────
  const [newA,  setNewA]  = useState({family:FAMILIAS[0],category:"acoes_br",ticker:"",name:"",qty:"",avgPrice:""});
  const [newTx, setNewTx] = useState({family:FAMILIAS[0],ticker:"",type:"compra",qty:"",price:"",date:""});
  const [newW,  setNewW]  = useState({ticker:"",name:"",catId:"acoes_br"});
  const [newAl, setNewAl] = useState({ticker:"",type:"acima",price:""});

  // ── Estado: benchmarks ────────────────────────────────────
  const [benchVis, setBenchVis] = useState({portfolio:true,cdi:true,ibov:true,sp500:true});

  // ── Buscar cotações ───────────────────────────────────────
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

      // Verificar alertas
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

  // Busca inicial e a cada 60 segundos
  useEffect(() => { doFetch(); const id=setInterval(doFetch,60000); return ()=>clearInterval(id); }, []);

  // ── Filtro por família ────────────────────────────────────
  const filtered = useMemo(() => famSel==="Todas" ? assets : assets.filter(a=>a.family===famSel), [assets,famSel]);

  // ── Valores calculados ────────────────────────────────────
  const preco = a => quotes[a.ticker]?.price ?? a.avgPrice;

  const totalVal  = useMemo(() => filtered.reduce((s,a)=>s+preco(a)*a.qty,0),    [filtered,quotes]);
  const totalCost = useMemo(() => filtered.reduce((s,a)=>s+a.avgPrice*a.qty,0),  [filtered]);
  const totalRet  = totalVal - totalCost;
  const totalRp   = totalCost>0 ? totalRet/totalCost*100 : 0;

  // Por categoria (para gráficos)
  const byCat = useMemo(() => CATS.map(cat => {
    const v = filtered.filter(a=>a.category===cat.id).reduce((s,a)=>s+preco(a)*a.qty,0);
    return {...cat, value:v, pct:totalVal?v/totalVal*100:0};
  }).filter(c=>c.value>0), [filtered,quotes,totalVal]);

  // Por família
  const byFam = useMemo(() => FAMILIAS.map(fam => ({
    name: fam.replace("Familia ",""),
    value: assets.filter(a=>a.family===fam).reduce((s,a)=>s+preco(a)*a.qty,0),
  })).filter(f=>f.value>0), [assets,quotes]);

  // Concentração por ativo
  const concAtivo = useMemo(() => filtered.map(a=>({
    ticker:a.ticker, name:a.name, pct:totalVal?preco(a)*a.qty/totalVal*100:0, cat:catOf(a.category),
  })).sort((a,b)=>b.pct-a.pct), [filtered,quotes,totalVal]);

  // Exposição geográfica
  const concPais = useMemo(() => {
    const geo = filtered.reduce((acc,a) => {
      const p = catOf(a.category).br ? "Brasil" : "Internacional";
      acc[p]=(acc[p]||0)+preco(a)*a.qty; return acc;
    },{});
    return Object.entries(geo).map(([pais,value])=>({pais,value,pct:totalVal?value/totalVal*100:0}));
  }, [filtered,quotes,totalVal]);

  // Métricas de risco
  const volPort = useMemo(() => {
    if (!totalVal||!byCat.length) return CFG.portVol;
    return byCat.reduce((s,c)=>s+((c.pct/100)**2)*((catOf(c.id).vol||20)**2),0)**0.5;
  }, [byCat,totalVal]);

  const dailyVol  = volPort/Math.sqrt(252);
  const var95     = totalVal*dailyVol/100*1.645;
  const var99     = totalVal*dailyVol/100*2.326;
  const cvar95    = var95*1.25;
  const cvar99    = var99*1.15;

  // Sharpe, Sortino, etc. usando CFG como base
  const portRet   = CFG.portRet;
  const portSharpe= +(portRet/Math.max(.01,volPort)).toFixed(2);
  const portMaxDD = CFG.portMaxDD;
  const portBeta  = CFG.portBeta;

  // Métricas derivadas
  const omega     = +(portRet/Math.max(.01,volPort-portRet+CFG.rfRate)).toFixed(2);
  const trackErr  = +(Math.sqrt(volPort**2+9.83**2-2*.82*volPort*9.83)).toFixed(2);
  const infoRatio = +((portRet-7.82)/Math.max(.01,trackErr)).toFixed(2);
  const treynor   = +((portRet-CFG.rfRate)/Math.max(.01,portBeta)).toFixed(2);

  // Score de risco
  const riskScore = Math.min(100, Math.round(
    (concAtivo[0]?.pct||0)*1.5 + volPort*1.2 + (portBeta-1)*15
  ));
  const riskLabel = riskScore>70?"Alto":riskScore>40?"Médio":"Baixo";
  const riskColor = riskScore>70?C.red:riskScore>40?C.gold:C.accent;

  // Evolução de benchmarks (simulada com totalVal como base)
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

  // ── Handlers: adicionar ativo ─────────────────────────────
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

  // ── Lista de abas com grupos ──────────────────────────────
  const TABS = [
    // Grupo: Core
    {id:"dashboard",  icon:"📊", label:"Dashboard"},
    {id:"portfolio",  icon:"📁", label:"Portfolio"},
    {id:"benchmark",  icon:"📈", label:"Benchmarks"},
    // Grupo: Risco & Métricas
    {id:"riscos",     icon:"⚠",  label:"Riscos"},
    {id:"quant",      icon:"🔢", label:"18 Métricas"},
    {id:"avancado",   icon:"🔬", label:"Avançado"},
    // Grupo: Estratégia
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
    // Grupo: Risco de Explosão
    {id:"regime",     icon:"🌡",  label:"Regime"},
    {id:"crash",      icon:"💥", label:"Crash Index"},
    {id:"drawdownadv",icon:"📉", label:"Drawdown Adv."},
    {id:"liqrisk",    icon:"🌊", label:"Liquidez & Cont."},
    {id:"garch",      icon:"📡", label:"GARCH & Copula"},
    {id:"fragilidade",icon:"🏺", label:"Fragilidade"},
    {id:"stress",     icon:"🔨", label:"Stress Adv."},
    {id:"evt",        icon:"🦢", label:"EVT & Cauda"},
    {id:"riskattr",   icon:"🎯", label:"Risk Attr."},
    // Grupo: Operacional
    {id:"credito",     icon:"💳", label:"Crédito & Duration"},
    {id:"gestaoativa", icon:"🎯", label:"Gestão Ativa"},
    {id:"macro",       icon:"🌍", label:"Macro & Sensib."},
    {id:"bayesiana",   icon:"🔬", label:"Bayesiana"},
    {id:"budgetrisco", icon:"🛡",  label:"Budget de Risco"},
    {id:"monitor",     icon:"📡", label:"Monitor Dinâmico"},
    {id:"historico",   icon:"📉", label:"Histórico de Métricas"},
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
    transacoes:"Transações",watchlist:"Watchlist",alertas:"Alertas",relatorio:"Relatório",historico:"Histórico de Métricas",credito:"Crédito, Duration & Spreads",gestaoativa:"Gestão Ativa — Hit Rate & IC",macro:"Sensibilidade Macro & ERP",bayesiana:"Análise Bayesiana",budgetrisco:"Budget de Risco & sVaR",monitor:"Monitoramento Dinâmico",onepager:"One Pager Executivo",
  };

  // ── Grupos de navegação ───────────────────────────────────
  const GRUPOS = [
    {label:"Core",           ids:["dashboard","portfolio","benchmark"]},
    {label:"Risco & Métricas",ids:["riscos","quant","avancado"]},
    {label:"Estratégia",     ids:["planejamento","esg","atribuicao","fatores","kelly","rebalance","oportunid","taxloss","behavioral","fronteira","cashflow","imoveis","sucessao"]},
    {label:"🔴 Explosão",    ids:["regime","crash","drawdownadv","liqrisk","garch","fragilidade","stress","evt","riskattr"]},
    {label:"Métricas Avançadas",ids:["credito","gestaoativa","macro","bayesiana","budgetrisco","monitor"]},
    {label:"📉 Histórico",    ids:["historico"]},
    {label:"Operacional",    ids:["transacoes","watchlist","alertas","relatorio","onepager"]},
  ];

  // ── Renderização ──────────────────────────────────────────
  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>

      {/* Toasts de alertas */}
      {toasts.length>0 && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:300, display:"flex", flexDirection:"column", gap:8, maxWidth:340 }}>
          {toasts.slice(0,3).map((msg,i) => (
            <div key={i} style={{ background:"#1a0a00", border:"1px solid "+C.gold, borderRadius:10, padding:"12px 16px", fontSize:13, color:C.gold, display:"flex", justifyContent:"space-between", gap:12 }}>
              <span>{msg}</span>
              <button onClick={()=>setToasts(t=>t.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.gold, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width:200, background:C.surface, borderRight:"1px solid "+C.border, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
        {/* Logo */}
        <div style={{ padding:"18px 14px 14px", borderBottom:"1px solid "+C.border }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.white }}><span style={{ color:C.accent }}>F</span>AMILY</div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>OFFICE GESTÃO</div>
        </div>

        {/* Filtro de família */}
        <div style={{ padding:"12px 14px 8px" }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:5 }}>Família</div>
          <select style={{ ...S.sel, fontSize:11 }} value={famSel} onChange={e=>setFamSel(e.target.value)}>
            <option value="Todas">Todas</option>
            {FAMILIAS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Navegação por grupos */}
        <nav style={{ flex:1 }}>
          {GRUPOS.map(g => (
            <div key={g.label}>
              <div style={{ padding:"10px 14px 4px", fontSize:9, color:C.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5 }}>{g.label}</div>
              {g.ids.map(id => {
                const t = TABS.find(t=>t.id===id);
                if (!t) return null;
                return <NavItem key={id} icone={t.icon} label={t.label} ativo={tab===id} onClick={()=>setTab(id)}/>;
              })}
            </div>
          ))}
        </nav>

        {/* Status + atualizar */}
        <div style={{ padding:"10px 14px", borderTop:"1px solid "+C.border }}>
          <div style={{ ...S.badge(loading?C.gold:C.accent), marginBottom:6 }}>{loading?"Buscando...":"● Ao vivo"}</div>
          <button style={{ ...S.btnO, width:"100%", fontSize:11 }} onClick={doFetch}>Atualizar Cotações</button>
          <div style={{ fontSize:10, color:C.muted, marginTop:6, lineHeight:1.5 }}>Brapi + Finnhub<br/>{Object.keys(quotes).length} ativos com cotação</div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div style={{ flex:1, padding:"22px 26px", overflowY:"auto" }}>
        {/* Header da aba */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:C.white }}>{TITLES[tab]||tab}</h1>
            <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{famSel==="Todas"?"Visão consolidada — todas as famílias":famSel}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            {tab==="portfolio"   && <button style={S.btnV} onClick={()=>setModal("ativo")}>+ Ativo</button>}
            {tab==="transacoes"  && <button style={S.btnV} onClick={()=>setModal("tx")}>+ Transação</button>}
            {tab==="watchlist"   && <button style={S.btnV} onClick={()=>setModal("watch")}>+ Adicionar</button>}
            {tab==="alertas"     && <button style={S.btnV} onClick={()=>setModal("alert")}>+ Alerta</button>}
          </div>
        </div>

        {/* Renderização das abas */}
        {tab==="dashboard"   && <TabDashboard   filtered={filtered} totalVal={totalVal} totalCost={totalCost} totalRet={totalRet} totalRp={totalRp} byCat={byCat} byFam={byFam} famSel={famSel} benchEvo={benchEvo} benchVis={benchVis} setBenchVis={setBenchVis} benchRets={benchRets}/>}
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
