// Глобальные переменные
let positions = {};
let groups = {};
let positionCounter = 1;

// Добавление новой позиции
function addPosition() {
    const container = document.getElementById('positions-container');
    const row = document.createElement('tr');
    const posId = positionCounter.toString();
    
    row.id = `position-${posId}`;
    row.innerHTML = `
        <td class="position-number">
            <div class="d-flex align-items-center gap-2">
                <input type="checkbox" class="position-checkbox" id="checkbox-${posId}" style="display: none;">
                <button class="btn btn-danger btn-sm delete-btn" onclick="deletePosition('${posId}')">
                    <i class="bi bi-trash"></i>
                </button>
                ${posId}
            </div>
        </td>
        <td>
            <input type="number" class="form-control" placeholder="Menge" 
                   onchange="updatePosition('${posId}', 'menge', this.value)">
        </td>
        <td class="tlpl-cell">
            <div class="d-flex gap-2 mb-2">
                <input type="number" class="form-control flex-grow-1" 
                       placeholder="TL/PL" 
                       onchange="updatePosition('${posId}', 'tlpl', this.value)">
            </div>
        </td>
        <td>
            <input type="number" class="form-control" placeholder="Толщина" 
                   onchange="updatePosition('${posId}', 'thickness', this.value)">
        </td>
        <td class="groups-cell"></td>
        <td class="selection-cell"></td>
    `;
    
    container.appendChild(row);
    positions[posId] = {
        number: positionCounter,
        menge: 0,
        tlpl: 0,
        groupTlpl: {}, // Объект для хранения TL/PL значений для каждой группы
        thickness: 0
    };
    
    positionCounter++;
    updateGroupsDisplay();
}

// Удаление позиции
function deletePosition(posId) {
    // Удаляем позицию из всех групп
    Object.keys(groups).forEach(groupId => {
        groups[groupId].positions = groups[groupId].positions.filter(id => id !== posId);
        // Если группа стала пустой, удаляем её
        if (groups[groupId].positions.length < 2) {
            delete groups[groupId];
        }
    });

    // Удаляем строку позиции
    const row = document.getElementById(`position-${posId}`);
    if (row) {
        row.remove();
    }

    // Удаляем данные позиции
    delete positions[posId];
    updateGroupsDisplay();
}

// Обновление данных позиции
function updatePosition(posId, field, value, groupId = null) {
    if (!positions[posId]) return;
    
    const numValue = Number(value) || 0;
    
    if (field === 'tlpl' && groupId) {
        // Обновляем TL/PL для конкретной группы
        if (!positions[posId].groupTlpl) {
            positions[posId].groupTlpl = {};
        }
        positions[posId].groupTlpl[groupId] = {
            value: numValue,
            separateCutting: false,
            separate_tlpl: 0
        };
    } else if (field === 'separate_tlpl' && groupId) {
        // Обновляем отдельное значение TL/PL для группы
        if (positions[posId].groupTlpl && positions[posId].groupTlpl[groupId]) {
            positions[posId].groupTlpl[groupId].separate_tlpl = numValue;
        }
    } else {
        // Обновляем другие поля
        positions[posId][field] = numValue;
    }

    // Если это поле толщины, проверяем группы
    if (field === 'thickness') {
        checkGroupThickness(posId, numValue);
    }
}

// Проверка толщины в группах
function checkGroupThickness(posId, newThickness) {
    Object.keys(groups).forEach(groupId => {
        if (groups[groupId].positions.includes(posId)) {
            const hasInvalidThickness = groups[groupId].positions.some(pos => 
                positions[pos].thickness !== newThickness && pos !== posId
            );
            
            if (hasInvalidThickness) {
                alert(`Позиция будет удалена из группы ${groupId}, так как толщина не совпадает`);
                groups[groupId].positions = groups[groupId].positions.filter(pos => pos !== posId);
                
                if (groups[groupId].positions.length < 2) {
                    delete groups[groupId];
                }
                
                updateGroupsDisplay();
            }
        }
    });
}

