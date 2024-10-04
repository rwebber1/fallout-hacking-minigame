
// Globals
const wordList = ["MUTANT", "BUTANE", "ARCADE", "UNMASK", "PYRONE"];
const wordLength = 6;
const symbols = "~#!\"$%^&*()_-+=[]{}?/,."
const correctPassword = wordList[Math.floor(Math.random() * wordList.length)];
const MAX_ROWS = 17;
const ROW_SIZE = 12;
const MAX_LOGS = 15;

let attempts = 4;

console.log("Correct Word:", correctPassword)

document.addEventListener("DOMContentLoaded", () => {
    generateTerminalDisplay();
    setupWordInteraction();
    setupSymbolInteraction();
});

document.addEventListener('mouseenter', function (event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        entry = document.getElementById('entry');
        if(event.target.classList.contains('word')){
            word = event.target.getAttribute('word-id')
            word_span = document.querySelectorAll(`[word-id="${word}"]`)
            word_span.forEach(span => {span.classList.add('highlight')})
            entry.textContent = word
        }
        else if (event.target.classList.contains('symbol')){
            entry.textContent = `${event.target.textContent}`
        }
    }
}, true);

document.addEventListener('mouseleave', function (event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        entry = document.getElementById('entry');
        if(event.target.classList.contains('word')){
            word = event.target.getAttribute('word-id')
            word_span = document.querySelectorAll(`[word-id="${word}"]`)
            word_span.forEach(span => {span.classList.remove('highlight')})
        }
        entry.innerHTML = '';  // Reset to just '>' when mouse leaves
    }
}, true);

function generateTerminalDisplay() {
    var data_array_col1 = document.getElementById('column2')
    var data_array_col2 = document.getElementById('column4')

    generateHexAddresses();
    generateData(data_array_col1);
    generateData(data_array_col2);
}

function generateHexAddresses() {
    let hex_array1 = [];
    let hex_array2 = [];

    let hex_array_col1 = document.getElementById('column1')
    let hex_array_col2 = document.getElementById('column3')

    let startHex = getRandomHex(); // Create random hex value with 4 characters

    hex_array1 = generateHexArray(startHex, MAX_ROWS);
    hex_array2 = generateHexArray(hex_array1[hex_array1.length - 1], MAX_ROWS);

    for (i = 0; i < hex_array1.length; i++) {
        let new_span1 = document.createElement("span")
        new_span1.textContent = hex_array1[i]
        new_span1.classList.add("hex-address")
        hex_array_col1.appendChild(new_span1)

        let new_span2 = document.createElement("span")
        new_span2.textContent = hex_array2[i]
        new_span2.classList.add("hex-address")
        hex_array_col2.appendChild(new_span2)
    }
}

function generateData(data_array) {
    var symbolSinceWord = 0
    var row_count = 0
    var word = []
    var current_word = ""

    while (row_count < MAX_ROWS) {
        var current_span = document.createElement("span")
        current_span.classList.add("data")
        while (current_span.childElementCount <= ROW_SIZE) {
            // Add symbol
            if (((Math.floor(Math.random() * 11) < 10) &&           // 90% chance 
                (word.length === 0)) ||                             // No Current Word
                (symbolSinceWord < 7)) {                            // Minimum 7 symbols between words       
                let new_symbol = document.createElement("span")
                new_symbol.classList.add("symbol")
                new_symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)]
                current_span.appendChild(new_symbol)
                symbolSinceWord++
            }
            // Finish word
            else if (word.length > 0) {
                let new_character = document.createElement("span")
                new_character.classList.add("word")
                new_character.setAttribute('word-id', current_word)
                new_character.textContent = word[0]
                current_span.appendChild(new_character)
                word.shift()
            }
            // Add word
            else if (wordList.length != 0) {
                let word_position = Math.floor(Math.random() * wordList.length)
                current_word = wordList[word_position]
                for (let i = 0; i < current_word.length; i++) { word.push(current_word.charAt(i)) }
                wordList.splice(word_position, 1)
                symbolSinceWord = 0
            }
        }
        data_array.appendChild(current_span)
        row_count++
    }
}

// Function to generate a random hex with at most 4 characters (max 0xFFFF)
function getRandomHex() {
    return Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
}

// Function to generate an array of incremented hex values
function generateHexArray(startHex, length) {

    let hexArray = [];
    let currentHex = parseInt(startHex, 16); // Convert start hex to an integer

    for (let i = 0; i < length; i++) {
        hexArray.push("0x" + currentHex.toString(16).toUpperCase().padStart(4, '0') + "\n"); // Store as hex, padding to 4 chars
        currentHex++; // Increment the hex value
    }

    return hexArray;
}

function setupWordInteraction() {
    const wordElements = document.querySelectorAll('.word');
    wordElements.forEach(word => {
        word.addEventListener('click', () => {
            const selectedWord = word.getAttribute('word-id');
            checkGuess(selectedWord);
        });
    });
}

function setupSymbolInteraction() {
    const symbolElements = document.querySelectorAll('.symbol');
    symbolElements.forEach(symbol => {
        symbol.addEventListener('click', () => {
            const selectedSymbol = symbol.textContent;
            checkGuess(selectedSymbol);
        });
    });
}

function checkGuess(userGuess) {
    if (attempts > 0 && userGuess.length === correctPassword.length) {
        let correctLetters = 0;

        for (let i = 0; i < userGuess.length; i++) {
            if (userGuess[i] === correctPassword[i]) correctLetters++;
        }

        if (correctLetters === correctPassword.length) {
            addSubmissionMessage(userGuess)
            addSubmissionMessage("Exact Match!")
            addSubmissionMessage("Please wait")
            addSubmissionMessage("while system")
            addSubmissionMessage("is accessed.")
            //window.location.href = 'https://your-guest-portal-url.com'; // Success, redirect user
        }
        else{
            addSubmissionMessage(userGuess)
            addSubmissionMessage("Entry Denied")
            addSubmissionMessage(`${correctLetters}/${correctPassword.length} correct.`)
            attempts--;
            updateAttemptsDisplay();
        }
    }
    else if(userGuess.length === 1 && symbols.includes(userGuess)){
        addSubmissionMessage(userGuess)
        addSubmissionMessage("Error")
    }
}

function addSubmissionMessage(message) {
    let submission_logs = document.getElementById('submission-log')
    submission_logs.innerHTML += '>' + message + "<br>"
    while(submission_logs.childElementCount > MAX_LOGS) {
        submission_logs.removeChild(submission_logs.firstChild)
    }
    document.getElementById('submission-log').innerHTML = submission_logs.innerHTML
}

function updateAttemptsDisplay() {
    const attemptsElement = document.querySelector('.attempts-left');
    attemptsElement.innerText = `${attempts} Attempt(s) Left: ${' █ '.repeat(attempts)}${' '.repeat(4 - attempts)}`;
    if(attempts === 1){
        document.querySelector('.terminal-message').innerText = "!!! WARNING: LOCKOUT IMMINENT !!!"
        document.querySelector('.terminal-message').className = "blinker"
    }
    if (attempts === 0) {
        addSubmissionMessage("Lockout in")
        addSubmissionMessage("progress.")
    }
}
