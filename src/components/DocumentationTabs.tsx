import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, GitBranch, Database, Code2, StickyNote } from "lucide-react";
import { System } from "./SystemCard";
import { Textarea } from "@/components/ui/textarea";

interface DocumentationTabsProps {
  system: System | null;
}

export const DocumentationTabs = ({ system }: DocumentationTabsProps) => {
  if (!system) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Selecione um sistema na barra lateral para ver a documentação
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentação: {system.name}
        </CardTitle>
        <CardDescription>{system.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="flows">Fluxos</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="notes">Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Descrição</h3>
              <p className="text-sm text-muted-foreground">
                Sistema para gerenciamento de {system.category.toLowerCase()}.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Objetivo Principal</h3>
              <p className="text-sm text-muted-foreground">
                Centralizar e automatizar processos relacionados a {system.category.toLowerCase()}.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Principais Funcionalidades</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Cadastro e gerenciamento de registros</li>
                <li>Relatórios e dashboards analíticos</li>
                <li>Integração com outros sistemas</li>
                <li>Auditoria e rastreamento de mudanças</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="flows" className="space-y-3 mt-4">
            {[
              { name: "Processar Pedido", type: "automático", desc: "Fluxo automático para processar novos pedidos" },
              { name: "Baixar Estoque", type: "manual", desc: "Processo manual de baixa de estoque" },
              { name: "Gerar Relatório", type: "integração", desc: "Integração para geração de relatórios" },
            ].map((flow, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">{flow.name}</h4>
                    </div>
                    <Badge variant="outline">{flow.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{flow.desc}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <div className="space-y-3">
              {[
                { method: "GET", endpoint: "/api/items", desc: "Lista todos os itens" },
                { method: "POST", endpoint: "/api/items", desc: "Cria novo item" },
                { method: "PUT", endpoint: "/api/items/:id", desc: "Atualiza item" },
              ].map((api, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={api.method === "GET" ? "default" : "secondary"}>
                        {api.method}
                      </Badge>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {api.endpoint}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">{api.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-3 mt-4">
            {[
              { table: "items", desc: "Tabela principal de itens", fields: "id, name, status, created_at" },
              { table: "transactions", desc: "Histórico de transações", fields: "id, item_id, type, value" },
            ].map((table, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">{table.table}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{table.desc}</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    {table.fields}
                  </code>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Textarea
              placeholder="Digite suas anotações sobre este sistema..."
              className="min-h-[300px] resize-none"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
