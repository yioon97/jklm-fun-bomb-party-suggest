// ==UserScript==
// @name         Word Suggester for jklm.fun
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Suggests 10 words containing the letters from the syllable div, prioritizing 5-letter words, and displays them at the top of the page whenever the syllable changes on jklm.fun. Includes a button to remove all generated elements.
// @author       You
// @match        https://*.jklm.fun/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    console.log("Script started.");

    // URL to the words list
    const wordsUrl = "https://raw.githubusercontent.com/yioon97/jklm-fun-bomb-party-suggest/refs/heads/main/5000-more-common.txt?token=GHSAT0AAAAAADAUSPUCT22QGRLWJIJFKS4UZ6YEATQ";

    // Create a fixed element to display the suggested words
    const suggestionBox = document.createElement('div');
    suggestionBox.style.position = 'fixed';
    suggestionBox.style.top = '50px'; // Adjusted to make space for the button
    suggestionBox.style.left = '50%';
    suggestionBox.style.transform = 'translateX(-50%)';
    suggestionBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    suggestionBox.style.color = 'white';
    suggestionBox.style.padding = '10px 20px';
    suggestionBox.style.borderRadius = '5px';
    suggestionBox.style.zIndex = '10000';
    suggestionBox.style.fontFamily = 'Arial, sans-serif';
    suggestionBox.style.fontSize = '20px';
    suggestionBox.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
    document.body.appendChild(suggestionBox);

    console.log("Suggestion box created and added to the page.");

    // Create a button to remove all generated elements
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove Suggestions';
    removeButton.style.position = 'fixed';
    removeButton.style.top = '10px';
    removeButton.style.left = '50%';
    removeButton.style.transform = 'translateX(-50%)';
    removeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    removeButton.style.color = 'white';
    removeButton.style.padding = '10px 20px';
    removeButton.style.border = 'none';
    removeButton.style.borderRadius = '5px';
    removeButton.style.zIndex = '10001'; // Ensure it's above the suggestion box
    removeButton.style.fontFamily = 'Arial, sans-serif';
    removeButton.style.fontSize = '16px';
    removeButton.style.cursor = 'pointer';
    removeButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.5)';
    document.body.appendChild(removeButton);

    console.log("Remove button created and added to the page.");

    // Function to remove all generated elements
    function removeAllElements() {
        console.log("Removing all generated elements...");
        if (suggestionBox && suggestionBox.parentNode) {
            suggestionBox.parentNode.removeChild(suggestionBox);
        }
        if (removeButton && removeButton.parentNode) {
            removeButton.parentNode.removeChild(removeButton);
        }
        console.log("All generated elements removed.");
    }

    // Add click event listener to the remove button
    removeButton.addEventListener('click', removeAllElements);

    // Function to fetch words from the URL
    function fetchWords(callback) {
        console.log("Fetching words from the URL...");
        GM_xmlhttpRequest({
            method: "GET",
            url: wordsUrl,
            onload: function (response) {
                console.log("Words fetched successfully.");
                const words = response.responseText.split('\n').filter(word => word.trim() !== "");
                console.log(`Total words loaded: ${words.length}`);
                callback(words);
            },
            onerror: function (error) {
                console.error("Error fetching words:", error);
            }
        });
    }

    // Function to suggest 10 words containing the syllable, prioritizing 5-letter words
    function suggestWords(words, syllable) {
        console.log(`Suggesting words for syllable: "${syllable}"`);
        // Filter words that contain the syllable as a substring
        const validWords = words.filter(word => word.includes(syllable));

        console.log(`Valid words found: ${validWords.length}`);

        // If no valid words are found, return a fallback message
        if (validWords.length === 0) {
            console.log("No valid words found for the syllable.");
            return ["No suggestions found"];
        }

        // Prioritize 5-letter words
        const fiveLetterWords = validWords.filter(word => word.length === 5);
        const otherWords = validWords.filter(word => word.length !== 5);

        // Combine the lists, with 5-letter words first
        const prioritizedWords = [...fiveLetterWords, ...otherWords];

        // Pick up to 10 random words from the prioritized list
        const suggestedWords = [];
        for (let i = 0; i < 10; i++) {
            if (prioritizedWords.length === 0) break; // Stop if no more words are available
            const randomIndex = Math.floor(Math.random() * prioritizedWords.length);
            suggestedWords.push(prioritizedWords[randomIndex]);
            // Remove the selected word to avoid duplicates
            prioritizedWords.splice(randomIndex, 1);
        }

        console.log(`Suggested words: ${suggestedWords.join(", ")}`);
        return suggestedWords;
    }

    // Function to observe changes in the syllable div
    function observeSyllableChanges(words, targetNode) {
        if (!targetNode) {
            console.error("Syllable div not found!");
            return;
        }

        console.log("Syllable div found. Starting to observe changes...");

        // Callback function for MutationObserver
        const callback = function (mutationsList) {
            console.log("Mutation observed in syllable div.");
            for (let mutation of mutationsList) {
                if (mutation.type === 'characterData' || mutation.type === 'childList') {
                    const syllable = targetNode.textContent.trim().toLowerCase();
                    console.log(`Syllable changed to: "${syllable}"`);
                    const suggestedWords = suggestWords(words, syllable);
                    suggestionBox.textContent = `Suggested Words: ${suggestedWords.join(", ")}`;
                }
            }
        };

        // Create a MutationObserver to watch for changes
        const observer = new MutationObserver(callback);

        // Start observing the target node for changes
        observer.observe(targetNode, {
            characterData: true, // Watch for text changes
            childList: true,    // Watch for child nodes being added/removed
            subtree: true       // Watch all descendants
        });
    }

    // Function to wait for the syllable div to be added to the DOM
    function waitForSyllableDiv(words) {
        console.log("Waiting for syllable div to be added to the DOM...");

        // Check if the syllable div is already present
        let syllableDiv = document.querySelector('.syllable');
        if (syllableDiv) {
            console.log("Syllable div already exists.");
            observeSyllableChanges(words, syllableDiv);
            return;
        }

        // If not, observe the document for changes
        const observer = new MutationObserver(function (mutationsList, observer) {
            syllableDiv = document.querySelector('.syllable');
            if (syllableDiv) {
                console.log("Syllable div found in the DOM.");
                // Stop observing once the syllable div is found
                observer.disconnect();
                // Start observing changes in the syllable div
                observeSyllableChanges(words, syllableDiv);
            }
        });

        // Start observing the entire document for changes
        observer.observe(document.body, {
            childList: true, // Watch for child nodes being added/removed
            subtree: true     // Watch all descendants
        });
    }

    // Fetch words and wait for the syllable div to be added
    fetchWords(waitForSyllableDiv);
})();
