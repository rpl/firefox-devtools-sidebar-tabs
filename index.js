/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const self = require('sdk/self');
const { Class } = require("sdk/core/heritage");

// pick the Firefox DevTools add-on components defined in the add-on package.json
exports.registerAddonsFromManifest = function() {
  let { "firefox-devtools": devtoolAddonConfig } = require("package.json");

  /* process defined devtools sidebars */
  let { sidebars } = devtoolAddonConfig;

  let sidebarClassesByName = Object.keys(sidebars)
    .reduce((acc, sidebarName) => {
      let cfg = sidebars[sidebarName];

      let sidebarDef = {
        label: cfg.label
      };

      sidebarDef = processSupportedPanels(sidebarDef, cfg);
      acc[sidebarName] = Class(sidebarDef);

      return acc;
    }, {});

  /* auto-install the defined devtools sidebars */

  const { Tool } = require("./toolbox");

  const devtoolsAddons = new Tool({
    sidebars: sidebarClassesByName
  });
};

function processSupportedPanels(sidebarDef, cfg) {
  if (cfg.panel === "inspector") {

    if (cfg.DOMNodeScriptURL) {
      sidebarDef.extends = require("./inspector-sidebars").SidebarVariablesViewTab;
      sidebarDef.DOMNodeScriptURL = self.data.url(cfg.DOMNodeScriptURL);
    } else if(cfg.url) {
      sidebarDef.extends = require("./inspector-sidebars").SidebarTab;
      sidebarDef.url = self.data.url(cfg.url);
    }
  } else {
    throw Error("Unsupported sidebars on devtool panel: " + cfg.panel);
  }

  return sidebarDef;
}
