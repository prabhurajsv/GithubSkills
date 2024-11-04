// pvanaki.js - Homework #3: D3 Linking - CSE 478 - Fall 2024
const vowels = "aeiouy";
const consonants = "bcdfghjklmnpqrstvwxyz";
const punctuation = ".,!?;:";

function processText() {
    const txt = document.getElementById("wordbox").innerText.toLowerCase();
    const data = {
        name: "root",
        children: [
            { name: "Vowels", children: [] },
            { name: "Consonants", children: [] },
            { name: "Punctuation", children: [] }
        ]
    };

    const counts = {};
    for (let char of txt) {
        if (vowels.includes(char) || consonants.includes(char) || punctuation.includes(char)) {
            counts[char] = (counts[char] || 0) + 1;
        }
    }

    for (let [char, count] of Object.entries(counts)) {
        if (vowels.includes(char)) {
            data.children[0].children.push({ name: char, value: count });
        } else if (consonants.includes(char)) {
            data.children[1].children.push({ name: char, value: count });
        } else if (punctuation.includes(char)) {
            data.children[2].children.push({ name: char, value: count });
        }
    }

    drawTreemap(data, txt);
}
