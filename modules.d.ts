/*!
 *
 * Copyright 2016 - yangjunbao
 *
 * @author yangjunbao yangjunbao@same.com
 * @since 2016-11-25 14:10:05
 * @version 1.0.0
 * @desc modules.d.ts
 */


declare module "scp2" {
  import { EventEmitter } from 'events'

  export interface ClientOptions {
    host: string;
    port?: number;
    username: string;
    privateKey: string;
  }

  export interface WriteOptions {
    destination: string;
    content: Buffer|number;
  }

  export class Client extends EventEmitter {
    constructor(options: ClientOptions);

    mkdir(dest: string, callback: (error: Error) => void): void;

    write(options: WriteOptions, callback: (error: Error) => void): void;
  }
}
