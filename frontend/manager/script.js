const firebaseConfig = {
    apiKey: "AIzaSyDmVWaGD-XXrDpH4NN8C31pyps24jirAJU",
    authDomain: "promanag-6b374.firebaseapp.com",
    projectId: "promanag-6b374",
    storageBucket: "promanag-6b374.appspot.com",
    messagingSenderId: "294380471934",
    appId: "1:294380471934:web:ce389b0b1be289e5a0ba2f",
    measurementId: "G-MJV4M2KZDW"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const sidebarItems = document.querySelectorAll('.sidebar li');
const contentSections = document.querySelectorAll('.content-section');
const addProjectBtn = document.getElementById('addProjectBtn');
const addProjectModal = document.getElementById('addProjectModal');
const closeProjectModal = document.getElementById('closeProjectModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const addTaskModal = document.getElementById('addTaskModal');
const closeTaskModal = document.getElementById('closeTaskModal');
const addMemberBtn = document.getElementById('addMemberBtn');
const addMemberModal = document.getElementById('addMemberModal');
const closeMemberModal = document.getElementById('closeMemberModal');
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const addProjectForm = document.getElementById('addProjectForm');
const addTaskForm = document.getElementById('addTaskForm');
const addMemberForm = document.getElementById('addMemberForm');
const editProfileForm = document.getElementById('editProfileForm');

let currentUser = null;
let currentUserRole = "team_member";

document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    document.getElementById('currentDate').textContent = currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            document.getElementById('userEmail').textContent = user.email;
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    currentUserRole = userData.role || 'team_member';
                    document.getElementById('userRole').textContent = currentUserRole;
                    loadDashboardData();
                    loadProjectsData();
                    loadTasksData();
                    loadTeamData();
                    loadProfileData();
                    loadNotificationsData();
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            contentSections.forEach(section => {
                section.classList.toggle('active', section.id === sectionId);
                if (section.classList.contains('active')) {
                    if (sectionId === 'dashboard') loadDashboardData();
                    if (sectionId === 'projects') loadProjectsData();
                    if (sectionId === 'tasks') loadTasksData();
                    if (sectionId === 'team') loadTeamData();
                    if (sectionId === 'profile') loadProfileData();
                    if (sectionId === 'notifications') loadNotificationsData();
                }
            });
        });
    });

    addProjectBtn.addEventListener('click', openAddProjectModal);
    closeProjectModal.addEventListener('click', () => addProjectModal.style.display = 'none');
    addTaskBtn.addEventListener('click', openAddTaskModal);
    closeTaskModal.addEventListener('click', () => addTaskModal.style.display = 'none');
    addMemberBtn.addEventListener('click', openAddMemberModal);
    closeMemberModal.addEventListener('click', () => addMemberModal.style.display = 'none');
    editProfileBtn.addEventListener('click', () => editProfileModal.style.display = 'block');
    closeProfileModal.addEventListener('click', () => editProfileModal.style.display = 'none');

    addProjectForm.addEventListener('submit', saveProject);
    addTaskForm.addEventListener('submit', saveTask);
    addMemberForm.addEventListener('submit', saveMember);
    editProfileForm.addEventListener('submit', saveProfile);

    document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut().then(() => window.location.href = '/'));

    window.addEventListener('click', e => {
        if (e.target === addProjectModal) addProjectModal.style.display = 'none';
        if (e.target === addTaskModal) addTaskModal.style.display = 'none';
        if (e.target === addMemberModal) addMemberModal.style.display = 'none';
        if (e.target === editProfileModal) editProfileModal.style.display = 'none';
    });

    document.getElementById('projectSearchInput').addEventListener('input', filterProjects);
    document.getElementById('projectStatusFilter').addEventListener('change', filterProjects);
    document.getElementById('markAllReadBtn').addEventListener('click', markAllNotificationsAsRead);
});

