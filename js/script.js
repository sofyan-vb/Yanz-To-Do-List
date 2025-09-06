document.addEventListener('DOMContentLoaded', () => {
   
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const sidebarDateEl = document.querySelector('.sidebar-header p');
    const mainDateTimeEl = document.querySelector('.main-header p');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsDropdown = document.getElementById('settings-dropdown');
   
    const detailsModalOverlay = document.getElementById('details-modal-overlay');
    const detailsTitle = document.getElementById('details-title');
    const detailsDesc = document.getElementById('details-desc');
    const detailsGrid = document.getElementById('details-grid');
    const detailsCloseBtn = document.getElementById('details-close-btn');

    
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editForm = document.getElementById('edit-form');
    const editTodoInput = document.getElementById('edit-todo-input');
    const editTodoDesc = document.getElementById('edit-todo-desc');
    const editPrioritySelect = document.getElementById('edit-priority');
    const editDateInput = document.getElementById('edit-date-input');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

   
    const accountBtn = document.querySelector('#settings-dropdown a:nth-child(1)');
    const preferencesBtn = document.querySelector('#settings-dropdown a:nth-child(2)');
    const helpBtn = document.querySelector('#settings-dropdown a:nth-child(3)');
    const logoutBtn = document.querySelector('#settings-dropdown a:nth-child(5)');

    let currentEditTaskId = null; 
    const locale = 'en-US';

    
    todoForm.addEventListener('submit', addTask);
    sidebarNav.addEventListener('click', handleSidebarFilter);
    themeToggleBtn.addEventListener('click', toggleTheme);
    settingsBtn.addEventListener('click', toggleSettingsMenu);
    todoList.addEventListener('click', handleTaskActions);

    window.addEventListener('click', (e) => {
        if (!settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('show');
        }
    });

    
    if (detailsModalOverlay) {
        detailsCloseBtn.addEventListener('click', closeDetailsModal);
        detailsModalOverlay.addEventListener('click', (e) => { if (e.target === detailsModalOverlay) closeDetailsModal(); });
    }

    
    if (editModalOverlay) {
        editForm.addEventListener('submit', handleEditSubmit);
        cancelEditBtn.addEventListener('click', closeEditModal);
        editModalOverlay.addEventListener('click', (e) => { if (e.target === editModalOverlay) closeEditModal(); });
    }

   
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogOut);
    }
    
    
    updateDateTime();
    setInterval(updateDateTime, 1000);
    loadTheme();
    reloadTasks();



    function getTasks() { return JSON.parse(localStorage.getItem('tasks-yanz')) || []; }
    function saveTasks(tasks) { localStorage.setItem('tasks-yanz', JSON.stringify(tasks)); }

    function addTask(e) {
        e.preventDefault();
        const newTask = {
            id: Date.now(),
            text: todoInput.value.trim(),
            description: document.getElementById('todo-desc').value.trim(),
            date: document.getElementById('date-input').value,
            priority: document.getElementById('priority').value,
            completed: false
        };
        if (newTask.text === '') return;
        let tasks = getTasks();
        tasks.push(newTask);
        saveTasks(tasks);
        reloadTasks();
        todoForm.reset();
        document.getElementById('priority').value = 'medium';
    }

    function renderTask(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;
        if (task.completed) li.classList.add('completed');
        const dueDate = task.date ? new Date(task.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date';
        const statusText = task.completed ? 'Completed' : 'Pending';
        const statusClass = task.completed ? 'completed' : 'pending';
        const completeIcon = task.completed ? 'fa-undo-alt' : 'fa-check';
        li.innerHTML = `<div class="task-item-header"><span class="task-item-title">${task.text}</span></div><p class="task-item-date">Due: ${dueDate}</p><div class="task-item-footer"><div class="badges"><span class="status-badge ${statusClass}">${statusText}</span><span class="priority-badge ${task.priority}">${task.priority}</span></div><div class="task-actions"><button title="Edit" class="edit-btn"><i class="fas fa-pencil-alt"></i></button><button title="${task.completed ? 'Mark as Pending' : 'Mark as Complete'}" class="complete-btn"><i class="fas ${completeIcon}"></i></button><button title="Delete" class="delete-btn"><i class="fas fa-trash"></i></button></div></div>`;
        todoList.appendChild(li);

        // Add the 'show' class to trigger the transition
        setTimeout(() => {
            li.classList.add('show');
        }, 10);
    }
    
    function handleTaskActions(e) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        const taskId = Number(taskItem.dataset.id);

        if (e.target.closest('.edit-btn')) {
            openEditModal(taskId);
        } else if (e.target.closest('.delete-btn')) {
            if (confirm('Are you sure you want to delete this task?')) {
                let tasks = getTasks().filter(t => t.id !== taskId);
                saveTasks(tasks);
                reloadTasks();
            }
        } else if (e.target.closest('.complete-btn')) {
            let tasks = getTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                saveTasks(tasks);
                reloadTasks();
            }
        } else {
            openDetailsModal(taskId);
        }
    }
    
    
    function openEditModal(taskId) {
        const task = getTasks().find(t => t.id === taskId);
        if (!task) return;

        currentEditTaskId = taskId;
        
        editTodoInput.value = task.text;
        editTodoDesc.value = task.description;
        editPrioritySelect.value = task.priority;
        editDateInput.value = task.date;
        
        editModalOverlay.style.display = 'flex';
    }

    function closeEditModal() {
        if (editModalOverlay) {
            editModalOverlay.style.display = 'none';
        }
    }

    function handleEditSubmit(e) {
        e.preventDefault();
        const updatedText = editTodoInput.value.trim();
        if (updatedText === '') return;

        let tasks = getTasks().map(task => {
            if (task.id === currentEditTaskId) {
                return {
                    ...task,
                    text: updatedText,
                    description: editTodoDesc.value.trim(),
                    priority: editPrioritySelect.value,
                    date: editDateInput.value
                };
            }
            return task;
        });
        
        saveTasks(tasks);
        reloadTasks();
        closeEditModal();
    }
    

    function openDetailsModal(taskId) {
        const task = getTasks().find(t => t.id === taskId);
        if (!task || !detailsModalOverlay) return;
        detailsTitle.textContent = task.text;
        detailsDesc.textContent = task.description || "No description.";
        const createdDate = new Date(task.id).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' });
        const dueDate = task.date ? new Date(task.date).toLocaleDateString(locale, { dateStyle: 'long' }) : 'Not set';
        const statusText = task.completed ? 'Completed' : 'Pending';
        const priorityClass = task.priority.toLowerCase();
        detailsGrid.innerHTML = `<div class="detail-item"><span class="label"><i class="fas fa-flag"></i> Priority</span> <span class="value"><span class="priority-badge ${priorityClass}">${task.priority}</span></span></div><div class="detail-item"><span class="label"><i class="fas fa-calendar-alt"></i> Due Date</span> <span class="value">${dueDate}</span></div><div class="detail-item"><span class="label"><i class="fas fa-plus-circle"></i> Created On</span> <span class="value">${createdDate}</span></div><div class="detail-item"><span class="label"><i class="fas fa-info-circle"></i> Status</span> <span class="value">${statusText}</span></div>`;
        detailsModalOverlay.style.display = 'flex';
    }

    function closeDetailsModal() { if (detailsModalOverlay) { detailsModalOverlay.style.display = 'none'; } }
    
    function reloadTasks() { 
        const filtered = filterTasks(); 
        todoList.innerHTML = ''; 
        if (filtered.length === 0) { 
            todoList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list fa-3x"></i>
                    <p>No tasks in this category.</p>
                </div>
            `;
        } else { 
            filtered.forEach(renderTask); 
        } 
    }

    function toggleTheme() { document.body.classList.toggle('dark-mode'); const isDarkMode = document.body.classList.contains('dark-mode'); localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); updateThemeIcon(isDarkMode); }
    function loadTheme() { const savedTheme = localStorage.getItem('theme'); const isDarkMode = savedTheme === 'dark'; if (isDarkMode) { document.body.classList.add('dark-mode'); } updateThemeIcon(isDarkMode); }
    function updateThemeIcon(isDarkMode) { if(themeIcon) { themeIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon'; } }
    function toggleSettingsMenu() { settingsDropdown.classList.toggle('show'); }
    function updateDateTime() { const now = new Date(); const optionsDate = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }; if(sidebarDateEl) sidebarDateEl.textContent = now.toLocaleDateString(locale, optionsDate); if(mainDateTimeEl) { const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }; const dateString = now.toLocaleDateString(locale, optionsDate); const timeString = now.toLocaleTimeString(locale, timeOptions); mainDateTimeEl.textContent = `${dateString} at ${timeString}`; } }
    function handleSidebarFilter(e) { e.preventDefault(); const link = e.target.closest('a'); if (!link) return; sidebarNav.querySelectorAll('li').forEach(li => li.classList.remove('active')); link.parentElement.classList.add('active'); reloadTasks(); }
    
    function filterTasks() { 
        const activeFilterEl = sidebarNav.querySelector('li.active a');
        if (!activeFilterEl) return getTasks();
        const filterText = activeFilterEl.textContent.trim();
        const tasks = getTasks();
        
        if (filterText === 'Completed') {
            return tasks.filter(task => task.completed);
        } else if (filterText === 'Pending') {
            return tasks.filter(task => !task.completed);
        }
        return tasks;
    }

    // ===============================================
    // FUNGSI BARU UNTUK SETTINGS DROPDOWN
    // ===============================================
    
    function openAccountPage(e) {
        e.preventDefault();
      
    }
    
    function openPreferencesPage(e) {
        e.preventDefault();
      
    }
    
    function openHelpPage(e) {
        e.preventDefault();
       
    }
    
    function handleLogOut(e) {
        e.preventDefault();
        const confirmLogout = confirm('Apakah Anda yakin ingin keluar?');
        if (confirmLogout) {
            alert('Anda telah keluar.');
          
        }
        toggleSettingsMenu();
    }
});