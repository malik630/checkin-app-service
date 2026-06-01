/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  PRISMA SEED — Check-In Mobile App                                     ║
 * ║  Soutenance 2 juin 2026 — 15h20 (Alger, UTC+1)                        ║
 * ║                                                                        ║
 * ║  Placer dans : src/prisma/seed.ts                                      ║
 * ║  Lancer avec : npx prisma db seed                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ── Logique horaire ──────────────────────────────────────────────────────────
 *
 *  Référence démo : 02/06/2026 15h20 Alger = 14h20 UTC
 *
 *  Le cron passe CONFIRMED → CHECK_IN_OPEN quand departureTime <= now + 24h
 *  Le cron passe CHECK_IN_OPEN → PASSED quand checkinDeadline <= now
 *  Le cron passe tout le reste → PASSED quand departureTime < now
 *
 *  AH 1042  ALG→CDG   départ 02/06 16h00 UTC (17h00 Alger)
 *    checkinDeadline = départ - 45 min = 15h15 UTC → deadline DANS 55 min
 *    → CHECK_IN_OPEN au moment de la démo ✅  (vol pas encore parti ✅)
 *    → Fatma fait le check-in en LIVE (step ③)
 *    → Melliti co-passager du MÊME booking (step ③ suite)
 *
 *  AH 2056  ORN→LHR   départ 03/06 09h00 UTC (10h00 Alger)
 *    → Melliti a un booking CONFIRMED sur ce vol → step ⑥ (countdown ~18h40)
 *    → Youcef a également un booking CONFIRMED → pour enrichir la liste
 *
 *  AH 3099  ALG→IST   départ 01/06 07h00 UTC (hier matin)
 *    → vol déjà parti → status PASSED
 *    → Fatma a un booking PASSED avec passager CHECKED_IN + BP existant
 *    → affiché dans "Mes billets" de Fatma (step ②, badge gris/passé)
 *
 *  AH 4012  ALG→MRS   départ 30/05 19h00 UTC (il y a 3 jours)
 *    → vol passé → status PASSED (pour enrichir l'historique de Fatma)
 *
 *  AH 5088  ALG→FCO   départ 19/05 07h00 UTC (il y a 2 semaines)
 *    → vol passé → status PASSED (historique ancien)
 *
 * ── Comptes de test ──────────────────────────────────────────────────────────
 *
 *  Fatma   → fatma.djerfi@email.com    / Password123!   (email)
 *    uid fixe : user-fatma-001
 *    Bookings : FATMA1 (CHECK_IN_OPEN sur AH1042) + historique passé
 *
 *  Melliti → ma_melliti@esi.dz          (Google, uid Firebase réel)
 *    uid fixe : 108236858498477616912
 *    Bookings : co-passager de FATMA1 + MELLITI1 (CONFIRMED sur AH2056)
 *
 *  Youcef  → youcef.benali@email.com   / Password123!   (email)
 *    uid fixe : user-youcef-002
 *    Bookings : YOUCEF1 (CONFIRMED sur AH2056) — step ⑥
 *
 * ── Données passeport pour le scan OCR ──────────────────────────────────────
 *
 *  Fatma   : numéro 307840430  né 30/05/2004  exp 24/07/2029
 *  Melliti : numéro 196118578  né 25/12/2004  exp 22/01/2026
 */

import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database for demo (02/06/2026 15h20)...')

  // ── Cleanup ────────────────────────────────────────────────────────────────
  console.log('🗑️  Clearing tables...')
  await prisma.boardingPass.deleteMany()
  await prisma.checkInSession.deleteMany()
  await prisma.seatMap.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.passenger.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.flight.deleteMany()
  await prisma.preferences.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.deviceToken.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Tables cleared.')

  const passwordHash = await bcrypt.hash('Password123!', 12)

  // ══════════════════════════════════════════════════════════════════════════
  // UTILISATEURS
  // uid fixes pour correspondre aux vrais comptes Firebase/Google existants
  // ══════════════════════════════════════════════════════════════════════════

  const fatma = await prisma.user.create({
    data: {
      uid:          'user-fatma-001',
      email:        'fatma.djerfi@email.com',
      passwordHash,
      displayName:  'Djerfi Fatma',
      phoneNumber:  '+213 555 001 001',
      provider:     'email',
    },
  })

  // uid = ID Google réel de Melliti (conservé depuis la DB existante)
  const melliti = await prisma.user.create({
    data: {
      uid:          '108236858498477616912',
      email:        'ma_melliti@esi.dz',
      passwordHash: 'GOOGLE_AUTH_NO_PASSWORD',   // champ non-nullable dans le schéma
      displayName:  'MELLITI ABDELMALEK',
      provider:     'google',
    },
  })

  const youcef = await prisma.user.create({
    data: {
      uid:         'user-youcef-002',
      email:       'youcef.benali@email.com',
      passwordHash,
      displayName: 'Benali Youcef',
      phoneNumber: '+213 555 002 002',
      provider:    'email',
    },
  })

  console.log('✅ 3 users created.')

  // ══════════════════════════════════════════════════════════════════════════
  // VOLS
  // Toutes les heures en UTC. Alger été = UTC+1.
  // boardingTime et checkInOpensTime sont des String dans le schéma (ex: "07:50")
  // ══════════════════════════════════════════════════════════════════════════

  /*
   * AH 1042  ALG → CDG
   * Départ : 02/06 16h00 UTC = 17h00 Alger
   * Vol dans ~1h40 à la démo → check-in OUVERT ✅, vol pas encore parti ✅
   * checkinDeadline = départ - 45 min = 15h15 UTC → dans ~55 min
   */
  const flight1 = await prisma.flight.create({
    data: {
      flightId:        'flight-ah1042-001',
      flightNumber:    'AH 1042',
      origin:          'ALG',
      originCity:      'Algiers',
      destination:     'CDG',
      destinationCity: 'Paris',
      departureTime:   new Date('2026-06-02T16:00:00Z'),
      arrivalTime:     new Date('2026-06-02T19:00:00Z'),
      aircraftType:    'Boeing 737-800',
      status:          'Scheduled',
      gate:            'A12',
      terminal:        'T1',
      boardingTime:    '16:20',       // 16h20 UTC = 17h20 Alger
      checkInOpensTime: '16:00',      // heure locale affichée (string)
    },
  })

  /*
   * AH 2056  ORN → LHR
   * Départ : 03/06 09h00 UTC = 10h00 Alger
   * À 14h20 UTC le 02/06 : départ dans ~18h40 → CONFIRMED (cron n'a pas encore ouvert)
   * → badge CONFIRMED + countdown ~18h40 pour Melliti et Youcef (step ⑥)
   */
  const flight2 = await prisma.flight.create({
    data: {
      flightId:        'flight-ah2056-002',
      flightNumber:    'AH 2056',
      origin:          'ORN',
      originCity:      'Oran',
      destination:     'LHR',
      destinationCity: 'London',
      departureTime:   new Date('2026-06-03T09:00:00Z'),
      arrivalTime:     new Date('2026-06-03T12:30:00Z'),
      aircraftType:    'Airbus A330-200',
      status:          'Scheduled',
      gate:            'B06',
      terminal:        'T2',
      boardingTime:    '08:30',
      checkInOpensTime: '07:15',
    },
  })

  /*
   * AH 3099  ALG → IST
   * Départ : 01/06 07h00 UTC = 08h00 Alger (hier matin)
   * Vol déjà parti → status PASSED
   * Fatma avait un booking CHECK_IN_OPEN, Melliti aussi — boarding passes émis
   * → affiché dans "Mes billets" de Fatma (step ②) et Melliti (step ④)
   */
  const flight3 = await prisma.flight.create({
    data: {
      flightId:        'flight-ah3099-003',
      flightNumber:    'AH 3099',
      origin:          'ALG',
      originCity:      'Algiers',
      destination:     'IST',
      destinationCity: 'Istanbul',
      departureTime:   new Date('2026-06-01T07:00:00Z'),
      arrivalTime:     new Date('2026-06-01T11:00:00Z'),
      aircraftType:    'Boeing 777-300ER',
      status:          'Scheduled',
      gate:            'C03',
      terminal:        'T3',
      boardingTime:    '13:15',
      checkInOpensTime: '11:00',
    },
  })

  /*
   * AH 4012  ALG → MRS
   * Départ : 30/05 19h00 UTC (il y a ~3 jours) → PASSED
   */
  const flight4 = await prisma.flight.create({
    data: {
      flightId:        'flight-ah4012-004',
      flightNumber:    'AH 4012',
      origin:          'ALG',
      originCity:      'Algiers',
      destination:     'MRS',
      destinationCity: 'Marseille',
      departureTime:   new Date('2026-05-30T19:00:00Z'),
      arrivalTime:     new Date('2026-05-30T21:30:00Z'),
      aircraftType:    'Airbus A320',
      status:          'Scheduled',
      gate:            'A02',
      terminal:        'T1',
      boardingTime:    '15:00',
      checkInOpensTime: '12:45',
    },
  })

  /*
   * AH 5088  ALG → FCO
   * Départ : 19/05 07h00 UTC (il y a ~2 semaines) → PASSED (historique ancien)
   */
  const flight5 = await prisma.flight.create({
    data: {
      flightId:        'flight-ah5088-005',
      flightNumber:    'AH 5088',
      origin:          'ALG',
      originCity:      'Algiers',
      destination:     'FCO',
      destinationCity: 'Rome',
      departureTime:   new Date('2026-05-19T07:00:00Z'),
      arrivalTime:     new Date('2026-05-19T09:00:00Z'),
      aircraftType:    'Boeing 737-800',
      status:          'Scheduled',
      gate:            'D01',
      terminal:        'T2',
      boardingTime:    '18:00',
      checkInOpensTime: '15:45',
    },
  })

  console.log('✅ 5 flights created.')

  // ══════════════════════════════════════════════════════════════════════════
  // RÉSERVATIONS
  // Statuts réels du backend : CONFIRMED | CHECK_IN_OPEN | CHECKED_IN | PASSED
  // ══════════════════════════════════════════════════════════════════════════

  /*
   * FATMA1 — AH1042 — titulaire : Fatma
   * CHECK_IN_OPEN → bouton "Check-in" visible dans l'app
   * checkinDeadline = départ - 45 min = 15h15 UTC (dans ~55 min à la démo)
   * Passagers : Fatma (PENDING) + Melliti co-passager (PENDING) → check-in en LIVE
   */
  const booking1 = await prisma.booking.create({
    data: {
      bookingId:       'booking-fatma-001',
      uid:             fatma.uid,
      flightId:        flight1.flightId,
      pnr:             'FATMA1',
      lastName:        'Djerfi',
      bookingRef:      'FATMA1',
      status:          'CHECK_IN_OPEN',
      checkinDeadline: new Date('2026-06-02T15:15:00Z'),
    },
  })

  /*
   * FATMA3 — AH3099 — Fatma (vol passé, BP existant)
   * Affiché dans "Mes billets" avec badge passé
   * La session est COMPLETED, le passager est CHECKED_IN
   */
  const booking2 = await prisma.booking.create({
    data: {
      bookingId:       'booking-fatma-003',
      uid:             fatma.uid,
      flightId:        flight3.flightId,
      pnr:             'FATMA3',
      lastName:        'Djerfi',
      bookingRef:      'FATMA3',
      status:          'PASSED',
      checkinDeadline: new Date('2026-06-01T06:15:00Z'),
    },
  })

  /*
   * FATMA4 — AH4012 — Fatma (vol passé il y a 3 jours)
   */
  const booking3 = await prisma.booking.create({
    data: {
      bookingId:       'booking-fatma-004',
      uid:             fatma.uid,
      flightId:        flight4.flightId,
      pnr:             'FATMA4',
      lastName:        'Djerfi',
      bookingRef:      'FATMA4',
      status:          'PASSED',
      checkinDeadline: new Date('2026-05-30T18:15:00Z'),
    },
  })

  /*
   * FATMA5 — AH5088 — Fatma (vol passé il y a 2 semaines)
   */
  const booking4 = await prisma.booking.create({
    data: {
      bookingId:       'booking-fatma-005',
      uid:             fatma.uid,
      flightId:        flight5.flightId,
      pnr:             'FATMA5',
      lastName:        'Djerfi',
      bookingRef:      'FATMA5',
      status:          'PASSED',
      checkinDeadline: new Date('2026-05-19T06:15:00Z'),
    },
  })

  /*
   * MELLITI1 — AH2056 — Melliti (vol demain, CONFIRMED → countdown step ⑥)
   * checkinDeadline = départ - 45 min = 08h15 UTC le 03/06
   */
  const booking5 = await prisma.booking.create({
    data: {
      bookingId:       'booking-melliti-002',
      uid:             melliti.uid,
      flightId:        flight2.flightId,
      pnr:             'MELLITI1',
      lastName:        'MELLITI',
      bookingRef:      'MELLITI1',
      status:          'CONFIRMED',
      checkinDeadline: new Date('2026-06-03T08:15:00Z'),
    },
  })

  /*
   * MELLITI3 — AH3099 — Melliti (vol passé, BP existant)
   * Affiché dans "Mes billets" de Melliti
   */
  const booking6 = await prisma.booking.create({
    data: {
      bookingId:       'booking-melliti-003',
      uid:             melliti.uid,
      flightId:        flight3.flightId,
      pnr:             'MELLITI3',
      lastName:        'MELLITI',
      bookingRef:      'MELLITI3',
      status:          'PASSED',
      checkinDeadline: new Date('2026-06-01T06:15:00Z'),
    },
  })

  /*
   * YOUCEF1 — AH2056 — Youcef (vol demain, CONFIRMED)
   * Même vol qu'MELLITI1 — pour step ⑥ avec Youcef
   */
  const booking7 = await prisma.booking.create({
    data: {
      bookingId:       'booking-youcef-001',
      uid:             youcef.uid,
      flightId:        flight2.flightId,
      pnr:             'YOUCEF1',
      lastName:        'Benali',
      bookingRef:      'YOUCEF1',
      status:          'CONFIRMED',
      checkinDeadline: new Date('2026-06-03T08:15:00Z'),
    },
  })

  console.log('✅ 7 bookings created.')

  // ══════════════════════════════════════════════════════════════════════════
  // PASSAGERS
  // dateOfBirth et expiryDate sont des String dans le schéma (format YYYY-MM-DD)
  // ══════════════════════════════════════════════════════════════════════════

  // booking1 (FATMA1 / AH1042) — Fatma PENDING (check-in en LIVE step ③)
  const pax_fatma_ah1042 = await prisma.passenger.create({
    data: {
      passengerId:    'passenger-fatma-001',
      bookingId:      booking1.bookingId,
      firstName:      'Fatma',
      lastName:       'Djerfi',
      passportNumber: '307840430',
      nationality:    'Algerian',
      dateOfBirth:    '2004-05-30',
      expiryDate:     '2029-07-24',
      seatNumber:     null,
      checkinStatus:  'PENDING',
    },
  })

  // booking1 (FATMA1 / AH1042) — Melliti PENDING co-passager (step ③ suite)
  // NB : le booking appartient à Fatma (uid = fatma), mais Melliti est passager
  const pax_melliti_ah1042 = await prisma.passenger.create({
    data: {
      passengerId:    'passenger-melliti-001',
      bookingId:      booking1.bookingId,
      firstName:      'Abdelmalek',
      lastName:       'MELLITI',
      passportNumber: '196118578',
      nationality:    'Algerian',
      dateOfBirth:    '2004-12-25',
      expiryDate:     '2026-01-22',
      seatNumber:     '8A',           // siège pré-assigné visible sur le plan
      checkinStatus:  'PENDING',
    },
  })

  // booking2 (FATMA3 / AH3099) — Fatma CHECKED_IN (vol passé, BP existant)
  const pax_fatma_ah3099 = await prisma.passenger.create({
    data: {
      passengerId:    'passenger-fatma-003',
      bookingId:      booking2.bookingId,
      firstName:      'Fatma',
      lastName:       'Djerfi',
      passportNumber: '307840430',
      nationality:    'Algerian',
      dateOfBirth:    '2004-05-30',
      expiryDate:     '2029-07-24',
      seatNumber:     '12A',
      checkinStatus:  'CHECKED_IN',
    },
  })

  // booking3 (FATMA4 / AH4012) — Fatma CHECKED_IN (vol passé)
  const pax_fatma_ah4012 = await prisma.passenger.create({
    data: {
      passengerId:    'passenger-fatma-004',
      bookingId:      booking3.bookingId,
      firstName:      'Fatma',
      lastName:       'Djerfi',
      passportNumber: '307840430',
      nationality:    'Algerian',
      dateOfBirth:    '2004-05-30',
      expiryDate:     '2029-07-24',
      seatNumber:     '14C',
      checkinStatus:  'CHECKED_IN',
    },
  })

  // booking4 (FATMA5 / AH5088) — Fatma PENDING (passé sans check-in complété)
  await prisma.passenger.create({
    data: {
      passengerId:    'passenger-fatma-005',
      bookingId:      booking4.bookingId,
      firstName:      'Fatma',
      lastName:       'Djerfi',
      passportNumber: '307840430',
      nationality:    'Algerian',
      dateOfBirth:    '2004-05-30',
      expiryDate:     '2029-07-24',
      seatNumber:     null,
      checkinStatus:  'PENDING',
    },
  })

  // booking5 (MELLITI1 / AH2056) — Melliti PENDING (CONFIRMED, pas encore checké)
  await prisma.passenger.create({
    data: {
      passengerId:    'passenger-melliti-002',
      bookingId:      booking5.bookingId,
      firstName:      'Abdelmalek',
      lastName:       'MELLITI',
      passportNumber: '196118578',
      nationality:    'Algerian',
      dateOfBirth:    '2004-12-25',
      expiryDate:     '2026-01-22',
      seatNumber:     null,
      checkinStatus:  'PENDING',
    },
  })

  // booking6 (MELLITI3 / AH3099) — Melliti CHECKED_IN (vol passé, BP existant)
  const pax_melliti_ah3099 = await prisma.passenger.create({
    data: {
      passengerId:    'passenger-melliti-003',
      bookingId:      booking6.bookingId,
      firstName:      'Abdelmalek',
      lastName:       'MELLITI',
      passportNumber: '196118578',
      nationality:    'Algerian',
      dateOfBirth:    '2004-12-25',
      expiryDate:     '2026-01-22',
      seatNumber:     '3D',
      checkinStatus:  'CHECKED_IN',
    },
  })

  // booking7 (YOUCEF1 / AH2056) — Youcef PENDING (CONFIRMED, pas encore checké)
  await prisma.passenger.create({
    data: {
      passengerId:    'passenger-youcef-001',
      bookingId:      booking7.bookingId,
      firstName:      'Youcef',
      lastName:       'Benali',
      passportNumber: '512345678',
      nationality:    'Algerian',
      dateOfBirth:    '2001-08-12',
      expiryDate:     '2030-03-15',
      seatNumber:     null,
      checkinStatus:  'PENDING',
    },
  })

  console.log('✅ 8 passengers created.')

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK-IN SESSIONS (uniquement pour les passagers déjà CHECKED_IN)
  // Les sessions des passagers PENDING seront créées EN LIVE pendant la démo
  // ══════════════════════════════════════════════════════════════════════════

  // Session Fatma sur AH3099 (COMPLETED hier)
  const session_fatma_ah3099 = await prisma.checkInSession.create({
    data: {
      sessionId:            'session-fatma-003',
      passengerId:          pax_fatma_ah3099.passengerId,
      uid:                  fatma.uid,
      currentStep:          'COMPLETED',
      checkedBaggageCount:  1,
      specialEquipmentCount: 0,
      completedAt:          new Date('2026-05-31T07:05:00Z'),
    },
  })

  // Lier la session au booking
  await prisma.booking.update({
    where: { bookingId: booking2.bookingId },
    data:  { checkinSessionId: session_fatma_ah3099.sessionId },
  })

  // Session Melliti sur AH3099 (COMPLETED hier)
  const session_melliti_ah3099 = await prisma.checkInSession.create({
    data: {
      sessionId:            'session-melliti-003',
      passengerId:          pax_melliti_ah3099.passengerId,
      uid:                  melliti.uid,
      currentStep:          'COMPLETED',
      checkedBaggageCount:  1,
      specialEquipmentCount: 0,
      completedAt:          new Date('2026-05-31T07:10:00Z'),
    },
  })

  await prisma.booking.update({
    where: { bookingId: booking6.bookingId },
    data:  { checkinSessionId: session_melliti_ah3099.sessionId },
  })

  console.log('✅ 2 check-in sessions created.')

  // ══════════════════════════════════════════════════════════════════════════
  // BOARDING PASSES (vol AH3099 — vols passés)
  // AH1042 : aucun BP seedé → créés en LIVE pendant la démo step ③
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.boardingPass.create({
    data: {
      passId:       'BP-passenger-fatma-003',
      passengerId:  pax_fatma_ah3099.passengerId,
      uid:          fatma.uid,
      flightId:     flight3.flightId,
      qrCode:       'CHECKIN_PASS:BP-passenger-fatma-003',
      seatNumber:   '12A',
      gate:         'C03',
      boardingTime: '13:15',
      terminal:     'T3',
      issuedAt:     new Date('2026-05-31T07:05:00Z'),
    },
  })

  await prisma.boardingPass.create({
    data: {
      passId:       'BP-passenger-melliti-003',
      passengerId:  pax_melliti_ah3099.passengerId,
      uid:          melliti.uid,
      flightId:     flight3.flightId,
      qrCode:       'CHECKIN_PASS:BP-passenger-melliti-003',
      seatNumber:   '3D',
      gate:         'C03',
      boardingTime: '13:15',
      terminal:     'T3',
      issuedAt:     new Date('2026-05-31T07:10:00Z'),
    },
  })

  console.log('✅ 2 boarding passes created.')

  // ══════════════════════════════════════════════════════════════════════════
  // SEAT MAP
  // Structure identique à l'existant :
  //   Business : rangées 1–3, colonnes A B C D (12 sièges, isPremium = true)
  //   Economy  : rangées 4–15, colonnes A B C D E F (72 sièges)
  //   Total : 84 sièges par vol
  //
  // AH1042 : siège 8A = occupé par passenger-melliti-001 (Melliti, mentionné step ③)
  //          siège 10C = disponible (Fatma le sélectionne en LIVE)
  // ══════════════════════════════════════════════════════════════════════════

  const allFlightIds = [
    flight1.flightId,
    flight2.flightId,
    flight3.flightId,
    flight4.flightId,
    flight5.flightId,
  ]

  for (const fId of allFlightIds) {
    const seats = [
      // Business : rangées 1-3, colonnes A B C D
      ...['A', 'B', 'C', 'D'].flatMap(col =>
        [1, 2, 3].map(row => ({
          seatId:      `seat-${fId}-${row}${col}`,
          flightId:    fId,
          seatNumber:  `${row}${col}`,
          seatClass:   'Business',
          isAvailable: true,
          isPremium:   true,
          occupiedBy:  null as string | null,
        }))
      ),
      // Economy : rangées 4-15, colonnes A B C D E F
      ...['A', 'B', 'C', 'D', 'E', 'F'].flatMap(col =>
        Array.from({ length: 12 }, (_, i) => i + 4).map(row => ({
          seatId:      `seat-${fId}-${row}${col}`,
          flightId:    fId,
          seatNumber:  `${row}${col}`,
          seatClass:   'Economy',
          isAvailable: true,
          isPremium:   false,
          occupiedBy:  null as string | null,
        }))
      ),
    ]

    // AH1042 : marquer 8A comme occupé par Melliti
    if (fId === flight1.flightId) {
      const seat8A = seats.find(s => s.seatNumber === '8A')
      if (seat8A) {
        seat8A.isAvailable = false
        seat8A.occupiedBy  = pax_melliti_ah1042.passengerId
      }
    }

    // AH3099 : marquer 12A et 3D comme occupés (vols passés)
    if (fId === flight3.flightId) {
      const seat12A = seats.find(s => s.seatNumber === '12A')
      if (seat12A) { seat12A.isAvailable = false; seat12A.occupiedBy = pax_fatma_ah3099.passengerId }
      const seat3D = seats.find(s => s.seatNumber === '3D')
      if (seat3D)  { seat3D.isAvailable = false;  seat3D.occupiedBy  = pax_melliti_ah3099.passengerId }
    }

    // AH4012 : marquer 14C comme occupé (vol passé)
    if (fId === flight4.flightId) {
      const seat14C = seats.find(s => s.seatNumber === '14C')
      if (seat14C) { seat14C.isAvailable = false; seat14C.occupiedBy = pax_fatma_ah4012.passengerId }
    }

    await prisma.seatMap.createMany({ data: seats })
  }

  console.log('✅ Seat maps created (84 seats × 5 flights).')

  // ══════════════════════════════════════════════════════════════════════════
  // PREFERENCES
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.preferences.create({
    data: {
      uid:                   fatma.uid,
      preferredSoutien:      true,
      preferredVisualsAudit: false,
      preferredChildCare:    true,
      preferredPetCare:      false,
      mealPreference:        true,
    },
  })

  await prisma.preferences.create({
    data: {
      uid:                   melliti.uid,
      preferredSoutien:      true,
      preferredVisualsAudit: true,
      preferredChildCare:    true,
      preferredPetCare:      false,
      mealPreference:        true,
    },
  })

  console.log('✅ Preferences created.')

  // ══════════════════════════════════════════════════════════════════════════
  // RÉSUMÉ
  // ══════════════════════════════════════════════════════════════════════════

  console.log('')
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║       ✅  SEED TERMINÉ — PRÊT POUR LA DÉMO 15h20            ║')
  console.log('╠═══════════════════════════════════════════════════════════════╣')
  console.log('║ 👤 Fatma   fatma.djerfi@email.com   / Password123!           ║')
  console.log('║    → FATMA1 sur AH 1042 ALG→CDG  [CHECK_IN_OPEN]  step ③   ║')
  console.log('║    → FATMA3 sur AH 3099 ALG→IST  [PASSED + BP]    step ②   ║')
  console.log('╠═══════════════════════════════════════════════════════════════╣')
  console.log('║ 👤 Melliti ma_melliti@esi.dz         / Google                ║')
  console.log('║    → co-passager FATMA1 AH 1042     [PENDING]      step ③   ║')
  console.log('║    → MELLITI1 AH 2056 ORN→LHR       [CONFIRMED]    step ⑥  ║')
  console.log('║    → MELLITI3 AH 3099 ALG→IST       [PASSED + BP]  step ④  ║')
  console.log('╠═══════════════════════════════════════════════════════════════╣')
  console.log('║ 👤 Youcef  youcef.benali@email.com  / Password123!           ║')
  console.log('║    → YOUCEF1 sur AH 2056 ORN→LHR   [CONFIRMED]    step ⑥   ║')
  console.log('╠═══════════════════════════════════════════════════════════════╣')
  console.log('║ ✈️  AH 1042 départ 17h00 Alger  →  check-in ferme à 16h15   ║')
  console.log('║ ✈️  AH 2056 départ demain 10h00 →  CONFIRMED ~18h40          ║')
  console.log('╠═══════════════════════════════════════════════════════════════╣')
  console.log('║ 🪑 Siège 8A = OCCUPÉ (Melliti)   10C = LIBRE (sélection live)║')
  console.log('║ 🛂 Fatma   passport 307840430  exp 2029-07-24                ║')
  console.log('║ 🛂 Melliti passport 196118578  exp 2026-01-22                ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())