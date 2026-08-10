/* =========================================
   CONNECTX
   SUPABASE APP
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

const logoutButton =
    document.getElementById("logoutButton");


/* =========================================
   AUTH MESSAGE
========================================= */

function showAuthMessage(message, error = false) {

    authMessage.textContent = message;

    authMessage.style.color =
        error ? "#e53935" : "#22c55e";

}


/* =========================================
   SWITCH LOGIN / REGISTER
========================================= */

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

    authMessage.textContent = "";

});


/* =========================================
   REGISTER
========================================= */

registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const username =
        document
            .getElementById("registerUsername")
            .value
            .trim()
            .toLowerCase();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;


    if (!name || !username || !email || !password) {

        showAuthMessage(
            "Please fill in all fields.",
            true
        );

        return;
    }


    showAuthMessage("Creating account...");


    try {

        /* Check username */

        const { data: existingUsername, error: usernameError } =
            await supabaseClient
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


        /* Create account */

        const {
            data,
            error
        } = await supabaseClient.auth.signUp({

            email: email,

            password: password

        });


        if (error) {
            throw error;
        }


        if (!data.user) {

            showAuthMessage(
                "Account created. Please check your email.",
                false
            );

            return;
        }


        /* Create profile */

        const { error: profileError } =
            await supabaseClient
                .from("profiles")
                .insert({

                    id: data.user.id,

                    display_name: name,

                    username: username

                });


        if (profileError) {
            throw profileError;
        }


        showAuthMessage(
            "Account created successfully!"
        );


        registerForm.reset();


        if (data.session) {

            await loadUser();

        } else {

            showAuthMessage(
                "Account created! Check your email to verify your account."
            );

        }

    } catch (error) {

        console.error(error);

        showAuthMessage(
            error.message || "Registration failed.",
            true
        );

    }

});


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


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

        console.error(error);

        showAuthMessage(
            error.message || "Login failed.",
            true
        );

    }

});


/* =========================================
   LOAD USER
========================================= */

async function loadUser() {

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


    const {
        data: profile,
        error
    } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (error) {

        console.error(error);

        showAuth();

        return;

    }


    currentProfile = profile;


    showApp();

    updateProfileUI();

    loadFeed();

    loadProfilePosts();

}


/* =========================================
   SHOW AUTH
========================================= */

function showAuth() {

    authScreen.style.display = "flex";

    app.style.display = "none";

}


/* =========================================
   SHOW APP
========================================= */

function showApp() {

    authScreen.style.display = "none";

    app.style.display = "grid";

}


/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener("click", async () => {

    await supabaseClient.auth.signOut();

    currentUser = null;

    currentProfile = null;

    showAuth();

});


/* =========================================
   PROFILE UI
========================================= */

function updateProfileUI() {

    if (!currentProfile) {
        return;
    }


    const name =
        currentProfile.display_name || "User";

    const username =
        currentProfile.username || "user";


    document.getElementById(
        "sidebarName"
    ).textContent = name;


    document.getElementById(
        "sidebarUsername"
    ).textContent =
        "@" + username;


    document.getElementById(
        "profileName"
    ).textContent = name;


    document.getElementById(
        "profileUsername"
    ).textContent =
        "@" + username;


    document.getElementById(
        "profileBio"
    ).textContent =
        currentProfile.bio ||
        "Welcome to ConnectX!";


    const avatarLetter =
        name.charAt(0).toUpperCase();


    document.getElementById(
        "sidebarAvatar"
    ).textContent =
        avatarLetter;


    document.getElementById(
        "composerAvatar"
    ).textContent =
        avatarLetter;


    document.getElementById(
        "profileAvatar"
    ).textContent =
        avatarLetter;

}


/* =========================================
   CREATE POST
========================================= */

const postInput =
    document.getElementById("postInput");

const postButton =
    document.getElementById("postButton");

const characterCount =
    document.getElementById("characterCount");


