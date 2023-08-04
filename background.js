chrome.runtime.onInstalled.addListener(function(details) {
  if(details.reason === "install") {
      addDefaultScripts();
  }
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.greeting == "execute") {
        eval(request.data);
      }
    });




const defaultScripts = [
    {
        filename: '01 - hello.js',
        hotkey: 'ctrl+shift+h',
        content: 'alert("hello chrome scripts");'
    },
    {
        filename: '02 - open url.js',
        hotkey: 'ctrl+shift+q',
        content: `
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    chrome.tabs.update(tab.id, {url: 'http://www.google.com'});
});
`
    },
    {
        filename: '03 - open url in new tab.js',
        hotkey: 'ctrl+shift+z',
        content: "chrome.tabs.create({ url: 'http://www.google.com' });"
    },
    {
        filename: '04 - close current tab.js',
        hotkey: 'ctrl+shift+u',
        content: `
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var tab = tabs[0];
    chrome.tabs.remove(tab.id, function() { });
});
`
    },
    {
        filename: '05 - search in chrome.js',
        hotkey: 'ctrl+shift+e',
        content: 'chrome.tabs.create({ url: \'https://www.google.com/search?q=search_string\' });'
    }
];    

function addDefaultScripts() {
  chrome.storage.local.get(['files', 'fileContents', 'hotkeys'], function(result) {
      var files = result.files ? result.files : [];
      var fileContents = result.fileContents ? result.fileContents : {};
      var hotkeys = result.hotkeys ? result.hotkeys : {};

      defaultScripts.forEach(function(script) {
          if (!files.includes(script.filename)) {
              files.push(script.filename);
              fileContents[script.filename] = `//${script.hotkey}\n\n${script.content}`;
              hotkeys[script.filename] = script.hotkey;
          }
      });

      chrome.storage.local.set({'files': files, 'fileContents': fileContents, 'hotkeys': hotkeys}, function() {
          loadFiles();
      });
  });
}

