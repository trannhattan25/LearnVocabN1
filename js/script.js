// --- QUẢN LÝ ĐA BÀI HỌC & INTERACTION LOGIC ---
let currentLessonKey = window.DEFAULT_LESSON_KEY || 'lesson1';
let data = [];
let learnedStatus = [];
let userAnswers = {};
let currentCardIndex = 0;
let showMeaning = true;
let flashcardFilter = 'all';

// Khởi tạo hệ thống
function init() {
    populateLessonSelector();
    loadLesson(currentLessonKey);
}

// Khởi tạo danh sách bài học vào Dropdown kèm Tiến độ thuộc bài
function populateLessonSelector() {
    const select = document.getElementById('lesson-select');
    if (!select) return;
    
    select.innerHTML = '';
    
    if (window.LESSONS) {
        const groups = new Map();
        Object.keys(window.LESSONS).forEach(key => {
            const lesson = window.LESSONS[key];
            const totalQuestions = lesson.data ? lesson.data.length : 0;
            
            // Đọc tiến độ của bài học từ localStorage
            const saved = localStorage.getItem(`jp_learned_${key}`);
            const lessonLearned = saved ? JSON.parse(saved) : [];
            const learnedCount = lessonLearned.filter(Boolean).length;
            const percent = totalQuestions ? Math.round((learnedCount / totalQuestions) * 100) : 0;

            const groupName = lesson.curriculumLabel || lesson.curriculum || 'Giáo trình';
            if (!groups.has(groupName)) {
                const group = document.createElement('optgroup');
                group.label = groupName;
                groups.set(groupName, group);
                select.appendChild(group);
            }

            const opt = document.createElement('option');
            opt.value = key;
            // Hiển thị dạng: "Bài 1: Kanji & Từ vựng | Tiến độ thuộc bài: 8/12 (67%)"
            opt.textContent = `${lesson.title} | Tiến độ thuộc bài: ${learnedCount}/${totalQuestions} (${percent}%)`;
            
            if (key === currentLessonKey) {
                opt.selected = true;
            }
            groups.get(groupName).appendChild(opt);
        });
    }
}

// Chuyển đổi bài học
function changeLesson(lessonKey) {
    currentLessonKey = lessonKey;
    loadLesson(lessonKey);
}

// Load dữ liệu bài học được chọn
function loadLesson(lessonKey) {
    if (!window.LESSONS || !window.LESSONS[lessonKey]) return;

    data = window.LESSONS[lessonKey].data;
    userAnswers = {};
    currentCardIndex = 0;
    flashcardFilter = 'all';

    // Đọc trạng thái đã thuộc từ localStorage theo ID bài học riêng biệt
    const saved = localStorage.getItem(`jp_learned_${lessonKey}`);
    learnedStatus = saved ? JSON.parse(saved).slice(0, data.length) : [];
    learnedStatus = Array.from({ length: data.length }, (_, idx) => Boolean(learnedStatus[idx]));

    // Cập nhật tiêu đề & giao diện
    document.getElementById('vocab-lesson-title').innerText = `Danh sách từ vựng: ${window.LESSONS[lessonKey].title}`;
    
    renderQuiz();
    renderFlashcard(0);
    renderVocabList();
    updateStats();
}

// 1. Render Trắc nghiệm
function renderQuiz() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = data.map((q, idx) => `
        <div class="card" id="q-card-${q.id}">
            <div class="q-header">
                <div class="q-title">${q.sentence}</div>
                <label class="q-mark">
                    <input type="checkbox" id="chk-quiz-${idx}" ${learnedStatus[idx] ? 'checked' : ''} onchange="toggleLearned(${idx})">
                    <span>Thuộc từ này</span>
                </label>
            </div>
            <div class="options">
                ${q.options.map((opt, oIdx) => `
                    <button class="opt-btn" onclick="selectOpt(${q.id}, ${oIdx + 1}, this)">${opt}</button>
                `).join('')}
            </div>
            <div class="result-box" id="result-${q.id}"></div>
        </div>
    `).join('');
}

