/* =========================================================
   24HR STORIES
   Vanilla JavaScript
   MongoDB Atlas + Express
========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1920;

const STORY_DURATION = 5000;

const EXPIRATION_TIME =
    24 * 60 * 60 * 1000;


/* =========================================================
   DOM
========================================================= */

const storiesContainer =
    document.getElementById(
        "storiesContainer"
    );

const storyCount =
    document.getElementById(
        "storyCount"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const addStoryButton =
    document.getElementById(
        "addStoryButton"
    );

const emptyAddButton =
    document.getElementById(
        "emptyAddButton"
    );

const clearStoriesButton =
    document.getElementById(
        "clearStoriesButton"
    );

const imageInput =
    document.getElementById(
        "imageInput"
    );


/* Upload */

const uploadModal =
    document.getElementById(
        "uploadModal"
    );

const closeUploadModal =
    document.getElementById(
        "closeUploadModal"
    );

const selectImageButton =
    document.getElementById(
        "selectImageButton"
    );


/* Viewer */

const storyViewer =
    document.getElementById(
        "storyViewer"
    );

const viewerBackground =
    document.getElementById(
        "viewerBackground"
    );

const viewerImage =
    document.getElementById(
        "viewerImage"
    );

const viewerAvatar =
    document.getElementById(
        "viewerAvatar"
    );

const storyTime =
    document.getElementById(
        "storyTime"
    );

const progressContainer =
    document.getElementById(
        "progressContainer"
    );

const closeViewer =
    document.getElementById(
        "closeViewer"
    );

const previousStory =
    document.getElementById(
        "previousStory"
    );

const nextStory =
    document.getElementById(
        "nextStory"
    );

const deleteStoryButton =
    document.getElementById(
        "deleteStoryButton"
    );

const pauseButton =
    document.getElementById(
        "pauseButton"
    );

const pauseIcon =
    document.getElementById(
        "pauseIcon"
    );

const storyStage =
    document.getElementById(
        "storyStage"
    );

const storyPhotoWrapper =
    document.getElementById(
        "storyPhotoWrapper"
    );


/* Loading */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );


/* Toast */

const toastContainer =
    document.getElementById(
        "toastContainer"
    );


/* =========================================================
   STATE
========================================================= */

let stories = [];

let currentStoryIndex = 0;

let progressTimer = null;

let progressStartTime = 0;

let currentDuration =
    STORY_DURATION;

let elapsedBeforePause = 0;

let isPaused = false;

let touchStartX = 0;

let touchStartY = 0;

let touchStartTime = 0;

let storyTransitioning = false;


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


async function initialize() {

    await loadStories();

    cleanExpiredStories();

    renderStories();

    setupEvents();

    startExpirationWatcher();
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    addStoryButton.addEventListener(
        "click",
        openUploadModal
    );

    emptyAddButton.addEventListener(
        "click",
        openUploadModal
    );

    selectImageButton.addEventListener(
        "click",
        () => imageInput.click()
    );

    closeUploadModal.addEventListener(
        "click",
        closeUpload
    );

    uploadModal.addEventListener(
        "click",
        event => {

            if (
                event.target.matches(
                    "[data-close-upload]"
                )
            ) {

                closeUpload();

            }

        }
    );

    imageInput.addEventListener(
        "change",
        handleImageSelection
    );

    closeViewer.addEventListener(
        "click",
        closeStoryViewer
    );

    nextStory.addEventListener(
        "click",
        goNext
    );

    previousStory.addEventListener(
        "click",
        goPrevious
    );

    deleteStoryButton.addEventListener(
        "click",
        deleteCurrentStory
    );

    pauseButton.addEventListener(
        "click",
        togglePause
    );

    clearStoriesButton.addEventListener(
        "click",
        clearAllStories
    );


    /* Touch */

    storyStage.addEventListener(
        "touchstart",
        handleTouchStart,
        { passive: true }
    );

    storyStage.addEventListener(
        "touchend",
        handleTouchEnd,
        { passive: true }
    );


    /* Keyboard */

    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    /* Mouse hold */

    storyStage.addEventListener(
        "pointerdown",
        event => {

            if (
                event.pointerType === "mouse"
            ) {

                pauseStory();

            }

        }
    );

    storyStage.addEventListener(
        "pointerup",
        event => {

            if (
                event.pointerType === "mouse"
            ) {

                resumeStory();

            }

        }
    );


    /* Visibility */

    document.addEventListener(
        "visibilitychange",
        handleVisibility
    );
}


