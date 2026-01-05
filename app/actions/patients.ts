"use server"

/// <reference types="node" />

import clientPromise from "@/lib/mongodb"
import { z } from "zod"

const PatientSchema = z.object({
  _id: z.any().transform((val: any) => val.toString()),
  name: z.string(),
  date: z.string().optional().default(""),
  time: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  category: z.string().optional().default(""),
  status: z.enum(["nps", "noshow", "confirmation", "mesotherapy"]),
  displayStatus: z.string().optional().default("Pendente"),
  done: z.boolean().optional().default(false),
  fase: z.string().optional().default(""),
  totalSessao: z.number().optional().default(0),
  ultimaSessao: z.string().optional().default(""),
  proximaData: z.string().optional().default(""),
})

export type Patient = z.infer<typeof PatientSchema>

export async function getPatients() {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn("[v0] MONGODB_URI não encontrada. Usando dados de mock.")
      return getMockPatients()
    }

    const client = await clientPromise
    const db = client.db()
    const appointmentCollection = db.collection("appointment")

    const confirmationPipeline = [
      {
        $addFields: {
          statusDescricao: {
            $switch: {
              branches: [
                { case: { $eq: ["$statusId", 5842086935003136] }, then: "Confirmado" },
                { case: { $eq: ["$statusId", 5988773355716608] }, then: "Atendido" },
                { case: { $eq: ["$statusId", 4862873448873980] }, then: "Faltou" },
                { case: { $eq: ["$statusId", 4862873448873984] }, then: "Faltou" },
                { case: { $eq: ["$statusId", 0] }, then: "Sem Status" },
              ],
              default: "Outro",
            },
          },
        },
      },
      {
        $match: {
          statusDescricao: "Atendido",
        },
      },
      {
        $sort: {
          date: -1,
        } as any,
      },
      {
        $limit: 1,
      },
      {
        $group: {
          _id: null,
          ultimoDia: { $first: "$date" },
        },
      },
      {
        $lookup: {
          from: "appointment",
          let: { ultimaData: "$ultimoDia" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$date", "$$ultimaData"],
                },
              },
            },
            {
              $addFields: {
                statusDescricao: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$statusId", 5842086935003136] }, then: "Confirmado" },
                      { case: { $eq: ["$statusId", 5988773355716608] }, then: "Atendido" },
                      { case: { $eq: ["$statusId", 4862873448873980] }, then: "Faltou" },
                      { case: { $eq: ["$statusId", 4862873448873984] }, then: "Faltou" },
                      { case: { $eq: ["$statusId", 0] }, then: "Sem Status" },
                    ],
                    default: "Outro",
                  },
                },
                ordemStatus: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$statusId", 5842086935003136] }, then: 1 },
                      { case: { $eq: ["$statusId", 0] }, then: 2 },
                      { case: { $eq: ["$statusId", 4862873448873980] }, then: 3 },
                      { case: { $eq: ["$statusId", 4862873448873984] }, then: 3 },
                    ],
                    default: 4,
                  },
                },
                dataFormatada: {
                  $dateToString: {
                    format: "%d/%m/%Y",
                    date: "$date",
                  },
                },
              },
            },
            {
              $match: {
                statusDescricao: { $ne: "Atendido" },
              },
            },
            {
              $sort: {
                ordemStatus: 1,
                atomicDate: -1,
              } as any,
            },
            {
              $project: {
                _id: 0,
                Data: "$dataFormatada",
                Categoria: "$categoryDescription",
                Telefone: "$mobilePhone",
                "Nome do paciente": "$patientName",
                Status: "$statusDescricao",
                StatusId: "$statusId",
                StatusColor: "$statusColor",
              },
            },
          ],
          as: "agendamentos",
        },
      },
      {
        $unwind: "$agendamentos",
      },
      {
        $replaceRoot: {
          newRoot: "$agendamentos",
        },
      },
    ]

    const nextDaysPipeline = [
      {
        $addFields: {
          dataAtualNumero: {
            $toLong: {
              $dateToString: {
                format: "%Y%m%d",
                date: "$$NOW",
              },
            },
          },
          apenasData: {
            $toLong: "$atomicDate",
          },
        },
      },
      {
        $match: {
          $expr: {
            $gte: ["$apenasData", "$dataAtualNumero"],
          },
        },
      },
      {
        $group: {
          _id: "$apenasData",
        },
      },
      {
        $sort: {
          _id: 1,
        } as any,
      },
      {
        $limit: 2,
      },
      {
        $group: {
          _id: null,
          proximosDias: { $push: "$_id" },
        },
      },
      {
        $lookup: {
          from: "appointment",
          let: { diasSelecionados: "$proximosDias" },
          pipeline: [
            {
              $addFields: {
                apenasData: {
                  $toLong: "$atomicDate",
                },
              },
            },
            {
              $match: {
                $expr: {
                  $in: ["$apenasData", "$$diasSelecionados"],
                },
              },
            },
            {
              $addFields: {
                statusDescricao: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$statusId", 5842086935003136] }, then: "Confirmado" },
                      { case: { $eq: ["$statusId", 5988773355716608] }, then: "Atendido" },
                      { case: { $eq: ["$statusId", 4862873448873980] }, then: "Faltou" },
                      { case: { $eq: ["$statusId", 0] }, then: "Sem Status" },
                    ],
                    default: "Outro",
                  },
                },
                ordemStatus: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$statusId", 5988773355716608] }, then: 1 },
                      { case: { $eq: ["$statusId", 0] }, then: 2 },
                    ],
                    default: 3,
                  },
                },
                dataFormatada: {
                  $dateToString: {
                    format: "%d/%m/%Y",
                    date: "$date",
                  },
                },
                horario: {
                  $concat: [{ $ifNull: ["$fromTime", ""] }, " - ", { $ifNull: ["$toTime", ""] }],
                },
              },
            },
            {
              $match: {
                statusDescricao: { $ne: "Confirmado" },
              },
            },
            {
              $sort: {
                date: 1,
                fromTime: 1,
                ordemStatus: 1,
              } as any,
            },
            {
              $project: {
                _id: 0,
                Data: "$dataFormatada",
                Horário: "$horario",
                Categoria: "$categoryDescription",
                Telefone: "$mobilePhone",
                "Nome do paciente": "$patientName",
                Status: "$statusDescricao",
              },
            },
          ],
          as: "agendamentos",
        },
      },
      {
        $unwind: "$agendamentos",
      },
      {
        $replaceRoot: {
          newRoot: "$agendamentos",
        },
      },
    ]

    const mesotherapyPipeline = [
      {
        $addFields: {
          statusDescricao: {
            $switch: {
              branches: [
                { case: { $eq: ["$statusId", 5842086935003136] }, then: "Atendido" },
                { case: { $eq: ["$statusId", 5988773355716608] }, then: "Atendido" },
                { case: { $eq: ["$statusId", 4862873448873980] }, then: "Faltou" },
                { case: { $eq: ["$statusId", 4862873448873984] }, then: "Faltou" },
                { case: { $eq: ["$statusId", 0] }, then: "Agendado" },
              ],
              default: "Outro",
            },
          },
          ehFuturo: { $gt: ["$date", "$$NOW"] },
        },
      },
      {
        $group: {
          _id: "$patientPersonId",
          patientName: { $first: "$patientName" },
          mobilePhone: { $first: "$mobilePhone" },
          totalSessoesMeso: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$statusDescricao", "Atendido"] },
                    { $regexMatch: { input: "$categoryDescription", regex: "Mesoterapia", options: "i" } },
                  ],
                },
                1,
                0,
              ],
            },
          },
          ultimaSessaoMeso: {
            $max: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$statusDescricao", "Atendido"] },
                    { $regexMatch: { input: "$categoryDescription", regex: "Mesoterapia", options: "i" } },
                  ],
                },
                "$date",
                null,
              ],
            },
          },
          temAgendamentoFuturo: { $max: "$ehFuturo" },
        },
      },
      {
        $match: {
          temAgendamentoFuturo: false,
          totalSessoesMeso: { $gt: 0 },
        },
      },
      {
        $addFields: {
          fase: {
            $switch: {
              branches: [
                { case: { $lt: ["$totalSessoesMeso", 4] }, then: "Inicial" },
                { case: { $lt: ["$totalSessoesMeso", 8] }, then: "Intermediária" },
              ],
              default: "Manutenção",
            },
          },
          diasParaProxima: {
            $switch: {
              branches: [
                { case: { $lt: ["$totalSessoesMeso", 4] }, then: 14 },
                { case: { $lt: ["$totalSessoesMeso", 8] }, then: 30 },
              ],
              default: 75,
            },
          },
        },
      },
      {
        $addFields: {
          proximaData: {
            $dateAdd: {
              startDate: "$ultimaSessaoMeso",
              unit: "day",
              amount: "$diasParaProxima",
            },
          },
        },
      },
      {
        $addFields: {
          ultimaSessaoFormatada: {
            $dateToString: {
              format: "%d/%m/%Y",
              date: "$ultimaSessaoMeso",
            },
          },
          proximaDataFormatada: {
            $dateToString: {
              format: "%d/%m/%Y",
              date: "$proximaData",
            },
          },
        },
      },
      {
        $sort: {
          ultimaSessaoMeso: 1,
          patientName: 1,
        } as any,
      },
      {
        $project: {
          _id: 0,
          "ID do Paciente": "$_id",
          "Nome do Paciente": "$patientName",
          Telefone: "$mobilePhone",
          Fase: "$fase",
          "Total de Sessões": "$totalSessoesMeso",
          "Última Sessão": "$ultimaSessaoFormatada",
          "Próxima Data Sugerida": "$proximaDataFormatada",
        },
      },
    ]

    const npsPipeline = [
      {
        $addFields: {
          statusDescricao: {
            $switch: {
              branches: [
                { case: { $eq: ["$statusId", 5842086935003136] }, then: "Confirmado" },
                { case: { $eq: ["$statusId", 5988773355716608] }, then: "Atendido" },
                { case: { $eq: ["$statusId", 4862873448873980] }, then: "Faltou" },
                { case: { $eq: ["$statusId", 0] }, then: "Sem Status" },
              ],
              default: "Outro",
            },
          },
        },
      },
      { $match: { statusDescricao: "Atendido" } },
      { $group: { _id: "$date" } },
      { $sort: { _id: -1 } as any },
      { $limit: 2 },
      { $group: { _id: null, ultimosDias: { $push: "$_id" } } },
      {
        $lookup: {
          from: "appointment",
          let: { diasSelecionados: "$ultimosDias" },
          pipeline: [
            { $match: { $expr: { $in: ["$date", "$$diasSelecionados"] } } },
            {
              $addFields: {
                statusDescricao: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$statusId", 5842086935003136] }, then: "Confirmado" },
                      { case: { $eq: ["$statusId", 5988773355716608] }, then: "Atendido" },
                      { case: { $eq: ["$statusId", 4862873448873980] }, then: "Faltou" },
                      { case: { $eq: ["$statusId", 0] }, then: "Sem Status" },
                    ],
                    default: "Outro",
                  },
                },
                ordemStatus: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$statusId", 5988773355716608] }, then: 1 },
                      { case: { $eq: ["$statusId", 5842086935003136] }, then: 1 },
                      { case: { $eq: ["$statusId", 0] }, then: 2 },
                    ],
                    default: 3,
                  },
                },
                dataFormatada: { $dateToString: { format: "%d/%m/%Y", date: "$date" } },
              },
            },
            { $sort: { date: -1, ordemStatus: 1, atomicDate: -1 } as any },
            {
              $project: {
                _id: 0,
                Data: "$dataFormatada",
                Categoria: "$categoryDescription",
                Telefone: "$mobilePhone",
                "Nome do paciente": "$patientName",
                Status: "$statusDescricao",
                StatusId: "$statusId",
              },
            },
          ],
          as: "agendamentos",
        },
      },
      { $unwind: "$agendamentos" },
      { $replaceRoot: { newRoot: "$agendamentos" } },
    ]

    const [noshowData, confirmationData, mesoData, npsData] = await Promise.all([
      appointmentCollection.aggregate(confirmationPipeline).toArray(),
      appointmentCollection.aggregate(nextDaysPipeline).toArray(),
      appointmentCollection.aggregate(mesotherapyPipeline).toArray(),
      appointmentCollection.aggregate(npsPipeline).toArray(),
    ])

    const allPatients: Patient[] = [
      ...npsData.map((p: any) => ({
        _id: Math.random().toString(),
        name: p["Nome do paciente"],
        date: p.Data,
        phone: p.Telefone,
        category: p.Categoria,
        status: "nps" as const,
        displayStatus: p.Status,
        done: false,
        time: "",
        fase: "",
        totalSessao: 0,
        ultimaSessao: "",
        proximaData: "",
      })),
      ...confirmationData.map((p: any) => ({
        _id: Math.random().toString(),
        name: p["Nome do paciente"],
        date: p.Data,
        time: p.Horário,
        phone: p.Telefone,
        category: p.Categoria,
        status: "confirmation" as const,
        displayStatus: p.Status,
        done: false,
        fase: "",
        totalSessao: 0,
        ultimaSessao: "",
        proximaData: "",
      })),
      ...noshowData.map((p: any) => ({
        _id: Math.random().toString(),
        name: p["Nome do paciente"],
        date: p.Data,
        phone: p.Telefone,
        category: p.Categoria,
        status: "noshow" as const,
        displayStatus: p.Status,
        done: false,
        time: "",
        fase: "",
        totalSessao: 0,
        ultimaSessao: "",
        proximaData: "",
      })),
      ...mesoData.map((p: any) => ({
        _id: Math.random().toString(),
        name: p["Nome do Paciente"],
        phone: p.Telefone,
        fase: p.Fase,
        totalSessao: p["Total de Sessões"],
        ultimaSessao: p["Última Sessão"],
        proximaData: p["Próxima Data Sugerida"],
        status: "mesotherapy" as const,
        displayStatus: "Sugerido",
        done: false,
        date: "",
        time: "",
        category: "Mesoterapia",
      })),
    ]

    return allPatients
  } catch (e) {
    console.error("[v0] Erro ao buscar pacientes no MongoDB, usando fallback:", e)
    return getMockPatients()
  }
}

