// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const msg = require("./messages").messages;
const uuid = require("uuid");
const Url = require("url");
const fetch = (...args) =>
  // @ts-ignore
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // require.main returns the metadata for main module that was used when node was called.
  // it contains important fields such as the path of the current module.
  const appDir = require.main
    ? path.dirname(require.main.filename)
  // possibly some global variable defined by vscode
    : globalThis._VSCODE_FILE_ROOT;
    
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
  console.log("htmls", htmlFile);
  const BackupFilePath = (uuid) =>
    path.join(
      base,
      "electron-sandbox",
      "workbench",
      `workbench.${uuid}.bak-custom-css`
    );

  // patch html when extension activates
  (async() => {
    const uuidSession = uuid.v4();
    await createBackup(uuidSession);
    await performPatch(uuidSession);
  })()
  async function getContent(url) {
    if (/^file:/.test(url)) {
      const fp = Url.fileURLToPath(url);
      return await fs.promises.readFile(fp);
    } else {
      const response = await fetch(url);
      return response.buffer();
    }
  }

  // #### Backup ################################################################
  /**
   * Retrieves the backup uuid from the provided path.
   * @param {*} htmlFilePath path to the internal vscode html where the css and js are injected
   * @returns a UUID
   */
  async function getBackupUuid(htmlFilePath) {
    try {
      const htmlContent = await fs.promises.readFile(htmlFilePath, "utf-8");
      const m = htmlContent.match(
        /<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ([0-9a-fA-F-]+) !! -->/
      );
      if (!m) return null;
      else return m[1];
    } catch (e) {
      vscode.window.showInformationMessage(msg.somethingWrong + e);
      throw e;
    }
  }

/**
 * Creates backup each time the extension is enabled. Copies the initial workbench.html in the core vscode folders
 * @param {*} uuidSession the session suffix added to the backup file
 */
  async function createBackup(uuidSession) {
    try {
      let html = await fs.promises.readFile(htmlFile, "utf-8");
      html = clearExistingPatches(html);
      await fs.promises.writeFile(BackupFilePath(uuidSession), html, "utf-8");
    } catch (e) {
      vscode.window.showInformationMessage(msg.admin);
      throw e;
    }
  }

  async function restoreBackup(backupFilePath) {
    try {
      if (fs.existsSync(backupFilePath)) {
        await fs.promises.unlink(htmlFile);
        await fs.promises.copyFile(backupFilePath, htmlFile);
      }
    } catch (e) {
      vscode.window.showInformationMessage(msg.admin);
      throw e;
    }
  }

  async function deleteBackupFiles() {
    const htmlDir = path.dirname(htmlFile);
    const htmlDirItems = await fs.promises.readdir(htmlDir);
    for (const item of htmlDirItems) {
      if (item.endsWith(".bak-custom-css")) {
        await fs.promises.unlink(path.join(htmlDir, item));
      }
    }
  }

  // #### Patching ##############################################################
  /**
   * Adds html and css to vscode's internal html file.
   * @param {*} uuidSession 
   * @returns 
   */
  async function performPatch(uuidSession) {
    let html = await fs.promises.readFile(htmlFile, "utf-8");
    html = clearExistingPatches(html);

    const injectHTML = await patchHtml();
    html = html.replace(
      /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
      ""
    );

    let indicatorJS = await getIndicatorJs();

    html = html.replace(
      /(<\/html>)/,
      `<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID ${uuidSession} !! -->\n` +
        "<!-- !! VSCODE-CUSTOM-CSS-START !! -->\n" +
        indicatorJS +
        injectHTML +
        "<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n</html>"
    );
    try {
      await fs.promises.writeFile(htmlFile, html, "utf-8");
    } catch (e) {
      vscode.window.showInformationMessage(msg.admin);
      disabledRestart();
    }
    enabledRestart();
  }
  function clearExistingPatches(html) {
    html = html.replace(
      /<!-- !! VSCODE-CUSTOM-CSS-START !! -->[\s\S]*?<!-- !! VSCODE-CUSTOM-CSS-END !! -->\n*/,
      ""
    );
    html = html.replace(
      /<!-- !! VSCODE-CUSTOM-CSS-SESSION-ID [\w-]+ !! -->\n*/g,
      ""
    );
    return html;
  }

  async function patchHtml() {
    let res = "";

    const customCode = [`file:///${__dirname}/css/custom-vscode.css`, `file:///${__dirname}/js/vscode-script.js`];
    for (const item of customCode) {
      const imp = await patchHtmlForItem(item);
      if (imp) res += imp;
    }
    return res;
  }
  async function patchHtmlForItem(url) {
    if (!url) return "";
    if (typeof url !== "string") return "";

    // Copy the resource to a staging directory inside the extension dir
    let parsed = new Url.URL(url);
    const ext = path.extname(parsed.pathname);

    try {
      const fetched = await getContent(url);
      if (ext === ".css") {
        return `<style>${fetched}</style>`;
      } else if (ext === ".js") {
        return `<script>${fetched}</script>`;
      } else {
        console.log(`Unsupported extension type: ${ext}`);
      }
    } catch (e) {
      console.error(e);
      vscode.window.showWarningMessage(msg.cannotLoad(url));
      return "";
    }
  }
  async function getIndicatorJs() {
    let indicatorJsPath;
    let ext = vscode.extensions.getExtension("be5invis.vscode-custom-css");
    if (ext && ext.extensionPath) {
      indicatorJsPath = path.resolve(ext.extensionPath, "src/statusbar.js");
    } else {
      indicatorJsPath = path.resolve(__dirname, "statusbar.js");
    }
    const indicatorJsContent = await fs.promises.readFile(
      indicatorJsPath,
      "utf-8"
    );
    return `<script>${indicatorJsContent}</script>`;
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

  
  console.log("vscode-custom-css is active!");
  console.log("Application directory", appDir);
  console.log("Main HTML file", htmlFile);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
