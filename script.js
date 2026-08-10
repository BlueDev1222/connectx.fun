/* =====================================================
   CONNECTX
   SUPABASE AUTH + APP
===================================================== */


let currentUser = null;
let currentProfile = null;

let authMethod = "email";

let pendingIdentifier = "";

let pendingName = "";
let pendingUsername = "";



/* =====================================================
   ELEMENTS
===================================================== */

const authScreen =
    document.getElementById("authScreen");

const app =
    document.getElementById("app");

const emailMethod =
    document.getElementById("emailMethod");

const phoneMethod =
    document.getElementById("phoneMethod");

const emailInputContainer =
    document.getElementById(
        "emailInputContainer"
    );

const phoneInputContainer =
    document.getElementById(
        "phoneInputContainer"
    );

const authEmail =
    document.getElementById("authEmail");

const authPhone =
    document.getElementById("authPhone");

const authName =
    document.getElementById("authName");

const authUsername =
    document.getElementById("authUsername");

const sendCodeButton =
    document.getElementById(
        "sendCodeButton"
    );

const otpContainer =
    document.getElementById(
        "otpContainer"
    );

const otpInput =
    document.getElementById("otpInput");

const verifyCodeButton =
    document.getElementById(
        "verifyCodeButton"
    );

const resendCodeButton =
    document.getElementById(
        "resendCodeButton"
    );

const authMessage =
    document.getElementById(
        "authMessage"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );



/* =====================================================
   AUTH MESSAGE
===================================================== */

function showAuthMessage(
    message,
    error = false
) {

    authMessage.textContent =
        message;

    authMessage.style.color =
        error
            ? "#e53935"
            : "#22c55e";

}



/* =====================================================
   EMAIL / PHONE SWITCH
===================================================== */

emailMethod.addEventListener(
    "click",
    () => {

        authMethod = "email";

        emailMethod.classList.add(
            "active"
        );

        phoneMethod.classList.remove(
            "active"
        );

        emailInputContainer.style.display =
            "block";

        phoneInputContainer.style.display =
            "none";

        otpContainer.style.display =
            "none";

        sendCodeButton.style.display =
            "block";

        showAuthMessage("");

    }
);


phoneMethod.addEventListener(
    "click",
    () => {

        authMethod = "phone";

        phoneMethod.classList.add(
            "active"
        );

        emailMethod.classList.remove(
            "active"
        );

        phoneInputContainer.style.display =
            "block";

        emailInputContainer.style.display =
            "none";

        otpContainer.style.display =
            "none";

        sendCodeButton.style.display =
            "block";

        showAuthMessage("");

    }
);



/* =====================================================
   VALIDATE USERNAME
===================================================== */

function validateUsername(
    username
) {

    if (username.length < 3) {

        return "Username must be at least 3 characters.";

    }


    if (username.length > 20) {

        return "Username must be 20 characters or less.";

    }


    if (
        !/^[a-zA-Z0-9_]+$/.test(
            username
        )
    ) {

        return "Username can only contain letters, numbers, and underscores.";

    }


    return null;

}



/* =====================================================
   SEND OTP
===================================================== */

sendCodeButton.addEventListener(
    "click",
    sendOTP
);


