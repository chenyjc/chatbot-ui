const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.querySelector('.input-container button');

function updateSendButtonState() {
    const isEmpty = !userInput.value.trim();
    sendButton.disabled = isEmpty || isStreaming;
    sendButton.style.opacity = isEmpty || isStreaming ? '0.5' : '1';
    sendButton.style.cursor = isEmpty || isStreaming ? 'not-allowed' : 'pointer';
}

userInput.addEventListener('input', updateSendButtonState);
userInput.addEventListener('keydown', function(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        if (!sendButton.disabled) {
            sendMessage();
        }
    }
});

function addMessage(content, isUser = false, isMarkdown = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : ''}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    if (isMarkdown) {
        if (typeof marked !== 'undefined') {
            messageContent.innerHTML = marked.marked(content);
        } else {
            console.error('Marked library is not available.');
            messageContent.innerHTML = content;
        }
    } else {
        messageContent.innerHTML = content;
    }

    messageWrapper.appendChild(messageContent);

    // Only add action buttons for bot messages
    if (!isUser) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        // Like button
        const likeBtn = document.createElement('button');
        likeBtn.className = 'action-button';
        likeBtn.innerHTML = '<i class="far fa-thumbs-up"></i>';
        likeBtn.onclick = function() {
            const dislikeBtn = this.nextElementSibling;
            if (this.classList.contains('liked')) {
                this.classList.remove('liked');
                this.querySelector('i').className = 'far fa-thumbs-up';
            } else {
                this.classList.add('liked');
                this.querySelector('i').className = 'fas fa-thumbs-up';
                dislikeBtn.classList.remove('disliked');
                dislikeBtn.querySelector('i').className = 'far fa-thumbs-down';
            }
        };

        // Dislike button
        const dislikeBtn = document.createElement('button');
        dislikeBtn.className = 'action-button';
        dislikeBtn.innerHTML = '<i class="far fa-thumbs-down"></i>';
        dislikeBtn.onclick = function() {
            const likeBtn = this.previousElementSibling;
            if (this.classList.contains('disliked')) {
                this.classList.remove('disliked');
                this.querySelector('i').className = 'far fa-thumbs-down';
            } else {
                this.classList.add('disliked');
                this.querySelector('i').className = 'fas fa-thumbs-down';
                likeBtn.classList.remove('liked');
                likeBtn.querySelector('i').className = 'far fa-thumbs-up';
                
                // Show feedback form
                createFeedbackForm(this);
            }
        };

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-button';
        copyBtn.innerHTML = '<i class="far fa-clone"></i>';
        copyBtn.onclick = function() {
            navigator.clipboard.writeText(messageContent.textContent).then(() => {
                const originalIcon = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalIcon;
                }, 2000);
            });
        };

        // Voice output button
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'action-button';
        voiceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        voiceBtn.onclick = function() {
            toggleVoiceOutput(messageContent.textContent, this);
        };

        actionsDiv.appendChild(likeBtn);
        actionsDiv.appendChild(dislikeBtn);
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(voiceBtn);
        messageWrapper.appendChild(actionsDiv);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageWrapper);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typing-indicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        indicator.appendChild(dot);
    }
    
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

let isStreaming = false;

function addRelatedQuestions(messageWrapper) {
    const relatedQuestions = [
        "Would you like to know more about this topic?",
        "Need me to explain any specific concept?",
        "Want to see some practical examples?"
    ];

    const questionsDiv = document.createElement('div');
    questionsDiv.className = 'suggested-questions';

    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container';

    relatedQuestions.forEach(question => {
        const button = document.createElement('button');
        button.className = 'question-button';
        button.textContent = question;
        button.onclick = () => {
            userInput.value = question;
            // Remove current message suggestions
            const suggestedQuestions = messageWrapper.querySelector('.suggested-questions');
            if (suggestedQuestions) {
                suggestedQuestions.remove();
            }
            sendMessage();
        };
        questionsContainer.appendChild(button);
    });

    questionsDiv.appendChild(questionsContainer);
    messageWrapper.appendChild(questionsDiv);
}

