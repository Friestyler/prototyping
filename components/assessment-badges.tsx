"use client"

export function AssessmentBadges({
  value,
}: {
  value: "Accept" | "Withhold" | "Not set"
}) {
  const cls =
    value === "Accept"
      ? "bg-emerald-100 text-emerald-700"
      : value === "Withhold"
        ? "bg-rose-100 text-rose-700"
        : "bg-gray-100 text-gray-700"

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 text-xs rounded-full ${cls}`}>{value}</span>
    </div>
  )
}
