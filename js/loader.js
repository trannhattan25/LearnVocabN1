// Load the generated static curriculum catalog (works on GitHub Pages subpaths too).
const APP_BASE = new URL('../', document.currentScript.src);

(async function loadCurricula() {
    const response = await fetch(new URL('catalog.json', APP_BASE));
    if (!response.ok) throw new Error('Không thể tải catalog.json. Hãy chạy python tools/build_catalog.py rồi tải lại trang.');

    const files = await response.json();
    const allLessons = {};

    for (const file of files) {
        const rawLessons = {};
        window.LESSONS = rawLessons;
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL(file.path, APP_BASE);
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Không nạp được ${file.path}`));
            document.body.appendChild(script);
        });

        const filename = file.name.replace(/\.js$/i, '');
        const entries = Object.values(rawLessons);
        entries.forEach((lesson, index) => {
            const key = `${file.curriculum}/${filename}${entries.length > 1 ? `-${index + 1}` : ''}`;
            lesson.curriculum = file.curriculum;
            lesson.curriculumLabel = file.curriculumLabel;
            allLessons[key] = lesson;
        });

        const newProgressKey = `jp_learned_${file.curriculum}/${filename}`;
        if (file.curriculum === 'tettei') {
            const oldProgress = localStorage.getItem(`jp_learned_${filename}`);
            if (oldProgress && !localStorage.getItem(newProgressKey)) localStorage.setItem(newProgressKey, oldProgress);
        }
    }

    window.LESSONS = allLessons;
    window.DEFAULT_LESSON_KEY = Object.keys(allLessons)[0] || null;
    const app = document.createElement('script');
    app.src = new URL('js/script.js', APP_BASE);
    document.body.appendChild(app);
})().catch(error => {
    console.error(error);
    document.body.innerHTML = `<main style="font:16px sans-serif;max-width:680px;margin:4rem auto;padding:1rem;color:#334155"><h1>Không tải được giáo trình</h1><p>${error.message}</p><p>Sau khi thêm bài mới, chạy <code>python tools/build_catalog.py</code> để cập nhật danh mục.</p></main>`;
});

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const registerServiceWorker = () => navigator.serviceWorker.register(new URL('sw.js', APP_BASE)).catch(console.error);
    if (document.readyState === 'complete') registerServiceWorker();
    else window.addEventListener('load', registerServiceWorker, { once: true });
}
