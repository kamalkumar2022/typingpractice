// Retrieve saved texts from localStorage
function loadSavedTexts() {
    let saved = JSON.parse(localStorage.getItem('savedTexts') || '[]');
    // Reverse the array to show newest items first
    const reversedSaved = [...saved].reverse();

    const container = document.getElementById('saved-texts-container');
    container.innerHTML = "";

    if (saved.length === 0) {
      container.innerHTML = "<p style='text-align: center;'>No saved texts yet.</p>";
      return;
    }

    // Add "Most Recently Saved" heading
    const recentHeading = document.createElement('h3');
    recentHeading.textContent = "Most Recently Saved Text";
    recentHeading.style.textAlign = "center";
    recentHeading.style.marginTop = "40px";
    container.appendChild(recentHeading);

    // Add the most recent item (first in the reversed array)
    if (reversedSaved.length > 0) {
      const item = reversedSaved[0];
      const originalIndex = saved.length - 1; // Calculate original index
      const preview = item.text.substr(0,150) + (item.text.length>150?"...":"");
      const div = document.createElement('div');
      div.className = "saved-item";
      div.innerHTML = `
        <div class="saved-heading">${item.heading}</div>
        <div class="saved-preview">${preview}</div>
        <div class="options">
          <button onclick="useText(${originalIndex})">Use</button>
          <button onclick="viewText(${originalIndex})">View</button>
          <button onclick="copyText(${originalIndex})">Copy</button>
          <button onclick="editText(${originalIndex})">Edit</button>
          <button onclick="deleteText(${originalIndex})">Delete</button>
        </div>
      `;
      container.appendChild(div);
    }

    // Add "Previously Saved" heading if there are more items
    if (reversedSaved.length > 1) {
      const previousHeading = document.createElement('h3');
      previousHeading.textContent = "Previously Saved Texts";
      previousHeading.style.textAlign = "center";
      previousHeading.style.marginTop = "30px";
      container.appendChild(previousHeading);

      // Add the remaining items
      for (let i = 1; i < reversedSaved.length; i++) {
        const item = reversedSaved[i];
        const originalIndex = saved.length - 1 - i; // Calculate original index
        const preview = item.text.substr(0,150) + (item.text.length>150?"...":"");
        const div = document.createElement('div');
        div.className = "saved-item";
        div.innerHTML = `
          <div class="saved-heading">${item.heading}</div>
          <div class="saved-preview">${preview}</div>
          <div class="options">
            <button onclick="useText(${originalIndex})">Use</button>
            <button onclick="viewText(${originalIndex})">View</button>
            <button onclick="copyText(${originalIndex})">Copy</button>
            <button onclick="editText(${originalIndex})">Edit</button>
            <button onclick="deleteText(${originalIndex})">Delete</button>
          </div>
        `;
        container.appendChild(div);
      }
    }
  }

// Function to get saved texts array
function getSavedTexts() {
return JSON.parse(localStorage.getItem('savedTexts') || '[]');
}

function setSavedTexts(texts) {
localStorage.setItem('savedTexts', JSON.stringify(texts));
loadSavedTexts();
}

// Update useText function:
function useText(index) {
const saved = getSavedTexts();
if (saved[index]) {
    console.log("Using saved text:", saved[index].text);
    for (let i = 0; i < saved[index].text.length; i++) {
        console.log(`Character: ${saved[index].text[i]}, ASCII: ${saved[index].text.charCodeAt(i)}`);
    }
    // Save the text temporarily in localStorage
    localStorage.setItem("useSavedText", saved[index].text);
    // Navigate to the home page (index.html)
    window.location.href = 'index.html';
}
}

// Keep the original modal for viewText etc.
function showModalMessage(message) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modal = document.createElement('div');
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '8px';
    modal.style.maxWidth = '80%';
    modal.style.maxHeight = '80%';
    modal.style.overflowY = 'auto';
    modal.innerText = message;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    // Dismiss modal on click anywhere
    modalOverlay.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
}

// NEW: Create a separate auto-dismiss modal for copying
function showModalAutoDismiss(message) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modal = document.createElement('div');
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '8px';
    modal.style.maxWidth = '80%';
    modal.style.maxHeight = '80%';
    modal.style.overflowY = 'auto';
    modal.innerText = message;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    setTimeout(() => {
        if (document.body.contains(modalOverlay)) {
        document.body.removeChild(modalOverlay);
        }
    }, 2000);
}

