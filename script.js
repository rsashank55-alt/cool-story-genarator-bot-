// API Configuration
const API_CONFIG = {
    url: 'https://api.euron.one/api/v1/euri/chat/completions',
    apiKey: 'euri-d0c00732524b1b5ae66443fd154d33e118a6d7c22f2ce04a823f9bf58a3125df',
    defaultModel: 'gpt-4.1-nano',
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000
};

// State Management
let settings = {
    temperature: API_CONFIG.defaultTemperature,
    maxTokens: API_CONFIG.defaultMaxTokens,
    model: API_CONFIG.defaultModel
};

let currentLanguage = 'en';
let attachedFiles = [];
let storyHistory = [];
let currentHistoryId = null;

// DOM Elements
const homeScreen = document.getElementById('homeScreen');
const chatScreen = document.getElementById('chatScreen');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const homeBtn = document.getElementById('homeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const typingIndicator = document.getElementById('typingIndicator');
const messagesWrapper = document.getElementById('messagesWrapper');
const welcomeMessage = document.querySelector('.welcome-message');
const temperatureSlider = document.getElementById('temperature');
const maxTokensSlider = document.getElementById('maxTokens');
const tempValue = document.getElementById('tempValue');
const tokensValue = document.getElementById('tokensValue');
const modelSelect = document.getElementById('model');
const suggestionChips = document.querySelectorAll('.chip');
const startChatBtn = document.getElementById('startChatBtn');
const langBtn = document.getElementById('langBtn');
const langDropdown = document.getElementById('langDropdown');
const langFlag = document.getElementById('langFlag');
const langName = document.getElementById('langName');
const attachBtn = document.getElementById('attachBtn');
const attachDropdown = document.getElementById('attachDropdown');
const photoBtn = document.getElementById('photoBtn');
const cameraBtn = document.getElementById('cameraBtn');
const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');
const cameraInput = document.getElementById('cameraInput');
const attachmentsPreview = document.getElementById('attachmentsPreview');
const historySidebar = document.getElementById('historySidebar');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const historyContent = document.getElementById('historyContent');
const historyEmpty = document.getElementById('historyEmpty');

// Initialize (Android compatible)
document.addEventListener('DOMContentLoaded', () => {
    // Fix Android viewport height
    const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100);
    });
    
    // Prevent double-tap zoom on Android
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
    
    loadLanguage();
    loadSettings();
    loadStoryHistory();
    setupEventListeners();
    autoResizeTextarea();
    updateTranslations();
    renderHistory();
    
    // Fix Android keyboard issues
    if (window.innerWidth <= 768) {
        // Adjust viewport when keyboard appears
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const chatInputArea = document.querySelector('.chat-input-area');
                if (chatInputArea) {
                    chatInputArea.style.paddingBottom = 'env(safe-area-inset-bottom)';
                }
            });
        }
    }
});

// Language Management
function loadLanguage() {
    const savedLang = localStorage.getItem('storyBotLanguage');
    if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
    } else {
        // Try to detect browser language
        const browserLang = navigator.language.split('-')[0];
        if (translations[browserLang]) {
            currentLanguage = browserLang;
        }
    }
    updateLanguageUI();
}

function saveLanguage() {
    localStorage.setItem('storyBotLanguage', currentLanguage);
}

function updateLanguageUI() {
    const meta = languageMetadata[currentLanguage];
    if (meta) {
        langFlag.textContent = meta.flag;
        langName.textContent = meta.name;
    }
}

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLanguage = lang;
    saveLanguage();
    updateLanguageUI();
    updateTranslations();
    langDropdown.classList.remove('active');
    langBtn.classList.remove('active');
}

