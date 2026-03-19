import { exec } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function runDeploy(user: string, host: string, remotePath: string, outputBaseDir: string) {
  console.log(`\n🚢 Начинаем деплой на ${user}@${host}:${remotePath}...`)

  const absoluteOutputDir = path.resolve(process.cwd(), outputBaseDir)
  const tarballName = 'payload.tar.gz'

  try {
    console.log('-> Подготовка директорий на сервере...')
    await execAsync(`ssh ${user}@${host} 'mkdir -p ${remotePath}'`)

    console.log('-> Создание архива payload.tar.gz...')
    await execAsync(`cd ${absoluteOutputDir} && tar -czf ${tarballName} content meta`)

    console.log('-> Отправка архива на сервер...')
    const localTarPath = path.join(absoluteOutputDir, tarballName)
    await execAsync(`scp ${localTarPath} ${user}@${host}:${remotePath}/`)

    console.log('-> Распаковка архива на сервере...')
    await execAsync(`ssh ${user}@${host} 'cd ${remotePath} && tar -xzf ${tarballName} && rm ${tarballName}'`)

    await execAsync(`rm ${localTarPath}`)
    console.log('✅ Деплой успешно завершен!')
  }
  catch (error: any) {
    console.error('❌ Ошибка во время деплоя:', error.message)
    throw error
  }
}
