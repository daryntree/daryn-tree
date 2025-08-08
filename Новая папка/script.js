const notesContainer = document.getElementById('notes-container');
const addRootBtn = document.getElementById('add-root-btn');
const showHiddenBtn = document.getElementById('show-hidden-btn');
const exportBtn = document.getElementById('export-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const exportTxtBtn = document.getElementById('export-txt-btn');
const exportMdBtn = document.getElementById('export-md-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportHtmlBtn = document.getElementById('export-html-btn');
const importBtn = document.getElementById('import-btn');
const donateBtn = document.getElementById('donate-btn');
const dropdownMenu = document.getElementById('export-dropdown');

const kaspiNoteContainer = document.getElementById('kaspi-note-container');

let notes = [];
const BASE_LOCAL_STORAGE_KEY = 'darynTreeNotes';

// ---- ФУНКЦИИ ДЛЯ ПЕРЕВОДА ----
const appTitle = document.getElementById('app-title');
const appDescription = document.getElementById('app-description');
const langSwitcher = document.querySelector('.lang-switcher');
const langButtons = document.querySelectorAll('.lang-btn');

let currentLang = 'ru';
const browserLang = navigator.language.split('-')[0];
if (translations[browserLang]) {
    currentLang = browserLang;
}

let isShowingHiddenNotes = false;

function getLocalStorageKey() {
    return `${BASE_LOCAL_STORAGE_KEY}_${currentLang}`;
}

function updateDonateLink() {
    const paypalUsername = 'Allahslave777'; // <-- ВСТАВЬ СВОЙ НИК PAYPAL
    const t = translations[currentLang];

    if (paypalUsername && t['paypal-locale']) {
        const paypalUrl = `https://paypal.me/${paypalUsername}?locale.x=${t['paypal-locale']}`;
        donateBtn.href = paypalUrl;
    } else {
        donateBtn.href = '#';
    }
}

function updateTexts() {
    const t = translations[currentLang];

    appTitle.textContent = t['app-title'];
    appDescription.textContent = t['app-description'];

    exportBtn.textContent = t['export-main'];
    exportJsonBtn.textContent = t['export-json'];
    exportTxtBtn.textContent = t['export-txt'];
    exportMdBtn.textContent = t['export-md'];
    exportCsvBtn.textContent = t['export-csv'];
    exportHtmlBtn.textContent = t['export-html'];
    importBtn.textContent = t['import'];

    donateBtn.textContent = t['donate'];

    addRootBtn.textContent = t['add-root'];

    showHiddenBtn.textContent = isShowingHiddenNotes ? t['hide-all-notes-btn'] : t['show-hidden-notes-btn'];

    kaspiNoteContainer.innerHTML = '';
    const kaspiLabel = document.createElement('p');
    kaspiLabel.textContent = t['kaspi-note-label'];

    const kaspiLink = document.createElement('a');
    const kaspiPhone = t['kaspi-note-number'].split(' ')[0];
    kaspiLink.href = `kaspi://open?phone=${kaspiPhone}`;
    kaspiLink.textContent = t['kaspi-note-number'];
    kaspiLink.classList.add('kaspi-link');

    kaspiNoteContainer.appendChild(kaspiLabel);
    kaspiNoteContainer.appendChild(kaspiLink);

    updateDonateLink();

    langButtons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLang}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    loadNotes();
}

langSwitcher.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        currentLang = e.target.dataset.lang;
        updateTexts();
    }
});

// ---- ФУНКЦИИ ДЛЯ ЗАМЕТОК ----
function findNoteAndParent(id, arr) {
    let parent = null;
    let array = arr;
    for (let i = 0; i < array.length; i++) {
        if (array[i].id == id) {
            return { note: array[i], parent: parent, index: i, array: array };
        }
        if (array[i].children) {
            const found = findNoteAndParent(id, array[i].children);
            if (found) {
                found.parent = array[i];
                return found;
            }
        }
    }
    return null;
}

function moveNote(noteId, direction) {
    const noteInfo = findNoteAndParent(noteId, notes);
    if (!noteInfo) return;

    const { array, index } = noteInfo;

    let newIndex = index;
    if (direction === 'up' && index > 0) {
        newIndex--;
    } else if (direction === 'down' && index < array.length - 1) {
        newIndex++;
    } else {
        return;
    }

    const [noteToMove] = array.splice(index, 1);
    array.splice(newIndex, 0, noteToMove);

    renderNotes();
    saveNotes();
}