function updateTranslations() {
    const t = translations[currentLanguage];
    if (!t) return;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const value = getNestedValue(t, key);
        if (value !== undefined) {
            el.textContent = value;
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const value = getNestedValue(t, key);
        if (value !== undefined) {
            el.placeholder = value;
        }
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const value = getNestedValue(t, key);
        if (value !== undefined) {
            el.title = value;
        }
    });

    // Update prompt suggestions - preserve data-prompt attribute
    suggestionChips.forEach((chip, index) => {
        const key = `chat.welcome.suggestion${index + 1}`;
        const value = getNestedValue(t, key);
        if (value !== undefined) {
            // Keep the original data-prompt, only update visible text
            const originalPrompt = chip.getAttribute('data-prompt');
            chip.textContent = value;
            // Ensure data-prompt is preserved
            if (originalPrompt && !chip.getAttribute('data-prompt')) {
                chip.setAttribute('data-prompt', originalPrompt);
            }
        }
    });

    // Update history translations
    const historyTitle = document.querySelector('#historySidebar h2');
    const historyEmpty = document.querySelector('#historyEmpty p');
    if (historyTitle) {
        const titleValue = getNestedValue(t, 'history.title');
        if (titleValue) historyTitle.textContent = titleValue;
    }
    if (historyEmpty) {
        const emptyValue = getNestedValue(t, 'history.empty');
        if (emptyValue) historyEmpty.textContent = emptyValue;
    }

    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
    
    // Update RTL for Arabic
    if (currentLanguage === 'ar') {
        document.body.style.direction = 'rtl';
    } else {
        document.body.style.direction = 'ltr';
    }
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((o, p) => o && o[p], obj);
}

// Navigation
function showHomeScreen() {
    homeScreen.style.display = 'flex';
    chatScreen.style.display = 'none';
}