/* =========================================================
   MONGODB / API
========================================================= */


/*
    Load active stories from MongoDB Atlas
*/

async function loadStories() {

    try {

        const response =
            await fetch(
                "/api/stories"
            );


        if (!response.ok) {

            throw new Error(
                `Failed to load stories: ${response.status}`
            );

        }


        const data =
            await response.json();


        stories =
            Array.isArray(data)
                ? data
                : [];


    } catch (error) {

        console.error(
            "Load stories error:",
            error
        );


        stories = [];


        showToast(
            "Could not load stories from cloud.",
            "error"
        );

    }

}


/*
    Save new story to MongoDB Atlas
*/

async function saveStoryToCloud(
    image
) {

    const response =
        await fetch(
            "/api/stories",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    image: image
                })
            }
        );


    if (!response.ok) {

        let message =
            "Failed to save story.";

        try {

            const errorData =
                await response.json();

            if (
                errorData.message
            ) {

                message =
                    errorData.message;

            }

        } catch {

            // Ignore invalid error response.

        }


        throw new Error(
            message
        );

    }


    return await response.json();
}


/*
    Delete one story from MongoDB Atlas
*/

async function deleteStoryFromCloud(
    id
) {

    const response =
        await fetch(
            `/api/stories/${id}`,
            {
                method: "DELETE"
            }
        );


    if (!response.ok) {

        let message =
            "Failed to delete story.";

        try {

            const errorData =
                await response.json();

            if (
                errorData.message
            ) {

                message =
                    errorData.message;

            }

        } catch {

            // Ignore invalid error response.

        }


        throw new Error(
            message
        );

    }


    return await response.json();
}


/*
    Delete all stories from MongoDB Atlas
*/

async function deleteAllStoriesFromCloud() {

    const response =
        await fetch(
            "/api/stories",
            {
                method: "DELETE"
            }
        );


    if (!response.ok) {

        let message =
            "Failed to delete stories.";

        try {

            const errorData =
                await response.json();

            if (
                errorData.message
            ) {

                message =
                    errorData.message;

            }

        } catch {

            // Ignore invalid error response.

        }


        throw new Error(
            message
        );

    }


    return await response.json();
}


/* =========================================================
   EXPIRATION
========================================================= */

function cleanExpiredStories() {

    const now =
        Date.now();


    stories =
        stories.filter(
            story => {

                const expiresAt =
                    new Date(
                        story.expiresAt
                    ).getTime();


                return (
                    expiresAt > now
                );

            }
        );
}


/*
    Refresh stories from MongoDB
    every 30 seconds.
*/

function startExpirationWatcher() {

    setInterval(
        async () => {

            try {

                const response =
                    await fetch(
                        "/api/stories"
                    );


                if (!response.ok) {
                    return;
                }


                const data =
                    await response.json();


                stories =
                    Array.isArray(data)
                        ? data
                        : [];


                cleanExpiredStories();

                renderStories();


                if (
                    !storyViewer.classList.contains(
                        "hidden"
                    )
                ) {

                    if (
                        stories.length === 0
                    ) {

                        closeStoryViewer();

                    } else if (
                        currentStoryIndex >=
                        stories.length
                    ) {

                        currentStoryIndex =
                            stories.length - 1;

                        showStory(
                            currentStoryIndex
                        );

                    }

                }


            } catch (error) {

                console.error(
                    "Cloud refresh error:",
                    error
                );

            }

        },
        30 * 1000
    );
}


/* =========================================================
   RENDER STORIES
========================================================= */

function renderStories() {

    cleanExpiredStories();


    const generated =
        storiesContainer.querySelectorAll(
            ".generated-story"
        );


    generated.forEach(
        element =>
            element.remove()
    );


    stories.forEach(
        (story, index) => {

            const card =
                createStoryCard(
                    story,
                    index
                );


            storiesContainer.appendChild(
                card
            );

        }
    );


    updateStoryUI();
}


/* =========================================================
   CREATE STORY CARD
========================================================= */

