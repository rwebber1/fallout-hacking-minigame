/*
    FALLOUT THEMED CAPTIVE PORTAL
    
        TODO:
        - lockout function and effect
        - access granted function and effect
        - stylized interface
        - intro effect
        - typing effect for entry line
        - typing sounds on hovers
        - click sound on clicked
        - success sound for access
        - fix console bug when clicking a special after it was already used
*/

// Globals
const wordList = ["STATING" , "HEALING" , "COSTING", "REASONS", "SEASIDE", "SPARING", "CAUSING", "CRAFTED", "PRISONS", "PRESENT", "DEALING", 
    "SETTING", "LEAVING", "VERSION",  "DEATHLY", "BLAZING", "GRANITE",  "TESTING", "TRAITOR", "STAMINA", "TRINITY",  "CALLING", "TALKING", 
    "ACQUIRE", "WELCOME", "DECRIES",  "FALLING", "PACKING", "ALLOWED", "SELLING", "AFFRONT", "WALKING"];
const symbols = "~#!\"$%^&*()_-+=[]{}?/,."
const wordLength = wordList[0].length;
const selectedWords = wordList.sort(() => 0.5 - Math.random()).slice(0,11);
const correctPassword = selectedWords[Math.floor(Math.random() * wordLength)];
const MAX_ROWS = 17;
const ROW_SIZE = 12;
const MAX_LOGS = 15;

let attempts = 4;
let special_count = 0;

console.log("Correct Word:", correctPassword)

document.addEventListener("DOMContentLoaded", () => {
    generateTerminalDisplay();
    setupWordInteraction();
    setupSymbolInteraction();
    setupSpecialInteraction();
});

document.querySelector('.terminal-body').addEventListener('mouseenter', function (event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        entry = document.getElementById('entry');
        if(event.target.classList.contains('word')){
            word = event.target.getAttribute('word-id')
            word_span = document.querySelectorAll(`[word-id="${word}"]`)
            word_span.forEach(span => {span.classList.add('highlight')})
            entry.textContent = word
        }
        else if (event.target.classList.contains('special-start')){
            special_id = event.target.getAttribute('root-id')
            special_span = document.getElementsByClassName(`special-${special_id}`)
            for (let i = 0; i < special_span.length; i++) {
                special_span[i].classList.add('highlight')
              }
            special_input = event.target.getAttribute('special-input')
            entry.textContent = special_input
        }
        else if (event.target.classList.contains('symbol')){
            entry.textContent = `${event.target.textContent}`
        }
    }
}, true);

document.querySelector('.terminal-body').addEventListener('mouseleave', function (event) {
    if (event.target.tagName.toLowerCase() === 'span' && event.target.classList != 'hex-address') {
        entry = document.getElementById('entry');
        entry.innerHTML = '';  // Reset to just '>' when mouse leaves
        unhighlight()
    }
}, true);

