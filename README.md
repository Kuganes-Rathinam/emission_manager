# IoT Emission Detector

## 🎯 Objective
A full-stack IoT system that reads CO2 levels from an MH-Z19B sensor via an ESP32, stores the data in real-time on Supabase, displays it on a Next.js dashboard, and anchors data hashes to the Polygon blockchain for immutable verification.

## 🧠 System Architecture Overview
ESP32 → Supabase REST API → PostgreSQL storage → Realtime stream → Next.js dashboard

Daily Supabase Edge Function fetches emissions, hashes the dataset, and anchors the hash on the Polygon blockchain.

## 🛠 Tech Stack
- **Hardware:** ESP32 (C++ / Arduino framework) + MH-Z19B (UART communication)
- **Backend/DB:** Supabase (PostgreSQL, REST API, Edge Functions)
- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn/ui, Recharts
- **Web3:** Polygon Amoy Testnet, Thirdweb SDK
