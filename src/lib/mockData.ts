import { System } from "@/components/SystemCard";

export const mockSystems: System[] = [
  {
    id: "1",
    name: "Opus One – Estoque",
    slug: "opus-one-estoque",
    category: "Estoque",
    status: "online",
    description: "Sistema principal de gestão de estoque com controle kit-aware e movimentações",
  },
  {
    id: "2",
    name: "Financeiro Core",
    slug: "financeiro-core",
    category: "Financeiro",
    status: "online",
    description: "Módulo central de gestão financeira, contas a pagar e receber",
  },
  {
    id: "3",
    name: "Lotes App",
    slug: "lotes-app",
    category: "ERP Fábrica",
    status: "teste",
    description: "Aplicativo para controle de lotes de produção e rastreabilidade",
  },
  {
    id: "4",
    name: "Calculadora de Preços",
    slug: "calc-precos",
    category: "Calculadoras",
    status: "online",
    description: "Ferramenta para cálculo automático de precificação baseado em custos",
  },
  {
    id: "5",
    name: "Integrador SYS33",
    slug: "integrador-sys33",
    category: "Integração",
    status: "online",
    description: "Middleware de integração com sistema legado SYS33",
  },
  {
    id: "6",
    name: "Obsidian Docs",
    slug: "obsidian-docs",
    category: "ERP Fábrica",
    status: "depreciado",
    description: "Sistema antigo de documentação técnica (em migração)",
  },
];