function generateTerminalDisplay() {
    var word_list = [...selectedWords]
    var data_array_col1 = document.getElementById('column2')
    var data_array_col2 = document.getElementById('column4')

    generateHexAddresses();
    generateData(data_array_col1, word_list);
    generateData(data_array_col2, word_list);
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

function generateData(data_array, word_list) {
    var symbolSinceWord = 0
    var row_count = 0
    var word = []
    var current_word = ""

    while (row_count < MAX_ROWS) {
        var current_span = document.createElement("span")
        current_span.classList.add("data")
        while (current_span.childElementCount <= ROW_SIZE) {
            // Add symbol
            if ((Math.floor(Math.random() * 101) < 97) && (word.length === 0)) {  // 97% Chance AND No Current Word                                  
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
            else if (word_list.length != 0 &&                                                                 // Word List Not Empty
                    (((current_span.childElementCount + wordLength) < ROW_SIZE) || row_count < (MAX_ROWS-1))      // Room for Word AND Not Last Row
                    && (symbolSinceWord > 7) ){                                                                   // Minimum 7 Symbols Between Words
                let word_position = Math.floor(Math.random() * word_list.length)
                current_word = word_list[word_position]
                for (let i = 0; i < current_word.length; i++) { word.push(current_word.charAt(i)) }
                word_list.splice(word_position, 1)
                symbolSinceWord = 0
            }
        }
        finished_span = addSpecial(current_span)
        data_array.appendChild(finished_span)
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

function addSpecial(parentSpan) {
    const bracketPairs = ['{}', '[]', '()', '<>'];

    // Get all the child spans inside the parent span
    const spans = parentSpan.querySelectorAll('span');

    // Convert spans text to a single string
    let spanText = '';
    spans.forEach(span => spanText += span.textContent);

    // Loop through each pair of brackets
    for (let pair of bracketPairs) {
        let openBracket = pair[0];
        let closeBracket = pair[1];

        // Use a stack to find matching bracket pairs
        let stack = [];
        for (let i = 0; i < spanText.length; i++) {
            let char = spanText[i];
            
            if (char === openBracket) {
                stack.push(i); // Push index of the open bracket
            } else if (char === closeBracket) {
                if (stack.length > 0) {
                    let openIndex = stack.pop(); // Matching open bracket index
                    let special = spanText.slice(openIndex, i + 1)

                    // Check if the match contains any letters (if it does, skip the match)
                    if (/[a-zA-Z]/.test(special)) {
                        continue; // Skip this match, as it contains letters
                    }

                    special_count++
                    let match_count = `${special_count}`
                    // Set root character attributes
                    spans[openIndex].classList.add('special-start')
                    spans[openIndex].setAttribute('root-id', match_count)
                    spans[openIndex].setAttribute('special-input', special)
                    spans[openIndex].classList.remove('symbol')
                    // Add class to all characters between the matching brackets
                    for (let j = openIndex; j <= i; j++) {
                        spans[j].classList.add(`special-${match_count}`)
                    }
                }
            }
        }
    }
    return parentSpan
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

function setupSpecialInteraction() {
    const specialElements = document.querySelectorAll('.special-start')
    specialElements.forEach(special => {
        special.addEventListener('click', () => {
            const selectedSpecial = special.getAttribute('root-id')
            handleSpecial(selectedSpecial)
        })
    })
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

function handleSpecial(special_id) {
    special_span = document.getElementsByClassName(`special-${special_id}`)
    addSubmissionMessage(special_span[0].getAttribute('special-input'))

    /* Dud Removal Logic */
    if((Math.floor(Math.random() * 10) < 7) &&          // 70% Dud Removal
        (selectedWords.length > 1)) {                   // Not Last Word
        let dud_position = Math.floor(Math.random() * selectedWords.length)
        var dud = selectedWords[dud_position]
    
        while(dud === correctPassword){                 // Change Word if Password
            dud_position = Math.floor(Math.random() * selectedWords.length)
            dud = selectedWords[dud_position]
        }

        var dud_span = document.querySelectorAll(`[word-id="${dud}"]`)
        for(let i = 0; i < dud_span.length; i++) {
            dud_span[i].textContent = '.'
            dud_span[i].classList.remove('word')
            dud_span[i].removeAttribute('word-id')
            dud_span[i].classList.add('symbol')
        }
        selectedWords.splice(dud_position, 1)
        addSubmissionMessage("Dud removed.")
    }
    /* Replenish Allowance Logic */
    else{
        attempts = 4
        updateAttemptsDisplay()
        document.querySelector('.terminal-message').textContent = "ENTER PASSWORD NOW"
        document.querySelector('.terminal-message').classList.remove("blinker")
        addSubmissionMessage("Allowance")
        addSubmissionMessage("replenished")
    }

    unhighlight()
    special_span[0].classList.remove('special-start')
    special_span[0].removeAttribute('special-input')
    special_span[0].removeAttribute('root-id')
    special_span[0].classList.add('symbol')
    while (special_span.length > 0) {
        i = special_span.length-1
        special_span[i].classList.remove(`special-${special_id}`)
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
        document.querySelector('.terminal-message').textContent = "!!! WARNING: LOCKOUT IMMINENT !!!"
        document.querySelector('.terminal-message').classList.add("blinker")
    }
    else if (attempts === 0) {
        addSubmissionMessage("Lockout in")
        addSubmissionMessage("progress.")
    }
}

function unhighlight() {
    let highlights = document.querySelectorAll('.highlight')
    for (let i = 0; i < highlights.length; i++) {
        highlights[i].classList.remove('highlight')
    }
}
