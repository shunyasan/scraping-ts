import puppeteer, { ElementHandle } from "puppeteer";
import fs from "fs";

// クラス名からtextContentを取得
const getTextContentFromClassName = async (
  page: ElementHandle<Element>,
  className: string
): Promise<string> => {
  return await page.$eval(className, (element) => {
    const content = element.textContent;
    if (!content) {
      throw Error("取得できませんでした");
    }
    return content;
  });
};

// 余計な空白を削除して区切り位置より後の要素を取得
const formatElement = (value: string, delimiter: string): string => {
  // スペースをなくして指定の区切り位置で区切る
  const formatted = value.replace(/[ 　]/g, "").split(`${delimiter}\n`);
  // 改行をカンマに置換
  const replaced = formatted[1].replace(/\n/g, ",");
  // 最後にカンマがあれば削る
  if (replaced.slice(-1) === ",") {
    return replaced.slice(0, -1);
  }
  return replaced;
};

// ファイルにCSVデータを書き込む
const OutputAsCsv = (data: string) => {
  const filePath = "output.csv";
  try {
    fs.writeFileSync(filePath, data, "utf-8");
    console.log("ファイルへ出力完了");
  } catch (err) {
    console.error("ファイルの書き込みエラー:", err);
  }
};

const main = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const scrapingSite = (target: string) =>
    `https://takarakuji.rakuten.co.jp/backnumber/loto7/${target}/`;
  const targetList = [
    "202301",
    "202302",
    "202303",
    "202304",
    "202305",
    "202306",
    "202307",
    "202308",
    "202309",
    "202310",
    "202311",
    "202312",
  ];
  let csvData = "抽選日,1列目,2列目,3列目,4列目,5列目,6列目,7列目\n";

  for await (const target of targetList) {
    await page.goto(scrapingSite(target), { waitUntil: "networkidle0" });
    await page.waitForSelector("#main");

    const tableName = ".tblType02";
    const winningNumberName = ".evenLine";
    const LotteryDayName = "tr:nth-child(2)";

    const findElements = await page.$$(tableName);

    for await (const childElement of findElements) {
      // 当選番号のElementを抽出
      const winningNumberElement = await getTextContentFromClassName(
        childElement,
        winningNumberName
      );
      const winningNumber = formatElement(winningNumberElement, "本数字");

      // 抽選日のElementを抽出
      const LotteryDayElement = await getTextContentFromClassName(
        childElement,
        LotteryDayName
      );
      const lotteryDay = formatElement(LotteryDayElement, "抽せん日");

      // CSVデータへ追加
      csvData += `${lotteryDay},${winningNumber}\n`;
    }
  }

  // ファイルにCSVデータを書き込む
  OutputAsCsv(csvData);

  // スクレイピング終了
  await browser.close();
};

// スクレイピング実行
main();
