"use client"

import { useMemo, useState } from "react"
import { Bookmark, Plus, Search, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  jobTitle: string
  phone: string
  linkedin: string
  address: string
}

const CONTACTS: Contact[] = [
  {
    id: "1",
    firstName: "Yanier",
    lastName: "Cuadro",
    email: "y.cuadro@solarisgroup.be",
    company: "Solaris Group",
    jobTitle: "Managing Director",
    phone: "+32 2 512 33 41",
    linkedin: "linkedin.com/in/y-cuadro",
    address: "Rue Royale 42, 1000 Brussels",
  },
  {
    id: "2",
    firstName: "Raciel",
    lastName: "Rivas",
    email: "r.rivas@vantagebrokers.be",
    company: "Vantage Brokers",
    jobTitle: "Senior Advisor",
    phone: "+32 3 287 11 08",
    linkedin: "linkedin.com/in/raciel-rivas",
    address: "Meir 18, 2000 Antwerp",
  },
  {
    id: "3",
    firstName: "Kamelia",
    lastName: "Stanimirova",
    email: "k.stanimirova@noricumins.be",
    company: "Noricum Insurance",
    jobTitle: "Head of Operations",
    phone: "+32 9 245 77 02",
    linkedin: "linkedin.com/in/k-stanimirova",
    address: "Korenmarkt 7, 9000 Ghent",
  },
  {
    id: "4",
    firstName: "Iva",
    lastName: "Koleva",
    email: "iva.koleva@brightpath-ins.be",
    company: "Brightpath Insurance",
    jobTitle: "Portfolio Manager",
    phone: "+32 11 61 45 29",
    linkedin: "linkedin.com/in/iva-koleva",
    address: "Diestsestraat 22, 3500 Hasselt",
  },
  {
    id: "5",
    firstName: "Bertus",
    lastName: "Vano",
    email: "bertus.vano@example.com",
    company: "Vano & Partners",
    jobTitle: "Broker",
    phone: "+31 20 794 16 55",
    linkedin: "linkedin.com/in/bertus-vano",
    address: "Herengracht 101, 1015 Amsterdam",
  },
  {
    id: "6",
    firstName: "Marie",
    lastName: "Laurent",
    email: "m.laurent@laurent-assurances.be",
    company: "Laurent Assurances",
    jobTitle: "Owner",
    phone: "+32 81 22 48 91",
    linkedin: "linkedin.com/in/marie-laurent",
    address: "Rue de Fer 12, 5000 Namur",
  },
  {
    id: "7",
    firstName: "Pérez",
    lastName: "García",
    email: "p.garcia@novabrokers.es",
    company: "Nova Brokers",
    jobTitle: "Client Advisor",
    phone: "+34 91 444 22 10",
    linkedin: "linkedin.com/in/p-garcia",
    address: "Calle Gran Via 28, 28013 Madrid",
  },
  {
    id: "8",
    firstName: "Søren",
    lastName: "O'Brien",
    email: "soren.obrien@northstar-ins.ie",
    company: "NorthStar Insurance",
    jobTitle: "Regional Manager",
    phone: "+353 1 677 80 55",
    linkedin: "linkedin.com/in/soren-obrien",
    address: "St Stephen's Green 4, Dublin 2",
  },
  {
    id: "9",
    firstName: "Anouk",
    lastName: "De Wit",
    email: "a.dewit@elmwoodbrokers.be",
    company: "Elmwood Brokers",
    jobTitle: "Advisor",
    phone: "+32 3 216 44 19",
    linkedin: "linkedin.com/in/anouk-dewit",
    address: "Kapellekensbaan 9, 2100 Deurne",
  },
  {
    id: "10",
    firstName: "Lucas",
    lastName: "Van Houten",
    email: "l.vanhouten@apexinsur.be",
    company: "Apex Insurance Group",
    jobTitle: "Underwriter",
    phone: "+32 15 33 90 02",
    linkedin: "linkedin.com/in/lucas-vanhouten",
    address: "Bruul 44, 2800 Mechelen",
  },
  {
    id: "11",
    firstName: "Emilie",
    lastName: "Dubois",
    email: "e.dubois@libertasbrokers.be",
    company: "Libertas Brokers",
    jobTitle: "Account Executive",
    phone: "+32 2 478 21 63",
    linkedin: "linkedin.com/in/emilie-dubois",
    address: "Avenue Louise 340, 1050 Brussels",
  },
  {
    id: "12",
    firstName: "Tobias",
    lastName: "Lefèvre",
    email: "t.lefevre@keystonebrokers.be",
    company: "Keystone Brokers",
    jobTitle: "Senior Broker",
    phone: "+32 4 223 07 18",
    linkedin: "linkedin.com/in/tobias-lefevre",
    address: "Place Saint-Lambert 1, 4000 Liège",
  },
  {
    id: "13",
    firstName: "Astrid",
    lastName: "Mertens",
    email: "a.mertens@meridianrisk.be",
    company: "Meridian Risk Advisors",
    jobTitle: "Risk Consultant",
    phone: "+32 50 44 28 07",
    linkedin: "linkedin.com/in/astrid-mertens",
    address: "Stationsplein 3, 8000 Bruges",
  },
  {
    id: "14",
    firstName: "Hugo",
    lastName: "Peeters",
    email: "hugo.peeters@vestaadvisors.be",
    company: "Vesta Advisors",
    jobTitle: "Director",
    phone: "+32 9 265 18 40",
    linkedin: "linkedin.com/in/hugo-peeters",
    address: "Veldstraat 99, 9000 Ghent",
  },
  {
    id: "15",
    firstName: "Camille",
    lastName: "Moreau",
    email: "c.moreau@pinehillcovers.fr",
    company: "Pinehill Covers",
    jobTitle: "Commercial Director",
    phone: "+33 1 44 77 02 19",
    linkedin: "linkedin.com/in/camille-moreau",
    address: "Rue du Faubourg Saint-Honoré 55, 75008 Paris",
  },
  {
    id: "16",
    firstName: "Diego",
    lastName: "Fernández",
    email: "d.fernandez@astrobrokers.es",
    company: "Astro Brokers",
    jobTitle: "Partner",
    phone: "+34 93 215 80 44",
    linkedin: "linkedin.com/in/diego-fernandez",
    address: "Passeig de Gràcia 88, 08008 Barcelona",
  },
  {
    id: "17",
    firstName: "Sofie",
    lastName: "Goossens",
    email: "s.goossens@hexagonins.be",
    company: "Hexagon Insurance",
    jobTitle: "Broker Manager",
    phone: "+32 16 33 77 21",
    linkedin: "linkedin.com/in/sofie-goossens",
    address: "Bondgenotenlaan 62, 3000 Leuven",
  },
  {
    id: "18",
    firstName: "Martin",
    lastName: "Claes",
    email: "m.claes@continentalrisk.be",
    company: "Continental Risk",
    jobTitle: "Commercial Advisor",
    phone: "+32 14 45 22 67",
    linkedin: "linkedin.com/in/martin-claes",
    address: "Grote Markt 10, 2300 Turnhout",
  },
  {
    id: "19",
    firstName: "Juliette",
    lastName: "Charlier",
    email: "j.charlier@kappasolutions.be",
    company: "Kappa Solutions",
    jobTitle: "Operations Lead",
    phone: "+32 71 32 09 85",
    linkedin: "linkedin.com/in/juliette-charlier",
    address: "Boulevard Tirou 12, 6000 Charleroi",
  },
  {
    id: "20",
    firstName: "Niels",
    lastName: "Janssens",
    email: "n.janssens@atlasbrokers.nl",
    company: "Atlas Brokers",
    jobTitle: "Head of Growth",
    phone: "+31 30 811 64 02",
    linkedin: "linkedin.com/in/niels-janssens",
    address: "Oudegracht 120, 3511 Utrecht",
  },
  {
    id: "21",
    firstName: "Léa",
    lastName: "Bernard",
    email: "l.bernard@sapphirecover.fr",
    company: "Sapphire Cover",
    jobTitle: "Client Partner",
    phone: "+33 4 72 55 18 37",
    linkedin: "linkedin.com/in/lea-bernard",
    address: "Rue de la République 24, 69002 Lyon",
  },
  {
    id: "22",
    firstName: "Thomas",
    lastName: "Willems",
    email: "t.willems@capellarisk.be",
    company: "Capella Risk",
    jobTitle: "Senior Risk Analyst",
    phone: "+32 53 41 62 18",
    linkedin: "linkedin.com/in/thomas-willems",
    address: "Grote Markt 5, 9300 Aalst",
  },
  {
    id: "23",
    firstName: "Isabelle",
    lastName: "Maes",
    email: "i.maes@lumenadvisors.be",
    company: "Lumen Advisors",
    jobTitle: "Senior Consultant",
    phone: "+32 3 321 99 18",
    linkedin: "linkedin.com/in/isabelle-maes",
    address: "Frankrijklei 120, 2000 Antwerp",
  },
  {
    id: "24",
    firstName: "Henri",
    lastName: "Dumont",
    email: "h.dumont@orionbroker.be",
    company: "Orion Broker",
    jobTitle: "Managing Partner",
    phone: "+32 85 27 40 12",
    linkedin: "linkedin.com/in/henri-dumont",
    address: "Quai de Namur 18, 4500 Huy",
  },
  {
    id: "25",
    firstName: "Sabine",
    lastName: "Van Damme",
    email: "s.vandamme@elderwoodins.be",
    company: "Elderwood Insurance",
    jobTitle: "Client Relations",
    phone: "+32 2 610 44 55",
    linkedin: "linkedin.com/in/sabine-vandamme",
    address: "Avenue de Tervueren 155, 1150 Brussels",
  },
  {
    id: "26",
    firstName: "Felix",
    lastName: "Vermeulen",
    email: "f.vermeulen@riverbendrisk.be",
    company: "Riverbend Risk",
    jobTitle: "Broker",
    phone: "+32 10 24 18 90",
    linkedin: "linkedin.com/in/felix-vermeulen",
    address: "Place de l'Université 2, 1348 Louvain-la-Neuve",
  },
  {
    id: "27",
    firstName: "Pauline",
    lastName: "Leroy",
    email: "p.leroy@silverlineins.be",
    company: "Silverline Insurance",
    jobTitle: "Commercial Manager",
    phone: "+32 81 75 09 44",
    linkedin: "linkedin.com/in/pauline-leroy",
    address: "Rue Godefroid 32, 5000 Namur",
  },
  {
    id: "28",
    firstName: "Jonas",
    lastName: "Hendrickx",
    email: "j.hendrickx@zenithbrokers.be",
    company: "Zenith Brokers",
    jobTitle: "Advisor",
    phone: "+32 11 28 47 53",
    linkedin: "linkedin.com/in/jonas-hendrickx",
    address: "Gasthuisberg 11, 3000 Leuven",
  },
  {
    id: "29",
    firstName: "Béatrice",
    lastName: "Leclercq",
    email: "b.leclercq@harmonyrisk.fr",
    company: "Harmony Risk",
    jobTitle: "Key Account Manager",
    phone: "+33 3 20 88 16 02",
    linkedin: "linkedin.com/in/beatrice-leclercq",
    address: "Grand Place 3, 59000 Lille",
  },
  {
    id: "30",
    firstName: "Kevin",
    lastName: "Segers",
    email: "k.segers@evergladesins.be",
    company: "Everglades Insurance",
    jobTitle: "Portfolio Analyst",
    phone: "+32 3 298 55 71",
    linkedin: "linkedin.com/in/kevin-segers",
    address: "Herckenrodesingel 33, 3500 Hasselt",
  },
  {
    id: "31",
    firstName: "Valentine",
    lastName: "Thys",
    email: "v.thys@pebbleadvisors.be",
    company: "Pebble Advisors",
    jobTitle: "Senior Advisor",
    phone: "+32 2 345 18 42",
    linkedin: "linkedin.com/in/valentine-thys",
    address: "Rue Haute 40, 1000 Brussels",
  },
]

