function addTask() {
    const taskInput = document.getElementById('taskInput');
    const taskList = document.getElementById('taskList');

    if (taskInput.value.trim() === "") {
        alert("Veuillez entrer une tâche.");
        return;
    }

    const taskItem = createTaskItem(taskInput.value, true); // Création d'une tâche active
    taskList.appendChild(taskItem);

    saveTasks();

    taskInput.value = '';

    // Démarrer le compte à rebours seulement pour les tâches actives
    startCountdown(taskItem.querySelector('.task-time'), taskItem);
}

function createTaskItem(taskDescription, isActive, startTime = null) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';

    const taskText = document.createElement('span');
    taskText.textContent = taskDescription;
    taskItem.appendChild(taskText);

    const taskTime = document.createElement('span');
    taskTime.className = 'task-time';
    taskTime.textContent = isActive ? '2:00:00' : ''; // Afficher le chronomètre seulement pour les tâches actives
    taskItem.appendChild(taskTime);

    const finishButton = document.createElement('button');
    finishButton.textContent = 'Terminer';
    finishButton.onclick = function () {
        alert('Bravo ! Tâche terminée.');
        taskItem.parentNode.removeChild(taskItem);
        saveTasks(); // Sauvegarder les tâches après suppression
    };
    taskItem.appendChild(finishButton);

    if (isActive) {
        const postponeButton = document.createElement('button');
        postponeButton.textContent = 'Reporter';
        postponeButton.onclick = function () {
            moveToWaitingList(taskItem);
        };
        taskItem.appendChild(postponeButton);

        // Si une heure de début est fournie (rechargement de page), utiliser cette heure
        if (startTime) {
            const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
            startCountdown(taskTime, taskItem, 7200 - elapsedTime); // Ajuster le compte à rebours
        } else {
            startCountdown(taskTime, taskItem); // Démarrer le compte à rebours depuis le début
        }
    }

    return taskItem;
}

function moveToWaitingList(taskItem) {
    const waitingList = document.getElementById('waitingList');
    taskItem.parentNode.removeChild(taskItem);
    waitingList.appendChild(taskItem);

    // Supprimer le bouton "Reporter"
    const postponeButton = taskItem.querySelector('button:nth-child(4)');
    if (postponeButton) {
        postponeButton.parentNode.removeChild(postponeButton);
    }

    // Retirer le chronomètre pour les tâches en liste d'attente
    const taskTime = taskItem.querySelector('.task-time');
    taskTime.textContent = ''; // Supprimer le texte du chronomètre

    // Arrêter le compte à rebours si une tâche est déplacée vers la liste d'attente
    const countdownId = taskItem.getAttribute('data-countdown-id');
    if (countdownId) {
        clearInterval(countdownId);
        taskItem.removeAttribute('data-countdown-id');
    }

    saveTasks(); // Sauvegarder les tâches après déplacement en liste d'attente
}

function startCountdown(taskTimeElement, taskItem, initialTime = 7200) {
    let totalTime = initialTime; // 2 heures en secondes par défaut ou temps restant si rechargé

    const countdown = setInterval(() => {
        if (totalTime <= 0) {
            clearInterval(countdown);
            alert('Temps écoulé pour cette tâche !');
            moveToWaitingList(taskItem);
            return;
        }

        totalTime--;

        const hours = Math.floor(totalTime / 3600);
        const minutes = Math.floor((totalTime % 3600) / 60);
        const seconds = totalTime % 60;

        taskTimeElement.textContent = `${hours}:${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);

    // Stocker l'ID du compte à rebours pour pouvoir l'arrêter plus tard
    taskItem.setAttribute('data-countdown-id', countdown);
    taskItem.setAttribute('data-start-time', Date.now()); // Enregistrer l'heure de début
}

// Fonction pour sauvegarder les tâches dans le localStorage
function saveTasks() {
    const taskList = document.getElementById('taskList');
    const waitingList = document.getElementById('waitingList');

    const activeTasks = [];
    const waitingTasks = [];

    // Sauvegarder les tâches actives
    taskList.querySelectorAll('.task-item').forEach(taskItem => {
        const startTime = taskItem.getAttribute('data-start-time');
        activeTasks.push({
            description: taskItem.querySelector('span').textContent,
            isActive: true,
            startTime: startTime ? parseInt(startTime) : null
        });
    });

    // Sauvegarder les tâches en attente
    waitingList.querySelectorAll('.task-item').forEach(taskItem => {
        waitingTasks.push({
            description: taskItem.querySelector('span').textContent,
            isActive: false
        });
    });

    const tasks = {
        active: activeTasks,
        waiting: waitingTasks
    };

    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Fonction pour charger les tâches depuis le localStorage
function loadTasks() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks'));

    if (!savedTasks) return;

    const taskList = document.getElementById('taskList');
    const waitingList = document.getElementById('waitingList');

    // Charger les tâches actives
    savedTasks.active.forEach(task => {
        const taskItem = createTaskItem(task.description, true, task.startTime);
        taskList.appendChild(taskItem);
    });

    // Charger les tâches en attente
    savedTasks.waiting.forEach(task => {
        const taskItem = createTaskItem(task.description, false);
        waitingList.appendChild(taskItem);
    });
}

// Charger les tâches au chargement de la page
window.onload = loadTasks;
