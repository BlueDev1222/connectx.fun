/* =====================================================
   CONNECTX
   SUPABASE + AUTH + SOCIAL FEATURES
===================================================== */


/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://onvmeffhmruzshqlwakx.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9VzEW8DurRpM51GgQ282BQ_qQ3e1WkX";

let supabaseClient;


/* =====================================================
   GLOBAL STATE
===================================================== */

let currentUser = null;
let currentProfile = null;


/* =====================================================
   STARTUP
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        if (!window.supabase) {

            showFatalError(
                "ConnectX could not load Supabase. Please refresh the page."
            );

            return;
        }

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

        setupEvents();

        await checkSession();

    }
);


/* =====================================================
   HELPERS
===================================================== */

function initials(name) {

    if (!name)
        return "U";

    return String(name)
        .trim()
        .split(/\s+/)
        .map(x => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}


function escapeHTML(text) {

    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function timeAgo(date) {

    const seconds =
        Math.floor(
            (Date.now() -
                new Date(date).getTime()) /
            1000
        );

    if (seconds < 60)
        return `${Math.max(seconds, 0)}s`;

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60)
        return `${minutes}m`;

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24)
        return `${hours}h`;

    const days =
        Math.floor(hours / 24);

    return `${days}d`;
}


function showFatalError(message) {

    const auth =
        document.getElementById(
            "authMessage"
        );

    if (auth)
        auth.textContent = message;
}


/* =====================================================
   AUTH MESSAGE
===================================================== */

function authMessage(
    message,
    error = true
) {

    const element =
        document.getElementById(
            "authMessage"
        );

    if (!element)
        return;

    element.textContent =
        message;

    element.style.color =
        error
            ? "#dc2626"
            : "#16803c";
}


/* =====================================================
   LOADING BUTTON
===================================================== */

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button)
        return;

    if (loading) {

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            loadingText;

        button.disabled = true;

    } else {

        button.textContent =
            button.dataset.originalText ||
            button.textContent;

        button.disabled = false;

    }
}


/* =====================================================
   PASSWORD TOGGLE
===================================================== */

function setupPasswordToggle(
    inputId,
    buttonId
) {

    const input =
        document.getElementById(inputId);

    const button =
        document.getElementById(buttonId);

    if (!input || !button)
        return;

    button.addEventListener(
        "click",
        () => {

            const showing =
                input.type === "text";

            input.type =
                showing
                    ? "password"
                    : "text";

            button.textContent =
                showing
                    ? "Show"
                    : "Hide";

            button.setAttribute(
                "aria-label",
                showing
                    ? "Show password"
                    : "Hide password"
            );

        }
    );
}


/* =====================================================
   SETUP EVENTS
===================================================== */

function setupEvents() {

    setupPasswordToggle(
        "loginPassword",
        "loginPasswordToggle"
    );

    setupPasswordToggle(
        "registerPassword",
        "registerPasswordToggle"
    );


    /* Login */

    document
        .getElementById("loginForm")
        .addEventListener(
            "submit",
            login
        );


    /* Register */

    document
        .getElementById("registerForm")
        .addEventListener(
            "submit",
            register
        );


    /* Switch */

    document
        .getElementById("switchAuth")
        .addEventListener(
            "click",
            switchAuth
        );


    /* Forgot password */

    document
        .getElementById("forgotPassword")
        .addEventListener(
            "click",
            openReset
        );


    document
        .getElementById("closeReset")
        .addEventListener(
            "click",
            closeReset
        );


    document
        .getElementById("sendReset")
        .addEventListener(
            "click",
            sendPasswordReset
        );


    /* Username */

    document
        .getElementById("registerUsername")
        .addEventListener(
            "input",
            checkUsername
        );


    /* Password strength */

    document
        .getElementById("registerPassword")
        .addEventListener(
            "input",
            updatePasswordStrength
        );


    /* Posting */

    document
        .getElementById("postInput")
        .addEventListener(
            "input",
            updateCharacterCount
        );


    document
        .getElementById("postButton")
        .addEventListener(
            "click",
            createPost
        );


    document
        .getElementById("sidebarPostButton")
        .addEventListener(
            "click",
            focusComposer
        );


    document
        .getElementById("mobilePost")
        .addEventListener(
            "click",
            focusComposer
        );


    /* Logout */

    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            logout
        );


    /* Dark mode */

    document
        .getElementById("darkModeButton")
        .addEventListener(
            "click",
            toggleDarkMode
        );


    /* Search */

    document
        .getElementById("searchInput")
        .addEventListener(
            "input",
            search
        );


    document
        .getElementById("rightSearch")
        .addEventListener(
            "focus",
            () => navigate("explore")
        );


    /* Navigation */

    document
        .querySelectorAll("[data-page]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    navigate(
                        button.dataset.page
                    );

                }
            );

        });

}


