import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  console.warn("[v0] Aviso: MONGODB_URI não encontrada nas variáveis de ambiente. O aplicativo usará dados de mock.")
}

const uri = process.env.MONGODB_URI || ""
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (!process.env.MONGODB_URI) {
  // Retorna uma promessa vazia ou nula para evitar erros de importação,
  // já que o código consumidor (patients.ts) verifica a variável de ambiente antes de usar.
  clientPromise = Promise.resolve(null as unknown as MongoClient)
} else if (process.env.NODE_ENV === "development") {
  // across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
