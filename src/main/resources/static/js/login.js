function setupValidation(input, feedback, apiUrl, paramName, label) {
    try {
        let loaderInterval;
        let debounceTimer;

        const startLoader = () => {
            let dots = 0;
            clearInterval(loaderInterval);
            loaderInterval = setInterval(() => {
                dots = (dots + 1) % 4;
                feedback.textContent = "Comprobando" + ".".repeat(dots);
            }, 300);
        };

        const stopLoader = () => clearInterval(loaderInterval);

        input.addEventListener('input', () => {
            const value = input.value.trim();

            if (value.length === 0) {
                stopLoader();
                clearTimeout(debounceTimer);
                feedback.textContent = "";
                input.classList.remove('border-red-500', 'border-green-500');
                return;
            }

            if (value.length < 3) {
                feedback.textContent = "Mínimo 3 caracteres";
                feedback.className = "h-5 mt-1 text-xs text-gray-400 font-medium px-1";
                return;
            }

            clearTimeout(debounceTimer);
            feedback.textContent = "Comprobando";
            feedback.className = "h-5 mt-1 text-xs text-gray-500 font-medium px-1";

            debounceTimer = setTimeout(async () => {
                startLoader();
                try {
                    const response = await fetch(`${apiUrl}?${paramName}=${encodeURIComponent(value)}`);
                    const exists = await response.json();
                    stopLoader();

                    if (exists) {
                        feedback.textContent = `Este ${label} ya está en uso`;
                        feedback.className = "h-5 mt-1 text-xs text-red-500 font-medium px-1";
                        input.classList.replace('border-green-500', 'border-red-500') || input.classList.add('border-red-500');
                    } else {
                        feedback.textContent = `${label} disponible`;
                        feedback.className = "h-5 mt-1 text-xs text-green-500 font-medium px-1";
                        input.classList.replace('border-red-500', 'border-green-500') || input.classList.add('border-green-500');
                    }
                } catch (error) {
                    stopLoader();
                    feedback.textContent = "Error de conexión";
                    console.error(error);
                }
            }, 500);
        });
    } catch (ignore) { }
}

document.addEventListener('DOMContentLoaded', () => {
    setupValidation(
        document.getElementById('username'),
        document.getElementById('username-feedback'),
        '/api/check-username',
        'username',
        'nombre de usuario'
    );

    setupValidation(
        document.getElementById('email'),
        document.getElementById('email-feedback'),
        '/api/check-email',
        'email',
        'correo electrónico'
    );

    setUpRegister();
    setUpForgot();
});

function togglePassword(button) {
    const container = button.closest('.relative');
    const password = container.querySelector("input");
    const eyeShow = button.querySelector(".eye-show");
    const eyeHide = button.querySelector(".eye-hide");

    const isPassword = password.type === "password";
    password.type = isPassword ? "text" : "password";

    eyeShow.classList.toggle("hidden", isPassword);
    eyeHide.classList.toggle("hidden", !isPassword);
}

    function setUpRegister() {
        const pass = document.getElementById('password');
        const confirmPass = document.getElementById('confirmPassword');
    
        if (!confirmPass) return;
    
        confirmPass.addEventListener('input', () => {
            const feedback = document.getElementById('pass-match-feedback');
            if (pass.value !== confirmPass.value) {
                confirmPass.classList.add('border-red-500');
                feedback.textContent = "Las contraseñas no coinciden";
                feedback.className = "h-5 text-xs mt-1 px-1 font-medium text-red-500";
            } else {
                confirmPass.classList.replace('border-red-500', 'border-green-500');
                feedback.textContent = "Coinciden";
                feedback.className = "h-5 text-xs mt-1 px-1 font-medium text-green-500";
            }
        });
    
        pass.addEventListener('input', () => {
            const feedback = document.getElementById('pass-match-feedback');
            if (pass.value !== confirmPass.value) {
                confirmPass.classList.add('border-red-500');
                feedback.textContent = "Las contraseñas no coinciden";
                feedback.className = "h-5 text-xs mt-1 px-1 font-medium text-red-500";
            } else {
                confirmPass.classList.replace('border-red-500', 'border-green-500');
                feedback.textContent = "Coinciden";
                feedback.className = "h-5 text-xs mt-1 px-1 font-medium text-green-500";
            }
        });
    
        const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.]).{8,}$/;
        pass.addEventListener('input', () => {
            const feedback = document.getElementById('pass-complexity-feedback');
            if (!passwordRegex.test(pass.value)) {
                feedback.textContent = "Debe incluir mayúscula, número y símbolo";
                feedback.className = "h-5 text-xs mt-1 px-1 font-medium text-amber-500";
            } else {
                feedback.textContent = "Contraseña segura";
                feedback.className = "h-5 text-xs mt-1 px-1 font-medium text-green-500";
            }
        });
    
        document.getElementById('registro-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
    
            try {
                const csrfToken = document.querySelector('meta[name="_csrf"]').content;
                const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
    
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        [csrfHeader]: csrfToken
                    },
                    body: formData
                });
    
                if (response.status === 201) {
                    window.location.href = '/login?registered';
                }
                else if (response.status === 400 || response.status === 409) {
                    const errorMsg = await response.text();
    
                    const alertBox = document.getElementById('register-alert');
                    alertBox.textContent = errorMsg;
                    alertBox.classList.remove('hidden');
                    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } catch (error) {
                console.error("Fallo de red", error);
            }
        });
    }

function setUpForgot() {
    try {
        const forgotForm = document.getElementById('forgot-form');
        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const alertBox = document.getElementById('forgot-alert');
                const csrfToken = document.querySelector('meta[name="_csrf"]').content;
                const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
                const formData = new FormData(e.target);

                try {
                    const response = await fetch(`/api/forgot-password`, {
                        method: 'POST',
                        body: formData,
                        headers: { [csrfHeader]: csrfToken }
                    });

                    const msg = await response.text();
                    alertBox.textContent = msg;
                    alertBox.classList.remove('hidden');

                    if (response.ok) {
                        alertBox.className = "mx-8 mb-4 p-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl text-sm text-center font-medium";
                        forgotForm.reset();
                    } else {
                        alertBox.className = "mx-8 mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm text-center font-medium";
                    }
                } catch (error) {
                    console.error("Error:", error);
                }
            });
        }
    } catch (ignore) { }
}