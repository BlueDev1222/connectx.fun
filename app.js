/* =========================================================
   CONNECTX
   Clean Supabase Starter
========================================================= */


/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
    "https://onvmeffhmruzshqlwakx.supabase.co";


const SUPABASE_KEY =
    "YOUR_SUPABASE_PUBLISHABLE_KEY";


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

    return name
        .split(" ")
        .filter(Boolean)
        .map(word => word[0])
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
            (Date.now() - new Date(date).getTime()) / 1000
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


    if (days < 30) {
        return `${days}d`;
    }


    const months =
        Math.floor(days / 30);


    if (months < 12) {
        return `${months}mo`;
    }


    return `${Math.floor(months / 12)}y`;

}


function showAuthMessage(
    message,
    success = false
) {

    const element =
        document.getElementById(
            "authMessage"
        );


    element.textContent =
        message;


    element.style.color =
        success
            ? "#16803c"
            : "#d00";

}


/* =========================================================
   VERIFIED BADGE
========================================================= */

function isVerified(profile) {

    if (!profile) {
        return false;
    }


    if (
        profile.username?.toLowerCase() ===
        "connectx"
    ) {

        return true;

    }


    return profile.verified === true;

}


function verifiedBadge(profile) {

    if (!isVerified(profile)) {
        return "";
    }


    return `
        <img
            class="inline-verified"
            src="assets/Verified ConnectX.jpg"
            alt="Verified"
            title="Verified"
        >
    `;

}


/* =========================================================
   AUTH - LOGIN
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


            showAuthMessage("");


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


/* =========================================================
   AUTH - REGISTER
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


            if (username.length < 3) {

                showAuthMessage(
                    "Username must be at least 3 characters."
                );

                return;

            }


            if (
                !/^[a-z0-9_]+$/.test(
                    username
                )
            ) {

                showAuthMessage(
                    "Username can only contain letters, numbers and underscores."
                );

                return;

            }


            if (username === "connectx") {

                showAuthMessage(
                    "That username is reserved."
                );

                return;

            }


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

                showAuthMessage(
                    usernameError.message
                );

                return;

            }


            if (existing) {

                showAuthMessage(
                    "That username is already taken."
                );

                return;

            }


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
                                `${window.location.origin}/verify.html`,

                            data: {

                                username,

                                display_name:
                                    name

                            }

                        }

                    });


            if (error) {

                showAuthMessage(
                    error.message
                );

                return;

            }


            if (!data.session) {

                showAuthMessage(
                    "Account created! Check your email to verify your account.",
                    true
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

            const loginForm =
                document.getElementById(
                    "loginForm"
                );


            const registerForm =
                document.getElementById(
                    "registerForm"
                );


            const switchButton =
                document.getElementById(
                    "switchAuth"
                );


            const showingLogin =
                !loginForm.classList.contains(
                    "hidden"
                );


            if (showingLogin) {

                loginForm.classList.add(
                    "hidden"
                );

                registerForm.classList.remove(
                    "hidden"
                );

                switchButton.textContent =
                    "Already have an account? Log in";

            } else {

                registerForm.classList.add(
                    "hidden"
                );

                loginForm.classList.remove(
                    "hidden"
                );

                switchButton.textContent =
                    "Create an account";

            }


            showAuthMessage("");

        }
    );


/* =========================================================
   LOAD APPLICATION
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
            "Profile error:",
            error
        );

        showAuthMessage(
            "Your account exists, but your profile could not be loaded."
        );

        return;

    }


    currentProfile =
        profile;


    document
        .getElementById("authScreen")
        .classList.add("hidden");


    document
        .getElementById("app")
        .classList.remove("hidden");


    updateUserUI();


    await loadFeed();

    await loadSuggestions();

    await loadProfile();

    await loadNotifications();

    await loadBookmarks();

}


/* =========================================================
   UPDATE USER UI
========================================================= */

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
        `@${currentProfile.username}`;


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


    document
        .getElementById("profileName")
        .textContent =
        name;


    document
        .getElementById("profileUsername")
        .textContent =
        `@${currentProfile.username}`;


    document
        .getElementById("profileBio")
        .textContent =
        currentProfile.bio ||
        "Welcome to ConnectX!";


    const verified =
        document.getElementById(
            "profileVerified"
        );


    if (
        isVerified(
            currentProfile
        )
    ) {

        verified.classList.add(
            "visible"
        );

    } else {

        verified.classList.remove(
            "visible"
        );

    }

}


