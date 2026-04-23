"use client";

import { useMemo, useState } from "react";
import {
  FileText,
  FilePlus2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Link2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AssetKind =
  | "Policy"
  | "Contract"
  | "Claim report"
  | "Invoice"
  | "Correspondence"
  | "Other";

type LinkKind = "customer" | "product" | "contact" | "lead";

type MatchSource = "direct-upload" | "parsed-from-pdf";

interface AssetLink {
  kind: LinkKind;
  label: string;
  externalId?: string; // dossier number / policy number from PDF parse
}

interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  sizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  parsedPolicyNumber?: string;
  parsedDossierNumber?: string;
  matchSource: MatchSource;
  matchStatus: "matched" | "partial" | "unmatched";
  links: AssetLink[];
}

const ASSETS: Asset[] = [
  {
    id: "a1",
    name: "Policy_AON_Cybersecurity_2026.pdf",
    kind: "Policy",
    sizeKb: 420,
    uploadedAt: "2026-04-18",
    uploadedBy: "Kevin Kools",
    parsedPolicyNumber: "POL-2026-AON-8821",
    parsedDossierNumber: "DOS-998712",
    matchSource: "parsed-from-pdf",
    matchStatus: "matched",
    links: [
      { kind: "customer", label: "Artex Group", externalId: "DOS-998712" },
      { kind: "product", label: "AON Cybersecurity", externalId: "POL-2026-AON-8821" },
    ],
  },
  {
    id: "a2",
    name: "Claim_Janssens_202604.pdf",
    kind: "Claim report",
    sizeKb: 212,
    uploadedAt: "2026-04-14",
    uploadedBy: "Sophie Janssens",
    matchSource: "direct-upload",
    matchStatus: "matched",
    links: [{ kind: "contact", label: "Sophie Janssens" }],
  },
  {
    id: "a3",
    name: "Contract_Vivium_Onboarding_Q2.pdf",
    kind: "Contract",
    sizeKb: 310,
    uploadedAt: "2026-04-09",
    uploadedBy: "Automation",
    parsedPolicyNumber: "POL-2026-VIV-1107",
    parsedDossierNumber: "DOS-774021",
    matchSource: "parsed-from-pdf",
    matchStatus: "matched",
    links: [
      { kind: "customer", label: "Vivium Re", externalId: "DOS-774021" },
      { kind: "product", label: "Vivium Commercial Lines", externalId: "POL-2026-VIV-1107" },
    ],
  },
  {
    id: "a4",
    name: "Correspondence_BNP_Paribas_renewal.pdf",
    kind: "Correspondence",
    sizeKb: 88,
    uploadedAt: "2026-04-07",
    uploadedBy: "Marc De Backer",
    matchSource: "direct-upload",
    matchStatus: "matched",
    links: [{ kind: "lead", label: "BNP Paribas — renewal Q3" }],
  },
  {
    id: "a5",
    name: "Policy_Delhaize_groupLife_2025.pdf",
    kind: "Policy",
    sizeKb: 540,
    uploadedAt: "2026-04-05",
    uploadedBy: "Automation",
    parsedPolicyNumber: "POL-2025-LIF-4410",
    parsedDossierNumber: "DOS-441203",
    matchSource: "parsed-from-pdf",
    matchStatus: "partial",
    links: [{ kind: "product", label: "Group life", externalId: "POL-2025-LIF-4410" }],
  },
  {
    id: "a6",
    name: "scan_unknown_0421.pdf",
    kind: "Other",
    sizeKb: 160,
    uploadedAt: "2026-04-03",
    uploadedBy: "Kevin Kools",
    matchSource: "parsed-from-pdf",
    matchStatus: "unmatched",
    links: [],
  },
];

const MATCH_BADGES: Record<Asset["matchStatus"], { label: string; className: string; icon: typeof CheckCircle2 }> = {
  matched: {
    label: "Matched",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partial match",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: AlertTriangle,
  },
  unmatched: {
    label: "Needs review",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertTriangle,
  },
};

const LINK_KIND_LABEL: Record<LinkKind, string> = {
  customer: "Customer",
  product: "Product",
  contact: "Contact",
  lead: "Lead",
};

