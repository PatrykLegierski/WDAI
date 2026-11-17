document.addEventListener('DOMContentLoaded', () => {
    //najpierw referencje do elementow
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn');

    let totalSeconds = 0;
    let intervalId = null; //null = zatrzymany

    //formatowanie sekund do wymaganego zapisu
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) {
            return `${secs}s`;
        }
        return `${mins}min ${secs}s`;
    };

    const updateDisplay = () => {
        timerDisplay.textContent = formatTime(totalSeconds);
    };

    //START
    startBtn.addEventListener('click', () => {
        if (intervalId !== null) return;

        intervalId = setInterval(() => {
            totalSeconds++;
            updateDisplay();
        }, 1000); //1 sekund

        startBtn.disabled = true;
        stopBtn.disabled = false;
    });

    //STOP
    stopBtn.addEventListener('click', () => {
        clearInterval(intervalId);
        intervalId = null;

        startBtn.disabled = false;
        stopBtn.disabled = true;
    });

    //RESET
    resetBtn.addEventListener('click', () => {
        clearInterval(intervalId);
        intervalId = null;
        totalSeconds = 0;
        updateDisplay();

        startBtn.disabled = false;
        stopBtn.disabled = true;
    });
});