postInput.addEventListener("input", () => {

    characterCount.textContent =
        `${postInput.value.length}/280`;

});


postButton.addEventListener("click", createPost);


async function createPost() {

    const content =
        postInput.value.trim();


    if (!content) {
        return;
    }


    if (!currentUser) {
        return;
    }


    postButton.disabled = true;

    postButton.textContent = "Posting...";


    try {

        const {
            error
        } = await supabaseClient
            .from("posts")
            .insert({

                user_id: currentUser.id,

                content: content

            });


        if (error) {
            throw error;
        }


        postInput.value = "";

        characterCount.textContent = "0/280";


        await loadFeed();

        await loadProfilePosts();


    } catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Could not create post."
        );

    }


    postButton.disabled = false;

    postButton.textContent = "Post";

}


/* =========================================
   LOAD FEED
========================================= */

async function loadFeed() {

    const feed =
        document.getElementById("feed");


    feed.innerHTML =
        `<div class="loading">Loading posts...</div>`;


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

        console.error(error);

        feed.innerHTML =
            `<div class="error">
                Failed to load posts.
            </div>`;

        return;
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
            document.createElement("article");


        article.className = "post";


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
                        ${formatDate(post.created_at)}
                    </time>

                </div>

                <p>
                    ${escapeHTML(post.content)}
                </p>

            </div>

        `;


        feed.appendChild(article);

    });

}


/* =========================================
   PROFILE POSTS
========================================= */

async function loadProfilePosts() {

    if (!currentUser) {
        return;
    }


    const container =
        document.getElementById("profilePosts");


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

        console.error(error);

        return;

    }


    container.innerHTML = "";


    document.getElementById(
        "postCount"
    ).textContent =
        data.length;


    data.forEach(post => {

        const element =
            document.createElement("article");


        element.className = "post";


        element.innerHTML = `

            <div class="post-avatar avatar">
                ${escapeHTML(
                    currentProfile.display_name
                        .charAt(0)
                        .toUpperCase()
                )}
            </div>

            <div class="post-content">

                <div class="post-header">

                    <strong>
                        ${escapeHTML(
                            currentProfile.display_name
                        )}
                    </strong>

                    <span>
                        @${escapeHTML(
                            currentProfile.username
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
   POST BUTTONS
========================================= */

document
    .getElementById("sidebarPostButton")
    .addEventListener("click", () => {

        document
            .getElementById("postInput")
            .focus();

    });


document
    .getElementById("mobilePost")
    .addEventListener("click", () => {

        document
            .getElementById("postInput")
            .focus();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });


/* =========================================
   DARK MODE
========================================= */

document
    .getElementById("darkModeButton")
    .addEventListener("click", () => {

        document.body.classList.toggle(
            "dark"
        );


        localStorage.setItem(
            "connectx-dark",
            document.body.classList.contains(
                "dark"
            )
        );

    });


if (
    localStorage.getItem("connectx-dark") === "true"
) {

    document.body.classList.add("dark");

}


/* =========================================
   DATE
========================================= */

function formatDate(date) {

    const d =
        new Date(date);


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


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================
   SEARCH
========================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );


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


        if (!query) {

            results.innerHTML = "";

            return;

        }


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

            console.error(error);

            return;

        }


        results.innerHTML = "";


        data.forEach(profile => {

            const div =
                document.createElement("div");


            div.className =
                "search-result";


            div.innerHTML = `

                <div class="avatar">
                    ${escapeHTML(
                        profile.display_name
                            .charAt(0)
                            .toUpperCase()
                    )}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(
                            profile.display_name
                        )}
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

    }
);


/* =========================================
   AUTH STATE
========================================= */

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

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
   START APP
========================================= */

async function startApp() {

    const {
        data
    } = await supabaseClient.auth.getSession();


    if (data.session) {

        await loadUser();

    } else {

        showAuth();

    }

}


startApp();