function createStoryCard(
    story,
    index
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "story-card generated-story";


    const ring =
        document.createElement(
            "div"
        );


    ring.className =
        "story-ring";


    const imageContainer =
        document.createElement(
            "div"
        );


    imageContainer.className =
        "story-image";


    const image =
        document.createElement(
            "img"
        );


    image.src =
        story.image;


    image.alt =
        "Story";


    const name =
        document.createElement(
            "span"
        );


    name.className =
        "story-name";


    name.textContent =
        "Your story";


    imageContainer.appendChild(
        image
    );


    ring.appendChild(
        imageContainer
    );


    button.appendChild(
        ring
    );


    button.appendChild(
        name
    );


    button.addEventListener(
        "click",
        () =>
            openStoryViewer(index)
    );


    return button;
}


/* =========================================================
   UPDATE STORY UI
========================================================= */

function updateStoryUI() {

    const count =
        stories.length;


    storyCount.textContent =
        `${count} active ${
            count === 1
                ? "story"
                : "stories"
        }`;


    if (
        count === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        clearStoriesButton.classList.add(
            "hidden"
        );

    } else {

        emptyState.classList.add(
            "hidden"
        );

        clearStoriesButton.classList.remove(
            "hidden"
        );

    }
}


/* =========================================================
   UPLOAD MODAL
========================================================= */

function openUploadModal() {

    uploadModal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";
}


function closeUpload() {

    uploadModal.classList.add(
        "hidden"
    );


    if (
        storyViewer.classList.contains(
            "hidden"
        )
    ) {

        document.body.style.overflow =
            "";

    }
}


/* =========================================================
   IMAGE SELECTION
========================================================= */

async function handleImageSelection(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showToast(
            "Please choose an image.",
            "error"
        );


        resetFileInput();

        return;
    }


    const maxFileSize =
        15 * 1024 * 1024;


    if (
        file.size > maxFileSize
    ) {

        showToast(
            "Image must be smaller than 15MB.",
            "error"
        );


        resetFileInput();

        return;
    }


    closeUpload();

    showLoading();


    try {

        /*
            Convert and resize image
            exactly like your original code.
        */

        const image =
            await processImage(
                file
            );


        /*
            Save Base64 image
            directly to MongoDB Atlas
            through Express.
        */

        const savedStory =
            await saveStoryToCloud(
                image
            );


        /*
            MongoDB returns:
            _id
            image
            createdAt
            expiresAt
        */

        stories.unshift(
            savedStory
        );


        renderStories();


        showToast(
            "Your story has been added.",
            "success"
        );


    } catch (error) {

        console.error(
            "Upload error:",
            error
        );


        showToast(
            "Could not save your story.",
            "error"
        );


    } finally {

        hideLoading();

        resetFileInput();

    }
}


/* =========================================================
   IMAGE PROCESSING
========================================================= */

function processImage(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const image =
                        new Image();


                    image.onload =
                        () => {

                            let width =
                                image.naturalWidth;


                            let height =
                                image.naturalHeight;


                            const scale =
                                Math.min(
                                    MAX_WIDTH / width,
                                    MAX_HEIGHT / height,
                                    1
                                );


                            width =
                                Math.round(
                                    width * scale
                                );


                            height =
                                Math.round(
                                    height * scale
                                );


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;


                            canvas.height =
                                height;


                            const context =
                                canvas.getContext(
                                    "2d"
                                );


                            context.imageSmoothingEnabled =
                                true;


                            context.imageSmoothingQuality =
                                "high";


                            /*
                                White background.
                            */

                            context.fillStyle =
                                "#ffffff";


                            context.fillRect(
                                0,
                                0,
                                width,
                                height
                            );


                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );


                            /*
                                Convert to Base64.
                            */

                            const base64 =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.84
                                );


                            resolve(
                                base64
                            );

                        };


                    image.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Invalid image"
                                )
                            );

                        };


                    image.src =
                        event.target.result;

                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "File could not be read"
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );
}


/* =========================================================
   STORY VIEWER
========================================================= */

function openStoryViewer(
    index
) {

    cleanExpiredStories();


    if (
        stories.length === 0
    ) {
        return;
    }


    if (
        index < 0 ||
        index >= stories.length
    ) {
        return;
    }


    currentStoryIndex =
        index;


    storyViewer.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";


    showStory(
        currentStoryIndex
    );
}


/* =========================================================
   SHOW STORY
========================================================= */

