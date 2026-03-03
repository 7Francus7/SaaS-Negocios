"use client";

import { useState, useEffect, useRef } from "react";
import { Terminal, Copy, ShieldAlert, CheckCircle, Database, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const fakeLogs = [
       { type: 'info', service: 'AUTH', msg: 'Admin god_mode session initiated from 192.168.1.45', time: new Date().toISOString() },
       { type: 'success', service: 'DB', msg: 'Prisma Client connected successfully. Latency: 4ms', time: new Date().toISOString() },
       { type: 'warn', service: 'API', msg: 'Rate limit approaching for Tenant ID: tx_90412. 800/1000 requests.', time: new Date().toISOString() },
       { type: 'info', service: 'WEBHOOK', msg: 'Stripe webhook received: invoice.payment_succeeded', time: new Date().toISOString() },
       { type: 'error', service: 'MAIL', msg: 'Failed to send receipt to client_8829. SES Timeout.', time: new Date().toISOString() },
       { type: 'success', service: 'EDGE', msg: 'Edge node bg-sfo-1 routed 12k requests', time: new Date().toISOString() },
];

export default function LogsPage() {
       const [logs, setLogs] = useState(fakeLogs);
       const [isPaused, setIsPaused] = useState(false);
       const bottomRef = useRef<HTMLDivElement>(null);

       useEffect(() => {
              if (isPaused) return;

              const interval = setInterval(() => {
                     const newLog = generateRandomLog();
                     setLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50
              }, 1500);

              return () => clearInterval(interval);
       }, [isPaused]);

       useEffect(() => {
              // Auto scroll
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
       }, [logs]);

       const generateRandomLog = () => {
              const types = ['info', 'success', 'warn', 'error'];
              const services = ['DB', 'API', 'AUTH', 'EDGE', 'CACHE', 'WORKER'];
              const messages = [
                     'Cache miss for key: product_list_t_412',
                     'Prisma query execution time: 142ms',
                     'JWT Token exp check passed for user_982',
                     'New socket connection established',
                     'Backup cron job started for region us-east-1',
                     'Redis memory usage at 64% threshold',
                     'Worker node processed 150 jobs in queue',
                     'Memory leak detected in edge_node_4. Restarting...',
                     'Payment payload validated successfully.',
              ];

              return {
                     type: types[Math.floor(Math.random() * types.length)],
                     service: services[Math.floor(Math.random() * services.length)],
                     msg: messages[Math.floor(Math.random() * messages.length)],
                     time: new Date().toISOString(),
              };
       };

       return (
              <div className="min-h-screen bg-gray-50 text-slate-900 font-sans p-8 max-w-[1600px] mx-auto selection:bg-yellow-100">
                     <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200">
                                   <Terminal className="text-blue-400 w-8 h-8" />
                            </div>
                            <div>
                                   <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">Logs Maestros</h1>
                                   <p className="text-slate-500 font-medium">Stream de eventos y telemetría del núcleo del sistema en tiempo real.</p>
                            </div>
                     </div>

                     <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 flex flex-col h-[70vh]">
                            {/* Toolbar */}
                            <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 backdrop-blur-xl">
                                   <div className="flex items-center gap-4">
                                          <div className="flex gap-2">
                                                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                 <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                          </div>
                                          <div className="w-[1px] h-6 bg-slate-800"></div>
                                          <span className="text-[10px] font-mono text-slate-400">root@saas-core-production:~</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                          <button
                                                 onClick={() => setIsPaused(!isPaused)}
                                                 className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
                                                        isPaused ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                 )}
                                          >
                                                 {isPaused ? '▶ Reanudar Stream' : '⏸ Pausar Stream'}
                                          </button>
                                          <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-colors" title="Copiar Logs">
                                                 <Copy className="w-4 h-4" />
                                          </button>
                                   </div>
                            </div>

                            {/* Log Area */}
                            <div className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                                   {logs.map((log, i) => (
                                          <LogLine key={i} log={log} />
                                   ))}
                                   <div ref={bottomRef} className="h-4" />
                                   {!isPaused && (
                                          <div className="flex items-center gap-2 mt-4 opacity-50">
                                                 <span className="w-2 h-4 bg-white animate-pulse"></span>
                                                 <span className="text-xs text-slate-500">Escuchando eventos...</span>
                                          </div>
                                   )}
                            </div>
                     </div>
              </div>
       );
}

function LogLine({ log }: { log: any }) {
       const colors: Record<string, string> = {
              info: "text-blue-400",
              success: "text-emerald-400",
              warn: "text-yellow-400",
              error: "text-red-400"
       };

       const icons: Record<string, React.ReactNode> = {
              info: <Terminal className="w-4 h-4" />,
              success: <CheckCircle className="w-4 h-4" />,
              warn: <AlertTriangle className="w-4 h-4" />,
              error: <ShieldAlert className="w-4 h-4" />
       };

       const date = new Date(log.time);
       const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;

       return (
              <div className="flex items-start gap-4 py-1 hover:bg-slate-900/50 rounded transition-colors group">
                     <span className="text-slate-600 shrink-0 text-xs">[{timeStr}]</span>
                     <span className={cn("shrink-0 flex items-center justify-center pt-0.5", colors[log.type])}>
                            {icons[log.type]}
                     </span>
                     <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest bg-slate-800/50 shrink-0", colors[log.type])}>
                            {log.service}
                     </span>
                     <span className={cn("text-slate-300 group-hover:text-white transition-colors break-words",
                            log.type === 'error' && "text-red-300 font-bold",
                            log.type === 'warn' && "text-yellow-200"
                     )}>
                            {log.msg}
                     </span>
              </div>
       );
}
