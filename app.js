/* =========================================================
   CONNECTX + SUPABASE
========================================================= */

/*
    Your Supabase project information.
*/

const SUPABASE_URL =
    "https://onvmeffhmruzshqlwakx.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9VzEW8DurRpM51GgQ282BQ_qQ3e1WkX";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;


/* =========================================================
   HELPERS
========================================================= */

function initials(name) {

    if (!name) {
        return "U";
    }

    return String(name)
        .split(" ")
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
            (Date.now() - new Date(date)) / 1000
        );


    if (seconds < 60) {
        return `${Math.max(seconds, 0)}s`;
    }


    const minutes =
        Math.floor(seconds / 60);


    if (minutes < 60) {
        return `${minutes}m`;
    }


    const hours =
        Math.floor(minutes / 60);


    if (hours < 24) {
        return `${hours}h`;
    }


    const days =
        Math.floor(hours / 24);


    return `${days}d`;

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function authMessage(
    message,
    error = true
) {

    const element =
        document.getElementById(
            "authMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.style.color =
        error
            ? "#d00000"
            : "#16803c";

}


/* =========================================================
   LOGIN
========================================================= */

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


            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signInWithPassword({

                        email,

                        password

                    });


            if (error) {

                console.error(
                    "Login error:",
                    error
                );

                authMessage(
                    error.message
                );

                return;

            }


            currentUser =
                data.user;


            await loadApp();

        }
    );


/* =========================================================
   REGISTER
========================================================= */

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


            if (
                !/^[a-z0-9_]+$/.test(
                    username
                )
            ) {

                authMessage(
                    "Username can only contain letters, numbers and underscores."
                );

                return;

            }


            /*
                Check if username already exists.
            */

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


            if (usernameError) {

                console.error(
                    "Username check error:",
                    usernameError
                );

                authMessage(
                    usernameError.message
                );

                return;

            }


            if (existing) {

                authMessage(
                    "That username is already taken."
                );

                return;

            }


            /*
                Create Supabase account.
            */

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .signUp({

                        email,

                        password,

                        options: {

                            data: {

                                username,

                                display_name:
                                    name

                            }

                        }

                    });


            if (error) {

                console.error(
                    "Registration error:",
                    error
                );

                authMessage(
                    error.message
                );

                return;

            }


            if (data.user) {

                authMessage(
                    "Account created!",
                    false
                );

            }


            /*
                Email confirmation enabled.
            */

            if (!data.session) {

                authMessage(
                    "Account created. Check your email to confirm your account.",
                    false
                );

                return;

            }


            currentUser =
                data.user;


            await loadApp();

        }
    );


/* =========================================================
   SWITCH LOGIN / REGISTER
========================================================= */

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


            if (
                login.style.display ===
                "none"
            ) {

                login.style.display =
                    "flex";


                register.style.display =
                    "none";


                switchButton.textContent =
                    "Create an account";

            } else {

                login.style.display =
                    "none";


                register.style.display =
                    "flex";


                switchButton.textContent =
                    "Already have an account? Log in";

            }

        }
    );


/* =========================================================
   LOAD APP
========================================================= */

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
            .eq(
                "id",
                currentUser.id
            )
            .single();


    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        return;

    }


    currentProfile =
        profile;


    const authScreen =
        document.getElementById(
            "authScreen"
        );


    const app =
        document.getElementById(
            "app"
        );


    if (authScreen) {

        authScreen.style.display =
            "none";

    }


    if (app) {

        app.style.display =
            "block";

    }


    updateUserUI();


    await loadFeed();

    await loadSuggestions();

    await loadProfile();

    await loadNotifications();

}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

    if (!currentProfile) {
        return;
    }


    const name =
        currentProfile.display_name ||
        currentProfile.username ||
        "User";


    const username =
        currentProfile.username ||
        "user";


    const sidebarName =
        document.getElementById(
            "sidebarName"
        );


    const sidebarUsername =
        document.getElementById(
            "sidebarUsername"
        );


    const sidebarAvatar =
        document.getElementById(
            "sidebarAvatar"
        );


    const composerAvatar =
        document.getElementById(
            "composerAvatar"
        );


    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    if (sidebarName) {

        sidebarName.textContent =
            name;

    }


    if (sidebarUsername) {

        sidebarUsername.textContent =
            "@" + username;

    }


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials(name);

    }


    if (composerAvatar) {

        composerAvatar.textContent =
            initials(name);

    }


    if (profileAvatar) {

        profileAvatar.textContent =
            initials(name);

    }

}


/* =========================================================
   FEED
========================================================= */

