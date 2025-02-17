// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const msg = require("./messages").messages;
const Url = require("url");

function patchAlreadyEnabled(html) {
  return html.indexOf("!! VSCODE-UI-TWEAK-START !!") >= 0;
}
function clearExistingPatches(html) {
  html = html.replace(
    /<!-- !! VSCODE-UI-TWEAK-START !! -->[\s\S]*?<!-- !! VSCODE-UI-TWEAK-END !! -->\n*/,
    ""
  );
  return html;
}
function reloadWindow() {
  // reload vscode-window
  vscode.commands.executeCommand("workbench.action.reloadWindow");
}
function enabledRestart() {
  vscode.window
    .showInformationMessage(msg.enabled, { title: msg.restartIde })
    .then(reloadWindow);
}
function disabledRestart() {
  vscode.window
    .showInformationMessage(msg.disabled, { title: msg.restartIde })
    .then(reloadWindow);
}
/**
 *
 * @param {vscode.ExtensionContext} context
 */
// require.main returns the metadata for main module that was used when node was called.
// it contains important fields such as the path of the current module.
const appDir = require.main
  ? path.dirname(require.main.filename)
  : // possibly some global variable defined by vscode
    globalThis._VSCODE_FILE_ROOT;

const base = path.join(appDir, "vs", "code");
let htmlFile = path.join(
  base,
  "electron-sandbox",
  "workbench",
  "workbench.html"
);
if (!fs.existsSync(htmlFile)) {
  htmlFile = path.join(
    base,
    "electron-sandbox",
    "workbench",
    "workbench.esm.html"
  );
}

const removePatch = async () => {
  let html = await fs.promises.readFile(htmlFile, "utf-8");
  if (!patchAlreadyEnabled(html)) {
    vscode.window.showInformationMessage(msg.already_disabled);
    return;
  }
  html = clearExistingPatches(html);
  html = html.replace(
    /<!-- !! (<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>) !! -->/,
    "$1"
  );
  try {
    await fs.promises.writeFile(htmlFile, html, "utf-8");
    enabledRestart();
  } catch (e) {
    vscode.window.showInformationMessage(msg.admin);
  }
};
const addPatch = async () => {
  let html = await fs.promises.readFile(htmlFile, "utf-8");
  console.log("hello is this already enabmed", patchAlreadyEnabled(html));
  if (patchAlreadyEnabled(html)) {
    vscode.window.showInformationMessage(msg.already_enabled);
    return;
  }
  let injectHTML = "";
  const customCode = [
    `file:///${__dirname}/css/custom-vscode.css`,
    `file:///${__dirname}/js/vscode-script.js`,
  ];
  for (const url of customCode) {
    let parsed = new Url.URL(url);
    const ext = path.extname(parsed.pathname);
    try {
      const fp = Url.fileURLToPath(url);
      const fetched = await fs.promises.readFile(fp);
      if (ext === ".css") {
        injectHTML += `<style>${fetched}</style>`;
      } else if (ext === ".js") {
        injectHTML += `<script>${fetched}</script>`;
      } else {
        console.log(`Unsupported extension type: ${ext}`);
      }
    } catch (e) {
      console.error(e);
      vscode.window.showWarningMessage(msg.cannotLoad(url));
    }
  }
  html = html.replace(
    /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
    "<!-- !! $& !! -->"
  );

  let indicatorJsPath;
  let ext = vscode.extensions.getExtension("vscode-ui-tweaks");
  console.log(ext);

  if (ext && ext.extensionPath) {
    indicatorJsPath = path.resolve(ext.extensionPath, "src/statusbar.js");
  } else {
    indicatorJsPath = path.resolve(__dirname, "statusbar.js");
  }
  const indicatorJsContent = await fs.promises.readFile(
    indicatorJsPath,
    "utf-8"
  );
  const indicatorJS = `<script>${indicatorJsContent}</script>`;

  html = html.replace(
    /(<\/html>)/,
    "<!-- !! VSCODE-UI-TWEAK-START !! -->\n" +
      indicatorJS +
      injectHTML +
      "<!-- !! VSCODE-UI-TWEAK-END !! -->\n</html>"
  );
  try {
    await fs.promises.writeFile(htmlFile, html, "utf-8");
    enabledRestart();
  } catch (e) {
    vscode.window.showInformationMessage(msg.admin);
  }
};
function activate(context) {
  // patch html when extension activates
  let enable = vscode.commands.registerCommand(
    "vscode-ui-tweaks.addPatch",
    addPatch
  );

  context.subscriptions.push(enable);

  let disable = vscode.commands.registerCommand(
    "vscode-ui-tweaks.removePatch",
    removePatch
  );

  context.subscriptions.push(disable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
