import childProcess from "child_process";
import os from "os";
import path from "path";
import util from "util";
import fse from "fs-extra";
import semver from "semver";

let execFile = util.promisify(childProcess.execFile);

const TEMP_DIR = path.join(
  fse.realpathSync(os.tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

jest.setTimeout(30_000);
beforeAll(async () => {
  await fse.remove(TEMP_DIR);
  await fse.ensureDir(TEMP_DIR);
});

afterAll(async () => {
  await fse.remove(TEMP_DIR);
});

async function execRemix(
  args: Array<string>,
  options: Exclude<Parameters<typeof execFile>[2], null | undefined> = {}
) {
  if (process.platform === "win32") {
    let cp = childProcess.spawnSync(
      "node",
      [
        "--require",
        require.resolve("esbuild-register"),
        "--require",
        path.join(__dirname, "./msw.ts"),
        path.resolve(__dirname, "../cli.ts"),
        ...args,
      ],
      {
        cwd: TEMP_DIR,
        ...options,
        env: {
          ...process.env,
          NO_COLOR: "1",
          ...options.env,
        },
      }
    );

    return {
      stdout: cp.stdout?.toString("utf-8"),
    };
  } else {
    let result = await execFile(
      "node",
      [
        "--require",
        require.resolve("esbuild-register"),
        "--require",
        path.join(__dirname, "./msw.ts"),
        path.resolve(__dirname, "../cli.ts"),
        ...args,
      ],
      {
        cwd: TEMP_DIR,
        ...options,
        env: {
          ...process.env,
          NO_COLOR: "1",
          ...options.env,
        },
      }
    );
    return {
      ...result,
      stdout: result.stdout.replace(TEMP_DIR, "<TEMP_DIR>").trim(),
    };
  }
}

describe("remix CLI", () => {
  describe("the --help flag", () => {
    it("prints help info", async () => {
      let { stdout } = await execRemix(["--help"]);
      expect(stdout.trim()).toMatchInlineSnapshot(`
        "R E M I X

          Usage:
            $ remix init [projectDir]
            $ remix build [projectDir]
            $ remix dev [projectDir]
            $ remix routes [projectDir]
            $ remix watch [projectDir]
            $ remix setup [remixPlatform]
            $ remix codemod <codemod> [projectDir]

          Options:
            --help, -h          Print this help message and exit
            --version, -v       Print the CLI version and exit
            --no-color          Disable ANSI colors in console output
          \`create\` Options:
            --template          The template to use
            --no-install        Skip installing dependencies after creation
            --no-typescript     Convert the template to JavaScript
            --remix-version     The version of Remix to use
          \`build\` Options:
            --sourcemap         Generate source maps for production
          \`dev\` Options:
            --debug             Attach Node.js inspector
            --port, -p          Choose the port from which to run your app
          \`init\` Options:
            --no-delete         Skip deleting the \`remix.init\` script
          \`routes\` Options:
            --json              Print the routes as JSON
          \`codemod\` Options:
            --dry               Dry run (no changes are made to files)
            --force             Bypass Git safety checks

          Values:
            - projectDir        The Remix project directory
            - template          The project template to use
            - remixPlatform     \`node\` or \`cloudflare\`

          Initialize a project::

            Remix project templates may contain a \`remix.init\` directory
            with a script that initializes the project. This script automatically
            runs during \`remix create\`, but if you ever need to run it manually
            (e.g. to test it out) you can:

            $ remix init

          Build your project:

            $ remix build
            $ remix build --sourcemap
            $ remix build my-app

          Run your project locally in development:

            $ remix dev
            $ remix dev my-app
            $ remix dev --debug

          Start your server separately and watch for changes:

            # custom server start command, for example:
            $ remix watch

            # in a separate tab:
            $ node --inspect --require ./node_modules/dotenv/config --require ./mocks ./build/server.js

          Show all routes in your app:

            $ remix routes
            $ remix routes my-app
            $ remix routes --json

          Reveal the used entry point:

            $ remix reveal entry.client
            $ remix reveal entry.server
            $ remix reveal entry.client --no-typescript
            $ remix reveal entry.server --no-typescript"
      `);
    });
  });

  describe("the --version flag", () => {
    it("prints the current version", async () => {
      let { stdout } = await execRemix(["--version"]);
      expect(!!semver.valid(stdout.trim())).toBe(true);
    });
  });
});