async function loadFeed() {

    const feed =
        document.getElementById(
            "feed"
        );


    if (!feed) {

        console.error(
            "ConnectX: #feed was not found."
        );

        return;

    }


    feed.innerHTML = `
        <div style="
            padding:30px;
            text-align:center;
            color:var(--muted);
        ">
            Loading posts...
        </div>
    `;


    /*
        IMPORTANT:

        Explicitly use the relationship:

        posts.user_id
            ↓
        profiles.id

        This prevents Supabase from choosing
        the wrong relationship.
    */

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
                profiles!posts_user_id_fkey (
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


    /*
        Show the actual Supabase error.
    */

    if (error) {

        console.error(
            "CONNECTX POSTS ERROR:",
            error
        );


        feed.innerHTML = `
            <div class="error">

                <strong>
                    Failed to load posts.
                </strong>

                <p style="
                    margin-top:10px;
                    font-size:13px;
                    word-break:break-word;
                ">
                    ${escapeHTML(
                        error.message ||
                        "Unknown Supabase error."
                    )}
                </p>

            </div>
        `;

        return;

    }


    /*
        No posts.
    */

    if (
        !posts ||
        posts.length === 0
    ) {

        feed.innerHTML = `
            <div class="empty">

                <strong>
                    No posts yet.
                </strong>

                <p style="
                    margin-top:8px;
                ">
                    Be the first person to post!
                </p>

            </div>
        `;

        return;

    }


    /*
        Render posts.
    */

    feed.innerHTML =
        posts
            .map(post => {

                if (!post.profiles) {

                    console.warn(
                        "Post has no profile:",
                        post
                    );

                    return "";

                }


                return renderPost(
                    post
                );

            })
            .join("");

}


/* =========================================================
   RENDER POST
========================================================= */

function renderPost(post) {

    const profile =
        post.profiles || {

            id:
                post.user_id,

            username:
                "unknown",

            display_name:
                "Unknown User",

            avatar_url:
                null

        };


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


    /*
        Official ConnectX account.

        Change this username only if your
        official account uses another username.
    */

    const verified =
        profile.username ===
        "connectx";


    const verifiedBadge =
        verified
            ?
            `
            <img
                src="Verified ConnectX.jpg"
                class="verified-badge"
                alt="Verified"
                title="Verified ConnectX account"
            >
            `
            :
            "";


    return `

        <article class="post">

            <div class="avatar">

                ${escapeHTML(
                    initials(
                        profile.display_name
                    )
                )}

            </div>


            <div class="post-body">

                <div class="post-header">

                    <strong class="post-name">

                        ${escapeHTML(
                            profile.display_name
                        )}

                    </strong>


                    ${verifiedBadge}


                    <span class="post-user">

                        @${escapeHTML(
                            profile.username
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


                <div class="actions">

                    <button
                        class="action"
                        onclick="
                            commentPost('${post.id}')
                        "
                    >
                        💬
                    </button>


                    <button
                        class="action ${
                            liked
                                ? "liked"
                                : ""
                        }"
                        onclick="
                            toggleLike('${post.id}')
                        "
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
                        onclick="
                            sharePost('${post.id}')
                        "
                    >
                        ↗
                    </button>


                    ${
                        own
                            ?
                            `
                            <button
                                class="action"
                                onclick="
                                    deletePost('${post.id}')
                                "
                            >
                                🗑
                            </button>
                            `
                            :
                            ""
                    }

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   CREATE POST
========================================================= */

document
    .getElementById("postInput")
    .addEventListener(
        "input",
        () => {

            const text =
                document
                    .getElementById(
                        "postInput"
                    )
                    .value;


            document
                .getElementById(
                    "characterCount"
                )
                .textContent =
                `${text.length}/280`;

        }
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
        () => {

            document
                .getElementById(
                    "postInput"
                )
                .focus();

        }
    );


document
    .getElementById("mobilePost")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "postInput"
                )
                .focus();

        }
    );


async function createPost() {

    if (!currentUser) {
        return;
    }


    const input =
        document.getElementById(
            "postInput"
        );


    const content =
        input.value.trim();


    if (!content) {
        return;
    }


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


    if (error) {

        console.error(
            "Create post error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    input.value = "";


    document
        .getElementById(
            "characterCount"
        )
        .textContent =
        "0/280";


    await loadFeed();

    await loadProfile();

}


/* =========================================================
   LIKE
========================================================= */

async function toggleLike(postId) {

    if (!currentUser) {
        return;
    }


    const {
        data: existing,
        error: findError
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


    if (findError) {

        console.error(
            "Like lookup error:",
            findError
        );

        alert(
            findError.message
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


        if (error) {

            alert(
                error.message
            );

            return;

        }

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


        if (error) {

            alert(
                error.message
            );

            return;

        }

    }


    await loadFeed();

}


/* =========================================================
   DELETE POST
========================================================= */

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

        console.error(
            "Delete post error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    await loadFeed();

    await loadProfile();

}


/* =========================================================
   COMMENTS
========================================================= */

async function commentPost(postId) {

    const content =
        prompt(
            "Write your comment:"
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

        console.error(
            "Comment error:",
            error
        );

        alert(
            error.message
        );

        return;

    }


    alert(
        "Comment posted!"
    );

}


/* =========================================================
   SHARE
========================================================= */

async function sharePost(postId) {

    const url =
        `${location.origin}${location.pathname}#post-${postId}`;


    try {

        if (
            navigator.clipboard
        ) {

            await navigator.clipboard.writeText(
                url
            );

            alert(
                "Post link copied!"
            );

        }

    } catch (error) {

        console.error(
            "Share error:",
            error
        );

    }

}


/* =========================================================
   SUGGESTIONS
========================================================= */

async function loadSuggestions() {

    const container =
        document.getElementById(
            "suggestions"
        );


    if (!container) {
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
        (profiles || [])
            .map(
                profile => {

                    const verified =
                        profile.username ===
                        "connectx";


                    return `

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:10px;
                                margin-bottom:15px;
                            "
                        >

                            <div class="avatar">

                                ${escapeHTML(
                                    initials(
                                        profile.display_name
                                    )
                                )}

                            </div>


                            <div style="flex:1">

                                <strong>

                                    ${escapeHTML(
                                        profile.display_name
                                    )}

                                    ${
                                        verified
                                            ?
                                            `
                                            <img
                                                src="Verified ConnectX.jpg"
                                                class="verified-badge"
                                                alt="Verified"
                                            >
                                            `
                                            :
                                            ""
                                    }

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

                    `;

                }
            )
            .join("");

}


/* =========================================================
   FOLLOW
========================================================= */

async function toggleFollow(userId) {

    const {
        data: existing,
        error: findError
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


    if (findError) {

        alert(
            findError.message
        );

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


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    if (!currentProfile) {
        return;
    }


    document
        .getElementById(
            "profileName"
        )
        .textContent =
        currentProfile.display_name ||
        "User";


    document
        .getElementById(
            "profileUsername"
        )
        .textContent =
        "@" +
        (
            currentProfile.username ||
            "user"
        );


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
                    head:
                        true
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
                    head:
                        true
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
                    head:
                        true
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
                profiles!posts_user_id_fkey (
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
        .getElementById(
            "profilePosts"
        )
        .innerHTML =
        (data || [])
            .map(renderPost)
            .join("");

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    const container =
        document.getElementById(
            "notifications"
        );


    if (!container) {
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
            "Notifications error:",
            error
        );

        container.innerHTML = `
            <div style="
                padding:30px;
                color:var(--muted);
            ">
                Unable to load notifications.
            </div>
        `;

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div style="
                padding:30px;
                color:var(--muted);
            ">
                No notifications yet.
            </div>
        `;

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


/* =========================================================
   SEARCH
========================================================= */

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

            navigate(
                "explore"
            );

        }
    );


async function search() {

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

        results.innerHTML =
            "";

        return;

    }


    const {
        data: users,
        error: userError
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .or(
                `username.ilike.%${query}%,display_name.ilike.%${query}%`
            )
            .limit(20);


    if (userError) {

        console.error(
            "User search error:",
            userError
        );

    }


    const {
        data: posts,
        error: postError
    } =
        await supabaseClient
            .from("posts")
            .select(`
                id,
                user_id,
                content,
                created_at,
                profiles!posts_user_id_fkey (
                    username,
                    display_name
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


    if (postError) {

        console.error(
            "Post search error:",
            postError
        );

    }


    let html = "";


    if (
        users &&
        users.length
    ) {

        html += `
            <h2 style="padding:20px">
                People
            </h2>
        `;


        html += users
            .map(
                user => {

                    const verified =
                        user.username ===
                        "connectx";


                    return `

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

                                    ${
                                        verified
                                            ?
                                            `
                                            <img
                                                src="Verified ConnectX.jpg"
                                                class="verified-badge"
                                                alt="Verified"
                                            >
                                            `
                                            :
                                            ""
                                    }

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

                    `;

                }
            )
            .join("");

    }


    if (
        posts &&
        posts.length
    ) {

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
            `
            <div style="
                padding:30px;
                color:var(--muted);
            ">
                No results found.
            </div>
            `;

    }


    results.innerHTML =
        html;

}


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(
        "[data-page]"
    )
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
        .querySelectorAll(
            ".page"
        )
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
        .querySelectorAll(
            ".nav"
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


    if (
        page ===
        "home"
    ) {

        loadFeed();

    }


    if (
        page ===
        "profile"
    ) {

        loadProfile();

    }


    if (
        page ===
        "notifications"
    ) {

        loadNotifications();

    }

}


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById(
        "logoutButton"
    )
    .addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            location.reload();

        }
    );


/* =========================================================
   DARK MODE
========================================================= */

document
    .getElementById(
        "darkModeButton"
    )
    .addEventListener(
        "click",
        () => {

            document
                .body
                .classList
                .toggle(
                    "dark"
                );

        }
    );


/* =========================================================
   AUTH SESSION
========================================================= */

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


    if (
        data &&
        data.session
    ) {

        currentUser =
            data.session.user;


        await loadApp();

    }

}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

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
                    session.user;

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


/* =========================================================
   START CONNECTX
========================================================= */

checkSession();
