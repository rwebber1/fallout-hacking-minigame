
// Globals
const wordList = ["MUTANT", "BUTANE", "ACADE", "UNMASK", "PYRONE"];
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

document.addEventListener('mouseover', function(event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        const entry = document.getElementById('entry');
        entry.innerHTML = `${event.target.textContent}`;
    }
});

document.addEventListener('mouseout', function(event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        const entry = document.getElementById('entry');
        entry.innerHTML = '';  // Reset to just '>' when mouse leaves
    }
});

function generateTerminalDisplay() {
    generateHexAddresses();
    generateData();
}

function generateHexAddresses() {
    let hex_array1 = [];
    let hex_array2 = [];
    
    let hex_array_col1 = document.getElementById('column1')
    let hex_array_col2 = document.getElementById('column3')

    let startHex = getRandomHex(); // Create random hex value with 4 characters

    hex_array1 = generateHexArray(startHex, MAX_ROWS);
    hex_array2 = generateHexArray(hex_array1[hex_array1.length-1], MAX_ROWS);

    for(i = 0; i < hex_array1.length; i++){
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

function generateData() {
    let data_array_col1 = document.getElementById('column2')
    let data_array_col2 = document.getElementById('column4')

    // For loop for each row
    for (let i = 0; i < MAX_ROWS; i++) {
        let row_span1 = document.createElement("span")
        let row_span2 = document.createElement("span")

        row_span1.classList.add("data")
        row_span2.classList.add("data")

        // For loop for each row's characters
        for(let j = 0; j < ROW_SIZE; j++) {
            var newsymbol1 = document.createElement("span")
            var newsymbol2 = document.createElement("span")

            newsymbol1.textContent = symbols[Math.floor(Math.random() * symbols.length)]
            newsymbol2.textContent = symbols[Math.floor(Math.random() * symbols.length)]

            newsymbol1.classList.add("symbol")
            newsymbol2.classList.add("symbol")

            row_span1.appendChild(newsymbol1)
            row_span2.appendChild(newsymbol2)
        }

        data_array_col1.appendChild(row_span1)
        data_array_col2.appendChild(row_span2)
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

var hover = function(span) {
    // unhighlightAll();
    if (symbolSpansRight.includes(span)) {
        var pos = symbolSpansRight.indexOf(span);
        hackingCursorX = 12 + (pos % 12);
        hackingCursorY = Math.floor(pos / 12)
    } else {
        var pos = symbolSpansLeft.indexOf(span);
        hackingCursorX = pos % 12;
        hackingCursorY = Math.floor(pos / 12)
    }
    if (span.classList.contains("word")) {
        var word = span.attributes["data-word"];
        var wordSpans = document.getElementsByClassName("word-" + word);
        for (var i = 0; i < wordSpans.length; i += 1) {
            var wordSpan = wordSpans[i];
            wordSpan.classList.add("highlight")
        }
        // setEntry(word)\
        console.log(word)
    } else if (span.classList.contains("bracketroot")) {
        let bracketGroup = span.attributes["data-bracketroot"];
        let bracketStr = span.attributes["data-bracketstr"];
        var bracketSpans = document.getElementsByClassName("bracketpair-" + bracketGroup);
        for (let i = 0; i < bracketSpans.length; i += 1) {
            let bracketSpan = bracketSpans[i];
            bracketSpan.classList.add("highlight")
        }
        // setEntry(bracketStr)
        console.log(span.textContent)
    } else {
        // span.classList.add("highlight");
        // setEntry(span.textContent)
        console.log(span.textContent)
    }
};

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