function streamMessage(message, messageContent, stopButton, actionsDiv, messageWrapper, isMarkdown = false) {
    return new Promise((resolve) => {
        let index = 0;
        isStreaming = true;
        updateSendButtonState();
        
        const interval = setInterval(() => {
            if (!isStreaming) {
                clearInterval(interval);
                stopButton.remove();
                actionsDiv.classList.add('visible');
                addRelatedQuestions(messageWrapper);
                isStreaming = false;
                updateSendButtonState();
                resolve();
                return;
            }

            if (isMarkdown) {
                if (typeof marked !== 'undefined') {
                    messageContent.innerHTML = marked.marked(message.slice(0, index));
                } else {
                    console.error('Marked library is not available.');
                    messageContent.innerHTML = message.slice(0, index);
                }
            } else {
                messageContent.innerHTML = message.slice(0, index);
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
            index++;
            
            if (index === message.length) {
                clearInterval(interval);
                stopButton.remove();
                actionsDiv.classList.add('visible');
                addRelatedQuestions(messageWrapper);
                isStreaming = false;
                updateSendButtonState();
                resolve();
            }
        }, 30);
    });
}

async function sendMessage() {
    if (isStreaming || !userInput.value.trim()) return;
    
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove typing indicator
    removeTypingIndicator();

    // Create bot message elements
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';

    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'message-wrapper';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = '';

    messageWrapper.appendChild(messageContent);

    // Create action buttons (hidden by default)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // Like button
    const likeBtn = document.createElement('button');
    likeBtn.className = 'action-button';
    likeBtn.innerHTML = '<i class="far fa-thumbs-up"></i>';
    likeBtn.onclick = function() {
        const dislikeBtn = this.nextElementSibling;
        if (this.classList.contains('liked')) {
            this.classList.remove('liked');
            this.querySelector('i').className = 'far fa-thumbs-up';
        } else {
            this.classList.add('liked');
            this.querySelector('i').className = 'fas fa-thumbs-up';
            dislikeBtn.classList.remove('disliked');
            dislikeBtn.querySelector('i').className = 'far fa-thumbs-down';
        }
    };

    // Dislike button
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'action-button';
    dislikeBtn.innerHTML = '<i class="far fa-thumbs-down"></i>';
    dislikeBtn.onclick = function() {
        const likeBtn = this.previousElementSibling;
        if (this.classList.contains('disliked')) {
            this.classList.remove('disliked');
            this.querySelector('i').className = 'far fa-thumbs-down';
        } else {
            this.classList.add('disliked');
            this.querySelector('i').className = 'fas fa-thumbs-down';
            likeBtn.classList.remove('liked');
            likeBtn.querySelector('i').className = 'far fa-thumbs-up';
            
            // Show feedback form
            createFeedbackForm(this);
        }
    };

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-button';
    copyBtn.innerHTML = '<i class="far fa-clone"></i>';
    copyBtn.onclick = function() {
        navigator.clipboard.writeText(messageContent.textContent).then(() => {
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalIcon;
            }, 2000);
        });
    };

    // Voice output button
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'action-button';
    voiceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    voiceBtn.onclick = function() {
        toggleVoiceOutput(messageContent.textContent, this);
    };

    actionsDiv.appendChild(likeBtn);
    actionsDiv.appendChild(dislikeBtn);
    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(voiceBtn);
    messageWrapper.appendChild(actionsDiv);

    // Create stop button
    const stopButton = document.createElement('button');
    stopButton.className = 'stop-button';
    stopButton.innerHTML = '<i class="fas fa-stop"></i>Stop';
    stopButton.onclick = function() {
        isStreaming = false;
    };

    messageWrapper.appendChild(stopButton);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageWrapper);
    chatMessages.appendChild(messageDiv);

    // Simulate response text
    const response = "This is a **simulated** streaming response. In a real implementation, you would connect to your backend API and handle the streaming response accordingly.";
    
    // Show response with typing effect
    await streamMessage(response, messageContent, stopButton, actionsDiv, messageWrapper, true);
}

