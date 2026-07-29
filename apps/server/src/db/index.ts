import { S3_BASE_PATH } from '../config'
import { getS3File, putS3File } from '../s3'

const hanziData: Record<string, any> = {}
const readingLogsData: Record<string, any> = {}

function getKey(filename: string) {
  const p = S3_BASE_PATH ? `${S3_BASE_PATH}/db/${filename}` : `db/${filename}`
  // eslint-disable-next-line e18e/prefer-static-regex
  return p.replace(/^\/+/, '')
}

export async function loadDb() {
  const hanziBuf = await getS3File(getKey('hanzi.json'))
  if (hanziBuf) {
    const list = JSON.parse(hanziBuf.toString('utf-8'))
    for (const item of list) {
      hanziData[item.char] = item
    }
  }

  const logsBuf = await getS3File(getKey('reading_logs.json'))
  if (logsBuf) {
    const list = JSON.parse(logsBuf.toString('utf-8'))
    for (const item of list) {
      readingLogsData[`${item.vault_id}:${item.identifier}:${item.path}`] = item
    }
  }
  // eslint-disable-next-line no-console
  console.log(`🗄️ Database loaded from S3`)
}

export async function saveHanziDb() {
  await putS3File(getKey('hanzi.json'), JSON.stringify(Object.values(hanziData)), 'application/json')
}

export async function saveLogsDb() {
  await putS3File(getKey('reading_logs.json'), JSON.stringify(Object.values(readingLogsData)), 'application/json')
}

export const db = {
  get hanzi() { return hanziData },
  get logs() { return readingLogsData },
  saveHanziDb,
  saveLogsDb,
  loadDb,
}
