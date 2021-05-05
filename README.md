<div align="center">
    <img src="https://raw.githubusercontent.com/Katsute/Desktop-Flick/main/logo.png" alt="Logo" width="175" height="175">
    <h1>Desktop Flick</h1>
    <p>Finally, a Japanese flick keyboard for desktop.</p>
    <a href="https://github.com/Katsute/Desktop-Flick/actions/workflows/npm_ci.yml"><img src="https://github.com/Katsute/Desktop-Flick/workflows/npm%20CI/badge.svg" title="npm CI"></a>
    <a href="https://github.com/Katsute/Desktop-Flick/actions/workflows/deploy.yml"><img src="https://github.com/Katsute/Desktop-Flick/workflows/Deploy/badge.svg" title="Deploy"></a>
    <a href="https://github.com/Katsute/Desktop-Flick/releases"><img title="version" src="https://img.shields.io/github/v/release/Katsute/Desktop-Flick"></a>
    <a href="https://github.com/Katsute/Desktop-Flick/blob/main/LICENSE"><img title="license" src="https://img.shields.io/github/license/Katsute/Desktop-Flick"></a>
</div>

This application is designed for Windows OS. Application may work on other operating systems, however they are not officially supported.

## Overview

Desktop Flick uses your mobile keyboard and mirrors the output onto the desktop.

## Setup

1. Download the latest [release](https://github.com/Katsute/Desktop-Flick/releases)
2. Either run the installer or extract the zip into the desired directory
3. Run `Desktop-Flick.exe`

## Configuration

Default port is `7272`, this can be changed by going to `(directory with exe)/resources/app/config.json` and changing the `port` value.

```json
{
    "port": 7272
}
```

<hr>

### Contributing

- Build using `npm run build` or `npm run prepare`
- Test builds using `npm run start:dev`
- Package builds using `npm run make`