function createNoteElement(note, parentContainer) {
    const noteWrapper = document.createElement('div');
    noteWrapper.classList.add('note-wrapper');
    noteWrapper.dataset.id = note.id;

    if (note.hidden && !isShowingHiddenNotes) {
        noteWrapper.classList.add('hidden');
    }

    const noteItem = document.createElement('div');
    noteItem.classList.add('note-item');
    noteItem.dataset.id = note.id;

    const noteContent = document.createElement('div');
    noteContent.classList.add('note-content');
    noteContent.contentEditable = true;

    const isPlaceholderText = note.text === translations[currentLang]['new-note'] || note.text === translations[currentLang]['new-sub-note'];
    if (isPlaceholderText) {
        noteContent.textContent = note.text;
        noteContent.classList.add('placeholder');
    } else {
        noteContent.textContent = note.text;
    }

    noteContent.addEventListener('focus', () => {
        const t = translations[currentLang];
        if (noteContent.textContent === t['new-note'] || noteContent.textContent === t['new-sub-note']) {
            noteContent.textContent = '';
            noteContent.classList.remove('placeholder');
        }
    });

    noteContent.addEventListener('blur', () => {
        const t = translations[currentLang];
        if (noteContent.textContent.trim() === '') {
            const parentId = parentContainer.dataset.parentId;
            const placeholderText = parentId ? t['new-sub-note'] : t['new-note'];
            noteContent.textContent = placeholderText;
            noteContent.classList.add('placeholder');
            note.text = placeholderText;
            saveNotes();
        } else {
            note.text = noteContent.textContent;
            saveNotes();
        }
    });

    const noteControls = document.createElement('div');
    noteControls.classList.add('note-controls');

    const toggleChildrenBtn = document.createElement('button');
    toggleChildrenBtn.classList.add('toggle-children-btn');
    if (note.children && note.children.length > 0) {
        if (note.hidden) {
            toggleChildrenBtn.textContent = '►';
        } else {
            toggleChildrenBtn.textContent = '▼';
        }
    } else {
        toggleChildrenBtn.style.visibility = 'hidden';
    }


    const addChildBtn = document.createElement('button');
    addChildBtn.classList.add('add-child-btn');
    addChildBtn.textContent = '+';

    const moveUpBtn = document.createElement('button');
    moveUpBtn.classList.add('move-up-btn');
    moveUpBtn.textContent = '↑';

    const moveDownBtn = document.createElement('button');
    moveDownBtn.classList.add('move-down-btn');
    moveDownBtn.textContent = '↓';

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = '×';

    noteControls.appendChild(toggleChildrenBtn);
    noteControls.appendChild(addChildBtn);
    noteControls.appendChild(moveUpBtn);
    noteControls.appendChild(moveDownBtn);
    noteControls.appendChild(deleteBtn);

    noteItem.appendChild(noteContent);
    noteItem.appendChild(noteControls);
    noteWrapper.appendChild(noteItem);
    parentContainer.appendChild(noteWrapper);

    const subNotesContainer = document.createElement('div');
    subNotesContainer.classList.add('sub-notes');
    if (note.hidden) {
        subNotesContainer.classList.add('hidden');
    }
    subNotesContainer.dataset.parentId = note.id;
    noteWrapper.appendChild(subNotesContainer);
    
    toggleChildrenBtn.addEventListener('click', () => {
        note.hidden = !note.hidden;
        renderNotes();
        saveNotes();
    });

    addChildBtn.addEventListener('click', () => {
        const t = translations[currentLang];
        const newNote = { id: Date.now(), text: t['new-sub-note'], children: [] };
        if (!note.children) {
            note.children = [];
        }
        note.children.push(newNote);
        renderNotes();
        saveNotes();
    });

    moveUpBtn.addEventListener('click', () => moveNote(note.id, 'up'));
    moveDownBtn.addEventListener('click', () => moveNote(note.id, 'down'));

    deleteBtn.addEventListener('click', () => {
        function removeNoteFromArr(arr, id) {
            arr.forEach((item, index) => {
                if (item.id == id) {
                    arr.splice(index, 1);
                } else if (item.children && item.children.length > 0) {
                    removeNoteFromArr(item.children, id);
                }
            });
        }
        removeNoteFromArr(notes, note.id);
        renderNotes();
        saveNotes();
    });

    if (note.children && note.children.length > 0) {
        note.children.forEach(child => createNoteElement(child, subNotesContainer));
    }
}

function renderNotes() {
    notesContainer.innerHTML = '';
    notes.forEach(note => createNoteElement(note, notesContainer));
}

function saveNotes() {
    localStorage.setItem(getLocalStorageKey(), JSON.stringify(notes));
}