export async function getPatientHistory(patientName: string) {
  try {
    if (!process.env.MONGODB_URI) return getMockHistory()

    const client = await clientPromise
    const db = client.db()

    const history = await db.collection("history").find({ patientName: patientName }).sort({ date: -1 }).toArray()

    return history.map((h: any) => ({
      ...h,
      _id: h._id.toString(),
    }))
  } catch (e) {
    console.error("[v0] Erro ao buscar histórico no MongoDB:", e)
    return getMockHistory()
  }
}

function getMockPatients(): Patient[] {
  return [
    {
      _id: "1",
      name: "José Manoel Assunção Filho",
      date: "05/01/2026",
      phone: "+5586981819999",
      category: "Avaliação Capilar",
      status: "nps",
      displayStatus: "Atendido",
      done: false,
      time: "",
      fase: "",
      totalSessao: 0,
      ultimaSessao: "",
      proximaData: "",
    },
    {
      _id: "2",
      name: "João Elias Oka Júnior",
      date: "05/01/2026",
      phone: "+5586994551234",
      category: "Mesoterapia",
      status: "nps",
      displayStatus: "Atendido",
      done: false,
      time: "",
      fase: "",
      totalSessao: 0,
      ultimaSessao: "",
      proximaData: "",
    },
    {
      _id: "3",
      name: "Edmilson Rodrigues Sepúlveda",
      date: "04/01/2026",
      phone: "+5586999887766",
      category: "Retorno",
      status: "noshow",
      displayStatus: "Faltou",
      done: false,
      time: "",
      fase: "",
      totalSessao: 0,
      ultimaSessao: "",
      proximaData: "",
    },
    {
      _id: "4",
      name: "Rainoldo De Oliveira Junior",
      fase: "Manutenção",
      totalSessao: 8,
      ultimaSessao: "15/12/2025",
      proximaData: "10/01/2026",
      phone: "+5586988223344",
      status: "mesotherapy",
      displayStatus: "Em Tratamento",
      done: false,
      date: "",
      time: "",
      category: "Mesoterapia",
    },
  ]
}

function getMockHistory() {
  return [
    {
      id: "h1",
      date: "30/01/2026",
      time: "8:30 até 9:00",
      professional: "Renata Thais Monteiro do Nascimento",
      procedure: "Mesoterapia de manutenção",
      obs: "Fazer pagamento antes",
      markers: "",
      status: "Agendado",
    },
    {
      id: "h2",
      date: "19/12/2025",
      time: "9:00 até 9:30",
      professional: "Lucas Inácio Araújo Cabral",
      procedure: "Retorno",
      obs: "Retorno após encerramento das mesoterapias",
      markers: "",
      status: "4-Atendido",
    },
  ]
}
