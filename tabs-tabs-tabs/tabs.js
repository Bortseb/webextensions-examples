// Zoom constants. Define Max, Min, increment and default values
const ZOOM_INCREMENT = 0.2;
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.3;
const DEFAULT_ZOOM = 1;
//import {Graph} from "https://wardcunningham.github.io/graph/graph.js"
class Graph {
  constructor(nodes=[], rels=[]) {
    this.nodes = nodes;
    this.rels = rels;
  }

  addNode(type, props={}){
    const obj = {type, in:[], out:[], props};
    this.nodes.push(obj);
    return this.nodes.length-1;
  }

  addRel(type, from, to, props={}) {
    const obj = {type, from, to, props};
    this.rels.push(obj);
    const rid = this.rels.length-1;
    this.nodes[from].out.push(rid)
    this.nodes[to].in.push(rid);
    return rid;
  }

  tally(){
    const tally = list => list.reduce((s,e)=>{s[e.type] = s[e.type] ? s[e.type]+1 : 1; return s}, {});
    return { nodes:tally(this.nodes), rels:tally(this.rels)};
  }

  size(){
    return this.nodes.length + this.rels.length;
  }
  stringify(...args) {
    const obj = { nodes: this.nodes, rels: this.rels }
    return JSON.stringify(obj, ...args)
  }

}

function download(string, file, mime='text/json') {
  /*data = `data:${mime};charset=utf-8,` + encodeURIComponent(string)
  var anchor = document.createElement('a')
  anchor.setAttribute("href", data)
  anchor.setAttribute("target", "_blank")
  anchor.text = "test me"
  anchor.setAttribute("download", file)
  document.body.appendChild(anchor) // required for firefox
  anchor.click()
  //anchor.remove()*/



  window.URL = window.webkitURL || window.URL;
  file = new Blob([string],{type:'text/json'}); //we used to need to check for 'WebKitBlobBuilder' here - but no need anymore
  /*file.append(string); //populate the file with whatever text it is that you want
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(file);
  a.download = 'test.graph.json'; // set the file name
  a.style.display = 'none';
  document.body.appendChild(a);
  console.log(a)
  //a.click(); //this is probably the key - simulatating a click on a download link
*/
  browser.downloads.download({
    url : window.URL.createObjectURL(file),
    filename : 'test.graph.json',
    conflictAction : 'uniquify'
  });
  //a.parentNode.removeChild(a);// we don't need this anymore

}

function firstUnpinnedTab(tabs) {
  for (let tab of tabs) {
    if (!tab.pinned) {
      return tab.index;
    }
  }
}

/**
 * listTabs to switch to
 */
function listTabs() {
  getCurrentWindowTabs().then((tabs) => {
    let tabsList = document.getElementById('tabs-list');
    let currentTabs = document.createDocumentFragment();
    let limit = 5;
    let counter = 0;

    tabsList.textContent = '';

    for (let tab of tabs) {
      if (!tab.active && counter <= limit) {
        let tabLink = document.createElement('a');

        tabLink.textContent = tab.title || tab.id;
        tabLink.setAttribute('href', tab.id);
        tabLink.classList.add('switch-tabs');
        currentTabs.appendChild(tabLink);
      }

      counter += 1;
    }

    tabsList.appendChild(currentTabs);
  });
}

document.addEventListener("DOMContentLoaded", listTabs);

function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}