/* =========================================================
   LOAD FEED
========================================================= */

async function loadFeed() {

    const feed =
        document.getElementById(
            "feed"
        );


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
                created_at,
                profiles (
                    id,
                    username,
                    display_name,
                    avatar_url,
                    verified
                ),
                likes (
                    user_id
                ),
                bookmarks (
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


        feed.innerHTML = `
            <div class="error">
                Failed to load posts.
                <br>
                <small>
                    ${escapeHTML(error.message)}
                </small>
            </div>
        `;

        return;

    }


    if (!posts?.length) {

        feed.innerHTML = `
            <div class="empty">
                No posts yet.
                <br>
                Be the first person to post!
            </div>
        `;

        return;

    }


    feed.innerHTML =
        posts
            .map(renderPost)
            .join("");

}


/* =========================================================
   RENDER POST
========================================================= */

function renderPost(post) {

    const profile =
        post.profiles || {};


    const likes =
        post.likes || [];


    const bookmarks =
        post.bookmarks || [];


    const liked =
        likes.some(
            like =>
                like.user_id ===
                currentUser.id
        );


    const bookmarked =
        bookmarks.some(
            bookmark =>
                bookmark.user_id ===
                currentUser.id
        );


    const own =
        post.user_id ===
        currentUser.id;


    return `

        <article
            class="post"
            id="post-${escapeHTML(post.id)}"
        >

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
                            profile.display_name ||
                            "User"
                        )}

                        ${verifiedBadge(profile)}

                    </strong>


                    <span class="post-user">

                        @${escapeHTML(
                            profile.username ||
                            "user"
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


                ${
                    post.image_url
                    ?
                    `
                        <img
                            class="post-image"
                            src="${escapeHTML(post.image_url)}"
                            alt="Post image"
                        >
                    `
                    :
                    ""
                }


                <div class="actions">

                    <button
                        class="action"
                        onclick="replyToPost('${post.id}')"
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
                        class="action ${
                            bookmarked
                                ? "bookmarked"
                                : ""
                        }"
                        onclick="toggleBookmark('${post.id}')"
                    >
                        🔖
                    </button>


                    <button
                        class="action"
                        onclick="repost('${post.id}')"
                    >
                        🔁
                    </button>


                    <button
                        class="action"
                        onclick="sharePost('${post.id}')"
                    >
                        ↗
                    </button>


                    ${
                        own
                            ?
                            `
                                <button
                                    class="action"
                                    onclick="deletePost('${post.id}')"
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

            navigate("home");


            document
                .getElementById(
                    "postInput"
                )
                .focus();

        }
    );