// Переключение отдельной резки для группы
function toggleSeparateCutting(posId, groupId) {
    if (!positions[posId] || !positions[posId].groupTlpl || !positions[posId].groupTlpl[groupId]) return;
    
    const groupData = positions[posId].groupTlpl[groupId];
    groupData.separateCutting = !groupData.separateCutting;
    
    const btn = document.querySelector(`#position-${posId} .separate-cut-btn-${groupId}`);
    const separateCuttingDiv = document.getElementById(`separate-cutting-${posId}-${groupId}`);
    
    if (groupData.separateCutting) {
        btn.classList.add('active');
        separateCuttingDiv.style.display = 'block';
    } else {
        btn.classList.remove('active');
        separateCuttingDiv.style.display = 'none';
        // Сбрасываем значение отдельной резки
        groupData.separate_tlpl = 0;
        const input = separateCuttingDiv.querySelector('input');
        if (input) {
            input.value = '';
        }
    }
}

// Проверка, находится ли позиция в какой-либо группе
function isPositionInGroup(posId) {
    return Object.values(groups).some(group => group.positions.includes(posId));
}

// Обновление видимости кнопок ножниц
function updateScissorsVisibility() {
    // Перебираем все позиции
    Object.keys(positions).forEach(posId => {
        // Обновляем видимость кнопок ножниц для каждой группы
        Object.keys(groups).forEach(groupId => {
            if (groups[groupId].positions.includes(posId)) {
                const scissorsBtn = document.querySelector(`#position-${posId} .separate-cut-btn-${groupId}`);
                if (scissorsBtn) {
                    scissorsBtn.style.display = 'block';
                }
            }
        });
    });
}

// Начало выбора позиций для группы
function startGroupSelection() {
    // Показываем чекбоксы
    document.querySelectorAll('.position-checkbox').forEach(checkbox => {
        checkbox.style.display = 'block';
        checkbox.checked = false;
    });

    // Настраиваем кнопку создания группы
    const createGroupBtn = document.querySelector('button[onclick="startGroupSelection()"]');
    createGroupBtn.textContent = 'Создать группу';
    createGroupBtn.onclick = createGroup;
    createGroupBtn.setAttribute('onclick', 'createGroup()');

    // Обновляем видимость кнопок
    updateButtonsVisibility('grouping');
}

// Создание новой группы
function createGroup() {
    const selectedPositions = [];
    document.querySelectorAll('.position-checkbox:checked').forEach(checkbox => {
        selectedPositions.push(checkbox.id.replace('checkbox-', ''));
    });

    if (selectedPositions.length < 2) {
        alert('Выберите минимум две позиции для создания группы');
        return;
    }

    // Проверяем толщину материала
    const thickness = positions[selectedPositions[0]].thickness;
    const hasInvalidThickness = selectedPositions.some(posId => 
        positions[posId].thickness !== thickness
    );

    if (hasInvalidThickness) {
        alert('Все позиции в группе должны иметь одинаковую толщину материала');
        return;
    }

    // Создаем новую группу
    const groupId = 'G' + (Object.keys(groups).length + 1);
    groups[groupId] = {
        positions: selectedPositions
    };

    // Инициализируем TL/PL значения для новой группы
    selectedPositions.forEach(posId => {
        if (!positions[posId].groupTlpl) {
            positions[posId].groupTlpl = {};
        }
        positions[posId].groupTlpl[groupId] = {
            value: 0,
            separateCutting: false,
            separate_tlpl: 0
        };
    });

    updateGroupsDisplay();
    finishGroupEdit();
}

