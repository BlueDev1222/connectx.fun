/* =========================================
   CONNECTX
   SUPABASE JAVASCRIPT
========================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================
   ELEMENTS
========================================= */

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const switchAuth = document.getElementById("switchAuth");
const authMessage = document.getElementById("authMessage");

const logoutButton = document.getElementById("logoutButton");


/* =========================================
   AUTH MESSAGE
========================================= */

function showAuthMessage(message, error = false) {
    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.style.color = error ? "#e53935" : "#22c55e";
}


/* =========================================
   SWITCH LOGIN / REGISTER
========================================= */

if (switchAuth) {
    switchAuth.addEventListener("click", () => {

        const registering =
            registerForm.style.display !== "none";

        if (registering) {

            registerForm.style.display = "none";
            loginForm.style.display = "block";

            switchAuth.textContent =
                "Create an account";

        } else {

            registerForm.style.display = "block";
            loginForm.style.display = "none";

            switchAuth.textContent =
                "Already have an account? Log in";

        }

        showAuthMessage("");

    });
}


/* =========================================
   REGISTER
========================================= */

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document
                .getElementById("registerName")
                .value
                .trim();

        const username =
            document
                .getElementById("registerUsername")
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


        /* Validate */

        if (!name || !username || !email || !password) {

            showAuthMessage(
                "Please fill in all fields.",
                true
            );

            return;
        }


        if (username.length < 3) {

            showAuthMessage(
                "Username must be at least 3 characters.",
                true
            );

            return;
        }


        if (!/^[a-zA-Z0-9_]+$/.test(username)) {

            showAuthMessage(
                "Username can only contain letters, numbers, and underscores.",
                true
            );

            return;
        }


        if (password.length < 6) {

            showAuthMessage(
                "Password must be at least 6 characters.",
                true
            );

            return;
        }


        showAuthMessage("Creating account...");


        try {

            /* =====================================
               CHECK USERNAME
            ===================================== */

            const {
                data: existingUsername,
                error: usernameError
            } = await supabaseClient
                .from("profiles")
                .select("id")
                .eq("username", username)
                .maybeSingle();


            if (usernameError) {
                throw usernameError;
            }


            if (existingUsername) {

                showAuthMessage(
                    "That username is already taken.",
                    true
                );

                return;
            }


            /* =====================================
               CREATE SUPABASE AUTH ACCOUNT

               IMPORTANT:
               The profile is created by the
               database trigger.

               DO NOT insert into profiles here.
            ===================================== */

            const {
                data,
                error
            } = await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        display_name: name,

                        username: username

                    }

                }

            });


            if (error) {
                throw error;
            }


            /* =====================================
               EMAIL VERIFICATION
            ===================================== */

            if (!data.user) {

                showAuthMessage(
                    "Account created. Check your email to verify your account."
                );

                registerForm.reset();

                return;
            }


            if (!data.session) {

                showAuthMessage(
                    "Account created! Check your email to verify your account."
                );

                registerForm.reset();

                return;
            }


            /* =====================================
               LOGGED IN IMMEDIATELY
            ===================================== */

            currentUser = data.user;

            await loadUser();

            registerForm.reset();


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            let message =
                error?.message ||
                "Registration failed.";


            if (
                message
                    .toLowerCase()
                    .includes("username")
            ) {

                message =
                    "That username is already taken.";

            }


            showAuthMessage(
                message,
                true
            );

        }

    });

}


/* =========================================
   LOGIN
========================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;


        if (!email || !password) {

            showAuthMessage(
                "Enter your email and password.",
                true
            );

            return;
        }


        showAuthMessage("Logging in...");


        try {

            const {
                data,
                error
            } = await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


            if (error) {
                throw error;
            }


            currentUser = data.user;


            await loadUser();


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            showAuthMessage(
                error?.message ||
                "Login failed.",
                true
            );

        }

    });

}


/* =========================================
   LOAD USER
========================================= */