/* =====================================================
   LOGIN
===================================================== */

async function login(event) {

    event.preventDefault();

    const button =
        document.getElementById(
            "loginButton"
        );

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;

    authMessage("");

    setButtonLoading(
        button,
        true,
        "Logging in..."
    );

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({
                    email,
                    password
                });


        if (error)
            throw error;


        currentUser =
            data.user;


        await loadApp();

    } catch (error) {

        console.error(error);

        authMessage(
            getFriendlyAuthError(
                error
            )
        );

    } finally {

        setButtonLoading(
            button,
            false
        );

    }

}


/* =====================================================
   REGISTER
===================================================== */

async function register(event) {

    event.preventDefault();

    const button =
        document.getElementById(
            "registerButton"
        );

    const name =
        document
            .getElementById("registerName")
            .value
            .trim();

    const username =
        document
            .getElementById(
                "registerUsername"
            )
            .value
            .trim()
            .toLowerCase();

    const email =
        document
            .getElementById("registerEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("registerPassword")
            .value;


    authMessage("");


    if (name.length < 1) {

        authMessage(
            "Please enter your display name."
        );

        return;
    }


    if (
        !/^[a-z0-9_]+$/.test(
            username
        )
    ) {

        authMessage(
            "Username can only contain letters, numbers, and underscores."
        );

        return;
    }


    if (
        username.length < 3
    ) {

        authMessage(
            "Username must be at least 3 characters."
        );

        return;
    }


    if (
        password.length < 6
    ) {

        authMessage(
            "Password must be at least 6 characters."
        );

        return;
    }


    setButtonLoading(
        button,
        true,
        "Creating account..."
    );


    try {

        /* Check username */

        const {
            data: existing,
            error: usernameError
        } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .eq(
                    "username",
                    username
                )
                .maybeSingle();


        if (usernameError)
            throw usernameError;


        if (existing) {

            throw new Error(
                "That username is already taken."
            );

        }


        /* Create account */

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .signUp({

                    email,

                    password,

                    options: {

                        emailRedirectTo:
                            `${window.location.origin}/verify`,

                        data: {

                            username,

                            display_name:
                                name

                        }

                    }

                });


        if (error)
            throw error;


        if (data.session) {

            currentUser =
                data.user;

            await loadApp();

        } else {

            authMessage(
                "Account created! Check your email to verify your ConnectX account.",
                false
            );

        }

    } catch (error) {

        console.error(error);

        authMessage(
            getFriendlyAuthError(
                error
            )
        );

    } finally {

        setButtonLoading(
            button,
            false
        );

    }

}


/* =====================================================
   FRIENDLY AUTH ERRORS
===================================================== */

function getFriendlyAuthError(error) {

    const message =
        String(
            error?.message ||
            error ||
            ""
        );

    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";

    }


    if (
        lower.includes(
            "email not confirmed"
        )
    ) {

        return "Please verify your email before logging in.";

    }


    if (
        lower.includes(
            "user already registered"
        )
    ) {

        return "An account with this email already exists.";

    }


    if (
        lower.includes(
            "password should be at least"
        )
    ) {

        return "Your password is too short.";

    }


    return message || "Something went wrong.";
}


