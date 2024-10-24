const fs = require("fs");

function readJSONFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log("File not found");
    return -1;
  }

  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

function writeJSONFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJSONFile, writeJSONFile };