document.addEventListener("click", (e) => {
  function callOnActiveTab(callback) {
    getCurrentWindowTabs().then((tabs) => {
      for (let tab of tabs) {
        if (tab.active) {
          callback(tab, tabs);
        }
      }
    });
}

  if (e.target.id === "tabs-move-beginning") {
    callOnActiveTab((tab, tabs) => {
      let index = 0;
      if (!tab.pinned) {
        index = firstUnpinnedTab(tabs);
      }
      console.log(`moving ${tab.id} to ${index}`)
      browser.tabs.move([tab.id], {index});
    });
  }

  if (e.target.id === "tabs-move-end") {
    callOnActiveTab((tab, tabs) => {
      let index = -1;
      if (tab.pinned) {
        let lastPinnedTab = Math.max(0, firstUnpinnedTab(tabs) - 1);
        index = lastPinnedTab;
      }
      browser.tabs.move([tab.id], {index});
    });
  }

  else if (e.target.id === "tabs-duplicate") {
    callOnActiveTab((tab) => {
      browser.tabs.duplicate(tab.id);
    });
  }

  else if (e.target.id === "tabs-reload") {
    callOnActiveTab((tab) => {
      browser.tabs.reload(tab.id);
    });
  }

  else if (e.target.id === "tabs-remove") {
    callOnActiveTab((tab) => {
      browser.tabs.remove(tab.id);
    });
  }

  else if (e.target.id === "tabs-create") {
    browser.tabs.create({url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions"});
  }

  else if (e.target.id === "tabs-create-reader") {
    browser.tabs.create({url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions", openInReaderMode: true});
  }

  else if (e.target.id === "tabs-alertinfo") {
    callOnActiveTab((tab) => {
      let props = "";
      for (let item in tab) {
        props += `${ item } = ${ tab[item] } \n`;
      }
      alert(props);
    });
  }

  else if (e.target.id === "tabs-add-zoom") {
    callOnActiveTab((tab) => {
      let gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        //the maximum zoomFactor is 5, it can't go higher
        if (zoomFactor >= MAX_ZOOM) {
          alert("Tab zoom factor is already at max!");
        } else {
          let newZoomFactor = zoomFactor + ZOOM_INCREMENT;
          //if the newZoomFactor is set to higher than the max accepted
          //it won't change, and will never alert that it's at maximum
          newZoomFactor = newZoomFactor > MAX_ZOOM ? MAX_ZOOM : newZoomFactor;
          browser.tabs.setZoom(tab.id, newZoomFactor);
        }
      });
    });
  }

  else if (e.target.id === "tabs-decrease-zoom") {
    callOnActiveTab((tab) => {
      let gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        //the minimum zoomFactor is 0.3, it can't go lower
        if (zoomFactor <= MIN_ZOOM) {
          alert("Tab zoom factor is already at minimum!");
        } else {
          let newZoomFactor = zoomFactor - ZOOM_INCREMENT;
          //if the newZoomFactor is set to lower than the min accepted
          //it won't change, and will never alert that it's at minimum
          newZoomFactor = newZoomFactor < MIN_ZOOM ? MIN_ZOOM : newZoomFactor;
          browser.tabs.setZoom(tab.id, newZoomFactor);
        }
      });
    });
  }

  else if (e.target.id === "tabs-default-zoom") {
    callOnActiveTab((tab) => {
      let gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        if (zoomFactor == DEFAULT_ZOOM) {
          alert("Tab zoom is already at the default zoom factor");
        } else {
          browser.tabs.setZoom(tab.id, DEFAULT_ZOOM);
        }
      });
    });
  }

  else if (e.target.id === "tabs-to-graph") {
    function logTabs(tabs) {
      const graph = new Graph()
      for (const tab of tabs) {
        // tab.url requires the `tabs` permission or a matching host permission.
        //console.log({...tab});
        graph.addNode("Tab",{name:tab.title})
      }
      console.log(graph,graph.stringify(null,2))
      download(graph.stringify(null,2),"tabs.graph.json")
    }
    
    function onError(error) {
      console.error(`Error: ${error}`);
    }
    
    browser.tabs.query({ currentWindow: true }).then(logTabs, onError);
  }

  else if (e.target.classList.contains('switch-tabs')) {
    let tabId = +e.target.getAttribute('href');

    browser.tabs.query({
      currentWindow: true
    }).then((tabs) => {
      for (let tab of tabs) {
        if (tab.id === tabId) {
          browser.tabs.update(tabId, {
              active: true
          });
        }
      }
    });
  }

  e.preventDefault();
});

//onRemoved listener. fired when tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`The tab with id: ${tabId}, is closing`);

  if(removeInfo.isWindowClosing) {
    console.log(`Its window is also closing.`);
  } else {
    console.log(`Its window is not closing`);
  }
});

//onMoved listener. fired when tab is moved into the same window
browser.tabs.onMoved.addListener((tabId, moveInfo) => {
  let startIndex = moveInfo.fromIndex;
  let endIndex = moveInfo.toIndex;
  console.log(`Tab with id: ${tabId} moved from index: ${startIndex} to index: ${endIndex}`);
});