/* =====================================================
   SWITCH AUTH
===================================================== */

function switchAuth() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );

    const registerForm =
        document.getElementById(
            "registerForm"
        );

    const title =
        document.getElementById(
            "authTitle"
        );

    const subtitle =
        document.getElementById(
            "authSubtitle"
        );

    const button =
        document.getElementById(
            "switchAuth"
        );


    const showingLogin =
        !loginForm.classList.contains(
            "hidden"
        );


    authMessage("");


    if (showingLogin) {

        loginForm.classList.add(
            "hidden"
        );

        registerForm.classList.remove(
            "hidden"
        );

        title.textContent =
            "Create your account";

        subtitle.textContent =
            "Join ConnectX today.";

        button.textContent =
            "Already have an account? Log in";

    } else {

        registerForm.classList.add(
            "hidden"
        );

        loginForm.classList.remove(
            "hidden"
        );

        title.textContent =
            "Welcome to ConnectX";

        subtitle.textContent =
            "Connect with everyone.";

        button.textContent =
            "Create an account";

    }

}


/* =====================================================
   USERNAME CHECK
===================================================== */

let usernameTimer;

async function checkUsername() {

    clearTimeout(usernameTimer);

    const input =
        document.getElementById(
            "registerUsername"
        );

    const status =
        document.getElementById(
            "usernameStatus"
        );

    const username =
        input.value
            .trim()
            .toLowerCase();


    if (!username) {

        status.textContent = "";

        return;
    }


    if (
        !/^[a-z0-9_]+$/.test(
            username
        )
    ) {

        status.textContent =
            "Letters, numbers and underscores only.";

        status.style.color =
            "#dc2626";

        return;
    }


    if (username.length < 3) {

        status.textContent =
            "At least 3 characters.";

        status.style.color =
            "#667085";

        return;
    }


    status.textContent =
        "Checking...";

    status.style.color =
        "#667085";


    usernameTimer =
        setTimeout(
            async () => {

                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .from("profiles")
                            .select("id")
                            .eq(
                                "username",
                                username
                            )
                            .maybeSingle();


                    if (error)
                        throw error;


                    if (data) {

                        status.textContent =
                            "Username is already taken.";

                        status.style.color =
                            "#dc2626";

                    } else {

                        status.textContent =
                            "Username is available.";

                        status.style.color =
                            "#16803c";

                    }

                } catch (error) {

                    console.error(error);

                    status.textContent = "";

                }

            },
            400
        );

}


/* =====================================================
   PASSWORD STRENGTH
===================================================== */

function updatePasswordStrength() {

    const password =
        document.getElementById(
            "registerPassword"
        ).value;

    const element =
        document.getElementById(
            "passwordStrength"
        );


    if (!password) {

        element.textContent = "";

        return;
    }


    let score = 0;


    if (password.length >= 6)
        score++;

    if (password.length >= 10)
        score++;

    if (/[A-Z]/.test(password))
        score++;

    if (/[0-9]/.test(password))
        score++;

    if (/[^A-Za-z0-9]/.test(password))
        score++;


    if (score <= 1) {

        element.textContent =
            "Weak password";

        element.style.color =
            "#dc2626";

    } else if (score <= 3) {

        element.textContent =
            "Medium password";

        element.style.color =
            "#ca8a04";

    } else {

        element.textContent =
            "Strong password";

        element.style.color =
            "#16803c";

    }

}


/* =====================================================
   PASSWORD RESET
===================================================== */

function openReset() {

    document
        .getElementById("resetModal")
        .classList.remove(
            "hidden"
        );

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    document
        .getElementById("resetEmail")
        .value =
        email;

}


function closeReset() {

    document
        .getElementById("resetModal")
        .classList.add(
            "hidden"
        );

}


