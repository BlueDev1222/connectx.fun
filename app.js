```javascript
/* ==================================================
   CONNECTX
   CLEAN SUPABASE STARTER
================================================== */


/* ==================================================
   SUPABASE
================================================== */

const SUPABASE_URL =
    "https://onvmeffhmruzshqlwakx.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9VzEW8DurRpM51GgQ282BQ_qQ3e1WkX";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* ==================================================
   STATE
================================================== */

let currentUser = null;
let currentProfile = null;


/* ==================================================
   HELPERS
================================================== */

function initials(name) {

    if (!name) {
        return "U";
    }

    return name
        .trim()
        .split(/\s+/)
        .map(word => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function timeAgo(date) {

    const seconds = Math.floor(
        (Date.now() - new Date(date).getTime()) / 1000
    );


    if (seconds < 60) {
        return `${Math.max(seconds, 0)}s`;
    }


    const minutes = Math.floor(seconds / 60);


    if (minutes < 60) {
        return `${minutes}m`;
    }


    const hours = Math.floor(minutes / 60);


    if (hours < 24) {
        return `${hours}h`;
    }


    const days = Math.floor(hours / 24);


    if (days < 30) {
        return `${days}d`;
    }


    return new Date(date).toLocaleDateString();
}


function isConnectXAccount(profile) {

    return (
        profile &&
        profile.username &&
        profile.username.toLowerCase() === "connectx"
    );

}


function verifiedBadge(profile) {

    if (!isConnectXAccount(profile)) {
        return "";
    }


    return `
        <img
            class="verified-badge"
            src="Verified%20ConnectX.jpg"
            alt="Verified"
            title="Verified ConnectX account"
        >
    `;
}


/* ==================================================
   AUTH MESSAGE
================================================== */

function showAuthMessage(message, success = false) {

    const element =
        document.getElementById("authMessage");


    if (!element) {
        return;
    }


    element.textContent = message;

    element.style.color =
        success
            ? "#16803c"
            : "#d00000";
}


/* ==================================================
   LOGIN
================================================== */

document
    .getElementById("loginForm")
    .addEventListener(
        "submit",
        async event => {

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


            showAuthMessage("");


            const {
                data,
                error
            } =
                await supabaseClient.auth.signInWithPassword({

                    email,

                    password

                });


            if (error) {

                showAuthMessage(
                    error.message
                );

                return;
            }


            currentUser =
                data.user;


            await loadApp();

        }
    );


/* ==================================================
   REGISTER
================================================== */

document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async event => {

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


            showAuthMessage("");


            if (!/^[a-z0-9_]+$/.test(username)) {

                showAuthMessage(
                    "Username can only contain letters, numbers, and underscores."
                );

                return;
            }


            if (username.length < 1) {

                showAuthMessage(
                    "Please enter a username."
                );

                return;
            }


            /*
                Check whether username already exists.
            */

            const {
                data: existing,
                error: usernameError
            } =
                await supabaseClient
                    .from("profiles")
                    .select("id")
                    .eq("username", username)
                    .maybeSingle();


            if (usernameError) {

                console.error(usernameError);

                showAuthMessage(
                    "Could not check username. Please try again."
                );

                return;
            }


            if (existing) {

                showAuthMessage(
                    "That username is already taken."
                );

                return;
            }


            /*
                Create Auth account.
            */

            const {
                data,
                error
            } =
                await supabaseClient.auth.signUp({

                    email,

                    password,

                    options: {

                        data: {

                            username,

                            display_name: name

                        }

                    }

                });


            if (error) {

                showAuthMessage(
                    error.message
                );

                return;
            }


            /*
                Supabase creates the profile automatically
                through the database trigger.
            */

            if (data.session) {

                currentUser =
                    data.user;


                showAuthMessage(
                    "Account created!",
                    true
                );


                await loadApp();

                return;
            }


            showAuthMessage(
                "Account created! Check your email to verify your account.",
                true
            );

        }
    );


/* ==================================================
   LOGIN / REGISTER SWITCH
================================================== */

document
    .getElementById("switchAuth")
    .addEventListener(
        "click",
        () => {

            const login =
                document.getElementById(
                    "loginForm"
                );


            const register =
                document.getElementById(
                    "registerForm"
                );


            const switchButton =
                document.getElementById(
                    "switchAuth"
                );


            if (register.classList.contains("hidden")) {

                login.classList.add("hidden");

                register.classList.remove("hidden");

                switchButton.textContent =
                    "Already have an account? Log in";

            } else {

                register.classList.add("hidden");

                login.classList.remove("hidden");

                switchButton.textContent =
                    "Create an account";

            }


            showAuthMessage("");

        }
    );


/* ==================================================
   LOAD APP
================================================== */

async function loadApp() {

    if (!currentUser) {
        return;
    }


    const {
        data: profile,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();


    if (error) {

        console.error(
            "Profile error:",
            error
        );


        showAuthMessage(
            "Your account was created, but your profile could not be loaded."
        );

        return;
    }


    /*
        If a profile doesn't exist, create it.
        This also makes the frontend more forgiving
        if an old Auth account exists.
    */

    if (!profile) {

        const metadata =
            currentUser.user_metadata || {};


        const username =
            String(
                metadata.username ||
                `user_${currentUser.id.slice(0, 8)}`
            )
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 20);


        const displayName =
            String(
                metadata.display_name ||
                "ConnectX User"
            )
                .slice(0, 30);


        const {
            data: newProfile,
            error: createError
        } =
            await supabaseClient
                .from("profiles")
                .insert({

                    id: currentUser.id,

                    username,

                    display_name: displayName

                })
                .select()
                .single();


        if (createError) {

            console.error(
                "Create profile error:",
                createError
            );

            return;
        }


        currentProfile =
            newProfile;

    } else {

        currentProfile =
            profile;

    }


    document
        .getElementById("authScreen")
        .classList
        .add("hidden");


    document
        .getElementById("app")
        .classList
        .remove("hidden");


    updateUserUI();


    await Promise.all([

        loadFeed(),

        loadSuggestions(),

        loadProfile(),

        loadNotifications()

    ]);

}


/* ==================================================
   UPDATE USER UI
================================================== */

function updateUserUI() {

    if (!currentProfile) {
        return;
    }


    const name =
        currentProfile.display_name ||
        "User";


    document
        .getElementById("sidebarName")
        .textContent =
        name;


    document
        .getElementById("sidebarUsername")
        .textContent =
        "@" +
        currentProfile.username;


    document
        .getElementById("sidebarAvatar")
        .textContent =
        initials(name);


    document
        .getElementById("composerAvatar")
        .textContent =
        initials(name);


    document
        .getElementById("profileAvatar")
        .textContent =
        initials(name);

}


/* ==================================================
   LOAD FEED
================================================== */

async function loadFeed() {

    const feed =
        document.getElementById("feed");


    if (!feed || !currentUser) {
        return;
    }


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
                created_at,
                profiles (
                    id,
                    username,
                    display_name,
                    avatar_url
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
            "Feed error:",
            error
        );


        feed.innerHTML = `
            <div class="error">
                Failed to load posts.
                <br>
                <small>${escapeHTML(error.message)}</small>
            </div>
        `;

        return;
    }


    if (!posts || posts.length === 0) {

        feed.innerHTML = `
            <div class="empty">
                No posts yet.<br>
                Be the first to post!
            </div>
        `;

        return;
    }


    feed.innerHTML =
        posts
            .map(renderPost)
            .join("");

}


/* ==================================================
   RENDER POST
================================================== */

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


    const displayName =
        profile.display_name ||
        "ConnectX User";


    const username =
        profile.username ||
        "user";


    return `

        <article
            class="post"
            id="post-${escapeHTML(post.id)}"
        >

            <div class="avatar">

                ${escapeHTML(
                    initials(displayName)
                )}

            </div>


            <div class="post-body">

                <div class="post-header">

                    <strong class="post-name">

                        ${escapeHTML(
                            displayName
                        )}

                    </strong>

                    ${verifiedBadge(profile)}

                    <span class="post-user">

                        @${escapeHTML(
                            username
                        )}

                    </span>

                    <span class="post-user">

                        ·

                        ${timeAgo(
                            post.created_at
                        )}

                    </span>

                </div>


                <div class="post-content">

                    ${escapeHTML(
                        post.content
                    )}

                </div>


                <div class="actions">

                    <button
                        class="action"
                        onclick="commentPost('${post.id}')"
                        title="Reply"
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
                        title="Like"
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
                        title="Share"
                    >
                        ↗
                    </button>


                    ${
                        own
                            ?

                            `<button
                                class="action"
                                onclick="deletePost('${post.id}')"
                                title="Delete"
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


/* ==================================================
   POST CHARACTER COUNT
================================================== */

document
    .getElementById("postInput")
    .addEventListener(
        "input",
        () => {

            const text =
                document
                    .getElementById("postInput")
                    .value;


            document
                .getElementById("characterCount")
                .textContent =
                `${text.length}/280`;

        }
    );


/* ==================================================
   CREATE POST
================================================== */

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
        () => {

            navigate("home");


            document
                .getElementById("postInput")
                .focus();

        }
    );


document
    .getElementById("mobilePost")
    .addEventListener(
        "click",
        () => {

            navigate("home");


            document
                .getElementById("postInput")
                .focus();

        }
    );


async function createPost() {

    if (!currentUser) {
        return;
    }


    const input =
        document.getElementById("postInput");


    const content =
        input.value.trim();


    if (!content) {
        return;
    }


    const button =
        document.getElementById("postButton");


    button.disabled = true;


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


    button.disabled = false;


    if (error) {

        alert(error.message);

        return;
    }


    input.value = "";


    document
        .getElementById("characterCount")
        .textContent =
        "0/280";


    await loadFeed();

    await loadProfile();

}


/* ==================================================
   LIKES
================================================== */

async function toggleLike(postId) {

    if (!currentUser) {
        return;
    }


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

        console.error(checkError);

        return;
    }


    if (existing) {

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

    } else {

        await supabaseClient
            .from("likes")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id

            });

    }


    await loadFeed();

}


/* ==================================================
   DELETE POST
================================================== */

async function deletePost(postId) {

    if (
        !confirm(
            "Delete this post?"
        )
    ) {
        return;
    }


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

        alert(error.message);

        return;
    }


    await loadFeed();

    await loadProfile();

}


/* ==================================================
   COMMENTS
================================================== */

async function commentPost(postId) {

    const content =
        prompt(
            "Write your reply:"
        );


    if (
        !content ||
        !content.trim()
    ) {
        return;
    }


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

        alert(error.message);

        return;
    }


    alert("Reply posted!");

}


/* ==================================================
   SHARE
================================================== */

async function sharePost(postId) {

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


/* ==================================================
   SUGGESTIONS
================================================== */

async function loadSuggestions() {

    const container =
        document.getElementById(
            "suggestions"
        );


    if (!container || !currentUser) {
        return;
    }


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

        console.error(
            "Suggestions error:",
            error
        );

        return;
    }


    const {
        data: following
    } =
        await supabaseClient
            .from("follows")
            .select("following_id")
            .eq(
                "follower_id",
                currentUser.id
            );


    const followingIds =
        new Set(
            (following || [])
                .map(
                    item =>
                        item.following_id
                )
        );


    if (!profiles || profiles.length === 0) {

        container.innerHTML = `
            <p class="muted">
                No suggestions right now.
            </p>
        `;

        return;
    }


    container.innerHTML =
        profiles
            .map(profile => {

                const following =
                    followingIds.has(
                        profile.id
                    );


                return `

                    <div class="suggestion">

                        <div class="avatar">

                            ${escapeHTML(
                                initials(
                                    profile.display_name
                                )
                            )}

                        </div>


                        <div class="suggestion-info">

                            <strong
                                class="suggestion-name"
                            >

                                ${escapeHTML(
                                    profile.display_name
                                )}

                                ${verifiedBadge(
                                    profile
                                )}

                            </strong>


                            <span
                                class="suggestion-username"
                            >

                                @${escapeHTML(
                                    profile.username
                                )}

                            </span>

                        </div>


                        <button
                            class="follow-button"
                            onclick="toggleFollow('${profile.id}')"
                        >

                            ${
                                following
                                    ? "Following"
                                    : "Follow"
                            }

                        </button>

                    </div>

                `;

            })
            .join("");

}


/* ==================================================
   FOLLOW
================================================== */

async function toggleFollow(userId) {

    if (!currentUser) {
        return;
    }


    const {
        data: existing,
        error
    } =
        await supabaseClient
            .from("follows")
            .select("follower_id")
            .eq(
                "follower_id",
                currentUser.id
            )
            .eq(
                "following_id",
                userId
            )
            .maybeSingle();


    if (error) {

        console.error(error);

        return;
    }


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


/* ==================================================
   PROFILE
================================================== */

async function loadProfile() {

    if (!currentProfile || !currentUser) {
        return;
    }


    document
        .getElementById("profileName")
        .textContent =
        currentProfile.display_name;


    document
        .getElementById("profileUsername")
        .textContent =
        "@" +
        currentProfile.username;


    document
        .getElementById("profileBio")
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
                    count: "exact",
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
                    count: "exact",
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
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "follower_id",
                currentUser.id
            );


    document
        .getElementById("postCount")
        .textContent =
        posts || 0;


    document
        .getElementById("followersCount")
        .textContent =
        followers || 0;


    document
        .getElementById("followingCount")
        .textContent =
        following || 0;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("posts")
            .select(`
                id,
                user_id,
                content,
                created_at,
                profiles (
                    id,
                    username,
                    display_name
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


    if (error) {

        console.error(
            "Profile posts error:",
            error
        );

        return;
    }


    document
        .getElementById("profilePosts")
        .innerHTML =
        (data || [])
            .map(renderPost)
            .join("");

}


/* ==================================================
   NOTIFICATIONS
================================================== */

async function loadNotifications() {

    const container =
        document.getElementById(
            "notifications"
        );


    if (!container || !currentUser) {
        return;
    }


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

        console.error(
            "Notification error:",
            error
        );

        container.innerHTML = `
            <div class="empty">
                No notifications yet.
            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No notifications yet.
            </div>
        `;

        return;
    }


    container.innerHTML =
        data
            .map(notification => {

                const actor =
                    notification.profiles;


                return `

                    <div class="post">

                        <div class="avatar">

                            ${escapeHTML(
                                initials(
                                    actor?.display_name ||
                                    "ConnectX"
                                )
                            )}

                        </div>


                        <div>

                            <strong>

                                ${
                                    escapeHTML(
                                        actor?.display_name ||
                                        "Someone"
                                    )
                                }

                            </strong>


                            <div>
                                ${escapeHTML(
                                    notification.type
                                )}
                            </div>


                            <small class="muted">

                                ${timeAgo(
                                    notification.created_at
                                )}

                            </small>

                        </div>

                    </div>

                `;

            })
            .join("");

}


