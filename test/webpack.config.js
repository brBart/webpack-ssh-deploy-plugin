/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-09-12 00:43:41
 * @version 1.0.0
 * @desc webpack.config.js
 */

const deploy = require('../lib/WebpackSshDeployPlugin')
const fs = require('fs')
const os = require('os')
const path = require('path')
const config = require('./deploy.config')

module.exports = {
    entry: './test/index.js',
    output: {
        filename: 'dist/test.bundle.js',
    },
    plugins: [
        new deploy.WebpackSshDeployPlugin({
            privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh/id_rsa')),
            host: '127.0.0.1',
            port: config.port,
            username: config.username,
            cache: /^\/static\//,
            root: config.root,
            proxy: {
                host: config.host,
                port: config.port,
            },
        })
    ]
}