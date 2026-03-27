import fs from 'fs';
import readline from 'readline';
import path from 'path';

const INPUT_FILE = 'cedict_ts.u8'; // Имя скачанного файла
const OUTPUT_FILE = 'cedict.json'; // Имя готового JSON-файла

async function processDictionary() {
  const inputPath = path.resolve(process.cwd(), INPUT_FILE);
  const outputPath = path.resolve(process.cwd(), 'src/assets', OUTPUT_FILE); 

  if (!fs.existsSync(inputPath)) {
    console.error(`Ошибка: Файл словаря "${INPUT_FILE}" не найден.`);
    console.log(`Пожалуйста, скачайте его с https://www.mdbg.net/chinese/dictionary?page=cedict и поместите рядом со скриптом.`);
    return;
  }

  console.log(`Начинаю обработку файла: ${inputPath}`);

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const dictionary = {};
  let lineCount = 0;

  const lineRegex = /^(\S+)\s+(\S+)\s+\[(.*?)\]\s+\/(.*)\//;

  for await (const line of rl) {
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }

    const match = line.match(lineRegex);
    if (match) {
      const traditional = match[1];
      const simplified = match[2];
      const pinyin = match[3];
      const definition = match[4].replace(/\//g, '; ');

      dictionary[simplified] = {
        pinyin,
        definition,
      };
      lineCount++;
    }
  }
  
  console.log(`Обработано ${lineCount} словарных статей.`);

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Сохраняю JSON в файл: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));

  console.log('Готово! Словарь успешно сконвертирован.');
}

processDictionary().catch(console.error);
