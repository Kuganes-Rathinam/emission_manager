# Project: IoT Emission Detector (Hackathon 24hr Sprint)

---

## 🎯 Objective

Build a full-stack IoT system that reads CO2 levels from an MH-Z19B sensor via an ESP32, stores the data in real-time on Supabase, displays it on a Next.js dashboard, and anchors data hashes to the Polygon blockchain for immutable verification.

---

## 🧠 System Architecture Overview

ESP32 → Supabase REST API → PostgreSQL storage → Realtime stream → Next.js dashboard

Daily Supabase Edge Function:
fetch emissions → hash dataset → anchor hash on Polygon blockchain.

---

## 🏗 Architecture Constraints

ESP32 sends data to Supabase instead of blockchain directly because:
- lower latency
- reduced gas costs
- simpler retry logic
- batching before anchoring to chain
- improved scalability for multiple devices

Blockchain is used ONLY for integrity verification, not real-time storage.

---

## 🛠 Tech Stack

- **Hardware:** ESP32 (C++ / Arduino framework) + MH-Z19B (UART communication)
- **Backend/DB:** Supabase (PostgreSQL, REST API, Edge Functions)
- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn/ui, Recharts
- **Web3:** Polygon Amoy Testnet, Thirdweb SDK

---

## 🤖 Agent Directives (How you must behave)

1. **Plan-Act-Reflect:** Before writing code for any Phase, output a brief plan and wait for the user's confirmation.
2. **UI Standards:** For the frontend, strictly use Shadcn/ui components and Tailwind utility classes. Default to a sleek, dark-mode 'glassmorphism' aesthetic.
3. **No Mocks:** Connect directly to Supabase using the JS client. Do not waste time creating fake data generators.
4. **Hardware Specifics:** For the C++ code, you must use `HardwareSerial` on pins 16(RX) and 17(TX). Do not use `SoftwareSerial` as it is unstable for this sensor.
5. **Hackathon Speed:** Prefer the fastest working implementation over theoretical perfection. Avoid unnecessary abstraction.
6. Version Control: Initialize a Git repository. You must create a commit with a descriptive message after successfully completing each Phase.

---

## 📋 Execution Phases

### Phase 1: Supabase Setup (Database & API)

- [ ] Generate SQL commands to create an `emissions` table with columns:
  - `id` uuid primary key default gen_random_uuid()
  - `created_at` timestamp with time zone default now()
  - `device_id` text NOT NULL
  - `co2_level` integer NOT NULL CHECK (co2_level > 0)
- [ ] Generate SQL to enable Supabase Realtime for this table.
  - Realtime requirement: Must use `postgres_changes` channel. Subscribe to INSERT events only.
- [ ] Generate SQL to set up Row Level Security (RLS) policies:
  - Security rules (Hackathon Optimized):
    - Anonymous inserts allowed (so the ESP32 can post data).
    - Anonymous reads (`SELECT`) allowed (crucial so the Next.js frontend can fetch history and listen to Realtime without Auth).
    - Update/delete restricted.

---

### Phase 2: ESP32 Hardware Firmware (C++)

- [ ] Write a C++ script for the ESP32 utilizing:
  - `WiFi.h`, `HTTPClient.h`, `ArduinoJson.h`, `MHZ19.h`
- [ ] Initialize `HardwareSerial mySerial(2)` on RX=16, TX=17.
- [ ] Read CO2 ppm value every 15 seconds.
- [ ] Send data as JSON payload via HTTP POST request to Supabase REST API endpoint.
  - Expected JSON structure: `{"device_id": "SSN_SENSOR_01", "co2_level": <value>}`

---

### Phase 3: Next.js Real-Time Dashboard (Frontend)

- [ ] Set up Next.js project structure using App Router.
- [ ] Configure `@supabase/supabase-js` client.
- [ ] Build dashboard UI:
  - Requirements: Use Shadcn/ui components only. Tailwind CSS styling. Dark-mode glassmorphism aesthetic.
- [ ] Display Recharts line chart showing historical data from `emissions` table.
- [ ] Implement Supabase Realtime subscription:
  - `postgres_changes`, event: `INSERT`, table: `emissions`
  - UI must update instantly when ESP32 pushes new data.
- [ ] Include placeholder UI card: "Blockchain Status"

---

### Phase 4: Blockchain Verification Layer (Web3)

- [ ] Write Supabase Edge Function (TypeScript).
  - Execution model: Triggered via Supabase scheduled cron job (daily).
  - Function logic:
    1. Fetch day’s CO2 data from database.
    2. Create dataset hash using SHA-256.
    3. Use Thirdweb SDK.
    4. Write hash to Polygon Amoy testnet smart contract.
- [ ] Update Next.js frontend:
  - Add "Verify Data" button inside Blockchain Status card.
  - Button must display the latest transaction hash and link externally to the Polygonscan transaction.

---

## 🎯 Engineering Design Principles

- ESP32 acts as edge data ingestion client.
- Supabase provides real-time streaming and persistence.
- Blockchain acts as immutable verification layer.
- System optimized for hackathon speed while maintaining real-world architecture patterns.