function loadDashboardData() {
    const projectOverview = document.getElementById('projectOverview');
    const taskOverview = document.getElementById('taskOverview');
    const teamOverview = document.getElementById('teamOverview');
    const recentActivities = document.getElementById('recentActivities');

    db.collection('projects').get().then(snapshot => {
        const total = snapshot.docs.length;
        let active = 0, pending = 0, completed = 0;
        snapshot.forEach(doc => {
            const status = doc.data().status;
            if (status === 'active') active++;
            else if (status === 'pending') pending++;
            else if (status === 'completed') completed++;
        });
        projectOverview.innerHTML = `
            <div class="progress-item">
                <div class="progress-label"><span>Active</span><span>${active}/${total}</span></div>
                <div class="progress-bar"><div class="progress-fill fill-1" style="width: ${total ? (active/total*100) : 0}%"></div></div>
            </div>
            <div class="progress-item">
                <div class="progress-label"><span>Pending</span><span>${pending}/${total}</span></div>
                <div class="progress-bar"><div class="progress-fill fill-2" style="width: ${total ? (pending/total*100) : 0}%"></div></div>
            </div>
            <div class="progress-item">
                <div class="progress-label"><span>Completed</span><span>${completed}/${total}</span></div>
                <div class="progress-bar"><div class="progress-fill fill-3" style="width: ${total ? (completed/total*100) : 0}%"></div></div>
            </div>
        `;
    });

    db.collection('tasks').get().then(snapshot => {
        const total = snapshot.docs.length;
        let pending = 0, inProgress = 0, completed = 0;
        snapshot.forEach(doc => {
            const status = doc.data().status;
            if (status === 'pending') pending++;
            else if (status === 'in-progress') inProgress++;
            else if (status === 'completed') completed++;
        });
        taskOverview.innerHTML = `
            <div class="progress-item">
                <div class="progress-label"><span>Pending</span><span>${pending}/${total}</span></div>
                <div class="progress-bar"><div class="progress-fill fill-2" style="width: ${total ? (pending/total*100) : 0}%"></div></div>
            </div>
            <div class="progress-item">
                <div class="progress-label"><span>In Progress</span><span>${inProgress}/${total}</span></div>
                <div class="progress-bar"><div class="progress-fill fill-1" style="width: ${total ? (inProgress/total*100) : 0}%"></div></div>
            </div>
            <div class="progress-item">
                <div class="progress-label"><span>Completed</span><span>${completed}/${total}</span></div>
                <div class="progress-bar"><div class="progress-fill fill-3" style="width: ${total ? (completed/total*100) : 0}%"></div></div>
            </div>
        `;
    });

    teamOverview.innerHTML = `
        <div class="progress-item">
            <div class="progress-label"><span>Team Performance</span><span>75%</span></div>
            <div class="progress-bar"><div class="progress-fill fill-1" style="width: 75%"></div></div>
        </div>
    `;

    db.collection('activities').orderBy('timestamp', 'desc').limit(5).get().then(snapshot => {
        let html = '<table><thead><tr><th>Activity</th><th>User</th><th>Date</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
            const activity = doc.data();
            const date = new Date(activity.timestamp?.seconds * 1000);
            html += `<tr><td>${activity.description}</td><td>${activity.user}</td><td>${date.toLocaleString()}</td></tr>`;
        });
        html += '</tbody></table>';
        recentActivities.innerHTML = html;
    });
}

function loadProjectsData() {
    const allProjectsList = document.getElementById('allProjectsList');
    allProjectsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    db.collection('projects').orderBy('createdAt', 'desc').get().then(snapshot => {
        let html = '<table><thead><tr><th>Title</th><th>Team Lead</th><th>Start Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
        if (snapshot.empty) {
            html += '<tr><td colspan="5">No projects found</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const project = doc.data();
                db.collection('users').doc(project.teamLead).get().then(userDoc => {
                    const teamLead = userDoc.exists ? userDoc.data().email : 'Unknown';
                    html += `
                        <tr data-id="${doc.id}">
                            <td>${project.project_title || project.name || 'Untitled'}</td>
                            <td>${teamLead}</td>
                            <td>${project.timeline ? new Date(project.timeline.start_date).toLocaleDateString() : 'N/A'}</td>
                            <td><span class="status ${project.status}">${project.status}</span></td>
                            <td>
                                <button class="btn btn-success" onclick="editProject('${doc.id}')">Edit</button>
                                <button class="btn btn-danger" onclick="deleteProject('${doc.id}')">Delete</button>
                            </td>
                        </tr>
                    `;
                    allProjectsList.innerHTML = html + '</tbody></table>';
                }).catch(err => console.error('Error fetching user:', err));
            });
        }
    }).catch(err => {
        showNotification('Error', 'Failed to load projects: ' + err.message, 'error');
    });
}

