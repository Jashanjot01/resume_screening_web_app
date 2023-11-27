document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('passwordResetForm');

    resetForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;

        try {
            const response = await fetch('http://localhost:3000/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                alert('If your email is registered, you will receive a password reset link.');
                // Optionally redirect user to login page or show a message
            } else {
                console.error('Failed to send reset link');
                // Handle errors, like showing a message to the user
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
});

