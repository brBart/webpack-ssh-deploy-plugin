# WebpackSshDeployPlugin

A webpack plugin to deploy assets to remote server by scp.

## Install

```bash
# yarn
yarn add webpack-ssh-deploy-plugin -D
```

## Usage

Add this plugin instance to your webpack config as follow:

```ts
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { WebpackSshDeployPlugin } from 'webpack-ssh-deploy-plugin'
export = {
    plugins: [
        new WebpackSshDeployPlugin({
            root: '/home/work/www',
            host: 'sandbox.example.com',
            port: 22,
            username: 'work',
            privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh/id_rsa')),
        })
    ]
}
```

Options Schema:

```ts
interface WebpackSshDeployPluginOptions {
    root: string;
    sock: stream.Duplex;
    proxy?: ssh2.ConnectConfig;
    cache: RegExp;
    host: string;
    port?: number;
    username: string;
    privateKey: string;
}
```

## Note

### Cache for immutable assets when develop

If you want to let some assets just deploy once, set the `cache` field
of option, which is used for match the asset path, if matched, will send
once.

### Proxy use `nc` options

If you want to use proxy for access internal network by a jump machine,
set `proxy` field as a `ssh2.ConnectConfig`.

## Warning

This plugin is use for development, just send assets to remote server.

## License

[MIT](./LICENSE)