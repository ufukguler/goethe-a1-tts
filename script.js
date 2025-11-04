let vocabData = [];

if (!('speechSynthesis' in window)) {
    alert('Your browser does not support text-to-speech. Please use a modern browser.');
}

function cleanTextForSpeech(text) {
    if (!text) return '';
    let cleaned = text.split(',')[0].trim();
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, '').trim();
    return cleaned;
}

function speakGerman(text) {
    if (!text) return;
    
    const cleanedText = cleanTextForSpeech(text);
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
}

function createSpeakButton(text, lang = 'de-DE') {
    const $button = $('<button>')
        .addClass('btn-speak')
        .html('🔊')
        .attr('title', 'Click to hear pronunciation')
        .on('click', function(e) {
            e.stopPropagation();
            if (lang === 'en-US') {
                speakEnglish(text);
            } else {
                speakGerman(text);
            }
        });
    return $button[0];
}

function speakEnglish(text) {
    if (!text) return;
    
    const cleanedText = cleanTextForSpeech(text);
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
}

async function loadVocabulary() {
    try {
        const response = await fetch('words_a1.csv');
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        vocabData = lines.map(line => {
            const parts = line.split(';');
            return {
                word: parts[0] || '',
                example: parts[1] || '',
                meaning: parts[2] || ''
            };
        });

        renderTable();
        updateSpeakButton();
        
        $('#pageLoadingOverlay').addClass('hidden');
        $('body').removeClass('loading-page');
    } catch (error) {
        console.error('Error loading vocabulary:', error);
        $('#pageLoadingOverlay .page-loading-content p').text('Error loading vocabulary file. Please refresh the page.');
        $('#pageLoadingOverlay .page-loading-content').append(
            '<p style="color: #e53e3e; margin-top: 10px; font-size: 14px;">Make sure words_a1.csv is in the same directory.</p>'
        );
        setTimeout(() => {
            $('#pageLoadingOverlay').addClass('hidden');
            $('body').removeClass('loading-page');
        }, 3000);
        $('#tableBody').html(
            '<tr><td colspan="4" style="color: red; text-align: center;">Error loading vocabulary file. Make sure words_a1.csv is in the same directory.</td></tr>'
        );
    }
}

function renderTable() {
    const $tbody = $('#tableBody');
    $tbody.empty();

    vocabData.forEach((item, index) => {
        const $row = $('<tr>')
            .attr('id', `word-row-${index}`)
            .addClass('clickable-row')
            .attr('title', 'Click to start reading from this word')
            .on('click', function(e) {
                if ($(e.target).closest('.btn-speak').length > 0) {
                    return;
                }
                const selection = window.getSelection();
                if (selection && selection.toString().trim().length > 0) {
                    return;
                }
                startReadingFromIndex(index);
            });
        
        const $wordCell = $('<td>').addClass('word-cell');
        const wordButton = createSpeakButton(item.word);
        const $wordSpan = $('<span>').addClass('word').text(item.word);
        $wordCell.append(wordButton).append($wordSpan);

        const $exampleCell = $('<td>').addClass('example-cell');
        const exampleButton = createSpeakButton(item.example);
        const $exampleSpan = $('<span>').addClass('example').text(item.example);
        $exampleCell.append(exampleButton).append($exampleSpan);

        const $meaningCell = $('<td>').addClass('meaning-cell');
        const $meaningSpan = $('<span>').addClass('meaning').text(item.meaning);
        $meaningCell.append($meaningSpan);

        const $indexCell = $('<td>').addClass('index-cell').text(index + 1);

        $row.append($indexCell).append($wordCell).append($exampleCell).append($meaningCell);
        $tbody.append($row);
    });
}

let isSpeaking = false;
let currentSpeakingIndex = -1;

const STORAGE_KEY = 'germanVocabProgress';

function saveProgress(index) {
    if (index >= 0 && index < vocabData.length) {
        localStorage.setItem(STORAGE_KEY, index.toString());
    }
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
        const index = parseInt(saved, 10);
        if (index >= 0 && index < vocabData.length) {
            return index;
        }
    }
    return -1;
}

function clearProgress() {
    localStorage.removeItem(STORAGE_KEY);
}

function updateSpeakButton() {
    const $speakButton = $('#speakButton');
    const savedIndex = loadProgress();
    if (savedIndex >= 0 && savedIndex < vocabData.length) {
        $speakButton.text('▶️ Continue');
    } else {
        $speakButton.text('🔊 Read All');
    }
}

function removeAllHighlights() {
    $('#tableBody tr').removeClass('highlight');
}

function highlightAndScrollToRow(index) {
    removeAllHighlights();
    const $row = $(`#word-row-${index}`);
    if ($row.length) {
        $row.addClass('highlight');
        $row[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function speakWordAndExample(index) {
    if (index >= vocabData.length || !isSpeaking) {
        isSpeaking = false;
        removeAllHighlights();
        clearProgress();
        updateSpeakButton();
        return;
    }

    currentSpeakingIndex = index;
    saveProgress(index);
    highlightAndScrollToRow(index);
    
    const item = vocabData[index];
    
    const cleanedWord = cleanTextForSpeech(item.word);
    const wordUtterance = new SpeechSynthesisUtterance(cleanedWord);
    wordUtterance.lang = 'de-DE';
    wordUtterance.rate = 0.9;
    wordUtterance.pitch = 1;
    wordUtterance.volume = 1;
    
    wordUtterance.onend = () => {
        if (!isSpeaking) return;
        
        setTimeout(() => {
            if (!isSpeaking) return;
            
            const exampleUtterance = new SpeechSynthesisUtterance(item.example);
            exampleUtterance.lang = 'de-DE';
            exampleUtterance.rate = 0.9;
            exampleUtterance.pitch = 1;
            exampleUtterance.volume = 1;
            
            exampleUtterance.onend = () => {
                if (!isSpeaking) return;
                setTimeout(() => {
                    speakWordAndExample(index + 1);
                }, 500);
            };
            
            window.speechSynthesis.speak(exampleUtterance);
        }, 500);
    };
    
    window.speechSynthesis.speak(wordUtterance);
}

function startReadingFromIndex(startIndex) {
    window.speechSynthesis.cancel();
    isSpeaking = true;
    
    if (startIndex < 0 || startIndex >= vocabData.length) {
        startIndex = 0;
    }
    
    currentSpeakingIndex = startIndex;
    saveProgress(startIndex);
    speakWordAndExample(startIndex);
    updateSpeakButton();
}

function speakAllWordsAndExamples() {
    const savedIndex = loadProgress();
    const startIndex = savedIndex >= 0 ? savedIndex : 0;
    startReadingFromIndex(startIndex);
}

function stopSpeech() {
    isSpeaking = false;
    window.speechSynthesis.cancel();
    removeAllHighlights();
    
    if (currentSpeakingIndex >= 0) {
        saveProgress(currentSpeakingIndex);
    }
    
    updateSpeakButton();
}

function resetProgress() {
    clearProgress();
    currentSpeakingIndex = -1;
    isSpeaking = false;
    window.speechSynthesis.cancel();
    removeAllHighlights();
    updateSpeakButton();
}

$(document).ready(function() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    currentSpeakingIndex = -1;
    
    loadVocabulary();
    
    $('#speakButton').on('click', speakAllWordsAndExamples);
    $('#stopButton').on('click', stopSpeech);
    $('#resetButton').on('click', resetProgress);
});

window.addEventListener('beforeunload', function() {
    window.speechSynthesis.cancel();
});

window.speechSynthesis.cancel();
