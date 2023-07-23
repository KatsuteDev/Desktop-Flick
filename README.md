<div align="center">
    <a href="https://github.com/KatsuteDev/Desktop-Flick#readme">
        <img src="https://raw.githubusercontent.com/KatsuteDev/Desktop-Flick/main/assets/banner.png" alt="Desktop Flick">
    </a>
    <h3>Desktop Flick - Japanese flick keyboard for desktop.</h3>
</div>

Desktop Flick uses your mobile device's keyboard and mirrors the output onto the desktop. This application works with any mobile keyboard language.

<table align="center">
    <tr>
        <td>
            <div align="center">
                <b>⚠️ Desktop Flick will reach the end of its service life on October 10, 2023 ⚠️</b>
                <br>
                <br>
                <p>Switch to <a href="https://github.com/KatsuteDev/Language-Board#readme">Language Board</a> to continue receiving updates.</p>
                <br>
                <a href="https://github.com/KatsuteDev/Language-Board#readme">
                    <img src="https://raw.githubusercontent.com/KatsuteDev/Language-Board/main/assets/icon.png" width=100>
                    <h4>Language Board</h4>
                </a>
                <p>✔️ keyboard input controls</p>
                <p>🏁 performance improvements</p>
                <p>🆕 <kbd>enter</kbd> and <kbd>backspace</kbd> controls</p>
                <p>🆕 mouse click and move controls</p>
            </div>
        </td>
    </tr>
</table>

<div align="center">
    <img align="center" src="https://raw.githubusercontent.com/KatsuteDev/Desktop-Flick/main/assets/sample.gif" width="750">
</div>

## 📃 Installation

> ⚠ Running this application may trigger your antivirus; this is a FALSE POSITIVE. Add this application to the exception list if you don't want to see alerts.

This application doesn't add a new keyboard, you need to add them to your mobile device first.

 - [Adding keyboard on iOS](https://support.apple.com/guide/iphone/add-or-change-keyboards-iph73b71eb/ios)
 - [Adding keyboard on Android](https://www.samsung.com/au/support/mobile-devices/customise-keyboard-layout/)

<br>

 1. Download the latest [release](https://github.com/KatsuteDev/Desktop-Flick/releases).
 2. Either run the installer or extract the zip into the desired directory.
     - Installer installs into `AppData/Local/Desktop-Flick`.
 3. Run `Desktop-Flick.exe`.
 4. Login with mobile device (you must be on the same internet network).
 5. Start typing.

## ⚙️ Configuration

Default port is `7272`, this can be changed by going to the `config.json` and changing the `port` value. This config is generated on the first run.

```json
{
    "port": 7272
}
```

<hr>

### 👨‍💻 Contributing

<!-- Copilot -->
<table>
    <img alt="GitHub Copilot" align="left" src="https://raw.githubusercontent.com/Katsute/Manager/main/assets/copilot-dark.png#gh-dark-mode-only" width="50">
    <img alt="Open AI" align="left" src="https://raw.githubusercontent.com/Katsute/Manager/main/assets/openai-dark.png#gh-dark-mode-only" width="50">
    <img alt="GitHub Copilot" align="left" src="https://raw.githubusercontent.com/Katsute/Manager/main/assets/copilot-light.png#gh-light-mode-only" width="50">
    <img alt="Open AI" align="left" src="https://raw.githubusercontent.com/Katsute/Manager/main/assets/openai-light.png#gh-light-mode-only" width="50">
    <p>GitHub Copilot and ChatGPT are <b>strictly prohibited</b> on this repository.</p>
</table>
<!-- Copilot -->

 - Build using `npm run build` or `npm run prepare`. Make sure to run `npm run rebuild` first.
 - Test builds using `npm run start:dev`
 - Package builds using `npm run make`

### 💼 License

This software is released under the [GNU General Public License (GPL) v2.0](https://github.com/KatsuteDev/Desktop-Flick/blob/main/LICENSE).