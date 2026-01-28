"use client"

// Shared reagent inventory - acts as the master inventory for the entire application
export interface MasterReagent {
  id: string
  name: string
  formula: string
  purchaseDate: string
  openDate: string | null
  currentVolume: string
  originalVolume: string
  density: string
  mass: string
  purity: string
  location: string
  status: "정상" | "부족" | "만료임박"
}

export const masterReagentInventory: MasterReagent[] = [
  {
    id: "H2SO4-001",
    name: "황산 #1",
    formula: "H₂SO₄",
    purchaseDate: "2025-12-15",
    openDate: "2026-01-10",
    currentVolume: "450ml",
    originalVolume: "500ml",
    density: "1.84 g/cm³",
    mass: "828g",
    purity: "98%",
    location: "캐비닛 A-01",
    status: "정상",
  },
  {
    id: "NaOH-001",
    name: "수산화나트륨 #1",
    formula: "NaOH",
    purchaseDate: "2025-11-20",
    openDate: "2025-12-05",
    currentVolume: "80ml",
    originalVolume: "500ml",
    density: "2.13 g/cm³",
    mass: "170g",
    purity: "99%",
    location: "캐비닛 A-02",
    status: "부족",
  },
  {
    id: "HCl-001",
    name: "염산 #1",
    formula: "HCl",
    purchaseDate: "2025-10-01",
    openDate: "2025-10-15",
    currentVolume: "200ml",
    originalVolume: "500ml",
    density: "1.19 g/cm³",
    mass: "238g",
    purity: "37%",
    location: "캐비닛 B-01",
    status: "만료임박",
  },
  {
    id: "CH3COOH-001",
    name: "아세트산 #1",
    formula: "CH₃COOH",
    purchaseDate: "2026-01-05",
    openDate: null,
    currentVolume: "500ml",
    originalVolume: "500ml",
    density: "1.05 g/cm³",
    mass: "525g",
    purity: "99.5%",
    location: "캐비닛 A-03",
    status: "정상",
  },
  {
    id: "H2SO4-002",
    name: "황산 #2",
    formula: "H₂SO₄",
    purchaseDate: "2026-01-20",
    openDate: null,
    currentVolume: "500ml",
    originalVolume: "500ml",
    density: "1.84 g/cm³",
    mass: "920g",
    purity: "98%",
    location: "캐비닛 A-01",
    status: "정상",
  },
  {
    id: "Zn-001",
    name: "아연 분말",
    formula: "Zn",
    purchaseDate: "2025-12-01",
    openDate: "2025-12-10",
    currentVolume: "100g",
    originalVolume: "250g",
    density: "7.14 g/cm³",
    mass: "100g",
    purity: "99.9%",
    location: "캐비닛 C-01",
    status: "정상",
  },
  {
    id: "NaCl-001",
    name: "염화나트륨",
    formula: "NaCl",
    purchaseDate: "2025-11-15",
    openDate: "2025-11-20",
    currentVolume: "450g",
    originalVolume: "500g",
    density: "2.16 g/cm³",
    mass: "450g",
    purity: "99.5%",
    location: "캐비닛 A-04",
    status: "정상",
  },
  {
    id: "HNO3-002",
    name: "질산 #2",
    formula: "HNO₃",
    purchaseDate: "2026-01-10",
    openDate: null,
    currentVolume: "500ml",
    originalVolume: "500ml",
    density: "1.51 g/cm³",
    mass: "755g",
    purity: "70%",
    location: "캐비닛 B-02",
    status: "정상",
  },
]

export const dosageUnits = ["ml", "L", "g", "mg", "kg", "μl"]
