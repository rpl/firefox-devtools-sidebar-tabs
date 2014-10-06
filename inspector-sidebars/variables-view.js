/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { Class } = require("sdk/core/heritage");

const { isLocalURL, URL } = require("sdk/url");
const { Disposable, setup, dispose } = require("sdk/core/disposable");
const { EventTarget } = require("sdk/event/target");
const { contract, validate } = require("sdk/util/contract");

const { emit, on, off, setListeners } = require("sdk/event/core");
const { when } = require("sdk/event/utils");

const self = require("sdk/self");

const VARIABLES_VIEW_URL = "chrome://browser/content/devtools/widgets/VariablesView.xul";

const { Cu } = require("chrome");

Cu.import("resource:///modules/devtools/VariablesView.jsm");
Cu.import("resource:///modules/devtools/VariablesViewController.jsm");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "EnvironmentClient",
   "resource://gre/modules/devtools/dbg-client.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "ObjectClient",
   "resource://gre/modules/devtools/dbg-client.jsm");

const onSelection = function() {
  let sidebarTab = this;
  let panel = sidebarTab._panel;

  if (!panel._toolbox || !panel.selection || !panel.selection.nodeFront) {
    // filter unloaded panel and empty selections
    return;
  }

  let nodeActorID = panel.selection.nodeFront.actorID
  let view = sidebarTab._variablesView;

  if (!sidebarTab._webconsoleClient) {
    return;
  }

  sidebarTab._webconsoleClient.evaluateJS(["(", sidebarTab._domNodeScript, ")();"].join(""),
    (res) => {
      // refresh variables view
      console.debug("evaluateJS result", res);
      let options = { objectActor: res.result };
      view.empty();
      view.controller.setSingleVariable(options).expanded;
    }, {
      url: sidebarTab.DOMNodeScriptURL,
      selectedNodeActor: nodeActorID
    });
};

const DOMInspectorSidebarTab = require("./sidebar-tab").SidebarTab;

const DOMInspectorSidebarVariablesViewTab = exports.SidebarVariablesViewTab = Class({
  extends: DOMInspectorSidebarTab,
  url: VARIABLES_VIEW_URL,
  panel: "inspector",
  setup: function({panel}) {
    let tabWin = this._panel.sidebar.getWindowForTab(this.id);

    this._onNewSelection = onSelection.bind(this);

    on(this, "tab-selected", this._onNewSelection);
    on(this, "new-selection", this._onNewSelection);

    // load dom node script
    this._domNodeScript = self.data.load(this.DOMNodeScriptURL);

    // on sidebar tab ready configure the variables view
    this.ready().then(() => {
      let container = tabWin.document.querySelector("#variables");
      let target = this._target;

      let variablesView = this._variablesView = new VariablesView(container, {
        searchEnabled: true,
        searchPlaceholder: "Search..."
      });

      consoleFor(target).then( ({webconsoleClient, debuggerClient}) => {
        this.attachDebuggerClient({webconsoleClient, debuggerClient});
      });
    });
  },
  dispose: function() {
    off(this, "tab-selected", this._onNewSelection);
    off(this, "new-selection", this._onNewSelection);

    this._onNewSelection = null;
  },
  attachDebuggerClient: function({webconsoleClient, debuggerClient}) {
    this._webconsoleClient = webconsoleClient;

    VariablesViewController.attach(this._variablesView, {
      getEnvironmentClient: aGrip => {
        return new EnvironmentClient(debuggerClient, aGrip);
      },
      getObjectClient: aGrip => {
        return new ObjectClient(debuggerClient, aGrip);
      },
      getLongStringClient: aActor => {
        return webConsoleClient.longString(aActor);
      },
      releaseActor: aActor => {
        debuggerClient.release(aActor);
      }
    });
  }
});

validate.define(DOMInspectorSidebarVariablesViewTab, contract({
  label: {
    is: ["string"],
    msg: "The `option.label` must be a provided"
  },
  panel: {
    is: ["string"],
    msg: "The `option.panel` must be a provided"
  },
  DOMNodeScriptURL: {
    map: x => resolve(x.toString()),
    is: ["string"],
    ok: x => isLocalURL(x),
    msg: "The `options.DOMNodeScriptURL` must be a valid local URI. "
  }
}));

function consoleFor(target) {
  let consoleActor = target.form.consoleActor;
  let client = target.client;

  return new Promise((resolve, reject) => {
    client.attachConsole(consoleActor, [], (res, webconsoleClient) => {
      if (res.error) {
        console.error("attachConsole error", res.error);
        reject(res.error);
      } else {
        resolve({
          webconsoleClient: webconsoleClient,
          debuggerClient: client
        });
      }
    });
  });
}