// Редактирование группы
function editGroup(groupId, event) {
    // Предотвращаем всплытие события
    event.stopPropagation();
    
    startGroupSelection();
    
    // Отмечаем позиции группы
    groups[groupId].positions.forEach(posId => {
        const checkbox = document.getElementById(`checkbox-${posId}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });

    // Настраиваем кнопку на сохранение изменений
    const createGroupBtn = document.querySelector('button[onclick="createGroup()"]');
    if (createGroupBtn) {
        createGroupBtn.textContent = 'Сохранить изменения';
        createGroupBtn.onclick = () => saveGroupChanges(groupId);
        createGroupBtn.setAttribute('onclick', `saveGroupChanges('${groupId}')`);
    }

    // Обновляем видимость кнопок
    updateButtonsVisibility('grouping');
}

// Сохранение изменений группы
function saveGroupChanges(groupId) {
    const selectedPositions = [];
    document.querySelectorAll('.position-checkbox:checked').forEach(checkbox => {
        selectedPositions.push(checkbox.id.replace('checkbox-', ''));
    });

    if (selectedPositions.length < 2) {
        // Если выбрано меньше двух позиций, удаляем группу
        delete groups[groupId];
        // Удаляем TL/PL значения для этой группы у всех позиций
        Object.values(positions).forEach(position => {
            if (position.groupTlpl && position.groupTlpl[groupId]) {
                delete position.groupTlpl[groupId];
            }
        });
    } else {
        // Проверяем толщину материала
        const thickness = positions[selectedPositions[0]].thickness;
        const hasInvalidThickness = selectedPositions.some(posId => 
            positions[posId].thickness !== thickness
        );

        if (hasInvalidThickness) {
            alert('Все позиции в группе должны иметь одинаковую толщину материала');
            return;
        }

        // Удаляем TL/PL значения для позиций, которые больше не в группе
        const removedPositions = groups[groupId].positions.filter(posId => 
            !selectedPositions.includes(posId)
        );
        removedPositions.forEach(posId => {
            if (positions[posId].groupTlpl && positions[posId].groupTlpl[groupId]) {
                delete positions[posId].groupTlpl[groupId];
            }
        });

        // Добавляем TL/PL значения для новых позиций в группе
        const newPositions = selectedPositions.filter(posId => 
            !groups[groupId].positions.includes(posId)
        );
        newPositions.forEach(posId => {
            if (!positions[posId].groupTlpl) {
                positions[posId].groupTlpl = {};
            }
            positions[posId].groupTlpl[groupId] = {
                value: 0,
                separateCutting: false,
                separate_tlpl: 0
            };
        });

        // Обновляем список позиций в группе
        groups[groupId].positions = selectedPositions;
    }

    updateGroupsDisplay();
    finishGroupEdit();
}

// Завершение редактирования группы
function finishGroupEdit() {
    // Скрываем чекбоксы
    document.querySelectorAll('.position-checkbox').forEach(checkbox => {
        checkbox.style.display = 'none';
        checkbox.checked = false;
    });

    // Возвращаем исходное поведение кнопки
    const createGroupBtn = document.querySelector('button[onclick="createGroup()"], button[onclick^="saveGroupChanges"]');
    if (createGroupBtn) {
        createGroupBtn.textContent = 'Создать группу';
        createGroupBtn.onclick = startGroupSelection;
        createGroupBtn.setAttribute('onclick', 'startGroupSelection()');
    }

    // Обновляем видимость кнопок
    updateButtonsVisibility('normal');
}

// Обновление отображения групп
function updateGroupsDisplay() {
    // Очищаем все ячейки групп и TL/PL
    document.querySelectorAll('.groups-cell').forEach(cell => {
        cell.innerHTML = '';
    });
    document.querySelectorAll('.tlpl-cell').forEach(cell => {
        // Создаем базовое поле TL/PL для каждой позиции
        const posId = cell.closest('tr').id.replace('position-', '');
        cell.innerHTML = `
            <div class="d-flex gap-2 mb-2">
                <input type="number" class="form-control flex-grow-1" 
                       placeholder="TL/PL" 
                       value="${positions[posId].tlpl || ''}"
                       onchange="updatePosition('${posId}', 'tlpl', this.value)">
            </div>
        `;
    });

    // Обновляем отображение для каждой группы
    Object.keys(groups).forEach(groupId => {
        groups[groupId].positions.forEach(posId => {
            // Добавляем значок группы
            const groupCell = document.querySelector(`#position-${posId} .groups-cell`);
            if (groupCell) {
                const groupSpan = document.createElement('span');
                groupSpan.className = 'badge bg-primary me-1';
                groupSpan.innerHTML = `
                    ${groupId}
                    <button class="btn btn-link btn-sm text-white p-0 ms-1" 
                            onclick="editGroup('${groupId}', event)">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                `;
                groupCell.appendChild(groupSpan);

                // Находим и очищаем ячейку TL/PL
                const tlplCell = document.querySelector(`#position-${posId} .tlpl-cell`);
                if (tlplCell) {
                    tlplCell.innerHTML = '';
                    
                    // Добавляем поля TL/PL для каждой группы
                    const positionGroups = Object.keys(groups).filter(gId => 
                        groups[gId].positions.includes(posId)
                    );

                    positionGroups.forEach(gId => {
                        const groupContainer = document.createElement('div');
                        groupContainer.className = 'mb-2';
                        groupContainer.innerHTML = `
                            <div class="d-flex gap-2 align-items-center">
                                <span class="badge bg-primary">${gId}</span>
                                <div class="d-flex gap-2 flex-grow-1">
                                    <input type="number" class="form-control" 
                                           placeholder="TL/PL для группы ${gId}" 
                                           value="${positions[posId].groupTlpl?.[gId]?.value || ''}"
                                           onchange="updatePosition('${posId}', 'tlpl', this.value, '${gId}')">
                                    <button class="btn btn-outline-secondary separate-cut-btn-${gId}" 
                                            onclick="toggleSeparateCutting('${posId}', '${gId}')">
                                        <i class="bi bi-scissors"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="separate-cutting" id="separate-cutting-${posId}-${gId}" 
                                 style="display: ${positions[posId].groupTlpl?.[gId]?.separateCutting ? 'block' : 'none'}">
                                <input type="number" class="form-control mt-2" 
                                       placeholder="TL/PL отдельно" 
                                       value="${positions[posId].groupTlpl?.[gId]?.separate_tlpl || ''}"
                                       onchange="updatePosition('${posId}', 'separate_tlpl', this.value, '${gId}')">
                            </div>
                        `;
                        tlplCell.appendChild(groupContainer);

                        // Восстанавливаем состояние кнопки ножниц
                        if (positions[posId].groupTlpl?.[gId]?.separateCutting) {
                            const btn = groupContainer.querySelector(`.separate-cut-btn-${gId}`);
                            if (btn) btn.classList.add('active');
                        }
                    });
                }
            }
        });
    });
}

