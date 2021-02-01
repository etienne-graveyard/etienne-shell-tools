import { spawn } from "child_process";
import { Ora } from "ora";

// function _checkout() {
//   var args = ['checkout', opts.checkout];
//   var process = spawn(git, args, { cwd: targetPath });
//   process.on('close', function(status) {
//       if (status == 0) {
//           cb && cb();
//       } else {
//           cb && cb(new Error("'git checkout' failed with status " + status));
//       }
//   });
// }

export default async function gitClone(
  spinner: Ora,
  repo: string,
  targetPath: string,
  shallow: boolean = false
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const args = ["clone"];

    if (shallow) {
      args.push("--depth");
      args.push("1");
    }

    args.push("--");
    args.push(repo);
    args.push(targetPath);

    let error: Array<string> = [];

    spinner.info(`Executing: git ${args.join(" ")}`);
    spinner.start(`Cloning...`);

    const process = spawn("git", args);
    process.stderr.on("data", function (data) {
      error.push(data.toString());
    });
    process.on("close", (status, signal) => {
      if (status == 0) {
        resolve();
      } else {
        console.log(signal);
        reject(error.join("\n"));
      }
    });
  });
}