async function sendOTP() {

    const name =
        authName.value.trim();

    const username =
        authUsername.value
            .trim()
            .toLowerCase();


    /* ================================================
       VALIDATE NAME
    ================================================= */

    if (!name) {

        showAuthMessage(
            "Enter your display name.",
            true
        );

        return;

    }


    /* ================================================
       VALIDATE USERNAME
    ================================================= */

    const usernameError =
        validateUsername(
            username
        );


    if (usernameError) {

        showAuthMessage(
            usernameError,
            true
        );

        return;

    }


    /* ================================================
       CHECK USERNAME
    ================================================= */

    showAuthMessage(
        "Checking username..."
    );


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq(
                "username",
                username
            )
            .maybeSingle();


        if (error) {

            throw error;

        }


        if (data) {

            showAuthMessage(
                "That username is already taken.",
                true
            );

            return;

        }


    } catch (error) {

        console.error(
            "Username check:",
            error
        );

        showAuthMessage(
            error.message ||
            "Could not check username.",
            true
        );

        return;

    }


    /* ================================================
       GET EMAIL OR PHONE
    ================================================= */

    let identifier;


    if (authMethod === "email") {

        identifier =
            authEmail.value.trim();


        if (!identifier) {

            showAuthMessage(
                "Enter your email address.",
                true
            );

            return;

        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(identifier)
        ) {

            showAuthMessage(
                "Enter a valid email address.",
                true
            );

            return;

        }

    } else {

        identifier =
            authPhone.value.trim();


        if (!identifier) {

            showAuthMessage(
                "Enter your phone number.",
                true
            );

            return;

        }


        /*
         * Basic E.164-style validation.
         *
         * Example:
         * +15551234567
         */

        if (
            !/^\+[1-9]\d{7,14}$/
                .test(
                    identifier
                )
        ) {

            showAuthMessage(
                "Use your full phone number with country code. Example: +15551234567",
                true
            );

            return;

        }

    }


    /* ================================================
       SAVE DATA
    ================================================= */

    pendingIdentifier =
        identifier;

    pendingName =
        name;

    pendingUsername =
        username;


    sendCodeButton.disabled =
        true;

    sendCodeButton.textContent =
        "Sending...";


    showAuthMessage(
        "Sending verification code..."
    );


    try {

        let result;


        /* ==========================================
           EMAIL OTP
        ========================================== */

        if (
            authMethod === "email"
        ) {

            result =
                await supabaseClient.auth
                    .signInWithOtp({

                        email:
                            identifier,

                        options: {

                            shouldCreateUser:
                                true,

                            data: {

                                display_name:
                                    name,

                                username:
                                    username

                            }

                        }

                    });

        }


        /* ==========================================
           PHONE OTP
        ========================================== */

        else {

            result =
                await supabaseClient.auth
                    .signInWithOtp({

                        phone:
                            identifier,

                        options: {

                            shouldCreateUser:
                                true,

                            data: {

                                display_name:
                                    name,

                                username:
                                    username

                            }

                        }

                    });

        }


        if (result.error) {

            throw result.error;

        }


        /* ==========================================
           SHOW OTP BOX
        ========================================== */

        otpContainer.style.display =
            "block";

        sendCodeButton.style.display =
            "none";


        if (
            authMethod === "email"
        ) {

            showAuthMessage(
                "We sent a verification code to your email."
            );

        } else {

            showAuthMessage(
                "We sent a 6-digit code to your phone."
            );

        }


        otpInput.focus();


    } catch (error) {

        console.error(
            "OTP error:",
            error
        );


        showAuthMessage(
            error.message ||
            "Could not send verification code.",
            true
        );

    }


    sendCodeButton.disabled =
        false;

    sendCodeButton.textContent =
        "Send verification code";

}



/* =====================================================
   VERIFY OTP
===================================================== */

verifyCodeButton.addEventListener(
    "click",
    verifyOTP
);


async function verifyOTP() {

    const token =
        otpInput.value.trim();


    if (!token) {

        showAuthMessage(
            "Enter the verification code.",
            true
        );

        return;

    }


    if (!/^\d{6}$/.test(token)) {

        showAuthMessage(
            "The verification code must be 6 digits.",
            true
        );

        return;

    }


    verifyCodeButton.disabled =
        true;

    verifyCodeButton.textContent =
        "Verifying...";


    try {

        let result;


        /* ==========================================
           EMAIL
        ========================================== */

        if (
            authMethod === "email"
        ) {

            result =
                await supabaseClient.auth
                    .verifyOtp({

                        email:
                            pendingIdentifier,

                        token:
                            token,

                        type:
                            "email"

                    });

        }


        /* ==========================================
           PHONE
        ========================================== */

        else {

            result =
                await supabaseClient.auth
                    .verifyOtp({

                        phone:
                            pendingIdentifier,

                        token:
                            token,

                        type:
                            "sms"

                    });

        }


        if (result.error) {

            throw result.error;

        }


        currentUser =
            result.data.user;


        showAuthMessage(
            "Verification successful!"
        );


        /*
         * The database trigger should create
         * the ConnectX profile automatically.
         */

        await waitForProfile();


        await loadUser();


    } catch (error) {

        console.error(
            "Verification error:",
            error
        );


        showAuthMessage(
            error.message ||
            "Invalid or expired verification code.",
            true
        );

    }


    verifyCodeButton.disabled =
        false;

    verifyCodeButton.textContent =
        "Verify code";

}



