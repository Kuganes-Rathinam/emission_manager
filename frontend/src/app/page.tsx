"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity, Database, Link as LinkIcon } from "lucide-react"

type EmissionData = {
  id: string
  created_at: string
  device_id: string
  co2_level: number
}

export default function DashboardPage() {
  const [data, setData] = useState<EmissionData[]>([])
  const [latestCo2, setLatestCo2] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 1. Fetch historical data on mount
    const fetchHistory = async () => {
      setIsLoading(true)
      const { data: history, error } = await supabase
        .from("emissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error fetching history:", error)
      } else if (history) {
        // Reverse so chronological order for chart
        const chronoData = history.reverse()
        setData(chronoData)
        if (chronoData.length > 0) {
          setLatestCo2(chronoData[chronoData.length - 1].co2_level)
        }
      }
      setIsLoading(false)
    }

    fetchHistory()

    // 2. Subscribe to Realtime inserts
    const channel = supabase
      .channel("postgres_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emissions",
        },
        (payload) => {
          const newRecord = payload.new as EmissionData
          setData((currentData) => {
            // Keep the last 50 records to prevent array from growing indefinitely
            const newData = [...currentData, newRecord]
            if (newData.length > 50) {
              return newData.slice(newData.length - 50)
            }
            return newData
          })
          setLatestCo2(newRecord.co2_level)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Format date for chart X-axis
  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 p-6 md:p-12 font-sans selection:bg-emerald-500/30">

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="h-8 w-8 text-emerald-400" />
            Emission Dashboard
          </h1>
          <p className="text-neutral-400 mt-2 text-lg">Real-time IoT CO₂ Monitoring System</p>
        </div>

        <div className="flex items-center gap-3 bg-neutral-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-neutral-800">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-neutral-300">Live Connection</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main Chart Card spanning 2 columns */}
        <Card className="md:col-span-2 bg-neutral-900/40 border-neutral-800/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-teal-500/0" />
          <CardHeader>
            <CardTitle className="text-neutral-200 flex items-center gap-2">
              <Database className="h-5 w-5 text-neutral-400" />
              Real-Time CO₂ Trends
            </CardTitle>
            <CardDescription className="text-neutral-500">Live feed from MH-Z19B sensor (ppm)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : data.length === 0 ? (
              <div className="h-[350px] flex flex-col items-center justify-center text-neutral-500">
                <Database className="h-12 w-12 mb-4 opacity-20" />
                <p>No emissions data recorded yet.</p>
                <p className="text-sm mt-1">Waiting for ESP32 connection...</p>
              </div>
            ) : (
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="created_at"
                      tickFormatter={formatTime}
                      stroke="#525252"
                      tick={{ fill: '#737373', fontSize: 12 }}
                      tickMargin={10}
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="#525252"
                      tick={{ fill: '#737373', fontSize: 12 }}
                      tickMargin={10}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', color: '#f5f5f5' }}
                      itemStyle={{ color: '#10b981' }}
                      labelFormatter={formatTime}
                      formatter={(value: number) => [`${value} ppm`, 'CO₂ Level']}
                    />
                    <Line
                      type="monotone"
                      dataKey="co2_level"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#171717', strokeWidth: 2 }}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Panel for Status and Latest Readings */}
        <div className="space-y-6">

          {/* Latest Value Card */}
          <Card className="bg-neutral-900/40 border-neutral-800/60 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Current CO₂</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white tracking-tighter">
                  {latestCo2 !== null ? latestCo2 : "--"}
                </span>
                <span className="text-neutral-500 font-medium">ppm</span>
              </div>
              {latestCo2 !== null && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                  {latestCo2 < 1000 ? (
                    <span className="text-emerald-400/90 flex items-center gap-1.5 bg-emerald-400/10 px-2.5 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Excellent Air Quality
                    </span>
                  ) : latestCo2 < 2000 ? (
                    <span className="text-yellow-400/90 flex items-center gap-1.5 bg-yellow-400/10 px-2.5 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      Moderate Air Quality
                    </span>
                  ) : (
                    <span className="text-red-400/90 flex items-center gap-1.5 bg-red-400/10 px-2.5 py-1 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      Poor Air Quality
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blockchain Verify Card Placeholder */}
          <Card className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border-indigo-900/30 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500" />
            <CardHeader>
              <CardTitle className="text-indigo-200 flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Blockchain Status
              </CardTitle>
              <CardDescription className="text-indigo-300/60">Phase 4 Verification Layer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-4 text-center">
                <p className="text-sm text-indigo-300/80 mb-3">
                  Awaiting Phase 4 completion to enable Web3 data anchoring.
                </p>
                <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-indigo-600/50 text-indigo-100 hover:bg-indigo-600 h-10 px-4 py-2 w-full max-w-[200px] cursor-not-allowed opacity-50">
                  Verify Data
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
