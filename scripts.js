var config = {
    content: [{
        type: 'row',
        content:[{
            type: 'component',
            componentName: 'scripts',
            width: 30,
            componentState: { label: 'Files' }
        },{
            type: 'column',
            content:[{
                type: 'component',
                componentName: 'scripts',
                componentState: { label: 'Content' }
            }]
        }]
    }]
};

var myLayout = new GoldenLayout(config);
var selectedFileName = null;
var contentContainer = null;

// Default scripts
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

myLayout.registerComponent('scripts', function(container, state){
    if(state.label === 'Files') {
        container.getElement().html('<button id="addFile" style="margin-left: 5px;margin-top: 5px;" title="Add new script">+</button><button id="removeFile" style="margin-left: 5px;margin-top: 5px;" title="Delete selected script">-</button><button id="runFile" style="margin-left: 5px;margin-top: 5px;" title="Run selected script">▷</button><button id="defaultScripts" style="margin-left: 5px;margin-top: 5px;" title="Add example scripts">D</button><ul id="fileList" style="list-style-type: none;padding-left: 6px;"></ul>');
        setTimeout(function() {
            document.getElementById('addFile').addEventListener('click', addFileHandler);
            document.getElementById('removeFile').addEventListener('click', removeFileHandler);
            document.getElementById('runFile').addEventListener('click', runFileHandler);
            document.getElementById('defaultScripts').addEventListener('click', addDefaultScripts);
            loadFiles();
        }, 0);
    }  else if(state.label === 'Content') {
        contentContainer = container;
        container.getElement().html('<div id="editor" style="width: 100%; height: 100%;"></div>');
        setTimeout(function() {
            var editor = ace.edit("editor");
            editor.session.setMode("ace/mode/javascript");
            editor.session.on('change', function(delta) {
                if (selectedFileName !== null) {
                    var newValue = editor.getValue();
                    var firstLine = newValue.split('\n')[0];
                    var match = firstLine.match(/^\/\/(.*)$/);
                    var hotkey = match ? match[1].trim() : null;

                    chrome.storage.local.get(['fileContents', 'hotkeys'], function(result) {
                        var fileContents = result.fileContents ? result.fileContents : {};
                        var hotkeys = result.hotkeys ? result.hotkeys : {};
                        fileContents[selectedFileName] = newValue;
                        if (hotkey) {
                            hotkeys[selectedFileName] = hotkey;
                        }
                        console.log("Saving contents for file: " + selectedFileName + " -> " + fileContents[selectedFileName]);
                        chrome.storage.local.set({'fileContents': fileContents, 'hotkeys': hotkeys}, function() {});
                    });
                }
            });
        }, 0);
    }
});

myLayout.init();

function addFileHandler() {
    var filename = prompt("Please enter filename");
    if(filename) {
        if(!filename.endsWith('.js') && !filename.endsWith('.JS')) {
            filename += '.js';
        }
        chrome.storage.local.get(['files'], function(result) {
            var files = result.files ? result.files : [];
            files.push(filename);
            files.sort();
            chrome.storage.local.set({'files': files}, function() {
                loadFiles();
            });
        });
    }
}

function removeFileHandler() {
    if(selectedFileName) {
        var confirmation = confirm("Are you sure do you want to delete the file " + selectedFileName + "?");
        if(confirmation) {
            chrome.storage.local.get(['files', 'fileContents'], function(result) {
                var files = result.files ? result.files : [];
                var fileContents = result.fileContents ? result.fileContents : {};
                // Find the index of the file to remove
                var index = files.indexOf(selectedFileName);
                if(index != -1) {
                    // Remove the file from the files list
                    files.splice(index, 1);
                    // Remove the file content
                    delete fileContents[selectedFileName];
                    // Save the updated files and fileContents
                    chrome.storage.local.set({'files': files, 'fileContents': fileContents}, function() {
                        loadFiles();
                    });
                }
            });
        }
    } else {
        alert("Please select a file to delete.");
    }
}

function runFileHandler() {
    if(selectedFileName) {
        chrome.storage.local.get(['fileContents'], function(result) {
            var fileContents = result.fileContents ? result.fileContents : {};
            eval(fileContents[selectedFileName]);
        });
    } else {
        alert("Please select a file to run.");
    }
}

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

function loadFiles() {
    chrome.storage.local.get(['files', 'fileContents'], function(result) {
        var files = result.files ? result.files : [];
        var fileContents = result.fileContents ? result.fileContents : {};
        var fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        for(var i=0; i<files.length; i++) {
            var li = document.createElement('li');
            li.textContent = files[i];
            li.style.cursor = 'pointer';
            li.style.border = '1px solid transparent';
            li.style.margin = '0';  
            li.addEventListener('click', function() {
                // Remove border from all items
                var items = fileList.getElementsByTagName("li");
                for (var j = 0; j < items.length; j++) {
                    items[j].style.border = '1px solid transparent';
                }
                // Add border to clicked item
                this.style.border = '1px solid black';
                // Load file content into Ace editor
                var editor = ace.edit("editor");
                selectedFileName = this.textContent;
                
                if (contentContainer) {
                    contentContainer.tab.setTitle(selectedFileName);
                }

                chrome.storage.local.get(['fileContents'], function(result) {
                    var fileContents = result.fileContents ? result.fileContents : {};
                    console.log("Loaded contents for file: " + selectedFileName + " -> " + fileContents[selectedFileName]);
                    editor.setValue(fileContents[selectedFileName] ? fileContents[selectedFileName] : '', -1);
                });
            });
            fileList.appendChild(li);
        }
    });
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'F2' && selectedFileName) {
        renameFileHandler();
    }
});

function renameFileHandler() {
    var newFilename = prompt("Please enter new filename for " + selectedFileName);
    if(newFilename) {
        if(!newFilename.endsWith('.js') && !newFilename.endsWith('.JS')) {
            newFilename += '.js';
        }
        chrome.storage.local.get(['files', 'fileContents', 'hotkeys'], function(result) {
            var files = result.files ? result.files : [];
            var fileContents = result.fileContents ? result.fileContents : {};
            var hotkeys = result.hotkeys ? result.hotkeys : {};
            // Find the index of the file to rename
            var index = files.indexOf(selectedFileName);
            if(index != -1) {
                // Remove the old file from the files list
                files.splice(index, 1);
                // Save the content of the old file to the new file
                fileContents[newFilename] = fileContents[selectedFileName];
                // Remove the content of the old file
                delete fileContents[selectedFileName];
                // Copy the hotkey of the old file to the new file if it exists
                if (hotkeys[selectedFileName]) {
                    hotkeys[newFilename] = hotkeys[selectedFileName];
                    delete hotkeys[selectedFileName];
                }
                // Add the new file to the files list
                files.push(newFilename);
                files.sort();
                // Save the updated files, fileContents and hotkeys
                chrome.storage.local.set({'files': files, 'fileContents': fileContents, 'hotkeys': hotkeys}, function() {
                    loadFiles();
                    selectedFileName = newFilename; // Update selected file name
                });
            }
        });
    }
}
