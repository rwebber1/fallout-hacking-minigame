
// Globals
const wordList = ["MUTANT", "BUTANE", "ACADE", "UNMASK", "PYRONE"];
const wordLength = 6;
const randomChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const symbols = "~#!\"$%^&*()_-+=[]{}?/,."
const correctPassword = wordList[Math.floor(Math.random() * wordList.length)];
const MAX_ROWS = 17;
const ROW_SIZE = 12;

let attempts = 4;

document.addEventListener("DOMContentLoaded", () => {
    generateTerminalDisplay();
    setupWordInteraction();
});

document.addEventListener('mouseover', function (event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        const entry = document.getElementById('entry');
        entry.innerHTML = `${event.target.textContent}`;
    }
});

document.addEventListener('mouseout', function (event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        const entry = document.getElementById('entry');
        entry.innerHTML = '';  // Reset to just '>' when mouse leaves
    }
});

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

// TODO: Generate content then organize OR Generate content while building
function generateData(data_array) {
    var symbolSinceWord = 0
    var row_count = 0
    var word = []

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
                new_character.textContent = word[0]
                current_span.appendChild(new_character)
                word.shift()
            }
            // Add word
            else if (wordList.length != 0) {
                let word_position = Math.floor(Math.random() * wordList.length)
                let new_word = wordList[word_position]
                for (let i = 0; i < new_word.length; i++) { word.push(new_word.charAt(i)) }
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
            const selectedWord = word.textContent;
            checkGuess(selectedWord);
        });
    });
}

function checkGuess(userGuess) {
    if (attempts > 0 && userGuess.length === correctPassword.length) {
        let correctLetters = 0;
        for (let i = 0; i < userGuess.length; i++) {
            if (userGuess[i] === correctPassword[i]) correctLetters++;
        }

        let feedbackMessage = `${correctLetters}/5 correct letters`;
        if (correctLetters === correctPassword.length) {
            feedbackMessage = "Access Granted! Welcome!";
            window.location.href = 'https://your-guest-portal-url.com'; // Success, redirect user
        }

        document.getElementById('submission-log').innerText = feedbackMessage;
        attempts--;
        updateAttemptsDisplay();
    }

    if (attempts <= 0) {
        document.getElementById('submission-log').innerText = "Access Denied. Please try again.";
        disableWordInteraction();
    }
}

function updateAttemptsDisplay() {
    const attemptsElement = document.querySelector('.attempts-left');
    attemptsElement.innerText = `${attempts} Attempt(s) Left: ${' █ '.repeat(attempts)}${' '.repeat(4 - attempts)}`;
}

function disableWordInteraction() {
    const wordElements = document.querySelectorAll('.word');
    wordElements.forEach(word => {
        word.style.pointerEvents = 'none';
    });
}
