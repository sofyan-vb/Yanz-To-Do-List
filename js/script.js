document.addEventListener('DOMContentLoaded', () => {
    // === DOM Element Selection ===
    const todoForm = document.getElementById('todo-form');
    const todoInput = document.getElementById('todo-input');
    const todoDesc = document.getElementById('todo-desc');
    const prioritySelect = document.getElementById('priority');
    const dateInput = document.getElementById('date-input');
    const todoList = document.getElementById('todo-list');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const completedCountSpan = document.getElementById('completed-count');
    const totalCountSpan = document.getElementById('total-count');
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    const filterDateInput = document.getElementById('filter-date');
    const currentDaySpan = document.getElementById('current-day');
    const currentTimeSpan = document.getElementById('current-time');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const editModalOverlay = document.getElementById('edit-modal-overlay');
    const editForm = document.getElementById('edit-form');
    const editTodoInput = document.getElementById('edit-todo-input');
    const editTodoDesc = document.getElementById('edit-todo-desc');
    const editPrioritySelect = document.getElementById('edit-priority');
    const editDateInput = document.getElementById('edit-date-input');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const detailsModalOverlay = document.getElementById('details-modal-overlay');
    const detailsTitle = document.getElementById('details-title');
    const detailsDesc = document.getElementById('details-desc');
    const detailsGrid = document.getElementById('details-grid');
    const detailsCloseBtn = document.getElementById('details-close-btn');

    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const monthNamesLong = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    let currentEditTaskId = null;

    // === Event Listeners ===
    todoForm.addEventListener('submit', addTask);
    todoList.addEventListener('click', handleTaskActions);
    deleteAllBtn.addEventListener('click', deleteAllTasks);
    themeToggleBtn.addEventListener('click', toggleTheme);
    filterButtons.forEach(button => button.addEventListener('click', handleFilterButtons));
    filterDateInput.addEventListener('change', filterTasks);
    editForm.addEventListener('submit', handleEditSubmit);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModalOverlay.addEventListener('click', (e) => {
        if (e.target === editModalOverlay) closeEditModal();
    });
    detailsCloseBtn.addEventListener('click', closeDetailsModal);
    detailsModalOverlay.addEventListener('click', (e) => {
        if (e.target === detailsModalOverlay) closeDetailsModal();
    });

    // Initial Load
    loadTheme();
    reloadTasks();
    updateDateTime();
    setInterval(updateDateTime, 1000); 

    // === Functions ===
    function updateDateTime() {
        const now = new Date();
        const optionsDate = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }; 
        currentDaySpan.textContent = now.toLocaleDateString('id-ID', optionsDate);
        currentTimeSpan.textContent = now.toLocaleTimeString('id-ID', optionsTime);
    }
    
    function toggleTheme() {
        document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        updateThemeIcon();
    }

    function loadTheme() {
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
        }
        updateThemeIcon();
    }

    function updateThemeIcon() {
        const themeIcon = themeToggleBtn.querySelector('i');
        themeIcon.className = document.body.classList.contains('light-theme') ? 'fas fa-sun' : 'fas fa-moon';
    }

    function addTask(e) {
        e.preventDefault();
        const taskText = todoInput.value.trim();
        if (taskText === '') return alert('Task description cannot be empty.');
        
        const task = {
            id: Date.now(),
            text: taskText,
            description: todoDesc.value.trim(),
            date: dateInput.value,
            priority: prioritySelect.value,
            completed: false
        };
        
        const tasks = getTasks();
        tasks.push(task);
        saveTasks(tasks);
        
        reloadTasks();
        todoForm.reset();
        todoInput.focus();
    }

    function renderTask(task) {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.setAttribute('data-id', task.id);
        if (task.completed) li.classList.add('completed');

        let formattedDate = 'No date';
        if (task.date) {
            const parts = task.date.split('-');
            const day = parts[2];
            const monthIndex = parseInt(parts[1], 10) - 1;
            const year = parts[0];
            if (day && monthIndex >= 0 && year) {
                formattedDate = `${day} ${monthNamesShort[monthIndex]} ${year}`;
            }
        }
        
        li.innerHTML = `
            <div class="task-main">
                <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <span class="priority-badge ${task.priority}">${task.priority}</span>
                <span class="status-badge ${task.completed ? 'completed' : 'pending'}">${task.completed ? 'Completed' : 'Pending'}</span>
            </div>
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
            <div class="task-details">
                <span class="due-date"><i class="far fa-calendar-alt"></i> Due: ${formattedDate}</span>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>`;
        todoList.appendChild(li);
    }

    function handleTaskActions(e) {
        const item = e.target;
        const taskElement = item.closest('.todo-item');
        if (!taskElement) return;
        const taskId = Number(taskElement.getAttribute('data-id'));
        let tasks = getTasks();

        if (item.closest('.delete-btn')) {
            if (confirm('Are you sure you want to delete this task?')) {
                tasks = tasks.filter(task => task.id !== taskId);
                saveTasks(tasks);
                reloadTasks();
            }
        } else if (item.closest('.edit-btn')) {
            openEditModal(taskId);
        } else if (item.classList.contains('checkbox')) {
            const task = tasks.find(t => t.id === taskId);
            if (task) task.completed = !task.completed;
            saveTasks(tasks);
            reloadTasks();
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
        editModalOverlay.style.display = 'none';
        currentEditTaskId = null;
    }

    function handleEditSubmit(e) {
        e.preventDefault();
        const updatedText = editTodoInput.value.trim();
        if (updatedText === '') return alert('Task text cannot be empty.');
        
        let tasks = getTasks();
        tasks = tasks.map(task => 
            task.id === currentEditTaskId ? { ...task, text: updatedText, description: editTodoDesc.value.trim(), priority: editPrioritySelect.value, date: editDateInput.value } : task
        );
        
        saveTasks(tasks);
        reloadTasks();
        closeEditModal();
    }
    
    function openDetailsModal(taskId) {
        const task = getTasks().find(t => t.id === taskId);
        if (!task) return;

        detailsTitle.textContent = task.text;
        detailsDesc.textContent = task.description || "No description provided.";
        detailsGrid.innerHTML = ''; 
        
        const createdDate = new Date(task.id);
        const createdDateString = createdDate.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

        let dueDateString = 'Not set';
        if (task.date) {
            const parts = task.date.split('-');
            const day = parts[2];
            const monthIndex = parseInt(parts[1], 10) - 1;
            const year = parts[0];
            if (day && monthIndex >= 0 && year) {
                dueDateString = `${day} ${monthNamesLong[monthIndex]} ${year}`;
            }
        }

        detailsGrid.appendChild(createDetailItem('Priority', task.priority, 'fa-flag'));
        detailsGrid.appendChild(createDetailItem('Due Date', dueDateString, 'fa-calendar-alt'));
        detailsGrid.appendChild(createDetailItem('Created On', createdDateString, 'fa-plus-circle'));
        detailsGrid.appendChild(createDetailItem('Status', task.completed ? 'Completed' : 'Pending', 'fa-info-circle'));

        detailsModalOverlay.style.display = 'flex';
    }

    function createDetailItem(label, value, iconClass) {
        const item = document.createElement('div');
        item.className = 'detail-item';
        item.innerHTML = `
            <span class="label"><i class="fas ${iconClass}"></i> ${label}</span>
            <span class="value">${value}</span>
        `;
        if (label === 'Priority') {
            item.querySelector('.value').classList.add('priority-badge', value);
        }
        if (label === 'Status') {
            item.querySelector('.value').classList.add('status-badge', value.toLowerCase());
        }
        return item;
    }

    function closeDetailsModal() {
        detailsModalOverlay.style.display = 'none';
    }

    function deleteAllTasks() {
        if (getTasks().length > 0 && confirm('Are you sure you want to delete ALL tasks? This action cannot be undone.')) {
            saveTasks([]);
            reloadTasks();
        }
    }

    function handleFilterButtons(e) {
        filterButtons.forEach(button => button.classList.remove('active'));
        e.target.classList.add('active');
        filterTasks();
    }

    function filterTasks() {
        const filterValue = document.querySelector('.filter-buttons .active').id.replace('filter-', '');
        const dateFilter = filterDateInput.value;
        const tasks = getTasks();
        let visibleTasksCount = 0;

        const existingFilterMsg = todoList.querySelector('.no-tasks-filtered');
        if(existingFilterMsg) existingFilterMsg.remove();
        
        todoList.querySelectorAll('.todo-item').forEach(li => {
            const task = tasks.find(t => t.id === Number(li.dataset.id));
            if (!task) return;

            const matchesStatus = filterValue === 'all' || (filterValue === 'completed' && task.completed) || (filterValue === 'pending' && !task.completed);
            const matchesDate = !dateFilter || task.date === dateFilter;
            
            if (matchesStatus && matchesDate) {
                li.style.display = 'flex';
                visibleTasksCount++;
            } else {
                li.style.display = 'none';
            }
        });
        
        // --- PERUBAHAN IKON DI SINI ---
        if (visibleTasksCount === 0 && tasks.length > 0) {
             todoList.innerHTML += `
                <li class="no-tasks-filtered">
                    <i class="fas fa-filter"></i>
                    <p>No tasks match the current filter</p>
                </li>`;
        }
    }

    function updateTaskStats() {
        const tasks = getTasks();
        const completed = tasks.filter(t => t.completed).length;
        completedCountSpan.textContent = completed;
        totalCountSpan.textContent = tasks.length;
        const percentage = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
        progressBarFill.style.width = `${percentage}%`;
    }

    // Storage Functions
    function getTasks() { return JSON.parse(localStorage.getItem('tasks')) || []; }
    function saveTasks(tasks) { localStorage.setItem('tasks', JSON.stringify(tasks)); }
    
    function reloadTasks() {
        const tasks = getTasks();
        todoList.innerHTML = '';

        // --- PERUBAHAN IKON DI SINI ---
        if (tasks.length === 0) {
            todoList.innerHTML = `
                <li class="no-tasks-message">
                    <i class="fas fa-star"></i>
                    <p>All clear! No tasks here.</p>
                </li>`;
        } else {
            tasks.forEach(renderTask);
        }
        
        updateTaskStats();
        filterTasks();
    }
});