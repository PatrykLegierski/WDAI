document.addEventListener('DOMContentLoaded', () => {
    const minInput = document.getElementById('min-length');
    const maxInput = document.getElementById('max-length');
    const uppercaseCheckbox = document.getElementById('include-uppercase');
    const specialCheckbox = document.getElementById('include-special');
    const generateBtn = document.getElementById('generate-btn');

    const baseChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';


    generateBtn.addEventListener('click', () => {
        const min = parseInt(minInput.value.trim(), 10);
        const max = parseInt(maxInput.value.trim(), 10);

        if (isNaN(min) || isNaN(max) || min <= 0 || min > max) {
            alert('Błąd: Podaj poprawne liczby (minimum > 0 oraz minimum <= maksimum).');
            return;
        }

        let charPool = baseChars;

        if (uppercaseCheckbox.checked) {
            charPool += uppercaseChars;
        }

        if (specialCheckbox.checked) {
            charPool += specialChars;
        }

        const passwordLength = Math.floor(Math.random() * (max - min + 1)) + min;

        let password = '';
        for (let i = 0; i < passwordLength; i++) {
            const randomIndex = Math.floor(Math.random() * charPool.length);
            password += charPool[randomIndex];
        }

        alert(password);
    });
});