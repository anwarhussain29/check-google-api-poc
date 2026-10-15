"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { importLeadsCsv } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Row = { name?: string; phone?: string; address?: string };

export function CsvImport() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFile = (file: File | undefined) => {
    if (!file) return reset();
    setFileName(file.name);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (result) => setRows(result.data),
      error: (err) => toast.error(`Could not parse CSV: ${err.message}`),
    });
  };

  const onImport = () =>
    startTransition(async () => {
      const { inserted, skipped } = await importLeadsCsv(rows);
      toast.success(
        `Imported ${inserted} lead${inserted === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} invalid row(s)` : ""}`,
      );
      reset();
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <UploadIcon />
        Import CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import leads from CSV</DialogTitle>
          <DialogDescription>
            The file must have the headers <code>name,phone,address</code>.{" "}
            <a href="/sample-leads.csv" download>
              Download sample
            </a>
          </DialogDescription>
        </DialogHeader>
        <Input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {fileName && (
          <p className="text-muted-foreground">
            {fileName}: {rows.length} row{rows.length === 1 ? "" : "s"} found
          </p>
        )}
        <DialogFooter>
          <Button onClick={onImport} disabled={pending || rows.length === 0}>
            {pending ? "Importing..." : `Import ${rows.length || ""} leads`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