/* =====================================================
   RESEND OTP
===================================================== */

resendCodeButton.addEventListener(
    "click",
    async () => {

        /*
         * Reset OTP input.
         */

        otpInput.value = "";


        /*
         * Supabase has rate limits.
         * Don't repeatedly click this button.
         */

        if (!pendingIdentifier) {

            return;

        }


        try {

            let result;


            if (
                authMethod === "email"
            ) {

                result =
                    await supabaseClient.auth
                        .signInWithOtp({

                            email:
                                pendingIdentifier,

                            options: {

                                shouldCreateUser:
                                    true

                            }

                        });

            } else {

                result =
                    await supabaseClient.auth
                        .signInWithOtp({

                            phone:
                                pendingIdentifier,

                            options: {

                                shouldCreateUser:
                                    true

                            }

                        });

            }


            if (result.error) {

                throw result.error;

            }


            showAuthMessage(
                "A new verification code was sent."
            );


        } catch (error) {

            console.error(
                "Resend error:",
                error
            );


            showAuthMessage(
                error.message ||
                "Could not resend the code.",
                true
            );

        }

    }
);



/* =====================================================
   WAIT FOR PROFILE
===================================================== */

async function waitForProfile() {

    if (!currentUser) {
        return;
    }


    for (
        let attempt = 0;
        attempt < 10;
        attempt++
    ) {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


        if (
            !error &&
            data
        ) {

            currentProfile =
                data;

            return;

        }


        await sleep(500);

    }

}



/* =====================================================
   LOAD USER
===================================================== */

async function loadUser() {

    try {

        const {
            data: {
                user
            }
        } =
            await supabaseClient.auth
                .getUser();


        if (!user) {

            showAuth();

            return;

        }


        currentUser =
            user;


        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Profile error:",
                error
            );

            showAuthMessage(
                "Could not load your profile.",
                true
            );

            return;

        }


        if (!profile) {

            await waitForProfile();


        } else {

            currentProfile =
                profile;

        }


        if (!currentProfile) {

            showAuthMessage(
                "Your account exists, but your ConnectX profile could not be created.",
                true
            );

            return;

        }


        showApp();


        updateProfileUI();


        await loadFeed();

        await loadProfilePosts();

        await loadSuggestions();


    } catch (error) {

        console.error(
            "Load user error:",
            error
        );

    }

}



/* =====================================================
   SHOW AUTH
===================================================== */

function showAuth() {

    authScreen.style.display =
        "flex";

    app.style.display =
        "none";

}



/* =====================================================
   SHOW APP
===================================================== */

function showApp() {

    authScreen.style.display =
        "none";

    app.style.display =
        "grid";

}



/* =====================================================
   LOGOUT
===================================================== */

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth.signOut();

        currentUser =
            null;

        currentProfile =
            null;

        showAuth();

    }
);



/* =====================================================
   UPDATE PROFILE UI
===================================================== */

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


    const avatarLetter =
        name
            .charAt(0)
            .toUpperCase();


    document.getElementById(
        "sidebarName"
    ).textContent =
        name;


    document.getElementById(
        "sidebarUsername"
    ).textContent =
        "@" + username;


    document.getElementById(
        "profileName"
    ).textContent =
        name;


    document.getElementById(
        "profileUsername"
    ).textContent =
        "@" + username;


    document.getElementById(
        "profileBio"
    ).textContent =
        currentProfile.bio ||
        "Welcome to ConnectX!";


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



/* =====================================================
   CREATE POST
===================================================== */

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


postInput.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            `${postInput.value.length}/280`;

    }
);


postButton.addEventListener(
    "click",
    createPost
);


async function createPost() {

    if (!currentUser) {

        return;

    }


    const content =
        postInput.value.trim();


    if (!content) {

        return;

    }


    postButton.disabled =
        true;

    postButton.textContent =
        "Posting...";


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
                        content

                });


        if (error) {

            throw error;

        }


        postInput.value =
            "";

        characterCount.textContent =
            "0/280";


        await loadFeed();

        await loadProfilePosts();


    } catch (error) {

        console.error(
            "Post error:",
            error
        );


        alert(
            error.message ||
            "Could not create post."
        );

    }


    postButton.disabled =
        false;

    postButton.textContent =
        "Post";

}