function loadTasksData() {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    db.collection('tasks').where('assigneeId', '==', currentUser.uid).orderBy('deadline', 'asc').get().then(snapshot => {
        let html = '';
        if (snapshot.empty) {
            html = '<li>No tasks assigned to you</li>';
        } else {
            snapshot.forEach(doc => {
                const task = doc.data();
                html += `
                    <li class="task-item" data-id="${doc.id}">
                        <div class="task-info">
                            <div class="task-title">${task.title}</div>
                            <div class="task-meta">Due: ${new Date(task.deadline).toLocaleDateString()} | Priority: <span class="status ${task.priority}">${task.priority}</span></div>
                        </div>
                        <div class="task-actions">
                            <span class="status ${task.status}">${task.status}</span>
                            <button class="btn btn-success" onclick="editTask('${doc.id}')">Edit</button>
                            <button class="btn btn-danger" onclick="deleteTask('${doc.id}')">Delete</button>
                        </div>
                    </li>
                `;
            });
        }
        tasksList.innerHTML = html;
    }).catch(err => {
        showNotification('Error', 'Failed to load tasks: ' + err.message, 'error');
    });
}

function loadTeamData() {
    const teamMembersList = document.getElementById('teamMembersList');
    teamMembersList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    db.collection('users').where('role', '==', 'team_member').get().then(snapshot => {
        let html = '';
        if (snapshot.empty) {
            html = '<p>No team members found</p>';
        } else {
            const sortedDocs = snapshot.docs.sort((a, b) => a.data().email.localeCompare(b.data().email));
            sortedDocs.forEach(doc => {
                const member = doc.data();
                html += `
                    <div class="team-member" data-id="${doc.id}">
                        <div>${member.email}</div>
                        <div>${member.role}</div>
                        <div>
                            <button class="btn btn-success" onclick="editMember('${doc.id}')">Edit</button>
                            <button class="btn btn-danger" onclick="deleteMember('${doc.id}')">Delete</button>
                        </div>
                    </div>
                `;
            });
        }
        teamMembersList.innerHTML = html;
    }).catch(err => {
        showNotification('Error', 'Failed to load team members: ' + err.message, 'error');
    });
}

function loadProfileData() {
    const profileInfo = document.getElementById('profileInfo');
    db.collection('users').doc(currentUser.uid).get().then(doc => {
        const userData = doc.data();
        profileInfo.innerHTML = `
            <p>Email: ${userData.email}</p>
            <p>Role: ${userData.role}</p>
            <p>Member Since: ${new Date(userData.createdAt?.seconds * 1000).toLocaleDateString()}</p>
        `;
        document.getElementById('profileName').value = userData.name || '';
    }).catch(err => {
        showNotification('Error', 'Failed to load profile: ' + err.message, 'error');
    });
}

function loadNotificationsData() {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    db.collection('notifications').where('userId', '==', currentUser.uid).orderBy('timestamp', 'desc').get().then(snapshot => {
        let html = '';
        let unreadCount = 0;
        if (snapshot.empty) {
            html = '<p>No notifications</p>';
        } else {
            snapshot.forEach(doc => {
                const notif = doc.data();
                if (!notif.read) unreadCount++;
                html += `
                    <div class="notification" data-id="${doc.id}" style="border-left: ${notif.read ? '4px solid #ddd' : '4px solid #16a085'}">
                        <h4>${notif.title}</h4>
                        <p>${notif.message} - ${new Date(notif.timestamp?.seconds * 1000).toLocaleString()}</p>
                    </div>
                `;
            });
        }
        notificationsList.innerHTML = html;
        document.getElementById('notificationCount').textContent = unreadCount;
    }).catch(err => {
        showNotification('Error', 'Failed to load notifications: ' + err.message, 'error');
    });
}