async function createPost() {

    const input =
        document.getElementById(
            "postInput"
        );


    const content =
        input.value.trim();


    if (!content) {
        return;
    }


    if (content.length > 280) {

        alert(
            "Posts can only be 280 characters."
        );

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

    const {
        data: existing
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


/* =========================================================
   BOOKMARK
========================================================= */

async function toggleBookmark(postId) {

    const {
        data: existing
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

    } else {

        await supabaseClient
            .from("bookmarks")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id

            });

    }


    await loadFeed();

}


/* =========================================================
   BOOKMARK PAGE
========================================================= */

async function loadBookmarks() {

    const container =
        document.getElementById(
            "bookmarks"
        );


    const {
        data: bookmarks,
        error
    } =
        await supabaseClient
            .from("bookmarks")
            .select(`
                post_id,
                posts (
                    id,
                    user_id,
                    content,
                    image_url,
                    created_at,
                    profiles (
                        id,
                        username,
                        display_name,
                        avatar_url,
                        verified
                    ),
                    likes (
                        user_id
                    ),
                    bookmarks (
                        user_id
                    )
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

        console.error(error);

        container.innerHTML = `
            <div class="error">
                ${escapeHTML(error.message)}
            </div>
        `;

        return;

    }


    const posts =
        (bookmarks || [])
            .map(
                item =>
                    item.posts
            )
            .filter(Boolean);


    if (!posts.length) {

        container.innerHTML = `
            <div class="empty">
                You haven't bookmarked anything yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        posts
            .map(renderPost)
            .join("");

}


/* =========================================================
   REPLY
========================================================= */

async function replyToPost(postId) {

    const content =
        prompt(
            "Write your reply:"
        );


    if (!content?.trim()) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("replies")
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


/* =========================================================
   REPOST
========================================================= */

async function repost(postId) {

    const {
        data: original,
        error
    } =
        await supabaseClient
            .from("posts")
            .select("content")
            .eq(
                "id",
                postId
            )
            .single();


    if (error) {

        alert(
            error.message
        );

        return;

    }


    const {
        error: repostError
    } =
        await supabaseClient
            .from("posts")
            .insert({

                user_id:
                    currentUser.id,

                content:
                    `🔁 Repost: ${original.content}`,

                repost_of:
                    postId

            });


    if (repostError) {

        alert(
            repostError.message
        );

        return;

    }


    await loadFeed();

}


/* =========================================================
   DELETE
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

        alert(
            error.message
        );

        return;

    }


    await loadFeed();

    await loadProfile();

}


/* =========================================================
   SHARE
========================================================= */

async function sharePost(postId) {

    const url =
        `${window.location.origin}${window.location.pathname}#post-${postId}`;


    try {

        await navigator.clipboard.writeText(
            url
        );

        alert(
            "Post link copied!"
        );

    } catch {

        prompt(
            "Copy this link:",
            url
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


    container.innerHTML =
        (profiles || [])
            .map(
                profile => `

                    <div class="suggestion">

                        <div class="avatar">

                            ${escapeHTML(
                                initials(
                                    profile.display_name
                                )
                            )}

                        </div>


                        <div class="suggestion-info">

                            <strong>

                                ${escapeHTML(
                                    profile.display_name
                                )}

                                ${verifiedBadge(profile)}

                            </strong>


                            <span>
                                @${escapeHTML(
                                    profile.username
                                )}
                            </span>

                        </div>


                        <button
                            class="follow-button"
                            onclick="
                                toggleFollow(
                                    '${profile.id}'
                                )
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


/* =========================================================
   FOLLOW
========================================================= */

async function toggleFollow(userId) {

    const {
        data: existing
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
                image_url,
                created_at,
                profiles (
                    id,
                    username,
                    display_name,
                    avatar_url,
                    verified
                ),
                likes (
                    user_id
                ),
                bookmarks (
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

        console.error(error);

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


    const {
        data,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select(`
                *,
                actor:actor_id (
                    username,
                    display_name,
                    verified
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

        return;

    }


    if (!data?.length) {

        container.innerHTML = `
            <div class="empty">
                No notifications yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        data
            .map(
                notification => `

                    <div class="post">

                        <div class="avatar">
                            🔔
                        </div>

                        <div class="post-body">

                            <strong>

                                ${escapeHTML(
                                    notification.actor?.display_name ||
                                    "Someone"
                                )}

                                ${verifiedBadge(
                                    notification.actor
                                )}

                            </strong>

                            <div class="post-content">

                                ${escapeHTML(
                                    notification.message ||
                                    notification.type
                                )}

                            </div>

                            <span class="post-user">

                                ${timeAgo(
                                    notification.created_at
                                )}

                            </span>

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

            navigate("explore");

            document
                .getElementById(
                    "searchInput"
                )
                .focus();

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

        results.innerHTML = "";

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

        console.error(userError);

        return;

    }


    const {
        data: posts
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
                    username,
                    display_name,
                    verified
                ),
                likes (
                    user_id
                ),
                bookmarks (
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
            <h3 style="padding:20px 20px 10px">
                People
            </h3>
        `;


        html += users
            .map(
                user => `

                    <div class="post">

                        <div class="avatar">

                            ${escapeHTML(
                                initials(
                                    user.display_name
                                )
                            )}

                        </div>


                        <div class="post-body">

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


                            ${
                                user.bio
                                    ?
                                    `
                                        <div class="post-content">
                                            ${escapeHTML(user.bio)}
                                        </div>
                                    `
                                    :
                                    ""
                            }

                        </div>

                    </div>

                `
            )
            .join("");

    }


    if (posts?.length) {

        html += `
            <h3 style="padding:20px 20px 10px">
                Posts
            </h3>
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


/* =========================================================
   NAVIGATION
========================================================= */

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


    if (page === "bookmarks") {

        loadBookmarks();

    }

}


/* =========================================================
   LOGOUT
========================================================= */

document
    .getElementById("logoutButton")
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
    .getElementById("darkModeButton")
    .addEventListener(
        "click",
        () => {

            document
                .body
                .classList
                .toggle("dark");

        }
    );


/* =========================================================
   SESSION
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

        console.error(error);

        return;

    }


    if (data.session) {

        currentUser =
            data.session.user;

        await loadApp();

    }

}


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


checkSession();
