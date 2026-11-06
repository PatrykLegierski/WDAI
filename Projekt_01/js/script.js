document.addEventListener('DOMContentLoaded', () => {


    /* =========================================================================
       MODUŁ 1: ZEGAR OPERACYJNY NATO (CZAS UTC / ZULU) W GÓRNYM PASKU
       ========================================================================= */


    const govBar = document.querySelector('.gov-bar');

    if (govBar) {
        const clockSpan = document.createElement('span');
        clockSpan.className = 'utc-clock';
        govBar.appendChild(clockSpan);

        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getUTCHours()).padStart(2, '0');
            const minutes = String(now.getUTCMinutes()).padStart(2, '0');
            const seconds = String(now.getUTCSeconds()).padStart(2, '0');
            clockSpan.textContent = `CZAS OPERACYJNY: ${hours}:${minutes}:${seconds} UTC (ZULU)`;
        };

        updateClock();
        setInterval(updateClock, 1000);
    }


    /* =========================================================================
       MODUŁ 2: TRYB NOKTOWIZJI / HUD ZAPISYWANY W LOCALSTORAGE
       ========================================================================= */


    const navContainer = document.querySelector('.nav-container');

    if (navContainer) {
        // Tworzymy przycisk przełącznika i dodajemy go do paska nawigacji
        const hudBtn = document.createElement('button');
        hudBtn.type = 'button';
        hudBtn.className = 'hud-toggle-btn';
        navContainer.appendChild(hudBtn);

        // Funkcja ustawiająca wygląd strony na podstawie stanu (true / false)
        const applyHudMode = (isNightMode) => {
            if (isNightMode) {
                document.body.classList.add('hud-night-mode');
                hudBtn.textContent = 'NOKTOWIZJA: ON';
            } else {
                document.body.classList.remove('hud-night-mode');
                hudBtn.textContent = 'NOKTOWIZJA: OFF';
            }
        };

        // Odczytujemy zapisaną preferencję użytkownika z pamięci przeglądarki (localStorage)
        const savedMode = localStorage.getItem('psp_hud_mode');
        applyHudMode(savedMode === 'night');

        //Reagujemy na kliknięcie przycisku przez użytkownika
        hudBtn.addEventListener('click', () => {
            const isCurrentlyNight = document.body.classList.contains('hud-night-mode');
            const newState = !isCurrentlyNight; // Odwracamy stan na przeciwny

            applyHudMode(newState);
            localStorage.setItem('psp_hud_mode', newState ? 'night' : 'standard');
        });
    }


    /* =========================================================================
       MODUŁ 3: SCROLL-DRIVEN IMAGE SHOWCASE (F-16, FA-50, F-35)
       ========================================================================= */


    const stepCards = document.querySelectorAll('.step-card');
    const mainImg = document.getElementById('showcase-main-img');
    const modeLabel = document.getElementById('hud-mode-label');
    const stepIndicator = document.getElementById('hud-step-indicator');

    // Sprawdzamy, czy jesteśmy na podstronie samolotu (czy te elementy istnieją)
    if (stepCards.length > 0 && mainImg && modeLabel && stepIndicator) {

        // IntersectionObserver śledzi, która karta opisu wjeżdża na środek ekranu
        const observerOptions = {
            root: null, // Obserwujemy względem okna przeglądarki
            rootMargin: '-35% 0px -35% 0px', // Aktywacja, gdy karta znajdzie się w środkowym pasie ekranu
            threshold: 0
        };

        const stepObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // Jeśli karta wjechała w środkowy obszar ekranu:
                if (entry.isIntersecting) {
                    const activeCard = entry.target;

                    // 1. Podświetlamy aktywną kartę ramką CSS
                    stepCards.forEach(card => card.classList.remove('active-step'));
                    activeCard.classList.add('active-step');

                    // 2. Pobieramy dane zapisane w atrybutach HTML (data-step, data-title, data-img)
                    const stepNum = activeCard.dataset.step;
                    const stepTitle = activeCard.dataset.title;
                    const newImgSrc = activeCard.dataset.img;

                    // 3. Aktualizujemy napisy na wyświetlaczu HUD
                    stepIndicator.textContent = `SEKCJA ${stepNum} / 0${stepCards.length}`;
                    modeLabel.textContent = `TRYB: ${stepTitle}`;

                    // 4. Płynnie podmieniamy zdjęcie myśliwca (jeśli ścieżka jest inna niż obecna)
                    if (newImgSrc && !mainImg.getAttribute('src').includes(newImgSrc)) {
                        mainImg.classList.add('img-fade-out');

                        setTimeout(() => {
                            mainImg.src = newImgSrc;
                            mainImg.classList.remove('img-fade-out');
                        }, 200);
                    }
                }
            });
        }, observerOptions);

        stepCards.forEach(card => stepObserver.observe(card));
    }


    /* =========================================================================
       MODUŁ 4: OBSŁUGA FORMULARZA KONTAKTOWEGO (PODSTRONA KONTAKT.HTML)
       ========================================================================= */


    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');

    if (contactForm && formFeedback) {
        contactForm.addEventListener('submit', (event) => {

            event.preventDefault();

            const callsign = document.getElementById('sender-name').value.trim();
            const topicSelect = document.getElementById('message-topic');
            const topicText = topicSelect.options[topicSelect.selectedIndex].text;

            formFeedback.hidden = false;
            formFeedback.innerHTML = `
                <strong>POTWIERDZENIE TRANSMISJI:</strong> Meldunek od <strong>${callsign}</strong> 
                w kategorii <em>„${topicText}”</em> został pomyślnie zarejestrowany w systemie.
            `;

            contactForm.reset();
        });
    }

});