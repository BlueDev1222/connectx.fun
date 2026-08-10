/* =====================================================
CONNECTX
SUPABASE + PHASE 1
Likes
Replies
Reposts
Quote Posts
Image Uploads
Bookmarks
===================================================== */

/* =====================================================
SUPABASE
===================================================== */

const SUPABASE_URL =
"https://onvmeffhmruzshqlwakx.supabase.co";

const SUPABASE_KEY =
"sb_publishable_9VzEW8DurRpM51GgQ282BQ_qQ3e1WkX";

const supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

/* =====================================================
STATE
===================================================== */

let currentUser = null;
let currentProfile = null;

let selectedImage = null;
let selectedImagePreview = null;

/* =====================================================
HELPERS
===================================================== */

function initials(name) {

```
if (!name)
    return "U";

return name
    .split(" ")
    .map(x => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
```

}

function escapeHTML(text) {

```
return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
```

}

function timeAgo(date) {

```
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
```

}

function authMessage(message, error = true) {

```
const element =
    document.getElementById(
        "authMessage"
    );

element.textContent =
    message;

element.style.color =
    error
        ? "#d00"
        : "#16803c";
```

}

/* =====================================================
LOGIN
===================================================== */

document
.getElementById("loginForm")
.addEventListener(
"submit",
async event => {

```
        event.preventDefault();

        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();

        const password =
            document
                .getElementById(
                    "loginPassword"
                )
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
```

/* =====================================================
REGISTER
===================================================== */

document
.getElementById("registerForm")
.addEventListener(
"submit",
async event => {

```
        event.preventDefault();


        const name =
            document
                .getElementById(
                    "registerName"
                )
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
                .getElementById(
                    "registerEmail"
                )
                .value
                .trim();

        const password =
            document
                .getElementById(
                    "registerPassword"
                )
                .value;


        if (
            !/^[a-z0-9_]+$/.test(username)
        ) {

            authMessage(
                "Username can only contain letters, numbers and underscores."
            );

            return;

        }


        const {
            data: existing
        } =
            await supabaseClient
                .from("profiles")
                .select("id")
                .eq(
                    "username",
                    username
                )
                .maybeSingle();


        if (existing) {

            authMessage(
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

                        data: {

                            username,

                            display_name:
                                name

                        }

                    }

                });


        if (error) {

            authMessage(
                error.message
            );

            return;

        }


        if (data.session) {

            currentUser =
                data.user;

            await loadApp();

        } else {

            authMessage(
                "Account created. Check your email to confirm your account.",
                false
            );

        }

    }
);
```

/* =====================================================
SWITCH AUTH
===================================================== */

document
.getElementById("switchAuth")
.addEventListener(
"click",
() => {

```
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
```

/* =====================================================
LOAD APP
===================================================== */

async function loadApp() {

```
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
        .single();


if (error) {

    console.error(
        "Profile error:",
        error
    );

    return;

}


currentProfile =
    profile;


document
    .getElementById("authScreen")
    .style.display =
    "none";


document
    .getElementById("app")
    .style.display =
    "block";


updateUserUI();

await loadFeed();

await loadSuggestions();

await loadProfile();

await loadNotifications();
```

}

/* =====================================================
USER UI
===================================================== */

function updateUserUI() {

```
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


/*
   @connectx gets the verified badge.
*/

const badge =
    document.getElementById(
        "profileVerifiedBadge"
    );


if (
    currentProfile.username
        ?.toLowerCase() ===
    "connectx"
) {

    badge.style.display =
        "inline-block";

} else {

    badge.style.display =
        "none";

}
```

}

/* =====================================================
LOAD POSTS
===================================================== */

async function getPostsForFeed() {

```
const {
    data: posts,
    error
} =
    await supabaseClient
        .from("posts")
        .select(
            `
            id,
            user_id,
            content,
            created_at,
            repost_of,
            quote_content
            `
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(100);


if (error)
    throw error;


if (!posts?.length)
    return [];


const userIds =
    [
        ...new Set(
            posts.map(
                post =>
                    post.user_id
            )
        )
    ];


const postIds =
    posts.map(
        post =>
            post.id
    );


const [
    profilesResult,
    likesResult,
    bookmarksResult,
    repostsResult,
    mediaResult
] =
    await Promise.all([

        supabaseClient
            .from("profiles")
            .select(
                "id,username,display_name,avatar_url"
            )
            .in(
                "id",
                userIds
            ),

        supabaseClient
            .from("likes")
            .select(
                "post_id,user_id"
            )
            .in(
                "post_id",
                postIds
            ),

        supabaseClient
            .from("bookmarks")
            .select(
                "post_id,user_id"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .in(
                "post_id",
                postIds
            ),

        supabaseClient
            .from("posts")
            .select(
                "id,user_id,repost_of"
            )
            .in(
                "repost_of",
                postIds
            ),

        supabaseClient
            .from("post_media")
            .select(
                "id,post_id,media_url"
            )
            .in(
                "post_id",
                postIds
            )

    ]);


if (profilesResult.error)
    throw profilesResult.error;

if (likesResult.error)
    throw likesResult.error;

if (bookmarksResult.error)
    throw bookmarksResult.error;

if (repostsResult.error)
    throw repostsResult.error;

if (mediaResult.error)
    throw mediaResult.error;


const profiles =
    new Map(
        profilesResult.data.map(
            profile => [
                profile.id,
                profile
            ]
        )
    );


const likesByPost =
    new Map();


for (
    const like
    of likesResult.data || []
) {

    if (
        !likesByPost.has(
            like.post_id
        )
    ) {

        likesByPost.set(
            like.post_id,
            []
        );

    }

    likesByPost
        .get(like.post_id)
        .push(like);

}


const bookmarkedIds =
    new Set(
        (
            bookmarksResult.data ||
            []
        ).map(
            bookmark =>
                bookmark.post_id
        )
    );


const repostCounts =
    new Map();


for (
    const repost
    of repostsResult.data || []
) {

    repostCounts.set(
        repost.repost_of,
        (
            repostCounts.get(
                repost.repost_of
            ) || 0
        ) + 1
    );

}


const mediaByPost =
    new Map();


for (
    const media
    of mediaResult.data || []
) {

    mediaByPost.set(
        media.post_id,
        media
    );

}


return posts.map(post => ({

    ...post,

    profiles:
        profiles.get(
            post.user_id
        ) || {
            username:
                "unknown",
            display_name:
                "Unknown"
        },

    likes:
        likesByPost.get(
            post.id
        ) || [],

    bookmarked:
        bookmarkedIds.has(
            post.id
        ),

    repost_count:
        repostCounts.get(
            post.id
        ) || 0,

    media:
        mediaByPost.get(
            post.id
        ) || null

}));
```

}

/* =====================================================
LOAD FEED
===================================================== */

async function loadFeed() {

```
const feed =
    document.getElementById(
        "feed"
    );


try {

    const posts =
        await getPostsForFeed();


    if (!posts.length) {

        feed.innerHTML =
            `
            <div class="empty">
                No posts yet.
                Be the first to post!
            </div>
            `;

        return;

    }


    feed.innerHTML =
        posts
            .map(
                renderPost
            )
            .join("");


} catch (error) {

    console.error(
        "Failed to load posts:",
        error
    );


    feed.innerHTML =
        `
        <div class="error">
            Failed to load posts.
            <br><br>
            ${escapeHTML(
                error.message
            )}
        </div>
        `;

}
```

}

/* =====================================================
RENDER POST
===================================================== */

function renderPost(post) {

```
const profile =
    post.profiles;


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


const media =
    post.media;


const imageHTML =
    media
        ?
        `
        <img
            class="post-image"
            src="${escapeHTML(
                media.media_url
            )}"
            alt="Post image"
            loading="lazy"
        >
        `
        :
        "";


const repostLabel =
    post.repost_of
        ?
        `
        <div class="repost-label">
            🔁 Repost
        </div>
        `
        :
        "";


const quoteHTML =
    post.quote_content
        ?
        `
        <div class="quote-post">
            ${escapeHTML(
                post.quote_content
            )}
        </div>
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

            ${repostLabel}


            <div class="post-header">

                <strong class="post-name">
                    ${escapeHTML(
                        profile.display_name
                    )}
                </strong>


                ${
                    profile.username
                        ?.toLowerCase() ===
                    "connectx"
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


                <span class="post-user">
                    @${escapeHTML(
                        profile.username
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


            ${quoteHTML}


            ${imageHTML}


            <div class="actions">


                <!-- REPLY -->

                <button
                    class="action"
                    onclick="replyToPost('${post.id}')"
                >
                    💬
                    Reply
                </button>


                <!-- LIKE -->

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


                <!-- REPOST -->

                <button
                    class="action ${
                        post.reposted
                            ? "reposted"
                            : ""
                    }"
                    onclick="repostPost('${post.id}')"
                >

                    🔁
                    ${post.repost_count || 0}

                </button>


                <!-- QUOTE -->

                <button
                    class="action"
                    onclick="quotePost('${post.id}')"
                >
                    💭
                </button>


                <!-- BOOKMARK -->

                <button
                    class="action ${
                        post.bookmarked
                            ? "bookmarked"
                            : ""
                    }"
                    onclick="toggleBookmark('${post.id}')"
                >

                    ${
                        post.bookmarked
                            ? "🔖"
                            : "🔖"
                    }

                </button>


                <!-- SHARE -->

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


            <div id="replies-${post.id}"></div>

        </div>

    </article>

`;
```

}

/* =====================================================
IMAGE PICKER
===================================================== */

document
.getElementById("imageInput")
.addEventListener(
"change",
event => {

```
        const file =
            event.target.files[0];


        if (!file)
            return;


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "Images must be smaller than 10MB."
            );

            event.target.value =
                "";

            return;

        }


        selectedImage =
            file;


        if (
            selectedImagePreview
        ) {

            URL.revokeObjectURL(
                selectedImagePreview
            );

        }


        selectedImagePreview =
            URL.createObjectURL(
                file
            );


        const preview =
            document.getElementById(
                "imagePreview"
            );


        preview.innerHTML =
            `
            <img
                src="${selectedImagePreview}"
                alt="Image preview"
            >

            <button
                class="remove-image"
                onclick="removeSelectedImage()"
                type="button"
            >
                ×
            </button>
            `;


        preview.classList.add(
            "active"
        );

    }
);
```

function removeSelectedImage() {

```
selectedImage =
    null;


if (
    selectedImagePreview
) {

    URL.revokeObjectURL(
        selectedImagePreview
    );

    selectedImagePreview =
        null;

}


document
    .getElementById(
        "imageInput"
    )
    .value =
    "";


const preview =
    document.getElementById(
        "imagePreview"
    );


preview.innerHTML =
    "";

preview.classList.remove(
    "active"
);
```

}

/* =====================================================
CREATE POST
===================================================== */

document
.getElementById("postInput")
.addEventListener(
"input",
() => {

```
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
```

document
.getElementById("postButton")
.addEventListener(
"click",
createPost
);

async function createPost() {

```
const input =
    document.getElementById(
        "postInput"
    );


const content =
    input.value.trim();


if (
    !content &&
    !selectedImage
)
    return;


const button =
    document.getElementById(
        "postButton"
    );


button.disabled =
    true;

button.textContent =
    "Posting...";


try {

    const {
        data: post,
        error
    } =
        await supabaseClient
            .from("posts")
            .insert({

                user_id:
                    currentUser.id,

                content:
                    content || ""

            })
            .select(
                "id"
            )
            .single();


    if (error)
        throw error;


    /*
        Upload image if one
        was selected.
    */

    if (selectedImage) {

        const extension =
            selectedImage.name
                .split(".")
                .pop()
                .toLowerCase();


        const filePath =
            `${currentUser.id}/${post.id}.${extension}`;


        const {
            error:
                uploadError
        } =
            await supabaseClient
                .storage
                .from(
                    "post-images"
                )
                .upload(
                    filePath,
                    selectedImage,
                    {
                        cacheControl:
                            "3600",
                        upsert:
                            true
                    }
                );


        if (uploadError)
            throw uploadError;


        const {
            data:
                publicData
        } =
            supabaseClient
                .storage
                .from(
                    "post-images"
                )
                .getPublicUrl(
                    filePath
                );


        const {
            error:
                mediaError
        } =
            await supabaseClient
                .from(
                    "post_media"
                )
                .insert({

                    post_id:
                        post.id,

                    user_id:
                        currentUser.id,

                    media_url:
                        publicData
                            .publicUrl,

                    media_type:
                        selectedImage.type

                });


        if (mediaError)
            throw mediaError;

    }


    input.value =
        "";


    document
        .getElementById(
            "characterCount"
        )
        .textContent =
        "0/280";


    removeSelectedImage();


    await loadFeed();

    await loadProfile();


} catch (error) {

    console.error(
        "Create post error:",
        error
    );

    alert(
        error.message
    );

} finally {

    button.disabled =
        false;

    button.textContent =
        "Post";

}
```

}

/* =====================================================
LIKE
===================================================== */

async function toggleLike(postId) {

```
try {

    const {
        data: existing,
        error: checkError
    } =
        await supabaseClient
            .from("likes")
            .select(
                "post_id"
            )
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (checkError)
        throw checkError;


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
            throw error;

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
            throw error;

    }


    await loadFeed();


} catch (error) {

    console.error(
        "Like error:",
        error
    );

    alert(
        error.message
    );

}
```

}

/* =====================================================
REPLY
===================================================== */

async function replyToPost(postId) {

```
const content =
    prompt(
        "Write your reply:"
    );


if (
    !content ||
    !content.trim()
)
    return;


try {

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


    if (error)
        throw error;


    alert(
        "Reply posted!"
    );


} catch (error) {

    console.error(
        "Reply error:",
        error
    );

    alert(
        error.message
    );

}
```

}

/* =====================================================
REPOST
===================================================== */

async function repostPost(postId) {

```
try {

    const {
        data: existing,
        error: existingError
    } =
        await supabaseClient
            .from("posts")
            .select(
                "id"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "repost_of",
                postId
            )
            .maybeSingle();


    if (existingError)
        throw existingError;


    if (existing) {

        const {
            error
        } =
            await supabaseClient
                .from("posts")
                .delete()
                .eq(
                    "id",
                    existing.id
                );


        if (error)
            throw error;

    } else {

        const {
            error
        } =
            await supabaseClient
                .from("posts")
                .insert({

                    user_id:
                        currentUser.id,

                    content:
                        "",

                    repost_of:
                        postId

                });


        if (error)
            throw error;

    }


    await loadFeed();


} catch (error) {

    console.error(
        "Repost error:",
        error
    );

    alert(
        error.message
    );

}
```

}

/* =====================================================
QUOTE POST
===================================================== */

async function quotePost(postId) {

```
const quote =
    prompt(
        "What do you want to say?"
    );


if (
    !quote ||
    !quote.trim()
)
    return;


try {

    const {
        error
    } =
        await supabaseClient
            .from("posts")
            .insert({

                user_id:
                    currentUser.id,

                content:
                    quote.trim(),

                repost_of:
                    postId,

                quote_content:
                    quote.trim()

            });


    if (error)
        throw error;


    await loadFeed();


} catch (error) {

    console.error(
        "Quote error:",
        error
    );

    alert(
        error.message
    );

}
```

}

/* =====================================================
BOOKMARK
===================================================== */

async function toggleBookmark(postId) {

```
try {

    const {
        data: existing,
        error: checkError
    } =
        await supabaseClient
            .from("bookmarks")
            .select(
                "post_id"
            )
            .eq(
                "post_id",
                postId
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (checkError)
        throw checkError;


    if (existing) {

        const {
            error
        } =
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


        if (error)
            throw error;

    } else {

        const {
            error
        } =
            await supabaseClient
                .from("bookmarks")
                .insert({

                    post_id:
                        postId,

                    user_id:
                        currentUser.id

                });


        if (error)
            throw error;

    }


    await loadFeed();


} catch (error) {

    console.error(
        "Bookmark error:",
        error
    );

    alert(
        error.message
    );

}
```

}

/* =====================================================
SHARE
===================================================== */

async function sharePost(postId) {

```
const url =
    `${location.origin}${location.pathname}#post-${postId}`;


try {

    if (
        navigator.share
    ) {

        await navigator.share({

            title:
                "ConnectX post",

            url

        });

    } else {

        await navigator.clipboard
            .writeText(
                url
            );

        alert(
            "Post link copied!"
        );

    }

} catch (error) {

    console.log(
        error
    );

}
```

}

/* =====================================================
DELETE
===================================================== */

async function deletePost(postId) {

```
if (
    !confirm(
        "Delete this post?"
    )
)
    return;


try {

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


    if (error)
        throw error;


    await loadFeed();

    await loadProfile();


} catch (error) {

    console.error(
        error
    );

    alert(
        error.message
    );

}
```

}

/* =====================================================
SUGGESTIONS
===================================================== */

async function loadSuggestions() {

```
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

    console.error(
        error
    );

    return;

}


if (!profiles?.length) {

    container.innerHTML =
        `
        <span class="muted">
            No suggestions yet.
        </span>
        `;

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
```

}

/* =====================================================
FOLLOW
===================================================== */

async function toggleFollow(userId) {

```
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
```

}

/* =====================================================
PROFILE
===================================================== */

async function loadProfile() {

```
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
        .select(
            `
            id,
            user_id,
            content,
            created_at,
            repost_of,
            quote_content
            `
        )
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "created_at",
            {
                ascending:
                    false
            }
        );


if (error) {

    console.error(
        error
    );

    return;

}


const profilePosts =
    document.getElementById(
        "profilePosts"
    );


if (!data?.length) {

    profilePosts.innerHTML =
        `
        <div class="empty">
            No posts yet.
        </div>
        `;

    return;

}


/*
   Simple profile rendering.
*/

const postIds =
    data.map(
        post =>
            post.id
    );


const {
    data: likes
} =
    await supabaseClient
        .from("likes")
        .select(
            "post_id,user_id"
        )
        .in(
            "post_id",
            postIds
        );


const {
    data: media
} =
    await supabaseClient
        .from("post_media")
        .select(
            "post_id,media_url"
        )
        .in(
            "post_id",
            postIds
        );


const likesMap =
    new Map();


for (
    const like
    of likes || []
) {

    if (
        !likesMap.has(
            like.post_id
        )
    ) {

        likesMap.set(
            like.post_id,
            []
        );

    }

    likesMap
        .get(like.post_id)
        .push(like);

}


const mediaMap =
    new Map(
        (media || [])
            .map(
                item => [
                    item.post_id,
                    item
                ]
            )
    );


profilePosts.innerHTML =
    data
        .map(
            post =>
                renderPost({

                    ...post,

                    profiles:
                        currentProfile,

                    likes:
                        likesMap.get(
                            post.id
                        ) || [],

                    bookmarked:
                        false,

                    repost_count:
                        0,

                    media:
                        mediaMap.get(
                            post.id
                        ) || null

                })
        )
        .join("");
```

}

/* =====================================================
NOTIFICATIONS
===================================================== */

async function loadNotifications() {

```
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
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .order(
            "created_at",
            {
                ascending:
                    false
            }
        )
        .limit(50);


if (error) {

    console.error(
        error
    );

    container.innerHTML =
        `
        <div class="empty">
            No notifications available.
        </div>
        `;

    return;

}


if (!data?.length) {

    container.innerHTML =
        `
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
```

}

/* =====================================================
SEARCH
===================================================== */

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
}
);

async function search() {

```
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
    data: users
} =
    await supabaseClient
        .from("profiles")
        .select("*")
        .or(
            `username.ilike.%${query}%,display_name.ilike.%${query}%`
        )
        .limit(20);


let html =
    "";


if (users?.length) {

    html +=
        `
        <h2 style="padding:20px">
            People
        </h2>
        `;


    html +=
        users
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


if (!html) {

    html =
        `
        <div class="empty">
            No results found.
        </div>
        `;

}


results.innerHTML =
    html;
```

}

/* =====================================================
NAVIGATION
===================================================== */

document
.querySelectorAll(
"[data-page]"
)
.forEach(button => {

```
    button.addEventListener(
        "click",
        () => {

            navigate(
                button.dataset.page
            );

        }
    );

});
```

function navigate(page) {

```
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


if (pageElement)
    pageElement.classList.add(
        "active"
    );


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
)
    loadFeed();


if (
    page ===
    "profile"
)
    loadProfile();


if (
    page ===
    "notifications"
)
    loadNotifications();
```

}

/* =====================================================
SIDEBAR / MOBILE POST
===================================================== */

document
.getElementById(
"sidebarPostButton"
)
.addEventListener(
"click",
() => {

```
        document
            .getElementById(
                "postInput"
            )
            .focus();

    }
);
```

document
.getElementById(
"mobilePost"
)
.addEventListener(
"click",
() => {

```
        navigate(
            "home"
        );

        setTimeout(
            () => {

                document
                    .getElementById(
                        "postInput"
                    )
                    .focus();

            },
            50
        );

    }
);
```

/* =====================================================
LOGOUT
===================================================== */

document
.getElementById(
"logoutButton"
)
.addEventListener(
"click",
async () => {

```
        await supabaseClient
            .auth
            .signOut();

        location.reload();

    }
);
```

/* =====================================================
DARK MODE
===================================================== */

document
.getElementById(
"darkModeButton"
)
.addEventListener(
"click",
() => {

```
        document
            .body
            .classList
            .toggle(
                "dark"
            );

    }
);
```

/* =====================================================
SESSION
===================================================== */

async function checkSession() {

```
const {
    data
} =
    await supabaseClient
        .auth
        .getSession();


if (
    data.session
) {

    currentUser =
        data.session.user;

    await loadApp();

}
```

}

supabaseClient
.auth
.onAuthStateChange(
async (
event,
session
) => {

```
        if (
            event ===
            "SIGNED_IN" &&
            session
        ) {

            currentUser =
                session.user;

        }

    }
);
```

checkSession();