function openAddProjectModal() {
    addProjectForm.reset();
    document.getElementById('projectId').value = '';
    db.collection('users').where('role', '==', 'team_member').get().then(snapshot => {
        let teamLeadOptions = '<option value="">Select Team Lead</option>';
        let teamMembersCheckboxes = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            teamLeadOptions += `<option value="${doc.id}">${user.email}</option>`;
            teamMembersCheckboxes += `
                <div class="checkbox-container">
                    <input type="checkbox" id="member-${doc.id}" name="team-members" value="${doc.id}">
                    <label for="member-${doc.id}">${user.email}</label>
                </div>
            `;
        });
        document.getElementById('teamLead').innerHTML = teamLeadOptions;
        document.getElementById('projectTeamMembers').innerHTML = teamMembersCheckboxes;
    }).catch(err => {
        showNotification('Error', 'Failed to load team members: ' + err.message, 'error');
    });
    addProjectModal.style.display = 'block';
}

function openAddTaskModal() {
    addTaskForm.reset();
    document.getElementById('taskId').value = '';
    db.collection('projects').get().then(snapshot => {
        let options = '<option value="">Select Project</option>';
        snapshot.forEach(doc => options += `<option value="${doc.id}">${doc.data().project_title || doc.data().name}</option>`);
        document.getElementById('taskProject').innerHTML = options;
    });
    db.collection('users').where('role', '==', 'team_member').get().then(snapshot => {
        let options = '<option value="">Select Team Member</option>';
        snapshot.forEach(doc => options += `<option value="${doc.id}">${doc.data().email}</option>`);
        document.getElementById('taskAssignee').innerHTML = options;
    });
    addTaskModal.style.display = 'block';
}

function openAddMemberModal() {
    addMemberForm.reset();
    document.getElementById('memberId').value = '';
    addMemberModal.style.display = 'block';
}