function showStory(
    index
) {

    if (
        storyTransitioning
    ) {
        return;
    }


    if (
        index < 0 ||
        index >= stories.length
    ) {

        closeStoryViewer();

        return;
    }


    clearTimer();


    currentStoryIndex =
        index;


    const story =
        stories[index];


    renderProgressBars();


    storyTransitioning =
        true;


    storyPhotoWrapper.style.opacity =
        "0";


    storyPhotoWrapper.style.transform =
        "scale(.97)";


    setTimeout(
        () => {

            viewerImage.src =
                story.image;


            viewerAvatar.src =
                story.image;


            viewerBackground.style.backgroundImage =
                `url("${story.image}")`;


            storyTime.textContent =
                getTimeAgo(
                    story.createdAt
                );


            requestAnimationFrame(
                () => {

                    storyPhotoWrapper.style.opacity =
                        "1";


                    storyPhotoWrapper.style.transform =
                        "scale(1)";


                    storyTransitioning =
                        false;

                }
            );


        },
        100
    );


    isPaused =
        false;


    elapsedBeforePause =
        0;


    currentDuration =
        STORY_DURATION;


    updatePauseIcon();


    startTimer();
}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgressBars() {

    progressContainer.innerHTML =
        "";


    stories.forEach(
        (_, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "progress-item";


            const fill =
                document.createElement(
                    "div"
                );


            fill.className =
                "progress-fill";


            if (
                index <
                currentStoryIndex
            ) {

                fill.style.width =
                    "100%";

            }


            item.appendChild(
                fill
            );


            progressContainer.appendChild(
                item
            );

        }
    );
}


function startTimer() {

    clearTimer();


    const bars =
        progressContainer.querySelectorAll(
            ".progress-fill"
        );


    const currentBar =
        bars[currentStoryIndex];


    if (!currentBar) {
        return;
    }


    const startTime =
        Date.now();


    progressStartTime =
        startTime;


    progressTimer =
        setInterval(
            () => {

                if (
                    isPaused
                ) {
                    return;
                }


                const elapsed =
                    Date.now() -
                    startTime;


                const totalElapsed =
                    elapsedBeforePause +
                    elapsed;


                const percentage =
                    Math.min(
                        totalElapsed /
                        currentDuration *
                        100,
                        100
                    );


                currentBar.style.width =
                    `${percentage}%`;


                if (
                    percentage >= 100
                ) {

                    clearTimer();

                    goNext();

                }

            },
            20
        );
}


function clearTimer() {

    if (
        progressTimer !== null
    ) {

        clearInterval(
            progressTimer
        );


        progressTimer =
            null;

    }
}


/* =========================================================
   NAVIGATION
========================================================= */

function goNext() {

    clearTimer();


    if (
        currentStoryIndex <
        stories.length - 1
    ) {

        currentStoryIndex++;


        showStory(
            currentStoryIndex
        );

    } else {

        closeStoryViewer();

    }
}


function goPrevious() {

    clearTimer();


    if (
        currentStoryIndex > 0
    ) {

        currentStoryIndex--;


        showStory(
            currentStoryIndex
        );

    } else {

        showStory(
            currentStoryIndex
        );

    }
}


/* =========================================================
   DELETE STORY
========================================================= */

async function deleteCurrentStory() {

    if (
        !stories[currentStoryIndex]
    ) {
        return;
    }


    const shouldDelete =
        confirm(
            "Delete this story?"
        );


    if (!shouldDelete) {
        return;
    }


    const story =
        stories[currentStoryIndex];


    try {

        /*
            Delete from MongoDB first.
        */

        await deleteStoryFromCloud(
            story._id
        );


        /*
            Then remove from
            local in-memory array.
        */

        stories.splice(
            currentStoryIndex,
            1
        );


        renderStories();


        if (
            stories.length === 0
        ) {

            closeStoryViewer();


            showToast(
                "Story deleted.",
                "success"
            );


            return;
        }


        if (
            currentStoryIndex >=
            stories.length
        ) {

            currentStoryIndex =
                stories.length - 1;

        }


        showStory(
            currentStoryIndex
        );


        showToast(
            "Story deleted.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        showToast(
            "Could not delete story from cloud.",
            "error"
        );

    }
}


/* =========================================================
   CLEAR ALL
========================================================= */

async function clearAllStories() {

    if (
        stories.length === 0
    ) {
        return;
    }


    const confirmed =
        confirm(
            "Delete all stories?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteAllStoriesFromCloud();


        stories = [];


        renderStories();


        if (
            !storyViewer.classList.contains(
                "hidden"
            )
        ) {

            closeStoryViewer();

        }


        showToast(
            "All stories deleted.",
            "success"
        );


    } catch (error) {

        console.error(
            "Clear all error:",
            error
        );


        showToast(
            "Could not delete stories from cloud.",
            "error"
        );

    }
}