function selectOpt(qId, optIdx, btn) {
    userAnswers[qId] = optIdx;
    const parent = btn.parentElement;
    parent.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function gradeQuiz() {
    let score = 0;
    data.forEach(q => {
        const userAns = userAnswers[q.id];
        const resBox = document.getElementById(`result-${q.id}`);
        resBox.style.display = 'block';

        if (userAns === q.correct) {
            score++;
            resBox.className = 'result-box correct';
            resBox.innerHTML = `
                <b>✓ Chính xác!</b> (${q.kanji} - ${q.hiragana}): ${q.meaning}<br>
                <b>💡 Mẹo ghi nhớ:</b> ${q.tip}
                <div class="translation-text"><b>🌐 Dịch câu:</b> ${q.sentenceTranslation}</div>
            `;
        } else {
            resBox.className = 'result-box incorrect';
            resBox.innerHTML = `
                <b>✘ Chưa chính xác!</b> Đáp án đúng là <b>${q.options[q.correct - 1]}</b><br>
                <b>💡 Giải thích:</b> ${q.tip}
                <div class="translation-text"><b>🌐 Dịch câu:</b> ${q.sentenceTranslation}</div>
            `;
        }
    });

    document.getElementById('stat-quiz-score').innerText = `${score}/${data.length}`;
    alert(`Bạn đã đạt ${score}/${data.length} điểm! Hãy kéo xuống xem dịch nghĩa và giải thích chi tiết.`);
}

// 2. Flashcard
function renderFlashcard(idx) {
    if (!data.length) return;
    const flashcard = document.getElementById('flashcard');
    const filtered = getFlashcardIndices();
    if (!filtered.length) {
        document.getElementById('fc-kanji').innerText = flashcardFilter === 'learned' ? 'Chưa có từ đã thuộc' : 'Đã ôn hết!';
        document.getElementById('fc-hiragana').innerText = '';
        document.getElementById('fc-type').innerText = '';
        document.getElementById('fc-meaning').innerText = '';
        flashcard.classList.remove('flipped');
        updateFlashcardSummary();
        return;
    }
    if (!filtered.includes(idx)) idx = filtered[0];
    currentCardIndex = idx;
    const item = data[idx];
    document.getElementById('fc-kanji').innerText = item.kanji;
    document.getElementById('fc-hiragana').innerText = item.hiragana;
    document.getElementById('fc-type').innerText = item.type;
    document.getElementById('fc-meaning').innerText = item.meaning;
    flashcard.classList.remove('flipped');
    flashcard.classList.toggle('is-learned', Boolean(learnedStatus[idx]));
    updateFlashcardSummary();
}

function getFlashcardIndices() {
    return data.map((_, idx) => idx).filter(idx => flashcardFilter === 'all' || (flashcardFilter === 'learned' ? learnedStatus[idx] : !learnedStatus[idx]));
}

function updateFlashcardSummary() {
    const learnedCount = learnedStatus.filter(Boolean).length;
    const counts = { 'fc-count-all': data.length, 'fc-count-learned': learnedCount, 'fc-count-unlearned': data.length - learnedCount };
    Object.entries(counts).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.innerText = value; });
    const filtered = getFlashcardIndices();
    const position = document.getElementById('fc-position');
    if (position) position.innerText = filtered.length ? `${filtered.indexOf(currentCardIndex) + 1} / ${filtered.length} thẻ` : 'Không có thẻ';
    const status = document.getElementById('fc-current-status');
    if (status) status.innerText = learnedStatus[currentCardIndex] ? 'Đã thuộc' : 'Chưa thuộc';
}

function setFlashcardFilter(filter, button) {
    flashcardFilter = filter;
    document.querySelectorAll('.fc-filter').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    const filtered = getFlashcardIndices();
    renderFlashcard(filtered.includes(currentCardIndex) ? currentCardIndex : (filtered[0] ?? 0));
}

function setCurrentCardLearned(learned) {
    if (!data.length || !getFlashcardIndices().length) return;
    if (learnedStatus[currentCardIndex] !== learned) toggleLearned(currentCardIndex);
    const filtered = getFlashcardIndices();
    const next = filtered.find(idx => idx > currentCardIndex) ?? filtered[0];
    renderFlashcard(next);
}

function nextCard() {
    const filtered = getFlashcardIndices();
    if (!filtered.length) { renderFlashcard(0); return; }
    const position = filtered.indexOf(currentCardIndex);
    currentCardIndex = filtered[(position + 1 + filtered.length) % filtered.length];
    renderFlashcard(currentCardIndex);
}

function prevCard() {
    const filtered = getFlashcardIndices();
    if (!filtered.length) { renderFlashcard(0); return; }
    const position = filtered.indexOf(currentCardIndex);
    currentCardIndex = filtered[(position - 1 + filtered.length) % filtered.length];
    renderFlashcard(currentCardIndex);
}

