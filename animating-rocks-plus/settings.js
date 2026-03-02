// settings.js
// Logic for loading, displaying, and saving keybinds will go here.
const keybindIds = [
    'kb-person', 'kb-cat', 'kb-ball', 'kb-box',
    'kb-save', 'kb-import', 'kb-export',
    'kb-play', 'kb-stop'
];

const defaultKeybinds = {
    'kb-person': '1',
    'kb-cat': '2',
    'kb-ball': '3',
    'kb-box': '4',
    'kb-save': 's',
    'kb-import': 'i',
    'kb-export': 'e',
    'kb-play': 'p',
    'kb-stop': 'Escape'
};

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-keybinds');
    const statusDiv = document.getElementById('status');

    // Load current settings
    chrome.storage.local.get(['keybinds'], (result) => {
        const keybinds = result.keybinds || defaultKeybinds;
        keybindIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = keybinds[id] || defaultKeybinds[id];

                // Add Key Capture Logic
                input.addEventListener('keydown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Don't capture just modifier keys
                    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

                    let combo = [];
                    if (e.ctrlKey) combo.push('ctrl');
                    if (e.shiftKey) combo.push('shift');
                    if (e.altKey) combo.push('alt');

                    // Handle Space specifically for better readability
                    const keyName = e.key === ' ' ? 'Space' : e.key;
                    combo.push(keyName);

                    input.value = combo.join('+');
                });

                // Visual feedback on focus
                input.addEventListener('focus', () => {
                    input.style.borderColor = '#86efac';
                    input.style.backgroundColor = '#1f2937';
                });
                input.addEventListener('blur', () => {
                    input.style.borderColor = '#4b5563';
                    input.style.backgroundColor = '#374151';
                });
            }
        });
    });

    saveButton.addEventListener('click', () => {
        const keybinds = {};
        keybindIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                keybinds[id] = input.value;
            }
        });

        chrome.storage.local.set({ keybinds }, () => {
            statusDiv.textContent = 'Keybinds saved successfully!';
            statusDiv.style.color = '#86efac';
            setTimeout(() => statusDiv.textContent = '', 2000);
        });
    });
});
