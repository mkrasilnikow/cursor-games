let flags = [];
let passedFlags = [];
let currentFlagIndex = 0;
let allTranslations = [];

const flagImage = document.getElementById('flag-image');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const showPassedFlagsBtn = document.getElementById('show-passed-flags-btn');
const showAllFlagsBtn = document.getElementById('show-all-flags-btn');
const backToGameBtn = document.getElementById('back-to-game-btn');
const backToGameFromAllBtn = document.getElementById('back-to-game-from-all-btn');
const gameContainer = document.getElementById('game-container');
const passedFlagsContainer = document.getElementById('passed-flags-container');
const allFlagsContainer = document.getElementById('all-flags-container');
const passedFlagsDiv = document.getElementById('passed-flags');
const allFlagsDiv = document.getElementById('all-flags');
const answerButtons = document.querySelectorAll('.answer-button');

// Create answers container
const answersContainer = document.createElement('div');
answersContainer.className = 'answers-grid';
// Insert it after flag image
flagImage.parentNode.insertBefore(answersContainer, flagImage.nextSibling);

function loadPassedFlags() {
    const storedFlags = localStorage.getItem('passedFlags');
    if (storedFlags) {
        passedFlags = JSON.parse(storedFlags);
    }
}

function savePassedFlags() {
    localStorage.setItem('passedFlags', JSON.stringify(passedFlags));
}

async function fetchCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const data = await response.json();
        
        const countriesWithTranslations = data.filter(country => 
            country.translations?.rus?.common
        );

        allTranslations = countriesWithTranslations.map(country => 
            country.translations.rus.common
        );

        flags = countriesWithTranslations.map(country => ({
            country: country.name.common,
            image: country.flags.png,
            translation: country.translations.rus.common
        }));

        flags = flags.filter(flag => 
            !passedFlags.some(passed => passed.country === flag.country)
        );
 
        if (flags.length === 0) {
            throw new Error('No flags available after filtering');
        }

        flags = shuffleArray(flags);
        loading.style.display = 'none';
        loadFlag();
    } catch (error) {
        loading.textContent = 'Error loading flags. Please refresh the page.';
    }
}

function shuffleArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return [];
    }
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getRandomOptions(correctTranslation) {
    if (!correctTranslation || allTranslations.length < 4) {
        return [];
    }

    const options = [correctTranslation];
    const availableTranslations = allTranslations.filter(t => t !== correctTranslation);
    
    while (options.length < 4 && availableTranslations.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTranslations.length);
        options.push(availableTranslations[randomIndex]);
        availableTranslations.splice(randomIndex, 1);
    }
    
    return shuffleArray(options);
}

function loadFlag() {
    if (currentFlagIndex >= flags.length) {
        result.textContent = 'Поздравляем! Вы завершили викторину!';
        document.querySelector('.answers-grid').style.display = 'none';
        return;
    }

    const currentFlag = flags[currentFlagIndex];

    if (!currentFlag || !currentFlag.image || !currentFlag.translation) {
        currentFlagIndex++;
        loadFlag();
        return;
    }

    flagImage.src = currentFlag.image;
    flagImage.style.display = 'block'; // Ensure the image is visible
    result.textContent = '';
    
    const options = getRandomOptions(currentFlag.translation);

    if (options.length < 4) {
        currentFlagIndex++;
        loadFlag();
        return;
    }

    answerButtons.forEach((button, index) => {
        button.textContent = options[index];
        button.className = 'answer-button';
        button.disabled = false;
        button.style.display = 'block';
        button.onclick = () => checkAnswer(options[index], currentFlag.translation, button);
    });

    document.querySelector('.answers-grid').style.display = 'grid';
}

function checkAnswer(selectedAnswer, correctAnswer, selectedButton) {
    answerButtons.forEach(button => button.disabled = true);
    
    if (selectedAnswer === correctAnswer) {
        selectedButton.classList.add('correct');
        passedFlags.push(flags[currentFlagIndex]);
        savePassedFlags();
    } else {
        selectedButton.classList.add('incorrect');
        const correctButton = Array.from(answerButtons).find(button => button.textContent === correctAnswer);
        correctButton.classList.add('correct-answer');
    }
    
    setTimeout(() => {
        currentFlagIndex++;
        loadFlag();
    }, 1500);
}

function showPassedFlags() {
    gameContainer.style.display = 'none';
    passedFlagsContainer.style.display = 'block';
    passedFlagsDiv.innerHTML = '';
    passedFlags.forEach(flag => {
        if (flag && flag.image && flag.translation) {
            const flagElement = document.createElement('div');
            flagElement.className = 'flag-item';
            flagElement.innerHTML = `
                <img src="${flag.image}" alt="${flag.country} flag">
                <p>${flag.translation}</p>
            `;
            passedFlagsDiv.appendChild(flagElement);
        }
    });
}

function showAllFlags() {
    gameContainer.style.display = 'none';
    allFlagsContainer.style.display = 'block';
    allFlagsDiv.innerHTML = '';
    
    const allFlags = [...passedFlags, ...flags];
    allFlags.sort((a, b) => {
        // Check if both flags have translations before comparing
        if (a.translation && b.translation) {
            return a.translation.localeCompare(b.translation);
        }
        // If one or both flags don't have translations, keep their original order
        return 0;
    });
    
    allFlags.forEach(flag => {
        if (flag && flag.image && flag.translation) {
            const flagElement = document.createElement('div');
            flagElement.className = 'flag-item';
            flagElement.innerHTML = `
                <img src="${flag.image}" alt="${flag.country} flag">
                <p>${flag.translation}</p>
            `;
            allFlagsDiv.appendChild(flagElement);
        }
    });
}

function backToGame() {
    passedFlagsContainer.style.display = 'none';
    allFlagsContainer.style.display = 'none';
    gameContainer.style.display = 'flex';  // This should be 'flex' to maintain the flexbox layout
}

showPassedFlagsBtn.addEventListener('click', showPassedFlags);
showAllFlagsBtn.addEventListener('click', showAllFlags);
backToGameBtn.addEventListener('click', backToGame);
backToGameFromAllBtn.addEventListener('click', backToGame);

loadPassedFlags();
fetchCountries();
