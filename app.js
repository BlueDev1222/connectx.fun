const SUPABASE_URL =
    "https://onvmeffhmruzshqlwakx.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9VzEW8DurRpM51GgQ282BQ_qQ3e1WkX";

const { createClient } =
    supabase;

const client =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/*
============================================================
AUTH PAGE
============================================================
*/

const loginForm =
    document.getElementById("loginForm");

const signupForm =
    document.getElementById("signupForm");

const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");

const message =
    document.getElementById("message");


function showMessage(text, error = false) {

    if (!message) return;

    message.textContent = text;

    message.style.color =
        error
            ? "#ff7070"
            : "#8d93a3";
}


if (loginTab) {

    loginTab.addEventListener("click", () => {

        loginTab.classList.add("active");
        signupTab.classList.remove("active");

        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");

        showMessage("");

    });

}


if (signupTab) {

    signupTab.addEventListener("click", () => {

        signupTab.classList.add("active");
        loginTab.classList.remove("active");

        signupForm.classList.remove("hidden");
        loginForm.classList.add("hidden");

        showMessage("");

    });

}


/*
============================================================
LOGIN
============================================================
*/

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        showMessage("Logging in...");

        const { error } =
            await client.auth.signInWithPassword({
                email,
                password
            });

        if (error) {

            showMessage(
                error.message,
                true
            );

            return;
        }

        window.location.href =
            "dashboard.html";

    });

}


/*
============================================================
SIGN UP
============================================================
*/

if (signupForm) {

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const username =
            document
                .getElementById("signupUsername")
                .value
                .trim();

        const email =
            document
                .getElementById("signupEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("signupPassword")
                .value;

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {

            showMessage(
                "Username can only contain letters, numbers, and underscores.",
                true
            );

            return;
        }

        showMessage("Creating your ConnectX account...");

        const { data, error } =
            await client.auth.signUp({

                email,
                password,

                options: {

                    data: {
                        username: username,
                        display_name: username
                    }

                }

            });

        if (error) {

            showMessage(
                error.message,
                true
            );

            return;
        }

        /*
        Supabase may require email confirmation.
        */

        if (!data.session) {

            showMessage(
                "Account created! Check your email to verify your account."
            );

            return;
        }

        window.location.href =
            "dashboard.html";

    });

}


/*
============================================================
DASHBOARD
============================================================
*/

async function loadDashboard() {

    const {
        data: {
            session
        }
    } = await client.auth.getSession();


    if (!session) {

        window.location.href =
            "index.html";

        return;
    }


    const user =
        session.user;


    const {
        data: profile,
        error
    } = await client
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (error) {

        console.error(error);

        return;
    }


    const username =
        profile.username ||
        profile.display_name ||
        "Player";


    const avatar =
        profile.minecraft_username
            ? `https://mc-heads.net/avatar/${encodeURIComponent(profile.minecraft_username)}/96`
            : "https://mc-heads.net/avatar/Steve/96";


    const topAvatar =
        document.getElementById("topAvatar");

    const profileAvatar =
        document.getElementById("profileAvatar");


    if (topAvatar)
        topAvatar.src = avatar;

    if (profileAvatar)
        profileAvatar.src = avatar;


    const elements = {

        topUsername:
            document.getElementById("topUsername"),

        welcomeUsername:
            document.getElementById("welcomeUsername"),

        profileUsername:
            document.getElementById("profileUsername"),

        profileBio:
            document.getElementById("profileBio")

    };


    if (elements.topUsername)
        elements.topUsername.textContent =
            username;

    if (elements.welcomeUsername)
        elements.welcomeUsername.textContent =
            username;

    if (elements.profileUsername)
        elements.profileUsername.textContent =
            username;

    if (elements.profileBio)
        elements.profileBio.textContent =
            profile.bio ||
            "Welcome to ConnectX!";

}


if (
    window.location.pathname.endsWith(
        "dashboard.html"
    )
) {

    loadDashboard();

}


/*
============================================================
LOGOUT
============================================================
*/

const logoutButton =
    document.getElementById("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        await client.auth.signOut();

        window.location.href =
            "index.html";

    });

}


/*
============================================================
AUTH STATE
============================================================
*/

client.auth.onAuthStateChange(
    (event, session) => {

        if (
            event === "SIGNED_OUT" &&
            window.location.pathname.endsWith(
                "dashboard.html"
            )
        ) {

            window.location.href =
                "index.html";

        }

    }
);