// NEW: Add a custom modal function for view with an "Okay" button.
function showModalWithOk(message) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modal = document.createElement('div');
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '8px';
    modal.style.maxWidth = '65%';
    modal.style.maxHeight = '66%';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';
    modal.style.overflow = 'hidden';

    // Create a scrollable message container
    const messageContainer = document.createElement('div');
    messageContainer.style.flex = '1';
    messageContainer.style.overflowY = 'auto';
    messageContainer.style.marginBottom = '10px';
    messageContainer.innerText = message;

    const okButton = document.createElement('button');
    okButton.innerText = 'Okay';
    okButton.style.alignSelf = 'center';
    okButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });

    modal.appendChild(messageContainer);
    modal.appendChild(okButton);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
}

// NEW: Add a custom confirmation modal for deletion
function showConfirmModal(message, onConfirm) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modal = document.createElement('div');
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '8px';
    modal.style.maxWidth = '80%';
    modal.style.maxHeight = '80%';
    modal.style.overflowY = 'auto';

    const msgPara = document.createElement('p');
    msgPara.innerText = message;
    modal.appendChild(msgPara);

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Delete';
    deleteBtn.style.marginRight = '10px';
    deleteBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        onConfirm(true);
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.innerText = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
        onConfirm(false);
    });
    modal.appendChild(deleteBtn);
    modal.appendChild(cancelBtn);

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
}

// Replace alert in viewText:
function viewText(index) {
    const saved = getSavedTexts();
    if (saved[index]) {
        showModalWithOk(saved[index].text);
    }
}

// Update copyText function to use the auto-dismiss modal:
function copyText(index) {
    const saved = getSavedTexts();
    if (saved[index]) {
        navigator.clipboard.writeText(saved[index].text)
        .then(() => showModalAutoDismiss("Text copied to clipboard!"));
}
}

/**
 * Comprehensive function to clean and paste text into a contenteditable element
 * Handles: non-English characters removal, converting formatting (superscript/subscript) to normal text,
 * quote/dash normalization, and proper cursor positioning
 */
