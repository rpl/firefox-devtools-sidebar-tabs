/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

module.metadata = {
  "stability": "experimental"
};

const { Class } = require("sdk/core/heritage");
const { isLocalURL, URL } = require("sdk/url");

const { EventTarget } = require("sdk/event/target");
const { contract, validate } = require("sdk/util/contract");

const { when } = require("sdk/event/utils");

const { id: addonID } = require("sdk/self");

const makeID = name =>
  ("dev-sidebar-" + addonID + "-" + name).
  split("/").join("-").
  split(".").join("-").
  split(" ").join("-").
  replace(/[^A-Za-z0-9_\-]/g, "");

const SidebarTab = Class({
  extends: EventTarget,
  get id() {
    return makeID(this.name || this.label);
  },
  readyState: "uninitialized",
  ready: function() {
    const { readyState } = this;
    const isReady = readyState === "ready";
    return isReady ? Promise.resolve(this) :
           when(this, "ready");
  }
});
exports.SidebarTab = SidebarTab;

validate.define(SidebarTab, contract({
  label: {
    is: ["string"],
    msg: "The `option.label` must be a provided"
  },
  panel: {
    is: ["string"],
    msg: "The `option.panel` must be a provided"
  },
  url: {
    map: x => resolve(x.toString()),
    is: ["string"],
    ok: x => isLocalURL(x),
    msg: "The `options.url` must be a valid local URI. "
  }
}));
