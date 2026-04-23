// AUTO-GENERATED from Demo_Merged_Final_2.csv — edit the CSV + rerun parse.py

export interface AiTemplate {
  id: string;
  name: string;
  insurer: string;
}

export interface AiSubcategory {
  id: string;
  name: string;
  templates: AiTemplate[];
}

export interface AiCategory {
  id: string;
  name: string;
  subcategories: AiSubcategory[];
}

export const AI_CATEGORY_TREE: AiCategory[] = [
  {
    "id": "cat-arbeidsongevallen-en-collectieve-verzeke",
    "name": "Arbeidsongevallen en collectieve verzekeringen",
    "subcategories": [
      {
        "id": "sub-arbeidsongevallen-en-collectieve-verzeke-ao-huispersoneel",
        "name": "AO huispersoneel",
        "templates": [
          {
            "id": "tpl-arbeidsongevallen-en-collectieve-verzeke-ao-huispersoneel-ag-insurance",
            "name": "Arbeidsongevallen en collectieve verzekeringen AO huispersoneel AG INSURANCE",
            "insurer": "AG INSURANCE"
          }
        ]
      },
      {
        "id": "sub-arbeidsongevallen-en-collectieve-verzeke-arbeidsongevallen-wet",
        "name": "Arbeidsongevallen (Wet)",
        "templates": [
          {
            "id": "tpl-arbeidsongevallen-en-collectieve-verzeke-arbeidsongevallen-wet-ag-insurance",
            "name": "Arbeidsongevallen en collectieve verzekeringen Arbeidsongevallen (Wet) AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-arbeidsongevallen-en-collectieve-verzeke-arbeidsongevallen-wet-baloise-insurance",
            "name": "Arbeidsongevallen en collectieve verzekeringen Arbeidsongevallen (Wet) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-arbeidsongevallen-en-collectieve-verzeke-collectieve-hospitalisatie",
        "name": "Collectieve Hospitalisatie",
        "templates": [
          {
            "id": "tpl-arbeidsongevallen-en-collectieve-verzeke-collectieve-hospitalisatie-axa",
            "name": "Arbeidsongevallen en collectieve verzekeringen Collectieve Hospitalisatie AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-arbeidsongevallen-en-collectieve-verzeke-collectieve-hospitalisatie-dkv-belgium",
            "name": "Arbeidsongevallen en collectieve verzekeringen Collectieve Hospitalisatie DKV Belgium",
            "insurer": "DKV Belgium"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-auto",
    "name": "Auto",
    "subcategories": [
      {
        "id": "sub-auto-bijzondere-voertuigen",
        "name": "Bijzondere voertuigen",
        "templates": [
          {
            "id": "tpl-auto-bijzondere-voertuigen-axa",
            "name": "Auto Bijzondere voertuigen AXA",
            "insurer": "AXA"
          }
        ]
      },
      {
        "id": "sub-auto-bromfietsen",
        "name": "Bromfietsen",
        "templates": [
          {
            "id": "tpl-auto-bromfietsen-axa",
            "name": "Auto Bromfietsen AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-auto-bromfietsen-baloise-insurance",
            "name": "Auto Bromfietsen BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-auto-bromfietsen-baloise-ex-fidea",
            "name": "Auto Bromfietsen BALOISE(ex-Fidea)",
            "insurer": "BALOISE(ex-Fidea)"
          }
        ]
      },
      {
        "id": "sub-auto-gemengde-vloot",
        "name": "Gemengde vloot",
        "templates": [
          {
            "id": "tpl-auto-gemengde-vloot-baloise-insurance",
            "name": "Auto Gemengde vloot BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-auto-lichte-vrachtwagens",
        "name": "Lichte Vrachtwagens",
        "templates": [
          {
            "id": "tpl-auto-lichte-vrachtwagens-ag-insurance",
            "name": "Auto Lichte Vrachtwagens AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-auto-lichte-vrachtwagens-axa",
            "name": "Auto Lichte Vrachtwagens AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-auto-lichte-vrachtwagens-baloise-insurance",
            "name": "Auto Lichte Vrachtwagens BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-auto-motorfietsen",
        "name": "Motorfietsen",
        "templates": [
          {
            "id": "tpl-auto-motorfietsen-axa",
            "name": "Auto Motorfietsen AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-auto-motorfietsen-baloise-insurance",
            "name": "Auto Motorfietsen BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-auto-toerisme-en-zaken-gemengd-gebruik",
        "name": "Toerisme en Zaken, gemengd gebruik",
        "templates": [
          {
            "id": "tpl-auto-toerisme-en-zaken-gemengd-gebruik-ag-insurance",
            "name": "Auto Toerisme en Zaken, gemengd gebruik AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-auto-toerisme-en-zaken-gemengd-gebruik-allianz",
            "name": "Auto Toerisme en Zaken, gemengd gebruik ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-auto-toerisme-en-zaken-gemengd-gebruik-axa",
            "name": "Auto Toerisme en Zaken, gemengd gebruik AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-auto-toerisme-en-zaken-gemengd-gebruik-baloise-insurance",
            "name": "Auto Toerisme en Zaken, gemengd gebruik BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-auto-toerisme-en-zaken-gemengd-gebruik-vivium",
            "name": "Auto Toerisme en Zaken, gemengd gebruik VIVIUM",
            "insurer": "VIVIUM"
          },
          {
            "id": "tpl-auto-toerisme-en-zaken-gemengd-gebruik-vander-haeghen-c-nv",
            "name": "Auto Toerisme en Zaken, gemengd gebruik Vander Haeghen & CÂ° NV",
            "insurer": "Vander Haeghen & CÂ° NV"
          }
        ]
      },
      {
        "id": "sub-auto-vrachtwagens-v-e-r-vervoer-eigen-rek",
        "name": "Vrachtwagens,V.E.R.(Vervoer Eigen Rek.)",
        "templates": [
          {
            "id": "tpl-auto-vrachtwagens-v-e-r-vervoer-eigen-rek-axa",
            "name": "Auto Vrachtwagens,V.E.R.(Vervoer Eigen Rek.) AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-auto-vrachtwagens-v-e-r-vervoer-eigen-rek-baloise-insurance",
            "name": "Auto Vrachtwagens,V.E.R.(Vervoer Eigen Rek.) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-auto-vrachtwagens-v-r-d-vervoer-rek-derden",
        "name": "Vrachtwagens,V.R.D.(Vervoer Rek. Derden)",
        "templates": [
          {
            "id": "tpl-auto-vrachtwagens-v-r-d-vervoer-rek-derden-baloise-insurance",
            "name": "Auto Vrachtwagens,V.R.D.(Vervoer Rek. Derden) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-auto-werktuigen-en-tractoren",
        "name": "Werktuigen en Tractoren",
        "templates": [
          {
            "id": "tpl-auto-werktuigen-en-tractoren-ag-insurance",
            "name": "Auto Werktuigen en Tractoren AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-auto-werktuigen-en-tractoren-baloise-insurance",
            "name": "Auto Werktuigen en Tractoren BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-ba-andere-dan-particulieren",
    "name": "BA andere dan particulieren",
    "subcategories": [
      {
        "id": "sub-ba-andere-dan-particulieren-ba-beroep-intellectuele-vrije-commerci-l",
        "name": "BA Beroep (Intellectuele, Vrije, CommerciÃ«le)",
        "templates": [
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-beroep-intellectuele-vrije-commerci-l-ag-insurance",
            "name": "BA andere dan particulieren BA Beroep (Intellectuele, Vrije, CommerciÃ«le) AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-beroep-intellectuele-vrije-commerci-l-amlin-europe-nv",
            "name": "BA andere dan particulieren BA Beroep (Intellectuele, Vrije, CommerciÃ«le) AMLIN EUROPE NV",
            "insurer": "AMLIN EUROPE NV"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-beroep-intellectuele-vrije-commerci-l-axa",
            "name": "BA andere dan particulieren BA Beroep (Intellectuele, Vrije, CommerciÃ«le) AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-beroep-intellectuele-vrije-commerci-l-baloise-insurance",
            "name": "BA andere dan particulieren BA Beroep (Intellectuele, Vrije, CommerciÃ«le) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-beroep-intellectuele-vrije-commerci-l-hiscox-nv",
            "name": "BA andere dan particulieren BA Beroep (Intellectuele, Vrije, CommerciÃ«le) HISCOX NV",
            "insurer": "HISCOX NV"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-beroep-intellectuele-vrije-commerci-l-protect-nv",
            "name": "BA andere dan particulieren BA Beroep (Intellectuele, Vrije, CommerciÃ«le) PROTECT NV",
            "insurer": "PROTECT NV"
          }
        ]
      },
      {
        "id": "sub-ba-andere-dan-particulieren-ba-inrichters-van-evenementen",
        "name": "BA Inrichters van Evenementen",
        "templates": [
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-inrichters-van-evenementen-ag-insurance",
            "name": "BA andere dan particulieren BA Inrichters van Evenementen AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-inrichters-van-evenementen-axa",
            "name": "BA andere dan particulieren BA Inrichters van Evenementen AXA",
            "insurer": "AXA"
          }
        ]
      },
      {
        "id": "sub-ba-andere-dan-particulieren-ba-medische-beroepen",
        "name": "BA Medische Beroepen",
        "templates": [
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-medische-beroepen-ag-insurance",
            "name": "BA andere dan particulieren BA Medische Beroepen AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-medische-beroepen-amma",
            "name": "BA andere dan particulieren BA Medische Beroepen AMMA",
            "insurer": "AMMA"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-medische-beroepen-axa",
            "name": "BA andere dan particulieren BA Medische Beroepen AXA",
            "insurer": "AXA"
          }
        ]
      },
      {
        "id": "sub-ba-andere-dan-particulieren-ba-onderneming",
        "name": "BA Onderneming",
        "templates": [
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-onderneming-ag-insurance",
            "name": "BA andere dan particulieren BA Onderneming AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-onderneming-axa",
            "name": "BA andere dan particulieren BA Onderneming AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-onderneming-baloise-insurance",
            "name": "BA andere dan particulieren BA Onderneming BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-ba-andere-dan-particulieren-ba-verenigingen-en-instellingen",
        "name": "BA Verenigingen en Instellingen",
        "templates": [
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-verenigingen-en-instellingen-axa",
            "name": "BA andere dan particulieren BA Verenigingen en Instellingen AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-ba-andere-dan-particulieren-ba-verenigingen-en-instellingen-baloise-insurance",
            "name": "BA andere dan particulieren BA Verenigingen en Instellingen BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-ba-andere-dan-particulieren-decennale-aansprakelijkheid",
        "name": "Decennale Aansprakelijkheid",
        "templates": [
          {
            "id": "tpl-ba-andere-dan-particulieren-decennale-aansprakelijkheid-baloise-insurance",
            "name": "BA andere dan particulieren Decennale Aansprakelijkheid BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-ba-particulieren",
    "name": "BA particulieren",
    "subcategories": [
      {
        "id": "sub-ba-particulieren-ba-gebouw-en-aanverwanten",
        "name": "BA Gebouw en aanverwanten",
        "templates": [
          {
            "id": "tpl-ba-particulieren-ba-gebouw-en-aanverwanten-baloise-insurance",
            "name": "BA particulieren BA Gebouw en aanverwanten BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-ba-particulieren-ba-priv-leven",
        "name": "BA PrivÃ©leven",
        "templates": [
          {
            "id": "tpl-ba-particulieren-ba-priv-leven-ag-insurance",
            "name": "BA particulieren BA PrivÃ©leven AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-ba-particulieren-ba-priv-leven-allianz",
            "name": "BA particulieren BA PrivÃ©leven ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-ba-particulieren-ba-priv-leven-axa",
            "name": "BA particulieren BA PrivÃ©leven AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-ba-particulieren-ba-priv-leven-baloise-insurance",
            "name": "BA particulieren BA PrivÃ©leven BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-ba-particulieren-ba-priv-leven-vivium",
            "name": "BA particulieren BA PrivÃ©leven VIVIUM",
            "insurer": "VIVIUM"
          }
        ]
      },
      {
        "id": "sub-ba-particulieren-multiwaarborg-ba-particulier",
        "name": "Multiwaarborg BA particulier",
        "templates": [
          {
            "id": "tpl-ba-particulieren-multiwaarborg-ba-particulier-ag-insurance",
            "name": "BA particulieren Multiwaarborg BA particulier AG INSURANCE",
            "insurer": "AG INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-bijstand",
    "name": "Bijstand",
    "subcategories": [
      {
        "id": "sub-bijstand-bijstand-cbfa-18",
        "name": "Bijstand (CBFA 18)",
        "templates": [
          {
            "id": "tpl-bijstand-bijstand-cbfa-18-allianz-partners",
            "name": "Bijstand Bijstand (CBFA 18) ALLIANZ  PARTNERS",
            "insurer": "ALLIANZ  PARTNERS"
          },
          {
            "id": "tpl-bijstand-bijstand-cbfa-18-assudis",
            "name": "Bijstand Bijstand (CBFA 18) ASSUDIS",
            "insurer": "ASSUDIS"
          },
          {
            "id": "tpl-bijstand-bijstand-cbfa-18-axa",
            "name": "Bijstand Bijstand (CBFA 18) AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-bijstand-bijstand-cbfa-18-europ-assistance-belgium",
            "name": "Bijstand Bijstand (CBFA 18) EUROP ASSISTANCE BELGIUM",
            "insurer": "EUROP ASSISTANCE BELGIUM"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-brand-bijzondere-risico-s",
    "name": "Brand bijzondere risico's",
    "subcategories": [
      {
        "id": "sub-brand-bijzondere-risico-s-brand-sr",
        "name": "Brand SR",
        "templates": [
          {
            "id": "tpl-brand-bijzondere-risico-s-brand-sr-ag-insurance",
            "name": "Brand bijzondere risico's Brand SR AG INSURANCE",
            "insurer": "AG INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-brand-eenvoudige-risico-s",
    "name": "Brand eenvoudige risico's",
    "subcategories": [
      {
        "id": "sub-brand-eenvoudige-risico-s-bedrijfsschade",
        "name": "Bedrijfsschade",
        "templates": [
          {
            "id": "tpl-brand-eenvoudige-risico-s-bedrijfsschade-baloise-insurance",
            "name": "Brand eenvoudige risico's Bedrijfsschade BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-brand-eenvoudige-risico-s-brand-er-handelshuizen",
        "name": "Brand ER - handelshuizen",
        "templates": [
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-handelshuizen-ag-insurance",
            "name": "Brand eenvoudige risico's Brand ER - handelshuizen AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-handelshuizen-allianz",
            "name": "Brand eenvoudige risico's Brand ER - handelshuizen ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-handelshuizen-axa",
            "name": "Brand eenvoudige risico's Brand ER - handelshuizen AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-handelshuizen-baloise-insurance",
            "name": "Brand eenvoudige risico's Brand ER - handelshuizen BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-brand-eenvoudige-risico-s-brand-er-woonhuizen",
        "name": "Brand ER - woonhuizen",
        "templates": [
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-woonhuizen-ag-insurance",
            "name": "Brand eenvoudige risico's Brand ER - woonhuizen AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-woonhuizen-allianz",
            "name": "Brand eenvoudige risico's Brand ER - woonhuizen ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-woonhuizen-axa",
            "name": "Brand eenvoudige risico's Brand ER - woonhuizen AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-woonhuizen-baloise-insurance",
            "name": "Brand eenvoudige risico's Brand ER - woonhuizen BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-brand-eenvoudige-risico-s-brand-er-woonhuizen-vivium",
            "name": "Brand eenvoudige risico's Brand ER - woonhuizen VIVIUM",
            "insurer": "VIVIUM"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-diversen",
    "name": "Diversen",
    "subcategories": [
      {
        "id": "sub-diversen-alle-risico-s-electronica",
        "name": "Alle Risico's Electronica",
        "templates": [
          {
            "id": "tpl-diversen-alle-risico-s-electronica-baloise-insurance",
            "name": "Diversen Alle Risico's Electronica BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-diversen-bijstand-cbfa-18",
        "name": "Bijstand (CBFA 18)",
        "templates": [
          {
            "id": "tpl-diversen-bijstand-cbfa-18-allianz-partners",
            "name": "Diversen Bijstand (CBFA 18) ALLIANZ  PARTNERS",
            "insurer": "ALLIANZ  PARTNERS"
          }
        ]
      },
      {
        "id": "sub-diversen-cyber-verzekering",
        "name": "Cyber-verzekering",
        "templates": [
          {
            "id": "tpl-diversen-cyber-verzekering-cybercontract",
            "name": "Diversen Cyber-verzekering Cybercontract",
            "insurer": "Cybercontract"
          }
        ]
      },
      {
        "id": "sub-diversen-dierenverzekeringen",
        "name": "Dierenverzekeringen",
        "templates": [
          {
            "id": "tpl-diversen-dierenverzekeringen-sant-vet",
            "name": "Diversen Dierenverzekeringen SantÃ©Vet",
            "insurer": "SantÃ©Vet"
          }
        ]
      },
      {
        "id": "sub-diversen-reisverzekeringen",
        "name": "Reisverzekeringen",
        "templates": [
          {
            "id": "tpl-diversen-reisverzekeringen-allianz-partners",
            "name": "Diversen Reisverzekeringen ALLIANZ  PARTNERS",
            "insurer": "ALLIANZ  PARTNERS"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-individueel",
    "name": "Individueel",
    "subcategories": [
      {
        "id": "sub-individueel-familiale-hospitalisatie",
        "name": "Familiale Hospitalisatie",
        "templates": [
          {
            "id": "tpl-individueel-familiale-hospitalisatie-dkv-belgium",
            "name": "Individueel Familiale Hospitalisatie DKV Belgium",
            "insurer": "DKV Belgium"
          }
        ]
      },
      {
        "id": "sub-individueel-familiale-ongevallen",
        "name": "Familiale Ongevallen",
        "templates": [
          {
            "id": "tpl-individueel-familiale-ongevallen-baloise-insurance",
            "name": "Individueel Familiale Ongevallen BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-individueel-gewaarborgd-inkomen",
        "name": "Gewaarborgd inkomen",
        "templates": [
          {
            "id": "tpl-individueel-gewaarborgd-inkomen-ag-insurance",
            "name": "Individueel Gewaarborgd inkomen AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-individueel-gewaarborgd-inkomen-allianz",
            "name": "Individueel Gewaarborgd inkomen ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-individueel-gewaarborgd-inkomen-baloise-insurance",
            "name": "Individueel Gewaarborgd inkomen BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-individueel-gewaarborgd-inkomen-kbc",
            "name": "Individueel Gewaarborgd inkomen KBC",
            "insurer": "KBC"
          }
        ]
      },
      {
        "id": "sub-individueel-gezondheidszorgen",
        "name": "Gezondheidszorgen",
        "templates": [
          {
            "id": "tpl-individueel-gezondheidszorgen-dkv-belgium",
            "name": "Individueel Gezondheidszorgen DKV Belgium",
            "insurer": "DKV Belgium"
          }
        ]
      },
      {
        "id": "sub-individueel-hospitalisatie",
        "name": "Hospitalisatie",
        "templates": [
          {
            "id": "tpl-individueel-hospitalisatie-ag-insurance",
            "name": "Individueel Hospitalisatie AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-individueel-hospitalisatie-axa",
            "name": "Individueel Hospitalisatie AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-individueel-hospitalisatie-baloise-insurance",
            "name": "Individueel Hospitalisatie BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-individueel-hospitalisatie-dkv-belgium",
            "name": "Individueel Hospitalisatie DKV Belgium",
            "insurer": "DKV Belgium"
          }
        ]
      },
      {
        "id": "sub-individueel-persoonlijke-ongevallen-algemeen",
        "name": "Persoonlijke Ongevallen algemeen",
        "templates": [
          {
            "id": "tpl-individueel-persoonlijke-ongevallen-algemeen-ag-insurance",
            "name": "Individueel Persoonlijke Ongevallen algemeen AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-individueel-persoonlijke-ongevallen-algemeen-axa",
            "name": "Individueel Persoonlijke Ongevallen algemeen AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-individueel-persoonlijke-ongevallen-algemeen-vivium",
            "name": "Individueel Persoonlijke Ongevallen algemeen VIVIUM",
            "insurer": "VIVIUM"
          }
        ]
      },
      {
        "id": "sub-individueel-verkeer-inzittenden",
        "name": "Verkeer & Inzittenden",
        "templates": [
          {
            "id": "tpl-individueel-verkeer-inzittenden-ag-insurance",
            "name": "Individueel Verkeer & Inzittenden AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-individueel-verkeer-inzittenden-allianz",
            "name": "Individueel Verkeer & Inzittenden ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-individueel-verkeer-inzittenden-axa",
            "name": "Individueel Verkeer & Inzittenden AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-individueel-verkeer-inzittenden-baloise-insurance",
            "name": "Individueel Verkeer & Inzittenden BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-leven-en-belegging",
    "name": "Leven en belegging",
    "subcategories": [
      {
        "id": "sub-leven-en-belegging-andere-verrichtingen-leven-takken-22-24-",
        "name": "Andere Verrichtingen Leven (Takken 22, 24-29)",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-andere-verrichtingen-leven-takken-22-24--credimo",
            "name": "Leven en belegging Andere Verrichtingen Leven (Takken 22, 24-29) Credimo",
            "insurer": "Credimo"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-bancaire-beleggingsproducten",
        "name": "Bancaire beleggingsproducten",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-bancaire-beleggingsproducten-allianz",
            "name": "Leven en belegging Bancaire beleggingsproducten ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-leven-en-belegging-bancaire-beleggingsproducten-baloise-insurance",
            "name": "Leven en belegging Bancaire beleggingsproducten BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-groep-zelfstandigen",
        "name": "Groep Zelfstandigen",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-groep-zelfstandigen-ag-insurance",
            "name": "Leven en belegging Groep Zelfstandigen AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-groep-zelfstandigen-ergo-life",
            "name": "Leven en belegging Groep Zelfstandigen Ergo Life",
            "insurer": "Ergo Life"
          },
          {
            "id": "tpl-leven-en-belegging-groep-zelfstandigen-nn-insurance-belgium",
            "name": "Leven en belegging Groep Zelfstandigen NN INSURANCE BELGIUM",
            "insurer": "NN INSURANCE BELGIUM"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-individueel-leven-meerdere-takken",
        "name": "Individueel Leven (Meerdere Takken)",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-afer-europe",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) AFER EUROPE",
            "insurer": "AFER EUROPE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-ag-insurance",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-allianz",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-axa",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-baloise-insurance",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-ergo-life",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) Ergo Life",
            "insurer": "Ergo Life"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-nn-insurance-belgium",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) NN INSURANCE BELGIUM",
            "insurer": "NN INSURANCE BELGIUM"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-meerdere-takken-vivium",
            "name": "Leven en belegging Individueel Leven (Meerdere Takken) VIVIUM",
            "insurer": "VIVIUM"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-individueel-leven-klassiek-tak-21",
        "name": "Individueel Leven Klassiek (Tak 21)",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-afer-europe",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) AFER EUROPE",
            "insurer": "AFER EUROPE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-ag-insurance",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-allianz",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-axa",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-baloise-insurance",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-baloise-ex-fidea",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) BALOISE(ex-Fidea)",
            "insurer": "BALOISE(ex-Fidea)"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-bnp-paribas",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) BNP PARIBAS",
            "insurer": "BNP PARIBAS"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-cardif",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) Cardif",
            "insurer": "Cardif"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-kbc",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) KBC",
            "insurer": "KBC"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-monument-assurance-belgium",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) Monument Assurance Belgium",
            "insurer": "Monument Assurance Belgium"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-nn-insurance-belgium",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) NN INSURANCE BELGIUM",
            "insurer": "NN INSURANCE BELGIUM"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-klassiek-tak-21-vivium",
            "name": "Leven en belegging Individueel Leven Klassiek (Tak 21) VIVIUM",
            "insurer": "VIVIUM"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-individueel-leven-i-v-m-beleggingsfondse",
        "name": "Individueel Leven i.v.m. Beleggingsfondsen (Tak 23)",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-individueel-leven-i-v-m-beleggingsfondse-afer-europe",
            "name": "Leven en belegging Individueel Leven i.v.m. Beleggingsfondsen (Tak 23) AFER EUROPE",
            "insurer": "AFER EUROPE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-i-v-m-beleggingsfondse-ag-insurance",
            "name": "Leven en belegging Individueel Leven i.v.m. Beleggingsfondsen (Tak 23) AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-i-v-m-beleggingsfondse-allianz",
            "name": "Leven en belegging Individueel Leven i.v.m. Beleggingsfondsen (Tak 23) ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-i-v-m-beleggingsfondse-baloise-insurance",
            "name": "Leven en belegging Individueel Leven i.v.m. Beleggingsfondsen (Tak 23) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-i-v-m-beleggingsfondse-nn-insurance-belgium",
            "name": "Leven en belegging Individueel Leven i.v.m. Beleggingsfondsen (Tak 23) NN INSURANCE BELGIUM",
            "insurer": "NN INSURANCE BELGIUM"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-i-v-m-beleggingsfondse-vivium",
            "name": "Leven en belegging Individueel Leven i.v.m. Beleggingsfondsen (Tak 23) VIVIUM",
            "insurer": "VIVIUM"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-individueel-leven-met-vrije-stortingen-t",
        "name": "Individueel Leven met vrije stortingen (Tak21-Universal Life",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-individueel-leven-met-vrije-stortingen-t-ag-insurance",
            "name": "Leven en belegging Individueel Leven met vrije stortingen (Tak21-Universal Life AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-met-vrije-stortingen-t-allianz",
            "name": "Leven en belegging Individueel Leven met vrije stortingen (Tak21-Universal Life ALLIANZ",
            "insurer": "ALLIANZ"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-met-vrije-stortingen-t-baloise-insurance",
            "name": "Leven en belegging Individueel Leven met vrije stortingen (Tak21-Universal Life BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-met-vrije-stortingen-t-baloise-ex-fidea",
            "name": "Leven en belegging Individueel Leven met vrije stortingen (Tak21-Universal Life BALOISE(ex-Fidea)",
            "insurer": "BALOISE(ex-Fidea)"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-met-vrije-stortingen-t-bnp-paribas",
            "name": "Leven en belegging Individueel Leven met vrije stortingen (Tak21-Universal Life BNP PARIBAS",
            "insurer": "BNP PARIBAS"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-met-vrije-stortingen-t-nn-insurance-belgium",
            "name": "Leven en belegging Individueel Leven met vrije stortingen (Tak21-Universal Life NN INSURANCE BELGIUM",
            "insurer": "NN INSURANCE BELGIUM"
          },
          {
            "id": "tpl-leven-en-belegging-individueel-leven-met-vrije-stortingen-t-vivium",
            "name": "Leven en belegging Individueel Leven met vrije stortingen (Tak21-Universal Life VIVIUM",
            "insurer": "VIVIUM"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-leven-collectief-tak-21",
        "name": "Leven Collectief (Tak 21)",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-leven-collectief-tak-21-ag-insurance",
            "name": "Leven en belegging Leven Collectief (Tak 21) AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-leven-collectief-tak-21-april-belgium",
            "name": "Leven en belegging Leven Collectief (Tak 21) April Belgium",
            "insurer": "April Belgium"
          },
          {
            "id": "tpl-leven-en-belegging-leven-collectief-tak-21-bnp-paribas",
            "name": "Leven en belegging Leven Collectief (Tak 21) BNP PARIBAS",
            "insurer": "BNP PARIBAS"
          },
          {
            "id": "tpl-leven-en-belegging-leven-collectief-tak-21-cardif",
            "name": "Leven en belegging Leven Collectief (Tak 21) Cardif",
            "insurer": "Cardif"
          },
          {
            "id": "tpl-leven-en-belegging-leven-collectief-tak-21-credimo",
            "name": "Leven en belegging Leven Collectief (Tak 21) Credimo",
            "insurer": "Credimo"
          },
          {
            "id": "tpl-leven-en-belegging-leven-collectief-tak-21-nn-insurance-belgium",
            "name": "Leven en belegging Leven Collectief (Tak 21) NN INSURANCE BELGIUM",
            "insurer": "NN INSURANCE BELGIUM"
          },
          {
            "id": "tpl-leven-en-belegging-leven-collectief-tak-21-patronale-life",
            "name": "Leven en belegging Leven Collectief (Tak 21) Patronale Life",
            "insurer": "Patronale Life"
          }
        ]
      },
      {
        "id": "sub-leven-en-belegging-leven-groep-loontrekkenden",
        "name": "Leven Groep loontrekkenden",
        "templates": [
          {
            "id": "tpl-leven-en-belegging-leven-groep-loontrekkenden-ag-insurance",
            "name": "Leven en belegging Leven Groep loontrekkenden AG INSURANCE",
            "insurer": "AG INSURANCE"
          },
          {
            "id": "tpl-leven-en-belegging-leven-groep-loontrekkenden-axa",
            "name": "Leven en belegging Leven Groep loontrekkenden AXA",
            "insurer": "AXA"
          },
          {
            "id": "tpl-leven-en-belegging-leven-groep-loontrekkenden-baloise-insurance",
            "name": "Leven en belegging Leven Groep loontrekkenden BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-multi-takken",
    "name": "Multi-takken",
    "subcategories": [
      {
        "id": "sub-multi-takken-gegroepeerde-polissen-ao-ba",
        "name": "Gegroepeerde Polissen AO, BA, ...",
        "templates": [
          {
            "id": "tpl-multi-takken-gegroepeerde-polissen-ao-ba-axa",
            "name": "Multi-takken Gegroepeerde Polissen AO, BA, ... AXA",
            "insurer": "AXA"
          }
        ]
      },
      {
        "id": "sub-multi-takken-gegroepeerde-gezinspolissen-brand-andere",
        "name": "Gegroepeerde gezinspolissen Brand + andere (BA Gezin, ...)",
        "templates": [
          {
            "id": "tpl-multi-takken-gegroepeerde-gezinspolissen-brand-andere-axa",
            "name": "Multi-takken Gegroepeerde gezinspolissen Brand + andere (BA Gezin, ...) AXA",
            "insurer": "AXA"
          }
        ]
      },
      {
        "id": "sub-multi-takken-multi-tak-handel-kleine-nijverheid-manue",
        "name": "Multi-tak (Handel, kleine nijverheid, Manuele Beroepen)",
        "templates": [
          {
            "id": "tpl-multi-takken-multi-tak-handel-kleine-nijverheid-manue-axa",
            "name": "Multi-takken Multi-tak (Handel, kleine nijverheid, Manuele Beroepen) AXA",
            "insurer": "AXA"
          }
        ]
      },
      {
        "id": "sub-multi-takken-multi-tak-particulieren",
        "name": "Multi-tak (Particulieren)",
        "templates": [
          {
            "id": "tpl-multi-takken-multi-tak-particulieren-allianz-partners",
            "name": "Multi-takken Multi-tak (Particulieren) ALLIANZ  PARTNERS",
            "insurer": "ALLIANZ  PARTNERS"
          },
          {
            "id": "tpl-multi-takken-multi-tak-particulieren-europ-assistance-belgium",
            "name": "Multi-takken Multi-tak (Particulieren) EUROP ASSISTANCE BELGIUM",
            "insurer": "EUROP ASSISTANCE BELGIUM"
          }
        ]
      },
      {
        "id": "sub-multi-takken-multiwaarborg-ba-particulier",
        "name": "Multiwaarborg BA particulier",
        "templates": [
          {
            "id": "tpl-multi-takken-multiwaarborg-ba-particulier-ag-insurance",
            "name": "Multi-takken Multiwaarborg BA particulier AG INSURANCE",
            "insurer": "AG INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-objectieve-aansprakelijkheid-en-van-onro",
    "name": "Objectieve aansprakelijkheid en van onroerende goederen",
    "subcategories": [
      {
        "id": "sub-objectieve-aansprakelijkheid-en-van-onro-objectieve-aansprakelijkheid-van-uitbate",
        "name": "Objectieve Aansprakelijkheid van uitbaters (wet 30/7/1979)",
        "templates": [
          {
            "id": "tpl-objectieve-aansprakelijkheid-en-van-onro-objectieve-aansprakelijkheid-van-uitbate-baloise-insurance",
            "name": "Objectieve aansprakelijkheid en van onroerende goederen Objectieve Aansprakelijkheid van uitbaters (wet 30/7/1979) BALOISE INSURANCE",
            "insurer": "BALOISE INSURANCE"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-rechtsbijstand",
    "name": "Rechtsbijstand",
    "subcategories": [
      {
        "id": "sub-rechtsbijstand-algemene-rechtsbijstand-multi-objecttype",
        "name": "Algemene rechtsbijstand (multi objecttype)",
        "templates": [
          {
            "id": "tpl-rechtsbijstand-algemene-rechtsbijstand-multi-objecttype-das",
            "name": "Rechtsbijstand Algemene rechtsbijstand (multi objecttype) DAS",
            "insurer": "DAS"
          },
          {
            "id": "tpl-rechtsbijstand-algemene-rechtsbijstand-multi-objecttype-euromex",
            "name": "Rechtsbijstand Algemene rechtsbijstand (multi objecttype) EUROMEX",
            "insurer": "EUROMEX"
          }
        ]
      },
      {
        "id": "sub-rechtsbijstand-rechtsbijstand-auto-voertuig",
        "name": "Rechtsbijstand Auto (Voertuig)",
        "templates": [
          {
            "id": "tpl-rechtsbijstand-rechtsbijstand-auto-voertuig-das",
            "name": "Rechtsbijstand Rechtsbijstand Auto (Voertuig) DAS",
            "insurer": "DAS"
          },
          {
            "id": "tpl-rechtsbijstand-rechtsbijstand-auto-voertuig-euromex",
            "name": "Rechtsbijstand Rechtsbijstand Auto (Voertuig) EUROMEX",
            "insurer": "EUROMEX"
          }
        ]
      },
      {
        "id": "sub-rechtsbijstand-rechtsbijstand-beroepsactiviteiten-ev-me",
        "name": "Rechtsbijstand Beroepsactiviteiten (ev met Auto)",
        "templates": [
          {
            "id": "tpl-rechtsbijstand-rechtsbijstand-beroepsactiviteiten-ev-me-protect-nv",
            "name": "Rechtsbijstand Rechtsbijstand Beroepsactiviteiten (ev met Auto) PROTECT NV",
            "insurer": "PROTECT NV"
          }
        ]
      },
      {
        "id": "sub-rechtsbijstand-rechtsbijstand-priv-leven-eventueel-met-",
        "name": "Rechtsbijstand PrivÃ©leven (eventueel met Auto)",
        "templates": [
          {
            "id": "tpl-rechtsbijstand-rechtsbijstand-priv-leven-eventueel-met--arag",
            "name": "Rechtsbijstand Rechtsbijstand PrivÃ©leven (eventueel met Auto) ARAG",
            "insurer": "ARAG"
          },
          {
            "id": "tpl-rechtsbijstand-rechtsbijstand-priv-leven-eventueel-met--das",
            "name": "Rechtsbijstand Rechtsbijstand PrivÃ©leven (eventueel met Auto) DAS",
            "insurer": "DAS"
          },
          {
            "id": "tpl-rechtsbijstand-rechtsbijstand-priv-leven-eventueel-met--euromex",
            "name": "Rechtsbijstand Rechtsbijstand PrivÃ©leven (eventueel met Auto) EUROMEX",
            "insurer": "EUROMEX"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-reis",
    "name": "Reis",
    "subcategories": [
      {
        "id": "sub-reis-reisverzekeringen",
        "name": "Reisverzekeringen",
        "templates": [
          {
            "id": "tpl-reis-reisverzekeringen-allianz-partners",
            "name": "Reis Reisverzekeringen ALLIANZ  PARTNERS",
            "insurer": "ALLIANZ  PARTNERS"
          },
          {
            "id": "tpl-reis-reisverzekeringen-assudis",
            "name": "Reis Reisverzekeringen ASSUDIS",
            "insurer": "ASSUDIS"
          },
          {
            "id": "tpl-reis-reisverzekeringen-europ-assistance-belgium",
            "name": "Reis Reisverzekeringen EUROP ASSISTANCE BELGIUM",
            "insurer": "EUROP ASSISTANCE BELGIUM"
          }
        ]
      }
    ]
  },
  {
    "id": "cat-transport-marine",
    "name": "Transport & marine",
    "subcategories": [
      {
        "id": "sub-transport-marine-ba-vervoerder-incl-cmr",
        "name": "BA Vervoerder (incl. CMR)",
        "templates": [
          {
            "id": "tpl-transport-marine-ba-vervoerder-incl-cmr-baloise-ex-fidea",
            "name": "Transport & marine BA Vervoerder (incl. CMR) BALOISE(ex-Fidea)",
            "insurer": "BALOISE(ex-Fidea)"
          }
        ]
      },
      {
        "id": "sub-transport-marine-verhuizingen",
        "name": "Verhuizingen",
        "templates": [
          {
            "id": "tpl-transport-marine-verhuizingen-baloise-ex-fidea",
            "name": "Transport & marine Verhuizingen BALOISE(ex-Fidea)",
            "insurer": "BALOISE(ex-Fidea)"
          }
        ]
      }
    ]
  }
];