async function sendPasswordReset() {

    const email =
        document
            .getElementById("resetEmail")
            .value
            .trim();

    const message =
        document.getElementById(
            "resetMessage"
        );

    const button =
        document.getElementById(
            "sendReset"
        );


    if (!email) {

        message.textContent =
            "Enter your email.";

        message.style.color =
            "#dc2626";

        return;
    }


    setButtonLoading(
        button,
        true,
        "Sending..."
    );


    try {

        const {
            error
        } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            `${window.location.origin}/reset`
                    }
                );


        if (error)
            throw error;


        message.textContent =
            "Password reset email sent.";

        message.style.color =
            "#16803c";

    } catch (error) {

        message.textContent =
            getFriendlyAuthError(
                error
            );

        message.style.color =
            "#dc2626";

    } finally {

        setButtonLoading(
            button,
            false
        );

    }

}


/* =====================================================
   LOAD APP
===================================================== */

async function loadApp() {

    if (!currentUser)
        return;


    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(error);

        authMessage(
            "Your account loaded, but your profile could not be loaded."
        );

        return;
    }


    /*
        Create missing profile if needed.
    */

    if (!profile) {

        const metadata =
            currentUser.user_metadata ||
            {};

        const username =
            metadata.username ||
            `user_${currentUser.id.slice(0, 8)}`;

        const displayName =
            metadata.display_name ||
            "ConnectX User";


        const {
            data: created,
            error: createError
        } =
            await supabaseClient
                .from("profiles")
                .insert({

                    id:
                        currentUser.id,

                    username,

                    display_name:
                        displayName

                })
                .select()
                .single();


        if (createError) {

            console.error(
                createError
            );

            authMessage(
                "Could not create your ConnectX profile."
            );

            return;
        }


        currentProfile =
            created;

    } else {

        currentProfile =
            profile;

    }


    document
        .getElementById("authScreen")
        .style.display =
        "none";


    document
        .getElementById("app")
        .classList.remove(
            "app-hidden"
        );


    updateUserUI();

    await loadFeed();

    await loadSuggestions();

    await loadProfile();

    await loadNotifications();

}


/* =====================================================
   USER UI
===================================================== */

