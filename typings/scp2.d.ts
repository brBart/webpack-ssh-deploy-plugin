/*!
 *
 * Copyright 2017 - acrazing
 *
 * @author acrazing joking.young@gmail.com
 * @since 2017-09-09 17:50:55
 * @version 1.0.0
 * @desc scp2.d.ts
 */

declare module 'scp2' {
  import { EventEmitter } from 'events'

  export interface ClientOptions {
    host: string;
    port?: number;
    username: string;
    privateKey: string;
  }

  export interface WriteOptions {
    destination: string;
    content: Buffer | number;
  }

  export class Client extends EventEmitter {
    constructor(options: ClientOptions);

    mkdir(dest: string, callback: (error: Error) => void): void;

    write(options: WriteOptions, callback: (error: Error) => void): void;
  }
}
