// Handles page navigation and prevents older requests from overwriting newer pages.
const pageContent = document.querySelector("#page-content");
let pageRequestController;

async function loadPage(page) {
    const allowedPages = ["home", "socials", "info", "projects"];

    if (!allowedPages.includes(page)) {
        page = "home";
    }

    const pageFiles = {
        home: "pages/home.html",
        socials: "pages/socials.html",
        info: "pages/info.html",
        projects: "pages/projects.html"
    };

    // Cancel the previous page request if the user navigates quickly.
    pageRequestController?.abort();
    pageRequestController = new AbortController();
    const { signal } = pageRequestController;

    try {
        const response = await fetch(pageFiles[page], { signal });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Ignore this response if another navigation has started.
        if (signal.aborted) return;

        const parser = new DOMParser();
        const documentPage = parser.parseFromString(html, "text/html");
        pageContent.innerHTML = documentPage.body.innerHTML;

        const pageTitles = {
            home: "Poisiniously | Home",
            socials: "Poisiniously | Socials",
            info: "Poisiniously | Info",
            projects: "Poisiniously | Projects"
        };

        document.title = pageTitles[page];

        document.querySelectorAll("[data-page]").forEach(link => {
            const active = link.dataset.page === page;
            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        // Only load the YouTube script if the page actually contains its player.
        // This also avoids console errors while the Home content is intentionally hidden.
        if (page === "home") {
            document.getElementById("latest-video-script")?.remove();

            if (pageContent.querySelector("#latest-video")) {
                const videoScript = document.createElement("script");
                videoScript.id = "latest-video-script";
                videoScript.src = "latest-video.js";
                document.body.appendChild(videoScript);
            }
        }
    } catch (error) {
        // Aborted requests are expected when navigating quickly.
        if (error.name === "AbortError") return;

        console.error("Could not load page:", error);
        pageContent.innerHTML =
            "<p>Page could not be loaded. Please try again.</p>";
    }
}

document.querySelectorAll("[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const page = link.dataset.page;

        if (location.hash !== `#${page}`) {
            history.pushState({ page }, "", `#${page}`);
        }

        loadPage(page);
    });
});

document.querySelector(".brand")?.addEventListener("click", event => {
    event.preventDefault();

    if (location.hash !== "#home") {
        history.pushState({ page: "home" }, "", "#home");
    }

    loadPage("home");
});

window.addEventListener("popstate", () => {
    loadPage(location.hash.slice(1) || "home");
});

loadPage(location.hash.slice(1) || "home");
