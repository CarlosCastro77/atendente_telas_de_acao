import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("basicx_atendimento")

    const actions = await db.collection("atendimentos").find({}).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(actions)
  } catch (e) {
    console.error("[v0] Error connecting to MongoDB:", e)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("basicx_atendimento")
    const body = await request.json()

    const result = await db.collection("atendimentos").insertOne({
      ...body,
      createdAt: new Date(),
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error("[v0] Error saving to MongoDB:", e)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}
