"use client"

export function StageBadge({
  stage,
}: {
  stage: "Validated" | "Lost" | "Proposal" | "Rejected" | "Won"
}) {
  const map: Record<typeof stage, string> = {
    Validated: "bg-blue-100 text-blue-700",
    Lost: "bg-gray-100 text-gray-700",
    Proposal: "bg-indigo-100 text-indigo-700",
    Rejected: "bg-rose-100 text-rose-700",
    Won: "bg-emerald-100 text-emerald-700",
  }
  return <span className={`px-2 py-0.5 text-xs rounded-full ${map[stage]}`}>{stage}</span>
}
