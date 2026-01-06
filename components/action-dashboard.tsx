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
import {
  getHistoryPatientsList,
  getPatientHistory,
  getPatients,
  type HistoryItem,
  type HistoryPatient,
  type Patient,
} from "@/app/actions/patients"

type ActionType = "nps" | "noshow" | "confirmation" | "mesotherapy"
type HistoryRecord = HistoryItem

export function ActionDashboard() {
  const statusStyles = React.useCallback((status: string | undefined) => {
    const s = (status || "").toLowerCase()
    if (s.includes("atendido")) return { badge: "bg-green-50 text-green-700 border border-green-200", dot: "bg-green-500" }
    if (s.includes("confirmado")) return { badge: "bg-blue-50 text-blue-700 border border-blue-200", dot: "bg-blue-400" }
    if (s.includes("faltou") || s.includes("no-show")) return { badge: "bg-red-50 text-red-700 border border-red-200", dot: "bg-red-500" }
    if (s.includes("sem status")) return { badge: "bg-gray-100 text-gray-600 border border-gray-200", dot: "bg-gray-400" }
    return { badge: "bg-gray-100 text-gray-700 border border-gray-200", dot: "bg-gray-500" }
  }, [])

  const [selectedAction, setSelectedAction] = React.useState<ActionType>("nps")
  const [patientsList, setPatientsList] = React.useState<Patient[]>([])
  const [historyList, setHistoryList] = React.useState<HistoryRecord[]>([])
  const [historyPatients, setHistoryPatients] = React.useState<HistoryPatient[]>([])
  const [selectedHistoryPatient, setSelectedHistoryPatient] = React.useState<HistoryPatient | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)
  const [isLoadingHistoryPatients, setIsLoadingHistoryPatients] = React.useState(false)
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
    async function loadHistoryPatients() {
      if (view !== "history") return
      setIsLoadingHistoryPatients(true)
      try {
        const data = await getHistoryPatientsList(searchTerm)
        setHistoryPatients(data)
        if (data.length === 0) {
          setSelectedHistoryPatient(null)
          setHistoryList([])
        }
      } catch (error) {
        console.error("[v0] Erro ao carregar pacientes do histórico:", error)
      } finally {
        setIsLoadingHistoryPatients(false)
      }
    }
    const debounceTimer = setTimeout(loadHistoryPatients, 400)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, view])

  React.useEffect(() => {
    async function loadHistoryDetails() {
      if (view !== "history" || !selectedHistoryPatient) {
        setHistoryList([])
        return
      }
      setIsLoadingHistory(true)
      try {
        const data = await getPatientHistory(selectedHistoryPatient.name)
        setHistoryList(data as any)
      } catch (error) {
        console.error("[v0] Erro ao carregar histórico detalhado:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadHistoryDetails()
  }, [selectedHistoryPatient, view])

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
                onClick={() => {
                  setView("history")
                  setSelectedHistoryPatient(null)
                  setHistoryList([])
                }}
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
                    setSelectedHistoryPatient(null)
                    setHistoryList([])
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
                  { id: "category", label: "Categoria" },
                  { id: "status", label: "Status" },
                  { id: "type", label: "Tipo" },
                  { id: "phone", label: "Telefone" },
                ]}
                filename="historico-paciente.csv"
              />
            </header>

            <div className="flex-1 p-8 overflow-hidden min-h-0">
              <div className="grid grid-cols-[320px,1fr] gap-6 h-full min-h-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-0">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Pacientes</span>
                    {isLoadingHistoryPatients && <Loader2 className="w-4 h-4 animate-spin text-[#F56E38]" />}
                  </div>
                  <ScrollArea className="flex-1 min-h-0">
                    <div className="divide-y divide-gray-50">
                      {historyPatients.length === 0 && !isLoadingHistoryPatients ? (
                        <div className="p-4 text-sm text-gray-500">Nenhum paciente encontrado.</div>
                      ) : (
                        historyPatients.map((patient) => {
                          const isActive = selectedHistoryPatient?.name === patient.name
                          return (
                            <button
                              key={patient.name}
                              className={cn(
                                "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                                isActive && "bg-orange-50/70",
                              )}
                              onClick={() => setSelectedHistoryPatient(patient)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#333] truncate">{patient.name}</p>
                                  {patient.phone && (
                                    <p className="text-xs text-gray-500 truncate">{patient.phone}</p>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] border-none",
                                    statusStyles(patient.lastStatus).badge,
                                  )}
                                >
                                  {patient.lastStatus || "-"}
                                </Badge>
                              </div>
                              <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-3">
                                <span>{patient.lastDate || ""}</span>
                                <span className="truncate">{patient.lastCategory || ""}</span>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#333]">
                        {selectedHistoryPatient ? selectedHistoryPatient.name : "Selecione um paciente"}
                      </p>
                      {selectedHistoryPatient?.phone && (
                        <p className="text-xs text-gray-500">{selectedHistoryPatient.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {isLoadingHistory ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-[#F56E38]" />
                        <p className="text-sm font-medium">Carregando histórico...</p>
                      </div>
                    ) : !selectedHistoryPatient ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-10">
                        <p className="text-sm">Escolha um paciente para ver o histórico.</p>
                      </div>
                    ) : historyList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-10">
                        <p className="text-sm">Nenhum registro encontrado para este paciente.</p>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Data</th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Categoria</th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Tipo</th>
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Telefone</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {historyList.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-3 text-sm text-gray-600 font-medium whitespace-nowrap">{item.date}</td>
                              <td className="px-6 py-3 text-sm text-gray-600">{item.category}</td>
                              <td className="px-6 py-3">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-full px-3 py-0.5 font-medium text-[11px] border-none",
                                    statusStyles(item.status).badge,
                                  )}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span
                                      className={cn("w-1.5 h-1.5 rounded-full", statusStyles(item.status).dot)}
                                    />
                                    {item.status}
                                  </span>
                                </Badge>
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-600">
                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] border-none bg-gray-100">
                                  {item.type === "estimate" ? "Estimate" : "Appointment"}
                                </Badge>
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">{item.phone || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
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