/* =========================================================
   PAUSE / RESUME
========================================================= */

function pauseStory() {

    if (
        isPaused ||
        storyViewer.classList.contains(
            "hidden"
        )
    ) {
        return;
    }


    const elapsed =
        Date.now() -
        progressStartTime;


    elapsedBeforePause +=
        elapsed;


    isPaused =
        true;


    clearTimer();


    updatePauseIcon();
}


function resumeStory() {

    if (
        !isPaused
    ) {
        return;
    }


    isPaused =
        false;


    startTimer();


    updatePauseIcon();
}


function togglePause() {

    if (
        isPaused
    ) {

        resumeStory();

    } else {

        pauseStory();

    }
}


function updatePauseIcon() {

    pauseIcon.textContent =
        isPaused
            ? "▶"
            : "Ⅱ";
}


/* =========================================================
   TOUCH / SWIPE
========================================================= */

function handleTouchStart(
    event
) {

    const touch =
        event.changedTouches[0];


    touchStartX =
        touch.clientX;


    touchStartY =
        touch.clientY;


    touchStartTime =
        Date.now();
}


function handleTouchEnd(
    event
) {

    const touch =
        event.changedTouches[0];


    const endX =
        touch.clientX;


    const endY =
        touch.clientY;


    const deltaX =
        endX -
        touchStartX;


    const deltaY =
        endY -
        touchStartY;


    const duration =
        Date.now() -
        touchStartTime;


    /*
        Ignore vertical gestures.
    */

    if (
        Math.abs(deltaY) >
        Math.abs(deltaX)
    ) {

        return;

    }


    /*
        Ignore tiny movement.
    */

    if (
        Math.abs(deltaX) < 50
    ) {

        return;

    }


    /*
        Swipe speed / distance.
    */

    if (
        duration > 800 &&
        Math.abs(deltaX) < 90
    ) {

        return;

    }


    if (
        deltaX < 0
    ) {

        goNext();

    } else {

        goPrevious();

    }
}


/* =========================================================
   KEYBOARD
========================================================= */

function handleKeyboard(
    event
) {

    if (
        storyViewer.classList.contains(
            "hidden"
        )
    ) {
        return;
    }


    switch (
        event.key
    ) {

        case "Escape":

            closeStoryViewer();

            break;


        case "ArrowRight":

            goNext();

            break;


        case "ArrowLeft":

            goPrevious();

            break;


        case " ":

            event.preventDefault();

            togglePause();

            break;

    }
}


/* =========================================================
   VISIBILITY
========================================================= */

function handleVisibility() {

    if (
        storyViewer.classList.contains(
            "hidden"
        )
    ) {
        return;
    }


    if (
        document.hidden
    ) {

        pauseStory();

    } else {

        resumeStory();

    }
}


/* =========================================================
   CLOSE VIEWER
========================================================= */

function closeStoryViewer() {

    clearTimer();


    storyViewer.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";


    viewerImage.src =
        "";


    viewerAvatar.src =
        "";


    viewerBackground.style.backgroundImage =
        "";


    isPaused =
        false;


    elapsedBeforePause =
        0;


    updatePauseIcon();
}


/* =========================================================
   TIME
========================================================= */

function getTimeAgo(
    timestamp
) {

    const difference =
        Date.now() -
        new Date(
            timestamp
        ).getTime();


    const seconds =
        Math.floor(
            difference / 1000
        );


    if (
        seconds < 60
    ) {

        return "Just now";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (
        minutes < 60
    ) {

        return `${minutes}m ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (
        hours < 24
    ) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    return `${days}d ago`;
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    const text =
        document.createElement(
            "span"
        );


    text.textContent =
        message;


    toast.appendChild(
        text
    );


    toastContainer.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.style.opacity =
                "0";


            toast.style.transform =
                "translateY(10px)";


            setTimeout(
                () => {

                    toast.remove();

                },
                250
            );

        },
        3000
    );
}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    loadingScreen.classList.remove(
        "hidden"
    );
}


function hideLoading() {

    loadingScreen.classList.add(
        "hidden"
    );
}


/* =========================================================
   HELPERS
========================================================= */

function resetFileInput() {

    imageInput.value =
        "";
}


/* =========================================================
   SAFETY: CLEAN ON LOAD
========================================================= */

window.addEventListener(
    "load",
    () => {

        cleanExpiredStories();

        renderStories();

    }
);