/* ==================================================
   SEARCH
================================================== */

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
        () => {

            navigate("explore");

            document
                .getElementById("searchInput")
                .focus();

        }
    );


document
    .getElementById("rightSearch")
    .addEventListener(
        "input",
        event => {

            document
                .getElementById("searchInput")
                .value =
                event.target.value;


            search();

        }
    );


async function search() {

    const query =
        document
            .getElementById("searchInput")
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


    const safeQuery =
        query.replaceAll(
            "%",
            ""
        );


    const {
        data: users
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .or(
                `username.ilike.%${safeQuery}%,display_name.ilike.%${safeQuery}%`
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
                    id,
                    username,
                    display_name
                ),
                likes (
                    user_id
                )
            `)
            .ilike(
                "content",
                `%${safeQuery}%`
            )
            .limit(20);


    let html = "";


    if (users && users.length) {

        html += `
            <h2 class="search-title">
                People
            </h2>
        `;


        html += users
            .map(user => `

                <div class="post">

                    <div class="avatar">

                        ${escapeHTML(
                            initials(
                                user.display_name
                            )
                        )}

                    </div>


                    <div>

                        <strong>

                            ${escapeHTML(
                                user.display_name
                            )}

                            ${verifiedBadge(
                                user
                            )}

                        </strong>


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

            `)
            .join("");

    }


    if (posts && posts.length) {

        html += `
            <h2 class="search-title">
                Posts
            </h2>
        `;


        html += posts
            .map(renderPost)
            .join("");

    }


    if (!html) {

        html = `
            <div class="empty">
                No results found.
            </div>
        `;

    }


    results.innerHTML =
        html;

}


/* ==================================================
   NAVIGATION
================================================== */

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
            `${page}Page`
        );


    if (pageElement) {

        pageElement.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(
            ".nav-button"
        )
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


    if (page === "home") {
        loadFeed();
    }


    if (page === "profile") {
        loadProfile();
    }


    if (page === "notifications") {
        loadNotifications();
    }

}


/* ==================================================
   LOGOUT
================================================== */

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            currentUser = null;

            currentProfile = null;


            location.reload();

        }
    );


/* ==================================================
   DARK MODE
================================================== */

document
    .getElementById("darkModeButton")
    .addEventListener(
        "click",
        () => {

            document
                .body
                .classList
                .toggle("dark");


            localStorage.setItem(
                "connectx-dark-mode",
                document.body.classList.contains(
                    "dark"
                )
                    ? "true"
                    : "false"
            );

        }
    );


/* ==================================================
   LOAD DARK MODE
================================================== */

if (
    localStorage.getItem(
        "connectx-dark-mode"
    ) === "true"
) {

    document
        .body
        .classList
        .add("dark");

}


/* ==================================================
   AUTH SESSION
================================================== */

async function checkSession() {

    const {
        data,
        error
    } =
        await supabaseClient
            .auth
            .getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        return;
    }


    if (data.session) {

        currentUser =
            data.session.user;


        await loadApp();

    }

}


/* ==================================================
   AUTH STATE
================================================== */

supabaseClient
    .auth
    .onAuthStateChange(
        async (
            event,
            session
        ) => {

            if (
                event ===
                "SIGNED_IN" &&
                session
            ) {

                currentUser =
                    session.user;

            }


            if (
                event ===
                "SIGNED_OUT"
            ) {

                currentUser = null;

                currentProfile = null;

            }

        }
    );


/* ==================================================
   START
================================================== */

checkSession();
```