function loadNotes() {
    const savedNotes = localStorage.getItem(getLocalStorageKey());
    try {
        if (savedNotes) {
            notes = JSON.parse(savedNotes);
        } else {
            notes = [];
        }
    } catch (e) {
        console.error("Ошибка при загрузке данных из localStorage", e);
        notes = [];
    }
    renderNotes();
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function exportNotesAsJson() {
    const data = JSON.stringify(notes, null, 2);
    downloadFile(data, 'daryntree_notes.json', 'application/json');
}

function convertNotesToText(notes, indent = '', isMarkdown = false, isCsv = false) {
    let result = '';
    notes.forEach(note => {
        if (isCsv) {
            result += `"${note.text.replace(/"/g, '""')}"`;
            if (note.children && note.children.length > 0) {
                result += '\n' + convertNotesToText(note.children, indent + '  ', isMarkdown, isCsv);
            }
        } else {
            const prefix = isMarkdown ? '- ' : '';
            result += `${indent}${prefix}${note.text}\n`;
            if (note.children && note.children.length > 0) {
                const nextIndent = isMarkdown ? '  ' + indent : '  ' + indent;
                result += convertNotesToText(note.children, nextIndent, isMarkdown);
            }
        }
    });
    return result;
}

function exportNotesAsTxt() {
    const textContent = convertNotesToText(notes);
    downloadFile(textContent, 'daryntree_notes.txt', 'text/plain');
}

function exportNotesAsMd() {
    const mdContent = convertNotesToText(notes, '', true);
    downloadFile(mdContent, 'daryntree_notes.md', 'text/markdown');
}

function exportNotesAsCsv() {
    let csvData = '';
    const flattenedNotes = [];

    function flattenNotes(arr, level = 0) {
        arr.forEach(note => {
            flattenedNotes.push({ text: note.text, level: level });
            if (note.children && note.children.length > 0) {
                flattenNotes(note.children, level + 1);
            }
        });
    }

    flattenNotes(notes);

    const headers = ["Level", "Note"];
    csvData += headers.join(",") + "\n";

    flattenedNotes.forEach(note => {
        let row = `${note.level},"${note.text.replace(/"/g, '""')}"`;
        csvData += row + "\n";
    });
    
    // Исправлено: кодируем только данные, а не заголовок data URI
    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvData);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "daryntree_notes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function exportNotesAsHtml() {
    const htmlContent = `
<!DOCTYPE html>
<html lang="${currentLang}">
<head>
    <meta charset="UTF-8">
    <title>${translations[currentLang]['app-title']}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
        ul { list-style-type: none; padding-left: 20px; }
        li { margin-bottom: 5px; }
    </style>
</head>
<body>
    <h1>${translations[currentLang]['app-title']}</h1>
    <p>${translations[currentLang]['app-description']}</p>
    ${notesContainer.outerHTML}
</body>
</html>`;
    downloadFile(htmlContent, 'daryntree_notes.html', 'text/html');
}

function parseTextToNotes(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const stack = [];
    const newNotes = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        const leadingSpaces = line.length - trimmedLine.length;
        const currentNote = { id: Date.now() + Math.random(), text: trimmedLine, children: [] };

        while (stack.length > 0 && leadingSpaces <= stack[stack.length - 1].indent) {
            stack.pop();
        }

        if (stack.length > 0) {
            const parent = stack[stack.length - 1].note;
            parent.children.push(currentNote);
        } else {
            newNotes.push(currentNote);
        }

        stack.push({ note: currentNote, indent: leadingSpaces });
    });

    return newNotes;
}

function importNotes() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json, .txt, .md, .csv';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                try {
                    let importedNotes = [];
                    if (fileExtension === 'json') {
                        importedNotes = JSON.parse(e.target.result);
                        if (!Array.isArray(importedNotes)) {
                            throw new Error("Invalid JSON format");
                        }
                    } else if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'csv') {
                        importedNotes = parseTextToNotes(e.target.result);
                    } else {
                        alert(translations[currentLang]['invalid-file']);
                        return;
                    }

                    notes = importedNotes;
                    saveNotes();
                    renderNotes();
                } catch (error) {
                    console.error("Ошибка при импорте:", error);
                    alert(translations[currentLang]['file-error']);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

addRootBtn.addEventListener('click', () => {
    const t = translations[currentLang];
    const newNote = { id: Date.now(), text: t['new-note'], children: [] };
    notes.push(newNote);
    renderNotes();
    saveNotes();
});

showHiddenBtn.addEventListener('click', () => {
    isShowingHiddenNotes = !isShowingHiddenNotes;
    updateTexts();
    
    function setHiddenState(arr, state) {
        arr.forEach(note => {
            note.hidden = state;
            if (note.children && note.children.length > 0) {
                setHiddenState(note.children, state);
            }
        });
    }

    if (isShowingHiddenNotes) {
        setHiddenState(notes, false);
    } else {
        setHiddenState(notes, true);
    }
    
    renderNotes();
    saveNotes();
});

exportBtn.addEventListener('click', () => {
    dropdownMenu.classList.toggle('hidden');
});

exportJsonBtn.addEventListener('click', exportNotesAsJson);
exportTxtBtn.addEventListener('click', exportNotesAsTxt);
exportMdBtn.addEventListener('click', exportNotesAsMd);
exportCsvBtn.addEventListener('click', exportNotesAsCsv);
exportHtmlBtn.addEventListener('click', exportNotesAsHtml);
importBtn.addEventListener('click', importNotes);

document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-container')) {
        dropdownMenu.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    updateTexts();
    
    // Автосохранение каждые 5 секунд (5000 миллисекунд)
    setInterval(saveNotes, 5000);
});