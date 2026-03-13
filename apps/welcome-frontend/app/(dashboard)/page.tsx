// app/(dashboard)/page.tsx
export default function DashboardPage() {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <div className="aspect-video rounded-xl bg-muted/50 p-4">
         <h3 className="font-bold">Stato Server</h3>
         {/* Qui puoi mettere il tuo ConfigServerSide */}
      </div>
      <div className="aspect-video rounded-xl bg-muted/50 p-4">
         <h3 className="font-bold">Stato Client</h3>
         {/* Qui puoi mettere il tuo ConfigClientSide */}
      </div>
      <div className="aspect-video rounded-xl bg-muted/50" />
    </div>
  )
}