function showChatScreen() {
    homeScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    startChatBtn?.addEventListener('click', showChatScreen);
    homeBtn?.addEventListener('click', showHomeScreen);
    
    // Language selector
    langBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('active');
        langBtn.classList.toggle('active');
    });
    
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = option.getAttribute('data-lang');
            setLanguage(lang);
        });
    });
    
    // Close language dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!langBtn?.contains(e.target) && !langDropdown?.contains(e.target)) {
            langDropdown?.classList.remove('active');
            langBtn?.classList.remove('active');
        }
    });
    
    // Chat functionality - Send button with Android touch support
    let sendTouchStart = 0;
    let sendTouchMoved = false;
    
    const handleSend = () => {
        if (!sendBtn?.disabled) {
            sendMessage();
        }
    };
    
    // Send button touch events for Android
    sendBtn?.addEventListener('touchstart', (e) => {
        sendTouchStart = Date.now();
        sendTouchMoved = false;
        e.stopPropagation();
    }, { passive: true });
    
    sendBtn?.addEventListener('touchmove', () => {
        sendTouchMoved = true;
    }, { passive: true });
    
    sendBtn?.addEventListener('touchend', (e) => {
        if (!sendTouchMoved && (Date.now() - sendTouchStart < 300) && !sendBtn?.disabled) {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
        }
    });
    
    sendBtn?.addEventListener('click', (e) => {
        if (Date.now() - sendTouchStart > 300) {
            e.preventDefault();
            e.stopPropagation();
            handleSend();
        }
    });
    
    // Enter key support
    messageInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    clearBtn?.addEventListener('click', clearChat);
    settingsBtn?.addEventListener('click', openSettings);
    closeSettingsBtn?.addEventListener('click', closeSettings);
    settingsModal?.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettings();
    });
    
    // Settings sliders
    temperatureSlider?.addEventListener('input', (e) => {
        settings.temperature = parseFloat(e.target.value);
        tempValue.textContent = settings.temperature.toFixed(1);
        saveSettings();
    });
    
    maxTokensSlider?.addEventListener('input', (e) => {
        settings.maxTokens = parseInt(e.target.value);
        tokensValue.textContent = settings.maxTokens;
        saveSettings();
    });
    
    modelSelect?.addEventListener('change', (e) => {
        settings.model = e.target.value;
        saveSettings();
    });
    
    // Suggestion chips - fix to work with translations (touch support for Android)
    suggestionChips.forEach(chip => {
        let touchStartTime = 0;
        let touchMoved = false;
        
        const handleChip = () => {
            const prompt = chip.getAttribute('data-prompt');
            if (prompt) {
                messageInput.value = prompt;
                // Delay focus on mobile to prevent keyboard issues
                setTimeout(() => {
                    messageInput.focus();
                    autoResizeTextarea();
                }, 100);
            }
        };
        
        // Android-friendly touch handling
        chip.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchMoved = false;
        }, { passive: true });
        
        chip.addEventListener('touchmove', () => {
            touchMoved = true;
        }, { passive: true });
        
        chip.addEventListener('touchend', (e) => {
            if (!touchMoved && (Date.now() - touchStartTime < 300)) {
                e.preventDefault();
                e.stopPropagation();
                handleChip();
            }
        });
        
        chip.addEventListener('click', (e) => {
            // Only handle click if touch didn't fire (desktop)
            if (Date.now() - touchStartTime > 300) {
                handleChip();
            }
        });
    });

    // File attachment functionality (Android touch support)
    let attachTouchStart = 0;
    let attachTouchMoved = false;
    
    attachBtn?.addEventListener('touchstart', () => {
        attachTouchStart = Date.now();
        attachTouchMoved = false;
    }, { passive: true });
    
    attachBtn?.addEventListener('touchmove', () => {
        attachTouchMoved = true;
    }, { passive: true });
    
    attachBtn?.addEventListener('touchend', (e) => {
        if (!attachTouchMoved && (Date.now() - attachTouchStart < 300)) {
            e.preventDefault();
            e.stopPropagation();
            attachDropdown?.classList.toggle('active');
            attachBtn?.classList.toggle('active');
        }
    });
    
    attachBtn?.addEventListener('click', (e) => {
        if (Date.now() - attachTouchStart > 300) {
            e.stopPropagation();
            attachDropdown?.classList.toggle('active');
            attachBtn?.classList.toggle('active');
        }
    });

    photoBtn?.addEventListener('click', () => {
        fileInput.click();
        attachDropdown?.classList.remove('active');
        attachBtn?.classList.remove('active');
    });

    cameraBtn?.addEventListener('click', () => {
        cameraInput.click();
        attachDropdown?.classList.remove('active');
        attachBtn?.classList.remove('active');
    });

    fileBtn?.addEventListener('click', () => {
        fileInput.click();
        attachDropdown?.classList.remove('active');
        attachBtn?.classList.remove('active');
    });

    fileInput?.addEventListener('change', handleFileSelect);
    cameraInput?.addEventListener('change', handleFileSelect);

    // Close attachment dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!attachBtn?.contains(e.target) && !attachDropdown?.contains(e.target)) {
            attachDropdown?.classList.remove('active');
            attachBtn?.classList.remove('active');
        }
    });

    // History sidebar (Android touch support)
    let historyTouchStart = 0;
    let historyTouchMoved = false;
    
    const toggleHistory = () => {
        historySidebar?.classList.toggle('hidden');
    };
    
    const closeHistory = () => {
        historySidebar?.classList.add('hidden');
    };
    
    historyToggleBtn?.addEventListener('touchstart', () => {
        historyTouchStart = Date.now();
        historyTouchMoved = false;
    }, { passive: true });
    
    historyToggleBtn?.addEventListener('touchmove', () => {
        historyTouchMoved = true;
    }, { passive: true });
    
    historyToggleBtn?.addEventListener('touchend', (e) => {
        if (!historyTouchMoved && (Date.now() - historyTouchStart < 300)) {
            e.preventDefault();
            toggleHistory();
        }
    });
    
    historyToggleBtn?.addEventListener('click', () => {
        if (Date.now() - historyTouchStart > 300) {
            toggleHistory();
        }
    });

    closeHistoryBtn?.addEventListener('touchstart', () => {
        historyTouchStart = Date.now();
        historyTouchMoved = false;
    }, { passive: true });
    
    closeHistoryBtn?.addEventListener('touchmove', () => {
        historyTouchMoved = true;
    }, { passive: true });
    
    closeHistoryBtn?.addEventListener('touchend', (e) => {
        if (!historyTouchMoved && (Date.now() - historyTouchStart < 300)) {
            e.preventDefault();
            closeHistory();
        }
    });
    
    closeHistoryBtn?.addEventListener('click', () => {
        if (Date.now() - historyTouchStart > 300) {
            closeHistory();
        }
    });

    // Close history sidebar on mobile when clicking outside
    if (window.innerWidth <= 768) {
        const handleOutsideClick = (e) => {
            if (historySidebar && !historySidebar.contains(e.target) && 
                !historyToggleBtn?.contains(e.target) && 
                !historySidebar.classList.contains('hidden')) {
                historySidebar.classList.add('hidden');
            }
        };
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('touchend', handleOutsideClick);
    }
}