async function loadUser() {

    try {

        const {
            data: {
                user
            }
        } = await supabaseClient.auth.getUser();


        if (!user) {

            showAuth();

            return;

        }


        currentUser = user;


        /* =====================================
           LOAD PROFILE
        ===================================== */

        let {
            data: profile,
            error
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();


        if (error) {

            console.error(
                "Profile loading error:",
                error
            );

            showAuthMessage(
                "Could not load your profile.",
                true
            );

            return;

        }


        /* =====================================
           PROFILE MAY TAKE A MOMENT TO APPEAR
           AFTER AUTH TRIGGER
        ===================================== */

        if (!profile) {

            for (let i = 0; i < 5; i++) {

                await sleep(500);


                const result =
                    await supabaseClient
                        .from("profiles")
                        .select("*")
                        .eq("id", user.id)
                        .maybeSingle();


                if (result.error) {

                    console.error(
                        result.error
                    );

                    break;

                }


                if (result.data) {

                    profile =
                        result.data;

                    break;

                }

            }

        }


        if (!profile) {

            console.error(
                "Profile does not exist for user:",
                user.id
            );

            showAuthMessage(
                "Your account was created, but your profile could not be found.",
                true
            );

            return;

        }


        currentProfile = profile;


        /* =====================================
           SHOW APP
        ===================================== */

        showApp();


        updateProfileUI();


        await loadFeed();

        await loadProfilePosts();

        await loadSuggestions();


    } catch (error) {

        console.error(
            "loadUser error:",
            error
        );

    }

}


/* =========================================
   SHOW AUTH
========================================= */

function showAuth() {

    if (authScreen) {
        authScreen.style.display = "flex";
    }

    if (app) {
        app.style.display = "none";
    }

}


/* =========================================
   SHOW APP
========================================= */

function showApp() {

    if (authScreen) {
        authScreen.style.display = "none";
    }

    if (app) {
        app.style.display = "grid";
    }

}


/* =========================================
   LOGOUT
========================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await supabaseClient.auth.signOut();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            currentUser = null;

            currentProfile = null;


            showAuth();

        }
    );

}


/* =========================================
   UPDATE PROFILE UI
========================================= */

function updateProfileUI() {

    if (!currentProfile) {
        return;
    }


    const name =
        currentProfile.display_name ||
        "User";


    const username =
        currentProfile.username ||
        "user";


    /* Sidebar */

    const sidebarName =
        document.getElementById(
            "sidebarName"
        );


    if (sidebarName) {
        sidebarName.textContent = name;
    }


    const sidebarUsername =
        document.getElementById(
            "sidebarUsername"
        );


    if (sidebarUsername) {

        sidebarUsername.textContent =
            "@" + username;

    }


    /* Profile */

    const profileName =
        document.getElementById(
            "profileName"
        );


    if (profileName) {
        profileName.textContent = name;
    }


    const profileUsername =
        document.getElementById(
            "profileUsername"
        );


    if (profileUsername) {

        profileUsername.textContent =
            "@" + username;

    }


    const profileBio =
        document.getElementById(
            "profileBio"
        );


    if (profileBio) {

        profileBio.textContent =
            currentProfile.bio ||
            "Welcome to ConnectX!";

    }


    /* Avatar */

    const letter =
        name
            .charAt(0)
            .toUpperCase();


    const sidebarAvatar =
        document.getElementById(
            "sidebarAvatar"
        );


    if (sidebarAvatar) {
        sidebarAvatar.textContent = letter;
    }


    const composerAvatar =
        document.getElementById(
            "composerAvatar"
        );


    if (composerAvatar) {
        composerAvatar.textContent = letter;
    }


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (profileAvatar) {
        profileAvatar.textContent = letter;
    }

}


/* =========================================
   CREATE POST
========================================= */

const postInput =
    document.getElementById(
        "postInput"
    );


const postButton =
    document.getElementById(
        "postButton"
    );


const characterCount =
    document.getElementById(
        "characterCount"
    );


if (postInput) {

    postInput.addEventListener(
        "input",
        () => {

            if (characterCount) {

                characterCount.textContent =
                    `${postInput.value.length}/280`;

            }

        }
    );

}


if (postButton) {

    postButton.addEventListener(
        "click",
        createPost
    );

}


async function createPost() {

    if (!currentUser) {

        alert(
            "You must be logged in to post."
        );

        return;

    }


    const content =
        postInput.value.trim();


    if (!content) {
        return;
    }


    if (content.length > 280) {

        alert(
            "Your post is too long."
        );

        return;

    }


    postButton.disabled = true;

    postButton.textContent =
        "Posting...";


    try {

        const {
            error
        } = await supabaseClient
            .from("posts")
            .insert({

                user_id:
                    currentUser.id,

                content:
                    content

            });


        if (error) {
            throw error;
        }


        postInput.value = "";


        if (characterCount) {

            characterCount.textContent =
                "0/280";

        }


        await loadFeed();

        await loadProfilePosts();


    } catch (error) {

        console.error(
            "Post error:",
            error
        );


        alert(
            error?.message ||
            "Could not create post."
        );

    }


    postButton.disabled = false;

    postButton.textContent =
        "Post";

}


/* =========================================
   LOAD FEED
========================================= */

async function loadFeed() {

    const feed =
        document.getElementById(
            "feed"
        );


    if (!feed) {
        return;
    }


    feed.innerHTML =
        `<div class="loading">
            Loading posts...
        </div>`;


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("posts")
            .select(`
                id,
                content,
                created_at,
                profiles (
                    display_name,
                    username
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {
            throw error;
        }


        if (!data || data.length === 0) {

            feed.innerHTML =
                `<div class="empty">
                    No posts yet. Be the first to post!
                </div>`;

            return;

        }


        feed.innerHTML = "";


        data.forEach(post => {

            const profile =
                post.profiles;


            const name =
                profile?.display_name ||
                "User";


            const username =
                profile?.username ||
                "user";


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "post";


            article.innerHTML = `

                <div class="post-avatar avatar">
                    ${escapeHTML(
                        name.charAt(0).toUpperCase()
                    )}
                </div>

                <div class="post-content">

                    <div class="post-header">

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            @${escapeHTML(username)}
                        </span>

                        <time>
                            ${formatDate(
                                post.created_at
                            )}
                        </time>

                    </div>

                    <p>
                        ${escapeHTML(
                            post.content
                        )}
                    </p>

                </div>

            `;


            feed.appendChild(article);

        });


    } catch (error) {

        console.error(
            "Feed error:",
            error
        );


        feed.innerHTML =
            `<div class="error">
                Failed to load posts.
            </div>`;

    }

}


/* =========================================
   LOAD PROFILE POSTS
========================================= */

async function loadProfilePosts() {

    if (!currentUser || !currentProfile) {
        return;
    }


    const container =
        document.getElementById(
            "profilePosts"
        );


    if (!container) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("posts")
            .select("*")
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


        if (error) {
            throw error;
        }


        container.innerHTML = "";


        const postCount =
            document.getElementById(
                "postCount"
            );


        if (postCount) {

            postCount.textContent =
                data?.length || 0;

        }


        if (!data || data.length === 0) {

            container.innerHTML =
                `<div class="empty">
                    You haven't posted anything yet.
                </div>`;

            return;

        }


        data.forEach(post => {

            const element =
                document.createElement(
                    "article"
                );


            element.className =
                "post";


            element.innerHTML = `

                <div class="post-avatar avatar">
                    ${escapeHTML(
                        currentProfile
                            .display_name
                            .charAt(0)
                            .toUpperCase()
                    )}
                </div>

                <div class="post-content">

                    <div class="post-header">

                        <strong>
                            ${escapeHTML(
                                currentProfile
                                    .display_name
                            )}
                        </strong>

                        <span>
                            @${escapeHTML(
                                currentProfile
                                    .username
                            )}
                        </span>

                        <time>
                            ${formatDate(
                                post.created_at
                            )}
                        </time>

                    </div>

                    <p>
                        ${escapeHTML(
                            post.content
                        )}
                    </p>

                </div>

            `;


            container.appendChild(element);

        });


    } catch (error) {

        console.error(
            "Profile posts error:",
            error
        );

    }

}


/* =========================================
   NAVIGATION
========================================= */

document
    .querySelectorAll("[data-page]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;


                document
                    .querySelectorAll(".page")
                    .forEach(section => {

                        section.classList.remove(
                            "active"
                        );

                    });


                const target =
                    document.getElementById(
                        page + "Page"
                    );


                if (target) {

                    target.classList.add(
                        "active"
                    );

                }


                document
                    .querySelectorAll(".nav")
                    .forEach(nav => {

                        nav.classList.remove(
                            "active"
                        );

                    });


                document
                    .querySelectorAll(
                        `.nav[data-page="${page}"]`
                    )
                    .forEach(nav => {

                        nav.classList.add(
                            "active"
                        );

                    });

            }

        );

    });


/* =========================================
   SIDEBAR POST BUTTON
========================================= */

const sidebarPostButton =
    document.getElementById(
        "sidebarPostButton"
    );


if (sidebarPostButton) {

    sidebarPostButton.addEventListener(
        "click",
        () => {

            if (postInput) {

                postInput.focus();

                postInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }
    );

}


/* =========================================
   MOBILE POST BUTTON
========================================= */

const mobilePost =
    document.getElementById(
        "mobilePost"
    );


if (mobilePost) {

    mobilePost.addEventListener(
        "click",
        () => {

            if (postInput) {

                postInput.focus();

                postInput.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        }
    );

}


/* =========================================
   DARK MODE
========================================= */

const darkModeButton =
    document.getElementById(
        "darkModeButton"
    );


if (darkModeButton) {

    darkModeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );


            localStorage.setItem(
                "connectx-dark",
                document.body.classList.contains(
                    "dark"
                )
            );

        }
    );

}


if (
    localStorage.getItem(
        "connectx-dark"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

}


/* =========================================
   SEARCH
========================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        async () => {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();


            const results =
                document.getElementById(
                    "searchResults"
                );


            if (!results) {
                return;
            }


            if (!query) {

                results.innerHTML = "";

                return;

            }


            try {

                const {
                    data,
                    error
                } = await supabaseClient
                    .from("profiles")
                    .select(
                        "display_name, username"
                    )
                    .or(
                        `username.ilike.%${query}%,display_name.ilike.%${query}%`
                    )
                    .limit(20);


                if (error) {
                    throw error;
                }


                results.innerHTML = "";


                if (!data || data.length === 0) {

                    results.innerHTML =
                        `<div class="empty">
                            No users found.
                        </div>`;

                    return;

                }


                data.forEach(profile => {

                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "search-result";


                    const name =
                        profile.display_name ||
                        "User";


                    div.innerHTML = `

                        <div class="avatar">
                            ${escapeHTML(
                                name
                                    .charAt(0)
                                    .toUpperCase()
                            )}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span>
                                @${escapeHTML(
                                    profile.username
                                )}
                            </span>

                        </div>

                    `;


                    results.appendChild(div);

                });


            } catch (error) {

                console.error(
                    "Search error:",
                    error
                );

            }

        }
    );

}


/* =========================================
   RIGHT SIDEBAR SEARCH
========================================= */

const rightSearch =
    document.getElementById(
        "rightSearch"
    );


if (rightSearch) {

    rightSearch.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                const query =
                    rightSearch.value.trim();


                if (!query) {
                    return;
                }


                /* Switch to Explore */

                document
                    .querySelectorAll(".page")
                    .forEach(page => {

                        page.classList.remove(
                            "active"
                        );

                    });


                const explore =
                    document.getElementById(
                        "explorePage"
                    );


                if (explore) {

                    explore.classList.add(
                        "active"
                    );

                }


                const exploreSearch =
                    document.getElementById(
                        "searchInput"
                    );


                if (exploreSearch) {

                    exploreSearch.value =
                        query;

                    exploreSearch.dispatchEvent(
                        new Event("input")
                    );

                }

            }

        }
    );

}


/* =========================================
   LOAD SUGGESTIONS
========================================= */

async function loadSuggestions() {

    const container =
        document.getElementById(
            "suggestions"
        );


    if (!container || !currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select(
                "id, display_name, username"
            )
            .neq(
                "id",
                currentUser.id
            )
            .limit(5);


        if (error) {
            throw error;
        }


        container.innerHTML = "";


        if (!data || data.length === 0) {

            container.innerHTML =
                `<p class="muted">
                    No suggestions yet.
                </p>`;

            return;

        }


        data.forEach(profile => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "suggestion";


            const name =
                profile.display_name ||
                "User";


            div.innerHTML = `

                <div class="avatar">
                    ${escapeHTML(
                        name
                            .charAt(0)
                            .toUpperCase()
                    )}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <small>
                        @${escapeHTML(
                            profile.username
                        )}
                    </small>

                </div>

            `;


            container.appendChild(div);

        });


    } catch (error) {

        console.error(
            "Suggestions error:",
            error
        );

    }

}


/* =========================================
   AUTH STATE
========================================= */

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        console.log(
            "Auth event:",
            event
        );


        if (session) {

            currentUser =
                session.user;

            await loadUser();

        } else {

            currentUser = null;

            currentProfile = null;

            showAuth();

        }

    }
);


/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


function formatDate(date) {

    const d =
        new Date(date);


    if (Number.isNaN(d.getTime())) {
        return "";
    }


    return d.toLocaleString(
        [],
        {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function sleep(ms) {

    return new Promise(
        resolve => setTimeout(
            resolve,
            ms
        )
    );

}


/* =========================================
   START CONNECTX
========================================= */

async function startApp() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            showAuth();

            return;

        }


        if (data.session) {

            currentUser =
                data.session.user;

            await loadUser();

        } else {

            showAuth();

        }

    } catch (error) {

        console.error(
            "Startup error:",
            error
        );

        showAuth();

    }

}


startApp();