/* =====================================================
   LOAD FEED
===================================================== */

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
        } =
            await supabaseClient
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


        if (
            !data ||
            data.length === 0
        ) {

            feed.innerHTML =
                `<div class="empty">
                    No posts yet. Be the first to post!
                </div>`;

            return;

        }


        feed.innerHTML =
            "";


        data.forEach(
            post => {

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
                            name
                                .charAt(0)
                                .toUpperCase()
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


                feed.appendChild(
                    article
                );

            }
        );


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



/* =====================================================
   PROFILE POSTS
===================================================== */

async function loadProfilePosts() {

    if (
        !currentUser ||
        !currentProfile
    ) {

        return;

    }


    const container =
        document.getElementById(
            "profilePosts"
        );


    try {

        const {
            data,
            error
        } =
            await supabaseClient
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


        container.innerHTML =
            "";


        document.getElementById(
            "postCount"
        ).textContent =
            data?.length || 0;


        if (
            !data ||
            data.length === 0
        ) {

            container.innerHTML =
                `<div class="empty">
                    You haven't posted anything yet.
                </div>`;

            return;

        }


        data.forEach(
            post => {

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


                container.appendChild(
                    element
                );

            }
        );


    } catch (error) {

        console.error(
            "Profile posts:",
            error
        );

    }

}



/* =====================================================
   NAVIGATION
===================================================== */

document
    .querySelectorAll(
        "[data-page]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;


                    document
                        .querySelectorAll(
                            ".page"
                        )
                        .forEach(
                            section => {

                                section.classList
                                    .remove(
                                        "active"
                                    );

                            }
                        );


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
                        .querySelectorAll(
                            ".nav"
                        )
                        .forEach(
                            nav => {

                                nav.classList
                                    .remove(
                                        "active"
                                    );

                            }
                        );


                    document
                        .querySelectorAll(
                            `.nav[data-page="${page}"]`
                        )
                        .forEach(
                            nav => {

                                nav.classList.add(
                                    "active"
                                );

                            }
                        );

                }
            );

        }
    );



/* =====================================================
   POST BUTTONS
===================================================== */

document
    .getElementById(
        "sidebarPostButton"
    )
    .addEventListener(
        "click",
        () => {

            postInput.focus();

        }
    );


document
    .getElementById(
        "mobilePost"
    )
    .addEventListener(
        "click",
        () => {

            postInput.focus();

            postInput.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }
    );



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


if (
    localStorage.getItem(
        "connectx-dark"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

}



/* =====================================================
   SEARCH
===================================================== */

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

            results.innerHTML =
                "";

            return;

        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
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


            results.innerHTML =
                "";


            data.forEach(
                profile => {

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


                    results.appendChild(
                        div
                    );

                }
            );


        } catch (error) {

            console.error(
                "Search error:",
                error
            );

        }

    }
);



/* =====================================================
   SUGGESTIONS
===================================================== */

async function loadSuggestions() {

    const container =
        document.getElementById(
            "suggestions"
        );


    if (
        !container ||
        !currentUser
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
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


        container.innerHTML =
            "";


        data.forEach(
            profile => {

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


                container.appendChild(
                    div
                );

            }
        );


    } catch (error) {

        console.error(
            "Suggestions:",
            error
        );

    }

}



/* =====================================================
   AUTH STATE
===================================================== */

supabaseClient.auth.onAuthStateChange(
    async (
        event,
        session
    ) => {

        console.log(
            "Auth event:",
            event
        );


        if (session) {

            currentUser =
                session.user;


            await loadUser();

        } else {

            currentUser =
                null;

            currentProfile =
                null;


            showAuth();

        }

    }
);



/* =====================================================
   HELPERS
===================================================== */

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}



function formatDate(
    date
) {

    const d =
        new Date(date);


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {

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



function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}



/* =====================================================
   START
===================================================== */

async function startApp() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getSession();


        if (error) {

            console.error(
                "Session:",
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
            "Startup:",
            error
        );


        showAuth();

    }

}


startApp();