// Auto-resize textarea (Android compatible)
let resizeTimeout;
function autoResizeTextarea() {
    if (!messageInput) return;
    
    const resize = () => {
        messageInput.style.height = 'auto';
        const newHeight = Math.min(messageInput.scrollHeight, 120);
        messageInput.style.height = newHeight + 'px';
        
        // Scroll to bottom on mobile (Android compatible)
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                if (messagesWrapper) {
                    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
                }
            }, 100);
        }
    };
    
    // Remove existing listeners to prevent duplicates
    const inputHandler = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 10);
    };
    
    const focusHandler = () => {
        setTimeout(resize, 100);
        // Fix Android keyboard covering input
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    };
    
    messageInput.addEventListener('input', inputHandler, { passive: true });
    messageInput.addEventListener('focus', focusHandler);
    
    // Handle Android keyboard resize
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            setTimeout(resize, 100);
        });
    }
}

// File handling
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        if (!attachedFiles.find(f => f.name === file.name && f.size === file.size)) {
            attachedFiles.push(file);
        }
    });
    updateAttachmentsPreview();
    
    // Reset input
    e.target.value = '';
}

function updateAttachmentsPreview() {
    if (!attachmentsPreview) return;
    
    attachmentsPreview.innerHTML = '';
    
    if (attachedFiles.length === 0) {
        attachmentsPreview.style.display = 'none';
        return;
    }
    
    attachmentsPreview.style.display = 'flex';
    attachedFiles.forEach((file, index) => {
        const preview = document.createElement('div');
        preview.className = 'attachment-item';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);
            preview.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.innerHTML = '📄';
            preview.appendChild(icon);
        }
        
        const info = document.createElement('div');
        info.className = 'attachment-info';
        const name = document.createElement('span');
        name.className = 'attachment-name';
        name.textContent = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
        const size = document.createElement('span');
        size.className = 'attachment-size';
        size.textContent = formatFileSize(file.size);
        info.appendChild(name);
        info.appendChild(size);
        preview.appendChild(info);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'attachment-remove';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => {
            attachedFiles.splice(index, 1);
            updateAttachmentsPreview();
        };
        preview.appendChild(removeBtn);
        
        attachmentsPreview.appendChild(preview);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Story History Management
function loadStoryHistory() {
    const saved = localStorage.getItem('storyBotHistory');
    if (saved) {
        storyHistory = JSON.parse(saved);
    }
}

function saveStoryHistory() {
    localStorage.setItem('storyBotHistory', JSON.stringify(storyHistory));
}

function addToHistory(prompt, story) {
    const historyItem = {
        id: Date.now().toString(),
        prompt: prompt,
        story: story,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };
    
    storyHistory.unshift(historyItem);
    
    // Limit to last 50 stories
    if (storyHistory.length > 50) {
        storyHistory = storyHistory.slice(0, 50);
    }
    
    saveStoryHistory();
    renderHistory();
}

function deleteHistoryItem(id) {
    storyHistory = storyHistory.filter(item => item.id !== id);
    saveStoryHistory();
    renderHistory();
}

function loadHistoryItem(id) {
    const item = storyHistory.find(h => h.id === id);
    if (!item) return;
    
    // Clear current messages
    messagesContainer.innerHTML = '';
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
    
    // Load messages from history
    addMessage(item.prompt, 'user');
    addMessage(item.story, 'bot');
    
    currentHistoryId = id;
    renderHistory();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        historySidebar?.classList.add('hidden');
    }
}

