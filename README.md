*firefox-devtools-sidebar-tabs* JPM helper module
=================================================

Status: **proof-of-concept**

This small npm package can be used as a dependency in a Mozilla Firefox Add-on,
using the new *JPM* tool.

## Usage

In a Firefox Add-on created using the new *JPM* format (e.g. bootstraped using ```jpm init```
in an empty dir), install the npm dependency:

```js 
npm install rpl/firefox-devtools-sidebar-tabs --save
```

Then you can add new Firefox Devtools sidebars tabs can be:
- defined programmatically using the APIs exposed by this package
- declared using experimental custom attributes in your package.json

### Limitations

This package currently supports only new sidebar tabs on the DOM Inspector Panel.

### Experimental DevTools Sidebar Tabs APIs

```js
const {
  SidebarVariablesViewTab
} = require("firefox-devtools-sidebars/inspector-sidebars");

const {
  SidebarTool
} = require("firefox-devtools-sidebars/toolbox");

var AngularDOMInspectorSidebarTab = Class({
  extends: SidebarVariablesViewTab,
  label: "Angular",
  DOMNodeScriptURL: self.data.url("./angular-dom-node-script.js")
});

const angularSidebarTool = new SidebarTool({
  sidebars: { angular: AngularDOMInspectorSidebarTab }
});
```

### *package.json* custom attributes

To define a new sidebar tab definition you need to add in your own *package.json*
file (*url* paths are relative to the data directory in the add-on *xpi*).

#### DOM Inspector Custom VariablesView sidebar tab

```js
{
  "name": "dev-panel",
  "title": "dev-panel",
  "description": "a basic add-on",
  "main": "lib/main.js",
  "author": "",
  "license": "MPL 2.0",
  "version": "0.1.0",
  "dependencies": {
     "firefox-devtools": "*"
  },
  "firefox-devtools": {
    "sidebars": {
      "angular": {
        "label": "Angular",
        "DOMNodeScriptURL": "angular-dom-node-script.js",
        "panel": "inspector"
      }
    }
  }
}
```

and in your addon-on code:

```js
var devtoolsSidebarTabs = require("firefox-devtools-sidebar-tabs");

devtoolsSidebarTabs.registerAddonsFromManifest();
```
