import * as path from "path";
import * as fs from "fs";

export default async function writeFileProm(
  filePath: string,
  content: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
