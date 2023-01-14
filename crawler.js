const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");

const args = process.argv.slice(2);

const urlStr = args[0];
const depth = parseInt(args[1]) || 0;

const getUrlsToVisit = async () => {
  const pageHTML = await axios.get(urlStr);
  const $ = cheerio.load(pageHTML.data);
  const urlsToVisit = [];
  $("a").map(function () {
    const href = $(this).attr("href");
    if (href.indexOf("http") !== -1) {
      if (urlsToVisit.indexOf(href) === -1) {
        urlsToVisit.push($(this).attr("href"));
      }
    }
  });
  return urlsToVisit;
};

const startCrawler = async () => {
  let temp = 0;
  const crawledImages = [];

  const urlsToVisit = await getUrlsToVisit();

  while (urlsToVisit.length !== 0 && temp <= depth) {
    const url = urlsToVisit.shift();
    const pageHTML = await axios.get(url);
    const $ = cheerio.load(pageHTML.data);
    $("img").map(function () {
      crawledImages.push({
        imageUrl: $(this).attr("src"),
        sourceUrl: url,
        depth: temp,
      });
    });
    temp++;
  }
  const finalRes = {
    results: crawledImages,
  };
  fs.writeFileSync("./results.json", JSON.stringify(finalRes), { spaces: 2 });
};

startCrawler()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
