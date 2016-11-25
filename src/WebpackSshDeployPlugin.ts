/*!
 *
 * Copyright 2016 - yangjunbao
 *
 * @author yangjunbao yangjunbao@same.com
 * @since 2016-11-25 14:03:30
 * @version 1.0.0
 * @desc WebpackSshDeployPlugin.ts
 */
import { ClientOptions, Client } from 'scp2'
import { dirname, join } from 'path'

export interface WebpackSshDeployPluginOptions extends ClientOptions {
  root: string;
  cache?: RegExp;
}


export class WebpackSshDeployPlugin {
  private options: WebpackSshDeployPluginOptions
  private client: Client
  private cache: {[key: string]: boolean}

  constructor(options: WebpackSshDeployPluginOptions) {
    options.port = options.port || 22
    this.options = options
    this.client  = new Client(this.options)
    this.client.setMaxListeners(1e3)
    this.cache = {}
  }

  private deploy(
    names: string[],
    assets: {[key: string]: any},
    publicPath: string,
    callback: (error?: any) => void,
    error?: any
  ) {
    if (!names.length) {
      return callback(error)
    }
    const name    = names.pop()
    const dest    = join(this.options.root, publicPath, name)
    const content = assets[name].source() as string|Buffer
    const next    = this.deploy.bind(this, names, assets, publicPath, callback)
    if (this.options.cache && this.options.cache.test(dest) && this.cache[dest]) {
      console.log('[SSH] cached: %s', dest)
      return next()
    }
    this.client.mkdir(dirname(dest), (err) => {
      if (err) {
        console.error('[SSH] error(mkdir: %s): %s', dest, err)
        return next()
      }
      this.client.write({
        destination: dest,
        content    : Buffer.isBuffer(content) ? content : new Buffer(content),
      }, (err) => {
        if (err) {
          console.error('[SSH] error(write: %s): %s', dest, err)
        } else {
          console.log('[SSH] write: %s', dest)
          this.cache[dest] = true
        }
        next(err)
      })
    })
  }

  private afterEmit(compilation: any, next: (error?: Error) => void) {
    this.deploy(
      Object.keys(compilation.assets),
      compilation.assets,
      compilation.options.output.publicPath,
      next
    )
  }

  apply(compiler: any) {
    compiler.plugin('after-emit', this.afterEmit.bind(this))
  }
}
