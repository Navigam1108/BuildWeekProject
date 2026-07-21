import { execFileSync } from "node:child_process"

const images = [
  ["challenge-py", "images/challenge-py"],
  ["challenge-ts", "images/challenge-ts"],
  ["challenge-cpp", "images/challenge-cpp"]
]

for (const [tag, directory] of images) {
  console.log(`\nBuilding ${tag} from ${directory}…`)
  execFileSync("docker", ["build", "--tag", tag, directory], { stdio: "inherit" })
}