function renderHistory() {
    if (!historyContent) return;
    
    historyContent.innerHTML = '';
    
    if (storyHistory.length === 0) {
        historyEmpty.style.display = 'block';
        historyContent.appendChild(historyEmpty);
        return;
    }
    
    historyEmpty.style.display = 'none';
    
    storyHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${currentHistoryId === item.id ? 'active' : ''}`;
        historyItem.onclick = () => loadHistoryItem(item.id);
        
        const title = item.prompt.length > 50 ? item.prompt.substring(0, 50) + '...' : item.prompt;
        const preview = item.story.length > 100 ? item.story.substring(0, 100) + '...' : item.story;
        
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-date">${item.date} ${item.time}</div>
                <button class="history-item-delete" onclick="event.stopPropagation(); deleteHistoryItem('${item.id}')" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            <div class="history-item-title">${escapeHtml(title)}</div>
            <div class="history-item-preview">${escapeHtml(preview)}</div>
        `;
        
        historyContent.appendChild(historyItem);
    });
}

// Make deleteHistoryItem globally available
window.deleteHistoryItem = deleteHistoryItem;

// Send Message
async function sendMessage() {
    if (!messageInput || !sendBtn) return;
    
    const userMessage = messageInput.value.trim();
    if (!userMessage && attachedFiles.length === 0) {
        // Show a brief feedback
        messageInput.focus();
        return;
    }
    
    // Prevent multiple sends
    if (sendBtn.disabled) return;
    
    // Hide welcome message
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }
    
    // Add user message with attachments
    addMessage(userMessage, 'user', attachedFiles.length > 0 ? [...attachedFiles] : []);
    
    // Clear input and attachments
    messageInput.value = '';
    messageInput.style.height = 'auto';
    attachedFiles = [];
    updateAttachmentsPreview();
    
    // Reset current history ID
    currentHistoryId = null;
    renderHistory();
    
    // Disable send button and prevent multiple clicks
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.style.pointerEvents = 'none';
    }
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Generate story (you can enhance this to consider image context in the future)
        const story = await generateStory(userMessage);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot message
        addMessage(story, 'bot');
        
        // Add to history
        addToHistory(userMessage, story);
        
    } catch (error) {
        hideTypingIndicator();
        const t = translations[currentLanguage];
        addMessage(t?.notifications?.error || 'Sorry, I encountered an error while generating your story. Please try again.', 'bot');
        console.error('Error:', error);
    } finally {
        // Re-enable send button
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            sendBtn.style.pointerEvents = 'auto';
        }
        
        // Focus input on mobile might cause keyboard issues, so delay it
        if (window.innerWidth > 768) {
            messageInput?.focus();
        } else {
            // On mobile, don't auto-focus to prevent keyboard popup
            setTimeout(() => {
                if (document.activeElement !== messageInput && messageInput) {
                    messageInput.focus();
                }
            }, 500);
        }
    }
}

// Generate Story
async function generateStory(prompt) {
    const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: `Write a creative and engaging story based on this prompt: "${prompt}". Make it vivid, descriptive, and captivating.`
                }
            ],
            model: settings.model,
            max_tokens: settings.maxTokens,
            temperature: settings.temperature
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the story from the response
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content.trim();
    } else {
        throw new Error('No story generated in response');
    }
}

