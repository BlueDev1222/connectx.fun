// ============================================================
// CONNECTX SUPABASE CONFIGURATION
// ============================================================
//
// Get these from:
// Supabase Dashboard
// → Project Settings
// → API
//
// IMPORTANT:
// Use the publishable/anon client key here.
// NEVER put a service_role/secret key in this file.
// ============================================================

const SUPABASE_URL = "onvmeffhmruzshqlwakx";

const SUPABASE_KEY = "sb_publishable_9VzEW8DurRpM51GgQ282BQ_qQ3e1WkX";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ============================================================
// LOGIN
// ============================================================

const loginButton = document.getElementById("loginButton");

if (loginButton) {

    loginButton.addEventListener("click", async () => {

        loginButton.disabled = true;

        loginButton.textContent = "Connecting...";

        const { data, error } =
            await supabaseClient.auth.signInWithOAuth({

                provider: "azure",

                options: {

                    scopes: "email",

                    redirectTo:
                        window.location.origin +
                        "/dashboard.html"
                }
            });

        if (error) {

            console.error(error);

            const errorMessage =
                document.getElementById("errorMessage");

            if (errorMessage) {
                errorMessage.textContent =
                    error.message;
            }

            loginButton.disabled = false;

            loginButton.textContent =
                "Continue with Microsoft";
        }

    });

}


// ============================================================
// DASHBOARD REDIRECT
// ============================================================

async function checkAuthentication() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    const currentPage =
        window.location.pathname;

    const isDashboard =
        currentPage.includes("dashboard");

    const isProfile =
        currentPage.includes("profile");

    if (!session && (isDashboard || isProfile)) {

        window.location.href = "index.html";

        return null;
    }

    return session;
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href = "index.html";
}


// ============================================================
// AUTH STATE
// ============================================================

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "ConnectX auth:",
            event
        );

    }
);
