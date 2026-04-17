"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveUserCampaignTemplate, type SaveTemplateInput } from "@/lib/user-campaigns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface NewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function NewTemplateDialog({ open, onOpenChange, onCreated }: NewTemplateDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [targetGroup, setTargetGroup] = useState<"Customers" | "Leads">("Customers");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setTargetGroup("Customers");
    setDescription("");
    setSubject("");
    setBody("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Template name required" });
      return;
    }
    setSaving(true);
    const payload: SaveTemplateInput = {
      name: name.trim(),
      targetGroup,
      description: description.trim() || undefined,
      subject: subject.trim() || undefined,
      body: body.trim() || undefined,
    };
    const created = await saveUserCampaignTemplate(payload);
    setSaving(false);
    if (created) {
      toast({ title: "Template saved", description: `"${created.name}" is in Templates.` });
      reset();
      onOpenChange(false);
      onCreated?.();
    } else {
      toast({ title: "Couldn't save template", description: "The server rejected the save." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New campaign template</DialogTitle>
          <DialogDescription>
            Reusable email name + subject + body. You can also create templates through Claude via MCP.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="tpl-name">Name *</Label>
            <Input
              id="tpl-name"
              placeholder="Renewal reminder Q2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Target group *</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["Customers", "Leads"] as const).map((tg) => (
                <button
                  key={tg}
                  type="button"
                  onClick={() => setTargetGroup(tg)}
                  className={cn(
                    "border-[1.5px] rounded-lg p-2.5 text-left text-[13px] font-medium transition-all",
                    targetGroup === tg ? "border-brand bg-brand-50 text-brand" : "border-b2 hover:border-indigo-300",
                  )}
                >
                  {tg}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tpl-description">Description</Label>
            <Input
              id="tpl-description"
              placeholder="Sent 30 days before contract renewal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tpl-subject">Email subject</Label>
            <Input
              id="tpl-subject"
              placeholder="Your policy renews on {{renewalDate}}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="tpl-body">Email body</Label>
            <Textarea
              id="tpl-body"
              placeholder="Hi {{firstName}}, ..."
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