// Add Message
function addMessage(text, type, files = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    let attachmentsHTML = '';
    if (files && files.length > 0) {
        attachmentsHTML = '<div class="message-attachments">';
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.className = 'message-attachment-image';
                img.onload = () => URL.revokeObjectURL(img.src);
                attachmentsHTML += img.outerHTML;
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = URL.createObjectURL(file);
                video.className = 'message-attachment-video';
                video.controls = true;
                video.onload = () => URL.revokeObjectURL(video.src);
                attachmentsHTML += video.outerHTML;
            } else {
                attachmentsHTML += `
                    <div class="message-attachment-file">
                        <div class="file-icon-large">📄</div>
                        <div class="file-info">
                            <div class="file-name">${escapeHtml(file.name)}</div>
                            <div class="file-size">${formatFileSize(file.size)}</div>
                        </div>
                    </div>
                `;
            }
        });
        attachmentsHTML += '</div>';
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${type === 'user' 
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>'
            }
        </div>
        <div class="message-content">
            ${attachmentsHTML}
            ${text ? `<div class="message-text">${escapeHtml(text)}</div>` : ''}
            <div class="message-time">${time}</div>
            <div class="message-actions">
                ${type === 'bot' ? `
                    <button class="action-btn copy-btn" onclick="copyToClipboard(this)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        ${translations[currentLanguage]?.actions?.copy || 'Copy'}
                    </button>
                    <button class="action-btn regenerate-btn" onclick="regenerateStory(this)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                        ${translations[currentLanguage]?.actions?.regenerate || 'Regenerate'}
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Copy to Clipboard
function copyToClipboard(btn) {
    const messageText = btn.closest('.message-content').querySelector('.message-text').textContent;
    const t = translations[currentLanguage];
    
    navigator.clipboard.writeText(messageText).then(() => {
        showNotification(t?.notifications?.copied || 'Story copied to clipboard!');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ${t?.actions?.copied || 'Copied!'}
        `;
        setTimeout(() => {
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                ${t?.actions?.copy || 'Copy'}
            `;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification(t?.notifications?.copyError || 'Failed to copy story', 'error');
    });
}

// Regenerate Story
async function regenerateStory(btn) {
    // Find the user message that prompted this story
    const messageDiv = btn.closest('.message');
    const userMessages = document.querySelectorAll('.message.user .message-text');
    const t = translations[currentLanguage];
    
    if (userMessages.length === 0) return;
    
    const lastUserMessage = userMessages[userMessages.length - 1].textContent;
    
    // Disable button
    btn.disabled = true;
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loading"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
        ${t?.actions?.regenerating || 'Regenerating...'}
    `;
    
    showTypingIndicator();
    
    try {
        const newStory = await generateStory(lastUserMessage);
        hideTypingIndicator();
        
        // Update the message content
        const messageText = messageDiv.querySelector('.message-text');
        messageText.textContent = newStory;
        
        // Update timestamp
        const messageTime = messageDiv.querySelector('.message-time');
        messageTime.textContent = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        showNotification(t?.notifications?.regenerated || 'Story regenerated!');
    } catch (error) {
        hideTypingIndicator();
        showNotification(t?.notifications?.error || 'Failed to regenerate story', 'error');
        console.error('Error:', error);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            ${t?.actions?.regenerate || 'Regenerate'}
        `;
    }
}

// Clear Chat
function clearChat() {
    if (messagesContainer.children.length === 0) return;
    const t = translations[currentLanguage];
    
    if (confirm(t?.actions?.clearConfirm || 'Are you sure you want to clear all messages?')) {
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            welcomeMessage.style.display = 'block';
        }
        currentHistoryId = null;
        renderHistory();
        scrollToBottom();
    }
}

// Settings Modal
function openSettings() {
    settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSettings() {
    settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Typing Indicator
function showTypingIndicator() {
    typingIndicator.classList.add('active');
    scrollToBottom();
}

function hideTypingIndicator() {
    typingIndicator.classList.remove('active');
}

// Scroll to Bottom (Android compatible)
function scrollToBottom() {
    setTimeout(() => {
        if (messagesWrapper) {
            // Use scrollTop for better Android compatibility
            messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
            // Try smooth scroll as fallback
            try {
                messagesWrapper.scrollTo({
                    top: messagesWrapper.scrollHeight,
                    behavior: 'smooth'
                });
            } catch (e) {
                // Fallback for older Android browsers
                messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
            }
        }
    }, 100);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `copy-success ${type === 'error' ? 'error' : ''}`;
    notification.style.background = type === 'error' ? 'var(--error-color)' : 'var(--success-color)';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Settings Management
function saveSettings() {
    localStorage.setItem('storyBotSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('storyBotSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
    }
    
    // Update UI
    temperatureSlider.value = settings.temperature;
    tempValue.textContent = settings.temperature.toFixed(1);
    maxTokensSlider.value = settings.maxTokens;
    tokensValue.textContent = settings.maxTokens;
    modelSelect.value = settings.model;
}

// Make functions globally available for inline onclick handlers
window.copyToClipboard = copyToClipboard;
window.regenerateStory = regenerateStory;