function updateUserUI() {

    if (!currentProfile)
        return;


    const name =
        currentProfile.display_name ||
        "User";


    document
        .getElementById(
            "sidebarName"
        )
        .textContent =
        name;


    document
        .getElementById(
            "sidebarUsername"
        )
        .textContent =
        "@" +
        currentProfile.username;


    document
        .getElementById(
            "sidebarAvatar"
        )
        .textContent =
        initials(name);


    document
        .getElementById(
            "composerAvatar"
        )
        .textContent =
        initials(name);


    document
        .getElementById(
            "profileAvatar"
        )
        .textContent =
        initials(name);


    const verified =
        currentProfile.is_verified === true ||
        currentProfile.username ===
            "connectx";


    const badge =
        document.getElementById(
            "profileVerifiedBadge"
        );


    if (verified) {

        badge.classList.remove(
            "hidden"
        );

    } else {

        badge.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   FEED
===================================================== */

async function loadFeed() {

    const feed =
        document.getElementById(
            "feed"
        );


    feed.innerHTML =
        `<div class="empty">
            Loading posts...
        </div>`;


    const {
        data: posts,
        error
    } =
        await supabaseClient
            .from("posts")
            .select(`
                id,
                user_id,
                content,
                image_url,
                repost_of,
                created_at,
                profiles (
                    id,
                    username,
                    display_name,
                    avatar_url,
                    is_verified
                ),
                likes (
                    user_id
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(100);


    if (error) {

        console.error(
            "Failed to load posts:",
            error
        );

        feed.innerHTML =
            `<div class="empty">
                Failed to load posts.
                <br>
                <small>
                    ${escapeHTML(error.message)}
                </small>
            </div>`;

        return;
    }


    if (!posts?.length) {

        feed.innerHTML =
            `<div class="empty">
                No posts yet. Be the first to post!
            </div>`;

        return;
    }


    feed.innerHTML =
        posts
            .map(renderPost)
            .join("");

}


/* =====================================================
   RENDER POST
===================================================== */

function renderPost(post) {

    const profile =
        post.profiles || {};

    const likes =
        post.likes || [];


    const liked =
        likes.some(
            like =>
                like.user_id ===
                currentUser.id
        );


    const own =
        post.user_id ===
        currentUser.id;


    const verified =
        profile.is_verified === true ||
        profile.username ===
            "connectx";


    const verifiedBadge =
        verified
            ?
            `
                <img
                    class="post-verified"
                    src="Verified ConnectX.jpg"
                    alt="Verified"
                    title="Verified"
                >
            `
            :
            "";


    const image =
        post.image_url
            ?
            `
                <img
                    src="${escapeHTML(post.image_url)}"
                    alt="Post image"
                    style="
                        width:100%;
                        max-height:500px;
                        object-fit:cover;
                        border-radius:14px;
                        margin-top:10px;
                    "
                >
            `
            :
            "";


    return `

        <article class="post">

            <div class="avatar">

                ${initials(
                    profile.display_name
                )}

            </div>


            <div class="post-body">

                <div class="post-header">

                    <strong class="post-name">

                        ${escapeHTML(
                            profile.display_name ||
                            "User"
                        )}

                    </strong>

                    ${verifiedBadge}

                    <span class="post-user">

                        @${escapeHTML(
                            profile.username ||
                            "user"
                        )}

                    </span>

                    <span class="post-user">

                        · ${timeAgo(
                            post.created_at
                        )}

                    </span>

                </div>


                <div class="post-content">

                    ${escapeHTML(
                        post.content
                    )}

                </div>


                ${image}


                <div class="actions">

                    <button
                        class="action"
                        onclick="commentPost('${post.id}')"
                    >
                        💬
                    </button>


                    <button
                        class="action ${
                            liked
                                ? "liked"
                                : ""
                        }"
                        onclick="toggleLike('${post.id}')"
                    >
                        ${
                            liked
                                ? "♥"
                                : "♡"
                        }

                        ${likes.length}

                    </button>


                    <button
                        class="action"
                        onclick="sharePost('${post.id}')"
                    >
                        ↗
                    </button>


                    <button
                        class="action"
                        onclick="bookmarkPost('${post.id}')"
                    >
                        🔖
                    </button>


                    ${
                        own
                            ?
                            `<button
                                class="action"
                                onclick="deletePost('${post.id}')"
                            >
                                🗑
                            </button>`
                            :
                            ""
                    }

                </div>

            </div>

        </article>

    `;
}


/* =====================================================
   CHARACTER COUNT
===================================================== */

function updateCharacterCount() {

    const input =
        document.getElementById(
            "postInput"
        );

    document
        .getElementById(
            "characterCount"
        )
        .textContent =
        `${input.value.length}/280`;

}


/* =====================================================
   FOCUS COMPOSER
===================================================== */

function focusComposer() {

    navigate("home");

    document
        .getElementById(
            "postInput"
        )
        .focus();

}


/* =====================================================
   CREATE POST
===================================================== */

async function createPost() {

    if (!currentUser)
        return;


    const input =
        document.getElementById(
            "postInput"
        );

    const button =
        document.getElementById(
            "postButton"
        );


    const content =
        input.value.trim();


    if (!content)
        return;


    setButtonLoading(
        button,
        true,
        "Posting..."
    );


    try {

        const {
            error
        } =
            await supabaseClient
                .from("posts")
                .insert({

                    user_id:
                        currentUser.id,

                    content

                });


        if (error)
            throw error;


        input.value = "";

        updateCharacterCount();

        await loadFeed();

        await loadProfile();

    } catch (error) {

        console.error(error);

        alert(
            error.message
        );

    } finally {

        setButtonLoading(
            button,
            false
        );

    }

}


/* =====================================================
   LIKE
===================================================== */

async function toggleLike(
    postId
) {

    if (!currentUser)
        return;


    const {
        data: existing,
        error: checkError
    } =
        await supabaseClient
            .from("likes")
            .select("post_id")
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (checkError) {

        alert(
            checkError.message
        );

        return;
    }


    if (existing) {

        const {
            error
        } =
            await supabaseClient
                .from("likes")
                .delete()
                .eq(
                    "post_id",
                    postId
                )
                .eq(
                    "user_id",
                    currentUser.id
                );

        if (error)
            alert(error.message);

    } else {

        const {
            error
        } =
            await supabaseClient
                .from("likes")
                .insert({

                    post_id:
                        postId,

                    user_id:
                        currentUser.id

                });

        if (error)
            alert(error.message);

    }


    await loadFeed();

}


/* =====================================================
   DELETE
===================================================== */

async function deletePost(
    postId
) {

    if (
        !confirm(
            "Delete this post?"
        )
    )
        return;


    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .delete()
            .eq(
                "id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    await loadFeed();

    await loadProfile();

}


/* =====================================================
   COMMENT
===================================================== */

async function commentPost(
    postId
) {

    const content =
        prompt(
            "Write your reply:"
        );


    if (
        !content ||
        !content.trim()
    )
        return;


    const {
        error
    } =
        await supabaseClient
            .from("comments")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id,

                content:
                    content.trim()

            });


    if (error) {

        alert(
            error.message
        );

        return;
    }


    alert(
        "Reply posted!"
    );

}


/* =====================================================
   SHARE
===================================================== */

async function sharePost(
    postId
) {

    const url =
        `${location.origin}${location.pathname}#post-${postId}`;


    try {

        await navigator.clipboard.writeText(
            url
        );

        alert(
            "Post link copied!"
        );

    } catch {

        prompt(
            "Copy this post link:",
            url
        );

    }

}


/* =====================================================
   BOOKMARK
===================================================== */

async function bookmarkPost(
    postId
) {

    const {
        data: existing,
        error: checkError
    } =
        await supabaseClient
            .from("bookmarks")
            .select("post_id")
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (checkError) {

        alert(
            checkError.message
        );

        return;
    }


    if (existing) {

        await supabaseClient
            .from("bookmarks")
            .delete()
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            );

        alert(
            "Removed from bookmarks."
        );

    } else {

        await supabaseClient
            .from("bookmarks")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id

            });

        alert(
            "Post bookmarked!"
        );

    }

}


