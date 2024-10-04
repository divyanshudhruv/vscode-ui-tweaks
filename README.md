# 🎨 vscode-ui-tweaks 

Welcome to `vscode-ui-tweaks`, a collection of custom CSS and JS tweaks designed to elevate your Visual Studio Code experience! ✨

## 📂 What's Inside? 
1. **Custom CSS**: `custom-vscode.css` 🎨 – Enhance the look and feel of your VS Code.
2. **Custom JS**: `vscode-script.js` 🧩 – Add custom functionality and automation.
3. **VS Code Settings ⚙️**: Fine-tune your editor with our tailored settings. 
4. **Keybindings ⌨️**: Boost your productivity with personalized keybindings. 
5. **Extensions 🛠️**: Recommended extensions to complement these tweaks. 

## 🚀 How to Use? 
- **`Clone`** this repository to your local machine.
- **`Apply`** the custom CSS and JS to your VS Code.
- **`Enjoy`** a more personalized coding environment! 🎉

## 🚧 Instructions 

#### 1. 🛠️ Install the Extensions 
- Install the extension **(Custom CSS and JS Loader)** listed under **`.vscode/extensions.json`** from the VS Code marketplace.
- <a href="https://github.com/be5invis/vscode-custom-css">Link to repository</a>
#### 2. ✍️ Modify `settings.json` 
- Add the configuration below to your VS Code `settings.json` file. Be sure to **back up your current settings** as this may overwrite them.

**Add the following configuration:**

```javascript
vscode_custom_css.imports": [
    // Absolute file paths for your custom CSS/JS files

    // For Mac or Linux:
    // "file:///Users/[your-username]/[path-to-custom-css]/vscode-ui-tweaks/css/custom-vscode.css",
    // "file:///Users/[your-username]/[path-to-custom-css]/vscode-ui-tweaks/js/custom-vscode.js",

    // For Windows:
    // "file:///C:/[path-to-custom-css]/vscode-ui-tweaks/css/custom-vscode.css",
    // "file:///C:/[path-to-custom-css]/vscode-ui-tweaks/js/custom-vscode.js"
]
```

#### 3. 🎨 Enable "Custom CSS and JS Loader" 
- Open the **Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `Enable Custom CSS and JS` to activate the customizations.

#### 4. ✨ Customize Your CSS or JS 
- Modify the CSS or JS files to change the appearance and behavior of Visual Studio Code to suit your preferences. Explore different areas of VS Code that you want to enhance.

#### 5. 🔄 Reload the Extension 
- After making any changes to your CSS or JS files, reload the extension from the command palette by selecting `Reload Custom CSS and JS`.

## 📸 Screenshots 
Check out the `assets/` folder for screenshots of the custom UI in action! 🖼️

## 🤝 Contribute 
Feel free to submit **issues** or **pull requests** to help improve these tweaks. Let's make VS Code even **`better together`** ! 🚀
