/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

module.metadata = {
  "stability": "experimental"
};

const { Class } = require("sdk/core/heritage");
const { Disposable, setup } = require("sdk/core/disposable");
const { contract, validate } = require("sdk/util/contract");
const { each, pairs, values } = require("sdk/util/sequence");

const Tool = Class({
  extends: Disposable,
  setup: function(params={}) {
    const { sidebars } = validate(this, params);

    this.sidebars = sidebars;

    each(([key, Sidebar]) => {
      const { label } = validate(Sidebar.prototype);
      const { id } = Sidebar.prototype;

      /* TODO register sidebar */
      registerSidebar({
        id: id,
        sidebarClass: Sidebar
      });

    }, pairs(sidebars));

    gDevTools.on("inspector-ready", onInspectorReady);
  },
  dispose: function() {
    gDevTools.off("inspector-ready", onInspectorReady);

    each(Sidebar => unregisterSidebar(Sidebar.prototype.id),
         values(this.sidebars));
  }
});

validate.define(Tool, contract({
  sidebars: {
    is: ["object", "undefined"]
  }
}));
exports.SidebarTool = Tool;

let sidebarClassesByPanel = new Map();
let sidebarInstancesById = new Map();

function registerSidebar({id, sidebarClass}) {
  var panel = sidebarClass.prototype.panel;
  var sidebars = sidebarClassesByPanel.get(panel) || new Map();

  sidebars.set("id", sidebarClass);
  sidebarClassesByPanel.set(panel, sidebars);
}

function unregisterSidebar(id) {
  each(sidebars => sidebars.delete(id), values(sidebarClassesByPanel));

  let sidebarInstances = sidebarInstancesById.get(id);
  sidebarInstancesById.delete(id);

  each(sidebar => sidebar.dispose(), values(sidebarInstances));
}

/* Hooks devtools ui lifecycle events */

const { Cu, Cc, Ci } = require("chrome");
const { gDevTools } = Cu.import("resource:///modules/devtools/gDevTools.jsm", {});

const onInspectorReady = (evtType, toolbox, panel) => {
  let sidebarClasses = sidebarClassesByPanel.get("inspector");

  if (!sidebarClasses) {
    return;
  }

  for (let Sidebar of sidebarClasses.values()) {
    let sidebar = Sidebar({panel: panel});
    var sidebarInstances = sidebarInstancesById.get(sidebar.id) || new Set();
    sidebarInstances.add(sidebar);
    sidebarInstancesById.set(sidebar.id, sidebarInstances);
  }
};
