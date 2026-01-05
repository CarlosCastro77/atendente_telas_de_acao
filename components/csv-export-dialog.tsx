"use client"

import * as React from "react"
import { Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface Column {
  id: string
  label: string
}

interface CSVExportDialogProps {
  data: any[]
  columns: Column[]
  filename?: string
}

export function CSVExportDialog({ data, columns, filename = "extração.csv" }: CSVExportDialogProps) {
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>(columns.map((c) => c.id))

  const toggleColumn = (id: string) => {
    setSelectedColumns((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const exportToCSV = () => {
    if (selectedColumns.length === 0) return

    // Header: Agrupado em uma única coluna
    const header = selectedColumns.map((id) => columns.find((c) => c.id === id)?.label).join(", ")

    // Rows: Cada linha terá os dados selecionados agrupados por vírgula em uma única coluna CSV
    const csvRows = data.map((row) => {
      const values = selectedColumns.map((id) => {
        const val = row[id] || ""
        // Escapar vírgulas se o valor for uma string para não quebrar a estrutura CSV se necessário,
        // mas o pedido é "agrupados em uma mesma coluna, separado por vírgula"
        return `"${val}"`
      })
      return values.join(", ")
    })

    const csvContent = [header, ...csvRows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-gray-200 text-gray-600 font-medium h-11 px-6 bg-transparent"
        >
          <Download className="w-4 h-4 mr-2" /> Extrair em CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border-gray-100 rounded-3xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#333]">Configurar Exportação</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Selecione as colunas que deseja incluir no arquivo CSV.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {columns.map((column) => (
            <div
              key={column.id}
              className="flex items-center space-x-2 bg-gray-50 p-3 rounded-xl border border-transparent hover:border-gray-100 transition-all"
            >
              <Checkbox
                id={column.id}
                checked={selectedColumns.includes(column.id)}
                onCheckedChange={() => toggleColumn(column.id)}
                className="border-gray-300 data-[state=checked]:bg-[#F56E38] data-[state=checked]:border-[#F56E38]"
              />
              <label
                htmlFor={column.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter className="sm:justify-end gap-2">
          <Button variant="ghost" className="rounded-xl font-bold text-gray-500" onClick={() => setSelectedColumns([])}>
            Limpar tudo
          </Button>
          <Button
            className="bg-[#F56E38] hover:bg-[#D95B2B] text-white font-bold rounded-xl px-8"
            onClick={exportToCSV}
          >
            Baixar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
