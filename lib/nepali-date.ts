import NepaliDate from "nepali-date-converter"

export function adToBs(adDate: string | Date | null | undefined): string {
  if (!adDate) return ""
  const d = typeof adDate === "string" ? new Date(adDate) : adDate
  if (isNaN(d.getTime())) return ""
  try {
    return new NepaliDate(d).format("YYYY/MM/DD")
  } catch {
    return ""
  }
}

// Nepali (BS) month index, 0 = Baishakh ... 11 = Chaitra
export function bsMonthIndex(adDate: string | Date | null | undefined): number | null {
  if (!adDate) return null
  const d = typeof adDate === "string" ? new Date(adDate) : adDate
  if (isNaN(d.getTime())) return null
  try {
    return new NepaliDate(d).getMonth()
  } catch {
    return null
  }
}

export const nepaliMonths = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
  "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra",
]
