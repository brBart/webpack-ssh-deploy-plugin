# WebpackSshDeployPlugin

A webpack plugin to deploy assets to remote server by scp.

## Install

```bash
# yarn
yarn add webpack-ssh-deploy-plugin -D

# npm
npm i -D webpack-ssh-deploy-plugin
```

## Usage

Add this plugin instance to your webpack config as follow:

```js
// webpack.config.js
const fs = require('fs')
const os = require('os')
const path = require('path')
const WebpackSshDeployPlugin = require('webpack-ssh-deploy-plugin').WebpackSshDeployPlugin
module.exports = {
  // ... other config
  plugins: [
    // other plugins
    new WebpackSshDeployPlugin({
      root: '/home/work/www',
      host: 'sandbox.example.com',
      port: 22,
      username: 'work',
      privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh/id_rsa')),
    }),
  ]
}
```

This will push all assets to the `host`, under the directory `root`.

## Options

```typescript
export interface WebpackSshDeployPluginOptions {
  // scp client configure
  host: string; // host to deploy
  port?: number; // port of ssh server
  username: string; // login user name
  password?: string; // user password, use password to login
  privateKey?: string; // your privateKey, use public key to login
  
  // deploy config
  root: string; // the root directory to deploy
  cache?: RegExp; // the paths to cache, if a asset's path name is matched by 
                  // the pattern, will only upload once, this is useful if your
                  // output file name use `[chunkhash]` for cache control
}
```

## License

[MIT](./LICENSE)