type Filter = "All" | "Matched" | "Needs review";

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const assets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ASSETS.filter((a) => {
      if (filter === "Matched" && a.matchStatus !== "matched") return false;
      if (filter === "Needs review" && a.matchStatus === "matched") return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.parsedPolicyNumber?.toLowerCase().includes(q) ||
        a.parsedDossierNumber?.toLowerCase().includes(q) ||
        a.links.some((l) => l.label.toLowerCase().includes(q))
      );
    });
  }, [search, filter]);

  const stats = useMemo(() => {
    const total = ASSETS.length;
    const matched = ASSETS.filter((a) => a.matchStatus === "matched").length;
    const parsed = ASSETS.filter((a) => a.matchSource === "parsed-from-pdf").length;
    const unmatched = ASSETS.filter((a) => a.matchStatus === "unmatched").length;
    return { total, matched, parsed, unmatched };
  }, []);

  return (
    <div className="bg-white min-h-full">
      <div className="p-7">
        <div className="flex items-start justify-between pb-5">
          <div>
            <h1 className="text-[22px] font-semibold">Asset Library</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              One place for every document — policies, contracts, claim reports, correspondence.
              Each asset links to a customer, product, contact, or lead, and can be reused in
              campaigns, forms, and insights.
            </p>
          </div>
          <Button>
            <FilePlus2 className="h-[13px] w-[13px]" />
            Import document
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3.5 mb-6">
          <StatCard label="Total documents" value={stats.total} />
          <StatCard label="Matched to records" value={stats.matched} />
          <StatCard
            label="Parsed from PDF"
            value={stats.parsed}
            icon={<Sparkles className="h-3.5 w-3.5 text-brand" />}
          />
          <StatCard label="Needs review" value={stats.unmatched} tone="danger" />
        </div>

        <div className="flex items-center gap-2 mb-3.5">
          <div className="relative flex-1 max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-light pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Search by filename, policy number, dossier number, or linked record…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(["All", "Matched", "Needs review"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "py-1.5 px-3 rounded-md text-[12.5px] font-medium transition-colors inline-flex items-center gap-1.5",
                  filter === f
                    ? "bg-brand text-white"
                    : "bg-gray-100 text-muted-foreground hover:bg-gray-200",
                )}
              >
                {f === "All" && <Filter className="h-3 w-3" />}
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Document</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Matched via</TableHead>
                <TableHead>Linked to</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((a) => {
                const badge = MATCH_BADGES[a.matchStatus];
                const Icon = badge.icon;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium truncate">{a.name}</div>
                          <div className="text-[11.5px] text-muted-foreground">
                            {a.sizeKb} KB · {a.uploadedBy}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.kind}</Badge>
                    </TableCell>
                    <TableCell>
                      {a.matchSource === "parsed-from-pdf" ? (
                        <div className="flex flex-col gap-0.5 text-[11.5px]">
                          <span className="inline-flex items-center gap-1 text-brand">
                            <Sparkles className="h-3 w-3" />
                            Parsed from PDF
                          </span>
                          {a.parsedPolicyNumber && (
                            <span className="text-muted-foreground">
                              Policy #{" "}
                              <code className="font-mono text-[11px] px-1 py-px rounded bg-gray-50">
                                {a.parsedPolicyNumber}
                              </code>
                            </span>
                          )}
                          {a.parsedDossierNumber && (
                            <span className="text-muted-foreground">
                              Dossier #{" "}
                              <code className="font-mono text-[11px] px-1 py-px rounded bg-gray-50">
                                {a.parsedDossierNumber}
                              </code>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
                          <Link2 className="h-3 w-3" />
                          Direct upload
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.links.length === 0 ? (
                        <span className="text-[11.5px] text-muted-foreground italic">
                          No match found
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {a.links.map((l, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11.5px] px-1.5 py-0.5 rounded border border-border bg-gray-50"
                            >
                              <span className="text-muted-foreground">
                                {LINK_KIND_LABEL[l.kind]}:
                              </span>
                              <span className="font-medium">{l.label}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground whitespace-nowrap">
                      {a.uploadedAt}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-full border",
                          badge.className,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {badge.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 border border-dashed border-border rounded-lg p-5 text-[12.5px] text-muted-foreground bg-gray-50/50 leading-relaxed">
          <div className="font-medium text-foreground mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            How matching works
          </div>
          When a document is imported, we either attach it directly to the record you selected, or
          parse it for the <strong>Policy number</strong> (product external ID) and{" "}
          <strong>Dossier number</strong> (customer external ID) to auto-link it. Partial matches —
          e.g. product found but customer missing — land in <strong>Needs review</strong> for a
          quick confirm.
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[12.5px] text-muted-foreground">{label}</span>
        {icon && <div className="w-7 h-7 rounded-md bg-brand-light flex items-center justify-center">{icon}</div>}
      </div>
      <div
        className={cn(
          "text-[22px] font-semibold",
          tone === "danger" && value > 0 && "text-rose-600",
        )}
      >
        {value}
      </div>
    </div>
  );
}
