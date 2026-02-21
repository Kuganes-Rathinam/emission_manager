"use server"

import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Need to instantiate a server-side client using the same env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function verifyData() {
    // 1. Fetch latest 5 records from Supabase
    const { data, error } = await supabase
        .from("emissions")
        .select("id, device_id, co2_level, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

    if (error) {
        throw new Error("Failed to fetch data for verification.")
    }

    if (!data || data.length === 0) {
        throw new Error("No data available to verify.")
    }

    // 2. Prepare payload for hashing
    // In a real environment, you'd serialize the batch exactly the same way
    // to guarantee reproducible hashes.
    const payloadString = JSON.stringify(data)

    // 3. Generate SHA-256 hash using Node's crypto
    const hash = crypto.createHash("sha256").update(payloadString).digest("hex")

    // Simulate network delay for Polygon transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate a random transaction ID
    const txnId = "0x" + crypto.randomBytes(32).toString("hex")

    return {
        hash: `0x${hash}`,
        txnId,
        timestamp: new Date().toISOString(),
        recordCount: data.length,
    }
}
