"use client";



import { useCallback, useEffect, useState } from "react";

import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { WaButton, WaCard, WaCardHeader } from "./ui";

import { waCatch, waFetch, waSuccess } from "./WaShared";



type SyncJob = {

  id: string;

  type: string;

  status: string;

  totalFound: number;

  totalCreated: number;

  totalUpdated: number;

  totalSkipped: number;

  startedAt: string;

};



const SYNC_ACTIONS = [

  ["contacts", "Sincronizar contactos"],

  ["recent", "Sincronizar chats recientes"],

  ["full", "Sincronización completa"],

] as const;



export default function WhatsappBotSyncPanel() {

  const [jobs, setJobs] = useState<SyncJob[]>([]);

  const [loading, setLoading] = useState<string | null>(null);

  const [chatLimit, setChatLimit] = useState(30);

  const [messagesPerChat, setMessagesPerChat] = useState(40);

  const [includeGroups, setIncludeGroups] = useState(false);



  const loadJobs = useCallback(() => {

    waFetch<{ jobs: SyncJob[] }>("/api/seller/whatsapp-bot/sync/jobs")

      .then((d) => setJobs(d.jobs ?? []))

      .catch(() => {});

  }, []);



  useEffect(() => {

    loadJobs();

  }, [loadJobs]);



  async function runSync(action: string) {

    setLoading(action);

    try {

      const d = await waFetch<{

        totalCreated?: number;

        totalUpdated?: number;

        errors?: string[];

        noHistoryWarning?: boolean;

      }>("/api/seller/whatsapp-bot/sync", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          action,

          chatLimit,

          messagesPerChat,

          includeGroups,

          enrichProfile: true,

        }),

      });

      waSuccess(

        `Sync listo · nuevos: ${d.totalCreated ?? 0} · actualizados: ${d.totalUpdated ?? 0}`

      );

      if (d.noHistoryWarning || d.errors?.length) {

        toast.info(

          d.errors?.[0] ??

            "Historial limitado: Evolution puede no devolver chats anteriores al QR."

        );

      }

      loadJobs();

    } catch (e) {

      waCatch(e);

    } finally {

      setLoading(null);

    }

  }



  return (

    <WaCard className="space-y-4">

      <WaCardHeader

        title="Sincronización histórica"

        subtitle="Importá contactos y chats del número conectado"

        icon={<RefreshCw className="h-4 w-4 text-blue-300" />}

      />

      <p className="wa-honest-box text-sm">

        Importá contactos y conversaciones existentes del número conectado. La disponibilidad del

        historial depende de Evolution y del estado de la sesión.

      </p>

      <div className="grid sm:grid-cols-3 gap-3">

        <label className="block text-xs text-slate-400">

          Límite chats

          <input

            type="number"

            className="wa-field mt-1"

            value={chatLimit}

            min={5}

            max={100}

            onChange={(e) => setChatLimit(Number(e.target.value))}

          />

        </label>

        <label className="block text-xs text-slate-400">

          Mensajes por chat

          <input

            type="number"

            className="wa-field mt-1"

            value={messagesPerChat}

            min={10}

            max={200}

            onChange={(e) => setMessagesPerChat(Number(e.target.value))}

          />

        </label>

        <label className="flex items-end gap-2 text-sm text-slate-300 pb-2">

          <input

            type="checkbox"

            checked={includeGroups}

            onChange={(e) => setIncludeGroups(e.target.checked)}

          />

          Incluir grupos

        </label>

      </div>

      <div className="flex flex-wrap gap-2">

        {SYNC_ACTIONS.map(([action, label]) => (

          <WaButton

            key={action}

            className="text-sm"

            loading={loading === action}

            disabled={loading !== null && loading !== action}

            onClick={() => runSync(action)}

          >

            {label}

          </WaButton>

        ))}

        <WaButton variant="ghost" className="text-sm" onClick={loadJobs}>

          <RefreshCw className="h-4 w-4" /> Ver logs

        </WaButton>

      </div>

      {jobs.length > 0 ? (

        <div className="wa-soft p-3 max-h-48 overflow-y-auto text-xs space-y-2 wa-scroll">

          {jobs.map((j) => (

            <div key={j.id} className="border-b border-white/5 pb-2 last:border-0">

              <p className="text-white font-bold">

                {j.type} · {j.status}

              </p>

              <p className="text-slate-500">

                +{j.totalCreated} / ~{j.totalUpdated} · omitidos {j.totalSkipped} · encontrados{" "}

                {j.totalFound}

              </p>

            </div>

          ))}

        </div>

      ) : (

        <p className="text-xs text-slate-500">Todavía no hay jobs de sync. Corré una sincronización arriba.</p>

      )}

    </WaCard>

  );

}


