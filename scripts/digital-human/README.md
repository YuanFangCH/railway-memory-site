# Digital human asset builder

This isolated tool reads the source virtual-avatar PSD and writes the transparent
layer set consumed by `/digital-human`.

```powershell
npm install
node build-assets.mjs
```

Options:

- `--psd <path>`: source PSD; defaults to the supplied avatar file.
- `--out <path>`: output directory; defaults to `public/images/digital-human`.
- `--scale <number>`: output scale from `0` to `1`; defaults to `0.5`.
- `--check`: writes only a body-layer preview and does not replace deployable assets.

The production Next.js build does not install or execute this tool. Generated WebP
files and `manifest.json` are deployed as ordinary static assets.
