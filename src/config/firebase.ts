import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import admin from 'firebase-admin'

function getServiceAccount(): admin.ServiceAccount {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (rawJson) {
    return JSON.parse(rawJson) as admin.ServiceAccount
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : resolve(process.cwd(), 'src', 'config', 'firebase-key.json')

  return JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as admin.ServiceAccount
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  })
}

export default admin