function cleanAndPasteText(text, targetElement) {
    if (!text || !targetElement) return;
    
    // Step 1: Clean the text
    let cleanedText = text;
    
    // Convert HTML superscript/subscript to normal text instead of removing
    cleanedText = cleanedText.replace(/<sup>(.*?)<\/sup>/gi, function(match, group) {
        // Convert superscript numbers to normal numbers
        return group;
    });
    
    cleanedText = cleanedText.replace(/<sub>(.*?)<\/sub>/gi, function(match, group) {
        // Convert subscript numbers to normal numbers
        return group;
    });
    
    // Convert Unicode superscript characters to normal characters
    const superscriptMap = {
        // Numbers
        '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', 
        '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
        
        // Operators and symbols
        '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
        '⁄': '/', '⁎': '*', '˙': '.', '‸': '^', '˚': '°',
        '∗': '*', '□': '#', '⁀': '~', '´': "'", '˝': '"',
        '˂': '<', '˃': '>', '˄': '^', '˅': 'v', '˜': '~',
        '˟': 'x', '‍ᵏ': 'k', '˒': ',', '˓': '!', '˔': '?',
        '˕': ';', '˖': '+', '˗': '-', '˘': '`', 'ᵉⁿ': 'en',
        
        // Lowercase letters
        'ᵃ': 'a', 'ᵇ': 'b', 'ᶜ': 'c', 'ᵈ': 'd', 'ᵉ': 'e',
        'ᶠ': 'f', 'ᵍ': 'g', 'ʰ': 'h', 'ⁱ': 'i', 'ʲ': 'j',
        'ᵏ': 'k', 'ˡ': 'l', 'ᵐ': 'm', 'ⁿ': 'n', 'ᵒ': 'o',
        'ᵖ': 'p', 'ᵠ': 'q', 'ʳ': 'r', 'ˢ': 's', 'ᵗ': 't', 
        'ᵘ': 'u', 'ᵛ': 'v', 'ʷ': 'w', 'ˣ': 'x', 'ʸ': 'y', 'ᶻ': 'z',
        
        // Uppercase letters
        'ᴬ': 'A', 'ᴮ': 'B', 'ᶜ': 'C', 'ᴰ': 'D', 'ᴱ': 'E', 'ᶠ': 'F', 'ᴳ': 'G',
        'ᴴ': 'H', 'ᴵ': 'I', 'ᴶ': 'J', 'ᴷ': 'K', 'ᴸ': 'L', 'ᴹ': 'M', 'ᴺ': 'N', 
        'ᴼ': 'O', 'ᴾ': 'P', 'ᵠ': 'Q', 'ᴿ': 'R', 'ˢ': 'S', 'ᵀ': 'T', 'ᵁ': 'U', 
        'ⱽ': 'V', 'ᵂ': 'W', 'ˣ': 'X', 'ʸ': 'Y', 'ᶻ': 'Z'
    };
    
    // Convert Unicode subscript characters to normal characters
    const subscriptMap = {
        // Numbers
        '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
        '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
        
        // Operators and symbols
        '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
        '₣': 'f', '₤': 'L', '₧': 'Pts', '₨': 'Rs', '₩': 'W',
        '₪': 'NS', '₫': 'd', '€': 'E', '₭': 'K', '₮': 'T',
        '₯': 'Dr', '₰': 'Pf', '₱': 'P', '₲': 'G', '₳': 'A',
        '₴': 'UAH', '₵': 'C', '₸': 'T', '₹': 'Rs', '₺': 'TL',
        '₼': 'man', '₽': 'P', '₾': 'GEL', '₿': 'B',
        
        // Lowercase letters
        'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j', 
        'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o', 
        'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u', 
        'ᵥ': 'v', 'ₓ': 'x', 'ᵦ': 'b', 'ᵧ': 'y', 'ᵨ': 'p', 
        'ᵩ': 'φ', 'ᵪ': 'x', 'ₔ': 'q', 'ₕ': 'h', 'ₖ': 'k',
        'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't', 'ₓ': 'x',
        'ₐ': 'a', 'ₑ': 'e', 'ᵦ': 'β', 'ᵧ': 'γ', 'ᵨ': 'ρ', 'ᵩ': 'φ'
    };
    
    // Preserve ASCII characters and convert Unicode superscript/subscript
    let result = '';
    for (let i = 0; i < cleanedText.length; i++) {
        const char = cleanedText[i];
        
        // Check if the character is in the superscript map
        if (superscriptMap[char]) {
            result += superscriptMap[char];
        }
        // Check if the character is in the subscript map
        else if (subscriptMap[char]) {
            result += subscriptMap[char];
        }
        // If it's an ASCII character or space, keep it
        else if (/[\x00-\x7F\s]/.test(char)) {
            result += char;
        }
        // Otherwise, it's a non-ASCII character we want to exclude
    }
    
    // Update cleanedText with our converted result
    cleanedText = result;
    
    // Normalize quotes and dashes
    cleanedText = sanitizeQuotesAndDashes(cleanedText);
    
    // Convert non-breaking spaces to regular spaces
    cleanedText = cleanedText.replace(/\u00A0/g, ' ');
    
    // Step 2: Insert the cleaned text into the target element
    targetElement.focus();
    
    if (targetElement.tagName.toLowerCase() === 'textarea') {
        // For textarea elements
        targetElement.value = cleanedText;
        // Position cursor at the end
        targetElement.setSelectionRange(cleanedText.length, cleanedText.length);
    } else {
        // For contenteditable elements
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            // Delete any currently selected text
            selection.deleteFromDocument();
            
            // Insert the cleaned text as a plain text node
            const textNode = document.createTextNode(cleanedText);
            selection.getRangeAt(0).insertNode(textNode);
            
            // Move cursor to the end of inserted text
            const range = document.createRange();
            range.setStartAfter(textNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // If no selection range, just set the content directly
            targetElement.innerText = cleanedText;
        }
    }
}

function sanitizeQuotesAndDashes(str) {
    // Convert fancy quotes (single and double) and em dashes to their standard forms
    return str
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        .replace(/[—–]/g, "--"); // Added en dash to the replacements
}