// Управление видимостью кнопок
function updateButtonsVisibility(mode) {
    const addPositionBtn = document.querySelector('button[onclick="addPosition()"]');
    const createGroupBtn = document.querySelector('button[onclick="startGroupSelection()"], button[onclick="createGroup()"], button[onclick^="saveGroupChanges"]');
    const cancelGroupBtn = document.getElementById('cancel-group-btn');
    const calculateBtn = document.querySelector('button[onclick="calculate()"]');
    const clearBtn = document.querySelector('button[onclick="clearAll()"]');

    switch (mode) {
        case 'normal':
            // Обычный режим
            addPositionBtn.style.display = 'inline-block';
            createGroupBtn.style.display = 'inline-block';
            cancelGroupBtn.style.display = 'none';
            calculateBtn.style.display = 'inline-block';
            clearBtn.style.display = 'inline-block';
            break;
        case 'grouping':
            // Режим создания/редактирования группы
            addPositionBtn.style.display = 'none';
            createGroupBtn.style.display = 'inline-block';
            cancelGroupBtn.style.display = 'inline-block';
            calculateBtn.style.display = 'none';
            clearBtn.style.display = 'none';
            break;
    }
}

// Установка количества позиций
function setPositionsCount() {
    const count = parseInt(document.getElementById('positions-count').value) || 0;
    const container = document.getElementById('positions-container');
    
    // Очищаем текущие позиции
    container.innerHTML = '';
    positions = {};
    groups = {};
    positionCounter = 1;
    
    // Добавляем новые позиции
    for (let i = 0; i < count; i++) {
        addPosition();
    }
}

// Очистка всех данных
function clearAll() {
    const container = document.getElementById('positions-container');
    container.innerHTML = '';
    positions = {};
    groups = {};
    positionCounter = 1;
    document.getElementById('results').textContent = '';
}

// Расчет результатов
function calculate() {
    const faNumber = document.getElementById('fa-number').value;
    const satz = parseInt(document.getElementById('satz').value) || 1;
    
    if (!faNumber) {
        alert('Введите FA номер');
        return;
    }

    // Здесь должна быть ваша логика расчета
    const results = `Расчет для FA: ${faNumber}\nSatz: ${satz}\n`;
    document.getElementById('results').textContent = results;

    // Сохраняем в историю
    saveToHistory(faNumber, satz);
}

// Сохранение в историю
function saveToHistory(faNumber, satz) {
    const history = document.getElementById('calculation-history');
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.textContent = `${timeString} - FA: ${faNumber}, Satz: ${satz}`;
    
    history.insertBefore(historyItem, history.firstChild);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    addPosition();
});
