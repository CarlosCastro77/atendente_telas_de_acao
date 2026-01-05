"use client"

import * as React from "react"
import {
  Search,
  Plus,
  MessageSquare,
  CheckCircle2,
  Ban,
  Calendar,
  ChevronDown,
  MessageCircle,
  Check,
  RotateCcw,
  ArrowLeft,
  History,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { CSVExportDialog } from "@/components/csv-export-dialog" // Importado novo diálogo de exportação
import { getPatients, getPatientHistory, type Patient } from "@/app/actions/patients"

type ActionType = "nps" | "noshow" | "confirmation" | "mesotherapy"
type HistoryRecord = {
  id: string
  date: string
  time: string
  professional: string
  procedure: string
  obs: string
  markers: string
  status: string
}

export function ActionDashboard() {
  const [selectedAction, setSelectedAction] = React.useState<ActionType>("nps")
  const [patientsList, setPatientsList] = React.useState<Patient[]>([])
  const [historyList, setHistoryList] = React.useState<HistoryRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)
  const [view, setView] = React.useState<"dashboard" | "history">("dashboard")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [tableFilter, setTableFilter] = React.useState("")

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        console.log("[v0] Buscando dados para:", selectedAction)
        const data = await getPatients()
        setPatientsList(data)
      } catch (error) {
        console.error("[v0] Erro ao carregar pacientes:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, []) // Carrega apenas uma vez na montagem

  const handleToggleDone = (id: string, status: boolean) => {
    setPatientsList((prev) => {
      return prev.map((p) => (p._id === id ? { ...p, done: status } : p))
    })
  }

  React.useEffect(() => {
    async function loadHistory() {
      if (view === "history" && searchTerm.length > 2) {
        setIsLoadingHistory(true)
        try {
          const data = await getPatientHistory(searchTerm)
          // Mapear campos do banco para o formato da interface se necessário
          setHistoryList(data as any)
        } catch (error) {
          console.error("[v0] Erro ao carregar histórico:", error)
        } finally {
          setIsLoadingHistory(false)
        }
      } else {
        setHistoryList([])
      }
    }
    const debounceTimer = setTimeout(loadHistory, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, view])

  const getExportColumns = (type: ActionType) => {
    switch (type) {
      case "nps":
      case "noshow":
        return [
          { id: "date", label: "Data" },
          { id: "name", label: "Nome" },
          { id: "phone", label: "Telefone" },
          { id: "category", label: "Categoria" },
          { id: "status", label: "Status" },
        ]
      case "confirmation":
        return [
          { id: "date", label: "Data" },
          { id: "time", label: "Horário" },
          { id: "name", label: "Nome" },
          { id: "phone", label: "Telefone" },
          { id: "category", label: "Categoria" },
          { id: "status", label: "Status" },
        ]
      case "mesotherapy":
        return [
          { id: "name", label: "Nome do Paciente" },
          { id: "phone", label: "Telefone" },
          { id: "fase", label: "Fase" },
          { id: "totalSessao", label: "Total de Sessões" },
          { id: "ultimaSessao", label: "Última Sessão" },
          { id: "proximaData", label: "Próxima Data Sugerida" },
        ]
      default:
        return []
    }
  }

  const counts = React.useMemo(() => {
    return {
      nps: patientsList.filter((p) => p.status === "nps").length,
      noshow: patientsList.filter((p) => p.status === "noshow").length,
      confirmation: patientsList.filter((p) => p.status === "confirmation").length,
      mesotherapy: patientsList.filter((p) => p.status === "mesotherapy").length,
    }
  }, [patientsList])

  const filteredPatients = patientsList
    .filter((p) => p.status === selectedAction)
    .filter((p) => {
      if (!tableFilter) return true
      const search = tableFilter.toLowerCase()
      return (
        p.name.toLowerCase().includes(search) ||
        p.phone.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.displayStatus?.toLowerCase().includes(search) ||
        (selectedAction === "mesotherapy" && p.fase.toLowerCase().includes(search))
      )
    })
    .sort((a, b) => Number(a.done) - Number(b.done))

  return (
    <div className="flex h-screen bg-[#f8f8f9] text-[#333] overflow-hidden">
      {/* Sidebar: Navigation & Filas - Seguindo elementos gráficos da Basicx */}
      <aside className="w-72 border-r border-gray-200 flex flex-col bg-white shadow-sm">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F56E38] rounded-lg flex items-center justify-center text-white font-bold">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-[#333]">Novofio</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <Button size="icon" variant="ghost" className="text-gray-400">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-4 mb-6"></div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between px-3 mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Ações Pendentes</h3>
              </div>
              <div className="space-y-1">
                <NavItem
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Receber NPS"
                  count={counts.nps}
                  active={selectedAction === "nps" && view === "dashboard"}
                  onClick={() => {
                    setSelectedAction("nps")
                    setView("dashboard")
                  }}
                />
                <NavItem
                  icon={<Ban className="w-4 h-4" />}
                  label="No-show"
                  count={counts.noshow}
                  active={selectedAction === "noshow" && view === "dashboard"}
                  onClick={() => {
                    setSelectedAction("noshow")
                    setView("dashboard")
                  }}
                />
                <NavItem
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Confirmação"
                  count={counts.confirmation}
                  active={selectedAction === "confirmation" && view === "dashboard"}
                  onClick={() => {
                    setSelectedAction("confirmation")
                    setView("dashboard")
                  }}
                />
                <NavItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Mesoterapia"
                  count={counts.mesotherapy}
                  active={selectedAction === "mesotherapy" && view === "dashboard"}
                  onClick={() => {
                    setSelectedAction("mesotherapy")
                    setView("dashboard")
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between px-3 mb-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Histórico</h3>
              </div>
              <NavItem
                icon={<History className="w-4 h-4" />}
                label="Busca de Histórico"
                active={view === "history"}
                onClick={() => setView("history")}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-[#F56E38] text-white">PM</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#333]">Paulo Melo</p>
              <p className="text-[11px] text-gray-500 truncate">paulo@basicx.solutions</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Action Content: Tabelas de verificação limpas */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === "dashboard" ? (
          <>
            <header className="h-20 border-b border-gray-100 bg-white px-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#333]">
                  {selectedAction === "nps" && "Pacientes para NPS"}
                  {selectedAction === "noshow" && "Contatos No-show"}
                  {selectedAction === "confirmation" && "Confirmação de Presença"}
                  {selectedAction === "mesotherapy" && "Agendamentos Mesoterapia"}
                </h1>
                <p className="text-sm text-gray-500">
                  Verifique e realize as ações necessárias para os pacientes abaixo.
                </p>
              </div>
              <div className="flex gap-3">
                <CSVExportDialog
                  data={filteredPatients}
                  columns={getExportColumns(selectedAction)}
                  filename={`exportacao-${selectedAction}.csv`}
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filtrar nesta tela..."
                    className="pl-10 rounded-xl border-gray-200 text-gray-600 font-medium h-11 w-64 bg-transparent focus-visible:ring-[#F56E38]"
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                  />
                </div>
              </div>
            </header>

            <div className="flex-1 p-8 overflow-auto">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
                {isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#F56E38]" />
                    <p className="text-sm font-medium">Carregando dados do banco...</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <p className="text-sm">Nenhum registro encontrado no banco de dados.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {selectedAction === "mesotherapy" ? (
                          <>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Paciente
                            </th>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Fase
                            </th>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Sessões
                            </th>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Última Sessão
                            </th>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Sugerido
                            </th>
                          </>
                        ) : (
                          <>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Data
                            </th>
                            {selectedAction === "confirmation" && (
                              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                Horário
                              </th>
                            )}
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Nome
                            </th>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Telefone
                            </th>
                            <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                              Categoria
                            </th>
                          </>
                        )}
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                          Status
                        </th>
                        <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredPatients.map((patient) => (
                        <tr
                          key={patient._id}
                          className={cn(
                            "hover:bg-gray-50/50 transition-colors group",
                            patient.done && "bg-gray-50/30 text-gray-300",
                          )}
                        >
                          {selectedAction === "mesotherapy" ? (
                            <>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-gray-100 text-[10px] font-bold">
                                      {patient.name[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className={cn("font-bold text-sm")}>{patient.name}</p>
                                    <p className="text-[10px] text-gray-400">{patient.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">{patient.fase}</td>
                              <td className="px-6 py-4 text-sm">Total: {patient.totalSessao}</td>
                              <td className="px-6 py-4 text-sm">{patient.ultimaSessao}</td>
                              <td className={cn("px-6 py-4 text-sm font-medium", !patient.done && "text-[#F56E38]")}>
                                {patient.proximaData}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-sm font-medium">{patient.date}</td>
                              {selectedAction === "confirmation" && (
                                <td className="px-6 py-4 text-sm">{patient.time}</td>
                              )}
                              <td className={cn("px-6 py-4 text-sm font-bold", !patient.done && "text-[#333]")}>
                                {patient.name}
                              </td>
                              <td className="px-6 py-4 text-sm">{patient.phone}</td>
                              <td className="px-6 py-4 text-sm">{patient.category}</td>
                            </>
                          )}
                          <td className="px-6 py-4">
                            <Badge
                              className={cn(
                                "rounded-full px-3 py-1 font-medium text-[11px] shadow-none border-none",
                                patient.status === "noshow"
                                  ? "bg-red-100 text-red-600"
                                  : patient.displayStatus === "Atendido"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-[#F56E38]/10 text-[#F56E38]",
                              )}
                            >
                              <span className="flex items-center gap-1">{patient.displayStatus || "Pendente"}</span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!patient.done ? (
                                <Button
                                  onClick={() => handleToggleDone(patient._id, true)}
                                  className="bg-white border border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded-xl h-10 w-10 p-0 transition-all shadow-sm"
                                  title="Marcar como feito"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    onClick={() => handleToggleDone(patient._id, false)}
                                    className="bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-400 rounded-xl h-10 w-10 p-0 transition-all shadow-sm"
                                    title="Desfazer ação"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                className={cn(
                                  "bg-white border border-[#F56E38] text-[#F56E38] hover:bg-[#F56E38] hover:text-white rounded-xl h-10 px-4 text-xs font-bold transition-all shadow-sm",
                                  patient.done && "border-gray-200 text-gray-400",
                                )}
                              >
                                <MessageCircle className="w-4 h-4 mr-2" /> Abrir Contato
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
            <header className="h-20 border-b border-gray-100 bg-white px-8 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setView("dashboard")
                    setSearchTerm("")
                  }}
                  className="rounded-full hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar paciente..."
                    className="pl-10 bg-gray-50 border-gray-100 rounded-xl h-11 focus-visible:ring-[#F56E38]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <CSVExportDialog
                data={historyList}
                columns={[
                  { id: "date", label: "Data" },
                  { id: "time", label: "Horário" },
                  { id: "professional", label: "Profissional" },
                  { id: "procedure", label: "Procedimentos" },
                  { id: "obs", label: "Obs" },
                  { id: "markers", label: "Marcadores" },
                  { id: "status", label: "Status" },
                ]}
                filename="historico-paciente.csv"
              />
            </header>

            <div className="flex-1 p-8 overflow-auto">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Data</th>
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Horário
                      </th>
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Profissional
                      </th>
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Procedimentos
                      </th>
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">Obs</th>
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Marcadores
                      </th>
                      <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoadingHistory ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-[#F56E38]" />
                        <p className="text-sm font-medium">Carregando histórico...</p>
                      </div>
                    ) : historyList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <p className="text-sm">Nenhum registro encontrado no histórico.</p>
                      </div>
                    ) : (
                      historyList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.time}</td>
                          <td className="px-6 py-4 text-sm font-medium text-[#333]">{item.professional}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.procedure}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{item.obs}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{item.markers}</td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-3 py-0.5 font-medium text-[11px] border-none",
                                item.status.includes("Atendido")
                                  ? "bg-green-50 text-green-700"
                                  : "bg-blue-50 text-blue-700",
                              )}
                            >
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    item.status.includes("Atendido") ? "bg-green-500" : "bg-blue-400",
                                  )}
                                />
                                {item.status}
                              </span>
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
}: { icon: React.ReactNode; label: string; count: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
        active ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted/50",
      )}
    >
      <div className="flex items-center gap-3">
        <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
        <span>{label}</span>
      </div>
      <span className="text-xs text-muted-foreground font-normal">{count}</span>
    </button>
  )
}
