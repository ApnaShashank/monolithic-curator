document.addEventListener('DOMContentLoaded', async () => {
    const titleEl = document.getElementById('title');
    const urlEl = document.getElementById('url');
    const saveBtn = document.getElementById('saveBtn');
    const statusEl = document.getElementById('status');

    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
        titleEl.value = tab.title;
        urlEl.textContent = tab.url;
    }

    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Capture in Progress...';
        statusEl.textContent = '';

        try {
            const response = await fetch('http://localhost:3000/api/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    url: tab.url,
                    title: titleEl.value,
                    type: 'link' // Backend will auto-detect more specific types
                }),
            });

            const data = await response.json();

            if (response.ok) {
                statusEl.textContent = 'Success! Artifact Indexed.';
                statusEl.className = 'success';
                setTimeout(() => window.close(), 1500);
            } else {
                statusEl.textContent = 'Error: ' + (data.error || 'Failed to save');
                statusEl.className = 'error';
                saveBtn.disabled = false;
                saveBtn.textContent = 'Try Again';
            }
        } catch (error) {
            statusEl.textContent = 'Connection Error. Is the brain online?';
            statusEl.className = 'error';
            saveBtn.disabled = false;
            saveBtn.textContent = 'Retry Capture';
        }
    });
});
