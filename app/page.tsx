import { AddLeadDialog } from "@/components/add-lead-dialog";
import { CsvImport } from "@/components/csv-import";
import { LeadsTable } from "@/components/leads-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Leads</CardTitle>
          <CardDescription>
            Import leads, then fetch Google Solar API building insights for each address.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <CsvImport />
          <AddLeadDialog />
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No leads yet. Add one manually or import a CSV.
          </p>
        ) : (
          <LeadsTable leads={leads} />
        )}
      </CardContent>
    </Card>
  );
}