// 3. Danh sách từ vựng & Toggle nghĩa
function renderVocabList() {
    const list = document.getElementById('vocab-list');
    list.innerHTML = data.map((item, idx) => `
        <div class="vocab-item ${learnedStatus[idx] ? 'learned' : ''}">
            <div>
                <span class="vocab-kanji" style="font-weight: 700; font-size: 1.15rem; color: var(--primary);">${item.kanji}</span>
                <span style="color: var(--text-muted); font-size: 0.95rem; margin-left: 0.3rem;">(${item.hiragana})</span>
                <span class="badge">${item.type}</span>
                <div class="vocab-meaning ${showMeaning ? '' : 'hidden'}">${item.meaning}</div>
            </div>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">
                <input type="checkbox" id="chk-vocab-${idx}" ${learnedStatus[idx] ? 'checked' : ''} onchange="toggleLearned(${idx})">
                <span>Thuộc</span>
            </label>
        </div>
    `).join('');
}

function toggleMeanings() {
    showMeaning = document.getElementById('toggle-meaning-chk').checked;
    document.querySelectorAll('.vocab-meaning').forEach(el => {
        if (showMeaning) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
}

function toggleLearned(idx) {
    learnedStatus[idx] = !learnedStatus[idx];
    // Lưu riêng trạng thái theo từng key bài học
    localStorage.setItem(`jp_learned_${currentLessonKey}`, JSON.stringify(learnedStatus));
    
    const qChk = document.getElementById(`chk-quiz-${idx}`);
    if (qChk) qChk.checked = learnedStatus[idx];

    const vChk = document.getElementById(`chk-vocab-${idx}`);
    if (vChk) vChk.checked = learnedStatus[idx];

    renderVocabList();
    updateStats();
    populateLessonSelector(); // Cập nhật lại tiến độ hiển thị ở Dropdown menu
    updateFlashcardSummary();
    if (!getFlashcardIndices().includes(currentCardIndex)) {
        renderFlashcard(getFlashcardIndices()[0] ?? 0);
    } else {
        document.getElementById('flashcard').classList.toggle('is-learned', Boolean(learnedStatus[currentCardIndex]));
    }
}

// 4. Thống kê
function updateStats() {
    const learnedCount = learnedStatus.filter(Boolean).length;
    document.getElementById('stat-learned-count').innerText = `${learnedCount}/${data.length}`;
    
    const percent = data.length ? Math.round((learnedCount / data.length) * 100) : 0;
    document.getElementById('stat-progress').innerText = `${percent}%`;
    document.getElementById('stat-progress-bar').style.width = `${percent}%`;
    document.getElementById('sidebar-progress-text').innerText = `${percent}%`;
    document.getElementById('sidebar-progress-bar').style.width = `${percent}%`;
    
    // Nếu chưa bấm Nộp bài trắc nghiệm thì hiển thị --/tổng số câu
    const currentScoreText = document.getElementById('stat-quiz-score').innerText;
    if (currentScoreText.includes('--') || currentScoreText.includes('/')) {
        const parts = currentScoreText.split('/');
        document.getElementById('stat-quiz-score').innerText = `${parts[0] || '--'}/${data.length}`;
    }
}

function switchTab(tabName, button) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    if (button) button.classList.add('active');
    const titles = { quiz: 'Trắc nghiệm', flashcard: 'Flashcard', vocab: 'Danh sách từ', stats: 'Thống kê' };
    document.getElementById('page-title').innerText = titles[tabName] || 'Học tập';
}

// --- TÍNH NĂNG XUẤT / NHẬP FILE TIẾN ĐỘ (.JSON) ---

// 1. Xuất file JSON tiến độ để tải về máy
function exportProgressJSON() {
    const progressData = {};
    if (window.LESSONS) {
        Object.keys(window.LESSONS).forEach(key => {
            const saved = localStorage.getItem(`jp_learned_${key}`);
            if (saved) {
                progressData[key] = JSON.parse(saved);
            }
        });
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progressData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "tien_do_hoc_tap.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// 2. Nhập file JSON tiến độ từ máy vào web
function importProgressJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            Object.keys(importedData).forEach(key => {
                localStorage.setItem(`jp_learned_${key}`, JSON.stringify(importedData[key]));
            });
            
            // Tải lại bài học hiện tại & làm mới Dropdown
            loadLesson(currentLessonKey);
            populateLessonSelector();
            alert("Đã cập nhật tiến độ học tập thành công!");
        } catch (err) {
            alert("File JSON không hợp lệ! Vui lòng chọn đúng file tiến độ.");
        }
    };
    reader.readAsText(file);
}

// Gọi hàm chạy ban đầu
init();