/* =====================================================
   SUGGESTIONS
===================================================== */

async function loadSuggestions() {

    const container =
        document.getElementById(
            "suggestions"
        );


    const {
        data: profiles,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .neq(
                "id",
                currentUser.id
            )
            .limit(5);


    if (error) {

        console.error(error);

        return;
    }


    if (!profiles?.length) {

        container.innerHTML =
            `<span class="muted">
                No suggestions yet.
            </span>`;

        return;
    }


    const {
        data: following
    } =
        await supabaseClient
            .from("follows")
            .select(
                "following_id"
            )
            .eq(
                "follower_id",
                currentUser.id
            );


    const followingIds =
        new Set(
            (following || [])
                .map(
                    x =>
                        x.following_id
                )
        );


    container.innerHTML =
        profiles
            .map(
                profile => `

                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                            margin-bottom:15px;
                        "
                    >

                        <div class="avatar">

                            ${initials(
                                profile.display_name
                            )}

                        </div>


                        <div style="flex:1">

                            <strong>

                                ${escapeHTML(
                                    profile.display_name
                                )}

                            </strong>

                            <small
                                style="
                                    display:block;
                                    color:var(--muted);
                                "
                            >

                                @${escapeHTML(
                                    profile.username
                                )}

                            </small>

                        </div>


                        <button
                            onclick="
                                toggleFollow(
                                    '${profile.id}'
                                )
                            "
                            style="
                                border:0;
                                border-radius:20px;
                                padding:7px 12px;
                                cursor:pointer;
                            "
                        >

                            ${
                                followingIds.has(
                                    profile.id
                                )
                                    ?
                                    "Following"
                                    :
                                    "Follow"
                            }

                        </button>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   FOLLOW
===================================================== */

async function toggleFollow(
    userId
) {

    const {
        data: existing
    } =
        await supabaseClient
            .from("follows")
            .select(
                "follower_id"
            )
            .eq(
                "follower_id",
                currentUser.id
            )
            .eq(
                "following_id",
                userId
            )
            .maybeSingle();


    if (existing) {

        await supabaseClient
            .from("follows")
            .delete()
            .eq(
                "follower_id",
                currentUser.id
            )
            .eq(
                "following_id",
                userId
            );

    } else {

        await supabaseClient
            .from("follows")
            .insert({

                follower_id:
                    currentUser.id,

                following_id:
                    userId

            });

    }


    await loadSuggestions();

    await loadProfile();

}


/* =====================================================
   PROFILE
===================================================== */

async function loadProfile() {

    if (!currentProfile)
        return;


    document
        .getElementById(
            "profileName"
        )
        .textContent =
        currentProfile.display_name;


    document
        .getElementById(
            "profileUsername"
        )
        .textContent =
        "@" +
        currentProfile.username;


    document
        .getElementById(
            "profileBio"
        )
        .textContent =
        currentProfile.bio ||
        "Welcome to ConnectX!";


    const {
        count: posts
    } =
        await supabaseClient
            .from("posts")
            .select(
                "*",
                {
                    count:
                        "exact",
                    head: true
                }
            )
            .eq(
                "user_id",
                currentUser.id
            );


    const {
        count: followers
    } =
        await supabaseClient
            .from("follows")
            .select(
                "*",
                {
                    count:
                        "exact",
                    head: true
                }
            )
            .eq(
                "following_id",
                currentUser.id
            );


    const {
        count: following
    } =
        await supabaseClient
            .from("follows")
            .select(
                "*",
                {
                    count:
                        "exact",
                    head: true
                }
            )
            .eq(
                "follower_id",
                currentUser.id
            );


    document
        .getElementById(
            "postCount"
        )
        .textContent =
        posts || 0;


    document
        .getElementById(
            "followersCount"
        )
        .textContent =
        followers || 0;


    document
        .getElementById(
            "followingCount"
        )
        .textContent =
        following || 0;


    const {
        data
    } =
        await supabaseClient
            .from("posts")
            .select(`
                id,
                user_id,
                content,
                image_url,
                created_at,
                profiles (
                    id,
                    username,
                    display_name,
                    is_verified
                ),
                likes (
                    user_id
                )
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    document
        .getElementById(
            "profilePosts"
        )
        .innerHTML =
        (data || [])
            .map(renderPost)
            .join("");

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function loadNotifications() {

    const container =
        document.getElementById(
            "notifications"
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select(`
                *,
                profiles:actor_id (
                    username,
                    display_name
                )
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(50);


    if (error) {

        console.error(error);

        container.innerHTML =
            `<div style="padding:30px;color:var(--muted)">
                Notifications are unavailable right now.
            </div>`;

        return;
    }


    if (!data?.length) {

        container.innerHTML =
            `<div style="padding:30px;color:var(--muted)">
                No notifications yet.
            </div>`;

        return;
    }


    container.innerHTML =
        data
            .map(
                notification => `

                    <div
                        style="
                            padding:20px;
                            border-bottom:
                                1px solid
                                var(--border);
                        "
                    >

                        🔔

                        ${escapeHTML(
                            notification.type
                        )}

                        <div
                            style="
                                color:var(--muted);
                                font-size:13px;
                                margin-top:5px;
                            "
                        >

                            ${timeAgo(
                                notification.created_at
                            )}

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =====================================================
   SEARCH
===================================================== */

let searchTimer;

async function search() {

    clearTimeout(
        searchTimer
    );


    searchTimer =
        setTimeout(
            performSearch,
            250
        );

}


async function performSearch() {

    const query =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .trim();


    const results =
        document.getElementById(
            "searchResults"
        );


    if (!query) {

        results.innerHTML = "";

        return;
    }


    const {
        data: users
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .or(
                `username.ilike.%${query}%,display_name.ilike.%${query}%`
            )
            .limit(20);


    const {
        data: posts
    } =
        await supabaseClient
            .from("posts")
            .select(`
                id,
                user_id,
                content,
                created_at,
                profiles (
                    username,
                    display_name,
                    is_verified
                ),
                likes (
                    user_id
                )
            `)
            .ilike(
                "content",
                `%${query}%`
            )
            .limit(20);


    let html = "";


    if (users?.length) {

        html += `
            <h2 style="padding:20px">
                People
            </h2>
        `;


        html += users
            .map(
                user => `

                    <div class="post">

                        <div class="avatar">

                            ${initials(
                                user.display_name
                            )}

                        </div>

                        <div>

                            <strong>

                                ${escapeHTML(
                                    user.display_name
                                )}

                            </strong>

                            ${
                                user.is_verified
                                    ?
                                    `
                                        <img
                                            class="post-verified"
                                            src="Verified ConnectX.jpg"
                                            alt="Verified"
                                        >
                                    `
                                    :
                                    ""
                            }

                            <div class="post-user">

                                @${escapeHTML(
                                    user.username
                                )}

                            </div>

                            <div>

                                ${escapeHTML(
                                    user.bio || ""
                                )}

                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

    }


    if (posts?.length) {

        html += `
            <h2 style="padding:20px">
                Posts
            </h2>
        `;


        html += posts
            .map(renderPost)
            .join("");

    }


    if (!html) {

        html =
            `<div style="padding:30px;color:var(--muted)">
                No results found.
            </div>`;

    }


    results.innerHTML =
        html;

}


/* =====================================================
   NAVIGATION
===================================================== */

function navigate(page) {

    document
        .querySelectorAll(".page")
        .forEach(element => {

            element.classList.remove(
                "active"
            );

        });


    const pageElement =
        document.getElementById(
            page + "Page"
        );


    if (pageElement) {

        pageElement.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav")
        .forEach(button => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.page ===
                page
            ) {

                button.classList.add(
                    "active"
                );

            }

        });


    if (page === "home")
        loadFeed();


    if (page === "profile")
        loadProfile();


    if (page === "notifications")
        loadNotifications();

}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    await supabaseClient
        .auth
        .signOut();

    currentUser = null;

    currentProfile = null;

    location.reload();

}


/* =====================================================
   DARK MODE
===================================================== */

function toggleDarkMode() {

    document
        .body
        .classList
        .toggle("dark");


    localStorage.setItem(
        "connectx-dark-mode",
        document.body.classList.contains(
            "dark"
        )
            ? "1"
            : "0"
    );

}


function loadDarkMode() {

    if (
        localStorage.getItem(
            "connectx-dark-mode"
        ) === "1"
    ) {

        document
            .body
            .classList
            .add("dark");

    }

}


/* =====================================================
   SESSION
===================================================== */

async function checkSession() {

    loadDarkMode();


    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(error);

        return;
    }


    if (data.session) {

        currentUser =
            data.session.user;

        await loadApp();

    }

}


/* =====================================================
   AUTH STATE
===================================================== */

function setupAuthListener() {

    supabaseClient
        .auth
        .onAuthStateChange(
            async (
                event,
                session
            ) => {

                if (
                    event ===
                    "SIGNED_IN"
                ) {

                    currentUser =
                        session?.user ||
                        null;

                }


                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    currentUser =
                        null;

                    currentProfile =
                        null;

                }

            }
        );

}


/* =====================================================
   START AUTH LISTENER AFTER SUPABASE EXISTS
===================================================== */

const originalSetupEvents =
    setupEvents;


/*
    We need the auth listener after the
    Supabase client has been created.
*/

const originalDOMContentLoaded =
    document.addEventListener;


/* =====================================================
   OVERRIDE STARTUP SAFELY
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            () => {

                if (supabaseClient)
                    setupAuthListener();

            },
            100
        );

    }
);
