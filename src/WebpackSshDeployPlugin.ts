/*!
 *
 * Copyright 2016 - yangjunbao
 *
 * @author yangjunbao yangjunbao@same.com
 * @since 2016-11-24 12:46:28
 * @version 1.0.0
 * @desc WebpackDeployPlugin.js
 */

import { createMap, IMap } from 'known-types'
import * as path from 'path'
import * as scp2 from 'scp2'
import * as ssh2 from 'ssh2'
import * as stream from 'stream'
import * as tslib from 'tslib'
import webpack = require('webpack')

class WrappedClient {
  client: scp2.Client

  private task: Promise<void>

  constructor(client: scp2.Client) {
    this.client = client
    this.task   = Promise.resolve(void 0)
  }

  mkdir(dirname: string) {
    this.task = this.task.catch(() => void 0).then(() => new Promise<void>((resolve, reject) => {
      this.client.mkdir(dirname, (error) => {
        error ? reject(error) : resolve(void 0)
      })
    }))

    return this.task
  }

  write(data: scp2.WriteOptions) {
    this.task = this.task.catch(() => void 0).then(() => new Promise<void>((resolve, reject) => {
      this.client.write(data, (error) => {
        error ? reject(error) : resolve(void 0)
      })
    }))

    return this.task
  }
}

interface WrappedConnection extends ssh2.Client {
  __socks: IMap<Promise<ssh2.ClientChannel>>;
}

const clients = createMap<WrappedClient>()
const proxies = createMap<Promise<WrappedConnection>>()

export interface ProxyOptions {
  host: string;
  port: string;
  user: string;
  privateKey: string;
}

export interface WebpackSshDeployPluginOptions extends scp2.ClientOptions {
  root: string;
  sock: stream.Duplex;
  proxy?: ssh2.ConnectConfig;
  cache: RegExp;
}

function getScpClient(options: WebpackSshDeployPluginOptions) {
  const sockId   = `${options.host}:${options.port}`
  const proxyId  = options.proxy ? `${options.proxy.host}:${options.proxy.port}` : ''
  const clientId = proxyId + '|' + sockId
  if (clients[clientId]) {
    console.log('client exists: %s', clientId)
    return Promise.resolve(clients[clientId])
  }
  if (!proxyId) {
    console.log('none proxy client: %s', clientId)
    return Promise.resolve(clients[clientId] = new WrappedClient(new scp2.Client(options)))
  }
  if (!proxies[proxyId]) {
    console.log('proxy not exists: %s', proxyId)
    proxies[proxyId] = new Promise((resolve) => {
      const proxy   = new ssh2.Client() as WrappedConnection
      // initial proxy connection has none nc socket
      proxy.__socks = {}
      proxy.on('ready', () => resolve(proxy))
      proxy.connect(options.proxy as ssh2.ConnectConfig)
    })
  }
  return proxies[proxyId].then((proxy) => {
    // get nc socket to target server
    // this is a promise object for avoid concurrence
    console.log('get proxy: %s', proxyId)
    if (!proxy.__socks[sockId]) {
      console.log('proxy sock not exists: %s', sockId)
      proxy.__socks[sockId] = new Promise((resolve, reject) => {
        proxy.exec(['nc', options.host, options.port].join(' '), (err, sock) => {
          if (err) {
            // allow retry get nc socket
            delete proxy.__socks[sockId]
            reject(err)
          } else {
            resolve(sock)
          }
        })
      })
    }
    return proxy.__socks[sockId]
  }).then((sock) => {
    // maybe change clients to Promise is better
    return clients[clientId] = clients[clientId] || new WrappedClient(
      new scp2.Client(tslib.__assign({ sock }, options)),
    )
  })
}

interface Asset {
  source(): string | Buffer;
  size(): number;
}

interface Compilation {
  options: webpack.Configuration;
  assets: IMap<Asset>;
}

export class WebpackSshDeployPlugin {
  options: WebpackSshDeployPluginOptions
  cache: IMap<true>

  constructor(options: WebpackSshDeployPluginOptions) {
    this.options = options
    options.port = options.port || 22
    if (options.proxy) {
      const proxy   = options.proxy
      options.proxy = void 0
      options.proxy = tslib.__assign({}, options, proxy)
    }
    this.cache = createMap<true>()
  }

  private afterEmit = (compilation: Compilation, next: (error?: Error | void) => void) => {
    const publicPath = (compilation.options.output && compilation.options.output.publicPath) || ''
    const assets     = compilation.assets
    const names      = Object.keys(assets).sort()
    let p            = Promise.resolve()
    console.log('start plugin')
    getScpClient(this.options).then((client) => {
      console.log('get client')
      names.forEach((name) => {
        const dest    = path.join(this.options.root, publicPath, name)
        const content = assets[name].source()
        if (this.options.cache && this.options.cache.test(dest) && this.cache[dest]) {
          console.log('[SD] cache: %s', dest)
          return
        }
        p = p.then(() => client.mkdir(
          path.dirname(dest),
        )).then(() => client.write({
          destination: dest,
          content: Buffer.isBuffer(content) ? content : new Buffer(content),
        })).then(() => {
          console.log('[SD] write: %s', dest)
          this.cache[dest] = true
        }, (err) => {
          console.error('[SD] error: %s', err)
        })
      })
      p.then(next, next)
    }, (err) => {
      console.error('[SD] error: %s', err)
      next(err)
    })
  }

  apply(compiler: webpack.Compiler) {
    compiler.plugin('after-emit', this.afterEmit)
  }
}