const COLUMNS: { key: keyof Contact; label: string; sortable?: boolean }[] = [
  { key: "firstName", label: "First Name", sortable: true },
  { key: "lastName", label: "Last Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "company", label: "Company", sortable: true },
  { key: "jobTitle", label: "Job Title", sortable: true },
  { key: "phone", label: "Phone" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "address", label: "Address" },
]

export default function ContactsPage() {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return CONTACTS
    return CONTACTS.filter((c) =>
      [c.firstName, c.lastName, c.email, c.company, c.jobTitle]
        .join(" ")
        .toLowerCase()
        .includes(q),
    )
  }, [search])

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set())
    else setSelected(new Set(filtered.map((c) => c.id)))
  }

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const total = CONTACTS.length
  const missing = CONTACTS.filter(
    (c) => !c.phone || !c.linkedin || !c.address || !c.jobTitle || !c.company,
  ).length

  return (
    <div className="bg-white min-h-full">
      <div className="px-7 py-2.5 bg-white border-b border-border flex items-center gap-2 text-[13px] text-muted-foreground">
        <span>…</span>
        <span>/</span>
        <span className="text-brand font-medium">Contacts</span>
      </div>

      <div className="p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900">Contacts</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage contacts who collaborate with you on your initiatives.
            </p>
          </div>
          <Button>
            <Plus className="h-[13px] w-[13px]" />
            New contact
          </Button>
        </div>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search contacts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Bookmark className="h-[13px] w-[13px]" />
            View
          </Button>
        </div>

        <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white px-4 py-2.5 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Total Contacts</span>
            <span className="font-semibold text-gray-900 tabular-nums">{total}</span>
          </div>
          <span className="text-gray-200">|</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Contacts with missing info</span>
            <span className="font-semibold text-gray-900 tabular-nums">{missing}</span>
          </div>
          <span className="text-gray-200">|</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Duplicated Contacts</span>
            <span className="font-semibold text-gray-900 tabular-nums">0</span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 w-10">
                  <Checkbox
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                {COLUMNS.map((col) => (
                  <TableHead key={col.key} className="select-none">
                    <span className="inline-flex items-center gap-1.5">
                      {col.label}
                      {col.sortable && (
                        <ChevronsUpDown className="h-3 w-3 text-gray-400" />
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const isChecked = selected.has(c.id)
                return (
                  <TableRow key={c.id} data-state={isChecked ? "selected" : undefined}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleRow(c.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{c.firstName}</TableCell>
                    <TableCell className="text-gray-900">{c.lastName}</TableCell>
                    <TableCell className="text-brand hover:underline cursor-pointer">
                      {c.email}
                    </TableCell>
                    <TableCell className="text-gray-700">{c.company}</TableCell>
                    <TableCell className="text-gray-700">{c.jobTitle}</TableCell>
                    <TableCell className="text-gray-600 tabular-nums">{c.phone}</TableCell>
                    <TableCell>
                      <a
                        href={`https://${c.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline truncate inline-block max-w-[200px]"
                      >
                        {c.linkedin}
                      </a>
                    </TableCell>
                    <TableCell className="text-gray-600">{c.address}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
