document.addEventListener('keydown', function(event) {
    chrome.storage.local.get(['hotkeys', 'fileContents'], function(result) {
        var hotkeys = result.hotkeys ? result.hotkeys : {};
        var fileContents = result.fileContents ? result.fileContents : {};
        for (var filename in hotkeys) {
            var hotkey = hotkeys[filename];
            var keys = hotkey.split('+').map(k => k.trim().toLowerCase());

            var eventKey = event.code.toLowerCase();
            if (eventKey.startsWith('key')) {
                eventKey = eventKey.slice(3);
            }console.log(` (keys.includes('ctrl') === event.ctrlKey): ${ (keys.includes('ctrl') === event.ctrlKey)} - 
                           (keys.includes('alt') === event.altKey): ${(keys.includes('alt') === event.altKey) } - 
                           (keys.includes('shift') === event.shiftKey): ${(keys.includes('shift') === event.shiftKey)} - 
                           keys.includes(eventKey): ${keys.includes(eventKey)}
                           keys: ${eventKey} - ${event.code.toLowerCase()}
                           keys: ${JSON.stringify(keys)}`);

            if (
                (keys.includes('ctrl') === event.ctrlKey) &&
                (keys.includes('alt') === event.altKey) &&
                (keys.includes('shift') === event.shiftKey) &&
                (keys.includes(eventKey))
            ) {
                console.log(`called`);
                chrome.runtime.sendMessage({greeting: "execute", data: fileContents[filename]}, function(response) {

                });
            }
        }
    });
});