// Create feedback form
function createFeedbackForm(dislikeBtn) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const form = document.createElement('div');
    form.className = 'feedback-form';
    
    form.innerHTML = `
        <h3>Please share your feedback</h3>
        <textarea placeholder="Please describe your suggestions to help us improve..."></textarea>
        <div class="buttons">
            <button class="cancel" onclick="removeFeedbackForm()">Cancel</button>
            <button onclick="submitFeedback(this)">Submit</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(form);
}

function removeFeedbackForm() {
    const overlay = document.querySelector('.overlay');
    const form = document.querySelector('.feedback-form');
    if (overlay) overlay.remove();
    if (form) form.remove();
}

function submitFeedback(button) {
    const form = button.closest('.feedback-form');
    const feedback = form.querySelector('textarea').value;
    
    // Here you can add logic to send feedback to server
    console.log('Feedback:', feedback);
    
    removeFeedbackForm();
}

// Add suggested questions
function addSuggestedQuestions() {
    const suggestedQuestions = [
        "What is artificial intelligence?",
        "What can you help me with?",
        "Can you write code for me?"
    ];

    const questionsDiv = document.createElement('div');
    questionsDiv.className = 'suggested-questions';

    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'welcome-message';
    welcomeMsg.textContent = '👋 Hi! I\'m AI Assistant. You can ask me these questions:';
    questionsDiv.appendChild(welcomeMsg);

    const questionsContainer = document.createElement('div');
    questionsContainer.className = 'questions-container';

    suggestedQuestions.forEach(question => {
        const button = document.createElement('button');
        button.className = 'question-button';
        button.textContent = question;
        button.onclick = () => {
            userInput.value = question;
            // Remove initial suggestions
            questionsDiv.remove();
            sendMessage();
        };
        questionsContainer.appendChild(button);
    });

    questionsDiv.appendChild(questionsContainer);
    chatMessages.appendChild(questionsDiv);
}

// Check and apply saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle i');
    
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeToggle.className = 'fas fa-sun';
    }
    
    addSuggestedQuestions();
    updateSendButtonState();

    if (typeof marked === 'undefined') {
        console.error('Marked library is not loaded.');
    } else {
        console.log('Marked library loaded successfully.');
    }
});

// Voice related variables
let isListening = false;
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;

// Add global recognition object
let recognition = null;
let isSpeechSupported = ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

// Voice input function
function toggleVoiceInput() {
    const voiceInputBtn = document.getElementById('voice-input');
    
    // Check browser support
    if (!isSpeechSupported) {
        alert('Your browser does not support voice input. Please use Chrome or Edge.');
        voiceInputBtn.disabled = true;
        return;
    }

    // Check microphone permissions
    if (navigator.permissions) {
        navigator.permissions.query({name: 'microphone'}).then(permissionStatus => {
            if (permissionStatus.state === 'denied') {
                alert('Microphone access is denied. Please enable it in your browser settings.');
                voiceInputBtn.disabled = true;
                return;
            }
        });
    }

    // Initialize recognition object
    if (!recognition) {
        try {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                isListening = false;
                voiceInputBtn.classList.remove('active');
                voiceInputBtn.title = 'Click to start voice input';
                
                let errorMessage = 'Voice input error: ';
                switch(event.error) {
                    case 'no-speech':
                        errorMessage += 'No speech was detected.';
                        break;
                    case 'audio-capture':
                        errorMessage += 'No microphone was found.';
                        break;
                    case 'not-allowed':
                        errorMessage += 'Microphone access was denied.';
                        break;
                    default:
                        errorMessage += event.error;
                }
                alert(errorMessage);
            };
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
            alert('Failed to initialize voice input. Please try again.');
            return;
        }
    }
    
    if (!isListening) {
        // Start voice input
        recognition.onstart = () => {
            isListening = true;
            voiceInputBtn.classList.add('active');
            voiceInputBtn.title = 'Click to stop voice input';
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            userInput.value = transcript;
            updateSendButtonState();
        };

        recognition.onend = () => {
            isListening = false;
            voiceInputBtn.classList.remove('active');
            voiceInputBtn.title = 'Click to start voice input';
        };

        recognition.onerror = null; // Error handling moved to initialization

        try {
            recognition.start();
        } catch (error) {
            console.error('Speech recognition start error:', error);
            alert('Failed to start voice input. Please try again.');
        }
    } else {
        // Stop voice input
        try {
            recognition.stop();
        } catch (error) {
            console.error('Speech recognition stop error:', error);
        }
        isListening = false;
        voiceInputBtn.classList.remove('active');
        voiceInputBtn.title = 'Click to start voice input';
    }
}

// Voice output function
function toggleVoiceOutput(text, button) {
    if (currentUtterance) {
        // If currently playing, stop
        speechSynthesis.cancel();
        currentUtterance = null;
        // Reset all voice buttons
        document.querySelectorAll('.action-button i.fa-volume-up').forEach(icon => {
            icon.className = 'fas fa-volume-up';
        });
        return;
    }

    // Start
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.onend = () => {
        currentUtterance = null;
        button.querySelector('i').className = 'fas fa-volume-up';
    };
    speechSynthesis.speak(currentUtterance);
    button.querySelector('i').className = 'fas fa-volume-mute';
}
