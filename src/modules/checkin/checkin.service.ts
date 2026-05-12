import prisma from '../../prisma/client.js'

/**
 * Verifies a passport against the DB passenger records.
 * Matches on passportNumber + lastName (case-insensitive).
 * Returns the full passenger row if found, null otherwise.
 */
/**
 * Normalizes various date formats to YYYY-MM for fuzzy matching.
 * Handles: "2004-05-30", "30 MAI 2004", "MAI 2004", etc.
 */
const normalizeDate = (dateStr: string): string => {
  const clean = dateStr.toUpperCase().trim()
  
  // Try YYYY-MM-DD
  const isoMatch = clean.match(/(\d{4})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`

  // Try DD MONTH YYYY or MONTH YYYY
  const months: { [key: string]: string } = {
    JAN: '01', FEB: '02', FEV: '02', MAR: '03', APR: '04', AVR: '04', 
    MAY: '05', MAI: '05', JUN: '06', JUIN: '06', JUL: '07', JUIL: '07',
    AUG: '08', AOUT: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
  }

  const yearMatch = clean.match(/\d{4}/)
  const monthMatch = Object.keys(months).find(m => clean.includes(m))
  
  if (yearMatch && monthMatch) {
    return `${yearMatch[0]}-${months[monthMatch]}`
  }

  return clean // Fallback to raw string
}

export const verifyPassport = async (
  passportNumber: string,
  lastName: string,
  firstName?: string,
  nationality?: string,
  dateOfBirth?: string,
  expiryDate?: string
) => {
  const normalizedDob = dateOfBirth ? normalizeDate(dateOfBirth) : null
  const normalizedExpiry = expiryDate ? normalizeDate(expiryDate) : null

  console.log('--- VERIFYING PASSPORT ---')
  console.log('Passport:', passportNumber)
  console.log('Last Name:', lastName)
  console.log('Normalized DOB:', normalizedDob)
  console.log('Normalized Expiry:', normalizedExpiry)

  // Core search: ONLY Passport Number + Last Name
  const passenger = await prisma.passenger.findFirst({
    where: {
      passportNumber: {
        equals: passportNumber.trim(),
        mode: 'insensitive',
      },
      lastName: {
        equals: lastName.trim(),
        mode: 'insensitive',
      }
    },
  })

  if (!passenger) {
    console.log('Result: PASSENGER NOT FOUND (Checked Passport + LastName only)')
  } else {
    console.log('Result: FOUND PASSENGER', passenger.firstName, passenger.lastName)
  }

  return passenger
}