// NEW: Add a custom modal for editing saved text
function openEditModal(currentHeading, currentText, callback) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '600px';
    // Updated innerHTML with matching font-family and font-size:
    modalContent.innerHTML = `
        <h2>Edit Saved Text</h2>
        <label>Heading:</label><br>
        <input type="text" id="edit-heading" style="width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 14px;" value="${currentHeading}"><br><br>
        <label>Text:</label><br>
        <textarea id="edit-text" style="width: 100%; font-family: Arial, Helvetica, sans-serif; font-size: 14px; max-width:600px; min-width:600px; height: 200px; max-height: 400px; min-height:100px;"></textarea><br><br>
        <button id="edit-save">Save</button>
        <button id="edit-cancel">Cancel</button>
    `;
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Get the textarea and apply our comprehensive text cleaning function
    const editText = document.getElementById('edit-text');
    cleanAndPasteText(currentText, editText);
    editText.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            e.preventDefault(); // Stop the default tab behavior (moving focus)
            
            // Insert tab character at current position
            const start = this.selectionStart;
            const end = this.selectionEnd;
            
            // Insert tab character
            this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
            
            // Move cursor after the inserted tab
            this.selectionStart = this.selectionEnd = start + 1;
        }
    });
    
    // Add paste event listener to handle paste events in the edit textarea
    editText.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text');
        cleanAndPasteText(pastedData, editText);
    });

    document.getElementById('edit-save').addEventListener('click', () => {
        const newHeading = document.getElementById('edit-heading').value;
        const newText = document.getElementById('edit-text').value;
        
        // Clean the text once more before saving to ensure consistency
        const cleanedText = sanitizeQuotesAndDashes(newText).replace(/[^\x00-\x7F\s]/g, '');
        
        document.body.removeChild(modalOverlay);
        callback(newHeading, cleanedText);
    });
    
    document.getElementById('edit-cancel').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
}

// Replace editText function with one that uses the modal:
function editText(index) {
    let saved = getSavedTexts();
    if (saved[index]) {
        openEditModal(saved[index].heading, saved[index].text, (newHeading, newText) => {
        if (newHeading !== null && newText !== null) {
            saved[index] = { heading: newHeading, text: newText };
            setSavedTexts(saved);
        }
        });
    }
}

// Replace deleteText to use the custom confirmation modal:
function deleteText(index) {
    let saved = getSavedTexts();
    showConfirmModal("Delete this saved text?", function(confirmed) {
        if (confirmed) {
            saved.splice(index, 1);
            setSavedTexts(saved);
        }
    });
}

function navigateHome() {
    window.location.href = 'index.html';
}

// Add restrictToEnglishOnly function from index.js
function restrictToEnglishOnly(element) {
    if (!element) return;
    
    // Add input event listener to filter non-English characters
    element.addEventListener('input', function() {
        // Get the current content and selection position
        const content = this.innerText || this.value;
        const selectionStart = this.selectionStart || 0;
        
        // Replace non-English characters (non-ASCII) with empty string
        const filteredContent = content.replace(/[^\x00-\x7F\s]/g, '');
        
        // Only update if content changed
        if (content !== filteredContent) {
            // For textarea elements
            if (this.tagName.toLowerCase() === 'textarea') {
                const originalScrollTop = this.scrollTop;
                this.value = filteredContent;
                // For textareas we need to restore scroll position and cursor
                this.scrollTop = originalScrollTop;
                this.setSelectionRange(selectionStart, selectionStart);
            }
            // For contenteditable elements
            else {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                const cursorPosition = range.startOffset;
                
                this.innerText = filteredContent;
                
                // Try to restore cursor position
                try {
                    const newRange = document.createRange();
                    const textNode = this.firstChild || this;
                    
                    // Calculate the new cursor position
                    const newPosition = Math.min(cursorPosition, filteredContent.length);
                    
                    if (textNode.nodeType === Node.TEXT_NODE) {
                        newRange.setStart(textNode, newPosition);
                    } else {
                        // If there's no text node, place cursor at the end
                        const lastChild = this.lastChild || this;
                        newRange.selectNodeContents(lastChild);
                        newRange.collapse(false);
                    }
                    
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } catch (e) {
                    console.warn('Failed to restore cursor position');
                }
            }
        }
    });
    
    // Also filter on paste events
    element.addEventListener('paste', function(e) {
        // For textarea elements
        if (this.tagName.toLowerCase() === 'textarea') {
            // Use setTimeout to let the paste complete first
            setTimeout(() => {
                const content = this.value;
                const filteredContent = content.replace(/[^\x00-\x7F\s]/g, '');
                if (content !== filteredContent) {
                    this.value = filteredContent;
                }
                // Position cursor at the end
                this.setSelectionRange(this.value.length, this.value.length);
            }, 0);
        }
        // For contenteditable elements
        else {
            // Use setTimeout to let the paste complete first
            setTimeout(() => {
                const content = this.innerText;
                const filteredContent = content.replace(/[^\x00-\x7F\s]/g, '');
                if (content !== filteredContent) {
                    this.innerText = filteredContent;
                }
                
                // Position cursor at the end
                const selection = window.getSelection();
                const range = document.createRange();
                if (this.lastChild) {
                    range.selectNodeContents(this.lastChild);
                    range.collapse(false);
                } else {
                    range.selectNodeContents(this);
                    range.collapse(false);
                }
                selection.removeAllRanges();
                selection.addRange(range);
            }, 0);
        }
    });
}

