/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

module.metadata = {
  "stability": "experimental"
};

const { Class } = require("sdk/core/heritage");
const { isLocalURL, URL } = require("sdk/url");
const { Disposable, setup, dispose } = require("sdk/core/disposable");
const { EventTarget } = require("sdk/event/target");
const { contract, validate } = require("sdk/util/contract");

const { emit, on, off, setListeners } = require("sdk/event/core");
const { when } = require("sdk/event/utils");

const SidebarTab = require("../sidebar-tab").SidebarTab;

const DOMInspectorSidebarTab = exports.SidebarTab = Class({
  extends: SidebarTab,
  implements: [Disposable],
  panel: "inspector"
});

const onStateChange = (sidebarTab, state) => {
  sidebarTab.readyState = state;
  emit(sidebarTab, state);
};

const onTabSelected = (sidebarTab) => {
  emit(sidebarTab, "tab-selected");
};

const onNewSelection = (sidebarTab) => {
  emit(sidebarTab, "new-selection");
};

setup.define(DOMInspectorSidebarTab, (sidebarTab, {panel}) => {
  sidebarTab._panel = panel;
  sidebarTab._target = panel._target;

  // bind event handlers
  sidebarTab._onSidebarReady = onStateChange.bind(null, sidebarTab, "ready");
  sidebarTab._onTabSelected = onTabSelected.bind(null, sidebarTab);
  sidebarTab._onNewSelection = onNewSelection.bind(null, sidebarTab);

  // subscribe events
  panel.sidebar.on(sidebarTab.id + "-ready", sidebarTab._onSidebarReady);
  panel.sidebar.on(sidebarTab.id + "-selected", sidebarTab._onTabSelected);
  panel.selection.on("new-node", sidebarTab._onNewSelection);

  // add sidebar tab
  panel.sidebar.addTab(sidebarTab.id, sidebarTab.url, false);

  sidebarTab.readyState = "initialized";

  setListeners(sidebarTab, Object.getPrototypeOf(sidebarTab));

  // set the title on ready
  sidebarTab.ready().then(function () {
    // set the tab title label
    let tab = panel.sidebar._tabs.get(sidebarTab.id);
    tab.setAttribute("label", sidebarTab.label);
  });

  // call custom setup
  sidebarTab.setup({panel});
});

dispose.define(DOMInspectorSidebarTab, function(sidebarTab) {
  let panel = sidebarTab._panel;

  panel.selection.off("new-node", sidebarTab._onNewSelection);
  panel.sidebar.off(sidebarTab.id + "-selected", sidebarTab._onTabSelected);
  panel.sidebar.off(sidebarTab.id + "-ready", sidebarTab._onSidebarReady);

  panel.sidebar.removeTab(sidebarTab.id);

  sidebarTab.readyState = "destroyed";
  sidebarTab.dispose();
});
