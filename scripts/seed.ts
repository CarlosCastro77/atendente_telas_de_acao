import clientPromise from "../lib/mongodb"

async function seed() {
  try {
    const client = await clientPromise
    const db = client.db()

    console.log("[v0] Iniciando seed do MongoDB...")

    // Limpar coleções existentes
    await db.collection("patients").deleteMany({})
    await db.collection("history").deleteMany({})

    const patients = [
      {
        name: "Ana Silva",
        date: "05/01/2026",
        time: "14:30",
        phone: "+5511999990001",
        category: "Estética Facial",
        status: "nps",
        displayStatus: "Pendente",
        done: false,
        fase: "",
        totalSessao: 0,
        ultimaSessao: "",
        proximaData: "",
      },
      {
        name: "Carlos Oliveira",
        date: "04/01/2026",
        time: "10:00",
        phone: "+5511999990002",
        category: "Depilação",
        status: "noshow",
        displayStatus: "Pendente",
        done: false,
        fase: "",
        totalSessao: 0,
        ultimaSessao: "",
        proximaData: "",
      },
      {
        name: "Juliana Costa",
        date: "06/01/2026",
        time: "09:15",
        phone: "+5511999990003",
        category: "Limpeza de Pele",
        status: "confirmation",
        displayStatus: "Pendente",
        done: false,
        fase: "",
        totalSessao: 0,
        ultimaSessao: "",
        proximaData: "",
      },
      {
        name: "Roberto Santos",
        date: "02/01/2026",
        time: "16:00",
        phone: "+5511999990004",
        category: "Mesoterapia Corporal",
        status: "mesotherapy",
        displayStatus: "Manutenção",
        done: false,
        fase: "Manutenção",
        totalSessao: 10,
        ultimaSessao: "28/12/2025",
        proximaData: "10/01/2026",
      },
    ]

    const history = [
      {
        patientName: "Ana Silva",
        date: "30/01/2026",
        time: "8:30 até 9:00",
        professional: "Renata Thais Monteiro do Nascimento",
        procedure: "Avaliação Facial",
        obs: "Mesoterapia de manutenção - fazer pagamento antes",
        markers: "Prioridade",
        status: "Agendado",
      },
      {
        patientName: "Ana Silva",
        date: "19/12/2025",
        time: "9:00 até 9:30",
        professional: "Lucas Inácio Araújo Cabral",
        procedure: "Limpeza de Pele",
        obs: "Retorno após encerramento das mesoterapias",
        markers: "",
        status: "Atendido",
      },
    ]

    await db.collection("patients").insertMany(patients)
    await db.collection("history").insertMany(history)

    console.log("[v0] Seed concluído com sucesso!")
    process.exit(0)
  } catch (e) {
    console.error("[v0] Erro no seed:", e)
    process.exit(1)
  }
}

seed()