// Add a new button for saving new text on the saved texts page
document.addEventListener('DOMContentLoaded', function() {
    const saveNewTextBtn = document.createElement('button');
    saveNewTextBtn.id = 'save-new-text-btn';
    saveNewTextBtn.textContent = 'Save New Text';
    saveNewTextBtn.className = 'reload-button'; // Use the same class as the restart test button
    saveNewTextBtn.style.position = 'absolute';
    saveNewTextBtn.style.top = '10px';
    saveNewTextBtn.style.right = '15px';
    const container = document.querySelector('.container');
    container.style.position = 'relative'; // Ensure the container is positioned relative
    container.appendChild(saveNewTextBtn);

    // Add event listener to the new button
    saveNewTextBtn.addEventListener('click', function() {
        openSaveTextModal(function(heading, textValue) {
            if (!heading || !textValue.trim()) return;
            let saved = JSON.parse(localStorage.getItem('savedTexts') || '[]');
            saved.push({ heading, text: textValue });
            localStorage.setItem('savedTexts', JSON.stringify(saved));
            loadSavedTexts(); // Refresh the saved texts list
        });
    });
});

// Define the openSaveTextModal function
function openSaveTextModal(callback) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '600px';
    modalContent.innerHTML = `
        <h2>Save Your Text</h2>
        <label>Heading: <span style="color: red;">*</span></label><br>
        <input type="text" id="save-heading" style="width: 100%;" required><br><br>
        <label>Text: <span style="color: red;">*</span></label><br>
        <textarea id="save-text" style="width: 100%; height: 200px;" required></textarea><br><br>
        <p id="heading-error" style="color: red; display: none;">Heading is required</p>
        <p id="text-error" style="color: red; display: none;">Text is required</p><br>
        <button id="save-text-submit">Save</button>
        <button id="save-text-cancel">Cancel</button>
    `;
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    document.getElementById('save-text-submit').addEventListener('click', () => {
        const heading = document.getElementById('save-heading').value;
        const textValue = document.getElementById('save-text').value;
        const headingErrorElement = document.getElementById('heading-error');
        const textErrorElement = document.getElementById('text-error');

        // Validate the heading and text fields
        let isValid = true;
        if (!heading) {
            headingErrorElement.style.display = 'block';
            isValid = false;
        } else {
            headingErrorElement.style.display = 'none';
        }
        if (!textValue.trim()) {
            textErrorElement.style.display = 'block';
            isValid = false;
        } else {
            textErrorElement.style.display = 'none';
        }
        if (!isValid) return;

        // If heading and text are valid, continue with saving
        modalContent.innerHTML = `<h2>Text saved successfully</h2>`;
        setTimeout(() => {
            if(document.body.contains(modalOverlay)) {
                document.body.removeChild(modalOverlay);
            }
            callback(heading, textValue);
        }, 1000); // wait 1 second before closing
    });
    
    document.getElementById('save-text-cancel').addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initial load of saved texts
    loadSavedTexts();
    
    // Add event listener to home button
    const homeButton = document.getElementById('home-button');
    if (homeButton) {
        homeButton.addEventListener('click', navigateHome);
    }
});