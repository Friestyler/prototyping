"use client";

import { ExternalLink, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DEMO_FORM_URL = "https://demo.qollabi.ai/forms/demo";

const FORMS = [
  {
    id: "demo",
    name: "Demo form",
    description: "Placeholder form for testing campaign email flows.",
    url: DEMO_FORM_URL,
    submissions: 0,
    outcome: "Passive update",
  },
];

export default function FormsPage() {
  return (
    <div className="bg-white min-h-full">
      <div className="p-7">
        <div className="flex items-start justify-between pb-5">
          <div>
            <h1 className="text-[22px] font-semibold">Forms</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Build smart forms that pre-fill customer data and route submissions into passive
              updates, new leads, or contract execution.
            </p>
          </div>
          <Button disabled>
            <Plus className="h-[13px] w-[13px]" />
            New form
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {FORMS.map((f) => (
            <Card key={f.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 pt-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-md bg-brand-light text-brand flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-gray-100 text-muted-foreground">
                    {f.outcome}
                  </span>
                </div>
                <div>
                  <div className="text-[14px] font-medium">{f.name}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {f.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border text-[11.5px] text-muted-foreground">
                  <span>{f.submissions} submissions</span>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    Open form
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 border border-dashed border-border rounded-lg p-6 text-[13px] text-muted-foreground bg-gray-50/50">
          <div className="font-medium text-foreground mb-1">Form builder coming soon</div>
          Drop the <strong>Demo form</strong> link into any campaign email — use the{" "}
          <code className="px-1 py-px rounded bg-white border border-border">/</code> menu → <strong>Form link</strong>.
        </div>
      </div>
    </div>
  );
}

export { DEMO_FORM_URL };