function saveProject(e) {
    e.preventDefault();
    const projectId = document.getElementById('projectId').value;
    const teamLead = document.getElementById('teamLead').value;
    const teamMembers = Array.from(document.querySelectorAll('input[name="team-members"]:checked')).map(el => el.value);

    db.collection('users').get().then(snapshot => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, role: doc.data().role, email: doc.data().email }));
        if (users.find(user => user.id === teamLead && user.role === 'manager')) {
            showNotification('Error', 'Team Lead cannot be a manager', 'error');
            return;
        }
        if (teamMembers.some(memberId => users.find(user => user.id === memberId && user.role === 'manager'))) {
            showNotification('Error', 'Team members cannot include managers', 'error');
            return;
        }

        const projectData = {
            project_title: document.getElementById('projectTitle').value,
            project_description: document.getElementById('projectDescription').value || '',
            assigned_by: {
                name: document.getElementById('assignedByName').value || '',
                role: document.getElementById('assignedByRole').value || '',
                email: document.getElementById('assignedByEmail').value || ''
            },
            assigned_to_team: document.getElementById('assignedToTeam').value || '',
            project_objectives: document.getElementById('projectObjectives').value ? document.getElementById('projectObjectives').value.split(',').map(item => item.trim()) : [],
            scope_of_work: document.getElementById('scopeOfWork').value ? document.getElementById('scopeOfWork').value.split(',').map(item => item.trim()) : [],
            deliverables: document.getElementById('deliverables').value ? document.getElementById('deliverables').value.split(',').map(item => item.trim()) : [],
            team_members: teamMembers.map(id => {
                const user = users.find(u => u.id === id);
                return { name: user?.email || '', role: 'team_member' };
            }),
            timeline: {
                start_date: document.getElementById('startDate').value,
                end_date: document.getElementById('endDate').value,
                phases: document.getElementById('phases').value ? document.getElementById('phases').value.split(',').map(phase => {
                    const [name, dates] = phase.split(':');
                    return { name: name?.trim() || '', dates: dates?.trim() || '' };
                }) : []
            },
            tech_stack: {
                frontend: {
                    languages: document.getElementById('frontendLanguages').value ? document.getElementById('frontendLanguages').value.split(',').map(item => item.trim()) : [],
                    frameworks: document.getElementById('frontendFrameworks').value ? document.getElementById('frontendFrameworks').value.split(',').map(item => item.trim()) : []
                },
                backend: {
                    runtime: document.getElementById('backendRuntime').value || '',
                    frameworks: document.getElementById('backendFrameworks').value ? document.getElementById('backendFrameworks').value.split(',').map(item => item.trim()) : []
                },
                database: {
                    type: document.getElementById('databaseType').value || '',
                    technology: document.getElementById('databaseTechnology').value || '',
                    hosting: document.getElementById('databaseHosting').value || ''
                },
                version_control: {
                    tool: document.getElementById('vcTool').value || '',
                    platform: document.getElementById('vcPlatform').value || '',
                    branching_strategy: document.getElementById('vcBranching').value || ''
                },
                api_tools: document.getElementById('apiTools').value ? document.getElementById('apiTools').value.split(',').map(item => item.trim()) : [],
                design_tools: document.getElementById('designTools').value ? document.getElementById('designTools').value.split(',').map(item => item.trim()) : [],
                testing: {
                    unit: document.getElementById('unitTesting').value ? document.getElementById('unitTesting').value.split(',').map(item => item.trim()) : [],
                    e2e: document.getElementById('e2eTesting').value ? document.getElementById('e2eTesting').value.split(',').map(item => item.trim()) : []
                },
                deployment: {
                    platform: document.getElementById('deploymentPlatform').value || '',
                    ci_cd: document.getElementById('ciCd').value || ''
                }
            },
            status_reporting: {
                daily_updates: document.getElementById('dailyUpdates').value || '',
                standup_time: document.getElementById('standupTime').value || '',
                weekly_review: document.getElementById('weeklyReview').value || ''
            },
            risk_management: document.getElementById('riskManagement').value ? document.getElementById('riskManagement').value.split(',').map(risk => {
                const [r, impact, mitigation] = risk.split(':');
                return { risk: r?.trim() || '', impact: impact?.trim() || '', mitigation: mitigation?.trim() || '' };
            }) : [],
            escalation_contact: {
                name: document.getElementById('escalationName').value || '',
                email: document.getElementById('escalationEmail').value || '',
                phone: document.getElementById('escalationPhone').value || ''
            },
            success_criteria: document.getElementById('successCriteria').value ? document.getElementById('successCriteria').value.split(',').map(item => item.trim()) : [],
            final_approval_required_from: document.getElementById('finalApproval').value || '',
            notes: document.getElementById('notes').value || '',
            teamLead,
            status: document.getElementById('projectStatus').value,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const promise = projectId 
            ? db.collection('projects').doc(projectId).update({ ...projectData, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
            : db.collection('projects').add(projectData);

        promise.then(() => {
            db.collection('activities').add({
                type: projectId ? 'project_update' : 'project_create',
                description: `${projectId ? 'Updated' : 'Created'} project: ${projectData.project_title}`,
                user: currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification(projectId ? 'Project Updated' : 'Project Created', `Project ${projectData.project_title} ${projectId ? 'updated' : 'created'} successfully`);
            addProjectModal.style.display = 'none';
            loadProjectsData();
            loadDashboardData();
        }).catch(err => showNotification('Error', err.message, 'error'));
    }).catch(err => showNotification('Error', 'Failed to validate users: ' + err.message, 'error'));
}

function saveTask(e) {
    e.preventDefault();
    const taskId = document.getElementById('taskId').value;
    const assigneeId = document.getElementById('taskAssignee').value;

    db.collection('users').doc(assigneeId).get().then(doc => {
        if (doc.exists && doc.data().role === 'manager') {
            showNotification('Error', 'Tasks cannot be assigned to managers', 'error');
            return;
        }

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value || '',
            projectId: document.getElementById('taskProject').value,
            assigneeId,
            deadline: document.getElementById('taskDeadline').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const promise = taskId 
            ? db.collection('tasks').doc(taskId).update({ ...taskData, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
            : db.collection('tasks').add(taskData);

        promise.then(() => {
            db.collection('activities').add({
                type: taskId ? 'task_update' : 'task_create',
                description: `${taskId ? 'Updated' : 'Created'} task: ${taskData.title}`,
                user: currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            if (taskData.assigneeId !== currentUser.uid) {
                db.collection('notifications').add({
                    userId: taskData.assigneeId,
                    title: taskId ? 'Task Updated' : 'New Task Assigned',
                    message: `Task "${taskData.title}" ${taskId ? 'updated' : 'assigned to you'}`,
                    read: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            showNotification(taskId ? 'Task Updated' : 'Task Created', `Task ${taskData.title} ${taskId ? 'updated' : 'created'} successfully`);
            addTaskModal.style.display = 'none';
            loadTasksData();
        }).catch(err => showNotification('Error', err.message, 'error'));
    });
}

function saveMember(e) {
    e.preventDefault();
    const email = document.getElementById('memberEmail').value;
    const role = document.getElementById('memberRole').value;
    const password = document.getElementById('memberPassword').value;

    auth.createUserWithEmailAndPassword(email, password).then(cred => {
        return db.collection('users').doc(cred.user.uid).set({
            email,
            role,
            createdBy: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(() => {
        db.collection('activities').add({
            type: 'member_create',
            description: `Added team member: ${email}`,
            user: currentUser.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('Member Added', `${email} added successfully`);
        addMemberModal.style.display = 'none';
        loadTeamData();
    }).catch(err => showNotification('Error', err.message, 'error'));
}

function saveProfile(e) {
    e.preventDefault();
    const updates = {};
    const name = document.getElementById('profileName').value;
    const password = document.getElementById('profilePassword').value;
    if (name) updates.name = name;

    db.collection('users').doc(currentUser.uid).update(updates).then(() => {
        if (password) return currentUser.updatePassword(password);
    }).then(() => {
        showNotification('Profile Updated', 'Profile updated successfully');
        editProfileModal.style.display = 'none';
        loadProfileData();
    }).catch(err => showNotification('Error', err.message, 'error'));
}

function editProject(id) {
    db.collection('projects').doc(id).get().then(doc => {
        const project = doc.data();
        document.getElementById('projectId').value = id;
        document.getElementById('projectTitle').value = project.project_title || project.name || '';
        document.getElementById('projectDescription').value = project.project_description || '';
        document.getElementById('assignedByName').value = project.assigned_by?.name || '';
        document.getElementById('assignedByRole').value = project.assigned_by?.role || '';
        document.getElementById('assignedByEmail').value = project.assigned_by?.email || '';
        document.getElementById('assignedToTeam').value = project.assigned_to_team || '';
        document.getElementById('projectObjectives').value = project.project_objectives?.join(', ') || '';
        document.getElementById('scopeOfWork').value = project.scope_of_work?.join(', ') || '';
        document.getElementById('deliverables').value = project.deliverables?.join(', ') || '';
        document.getElementById('startDate').value = project.timeline?.start_date || '';
        document.getElementById('endDate').value = project.timeline?.end_date || '';
        document.getElementById('phases').value = project.timeline?.phases?.map(p => `${p.name}: ${p.dates}`).join(', ') || '';
        document.getElementById('frontendLanguages').value = project.tech_stack?.frontend?.languages?.join(', ') || '';
        document.getElementById('frontendFrameworks').value = project.tech_stack?.frontend?.frameworks?.join(', ') || '';
        document.getElementById('backendRuntime').value = project.tech_stack?.backend?.runtime || '';
        document.getElementById('backendFrameworks').value = project.tech_stack?.backend?.frameworks?.join(', ') || '';
        document.getElementById('databaseType').value = project.tech_stack?.database?.type || '';
        document.getElementById('databaseTechnology').value = project.tech_stack?.database?.technology || '';
        document.getElementById('databaseHosting').value = project.tech_stack?.database?.hosting || '';
        document.getElementById('vcTool').value = project.tech_stack?.version_control?.tool || '';
        document.getElementById('vcPlatform').value = project.tech_stack?.version_control?.platform || '';
        document.getElementById('vcBranching').value = project.tech_stack?.version_control?.branching_strategy || '';
        document.getElementById('apiTools').value = project.tech_stack?.api_tools?.join(', ') || '';
        document.getElementById('designTools').value = project.tech_stack?.design_tools?.join(', ') || '';
        document.getElementById('unitTesting').value = project.tech_stack?.testing?.unit?.join(', ') || '';
        document.getElementById('e2eTesting').value = project.tech_stack?.testing?.e2e?.join(', ') || '';
        document.getElementById('deploymentPlatform').value = project.tech_stack?.deployment?.platform || '';
        document.getElementById('ciCd').value = project.tech_stack?.deployment?.ci_cd || '';
        document.getElementById('dailyUpdates').value = project.status_reporting?.daily_updates || '';
        document.getElementById('standupTime').value = project.status_reporting?.standup_time || '';
        document.getElementById('weeklyReview').value = project.status_reporting?.weekly_review || '';
        document.getElementById('riskManagement').value = project.risk_management?.map(r => `${r.risk}:${r.impact}:${r.mitigation}`).join(', ') || '';
        document.getElementById('escalationName').value = project.escalation_contact?.name || '';
        document.getElementById('escalationEmail').value = project.escalation_contact?.email || '';
        document.getElementById('escalationPhone').value = project.escalation_contact?.phone || '';
        document.getElementById('successCriteria').value = project.success_criteria?.join(', ') || '';
        document.getElementById('finalApproval').value = project.final_approval_required_from || '';
        document.getElementById('notes').value = project.notes || '';
        document.getElementById('teamLead').value = project.teamLead || '';
        document.getElementById('projectStatus').value = project.status || 'pending';
        
        openAddProjectModal();
        if (project.team_members) {
            project.team_members.forEach(member => {
                db.collection('users').where('email', '==', member.name).get().then(snapshot => {
                    snapshot.forEach(doc => {
                        const checkbox = document.getElementById(`member-${doc.id}`);
                        if (checkbox) checkbox.checked = true;
                    });
                });
            });
        }
    }).catch(err => {
        showNotification('Error', 'Failed to load project: ' + err.message, 'error');
    });
}

function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        db.collection('projects').doc(id).delete().then(() => {
            showNotification('Project Deleted', 'Project deleted successfully');
            loadProjectsData();
            loadDashboardData();
        }).catch(err => showNotification('Error', err.message, 'error'));
    }
}

function editTask(id) {
    db.collection('tasks').doc(id).get().then(doc => {
        const task = doc.data();
        document.getElementById('taskId').value = id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskProject').value = task.projectId;
        document.getElementById('taskAssignee').value = task.assigneeId;
        document.getElementById('taskDeadline').value = task.deadline;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        openAddTaskModal();
    }).catch(err => {
        showNotification('Error', 'Failed to load task: ' + err.message, 'error');
    });
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        db.collection('tasks').doc(id).delete().then(() => {
            showNotification('Task Deleted', 'Task deleted successfully');
            loadTasksData();
        }).catch(err => showNotification('Error', err.message, 'error'));
    }
}

function editMember(id) {
    db.collection('users').doc(id).get().then(doc => {
        const member = doc.data();
        document.getElementById('memberId').value = id;
        document.getElementById('memberEmail').value = member.email;
        document.getElementById('memberRole').value = member.role;
        document.getElementById('memberPassword').value = '';
        openAddMemberModal();
    }).catch(err => {
        showNotification('Error', 'Failed to load member: ' + err.message, 'error');
    });
}

function deleteMember(id) {
    if (confirm('Are you sure you want to delete this member?')) {
        db.collection('users').doc(id).delete().then(() => {
            showNotification('Member Deleted', 'Member deleted successfully');
            loadTeamData();
        }).catch(err => showNotification('Error', err.message, 'error'));
    }
}

function filterProjects() {
    const search = document.getElementById('projectSearchInput').value.toLowerCase();
    const status = document.getElementById('projectStatusFilter').value;
    const rows = document.querySelectorAll('#allProjectsList tr');
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const rowStatus = row.cells[3].textContent;
        const matchesSearch = name.includes(search);
        const matchesStatus = status === 'all' || rowStatus === status;
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function showNotification(title, message, type = 'success') {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `<h4>${title}</h4><p>${message}</p>`;
    if (type === 'error') {
        notif.style.borderLeftColor = '#e74c3c';
        notif.querySelector('h4').style.color = '#e74c3c';
    }
    document.getElementById('notificationContainer').appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

function markAllNotificationsAsRead() {
    db.collection('notifications').where('userId', '==', currentUser.uid).where('read', '==', false).get().then(snapshot => {
        const batch = db.batch();
        snapshot.forEach(doc => batch.update(doc.ref, { read: true }));
        return batch.commit();
    }).then(() => {
        showNotification('Notifications Cleared', 'All notifications marked as read');
        loadNotificationsData();
    }).catch(err => showNotification('Error', err.message, 'error'));
}