// Selector provided by the user for the header
const headerSelector = 'header.bg-gray-800.text-green-300.flex-none.flex.justify-between.items-center.border.border-current.gap-2';
// Selector for the footer
const footerSelector = 'footer';

// Separator HTML (Updated to use border-left for crisp rendering and vertical alignment)
const separatorHTML = `<div style="border-left: 1px solid rgba(255, 255, 255, 0.4); height: 20px; margin: 0 12px; align-self: center; display: inline;"></div>`;

// HTML for the Import button (using upload icon)
const importButtonHTML = `
<button class="inline-flex items-center border py-1 px-2 border-transparent hover:border-current hover:bg-green-900" title="Import Animation">
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <use href="https://animating.rocks/feather-sprite.2b6a67b5.svg#upload"></use>
    </svg>
    <span class="hidden sm:inline ml-2">Import</span>
</button>
<input type="file" id="arp-import-input" accept=".arf" style="display: none;" />
`;

// HTML for the Export button (using download icon)
const exportButtonHTML = `
<button class="inline-flex items-center border py-1 px-2 border-transparent hover:border-current hover:bg-green-900" title="Export Animation">
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <use href="https://animating.rocks/feather-sprite.2b6a67b5.svg#download"></use>
    </svg>
    <span class="hidden sm:inline ml-2">Export</span>
</button>
`;

// HTML for the Footer Branding
const footerBrandingHTML = `
<p class="">Animating Rock Plus Extension • Developed by SaksornSea • <a href="https://github.com/SaksornSea" class="text-white"><svg width="14" height="14" class="inline-block mr-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><use href="https://animating.rocks/feather-sprite.2b6a67b5.svg#github"></use></svg>SaksornSea</a></p>
`;

// Modal HTML (Updated Input Style: bg-white text-black)
const modalHTML = `
<div id="arp-export-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 2147483647; display: none;">
    <div class="bg-gray-800 border border-green-300 p-6 rounded shadow-lg w-96 text-green-300 font-mono relative" style="pointer-events: auto; max-width: 90%; padding: 20px;">
        <h2 class="text-xl font-bold mb-4">Export Animation</h2>
        
        <div class="mb-4">
            <label class="block mb-2">File Name:</label>
            <input type="text" id="arp-export-name" class="w-full bg-white border border-gray-300 p-2 text-black focus:border-green-500 outline-none rounded" placeholder="my-animation" />
        </div>

        <div class="mb-6">
            <label class="block mb-2">Format:</label>
            <div class="flex gap-4">
                <label class="flex items-center cursor-pointer">
                    <input type="radio" name="arp-export-format" value="arf" checked class="mr-2" />
                    <span>.arf (Project)</span>
                </label>
                <label class="flex items-center cursor-pointer">
                    <input type="radio" name="arp-export-format" value="mp4" class="mr-2" />
                    <span>.mp4 (Video)</span>
                </label>
            </div>
        </div>

        <div class="flex justify-end gap-2">
            <button id="arp-modal-cancel" class="px-4 py-2 border border-transparent hover:border-red-500 hover:text-red-300 rounded">Cancel</button>
            <button id="arp-modal-save" class="px-4 py-2 border border-green-300 bg-green-900 hover:bg-green-800 text-white rounded">Save</button>
        </div>
    </div>
</div>
`;

function injectElements() {
    const header = document.querySelector(headerSelector);
    const footer = document.querySelector(footerSelector);

    if (header) {
        // Remove existing modal if any (to update it)
        const oldModal = document.getElementById('arp-export-modal');
        if (oldModal) oldModal.remove();

        // Inject Modal
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv.firstElementChild);

        // Setup Modal Event Listeners
        const modal = document.getElementById('arp-export-modal');
        const nameInput = document.getElementById('arp-export-name');

        // AGGRESSIVE Event Blocking: Prevent game shortcuts from intercepting typing
        ['keydown', 'keyup', 'keypress'].forEach(eventType => {
            nameInput.addEventListener(eventType, (e) => {
                e.stopPropagation();
            });
        });

        // Block clicks from passing through too
        modal.querySelector('.bg-gray-800').addEventListener('click', (e) => {
            e.stopPropagation();
        });

        const tempDiv = document.createElement('div');
        const buttonContainer = header.querySelector('div');
        const targetContainer = buttonContainer || header;

        // Inject Separator (make sure it's a direct child of the flex container)
        tempDiv.innerHTML = separatorHTML;
        targetContainer.appendChild(tempDiv.firstElementChild);

        // Inject Import Button & Input
        tempDiv.innerHTML = importButtonHTML;
        const importBtn = tempDiv.querySelector('button');
        const importInput = tempDiv.querySelector('input');

        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.name.endsWith('.arf')) {
                alert('Invalid file format. Please select a .arf file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (confirm('This will load the project and overwrite current unsaved changes. Continue?')) {
                        Object.keys(data).forEach(key => {
                            localStorage.setItem(key, data[key]);
                        });
                        console.log('Project loaded successfully! Reloading...');
                        location.reload();
                    }
                } catch (err) {
                    console.error('Error parsing .arf file:', err);
                    alert('Failed to load project file. It might be corrupted.');
                }
            };
            reader.readAsText(file);
        });

        while (tempDiv.firstChild) {
            targetContainer.appendChild(tempDiv.firstChild);
        }

        // Inject Export Button
        tempDiv.innerHTML = exportButtonHTML;
        const exportBtn = tempDiv.firstElementChild;

        exportBtn.addEventListener('click', () => {
            const modal = document.getElementById('arp-export-modal');
            const nameInput = document.getElementById('arp-export-name');
            nameInput.value = `animation-${new Date().toISOString().slice(0, 10)}`;
            // Use style.display directly since we defined it inline
            modal.style.display = 'flex';
            nameInput.focus();
        });

        targetContainer.appendChild(exportBtn);

        // Modal Action Logic
        const cancelBtn = document.getElementById('arp-modal-cancel');
        const saveBtn = document.getElementById('arp-modal-save');

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        saveBtn.addEventListener('click', () => {
            const name = document.getElementById('arp-export-name').value || 'animation';
            const format = document.querySelector('input[name="arp-export-format"]:checked').value;

            if (format === 'arf') {
                const data = JSON.stringify(localStorage);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${name}.arf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else if (format === 'mp4') {
                alert('MP4 Export is coming soon! For now, please use screen recording.');
            }

            modal.style.display = 'none';
        });

        console.log('Animating.Rocks Plus: Header buttons and modal injected.');
    } else {
        console.log('Animating.Rocks Plus: Header not found, ensuring retry logic covers both...');
    }

    if (footer) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = footerBrandingHTML;
        const brandingNode = tempDiv.firstElementChild;
        footer.appendChild(brandingNode);

        console.log('Animating.Rocks Plus: Footer branding injected.');
    } else {
        console.log('Animating.Rocks Plus: Footer not found');
    }

    if (!header || !footer) {
        setTimeout(injectElements, 1000);
    }
}

// Run injection when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectElements);
} else {
    injectElements();
}

// Message Listener for Popup Interaction
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_ANIMATION_DATA') {
        // Collect all localStorage data
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        sendResponse({ data: data });
    }

    if (request.action === 'LOAD_ANIMATION_DATA') {
        const data = request.data;
        if (data && confirm('This will load the shared animation and overwrite your current project. Continue?')) {
            Object.keys(data).forEach(key => {
                localStorage.setItem(key, data[key]);
            });
            sendResponse({ success: true });
            location.reload();
        } else {
            sendResponse({ success: false });
        }
    }
    return true; // Keep channel open for async response
});
