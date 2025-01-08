// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  ethereum,
  JSONValue,
  TypedMap,
  Entity,
  Bytes,
  Address,
  BigInt
} from "@graphprotocol/graph-ts";

export class NewToken extends ethereum.Event {
  get params(): NewToken__Params {
    return new NewToken__Params(this);
  }
}

export class NewToken__Params {
  _event: NewToken;

  constructor(event: NewToken) {
    this._event = event;
  }

  get token(): Address {
    return this._event.parameters[0].value.toAddress();
  }

  get conviction(): Address {
    return this._event.parameters[1].value.toAddress();
  }
}

export class Factory extends ethereum.SmartContract {
  static bind(address: Address): Factory {
    return new Factory("Factory", address);
  }
}
